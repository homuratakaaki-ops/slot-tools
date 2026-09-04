const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const calcHtml = fs.readFileSync(path.join(root, 'yutime-calc.html'), 'utf8');
const v3Html = fs.readFileSync(path.join(root, 'yutime-v3.html'), 'utf8');

function sectionOf(source, label, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `${label}: ${startMarker} not found`);
  const end = source.indexOf(endMarker, start);
  assert.notEqual(end, -1, `${label}: ${endMarker} not found after ${startMarker}`);
  return source.slice(start, end);
}

// --- 1. エンジンの二重管理を防ぐ一致テスト ---------------------------------
// yutime-calc.html は yutime-v3.html の期待値エンジンをインラインで持つ。
// 片方だけ更新されたらここで落ちる。

const calcEngine = sectionOf(calcHtml, 'yutime-calc.html', 'const YUTIME_EXPECTATION_ENGINE', 'window.YutimeExpectationEngine');
const v3Engine = sectionOf(v3Html, 'yutime-v3.html', 'const YUTIME_EXPECTATION_ENGINE', 'window.YutimeExpectationEngine');
assert.equal(calcEngine, v3Engine, 'yutime-calc.html と yutime-v3.html の期待値エンジンは完全一致していること');

// エンジンが外側から受け取る唯一の定数も同じ行であること
// S11: 定数は「1Rあたりの実質出玉（玉/R）」。当選あたりの玉数ではない
const DEFAULT_NET_BALLS_LINE = '    const DEFAULT_NET_BALLS_PER_ROUND = 140;\n';
assert.ok(calcHtml.includes(DEFAULT_NET_BALLS_LINE), 'yutime-calc.html の DEFAULT_NET_BALLS_PER_ROUND が v3 と同じ行であること');
assert.ok(v3Html.includes(DEFAULT_NET_BALLS_LINE), 'yutime-v3.html の DEFAULT_NET_BALLS_PER_ROUND が想定どおりであること');
assert.doesNotMatch(calcHtml, /DEFAULT_NET_BALLS_PER_WIN/, '当選あたりの定数名は残さないこと');
assert.doesNotMatch(v3Html, /DEFAULT_NET_BALLS_PER_WIN/, '当選あたりの定数名は残さないこと');

// --- 2. ページ側ロジックを vm で実行する ------------------------------------

const presetBlock = sectionOf(calcHtml, 'yutime-calc.html', 'const HOURLY_THRESHOLD_YEN', 'const byId =');
const logicBlock = sectionOf(calcHtml, 'yutime-calc.html', 'const state = {', 'function chipHtml');
const urlBlock = sectionOf(calcHtml, 'yutime-calc.html', 'function presetIdFromUrl', 'function inIframe');

const context = vm.createContext({ URLSearchParams, window: { location: { search: '' } } });
vm.runInContext([
  '    const DEFAULT_NET_BALLS_PER_ROUND = 140;',
  calcEngine,
  presetBlock,
  logicBlock,
  urlBlock,
  'globalThis.api = { state, PRESETS, YUTIME_EXPECTATION_ENGINE, currentPreset, counterOffset, engineSpinFromCounter, remainingSpins, numberOrNull, yenText, hourText, evJudgment, basisText, missingMessage, calculateFromState, presetIdFromUrl };'
].join('\n'), context);
const api = context.api;

function evaluate({ presetId, currentSpin, rotationRate, payout, exchangeBalls = 25, ballKind = 'cash' }) {
  Object.assign(api.state, { presetId, currentSpin, rotationRate, payout, exchangeBalls, ballKind });
  return api.calculateFromState();
}

function evYenOf(input) {
  const { result } = evaluate(input);
  assert.ok(result, `結果が得られること: ${JSON.stringify(input)}`);
  return Math.round(result.evYen);
}

// --- 3. カウンター基準 → エンジン内部回転数の対応 ---------------------------
// アグネスPEはカウンター250回転で遊タイム、エンジンの天井は内部低確239回転。
// 差の11回転をカウンター値から引いて渡す。大海5SPは差0。

// ずれの数値は共有エンジンのプリセットだけが持つ。ページ側に書かない（二重管理の防止）
assert.match(calcEngine, /counterOffset: 11,/, 'agnes-pe の counterOffset はエンジンブロック側に置くこと');
assert.match(calcEngine, /counterOffset: 0,/, 'umi-sp5 の counterOffset はエンジンブロック側に置くこと');
assert.match(logicBlock, /return Math\.max\(0, Number\(enginePresetFor\(preset\)\.spec\.counterOffset\) \|\| 0\);/, 'ページ側はエンジンの counterOffset を参照すること');
assert.doesNotMatch(logicBlock, /counterOffset: \d/, 'ページ側のプリセットにずれの数値を持たせないこと');

assert.equal(api.counterOffset(api.PRESETS[0]), 11, 'agnes-pe はカウンター250 − 内部239 = 11 のずれを持つ');
assert.equal(api.counterOffset(api.PRESETS[1]), 0, 'umi-sp5 はカウンターと内部天井が一致する');
assert.equal(api.engineSpinFromCounter(api.PRESETS[0], 150), 139);
assert.equal(api.engineSpinFromCounter(api.PRESETS[0], 0), 0, 'ラムクリア後0回転は内部239回転として扱う');
assert.equal(api.engineSpinFromCounter(api.PRESETS[1], 434), 434);
assert.equal(api.remainingSpins(api.PRESETS[0], 150), 100, 'カウンター150は遊タイムまで残り100回転');
assert.equal(api.remainingSpins(api.PRESETS[0], 0), 239);
assert.equal(api.remainingSpins(api.PRESETS[0], 200), 50);
assert.equal(api.remainingSpins(api.PRESETS[1], 434), 516);

// --- 4. 受け入れ基準（記事v5と一致すること） --------------------------------

assert.equal(
  evYenOf({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: 100 }),
  1569,
  'アグネスPE・カウンター150・回転率17・1R実質100玉・等価・現金 → +1,569円'
);
assert.equal(
  evYenOf({ presetId: 'agnes-pe', currentSpin: 0, rotationRate: 17, payout: 105 }),
  310,
  'アグネスPE・カウンター0・回転率17・1R実質105玉・等価・現金 → +310円'
);

// 大海5SPは holdSpins=5（残保留込み）の現行値。−454円は holdSpins=0 時代の値なので採らない。
const umiCase = { presetId: 'umi-sp5', currentSpin: 434, rotationRate: 17, payout: 1400, exchangeBalls: 28 };
assert.equal(evYenOf(umiCase), -231, '大海5SP・434回転・回転率17・純払い出し1400・28玉・現金 → holdSpins=5 の値');

// エンジンを直接叩いた値と、ページ経由の値が一致すること（大海5SPはずれ0なので素通し）
const umiDirect = api.YUTIME_EXPECTATION_ENGINE.calculate(
  { presetId: 'umi-sp5', currentSpin: 434, rotationRate: 17, availableBalls: 0 },
  { ...api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults, presetId: 'umi-sp5', netBallsPerWin: 140, yenPerBall: 100 / 28 }
);
assert.equal(Math.round(umiDirect.evYen), evYenOf(umiCase), '大海5SPはカウンター値をそのままエンジンに渡す');
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults.holdSpins, 5, 'agnes-pe の残保留既定は5');
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults.holdSpins, 5, 'umi-sp5 の残保留既定は5');

// --- 5. 記事の期待値表を全点で再現すること ----------------------------------
// article-agnespe.md / agnespe-yutime.html の3表（1R実質105/100/90玉 × カウンター6点 × 回転率5点）。

const ARTICLE_RATES = [14, 15, 16, 17, 18];
const ARTICLE_TABLES = {
  105: { 0: [-836, -403, -24, 310, 607], 30: [-706, -282, 89, 416, 706], 55: [-493, -84, 274, 589, 870], 105: [134, 499, 818, 1100, 1351], 150: [1041, 1343, 1607, 1840, 2047], 200: [2671, 2859, 3023, 3168, 3297] },
  100: { 0: [-1106, -673, -295, 39, 336], 30: [-977, -553, -182, 145, 436], 55: [-763, -355, 3, 319, 599], 105: [-137, 228, 548, 830, 1080], 150: [771, 1072, 1336, 1569, 1776], 200: [2400, 2588, 2752, 2898, 3027] },
  90: { 0: [-1648, -1215, -836, -502, -205], 30: [-1518, -1094, -723, -396, -106], 55: [-1305, -896, -538, -223, 58], 105: [-678, -313, 6, 288, 539], 150: [229, 531, 795, 1028, 1235], 200: [1858, 2047, 2211, 2356, 2485] }
};
for (const [payout, rows] of Object.entries(ARTICLE_TABLES)) {
  for (const [counterSpin, expected] of Object.entries(rows)) {
    ARTICLE_RATES.forEach((rotationRate, index) => {
      const actual = evYenOf({ presetId: 'agnes-pe', currentSpin: Number(counterSpin), rotationRate, payout: Number(payout) });
      assert.ok(
        Math.abs(actual - expected[index]) <= 1,
        `記事表 1R${payout}玉 / カウンター${counterSpin} / 回転率${rotationRate}: expected ${expected[index]}, got ${actual}`
      );
    });
  }
}

// --- 6. 出玉入力の機種別変換 ------------------------------------------------

assert.equal(api.PRESETS[0].id, 'agnes-pe');
assert.equal(api.PRESETS[0].payoutLabel, '1R実質出玉（電サポ中の減り込み）');
assert.equal(api.PRESETS[0].payoutDefault, 100);
assert.equal(JSON.stringify(Array.from(api.PRESETS[0].payoutChips)), '[105,100,90]');
// S11: エンジンが玉/R を受けるようになったので、1R実質出玉の入力は変換せずそのまま渡す
assert.equal(api.PRESETS[0].netBallsPerWin(100), 100, 'agnes-pe は入力値（玉/R）をそのまま使う');
assert.equal(api.PRESETS[0].netBallsPerWin(105), 105);
assert.equal(api.PRESETS[1].id, 'umi-sp5');
assert.equal(api.PRESETS[1].payoutLabel, '1回の当りあたり純払い出し');
assert.equal(api.PRESETS[1].payoutDefault, 1400);
assert.equal(JSON.stringify(Array.from(api.PRESETS[1].payoutChips)), '[]');
// umi-sp5 の入力欄は当選あたりの純払い出しのままなので、平均R数（10R）で割って玉/Rにする
assert.equal(api.PRESETS[1].netBallsPerWin(1400), 140, 'umi-sp5 は当選あたりの入力を平均R数で割る');
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].spec.averageRoundsPerWin, 10);
assert.ok(Math.abs(api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].spec.averageRoundsPerWin - 587.5 / 108) < 1e-12);
// 玉/R × 平均R数 は旧 netBallsPerWin と完全に一致する（代表点が動かない根拠）
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults.netBallsPerWin * api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].spec.averageRoundsPerWin, 587.5);
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults.netBallsPerWin * api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].spec.averageRoundsPerWin, 1400);
assert.match(calcHtml, /byId\("payoutLabel"\)\.textContent = preset\.payoutLabel;/, '機種切替でラベルが差し替わること');
assert.match(calcHtml, /payoutInput\.placeholder = String\(preset\.payoutDefault\);/, '機種切替で既定値が差し替わること');

// --- 7. 交換率・玉の種類が期待値に反映されること ----------------------------

const baseCase = { presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: 100 };
const equalCash = evYenOf({ ...baseCase, exchangeBalls: 25, ballKind: 'cash' });
const lowExchangeCash = evYenOf({ ...baseCase, exchangeBalls: 28, ballKind: 'cash' });
assert.notEqual(equalCash, lowExchangeCash, '交換率を変えると期待値が変わること');
assert.ok(lowExchangeCash < equalCash, '非等価のほうが期待値は下がること');
assert.equal(
  evYenOf({ ...baseCase, exchangeBalls: 25, ballKind: 'mochidama' }),
  equalCash,
  '等価では現金と持ち玉で期待値は変わらない'
);
const lowExchangeMochidama = evYenOf({ ...baseCase, exchangeBalls: 28, ballKind: 'mochidama' });
assert.ok(lowExchangeMochidama > lowExchangeCash, '非等価では持ち玉のほうが期待値は高いこと');

// --- 8. 判定ラベルは時給2,400円基準 -----------------------------------------

assert.equal(api.evJudgment(null).label, '—');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: 2400, evYen: 2400 }).label, '打てる');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: 2399, evYen: 2399 }).label, '微妙');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: -100, evYen: -100 }).label, '打てない');
assert.ok(calcHtml.includes('<div class="threshold">判定基準：時給2,400円以上で打てる</div>'), '判定基準を常時表示すること');
assert.match(api.basisText(evaluate(baseCase).result), /通常時250回転\/h想定/);
assert.match(api.basisText(evaluate(baseCase).result), /機械割 .+% ＝ 期待値÷投資額\+100%/);
assert.match(api.basisText(evaluate(baseCase).result), /消化時間 .+h（通常.+h＋当選.+h＋電サポ.+h）/);

// --- 9. 未入力・不正値でクラッシュしないこと --------------------------------

const emptyInput = evaluate({ presetId: 'agnes-pe', currentSpin: null, rotationRate: null, payout: null });
assert.equal(emptyInput.result, null);
assert.equal(emptyInput.missing, '現在回転数を入力してください');
assert.equal(evaluate({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: null, payout: 100 }).missing, '回転率を入力してください');
assert.equal(evaluate({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: null }).missing, '出玉を入力してください');
assert.equal(evaluate({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: 0, payout: 100 }).missing, '回転率を入力してください');
assert.equal(evaluate({ presetId: 'agnes-pe', currentSpin: -5, rotationRate: 17, payout: 100 }).missing, '現在回転数を入力してください');
assert.equal(api.yenText(null), '—');
assert.equal(api.hourText(null), '—');
assert.equal(api.numberOrNull(''), null);
assert.equal(api.numberOrNull('abc'), null);
assert.equal(api.numberOrNull('17.5'), 17.5);

// --- 10. URLパラメータ ------------------------------------------------------

context.window.location.search = '?m=umi-sp5';
assert.equal(api.presetIdFromUrl(), 'umi-sp5');
context.window.location.search = '?m=agnes-pe';
assert.equal(api.presetIdFromUrl(), 'agnes-pe');
context.window.location.search = '?m=nonexistent';
assert.equal(api.presetIdFromUrl(), 'agnes-pe', '不正値はアグネスPEにフォールバック');
context.window.location.search = '';
assert.equal(api.presetIdFromUrl(), 'agnes-pe', '未指定はアグネスPE');

// --- 11. 埋め込み前提の静的条件 ---------------------------------------------

assert.doesNotMatch(calcHtml, /localStorage/, 'yutime-calc.html は localStorage を使わないこと');
assert.doesNotMatch(calcHtml, /sessionStorage/, 'yutime-calc.html は sessionStorage を使わないこと');
assert.doesNotMatch(calcHtml, /<script[^>]+src=/, '外部スクリプトに依存しないこと');
assert.doesNotMatch(calcHtml, /<link[^>]+stylesheet/, '外部スタイルシートに依存しないこと');
for (const href of ['https://slot-tools.jp/agnespe-yutime.html', 'https://slot-tools.jp/yutime-v3.html', 'https://slot-tools.jp/']) {
  const anchor = new RegExp(`<a href="${href.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}" target="_blank" rel="noopener">`);
  assert.match(calcHtml, anchor, `${href} は別タブで開くこと`);
}
assert.match(calcHtml, /埋め込み・転載は自由です。出典として/, '転載条件を明記すること');
assert.match(calcHtml, /width="100%" height="700" style="border:0" loading="lazy"/, '埋め込み用コードを掲載すること');
assert.match(calcHtml, /if \(inIframe\(\)\) byId\("embedSection"\)\.style\.display = "none";/, 'iframe内では埋め込み用コードを隠すこと');

console.log('yutime-calc: OK');

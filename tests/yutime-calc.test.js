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
  'globalThis.api = { state, PRESETS, MODE_OPTIONS, SPEED_OPTIONS, MINUTES_OPTIONS, DEFAULT_SPEED, DEFAULT_MINUTES, CONTINUOUS_TRIALS, CONTINUOUS_SEED, BREAKEVEN_STEP_MINUTES, BREAKEVEN_MAX_MINUTES, YUTIME_EXPECTATION_ENGINE, currentPreset, counterOffset, engineSpinFromCounter, remainingSpins, numberOrNull, yenText, hourText, evJudgment, basisText, missingMessage, availableBallsFromState, calculateFromState, presetIdFromUrl, ballsFromUrl, modeFromUrl, minutesFromUrl, speedFromUrl, supportsContinuous, breakevenCheckpoints, simulateContinuous, continuousConfigFromState, continuousFromState, continuousMissingMessage, countText, exitsText, seatMinutesText, restartBreakevenText, currentBreakevenText, continuousBasisText, cycleBreakevenMinutes };'
].join('\n'), context);
const api = context.api;

// 同じソースを vm 抜きでも読み込む。vm.Context 内はモンテカルロが10倍以上遅く、
// 試行数を要する整合テスト（§3-1〜3）が現実的な時間で回らないため。
const fastApi = new Function('window', 'URLSearchParams', [
  '    const DEFAULT_NET_BALLS_PER_ROUND = 140;',
  calcEngine,
  presetBlock,
  logicBlock,
  urlBlock,
  'return { state, PRESETS, YUTIME_EXPECTATION_ENGINE, engineSpinFromCounter, simulateContinuous, continuousConfigFromState, continuousFromState, cycleBreakevenMinutes };'
].join('\n'))({ location: { search: '' } }, URLSearchParams);

function evaluate({ presetId, currentSpin, rotationRate, payout, exchangeBalls = 25, ballKind = 'cash', mochidamaBalls = null }) {
  Object.assign(api.state, { presetId, currentSpin, rotationRate, payout, exchangeBalls, ballKind, mochidamaBalls });
  return api.calculateFromState();
}

function evYenOf(input) {
  const { result } = evaluate(input);
  assert.ok(result, `結果が得られること: ${JSON.stringify(input)}`);
  return Math.round(result.evYen);
}

// --- 3. カウンター基準 → エンジン内部回転数の対応 ---------------------------
// アグネスPEはカウンター249回転で遊タイム、エンジンの天井は内部低確239回転（+ST10）。
// 差の10回転をカウンター値から引いて渡す。大海5SPは差0。

// ずれの数値は共有エンジンのプリセットだけが持つ。ページ側に書かない（二重管理の防止）
assert.match(calcEngine, /counterOffset: 10,/, 'agnes-pe の counterOffset はエンジンブロック側に置くこと');
assert.match(calcEngine, /counterOffset: 0,/, 'umi-sp5 の counterOffset はエンジンブロック側に置くこと');
assert.match(logicBlock, /return Math\.max\(0, Number\(enginePresetFor\(preset\)\.spec\.counterOffset\) \|\| 0\);/, 'ページ側はエンジンの counterOffset を参照すること');
assert.doesNotMatch(logicBlock, /counterOffset: \d/, 'ページ側のプリセットにずれの数値を持たせないこと');

assert.equal(api.counterOffset(api.PRESETS[0]), 10, 'agnes-pe はカウンター249 − 内部239 = 10 のずれを持つ');
assert.equal(api.counterOffset(api.PRESETS[1]), 0, 'umi-sp5 はカウンターと内部天井が一致する');
assert.equal(api.engineSpinFromCounter(api.PRESETS[0], 150), 140);
assert.equal(api.engineSpinFromCounter(api.PRESETS[0], 0), 0, 'ラムクリア後0回転は内部239回転として扱う');
assert.equal(api.engineSpinFromCounter(api.PRESETS[1], 434), 434);
assert.equal(api.remainingSpins(api.PRESETS[0], 150), 99, 'カウンター150は遊タイムまで残り99回転');
assert.equal(api.remainingSpins(api.PRESETS[0], 0), 239);
assert.equal(api.remainingSpins(api.PRESETS[0], 200), 49);
assert.equal(api.remainingSpins(api.PRESETS[0], 249), 0, 'カウンター249で遊タイム突入（残り0）');
assert.equal(api.remainingSpins(api.PRESETS[1], 434), 516);

// --- 4. 受け入れ基準 --------------------------------------------------------
// 9/7実測で遊タイム突入をカウンター249に修正した。記事v5の +1,569円 は突入250前提の値。

assert.equal(
  evYenOf({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: 100 }),
  1590,
  'アグネスPE・カウンター150・回転率17・1R実質100玉・等価・現金 → +1,590円'
);
assert.equal(
  evYenOf({ presetId: 'agnes-pe', currentSpin: 0, rotationRate: 17, payout: 105 }),
  310,
  'アグネスPE・カウンター0・回転率17・1R実質105玉・等価・現金 → +310円'
);

// 大海5SPは holdSpins=5（残保留込み）の現行値。−454円は遊タイム玉減り -0.3（B80）が入る前の値なので採らない。
const umiCase = { presetId: 'umi-sp5', currentSpin: 434, rotationRate: 17, payout: 1400, exchangeBalls: 28 };
assert.equal(evYenOf(umiCase), -231, '大海5SP・434回転・回転率17・純払い出し1400・28玉・現金 → holdSpins=5 の値');

// 記事初出の −454円 は holdSpins ではなく遊タイム玉減りの差。当時と同じ
// yutimeBallsPerSpin=0 / holdSpins=0 で呼べば現行エンジンでも再現する（回帰点として固定）。
const umiEngineCase = (overrides) => api.YUTIME_EXPECTATION_ENGINE.calculate(
  { presetId: 'umi-sp5', currentSpin: 434, rotationRate: 17, availableBalls: 0 },
  { ...api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults, presetId: 'umi-sp5', netBallsPerWin: 140, yenPerBall: 100 / 28, holdSpins: 0, ...overrides }
);
const umiLegacyReference = umiEngineCase({ yutimeBallsPerSpin: 0 });
const umiHoldZero = umiEngineCase({});
assert.equal(Math.round(umiLegacyReference.evYen), -454, '大海5SP・434回転・17・28玉・残保留0・遊タイム玉減り0 → 記事初出の -454円');
assert.equal(Math.round(umiHoldZero.evYen), -499, '遊タイム玉減り -0.3 の現行既定・残保留0 では -499円');
// 45円の差は遊タイム回転ぶんの玉減りだけ（42.25回転 × 0.3玉）
assert.ok(
  Math.abs((umiLegacyReference.winBalls - umiHoldZero.winBalls) - umiHoldZero.expectedYutimeSpins * 0.3) < 1e-9,
  '-454 と -499 の差は遊タイム回転 × 0.3玉ぶんだけであること'
);
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults.yutimeBallsPerSpin, -0.3, '大海5SPの遊タイム玉減り既定は -0.3');

// エンジンを直接叩いた値と、ページ経由の値が一致すること（大海5SPはずれ0なので素通し）
const umiDirect = api.YUTIME_EXPECTATION_ENGINE.calculate(
  { presetId: 'umi-sp5', currentSpin: 434, rotationRate: 17, availableBalls: 0 },
  { ...api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults, presetId: 'umi-sp5', netBallsPerWin: 140, yenPerBall: 100 / 28 }
);
assert.equal(Math.round(umiDirect.evYen), evYenOf(umiCase), '大海5SPはカウンター値をそのままエンジンに渡す');
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults.holdSpins, 5, 'agnes-pe の残保留既定は5');
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['umi-sp5'].defaults.holdSpins, 5, 'umi-sp5 の残保留既定は5');

// --- 5. 期待値表を全点で固定すること ----------------------------------------
// article-agnespe.md / agnespe-yutime.html の3表（1R実質105/100/90玉 × カウンター6点 × 回転率5点）。
// 突入249への修正でカウンター基準の行が1回転ぶんずれるため、記事側は本表で更新する。

const ARTICLE_RATES = [14, 15, 16, 17, 18];
const ARTICLE_TABLES = {
  105: { 0: [-836, -403, -24, 310, 607], 30: [-698, -275, 95, 422, 712], 55: [-483, -75, 282, 597, 877], 105: [150, 514, 832, 1113, 1363], 150: [1066, 1366, 1629, 1861, 2066], 200: [2712, 2897, 3059, 3202, 3329] },
  100: { 0: [-1106, -673, -295, 39, 336], 30: [-969, -546, -176, 151, 442], 55: [-754, -346, 12, 327, 607], 105: [-121, 243, 562, 843, 1092], 150: [796, 1096, 1358, 1590, 1796], 200: [2442, 2627, 2789, 2932, 3059] },
  90: { 0: [-1648, -1215, -836, -502, -205], 30: [-1510, -1087, -717, -390, -100], 55: [-1295, -887, -530, -215, 65], 105: [-662, -298, 20, 301, 551], 150: [254, 554, 817, 1049, 1254], 200: [1900, 2085, 2247, 2390, 2517] }
};
for (const [payout, rows] of Object.entries(ARTICLE_TABLES)) {
  for (const [counterSpin, expected] of Object.entries(rows)) {
    ARTICLE_RATES.forEach((rotationRate, index) => {
      const actual = evYenOf({ presetId: 'agnes-pe', currentSpin: Number(counterSpin), rotationRate, payout: Number(payout) });
      assert.ok(
        Math.abs(actual - expected[index]) <= 1,
        `期待値表 1R${payout}玉 / カウンター${counterSpin} / 回転率${rotationRate}: expected ${expected[index]}, got ${actual}`
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
// S18: アグネスPEの既定は記事v5と同じ実戦基準の100玉/R。公称払い出し（648÷6＝108）ではない。
// averageRoundsPerWin は当選あたりの平均R数（R構成の重み）なので 587.5/108 のまま動かさない。
assert.equal(api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults.netBallsPerWin, 100);
assert.equal(api.PRESETS[0].payoutDefault, api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults.netBallsPerWin, 'calc の既定値とエンジンの既定値がそろっていること');
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
  evYenOf({ ...baseCase, exchangeBalls: 25, ballKind: 'mochidama', mochidamaBalls: 3000 }),
  equalCash,
  '等価では現金と持ち玉で期待値は変わらない'
);
const lowExchangeMochidama = evYenOf({ ...baseCase, exchangeBalls: 28, ballKind: 'mochidama', mochidamaBalls: 3000 });
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
assert.match(calcHtml, /埋め込み: 自由です。クレジットはツール内に含まれます。/, '埋め込みには追加の条件を付けないこと');
assert.match(calcHtml, /転載・引用: 自由です。出典として/, '転載・引用には出典リンクを求めること');
assert.match(calcHtml, /width="100%" height="700" style="border:0" loading="lazy"/, '埋め込み用コードを掲載すること');
assert.match(calcHtml, /if \(inIframe\(\)\) byId\("embedSection"\)\.style\.display = "none";/, 'iframe内では埋め込み用コードを隠すこと');

// --- 12. 持ち玉数の入力（S13） ------------------------------------------------

const s13Settings = {
  ...api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults,
  presetId: 'agnes-pe',
  netBallsPerWin: api.PRESETS[0].netBallsPerWin(100),
  yenPerBall: 100 / 28
};
const s13PageCase = evaluate({
  presetId: 'agnes-pe',
  currentSpin: 150,
  rotationRate: 17,
  payout: 100,
  exchangeBalls: 28,
  ballKind: 'mochidama',
  mochidamaBalls: 3000
}).result;
const s13DirectCase = api.YUTIME_EXPECTATION_ENGINE.calculate({
  presetId: 'agnes-pe',
  currentSpin: api.engineSpinFromCounter(api.PRESETS[0], 150),
  rotationRate: 17,
  availableBalls: 3000
}, s13Settings);
assert.equal(Math.round(s13PageCase.evYen), Math.round(s13DirectCase.evYen), '持ち玉3000玉のページ経由計算がエンジン直叩きと一致すること');
assert.equal(
  evYenOf({ ...baseCase, exchangeBalls: 28, ballKind: 'mochidama', mochidamaBalls: null }),
  lowExchangeCash,
  '持ち玉で打つ＋空欄は現金と同じ期待値になること'
);

Object.assign(api.state, { ballKind: 'cash', mochidamaBalls: 3000 });
assert.equal(api.availableBallsFromState(), 0, '現金選択時は持ち玉入力値があっても0');
Object.assign(api.state, { ballKind: 'mochidama', mochidamaBalls: null });
assert.equal(api.availableBallsFromState(), 0, '持ち玉空欄は0');
Object.assign(api.state, { ballKind: 'mochidama', mochidamaBalls: 3000 });
assert.equal(api.availableBallsFromState(), 3000, '持ち玉3000は3000');

context.window.location.search = '?balls=3000';
assert.equal(api.ballsFromUrl(), 3000, '?balls=3000 は3000');
for (const search of ['?balls=abc', '?balls=-5', '?balls=0', '']) {
  context.window.location.search = search;
  assert.equal(api.ballsFromUrl(), null, `${search || '未指定'} は null`);
}
context.window.location.search = '';

assert.match(calcHtml, /id="mochidamaRow"/, '持ち玉入力行があること');
assert.match(calcHtml, /今ある持ち玉を入力してください。空欄なら現金と同じ扱いで計算します。/, '持ち玉入力のヒント文言があること');
assert.doesNotMatch(presetBlock, /MOCHIDAMA_AVAILABLE_BALLS/, '固定ダミー値を残さないこと');

// --- 13. 打ち切りモード（C2） -------------------------------------------------
// 時間制約つきの合計期待値。エンジンは使わないので、
// 「エンジンと同じ答えになるべき条件で一致すること」を必須条件として固定する。

// エンジンブロックに打ち切りモードのコードが混ざっていないこと（yutime-v3 との一致テストの前提）
assert.doesNotMatch(calcEngine, /simulateContinuous|mulberry32|breakevenCheckpoints/, '打ち切りモードのコードはエンジンブロックの外に置くこと');
assert.match(logicBlock, /function simulateContinuous\(cfg\)/, '打ち切りモードはページ側ロジックに置くこと');

// 既定は遊タイム狙い（今の挙動）
assert.equal(api.MODE_OPTIONS[0].id, 'yutime');
assert.equal(api.MODE_OPTIONS[0].label, '遊タイム狙い');
assert.equal(api.MODE_OPTIONS[1].id, 'continuous');
assert.equal(api.MODE_OPTIONS[1].label, '打ち切り');
assert.equal(api.state.mode, 'yutime', '既定モードは遊タイム狙い');
assert.equal(api.DEFAULT_SPEED, 4.2, '時速の既定は4.2回転/分（記事の前提）');
assert.equal(api.DEFAULT_MINUTES, 180);
assert.equal(api.CONTINUOUS_TRIALS, 20000, '既定は20,000試行（T*の揺れを±10分以内に収める）');
assert.equal(JSON.stringify(api.SPEED_OPTIONS.map((o) => o.value)), '[4.2,5,5.9]');
assert.equal(JSON.stringify(Array.from(api.MINUTES_OPTIONS)), '[60,120,180,240,360]');
assert.equal(api.supportsContinuous(api.PRESETS[0]), true, 'アグネスPEはST確定機なので対応');
assert.equal(api.supportsContinuous(api.PRESETS[1]), false, '大海5SPはモデルが異なるので未対応');

// チェックポイントは5分刻み5〜360分＋入力された残り時間
assert.equal(api.BREAKEVEN_STEP_MINUTES, 5);
assert.equal(api.BREAKEVEN_MAX_MINUTES, 360);
{
  const cps = api.breakevenCheckpoints(180);
  assert.equal(cps.length, 72, '5分刻み5〜360分で72点');
  assert.equal(cps[0], 5);
  assert.equal(cps[cps.length - 1], 360);
  const odd = api.breakevenCheckpoints(97);
  assert.equal(odd.length, 73, '5の倍数でない残り時間は探索点に足す');
  assert.ok(odd.indexOf(97) > 0 && odd[odd.indexOf(97) - 1] === 95 && odd[odd.indexOf(97) + 1] === 100, '昇順に混ぜること');
  const long = api.breakevenCheckpoints(1440);
  assert.equal(long[long.length - 1], 1440, '360分を超える残り時間は最後に置く');
}

function continuousState(overrides) {
  return {
    presetId: 'agnes-pe', currentSpin: 50, rotationRate: 17, payout: 100,
    exchangeBalls: 25, ballKind: 'cash', mochidamaBalls: null,
    mode: 'continuous', normalSpeed: 4.2, remainMinutes: 180,
    ...overrides
  };
}
// 出荷される経路（T*を先に出して、やめるルール込みで本シミュレーションを回す）
function shipped(overrides) {
  Object.assign(fastApi.state, continuousState(overrides));
  const { result } = fastApi.continuousFromState();
  assert.ok(result, `打ち切りモードの結果が得られること: ${JSON.stringify(overrides)}`);
  return result;
}
// やめるルール抜きで直接叩く（整合テスト用）
function rawRun(overrides, cfgOverrides = {}) {
  Object.assign(fastApi.state, continuousState(overrides));
  return fastApi.simulateContinuous({ ...fastApi.continuousConfigFromState(), ...cfgOverrides });
}
function engineAt(counterSpin, overrides = {}) {
  const defaults = fastApi.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults;
  return fastApi.YUTIME_EXPECTATION_ENGINE.calculate(
    { presetId: 'agnes-pe', currentSpin: fastApi.engineSpinFromCounter(fastApi.PRESETS[0], counterSpin), rotationRate: 17, availableBalls: 0 },
    { ...defaults, presetId: 'agnes-pe', netBallsPerWin: 100, yenPerBall: 4, ...overrides }
  );
}

// 受け入れ基準1: 残り時間24時間・時間切れ無しなら、最初のサイクルの期待値がエンジンと一致する。
// エンジンと同じ通常時250回転/h（＝4.1667回転/分）で比較する。
// 20,000試行でも1σが約1.5%あるので、モデルの一致を見る本テストは試行数を増やして判定する。
const PARITY_TRIALS = 30000;
const parity = rawRun(
  { currentSpin: 150, normalSpeed: 250 / 60, remainMinutes: 24 * 60 },
  { trials: PARITY_TRIALS, cycleLimit: 1 }
);
const engine150 = engineAt(150);
assert.equal(Math.round(engine150.evYen), 1590, 'エンジン側の基準値（アグネスPE・カウンター150・17回転・1R100玉・等価・現金）');
assert.equal(parity.cycleSamples, PARITY_TRIALS, '24時間あればサイクルは必ず完了する');
assert.ok(
  Math.abs(parity.cycleEvYen / engine150.evYen - 1) <= 0.03,
  `§3-1 最初のサイクルの期待値がエンジンと±3%で一致すること: engine ${engine150.evYen.toFixed(0)} / sim ${parity.cycleEvYen.toFixed(0)}`
);

// 受け入れ基準2: 平均連 2.49連（B91・残保留込み）に ±2%
assert.ok(Math.abs(engine150.expectedWins - 2.49) < 0.01, 'エンジンの平均連は2.49連');
assert.ok(
  Math.abs(parity.cycleWins / engine150.expectedWins - 1) <= 0.02,
  `§3-2 平均連がエンジンと±2%で一致すること: engine ${engine150.expectedWins.toFixed(3)} / sim ${parity.cycleWins.toFixed(3)}`
);

// 受け入れ基準3: 残り時間24時間の時給が、時短抜けの再スタート加重で出したサイクル期待値÷サイクル時間と一致する。
// 加重は振り分けの 30/66/4 ではなく「実際に抜けた時短」の終端分布を使う（仕様§3-3の確定事項）。
// 長い時短ほど引き戻して連チャンが続くため終端になりにくく、
// 終端分布は w_J × (1-p)^(J+残保留) に比例して短い時短へ寄る（30/66/4 → 約36/62/2）。
// 起点は時短抜け50。カウンター150から始めると1サイクル目のぶんだけ時給が持ち上がり、
// 定常の時給との比較にならない（実測 +11%）。
{
  const spec = fastApi.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].spec;
  const hold = fastApi.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults.holdSpins;
  const pLow = spec.hitProbLow;
  const weights = spec.jitanTable.map((row) => row.share * Math.pow(1 - pLow, row.spins + hold));
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  let refEv = 0;
  let refHours = 0;
  spec.jitanTable.forEach((row, index) => {
    const share = weights[index] / weightSum;
    const result = engineAt(spec.stSpins + row.spins);
    refEv += share * result.evYen;
    refHours += share * result.totalHours;
  });
  const refHourly = refEv / refHours;
  const longRun = shipped({ currentSpin: 50, normalSpeed: 250 / 60, remainMinutes: 24 * 60 });
  assert.ok(
    Math.abs(longRun.hourlyYen / refHourly - 1) <= 0.05,
    `§3-3 24時間の時給が再スタート加重のサイクル時給と±5%で一致すること: ref ${refHourly.toFixed(0)} / sim ${longRun.hourlyYen.toFixed(0)}`
  );
  // 終端分布が解析どおりであることも固定する（サイクル起点の決まり方の回帰点）
  const exitTotal = longRun.exits.reduce((sum, v) => sum + v, 0);
  spec.jitanTable.forEach((row, index) => {
    const expected = weights[index] / weightSum;
    const actual = longRun.exits[index] / exitTotal;
    assert.ok(Math.abs(actual - expected) < 0.01, `時短${row.spins}の抜け構成比: expected ${expected.toFixed(4)}, got ${actual.toFixed(4)}`);
  });
}

// 受け入れ基準4: 残り時間を短くすると合計期待値が下がり、ある時間でマイナスに転じる。
// 5分刻みは乱数誤差が増分を上回ることがあるので、単調性は60分刻みで見る。
{
  const base = shipped({});
  const at = (minutes) => base.curve.find((row) => row.minutes === minutes).evYen;
  let previous = -Infinity;
  for (const minutes of [60, 120, 180, 240, 300, 360]) {
    const value = at(minutes);
    assert.ok(value > previous, `§3-4 残り時間が長いほど合計期待値が大きいこと: ${minutes}分 ${value.toFixed(0)}`);
    previous = value;
  }
  assert.ok(at(60) < 0, '§3-4 短い残り時間ではマイナスに転じること');
  assert.ok(base.curve[0].evYen < 0, '5分ではマイナス');
}

// 受け入れ基準5 / 6: 単サイクルの損益分岐 T*
// カウンター50 ＝ ST10回転 + 時短40回転 ＝「時短抜け50」。
{
  const slow = shipped({ rotationRate: 17, normalSpeed: 4.2 });
  const t40 = slow.restartBreakeven.find((row) => row.spins === 40);
  assert.equal(t40.counter, 50, '時短抜け40はデータカウンター50から再スタートする');
  assert.ok(t40.minutes >= 45 && t40.minutes <= 70, `§3-5 17回転・時速4.2・c50 の T* が45〜70分であること: ${t40.minutes}分`);
  assert.equal(slow.currentBreakeven.counter, 50);
  assert.equal(slow.currentBreakeven.minutes, t40.minutes, 'カウンター50の T* は時短抜け40の T* と一致する');

  const fast = shipped({ rotationRate: 22, normalSpeed: 5.9 });
  const f40 = fast.restartBreakeven.find((row) => row.spins === 40);
  assert.ok(f40.minutes >= 15 && f40.minutes <= 30, `§3-6 22回転・時速5.9・c50 の T* が15〜30分であること: ${f40.minutes}分`);

  // 遊タイムに近い起点ほど早く座れる（時短抜け90＝カウンター100 が最短）
  const bySpins = slow.restartBreakeven.slice().sort((a, b) => a.spins - b.spins);
  assert.equal(JSON.stringify(bySpins.map((row) => row.counter)), '[25,50,100]', '起点は25/50/100');
  assert.ok(bySpins[0].minutes >= bySpins[1].minutes, '時短抜け15は40より座りにくい');
  assert.ok(bySpins[1].minutes >= bySpins[2].minutes, '時短抜け40は90より座りにくい');
  // T* は「その起点から1サイクル打った期待値が0以上になる最小の残り時間」
  const cfg = { ...fastApi.continuousConfigFromState() };
  Object.assign(fastApi.state, continuousState({ rotationRate: 22, normalSpeed: 5.9 }));
  const cfgFast = fastApi.continuousConfigFromState();
  const single = fastApi.simulateContinuous({ ...cfgFast, startCounter: 50, cycleLimit: 1, stopRuleMinutes: null });
  assert.equal(fastApi.cycleBreakevenMinutes(cfgFast, 50), f40.minutes, 'T* は単サイクル曲線のゼロ交差と一致する');
  const cross = single.curve.find((row) => row.minutes === f40.minutes);
  assert.ok(cross.evYen >= 0, `T* での単サイクル期待値は0以上: ${cross.evYen.toFixed(0)}`);
  const before = single.curve.find((row) => row.minutes === f40.minutes - api.BREAKEVEN_STEP_MINUTES);
  assert.ok(before.evYen < 0, `T* の1つ手前ではマイナス: ${before.evYen.toFixed(0)}`);
  assert.ok(cfg.startCounter === 50);
}

// 受け入れ基準（追加）: やめるルールが損を減らしていること
{
  const withRule = shipped({});
  assert.ok(
    withRule.evYen >= withRule.evYenNoStopRule,
    `やめるルール込みの合計期待値がルール無し以上であること: ${withRule.evYen.toFixed(0)} vs ${withRule.evYenNoStopRule.toFixed(0)}`
  );
  withRule.curve.forEach((row, index) => {
    assert.ok(
      row.evYen >= withRule.rawCurve[index].evYen - 1e-9,
      `やめるルールはどの残り時間でも損を減らすこと: ${row.minutes}分 ${row.evYen.toFixed(0)} vs ${withRule.rawCurve[index].evYen.toFixed(0)}`
    );
  });
  assert.ok(withRule.stopRuleShare > 0 && withRule.stopRuleShare <= 1, 'ヤメが発生した試行の割合を持つこと');
  // やめれば打ちかけの投資は残らないので、時間切れの損失はルール無しよりずっと小さい
  const noRule = rawRun({});
  assert.ok(withRule.cutoffYen > noRule.cutoffYen, `やめるルールで時間切れ損失が縮むこと: ${withRule.cutoffYen.toFixed(0)} vs ${noRule.cutoffYen.toFixed(0)}`);
}

// 受け入れ基準7: 固定シードで同じ入力→同じ出力
{
  const a = shipped({});
  const b = shipped({});
  assert.equal(a.evYen, b.evYen, '§3-7 同じ入力なら合計期待値は同じ');
  assert.equal(JSON.stringify(a.restartBreakeven), JSON.stringify(b.restartBreakeven), '§3-7 同じ入力なら T* も同じ');
  assert.equal(JSON.stringify(a.curve), JSON.stringify(b.curve));
  const c = shipped({ rotationRate: 22 });
  assert.notEqual(a.evYen, c.evYen, '入力が変われば結果も変わる');
}

// 受け入れ基準8: 実行時間。T*の4本と本シミュレーションを合わせて計る
{
  const started = process.hrtime.bigint();
  shipped({ rotationRate: 22, normalSpeed: 5.9, remainMinutes: 360 });
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(elapsedMs < 1000, `§3-8 T*の算出込みで1秒以内であること: ${elapsedMs.toFixed(0)}ms`);
}

// 集計値の整合（回数系）
{
  const base = shipped({});
  assert.ok(base.firstHits > 0 && base.firstHits < 20, '初当り回数が現実的な範囲');
  assert.ok(base.wins > base.firstHits, '総当選数は初当り数より多い（連チャンぶん）');
  assert.ok(base.yutimeReaches >= 0 && base.yutimeReaches < base.firstHits, '遊タイム到達は初当りの一部');
  assert.equal(base.exits.length, 3, '時短抜けは15/40/90の3種');
  assert.ok(base.cutoffYen <= 0, '時間切れの損失見込みはマイナス表示');
  assert.equal(base.trials, 20000);
  assert.equal(base.minutes, 180);
  // 時給は「実際に打った時間」ではなく入力の残り時間で割る
  assert.ok(Math.abs(base.hourlyYen - base.evYen / 3) < 1e-9, '時給＝合計期待値÷残り時間');
}

// 持ち玉・交換率が打ち切りモードにも効くこと
{
  const equalCash = shipped({ currentSpin: 150 }).evYen;
  const lowCash = shipped({ currentSpin: 150, exchangeBalls: 28 }).evYen;
  assert.ok(lowCash < equalCash, '非等価のほうが合計期待値は下がること');
  const lowMochidama = shipped({ currentSpin: 150, exchangeBalls: 28, ballKind: 'mochidama', mochidamaBalls: 3000 }).evYen;
  assert.ok(lowMochidama > lowCash, '非等価では持ち玉のほうが合計期待値は高いこと');
  const equalMochidama = shipped({ currentSpin: 150, ballKind: 'mochidama', mochidamaBalls: 3000 }).evYen;
  // 持ち玉ぶんと現金ぶんで玉単価を分けて足すため、等価でも丸め誤差だけは出る
  assert.ok(Math.abs(equalMochidama - equalCash) < 1e-6, '等価では現金と持ち玉で変わらない');
}

// 未入力・不正値で「—」＋不足項目の1行提示になり、例外にならないこと
{
  Object.assign(api.state, continuousState({ currentSpin: null, rotationRate: null, payout: null }));
  assert.equal(api.continuousFromState().result, null);
  assert.equal(api.continuousFromState().missing, '現在回転数を入力してください');
  Object.assign(api.state, continuousState({ normalSpeed: null }));
  assert.equal(api.continuousMissingMessage(), '通常時の時速を入力してください');
  Object.assign(api.state, continuousState({ normalSpeed: 0 }));
  assert.equal(api.continuousMissingMessage(), '通常時の時速を入力してください');
  Object.assign(api.state, continuousState({ remainMinutes: null }));
  assert.equal(api.continuousMissingMessage(), '残り時間を入力してください');
  Object.assign(api.state, continuousState({ remainMinutes: -30 }));
  assert.equal(api.continuousFromState().missing, '残り時間を入力してください');
  Object.assign(api.state, continuousState({ presetId: 'umi-sp5' }));
  const unsupported = api.continuousFromState();
  assert.equal(unsupported.result, null);
  assert.equal(unsupported.missing, '打ち切りモードはP大海物語5スペシャルに未対応です', '未対応機種では推測値を出さない');
  assert.equal(api.countText(null), '—');
  assert.equal(api.countText(3.04), '3.0回');
  assert.equal(api.seatMinutesText(null), '残り6時間でも座れません');
  assert.equal(api.seatMinutesText(55), '55分〜');
  assert.equal(api.restartBreakevenText(null), '—');
  assert.equal(api.currentBreakevenText(null), '—');
  assert.equal(api.continuousBasisText(null), '');
}

// 表示テキスト（根拠行・時短抜け内訳・座れる残り時間）
{
  const shown = shipped({ currentSpin: 150 });
  Object.assign(api.state, continuousState({ currentSpin: 150 }));
  assert.equal(api.exitsText(shown).replace(/[\d.]+回/g, 'N'), '15：N ／ 40：N ／ 90：N', '時短抜けは回数の小さい順に並べる');
  assert.equal(
    api.restartBreakevenText(shown).replace(/\d+分〜/g, 'N分〜'),
    '15抜け N分〜 ／ 40抜け N分〜 ／ 90抜け N分〜',
    '座れる残り時間は時短回数の小さい順に3値を並べる'
  );
  assert.match(api.currentBreakevenText(shown), /^\d+分〜$/, '現在カウンターの座れる残り時間');
  Object.assign(api.state, continuousState({ currentSpin: 150 }));
  const basis = api.continuousBasisText(shown);
  assert.match(basis, /時速4\.2回転\/分（記事の前提）＝252回転\/h/, '根拠行に時速と時間あたり換算を出すこと');
  assert.match(basis, /残り180分/, '根拠行に残り時間を出すこと');
  assert.match(basis, /20,000試行/, '根拠行に試行数を添えること（§3-8）');
  assert.match(basis, /使用回転率 17回転\/千円/, '根拠行に既存の使用回転率を出すこと');
  assert.match(basis, /1R実質出玉（電サポ中の減り込み） 100/, '根拠行に既存の1R実質出玉を出すこと');
  assert.match(basis, /時短抜けで残り時間が座れる最短を下回ったらヤメる前提/, '根拠行にやめるルールを明記すること');
}

// URLパラメータ ?mode=continuous&minutes=120&speed=5.0
context.window.location.search = '?mode=continuous&minutes=120&speed=5.0';
assert.equal(api.modeFromUrl(), 'continuous');
assert.equal(api.minutesFromUrl(), 120);
assert.equal(api.speedFromUrl(), 5);
context.window.location.search = '?mode=yutime';
assert.equal(api.modeFromUrl(), 'yutime');
for (const search of ['?mode=nonexistent', '']) {
  context.window.location.search = search;
  assert.equal(api.modeFromUrl(), 'yutime', `${search || '未指定'} は遊タイム狙いにフォールバック`);
}
for (const search of ['?minutes=abc', '?minutes=-30', '?minutes=0', '']) {
  context.window.location.search = search;
  assert.equal(api.minutesFromUrl(), null, `${search || '未指定'} は null`);
}
for (const search of ['?speed=abc', '?speed=-1', '?speed=0', '']) {
  context.window.location.search = search;
  assert.equal(api.speedFromUrl(), null, `${search || '未指定'} は null`);
}
context.window.location.search = '';

// 画面側の静的条件
assert.match(calcHtml, /<div class="modes" id="modeChips"><\/div>/, 'モードのトグルを結果ブロックの上に置くこと');
assert.match(calcHtml, /id="continuousPanel"/, '打ち切りモード専用の結果ブロックがあること');
assert.match(calcHtml, /id="speedRow"/, '時速の入力行があること');
assert.match(calcHtml, /id="minutesRow"/, '残り時間の入力行があること');
assert.match(calcHtml, /4\.2＝記事の前提（250回転\/h）／5\.9＝導入日の実測（22回転の良台）/, 'チップの注記を出すこと');
assert.match(calcHtml, /時短抜けから座れる残り時間：<b id="ctRestartBreakeven">/, '時短抜けごとの座れる残り時間を出すこと');
assert.match(calcHtml, /今から座れる残り時間 <b id="ctCurrentBreakeven">/, '現在カウンターから座れる残り時間を出すこと');
assert.match(calcHtml, /\.ct-breakeven b\{font-size:15px;font-weight:700/, '座れる残り時間は太字で出すこと');
assert.doesNotMatch(calcHtml, /この条件で期待値がプラスになる最短の残り時間/, '旧「プラスになる最短の残り時間」は T* の3値に置き換えること');
assert.match(calcHtml, /打ちかけの投資が回収できない分/, '時間切れの損失見込みの説明を添えること');
assert.match(calcHtml, /byId\("resultPanel"\)\.style\.display = continuous \? "none" : "";/, 'モードで結果ブロックを出し分けること');
assert.match(calcHtml, /if \(!supportsContinuous\(currentPreset\(\)\)\) state\.mode = MODE_OPTIONS\[0\]\.id;/, '未対応機種へ切り替えたら遊タイム狙いへ戻すこと');
// 実表示の全高は 320px幅で最大1,065px（埋め込み用コードは iframe 内では隠れる）
assert.match(calcHtml, /width="100%" height="1080" style="border:0" loading="lazy"/, '打ち切りモードの埋め込みは高さを広げること');

console.log('yutime-calc: OK');

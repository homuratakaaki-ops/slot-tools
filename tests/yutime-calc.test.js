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
  'globalThis.api = { state, PRESETS, MODE_OPTIONS, SPEED_OPTIONS, DEFAULT_SPEED, DEFAULT_CLOSE_TIME, CONTINUOUS_TRIALS, CONTINUOUS_SEED, CONTINUOUS_DEBOUNCE_MS, BREAKEVEN_STEP_MINUTES, BREAKEVEN_MAX_MINUTES, HOURLY_THRESHOLD_YEN, EXCHANGE_OPTIONS, EXCHANGE_MIN_BALLS, EXCHANGE_MAX_BALLS, QUIT_KIND_OPTIONS, DEFAULT_QUIT_KIND, YUTIME_EXPECTATION_ENGINE, currentPreset, counterOffset, engineSpinFromCounter, remainingSpins, numberOrNull, yenText, hourText, evJudgment, basisText, missingMessage, availableBallsFromState, calculateFromState, presetIdFromUrl, ballsFromUrl, modeFromUrl, speedFromUrl, saipureiFromUrl, timeFromUrl, supportsContinuous, breakevenCheckpoints, simulateContinuous, continuousConfigFromState, continuousFromState, continuousMissingMessage, continuousBlockMessage, countText, exitsText, seatSummaryText, seatSummaryLabel, unreachableText, continuousJudgment, quitPlanText, quitKindLabel, hardEndMinutes, hardRemainMinutesFromState, softDeadlineMinutesFromState, exchangeBallsFromState, yenPerBallFromState, exchangeMessage, exchangeFromUrl, gridFrom, seatMinutesFrom, steadyHourlyYen, GRID_CHECKPOINTS, hourlyThresholdFromState, hourlyThresholdFromUrl, continuousBasisText, parseTimeMinutes, formatTimeMinutes, currentClockText, endTimeInfo, remainMinutesFromState, remainSummaryText, speedNoteText };'
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
  'return { state, PRESETS, YUTIME_EXPECTATION_ENGINE, engineSpinFromCounter, simulateContinuous, continuousConfigFromState, continuousFromState, gridFrom, steadyHourlyYen };'
].join('\n'))({ location: { search: '' } }, URLSearchParams);

function evaluate({ presetId, currentSpin, rotationRate, payout, exchangeBalls = 25, exchangeCustom = null, ballKind = 'cash', mochidamaBalls = null, saipureiBalls = null }) {
  Object.assign(api.state, { presetId, currentSpin, rotationRate, payout, exchangeBalls, exchangeCustom, ballKind, mochidamaBalls, saipureiBalls });
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
assert.match(calcHtml, /width="100%" height="780" style="border:0" loading="lazy"/, '埋め込み用コードを掲載すること');
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

Object.assign(api.state, { ballKind: 'cash', mochidamaBalls: 3000, saipureiBalls: 2000 });
assert.equal(api.availableBallsFromState(), 0, '現金選択時は入力値があっても0');
Object.assign(api.state, { ballKind: 'mochidama', mochidamaBalls: null, saipureiBalls: null });
assert.equal(api.availableBallsFromState(), 0, '両方空欄は0');
Object.assign(api.state, { ballKind: 'mochidama', mochidamaBalls: 3000, saipureiBalls: null });
assert.equal(api.availableBallsFromState(), 3000, '持ち玉だけなら持ち玉ぶん');
Object.assign(api.state, { ballKind: 'mochidama', mochidamaBalls: null, saipureiBalls: 2000 });
assert.equal(api.availableBallsFromState(), 2000, '再プレイだけなら再プレイぶん');
Object.assign(api.state, { ballKind: 'mochidama', mochidamaBalls: 3000, saipureiBalls: 2000 });
assert.equal(api.availableBallsFromState(), 5000, '持ち玉3,000＋再プレイ2,000は合計5,000');

// 合計5,000玉のページ経由計算が、エンジンへ availableBalls:5000 を渡したのと一致すること（v3と同一条件）
const s24PageCase = evaluate({
  presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: 100,
  exchangeBalls: 28, ballKind: 'mochidama', mochidamaBalls: 3000, saipureiBalls: 2000
}).result;
const s24DirectCase = api.YUTIME_EXPECTATION_ENGINE.calculate({
  presetId: 'agnes-pe',
  currentSpin: api.engineSpinFromCounter(api.PRESETS[0], 150),
  rotationRate: 17,
  availableBalls: 5000
}, s13Settings);
assert.equal(Math.round(s24PageCase.evYen), Math.round(s24DirectCase.evYen), '持ち玉3,000＋再プレイ2,000は availableBalls 5,000 として計算されること');
// 3,000玉でも通常時の投資（約925玉）を賄えるので、この条件では 3,000 と 5,000 の答えは一致する。
// 再プレイぶんが効いていることは、玉が足りない条件で確かめる
{
  const smallCase = { presetId: 'agnes-pe', currentSpin: 0, rotationRate: 17, payout: 100, exchangeBalls: 28, ballKind: 'mochidama' };
  const only500 = evYenOf({ ...smallCase, mochidamaBalls: 500 });
  const with300More = evYenOf({ ...smallCase, mochidamaBalls: 500, saipureiBalls: 300 });
  assert.ok(with300More > only500, `再プレイぶんが期待値に効くこと: ${only500} → ${with300More}`);
  assert.equal(
    with300More,
    evYenOf({ ...smallCase, mochidamaBalls: 800, saipureiBalls: null }),
    '内訳が違っても合計が同じなら同じ答えになること'
  );
}

context.window.location.search = '?balls=3000';
assert.equal(api.ballsFromUrl(), 3000, '?balls=3000 は3000');
for (const search of ['?balls=abc', '?balls=-5', '?balls=0', '']) {
  context.window.location.search = search;
  assert.equal(api.ballsFromUrl(), null, `${search || '未指定'} は null`);
}
context.window.location.search = '';

assert.match(calcHtml, /id="mochidamaRow"/, '持ち玉入力行があること');
assert.match(calcHtml, /今ある持ち玉と、再プレイで使える玉を入力してください。合計を交換単価の玉として計算します。両方空欄なら現金と同じ扱いです。/, '持ち玉・再プレイ入力のヒント文言があること');
assert.match(calcHtml, /<label class="label" for="mochidamaBalls">持ち玉<\/label>/, '持ち玉の枠');
assert.match(calcHtml, /<label class="label" for="saipureiBalls">再プレイ<\/label>/, '再プレイの枠');
// 持ち玉2枠は両モード共通（遊タイム狙いモードでも効く）
assert.match(calcHtml, /byId\("mochidamaRow"\)\.style\.display = state\.ballKind === "mochidama" \? "" : "none";/, '玉の種類で持ち玉行を出し分けること');
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
assert.equal(api.DEFAULT_SPEED, 250, '時速の既定は250回転/h（記事の前提）');
assert.equal(api.DEFAULT_CLOSE_TIME, '23:45', '閉店時刻の既定は23:45');
assert.equal(api.CONTINUOUS_TRIALS, 20000, '既定は20,000試行');
assert.equal(JSON.stringify(api.SPEED_OPTIONS.map((o) => o.value)), '[250,300,350]', '時速チップは回転/時');
assert.equal(api.speedNoteText(250), '（記事の前提）');
assert.equal(api.speedNoteText(350), '（導入日の実測）');
assert.equal(api.speedNoteText(300), '');
assert.equal(api.speedNoteText(4.2), '', '旧単位の値には注記を付けない');
assert.equal(api.supportsContinuous(api.PRESETS[0]), true, 'アグネスPEはST確定機なので対応');
assert.equal(api.supportsContinuous(api.PRESETS[1]), false, '大海5SPはモデルが異なるので未対応');

// チェックポイントは5分刻み5〜360分＋入力された残り時間
assert.equal(api.BREAKEVEN_STEP_MINUTES, 5);
assert.equal(api.BREAKEVEN_MAX_MINUTES, 360);
assert.equal(api.GRID_CHECKPOINTS.length, 72, '1サイクルの探索点は5分刻み5〜360分');
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
    mode: 'continuous', normalSpeed: 250, hourlyThreshold: null,
    nowTime: '20:45', nowManual: false, quitTime: null, quitKind: 'soft', closeTime: '23:45',
    ...overrides
  };
}
// 出荷される経路（起点ごとの1サイクル表を先に出し、やめるルール込みで本シミュレーションを回す）
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
// エンジンと同じ通常時250回転/hで比較する。
// 20,000試行でも1σが約1.5%あるので、モデルの一致を見る本テストは試行数を増やして判定する。
const PARITY_TRIALS = 30000;
const parity = rawRun(
  { currentSpin: 150, normalSpeed: 250, nowTime: '00:00', quitTime: null, closeTime: '23:59' },
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
// 終端分布は w_J × (1-p)^(J+残保留) に比例して短い時短へ寄る（30/66/4 → 約36/62/2）。
// 起点は時短抜け50。カウンター150から始めると1サイクル目のぶんだけ時給が持ち上がる。
// やめるルールは「1サイクル期待値がマイナスならヤメ」なので、定常の時給との比較がそのままできる。
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

  const longRun = shipped({ currentSpin: 50, normalSpeed: 250, nowTime: '00:00', quitTime: null, closeTime: '23:59' });
  // ページが根拠行に出す定常時給も、同じ加重で出していること
  Object.assign(api.state, continuousState({ currentSpin: 50, normalSpeed: 250, nowTime: '00:00', quitTime: null, closeTime: '23:59' }));
  assert.ok(Math.abs(api.steadyHourlyYen() - refHourly) < 1e-9, '定常時給は終端分布の加重で出すこと');
  assert.ok(Math.abs(longRun.steadyHourlyYen - refHourly) < 1e-9, '結果にも定常時給を持たせること');
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
// 打てる水準の台（22回転・時速350）は残り時間が伸びるほど積み上がる。
{
  const good = shipped({ rotationRate: 22, normalSpeed: 350 });
  const at = (minutes) => good.curve.find((row) => row.minutes === minutes).evYen;
  let previous = -Infinity;
  for (const minutes of [60, 120, 180, 240, 300, 360]) {
    const value = at(minutes);
    assert.ok(value > previous, `§3-4 残り時間が長いほど合計期待値が大きいこと: ${minutes}分 ${value.toFixed(0)}`);
    previous = value;
  }
  assert.ok(good.curve[0].evYen < 0, '§3-4 短い残り時間ではマイナスに転じること');
  // 時給が閾値に届かない台（17回転・時速250）でも、期待値がプラスな限りは打ち続けるので積み上がる
  const weak = shipped({ rotationRate: 17, normalSpeed: 250 });
  const weakAt = (minutes) => weak.curve.find((row) => row.minutes === minutes).evYen;
  let weakPrevious = -Infinity;
  for (const minutes of [60, 120, 180, 240, 300, 360]) {
    assert.ok(weakAt(minutes) > weakPrevious, `§3-4 時給が届かない台でも残り時間とともに積み上がること: ${minutes}分 ${weakAt(minutes).toFixed(0)}`);
    weakPrevious = weakAt(minutes);
  }
  assert.ok(weakAt(60) < 0, '§3-4 打てない台も短い残り時間ではマイナス');
  assert.ok(weak.firstHits > 3, '期待値がプラスな限り座り直すので初当りは積み上がる');
}

// 受け入れ基準5 / 6: 座れる残り時間＝1サイクルの時給が閾値以上になる最小の残り時間
// カウンター50 ＝ ST10回転 + 時短40回転 ＝「時短抜け50」。
{
  // 17回転・時速250 は定常の時給が約400円なので、どの残り時間でも時給2,400円に届かない
  const weak = shipped({ rotationRate: 17, normalSpeed: 250 });
  assert.equal(weak.hourlyThreshold, 2400, '既定の閾値はv3と同じ2,400円');
  weak.outlooks.forEach((outlook) => {
    assert.equal(outlook.seatMinutes, null, `§3-5 17回転・時速250 では ${outlook.label} が時給2,400円に届かないこと`);
  });
  assert.equal(
    api.seatSummaryText(weak),
    'この条件では打てる水準（時給2,400円）に届きません',
    '§3-5 届かないときは1文で明示すること'
  );

  // 22回転・時速350 は座れる残り時間が出る
  const strong = shipped({ rotationRate: 22, normalSpeed: 350 });
  const strong40 = strong.outlooks.find((outlook) => outlook.spins === 40);
  assert.equal(strong40.counter, 50, '時短抜け40はデータカウンター50から再スタートする');
  assert.ok(
    Number.isFinite(strong40.seatMinutes) && strong40.seatMinutes > 0 && strong40.seatMinutes <= api.BREAKEVEN_MAX_MINUTES,
    `§3-6 22回転・時速350・c50 では座れる残り時間が出ること: ${strong40.seatMinutes}分`
  );
  const strongCurrent = strong.outlooks.find((outlook) => outlook.key === 'current');
  assert.equal(strongCurrent.counter, 50);
  assert.equal(strongCurrent.seatMinutes, strong40.seatMinutes, 'カウンター50は時短抜け40と同じ起点なので同じ答えになる');
  assert.doesNotMatch(api.seatSummaryText(strong), /届きません/, '§3-6 全て届かない扱いにはしないこと');

  // 遊タイムに近い起点ほど早く座れる（時短抜け90＝カウンター100 が最短）
  const bySpins = strong.outlooks.filter((outlook) => outlook.spins !== null);
  assert.equal(JSON.stringify(bySpins.map((row) => row.counter)), '[25,50,100]', '起点は25/50/100の順に並べる');
  assert.ok(bySpins[0].seatMinutes >= bySpins[1].seatMinutes, '時短抜け15は40より座りにくい');
  assert.ok(bySpins[1].seatMinutes >= bySpins[2].seatMinutes, '時短抜け40は90より座りにくい');
  // 座れる残り時間は、その残り時間の1サイクル時給が閾値以上になる最小の探索点
  const seatCell = strong40.hourlyGrid[strong40.seatMinutes / api.BREAKEVEN_STEP_MINUTES - 1];
  assert.ok(seatCell >= 2400, `座れる残り時間での1サイクル時給は閾値以上: ${seatCell.toFixed(0)}円`);
  if (strong40.seatMinutes > api.BREAKEVEN_STEP_MINUTES) {
    const previousCell = strong40.hourlyGrid[strong40.seatMinutes / api.BREAKEVEN_STEP_MINUTES - 2];
    assert.ok(previousCell < 2400, `1つ手前は閾値未満: ${previousCell.toFixed(0)}円`);
  }
}

// 上段の判定（B93と同じ基準）は、合計期待値と「合計期待値÷入力の残り時間」で見る
{
  const strong = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350 });
  assert.equal(strong.outlooks.length, 4, '起点は「今から」＋時短抜け3種');
  assert.equal(JSON.stringify(strong.outlooks.map((o) => o.label)), '["今から","15抜け","40抜け","90抜け"]', '今から→時短回数の小さい順');
  assert.equal(strong.outlooks[0].counter, 150, '「今から」は現在カウンターが起点');
  strong.outlooks.forEach((outlook) => {
    assert.equal(outlook.evGrid.length, 72, `${outlook.label}: やめるルールが引く期待値表は5分刻み72点`);
    assert.equal(outlook.hourlyGrid.length, 72, `${outlook.label}: 時給表も5分刻み72点`);
    assert.ok(outlook.cells === undefined, `${outlook.label}: 残り時間別の1サイクル表は持たないこと`);
  });
  const judgment = api.continuousJudgment(strong);
  assert.ok(['打てる', '微妙', '打てない'].includes(judgment.label), `上段の判定ラベル: ${judgment.label}`);
  const expectedLabel = strong.hourlyYen >= 2400 ? '打てる' : strong.evYen > 0 ? '微妙' : '打てない';
  assert.equal(judgment.label, expectedLabel, `上段の判定: 時給${strong.hourlyYen.toFixed(0)} 期待値${strong.evYen.toFixed(0)}`);
  assert.equal(api.continuousJudgment(null).label, '—');
  // しきい値を上げれば同じ数字でも判定は下がるが、集計は動かない
  const strict = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350, hourlyThreshold: 99999 });
  assert.equal(api.continuousJudgment(strict).label, '微妙', 'しきい値を上げれば「微妙」になる');
  assert.equal(strict.evYen, strong.evYen, 'しきい値を変えても合計期待値は動かない');
}

// 判定の基準そのもの（B93）と閾値の差し替え
assert.equal(api.HOURLY_THRESHOLD_YEN, 2400, '既定の閾値はv3と同じ2,400円');
assert.equal(api.evJudgment(null).label, '—');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: 2400, evYen: 2400 }).label, '打てる');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: 2399, evYen: 2399 }).label, '微妙');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: -100, evYen: -100 }).label, '打てない');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: 2399, evYen: 2399 }, 1000).label, '打てる', '閾値を下げれば打てるになる');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: 2400, evYen: 2400 }, 3000).label, '微妙', '閾値を上げれば微妙になる');
assert.equal(api.evJudgment({ totalHours: 1, hourlyYen: -1, evYen: 0 }, 0).label, '打てない', '期待値0以下は打てない');

// 閾値は ?hourly= で変えられる。遊タイム狙いモードの判定は2,400円のまま
{
  Object.assign(api.state, continuousState({ hourlyThreshold: null }));
  assert.equal(api.hourlyThresholdFromState(), 2400, '未指定なら2,400円');
  Object.assign(api.state, continuousState({ hourlyThreshold: 1500 }));
  assert.equal(api.hourlyThresholdFromState(), 1500);
  for (const bad of [0, -100, NaN, null]) {
    Object.assign(api.state, continuousState({ hourlyThreshold: bad }));
    assert.equal(api.hourlyThresholdFromState(), 2400, `不正値 ${bad} は既定に落とす`);
  }
  context.window.location.search = '?hourly=1500';
  assert.equal(api.hourlyThresholdFromUrl(), 1500);
  for (const search of ['?hourly=abc', '?hourly=-100', '?hourly=0', '']) {
    context.window.location.search = search;
    assert.equal(api.hourlyThresholdFromUrl(), null, `${search || '未指定'} は null`);
  }
  context.window.location.search = '';
  assert.match(calcHtml, /state\.hourlyThreshold = hourlyThresholdFromUrl\(\);/, '?hourly= を初期状態に取り込むこと');
  // 遊タイム狙いモードは不変
  assert.match(calcHtml, /<div class="threshold">判定基準：時給2,400円以上で打てる<\/div>/, '遊タイム狙いの判定基準表示は据え置き');
  assert.match(logicBlock, /function evJudgment\(result, thresholdYen = HOURLY_THRESHOLD_YEN\)/, '閾値の既定は定数のまま');
  const yutimeRender = sectionOf(calcHtml, 'yutime-calc.html', 'function renderResult() {', 'function renderModeChips');
  assert.match(yutimeRender, /const judgment = evJudgment\(result\);/, '遊タイム狙いは閾値を渡さない＝2,400円固定');

  // 閾値を下げれば座れる残り時間が出る
  const lowered = shipped({ rotationRate: 17, normalSpeed: 250, hourlyThreshold: 400 });
  assert.equal(lowered.hourlyThreshold, 400);
  assert.ok(lowered.outlooks.some((outlook) => outlook.seatMinutes !== null), '閾値400円なら座れる起点が出る');
  assert.equal(api.seatSummaryLabel(lowered), '座れる残り時間（時給400円以上）：', '見出しに使っている閾値を出すこと');
  assert.equal(api.unreachableText(400), 'この条件では打てる水準（時給400円）に届きません');
}

// やめるルール（時短抜けで「残り時間で打つ1サイクルの期待値 < 0」ならヤメ）
// 時給のしきい値は判定ラベルの表示だけに使い、集計には効かせない
for (const condition of [{ rotationRate: 17, normalSpeed: 250 }, { rotationRate: 22, normalSpeed: 350 }]) {
  const label = `${condition.rotationRate}回転・時速${condition.normalSpeed}`;
  const withRule = shipped(condition);
  const noRule = rawRun(condition);
  assert.ok(withRule.stopRuleShare > 0, `${label}: ヤメが発生すること`);
  assert.ok(withRule.firstHits < noRule.firstHits, `${label}: やめるルールで初当り回数は減る`);
  // マイナスのサイクルを打たないぶん、合計期待値は必ず上がる
  assert.ok(withRule.evYen > noRule.evYen, `${label}: やめるルールで合計期待値が上がること: ${withRule.evYen.toFixed(0)} vs ${noRule.evYen.toFixed(0)}`);
  withRule.curve.forEach((row, index) => {
    assert.ok(
      row.evYen >= withRule.rawCurve[index].evYen - 1e-9,
      `${label}: やめるルールはどの残り時間でも損を減らすこと: ${row.minutes}分 ${row.evYen.toFixed(0)} vs ${withRule.rawCurve[index].evYen.toFixed(0)}`
    );
  });
  // やめた時点で打ちかけの投資は残らないので、時間切れの損失は縮む
  assert.ok(withRule.cutoffYen > noRule.cutoffYen, `${label}: 時間切れ損失が縮むこと: ${withRule.cutoffYen.toFixed(0)} vs ${noRule.cutoffYen.toFixed(0)}`);
}

// 時給のしきい値を変えても、集計（合計期待値・時給・時間切れ損失・回数）は1円も動かないこと
{
  const base = shipped({ rotationRate: 17, normalSpeed: 250 });
  for (const thresholdYen of [1000, 400, 5000]) {
    const other = shipped({ rotationRate: 17, normalSpeed: 250, hourlyThreshold: thresholdYen });
    assert.equal(other.evYen, base.evYen, `しきい値${thresholdYen}円でも合計期待値は同じ`);
    assert.equal(other.hourlyYen, base.hourlyYen, `しきい値${thresholdYen}円でも時給は同じ`);
    assert.equal(other.cutoffYen, base.cutoffYen, `しきい値${thresholdYen}円でも時間切れ損失は同じ`);
    assert.equal(other.firstHits, base.firstHits, `しきい値${thresholdYen}円でも初当り回数は同じ`);
    assert.equal(other.stopRuleShare, base.stopRuleShare, `しきい値${thresholdYen}円でもヤメ率は同じ`);
    assert.equal(JSON.stringify(other.curve), JSON.stringify(base.curve), `しきい値${thresholdYen}円でも残り時間別の期待値は同じ`);
    // 変わるのは表示だけ（判定ラベルと座れる残り時間）
    assert.equal(other.hourlyThreshold, thresholdYen);
  }
  assert.match(logicBlock, /if \(row\[gridIndex < stopGridLast \? gridIndex : stopGridLast\] < 0\)/, 'やめるルールは期待値0を基準にすること');
  assert.doesNotMatch(logicBlock, /stopRuleHourly|stopThreshold/, '時給のしきい値をシミュレーションへ渡さないこと');
}

// 受け入れ基準7: 固定シードで同じ入力→同じ出力
{
  const a = shipped({});
  const b = shipped({});
  assert.equal(a.evYen, b.evYen, '§3-7 同じ入力なら合計期待値は同じ');
  assert.equal(JSON.stringify(a.outlooks.map((o) => o.seatMinutes)), JSON.stringify(b.outlooks.map((o) => o.seatMinutes)), '§3-7 同じ入力なら座れる残り時間も同じ');
  assert.equal(JSON.stringify(a.curve), JSON.stringify(b.curve));
  const c = shipped({ rotationRate: 22 });
  assert.notEqual(a.evYen, c.evYen, '入力が変われば結果も変わる');
}

// 受け入れ基準8: 実行時間。1サイクル表4本と本シミュレーションを合わせて計る
{
  const started = process.hrtime.bigint();
  shipped({ rotationRate: 22, normalSpeed: 350, quitTime: null, nowTime: '17:45' });
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  assert.ok(elapsedMs < 1000, `§3-8 1サイクル表の算出込みで1秒以内であること: ${elapsedMs.toFixed(0)}ms`);
}

// 集計値の整合（回数系）
{
  const base = shipped({ rotationRate: 22, normalSpeed: 350 });
  assert.ok(base.firstHits > 0 && base.firstHits < 20, '初当り回数が現実的な範囲');
  assert.ok(base.wins > base.firstHits, '総当選数は初当り数より多い（連チャンぶん）');
  assert.ok(base.yutimeReaches >= 0 && base.yutimeReaches < base.firstHits, '遊タイム到達は初当りの一部');
  assert.equal(base.exits.length, 3, '時短抜けは15/40/90の3種');
  assert.ok(base.cutoffYen <= 0, '時間切れの損失見込みはマイナス表示');
  assert.equal(base.trials, 20000);
  assert.equal(base.minutes, 180);
  // パネル上段の時給は「合計期待値 ÷ 入力の残り時間」（表の時給とは分母が違う）
  assert.ok(Math.abs(base.hourlyYen - base.evYen / 3) < 1e-9, '時給＝合計期待値÷残り時間');
}

// 持ち玉・交換率が打ち切りモードにも効くこと
{
  const equalCash = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350 }).evYen;
  const lowCash = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350, exchangeBalls: 28 }).evYen;
  assert.ok(lowCash < equalCash, '非等価のほうが合計期待値は下がること');
  const lowMochidama = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350, exchangeBalls: 28, ballKind: 'mochidama', mochidamaBalls: 3000 }).evYen;
  assert.ok(lowMochidama > lowCash, '非等価では持ち玉のほうが合計期待値は高いこと');
  const equalMochidama = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350, ballKind: 'mochidama', mochidamaBalls: 3000 }).evYen;
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
  Object.assign(api.state, continuousState({ nowTime: null }));
  assert.equal(api.continuousMissingMessage(), '現在時刻を入力してください');
  Object.assign(api.state, continuousState({ closeTime: null, quitTime: null }));
  assert.equal(api.continuousMissingMessage(), '閉店時刻かヤメ予定時刻を入力してください');
  Object.assign(api.state, continuousState({ nowTime: '23:50' }));
  assert.equal(api.continuousFromState().missing, '終了時刻を過ぎています');
  Object.assign(api.state, continuousState({ presetId: 'umi-sp5' }));
  const unsupported = api.continuousFromState();
  assert.equal(unsupported.result, null);
  assert.equal(unsupported.missing, '打ち切りモードはP大海物語5スペシャルに未対応です', '未対応機種では推測値を出さない');
  assert.equal(api.countText(null), '—');
  assert.equal(api.countText(3.04), '3.0回');
  assert.equal(api.seatSummaryText(null), '—');
  assert.equal(api.continuousBasisText(null), '');
}

// 表示テキスト（根拠行・時短抜け内訳・座れる残り時間）
{
  const shown = shipped({ currentSpin: 150, rotationRate: 22, normalSpeed: 350 });
  Object.assign(api.state, continuousState({ currentSpin: 150, rotationRate: 22, normalSpeed: 350 }));
  assert.equal(api.exitsText(shown).replace(/[\d.]+回/g, 'N'), '15：N ／ 40：N ／ 90：N', '時短抜けは回数の小さい順に並べる');
  assert.equal(
    api.seatSummaryText(shown).replace(/\d+分〜/g, 'N分〜'),
    '今から N分〜 ／ 15抜け N分〜 ／ 40抜け N分〜 ／ 90抜け N分〜',
    '座れる残り時間は今から＋時短抜け3種を並べる'
  );
  assert.equal(api.seatSummaryLabel(shown), '座れる残り時間（時給2,400円以上）：');
  const basis = api.continuousBasisText(shown);
  assert.match(basis, /時速350回転\/h（導入日の実測）/, '根拠行に時速と出典を出すこと');
  assert.match(basis, /残り 180分（23:45閉店・現在20:45）/, '根拠行に残り時間と根拠の時刻を出すこと');
  assert.match(basis, /20,000試行/, '根拠行に試行数を添えること（§3-8）');
  assert.match(basis, /使用回転率 22回転\/千円/, '根拠行に既存の使用回転率を出すこと');
  assert.match(basis, /1R実質出玉（電サポ中の減り込み） 100/, '根拠行に既存の1R実質出玉を出すこと');
  assert.match(basis, /上段の時給は合計期待値÷残り180分（表の時給は1サイクルの期待値÷消化時間）/, '2種類の時給の違いを根拠行で明示すること');
  assert.match(basis, /時短抜けで残り時間の1サイクル期待値がマイナスならヤメる前提/, '根拠行にやめるルールを明記すること');
  assert.match(basis, /判定の時給しきい値 2,400円（表示のみ。集計には使わない）/, '時給しきい値の役割を根拠行で明示すること');
  assert.match(basis, /閉店23:45/, '根拠行に閉店時刻を出すこと');
  assert.match(basis, /定常時給 \+[\d,]+円\/h（時短抜け25\/50\/100を終端分布36\/62\/2で加重した1サイクル期待値÷所要時間）/, '根拠行に定常時給を出すこと');
}

// URLパラメータ ?mode=continuous&minutes=120&speed=5.0
context.window.location.search = '?mode=continuous&close=23:45&quit=22:30&speed=350';
assert.equal(api.modeFromUrl(), 'continuous');
assert.equal(api.timeFromUrl('close'), '23:45');
assert.equal(api.timeFromUrl('quit'), '22:30');
assert.equal(api.speedFromUrl(), 350);
context.window.location.search = '?mode=yutime';
assert.equal(api.modeFromUrl(), 'yutime');
for (const search of ['?mode=nonexistent', '']) {
  context.window.location.search = search;
  assert.equal(api.modeFromUrl(), 'yutime', `${search || '未指定'} は遊タイム狙いにフォールバック`);
}
for (const search of ['?close=abc', '?close=24:00', '?close=12:60', '?close=', '']) {
  context.window.location.search = search;
  assert.equal(api.timeFromUrl('close'), null, `${search || '未指定'} は null`);
}
context.window.location.search = '?saipurei=2000';
assert.equal(api.saipureiFromUrl(), 2000);
for (const search of ['?saipurei=abc', '?saipurei=-5', '?saipurei=0', '']) {
  context.window.location.search = search;
  assert.equal(api.saipureiFromUrl(), null, `${search || '未指定'} は null`);
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
assert.match(calcHtml, /id="timeRow"/, '時刻の入力行があること');
assert.match(calcHtml, /<input id="nowTime" type="time">/, '現在時刻の入力欄');
assert.match(calcHtml, /<input id="quitTime" type="time">/, 'ヤメ予定時刻の入力欄');
assert.match(calcHtml, /<input id="closeTime" type="time">/, '閉店時刻の入力欄');
assert.doesNotMatch(calcHtml, /id="remainMinutes"|id="minutesChips"|minutesFromUrl/, '残り時間の手入力は廃止すること');
assert.match(calcHtml, /<span class="unit">回転\/h<\/span>/, '時速の単位は回転/h');
assert.doesNotMatch(calcHtml, /回転\/分/, '時速の回転\/分表記は残さないこと');
assert.match(calcHtml, /250＝記事の前提／350＝導入日の実測（22回転の良台）/, '時速チップの注記を出すこと');
assert.match(calcHtml, /<input id="saipureiBalls" type="number"/, '再プレイの入力欄があること');
assert.match(calcHtml, /state\.nowManual = true;/, '現在時刻を手で直したら自動更新を止めること');
assert.match(calcHtml, /if \(state\.nowManual\) return;[\s\S]{0,240}\}, 60000\);/, '1分ごとに現在時刻を進めること');
assert.match(calcHtml, /<div class="ct-seat-title">閉店の判断<\/div>/, '最下段に「閉店の判断」を置くこと');
assert.match(calcHtml, /<span id="ctSeatLabel">座れる残り時間：<\/span><b id="ctSeat">/, '座れる残り時間を出すこと');
assert.match(calcHtml, /\.ct-breakeven b\{font-size:15px;font-weight:700/, '座れる残り時間は太字で出すこと');
// 上段は 合計期待値／時給＋判定／定常時給／想定当たり／遊タイム到達／時短抜け／時間切れ損失
assert.match(calcHtml, /<div class="cell-label">時給 <span class="ct-judgment" id="ctJudgment">/, '判定ラベルは上段の時給の横に出すこと');
assert.match(calcHtml, /<div>定常時給 <b id="ctSteady">/, '上段に定常時給を出すこと');
// 残り時間別の1サイクル表は廃止
assert.doesNotMatch(calcHtml, /ctTable|ct-table|cycleTableHtml|TABLE_MINUTES/, '残り時間別の1サイクル表は削除すること');
assert.doesNotMatch(calcHtml, /この条件で期待値がプラスになる最短の残り時間|時短抜けから座れる残り時間|ctRestartBreakeven|ctCurrentBreakeven|cycleBreakevenMinutes|stopRuleMinutes/, '期待値±0基準の T* は廃止すること');
assert.match(calcHtml, /打ちかけの投資が回収できない分/, '時間切れの損失見込みの説明を添えること');
assert.match(calcHtml, /byId\("resultPanel"\)\.style\.display = continuous \? "none" : "";/, 'モードで結果ブロックを出し分けること');
assert.match(calcHtml, /if \(!supportsContinuous\(currentPreset\(\)\)\) state\.mode = MODE_OPTIONS\[0\]\.id;/, '未対応機種へ切り替えたら遊タイム狙いへ戻すこと');
// 実表示の全高は 320px幅で 遊タイム狙い749px／打ち切り1,328px（持ち玉2枠を開いた状態）。埋め込み用コードは iframe 内では隠れる
assert.match(calcHtml, /width="100%" height="780" style="border:0" loading="lazy"/, "遊タイム狙いの埋め込み高さ");
assert.match(calcHtml, /width="100%" height="1340" style="border:0" loading="lazy"/, "打ち切りモードの埋め込みは高さを広げること");

// --- 14. 打ち切りモードの再計算をデバウンスする ------------------------------
// 20,000試行のモンテカルロは実ブラウザで数百ms掛かるので、1打鍵ごとに走らせると入力が固まる。
// 打ち切りモードの計算だけ「入力が止まってから1回」に寄せる。遊タイム狙いは解析式なので即時のまま。

assert.equal(api.CONTINUOUS_DEBOUNCE_MS, 150, '入力停止から150ms後に再計算する');

// 計算しなくても決まる分（未対応機種・入力不足）は待たずに出す
{
  Object.assign(api.state, continuousState({ presetId: 'umi-sp5' }));
  assert.equal(api.continuousBlockMessage(), '打ち切りモードはP大海物語5スペシャルに未対応です');
  Object.assign(api.state, continuousState({ currentSpin: null }));
  assert.equal(api.continuousBlockMessage(), '現在回転数を入力してください');
  Object.assign(api.state, continuousState({ nowTime: null }));
  assert.equal(api.continuousBlockMessage(), '現在時刻を入力してください');
  Object.assign(api.state, continuousState({ nowTime: '23:50' }));
  assert.equal(api.continuousBlockMessage(), '終了時刻を過ぎています');
  Object.assign(api.state, continuousState({ normalSpeed: null }));
  assert.equal(api.continuousBlockMessage(), '通常時の時速を入力してください');
  Object.assign(api.state, continuousState({}));
  assert.equal(api.continuousBlockMessage(), '', '入力が揃えば空文字');
  // 文言の出どころは1箇所（continuousFromState も同じ関数を通す）
  assert.match(logicBlock, /const blocked = continuousBlockMessage\(\);\n\s+if \(blocked\) return \{ result: null, missing: blocked \};/, '未対応・不足の文言は continuousBlockMessage に集約すること');
  assert.equal(
    (calcHtml.match(/打ち切りモードは\$\{preset\.name\}に未対応です/g) || []).length,
    1,
    '未対応機種の文言はファイル内に1箇所だけ'
  );
}

// 遅延させるのは重いモンテカルロだけで、不足メッセージは同期で描くこと
assert.match(calcHtml, /const blocked = continuousBlockMessage\(\);\n\s+if \(blocked\) \{\n\s+cancelContinuousRecalc\(\);\n\s+paintContinuousResult\(null, blocked\);\n\s+return;\n\s+\}/, '未対応・不足は setTimeout を挟まず即時に描くこと');
assert.match(calcHtml, /byId\("ctNotice"\)\.textContent = "計算中…";\n\s+cancelContinuousRecalc\(\);\n\s+continuousTimer = setTimeout\(\(\) => \{/, '計算待ちの間は「計算中…」を出すこと');
assert.match(calcHtml, /\}, CONTINUOUS_DEBOUNCE_MS\);/, '再計算は CONTINUOUS_DEBOUNCE_MS で遅らせること');
assert.match(calcHtml, /function cancelContinuousRecalc\(\) \{\n\s+if \(continuousTimer === null\) return;\n\s+clearTimeout\(continuousTimer\);/, '保留中の再計算を取り消せること');
assert.match(calcHtml, /if \(state\.mode !== "continuous"\) \{\n\s+cancelContinuousRecalc\(\);\n\s+return;\n\s+\}/, '遊タイム狙いへ戻したら保留中の計算を捨てること');

// 遊タイム狙いモードの描画は同期のまま（setTimeout を通さない）
{
  const renderYutime = sectionOf(calcHtml, 'yutime-calc.html', 'function renderResult() {', 'function renderModeChips');
  assert.match(renderYutime, /evNode\.textContent = result \? yenText\(result\.evYen\) : "—";/, '遊タイム狙いは renderResult 内で直接描くこと');
  assert.doesNotMatch(renderYutime, /setTimeout|requestAnimationFrame/, '遊タイム狙いモードの反映を遅らせないこと');
  assert.match(renderYutime, /renderContinuousResult\(\);/, '打ち切りモードの描画は renderResult から呼ぶこと');
}
// モンテカルロを呼ぶのはデバウンスされた1箇所だけ
assert.equal(
  (calcHtml.match(/(?<!function )continuousFromState\(\)/g) || []).length,
  1,
  'ページ側から continuousFromState を呼ぶのは遅延実行の1箇所だけ'
);
assert.match(calcHtml, /const \{ result, missing \} = continuousFromState\(\);\n\s+paintContinuousResult\(result, missing\);/, '計算結果の描画は paintContinuousResult に通すこと');

// --- 15. 時刻から残り時間を出す / 時速は回転/時 ---------------------------------

// "HH:MM" の読み書き
assert.equal(api.parseTimeMinutes('23:45'), 23 * 60 + 45);
assert.equal(api.parseTimeMinutes('00:00'), 0);
assert.equal(api.parseTimeMinutes('9:05'), 9 * 60 + 5, '1桁の時も読めること');
for (const bad of ['24:00', '12:60', '-1:00', 'abc', '2345', '', '12:5', null, undefined, 120]) {
  assert.equal(api.parseTimeMinutes(bad), null, `不正な時刻は null: ${JSON.stringify(bad)}`);
}
assert.equal(api.formatTimeMinutes(23 * 60 + 45), '23:45');
assert.equal(api.formatTimeMinutes(0), '00:00');
assert.equal(api.formatTimeMinutes(9 * 60 + 5), '09:05');
assert.equal(api.formatTimeMinutes(null), '');
assert.match(api.currentClockText(), /^\d{2}:\d{2}$/, '端末の時計から HH:MM を作れること');
assert.notEqual(api.parseTimeMinutes(api.currentClockText()), null);

// 残り時間 ＝ min(ヤメ予定, 閉店) − 現在時刻
{
  Object.assign(api.state, continuousState({ nowTime: '21:42', quitTime: null, closeTime: '23:45' }));
  assert.equal(api.remainMinutesFromState(), 123, '閉店だけなら閉店まで');
  assert.equal(api.endTimeInfo().label, '閉店');
  assert.equal(api.remainSummaryText(), '残り 123分（23:45閉店・現在21:42）');

  Object.assign(api.state, continuousState({ nowTime: '21:42', quitTime: '22:45', closeTime: '23:45' }));
  assert.equal(api.remainMinutesFromState(), 63, 'ヤメ予定のほうが早ければヤメ予定まで');
  assert.equal(api.endTimeInfo().label, 'ヤメ予定');
  assert.equal(api.remainSummaryText(), '残り 63分（22:45ヤメ予定（打ちかけは消化）・現在21:42）');

  Object.assign(api.state, continuousState({ nowTime: '21:42', quitTime: '23:59', closeTime: '23:45' }));
  assert.equal(api.remainMinutesFromState(), 123, 'ヤメ予定が閉店より遅ければ閉店まで');
  assert.equal(api.endTimeInfo().label, '閉店');

  Object.assign(api.state, continuousState({ nowTime: '21:42', quitTime: '22:45', closeTime: null }));
  assert.equal(api.remainMinutesFromState(), 63, '閉店が空欄でもヤメ予定があれば出せる');
  assert.equal(api.endTimeInfo().label, 'ヤメ予定');

  Object.assign(api.state, continuousState({ nowTime: null }));
  assert.equal(api.remainMinutesFromState(), null, '現在時刻が無ければ出せない');
  assert.equal(api.remainSummaryText(), '');
  Object.assign(api.state, continuousState({ quitTime: null, closeTime: null }));
  assert.equal(api.endTimeInfo(), null);
  assert.equal(api.remainMinutesFromState(), null, '終了時刻が無ければ出せない');

  // 終了時刻を過ぎている / ちょうど
  Object.assign(api.state, continuousState({ nowTime: '23:50', closeTime: '23:45' }));
  assert.equal(api.remainMinutesFromState(), -5);
  assert.equal(api.continuousBlockMessage(), '終了時刻を過ぎています');
  assert.equal(api.continuousFromState().result, null, '過ぎていたら計算しないこと');
  Object.assign(api.state, continuousState({ nowTime: '23:45', closeTime: '23:45' }));
  assert.equal(api.remainMinutesFromState(), 0);
  assert.equal(api.continuousBlockMessage(), '終了時刻を過ぎています', '残り0分も打てないこと');
}

// 残り時間が計算に効くこと（ヤメ予定を入れれば短くなる）
{
  const long = shipped({ rotationRate: 22, normalSpeed: 350, nowTime: '20:45', quitTime: null, closeTime: '23:45' });
  const short = shipped({ rotationRate: 22, normalSpeed: 350, nowTime: '20:45', quitTime: '21:45', closeTime: '23:45' });
  assert.equal(long.minutes, 180);
  assert.equal(short.minutes, 60);
  assert.ok(short.evYen < long.evYen, 'ヤメ予定で拘束が短くなれば合計期待値は下がること');
}

// 時速は回転/時。1回転あたりの分に直して使う
{
  Object.assign(api.state, continuousState({ normalSpeed: 250 }));
  assert.ok(Math.abs(api.continuousConfigFromState().spinMinutes - 60 / 250) < 1e-12, '250回転/h は 0.24分/回転');
  Object.assign(api.state, continuousState({ normalSpeed: 350 }));
  assert.ok(Math.abs(api.continuousConfigFromState().spinMinutes - 60 / 350) < 1e-12);
  assert.match(logicBlock, /spinMinutes: 60 \/ state\.normalSpeed,/, '時速は回転\/時として受けること');
  // 速い台のほうが同じ残り時間で稼げる
  const slow = shipped({ rotationRate: 22, normalSpeed: 250 });
  const fast = shipped({ rotationRate: 22, normalSpeed: 350 });
  assert.ok(fast.evYen > slow.evYen, '時速が速いほうが合計期待値は大きいこと');
  assert.ok(fast.firstHits > slow.firstHits, '時速が速いほうが初当り回数も多いこと');
}

// 現在時刻の自動更新は「手で直していないとき」だけ
assert.match(calcHtml, /state\.nowTime = currentClockText\(\);/, '初期値は端末の時計から入れること');
assert.match(calcHtml, /byId\("nowTime"\)\.addEventListener\("input", \(event\) => \{\n\s+\/\/ 手で直したら、以後は端末の時計で上書きしない\n\s+state\.nowManual = true;/, '手入力で自動更新を止めること');
assert.equal(api.state.nowManual, false, '既定は自動更新');

// --- 16. 定常時給と、12時間打ち切りの合計期待値 ---------------------------------
// やめるルールが「1サイクル期待値がマイナスならヤメ」に戻ったので、
// 長時間打てば合計期待値は定常時給×時間に寄る。
// 最初のサイクルの上振れ（起点が天井寄り）と最後の取り残しで前後するため、幅で固定する。

{
  // 現在9:00・閉店21:00 ＝ 12時間
  const twelveHours = { currentSpin: 50, nowTime: '09:00', quitTime: null, closeTime: '21:00' };
  const cases = [
    { rotationRate: 22, normalSpeed: 250, steady: 2439, range: [25000, 33000] },
    { rotationRate: 22, normalSpeed: 350, steady: 2986, range: [30000, 40000] },
    { rotationRate: 17, normalSpeed: 250, steady: 414, range: [3000, 6000] }
  ];
  for (const testCase of cases) {
    const label = `${testCase.rotationRate}回転・時速${testCase.normalSpeed}`;
    const result = shipped({ ...twelveHours, rotationRate: testCase.rotationRate, normalSpeed: testCase.normalSpeed });
    assert.equal(result.minutes, 720, `${label}: 9:00→21:00 は720分`);
    assert.ok(
      Math.abs(result.steadyHourlyYen - testCase.steady) < 1,
      `${label}: 定常時給 ${testCase.steady}円/h（実測 ${result.steadyHourlyYen.toFixed(0)}）`
    );
    assert.ok(
      result.evYen >= testCase.range[0] && result.evYen <= testCase.range[1],
      `${label}: 12時間の合計期待値が ${testCase.range[0]}〜${testCase.range[1]}円 に収まること（実測 ${result.evYen.toFixed(0)}）`
    );
    // 定常時給×12時間 から大きく外れないこと
    assert.ok(
      Math.abs(result.evYen / (testCase.steady * 12) - 1) <= 0.15,
      `${label}: 定常時給×12時間（${(testCase.steady * 12).toFixed(0)}円）と±15%で一致すること（実測 ${result.evYen.toFixed(0)}）`
    );
    assert.ok(result.firstHits > 10, `${label}: 12時間なら初当りは何度も来る（${result.firstHits.toFixed(1)}回）`);
  }

  // 17回転・時速250 は時給が2,400円に届かないので、判定は「微妙」で「届きません」を出す
  const weak = shipped({ ...twelveHours, rotationRate: 17, normalSpeed: 250 });
  Object.assign(api.state, continuousState({ ...twelveHours, rotationRate: 17, normalSpeed: 250 }));
  assert.equal(
    api.continuousJudgment(weak).label,
    '微妙',
    '期待値はプラスだが時給が2,400円に届かないので「微妙」'
  );
  assert.equal(
    api.seatSummaryText(weak),
    'この条件では打てる水準（時給2,400円）に届きません',
    '合計期待値がプラスでも、時給が届かなければ「届きません」を出すこと'
  );
  assert.ok(weak.evYen > 0, 'それでも合計期待値そのものはプラス');
}

// 定常時給の中身（終端分布の加重・時速の反映・エンジンの値であること）
{
  const spec = api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].spec;
  const defaults = api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults;
  const weights = spec.jitanTable.map((row) => row.share * Math.pow(1 - spec.hitProbLow, row.spins + defaults.holdSpins));
  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = weights.map((weight) => weight / weightSum);
  assert.ok(Math.abs(shares[0] - 0.0226) < 0.001, '時短90の終端構成比は約2%');
  assert.ok(Math.abs(shares[1] - 0.6168) < 0.001, '時短40の終端構成比は約62%');
  assert.ok(Math.abs(shares[2] - 0.3605) < 0.001, '時短15の終端構成比は約36%');

  Object.assign(api.state, continuousState({ rotationRate: 22, normalSpeed: 250 }));
  const slow = api.steadyHourlyYen();
  Object.assign(api.state, continuousState({ rotationRate: 22, normalSpeed: 350 }));
  const fast = api.steadyHourlyYen();
  assert.ok(fast > slow, '時速が速いほうが定常時給は高いこと');
  assert.ok(Math.abs(slow - 2439) < 1 && Math.abs(fast - 2986) < 1, `22回転の定常時給: 250→${slow.toFixed(0)} / 350→${fast.toFixed(0)}`);

  // エンジンの値をそのまま加重したものであること
  let refEv = 0;
  let refHours = 0;
  spec.jitanTable.forEach((row, index) => {
    const result = api.YUTIME_EXPECTATION_ENGINE.calculate(
      { presetId: 'agnes-pe', currentSpin: api.engineSpinFromCounter(api.PRESETS[0], spec.stSpins + row.spins), rotationRate: 22, availableBalls: 0 },
      { ...defaults, presetId: 'agnes-pe', netBallsPerWin: 100, yenPerBall: 4, spinsPerHour: 350 }
    );
    refEv += shares[index] * result.evYen;
    refHours += shares[index] * result.totalHours;
  });
  assert.ok(Math.abs(fast - refEv / refHours) < 1e-9, '定常時給はエンジンの1サイクル期待値÷所要時間の加重平均');

  Object.assign(api.state, continuousState({ presetId: 'umi-sp5' }));
  assert.equal(api.steadyHourlyYen(), null, '時短振り分けを持たない機種では出さない');
}

// --- 17. ヤメ予定の種類 / 交換率の自由入力 / 数値欄の操作 -----------------------

// ヤメ予定の種類。閉店は種類を選ばせず常に「必ずやめる」
assert.equal(JSON.stringify(api.QUIT_KIND_OPTIONS.map((o) => o.id)), '["soft","hard"]');
assert.equal(api.QUIT_KIND_OPTIONS[0].label, '打ちかけは消化');
assert.equal(api.QUIT_KIND_OPTIONS[1].label, '必ずやめる');
assert.equal(api.DEFAULT_QUIT_KIND, 'soft', '既定は「打ちかけは消化」');
assert.equal(api.state.quitKind, 'soft');

{
  // 現在9:00 ／ ヤメ予定21:00 ／ 閉店23:45
  const times = { nowTime: '09:00', quitTime: '21:00', closeTime: '23:45' };
  Object.assign(api.state, continuousState({ ...times, quitKind: 'soft' }));
  assert.equal(api.remainMinutesFromState(), 720, '打ち終わる予定はヤメ予定まで');
  assert.equal(api.hardRemainMinutesFromState(), 885, '上限は閉店まで');
  assert.equal(api.softDeadlineMinutesFromState(), 720, 'ヤメ予定を過ぎたら新しいサイクルを始めない');
  assert.equal(api.quitKindLabel(), '打ちかけは消化');
  assert.equal(api.quitPlanText(), 'ヤメ予定21:00（打ちかけは消化）／閉店23:45');

  Object.assign(api.state, continuousState({ ...times, quitKind: 'hard' }));
  assert.equal(api.remainMinutesFromState(), 720);
  assert.equal(api.hardRemainMinutesFromState(), 720, '「必ずやめる」ならヤメ予定が上限');
  assert.equal(api.softDeadlineMinutesFromState(), null, '「必ずやめる」に打ちかけの消化は無い');
  assert.equal(api.quitPlanText(), 'ヤメ予定21:00（必ずやめる）／閉店23:45');

  // 閉店だけならヤメ予定の種類は効かない
  Object.assign(api.state, continuousState({ nowTime: '09:00', quitTime: null, closeTime: '21:00', quitKind: 'soft' }));
  assert.equal(api.hardRemainMinutesFromState(), 720, '閉店は常に「必ずやめる」');
  assert.equal(api.softDeadlineMinutesFromState(), null);
  assert.equal(api.quitPlanText(), '閉店21:00');
  // ヤメ予定が閉店より遅ければ閉店が勝つ
  Object.assign(api.state, continuousState({ nowTime: '09:00', quitTime: '23:59', closeTime: '21:00', quitKind: 'soft' }));
  assert.equal(api.remainMinutesFromState(), 720);
  assert.equal(api.hardRemainMinutesFromState(), 720);
  assert.equal(api.softDeadlineMinutesFromState(), null, 'ヤメ予定が閉店より遅ければ打ちかけの消化は起きない');
}

// 検算: 打ちかけは消化 vs 必ずやめる
{
  const times = { currentSpin: 50, rotationRate: 22, normalSpeed: 350, nowTime: '09:00', quitTime: '21:00', closeTime: '23:45' };
  const soft = shipped({ ...times, quitKind: 'soft' });
  const hard = shipped({ ...times, quitKind: 'hard' });
  assert.equal(soft.minutes, 720, '時給の分母はどちらもヤメ予定まで');
  assert.equal(hard.minutes, 720);
  assert.ok(soft.evYen > hard.evYen, `打ちかけを消化するほうが合計期待値は大きいこと: soft ${soft.evYen.toFixed(0)} / hard ${hard.evYen.toFixed(0)}`);
  assert.ok(Math.abs(soft.cutoffYen) < 50, `打ちかけを消化すれば取り残しはほぼ0: ${soft.cutoffYen.toFixed(1)}円`);
  assert.equal(Math.abs(soft.cutoffYen), 0, '閉店まで余裕があれば取り残しは0');
  assert.ok(hard.cutoffYen < -100, `「必ずやめる」なら取り残しが出ること: ${hard.cutoffYen.toFixed(0)}円`);
  assert.ok(soft.firstHits > hard.firstHits, '打ちかけを消化するぶん初当りも増える');

  // 閉店が近ければ、打ちかけの消化中でも閉店が上限として効く
  const capped = shipped({ ...times, quitKind: 'soft', closeTime: '21:15' });
  assert.equal(capped.minutes, 720, '打ち終わる予定はヤメ予定のまま');
  assert.ok(capped.cutoffYen < -100, `閉店が上限として効き、取り残しが出ること: ${capped.cutoffYen.toFixed(0)}円`);
  assert.ok(capped.evYen < soft.evYen, '閉店が近いぶん、消化しきれず期待値は下がる');
  assert.ok(capped.evYen > hard.evYen, 'それでも15分ぶんは消化できるので「必ずやめる」よりは高い');
  assert.match(logicBlock, /if \(softDeadline !== null && at >= softDeadline - eps\) \{ stopIndex = i; break; \}/, 'ヤメ予定を過ぎたら新しいサイクルを始めないこと');
}

// 交換率：チップ3つ＋自由入力
assert.equal(JSON.stringify(api.EXCHANGE_OPTIONS.map((o) => o.balls)), '[25,28,33]', '30玉のチップは廃止');
assert.equal(api.EXCHANGE_OPTIONS[0].label, '等価(25玉)');
assert.equal(api.EXCHANGE_MIN_BALLS, 20);
assert.equal(api.EXCHANGE_MAX_BALLS, 40);
{
  Object.assign(api.state, continuousState({ exchangeBalls: 25, exchangeCustom: null }));
  assert.equal(api.exchangeBallsFromState(), 25, '自由入力が空ならチップの値');
  assert.equal(api.yenPerBallFromState(), 4);
  assert.equal(api.exchangeMessage(), '');
  Object.assign(api.state, continuousState({ exchangeBalls: 25, exchangeCustom: 28.01 }));
  assert.equal(api.exchangeBallsFromState(), 28.01, '自由入力があればそちらを使う');
  assert.ok(Math.abs(api.yenPerBallFromState() - 100 / 28.01) < 1e-12, '交換単価＝100÷入力玉数');
  assert.ok(Math.abs(api.yenPerBallFromState() - 3.5702) < 0.0001, `28.01玉 → 3.570円/玉（実測 ${api.yenPerBallFromState().toFixed(4)}）`);
  for (const balls of [19.9, 40.1, 0, -5]) {
    Object.assign(api.state, continuousState({ exchangeCustom: balls }));
    assert.equal(api.exchangeMessage(), '交換率は20〜40玉で入力してください', `範囲外 ${balls} は案内を出す`);
    assert.equal(api.missingMessage(), '交換率は20〜40玉で入力してください', '範囲外なら計算しないこと');
    assert.equal(api.calculateFromState().result, null, '範囲外は「—」になること');
    assert.equal(api.continuousFromState().result, null, '打ち切りモードでも「—」になること');
  }
  for (const balls of [20, 28.01, 40]) {
    Object.assign(api.state, continuousState({ exchangeCustom: balls }));
    assert.equal(api.exchangeMessage(), '', `範囲内 ${balls} は通す`);
  }

  // v3のDSG高岡（28.01）と同条件で同じ期待値になること
  const pageCase = evaluate({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: 100, exchangeBalls: 25, exchangeCustom: 28.01 }).result;
  const directCase = api.YUTIME_EXPECTATION_ENGINE.calculate(
    { presetId: 'agnes-pe', currentSpin: api.engineSpinFromCounter(api.PRESETS[0], 150), rotationRate: 17, availableBalls: 0 },
    { ...api.YUTIME_EXPECTATION_ENGINE.presets['agnes-pe'].defaults, presetId: 'agnes-pe', netBallsPerWin: 100, yenPerBall: 100 / 28.01 }
  );
  assert.ok(Math.abs(pageCase.evYen - directCase.evYen) < 1e-9, '自由入力28.01がエンジンへそのまま渡ること');
  // 28玉のチップとは違う値になる（28.01は少しだけ悪い）
  const chipCase = evYenOf({ presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17, payout: 100, exchangeBalls: 28 });
  assert.ok(Math.round(pageCase.evYen) < chipCase, '28.01玉は28玉よりわずかに不利');

  // ?exchange= は小数も受け付ける
  context.window.location.search = '?exchange=28.01';
  assert.equal(api.exchangeFromUrl(), 28.01);
  context.window.location.search = '?exchange=25';
  assert.equal(api.exchangeFromUrl(), 25);
  for (const search of ['?exchange=19.9', '?exchange=40.1', '?exchange=abc', '?exchange=0', '']) {
    context.window.location.search = search;
    assert.equal(api.exchangeFromUrl(), null, `${search || '未指定'} は null`);
  }
  context.window.location.search = '';
  assert.match(calcHtml, /state\.exchangeCustom = initialExchange;/, '?exchange= の値をチップに無ければ自由入力へ入れること');
}

// 数値欄の操作（タップで空・離れたら戻す）と inputmode
{
  assert.match(calcHtml, /function bindNumberInput\(id, assign\)/, '数値欄の挙動は1つの関数にまとめること');
  assert.match(calcHtml, /element\.addEventListener\("focus", \(\) => \{\n\s+previous = element\.value;\n\s+element\.value = "";\n\s+\}\);/, 'タップした瞬間に空にすること');
  assert.match(calcHtml, /element\.addEventListener\("blur", \(\) => \{\n\s+if \(element\.value !== ""\) return;\n\s+element\.value = previous;\n\s+assign\(numberOrNull\(previous\)\);/, '何も入れずに離れたら元の値へ戻すこと');
  for (const id of ['currentSpin', 'rotationRate', 'payout', 'mochidamaBalls', 'saipureiBalls', 'normalSpeed', 'exchangeCustom']) {
    assert.match(calcHtml, new RegExp(`bindNumberInput\\("${id}"`), `${id} は共通の数値欄挙動を使うこと`);
    const field = new RegExp(`<input id="${id}" type="number"[^>]*inputmode="(numeric|decimal)"`);
    assert.match(calcHtml, field, `${id} は数字キーボードを出すこと`);
  }
  // 時刻の欄は端末の時刻ピッカーのまま
  for (const id of ['nowTime', 'quitTime', 'closeTime']) {
    assert.match(calcHtml, new RegExp(`<input id="${id}" type="time">`), `${id} は type="time" のまま`);
    assert.doesNotMatch(calcHtml, new RegExp(`bindNumberInput\\("${id}"`), `${id} に数値欄の挙動は付けないこと`);
  }
}

// ヤメ予定・閉店・現在時刻は打ち切りモードだけ
assert.match(calcHtml, /byId\("timeRow"\)\.style\.display = continuous \? "" : "none";/, '時刻の入力行は打ち切りモードだけに出すこと');
assert.match(calcHtml, /<div class="chips" id="quitKindChips"/, 'ヤメ予定の種類は時刻の行に置くこと（＝遊タイム狙いでは隠れる）');
{
  const timeRow = sectionOf(calcHtml, 'yutime-calc.html', '<div class="row" id="timeRow">', '</div>\n  </div>');
  for (const id of ['nowTime', 'quitTime', 'closeTime', 'quitKindChips']) {
    assert.ok(timeRow.includes(id), `${id} は timeRow の中にあること（モードで隠れる）`);
  }
}

console.log('yutime-calc: OK');

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'yutime-v3.html'), 'utf8');
const design = fs.readFileSync(path.join(root, 'docs', 'yutime-v3-design.md'), 'utf8');

function section(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  assert.notEqual(start, -1, `${startMarker} not found`);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(end, -1, `${endMarker} not found after ${startMarker}`);
  return html.slice(start, end);
}

const hitWizard = section('function openHitWizard', 'function hitResetOptions');
const runWizard = section('function runWizard', 'function wizardInputHtml');
const hitResetPrompt = section('function openHitResetPrompt', 'function openEndWizard');
const updateMochidamaBalance = section('function updateMochidamaBalanceWithUndo', 'function investmentTotals');
const transferSummary = section('function transferSummaryForSession', 'function balanceForSource');
const balanceStartValueForCurrent = section('function balanceStartValueForCurrent', 'function currentBalanceForStartKey');
const currentBalanceForStartKey = section('function currentBalanceForStartKey', 'function updateMochidamaBalanceWithUndo');
const renderRunning = section('function renderRunning', 'function renderLedger');
const renderLedger = section('function renderLedger', 'function renderStorageNote');
const openYutimeEnterForm = section('function openYutimeEnterForm', 'function openRateSummary');
const openSessionEditor = section('function openSessionEditor', 'function fieldHtml');
const deriveSession = section('function deriveSession', 'function yutimeEnterSpinForRate');
const yutimeEnterSpinForRate = section('function yutimeEnterSpinForRate', 'function machineStats');
const addInvestment = section('function addInvestment', 'function deleteInvestment');
const sourceUnavailableMessage = section('function sourceUnavailableMessage', 'function rateText');
const runningPanelRate = section('function runningPanelRate', 'function runningYutimeRemaining');
const runningSpinCount = section('function runningSpinCount', 'function investmentSnapshot');
const investmentSnapshot = section('function investmentSnapshot', 'function historyEntries');
const investmentTotalsBlock = section('function investmentTotals', 'function transferSummaryForSession');
const openBalanceEditForm = section('function openBalanceEditForm', 'function openSpinEditForm');
const machineSummary = section('function machineModelSummaryHtml', 'function machineDetailFormHtml');
const machineDetailForm = section('function machineDetailFormHtml', 'function openMachineDetail');
const openMachineDetail = section('function openMachineDetail', 'function renderMachineExpectation');
const machineMemoHelpers = section('function machineMemoEntriesForDate', 'function nailRatingSummary');
const nailRatingSection = section('function nailRatingSummary', 'function machineModelSummaryHtml');
const machineHistoryHtml = section('function machineHistoryHtml', 'function bindNailRatingChips');
const normalizeNailRatingBlock = section('function normalizeRatingValue', 'function normalizeStartEv');
const machineModelDisplay = section('function machineModelDisplay', 'function applyPresetToMachine');
const columnPresetApply = section('function applyColumnPresetsToMachines', 'function machineHasIndividualSetting');
const normalizeData = section('function normalizeData', 'function persist');
const normalizeDailyStateBlock = section('function normalizeDailyState', 'function migrateStoreAssumedRatesToMaps');
const bindNailRatingChips = section('function bindNailRatingChips', 'function readNailRatingFromDom');
const readMachineMemoForm = section('function readMachineMemoForm', 'function readMachineDetailForm');
const islandEditor = section('function islandEditorHtml', 'function bindIslandEditor');
const readIslandDraft = section('function readIslandDraftFromDom', 'function readIslandSideFromDom');
const normalizeIsland = section('function normalizeIsland', 'function textMapToIslands');
const parseIslandLayout = section('function parseIslandLayout', 'function expandIslandSide');
const renderMachineMap = section('function renderMachineMap', 'function machineButtonHtml');
const renderClosingInputModal = section('function renderClosingInputModal', 'function directionPreviewText');
const morningStateSummary = section('function morningStateSummary', 'function renderMorningCheckModal');
const renderMorningCheckModal = section('function renderMorningCheckModal', 'function morningDirectionPreviewText');
const saveMorningCurrent = section('function saveMorningCurrent', 'function saveMorningAndAdvance');
const modalStyle = section('.modal-actions', '.closing-display');
const style = section('.source-chip-row', '.unified-invest-row');

assert.match(hitWizard, /openHitResetPrompt\(session\);\s*\}, \{ firstBackCancels: true \}\);/);
assert.match(runWizard, /id="backStepBtn" \$\{index === 0 && !options\.firstBackCancels \? "disabled" : ""\}>戻る<\/button>/);
assert.match(
  runWizard,
  /if \(index === 0 && options\.firstBackCancels\) \{\s*closeModal\(\);\s*return;\s*\}\s*if \(index > 0\) \{\s*draft\[step\.key\] = readWizardValue\(step\);\s*index -= 1;\s*renderStep\(\);/
);
assert.match(
  runWizard,
  /byId\("nextStepBtn"\)\.addEventListener\("click", \(\) => \{\s*draft\[step\.key\] = readWizardValue\(step\);/
);
assert.ok(hitWizard.includes('key: "hitSpin"'), 'hitSpin step should remain in the hit wizard');
assert.ok(hitResetPrompt.includes('data-hit-reset'), 'reset chip buttons should remain after hit completion');
assert.ok(hitResetPrompt.includes('data-close'), 'reset chip close button should remain unchanged');
assert.match(hitResetPrompt, /id="hitMochidamaValue"/);
assert.match(hitResetPrompt, /id="saveHitMochidamaBtn"/);
assert.match(hitResetPrompt, /closeModal\(\);\s*setCurrentSpinWithUndo\(session, value\);/);
assert.doesNotMatch(hitResetPrompt, /saveHitMochidamaInput\(session, \{ silentEmpty: true \}\)/);
assert.match(hitResetPrompt, /if \(!raw\) return false;/);
assert.match(updateMochidamaBalance, /session\.startMochidama = balanceStartValueForCurrent\(session, "startMochidama", value\);/);
assert.match(updateMochidamaBalance, /undo: \(\) => \{\s*session\.startMochidama = previous;/);
assert.match(balanceStartValueForCurrent, /if \(key === "startMochidama"\) return value \+ totals\.mochidamaBalls;/);
assert.match(balanceStartValueForCurrent, /if \(key === "startSaipurei"\) return value \+ totals\.saipureiBalls;/);
assert.match(balanceStartValueForCurrent, /return value - chargeTotal \+ totals\.cashYen;/);
assert.match(currentBalanceForStartKey, /if \(key === "startMochidama"\) return balances\.mochidama;/);
assert.match(currentBalanceForStartKey, /if \(key === "startSaipurei"\) return balances\.saipurei;/);
assert.match(currentBalanceForStartKey, /if \(key === "startCredit"\) return balances\.credit;/);
assert.match(transferSummary, /investYen: totals\.cashYen,/);
assert.match(transferSummary, /recoverYen: normalizeNumber\(session\.settlementRecoverYen\) \?\? 0,/);
assert.match(transferSummary, /withdrawBalls: totals\.mochidamaBalls \+ totals\.saipureiBalls,/);
assert.match(transferSummary, /depositBalls: finalMochidamaForCarryover\(session\) \?\? 0/);
assert.match(transferSummary, /function transferYenText\(value\) \{\s*return `\$\{Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\("ja-JP"\)\}円`;/);
assert.match(transferSummary, /function transferBallText\(value\) \{\s*return Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\("ja-JP"\);/);
assert.match(transferSummary, /投資\$\{transferYenText\(summary\.investYen\)\}\/回収\$\{transferYenText\(summary\.recoverYen\)\}\/引出\$\{transferBallText\(summary\.withdrawBalls\)\}個\/預入\$\{transferBallText\(summary\.depositBalls\)\}個/);
assert.match(transferSummary, /navigator\.clipboard\?\.writeText/);
assert.match(renderLedger, /session\.status === "completed" \? transferSummaryHtml\(session\) : ""/);
assert.match(renderLedger, /data-copy-transfer/);
assert.match(openSessionEditor, /fieldHtml\("settlementRecoverYen", "回収金額", session\.settlementRecoverYen\)/);
assert.match(openSessionEditor, /"zanhoryuBalls", "settlementRecoverYen"/);
assert.match(openSessionEditor, /investmentTotalEditorHtml\(session\)/);
assert.match(openSessionEditor, /applyInvestmentTotalAdjustments\(session\);/);
assert.match(investmentTotalsBlock, /adjustment: true/);
assert.match(investmentTotalsBlock, /spinAt: null/);
assert.match(investmentTotalsBlock, /phase: "normal"/);
assert.match(investmentSnapshot, /if \(!item \|\| item\.adjustment\) return null;/);
assert.match(investmentSnapshot, /return investment\.adjustment \? sum : sum \+ investmentToBalls\(investment, store\);/);
assert.match(normalizeData, /adjustment: item\.adjustment === true/);
assert.doesNotMatch(html, /台帳/);
const transferContext = vm.createContext({
  __copied: '',
  __session: null,
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  investmentSource(item) {
    return item?.source || item?.type || 'cash';
  },
  investmentTotals(session) {
    return (session.investments || []).reduce((totals, item) => {
      const source = item.source || item.type || 'cash';
      if (source === 'cash') totals.cashYen += Number(item.amount || 0);
      if (source === 'saipurei') totals.saipureiBalls += Number(item.amount || 0);
      if (source === 'mochidama') totals.mochidamaBalls += Number(item.amount || 0);
      return totals;
    }, { cashYen: 0, saipureiBalls: 0, mochidamaBalls: 0 });
  },
  finalMochidamaForCarryover(session) {
    return session.endTotalBalls === null || session.endTotalBalls === undefined ? null : Number(session.endTotalBalls || 0) + Number(session.zanhoryuBalls || 0);
  },
  escapeHtml(value) {
    return String(value ?? '');
  },
  navigator: {
    clipboard: {
      writeText(text) {
        transferContext.__copied = text;
        return Promise.resolve();
      }
    }
  },
  document: { createElement: () => ({ select() {}, remove() {} }), body: { appendChild() {} }, execCommand() {} },
  showToast() {},
  findSession() {
    return transferContext.__session;
  }
});
new vm.Script(transferSummary).runInContext(transferContext);
const investmentAdjustContext = vm.createContext({
  __inputs: {
    editInvest_mochidama: { value: '1000' },
    editInvest_saipurei: { value: '500' },
    editInvest_cash: { value: '2500' }
  },
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  investmentSource(item) {
    return item?.source || item?.type || 'cash';
  },
  currentTime() {
    return '12:34';
  },
  byId(id) {
    return investmentAdjustContext.__inputs[id] || null;
  },
  escapeHtml(value) {
    return String(value ?? '');
  }
});
new vm.Script(`
  ${investmentTotalsBlock}
  globalThis.session = {
    investments: [
      { type: 'mochidama', source: 'mochidama', amount: 6125, phase: 'normal', spinAt: 300 },
      { type: 'saipurei', source: 'saipurei', amount: 750, phase: 'normal', spinAt: 310 },
      { type: 'cash', source: 'cash', amount: 500, phase: 'normal', spinAt: 320 }
    ]
  };
  applyInvestmentTotalAdjustments(globalThis.session);
  globalThis.totals = investmentTotals(globalThis.session);
`).runInContext(investmentAdjustContext);
assert.equal(investmentAdjustContext.session.investments.length, 6);
assert.equal(JSON.stringify(investmentAdjustContext.session.investments.slice(3).map((item) => ({
    source: item.source,
    amount: item.amount,
    phase: item.phase,
    spinAt: item.spinAt,
    adjustment: item.adjustment
  }))), JSON.stringify([
    { source: 'mochidama', amount: -5125, phase: 'normal', spinAt: null, adjustment: true },
    { source: 'saipurei', amount: -250, phase: 'normal', spinAt: null, adjustment: true },
    { source: 'cash', amount: 2000, phase: 'normal', spinAt: null, adjustment: true }
  ]));
assert.equal(JSON.stringify(investmentAdjustContext.totals), JSON.stringify({ cashYen: 2500, saipureiBalls: 500, mochidamaBalls: 1000 }));
const transferFixture = {
  id: 's_transfer',
  settlementRecoverYen: null,
  endTotalBalls: 4750,
  zanhoryuBalls: null,
  investments: [
    { source: 'mochidama', amount: 250 },
    { source: 'saipurei', amount: 125 },
    { source: 'cash', amount: 0 }
  ]
};
transferContext.__session = transferFixture;
assert.equal(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  '投資0円/回収0円/引出375個/預入4,750個'
);
vm.runInContext("copyTransferSummary('s_transfer')", transferContext);
assert.equal(transferContext.__copied, '投資0円/回収0円/引出375個/預入4,750個');
assert.match(openBalanceEditForm, /const currentBalance = currentBalanceForStartKey\(session, key\);/);
assert.match(openBalanceEditForm, /value="\$\{escapeHtml\(currentBalance \?\? ""\)\}"/);
assert.match(openBalanceEditForm, /session\[key\] = value === null \? null : balanceStartValueForCurrent\(session, key, value\);/);
assert.match(runningSpinCount, /const spins = Number\(session\.currentSpin\) - Number\(session\.startSpin\);\s*return spins >= 0 \? spins : null;/);
assert.match(runningPanelRate, /return inputBalls > 0 && spins >= 0 \? spins \/ inputBalls \* 250 : null;/);
assert.ok(design.includes('スマパチ対応: カード玉と台内クレジットの分離管理（封入式）。当面は台に移した分も持ち玉として扱う運用。'));
assert.match(renderRunning, /<span>\$\{escapeHtml\(option\.label\)\}<\/span><strong>\$\{sourceChipBalanceText\(balance\)\}<\/strong>/);
assert.match(renderRunning, /class="primary\$\{selectedCanUse \? "" : " is-low"\}" id="unifiedInvestBtn"/);
assert.ok(
  renderRunning.indexOf('id="unifiedInvestBtn"') < renderRunning.indexOf('id="openChargeBtn"')
  && renderRunning.indexOf('id="openChargeBtn"') < renderRunning.indexOf('id="openRunningMachineMemoBtn"')
  && renderRunning.indexOf('id="openRunningMachineMemoBtn"') < renderRunning.indexOf('id="toggleStickyBtn"'),
  'running controls should be ordered invest, charge, memo, sticky'
);
assert.doesNotMatch(renderRunning, /id="unifiedInvestBtn"[^>]*disabled/);
assert.match(style, /\.source-chip\.selected \{\s*border-color: var\(--accent\);\s*background: var\(--accent\);\s*color: #fff;/);
assert.match(sourceUnavailableMessage, /if \(balance === null\) return `\$\{label\}が未入力です。`;/);
assert.match(sourceUnavailableMessage, /if \(balance < amount\) return `\$\{label\}がありません。値をタップして修正するか、他のソースを選んでください。`;/);
assert.match(addInvestment, /const unavailableMessage = sourceUnavailableMessage\(session, source, amount\);\s*if \(unavailableMessage\) \{\s*showToast\(unavailableMessage, "error"\);\s*return;\s*\}\s*const item = \{ type: source, source, amount/);
assert.match(html, /const SCHEMA_VERSION = 23;/);
assert.match(html, /yutimeEnterSpin: null,/);
assert.match(openYutimeEnterForm, /const spinPreset = session\.yutimeEnterSpin \?\? session\.currentSpin \?\? session\.startSpin;/);
assert.match(openYutimeEnterForm, /id="yutimeSpin"/);
assert.match(openYutimeEnterForm, /session\.yutimeEnterSpin = normalizeNumber\(byId\("yutimeSpin"\)\.value\);/);
assert.match(openSessionEditor, /fieldHtml\("yutimeEnterSpin", "遊タイム突入時の回転数", session\.yutimeEnterSpin\)/);
assert.match(openSessionEditor, /"yutimeEnterBalls", "yutimeEnterSpin", "endTotalHits"/);
assert.match(deriveSession, /const yutimeNormalEndSpin = !hasHit && \(session\.hitVia === "yutime" \|\| session\.yutimeEnterBalls !== null\) \? yutimeEnterSpinForRate\(session, preset\) : null;/);
assert.match(deriveSession, /session\.hitVia === "yutime" \|\| session\.yutimeEnterBalls !== null \? yutimeNormalEndSpin : session\.endSpin/);
assert.match(yutimeEnterSpinForRate, /const explicitSpin = normalizeNumber\(session\.yutimeEnterSpin\);\s*if \(explicitSpin !== null\) return explicitSpin;/);
assert.match(yutimeEnterSpinForRate, /const inferred = tenjo - prevSpin;\s*return inferred >= 0 \? inferred : null;/);
assert.ok(design.includes('schema 23 Machine 1件サンプル'));

assert.match(openMachineDetail, /function openMachineDetail\(daiNo, machineFormExpanded = false\)/);
assert.match(openMachineDetail, /\$\{machineMemoSectionHtml\(machine\)\}/);
assert.match(openMachineDetail, /bindMachineMemoAdd\(machine\);/);
assert.doesNotMatch(openMachineDetail, /id="machineMemo"|byId\("machineMemo"\)|memoDraft/);
assert.match(openMachineDetail, /\$\{nailRatingSectionHtml\(machine\)\}/);
assert.match(openMachineDetail, /\$\{machineHistoryHtml\(machine\)\}/);
assert.match(openMachineDetail, /id="toggleMachineHistoryBtn">履歴<\/button>/);
assert.match(openMachineDetail, /panel\.hidden = hidden;/);
assert.match(openMachineDetail, /bindNailRatingChips\(machine\);/);
assert.match(openMachineDetail, /\$\{machineModelSummaryHtml\(machine\)\}\s*\$\{machineFormExpanded \? machineDetailFormHtml\(machine\) : ""\}/);
assert.match(openMachineDetail, /\$\{machineFormExpanded \? '<button id="saveMachineBtn">[^']+<\/button>' : ""\}/);
assert.match(openMachineDetail, /if \(machineFormExpanded\) readMachineDetailForm\(machine\);\s*else readMachineMemoForm\(machine\);/);
assert.match(openMachineDetail, /openMachineDetail\(daiNo, true\)/);
assert.match(machineMemoHelpers, /function machineMemoSectionHtml\(machine, inputId = "machineMemoText", buttonId = "addMachineMemoBtn"\)/);
assert.match(machineMemoHelpers, /machine\.memoEntries\.unshift/);
assert.match(machineMemoHelpers, /id: cryptoId\("memo"\)/);
assert.match(machineMemoHelpers, /date: today\(\)/);
assert.doesNotMatch(machineMemoHelpers, /data-delete|data-edit/);
assert.match(html, /const DAILY_NAIL_RATING_KEY = "heso";/);
assert.match(html, /const NAIL_RATING_KEYS = \["yori", "michi", "nekase", "through", "warp"\];/);
assert.match(html, /const NAIL_DISPLAY_KEYS = \["heso", \.\.\.NAIL_RATING_KEYS\];/);
assert.ok(html.indexOf('const NAIL_RATING_KEYS') < html.indexOf('let data = loadData();'), 'nail rating constants must be initialized before loadData');
assert.match(html, /heso: "ヘソ"/);
assert.match(html, /through: "スルー"/);
assert.match(html, /warp: "ワープ"/);
assert.doesNotMatch(html, /右打ち/);
assert.match(normalizeNailRatingBlock, /const input = source && typeof source === "object" \? source : \{\};/);
assert.match(nailRatingSection, /data-nail-rating="\$\{buttonValue\}"/);
assert.match(nailRatingSection, /前日参考: \$\{escapeHtml\(latestHeso\.value\)\}/);
assert.match(machineHistoryHtml, /filter\(\(session\) => session\.machineId === machine\.id\)/);
assert.match(machineHistoryHtml, /ヘソ評価 \$\{escapeHtml\(hesoText\)\}/);
assert.match(machineHistoryHtml, /heso === null \? "未記録"/);
assert.match(machineHistoryHtml, /machineMemoEntriesForDate\(machine, date\)/);
assert.match(machineHistoryHtml, /machine\.memoEntries \|\| \[\]\)\.forEach/);
assert.match(machineHistoryHtml, /if \(entry\?\.date\) dates\.add\(entry\.date\);/);
assert.doesNotMatch(machineHistoryHtml, /台メモ（現在）|未記入/);
assert.match(machineHistoryHtml, /deriveSession\(session, machine\)/);
assert.ok(design.includes('B47 台詳細の台別履歴'));
assert.ok(design.includes('B48 台メモの蓄積型ログ化'));
assert.match(bindNailRatingChips, /function bindNailRatingChips\(machine\)/);
assert.match(bindNailRatingChips, /row\.dataset\.nailKey === DAILY_NAIL_RATING_KEY/);
assert.match(bindNailRatingChips, /state\.hesoRating = rating;/);
assert.match(bindNailRatingChips, /machine\.nailRating = readNailRatingFromDom\(\);/);
assert.doesNotMatch(bindNailRatingChips, /showToast|persistWithToast/);
assert.doesNotMatch(readMachineMemoForm, /nailRating|readNailRatingFromDom/);
const nailNormalizeContext = vm.createContext({});
new vm.Script(`
  const NAIL_RATING_KEYS = ["yori", "michi", "nekase", "through", "warp"];
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  ${normalizeNailRatingBlock}
  globalThis.nailRatings = [
    normalizeNailRating(undefined),
    normalizeNailRating(null),
    normalizeNailRating("legacy"),
    normalizeNailRating({ heso: "4", yori: "bad", michi: 0, nekase: 5, migi: 3, through: 4, warp: 2 })
  ];
`).runInContext(nailNormalizeContext);
assert.equal(JSON.stringify(nailNormalizeContext.nailRatings[0]), JSON.stringify({ yori: null, michi: null, nekase: null, through: null, warp: null }));
assert.equal(JSON.stringify(nailNormalizeContext.nailRatings[1]), JSON.stringify({ yori: null, michi: null, nekase: null, through: null, warp: null }));
assert.equal(JSON.stringify(nailNormalizeContext.nailRatings[2]), JSON.stringify({ yori: null, michi: null, nekase: null, through: null, warp: null }));
assert.equal(JSON.stringify(nailNormalizeContext.nailRatings[3]), JSON.stringify({ yori: null, michi: null, nekase: 5, through: 4, warp: 2 }));
const legacyMachineContext = vm.createContext({});
new vm.Script(`
  const SCHEMA_VERSION = 23;
  const DEFAULT_LEND_RATE = 4;
  const DEFAULT_EXCHANGE_BALLS = 25;
  const DEFAULT_NET_BALLS_PER_WIN = 1400;
  const RAM_CLEAR_VALUE = "cleared";
  const RAM_NOT_CLEARED_VALUE = "not_cleared";
  const RAM_UNKNOWN_VALUE = "unknown";
  const MACHINE_PRESETS = [{ id: "umi-sp5", name: "P大海物語5スペシャル", evSupported: true, defaults: { netBallsPerWin: 1400 } }];
  function cryptoId(prefix) { return prefix + "_legacy"; }
  function nowIso() { return "2026-08-07T00:00:00.000Z"; }
  function defaultData() {
    return {
      version: SCHEMA_VERSION,
      activeStoreId: null,
      stores: [],
      layouts: {},
      machines: [],
      sessions: [],
      dailyState: {},
      presetSettings: {},
      labelsByStore: {},
      meta: {}
    };
  }
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function positiveNumberOrDefault(value, fallback) {
    const n = normalizeNumber(value);
    return n !== null && n > 0 ? n : fallback;
  }
  function normalizeExchangeBalls(value) {
    const n = normalizeNumber(value);
    return n !== null && n >= 20 && n <= 50 ? Number(n.toFixed(2)) : DEFAULT_EXCHANGE_BALLS;
  }
  function exchangeBallsFromStore(store) {
    if (store?.exchangeBalls !== undefined) return normalizeExchangeBalls(store.exchangeBalls);
    const oldRate = normalizeNumber(store?.exchangeRate);
    if (oldRate !== null && oldRate >= 2 && oldRate <= 5) return normalizeExchangeBalls(100 / oldRate);
    if (oldRate !== null && oldRate >= 20 && oldRate <= 50) return normalizeExchangeBalls(oldRate);
    return DEFAULT_EXCHANGE_BALLS;
  }
  function normalizeInvestmentSource(value) { return value === "mochidama" || value === "saipurei" ? value : "cash"; }
  function normalizeRamClear(value) { return value === RAM_CLEAR_VALUE || value === RAM_NOT_CLEARED_VALUE || value === RAM_UNKNOWN_VALUE ? value : null; }
  function isDateString(value) { return /^\\d{4}-\\d{2}-\\d{2}$/.test(String(value || "")); }
  const NAIL_RATING_KEYS = ["yori", "michi", "nekase", "through", "warp"];
  ${normalizeNailRatingBlock}
  function presetById(id) { return MACHINE_PRESETS.find((preset) => preset.id === id) || null; }
  function presetByName(name) { return MACHINE_PRESETS.find((preset) => preset.name === name) || null; }
  function normalizeMachinePresetId(machine) {
    if (presetById(machine?.presetId)) return machine.presetId;
    const matched = presetByName(machine?.modelName || "");
    return matched ? matched.id : "";
  }
  function normalizeLayouts(value) { return value && typeof value === "object" ? value : {}; }
  function migrateStoreAssumedRatesToMaps() {}
  function blankSession() {
    return {
      startTotalHits: null,
      endTotalHits: null,
      currentSpin: null,
      startEv: null,
      carriedFromSessionId: null,
      yutimeEnterSpin: null,
      yutimeEnterTime: null,
      settlementRecoverYen: null,
      investments: [],
      charges: []
    };
  }
  function normalizeDailyState(source) { return source && typeof source === "object" ? source : {}; }
  ${normalizeData}
  globalThis.normalizedLegacy = normalizeData({
    version: 21,
    activeStoreId: "st_1",
    stores: [{ id: "st_1", name: "Legacy Store", isPersonal: true, createdAt: "2026-08-01T00:00:00.000Z" }],
    layouts: {},
    machines: [{ id: "m_1", storeId: "st_1", daiNo: "101", modelName: "Legacy Machine", roundBalls: 140, memo: "old memo", createdAt: "2026-08-06T12:00:00.000Z", nailRating: { heso: 4, yori: 3, michi: 2, nekase: 1, migi: 5, through: 4, warp: 2 } }],
    sessions: [],
    dailyState: {}
  });
`).runInContext(legacyMachineContext);
assert.equal(legacyMachineContext.normalizedLegacy.machines.length, 1);
assert.equal(legacyMachineContext.normalizedLegacy.machines[0].daiNo, "101");
assert.equal(Object.prototype.hasOwnProperty.call(legacyMachineContext.normalizedLegacy.machines[0], 'memo'), false);
assert.equal(JSON.stringify(legacyMachineContext.normalizedLegacy.machines[0].memoEntries), JSON.stringify([{ id: 'memo_legacy', date: '2026-08-06', text: 'old memo', createdAt: '2026-08-06T12:00:00.000Z' }]));
assert.equal(JSON.stringify(legacyMachineContext.normalizedLegacy.machines[0].nailRating), JSON.stringify({ yori: 3, michi: 2, nekase: 1, through: 4, warp: 2 }));
const dailyHesoContext = vm.createContext({});
new vm.Script(`
  const RAM_CLEAR_VALUE = "cleared";
  const RAM_NOT_CLEARED_VALUE = "not_cleared";
  const RAM_UNKNOWN_VALUE = "unknown";
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function normalizeRatingValue(value) {
    const number = normalizeNumber(value);
    return Number.isInteger(number) && number >= 1 && number <= 5 ? number : null;
  }
  function normalizeRamClear(value) {
    return value === RAM_CLEAR_VALUE || value === RAM_NOT_CLEARED_VALUE || value === RAM_UNKNOWN_VALUE ? value : null;
  }
  function isDateString(value) {
    return /^\\d{4}-\\d{2}-\\d{2}$/.test(String(value || ""));
  }
  ${normalizeDailyStateBlock}
  globalThis.normalizedDaily = normalizeDailyState({
    m_1: {
      "2026-08-07": { date: "2026-08-07", hesoRating: "4", ramClear: "not_cleared" },
      "2026-08-08": { date: "2026-08-08", hesoRating: "bad" }
    }
  }, [{ id: "m_1" }]);
`).runInContext(dailyHesoContext);
assert.equal(JSON.stringify(dailyHesoContext.normalizedDaily), JSON.stringify({
  m_1: {
    "2026-08-07": { date: "2026-08-07", ramClear: "not_cleared", hesoRating: 4 }
  }
}));
const machineHistoryContext = vm.createContext({
  data: {
    sessions: [
      { id: 's_target_1', machineId: 'm_1', date: '2026-08-08', startTime: '09:00', status: 'completed', createdAt: '2026-08-08T00:00:02.000Z' },
      { id: 's_target_2', machineId: 'm_1', date: '2026-08-08', startTime: '12:00', status: 'completed', createdAt: '2026-08-08T00:00:03.000Z' },
      { id: 's_other', machineId: 'm_2', date: '2026-08-08', startTime: '10:00', status: 'completed', createdAt: '2026-08-08T00:00:04.000Z' },
      { id: 's_target_3', machineId: 'm_1', date: '2026-08-07', startTime: '18:00', status: 'completed', createdAt: '2026-08-07T00:00:01.000Z' }
    ],
    dailyState: {
      m_1: {
        '2026-08-08': { date: '2026-08-08', hesoRating: 4 },
        '2026-08-06': { date: '2026-08-06', hesoRating: 2 }
      },
      m_2: {
        '2026-08-08': { date: '2026-08-08', hesoRating: 5 }
      }
    }
  },
  normalizeRatingValue(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 5 ? number : null;
  },
  dailyHesoRating(machineId, date) {
    return machineHistoryContext.normalizeRatingValue(machineHistoryContext.data.dailyState?.[machineId]?.[date]?.hesoRating);
  },
  normalizeMemoEntries(entries) {
    return Array.isArray(entries) ? entries : [];
  },
  deriveSession(session) {
    return session.id === 's_target_3' ? { normalSpins: 90, rate: null } : { normalSpins: 100, rate: 16.5 };
  },
  numberText(value, fallback = '') {
    return value === null || value === undefined ? fallback : String(value);
  },
  rateText(derived) {
    return derived.rate === null ? '-' : derived.rate.toFixed(1);
  },
  shortDate(date) {
    return date.slice(5).replace('-', '/');
  },
  escapeHtml(value) {
    return String(value ?? '');
  }
});
new vm.Script(`${machineMemoHelpers}
  ${machineHistoryHtml}
  globalThis.historyHtml = machineHistoryHtml({ id: 'm_1', memoEntries: [
    { id: 'memo_1', date: '2026-08-08', text: '寄り注意', createdAt: '2026-08-08T10:00:00.000Z' },
    { id: 'memo_2', date: '2026-08-08', text: 'ワープ良化', createdAt: '2026-08-08T11:00:00.000Z' },
    { id: 'memo_only', date: '2026-08-05', text: 'メモだけの日', createdAt: '2026-08-05T10:00:00.000Z' },
    { id: 'memo_unknown', date: null, text: '日付不明メモ', createdAt: '2026-08-01T00:00:00.000Z' }
  ] });
`).runInContext(machineHistoryContext);
assert.match(machineHistoryContext.historyHtml, /08\/08 の履歴/);
assert.match(machineHistoryContext.historyHtml, /09:00/);
assert.match(machineHistoryContext.historyHtml, /12:00/);
assert.doesNotMatch(machineHistoryContext.historyHtml, /10:00/);
assert.match(machineHistoryContext.historyHtml, /ヘソ評価 4/);
assert.match(machineHistoryContext.historyHtml, /ヘソ評価 未記録/);
assert.match(machineHistoryContext.historyHtml, /寄り注意/);
assert.match(machineHistoryContext.historyHtml, /ワープ良化/);
assert.match(machineHistoryContext.historyHtml, /08\/05 の履歴/);
assert.match(machineHistoryContext.historyHtml, /メモだけの日/);
assert.doesNotMatch(machineHistoryContext.historyHtml, /日付不明メモ|未記入|未記録<\/small><br>\s*<small>台メモ/);
assert.match(machineHistoryContext.historyHtml, /セッションなし/);
assert.match(machineSummary, /id="toggleMachineFormBtn"/);
assert.match(machineDetailForm, /id="machinePreset"/);
assert.match(machineDetailForm, /id="machineModel"/);
assert.match(machineDetailForm, /id="roundBalls"/);
assert.match(machineModelDisplay, /source: "[^"]+"/);
assert.match(machineModelDisplay, /name: "[^"]+"/);
assert.match(columnPresetApply, /if \(hasIndividualSetting && currentPresetId !== presetId && !allowOverwrite\) return;/);
assert.match(normalizeData, /memoEntries: normalizeMemoEntries\(machine\.memoEntries, machine\.memo, machine\.createdAt\),/);
assert.match(normalizeData, /nailRating: normalizeNailRating\(machine\.nailRating\),/);
assert.match(islandEditor, /id="island_\$\{index\}_\$\{side\}_gaps"/);
assert.match(readIslandDraft, /gaps: \{\s*left: readGapListFromDom\(index, "left"\),\s*right: readGapListFromDom\(index, "right"\)\s*\}/);
assert.match(normalizeIsland, /gaps: normalizeIslandGaps\(island\?\.gaps\),/);
assert.match(normalizeIsland, /return \{ left: legacy, right: \[\] \};/);
assert.match(parseIslandLayout, /return \{ sides: \[left, right\], allSides: \[allLeft, allRight\], island, index: island\.displayIndex \?\? index \};/);
assert.match(renderMachineMap, /mapSideHtml\(left, row\.island\?\.gaps\?\.left/);
assert.match(renderMachineMap, /'<div class="map-gap" aria-label="区切り"><\/div>'/);
assert.doesNotMatch(renderMachineMap, /nailRating|釘:|ヘソ/);

assert.match(modalStyle, /\.modal-dai-title strong \{\s*font-size: 1\.5em;\s*font-weight: 900;/);
assert.match(renderClosingInputModal, /<p class="modal-dai-title">台 <strong>\$\{escapeHtml\(daiNo\)\}<\/strong> の閉店回転数<\/p>/);
assert.match(morningStateSummary, /if \(ramLabel\) parts\.push\(`ラムクリ\$\{ramLabel\}`\);/);
assert.match(morningStateSummary, /if \(prevInvalid\) parts\.push\("前日無効"\);/);
assert.match(renderMorningCheckModal, /const savedSummary = morningStateSummary\(todayState\);/);
assert.match(renderMorningCheckModal, /<p class="modal-dai-title">台 <strong>\$\{escapeHtml\(daiNo\)\}<\/strong> \/ 前日ヤメ/);
assert.match(renderMorningCheckModal, /\$\{savedSummary \? `保存済み: \$\{escapeHtml\(savedSummary\)\}` : "未登録"\}/);
assert.match(saveMorningCurrent, /morningCheckFlow\.recent = `保存: \$\{daiNo\}=\$\{morningStateSummary\(state\) \|\| "未登録"\}`;/);

console.log('yutime-v3 tests passed');

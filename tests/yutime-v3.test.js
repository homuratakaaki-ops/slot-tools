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
const hitRoundSummaryHtml = section('function hitRoundSummaryHtml', 'function openHitResetPrompt');
const hitResetPrompt = section('function openHitResetPrompt', 'function openEndWizard');
const openEndWizardBlock = section('function openEndWizard', 'function presetHitCountFromCounters');
const runEndWizardBlock = section('function runEndWizard', 'function runWizard');
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
const investmentAmountForSourceBlock = section('function investmentUnitForSource', 'function sourceUnavailableMessage');
const sourceUnavailableMessage = section('function sourceUnavailableMessage', 'function rateText');
const runningRateHelpers = section('function liveRunningRate', 'function runningYutimeRemaining');
const runningPanelRate = section('function runningPanelRate', 'function runningYutimeRemaining');
const runningExpectationHtml = section('function runningExpectationHtml', 'function runningPanelInputBalls');
const runningTrialHelpers = section('function clampTrialRate', 'function runningPanelInputBalls');
const runningPanelInputBallsBlock = section('function runningPanelInputBalls', 'function runningSpinCount');
const runningSpinCount = section('function runningSpinCount', 'function investmentSnapshot');
const investmentSnapshot = section('function investmentSnapshot', 'function historyEntries');
const calculateStartEvSnapshot = section('function calculateStartEvSnapshot', 'function startEvText');
const startSessionFlow = section('function openStartWizard', 'function openHitWizard');
const startEvDetailTextBlock = section('function startEvText', 'function showToast');
const counterSpinHelpers = section('function counterOffsetForPresetId', 'function presetNetBallsPerWin');
const tenjoAndCounterHelpers = section('function tenjoForPresetId', 'function presetNetBallsPerWin');
const investmentTotalsBlock = section('function investmentTotals', 'function transferSummaryForSession');
const openBalanceEditForm = section('function openBalanceEditForm', 'function openSpinEditForm');
const openRateSummary = section('function openRateSummary', 'function openSessionEditor');
const machineSummary = section('function machineModelSummaryHtml', 'function machineDetailFormHtml');
const machineDetailForm = section('function machineDetailFormHtml', 'function openMachineDetail');
const machineStatsFilters = section('function defaultMachineStatsFilterState', 'function openMachineDetail');
const openMachineDetail = section('function openMachineDetail', 'function renderMachineExpectation');
const bindMachineStatsFilterBlock = section('function bindMachineStatsFilter', 'function renderMachineExpectation');
const renderMachineExpectation = section('function renderMachineExpectation', 'function applyPresetSelectionToForm');
const openStartWizard = section('function openStartWizard', 'function openHitWizard');
const machineMemoHelpers = section('function machineMemoEntriesForDate', 'function nailRatingSummary');
const nailRatingSection = section('function nailRatingSummary', 'function machineModelSummaryHtml');
const machineHistoryHtml = section('function machineHistoryHtml', 'function bindNailRatingChips');
const normalizeNailRatingBlock = section('function normalizeRatingValue', 'function normalizeStartEv');
const normalizeHitsBlock = section('function normalizeHits', 'function syncSessionHitTotals');
const normalizeStartEvBlock = section('function normalizeStartEv', 'function investmentSource');
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
const machineButtonHtml = section('function machineButtonHtml', 'function saveCurrentMap');
const renderClosingInputModal = section('function renderClosingInputModal', 'function directionPreviewText');
const morningStateSummary = section('function morningStateSummary', 'function renderMorningCheckModal');
const renderMorningCheckModal = section('function renderMorningCheckModal', 'function morningDirectionPreviewText');
const saveMorningCurrent = section('function saveMorningCurrent', 'function saveMorningAndAdvance');
const modalStyle = section('.modal-actions', '.closing-display');
const style = section('.source-chip-row', '.unified-invest-row');
const yutimeExpectationEngine = section('const YUTIME_EXPECTATION_ENGINE', 'window.YutimeExpectationEngine');
const machinePresetsBlock = section('const MACHINE_PRESETS = [', 'const RAM_CLEAR_VALUE');
const enginePresetBinding = section('window.YutimeExpectationEngine = YUTIME_EXPECTATION_ENGINE;', 'const blankSession');
const evJudgmentBlock = section('function evJudgment', 'function expectationYenPerBall');
const presetSettingsHelpers = section('function presetNetBallsPerWin', 'function activeMapAssumedRate');
const availableBallsHelpers = section('function availableBallsFromParts', 'function calculateMachineExpectation');
const expectationRateBlock = section('function expectationRate', 'function availableBallsFromParts');
const roundCountFromRoundTypeBlock = section('function roundCountFromRoundType', 'function transferYenText');
const tapModeConsumedBlock = section('function tapModeNormalEndSnapshot', 'function deriveSession');
const consumedBallsChoiceHtmlBlock = section('function consumedBallsChoiceHtml', 'function setConsumedBallsSource');
const consumedBallsSourceEditorHtmlBlock = section('function consumedBallsSourceEditorHtml', 'function fieldHtml');

assert.doesNotMatch(hitWizard, /runWizard\(/);
assert.match(hitWizard, /openModal\("当選ウィザード"/);
assert.match(hitWizard, /label for="hitWizardSpin">当選回転数/);
assert.match(hitWizard, /label for="hitWizardRemainBalls">残り持ち玉/);
assert.match(hitWizard, /今ある持ち玉を入力してください（再プレイ分は含めない）/);
assert.match(hitWizard, /非パーソナル店では空欄のままで構いません/);
assert.match(hitWizard, /session\.hitSpin = normalizeNumber\(byId\("hitWizardSpin"\)\?\.value\);/);
assert.match(hitWizard, /session\.hitRemainBalls = normalizeNumber\(byId\("hitWizardRemainBalls"\)\?\.value\);/);
assert.match(hitWizard, /session\.hitTrackedBalls = mochidamaPreset;/);
assert.match(hitWizard, /openHitResetPrompt\(session\);/);
const hitWizardContext = vm.createContext({
  __session: {
    id: 's_hit_wizard',
    currentSpin: 420,
    hitSpin: null,
    hitRemainBalls: null,
    hitTrackedBalls: null,
    yutimeEnterBalls: null,
    hitVia: null
  },
  __nodes: {},
  __modalHtml: '',
  __resetOpened: false,
  __renderCount: 0,
  findSession(id) {
    return id === 's_hit_wizard' ? hitWizardContext.__session : null;
  },
  deriveBalances() {
    return { mochidama: 1650 };
  },
  activeStore() {
    return { isPersonal: true };
  },
  machineContextLine(target) {
    const machine = target && target.machineId ? { daiNo: '101', modelName: 'テスト機' } : target;
    return machine ? `<p class="machine-context">台${machine.daiNo || '不明'} ／ ${machine.modelName || '機種未設定'}</p>` : '';
  },
  openModal(title, subtitle, htmlText) {
    hitWizardContext.__modalTitle = title;
    hitWizardContext.__modalSubtitle = subtitle;
    hitWizardContext.__modalHtml = htmlText;
    hitWizardContext.__nodes.hitWizardSpin = { value: '421' };
    hitWizardContext.__nodes.hitWizardRemainBalls = { value: '1640' };
    hitWizardContext.__nodes.saveHitWizardBtn = { addEventListener(event, handler) { hitWizardContext.__save = handler; } };
  },
  byId(id) {
    return hitWizardContext.__nodes[id] || null;
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  nowIso() {
    return '2026-08-27T10:00:00.000Z';
  },
  persistWithToast() {
    return true;
  },
  renderAll() {
    hitWizardContext.__renderCount += 1;
  },
  openHitResetPrompt(session) {
    hitWizardContext.__resetOpened = session;
  },
  escapeHtml(value) {
    return String(value ?? '');
  }
});
new vm.Script(`
  ${hitWizard}
  openHitWizard('s_hit_wizard');
  globalThis.openedTitle = globalThis.__modalTitle;
  globalThis.openedHtml = globalThis.__modalHtml;
  globalThis.beforeSaveSpin = globalThis.__session.hitSpin;
  globalThis.__save();
  globalThis.savedSpin = globalThis.__session.hitSpin;
  globalThis.savedRemain = globalThis.__session.hitRemainBalls;
  globalThis.savedTracked = globalThis.__session.hitTrackedBalls;
  globalThis.savedVia = globalThis.__session.hitVia;
  globalThis.savedResetOpened = globalThis.__resetOpened === globalThis.__session;
  globalThis.__session.hitSpin = 1;
  globalThis.__session.hitRemainBalls = 2;
  globalThis.__session.hitTrackedBalls = 3;
  globalThis.__session.hitVia = null;
  globalThis.__nodes.hitWizardSpin.value = '';
  globalThis.__nodes.hitWizardRemainBalls.value = '';
  globalThis.__save();
  globalThis.blankSpin = globalThis.__session.hitSpin;
  globalThis.blankRemain = globalThis.__session.hitRemainBalls;
  globalThis.blankTracked = globalThis.__session.hitTrackedBalls;
`).runInContext(hitWizardContext);
assert.equal(hitWizardContext.openedTitle, '当選ウィザード');
assert.match(hitWizardContext.openedHtml, /当選回転数/);
assert.match(hitWizardContext.openedHtml, /残り持ち玉/);
assert.match(hitWizardContext.openedHtml, /ツールの計算値（1,650玉）/);
assert.equal(hitWizardContext.beforeSaveSpin, null);
assert.equal(hitWizardContext.savedSpin, 421);
assert.equal(hitWizardContext.savedRemain, 1640);
assert.equal(hitWizardContext.savedTracked, 1650);
assert.equal(hitWizardContext.savedVia, 'normal');
assert.equal(hitWizardContext.savedResetOpened, true);
assert.equal(hitWizardContext.blankSpin, null);
assert.equal(hitWizardContext.blankRemain, null);
assert.equal(hitWizardContext.blankTracked, 1650);
assert.match(runWizard, /id="backStepBtn" \$\{index === 0 && !options\.firstBackCancels \? "disabled" : ""\}>戻る<\/button>/);
assert.match(
  runWizard,
  /if \(index === 0 && options\.firstBackCancels\) \{\s*closeModal\(\);\s*return;\s*\}\s*if \(index > 0\) \{\s*draft\[step\.key\] = readWizardValue\(step\);\s*index -= 1;\s*renderStep\(\);/
);
assert.match(
  runWizard,
  /byId\("nextStepBtn"\)\.addEventListener\("click", \(\) => \{\s*draft\[step\.key\] = readWizardValue\(step\);/
);
assert.doesNotMatch(openEndWizardBlock, /session\.hitCount = 0|session\.totalRounds = 0/);
assert.match(runEndWizardBlock, /openEndForm\(session, hasHit, steps\);/);
assert.doesNotMatch(runEndWizardBlock, /runWizard\("ヤメ入力"/);
assert.doesNotMatch(runEndWizardBlock, /ヤメ時点の累計大当たり回数/);
assert.match(runEndWizardBlock, /function openEndForm\(session, hasHit, steps\) \{/);
assert.match(runEndWizardBlock, /id="saveEndFormBtn">保存<\/button>/);
assert.match(runEndWizardBlock, /function completeEndSession\(session, hasHit\) \{/);
assert.match(runEndWizardBlock, /\} else \{\s*syncSessionHitTotals\(session\);\s*\}/);
assert.match(runEndWizardBlock, /if \(!hasHit\) \{\s*session\.hitCount = 0;\s*session\.totalRounds = 0;\s*\}/);
assert.match(runEndWizardBlock, /（実機：計数機に流す玉数）そのまま入力してください。/);
const endWizardContext = vm.createContext({
  __modalHtml: '',
  __handlers: {},
  __nodes: {},
  __renderCount: 0,
  __summarySession: null,
  __view: null,
  activeSessionId: 's_hit',
  deriveBalances() {
    return { mochidama: 1234 };
  },
  machineContextLine(target) {
    const machine = target && target.machineId ? { daiNo: '101', modelName: 'テスト機' } : target;
    return machine ? `<p class="machine-context">台${machine.daiNo || '不明'} ／ ${machine.modelName || '機種未設定'}</p>` : '';
  },
  openModal(title, hint, body) {
    endWizardContext.__modalTitle = title;
    endWizardContext.__modalHint = hint;
    endWizardContext.__modalHtml = body;
  },
  byId(id) {
    if (!endWizardContext.__nodes[id]) {
      endWizardContext.__nodes[id] = {
        value: '',
        addEventListener: (event, handler) => {
          endWizardContext.__handlers[`${id}:${event}`] = handler;
        }
      };
    }
    return endWizardContext.__nodes[id];
  },
  closeModal() {
    endWizardContext.__closed = true;
    if (endWizardContext.modalCancel) {
      const cancel = endWizardContext.modalCancel;
      endWizardContext.modalCancel = null;
      cancel();
    }
  },
  renderAll() {
    endWizardContext.__renderCount += 1;
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  escapeHtml(value) {
    return String(value ?? '');
  },
  syncSessionHitTotals(session) {
    if (!Array.isArray(session.hits) || !session.hits.length) return;
    session.hitCount = session.hits.length;
    session.totalRounds = session.hits.length * 10;
  },
  currentTime() {
    return '22:30';
  },
  nowIso() {
    return '2026-08-22T13:30:00.000Z';
  },
  activeSessionsForStore() {
    return [];
  },
  persistWithToast() {
    endWizardContext.__saved = true;
    return true;
  },
  showView(view) {
    endWizardContext.__view = view;
  },
  openRateSummary(session) {
    endWizardContext.__summarySession = session;
  }
});
new vm.Script([
  'let modalCancel = null;',
  'Object.defineProperty(globalThis, "modalCancel", { get: () => modalCancel, set: (value) => { modalCancel = value; } });',
  `function cumulativeActualBallsBeforeHit(session) {
    return (Array.isArray(session?.hits) ? session.hits : [])
      .map((hit) => normalizeNumber(hit?.actualBalls))
      .filter((value) => value !== null && value > 0)
      .reduce((sum, value) => sum + value, 0);
  }`,
  `function zanhoryuPresetFromHit(session, hasHit) {
    if (!hasHit) return null;
    const currentSpin = normalizeNumber(session.currentSpin);
    const hitSpin = normalizeNumber(session.hitSpin);
    if (currentSpin === null || hitSpin === null) return null;
    const diff = currentSpin - hitSpin;
    return diff >= 0 ? diff : null;
  }`,
  runEndWizardBlock,
  `
  const sessionWithHits = { id: 's_hit', storeId: 'store', currentSpin: 777, hitSpin: 420, hitCount: null, totalRounds: null, hits: [{ roundTypeId: 'r10' }] };
  runEndWizard(sessionWithHits, true);
  globalThis.withHitsHtml = globalThis.__modalHtml;
  globalThis.__nodes.end_endTotalBalls = { value: '1200' };
  globalThis.__nodes.end_sessionActualBalls = { value: '2800' };
  globalThis.__nodes.end_endSpin = { value: '160' };
  globalThis.__nodes.end_zanhoryuBalls = { value: '' };
  globalThis.__nodes.end_memo = { value: 'closed' };
  globalThis.__handlers['saveEndFormBtn:click']();
  globalThis.savedHitSession = sessionWithHits;
  globalThis.savedHitSummarySession = globalThis.__summarySession;

  globalThis.__nodes = {};
  globalThis.__handlers = {};
  const presetActualSession = { id: 's_preset_actual', storeId: 'store', currentSpin: 777, hitSpin: 420, hitCount: null, totalRounds: null, hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r4', actualBalls: 600 }] };
  runEndWizard(presetActualSession, true);
  globalThis.presetActualHtml = globalThis.__modalHtml;

  globalThis.__nodes = {};
  globalThis.__handlers = {};
  const sessionWithoutHits = { id: 's_manual', storeId: 'store', currentSpin: 600, hitSpin: null, hitCount: null, totalRounds: null, hits: [] };
  runEndWizard(sessionWithoutHits, true);
  globalThis.withoutHitsHtml = globalThis.__modalHtml;

  globalThis.__nodes = {};
  globalThis.__handlers = {};
  const noHitSession = { id: 's_nohit', storeId: 'store', currentSpin: 555, hitSpin: null, hitCount: null, totalRounds: null, hits: [] };
  runEndWizard(noHitSession, false);
  globalThis.noHitHtml = globalThis.__modalHtml;
  globalThis.__nodes.end_endTotalBalls = { value: '' };
  globalThis.__nodes.end_endSpin = { value: '' };
  globalThis.__nodes.end_zanhoryuBalls = { value: '' };
  globalThis.__nodes.end_memo = { value: '' };
  globalThis.__handlers['saveEndFormBtn:click']();
  globalThis.savedNoHitSession = noHitSession;

  globalThis.__nodes = {};
  globalThis.__handlers = {};
  const cancelledSession = { id: 's_cancel', storeId: 'store', currentSpin: 333, hitSpin: null, hitCount: null, totalRounds: null, hits: [] };
  runEndWizard(cancelledSession, false);
  closeModal();
  globalThis.cancelledStatus = cancelledSession.status || null;
  `
].join('\n')).runInContext(endWizardContext);
assert.doesNotMatch(endWizardContext.withHitsHtml, /endTotalHits|大当たり回数|合計R数/);
assert.match(endWizardContext.withHitsHtml, /end_endTotalBalls/);
assert.match(endWizardContext.withHitsHtml, /end_endSpin/);
assert.match(endWizardContext.withHitsHtml, /id="end_zanhoryuBalls"[^>]*value="357"/);
assert.match(endWizardContext.withHitsHtml, /時短抜け後に消化した回転数から推定した値です。打ち込んだ場合は実際の残保留に修正してください。/);
assert.match(endWizardContext.withHitsHtml, /end_memo/);
// B90: 累計獲得出玉は大当たりありの分岐だけに出し、当選ごとの合計を初期値にする
assert.match(endWizardContext.withHitsHtml, /id="end_sessionActualBalls"/);
assert.match(endWizardContext.withHitsHtml, /累計獲得出玉/);
assert.match(endWizardContext.withHitsHtml, /（実機：データカウンターの累計獲得出玉）最終の値を入れてください。当選ごとの入力は任意で、ここに入れた値が最終の記録になります。/);
assert.doesNotMatch(endWizardContext.noHitHtml, /end_sessionActualBalls|累計獲得出玉/);
assert.equal(endWizardContext.savedHitSession.sessionActualBalls, 2800);
assert.match(endWizardContext.presetActualHtml, /id="end_sessionActualBalls"[^>]*value="1980"/);
assert.equal(endWizardContext.savedHitSession.status, 'completed');
assert.equal(endWizardContext.savedHitSession.hitCount, 1);
assert.equal(endWizardContext.savedHitSession.totalRounds, 10);
assert.equal(endWizardContext.savedHitSession.endTotalBalls, 1200);
assert.equal(endWizardContext.savedHitSession.endSpin, 160);
assert.equal(endWizardContext.savedHitSession.zanhoryuBalls, null);
assert.equal(endWizardContext.savedHitSession.memo, 'closed');
assert.equal(endWizardContext.savedHitSummarySession, endWizardContext.savedHitSession);
assert.match(endWizardContext.withoutHitsHtml, /end_hitCount/);
assert.match(endWizardContext.withoutHitsHtml, /end_totalRounds/);
assert.doesNotMatch(endWizardContext.withoutHitsHtml, /endTotalHits/);
assert.match(endWizardContext.noHitHtml, /id="end_endTotalBalls"[^>]*value="1234"/);
assert.match(endWizardContext.noHitHtml, /id="end_endSpin"[^>]*value="555"/);
assert.equal(endWizardContext.savedNoHitSession.status, 'completed');
assert.equal(endWizardContext.savedNoHitSession.hitCount, 0);
assert.equal(endWizardContext.savedNoHitSession.totalRounds, 0);
assert.equal(endWizardContext.savedNoHitSession.endTotalBalls, null);
assert.equal(endWizardContext.cancelledStatus, null);
assert.ok(endWizardContext.__renderCount >= 1);
assert.ok(hitWizard.includes('id="hitWizardSpin"'), 'hit spin field should remain in the one-screen hit form');
assert.ok(hitWizard.includes('id="hitWizardRemainBalls"'), 'hit remain field should remain in the one-screen hit form');
assert.ok(hitResetPrompt.includes('data-hit-reset'), 'reset chip buttons should remain after hit completion');
assert.ok(hitResetPrompt.includes('data-hit-round'), 'round type chips should be available after hit completion');
assert.match(hitResetPrompt, /id="hitRecordSpin"/);
assert.match(hitResetPrompt, /id="hitRecordActualBalls"/);
assert.match(hitResetPrompt, /placeholder="累計獲得出玉（カウンター表示）任意"/);
assert.match(hitResetPrompt, /（実機：データカウンターの累計獲得出玉）大当り開始から電サポ終了までの純増（電サポ中の減りを含む）です。前回入力との差が今回の出玉として記録されます。/);
assert.match(hitResetPrompt, /hitRoundSummaryHtml\(session, presetId\)/);
assert.match(hitResetPrompt, /class="hit-round-layout"/);
assert.match(hitResetPrompt, /appendHitRecord\(session, button\.dataset\.hitRound\);/);
assert.ok(hitResetPrompt.includes('data-close'), 'reset chip close button should remain unchanged');
assert.match(hitResetPrompt, /id="hitMochidamaValue"/);
assert.match(hitResetPrompt, /id="saveHitMochidamaBtn"/);
assert.match(hitResetPrompt, /closeModal\(\);\s*setCurrentSpinWithUndo\(session, value\);/);
assert.doesNotMatch(hitResetPrompt, /saveHitMochidamaInput\(session, \{ silentEmpty: true \}\)/);
assert.match(hitResetPrompt, /if \(!raw\) return false;/);
assert.match(hitRoundSummaryHtml, /const hits = normalizeHits\(session\?\.hits\);/);
assert.match(hitRoundSummaryHtml, /const roundTypes = presetById\(presetId\)\?\.roundTypes \|\| \[\];/);
assert.match(hitRoundSummaryHtml, /const count = counts\.get\(type\.id\) \|\| 0;/);
assert.match(hitRoundSummaryHtml, /if \(!count\) return "";/);
assert.match(hitRoundSummaryHtml, /roundCountFromRoundType\(type\)/);
assert.match(hitRoundSummaryHtml, /class="hit-round-result"/);
assert.match(hitRoundSummaryHtml, /今回 \$\{latestRounds !== null \? `\$\{latestRounds\.toLocaleString\("ja-JP"\)\}R` : "-"\} ／ 合計 \$\{totalRounds\.toLocaleString\("ja-JP"\)\}R/);
assert.match(hitRoundSummaryHtml, /const payoutLabel = actualPayout > 0 \? "実測出玉" : "R数ベース出玉";/);
assert.match(hitRoundSummaryHtml, /\$\{payoutLabel\} 今回 \$\{Math\.round\(Math\.max\(0, latestActualBalls \?\? 0\)\)\.toLocaleString\("ja-JP"\)\}玉／累計 \$\{Math\.round\(actualPayout\)\.toLocaleString\("ja-JP"\)\}玉/);
assert.match(hitRoundSummaryHtml, /今回 \$\{hitCount\.toLocaleString\("ja-JP"\)\}回 \/ 合計\$\{totalRounds\.toLocaleString\("ja-JP"\)\}R/);
assert.match(hitRoundSummaryHtml, /累計大当たり \$\{Math\.round\(cumulativeHits\)\.toLocaleString\("ja-JP"\)\}回/);
assert.match(hitResetPrompt, /function cumulativeActualBallsBeforeHit\(session\)/);
assert.match(hitResetPrompt, /function actualBallsFromCumulativeInput\(session, cumulativeInput\)/);
assert.match(hitResetPrompt, /if \(cumulativeBalls < previousTotal\) return \{ actualBalls: 0, warning: true \};/);
assert.match(hitResetPrompt, /入力値が前回までの累計を下回っています。カウンターの累計を入力してください/);
const hitRoundSummaryContext = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  presetById(id) {
    return {
      single: { roundTypes: [{ id: 'r10', label: '10R', balls: 1400 }] },
      multi: { roundTypes: [{ id: 'r4', label: '4R', balls: 560 }, { id: 'r6', label: '6R', balls: 840 }, { id: 'r10', label: '10R', balls: 1400 }] }
    }[id] || null;
  },
  roundTypeById(presetId, roundTypeId) {
    return hitRoundSummaryContext.presetById(presetId)?.roundTypes.find((type) => type.id === roundTypeId) || null;
  },
  hitRoundBasedPayout(session, presetId) {
    const hits = Array.isArray(session?.hits) ? session.hits : [];
    const total = hits.reduce((sum, hit) => {
      const roundType = hitRoundSummaryContext.roundTypeById(presetId, hit.roundTypeId);
      return roundType ? sum + Number(roundType.balls || 0) : sum;
    }, 0);
    return total > 0 ? total : null;
  },
  escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  },
  nowIso() {
    return '2026-08-22T00:00:00.000Z';
  }
});
new vm.Script(`
  ${normalizeHitsBlock}
  ${roundCountFromRoundTypeBlock}
  ${hitRoundSummaryHtml}
  globalThis.singleSummary = hitRoundSummaryHtml({
    startTotalHits: 3,
    hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }, { roundTypeId: 'r10' }]
  }, 'single');
  globalThis.multiSummary = hitRoundSummaryHtml({
    startTotalHits: 3,
    hits: [{ roundTypeId: 'r4' }, { roundTypeId: 'r4' }, { roundTypeId: 'r6' }, { roundTypeId: 'r10' }]
  }, 'multi');
  globalThis.noStartSummary = hitRoundSummaryHtml({
    startTotalHits: null,
    hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }]
  }, 'multi');
  globalThis.actualSummary = hitRoundSummaryHtml({
    startTotalHits: 0,
    hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r10', actualBalls: 1420 }]
  }, 'single');
`).runInContext(hitRoundSummaryContext);
assert.match(hitRoundSummaryContext.singleSummary, /10R ×3 ＝ 30R/);
assert.match(hitRoundSummaryContext.singleSummary, /今回 10R ／ 合計 30R/);
assert.match(hitRoundSummaryContext.singleSummary, /R数ベース出玉 4,200玉/);
assert.match(hitRoundSummaryContext.singleSummary, /今回 3回 \/ 合計30R/);
assert.match(hitRoundSummaryContext.singleSummary, /累計大当たり 6回（開始時3回＋今回3回）/);
assert.match(hitRoundSummaryContext.multiSummary, /4R ×2 ＝ 8R/);
assert.match(hitRoundSummaryContext.multiSummary, /6R ×1 ＝ 6R/);
assert.match(hitRoundSummaryContext.multiSummary, /10R ×1 ＝ 10R/);
assert.match(hitRoundSummaryContext.multiSummary, /今回 4回 \/ 合計24R/);
assert.match(hitRoundSummaryContext.multiSummary, /今回 10R ／ 合計 24R/);
assert.match(hitRoundSummaryContext.multiSummary, /R数ベース出玉 3,360玉/);
assert.match(hitRoundSummaryContext.multiSummary, /累計大当たり 7回（開始時3回＋今回4回）/);
assert.doesNotMatch(hitRoundSummaryContext.noStartSummary, /4R ×/);
assert.doesNotMatch(hitRoundSummaryContext.noStartSummary, /6R ×/);
assert.match(hitRoundSummaryContext.noStartSummary, /10R ×2 ＝ 20R/);
assert.match(hitRoundSummaryContext.noStartSummary, /今回 10R ／ 合計 20R/);
assert.match(hitRoundSummaryContext.noStartSummary, /累計大当たり 2回（開始時未入力＋今回2回）/);
assert.match(hitRoundSummaryContext.actualSummary, /実測出玉 今回 1,420玉／累計 2,800玉/);
const appendHitRecordContext = vm.createContext({
  __inputs: {},
  __toasts: [],
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  byId(id) {
    return { value: appendHitRecordContext.__inputs[id] };
  },
  nowIso() {
    return '2026-08-22T00:00:00.000Z';
  },
  syncSessionHitTotals() {},
  persistWithToast(message) {
    appendHitRecordContext.__toasts.push({ message, type: 'success' });
    return true;
  },
  showToast(message, type = 'success') {
    appendHitRecordContext.__toasts.push({ message, type });
  }
});
new vm.Script(`
  ${normalizeHitsBlock}
  ${hitResetPrompt}
  globalThis.session = { hits: [] };
  globalThis.add = (value) => {
    __inputs.hitRecordSpin = '';
    __inputs.hitRecordActualBalls = value;
    appendHitRecord(session, 'r10');
    return session.hits.at(-1).actualBalls;
  };
`).runInContext(appendHitRecordContext);
assert.equal(appendHitRecordContext.add('1380'), 1380);
assert.equal(appendHitRecordContext.add('2800'), 1420);
assert.equal(appendHitRecordContext.add('4000'), 1200);
assert.equal(appendHitRecordContext.session.hits.reduce((sum, hit) => sum + (hit.actualBalls || 0), 0), 4000);
assert.equal(appendHitRecordContext.add('1000'), 0);
assert.equal(appendHitRecordContext.session.hits.reduce((sum, hit) => sum + (hit.actualBalls || 0), 0), 4000);
assert.deepEqual(appendHitRecordContext.__toasts.at(-1), {
  message: '入力値が前回までの累計を下回っています。カウンターの累計を入力してください',
  type: 'error'
});
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
assert.match(transferSummary, /withdrawBalls: usesTapInvestmentMode\(session\) && Boolean\(store\?\.isPersonal\) \? Number\(session\.startMochidama \|\| 0\) : totals\.mochidamaBalls \+ totals\.saipureiBalls,/);
assert.match(transferSummary, /depositBalls: finalMochidamaForCarryover\(session\) \?\? 0/);
assert.match(transferSummary, /const summaryPresetId = startEv\?\.presetId \|\| normalizeMachinePresetId\(machine\);/);
assert.match(transferSummary, /startExpectedSpins = startEv \? remainingSpinsFromCounterSpin\(startEv\.effectiveSpin, summaryPresetId\) : null;/);
assert.match(transferSummary, /remainingSpins = endEffectiveSpin !== null \? remainingSpinsFromCounterSpin\(endEffectiveSpin, summaryPresetId\) : null;/);
assert.match(transferSummary, /const consumedBalls = derived\.consumedBalls !== null && derived\.consumedBalls !== undefined \? Math\.round\(derived\.consumedBalls\) : null;/);
assert.match(transferSummary, /const playedSpins = startSpin !== null && endSpin !== null && endSpin >= startSpin \? endSpin - startSpin : null;/);
assert.match(transferSummary, /const actualHitBalls = sessionActualBallsTotal\(session\);/);
assert.match(transferSummary, /const totalHitBalls = actualHitBalls !== null \? actualHitBalls : \(derived\.isEstimatedPayout \? null : derived\.hitBalls\);/);
assert.match(transferSummary, /const averageRoundBalls = totalHitBalls !== null && totalRounds > 0 \? totalHitBalls \/ totalRounds : null;/);
assert.match(transferSummary, /function transferYenText\(value\) \{\s*return `\$\{Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\("ja-JP"\)\}円`;/);
assert.match(transferSummary, /function transferBallText\(value\) \{\s*return Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\("ja-JP"\);/);
assert.match(transferSummary, /投資\$\{transferYenText\(summary\.investYen\)\}\/回収\$\{transferYenText\(summary\.recoverYen\)\}\/引出\$\{transferBallText\(summary\.withdrawBalls\)\}個\/預入\$\{transferBallText\(summary\.depositBalls\)\}個/);
assert.match(transferSummary, /開始期待値\$\{transferOptionalYenText\(summary\.startEvYen\)\}\/想定回転数\$\{transferOptionalSpinText\(summary\.startExpectedSpins\)\}\/残り回転数\$\{transferOptionalSpinText\(summary\.remainingSpins\)\}/);
assert.match(transferSummary, /<span>開始期待値<\/span><strong>\$\{transferOptionalYenText\(summary\.startEvYen\)\}<\/strong>/);
assert.match(transferSummary, /<span>1R平均<\/span><strong>\$\{transferOptionalRoundAverageText\(summary\.averageRoundBalls\)\}<\/strong>/);
assert.match(transferSummary, /navigator\.clipboard\?\.writeText/);
assert.match(renderLedger, /session\.status === "completed" \? transferSummaryHtml\(session\) : ""/);
assert.match(renderLedger, /data-copy-transfer/);
assert.match(openSessionEditor, /fieldHtml\("settlementRecoverYen", "回収金額", session\.settlementRecoverYen\)/);
assert.match(openSessionEditor, /"zanhoryuBalls", "settlementRecoverYen"/);
assert.match(openSessionEditor, /consumedBallsSourceEditorHtml\(session\)/);
assert.match(openSessionEditor, /session\.consumedBallsSource = normalizeConsumedBallsSource\(byId\("editConsumedBallsSource"\)\.value\);/);
assert.match(openSessionEditor, /investmentTotalEditorHtml\(session\)/);
assert.match(openSessionEditor, /applyInvestmentTotalAdjustments\(session\);/);
assert.match(investmentTotalsBlock, /adjustment: true/);
assert.match(investmentTotalsBlock, /spinAt: null/);
assert.match(investmentTotalsBlock, /phase: "normal"/);
assert.match(investmentSnapshot, /if \(!item \|\| item\.adjustment\) return null;/);
assert.match(investmentSnapshot, /return investment\.adjustment \? sum : sum \+ investmentToBalls\(investment, store\);/);
assert.match(normalizeData, /adjustment: item\.adjustment === true/);
assert.match(normalizeData, /consumedBallsSource: normalizeConsumedBallsSource\(session\.consumedBallsSource\)/);
assert.doesNotMatch(html, /台帳/);
assert.match(yutimeExpectationEngine, /expectedJitanNormalSpins = pHit \* chains\.jitanNormalInit \+ pReach \* chains\.r350 \* chains\.jitanNormalJitanHit;/);
assert.match(yutimeExpectationEngine, /expectedJitanFastSpins = pHit \* chains\.jitanFastInit \+ pReach \* chains\.r350 \* chains\.jitanFastJitanHit;/);
assert.match(yutimeExpectationEngine, /const expectedYutimeSpins = pReach \* yutimeDensapoBeforeHit;/);
assert.match(yutimeExpectationEngine, /const expectedDensapoSpins = expectedJitanNormalSpins \+ expectedJitanFastSpins \+ expectedYutimeSpins;/);
assert.match(yutimeExpectationEngine, /const winBalls = expectedWins \* merged\.netBallsPerWin \+ expectedJitanNormalSpins \* merged\.jitanNormalBallsPerSpin \+ expectedJitanFastSpins \* merged\.jitanFastBallsPerSpin \+ expectedYutimeSpins \* merged\.yutimeBallsPerSpin;/);
assert.match(yutimeExpectationEngine, /const evBalls = winBalls - investBalls;/);
assert.match(yutimeExpectationEngine, /function normalInvestmentSplit\(prob, spinsToTenjo, ballsPerSpin, availableBalls\)/);
assert.match(yutimeExpectationEngine, /const split = normalInvestmentSplit\(p, spinsToTenjo, 250 \/ rate, input\.availableBalls\);/);
assert.match(yutimeExpectationEngine, /const cashSpentYen = split\.cashBalls \/ 250 \* 1000;/);
assert.match(yutimeExpectationEngine, /const normalCostYen = mochidamaCostYen \+ cashSpentYen;/);
assert.match(yutimeExpectationEngine, /const winBallsYen = winBalls \* merged\.yenPerBall;/);
assert.match(yutimeExpectationEngine, /const evYen = winBallsYen - normalCostYen;/);
const expectationContext = vm.createContext({
  DEFAULT_NET_BALLS_PER_WIN: 1400,
  DEFAULT_HOURLY_THRESHOLD_YEN: 2400,
  data: { meta: {} },
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  window: {}
});
new vm.Script(`
  ${yutimeExpectationEngine}
  ${evJudgmentBlock}
  globalThis.engine = YUTIME_EXPECTATION_ENGINE;
  globalThis.judge = evJudgment;
`).runInContext(expectationContext);
// B97: データカウンター基準の回転数を内部低確回転数へ換算する
// counterOffset の出所は期待値エンジンのプリセット1箇所だけ。ページ側に数値を書かない。
const counterContext = vm.createContext({
  YUTIME_EXPECTATION_ENGINE: expectationContext.engine,
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  presetById(presetId) {
    return expectationContext.engine.presets[presetId] || null;
  }
});
new vm.Script(`
  ${tenjoAndCounterHelpers}
  globalThis.counterApi = { counterOffsetForPresetId, engineSpinFromCounterSpin, remainingSpinsFromCounterSpin };
`).runInContext(counterContext);
const counterApi = counterContext.counterApi;
assert.equal(expectationContext.engine.presets['agnes-pe'].spec.counterOffset, 11, 'agnes-pe はカウンター250 − 内部239 = 11');
assert.equal(expectationContext.engine.presets['umi-sp5'].spec.counterOffset, 0, 'umi-sp5 はカウンターと内部天井が一致する');

// B98: 期待値計算に関わる値の出典は期待値エンジンのプリセット1箇所だけ。
// MACHINE_PRESETS はUI情報（roundTypes等）だけを持ち、計算パラメータを再び書き込んだら落ちる。
for (const param of ['tenjo', 'hitProbLow', 'hitProbHigh', 'jitanTable', 'holdSpins', 'counterOffset', 'netBallsPerWin']) {
  assert.equal(machinePresetsBlock.includes(param), false, `MACHINE_PRESETS に計算パラメータ ${param} を書かないこと（出典はエンジン側1箇所）`);
  assert.equal(yutimeExpectationEngine.includes(param), true, `${param} は期待値エンジンのブロックに存在すること`);
}
// MACHINE_PRESETS の spec / defaults はエンジン側から解決する
const machinePresetContext = vm.createContext({
  DEFAULT_NET_BALLS_PER_WIN: 1400,
  window: {}
});
new vm.Script(`
  ${machinePresetsBlock}
  ${yutimeExpectationEngine}
  ${enginePresetBinding}
  globalThis.presets = MACHINE_PRESETS;
  globalThis.engine = YUTIME_EXPECTATION_ENGINE;
`).runInContext(machinePresetContext);
for (const machinePreset of machinePresetContext.presets) {
  const enginePreset = machinePresetContext.engine.presets[machinePreset.id];
  assert.ok(enginePreset, `${machinePreset.id} は期待値エンジンにも定義があること`);
  assert.equal(machinePreset.spec, enginePreset.spec, `${machinePreset.id} の spec はエンジンの実体をそのまま参照すること`);
  assert.equal(machinePreset.defaults, enginePreset.defaults, `${machinePreset.id} の defaults はエンジンの実体をそのまま参照すること`);
}
assert.equal(machinePresetContext.presets.find((preset) => preset.id === 'agnes-pe').roundTypes.length, 3, 'UI側の roundTypes は MACHINE_PRESETS に残ること');
assert.equal(machinePresetContext.presets.find((preset) => preset.id === 'agnes-pe').defaults.netBallsPerWin, 587.5, 'agnes-pe の既定値はエンジン側の値で解決されること');
assert.equal(counterApi.counterOffsetForPresetId('agnes-pe'), 11);
assert.equal(counterApi.counterOffsetForPresetId('umi-sp5'), 0);
assert.equal(counterApi.counterOffsetForPresetId(undefined), 0, '未知のプリセットはずれ0として扱う');
assert.equal(counterApi.engineSpinFromCounterSpin(150, 'agnes-pe'), 139);
assert.equal(counterApi.engineSpinFromCounterSpin(0, 'agnes-pe'), 0, 'ラムクリア後0回転は内部239回転として扱う');
assert.equal(counterApi.engineSpinFromCounterSpin(434, 'umi-sp5'), 434, '大海5SPは素通し');
assert.equal(counterApi.engineSpinFromCounterSpin(null, 'agnes-pe'), null);
assert.equal(counterApi.remainingSpinsFromCounterSpin(150, 'agnes-pe'), 100, 'カウンター150は遊タイムまで残り100回転');
assert.equal(counterApi.remainingSpinsFromCounterSpin(0, 'agnes-pe'), 239);
assert.equal(counterApi.remainingSpinsFromCounterSpin(200, 'agnes-pe'), 50);
assert.equal(counterApi.remainingSpinsFromCounterSpin(250, 'agnes-pe'), 0);
assert.equal(counterApi.remainingSpinsFromCounterSpin(434, 'umi-sp5'), 516, '大海5SPの残り回転数は不変');
assert.equal(counterApi.remainingSpinsFromCounterSpin(525, 'umi-sp5'), 425);

// 受け入れ基準: アグネスPE・カウンター150・回転率17・1R実質100玉・等価・現金 → +1,569円（記事v5と一致）
const agnesCounterCase = expectationContext.engine.calculate(
  { presetId: 'agnes-pe', currentSpin: counterApi.engineSpinFromCounterSpin(150, 'agnes-pe'), rotationRate: 17, availableBalls: 0 },
  { ...expectationContext.engine.presets['agnes-pe'].defaults, presetId: 'agnes-pe', netBallsPerWin: 587.5 * 100 / 108, yenPerBall: 4 }
);
assert.equal(Math.round(agnesCounterCase.evYen), 1569, 'アグネスPE・カウンター150 → +1,569円');
assert.equal(agnesCounterCase.spinsToTenjo, 100, 'エンジンの残り回転数もカウンター基準と一致する');

// エンジンへ渡す前に必ず換算していること
assert.match(html, /const engineSpin = engineSpinFromCounterSpin\(effectiveSpin, preset\.id\);/);
assert.match(html, /YUTIME_EXPECTATION_ENGINE\.calculate\(\{ presetId: preset\.id, currentSpin: engineSpin, rotationRate: rateInfo\.rate, availableBalls \}/);
assert.doesNotMatch(html, /YUTIME_EXPECTATION_ENGINE\.calculate\(\{ presetId: preset\.id, currentSpin: effectiveSpin/);
// 遊タイム突入回転数の推定もカウンター基準の天井から引く
assert.match(yutimeEnterSpinForRate, /const counterTenjo = tenjo \+ counterOffsetForPresetId\(preset\?\.id\);/);
assert.match(yutimeEnterSpinForRate, /const inferred = counterTenjo - prevSpin;/);
// 稼働中パネルの遊タイム残りも同じ基準
assert.match(html, /const remaining = remainingSpinsFromCounterSpin\(effective, preset\.id\);/);

// B91: 既存の基準点はすべて holdSpins=0（残保留なし）の回帰として固定する
const zeroSupportSettings = { yenPerBall: 4, netBallsPerWin: 1400, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0, holdSpins: 0 };
const equalExchangeResult = expectationContext.engine.calculate(
  { currentSpin: 0, rotationRate: 18 },
  zeroSupportSettings
);
const nonEqualExchangeResult = expectationContext.engine.calculate(
  { currentSpin: 0, rotationRate: 18 },
  { ...zeroSupportSettings, yenPerBall: 100 / 28 }
);
const nonEqualWithBallsResult = expectationContext.engine.calculate(
  { currentSpin: 434, rotationRate: 17, availableBalls: 2500 },
  { ...zeroSupportSettings, yenPerBall: 100 / 28 }
);
const nonEqualAllBallsResult = expectationContext.engine.calculate(
  { currentSpin: 434, rotationRate: 17, availableBalls: 999999 },
  { ...zeroSupportSettings, yenPerBall: 100 / 28 }
);
const jitanLossResult = expectationContext.engine.calculate(
  { currentSpin: 900, rotationRate: 18 },
  { yenPerBall: 4, netBallsPerWin: 1400, jitanNormalBallsPerSpin: -0.2, jitanFastBallsPerSpin: -0.5, yutimeBallsPerSpin: 0, holdSpins: 0 }
);
assert.ok(equalExchangeResult, 'equal exchange EV should calculate');
assert.ok(nonEqualExchangeResult, 'non-equal exchange EV should calculate');
assert.ok(jitanLossResult, 'state-separated jitan EV should calculate');
assert.ok(Math.abs(equalExchangeResult.evYen - equalExchangeResult.evBalls * 4) < 0.000001, 'equal exchange yen conversion should remain unchanged');
assert.ok(Math.abs(equalExchangeResult.evBalls - nonEqualExchangeResult.evBalls) < 0.000001, 'exchange rate should not change evBalls');
assert.ok(Math.abs(nonEqualExchangeResult.cashSpentYen - nonEqualExchangeResult.expectedNormalSpins / 18 * 1000) < 0.000001, 'cash spent should be derived from rotations per 1000 yen');
assert.ok(Math.abs(nonEqualExchangeResult.normalCostYen - nonEqualExchangeResult.cashSpentYen) < 0.000001, 'empty available balls should preserve B52 cash-only cost');
assert.ok(Math.abs(nonEqualExchangeResult.winBallsYen - nonEqualExchangeResult.winBalls * (100 / 28)) < 0.000001, 'win balls should use exchange yen per ball');
assert.ok(Math.abs(nonEqualExchangeResult.evYen - -1626.5) < 1, '28 balls exchange scenario should reproduce the corrected negative EV');
assert.equal(Math.round(nonEqualWithBallsResult.mochidamaBalls), 1941);
assert.equal(Math.round(nonEqualWithBallsResult.cashBalls), 1826);
assert.ok(Math.abs(nonEqualWithBallsResult.normalCostYen - 14236.6) < 0.2, '434 spin / 17 rate / 2500 balls cost should use distribution split');
assert.ok(Math.abs(nonEqualWithBallsResult.evYen - (nonEqualWithBallsResult.winBallsYen - nonEqualWithBallsResult.normalCostYen)) < 0.000001);
assert.ok(Math.abs(nonEqualAllBallsResult.normalCostYen - nonEqualAllBallsResult.investBalls * (100 / 28)) < 0.000001, 'large available balls should value all investment at exchange rate');
assert.equal(expectationContext.judge(nonEqualExchangeResult).label, '打てない');
// B93: 判定は期待値の絶対額ではなく時給で決まる（検算例5ケース）
const judgeCase = (evYen, hourlyYen) => expectationContext.judge({ evYen, hourlyYen, totalHours: 1 }).label;
expectationContext.data.meta = {};
assert.equal(judgeCase(1293, 2576), '打てる');
assert.equal(judgeCase(2547, 1908), '微妙');
assert.equal(judgeCase(543, 373), '微妙');
assert.equal(judgeCase(-2618, -1683), '打てない');
expectationContext.data.meta = { hourlyThresholdYen: 1800 };
assert.equal(judgeCase(2547, 1908), '打てる');
expectationContext.data.meta = {};
// 時給が出せないときは期待値の符号だけで判定する
assert.equal(expectationContext.judge({ evYen: 2547, hourlyYen: 0, totalHours: 0 }).label, '微妙');
assert.equal(expectationContext.judge({ evYen: -100, hourlyYen: 0, totalHours: 0 }).label, '打てない');
assert.equal(expectationContext.judge({ evYen: 0, hourlyYen: 0, totalHours: 1 }).label, '打てない');
assert.equal(expectationContext.judge(null).label, '未判定');
assert.ok(html.includes('const DEFAULT_HOURLY_THRESHOLD_YEN = 2400;'));
assert.ok(!html.includes('EV_THRESHOLDS'));
assert.ok(html.includes('判定基準：時給'));
assert.ok(html.includes('id="quickHourlyThreshold"'));
assert.ok(html.includes('data.meta.hourlyThresholdYen ='));
assert.ok(Math.abs(equalExchangeResult.expectedDensapoSpins - (equalExchangeResult.expectedJitanNormalSpins + equalExchangeResult.expectedJitanFastSpins + equalExchangeResult.expectedYutimeSpins)) < 0.000001, 'split support spins should add up to legacy total');
const legacyFastWithYutimeSpins = equalExchangeResult.pHit * equalExchangeResult.chains.jitanFastInit
  + equalExchangeResult.pReach * (expectationContext.engine.finiteExpectedSpins(expectationContext.engine.preset.spec.hitProb, expectationContext.engine.preset.spec.yutimeJitan) + equalExchangeResult.chains.r350 * equalExchangeResult.chains.jitanFastJitanHit);
assert.ok(Math.abs(legacyFastWithYutimeSpins - (equalExchangeResult.expectedJitanFastSpins + equalExchangeResult.expectedYutimeSpins)) < 0.000001, 'three-way split should preserve the old fast-plus-yutime total');
assert.ok(jitanLossResult.winBalls < expectationContext.engine.calculate({ currentSpin: 900, rotationRate: 18 }, zeroSupportSettings).winBalls, 'negative jitan rates should reduce win balls');
const defaultYutimeLossResult = expectationContext.engine.calculate(
  { currentSpin: 0, rotationRate: 18 },
  { yenPerBall: 4, netBallsPerWin: 1400, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, holdSpins: 0 }
);
const yutimeMinusOneResult = expectationContext.engine.calculate(
  { currentSpin: 0, rotationRate: 18 },
  { ...zeroSupportSettings, yutimeBallsPerSpin: -1.0 }
);
const fastOnlyLossResult = expectationContext.engine.calculate(
  { currentSpin: 0, rotationRate: 18 },
  { ...zeroSupportSettings, jitanFastBallsPerSpin: -1.0 }
);
assert.ok(Math.abs(defaultYutimeLossResult.evYen - (equalExchangeResult.evYen - equalExchangeResult.expectedYutimeSpins * 0.3 * 4)) < 0.000001, 'umi default yutime loss should reduce EV by yutime-only support loss');
assert.ok(Math.abs(yutimeMinusOneResult.evYen - (equalExchangeResult.evYen - equalExchangeResult.expectedYutimeSpins * 1.0 * 4)) < 0.000001, 'manual yutime loss should only apply to yutime spins');
assert.ok(Math.abs(fastOnlyLossResult.evYen - (equalExchangeResult.evYen - equalExchangeResult.expectedJitanFastSpins * 1.0 * 4)) < 0.000001, 'fast jitan loss should not apply to yutime spins');

const agnesPreset = expectationContext.engine.presets['agnes-pe'];
const agnesChains = expectationContext.engine.stCertainValues(agnesPreset);
assert.ok(agnesPreset, 'agnes-pe preset should be registered in the expectation engine');
assert.ok(Math.abs(agnesChains.pST - 0.40929428801282375) < 0.000001, 'agnes ST hit rate should match the supplied spec');
assert.ok(Math.abs(agnesChains.continuation - 0.5773525708771564) < 0.000001, 'agnes continuation should match the supplied spec');
assert.ok(Math.abs(agnesChains.expectedWins - 2.3660382888768203) < 0.000001, 'agnes average chain should match the supplied spec');
assert.ok(Math.abs(agnesChains.expectedWins * 587.5 - 1390) / 1390 < 0.005, 'agnes public-payout chain value should be about 1390 balls');
function agnesBorder(payoutFactor, holdSpins = 0) {
  let lo = 10;
  let hi = 30;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    const result = expectationContext.engine.calculate(
      { presetId: 'agnes-pe', currentSpin: 0, rotationRate: mid },
      { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5 * payoutFactor, jitanFastBallsPerSpin: -0.8, holdSpins }
    );
    if (result.evYen >= 0) hi = mid;
    else lo = mid;
  }
  return hi;
}
assert.ok(Math.abs(agnesBorder(1.00) - 17.0) <= 0.1, 'agnes 100% payout border should be 17.0/k');
assert.ok(Math.abs(agnesBorder(0.90) - 19.0) <= 0.1, 'agnes 90% payout border should be 19.0/k');
assert.ok(Math.abs(agnesBorder(0.85) - 20.2) <= 0.1, 'agnes 85% payout border should be 20.2/k');
assert.match(expectationRateBlock, /const assumedSourceName = String\(store\?\.name \|\| ""\)\.trim\(\) \|\| "島";/);
assert.match(expectationRateBlock, /source: `\$\{assumedSourceName\}の想定回転率\$\{assumed\.toFixed\(1\)\}使用`/);
assert.doesNotMatch(expectationRateBlock, /コーナー平均/);
const expectationRateContext = vm.createContext({
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  activeMapAssumedRate() {
    return 17;
  }
});
new vm.Script(`
  ${expectationRateBlock}
  globalThis.manualRate = expectationRate(null, 18, { id: 'store_1', name: '夢爽店' });
  globalThis.historyRate = expectationRate({ rate: 16.4 }, null, { id: 'store_1', name: '夢爽店' });
  globalThis.namedAssumedRate = expectationRate(null, null, { id: 'store_1', name: '夢爽店' });
  globalThis.fallbackAssumedRate = expectationRate(null, null, { id: 'store_2', name: '  ' });
`).runInContext(expectationRateContext);
assert.equal(JSON.stringify(expectationRateContext.manualRate), JSON.stringify({ rate: 18, source: '手入力' }));
assert.equal(JSON.stringify(expectationRateContext.historyRate), JSON.stringify({ rate: 16.4, source: '履歴累計' }));
assert.equal(JSON.stringify(expectationRateContext.namedAssumedRate), JSON.stringify({ rate: 17, source: '夢爽店の想定回転率17.0使用', assumed: true }));
assert.equal(JSON.stringify(expectationRateContext.fallbackAssumedRate), JSON.stringify({ rate: 17, source: '島の想定回転率17.0使用', assumed: true }));

function makeRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function runLimitedJitan(prob, limit, rng) {
  let spins = 0;
  for (let i = 0; i < limit; i += 1) {
    spins += 1;
    if (rng() < prob) return { hit: true, spins };
  }
  return { hit: false, spins };
}

function simulateExpectation(currentSpin, trials, seed, holdSpins = 0) {
  const rng = makeRng(seed);
  const spec = expectationContext.engine.preset.spec;
  const totals = { normal: 0, wins: 0, jitanNormal: 0, jitanFast: 0, yutime: 0, hold: 0 };
  // 時短枠を抜けたあとに回る残保留。電サポ外・玉代ゼロで、当たれば引き戻しになる
  function runHold() {
    if (holdSpins <= 0) return false;
    const held = runLimitedJitan(spec.hitProb, holdSpins, rng);
    totals.hold += held.spins;
    return held.hit;
  }
  function playState(state) {
    while (true) {
      totals.wins += 1;
      if (state === 'E') {
        if (rng() < spec.kakuhenRate) continue;
        const jitan = runLimitedJitan(spec.hitProb, spec.jitanNormal, rng);
        totals.jitanNormal += jitan.spins;
        if (!jitan.hit && !runHold()) return;
        state = 'J';
      } else {
        if (rng() < spec.kakuhenRate) {
          state = 'E';
          continue;
        }
        const jitan = runLimitedJitan(spec.hitProb, spec.jitanChain, rng);
        totals.jitanFast += jitan.spins;
        if (!jitan.hit && !runHold()) return;
        state = 'J';
      }
    }
  }
  for (let trial = 0; trial < trials; trial += 1) {
    const toTenjo = Math.max(0, spec.tenjo - currentSpin);
    const normal = runLimitedJitan(spec.hitProb, toTenjo, rng);
    totals.normal += normal.spins;
    if (normal.hit) {
      playState('E');
      continue;
    }
    const yutime = runLimitedJitan(spec.hitProb, spec.yutimeJitan, rng);
    totals.yutime += yutime.spins;
    if (yutime.hit || runHold()) playState('J');
  }
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / trials]));
}

function assertMonteCarloClose(currentSpin, seed, holdSpins = 0) {
  const analytic = expectationContext.engine.calculate({ currentSpin, rotationRate: 18 }, { yenPerBall: 4, netBallsPerWin: 1400, jitanNormalBallsPerSpin: -0.2, jitanFastBallsPerSpin: -0.5, yutimeBallsPerSpin: -1.0, holdSpins });
  const simulated = simulateExpectation(currentSpin, 300000, seed, holdSpins);
  const cases = [
    ['expectedNormalSpins', simulated.normal],
    ['expectedWins', simulated.wins],
    ['expectedJitanNormalSpins', simulated.jitanNormal],
    ['expectedJitanFastSpins', simulated.jitanFast],
    ['expectedYutimeSpins', simulated.yutime],
    ['expectedDensapoSpins', simulated.jitanNormal + simulated.jitanFast + simulated.yutime],
    ['expectedHoldSpins', simulated.hold]
  ];
  for (const [key, actual] of cases) {
    const expected = analytic[key];
    const tolerance = Math.max(Math.abs(expected) * 0.02, 0.05);
    assert.ok(Math.abs(actual - expected) <= tolerance, `${key} currentSpin=${currentSpin} hold=${holdSpins}: analytic=${expected}, simulated=${actual}, tolerance=${tolerance}`);
  }
}

assertMonteCarloClose(0, 0xB522);
assertMonteCarloClose(900, 0xB521);
// B91: 残保留5でもモンテカルロと一致すること（引き戻し・残保留回転の独立検算）
assertMonteCarloClose(0, 0xB532, 5);
assertMonteCarloClose(900, 0xB531, 5);

function chooseAgnesJitanLimit(rng) {
  const roll = rng();
  if (roll < 0.04) return 90;
  if (roll < 0.70) return 40;
  return 15;
}

function runUnboundedHit(prob, rng) {
  let spins = 0;
  while (true) {
    spins += 1;
    if (rng() < prob) return spins;
  }
}

function simulateAgnesExpectation(currentSpin, trials, seed, holdSpins = 0) {
  const rng = makeRng(seed);
  const spec = agnesPreset.spec;
  const totals = { normal: 0, wins: 0, postSupport: 0, yutime: 0, hold: 0 };
  // 時短を抜けたあとに回る残保留（電サポ外・玉代ゼロ）
  function runHold() {
    if (holdSpins <= 0) return false;
    const held = runLimitedJitan(spec.hitProbLow, holdSpins, rng);
    totals.hold += held.spins;
    return held.hit;
  }
  function playChain() {
    while (true) {
      totals.wins += 1;
      const st = runLimitedJitan(spec.hitProbHigh, spec.stSpins, rng);
      totals.postSupport += st.spins;
      if (st.hit) continue;
      const jitan = runLimitedJitan(spec.hitProbLow, chooseAgnesJitanLimit(rng), rng);
      totals.postSupport += jitan.spins;
      if (!jitan.hit && !runHold()) return;
    }
  }
  for (let trial = 0; trial < trials; trial += 1) {
    const toTenjo = Math.max(0, spec.tenjo - currentSpin);
    const normal = runLimitedJitan(spec.hitProbLow, toTenjo, rng);
    totals.normal += normal.spins;
    if (!normal.hit) totals.yutime += runUnboundedHit(spec.hitProbLow, rng);
    playChain();
  }
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / trials]));
}

const agnesAnalytic = expectationContext.engine.calculate(
  { presetId: 'agnes-pe', currentSpin: 0, rotationRate: 18 },
  { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8, holdSpins: 0 }
);
const agnesSimulated = simulateAgnesExpectation(0, 300000, 0xA679, 0);
for (const [key, actual] of [
  ['expectedNormalSpins', agnesSimulated.normal],
  ['expectedWins', agnesSimulated.wins],
  ['expectedJitanFastSpins', agnesSimulated.postSupport],
  ['expectedYutimeSpins', agnesSimulated.yutime],
  ['expectedDensapoSpins', agnesSimulated.postSupport + agnesSimulated.yutime],
  ['expectedHoldSpins', agnesSimulated.hold]
]) {
  const expected = agnesAnalytic[key];
  const tolerance = Math.max(Math.abs(expected) * 0.02, 0.05);
  assert.ok(Math.abs(actual - expected) <= tolerance, `agnes ${key}: analytic=${expected}, simulated=${actual}, tolerance=${tolerance}`);
}
// B91: 残保留5でもアグネスPEがモンテカルロと一致すること
const agnesAnalyticHold = expectationContext.engine.calculate(
  { presetId: 'agnes-pe', currentSpin: 0, rotationRate: 18 },
  { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8, holdSpins: 5 }
);
const agnesSimulatedHold = simulateAgnesExpectation(0, 300000, 0xA681, 5);
for (const [key, actual] of [
  ['expectedNormalSpins', agnesSimulatedHold.normal],
  ['expectedWins', agnesSimulatedHold.wins],
  ['expectedJitanFastSpins', agnesSimulatedHold.postSupport],
  ['expectedYutimeSpins', agnesSimulatedHold.yutime],
  ['expectedDensapoSpins', agnesSimulatedHold.postSupport + agnesSimulatedHold.yutime],
  ['expectedHoldSpins', agnesSimulatedHold.hold]
]) {
  const expected = agnesAnalyticHold[key];
  const tolerance = Math.max(Math.abs(expected) * 0.02, 0.05);
  assert.ok(Math.abs(actual - expected) <= tolerance, `agnes hold=5 ${key}: analytic=${expected}, simulated=${actual}, tolerance=${tolerance}`);
}
const agnesNoSupportLoss = expectationContext.engine.calculate(
  { presetId: 'agnes-pe', currentSpin: 0, rotationRate: 18 },
  { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0 , holdSpins: 0 }
);
assert.ok(Math.abs(agnesNoSupportLoss.winBalls - agnesNoSupportLoss.expectedWins * 587.5) < 0.000001, 'agnes zero support rates should not apply support loss');
for (const currentSpin of [0, 189]) {
  const base = expectationContext.engine.calculate(
    { presetId: 'agnes-pe', currentSpin, rotationRate: 17 },
    { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0 , holdSpins: 0 }
  );
  const yutimeOnly = expectationContext.engine.calculate(
    { presetId: 'agnes-pe', currentSpin, rotationRate: 17 },
    { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8 , holdSpins: 0 }
  );
  const fastOnly = expectationContext.engine.calculate(
    { presetId: 'agnes-pe', currentSpin, rotationRate: 17 },
    { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 587.5, jitanFastBallsPerSpin: -0.8, yutimeBallsPerSpin: 0 , holdSpins: 0 }
  );
  assert.ok(Math.abs((yutimeOnly.evYen - base.evYen) - base.expectedYutimeSpins * -0.8 * 4) < 0.000001, `agnes yutime-only loss currentSpin=${currentSpin}`);
  assert.ok(Math.abs((fastOnly.evYen - base.evYen) - base.expectedJitanFastSpins * -0.8 * 4) < 0.000001, `agnes fast-only loss currentSpin=${currentSpin}`);
}
assert.ok(Math.abs((agnesNoSupportLoss.evYen - agnesAnalytic.evYen) - agnesAnalytic.expectedYutimeSpins * 0.8 * 4) < 0.000001, 'agnes default yutime loss should only apply before-hit yutime spins');
const agnesArticleRev2 = expectationContext.engine.calculate(
  { presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17 },
  { presetId: 'agnes-pe', yenPerBall: 100 / 28.01, netBallsPerWin: 580, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8 , holdSpins: 0 }
);
assert.ok(Math.abs(Math.round(agnesArticleRev2.evYen) - 1304) <= 5, `agnes article rev2 representative EV=${agnesArticleRev2.evYen}`);

function simulateInvestmentSplit(currentSpin, rotationRate, availableBalls, trials, seed) {
  const rng = makeRng(seed);
  const spec = expectationContext.engine.preset.spec;
  const ballsPerSpin = 250 / rotationRate;
  const toTenjo = Math.max(0, spec.tenjo - currentSpin);
  const totals = { mochidamaBalls: 0, cashBalls: 0, normalCostYen: 0 };
  for (let trial = 0; trial < trials; trial += 1) {
    const normal = runLimitedJitan(spec.hitProb, toTenjo, rng);
    const investBalls = normal.spins * ballsPerSpin;
    const mochidamaBalls = Math.min(investBalls, availableBalls);
    const cashBalls = Math.max(0, investBalls - mochidamaBalls);
    totals.mochidamaBalls += mochidamaBalls;
    totals.cashBalls += cashBalls;
    totals.normalCostYen += mochidamaBalls * (100 / 28) + cashBalls / 250 * 1000;
  }
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / trials]));
}

const splitAnalytic = expectationContext.engine.calculate(
  { currentSpin: 434, rotationRate: 17, availableBalls: 2500 },
  { ...zeroSupportSettings, yenPerBall: 100 / 28 }
);
const splitMonteCarlo = simulateInvestmentSplit(434, 17, 2500, 500000, 0xB530);
for (const key of ['mochidamaBalls', 'cashBalls', 'normalCostYen']) {
  const expected = splitAnalytic[key];
  const actual = splitMonteCarlo[key];
  const tolerance = Math.max(Math.abs(expected) * 0.02, 0.5);
  assert.ok(Math.abs(actual - expected) <= tolerance, `${key}: analytic=${expected}, simulated=${actual}, tolerance=${tolerance}`);
}
const payoutPriorityContext = vm.createContext({
  DEFAULT_NET_BALLS_PER_WIN: 1400,
  MACHINE_PRESETS: [{ id: 'umi-sp5', defaults: { netBallsPerWin: 1400, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.3 }, roundTypes: [{ id: 'r4', label: '4R', balls: 560 }, { id: 'r10', label: '10R', balls: 1400 }] }],
  data: { presetSettings: {}, machines: [{ id: 'm1', presetId: 'umi-sp5' }], sessions: [] },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  positiveNumberOrDefault(value, fallback) {
    const n = payoutPriorityContext.normalizeNumber(value);
    return n !== null && n > 0 ? n : fallback;
  },
  presetById(id) {
    return payoutPriorityContext.MACHINE_PRESETS.find((preset) => preset.id === id) || null;
  },
  normalizeMachinePresetId(machine) {
    return machine?.presetId || '';
  },
  filteredSessions() {
    return payoutPriorityContext.data.sessions;
  },
  nowIso() {
    return '2026-08-17T00:00:00.000Z';
  }
});
new vm.Script(`
  ${presetSettingsHelpers}
  globalThis.info = (settings, sessions) => {
    data.presetSettings = { 'umi-sp5': settings };
    data.sessions = sessions;
    return netBallsPerWinInfo('umi-sp5', data.machines[0]);
  };
`).runInContext(payoutPriorityContext);
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWin: 1500, netBallsPerWinManual: true }, [{ machineId: 'm1', hits: [{ roundTypeId: 'r10', actualBalls: 1380 }] }])), JSON.stringify({ value: 1500, source: '手入力', count: null }));
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r4', actualBalls: 600 }] }])), JSON.stringify({ value: 990, source: '実測平均', count: 2 }));
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] }])), JSON.stringify({ value: 980, source: 'ラウンド集計', count: 2 }));
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [])), JSON.stringify({ value: 1400, source: '理論値', count: 0 }));
// B90: ヤメ入力の累計値があるセッションは「累計 ÷ 当選件数」で実測平均に載る
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', sessionActualBalls: 2400, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] }])), JSON.stringify({ value: 1200, source: '実測平均', count: 2 }));
// 累計値のあるセッションと、当選ごとだけのセッションが混在しても合算平均になる
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [
  { machineId: 'm1', sessionActualBalls: 2400, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] },
  { machineId: 'm1', hits: [{ roundTypeId: 'r10', actualBalls: 1000 }] }
])), JSON.stringify({ value: 1133.3333333333333, source: '実測平均', count: 3 }));
const availableBallsContext = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
});
new vm.Script(`
  ${availableBallsHelpers}
  globalThis.parts = availableBallsFromParts;
`).runInContext(availableBallsContext);
assert.equal(JSON.stringify(availableBallsContext.parts(2000, 500)), JSON.stringify({ mochidama: 2000, saipurei: 500, total: 2500 }));
assert.equal(JSON.stringify(availableBallsContext.parts('', 500)), JSON.stringify({ mochidama: 0, saipurei: 500, total: 500 }));
assert.equal(JSON.stringify(availableBallsContext.parts('', '')), JSON.stringify({ mochidama: 0, saipurei: 0, total: 0 }));
const investmentAmountContext = vm.createContext({
  normalizeInvestmentSource(source) {
    return source === 'mochidama' || source === 'saipurei' || source === 'cash' ? source : 'cash';
  },
  balanceForSource(session, source) {
    return session.balances[source];
  },
  numberText(value, fallback = '') {
    return value === null || value === undefined ? fallback : String(value);
  }
});
new vm.Script(`
  ${investmentAmountForSourceBlock}
  globalThis.unit = investmentUnitForSource;
  globalThis.amount = investmentAmountForSource;
  globalThis.button = investmentButtonText;
`).runInContext(investmentAmountContext);
assert.equal(investmentAmountContext.unit('mochidama'), 125);
assert.equal(investmentAmountContext.unit('cash'), 500);
assert.equal(investmentAmountContext.amount({ balances: { mochidama: 64 } }, 'mochidama', 125), 64);
assert.equal(investmentAmountContext.amount({ balances: { mochidama: 200 } }, 'mochidama', 125), 125);
assert.equal(investmentAmountContext.amount({ balances: { mochidama: 0 } }, 'mochidama', 125), 125);
assert.equal(investmentAmountContext.amount({ balances: { cash: 300 } }, 'cash', 500), 300);
assert.equal(investmentAmountContext.button('mochidama', 64), '-64玉');
assert.equal(investmentAmountContext.button('cash', 300), '-300円');
const transferContext = vm.createContext({
  __copied: '',
  __session: null,
  __store: {},
  data: {
    machines: [{ id: 'm_transfer', presetId: 'umi-sp5' }]
  },
  YUTIME_EXPECTATION_ENGINE: {
    preset: { spec: { tenjo: 950 } }
  },
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  normalizeStartEv(value) {
    return value && value.usedRate ? value : null;
  },
  normalizeHits(value) {
    return Array.isArray(value) ? value : [];
  },
  cumulativeActualBallsBeforeHit(session) {
    return (Array.isArray(session?.hits) ? session.hits : [])
      .map((hit) => transferContext.normalizeNumber(hit?.actualBalls))
      .filter((value) => value !== null && value > 0)
      .reduce((sum, value) => sum + value, 0);
  },
  sessionActualBallsTotal(session) {
    const explicit = transferContext.normalizeNumber(session?.sessionActualBalls);
    if (explicit !== null && explicit > 0) return explicit;
    const perHit = transferContext.cumulativeActualBallsBeforeHit(session);
    return perHit > 0 ? perHit : null;
  },
  normalizeMachinePresetId() {
    return 'umi-sp5';
  },
  storeById() {
    return transferContext.__store;
  },
  tenjoForPresetId() {
    return 950;
  },
  YUTIME_EXPECTATION_ENGINE: expectationContext.engine,
  roundTypeById(presetId, roundTypeId) {
    return {
      r4: { id: 'r4', label: '4R', balls: 560 },
      r10: { id: 'r10', label: '10R', balls: 1400 }
    }[roundTypeId] || null;
  },
  deriveSession(session) {
    return {
      hitBalls: session.__hitBalls ?? null,
      isEstimatedPayout: session.__isEstimatedPayout === true,
      profitYen: session.__profitYen ?? null,
      consumedBalls: session.__consumedBalls ?? null
    };
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
  usesTapInvestmentMode(session) {
    return session?.__tapMode === true;
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
new vm.Script(`${counterSpinHelpers}\n${transferSummary}`).runInContext(transferContext);
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
const profitContext = vm.createContext({
  normalizeNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  investmentSource(item) {
    return item?.source || item?.type || 'cash';
  },
  storeById() {
    return {};
  },
  exchangeRateForStore(store) {
    return 100 / Number(store?.exchangeBalls || 28.01);
  },
  byId() {
    return null;
  },
  currentTime() {
    return '12:34';
  },
  usesTapInvestmentMode(session) {
    return session?.__tapMode === true;
  },
  escapeHtml(value) {
    return String(value ?? '');
  }
});
new vm.Script(`
  ${investmentTotalsBlock}
  globalThis.profit = (session, exchangeBalls, isPersonal = false) => {
    const totals = investmentTotals(session);
    return profitYenForSession(session, totals, { exchangeBalls, isPersonal });
  };
`).runInContext(profitContext);
const b81Fixture = {
  endTotalBalls: 5569,
  zanhoryuBalls: 0,
  investments: [
    { source: 'cash', amount: 1500 },
    { source: 'mochidama', amount: 2500 }
  ]
};
assert.ok(Math.abs(profitContext.profit(b81Fixture, 28.01) - 9457) <= 5);
const b81EqualExchange = {
  endTotalBalls: 5569,
  zanhoryuBalls: 0,
  investments: [
    { source: 'cash', amount: 1500 },
    { source: 'mochidama', amount: 2500 }
  ]
};
const equalExchangeOldDiff = 5569 - (2500 + 1500 / 1000 * 250);
assert.equal(profitContext.profit(b81EqualExchange, 25), Math.round(equalExchangeOldDiff * 4));
const b81NoCash = {
  endTotalBalls: 5569,
  zanhoryuBalls: 0,
  investments: [{ source: 'mochidama', amount: 2500 }]
};
assert.equal(profitContext.profit(b81NoCash, 28.01), Math.round((5569 - 2500) * (100 / 28.01)));
const b84NonPersonalPartialTap = {
  __tapMode: true,
  startMochidama: 2500,
  endTotalBalls: 5569,
  zanhoryuBalls: 0,
  investments: [
    { source: 'cash', amount: 1500 },
    { source: 'mochidama', amount: 1000 }
  ]
};
assert.ok(Math.abs(profitContext.profit(b84NonPersonalPartialTap, 28.01, false) - 14812) <= 5);
const b84TapProfit = {
  __tapMode: true,
  startMochidama: 2500,
  endTotalBalls: 1487,
  zanhoryuBalls: 0,
  investments: [{ source: 'mochidama', amount: 250 }]
};
assert.equal(profitContext.profit(b84TapProfit, 28, true), Math.round((1487 - 2500) * (100 / 28)));
const transferFixture = {
  id: 's_transfer',
  machineId: 'm_transfer',
  startSpin: 525,
  endSpin: 620,
  prevDayEndSpin: null,
  hitCount: 2,
  hits: [
    { roundTypeId: 'r10', actualBalls: 1380 },
    { roundTypeId: 'r4', actualBalls: 600 }
  ],
  startEv: { usedRate: 18.5, effectiveSpin: 525, availableBalls: 2500, evYen: 1339 },
  settlementRecoverYen: null,
  endTotalBalls: 4750,
  zanhoryuBalls: null,
  __profitYen: 2500,
  __consumedBalls: 625,
  investments: [
    { source: 'mochidama', amount: 250 },
    { source: 'saipurei', amount: 125 },
    { source: 'cash', amount: 1000 }
  ]
};
transferContext.__session = transferFixture;
assert.equal(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  '投資1,000円/回収0円/引出375個/預入4,750個\n開始期待値1,339円/想定回転数425回転/残り回転数330回転/消費玉数625玉/消化回転数95回転/1R平均141.4玉/R/実収支2,500円'
);
// B90: ヤメ入力の累計獲得出玉を1R平均の分子に採用する
const b90SessionTotal = { ...transferFixture, id: 's_b90_total', sessionActualBalls: 2800 };
transferContext.__session = b90SessionTotal;
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /1R平均200玉\/R/
);
// 当選ごとが未入力でも、ヤメの累計だけで1R平均が出る
const b90NoPerHit = {
  ...transferFixture,
  id: 's_b90_nohit_input',
  sessionActualBalls: 2800,
  hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }]
};
transferContext.__session = b90NoPerHit;
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /1R平均200玉\/R/
);
// 空欄なら従来どおり当選ごとの合計（1,980玉 ÷ 14R）
const b90Empty = { ...transferFixture, id: 's_b90_empty', sessionActualBalls: null };
transferContext.__session = b90Empty;
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /1R平均141\.4玉\/R/
);
transferContext.__session = transferFixture;
vm.runInContext("copyTransferSummary('s_transfer')", transferContext);
assert.equal(transferContext.__copied, '投資1,000円/回収0円/引出375個/預入4,750個\n開始期待値1,339円/想定回転数425回転/残り回転数330回転/消費玉数625玉/消化回転数95回転/1R平均141.4玉/R/実収支2,500円');
transferContext.__store = { isPersonal: true };
transferContext.__session = {
  id: 's_transfer_tap',
  machineId: 'm_transfer',
  __tapMode: true,
  startSpin: 0,
  endSpin: 10,
  startMochidama: 2500,
  hitCount: 1,
  hits: [{ roundTypeId: 'r10', actualBalls: 1400 }],
  startEv: null,
  settlementRecoverYen: null,
  endTotalBalls: 1487,
  zanhoryuBalls: 0,
  __profitYen: -3618,
  __consumedBalls: 152,
  investments: [{ source: 'mochidama', amount: 250 }]
};
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /^投資0円\/回収0円\/引出2,500個\/預入1,487個/
);
transferContext.__session = {
  id: 's_transfer_b85_dai357',
  machineId: 'm_transfer',
  __tapMode: true,
  startSpin: 0,
  endSpin: 10,
  startMochidama: 1487,
  hitCount: 1,
  hits: [{ roundTypeId: 'r10', actualBalls: 1400 }],
  startEv: null,
  settlementRecoverYen: null,
  endTotalBalls: 1312,
  zanhoryuBalls: 0,
  __profitYen: -625,
  __consumedBalls: 175,
  investments: [{ source: 'mochidama', amount: 125 }]
};
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /消費玉数175玉/
);
transferContext.__store = { isPersonal: false };
transferContext.__session = {
  id: 's_transfer_non_personal_tap',
  machineId: 'm_transfer',
  __tapMode: true,
  startSpin: 0,
  endSpin: 10,
  startMochidama: 2500,
  hitCount: 1,
  hits: [{ roundTypeId: 'r10', actualBalls: 1400 }],
  startEv: null,
  settlementRecoverYen: null,
  endTotalBalls: 5569,
  zanhoryuBalls: 0,
  __profitYen: 14812,
  __consumedBalls: 1000,
  investments: [
    { source: 'cash', amount: 1500 },
    { source: 'mochidama', amount: 1000 }
  ]
};
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /^投資1,500円\/回収0円\/引出1,000個/
);
transferContext.__store = {};
transferContext.__session = {
  id: 's_transfer_open',
  machineId: 'm_transfer',
  startSpin: 525,
  endSpin: null,
  hits: [],
  investments: []
};
assert.equal(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  '投資0円/回収0円/引出0個/預入0個\n開始期待値-/想定回転数-/残り回転数-/消費玉数-/消化回転数-/1R平均-/実収支-'
);
transferContext.__session = {
  id: 's_transfer_estimated',
  machineId: 'm_transfer',
  startSpin: 100,
  endSpin: 200,
  hitCount: 1,
  hits: [{ roundTypeId: 'r10' }],
  __hitBalls: 1400,
  __isEstimatedPayout: true,
  investments: []
};
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /1R平均-/
);
assert.match(openBalanceEditForm, /const currentBalance = currentBalanceForStartKey\(session, key\);/);
assert.match(openBalanceEditForm, /value="\$\{escapeHtml\(currentBalance \?\? ""\)\}"/);
assert.match(openBalanceEditForm, /session\[key\] = value === null \? null : balanceStartValueForCurrent\(session, key, value\);/);
assert.match(runningRateHelpers, /function normalRateInvestments\(session\) \{/);
assert.match(runningRateHelpers, /return investments\.filter\(\(item\) => investmentBeforeHit\(item, session, hitSpin\)\);/);
assert.match(runningRateHelpers, /function runningNormalSpinCount\(session\) \{/);
assert.match(runningRateHelpers, /const hitSpin = normalizeNumber\(session\?\.hitSpin\);/);
assert.match(runningRateHelpers, /if \(hitSpin !== null\) \{\s*const spins = hitSpin - start;\s*return spins >= 0 \? spins : null;\s*\}/);
assert.match(runningRateHelpers, /if \(normalizeHits\(session\?\.hits\)\.length\) return null;/);
assert.match(runningSpinCount, /return runningNormalSpinCount\(session\);/);
assert.match(runningPanelRate, /const inputBalls = runningNormalInputBalls\(session\);/);
assert.match(runningPanelRate, /const spins = runningNormalSpinCount\(session\);/);
assert.match(runningPanelRate, /return inputBalls > 0 && spins !== null && spins >= 0 \? spins \/ inputBalls \* 250 : null;/);
assert.match(runningPanelInputBallsBlock, /function runningNormalInputBalls\(session\) \{/);
assert.match(runningPanelInputBallsBlock, /const investedBalls = normalRateInvestments\(session\)\.reduce/);
assert.match(runningPanelInputBallsBlock, /tapModeNormalConsumedBalls\(session, investedBalls, hasHit, store\)/);
assert.match(runningPanelInputBallsBlock, /return inputBalls > 0 \? Math\.round\(inputBalls\) : null;/);
assert.match(deriveSession, /const normalInvestedBalls = normalRateInvestments\(session\)\.reduce/);
assert.match(deriveSession, /const tapConsumedCandidates = tapMode \? tapModeNormalConsumedCandidates\(session, normalInputBalls, hasHit, store\) : null;/);
assert.match(deriveSession, /tapModeNormalConsumedBalls\(session, normalInputBalls, hasHit, store, tapConsumedCandidates\)/);
assert.match(deriveSession, /consumedBallsCandidates: tapConsumedCandidates && normalSpins !== null \? \{/);
assert.match(renderRunning, /consumedBallsChoiceHtml\(session, derived\)/);
assert.match(renderRunning, /bindConsumedBallsChoice\(els\.runningArea, session\)/);
assert.match(openRateSummary, /consumedBallsChoiceHtml\(session, derived\)/);
assert.match(openRateSummary, /bindConsumedBallsChoice\(els\.modalBody, session/);
const runningRateContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function nowIso() { return "2026-08-22T00:00:00.000Z"; }
  const CONSUMED_BALLS_DIVERGENCE_THRESHOLD = 500;
  ${normalizeHitsBlock}
  function normalizeConsumedBallsSource(value) { return value === "tray" || value === "taps" ? value : null; }
  function cumulativeActualBallsBeforeHit(session) {
    return normalizeHits(session?.hits)
      .map((hit) => normalizeNumber(hit.actualBalls))
      .filter((value) => value !== null && value > 0)
      .reduce((sum, value) => sum + value, 0);
  }
  function sessionActualBallsTotal(session) {
    const explicit = normalizeNumber(session?.sessionActualBalls);
    if (explicit !== null && explicit > 0) return explicit;
    const perHit = cumulativeActualBallsBeforeHit(session);
    return perHit > 0 ? perHit : null;
  }
  function storeById() { return {}; }
  function investmentToBalls(item) {
    return (item.source || item.type) === "cash" ? Number(item.amount || 0) / 4 : Number(item.amount || 0);
  }
  function usesTapInvestmentMode() { return true; }
  ${tapModeConsumedBlock}
  ${runningPanelInputBallsBlock}
  ${runningRateHelpers}
  function normalizeMachinePresetId() { return ""; }
  function presetById() { return null; }
  function yutimeEnterSpinForRate(session) { return normalizeNumber(session?.yutimeEnterSpin); }
  function hitRoundBasedPayout() { return null; }
  function exchangeBallsForStore() { return 25; }
  function exchangeRateForStore() { return 4; }
  function investmentSource(item) { return item.source || item.type || "mochidama"; }
  function investmentTotals(session) {
    return (session.investments || []).reduce((totals, item) => {
      const source = investmentSource(item);
      if (source === "cash") totals.cashYen += Number(item.amount || 0);
      if (source === "saipurei") totals.saipureiBalls += Number(item.amount || 0);
      if (source === "mochidama") totals.mochidamaBalls += Number(item.amount || 0);
      return totals;
    }, { cashYen: 0, saipureiBalls: 0, mochidamaBalls: 0 });
  }
  function profitYenForSession() { return null; }
  ${runningSpinCount}
  ${deriveSession}
  const baseInvestments = [
    { source: "mochidama", amount: 250, phase: "normal", spinAt: 360, time: "10:00" },
    { source: "mochidama", amount: 250, phase: "normal", spinAt: 160, time: "10:20" },
    { source: "cash", amount: 1000, phase: "yutime", spinAt: 700, time: "10:30" }
  ];
  const afterHit = {
    storeId: "s",
    startSpin: 350,
    currentSpin: 160,
    startMochidama: 0,
    hitSpin: 420,
    hitCount: 1,
    hits: [{ roundTypeId: "r10", at: "2026-08-22T10:10:00" }],
    investments: baseInvestments,
    yutimeEnterBalls: null,
    hitVia: "normal",
    hitRemainBalls: null,
    endTotalBalls: null,
    zanhoryuBalls: 0
  };
  const beforeHit = {
    storeId: "s",
    startSpin: 350,
    currentSpin: 420,
    startMochidama: 0,
    hitSpin: null,
    hitCount: null,
    hits: [],
    investments: [{ source: "mochidama", amount: 250, phase: "normal", spinAt: 360, time: "10:00" }],
    yutimeEnterBalls: null,
    hitVia: null,
    hitRemainBalls: null,
    endTotalBalls: null,
    zanhoryuBalls: 0
  };
  const badCurrent = { ...beforeHit, currentSpin: 160 };
  const missingHitSpin = { ...afterHit, hitSpin: null, hits: [{ roundTypeId: "r10", at: "2026-08-22T10:10:00" }] };
  const b84TapHit = {
    storeId: "s",
    startSpin: 0,
    currentSpin: 0,
    startMochidama: 250,
    hitSpin: 10,
    hitCount: 1,
    hits: [{ roundTypeId: "r10", at: "2026-08-22T10:05:00" }],
    investments: [{ source: "mochidama", amount: 250, phase: "normal", spinAt: 1, time: "10:00" }],
    yutimeEnterBalls: null,
    hitVia: "normal",
    hitRemainBalls: 98,
    endTotalBalls: 1487,
    zanhoryuBalls: 0
  };
  const b85Dai360 = {
    ...b84TapHit,
    startMochidama: 2500,
    hitRemainBalls: 2250,
    endTotalBalls: 2250
  };
  const b85Dai357 = {
    ...b84TapHit,
    startMochidama: 1487,
    hitRemainBalls: 1312,
    endTotalBalls: 1312,
    investments: [{ source: "mochidama", amount: 125, phase: "normal", spinAt: 1, time: "10:00" }]
  };
  const b85OverRemain = {
    ...b84TapHit,
    startMochidama: 100,
    hitRemainBalls: 300,
    investments: [{ source: "mochidama", amount: 125, phase: "normal", spinAt: 1, time: "10:00" }]
  };
  const b85NoRemain = {
    ...b84TapHit,
    startMochidama: 2500,
    hitRemainBalls: null,
    investments: [{ source: "mochidama", amount: 125, phase: "normal", spinAt: 1, time: "10:00" }]
  };
  const b85YutimeEnter = {
    ...b84TapHit,
    startMochidama: 2500,
    hitSpin: null,
    hitCount: null,
    hits: [],
    yutimeEnterSpin: 10,
    yutimeEnterBalls: 2250,
    hitVia: "yutime",
    hitRemainBalls: null
  };
  const b89Dai104 = {
    ...b84TapHit,
    startMochidama: 5710,
    hitSpin: 110,
    currentSpin: 110,
    hitRemainBalls: 1025,
    investments: Array.from({ length: 12 }, (_, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: index + 1, time: "10:00" }))
  };
  const b89Dai104Taps = { ...b89Dai104, consumedBallsSource: "taps" };
  const b89Dai104Tray = { ...b89Dai104, consumedBallsSource: "tray" };
  const b89Dai103 = {
    ...b84TapHit,
    startMochidama: 2500,
    hitSpin: 80,
    currentSpin: 80,
    hitRemainBalls: 4200,
    investments: Array.from({ length: 10 }, (_, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: index + 1, time: "10:00" }))
  };
  const b89SmallDiff = {
    ...b84TapHit,
    startMochidama: 2500,
    hitSpin: 120,
    currentSpin: 120,
    hitRemainBalls: 1300,
    investments: Array.from({ length: 10 }, (_, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: index + 1, time: "10:00" }))
  };
  const b89SmallDiffSelected = { ...b89SmallDiff, consumedBallsSource: "taps" };
  const b95Base = {
    ...b84TapHit,
    startSpin: 0,
    currentSpin: 88,
    startMochidama: 5900,
    hitSpin: 88,
    hitRemainBalls: 5900,
    hitTrackedBalls: 5900,
    endTotalBalls: 5900,
    investments: Array.from({ length: 10 }, (_, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: index + 1, time: "10:00" }))
  };
  const b95NoCorrection = { ...b95Base };
  const b95TrayRemain = { ...b95Base, hitRemainBalls: 5950, endTotalBalls: 5950 };
  const b95TapLeak = { ...b95Base, hitRemainBalls: 5775, endTotalBalls: 5775 };
  const b95SecondLap = { ...b95Base, startMochidama: 11761, hitRemainBalls: 5900, endTotalBalls: 5900 };
  const b95YutimeEnterKeepsB85 = { ...b85YutimeEnter, hitTrackedBalls: 5900 };
  globalThis.afterHitSpinCount = runningSpinCount(afterHit);
  globalThis.afterHitRate = runningPanelRate(afterHit);
  globalThis.afterHitInvestments = normalRateInvestments(afterHit).length;
  globalThis.afterHitDerived = deriveSession(afterHit).rate;
  globalThis.beforeHitSpinCount = runningSpinCount(beforeHit);
  globalThis.beforeHitRate = runningPanelRate(beforeHit);
  globalThis.badCurrentSpinCount = runningSpinCount(badCurrent);
  globalThis.badCurrentRate = runningPanelRate(badCurrent);
  globalThis.missingHitSpinCount = runningSpinCount(missingHitSpin);
  globalThis.missingHitRate = runningPanelRate(missingHitSpin);
  globalThis.b84InputBalls = runningNormalInputBalls(b84TapHit);
  globalThis.b84Rate = runningPanelRate(b84TapHit);
  globalThis.b84Derived = deriveSession(b84TapHit);
  globalThis.b85Dai360Derived = deriveSession(b85Dai360);
  globalThis.b85Dai357InputBalls = runningNormalInputBalls(b85Dai357);
  globalThis.b85Dai357Derived = deriveSession(b85Dai357);
  globalThis.b85OverRemainDerived = deriveSession(b85OverRemain);
  globalThis.b85NoRemainDerived = deriveSession(b85NoRemain);
  globalThis.b85YutimeEnterDerived = deriveSession(b85YutimeEnter);
  globalThis.b89Dai104Auto = deriveSession(b89Dai104);
  globalThis.b89Dai104Taps = deriveSession(b89Dai104Taps);
  globalThis.b89Dai104Tray = deriveSession(b89Dai104Tray);
  globalThis.b89Dai103 = deriveSession(b89Dai103);
  globalThis.b89SmallDiff = deriveSession(b89SmallDiff);
  globalThis.b89SmallDiffSelected = deriveSession(b89SmallDiffSelected);
  globalThis.b95NoCorrection = deriveSession(b95NoCorrection);
  globalThis.b95TrayRemain = deriveSession(b95TrayRemain);
  globalThis.b95TapLeak = deriveSession(b95TapLeak);
  globalThis.b95SecondLap = deriveSession(b95SecondLap);
  globalThis.b95YutimeEnterKeepsB85 = deriveSession(b95YutimeEnterKeepsB85);
`).runInContext(runningRateContext);
assert.equal(runningRateContext.afterHitSpinCount, 70);
assert.equal(runningRateContext.afterHitRate, 70);
assert.equal(runningRateContext.afterHitInvestments, 1);
assert.equal(runningRateContext.afterHitDerived, runningRateContext.afterHitRate);
assert.equal(runningRateContext.beforeHitSpinCount, 70);
assert.equal(runningRateContext.beforeHitRate, 70);
assert.equal(runningRateContext.badCurrentSpinCount, null);
assert.equal(runningRateContext.badCurrentRate, null);
assert.equal(runningRateContext.missingHitSpinCount, null);
assert.equal(runningRateContext.missingHitRate, null);
assert.equal(runningRateContext.b84InputBalls, 152);
assert.equal(Number(runningRateContext.b84Rate.toFixed(1)), 16.4);
assert.equal(Number(runningRateContext.b84Derived.rate.toFixed(1)), 16.4);
assert.equal(runningRateContext.b84Derived.consumedBalls, 152);
assert.equal(runningRateContext.b85Dai360Derived.consumedBalls, 250);
assert.equal(Number(runningRateContext.b85Dai360Derived.rate.toFixed(1)), 10.0);
assert.equal(runningRateContext.b85Dai357InputBalls, 175);
assert.equal(runningRateContext.b85Dai357Derived.consumedBalls, 175);
assert.equal(Number(runningRateContext.b85Dai357Derived.rate.toFixed(1)), 14.3);
assert.equal(runningRateContext.b85OverRemainDerived.consumedBalls, 125);
assert.equal(Number(runningRateContext.b85OverRemainDerived.rate.toFixed(1)), 20.0);
assert.equal(JSON.stringify(runningRateContext.b85OverRemainDerived.warnings), JSON.stringify(["通常消費玉の入力を確認"]));
assert.equal(runningRateContext.b85NoRemainDerived.consumedBalls, 125);
assert.equal(Number(runningRateContext.b85NoRemainDerived.rate.toFixed(1)), 20.0);
assert.equal(runningRateContext.b85YutimeEnterDerived.consumedBalls, 250);
assert.equal(Number(runningRateContext.b85YutimeEnterDerived.rate.toFixed(1)), 10.0);
assert.equal(runningRateContext.b89Dai104Auto.consumedBalls, 4685);
assert.equal(Number(runningRateContext.b89Dai104Auto.rate.toFixed(1)), 5.9);
assert.equal(runningRateContext.b89Dai104Auto.consumedBallsCandidates.divergent, true);
assert.equal(runningRateContext.b89Dai104Auto.consumedBallsCandidates.tray, 4685);
assert.equal(runningRateContext.b89Dai104Auto.consumedBallsCandidates.taps, 1500);
assert.equal(runningRateContext.b89Dai104Taps.consumedBalls, 1500);
assert.equal(Number(runningRateContext.b89Dai104Taps.rate.toFixed(1)), 18.3);
assert.equal(runningRateContext.b89Dai104Tray.consumedBalls, 4685);
assert.equal(Number(runningRateContext.b89Dai104Tray.rate.toFixed(1)), 5.9);
assert.equal(runningRateContext.b89Dai103.consumedBalls, 1250);
assert.equal(Number(runningRateContext.b89Dai103.rate.toFixed(1)), 16.0);
assert.equal(runningRateContext.b89Dai103.consumedBallsCandidates.divergent, false);
assert.equal(JSON.stringify(runningRateContext.b89Dai103.warnings), JSON.stringify(["通常消費玉の入力を確認"]));
assert.equal(runningRateContext.b89SmallDiff.consumedBalls, 1200);
assert.equal(Number(runningRateContext.b89SmallDiff.rate.toFixed(1)), 25.0);
assert.equal(runningRateContext.b89SmallDiff.consumedBallsCandidates.divergent, false);
assert.equal(runningRateContext.b89SmallDiffSelected.consumedBalls, 1200);
assert.equal(runningRateContext.b95NoCorrection.consumedBalls, 1250);
assert.equal(Number(runningRateContext.b95NoCorrection.rate.toFixed(1)), 17.6);
assert.equal(runningRateContext.b95NoCorrection.consumedBallsCandidates.divergent, false);
assert.equal(runningRateContext.b95NoCorrection.consumedBallsCandidates.corrected, 1250);
assert.equal(runningRateContext.b95NoCorrection.consumedBallsCandidates.correction, 0);
assert.equal(runningRateContext.b95TrayRemain.consumedBalls, 1200);
assert.equal(Number(runningRateContext.b95TrayRemain.rate.toFixed(1)), 18.3);
assert.equal(runningRateContext.b95TrayRemain.consumedBallsCandidates.divergent, false);
assert.equal(runningRateContext.b95TrayRemain.consumedBallsCandidates.corrected, 1200);
assert.equal(runningRateContext.b95TrayRemain.consumedBallsCandidates.correction, 50);
assert.equal(runningRateContext.b95TapLeak.consumedBalls, 1375);
assert.equal(Number(runningRateContext.b95TapLeak.rate.toFixed(1)), 16.0);
assert.equal(runningRateContext.b95TapLeak.consumedBallsCandidates.divergent, false);
assert.equal(runningRateContext.b95TapLeak.consumedBallsCandidates.corrected, 1375);
assert.equal(runningRateContext.b95TapLeak.consumedBallsCandidates.correction, -125);
assert.equal(runningRateContext.b95SecondLap.consumedBalls, 1250);
assert.equal(Number(runningRateContext.b95SecondLap.rate.toFixed(1)), 17.6);
assert.notEqual(Number(runningRateContext.b95SecondLap.rate.toFixed(1)), 3.8);
assert.equal(runningRateContext.b95SecondLap.consumedBallsCandidates.divergent, false);
assert.equal(runningRateContext.b95YutimeEnterKeepsB85.consumedBalls, 250);
assert.equal(Number(runningRateContext.b95YutimeEnterKeepsB85.rate.toFixed(1)), 10.0);
assert.equal(runningRateContext.b95YutimeEnterKeepsB85.consumedBallsCandidates.divergent, false);
const consumedBallsUiContext = vm.createContext({});
new vm.Script(`
  const CONSUMED_BALLS_SOURCE_LABELS = { tray: "台上差", taps: "タップ合計" };
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function normalizeConsumedBallsSource(value) { return value === "tray" || value === "taps" ? value : null; }
  function usesTapInvestmentMode() { return true; }
  function numberText(value, fallback = "-") { return value === null || value === undefined ? fallback : String(value); }
  function consumedBallsRateText() { return "17.6"; }
  ${consumedBallsChoiceHtmlBlock}
  ${consumedBallsSourceEditorHtmlBlock}
  const newSession = { consumedBallsSource: null, hitTrackedBalls: 5900, yutimeEnterBalls: null };
  const oldSession = { consumedBallsSource: null, hitTrackedBalls: null, yutimeEnterBalls: null };
  const newDerived = { consumedBallsCandidates: { tray: null, taps: 1250, corrected: 1250, correction: 0, selected: null, fallback: false, divergent: false, threshold: 500 }, normalSpins: 88 };
  const oldDerived = { consumedBallsCandidates: { tray: 4685, taps: 1500, selected: null, fallback: false, divergent: true, threshold: 500 }, normalSpins: 110 };
  globalThis.newChoice = consumedBallsChoiceHtml(newSession, newDerived);
  globalThis.oldChoice = consumedBallsChoiceHtml(oldSession, oldDerived);
  globalThis.newEditor = consumedBallsSourceEditorHtml(newSession);
  globalThis.oldEditor = consumedBallsSourceEditorHtml(oldSession);
`).runInContext(consumedBallsUiContext);
assert.equal(consumedBallsUiContext.newChoice, "");
assert.match(consumedBallsUiContext.oldChoice, /data-consumed-source="tray"/);
assert.match(consumedBallsUiContext.oldChoice, /data-consumed-source="taps"/);
assert.doesNotMatch(consumedBallsUiContext.newEditor, /<select id="editConsumedBallsSource"/);
assert.match(consumedBallsUiContext.newEditor, /通常消費玉はタップ合計と当選時の持ち玉差分で確定しています。/);
assert.match(consumedBallsUiContext.oldEditor, /<select id="editConsumedBallsSource"/);
assert.ok(design.includes('スマパチ対応: カード玉と台内クレジットの分離管理（封入式）。当面は台に移した分も持ち玉として扱う運用。'));
assert.match(renderRunning, /<span>\$\{escapeHtml\(option\.label\)\}<\/span><strong>\$\{sourceChipBalanceText\(balance\)\}<\/strong>/);
assert.match(renderRunning, /const selectedAmount = investmentUnitForSource\(selectedSource\);/);
assert.match(renderRunning, /const selectedActualAmount = investmentAmountForSource\(session, selectedSource, selectedAmount\);/);
assert.match(renderRunning, /const selectedCanUse = canUseSource\(session, selectedSource\);/);
assert.match(renderRunning, /const low = !canUseSource\(session, option\.value\);/);
assert.match(renderRunning, /class="primary\$\{selectedCanUse \? "" : " is-low"\}" id="unifiedInvestBtn">\$\{investmentButtonText\(selectedSource, selectedActualAmount\)\}<\/button>/);
assert.match(renderRunning, /メモ\$\{\(machine\?\.memoEntries \|\| \[\]\)\.length > 0 \? "あり" : ""\}/);
assert.match(renderRunning, /id="editActiveBtn">記録の修正・削除<\/button>/);
assert.match(renderRunning, /runningExpectationHtml\(session, machine, liveRate, balances\)/);
assert.match(renderRunning, /const normalInputBalls = runningNormalInputBalls\(session\);/);
assert.match(renderRunning, /<p class="running-normal-summary">通常時合計 \$\{totalSpins !== null && normalInputBalls !== null \? `\$\{numberText\(totalSpins, 0\)\}回転 \/ \$\{numberText\(normalInputBalls, 0\)\}玉` : "-"\}<\/p>/);
assert.match(renderRunning, /総投入の内訳: 持ち玉\$\{numberText\(totals\.mochidamaBalls, 0\)\}玉・再プレ\$\{numberText\(totals\.saipureiBalls, 0\)\}玉・現金\$\{numberText\(totals\.cashYen, 0\)\}円/);
assert.doesNotMatch(renderRunning, /累計投入 \$\{numberText\(panelInputBalls, 0\)\}玉 \/ 累計回転/);
assert.doesNotMatch(renderRunning, /<span>内訳: 持ち玉/);
assert.doesNotMatch(section('class="running-live-row"', '<p class="running-normal-summary"'), /通常時合計/);
assert.match(renderRunning, /bindNailRatingChips\(machine, els\.runningArea\);/);
assert.match(renderRunning, /querySelectorAll\("\[data-trial-rate-delta\]"\)/);
assert.match(renderRunning, /adjustRunningTrialRate\(Number\(button\.dataset\.trialRateDelta\)\)/);
assert.match(renderRunning, /resetRunningTrialState\(\);\s*renderRunning\(\);/);
assert.match(renderRunning, /byId\("runningEvaluationSection"\)/);
assert.match(renderRunning, /runningEvaluationOpen = runningEvaluationSection\.open;/);
assert.match(renderRunning, /byId\("runningNailSection"\)/);
assert.match(renderRunning, /runningNailOpen = runningNailSection\.open;/);
const runningExpectationIndex = renderRunning.indexOf('runningExpectationHtml(session, machine, liveRate, balances)');
const runningBottomIndex = renderRunning.indexOf('<div class="running-bottom-controls');
const runningBottomEndIndex = renderRunning.indexOf('</div>', renderRunning.indexOf('<div class="counter-row">'));
assert.ok(runningExpectationIndex > renderRunning.indexOf('<div class="running-sticky'), 'running expectation should be in the upper running content');
assert.ok(runningExpectationIndex < runningBottomIndex, 'running expectation should render before the thumb controls');
assert.ok(
  !renderRunning.slice(runningBottomIndex, runningBottomEndIndex).includes('runningExpectationHtml(session, machine, liveRate, balances)'),
  'running expectation should not remain inside the thumb controls'
);
assert.ok(
  renderRunning.indexOf('id="unifiedInvestBtn"') < renderRunning.indexOf('id="openChargeBtn"')
  && renderRunning.indexOf('id="openChargeBtn"') < renderRunning.indexOf('id="openRunningMachineMemoBtn"')
  && renderRunning.indexOf('id="openRunningMachineMemoBtn"') < renderRunning.indexOf('id="toggleStickyBtn"'),
  'running controls should be ordered invest, charge, memo, sticky'
);
assert.match(runningExpectationHtml, /<details class="running-evaluation" id="runningEvaluationSection"\$\{runningEvaluationOpen \? " open" : ""\}>/);
assert.match(runningExpectationHtml, /<details class="running-nail-collapse" id="runningNailSection"\$\{runningNailOpen \? " open" : ""\}>/);
assert.match(runningExpectationHtml, /<summary>期待値<\/summary>/);
assert.doesNotMatch(runningExpectationHtml, /期待値・評価/);
assert.match(runningExpectationHtml, /打ち始めの想定期待値/);
assert.match(runningExpectationHtml, /startEvDetailText\(session\.startEv\)/);
assert.match(runningExpectationHtml, /現在の実測回転率で再判定/);
assert.match(runningExpectationHtml, /回転率のサンプルが足りません/);
assert.match(runningExpectationHtml, /const currentSpin = normalizeNumber\(session\.currentSpin\);/);
assert.match(runningExpectationHtml, /previousSpin: runningPreviousSpin\(session\),/);
assert.match(runningExpectationHtml, /manualRate: liveRate/);
assert.match(runningExpectationHtml, /const availableBalls = Math\.max\(0, Number\(balances\?\.mochidama \|\| 0\)\);/);
assert.match(runningExpectationHtml, /availableBalls/);
assert.match(runningExpectationHtml, /calculateMachineExpectation\(machine, \{/);
assert.match(runningExpectationHtml, /持ち玉\$\{Math\.round\(availableBalls\)\.toLocaleString\("ja-JP"\)\}玉を使う前提/);
assert.doesNotMatch(runningExpectationHtml, /expectationInvestmentText\(expectation\.result\.mochidamaBalls, expectation\.result\.cashBalls\)/);
assert.doesNotMatch(runningExpectationHtml, /自動使用/);
assert.match(runningExpectationHtml, /const nailSummary = machine \? nailRatingSummary\(machine\) : "";/);
assert.match(runningExpectationHtml, /runningTrialRateFor\(session, liveRate\)/);
assert.match(runningExpectationHtml, /runningTrialExpectationHtml\(session, machine, trialRate, balances\)/);
assert.match(runningExpectationHtml, /<details class="running-nail-collapse" id="runningNailSection"\$\{runningNailOpen \? " open" : ""\}>/);
assert.match(runningExpectationHtml, /<summary>釘・ネカセ <small>\$\{nailSummary \? `釘: \$\{escapeHtml\(nailSummary\)\}` : "未評価"\}<\/small><\/summary>/);
assert.match(runningExpectationHtml, /nailRatingSectionHtml\(machine, \{ showHeader: false \}\)/);
assert.doesNotMatch(runningExpectationHtml, /session\.startEv\s*=/);
assert.match(runningTrialHelpers, /function clampTrialRate\(value\)/);
assert.match(runningTrialHelpers, /return Math\.min\(50, Math\.max\(1, Number\(number\.toFixed\(1\)\)\)\);/);
assert.match(runningTrialHelpers, /function runningPreviousSpin\(session\) \{/);
assert.match(runningTrialHelpers, /return Number\(session\?\.hitCount \|\| 0\) > 0 \? 0 : \(normalizeNumber\(session\?\.prevDayEndSpin\) \|\| 0\);/);
assert.match(runningTrialHelpers, /function runningTrialRateFor\(session, liveRate\)/);
assert.match(runningTrialHelpers, /if \(runningTrialSessionId !== session\.id\) \{/);
assert.match(runningTrialHelpers, /runningTrialRate = initialRunningTrialRate\(session, liveRate\);/);
assert.doesNotMatch(runningTrialHelpers, /localStorage/);
assert.match(runningTrialHelpers, /function resetRunningTrialState\(\) \{/);
assert.match(runningTrialHelpers, /runningEvaluationOpen = false;/);
assert.match(runningTrialHelpers, /runningNailOpen = false;/);
assert.match(runningTrialHelpers, /function adjustRunningTrialRate\(delta\) \{/);
assert.match(runningTrialHelpers, /updateRunningTrialCard\(session\);/);
assert.doesNotMatch(section('function adjustRunningTrialRate', 'function trialExpectationLine'), /renderRunning\(\)/);
assert.match(runningTrialHelpers, /function updateRunningTrialCard\(session\) \{/);
assert.match(runningTrialHelpers, /byId\("runningTrialRateValue"\)/);
assert.match(runningTrialHelpers, /byId\("runningTrialCurrentLine"\)/);
assert.match(runningTrialHelpers, /byId\("runningTrialStartLine"\)/);
assert.match(runningTrialHelpers, /function runningTrialExpectationHtml\(session, machine, trialRate, balances\) \{/);
assert.match(runningTrialHelpers, /data-trial-rate-delta="-1"/);
assert.match(runningTrialHelpers, /data-trial-rate-delta="-0\.5"/);
assert.match(runningTrialHelpers, /data-trial-rate-delta="0\.5"/);
assert.match(runningTrialHelpers, /data-trial-rate-delta="1"/);
assert.match(runningTrialHelpers, /currentSpin: startEv\.effectiveSpin/);
assert.match(runningTrialHelpers, /availableBalls: startEv\.availableBalls/);
assert.match(runningTrialHelpers, /previousSpin: runningPreviousSpin\(session\),/);
assert.doesNotMatch(section('const startExpectation = startEv ? calculateMachineExpectation', ') : null;'), /previousSpin/);
assert.match(runningTrialHelpers, /id="runningTrialRateValue"/);
assert.match(runningTrialHelpers, /id="runningTrialCurrentLine"/);
assert.match(runningTrialHelpers, /id="runningTrialStartLine"/);
assert.doesNotMatch(runningTrialHelpers, /`実効/);
assert.match(startEvDetailTextBlock, /function remainingSpinTextFromEffectiveSpin\(effectiveSpin, presetId = YUTIME_EXPECTATION_ENGINE\.preset\.id\) \{/);
assert.match(startEvDetailTextBlock, /const remaining = remainingSpinsFromCounterSpin\(effectiveSpin, presetId\);/);
assert.match(startEvDetailTextBlock, /remainingSpinTextFromEffectiveSpin\(normalized\.effectiveSpin, normalized\.presetId\)/);
assert.match(startEvDetailTextBlock, /function expectationInvestmentText\(mochidamaBalls, cashBalls, spinsToTenjo, rotationRate\) \{/);
assert.match(startEvDetailTextBlock, /const total = mochidama \+ cash;/);
assert.match(startEvDetailTextBlock, /const cashYen = Math\.round\(cash \/ 250 \* 1000\);/);
assert.match(startEvDetailTextBlock, /全額現金 約\$\{cashYen\.toLocaleString\("ja-JP"\)\}円/);
assert.match(startEvDetailTextBlock, /持ち玉・再プレから\$\{mochidama\.toLocaleString\("ja-JP"\)\}玉・現金約\$\{cashYen\.toLocaleString\("ja-JP"\)\}円/);
assert.match(startEvDetailTextBlock, /遊タイムまで必要 平均約\$\{total\.toLocaleString\("ja-JP"\)\}玉\$\{maxNote\}/);
assert.match(startEvDetailTextBlock, /最大\$\{Math\.ceil\(spins \* 250 \/ rate\)\.toLocaleString\("ja-JP"\)\}玉/);
assert.match(startEvDetailTextBlock, /途中当選込み/);
assert.match(startEvDetailTextBlock, /const hasInvestmentBreakdown = Boolean\(normalized\.availableBalls \|\| normalized\.mochidamaBalls \|\| normalized\.cashBalls\);/);
assert.doesNotMatch(startEvDetailTextBlock, /expectationInvestmentText\(normalized\.mochidamaBalls, normalized\.cashBalls\)/);
assert.doesNotMatch(startEvDetailTextBlock, /実効\$\{normalized\.effectiveSpin\}/);
assert.doesNotMatch(startEvDetailTextBlock, /現金\$\{Math\.round\(normalized\.cashBalls/);
assert.match(renderMachineExpectation, /残り\$\{expectation\.result\.spinsToTenjo\.toLocaleString\("ja-JP"\)\}回転/);
assert.match(renderMachineExpectation, /前日\$\{expectation\.previousSpin\}\+現在\$\{expectation\.currentSpin\}/);
assert.match(renderMachineExpectation, /const previousState = expectationPreviousSpinState\(\);/);
assert.match(renderMachineExpectation, /if \(prevInput\) prevInput\.disabled = previousDisabled;/);
assert.match(renderMachineExpectation, /autoDisabled = startTotalHits !== null && startTotalHits >= 1/);
assert.match(renderMachineExpectation, /ramClearDisabled = Boolean\(byId\("evPrevDisabled"\)\?\.checked\)/);
assert.match(renderMachineExpectation, /previousSpin: previousDisabled \? 0 : byId\("evPrevSpin"\)\?\.value,/);
assert.match(renderMachineExpectation, /expectationInvestmentText\(expectation\.result\.mochidamaBalls, expectation\.result\.cashBalls, expectation\.result\.spinsToTenjo, expectation\.result\.rotationRate\)/);
assert.doesNotMatch(renderMachineExpectation, /実効\$\{expectation\.effectiveSpin\}/);
assert.match(renderLedger, /data-edit-session="\$\{escapeHtml\(session\.id\)\}">記録の修正・削除<\/button>/);
assert.match(openRateSummary, /未入力は「記録の修正・削除」から補完できます。/);
assert.match(openSessionEditor, /openModal\("記録の修正・削除", "スキップした項目もここで修正できます。"/);
assert.doesNotMatch(html, />記録の修正<\/button>/);
assert.doesNotMatch(html, /openModal\("記録の修正",/);
assert.doesNotMatch(html, /「記録の修正」/);
assert.match(openMachineDetail, /id="evStartTotalHits"/);
assert.match(openMachineDetail, /開始時点の累計大当たり回数/);
assert.match(openMachineDetail, /id="evStartCredit"/);
assert.match(openMachineDetail, /開始時のカード残高/);
assert.match(openMachineDetail, /id="evPrevDisabled"/);
assert.match(openMachineDetail, /label for="evPrevDisabled">ラムクリア<\/label><label class="check-chip"><input id="evPrevDisabled" type="checkbox"> あり/);
assert.doesNotMatch(openMachineDetail, /<label for="evPrevDisabled">宵越し<\/label>|<input id="evPrevDisabled" type="checkbox"> ラムクリア/);
assert.doesNotMatch(openMachineDetail, /宵越し無効（当日当選済み／ラムクリア）|<label class="check-row"><input id="evPrevDisabled"/);
assert.ok(openMachineDetail.indexOf('id="evStartTotalHits"') < openMachineDetail.indexOf('id="evPrevDisabled"'));
assert.ok(openMachineDetail.indexOf('id="evPrevDisabled"') < openMachineDetail.indexOf('id="evPrevSpin"'));
assert.ok(openMachineDetail.indexOf('id="evPrevSpin"') < openMachineDetail.indexOf('id="evCurrentSpin"'));
assert.ok(openMachineDetail.indexOf('id="evCurrentSpin"') < openMachineDetail.indexOf('id="evManualRate"'));
assert.ok(openMachineDetail.indexOf('id="evManualRate"') < openMachineDetail.indexOf('id="evMochidamaBalls"'));
assert.ok(openMachineDetail.indexOf('id="evMochidamaBalls"') < openMachineDetail.indexOf('id="evSaipureiBalls"'));
assert.ok(openMachineDetail.indexOf('id="evSaipureiBalls"') < openMachineDetail.indexOf('id="evStartCredit"'));
assert.match(openMachineDetail, /openStartSession\(machine\.id, presets\);/);
assert.doesNotMatch(openMachineDetail, /openStartWizard\(machine\.id/);
assert.match(openSessionEditor, /fieldHtml\("startMochidama", "開始時の持ち玉", session\.startMochidama\)/);
assert.match(openSessionEditor, /fieldHtml\("startSaipurei", "開始時の再プレイ残り", session\.startSaipurei\)/);
assert.match(openSessionEditor, /fieldHtml\("startCredit", "開始時のカード残高", session\.startCredit\)/);
assert.doesNotMatch(openMachineDetail, /label: "持ち玉"|label: "再プレイ残り玉"|label: "カード残高（クレジット残金）"|label: "データカウンタの累計大当たり回数"/);
assert.doesNotMatch(openSessionEditor, /"開始持ち玉"|"再プレイ残り"|"カード残高（クレジット残金）"/);
const machineExpectationContext = vm.createContext({
  data: { machines: [{ id: 'm1' }] },
  __nodes: {
    machineEvTitle: { className: '', querySelector: () => ({ textContent: '' }), classList: { add() {} } },
    machineEvMetrics: { innerHTML: '' },
    machineEvDetail: { textContent: '' },
    machineEvPrevHint: { textContent: '' },
    evCurrentSpin: { value: '350' },
    evPrevSpin: { value: '100', disabled: false },
    evPrevDisabled: { checked: false },
    evManualRate: { value: '17' },
    evMochidamaBalls: { value: '2000' },
    evSaipureiBalls: { value: '500' },
    evStartTotalHits: { value: '' },
    evStartCredit: { value: '3000' }
  },
  __calls: [],
  byId(id) { return machineExpectationContext.__nodes[id] || null; },
  machineStats() { return {}; },
  calculateMachineExpectation(machine, options) {
    machineExpectationContext.__calls.push(options);
    const previous = Number(options.previousSpin || 0);
    const current = Number(options.currentSpin || 0);
    return {
      result: {
        rotationRate: Number(options.manualRate || 0),
        spinsToTenjo: Math.max(0, 950 - current - previous),
        evYen: 1000,
        hourlyYen: 100,
        slotRate: 101,
        totalHours: 1,
        mochidamaBalls: 100,
        cashBalls: 200
      },
      previousSpin: previous,
      currentSpin: current,
      rateSource: '手入力',
      payoutSource: '理論値',
      exchangeBalls: 28
    };
  },
  evJudgment() { return { label: '打てる', className: 'good' }; },
  availableBallsFromParts(mochidama, saipurei) {
    const m = machineExpectationContext.normalizeNumber(mochidama) || 0;
    const s = machineExpectationContext.normalizeNumber(saipurei) || 0;
    return { mochidama: m, saipurei: s, total: m + s };
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  expectationInvestmentText() { return '遊タイムまで必要 約300玉（持ち玉から100玉・現金で約800円）'; },
  exchangeBallsText(value) { return String(value); },
  yenText(value) { return `${value}円`; },
  percentText(value) { return `${value}%`; },
  hourText(value) { return `${value}h`; },
  escapeHtml(value) { return String(value ?? ''); }
});
new vm.Script(`
  ${renderMachineExpectation}
  renderMachineExpectation('m1');
  globalThis.firstPreviousSpin = globalThis.__calls.at(-1).previousSpin;
  globalThis.firstDisabled = globalThis.__nodes.evPrevSpin.disabled;
  globalThis.firstHint = globalThis.__nodes.machineEvPrevHint.textContent;
  globalThis.firstPresets = expectationPanelPresets();
  globalThis.__nodes.evStartTotalHits.value = '1';
  renderMachineExpectation('m1');
  globalThis.autoPreviousSpin = globalThis.__calls.at(-1).previousSpin;
  globalThis.autoDisabledState = globalThis.__nodes.evPrevSpin.disabled;
  globalThis.autoHint = globalThis.__nodes.machineEvPrevHint.textContent;
  globalThis.autoPresets = expectationPanelPresets();
  globalThis.__nodes.evPrevDisabled.checked = true;
  renderMachineExpectation('m1');
  globalThis.bothDisabledPreviousSpin = globalThis.__calls.at(-1).previousSpin;
  globalThis.bothDisabledPresets = expectationPanelPresets();
  globalThis.__nodes.evPrevDisabled.checked = false;
  globalThis.__nodes.evStartTotalHits.value = '0';
  renderMachineExpectation('m1');
  globalThis.zeroPreviousSpin = globalThis.__calls.at(-1).previousSpin;
  globalThis.zeroDisabledState = globalThis.__nodes.evPrevSpin.disabled;
  globalThis.zeroPresets = expectationPanelPresets();
  globalThis.__nodes.evPrevDisabled.checked = true;
  renderMachineExpectation('m1');
  globalThis.disabledPreviousSpin = globalThis.__calls.at(-1).previousSpin;
  globalThis.disabledInputValue = globalThis.__nodes.evPrevSpin.value;
  globalThis.disabledInputState = globalThis.__nodes.evPrevSpin.disabled;
  globalThis.disabledHint = globalThis.__nodes.machineEvPrevHint.textContent;
  globalThis.disabledPresets = expectationPanelPresets();
`).runInContext(machineExpectationContext);
assert.equal(machineExpectationContext.firstPreviousSpin, '100');
assert.equal(machineExpectationContext.firstDisabled, false);
assert.match(machineExpectationContext.firstHint, /前日ヤメ100回転を使用中/);
assert.equal(machineExpectationContext.firstPresets.prevDayEndSpin, 100);
assert.equal(machineExpectationContext.firstPresets.startTotalHits, null);
assert.equal(machineExpectationContext.firstPresets.startCredit, 3000);
assert.equal(machineExpectationContext.autoPreviousSpin, 0);
assert.equal(machineExpectationContext.autoDisabledState, true);
assert.match(machineExpectationContext.autoHint, /当日当選済みのため前日ヤメ回転数は使いません/);
assert.equal(machineExpectationContext.autoPresets.prevDayEndSpin, null);
assert.equal(machineExpectationContext.autoPresets.prevDayDisabled, true);
assert.equal(machineExpectationContext.autoPresets.startTotalHits, 1);
assert.equal(machineExpectationContext.bothDisabledPreviousSpin, 0);
assert.equal(machineExpectationContext.bothDisabledPresets.prevDayEndSpin, null);
assert.equal(machineExpectationContext.bothDisabledPresets.prevDayDisabled, true);
assert.equal(machineExpectationContext.zeroPreviousSpin, '100');
assert.equal(machineExpectationContext.zeroDisabledState, false);
assert.equal(machineExpectationContext.zeroPresets.prevDayEndSpin, 100);
assert.equal(machineExpectationContext.zeroPresets.prevDayDisabled, false);
assert.equal(machineExpectationContext.zeroPresets.startTotalHits, 0);
assert.equal(machineExpectationContext.disabledPreviousSpin, 0);
assert.equal(machineExpectationContext.disabledInputValue, '100');
assert.equal(machineExpectationContext.disabledInputState, true);
assert.match(machineExpectationContext.disabledHint, /ラムクリアありのため前日ヤメ回転数は使いません/);
assert.equal(machineExpectationContext.disabledPresets.prevDayEndSpin, null);
assert.equal(machineExpectationContext.disabledPresets.prevDayDisabled, true);
const startSessionContext = vm.createContext({
  data: { sessions: [], machines: [{ id: 'm1' }] },
  activeSessionId: null,
  carryover: null,
  localStorage: { removeItem(key) { startSessionContext.removed = key; } },
  CARRYOVER_KEY: 'carry',
  __toasts: [],
  __view: null,
  activeStore() { return { id: 'store' }; },
  activeSessionsForStore() { return []; },
  blankSession() {
    return {
      id: `s${startSessionContext.data.sessions.length + 1}`,
      date: '2026-08-22',
      storeId: null,
      machineId: null,
      startSpin: null,
      currentSpin: null,
      startTime: null,
      startMochidama: null,
      startSaipurei: null,
      startCredit: null,
      startTotalHits: null,
      prevDayEndSpin: null,
      startEv: null,
      status: 'active'
    };
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  validClosingInfo() { return { spin: 100 }; },
  calculateStartEvSnapshot(session, machine, presets) {
    return { effectiveSpin: Number(session.startSpin || 0) + Number(session.prevDayEndSpin || 0), usedRate: presets.manualRate, availableBalls: presets.availableBalls };
  },
  currentTime() { return '12:34'; },
  persistWithToast(message) { startSessionContext.__toasts.push(message); return true; },
  showView(view) { startSessionContext.__view = view; },
  machineContextLine(target) {
    const machine = target && target.machineId ? { daiNo: '101', modelName: 'テスト機' } : target;
    return machine ? `<p class="machine-context">台${machine.daiNo || '不明'} ／ ${machine.modelName || '機種未設定'}</p>` : '';
  },
  openModal() {},
  byId() { return { addEventListener() {} }; },
  closeModal() {},
  showToast() {},
  setTimeout(callback) { callback(); },
  latestCompletedSessionForStoreToday() { return null; },
  latestCompletedSessionForMachineToday() { return null; },
  activeSortKey() { return ''; },
  runWizard() {},
  storeLabels() { return []; },
  dateWithAutoLabels(date) { return date; },
  eventMemoHelp() { return ''; }
});
new vm.Script(`
  ${startSessionFlow}
  openStartSession('m1', { startSpin: 350, prevDayEndSpin: 100, manualRate: 17, availableBalls: 2500, mochidamaInput: 2000, saipureiInput: 500, startTotalHits: 0, startCredit: 3000 });
  globalThis.started = data.sessions[0];
  openStartSession('m1', { startSpin: 350, prevDayEndSpin: 100, manualRate: 17, availableBalls: 2500, mochidamaInput: 2000, saipureiInput: 500, startTotalHits: 7, startCredit: 3000 });
  globalThis.autoDisabledStarted = data.sessions[1];
  openStartSession('m1', { startSpin: 350, prevDayEndSpin: 100, prevDayDisabled: true, manualRate: 17, availableBalls: 2500, mochidamaInput: 2000, saipureiInput: 500, startTotalHits: 0, startCredit: 3000 });
  globalThis.disabledStarted = data.sessions[2];
  openStartSession('m1', { startSpin: null, prevDayEndSpin: null, manualRate: null, availableBalls: 0, mochidamaInput: null, saipureiInput: null, startTotalHits: null, startCredit: null });
  globalThis.blankStarted = data.sessions[3];
`).runInContext(startSessionContext);
assert.equal(startSessionContext.started.startSpin, 350);
assert.equal(startSessionContext.started.currentSpin, 350);
assert.equal(startSessionContext.started.prevDayEndSpin, 100);
assert.equal(startSessionContext.started.startMochidama, 2000);
assert.equal(startSessionContext.started.startSaipurei, 500);
assert.equal(startSessionContext.started.startCredit, 3000);
assert.equal(startSessionContext.started.startTotalHits, 0);
assert.equal(startSessionContext.started.startTime, '12:34');
assert.equal(startSessionContext.started.startEv.effectiveSpin, 450);
assert.equal(startSessionContext.autoDisabledStarted.prevDayEndSpin, null);
assert.equal(startSessionContext.autoDisabledStarted.startTotalHits, 7);
assert.equal(startSessionContext.autoDisabledStarted.startEv.effectiveSpin, 350);
assert.equal(startSessionContext.disabledStarted.prevDayEndSpin, null);
assert.equal(startSessionContext.disabledStarted.startEv.effectiveSpin, 350);
assert.match(startSessionContext.__toasts[1], /宵越し無効/);
assert.match(startSessionContext.__toasts[2], /宵越し無効/);
assert.match(startSessionContext.__toasts[2], /記録の修正・削除/);
assert.equal(startSessionContext.blankStarted.startSpin, null);
assert.equal(startSessionContext.blankStarted.currentSpin, null);
assert.equal(startSessionContext.blankStarted.prevDayEndSpin, null);
assert.equal(startSessionContext.blankStarted.startMochidama, null);
assert.equal(startSessionContext.blankStarted.startSaipurei, null);
assert.equal(startSessionContext.blankStarted.startCredit, null);
assert.equal(startSessionContext.blankStarted.startTotalHits, null);
const startEvDetailContext = vm.createContext({
  YUTIME_EXPECTATION_ENGINE: expectationContext.engine,
  tenjoForPresetId(presetId) {
    return presetId === 'agnes-pe' ? 239 : 950;
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  yenText(value) {
    return `${value >= 0 ? '+' : ''}${Math.round(value).toLocaleString('ja-JP')}円`;
  }
});
new vm.Script(`
  ${counterSpinHelpers}
  ${normalizeStartEvBlock}
  ${startEvDetailTextBlock}
  globalThis.startEvWithMochidama = startEvDetailText({
    evYen: 1234,
    usedRate: 17,
    rateSource: '手入力17.0使用',
    effectiveSpin: 525,
    availableBalls: 2500,
    mochidamaInput: 2000,
    saipureiInput: 500,
    mochidamaBalls: 1941,
    cashBalls: 1826
  });
  globalThis.startEvAllCash = startEvDetailText({
    evYen: -454,
    usedRate: 17,
    rateSource: '手入力17.0使用',
    effectiveSpin: 434,
    availableBalls: 0,
    mochidamaInput: 0,
    saipureiInput: 0,
    mochidamaBalls: 0,
    cashBalls: 3768
  });
`).runInContext(startEvDetailContext);
assert.match(startEvDetailContext.startEvWithMochidama, /入力 持ち玉2,000玉・再プレ500玉/);
assert.doesNotMatch(startEvDetailContext.startEvWithMochidama, /遊タイムまで必要/);
assert.match(startEvDetailContext.startEvAllCash, /入力 持ち玉0玉・再プレ0玉/);
assert.doesNotMatch(startEvDetailContext.startEvAllCash, /遊タイムまで必要/);
const runningExpectationContext = vm.createContext({
  __renderCount: 0,
  __expectationCalls: [],
  __nodes: {
    runningTrialRateValue: { textContent: '' },
    runningTrialCurrentLine: { innerHTML: '' },
    runningTrialStartLine: { innerHTML: '' }
  },
  data: {
    machines: [{ id: 'm_1', summary: 'ヘソ4・寄り3・道3・ネカセ3・スルー3・ワープ3' }]
  },
  startEvDetailText() {
    return '記録なし';
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  normalizeStartEv(value) {
    return value && value.usedRate ? value : null;
  },
  nailRatingSummary(machine) {
    return machine.summary || '';
  },
  nailRatingSectionHtml(machine, options) {
    return `<div class="nail-rating-section" data-show-header="${options?.showHeader !== false}">
      ${['heso', 'yori', 'michi', 'nekase', 'through', 'warp'].map((key) => `<div data-nail-key="${key}"></div>`).join('')}
    </div>`;
  },
  calculateMachineExpectation(machine, options) {
    runningExpectationContext.__expectationCalls.push({ currentSpin: options.currentSpin, previousSpin: options.previousSpin, manualRate: options.manualRate, availableBalls: options.availableBalls });
    const effectiveSpin = Number(options.currentSpin || 0) + Number(options.previousSpin || 0);
    return {
      result: {
        evYen: Math.round(options.manualRate * 100),
        spinsToTenjo: Math.max(0, 950 - effectiveSpin),
        rotationRate: options.manualRate,
        hourlyYen: Math.round(options.manualRate * 10),
        mochidamaBalls: 1498,
        cashBalls: 1784
      }
    };
  },
  evJudgment() {
    return { label: '打てる', className: 'good' };
  },
  yenText(value) {
    return `${value}円`;
  },
  activeSession() {
    return { id: 's_1', machineId: 'm_1', startEv: { usedRate: 18.5, effectiveSpin: 525, availableBalls: 2500 }, currentSpin: 600, prevDayEndSpin: 100, hitCount: 0 };
  },
  runningPanelRate() {
    return 17.2;
  },
  deriveBalances() {
    return { mochidama: 1200 };
  },
  byId(id) {
    return runningExpectationContext.__nodes[id] || null;
  },
  renderRunning() {
    runningExpectationContext.__renderCount += 1;
  },
  escapeHtml(value) {
    return String(value ?? '');
  },
  numberText(value, fallback = '') {
    return value === null || value === undefined ? fallback : String(value);
  }
});
new vm.Script(`
  let runningTrialSessionId = null;
  let runningTrialRate = null;
  let runningEvaluationOpen = true;
  let runningNailOpen = true;
  ${runningTrialHelpers}
  globalThis.renderedRunningExpectation = runningExpectationHtml({
    id: 's_1',
    startEv: { usedRate: 18.5, effectiveSpin: 525, availableBalls: 2500 },
    currentSpin: 600
  }, { id: 'm_1', summary: 'ヘソ4・寄り3・道3・ネカセ3・スルー3・ワープ3' }, null, { mochidama: 1200 });
  globalThis.renderedLiveExpectation = runningExpectationHtml({
    id: 's_live',
    startEv: { usedRate: 18.5, effectiveSpin: 500, availableBalls: 0 },
    currentSpin: 400,
    prevDayEndSpin: 100,
    hitCount: 0
  }, { id: 'm_1', summary: '' }, 17, { mochidama: 1200 });
  globalThis.renderedHitLiveExpectation = runningExpectationHtml({
    id: 's_hit',
    startEv: { usedRate: 18.5, effectiveSpin: 500, availableBalls: 0 },
    currentSpin: 400,
    prevDayEndSpin: 100,
    hitCount: 1
  }, { id: 'm_1', summary: '' }, 17, { mochidama: 1200 });
  globalThis.initialTrialRate = runningTrialRate;
  const callsBeforeAdjust = __expectationCalls.length;
  adjustRunningTrialRate(0.5);
  globalThis.adjustCalls = __expectationCalls.slice(callsBeforeAdjust);
  globalThis.adjustedTrialRate = runningTrialRate;
  globalThis.renderCountAfterAdjust = __renderCount;
  globalThis.updatedTrialRateText = __nodes.runningTrialRateValue.textContent;
  globalThis.updatedCurrentLine = __nodes.runningTrialCurrentLine.innerHTML;
  globalThis.updatedStartLine = __nodes.runningTrialStartLine.innerHTML;
  globalThis.afterRedrawRate = runningTrialRateFor({ id: 's_1', startEv: { usedRate: 18.5, effectiveSpin: 525, availableBalls: 2500 } }, 17.2);
  globalThis.afterSwitchRate = runningTrialRateFor({ id: 's_2', startEv: { usedRate: 16, effectiveSpin: 400, availableBalls: 0 } }, 20);
  resetRunningTrialState();
  globalThis.resetEvaluationOpen = runningEvaluationOpen;
  globalThis.resetNailOpen = runningNailOpen;
`).runInContext(runningExpectationContext);
const renderedRunningExpectation = runningExpectationContext.renderedRunningExpectation;
const renderedLiveExpectation = runningExpectationContext.renderedLiveExpectation;
const renderedHitLiveExpectation = runningExpectationContext.renderedHitLiveExpectation;
const evaluationStart = renderedRunningExpectation.indexOf('id="runningEvaluationSection"');
const evaluationEnd = renderedRunningExpectation.indexOf('</details>', evaluationStart);
const runningNailStart = renderedRunningExpectation.indexOf('id="runningNailSection"');
const runningNailEnd = renderedRunningExpectation.indexOf('</details>', runningNailStart);
const nailKeyMatches = [...renderedRunningExpectation.matchAll(/data-nail-key=/g)];
assert.equal(nailKeyMatches.length, 6);
assert.ok(runningNailStart > evaluationEnd);
assert.ok(nailKeyMatches.every((match) => match.index > runningNailStart && match.index < runningNailEnd));
assert.ok(!renderedRunningExpectation.slice(evaluationStart, evaluationEnd).includes('id="runningNailSection"'));
assert.match(renderedRunningExpectation, /<summary>期待値<\/summary>/);
assert.match(renderedRunningExpectation, /id="runningEvaluationSection" open/);
assert.match(renderedRunningExpectation, /id="runningNailSection" open/);
assert.match(renderedRunningExpectation, /<summary>釘・ネカセ <small>釘: ヘソ4・寄り3・道3・ネカセ3・スルー3・ワープ3<\/small><\/summary>/);
assert.match(renderedRunningExpectation, /18\.5 \/250玉/);
assert.match(renderedRunningExpectation, /今から打つ場合/);
assert.match(renderedRunningExpectation, /打ち始めから/);
assert.match(renderedRunningExpectation, /打ち始めから<\/strong> 1850円（残り425回転）/);
assert.doesNotMatch(renderedRunningExpectation, /実効/);
assert.doesNotMatch(renderedRunningExpectation, /data-show-header="true"/);
assert.match(renderedLiveExpectation, /<span>残り回転数<\/span><strong>450<\/strong>/);
assert.match(renderedLiveExpectation, /現在400回転 \/ 実測17\.0 \/250玉 \/ 持ち玉1,200玉を使う前提/);
assert.doesNotMatch(renderedLiveExpectation, /遊タイムまで必要/);
assert.match(renderedHitLiveExpectation, /<span>残り回転数<\/span><strong>550<\/strong>/);
assert.ok(
  runningExpectationContext.__expectationCalls.some((call) => call.currentSpin === 400 && call.previousSpin === 100 && call.manualRate === 17),
  'live re-judgment should include prevDayEndSpin before a hit'
);
assert.ok(
  runningExpectationContext.__expectationCalls.some((call) => call.currentSpin === 400 && call.previousSpin === 0 && call.manualRate === 17),
  'live re-judgment should ignore prevDayEndSpin after a hit'
);
assert.equal(runningExpectationContext.initialTrialRate, 18.5);
assert.equal(runningExpectationContext.adjustedTrialRate, 19);
assert.equal(runningExpectationContext.adjustCalls[0].previousSpin, 100);
assert.equal(runningExpectationContext.adjustCalls[1].currentSpin, 525);
assert.equal(runningExpectationContext.adjustCalls[1].previousSpin, undefined);
assert.equal(runningExpectationContext.renderCountAfterAdjust, 0);
assert.equal(runningExpectationContext.updatedTrialRateText, '19.0 /250玉');
assert.match(runningExpectationContext.updatedCurrentLine, /今から打つ場合<\/strong> 1900円（残り250回転）/);
assert.match(runningExpectationContext.updatedStartLine, /打ち始めから<\/strong> 1900円（残り425回転）/);
assert.equal(runningExpectationContext.afterRedrawRate, 19);
assert.equal(runningExpectationContext.afterSwitchRate, 16);
assert.equal(runningExpectationContext.resetEvaluationOpen, false);
assert.equal(runningExpectationContext.resetNailOpen, false);
assert.match(normalizeStartEvBlock, /mochidamaInput: Math\.max\(0, normalizeNumber\(value\.mochidamaInput\) \?\? 0\)/);
assert.match(normalizeStartEvBlock, /saipureiInput: Math\.max\(0, normalizeNumber\(value\.saipureiInput\) \?\? 0\)/);
assert.match(calculateStartEvSnapshot, /const availableParts = availableBallsFromParts\(presets\.mochidamaInput, presets\.saipureiInput\);/);
assert.match(calculateStartEvSnapshot, /availableBalls: expectation\.availableBalls/);
assert.match(calculateStartEvSnapshot, /mochidamaInput: availableParts\.mochidama/);
assert.match(calculateStartEvSnapshot, /saipureiInput: availableParts\.saipurei/);
assert.doesNotMatch(renderRunning, /id="unifiedInvestBtn"[^>]*disabled/);
assert.match(style, /\.source-chip\.selected \{\s*border-color: var\(--accent\);\s*background: var\(--accent\);\s*color: #fff;/);
assert.match(sourceUnavailableMessage, /if \(balance === null\) return `\$\{label\}が未入力です。`;/);
assert.match(sourceUnavailableMessage, /if \(balance < amount\) return `\$\{label\}がありません。値をタップして修正するか、他のソースを選んでください。`;/);
assert.match(investmentAmountForSourceBlock, /function investmentUnitForSource\(source\) \{\s*return normalizeInvestmentSource\(source\) === "cash" \? 500 : 125;/);
assert.match(investmentAmountForSourceBlock, /function investmentAmountForSource\(session, source, requestedAmount = investmentUnitForSource\(source\)\) \{/);
assert.match(investmentAmountForSourceBlock, /return balance !== null && balance > 0 && balance < requested \? balance : requested;/);
assert.match(investmentAmountForSourceBlock, /function investmentButtonText\(source, amount\) \{/);
assert.match(addInvestment, /const unavailableMessage = sourceUnavailableMessage\(session, source, amount\);\s*if \(unavailableMessage\) \{\s*showToast\(unavailableMessage, "error"\);\s*return;\s*\}\s*const item = \{ type: source, source, amount/);
assert.match(renderRunning, /const requestedAmount = investmentUnitForSource\(runningSource\);\s*addInvestment\(session, runningSource, investmentAmountForSource\(session, runningSource, requestedAmount\)\);/);
assert.match(html, /const SCHEMA_VERSION = 30;/);
assert.match(html, /jitanNormalBallsPerSpin: 0,/);
assert.match(html, /jitanFastBallsPerSpin: 0,/);
assert.match(html, /yutimeBallsPerSpin: -0\.3,/);
assert.match(html, /roundTypes: \[\{ id: "r10", label: "10R", balls: 1400 \}\]/);
assert.match(html, /id: "agnes-pe"/);
assert.match(html, /name: "PA大海物語Withアグネス・ラムPE"/);
assert.match(html, /modelType: "st-certain"/);
// B98: agnes-pe の既定値は MACHINE_PRESETS ではなく期待値エンジンのプリセットに置く
assert.match(yutimeExpectationEngine, /netBallsPerWin: 587\.5,\s+jitanNormalBallsPerSpin: -0\.8,\s+jitanFastBallsPerSpin: 0,\s+yutimeBallsPerSpin: -0\.8,/);
assert.match(yutimeExpectationEngine, /const expectedJitanFastSpins = expectedWins \* chains\.supportSpinsPerWin;/);
assert.match(yutimeExpectationEngine, /const expectedYutimeSpins = pReach \* \(1 \/ p\);/);
assert.match(yutimeExpectationEngine, /const winBalls = expectedWins \* merged\.netBallsPerWin \+ expectedJitanNormalSpins \* merged\.jitanNormalBallsPerSpin \+ expectedJitanFastSpins \* merged\.jitanFastBallsPerSpin \+ expectedYutimeSpins \* merged\.yutimeBallsPerSpin;/);
assert.match(html, /roundTypes: \[\{ id: "r10", label: "10R", balls: 1080 \}, \{ id: "r6", label: "6R", balls: 648 \}, \{ id: "r4", label: "4R", balls: 432 \}\]/);
assert.match(html, /hits: \[\],/);
assert.match(html, /function normalizeHits\(hits\)/);
assert.match(html, /function syncSessionHitTotals\(session, machines = data\.machines\)/);
assert.match(html, /function netBallsPerWinInfo\(presetId, machine = null\)/);
assert.match(html, /netBallsPerWinManual/);
assert.match(html, /純払い出し量/);
assert.match(html, /時短100（玉\/回転）/);
assert.match(html, /\$\{isStCertain \? "ST・時短" : "時短200"\}（玉\/回転）/);
assert.match(html, /遊タイム（玉\/回転）/);
assert.match(html, /仮値-0\.3（駆け抜け約100玉相当）/);
assert.match(html, /込み出玉で記録する運用ではST・時短枠は0のまま/);
assert.match(html, /止め打ち次第で0〜-0\.8程度/);
assert.match(html, /大当り開始から電サポ終了までの純増玉数（電サポ中の減りを含む）/);
assert.match(html, /yutimeEnterSpin: null,/);
assert.match(openYutimeEnterForm, /const spinPreset = session\.yutimeEnterSpin \?\? session\.currentSpin \?\? session\.startSpin;/);
assert.match(openYutimeEnterForm, /id="yutimeSpin"/);
assert.match(openYutimeEnterForm, /session\.yutimeEnterSpin = normalizeNumber\(byId\("yutimeSpin"\)\.value\);/);
assert.match(openSessionEditor, /fieldHtml\("yutimeEnterSpin", "遊タイム突入時の回転数", session\.yutimeEnterSpin\)/);
assert.match(openSessionEditor, /fieldHtml\("endTotalHits", "ヤメ時点の累計大当たり回数", session\.endTotalHits\)/);
assert.match(openSessionEditor, /"yutimeEnterBalls", "yutimeEnterSpin", "endTotalHits"/);
assert.match(openSessionEditor, /if \(Array\.isArray\(session\.hits\) && session\.hits\.length\) syncSessionHitTotals\(session\);\s*else presetHitCountFromCounters\(session\);/);
assert.match(deriveSession, /const yutimeNormalEndSpin = !hasHit && \(session\.hitVia === "yutime" \|\| session\.yutimeEnterBalls !== null\) \? yutimeEnterSpinForRate\(session, preset\) : null;/);
assert.match(deriveSession, /session\.hitVia === "yutime" \|\| session\.yutimeEnterBalls !== null \? yutimeNormalEndSpin : session\.endSpin/);
assert.match(yutimeEnterSpinForRate, /const explicitSpin = normalizeNumber\(session\.yutimeEnterSpin\);\s*if \(explicitSpin !== null\) return explicitSpin;/);
assert.match(yutimeEnterSpinForRate, /const inferred = counterTenjo - prevSpin;\s*return inferred >= 0 \? inferred : null;/);
assert.ok(design.includes('schema 23 Machine 1件サンプル'));

assert.match(openMachineDetail, /function openMachineDetail\(daiNo, machineFormExpanded = false, options = \{\}\)/);
assert.match(openMachineDetail, /\$\{machineMemoSectionHtml\(machine\)\}/);
assert.match(openMachineDetail, /bindMachineMemoAdd\(machine\);/);
assert.doesNotMatch(openMachineDetail, /id="machineMemo"|byId\("machineMemo"\)|memoDraft/);
assert.match(openMachineDetail, /\$\{nailRatingSectionHtml\(machine\)\}/);
assert.match(openMachineDetail, /\$\{machineHistoryHtml\(machine\)\}/);
assert.match(openMachineDetail, /id="toggleMachineHistoryBtn">履歴<\/button>/);
assert.match(openMachineDetail, /panel\.hidden = hidden;/);
assert.match(openMachineDetail, /bindNailRatingChips\(machine\);/);
assert.match(openMachineDetail, /if \(!options\.preserveStatsFilter\) resetMachineStatsFilterState\(\);/);
assert.match(openMachineDetail, /const baseStatsSessions = machineStatsBaseSessions\(machine\.id\);/);
assert.match(openMachineDetail, /const filteredStatsSessions = filteredMachineStatsSessions\(machine, baseStatsSessions\);/);
assert.match(openMachineDetail, /\$\{machineStatsFilterHtml\(machine, baseStatsSessions, filteredStatsSessions, \{ open: options\.statsFilterOpen \}\)\}/);
assert.match(openMachineDetail, /placeholder="\$\{baseStats\.rate \? baseStats\.rate\.toFixed\(1\) : "履歴なし"\}"/);
assert.match(openMachineDetail, /bindMachineStatsFilter\(machine, daiNo, machineFormExpanded\);/);
assert.match(openMachineDetail, /\$\{machineModelSummaryHtml\(machine\)\}\s*\$\{machineFormExpanded \? machineDetailFormHtml\(machine\) : ""\}/);
assert.doesNotMatch(html, /evAvailableBalls/);
assert.match(openMachineDetail, /id="evMochidamaBalls"/);
assert.match(openMachineDetail, /id="evSaipureiBalls"/);
assert.match(html, /availableBallsFromParts\(byId\("evMochidamaBalls"\)\?\.value, byId\("evSaipureiBalls"\)\?\.value\)\.total/);
assert.match(renderMachineExpectation, /function expectationPanelPresets\(\) \{/);
assert.match(renderMachineExpectation, /mochidamaInput: availableBalls\.mochidama/);
assert.match(renderMachineExpectation, /saipureiInput: availableBalls\.saipurei/);
assert.match(renderMachineExpectation, /startTotalHits: normalizeNumber\(byId\("evStartTotalHits"\)\?\.value\)/);
assert.match(renderMachineExpectation, /startCredit: normalizeNumber\(byId\("evStartCredit"\)\?\.value\)/);
assert.doesNotMatch(html, /充当/);
assert.doesNotMatch(html, /現金見込み/);
assert.doesNotMatch(renderMachineExpectation, /現金分\$\{/);
assert.match(openMachineDetail, /\$\{machineFormExpanded \? '<button id="saveMachineBtn">[^']+<\/button>' : ""\}/);
assert.match(openMachineDetail, /if \(machineFormExpanded\) readMachineDetailForm\(machine\);\s*else readMachineMemoForm\(machine\);/);
assert.match(openMachineDetail, /openMachineDetail\(daiNo, true, \{ preserveStatsFilter: true \}\)/);
assert.match(machineStatsFilters, /dateMode: "all"/);
assert.match(machineStatsFilters, /labels: new Set\(\)/);
assert.match(machineStatsFilters, /heso: new Set\(\)/);
assert.match(machineStatsFilters, /filter\.labels\.size > 0/);
assert.match(machineStatsFilters, /filter\.heso\.size > 0/);
assert.match(machineStatsFilters, /dailyHesoRating\(machine\.id, session\.date\)/);
assert.match(machineStatsFilters, /該当\$\{filteredSessions\.length\}セッション/);
assert.match(machineStatsFilters, /id="clearMachineStatsFilterBtn"/);
assert.doesNotMatch(machineStatsFilters, /localStorage/);
assert.match(bindMachineStatsFilterBlock, /machineStatsFilterState\.dateMode = input\.value \|\| "all";/);
assert.match(bindMachineStatsFilterBlock, /machineStatsFilterState\.labels\.add\(input\.value\)/);
assert.match(bindMachineStatsFilterBlock, /machineStatsFilterState\.heso\.add\(input\.value\)/);
assert.match(bindMachineStatsFilterBlock, /resetMachineStatsFilterState\(\);/);
const machineStatsFilterContext = {};
vm.runInNewContext(`
  let data = {
    activeStoreId: 'st1',
    labelsByStore: { st1: ['強め', '通常'] },
    dailyState: {
      m1: {
        '2026-08-22': { date: '2026-08-22', hesoRating: 4 },
        '2026-08-21': { date: '2026-08-21', hesoRating: 5 }
      }
    }
  };
  function today() { return '2026-08-22'; }
  function offsetDate(dateValue, days) {
    const parts = String(dateValue).split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() + days);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  function normalizeRatingValue(value) {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 5 ? number : null;
  }
  function dailyStateFor(machineId, dateValue) {
    return data.dailyState?.[machineId]?.[dateValue] || null;
  }
  function dailyHesoRating(machineId, dateValue) {
    return normalizeRatingValue(dailyStateFor(machineId, dateValue)?.hesoRating);
  }
  function storeLabels(storeId = data.activeStoreId) {
    return data.labelsByStore[storeId] || [];
  }
  function automaticLabelsForDate(dateValue) {
    const parts = String(dateValue || '').match(/^(\\d{4})-(\\d{2})-(\\d{2})$/);
    if (!parts) return [];
    const year = Number(parts[1]);
    const month = Number(parts[2]);
    const day = Number(parts[3]);
    const date = new Date(year, month - 1, day);
    const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
    const labels = [weekdays[date.getDay()], \`\${day % 10}のつく日\`];
    if (day === 11 || day === 22) labels.push('ゾロ目日');
    return labels;
  }
  function dateWithAutoLabels(value) { return value; }
  function escapeHtml(value) { return String(value); }
  function filteredSessions() { return sessions; }
  ${machineStatsFilters}
  const machine = { id: 'm1', storeId: 'st1' };
  const sessions = [
    { id: 's1', machineId: 'm1', storeId: 'st1', status: 'completed', date: '2026-08-22', labels: ['強め'] },
    { id: 's2', machineId: 'm1', storeId: 'st1', status: 'completed', date: '2026-08-21', labels: ['通常'] },
    { id: 's3', machineId: 'm1', storeId: 'st1', status: 'completed', date: '2026-08-15', labels: ['強め'] }
  ];
  function ids(filter) {
    const merged = { dateMode: 'all', weekday: '', date: '', labels: new Set(), heso: new Set(), ...filter };
    return filteredMachineStatsSessions(machine, sessions, merged).map((session) => session.id).join(',');
  }
  result = {
    all: ids({}),
    recent7: ids({ dateMode: 'recent7' }),
    weekdaySaturday: ids({ dateMode: 'weekday', weekday: '6' }),
    specificDate: ids({ dateMode: 'date', date: '2026-08-15' }),
    eventOr: ids({ labels: new Set(['強め', '通常']) }),
    autoEvent: ids({ labels: new Set(['ゾロ目日']) }),
    heso4: ids({ heso: new Set(['4']) }),
    heso45: ids({ heso: new Set(['4', '5']) }),
    comboAnd: ids({ dateMode: 'recent30', labels: new Set(['強め']), heso: new Set(['4']) }),
    zero: ids({ labels: new Set(['ゾロ目日']), heso: new Set(['5']) }),
    options: machineStatsFilterOptions(machine, sessions)
  };
`, machineStatsFilterContext);
assert.equal(machineStatsFilterContext.result.all, 's1,s2,s3');
assert.equal(machineStatsFilterContext.result.recent7, 's1,s2');
assert.equal(machineStatsFilterContext.result.weekdaySaturday, 's1,s3');
assert.equal(machineStatsFilterContext.result.specificDate, 's3');
assert.equal(machineStatsFilterContext.result.eventOr, 's1,s2,s3');
assert.equal(machineStatsFilterContext.result.autoEvent, 's1');
assert.equal(machineStatsFilterContext.result.heso4, 's1');
assert.equal(machineStatsFilterContext.result.heso45, 's1,s2');
assert.equal(machineStatsFilterContext.result.comboAnd, 's1');
assert.equal(machineStatsFilterContext.result.zero, '');
assert.equal(machineStatsFilterContext.result.options.dates.join(','), '2026-08-22,2026-08-21,2026-08-15');
assert.ok(machineStatsFilterContext.result.options.labels.includes('ゾロ目日'));
assert.match(html, /\.baseline-chip \{\s*min-width: 0;\s*min-height: 42px;[\s\S]*?\}/);
assert.doesNotMatch(html, /\.baseline-chip \{[^}]*white-space: nowrap;/);
assert.match(html, /@media \(max-width: 420px\) \{\s*\.baseline-chip-grid \{ grid-template-columns: minmax\(0, 1fr\); \}\s*\}/);
assert.match(html, /\.label-checks \{[\s\S]*?min-width: 0;[\s\S]*?\}/);
assert.match(html, /\.check-chip \{[\s\S]*?max-width: 100%;[\s\S]*?min-width: 0;[\s\S]*?white-space: normal;[\s\S]*?\}/);
assert.match(html, /\.check-chip input \{\s*flex: 0 0 auto;/);
assert.match(html, /\.machine-stats-selects \{\s*display: grid;\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
assert.match(html, /\.machine-stats-selects select \{\s*min-width: 0;\s*\}/);
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
assert.match(html, /\.expectation-inputs \{\s*display: grid;\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);\s*gap: 8px;\s*margin-bottom: 10px;\s*\}/);
assert.match(html, /\.expectation-inputs \.field-row \{\s*grid-template-columns: minmax\(0, 1fr\);\s*gap: 4px;\s*\}/);
assert.match(html, /#evPrevSpin:disabled \{\s*text-decoration: line-through;\s*\}/);
assert.match(html, /input:disabled, textarea:disabled, select:disabled \{\s*background: #eef2f6;\s*color: var\(--muted\);/);
assert.match(html, /\.ev-ramclear-row \.check-chip \{\s*width: 100%;\s*min-width: 0;/);
assert.match(html, /\.nail-rating-chips \{\s*display: grid;\s*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);\s*gap: 6px;\s*\}/);
assert.match(html, /\.nail-rating-chips button \{\s*min-height: 38px;/);
assert.match(html, /\.running-panel\.fullscreen \{[\s\S]*?height: 100dvh;[\s\S]*?overflow: hidden;[\s\S]*?\}/);
assert.match(html, /\.running-panel\.fullscreen \.running-sticky \{[\s\S]*?flex: 1 1 auto;[\s\S]*?min-height: 0;[\s\S]*?overflow-y: auto;[\s\S]*?-webkit-overflow-scrolling: touch;[\s\S]*?overscroll-behavior: contain;[\s\S]*?\}/);
assert.match(html, /\.running-panel\.fullscreen \.running-bottom-controls \{[\s\S]*?flex: 0 0 auto;[\s\S]*?\}/);
assert.match(html, /\.running-nail-collapse \{[\s\S]*?margin-top: 10px;[\s\S]*?border-top: 1px solid var\(--line\);[\s\S]*?padding-top: 8px;[\s\S]*?\}/);
assert.match(html, /\.running-nail-collapse summary \{[\s\S]*?cursor: pointer;[\s\S]*?font-weight: 700;[\s\S]*?min-height: 34px;[\s\S]*?\}/);
assert.doesNotMatch(html, /\.modal \{[^}]*overflow-x: hidden;/);
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
assert.ok(design.includes('B53 持ち玉・再プレイを考慮した期待値円換算'));
assert.ok(design.includes('schema は 25 とする'));
assert.ok(design.includes('schema 25 `startEv` サンプル'));
assert.ok(design.includes('B54 稼働中パネルの期待値・評価セクション'));
assert.ok(design.includes('容量予算の増分はなし'));
assert.ok(design.includes('B90 ヤメ入力の累計獲得出玉と判定根拠の内訳'));
// B94: 実機と照合するための表示
assert.ok(design.includes('B94 実機と照合するための表示'));
assert.ok(design.includes('入力・判断する場所では、いまどの台の・どの状態を扱っているかを、その場で実機と照合できるようにする'));
assert.ok(design.includes('B95 通常消費玉のツール追跡持ち玉差分化'));
assert.ok(design.includes('schema は 30 とする'));
assert.ok(design.includes('B95では schema 29 から 30'));
assert.ok(html.includes('function machineContextLine(target)'));
assert.ok(html.includes('function runningStateBadge(session)'));
assert.ok(html.includes('当り後（時短消化中）'));
assert.ok(html.includes('id="machineEvContext"'));
assert.equal(html.split('${machineContextLine(session)}').length - 1, 9);
assert.equal((html.match(/（実機：/g) || []).length, 13);
assert.ok(!html.includes('遊タイム中の投資として記録されます'));
// B91: 残保留込みモデル
assert.ok(design.includes('B91 残保留込みの引き戻し計算'));
assert.ok(design.includes('schema は 29 とする'));
assert.ok(html.includes('holdSpins: 5'));
assert.ok(html.includes('function presetHoldSpins(presetId)'));
assert.ok(html.includes('function stCertainValues(activePreset, holdSpins = 0)'));
assert.ok(html.includes('row.share * rebound(pLow, row.spins + hold)'));
assert.ok(html.includes('const r100 = rebound(p, spec.jitanNormal + hold);'));
assert.ok(html.includes('const r350 = rebound(p, spec.yutimeJitan + hold);'));
assert.ok(html.includes('id="quickHoldSpins"'));
assert.ok(html.includes('時短が終わったあと玉代ゼロで回る保留の数。通常4〜5。0で考慮しない。'));
// B90: 判定根拠の内訳行と、実測出玉の採用順位
assert.ok(html.includes('function expectationBasisText(result)'));
assert.ok(html.includes('＝ 期待値÷投資額+100%'));
assert.ok(html.includes('＋当選'));
assert.ok(html.includes('回転/h想定'));
assert.ok(html.includes('spinsPerHour: merged.spinsPerHour'));
assert.ok(html.includes('id="machineEvBasis"'));
assert.ok(html.includes('function sessionActualBallsTotal(session)'));
assert.ok(html.includes('const actualPayoutTotal = sessionActualBallsTotal(session);'));
assert.ok(html.includes('if (derived.actualPayoutTotal !== null && derived.actualPayoutTotal !== undefined) return'));
assert.ok(html.includes('key: "sessionActualBalls", label: "累計獲得出玉"'));
assert.ok(html.includes('sessionActualBalls: normalizeNumber(session.sessionActualBalls),'));
assert.ok(design.includes('schema は 28 とする'));
assert.match(machineButtonHtml, /const hasMachineMemo = \(machine\?\.memoEntries \|\| \[\]\)\.length > 0;/);
assert.match(bindNailRatingChips, /function bindNailRatingChips\(machine, root = els\.modalBody\)/);
assert.match(bindNailRatingChips, /root\.querySelectorAll\("\[data-nail-rating\]"\)/);
assert.match(bindNailRatingChips, /row\.dataset\.nailKey === DAILY_NAIL_RATING_KEY/);
assert.match(bindNailRatingChips, /state\.hesoRating = rating;/);
assert.match(bindNailRatingChips, /machine\.nailRating = readNailRatingFromDom\(root\);/);
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
  const SCHEMA_VERSION = 30;
  const DEFAULT_HOURLY_THRESHOLD_YEN = 2400;
  const DEFAULT_LEND_RATE = 4;
  const DEFAULT_EXCHANGE_BALLS = 25;
  const DEFAULT_NET_BALLS_PER_WIN = 1400;
  const RAM_CLEAR_VALUE = "cleared";
  const RAM_NOT_CLEARED_VALUE = "not_cleared";
  const RAM_UNKNOWN_VALUE = "unknown";
  const MACHINE_PRESETS = [
    { id: "umi-sp5", name: "P大海物語5スペシャル", evSupported: true, defaults: { netBallsPerWin: 1400, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.3 } },
    { id: "agnes-pe", name: "PA大海物語Withアグネス・ラムPE", evSupported: true, defaults: { netBallsPerWin: 587.5, jitanNormalBallsPerSpin: -0.8, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8 } }
  ];
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
  function normalizeStartEv() { return null; }
  function normalizeConsumedBallsSource(value) { return value === "tray" || value === "taps" ? value : null; }
  function normalizeHits(hits) { return Array.isArray(hits) ? hits : []; }
  function syncSessionHitTotals() {}
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
      consumedBallsSource: null,
      hitTrackedBalls: null,
      sessionActualBalls: null,
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
  globalThis.normalizedLegacySession = normalizeData({ version: 26, presetSettings: { "umi-sp5": {} }, sessions: [{ id: "s_old", storeId: "st_1", machineId: "m_1", consumedBallsSource: "legacy" }] });
  globalThis.normalizedB95Session = normalizeData({ version: 29, presetSettings: { "umi-sp5": {} }, sessions: [{ id: "s_b95_old", storeId: "st_1", machineId: "m_1" }] });
  globalThis.normalizedB95NewSession = normalizeData({ version: 30, presetSettings: { "umi-sp5": {} }, sessions: [{ id: "s_b95_new", storeId: "st_1", machineId: "m_1", hitTrackedBalls: "5900" }] });
  globalThis.normalizedB90LegacySession = normalizeData({ version: 27, presetSettings: { "umi-sp5": {} }, sessions: [{ id: "s_b90_old", storeId: "st_1", machineId: "m_1", hits: [] }] });
  globalThis.normalizedB90NewSession = normalizeData({ version: 28, presetSettings: { "umi-sp5": {} }, sessions: [{ id: "s_b90_new", storeId: "st_1", machineId: "m_1", sessionActualBalls: "2800", hits: [] }] });
  globalThis.normalizedCurrentBlank = normalizeData({ version: 26, presetSettings: { "umi-sp5": {} } });
  globalThis.normalizedAgnesMissingYutime = normalizeData({ version: 26, presetSettings: { "umi-sp5": {}, "agnes-pe": { jitanFastBallsPerSpin: -0.4 } } });
`).runInContext(legacyMachineContext);
assert.equal(legacyMachineContext.normalizedLegacy.machines.length, 1);
assert.equal(legacyMachineContext.normalizedLegacy.machines[0].daiNo, "101");
assert.equal(Object.prototype.hasOwnProperty.call(legacyMachineContext.normalizedLegacy.machines[0], 'memo'), false);
assert.equal(JSON.stringify(legacyMachineContext.normalizedLegacy.machines[0].memoEntries), JSON.stringify([{ id: 'memo_legacy', date: '2026-08-06', text: 'old memo', createdAt: '2026-08-06T12:00:00.000Z' }]));
assert.equal(JSON.stringify(legacyMachineContext.normalizedLegacy.machines[0].nailRating), JSON.stringify({ yori: 3, michi: 2, nekase: 1, through: 4, warp: 2 }));
assert.equal(legacyMachineContext.normalizedLegacy.presetSettings['umi-sp5'].yutimeBallsPerSpin, 0);
assert.equal(legacyMachineContext.normalizedLegacySession.sessions[0].consumedBallsSource, null);
assert.equal(legacyMachineContext.normalizedB95Session.sessions[0].hitTrackedBalls, null);
assert.equal(legacyMachineContext.normalizedB95NewSession.sessions[0].hitTrackedBalls, 5900);
// B90: sessionActualBalls を持たない旧データは null 補完される
assert.equal(legacyMachineContext.normalizedB90LegacySession.sessions[0].sessionActualBalls, null);
assert.equal(Object.prototype.hasOwnProperty.call(legacyMachineContext.normalizedB90LegacySession.sessions[0], 'sessionActualBalls'), true);
assert.equal(legacyMachineContext.normalizedB90NewSession.sessions[0].sessionActualBalls, 2800);
assert.equal(legacyMachineContext.normalizedCurrentBlank.presetSettings['umi-sp5'].yutimeBallsPerSpin, -0.3);
assert.equal(Object.prototype.hasOwnProperty.call(legacyMachineContext.normalizedCurrentBlank.presetSettings, 'agnes-pe'), false);
assert.equal(legacyMachineContext.normalizedAgnesMissingYutime.presetSettings['agnes-pe'].jitanFastBallsPerSpin, -0.4);
assert.equal(legacyMachineContext.normalizedAgnesMissingYutime.presetSettings['agnes-pe'].yutimeBallsPerSpin, -0.8);
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

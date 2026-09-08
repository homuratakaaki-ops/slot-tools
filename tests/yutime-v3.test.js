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
const roundBreakdownBlock = section('function roundBreakdown', 'function hitRoundSummaryHtml');
const hitRoundSummaryHtml = section('function hitRoundSummaryHtml', 'function openHitResetPrompt');
const sessionActualBallsTotalBlock = section('function cumulativeActualBallsBefore', 'function hitCounterSpinForRecord') + section('function sessionActualBallsTotal', 'function actualBallsFromCumulativeInput');
const hitHistoryBlock = section('function segmentHistoryLabels', 'function openEndWizard');
const hitResetPrompt = section('function openHitResetPrompt', 'function openEndWizard');
const openEndWizardBlock = section('function openEndWizard', 'function presetHitCountFromCounters');
const runEndWizardBlock = section('function runEndWizard', 'function runWizard');
const updateMochidamaBalance = section('function updateMochidamaBalanceWithUndo', 'function investmentTotals');
// S15: 開始持ち玉（startMochidama）と稼働中の持ち玉（currentMochidama）の分離
const s15BalanceBlock = section('function mochidamaBaseValue', 'function usesPersonalBalanceFormula');
const s15RepairBlock = section('function repairStartMochidama', 'function persist');
const transferSummary = section('function transferSummaryForSession', 'function balanceForSource');
const resultBlock = section('function longDateText', 'function transferSummaryForSession');
const balanceStartValueForCurrent = section('function balanceStartValueForCurrent', 'function currentBalanceForStartKey');
const currentBalanceForStartKey = section('function currentBalanceForStartKey', 'function updateMochidamaBalanceWithUndo');
const renderRunning = section('function renderRunning', 'function renderLedger');
const renderLedger = section('function renderLedger', 'function renderStorageNote');
const openYutimeEnterForm = section('function openYutimeEnterForm', 'function openRateSummary');
const openSessionEditor = section('function openSessionEditor', 'function fieldHtml');
const deriveSession = section('function deriveSession', 'function yutimeEnterSpinForRate');
const yutimeEnterSpinForRate = section('function yutimeEnterSpinForRate', 'function machineStats');
const addInvestment = section('function addInvestment', 'function deleteInvestment');
const deleteInvestmentBlock = section('function deleteInvestment', 'function addCharge');
const investmentAmountForSourceBlock = section('function investmentUnitForSource', 'function sourceUnavailableMessage');
const sourceUnavailableMessage = section('function sourceUnavailableMessage', 'function rateText');
const runningRateHelpers = section('function liveRunningRate', 'function runningYutimeRemaining');
const runningPanelRate = section('function runningPanelRate', 'function runningYutimeRemaining');
const runningExpectationHtml = section('function runningExpectationHtml', 'function runningPanelInputBalls');
const runningTrialHelpers = section('function clampTrialRate', 'function runningPanelInputBalls');
const runningPanelInputBallsBlock = section('function runningPanelInputBalls', 'function runningSpinCount');
const runningSpinCount = section('function runningSpinCount', 'function investmentSnapshot');
const investmentSnapshot = section('function investmentSnapshot', 'function historyEntries');
const calculateStartEvSnapshot = section('function calculateStartEvSnapshot', 'function remainingSpinTextFromEffectiveSpin');
const startSessionFlow = section('function openStartWizard', 'function openHitWizard');
const startEvDetailTextBlock = section('function remainingSpinTextFromEffectiveSpin', 'function showToast');
const counterSpinHelpers = section('function counterOffsetForPresetId', 'function presetNetBallsPerWin');
const tenjoAndCounterHelpers = section('function tenjoForPresetId', 'function presetNetBallsPerWin');
const investmentTotalsBlock = section('function investmentTotals', 'function transferSummaryForSession');
const personalFormulaBlock = section('function usesPersonalBalanceFormula', 'function profitYenForSession');
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
const segmentBlock = section('function blankSegment', 'function deriveSession');
const segmentMigrationBackup = section('function needsSegmentMigration', 'function preserveCorruptData');
const normalizeDailyStateBlock = section('function normalizeDailyState', 'function migrateStoreAssumedRatesToMaps');
const bindNailRatingChips = section('function bindNailRatingChips', 'function readNailRatingFromDom');
const readMachineMemoForm = section('function readMachineMemoForm', 'function readMachineDetailForm');
const islandEditor = section('function islandEditorHtml', 'function bindIslandEditor');
const bindIslandEditor = section('function bindIslandEditor', 'function openIslandNameForm');
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
// S7: 消費玉の算出方式（consumedModel）と区間の起点の由来（startBallsSource）の正規化
const consumedModelBlock = section('function normalizeConsumedModel', 'function investmentSource');
// S7b/B-2: 残保留当選の自動判定と手動指定
const holdCarryBlock = section('function detectHoldCarryHit', 'function segmentPlayedSpins');
const consumedBallsChoiceHtmlBlock = section('function consumedBallsChoiceHtml', 'function setConsumedBallsSource');
const consumedBallsSourceEditorHtmlBlock = section('function consumedBallsSourceEditorHtml', 'function fieldHtml');
const jitanExitBlock = section('function jitanExitOptions', 'function hitRoundSummaryHtml');
const segmentHoldEditor = section('function segmentHoldSpinsEditorHtml', 'function consumedBallsSourceEditorHtml');
const selectedYutimePresetIdsBlock = section('function selectedYutimePresetIds', 'function islandDisplayName');
const baselineChipsBlock = section('function baselineBallText', 'function renderLabelFilters');
const renderLabelFiltersBlock = section('function renderLabelFilters', 'function renderCarryoverBanner');

assert.doesNotMatch(hitWizard, /runWizard\(/);
assert.match(hitWizard, /openModal\("当選ウィザード"/);
assert.match(hitWizard, /label for="hitWizardSpin">当選回転数/);
assert.match(hitWizard, /label for="hitWizardRemainBalls">残り持ち玉/);
assert.match(hitWizard, /今ある持ち玉を入力してください（再プレイ分は含めない）/);
assert.match(hitWizard, /非パーソナル店では空欄のままで構いません/);
assert.match(hitWizard, /session\.hitSpin = normalizeNumber\(byId\("hitWizardSpin"\)\?\.value\);/);
assert.match(hitWizard, /session\.hitRemainBalls = normalizeNumber\(byId\("hitWizardRemainBalls"\)\?\.value\);/);
assert.match(hitWizard, /session\.hitTrackedBalls = mochidamaPreset;/);
assert.match(hitWizard, /closeSegmentOnHit\(session\);/);
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
  __closedOnHit: 0,
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
  closeSegmentOnHit() {
    hitWizardContext.__closedOnHit += 1;
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
assert.equal(hitWizardContext.__closedOnHit, 2);
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
  },
  closeTrailingSegmentOnEnd(session) {
    endWizardContext.__closedTrailingSession = session;
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
  const sessionWithHits = { id: 's_hit', storeId: 'store', currentSpin: 777, hitSpin: 420, hitCount: null, totalRounds: null, sessionActualBalls: 2800, hits: [{ roundTypeId: 'r10' }] };
  runEndWizard(sessionWithHits, true);
  globalThis.withHitsHtml = globalThis.__modalHtml;
  globalThis.__nodes.end_endTotalBalls = { value: '1200' };
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
// S8/§1-3: 実機がセッション累計を表示しないので、ヤメ入力に累計獲得出玉は置かない
assert.doesNotMatch(endWizardContext.withHitsHtml, /end_sessionActualBalls|累計獲得出玉/);
assert.doesNotMatch(endWizardContext.noHitHtml, /end_sessionActualBalls|累計獲得出玉/);
assert.doesNotMatch(endWizardContext.presetActualHtml, /end_sessionActualBalls|累計獲得出玉/);
// 保存済みの sessionActualBalls は旧データのフォールバックとして残す（ヤメ入力で上書きも消去もしない）
assert.equal(endWizardContext.savedHitSession.sessionActualBalls, 2800);
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
// S4/C-1,C-2,C-3: 画面名は「大当たり登録」。当選カウンターは編集不可の表示にする
assert.match(hitResetPrompt, /openModal\("大当たり登録"/);
assert.doesNotMatch(hitResetPrompt, /id="hitRecordSpin"/);
assert.match(hitResetPrompt, /当選カウンター <strong>\$\{numberText\(hitCounterSpin, "-"\)\}<\/strong>/);
// S8/§1-4: 累計の範囲は連チャン。カウンターは時短が終わると0に戻ることを文言で伝える
assert.match(hitResetPrompt, /<label for="hitRecordActualBalls">この連チャンの累計出玉<\/label>/);
assert.match(hitResetPrompt, /id="hitRecordActualBalls"/);
assert.match(hitResetPrompt, /placeholder="この連チャンの累計出玉（実機：データカウンター）任意"/);
assert.match(hitResetPrompt, /いま表示されている、この連チャンの累計出玉を入力してください。時短が終わると0に戻ります。前回の入力との差が、今回の当たりの出玉になります。/);
assert.match(hitResetPrompt, /hitRoundSummaryHtml\(session, presetId\)/);
assert.match(hitResetPrompt, /class="hit-round-layout"/);
assert.match(hitResetPrompt, /appendHitRecord\(session, button\.dataset\.hitRound\);/);
assert.ok(hitResetPrompt.includes('data-close'), 'reset chip close button should remain unchanged');
assert.match(hitResetPrompt, /id="hitMochidamaValue"/);
assert.doesNotMatch(hitResetPrompt, /id="saveHitMochidamaBtn"/);
assert.doesNotMatch(hitResetPrompt, /持ち玉を更新<\/button>/);
assert.match(hitResetPrompt, /hitMochidamaInput\.addEventListener\("change", \(\) => \{\s*if \(!saveHitMochidamaInput\(session\)\) return;/);
assert.match(hitResetPrompt, /id="openHitHistoryBtn"/);
assert.match(hitResetPrompt, /closeModal\(\);\s*applyJitanExit\(session, Number\(button\.dataset\.hitReset\), startBalls, shooting\);/);
assert.match(hitResetPrompt, /data-hit-reset="\$\{option\.counterSpin\}"/);
assert.match(hitResetPrompt, /時短\$\{option\.jitanSpins\} → カウンター\$\{option\.counterSpin\}/);
assert.match(hitResetPrompt, /id="jitanExitSpin"/);
assert.match(hitResetPrompt, /id="applyJitanExitBtn"/);
assert.doesNotMatch(hitResetPrompt, /saveHitMochidamaInput\(session, \{ silentEmpty: true \}\)/);
assert.match(hitResetPrompt, /if \(!raw\) return false;/);
assert.match(hitRoundSummaryHtml, /const hits = normalizeHits\(session\?\.hits\);/);
assert.match(roundBreakdownBlock, /const roundTypes = presetById\(presetId\)\?\.roundTypes \|\| \[\];/);
assert.match(roundBreakdownBlock, /const count = counts\.get\(type\.id\) \|\| 0;/);
assert.match(roundBreakdownBlock, /if \(!count\) return "";/);
assert.match(roundBreakdownBlock, /roundCountFromRoundType\(type\)/);
// S4/C-4: 連チャンは最新の当選と同じ区間に紐づく当たり群
assert.match(roundBreakdownBlock, /const chainSegmentId = resolveHitSegmentId\(session, hits\[hits\.length - 1\]\);/);
assert.match(hitRoundSummaryHtml, /class="hit-round-result"/);
// S4/C-5: R数ベース出玉を出さず、実測の 1R当たり玉数だけを見せる
assert.doesNotMatch(hitRoundSummaryHtml, /R数ベース出玉/);
assert.doesNotMatch(hitRoundSummaryHtml, /hitRoundBasedPayout/);
assert.match(hitRoundSummaryHtml, /const ballsPerRound = sessionBallsPerRound\(session, presetId\);/);
// 当選ごとの実測合計は cumulativeActualBallsBeforeHit の1本だけ（同じ計算を2つ持たない）
assert.match(hitRoundSummaryHtml, /const actualPayout = cumulativeActualBallsBeforeHit\(session\);/);
assert.doesNotMatch(html, /actualHitBallsTotal/);
// 分子は戦果報告の「獲得出玉」と同じ sessionActualBallsTotal に一本化する
assert.match(hitRoundSummaryHtml, /const actualPayout = sessionActualBallsTotal\(session\);/);
// 分母はリザルトの1R平均と同じ totalRoundsForPreset に一本化する
assert.match(hitRoundSummaryHtml, /const totalRounds = totalRoundsForPreset\(session, presetId\);/);
assert.doesNotMatch(hitRoundSummaryHtml, /function sessionBallsPerRound[\s\S]*?roundBreakdown\(/);
assert.match(hitRoundSummaryHtml, /return actualPayout !== null && actualPayout > 0 && totalRounds > 0 \? actualPayout \/ totalRounds : null;/);
assert.match(hitRoundSummaryHtml, /1R当たり \$\{ballsPerRoundText\(ballsPerRound\)\}/);
// S4/C-4: 今回の連チャンとこのセッションを分ける
assert.match(hitRoundSummaryHtml, /breakdownLine\("今回の連チャン", chainBreakdown\)/);
assert.match(hitRoundSummaryHtml, /breakdownLine\("このセッション", sessionBreakdown, "今回"\)/);
// S4/C-7: 開始時の累計大当たりは出さない
assert.doesNotMatch(hitRoundSummaryHtml, /累計大当たり/);
assert.doesNotMatch(hitRoundSummaryHtml, /startTotalHits/);
assert.match(hitResetPrompt, /function cumulativeActualBallsBeforeHit\(session\)/);
assert.match(hitResetPrompt, /function actualBallsFromCumulativeInput\(session, cumulativeInput, index = Infinity\)/);
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
  // 区間の解決はここでは検証対象外。記録済みの segmentId をそのまま返す
  resolveHitSegmentId(session, hit) {
    return hit?.segmentId ?? null;
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
  ${roundBreakdownBlock}
  ${sessionActualBallsTotalBlock}
  ${hitRoundSummaryHtml}
  globalThis.singleSummary = hitRoundSummaryHtml({
    startTotalHits: 3,
    hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }, { roundTypeId: 'r10' }]
  }, 'single');
  globalThis.multiSummary = hitRoundSummaryHtml({
    startTotalHits: 3,
    hits: [{ roundTypeId: 'r4' }, { roundTypeId: 'r4' }, { roundTypeId: 'r6' }, { roundTypeId: 'r10' }]
  }, 'multi');
  globalThis.chainSummary = hitRoundSummaryHtml({
    hits: [
      { roundTypeId: 'r4', segmentId: 'seg1' },
      { roundTypeId: 'r4', segmentId: 'seg1' },
      { roundTypeId: 'r6', segmentId: 'seg2' },
      { roundTypeId: 'r10', segmentId: 'seg2' },
      { roundTypeId: 'r10', segmentId: 'seg2' }
    ]
  }, 'multi');
  globalThis.actualSummary = hitRoundSummaryHtml({
    startTotalHits: 0,
    hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r10', actualBalls: 1420 }]
  }, 'single');
`).runInContext(hitRoundSummaryContext);
// S4/C-4: 引いていないR種別は出さない。連チャンとセッションを分ける
assert.match(hitRoundSummaryContext.singleSummary, /今回の連チャン 10R×3（3回・30R）/);
assert.match(hitRoundSummaryContext.singleSummary, /このセッション 10R×3（今回3回・30R）/);
assert.match(hitRoundSummaryContext.singleSummary, /今回の当選 10R ／ 合計 30R/);
assert.match(hitRoundSummaryContext.multiSummary, /このセッション 4R×2 ／ 6R×1 ／ 10R×1（今回4回・24R）/);
assert.doesNotMatch(hitRoundSummaryContext.singleSummary, /4R×/);
assert.doesNotMatch(hitRoundSummaryContext.singleSummary, /6R×/);
assert.match(hitRoundSummaryContext.chainSummary, /今回の連チャン 6R×1 ／ 10R×2（3回・26R）/);
assert.match(hitRoundSummaryContext.chainSummary, /このセッション 4R×2 ／ 6R×1 ／ 10R×2（今回5回・34R）/);
// S4/C-5: 実測が無ければ理論値で代用せず「—」
assert.match(hitRoundSummaryContext.singleSummary, /1R当たり —/);
assert.match(hitRoundSummaryContext.singleSummary, /実測獲得出玉 今回 —/);
assert.doesNotMatch(hitRoundSummaryContext.singleSummary, /R数ベース出玉/);
assert.match(hitRoundSummaryContext.actualSummary, /1R当たり 140玉/);
assert.match(hitRoundSummaryContext.actualSummary, /実測獲得出玉 今回 1,420玉／累計 2,800玉/);
// S4/C-7: 開始時の累計大当たりは出さない
assert.doesNotMatch(hitRoundSummaryContext.singleSummary, /累計大当たり/);
assert.doesNotMatch(hitRoundSummaryContext.singleSummary, /開始時/);
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
  ensureSessionSegments(session) {
    if (!Array.isArray(session.segments) || !session.segments.length) session.segments = [{ id: 'seg1' }];
    return session.segments;
  },
  sessionSegments(session) {
    return Array.isArray(session.segments) ? session.segments : [];
  },
  openSegmentOf() {
    return null;
  },
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
  ${holdCarryBlock}
  ${hitResetPrompt}
  globalThis.session = { hits: [], hitSpin: 75, segments: [{ id: 'seg1' }] };
  globalThis.add = (value) => {
    __inputs.hitRecordActualBalls = value;
    appendHitRecord(session, 'r10');
    return session.hits.at(-1).actualBalls;
  };
  // 時短抜け＝新しい通常時区間。以降の当選は次の連チャンに紐づく
  globalThis.exitJitan = (id) => {
    session.segments.push({ id });
  };
`).runInContext(appendHitRecordContext);
assert.equal(appendHitRecordContext.add('1380'), 1380);
// S4/C-2: 当選カウンターは当選ウィザードの記録値。S4/B-1: 当選は区間に紐づける
assert.equal(appendHitRecordContext.session.hits.at(-1).hitSpin, 75);
assert.equal(appendHitRecordContext.session.hits.at(-1).segmentId, 'seg1');
assert.equal(appendHitRecordContext.add('2800'), 1420);
assert.equal(appendHitRecordContext.add('4000'), 1200);
assert.equal(appendHitRecordContext.session.hits.reduce((sum, hit) => sum + (hit.actualBalls || 0), 0), 4000);
// 同じ連チャン内で下回る入力は従来どおり警告・今回分0
assert.equal(appendHitRecordContext.add('1000'), 0);
assert.equal(appendHitRecordContext.session.hits.reduce((sum, hit) => sum + (hit.actualBalls || 0), 0), 4000);
assert.deepEqual(appendHitRecordContext.__toasts.at(-1), {
  message: '入力値が前回までの累計を下回っています。カウンターの累計を入力してください',
  type: 'error'
});

// S8/§2: 連チャンが変われば累計は0から積み直す。前の連チャンの合計とは比べない
const chainInputContext = vm.createContext({
  __inputs: {},
  __toasts: [],
  normalizeNumber: appendHitRecordContext.normalizeNumber,
  byId(id) {
    return { value: chainInputContext.__inputs[id] };
  },
  nowIso() {
    return '2026-09-04T00:00:00.000Z';
  },
  syncSessionHitTotals() {},
  ensureSessionSegments(session) {
    return session.segments;
  },
  sessionSegments(session) {
    return session.segments;
  },
  openSegmentOf(session) {
    return session.segments[session.segments.length - 1];
  },
  persistWithToast() {
    return true;
  },
  showToast(message, type = 'success') {
    chainInputContext.__toasts.push({ message, type });
  }
});
new vm.Script(`
  ${normalizeHitsBlock}
  ${holdCarryBlock}
  ${hitResetPrompt}
  globalThis.session = { hits: [], hitSpin: 75, segments: [{ id: 'chain1' }] };
  globalThis.add = (value, roundTypeId) => {
    __inputs.hitRecordActualBalls = value;
    appendHitRecord(session, roundTypeId);
    return session.hits.at(-1).actualBalls;
  };
`).runInContext(chainInputContext);
// 連チャン①: 4R → 1,380／6R → 2,800
assert.equal(chainInputContext.add('1380', 'r4'), 1380);
assert.equal(chainInputContext.add('2800', 'r6'), 1420);
// 時短抜け → 通常時 → 連チャン②: 4R → 1,380（カウンターは0に戻っている）
chainInputContext.session.segments.push({ id: 'chain2' });
assert.equal(chainInputContext.add('1380', 'r4'), 1380);
assert.equal(chainInputContext.session.hits.at(-1).segmentId, 'chain2');
// 連チャンが変わったので下回り扱いにしない
assert.deepEqual(chainInputContext.__toasts, []);
assert.equal(chainInputContext.add('2600', 'r4'), 1220);
assert.deepEqual(chainInputContext.__toasts, []);
// セッション合計 5,400玉／合計18R → 1R当たり300玉
assert.equal(chainInputContext.session.hits.reduce((sum, hit) => sum + (hit.actualBalls || 0), 0), 5400);
assert.deepEqual(JSON.parse(JSON.stringify(chainInputContext.session.hits.map((hit) => hit.actualBalls))), [1380, 1420, 1380, 1220]);
// S15: 稼働中の持ち玉修正は currentMochidama だけを動かす。startMochidama（打ち始めの持ち玉）は書き換えない
assert.match(updateMochidamaBalance, /session\.currentMochidama = balanceStartValueForCurrent\(session, "startMochidama", value\);/);
assert.match(updateMochidamaBalance, /undo: \(\) => \{\s*session\.currentMochidama = previous;/);
assert.doesNotMatch(updateMochidamaBalance, /session\.startMochidama =/);
// S15: 打ち始め・引き継ぎ・同じ台で続行の3経路とも、開始値と現在値を同じ値で初期化する
assert.match(startSessionFlow, /session\.startMochidama = normalizeNumber\(presets\.mochidamaInput\);[\s\S]{0,160}?session\.currentMochidama = session\.startMochidama;/);
assert.match(startSessionFlow, /session\.startMochidama = activeCarryover\.mochidama;\s*session\.currentMochidama = activeCarryover\.mochidama;/);
assert.match(startSessionFlow, /if \(session\.currentSpin === null \|\| session\.currentSpin === undefined\) session\.currentSpin = session\.startSpin;[\s\S]{0,160}?session\.currentMochidama = session\.startMochidama;/);
assert.match(html, /next\.startMochidama = finalMochidamaForCarryover\(sourceSession\);[\s\S]{0,160}?next\.currentMochidama = next\.startMochidama;/);
// S15: 台移動の持ち越し玉は「元の台の終了合計玉＋残保留」。持ち玉修正では動かない値から決める
assert.match(html, /function finalMochidamaForCarryover\(session\) \{\s*if \(session\.endTotalBalls === null \|\| session\.endTotalBalls === undefined\) return null;\s*return Number\(session\.endTotalBalls \|\| 0\) \+ Number\(session\.zanhoryuBalls \|\| 0\);/);
// S15: 収支・投入玉の土台は開始持ち玉のまま。現在値へ差し替えない
assert.match(personalFormulaBlock, /Number\(session\.startMochidama \|\| 0\) \+ Number\(totals\.saipureiBalls \|\| 0\)/);
assert.doesNotMatch(personalFormulaBlock, /currentMochidama/);
// S15: 稼働中の持ち玉の起点は currentMochidama。deriveBalances だけが持つ
assert.match(s15BalanceBlock, /mochidama: mochidamaBaseValue\(session\) === null \? null : Number\(mochidamaBaseValue\(session\) \|\| 0\) - mochidamaTotal,/);
assert.equal((html.match(/function mochidamaBaseValue\(session\)/g) || []).length, 1);

const s15Context = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function investmentSource(item) { return item?.source || item?.type || "cash"; }
  function nowIso() { return "2026-09-08T00:00:00.000Z"; }
  function persist() { return true; }
  function renderAll() {}
  globalThis.__toasts = [];
  function showToast(message, kind, options) { globalThis.__toasts.push({ message, kind, options }); }
  ${consumedModelBlock}
  ${s15BalanceBlock}
  globalThis.session = {
    id: "s_325",
    startMochidama: 0,
    currentMochidama: 0,
    startSaipurei: null,
    startCredit: null,
    investments: [{ source: "mochidama", amount: 500 }],
    charges: []
  };
  globalThis.beforeEdit = deriveBalances(globalThis.session).mochidama;
  updateMochidamaBalanceWithUndo(globalThis.session, 12884);
  globalThis.afterEdit = deriveBalances(globalThis.session).mochidama;
  globalThis.undoFn = globalThis.__toasts.at(-1).options.undo;
  globalThis.legacySession = { id: "s_legacy", startMochidama: 3000, investments: [{ source: "mochidama", amount: 200 }], charges: [] };
  globalThis.legacyBalance = deriveBalances(globalThis.legacySession).mochidama;
  globalThis.emptySession = { id: "s_empty", startMochidama: null, investments: [], charges: [] };
  globalThis.emptyBalance = deriveBalances(globalThis.emptySession).mochidama;
  globalThis.shifted = [
    shiftedCurrentMochidama(1000, 8000, 1500),
    shiftedCurrentMochidama(1000, 8000, 1000),
    shiftedCurrentMochidama(null, null, 1500),
    shiftedCurrentMochidama(1000, 8000, null)
  ];
  globalThis.writeKeys = [balanceCurrentKey("startMochidama"), balanceCurrentKey("startSaipurei"), balanceCurrentKey("startCredit")];
`).runInContext(s15Context);
// 稼働中の修正は現在値だけを動かし、開始持ち玉は不変
assert.equal(s15Context.beforeEdit, -500);
assert.equal(s15Context.afterEdit, 12884);
assert.equal(s15Context.session.startMochidama, 0);
assert.equal(s15Context.session.currentMochidama, 13384);
// 取り消しで現在値だけが戻る
s15Context.undoFn();
assert.equal(s15Context.session.currentMochidama, 0);
assert.equal(s15Context.session.startMochidama, 0);
// currentMochidama を持たない旧セッションは startMochidama へフォールバックする
assert.equal(s15Context.legacyBalance, 2800);
assert.equal(s15Context.emptyBalance, null);
// 開始持ち玉の訂正は現在値を同じ差分だけ動かす（稼働中に積んだ +7,000 の補正は残る）
assert.equal(JSON.stringify(s15Context.shifted), JSON.stringify([8500, 8000, 1500, null]));
assert.equal(JSON.stringify(s15Context.writeKeys), JSON.stringify(["currentMochidama", "startSaipurei", "startCredit"]));

// S15/§2: 移行の復元根拠。区間の startTrackedBalls は persist のたびに startMochidama から作り直されるので使わない
const s15RepairContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  ${s15RepairBlock}
  const sourceSessions = [
    { id: "s_325", endTotalBalls: 12000, zanhoryuBalls: 84 },
    { id: "s_noend", endTotalBalls: null }
  ];
  globalThis.repaired = [
    // 判定パネルの入力を正とする（実データ17件のケース）
    repairStartMochidama({ startMochidama: 12884, currentMochidama: 12884, carriedFromSessionId: null, startEv: { mochidamaInput: 0 } }, sourceSessions),
    // 引き継ぎ元があるなら「終了合計玉＋残保留」で再計算する（判定パネルより優先）
    repairStartMochidama({ startMochidama: 3882, currentMochidama: 3882, carriedFromSessionId: "s_325", startEv: { mochidamaInput: 500 } }, sourceSessions),
    // 引き継ぎ元の終了合計玉が無いなら判定パネルへ落ちる
    repairStartMochidama({ startMochidama: 900, currentMochidama: 900, carriedFromSessionId: "s_noend", startEv: { mochidamaInput: 700 } }, sourceSessions),
    // 手がかりが無ければ現行値を維持する
    repairStartMochidama({ startMochidama: 4200, currentMochidama: 4200, carriedFromSessionId: null, startEv: null }, sourceSessions)
  ];
`).runInContext(s15RepairContext);
assert.equal(JSON.stringify(s15RepairContext.repaired.map((session) => session.startMochidama)), JSON.stringify([0, 12084, 700, 4200]));
// 修復前の値は現在の持ち玉として残す（移行前に見えていた持ち玉を捨てない）
assert.equal(JSON.stringify(s15RepairContext.repaired.map((session) => session.currentMochidama)), JSON.stringify([12884, 3882, 900, 4200]));
// 移行は schema 33 未満のデータにだけ掛ける
assert.match(normalizeData, /if \(sourceVersion < 33\) repairStartMochidama\(normalized, source\.sessions \|\| \[\]\);/);
assert.match(normalizeData, /currentMochidama: normalizeNumber\(session\.currentMochidama\) \?\? normalizeNumber\(session\.startMochidama\),/);
// 移行前のスナップショットは persist で上書きされない専用キーへ1度だけ退避する
assert.match(segmentMigrationBackup, /function backupBeforeStartMochidamaRepair\(raw\) \{\s*if \(!raw \|\| localStorage\.getItem\(S15_BACKUP_KEY\)\) return;/);
assert.match(html, /const S15_BACKUP_KEY = STORAGE_PREFIX \+ "backup:s15";/);
assert.match(balanceStartValueForCurrent, /if \(key === "startMochidama"\) return value \+ totals\.mochidamaBalls;/);
assert.match(balanceStartValueForCurrent, /if \(key === "startSaipurei"\) return value \+ totals\.saipureiBalls;/);
assert.match(balanceStartValueForCurrent, /return value - chargeTotal \+ totals\.cashYen;/);
assert.match(currentBalanceForStartKey, /if \(key === "startMochidama"\) return balances\.mochidama;/);
assert.match(currentBalanceForStartKey, /if \(key === "startSaipurei"\) return balances\.saipurei;/);
assert.match(currentBalanceForStartKey, /if \(key === "startCredit"\) return balances\.credit;/);
assert.match(transferSummary, /investYen: totals\.cashYen,/);
assert.match(transferSummary, /recoverYen: normalizeNumber\(session\.settlementRecoverYen\) \?\? 0,/);
// S12/A-1: 貯玉引出はパーソナル判定を握り直さず、実収支と同じ playerInvestedBalls を通す
assert.match(transferSummary, /withdrawBalls: playerInvestedBalls\(session, totals, store\),/);
assert.doesNotMatch(transferSummary, /withdrawBalls: Number\(session\.startMochidama \|\| 0\) \+ Number\(totals\.saipureiBalls \|\| 0\),/);
// 判定条件の出所は1本。B84の条件がS4で貯玉引出から落ちた事故を繰り返さないための固定
assert.match(personalFormulaBlock, /function usesPersonalBalanceFormula\(store\) \{\s*return Boolean\(store\?\.isPersonal\);\s*\}/);
assert.match(personalFormulaBlock, /function playerInvestedBalls\(session, totals = investmentTotals\(session\), store = storeById\(session\?\.storeId\)\) \{/);
assert.match(personalFormulaBlock, /\? Number\(session\.startMochidama \|\| 0\) \+ Number\(totals\.saipureiBalls \|\| 0\)\s*: Number\(totals\.mochidamaBalls \|\| 0\) \+ Number\(totals\.saipureiBalls \|\| 0\);/);
// S12-2: 店種別の分岐も、パーソナル式そのものも、ファイル全体で1箇所だけ
assert.equal((html.match(/Boolean\(store\?\.isPersonal\)/g) || []).length, 1);
assert.equal((html.match(/\? Number\(session\.startMochidama \|\| 0\) \+ Number\(totals\.saipureiBalls \|\| 0\)/g) || []).length, 1);
// S12-2: タップ投資モードは収支の分岐条件から外した。回転率・消費玉の判定としては残す
assert.doesNotMatch(personalFormulaBlock, /usesTapInvestmentMode/);
assert.doesNotMatch(investmentTotalsBlock, /usesTapInvestmentMode/);
assert.match(investmentTotalsBlock, /const investedPlayerBalls = playerInvestedBalls\(session, totals, store\);/);
assert.match(transferSummary, /depositBalls: finalMochidamaForCarryover\(session\) \?\? 0/);
assert.match(transferSummary, /const summaryPresetId = startEv\?\.presetId \|\| normalizeMachinePresetId\(machine\);/);
assert.match(transferSummary, /startExpectedSpins = startEv \? remainingSpinsFromCounterSpin\(startEv\.effectiveSpin, summaryPresetId\) : null;/);
assert.match(transferSummary, /remainingSpins = endEffectiveSpin !== null \? remainingSpinsFromCounterSpin\(endEffectiveSpin, summaryPresetId\) : null;/);
assert.match(transferSummary, /const consumedBalls = derived\.consumedBalls !== null && derived\.consumedBalls !== undefined \? Math\.round\(derived\.consumedBalls\) : null;/);
assert.match(transferSummary, /const playedSpins = startSpin !== null && endSpin !== null && endSpin >= startSpin \? endSpin - startSpin : null;/);
// S4/C-5: 1R平均の分子は実測の獲得出玉だけ。推計値（derived.hitBalls）では代用しない
assert.match(transferSummary, /const totalHitBalls = sessionActualBallsTotal\(session\);/);
assert.doesNotMatch(transferSummary, /derived\.hitBalls/);
assert.match(transferSummary, /const totalRounds = totalRoundsForSession\(session, machine\);/);
assert.match(transferSummary, /const averageRoundBalls = totalHitBalls !== null && totalRounds > 0 \? totalHitBalls \/ totalRounds : null;/);
assert.match(transferSummary, /function transferYenText\(value\) \{\s*return `\$\{Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\("ja-JP"\)\}円`;/);
assert.match(transferSummary, /function transferBallText\(value\) \{\s*return Math\.round\(Number\(value \|\| 0\)\)\.toLocaleString\("ja-JP"\);/);
assert.match(transferSummary, /投資\$\{transferYenText\(summary\.investYen\)\}\/回収\$\{transferYenText\(summary\.recoverYen\)\}\/引出\$\{transferBallText\(summary\.withdrawBalls\)\}個\/預入\$\{transferBallText\(summary\.depositBalls\)\}個/);
assert.match(transferSummary, /開始期待値\$\{transferOptionalYenText\(summary\.startEvYen\)\}\/想定回転数\$\{transferOptionalSpinText\(summary\.startExpectedSpins\)\}\/残り回転数\$\{transferOptionalSpinText\(summary\.remainingSpins\)\}/);
assert.match(transferSummary, /<span>開始期待値<\/span><strong>\$\{transferOptionalYenText\(summary\.startEvYen\)\}<\/strong>/);
assert.match(transferSummary, /<span>1R平均<\/span><strong>\$\{transferOptionalRoundAverageText\(summary\.averageRoundBalls\)\}<\/strong>/);
assert.match(transferSummary, /navigator\.clipboard\?\.writeText/);
assert.doesNotMatch(renderLedger, /session\.status === "completed" \? transferSummaryHtml\(session\) : ""/);
assert.doesNotMatch(renderLedger, /data-copy-transfer/);
assert.match(resultBlock, /transferSummaryHtml\(session\)/);
assert.match(resultBlock, /copyTransferSummary\(button\.dataset\.copyTransfer\)/);
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
assert.match(yutimeExpectationEngine, /const winBalls = expectedWins \* netBallsPerWinTotal \+ expectedJitanNormalSpins \* merged\.jitanNormalBallsPerSpin \+ expectedJitanFastSpins \* merged\.jitanFastBallsPerSpin \+ expectedYutimeSpins \* merged\.yutimeBallsPerSpin;/);
assert.match(yutimeExpectationEngine, /const evBalls = winBalls - investBalls;/);
assert.match(yutimeExpectationEngine, /function normalInvestmentSplit\(prob, spinsToTenjo, ballsPerSpin, availableBalls\)/);
assert.match(yutimeExpectationEngine, /const split = normalInvestmentSplit\(p, spinsToTenjo, 250 \/ rate, input\.availableBalls\);/);
assert.match(yutimeExpectationEngine, /const cashSpentYen = split\.cashBalls \/ 250 \* 1000;/);
assert.match(yutimeExpectationEngine, /const normalCostYen = mochidamaCostYen \+ cashSpentYen;/);
assert.match(yutimeExpectationEngine, /const winBallsYen = winBalls \* merged\.yenPerBall;/);
assert.match(yutimeExpectationEngine, /const evYen = winBallsYen - normalCostYen;/);
const expectationContext = vm.createContext({
  DEFAULT_NET_BALLS_PER_ROUND: 140,
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
  DEFAULT_NET_BALLS_PER_ROUND: 140,
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
assert.equal(machinePresetContext.presets.find((preset) => preset.id === 'agnes-pe').defaults.netBallsPerWin, 100, 'S18: agnes-pe の既定値は記事v5と同じ実戦基準の100玉/R。エンジン側の値で解決されること');
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function presetById(id) { return presets.find((preset) => preset.id === id) || null; }
  ${jitanExitBlock}
  globalThis.agnesJitanExitOptions = jitanExitOptions('agnes-pe');
  globalThis.umiJitanExitOptions = jitanExitOptions('umi-sp5');
`).runInContext(machinePresetContext);
assert.equal(JSON.stringify(machinePresetContext.agnesJitanExitOptions), JSON.stringify([
  { jitanSpins: 15, counterSpin: 25 },
  { jitanSpins: 40, counterSpin: 50 },
  { jitanSpins: 90, counterSpin: 100 }
]));
assert.equal(JSON.stringify(machinePresetContext.umiJitanExitOptions), JSON.stringify([
  { jitanSpins: 100, counterSpin: 100 },
  { jitanSpins: 200, counterSpin: 200 }
]));
assert.doesNotMatch(jitanExitBlock, /counterSpin:\s*\d/);
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
  { ...expectationContext.engine.presets['agnes-pe'].defaults, presetId: 'agnes-pe', netBallsPerWin: 100, yenPerBall: 4 }
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
const zeroSupportSettings = { yenPerBall: 4, netBallsPerWin: 140, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0, holdSpins: 0 };
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
  { yenPerBall: 4, netBallsPerWin: 140, jitanNormalBallsPerSpin: -0.2, jitanFastBallsPerSpin: -0.5, yutimeBallsPerSpin: 0, holdSpins: 0 }
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
  { yenPerBall: 4, netBallsPerWin: 140, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, holdSpins: 0 }
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
      { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108 * payoutFactor, jitanFastBallsPerSpin: -0.8, holdSpins }
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
  const analytic = expectationContext.engine.calculate({ currentSpin, rotationRate: 18 }, { yenPerBall: 4, netBallsPerWin: 140, jitanNormalBallsPerSpin: -0.2, jitanFastBallsPerSpin: -0.5, yutimeBallsPerSpin: -1.0, holdSpins });
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
  { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8, holdSpins: 0 }
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
  { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8, holdSpins: 5 }
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
  { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0 , holdSpins: 0 }
);
assert.ok(Math.abs(agnesNoSupportLoss.winBalls - agnesNoSupportLoss.expectedWins * 587.5) < 0.000001, 'agnes zero support rates should not apply support loss');
for (const currentSpin of [0, 189]) {
  const base = expectationContext.engine.calculate(
    { presetId: 'agnes-pe', currentSpin, rotationRate: 17 },
    { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0 , holdSpins: 0 }
  );
  const yutimeOnly = expectationContext.engine.calculate(
    { presetId: 'agnes-pe', currentSpin, rotationRate: 17 },
    { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8 , holdSpins: 0 }
  );
  const fastOnly = expectationContext.engine.calculate(
    { presetId: 'agnes-pe', currentSpin, rotationRate: 17 },
    { presetId: 'agnes-pe', yenPerBall: 4, netBallsPerWin: 108, jitanFastBallsPerSpin: -0.8, yutimeBallsPerSpin: 0 , holdSpins: 0 }
  );
  assert.ok(Math.abs((yutimeOnly.evYen - base.evYen) - base.expectedYutimeSpins * -0.8 * 4) < 0.000001, `agnes yutime-only loss currentSpin=${currentSpin}`);
  assert.ok(Math.abs((fastOnly.evYen - base.evYen) - base.expectedJitanFastSpins * -0.8 * 4) < 0.000001, `agnes fast-only loss currentSpin=${currentSpin}`);
}
assert.ok(Math.abs((agnesNoSupportLoss.evYen - agnesAnalytic.evYen) - agnesAnalytic.expectedYutimeSpins * 0.8 * 4) < 0.000001, 'agnes default yutime loss should only apply before-hit yutime spins');
const agnesArticleRev2 = expectationContext.engine.calculate(
  { presetId: 'agnes-pe', currentSpin: 150, rotationRate: 17 },
  // S11: 記事rev2の580玉は当選あたりの値。エンジンは玉/R を受けるので平均R数で割って渡す
  { presetId: 'agnes-pe', yenPerBall: 100 / 28.01, netBallsPerWin: 580 * 108 / 587.5, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8 , holdSpins: 0 }
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
  DEFAULT_NET_BALLS_PER_ROUND: 140,
  MACHINE_PRESETS: [{ id: 'umi-sp5', defaults: { netBallsPerWin: 140, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.3 }, roundTypes: [{ id: 'r4', label: '4R', balls: 560 }, { id: 'r10', label: '10R', balls: 1400 }] }],
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
  ${roundCountFromRoundTypeBlock}
  ${presetSettingsHelpers}
  globalThis.info = (settings, sessions) => {
    data.presetSettings = { 'umi-sp5': settings };
    data.sessions = sessions;
    return netBallsPerWinInfo('umi-sp5', data.machines[0]);
  };
`).runInContext(payoutPriorityContext);
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWin: 1500, netBallsPerWinManual: true }, [{ machineId: 'm1', hits: [{ roundTypeId: 'r10', actualBalls: 1380 }] }])), JSON.stringify({ value: 1500, source: '手入力', count: null }));
// S10/§1-1: 実測平均は 獲得出玉の合計 ÷ 合計R数（1,980玉 ÷ 14R）。当選件数では割らない
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r4', actualBalls: 600 }] }])), JSON.stringify({ value: 1980 / 14, source: '実測平均', count: 14, countUnit: 'rounds' }));
// S11: ラウンド集計も玉/R（10R1,400玉→140、4R560玉→140）
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] }])), JSON.stringify({ value: 140, source: 'ラウンド集計', count: 2 }));
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [])), JSON.stringify({ value: 140, source: '理論値', count: 0 }));
// B90: 当選ごとの記録が無い旧データは「ヤメ入力の累計 ÷ そのセッションの合計R数」（2,400玉 ÷ 14R）
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', sessionActualBalls: 2400, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] }])), JSON.stringify({ value: 2400 / 14, source: '実測平均', count: 14, countUnit: 'rounds' }));
// 累計値のあるセッションと、当選ごとだけのセッションが混在しても合算平均になる（3,400玉 ÷ 24R）
assert.equal(JSON.stringify(payoutPriorityContext.info({ netBallsPerWinManual: false }, [
  { machineId: 'm1', sessionActualBalls: 2400, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] },
  { machineId: 'm1', hits: [{ roundTypeId: 'r10', actualBalls: 1000 }] }
])), JSON.stringify({ value: 3400 / 24, source: '実測平均', count: 24, countUnit: 'rounds' }));
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
    const perHit = transferContext.cumulativeActualBallsBeforeHit(session);
    if (perHit > 0) return perHit;
    const explicit = transferContext.normalizeNumber(session?.sessionActualBalls);
    return explicit !== null && explicit > 0 ? explicit : null;
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
new vm.Script(`${counterSpinHelpers}\n${personalFormulaBlock}\n${transferSummary}`).runInContext(transferContext);
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
// S12-2: パーソナル店は investments が空でも開始持ち玉を投資玉として引く。
// 実収支と貯玉引出は同じ playerInvestedBalls を通るので、分岐がずれない
const s12PersonalNoInvestments = {
  __tapMode: false,
  startMochidama: 26637,
  endTotalBalls: 30000,
  zanhoryuBalls: 0,
  investments: []
};
assert.equal(profitContext.profit(s12PersonalNoInvestments, 28, true), Math.round((30000 - 26637) * (100 / 28)));
// 非パーソナル店の同じ形は従来どおり投資合計（0玉）のまま
assert.equal(profitContext.profit(s12PersonalNoInvestments, 28, false), Math.round(30000 * (100 / 28)));
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
// S8/§1-2: 当選ごとの今回分の合計が本線。旧データの sessionActualBalls があっても上書きされない（1,980玉 ÷ 14R）
const b90SessionTotal = { ...transferFixture, id: 's_b90_total', sessionActualBalls: 2800 };
transferContext.__session = b90SessionTotal;
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /1R平均141\.4玉\/R/
);
// 当選ごとが未入力の旧データは、ヤメの累計をフォールバックとして使う
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
// S12/A-1: 非パーソナル店では開始持ち玉（2,500）ではなくタップ投資合計（1,000）を引出に出す
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /^投資1,500円\/回収0円\/引出1,000個/
);
// S12/A-2 検算: 非パーソナル店・125玉×19回＝2,375個。開始持ち玉4,625個はこの店では使わない
transferContext.__session = {
  id: 's_s12_non_personal_check',
  machineId: 'm_transfer',
  __tapMode: true,
  startSpin: 0,
  endSpin: 10,
  startMochidama: 4625,
  hitCount: 0,
  hits: [],
  startEv: null,
  settlementRecoverYen: null,
  endTotalBalls: 3000,
  zanhoryuBalls: 0,
  __profitYen: 0,
  __consumedBalls: 2375,
  investments: Array.from({ length: 19 }, () => ({ source: 'mochidama', amount: 125 }))
};
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /^投資0円\/回収0円\/引出2,375個/
);
// S12/A-2 検算: パーソナル店は従来どおり 開始持ち玉2,500 ＋ 再プレイ500 ＝ 3,000個
transferContext.__store = { isPersonal: true };
transferContext.__session = {
  id: 's_s12_personal_check',
  machineId: 'm_transfer',
  __tapMode: true,
  startSpin: 0,
  endSpin: 10,
  startMochidama: 2500,
  hitCount: 0,
  hits: [],
  startEv: null,
  settlementRecoverYen: null,
  endTotalBalls: 3000,
  zanhoryuBalls: 0,
  __profitYen: 0,
  __consumedBalls: 0,
  investments: [{ source: 'saipurei', amount: 500 }]
};
assert.match(
  vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
  /^投資0円\/回収0円\/引出3,000個/
);
// S12-2 検算: パーソナル店（DSG高岡）に実在する investments 空のセッション。
// タップ投資導入前の記録方式で、タップ投資モードを条件に混ぜると引出0個へ落ちていた
for (const startMochidama of [26637, 11462]) {
  transferContext.__session = {
    id: 's_s12b_personal_no_investments_' + startMochidama,
    machineId: 'm_transfer',
    __tapMode: false,
    startSpin: 0,
    endSpin: 10,
    startMochidama,
    hitCount: 0,
    hits: [],
    startEv: null,
    settlementRecoverYen: null,
    endTotalBalls: 3000,
    zanhoryuBalls: 0,
    __profitYen: 0,
    __consumedBalls: 0,
    investments: []
  };
  assert.match(
    vm.runInContext('transferSummaryText(transferSummaryForSession(__session))', transferContext),
    new RegExp('^投資0円/回収0円/引出' + startMochidama.toLocaleString('en-US') + '個')
  );
}
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
// S15: 残高修正の書き込み先は balanceCurrentKey が決める。持ち玉だけ currentMochidama へ逃がす
assert.match(openBalanceEditForm, /session\[balanceCurrentKey\(key\)\] = value === null \? null : balanceStartValueForCurrent\(session, key, value\);/);
assert.match(runningRateHelpers, /function normalRateInvestments\(session\) \{/);
assert.match(runningRateHelpers, /return investments\.filter\(\(item\) => investmentBeforeHit\(item, session, hitSpin\)\);/);
assert.match(runningRateHelpers, /function runningNormalSpinCount\(session, derived = null\) \{/);
// S4/A-1: 当選時点で止まる旧実装（hitSpin - startSpin）に戻さない
assert.doesNotMatch(runningRateHelpers, /const spins = hitSpin - start;/);
assert.doesNotMatch(runningRateHelpers, /if \(normalizeHits\(session\?\.hits\)\.length\) return null;/);
assert.match(runningRateHelpers, /const spins = runningSessionDerived\(session, derived\)\.normalSpins;/);
assert.match(runningSpinCount, /return runningNormalSpinCount\(session, derived\);/);
assert.match(runningPanelRate, /const inputBalls = runningNormalInputBalls\(session, stats\);/);
assert.match(runningPanelRate, /const spins = runningNormalSpinCount\(session, stats\);/);
assert.match(runningPanelRate, /return inputBalls > 0 && spins !== null && spins >= 0 \? spins \/ inputBalls \* 250 : null;/);
assert.match(runningPanelInputBallsBlock, /function runningNormalInputBalls\(session, derived = null\) \{/);
assert.match(runningPanelInputBallsBlock, /const segmentBalls = runningSessionDerived\(session, derived\)\.consumedBalls;/);
assert.match(runningPanelInputBallsBlock, /const investedBalls = normalRateInvestments\(session\)\.reduce/);
assert.match(runningPanelInputBallsBlock, /tapModeNormalConsumedBalls\(session, investedBalls, hasHit, store\)/);
assert.match(runningPanelInputBallsBlock, /return inputBalls > 0 \? Math\.round\(inputBalls\) : null;/);
assert.match(deriveSession, /const multiNormal = normalSegments\.length > 1;/);
assert.match(deriveSession, /const normalInvestedBalls = \(multiNormal[\s\S]*?normalRateInvestments\(session\)[\s\S]*?\)\.reduce/);
assert.match(deriveSession, /const tapConsumedCandidates = tapMode \? tapModeNormalConsumedCandidates\(session, normalInputBalls, hasHit, store\) : null;/);
assert.match(tapModeConsumedBlock, /function segmentConsumedBalls\(segment, context\)[\s\S]*?tapModeNormalConsumedBalls\(session, inputBalls, hasHit, store, candidates\)/);
assert.match(tapModeConsumedBlock, /function segmentTapConsumedBalls\(segment, session, store\)/);
assert.match(tapModeConsumedBlock, /function segmentNormalInvestments\(session, segmentId\)/);
assert.match(deriveSession, /const consumedContext = \{ session, store, tapMode, hasHit, inputBalls: normalInputBalls, candidates: tapConsumedCandidates, legacyEndBalls: normalEndBalls, multiNormal \};/);
assert.match(deriveSession, /const segmentConsumedValues = normalSegments\.map\(\(segment\) => segmentConsumedBalls\(segment, consumedContext\)\);/);
assert.match(deriveSession, /sumSegmentValues\(segmentConsumedValues\)/);
assert.match(deriveSession, /consumedBallsCandidates: tapConsumedCandidates && normalSpins !== null \? \{/);
assert.match(renderRunning, /consumedBallsChoiceHtml\(session, derived\)/);
assert.match(renderRunning, /bindConsumedBallsChoice\(els\.runningArea, session\)/);
assert.match(openRateSummary, /consumedBallsChoiceHtml\(session, derived\)/);
assert.match(openRateSummary, /bindConsumedBallsChoice\(els\.modalBody, session/);
assert.match(openYutimeEnterForm, /startYutimeSegment\(session\);/);
assert.match(html, /closeTrailingSegmentOnEnd\(session\);/);
assert.match(addInvestment, /segmentId: currentSegmentId\(session\)/);
assert.match(openSessionEditor, /\$\{segmentHoldSpinsEditorHtml\(session\)\}/);
assert.match(openSessionEditor, /Math\.min\(9, Math\.max\(0, Math\.round\(value\)\)\)/);
assert.match(segmentBlock, /if \(raw < 0\) return raw;/);
const runningRateContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function nowIso() { return "2026-08-22T00:00:00.000Z"; }
  const data = { machines: [] };
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
    const perHit = cumulativeActualBallsBeforeHit(session);
    if (perHit > 0) return perHit;
    const explicit = normalizeNumber(session?.sessionActualBalls);
    return explicit !== null && explicit > 0 ? explicit : null;
  }
  function storeById() { return {}; }
  function investmentToBalls(item) {
    return (item.source || item.type) === "cash" ? Number(item.amount || 0) / 4 : Number(item.amount || 0);
  }
  function usesTapInvestmentMode() { return true; }
  ${holdCarryBlock}
  ${consumedModelBlock}
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
  const s2TwoSegments = {
    storeId: "s",
    startSpin: 0,
    currentSpin: 145,
    startMochidama: 2500,
    hitSpin: 145,
    hitCount: 2,
    hits: [{ roundTypeId: "r10", at: "2026-09-02T10:10:00" }, { roundTypeId: "r10", at: "2026-09-02T11:10:00" }],
    hitVia: "normal",
    hitRemainBalls: 3000,
    hitTrackedBalls: 3000,
    endTotalBalls: 3000,
    zanhoryuBalls: 0,
    yutimeEnterBalls: null,
    investments: [
      { source: "mochidama", amount: 950, phase: "normal", spinAt: 10, time: "10:00", segmentId: "seg_a" },
      { source: "mochidama", amount: 1000, phase: "normal", spinAt: 100, time: "11:00", segmentId: "seg_b" }
    ],
    segments: [
      { id: "seg_a", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", startTrackedBalls: 2500, holdSpins: 0, endSource: "hit", endSpin: 75, endAt: null, endRemainBalls: 1550, endTrackedBalls: 1550 },
      { id: "seg_b", kind: "normal", source: "user", startSpin: 25, startAt: "10:20", startTrackedBalls: 2000, holdSpins: 5, endSource: "hit", endSpin: 145, endAt: null, endRemainBalls: 3000, endTrackedBalls: 3000 }
    ]
  };
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
  globalThis.s2TwoSegmentsDerived = deriveSession(s2TwoSegments);
  globalThis.s2SegmentRates = s2TwoSegments.segments.map((segment) => {
    const spins = segmentPlayedSpins(segment, s2TwoSegments, null);
    const consumed = segmentTapConsumedBalls(segment, s2TwoSegments, {});
    return { spins, consumed, rate: Number((spins / consumed * 250).toFixed(1)) };
  });
  globalThis.s2HoldZero = deriveSession({ ...s2TwoSegments, segments: s2TwoSegments.segments.map((segment) => ({ ...segment, holdSpins: 0 })) });
  // S4/A-1: 区間①20回転/200玉＝25.0 → 時短抜け50 → 現在70回転・消費375玉
  const s4SecondLap = {
    storeId: "s",
    status: "active",
    startSpin: 0,
    currentSpin: 70,
    startMochidama: 2500,
    hitSpin: 20,
    hitCount: 1,
    hits: [{ roundTypeId: "r10", at: "2026-09-03T10:10:00", segmentId: "seg_a" }],
    hitVia: "normal",
    hitRemainBalls: null,
    hitTrackedBalls: null,
    endTotalBalls: null,
    zanhoryuBalls: 0,
    yutimeEnterBalls: null,
    investments: [
      { source: "mochidama", amount: 200, phase: "normal", spinAt: 10, time: "10:00", segmentId: "seg_a" },
      { source: "mochidama", amount: 375, phase: "normal", spinAt: 60, time: "10:30", segmentId: "seg_b" }
    ],
    segments: [
      { id: "seg_a", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", startTrackedBalls: 2500, holdSpins: 0, endSource: "hit", endSpin: 20, endAt: null, endRemainBalls: null, endTrackedBalls: null },
      { id: "seg_b", kind: "normal", source: "user", startSpin: 50, startAt: "10:20", startTrackedBalls: 2300, holdSpins: 5, endSource: null, endSpin: null, endAt: null, endRemainBalls: null, endTrackedBalls: null }
    ]
  };
  globalThis.s4SecondLapSpins = runningSpinCount(s4SecondLap);
  globalThis.s4SecondLapBalls = runningNormalInputBalls(s4SecondLap);
  globalThis.s4SecondLapRate = runningPanelRate(s4SecondLap);
  globalThis.s4SecondLapDerived = deriveSession(s4SecondLap);
  globalThis.s4SecondLapSegments = s4SecondLap.segments.map((segment) => {
    const spins = segmentPlayedSpins(segment, s4SecondLap, null);
    const consumed = segmentTapConsumedBalls(segment, s4SecondLap, {});
    return { spins, consumed, rate: Number((spins / consumed * 250).toFixed(1)) };
  });
  // 回帰: 完了済みで当選のある区間が閉じていないセッションは従来どおり回転率を出さない
  globalThis.s4CompletedRate = deriveSession({ ...s4SecondLap, status: "completed", endSpin: 90 }).rate;
`).runInContext(runningRateContext);
// S4/A-1: 2周目以降も回転率が伸びる（区間②10.0 / セッション合計15.2）
assert.equal(runningRateContext.s4SecondLapSpins, 35);
assert.equal(runningRateContext.s4SecondLapBalls, 575);
assert.equal(Number(runningRateContext.s4SecondLapRate.toFixed(1)), 15.2);
assert.equal(runningRateContext.s4SecondLapDerived.normalSpins, 35);
assert.equal(runningRateContext.s4SecondLapDerived.consumedBalls, 575);
assert.equal(Number(runningRateContext.s4SecondLapDerived.rate.toFixed(1)), 15.2);
assert.deepEqual(JSON.parse(JSON.stringify(runningRateContext.s4SecondLapSegments)), [
  { spins: 20, consumed: 200, rate: 25 },
  { spins: 15, consumed: 375, rate: 10 }
]);
assert.equal(runningRateContext.s4CompletedRate, null);
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
assert.equal(JSON.stringify(runningRateContext.s2SegmentRates[0]), JSON.stringify({ spins: 75, consumed: 950, rate: 19.7 }));
assert.equal(JSON.stringify(runningRateContext.s2SegmentRates[1]), JSON.stringify({ spins: 115, consumed: 1000, rate: 28.8 }));
assert.equal(runningRateContext.s2TwoSegmentsDerived.normalSpins, 190);
assert.equal(runningRateContext.s2TwoSegmentsDerived.consumedBalls, 1950);
assert.equal(runningRateContext.s2HoldZero.normalSpins, 195);
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
assert.match(renderRunning, /const normalInputBalls = runningNormalInputBalls\(session, derived\);/);
assert.match(renderRunning, /<p class="running-normal-summary">通常時合計 \$\{totalSpins !== null && normalInputBalls !== null \? `\$\{numberText\(totalSpins, 0\)\}回転 \/ \$\{numberText\(normalInputBalls, 0\)\}玉` : "-"\}<\/p>/);
assert.match(renderRunning, /消費玉数の内訳: 持ち玉\$\{numberText\(totals\.mochidamaBalls, 0\)\}玉・再プレ\$\{numberText\(totals\.saipureiBalls, 0\)\}玉・現金\$\{numberText\(totals\.cashYen, 0\)\}円/);
assert.ok(!html.includes('総投入'));
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
assert.doesNotMatch(renderLedger, /data-edit-session="\$\{escapeHtml\(session\.id\)\}">記録の修正・削除<\/button>/);
assert.match(resultBlock, /id="resultEditBtn">記録の修正<\/button>/);
assert.match(openRateSummary, /未入力は「記録の修正・削除」から補完できます。/);
assert.match(openSessionEditor, /openModal\("記録の修正・削除", "スキップした項目もここで修正できます。"/);
// 「記録の修正」ラベルのボタンはリザルトのフッタ1箇所だけ。他所に増えたら気づけるように数で固定する
assert.equal((html.match(/>記録の修正<\/button>/g) || []).length, 1);
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
  netBallsUsedText(info) {
    return info ? `${info.value}玉（${info.source}${info.count ? `・n=${info.count}` : ""}）` : "-";
  },
  calculateMachineExpectation(machine, options) {
    runningExpectationContext.__expectationCalls.push({ currentSpin: options.currentSpin, previousSpin: options.previousSpin, manualRate: options.manualRate, availableBalls: options.availableBalls });
    const effectiveSpin = Number(options.currentSpin || 0) + Number(options.previousSpin || 0);
    return {
      netBallsInfo: { value: 587.5, source: "理論値", count: 0 },
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
// S9/§1-3: 稼働中パネルにも参考1R出玉を出典・サンプル数つきで出す
assert.match(renderedLiveExpectation, /現在400回転 \/ 実測17\.0 \/250玉 \/ 参考1R出玉 587\.5玉（理論値） \/ 持ち玉1,200玉を使う前提/);
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
assert.match(html, /const SCHEMA_VERSION = 36;/);
assert.match(html, /jitanNormalBallsPerSpin: 0,/);
assert.match(html, /jitanFastBallsPerSpin: 0,/);
assert.match(html, /yutimeBallsPerSpin: -0\.3,/);
assert.match(html, /roundTypes: \[\{ id: "r10", label: "10R", balls: 1400 \}\]/);
assert.match(html, /id: "agnes-pe"/);
assert.match(html, /name: "PA大海物語Withアグネス・ラムPE"/);
assert.match(html, /modelType: "st-certain"/);
// B98: agnes-pe の既定値は MACHINE_PRESETS ではなく期待値エンジンのプリセットに置く
assert.match(yutimeExpectationEngine, /netBallsPerWin: 100,\s+jitanNormalBallsPerSpin: -0\.8,\s+jitanFastBallsPerSpin: 0,\s+yutimeBallsPerSpin: -0\.8,/);
// S11: 玉/R × 平均R数 が旧 netBallsPerWin と一致することを式で固定する
assert.match(yutimeExpectationEngine, /averageRoundsPerWin: 587\.5 \/ 108/);
assert.match(yutimeExpectationEngine, /averageRoundsPerWin: 10/);
assert.match(yutimeExpectationEngine, /const netBallsPerWinTotal = merged\.netBallsPerWin \* activePreset\.spec\.averageRoundsPerWin;/);
assert.match(yutimeExpectationEngine, /const netBallsPerWinTotal = merged\.netBallsPerWin \* preset\.spec\.averageRoundsPerWin;/);
assert.match(yutimeExpectationEngine, /const expectedJitanFastSpins = expectedWins \* chains\.supportSpinsPerWin;/);
assert.match(yutimeExpectationEngine, /const expectedYutimeSpins = pReach \* \(1 \/ p\);/);
assert.match(yutimeExpectationEngine, /const winBalls = expectedWins \* netBallsPerWinTotal \+ expectedJitanNormalSpins \* merged\.jitanNormalBallsPerSpin \+ expectedJitanFastSpins \* merged\.jitanFastBallsPerSpin \+ expectedYutimeSpins \* merged\.yutimeBallsPerSpin;/);
assert.match(html, /roundTypes: \[\{ id: "r10", label: "10R", balls: 1080 \}, \{ id: "r6", label: "6R", balls: 648 \}, \{ id: "r4", label: "4R", balls: 432 \}\]/);
assert.match(html, /hits: \[\],/);
assert.match(html, /function normalizeHits\(hits\)/);
assert.match(html, /function syncSessionHitTotals\(session, machines = data\.machines\)/);
assert.match(html, /function netBallsPerWinInfo\(presetId, machine = null, manualInput = null\)/);
assert.match(html, /netBallsPerWinManual/);
// S11: 入力欄の単位は玉/R
assert.match(html, /1R実質出玉（玉\/R）/);
assert.doesNotMatch(html, /純払い出し量/);
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
assert.match(deriveSession, /const normalSegments = segments\.filter\(\(segment\) => segment\.kind === "normal"\);/);
assert.match(deriveSession, /const rawNormalSpins = sumSegmentValues\(normalSegments\.map\(\(segment\) => segmentPlayedSpins\(segment, session, preset\)\)\);/);
// S4/A-1: 閉じていない区間は当選の有無に関わらず現在回転数で閉じる。完了済みは従来どおり
assert.match(tapModeConsumedBlock, /function segmentEndSpinForRate\(segment, session, preset = null\)[\s\S]*?if \(session\?\.status !== "completed"\) \{[\s\S]*?return normalizeNumber\(session\?\.currentSpin\) \?\? normalizeNumber\(session\?\.endSpin\);\s*\}\s*if \(Number\(session\?\.hitCount \|\| 0\) > 0\) return null;\s*if \(session\?\.hitVia === "yutime" \|\| normalizeNumber\(session\?\.yutimeEnterBalls\) !== null\) \{\s*return yutimeEnterSpinForRate\(session, preset\);\s*\}\s*return normalizeNumber\(session\?\.endSpin\);/);
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
// S5/§1: 台情報は変更した時点で保存する。保存ボタンは置かない
assert.doesNotMatch(html, /saveMachineBtn/);
assert.doesNotMatch(html, /台情報保存/);
assert.match(openMachineDetail, /const commitMachineDetailForm = \(\) => \{\s*readMachineDetailForm\(machine\);\s*if \(!persistWithQuietToast\(`台番\$\{daiNo\}の情報を保存しました`\)\) return;/);
assert.match(openMachineDetail, /byId\("machineModel"\)\.addEventListener\("change", commitMachineDetailForm\);/);
assert.match(openMachineDetail, /byId\("roundBalls"\)\.addEventListener\("change", commitMachineDetailForm\);/);
assert.match(openMachineDetail, /byId\("machinePreset"\)\.addEventListener\("change", \(\) => \{\s*applyPresetSelectionToForm\(\);\s*commitMachineDetailForm\(\);\s*\}\);/);
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
assert.ok(!html.includes('当り後（時短消化中）'));
assert.ok(!html.includes('リセット前'));
assert.ok(!html.includes('spin-note'));
assert.ok(html.includes('id="machineEvContext"'));
assert.equal(html.split('${machineContextLine(session)}').length - 1, 11);
assert.equal((html.match(/（実機：/g) || []).length, 15);
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
// S8/§1-3: ヤメ入力の累計獲得出玉は廃止。フィールドは旧データのために残す
assert.ok(!html.includes('key: "sessionActualBalls"'));
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
  const SCHEMA_VERSION = 36;
  const DEFAULT_HOURLY_THRESHOLD_YEN = 2400;
  const DEFAULT_LEND_RATE = 4;
  const DEFAULT_EXCHANGE_BALLS = 25;
  const DEFAULT_NET_BALLS_PER_ROUND = 140;
  const RAM_CLEAR_VALUE = "cleared";
  const RAM_NOT_CLEARED_VALUE = "not_cleared";
  const RAM_UNKNOWN_VALUE = "unknown";
  const MACHINE_PRESETS = [
    { id: "umi-sp5", name: "P大海物語5スペシャル", evSupported: true, spec: { averageRoundsPerWin: 10 }, defaults: { netBallsPerWin: 140, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.3 } },
    { id: "agnes-pe", name: "PA大海物語Withアグネス・ラムPE", evSupported: true, spec: { averageRoundsPerWin: 587.5 / 108 }, defaults: { netBallsPerWin: 108, jitanNormalBallsPerSpin: -0.8, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8 } }
  ];
  function averageRoundsPerWin(presetId) {
    const rounds = normalizeNumber(presetById(presetId)?.spec?.averageRoundsPerWin);
    return rounds !== null && rounds > 0 ? rounds : 1;
  }
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
  const BACKUP_KEY = "ytv3:backup:latest";
  const S15_BACKUP_KEY = "ytv3:backup:s15";
  const localStorage = { store: {}, setItem(k, v) { this.store[k] = v; }, getItem(k) { return this.store[k] ?? null; } };
  ${segmentMigrationBackup}
  function tapModeNormalConsumedBalls() { return null; }
  function yutimeEnterSpinForRate() { return null; }
  ${holdCarryBlock}
  ${consumedModelBlock}
  ${segmentBlock}
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
  const segSessionBase = {
    id: "s_seg", storeId: "st_1", machineId: "m_1",
    startSpin: 0, startTime: "10:00", startMochidama: 2500,
    investments: [
      { source: "mochidama", amount: 125, phase: "normal", spinAt: 1 },
      { source: "cash", amount: 1000, phase: "yutime", spinAt: 910 }
    ],
    hits: [{ roundTypeId: "r10", hitSpin: 940, actualBalls: 1400, at: "2026-08-20T01:30:00.000Z" }]
  };
  globalThis.segNormalHit = normalizeData({ version: 30, presetSettings: { "umi-sp5": {} }, sessions: [
    { ...segSessionBase, hitSpin: 110, hitCount: 1, hitVia: "normal", hitRemainBalls: 1025, hitTrackedBalls: 1000 }
  ] }).sessions[0];
  globalThis.segYutimeHit = normalizeData({ version: 30, presetSettings: { "umi-sp5": {} }, sessions: [
    { ...segSessionBase, hitSpin: 940, hitCount: 1, hitVia: "yutime", hitRemainBalls: 600,
      yutimeEnterSpin: 900, yutimeEnterBalls: 800, yutimeEnterTime: "12:00" }
  ] }).sessions[0];
  globalThis.segNoHit = normalizeData({ version: 30, presetSettings: { "umi-sp5": {} }, sessions: [
    { ...segSessionBase, hits: [], endSpin: 200 }
  ] }).sessions[0];
  globalThis.segNoHitCompleted = normalizeData({ version: 30, presetSettings: { "umi-sp5": {} }, sessions: [
    { ...segSessionBase, hits: [], endSpin: 200, status: "completed" }
  ] }).sessions[0];
  globalThis.segTwice = normalizeData({ version: 31, presetSettings: { "umi-sp5": {} }, sessions: [globalThis.segYutimeHit] }).sessions[0];
  globalThis.segNeedsMigration = needsSegmentMigration({ sessions: [{ id: "a" }] });
  globalThis.segNeedsNoMigration = needsSegmentMigration({ sessions: [{ id: "a", segments: [{ kind: "normal" }] }] });
  const s2ResyncUser = {
    startSpin: 0,
    startTime: "10:00",
    startMochidama: 2500,
    hitSpin: 145,
    hitCount: 2,
    hitVia: "normal",
    hitRemainBalls: 3000,
    hitTrackedBalls: 3000,
    investments: [],
    hits: [],
    segments: [
      { id: "seg_a", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", startTrackedBalls: 2500, holdSpins: 0, endSource: "hit", endSpin: 75, endAt: null, endRemainBalls: 1550, endTrackedBalls: 1550 },
      { id: "seg_b", kind: "normal", source: "user", startSpin: 25, startAt: "10:20", startTrackedBalls: 2000, holdSpins: 5, endSource: "hit", endSpin: 145, endAt: null, endRemainBalls: 3000, endTrackedBalls: 3000 }
    ]
  };
  globalThis.s2ResyncUser = resyncSessionSegments(s2ResyncUser);
  s2ResyncUser.hitSpin = 150;
  globalThis.s2ResyncUserHitEdited = resyncSessionSegments(s2ResyncUser);
  const s2ResyncNoUser = {
    startSpin: 0,
    startTime: "10:00",
    startMochidama: 2500,
    hitSpin: 110,
    hitCount: 1,
    hitVia: "normal",
    hitRemainBalls: 1025,
    hitTrackedBalls: 1000,
    investments: [],
    hits: [],
    segments: [
      { id: "seg_old", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", startTrackedBalls: 2500, holdSpins: 3, endSource: "hit", endSpin: 100, endAt: null, endRemainBalls: 1200, endTrackedBalls: 1200 }
    ]
  };
  globalThis.s2ResyncNoUser = resyncSessionSegments(s2ResyncNoUser);
`).runInContext(legacyMachineContext);
// S1: 通常時区間モデルへの移行
const segNormalHit = legacyMachineContext.segNormalHit;
assert.equal(segNormalHit.segments.length, 1);
assert.equal(segNormalHit.segments[0].kind, "normal");
assert.equal(segNormalHit.segments[0].source, "migrated");
assert.equal(segNormalHit.segments[0].startSpin, 0);
assert.equal(segNormalHit.segments[0].startAt, "10:00");
assert.equal(segNormalHit.segments[0].startTrackedBalls, 2500);
assert.equal(segNormalHit.segments[0].holdSpins, 0);
assert.equal(segNormalHit.segments[0].endSource, "hit");
assert.equal(segNormalHit.segments[0].endSpin, 110);
assert.equal(segNormalHit.segments[0].endRemainBalls, 1025);
assert.equal(segNormalHit.segments[0].endTrackedBalls, 1000);
assert.equal(segNormalHit.investments[0].segmentId, segNormalHit.segments[0].id);
assert.equal(segNormalHit.investments[1].segmentId, null);
assert.equal(segNormalHit.hits[0].segmentId, segNormalHit.segments[0].id);
const segYutimeHit = legacyMachineContext.segYutimeHit;
assert.equal(segYutimeHit.segments.length, 2);
assert.equal(segYutimeHit.segments[0].endSource, "yutime");
assert.equal(segYutimeHit.segments[0].endSpin, 900);
assert.equal(segYutimeHit.segments[0].endRemainBalls, null);
assert.equal(segYutimeHit.segments[0].endAt, "12:00");
assert.equal(segYutimeHit.segments[1].kind, "yutime");
assert.equal(segYutimeHit.segments[1].startSpin, 900);
assert.equal(segYutimeHit.segments[1].startTrackedBalls, 800);
assert.equal(segYutimeHit.segments[1].holdSpins, 0);
assert.equal(segYutimeHit.segments[1].endSource, "hit");
assert.equal(segYutimeHit.segments[1].endSpin, 940);
assert.equal(segYutimeHit.segments[1].endRemainBalls, 600);
assert.equal(segYutimeHit.investments[0].segmentId, segYutimeHit.segments[0].id);
assert.equal(segYutimeHit.investments[1].segmentId, segYutimeHit.segments[1].id);
assert.equal(segYutimeHit.hits[0].segmentId, segYutimeHit.segments[1].id);
// 当選なしは endSpin 系を埋めない（§2 の表）
assert.equal(legacyMachineContext.segNoHit.segments.length, 1);
assert.equal(legacyMachineContext.segNoHit.segments[0].endSpin, null);
assert.equal(legacyMachineContext.segNoHitCompleted.segments[0].endSpin, 200);
assert.equal(legacyMachineContext.segNoHitCompleted.segments[0].endSource, "end");
// 二重移行しない（segments があれば再変換しない）
assert.equal(JSON.stringify(legacyMachineContext.segTwice.segments), JSON.stringify(segYutimeHit.segments));
assert.equal(legacyMachineContext.segNeedsMigration, true);
assert.equal(legacyMachineContext.segNeedsNoMigration, false);
assert.equal(legacyMachineContext.s2ResyncUser.segments.length, 2);
assert.equal(legacyMachineContext.s2ResyncUser.segments[1].source, "user");
assert.equal(legacyMachineContext.s2ResyncUser.segments[1].startSpin, 25);
assert.equal(legacyMachineContext.s2ResyncUser.segments[1].holdSpins, 5);
assert.equal(legacyMachineContext.s2ResyncUserHitEdited.segments[1].endSpin, 150);
assert.equal(legacyMachineContext.s2ResyncUserHitEdited.segments[0].endSpin, 75);
assert.equal(legacyMachineContext.s2ResyncNoUser.segments.length, 1);
assert.equal(legacyMachineContext.s2ResyncNoUser.segments[0].endSpin, 110);
assert.equal(legacyMachineContext.s2ResyncNoUser.segments[0].holdSpins, 3);
assert.match(segmentMigrationBackup, /localStorage\.setItem\(BACKUP_KEY, raw\);/);
assert.match(html, /if \(needsSegmentMigration\(parsed\)\) backupBeforeSegmentMigration\(raw\);\s*if \(needsStartMochidamaRepair\(parsed\)\) backupBeforeStartMochidamaRepair\(raw\);\s*if \(needsInvestmentPhaseRepair\(parsed\)\) backupBeforeInvestmentPhaseRepair\(raw\);\s*return normalizeData\(parsed\);/);
assert.match(normalizeData, /normalized\.segments = normalizeSessionSegments\(normalized\);\s*applySegmentIds\(normalized\);/);
// S1 では保留を引かない（holdSpins は常に0で作る）
assert.match(segmentBlock, /function blankSegment\(kind, overrides = \{\}\)[\s\S]*?holdSpins: 0,/);
// S7/B-2: 打ち始めと遊タイム突入の起点は実測入力（measured）。holdSpins は従来どおり0で開く。
assert.match(segmentBlock, /startTrackedBalls: normalizeNumber\(session\?\.startMochidama\),\s*(\/\/[^\n]*\n\s*)?startBallsSource: normalizeNumber\(session\?\.startMochidama\) !== null \? "measured" : null,\s*holdSpins: 0/);
assert.match(segmentBlock, /startTrackedBalls: normalizeNumber\(session\?\.yutimeEnterBalls\),\s*(\/\/[^\n]*\n\s*)?startBallsSource: normalizeNumber\(session\?\.yutimeEnterBalls\) !== null \? "measured" : null,\s*holdSpins: 0/);
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
// 島の削除は二段確認（記録の削除・大当たり履歴の削除と同じ形式）
assert.match(bindIslandEditor, /if \(!confirm\(`「\$\{islandName\}」を削除しますか？台と記録は消えません。`\)\) return;\s*if \(!confirm\("元に戻せません。島の削除を確定しますか？台と記録は残ります。"\)\) return;\s*mapDraft\.islands\.splice\(index, 1\);/);
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

// B96: 履歴カード上部を「実収支」「期待値」の2枠にし、日付区切りの直下に日別サマリーを出す。
// 表示のみの変更。計算式・保存データ・schema は触らない。
const ledgerSummaryBlock = section('function sessionTimeMinutes', 'function renderLedger');
const startEvBasisTextBlock = section('function startEvBasisText', 'function startEvDetailText');
const numberHelpersBlock = section('function normalizeNumber', 'function positiveNumberOrDefault');
const escapeHtmlBlock = section('function escapeHtml', 'function presetById');
const yenHourTextBlock = section('function yenText', 'function percentText');
const ledgerSummaryContext = vm.createContext({});
const ledgerEmptyTextBlock = section('const LEDGER_EMPTY_TEXT', 'const AUTO_LABELS');
new vm.Script(`
  ${ledgerEmptyTextBlock}
  ${numberHelpersBlock}
  ${escapeHtmlBlock}
  ${yenHourTextBlock}
  ${ledgerSummaryBlock}
  globalThis.ledgerApi = {
    LEDGER_EMPTY_TEXT,
    sessionTimeMinutes,
    sessionWorkedHours,
    ledgerDaySummary,
    ledgerDaySummaryHtml,
    sessionFiguresHtml,
    signedYenToneClass,
    signedYenDisplayText
  };
`).runInContext(ledgerSummaryContext);
const ledgerApi = ledgerSummaryContext.ledgerApi;

// 実働は開始〜終了の差。時刻欠損は null、日またぎ・逆転は 0 にして合計を壊さない
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '10:30' }), 0.5);
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '11:00' }), 1);
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '10:02' }), 2 / 60);
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: null }), null);
assert.equal(ledgerApi.sessionWorkedHours({ endTime: '10:30' }), null);
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '' }), null);
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '25:00' }), null);
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '23:30', endTime: '00:10' }), 0, '日をまたぐ時刻は0扱い');
assert.equal(ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '10:00' }), 0);
assert.equal(ledgerApi.sessionWorkedHours(null), null);

// 検算：同日3件（実収支 +4,273／+1,228／−3,877、期待値 +1,000／+1,228／+972、実働 30分／2分／60分）
const threeSessions = [
  { profitYen: 4273, evYen: 1000, workedHours: ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '10:30' }) },
  { profitYen: 1228, evYen: 1228, workedHours: ledgerApi.sessionWorkedHours({ startTime: '11:00', endTime: '11:02' }) },
  { profitYen: -3877, evYen: 972, workedHours: ledgerApi.sessionWorkedHours({ startTime: '12:00', endTime: '13:00' }) }
];
const threeSummary = ledgerApi.ledgerDaySummary(threeSessions);
assert.equal(threeSummary.count, 3);
assert.equal(threeSummary.profitYen, 1624);
assert.equal(threeSummary.evYen, 3200);
assert.ok(Math.abs(threeSummary.workedHours - 92 / 60) < 1e-9, '実働は30分＋2分＋60分＝92分');
assert.equal(Math.round(threeSummary.hourlyYen), 1059, '時給は実収支合計 ÷ 実働合計（92分＝1.5333h）');
const threeHtml = ledgerApi.ledgerDaySummaryHtml(threeSummary);
assert.match(threeHtml, /<strong>3台<\/strong>/);
assert.match(threeHtml, /実収支<\/span><strong class="signed-figure-value is-plus">\+1,624円<\/strong>/);
assert.match(threeHtml, /期待値<\/span><strong class="signed-figure-value is-plus">\+3,200円<\/strong>/);
assert.match(threeHtml, /実働<\/span><strong>1\.53h<\/strong>/);
assert.match(threeHtml, /時給<\/span><strong class="signed-figure-value is-plus">\+1,059円<\/strong>/);

// endTime 欠損のセッションは実働に入らないが、実収支・期待値の合算には入る
const missingEndTime = ledgerApi.ledgerDaySummary([
  { profitYen: 4273, evYen: 1000, workedHours: ledgerApi.sessionWorkedHours({ startTime: '10:00', endTime: '10:30' }) },
  { profitYen: 1228, evYen: 1228, workedHours: ledgerApi.sessionWorkedHours({ startTime: '11:00', endTime: null }) },
  { profitYen: -3877, evYen: 972, workedHours: ledgerApi.sessionWorkedHours({ startTime: '12:00', endTime: '13:00' }) }
]);
assert.equal(missingEndTime.count, 3);
assert.equal(missingEndTime.profitYen, 1624);
assert.equal(missingEndTime.evYen, 3200);
assert.equal(missingEndTime.workedHours, 1.5);
assert.equal(Math.round(missingEndTime.hourlyYen), 1083);

// 全件で時刻欠損なら実働も時給も「—」
const noTimes = ledgerApi.ledgerDaySummary([
  { profitYen: 4273, evYen: 1000, workedHours: null },
  { profitYen: -3877, evYen: 972, workedHours: null }
]);
assert.equal(noTimes.workedHours, null);
assert.equal(noTimes.hourlyYen, null);
const noTimesHtml = ledgerApi.ledgerDaySummaryHtml(noTimes);
assert.match(noTimesHtml, /実働<\/span><strong>—<\/strong>/);
assert.match(noTimesHtml, /時給<\/span><strong class="signed-figure-value is-empty">—<\/strong>/);

// 実働0でも時給は「—」。ゼロ除算しない
const zeroWorked = ledgerApi.ledgerDaySummary([{ profitYen: 500, evYen: 100, workedHours: 0 }]);
assert.equal(zeroWorked.workedHours, 0);
assert.equal(zeroWorked.hourlyYen, null);
assert.match(ledgerApi.ledgerDaySummaryHtml(zeroWorked), /実働<\/span><strong>0\.00h<\/strong>/);

// 実収支が算出できないセッションは合算から外す。全件不能なら「—」で時給も出さない
const partialProfit = ledgerApi.ledgerDaySummary([
  { profitYen: null, evYen: 1000, workedHours: 1 },
  { profitYen: -3877, evYen: null, workedHours: 1 }
]);
assert.equal(partialProfit.count, 2);
assert.equal(partialProfit.profitYen, -3877);
assert.equal(partialProfit.evYen, 1000);
assert.equal(partialProfit.workedHours, 2);
assert.equal(Math.round(partialProfit.hourlyYen), -1938, "-3,877円 ÷ 2h = -1938.5 → -1,938円");
assert.match(ledgerApi.ledgerDaySummaryHtml(partialProfit), /実収支<\/span><strong class="signed-figure-value is-minus">-3,877円<\/strong>/);
const noProfit = ledgerApi.ledgerDaySummary([{ profitYen: null, evYen: null, workedHours: 1 }]);
assert.equal(noProfit.profitYen, null);
assert.equal(noProfit.evYen, null);
assert.equal(noProfit.hourlyYen, null);
const noProfitHtml = ledgerApi.ledgerDaySummaryHtml(noProfit);
assert.match(noProfitHtml, /実収支<\/span><strong class="signed-figure-value is-empty">—<\/strong>/);
assert.match(noProfitHtml, /期待値<\/span><strong class="signed-figure-value is-empty">—<\/strong>/);

// 1件だけの日は正常、0件の日はサマリー自体を出さない
const single = ledgerApi.ledgerDaySummary([{ profitYen: 1228, evYen: 1228, workedHours: 0.5 }]);
assert.equal(single.count, 1);
assert.match(ledgerApi.ledgerDaySummaryHtml(single), /<strong>1台<\/strong>/);
assert.equal(ledgerApi.ledgerDaySummaryHtml(ledgerApi.ledgerDaySummary([])), '');
assert.equal(ledgerApi.ledgerDaySummaryHtml(ledgerApi.ledgerDaySummary(undefined)), '');
assert.equal(ledgerApi.ledgerDaySummaryHtml(null), '');

// カード上部は実収支・期待値の2枠。どちらもラベル必須で、金額だけを単独で出さない
const figuresHtml = ledgerApi.sessionFiguresHtml(-3877, 1228);
assert.match(figuresHtml, /<div class="session-figures">/);
assert.match(figuresHtml, /<span class="signed-figure-label">実収支<\/span><strong class="signed-figure-value is-minus">-3,877円<\/strong>/);
assert.match(figuresHtml, /<span class="signed-figure-label">期待値<\/span><strong class="signed-figure-value is-plus">\+1,228円<\/strong>/);
assert.ok(figuresHtml.indexOf('実収支') < figuresHtml.indexOf('期待値'), '左が実収支、右が期待値');
const figuresMissing = ledgerApi.sessionFiguresHtml(null, 1228);
assert.match(figuresMissing, /<span class="signed-figure-label">実収支<\/span><strong class="signed-figure-value is-empty">—<\/strong>/);
assert.match(figuresMissing, /期待値<\/span><strong class="signed-figure-value is-plus">\+1,228円<\/strong>/);
assert.match(ledgerApi.sessionFiguresHtml(null, null), /期待値<\/span><strong class="signed-figure-value is-empty">—<\/strong>/);
assert.equal(ledgerApi.signedYenToneClass(0), 'is-zero');
assert.equal(ledgerApi.signedYenDisplayText(0), '+0円');
assert.equal(ledgerApi.signedYenDisplayText(undefined), '—');
assert.equal(ledgerApi.LEDGER_EMPTY_TEXT, '—');

// renderLedger 側の配線
assert.match(renderLedger, /\$\{sessionFiguresHtml\(derived\.profitYen, evYenById\.get\(session\.id\)\)\}/);
assert.match(renderLedger, /\+ ledgerDaySummaryHtml\(ledgerDaySummary\(dayEntries\.get\(String\(session\.date \|\| ""\)\)\)\)/);
assert.match(renderLedger, /workedHours: sessionWorkedHours\(session\)/);
assert.match(renderLedger, /profitYen: derived\.profitYen,/);
assert.match(renderLedger, /data-open-result="\$\{escapeHtml\(session\.id\)\}"/);
assert.match(renderLedger, /openSessionResult\(card\.dataset\.openResult\)/);
assert.doesNotMatch(renderLedger, /<small>期待値の内訳 \$\{escapeHtml\(startEvBasisText\(session\.startEv\)\)\}<\/small>/);
assert.match(resultBlock, /startEvBasisText|開始カウンター/);
// 見出しの単独金額は廃止した
assert.doesNotMatch(html, /session-start-ev/);
assert.doesNotMatch(html, /function startEvText\(/);
assert.doesNotMatch(renderLedger, /開始時期待値 \$\{escapeHtml\(startEvDetailText/);
// 期待値の内訳から金額を外し、金額の定義そのものは変えない
assert.match(startEvBasisTextBlock, /function startEvBasisText\(startEv\) \{/);
assert.match(startEvDetailTextBlock, /return `\$\{yenText\(normalized\.evYen\)\} \/ \$\{startEvBasisText\(startEv\)\}`;/);
assert.doesNotMatch(startEvBasisTextBlock, /yenText\(/);
// 表示専用。集計ブロックはセッションを書き換えず保存もしない
assert.doesNotMatch(ledgerSummaryBlock, /session\.[A-Za-z]+ =|persist\(|localStorage/);

for (const word of ['上振れ', '下振れ', 'ほぼ想定どおり', 'サンプル不足', 'やや悪化', '良化', '悪化', 'rateToneClass']) {
  assert.doesNotMatch(resultBlock, new RegExp(word), `リザルトに判定表現を置かない: ${word}`);
}
// S12/B-1: ラベルだけを変える。差の算出（実収支 − 開始期待値）は不変
assert.match(resultBlock, /<td>開始期待値との差<\/td>/);
assert.doesNotMatch(resultBlock, /<td>期待値との差<\/td>/);
assert.match(resultBlock, /const evDiffYen = startEv && derived\.profitYen !== null \? derived\.profitYen - startEv\.evYen : null;/);
// S12/B-2: 区間ごとの内訳は表。列は 区間／起点／終点／回転数／消費玉／回転率
assert.match(resultBlock, /<table class="result-table segments">/);
// S17/B-3: 期待値の列が増えて7列になる
assert.match(resultBlock, /<thead><tr><th>区間<\/th><th>起点<\/th><th>終点<\/th><th>回転数<\/th><th>消費玉<\/th><th>回転率<\/th><th>期待値<\/th><\/tr><\/thead>/);
assert.doesNotMatch(resultBlock, /class="result-seg"/);
// 保留控除の注記は表の下に1行でまとめる
assert.match(resultBlock, /segmentHoldNotes\.push\(`\$\{mark\}保留\$\{row\.holdSpins\}`\)/);
assert.match(resultBlock, /回転数は残保留の控除後（\$\{escapeHtml\(segmentHoldNotes\.join\("・"\)\)\}）/);
assert.match(html, /\.result-table\.segments \{ font-size: 11px; \}/);
assert.match(resultBlock, /1回のブレです。判断の良し悪しは下の通算で見ます。/);
assert.match(resultBlock, /これまでの積み上げ/);
assert.doesNotMatch(resultBlock, /通算との比較/);

const resultContext = vm.createContext({
  data: {
    machines: [{ id: 'm1', storeId: 'store1', modelName: 'Pテスト', presetId: 'preset1' }],
    sessions: []
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  deriveSession(session) {
    return { rate: session.__rate ?? 18.5, normalSpins: session.__normalSpins ?? 200, profitYen: session.__profitYen ?? -6381, consumedBalls: session.__consumedBalls ?? 1000, yutimeLoss: session.__yutimeLoss ?? 210 };
  },
  normalizeStartEv(value) {
    return value || null;
  },
  sessionWorkedHours(session) {
    const parse = (value) => {
      const match = String(value || '').match(/^(\d{2}):(\d{2})$/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    };
    const start = parse(session?.startTime);
    const end = parse(session?.endTime);
    if (start === null || end === null) return null;
    return end >= start ? (end - start) / 60 : 0;
  },
  aggregateStats(list) {
    const rateValues = (Array.isArray(list) ? list : []).map((session) => session.__rate).filter((value) => value !== undefined);
    return { rate: rateValues.length ? rateValues.reduce((sum, value) => sum + value, 0) / rateValues.length : null };
  },
  sessionSegments(session) {
    return Array.isArray(session.segments) ? session.segments : [];
  },
  segmentPlayedSpins(segment) {
    const start = resultContext.normalizeNumber(segment.startSpin);
    const end = resultContext.normalizeNumber(segment.endSpin);
    if (start === null || end === null) return null;
    return end - start - Math.max(0, Number(segment.holdSpins || 0));
  },
  segmentTapConsumedBalls(segment) {
    return segment.consumed;
  },
  storeById(id) {
    return { id };
  },
  presetById(id) {
    return { id };
  },
  normalizeMachinePresetId(machine) {
    return machine?.presetId || '';
  },
  transferSummaryForSession() {
    return { averageRoundBalls: 100 };
  },
  remainingSpinsFromCounterSpin(spin) {
    return 950 - Number(spin || 0);
  }
});
new vm.Script(`
  const EARNED_EV_RATE_MIN = 1;
  const EARNED_EV_RATE_MAX = 50;
  const EARNED_EV_MIN_SPINS = 100;
  // S17b/3: 参考回転率は台ごとの集計。この文脈では機種オブジェクトに持たせたスタブを返す
  function machineStats(machineId) {
    const machine = data.machines.find((item) => item.id === machineId);
    return machine && machine.__stats ? machine.__stats : { rate: null, spins: 0 };
  }
  ${holdCarryBlock}
  ${resultBlock}
  // S17/B: 区間ごとの期待値はエンジンを叩くので、この文脈では起点ごとに固定値を返すスタブに差し替える。
  // 集計の配線（resultAggregate が獲得期待値を足すこと）だけをここで固定する。
  function calculateMachineExpectation(machine, options) {
    if (!machine || machine.__noEv) return { result: null };
    const base = machine.__evByStart ? machine.__evByStart[String(options.currentSpin)] : null;
    if (base === null || base === undefined) return { result: null };
    return { result: { evYen: base }, netBallsInfo: { value: 108, source: "実測平均" } };
  }
  globalThis.resultApi = { longDateText, sessionResultSummary, resultAggregate, segmentBreakdownRows, earnedExpectationForSession, earnedExpectationYen, earnedExpectationBasisText };
`).runInContext(resultContext);
assert.equal(resultContext.resultApi.longDateText('2026-09-02'), '2026年9月2日（水）');
assert.equal(resultContext.resultApi.longDateText('2026-09-03'), '2026年9月3日（木）');
assert.equal(resultContext.resultApi.longDateText(''), '-');
const diffSummary = resultContext.resultApi.sessionResultSummary({
  machineId: 'm1',
  startEv: { usedRate: 18.0, evYen: 1769, effectiveSpin: 250, presetId: 'preset1' },
  __rate: 18.5,
  __profitYen: -6381
});
assert.equal(diffSummary.rateDiff, 0.5);
assert.equal(diffSummary.evDiffYen, -8150);
// S17/B-3: 積み上げの期待値は獲得期待値（Σ区間期待値）。起点0→+1,000円／起点50→+2,000円のスタブで、
// 1件目は1区間、2件目は2区間（1,000＋2,000＝3,000ではなく、ここでは起点50の1区間だけ）を持たせる
resultContext.data.machines = [{ id: 'm1', storeId: 'store1', presetId: 'preset1', __evByStart: { 0: 1000, 50: 2000 } }];
const normalSegment = (startSpin, id) => ({ id, kind: 'normal', startSpin, endSpin: startSpin + 200, endSource: 'hit', holdSpins: 0, shooting: 'started' });
resultContext.data.sessions = [
  { status: 'completed', machineId: 'm1', storeId: 'store1', startEv: { evYen: 1000 }, startTime: '10:00', endTime: '12:00', __profitYen: -600, segments: [normalSegment(0, 'a1')] },
  { status: 'completed', machineId: 'm1', storeId: 'store1', startEv: { evYen: 1234 }, startTime: '13:00', endTime: '14:30', __profitYen: 3000, segments: [normalSegment(50, 'b1')] },
  { status: 'completed', machineId: 'm1', storeId: 'store1', startEv: null, startTime: '', endTime: '', __profitYen: 500, segments: [] }
];
const aggregate = resultContext.resultApi.resultAggregate(resultContext.data.sessions);
assert.equal(aggregate.count, 3);
assert.equal(aggregate.workedHours, 3.5);
assert.equal(aggregate.evYen, 3000);
assert.equal(aggregate.profitYen, 2900);
assert.equal(aggregate.diffYen, -100);
assert.equal(aggregate.evHourlyYen, 3000 / 3.5);
assert.equal(aggregate.profitHourlyYen, 2900 / 3.5);
const emptyAggregate = resultContext.resultApi.resultAggregate([]);
assert.equal(emptyAggregate.count, 0);
assert.equal(emptyAggregate.workedHours, null);
assert.equal(emptyAggregate.evYen, null);
assert.equal(emptyAggregate.profitYen, null);
assert.equal(emptyAggregate.diffYen, null);
assert.equal(emptyAggregate.evHourlyYen, null);
assert.equal(emptyAggregate.profitHourlyYen, null);
const segmentRows = resultContext.resultApi.segmentBreakdownRows({
  storeId: 'store1',
  segments: [
    { kind: 'normal', startSpin: 473, endSpin: 698, endSource: 'hit', holdSpins: 5, consumed: 1000 },
    { kind: 'normal', startSpin: 100, endSpin: 250, endSource: 'yutime', holdSpins: 0, consumed: 800 },
    { kind: 'yutime', startSpin: 250, endSpin: 320, endSource: 'hit', holdSpins: 0 }
  ]
}, { consumedBalls: 1800, yutimeLoss: 210 }, { presetId: 'preset1' });
assert.deepEqual(segmentRows.map((row) => row.startLabel), ['打ち始め', '時短抜け', '遊タイム']);
assert.equal(segmentRows[0].spins, 220);
assert.equal(segmentRows[2].consumed, 210);
assert.equal(resultContext.resultApi.segmentBreakdownRows({ segments: [{ kind: 'normal' }] }, {}, null).length, 0);

// G5: コーナー基準値は選択中のコーナーの機種で解決する。別機種（既定プリセット）の値を出さない
const cornerBaselineContext = vm.createContext({
  DEFAULT_NET_BALLS_PER_ROUND: 140,
  MACHINE_PRESETS: [
    { id: 'umi-sp5', name: 'P大海物語5スペシャル', hasYutime: true, defaults: { netBallsPerWin: 140, jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.3, holdSpins: 5 } },
    { id: 'agnes-pe', name: 'PA大海物語Withアグネス・ラムPE', hasYutime: true, defaults: { netBallsPerWin: 108, jitanNormalBallsPerSpin: -0.8, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: -0.8, holdSpins: 5 } },
    { id: 'no-yutime', name: '遊タイムなし機', hasYutime: false, defaults: { netBallsPerWin: 1000 } }
  ],
  data: { presetSettings: {}, machines: [], sessions: [] },
  __layout: { islands: [] },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  positiveNumberOrDefault(value, fallback) {
    const n = cornerBaselineContext.normalizeNumber(value);
    return n !== null && n > 0 ? n : fallback;
  },
  presetById(id) {
    return cornerBaselineContext.MACHINE_PRESETS.find((preset) => preset.id === id) || null;
  },
  presetByName(name) {
    return cornerBaselineContext.MACHINE_PRESETS.find((preset) => preset.name === name) || null;
  },
  normalizeMachinePresetId(machine) {
    if (cornerBaselineContext.presetById(machine?.presetId)) return machine.presetId;
    const matched = cornerBaselineContext.presetByName(machine?.modelName || '');
    return matched ? matched.id : '';
  },
  activeStore() {
    return { id: 'store1' };
  },
  selectedMapLayoutForParse() {
    return cornerBaselineContext.__layout;
  },
  parseIslandLayout(layout) {
    const expand = (side) => {
      const from = cornerBaselineContext.normalizeNumber(side?.from);
      const to = cornerBaselineContext.normalizeNumber(side?.to);
      if (from === null || to === null) return [];
      const values = [];
      for (let n = from; n <= to; n += 1) values.push(String(n));
      return values;
    };
    const seen = new Set();
    (layout?.islands || []).forEach((island) => {
      const excluded = new Set((island?.excluded || []).map(String));
      [...expand(island?.left), ...expand(island?.right)].forEach((daiNo) => {
        if (!excluded.has(daiNo)) seen.add(daiNo);
      });
    });
    return { rows: [], errors: [], daiNos: [...seen] };
  },
  escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  },
  filteredSessions() {
    return cornerBaselineContext.data.sessions;
  },
  normalizeHits(hits) {
    return Array.isArray(hits) ? hits : [];
  }
});
new vm.Script(`
  ${presetSettingsHelpers}
  ${selectedYutimePresetIdsBlock}
  ${baselineChipsBlock}
  globalThis.cornerIds = () => selectedYutimePresetIds('store1');
  globalThis.cornerChips = () => baselineChipsHtml(selectedYutimePresetIds('store1'));
`).runInContext(cornerBaselineContext);
const setCorner = (islands, machines = []) => {
  cornerBaselineContext.__layout = { islands };
  cornerBaselineContext.data.machines = machines;
};

// アグネスPEのコーナーはアグネスPEの既定値を出す
setCorner([{ left: { from: 201, to: 204 }, right: null, leftPresetId: 'agnes-pe', rightPresetId: '' }]);
assert.equal(cornerBaselineContext.cornerIds().join(','), 'agnes-pe', 'アグネスPEのコーナーは agnes-pe を解決する');
const agnesChip = cornerBaselineContext.cornerChips();
assert.match(agnesChip, /data-baseline-preset="agnes-pe"/);
assert.match(agnesChip, /1R実質出玉 <strong>108玉<\/strong>/, 'S11: アグネスPEの1R実質出玉は108玉/R');
assert.match(agnesChip, /時短・遊タイム <strong>-0\.8\/0\/-0\.8<\/strong>/, 'アグネスPEの既定は -0.8 / 0 / -0.8');
assert.doesNotMatch(agnesChip, /umi-sp5|140玉/, '大海5SPの値へフォールバックしない');

// 大海5SPのコーナーは従来どおり
setCorner([{ left: { from: 101, to: 104 }, right: null, leftPresetId: 'umi-sp5', rightPresetId: '' }]);
assert.equal(cornerBaselineContext.cornerIds().join(','), 'umi-sp5');
const umiChip = cornerBaselineContext.cornerChips();
assert.match(umiChip, /data-baseline-preset="umi-sp5"/);
assert.match(umiChip, /1R実質出玉 <strong>140玉<\/strong> \/ 時短・遊タイム <strong>0\/0\/-0\.3<\/strong>/, 'S11: 大海5SPの1R実質出玉は140玉/R');

// 機種別ユーザー設定はプリセットIDごとに分離される（切り替えても混ざらない）
cornerBaselineContext.data.presetSettings = { 'umi-sp5': { yutimeBallsPerSpin: -0.5, netBallsPerWin: 130, netBallsPerWinManual: true } };
assert.match(cornerBaselineContext.cornerChips(), /<strong>130玉<\/strong> \/ 時短・遊タイム <strong>0\/0\/-0\.5<\/strong>/, '大海5SPは自分の設定を読む');
setCorner([{ left: { from: 201, to: 204 }, right: null, leftPresetId: 'agnes-pe', rightPresetId: '' }]);
assert.match(cornerBaselineContext.cornerChips(), /<strong>108玉<\/strong> \/ 時短・遊タイム <strong>-0\.8\/0\/-0\.8<\/strong>/, '大海5SPの設定はアグネスPEに漏れない');
cornerBaselineContext.data.presetSettings = {};

// 島に機種未設定でも、そこに並ぶ台の機種から補う
setCorner([{ left: { from: 301, to: 302 }, right: null, leftPresetId: '', rightPresetId: '' }], [
  { id: 'm301', storeId: 'store1', daiNo: '301', presetId: 'agnes-pe' },
  { id: 'm302', storeId: 'store1', daiNo: '302', presetId: 'agnes-pe' }
]);
assert.equal(cornerBaselineContext.cornerIds().join(','), 'agnes-pe', '台の機種からコーナーの機種を補う');

// 左右で機種が違うコーナーは機種名つきで両方出す
setCorner([{ left: { from: 101, to: 102 }, right: { from: 201, to: 202 }, leftPresetId: 'umi-sp5', rightPresetId: 'agnes-pe' }]);
assert.equal(cornerBaselineContext.cornerIds().join(','), 'umi-sp5,agnes-pe');
const mixedChips = cornerBaselineContext.cornerChips();
assert.equal(mixedChips.match(/data-baseline-preset=/g).length, 2, '機種ごとに1つずつチップを出す');
assert.match(mixedChips, /P大海物語5スペシャル 1R実質出玉/);
assert.match(mixedChips, /PA大海物語Withアグネス・ラムPE 1R実質出玉/);

// 遊タイムのない機種は基準値チップの対象外
setCorner([{ left: { from: 401, to: 402 }, right: null, leftPresetId: 'no-yutime', rightPresetId: '' }]);
assert.equal(cornerBaselineContext.cornerIds().join(','), '');
assert.equal(cornerBaselineContext.cornerChips(), '');

// 描画・保存の両方が選択中のコーナーを見る（既定プリセット決め打ちに戻さない）
assert.match(renderLabelFiltersBlock, /const baselinePresetIds = selectedYutimePresetIds\(store\.id\);/);
assert.match(renderLabelFiltersBlock, /\$\{baselineChipsHtml\(baselinePresetIds\)\}/);
assert.match(renderLabelFiltersBlock, /openNetBallsQuickForm\(button\.dataset\.baselinePreset\)/);
assert.doesNotMatch(renderLabelFiltersBlock, /presetNetBallsPerWin\("umi-sp5"\)|presetJitanBallsPerSpin\("umi-sp5"|presetYutimeBallsPerSpin\("umi-sp5"\)/);
assert.doesNotMatch(renderLabelFiltersBlock, /openNetBallsQuickForm\("umi-sp5"\)/);

// ============ S4: 実機テストで出た13件の修正 ============

// A-2: 投資タップの取り消し。トーストの「元に戻す」と同じ削除処理を共有する
assert.match(renderRunning, /id="undoInvestBtn"\$\{undoableInvestment \? "" : " disabled"\}>取り消し<\/button>/);
assert.match(renderRunning, /const undoableInvestment = lastInvestmentIndex\(session\) >= 0;/);
assert.match(renderRunning, /undoInvestButton\.addEventListener\("click", \(\) => undoLastInvestment\(session\)\)/);
assert.match(deleteInvestmentBlock, /function lastInvestmentIndex\(session\)/);
assert.match(deleteInvestmentBlock, /function undoLastInvestment\(session\)[\s\S]*?deleteInvestment\(session, index, "直前の投資を取り消しました"\);/);
assert.match(addInvestment, /if \(index >= 0\) deleteInvestment\(session, index, "直前の投資を取り消しました"\);/);
assert.doesNotMatch(addInvestment, /session\.investments\.splice\(index, 1\);/);

// C-8: 時短抜けで投資元を持ち玉へ切り替える（持ち玉0なら切り替えない）
assert.match(hitResetPrompt, /const switched = switchInvestmentSourceToMochidama\(session\);/);
assert.match(hitResetPrompt, /投資元を持ち玉に切り替えました/);
assert.match(hitResetPrompt, /if \(runningSource === "mochidama"\) return false;/);
assert.match(hitResetPrompt, /if \(mochidama === null \|\| mochidama <= 0\) return false;/);

// B-1: 大当たり履歴の導線
assert.match(resultBlock, /id="resultHitHistoryBtn">大当たり履歴<\/button>/);
assert.match(resultBlock, /openHitHistory\(session, \{ back: \(\) => openSessionResult\(session\.id\) \}\)/);
assert.match(hitResetPrompt, /openHitHistory\(session, \{ back: \(\) => openHitResetPrompt\(session\) \}\)/);
assert.match(hitHistoryBlock, /openModal\("大当たり履歴"/);
assert.match(hitHistoryBlock, /data-edit-hit="\$\{row\.index\}"/);
assert.match(hitHistoryBlock, /data-delete-hit="\$\{row\.index\}"/);
// 削除は二段確認
assert.match(hitHistoryBlock, /if \(!confirm\("この当選を削除しますか？"\)\) return;\s*if \(!confirm\("元に戻せません。削除を確定しますか？"\)\) return;/);
// 修正できるのは R種別・当選カウンター・累計獲得出玉の3項目
assert.match(hitHistoryBlock, /id="editHitRoundType"/);
assert.match(hitHistoryBlock, /id="editHitSpin"/);
assert.match(hitHistoryBlock, /id="editHitActualBalls"/);
// S8/§1-1: 累計出玉の修正は同じ連チャン内の差分方式で今回分を出し直す
assert.match(hitHistoryBlock, /actualBallsFromCumulativeInput\(session, byId\("editHitActualBalls"\)\.value, index\)/);
assert.match(hitHistoryBlock, /chainActualBallsBefore\(session, index \+ 1, chainSegmentIdForHit\(session, index\)\)/);
// 削除・修正のあとは合計を作り直す
assert.match(hitHistoryBlock, /function applyHitTotals\(session\)[\s\S]*?session\.hitCount = 0;\s*session\.totalRounds = 0;/);
assert.match(hitHistoryBlock, /removeHitRecord\(session, index\)/);

// §G: 転記用コピーはタップ下限44px
assert.match(html, /\.transfer-summary button\[data-copy-transfer\] \{\s*min-height: 44px;/);

// B-1: 区間ごとのグルーピングと累計獲得出玉の積み上げ
const hitHistoryContext = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  numberText(value, fallback = '未入力') {
    const n = hitHistoryContext.normalizeNumber(value);
    return n === null ? fallback : n.toLocaleString('ja-JP');
  },
  sessionSegments(session) {
    return session.segments;
  }
});
new vm.Script(`
  ${holdCarryBlock}
  ${hitHistoryBlock}
  const session = {
    segments: [
      { id: 'seg_a', kind: 'normal', startSpin: 0 },
      { id: 'seg_b', kind: 'normal', startSpin: 50 }
    ],
    hits: [
      { roundTypeId: 'r4', hitSpin: 20, actualBalls: 1380, segmentId: 'seg_a' },
      { roundTypeId: 'r4', hitSpin: 20, actualBalls: 520, segmentId: 'seg_a' },
      { roundTypeId: 'r4', hitSpin: 145, actualBalls: 900, segmentId: 'seg_b' },
      { roundTypeId: 'r6', hitSpin: 145, actualBalls: 600, segmentId: 'seg_b' }
    ]
  };
  globalThis.groups = hitHistoryGroups(session);
  globalThis.labels = segmentHistoryLabels(session).map((entry) => entry.label);
  // segmentId を持たない旧データは当選カウンターで寄せる
  globalThis.legacySegmentId = resolveHitSegmentId(session, { hitSpin: 120 });
  globalThis.noBallsRows = hitHistoryRows({ segments: session.segments, hits: [{ roundTypeId: 'r4', hitSpin: 20, segmentId: 'seg_a' }] });
`).runInContext(hitHistoryContext);
assert.deepEqual(JSON.parse(JSON.stringify(hitHistoryContext.labels)), ['区間①（打ち始めから）', '区間②（時短抜け50から）']);
// 新しい区間が上
assert.deepEqual(JSON.parse(JSON.stringify(hitHistoryContext.groups.map((group) => group.label))), ['区間②（時短抜け50から）', '区間①（打ち始めから）']);
assert.deepEqual(JSON.parse(JSON.stringify(hitHistoryContext.groups.map((group) => group.rows.map((row) => row.number)))), [[3, 4], [1, 2]]);
// S8/§1-1: 累計出玉は連チャン（区間）ごとに古い順で積み上げる。区間が変われば0から積み直す
assert.deepEqual(JSON.parse(JSON.stringify(hitHistoryContext.groups[1].rows.map((row) => row.cumulativeBalls))), [1380, 1900]);
assert.deepEqual(JSON.parse(JSON.stringify(hitHistoryContext.groups[0].rows.map((row) => row.cumulativeBalls))), [900, 1500]);
assert.equal(hitHistoryContext.legacySegmentId, 'seg_b');
assert.equal(hitHistoryContext.noBallsRows[0].cumulativeBalls, null);

// --- S5: 入力の即反映化と未保存警告 -------------------------------------------------
const openModalBlock = section('function openModal', 'function closeModal');
const closeModalBlock = section('function closeModal', 'function findSession');
const bindMorningCheckModal = section('function bindMorningCheckModal', 'function saveMorningCurrent');
const commitMorningCurrent = section('function commitMorningCurrent', 'function chooseMorningDirection');
const mapEditorCloseGuard = section('function mapIslandsSignature', 'function mapManagementHtml');
const renderMapEditorBlock = section('function renderMapEditor', 'function mapIslandsSignature');
const persistQuietToast = section('function persistWithQuietToast', 'function automaticLabelsForDate');
const ballsPerRoundHelpers = section('function sessionBallsPerRound', 'function openHitResetPrompt');

// S5/§0: 閉じる前の関門。false を返したら閉じない
assert.match(closeModalBlock, /if \(modalGuard && modalGuard\(\) === false\) return;/);
assert.match(openModalBlock, /modalGuard = null;/);

// S5/§1: 保存トーストは連続保存でも最後の1回にまとめる
assert.match(persistQuietToast, /clearTimeout\(persistWithQuietToast\.timer\);/);
assert.match(persistQuietToast, /persistWithQuietToast\.timer = setTimeout\(\(\) => showToast\(successMessage\), 400\);/);
// 入力途中の空文字を拾わないよう、保存は change（フォーカスが外れた時）に限る
assert.doesNotMatch(openMachineDetail, /byId\("(machineModel|roundBalls)"\)\.addEventListener\("input"/);

// S5/§2: 閉店チェックは入力が残ったまま閉じようとしたら確認する
assert.match(renderClosingInputModal, /modalGuard = \(\) => \{\s*if \(!closingInputFlow\?\.buffer\) return true;\s*openClosingDiscardConfirm\(\);\s*return false;\s*\};/);
assert.match(renderClosingInputModal, /id="closingSaveCloseBtn">保存して閉じる/);
assert.match(renderClosingInputModal, /id="closingDiscardCloseBtn">破棄して閉じる/);
assert.match(renderClosingInputModal, /id="closingCancelCloseBtn">キャンセル/);
assert.match(renderClosingInputModal, /byId\("closingCancelCloseBtn"\)\.addEventListener\("click", \(\) => \{\s*modalCancel = null;\s*renderClosingInputModal\(\);\s*\}\);/);

// S5/§2: 朝イチチェックは選択した時点で保存する。保存して閉じるは置かない
assert.doesNotMatch(html, /saveMorningCloseBtn/);
assert.doesNotMatch(html, /function saveMorningAndClose/);
assert.match(renderMorningCheckModal, /id="closeMorningBtn">閉じる/);
assert.match(renderMorningCheckModal, /id="morningSavedSummary"/);
assert.match(bindMorningCheckModal, /commitMorningCurrent\(\);/);
assert.match(bindMorningCheckModal, /invalidInput\.addEventListener\("change", commitMorningCurrent\);/);
assert.match(commitMorningCurrent, /if \(!saveMorningCurrent\(\)\) return;/);
assert.match(commitMorningCurrent, /savedLine\.textContent = summary \? `保存済み: \$\{summary\}` : "未登録";/);

// S5/§3: マップ編集は明示保存のまま。未保存の変更があるまま閉じようとしたら確認する
assert.match(renderMapEditorBlock, /byId\("toggleMapEditorBtn"\)\.addEventListener\("click", \(\) => requestCloseMapEditor\(store\.id\)\);/);
assert.match(renderMapEditorBlock, /id="saveMapBottomBtn">保存/);
assert.match(html, /byId\("saveMapBtn"\)\.addEventListener\("click", saveCurrentMap\);/);
assert.match(mapEditorCloseGuard, /if \(!mapEditorHasUnsavedChanges\(storeId\)\) \{\s*closeMapEditor\(storeId\);\s*return;\s*\}/);
assert.match(mapEditorCloseGuard, /mapIslandsSignature\(currentMapDraftIslands\(\)\) !== mapIslandsSignature\(map\.islands \|\| \[\]\)/);
assert.match(mapEditorCloseGuard, /id="mapSaveCloseBtn">保存して閉じる/);
assert.match(mapEditorCloseGuard, /id="mapDiscardCloseBtn">破棄して閉じる/);
assert.match(mapEditorCloseGuard, /id="mapCancelCloseBtn">キャンセル/);
// 破棄は保存済みレイアウトへ戻す
assert.match(mapEditorCloseGuard, /mapDraft = \{ storeId, mapId: map\.id, islands: cloneIslands\(map\.islands \|\| \[\]\), allowEmptySave: false \};/);
// 保存が中断されたら閉じない
assert.match(mapEditorCloseGuard, /saveCurrentMap\(\);\s*closeModal\(\);\s*if \(mapEditorHasUnsavedChanges\(storeId\)\) return;\s*closeMapEditor\(storeId\);/);

const mapEditorGuardContext = vm.createContext({
  mapEditorOpenByStore: { st1: true },
  mapDraft: { storeId: 'st1', mapId: 'map1', islands: [], allowEmptySave: false },
  els: { islandBuilder: { querySelector: () => null } },
  readIslandDraftFromDom() {
    return [];
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  presetById() {
    return null;
  },
  activeMap() {
    return mapEditorGuardContext.__map;
  },
  __map: { id: 'map1', islands: [{ name: '1島', left: { from: 1, to: 4 }, right: null, gaps: { left: [], right: [] }, excluded: [] }] }
});
new vm.Script(`
  ${section('function cloneIslands', 'function normalizeIsland')}
  ${normalizeIsland}
  ${mapEditorCloseGuard}
  globalThis.dirtyWhenDraftEmpty = mapEditorHasUnsavedChanges('st1');
  mapDraft.islands = [{ name: '1島', left: { from: 1, to: 4 }, right: null, gaps: { left: [], right: [] }, excluded: [] }];
  globalThis.cleanWhenSame = mapEditorHasUnsavedChanges('st1');
  mapDraft.islands = [{ name: '1島', left: { from: 1, to: 6 }, right: null, gaps: { left: [], right: [] }, excluded: [] }];
  globalThis.dirtyWhenRangeChanged = mapEditorHasUnsavedChanges('st1');
  mapEditorOpenByStore.st1 = false;
  globalThis.cleanWhenClosed = mapEditorHasUnsavedChanges('st1');
`).runInContext(mapEditorGuardContext);
assert.equal(mapEditorGuardContext.dirtyWhenDraftEmpty, true);
assert.equal(mapEditorGuardContext.cleanWhenSame, false);
assert.equal(mapEditorGuardContext.dirtyWhenRangeChanged, true);
assert.equal(mapEditorGuardContext.cleanWhenClosed, false);

// S5/§4: 戦果報告はR数ベース出玉を出さず、実測の1R当たり玉数を出す
assert.doesNotMatch(html, /R数ベース出玉/);
assert.doesNotMatch(openRateSummary, /roundBasedPayout/);
assert.match(openRateSummary, /<span>1R当たり<\/span><strong>\$\{escapeHtml\(ballsPerRoundText\(sessionBallsPerRound\(session, normalizeMachinePresetId\(machine\)\)\)\)\}<\/strong>/);
assert.match(runEndWizardBlock, /hint: "実測の獲得出玉と合わせて1R当たりの玉数を計算します。"/);

const ballsPerRoundContext = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  presetById(id) {
    return { single: { roundTypes: [{ id: 'r10', label: '10R' }] } }[id] || null;
  },
  roundTypeById(presetId, roundTypeId) {
    return ballsPerRoundContext.presetById(presetId)?.roundTypes.find((type) => type.id === roundTypeId) || null;
  },
  nowIso() {
    return '2026-09-03T00:00:00.000Z';
  }
});
new vm.Script(`
  ${normalizeHitsBlock}
  ${roundCountFromRoundTypeBlock}
  ${roundBreakdownBlock}
  ${sessionActualBallsTotalBlock}
  ${ballsPerRoundHelpers}
  globalThis.withActual = ballsPerRoundText(sessionBallsPerRound({ hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r10', actualBalls: 1420 }] }, 'single'));
  // B90: ヤメ時の累計入力だけでも 1R当たりを出す（当選ごとの実測は未入力）
  globalThis.withSessionTotal = ballsPerRoundText(sessionBallsPerRound({ sessionActualBalls: 2800, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }] }, 'single'));
  // S8/§1-2: 両方あれば当選ごとの今回分の合計を採る（2,380玉 ÷ 20R）
  globalThis.withBoth = ballsPerRoundText(sessionBallsPerRound({ sessionActualBalls: 2800, hits: [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r10', actualBalls: 1000 }] }, 'single'));
  // 当選履歴が無ければヤメ入力の合計R数を使う
  globalThis.withManualRounds = ballsPerRoundText(sessionBallsPerRound({ sessionActualBalls: 2800, totalRounds: 20, hits: [] }, 'single'));
  // 当選履歴があれば手入力の合計R数より優先する
  globalThis.hitsBeatManualRounds = ballsPerRoundText(sessionBallsPerRound({ sessionActualBalls: 2800, totalRounds: 99, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }] }, 'single'));
  globalThis.withoutActual = ballsPerRoundText(sessionBallsPerRound({ totalRounds: 20, hits: [] }, 'single'));
  globalThis.withZeroRounds = ballsPerRoundText(sessionBallsPerRound({ sessionActualBalls: 2800, totalRounds: 0, hits: [] }, 'single'));
  globalThis.withoutRounds = ballsPerRoundText(sessionBallsPerRound({ sessionActualBalls: 2800, hits: [] }, 'single'));
  // 合計Rの解決は totalRoundsForSession と同じ1本を使う
  globalThis.roundsFromHits = totalRoundsForPreset({ totalRounds: 99, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }] }, 'single');
  globalThis.roundsFromManual = totalRoundsForPreset({ totalRounds: 20, hits: [] }, 'single');
  globalThis.roundsFromNothing = totalRoundsForPreset({ hits: [] }, 'single');
`).runInContext(ballsPerRoundContext);
assert.equal(ballsPerRoundContext.withActual, '140玉');
assert.equal(ballsPerRoundContext.withSessionTotal, '140玉');
assert.equal(ballsPerRoundContext.withBoth, '119玉');
assert.equal(ballsPerRoundContext.withManualRounds, '140玉');
assert.equal(ballsPerRoundContext.hitsBeatManualRounds, '140玉');
assert.equal(ballsPerRoundContext.withoutActual, '—');
assert.equal(ballsPerRoundContext.withZeroRounds, '—');
assert.equal(ballsPerRoundContext.withoutRounds, '—');
assert.equal(ballsPerRoundContext.roundsFromHits, 20);
assert.equal(ballsPerRoundContext.roundsFromManual, 20);
assert.equal(ballsPerRoundContext.roundsFromNothing, 0);
// 合計Rの解決は totalRoundsForPreset の1本だけ
assert.match(roundCountFromRoundTypeBlock, /function totalRoundsForSession\(session, machine\) \{\s*return totalRoundsForPreset\(session, normalizeMachinePresetId\(machine\)\);\s*\}/);

// 合計R数の保存も同じ定義（R種別のR数の合計）。玉数 ÷ 1R玉数の逆算はしない
const syncSessionHitTotalsBlock = section('function syncSessionHitTotals', 'function hitRoundBasedPayout');
assert.match(syncSessionHitTotalsBlock, /const rounds = totalRoundsForPreset\(session, normalizeMachinePresetId\(machine\)\);/);
assert.match(syncSessionHitTotalsBlock, /if \(rounds > 0\) session\.totalRounds = rounds;/);
assert.doesNotMatch(syncSessionHitTotalsBlock, /roundBalls/);
assert.doesNotMatch(syncSessionHitTotalsBlock, /hitRoundBasedPayout\(/);

const syncHitTotalsContext = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  presetById(id) {
    // balls ÷ roundBalls が R数と一致しない機種（1R玉数140・10R=1200玉）
    return { odd: { roundTypes: [{ id: 'r10', label: '10R', balls: 1200 }] } }[id] || null;
  },
  presetByName() {
    return null;
  },
  roundTypeById(presetId, roundTypeId) {
    return syncHitTotalsContext.presetById(presetId)?.roundTypes.find((type) => type.id === roundTypeId) || null;
  },
  nowIso() {
    return '2026-09-03T00:00:00.000Z';
  }
});
new vm.Script(`
  ${normalizeHitsBlock}
  ${roundCountFromRoundTypeBlock}
  ${section('function normalizeMachinePresetId', 'function machineHasYutime')}
  ${syncSessionHitTotalsBlock}
  const machines = [{ id: 'm1', presetId: 'odd', roundBalls: 140 }];
  globalThis.synced = { id: 's1', machineId: 'm1', hitCount: null, totalRounds: null, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r10' }] };
  syncSessionHitTotals(globalThis.synced, machines);
  // R種別が解決できないときは手入力の合計R数を残す
  globalThis.unresolved = { id: 's2', machineId: 'm1', hitCount: null, totalRounds: 12, hits: [{ roundTypeId: 'unknown' }] };
  syncSessionHitTotals(globalThis.unresolved, machines);
  globalThis.noHits = { id: 's3', machineId: 'm1', hitCount: 3, totalRounds: 30, hits: [] };
  syncSessionHitTotals(globalThis.noHits, machines);
`).runInContext(syncHitTotalsContext);
// 10R×2 → 20（玉数逆算なら 1200×2÷140 = 17 になっていた）
assert.equal(syncHitTotalsContext.synced.totalRounds, 20);
assert.equal(syncHitTotalsContext.synced.hitCount, 2);
assert.equal(syncHitTotalsContext.unresolved.totalRounds, 12);
assert.equal(syncHitTotalsContext.noHits.totalRounds, 30);
assert.equal(syncHitTotalsContext.noHits.hitCount, 3);

// --- S8: 獲得出玉の累計を連チャン単位にする ---------------------------------
// 連チャン＝同じ区間に紐づく当たり群。カウンターは時短が終わると0に戻る。
const s8Context = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  numberText(value, fallback = '未入力') {
    const n = s8Context.normalizeNumber(value);
    return n === null ? fallback : n.toLocaleString('ja-JP');
  },
  presetById(id) {
    return { multi: { roundTypes: [{ id: 'r4', label: '4R' }, { id: 'r6', label: '6R' }, { id: 'r10', label: '10R' }] } }[id] || null;
  },
  roundTypeById(presetId, roundTypeId) {
    return s8Context.presetById(presetId)?.roundTypes.find((type) => type.id === roundTypeId) || null;
  },
  sessionSegments(session) {
    return Array.isArray(session?.segments) ? session.segments : [];
  },
  ensureSessionSegments(session) {
    return s8Context.sessionSegments(session);
  },
  openSegmentOf(session) {
    return s8Context.sessionSegments(session).at(-1) || null;
  },
  nowIso() {
    return '2026-09-04T00:00:00.000Z';
  }
});
new vm.Script(`
  ${normalizeHitsBlock}
  ${roundCountFromRoundTypeBlock}
  ${holdCarryBlock}
  ${hitResetPrompt}
  ${ballsPerRoundHelpers}
`).runInContext(s8Context);

// §2 の検算セッション。連チャン①（4R→6R）→ 時短抜け → 連チャン②（4R→4R）
const s8Session = {
  segments: [{ id: 'chain1', kind: 'normal', startSpin: 0 }, { id: 'chain2', kind: 'normal', startSpin: 200 }],
  hits: [
    { roundTypeId: 'r4', segmentId: 'chain1', actualBalls: 1380 },
    { roundTypeId: 'r6', segmentId: 'chain1', actualBalls: 1420 },
    { roundTypeId: 'r4', segmentId: 'chain2', actualBalls: 1380 },
    { roundTypeId: 'r4', segmentId: 'chain2', actualBalls: 1220 }
  ]
};
s8Context.__session = s8Session;
// セッション合計5,400玉・合計18R → 1R当たり300玉
assert.equal(vm.runInContext('sessionActualBallsTotal(__session)', s8Context), 5400);
assert.equal(vm.runInContext('totalRoundsForPreset(__session, "multi")', s8Context), 18);
assert.equal(vm.runInContext('ballsPerRoundText(sessionBallsPerRound(__session, "multi"))', s8Context), '300玉');
// 連チャンごとの累計。#3 は連チャンが変わるので0から積み直す
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 0)', s8Context), 0);
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 1)', s8Context), 1380);
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 2)', s8Context), 0);
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 3)', s8Context), 1380);
// 大当たり履歴からの修正も同じ連チャン内で差分を出し直す（#4 の入力欄は 2,600 が初期値）
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 4, chainSegmentIdForHit(__session, 3))', s8Context), 2600);
assert.deepEqual(
  JSON.parse(JSON.stringify(vm.runInContext('actualBallsFromCumulativeInput(__session, "2400", 3)', s8Context))),
  { actualBalls: 1020, warning: false }
);
// 同じ連チャン内で下回れば警告・今回分0
assert.deepEqual(
  JSON.parse(JSON.stringify(vm.runInContext('actualBallsFromCumulativeInput(__session, "1000", 3)', s8Context))),
  { actualBalls: 0, warning: true }
);
// 前の連チャンの合計（2,800玉）とは比べない
assert.deepEqual(
  JSON.parse(JSON.stringify(vm.runInContext('actualBallsFromCumulativeInput(__session, "1380", 2)', s8Context))),
  { actualBalls: 1380, warning: false }
);
// 履歴一覧の累計表示も連チャンごと
assert.deepEqual(
  JSON.parse(JSON.stringify(vm.runInContext('hitHistoryRows(__session).map((row) => row.cumulativeBalls)', s8Context))),
  [1380, 2800, 1380, 2600]
);

// 遊タイム経由の当選も、その区間の当たり群として扱う
const s8YutimeSession = {
  segments: [
    { id: 'seg_normal', kind: 'normal', startSpin: 0 },
    { id: 'seg_yutime', kind: 'yutime', startSpin: 250 },
    { id: 'seg_after', kind: 'normal', startSpin: 400 }
  ],
  hits: [
    { roundTypeId: 'r4', segmentId: 'seg_normal', actualBalls: 1380 },
    { roundTypeId: 'r10', segmentId: 'seg_yutime', actualBalls: 1500 },
    { roundTypeId: 'r10', segmentId: 'seg_yutime', actualBalls: 1400 }
  ]
};
s8Context.__session = s8YutimeSession;
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 1)', s8Context), 0);
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 2)', s8Context), 1500);
assert.equal(vm.runInContext('sessionActualBallsTotal(__session)', s8Context), 4280);

// 区間を持たない旧データは当選カウンターで寄せる。連チャン単位でも同じ切り出しになる
const s8LegacySegmentless = {
  segments: [{ id: 'seg_a', kind: 'normal', startSpin: 0 }, { id: 'seg_b', kind: 'normal', startSpin: 100 }],
  hits: [
    { roundTypeId: 'r4', hitSpin: 40, actualBalls: 1380 },
    { roundTypeId: 'r4', hitSpin: 150, actualBalls: 900 }
  ]
};
s8Context.__session = s8LegacySegmentless;
assert.equal(vm.runInContext('chainActualBallsBefore(__session, 1)', s8Context), 0);

// §5 回帰: 既存データの実測出玉合計と1R平均は変わらない
// (a) 当選ごとの記録があるセッション。sessionActualBalls の有無で値が動かない
const s8LegacyPerHit = {
  segments: [{ id: 'seg_a', kind: 'normal', startSpin: 0 }],
  hits: [
    { roundTypeId: 'r10', segmentId: 'seg_a', actualBalls: 1380 },
    { roundTypeId: 'r4', segmentId: 'seg_a', actualBalls: 600 }
  ]
};
s8Context.__session = s8LegacyPerHit;
assert.equal(vm.runInContext('sessionActualBallsTotal(__session)', s8Context), 1980);
assert.equal(vm.runInContext('ballsPerRoundText(sessionBallsPerRound(__session, "multi"))', s8Context), '141玉');
s8Context.__session = { ...s8LegacyPerHit, sessionActualBalls: 1980 };
assert.equal(vm.runInContext('sessionActualBallsTotal(__session)', s8Context), 1980);
assert.equal(vm.runInContext('ballsPerRoundText(sessionBallsPerRound(__session, "multi"))', s8Context), '141玉');
// (b) 当選ごとの記録が無い旧データは sessionActualBalls をフォールバックに使う
s8Context.__session = { segments: [], hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }], sessionActualBalls: 2800 };
assert.equal(vm.runInContext('sessionActualBallsTotal(__session)', s8Context), 2800);
assert.equal(vm.runInContext('ballsPerRoundText(sessionBallsPerRound(__session, "multi"))', s8Context), '200玉');
// (c) 実測がまったく無ければ理論値では代用しない
s8Context.__session = { segments: [], hits: [{ roundTypeId: 'r10' }] };
assert.equal(vm.runInContext('sessionActualBallsTotal(__session)', s8Context), null);
assert.equal(vm.runInContext('ballsPerRoundText(sessionBallsPerRound(__session, "multi"))', s8Context), '—');


// --- S9: 1R実質出玉の可視化・実測平均化 -------------------------------------
const netBallsTextBlock = section('function netBallsText', 'function expectationSettings');
const expectationSettingsBlock = section('function expectationSettings', 'function expectationRate');
const renderMachineExpectationBlock = section('function renderMachineExpectation', 'function expectationPreviousSpinState');
const expectationPanelPresetsBlock = section('function expectationPanelPresets', 'function applyPresetSelectionToForm');

// S9/§1-1: 手入力欄は回転率の手入力の直後に置く
assert.match(openMachineDetail, /<label for="evManualRate">回転率（手入力）<\/label>[\s\S]{0,200}?<label for="evManualNetBalls">1R実質出玉（手入力）<\/label>/);
assert.match(openMachineDetail, /id="evManualNetBalls" inputmode="decimal" placeholder="\$\{escapeHtml\(netBallsUsedText\(netBallsInfo\)\)\}"/);
// S9/§1-3: 台詳細の参考1R出玉は参考回転率の隣。出典・サンプル数付き
assert.match(openMachineDetail, /<span>参考回転率<\/span>[\s\S]{0,260}?<span>参考1R出玉<\/span>/);
assert.match(openMachineDetail, /const netBallsInfo = netBallsPerWinInfo\(presetId, machine\);/);
// 手入力欄は他の入力欄と同じく即再計算する
assert.match(openMachineDetail, /"evManualRate", "evManualNetBalls"/);
// S9/§1-1: 空欄なら自動決定。手入力は判定と打ち始めの記録の両方へ渡す
assert.match(renderMachineExpectationBlock, /manualNetBallsPerWin: byId\("evManualNetBalls"\)\?\.value,/);
assert.match(expectationPanelPresetsBlock, /manualNetBallsPerWin: normalizeNumber\(byId\("evManualNetBalls"\)\?\.value\),/);
assert.match(calculateStartEvSnapshot, /manualNetBallsPerWin: presets\.manualNetBallsPerWin,/);
// S9/§1-4: 根拠行は 使用回転率 → 使用1R実質出玉 の順
assert.match(renderMachineExpectationBlock, /使用回転率 \$\{expectation\.result\.rotationRate\.toFixed\(1\)\}（\$\{expectation\.rateSource\}） \/ \$\{expectation\.netBallsSource\}/);

const netBallsTextContext = vm.createContext({
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
});
new vm.Script(`
  ${netBallsTextBlock}
  globalThis.text = netBallsText;
  globalThis.sourceText = netBallsSourceText;
  globalThis.usedText = netBallsUsedText;
`).runInContext(netBallsTextContext);
// 小数は桁を落とさない。整数はそのまま、4桁以上は区切る
assert.equal(netBallsTextContext.text(587.5), '587.5玉');
assert.equal(netBallsTextContext.text(1400), '1,400玉');
assert.equal(netBallsTextContext.text(1133.3333333333333), '1,133.3玉');
assert.equal(netBallsTextContext.text(null), '-');
// S10/§1-1: 実測平均のサンプル数は合計R数。件数と読めないよう「◯R分」で出す
assert.equal(netBallsTextContext.sourceText({ source: '実測平均', count: 14, countUnit: 'rounds' }), '実測平均・14R分');
assert.equal(netBallsTextContext.sourceText({ source: '実測平均', count: 1200, countUnit: 'rounds' }), '実測平均・1,200R分');
assert.equal(netBallsTextContext.sourceText({ source: 'ラウンド集計', count: 2 }), 'ラウンド集計・n=2');
assert.equal(netBallsTextContext.sourceText({ source: '手入力', count: null }), '手入力');
assert.equal(netBallsTextContext.sourceText({ source: '理論値', count: 0 }), '理論値');
assert.equal(netBallsTextContext.usedText({ value: 100, source: '実測平均', count: 8, countUnit: 'rounds' }), '100玉（実測平均・8R分）');
assert.equal(netBallsTextContext.usedText({ value: 587.5, source: '理論値', count: 0 }), '587.5玉（理論値）');

// S9/§1-2: 採用順位。パネルの手入力 → プリセットの手入力 → 実測平均 → ラウンド集計 → 理論値
const s9PayoutContext = vm.createContext({
  MACHINE_PRESETS: [{ id: 'umi-sp5', roundTypes: [{ id: 'r10', label: '10R', balls: 1080 }, { id: 'r4', label: '4R', balls: 880 }], defaults: { netBallsPerWin: 140 } }],
  DEFAULT_NET_BALLS_PER_ROUND: 140,
  data: { presetSettings: {}, sessions: [], machines: [{ id: 'm1', presetId: 'umi-sp5' }] },
  normalizeHits(hits) {
    return Array.isArray(hits) ? hits : [];
  },
  roundTypeById(presetId, roundTypeId) {
    return s9PayoutContext.presetById(presetId)?.roundTypes.find((type) => type.id === roundTypeId) || null;
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  positiveNumberOrDefault(value, fallback) {
    const n = s9PayoutContext.normalizeNumber(value);
    return n !== null && n > 0 ? n : fallback;
  },
  presetById(id) {
    return s9PayoutContext.MACHINE_PRESETS.find((preset) => preset.id === id) || null;
  },
  normalizeMachinePresetId(machine) {
    return machine?.presetId || '';
  },
  filteredSessions() {
    return s9PayoutContext.data.sessions;
  },
  nowIso() {
    return '2026-09-04T00:00:00.000Z';
  }
});
new vm.Script(`
  ${roundCountFromRoundTypeBlock}
  ${presetSettingsHelpers}
  globalThis.info = (settings, sessions, manual) => {
    data.presetSettings = { "umi-sp5": settings };
    data.sessions = sessions;
    return netBallsPerWinInfo("umi-sp5", data.machines[0], manual);
  };
`).runInContext(s9PayoutContext);
const s9Hits2 = [{ roundTypeId: 'r10', actualBalls: 1380 }, { roundTypeId: 'r4', actualBalls: 600 }];
// パネルの手入力はプリセットの手入力より優先する
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWin: 1500, netBallsPerWinManual: true }, [{ machineId: 'm1', hits: s9Hits2 }], '105')), JSON.stringify({ value: 105, source: '手入力', count: null }));
// 空欄・0・非数値は手入力とみなさず自動決定へ落ちる（S10で分母は合計R数＝14R）
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: s9Hits2 }], '')), JSON.stringify({ value: 1980 / 14, source: '実測平均', count: 14, countUnit: 'rounds' }));
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: s9Hits2 }], '0')), JSON.stringify({ value: 1980 / 14, source: '実測平均', count: 14, countUnit: 'rounds' }));
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', hits: [] }], null)), JSON.stringify({ value: 140, source: '理論値', count: 0 }));
// S9/§1-2: 実測平均は当選ごとの「今回分」（S8）が出典。ヤメ入力の累計は当選ごとが無いときだけ
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', sessionActualBalls: 2800, hits: s9Hits2 }])), JSON.stringify({ value: 1980 / 14, source: '実測平均', count: 14, countUnit: 'rounds' }));
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWinManual: false }, [{ machineId: 'm1', sessionActualBalls: 2400, hits: [{ roundTypeId: 'r10' }, { roundTypeId: 'r4' }] }])), JSON.stringify({ value: 2400 / 14, source: '実測平均', count: 14, countUnit: 'rounds' }));
// S9/§2 + S10/§1-1: 連チャンをまたぐセッションは 今回分の合計 ÷ 合計R数（5,400玉 ÷ 16R = 337.5玉）
assert.equal(JSON.stringify(s9PayoutContext.info({ netBallsPerWinManual: false }, [{
  machineId: 'm1',
  hits: [
    { roundTypeId: 'r4', segmentId: 'chain1', actualBalls: 1380 },
    { roundTypeId: 'r4', segmentId: 'chain1', actualBalls: 1420 },
    { roundTypeId: 'r4', segmentId: 'chain2', actualBalls: 1380 },
    { roundTypeId: 'r4', segmentId: 'chain2', actualBalls: 1220 }
  ]
}])), JSON.stringify({ value: 337.5, source: '実測平均', count: 16, countUnit: 'rounds' }));

// S9/§1-4: expectationSettings が使用値と出典をまとめて返す
const s9SettingsContext = vm.createContext({
  YUTIME_EXPECTATION_ENGINE: { preset: { defaults: { netBallsPerWin: 140 } } },
  normalizeNumber: netBallsTextContext.normalizeNumber,
  normalizeMachinePresetId(machine) {
    return machine?.presetId || '';
  },
  presetById(id) {
    return { 'agnes-pe': { id: 'agnes-pe', spec: { modelType: 'st-certain', averageRoundsPerWin: 587.5 / 108 }, defaults: { netBallsPerWin: 108 } } }[id] || null;
  },
  netBallsPerWinInfo(presetId, machine, manualInput) {
    const manual = s9SettingsContext.normalizeNumber(manualInput);
    if (manual !== null && manual > 0) return { value: manual, source: '手入力', count: null };
    return s9SettingsContext.__auto;
  },
  presetJitanBallsPerSpin() {
    return 0;
  },
  presetYutimeBallsPerSpin() {
    return -0.8;
  },
  presetHoldSpins() {
    return 5;
  },
  expectationYenPerBall() {
    return 4;
  },
  __auto: { value: 108, source: '理論値', count: 0 }
});
new vm.Script(`
  ${netBallsTextBlock}
  ${expectationSettingsBlock}
  globalThis.settingsFor = (manual) => expectationSettings({}, { presetId: "agnes-pe" }, manual);
`).runInContext(s9SettingsContext);
assert.equal(s9SettingsContext.settingsFor(null).netBallsSource, '使用1R実質出玉 108玉（理論値）');
assert.equal(s9SettingsContext.settingsFor(null).settings.netBallsPerWin, 108);
assert.equal(s9SettingsContext.settingsFor('105').netBallsSource, '使用1R実質出玉 105玉（手入力）');
assert.equal(s9SettingsContext.settingsFor('105').settings.netBallsPerWin, 105);
s9SettingsContext.__auto = { value: 100, source: '実測平均', count: 8, countUnit: 'rounds' };
assert.equal(s9SettingsContext.settingsFor(null).netBallsSource, '使用1R実質出玉 100玉（実測平均・8R分）');
// 時短・遊タイムの内訳は payoutSource に残す（根拠行の後半）
assert.match(s9SettingsContext.settingsFor(null).payoutSource, /^ST・時短 0玉\/回転、遊タイム -0\.8玉\/回転$/);

// --- S10: 1R実質出玉の実測平均を合計R数ベースに統一 --------------------------
// S10/§1-1: 合計Rの出所は totalRoundsForPreset と同じ roundCountFromRoundType 1本だけ
assert.match(presetSettingsHelpers, /const hitRoundCount = \(hit\) => roundCountFromRoundType\(roundTypeById\(presetId, hit\.roundTypeId\)\);/);
assert.match(presetSettingsHelpers, /return \{ value: actualTotal \/ actualRounds, source: "実測平均", count: actualRounds, countUnit: "rounds" \};/);
assert.doesNotMatch(presetSettingsHelpers, /source: "実測平均", count: actualCount/);

const s10Context = vm.createContext({
  // アグネスPE相当（1R=108玉のR種別）。roundCountFromRoundType はラベルからR数を読む
  MACHINE_PRESETS: [{ id: 'agnes-pe', roundTypes: [{ id: 'r10', label: '10R', balls: 1080 }, { id: 'r6', label: '6R', balls: 648 }, { id: 'r4', label: '4R', balls: 432 }], defaults: { netBallsPerWin: 108 } }],
  DEFAULT_NET_BALLS_PER_ROUND: 140,
  data: { presetSettings: { 'agnes-pe': { netBallsPerWinManual: false } }, sessions: [], machines: [{ id: 'm1', presetId: 'agnes-pe' }] },
  normalizeHits(hits) {
    return Array.isArray(hits) ? hits : [];
  },
  roundTypeById(presetId, roundTypeId) {
    return s10Context.presetById(presetId)?.roundTypes.find((type) => type.id === roundTypeId) || null;
  },
  normalizeNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  },
  positiveNumberOrDefault(value, fallback) {
    const n = s10Context.normalizeNumber(value);
    return n !== null && n > 0 ? n : fallback;
  },
  presetById(id) {
    return s10Context.MACHINE_PRESETS.find((preset) => preset.id === id) || null;
  },
  normalizeMachinePresetId(machine) {
    return machine?.presetId || '';
  },
  filteredSessions() {
    return s10Context.data.sessions;
  },
  nowIso() {
    return '2026-09-04T00:00:00.000Z';
  }
});
new vm.Script(`
  ${roundCountFromRoundTypeBlock}
  ${presetSettingsHelpers}
  ${netBallsTextBlock}
  ${section('function sessionBallsPerRound', 'function openHitResetPrompt')}
  ${sessionActualBallsTotalBlock}
  globalThis.average = (hits) => {
    data.sessions = [{ machineId: "m1", hits }];
    return netBallsPerWinInfo("agnes-pe", data.machines[0]);
  };
  globalThis.perRoundOfSession = (hits) => sessionBallsPerRound({ hits }, "agnes-pe");
  globalThis.usedText = netBallsUsedText;
`).runInContext(s10Context);

// §2-1: 6R・540玉 → 540 ÷ 6 = 90玉
assert.equal(JSON.stringify(s10Context.average([{ roundTypeId: 'r6', actualBalls: 540 }])), JSON.stringify({ value: 90, source: '実測平均', count: 6, countUnit: 'rounds' }));
// §2-2: 10R・1,300玉 ＋ 4R・420玉 → 1,720 ÷ 14 ≒ 123玉
const s10Case2 = s10Context.average([{ roundTypeId: 'r10', actualBalls: 1300 }, { roundTypeId: 'r4', actualBalls: 420 }]);
assert.equal(s10Case2.value, 1720 / 14);
assert.equal(Math.round(s10Case2.value), 123);
assert.equal(s10Case2.count, 14);
assert.equal(s10Case2.countUnit, 'rounds');
// §2-3: 出玉未入力の10Rは分子・分母とも除外 → 420 ÷ 4 = 105玉
assert.equal(JSON.stringify(s10Context.average([{ roundTypeId: 'r10' }, { roundTypeId: 'r4', actualBalls: 420 }])), JSON.stringify({ value: 105, source: '実測平均', count: 4, countUnit: 'rounds' }));
// §2-4: 当選1回・10R・1,300玉 → 従来は1,300玉（当選件数=1で割っていた）。正しくは130玉
assert.equal(JSON.stringify(s10Context.average([{ roundTypeId: 'r10', actualBalls: 1300 }])), JSON.stringify({ value: 130, source: '実測平均', count: 10, countUnit: 'rounds' }));
// 表示は「◯R分」。当選件数と読み違えないこと
assert.equal(s10Context.usedText(s10Case2), '122.9玉（実測平均・14R分）');

// S10/§1-3: 戦果報告の「1R当たり」と、そのセッションだけを集計したS9実測平均が一致する
const s10SameSession = [
  { roundTypeId: 'r4', segmentId: 'chain1', actualBalls: 1380 },
  { roundTypeId: 'r6', segmentId: 'chain1', actualBalls: 1420 },
  { roundTypeId: 'r4', segmentId: 'chain2', actualBalls: 1380 },
  { roundTypeId: 'r4', segmentId: 'chain2', actualBalls: 1220 }
];
assert.equal(s10Context.perRoundOfSession(s10SameSession), 300);
assert.equal(s10Context.average(s10SameSession).value, 300);
assert.equal(s10Context.average(s10SameSession).count, 18);
// 出玉未入力の当選が混じるときだけ分母の扱いが分かれる（戦果報告は全Rで割る）
const s10Partial = [{ roundTypeId: 'r10' }, { roundTypeId: 'r4', actualBalls: 420 }];
assert.equal(s10Context.perRoundOfSession(s10Partial), 30);
assert.equal(s10Context.average(s10Partial).value, 105);

// --- S11: 1R実質出玉の単位を期待値エンジンとそろえる ------------------------
// エンジンは玉/R を受け、当選あたりの出玉は 玉/R × 平均R数 で出す。
const s11Engine = vm.createContext({});
new vm.Script(`
  const DEFAULT_NET_BALLS_PER_ROUND = 140;
  ${yutimeExpectationEngine}
  globalThis.E = YUTIME_EXPECTATION_ENGINE;
  globalThis.ev = (presetId, counterSpin, rate, netBallsPerRound, exchangeBalls, availableBalls, overrides) => {
    const p = E.presets[presetId];
    const offset = Number(p.spec.counterOffset) || 0;
    const settings = Object.assign({}, p.defaults, { presetId, netBallsPerWin: netBallsPerRound, yenPerBall: 100 / exchangeBalls }, overrides || {});
    return E.calculate({ presetId, currentSpin: Math.max(0, counterSpin - offset), rotationRate: rate, availableBalls }, settings);
  };
`).runInContext(s11Engine);
// S18: アグネスPEの既定は記事v5と同じ実戦基準の100玉/R。公称払い出し（648÷6＝108）ではない。
// averageRoundsPerWin は当選あたりの平均R数（R構成の重み）なので 587.5/108 のまま動かさない。
assert.equal(s11Engine.E.presets['agnes-pe'].defaults.netBallsPerWin, 100);
assert.ok(Math.abs(s11Engine.E.presets['agnes-pe'].spec.averageRoundsPerWin - 587.5 / 108) < 1e-12);
// 玉/R × 平均R数 が旧 netBallsPerWin と完全に一致する（代表点が動かない根拠）
assert.equal(s11Engine.E.presets['umi-sp5'].defaults.netBallsPerWin * s11Engine.E.presets['umi-sp5'].spec.averageRoundsPerWin, 1400);
// 受け入れ基準（記事v5・calc・v3で確認済みの代表点）
assert.equal(Math.round(s11Engine.ev('agnes-pe', 150, 17, 100, 25, 0).evYen), 1569);
assert.equal(Math.round(s11Engine.ev('agnes-pe', 0, 17, 105, 25, 0).evYen), 310);
// 大海5SPの代表点は holdSpins で分岐する。どちらも S11 の前後で不変
assert.equal(Math.round(s11Engine.ev('umi-sp5', 434, 17, 140, 28, 0, { holdSpins: 0 }).evYen), -499);
assert.equal(Math.round(s11Engine.ev('umi-sp5', 434, 17, 140, 28, 0).evYen), -231);
// winBalls は 当選回数 × 玉/R × 平均R数（電サポの増減を除く）
const s11Win = s11Engine.ev('agnes-pe', 150, 17, 100, 25, 0, { jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0 });
assert.ok(Math.abs(s11Win.winBalls - s11Win.expectedWins * 100 * (587.5 / 108)) < 1e-9);
// 玉/R を2倍にすれば当選あたりの出玉も2倍になる（単位が線形に効く）
const s11Double = s11Engine.ev('agnes-pe', 150, 17, 200, 25, 0, { jitanNormalBallsPerSpin: 0, jitanFastBallsPerSpin: 0, yutimeBallsPerSpin: 0 });
assert.ok(Math.abs(s11Double.winBalls - s11Win.winBalls * 2) < 1e-9);

// S11: schema 32 の移行。31以前の手入力値は当選あたりなので平均R数で割って玉/Rにする
const s11MigrationContext = vm.createContext({
  ...legacyMachineContext
});
new vm.Script(`
  globalThis.migrated = normalizeData({
    version: 31,
    presetSettings: {
      "umi-sp5": { netBallsPerWin: 1300, netBallsPerWinManual: true },
      "agnes-pe": { netBallsPerWin: 587.5, netBallsPerWinManual: true }
    },
    sessions: []
  });
  globalThis.already32 = normalizeData({
    version: 32,
    presetSettings: {
      "umi-sp5": { netBallsPerWin: 130, netBallsPerWinManual: true },
      "agnes-pe": { netBallsPerWin: 108, netBallsPerWinManual: true }
    },
    sessions: []
  });
`).runInContext(s11MigrationContext);
// 1,300玉/当選 ÷ 10R = 130玉/R、587.5玉/当選 ÷ 5.44R = 108玉/R
assert.equal(s11MigrationContext.migrated.presetSettings['umi-sp5'].netBallsPerWin, 130);
assert.equal(s11MigrationContext.migrated.presetSettings['umi-sp5'].netBallsPerWinManual, true);
assert.equal(s11MigrationContext.migrated.presetSettings['agnes-pe'].netBallsPerWin, 108);
assert.equal(s11MigrationContext.migrated.presetSettings['agnes-pe'].netBallsPerWinManual, true);
assert.equal(s11MigrationContext.migrated.version, 36);
// 32以降のデータは二重変換しない
assert.equal(s11MigrationContext.already32.presetSettings['umi-sp5'].netBallsPerWin, 130);
assert.equal(s11MigrationContext.already32.presetSettings['agnes-pe'].netBallsPerWin, 108);


// ===========================================================================
// S7: 消費玉を起点・終点の実測差で出す ／ 遊タイム関連バグ3件
// ===========================================================================

// --- A-1: 「遊タイム中」の判定を区間モデル基準にする -------------------------
const yutimePhaseBlock = section('function isYutimeInvestmentPhase', 'function currentInvestmentPhase');
assert.match(yutimePhaseBlock, /const segments = Array\.isArray\(session\?\.segments\) \? session\.segments : \[\];/);
assert.match(yutimePhaseBlock, /if \(!segments\.some\(\(segment\) => segment\?\.kind === "yutime"\)\) return legacyYutimeInvestmentPhase\(session\);/);
assert.match(yutimePhaseBlock, /return last\?\.kind === "yutime" && \(last\.endSpin === null \|\| last\.endSpin === undefined\);/);
assert.match(yutimePhaseBlock, /function legacyYutimeInvestmentPhase\(session\) \{\s*return Boolean\(session\?\.yutimeEnterTime \|\| session\?\.yutimeEnterBalls !== null\);/);
// 記録としての yutimeEnterTime / yutimeEnterBalls は残す（判定にだけ使わない）
assert.match(openYutimeEnterForm, /session\.yutimeEnterBalls = enterBalls;/);
assert.match(openYutimeEnterForm, /session\.yutimeEnterTime = currentTime\(\);/);

const s7PhaseContext = vm.createContext({});
new vm.Script(`
  ${yutimePhaseBlock}
  const normalOpen = { id: "n1", kind: "normal", endSpin: null };
  const normalClosed = { id: "n1", kind: "normal", endSpin: 900 };
  const yutimeOpen = { id: "y1", kind: "yutime", endSpin: null };
  const yutimeClosed = { id: "y1", kind: "yutime", endSpin: 980 };
  const normalAfterJitan = { id: "n2", kind: "normal", endSpin: null };
  const enter = { yutimeEnterTime: "12:00", yutimeEnterBalls: 800 };
  globalThis.s7Phase = {
    duringYutime: isYutimeInvestmentPhase({ ...enter, segments: [normalClosed, yutimeOpen] }),
    afterHit: isYutimeInvestmentPhase({ ...enter, segments: [normalClosed, yutimeClosed] }),
    afterJitanExit: isYutimeInvestmentPhase({ ...enter, segments: [normalClosed, yutimeClosed, normalAfterJitan] }),
    normal: isYutimeInvestmentPhase({ yutimeEnterTime: null, yutimeEnterBalls: null, segments: [normalOpen] }),
    legacyNoSegments: isYutimeInvestmentPhase({ ...enter, segments: [] }),
    legacyNoYutimeSegment: isYutimeInvestmentPhase({ ...enter, segments: [normalOpen] }),
    legacyNoSegmentsNoEnter: isYutimeInvestmentPhase({ yutimeEnterTime: null, yutimeEnterBalls: null, segments: [] })
  };
`).runInContext(s7PhaseContext);
// 遊タイム区間が開いている間だけ「遊タイム中」。当選ウィザードで閉じたら通常時に戻る
assert.equal(s7PhaseContext.s7Phase.duringYutime, true);
assert.equal(s7PhaseContext.s7Phase.afterHit, false);
assert.equal(s7PhaseContext.s7Phase.afterJitanExit, false);
assert.equal(s7PhaseContext.s7Phase.normal, false);
// 区間の無い旧データ・遊タイム区間を作れない旧データは従来の判定のまま
assert.equal(s7PhaseContext.s7Phase.legacyNoSegments, true);
assert.equal(s7PhaseContext.s7Phase.legacyNoYutimeSegment, true);
assert.equal(s7PhaseContext.s7Phase.legacyNoSegmentsNoEnter, false);

// --- A-2: 遊タイム突入の持ち玉入力を現在の持ち玉へ反映する --------------------
assert.match(openYutimeEnterForm, /if \(enterBalls !== null\) updateMochidamaBalanceWithUndo\(session, enterBalls\);/);
assert.doesNotMatch(openYutimeEnterForm, /session\.currentMochidama =/);

// --- B-1: consumedModel は打ち始めたセッションだけに付ける -------------------
assert.match(html, /const SCHEMA_VERSION = 36;/);
assert.match(html, /function normalizeConsumedModel\(value\) \{\s*return value === "endpoints" \? "endpoints" : null;/);
assert.match(html, /function usesEndpointConsumedModel\(session\) \{\s*return normalizeConsumedModel\(session\?\.consumedModel\) === "endpoints";/);
assert.match(normalizeData, /consumedModel: normalizeConsumedModel\(session\.consumedModel\)/);
assert.match(startSessionFlow, /session\.consumedModel = "endpoints";/);
assert.match(section('function startSameMachineContinuation', 'function addInvestment'), /next\.consumedModel = "endpoints";/);

const s7SchemaContext = vm.createContext({ ...legacyMachineContext });
new vm.Script(`
  globalThis.s7Migrated = normalizeData({
    version: 33,
    presetSettings: { "umi-sp5": {} },
    sessions: [
      { id: "s_old", storeId: "st_1", machineId: "m_1" },
      { id: "s_new", storeId: "st_1", machineId: "m_1", consumedModel: "endpoints" },
      { id: "s_bad", storeId: "st_1", machineId: "m_1", consumedModel: "taps" }
    ]
  });
`).runInContext(s7SchemaContext);
assert.equal(s7SchemaContext.s7Migrated.version, 36);
// 旧セッションは補完しない（＝従来式のまま）
assert.equal(s7SchemaContext.s7Migrated.sessions[0].consumedModel, null);
assert.equal(s7SchemaContext.s7Migrated.sessions[1].consumedModel, "endpoints");
assert.equal(s7SchemaContext.s7Migrated.sessions[2].consumedModel, null);

// --- B-3: 時短抜けの入力に「そのときの台の持ち玉」を置く ---------------------
assert.match(hitResetPrompt, /<label for="jitanExitStartBalls">そのときの台の持ち玉（実機：台の持ち玉表示）<\/label>/);
assert.match(hitResetPrompt, /id="jitanExitStartBalls" inputmode="numeric" value="\$\{escapeHtml\(jitanExitStartBallsPreset\(session\) \?\? ""\)\}"/);
assert.match(hitResetPrompt, /const startBalls = normalizeNumber\(byId\("jitanExitStartBalls"\)\?\.value\);\s*const shooting = selectedShooting\(\);\s*closeModal\(\);/);
assert.match(hitResetPrompt, /applyJitanExit\(session, value, startBalls, shooting\);/);
assert.match(hitResetPrompt, /function jitanExitStartBallsPreset\(session\) \{[\s\S]*?const chainBalls = chainActualBallsBefore\(session\);\s*return Math\.round\(current \+ \(chainBalls > 0 \? chainBalls : 0\)\);/);
assert.match(hitResetPrompt, /if \(measuredBalls !== null\) updateMochidamaBalanceWithUndo\(session, measuredBalls\);/);
assert.match(hitResetPrompt, /startNormalSegmentAfterJitan\(session, counterSpin, measuredBalls, shooting\);/);
const startNormalSegmentBlock = section('function startNormalSegmentAfterJitan', 'function closeSegmentOnHit');
assert.match(startNormalSegmentBlock, /startTrackedBalls: measuredBalls !== null \? measuredBalls : deriveBalances\(session\)\.mochidama,/);
assert.match(startNormalSegmentBlock, /startBallsSource: measuredBalls !== null \? "measured" : "tracked",/);

const s7JitanPresetContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function deriveBalances(session) { return { mochidama: session.__mochidama }; }
  function chainActualBallsBefore(session) { return session.__chainBalls; }
  ${section('function jitanExitStartBallsPreset', 'function applyJitanExit')}
  globalThis.s7JitanPreset = {
    both: jitanExitStartBallsPreset({ __mochidama: 120, __chainBalls: 1500 }),
    noChain: jitanExitStartBallsPreset({ __mochidama: 120, __chainBalls: 0 }),
    noMochidama: jitanExitStartBallsPreset({ __mochidama: null, __chainBalls: 1500 })
  };
`).runInContext(s7JitanPresetContext);
// 初期値は 現在の持ち玉 ＋ この連チャンの獲得出玉合計。獲得出玉が無ければ現在の持ち玉のまま
assert.equal(s7JitanPresetContext.s7JitanPreset.both, 1620);
assert.equal(s7JitanPresetContext.s7JitanPreset.noChain, 120);
assert.equal(s7JitanPresetContext.s7JitanPreset.noMochidama, null);

// --- B-4: ヤメで終わる区間の終点は終了玉。旧式のセッションには入れない -------
const closeTrailingBlock = section('function closeTrailingSegmentOnEnd', 'function currentSegmentId');
assert.match(closeTrailingBlock, /if \(usesEndpointConsumedModel\(session\)\) target\.endRemainBalls = normalizeNumber\(session\.endTotalBalls\);/);
assert.match(segmentBlock, /if \(usesEndpointConsumedModel\(session\)\) last\.endRemainBalls = normalizeNumber\(session\?\.endTotalBalls\);/);
assert.match(segmentBlock, /if \(usesEndpointConsumedModel\(session\)\) endSegment\.endRemainBalls = normalizeNumber\(session\?\.endTotalBalls\);/);

// --- B-5: 計算式と、新式のときはB89の乖離UIを出さないこと --------------------
assert.match(tapModeConsumedBlock, /function segmentEndpointConsumedBalls\(segment, session, store\)/);
assert.match(tapModeConsumedBlock, /if \(segment\?\.startBallsSource !== "measured"\) return null;/);
assert.match(tapModeConsumedBlock, /return start \+ segmentAddedBalls\(session, segment\.id, store\) - end;/);
assert.match(tapModeConsumedBlock, /\.filter\(\(item\) => item\.segmentId === segmentId && investmentSource\(item\) !== "mochidama"\)/);
assert.match(deriveSession, /const endpointConsumedApplied = normalSegments\.some\(\(segment\) => segmentEndpointConsumedBalls\(segment, session, store\) !== null\);/);
assert.match(deriveSession, /consumedModelApplied: endpointConsumedApplied,/);
assert.match(consumedBallsChoiceHtmlBlock, /if \(derived\?\.consumedModelApplied\) return "";/);
assert.equal(vm.runInContext('consumedBallsChoiceHtml({}, { consumedModelApplied: true, consumedBallsCandidates: { divergent: true, tray: 1000, taps: 2000 }, normalSpins: 100 })', consumedBallsUiContext), "");

// --- B-6: 検算6件 -----------------------------------------------------------
new vm.Script(`
  const s7Base = {
    storeId: "s",
    status: "completed",
    startSpin: 0,
    currentSpin: 100,
    hitSpin: 100,
    hitCount: 1,
    hitVia: "normal",
    hitTrackedBalls: null,
    endTotalBalls: null,
    zanhoryuBalls: 0,
    yutimeEnterBalls: null,
    hits: [{ roundTypeId: "r10", at: "2026-09-08T10:10:00", segmentId: "seg_1" }]
  };
  const s7Segment = (overrides) => ({
    id: "seg_1", kind: "normal", source: "migrated",
    startSpin: 0, startAt: "10:00", holdSpins: 0,
    endSource: "hit", endSpin: 100, endAt: null, endTrackedBalls: null,
    ...overrides
  });
  // 1. 起点0／再プレイ1,000／終点50 → 950
  globalThis.s7Case1 = deriveSession({
    ...s7Base, consumedModel: "endpoints", startMochidama: 0, hitRemainBalls: 50,
    investments: [{ source: "saipurei", amount: 1000, phase: "normal", spinAt: 10, time: "10:05", segmentId: "seg_1" }],
    segments: [s7Segment({ startTrackedBalls: 0, startBallsSource: "measured", endRemainBalls: 50 })]
  });
  // 2. 起点1,620／追加なし／終点120 → 1,500
  globalThis.s7Case2 = deriveSession({
    ...s7Base, consumedModel: "endpoints", startMochidama: 1620, hitRemainBalls: 120,
    investments: [],
    segments: [s7Segment({ startTrackedBalls: 1620, startBallsSource: "measured", endRemainBalls: 120 })]
  });
  // 3. 起点1,620／現金1,000円（250玉）／終点370 → 1,500
  globalThis.s7Case3 = deriveSession({
    ...s7Base, consumedModel: "endpoints", startMochidama: 1620, hitRemainBalls: 370,
    investments: [{ source: "cash", amount: 1000, phase: "normal", spinAt: 40, time: "10:20", segmentId: "seg_1" }],
    segments: [s7Segment({ startTrackedBalls: 1620, startBallsSource: "measured", endRemainBalls: 370 })]
  });
  // 4. 起点1,620／持ち玉タップ12回（1,500玉）／終点120 → 1,500（タップは加算しない）
  globalThis.s7Case4 = deriveSession({
    ...s7Base, consumedModel: "endpoints", startMochidama: 1620, hitRemainBalls: 120,
    investments: Array.from({ length: 12 }, (unused, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: index * 8, time: "10:0" + (index % 10), segmentId: "seg_1" })),
    segments: [s7Segment({ startTrackedBalls: 1620, startBallsSource: "measured", endRemainBalls: 120 })]
  });
  // 5. 起点1,620／終点1,700 → 警告・null
  globalThis.s7Case5 = deriveSession({
    ...s7Base, consumedModel: "endpoints", startMochidama: 1620, hitRemainBalls: 1700,
    investments: [],
    segments: [s7Segment({ startTrackedBalls: 1620, startBallsSource: "measured", endRemainBalls: 1700 })]
  });
  // 6. 旧セッション（フラグ無し）／タップ1,250 → 現行どおり1,250
  const s7LegacySession = {
    ...s7Base, startMochidama: 1620, hitRemainBalls: null,
    investments: Array.from({ length: 10 }, (unused, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: index * 8, time: "10:0" + (index % 10), segmentId: "seg_1" })),
    segments: [s7Segment({ startTrackedBalls: 1620, startBallsSource: "measured", endRemainBalls: null })]
  };
  globalThis.s7Case6 = deriveSession(s7LegacySession);
  // 同じ記録に新式のフラグを付けても、終点が無ければ従来式のまま（フォールバック）
  globalThis.s7Case6WithFlag = deriveSession({ ...s7LegacySession, consumedModel: "endpoints" });
  // 起点が実測でない（tracked）区間は新式を使わない。
  // 区間①は実測なので新式（2,500＋0−2,300＝200玉）、区間②は tracked なので従来式（タップ375玉）。
  // tracked を実測として扱ってしまうと区間②が 2,300−1,800＝500玉になり、合計が700玉にずれる。
  globalThis.s7MixedStart = deriveSession({
    ...s7Base, consumedModel: "endpoints", startMochidama: 2500, currentSpin: 100, hitCount: 2, hitRemainBalls: 1800,
    investments: [
      { source: "mochidama", amount: 200, phase: "normal", spinAt: 10, time: "10:05", segmentId: "seg_1" },
      { source: "mochidama", amount: 375, phase: "normal", spinAt: 60, time: "10:35", segmentId: "seg_2" }
    ],
    segments: [
      s7Segment({ startTrackedBalls: 2500, startBallsSource: "measured", endSpin: 20, endRemainBalls: 2300 }),
      s7Segment({ id: "seg_2", source: "user", startSpin: 50, startAt: "10:20", holdSpins: 5, startTrackedBalls: 2300, startBallsSource: "tracked", endRemainBalls: 1800 })
    ]
  });
  // 回転率: 区間①20回転/200玉＝25.0、区間②15回転/375玉＝10.0、合計35回転/575玉＝15.2
  globalThis.s7TwoSegments = deriveSession({
    ...s4SecondLap,
    consumedModel: "endpoints",
    segments: [
      { ...s4SecondLap.segments[0], startBallsSource: "measured", endRemainBalls: 2300 },
      { ...s4SecondLap.segments[1], startBallsSource: "measured" }
    ]
  });
`).runInContext(runningRateContext);
assert.equal(runningRateContext.s7Case1.consumedBalls, 950);
assert.equal(runningRateContext.s7Case2.consumedBalls, 1500);
assert.equal(runningRateContext.s7Case3.consumedBalls, 1500);
assert.equal(runningRateContext.s7Case4.consumedBalls, 1500);
assert.equal(runningRateContext.s7Case5.consumedBalls, null);
assert.equal(JSON.stringify(runningRateContext.s7Case5.warnings), JSON.stringify(["通常消費玉の入力を確認"]));
assert.equal(runningRateContext.s7Case6.consumedBalls, 1250);
assert.equal(runningRateContext.s7Case6.consumedModelApplied, false);
assert.equal(runningRateContext.s7Case6WithFlag.consumedBalls, 1250);
assert.equal(runningRateContext.s7Case6WithFlag.consumedModelApplied, false);
// startBallsSource が "measured" の区間だけ新式。"tracked" の区間は従来式のまま
assert.equal(runningRateContext.s7MixedStart.normalSpins, 65);
assert.equal(runningRateContext.s7MixedStart.consumedBalls, 575);
assert.equal(runningRateContext.s7MixedStart.consumedModelApplied, true);
// 新式で出した区間があるセッションだけ consumedModelApplied が立つ（B89の乖離UIの出し分け）
assert.equal(runningRateContext.s7Case1.consumedModelApplied, true);
assert.equal(runningRateContext.s7Case4.consumedModelApplied, true);
assert.equal(runningRateContext.s7TwoSegments.normalSpins, 35);
assert.equal(runningRateContext.s7TwoSegments.consumedBalls, 575);
assert.equal(Number(runningRateContext.s7TwoSegments.rate.toFixed(1)), 15.2);

// --- B-1 回帰: 旧セッションの表示値が1つも変わらないこと ---------------------
// 既存の b84 / b85 / b89 / b95 / S2 / S4 のアサート（consumedModel 無し）が
// そのまま通ることが回帰の本体。ここでは同じ記録に新式を足したときだけ値が動くことを固定する。
assert.notEqual(runningRateContext.s7Case2.consumedBalls, runningRateContext.s7Case6.consumedBalls);


// ===========================================================================
// S7b: 持ち玉修正での回転率再計算（A）／残保留当選の自動判定（B）
// ===========================================================================

const openSessionResult = section('function openSessionResult', 'function transferSummaryForSession');

// --- A: 途中測定点 ----------------------------------------------------------
assert.match(segmentBlock, /lastMeasuredBalls: null,\s*lastMeasuredSpin: null,/);
assert.match(segmentBlock, /lastMeasuredBalls: normalizeNumber\(segment\?\.lastMeasuredBalls\),/);
assert.match(tapModeConsumedBlock, /const end = segmentMeasuredEndBalls\(segment\);/);
assert.match(tapModeConsumedBlock, /function segmentMeasuredEndBalls\(segment\)/);
// 終点が入っている区間・すでに閉じた区間では途中測定点を使わない（終点優先）
assert.match(tapModeConsumedBlock, /if \(end !== null\) return end;\s*if \(segment\?\.endSpin !== null && segment\?\.endSpin !== undefined\) return null;\s*return normalizeNumber\(segment\?\.lastMeasuredBalls\);/);
// 区間の組み直しで途中測定点・残保留当選の指定・始まり方を落とさない
assert.match(segmentBlock, /lastMeasuredBalls: prior \? normalizeNumber\(prior\.lastMeasuredBalls\) : segment\.lastMeasuredBalls,/);
assert.match(segmentBlock, /startSource: prior\?\.startSource === "jitan" \? "jitan" : segment\.startSource,/);
// 持ち玉の修正経路（稼働中パネルの「修正」と updateMochidamaBalanceWithUndo）が測定点を書く
assert.match(updateMochidamaBalance, /const previousMeasurement = segmentMeasurementSnapshot\(session\);/);
assert.match(updateMochidamaBalance, /recordSegmentMeasurement\(session, value\);/);
assert.match(updateMochidamaBalance, /undo: \(\) => \{[\s\S]*?restoreSegmentMeasurement\(session, previousMeasurement\);/);
assert.match(updateMochidamaBalance, /function recordSegmentMeasurement\(session, balls\) \{\s*if \(!usesEndpointConsumedModel\(session\)\) return null;/);
assert.match(openBalanceEditForm, /if \(key === "startMochidama"\) recordSegmentMeasurement\(session, value\);/);
// A-3: 出典の1語。旧セッションには出さない
assert.match(html, /function consumedBallsSourceNote\(session, derived\) \{\s*if \(!usesEndpointConsumedModel\(session\)\) return "";\s*return derived\?\.consumedBallsMeasured \? "（実測）" : "（目安）";/);
assert.match(renderRunning, /\$\{liveRate !== null \? escapeHtml\(consumedBallsSourceNote\(session, derived\)\) : ""\}/);
assert.match(deriveSession, /const consumedBallsMeasured = usesEndpointConsumedModel\(session\)/);
assert.match(deriveSession, /consumedBallsMeasured,/);

const s7bNoteContext = vm.createContext({});
new vm.Script(`
  ${consumedModelBlock}
  ${section('function consumedBallsSourceNote', 'function consumedBallsRateText')}
  globalThis.s7bNote = {
    measured: consumedBallsSourceNote({ consumedModel: "endpoints" }, { consumedBallsMeasured: true }),
    taps: consumedBallsSourceNote({ consumedModel: "endpoints" }, { consumedBallsMeasured: false }),
    legacy: consumedBallsSourceNote({}, { consumedBallsMeasured: false })
  };
`).runInContext(s7bNoteContext);
assert.equal(s7bNoteContext.s7bNote.measured, "（実測）");
assert.equal(s7bNoteContext.s7bNote.taps, "（目安）");
assert.equal(s7bNoteContext.s7bNote.legacy, "");

// --- B: 残保留当選 ----------------------------------------------------------
assert.match(holdCarryBlock, /if \(segment\?\.kind !== "normal" \|\| segment\?\.startSource !== "jitan"\) return false;/);
assert.match(holdCarryBlock, /if \(segment\?\.endSource !== "hit"\) return false;/);
assert.match(holdCarryBlock, /return played >= 0 && played <= Math\.max\(0, Number\(segment\?\.holdSpins \|\| 0\)\);/);
assert.match(holdCarryBlock, /function segmentIsHoldCarryHit\(segment\) \{\s*if \(segment\?\.holdCarryHit === true\) return true;\s*if \(segment\?\.holdCarryHit === false\) return false;\s*return detectHoldCarryHit\(segment\);/);
assert.match(segmentBlock, /if \(segmentSkipsNormalPlay\(segment\)\) return 0;/);
assert.match(startNormalSegmentBlock, /startSource: "jitan",/);
// 保存する segmentId は打っていた区間のまま。寄せるのは参照するときだけ
assert.match(hitHistoryBlock, /function resolveHitSegmentId\(session, hit\) \{\s*return resolveSegmentChainId\(session, storedHitSegmentId\(session, hit\)\);/);
assert.match(hitHistoryBlock, /while \(index > 0 && segmentIsHoldCarryHit\(segments\[index\]\)\) index -= 1;/);
assert.match(hitResetPrompt, /return target \? resolveHitSegmentId\(session, target\) : resolveSegmentChainId\(session, hitRecordSegmentId\(session\)\);/);
assert.match(hitResetPrompt, /function hitRecordSegmentId\(session\) \{[\s\S]*?return target\?\.id \|\| null;/);
assert.match(hitResetPrompt, /\$\{holdCarryNoticeHtml\(session\)\}/);
assert.match(hitResetPrompt, /残保留当選（通常時なし）として、前の連チャンの続きに記録します。/);
// B-4: 手動での切り替え
assert.match(hitHistoryBlock, /\$\{holdCarrySectionHtml\(session\)\}/);
assert.match(hitHistoryBlock, /data-toggle-holdcarry="\$\{escapeHtml\(segment\.id\)\}"/);
assert.match(hitHistoryBlock, /function toggleSegmentHoldCarry\(session, segmentId\) \{[\s\S]*?segment\.holdCarryHit = !segmentIsHoldCarryHit\(segment\);/);
// S17b/2: 手動切り替えの一覧は startSource だけでなく、時短抜けカウンター一致でも拾う
assert.match(hitHistoryBlock, /\.filter\(\(entry\) => entry\.segment\.kind === "normal" && entry\.segment\.endSource === "hit"\s*&& startedByJitanExit\(entry\.segment, entry\.index, segments, jitanCounters\)\);/);
assert.match(hitHistoryBlock, /const jitanCounters = new Set\(jitanExitOptions\(normalizeMachinePresetId\(machine\)\)\.map\(\(option\) => option\.counterSpin\)\);/);
assert.match(hitHistoryBlock, /function startedByJitanExit\(segment, index, segments, jitanCounters\) \{\s*if \(segment\?\.startSource === "jitan"\) return true;\s*if \(index <= 0\) return false;\s*if \(!jitanCounters\.has\(normalizeNumber\(segment\?\.startSpin\)\)\) return false;\s*return segments\[index - 1\]\?\.endSource === "hit";/);
// B-4: リザルトの区間内訳
assert.match(resultBlock, /const holdCarry = isNormal && segmentIsHoldCarryHit\(segment\);/);
assert.match(resultBlock, /endLabel: holdCarry \? "残保留当選" : endLabel,/);
assert.match(openSessionResult, /は残保留当選（通常時なし）。前の連チャンの続きとして数えます/);

const s7bHoldCarryContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function segmentNormalInvestments(session, segmentId) {
    if (!segmentId) return [];
    return (Array.isArray(session?.investments) ? session.investments : [])
      .filter((item) => item.phase !== "yutime" && item.segmentId === segmentId);
  }
  ${holdCarryBlock}
  // S7c: 打ち出し状態で判定する。既定は "started"（打ち出し中）
  const jitan = (overrides) => ({ kind: "normal", startSource: "jitan", endSource: "hit", holdSpins: 5, shooting: "started", ...overrides });
  globalThis.s7cHoldCarry = {
    // §5-1: 遊タイム狙い・何もせず・起点25→28 → 残保留当選
    c1: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 28, shooting: "before" })),
    // §5-2: 保留だけで8回転（判定は変わらず残保留当選。警告だけ出る）
    c2: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 33, shooting: "before" })),
    // §5-3: 打ち出し開始を押した → 通常当選（回転数は同じ3回転でも判定が変わる）
    c3: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 28, shooting: "started" })),
    // §5-4: タップ1回で started になっている → 通常当選
    c4: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 27, shooting: "started" })),
    // §5-5: 打ち切りの初期状態は started → 通常当選
    c5: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 28, shooting: "started" })),
    // §5-6: 打ち切りでも時短抜け画面で「止める」を選べば残保留当選
    c6: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 28, shooting: "before" })),
    // §5-7: 打ち始め区間（時短抜け由来でない）は対象外
    c7: segmentIsHoldCarryHit({ kind: "normal", startSource: null, endSource: "hit", startSpin: 0, endSpin: 3, holdSpins: 5, shooting: "before" }),
    // 遊タイム区間・まだ閉じていない区間・ヤメで閉じた区間は残保留当選にしない
    yutime: segmentIsHoldCarryHit({ kind: "yutime", startSource: "jitan", endSource: "hit", startSpin: 900, endSpin: 902, holdSpins: 5, shooting: "before" }),
    open: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: null, endSource: null, shooting: "before" })),
    ended: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 28, endSource: "end", shooting: "before" })),
    // 手動指定は自動判定より優先する（S7bのまま）
    manualOff: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 28, shooting: "before", holdCarryHit: false })),
    manualOn: segmentIsHoldCarryHit(jitan({ startSpin: 25, endSpin: 31, shooting: "started", holdCarryHit: true }))
  };
  // §5-8: 打ち出さずヤメた区間も通常時なし（回転数0・消費玉0）
  globalThis.s7cSkips = {
    beforeHit: segmentSkipsNormalPlay(jitan({ startSpin: 25, endSpin: 28, shooting: "before" })),
    beforeEnd: segmentSkipsNormalPlay(jitan({ startSpin: 25, endSpin: 30, endSource: "end", shooting: "before" })),
    beforeOpen: segmentSkipsNormalPlay(jitan({ startSpin: 25, endSpin: null, endSource: null, shooting: "before" })),
    startedEnd: segmentSkipsNormalPlay(jitan({ startSpin: 25, endSpin: 30, endSource: "end", shooting: "started" })),
    firstSegment: segmentSkipsNormalPlay({ kind: "normal", startSource: null, endSource: "end", startSpin: 0, endSpin: 300, holdSpins: 0, shooting: "started" })
  };
  // §2-1: 警告。判定は変えない
  globalThis.s7cWarnings = {
    // 保留だけで8回転（holdSpins 5 + 3 = 8 は境界なので出ない）
    beforeBoundary: segmentShootingWarning(jitan({ id: "s1", startSpin: 25, endSpin: 33, shooting: "before" }), {}),
    // 9回転なら出る
    beforeTooMany: segmentShootingWarning(jitan({ id: "s1", startSpin: 25, endSpin: 34, shooting: "before" }), {}),
    // started で保留内・投資なし
    startedNoTaps: segmentShootingWarning(jitan({ id: "s1", startSpin: 25, endSpin: 28, shooting: "started" }), {}),
    // started で保留内でも投資があれば出さない
    startedWithTaps: segmentShootingWarning(jitan({ id: "s1", startSpin: 25, endSpin: 28, shooting: "started" }), { investments: [{ segmentId: "s1", phase: "normal", amount: 125 }] }),
    // 打ち始め区間は対象外
    firstSegment: segmentShootingWarning({ kind: "normal", startSource: null, endSource: "hit", startSpin: 0, endSpin: 3, holdSpins: 5, shooting: "before" }, {})
  };
  // §4: 移行に使うS7bの回転数ベースの判定。ここが変わると既存データの判定結果が保てない
  const legacy = (overrides) => ({ kind: "normal", startSource: "jitan", endSource: "hit", holdSpins: 5, ...overrides });
  globalThis.s7cLegacy = {
    inside: legacyHoldCarryHit(legacy({ startSpin: 25, endSpin: 28 })),
    outside: legacyHoldCarryHit(legacy({ startSpin: 25, endSpin: 31 })),
    boundary: legacyHoldCarryHit(legacy({ startSpin: 50, endSpin: 54, holdSpins: 4 })),
    boundaryOver: legacyHoldCarryHit(legacy({ startSpin: 50, endSpin: 55, holdSpins: 4 })),
    firstSegment: legacyHoldCarryHit({ kind: "normal", startSource: null, endSource: "hit", startSpin: 0, endSpin: 3, holdSpins: 5 })
  };
  // 移行後の shooting はS7bの判定結果をそのまま写す
  const migrated = {
    segments: [
      legacy({ id: "m1", startSpin: 25, endSpin: 28 }),
      legacy({ id: "m2", startSpin: 25, endSpin: 31 }),
      { id: "m3", kind: "normal", startSource: null, endSource: "end", startSpin: 0, endSpin: 300, holdSpins: 0 }
    ]
  };
  migrateSegmentShooting(migrated);
  globalThis.s7cMigrated = migrated.segments.map((segment) => segment.shooting);
  globalThis.s7cMigratedDetect = migrated.segments.map((segment) => segmentIsHoldCarryHit(segment));
`).runInContext(s7bHoldCarryContext);
// §5の検算8件。判定の引き金は回転数ではなく打ち出し状態
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c1, true);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c2, true);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c3, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c4, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c5, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c6, true);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.c7, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.yutime, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.open, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.ended, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.manualOff, false);
assert.equal(s7bHoldCarryContext.s7cHoldCarry.manualOn, true);
// §5-8: 打ち出していない区間は当選の有無に関わらず通常時なし
assert.equal(s7bHoldCarryContext.s7cSkips.beforeHit, true);
assert.equal(s7bHoldCarryContext.s7cSkips.beforeEnd, true);
assert.equal(s7bHoldCarryContext.s7cSkips.beforeOpen, true);
assert.equal(s7bHoldCarryContext.s7cSkips.startedEnd, false);
assert.equal(s7bHoldCarryContext.s7cSkips.firstSegment, false);
// §2-1: 警告2種
assert.equal(s7bHoldCarryContext.s7cWarnings.beforeBoundary, "");
assert.match(s7bHoldCarryContext.s7cWarnings.beforeTooMany, /保留だけで9回転は多いです。「打ち出し開始」を押し忘れていませんか。/);
assert.match(s7bHoldCarryContext.s7cWarnings.startedNoTaps, /打ち出し前の当選ではありませんか。/);
assert.equal(s7bHoldCarryContext.s7cWarnings.startedWithTaps, "");
assert.equal(s7bHoldCarryContext.s7cWarnings.firstSegment, "");
// §4: 移行のルールはS7bの回転数ベースの判定そのまま
assert.equal(s7bHoldCarryContext.s7cLegacy.inside, true);
assert.equal(s7bHoldCarryContext.s7cLegacy.outside, false);
assert.equal(s7bHoldCarryContext.s7cLegacy.boundary, true);
assert.equal(s7bHoldCarryContext.s7cLegacy.boundaryOver, false);
assert.equal(s7bHoldCarryContext.s7cLegacy.firstSegment, false);
assert.deepEqual(JSON.parse(JSON.stringify(s7bHoldCarryContext.s7cMigrated)), ["before", "started", "started"]);
// 移行後にS7cの判定を通しても、S7bと同じ結果になる（既存データの判定結果が変わらない）
assert.deepEqual(JSON.parse(JSON.stringify(s7bHoldCarryContext.s7cMigratedDetect)), [true, false, false]);

// --- C: 検算（deriveSession） ----------------------------------------------
new vm.Script(`
  const s7bSegment = (overrides) => ({
    id: "seg_1", kind: "normal", source: "migrated",
    startSpin: 50, startAt: "10:20", holdSpins: 5,
    startTrackedBalls: 1620, startBallsSource: "measured",
    endSource: null, endSpin: null, endAt: null, endRemainBalls: null, endTrackedBalls: null,
    lastMeasuredBalls: null, lastMeasuredSpin: null,
    ...overrides
  });
  const s7bBase = {
    storeId: "s", status: "active", consumedModel: "endpoints",
    startSpin: 50, currentSpin: 75, startMochidama: 1620,
    hitSpin: null, hitCount: 0, hitVia: null, hitRemainBalls: null, hitTrackedBalls: null,
    endTotalBalls: null, zanhoryuBalls: 0, yutimeEnterBalls: null, hits: []
  };
  // C-1: 起点1,620／追加なし／持ち玉を1,120に修正／現在75・起点50・hold5 → 20回転/500玉＝10.0（実測）
  globalThis.s7bC1 = deriveSession({
    ...s7bBase,
    investments: [],
    segments: [s7bSegment({ lastMeasuredBalls: 1120, lastMeasuredSpin: 75 })]
  });
  // C-2: 修正なし・タップ4回（500玉）→ 500玉/10.0（目安）
  globalThis.s7bC2 = deriveSession({
    ...s7bBase,
    investments: Array.from({ length: 4 }, (unused, index) => ({ source: "mochidama", amount: 125, phase: "normal", spinAt: 55 + index * 5, time: "10:2" + index, segmentId: "seg_1" })),
    segments: [s7bSegment()]
  });
  // C-3: 途中測定のあとに当選（終点120）→ 起点1,620−120＝1,500で確定（終点優先）
  globalThis.s7bC3 = deriveSession({
    ...s7bBase, status: "completed", currentSpin: 90, hitSpin: 90, hitCount: 1, hitVia: "normal", hitRemainBalls: 120,
    hits: [{ roundTypeId: "r10", hitSpin: 90, at: "2026-09-08T10:00:00", segmentId: "seg_1" }],
    investments: [],
    segments: [s7bSegment({ lastMeasuredBalls: 1120, lastMeasuredSpin: 75, endSource: "hit", endSpin: 90, endRemainBalls: 120 })]
  });
  // C-4: 残保留当選の区間は回転数0・消費玉0で、回転率の集計から外れる
  const s7bHoldCarrySession = {
    storeId: "s", status: "completed", consumedModel: "endpoints",
    startSpin: 0, currentSpin: 28, startMochidama: 2500,
    hitSpin: 28, hitCount: 2, hitVia: "normal", hitRemainBalls: 1800, hitTrackedBalls: null,
    endTotalBalls: null, zanhoryuBalls: 0, yutimeEnterBalls: null,
    hits: [
      { roundTypeId: "r10", hitSpin: 20, actualBalls: 1400, at: "2026-09-08T10:00:00", segmentId: "seg_a" },
      { roundTypeId: "r10", hitSpin: 28, actualBalls: 1200, at: "2026-09-08T11:00:00", segmentId: "seg_b" }
    ],
    investments: [
      { source: "mochidama", amount: 200, phase: "normal", spinAt: 10, time: "10:00", segmentId: "seg_a" }
    ],
    segments: [
      { id: "seg_a", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", holdSpins: 0,
        startTrackedBalls: 2500, startBallsSource: "measured", startSource: null, holdCarryHit: null,
        lastMeasuredBalls: null, lastMeasuredSpin: null,
        endSource: "hit", endSpin: 20, endAt: null, endRemainBalls: 2300, endTrackedBalls: null },
      { id: "seg_b", kind: "normal", source: "user", startSpin: 25, startAt: "10:40", holdSpins: 5,
        startTrackedBalls: 3700, startBallsSource: "measured", startSource: "jitan", holdCarryHit: null, shooting: "before",
        lastMeasuredBalls: null, lastMeasuredSpin: null,
        endSource: "hit", endSpin: 28, endAt: null, endRemainBalls: 1800, endTrackedBalls: null }
    ]
  };
  globalThis.s7bHoldCarryDerived = deriveSession(s7bHoldCarrySession);
  // 手動で「通常当選として扱う」に戻すと再計算される（3回転・1,900玉が加算される）
  globalThis.s7bHoldCarryOffDerived = deriveSession({
    ...s7bHoldCarrySession,
    segments: s7bHoldCarrySession.segments.map((segment) => segment.id === "seg_b" ? { ...segment, holdCarryHit: false } : segment)
  });
  // 残保留当選の区間に投資が残っていれば警告する
  globalThis.s7bHoldCarryTapsDerived = deriveSession({
    ...s7bHoldCarrySession,
    investments: [
      ...s7bHoldCarrySession.investments,
      { source: "mochidama", amount: 125, phase: "normal", spinAt: 26, time: "10:45", segmentId: "seg_b" }
    ]
  });
`).runInContext(runningRateContext);
// C-1: 途中測定点で 1,620 + 0 − 1,120 = 500玉。打ち出し 75−50−5 = 20回転 → 10.0（実測）
assert.equal(runningRateContext.s7bC1.normalSpins, 20);
assert.equal(runningRateContext.s7bC1.consumedBalls, 500);
assert.equal(Number(runningRateContext.s7bC1.rate.toFixed(1)), 10.0);
assert.equal(runningRateContext.s7bC1.consumedBallsMeasured, true);
// C-2: 測定点が無ければタップ合計が目安になる。値は同じ500玉でも出典は「目安」
assert.equal(runningRateContext.s7bC2.normalSpins, 20);
assert.equal(runningRateContext.s7bC2.consumedBalls, 500);
assert.equal(Number(runningRateContext.s7bC2.rate.toFixed(1)), 10.0);
assert.equal(runningRateContext.s7bC2.consumedBallsMeasured, false);
// C-3: 終点が入ったら測定点ではなく終点で確定する
assert.equal(runningRateContext.s7bC3.consumedBalls, 1500);
assert.equal(runningRateContext.s7bC3.consumedBallsMeasured, true);
// 残保留当選: 区間②は回転数0・消費玉0。区間①の 20回転/200玉 だけが残る
assert.equal(runningRateContext.s7bHoldCarryDerived.normalSpins, 20);
assert.equal(runningRateContext.s7bHoldCarryDerived.consumedBalls, 200);
assert.equal(Number(runningRateContext.s7bHoldCarryDerived.rate.toFixed(1)), 25.0);
assert.equal(JSON.stringify(runningRateContext.s7bHoldCarryDerived.warnings), JSON.stringify([]));
// 手動で通常当選に戻すと区間②（3回転・1,900玉）が集計に戻る
assert.equal(runningRateContext.s7bHoldCarryOffDerived.normalSpins, 20);
assert.equal(runningRateContext.s7bHoldCarryOffDerived.consumedBalls, 2100);
// 残保留当選の区間に投資が残っていたら警告
assert.equal(JSON.stringify(runningRateContext.s7bHoldCarryTapsDerived.warnings), JSON.stringify(["残保留当選の区間に投資が記録されています"]));

// --- 連チャンの紐づけ（S4/C-4・S8と同じ切り出しに乗ること） -----------------
const s7bChainContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function sessionSegments(session) { return session.segments || []; }
  ${holdCarryBlock}
  ${normalizeHitsBlock}
  ${section('function resolveHitSegmentId', 'function hitHistoryRows')}
  ${section('function currentChainHits', 'function hitRoundSummaryHtml')}
  const segments = [
    { id: "seg_a", kind: "normal", startSource: null, endSource: "hit", startSpin: 0, endSpin: 20, holdSpins: 0 },
    { id: "seg_b", kind: "normal", startSource: "jitan", endSource: "hit", startSpin: 25, endSpin: 28, holdSpins: 5, shooting: "before" }
  ];
  const hits = [
    { roundTypeId: "r10", hitSpin: 20, actualBalls: 1400, at: "2026-09-08T10:00:00", segmentId: "seg_a" },
    { roundTypeId: "r10", hitSpin: 28, actualBalls: 1200, at: "2026-09-08T11:00:00", segmentId: "seg_b" }
  ];
  const holdCarrySession = { segments, hits };
  const normalSession = { segments: segments.map((s) => s.id === "seg_b" ? { ...s, holdCarryHit: false } : s), hits };
  globalThis.s7bChain = {
    holdCarryIds: hits.map((hit) => resolveHitSegmentId(holdCarrySession, hit)),
    holdCarryChain: currentChainHits(holdCarrySession).length,
    normalIds: hits.map((hit) => resolveHitSegmentId(normalSession, hit)),
    normalChain: currentChainHits(normalSession).length,
    storedIds: hits.map((hit) => hit.segmentId)
  };
`).runInContext(s7bChainContext);
// 残保留当選の当たりは前の連チャン（区間①）に寄る。保存された segmentId は区間②のまま
assert.deepEqual(JSON.parse(JSON.stringify(s7bChainContext.s7bChain.holdCarryIds)), ["seg_a", "seg_a"]);
assert.equal(s7bChainContext.s7bChain.holdCarryChain, 2);
assert.deepEqual(JSON.parse(JSON.stringify(s7bChainContext.s7bChain.storedIds)), ["seg_a", "seg_b"]);
// 手動で通常当選に戻すと当たりは区間②へ戻り、「今回の連チャン」は1回になる
assert.deepEqual(JSON.parse(JSON.stringify(s7bChainContext.s7bChain.normalIds)), ["seg_a", "seg_b"]);
assert.equal(s7bChainContext.s7bChain.normalChain, 1);


// ===========================================================================
// S7c: 残保留当選の判定を「打ち出し状態」方式へ変更
// ===========================================================================

const playStyleEditorBlock = section('function playStyleEditorHtml', 'function segmentHoldSpinsEditorHtml');
const shootingBlock = section('function markSegmentShootingStarted', 'function holdCarryNoticeHtml');
const wizardInputBlock = section('function wizardInputHtml', 'function readWizardValue');

// --- §1: データ構造 --------------------------------------------------------
assert.match(html, /const SCHEMA_VERSION = 36;/);
assert.match(html, /function normalizePlayStyle\(value\) \{\s*return value === "continuous" \? "continuous" : "yutime";/);
assert.match(html, /function normalizeShooting\(value\) \{\s*return value === "before" \? "before" : "started";/);
assert.match(normalizeData, /playStyle: normalizePlayStyle\(session\.playStyle\)/);
assert.match(segmentBlock, /shooting: "started",/);
assert.match(segmentBlock, /shooting: normalizeShooting\(segment\?\.shooting\),/);
// 区間の組み直しで打ち出し状態を落とさない
assert.match(segmentBlock, /shooting: prior \? normalizeShooting\(prior\.shooting\) : segment\.shooting,/);

// --- §2: 判定の引き金の差し替え --------------------------------------------
assert.match(holdCarryBlock, /function detectHoldCarryHit\(segment\) \{[\s\S]*?return segment\?\.shooting === "before";\s*\}/);
// 回転数の条件は判定から消えていること（migration 用の legacyHoldCarryHit にだけ残る）
const detectBody = holdCarryBlock.slice(holdCarryBlock.indexOf("function detectHoldCarryHit"), holdCarryBlock.indexOf("function legacyHoldCarryHit"));
assert.doesNotMatch(detectBody, /holdSpins/);
assert.match(holdCarryBlock, /function legacyHoldCarryHit\(segment\)[\s\S]*?return played >= 0 && played <= Math\.max\(0, Number\(segment\?\.holdSpins \|\| 0\)\);/);
assert.match(holdCarryBlock, /function segmentSkipsNormalPlay\(segment\)/);
assert.match(holdCarryBlock, /if \(segment\?\.endSource === "hit"\) return segmentIsHoldCarryHit\(segment\);/);
assert.match(deriveSession, /segmentSkipsNormalPlay\(segment\) \|\| segmentEndpointConsumedBalls\(segment, session, store\) !== null/);

// --- §4: 移行 --------------------------------------------------------------
assert.match(holdCarryBlock, /function migrateSegmentShooting\(session\)[\s\S]*?segment\.shooting = legacyHoldCarryHit\(segment\) \? "before" : "started";/);
assert.match(normalizeData, /if \(sourceVersion < 35\) migrateSegmentShooting\(normalized\);/);

const s7cMigrationContext = vm.createContext({ ...legacyMachineContext });
new vm.Script(`
  const jitanSegment = (id, endSpin, holdSpins) => ({
    id, kind: "normal", source: "user", startSpin: 25, startAt: "10:40",
    startTrackedBalls: 3700, startBallsSource: "measured", startSource: "jitan",
    holdCarryHit: null, lastMeasuredBalls: null, lastMeasuredSpin: null,
    holdSpins, endSource: "hit", endSpin, endAt: null, endRemainBalls: 1800, endTrackedBalls: null
  });
  globalThis.s7cMigration = normalizeData({
    version: 34,
    presetSettings: { "umi-sp5": {} },
    sessions: [{
      id: "s_mig", storeId: "st_1", machineId: "m_1", status: "completed",
      startSpin: 0, startMochidama: 2500, currentMochidama: 1800, consumedModel: "endpoints",
      hitSpin: 28, hitCount: 2, hitVia: "normal", hitRemainBalls: 1800, endSpin: 68, endTotalBalls: 4000,
      hits: [], investments: [], charges: [],
      segments: [
        { id: "a", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", startTrackedBalls: 2500,
          startBallsSource: "measured", startSource: null, holdCarryHit: null, lastMeasuredBalls: null,
          lastMeasuredSpin: null, holdSpins: 0, endSource: "hit", endSpin: 20, endAt: null, endRemainBalls: 2300, endTrackedBalls: null },
        jitanSegment("b", 28, 5),
        jitanSegment("c", 31, 5),
        jitanSegment("d", 29, 4)
      ]
    }]
  }).sessions[0];
`).runInContext(s7cMigrationContext);
const migratedSegments = s7cMigrationContext.s7cMigration.segments;
// 打ち始め区間は started。時短抜け区間は S7b の回転数判定（<= holdSpins）が true のものだけ before
// b: 28-25=3 <= 5 → before ／ c: 31-25=6 > 5 → started ／ d: 29-25=4 <= 4（境界）→ before
assert.deepEqual(JSON.parse(JSON.stringify(migratedSegments.map((segment) => segment.shooting))), ["started", "before", "started", "before"]);
assert.equal(s7cMigrationContext.s7cMigration.playStyle, "yutime");
// version 35 のデータは二重移行しない（shooting をそのまま残す）
new vm.Script(`
  globalThis.s7cNoRemigrate = normalizeData({
    version: 35,
    presetSettings: { "umi-sp5": {} },
    sessions: [{
      id: "s_keep", storeId: "st_1", machineId: "m_1", status: "active", playStyle: "continuous",
      startSpin: 0, startMochidama: 2500, hits: [], investments: [], charges: [],
      segments: [{ id: "z", kind: "normal", source: "user", startSpin: 25, startTrackedBalls: 3700,
        startBallsSource: "measured", startSource: "jitan", holdCarryHit: null, shooting: "before",
        lastMeasuredBalls: null, lastMeasuredSpin: null, holdSpins: 5,
        endSource: "hit", endSpin: 40, endAt: null, endRemainBalls: 1800, endTrackedBalls: null }]
    }]
  }).sessions[0];
`).runInContext(s7cMigrationContext);
// 40 - 25 = 15 > 5 なので回転数ベースなら started になるが、移行は走らないので before のまま
assert.equal(s7cMigrationContext.s7cNoRemigrate.segments[0].shooting, "before");
assert.equal(s7cMigrationContext.s7cNoRemigrate.playStyle, "continuous");

// --- §1-3: "before" → "started" の切り替え ---------------------------------
assert.match(shootingBlock, /function markSegmentShootingStarted\(session, segmentId\)[\s\S]*?if \(!segment \|\| segment\.shooting !== "before"\) return false;\s*segment\.shooting = "started";/);
assert.match(addInvestment, /markSegmentShootingStarted\(session, item\.segmentId\);/);
assert.match(shootingBlock, /function startShootingForSession\(session\)[\s\S]*?segment\.shooting = "started";/);
assert.match(startNormalSegmentBlock, /shooting: shooting === null \? defaultShootingForSession\(session\) : normalizeShooting\(shooting\),/);
assert.match(hitResetPrompt, /function defaultShootingForSession\(session\) \{\s*return normalizePlayStyle\(session\?\.playStyle\) === "continuous" \? "started" : "before";/);

// --- §3: UI ----------------------------------------------------------------
// 3-1: 打ち始めウィザードの方針選択
assert.match(startSessionFlow, /key: "playStyle",\s*label: "打ち方",\s*type: "choice",/);
assert.match(startSessionFlow, /\{ value: "yutime", label: "遊タイム狙い（時短抜けで止める）" \}/);
assert.match(startSessionFlow, /\{ value: "continuous", label: "打ち切り（続けて打つ）" \}/);
assert.match(wizardInputBlock, /if \(step\.type === "choice"\)/);
assert.match(wizardInputBlock, /class="wizardChoice\$\{option\.value === selected \? " selected" : ""\}"/);
// 3-1: セッション中の変更は「記録の修正・削除」から。稼働中パネルには常時表示の操作を足さない
assert.match(playStyleEditorBlock, /class="playStyleChoice/);
assert.match(openSessionEditor, /\$\{playStyleEditorHtml\(session\)\}/);
assert.match(openSessionEditor, /if \(playStyleChoice\) session\.playStyle = normalizePlayStyle\(playStyleChoice\.dataset\.playStyle\);/);
// 3-2: 時短抜けの「この後」
assert.match(hitResetPrompt, /<label>この後<\/label>/);
assert.match(hitResetPrompt, /class="jitanShootingChoice/);
assert.match(hitResetPrompt, /打ち出しを止める（保留を待つ）/);
assert.match(hitResetPrompt, /打ち出しを続ける/);
assert.match(hitResetPrompt, /const selectedShooting = \(\) => els\.modalBody\.querySelector\("\.jitanShootingChoice\.selected"\)\?\.dataset\.shooting \?\? null;/);
// 3-3: 打ち出し開始ボタンは保留消化中だけ。行を増やさず既存の操作行に収める
assert.match(renderRunning, /const holdSpinPhase = isHoldSpinPhase\(session\);/);
assert.match(renderRunning, /<div class="running-actions\$\{holdSpinPhase \? " with-shooting" : ""\}">/);
assert.match(renderRunning, /\$\{holdSpinPhase \? '<button class="primary" id="startShootingBtn">打ち出し開始<\/button>' : ""\}/);
assert.match(renderRunning, /if \(startShootingButton\) startShootingButton\.addEventListener\("click", \(\) => startShootingForSession\(session\)\);/);
// 44px以上（UI規約 / §6）
assert.match(html, /\.style-choice button \{\s*min-height: 44px;/);
assert.match(html, /\.running-actions\.with-shooting button,\s*\.running-panel\.fullscreen \.running-actions\.with-shooting button \{\s*min-height: 44px;/);
// 3-4: 状態バッジ
assert.match(html, /if \(isHoldSpinPhase\(session\)\) return \{ label: "保留消化中", className: "warn" \};/);
assert.match(shootingBlock, /function isHoldSpinPhase\(session\)[\s\S]*?segment\.startSource === "jitan" && segment\.shooting === "before"/);
// S7bの表示・手動切り替えはそのまま使う（作り直していないこと）
assert.match(hitHistoryBlock, /\$\{holdCarrySectionHtml\(session\)\}/);
assert.match(hitHistoryBlock, /function toggleSegmentHoldCarry\(session, segmentId\)/);
assert.match(resultBlock, /endLabel: holdCarry \? "残保留当選" : endLabel,/);
assert.match(resultBlock, /const noShooting = isNormal && segmentSkipsNormalPlay\(segment\);/);

// --- §5-8: 打ち出さずヤメた区間は回転数0・消費玉0 ---------------------------
new vm.Script(`
  globalThis.s7cEndedWithoutShooting = deriveSession({
    storeId: "s", status: "completed", consumedModel: "endpoints",
    startSpin: 0, currentSpin: 30, startMochidama: 2500,
    hitSpin: 20, hitCount: 1, hitVia: "normal", hitRemainBalls: 2300, hitTrackedBalls: null,
    endTotalBalls: 3600, endSpin: 30, zanhoryuBalls: 0, yutimeEnterBalls: null,
    hits: [{ roundTypeId: "r10", hitSpin: 20, actualBalls: 1400, at: "2026-09-08T10:00:00", segmentId: "seg_a" }],
    investments: [{ source: "mochidama", amount: 200, phase: "normal", spinAt: 10, time: "10:00", segmentId: "seg_a" }],
    segments: [
      { id: "seg_a", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", holdSpins: 0,
        startTrackedBalls: 2500, startBallsSource: "measured", startSource: null, holdCarryHit: null, shooting: "started",
        lastMeasuredBalls: null, lastMeasuredSpin: null,
        endSource: "hit", endSpin: 20, endAt: null, endRemainBalls: 2300, endTrackedBalls: null },
      { id: "seg_b", kind: "normal", source: "user", startSpin: 25, startAt: "10:40", holdSpins: 5,
        startTrackedBalls: 3700, startBallsSource: "measured", startSource: "jitan", holdCarryHit: null, shooting: "before",
        lastMeasuredBalls: null, lastMeasuredSpin: null,
        endSource: "end", endSpin: 30, endAt: null, endRemainBalls: 3600, endTrackedBalls: null }
    ]
  });
`).runInContext(runningRateContext);
// 区間①20回転/200玉だけが残り、保留消化だけの区間②は0回転・0玉
assert.equal(runningRateContext.s7cEndedWithoutShooting.normalSpins, 20);
assert.equal(runningRateContext.s7cEndedWithoutShooting.consumedBalls, 200);
assert.equal(Number(runningRateContext.s7cEndedWithoutShooting.rate.toFixed(1)), 25.0);


// ===========================================================================
// S17: 投資phaseの修復（第1部）／獲得期待値＝Σ区間期待値（第2部）
// ===========================================================================

// --- 第1部: 投資phaseの修復 ------------------------------------------------
assert.match(html, /const SCHEMA_VERSION = 36;/);
assert.match(html, /const S17_BACKUP_KEY = STORAGE_PREFIX \+ "backup:s17";/);
assert.match(segmentMigrationBackup, /function needsInvestmentPhaseRepair\(source\) \{\s*return \(normalizeNumber\(source\?\.version\) \?\? 0\) < 36;/);
assert.match(segmentMigrationBackup, /function backupBeforeInvestmentPhaseRepair\(raw\) \{\s*if \(!raw \|\| localStorage\.getItem\(S17_BACKUP_KEY\)\) return;/);
assert.match(segmentMigrationBackup, /function repairInvestmentPhases\(session\)/);
// segmentId が解決できない投資は触らない
assert.match(segmentMigrationBackup, /const kind = kindById\.get\(item\.segmentId\);\s*if \(!kind\) return;/);
assert.match(normalizeData, /if \(sourceVersion < 36\) repairedInvestmentPhases \+= repairInvestmentPhases\(normalized\);/);
assert.match(normalizeData, /console\.info\(`ytv3 S17: 投資phaseを\$\{repairedInvestmentPhases\}件修復しました`\)/);

const s17RepairContext = vm.createContext({ ...legacyMachineContext, console: { info() {}, warn() {} } });
new vm.Script(`
  const seg = (id, kind, startSpin, endSpin, endSource) => ({
    id, kind, source: "user", startSpin, startAt: "10:00", startTrackedBalls: 1000,
    startBallsSource: "measured", startSource: kind === "normal" && startSpin > 0 ? "jitan" : null,
    holdCarryHit: null, shooting: "started", lastMeasuredBalls: null, lastMeasuredSpin: null,
    holdSpins: 0, endSource, endSpin, endAt: null, endRemainBalls: 500, endTrackedBalls: null
  });
  const tap = (segmentId, phase, amount) => ({ type: "mochidama", source: "mochidama", amount, time: "10:10", phase, spinAt: 10, segmentId });
  globalThis.s17Repaired = normalizeData({
    version: 35,
    presetSettings: { "umi-sp5": {} },
    sessions: [{
      id: "s_repair", storeId: "st_1", machineId: "m_1", status: "completed",
      startSpin: 0, startMochidama: 2500, currentMochidama: 500, consumedModel: "endpoints",
      hitSpin: 170, hitCount: 1, hitVia: "yutime", hitRemainBalls: 500,
      yutimeEnterSpin: 249, yutimeEnterBalls: 1535, yutimeEnterTime: "12:00",
      endSpin: 200, endTotalBalls: 3000, hits: [], charges: [],
      investments: [
        tap("n1", "yutime", 125),
        tap("y1", "normal", 250),
        tap("n1", "normal", 125),
        tap("y1", "yutime", 300),
        { type: "mochidama", source: "mochidama", amount: 999, time: "10:20", phase: "yutime", spinAt: 20, segmentId: null }
      ],
      segments: [seg("n1", "normal", 50, 170, "hit"), seg("y1", "yutime", 249, 324, "hit")]
    }]
  }).sessions[0];
  globalThis.s17AlreadyRepaired = normalizeData({
    version: 36,
    presetSettings: { "umi-sp5": {} },
    sessions: [{
      id: "s_keep", storeId: "st_1", machineId: "m_1", status: "completed",
      startSpin: 0, startMochidama: 2500, hits: [], charges: [],
      investments: [tap("n1", "yutime", 125)],
      segments: [seg("n1", "normal", 50, 170, "hit")]
    }]
  }).sessions[0];
`).runInContext(s17RepairContext);
// 区間の種別に合わせて phase が直る。segmentId が無い投資は触らない
// segmentId が空の投資は既存の applySegmentIds が phase から区間を割り当てるので、修復後も矛盾しない
assert.deepEqual(
  JSON.parse(JSON.stringify(s17RepairContext.s17Repaired.investments.map((item) => [item.segmentId, item.phase]))),
  [["n1", "normal"], ["y1", "yutime"], ["n1", "normal"], ["y1", "yutime"], ["y1", "yutime"]]
);
assert.equal(s17RepairContext.s17Repaired.version, undefined, "セッション単体には version を持たせない");
// schema 36 のデータは再修復しない（矛盾したままでも触らない）
assert.equal(s17RepairContext.s17AlreadyRepaired.investments[0].phase, "yutime");

// --- 第2部: 獲得期待値 -----------------------------------------------------
assert.match(html, /const EARNED_EV_RATE_MIN = 1;\s*const EARNED_EV_RATE_MAX = 50;/);
assert.match(resultBlock, /function earnedExpectationForSession\(session, machine = null, derived = null\)/);
// B-2: 区間ごとの実測は使わない。セッション全体の実測を全区間に渡す
assert.match(resultBlock, /manualRate: rate,/);
assert.match(resultBlock, /previousSpin: index === 0 \? session\.prevDayEndSpin : 0,/);
assert.match(resultBlock, /if \(segment\.kind !== "normal" \|\| segmentSkipsNormalPlay\(segment\)\) return;/);
// エンジンは呼ぶだけ。新しい計算式を書かない
assert.match(resultBlock, /const expectation = calculateMachineExpectation\(targetMachine, \{/);
const earnedEvBlock = section('function earnedExpectationForSession', 'function earnedExpectationYen');
assert.doesNotMatch(earnedEvBlock, /YUTIME_EXPECTATION_ENGINE/);
// B-3: 表示
assert.match(resultBlock, /evYen: earnedById && segment\.id \? \(earnedById\.has\(segment\.id\) \? earnedById\.get\(segment\.id\) : null\) : null,/);
assert.match(resultBlock, /const earned = earnedExpectationForSession\(session, machine, derived\);/);
assert.match(resultBlock, /const segmentRows = segmentBreakdownRows\(session, derived, machine, earned\);/);
assert.match(resultBlock, /獲得期待値 \$\{escapeHtml\(yenText\(earned\.totalYen\)\)\}/);
assert.match(openSessionResult, /<div class="result-line">獲得期待値 \$\{escapeHtml\(earned \? yenText\(earned\.totalYen\) : "-"\)\}<\/div>/);
assert.match(openSessionResult, /期待値は各区間の起点からの獲得期待値の合計/);
// 履歴・日別・積み上げが獲得期待値ベース
assert.match(renderLedger, /const evYen = earnedExpectationYen\(session, machine, derived\);/);
assert.match(renderLedger, /\$\{sessionFiguresHtml\(derived\.profitYen, evYenById\.get\(session\.id\)\)\}/);
assert.match(resultBlock, /const earnedYen = earnedExpectationYen\(session, machine, derived\);\s*const hours = sessionWorkedHours\(session\);/);
assert.match(resultBlock, /if \(earnedYen !== null\) evYen = \(evYen \?\? 0\) \+ earnedYen;/);
// 開始期待値は「打つ前の判断」「想定と実測のズレ」「転記用」に残る
assert.match(openSessionResult, /開始期待値 \$\{escapeHtml\(yenText\(startEv\.evYen\)\)\}/);
assert.match(openSessionResult, /<tr><td>開始期待値との差<\/td>/);
assert.match(transferSummary, /<span>開始期待値<\/span><strong>\$\{transferOptionalYenText\(summary\.startEvYen\)\}<\/strong>/);

const s17EvApi = resultContext.resultApi;
const s17Machine = { id: "m_ev", storeId: "store1", presetId: "preset1", __evByStart: { 0: 1000, 25: 1500, 50: 2000 } };
resultContext.data.machines = [s17Machine];
const s17Segment = (id, overrides) => ({
  id, kind: "normal", startSpin: 0, endSpin: 200, endSource: "hit", holdSpins: 0,
  startSource: null, shooting: "started", holdCarryHit: null, ...overrides
});
const s17Session = (overrides) => ({
  machineId: "m_ev", storeId: "store1", startEv: { evYen: 1000, usedRate: 18.0, availableBalls: 2500 },
  prevDayEndSpin: null, __rate: 20, ...overrides
});
// 通常区間だけを足す。遊タイム・残保留当選・打ち出しなしは除外
const mixed = s17EvApi.earnedExpectationForSession(s17Session({
  segments: [
    s17Segment("a"),
    s17Segment("b", { startSpin: 50, startSource: "jitan" }),
    { id: "y", kind: "yutime", startSpin: 249, endSpin: 324, endSource: "hit", holdSpins: 0, shooting: "started" },
    s17Segment("c", { startSpin: 25, startSource: "jitan", endSpin: 28, shooting: "before" }),
    s17Segment("d", { startSpin: 25, startSource: "jitan", endSpin: 40, endSource: "end", shooting: "before" })
  ]
}), s17Machine, { rate: 20, normalSpins: 200 });
assert.equal(mixed.totalYen, 3000, "起点0(+1,000)と起点50(+2,000)だけを足す");
assert.deepEqual(JSON.parse(JSON.stringify(mixed.rows.map((row) => row.segmentId))), ["a", "b"]);
assert.equal(mixed.rateSource, "実測");
assert.equal(mixed.rate, 20);
// 実測が出せないときは開始期待値の想定回転率で代用し、出典を「想定」にする
const assumed = s17EvApi.earnedExpectationForSession(s17Session({ segments: [s17Segment("a")] }), s17Machine, { rate: null, normalSpins: 200 });
assert.equal(assumed.rateSource, "想定");
assert.equal(assumed.rate, 18.0);
// 実測が常識的な範囲（1〜50）の外なら実測として採らない
const outlier = s17EvApi.earnedExpectationForSession(s17Session({ segments: [s17Segment("a")] }), s17Machine, { rate: 0.04, normalSpins: 200 });
assert.equal(outlier.rateSource, "想定");
const tooFast = s17EvApi.earnedExpectationForSession(s17Session({ segments: [s17Segment("a")] }), s17Machine, { rate: 60, normalSpins: 200 });
assert.equal(tooFast.rateSource, "想定");
// 実測も想定も無ければ獲得期待値は出さない
assert.equal(s17EvApi.earnedExpectationForSession(s17Session({ startEv: null, segments: [s17Segment("a")] }), s17Machine, { rate: null, normalSpins: 200 }), null);
// 通常区間が1つも残らなければ null
assert.equal(s17EvApi.earnedExpectationForSession(s17Session({
  segments: [{ id: "y", kind: "yutime", startSpin: 249, endSpin: 324, endSource: "hit", holdSpins: 0, shooting: "started" }]
}), s17Machine, { rate: 20, normalSpins: 200 }), null);
// 合計行の根拠テキスト
assert.match(s17EvApi.earnedExpectationBasisText(mixed), /回転率20\.0・実測 ／ 1R108玉・実測平均/);
// 区間内訳の期待値列。合計に入らない区間は null（表示は「—」）
const s17Rows = s17EvApi.segmentBreakdownRows(s17Session({
  segments: [
    s17Segment("a", { consumed: 1000 }),
    { id: "y", kind: "yutime", startSpin: 249, endSpin: 324, endSource: "hit", holdSpins: 0, shooting: "started" }
  ]
}), { consumedBalls: 1000, yutimeLoss: 210 }, s17Machine, mixed);
assert.equal(s17Rows[0].evYen, 1000);
assert.equal(s17Rows[1].evYen, null);

// --- エンジンに変更が無いこと ----------------------------------------------
// yutime-calc との文字列一致テスト（tests/yutime-calc.test.js）が本体。
// ここでは S17 でエンジンブロックに触っていないことを、呼び出し口の形で固定する。
assert.match(html, /const result = YUTIME_EXPECTATION_ENGINE\.calculate\(\{ presetId: preset\.id, currentSpin: engineSpin, rotationRate: rateInfo\.rate, availableBalls \}, settingsInfo\.settings\);/);


// ===========================================================================
// S17b: 遊タイム玉減りを区間の端点から／手動切り替えの対象拡大／回転率の出典3段
// ===========================================================================

// --- 1: 遊タイム玉減りを区間の端点から出す ---------------------------------
assert.match(tapModeConsumedBlock, /function segmentYutimeLoss\(segment, session, store\)/);
assert.match(tapModeConsumedBlock, /return start \+ segmentInvestedBalls\(session, segment\.id, store\) - end;/);
assert.match(tapModeConsumedBlock, /const start = normalizeNumber\(segment\.startTrackedBalls\) \?\? normalizeNumber\(session\?\.yutimeEnterBalls\);\s*const end = normalizeNumber\(segment\.endRemainBalls\);\s*if \(start === null \|\| end === null\) return null;/);
assert.match(deriveSession, /const segmentLoss = segmentYutimeLoss\(segments\.find\(\(segment\) => segment\.kind === "yutime"\), session, store\);/);
// 終点が無い旧データは従来式へフォールバック
assert.match(deriveSession, /const rawYutimeLoss = segmentLoss !== null\s*\? segmentLoss\s*: \(session\.hitVia === "yutime" && session\.yutimeEnterBalls !== null && yutimeEndBalls !== null \? session\.yutimeEnterBalls \+ yutimeInvestedBalls - yutimeEndBalls : null\);/);

new vm.Script(`
  const s17bYutime = (overrides) => ({
    storeId: "s", status: "completed", consumedModel: "endpoints",
    startSpin: 0, currentSpin: 324, startMochidama: 3818,
    hitSpin: 324, hitCount: 2, hitVia: "yutime", hitTrackedBalls: null,
    endTotalBalls: 3384, zanhoryuBalls: 0,
    yutimeEnterSpin: 249, yutimeEnterBalls: 1535,
    // 最後の当選時の残り持ち玉。遊タイム区間の終点とは別物
    hitRemainBalls: 2312,
    hits: [],
    investments: [],
    segments: [
      { id: "n1", kind: "normal", source: "migrated", startSpin: 0, startAt: "10:00", holdSpins: 0,
        startTrackedBalls: 3818, startBallsSource: "measured", startSource: null, holdCarryHit: null, shooting: "started",
        lastMeasuredBalls: null, lastMeasuredSpin: null,
        endSource: "yutime", endSpin: 249, endAt: null, endRemainBalls: null, endTrackedBalls: null },
      { id: "y1", kind: "yutime", source: "user", startSpin: 249, startAt: "12:00", holdSpins: 0,
        startTrackedBalls: 1535, startBallsSource: "measured", startSource: null, holdCarryHit: null, shooting: "started",
        lastMeasuredBalls: null, lastMeasuredSpin: null,
        endSource: "hit", endSpin: 324, endAt: null, endRemainBalls: 1500, endTrackedBalls: 1693 }
    ],
    ...overrides
  });
  // 9/7・台325と同じ形。1,535 − 1,500 ＝ 35玉（hitRemainBalls 2,312 は使わない）
  globalThis.s17bLoss = deriveSession(s17bYutime()).yutimeLoss;
  // 遊タイム区間内の投資は足す
  globalThis.s17bLossWithTaps = deriveSession(s17bYutime({
    investments: [{ source: "saipurei", amount: 500, phase: "yutime", spinAt: 300, time: "12:10", segmentId: "y1" }]
  })).yutimeLoss;
  // 遊タイム区間の外の投資は足さない
  globalThis.s17bLossOutsideTaps = deriveSession(s17bYutime({
    investments: [{ source: "saipurei", amount: 500, phase: "normal", spinAt: 100, time: "10:10", segmentId: "n1" }]
  })).yutimeLoss;
  // 終点が無い旧データは従来式（1,535 + 遊タイム投資 − 2,312）へ落ちる
  const legacy = s17bYutime();
  legacy.segments[1].endRemainBalls = null;
  legacy.investments = [{ source: "saipurei", amount: 1250, phase: "yutime", spinAt: 300, time: "12:10", segmentId: "y1" }];
  globalThis.s17bLossLegacy = deriveSession(legacy).yutimeLoss;
`).runInContext(runningRateContext);
assert.equal(runningRateContext.s17bLoss, 35, "1,535 − 1,500 ＝ 35玉");
assert.equal(runningRateContext.s17bLossWithTaps, 535);
assert.equal(runningRateContext.s17bLossOutsideTaps, 35);
assert.equal(runningRateContext.s17bLossLegacy, 473, "終点が無ければ 1,535 + 1,250 − 2,312 ＝ 473 の従来式");

// --- 2: 残保留当選の手動切り替えの対象拡大 ---------------------------------
const s17bHistoryContext = vm.createContext({});
new vm.Script(`
  function normalizeNumber(value) {
    if (value === "" || value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function numberText(value, fallback = "-") { return value === null || value === undefined ? fallback : String(value); }
  function escapeHtml(value) { return String(value ?? ""); }
  function sessionSegments(session) { return session.segments || []; }
  function normalizeMachinePresetId(machine) { return machine?.presetId || ""; }
  // アグネスPE相当（時短15/40/90 + ST10 → カウンター25/50/100）
  function jitanExitOptions() { return [{ jitanSpins: 15, counterSpin: 25 }, { jitanSpins: 40, counterSpin: 50 }, { jitanSpins: 90, counterSpin: 100 }]; }
  const data = { machines: [{ id: "m1", presetId: "agnes-pe" }] };
  ${holdCarryBlock}
  ${section('function segmentHistoryLabels', 'function resolveHitSegmentId')}
  ${section('function holdCarrySegments', 'function toggleSegmentHoldCarry')}
  const seg = (id, startSpin, endSpin, endSource, overrides = {}) => ({
    id, kind: "normal", startSpin, endSpin, endSource, holdSpins: 5,
    startSource: null, shooting: "started", holdCarryHit: null, ...overrides
  });
  globalThis.s17bList = holdCarrySegments({
    machineId: "m1",
    segments: [
      seg("s0", 0, 96, "hit"),                                   // 打ち始め区間（対象外）
      seg("s1", 50, 202, "hit"),                                 // 時短抜けカウンター一致＋直前が当選
      seg("s2", 25, 28, "hit"),                                  // 台325の区間9に相当
      seg("s3", 50, 249, "yutime"),                              // 当選で終わっていない（対象外）
      { id: "y", kind: "yutime", startSpin: 249, endSpin: 324, endSource: "hit", holdSpins: 0, shooting: "started" },
      seg("s4", 50, 170, "hit"),                                 // 直前が遊タイム区間の当選
      seg("s5", 50, 51, "hit"),                                  // 台325の区間13に相当
      seg("s6", 50, 55, "end"),                                  // ヤメで終了（対象外）
      seg("s7", 33, 90, "hit"),                                  // 起点がカウンター値でない（対象外）
      seg("s8", 25, 40, "hit", { startSource: "jitan" })         // S7b以降の印がある区間
    ]
  }).map((entry) => entry.segment.id);
`).runInContext(s17bHistoryContext);
assert.deepEqual(JSON.parse(JSON.stringify(s17bHistoryContext.s17bList)), ["s1", "s2", "s4", "s5", "s8"]);

// --- 3: 回転率の出典3段 ----------------------------------------------------
assert.match(html, /const EARNED_EV_MIN_SPINS = 100;/);
assert.match(resultBlock, /function earnedExpectationRate\(session, machine, derived, startEv\)/);
assert.match(resultBlock, /if \(usableEarnedEvRate\(measured, normalizeNumber\(derived\?\.normalSpins\)\)\) return \{ rate: measured, source: "実測" \};/);
assert.match(resultBlock, /const reference = machine \? machineStats\(machine\.id\) : null;/);
assert.match(resultBlock, /if \(usableEarnedEvRate\(referenceRate, normalizeNumber\(reference\?\.spins\)\)\) return \{ rate: referenceRate, source: "参考" \};/);
assert.match(resultBlock, /if \(assumed !== null && assumed > 0\) return \{ rate: assumed, source: "想定" \};/);
assert.match(resultBlock, /function usableEarnedEvRate\(rate, spins\) \{\s*if \(rate === null \|\| rate < EARNED_EV_RATE_MIN \|\| rate > EARNED_EV_RATE_MAX\) return false;\s*return spins !== null && spins >= EARNED_EV_MIN_SPINS;/);

const s17bMachine = { id: "m_s17b", storeId: "store1", presetId: "preset1", __evByStart: { 0: 1000 } };
const s17bSession = (overrides) => ({
  machineId: "m_s17b", storeId: "store1", startEv: { evYen: 1000, usedRate: 18.0, availableBalls: 2500 },
  prevDayEndSpin: null,
  segments: [{ id: "a", kind: "normal", startSpin: 0, endSpin: 200, endSource: "hit", holdSpins: 0, startSource: null, shooting: "started", holdCarryHit: null }],
  ...overrides
});
const rateSourceOf = (derived, stats) => {
  resultContext.data.machines = [{ ...s17bMachine, __stats: stats }];
  const earned = resultContext.resultApi.earnedExpectationForSession(s17bSession(), resultContext.data.machines[0], derived);
  return earned ? [earned.rateSource, earned.rate] : null;
};
// ①実測: 母数100回転以上かつ 1〜50
assert.deepEqual(rateSourceOf({ rate: 20, normalSpins: 200 }, { rate: 17, spins: 500 }), ["実測", 20]);
// 母数が足りなければ参考へ落ちる（台360・8/26が10回転で当たったケース）
assert.deepEqual(rateSourceOf({ rate: 10, normalSpins: 10 }, { rate: 17, spins: 500 }), ["参考", 17]);
// 実測が範囲外でも参考へ落ちる
assert.deepEqual(rateSourceOf({ rate: 0.04, normalSpins: 200 }, { rate: 17, spins: 500 }), ["参考", 17]);
// 参考も母数不足なら想定へ（台290・8/5は自分の1件しか無く2回転）
assert.deepEqual(rateSourceOf({ rate: 0.04, normalSpins: 2 }, { rate: 0.04, spins: 2 }), ["想定", 18]);
// 想定も無ければ獲得期待値を出さない
resultContext.data.machines = [{ ...s17bMachine, __stats: { rate: 0.04, spins: 2 } }];
assert.equal(
  resultContext.resultApi.earnedExpectationForSession(s17bSession({ startEv: null }), resultContext.data.machines[0], { rate: 0.04, normalSpins: 2 }),
  null
);
// 出典は合計行にそのまま出る
resultContext.data.machines = [{ ...s17bMachine, __stats: { rate: 17, spins: 500 } }];
const s17bReference = resultContext.resultApi.earnedExpectationForSession(s17bSession(), resultContext.data.machines[0], { rate: 10, normalSpins: 10 });
assert.match(resultContext.resultApi.earnedExpectationBasisText(s17bReference), /回転率17\.0・参考 ／ 1R108玉・実測平均/);


// ===========================================================================
// S18: アグネスPEの1R実質出玉の既定値を記事v5の実戦基準（100玉/R）にそろえる
// ===========================================================================

// エンジンの既定値。公称払い出し（648÷6＝108）ではなく記事v5の基準値
assert.match(yutimeExpectationEngine, /netBallsPerWin: 100,/);
assert.doesNotMatch(yutimeExpectationEngine, /netBallsPerWin: 108,/);
// averageRoundsPerWin は当選あたりの平均R数（R構成の重み）なので動かさない
assert.match(yutimeExpectationEngine, /averageRoundsPerWin: 587\.5 \/ 108/);
// umi-sp5 は不変
assert.match(yutimeExpectationEngine, /netBallsPerWin: DEFAULT_NET_BALLS_PER_ROUND,/);

// 既定値の出典ラベルは機種側（MACHINE_PRESETS）に持たせる
assert.match(html, /defaultNetBallsLabel: "基準値（記事の1R100玉）"/);
assert.match(html, /function netBallsDefaultLabel\(presetId\) \{\s*return presetById\(presetId\)\?\.defaultNetBallsLabel \|\| "理論値";/);
assert.match(html, /return \{ value: preset\?\.defaults\?\.netBallsPerWin \|\| DEFAULT_NET_BALLS_PER_ROUND, source: netBallsDefaultLabel\(presetId\), count: 0 \};/);
// 大海5SPの1,400玉/当選＝140玉/Rは夢爽が実戦基準で置いた値。ラベルは触らない
assert.doesNotMatch(html, /umi-sp5[^\n]*defaultNetBallsLabel/);

const s18LabelContext = vm.createContext({
  MACHINE_PRESETS: [
    { id: 'umi-sp5', defaults: { netBallsPerWin: 140 } },
    { id: 'agnes-pe', defaults: { netBallsPerWin: 100 }, defaultNetBallsLabel: '基準値（記事の1R100玉）' }
  ]
});
new vm.Script(`
  function presetById(id) { return MACHINE_PRESETS.find((preset) => preset.id === id) || null; }
  ${section('function netBallsDefaultLabel', 'function presetHoldSpins')}
  globalThis.labels = { agnes: netBallsDefaultLabel('agnes-pe'), umi: netBallsDefaultLabel('umi-sp5'), unknown: netBallsDefaultLabel('none') };
`).runInContext(s18LabelContext);
assert.equal(s18LabelContext.labels.agnes, '基準値（記事の1R100玉）');
assert.equal(s18LabelContext.labels.umi, '理論値');
assert.equal(s18LabelContext.labels.unknown, '理論値');

// 受け入れ基準: カウンター150・回転率17・等価・現金・手入力なし・実測なし → 記事v5の +1,569円。
// エンジンの既定値をそのまま渡して、既定パスが記事の代表点と一致することを固定する。
assert.equal(
  Math.round(s11Engine.ev('agnes-pe', 150, 17, s11Engine.E.presets['agnes-pe'].defaults.netBallsPerWin, 25, 0).evYen),
  1569,
  'S18: 既定の1R実質出玉で記事v5の代表点（+1,569円）になること'
);
// umi-sp5 の既定は不変
assert.equal(s11Engine.E.presets['umi-sp5'].defaults.netBallsPerWin, 140);

console.log('yutime-v3 tests passed');

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
const openBalanceEditForm = section('function openBalanceEditForm', 'function openSpinEditForm');
const machineSummary = section('function machineModelSummaryHtml', 'function machineDetailFormHtml');
const machineDetailForm = section('function machineDetailFormHtml', 'function openMachineDetail');
const openMachineDetail = section('function openMachineDetail', 'function renderMachineExpectation');
const nailRatingSection = section('function nailRatingSummary', 'function machineModelSummaryHtml');
const machineModelDisplay = section('function machineModelDisplay', 'function applyPresetToMachine');
const columnPresetApply = section('function applyColumnPresetsToMachines', 'function machineHasIndividualSetting');
const normalizeData = section('function normalizeData', 'function persist');
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
assert.doesNotMatch(renderRunning, /id="unifiedInvestBtn"[^>]*disabled/);
assert.match(style, /\.source-chip\.selected \{\s*border-color: var\(--accent\);\s*background: var\(--accent\);\s*color: #fff;/);
assert.match(sourceUnavailableMessage, /if \(balance === null\) return `\$\{label\}が未入力です。`;/);
assert.match(sourceUnavailableMessage, /if \(balance < amount\) return `\$\{label\}がありません。値をタップして修正するか、他のソースを選んでください。`;/);
assert.match(addInvestment, /const unavailableMessage = sourceUnavailableMessage\(session, source, amount\);\s*if \(unavailableMessage\) \{\s*showToast\(unavailableMessage, "error"\);\s*return;\s*\}\s*const item = \{ type: source, source, amount/);
assert.match(html, /const SCHEMA_VERSION = 21;/);
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
assert.ok(design.includes('schema 21 Machine 1件サンプル'));

assert.match(openMachineDetail, /function openMachineDetail\(daiNo, machineFormExpanded = false, memoDraft = null\)/);
assert.match(openMachineDetail, /\$\{nailRatingSectionHtml\(machine\)\}/);
assert.match(openMachineDetail, /bindNailRatingChips\(\);/);
assert.match(openMachineDetail, /\$\{machineModelSummaryHtml\(machine\)\}\s*\$\{machineFormExpanded \? machineDetailFormHtml\(machine\) : ""\}/);
assert.match(openMachineDetail, /\$\{machineFormExpanded \? '<button id="saveMachineBtn">[^']+<\/button>' : ""\}/);
assert.match(openMachineDetail, /if \(machineFormExpanded\) readMachineDetailForm\(machine\);\s*else readMachineMemoForm\(machine\);/);
assert.match(openMachineDetail, /openMachineDetail\(daiNo, true, byId\("machineMemo"\)\?\.value \|\| ""\)/);
assert.match(html, /const NAIL_RATING_KEYS = \["heso", "yori", "michi", "nekase", "migi"\];/);
assert.match(html, /heso: "ヘソ"/);
assert.match(nailRatingSection, /data-nail-rating="\$\{value\}"/);
assert.match(html, /machine\.nailRating = readNailRatingFromDom\(\);/);
assert.match(machineSummary, /id="toggleMachineFormBtn"/);
assert.match(machineDetailForm, /id="machinePreset"/);
assert.match(machineDetailForm, /id="machineModel"/);
assert.match(machineDetailForm, /id="roundBalls"/);
assert.match(machineModelDisplay, /source: "[^"]+"/);
assert.match(machineModelDisplay, /name: "[^"]+"/);
assert.match(columnPresetApply, /if \(hasIndividualSetting && currentPresetId !== presetId && !allowOverwrite\) return;/);
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

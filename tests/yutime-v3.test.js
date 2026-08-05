const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
const balanceStartValueForCurrent = section('function balanceStartValueForCurrent', 'function currentBalanceForStartKey');
const currentBalanceForStartKey = section('function currentBalanceForStartKey', 'function updateMochidamaBalanceWithUndo');
const renderRunning = section('function renderRunning', 'function renderLedger');
const addInvestment = section('function addInvestment', 'function deleteInvestment');
const sourceUnavailableMessage = section('function sourceUnavailableMessage', 'function rateText');
const runningPanelRate = section('function runningPanelRate', 'function runningYutimeRemaining');
const runningSpinCount = section('function runningSpinCount', 'function investmentSnapshot');
const openBalanceEditForm = section('function openBalanceEditForm', 'function openSpinEditForm');
const machineSummary = section('function machineModelSummaryHtml', 'function machineDetailFormHtml');
const machineDetailForm = section('function machineDetailFormHtml', 'function openMachineDetail');
const openMachineDetail = section('function openMachineDetail', 'function renderMachineExpectation');
const machineModelDisplay = section('function machineModelDisplay', 'function applyPresetToMachine');
const columnPresetApply = section('function applyColumnPresetsToMachines', 'function machineHasIndividualSetting');
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

assert.match(openMachineDetail, /function openMachineDetail\(daiNo, machineFormExpanded = false, memoDraft = null\)/);
assert.match(openMachineDetail, /\$\{machineModelSummaryHtml\(machine\)\}\s*\$\{machineFormExpanded \? machineDetailFormHtml\(machine\) : ""\}/);
assert.match(openMachineDetail, /\$\{machineFormExpanded \? '<button id="saveMachineBtn">[^']+<\/button>' : ""\}/);
assert.match(openMachineDetail, /if \(machineFormExpanded\) readMachineDetailForm\(machine\);\s*else readMachineMemoForm\(machine\);/);
assert.match(openMachineDetail, /openMachineDetail\(daiNo, true, byId\("machineMemo"\)\?\.value \|\| ""\)/);
assert.match(machineSummary, /id="toggleMachineFormBtn"/);
assert.match(machineDetailForm, /id="machinePreset"/);
assert.match(machineDetailForm, /id="machineModel"/);
assert.match(machineDetailForm, /id="roundBalls"/);
assert.match(machineModelDisplay, /source: "[^"]+"/);
assert.match(machineModelDisplay, /name: "[^"]+"/);
assert.match(columnPresetApply, /if \(hasIndividualSetting && currentPresetId !== presetId && !allowOverwrite\) return;/);

console.log('yutime-v3 tests passed');

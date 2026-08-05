const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'yutime-v3.html'), 'utf8');

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
const renderRunning = section('function renderRunning', 'function renderLedger');
const addInvestment = section('function addInvestment', 'function deleteInvestment');
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
assert.match(renderRunning, /<span>\$\{escapeHtml\(option\.label\)\}<\/span><strong>\$\{balanceText\(balance, unit\)\}<\/strong>/);
assert.match(renderRunning, /class="primary\$\{selectedCanUse \? "" : " is-low"\}" id="unifiedInvestBtn"/);
assert.doesNotMatch(renderRunning, /id="unifiedInvestBtn"[^>]*disabled/);
assert.match(style, /\.source-chip\.selected \{\s*border-color: var\(--accent\);\s*background: var\(--accent\);\s*color: #fff;/);
assert.match(addInvestment, /if \(balance === null\) \{\s*showToast\([^,]+,\s*"error"\);\s*return;\s*\}\s*if \(balance < amount\) \{\s*showToast\([^,]+,\s*"error"\);\s*return;\s*\}\s*const item = \{ type: source, source, amount/);

console.log('yutime-v3 tests passed');

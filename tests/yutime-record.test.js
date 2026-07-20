const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'yutime-record.html'), 'utf8');
const match = html.match(/const YUTIME_RECORD_ENGINE = \(\(\) => \{[\s\S]*?\n\}\)\(\);/);
assert.ok(match, 'engine block not found');
const context = vm.createContext({ window: {} });
vm.runInContext(`${match[0]}\nwindow.engine = YUTIME_RECORD_ENGINE;`, context);
const engine = context.window.engine;

function close(actual, expected, toleranceRate, label) {
  const diff = Math.abs(actual - expected);
  const limit = Math.abs(expected) * toleranceRate;
  assert.ok(diff <= limit, `${label}: expected ${expected}, actual ${actual}, diff ${diff}, limit ${limit}`);
}

function caseResult(currentSpin, rotationRate) {
  return engine.calculate({ currentSpin, rotationRate }, engine.preset.defaults);
}

const chains = engine.chainValues();
close(chains.r100, 0.2690, 0.001, 'r100');
close(chains.r200, 0.4657, 0.001, 'r200');
close(chains.r350, 0.6661, 0.001, 'r350');
close(chains.wInit, 3.0870, 0.001, 'W_init');
close(chains.jitanHit, 3.3940, 0.001, 'J');
close(chains.yutimeWins, 2.2607, 0.001, 'yutime wins');

const c500 = caseResult(500, 17);
close(c500.evYen, 1945, 0.01, '500/17 EV');
close(c500.hourlyYen, 1422, 0.01, '500/17 hourly');
close(c500.totalHours, 1.37, 0.01, '500/17 hours');

const c600 = caseResult(600, 15);
close(c600.evYen, 1540, 0.01, '600/15 EV');
close(c600.hourlyYen, 1203, 0.01, '600/15 hourly');
close(c600.totalHours, 1.28, 0.01, '600/15 hours');

const c300 = caseResult(300, 18);
close(c300.evYen, 1249, 0.01, '300/18 EV');
close(c300.totalHours, 1.48, 0.01, '300/18 hours');

const c700 = caseResult(700, 14);
// The v1.0 table says about 2,845 yen. The explicit formula in section 3 gives about 2,773 yen.
// Keep this pinned so the discrepancy is visible instead of silently tuning the engine.
close(c700.evYen, 2773, 0.01, '700/14 EV from primary formula');
close(c700.totalHours, 1.16, 0.01, '700/14 hours');

assert.equal(engine.logRate({ balls: 5000, spins: 340 }).toFixed(2), '17.00');
console.log('yutime-record tests passed');
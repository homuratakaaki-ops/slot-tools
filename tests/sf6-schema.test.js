const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { normalizeSf6Export } = require('../sf6-schema.js');

const legacyFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sf6-record-legacy-v1.json'), 'utf8')
);
const v2RankFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sf6-record-v2-rank.json'), 'utf8')
);

function assertJsonEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function testExportVersion9() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '8',
    battleState: 'normal',
    currentStage: 'ジェイミー',
    currentZenchou: 'stage',
    currentColor: '赤',
    currentState: { realG: 100, lcdG: 250 },
    initialThrough: 2,
    pendingAutoColor: { boundary: 300 },
    sessionMoney: null,
    logs: []
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.battleState, 'normal');
  assert.equal(normalized.currentStage, 'ジェイミー');
  assert.equal(normalized.currentZenchou, 'stage');
  assert.equal(normalized.currentColor, '赤');
  assert.equal(normalized.initialThrough, 2);
  assert.deepEqual(normalized.pendingAutoColor, { boundary: 300 });
  assert.equal(normalized.sessionMoney, null);
}

function testLegacyTrigPreserved() {
  const normalized = normalizeSf6Export(legacyFixture);
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '1');
  assert.equal(normalized.battleState, 'normal');
  assert.equal(normalized.sessionMoney, null);
  assertJsonEqual(normalized.currentState, { realG: null, lcdG: null });
  assert.equal(normalized.initialThrough, 0);
  assert.equal(normalized.currentStage, null);
  assert.equal(normalized.currentZenchou, null);
  assert.equal(normalized.currentColor, null);
  assert.equal(normalized.hadWin, false);
  assert.equal(normalized.autoColorBoundary, null);
  assert.equal(normalized.logs[0].legacy_trig, legacyFixture.logs[0].trig);
  assert.equal(Object.prototype.hasOwnProperty.call(normalized.logs[0], 'trig'), false);
  assert.equal(normalized.logs[0].rank, null);
  assert.equal(normalized.logs[0].opponent, null);
  assert.equal(normalized.logs[0].kiteiG, null);
  assert.equal(normalized.logs[0].icatch, null);
  assert.equal(normalized.logs[0].icatchNote, null);
  assert.equal(normalized.logs[0].roundStart, null);
  assert.equal(normalized.logs[0].bonusMedals, null);
  assert.equal(normalized.logs[0].endScreen, null);
  assert.equal(normalized.logs[0].continue, null);
  assert.equal(normalized.logs[0].exitRealG, null);
}

function testMissingVersionAsLegacy() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    logs: [{ id: 1, type: 'fb', realG: 1, lcdG: 2, t: 1, win: false, trig: '螟ｩ莠・' }]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, null);
  assert.equal(normalized.initialThrough, 0);
  assert.equal(normalized.logs[0].legacy_trig, '螟ｩ莠・');
}

function testIdempotentVersion15() {
  const input = {
    machine: 'L-SF6',
    ver: '15',
    sourceVer: '9',
    battleState: 'battle',
    hadWin: true,
    currentStage: 'キャミィ',
    currentZenchou: 'in',
    currentColor: '青',
    currentState: { realG: 12, lcdG: 34 },
    initialThrough: 3,
    pendingAutoColor: null,
    autoColorBoundary: 400,
    sessionMoney: {
      startCredit: 10000,
      startMochidama: 500,
      startSaipurei: 0,
      startRealG: 120,
      startLcdG: 345,
      initialMedalInAmount: 50,
      initialMedalInSource: 'mochidama',
      currentMochidama: 300,
      currentSaipurei: 0,
      balanceVersion: 14,
      loanRate: 46.6,
      sandBalance: 9000,
      credit: 120,
      investedYen: 1000,
      usedMochidama: 200,
      usedSaipurei: 0,
      usedUnknown: 0,
      initialDiff: -800,
      diffAdjust: 10,
      collectMedals: null
    },
    logs: [
      {
        id: 1,
        type: 'money',
        realG: 12,
        lcdG: 34,
        t: 1,
        op: 'loan',
        amount: 1000,
        after: {
          startCredit: null,
          startMochidama: null,
          startSaipurei: null,
          startRealG: null,
          startLcdG: null,
          initialMedalInAmount: null,
          initialMedalInSource: null,
          currentMochidama: 300,
          currentSaipurei: 0,
          balanceVersion: 14,
          loanRate: 46.6,
          sandBalance: 9000,
          credit: 120,
          investedYen: 1000,
          usedMochidama: 200,
          usedSaipurei: 0,
          usedUnknown: 0,
          initialDiff: -800,
          diffAdjust: 10,
          collectMedals: null
        }
      },
      {
        id: 2,
        type: 'anten',
        realG: 12,
        lcdG: 34,
        t: 2,
        pattern: 'red'
      }
    ]
  };
  assertJsonEqual(normalizeSf6Export(input), input);
}

function testBattleStateDefaultAndPreserved() {
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '8', logs: [] }).battleState, 'normal');
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '8', battleState: 'battle', logs: [] }).battleState, 'battle');
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '8', battleState: 'bad', logs: [] }).battleState, 'normal');
}

function testVersion2RankPreserved() {
  const normalized = normalizeSf6Export(v2RankFixture);
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '2');
  assert.equal(normalized.sessionMoney, null);
  assert.equal(normalized.currentState.realG, 200);
  assert.equal(normalized.currentState.lcdG, 450);
  assert.equal(normalized.logs[0].rank, v2RankFixture.logs[0].rank);
  assert.equal(normalized.logs[0].opponent, v2RankFixture.logs[0].opponent);
  assert.equal(normalized.logs[0].kiteiG, 840);
  assert.equal(normalized.logs[0].roundStart, null);
  assert.equal(normalized.logs[0].bonusMedals, null);
  assert.equal(normalized.logs[0].endScreen, null);
  assert.equal(normalized.logs[0].continue, null);
  assert.equal(normalized.logs[0].exitRealG, null);
}

function testCashAndCollectPreserved() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '4',
    currentState: { realG: 10, lcdG: 20 },
    logs: [
      { id: 1, type: 'cash', realG: 10, lcdG: 20, t: 1, amount: 10000 },
      { id: 2, type: 'collect', realG: 10, lcdG: 20, t: 2, medals: 1417 }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '4');
  assert.equal(normalized.logs[0].amount, 10000);
  assert.equal(normalized.logs[1].medals, 1417);
}

function testVersion7UpgradesTo9() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '7',
    battleState: 'battle',
    currentState: { realG: 10, lcdG: 20 },
    logs: [
      { id: 1, type: 'fb', realG: 10, lcdG: 20, t: 1, win: false, rank: 'silver', opponent: 'marisa', kiteiG: 100, icatch: 'other', icatchNote: 'note' },
      { id: 2, type: 'stage_sel', realG: 10, lcdG: 20, t: 2, stage: 'jamie' },
      { id: 3, type: 'rare', realG: 10, lcdG: 20, t: 3, kind: 'strong-cherry' },
      { id: 4, type: 'continue', realG: 10, lcdG: 20, t: 4, result: 'success' }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '7');
  assert.equal(normalized.initialThrough, 0);
  assert.equal(normalized.currentStage, null);
  assert.equal(normalized.currentZenchou, null);
  assert.equal(normalized.currentColor, null);
  assert.equal(normalized.sessionMoney, null);
  assert.equal(normalized.logs[0].rank, 'silver');
  assert.equal(normalized.logs[0].opponent, 'marisa');
  assert.equal(normalized.logs[0].icatch, 'other');
  assert.equal(normalized.logs[0].icatchNote, 'note');
  assert.equal(normalized.logs[0].roundStart, null);
  assert.equal(normalized.logs[0].bonusMedals, null);
  assert.equal(normalized.logs[0].endScreen, null);
  assert.equal(normalized.logs[0].continue, null);
  assert.equal(normalized.logs[0].exitRealG, null);
  assert.equal(normalized.logs[1].type, 'stage_sel');
  assert.equal(normalized.logs[2].type, 'rare');
  assert.equal(normalized.logs[3].type, 'continue');
}

function testMoneyRecordAndSessionMoney() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '8',
    initialThrough: 1,
    sessionMoney: {
      startCredit: 10000,
      startMochidama: 500,
      startSaipurei: 0,
      loanRate: 46.6,
      sandBalance: 8000,
      credit: 100,
      investedYen: 2000,
      usedMochidama: 300,
      usedSaipurei: 100,
      usedUnknown: 0,
      initialDiff: -800,
      diffAdjust: -20,
      collectMedals: 1417
    },
    logs: [
      {
        id: 1,
        type: 'money',
        realG: 1,
        lcdG: 2,
        t: 3,
        op: 'collectEnd',
        amount: 1417,
        after: { sandBalance: 8000, credit: 100, investedYen: 2000, usedMochidama: 300, usedSaipurei: 100, usedUnknown: 0, initialDiff: -800, diffAdjust: -20, collectMedals: 1417, loanRate: 46.6 }
      }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.initialThrough, 1);
  assert.equal(normalized.sessionMoney.loanRate, 46.6);
  assert.equal(normalized.sessionMoney.usedUnknown, 0);
  assert.equal(normalized.sessionMoney.collectMedals, 1417);
  assert.equal(normalized.logs[0].type, 'money');
  assert.equal(normalized.logs[0].op, 'collectEnd');
  assert.equal(normalized.logs[0].after.loanRate, 46.6);
  assert.equal(normalized.logs[0].after.usedUnknown, 0);
}

function testVersion14BalanceSyncPreserved() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '14',
    initialThrough: 1,
    sessionMoney: {
      startMochidama: 500,
      startSaipurei: 460,
      currentMochidama: 0,
      currentSaipurei: 368,
      balanceVersion: 14,
      credit: 250,
      investedYen: 1000,
      initialDiff: 100,
      diffAdjust: 0,
      collectMedals: null,
      loanRate: 50
    },
    logs: [
      {
        id: 1,
        type: 'money',
        realG: 1,
        lcdG: 2,
        t: 3,
        op: 'balanceSync',
        amount: null,
        balance: { credit: 250, mochidama: 0, saipurei: 368 },
        after: { startMochidama: 500, startSaipurei: 460, currentMochidama: 0, currentSaipurei: 368, balanceVersion: 14, credit: 250, investedYen: 1000, initialDiff: 100, diffAdjust: 0, collectMedals: null, loanRate: 50 }
      }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '14');
  assert.equal(normalized.sessionMoney.currentMochidama, 0);
  assert.equal(normalized.sessionMoney.currentSaipurei, 368);
  assert.equal(normalized.sessionMoney.balanceVersion, 14);
  assert.equal(normalized.logs[0].op, 'balanceSync');
  assert.deepEqual(normalized.logs[0].balance, { credit: 250, mochidama: 0, saipurei: 368 });
  assert.equal(normalized.logs[0].after.currentSaipurei, 368);
}

function testVersion15InitialIcatchPreserved() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '15',
    currentState: { realG: 12, lcdG: 34 },
    logs: [
      { id: 1, type: 'icatch', realG: 12, lcdG: 34, t: 1, chara: 'リュウ' },
      { id: 2, type: 'icatch', realG: 13, lcdG: 35, t: 2, chara: '未確認' },
      { id: 3, type: 'icatch', realG: 14, lcdG: 36, t: 3, chara: 'bad' }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.logs[0].type, 'icatch');
  assert.equal(normalized.logs[0].chara, 'リュウ');
  assert.equal(normalized.logs[1].chara, '未確認');
  assert.equal(normalized.logs[2].chara, null);
}

function testVersion9LegacyMedalOpsNormalizeToMedalIn() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '9',
    sessionMoney: {
      sandBalance: 0,
      credit: null,
      investedYen: 0,
      usedMochidama: 300,
      usedSaipurei: 100,
      initialDiff: null,
      diffAdjust: 0,
      collectMedals: null,
      loanRate: 50
    },
    logs: [
      { id: 1, type: 'money', realG: 1, lcdG: 2, t: 3, op: 'mochidama', amount: 300, after: { usedMochidama: 300, usedSaipurei: 0, loanRate: 50 } },
      { id: 2, type: 'money', realG: 1, lcdG: 2, t: 4, op: 'saipurei', amount: 100, after: { usedMochidama: 300, usedSaipurei: 100, loanRate: 50 } },
      { id: 3, type: 'money', realG: 1, lcdG: 2, t: 5, op: 'medalIn', amount: 750, source: 'unknown', after: { usedUnknown: 750, loanRate: 50 } }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '9');
  assert.equal(normalized.sessionMoney.usedUnknown, 0);
  assert.equal(normalized.logs[0].op, 'medalIn');
  assert.equal(normalized.logs[0].source, 'mochidama');
  assert.equal(normalized.logs[1].op, 'medalIn');
  assert.equal(normalized.logs[1].source, 'saipurei');
  assert.equal(normalized.logs[2].op, 'medalIn');
  assert.equal(normalized.logs[2].source, 'unknown');
  assert.equal(normalized.logs[2].after.usedUnknown, 750);
}

function testUnknownTypePreserved() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '1',
    currentState: {},
    logs: [{ id: 99, type: 'future', realG: 1, lcdG: 2, t: 3, extra: 'keep' }]
  });
  assert.equal(normalized.logs[0].type, 'future');
  assert.equal(normalized.logs[0].extra, 'keep');
}

function testVersion9StageAndAutoColor() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '8',
    currentStage: 'ルーク',
    currentZenchou: 'in',
    currentColor: '青',
    pendingAutoColor: { boundary: 500 },
    logs: [
      { id: 1, type: 'gcolor', realG: 1, lcdG: 101, t: 1, color: '青', auto: true },
      { id: 2, type: 'stage_end', realG: 2, lcdG: 120, t: 2, stage: 'ルーク' }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.currentStage, 'ルーク');
  assert.equal(normalized.currentZenchou, 'in');
  assert.equal(normalized.currentColor, '青');
  assert.deepEqual(normalized.pendingAutoColor, { boundary: 500 });
  assert.equal(normalized.autoColorBoundary, null);
  assert.equal(normalized.logs[0].auto, true);
  assert.equal(normalized.logs[1].type, 'stage_end');
  assert.equal(normalized.logs[1].stage, 'ルーク');
}

function testVersion11SumahoNormalizesTo13() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '11',
    currentState: { realG: 120, lcdG: 340 },
    logs: [
      { id: 1, type: 'sumaho', realG: 120, lcdG: 340, t: 1, chara: 'ken' },
      { id: 2, type: 'sumaho', realG: 121, lcdG: 341, t: 2, chara: 'bad' }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '11');
  assert.equal(normalized.logs[0].type, 'sumaho');
  assert.equal(normalized.logs[0].chara, 'ken');
  assert.equal(normalized.logs[1].type, 'sumaho');
  assert.equal(normalized.logs[1].chara, null);
}

function testVersion12InitialFieldsDefaultToNull() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '12',
    sessionMoney: {
      startMochidama: 500,
      startSaipurei: 460,
      initialDiff: 0,
      loanRate: 50
    },
    logs: [
      { id: 1, type: 'money', realG: null, lcdG: null, t: 1, op: 'init', amount: null, after: { startMochidama: 500, startSaipurei: 460, initialDiff: 0, loanRate: 50 } }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sourceVer, '12');
  assert.equal(normalized.sessionMoney.startRealG, null);
  assert.equal(normalized.sessionMoney.startLcdG, null);
  assert.equal(normalized.sessionMoney.initialMedalInAmount, null);
  assert.equal(normalized.sessionMoney.initialMedalInSource, null);
  assert.equal(normalized.logs[0].after.startRealG, null);
  assert.equal(normalized.logs[0].after.startLcdG, null);
  assert.equal(normalized.logs[0].after.initialMedalInAmount, null);
  assert.equal(normalized.logs[0].after.initialMedalInSource, null);
}

function testVersion13InitialFieldsPreserved() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '13',
    sessionMoney: {
      startRealG: 120,
      startLcdG: 345,
      initialMedalInAmount: 50,
      initialMedalInSource: 'mochidama',
      initialDiff: 0,
      loanRate: 50
    },
    logs: [
      { id: 1, type: 'money', realG: null, lcdG: null, t: 1, op: 'medalIn', amount: 50, source: 'mochidama', after: { startRealG: 120, startLcdG: 345, initialMedalInAmount: 50, initialMedalInSource: 'mochidama', usedMochidama: 50, initialDiff: 0, loanRate: 50 } }
    ]
  });
  assert.equal(normalized.ver, '15');
  assert.equal(normalized.sessionMoney.startRealG, 120);
  assert.equal(normalized.sessionMoney.startLcdG, 345);
  assert.equal(normalized.sessionMoney.initialMedalInAmount, 50);
  assert.equal(normalized.sessionMoney.initialMedalInSource, 'mochidama');
  assert.equal(normalized.logs[0].op, 'medalIn');
  assert.equal(normalized.logs[0].source, 'mochidama');
  assert.equal(normalized.logs[0].after.usedMochidama, 50);
}

testExportVersion9();
testLegacyTrigPreserved();
testMissingVersionAsLegacy();
testIdempotentVersion15();
testBattleStateDefaultAndPreserved();
testVersion2RankPreserved();
testCashAndCollectPreserved();
testVersion7UpgradesTo9();
testMoneyRecordAndSessionMoney();
testVersion14BalanceSyncPreserved();
testVersion15InitialIcatchPreserved();
testVersion9LegacyMedalOpsNormalizeToMedalIn();
testUnknownTypePreserved();
testVersion9StageAndAutoColor();
testVersion11SumahoNormalizesTo13();
testVersion12InitialFieldsDefaultToNull();
testVersion13InitialFieldsPreserved();
console.log('sf6-schema tests passed');

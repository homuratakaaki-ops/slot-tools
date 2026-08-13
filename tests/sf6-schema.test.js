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

function testExportVersion6() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '6',
    battleState: 'normal',
    currentState: { realG: 100, lcdG: 250 },
    sessionMoney: null,
    logs: []
  });
  assert.equal(normalized.ver, '6');
  assert.equal(normalized.battleState, 'normal');
  assert.equal(normalized.sessionMoney, null);
}

function testLegacyTrigPreserved() {
  const normalized = normalizeSf6Export(legacyFixture);
  assert.equal(normalized.ver, '6');
  assert.equal(normalized.sourceVer, '1');
  assert.equal(normalized.battleState, 'normal');
  assert.equal(normalized.sessionMoney, null);
  assertJsonEqual(normalized.currentState, { realG: null, lcdG: null });
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
  assert.equal(normalized.ver, '6');
  assert.equal(normalized.sourceVer, null);
  assert.equal(normalized.logs[0].legacy_trig, '螟ｩ莠・');
}

function testIdempotentVersion6() {
  const input = {
    machine: 'L-SF6',
    ver: '6',
    sourceVer: '5',
    battleState: 'battle',
    currentState: { realG: 12, lcdG: 34 },
    sessionMoney: {
      startCredit: 10000,
      startMochidama: 500,
      startSaipurei: 0,
      loanRate: 46.6,
      sandBalance: 9000,
      credit: 120,
      investedYen: 1000,
      usedMochidama: 200,
      usedSaipurei: 0,
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
          loanRate: 46.6,
          sandBalance: 9000,
          credit: 120,
          investedYen: 1000,
          usedMochidama: 200,
          usedSaipurei: 0,
          initialDiff: -800,
          diffAdjust: 10,
          collectMedals: null
        }
      }
    ]
  };
  assertJsonEqual(normalizeSf6Export(input), input);
}

function testBattleStateDefaultAndPreserved() {
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '6', logs: [] }).battleState, 'normal');
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '6', battleState: 'battle', logs: [] }).battleState, 'battle');
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '6', battleState: 'bad', logs: [] }).battleState, 'normal');
}

function testVersion2RankPreserved() {
  const normalized = normalizeSf6Export(v2RankFixture);
  assert.equal(normalized.ver, '6');
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
  assert.equal(normalized.ver, '6');
  assert.equal(normalized.sourceVer, '4');
  assert.equal(normalized.logs[0].amount, 10000);
  assert.equal(normalized.logs[1].medals, 1417);
}

function testVersion5UpgradesTo6() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '5',
    battleState: 'battle',
    currentState: { realG: 10, lcdG: 20 },
    logs: [
      { id: 1, type: 'fb', realG: 10, lcdG: 20, t: 1, win: false, rank: 'silver', opponent: 'marisa', kiteiG: 100, icatch: 'other', icatchNote: 'note' },
      { id: 2, type: 'stage_sel', realG: 10, lcdG: 20, t: 2, stage: 'jamie' },
      { id: 3, type: 'rare', realG: 10, lcdG: 20, t: 3, kind: 'strong-cherry' },
      { id: 4, type: 'continue', realG: 10, lcdG: 20, t: 4, result: 'success' }
    ]
  });
  assert.equal(normalized.ver, '6');
  assert.equal(normalized.sourceVer, '5');
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
    ver: '6',
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
        after: { sandBalance: 8000, credit: 100, investedYen: 2000, usedMochidama: 300, usedSaipurei: 100, initialDiff: -800, diffAdjust: -20, collectMedals: 1417, loanRate: 46.6 }
      }
    ]
  });
  assert.equal(normalized.ver, '6');
  assert.equal(normalized.sessionMoney.loanRate, 46.6);
  assert.equal(normalized.sessionMoney.collectMedals, 1417);
  assert.equal(normalized.logs[0].type, 'money');
  assert.equal(normalized.logs[0].op, 'collectEnd');
  assert.equal(normalized.logs[0].after.loanRate, 46.6);
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

testExportVersion6();
testLegacyTrigPreserved();
testMissingVersionAsLegacy();
testIdempotentVersion6();
testBattleStateDefaultAndPreserved();
testVersion2RankPreserved();
testCashAndCollectPreserved();
testVersion5UpgradesTo6();
testMoneyRecordAndSessionMoney();
testUnknownTypePreserved();

console.log('sf6-schema tests passed');

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

function testExportVersion4() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '4',
    battleState: 'normal',
    currentState: { realG: 100, lcdG: 250 },
    logs: []
  });
  assert.equal(normalized.ver, '4');
  assert.equal(normalized.battleState, 'normal');
}

function testLegacyTrigPreserved() {
  const normalized = normalizeSf6Export(legacyFixture);
  assert.equal(normalized.ver, '4');
  assert.equal(normalized.sourceVer, '1');
  assert.equal(normalized.battleState, 'normal');
  assert.deepEqual(normalized.currentState, { realG: null, lcdG: null });
  assert.equal(normalized.logs[0].legacy_trig, '規定G');
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
}

function testMissingVersionAsLegacy() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    logs: [{ id: 1, type: 'fb', realG: 1, lcdG: 2, t: 1, win: false, trig: '天井' }]
  });
  assert.equal(normalized.ver, '4');
  assert.equal(normalized.sourceVer, null);
  assert.equal(normalized.logs[0].legacy_trig, '天井');
}

function testIdempotentVersion4() {
  const input = {
    machine: 'L-SF6',
    ver: '4',
    sourceVer: '1',
    battleState: 'battle',
    currentState: { realG: 12, lcdG: 34 },
    logs: [
      {
        id: 1,
        type: 'fb',
        realG: 12,
        lcdG: 34,
        t: 1,
        win: true,
        bonus: '赤7',
        rank: 'シルバー',
        roundStart: '味方全員集合',
        opponent: 'ザンギエフ',
        kiteiG: null,
        icatch: null,
        icatchNote: null,
        bonusMedals: 300,
        endScreen: 'リュウ',
        continue: null,
        legacy_trig: '規定G'
      }
    ]
  };
  assert.deepEqual(normalizeSf6Export(input), input);
}

function testBattleStateDefaultAndPreserved() {
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '4', logs: [] }).battleState, 'normal');
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '4', battleState: 'battle', logs: [] }).battleState, 'battle');
  assert.equal(normalizeSf6Export({ machine: 'L-SF6', ver: '4', battleState: 'bad', logs: [] }).battleState, 'normal');
}

function testVersion2RankPreserved() {
  const normalized = normalizeSf6Export(v2RankFixture);
  assert.equal(normalized.ver, '4');
  assert.equal(normalized.sourceVer, '2');
  assert.equal(normalized.currentState.realG, 200);
  assert.equal(normalized.currentState.lcdG, 450);
  assert.equal(normalized.logs[0].rank, 'シルバー');
  assert.equal(normalized.logs[0].opponent, 'ザンギエフ');
  assert.equal(normalized.logs[0].kiteiG, 840);
  assert.equal(normalized.logs[0].roundStart, null);
  assert.equal(normalized.logs[0].bonusMedals, null);
  assert.equal(normalized.logs[0].endScreen, null);
  assert.equal(normalized.logs[0].continue, null);
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
  assert.equal(normalized.logs[0].amount, 10000);
  assert.equal(normalized.logs[1].medals, 1417);
}

function testVersion3UpgradesTo4() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '3',
    battleState: 'battle',
    currentState: { realG: 10, lcdG: 20 },
    logs: [
      { id: 1, type: 'fb', realG: 10, lcdG: 20, t: 1, win: false, rank: 'シルバー', opponent: 'マリーザ', kiteiG: 100, icatch: 'その他', icatchNote: '豪鬼' },
      { id: 2, type: 'stage_sel', realG: 10, lcdG: 20, t: 2, stage: 'ジェイミー' },
      { id: 3, type: 'rare', realG: 10, lcdG: 20, t: 3, kind: '強チェリー' },
      { id: 4, type: 'continue', realG: 10, lcdG: 20, t: 4, result: 'success' }
    ]
  });
  assert.equal(normalized.ver, '4');
  assert.equal(normalized.sourceVer, '3');
  assert.equal(normalized.logs[0].rank, 'シルバー');
  assert.equal(normalized.logs[0].opponent, 'マリーザ');
  assert.equal(normalized.logs[0].icatch, 'その他');
  assert.equal(normalized.logs[0].icatchNote, '豪鬼');
  assert.equal(normalized.logs[0].roundStart, null);
  assert.equal(normalized.logs[0].bonusMedals, null);
  assert.equal(normalized.logs[0].endScreen, null);
  assert.equal(normalized.logs[0].continue, null);
  assert.equal(normalized.logs[1].type, 'stage_sel');
  assert.equal(normalized.logs[2].type, 'rare');
  assert.equal(normalized.logs[3].type, 'continue');
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

testExportVersion4();
testLegacyTrigPreserved();
testMissingVersionAsLegacy();
testIdempotentVersion4();
testBattleStateDefaultAndPreserved();
testVersion2RankPreserved();
testCashAndCollectPreserved();
testVersion3UpgradesTo4();
testUnknownTypePreserved();

console.log('sf6-schema tests passed');

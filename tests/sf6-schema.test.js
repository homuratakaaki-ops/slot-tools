const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { normalizeSf6Export } = require('../sf6-schema.js');

const legacyFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sf6-record-legacy-v1.json'), 'utf8')
);

function testExportVersion2() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    ver: '2',
    currentState: { realG: 100, lcdG: 250 },
    logs: []
  });
  assert.equal(normalized.ver, '2');
}

function testLegacyTrigPreserved() {
  const normalized = normalizeSf6Export(legacyFixture);
  assert.equal(normalized.ver, '2');
  assert.equal(normalized.sourceVer, '1');
  assert.deepEqual(normalized.currentState, { realG: null, lcdG: null });
  assert.equal(normalized.logs[0].legacy_trig, '規定G');
  assert.equal(Object.prototype.hasOwnProperty.call(normalized.logs[0], 'trig'), false);
  assert.equal(normalized.logs[0].rank, null);
  assert.equal(normalized.logs[0].opponent, null);
  assert.equal(normalized.logs[0].kiteiG, null);
  assert.equal(normalized.logs[0].icatch, null);
  assert.equal(normalized.logs[0].icatchNote, null);
}

function testMissingVersionAsLegacy() {
  const normalized = normalizeSf6Export({
    machine: 'L-SF6',
    logs: [{ id: 1, type: 'fb', realG: 1, lcdG: 2, t: 1, win: false, trig: '天井' }]
  });
  assert.equal(normalized.ver, '2');
  assert.equal(normalized.sourceVer, null);
  assert.equal(normalized.logs[0].legacy_trig, '天井');
}

function testIdempotentVersion2() {
  const input = {
    machine: 'L-SF6',
    ver: '2',
    sourceVer: '1',
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
        opponent: 'ザンギエフ',
        kiteiG: null,
        icatch: null,
        icatchNote: null,
        legacy_trig: '規定G'
      }
    ]
  };
  assert.deepEqual(normalizeSf6Export(input), input);
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

testExportVersion2();
testLegacyTrigPreserved();
testMissingVersionAsLegacy();
testIdempotentVersion2();
testUnknownTypePreserved();

console.log('sf6-schema tests passed');

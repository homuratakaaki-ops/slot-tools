/* マイログ→マイホレポ取り込みの新旧判定。
   myhorepo.html から該当関数だけを切り出して vm で走らせる
   （tests/myhorepo-bulk-bydate.test.js と同じ切り出し方式）。 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'myhorepo.html'), 'utf8');

function section(startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  assert.notEqual(start, -1, `${startMarker} not found`);
  const end = html.indexOf(endMarker, start);
  assert.notEqual(end, -1, `${endMarker} not found after ${startMarker}`);
  return html.slice(start, end);
}

const block = section('function mylogSavedAt', 'async function importFromMylog');
const ctx = vm.createContext({});
new vm.Script(block + '\nglobalThis.pickMylogImports = pickMylogImports;\nglobalThis.mylogSavedAt = mylogSavedAt;\nglobalThis.isNewerSavedAt = isNewerSavedAt;\n').runInContext(ctx);
const { pickMylogImports, mylogSavedAt, isNewerSavedAt } = ctx;

const nameOf = () => 'アイムジャグラーEX';
const IMPORTED = '2026-09-16T12:00:00.000Z';
const entry = (savedAt, g, big, reg) => ({
  savedAt, date: '2026-09-15', shop: 'A店', seat: '526', machineId: 'im_juggler_ex_6',
  machineName: 'アイムジャグラーEX', end: { g, big, reg, totalDiff: null },
});

/* --- 取り込み元の中の重複は、記録日時が新しい1件だけ残す（ネネちゃんの再現） --- */
{
  const src = [entry('2026-09-15T22:00:00.000Z', 1100, 2, 1), entry('2026-09-15T20:00:00.000Z', 700, 1, 0)];
  const r = pickMylogImports(src, new Map(), IMPORTED, nameOf);
  assert.equal(r.records.length, 1);
  assert.equal(r.records[0].games, 1100, '新しい記録（1,100G）が残る');
  assert.equal(r.skippedDup, 1);
  assert.equal(r.skippedOlder, 0);
  // 並び順が逆でも同じ結果になる
  const r2 = pickMylogImports([src[1], src[0]], new Map(), IMPORTED, nameOf);
  assert.equal(r2.records[0].games, 1100);
}

/* --- savedAt はマイログの記録日時、importedAt が取り込み時刻 --- */
{
  const r = pickMylogImports([entry('2026-09-15T22:00:00.000Z', 1100, 2, 1)], new Map(), IMPORTED, nameOf);
  assert.equal(r.records[0].savedAt, '2026-09-15T22:00:00.000Z');
  assert.equal(r.records[0].importedAt, IMPORTED);
  assert.equal(r.records[0].id, '2026-09-15|A店|im_juggler_ex_6|526');
  assert.equal(r.records[0].fromMylog, true);
}

/* --- 既存の方が新しければ上書きしない --- */
{
  const existing = new Map([['2026-09-15|A店|im_juggler_ex_6|526',
    { id: '2026-09-15|A店|im_juggler_ex_6|526', games: 5000, savedAt: '2026-09-16T09:00:00.000Z' }]]);
  const r = pickMylogImports([entry('2026-09-15T20:00:00.000Z', 700, 1, 0)], existing, IMPORTED, nameOf);
  assert.equal(r.records.length, 0, '5,000G の既存記録が残る');
  assert.equal(r.skippedOlder, 1);
}

/* --- 既存より新しいマイログは上書きする --- */
{
  const existing = new Map([['2026-09-15|A店|im_juggler_ex_6|526',
    { id: '2026-09-15|A店|im_juggler_ex_6|526', games: 700, savedAt: '2026-09-15T20:00:00.000Z' }]]);
  const r = pickMylogImports([entry('2026-09-15T22:00:00.000Z', 1100, 2, 1)], existing, IMPORTED, nameOf);
  assert.equal(r.records.length, 1);
  assert.equal(r.records[0].games, 1100);
  assert.equal(r.skippedOlder, 0);
}

/* --- 同時刻は上書きしない（取り込みを繰り返しても増減しない） --- */
{
  const same = '2026-09-15T22:00:00.000Z';
  const existing = new Map([['2026-09-15|A店|im_juggler_ex_6|526',
    { id: '2026-09-15|A店|im_juggler_ex_6|526', games: 1100, savedAt: same }]]);
  const r = pickMylogImports([entry(same, 1100, 2, 1)], existing, IMPORTED, nameOf);
  assert.equal(r.records.length, 0);
  assert.equal(r.skippedOlder, 1);
}

/* --- 保存日時を持たない古い記録は記録の日付で比べる --- */
{
  assert.equal(mylogSavedAt({ date: '2026-09-15' }), '2026-09-15');
  assert.equal(isNewerSavedAt('2026-09-15T00:00:01.000Z', '2026-09-15'), true, '同じ日なら時刻つきの方が新しい');
  assert.equal(isNewerSavedAt('2026-09-16', '2026-09-15T22:00:00.000Z'), true, '日付だけでも翌日なら新しい');
  const e = { date: '2026-09-15', shop: 'A店', seat: '526', machineId: 'im_juggler_ex_6', end: { g: 700, big: 1, reg: 0, totalDiff: null } };
  const r = pickMylogImports([e], new Map(), IMPORTED, nameOf);
  assert.equal(r.records[0].savedAt, '2026-09-15');
}

/* --- 店・台・日付が違えば別の記録 --- */
{
  const a = entry('2026-09-15T22:00:00.000Z', 1100, 2, 1);
  const b = { ...entry('2026-09-15T21:00:00.000Z', 900, 1, 1), seat: '527' };
  const c = { ...entry('2026-09-15T21:00:00.000Z', 800, 1, 1), shop: 'B店' };
  const d = { ...entry('2026-09-15T21:00:00.000Z', 600, 1, 1), date: '2026-09-14' };
  const r = pickMylogImports([a, b, c, d], new Map(), IMPORTED, nameOf);
  assert.equal(r.records.length, 4);
  assert.equal(r.skippedDup, 0);
}

/* --- 機種名が無い記録は nameOf で補う --- */
{
  const e = { ...entry('2026-09-15T22:00:00.000Z', 1100, 2, 1) };
  delete e.machineName;
  const r = pickMylogImports([e], new Map(), IMPORTED, nameOf);
  assert.equal(r.records[0].machineName, 'アイムジャグラーEX');
}

console.log('myhorepo import(mylog) tests passed');

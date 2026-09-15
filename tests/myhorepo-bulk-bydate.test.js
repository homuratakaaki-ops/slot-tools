/* マイホレポ「1台×複数日」モードの行の解釈。
   myhorepo.html から該当関数だけを切り出して vm で走らせる
   （tests/yutime-v3.test.js と同じ切り出し方式）。 */
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

const parserBlock = section('function normalizeBulkLine', '/* ---------- まとめて入力：モード ---------- */');
const ctx = vm.createContext({});
new vm.Script(parserBlock + '\nglobalThis.parseBulkByDate = parseBulkByDate;\nglobalThis.parseBulkDate = parseBulkDate;\n').runInContext(ctx);
const { parseBulkByDate, parseBulkDate } = ctx;

const TODAY = '2026-09-15';

function one(line, withDiff) {
  const r = parseBulkByDate(line, withDiff, TODAY);
  return { row: r.rows[0] || null, errors: r.errors.length };
}

/* --- 指示書の期待値表 --- */
{
  const { row } = one('9/14 624 0 2', false);
  assert.deepEqual(
    { date: row.date, games: row.games, big: row.big, reg: row.reg, diff: row.diff },
    { date: '2026-09-14', games: 624, big: 0, reg: 2, diff: null }
  );
}
{
  // 差枚なしのときは5つ目を読まない
  const { row } = one('9/13 3995 18 10 +820', false);
  assert.equal(row.diff, null);
  assert.equal(row.games, 3995);
}
{
  const { row } = one('9/13 3995 18 10 +820', true);
  assert.equal(row.diff, 820);
}
{
  // 全角マイナス
  const { row } = one('9/13 3995 18 10 −1200', true);
  assert.equal(row.diff, -1200);
}
{
  // 差枚ありでも5つ目が無い行はその行だけ未入力で通す
  const { row, errors } = one('9/13 3995 18 10', true);
  assert.equal(errors, 0);
  assert.equal(row.diff, null);
}
{
  // 全角数字・全角スラッシュ・全角スペース
  const { row } = one('９／１２　４１９５　１４　１９', false);
  assert.deepEqual(
    { date: row.date, games: row.games, big: row.big, reg: row.reg },
    { date: '2026-09-12', games: 4195, big: 14, reg: 19 }
  );
}
{
  // タブ区切り
  const { row } = one('9/12\t4195\t14\t19', false);
  assert.equal(row.date, '2026-09-12');
  assert.equal(row.games, 4195);
}
{
  // 年付き
  const { row } = one('2026/9/12 4195 14 19', false);
  assert.equal(row.date, '2026-09-12');
}
{
  // 今日より未来になる日付は前年（年またぎ）
  const { row } = one('12/30 1000 3 2', false);
  assert.equal(row.date, '2025-12-30');
}
{
  // G=0 は故障・非稼働として登録対象（読めなかった行ではない）
  const { row, errors } = one('9/11 0 0 0', false);
  assert.equal(errors, 0);
  assert.equal(row.games, 0);
}
{
  // 数値でない
  const { row, errors } = one('9/11 abc 0 0', false);
  assert.equal(row, null);
  assert.equal(errors, 1);
}
{
  // 列が足りない
  const { row, errors } = one('9/11 100', false);
  assert.equal(row, null);
  assert.equal(errors, 1);
}

/* --- 日付の受け付け方 --- */
assert.equal(parseBulkDate('9-14', TODAY), '2026-09-14');
assert.equal(parseBulkDate('09/14', TODAY), '2026-09-14');
assert.equal(parseBulkDate('2026-09-14', TODAY), '2026-09-14');
assert.equal(parseBulkDate('9/15', TODAY), '2026-09-15', '今日ちょうどは当年のまま');
assert.equal(parseBulkDate('9/16', TODAY), '2025-09-16', '今日より未来は前年');
assert.equal(parseBulkDate('2/30', TODAY), null, '存在しない日付');
assert.equal(parseBulkDate('13/1', TODAY), null);
assert.equal(parseBulkDate('9', TODAY), null);
assert.equal(parseBulkDate('26/9/14', TODAY), '2026-09-14', '3つ組は年月日として読む（2桁年は20xx）');
assert.equal(parseBulkDate('9/14/2026', TODAY), null, '年を最後に書いた形は受け付けない');

/* --- 複数行：読めない行があっても他は通す。空行は無視 --- */
{
  const r = parseBulkByDate('9/14 624 0 2\n\n9/11 abc 0 0\n9/12 4195 14 19', false, TODAY);
  assert.equal(r.rows.length, 2);
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].text, '9/11 abc 0 0', '読めなかった行は元の文字列を保つ');
  assert.equal(r.rows.map((x) => x.date).join(','), '2026-09-14,2026-09-12');
}

console.log('myhorepo bulk(1台×複数日) tests passed');

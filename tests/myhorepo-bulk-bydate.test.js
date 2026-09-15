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
  // 差枚なしで5列目がある行は「読めなかった行（列が多い）」。
  // 2026/9/16 の指示書で、余分な列を黙って捨てない方針に変えた
  const r = parseBulkByDate('9/13 3995 18 10 +820', false, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '列が多い');
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

/* --- 桁区切りのカンマと列過多（2026/9/16） --- */
{
  const { row, errors } = one('9/13 3,995 18 10', false);
  assert.equal(errors, 0);
  assert.deepEqual(
    { games: row.games, big: row.big, reg: row.reg },
    { games: 3995, big: 18, reg: 10 },
    '桁区切りのカンマは1つの数として読む'
  );
}
{
  const { row } = one('9/13 3,995 18 10 -1,200', true);
  assert.equal(row.games, 3995);
  assert.equal(row.diff, -1200, 'マイナスの桁区切り');
}
{
  const { row } = one('9/13 3,995 18 10 +1,000', true);
  assert.equal(row.diff, 1000, 'プラスの桁区切り');
}
{
  // 全角カンマ・全角数字
  const { row, errors } = one('9/13 ３，９９５ １８ １０', false);
  assert.equal(errors, 0);
  assert.equal(row.games, 3995, '全角カンマも桁区切りとして読む');
}
{
  const { row } = one('9/13 1,234,567 18 10', false);
  assert.equal(row.games, 1234567, 'カンマが複数あっても結合する');
}
{
  // 結合した結果が7桁を超える値は従来どおり数として受けない
  const r = parseBulkByDate('9/13 12,345,678 18 10', false, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '数字として読めない');
}
{
  // 3桁でないカンマは桁区切りにならない。項目にカンマが残り、数字として読めない
  const r = parseBulkByDate('9/13 3,99 18 10', false, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '数字として読めない', '3,99 は読めなかった行');
}
{
  // 差枚ありでも同じ（列数が合っていても項目が読めない）
  const r = parseBulkByDate('9/13 3,99 18 10', true, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '数字として読めない');
}
{
  // 前回の既知の穴：列数がちょうど合う不正カンマも塞がる（項目が割れないため）
  const r = parseBulkByDate('9/13 3,99 18', false, TODAY);
  assert.equal(r.rows.length, 0, '3,99 で列が合っても登録しない');
  assert.equal(r.errors.length, 1);
}
{
  const r = parseBulkByDate('9/13 3,,995 18 10', false, TODAY);
  assert.equal(r.rows.length, 0, '3,,995 も読めなかった行');
}
{
  const r = parseBulkByDate('9/13 , 18 10', false, TODAY);
  assert.equal(r.rows.length, 0, 'カンマ単独も読めなかった行');
  assert.equal(r.errors[0].why, '数字として読めない');
}
{
  const r = parseBulkByDate('9/13 3,,995 18 10', true, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '数字として読めない', '3,,995 は数字として読めない');
}
{
  // カンマ区切りの行（空白が1つも無い）。日付から始まる形もそのまま読む
  const { row, errors } = one('9/13,3995,18,10', false);
  assert.equal(errors, 0);
  assert.deepEqual(
    { date: row.date, games: row.games, big: row.big, reg: row.reg },
    { date: '2026-09-13', games: 3995, big: 18, reg: 10 }
  );
}
{
  // カンマ区切りの行では桁区切りの結合をしない。3桁ずつ割れた数は別の列になる
  const r = parseBulkByDate('9/13,3,995,18,10', false, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '列が多い');
}
{
  const r = parseBulkByDate('9/13 3995 18 10 5', false, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '列が多い', '差枚なしで5列は読めなかった行');
}
{
  const r = parseBulkByDate('9/13 3995 18 10 800 5', true, TODAY);
  assert.equal(r.rows.length, 0);
  assert.equal(r.errors[0].why, '列が多い', '差枚ありで6列は読めなかった行');
}
{
  // 回帰：従来どおりの行はそのまま通る
  const { row, errors } = one('9/13 3995 18 10', false);
  assert.equal(errors, 0);
  assert.equal(row.games, 3995);
}
{
  // 読めない理由が付く
  const r = parseBulkByDate('9/13 abc 18 10', false, TODAY);
  assert.equal(r.errors[0].why, '数字として読めない');
  const r2 = parseBulkByDate('13/45 3995 18 10', false, TODAY);
  assert.equal(r2.errors[0].why, '日付として読めない');
}

/* --- 1日×複数台（parseBulk） --- */
const dayBlock = section('function parseBulk(text, withSeat)', 'async function bulkAddUnits');
const ctx2 = vm.createContext({});
new vm.Script(
  section('function normalizeBulkLine', '// 9/14') +
  dayBlock +
  '\nglobalThis.parseBulk = parseBulk;\n'
).runInContext(ctx2);
const { parseBulk } = ctx2;
{
  const r = parseBulk('3,995 18 10', false);
  assert.equal(r.errors.length, 0);
  assert.equal(r.rows[0].games, 3995, '1日×複数台でも桁区切りを読む');
  assert.equal(r.rows[0].big, 18);
}
{
  const r = parseBulk('7609 28 21 820 5', false);
  assert.equal(r.rows.length, 0);
  assert.match(r.errors[0], /項目が多すぎます/, '列が多い行は登録しない');
}
{
  const r = parseBulk('846 7,609 28 21', true);
  assert.equal(r.errors.length, 0);
  assert.equal(r.rows[0].seat, 846);
  assert.equal(r.rows[0].games, 7609, '行頭に台番号がある形でも桁区切りを読む');
}
{
  const r = parseBulk('7609 28 12abc', false);
  assert.equal(r.rows.length, 0, '12abc は数として読まない');
}
{
  // 回帰：カンマ区切りの貼り付けは従来どおり通る（桁区切りにならないカンマは区切り）
  const r = parseBulk('7609,28,21', false);
  assert.equal(r.errors.length, 0);
  assert.deepEqual([r.rows[0].games, r.rows[0].big, r.rows[0].reg], [7609, 28, 21]);
  assert.equal(r.rows[0].diff, null);
}
{
  // 回帰の核心（2026/9/16）：カンマ区切り＋差枚。21,100 を桁区切りとして結合しない
  const r = parseBulk('7609,28,21,100', false);
  assert.equal(r.errors.length, 0);
  assert.deepEqual(
    [r.rows[0].games, r.rows[0].big, r.rows[0].reg, r.rows[0].diff],
    [7609, 28, 21, 100]
  );
}
{
  // カンマ区切り＋台番号付き
  const r = parseBulk('846,7609,28,21', true);
  assert.equal(r.errors.length, 0);
  assert.deepEqual(
    [r.rows[0].seat, r.rows[0].games, r.rows[0].big, r.rows[0].reg],
    [846, 7609, 28, 21]
  );
}
{
  // カンマのうしろに空白がある行は空白区切りの行。7609, が読めず登録しない
  const r = parseBulk('7609, 28, 21', false);
  assert.equal(r.rows.length, 0);
  assert.match(r.errors[0], /数字以外/);
}
{
  // 空白区切りの行では、項目の中の桁区切りだけを結合する（回帰）
  const r = parseBulk('7,609 28 21 -1,200', false);
  assert.equal(r.errors.length, 0);
  assert.deepEqual(
    [r.rows[0].games, r.rows[0].big, r.rows[0].reg, r.rows[0].diff],
    [7609, 28, 21, -1200]
  );
}

/* --- 採用判定（重複除外）：絞り込みより先に全記録へ当てる（2026/9/16） --- */
const adoptBlock = section('// 同じ店・台番号・日付が複数あるとき', 'async function summarize');
const ctx3 = vm.createContext({});
new vm.Script(adoptBlock + '\nglobalThis.adoptedIds = adoptedIds;\n').runInContext(ctx3);
const { adoptedIds } = ctx3;
{
  const old = { id: '2026-09-13|A店|my_juggler_v|526', shop: 'A店', seat: '526', date: '2026-09-13', machineId: 'my_juggler_v', savedAt: '2026-09-14T00:00:00.000Z' };
  const neo = { id: '2026-09-13|A店|im_juggler_ex_6|526', shop: 'A店', seat: '526', date: '2026-09-13', machineId: 'im_juggler_ex_6', savedAt: '2026-09-15T00:00:00.000Z' };
  const other = { id: '2026-09-13|A店|my_juggler_v|527', shop: 'A店', seat: '527', date: '2026-09-13', machineId: 'my_juggler_v', savedAt: '2026-09-14T00:00:00.000Z' };
  const adopted = adoptedIds([old, neo, other]);
  assert.equal(adopted.has(neo.id), true, '同じ店・台・日は savedAt が新しい方を採る');
  assert.equal(adopted.has(old.id), false);
  assert.equal(adopted.has(other.id), true, '重複でない記録はそのまま採る');
  // 古い機種で絞っても、採否は全記録から決めた結果を使う（重複が復活しない）
  const byOldMachine = [old, neo, other].filter((u) => u.machineId === 'my_juggler_v');
  assert.deepEqual(
    byOldMachine.filter((u) => adopted.has(u.id)).map((u) => u.seat),
    ['527'],
    '古い機種で絞ると、その日のその台は集計に入らない'
  );
  // 新しい機種で絞れば入る
  assert.deepEqual(
    [old, neo, other].filter((u) => u.machineId === 'im_juggler_ex_6' && adopted.has(u.id)).map((u) => u.seat),
    ['526']
  );
}
{
  // savedAt が同じときは id の大きい方。何度呼んでも同じ結果になる
  const a = { id: '2026-09-13|A店|aaa|526', shop: 'A店', seat: '526', date: '2026-09-13', savedAt: 'x' };
  const b = { id: '2026-09-13|A店|bbb|526', shop: 'A店', seat: '526', date: '2026-09-13', savedAt: 'x' };
  assert.equal(adoptedIds([a, b]).has(b.id), true);
  assert.equal(adoptedIds([b, a]).has(b.id), true);
}
{
  // 店が違えば別の台
  const a = { id: '2026-09-13|A店|m|526', shop: 'A店', seat: '526', date: '2026-09-13', savedAt: '1' };
  const b = { id: '2026-09-13|B店|m|526', shop: 'B店', seat: '526', date: '2026-09-13', savedAt: '2' };
  assert.equal(adoptedIds([a, b]).size, 2);
}

console.log('myhorepo bulk(1台×複数日) tests passed');

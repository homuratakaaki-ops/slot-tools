/* マイログの集計（totals）の検証。時給の分母は「円収支が確定した記録のG数」。
   mylog.html から totals() と補助関数だけを切り出して vm で走らせる
   （tests/myhorepo-bulk-bydate.test.js と同じ切り出し方式）。 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { moneyFromRecord, resultOf } from "../js/money.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = fs.readFileSync(path.join(root, "mylog.html"), "utf8");

/** 2スペース字下げで書かれた関数を、閉じ括弧の行まで取り出す */
function fn(name) {
  const start = html.indexOf(`  function ${name}(`);
  assert.notEqual(start, -1, `${name} not found`);
  const end = html.indexOf("\n  }\n", start);
  assert.notEqual(end, -1, `${name} の閉じ括弧が見つからない`);
  return html.slice(start, end + 4);
}

const ctx = vm.createContext({ moneyFromRecord, resultOf, Math, JSON, Number });
new vm.Script(
  [fn("num"), fn("grapeGames"), fn("grapeCount"), fn("totals")].join("\n") +
  "\nglobalThis.totals = totals;"
).runInContext(ctx);
const { totals } = ctx;

/* 記録の雛形。money を渡さなければ「＋1,000円」の確定した記録になる */
const rec = (games, money) => ({
  own: { games, counts: {} },
  start: { big: 0, reg: 0 }, end: { big: 0, reg: 0 },
  money: money === undefined ? { yen: 1000, hold: 100, startHold: 0, rate: 50, exchangeMai: 50 } : money,
});
const 確定 = (games) => rec(games);
const 未確定 = (games) => rec(games, { yen: 0, hold: 0, startHold: 0, rate: 50, exchangeMai: 50 });
const 円不明 = (games) => rec(games, { diff: 50, cash: null });
const 時給 = (t) => (t.cashN && t.cashGames > 0 ? Math.round(t.cash / (t.cashGames / 800)) : null);

/* --- 指示書（2026/9/27）の3ケース --- */
{
  // ネネちゃんの再現: ＋1,000円・800G と 収支未確定・800G
  const t = totals([確定(800), 未確定(800)]);
  assert.equal(t.cashGames, 800, "未確定のG数は分母に入らない");
  assert.equal(t.cash, 1000);
  assert.equal(時給(t), 1000, "＋500円/時 ではなく ＋1,000円/時");
  assert.equal(t.moneyN, 1, "未確定は勝敗の母数にも入らない");
}
{
  // 旧記録の円不明も同じ条件で分母から外れる
  const t = totals([確定(800), 円不明(800)]);
  assert.equal(t.cashGames, 800);
  assert.equal(時給(t), 1000);
  assert.equal(t.cashUnknown, 1);
  assert.equal(t.moneyN, 2, "円不明は勝敗の母数には入る");
  assert.equal(t.diff, 100, "差枚は円不明も合計する");
}
{
  // 全部が未確定なら時給も合計も出せない
  const t = totals([未確定(800), 未確定(1200)]);
  assert.equal(t.cashGames, 0);
  assert.equal(t.cashN, 0);
  assert.equal(時給(t), null);
  assert.equal(t.moneyN, 0);
}
{
  // 通常の記録だけなら、分母は自分のG数の合計と一致する
  const t = totals([確定(800), 確定(1200)]);
  assert.equal(t.cashGames, 2000);
  assert.equal(t.games, 2000);
  assert.equal(t.cash, 2000);
  assert.equal(時給(t), 800);
  assert.equal(`${t.win}/${t.lose}/${t.draw}`, "2/0/0");
}

console.log("mylog totals tests passed");

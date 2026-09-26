import assert from "node:assert/strict";
import { computeMoney, moneyFromRecord, resultOf } from "../js/money.js";

/* 指示書（2026/9/15）の期待値表をそのまま固定する。
   (yen, hold, startHold, rate, mai) → diff / cash */
const CASES = [
  { name: "未入力", in: [0, 0, 0, 50, 50], diff: null, cash: null },
  { name: "投資1000・0枚で終了（1件目の修正）", in: [1000, 0, 0, 50, 50], diff: -50, cash: -1000 },
  { name: "46枚貸し・50枚交換（2件目の修正）", in: [1000, 46, 0, 46, 50], diff: 0, cash: -80 },
  { name: "等価の勝ち", in: [1000, 100, 0, 50, 50], diff: 50, cash: 1000 },
  { name: "持ち込みのみ", in: [0, 300, 250, 50, 50], diff: 50, cash: 1000 },
  { name: "非等価＋持ち込み", in: [2000, 100, 50, 46, 50], diff: -42, cash: -1000 },
];

for (const c of CASES) {
  const [yen, hold, startHold, rate, mai] = c.in;
  const m = computeMoney({ yen, hold, startHold, rate, mai });
  assert.equal(m.diff, c.diff, `${c.name}: diff`);
  assert.equal(m.cash, c.cash, `${c.name}: cash`);
}

// 非等価＋持ち込みは「差枚 × 交換単価」とは一致しないのが正しい
{
  const m = computeMoney({ yen: 2000, hold: 100, startHold: 50, rate: 46, mai: 50 });
  assert.equal(Math.round((m.diff * 1000) / m.mai), -840, "旧式なら -840 になる");
  assert.equal(m.cash, -1000, "新式は -1000");
}

// 等価ラベルは rate === mai で切り替える（mai === 50 では判定しない）
assert.equal(computeMoney({ yen: 0, hold: 0, startHold: 0, rate: 50, mai: 50 }).isEquiv, true);
assert.equal(computeMoney({ yen: 0, hold: 0, startHold: 0, rate: 46, mai: 50 }).isEquiv, false);
assert.equal(computeMoney({ yen: 0, hold: 0, startHold: 0, rate: 47, mai: 47 }).isEquiv, true);

// レート未指定は等価（50枚）で補う
{
  const m = computeMoney({ yen: 1000, hold: 0, startHold: 0 });
  assert.equal(m.rate, 50);
  assert.equal(m.mai, 50);
  assert.equal(m.diff, -50);
  assert.equal(m.cash, -1000);
}

/* moneyFromRecord: 保存済みの diff / cash ではなく入力値から計算し直す */
{
  // 旧版が「収支なし」で保存した記録
  const legacyNull = { money: { yen: 1000, hold: 0, startHold: 0, rate: 50, exchangeMai: 50, diff: null, cash: null } };
  const m = moneyFromRecord(legacyNull);
  assert.equal(m.legacy, false);
  assert.equal(m.diff, -50);
  assert.equal(m.cash, -1000);
}
{
  // 旧版が非等価を「差枚×交換単価」で保存した記録
  const wrongCash = { money: { yen: 1000, hold: 46, startHold: 0, rate: 46, exchangeMai: 50, diff: 0, cash: 0 } };
  const m = moneyFromRecord(wrongCash);
  assert.equal(m.legacy, false);
  assert.equal(m.diff, 0);
  assert.equal(m.cash, -80);
}
{
  // rate / exchangeMai を持たない古い記録は保存済みの値にフォールバックする
  const noRates = { money: { yen: 1000, hold: 100, diff: 50, cash: 1000 } };
  const m = moneyFromRecord(noRates);
  assert.equal(m.legacy, true);
  assert.equal(m.diff, 50);
  assert.equal(m.cash, 1000);
}
{
  // money 自体が無い記録は収支なし
  const m = moneyFromRecord({});
  assert.equal(m.legacy, true);
  assert.equal(m.hasMoney, false);
  assert.equal(m.diff, null);
  assert.equal(m.cash, null);
}

/* --- resultOf: 勝ち負けは円で決める --- */
const R = (yen, hold, startHold, rate, mai) => resultOf(computeMoney({ yen, hold, startHold, rate, mai }));
assert.equal(R(1000, 100, 0, 50, 50), "win", "+1,000円は勝ち");
assert.equal(R(1000, 0, 0, 50, 50), "lose", "投資1,000円・0枚で終了は負け");
assert.equal(R(1000, 46, 0, 46, 50), "lose", "差枚±0枚でも円が−80円なら負け");
assert.equal(R(1000, 50, 0, 50, 50), "draw", "±0円は引き分け");
assert.equal(R(0, 0, 0, 50, 50), null, "未入力は判定なし");
// 差枚で判定していた頃は「差枚±0枚」が勝ち扱いだった
assert.equal(computeMoney({ yen: 1000, hold: 46, startHold: 0, rate: 46, mai: 50 }).diff, 0);

// 記録から: 円で判定する。旧記録は保存済みの値で判定する
assert.equal(resultOf(moneyFromRecord({ money: { yen: 1000, hold: 46, startHold: 0, rate: 46, exchangeMai: 50, diff: 0, cash: 0 } })), "lose", "保存値ではなく入力値から出した円で判定する");
assert.equal(resultOf(moneyFromRecord({ money: { yen: 1000, hold: 100, diff: 50, cash: 1000 } })), "win", "legacy は保存済みの cash で判定");
assert.equal(resultOf(moneyFromRecord({ money: { yen: 1000, hold: 100, diff: 50, cash: -80 } })), "lose", "legacy も cash が優先");
assert.equal(resultOf(moneyFromRecord({})), null, "収支なしの記録は判定なし");
// cash を持たない記録だけ差枚で判定する
assert.equal(resultOf({ diff: 50, cash: null }), "win");
assert.equal(resultOf({ diff: -50, cash: null }), "lose");
assert.equal(resultOf({ diff: 0, cash: null }), "draw");
assert.equal(resultOf({ diff: null, cash: null }), null);
assert.equal(resultOf(null), null);

/* --- 指示書の勝率3ケース --- */
function rate3(records) {
  let win = 0, lose = 0, draw = 0;
  for (const m of records) {
    const res = resultOf(m);
    if (res === "win") win++;
    else if (res === "lose") lose++;
    else if (res === "draw") draw++;
  }
  const n = win + lose + draw;
  return { win, lose, draw, n, pct: n ? Math.round((100 * win) / n) : null };
}
{
  // −1,000円 と −80円（差枚0枚）
  const t = rate3([computeMoney({ yen: 1000, hold: 0, startHold: 0, rate: 50, mai: 50 }), computeMoney({ yen: 1000, hold: 46, startHold: 0, rate: 46, mai: 50 })]);
  assert.equal(`${t.win}/${t.lose}/${t.draw}/${t.pct}`, "0/2/0/0");
}
{
  // +1,000円・±0円・−80円
  const t = rate3([
    computeMoney({ yen: 1000, hold: 100, startHold: 0, rate: 50, mai: 50 }),
    computeMoney({ yen: 1000, hold: 50, startHold: 0, rate: 50, mai: 50 }),
    computeMoney({ yen: 1000, hold: 46, startHold: 0, rate: 46, mai: 50 }),
  ]);
  assert.equal(`${t.win}/${t.lose}/${t.draw}/${t.pct}`, "1/1/1/33");
}

/* --- 円が出せない旧記録は差枚を残し、勝敗を差枚で判定する（2026/9/16 指示書） --- */
{
  // 差枚だけが残っている記録。円は不明のまま（0円に倒さない）
  const m = moneyFromRecord({ money: { diff: 50, cash: null } });
  assert.equal(m.legacy, true);
  assert.equal(m.hasMoney, true);
  assert.equal(m.diff, 50);
  assert.equal(m.cash, null);
  assert.equal(resultOf(m), "win", "円が無くても差枚で勝ち");
}
assert.equal(resultOf(moneyFromRecord({ money: { diff: 0, cash: null } })), "draw");
assert.equal(resultOf(moneyFromRecord({ money: { diff: -50, cash: null } })), "lose");
{
  // 円だけが残っている記録は円で判定する
  const m = moneyFromRecord({ money: { cash: 1000 } });
  assert.equal(m.diff, null);
  assert.equal(m.cash, 1000);
  assert.equal(resultOf(m), "win");
}
{
  // 集計の扱い：円不明は円の合計に入れず、勝敗の母数には入れる
  const rows = [
    moneyFromRecord({ money: { yen: 1000, hold: 100, startHold: 0, rate: 50, exchangeMai: 50 } }), // +1,000円
    moneyFromRecord({ money: { diff: 50, cash: null } }),                                          // 円不明・勝ち
  ];
  let cash = 0, cashN = 0, unknown = 0, moneyN = 0, win = 0;
  for (const m of rows) {
    const res = resultOf(m);
    if (!res) continue;
    moneyN++;
    if (res === "win") win++;
    if (m.cash != null) { cash += m.cash; cashN++; } else unknown++;
  }
  assert.equal(`${cash}/${cashN}/${unknown}/${moneyN}/${win}`, "1000/1/1/2/2");
}

console.log("money tests passed");

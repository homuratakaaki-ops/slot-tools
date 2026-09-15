import assert from "node:assert/strict";
import { computeMoney, moneyFromRecord } from "../js/money.js";

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

console.log("money tests passed");

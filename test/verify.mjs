/**
 * verify.mjs — エンジンの自己検証
 *
 * 既知の設定の確率値で疑似データを生成し、エンジンが正しい設定を
 * 推定できるかを確認する。IDEAS.md「シミュレーションによる自己検証」の実装。
 *
 * 実行: node test/verify.mjs
 */
import { readFileSync } from "node:fs";
import { estimate } from "../js/estimator.js";

const machine = JSON.parse(
  readFileSync(new URL("../data/machines/my_juggler_v.json", import.meta.url))
);

// --- 二項乱数(nが大きいので正規近似 + 小確率は直接試行) ---
function binomial(n, p) {
  if (n * p < 30) {
    let k = 0;
    for (let i = 0; i < n; i++) if (Math.random() < p) k++;
    return k;
  }
  const mean = n * p;
  const sd = Math.sqrt(n * p * (1 - p));
  let g;
  do {
    const u1 = Math.random(), u2 = Math.random();
    g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  } while (false);
  return Math.max(0, Math.min(n, Math.round(mean + sd * g)));
}

function den(machine, id, s) {
  return machine.elements.find((e) => e.id === id).denominators[String(s)];
}

/** 設定sでgamesゲーム回した疑似観測を生成 */
function simulate(machine, s, games, mode) {
  const counts = {};
  if (mode === "simple") {
    for (const id of ["big_total", "reg_total", "grape"]) {
      counts[id] = binomial(games, 1 / den(machine, id, s));
    }
  } else {
    for (const id of ["solo_big", "cherry_big", "solo_reg", "cherry_reg", "grape"]) {
      counts[id] = binomial(games, 1 / den(machine, id, s));
    }
  }
  return { mode, games, counts };
}

// --- 検証1: 各設定×G数ごとのTop-1的中率と正解設定の平均事後確率 ---
function accuracyTest(mode, games, trials) {
  console.log(`\n■ ${mode}モード / ${games}G / ${trials}試行`);
  console.log("真の設定 | Top-1的中率 | 正解の平均事後確率");
  for (const s of machine.machine.settings) {
    let hit = 0, sumPost = 0;
    for (let t = 0; t < trials; t++) {
      const obs = simulate(machine, s, games, mode);
      const { posterior } = estimate(machine, obs, null);
      const top = posterior.indexOf(Math.max(...posterior)) + 1;
      if (top === s) hit++;
      sumPost += posterior[s - 1];
    }
    console.log(
      `  設定${s}   |   ${(100 * hit / trials).toFixed(1).padStart(5)}%   |   ${(100 * sumPost / trials).toFixed(1)}%`
    );
  }
}

// --- 検証2: 収束性(設定6のデータでG数を増やすと事後確率が上がるか) ---
function convergenceTest(mode, trueSetting) {
  console.log(`\n■ 収束性: 真の設定${trueSetting} / ${mode}モード (各500試行平均)`);
  console.log("G数    | 設定" + trueSetting + "の平均事後確率");
  for (const games of [1000, 3000, 5000, 8000]) {
    let sum = 0;
    const trials = 500;
    for (let t = 0; t < trials; t++) {
      const obs = simulate(machine, trueSetting, games, mode);
      const { posterior } = estimate(machine, obs, null);
      sum += posterior[trueSetting - 1];
    }
    console.log(`${String(games).padEnd(6)} | ${(100 * sum / trials).toFixed(1)}%`);
  }
}

// --- 検証3: 事前分布の影響(高設定寄り事前で結果が動くか) ---
function priorTest() {
  console.log("\n■ 事前分布の影響: 設定4の3000Gデータ(500試行平均)");
  const trials = 500;
  const priors = {
    "均等": null,
    "イベント想定(1:1:1:2:2:3)": [1, 1, 1, 2, 2, 3],
    "通常営業想定(6:3:2:1:0.5:0.5)": [6, 3, 2, 1, 0.5, 0.5],
  };
  for (const [label, prior] of Object.entries(priors)) {
    const avg = new Array(6).fill(0);
    for (let t = 0; t < trials; t++) {
      const obs = simulate(machine, 4, 3000, "simple");
      const { posterior } = estimate(machine, obs, prior);
      posterior.forEach((p, i) => (avg[i] += p / trials));
    }
    console.log(`  ${label}: [${avg.map((p) => (100 * p).toFixed(1)).join(", ")}]%`);
  }
}

// --- 検証4: 解析的サニティチェック(期待値ぴったりのデータで正解が最尤になるか) ---
function sanityTest() {
  console.log("\n■ サニティ: 期待値通りのデータで正解設定が最大事後確率になるか");
  let allOk = true;
  for (const s of machine.machine.settings) {
    const games = 100000;
    const counts = {};
    for (const id of ["big_total", "reg_total", "grape"]) {
      counts[id] = Math.round(games / den(machine, id, s));
    }
    const { posterior } = estimate(machine, { mode: "simple", games, counts }, null);
    const top = posterior.indexOf(Math.max(...posterior)) + 1;
    const ok = top === s;
    if (!ok) allOk = false;
    console.log(`  設定${s}: 推定=設定${top} ${ok ? "OK" : "NG"}`);
  }
  return allOk;
}


// --- 検証5: 区間分割の不変性(同一データを2区間に分けても事後確率が一致するか) ---
function segmentTest() {
  console.log("\n■ 区間分割の不変性: 単一区間 vs 打ち始め前+実戦区間の分割");
  let allOk = true;
  for (const s of machine.machine.settings) {
    const games = 6000, split = 2500;
    const big = binomial(games, 1 / den(machine, "big_total", s));
    const reg = binomial(games, 1 / den(machine, "reg_total", s));
    const bigA = Math.min(big, binomial(split, 1 / den(machine, "big_total", s)));
    const regA = Math.min(reg, binomial(split, 1 / den(machine, "reg_total", s)));
    const single = estimate(machine, { mode: "simple", games, counts: { big_total: big, reg_total: reg } }, null);
    const seg = estimate(machine, { segments: [
      { games: split, counts: { big_total: bigA, reg_total: regA } },
      { games: games - split, counts: { big_total: big - bigA, reg_total: reg - regA } },
    ]}, null);
    const maxDiff = Math.max(...single.posterior.map((p, i) => Math.abs(p - seg.posterior[i])));
    const ok = maxDiff < 1e-12;
    if (!ok) allOk = false;
    console.log(`  設定${s}: 最大差=${maxDiff.toExponential(2)} ${ok ? "OK" : "NG"}`);
  }
  return allOk;
}

console.log("=== マイジャグラーV 判別エンジン検証 ===");
const sane = sanityTest();
accuracyTest("simple", 3000, 1000);
accuracyTest("simple", 8000, 1000);
accuracyTest("detail", 8000, 1000);
convergenceTest("simple", 6);
priorTest();
const segOk = segmentTest();
console.log(`\n=== サニティチェック: ${sane ? "全設定OK" : "失敗あり"} / 区間分割: ${segOk ? "全設定OK" : "失敗あり"} ===`);

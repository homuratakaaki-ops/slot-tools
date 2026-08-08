/**
 * estimator.js — 設定判別ベイズ推定エンジン
 *
 * 機種データ(data/machines/*.json)を受け取り、観測データから
 * 各設定の事後確率を計算する。ブラウザ/Node共用・依存ゼロ。
 *
 * 数理:
 *   P(設定s | データ) ∝ P(データ | 設定s) × prior(s)
 *   各要素は二項分布で独立近似する。
 *   logL(s) = Σ_e [ k_e·ln(p_es) + (n_e − k_e)·ln(1 − p_es) ]
 *   (二項係数は設定間で共通のため省略)
 */

/**
 * 事後確率を計算する。
 *
 * @param {object} machine  機種データJSON(パース済み)
 * @param {object} obs      観測データ
 *   {
 *     mode: "simple" | "detail",
 *     games: 総回転数(整数, 必須),
 *     counts: { 要素id: 回数 }  // 未入力要素はキーごと省略(0とは区別する)
 *   }
 * @param {number[]|null} prior  設定1〜6の事前重み(長さ6)。nullで均等。
 * @returns {{
 *   posterior: number[],          // 設定1〜6の事後確率(合計1)
 *   logLikelihoods: number[],     // 各設定の対数尤度(診断用)
 *   usedElements: string[],       // 尤度計算に使った要素id
 *   warnings: string[]
 * }}
 */
export function estimate(machine, obs, prior = null) {
  const settings = machine.machine.settings;
  const nS = settings.length;
  const warnings = [];

  validateObs(machine, obs, warnings);

  const p = normalizePrior(prior, nS);

  const mode = machine.input_rules.modes.find((m) => m.id === obs.mode);
  if (!mode) throw new Error(`未知の入力モード: ${obs.mode}`);

  const elements = Object.fromEntries(machine.elements.map((e) => [e.id, e]));
  const usedElements = [];
  const logL = new Array(nS).fill(0);

  for (const id of mode.uses) {
    const el = elements[id];
    if (!el) throw new Error(`機種データに要素がありません: ${id}`);
    if (!(id in obs.counts)) continue; // 任意要素の未入力はスキップ
    const k = obs.counts[id];
    const n = obs.games;
    if (k > n) throw new Error(`${id}: 回数(${k})が総回転数(${n})を超えています`);
    usedElements.push(id);
    for (let i = 0; i < nS; i++) {
      const ps = 1 / el.denominators[String(settings[i])];
      logL[i] += k * Math.log(ps) + (n - k) * Math.log(1 - ps);
    }
  }

  if (usedElements.length === 0) {
    warnings.push("尤度計算に使える入力がありません。事前分布をそのまま返します。");
    return { posterior: p.slice(), logLikelihoods: logL, usedElements, warnings };
  }

  // log-sum-exp で安定に正規化
  const maxL = Math.max(...logL);
  const unnorm = logL.map((l, i) => Math.exp(l - maxL) * p[i]);
  const z = unnorm.reduce((a, b) => a + b, 0);
  const posterior = unnorm.map((u) => u / z);

  return { posterior, logLikelihoods: logL, usedElements, warnings };
}

/** 事前分布の正規化。null→均等。 */
export function normalizePrior(prior, nS) {
  if (prior == null) return new Array(nS).fill(1 / nS);
  if (prior.length !== nS) throw new Error(`事前分布の長さが不正です: ${prior.length}`);
  if (prior.some((w) => w < 0)) throw new Error("事前分布に負の重みがあります");
  const z = prior.reduce((a, b) => a + b, 0);
  if (z <= 0) throw new Error("事前分布の合計が0以下です");
  return prior.map((w) => w / z);
}

/** 入力の整合チェック(machine.input_rules.validation の実装) */
function validateObs(machine, obs, warnings) {
  if (!Number.isInteger(obs.games) || obs.games <= 0) {
    throw new Error("総回転数(games)は正の整数で入力してください");
  }
  for (const [id, k] of Object.entries(obs.counts)) {
    if (!Number.isInteger(k) || k < 0) {
      throw new Error(`${id}: 回数は0以上の整数で入力してください`);
    }
  }
  // 詳細モード: 内訳と合計の両方が入力された場合の回数整合チェック
  const c = obs.counts;
  if (obs.mode === "detail") {
    if ("reg_total" in c && "solo_reg" in c && "cherry_reg" in c) {
      if (c.solo_reg + c.cherry_reg !== c.reg_total) {
        warnings.push(
          `REG内訳(${c.solo_reg}+${c.cherry_reg})が合計(${c.reg_total})と一致しません。内訳のみを尤度計算に使用します。`
        );
      }
    }
    if ("big_total" in c && "solo_big" in c && "cherry_big" in c) {
      if (c.solo_big + c.cherry_big > c.big_total) {
        warnings.push(
          `BIG内訳(${c.solo_big}+${c.cherry_big})が合計(${c.big_total})を超えています。入力を確認してください。`
        );
      }
      // 注: BIGは特殊役重複等が別にあるため「未満」は正常
    }
  }
  if (obs.games < 1000) {
    warnings.push("総回転数が1000G未満です。判別精度は参考程度になります。");
  }
}

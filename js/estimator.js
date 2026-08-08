/**
 * estimator.js — 設定判別ベイズ推定エンジン
 *
 * 機種データ(data/machines/*.json)を受け取り、観測データから
 * 各設定の事後確率を計算する。ブラウザ/Node共用・依存ゼロ。
 *
 * 数理:
 *   P(設定s | データ) ∝ P(データ | 設定s) × prior(s)
 *   各要素は二項分布で独立近似する。
 *   logL(s) = Σ_seg Σ_e [ k·ln(p_es) + (n_seg − k)·ln(1 − p_es) ]
 *   (二項係数は設定間で共通のため省略)
 *
 * 観測は2形式に対応する:
 *   A) 区間形式(推奨): { segments: [ { games, counts }, ... ] }
 *      観測窓が異なるデータ(打ち始め前の台データ / 自分の実戦区間)を
 *      別区間として渡す。二項対数尤度は加法的なので、同一区間を
 *      分割しても結果は変わらないことが保証される。
 *   B) 従来形式: { mode, games, counts } — 単一区間。後方互換用。
 */

export function estimate(machine, obs, prior = null) {
  const settings = machine.machine.settings;
  const nS = settings.length;
  const warnings = [];
  const p = normalizePrior(prior, nS);
  const elements = Object.fromEntries(machine.elements.map((e) => [e.id, e]));

  let segments;
  if (Array.isArray(obs.segments)) {
    segments = obs.segments;
  } else {
    segments = [legacyToSegment(machine, obs, warnings)];
  }

  const usedElements = [];
  const logL = new Array(nS).fill(0);
  let totalGames = 0;

  segments.forEach((seg, si) => {
    if (!Number.isInteger(seg.games) || seg.games < 0) {
      throw new Error(`区間${si + 1}: G数は0以上の整数で入力してください`);
    }
    if (seg.games === 0) return;
    totalGames += seg.games;
    for (const [id, k] of Object.entries(seg.counts || {})) {
      const el = elements[id];
      if (!el) throw new Error(`機種データに要素がありません: ${id}`);
      if (!Number.isInteger(k) || k < 0) {
        throw new Error(`${el.label}: 回数は0以上の整数で入力してください`);
      }
      if (k > seg.games) {
        throw new Error(`${el.label}: 回数(${k})が区間のG数(${seg.games})を超えています`);
      }
      if (!usedElements.includes(id)) usedElements.push(id);
      for (let i = 0; i < nS; i++) {
        const ps = 1 / el.denominators[String(settings[i])];
        logL[i] += k * Math.log(ps) + (seg.games - k) * Math.log(1 - ps);
      }
    }
  });

  if (totalGames > 0 && totalGames < 1000) {
    warnings.push("総回転数が1000G未満です。判別精度は参考程度になります。");
  }
  if (usedElements.length === 0) {
    warnings.push("尤度計算に使える入力がありません。事前分布をそのまま返します。");
    return { posterior: p.slice(), logLikelihoods: logL, usedElements, warnings };
  }

  const maxL = Math.max(...logL);
  const unnorm = logL.map((l, i) => Math.exp(l - maxL) * p[i]);
  const z = unnorm.reduce((a, b) => a + b, 0);
  const posterior = unnorm.map((u) => u / z);

  return { posterior, logLikelihoods: logL, usedElements, warnings };
}

function legacyToSegment(machine, obs, warnings) {
  if (!Number.isInteger(obs.games) || obs.games <= 0) {
    throw new Error("総回転数(games)は正の整数で入力してください");
  }
  const mode = machine.input_rules.modes.find((m) => m.id === obs.mode);
  if (!mode) throw new Error(`未知の入力モード: ${obs.mode}`);
  const c = obs.counts || {};
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
    }
  }
  const counts = {};
  for (const id of mode.uses) if (id in c) counts[id] = c[id];
  return { games: obs.games, counts };
}

export function normalizePrior(prior, nS) {
  if (prior == null) return new Array(nS).fill(1 / nS);
  if (prior.length !== nS) throw new Error(`事前分布の長さが不正です: ${prior.length}`);
  if (prior.some((w) => w < 0)) throw new Error("事前分布に負の重みがあります");
  const z = prior.reduce((a, b) => a + b, 0);
  if (z <= 0) throw new Error("事前分布の合計が0以下です");
  return prior.map((w) => w / z);
}

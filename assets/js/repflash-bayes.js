(function(){
  "use strict";

  const DEFAULT_A_MODE = "通常A";

  function normalizePrior(prior){
    const entries = Object.entries(prior || {});
    const total = entries.reduce((sum, [, value]) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) && numeric > 0 ? sum + numeric : sum;
    }, 0);
    if(total <= 0){
      return Object.fromEntries(entries.map(([mode]) => [mode, 0]));
    }
    return Object.fromEntries(entries.map(([mode, value]) => {
      const numeric = Number(value);
      return [mode, Number.isFinite(numeric) && numeric > 0 ? numeric / total * 100 : 0];
    }));
  }

  function applyExclusions(prior, excludedModes){
    const excluded = new Set(excludedModes || []);
    const next = Object.fromEntries(Object.entries(prior || {}).map(([mode, value]) => [
      mode,
      excluded.has(mode) ? 0 : value
    ]));
    return normalizePrior(next);
  }

  function estimate({ rates, prior, games, count, aMode = DEFAULT_A_MODE }){
    const normalizedPrior = normalizePrior(prior);
    const gameValue = Number(games);
    const countValue = Number(count);
    if(!Number.isFinite(gameValue) || gameValue < 0){
      throw new Error("games must be a non-negative number");
    }
    if(!Number.isFinite(countValue) || countValue < 0){
      throw new Error("count must be a non-negative number");
    }

    const modes = Object.keys(normalizedPrior);
    const logWeights = modes.map(mode => {
      const priorValue = normalizedPrior[mode];
      const rate = Number((rates || {})[mode]);
      if(priorValue <= 0 || !Number.isFinite(rate) || rate <= 0){
        return [mode, Number.NEGATIVE_INFINITY];
      }
      const lambda = gameValue / rate;
      const logLikelihood = lambda === 0
        ? (countValue === 0 ? 0 : Number.NEGATIVE_INFINITY)
        : (-lambda + countValue * Math.log(lambda));
      return [mode, Math.log(priorValue / 100) + logLikelihood];
    });

    const maxLog = Math.max(...logWeights.map(([, value]) => value));
    if(!Number.isFinite(maxLog)){
      const posterior = Object.fromEntries(modes.map(mode => [mode, 0]));
      return { posterior, pNotA: 0 };
    }

    const weights = logWeights.map(([mode, value]) => [mode, Math.exp(value - maxLog)]);
    const totalWeight = weights.reduce((sum, [, value]) => sum + value, 0);
    const posterior = Object.fromEntries(weights.map(([mode, value]) => [
      mode,
      totalWeight > 0 ? value / totalWeight * 100 : 0
    ]));

    const pNotA = 100 - (posterior[aMode] || 0);
    return { posterior, pNotA };
  }

  // 1リプレイあたりのリプフラ発生率。
  // 解析値は「1/xxx G」で公表されているため、リプレイ確率（1/replayCycle）で割って
  // 「1リプレイあたり」に直す。p = replayCycle / rate
  function replayFlashRate(rate, replayCycle){
    const rateValue = Number(rate);
    const cycleValue = Number(replayCycle);
    if(!Number.isFinite(rateValue) || rateValue <= 0) return 0;
    if(!Number.isFinite(cycleValue) || cycleValue <= 0) return 0;
    const p = cycleValue / rateValue;
    return p > 0 && p < 1 ? p : 0;
  }

  function estimateByReplays({ rates, replayCycle, prior, replays, flashes, aMode = DEFAULT_A_MODE }){
    const normalizedPrior = normalizePrior(prior);
    const replayValue = Number(replays);
    const flashValue = Number(flashes);
    if(!Number.isInteger(replayValue) || replayValue < 0){
      throw new Error("replays must be a non-negative integer");
    }
    if(!Number.isInteger(flashValue) || flashValue < 0){
      throw new Error("flashes must be a non-negative integer");
    }
    if(flashValue > replayValue){
      throw new Error("flashes must not exceed replays");
    }

    const modes = Object.keys(normalizedPrior);
    // 二項分布の尤度。C(n,k) は全モード共通のため省略する
    const logWeights = modes.map(mode => {
      const priorValue = normalizedPrior[mode];
      const p = replayFlashRate((rates || {})[mode], replayCycle);
      if(priorValue <= 0 || p <= 0){
        return [mode, Number.NEGATIVE_INFINITY];
      }
      const logLikelihood = flashValue * Math.log(p) + (replayValue - flashValue) * Math.log(1 - p);
      return [mode, Math.log(priorValue / 100) + logLikelihood];
    });

    const maxLog = Math.max(...logWeights.map(([, value]) => value));
    if(!Number.isFinite(maxLog)){
      const posterior = Object.fromEntries(modes.map(mode => [mode, 0]));
      return { posterior, pNotA: 0 };
    }

    const weights = logWeights.map(([mode, value]) => [mode, Math.exp(value - maxLog)]);
    const totalWeight = weights.reduce((sum, [, value]) => sum + value, 0);
    const posterior = Object.fromEntries(weights.map(([mode, value]) => [
      mode,
      totalWeight > 0 ? value / totalWeight * 100 : 0
    ]));

    const pNotA = 100 - (posterior[aMode] || 0);
    return { posterior, pNotA };
  }

  window.RepflashBayes = {
    normalizePrior,
    applyExclusions,
    estimate,
    replayFlashRate,
    estimateByReplays
  };
})();

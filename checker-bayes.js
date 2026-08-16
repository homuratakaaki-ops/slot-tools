(function(){
  'use strict';

  function parseRate(raw){
    const m=String(raw||'').trim().match(/^(?:1\s*\/\s*)?(\d+(?:\.\d+)?)$/);
    if(!m)return null;
    const den=Number(m[1]);
    if(!Number.isFinite(den)||den<=1||den>100000)return null;
    return 1/den;
  }

  function logAddProb(logValue,p,count){
    if(count<=0)return logValue;
    if(p<=0)return -Infinity;
    return logValue+count*Math.log(p);
  }

  function addBinomial(logValue,n,d,p){
    n=Number(n)||0;
    d=Number(d)||0;
    if(d<=0)return logValue;
    if(n<0||n>d)return NaN;
    if(p<=0)return n>0?-Infinity:logValue;
    if(p>=1)return n<d?-Infinity:logValue;
    return logValue+n*Math.log(p)+(d-n)*Math.log(1-p);
  }

  function logSumExp(values){
    const finite=values.filter(Number.isFinite);
    if(!finite.length)return -Infinity;
    const max=Math.max.apply(null,finite);
    const total=finite.reduce((a,v)=>a+Math.exp(v-max),0);
    return max+Math.log(total);
  }

  function estimate(spec){
    const settings=(spec.settings||[]).slice();
    if(!settings.length)return {contradiction:true,message:'settings missing'};
    const labels=spec.labels||{};
    const logs=settings.map(()=>-Math.log(settings.length));
    const excluded=new Set();
    const reasons=[];
    let evidenceCount=0;
    let invalid=false;

    (spec.exclusions||[]).forEach(rule=>{
      const count=Number(rule.count)||0;
      if(count<=0)return;
      evidenceCount+=count;
      (rule.exclude||[]).forEach(s=>excluded.add(Number(s)));
      reasons.push({label:rule.label,count,exclude:(rule.exclude||[]).map(Number)});
    });

    settings.forEach((setting,i)=>{
      if(excluded.has(Number(setting)))logs[i]=-Infinity;
    });

    (spec.binomial||[]).forEach(ev=>{
      const d=Number(ev.total)||0;
      const n=Number(ev.hit)||0;
      if(d<=0)return;
      evidenceCount+=d;
      settings.forEach((setting,i)=>{
        if(!Number.isFinite(logs[i]))return;
        const p=Number((ev.probs||{})[setting]);
        const next=addBinomial(logs[i],n,d,p);
        if(Number.isNaN(next)){invalid=true;return;}
        logs[i]=next;
      });
    });

    (spec.multinomial||[]).forEach(ev=>{
      const counts=ev.counts||{};
      const total=Object.values(counts).reduce((a,b)=>a+(Number(b)||0),0);
      if(total<=0)return;
      evidenceCount+=total;
      settings.forEach((setting,i)=>{
        if(!Number.isFinite(logs[i]))return;
        const probs=(ev.probs||{})[setting]||{};
        Object.keys(counts).forEach(key=>{
          logs[i]=logAddProb(logs[i],Number(probs[key])||0,Number(counts[key])||0);
        });
      });
    });

    if(invalid)return {contradiction:true,message:'invalid count'};
    if(evidenceCount<=0)return {empty:true};

    const norm=logSumExp(logs);
    if(!Number.isFinite(norm))return {contradiction:true,reasons};
    const posterior={};
    settings.forEach((setting,i)=>{
      posterior[setting]=Number.isFinite(logs[i])?Math.exp(logs[i]-norm):0;
    });
    const high=settings.filter(s=>Number(s)>=4).reduce((a,s)=>a+(posterior[s]||0),0);
    const low=settings.filter(s=>Number(s)<=2).reduce((a,s)=>a+(posterior[s]||0),0);
    return {posterior,high,low,reasons,labels,evidenceCount};
  }

  function percent(v){
    return (Math.max(0,Math.min(1,Number(v)||0))*100).toFixed(1).replace(/\.0$/,'')+'%';
  }

  window.CheckerBayes={parseRate,estimate,percent};
})();

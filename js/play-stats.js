'use strict';
(function(root){
  const enabled=['tokyoghoul'];
  const defs={tokyoghoul:{
    id:'tokyoghoul',cz:['レミニセンス','大喰いの利世'],ep:'エピソードボーナス',at:'AT',judge:'有馬ジャッジメント',excludeAt:['死神後'],
    atCauses:{'レミニセンス':'レミ経由','大喰いの利世':'利世経由','EP後':'EP経由','規定G数':'直撃（規定G数）','レア役':'直撃（レア役）','天井':'天井','引き戻し':'引き戻し','不明':'不明'},
    returnG:{'レミニセンス':0,'大喰いの利世':0,'有馬ジャッジメント':6,'AT':0},
    hitTriggers:['規定G数','レア役','天井','引き戻し','不明'],
    setup:[
      {key:'c3',label:'CZスルー回数',type:'num'},
      {key:'seatState',label:'着席時の状況',type:'select',options:['resetConfirmed','resetGuess','keepConfirmed','unknown'],optionLabels:{resetConfirmed:'リセット確認',resetGuess:'リセット推定',keepConfirmed:'据え置き確認',unknown:'不明'}},
      {key:'lastHit',label:'前回の当選',type:'select',options:['czFail','atEnd','judgeFail','unknown'],optionLabels:{czFail:'CZ失敗',atEnd:'AT終了',judgeFail:'有馬失敗',unknown:'不明'}},
      {key:'prevCzTrig',label:'前回CZの当選契機',type:'select',optional:true,options:'hitTriggers',showWhen:{key:'lastHit',in:['czFail']}},
      {key:'prevCzRealG',label:'前回CZ当選時 データカウンタ',type:'num',optional:true,showWhen:{key:'lastHit',in:['czFail']}},
      {key:'prevCzLcdG',label:'前回CZ当選時 液晶G',type:'num',optional:true,showWhen:{key:'lastHit',in:['czFail']}},
      {key:'prevCzKiteiG',label:'前回CZの規定G数',type:'num',optional:true,showWhen:{key:'prevCzTrig',in:['規定G数']}},
      {key:'prevAtResult',label:'前回ATの結果',type:'select',optional:true,options:['kakenuke','other'],optionLabels:{kakenuke:'駆け抜け',other:'駆け抜け以外'},showWhen:{key:'lastHit',in:['atEnd']}}
    ]
  }};
  const number=v=>v==null||v===''?null:Number.isFinite(Number(v))?Number(v):null;
  const count=()=>({count:0,success:0,failure:0,unknown:0});
  function defFor(play){if(play?.source!=='rec')return null;const id=play.raw?.machineId??play.raw?.envelope?.payload?.machineDef;return enabled.includes(id)?defs[id]:null}
  function effectiveSetup(play){
    const setup={...(play.raw?.setup??play.raw?.envelope?.payload?.setup??{}),...play.statsFix},def=defFor(play);
    for(const field of def?.setup||[])if(field.showWhen&&!field.showWhen.in.includes(setup[field.showWhen.key]))delete setup[field.key];
    return setup;
  }
  function extract(play,def=defFor(play)){
    if(!def)return null;
    const raw=play.raw||{},events=play.events||[],out={sessionId:play.sourceId||raw.id||play.id,normalG:0,cz:Object.fromEntries(def.cz.map(k=>[k,count()])),at:0,atCauses:Object.fromEntries(Object.values(def.atCauses).map(k=>[k,0])),ep:0,judge:count(),afterJudgeCz:0,medalDiff:null,estimated:false,corrected:false,inconsistent:false,setup:effectiveSetup(play),hits:[]};
    let normal=true,start=number(raw.startRealG)??0;
    const add=end=>{const n=number(end);if(n===null||n<start)out.inconsistent=true;else out.normalG+=n-start};
    events.forEach((e,i)=>{
      if(e.type==='gFix')out.corrected=true;
      if(e.type==='hitStart'){
        if(normal){add(e.realG);normal=false}
        const next=events.slice(i+1).find(x=>(x.type==='hitEnd'||x.type==='hitStart')&&x.hit===e.hit);
        const result=next?.type==='hitEnd'&&['成功','失敗'].includes(next.result)?next.result:'不明';
        const hit={index:i,hit:e.hit,trig:e.trig||'不明',kiteiG:number(e.kiteiG),lcdG:number(e.lcdG),realG:number(e.realG),result,endIndex:next?.type==='hitEnd'?events.indexOf(next):-1};out.hits.push(hit);
        const bucket=out.cz[e.hit]||(e.hit===def.judge?out.judge:null);
        if(bucket){bucket.count++;bucket[result==='成功'?'success':result==='失敗'?'failure':'unknown']++}
        if(out.cz[e.hit]&&e.afterMark==='有馬失敗後')out.afterJudgeCz++;
        if(e.hit===def.ep)out.ep++;
        if(e.hit===def.at&&!def.excludeAt.includes(e.trig)){out.at++;out.atCauses[def.atCauses[e.trig]||'不明']++}
      }
      // rec also stamps normal on an end immediately followed by a same-operation handoff.
      const handoff=e.op!=null&&events.slice(i+1).some(x=>x.op===e.op&&x.type==='hitStart');
      if(e.type==='hitEnd'&&e.mode==='normal'&&!handoff){
        normal=true;start=number(e.toG?.realG);
        if(start===null){start=def.returnG[e.hit]??0;out.estimated=true}
      }
    });
    if(normal)add(raw.realG);
    if(out.inconsistent)out.normalG=null;
    const m=raw.money||{},sum=a=>(a||[]).reduce((n,x)=>n+(number(x.amount)??0),0),cash=sum(Array.isArray(m.spends)?m.spends:m.cash),lend=number(raw.cond?.lend??raw.lend),end=number(m.endMedal);
    if(end!==null&&(!cash||lend>0))out.medalDiff=end-(number(m.startMedal)??0)-sum(m.replays)-Math.round(cash/1000*(lend||0));
    return out;
  }
  // confirmed entries use the extract result shape, plus sessionId. No derived data is persisted here.
  function selected(rows,def,confirmed){
    const entries=Array.isArray(confirmed)?confirmed:Object.entries(confirmed?.[def.id]||{}).map(([sessionId,r])=>({...r,sessionId}));
    const fixed=[...new Map(entries.filter(r=>!r.machineId||r.machineId===def.id).map(r=>[String(r.sessionId),r])).values()],ids=new Set(fixed.map(r=>String(r.sessionId)));
    return {fixed,auto:rows.filter(p=>defFor(p)===def&&!ids.has(String(p.sourceId||p.raw?.id||p.id)))};
  }
  function aggregate(rows,def=defs.tokyoghoul,confirmed=[]){
    const {fixed,auto}=selected(rows,def,confirmed),values=[...auto.map(p=>extract(p,def)),...fixed];
    const out={automatic:auto.length,confirmed:fixed.length,excluded:rows.filter(p=>!defFor(p)&&!fixed.some(r=>String(r.sessionId)===String(p.sourceId||p.raw?.id||p.id))).length,normalG:0,cz:Object.fromEntries([...def.cz,'total'].map(k=>[k,count()])),at:0,atCauses:Object.fromEntries(Object.values(def.atCauses).map(k=>[k,0])),ep:0,judge:count(),afterJudgeCz:0,estimated:0,corrected:0,inconsistent:0,medalTotal:0,medalCount:0,medalUnknown:0,wins:0,probabilityCounts:{at:0,...Object.fromEntries([...def.cz,'total'].map(k=>[k,0]))}};
    const add=(a,b)=>{for(const k of ['count','success','failure','unknown'])a[k]+=b?.[k]||0};
    for(const r of values){
      for(const k of ['estimated','corrected','inconsistent'])out[k]+=r[k]?1:0;
      for(const k of ['at','ep','afterJudgeCz'])out[k]+=r[k]||0;
      for(const k of Object.keys(out.atCauses))out.atCauses[k]+=r.atCauses?.[k]||0;
      add(out.judge,r.judge);
      for(const k of def.cz){add(out.cz[k],r.cz?.[k]);add(out.cz.total,r.cz?.[k])}
      if(r.normalG!=null){out.normalG+=r.normalG;out.probabilityCounts.at+=r.at||0;for(const k of def.cz){out.probabilityCounts[k]+=r.cz?.[k]?.count||0;out.probabilityCounts.total+=r.cz?.[k]?.count||0}}
      if(r.medalDiff==null)out.medalUnknown++;else{out.medalTotal+=r.medalDiff;out.medalCount++;if(r.medalDiff>0)out.wins++}
    }
    out.probabilities=Object.fromEntries(Object.entries(out.probabilityCounts).map(([k,n])=>[k,n?out.normalG/n:null]));
    for(const bucket of [...Object.values(out.cz),out.judge])bucket.rate=bucket.success+bucket.failure?bucket.success/(bucket.success+bucket.failure):null;
    out.medalAverage=out.medalCount?out.medalTotal/out.medalCount:null;out.winRate=out.medalCount?out.wins/out.medalCount:null;
    return out;
  }
  function czRows(rows,def=defs.tokyoghoul,confirmed=[]){
    const groups=new Map(),details=[],next=[];
    for(const play of selected(rows,def,confirmed).auto){
      const r=extract(play,def),hits=r.hits,eligible=h=>def.cz.includes(h.hit)||h.hit===def.ep||(h.hit===def.at&&!def.excludeAt.includes(h.trig));
      const following=index=>{
        const next=hits.find(h=>h.index>index&&eligible(h));if(next)return next;
        const end=play.events?.[index],start=index<0?(number(play.raw?.startRealG)??0):(number(end?.toG?.realG)??def.returnG[end?.hit]??0),last=number(play.raw?.realG);
        return {hit:'ヤメ',normalG:last===null||last<start?null:last-start};
      };
      for(const h of hits.filter(h=>def.cz.includes(h.hit))){
        const key=JSON.stringify([h.hit,h.trig,h.kiteiG]);if(!groups.has(key))groups.set(key,{hit:h.hit,trig:h.trig,kiteiG:h.kiteiG,...count()});
        const group=groups.get(key);group.count++;group[h.result==='成功'?'success':h.result==='失敗'?'failure':'unknown']++;
        details.push({playId:play.id,date:play.date,...h});
        if(h.result==='失敗')next.push({playId:play.id,beforeSeat:false,from:h,to:following(h.endIndex)});
      }
      if(r.setup.lastHit==='czFail')next.push({playId:play.id,beforeSeat:true,from:{hit:'前回CZ',trig:r.setup.prevCzTrig||'不明',kiteiG:number(r.setup.prevCzKiteiG),lcdG:number(r.setup.prevCzLcdG)},to:following(-1)});
    }
    return {groups:[...groups.values()],details,next};
  }
  const api={enabled,defs,defFor,extract,aggregate,czRows,effectiveSetup};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.PlayStats=api;
})(typeof globalThis!=='undefined'?globalThis:this);

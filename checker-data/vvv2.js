// 出典: ちょんぼりすた様 https://chonborista.com/slot/sankyo-slot/243853/
// 数値の正本: docs/specs/vvv2-checker-v01.md（2026-10-28 シオン照合・第三者解析）
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,4,5,6], MODES=['A','B','C','天国'];
  const PRIOR_RESET=[69,25,5,1], TRANS=[[66,29,4,1],[0,66,32,2],[0,0,57,43],[66,31,2,1]];
  const PT1={100:[5,5,10,5],200:[95,95,90,95]};
  const PT2={100:[25,29,35,0],200:[23,13,44,0],300:[5,16,3,0],400:[28,12,18,0],500:[4,14,0,0],600:[15,16,0,0]};
  const PT3={100:[16,20,38,0],200:[31,32,39,0],300:[6,31,3,0],400:[47,17,20,0]};
  const CYCLE=[[14,29,4,15,13,23],[5,13,82,0,0,0],[11,18,14,12,45,0],[100,0,0,0,0,0]], CAPS=[6,3,5,1];
  const HINT={
    sub_hito:{label:'サブモニター 火人',meaning:'2周期以内にCZ濃厚',type:'cycle',effect:{capWithin:2}},
    sub_v3:{label:'サブモニター 3号機',meaning:'2周期以内50%／3周期以内80%',type:'ref',effect:{}},
    sub_hinowa:{label:'サブモニター 火ノ輪',meaning:'通常B以上 期待度50%',type:'ref',effect:{}},
    sub_v5:{label:'サブモニター 5号機',meaning:'5周期以内にCZ濃厚',type:'cycle',effect:{capWithin:5}},
    sub_hiasobi:{label:'サブモニター 火遊',meaning:'通常B以上濃厚',type:'mode',effect:{exclude:['A']}},
    sub_marie:{label:'サブモニター マリエ',meaning:'次回革命ボーナス・マリエモード期待大',type:'ref',effect:{}},
    voice_tekisetsu:{label:'ボイス「お前にしては適切な判断だ」',meaning:'通常B以上 約50%',type:'ref',effect:{}},
    voice_bakemono:{label:'ボイス「僕は化物なんかじゃない」',meaning:'通常B以上 約80%',type:'ref',effect:{}},
    voice_nice:{label:'ボイス「ナーイス」',meaning:'当該or次周期CZ約66%',type:'ref',effect:{}},
    voice_wakaranai:{label:'ボイス「自分で自分が分からない」',meaning:'当該or次周期でCZ濃厚',type:'cycle',effect:{capWithin:2}},
    pino_ayashii:{label:'ピノ「アヤシイ!?」',meaning:'400pt以内濃厚',type:'pt',effect:{ptMax:400}},
    pino_chikai:{label:'ピノ「チカイ！」',meaning:'200pt以内濃厚',type:'pt',effect:{ptMax:200}},
    pino_kekkon:{label:'ピノ「ケッコンケッコン」',meaning:'100pt以内濃厚',type:'pt',effect:{ptMax:100}},
    talk_marie:{label:'会話 マリエ紫',meaning:'マリエモード期待大',type:'ref',effect:{}},
    talk_haruto:{label:'会話 ハルト紫',meaning:'引き戻し50%（否定でB以上）※A報告あり',type:'ref',effect:{}},
    talk_souichi:{label:'会話 ソウイチ紫',meaning:'引き戻し80%（否定で天国）',type:'mode',effect:{onlyIfPullMiss:['天国']}},
    magius4:{label:'マギウスマーク4個以上',meaning:'天国＋設定4以上',type:'mode',effect:{only:['天国']}}
  };
  const GROUPS={
    endScreen:[['white','白',0],['raizo','青 ライゾウ',0],['saki','青 サキ',0],['cockpit','赤 コックピット',0],['dorssia','赤 ドルシア軍',0],['purple','紫',2],['silver','銀',4],['gold','金',6],['unknown','不明',0]],
    atEnd:[['photo','写真あり',6]],
    roundRed:[['marie','マリエ',0],['v1','1号機',0],['saki200','200年後のサキ',4],['liselotte','リーゼロッテ',6]],
    over:[['o456','456枚OVER',4],['o555','555枚OVER',5],['o666','666枚OVER',6]],
    zorome:[['g22','+22G',2],['g44','+44G',4],['g66','+66G',6]],
    magiusCount:[['m4','4個',4],['m5','5個',5],['m6','6個',6]],
    mumu:[['peace','ピース→横切り',4],['group','夢夢・ナナ・ジャム群',4]],
    baffe:[['empty','無人',0],['occupied','有人',0]]
  };
  const TITLES={endScreen:'CZ・ボーナス終了画面',atEnd:'AT終了画面',roundRed:'赤背景ラウンド開始',over:'獲得枚数',zorome:'ゾロ目上乗せ',magiusCount:'マギウスマーク個数',mumu:'ハラキリチャレンジ',baffe:'バッフェ'};
  const END_PROBS=[[74,8,8,7,3,0,0,0],[65,5,10,7,3,10,0,0],[60,5,10,9,6,8,2,0],[60,10,5,9,6,8,2,0],[60,5,10,9,6,7,2,1]];
  const BAFFE=[[55,45],[45,55],[45,55],[55,45],[45,55]], BAR=[3,4,5,6,7], SPECIAL=[1,2,4,8,12], FIRST=[476,473,464,459,456], PAYOUT=[97.7,99.3,104.7,110.8,114.9];
  const START={reset:'設定変更後（リセット）',bonusEnd:'ボーナス・AT終了後',fail:'CZ失敗・決戦失敗のあと',unknown:'不明'};
  const END={czmiss:'CZ失敗',rbmiss:'決戦失敗',bbend:'革命BB終了（AT非当選）',atend:'AT終了'};
  const DEF={schemaVersion:1,start:{kind:'unknown',failCount:0},custom:'unknown',counts:{cz:0,rb:0,bb:0,direct:0,bar:0,barDirect:0},groups:Object.fromEntries(Object.entries(GROUPS).map(([g,a])=>[g,Object.fromEntries(a.map(c=>[c[0],0]))])),spans:[{rows:[],end:null}],curPt:null,img:null,iconChoice:null};
  const clone=x=>JSON.parse(JSON.stringify(x)), sum=a=>a.reduce((x,y)=>x+y,0), num=x=>Number.isFinite(Number(x))?Math.max(0,Math.floor(Number(x))):0;
  const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalize=a=>{const s=sum(a);return s?a.map(x=>x/s):a.map(()=>0);};
  const transition=p=>TRANS[0].map((_,j)=>sum(p.map((v,i)=>v*TRANS[i][j]/100)));
  function normalizeState(S){
    S=S&&typeof S==='object'?S:{};
    S.schemaVersion=S.schemaVersion||1;
    S.start=Object.assign({},DEF.start,S.start);if(!START[S.start.kind])S.start.kind='unknown';S.start.failCount=Math.min(5,num(S.start.failCount));
    if(!['on','off','unknown'].includes(S.custom))S.custom='unknown';
    S.counts=Object.assign({},DEF.counts,S.counts);Object.keys(DEF.counts).forEach(k=>S.counts[k]=num(S.counts[k]));S.counts.bar=Math.max(S.counts.bar,S.counts.barDirect);
    S.groups=Object.assign({},S.groups);Object.entries(GROUPS).forEach(([g,a])=>{S.groups[g]=Object.assign({},S.groups[g]);a.forEach(c=>S.groups[g][c[0]]=num(S.groups[g][c[0]]));});
    S.spans=Array.isArray(S.spans)&&S.spans.length?S.spans.map(s=>({...s,rows:Array.isArray(s.rows)?s.rows:[],end:s.end||null})):[{rows:[],end:null}];
    S.curPt=S.curPt==null?null:num(S.curPt);if(S.img===undefined)S.img=null;if(S.iconChoice===undefined)S.iconChoice=null;
    return S;
  }
  function priorOf(S){let p=PRIOR_RESET.map(v=>v/100);if(S.start.kind==='unknown')return [.25,.25,.25,.25];if(S.start.kind==='fail')for(let i=0;i<S.start.failCount;i++)p=transition(p);return p;}
  const current=S=>S.spans[S.spans.length-1];
  const cycles=s=>s.rows.filter(r=>r.t==='cyc');
  const cycleNo=s=>cycles(s).length+1;
  const table=(k,prev600)=>k===1?PT1:prev600?PT3:PT2;
  function hazard(m,k,resetSpan=false,hints=[]){
    const i=typeof m==='number'?m:MODES.indexOf(m);
    const cap=Math.min(CAPS[i],resetSpan?3:Infinity,...hints.filter(r=>HINT[r.c]?.type==='cycle').map(r=>r.k+HINT[r.c].effect.capWithin-1));
    if(k>=cap)return 1;
    return (CYCLE[i][k-1]||0)/(100-sum(CYCLE[i].slice(0,k-1)));
  }
  function rowLik(m,row,k,prev600,resetSpan=false,hints=[]){
    if(row.t!=='cyc')return 1;
    const i=typeof m==='number'?m:MODES.indexOf(m),pt=(table(k,prev600)[row.pt]||[])[i]||0,q=hazard(i,k,resetSpan,hints);
    return pt/100*(row.r==='win'?q:1-q);
  }
  function spanPosterior(prior,span,resetSpan,hints,curPt=null){
    let p=prior.slice(),prev=false,k=0;
    for(const r of span.rows){if(r.t!=='cyc')continue;k++;p=normalize(p.map((v,i)=>v*rowLik(i,r,k,prev,resetSpan,hints)));prev=r.pt===600;}
    for(const r of hints){const h=HINT[r.c],e=h.effect;if(h.type!=='mode')continue;
      const only=e.only||(span.rows.some(x=>x.t==='pull'&&x.r==='miss')?e.onlyIfPullMiss:null);
      p=p.map((v,i)=>(e.exclude||[]).includes(MODES[i])||(only&&!only.includes(MODES[i]))?0:v);
    }
    if(curPt!=null){
      const t=table(k+1,prev),max=Math.min(Infinity,...hints.filter(r=>HINT[r.c]?.type==='pt'&&r.k===k+1).map(r=>HINT[r.c].effect.ptMax));
      const weighted=p.map((v,i)=>v*sum(Object.entries(t).filter(([pt])=>Number(pt)>curPt&&Number(pt)<=max).map(([,a])=>(a[i]||0)/100)));
      if(sum(weighted))p=weighted; // 全候補なしは現在ptを外した事後を維持し、posteriorで警告する。
    }
    return normalize(p);
  }
  function rawPt(p,span,curPt,hints){
    const c=cycles(span),k=c.length+1,t=table(k,c[c.length-1]?.pt===600);
    const max=Math.min(Infinity,...hints.filter(r=>HINT[r.c]?.type==='pt'&&r.k===k).map(r=>HINT[r.c].effect.ptMax));
    const pairs=Object.entries(t).filter(([pt])=>(curPt==null||Number(pt)>curPt)&&Number(pt)<=max).map(([pt,v])=>[Number(pt),sum(p.map((x,i)=>x*(v[i]||0)/100))]).filter(x=>x[1]>0);
    const total=sum(pairs.map(x=>x[1]));return pairs.map(([pt,v])=>({pt,p:v/total}));
  }
  // 制約を一つずつ検証し、記録と両立しない示唆だけを外す。入力データは変更しない。
  function posterior(S){
    let prior=priorOf(S),p=prior,active=[],warnings=[],contradiction=false;
    S.spans.forEach((span,si)=>{
      const reset=si===0&&S.start.kind==='reset',curPt=si===S.spans.length-1&&['cycle','pull'].includes(phase(S))?S.curPt:null;active=[];
      p=spanPosterior(prior,span,reset,active,curPt);
      if(!sum(p)){contradiction=true;warnings.push('周期の記録が食い違います（区間'+(si+1)+'）');}
      for(const r of span.rows.filter(r=>r.t==='hint'&&HINT[r.c])){
        const h=HINT[r.c];if(h.type==='ref'){active.push(r);continue;}
        const proposed=active.concat(r),next=spanPosterior(prior,span,reset,proposed,curPt);
        const recorded=cycles(span).find((x,i)=>i+1===r.k);
        const ptConflict=h.type==='pt'&&(recorded?recorded.pt>h.effect.ptMax:(r.k===cycleNo(span)&&si===S.spans.length-1&&!rawPt(next,span,S.curPt,proposed).length));
        if(!sum(next)||ptConflict)warnings.push('示唆と記録が食い違います（示唆：'+h.label+'）');
        else{active=proposed;p=next;}
      }
      if(curPt!=null&&!rawPt(p,span,curPt,active).length)warnings.push('到達pt候補がありません（記録を確認してください）');
      if(span.end)prior=['czmiss','rbmiss'].includes(span.end.t)?transition(p):PRIOR_RESET.map(x=>x/100);
    });
    return {p,active,warnings,contradiction};
  }
  function nextPtDist(S){const r=posterior(S),dist=rawPt(r.p,current(S),S.curPt,r.active);return {dist,warnings:r.warnings.concat(dist.length?[]:['到達pt候補がありません（記録を確認してください）']),contradiction:r.contradiction||!dist.length};}
  function cycleCap(S){const r=posterior(S),s=current(S),k=cycleNo(s),reset=S.spans.length===1&&S.start.kind==='reset';if(!sum(r.p))return null;
    const misses=cycles(s).filter(x=>x.magius&&x.r==='miss').length;
    return Math.max(0,Math.min(Math.max(...CAPS.filter((_,i)=>r.p[i]>0))-k+1-misses,reset?3-k+1:Infinity,...r.active.filter(x=>HINT[x.c]?.type==='cycle').map(x=>x.k+HINT[x.c].effect.capWithin-k)));
  }
  function winPctNow(S){const r=posterior(S);return sum(r.p)?100*sum(r.p.map((v,i)=>v*hazard(i,cycleNo(current(S)),S.spans.length===1&&S.start.kind==='reset',r.active))):null;}
  function untilWin(S){
    const r=posterior(S),s=current(S),c=cycles(s),curPt=S.curPt??0,reset=S.spans.length===1&&S.start.kind==='reset';
    const max=Math.min(Infinity,...r.active.filter(x=>HINT[x.c]?.type==='pt'&&x.k===c.length+1).map(x=>HINT[x.c].effect.ptMax));
    const dist=new Map();let avgCycles=0;
    function walk(m,k,prev600,first,prob,pt,n){
      const candidates=Object.entries(table(k,prev600)).filter(([p,a])=>a[m]>0&&(!first||(Number(p)>curPt&&Number(p)<=max)));
      const total=sum(candidates.map(([,a])=>a[m]));if(!total)return;
      const q=hazard(m,k,reset,r.active);
      for(const [p,a] of candidates){
        const weight=prob*a[m]/total,cost=pt+Number(p)-(first?curPt:0),win=weight*q;
        if(win){dist.set(cost,(dist.get(cost)||0)+win);avgCycles+=win*(n+1);}
        if(q<1)walk(m,k+1,Number(p)===600,false,weight*(1-q),cost,n+1);
      }
    }
    if(!r.contradiction&&['cycle','pull'].includes(phase(S)))r.p.forEach((p,m)=>{if(p)walk(m,c.length+1,c.at(-1)?.pt===600,true,p,0,0);});
    const distribution=[...dist].sort((a,b)=>a[0]-b[0]).map(([pt,p])=>({pt,p})),total=sum(distribution.map(x=>x.p));
    if(!total)return {distribution,total,avgPt:null,avgG:null,avgCycles:null,p50:null,p80:null};
    const avgPt=sum(distribution.map(x=>x.pt*x.p));
    const quantile=target=>{let cumulative=0;return distribution.find(x=>(cumulative+=x.p)>=target-1e-12)?.pt??null;};
    return {distribution,total,avgPt,avgG:Math.floor(avgPt/3),avgCycles,p50:quantile(.5),p80:quantile(.8)};
  }
  function pct(p){return p>0&&p<.005?'1%未満':Math.round(p*100)+'%';}
  function modeText(S){const r=posterior(S);return r.contradiction?'—（記録の矛盾）':r.p.map((v,i)=>v?MODES[i]+' '+pct(v):'').filter(Boolean).join('／')||'—';}
  function knownTotal(S,g){return sum(GROUPS[g].filter(c=>c[0]!=='unknown').map(c=>S.groups[g][c[0]]));}
  const groupTotal=(S,g)=>sum(GROUPS[g].map(c=>S.groups[g][c[0]]));
  function allStrong(S){return Object.entries(GROUPS).flatMap(([g,a])=>a.filter(c=>c[2]>0).map(c=>({label:c[1],rank:c[2],value:S.groups[g][c[0]],g})));}
  const strongCount=S=>sum(allStrong(S).map(x=>x.value));
  function bestStrong(S){const x=allStrong(S).filter(x=>x.value).sort((a,b)=>b.rank-a.rank)[0];return x?'確定演出 '+x.label+'（設定'+x.rank+(x.rank===6?'濃厚':'以上濃厚')+'）':'確定演出 なし';}
  function bayesSpec(S){
    const multi=g=>({label:TITLES[g],counts:Object.fromEntries(GROUPS[g].filter(c=>c[0]!=='unknown').map(c=>[c[0],S.groups[g][c[0]]])),probs:Object.fromEntries(SETTINGS.map((s,i)=>[s,Object.fromEntries(GROUPS[g].filter(c=>c[0]!=='unknown').map((c,j)=>[c[0],(g==='endScreen'?END_PROBS:BAFFE)[i][j]/100]))]))});
    return {settings:SETTINGS,multinomial:[...(S.custom==='off'?[multi('endScreen')]:[]),multi('baffe')],binomial:[{label:'BAR揃いからAT直撃',hit:S.counts.barDirect,total:S.counts.bar,probs:Object.fromEntries(SETTINGS.map((s,i)=>[s,BAR[i]/100]))}],exclusions:allStrong(S).filter(x=>x.g!=='endScreen'||S.custom==='off').map(x=>({label:x.label,count:x.value,exclude:SETTINGS.filter(s=>s<x.rank)}))};
  }
  const bayesResult=S=>window.CheckerBayes.estimate(bayesSpec(S));
  function bayesText(S){const r=bayesResult(S);return '設定推測 '+(r.empty?'—':r.contradiction?'記録の矛盾':'4以上 '+pct(r.high))+(S.custom==='off'?'':'（終了画面除く）');}
  function phase(S){const s=current(S),r=[...s.rows].reverse().find(x=>x.t==='out'||x.t==='cyc');
    if(r&&(r.t==='out'||r.r==='win'))return r.at?'at':r.bonus==='rb'?'rb':r.bonus==='bb'?'bb':'cz';
    const prev=S.spans[S.spans.length-2];
    if((prev&&['bbend','atend'].includes(prev.end?.t)||S.spans.length===1&&S.start.kind==='bonusEnd')&&!s.rows.some(x=>['pull','cyc','out'].includes(x.t)))return 'pull';
    return 'cycle';
  }
  function rowText(r){if(r.t==='cyc')return r.k+'周期目 '+r.pt+'pt '+(r.r==='win'?'当選':'ハズレ')+(r.magius?' 🔶':'')+(r.bonus?' →'+(r.bonus==='rb'?'決戦RB':'革命BB'):'')+(r.at?' →AT':'');if(r.t==='out')return r.k+'周期目 周期外当選'+(r.bonus?' →'+(r.bonus==='rb'?'決戦RB':'革命BB'):'')+(r.at?' →AT':'');if(r.t==='pull')return '引き戻し '+(r.r==='win'?'あり':'なし');if(r.t==='hint')return r.k+'周期目 '+(HINT[r.c]?.label||r.c);return '未対応の記録';}
  const action=(name,label,attrs='')=>`<button type="button" class="act plain" data-action="${name}" ${attrs}>${label}</button>`;
  const section=(title,body,id='')=>`<section class="sec" ${id?'id="'+id+'"':''}><div class="sec-h">${title}</div>${body}</section>`;
  function pageCounts(ctx){const S=ctx.S;return section('開始条件',`<div class="vv-grid">${Object.entries(START).map(([k,v])=>action('start',v,`data-kind="${k}" aria-pressed="${S.start.kind===k}"`)).join('')}</div>${S.start.kind==='fail'?'<div class="vv-grid">'+[1,2,3,4,5].map(n=>action('failCount',n===5?'5回以上':n+'回',`data-n="${n}" aria-pressed="${S.start.failCount===n}"`)).join('')+'</div>':''}`)+
    section('終了画面カスタム',`<div class="vv-grid three">${['off','on','unknown'].map(k=>action('custom',k==='unknown'?'不明':k.toUpperCase(),`data-value="${k}" aria-pressed="${S.custom===k}"`)).join('')}</div><div class="hint">ホールが1000G単位で終了画面を変える設定です。OFF以外では終了画面を設定推測に使いません</div>`)+
    section('カウント系',`<div class="cgrid">${[['cz','CZ突入'],['rb','決戦ボーナス初当り'],['bb','革命ボーナス初当り'],['direct','AT直撃']].map(([k,v])=>ctx.crow('counts.'+k,v,'',0)).join('')}<div class="crow"><div class="lbl"><div class="nm">BAR揃い</div><div class="mn">BAR揃いからAT直撃 ${S.counts.barDirect}/${S.counts.bar}</div></div><div class="num">${S.counts.bar}</div>${action('bar','＋',`aria-label="BAR揃いを追加" ${ctx.mode<0?'disabled':''}`)}</div><div class="crow"><div class="lbl"><div class="nm">BAR揃いからAT直撃</div></div><div class="num">${S.counts.barDirect}</div>${action('barDirect',ctx.mode<0?'−':'＋')}</div></div><div class="hint">BAR揃いは直撃しなかった場合に押します。直撃では両方を数えます。減算時の外れ側は無効です。訂正は取消かデータリセットで行います。</div><div class="hint">初当りは出典の合算（革命ボーナス・決戦ボーナス・AT直撃）を3つに分けて数えます。CZ成功からの自動加算はしません。1/xは出しません（CZは全設定共通、初当りの設定差はごく小さいため）</div>`);
  }
  function groupSection(ctx,g){const S=ctx.S,total=knownTotal(S,g),percent=['endScreen','baffe'].includes(g);return section(TITLES[g],'<div class="cgrid">'+GROUPS[g].map(c=>groupRow(ctx,g,c,percent,total)).join('')+'</div>'+(g==='magiusCount'?'<div class="hint">天国示唆でもあります。周期タブのマギウスマーク4個以上と連動はしません（それぞれ押す）。タブをまたぐ自動入力は取消の範囲が追いにくいためです。</div>':''));}
  // 共通crowのパスは2階層まで。仕様のgroups配下は機種固有actionで保存する。
  function groupRow(ctx,g,c,percent,total){const v=ctx.S.groups[g][c[0]],meaning=c[2]?'設定'+c[2]+(c[2]===6?'濃厚':'以上濃厚'):c[0]==='unknown'?'割合の母数に入れない':'';return `<div class="crow" data-group-row="${g}.${c[0]}"><div class="lbl"><div class="nm">${c[1]}</div><div class="mn ${c[2]?'hot':''}">${meaning}</div></div><div class="num">${v}</div>${percent&&c[0]!=='unknown'?'<div class="pct">'+(total?Math.round(100*v/total)+'%':'—')+'</div>':''}${action('group',ctx.mode<0?'−':'＋',`data-group="${g}" data-key="${c[0]}" aria-label="${c[1]}を1回${ctx.mode<0?'減算':'追加'}"`)}</div>`;}
  function pageBayes(ctx){const S=ctx.S,r=bayesResult(S);return section('設定推測',`<div class="bayes-main">${esc(bayesText(S))}</div>${r.posterior?SETTINGS.map(s=>`<div class="bayes-bar"><span>設定${s}</span><div><b style="width:${100*r.posterior[s]}%"></b></div><em>${pct(r.posterior[s])}</em></div>`).join(''):r.empty?'<p>記録が増えると推測できます。</p>':'<p class="vv-error">記録に矛盾があります。</p>'}${S.custom!=='off'?'<div class="hint">'+(S.custom==='on'?'終了画面カスタムがONのため終了画面は使っていません（終了画面の濃厚系も使っていません）':'終了画面カスタムが不明のため終了画面は使っていません（終了画面の濃厚系も使っていません）')+'</div>':''}<div class="hint">入力された記録からの参考値です。サンプルが少ないほど信頼度は下がります。</div>`,'vv-bayes');}
  function refTable(title,head,rows){return section(title,`<table class="vv-table"><thead><tr>${head.map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')}</tbody></table>`);}
  function pageReference(){return '<details id="vv-ref"><summary>参照表（設定別数値・振分表・示唆一覧）</summary>'+refTable('設定別数値',['項目',...SETTINGS.map(x=>'設定'+x)],[['初当り（参考）',...FIRST.map(x=>'1/'+x)],['出玉率%',...PAYOUT],['BAR直撃%',...BAR],['特殊テーブル%',...SPECIAL]])+refTable('終了画面振分（%）',['画面',...SETTINGS],GROUPS.endScreen.slice(0,8).map((c,j)=>[c[1],...END_PROBS.map(a=>a[j]||'—')]))+refTable('バッフェ（%）',['状態',...SETTINGS],GROUPS.baffe.map((c,j)=>[c[1],...BAFFE.map(a=>a[j])]))+refTable('モードと天井',['モード','最大pt（2周期目以降）','天井周期'],MODES.map((m,i)=>[m,[600,600,400,'200（初回）'][i],CAPS[i]]))+refTable('開始時モード振分（%）',MODES,[PRIOR_RESET])+refTable('失敗後モード移行率（%）',['滞在',...MODES],TRANS.map((a,i)=>[MODES[i],...a]))+[[PT1,'1周期目'],[PT2,'2周期目以降'],[PT3,'前回600pt']].map(([t,l])=>refTable(l+' 到達pt振分（%）',['pt',...MODES],Object.entries(t).map(([p,a])=>[p,...a.map(x=>x||'—')]))).join('')+refTable('天井周期振分（%）',['周期',...MODES],[1,2,3,4,5,6].map((k)=>[k,...CYCLE.map(a=>a[k-1]||'—')]))+refTable('周期ナビの示唆',['演出','意味'],Object.values(HINT).map(h=>[h.label,h.meaning]))+'<p class="hint">当ページの解析値は第三者の独自調査値です。通常Aの周期振分は合計98%（出典値のまま）です。</p></details>';}
  function pageSuggest(ctx){return '<div class="jump-grid">'+[['vv-end','終了画面'],['vv-at','AT中'],['vv-other','その他'],['vv-bayes','設定推測'],['vv-ref','参照']].map(([id,l])=>`<a href="#${id}" onclick="if(this.hash===&#39;#vv-ref&#39;)document.getElementById(&#39;vv-ref&#39;).open=true">${l}</a>`).join('')+'</div><div id="vv-end">'+groupSection(ctx,'endScreen')+groupSection(ctx,'atEnd')+'</div><div id="vv-at">'+['roundRed','over','zorome'].map(g=>groupSection(ctx,g)).join('')+'</div><div id="vv-other">'+['magiusCount','mumu','baffe'].map(g=>groupSection(ctx,g)).join('')+'</div>'+pageBayes(ctx)+pageReference();}
  function pageCycle(ctx){const S=ctx.S,r=posterior(S),d=nextPtDist(S),s=current(S),k=cycleNo(s),ph=phase(S),cap=cycleCap(S),win=winPctNow(S),until=untilWin(S);
    const gone=MODES.filter((_,i)=>!r.p[i]);
    const now=`<div class="now-box"><div class="now-h">現在の状況</div><div class="vv-mode">${modeText(S)}</div>${gone.length?'<div class="vv-small">消去：'+gone.join('・')+'（周期記録・有効な示唆による）</div>':''}<div>${k}周期目（上限 あと${cap==null?'—':cap}周期）</div>${S.start.kind==='reset'&&S.spans.length===1?'<div class="vv-small">設定変更後は最大3周期</div>':''}<div class="vv-dist">次の到達pt：${d.dist.map(x=>x.pt+'pt '+pct(x.p)).join('／')||'—'}</div><div class="vv-small">上限 ${d.dist.length?d.dist[d.dist.length-1].pt+'pt':'—'}${r.active.filter(x=>HINT[x.c]?.type==='pt'&&x.k===k).map(x=>' ／ピノ：'+HINT[x.c].effect.ptMax+'pt以内').join('')}</div><div class="vv-until">当選まで（参考）：${until.avgPt==null?'—':'平均 あと約'+Math.round(until.avgPt)+'pt（約'+until.avgG+'G）'}${until.avgPt==null?'':'<div class="vv-small">50%で'+until.p50+'pt以内／80%で'+until.p80+'pt以内／平均 あと'+until.avgCycles.toFixed(1)+'周期</div>'}</div><details><summary>くわしく</summary><div>この周期でCZになる参考 ${win==null?'—':Math.round(win)+'%'}</div>${r.active.length?'<div>有効な示唆・参考</div>'+r.active.map(x=>'<p>'+esc((HINT[x.c].type==='ref'?'参考：':'')+HINT[x.c].label+'（'+HINT[x.c].meaning+'）')+'</p>').join('')+'':''}<div class="vv-small">特殊テーブル（高設定ほど400pt以下が選ばれやすい）は計算に入れていません。400pt以下が続く場合はその可能性もあります</div></details>${[...new Set(d.warnings)].map(w=>'<p class="vv-error">'+esc(w)+'</p>').join('')}</div>`;
    const controls=`<div class="inrow"><label for="curPt">現在pt（任意）</label><input id="curPt" readonly inputmode="none" value="${S.curPt==null?'':S.curPt}" placeholder="未入力" onclick="CheckerConfigs.vvv2.openPad()"></div><div class="vv-grid vv-reach">${[100,200,300,400,500,600].map(pt=>`<button class="act plain" data-pt="${pt}" onclick="CheckerConfigs.vvv2.pickPt(this)" ${['cycle','pull'].includes(ph)?'':'disabled'}>${pt}pt</button>`).join('')}</div><div id="vv-confirm" hidden><div class="vv-toggle"><input type="checkbox" id="vv-magius"><label for="vv-magius">マギウスマーク付き周期</label></div><div class="vv-grid">${action('cycle','当選','data-result="win"')}${action('cycle','ハズレ','data-result="miss"')}</div></div>${action('out','周期外当選（ルーンドライブ／BAR直撃）',['cycle','pull'].includes(ph)?'':'disabled')}`;
    const lastHit=[...s.rows].reverse().find(x=>x.t==='out'||x.t==='cyc'),outcomes={cz:[['czmiss','CZ失敗'],['rb','CZ成功→決戦'],['bb','CZ成功→革命'],...(lastHit?.t==='out'?[['at','AT直撃（AT開始）']]:[])],rb:[['rbmiss','決戦失敗'],['at','決戦成功→AT']],bb:[['bbend','革命BB終了（AT非当選）'],['at','革命BB→AT']],at:[['atend','AT終了']],pull:[['pullwin','引き戻し あり'],['pullmiss','引き戻し なし（66G経過）']]};
    const hintGroups=[['サブモニター','sub_'],['電脳ゾーン終了ボイス','voice_'],['ピノセリフ','pino_'],['会話 紫','talk_'],['マギウス','magius']];
    return section('周期ナビ',now)+section('周期を記録',controls+(outcomes[ph]?'<div class="vv-status">'+({cz:'CZ／ボーナス結果待ち',rb:'決戦結果待ち',bb:'ボーナス終了待ち',at:'AT終了待ち',pull:'引き戻し区間（66G）'})[ph]+'</div><div class="vv-grid">'+outcomes[ph].map(([key,l])=>action('result',l,`data-result="${key}"`)).join('')+'</div>':'')+'<div class="vv-small">周期記録は加算のみ。訂正は履歴の行タップか取消で行います。回数カウンターには加算しません。</div>')+
    '<details class="vv-hints"><summary>示唆を記録</summary>'+hintGroups.map(([title,prefix])=>section(title,'<div class="vv-grid">'+Object.entries(HINT).filter(([key])=>key.startsWith(prefix)).map(([key,h])=>action('hint',esc(h.label),`data-hint="${key}"`)).join('')+'</div>')).join('')+'</details>'+section('履歴（タップで削除）',s.rows.map((row,i)=>({row,i})).reverse().map(({row,i})=>action('deleteRow',esc(rowText(row)),`data-index="${i}"`)).join('')||'<p>まだ記録がありません</p>')+(S.spans.length>1?'<details><summary>終了した区間</summary>'+S.spans.slice(0,-1).map((span,i)=>section('区間'+(i+1)+' '+(END[span.end?.t]||''),span.rows.map(row=>'<p>'+esc(rowText(row))+'</p>').join(''))).join('')+'</details>':'');
  }
  function closeSpan(S,t){current(S).end={t};S.spans.push({rows:[],end:null});S.curPt=null;}
  const actions={
    group({S,mode},d){if(!GROUPS[d.group]?.some(c=>c[0]===d.key))return false;const v=S.groups[d.group][d.key];if(mode<0&&!v)return false;S.groups[d.group][d.key]=v+mode;return TITLES[d.group]+' '+GROUPS[d.group].find(c=>c[0]===d.key)[1];},
    start({S},d){if(!START[d.kind])return false;S.start.kind=d.kind;if(d.kind==='fail'&&!S.start.failCount)S.start.failCount=1;return '開始条件を変えました（記録は保持）';},
    failCount({S},d){S.start.failCount=Number(d.n);return '開始時の失敗回数 '+d.n;},
    custom({S},d){S.custom=d.value;return '終了画面カスタム '+d.value;},
    bar({S,mode}){if(mode<0)return false;S.counts.bar++;return 'BAR揃い（直撃なし）';},
    barDirect({S,mode}){if(mode<0&&!S.counts.barDirect)return false;S.counts.barDirect+=mode;S.counts.bar+=mode;return 'BAR揃いからAT直撃';},
    cycle({S},d){const el=document.querySelector('[data-pt][aria-pressed="true"]');if(!el||!['cycle','pull'].includes(phase(S)))return false;const row={t:'cyc',k:cycleNo(current(S)),pt:Number(el.dataset.pt),r:d.result,magius:document.getElementById('vv-magius').checked};current(S).rows.push(row);S.curPt=null;return rowText(row);},
    out({S}){if(!['cycle','pull'].includes(phase(S)))return false;const r={t:'out',k:cycleNo(current(S))};current(S).rows.push(r);S.curPt=null;return rowText(r);},
    result({S},d){const ph=phase(S),lastHit=[...current(S).rows].reverse().find(x=>x.t==='out'||x.t==='cyc'),allowed={cz:['czmiss','rb','bb',...(lastHit?.t==='out'?['at']:[])],rb:['rbmiss','at'],bb:['bbend','at'],at:['atend'],pull:['pullwin','pullmiss']};if(!(allowed[ph]||[]).includes(d.result))return false;
      const s=current(S),key=d.result,r=[...s.rows].reverse().find(x=>x.t==='out'||x.t==='cyc');
      if(END[key])closeSpan(S,key);else if(key==='rb'||key==='bb')r.bonus=key;else if(key==='at')r.at=true;else{s.rows.push({t:'pull',r:key==='pullwin'?'win':'miss'});if(key==='pullwin')closeSpan(S,'atend');}return END[key]||({rb:'CZ成功→決戦',bb:'CZ成功→革命',at:'AT当選',pullwin:'引き戻し あり',pullmiss:'引き戻し なし'})[key];},
    hint({S},d){if(!HINT[d.hint])return false;current(S).rows.push({t:'hint',c:d.hint,k:cycleNo(current(S))});return HINT[d.hint].label;},
    deleteRow({S},d){const rows=current(S).rows,index=Number(d.index),[r]=rows.splice(index,1);if(!r)return false;if(r.t==='cyc')rows.slice(index).forEach(x=>{if(['cyc','out','hint'].includes(x.t))x.k=Math.max(1,x.k-1);});return '削除 '+rowText(r);},
    setPt({S}){const v=document.getElementById('vv-pad-value').textContent;S.curPt=v===''?null:num(v);document.getElementById('vv-pad').remove();return '現在pt '+(S.curPt==null?'未入力':S.curPt);}
  };
  function pickPt(el){document.querySelectorAll('[data-pt]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));document.getElementById('vv-confirm').hidden=false;}
  function openPad(){
    if(document.getElementById('vv-pad'))return;
    const pad=document.createElement('div');pad.id='vv-pad';pad.className='vv-pad';pad.innerHTML='<div class="vv-pad-body"><div>現在pt</div><output id="vv-pad-value"></output><div class="vv-grid three">'+['1','2','3','4','5','6','7','8','9','クリア','0','⌫'].map(x=>'<button class="act plain" data-digit="'+x+'">'+x+'</button>').join('')+'</div><div class="vv-grid"><button class="act plain" id="vv-pad-cancel">閉じる</button><button class="act" id="vv-pad-save">登録</button></div></div>';document.body.appendChild(pad);
    pad.querySelectorAll('[data-digit]').forEach(b=>b.onclick=()=>{const out=pad.querySelector('output'),v=b.dataset.digit;out.textContent=v==='クリア'?'':v==='⌫'?out.textContent.slice(0,-1):(out.textContent+v).slice(0,6);});
    pad.querySelector('#vv-pad-cancel').onclick=()=>pad.remove();
    // 保存・Undoは通常のdata-actionと同じエンジン経路を通す。
    pad.querySelector('#vv-pad-save').onclick=()=>document.getElementById('vv-save-pt').click();
  }
  // カードの値枠は幅186px（DotGothic16 34px で半角10文字・170px）。合計と内訳を半角10文字以内で出し、超える時は内訳だけにする
  function firstBlock(S){const c=S.counts,parts=c.bb+'/'+c.rb+'/'+c.direct,full=(c.rb+c.bb+c.direct)+'('+parts+')';return full.length<=10?full:parts;}
  const cycleLogCount=S=>sum(S.spans.map(s=>s.rows.length));
  function template({S}){return ['Lパチスロ 革命機ヴァルヴレイヴ2','開始条件：'+START[S.start.kind]+(S.start.kind==='fail'?' '+S.start.failCount+'回':''),'CZ '+S.counts.cz+'回／初当り 計'+(S.counts.rb+S.counts.bb+S.counts.direct)+'回（革命'+S.counts.bb+'・決戦'+S.counts.rb+'・直撃'+S.counts.direct+'）',bestStrong(S),...Object.entries(GROUPS).map(([g,a])=>TITLES[g]+'：'+(a.filter(c=>S.groups[g][c[0]]).map(c=>c[1]+'×'+S.groups[g][c[0]]).join('／')||'—')),...S.spans.map((s,i)=>'区間'+(i+1)+'：'+(s.rows.map(rowText).join('→')||'記録なし')+(s.end?' →'+END[s.end.t]:'')),'周期推測 '+modeText(S),bayesText(S),'by slot-tools.jp／解析出典：ちょんぼりすた様'].join('\n');}
  function detail({S}){return [...Object.entries(GROUPS).map(([g,a])=>({title:TITLES[g],percent:true,denominator:knownTotal(S,g),items:a.map(c=>({label:c[1],value:S.groups[g][c[0]],hot:c[2]>0,...(c[0]==='unknown'?{text:'不明 ×'+S.groups[g][c[0]],show:S.groups[g][c[0]]>0}:{})}))})),...S.spans.map((s,i)=>({title:'周期ログ 区間'+(i+1),items:s.rows.map(r=>({label:rowText(r),text:rowText(r),value:1,show:true,hot:false}))}))];}
  const summaryRow=text=>({text,value:1,active:true});
  const groupSummary=(S,g)=>TITLES[g]+' '+(GROUPS[g].filter(c=>S.groups[g][c[0]]).map(c=>c[1]+'×'+S.groups[g][c[0]]).join('・')||'—');
  window.CheckerConfigs.vvv2={
    uiV2:true,nanaCollab:false,schemaVersion:1,storageKey:'vvv2-checker-v1',defaults:DEF,mergeKeys:['start','counts','groups'],normalizeState,
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/243853/',sourceCreditHtml:'<div class="credit">参考：ちょんぼりすた様（2026-10-28照合）／SANKYO公式スペック／一部は実機確認。第三者の独自調査値を含みます。</div>',
    SETTINGS,MODES,PRIOR_RESET,TRANS,PT1,PT2,PT3,CYCLE,CAPS,HINT,GROUPS,END_PROBS,BAFFE,BAR,SPECIAL,FIRST,PAYOUT,
    priorOf,rowLik,posterior,nextPtDist,cycleCap,winPctNow,untilWin,hazard,phase,bayesSpec,knownTotal,modeText,rowText,actions,pickPt,openPad,
    share:{title:'Lパチスロ 革命機ヴァルヴレイヴ2 設定判別メモ',hashtags:'#ヴァルヴレイヴ2 #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageCycle(ctx)+'<button id="vv-save-pt" data-action="setPt" hidden>現在pt登録</button>',pageCard],
    template,compactTemplate:template,
    card:{title:'Lパチスロ 革命機ヴァルヴレイヴ2',metaText:(ctx,date)=>date+' ／'+START[ctx.S.start.kind],titleFitMax:650,footerTags:'#ヴァルヴレイヴ2 #設定判別',downloadName:'vvv2_check.png',detailDownloadName:'vvv2_check_detail.png',detail,
      blocks:({S})=>[['CZ突入',S.counts.cz+'回'],['初当り 革/決/直',firstBlock(S)],['示唆の記録 計',sum(Object.keys(GROUPS).map(g=>groupTotal(S,g)))+'回'],['確定演出 計',strongCount(S)+'回']],
      chart:({S})=>({title:'示唆分布',x:130,step:200,width:80,items:[2,4,5,6].map(rank=>({label:'設定'+rank+(rank===6?'濃厚':'以上'),value:sum(allStrong(S).filter(x=>x.rank===rank).map(x=>x.value))}))}),
      bottom:({S})=>({title:'サマリー',startY:752,rowGap:36,fontSize:22,columns:[{x:70,items:[bestStrong(S),groupSummary(S,'endScreen'),'BAR直撃 '+S.counts.barDirect+'/'+S.counts.bar,'周期ログ '+cycleLogCount(S)+'件','周期推測 '+modeText(S)].map(summaryRow)},{x:560,items:['AT中示唆 計'+sum(['over','zorome','roundRed'].map(g=>groupTotal(S,g)))+'回',groupSummary(S,'magiusCount'),groupSummary(S,'baffe'),bayesText(S),'否定系 —'].map(summaryRow)}]})
    }
  };
})();

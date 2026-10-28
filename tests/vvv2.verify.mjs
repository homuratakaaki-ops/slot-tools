// 仕様書 §10。期待値は実装とは独立に固定する。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),clone=x=>JSON.parse(JSON.stringify(x));
const box={window:{}};vm.createContext(box);for(const p of ['checker-bayes.js','checker-data/vvv2.js'])vm.runInContext(read(p),box);
const c=box.window.CheckerConfigs.vvv2,B=box.window.CheckerBayes;
const fresh=(kind='bonusEnd')=>c.normalizeState({...clone(c.defaults),start:{kind,failCount:0}});
const cyc=(S,pt,r='miss',magius=false)=>S.spans.at(-1).rows.push({t:'cyc',k:S.spans.at(-1).rows.filter(x=>x.t==='cyc').length+1,pt,r,magius});
const hint=(S,key,k=1)=>S.spans.at(-1).rows.push({t:'hint',c:key,k});
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<=e,`${a} != ${b}`);
const eq=(a,b)=>assert.deepEqual(clone(a),clone(b));
let checks=0,failures=0;
function check(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
check('1 全解析表・全HINT effectの正本照合',()=>{
  eq(c.SETTINGS,[1,2,4,5,6]);eq(c.PRIOR_RESET,[69,25,5,1]);eq(c.TRANS,[[66,29,4,1],[0,66,32,2],[0,0,57,43],[66,31,2,1]]);
  eq(c.PT1,{100:[5,5,10,5],200:[95,95,90,95]});
  eq(c.PT2,{100:[25,29,35,0],200:[23,13,44,0],300:[5,16,3,0],400:[28,12,18,0],500:[4,14,0,0],600:[15,16,0,0]});
  eq(c.PT3,{100:[16,20,38,0],200:[31,32,39,0],300:[6,31,3,0],400:[47,17,20,0]});
  eq(c.CYCLE,[[14,29,4,15,13,23],[5,13,82,0,0,0],[11,18,14,12,45,0],[100,0,0,0,0,0]]);eq(c.CAPS,[6,3,5,1]);assert.equal(c.CYCLE[0].reduce((a,b)=>a+b),98);
  eq(c.END_PROBS,[[74,8,8,7,3,0,0,0],[65,5,10,7,3,10,0,0],[60,5,10,9,6,8,2,0],[60,10,5,9,6,8,2,0],[60,5,10,9,6,7,2,1]]);
  eq(c.BAFFE,[[55,45],[45,55],[45,55],[55,45],[45,55]]);eq(c.BAR,[3,4,5,6,7]);eq(c.SPECIAL,[1,2,4,8,12]);eq(c.FIRST,[476,473,464,459,456]);eq(c.PAYOUT,[97.7,99.3,104.7,110.8,114.9]);
  eq(Object.fromEntries(Object.entries(c.HINT).map(([k,h])=>[k,[h.type,h.effect]])),{
    sub_hito:['cycle',{capWithin:2}],sub_v3:['ref',{}],sub_hinowa:['ref',{}],sub_v5:['cycle',{capWithin:5}],sub_hiasobi:['mode',{exclude:['A']}],sub_marie:['ref',{}],voice_tekisetsu:['ref',{}],voice_bakemono:['ref',{}],voice_nice:['ref',{}],voice_wakaranai:['cycle',{capWithin:2}],pino_ayashii:['pt',{ptMax:400}],pino_chikai:['pt',{ptMax:200}],pino_kekkon:['pt',{ptMax:100}],talk_marie:['ref',{}],talk_haruto:['ref',{}],talk_souichi:['mode',{onlyIfPullMiss:['天国']}],magius4:['mode',{only:['天国']}]});
});
check('2 bonusEnd検算・reset3周期・小数第4位',()=>{
  const S=fresh();cyc(S,200);eq(c.posterior(S).p.map(v=>Number((v*100).toFixed(4))),[67.9680,27.2032,4.8288,0]);
  cyc(S,600);eq(c.posterior(S).p.map(v=>Number((v*100).toFixed(4))),[64.2682,35.7318,0,0]);
  cyc(S,400);eq(c.posterior(S).p,[1,0,0,0]);eq(c.nextPtDist(S).dist.map(x=>[x.pt,Number((x.p*100).toFixed(4))]),[[100,25],[200,23],[300,5],[400,28],[500,4],[600,15]]);
  assert.equal(c.cycleCap(S),3);near(c.winPctNow(S),28.30188679245283);
  const R=fresh('reset');cyc(R,200);cyc(R,400);assert.equal(c.winPctNow(R),100);assert.equal(c.cycleCap(R),1);cyc(R,200);assert.equal(c.posterior(R).contradiction,true);assert.ok(c.posterior(R).warnings.length);assert.equal(c.winPctNow(R),null);
});
check('3 消去規則・全消去・表示のみのマギウス短縮',()=>{
  for(const pt of [500,600]){const S=fresh();cyc(S,200);assert.equal(c.posterior(S).p[3],0);cyc(S,pt);assert.equal(c.posterior(S).p[2],0);cyc(S,400);assert.equal(c.posterior(S).p[1],0);cyc(S,200);cyc(S,200);assert.equal(c.winPctNow(S),100);cyc(S,200);assert.equal(c.posterior(S).contradiction,true);}
  const S=fresh();cyc(S,200);const P=clone(c.posterior(S)),cap=c.cycleCap(S),win=c.winPctNow(S);S.spans[0].rows[0].magius=true;eq(c.posterior(S),P);near(c.winPctNow(S),win);assert.equal(c.cycleCap(S),cap-1);
});
check('4 示唆制約・条件付き天国・矛盾解除・参考は不使用',()=>{
  let S=fresh();hint(S,'sub_hiasobi');assert.equal(c.posterior(S).p[0],0);
  S=fresh();hint(S,'talk_souichi');eq(c.posterior(S).p,c.priorOf(S));S.spans[0].rows.push({t:'pull',r:'miss'});eq(c.posterior(S).p,[0,0,0,1]);
  S=fresh();cyc(S,200);hint(S,'pino_chikai',2);eq(c.nextPtDist(S).dist.map(x=>x.pt),[100,200]);S.curPt=200;assert.ok(c.nextPtDist(S).warnings.some(w=>w.includes('チカイ')));assert.ok(c.nextPtDist(S).dist.every(x=>x.pt>200));
  S=fresh();cyc(S,200);cyc(S,600);cyc(S,400);hint(S,'sub_hiasobi',4);eq(c.posterior(S).p,[1,0,0,0]);assert.ok(c.posterior(S).warnings.some(w=>w.includes('火遊')));
  S=fresh();for(const [key,h] of Object.entries(c.HINT))if(h.type==='ref')hint(S,key);eq(c.posterior(S).p,c.priorOf(S));
  S=fresh();hint(S,'sub_hito');cyc(S,200);assert.equal(c.winPctNow(S),100);cyc(S,200);assert.ok(c.posterior(S).warnings.some(w=>w.includes('火人')));assert.equal(c.posterior(S).contradiction,false);
  S=fresh();hint(S,'pino_kekkon');cyc(S,200);assert.ok(c.posterior(S).warnings.some(w=>w.includes('ケッコン')));assert.ok(c.nextPtDist(S).dist.some(x=>x.pt>100));
  S=fresh();S.curPt=600;assert.equal(c.nextPtDist(S).contradiction,true);eq(c.nextPtDist(S).dist,[]);
});
check('5 fail 1〜5の事前・unknown・0回',()=>{
  let p=[.69,.25,.05,.01];const t=[[.66,.29,.04,.01],[0,.66,.32,.02],[0,0,.57,.43],[.66,.31,.02,.01]];
  for(let n=1;n<=5;n++){p=t[0].map((_,j)=>p.reduce((a,v,i)=>a+v*t[i][j],0));const S=fresh('fail');S.start.failCount=n;c.priorOf(S).forEach((v,i)=>near(v,p[i]));}
  eq(c.priorOf(fresh('unknown')),[.25,.25,.25,.25]);eq(c.priorOf(fresh('fail')),[.69,.25,.05,.01]);
});
check('6 prev600とspanの独立・現在ptの条件',()=>{
  const S=fresh();cyc(S,200);cyc(S,600);const p=c.posterior(S).p;
  c.nextPtDist(S).dist.forEach(x=>near(x.p,(p[0]*c.PT3[x.pt][0]+p[1]*c.PT3[x.pt][1])/100));
  S.spans[0].end={t:'bbend'};S.spans.push({rows:[],end:null});eq(c.nextPtDist(S).dist.map(x=>x.pt),[100,200]);cyc(S,200);assert.ok(c.nextPtDist(S).dist.some(x=>x.pt===600));S.curPt=400;eq(c.nextPtDist(S).dist.map(x=>x.pt),[500,600]);
});
check('7 全span遷移・途中結果の再読込・counts/groups独立',()=>{
  const exec=(S,result)=>c.actions.result({S,mode:1},{result});
  for(const end of ['czmiss','rbmiss','bbend','atend']){
    const S=fresh();cyc(S,200,'win');const p=clone(c.posterior(S).p),untouched=JSON.stringify([S.counts,S.groups]);
    if(end==='rbmiss')exec(S,'rb');if(end==='bbend')exec(S,'bb');if(end==='atend'){exec(S,'rb');exec(S,'at');}
    exec(S,end);assert.equal(S.spans.length,2);assert.equal(S.spans[0].end.t,end);assert.equal(JSON.stringify([S.counts,S.groups]),untouched);
    const expect=['czmiss','rbmiss'].includes(end)?[0,1,2,3].map(j=>p.reduce((a,v,i)=>a+v*c.TRANS[i][j]/100,0)):[.69,.25,.05,.01];c.posterior(S).p.forEach((v,i)=>near(v,expect[i]));
  }
  const S=fresh();assert.equal(c.phase(S),'pull');exec(S,'pullwin');assert.equal(S.spans.length,2);assert.equal(S.spans[0].end.t,'atend');eq(c.posterior(S).p,[.69,.25,.05,.01]);
  exec(S,'pullmiss');assert.equal(c.phase(S),'cycle');cyc(S,200,'win');exec(S,'bb');assert.equal(c.phase(c.normalizeState(clone(S))),'bb');exec(S,'at');assert.equal(c.phase(c.normalizeState(clone(S))),'at');
});
check('8 5設定の推測・カスタムOFFのみ・全rank除外・n<=d',()=>{
  const S=fresh();S.groups.endScreen.gold=1;
  for(const custom of ['on','unknown']){S.custom=custom;assert.equal(c.bayesSpec(S).multinomial.length,1);assert.equal(B.estimate(c.bayesSpec(S)).empty,true);}
  S.custom='off';const r=B.estimate(c.bayesSpec(S));eq(Object.keys(r.posterior),['1','2','4','5','6']);assert.equal(r.posterior[6],1);
  for(const [g,a] of Object.entries(c.GROUPS))for(const [key,,rank] of a)if(rank){const T=fresh();T.custom='off';T.groups[g][key]=1;const e=c.bayesSpec(T).exclusions.find(x=>x.count);eq(e.exclude,[1,2,4,5,6].filter(s=>s<rank));const R=B.estimate(c.bayesSpec(T));for(const n of e.exclude)assert.equal(R.posterior[n],0);}
  const T=fresh();T.groups.baffe.empty=1;const P=B.estimate(c.bayesSpec(T)).posterior;near(P[1],55/245);near(P[2],45/245);
  c.actions.barDirect({S:T,mode:1});assert.equal(T.counts.bar,1);assert.equal(T.counts.barDirect,1);assert.equal(c.actions.bar({S:T,mode:-1}),false);c.actions.barDirect({S:T,mode:-1});assert.equal(T.counts.barDirect,0);assert.equal(T.counts.bar,0);
});
check('9 旧データ・冪等・全階層の未知フィールド・入力のみ保存',()=>{
  const S=c.normalizeState({future:{x:1},start:{kind:'reset',future:4},counts:{future:{data:2},barDirect:3},groups:{future:{x:5},endScreen:{future:{x:6}}},spans:[{future:7,rows:[{t:'future',payload:8},{t:'cyc',k:1,pt:200,r:'miss',extra:9}]}]});
  eq(c.normalizeState(clone(S)),S);assert.equal(S.future.x,1);assert.equal(S.start.future,4);assert.equal(S.counts.future.data,2);assert.equal(S.groups.endScreen.future.x,6);assert.equal(S.groups.future.x,5);assert.equal(S.spans[0].future,7);assert.equal(S.spans[0].rows[1].extra,9);assert.equal(S.curPt,null);assert.equal(S.counts.bar,3);
  const old=c.normalizeState({});eq(old.spans,[{rows:[],end:null}]);assert.equal(old.curPt,null);
  const before=JSON.stringify(S);c.posterior(S);c.nextPtDist(S);c.cycleCap(S);c.winPctNow(S);assert.equal(JSON.stringify(S),before);
});
check('10 HTML noindex・導線なし・LF・構文・後読みなし',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vvv2-syntax-'));
  for(const name of ['vvv2-checker.html','vvv2-guide.html']){const s=read(name);assert.ok(s.includes('<meta name="robots" content="noindex,nofollow">'));assert.doesNotMatch(s,/rel="canonical"|href="(?:checkers|index|.*-guide|.*-checker)\.html/);assert.ok(!s.includes('\r'));let n=0;for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)){if(/\bsrc=/.test(m[1]))continue;const dest=path.join(tmp,name+(n++)+'.mjs');fs.writeFileSync(dest,m[2]);execFileSync(process.execPath,['--check',dest]);}}
  const js=read('checker-data/vvv2.js');assert.ok(!js.includes('\r'));assert.ok(!js.includes('(?<='));assert.ok(!js.includes('(?<!'));execFileSync(process.execPath,['--check',path.join(root,'checker-data/vvv2.js')]);
});
console.log(`Verify checks: ${checks}/10; failures: ${failures}`);if(failures)process.exitCode=1;

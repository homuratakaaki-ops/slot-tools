import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const timing='quest-fuku-failure';
function checker(mode=false){
 const prefs=JSON.stringify({includeFuku:mode});
 const mem={'mhsunbreak-checker-v1-prefs':prefs};
 const box={window:{localStorage:{getItem:k=>mem[k]??null,setItem:(k,v)=>mem[k]=v}}};
 vm.runInNewContext(read('checker-data/mhsunbreak.js'),box);
 const C=box.window.CheckerConfigs.mhsunbreak;
 return C;
}
const page=read('mhsunbreak-next-bz.html');
const script=[...page.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function compute('));
const box={window:{},localStorage:{getItem:()=>null},document:{getElementById:()=>({})}};
vm.runInNewContext(script.slice(0,script.indexOf(' function updateSignalTabs()'))+'\n})();',box);
const compute=box.window.NextBZPrototype.compute;
const scenarios={A:['MID','LOW','LOW','HI','LOW','LOW','SP'],B:['MID','LOW','HI','LOW','LOW','HI','SP'],C:['MID','HI','LOW','HI','LOW','HI','SP'],D:['MID','LOW','LOW','HI','HI','HI','SP'],E:['MID','LOW','HI','HI','HI','HI','SP'],F:['MID','HI','HI','HI','HI','HI','SP'],G:['HI','HI','HI','HI','HI','HI','SP'],H:['LOW','LOW','SP'],I:['MID','MID','SP']};
const tables={LOW:[1,2,3],MID:[2,3,4],HI:[3,4,5,6,7],SP:[7]};
const prior={A:32,B:27.3,C:14.1,D:12.5,E:6.3,F:3.1,G:3.1,H:0.8,I:0.8};
const shares={LOW:[84,9.8,6.3,0,0,0,0],MID:[0,50,48.4,1.6,0,0,0],HI:[0,0,88.7,7.8,2.7,.4,.4],SP:[0,0,0,0,0,0,100]};
const checkers=[checker(false),checker(true)];
function state(C,events,known=true){return C.normalizeState({atLog:{sessions:[{start:{known,prior:0},events,closed:false}]}})}
const candidates=(C,events)=>clone(C.scenarioModel(state(C,events)).rows[0].candidates);
function oracle(events,mode){
 return Object.keys(scenarios).filter(name=>{
  let no=0;
  for(let i=0;i<events.length;i++){
   const e=events[i],lv=scenarios[name][no];
   if(e.type==='bz'){if(!lv||!tables[lv].includes(e.table))return false;no++;}
   if(e.type==='fuku'&&mode){if(!lv)return false;no++;}
   if(e.type==='lamp'&&e.timing===timing&&['green','red'].includes(e.code)){
    const tail=events.slice(i+1),bz=tail.findIndex(x=>x.type==='bz');
    const crossed=mode&&tail.slice(0,bz<0?undefined:bz).some(x=>x.type==='fuku');
    if(!crossed&&!(e.code==='red'?['SP']:['HI','SP']).includes(lv))return false;
   }
  }
  return true;
 });
}
const asChecker=events=>events.map(e=>e.type==='bz'?{t:'bz',table:'t'+e.table,r:'miss'}:e.type==='fuku'?{t:'fuku',r:'miss'}:{t:e.type,c:e.code,...(e.timing?{timing:e.timing}:{})});
const histories=[[]];
for(let n=1;n<=3;n++)for(const prefix of histories.filter(h=>h.length===n-1))for(let table=1;table<=6;table++)histories.push([...prefix,{type:'bz',table}]);
let checks=0;
for(const mode of [false,true])for(const hist of histories)for(const color of ['blue','yellow','green','red','unknown'])for(const legacy of [false,true]){
 const events=[...hist,{type:'lamp',code:color,...(legacy?{}:{timing})}];
 const expected=oracle(events,mode),actual=compute(events,mode);
 assert.deepEqual(clone(actual?.survivors?.map(s=>s.name)||[]),expected);
 assert.deepEqual(candidates(checkers[+mode],asChecker(events)),expected);
 if(actual?.survivors){
  const weights=expected.map(name=>hist.reduce((w,e,i)=>w*shares[scenarios[name][i]][e.table-1]/100,prior[name]));
  const sum=weights.reduce((a,b)=>a+b,0);
  actual.survivors.forEach((s,i)=>assert.ok(Math.abs(s.pct-weights[i]/sum*100)<1e-9));
 }
 checks++;
}
for(const mode of [false,true])for(const code of ['green','red'])for(const events of [
 [{type:'bz',table:3},{type:'fuku'},{type:'lamp',code,timing}],
 [{type:'bz',table:3},{type:'lamp',code,timing},{type:'fuku'}],
 [{type:'bz',table:3},{type:'lamp',code,timing},{type:'fuku'},{type:'bz',table:3}],
 [{type:'bz',table:3},{type:'lamp',code,timing},{type:'bz',table:3}],
 [{type:'bz',table:3},{type:'bz',table:3},{type:'lamp',code,timing}]
]){
 const expected=oracle(events,mode);
 assert.deepEqual(clone(compute(events,mode)?.survivors?.map(s=>s.name)||[]),expected);
 assert.deepEqual(candidates(checkers[+mode],asChecker(events)),expected);checks++;
}
const C=checkers[0],legacyEvents=['white','blue','yellow','green','red','purple','rainbow','other'].map(c=>({t:'lamp',c,future:{a:1}}));
const legacy=state(C,legacyEvents);
assert.deepEqual(clone(legacy.atLog.sessions[0].events),legacyEvents);
assert.deepEqual(candidates(C,legacyEvents),Object.keys(scenarios));
const fresh=state(C,[{t:'bz',table:'t3',r:'miss'}]),ctx={S:fresh,mode:1};
const totals=JSON.stringify(C.totals(fresh));
C.actions.atEvent(ctx,{t:'lamp',c:'green',timing});
assert.equal(fresh.atLog.sessions[0].events[1].timing,timing);
assert.equal(JSON.stringify(C.totals(fresh)),totals);
assert.equal(C.actions.atEvent({S:fresh,mode:-1},{t:'lamp',c:'red',timing}),false);
const unknown=state(C,[{t:'lamp',c:'red',timing}],false);
assert.deepEqual(clone(C.scenarioModel(unknown).rows[0].candidates),Object.keys(scenarios));
console.log('PASS independent lamp scenarios, weights, Fuku timing, legacy data and minus mode:',checks,'cases');

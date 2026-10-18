import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../checker-data/mhsunbreak.js',import.meta.url),'utf8');
const clone=v=>JSON.parse(JSON.stringify(v));
const keys=['bzT1','bzT2','questN1','questN2'];
const bz=(table='t1',r='miss',extra={})=>({t:'bz',table,r,...extra});
const session=(events=[],known=true,closed=false)=>({start:known?{known:true,prior:0}:{known:false},events,closed});
function setup(){
  const box={window:{}};vm.runInNewContext(source,box);
  const c=box.window.CheckerConfigs.mhsunbreak;
  const normalize=src=>{
    const out=Object.assign(clone(c.defaults),clone(src));
    for(const k of c.mergeKeys)out[k]=Object.assign({},c.defaults[k],out[k]);
    return c.normalizeState(out,src);
  };
  const S=normalize(clone(c.defaults));
  const act=(name,ds={},mode=1)=>c.actions[name]({S,mode},ds);
  const record=(table,r='miss',d='bzT1')=>act('bzQuest',{q:table,r,d});
  return {c,S,normalize,act,record};
}
let failures=0;
function test(name,fn){try{fn();console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name,e);}}
const count=T=>Object.values(T.bzT1).reduce((a,b)=>a+b,0)+Object.values(T.bzT2).reduce((a,b)=>a+b,0);

test('01 delete blue and Astalos failures restores original totals',()=>{
  const {c,S,act,record}=setup(),before=JSON.stringify(c.totals(S));
  record('t1');record('t3','miss','bzT2');assert.equal(count(c.totals(S)),2);
  act('atDel',{index:'1'});act('atDel',{index:'0'});
  assert.equal(JSON.stringify(c.totals(S)),before);
});
test('02 legacy 35 = 33 history + 2 base, no history lost',()=>{
  const {c,normalize}=setup();
  const S=normalize({bzT1:{t1:35},atLog:{sessions:Array.from({length:33},(_,i)=>session([bz()],true,i<32))}});
  assert.equal(count(c.totals(S)),35);assert.equal(count(S.bzBase),2);
  assert.equal(S.atLog.sessions.flatMap(s=>s.events).length,33);
  keys.forEach(k=>assert.ok(!Object.hasOwn(S,k)));
});
test('03 insert before first BZ moves original to second group; S02 remains guarded',()=>{
  const {c,S,act,record}=setup();record('t3');act('atInsert',{index:'0'});
  const before=JSON.stringify(S);record('t2','win');assert.equal(JSON.stringify(S),before);
  act('bzPick',{q:'t2'});assert.equal(act('bzPickPos',{pos:'11'}),false);assert.equal(JSON.stringify(S),before);
  record('t2');const T=c.totals(S);
  assert.equal(T.bzT1.t2,1);assert.equal(T.bzT1.t3,0);assert.equal(T.bzT2.t3,1);
});
test('04 unknown start records g, legacy ungrouped events remain uncounted',()=>{
  const {c,S,act,record,normalize}=setup();act('atStart',{known:'false'});
  record('t3','miss','bzT2');assert.equal(S.atLog.sessions[0].events[0].g,'bzT2');
  assert.equal(c.totals(S).bzT2.t3,1);act('atDel',{index:'0'});assert.equal(count(c.totals(S)),0);
  const old=normalize({atLog:{sessions:[session([bz(),bz('t2','miss',{g:'invalid'})],false)]}});
  assert.equal(count(c.totals(old)),0);assert.ok(!Object.hasOwn(old.atLog.sessions[0].events[1],'g'));
});
test('05 session eviction retains totals on action and load, including legacy migration',()=>{
  const {c,S,record,normalize}=setup();
  for(let i=0;i<50;i++)record('t2','win');
  assert.equal(S.atLog.sessions.length,50);assert.equal(count(c.totals(S)),50);assert.equal(S.bzBase.bzT1.t2,1);
  const raw=clone(c.defaults);raw.atLog.sessions=Array.from({length:51},(_,i)=>session([bz('t3')],true,i<50));
  const loaded=normalize(raw);assert.equal(count(c.totals(loaded)),51);assert.equal(loaded.bzBase.bzT1.t3,1);
  delete raw.bzBase;raw.bzT1={t3:53};
  const legacy=normalize(raw);assert.equal(count(c.totals(legacy)),53);assert.equal(legacy.bzBase.bzT1.t3,3);
});
test('06 subtraction changes only available base, never history',()=>{
  const {c,S,act,record}=setup();record('t1');
  S.bzBase.bzT1.t1=2;S.bzBase.questN1.t1=1;const log=JSON.stringify(S.atLog);
  assert.notEqual(act('bzQuest',{q:'t1',d:'bzT1',r:'miss'},-1),false);
  assert.equal(act('bzQuest',{q:'t1',d:'bzT1',r:'miss'},-1),false);
  assert.notEqual(act('bzQuest',{q:'t1',d:'bzT1',r:'win'},-1),false);
  assert.equal(act('bzQuest',{q:'t1',d:'bzT1',r:'win'},-1),false);
  assert.equal(JSON.stringify(S.atLog),log);assert.equal(count(c.totals(S)),1);
});
test('07 position 11 immediately wins; miss position 11 rejected on load/edit',()=>{
  const {c,S,act,normalize}=setup();act('bzPick',{q:'t3'});
  assert.equal(typeof act('bzPickPos',{pos:'11'}),'string');
  assert.deepEqual(clone(S.atLog.sessions[0].events[0]),bz('t3','win',{pos:11}));
  assert.equal(S.atLog.sessions.length,2);assert.equal(c.scenarioModel(S).rows[0].flow[0].icon,'猛焔一閃');
  const raw=clone(c.defaults);raw.atLog.sessions=[session([bz('t2','miss',{pos:11})])];
  const normalized=normalize(raw);assert.ok(!Object.hasOwn(normalized.atLog.sessions[0].events[0],'pos'));
  Object.assign(S,normalized);assert.equal(act('bzPos',{index:'0',pos:'11'}),false);
});
test('08 normalization byte idempotence for old/new forms and nested invalid base',()=>{
  const {normalize,c}=setup();
  const invalid=normalize({bzBase:{bzT1:{t1:2.9,t2:-4,t3:Infinity},questN1:{t1:9}}});
  assert.equal(invalid.bzBase.bzT1.t1,2);assert.equal(invalid.bzBase.questN1.t1,2);
  assert.equal(invalid.bzBase.bzT1.t2,0);assert.equal(invalid.bzBase.bzT1.t3,0);
  for(const raw of [{bzT1:{t1:35},atLog:{sessions:[session([bz()])]}},clone(c.defaults),{bzBase:{bzT1:{t1:2.9,t2:-4},questN1:{t1:9}},iconLog:[{group:'bzT2',icons:['rai'],result:'win'}]}]){
    const once=normalize(raw),twice=normalize(clone(once));assert.equal(JSON.stringify(twice),JSON.stringify(once));
  }
});
test('09 engine changed-key undo normalizes without repeating migration',()=>{
  const {c,S,normalize,record}=setup();S.bzBase.bzT1.t1=2;
  const before=clone(S);record('t1');const changes=Object.keys(S).filter(k=>JSON.stringify(before[k])!==JSON.stringify(S[k]));
  assert.deepEqual(changes,['atLog']);changes.forEach(k=>{S[k]=before[k];});
  const restored=normalize(S);assert.equal(JSON.stringify(restored),JSON.stringify(before));assert.equal(count(c.totals(restored)),2);
});
if(failures)process.exitCode=1;

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const clone=v=>JSON.parse(JSON.stringify(v));
const src=fs.readFileSync(new URL('../checker-data/mhsunbreak.js',import.meta.url),'utf8');
function load(code=src,includeFuku=false){const box={window:{localStorage:{getItem:k=>k.endsWith('-prefs')?JSON.stringify({includeFuku}):null,setItem:()=>{}}}};vm.runInNewContext(code,box);return box.window.CheckerConfigs.mhsunbreak;}
const C=load(),base=load(execFileSync('git',['show','25235c20458ef2bd824def77a27f013bc80a76d6:checker-data/mhsunbreak.js'],{encoding:'utf8',maxBuffer:2e6}));
const timing='quest-fuku-failure',bz=(table='t3',r='miss')=>({t:'bz',table,r}),lamp=(c,extra={})=>({t:'lamp',c,timing,...extra});
const session=events=>({start:{known:true,prior:0},events,closed:false});
const state=events=>C.normalizeState({atLog:{sessions:[session(events)]},untouched:{keep:[1,2]}});
const model=(events,config=C,closed=false)=>clone(config.roundModel({...session(events),closed},closed));
let checks=0;const test=(label,fn)=>{fn();checks++;console.log('PASS '+label)};
test('next cue is grouped in its target BZ; pending is display-only; multiple cues retain all original indices',()=>{
 const events=[bz(),lamp('green'),{t:'serif',c:'s3'},lamp('yellow')],S=state(events),raw=JSON.stringify(S);
 const m=model(events);assert.equal(m.rounds.length,2);assert.deepEqual(m.rounds[1].lamps,[1,3]);assert.deepEqual(m.rounds[1].serifs,[2]);assert.equal(m.rounds[1].index,null);assert.equal(m.rounds[1].no,2);
 C.pages({S,mode:1,crow:()=>'',pct:()=>''},()=>'')[2]();assert.equal(JSON.stringify(S),raw);
 const filled=model([...events,bz('t3')]);assert.equal(filled.rounds[1].index,4);assert.deepEqual(filled.rounds[1].lamps,[1,3]);assert.equal(filled.rounds.length,3);
 assert.deepEqual(model([bz('t7','win')],C,true).rounds.map(r=>r.index),[0]);
});
test('legacy lamps and interrupted cue scopes stay unassigned; Fuku progress does not renumber actual BZ',()=>{
 const events=[bz(),{t:'lamp',c:'green'},lamp('red'),{t:'serif',c:'s4'},{t:'fuku',r:'miss'},bz()];
 const m=model(events,load(src,true));assert.deepEqual(m.rounds.map(r=>r.no),[1,2,3]);assert.deepEqual(m.other.map(r=>r.index),[1,2,3,4]);
 const without=model(events);assert.deepEqual(without.rounds[1].lamps,[2]);assert.deepEqual(without.rounds[1].serifs,[3]);
 const after=model([bz(),{t:'fuku',r:'miss'},lamp('green')],load(src,true));assert.deepEqual(after.rounds[1].lamps,[2]);
 const partial=C.roundModel({start:{known:false,prior:0},events:[bz(),lamp('blue')],closed:false});assert.equal(partial.rounds[1].no,null);
});
test('failure creates one source and a pending unknown atomically; cancellation restores unrelated state',()=>{
 const S=state([]),ctx={S,mode:1};assert.ok(C.actions.bzFailure(ctx,{d:'bzT1',q:'t3'}));
 const [b,l]=S.atLog.sessions[0].events;assert.equal(b.t,'bz');assert.equal(l.c,'unknown');assert.equal(l.pendingChoice,true);assert.equal(l.autoFailureId,b.failureInputId);assert.equal(C.totals(S).bzT1.t3,1);
 assert.equal(C.actions.bzFailure(ctx,{d:'bzT2',q:'t3'}),false);assert.equal(S.atLog.sessions[0].events.length,2);
 assert.ok(C.actions.lampChoose(ctx,{session:'0',index:'1',c:'unknown'}));assert.equal(l.pendingChoice,undefined);assert.deepEqual(clone(C.scenarioModel(S).rows[0].candidates),clone(base.scenarioModel(state([bz()])).rows[0].candidates));
 assert.deepEqual(S.untouched,{keep:[1,2]});
 const T=state([]);C.actions.bzFailure({S:T,mode:1},{d:'bzT1',q:'t2'});assert.ok(C.actions.cancelFailure({S:T,mode:1}));assert.equal(T.atLog.sessions[0].events.length,0);assert.equal(C.totals(T).bzT1.t2,0);
});
test('source deletion removes only its own auto lamp; colour edit and Fuku failure preserve actual BZ totals',()=>{
 const S=state([]),ctx={S,mode:1};C.actions.bzFailure(ctx,{d:'bzT1',q:'t3'});C.actions.lampChoose(ctx,{session:'0',index:'1',c:'green'});
 const before=clone(C.totals(S));C.actions.lampEdit(ctx,{session:'0',index:'1'});assert.ok(C.actions.lampChoose(ctx,{session:'0',index:'1',c:'red'}));assert.deepEqual(clone(C.totals(S)),before);
 C.actions.atEvent(ctx,{t:'serif',c:'s1'});assert.ok(C.actions.atDel(ctx,{index:'0'}));assert.deepEqual(clone(S.atLog.sessions[0].events),[{t:'serif',c:'s1'}]);
 assert.ok(C.actions.fukuFailure(ctx,{}));assert.equal(C.totals(S).bzT1.t3,0);assert.equal(S.atLog.sessions[0].events[2].pendingChoice,true);
 assert.equal(C.actions.bzFailure({S:state([]),mode:-1},{d:'bzT1',q:'t3'}),false);
 const cap=state(Array.from({length:199},()=>({t:'serif',c:'s1'})));assert.equal(C.actions.bzFailure({S:cap,mode:1},{d:'bzT1',q:'t3'}),false);assert.equal(cap.atLog.sessions[0].events.length,199);
});
test('legacy save, scenario model, totals and template are unchanged; no synthetic unknowns on load',()=>{
 const fixtures=[[],[bz(),{t:'lamp',c:'red'},{t:'serif',c:'s3'}],[bz('t1'),{t:'eye',c:'jay'},bz('t2')],[{t:'fuku',r:'miss'},bz(),{t:'future',deep:{keep:1}}]];
 for(const events of fixtures){
  const raw={atLog:{sessions:[session(events)]},untouched:{x:1}};const a=C.normalizeState(clone(raw)),b=base.normalizeState(clone(raw));
  assert.equal(JSON.stringify(a),JSON.stringify(b));assert.deepEqual(clone(C.totals(a)),clone(base.totals(b)));assert.deepEqual(clone(C.scenarioModel(a)),clone(base.scenarioModel(b)));
  const ctx=S=>({S,mode:1,nanaCreditText:()=>'',pct:()=>''});assert.equal(C.template(ctx(a)),base.template(ctx(b)));
 }
});
console.log('PASS BZ round grouping and compulsory failure input:',checks,'groups');
const future={t:'submarine',c:'future-passenger',extra:{keep:1}};
assert.deepEqual(clone(state([future]).atLog.sessions[0].events),[future]);
console.log('PASS unknown submarine code is preserved when its type becomes displayable');

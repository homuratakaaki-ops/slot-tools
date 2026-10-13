// Independent tables verify both hypotheses without mutating recorded BZ counts.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const src=fs.readFileSync(new URL('../checker-data/mhsunbreak.js',import.meta.url),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const rows={A:'MLLHLLS',B:'MLHLLHS',C:'MHLHLHS',D:'MLLHHHS',E:'MLHHHHS',F:'MHHHHHS',G:'HHHHHHS',H:'LLS',I:'MMS'};
const prior={A:32,B:27.3,C:14.1,D:12.5,E:6.3,F:3.1,G:3.1,H:.8,I:.8};
const share={t1:{L:84},t2:{L:9.8,M:50},t3:{L:6.3,M:48.4,H:88.7},t4:{M:1.6,H:7.8},t5:{H:2.7},t6:{H:.4},t7:{H:.4,S:100}};
function load(on=false){
  const data=new Map([['mhsunbreak-checker-v1-prefs',JSON.stringify({includeFuku:on,tplAtLog:true,foreign:'retain'})]]);
  const box={window:{},localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},setTimeout:()=>0};
  vm.runInNewContext(src,box);return {c:box.window.CheckerConfigs.mhsunbreak,data};
}
const state=(c,events,prior=0)=>{const S=clone(c.defaults);c.normalizeState(S);S.atLog.sessions[0].start.prior=prior;S.atLog.sessions[0].events=clone(events);return S;};
const bz=t=>({t:'bz',table:t,r:'miss'}),f={t:'fuku',r:'miss'};
let cases=0;
for(const on of [false,true]){
  const {c}=load(on);
  // Every four-event mix of seven BZ tables and a failed lottery (8192 cases).
  for(let code=0;code<4096;code++){
    let n=code;const ev=[];for(let i=0;i<4;i++){const x=n%8;n=Math.floor(n/8);ev.push(x===7?f:bz('t'+(x+1)));}
    if(!ev.some(e=>e.t==='bz'))continue;
    const expected=Object.keys(rows).filter(name=>{let no=0;return ev.every(e=>{if(e.t==='fuku'){if(on)no++;return true;}const ok=(share[e.table][rows[name][no]]||0)>0;no++;return ok;});});
    const S=state(c,ev),before=JSON.stringify(S),model=clone(c.scenarioModel(S));
    assert.deepEqual(model.rows[0].candidates,expected);
    assert.deepEqual(model.rows[0].flow.map(e=>e.no),ev.filter(e=>e.t==='bz').map((_,i)=>String(i+1)));
    const crossed=on&&ev.some(e=>e.t==='fuku')&&expected.some(name=>rows[name].length<ev.length+1);
    const pct=clone(c.scenarioPct(S,S.atLog.sessions[0]));
    if(expected.length<2||crossed)assert.equal(pct,null);
    else{
      const weights=expected.map(name=>{let no=0,w=prior[name];for(const e of ev){if(e.t==='fuku'){if(on)no++;continue;}w*=share[e.table][rows[name][no]];no++;}return w;});
      const sum=weights.reduce((a,b)=>a+b,0);
      assert.deepEqual(pct.map(x=>x.pct),weights.map(w=>Math.round(w/sum*100)));
    }
    assert.equal(JSON.stringify(S),before);cases++;
  }
}
const {c,data}=load(false),S=state(c,[bz('t2'),f]),before=JSON.stringify(S);
assert.match(c.scenarioModel(S).rows[0].nextBz,/2回目/);
c.actions.fukuMode({S,mode:1});
assert.match(c.scenarioModel(S).rows[0].nextBz,/福引込み3回目/);
assert.equal(JSON.stringify(S),before);
assert.equal(JSON.parse(data.get('mhsunbreak-checker-v1-prefs')).foreign,'retain');
assert.equal(load(true).c.scenarioModel(state(load(true).c,[bz('t2'),f])).rows[0].nextBz,c.scenarioModel(S).rows[0].nextBz);
assert.equal(c.scenarioPct(S,S.atLog.sessions[0])===null,false);
const partial=state(c,[bz('t2')],2);
assert.equal(c.scenarioPct(partial,partial.atLog.sessions[0]),null);
assert.match(c.scenarioModel(partial).rows[0].unknown,/福引回数が不明/);
const sp=state(c,[bz('t1'),f,f]);
assert.match(c.scenarioModel(sp).rows[0].nextBz,/SPの回数を通過/);
const a=state(c,[{t:'serif',c:'s4'},f,bz('t1')]);
assert.ok(c.scenarioModel(a).rows[0].candidates.length>0,'cross-lottery speech must not eliminate candidates');
c.actions.atEvent({S,mode:1},{t:'fuku',r:'win'});
assert.equal(S.atLog.sessions.length,2);
assert.equal(S.atLog.sessions[0].closed,true);
assert.deepEqual(clone(S.atLog.sessions[1].start),{known:true,prior:0});
c.actions.fukuMode({S,mode:-1});assert.equal(JSON.parse(data.get('mhsunbreak-checker-v1-prefs')).includeFuku,false);
console.log('PASS independent candidates, weights and real BZ numbers: '+cases+' cases; switch, persistence, partial start, speech, SP boundary, AT closure');

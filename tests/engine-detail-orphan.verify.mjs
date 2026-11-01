import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const old=execFileSync('git',['show','2b85b40:checker-engine.js'],{cwd:root,encoding:'utf8'});
const current=read('checker-engine.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function engine(source){const box={window:{},console};vm.createContext(box);vm.runInContext(source,box);return box.window.CheckerEngine;}
const before=engine(old),after=engine(current);
const env={document:{getElementById:()=>null},localStorage:{getItem:()=>null,setItem:()=>{}}};
function rows(engine,sections){return clone(engine.createApp({defaults:{},card:{detail:()=>sections}},env)._detailRows());}
const sec=(n,title='section')=>({title,items:Array.from({length:n},(_,i)=>({label:title+i,value:1}))});
const prefix=n=>Array.from({length:n},(_,i)=>sec(1,'inline'+i));
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('section at 19 moves to 20, spacer counts as a row',()=>{
  const data=[...prefix(19),sec(2)],r=rows(after,data);
  assert.deepEqual(r[19],{type:'spacer',hot:false,value:0});assert.equal(r[20].type,'section');
  assert.deepEqual(r.filter(r=>r.type!=='spacer'),rows(before,data));
});
for(const n of [18,20])check('section at '+n+' unchanged',()=>{
  const data=[...prefix(n),sec(2)];assert.deepEqual(rows(after,data),rows(before,data));
});
check('inline at 19 unchanged',()=>assert.deepEqual(rows(after,prefix(23)),rows(before,prefix(23))));
for(const hot of [false,true])check('overflow hidden item count; hot='+hot,()=>{
  const data=[...prefix(19),sec(35,'overflow')];data.forEach(s=>s.items.forEach(i=>i.hot=hot));
  const r=rows(after,data),visible=r.filter(x=>x.type==='item'||x.type==='inline').length;
  assert.ok(r.length<=40);assert.equal(r[19].type,'spacer');assert.equal(r[20].type,'section');
  assert.equal(r.at(-1).text,'ほか '+(54-visible)+'項目');
});
const tested=[];
for(const file of fs.readdirSync(path.join(root,'checker-data')).filter(f=>f.endsWith('.js'))){
  const box={window:{},console};vm.createContext(box);vm.runInContext(read('checker-data/'+file),box);
  for(const [id,c] of Object.entries(box.window.CheckerConfigs||{})){
    if(!c.card?.detail)continue;
    check(id+' all items once: no orphan / <=40',()=>{
      const S=clone(c.defaults);
      // Fill numeric leaves, preserving arrays and switches used by machine state.
      function fill(o){for(const [k,v] of Object.entries(o)){if(typeof v==='number')o[k]=1;else if(v&&typeof v==='object'&&!Array.isArray(v))fill(v);}}
      fill(S);
      const app=after.createApp(c,env);app.setState(S);const r=clone(app._detailRows());
      assert.ok(r.length>0);assert.ok(r.length<=40);assert.notEqual(r[19]?.type,'section');
      tested.push(id);
    });
  }
}
for(const id of ['godzieva2','ragnador','garo'])assert.ok(tested.includes(id));
check('all root HTML changes are exactly the engine query',()=>{
  let count=0;
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
    const now=read(file);if(!now.includes('checker-engine.js?v='))continue;
    const base=execFileSync('git',['show','2b85b40:'+file],{cwd:root,encoding:'utf8'});
    assert.equal(now,base.replaceAll('checker-engine.js?v=20260924','checker-engine.js?v=20261102-orphan'));count++;
  }
  assert.equal(count,36);
});
console.log(`PASS engine-detail-orphan: ${checks} checks; ${tested.length} machine configs`);

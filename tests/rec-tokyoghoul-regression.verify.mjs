// Compare real button paths and persisted session data against the specified main.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {harness,root} from './rec-tokyoghoul.verify.mjs';
const base=execFileSync('git',['-c','safe.directory='+root,'show','8d041ce:tools/rec/index.html'],{cwd:root,encoding:'utf8'});
const stage1=execFileSync('git',['-c','safe.directory='+root,'show','9f19a1c:tools/rec/index.html'],{cwd:root,encoding:'utf8'});
const current=fs.readFileSync(path.join(root,'tools/rec/index.html'),'utf8');
const pages={'/base/stage1/tools/rec/index.html':stage1,'/base/tools/rec/index.html':base,'/tools/rec/index.html':current};
// The base HTML's relative store script is served at the same path as production.
const h=await harness(pages,'regression'),results=[];
const {ev,seed,button,click,input}=h;
function normalize(value){
  if(Array.isArray(value))return value.map(normalize);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['id','op','at','startAt','endAt','createdAt','updatedAt','startedAt'].includes(k)).map(([k,v])=>[k,normalize(v)]));
  return value;
}
async function run(page,machine){
  await seed(page,undefined,'slot-tools-rec');
  if(machine==='generic')await input('#stMachine','比較汎用');else await button(machine==='karakuri2'?'からくりサーカス2':'ハイビリターン30','#scSetup');
  await input('#stMedal',100);await click('#stStart');
  const grid=label=>button(label,'#gridRows');
  const ui=[];
  async function captureUi(){
    await ev('await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
    await new Promise(r=>setTimeout(r,300));
    ui.push(await ev('return [...document.querySelectorAll("#gridRows button,#rareCounts,#rareCounts *,#badges .badge,#sheet.open button")].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return {text:b.textContent,cls:b.className,x:r.x,y:r.y,w:r.width,h:r.height,color:s.color,bg:s.backgroundColor}})'));
  }
  async function captureZen(){
    const selector=await ev('const b=[...document.querySelectorAll("#gridRows button")].find(b=>/前兆/.test(b.textContent));if(b){b.dataset.zenTest="yes";return "[data-zen-test=yes]"}return document.querySelector("#badges .badge").textContent==="32G中"?"#badges .badge":null');
    if(selector){await click(selector);await captureUi();await click('#shClose')}
  }
  await captureUi();await grid('レア役');await captureUi();await click('#shClose');await captureZen();
  if(machine!=='hibireturn'){
    const stages=await ev('return __rec.MACHINES[__rec.S.cur.machineId].zenchou.stages');
    await grid(stages[0]);await button(stages.at(-1));await captureUi();await grid(stages.at(-1));await captureUi();await click('#shClose');await click('#bUndo');
  }
  const first=machine==='generic'?'CZ':machine==='karakuri2'?'機械仕掛けの女神':'BIG';
  async function hit(label){await grid('当選');await button(label);if(machine!=='generic')await button('当選を記録');if(machine==='karakuri2'&&label==='AT直撃'){await button('勝');await button('記録する')}}
  async function end(){const c=await ev('return __rec.S.cur');await grid(c.hit.label+' 終了');if(c.hit.kind==='cz'){await button('失敗');await button('失敗を記録')}else{if(machine==='hibireturn')await button('白');await button(machine==='karakuri2'?'幕間チャンスへ（AT後）':machine==='hibireturn'?'終了する（32G中へ）':'終了する')}}
  await hit(first);await captureUi();await end();await captureUi();await captureZen();
  await hit(machine==='generic'?'AT':machine==='karakuri2'?'AT直撃':'REG');await captureUi();await end();
  await click('#bUndo');await click('#bUndo');
  await click('#bUtil');await button('やめる（終了して記録する）');await input('#shBody input',150);await button('終了する');
  for(let i=0;i<100;i++){if(await ev('return __rec.ready'))break;await new Promise(r=>setTimeout(r,20))}
  const saved=await ev('return structuredClone(__rec.S.sessions.at(-1))');assert.ok(saved?.endAt);
  // Reload, so this comparison includes serialization and storage recovery.
  await h.open('/empty');await h.open(page);const loaded=await ev('return structuredClone(__rec.S.sessions.at(-1))');
  assert.deepEqual(await ev('return __errs'),[]);
  // Existing normalization adds legacy defaults on load; compare both stages
  // between revisions without suppressing any nonvolatile field.
  return {saved:normalize(saved),loaded:normalize(loaded),ui};
}
async function normalTicketBadges(page){
  await seed(page,undefined,'slot-tools-rec');
  await button('からくりサーカス2','#scSetup');await click('#stStart');
  const data=await ev('return structuredClone(__rec.S)');
  data.cur.ticket=true;data.cur.hit=null;data.cur.mode='normal';
  // Restore the retained-ticket state through the normal load/render path.
  await seed(page,data,'slot-tools-rec');
  assert.deepEqual(await ev('return [__rec.S.cur.ticket,__rec.S.cur.hit,__rec.S.cur.mode]'),[true,null,'normal']);
  const badges=await ev('return [...document.querySelectorAll("#badges .badge")].filter(b=>b.getClientRects().length).map(b=>b.textContent)');
  assert.deepEqual(await ev('return __errs'),[]);
  return badges;
}
try{
  for(const revision of ['8d041ce','9f19a1c'])for(const machine of ['generic','karakuri2','hibireturn']){
    try{const old=await run(revision==='8d041ce'?'/base/tools/rec/index.html':'/base/stage1/tools/rec/index.html',machine),now=await run('/tools/rec/index.html',machine);fs.writeFileSync(path.join(h.artifacts,machine+'-'+revision+'-base.json'),JSON.stringify(old,null,2));fs.writeFileSync(path.join(h.artifacts,machine+'-current.json'),JSON.stringify(now,null,2));assert.deepEqual(now,old);results.push({machine,revision,ok:true});console.log('PASS '+machine)}catch(e){results.push({machine,ok:false,error:e.stack});console.error('FAIL '+machine+' '+e.stack)}
  }
  const revision='8d041ce',machine='karakuri2-normal-ticket';
  try{
    const old=await normalTicketBadges('/base/tools/rec/index.html'),now=await normalTicketBadges('/tools/rec/index.html');
    assert.ok(old.includes('一劇権利'));assert.deepEqual(now,old);
    fs.writeFileSync(path.join(h.artifacts,machine+'-badges.json'),JSON.stringify({base:old,current:now},null,2));
    results.push({machine,ok:true});console.log('PASS '+machine);
  }catch(e){results.push({machine,ok:false,error:e.stack});console.error('FAIL '+machine+' '+e.stack)}
}finally{fs.writeFileSync(path.join(h.artifacts,'regression-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({pass:results.filter(r=>r.ok).length,fail:results.filter(r=>!r.ok).length,artifacts:h.artifacts}));await h.close()}
if(results.some(r=>!r.ok))process.exitCode=1;

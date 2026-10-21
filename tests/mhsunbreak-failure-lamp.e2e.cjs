'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),timing='quest-fuku-failure';
const preview=process.env.SUNBREAK_PREVIEW==='1';
const checkerKey=preview?'mhsunbreak-lamp-preview-20261021-checker-v1':'mhsunbreak-checker-v1',sourceKey=preview?'mhsunbreak-lamp-preview-20261021-recording-v1':'mhsunbreak-next-bz-recording-v1';
let server,browser,base;
before(async()=>{
 server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript; charset=utf-8':'application/octet-stream');
  res.end(fs.readFileSync(file));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/'+(preview?'preview/mhsunbreak-lamp-20261021/':'');
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function open(width=390){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
 await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>window.addEventListener('unhandledrejection',e=>{throw Error(String(e.reason))}));
 await page.goto(base+'mhsunbreak-next-bz.html');
 if(preview)await page.evaluate(()=>{for(const k of ['mhsunbreak-checker-v1','mhsunbreak-checker-v1-prefs','mhsunbreak-next-bz-recording-v1','mhsunbreak-next-bz-transfer-v1'])localStorage.setItem(k,'production-sentinel')});
 return {context,page,errors};
}
async function assertIsolation(page){if(preview)assert.deepEqual(await page.evaluate(()=>['mhsunbreak-checker-v1','mhsunbreak-checker-v1-prefs','mhsunbreak-next-bz-recording-v1','mhsunbreak-next-bz-transfer-v1'].map(k=>localStorage.getItem(k))),Array(4).fill('production-sentinel'));}
const stored=(p,key)=>p.evaluate(k=>localStorage.getItem(k),key);
const result=p=>p.evaluate(k=>window.NextBZPrototype.compute(JSON.parse(localStorage.getItem(k)).history),sourceKey);
test('real PUSH buttons: yellow has no invented weight; green targets next BZ; reload, delete and Undo',async()=>{
 const {page,context,errors}=await open();
 await page.locator('#includeFuku').uncheck();
 await page.locator('#tableButtons [data-table="3"]').click();
 const original=await result(page);
 await page.locator('[data-tab="lamp"]').click();
 assert.equal(await page.locator('[data-signal="lamp"]').count(),4);
 await page.locator('[data-signal="lamp"][data-code="yellow"]').click();
 assert.deepEqual(await result(page),original);
 assert.equal(JSON.parse(await stored(page,sourceKey)).history[1].timing,timing);
 await page.locator('#restore').click();
 await page.locator('[data-tab="lamp"]').click();
 await page.locator('[data-signal="lamp"][data-code="green"]').click();
 assert.deepEqual((await result(page)).survivors.map(s=>s.name),['C','F','G']);
 assert.match(await page.locator('#history').innerText(),/次回HI以上濃厚/);
 await page.reload();assert.deepEqual((await result(page)).survivors.map(s=>s.name),['C','F','G']);
 await page.locator('#history [data-remove="1"]').click();assert.deepEqual(await result(page),original);
 await page.locator('#restore').click();assert.deepEqual((await result(page)).survivors.map(s=>s.name),['C','F','G']);
 await page.locator('[data-tab="lamp"]').click();
 if(process.env.PROOF_DIR)await page.screenshot({path:path.join(process.env.PROOF_DIR,'lamp-predictor.png'),fullPage:true});
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('red SP, transfer provenance, checker recalculation, Undo and raw backup restoration',async()=>{
 const {page,context,errors}=await open();
 const original='{"games":456,"hits":[123],"unrelated":{"keep":true}}';
 await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:checkerKey,raw:original});
 await page.locator('#includeFuku').uncheck();
 await page.locator('#tableButtons [data-table="3"]').click();await page.locator('#tableButtons [data-table="3"]').click();
 await page.locator('[data-tab="lamp"]').click();await page.locator('[data-signal="lamp"][data-code="red"]').click();
 assert.equal((await result(page)).share.SP,100);
 assert.deepEqual((await result(page)).survivors.map(s=>s.name),['H','I']);
 await page.locator('#startTransfer').click();await page.waitForURL('**/mhsunbreak-bz-import.html');
 assert.equal(await stored(page,checkerKey),original);
 await page.locator('[data-result="1"]').selectOption('miss');await page.locator('#apply').click();
 const saved=JSON.parse(await stored(page,checkerKey));
 assert.deepEqual(saved.unrelated,{keep:true});assert.equal(saved.games,456);
 assert.deepEqual(saved.atLog.sessions[0].events[2],{t:'lamp',c:'red',timing});
 await page.goto(base+'mhsunbreak-checker.html');await page.locator('#nav [data-p="2"]').click();
 assert.match(await page.locator('.at-next').innerText(),/SP/);
 assert.match(await page.locator('.now-last').innerText(),/次回SP濃厚/);
 const totals=await page.evaluate(k=>JSON.stringify(window.CheckerConfigs.mhsunbreak.totals(JSON.parse(localStorage.getItem(k)))),checkerKey);
 await page.locator('.bz-round [data-action="atOpen"][data-index="2"]').click();
 await page.locator('[data-action="lampEdit"]').click();await page.locator('[data-action="lampChoose"][data-c="blue"]').click();
 assert.equal(await page.evaluate(k=>JSON.stringify(window.CheckerConfigs.mhsunbreak.totals(JSON.parse(localStorage.getItem(k)))),checkerKey),totals);
 await page.locator('#undoBtn').click();
 assert.equal(JSON.parse(await stored(page,checkerKey)).atLog.sessions[0].events.length,3);
 // Restore the exact imported bytes, then verify the dedicated backup restores the original.
 await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:checkerKey,raw:JSON.stringify(saved)});
 await page.goto(base+'mhsunbreak-bz-import.html');
 await page.locator('#rollback').click();assert.equal(await stored(page,checkerKey),original);
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('old lamp provenance is retained and never upgraded during import matching',async()=>{
 const {page,context,errors}=await open();
 const history=[{type:'bz',table:3},{type:'lamp',code:'green'}];
 await page.evaluate(({sourceKey,history})=>localStorage.setItem(sourceKey,JSON.stringify({version:1,sessionId:'legacy-fixture',includeFuku:false,history})),{sourceKey,history});
 await page.reload();assert.equal((await result(page)).survivors.length,9);
 await page.locator('[data-tab="lamp"]').click();await page.locator('[data-signal="lamp"][data-code="green"]').click();
 const source=JSON.parse(await stored(page,sourceKey));
 assert.equal(source.history[1].timing,undefined);assert.equal(source.history[2].timing,timing);
 // Same colour with unknown timing cannot be matched as a failure-timed event.
 const raw=JSON.stringify({atLog:{sessions:[{start:{known:true,prior:0},closed:false,events:[{t:'bz',table:'t3',r:'miss'},{t:'lamp',c:'green'}]}]}});
 await page.evaluate(({sourceKey,checkerKey,raw})=>{const d=JSON.parse(localStorage.getItem(sourceKey));d.history.splice(1,1);localStorage.setItem(sourceKey,JSON.stringify(d));localStorage.setItem(checkerKey,raw)},{sourceKey,checkerKey,raw});
 await page.reload();await page.locator('#startTransfer').click();await page.waitForURL('**/mhsunbreak-bz-import.html');
 await page.locator('[data-result="0"]').selectOption('miss');
 assert.equal(await page.locator('#apply').isDisabled(),true);assert.equal(await stored(page,checkerKey),raw);
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('both rendered pages: 320/360/390/412px, four visible labelled options, no horizontal overflow',async()=>{
 for(const width of [320,360,390,412]){
  const {page,context,errors}=await open(width);
  await page.locator('[data-tab="lamp"]').click();
  for(const b of await page.locator('[data-signal="lamp"]').all()){const r=await b.boundingBox();assert.ok(r.width>=44&&r.height>=44);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.goto(base+'mhsunbreak-checker.html');await page.locator('#nav [data-p="2"]').click();
  assert.equal(await page.locator('#ent-lamp').count(),0);
  await page.locator('[data-action="bzPick"][data-q="t3"]').click();
  await page.locator('[data-action="bzFailure"]').click();
  const buttons=page.locator('#lampDialog [data-action="lampChoose"]');assert.equal(await buttons.count(),5);
  for(const b of await buttons.all()){const r=await b.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=width+.5&&r.height>=48);}
  await page.locator('[data-action="lampChoose"][data-c="unknown"]').click();
  if(width===390&&process.env.PROOF_DIR)await page.screenshot({path:path.join(process.env.PROOF_DIR,'lamp-checker.png')});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
 }
});

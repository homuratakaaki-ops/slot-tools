'use strict';
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),checkerKey='mhsunbreak-checker-v1',sourceKey='mhsunbreak-next-bz-recording-v1';
let server,browser,base;
before(async()=>{
 server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!f.startsWith(root+path.sep)||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.js')?'text/javascript; charset=utf-8':'application/octet-stream');res.end(fs.readFileSync(f));});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));});
async function open(tool,width=390,height=844){const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>new URL(r.request().url()).origin===new URL(base).origin?r.continue():r.abort());await page.goto(base+tool);return {context,page,errors};}
const read=(p,k)=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),k);
const sourceMemo=async p=>{await p.locator('.signal-tab[data-tab="submarine"]').click();await p.locator('[data-signal="submarine"][data-code="with_garuku"]').click();};
const checkerMemo=p=>p.locator('[data-action="atEvent"][data-t="submarine"][data-c="without_garuku"]').click();
const checkerState=p=>p.evaluate(()=>window.__checkerApp.getState());
const selectCycle=(p,v,checker)=>p.locator('#replayCycleDialog '+(checker?'[data-action="replayCycleChoose"][data-cycle="':'[data-cycle="')+v+'"]').click();
const selectAllOther=async p=>{const box=p.locator('.round-other');if(!await box.evaluate(e=>e.open))await box.locator('summary').click();};

test('checker cycle choices 1..5/unknown are durable, preserve BZ model, and are editable per memo',async()=>{
 const {page,context,errors}=await open('mhsunbreak-checker.html');await page.locator('#nav [data-p="2"]').click();
 const before=await page.evaluate(()=>{const C=window.CheckerConfigs.mhsunbreak,S=window.__checkerApp.getState();return {totals:C.totals(S),scenario:C.scenarioPct(S,S.atLog.sessions[0])}});
 for(const value of [1,2,3,4,5,'unknown']){await checkerMemo(page);assert.equal(await page.locator('#replayCycleDialog [data-action="replayCycleChoose"]').count(),6);await selectCycle(page,value,true);const e=(await checkerState(page)).atLog.sessions[0].events.at(-1);assert.equal(e.replayCycle,value);assert.equal(e.pendingReplayCycle,undefined);}
 await page.reload();await page.locator('#nav [data-p="2"]').click();
 assert.equal(await page.locator('#replayCycleDialog').count(),0);await selectAllOther(page);
 for(const value of [1,2,3,4,5])assert.match(await page.locator('.round-other').innerText(),new RegExp('規定リプレイ '+value+'周期目'));
 await page.locator('.round-other [data-index="2"]').click();await page.locator('[data-action="replayCycleEdit"]').click();await selectCycle(page,5,true);
 const events=(await checkerState(page)).atLog.sessions[0].events;assert.deepEqual(events.map(e=>e.replayCycle),[1,2,5,4,5,'unknown']);
 const after=await page.evaluate(()=>{const C=window.CheckerConfigs.mhsunbreak,S=window.__checkerApp.getState();return {totals:C.totals(S),scenario:C.scenarioPct(S,S.atLog.sessions[0])}});
 assert.deepEqual(after.totals,before.totals);assert.deepEqual(after.scenario,before.scenario);
 assert.deepEqual(errors,[]);await context.close();
});

test('checker restores pending selection, traps focus, supports Undo/cancel and keeps legacy fields',async()=>{
 const {page,context,errors}=await open('mhsunbreak-checker.html');
 const original={hits:[123],future:{keep:7},atLog:{schemaVersion:2,sessions:[{start:{known:true,prior:0},closed:false,events:[{t:'submarine',c:'with_garuku',extra:{keep:true}}]}]}};
 await page.evaluate(({k,v})=>localStorage.setItem(k,JSON.stringify(v)),{k:checkerKey,v:original});await page.reload();await page.locator('#nav [data-p="2"]').click();
 assert.equal(await page.locator('#replayCycleDialog').count(),0);await selectAllOther(page);assert.match(await page.locator('.round-other').innerText(),/周期未記録/);
 await checkerMemo(page);let S=await checkerState(page);assert.equal(S.atLog.sessions[0].events[1].pendingReplayCycle,true);
 await page.reload();assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);
 await page.locator('#replayCycleDialog button').last().focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#replayCycleDialog button').first().evaluate(e=>e===document.activeElement),true);
 await selectCycle(page,3,true);await page.locator('#undoBtn').click();assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);
 await page.locator('[data-action="replayCycleCancel"]').click();S=await checkerState(page);assert.equal(S.atLog.sessions[0].events.length,1);assert.deepEqual(S.atLog.sessions[0].events[0],original.atLog.sessions[0].events[0]);assert.deepEqual(S.hits,[123]);assert.deepEqual(S.future,{keep:7});
 await page.locator('#undoBtn').click();await selectCycle(page,'unknown',true);await page.locator('#nav [data-p="2"]').click();await selectAllOther(page);if(!await page.locator('[data-action="atDel"]').count())await page.locator('.round-other [data-index="1"]').click();await page.locator('[data-action="atDel"]').click();assert.equal((await checkerState(page)).atLog.sessions[0].events.length,1);await page.locator('#undoBtn').click();assert.equal((await checkerState(page)).atLog.sessions[0].events[1].replayCycle,'unknown');
 assert.deepEqual(errors,[]);await context.close();
});

test('predictor cycles are memo-only, durable, editable, and selection Undo reopens the mandatory dialog',async()=>{
 const {page,context,errors}=await open('mhsunbreak-next-bz.html');
 const before=await page.evaluate(()=>window.NextBZPrototype.compute([]));
 for(const value of [1,2,3,4,5,'unknown']){await sourceMemo(page);assert.equal(await page.locator('#replayCycleDialog [data-cycle]').count(),6);await selectCycle(page,value,false);}
 await page.reload();assert.equal(await page.locator('#replayCycleDialog').isVisible(),false);let draft=await read(page,sourceKey);assert.deepEqual(draft.history.map(e=>e.replayCycle),[1,2,3,4,5,'unknown']);assert.deepEqual(await page.evaluate(h=>window.NextBZPrototype.compute(h),draft.history),before);
 await page.locator('[data-cycle-edit="2"]').click();await selectCycle(page,1,false);draft=await read(page,sourceKey);assert.equal(draft.history[2].replayCycle,1);
 await sourceMemo(page);await page.reload();assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);await selectCycle(page,2,false);
 await page.locator('#restore').click();assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);await page.locator('#replayCycleClose').click();draft=await read(page,sourceKey);assert.equal(draft.history.length,6);await page.locator('#restore').click();assert.equal(await page.locator('#replayCycleDialog').isVisible(),true);await selectCycle(page,'unknown',false);
 assert.deepEqual(errors,[]);await context.close();
});

test('transfer preserves a chosen cycle and raw backup; different-cycle prefix is rejected',async()=>{
 const {page,context,errors}=await open('mhsunbreak-next-bz.html');const raw=JSON.stringify({hits:[135],future:{keep:9},atLog:{schemaVersion:2,sessions:[{start:{known:true,prior:0},events:[],closed:false}]}});
 await page.evaluate(({k,raw})=>localStorage.setItem(k,raw),{k:checkerKey,raw});await sourceMemo(page);await selectCycle(page,3,false);await page.locator('#startTransfer').click();assert.match(await page.locator('#rows').innerText(),/規定リプレイ：3周期目/);await page.locator('#apply').click();let saved=await read(page,checkerKey);assert.deepEqual(saved.atLog.sessions[0].events,[{t:'submarine',c:'with_garuku',replayCycle:3}]);assert.deepEqual(saved.hits,[135]);assert.deepEqual(saved.future,{keep:9});await page.locator('#rollback').click();assert.equal(await page.evaluate(k=>localStorage.getItem(k),checkerKey),raw);
 saved=JSON.parse(raw);saved.atLog.sessions[0].events=[{t:'submarine',c:'with_garuku',replayCycle:1}];const mismatch=JSON.stringify(saved);await page.evaluate(({k,v})=>localStorage.setItem(k,v),{k:checkerKey,v:mismatch});await page.goto(base+'mhsunbreak-next-bz.html');await page.locator('#startTransfer').click();assert.equal(await page.locator('#apply').isDisabled(),true);assert.match(await page.locator('#info').innerText(),/先頭が一致しません/);assert.equal(await page.evaluate(k=>localStorage.getItem(k),checkerKey),mismatch);
 assert.deepEqual(errors,[]);await context.close();
});

test('old predictor memo stays without a cycle; pending or invalid cycle cannot be transferred',async()=>{
 const {page,context,errors}=await open('mhsunbreak-next-bz.html');const event={type:'submarine',code:'without_garuku',future:{keep:true}};
 await page.evaluate(({k,event})=>localStorage.setItem(k,JSON.stringify({version:1,history:[event],includeFuku:false,fukutsu:'none',sessionId:'cycle-old-session'})),{k:sourceKey,event});await page.reload();assert.equal(await page.locator('#replayCycleDialog').isVisible(),false);assert.match(await page.locator('#history').innerText(),/周期未記録/);assert.deepEqual((await read(page,sourceKey)).history,[event]);
 await page.locator('#startTransfer').click();await page.locator('#apply').click();assert.deepEqual((await read(page,checkerKey)).atLog.sessions[0].events,[{t:'submarine',c:'without_garuku'}]);
 const sentinel=await page.evaluate(k=>localStorage.getItem(k),checkerKey);
 for(const extra of [{replayCycle:6},{replayCycle:'unknown',pendingReplayCycle:true}]){
  await page.evaluate(extra=>localStorage.setItem('mhsunbreak-next-bz-transfer-v1',JSON.stringify({version:1,source:'mhsunbreak-next-bz',id:'bad-cycle',sessionId:'cycle-bad-session',createdAt:Date.now(),events:[{type:'submarine',code:'with_garuku',...extra}]})),extra);
  await page.goto(base+'mhsunbreak-bz-import.html');assert.equal(await page.locator('#apply').isDisabled(),true);assert.equal(await page.evaluate(k=>localStorage.getItem(k),checkerKey),sentinel);
 }
 assert.deepEqual(errors,[]);await context.close();
});

test('both dialogs fit 320/360/390/412 x 530 screens with six 48px targets',async()=>{
 for(const tool of ['mhsunbreak-checker.html','mhsunbreak-next-bz.html'])for(const width of [320,360,390,412]){
  const {page,context,errors}=await open(tool,width,530),checker=tool.includes('checker');if(checker){await page.locator('#nav [data-p="2"]').click();await checkerMemo(page);}else await sourceMemo(page);
  const box=await page.locator('#replayCycleDialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+.5&&box.y>=0&&box.y+box.height<=530);
  for(const b of await page.locator('#replayCycleDialog [data-cycle]').all()){const r=await b.boundingBox();assert.ok(r.width>=48&&r.height>=48);}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(width===360&&process.env.PROOF_DIR)await page.screenshot({path:path.join(process.env.PROOF_DIR,checker?'submarine-cycle-checker.png':'submarine-cycle-predictor.png')});
  await selectCycle(page,3,checker);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await context.close();
 }
});

test('closed-interval cycle correction and inserted-memo cancellation affect only that memo',async()=>{
 const {page,context,errors}=await open('mhsunbreak-checker.html');
 const saved={atLog:{schemaVersion:2,sessions:[{start:{known:true,prior:0},closed:true,events:[{t:'bz',table:'t3',r:'miss'},{t:'submarine',c:'with_garuku',replayCycle:1},{t:'bz',table:'t7',r:'win'}]},{start:{known:true,prior:0},events:[],closed:false}]}};
 await page.evaluate(({k,v})=>localStorage.setItem(k,JSON.stringify(v)),{k:checkerKey,v:saved});await page.reload();await page.locator('#nav [data-p="2"]').click();await selectAllOther(page);await page.locator('.round-other [data-index="1"]').click();await page.locator('[data-action="replayCycleEdit"]').click();await selectCycle(page,3,true);
 let S=await checkerState(page);assert.equal(S.atLog.sessions[0].events[1].replayCycle,3);assert.equal(S.atLog.sessions[1].events.length,0);assert.equal(S.atLog.sessions[0].closed,true);
 await page.locator('[data-action="bzPick"][data-q="t3"]').click();await page.locator('[data-action="bzFailure"]').click();await page.locator('[data-action="lampChoose"][data-c="unknown"]').click();
 await page.locator('.bz-round[data-round="1"] .ev-card').click();await page.locator('[data-action="atInsert"]').click();await checkerMemo(page);await page.locator('[data-action="replayCycleCancel"]').click();S=await checkerState(page);assert.deepEqual(S.atLog.sessions[1].events.map(e=>e.t),['bz','lamp']);assert.equal(S.atLog.sessions[0].events[1].replayCycle,3);
 await page.locator('#undoBtn').click();await selectCycle(page,5,true);S=await checkerState(page);assert.deepEqual(S.atLog.sessions[1].events.map(e=>e.t),['submarine','bz','lamp']);assert.equal(S.atLog.sessions[1].events[0].replayCycle,5);assert.equal(S.atLog.sessions[0].events[1].replayCycle,3);assert.deepEqual(errors,[]);await context.close();
});

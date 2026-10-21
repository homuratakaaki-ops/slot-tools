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

async function checker(width=390){const f=await open(width);await f.page.goto(base+'mhsunbreak-checker.html');await f.page.locator('#nav [data-p="2"]').click();return f;}
const appState=p=>p.evaluate(()=>window.__checkerApp.getState());
async function fail(page,table='t3',color='unknown'){
 await page.locator('[data-action="bzPick"][data-q="'+table+'"]').click();
 await page.locator('[data-action="bzFailure"]').click();
 if(color!==null)await page.locator('[data-action="lampChoose"][data-c="'+color+'"]').click();
}
async function seed(page,events,extra={}){
 await page.evaluate(({key,events,extra})=>localStorage.setItem(key,JSON.stringify({...extra,atLog:{sessions:[{start:{known:true,prior:0},events,closed:false}]}})),{key:checkerKey,events,extra});
 await page.reload();await page.locator('#nav [data-p="2"]').click();
}
test('one horizontal frame per BZ, pending target, multiple cues, filling upper row and colour correction',async()=>{
 const {page,context,errors}=await checker();
 assert.equal(await page.locator('.bz-round').count(),1);assert.equal(await page.locator('#ent-lamp').count(),0);assert.equal(await page.locator('.jump-btn[data-k="lamp"]').count(),0);
 await page.locator('[data-action="bzPick"][data-q="t3"]').click();
 await page.locator('[data-action="bzPickPos"][data-pos="4"]').click();
 await page.locator('[data-action="bzFailure"]').click();await page.locator('[data-action="lampChoose"][data-c="green"]').click();
 await page.locator('[data-action="atEvent"][data-t="serif"][data-c="s3"]').click();
 const target=page.locator('.bz-round[data-round="2"]');
 assert.equal(await page.locator('.bz-round').count(),2);assert.match(await target.innerText(),/待機中/);assert.match(await target.innerText(),/ランプ 緑/);assert.match(await target.innerText(),/重要なクエスト/);
 assert.match(await page.locator('.bz-round[data-round="1"]').innerText(),/結果：4/);
 const before=await appState(page);assert.equal(before.atLog.sessions[0].events.length,3);assert.equal(before.untouched,undefined);
 const candidates=await page.locator('.at-sc.cand').innerText();assert.match(candidates,/C/);assert.doesNotMatch(candidates,/H/);
 await target.locator('.round-lamps [data-action="atOpen"]').click();await page.locator('[data-action="lampEdit"]').click();await page.locator('[data-action="lampChoose"][data-c="unknown"]').click();
 assert.match(await target.innerText(),/ランプ 不明/);assert.equal((await appState(page)).atLog.sessions[0].events.length,3);
 await fail(page,'t3','unknown');assert.equal(await page.locator('.bz-round').count(),3);assert.equal(await target.locator('.round-empty').count(),0);assert.match(await target.innerText(),/重要なクエスト/);
 if(process.env.PROOF_DIR){await page.locator('#main').evaluate(e=>e.scrollTop=0);await page.locator('#evScroll').evaluate(e=>e.scrollLeft=0);await page.screenshot({path:path.join(process.env.PROOF_DIR,'bz-rounds.png')});}
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('compulsory five choices, durable pending failure on reload, explicit unknown, and two-step Undo',async()=>{
 const {page,context,errors}=await checker();await fail(page,'t2',null);
 assert.equal(await page.locator('#lampDialog').isVisible(),true);assert.equal(await page.locator('#lampDialog [data-action="lampChoose"]').count(),5);
 let S=await appState(page);assert.equal(S.atLog.sessions[0].events[0].r,'miss');assert.equal(S.atLog.sessions[0].events[1].pendingChoice,true);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#lampDialog').isVisible(),true);
 await page.reload();assert.equal(await page.locator('#lampDialog').isVisible(),true);
 await page.locator('[data-action="lampChoose"][data-c="unknown"]').click();assert.equal(await page.locator('#lampDialog').count(),0);
 await page.locator('#nav [data-p="2"]').click();assert.match(await page.locator('.bz-round[data-round="2"]').innerText(),/ランプ 不明/);
 S=await appState(page);assert.equal(S.atLog.sessions[0].events.length,2);assert.equal(S.atLog.sessions[0].events[1].pendingChoice,undefined);
 await page.locator('#undoBtn').click();assert.equal(await page.locator('#lampDialog').isVisible(),true);
 await page.locator('[data-action="cancelFailure"]').click();assert.equal((await appState(page)).atLog.sessions[0].events.length,0);
 await page.locator('#undoBtn').click();assert.equal(await page.locator('#lampDialog').isVisible(),true);
 await page.locator('[data-action="lampChoose"][data-c="blue"]').click();
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('Fuku failure asks for a colour; success closes interval without a pending round or colour prompt',async()=>{
 const {page,context,errors}=await checker();await fail(page,'t3','blue');
 await page.locator('[data-action="fukuFailure"]').click();await page.locator('[data-action="lampChoose"][data-c="green"]').click();
 assert.equal(await page.locator('.bz-round').count(),2);assert.equal(await page.locator('.bz-round[data-round="2"] .round-lamps button').count(),2);
 await page.locator('[data-action="bzPick"][data-q="t7"]').click();await page.locator('[data-action="bzQuest"][data-r="win"]').click();
 assert.equal(await page.locator('#lampDialog').count(),0);assert.equal(await page.locator('.bz-round.waiting').count(),0);
 const S=await appState(page);assert.equal(S.atLog.sessions.length,2);assert.equal(S.atLog.sessions[0].closed,true);
 const lamp=page.locator('.bz-round[data-round="2"] .round-lamps [data-index="3"]');await lamp.click();await page.locator('[data-action="lampEdit"]').click();await page.locator('[data-action="lampChoose"][data-c="unknown"]').click();
 assert.equal((await appState(page)).atLog.sessions[0].events[3].c,'unknown');
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('legacy ambiguous lamps remain separate; editing retains legacy timing and unrelated fields',async()=>{
 const {page,context,errors}=await checker();
 const events=[{t:'bz',table:'t3',r:'miss',pos:4},{t:'lamp',c:'green',future:{keep:5}},{t:'serif',c:'s3'},{t:'fuku',r:'miss'}];
 await seed(page,events,{untouched:{keep:true}});
 await page.locator('[data-action="fukuMode"]').click();
 assert.equal(await page.locator('.bz-round[data-round="2"] .round-lamps button').count(),0);assert.equal(await page.locator('.bz-round[data-round="2"] .round-serifs button').count(),0);
 const other=page.locator('.round-other');await other.locator('summary').click();assert.match(await other.innerText(),/旧記録・対象未確認/);assert.match(await other.innerText(),/福引を挟んだため対象未確認/);
 await other.locator('[data-index="1"]').click();await page.locator('[data-action="lampEdit"]').click();assert.match(await page.locator('#lampDialog').innerText(),/推測には使いません/);
 await page.locator('[data-action="lampChoose"][data-c="red"]').click();const S=await appState(page);
 assert.equal(S.atLog.sessions[0].events[1].timing,undefined);assert.deepEqual(S.atLog.sessions[0].events[1].future,{keep:5});assert.deepEqual(S.untouched,{keep:true});
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('insertion and source deletion keep original indices, linked colour, and Undo intact',async()=>{
 const {page,context,errors}=await checker();await seed(page,[{t:'bz',table:'t3',r:'miss'},{t:'serif',c:'s1'},{t:'bz',table:'t3',r:'miss',pos:2}]);
 await page.locator('.bz-round[data-round="2"] .ev-card').click();await page.locator('[data-action="atInsert"]').click();
 await fail(page,'t2','yellow');let S=await appState(page);assert.deepEqual(S.atLog.sessions[0].events.map(e=>e.t),['bz','serif','bz','lamp','bz']);
 assert.match(await page.locator('.bz-round[data-round="3"]').innerText(),/ランプ 黄/);assert.match(await page.locator('.bz-round[data-round="3"]').innerText(),/結果：2/);
 await page.locator('.bz-round[data-round="2"] .ev-card').click();await page.locator('[data-action="atDel"]').click();S=await appState(page);assert.deepEqual(S.atLog.sessions[0].events.map(e=>e.t),['bz','serif','bz']);assert.equal(S.atLog.sessions[0].events[2].pos,2);
 await page.locator('#undoBtn').click();S=await appState(page);assert.deepEqual(S.atLog.sessions[0].events.map(e=>e.t),['bz','serif','bz','lamp','bz']);
 await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
});
test('real 320/360/390/412px layouts, modal focus loop, no page overflow, five 48px choices',async()=>{
 for(const width of [320,360,390,412]){
  const {page,context,errors}=await checker(width);await page.setViewportSize({width,height:530});await fail(page,'t3',null);
  const box=await page.locator('#lampDialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+.5&&box.y>=0&&box.y+box.height<=530);
  for(const b of await page.locator('#lampDialog [data-action="lampChoose"]').all()){const r=await b.boundingBox();assert.ok(r.height>=48&&r.width>=44);}
  await page.locator('#lampDialog button').last().focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#lampDialog button').first().evaluate(e=>e===document.activeElement),true);
  if(width===390&&process.env.PROOF_DIR)await page.screenshot({path:path.join(process.env.PROOF_DIR,'bz-lamp-dialog.png')});
  await page.locator('[data-action="lampChoose"][data-c="unknown"]').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await assertIsolation(page);assert.deepEqual(errors,[]);await context.close();
 }
});

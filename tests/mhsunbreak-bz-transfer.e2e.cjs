'use strict';
// Real Chromium E2E for the draft PR. All pages run on a temporary localhost origin.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const ROOT=path.resolve(__dirname,'..');
const MIMES={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};
let server,browser,base;
const checkerKey='mhsunbreak-checker-v1';
const sourceKey='mhsunbreak-next-bz-recording-v1';
const backupKey='mhsunbreak-checker-v1-bztransfer-backup';
before(async()=>{
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(ROOT,'.'+pathname);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'content-type':MIMES[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 base='http://127.0.0.1:'+server.address().port+'/';
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r))});
async function pageFor(width=390){
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
 await context.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(base).origin)return route.continue();
  return route.abort(); // No analytics, advertisements, or live network calls.
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e.message||e)));
 await page.goto(base+'mhsunbreak-next-bz.html');
 return {page,context,errors};
}
async function seed(page,checker){
 await page.evaluate(({key,raw,sourceKey,backupKey})=>{
  localStorage.clear();
  if(raw!==null)localStorage.setItem(key,raw);
  localStorage.removeItem(sourceKey);
  localStorage.removeItem(backupKey);
 },{key:checkerKey,raw:checker,sourceKey,backupKey});
 await page.reload();
}
async function current(page){return page.evaluate(k=>localStorage.getItem(k),checkerKey)}
async function table(page,n=3){await page.locator('#tableButtons button[data-table="'+n+'"]').click()}
async function transfer(page){
 await page.locator('#startTransfer').click();
 await page.waitForURL('**/mhsunbreak-bz-import.html');
}
async function outcome(page,index,result='miss'){
 await page.locator('select[data-result="'+index+'"]').selectOption(result);
}
function initialState(events=[]){return {hits:[135,213],counts:{at:2},bzBase:{},atLog:{schemaVersion:2,sessions:[{start:{known:true,prior:0},events,closed:false}]}}}
test('real links, stage-only, fuku selection, saved checker, reload, rollback',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  const original=JSON.stringify(initialState());
  await seed(page,original);
  await table(page);
  await page.locator('.signal-tab[data-tab="submarine"]').click();
  await page.locator('button[data-signal="submarine"][data-code="with_garuku"]').click();
  await page.locator('#addFuku').click();
  const stage=await page.evaluate(({s,c})=>({
   draft:JSON.parse(localStorage.getItem(s)),checker:localStorage.getItem(c)
  }),{s:sourceKey,c:checkerKey});
  assert.equal(stage.draft.history.length,3);
  assert.equal(stage.checker,original,'checker should not change on source page');
  await transfer(page);
  assert.equal(await page.locator('#apply').isDisabled(),true,'fuku must have manual result');
  assert.equal(await current(page),original,'preview must not write');
  await outcome(page,2,'miss');
  assert.equal(await page.locator('#apply').isEnabled(),true);
  await page.locator('#apply').click();
  assert.equal(await page.locator('#after').isVisible(),true);
  const changed=JSON.parse(await current(page));
  assert.equal(changed.hits.join(','),'135,213');
  assert.deepEqual(changed.atLog.sessions[0].events,[
   {t:'bz',table:'t3',r:'miss'},
   {t:'submarine',c:'with_garuku'},
   {t:'fuku',r:'miss'}
  ]);
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),backupKey)!==null,true);
  await page.locator('#after a[href="mhsunbreak-checker.html"]').click();
  await page.waitForURL('**/mhsunbreak-checker.html');
  await page.reload();
  assert.equal((await current(page)),JSON.stringify(changed),'reload must preserve imported bytes');
  await page.goto(base+'mhsunbreak-bz-import.html');
  assert.equal(await page.locator('#rollback').isVisible(),true);
  await page.locator('#rollback').click();
  assert.equal(await current(page),original,'rollback must restore exact original');
  assert.deepEqual(errors,[],'uncaught browser JS errors');
 }finally{await context.close()}
});
test('conflicting existing AT history blocks transfer and preserves bytes',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  const raw=JSON.stringify(initialState([{t:'bz',table:'t2',r:'miss'}]));
  await seed(page,raw);await table(page,3);await transfer(page);
  await outcome(page,0);
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.match(await page.locator('#info').innerText(),/一致しません/);
  assert.equal(await current(page),raw);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('second transfer with new ID cannot duplicate the same history',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);await table(page);await transfer(page);
  await outcome(page,0);
  await page.locator('#apply').click();
  assert.equal(JSON.parse(await current(page)).atLog.sessions[0].events.length,1);
  await page.goto(base+'mhsunbreak-next-bz.html');
  await transfer(page);
  await outcome(page,0);
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.match(await page.locator('#info').innerText(),/すべて記録済み/);
  assert.equal(JSON.parse(await current(page)).atLog.sessions[0].events.length,1);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('legacy cumulative counter records fail closed without data mutation',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  const raw=JSON.stringify({bzT1:{t3:8},atLog:{schemaVersion:1,sessions:[{start:{known:true,prior:0},events:[],closed:false}]}});
  await seed(page,raw);await table(page);await transfer(page);
  await outcome(page,0);
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.match(await page.locator('#info').innerText(),/旧形式のBZ累計/);
  assert.equal(await current(page),raw);assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('Fuku success closes AT interval; no extra event allowed afterward',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);await table(page);await page.locator('#addFuku').click();
  await transfer(page);await outcome(page,1,'win');
  await page.locator('#apply').click();
  const logs=JSON.parse(await current(page)).atLog.sessions;
  assert.equal(logs.length,2);assert.equal(logs[0].closed,true);
  assert.equal(logs[1].closed,false);assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('mobile layouts and draft history persist at 320, 360, 390, 412 pixels',async()=>{
 for(const width of [320,360,390,412]){
  const {page,context,errors}=await pageFor(width);
  try{
   await seed(page,null);
   await table(page);await page.reload();
   assert.equal(await page.locator('#history li[data-type="bz"]').count(),1);
   const bounds=await page.evaluate(()=>({
    client:document.documentElement.clientWidth,
    scroll:document.documentElement.scrollWidth,
    button:(()=>{const b=document.getElementById('startTransfer').getBoundingClientRect();return {left:b.left,right:b.right}})()
   }));
   assert.ok(bounds.scroll<=bounds.client+2,'horizontal overflow '+width+': '+JSON.stringify(bounds));
   assert.ok(bounds.button.left>=-1&&bounds.button.right<=width+1,'offscreen transfer button '+width);
   assert.deepEqual(errors,[],'browser exceptions at '+width);
  }finally{await context.close()}
 }
});

test('BZ success is selectable, saved as win, and closes the AT interval',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);await table(page,3);await transfer(page);
  assert.equal(await page.locator('#apply').isDisabled(),true,'BZ result is required');
  await outcome(page,0,'win');
  assert.equal(await page.locator('#apply').isEnabled(),true);
  await page.locator('#apply').click();
  const state=JSON.parse(await current(page));
  assert.equal(state.atLog.sessions.length,2);
  assert.deepEqual(state.atLog.sessions[0].events,[{t:'bz',table:'t3',r:'win'}]);
  assert.equal(state.atLog.sessions[0].closed,true);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('BZ success followed by another event is rejected; manual-entry link opens checker',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);await table(page,3);
  await page.locator('.signal-tab[data-tab="eye"]').click();
  await page.locator('button[data-signal="eye"][data-code="jay"]').click();
  await transfer(page);await outcome(page,0,'win');
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.match(await page.locator('#info').innerText(),/成功後に記録/);
  assert.equal(await current(page),null);
  const fallback=page.locator('#manualFallback a[href="mhsunbreak-checker.html"]');
  assert.equal(await fallback.isVisible(),true);
  await fallback.click();await page.waitForURL('**/mhsunbreak-checker.html');
  assert.equal(await current(page),null);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});

test('only last BZ/Fuku allows result choice; earlier BZ/Fuku become automatic misses',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);
  await table(page,3);
  await page.locator('#addFuku').click();
  await table(page,4);
  await transfer(page);
  const selects=page.locator('select[data-result]');
  assert.equal(await selects.count(),1);
  assert.equal(await selects.first().getAttribute('data-result'),'2');
  assert.equal(await page.locator('#rows span').filter({hasText:'失敗（自動）'}).count(),2);
  assert.equal(await page.locator('#apply').isDisabled(),true);
  await outcome(page,2,'win');await page.locator('#apply').click();
  const sessions=JSON.parse(await current(page)).atLog.sessions;
  assert.equal(sessions.length,2);
  assert.deepEqual(sessions[0].events,[
   {t:'bz',table:'t3',r:'miss'},
   {t:'fuku',r:'miss'},
   {t:'bz',table:'t4',r:'win'}
  ]);
  assert.equal(sessions[0].closed,true);
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('result selector targets the last BZ even if there are no BZ/Fuku after it',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);await table(page,3);
  await page.locator('.signal-tab[data-tab="eye"]').click();
  await page.locator('button[data-signal="eye"][data-code="jay"]').click();
  await table(page,4);await transfer(page);
  assert.equal(await page.locator('select[data-result]').count(),1);
  assert.equal(await page.locator('select[data-result]').first().getAttribute('data-result'),'2');
  assert.equal(await page.locator('#rows span').filter({hasText:'失敗（自動）'}).count(),1);
  await outcome(page,2,'miss');await page.locator('#apply').click();
  assert.equal(JSON.parse(await current(page)).atLog.sessions[0].events[0].r,'miss');
  assert.deepEqual(errors,[]);
 }finally{await context.close()}
});

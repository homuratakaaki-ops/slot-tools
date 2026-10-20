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
const checkerKey='mhsunbreak-bz-preview-20261020-checker-v1';
const sourceKey='mhsunbreak-bz-preview-20261020-recording-v1';
const backupKey='mhsunbreak-bz-preview-20261020-checker-v1-bztransfer-backup';
before(async()=>{
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(ROOT,'.'+pathname);
  if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return}
  res.writeHead(200,{'content-type':MIMES[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 base='http://127.0.0.1:'+server.address().port+'/preview/mhsunbreak-bz-20261020/';
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
  await page.locator('select[data-fuku="2"]').selectOption('miss');
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
  await page.locator('#apply').click();
  assert.equal(JSON.parse(await current(page)).atLog.sessions[0].events.length,1);
  await page.goto(base+'mhsunbreak-next-bz.html');
  await transfer(page);
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
  assert.equal(await page.locator('#apply').isDisabled(),true);
  assert.match(await page.locator('#info').innerText(),/旧形式のBZ累計/);
  assert.equal(await current(page),raw);assert.deepEqual(errors,[]);
 }finally{await context.close()}
});
test('Fuku success closes AT interval; no extra event allowed afterward',async()=>{
 const {page,context,errors}=await pageFor();
 try{
  await seed(page,null);await table(page);await page.locator('#addFuku').click();
  await transfer(page);await page.locator('select[data-fuku="1"]').selectOption('win');
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

test('production checker storage is untouched after preview transfer',async()=>{const {page,context,errors}=await pageFor();try{const sentinel='{"real":42}';await seed(page,null);await page.evaluate(s=>localStorage.setItem('mhsunbreak-checker-v1',s),sentinel);await table(page,3);await transfer(page);await page.locator('#apply').click();assert.equal(await page.evaluate(()=>localStorage.getItem('mhsunbreak-checker-v1')),sentinel);assert.equal(JSON.parse(await current(page)).atLog.sessions[0].events.length,1);assert.deepEqual(errors,[])}finally{await context.close()}});

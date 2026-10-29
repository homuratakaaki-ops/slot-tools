'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),fixture=require('./rec-idb-sessions.fixture.cjs');
const ROOT=path.resolve(__dirname,'..'),KEY='slot-tools-rec-test',DB=KEY;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'rec-idb-sessions-'));
const results=new Map(),examples=new Map(),errors=[];
let browser,server,origin;
const data=fixture(),raw=JSON.stringify(data);
function result(n,detail){results.set(n,detail)}
function example(n,detail){examples.set(n,detail)}
async function context(){
  const c=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});
  await c.addInitScript(()=>{
    window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    window.__errors=[];addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
    window.__writes=[];const set=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){const r=set.call(this,k,v);if(k==='slot-tools-rec-test')window.__writes.push({length:v.length,value:JSON.parse(v)});return r};
  });
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  return c;
}
async function seed(c,value=data){const p=await c.newPage();await p.goto(origin+'/empty');await p.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[KEY,value]);return p}
async function ready(p,url='/tools/rec-test/'){await p.goto(origin+url);await p.waitForFunction(()=>!document.body.inert&&document.querySelector('#scSetup:not(.hide),#scMain:not(.hide)'));}
async function disk(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)}
async function rows(p){return p.evaluate(db=>new Promise((resolve,reject)=>{const r=indexedDB.open(db,1);r.onsuccess=()=>{const d=r.result,t=d.transaction('sessions'),q=t.objectStore('sessions').getAll();t.oncomplete=()=>{d.close();resolve(q.result)};t.onabort=()=>reject(t.error)};r.onerror=()=>reject(r.error)}),DB)}
async function settled(p){await p.waitForFunction(k=>{const d=JSON.parse(localStorage.getItem(k));return d.version===3&&!d.outbox.put.length&&!d.outbox.del.length},KEY)}
async function note(p){await p.locator('#hdMenu').click();await p.getByRole('button',{name:'ノートを開く',exact:true}).click()}
async function download(p,selector){const wait=p.waitForEvent('download');await p.locator(selector).click();const d=await wait;const file=path.join(tmp,Date.now()+'-'+Math.random()+'.json');await d.saveAs(file);return JSON.parse(fs.readFileSync(file,'utf8'))}
async function snapshot(p){await note(p);const exp=await download(p,'#nDl');delete exp.exportedAt;
  const displays=[await p.locator('#hdTitle').innerText(),await p.locator('#nSum').innerText()];
  for(const machine of ['合成機種0','合成機種1','合成機種2']){await p.locator('#nSum').getByRole('button',{name:machine,exact:true}).click();displays.push(await p.locator('#nSum').innerText());await p.locator('#nSum .mrow').first().click();displays.push(await p.locator('#nSum').innerText());await p.locator('#nSum .mrow.on').click()}
  await p.locator('#nSum').getByRole('button',{name:'全部',exact:true}).click();return {exp,displays};
}
async function start(p){if(await p.locator('#stStart').isVisible()===false){await p.locator('#hdMenu').click();await p.getByRole('button',{name:'新しく打ち始める',exact:true}).click()}
  await p.locator('#stMachine').fill('合成追加台');await p.locator('#stStart').click();await p.locator('#bUtil').waitFor({state:'visible'});
}
async function finish(p){await p.locator('#bUtil').click();await p.getByRole('button',{name:'やめる（終了して記録する）',exact:true}).click();await p.locator('#sheet input').first().fill('100');await p.getByRole('button',{name:'終了する',exact:true}).click()}
async function nisshi(c){const p=await c.newPage();await p.goto(origin+'/tools/nisshi-test/');await p.locator('[data-page="settings"]').click();for(const source of ['ledger','rec-kanokari','mylog','yutime'])await p.locator('input[name=source][value="'+source+'"]').uncheck();await p.locator('#browser-import').click();await p.locator('#preview[open]').waitFor();const preview=await p.locator('#preview-body').innerText();await p.locator('#import-confirm').click();await p.waitForFunction(()=>!document.getElementById('preview').open);await p.locator('#export').waitFor();const exported=await download(p,'#export');return {preview,plays:exported.plays.map(({importedAt,updatedAt,...play})=>play)};}
async function run(){
  const original=fs.readFileSync(path.join(ROOT,'tools/rec/index.html'),'utf8');
  const validators=original.slice(original.indexOf('const numOrNull='),original.indexOf('// 取り込み用：店舗'));
  assert(vm.runInNewContext(validators+';sessions.every(validSession)',{sessions:data.sessions}));
  for(const file of ['js/rec-store.js','tools/rec-test/index.html','tools/nisshi-test/index.html']){
    const s=fs.readFileSync(path.join(ROOT,file),'utf8');assert(!s.includes('(?<=')&&!s.includes('(?<!'));
    assert(!s.includes('\r'));if(file.endsWith('.html')){assert(s.includes('rec-store.js?v='));assert(/name="robots" content="noindex/.test(s));assert(!/googletagmanager|adsbygoogle|googlesyndication/.test(s));assert.equal((s.match(/テスト版/g)||[]).length,1);
      let i=0;for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){const f=path.join(tmp,path.basename(path.dirname(file))+'-'+i+++'.js');fs.writeFileSync(f,m[1]);execFileSync(process.execPath,['--check',f])}
    }else execFileSync(process.execPath,['--check',path.join(ROOT,file)]);
  }
  result(10,'3 files; lookbehind=0; versioned scripts=2; syntax PASS; tags=0');
  server=http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]);if(url==='/empty'){res.end('<!doctype html><title>test</title>');return}if(url==='/baseline-rec/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(original.replace('const KEY="slot-tools-rec";','const KEY="slot-tools-rec-test";'));return}if(url.endsWith('/'))url+='index.html';const file=path.resolve(ROOT,'.'+url);if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.end(fs.readFileSync(file))});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));origin='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({headless:true});
  // Baseline is the production page with KEY alone substituted by the HTTP server.
  const baseC=await context(),base=await seed(baseC);await ready(base,'/baseline-rec/');const before=await snapshot(base);
  const beforeDiary=await nisshi(baseC);assert.equal(beforeDiary.plays.length,200);
  const c=await context(),p=await seed(c);await ready(p);await settled(p);const after=await snapshot(p);
  assert.deepEqual(after.exp,before.exp);assert.deepEqual(after.displays,before.displays);
  let d=await disk(p);assert.equal((await rows(p)).length,200);assert(!('sessions'in d));
  example(1,`sessions=200; LS ${raw.length} -> ${JSON.stringify(d).length} chars`);
  result(2,`sessions=200 entries=6 stores=2; exported JSON identical (${JSON.stringify(after.exp).length} chars)`);
  result(3,`note=200; total/machine/month rendered snapshots=${after.displays.length} identical`);
  const afterDiary=await nisshi(c);assert.deepEqual(afterDiary,beforeDiary);example(7,`rec plays=200; identical content=${JSON.stringify(afterDiary.plays).length} chars`);result(9,examples.get(7));
  await start(p);await settled(p);await p.evaluate(()=>window.__writes=[]);await p.locator('[data-step="1"]').click();
  const writes=await p.evaluate(()=>window.__writes);assert(writes.length);assert(writes.every(w=>!('sessions'in w.value)&&w.value.outbox.put.length===0));
  result(5,`operation writes=${writes.length}; LS=${writes[0].length} chars; sessions=0; outbox.put=0`);
  const geometry=await p.evaluate(()=>({height:innerHeight,scroll:document.documentElement.scrollHeight,buttons:['bHint','bUtil','bUndo'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect();return {id,top:r.top,bottom:r.bottom,height:r.height,display:getComputedStyle(e).display}})}));
  assert(geometry.scroll<=844);assert(geometry.buttons.every(b=>b.bottom<=844&&b.height>0&&b.display!=='none'));await p.screenshot({path:path.join(tmp,'rec-test-390x844.png')});console.log('UI '+JSON.stringify(geometry));
  await p.evaluate(()=>{window.__put=RecStore.putMany;RecStore.putMany=()=>new Promise(()=>{})});await finish(p);d=await disk(p);assert.equal(d.outbox.put.length,1);const added=d.outbox.put[0].id;assert.match(await p.locator('#hdTitle').innerText(),/201/);example(2,`note=201; outbox.put=1 (${JSON.stringify(d.outbox.put).length} chars)`);
  await p.close();const resumed=await c.newPage();await ready(resumed);await settled(resumed);assert((await rows(resumed)).some(s=>s.id===added));await note(resumed);assert.match(await resumed.locator('#hdTitle').innerText(),/201/);example(3,'after close/reload sessions=201; outbox.put=0');
  // Expand the first rendered session, then delete through its real button.
  await resumed.locator('#nList details.sess summary').first().click();
  await resumed.evaluate(()=>{RecStore.deleteMany=()=>new Promise(()=>{})});await resumed.getByRole('button',{name:'この記録を削除',exact:true}).first().click();
  d=await disk(resumed);assert.equal(d.outbox.del.length,1);assert.equal(await resumed.locator('#nList details.sess').count(),200);await resumed.reload();await resumed.waitForFunction(()=>!document.body.inert);await settled(resumed);assert.equal((await rows(resumed)).length,200);example(4,'note 201 -> 200 immediately; outbox.del 1 -> 0; IDB=200');
  // Stop after the migration transaction completes, before its verification read returns.
  const cutC=await context(),cut=await seed(cutC);await cut.route('**/js/rec-store.js?*',async route=>{const s=fs.readFileSync(path.join(ROOT,'js/rec-store.js'),'utf8');await route.fulfill({contentType:'text/javascript',body:s+'\n{const get=RecStore.getAll;let n=0;RecStore.getAll=async(...a)=>{const rows=await get(...a);if(++n===2){window.__cut=true;await new Promise(()=>{})}return rows}}'})});
  await cut.goto(origin+'/tools/rec-test/');await cut.waitForFunction(()=>window.__cut);assert.equal((await disk(cut)).version,2);assert.equal((await rows(cut)).length,200);await cut.close();const recovered=await cutC.newPage();await ready(recovered);await settled(recovered);assert.deepEqual((await snapshot(recovered)).exp,before.exp);result(4,'interrupted: LS v2 / IDB=200; restart=200; export identical');
  // Fill the actual Chromium quota to within 10,000 characters before migration.
  const fullC=await context(),full=await seed(fullC);const capacity=await full.evaluate(()=>{let lo=0,hi=6000000;while(lo+1<hi){const m=Math.floor((lo+hi)/2);try{localStorage.setItem('filler','x'.repeat(m));lo=m}catch{hi=m}}localStorage.setItem('filler','x'.repeat(lo-10000));return {filled:lo-10000,remaining:10000}});
  await ready(full);await settled(full);for(let i=0;i<3;i++){await start(full);await finish(full);await settled(full)}assert.equal((await rows(full)).length,203);assert(await full.locator('#storeWarn').isHidden());example(6,`remaining=${capacity.remaining} chars; filler=${capacity.filled}; sessions=203; warnings=0`);result(6,examples.get(6));
  const failC=await context();await failC.addInitScript(()=>{indexedDB.open=()=>{throw new Error('simulated unavailable')}});const fallback=await seed(failC);await ready(fallback);assert.equal(JSON.stringify(await disk(fallback)),raw);await start(fallback);await finish(fallback);d=await disk(fallback);assert.equal(d.version,2);assert.equal(d.sessions.length,201);example(5,`open failed; version=2; sessions=201; LS=${JSON.stringify(d).length} chars`);result(7,examples.get(5));
  const tabC=await context(),tabA=await seed(tabC);await ready(tabA);await settled(tabA);const tabB=await tabC.newPage();await ready(tabB);await settled(tabB);await start(tabA);await tabB.locator('#staleWarn').waitFor({state:'visible'});assert(await tabB.locator('#stStart').isDisabled());
  const old={...data,gen:(await disk(tabA)).gen+1,sessions:data.sessions.slice(0,199).map(s=>({...s}))};old.sessions[0].endNote='旧版更新';await tabA.evaluate(([k,d])=>localStorage.setItem(k,JSON.stringify(d)),[KEY,old]);await tabB.close();await tabA.reload();await tabA.waitForFunction(()=>!document.body.inert);await settled(tabA);const migrated=await rows(tabA);assert.equal(migrated.length,200);assert.equal(migrated.find(s=>s.id===old.sessions[0].id).endNote,'旧版更新');result(8,'stale tab disabled=1; v2=199 + IDB-only=1 -> 200; v2 conflict wins');
  // v3 cannot fall back to an empty local sessions list.
  const badC=await context(),bad=await seed(badC);await ready(bad);await settled(bad);const preserved=JSON.stringify(await disk(bad));await badC.addInitScript(()=>{indexedDB.open=()=>{throw Error('offline')}});await bad.reload();await bad.locator('#brokenWarn').waitFor({state:'visible'});assert.equal(JSON.stringify(await disk(bad)),preserved);assert(await bad.locator('#brokenReset').isDisabled());
  // Corrupt IDB rows are retained and exported with the raw LS string.
  const corruptC=await context(),corrupt=await seed(corruptC);await ready(corrupt);await settled(corrupt);await corrupt.evaluate(()=>RecStore.putMany('slot-tools-rec-test',[{id:'broken',machine:'x',events:null}]));const rawBefore=await corrupt.evaluate(k=>localStorage.getItem(k),KEY);await corrupt.reload();await corrupt.locator('#brokenWarn').waitFor({state:'visible'});const bundle=await download(corrupt,'#brokenExport');assert.equal(bundle.localStorage,rawBefore);assert.equal(bundle.indexedDB.sessions.length,201);assert.equal(await corrupt.evaluate(k=>localStorage.getItem(k),KEY),rawBefore);console.log('EXTRA PASS v3 unavailable: no writes; corrupt bundle: raw LS + IDB=201; reset disabled');
  // A failed transaction leaves its complete journal, and the next UI save retries it.
  const retryC=await context(),retry=await seed(retryC);await ready(retry);await settled(retry);await start(retry);
  await retry.evaluate(()=>{window.__put=RecStore.putMany;RecStore.putMany=()=>Promise.reject(Error('write failed'))});await finish(retry);assert.equal((await disk(retry)).outbox.put.length,1);
  await retry.evaluate(()=>{RecStore.putMany=window.__put});await start(retry);await settled(retry);assert.equal((await rows(retry)).length,201);
  // Delete a just-finished record while its put is in flight; complete must not resurrect it.
  await retry.evaluate(()=>{const put=RecStore.putMany;RecStore.putMany=(...args)=>new Promise(resolve=>{window.__release=()=>resolve(put(...args))})});await finish(retry);
  await retry.locator('#nList details.sess summary').first().click();await retry.getByRole('button',{name:'この記録を削除',exact:true}).first().click();assert.equal((await disk(retry)).outbox.del.length,1);
  await retry.evaluate(()=>window.__release());await settled(retry);assert.equal((await rows(retry)).length,201);
  console.log('EXTRA PASS failed put retained/retried; delete during put -> IDB=201, outbox=0');
  // Migration verification failure must not rewrite the v2 raw string, even at boot.
  const mismatchC=await context(),mismatch=await seed(mismatchC);await mismatch.route('**/js/rec-store.js?*',async route=>{const s=fs.readFileSync(path.join(ROOT,'js/rec-store.js'),'utf8');await route.fulfill({contentType:'text/javascript',body:s+'\n{const get=RecStore.getAll;let n=0;RecStore.getAll=async(...a)=>{const rows=await get(...a);return ++n===2?rows.slice(1):rows}}'})});await ready(mismatch);assert.equal(await mismatch.evaluate(k=>localStorage.getItem(k),KEY),raw);
  // Public API: complete/abort, custom DB name and the bounded open wait.
  const api=await recovered.evaluate(async()=>{let aborted=false;try{await RecStore.putMany('synthetic-api',[{id:'a'},{bad:true}])}catch{aborted=true}const count=(await RecStore.getAll('synthetic-api')).length;const open=indexedDB.open;indexedDB.open=()=>({});const at=performance.now();let timeout=false;try{await RecStore.open('synthetic-timeout')}catch{timeout=true}indexedDB.open=open;return {aborted,count,timeout,ms:Math.round(performance.now()-at)}});
  assert(api.aborted&&api.count===0&&api.timeout&&api.ms>=2900&&api.ms<4000);console.log('EXTRA PASS migration mismatch: raw unchanged; API '+JSON.stringify(api));
  // Known specification gap: many optional legacy fields can make the boot
  // normalization journal larger than the space released by migration.
  const sparse=fixture();for(const s of sparse.sessions){s.rare={};for(const k of ['modeHints','_steps','mode','parallel','revive','melonLeft','melonApprox','rewardHint','modeHint','ticket','judgeWins','returnHit','pendingReward','modeEra','melonPhase','zenchou'])delete s[k]}
  const sparseC=await context(),sparsePage=await seed(sparseC,sparse);
  await sparsePage.evaluate(()=>{let lo=0,hi=6000000;while(lo+1<hi){const m=Math.floor((lo+hi)/2);try{localStorage.setItem('filler','x'.repeat(m));lo=m}catch{hi=m}}localStorage.setItem('filler','x'.repeat(lo-10000))});
  await ready(sparsePage);await sparsePage.locator('#storeWarn').waitFor({state:'visible'});const sparseRows=await rows(sparsePage);assert.equal(sparseRows.length,200);assert.deepEqual([...sparseRows].sort((a,b)=>a.id.localeCompare(b.id)),[...sparse.sessions].sort((a,b)=>a.id.localeCompare(b.id)));
  console.log('LIMITATION PASS sparse legacy + 10000 chars free: boot normalization warns; original IDB=200 unchanged');
  for(const ctx of browser.contexts())for(const page of ctx.pages())assert.deepEqual(await page.evaluate(()=>window.__errors),[]);
  assert.deepEqual(errors,[]);assert.equal(examples.size,7);result(1,'examples 1-7 PASS (200 synthetic sessions; 30-150 events/session)');
}
const watchdog=setTimeout(()=>{console.error('FAIL timeout');process.exit(1)},180000);
run().then(()=>{for(let i=1;i<=7;i++)console.log(`例${i} PASS ${examples.get(i)}`);for(let i=1;i<=10;i++)console.log(`§8-${i} PASS ${results.get(i)}`);console.log('Artifacts: '+tmp)}).catch(e=>{console.error(e);for(let i=1;i<=7;i++)console.log(`例${i} ${examples.has(i)?'PASS':'FAIL/NOT COMPLETED'} ${examples.get(i)||''}`);for(let i=1;i<=10;i++)console.log(`§8-${i} ${results.has(i)?'PASS':'FAIL/NOT COMPLETED'} ${results.get(i)||''}`);process.exitCode=1}).finally(async()=>{clearTimeout(watchdog);if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r))};});

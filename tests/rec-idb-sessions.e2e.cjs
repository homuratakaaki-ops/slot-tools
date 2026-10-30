'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {chromium}=require('playwright'),fixture=require('./rec-idb-sessions.fixture.cjs');
const ROOT=path.resolve(__dirname,'..'),KEY='slot-tools-rec',DB=KEY;
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
    Storage.prototype.setItem=function(k,v){const r=set.call(this,k,v);if(k==='slot-tools-rec')window.__writes.push({length:v.length,value:JSON.parse(v)});return r};
  });
  c.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  return c;
}
async function seed(c,value=data){const p=await c.newPage();await p.goto(origin+'/empty');await p.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[KEY,value]);return p}
async function ready(p,url='/tools/rec/'){await p.goto(origin+url);await p.waitForFunction(()=>!document.body.inert&&document.querySelector('#scSetup:not(.hide),#scMain:not(.hide)'));}
async function disk(p){return p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY)}
async function rows(p){return p.evaluate(db=>new Promise((resolve,reject)=>{const r=indexedDB.open(db);r.onsuccess=()=>{const d=r.result,t=d.transaction('sessions'),q=t.objectStore('sessions').getAll();t.oncomplete=()=>{d.close();resolve(q.result)};t.onabort=()=>reject(t.error)};r.onerror=()=>reject(r.error)}),DB)}
async function settled(p){await p.waitForFunction(k=>{const d=JSON.parse(localStorage.getItem(k));return d.version===3&&!d.outbox.put.length&&!d.outbox.del.length},KEY)}
async function idbPut(p,list){await p.evaluate(([db,list])=>new Promise((res,rej)=>{const r=indexedDB.open(db);r.onsuccess=()=>{const d=r.result,t=d.transaction('sessions','readwrite');list.forEach(x=>t.objectStore('sessions').put(x));t.oncomplete=()=>{d.close();res()};t.onabort=()=>rej(t.error)};r.onerror=()=>rej(r.error)}),[DB,list])}
async function metaGen(p){return p.evaluate(db=>new Promise((res,rej)=>{const r=indexedDB.open(db);r.onsuccess=()=>{const d=r.result,t=d.transaction('meta'),q=t.objectStore('meta').get('gen');t.oncomplete=()=>{d.close();res(q.result?q.result.gen:null)}};r.onerror=()=>rej(r.error)}),DB)}
async function editEndNote(p,text){await note(p);await p.locator('#nList details.sess summary').first().click();await p.getByRole('button',{name:'打ち始め・終了の情報を直す',exact:true}).first().click();await p.locator('#shBody .lbl:text-is("終わりのメモ") + input').fill(text);await p.getByRole('button',{name:'この内容で直す',exact:true}).click()}
// 次の RecStore.commit を1回だけ保留する。window.__release() で本物の commit を走らせ、結果を __heldResult に残す
const HOLD="{const c=RecStore.commit;let held=false;RecStore.commit=(...a)=>{if(held||!window.__holdNext)return c(...a);held=true;window.__holdNext=false;return new Promise((res,rej)=>{window.__release=()=>c(...a).then(r=>{window.__heldResult='ok';res(r)},e=>{window.__heldResult=e&&e.stale?'stale':'error:'+e;rej(e)})})}}";
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
async function nisshi(c){const p=await c.newPage();await p.goto(origin+'/tools/nisshi/');await p.locator('[data-page="settings"]').click();for(const source of ['ledger','rec-kanokari','mylog','yutime'])await p.locator('input[name=source][value="'+source+'"]').uncheck();await p.locator('#browser-import').click();await p.locator('#preview[open]').waitFor();const preview=await p.locator('#preview-body').innerText();await p.locator('#import-confirm').click();await p.waitForFunction(()=>!document.getElementById('preview').open);await p.locator('#export').waitFor();const exported=await download(p,'#export');return {preview,plays:exported.plays.map(({importedAt,updatedAt,...play})=>play)};}
async function run(){
  // 比較の基準は移行前の本番 rec（テスト版の複製元 9380605 の親）。保存キーは本番と同じ slot-tools-rec。
  const original=execFileSync('git',['show','9380605^:tools/rec/index.html'],{cwd:ROOT,encoding:'utf8',maxBuffer:64<<20});
  const validators=original.slice(original.indexOf('const numOrNull='),original.indexOf('// 取り込み用：店舗'));
  assert(vm.runInNewContext(validators+';sessions.every(validSession)',{sessions:data.sessions}));
  for(const file of ['js/rec-store.js','tools/rec/index.html','tools/nisshi/index.html']){
    const s=fs.readFileSync(path.join(ROOT,file),'utf8');assert(!s.includes('(?<=')&&!s.includes('(?<!'));
    assert(!s.includes('\r'));if(file.endsWith('.html')){assert(s.includes('rec-store.js?v='));assert(/name="robots" content="noindex/.test(s));assert(!/googletagmanager|adsbygoogle|googlesyndication/.test(s));assert(!s.includes('テスト版')&&!s.includes('slot-tools-rec-test')&&!s.includes('nisshi-test')&&!s.includes('保存方式を更新します'));assert(s.includes('rec-store.js?v=20261031'));
      let i=0;for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){const f=path.join(tmp,path.basename(path.dirname(file))+'-'+i+++'.js');fs.writeFileSync(f,m[1]);execFileSync(process.execPath,['--check',f])}
    }else execFileSync(process.execPath,['--check',path.join(ROOT,file)]);
  }
  result(10,'3 files; lookbehind=0; versioned scripts=2; syntax PASS; tags=0');
  server=http.createServer((req,res)=>{let url=decodeURIComponent(req.url.split('?')[0]);if(url==='/empty'){res.end('<!doctype html><title>test</title>');return}if(url==='/baseline-rec/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(original);return}if(url.endsWith('/'))url+='index.html';const file=path.resolve(ROOT,'.'+url);if(!file.startsWith(ROOT+path.sep)||!fs.existsSync(file)){res.statusCode=404;res.end();return}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');res.end(fs.readFileSync(file))});
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
  assert(geometry.scroll<=844);assert(geometry.buttons.every(b=>b.bottom<=844&&b.height>0&&b.display!=='none'));await p.screenshot({path:path.join(tmp,'rec-390x844.png')});console.log('UI '+JSON.stringify(geometry));
  await p.evaluate(()=>{RecStore.commit=()=>new Promise(()=>{})});await finish(p);d=await disk(p);assert.equal(d.outbox.put.length,1);const added=d.outbox.put[0].id;assert.match(await p.locator('#hdTitle').innerText(),/201/);example(2,`note=201; outbox.put=1 (${JSON.stringify(d.outbox.put).length} chars)`);
  await p.close();const resumed=await c.newPage();await ready(resumed);await settled(resumed);assert((await rows(resumed)).some(s=>s.id===added));await note(resumed);assert.match(await resumed.locator('#hdTitle').innerText(),/201/);example(3,'after close/reload sessions=201; outbox.put=0');
  // Expand the first rendered session, then delete through its real button.
  await resumed.locator('#nList details.sess summary').first().click();
  await resumed.evaluate(()=>{RecStore.commit=()=>new Promise(()=>{})});await resumed.getByRole('button',{name:'この記録を削除',exact:true}).first().click();
  d=await disk(resumed);assert.equal(d.outbox.del.length,1);assert.equal(await resumed.locator('#nList details.sess').count(),200);await resumed.reload();await resumed.waitForFunction(()=>!document.body.inert);await settled(resumed);assert.equal((await rows(resumed)).length,200);example(4,'note 201 -> 200 immediately; outbox.del 1 -> 0; IDB=200');
  // Stop after the migration transaction completes, before its verification read returns.
  const cutC=await context(),cut=await seed(cutC);await cut.route('**/js/rec-store.js?*',async route=>{const s=fs.readFileSync(path.join(ROOT,'js/rec-store.js'),'utf8');await route.fulfill({contentType:'text/javascript',body:s+'\n{const get=RecStore.getAll;let n=0;RecStore.getAll=async(...a)=>{const rows=await get(...a);if(++n===2){window.__cut=true;await new Promise(()=>{})}return rows}}'})});
  await cut.goto(origin+'/tools/rec/');await cut.waitForFunction(()=>window.__cut);assert.equal((await disk(cut)).version,2);assert.equal((await rows(cut)).length,200);await cut.close();const recovered=await cutC.newPage();await ready(recovered);await settled(recovered);assert.deepEqual((await snapshot(recovered)).exp,before.exp);result(4,'interrupted: LS v2 / IDB=200; restart=200; export identical');
  // Fill the actual Chromium quota to within 10,000 characters before migration.
  const fullC=await context(),full=await seed(fullC);const capacity=await full.evaluate(()=>{let lo=0,hi=6000000;while(lo+1<hi){const m=Math.floor((lo+hi)/2);try{localStorage.setItem('filler','x'.repeat(m));lo=m}catch{hi=m}}localStorage.setItem('filler','x'.repeat(lo-10000));return {filled:lo-10000,remaining:10000}});
  await ready(full);await settled(full);for(let i=0;i<3;i++){await start(full);await finish(full);await settled(full)}assert.equal((await rows(full)).length,203);assert(await full.locator('#storeWarn').isHidden());example(6,`remaining=${capacity.remaining} chars; filler=${capacity.filled}; sessions=203; warnings=0`);result(6,examples.get(6));
  const failC=await context();await failC.addInitScript(()=>{indexedDB.open=()=>{throw new Error('simulated unavailable')}});const fallback=await seed(failC);await ready(fallback);assert.equal(JSON.stringify(await disk(fallback)),raw);await start(fallback);await finish(fallback);d=await disk(fallback);assert.equal(d.version,2);assert.equal(d.sessions.length,201);example(5,`open failed; version=2; sessions=201; LS=${JSON.stringify(d).length} chars`);result(7,examples.get(5));
  const tabC=await context(),tabA=await seed(tabC);await ready(tabA);await settled(tabA);const tabB=await tabC.newPage();await ready(tabB);await settled(tabB);await start(tabA);await tabB.locator('#staleWarn').waitFor({state:'visible'});assert(await tabB.locator('#stStart').isDisabled());
  const old={...data,gen:(await disk(tabA)).gen+1,sessions:data.sessions.slice(0,199).map(s=>({...s}))};old.sessions[0].endNote='旧版更新';await tabA.evaluate(([k,d])=>localStorage.setItem(k,JSON.stringify(d)),[KEY,old]);await tabB.close();await tabA.reload();await tabA.waitForFunction(()=>!document.body.inert);await settled(tabA);const migrated=await rows(tabA);assert.equal(migrated.length,200);assert.equal(migrated.find(s=>s.id===old.sessions[0].id).endNote,'旧版更新');result(8,'stale tab disabled=1; v2=199 + IDB-only=1 -> 200; v2 conflict wins');
  // v3 cannot fall back to an empty local sessions list.
  const badC=await context(),bad=await seed(badC);await ready(bad);await settled(bad);const preserved=JSON.stringify(await disk(bad));await badC.addInitScript(()=>{indexedDB.open=()=>{throw Error('offline')}});await bad.reload();await bad.locator('#brokenWarn').waitFor({state:'visible'});assert.equal(JSON.stringify(await disk(bad)),preserved);const unavailable=await download(bad,'#brokenExport');assert.equal(unavailable.localStorage,preserved);assert.deepEqual(unavailable.idbSessions,[]);
  // Corrupt IDB rows are retained and exported with the raw LS string.
  const corruptC=await context(),corrupt=await seed(corruptC);await ready(corrupt);await settled(corrupt);await idbPut(corrupt,[{id:'broken',machine:'x',events:null}]);const rawBefore=await corrupt.evaluate(k=>localStorage.getItem(k),KEY);await corrupt.reload();await corrupt.locator('#brokenWarn').waitFor({state:'visible'});const bundle=await download(corrupt,'#brokenExport');assert.equal(bundle.localStorage,rawBefore);assert.equal(bundle.idbSessions.length,201);const brokenKey201=await corrupt.evaluate(k=>localStorage.getItem(k+'-broken'),KEY);assert.equal(brokenKey201,rawBefore);assert(await corrupt.locator('#brokenWarn').isVisible());console.log('EXTRA PASS corrupt IDB 200+1: broken key='+brokenKey201.length+' chars = LS raw '+rawBefore.length+' chars; saving stopped; export idbSessions='+bundle.idbSessions.length);assert.equal(await corrupt.evaluate(k=>localStorage.getItem(k),KEY),rawBefore);console.log('EXTRA PASS v3 unavailable: no writes; corrupt bundle: raw LS + idbSessions=201; v3 unavailable bundle: idbSessions=0');
  // 壊れた IndexedDB 200件で起動しても、退避キーには localStorage の元の文字列だけが入る（シオン 10/29）。
  const all200C=await context(),all200=await seed(all200C);await ready(all200);await settled(all200);
  await idbPut(all200,(await rows(all200)).map(r=>({...r,events:null})));
  const raw200=await all200.evaluate(k=>localStorage.getItem(k),KEY);await all200.reload();await all200.locator('#brokenWarn').waitFor({state:'visible'});
  const brokenKey=await all200.evaluate(k=>localStorage.getItem(k+'-broken'),KEY);
  assert.equal(brokenKey.length,raw200.length);assert.equal(brokenKey,raw200);
  const bundle200=await download(all200,'#brokenExport');assert.equal(bundle200.localStorage,raw200);assert.equal(bundle200.idbSessions.length,200);
  assert.equal(await all200.evaluate(k=>localStorage.getItem(k),KEY),raw200);
  console.log('EXTRA PASS corrupt IDB 200: broken key='+brokenKey.length+' chars = LS raw '+raw200.length+' chars; export bundle idbSessions=200 ('+JSON.stringify(bundle200).length+' chars, memory only)');
  // A failed transaction leaves its complete journal, and the next UI save retries it.
  const retryC=await context(),retry=await seed(retryC);await ready(retry);await settled(retry);await start(retry);
  await retry.evaluate(()=>{window.__commit=RecStore.commit;RecStore.commit=()=>Promise.reject(Error('write failed'))});await finish(retry);assert.equal((await disk(retry)).outbox.put.length,1);
  await retry.evaluate(()=>{RecStore.commit=window.__commit});await start(retry);await settled(retry);assert.equal((await rows(retry)).length,201);
  // Delete a just-finished record while its put is in flight; complete must not resurrect it.
  await retry.evaluate(()=>{const c=RecStore.commit;let first=true;RecStore.commit=(...args)=>{if(!first)return c(...args);first=false;return new Promise(resolve=>{window.__release=()=>resolve(c(...args))})}});await finish(retry);
  await retry.locator('#nList details.sess summary').first().click();await retry.getByRole('button',{name:'この記録を削除',exact:true}).first().click();assert.equal((await disk(retry)).outbox.del.length,1);
  await retry.evaluate(()=>window.__release());await settled(retry);assert.equal((await rows(retry)).length,201);
  console.log('EXTRA PASS failed put retained/retried; delete during put -> IDB=201, outbox=0');
  // Migration verification failure must not rewrite the v2 raw string, even at boot.
  const mismatchC=await context(),mismatch=await seed(mismatchC);await mismatch.route('**/js/rec-store.js?*',async route=>{const s=fs.readFileSync(path.join(ROOT,'js/rec-store.js'),'utf8');await route.fulfill({contentType:'text/javascript',body:s+'\n{const get=RecStore.getAll;let n=0;RecStore.getAll=async(...a)=>{const rows=await get(...a);return ++n===2?rows.slice(1):rows}}'})});await ready(mismatch);assert.equal(await mismatch.evaluate(k=>localStorage.getItem(k),KEY),raw);
  // Public API: complete/abort, custom DB name and the bounded open wait.
  const api=await recovered.evaluate(async()=>{let aborted=false;try{await RecStore.commit('synthetic-api',{put:[{id:'a'},{bad:true}],del:[]},1)}catch{aborted=true}const count=(await RecStore.getAll('synthetic-api')).length;const open=indexedDB.open;indexedDB.open=()=>({});const at=performance.now();let timeout=false;try{await RecStore.open('synthetic-timeout')}catch{timeout=true}indexedDB.open=open;const ms=Math.round(performance.now()-at);
    await new Promise((res,rej)=>{const r=indexedDB.open('synthetic-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('sessions',{keyPath:'id'});r.onsuccess=()=>{const d=r.result,t=d.transaction('sessions','readwrite');t.objectStore('sessions').put({id:'v1a',n:1});t.objectStore('sessions').put({id:'v1b',n:2});t.oncomplete=()=>{d.close();res()}};r.onerror=()=>rej(r.error)});
    const v1rows=(await RecStore.getAll('synthetic-v1')).length;const db=await RecStore.open('synthetic-v1');const v1={version:db.version,stores:[...db.objectStoreNames].sort().join(',')};db.close();
    await RecStore.commit('synthetic-v1',{put:[{id:'v1c'}],del:[]},5);let staleFlag=false;try{await RecStore.commit('synthetic-v1',{put:[{id:'v1d'}],del:['v1a']},4)}catch(e){staleFlag=e.stale===true}const afterStale=(await RecStore.getAll('synthetic-v1')).map(r=>r.id).sort().join(',');
    return {aborted,count,timeout,ms,v1rows,v1,staleFlag,afterStale}});
  assert(api.aborted&&api.count===0&&api.timeout&&api.ms>=2900&&api.ms<4000);assert.equal(api.v1rows,2);assert.deepEqual(api.v1,{version:2,stores:'meta,sessions'});assert(api.staleFlag);assert.equal(api.afterStale,'v1a,v1b,v1c');console.log('EXTRA PASS migration mismatch: raw unchanged; API '+JSON.stringify(api));
  // ネネ検収 高1：古いタブの遅れた書き込みが、新しいタブの確定済みの編集を上書きしない。
  const raceC=await context(),tabOld=await seed(raceC);await ready(tabOld);await settled(tabOld);
  await tabOld.addScriptTag({content:HOLD});await tabOld.evaluate(()=>{window.__holdNext=true});
  await editEndNote(tabOld,'OLD_DELAYED');const target=(await disk(tabOld)).outbox.put[0];assert.equal(target.endNote,'OLD_DELAYED');await tabOld.waitForFunction(()=>typeof window.__release==='function');
  const tabNew=await raceC.newPage();await ready(tabNew);await settled(tabNew);
  await editEndNote(tabNew,'NEW_CONFIRMED');await settled(tabNew);
  assert.equal((await rows(tabNew)).find(s=>s.id===target.id).endNote,'NEW_CONFIRMED');const genB=await metaGen(tabNew);
  await tabOld.evaluate(()=>window.__release());await tabOld.waitForFunction(()=>window.__heldResult);
  assert.equal(await tabOld.evaluate(()=>window.__heldResult),'stale');await tabOld.locator('#staleWarn').waitFor({state:'visible'});
  const dbRace=(await rows(tabNew)).find(s=>s.id===target.id).endNote;assert.equal(dbRace,'NEW_CONFIRMED');assert.equal(await metaGen(tabNew),genB);
  await tabNew.reload();await ready(tabNew);await settled(tabNew);const expRace=(await snapshot(tabNew)).exp;
  assert.equal(expRace.sessions.find(s=>s.id===target.id).endNote,'NEW_CONFIRMED');assert.equal((await rows(tabNew)).length,200);
  console.log('EXTRA PASS stale delayed commit: old tab commit=stale, stopped; DB='+dbRace+', meta.gen='+genB+'; reload/export=NEW_CONFIRMED; sessions=200');
  // 移行の途中で別のタブが新しく書いた場合も、古い方（移行中のタブ）が中止される。
  const migC=await context(),migOld=await seed(migC);
  await migOld.route('**/js/rec-store.js?*',async route=>{const src=fs.readFileSync(path.join(ROOT,'js/rec-store.js'),'utf8');await route.fulfill({contentType:'text/javascript',body:src+'\nwindow.__holdNext=true;'+HOLD})});
  await migOld.goto(origin+'/tools/rec/');await migOld.waitForFunction(()=>typeof window.__release==='function');assert.equal((await disk(migOld)).version,2);
  const migNew=await migC.newPage();await ready(migNew);await settled(migNew);await editEndNote(migNew,'NEW_CONFIRMED');await settled(migNew);
  const migTarget=(await rows(migNew)).find(s=>s.endNote==='NEW_CONFIRMED');const migGen=await metaGen(migNew);const lsAfterNew=await migNew.evaluate(k=>localStorage.getItem(k),KEY);
  await migOld.evaluate(()=>window.__release());await migOld.waitForFunction(()=>window.__heldResult);assert.equal(await migOld.evaluate(()=>window.__heldResult),'stale');
  await migOld.locator('#staleWarn').waitFor({state:'visible'});
  assert.equal((await rows(migNew)).find(s=>s.id===migTarget.id).endNote,'NEW_CONFIRMED');assert.equal(await metaGen(migNew),migGen);assert.equal(await migNew.evaluate(k=>localStorage.getItem(k),KEY),lsAfterNew);
  console.log('EXTRA PASS migration race: migrating tab commit=stale, stopped; DB=NEW_CONFIRMED, meta.gen='+migGen+'; LS unchanged by old tab');
  // localStorage を空の状態で始め直した後／localStorage の gen だけ小さい状態から起動しても、止まらずに保存でき、meta.gen が増える（シオン 10/30）。
  const resetC=await context(),resetPage=await seed(resetC);await ready(resetPage);await settled(resetPage);await start(resetPage);await finish(resetPage);await settled(resetPage);
  const resetBefore=await metaGen(resetPage),resetRows=(await rows(resetPage)).length;
  await resetPage.evaluate(k=>{try{localStorage.setItem(k,'{broken')}catch{}},KEY);await resetPage.reload();await resetPage.locator('#brokenWarn').waitFor({state:'visible'});
  await Promise.all([resetPage.waitForNavigation(),resetPage.locator('#brokenReset').click()]);await resetPage.waitForFunction(()=>!document.body.inert);await settled(resetPage);
  const resetLsGen=(await disk(resetPage)).gen;assert(await resetPage.locator('#staleWarn').isHidden());
  await start(resetPage);await finish(resetPage);await settled(resetPage);
  const resetAfter=await metaGen(resetPage);assert(await resetPage.locator('#staleWarn').isHidden());assert(resetAfter>resetBefore);assert.equal((await rows(resetPage)).length,resetRows+1);
  console.log('EXTRA PASS after reset to empty: meta.gen '+resetBefore+' -> '+resetAfter+' (LS gen at start '+resetLsGen+'); not stopped; IDB '+resetRows+' -> '+(resetRows+1));
  const lowC=await context(),lowPage=await seed(lowC);await ready(lowPage);await settled(lowPage);await start(lowPage);await finish(lowPage);await settled(lowPage);
  const lowBefore=await metaGen(lowPage),lowRows=(await rows(lowPage)).length;
  await lowPage.evaluate(k=>{const d=JSON.parse(localStorage.getItem(k));d.gen=1;localStorage.setItem(k,JSON.stringify(d))},KEY);await lowPage.reload();await lowPage.waitForFunction(()=>!document.body.inert);await settled(lowPage);
  assert(await lowPage.locator('#staleWarn').isHidden());assert((await disk(lowPage)).gen>=lowBefore);
  await start(lowPage);await finish(lowPage);await settled(lowPage);
  const lowAfter=await metaGen(lowPage);assert(await lowPage.locator('#staleWarn').isHidden());assert(lowAfter>lowBefore);assert.equal((await rows(lowPage)).length,lowRows+1);
  console.log('EXTRA PASS LS gen smaller (1 vs meta '+lowBefore+'): not stopped; meta.gen '+lowBefore+' -> '+lowAfter+'; IDB '+lowRows+' -> '+(lowRows+1));
  // 不完全な旧データ（補完項目が多い）でも、補正してから移すので、残り約1万文字で警告が出ない（シオン 10/29）。
  const sparse=fixture();for(const s of sparse.sessions){s.rare={};for(const k of ['modeHints','_steps','mode','parallel','revive','melonLeft','melonApprox','rewardHint','modeHint','ticket','judgeWins','returnHit','pendingReward','modeEra','melonPhase','zenchou'])delete s[k]}
  const sparseC=await context(),sparsePage=await seed(sparseC,sparse);
  await sparsePage.evaluate(()=>{let lo=0,hi=6000000;while(lo+1<hi){const m=Math.floor((lo+hi)/2);try{localStorage.setItem('filler','x'.repeat(m));lo=m}catch{hi=m}}localStorage.setItem('filler','x'.repeat(lo-10000))});
  await ready(sparsePage);await settled(sparsePage);await sparsePage.waitForTimeout(300);
  assert(await sparsePage.locator('#storeWarn').isHidden());
  const sparseRows=await rows(sparsePage),sparseDisk=await disk(sparsePage);
  assert.equal(sparseRows.length,200);assert.deepEqual(sparseRows.map(s=>s.id).sort(),sparse.sessions.map(s=>s.id).sort());
  assert(sparseRows.every(s=>Array.isArray(s.modeHints)),'migrated rows are normalized');
  assert.equal(sparseDisk.version,3);assert.equal(sparseDisk.outbox.put.length,0);
  for(let i=0;i<3;i++){await start(sparsePage);await finish(sparsePage);await settled(sparsePage)}
  assert(await sparsePage.locator('#storeWarn').isHidden());assert.equal((await rows(sparsePage)).length,203);
  console.log('EXTRA PASS sparse legacy + 10000 chars free: normalized before migration; IDB=200 -> 203 after 3 plays; warnings=0; LS='+JSON.stringify(sparseDisk).length+' chars');
  // 手順2（localStorage）が容量不足で失敗しても手順3（IndexedDB）は続け、確定後の小さい書き込みが通れば警告が消える。
  const bigC=await context(),bigPage=await seed(bigC);await ready(bigPage);await settled(bigPage);
  await bigPage.evaluate(()=>{let lo=0,hi=6000000;while(lo+1<hi){const m=Math.floor((lo+hi)/2);try{localStorage.setItem('filler','x'.repeat(m));lo=m}catch{hi=m}}localStorage.setItem('filler','x'.repeat(lo-10000))});
  await start(bigPage);
  await bigPage.evaluate(()=>{window.__warnSeen=false;const w=document.getElementById('storeWarn');new MutationObserver(()=>{if(!w.classList.contains('hide'))window.__warnSeen=true}).observe(w,{attributes:true})});
  const bigNote='長'.repeat(30000);
  await bigPage.locator('#bUtil').click();await bigPage.getByRole('button',{name:'やめる（終了して記録する）',exact:true}).click();await bigPage.locator('#sheet input').first().fill('100');await bigPage.locator('#sheet textarea').fill(bigNote);await bigPage.getByRole('button',{name:'終了する',exact:true}).click();
  await settled(bigPage);await bigPage.locator('#storeWarn').waitFor({state:'hidden'});
  const bigRows=await rows(bigPage),bigDisk=await disk(bigPage),bigSeen=await bigPage.evaluate(()=>window.__warnSeen);
  assert(bigSeen,'step 2 failed once (warning shown)');assert.equal(bigRows.length,201);assert(bigRows.some(s=>s.endNote===bigNote));assert.equal(bigDisk.cur,null);assert.equal(bigDisk.outbox.put.length,0);
  await bigPage.reload();await ready(bigPage);assert.equal((await rows(bigPage)).length,201);assert(await bigPage.locator('#storeWarn').isHidden());
  console.log('EXTRA PASS LS full on finish (endNote 30000 chars, 10000 free): warning shown, IDB write continued -> 201, small rewrite cleared warning; reload=201');
  // version 3 で IndexedDB が読めないときだけ専用の文言。
  const msgC=await context(),msgPage=await seed(msgC);await ready(msgPage);await settled(msgPage);await msgC.addInitScript(()=>{indexedDB.open=()=>{throw Error('offline')}});await msgPage.reload();await msgPage.locator('#brokenWarn').waitFor({state:'visible'});
  assert.equal(await msgPage.locator('#brokenMsg').innerText(),'保存先のデータを読み込めないため、保存を止めています。「元データを書き出す」でファイルに保存して保管してください。');
  const lsC=await browser.newContext({viewport:{width:390,height:844}}),lsPage=await lsC.newPage();lsPage.on('pageerror',e=>errors.push(e.message));await lsPage.goto(origin+'/empty');await lsPage.evaluate(k=>localStorage.setItem(k,'{broken'),KEY);await ready(lsPage);await lsPage.locator('#brokenWarn').waitFor({state:'visible'});
  assert((await lsPage.locator('#brokenMsg').innerText()).startsWith('保存データが読めませんでした。'));await lsC.close();
  console.log('EXTRA PASS broken messages: v3+IDB unreadable -> new wording; broken LS -> existing wording');
  for(const ctx of browser.contexts())for(const page of ctx.pages())assert.deepEqual(await page.evaluate(()=>window.__errors),[]);
  assert.deepEqual(errors,[]);assert.equal(examples.size,7);result(1,'examples 1-7 PASS (200 synthetic sessions; 30-150 events/session)');
}
const watchdog=setTimeout(()=>{console.error('FAIL timeout');process.exit(1)},180000);
run().then(()=>{for(let i=1;i<=7;i++)console.log(`例${i} PASS ${examples.get(i)}`);for(let i=1;i<=10;i++)console.log(`§8-${i} PASS ${results.get(i)}`);console.log('Artifacts: '+tmp)}).catch(e=>{console.error(e);for(let i=1;i<=7;i++)console.log(`例${i} ${examples.has(i)?'PASS':'FAIL/NOT COMPLETED'} ${examples.get(i)||''}`);for(let i=1;i<=10;i++)console.log(`§8-${i} ${results.has(i)?'PASS':'FAIL/NOT COMPLETED'} ${results.get(i)||''}`);process.exitCode=1}).finally(async()=>{clearTimeout(watchdog);if(browser)await browser.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r))};});

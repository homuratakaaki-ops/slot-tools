import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {harness,root} from './rec-tokyoghoul.verify.mjs';
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/tokyoghoul-stats-2-synthetic.json'),'utf8'));
const baseline=execFileSync('git',['-c','safe.directory='+root,'show','01dcb42:tools/nisshi/index.html'],{encoding:'utf8'});
// The shared harness inserts its rec hook only into this isolated, inert adapter.
const adapter='<script>\n(()=>{const S={},storageStarting=false,flushBusy=false,save=null,render=null,showSetup=null,showNote=null,toEnvelope=null,validSession=null,fixSession=null,profit=null,MACHINES={},recordSummary=null,edTotals=null;\n})();\n</script>';
const old='/base/tools/nisshi/index.html',current='/tools/nisshi/index.html';
const h=await harness({[old]:baseline.replaceAll('\n})();\n</script>','\n})(); \n</script>')+adapter},'stats-2'),{ev,send,click,input}=h,results=[];
await send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:path.resolve(h.artifacts)});
const wait=async condition=>{for(let i=0;i<200;i++){if(await ev('return '+condition).catch(()=>false))return;await new Promise(r=>setTimeout(r,30))}throw Error('wait: '+condition)};
async function open(url=current){await h.open('/empty');const origin=await ev('return location.origin');await send('Page.navigate',{url:origin+url});await wait('typeof db!=="undefined"&&!!db&&!!document.querySelector("#app button")')}
async function clean(){await h.open('/empty');await ev('await new Promise((r,j)=>{const q=indexedDB.deleteDatabase("slot-tools-nisshi");q.onsuccess=r;q.onerror=j});');await open()}
async function importData(data,restore=false){
  const selector=restore?'#file-restore':'#file-import';
  await ev(`const i=document.querySelector(${JSON.stringify(selector)}),dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(JSON.stringify(data))}],'synthetic.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change',{bubbles:true}));`);
  await wait('document.querySelector("#preview").open&&!document.querySelector("#import-confirm").disabled');
}
async function commit(){await click('#import-confirm');await wait('!document.querySelector("#preview").open')}
async function analyze(machine='L東京喰種'){await open();await click('[data-page="analysis"]');await wait('!!document.querySelector("#machine-filter")');await input('#machine-filter',machine)}
async function getSummary(browser=h){const parts=[];for(const key of ['overview','detail']){await browser.click('[data-stats-tab="'+key+'"]');await browser.ev('document.querySelectorAll(".stats-zero").forEach(d=>d.open=true)');parts.push(await browser.ev('return document.querySelector(".stats-content").innerText'))}await browser.click('[data-stats-tab="overview"]');return parts.join('\n')}
async function detail(id='P2'){await open();await click('[data-play="rec:'+id+'"]');await wait('!!document.querySelector("#tg-detail")')}
async function edit(id='P2'){await detail(id);await click('[data-stats-edit]');await wait('document.querySelector("#edit-sheet").open')}
async function save(){await click('#edit-sheet button[type=submit]');await wait('!document.querySelector("#edit-sheet").open')}
const envelope=s=>({schema:'slot-session',sessionId:s.id,payloadVer:'rec-3',machineId:s.machine,startedAt:s.startAt,endedAt:s.endAt,storeName:s.shop,unitNo:s.dai,lendRate:s.lend,invest:1000,payout:100,payload:{machine:s.machine,mid:s.mid,machineDef:s.machineId,structVer:1,setup:s.setup,events:s.events,startRealG:s.startRealG,endRealG:s.realG,startLcdG:0,endLcdG:s.realG,startMedal:0,endMedal:100,replays:0,logs:[]}});
const backup=()=>ev('return {format:"slot-tools-nisshi",version:2,...await readStores(Object.keys(STORE_KEYS))}');
let directSummary,oldPlay,oldEnvelope,backupData;
async function test(id,fn){try{await fn();assert.deepEqual(await ev('return __errs'),[]);results.push({id,ok:true});console.log('PASS '+id)}catch(e){results.push({id,ok:false,error:e.stack});console.error('FAIL '+id+' '+e.stack);await h.snapshot('FAIL-'+id)}}
try{
  await test('B1',async()=>{
    await clean();await ev(`localStorage.setItem('slot-tools-rec',${JSON.stringify(JSON.stringify({sessions:[fixtures.P2],entries:[],stores:[],settings:{lend:46},cur:null}))});await new Promise((r,j)=>{const q=indexedDB.deleteDatabase('slot-tools-rec');q.onsuccess=r;q.onerror=j});`);
    await click('[data-page="settings"]');await wait('!!document.querySelector("#browser-import")');
    await ev('document.querySelectorAll("input[name=source]").forEach(i=>i.checked=i.value==="rec")');await click('#browser-import');await wait('document.querySelector("#preview").open');await commit();await analyze();directSummary=await getSummary();assert.match(directSummary,/242G/);assert.match(directSummary,/54枚/);
    await input('#machine-filter','');assert.equal(await ev('return !!document.querySelector("#tg-stats")'),false);
    await importData({sessions:[{...fixtures.P2,id:'other',machine:'架空機種B',machineId:'generic',mid:undefined}],entries:[]});await commit();await analyze('架空機種B');assert.equal(await ev('return !!document.querySelector("#tg-stats")'),false);
  });
  await test('B2',async()=>{await importData(envelope(fixtures.P2));await commit();await analyze();assert.equal(await getSummary(),directSummary);assert.equal(await ev('return rawPlays.filter(p=>p.id==="rec:P2").length'),1);assert.equal(await ev('return rawPlays.find(p=>p.id==="rec:P2").raw.machineId'),'tokyoghoul')});
  await test('B3',async()=>{
    oldEnvelope=envelope({...fixtures.P2,id:'legacy'});delete oldEnvelope.payload.structVer;delete oldEnvelope.payload.events;delete oldEnvelope.payload.setup;
    await open(old);await importData(oldEnvelope);await commit();oldPlay=await ev('return comparable(rawPlays.find(p=>p.id==="rec:legacy"))');await open();await importData(oldEnvelope);assert.equal(await ev('return pending.plan.counts.rec.updated'),0);await commit();assert.equal(await ev('return comparable(rawPlays.find(p=>p.id==="rec:legacy"))'),oldPlay);
  });
  await test('B4',async()=>{
    await edit();await input('#edit-sheet [name=lastHit]','czFail');await input('#edit-sheet [name=prevCzTrig]','規定G数');await click('#edit-sheet [name=prevCzKiteiG]');await click('[data-number="2"]');await click('[data-number="0"]');await click('[data-number="0"]');await click('[data-number="use"]');await save();
    const before=await ev('return rawPlays.find(p=>p.id==="rec:P2").raw');await importData({sessions:[fixtures.P2],entries:[]});await commit();
    assert.deepEqual(await ev('return rawPlays.find(p=>p.id==="rec:P2").statsFix'),{lastHit:'czFail',prevCzTrig:'規定G数',prevCzKiteiG:200});
    assert.deepEqual(await ev('return rawPlays.find(p=>p.id==="rec:P2").raw.setup'),fixtures.P2.setup);assert.deepEqual(await ev('return rawPlays.find(p=>p.id==="rec:P2").raw.events'),before.events);
    await analyze();await click('[data-stats-tab="history"]');assert.match(await ev('return document.querySelector("#tg-stats").innerText'),/着席前/);
  });
  await test('B6',async()=>{
    await ev('window.__download=null;window.__create=URL.createObjectURL;URL.createObjectURL=b=>{window.__download=b;return __create(b)}');await click('[data-back]');await click('[data-page="settings"]');await click('#export');await wait('!!window.__download');backupData=await ev('return JSON.parse(await __download.text())');
    await analyze();const before=await getSummary(),fresh=await harness({},'stats-2-restore');
    try{
      const ready=async condition=>{for(let i=0;i<200;i++){if(await fresh.ev('return '+condition).catch(()=>false))return;await new Promise(r=>setTimeout(r,30))}throw Error('fresh browser: '+condition)};
      await fresh.open('/empty');const origin=await fresh.ev('return location.origin');await fresh.send('Page.navigate',{url:origin+current});await ready('typeof db!=="undefined"&&!!db&&!!document.querySelector("#app button")');assert.equal(await fresh.ev('return rawPlays.length'),0);
      await fresh.ev(`const i=document.querySelector('#file-restore'),dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(JSON.stringify(backupData))}],'synthetic-backup.json',{type:'application/json'}));i.files=dt.files;i.dispatchEvent(new Event('change'));`);
      await ready('document.querySelector("#preview").open&&!document.querySelector("#import-confirm").disabled');await fresh.click('#import-confirm');await ready('!document.querySelector("#preview").open');
      await fresh.click('[data-page="analysis"]');await ready('!!document.querySelector("#machine-filter")');await fresh.input('#machine-filter','L東京喰種');assert.equal(await getSummary(fresh),before);assert.deepEqual(await fresh.ev('return rawPlays.find(p=>p.id==="rec:P2").statsFix'),backupData.plays.find(p=>p.id==='rec:P2').statsFix);assert.deepEqual(await fresh.ev('return __errs'),[]);
    }finally{await fresh.close()}
  });
  await test('B5',async()=>{await detail();await click('[data-stats-reset]');await wait('!rawPlays.find(p=>p.id==="rec:P2").statsFix');assert.equal(await ev('return document.querySelector("#tg-detail").innerText.includes("日誌で直した項目あり")'),false)});
  await test('B7',async()=>{
    await importData({sessions:[fixtures.P15,{...fixtures.P2,id:'month-other',startAt:'2026-10-10T01:00:00Z',endAt:'2026-10-10T02:00:00Z',shop:'架空店B'}],entries:[]});await commit();
    await ev('await mutate(d=>{d.tagDefs.push({id:"test-aim",kind:"aim",name:"架空狙い",scope:"all"},{id:"test-tag",kind:"free",name:"架空タグ",scope:"all"});d.plays.find(p=>p.id==="rec:P2").aim="test-aim";d.plays.find(p=>p.id==="rec:P2").tags=["test-tag"]})');
    const comparisons=[];
    for(const filters of [{},{machine:'架空機種B'},{shop:'架空店A'},{aim:'test-aim'},{freeTag:'test-tag'},{month:'2026-10'},{machine:'L東京喰種'}]){
      const values=[];for(const url of [old,current]){await open(url);await click('[data-page="analysis"]');for(const [key,value] of Object.entries(filters))await input('[data-filter="'+key+'"]',value);values.push(await ev('const c=document.querySelector("#app").cloneNode(true);c.querySelector("#tg-stats")?.remove();return c.innerHTML'))}assert.equal(values[1],values[0]);comparisons.push({filters,identical:true});
    }fs.writeFileSync(path.join(h.artifacts,'B7.json'),JSON.stringify(comparisons,null,2));
  });
  await test('B8',async()=>{await analyze();await click('[data-stats-toggle]');await input('[data-stats-filter="lastHit"]','czFail');await input('[data-stats-filter="prevCzTrig"]','規定G数');await click('[data-stats-filter="prevCzKiteiG_min"]');for(const n of ['2','0','0'])await click('[data-number="'+n+'"]');await click('[data-number="use"]');assert.match(await ev('return document.querySelector("#tg-stats").innerText'),/自動 1台/);assert.match(await getSummary(),/30G/);await input('[data-stats-filter="prevCzKiteiG_min"]','201');assert.match(await ev('return document.querySelector("#tg-stats").innerText'),/自動 0台/)});
  await test('B9',async()=>{
    const measures=[];for(const width of [360,390]){
      await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
      await open(old);await click('[data-page="analysis"]');const oldSmall=await smallButtons();
      await analyze();await measure('analysis','#tg-stats',oldSmall);await detail();await measure('detail','#tg-detail',oldSmall);await click('[data-stats-edit]');await input('#edit-sheet [name=lastHit]','czFail');await input('#edit-sheet [name=prevCzTrig]','規定G数');await measure('correction','#edit-sheet',oldSmall);await click('#edit-sheet [data-close]');
      async function measure(name,scope,oldSmall){const m=await ev(`const p=document.querySelector(${JSON.stringify(scope)});return {width:innerWidth,page:document.documentElement.scrollWidth,scroll:p.scrollWidth,client:p.clientWidth,buttons:[...p.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>({text:b.textContent,height:b.getBoundingClientRect().height}))}`);assert.equal(m.width,width);assert.ok(m.page<=width);assert.ok(m.scroll<=m.client);assert.deepEqual(m.buttons.filter(b=>b.height<44),[]);const small=await smallButtons();assert.ok(small.every(b=>oldSmall.some(o=>o.text===b.text&&o.height===b.height)),JSON.stringify(small));measures.push({name,...m,baselineSmall:oldSmall});if(width===390)await screenshot(name,scope)}
    }fs.writeFileSync(path.join(h.artifacts,'B9.json'),JSON.stringify(measures,null,2));
    async function smallButtons(){return ev('return [...document.querySelectorAll("#app button")].filter(b=>b.getClientRects().length&&b.getBoundingClientRect().height<44).map(b=>({text:b.textContent,height:b.getBoundingClientRect().height}))')}
    async function screenshot(name,scope){
      const dir=path.join(root,'scratchpad/tg-stats2/screens');fs.mkdirSync(dir,{recursive:true});
      if(name==='correction')await send('Emulation.setDeviceMetricsOverride',{width:390,height:1600,deviceScaleFactor:1,mobile:true});
      await ev(`window.scrollTo(0,0);document.querySelector(${JSON.stringify(scope)}).scrollTop=0;await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
      const clip=await ev(`const r=document.querySelector(${JSON.stringify(scope)}).getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1}`);
      const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});fs.writeFileSync(path.join(dir,name+'.png'),Buffer.from(shot.data,'base64'));
      await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    }
  });
  await test('extra-fix-null-merge-persistence',async()=>{
    await edit('P15');await click('[data-stats-none="prevCzKiteiG"]');await save();assert.equal(await ev('return rawPlays.find(p=>p.id==="rec:P15").statsFix.prevCzKiteiG'),null);
    await edit('P15');await input('#edit-sheet [name=prevCzKiteiG]',200);await save();assert.equal(await ev('return Object.hasOwn(rawPlays.find(p=>p.id==="rec:P15"),"statsFix")'),false);
    assert.deepEqual(await ev('const a=clone(rawPlays[0]),b=clone(rawPlays[1]);a.statsFix={c3:0};b.statsFix={c3:2};mergeManual(a,b);const first=a.statsFix;delete a.statsFix;mergeManual(a,b);return [first,a.statsFix]'),[{c3:0},{c3:2}]);
    const data=await backup();assert.ok(data.plays.every(p=>!Object.hasOwn(p,'normalG')&&!Object.hasOwn(p,'medalDiff')));
  });
  await test('extra-confirmed-map-and-filters',async()=>{
    await ev('await mutate(d=>{const p=d.plays.find(p=>p.id==="rec:P2"),r=PlayStats.extract(p);r.normalG=999;putMeta(d,"statsConfirmed",{tokyoghoul:{P2:r}})})');
    await analyze();assert.match(await ev('return document.querySelector("#tg-stats").innerText'),/自動 3台 ／確定値 1台/);assert.match(await getSummary(),/1,271G/);
    await input('[data-filter="month"]','2026-10');assert.match(await ev('return document.querySelector("#tg-stats").innerText'),/自動 1台 ／確定値 0台/);
    await ev('await mutate(d=>d.meta=d.meta.filter(m=>m.key!=="statsConfirmed"))');
  });
}finally{fs.writeFileSync(path.join(h.artifacts,'results.json'),JSON.stringify(results,null,2));await h.close()}
if(results.some(r=>!r.ok))process.exitCode=1;

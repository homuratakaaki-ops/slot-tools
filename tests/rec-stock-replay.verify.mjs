// Run: node tests/rec-stock-replay.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=process.env.BASE||'c3358c2';  // 本件直前の main
const KEY='slot-tools-rec';
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-stock-replay-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-stock-replay-profile-'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];

// IIFE の内側に窓口を差し込む（S・関数に触るため）
const hook='\nwindow.__rec={get S(){return S},render,validSession,toEnvelope,profit,replayed};\n})();\n</script>';
const inject=html=>{assert.ok(html.includes('\n})();\n</script>'));return html.replace('\n})();\n</script>',()=>hook);};
const current=inject(fs.readFileSync(path.join(root,'tools/rec/index.html'),'utf8'));
const before=inject(execFileSync('git',['-c','safe.directory='+root,'show',BASE+':tools/rec/index.html'],{cwd:root,encoding:'utf8'}));
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if(url==='/tools/rec/index.html')return res.end(current);
  if(url==='/old/tools/rec/index.html')return res.end(before);
  res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;

let browser,ws;const pending=new Map();let seq=0;
async function send(method,params={}){
  const id=++seq;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function ev(expression){
  const r=await send('Runtime.evaluate',{expression:`(async()=>{${expression}})()`,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,600));
  return r.result.value;
}
async function open(page='/tools/rec/index.html',width=390){
  assert.deepEqual(await ev('return window.__errs||[];'),[]);
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  for(let i=0;i<100;i++){if(await ev('return !!(window.__rec&&document.getElementById("stFields"));').catch(()=>false))break;await pause(50);}
  await pause(100);
}
const clearAll=()=>ev(`localStorage.clear();`);
const shot=async name=>{const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));};
// HELPERS
const click=s=>ev(`const b=document.querySelector(${JSON.stringify(s)});if(!b)throw Error('Missing selector');b.click();`);
const button=(s,t,p=false)=>ev(`const b=[...document.querySelectorAll(${JSON.stringify(s)}+' button')].find(b=>${p?'b.textContent.startsWith('+JSON.stringify(t)+')':'b.textContent==='+JSON.stringify(t)});if(!b)throw Error('Missing button '+${JSON.stringify(t)});b.click();`);
const rows=()=>ev(`return [...document.querySelectorAll('#log .lg')].map(r=>({g:r.querySelector('.gs').textContent,text:r.querySelector('.tx').textContent}));`);
const stored=()=>ev(`return JSON.parse(localStorage.getItem('${KEY}')).cur.events;`);
const number=async n=>{await click('#kpClear');for(const d of String(n))await button('#kpKeys',d);await click('#kpOk');};
const setup=async(page='/tools/rec/index.html',lend=46,stock=null,initial=0)=>{
  await open(page);await clearAll();await open(page);
  await ev(`for(const [id,v] of Object.entries({stMachine:'テスト汎用台',stLend:${lend},stMedal:100,stReplay0:${initial},stStock:${JSON.stringify(stock)}})){const i=document.getElementById(id);if(i){i.value=v??'';i.dispatchEvent(new Event('input',{bubbles:true}));}}document.getElementById('stStart').click();if(!__rec.S.cur)throw Error('Start failed');`);
};
const state=()=>ev(`return {money:__rec.S.cur.money,events:__rec.S.cur.events,pill:document.querySelector('#mRep').textContent,label:document.querySelector('#mRep').parentElement.textContent,button:document.querySelector('#bReplay').textContent,diff:document.querySelector('#mDiff').textContent};`);
const close=()=>click('#shClose');
const custom=async n=>{await button('#shBody','枚数を入れる');await number(n);};
try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
  await pause(1500);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
    if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,300));};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;let seed=1;Math.random=()=>((seed=seed*16807%2147483647)/2147483647);Date.now=()=>1793100000000;window.addEventListener('unhandledrejection',e=>(window.__errs=window.__errs||[]).push(String(e.reason)));window.addEventListener('error',e=>(window.__errs=window.__errs||[]).push(e.message));`});

// CASES
  await setup(undefined,46,5612);
  assert.equal(await ev("return document.querySelector('#stStock').value;"),'');
  await click('#bReplay');await click('#bReplay');
  let st=await state();assert.equal(st.pill,'5,520枚');assert.equal(st.label,'貯5,520枚');assert.equal(st.money.replays.reduce((a,r)=>a+r.amount,0),92);
  assert.equal(st.events.at(-1).text,'再プレイ −46枚　累計 92枚（貯玉残 5,520枚）');
  assert.ok((await rows())[0].text.includes(st.events.at(-1).text));
  // Snapshot a real UI-created session, then compare identical data through BASE.
  const fixture=await ev('return JSON.parse(JSON.stringify(__rec.S));');
  const compare=async()=>ev(`const s=JSON.parse(JSON.stringify(__rec.S.cur));s.money.credit=500;s.money.endMedal=500;return {profit:__rec.profit(s),envelope:__rec.toEnvelope(s)};`);
  const outputs=await compare();
  for(const width of [360,390,412]){
    await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});
    const dims=await ev(`return {width:innerWidth,buttons:[...document.querySelectorAll('.r3 button')].map(b=>{const r=b.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(b);return {top:r.top,right:r.right,width:r.width,height:r.height,lines:range.getClientRects().length}}),pills:[...document.querySelectorAll('.mpill')].map(b=>b.getBoundingClientRect().height)};`);
    assert.equal(dims.width,width);assert.equal(new Set(dims.buttons.map(b=>b.top)).size,1);assert.ok(dims.buttons.every(b=>b.height>=44&&b.lines===1&&b.right<=width));assert.ok(dims.pills.every(h=>h>=44));assert.equal(new Set(dims.pills).size,1);
    console.log('MEASURE '+JSON.stringify(dims));await shot('stock-'+width);
  }
  await click('#bUndo');st=await state();assert.equal(st.pill,'5,566枚');assert.equal(st.money.replays.length,1);assert.equal(st.events.length,1);
  await click('#bStock');await button('#shBody','貯メダル残高を入れる／直す');await number(0);
  assert.equal((await state()).pill,'-46枚');
  assert.equal(await ev(`return getComputedStyle(document.querySelector('#mRep')).color;`),'rgb(224, 87, 74)');
  const stable=await ev(`window.bodyRef=document.querySelector('#shBody').firstChild;document.querySelector('#shBody').scrollTop=9999;return document.querySelector('#shBody').scrollTop;`);
  await button('#shBody','1回の枚数を直す',true);await number(75);
  assert.equal((await state()).button,'再 −75');
  assert.equal(await ev('return bodyRef===document.querySelector("#shBody").firstChild;'),true);
  assert.equal(await ev('return document.querySelector("#shBody").scrollTop;'),stable);
  assert.equal(await ev(`return JSON.parse(localStorage.getItem('${KEY}')).cur.money.replayUnit;`),75);
  await button('#shBody','+50');await custom(12);st=await state();assert.equal(st.money.replays.length,3);assert.ok(st.events.at(-1).text.includes('再プレイ −12枚'));assert.equal(st.pill,'-108枚');
  await close();await click('#bUndo');assert.equal((await state()).pill,'-96枚');
  await click('#bUndo');await click('#bUndo');st=await state();assert.equal(st.pill,'0枚');assert.equal(st.money.stockStart,0);assert.equal(st.money.replayUnit,75);assert.equal(st.events.length,0);
  await click('#bReplay');assert.equal((await state()).pill,'-75枚');
  await click('#bStock');await button('#shBody','残高を消す');assert.equal((await state()).label,'再75枚');await close();
  await setup(undefined,50);assert.equal((await state()).button,'再 −50');await click('#bReplay');assert.equal((await state()).label,'再50枚');await click('#bStock');
  await button('#shBody','1回の枚数を直す',true);await number(60);assert.equal((await state()).button,'再 −60');
  await button('#shBody','レートに戻す（50）');assert.equal((await state()).button,'再 −50');
  await button('#shBody','1回の枚数を直す',true);await number(0);assert.equal((await state()).button,'再 −50');
  await close();await setup(undefined,46,5612,92);assert.equal((await state()).pill,'5,520枚');
  // Import validation includes missing, null, finite numbers and invalid types.
  assert.deepEqual(await ev(`const out=[];for(const key of ['stockStart','replayUnit'])for(const value of [undefined,null,0,46,-1,'46',{},NaN,Infinity]){const c=JSON.parse(JSON.stringify(__rec.S.cur));if(value===undefined)delete c.money[key];else c.money[key]=value;out.push(__rec.validSession(c));}return out;`),[true,true,true,true,true,false,false,false,false,true,true,true,true,true,false,false,false,false]);
  // Download actual backup JSON, without writing to the user's download folder.
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__downloads=[];const orig=URL.createObjectURL;URL.createObjectURL=b=>{window.__downloads.push(b);return orig(b)};HTMLAnchorElement.prototype.click=function(){};`});
  const backup=async(page,seed)=>{
    await open(page);await ev(`localStorage.setItem('${KEY}',${JSON.stringify(JSON.stringify(seed))});`);await open(page);
    await click('#storeExport');return ev('return JSON.parse(await window.__downloads.at(-1).text());');
  };
  const currentBackup=await backup('/tools/rec/index.html',fixture);
  const oldFixture=JSON.parse(JSON.stringify(fixture));delete oldFixture.cur.money.stockStart;
  const reloadedOutputs=await compare();
  const baseBackup=await backup('/old/tools/rec/index.html',oldFixture);
  const baseOutputs=await compare();assert.deepEqual(reloadedOutputs,baseOutputs);
  delete currentBackup.cur.money.stockStart;assert.deepEqual(currentBackup,baseBackup);
  // BASE creates the same total via its real custom replay buttons.
  await setup('/old/tools/rec/index.html');for(let i=0;i<2;i++){await click('#bReplay');await custom(46);}assert.equal((await compare()).profit.medalDiff,outputs.profit.medalDiff);
  const legacyBackup=await backup('/tools/rec/index.html',oldFixture);
  assert.equal(Object.hasOwn(legacyBackup.cur.money,'stockStart'),false);assert.equal(Object.hasOwn(legacyBackup.cur.money,'replayUnit'),false);
  assert.equal((await state()).label,'再92枚');await click('#bReplay');assert.equal((await state()).label,'再138枚');
  const diffs=[];
  for(const page of ['/tools/rec/index.html','/old/tools/rec/index.html']){
    await setup(page,46,5612);
    for(let i=0;i<2;i++){await click('#bReplay');if(page.includes('/old/'))await custom(46);}
    await click('#bUtil');await button('#shBody','残数調整',true);await number(500);
    diffs.push((await state()).diff);
  }
  assert.deepEqual(diffs,['+308枚','+308枚']);
  assert.deepEqual(errors,[]);assert.deepEqual(await ev('return window.__errs||[];'),[]);
  console.log('PASS: stock, replay unit/reset, unknown balance, negative balance, undo/settings retained, atStart, legacy load, BASE profit/envelope/backup, validation, viewport, exceptions 0');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{console.log("Artifacts: "+artifacts);ws?.close();browser?.kill();server.close();}

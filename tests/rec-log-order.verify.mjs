// Run: node tests/rec-log-order.verify.mjs
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
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-log-order-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-log-order-profile-'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];

// IIFE の内側に窓口を差し込む（S・関数に触るため）
const hook='\nwindow.__rec={get S(){return S},render};\n})();\n</script>';
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
const game=async n=>{await click('[data-cnt="realG"]');await number(n);await button('#shBody','差を保つ',true);};
const memo=async text=>{await button('#scMain','メモ');await ev(`document.querySelector('#shBody textarea').value=${JSON.stringify(text)};`);await button('#shBody','記録する');};
const expand=async()=>{if(await ev(`return !!document.querySelector('#log .more')&&!document.querySelector('#log .fbar');`))await click('#log .more');};
const edit=async(text,n)=>{await ev(`const r=[...document.querySelectorAll('#log .lg')].find(r=>r.querySelector('.tx').textContent.includes(${JSON.stringify(text)}));if(!r)throw Error('Missing row');r.click();`);await ev(`const i=document.querySelector('#shBody .two input');i.value=${JSON.stringify(String(n))};i.dispatchEvent(new Event('input',{bubbles:true}));`);await button('#shFoot','直す');};
const setup=async(page,machine)=>{await open(page);await clearAll();await open(page);if(machine)await button('#stMachines',machine);await ev(`const set=(id,v)=>{const i=document.getElementById(id);if(!i.value){i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));}};set('stMachine','テスト汎用台');set('stLend','46');document.getElementById('stStart').click();if(!__rec.S.cur)throw Error('Start failed');`);};
const scenario=async(page,machine)=>{
  await setup(page,machine);
  await game(1);await game(114);await game(134);await memo('同G先');await expand();
  await edit('実114/液晶114 →',213);await memo('同G後');await expand();
  const snapshot=await stored();
  if(!page.includes('/old/')){
    const r=await rows();assert.deepEqual(r.map(x=>x.g),['213','134','134','114','1']);
    assert.ok(r[1].text.includes('同G後'));assert.ok(r[2].text.includes('同G先'));
    await shot(machine?'karakuri-order':'generic-order');
    await button('#log','閉じる');assert.deepEqual((await rows()).map(r=>r.g),['213','134','134']);await expand();
  }
  await click('#bUndo');const afterUndo=await stored();
  assert.equal(afterUndo.some(e=>e.text==='同G後'),false);assert.equal(afterUndo.some(e=>e.realG===213),true);
  if(!page.includes('/old/'))assert.deepEqual((await rows()).map(r=>r.g),['213','134','114','1']);
  assert.deepEqual(await ev('return window.__errs||[];'),[]);
  return {snapshot,afterUndo};
};
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
  const a=await scenario('/tools/rec/index.html'),b=await scenario('/old/tools/rec/index.html');
  for(const k of ['snapshot','afterUndo'])assert.deepEqual(a[k].map(e=>e.id),b[k].map(e=>e.id),'BASE stored id order '+k);
  console.log('PASS 1/3/5: UI edit, tie order, collapsed 3, undo, BASE stored IDs');
  await scenario('/tools/rec/index.html','からくりサーカス2');
  console.log('PASS 4a: karakuri2');
  await setup('/tools/rec/index.html');await game(90);await memo('前');
  await button('#scMain','当選');await button('#shBody','AT');
  await game(200);await memo('区間内');
  await button('#scMain','AT 終了',true);await button('#shFoot','終了する');
  await game(2);await memo('後');await expand();
  const events=await stored(),si=events.findIndex(e=>e.type==='hitStart'),ei=events.findIndex(e=>e.type==='hitEnd');
  assert.ok(si>=0&&ei>si);
  const sorted=x=>x.slice().reverse().sort((a,b)=>b.realG-a.realG);
  const expected=sorted(events.slice(ei+1)).concat(events[ei],sorted(events.slice(si+1,ei)),events[si],sorted(events.slice(0,si)));
  assert.deepEqual((await rows()).map(r=>r.g),expected.map(e=>String(e.realG)));
  await button('#log','当選');assert.deepEqual((await rows()).map(r=>r.g),[String(events[ei].realG),String(events[si].realG)]);
  await button('#log','全部');await shot('boundaries');
  console.log('PASS 2/4b: hitStart/hitEnd boundaries and kind filter');
  // Legacy/null fixtures: acceptance uses actual expand/filter buttons and rendered rows.
  await ev(`__rec.S.cur.events=[
    {id:'n0',type:'memo',text:'先頭null',realG:null},
    {id:'n1',type:'memo',text:'高G',realG:90,tags:['検証']},
    {id:'n2',type:'memo',text:'継承null',realG:null,tags:['検証']},
    {id:'n3',type:'hitResume',text:'復帰',realG:50},
    {id:'n4',type:'memo',text:'区切り継承',realG:null,tags:['検証']},
    {id:'n5',type:'memo',text:'低G',realG:2,tags:['検証']}
  ].map(e=>({...e,at:'2026-10-28T00:00:00Z',lcdG:null}));__rec.render();`);
  await button('#log','閉じる');await expand();
  assert.deepEqual((await rows()).map(r=>r.g),['','2','50','','90','']);
  assert.deepEqual((await rows()).map(r=>r.text),['区切り継承','低G','復帰','継承null','高G','先頭null']);
  await button('#log','検証');assert.deepEqual((await rows()).map(r=>r.text),['区切り継承','低G','継承null','高G']);
  assert.deepEqual(await ev(`return __rec.S.cur.events.map(e=>e.id);`),['n0','n1','n2','n3','n4','n5']);
  await shot('null-tags');
  console.log('PASS 4c: hitResume, null inheritance, tag filter, source unchanged');
  assert.deepEqual(errors,[]);assert.deepEqual(await ev('return window.__errs||[];'),[]);
  console.log('PASS 6: uncaught exceptions / unhandledrejection 0');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{console.log("Artifacts: "+artifacts);ws?.close();browser?.kill();server.close();}

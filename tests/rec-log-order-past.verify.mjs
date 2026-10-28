// Run: node tests/rec-log-order-past.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=process.env.BASE||'babdcc3';  // 本件直前の main
const KEY='slot-tools-rec';
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-log-order-past-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-log-order-past-profile-'));
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
// Acceptance traverses real finish/list/export buttons; the hook only sets legacy fixtures.
const finish=async()=>{
  await click('#bUtil');await button('#shBody','やめる（終了して記録する）');
  await ev(`const i=document.querySelector('#shBody input');i.value='250';i.dispatchEvent(new Event('input',{bubbles:true}));`);
  await button('#shBody','終了する');
  assert.equal(await ev('return __rec.S.cur;'),null);
  await click('#nList details summary');await button('#nList','記録を全部見る');
};
const pastRows=()=>ev(`return [...document.querySelectorAll('#shBody .lg')].map(r=>({g:r.querySelector('.gs').textContent,text:r.querySelector('.tx').textContent}));`);
const inspect=async label=>{
  const storage=await ev(`return JSON.parse(localStorage.getItem('${KEY}'));`);
  const card=await ev(`return document.querySelector('#nList .note').textContent;`);
  await button('#nList','記録の修正・削除');const list=await pastRows();
  await shot(label+'-past');await click('#shClose');
  await click('#nExpText');const text=await ev(`return document.querySelector('#shBody textarea').value;`);
  assert.ok(text.includes(card),'export contains complete card text');await click('#shClose');
  await ev(`window.__download=null;URL.createObjectURL=b=>{window.__download=b;return 'blob:verification';};HTMLAnchorElement.prototype.click=function(){};`);
  await button('#nList','この台をノート用に保存');
  const envelope=await ev(`return JSON.parse(await window.__download.text());`);
  assert.deepEqual(await ev('return window.__errs||[];'),[]);
  return {storage,card,text,list,envelope};
};
const split=(text,n)=>{
  const lines=text.split('\n'),i=lines.indexOf('────────')+1;
  assert.ok(i>0);return {before:lines.slice(0,i),events:lines.slice(i,i+n),after:lines.slice(i+n)};
};
const compare=(a,b,indices)=>{
  const n=a.storage.sessions[0].events.length;
  assert.deepEqual(a.storage,b.storage,'entire persisted data unchanged, including event IDs/order');
  assert.deepEqual(a.envelope,b.envelope,'entire downloaded envelope unchanged');
  const x=split(a.card,n),y=split(b.card,n);
  assert.deepEqual(x.before,y.before,'header/start unchanged');assert.deepEqual(x.after,y.after,'end/summary unchanged');
  assert.deepEqual(x.events,indices.map(i=>y.events[i]),'event text changes order only');
  assert.deepEqual(a.list,indices.map(i=>b.list[i]),'past list uses same event order');
  assert.equal(a.text.replace(a.card,'<SESSION>'),b.text.replace(b.card,'<SESSION>'),'export outer summaries unchanged');
};
const run=async(page,{machine,ordered=false,boundary=false,legacy=false}={})=>{
  await setup(page,machine);
  if(legacy){
    await ev(`__rec.S.cur.events=[
      {id:'n0',type:'memo',text:'先頭null',realG:null},
      {id:'n1',type:'memo',text:'高G',realG:90},
      {id:'n2',type:'memo',text:'継承null',realG:null},
      {id:'n3',type:'hitResume',text:'復帰',realG:50},
      {id:'n4',type:'memo',text:'区切り継承',realG:null},
      {id:'n5',type:'memo',text:'低G',realG:2}
    ].map(e=>({...e,at:'2026-10-28T00:00:00Z',lcdG:null}));__rec.render();`);
  }else if(boundary){
    await game(90);await memo('前高');await game(10);await memo('前低');
    await button('#scMain','当選');await button('#shBody','AT');
    await game(200);await memo('区間内高');await game(20);await memo('区間内低');
    await button('#scMain','AT 終了',true);await button('#shFoot','終了する');
    await game(2);await memo('後低');await game(80);await memo('後高');
  }else{
    await game(1);await game(114);await game(134);await memo('同G先');
    if(!ordered){await expand();await edit('実114/液晶114 →',213);}
    await memo('同G後');
  }
  await expand();const live=await rows();
  await finish();const result=await inspect((page.includes('/old/')?'base':'current')+'-'+(machine?'karakuri-':'')+(legacy?'null':boundary?'boundaries':ordered?'ordered':'generic'));
  if(!page.includes('/old/'))assert.deepEqual(result.list,live.slice().reverse(),'past list is reverse of live renderLog');
  if(!ordered&&!boundary&&!legacy){
    if(!page.includes('/old/'))assert.deepEqual(result.list.map(r=>r.g),['1','114','134','134','213']);
    await button('#nList','記録の修正・削除');
    const index=page.includes('/old/')?2:4;
    await ev(`document.querySelectorAll('#shBody .lg')[${index}].click();`);
    assert.equal(await ev(`return document.querySelector('#shBody .two input').value;`),'213');
    await ev(`const i=document.querySelector('#shBody .two input');i.value='214';i.dispatchEvent(new Event('input',{bubbles:true}));`);
    await button('#shFoot','直す');
    const changed=await ev(`return JSON.parse(localStorage.getItem('${KEY}')).sessions[0].events;`);
    const original=result.storage.sessions[0].events;
    assert.deepEqual(changed.map(e=>e.id),original.map(e=>e.id));
    assert.deepEqual(changed.filter(e=>e.id!==original[2].id),original.filter(e=>e.id!==original[2].id));
    assert.equal(changed.find(e=>e.id===original[2].id).realG,214,'edit targets ID, not displayed index');
  }
  return result;
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
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;let seed=1;Math.random=()=>((seed=seed*16807%2147483647)/2147483647);const NativeDate=Date;window.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:[1793100000000]));}static now(){return 1793100000000;}};window.addEventListener('unhandledrejection',e=>(window.__errs=window.__errs||[]).push(String(e.reason)));window.addEventListener('error',e=>(window.__errs=window.__errs||[]).push(e.message));`});

  for(const machine of [undefined,'からくりサーカス2']){
    const a=await run('/tools/rec/index.html',{machine}),b=await run('/old/tools/rec/index.html',{machine});
    compare(a,b,[0,1,3,4,2]);
    console.log('PASS: corrected/late memo order, ID edit, card/export, envelope/storage BASE equality: '+(machine||'generic'));
  }
  const ordered=await run('/tools/rec/index.html',{ordered:true}),oldOrdered=await run('/old/tools/rec/index.html',{ordered:true});
  compare(ordered,oldOrdered,[0,1,2,3,4]);assert.equal(ordered.card,oldOrdered.card);assert.equal(ordered.text,oldOrdered.text);
  console.log('PASS: already-ordered sessionText/export byte equality');
  const boundary=await run('/tools/rec/index.html',{boundary:true}),oldBoundary=await run('/old/tools/rec/index.html',{boundary:true});
  compare(boundary,oldBoundary,[2,3,0,1,4,7,8,5,6,9,10,11,12,13]);
  assert.deepEqual(boundary.storage.sessions[0].events.filter(e=>['hitStart','hitEnd'].includes(e.type)).map(e=>e.type),['hitStart','hitEnd']);
  console.log('PASS: hitStart/hitEnd keep blocks separate');
  for(const machine of [undefined,'からくりサーカス2']){
    const a=await run('/tools/rec/index.html',{legacy:true,machine}),b=await run('/old/tools/rec/index.html',{legacy:true,machine});
    compare(a,b,[0,1,2,3,5,4]);
    assert.deepEqual(a.list.map(r=>r.text),['先頭null','高G','継承null','復帰','低G','区切り継承']);
    console.log('PASS: hitResume and null inheritance: '+(machine||'generic'));
  }
  assert.deepEqual(errors,[]);assert.deepEqual(await ev('return window.__errs||[];'),[]);
  console.log('PASS: uncaught exceptions / unhandledrejection 0');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{console.log("Artifacts: "+artifacts);ws?.close();browser?.kill();server.close();}

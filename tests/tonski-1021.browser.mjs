// CHROME_PATH=<chrome executable> node tests/tonski-1021.browser.mjs
// Real iframe viewports, production buttons, persistence and card PNGs in os.tmpdir().
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'slot-tonski-1021-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-tonski-1021-profile-'));
const PAGE=process.env.PAGE||'tonski-checker.html';
const TEST=PAGE==='tonski-test-checker.html';
const CONFIG=TEST?'tonski-test':'tonski';
const KEY=TEST?'tonski-checker-v1-test':'tonski-checker-v1';
const results=[];
const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(req.url==='/harness'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');
  }
  const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser,ws;
const pending=new Map();let seq=0;
async function send(method,params={}){
  const id=++seq;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
const frame=code=>evaluate(`(async()=>{const w=document.getElementById('frame').contentWindow;const d=w.document;${code}})()`);
const raw=()=>frame(`return w.localStorage.getItem(${JSON.stringify(KEY)});`);
const click=selector=>frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+'/'+PAGE)};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return w.CheckerConfigs?.[${JSON.stringify(CONFIG)}]&&d.querySelector('#nav')?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function canvas(id){
  return frame(`const cv=d.getElementById(${JSON.stringify(id)});return {width:cv.width,height:cv.height,text:w.__texts[cv.id]||[],data:cv.toDataURL()};`);
}
function saveCanvas(name,c){fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(c.data.split(',')[1],'base64'));}
async function shot(name,width,selector){
  await frame(`d.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start'});`);await pause(80);
  const s=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));
}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name);}

const win='.cycle-btn.win',miss='.cycle-btn:not(.win)';
const rowState=()=>frame("const e=d.querySelector('.cycle-row');return {num:e.querySelector('.num').textContent,pct:e.querySelector('.pct').textContent,sub:e.querySelector('.row-sub').textContent};");
async function layout(name){
 const r=await frame("const e=d.querySelector('.cycle-row');const nodes=[e,...e.querySelectorAll('*')];return {width:w.innerWidth,docWidth:d.documentElement.scrollWidth,overflow:nodes.filter(n=>{const r=n.getBoundingClientRect();return r.left<0||r.right>w.innerWidth+.5;}).map(n=>n.className),buttons:[...e.querySelectorAll('button')].map(n=>({height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width}))};");
 fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
 assert.deepEqual(r.overflow,[]);assert.ok(r.docWidth<=r.width);
 assert.equal(r.buttons.length,2);for(const b of r.buttons)assert.ok(b.height>=44&&b.width>=44);
 return r;
}
try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1200,1000','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.on('error',e=>errors.push(e.message));
  browser.stderr.on('data',chunk=>fs.appendFileSync(path.join(artifacts,'chrome.log'),chunk));
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
  await pause(1500);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  ws.onmessage=async event=>{
    const m=JSON.parse(event.data);
    if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
    if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args);
    if(m.method==='Log.entryAdded'&&m.params.entry.level==='error')errors.push(m.params.entry);
    if(m.method==='Fetch.requestPaused'){
      // 広告・計測・Webフォントは空で返す（オフラインのローカル検証）
      await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
    }
  };
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'https://*'},{urlPattern:'http://www.*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__errors=[];window.__texts={};window.__clipboard='';
    window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));console.error('unhandledrejection',String(e.reason));});
    window.addEventListener('error',e=>window.__errors.push(e.message));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__clipboard=text;}}});
    const ft=CanvasRenderingContext2D.prototype.fillText,fr=CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(w>=1000&&h>=1000)window.__texts[this.canvas.id]=[];return fr.apply(this,arguments);};
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y){const m=this.measureText(text);(window.__texts[this.canvas.id]??=[]).push({text:String(text),x,y,font:this.font,width:m.width,left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight});return ft.apply(this,arguments);};
  `});
  await send('Page.navigate',{url:origin+'/harness'});await pause(100);
  for(const width of [360,390,412]){

    await evaluate('localStorage.clear();');
    await load(width);
    await frame('w.localStorage.setItem('+JSON.stringify(KEY)+',JSON.stringify({games:1200,cz:{cz:2,bonus:1},future:{keep:7}}));');
    await load(width);
    assert.deepEqual(await rowState(),{num:'0',pct:'-',sub:'設1:30.1%⇔設6:44.9%'});
    assert.equal(await frame(`return d.querySelector('[data-c="cz.bonus"] .num').textContent;`),'1');
    const before=await raw();
    await click('.cycle-row');assert.equal(await raw(),before,'row itself must not count');
    for(let i=0;i<4;i++)await click(win);
    for(let i=0;i<6;i++)await click(miss);
    assert.equal((await rowState()).pct,'4/10 40%');
    assert.deepEqual(JSON.parse(await raw()).rates,{megami333r:10,megami333w:4});
    await layout('input-'+width);
    await shot('tonski-1021-input-'+width,width,'.cycle-row');
    await click('#modeBtn');
    for(let i=0;i<6;i++)await click(miss);
    assert.equal((await rowState()).pct,'4/4 100%');
    assert.equal(await frame(`return d.querySelector('.cycle-btn:not(.win)').disabled;`),true);
    await click(miss);assert.equal((await rowState()).pct,'4/4 100%');
    await click(win);assert.equal((await rowState()).pct,'3/3 100%');
    await click('#undoBtn');assert.equal((await rowState()).pct,'4/4 100%');
    await click('#modeBtn');
    for(let i=0;i<6;i++)await click(miss);
    await load(width);
    assert.equal((await rowState()).pct,'4/10 40%');
    assert.equal(JSON.parse(await raw()).future.keep,7);
    await layout('reload-'+width);
    await tab(4);await pause(300);
    const card=await canvas('cardCanvas');
    const footer=card.text.find(x=>x.text==='slot-tools.jp');
    assert.equal(footer.y,976);
    assert.ok(!card.text.some(x=>x.text.includes('333G')));
    assert.ok(card.text.every(x=>x.left>=0&&x.right<=1080));
    const tpl=await frame("return d.getElementById('tpl').value;");
    assert.ok(tpl.includes('333G女神の舞▶4/10（40%）'));
    await click('#detailBtn');await pause(300);
    const det=await canvas('detailCanvas');
    assert.ok(det.text.some(x=>x.text.includes('333G到達時の女神の舞 4/10 40%')));
    assert.ok(det.text.every(x=>x.left>=0&&x.right<=1080));
    if(width===390){saveCanvas('tonski-1021-card',card);saveCanvas('tonski-1021-card-detail',det);}
    assert.deepEqual(await frame('return w.__errors;'),[]);
    pass('layout, buttons, minus boundary, undo, legacy reload, template and cards '+width);
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

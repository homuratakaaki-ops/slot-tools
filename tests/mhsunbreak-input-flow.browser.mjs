// Run explicitly: node tests/mhsunbreak-input-flow.browser.mjs
// BZタブの入力導線（現在の状況／ここから記録／1→2→3）の実表示と実操作。指示書 docs/specs/mhsunbreak-input-flow-v01.md §5.3
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-profile-'));
const results=[];
const errors=[];
const visualFindings=[];
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
const state=()=>frame('return JSON.parse(w.localStorage.getItem(w.__key));');
const click=selector=>frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(id,width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+'/'+id+'-checker.html')};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return d.querySelector('#hitIn,#gIn,[data-number-key="gamesMyslo"]')&&w.CheckerConfigs?.[${JSON.stringify(id)}]?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  await frame(`w.__key=${JSON.stringify(id+'-checker-v1')};`);
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function clear(id,width=390){
  await evaluate(`localStorage.removeItem(${JSON.stringify(id+'-checker-v1')});`);
  await load(id,width);
}
async function games(value){await frame(`const el=d.querySelector('#hitIn,#gIn,[data-number-key="gamesMyslo"]');el.value=${JSON.stringify(String(value))};el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));if(el.id==='hitIn')d.querySelector('[data-action="addHit"]').click();`);}
async function bump(key){await click(`[data-c="${key}"] .plus`);}
async function canvas(id){
  return frame(`const cv=d.getElementById(${JSON.stringify(id)});const x=cv.getContext('2d');const a=x.getImageData(0,0,cv.width,cv.height).data;let opaque=0,bright=0;for(let i=0;i<a.length;i+=4){if(a[i+3])opaque++;if(a[i]+a[i+1]+a[i+2]>180)bright++;}return {width:cv.width,height:cv.height,opaque,bright,text:w.__texts[cv.id]||[],data:cv.toDataURL()};`);
}
function saveCanvas(name,c){fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(c.data.split(',')[1],'base64'));}
async function copy(plain=false){await click(plain?'#cpPlainBtn':'#cpBtn');return frame('return w.__clipboard;');}
async function reset(){await frame(`d.getElementById('dataOps').open=true;`);await click('#resetBtn');await click('#resetBtn');}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name);}
async function measure(name){
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&w.getComputedStyle(e).visibility!=='hidden');const inScroller=e=>{for(let p=e.parentElement;p;p=p.parentElement){const ox=w.getComputedStyle(p).overflowX;if(ox==='auto'||ox==='scroll'||ox==='hidden')return true;}return false;};return {width,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return (r.left<-.5||r.right>width+.5)&&!inScroller(e);}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60),rect:e.getBoundingClientRect().toJSON()})),buttons:nodes.filter(e=>e.matches('button,.plus')).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height,minHeight:w.getComputedStyle(e).minHeight})),ndLabels:[...d.querySelectorAll('.bz-row .ct')].map(e=>{const range=d.createRange();range.selectNodeContents(e.firstElementChild);return {text:e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,rowHeight:e.closest('.bz-row').getBoundingClientRect().height,lineCount:range.getClientRects().length,font:w.getComputedStyle(e.firstElementChild).fontSize};})};`);
  fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
  // Jump navigation intentionally scrolls horizontally. Its clipped children do
  // not overflow the page viewport; test the scroll container itself instead.
  const visibleOverflow=[];
  for(const item of r.overflow){
    const clipped=await frame(`return [...d.querySelectorAll('.jump-nav button')].some(e=>e.textContent===${JSON.stringify(item.text)}&&['auto','scroll','hidden'].includes(w.getComputedStyle(e.parentElement).overflowX));`);
    if(!clipped)visibleOverflow.push(item);
  }
  assert.deepEqual(visibleOverflow,[],name+' horizontal overflow');
  assert.ok(r.buttons.every(b=>b.height>=44),name+' button below 44px: '+JSON.stringify(r.buttons.filter(b=>b.height<44)));
  pass(name+' viewport',{width:r.width,minButtonHeight:Math.min(...r.buttons.map(b=>b.height)),overflow:0,ndLabels:r.ndLabels});
  if(r.ndLabels.length){
    assert.deepEqual(r.ndLabels.map(l=>l.text),['通常','高確','超高確','通常','高確']);
    if(r.ndLabels.some(l=>l.lineCount!==1))visualFindings.push({name:name+' n/d single-line labels',status:'FAIL',detail:r.ndLabels});
    else pass(name+' n/d single-line labels',r.ndLabels);
  }
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
      // The local acceptance test is independent of ads, analytics and remote fonts.
      // Keep their URLs/HTML unchanged; record this test-environment limitation.
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
    await clear('mhsunbreak');await load('mhsunbreak',width,530);await tab(2);await measure('input-flow-'+width);
    const metrics=await frame(`const names=['BZ（ブレイクゾーン）','アイキャッチ（ステージチェンジ）','チッチェのセリフ','アイルー福引','BZ終了時PUSH ランプ'];return {width:w.innerWidth,scrollHeight:d.getElementById('main').scrollHeight,headings:[...d.querySelectorAll('.entry-h')].filter(e=>names.includes(e.textContent)).map(e=>({text:e.textContent,fontSize:w.getComputedStyle(e).fontSize})),minButtonHeight:Math.min(...[...d.querySelectorAll('header button,#main button,nav button')].filter(e=>e.checkVisibility()).map(e=>e.getBoundingClientRect().height)),sections:d.querySelectorAll('section.sec').length,jumpNav:d.querySelectorAll('.jump-nav').length};`);
    assert.equal(metrics.headings.length,5);assert.ok(metrics.headings.every(h=>parseFloat(h.fontSize)>=16));assert.ok(metrics.minButtonHeight>=44);assert.equal(metrics.sections,2);assert.equal(metrics.jumpNav,0);
    console.log('MEASURE '+JSON.stringify(metrics));pass('input-flow metrics '+width,metrics);
    const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,'input-flow-'+width+'.png'),Buffer.from(shot.data,'base64'));
  }
  await clear('mhsunbreak');await load('mhsunbreak',390,530);await tab(2);
  await click('[data-action="bzPick"][data-q="t3"]');await click('[data-action="bzPickPos"][data-pos="3"]');
  assert.equal(await frame('return d.querySelectorAll(".pos-pick").length;'),0);assert.equal(await frame('return d.querySelectorAll(".pos-done").length;'),1);
  await click('[data-action="bzQuest"][data-r="miss"]');
  assert.deepEqual((await state()).atLog.sessions[0].events,[{t:'bz',table:'t3',r:'miss',pos:3}]);
  assert.equal(await frame('return d.querySelectorAll(".saved-note").length;'),1);assert.equal(await frame('return d.querySelectorAll(".t-btn.on").length;'),0);
  await click('#undoBtn');assert.deepEqual((await state()).atLog.sessions[0].events,[]);assert.equal((await state()).bzT1.t3,0);
  pass('one production undo restores event and aggregate');
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

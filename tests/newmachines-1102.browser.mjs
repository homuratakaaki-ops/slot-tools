// node tests/newmachines-1102.browser.mjs（11/2導入5機種の最小版） — headless Chrome / CDP。成果物は os.tmpdir() のみ。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'slot-newmachines-1102-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-newmachines-1102-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IDS=['ragnador','garo','ggo','godzieva2','vivy'];let KEY='',PAGE='';const errors=[],measures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser,ws,seq=0,checks=0;const pending=new Map();
function send(method,params={}){
  const id=++seq;return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},20000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;
}
const run=code=>evaluate(`(async()=>{const d=document,w=window;${code}})()`);
const state=()=>run(`return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}));`);
const click=selector=>run(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
const plus=key=>click(`[data-c="${key}"] .plus`);
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(80);}
async function load(width=360,page=PAGE){
  await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  let ready=false;
  for(let i=0;i<150;i++){
    ready=await run(`return location.pathname===${JSON.stringify(page)}&&document.readyState==='complete'&&!!d.querySelector(${JSON.stringify(page.includes('guide')?'main.container':'#main .sec')});`).catch(()=>false);
    if(ready)break;await pause(40);
  }
  assert.ok(ready,'page ready');assert.equal(await run('return innerWidth;'),width);
}
async function seed(S,width=360){await run(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(S))});`);await load(width);}
async function shot(name,width){const r=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));}
function pass(name){checks++;console.log('PASS '+name);}
async function layout(width,label,p){
  const m=await run(`const W=innerWidth,main=d.getElementById('main');
    const bad=[...d.querySelectorAll('header,nav,#main,#main *')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+.5||r.left<-.5)&&!e.closest('details:not([open])')&&!e.closest('.jump-nav');
    }).map(e=>(e.className||e.tagName)+':'+e.textContent.trim().slice(0,25));
    const taps=[...d.querySelectorAll('.plus,nav button,#main button')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('details:not([open])')).map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height}));
    return {width:W,scroll:main.scrollWidth-main.clientWidth,bad,taps};`);
  assert.equal(m.width,width);assert.equal(m.scroll,0,JSON.stringify({width,label,p,scroll:m.scroll}));assert.deepEqual(m.bad,[],JSON.stringify({width,label,p,bad:m.bad}));
  assert.ok(m.taps.length>0);assert.ok(m.taps.every(t=>t.height>=44),JSON.stringify(m.taps.filter(t=>t.height<44)));
  measures.push({width,label,tab:p,minButtonHeight:Math.min(...m.taps.map(t=>t.height)),overflow:m.scroll});
}
async function canvas(id,name){
  const data=await run(`await document.fonts.ready;const cv=d.getElementById(${JSON.stringify(id)});const ctx=cv.getContext('2d');const pixels=ctx.getImageData(0,0,cv.width,cv.height).data;let bright=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>180)bright++;return {width:cv.width,height:cv.height,bright,png:cv.toDataURL('image/png'),texts:window.__texts[${JSON.stringify(id)}]||[]};`);
  assert.ok(data.width>0&&data.height>0&&data.bright>1000,JSON.stringify({...data,png:undefined}));
  const bytes=Buffer.from(data.png.split(',')[1],'base64');assert.equal(bytes.subarray(1,4).toString(),'PNG');fs.writeFileSync(path.join(artifacts,name+'.png'),bytes);return data;
}
try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.on('error',e=>errors.push(e.message));
  for(let i=0;i<150&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  ws.onmessage=event=>{
    const m=JSON.parse(event.data);
    if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
    if(m.method==='Fetch.requestPaused')send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
  };
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'https://*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__errors=[];window.__texts={};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    addEventListener('error',e=>window.__errors.push(e.message));addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){(window.__texts[this.canvas.id]??=[]).push({text:String(text),x,y,w:this.measureText(String(text)).width,font:this.font});return original.call(this,text,x,y,...args);};
  `});
  for(const id of IDS){
    KEY=id+'-checker-v1';PAGE='/'+id+'-checker.html';
    await load();
    assert.deepEqual(await run('return [...d.querySelectorAll("#nav button")].map(b=>b.textContent);'),['入力','参照','カード']);
    assert.ok((await run('return d.querySelector("#main .hint").textContent;')).startsWith('設定示唆（終了画面・トロフィーなど）は出典で調査中です。'));
    const keys=await run('return [...d.querySelectorAll("[data-c]")].map(e=>e.dataset.c);');
    for(const key of keys){await plus(key);const [group,k]=key.split('.');assert.equal((await state())[group][k],1);}
    await plus(keys[0]);await click('#undoBtn');assert.equal((await state()).counts[keys[0].split('.')[1]],1);
    const saved=await state();await load();assert.deepEqual(await state(),saved);
    pass(id+' all '+keys.length+' count buttons / undo / save / reload');
    // 当選ごとのG：実画面で入力→追加→取消→↩取消（分母＝当選ごとのG合計、§9-105）。
    const addGame=v=>run(`const i=d.getElementById('gameLogIn');i.focus();i.value=${JSON.stringify(v)};d.querySelector('[data-action="addGameLog"]').click();`);
    const sumText=()=>run(`return d.querySelector('[data-glog-sum]').textContent+'/'+d.querySelector('[data-glog-count]').textContent;`);
    assert.equal(await run(`return d.querySelector('[data-action="popGameLog"]').disabled;`),true);
    await addGame('');await addGame('0');assert.deepEqual((await state()).gameLog,[]);
    await addGame('312');assert.equal(await run(`return d.getElementById('gameLogIn').value;`),'');
    await addGame('688');assert.deepEqual((await state()).gameLog,[312,688]);assert.equal(await sumText(),'1000G/2');
    assert.equal(await run(`return d.querySelector('[data-c="${keys[0]}"] .pct').textContent;`),'1/1000.0');
    await click('[data-action="popGameLog"]');assert.deepEqual((await state()).gameLog,[312]);assert.equal(await sumText(),'312G/1');
    await click('#undoBtn');assert.deepEqual((await state()).gameLog,[312,688]);
    await load();assert.equal(await sumText(),'1000G/2');
    pass(id+' 当選ごとのG 追加・最後の1件の取消・↩取消・保存');
    const full=await run('return structuredClone(CheckerConfigs.'+id+'.defaults);');
    full.gameLog=[1500,2500];keys.forEach((k,i)=>{full.counts[k.split('.')[1]]=[21,11][i];});
    for(const [label,S] of [['empty',{}],['filled',full]]){
      await seed(S);
      for(let p=0;p<3;p++){await tab(p);await layout(360,label,p);await shot(id+'-'+['input','reference','card'][p]+'-360-'+label,360);}
    }
    await tab(0);assert.equal(await run(`return d.querySelector('[data-c="${keys[0]}"] .pct').textContent;`),'1/190.5');
    await tab(2);await pause(150);
    const card=await canvas('cardCanvas',id+'-summary-card');
    for(const s of ['1/190.5','通常G','4000G'])assert.ok(card.texts.some(t=>t.text.includes(s)),id+' '+s);
    for(const t of card.texts.filter(t=>t.y>=270&&t.y<=400&&t.x>=70))assert.ok(t.x+t.w<=1010,JSON.stringify(t));
    await click('#detailBtn');await pause(250);await canvas('detailCanvas',id+'-detail-card');
    await load(360,'/'+id+'-guide.html');assert.equal(await run('return d.documentElement.scrollWidth-d.documentElement.clientWidth;'),0);
    assert.deepEqual(await run('return window.__errors;'),[]);pass(id+' 360px 3 tabs overflow 0 / buttons >=44px / card PNG / guide');
  }
  assert.deepEqual(errors,[]);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks}; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

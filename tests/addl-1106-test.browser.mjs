// node tests/addl-1106-test.browser.mjs — ローカルのみ。長押し未対応は未達として報告する。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-addl-1106-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-addl-1106-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IDS=['seiya12','ragnador','ggo'];let KEY='',PAGE='';const errors=[],measures=[];
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
let browser,ws,seq=0,checks=0,failures=0;const pending=new Map();
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
      const r=e.getBoundingClientRect();return r.width>0&&(r.right>W||r.left<0)&&!e.closest('details:not([open])')&&!e.closest('.jump-nav');
    }).map(e=>(e.className||e.tagName)+':'+e.textContent.trim().slice(0,25));
    const taps=[...d.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('details:not([open])')).map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height}));
    return {width:W,documentWidth:d.documentElement.scrollWidth,scroll:main.scrollWidth-main.clientWidth,bad,taps};`);
  assert.equal(m.width,width);assert.ok(m.documentWidth<=width);assert.equal(m.scroll,0,JSON.stringify({width,label,p,scroll:m.scroll}));assert.deepEqual(m.bad,[],JSON.stringify({width,label,p,bad:m.bad}));
  assert.ok(m.taps.length>0);assert.ok(m.taps.every(t=>t.height>=44),JSON.stringify(m.taps.filter(t=>t.height<44)));
  // 通常crowでは折り返し可。role-rowを追加する場合の寸法確認。
  const wraps=await run(`return [...d.querySelectorAll('.role-row .ct small')].filter(e=>e.getBoundingClientRect().width>0&&e.getClientRects().length>1).map(e=>e.textContent);`);
  assert.deepEqual(wraps,[],JSON.stringify({width,label,p,wraps}));
  measures.push({page:PAGE,width,label,tab:p,minButtonHeight:Math.min(...m.taps.map(t=>t.height)),overflow:m.scroll});
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
  const unmet=[];
  for(const id of IDS){
    KEY=id+'-checker-v1-test';PAGE='/'+id+'-test-checker.html';
    await load();
    const defaults=await run('return CheckerConfigs['+JSON.stringify(id+'-test')+'].defaults;');
    const old=structuredClone(defaults);delete old.gfLamp;delete old.counts.czKakutei;
    old.gameLog=[300,700];old.games=9;old.iconChoice='default';
    const unknown={str:'keep',num:2.5,neg:-3,bool:false,nul:null,arr:[1,'a',{x:1}],obj:{deep:{v:'x'}}};
    old.futureRoot=unknown;
    for(const g of Object.keys(old).filter(k=>old[k]&&typeof old[k]==='object'&&!Array.isArray(old[k])&&k!=='futureRoot')){
      for(const k of Object.keys(old[g]))old[g][k]=4;
      Object.assign(old[g],unknown);
    }
    const production=JSON.stringify(old);
    await run('localStorage.setItem('+JSON.stringify(id+'-checker-v1')+','+JSON.stringify(production)+');');
    await seed(old);
    // 起動だけでは保存文字列を変更せず、描画には正規化値を用いる。
    assert.equal(await run('return localStorage.getItem('+JSON.stringify(KEY)+');'),production);
    const keys=await run('return [...d.querySelectorAll("[data-c]")].map(e=>e.dataset.c);');
    for(const key of keys){
      const expected=key==='counts.czKakutei'?'0':'4';
      assert.equal(await run('return d.querySelector('+JSON.stringify('[data-c="'+key+'"] .num')+').textContent;'),expected);
    }
    await tab(1);
    if(id==='seiya12')for(const color of Object.keys(defaults.gfLamp))assert.equal(await run('return d.querySelector('+JSON.stringify('[data-c="gfLamp.'+color+'"] .num')+').textContent;'),'0');
    const suggestion=await run('return [...d.querySelectorAll("[data-c]")].map(e=>e.dataset.c);');
    const target=id==='seiya12'?'gfLamp.rainbow':suggestion[0];
    await plus(target);const before=await state();await plus(target);await click('#undoBtn');assert.deepEqual(await state(),before);
    for(const [k,v] of Object.entries(old.counts))if(k in defaults.counts)assert.equal((await state()).counts[k],v);
    if(id==='ggo')for(const [k,v] of Object.entries(unknown))assert.deepEqual((await state()).counts[k],v);
    if(id==='ragnador')assert.equal((await state()).counts.czKakutei,0);
    pass(id+' old data / new zero / suggestions / undo');
    await tab(0);await plus(keys[0]);await click('#undoBtn');assert.deepEqual(await state(),before);
    // 実ポインターで800ms押す。本番にも入力UIがないため、未達を隠さない。
    const selector='[data-c="'+keys[0]+'"] .plus';
    const pos=await run('const e=d.querySelector('+JSON.stringify(selector)+');e.scrollIntoView({block:"center"});const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};');
    await send('Input.dispatchMouseEvent',{type:'mousePressed',...pos,button:'left',clickCount:1});await pause(800);
    const entry=await run('return [...d.querySelectorAll("dialog,[role=dialog],input")].filter(e=>e.getBoundingClientRect().width>0&&e.id!=="gameLogIn").map(e=>e.outerHTML);');
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',...pos,button:'left',clickCount:1});
    if(entry.length===0){unmet.push(id+': 長押し入力UIなし（既存エンジン未対応・変更禁止）');console.log('UNMET '+unmet.at(-1));await click('#undoBtn');}
    else throw Error('長押しUIが存在します。入力と取消の検証を追加してください。');
    const stable=await state();await load();assert.deepEqual(await state(),stable);
    if(id==='ragnador'){
      const normal=await state();normal.counts.cz=10;normal.counts.czKakutei=2;await seed(normal);
      assert.equal(await run(`return d.querySelector('[data-c="counts.czKakutei"] .pct').textContent;`),'CZ 10回中 2回（20.0%）');
      await layout(360,'valid-percent',0);await shot('ragnador-valid-percent-360',360);
      const S=await state();S.counts.cz=2;S.counts.czKakutei=3;await seed(S);
      assert.equal(await run('return d.querySelector(".hint.warn").textContent;'),'確定CZの回数がCZ回数を超えています。');
      assert.equal(await run(`return d.querySelector('[data-c="counts.czKakutei"] .pct').textContent;`),'CZ 2回中 3回');
      await plus('counts.czKakutei');assert.equal((await state()).counts.czKakutei,4);
      assert.ok(await run('return !!d.querySelector(".hint.warn");'));await click('#undoBtn');assert.equal((await state()).counts.czKakutei,3);
      pass('ragnador M>N warning / plus continues / undo');
    }
    for(let p=0;p<4;p++){await tab(p);await layout(360,'old-data',p);await shot(id+'-'+p+'-360',360);}
    await tab(3);await pause(250);await canvas('cardCanvas',id+'-summary');
    await click('#detailBtn');await pause(250);const detail=await canvas('detailCanvas',id+'-detail');
    if(id==='seiya12')assert.ok(detail.texts.some(x=>x.text.includes('GFランプ')));
    if(id==='ragnador')assert.ok(detail.texts.some(x=>x.text.includes('確定CZ 3/2')));
    assert.deepEqual(await run('return window.__errors;'),[]);
    assert.equal(await run('return localStorage.getItem('+JSON.stringify(id+'-checker-v1')+');'),production,'本番文字列はバイト一致');
    pass(id+' production bytes unchanged / 360px 4 tabs / card pixels');
    await seed({});
    for(let p=0;p<4;p++){await tab(p);await layout(360,'empty',p);}
    if(id==='seiya12')assert.ok(!(await run('return d.getElementById("tpl").value;')).includes('グランドフィナーレ'));
    if(id==='ragnador')assert.ok(!(await run('return d.getElementById("tpl").value;')).includes('確定CZ▶'));
    pass(id+' empty 4 tabs / zero output hidden');
  }
  fs.writeFileSync(path.join(artifacts,'unmet.json'),JSON.stringify(unmet,null,2));
  if(unmet.length){failures+=unmet.length;process.exitCode=1;}
  assert.deepEqual(errors,[]);
}catch(e){failures++;console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,failures,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks} passed / ${failures} failed; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

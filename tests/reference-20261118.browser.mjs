// node tests/reference-20261118.browser.mjs — 実ビューポート320/360px・保存互換。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=process.env.REFERENCE_PREVIEW_ROOT||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const preview=!!process.env.REFERENCE_PREVIEW_ROOT;
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-seiya12-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-seiya12-profile-'));
const chrome=process.env.CHROME_PATH||'/usr/bin/chromium';
let KEY='seiya12-checker-v1';const errors=[],measures=[];
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
async function load(width=390,page='/seiya12-checker.html'){
  await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  let ready=false;
  for(let i=0;i<150;i++){
    ready=await run(`return location.pathname===${JSON.stringify(page)}&&document.readyState==='complete'&&!!d.querySelector(${JSON.stringify(page.includes('guide')?'main.container':'#main .sec')});`).catch(()=>false);
    if(ready)break;await pause(40);
  }
  assert.ok(ready,'page ready');assert.equal(await run('return innerWidth;'),width);
}
async function seed(S,width=390){await run(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(S))});`);await load(width);}
async function shot(name,width){const r=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));}
async function guideShot(name,width,heading){
  const bounds=await run(`await document.fonts.ready;
    const h=[...d.querySelectorAll('main h2')].find(el=>el.textContent.trim()===${JSON.stringify(heading)});
    if(!h)throw Error('Missing guide heading: '+${JSON.stringify(heading)});
    h.scrollIntoView({block:'start',behavior:'instant'});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const r=h.getBoundingClientRect();
    return {top:r.top,bottom:r.bottom,height:innerHeight};`);
  assert.ok(bounds.top>=-1&&bounds.bottom<=bounds.height+1,heading+' is in the guide viewport');
  // No page-coordinate clip: capture the viewport we just scrolled to.
  const {data}=await send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const pixels=await run(`const img=new Image();
    img.src='data:image/png;base64,'+${JSON.stringify(data)};await img.decode();
    const cv=d.createElement('canvas');cv.width=img.width;cv.height=img.height;
    const ctx=cv.getContext('2d');ctx.drawImage(img,0,0);
    const y=Math.floor(${bounds.top}),h=Math.ceil(${bounds.bottom})-y;
    const a=ctx.getImageData(0,y,cv.width,h).data;
    const colors=new Set();for(let i=0;i<a.length;i+=4)colors.add((a[i]<<16)|(a[i+1]<<8)|a[i+2]);
    return {width:cv.width,height:cv.height,colors:colors.size};`);
  assert.equal(pixels.width,width);
  assert.equal(pixels.height,bounds.height);
  assert.ok(pixels.colors>1,heading+' screenshot is not blank');
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(data,'base64'));
}
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

  for(const id of ['ggo','seiya12']){
    KEY=id+'-checker-v1'+(preview?'-test':'');
    for(const width of [320,360]){
      const page='/'+id+(preview?'-test':'')+'-checker.html';await load(width,page);
      const productionSentinel=JSON.stringify({gameLog:[123,456],counts:{bonus:7,at:9},future:{text:'07',decimal:1.25}});
      if(preview)await run(`localStorage.setItem(${JSON.stringify(id+'-checker-v1')},${JSON.stringify(productionSentinel)});`);
      const legacy=await run(`const s=structuredClone(CheckerConfigs.${id}.defaults);s.gameLog=[100,200];for(const k of CheckerConfigs.${id}.mergeKeys){for(const f of Object.keys(s[k]))s[k][f]=3;s[k].future={s:'07',n:1.25,negative:-2,nil:null,a:[1,'x']};}s.future={s:'07',n:1.25,negative:-2,nil:null,a:[1,'x']};return s;`);
      await run(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(legacy))});`);await load(width,page);
      const before=await state();
      await tab(2);
      assert.match(await run('return d.getElementById("main").textContent;'),/2026年11月18日/);
      assert.equal(await run('return d.documentElement.scrollWidth>d.documentElement.clientWidth;'),false);
      assert.equal(await run('return d.querySelectorAll("#main input,#main button[data-c]").length;'),0);
      for(const section of await run('return [...d.querySelectorAll("#main .sec")].slice('+(id==='ggo'?2:4)+').map(e=>e.id);')){
        await run(`d.getElementById(${JSON.stringify(section)}).scrollIntoView();`);await pause(50);await shot(id+'-'+section+'-'+width,width);
      }
      assert.deepEqual(await state(),before);
      await tab(0);const key=id==='ggo'?'counts.bonus':'counts.at';await plus(key);await click('#undoBtn');await load(width,page);
      // Loading a legacy null leaves the raw bytes alone. The first write persists the engine's default.
      const expectedAfterSave={...before,iconChoice:'default'};
      assert.equal(before.iconChoice,null,'fixture must exercise legacy iconChoice migration');
      assert.deepEqual(await state(),expectedAfterSave,'save/reload/undo migrates only iconChoice and preserves other values/types');
      await tab(3);const template=await run('return d.getElementById("tpl").value;');
      assert.doesNotMatch(template,/グレネード|守護星座|AT直撃/);
      await click('#detailBtn');await pause(250);await canvas('detailCanvas',id+'-detail-'+width);await canvas('cardCanvas',id+'-card-'+width);
      assert.deepEqual(await run('return window.__errors;'),[]);
      if(preview)assert.equal(await run(`return localStorage.getItem(${JSON.stringify(id+'-checker-v1')});`),productionSentinel,'nonzero production storage stays byte-identical');
      await load(width,'/'+id+(preview?'-test':'')+'-guide.html');
      assert.equal(await run('return d.documentElement.scrollWidth>d.documentElement.clientWidth;'),false);
      const guideHeadings=id==='ggo'
        ? [['rewards','グレネードジャッジの報酬振り分け']]
        : [['guardian-1','守護星座の加護（加護なし・星矢・氷河）'],['guardian-2','守護星座の加護（瞬・紫龍・一輝）'],['direct-at','規定周期到達時のAT直撃']];
      for(const [label,heading] of guideHeadings)await guideShot(id+'-guide-'+label+'-'+width,width,heading);
      pass(id+' '+width+'px: reference/guide, legacy storage, unknown types, undo, template/cards');
    }
  }
  assert.deepEqual(errors,[]);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks}; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

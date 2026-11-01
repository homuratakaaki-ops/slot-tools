// Real button paths, canvas pixels and aobuta regression against 2b85b40.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-engine-detail-orphan-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-engine-detail-orphan-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IDS=['godzieva2','ragnador','garo'];let baseline=false;
const oldEngine=execFileSync('git',['show','2b85b40:checker-engine.js'],{cwd:root,encoding:'utf8'});let KEY='',PAGE='';const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(baseline&&url==='/checker-engine.js'){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.end(oldEngine);}
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
function pass(name){checks++;console.log('PASS '+name);}
async function canvas(id,name){
  const data=await run(`await document.fonts.ready;const cv=d.getElementById(${JSON.stringify(id)});const ctx=cv.getContext('2d');const pixels=ctx.getImageData(0,0,cv.width,cv.height).data;let bright=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>180)bright++;return {width:cv.width,height:cv.height,bright,png:cv.toDataURL('image/png'),texts:window.__texts[${JSON.stringify(id)}]||[]};`);
  assert.ok(data.width>0&&data.height>0&&data.bright>1000,JSON.stringify({...data,png:undefined}));
  const bytes=Buffer.from(data.png.split(',')[1],'base64');assert.equal(bytes.subarray(1,4).toString(),'PNG');const output=path.join(artifacts,name+'.png');fs.writeFileSync(output,bytes);console.log('PNG '+output);return data;
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
  async function populated(id,old=false){
    baseline=old;KEY=id+'-checker-v1';PAGE='/'+id+'-checker.html';await load();
    const full=await run('const s=structuredClone(CheckerConfigs.'+id+'.defaults);function fill(o){for(const [k,v] of Object.entries(o)){if(typeof v==="number")o[k]=1;else if(v&&typeof v==="object"&&!Array.isArray(v))fill(v);}}fill(s);return s;');
    await seed(full);
    if(id==='aobuta'){
      assert.equal(await run('return CheckerConfigs.aobuta.actions===undefined;'),true);
      const key=await run('return d.querySelector("[data-c] .plus").closest("[data-c]").dataset.c;');
      const initial=await state();await plus(key);const counted=await state();
      const [g,k]=key.split('.');assert.equal(counted[g][k],initial[g][k]+1);
    }
    await run('const b=[...d.querySelectorAll("#nav button")].find(b=>b.textContent.includes("カード"));if(!b)throw Error("card tab missing");b.click();');
    // Wait for the same image and asynchronous font-triggered redraws before comparing pixels.
    await run('await document.fonts.ready;');await pause(400);
    await click('#detailBtn');await pause(300);
    const rows=await run('return w.__checkerApp._detailRows();');
    assert.ok(rows.length<=40);if(!old)assert.notEqual(rows[19]?.type,'section');
    const summary=await canvas('cardCanvas',id+(old?'-before':'-after')+'-summary');
    const detail=await canvas('detailCanvas',id+(old?'-before':'-after')+'-detail');
    if(!old&&rows[19]?.type==='spacer'){
      assert.ok(!detail.texts.some(t=>t.x>=70&&t.x<560&&t.y===338+19*30),'spacer has no rendered text');
      assert.ok(detail.texts.some(t=>t.text===rows[20].title&&t.x===560),'section rendered in right column');
    }
    assert.deepEqual(await run('return window.__errors;'),[]);
    return {state:await state(),rows,summary:summary.png,detail:detail.png};
  }
  for(const id of IDS){await populated(id);pass(id+' all items once / real detail button / pixels / PNG');}
  const before=await populated('aobuta',true),after=await populated('aobuta');
  assert.deepEqual(after,before,'aobuta count state, rows, summary pixels and detail pixels identical');
  pass('aobuta before/after: count button state / summary PNG / detail PNG / rows identical');
  assert.deepEqual(errors,[]);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks}; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

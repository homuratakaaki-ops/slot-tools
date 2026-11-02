// node tests/godzieva2-v02.browser.mjs — §9-108 本番保存互換・実描画検収。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import vm from 'node:vm';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-godzieva2-v02-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-godzieva2-v02-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
let KEY='godzieva2-checker-v1',PAGE='/godzieva2-checker.html';const errors=[],measures=[];
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
  await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  let ready=false;
  for(let i=0;i<150;i++){
    ready=await run(`return location.pathname===${JSON.stringify(page)}&&document.readyState==='complete'&&!!d.querySelector(${JSON.stringify(page.includes('guide')?'main.container':'#main .sec')});`).catch(()=>false);
    if(ready)break;await pause(40);
  }
  assert.ok(ready,'page ready');assert.equal(await run('return innerWidth;'),width);
}
async function seed(S,width=360){await run(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(S))});`);await load(width);}
async function shot(name,width){const r=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));}
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
    if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')errors.push(m.params.args);
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
    if(m.method==='Fetch.requestPaused')send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
  };
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'https://*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__errors=[];window.__texts={};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    addEventListener('error',e=>window.__errors.push(e.message));addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));console.error(String(e.reason));});
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){(window.__texts[this.canvas.id]??=[]).push({text:String(text),x,y,w:this.measureText(String(text)).width,font:this.font});return original.call(this,text,x,y,...args);};
  `});
  await load();
  const box={window:{}};vm.runInNewContext(execFileSync('git',['show','2dc06d3:checker-data/godzieva2.js'],{cwd:root,encoding:'utf8'}),box);
  const previous=box.window.CheckerConfigs.godzieva2;
  let old=structuredClone(previous.defaults);
  old.gameLog=[345,678];old.games=23;old.img='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=';old.iconChoice='custom';old.futureRoot={keep:'yes'};
  for(const group of previous.mergeKeys){for(const key of Object.keys(old[group]))old[group][key]=7;old[group].future={keep:9};}
  old=JSON.parse(JSON.stringify(previous.normalizeState(old)));await seed(old);
  const unchanged=async()=>{const current=await state();for(const k of Object.keys(old))assert.deepEqual(current[k],old[k],k);};
  for(const key of ['first','at'])assert.equal(await run(`return d.querySelector('[data-c="counts.${key}"] .num').textContent;`),'7');
  await tab(1);
  for(const group of ['endScreen','edVoice'])for(const key of Object.keys(previous.defaults[group]))assert.equal(await run(`return d.querySelector('[data-c="${group}.${key}"] .num').textContent;`),'7');
  await tab(0);
  for(const group of ['suika','kitei'])for(const key of Object.keys(previous.defaults[group]).filter(k=>k.endsWith('D'))){
    const win=key.slice(0,-1)+'W';
    assert.equal(await run(`return d.querySelector('[data-bump-many="${group}.${key},${group}.${win}"]').closest('.crow').querySelector('.pct').textContent;`),'7/7 100%');
  }
  assert.ok(await run(`return d.getElementById('main').textContent.includes('1023G');`));
  for(const group of ['gRole','bonusRate'])assert.ok(Object.values(await run(`return CheckerConfigs.godzieva2.normalizeState(JSON.parse(localStorage.getItem('${KEY}'))).${group};`)).every(v=>v===0));
  const roles=['henyaku','zoushoku','bunretsu','boost','kasseika','gesshoku','gRensa','shouri','kakutei'];
  const rates=['cbNormal','cbHigh','cbSuper','blueNormal','blueHigh','redNormal','redHigh'];
  const counts=['blueSuper','redSuper','rainbowNormal','rainbowHigh','rainbowSuper'];
  for(const key of [...roles.map(k=>'gRole.'+k),...counts.map(k=>'bonusRate.'+k)]){
    await plus(key);const [g,k]=key.split('.');assert.equal((await state())[g][k],1);
    assert.equal(await run(`return d.querySelector('[data-c="${key}"] .num').textContent;`),'1');
    const saved=await state();await plus(key);await click('#undoBtn');assert.deepEqual(await state(),saved);await unchanged();
  }
  for(const key of rates){
    await click(`[data-bump-many="bonusRate.${key}D,bonusRate.${key}W"]`);
    await click(`[data-bump="bonusRate.${key}D"]`);
    const st=await state();assert.equal(st.bonusRate[key+'D'],2);assert.equal(st.bonusRate[key+'W'],1);
    assert.equal(await run(`return d.querySelector('[data-bump-many="bonusRate.${key}D,bonusRate.${key}W"]').closest('.crow').querySelector('.pct').textContent;`),'1/2 50%');await unchanged();
  }
  pass('9 mutations / 7 rate pairs / 5 guaranteed counts / undo / existing production values unchanged');
  const saved=await state();await load();assert.deepEqual(await state(),saved);
  await click('#modeBtn');
  for(const key of rates){
    await click(`[data-bump="bonusRate.${key}D"]`);
    assert.equal(await run(`return d.querySelector('[data-bump-many="bonusRate.${key}D,bonusRate.${key}W"]').nextElementSibling.disabled;`),true);
    await click(`[data-bump-many="bonusRate.${key}D,bonusRate.${key}W"]`);
    assert.equal((await state()).bonusRate[key+'D'],0);assert.equal((await state()).bonusRate[key+'W'],0);
  }
  for(const key of [...roles.map(k=>'gRole.'+k),...counts.map(k=>'bonusRate.'+k)]){await plus(key);const [g,k]=key.split('.');assert.equal((await state())[g][k],0);await plus(key);assert.equal((await state())[g][k],0);}
  await unchanged();await click('#modeBtn');
  pass('minus counts / wins / misses / lower bounds / reload / existing values preserved');
  for(const [label,S] of [['empty',{}],['filled',saved]]){
    await seed(S);
    for(let p=0;p<4;p++){await tab(p);await layout(360,label,p);await shot('godzieva2-'+label+'-tab'+p,360);}
    await tab(0);
    for(const title of ['G侵食役','ボーナス当選率']){
      await run(`const sec=[...d.querySelectorAll('.sec')].find(e=>e.querySelector('.sec-h')?.textContent===${JSON.stringify(title)});d.getElementById('main').scrollTop=sec.offsetTop-d.getElementById('main').offsetTop;`);
      await shot('godzieva2-'+label+'-'+(title==='G侵食役'?'gRole':'bonusRate'),360);
    }
  }
  const newItems=await run('return structuredClone(CheckerConfigs.godzieva2.defaults);');
  newItems.gRole=saved.gRole;newItems.bonusRate=saved.bonusRate;
  await seed(newItems);await tab(3);await pause(200);
  assert.ok((await run(`return d.getElementById('tpl').value;`)).includes('■G侵食役'));
  await canvas('cardCanvas','godzieva2-summary');
  await click('#detailBtn');await pause(300);const detail=await canvas('detailCanvas','godzieva2-detail');
  for(const text of ['G侵食役','ボーナス当選率','弱ﾁｪ/ﾍﾞﾙ3連 通常 1/2 50%','強ﾚｱ/ﾍﾞﾙ4他 超高 ×1'])assert.ok(detail.texts.some(t=>t.text.includes(text)),text);
  for(const t of detail.texts.filter(t=>t.text.startsWith('• ')))assert.ok(t.x+t.w<=1010,JSON.stringify(t));
  // 全項目を埋めた際はエンジン既定の40行上限と省略表記に任せる。
  const full=await run(`return structuredClone(CheckerConfigs.godzieva2.defaults);`);
  for(const group of ['counts','gRole','bonusRate','suika','kitei','endScreen','edVoice'])for(const k of Object.keys(full[group]))full[group][k]=1;
  await seed(full);await tab(3);await click('#detailBtn');await pause(300);
  const crowded=await canvas('detailCanvas','godzieva2-detail-all');assert.ok(crowded.texts.some(t=>/ほか.*項目/.test(t.text)));
  assert.deepEqual(await run('return window.__errors;'),[]);
  assert.deepEqual(await run('return Object.keys(localStorage).sort();'),['godzieva2-checker-v1']);
  pass('360x530 four tabs overflow 0 / card pixels and text / default truncation / no console errors');
  assert.deepEqual(errors,[]);
}catch(e){failures++;console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,failures,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks} passed / ${failures} failed; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

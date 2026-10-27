// node tests/seiya12.browser.mjs — headless Chrome / CDP。成果物は os.tmpdir() のみ。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'slot-seiya12-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-seiya12-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const KEY='seiya12-checker-v1',errors=[],measures=[];
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
  await load();
  assert.deepEqual(await run('return [...d.querySelectorAll("#nav button")].map(b=>b.textContent);'),['入力','示唆','参照','カード']);
  // 全行を実ボタンから入力。保存・取消・減算・リロードまでを確認する。
  let count=0;
  for(const p of [0,1]){
    await tab(p);const keys=await run('return [...d.querySelectorAll("[data-c]")].map(e=>e.dataset.c);');
    for(const key of keys){await plus(key);const [group,id]=key.split('.');assert.equal((await state())[group][id],1);count++;}
  }
  assert.equal(count,4+25);
  await tab(0);
  assert.equal(await run(`return d.querySelector('[data-total="cz"] .num').textContent;`),'3','通常CZ合計は種別不明を含む');
  await run(`d.querySelector('[data-total="cz"]').click();`);assert.equal((await state()).counts.czWho,1,'合計行は押しても加算しない');
  await tab(1);await plus('card.ankou');await click('#undoBtn');assert.equal((await state()).card.ankou,1);
  await click('#modeBtn');await plus('card.ankou');await plus('card.ankou');assert.equal((await state()).card.ankou,0);await click('#modeBtn');await plus('card.ankou');
  const saved=await state();await load();assert.deepEqual(await state(),saved);assert.deepEqual(await run('return window.__errors;'),[]);pass('all '+count+' count buttons / total row / save / undo / minus floor / reload');
  const full=await run('return structuredClone(CheckerConfigs.seiya12.defaults);');
  full.currentGames=6000;full.counts={czWho:18,czKage:9,czUnknown:3,at:17};
  for(const key of ['trophy','atEnd','erFirst','erSecond','card'])for(const id of Object.keys(full[key]))full[key][id]=1;
  await seed(full);await tab(0);
  assert.equal(await run(`return d.querySelector('[data-c="counts.czWho"] .pct').textContent;`),'18/27 67%');
  assert.equal(await run(`return d.querySelector('[data-total="cz"] .pct').textContent;`),'1/200.0');
  assert.equal(await run(`return d.querySelector('[data-c="counts.at"] .pct').textContent;`),'1/352.9');
  await tab(1);assert.equal(await run(`return d.querySelector('[data-c="atEnd.none"] .pct').textContent;`),'1/8 13%');
  assert.equal(await run(`return d.querySelectorAll('[data-c^="atEnd."] .pct').length;`),8,'不明行に割合を出さない');
  assert.equal(await run(`return d.querySelectorAll('[data-c^="trophy."] .pct,[data-c^="erFirst."] .pct,[data-c^="erSecond."] .pct,[data-c^="card."] .pct').length;`),0);
  pass('rendered 1/x, CZ type split and AT end-screen percentages');
  for(const width of [360,390,412])for(const [label,S] of [['empty',{}],['filled',full]]){
    await seed(S,width);
    for(let p=0;p<4;p++){
      await tab(p);await layout(width,label,p);
      await shot(['input','suggest','reference','card'][p]+'-'+width+'-'+label,width);
    }
    assert.deepEqual(await run('return window.__errors;'),[]);pass(width+'px '+label+' all 4 tabs, overflow 0 / buttons >=44px');
  }
  await seed(full);await tab(3);await click('#detailBtn');await pause(250);
  const detail=await canvas('detailCanvas','detail-card'),summary=await canvas('cardCanvas','summary-card');
  for(const title of ['カウント系','トロフィー','AT終了画面','ER 1人目','ER 2人目','星座'])assert.ok(detail.texts.some(t=>t.text===title),title);
  for(const s of ['通常CZ合計 ×30 1/200.0','通常CZ 種別不明 ×3','魔鈴シャイナ ×1 (13%)','不明 ×1'])assert.ok(detail.texts.some(t=>t.text.includes(s)),s);
  for(const s of ['CZ合計','1/200.0','確定演出','計12回','トロフィー','計6回','フーアーユー','影ノ襲来','#聖闘士星矢 #設定判別'])assert.ok(summary.texts.some(t=>t.text.includes(s)),s);
  assert.equal(await run('return w.__checkerApp._detailRows().length;')<=40,true);
  // サマリーの行が列幅（左490px・右450px）を越えない（§9-85）。
  for(const t of summary.texts.filter(t=>t.y>=760&&t.y<=936&&(t.x===70||t.x===560)))assert.ok(t.w<=(t.x===70?490:450)+1,JSON.stringify(t));
  assert.deepEqual(await run('return window.__errors;'),[]);pass('detail PNG / summary PNG / all sections / pixels');
  for(const width of [360,390,412]){await load(width,'/seiya12-guide.html');assert.equal(await run('return d.documentElement.scrollWidth-d.documentElement.clientWidth;'),0);}
  pass('guide 3 widths');assert.deepEqual(errors,[]);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks}; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

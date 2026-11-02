// node tests/vivy-nana-test.browser.mjs — §9-108 本番保存キー分離・実描画検収。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import vm from 'node:vm';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-vivy-nana-test-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-vivy-nana-test-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
let KEY='vivy-checker-v1-test',PAGE='/vivy-test-checker.html';const errors=[],measures=[];
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
  const box={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'checker-data/vivy.js'),'utf8'),box);
  const old=JSON.parse(JSON.stringify(box.window.CheckerConfigs.vivy.defaults));
  old.gameLog=[345,678];old.games=23;old.img='data:image/png;base64,existing';old.iconChoice='upload';old.futureRoot={keep:'yes'};
  for(const group of ['counts','atEnd','trophy','payout','ending']){for(const key of Object.keys(old[group]))old[group][key]=7;old[group].future={keep:9};}
  const productionString=JSON.stringify(old,null,2);
  await run(`localStorage.setItem('vivy-checker-v1',${JSON.stringify(productionString)});localStorage.removeItem(${JSON.stringify(KEY)});`);
  await load();assert.equal(await state(),null);
  const unchanged=async()=>assert.equal(await run(`return localStorage.getItem('vivy-checker-v1');`),productionString);
  await unchanged();
  assert.equal(await run(`return d.querySelector('[data-c="counts.at"] .num').textContent;`),'0');

  const hints=await run('return [...d.querySelectorAll(".sec")].slice(2,7).map(s=>({count:s.querySelectorAll(".hint summary").length,label:s.querySelector("summary")?.textContent}));');
  assert.equal(hints.length,5);for(const h of hints)assert.deepEqual(h,{count:1,label:'説明を見る'});
  const rates=[...['c1','c2','c3','c4','c5','c6'].map(k=>['cycle',k]),...['weak','chance'].map(k=>['access',k]),...['k1','k2'].map(k=>['cont',k])];
  const counts=[...['pt','pt555'].flatMap(g=>[111,222,333,444,555].map(p=>g+'.p'+p)),'access.weakEx','access.chanceEx'];
  for(const [g,k] of rates){
    const win='[data-bump-many="'+g+'.'+k+'D,'+g+'.'+k+'W"]',miss='[data-bump="'+g+'.'+k+'D"]';
    await click(win);await click(miss);
    const st=await state();assert.equal(st[g][k+'D'],2);assert.equal(st[g][k+'W'],1);
    assert.equal(await run('return d.querySelector('+JSON.stringify(win)+').closest(".crow").querySelector(".pct").textContent;'),'1/2 50%');
    await click(win);await click('#undoBtn');assert.deepEqual(await state(),st);await unchanged();
  }
  for(const key of counts){
    await plus(key);const [g,k]=key.split('.');assert.equal((await state())[g][k],1);
    assert.equal(await run('return d.querySelector('+JSON.stringify('[data-c="'+key+'"] .num')+').textContent;'),'1');
    // 別の操作の取消で既存のEX回数や前回555後ptが消えない。
    const saved=await state();await plus('counts.at');await click('#undoBtn');assert.deepEqual(await state(),saved);await unchanged();
  }
  pass('10 rate pairs / 12 counts / undo / production bytes unchanged');
  const saved=await state();await load();assert.deepEqual(await state(),saved);
  await click('#modeBtn');
  for(const key of counts){await plus(key);const [g,k]=key.split('.');assert.equal((await state())[g][k],0);await plus(key);assert.equal((await state())[g][k],0);}
  for(const [g,k] of rates){
    const win='[data-bump-many="'+g+'.'+k+'D,'+g+'.'+k+'W"]';
    await click('[data-bump="'+g+'.'+k+'D"]');
    assert.equal(await run('return d.querySelector('+JSON.stringify(win)+').nextElementSibling.disabled;'),true);
    const equal=await state();await run('d.querySelector('+JSON.stringify(win)+').nextElementSibling.click();');assert.deepEqual(await state(),equal);
    await click(win);assert.equal((await state())[g][k+'D'],0);assert.equal((await state())[g][k+'W'],0);
  }
  await unchanged();await click('#modeBtn');
  pass('minus counts / wins / misses / lower bounds / reload / production isolation');
  for(const [label,S] of [['empty',{}],['filled',saved]]){
    await seed(S);
    for(let p=0;p<4;p++){await tab(p);await layout(360,label,p);await shot('vivy-'+label+'-tab'+p,360);}
    await tab(0);
    await run('d.querySelectorAll(".sec .hint details").forEach(e=>e.open=true);');await layout(360,label+'-hints-open',0);
    for(const title of ['規定周期','規定ポイント(2周期以降)','規定ポイント(前回555pt選択)','レア役からのアクセスチャンス(EX)','アクセスチャンスの継続回数']){
      await run(`const sec=[...d.querySelectorAll('.sec')].find(e=>e.querySelector('.sec-h')?.childNodes[0]?.textContent===${JSON.stringify(title)});d.getElementById('main').scrollTop=sec.offsetTop-d.getElementById('main').offsetTop;`);
      await shot('vivy-'+label+'-'+title.replaceAll(/[^a-zA-Z0-9一-龯]/g,''),360);
    }
  }
  await tab(3);await pause(200);
  assert.ok((await run(`return d.getElementById('tpl').value;`)).includes('■規定周期'));
  await canvas('cardCanvas','vivy-summary');
  await click('#detailBtn');await pause(300);const detail=await canvas('detailCanvas','vivy-detail');
  for(const text of ['規定周期','規定pt','前回555後pt','AC(EX)','AC継続','①周期 1/2 50%','弱チェリー→EX ×1','1回目継続 1/2 50%'])assert.ok(detail.texts.some(t=>t.text.includes(text)),text);
  for(const t of detail.texts.filter(t=>t.text.startsWith('• ')))assert.ok(t.x+t.w<=1010,JSON.stringify(t));
  // 全項目を埋めた際はエンジン既定の40行上限と省略表記に任せる。
  const full=await run(`return structuredClone(CheckerConfigs['vivy-test'].defaults);`);
  for(const group of ['counts','cycle','pt','pt555','access','cont','atEnd','trophy','payout','ending'])for(const k of Object.keys(full[group]))full[group][k]=1;
  await seed(full);await tab(3);await click('#detailBtn');await pause(300);
  const crowded=await canvas('detailCanvas','vivy-detail-all');assert.ok(crowded.texts.some(t=>/ほか.*項目/.test(t.text)));
  assert.deepEqual(await run('return window.__errors;'),[]);await unchanged();
  assert.deepEqual(await run('return Object.keys(localStorage).sort();'),['vivy-checker-v1','vivy-checker-v1-test']);
  pass('360x530 four tabs overflow 0 / card pixels and text / default truncation / no console errors');
  assert.deepEqual(errors,[]);
}catch(e){failures++;console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,failures,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks} passed / ${failures} failed; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

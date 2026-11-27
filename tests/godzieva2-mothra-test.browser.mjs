// モスラ初期G・終了ボイス：実ボタン、旧本番データ保持、390/360px実描画。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import vm from 'node:vm';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-godzieva2-mothra-test-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-godzieva2-mothra-test-profile-'));
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
async function shot(name,width){await pause(100);const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));}
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
    Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.__copied=text;}}});
    window.__errors=[];window.__texts={};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    addEventListener('error',e=>window.__errors.push(e.message));addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));console.error(String(e.reason));});
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){(window.__texts[this.canvas.id]??=[]).push({text:String(text),x,y,w:this.measureText(String(text)).width,font:this.font});return original.call(this,text,x,y,...args);};
  `});

  await load();
  const box={window:{}};
  vm.runInNewContext(execFileSync('git',['-c','safe.directory='+root,'show','c49d590:checker-data/godzieva2.js'],{cwd:root,encoding:'utf8'}),box);
  const baseline=box.window.CheckerConfigs.godzieva2,old=JSON.parse(JSON.stringify(baseline.defaults));
  let value=2;for(const group of baseline.mergeKeys){for(const key of Object.keys(old[group]))old[group][key]=value++;old[group].unknown={keep:[1,'x']};}
  old.endScreen.mothra=2;old.endScreen.kaworu=1;for(const key of Object.keys(baseline.defaults.endVoice))old.endVoice[key]=1;
  for(const group of baseline.mergeKeys)for(const key of Object.keys(old[group]))if(key.endsWith('D'))old[group][key]+=100;
  old.iconChoice='nana';old.gameLog=[123,456];old.games=579;old.unknown={nested:[7,false]};
  await seed(old);await tab(3);await click('#cpBtn');
  const zeroBlock='■ゴジエヴァアタック モスラ初期G\n44G(4以上)▶︎ 0回\n55G(5以上)▶︎ 0回\n66G(6濃厚)▶︎ 0回\n\n';
  const loadedCopy=await run('return window.__copied;');assert.ok(loadedCopy.includes(zeroBlock));
  assert.equal(loadedCopy.replace(zeroBlock,''),baseline.template({S:old,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'}));
  await tab(1);
  for(const group of ['endScreen','endVoice','edVoice'])for(const key of Object.keys(baseline.defaults[group])){
    assert.equal(await run(`return d.querySelector('[data-c="${group}.${key}"] .num').textContent;`),String(old[group][key]));
  }
  for(const key of ['mothraG.g44','mothraG.g55','mothraG.g66','endVoice.rei','endVoice.gendo'])assert.equal(await run(`return d.querySelector('[data-c="${key}"] .num').textContent;`),'0');
  // 保存を伴う実操作後にも旧値が残ることを全キー比較（加算はUndo）。
  await tab(1);await plus('mothraG.g44');await click('#undoBtn');
  const migrated=await state();assert.deepEqual(migrated.mothraG,{g44:0,g55:0,g66:0});
  assert.equal(migrated.endVoice.rei,0);assert.equal(migrated.endVoice.gendo,0);
  const stripped=structuredClone(migrated);delete stripped.mothraG;delete stripped.endVoice.rei;delete stripped.endVoice.gendo;
  assert.deepEqual(stripped,old);await load();await tab(1);assert.deepEqual(await state(),migrated);
  pass('c49d590 production old values / unknown keys / new zero defaults / reload');
  const clean=JSON.parse(JSON.stringify(baseline.defaults));await seed(clean);
  await tab(1);
  const keys=['mothraG.g44','mothraG.g55','mothraG.g66','endVoice.shinji','endVoice.ritsuko','endVoice.mari','endVoice.asuka','endVoice.rei','endVoice.misato','endVoice.gendo'];
  for(const key of keys){
    const [g,k]=key.split('.');await plus(key);assert.equal((await state())[g][k],1);
    assert.equal(await run(`return d.querySelector('[data-c="${key}"] .num').textContent;`),'1');
    const saved=await state();await plus(key);assert.equal((await state())[g][k],2);await click('#undoBtn');assert.deepEqual(await state(),saved);
    await click('#modeBtn');await plus(key);assert.equal((await state())[g][k],0);await click('#undoBtn');assert.deepEqual(await state(),saved);await click('#modeBtn');
  }
  pass('10 rows add / undo / minus / undo preserves other rows');
  const saved=await state();await load();await tab(1);
  for(const key of keys){const [g,k]=key.split('.');assert.equal((await state())[g][k],1);assert.equal(await run(`return d.querySelector('[data-c="${key}"] .num').textContent;`),'1');}

  await plus('endScreen.mothra');assert.deepEqual((await state()).mothraG,saved.mothraG);await click('#undoBtn');assert.deepEqual(await state(),saved);
  pass('reload values / endScreen mothra independence');
  for(const width of [390,360]){
    await load(width);await tab(1);await layout(width,'mothra-voices',1);
    const supplement=await run(`const e=d.querySelector('[data-c="mothraG.g44"]').closest('.sec').querySelector('.sec-h .sub');const range=d.createRange();range.selectNodeContents(e);const r=e.getBoundingClientRect(),rects=[...range.getClientRects()];return {text:e.textContent,lines:rects.length,left:r.left,right:r.right,width:r.width,height:r.height,font:getComputedStyle(e).fontSize};`);
    measures.push({width,supplement});assert.equal(supplement.text,'終了画面のモスラとは別');assert.equal(supplement.lines,1);assert.ok(supplement.left>=0&&supplement.right<=width);
    for(const [name,selector] of [['mothra','[data-c="mothraG.g44"]'],['voices','[data-c="endVoice.shinji"]'],['voices-last','[data-c="endVoice.gendo"]']]){
      await run(`d.querySelector(${JSON.stringify(selector)}).closest('.sec').scrollIntoView({block:'start'});`);
      if(name==='voices-last')await run(`d.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'end'});`);
      await shot('suggest-'+width+'-'+name,width);
    }
    const hot=await run(`return ['mothraG.g44','mothraG.g55','mothraG.g66','endScreen.reiBg'].map(k=>{const el=d.querySelector('[data-c="'+k+'"] .mn');return {hot:el.classList.contains('hot'),color:getComputedStyle(el).color};});`);
    assert.ok(hot.every(r=>r.hot&&r.color===hot[3].color));
    await tab(3);await pause(250);const summary=await canvas('cardCanvas','summary-'+width);
    assert.ok(summary.texts.some(t=>t.text==='確定演出 モスラ66G(6濃厚) ×1'));
    assert.ok(summary.texts.some(t=>t.text==='計3回'));
    const current=await state(),block=`■ゴジエヴァアタック モスラ初期G\n44G(4以上)▶︎ ${current.mothraG.g44}回\n55G(5以上)▶︎ ${current.mothraG.g55}回\n66G(6濃厚)▶︎ ${current.mothraG.g66}回\n\n`;
    const baseText=baseline.template({S:current,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
    await click('#cpBtn');const copied=await run('return window.__copied;');assert.ok(copied.includes(block));assert.equal(copied.replace(block,''),baseText);
    const engineBox={window:{},localStorage:{getItem:()=>null}};vm.runInNewContext(fs.readFileSync(path.join(root,'checker-engine.js'),'utf8'),engineBox);
    const plain=engineBox.window.CheckerEngine.createApp(baseline).plainText;
    await click('#cpPlainBtn');assert.equal(await run('return window.__copied;'),plain(copied));
    assert.equal(plain(copied).replace(plain(block),''),plain(baseText));
    await click('#detailBtn');await pause(300);await layout(width,'detail',3);await shot('detail-page-'+width,width);
    const detail=await canvas('detailCanvas','detail-'+width);
    for(const text of ['モスラ初期G','44G(4以上)','55G(5以上)','66G(6濃厚)','シンジ','リツコ','マリ','アスカ','レイ','ミサト','ゲンドウ'])assert.ok(detail.texts.some(t=>t.text.includes(text)),text);
    for(const t of detail.texts.filter(t=>t.text.startsWith('• ')))assert.ok(t.x+t.w<=1010&&t.y<detail.height,JSON.stringify(t));
    assert.deepEqual(await run('return window.__errors;'),[]);
    await load(width,'/godzieva2-guide.html');
    const guide=await run(`return {width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...d.querySelectorAll('main,main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<0||r.right>innerWidth);}).map(e=>e.tagName)};`);
    assert.equal(guide.scroll,width);assert.deepEqual(guide.bad,[]);measures.push({guide});
    await run(`[...d.querySelectorAll('h3')].find(e=>e.textContent.includes('モスラの初期G数')).scrollIntoView();`);await shot('guide-'+width,width);
    pass(width+'x530 suggest / detail overflow 0 / hot colors / card pixels and text / PNG');
  }
  assert.deepEqual(await run('return Object.keys(localStorage).sort();'),['godzieva2-checker-v1']);
  assert.equal((await fetch(origin+'/godzieva2-test-checker.html')).status,404);
  assert.equal((await fetch(origin+'/checker-data/godzieva2-test.js')).status,404);
  assert.deepEqual(errors,[]);
}catch(e){failures++;console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,failures,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks} passed / ${failures} failed; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

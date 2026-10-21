// Run explicitly: CHROME_PATH=<chrome executable> node tests/tenten-1021.browser.mjs
// 転生王女：リールロック記録の実表示と実操作。指示書 fix/tenten-1021（シオン 2026-10-21）
// 360/390/412px ではみ出しなし・タップ対象44px以上・増減と1/x表示・保存→再読み込み・カードPNG。
// PAGE=tenten-test-checker.html を渡すと検収用テスト版（保存キー tenten-checker-v1-test）を同じ手順で確かめる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-tenten-1021-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-tenten-1021-profile-'));
const PAGE=process.env.PAGE||'tenten-checker.html';
const TEST=PAGE==='tenten-test-checker.html';
const CONFIG=TEST?'tenten-test':'tenten';
const KEY=TEST?'tenten-checker-v1-test':'tenten-checker-v1';
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
const lockRow=k=>`[data-c="lock.${k}"]`;
const rowState=()=>frame(`return ['lock1','lock2'].map(k=>{const el=d.querySelector('[data-c="lock.'+k+'"]');return {num:el.querySelector('.num').textContent,mn:el.querySelector('.mn').textContent,nm:el.querySelector('.nm').textContent};});`);
async function setGames(g){await frame(`const i=d.getElementById('gIn');i.value=${JSON.stringify(String(g))};i.dispatchEvent(new w.Event('change',{bubbles:true}));`);await pause(40);}
// 見えている要素がページ幅からはみ出していないこと、リールロックの行（行全体がタップ対象）が44px以上
async function layout(name){
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&w.getComputedStyle(e).visibility!=='hidden');const inScroller=e=>{for(let p=e.parentElement;p;p=p.parentElement){const ox=w.getComputedStyle(p).overflowX;if(ox==='auto'||ox==='scroll'||ox==='hidden')return true;}return false;};
    const rows=[...d.querySelectorAll('[data-c^="lock."]')].map(e=>{const r=e.getBoundingClientRect();const nm=e.querySelector('.nm'),mn=e.querySelector('.mn');return {c:e.dataset.c,left:r.left,right:r.right,height:r.height,nmOver:nm.scrollWidth>nm.clientWidth,mnOver:mn.scrollWidth>mn.clientWidth};});
    return {width,docWidth:d.documentElement.scrollWidth,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return (r.left<-.5||r.right>width+.5)&&!inScroller(e);}).map(e=>({tag:e.tagName,cls:String(e.className),text:e.textContent.slice(0,40)})),rows};`);
  fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
  assert.deepEqual(r.overflow,[],name+' はみ出し');
  assert.ok(r.docWidth<=r.width,name+' 横スクロール');
  assert.equal(r.rows.length,2,name+' リールロックの行が2つない');
  for(const x of r.rows){
    assert.ok(x.height>=44,name+' '+x.c+' が44px未満: '+x.height);
    assert.ok(x.left>=0&&x.right<=r.width,name+' '+x.c+' が画面外');
    assert.ok(!x.nmOver&&!x.mnOver,name+' '+x.c+' の文字が行からはみ出している');
  }
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
    // 旧データ（lock が無い）を入れて開くと0で出る
    await evaluate('localStorage.clear();');
    await load(width);
    await frame(`w.localStorage.setItem(${JSON.stringify(KEY)},JSON.stringify({games:0,counts:{at:2}}));`);
    await load(width);
    let s=await rowState();
    assert.deepEqual(s.map(x=>[x.nm,x.num,x.mn]),[['リールロック1段階目','0','設1:1/1091.4⇔設6:1/1017.2'],['リールロック2段階目','0','設1:1/1359.1⇔設6:1/939.1']]);
    assert.equal(await frame(`return d.querySelector('[data-c="counts.at"] .num').textContent;`),'2','旧データのAT初当りが消えた');
    // 通常ゲーム数3000G。1段階目3回・2段階目2回を行タップで
    await setGames(3000);
    for(let i=0;i<3;i++){await click(lockRow('lock1'));await pause(20);}
    for(let i=0;i<2;i++){await click(lockRow('lock2')+' .plus');await pause(20);}
    s=await rowState();
    assert.deepEqual(s.map(x=>[x.num,x.mn]),[['3','設1:1/1091.4⇔設6:1/1017.2 / 現在 1/1000.0'],['2','設1:1/1359.1⇔設6:1/939.1 / 現在 1/1500.0']]);
    // 減算モードで2段階目を1回減らす → 取消で戻る
    await click('#modeBtn');await click(lockRow('lock2'));await click('#modeBtn');await pause(40);
    s=await rowState();assert.equal(s[1].num,'1');assert.equal(s[1].mn,'設1:1/1359.1⇔設6:1/939.1 / 現在 1/3000.0');
    await click('#undoBtn');await pause(40);
    s=await rowState();assert.equal(s[1].num,'2','取消で減算が戻らない');
    assert.deepEqual(JSON.parse(await raw()).lock,{lock1:3,lock2:2});
    await layout('input-'+width);
    await shot('tenten-1021-input-'+width,width,'[data-c="lock.lock1"]');
    // 保存→再読み込み
    await load(width);
    s=await rowState();
    assert.deepEqual(s.map(x=>[x.num,x.mn]),[['3','設1:1/1091.4⇔設6:1/1017.2 / 現在 1/1000.0'],['2','設1:1/1359.1⇔設6:1/939.1 / 現在 1/1500.0']],'再読み込みで消えた');
    await layout('reload-'+width);
    // カード：下段サマリーの6行目。テンプレ。詳細カード
    await tab(2);await pause(250);
    const card=await canvas('cardCanvas');
    const row=card.text.find(x=>x.text==='ロック 1段:3・2段:2');
    assert.ok(row,'カードにロックの行がない '+JSON.stringify(card.text.map(x=>x.text)));
    assert.equal(row.x,70);assert.equal(row.y,932);
    const foot=card.text.find(x=>x.text==='slot-tools.jp');
    assert.ok(row.y<foot.y,'ロックの行がフッターより下');
    assert.ok(card.text.every(x=>x.left>=0&&x.right<=1080),'カードの文字が幅からはみ出している');
    const tpl=await frame(`return d.getElementById('tpl').value;`);
    assert.ok(tpl.includes('■リールロック\n1段階目▶3回 1/1000.0\n2段階目▶2回 1/1500.0\n'),tpl);
    await click('#detailBtn');await pause(250);
    const det=await canvas('detailCanvas');
    const dt=det.text.map(x=>x.text);
    assert.ok(dt.some(x=>x.includes('リールロック')),'詳細カードに見出しがない '+JSON.stringify(dt));
    assert.ok(dt.some(x=>x.includes('1段階目 3回 1/1000.0'))&&dt.some(x=>x.includes('2段階目 2回 1/1500.0')),'詳細カードの行 '+JSON.stringify(dt));
    assert.ok(det.text.every(x=>x.left>=0&&x.right<=1080),'詳細カードの文字が幅からはみ出している');
    if(width===390){saveCanvas('tenten-1021-card',card);saveCanvas('tenten-1021-card-detail',det);await shot('tenten-1021-card-tab-'+width,width,'#cardCanvas');}
    pass('lock rows, 1/x, minus/undo, reload, card summary row, template, detail '+width);
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

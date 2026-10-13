// Run explicitly: node tests/kanokari-estimate.browser.mjs
// かのかり 設定推測タブ：実クリックで切替・EDボイスの両キー加算と取消・再読込・旧データ・
// 360/390/412px のはみ出しとタップ領域を確かめる。縦の増減は本件の直前の版（23109d6）と並べて測る。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-kanokari-est-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-kanokari-est-profile-'));
const KEY='kanokari-checker-v1';
const errors=[];const measures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
// /__main/ 以下は本件の直前の main（23109d6）の版をそのまま返す（縦の増減の比較用）
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(url==='/harness'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');}
  if(url.startsWith('/__main/')){
    try{const body=execFileSync('git',['show','23109d6:'+url.slice(8)],{cwd:root});res.setHeader('Content-Type',types[path.extname(url)]||'text/plain');return res.end(body);}
    catch{res.writeHead(404);return res.end();}
  }
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser,ws;const pending=new Map();let seq=0;
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
const state=()=>frame(`return JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}));`);
const click=sel=>frame(`const el=d.querySelector(${JSON.stringify(sel)});if(!el)throw Error('Missing '+${JSON.stringify(sel)});el.click();`);
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(60);}
async function load(page='/kanokari-checker.html',width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin)}+${JSON.stringify(page)};})`);
  for(let i=0;i<100;i++){if(await frame('return !!(d.querySelector("#gIn")&&w.CheckerConfigs?.kanokari);').catch(()=>false))break;await pause(40);}
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function seed(obj,page,width){await evaluate(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(obj))});`);await load(page,width);}
async function clear(page,width){await evaluate(`localStorage.removeItem(${JSON.stringify(KEY)});`);await load(page,width);}
// はみ出し：main の横スクロールと、画面外にはみ出す要素（engine の見出しジャンプは横スクロールする帯なので、帯の中身は除く）
const overflow=()=>frame(`const m=d.getElementById('main');const W=w.innerWidth;
  const bad=[...m.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+0.5||r.left<-0.5)&&!e.closest('details:not([open])')&&!(e.parentElement&&e.parentElement.closest('.jump-nav'));}).map(e=>(e.className||e.tagName)+":"+(e.textContent||"").trim().slice(0,12));
  return {scroll:m.scrollWidth-m.clientWidth,bad:bad.slice(0,5),count:bad.length};`);
const height=()=>frame('return d.getElementById("main").scrollHeight;');

try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1200,1000','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.on('error',e=>errors.push(e.message));
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
    if(m.method==='Fetch.requestPaused'){
      // 広告・計測・Webフォントは空で返す（ローカル検証の範囲外）
      await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
    }
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'https://*'},{urlPattern:'http://www.*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__errors=[];window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;window.addEventListener('error',e=>window.__errors.push(e.message));`});
  await send('Page.navigate',{url:origin+'/harness'});await pause(100);

  // ---- 1. 切替と EDボイスの両キー加算・取消・減算 ----
  await clear('/kanokari-checker.html',390);
  await tab(1);
  assert.deepEqual(await frame('return [...d.querySelectorAll(".kk-chip.on")].map(e=>e.textContent);'),['不明','それ以外・不明']);
  await click('[data-c="voice.v05"] .plus');
  let S=await state();assert.equal(S.voice.v05,1);assert.equal(S.edStrong.v05,0,'それ以外・不明では voice だけ');
  await click('[data-action="kkEdRole"][data-v="strong"]');
  S=await state();assert.equal(S.edRole,'strong');
  await click('[data-bump-many="voice.v05,edStrong.v05"] .plus-many');
  S=await state();assert.equal(S.voice.v05,2);assert.equal(S.edStrong.v05,1,'強チャンス目：両キーに加算');
  await click('[data-bump-many="voice.v09,edStrong.v09"]');   // 行のどこを押しても同じ
  S=await state();assert.equal(S.voice.v09,1);assert.equal(S.edStrong.v09,1);
  await click('#undoBtn');
  S=await state();assert.equal(S.voice.v09,0);assert.equal(S.edStrong.v09,0,'取消で両方戻る');
  assert.equal(S.voice.v05,2);assert.equal(S.edStrong.v05,1);
  await click('#modeBtn');
  await click('[data-bump-many="voice.v05,edStrong.v05"] .plus-many');
  S=await state();assert.equal(S.voice.v05,1);assert.equal(S.edStrong.v05,0,'減算も両方');
  await click('#modeBtn');
  await click('[data-bump-many="voice.v05,edStrong.v05"]');
  // 終了画面：カスタムの値に関係なく従来どおり記録できる
  await click('[data-c="screens.none"] .plus');
  await click('[data-action="kkEndCustom"][data-v="custom"]');
  await click('[data-c="screens.bbq"] .plus');
  await click('[data-action="kkEndCustom"][data-v="none"]');
  S=await state();assert.equal(S.endCustom,'none');assert.equal(S.screens.none,1);assert.equal(S.screens.bbq,1);
  const chipH=await frame('return [...d.querySelectorAll(".kk-chip")].map(e=>e.getBoundingClientRect().height);');
  assert.ok(chipH.length===5&&chipH.every(h=>h>=44),'切替のタップ領域44px以上: '+chipH);
  const plusH=await frame('return [...d.querySelectorAll(".plus-many")].map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height];});');
  assert.ok(plusH.length===11&&plusH.every(([x,y])=>x>=44&&y>=44),'＋ボタン44px以上');
  // 再読込で切替と回数が残る
  await load('/kanokari-checker.html',390);await tab(1);
  assert.deepEqual(await frame('return [...d.querySelectorAll(".kk-chip.on")].map(e=>e.textContent);'),['なし','強チャンス目']);
  await tab(2);
  const est=await frame('return d.getElementById("main").innerText;');
  assert.match(est,/終了画面（カスタムなし） 2回/);assert.match(est,/EDボイス（強チャンス目） 1回/);
  assert.match(est,/成立役が強チャンス目以外・不明の1回は割合に不採用/);
  assert.match(est,/高設定\(4〜6\)/);
  await click('.kk-bd>summary');
  assert.match(await frame('return d.getElementById("main").innerText;'),/終了画面（カスタムなし）（2回）/);

  // ---- 2. 旧データ（新キーなし）が読めて推測が動く ----
  await seed({games:800,counts:{cz:3,first:2},screens:{none:4,red:1},chara:{p01:2,p10:1},scen:{s1:1},over:{o246:1},voice:{v01:2},img:null,iconChoice:'default'},'/kanokari-checker.html',390);
  await tab(2);
  const legacy=await frame('return d.getElementById("main").innerText;');
  assert.match(legacy,/残る候補：設定2・6/);
  assert.match(legacy,/終了画面：カスタム不明のため不採用（記録5回）/);
  await tab(1);
  assert.deepEqual(await frame('return [...d.querySelectorAll(".kk-chip.on")].map(e=>e.textContent);'),['不明','それ以外・不明']);

  // ---- 3. 幅ごとのはみ出しと縦の増減（23109d6 と比較） ----
  const full={games:800,counts:{cz:3,first:2},screens:{none:4,bbq:1,beach:1,red:1,purple:1,silver:1,gold:1},
    chara:Object.fromEntries(Array.from({length:15},(_,i)=>['p'+String(i+1).padStart(2,'0'),1])),
    scen:{s1:1,s2:1,s3:1,s4:1,repeat:1},cm:{cm44:1,cm55:1,cm66:1},over:{o246:1,o456:1,o666:1,o394:1},
    voice:Object.fromEntries(Array.from({length:11},(_,i)=>['v'+String(i+1).padStart(2,'0'),1])),img:null,iconChoice:'default'};
  for(const width of [360,390,412]){
    for(const [label,data] of [['empty',{}],['full',full]]){
      await seed(data,'/__main/kanokari-checker.html',width);await tab(1);
      const before=await height();
      await seed(data,'/kanokari-checker.html',width);await tab(1);
      const after=await height();
      const ov1=await overflow();
      for(const [i,sel] of [[0,'[data-action="kkEndCustom"]'],[1,'[data-action="kkEdRole"]']]){
        await frame('d.querySelector('+JSON.stringify(sel)+').closest(".sec").scrollIntoView({block:"start"});');await pause(50);
        const sh=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
        fs.writeFileSync(path.join(artifacts,`shisa-${width}-${label}-${i}.png`),Buffer.from(sh.data,'base64'));
      }
      for(const role of ['strong','other']){await click(`[data-action="kkEdRole"][data-v="${role}"]`);const o=await overflow();assert.equal(o.scroll,0);assert.equal(o.count,0,JSON.stringify(o));}
      await tab(2);
      const ov2=await overflow();
      await click('.kk-bd>summary').catch(()=>{});
      const ov3=await overflow();
      const estH=await height();
      const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
      fs.writeFileSync(path.join(artifacts,`estimate-${width}-${label}.png`),Buffer.from(shot.data,'base64'));
      const m={width,label,shisaBefore:before,shisaAfter:after,shisaDelta:after-before,estimate:estH,overflow:[ov1,ov2,ov3]};
      measures.push(m);console.log('MEASURE '+JSON.stringify(m));
      for(const o of [ov1,ov2,ov3]){assert.equal(o.scroll,0,'横スクロール0');assert.equal(o.count,0,'はみ出し0 '+JSON.stringify(o));}
      assert.equal(await frame('return d.querySelectorAll("#nav button").length;'),4);
    }
  }
  // ---- 4. ガイド：振り分け表が横にはみ出さない ----
  for(const width of [360,390,412]){
    await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.src=${JSON.stringify(origin+'/kanokari-guide.html')};})`);
    const g=await frame(`const W=w.innerWidth;return {W,scroll:d.documentElement.scrollWidth-d.documentElement.clientWidth,tables:d.querySelectorAll('table.rate').length,
      bad:[...d.querySelectorAll('table.rate')].filter(t=>t.getBoundingClientRect().right>d.documentElement.clientWidth+0.5).length};`);
    assert.equal(g.W,width);assert.equal(g.scroll,0,'ガイドの横スクロール0');assert.equal(g.bad,0);assert.equal(g.tables,12);
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);
  assert.deepEqual(errors,[]);
  console.log('PASS kanokari estimate browser: toggles, dual-key ED add/undo/minus, reload, legacy data, 3 widths × 2 states, guide tables 3 widths');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({measures,errors},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

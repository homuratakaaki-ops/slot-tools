// Run explicitly: node tests/garei-1014.browser.mjs
// 喰霊-零-Re 10/14 解析更新のブラウザ検証（headless Chrome / CDP）。
// 新6行（ステージチェンジ4行・強チャンス目CZの当選/ハズレ）の加算・取消・減算・再読込、旧データの実読み込み、
// テスト版の保存キーが本番と別であること、360/390/412px のはみ出しとタップ領域、示唆・入力タブと詳細カードのPNG。
// 既定は本番ページ。検収中は PAGE=/garei-zero-re-test-checker.html KEY=garei-zero-re-checker-v1-test CFG=garei_zero_re-test でテスト版を検証する。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PAGE=process.env.PAGE||'/garei-zero-re-checker.html';
const KEY=process.env.KEY||'garei-zero-re-checker-v1';
const CFG=process.env.CFG||'garei_zero_re';
const PROD_KEY='garei-zero-re-checker-v1';
const BASE='d4ba7cf';  // 本件直前の main
const STAGE=['hakuei','ranguren','kaguraYomi','kaguraYomiKuda'];

const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-garei-1014-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-garei-1014-profile-'));
const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
// /__main/ 以下は本件直前の main の版を返す（縦の増減の突き合わせ用）
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(url==='/harness'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');}
  if(url.startsWith('/__main/')){
    try{const body=execFileSync('git',['show',BASE+':'+url.slice(8)],{cwd:root});res.setHeader('Content-Type',types[path.extname(url)]||'text/plain');return res.end(body);}
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
const getState=(key=KEY)=>frame(`return JSON.parse(w.localStorage.getItem(${JSON.stringify(key)}));`);
const click=sel=>frame(`const el=d.querySelector(${JSON.stringify(sel)});if(!el)throw Error('Missing '+${JSON.stringify(sel)});el.click();`);
const plus=key=>click(`[data-c="${key}"] .plus`);
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(60);}
async function load(page=PAGE,width=390,height=740,cfg=CFG){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin)}+${JSON.stringify(page)};})`);
  for(let i=0;i<100;i++){if(await frame(`return !!(d.querySelector("#main .sec")&&w.CheckerConfigs?.[${JSON.stringify(cfg)}]);`).catch(()=>false))break;await pause(40);}
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function seed(obj,page,width,key=KEY,cfg=CFG){await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(obj))});`);await load(page,width,740,cfg);}
async function clear(page=PAGE,width=390){await evaluate(`localStorage.removeItem(${JSON.stringify(KEY)});`);await load(page,width);}
// .jump-nav は横スクロールする見出しへの移動ボタン列（engine 側で overflow-x:auto）。列そのものの幅だけを見る。
const overflow=()=>frame(`const m=d.getElementById('main');const W=w.innerWidth;
  const bad=[...m.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+0.5||r.left<-0.5)&&!e.closest('details:not([open])')&&!e.closest('.jump-nav');}).map(e=>(e.className||e.tagName)+":"+(e.textContent||"").trim().slice(0,12));
  const nav=m.querySelector('.jump-nav');if(nav&&nav.getBoundingClientRect().right>W+0.5)bad.push('jump-nav');
  return {scroll:m.scrollWidth-m.clientWidth,bad:bad.slice(0,5),count:bad.length,height:m.scrollHeight};`);
const shot=async(name,width)=>{const s=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});fs.writeFileSync(path.join(artifacts,name),Buffer.from(s.data,'base64'));};

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
  await evaluate(`localStorage.removeItem(${JSON.stringify(PROD_KEY)});`);

  // a. ステージチェンジ4行の加算・取消・減算（0止まり）・再読込
  await clear();await tab(1);
  assert.equal((await frame('return d.querySelector("#main .sec-h").textContent;')),'ステージチェンジ演出計0回');
  for(const k of STAGE){
    const key='stageChange.'+k;
    await plus(key);await plus(key);let S=await getState();assert.equal(S.stageChange[k],2,key);
    await click('#undoBtn');S=await getState();assert.equal(S.stageChange[k],1,key+' undo');
    await click('#modeBtn');await plus(key);await plus(key);await click('#modeBtn');
    S=await getState();assert.equal(S.stageChange[k],0,key+' minus floor 0');
    await plus(key);
  }
  // b. 強チャンス目CZ：当選2・ハズレ3 → 当選2/到達5、取消でハズレ1回分戻る
  await tab(0);
  const win='[data-bump-many="rates.strongChancer,rates.strongChancew"]',lose='[data-bump="rates.strongChancer"]';
  await click(win);await click(win);for(let i=0;i<3;i++)await click(lose);
  let S=await getState();assert.equal(S.rates.strongChancew,2);assert.equal(S.rates.strongChancer,5);
  await click('#undoBtn');S=await getState();assert.equal(S.rates.strongChancer,4);assert.equal(S.rates.strongChancew,2);
  await click(lose);
  assert.ok((await frame('return [...d.querySelectorAll(".cycle-row")].find(e=>e.textContent.includes("強チャンス目")).querySelector(".pct").textContent;')).includes('2/5 40%'));
  await load();S=await getState();
  assert.deepEqual(S.stageChange,{hakuei:1,ranguren:1,kaguraYomi:1,kaguraYomiKuda:1});assert.equal(S.rates.strongChancer,5);assert.equal(S.rates.strongChancew,2);
  if(KEY!==PROD_KEY)assert.equal(await getState(PROD_KEY),null,'テスト版の操作は本番の保存キーに書かない');
  // 設定推測：管狐1回で設定6のみ
  await tab(2);
  const bars=await frame('return [...d.querySelectorAll(".bayes-bar em")].map(e=>e.textContent);');
  assert.equal(bars.length,6);assert.ok(bars.slice(0,5).every(t=>/^0(\.0+)?%$/.test(t)),JSON.stringify(bars));
  assert.ok((await frame('return d.getElementById("main").textContent;')).includes('ステージチェンジ 神楽と黄泉と管狐×1'));
  console.log('PASS a/b: ステージチェンジ4行・強チャンス目CZの加算・取消・減算・再読込、本番キー不変、設定推測で設定6のみ');

  // c. 旧データ（本件直前の形）の実読み込み
  const legacy={startGames:100,currentGames:2100,counts:{watermelon:25,weakCherry:20,big:5,reg:4,cz:8,art:3},rates:{weakCzr:10,weakCzw:1,strongCzr:4,strongCzw:1},bbScreens:{phone:3,childhood:1,casual:0,swim:0}};
  await seed(legacy,PAGE,390);await tab(1);
  assert.equal(await frame('return d.querySelectorAll("[data-c^=\\"stageChange.\\"]").length;'),4);
  await plus('stageChange.hakuei');S=await getState();
  assert.deepEqual(S.stageChange,{hakuei:1,ranguren:0,kaguraYomi:0,kaguraYomiKuda:0});
  assert.equal(S.rates.strongChancer,0);assert.equal(S.rates.strongCzr,4);assert.equal(S.counts.watermelon,25);assert.equal(S.bbScreens.childhood,1);
  await click('#undoBtn');S=await getState();assert.equal(S.stageChange.hakuei,0);
  console.log('PASS c: 旧データの実読み込みで新行が出て、新キーが0で入り旧キーはそのまま');

  // d. 3幅のはみ出し・タップ領域・縦の増減、PNG
  const full={startGames:0,currentGames:9999,counts:{watermelon:999,weakCherry:999,big:999,reg:999,cz:999,art:999},
    rates:{weakCzr:999,weakCzw:999,strongCzr:999,strongCzw:999,strongChancer:999,strongChancew:999},
    stageChange:Object.fromEntries(STAGE.map(k=>[k,999])),bbScreens:{phone:999,childhood:999,casual:999,swim:999}};
  const measures=[];
  for(const width of [360,390,412]){
    for(const [label,data] of [['empty',{}],['full',full]]){
      const heights={};
      for(const [ver,page,key,cfg] of [['old','/__main/garei-zero-re-checker.html',PROD_KEY,'garei_zero_re'],['new',PAGE,KEY,CFG]]){
        await seed(data,page,width,key,cfg);
        for(const p of [0,1]){
          await tab(p);await pause(50);const ov=await overflow();heights[ver+p]=ov.height;
          if(ver==='old')continue;
          assert.equal(ov.scroll,0,`横スクロール0 ${width} ${label} tab${p}`);assert.equal(ov.count,0,'はみ出し0 '+JSON.stringify(ov));
          if(p===1){
            const taps=await frame('return [...d.querySelectorAll("[data-c^=\\"stageChange.\\"]")].map(e=>{const r=e.getBoundingClientRect(),b=e.querySelector(".plus").getBoundingClientRect();return [Math.round(r.height),Math.round(b.width),Math.round(b.height)];});');
            assert.equal(await frame('return [...d.querySelectorAll(".jump-nav button")][0]?.textContent;'),'ステージチェンジ演出');
            assert.equal(taps.length,4);assert.ok(taps.every(t=>t.every(v=>v>=44)),'44px以上 '+JSON.stringify(taps));
            await shot(`suggest-${width}-${label}.png`,width);
          }else{
            const btns=await frame('const row=[...d.querySelectorAll(".cycle-row")].find(e=>e.textContent.includes("強チャンス目"));return [...row.querySelectorAll(".cycle-btn")].map(b=>Math.round(b.getBoundingClientRect().height));');
            assert.deepEqual(btns,[44,44]);
            await frame('[...d.querySelectorAll(".cycle-row")].find(e=>e.textContent.includes("強チャンス目")).scrollIntoView({block:"center"});');await pause(50);
            await shot(`counts-${width}-${label}.png`,width);
          }
        }
      }
      const m={width,label,counts:heights.new0-heights.old0,suggest:heights.new1-heights.old1};measures.push(m);console.log('MEASURE '+JSON.stringify(m));
    }
  }
  // 詳細カード（390px・記録あり）
  const card={startGames:0,currentGames:3200,counts:{watermelon:42,weakCherry:35,big:9,reg:8,cz:13,art:6},
    rates:{weakCzr:30,weakCzw:3,strongCzr:6,strongCzw:2,strongChancer:20,strongChancew:3},
    stageChange:{hakuei:2,ranguren:1,kaguraYomi:1,kaguraYomiKuda:0},bbScreens:{phone:6,childhood:2,casual:0,swim:0},over:{o222:1}};
  await seed(card,PAGE,390);await tab(4);await pause(80);
  await click('#detailBtn');await pause(200);
  const png=await frame('return d.getElementById("detailCanvas").toDataURL("image/png");');
  fs.writeFileSync(path.join(artifacts,'detail-card.png'),Buffer.from(png.split(',')[1],'base64'));
  const cardPng=await frame('return d.getElementById("cardCanvas").toDataURL("image/png");');
  fs.writeFileSync(path.join(artifacts,'card.png'),Buffer.from(cardPng.split(',')[1],'base64'));
  const tpl=await frame('return d.getElementById("tpl").value;');
  assert.ok(tpl.includes('強チャンス目CZ▶3/20 15%')&&tpl.includes('\n■ステージチェンジ演出\n白叡▶2回\n乱紅蓮▶1回\n神楽と黄泉▶1回\n'));
  for(const width of [360,390,412]){
    await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.src=${JSON.stringify(origin+'/garei-zero-re-guide.html')};})`);
    const g=await frame('return {W:w.innerWidth,scroll:d.documentElement.scrollWidth-d.documentElement.clientWidth};');
    assert.equal(g.W,width);assert.equal(g.scroll,0,'ガイドの横スクロール0');
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({measures},null,2));
  console.log(`PASS d: 360/390/412px × 空/満杯で入力・示唆タブのはみ出し0、新行のタップ44px以上、テンプレ・詳細カード、ガイド3幅 (${PAGE})`);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

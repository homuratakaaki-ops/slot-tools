// Run explicitly: node tests/ricorico-1014.browser.mjs
// リコリコ 10/14 解析更新：弱リコリス目の変換高確（weakLyco）の加算・減算・取消・再読込、
// 旧データ（weakLyco なし）での画面とテンプレが本件直前の版（08ec446）と新規1行以外一致すること、
// 360/390/412px のはみ出しとタップ領域を実クリックで確かめる。
// PAGE=/ricorico-test-checker.html KEY=ricorico-checker-v1-test CFG=ricorico-test でテスト版も検証できる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-ricorico-1014-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-ricorico-1014-profile-'));
const PAGE=process.env.PAGE||'/ricorico-checker.html';
const KEY=process.env.KEY||'ricorico-checker-v1';
const CFG=process.env.CFG||'ricorico';
const BASE='08ec446';
const errors=[];const measures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
// /__main/ 以下は本件の直前の main（08ec446）の版をそのまま返す（旧版との突き合わせ用）
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
const state=()=>frame(`return JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}));`);
const click=sel=>frame(`const el=d.querySelector(${JSON.stringify(sel)});if(!el)throw Error('Missing '+${JSON.stringify(sel)});el.click();`);
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(60);}
async function load(page=PAGE,width=390,height=740,cfg=CFG){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin)}+${JSON.stringify(page)};})`);
  for(let i=0;i<100;i++){if(await frame(`return !!(d.querySelector("#main .sec")&&w.CheckerConfigs?.[${JSON.stringify(cfg)}]);`).catch(()=>false))break;await pause(40);}
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function seed(obj,page,width,key=KEY,cfg=CFG){await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(obj))});`);await load(page,width,740,cfg);}
async function clear(page=PAGE,width=390){await evaluate(`localStorage.removeItem(${JSON.stringify(KEY)});`);await load(page,width);}
const overflow=()=>frame(`const m=d.getElementById('main');const W=w.innerWidth;
  const bad=[...m.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+0.5||r.left<-0.5)&&!e.closest('details:not([open])')&&!(e.parentElement&&e.parentElement.closest('.jump-nav'));}).map(e=>(e.className||e.tagName)+":"+(e.textContent||"").trim().slice(0,12));
  return {scroll:m.scrollWidth-m.clientWidth,bad:bad.slice(0,5),count:bad.length};`);
const tplText=async()=>{await tab(2);await pause(80);return frame('return d.getElementById("tpl").value;');};
const WEAK_WIN='[data-bump-many="weakLyco.d,weakLyco.n"]';
const WEAK_MISS='[data-label="弱ﾘｺﾘｽ目変換高確 失敗"]';

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

  // ---- 1. 旧データ（weakLyco なし）：旧版と新規1行以外一致 ----
  const legacy={gameSrc:'myslo',gamesMyslo:1200,gamesMysloStart:200,gamesMysloTotal:1500,gamesMysloTotalStart:300,
    counts:{stamp:1,cz:4,at:2,direct:1,child:1,bell:11,bellOther:3,mysteryV:1},prologue:{ep1:1,ep3:1},rush:{ep2:2,ep4:1},wep:{ep1:1},
    trophy:{bronze:1,gold:1},rates:{z100r:3,z100w:1,z400r:2,z400w:1},conv:{weakcd:4,weakcn:1,strongcd:2,strongcn:2},
    top:{d:2,n:1},g150:{d:3,n:2},art:{appear:1},atEnd:{def:2,takinaMiss:1,hawaii:1},lamp:{blue:1,red:1},img:null,iconChoice:null};
  await seed(legacy,'/__main/ricorico-checker.html',390,'ricorico-checker-v1','ricorico');
  const oldTpl=await tplText();
  await seed(legacy,PAGE,390);
  const newTpl=await tplText();
  const added=newTpl.split('\n').filter(l=>!oldTpl.split('\n').includes(l));
  assert.deepEqual(added,['■弱ﾘｺﾘｽ目変換高確▶︎ 0/0']);
  assert.equal(newTpl.replace('■弱ﾘｺﾘｽ目変換高確▶︎ 0/0\n',''),oldTpl,'テンプレ：新規1行以外バイト一致');
  assert.ok(newTpl.includes('■150G変換高確▶︎ 2/3\n■弱ﾘｺﾘｽ目変換高確▶︎ 0/0\n\n■変換からのCZ当選'),'150Gの次の行');
  // 移行はメモリ上だけ（保存は次の操作時）。最初の操作で weakLyco が {d:0,n:0} から始まり、既存値は保たれる。
  await tab(0);await click(WEAK_MISS);
  let S=await state();assert.deepEqual(S.weakLyco,{d:1,n:0});
  for(const k of Object.keys(legacy.counts))assert.equal(S.counts[k],legacy.counts[k]);
  assert.deepEqual(S.g150,{d:3,n:2});

  // ---- 2. 加算・減算・取消・再読込 ----
  await clear(PAGE,390);
  await click(WEAK_WIN);await click(WEAK_WIN);await click(WEAK_MISS);
  S=await state();assert.deepEqual(S.weakLyco,{d:3,n:2});
  assert.match(await frame('return d.getElementById("main").innerText;'),/弱リコリス目の変換高確\s*2\/3/);
  await click('#undoBtn');S=await state();assert.deepEqual(S.weakLyco,{d:2,n:2},'取消で失敗が戻る');
  await click('#modeBtn');
  assert.equal(await frame(`return d.querySelector(${JSON.stringify(WEAK_MISS)}).disabled;`),true,'減らせる失敗が無いとき失敗は押せない');
  await click(WEAK_WIN);S=await state();assert.deepEqual(S.weakLyco,{d:1,n:1},'減算：成功は分母と分子');
  await click('#modeBtn');
  await click(WEAK_MISS);S=await state();assert.deepEqual(S.weakLyco,{d:2,n:1});
  await load(PAGE,390);S=await state();assert.deepEqual(S.weakLyco,{d:2,n:1},'再読込で保持');
  assert.ok((await tplText()).includes('■弱ﾘｺﾘｽ目変換高確▶︎ 1/2\n'));
  // 詳細カードの項目（150Gの直後）
  const det=await frame(`const c=w.CheckerConfigs[${JSON.stringify(CFG)}];const S=JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}));return c.card.detail({S,nanaCreditText:()=>''}).map(s=>s.title+':'+s.items.map(i=>i.text||'').join('|'));`);
  const i150=det.findIndex(x=>x.startsWith('150G到達時の変換高確'));
  assert.equal(det[i150+1],'弱リコリス目の変換高確:弱ﾘｺﾘｽ目 変換高確移行 1/2');
  // 400g 行の目安と注記
  await tab(0);
  const main=await frame('return d.getElementById("main").innerText;');
  // 目安（⇔あり）は行の下に1行（.row-sub）。400g・150G・弱リコリス目の3行
  assert.deepEqual(await frame('return [...d.querySelectorAll(".cycle-row .row-sub")].map(e=>e.closest(".crow").querySelector(".ct b").textContent+"|"+e.textContent);'),
    ['400g|設1:10.9%⇔設6:25.4%','150G変換高確|設1:50.0%⇔設6:62.5%','弱ﾘｺﾘｽ目変換高確|設1:38.3%⇔設6:44.9%']);
  assert.ok(!main.includes('他設定は調査中'));

  // ---- 3. 幅ごとのはみ出しとタップ領域 ----
  const full=JSON.parse(JSON.stringify(legacy));full.weakLyco={d:1234,n:567};full.g150={d:1234,n:567};
  full.rates={z0r:99,z0w:9,z100r:99,z100w:9,z250r:99,z250w:9,z400r:999,z400w:99,z600r:99,z600w:9,z750r:99,z750w:9};
  for(const width of [360,390,412]){
    for(const [label,data] of [['empty',{}],['full',full]]){
      // 360px では本件前（08ec446）から main の横スクロールが 1px ある。旧版を超えないことを見る。
      await seed(data,'/__main/ricorico-checker.html',width,'ricorico-checker-v1','ricorico');
      const base=await overflow();
      const baseRows=await frame('return [...d.querySelectorAll(".cycle-row")].map(e=>Math.round(e.getBoundingClientRect().right));');
      await seed(data,PAGE,width);
      const rows=await frame('return [...d.querySelectorAll(".cycle-row")].filter(e=>!e.querySelector("[data-bump-many^=\\"weakLyco\\"]")).map(e=>Math.round(e.getBoundingClientRect().right));');
      // 説明を行下へ移した150G行は縮む。既存行の件数と旧版を越えない幅を守る。
      assert.equal(rows.length,baseRows.length);
      assert.ok(rows.every((right,i)=>right<=baseRows[i]),'行の右端が旧版を越えない');
      const ov=await overflow();
      const taps=await frame(`return [...d.querySelectorAll('${WEAK_WIN},${WEAK_MISS},[data-bump-many="rates.z400r,rates.z400w"],[data-label="400g ハズレ"]')].map(e=>{const r=e.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height)];});`);
      const sub=await frame(`return [...d.querySelectorAll('.cycle-row .row-sub')].map(e=>{const r=e.getBoundingClientRect();const lh=parseFloat(getComputedStyle(e).lineHeight);return [e.textContent,Math.round(r.height/lh),Math.round(r.right)<=Math.round(e.closest('.crow').getBoundingClientRect().right)];});`);
      // 目安は1行（指示の「2行以内」より強い条件）で、行の中に収まる
      assert.equal(sub.length,3);assert.ok(sub.every(([,lines,inside])=>lines===1&&inside),'目安1行 '+JSON.stringify(sub));
      await frame(`d.querySelector(${JSON.stringify(WEAK_WIN)}).closest(".sec").scrollIntoView({block:"center"});`);await pause(50);
      const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
      fs.writeFileSync(path.join(artifacts,`input-${width}-${label}.png`),Buffer.from(shot.data,'base64'));
      await frame(`d.querySelector('[data-label="400g ハズレ"]').closest(".crow").scrollIntoView({block:"center"});`);await pause(50);
      const shot2=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
      fs.writeFileSync(path.join(artifacts,`zones-${width}-${label}.png`),Buffer.from(shot2.data,'base64'));
      await tab(2);await pause(150);
      const ovCard=await overflow();
      const m={width,label,overflow:[ov,ovCard],taps,sub};measures.push(m);console.log('MEASURE '+JSON.stringify(m));
      assert.ok(ov.scroll<=base.scroll,'横スクロールが旧版以下 '+ov.scroll+' / '+base.scroll);assert.equal(base.count,0);
      assert.equal(ovCard.scroll,0,'カードの横スクロール0');
      for(const o of [ov,ovCard])assert.equal(o.count,0,'はみ出し0 '+JSON.stringify(o));
      assert.equal(taps.length,4);assert.ok(taps.every(([x,y])=>x>=44&&y>=44),'タップ領域44px以上 '+JSON.stringify(taps));
    }
  }
  // ---- 4. ガイド：横にはみ出さない ----
  for(const width of [360,390,412]){
    await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.src=${JSON.stringify(origin+'/ricorico-guide.html')};})`);
    const g=await frame('return {W:w.innerWidth,scroll:d.documentElement.scrollWidth-d.documentElement.clientWidth};');
    assert.equal(g.W,width);assert.equal(g.scroll,0,'ガイドの横スクロール0');
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);
  assert.deepEqual(errors,[]);
  console.log(`PASS ricorico 1014 browser (${PAGE}): legacy template = ${BASE} + 1 line, weakLyco add/miss/undo/minus/reload, detail order, 3 widths × 2 states, taps ≥44px, guide 3 widths`);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({measures,errors},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

// Run explicitly: CHROME_PATH=<chrome executable> node tests/mogumogu-1021.browser.mjs
// モグモグ：巻物とCZ内訳。実ボタン操作・保存互換・カード描画。
// 360/390/412px ではみ出しなし・新規行44px以上・回数のみ・保存→再読み込み・カードPNG。
// PAGE=mogumogu-test-checker.html を渡すと検収用テスト版（保存キー mogumogu-checker-v1-test）を同じ手順で確かめる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'slot-mogumogu-1021-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-mogumogu-1021-profile-'));
const PAGE=process.env.PAGE||'mogumogu-checker.html';
const TEST=PAGE==='mogumogu-test-checker.html';
const CONFIG=TEST?'mogumogu-test':'mogumogu';
const KEY=TEST?'mogumogu-checker-v1-test':'mogumogu-checker-v1';
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
// 見えている要素がページ幅からはみ出していないこと、新規行が44px以上
async function layout(name){
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&w.getComputedStyle(e).visibility!=='hidden');const inScroller=e=>{for(let p=e.parentElement;p;p=p.parentElement){const ox=w.getComputedStyle(p).overflowX;if(ox==='auto'||ox==='scroll'||ox==='hidden')return true;}return false;};
    const rows=[...d.querySelectorAll('[data-c^="scroll."],[data-c^="czType."]')].map(e=>{const r=e.getBoundingClientRect();const nm=e.querySelector('.nm'),mn=e.querySelector('.mn');return {c:e.dataset.c,left:r.left,right:r.right,height:r.height,nmOver:nm.scrollWidth>nm.clientWidth,mnOver:mn.scrollWidth>mn.clientWidth};});
    return {width,docWidth:d.documentElement.scrollWidth,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return (r.left<-.5||r.right>width+.5)&&!inScroller(e);}).map(e=>({tag:e.tagName,cls:String(e.className),text:e.textContent.slice(0,40)})),rows};`);
  fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
  assert.deepEqual(r.overflow,[],name+' はみ出し');
  assert.ok(r.docWidth<=r.width,name+' 横スクロール');
  assert.ok([2,5].includes(r.rows.length),name+' new row count');
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
    await evaluate('localStorage.clear();');await load(width);
    await frame(`w.localStorage.setItem(${JSON.stringify(KEY)},JSON.stringify({games:3000,counts:{cz:7,at:2},future:{keep:1}}));`);await load(width);
    assert.equal(await frame(`return d.querySelector('[data-c="czType.taisen"] .num').textContent;`),'0');
    for(let i=0;i<3;i++)await click('[data-c="czType.taisen"]');
    for(let i=0;i<2;i++)await click('[data-c="czType.mogura"] .plus');
    assert.equal(JSON.parse(await raw()).counts.cz,7);
    const subs=await frame(`return [...d.querySelectorAll('[data-c^="czType."] .mn')].map(e=>e.textContent);`);
    assert.deepEqual(subs,['設1:1/354⇔設6:1/324','設1:1/3778⇔設6:1/2507']);
    await click('#modeBtn');await click('[data-c="czType.mogura"]');await click('#modeBtn');
    assert.equal(JSON.parse(await raw()).czType.mogura,1);await click('#undoBtn');
    assert.equal(JSON.parse(await raw()).czType.mogura,2);
    await layout('input-'+width);await shot('mogumogu-1021-input-'+width,width,'[data-c="czType.taisen"]');
    // 初当りの説明は1つの折りたたみ（AT直撃の説明の後ろにCZ内訳の段落。ネネ指摘 10/21）
    const fold=await frame(`const sec=d.querySelector('[data-c="czType.taisen"]').closest('.sec');const ds=sec.querySelectorAll('details.hint-fold');if(ds.length===1)ds[0].open=true;const b=ds[0]&&ds[0].querySelector('.hint-body');return {hints:sec.querySelectorAll('.hint').length,folds:ds.length,ws:b&&w.getComputedStyle(b).whiteSpace,body:b&&b.textContent,docWidth:d.documentElement.scrollWidth};`);
    assert.equal(fold.hints,1);assert.equal(fold.folds,1);assert.equal(fold.ws,'pre-line');
    assert.match(fold.body,/直撃ではありません。\nCZの種別が分かったときだけ内訳を押します。[^]*1\/3778です。$/);
    assert.ok(fold.docWidth<=width);
    await shot('mogumogu-1021-hint-open-'+width,width,'[data-c="counts.direct"]');
    await frame(`d.querySelector('[data-c="czType.taisen"]').closest('.sec').querySelector('details.hint-fold').open=false;`);
    await tab(1);
    for(const [key,n] of [['blue',3],['yellow',1],['green',1],['red',2],['rainbow',1]])for(let i=0;i<n;i++)await click('[data-c="scroll.'+key+'"]');
    await layout('shisa-'+width);await shot('mogumogu-1021-shisa-'+width,width,'[data-c="scroll.blue"]');
    assert.equal(await frame(`return [...d.querySelectorAll('[data-c^="scroll."]')].some(e=>e.textContent.includes("%"));`),false);
    const saved=JSON.parse(await raw());assert.deepEqual(saved.scroll,{blue:3,yellow:1,green:1,red:2,rainbow:1});assert.deepEqual(saved.czType,{taisen:3,mogura:2});
    await load(width);await tab(1);
    assert.deepEqual(await frame(`return [...d.querySelectorAll('[data-c^="scroll."] .num')].map(e=>e.textContent);`),['3','1','1','2','1']);
    await tab(0);assert.deepEqual(await frame(`return [...d.querySelectorAll('[data-c^="czType."] .num')].map(e=>e.textContent);`),['3','2']);
    assert.deepEqual(JSON.parse(await raw()).future,{keep:1});
    await tab(2);await pause(300);const card=await canvas('cardCanvas');
    assert.ok(card.text.some(x=>x.text==='確定 虹巻物(6濃厚) ×1'));
    const foot=card.text.find(x=>x.text==='slot-tools.jp');assert.equal(foot.y,976);
    assert.ok(card.text.every(x=>x.left>=0&&x.right<=1080));
    {const sc=card.text.find(x=>x.text.startsWith('巻物 '));assert.ok(sc&&sc.text.includes('虹×1'),'card bottom scroll row');assert.ok(sc.y<foot.y,'scroll row above footer');}
    const tpl=await frame('return d.getElementById("tpl").value;');assert.ok(tpl.includes('CZ内訳 モグモグ大戦▶3回'));assert.ok(tpl.includes('虹巻物(6濃厚)▶1回'));
    await click('#detailBtn');await pause(300);const det=await canvas('detailCanvas');
    for(const label of ['エンディング中の巻物','モグモグ大戦','モグラ叩き','赤巻物','虹巻物'])assert.ok(det.text.some(x=>x.text.includes(label)),label);
    assert.ok(det.text.every(x=>x.left>=0&&x.right<=1080));
    // 画素による裏取り：描画された各新項目の基線付近に背景以外の画素がある。
    const pixels=await frame(`const cv=d.getElementById('detailCanvas'),ctx=cv.getContext('2d');return w.__texts.detailCanvas.filter(t=>['モグモグ大戦','モグラ叩き','赤巻物','虹巻物'].some(v=>t.text.includes(v))).map(t=>{const p=ctx.getImageData(Math.max(0,Math.floor(t.left)),Math.floor(t.y-20),Math.min(400,Math.ceil(t.width)),25).data;let bright=0;for(let i=0;i<p.length;i+=4)if(p[i]>160||p[i+1]>160||p[i+2]>160)bright++;return bright;});`);
    assert.equal(pixels.length,4);assert.ok(pixels.every(n=>n>10));
    if(width===390){saveCanvas('mogumogu-1021-card',card);saveCanvas('mogumogu-1021-card-detail',det);}
    // 指示書2(f)の候補2行をテスト中だけ追加し、実エンジンの描画で衝突を証明する。
    if(width===390){
      await tab(0);await frame(`const c=w.CheckerConfigs[${JSON.stringify(CONFIG)}],base=c.card.bottom;c.card.bottom=ctx=>{const b=base(ctx);b.columns[1].items.push({text:'CZ内訳 大戦3回・叩き2回',value:5,active:true});return b;};`);
      await tab(2);await pause(300);const candidate=await canvas('cardCanvas');saveCanvas('mogumogu-1021-card-rejected-overlap',candidate);
      const last=candidate.text.find(x=>x.text.includes('CZ内訳 大戦'));assert.equal(last.y,980);assert.ok(last.y>foot.y);pass('candidate bottom row overlaps footer; omitted per spec',{lastY:last.y,footerY:foot.y});
    }
    assert.deepEqual(await frame('return w.__errors;'),[]);
    pass('CZ/scroll taps, minus/undo, reload, layout, template, cards and pixels '+width);
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

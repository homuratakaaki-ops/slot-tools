// Run explicitly: CHROME_PATH=<chrome executable> node tests/mhsunbreak-pct-mode.browser.mjs
// シナリオ参考％の表示モード（自動／設定1基準％／候補のみ）の実表示と実操作。指示書 docs/specs/mhsunbreak-pct-mode-v01.md §4
// 3ボタンの切替・再読み込み後の保持・取消で戻らないこと・360/390/412px ではみ出しなし・シナリオカードの注記が追随。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-pct-mode-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-pct-mode-profile-'));
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
const KEY='mhsunbreak-checker-v1',PREFS=KEY+'-prefs';
const frame=code=>evaluate(`(async()=>{const w=document.getElementById('frame').contentWindow;const d=w.document;${code}})()`);
const raw=()=>frame(`return w.localStorage.getItem(${JSON.stringify(KEY)});`);
const prefs=()=>frame(`return JSON.parse(w.localStorage.getItem(${JSON.stringify(PREFS)})||'{}');`);
const click=selector=>frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+'/mhsunbreak-checker.html')};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return w.CheckerConfigs?.mhsunbreak&&d.querySelector('#nav')?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function canvas(id){
  return frame(`const cv=d.getElementById(${JSON.stringify(id)});return {width:cv.width,height:cv.height,text:w.__texts[cv.id]||[],data:cv.toDataURL()};`);
}
function saveCanvas(name,c){fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(c.data.split(',')[1],'base64'));}
// 現在の状況の「シナリオ参考％の表示」が見える位置まで動かして撮る
async function shot(name,width){
  await frame(`d.querySelector('.pct-mode-title').scrollIntoView({block:'start'});w.scrollBy(0,-60);`);await pause(80);
  const s=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));
}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name);}
const MODES=[['auto','自動'],['p1','設定1基準％'],['candidates','候補のみ']];
const WARN='⚠ 設定1否定の記録があります。表示中の％は設定1の場合の参考値で、実際の設定の確率ではありません。';
const NOTE={
  auto:'％は設定1の選択率に基づく参考値。設定1否定が出ると表示しません',
  p1:'％は設定1の場合の参考値。設定1否定時も実際の設定の確率ではありません',
  candidates:'候補のみ：参考％は非表示。候補の絞り込み条件は同じです'
};
const pressed=()=>frame(`return [...d.querySelectorAll('[data-action="scenarioPctMode"]')].map(b=>[b.dataset.value,b.textContent,b.getAttribute('aria-pressed')]);`);
const expectPressed=async mode=>assert.deepEqual(await pressed(),MODES.map(([v,l])=>[v,l,String(v===mode)]),'選択中のボタンが '+mode+' でない');
const screenText=()=>frame(`const sc=d.querySelector('.now-box .at-sc'),nx=d.querySelector('.now-box .at-next'),wn=d.querySelector('.pct-mode-warning');return {sc:sc?sc.textContent:'',next:nx?nx.textContent:'',warn:wn?wn.textContent:'',warnTop:wn?wn.getBoundingClientRect().top:null,scTop:sc?sc.getBoundingClientRect().top:null};`);
// 見えている要素がページ幅からはみ出していないこと（横スクロールの箱の中は除く）、モードボタンが44px以上
async function layout(name){
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&w.getComputedStyle(e).visibility!=='hidden');const inScroller=e=>{for(let p=e.parentElement;p;p=p.parentElement){const ox=w.getComputedStyle(p).overflowX;if(ox==='auto'||ox==='scroll'||ox==='hidden')return true;}return false;};
    const btn=[...d.querySelectorAll('[data-action="scenarioPctMode"]')].map(b=>{const r=b.getBoundingClientRect();return {text:b.textContent,left:r.left,right:r.right,height:r.height,scrollWidth:b.scrollWidth,clientWidth:b.clientWidth};});
    return {width,docWidth:d.documentElement.scrollWidth,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return (r.left<-.5||r.right>width+.5)&&!inScroller(e);}).map(e=>({tag:e.tagName,cls:String(e.className),text:e.textContent.slice(0,40)})),btn};`);
  fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
  assert.deepEqual(r.overflow,[],name+' はみ出し');
  assert.ok(r.docWidth<=r.width,name+' 横スクロール');
  for(const b of r.btn){
    assert.ok(b.height>=44,name+' '+b.text+' が44px未満: '+b.height);
    assert.ok(b.left>=0&&b.right<=r.width,name+' '+b.text+' が画面外');
    assert.ok(b.scrollWidth<=b.clientWidth,name+' '+b.text+' の文字がボタンからはみ出している');
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
    await evaluate('localStorage.clear();');await load(width);await tab(2);
    // 既定は「自動」。prefs に scenarioPctMode はまだ無い
    await expectPressed('auto');
    assert.equal('scenarioPctMode' in await prefs(),false);
    // BZ1回目 ③ 失敗を実際に押して記録する（候補9つ・％が出る列）
    await click('[data-action="bzPick"][data-q="t3"]');await click('[data-action="bzPickPos"][data-pos=""]');await click('[data-action="bzQuest"][data-r="miss"]');
    let t=await screenText();
    assert.match(t.sc,/^候補（％は設定1の場合）：A 31%/,'否定なし・自動で％が出ていない');
    assert.match(t.next,/^次のBZ（2回目）：LOW /);
    // 設定1否定（トロフィー銅）を記録に入れて読み込み直す（ローカルの検証用プロファイルのみ）
    const plain=await raw();
    const denied=JSON.parse(plain);denied.trophy.bronze=1;
    await frame(`w.localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(denied))});`);
    await load(width);await tab(2);
    const before=await raw();
    t=await screenText();
    assert.equal(t.sc,'候補：A・B・C・D・E・F・G・H・I','自動で否定ありなのに％が出ている');
    assert.match(t.next,/^次のBZ（2回目）：レベル /);
    assert.equal(t.warn,'');
    await layout('auto-'+width);await shot('pct-mode-auto-'+width,width);
    // 設定1基準％：％が戻り、警告が％の上に出る
    await click('[data-action="scenarioPctMode"][data-value="p1"]');await pause(40);
    await expectPressed('p1');
    t=await screenText();
    assert.match(t.sc,/^候補（％は設定1の場合）：A 31%/,'設定1基準％で％が出ていない');
    assert.match(t.next,/^次のBZ（2回目）：LOW .*（％は設定1の場合）/);
    assert.equal(t.warn,WARN);
    assert.ok(t.warnTop<t.scTop,'警告文が％の上にない');
    assert.equal(await raw(),before,'p1 で記録が変わった');
    assert.equal((await prefs()).scenarioPctMode,'p1');
    await layout('p1-'+width);await shot('pct-mode-p1-warning-'+width,width);
    // 候補のみ
    await click('[data-action="scenarioPctMode"][data-value="candidates"]');await pause(40);
    await expectPressed('candidates');
    t=await screenText();
    assert.equal(t.sc,'候補：A・B・C・D・E・F・G・H・I');
    assert.match(t.next,/^次のBZ（2回目）：レベル /);
    assert.equal(t.warn,'');
    assert.equal(await raw(),before,'candidates で記録が変わった');
    await layout('candidates-'+width);await shot('pct-mode-candidates-'+width,width);
    // 再読み込みしても候補のみのまま。取消でモードは戻らない（取消の履歴に積まない）
    await load(width);await tab(2);
    await expectPressed('candidates');
    await click('[data-action="scenarioPctMode"][data-value="p1"]');
    await click('[data-action="bzPick"][data-q="t2"]');await click('[data-action="bzPickPos"][data-pos=""]');await click('[data-action="bzQuest"][data-r="miss"]');
    assert.notEqual(await raw(),before);
    await click('#undoBtn');await pause(40);
    assert.equal(await raw(),before,'取消でBZの記録が戻らない');
    await expectPressed('p1');
    await click('#undoBtn');await pause(40);
    await expectPressed('p1');
    assert.equal(await raw(),before,'2回目の取消で記録が動いた');
    // シナリオカード：作ったあとにモードを切り替えると、注記と％が追随して描き直される
    await tab(3);await click('[data-action="scenarioCard"]');await pause(150);
    for(const [mode] of [['p1'],['candidates'],['auto']]){
      await tab(2);await click(`[data-action="scenarioPctMode"][data-value="${mode}"]`);await tab(3);await pause(150);
      const image=await canvas('scenarioCanvas');
      const texts=image.text.map(x=>x.text);
      assert.ok(texts.includes(NOTE[mode]),mode+': カードの注記が追随していない '+JSON.stringify(texts.filter(x=>x.startsWith('％')||x.startsWith('候補のみ'))));
      for(const other of Object.keys(NOTE).filter(k=>k!==mode))assert.ok(!texts.includes(NOTE[other]),mode+': 別モードの注記が残っている');
      assert.equal(texts.some(x=>/A \d+%/.test(x)),mode==='p1',mode+': カードの％の有無が違う');
      assert.ok(image.text.every(x=>x.left>=0&&x.right<=1080),mode+': カードの文字が幅からはみ出している');
      if(width===390)saveCanvas('pct-mode-card-'+mode,image);
    }
    assert.equal(await raw(),before,'カードの作成・切替で記録が変わった');
    pass('3 modes, warning, reload, undo, card note '+width);
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

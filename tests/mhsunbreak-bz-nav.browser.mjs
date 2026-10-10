// Run explicitly: node tests/mhsunbreak-bz-nav.browser.mjs
// BZタブの導線改善3点（入口の並び・ジャンプ列・結果アイコンの色）と、なな様イラストの実表示と実操作。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-profile-'));
const results=[];
const errors=[];
const visualFindings=[];
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
const state=()=>frame('return JSON.parse(w.localStorage.getItem(w.__key));');
const click=selector=>frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(id,width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+'/'+id+'-checker.html')};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return d.querySelector('#hitIn,#gIn,[data-number-key="gamesMyslo"]')&&w.CheckerConfigs?.[${JSON.stringify(id)}]?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  await frame(`w.__key=${JSON.stringify(id+'-checker-v1')};`);
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function clear(id,width=390){
  await evaluate(`localStorage.removeItem(${JSON.stringify(id+'-checker-v1')});`);
  await load(id,width);
}
async function games(value){await frame(`const el=d.querySelector('#hitIn,#gIn,[data-number-key="gamesMyslo"]');el.value=${JSON.stringify(String(value))};el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));if(el.id==='hitIn')d.querySelector('[data-action="addHit"]').click();`);}
async function bump(key){await click(`[data-c="${key}"] .plus`);}
async function canvas(id){
  return frame(`const cv=d.getElementById(${JSON.stringify(id)});const x=cv.getContext('2d');const a=x.getImageData(0,0,cv.width,cv.height).data;let opaque=0,bright=0;for(let i=0;i<a.length;i+=4){if(a[i+3])opaque++;if(a[i]+a[i+1]+a[i+2]>180)bright++;}return {width:cv.width,height:cv.height,opaque,bright,text:w.__texts[cv.id]||[],data:cv.toDataURL()};`);
}
function saveCanvas(name,c){fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(c.data.split(',')[1],'base64'));}
async function copy(plain=false){await click(plain?'#cpPlainBtn':'#cpBtn');return frame('return w.__clipboard;');}
async function reset(){await frame(`d.getElementById('dataOps').open=true;`);await click('#resetBtn');await click('#resetBtn');}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name);}
async function measure(name){
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&w.getComputedStyle(e).visibility!=='hidden');const inScroller=e=>{for(let p=e.parentElement;p;p=p.parentElement){const ox=w.getComputedStyle(p).overflowX;if(ox==='auto'||ox==='scroll'||ox==='hidden')return true;}return false;};return {width,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return (r.left<-.5||r.right>width+.5)&&!inScroller(e);}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60),rect:e.getBoundingClientRect().toJSON()})),buttons:nodes.filter(e=>e.matches('button,.plus')).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height,minHeight:w.getComputedStyle(e).minHeight})),ndLabels:[...d.querySelectorAll('.bz-row .ct')].map(e=>{const range=d.createRange();range.selectNodeContents(e.firstElementChild);return {text:e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,rowHeight:e.closest('.bz-row').getBoundingClientRect().height,lineCount:range.getClientRects().length,font:w.getComputedStyle(e.firstElementChild).fontSize};})};`);
  fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
  // Jump navigation intentionally scrolls horizontally. Its clipped children do
  // not overflow the page viewport; test the scroll container itself instead.
  const visibleOverflow=[];
  for(const item of r.overflow){
    const clipped=await frame(`return [...d.querySelectorAll('.jump-nav button')].some(e=>e.textContent===${JSON.stringify(item.text)}&&['auto','scroll','hidden'].includes(w.getComputedStyle(e.parentElement).overflowX));`);
    if(!clipped)visibleOverflow.push(item);
  }
  assert.deepEqual(visibleOverflow,[],name+' horizontal overflow');
  assert.ok(r.buttons.every(b=>b.height>=44),name+' button below 44px: '+JSON.stringify(r.buttons.filter(b=>b.height<44)));
  pass(name+' viewport',{width:r.width,minButtonHeight:Math.min(...r.buttons.map(b=>b.height)),overflow:0,ndLabels:r.ndLabels});
  if(r.ndLabels.length){
    assert.deepEqual(r.ndLabels.map(l=>l.text),['通常','高確','超高確','通常','高確']);
    if(r.ndLabels.some(l=>l.lineCount!==1))visualFindings.push({name:name+' n/d single-line labels',status:'FAIL',detail:r.ndLabels});
    else pass(name+' n/d single-line labels',r.ndLabels);
  }
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
      // The local acceptance test is independent of ads, analytics and remote fonts.
      // Keep their URLs/HTML unchanged; record this test-environment limitation.
      await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
    }
  };
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'https://*'},{urlPattern:'http://www.*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__errors=[];window.__texts={};window.__clipboard='';window.__drawn={};
    window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));console.error('unhandledrejection',String(e.reason));});
    window.addEventListener('error',e=>window.__errors.push(e.message));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__clipboard=text;}}});
    const ft=CanvasRenderingContext2D.prototype.fillText,fr=CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect=function(x,y,w,h){if(w>=1000&&h>=1000)window.__texts[this.canvas.id]=[];return fr.apply(this,arguments);};
    const di=CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage=function(){const id=this.canvas.id;(window.__drawn??={});window.__drawn[id]=(window.__drawn[id]||0)+1;return di.apply(this,arguments);};
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y){const m=this.measureText(text);(window.__texts[this.canvas.id]??=[]).push({text:String(text),x,y,font:this.font,width:m.width,left:x-m.actualBoundingBoxLeft,right:x+m.actualBoundingBoxRight});return ft.apply(this,arguments);};
  `});
  await send('Page.navigate',{url:origin+'/harness'});await pause(100);
  // ===== 1. 入口の並びと縦の長さ（360/390/412px）=====
  const ORDER=['BZ（ブレイクゾーン）','BZ終了時PUSH ランプ','アイキャッチ（ステージチェンジ）','チッチェのセリフ','アイルー福引','そのほか'];
  for(const width of [360,390,412]){
    await clear('mhsunbreak');await load('mhsunbreak',width,530);await tab(2);await measure('bz-nav-'+width);
    const m=await frame(`return {width:w.innerWidth,scrollHeight:d.getElementById('main').scrollHeight,
      entries:[...d.querySelectorAll('.entry-h')].map(e=>e.textContent),
      jump:[...d.querySelectorAll('.jump-btn')].map(e=>({text:e.textContent,height:+e.getBoundingClientRect().height.toFixed(1)})),
      jumpRows:new Set([...d.querySelectorAll('.jump-btn')].map(e=>Math.round(e.getBoundingClientRect().top))).size,
      minButtonHeight:Math.min(...[...d.querySelectorAll('header button,#main button,nav button')].filter(e=>e.checkVisibility()).map(e=>e.getBoundingClientRect().height))};`);
    assert.deepEqual(m.entries.slice(1),ORDER,width+'px: 入口の並びが違う');
    assert.deepEqual(m.jump.map(b=>b.text),['BZ','ランプ','アイキャッチ','セリフ','福引'],width+'px: ジャンプの並びが違う');
    assert.ok(m.jump.every(b=>b.height>=44),width+'px: ジャンプが44px未満 '+JSON.stringify(m.jump));
    assert.ok(m.minButtonHeight>=44,width+'px: 44px未満のボタンがある');
    console.log('MEASURE '+JSON.stringify(m));
    pass('bz-nav metrics '+width,m);
    const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});
    fs.writeFileSync(path.join(artifacts,'bz-nav-'+width+'.png'),Buffer.from(shot.data,'base64'));
  }

  // ===== 2. ジャンプが正しい入口に飛び、見出しが一瞬光る =====
  await clear('mhsunbreak');await load('mhsunbreak',390,530);await tab(2);
  for(const [k,label,id] of [['bz','BZ','ent-bz'],['lamp','ランプ','ent-lamp'],['eye','アイキャッチ','ent-eye'],['serif','セリフ','ent-serif'],['fuku','福引','ent-fuku']]){
    await frame(`d.getElementById('main').scrollTop=0;`);
    await click(`[data-action="bzJump"][data-k="${k}"]`);
    const flashed=await frame(`return d.querySelector('#${id} .entry-h').classList.contains('flash');`);
    assert.equal(flashed,true,label+': 見出しが光っていない');
    await pause(700);   // なめらかスクロールの着地を待つ
    const r=await frame(`const main=d.getElementById('main'),el=d.getElementById('${id}');
      return {gap:Math.round(el.getBoundingClientRect().top-main.getBoundingClientRect().top),text:el.querySelector('.entry-h').textContent};`);
    assert.equal(r.text,{bz:'BZ（ブレイクゾーン）',lamp:'BZ終了時PUSH ランプ',eye:'アイキャッチ（ステージチェンジ）',serif:'チッチェのセリフ',fuku:'アイルー福引'}[k],label+': 飛び先の入口が違う');
    assert.ok(Math.abs(r.gap)<=24,label+': 入口の先頭に揃っていない（gap='+r.gap+'）');
    await pause(400);
    assert.equal(await frame(`return d.querySelector('#${id} .entry-h').classList.contains('flash');`),false,label+': ハイライトが消えない');
  }
  pass('5 jumps land on their entry and flash the heading');

  // ===== 3. ジャンプは取消にも保存にも触れない =====
  await clear('mhsunbreak');await tab(2);
  await click('[data-action="bzPick"][data-q="t3"]');await click('[data-action="bzQuest"][data-r="miss"]');
  const saved=await state();
  assert.equal(saved.atLog.sessions[0].events.length,1);
  for(const k of ['bz','lamp','eye','serif','fuku'])await click(`[data-action="bzJump"][data-k="${k}"]`);
  assert.deepEqual(await state(),saved,'ジャンプで保存が変わった');
  await click('#undoBtn');
  assert.deepEqual((await state()).atLog.sessions[0].events,[],'取消1回で記録が戻らない（ジャンプが履歴に積まれている）');
  assert.equal((await state()).bzT1.t3,0);
  pass('jumps touch neither the save nor the undo history');

  // ===== 4. 結果アイコンの帯色（実際に描かれた色）=====
  const RGB={'#83caff':'rgb(131, 202, 255)','#ffe881':'rgb(255, 232, 129)','#a9e6ad':'rgb(169, 230, 173)',
             '#ffb77f':'rgb(255, 183, 127)','#ff9b9b':'rgb(255, 155, 155)','#cbb4ff':'rgb(203, 180, 255)',
             '#ffc94d':'rgb(255, 201, 77)','#9a90a8':'rgb(154, 144, 168)'};
  const ICONS={t1:['QUEST青','QUEST青','QUEST黄','QUEST黄','ライゼクス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル'],
               t3:['ライゼクス','ライゼクス','セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G'],
               t6:['テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G','＋G','＋G','＋G','＋G']};
  const COLOR={'QUEST青':'#83caff','QUEST黄':'#ffe881','ライゼクス':'#a9e6ad','セルレギオス':'#ffb77f',
               'オロミドロ亜種':'#ff9b9b','テオ・テスカトル':'#cbb4ff','AT':'#ffc94d','＋G':'#9a90a8'};
  await clear('mhsunbreak');await tab(2);
  for(const [id,icons] of Object.entries(ICONS)){
    await click(`[data-action="bzPick"][data-q="${id}"]`);
    const got=await frame(`return [...d.querySelectorAll('.pos-btn')].map(e=>({text:e.textContent,
      band:w.getComputedStyle(e).borderLeftColor,color:w.getComputedStyle(e).color,
      bandWidth:w.getComputedStyle(e).borderLeftWidth,height:+e.getBoundingClientRect().height.toFixed(1)}));`);
    assert.equal(got.length,11,id+': 11ボタンでない');
    icons.forEach((name,i)=>{
      assert.equal(got[i].band,RGB[COLOR[name]],`${id} 位置${i+1}（${name}）: 帯色が違う`);
      assert.equal(got[i].color,RGB[COLOR[name]],`${id} 位置${i+1}（${name}）: 文字色が違う`);
      assert.equal(got[i].bandWidth,'4px',`${id} 位置${i+1}: 帯の太さが違う`);
      assert.ok(got[i].text.includes(`${i+1}：${name}`),`${id} 位置${i+1}: 番号と名前が消えている`);
    });
    assert.ok(got.every(b=>b.height>=48),id+': 48px未満の結果アイコンがある');
    await click(`[data-action="bzPick"][data-q="${id}"]`);   // 選択を外す
  }
  pass('result-icon bands and text colours match the table colours');

  // ===== 5. なな様のイラスト（画像カードの選択に連動）=====
  await clear('mhsunbreak');await tab(2);
  await click('[data-action="bzPick"][data-q="t1"]');await click('[data-action="bzQuest"][data-r="miss"]');
  await tab(3);
  const drawCard=async()=>{await frame(`w.__drawn={};`);await click('[data-action="scenarioCard"]');await pause(500);
    return frame(`return {drawn:(w.__drawn&&w.__drawn.scenarioCanvas)||0,texts:(w.__texts.scenarioCanvas||[]).map(t=>t.text)};`);};
  const pick=async choice=>{await click(`[data-icon-choice="${choice}"]`);await pause(300);};
  await pick('nana');
  const withNana=await drawCard();
  assert.equal(withNana.drawn,1,'なな様を選んでいるのにイラストが描かれていない');
  assert.ok(withNana.texts.some(t=>t.includes('@nana_szsr')),'クレジットが出ていない');
  assert.ok(withNana.texts.includes('BZシナリオカード'),'カードの見出しが消えた');
  await pick('default');
  const withoutNana=await drawCard();
  assert.equal(withoutNana.drawn,0,'slot-tools を選んでいるのにイラストが出ている');
  assert.ok(!withoutNana.texts.some(t=>t.includes('@nana_szsr')),'slot-tools なのにクレジットが出ている');
  assert.ok(withoutNana.texts.includes('BZシナリオカード'));
  // 既存の画像カードとテンプレ・保存データは変わらない
  // 画像カードのアイコン選択そのもの（iconChoice）は engine が前から保存している設定。
  // ここで見るのは「イラストを出し分けても記録が動かない」こと。
  const beforeNana=await state();
  await pick('nana');await drawCard();
  const strip=o=>{const c={...o};delete c.iconChoice;delete c.img;return c;};
  assert.deepEqual(strip(await state()),strip(beforeNana),'イラストの選択で記録が変わった');
  assert.deepEqual((await state()).atLog,beforeNana.atLog,'イラストの選択でAT間ログが変わった');
  const cardPixels=await canvas('cardCanvas');assert.ok(cardPixels.bright>1000,'画像カードが壊れた');
  pass('nana illustration follows the card icon choice and leaves data untouched');
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

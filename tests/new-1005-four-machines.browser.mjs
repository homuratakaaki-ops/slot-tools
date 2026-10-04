// Run explicitly: node tests/new-1005-four-machines.browser.mjs
// Real iframe viewports, production handlers, canvas pixels and clipboard boundary.
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
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&w.getComputedStyle(e).visibility!=='hidden');return {width,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>width+.5;}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60),rect:e.getBoundingClientRect().toJSON()})),buttons:nodes.filter(e=>e.matches('button,.plus')).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height,minHeight:w.getComputedStyle(e).minHeight})),ndLabels:[...d.querySelectorAll('.bz-row .ct')].map(e=>{const range=d.createRange();range.selectNodeContents(e.firstElementChild);return {text:e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,rowHeight:e.closest('.bz-row').getBoundingClientRect().height,lineCount:range.getClientRects().length,font:w.getComputedStyle(e.firstElementChild).fontSize};})};`);
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
  for(const id of ['juuou','paripi','tenten','mhsunbreak']){
    const cardTab=['mhsunbreak','tenten'].includes(id)?2:1;
    await clear(id);
    assert.equal(await frame(`return d.querySelector('#hitIn,#gIn,[data-number-key="gamesMyslo"]').closest('section').querySelector('details')===null;`),!['juuou','mhsunbreak'].includes(id));
    const countKey=id==='juuou'?'sc':id==='paripi'?'cz':'at';
    if(id==='mhsunbreak'){
      assert.equal(await frame(`return d.querySelector('.sumrow .num').textContent;`),'0');
      assert.equal(await frame(`return d.querySelector('[data-c="counts.at"]');`),null);
      await bump('cycle.c1'); // Keep detail output nonempty while hit count remains zero.
    }else{
      await bump('counts.'+countKey);
      assert.equal((await state()).counts[countKey],1);
    }
    assert.equal(await frame(`return d.querySelector(${JSON.stringify(id==='mhsunbreak'?'.sumrow':'[data-c="counts.'+countKey+'"]')}).textContent.includes('現在');`),false);
    await tab(cardTab);await pause(120);
    let c=await canvas('cardCanvas');assert.ok(c.bright>1000&&c.opaque===c.width*c.height);
    assert.ok(!c.text.some(t=>/1\/\d/.test(t.text)));
    assert.ok(!/1\/\d/.test(await copy()));
    saveCanvas(id+'-empty-games-card',c);
    await click('#detailBtn');c=await canvas('detailCanvas');assert.ok(c.bright>1000);assert.ok(!c.text.some(t=>/1\/\d/.test(t.text)));
    pass(id+' blank-games measured-rate absent (input/card/detail/template)');
    await tab(0);await games(1000);await tab(cardTab);
    c=await canvas('cardCanvas');assert.ok(c.text.some(t=>t.text.includes('1/1000.0')));saveCanvas(id+'-card',c);
    const normal=await copy();assert.ok(normal.includes('1/1000.0'));
    const plain=await copy(true);assert.ok(plain.includes('→'));assert.ok(!/[▶↪\uFE0E\uFE0F]/u.test(plain));
    await click('#detailBtn');c=await canvas('detailCanvas');assert.ok(c.bright>1000);assert.ok(c.text.some(t=>t.text.includes('1/1000.0')));saveCanvas(id+'-detail',c);
    pass(id+' card/detail pixels and both copy buttons');
    await tab(0);assert.ok(await frame(`return d.querySelector(${JSON.stringify(id==='mhsunbreak'?'.sumrow':'[data-c="counts.'+countKey+'"]')}).textContent.includes('現在 1/1000.0');`));
    pass(id+' games input updates rate');
    const before=await state();
    // games is a derived display cache for the pair; save occurs before pages syncs it.
    if(id==='juuou')before.games=Math.max(0,before.gamesMyslo-before.gamesMysloStart);
    if(id==='mhsunbreak')before.games=before.hits.reduce((a,b)=>a+b,0);
    await reset();assert.equal((await state()).counts[countKey],0);await click('#undoBtn');assert.deepEqual(await state(),before);
    pass(id+' double-reset and undo restore');
    for(let p=0;p<=cardTab;p++){
      await tab(p);
      const scroll=await frame(`const m=d.getElementById('main');m.scrollTop=83+p*0; m.dispatchEvent(new w.Event('scroll'));return m.scrollTop;`.replace('83+p*0',String(83+p*21)));
      await tab((p+1)%(cardTab+1));await tab(p);
      assert.equal(await frame('return d.getElementById("main").scrollTop;'),scroll);
    }
    pass(id+' per-tab scroll retention with explicit event');
    for(const width of [360,390]){
      await load(id,width,530);
      if(id==='mhsunbreak'){
        await frame("const s=JSON.parse(w.localStorage.getItem(w.__key));for(const key of Object.keys(s.bz))s.bz[key]=99;w.localStorage.setItem(w.__key,JSON.stringify(s));");
        await load(id,width,530);
        assert.ok(Object.values((await state()).bz).every(v=>v===99),'saved BZ keys survive reload');
      }
      for(let p=0;p<=cardTab;p++){
        await tab(p);await measure(id+'-'+width+'-tab'+p);
        if(p===0){
          if(id==='mhsunbreak')await frame(`d.querySelector('.bz-sub').scrollIntoView({block:'start'});`);
          const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,id+'-'+width+'-input.png'),Buffer.from(shot.data,'base64'));
        }
      }
    }
    if(id==='juuou'){
      for(let p=0;p<=cardTab;p++){await tab(p);assert.ok(!(await frame('return d.documentElement.outerHTML;')).includes('設定3'));}
      assert.ok(!normal.includes('設定3'));assert.ok(!(await canvas('cardCanvas')).text.some(t=>t.text.includes('設定3')));
      assert.ok(!fs.readFileSync(path.join(root,'checker-data/juuou.js'),'utf8').includes('設定3'));
      pass('juuou absent-setting text excluded');
    }
    assert.deepEqual(await frame('return w.__errors;'),[]);
    pass(id+' zero console/unhandled errors');
  }
  // Hit-game acceptance: production input, add/delete, undo, reload and card/copy handlers.
  await clear('mhsunbreak');
  await bump('cycle.c1'); // Detail cards intentionally do not render for a wholly empty state.
  const hitRows=()=>frame(`return [...d.querySelectorAll('.hit-row')].map(e=>({text:e.querySelector('.nm').textContent,index:Number(e.querySelector('button').dataset.i),visible:e.checkVisibility()}));`);
  async function hitOutputs(count,sum,rate){
    await tab(0);
    assert.equal(await frame(`return d.querySelector('.sumrow .num').textContent;`),String(count));
    assert.ok(await frame(`return d.querySelector('.sec-h').textContent.includes(${JSON.stringify('合計 '+sum+'G')});`));
    const row=await frame(`return d.querySelector('.sumrow').textContent;`);
    assert.equal(row.includes('現在 1/'),!!rate);if(rate)assert.ok(row.includes(rate));
    await tab(2);const output=await copy();
    assert.equal(output.split('\n')[1],`通常 ${sum}G / AT${count}回${rate?' '+rate:''}`);
    for(const canvasId of ['cardCanvas','detailCanvas']){
      if(canvasId==='detailCanvas')await click('#detailBtn');
      const c=await canvas(canvasId);assert.ok(c.bright>1000&&c.opaque===c.width*c.height);
      assert.equal(c.text.some(t=>/1\/\d/.test(t.text)),!!rate);
      if(rate)assert.ok(c.text.some(t=>t.text.includes(rate)));
      assert.ok(c.text.some(t=>t.text.includes(sum+'G')),canvasId+' total games');
      if(count)assert.ok(c.text.some(t=>t.text.includes('AT初当り')&&t.text.includes(count+'回')),canvasId+' count');
      saveCanvas('mhsunbreak-hits-'+count+'-'+sum+'-'+canvasId,c);
    }
    await tab(0);
  }
  await hitOutputs(0,0,'');
  assert.equal((await hitRows()).length,0);
  assert.equal(await frame(`return d.querySelectorAll('.hit-more').length;`),0);
  pass('MH 0 entries: no rows/details/rate');
  for(const value of [300,600,900])await games(value);
  await hitOutputs(3,1800,'1/600.0');
  assert.equal((await hitRows()).filter(r=>r.visible).length,3);
  assert.equal(await frame(`return d.querySelectorAll('.hit-more').length;`),0);
  assert.deepEqual((await hitRows()).map(r=>[r.text,r.index]),[['900G',2],['600G',1],['300G',0]]);
  assert.ok((await frame(`return d.getElementById('feed').textContent;`)).includes('AT当選 900G を追加'));
  pass('MH hits 300/600/900: screen/card/detail/template = 3,1800G,1/600.0; newest first');
  await games(1200);await hitOutputs(4,3000,'1/750.0');
  assert.deepEqual((await hitRows()).filter(r=>r.visible).map(r=>r.text),['1200G','900G','600G']);
  assert.equal(await frame(`return d.querySelector('.hit-more summary').textContent;`),'すべて表示（残り1件）');
  await click('.hit-more summary');assert.equal((await hitRows()).filter(r=>r.visible).length,4);
  assert.equal((await hitRows()).at(-1).text,'300G');
  await click('.hit-more summary');assert.equal((await hitRows()).filter(r=>r.visible).length,3);
  await click('#undoBtn');assert.deepEqual((await state()).hits,[300,600,900]);
  pass('MH 4 entries: latest 3, folded 1, 3000G,1/750.0, open/close');
  await click('[data-action="delHit"][data-i="1"]');await hitOutputs(2,1200,'1/600.0');
  await click('#undoBtn');assert.deepEqual((await state()).hits,[300,600,900]);
  await click('#undoBtn');assert.deepEqual((await state()).hits,[300,600]);
  await hitOutputs(2,900,'1/450.0');
  pass('MH delete middle real index recalculates; delete undo restores; add undo removes');
  await tab(1);await bump('atEnd.jay');await click('#undoBtn');await tab(0);
  assert.deepEqual((await state()).hits,[300,600]);
  await click('#modeBtn');await games(900);assert.deepEqual((await state()).hits,[300,600,900]);
  await click('[data-action="delHit"][data-i="1"]');assert.deepEqual((await state()).hits,[300,900]);
  await click('#undoBtn');assert.deepEqual((await state()).hits,[300,600,900]);await click('#modeBtn');
  pass('MH unrelated undo preserves hits; minus mode add/delete/undo unchanged');
  const beforeInvalid=await state(),feedBefore=await frame(`return d.getElementById('feed').textContent;`);
  for(const value of ['0','','oops']){await games(value);assert.deepEqual(await state(),beforeInvalid);assert.equal(await frame(`return d.getElementById('feed').textContent;`),feedBefore);}
  await click('#undoBtn');assert.deepEqual((await state()).hits,[300,600]);
  pass('MH zero/empty/non-number: 3 no-ops, no history entry');
  await clear('mhsunbreak');for(let i=1;i<=15;i++)await games(i*100);
  const rows=await hitRows();assert.deepEqual(rows.map(r=>r.index),Array.from({length:15},(_,i)=>14-i));
  assert.equal(rows.filter(r=>r.visible).length,3);
  assert.equal(await frame(`return d.querySelector('.hit-more summary').textContent;`),'すべて表示（残り12件）');
  await hitOutputs(15,12000,'1/800.0');
  await click('.hit-more summary');assert.equal((await hitRows()).filter(r=>r.visible).length,15);
  await click('[data-action="delHit"][data-i="4"]');assert.deepEqual((await state()).hits,Array.from({length:15},(_,i)=>(i+1)*100).filter(v=>v!==500));
  assert.equal(await frame(`return d.querySelector('.hit-more').open;`),false);
  await hitOutputs(14,11500,'1/821.4');await click('#undoBtn');
  assert.deepEqual((await state()).hits,Array.from({length:15},(_,i)=>(i+1)*100));
  assert.deepEqual((await hitRows()).map(r=>r.index),Array.from({length:15},(_,i)=>14-i));
  await load('mhsunbreak');assert.equal((await state()).hits.length,15);await hitOutputs(15,12000,'1/800.0');
  pass('MH 15 entries: latest 3, folded 12, full aggregation, folded 500G deletion/undo and reload');
  for(const width of [360,390]){
    await load('mhsunbreak',width,530);await measure('mhsunbreak-hits-'+width);
    await click('.hit-more summary');await measure('mhsunbreak-hits-expanded-'+width);
    await frame(`d.getElementById('main').scrollTop=0;`);
    const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});
    fs.writeFileSync(path.join(artifacts,'mhsunbreak-hits-'+width+'.png'),Buffer.from(shot.data,'base64'));
  }
  await evaluate(`localStorage.setItem('mhsunbreak-checker-v1',JSON.stringify({games:3000,counts:{at:9},atEnd:{jay:1}}));`);
  await load('mhsunbreak');await hitOutputs(0,0,'');await tab(1);
  assert.equal(await frame(`return d.querySelector('[data-c="atEnd.jay"] .num').textContent;`),'1');
  await bump('atEnd.jay');await click('#undoBtn');
  const legacy=await state();assert.equal(legacy.counts.at,9);assert.equal(legacy.atEnd.jay,1);assert.deepEqual(legacy.hits,[]);assert.deepEqual(await frame('return w.__errors;'),[]);
  pass('MH legacy games3000/AT9/jay1: displayed AT0, no measured rate, jay1 and counts.at9 retained, zero errors',legacy);
  for(const page of ['checkers','index']){
    await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.src=${JSON.stringify(origin+'/'+page+'.html')};})`);
    if(page==='checkers'){
      assert.equal(await frame(`return d.querySelector('h1').textContent;`),'設定判別カウンター');
      for(const value of await frame(`return [d.title,d.querySelector('[property="og:title"]').content];`))assert.equal(value,'設定判別カウンター｜機種を選ぶ｜スロット稼働ノート');
      assert.equal(await frame(`return d.querySelector('p.lead');`),null);
      assert.equal(await frame(`return d.querySelector('header p').textContent;`),'設定推測ツールと機種別カウンターを、目的に合わせて選ぶための一覧です。');
      assert.ok((await frame(`return d.querySelector('p.note').textContent;`)).includes('設定判別ツール'));
    }else assert.ok((await frame(`return [...d.querySelectorAll('a[href="checkers.html"]')].map(e=>e.textContent);`)).includes('設定判別カウンター一覧'));
    pass(page+' requested wording via real DOM');
  }
  // Independent expectations come from the issuer's tables and immutable template.
  const spec=fs.readFileSync(path.join(root,'docs/specs/new-1005-four-machines-instructions.md'),'utf8');
  const groups=[['atEnd','#### (1) AT終了画面'],['trophy','#### (2) エンタトロフィー'],['over','#### (3) 獲得枚数表示'],['stamp','#### (4) エンディング中のスタンプ色']].map(([key,start])=>{
    const chunk=spec.slice(spec.indexOf(start)).split(/\n#### |\n### /)[0];
    return {key,rows:chunk.split(/\r?\n/).filter(l=>/^\| `\w+` \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(x=>x.trim().replace(/[`*]/g,'')))};
  });
  await clear('mhsunbreak');
  const bzUi=await frame(`const rows=[...d.querySelectorAll('.bz-row')];const sec=rows[0].closest('section');return {titles:[...sec.querySelectorAll('.bz-sub')].map(e=>e.textContent),hints:sec.querySelectorAll('.hint').length,rows:rows.map(e=>[...e.querySelectorAll('button')].map(b=>[b.dataset.label,b.getAttribute('aria-label')]))};`);
  assert.deepEqual(bzUi.titles,['弱レア','強レア']);assert.equal(bzUi.hints,1);
  assert.deepEqual(bzUi.rows,['弱レア 通常','弱レア 高確','弱レア 超高確','強レア 通常','強レア 高確'].map(name=>['当選','ハズレ'].map(action=>[name+' '+action,name+' '+action])));
  pass('MH BZ subheadings, single hint and full operation labels');
  await tab(1);
  const labels=await frame(`return [...d.querySelectorAll('.crow[data-c]')].map(e=>[e.dataset.c,e.querySelector('.nm').textContent,e.querySelector('.mn').textContent]);`);
  // Keep the historical instruction sheet intact; apply the approved wording rule to expectations only.
  assert.deepEqual(labels,groups.flatMap(g=>g.rows.map(r=>[g.key+'.'+r[0],r[1],r[2].replace(/設定([0-9０-９・]*(?:以上)?)確定演出/g,'設定$1濃厚')])));
  assert.equal(labels.length,31);assert.equal(await frame('return d.querySelectorAll("#nav button").length;'),3);
  pass('MH 31 exact hint labels/sublabels and 3 tabs');
  await tab(2);
  const zero=await copy();
  const original=fs.readFileSync(path.join(root,'docs/specs/mhsunbreak-nana-template-v01.txt'),'utf8');
  const expected='設定判別メモ｜スマスロ モンスターハンターライズ：サンブレイク\n通常 0G / AT0回\n_______\n\n'+original.replace(/▶︎ (?=\r?\n)/g,'▶︎ 0回')+'\n\nby slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様';
  assert.equal(zero,expected);assert.equal((original.match(/▶︎ (?=\r?\n)/g)||[]).length,14);
  fs.writeFileSync(path.join(artifacts,'mhsunbreak-zero-template.txt'),zero);
  const plain=await copy(true);assert.ok(plain.includes('1周期→ 0回'));assert.ok(plain.includes('→BZ突入時に告知される'));assert.ok(!/[▶↪①-⑤\uFE0E\uFE0F]|\p{Emoji_Presentation}/u.test(plain));
  pass('MH zero-template bytes (14 filled lines) and plain-copy substitutions');
  const screenTargets={
    jay:['男(奇数)▶︎ ','ｼﾞｪｲ       ▶︎ '],arlo:['男(奇数)▶︎ ','ｱﾙﾛｰ       ▶︎ '],galeas:['男(奇数)▶︎ ','ｶﾞﾚｱｽ     ▶︎ '],
    rondine:['女(偶数)▶︎ ','ﾛﾝﾃﾞｨｰﾈ ▶︎ '],luchika:['女(偶数)▶︎ ','ﾙｰﾁｶ       ▶︎ '],
    fioreneAirou:['高設定弱▶︎ '],chicheAirouGaruku:['高設定強▶︎ '],fioreneRondine:['2否定　▶︎ '],jayArloGaleas:['3否定　▶︎ '],
    hinoeMinoto:['2以上　▶︎ '],zenin:['5以上　▶︎ '],entalion:['6確　　▶︎ ']
  };
  const stampTargets={blue:'🔵奇  ',yellow:'🟡 偶 ',green:'🟢弱  ',red:'🔴 強 ',bronze:'銅 ',silver:'銀 ',gold:'金 ',momiji:'🍁 ',rainbow:'🌈 '};
  // Every input goes through a production click, then its output is compared and undone.
  for(const g of groups)for(const r of g.rows){
    await tab(1);await bump(g.key+'.'+r[0]);await tab(2);
    const output=await copy();const changed=output.split('\n').flatMap((l,i)=>l===zero.split('\n')[i]?[]:[i]);
    const expectedChanges=g.key==='trophy'||g.key==='over'?0:g.key==='atEnd'&&['jay','arlo','galeas','rondine','luchika'].includes(r[0])?2:1;
    assert.equal(changed.length,expectedChanges,g.key+'.'+r[0]+' template delta');
    let expectedOutput=zero;
    const targets=g.key==='atEnd'?screenTargets[r[0]]:g.key==='stamp'?[stampTargets[r[0]]]:[];
    for(const prefix of targets)expectedOutput=expectedOutput.replace(prefix+'0回',prefix+'1回');
    assert.equal(output,expectedOutput,g.key+'.'+r[0]+' exact template target');
    const card=await canvas('cardCanvas');const first=card.text.find(t=>t.x===70&&t.y===752)?.text;
    if(Number(r[5])!==1)assert.equal(first,'確定演出 なし',g.key+'.'+r[0]+' excluded from best');
    else assert.ok(first?.includes(r[1]),g.key+'.'+r[0]+' selected in best');
    assert.equal(card.text.find(t=>t.x===814&&t.y===312)?.text,'確定演出');
    const cert=card.text.find(t=>t.x===814&&t.y===368)?.text;
    assert.equal(cert,'計'+(Number(r[3])>0?1:0)+'回');
    await click('#undoBtn');
  }
  pass('MH all 31 hints: single-input template delta, oneL exclusion/inclusion, rank counts');
  const bz=['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'];
  for(const key of bz){
    await tab(0);
    const selector=`[data-bump-many="bz.${key}D,bz.${key}N"]`;
    const fullName={'weakNormal':'弱レア 通常','weakHigh':'弱レア 高確','weakSuper':'弱レア 超高確','strongNormal':'強レア 通常','strongHigh':'強レア 高確'}[key];
    await click(selector);assert.equal((await state()).bz[key+'D'],1);assert.equal((await state()).bz[key+'N'],1);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(fullName+' 当選'));
    await tab(2);
    const winTemplate=await copy();
    const ratioMatch=[...zero.matchAll(/0\/0/g)][bz.indexOf(key)];
    assert.equal(winTemplate,zero.slice(0,ratioMatch.index)+'1/1'+zero.slice(ratioMatch.index+3));
    await tab(0);
    await click('#modeBtn');
    assert.equal(await frame(`return d.querySelector(${JSON.stringify(selector)}).parentElement.querySelector('button:last-child').disabled;`),true);
    await click(selector);assert.equal((await state()).bz[key+'D'],0);assert.equal((await state()).bz[key+'N'],0);
    await click('#undoBtn');
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(fullName+' 当選'));
    await click('#modeBtn');await click('#undoBtn');
    await click(`[data-bump="bz.${key}D"]`);
    await tab(2);assert.equal(await copy(),zero.slice(0,ratioMatch.index)+'0/1'+zero.slice(ratioMatch.index+3));
    await tab(0);await click('#modeBtn');await click(`[data-bump="bz.${key}D"]`);
    assert.equal((await state()).bz[key+'D'],0);await click('#undoBtn');await click('#modeBtn');
    await click('#undoBtn');
  }
  pass('MH five n/d rows: wins/misses, minus disabled at n=d, undo and template values');
  for(const key of ['cycle.c1','cycle.c2','cycle.c3','cycle.c4','cycle.c5','czType.breakzone','czType.airou']){
    await tab(0);await bump(key);await tab(2);
    assert.equal((await copy()).split('\n').filter((l,i)=>l!==zero.split('\n')[i]).length,1,key);
    const prefix=key.startsWith('cycle.')?['①','②','③','④','⑤'][Number(key.at(-1))-1]+'周期▶︎ ':key==='czType.breakzone'?'ブレイクゾーン▶︎ ':'アイルー福引　▶︎ ';
    assert.equal(await copy(),zero.replace(prefix+'0回',prefix+'1回'));
    await click('#undoBtn');
  }
  pass('MH cycle/CZ single-input template deltas');
  await tab(0);await bump('czType.breakzone');await bump('czType.airou');await bump('czType.airou');
  const percents=await frame(`return [...d.querySelectorAll('[data-c^="czType."] .pct')].map(e=>e.textContent);`);
  assert.deepEqual(percents,['1/3 33%','2/3 67%']);await tab(2);await click('#detailBtn');
  const detail=await canvas('detailCanvas');assert.ok(detail.text.some(t=>t.text.includes('ブレイクゾーン ×1 (33%)')));assert.ok(detail.text.some(t=>t.text.includes('アイルー福引 ×2 (67%)')));
  pass('MH CZ denominator matches screen/detail');
  await clear('mhsunbreak');await tab(1);
  for(const g of groups)for(const r of g.rows)await bump(g.key+'.'+r[0]);
  await tab(0);await games(1000);
  for(const key of bz)await click(`[data-bump-many="bz.${key}D,bz.${key}N"]`);
  for(const key of ['cycle.c1','cycle.c2','cycle.c3','cycle.c4','cycle.c5','czType.breakzone','czType.airou'])await bump(key);
  await tab(2);
  const allCard=await canvas('cardCanvas');
  const summary=allCard.text.filter(t=>[70,560].includes(t.x)&&t.y>=752&&t.y<=936);
  assert.equal(summary.length,10);
  for(const x of [70,560])assert.deepEqual(summary.filter(t=>t.x===x).map(t=>t.y),[752,788,824,860,896]);
  const minFont=Math.min(...summary.map(t=>Number(t.font.match(/([\d.]+)px/)[1])));
  // Bold glyphs may extend left of their text origin without clipping or overlap.
  const leftOverhang=Math.max(...summary.map(t=>Math.max(0,t.x-t.left)));
  const overflow=summary.filter(t=>t.left<0||t.right>(t.x===70?560:1010));
  for(const right of summary.filter(t=>t.x===560))assert.ok(summary.find(t=>t.x===70&&t.y===right.y).right<=right.left);
  assert.ok(minFont>=16);assert.deepEqual(overflow,[]);
  assert.ok(allCard.bright>1000&&allCard.opaque===allCard.width*allCard.height);
  pass('MH all-31 summary: 5+5 rows, Y896, fitted visible bounds and pixels',{rows:summary,minFont,overflow:overflow.length,leftOverhang,lastY:Math.max(...summary.map(t=>t.y))});
  saveCanvas('mhsunbreak-all-card',allCard);await click('#detailBtn');saveCanvas('mhsunbreak-all-detail',await canvas('detailCanvas'));
  // v02: held pages stay usable, but have neither public navigation nor guide links.
  for(const id of ['juuou','paripi']){
    assert.equal((await fetch(origin+'/'+id+'-checker.html')).status,200);
    await load(id);
    assert.equal(await frame(`return d.querySelector('meta[name="robots"]').content;`),'noindex');
    assert.deepEqual(await frame(`return [...d.querySelectorAll('.hd-link')].map(e=>e.textContent);`),['← 機種選択']);
    pass(id+' held page HTTP200/noindex/no guide link');
  }
  await clear('tenten');
  await evaluate(`localStorage.setItem('tenten-checker-v1',JSON.stringify({games:1000,counts:{at:3}}));`);
  await load('tenten');
  assert.equal(await frame(`return d.querySelector('[data-c="counts.at"] .num').textContent;`),'3');
  await tab(2);assert.ok((await copy()).includes('AT初当り▶3回 1/333.3'));assert.deepEqual(await frame('return w.__errors;'),[]);
  pass('tenten legacy 1000G/AT3 survives real reload');
  await clear('tenten');
  const pairRows=[['cz.lv1d','cz.lv1n','EP LV1','成功','失敗'],['cz.lv2d','cz.lv2n','EP LV2','成功','失敗'],['cz.lv3d','cz.lv3n','EP LV3','成功','失敗'],['g150.d','g150.n','150GまでのCZ以上当選','当選','ハズレ'],['pt.d','pt.n','ポイントMAX時の報酬','当選','ハズレ']];
  for(const [den,num,label,win,miss] of pairRows){
    await tab(0);const sel=`[data-bump-many="${den},${num}"]`;
    const get=(s,p)=>p.split('.').reduce((v,k)=>v[k],s);
    await click(sel);let s=await state();assert.equal(get(s,den),1);assert.equal(get(s,num),1);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(label+' '+win));
    await tab(2);assert.ok((await copy()).includes('1/1 100%'));await click('#detailBtn');assert.ok((await canvas('detailCanvas')).text.some(t=>t.text.includes('1/1 100%')));
    await tab(0);await click('#modeBtn');
    assert.equal(await frame(`return d.querySelector(${JSON.stringify(sel)}).parentElement.lastElementChild.disabled;`),true);
    await frame(`d.querySelector(${JSON.stringify(sel)}).parentElement.lastElementChild.click();`);
    s=await state();assert.equal(get(s,den),1);assert.equal(get(s,num),1);
    await click(sel);s=await state();assert.equal(get(s,den),0);assert.equal(get(s,num),0);
    await click('#undoBtn');s=await state();assert.equal(get(s,den),1);assert.equal(get(s,num),1);
    await click('#modeBtn');await click('#undoBtn');
    await click(`[data-bump="${den}"]`);s=await state();assert.equal(get(s,den),1);assert.equal(get(s,num),0);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(label+' '+miss));
    await click('#modeBtn');await click(`[data-bump="${den}"]`);s=await state();assert.equal(get(s,den),0);assert.equal(get(s,num),0);
    await click('#modeBtn');
    pass('tenten '+label+' win/miss/minus/disabled/undo/detail');
  }
  await clear('tenten');await bump('cz.lv4');
  assert.deepEqual(await frame(`return [...d.querySelectorAll('.sumrow')].map(e=>[e.querySelector('.nm').textContent,e.querySelector('.num').textContent,e.hasAttribute('data-c')]);`),[['CZ','1',false],['成功期待度','1/1 100%',false]]);
  const beforeAuto=await state();await click('.sumrow');assert.deepEqual(await state(),beforeAuto);
  await tab(2);assert.ok((await copy()).includes('CZ▶1回'));assert.ok((await copy()).includes('EP LV4▶1回'));assert.ok((await copy()).includes('成功期待度▶1/1 100%'));
  pass('tenten LV4 counted as aggregate success; CZ is read-only');
  await tab(0);await click('[data-bump="cz.lv1d"]');await tab(2);
  assert.ok((await copy()).includes('成功期待度▶1/2 50%'));assert.ok((await copy()).includes('CZ▶2回'));
  await click('#detailBtn');assert.ok((await canvas('detailCanvas')).text.some(t=>t.text==='成功期待度 1/2 50%'));
  pass('tenten mixed CZ totals share the UI/card/detail/template denominator');
  await clear('tenten');await tab(1);await bump('screens.kokage');await bump('screens.tilty');await bump('screens.tilty');await bump('over.o1010');
  assert.deepEqual(await frame(`return [...d.querySelectorAll('[data-c^="screens."] .pct')].slice(0,2).map(e=>e.textContent);`),['1/3 33%','2/3 67%']);
  assert.equal(await frame(`return [...d.querySelectorAll('[data-c^="over."] .pct')].some(e=>e.textContent.includes('%'));`),false);
  await tab(2);await click('#detailBtn');const pctCard=await canvas('detailCanvas');
  assert.ok(pctCard.text.some(t=>t.text==='木陰の2人 ×1 (33%)'));assert.ok(pctCard.text.some(t=>t.text==='ティルティ ×2 (67%)'));assert.ok(pctCard.text.some(t=>t.text==='1010枚 OVER ×1'));
  pass('tenten screen percentages agree on input/detail; OVER has none');
  // Every certainty combination uses real production clicks (Gray code: one row changes per step).
  const certRows=[['screens.ka','可スタンプ',2],['screens.kichi','吉スタンプ',3],['screens.ryo','良スタンプ',4],['screens.yu','優スタンプ',5],['screens.goku','極スタンプ',6],['over.o222','222枚 OVER',2],['over.o333','333枚 OVER',3],['over.o456','456枚 OVER',4],['over.o1010','1010枚 OVER',5],['over.o666','666枚 OVER',6]];
  await clear('tenten');await frame('w.__gray=0;');
  for(let start=0;start<1024;start+=32){
    const output=await frame(`const defs=${JSON.stringify(certRows)};const rows=[];
      for(let i=${start};i<${start+32};i++){
        const gray=i^(i>>1),change=gray^w.__gray;
        if(change){const bit=Math.log2(change),minus=!(gray&change);d.querySelector('#nav [data-p="1"]').click();if(minus)d.getElementById('modeBtn').click();d.querySelector('[data-c="'+defs[bit][0]+'"] .plus').click();if(minus)d.getElementById('modeBtn').click();}
        d.querySelector('#nav [data-p="2"]').click();
        const cv=d.getElementById('cardCanvas'),pixels=cv.getContext('2d').getImageData(70,730,490,30).data;
        let bright=0;for(let k=0;k<pixels.length;k+=4)if(pixels[k]+pixels[k+1]+pixels[k+2]>180)bright++;
        rows.push({mask:gray,text:w.__texts.cardCanvas.find(t=>t.x===70&&t.y===752)?.text,bright});w.__gray=gray;
      }return rows;`);
    for(const r of output){const hits=certRows.filter((x,i)=>r.mask&(1<<i));const best=hits.reduce((a,b)=>!a||b[2]>a[2]?b:a,null);assert.equal(r.text,best?`確定 ${best[1]}(${best[2]===6?'6濃厚':best[2]+'以上'}) ×1`:'確定演出 なし','mask '+r.mask);assert.ok(r.bright>10);}
  }
  pass('tenten all 1024 certainty combinations via clicks, numeric rank and canvas pixels');
  await clear('tenten');await tab(1);
  for(const key of ['screens.kokage','screens.tilty','screens.ushiro','screens.nekoro',...certRows.map(r=>r[0])])await bump(key);
  await tab(0);await games(1000);await bump('counts.at');await bump('cz.lv4');
  for(const [den,num] of pairRows)await click(`[data-bump-many="${den},${num}"]`);
  await tab(2);const tc=await canvas('cardCanvas');const ts=tc.text.filter(t=>[70,560].includes(t.x)&&t.y>=752&&t.y<=936);
  assert.equal(ts.length,10);assert.deepEqual(ts.filter(t=>t.x===70).map(t=>t.y),[752,788,824,860,896]);assert.deepEqual(ts.filter(t=>t.x===560).map(t=>t.y),[752,788,824,860,896]);
  assert.ok(Math.max(...ts.map(t=>t.y))<=936);assert.ok(ts.every(t=>Number(t.font.match(/([\d.]+)px/)[1])>=16));assert.ok(ts.every(t=>t.right<=(t.x===70?560:1010)));assert.ok(tc.bright>1000);
  saveCanvas('tenten-all-card',tc);await click('#detailBtn');const td=await canvas('detailCanvas');saveCanvas('tenten-all-detail',td);assert.ok(td.bright>1000);
  for(const name of ['木陰の2人','ティルティ','2人の後ろ姿','寝転ぶ2人',...certRows.map(r=>r[1])])assert.ok(td.text.some(t=>t.text.startsWith(name+' ×')),name);
  pass('tenten all-input summary 5+5 / Y896 / min16px / no overflow / full detail / pixels',{rows:ts,ellipsis:ts.filter(t=>t.text.includes('…')).length});
  for(const width of [360,390]){await load('tenten',width,530);for(let p=0;p<3;p++){await tab(p);if(p===0){await frame(`const sec=d.querySelector('[data-bump-many="cz.lv1d,cz.lv1n"]').closest('section');sec.querySelector('details summary').click();if(!sec.querySelector('details').open)throw new Error('CZ hint did not expand');`);}await measure('tenten-populated-'+width+'-tab'+p);}}
  // Public guides: follow real links in both directions at actual viewport widths.
  for(const width of [360,390])for(const id of ['mhsunbreak','tenten']){
    await load(id,width,530);
    await click(`.hd-link[href="${id}-guide.html"]`);
    for(let i=0;i<100;i++){if(await frame(`return w.location.pathname===${JSON.stringify('/'+id+'-guide.html')}&&!!d.querySelector('main');`).catch(()=>false))break;await pause(30);}
    const layout=await frame(`return {width:w.innerWidth,scrollWidth:d.documentElement.scrollWidth,overflow:[...d.querySelectorAll('header *,main *,footer *')].filter(e=>e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>w.innerWidth+.5;}).map(e=>e.outerHTML),title:d.title,canonical:d.querySelector('[rel="canonical"]').href,og:d.querySelector('[property="og:url"]').content};`);
    assert.equal(layout.width,width);assert.ok(layout.scrollWidth<=width);assert.deepEqual(layout.overflow,[]);
    assert.equal(layout.canonical,'https://slot-tools.jp/'+id+'-guide.html');assert.equal(layout.og,layout.canonical);
    const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,id+'-'+width+'-guide.png'),Buffer.from(shot.data,'base64'));
    await click(`header a[href="${id}-checker.html"]`);
    for(let i=0;i<100;i++){if(await frame(`return w.location.pathname===${JSON.stringify('/'+id+'-checker.html')}&&!!d.querySelector('#nav [data-p]');`).catch(()=>false))break;await pause(30);}
    assert.equal(await frame('return w.location.pathname;'),'/'+id+'-checker.html');
    pass(id+' guide round-trip '+width,layout);
  }
  await clear('juuou');
  await evaluate(`localStorage.setItem('juuou-checker-v1',JSON.stringify({games:1234,counts:{sc:4}}));`);
  await load('juuou');
  const migrated=await frame(`return {start:d.querySelector('[data-number-key="gamesMysloStart"]').value,now:d.querySelector('[data-number-key="gamesMyslo"]').value,sc:d.querySelector('[data-c="counts.sc"] .num').textContent,errors:w.__errors};`);
  assert.equal(migrated.now,'1234');assert.equal(Number(migrated.start),0);assert.equal(Number(migrated.sc),4);assert.deepEqual(migrated.errors,[]);
  await tab(1);let migratedCard=await canvas('cardCanvas');assert.ok(migratedCard.text.some(t=>t.text.includes('1/308.5')));assert.ok((await copy()).includes('通常 1234G'));
  await tab(0);await games(1234);await load('juuou');
  assert.equal((await state()).gamesMyslo,1234);assert.equal((await state()).counts.sc,4);
  await tab(1);assert.ok((await copy()).includes('通常 1234G'));assert.ok((await copy()).includes('1/308.5'));
  pass('juuou legacy 1234G/SC4 migration and saved reload',migrated);
  await tab(0);
  await frame(`const e=d.querySelector('[data-number-key="gamesMysloStart"]');e.value='1500';e.dispatchEvent(new w.Event('change',{bubbles:true}));`);
  assert.ok(await frame(`return d.querySelector('.hint.warn').textContent.includes('現在が開始を下回っています');`));
  assert.ok(!await frame(`return d.querySelector('[data-c="counts.sc"]').textContent.includes('現在 1/');`));
  await tab(1);assert.ok(!/1\/\d/.test(await copy()));assert.ok(!(await canvas('cardCanvas')).text.some(t=>/1\/\d/.test(t.text)));
  await click('#detailBtn');assert.ok(!(await canvas('detailCanvas')).text.some(t=>/1\/\d/.test(t.text)));
  pass('juuou reversed pair warns and hides measured rates on all outputs');
  await tab(0);
  await frame(`const e=d.querySelector('[data-number-key="gamesMysloStart"]');e.value='1000';e.dispatchEvent(new w.Event('change',{bubbles:true}));`);
  await tab(1);assert.ok((await copy()).includes('通常 234G'));assert.ok((await copy()).includes('1/58.5'));
  pass('juuou nonzero start uses the difference on card/template');
  assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  results.push(...visualFindings);
  if(visualFindings.length){console.error('FAIL n/d label wrapping. See layout measurements and screenshots.');process.exitCode=1;}
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

// Run explicitly: node tests/magireco-remove-estimate.browser.mjs
// Real iframe viewports, production handlers, canvas pixels and clipboard boundary.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-profile-'));
const results=[];
const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(req.url==='/harness'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');
  }
  if(req.url.startsWith('/baseline/')){const file=req.url.slice('/baseline/'.length).split('?')[0];res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':'text/javascript; charset=utf-8');return res.end(execFileSync('git',['-c','safe.directory='+root,'show','6d1f3e0:'+file]));}
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
async function load(id,width=390,height=740,baseline=false){
  const slug=id==='garei_zero_re'?'garei-zero-re':id;
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+(baseline?'/baseline/':'/')+slug+'-checker.html')};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return d.querySelector('#nav button')&&w.CheckerConfigs?.[${JSON.stringify(id)}]?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  await frame(`w.__key=${JSON.stringify(id+'-checker-v1')};`);
  assert.equal(await frame('return w.innerWidth;'),width);
}
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
  const snapshot=()=>frame(`return {rows:[...d.querySelectorAll('[data-c],.cycle-row')].map(e=>({key:e.dataset.c||e.querySelector('[data-bump-many]').dataset.bumpMany,label:e.querySelector('.nm,.ct b').textContent,sub:e.querySelector('.mn,.ct small')?.textContent||''})),inputs:[...d.querySelectorAll('[data-number-key]')].map(e=>({key:e.dataset.numberKey,label:e.closest('.inrow').querySelector('label').textContent}))};`);
  const oldItems=[];
  await load('magireco',390,530,true);
  for(const source of ['unimemo','real']){
    await tab(0);await click(`[data-src="${source}"]`);oldItems.push(await snapshot());
  }
  await tab(1);oldItems.push(await snapshot());
  const legacy=await frame(`const s=JSON.parse(JSON.stringify(w.CheckerConfigs.magireco.defaults));s.gamesApp=3000;s.gamesAppTotal=4000;s.cherryApp=65;s.games=3000;let i=1;for(const g of w.CheckerConfigs.magireco.mergeKeys)for(const k of Object.keys(s[g]))s[g][k]=i++;w.CheckerConfigs.magireco.normalizeState(s);s.legacyExtra={preserve:17};s.zones.future=99;w.localStorage.setItem(w.__key,JSON.stringify(s));return s;`);
  await load('magireco',390,530,true);
  oldItems.length=0;
  for(const source of ['unimemo','real']){await tab(0);await click(`[data-src="${source}"]`);oldItems.push(await snapshot());}
  await tab(1);oldItems.push(await snapshot());
  await tab(0);await click('[data-src="unimemo"]');await tab(3);await pause(150);
  const oldCard=await canvas('cardCanvas');
  await click('#detailBtn');const oldDetail=await canvas('detailCanvas');
  await load('magireco',390,530);
  assert.equal(await frame(`return typeof w.CheckerBayes;`),'undefined');
  assert.deepEqual(await frame(`return [...d.querySelectorAll('#nav button')].map(e=>[e.dataset.p,e.textContent]);`),[['0','入力'],['1','示唆'],['2','カード']]);
  const newItems=[];
  for(const source of ['unimemo','real']){await tab(0);await click(`[data-src="${source}"]`);newItems.push(await snapshot());}
  await tab(1);newItems.push(await snapshot());
  assert.deepEqual(newItems,oldItems);
  pass('input/suggestion labels and sublabels unchanged vs 6d1f3e0',newItems.map(x=>({rows:x.rows.length,numericInputs:x.inputs.length})));
  await tab(0);await click('[data-src="unimemo"]');
  const saved=await state();
  for(const g of await frame('return w.CheckerConfigs.magireco.mergeKeys;'))assert.deepEqual(saved[g],legacy[g]);
  assert.deepEqual(saved.legacyExtra,legacy.legacyExtra);
  pass('legacy counters and unknown keys survive reload',{counterKeys:Object.values(legacy).filter(v=>v&&typeof v==='object').reduce((a,v)=>a+Object.keys(v).length,0),saved});
  await tab(2);await pause(150);
  const summary=await canvas('cardCanvas');assert.ok(summary.bright>1000&&summary.opaque===summary.width*summary.height);
  assert.ok(!summary.text.some(t=>t.text.startsWith('除外')));
  const bottom=await frame(`return w.CheckerConfigs.magireco.card.bottom({S:JSON.parse(w.localStorage.getItem(w.__key))});`);
  assert.deepEqual(bottom.columns.map(c=>c.items.length),[5,5]);assert.equal(bottom.startY+4*bottom.rowGap,896);
  const oldRows=oldCard.text.filter(t=>[70,560].includes(t.x)&&t.y>=752&&t.y<=932&&!t.text.startsWith('除外'));
  const rows=bottom.columns.flatMap((column,col)=>column.items.map((item,index)=>{
    const drawn=summary.text.find(t=>t.x===column.x&&t.y===752+index*36);
    assert.ok(drawn,item.text);const font=Number(drawn.font.match(/([\d.]+)px/)[1]);
    assert.ok(font>=16&&drawn.width<=(col===0?490:450));
    const previous=oldRows.find(t=>t.text===drawn.text);assert.ok(previous,item.text+' new truncation');
    assert.equal(drawn.font,previous.font);
    return {column:col===0?'left':'right',source:item.text,display:drawn.text,y:drawn.y,width:drawn.width,font,canvasFont:drawn.font,ellipsis:drawn.text.includes('…')};
  }));
  assert.equal(Math.max(...rows.map(r=>r.y)),896);
  assert.deepEqual(rows.filter(r=>r.ellipsis).map(r=>r.display),oldRows.filter(r=>r.text.includes('…')).map(r=>r.text));
  assert.equal(rows[9].source,'通常回転 3000G');assert.equal(rows[9].font,22);assert.equal(rows[9].ellipsis,false);
  const measured=await frame(`const x=d.getElementById('cardCanvas').getContext('2d'),prior=x.font;const widths=${JSON.stringify(rows)}.map(r=>{x.font=r.canvasFont.replace(/[\\d.]+px/,'22px');return x.measureText(r.source).width;});x.font=prior;return widths;`);
  rows.forEach((r,i)=>{r.widthAt22=measured[i];});
  pass('all populated summary: 5+5 rows, Y896, min16px, unchanged ellipsis and font sizes',rows);
  saveCanvas('magireco-card',summary);
  await click('#detailBtn');const detail=await canvas('detailCanvas');assert.ok(detail.bright>1000&&detail.opaque===detail.width*detail.height);saveCanvas('magireco-detail',detail);
  assert.equal(detail.data,oldDetail.data,'detail canvas pixels unchanged vs 6d1f3e0');
  assert.deepEqual(summary.text.filter(t=>t.text.startsWith('確定演出')),oldCard.text.filter(t=>t.text.startsWith('確定演出')));
  pass('real card/detail handlers, pixels, 5+5 rows, final Y896, exclusion absent',{card:[summary.width,summary.height],detail:[detail.width,detail.height]});
  const normal=await copy();assert.equal(normal,await frame(`return d.getElementById('tpl').value;`));
  const plain=await copy(true);assert.ok(plain.includes('→')&&!/[▶↪\uFE0E\uFE0F]/u.test(plain));
  pass('both clipboard handlers');
  await tab(0);const before=await state();await bump('counts.at');assert.equal((await state()).counts.at,before.counts.at+1);await click('#undoBtn');assert.deepEqual(await state(),before);
  await reset();assert.equal((await state()).counts.at,0);await click('#undoBtn');assert.deepEqual(await state(),before);
  pass('count, undo, double reset and undo restore');
  for(let p=0;p<3;p++){
    await tab(p);const value=await frame(`const m=d.getElementById('main');m.scrollTop=${83+p*21};m.dispatchEvent(new w.Event('scroll'));return m.scrollTop;`);
    await tab((p+1)%3);await tab(p);assert.equal(await frame('return d.getElementById("main").scrollTop;'),value);
  }
  pass('three tabs retain scroll with explicit event');
  for(const width of [360,390]){
    await load('magireco',width,530);
    for(let p=0;p<3;p++){
      await tab(p);await measure('magireco-'+width+'-tab'+p);
      const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,'magireco-'+width+'-tab'+p+'.png'),Buffer.from(shot.data,'base64'));
    }
  }
  for(const id of ['garei_zero_re','milliongod','toaru2']){
    await load(id);
    const nav=await frame(`return [...d.querySelectorAll('#nav button')].map(e=>({p:e.dataset.p,label:e.textContent}));`);
    const estimate=nav.find(e=>e.label==='設定推測');assert.ok(estimate);await tab(Number(estimate.p));
    assert.ok(await frame(`return d.getElementById('main').textContent.includes('設定推測');`));
    assert.deepEqual(await frame('return w.__errors;'),[]);
    pass(id+' estimate tab renders',{tabs:nav.length,estimateIndex:estimate.p});
  }
  assert.deepEqual(errors,[]);pass('zero browser and unhandled Promise errors');

}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack});console.error(e.stack);process.exitCode=1;}
finally{fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for offline test'},null,2));console.log('Artifacts: '+artifacts);ws?.close();browser?.kill();server.close();}

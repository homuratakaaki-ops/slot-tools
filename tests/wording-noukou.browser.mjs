// Run explicitly: node tests/wording-noukou.browser.mjs
// Real iframe viewports, production handlers, canvas pixels and clipboard boundary.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-wording-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-wording-profile-'));
const baseline=process.env.WORDING_BASELINE==='1';
const realFonts=process.env.WORDING_REAL_FONTS==='1';
const baselineSources=new Map();
if(baseline)for(const id of ['kanokari','mhsunbreak','tonski','jashinchan','mogumogu','ricorico','magireco','garei_zero_re','mieruko','aobuta','takoslot'])baselineSources.set('/checker-data/'+id+'.js',execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','3c3f807:checker-data/'+id+'.js'],{encoding:'utf8'}));
const results=[];
const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(req.url==='/harness'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');
  }
  const base=baselineSources.get(req.url.split('?')[0]);
  if(base){res.setHeader('Content-Type','text/javascript; charset=utf-8');return res.end(base);}
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
const click=selector=>frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(id,width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+'/'+id.replaceAll('_','-')+'-checker.html')};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return d.querySelector('#gIn')&&w.CheckerConfigs?.[${JSON.stringify(id)}]?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  await frame(`w.__key=w.CheckerConfigs[${JSON.stringify(id)}].storageKey;`);
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function clear(id,width=390){
  await evaluate(`localStorage.removeItem(${JSON.stringify(id.replaceAll('_','-')+'-checker-v1')});`);
  await load(id,width);
}
async function bump(key){await click(`[data-c="${key}"] .plus`);}
async function canvas(id){
  return frame(`const cv=d.getElementById(${JSON.stringify(id)});const x=cv.getContext('2d');const a=x.getImageData(0,0,cv.width,cv.height).data;let opaque=0,bright=0;for(let i=0;i<a.length;i+=4){if(a[i+3])opaque++;if(a[i]+a[i+1]+a[i+2]>180)bright++;}return {width:cv.width,height:cv.height,opaque,bright,text:w.__texts[cv.id]||[],data:cv.toDataURL()};`);
}
function saveCanvas(name,c){fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(c.data.split(',')[1],'base64'));}
async function copy(plain=false){await click(plain?'#cpPlainBtn':'#cpBtn');return frame('return w.__clipboard;');}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name);}

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
      if(realFonts&&/^https:\/\/(fonts.googleapis.com|fonts.gstatic.com)\//.test(m.params.request.url)){
        await send('Fetch.continueRequest',{requestId:m.params.requestId});return;
      }
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

  for(const id of ['kanokari','mhsunbreak','tonski','jashinchan','mogumogu','ricorico','magireco','garei_zero_re','mieruko','aobuta','takoslot']){
    await clear(id);
    // Seed an exhaustive saved-data fixture, then render it through the real reload and card button.
    const inputCount=await frame(`const S=JSON.parse(JSON.stringify(w.CheckerConfigs[${JSON.stringify(id)}].defaults));let count=0;
      const fill=o=>{for(const [key,value] of Object.entries(o)){if(typeof value==='number'){o[key]=1;count++;}else if(value&&typeof value==='object'&&!Array.isArray(value))fill(value);}};
      fill(S);w.localStorage.setItem(w.__key,JSON.stringify(S));return count;`);
    await load(id);
    const cardTab=await frame(`return [...d.querySelectorAll('#nav [data-p]')].find(e=>e.textContent.includes('カード')).dataset.p;`);
    await frame(`await Promise.all([d.fonts.load("800 22px 'M PLUS 1p'"),d.fonts.load("700 20px 'M PLUS 1p'"),d.fonts.load("400 22px 'DotGothic16'")]);await d.fonts.ready;`);
    // Re-enter through the production card tab after fonts have loaded.
    await tab(0);await tab(Number(cardTab));await pause(150);
    const c=await canvas('cardCanvas');saveCanvas(id+'-all-card',c);
    const rows=c.text.filter(t=>[70,560].includes(t.x)&&t.y>720&&t.y<976);
    const ellipsis=rows.filter(t=>t.text.includes('…'));
    const lastY=Math.max(...rows.map(t=>t.y));
    const longest=rows.reduce((a,b)=>a.width>b.width?a:b);
    const fontStatus=await frame(`return [...d.fonts].filter(f=>['M PLUS 1p','DotGothic16'].includes(f.family.replaceAll('"',''))).map(f=>({family:f.family,weight:f.weight,status:f.status}));`);
    const fontsLoaded=fontStatus.some(f=>f.family.includes('M PLUS 1p')&&f.weight==='800'&&f.status==='loaded');
    if(realFonts)assert.ok(fontsLoaded,id+' real Web font required: '+JSON.stringify(fontStatus));
    assert.ok(c.bright>1000&&c.opaque===c.width*c.height,id+' canvas pixels');
    assert.ok(rows.length>0,id+' rendered summary rows');
    const entry={name:id+' all-input summary',status:ellipsis.length===0&&lastY<=936?'PASS':'FAIL',inputCount,lastY,longest,ellipsis,rows,fontsLoaded,fontStatus,pixels:{opaque:c.opaque,bright:c.bright}};
    results.push(entry);console.log(entry.status+' '+id+' inputs='+inputCount+' lastY='+lastY+' ellipsis='+ellipsis.length);
    if(entry.status==='FAIL')process.exitCode=1;
    await click('#detailBtn');const detail=await canvas('detailCanvas');saveCanvas(id+'-all-detail',detail);
    assert.ok(detail.bright>1000,id+' detail pixels');
    const template=await copy();fs.writeFileSync(path.join(artifacts,id+'-all-template.txt'),template);
    if(id==='magireco'&&!baseline){
      assert.ok(!template.includes('全て降順（'));
      assert.ok(template.includes('全て降順▶'));
      // The all-input card selects a higher rank; check the specific story alone through the actual button.
      await clear(id);await tab(1);await bump('story.descAll');await tab(Number(cardTab));
      const one=await canvas('cardCanvas');assert.ok(one.text.some(t=>t.text==='確定演出 全て降順(5以上) ×1'));saveCanvas(id+'-descAll-card',one);
      await click('#detailBtn');const oneDetail=await canvas('detailCanvas');saveCanvas(id+'-descAll-detail',oneDetail);
      assert.ok(oneDetail.text.some(t=>t.text.includes('全て降順')));assert.ok(!oneDetail.text.some(t=>t.text.includes('全て降順（')));
      pass('magireco descAll real card/detail/template no duplicated hint');
    }
    assert.deepEqual(await frame('return w.__errors;'),[]);
  }
  assert.deepEqual(errors,[]);pass('all browser console and unhandled rejection errors = 0');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({baseline,realFonts,results,errors,externalResources:realFonts?'Ads and analytics fulfilled empty; real Google Fonts required':'Ads, analytics and Google Fonts fulfilled empty; fallback font measurements only'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

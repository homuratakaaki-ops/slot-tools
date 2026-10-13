// Run explicitly: node tests/mhsunbreak-bz-step3-label.browser.mjs
// BZ step 3: real clicks, bounded labels, unchanged result buttons.
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
const realFonts=process.env.STEP3_REAL_FONTS==='1';
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
    window.__errors=[];
    window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));console.error('unhandledrejection',String(e.reason));});
    window.addEventListener('error',e=>window.__errors.push(e.message));
  `});
  await send('Page.navigate',{url:origin+'/harness'});await pause(100);
  const geometry=()=>frame(`const row=d.querySelector('.pick-row');return [...row.querySelectorAll('button')].map(e=>{const r=e.getBoundingClientRect(),p=row.getBoundingClientRect();return {text:e.textContent,aria:e.getAttribute('aria-label'),x:r.x,y:r.y-p.y,width:r.width,height:r.height};});`);
  for(const width of [360,390,412]){
    await clear('mhsunbreak',width);await tab(2);
    if(realFonts){
      const loaded=await frame(`const faces=await d.fonts.load('700 12px "M PLUS 1p"','⑤ オロミドロ亜種 ・ 結果 10個目 ＋G ⑥ テオ・テスカトル');await d.fonts.ready;return faces.length>0&&faces.every(f=>f.status==='loaded');`);
      assert.ok(loaded,'real Web font must load');
    }
    assert.equal(await frame('return d.querySelector(".pick-row .nm").textContent;'),'テーブルを選んでください');
    for(const [table,pos,expected] of [
      ['t5','10','⑤ オロミドロ亜種 ・ 結果 10個目 ＋G'],
      ['t6','2','⑥ テオ・テスカトル ・ 結果 2個目 テオ'],
      ['t3','3','③ ライゼクス ・ 結果 3個目 セル'],
    ]){
      await click('[data-action="bzPick"][data-q="'+table+'"]');
      const before=await geometry(),saved=await state();
      const tableColor=await frame('return w.getComputedStyle(d.querySelector(".pick-row .nm")).color;');
      await click('[data-action="bzPickPos"][data-pos="'+pos+'"]');
      assert.deepEqual(await state(),saved);
      assert.deepEqual(await geometry(),before,'result button geometry/aria unchanged');
      await frame('d.querySelector(".pick-row").scrollIntoView({block:"center"});');
      const metrics=await frame(`
        const row=d.querySelector('.pick-row'),label=row.querySelector('.lbl'),nm=label.querySelector('.nm');
        const blocks=[...nm.children].map(e=>({text:e.textContent,rect:e.getBoundingClientRect().toJSON(),nowrap:w.getComputedStyle(e).whiteSpace,color:w.getComputedStyle(e).color}));
        return {width:w.innerWidth,text:nm.textContent,lines:new Set(blocks.map(b=>b.rect.top)).size,
          label:{scrollWidth:label.scrollWidth,clientWidth:label.clientWidth},
          row:{scrollWidth:row.scrollWidth,clientWidth:row.clientWidth,rect:row.getBoundingClientRect().toJSON()},blocks,
          step2:d.querySelector('.pos-done .nm').textContent,
          resultColor:w.getComputedStyle(d.querySelector('.pos-done .nm')).color};
      `);
      assert.equal(metrics.width,width);assert.equal(metrics.text,expected);
      assert.ok([1,2].includes(metrics.lines));
      assert.ok(metrics.label.scrollWidth<=metrics.label.clientWidth);
      assert.ok(metrics.row.scrollWidth<=metrics.row.clientWidth);
      assert.ok(metrics.row.rect.left>=0&&metrics.row.rect.right<=width);
      assert.ok(metrics.blocks.every(b=>b.nowrap==='nowrap'&&b.rect.width<=metrics.label.clientWidth));
      assert.equal(metrics.blocks[0].color,tableColor);
      assert.equal(metrics.blocks[1].color,metrics.resultColor);
      assert.equal(metrics.step2,'選択済み：'+pos+'個目・'+expected.split(' ').at(-1));
      results.push(metrics);console.log('MEASURE '+JSON.stringify(metrics));
      const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
      fs.writeFileSync(path.join(artifacts,'step3-'+width+'-'+table+'.png'),Buffer.from(shot.data,'base64'));
    }
    await click('[data-action="bzPick"][data-q="t7"]');
    assert.equal(await frame('return d.querySelector(".pick-row .nm").textContent;'),'⑦ AT');
    assert.equal(await frame('return d.querySelectorAll(".pick-result-label").length;'),0);
    assert.deepEqual(await frame('return w.__errors;'),[]);
  }
  assert.deepEqual(errors,[]);console.log('PASS step3 browser: 9 cases, 3 widths');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,realFonts,externalResources:realFonts?'Real Google Fonts; ads/analytics blocked':'External requests fulfilled empty; fallback font measurements'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

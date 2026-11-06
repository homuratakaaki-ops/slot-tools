// node tests/addl-1106b.browser.mjs — ローカルのみ。11/6 追加解析の本番反映（?v=20261106-addl）を本番ページ・本番キー（関連キーも本番名）で見る。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'slot-addl-1106b-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-addl-1106b-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const IDS=['godzieva2','mhsunbreak'];let KEY='',PAGE='';const errors=[],measures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;
let browser,ws,seq=0,checks=0,failures=0;const pending=new Map();
function send(method,params={}){
  const id=++seq;return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},20000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;
}
const run=code=>evaluate(`(async()=>{const d=document,w=window;${code}})()`);
const state=()=>run(`return JSON.parse(localStorage.getItem(${JSON.stringify(KEY)}));`);
const click=selector=>run(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
const plus=key=>click(`[data-c="${key}"] .plus`);
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(80);}
async function load(width=360,page=PAGE){
  await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  let ready=false;
  for(let i=0;i<150;i++){
    ready=await run(`return location.pathname===${JSON.stringify(page)}&&document.readyState==='complete'&&!!d.querySelector(${JSON.stringify(page.includes('guide')?'main.container':'#main .sec')});`).catch(()=>false);
    if(ready)break;await pause(40);
  }
  assert.ok(ready,'page ready');assert.equal(await run('return innerWidth;'),width);
}
async function seed(S,width=360){await run(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(S))});`);await load(width);}
async function shot(name,width){const r=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));}
function pass(name){checks++;console.log('PASS '+name);}
async function layout(width,label,p){
  const m=await run(`const W=innerWidth,main=d.getElementById('main');
    const bad=[...d.querySelectorAll('header,nav,#main,#main *')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width>0&&(r.right>W||r.left<0)&&!e.closest('details:not([open])')&&!e.closest('.jump-nav');
    }).map(e=>(e.className||e.tagName)+':'+e.textContent.trim().slice(0,25));
    const taps=[...d.querySelectorAll('button')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('details:not([open])')).map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height}));
    return {width:W,documentWidth:d.documentElement.scrollWidth,scroll:main.scrollWidth-main.clientWidth,bad,taps};`);
  assert.equal(m.width,width);assert.ok(m.documentWidth<=width);assert.equal(m.scroll,0,JSON.stringify({width,label,p,scroll:m.scroll}));assert.deepEqual(m.bad,[],JSON.stringify({width,label,p,bad:m.bad}));
  assert.ok(m.taps.length>0);assert.ok(m.taps.every(t=>t.height>=44),JSON.stringify(m.taps.filter(t=>t.height<44)));
  // 通常crowでは折り返し可。role-rowを追加する場合の寸法確認。
  const wraps=await run(`return [...d.querySelectorAll('.role-row .ct small')].filter(e=>e.getBoundingClientRect().width>0&&e.getClientRects().length>1).map(e=>e.textContent);`);
  assert.deepEqual(wraps,[],JSON.stringify({width,label,p,wraps}));
  measures.push({page:PAGE,width,label,tab:p,minButtonHeight:Math.min(...m.taps.map(t=>t.height)),overflow:m.scroll});
}
async function canvas(id,name){
  const data=await run(`await document.fonts.ready;const cv=d.getElementById(${JSON.stringify(id)});const ctx=cv.getContext('2d');const pixels=ctx.getImageData(0,0,cv.width,cv.height).data;let bright=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]+pixels[i+1]+pixels[i+2]>180)bright++;return {width:cv.width,height:cv.height,bright,png:cv.toDataURL('image/png'),texts:window.__texts[${JSON.stringify(id)}]||[]};`);
  assert.ok(data.width>0&&data.height>0&&data.bright>1000,JSON.stringify({...data,png:undefined}));
  const bytes=Buffer.from(data.png.split(',')[1],'base64');assert.equal(bytes.subarray(1,4).toString(),'PNG');fs.writeFileSync(path.join(artifacts,name+'.png'),bytes);return data;
}
try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.on('error',e=>errors.push(e.message));
  for(let i=0;i<150&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
  ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  ws.onmessage=event=>{
    const m=JSON.parse(event.data);
    if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
    if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);
    if(m.method==='Fetch.requestPaused')send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
  };
  await send('Page.enable');await send('Runtime.enable');await send('Fetch.enable',{patterns:[{urlPattern:'https://*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__errors=[];window.__texts={};window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    addEventListener('error',e=>window.__errors.push(e.message));addEventListener('unhandledrejection',e=>window.__errors.push(String(e.reason)));
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){(window.__texts[this.canvas.id]??=[]).push({text:String(text),x,y,w:this.measureText(String(text)).width,font:this.font});return original.call(this,text,x,y,...args);};
  `});
  for(const id of IDS){
    KEY=id+'-checker-v1';PAGE='/'+id+'-checker.html';
    await load();
    const defaults=await run('return CheckerConfigs['+JSON.stringify(id)+'].defaults;');
    const old=structuredClone(defaults);delete old.endVoice;delete old.kareCut;
    if(id==='godzieva2'){for(const k of ['mari','rei','kaji'])delete old.edVoice[k];old.gameLog=[300,700];}
    old.games=9;old.iconChoice='default';
    const unknown={str:'keep',num:2.5,neg:-3,bool:false,nul:null,arr:[1,'a',{x:1}],obj:{deep:{v:'x'}}};
    Object.assign(old,unknown);
    const groups=await run('return CheckerConfigs['+JSON.stringify(id)+'].mergeKeys;');
    for(const g of groups.filter(k=>old[k]&&k!=='bzBase')){for(const k of Object.keys(old[g]))old[g][k]=4;Object.assign(old[g],unknown);}
    if(id==='mhsunbreak'){for(const k of Object.keys(defaults.cycleD))old.cycleD[k]=8;Object.assign(old.bzBase,unknown);for(const g of ['bzT1','bzT2','questN1','questN2'])Object.assign(old.bzBase[g],unknown);}
    // 0以外の既存本番データ（知らない項目入り）を本番キーに置く。関連キーは本番名のものだけを読み書きし、テスト版の名残（-test 付き）には触らない。
    const production=JSON.stringify(old);
    const related=Object.fromEntries((id==='mhsunbreak'?['-bztransfer-backup','-bak']:['-bak']).map(x=>[id+'-checker-v1'+x,JSON.stringify({related:x,keep:7})]));
    const leftovers=Object.fromEntries(['','-prefs','-pre-ext','-bztransfer-backup','-bak'].map(x=>[id+'-checker-v1-test'+x,JSON.stringify({test:x,keep:7})]));
    await run('for(const [k,v] of Object.entries('+JSON.stringify({...related,...leftovers})+'))localStorage.setItem(k,v);');
    await seed(old);
    // 起動だけでは保存文字列を変えない。
    assert.equal(await run('return localStorage.getItem('+JSON.stringify(KEY)+');'),production);
    await tab(1);
    const newKeys=id==='godzieva2'?['endVoice.shinji','endVoice.asuka','endVoice.misato','endVoice.ritsuko','endVoice.mari','edVoice.mari','edVoice.rei','edVoice.kaji']:['kareCut.entalion'];
    for(const key of newKeys)assert.equal(await run('return d.querySelector('+JSON.stringify('[data-c="'+key+'"] .num')+').textContent;'),'0');
    for(const key of newKeys){await plus(key);const one=await state();await plus(key);await click('#undoBtn');assert.deepEqual(await state(),one);await click('#modeBtn');await plus(key);assert.equal(key.split('.').reduce((o,k)=>o[k],await state()),0);await click('#undoBtn');assert.deepEqual(await state(),one);await click('#modeBtn');}
    for(const [k,v] of Object.entries(unknown)){const cur=await state();assert.deepEqual(cur[k],v);for(const g of groups.filter(k=>old[k]&&k!=='bzBase'))assert.deepEqual(cur[g][k],v,id+' '+g+'.'+k);}
    for(const g of groups.filter(k=>old[k]&&k!=='bzBase'))for(const k of Object.keys(defaults[g]))if(k in old[g])assert.equal((await state())[g][k],old[g][k],g+'.'+k);
    if(id==='mhsunbreak'){const cur=await state();for(const [k,v] of Object.entries(unknown)){assert.deepEqual(cur.bzBase[k],v);for(const g of ['bzT1','bzT2','questN1','questN2'])assert.deepEqual(cur.bzBase[g][k],v);}}
    pass(id+' old data / unknown types / new zero / plus / minus / undo');
    await tab(0);
    const rate=id==='godzieva2'?['suika.normalD','suika.normalW']:['bz.weakNormalD','bz.weakNormalN'];
    const before=await state();
    await click('[data-bump-many="'+rate.join(',')+'"]');await click('#undoBtn');assert.deepEqual(await state(),before);
    await click('[data-bump="'+rate[0]+'"]');await click('#undoBtn');assert.deepEqual(await state(),before);
    // 通常入力を取り消しても先に記録した新項目は残る。
    for(const key of newKeys)assert.equal(key.split('.').reduce((o,k)=>o[k],await state()),1);
    await click('#modeBtn');await click('[data-bump-many="'+rate.join(',')+'"]');await click('#undoBtn');assert.deepEqual(await state(),before);await click('#modeBtn');
    await load();assert.deepEqual(await state(),before);
    for(let p=0;p<4;p++){
      await tab(p);
      if(id==='mhsunbreak'){
        assert.equal(await run('return d.querySelectorAll("#nav [data-p]").length;'),4);
        const count=await run('return [...d.querySelectorAll("details.hint-fold")].filter(e=>e.querySelector(".analysis-table")).length;');
        assert.equal(count,p===0?3:p===2?1:0);
        await run('for(const e of d.querySelectorAll("details.hint-fold"))if(e.querySelector(".analysis-table")&&!e.open)e.querySelector("summary").click();');
        const cells=await run('return [...d.querySelectorAll(".analysis-table td")].filter(e=>e.scrollWidth>e.clientWidth).map(e=>e.textContent);');assert.deepEqual(cells,[]);
        const styles=await run('return [...d.querySelectorAll(".analysis-table")].map(e=>({layout:getComputedStyle(e).tableLayout,border:getComputedStyle(e).borderCollapse,width:e.getBoundingClientRect().width,parent:e.parentElement.getBoundingClientRect().width}));');
        assert.ok(styles.every(s=>s.layout==='fixed'&&s.border==='collapse'&&Math.abs(s.width-s.parent)<1));
        const tableCount=await run('return d.querySelectorAll(".analysis-table").length;');
        for(let t=0;t<tableCount;t++){await run('d.querySelectorAll(".analysis-table")['+t+'].scrollIntoView({block:"start"});');await shot('mhsunbreak-table-'+p+'-'+t+'-360',360);}
      }
      await shot(id+'-'+p+'-360',360);
      try{await layout(360,'old-data',p);}catch(e){failures++;console.error('LAYOUT '+id+' tab '+p+': '+e.message);process.exitCode=1;}
    }
    if(id==='mhsunbreak'){
      // 本番名の引き継ぎ控え（-bztransfer-backup）を読んで、取り消しの導線を出す。
      await tab(2);assert.ok((await run('return d.getElementById("main").textContent;')).includes('直前の引き継ぎを確認・取り消す'));
      const toggle=await run('return !!d.querySelector("[data-action=tplAtLog]");');
      if(toggle)await click('[data-action=tplAtLog]');
      // 拡張前の形の保存は、本番名の -pre-ext に読んだ文字列のまま1回だけ控える。
      assert.equal(await run('return localStorage.getItem("mhsunbreak-checker-v1-pre-ext");'),production);
    }
    await tab(0);
    if(id==='mhsunbreak'){
      await run('d.querySelector(".bz-row").scrollIntoView({block:"start"});');await pause(1800);await shot('mhsunbreak-bz-guide-360',360);
      const wraps=await run('return [...d.querySelectorAll(".bz-row .ct small, .cz-row .mn")].filter(el=>el.querySelector("wbr")).map(el=>({text:el.textContent,parts:[...el.querySelectorAll("span")].map(span=>{const range=d.createRange();range.selectNodeContents(span);return {text:span.textContent,lines:range.getClientRects().length,nowrap:getComputedStyle(span).whiteSpace};})}));');
      measures.push({page:PAGE,width:360,bzGuide:wraps});
      try{assert.ok(wraps.length===6&&wraps.every(x=>x.parts.length===2&&x.parts[0].text.endsWith('⇔')&&x.parts.every(p=>p.lines===1&&p.nowrap==='nowrap')),'目安の設6表記が行途中で分断: '+JSON.stringify(wraps));}catch(e){failures++;console.error('LAYOUT '+e.message);process.exitCode=1;}
      await run('const e=[...d.querySelectorAll(".sec")].find(e=>e.textContent.includes("規定周期から"));e?.scrollIntoView({block:"start"});');await shot('mhsunbreak-cz-guide-360',360);
    }
    if(id==='godzieva2'){
      for(const [group,label] of [['endScreen','終了カヲル'],['edVoice','EDカヲル']]){
        const only=structuredClone(defaults);await seed(only);await tab(1);await plus(group+'.kaworu');await tab(3);await pause(250);
        const card=await canvas('cardCanvas',id+'-'+group);assert.ok(card.texts.some(t=>t.text.includes(label+'(6濃厚)')));
      }
    }
    await tab(3);await pause(250);await canvas('cardCanvas',id+'-summary');
    // 全項目入りは共通エンジンの40行上限で省略される。新項目単独でも実描画を確認する。
    const focused=structuredClone(defaults);if(id==='godzieva2'){focused.endVoice.mari=1;focused.edVoice.rei=1;}else focused.kareCut.entalion=1;
    await seed(focused);await tab(3);
    await click('#detailBtn');await pause(250);const detail=await canvas('detailCanvas',id+'-detail');
    assert.ok(detail.texts.some(x=>x.text.includes(id==='godzieva2'?'終了ボイス':'狩れカットイン')));
    assert.deepEqual(await run('return window.__errors;'),[]);
    const after=await run('return Object.fromEntries(Object.entries(localStorage));');
    for(const [k,v] of Object.entries({...related,...leftovers}))assert.equal(after[k],v,k+' はバイト一致');
    assert.deepEqual(Object.keys(after).filter(k=>k.startsWith(id+'-checker-v1-test')).sort(),Object.keys(leftovers).sort(),'-test 付きのキーを新しく作らない');
    pass(id+' production key / related keys by production name / test keys untouched / count rollback / card pixels');
    await seed({});
    for(let p=0;p<4;p++){await tab(p);try{await layout(360,'empty',p);}catch(e){failures++;console.error('LAYOUT empty '+id+' tab '+p+': '+e.message);process.exitCode=1;}}
    pass(id+' empty tabs');
  }
  assert.deepEqual(errors,[]);
}catch(e){failures++;console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,failures,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks} passed / ${failures} failed; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

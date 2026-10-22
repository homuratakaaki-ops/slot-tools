// Run explicitly: node tests/mhsunbreak-setting-diff.browser.mjs
// 規定リプレイ周期の3ボタン・CZ種別の契機別表示・獲得アイコン別のクエスト成功率（2026/10/22）の実表示と実操作。
// 320/360/390/412px で押しやすさ（48px以上）と横はみ出しを測り、入力タブとBZタブの縦の長さを改修前（3fd3f65）と比べる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE='3fd3f65';   // 改修前の main（PR #78 のマージ）
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-1022-results-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-1022-profile-'));
// 改修前のツリー（比較に使う3ファイルだけ）
const beforeRoot=fs.mkdtempSync(path.join(os.tmpdir(),'slot-1022-before-'));
for(const file of ['mhsunbreak-checker.html','checker-engine.js','checker-data/mhsunbreak.js']){
  fs.mkdirSync(path.dirname(path.join(beforeRoot,file)),{recursive:true});
  fs.writeFileSync(path.join(beforeRoot,file),execFileSync('git',['show',BASE+':'+file],{cwd:root,maxBuffer:4e6}));
}
const results=[];
const errors=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const server=http.createServer((req,res)=>{
  if(req.url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(req.url==='/harness'){
    res.setHeader('Content-Type','text/html; charset=utf-8');
    return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px;display:block"></iframe></body></html>');
  }
  let url=decodeURIComponent(req.url.split('?')[0]),base=root;
  if(url.startsWith('/__before/')){base=beforeRoot;url=url.slice('/__before'.length);}
  const file=path.resolve(base,'.'+url);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}
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
const KEY='mhsunbreak-checker-v1';
const frame=code=>evaluate(`(async()=>{const w=document.getElementById('frame').contentWindow;const d=w.document;${code}})()`);
const state=()=>frame(`return JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}));`);
const click=async selector=>{
  await frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});if(el.disabled)throw Error('Disabled '+${JSON.stringify(selector)});el.click();`);
  await pause(30);
};
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(width=390,height=740,before=false){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+(before?'/__before':'')+'/mhsunbreak-checker.html')};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return d.querySelector('#hitIn')&&w.CheckerConfigs?.mhsunbreak?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function seed(data){await evaluate(data===null?`localStorage.removeItem(${JSON.stringify(KEY)})`:`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(data))})`);}
async function template(){await tab(3);const t=await frame('return d.getElementById("tpl").value;');await tab(0);return t;}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name+(detail!==undefined?' '+JSON.stringify(detail):''));}
const rowText=label=>frame(`const b=[...d.querySelectorAll('.cyc3 .ct b')].find(e=>e.textContent===${JSON.stringify(label)});return b?[...b.parentElement.querySelectorAll('small')].map(s=>s.textContent):null;`);
// 旧データ（新キーなし）。cycle・czType・レア役BZ に値があり、結果アイコン付きのBZ記録もある
const bz=(table,r,pos)=>Object.assign({t:'bz',table,r},pos?{pos}:{});
const OLD={hits:[120,480],counts:{at:2},bz:{weakNormalD:20,weakNormalN:3,strongNormalD:8,strongNormalN:4},
  cycle:{c1:2,c2:1,c3:3,c4:0,c5:1},czType:{breakzone:12,airou:4},atEnd:{jay:1},
  atLog:{sessions:[{start:{known:true,prior:0},events:[bz('t1','miss',1),bz('t2','miss',3),bz('t3','miss'),bz('t4','win',2)],closed:true},{start:{known:true,prior:0},events:[],closed:false}]}};
async function layout(name,width){
  const r=await frame(`const W=w.innerWidth;
    const all=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.checkVisibility()&&!e.closest('.jump-nav,.ev-scroll'));
    const over=all.filter(e=>e.getBoundingClientRect().right>W+0.5).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,30),right:e.getBoundingClientRect().right}));
    const btns=[...d.querySelectorAll('.cyc3 .cycle-btn,.cyc-fix .cycle-btn')].map(e=>({label:e.getAttribute('aria-label'),h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width}));
    const clipped=[...d.querySelectorAll('.cyc3 .ct b,.cyc3 .ct small,.cyc3 .cycle-btn,.qi-row span,.qi-head span,.cz-row .nm,.cz-row .mn')].filter(e=>e.checkVisibility()&&e.scrollWidth>e.clientWidth+1).map(e=>e.textContent);
    return {width:W,bodyScroll:d.body.scrollWidth,over,btns,clipped};`);
  assert.equal(r.bodyScroll,width,name+' body.scrollWidth');
  assert.deepEqual(r.over,[],name+' horizontal overflow');
  assert.deepEqual(r.clipped,[],name+' clipped text');
  if(r.btns.length){
    assert.ok(r.btns.every(b=>b.h>=48),name+' button below 48px: '+JSON.stringify(r.btns.filter(b=>b.h<48)));
    assert.ok(r.btns.every(b=>b.w>=44),name+' button narrower than 44px: '+JSON.stringify(r.btns.filter(b=>b.w<44)));
  }
  return {minH:r.btns.length?Math.min(...r.btns.map(b=>b.h)):null,minW:r.btns.length?Math.min(...r.btns.map(b=>Math.round(b.w))):null,buttons:r.btns.length};
}
async function mainHeight(){return frame('return d.getElementById("main").scrollHeight;');}
async function openTotals(){await frame(`const s=[...d.querySelectorAll('details.bz-fold>summary')].find(e=>e.textContent.startsWith('集計'));if(!s)throw Error('no totals');if(!s.parentElement.open)s.click();`);await pause(60);}
async function shot(name,width){
  // main の中身を全部見せる高さにしてから撮る
  const h=await frame(`const m=d.getElementById('main');return m.scrollHeight+(d.querySelector('header').offsetHeight)+(d.getElementById('nav').offsetHeight)+8;`);
  await evaluate(`document.getElementById('frame').style.height='${h}px'`);await pause(150);
  const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width,height:h,scale:1}});
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));
  await evaluate(`document.getElementById('frame').style.height='740px'`);await pause(80);
  return h;
}
// 一部分だけを原寸で撮る（from の上端〜to の下端）
async function shotPart(name,width,from,to){
  const h=await frame(`const m=d.getElementById('main');return m.scrollHeight+(d.querySelector('header').offsetHeight)+(d.getElementById('nav').offsetHeight)+8;`);
  await evaluate(`document.getElementById('frame').style.height='${h}px'`);await pause(150);
  const r=await frame(`const a=${from},b=${to};if(!a||!b)throw Error('no part');return {top:a.getBoundingClientRect().top,bottom:b.getBoundingClientRect().bottom};`);
  const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:Math.max(0,r.top-8),width,height:r.bottom-r.top+16,scale:1}});
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));
  await evaluate(`document.getElementById('frame').style.height='740px'`);await pause(80);
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
      // 広告・解析・Webフォントは空で返す（オフライン試験）
      await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
    }
  };
  await send('Page.enable');await send('Runtime.enable');await send('Log.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'https://*'},{urlPattern:'http://www.*'}]});
  await send('Emulation.setDeviceMetricsOverride',{width:1200,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__errors=[];window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;
    window.addEventListener('unhandledrejection',e=>{window.__errors.push(String(e.reason));});
    window.addEventListener('error',e=>window.__errors.push(e.message));
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}});
  `});
  await send('Page.navigate',{url:origin+'/harness'});await pause(150);

  // ===== 1. 3ボタンの実操作（390px）=====
  await seed(null);await load(390);
  const t0=await template();
  await click('[aria-label="①周期 BZ"]');
  let S=await state();
  assert.deepEqual([S.cycleD.c1,S.cycleBz.c1,S.cycleFuku.c1],[1,1,0]);
  assert.deepEqual(await rowText('①周期'),['1/1 100%']);
  let t=await template();
  assert.match(t,/①周期▶︎ 1回/);assert.match(t,/ブレイクゾーン▶︎ 1回\nアイルー福引　▶︎ 0回/);
  await click('#undoBtn');S=await state();
  assert.deepEqual([S.cycleD.c1,S.cycleBz.c1],[0,0]);assert.deepEqual(await rowText('①周期'),['0/0 —']);
  assert.equal(await template(),t0);
  pass('［BZ］→表示・テンプレ・取消（テンプレは押す前とバイト一致）');
  await click('[aria-label="②周期 福引"]');await click('[aria-label="③周期 ハズレ"]');await click('[aria-label="③周期 ハズレ"]');await click('[aria-label="③周期 BZ"]');
  S=await state();
  assert.deepEqual([S.cycleD.c2,S.cycleFuku.c2,S.cycleD.c3,S.cycleBz.c3],[1,1,3,1]);
  assert.deepEqual(await rowText('②周期'),['1/1 100%']);assert.deepEqual(await rowText('③周期'),['1/3 33%']);
  t=await template();
  assert.match(t,/①周期▶︎ 0回　②周期▶︎ 1回\n③周期▶︎ 1回/);assert.match(t,/ブレイクゾーン▶︎ 1回\nアイルー福引　▶︎ 1回/);
  await click('#undoBtn');S=await state();assert.deepEqual([S.cycleD.c3,S.cycleBz.c3],[2,0]);
  await click('#undoBtn');S=await state();assert.equal(S.cycleD.c3,1);
  pass('［福引］［ハズレ］→表示・テンプレ・取消は押したキーだけ戻す');
  await load(390);
  S=await state();assert.deepEqual([S.cycleD.c2,S.cycleFuku.c2,S.cycleD.c3],[1,1,1]);
  assert.deepEqual(await rowText('②周期'),['1/1 100%']);assert.deepEqual(await rowText('③周期'),['0/1 0%']);
  pass('再読み込み後も保持');
  // 減算：押したボタンのキーだけを1減らす。崩れる減算は押せない
  await click('#modeBtn');
  const disabled=label=>frame(`return d.querySelector('[aria-label="${label}"]').disabled;`);
  assert.equal(await disabled('②周期 BZ'),true);assert.equal(await disabled('②周期 ハズレ'),true);assert.equal(await disabled('②周期 福引'),false);
  assert.equal(await disabled('③周期 ハズレ'),false);assert.equal(await disabled('①周期 ハズレ'),true);
  await click('[aria-label="③周期 ハズレ"]');S=await state();assert.equal(S.cycleD.c3,0);
  assert.equal(await disabled('③周期 ハズレ'),true);
  await click('[aria-label="②周期 福引"]');S=await state();assert.deepEqual([S.cycleD.c2,S.cycleFuku.c2],[0,0]);
  await click('#undoBtn');S=await state();assert.deepEqual([S.cycleD.c2,S.cycleFuku.c2],[1,1]);
  await click('#modeBtn');
  pass('減算で当選≦到達が崩れない（崩れるボタンは無効）・減算の取消');
  // 天井
  await click('[data-c="czTenjo"] .plus');S=await state();assert.equal(S.czTenjo,1);
  assert.match(await template(),/ブレイクゾーン▶︎ 1回\nアイルー福引　▶︎ 1回/);
  pass('天井（CZ間333G＋α）のBZがテンプレの合計に入る');

  // ===== 2. 旧データ：保持・表示・減算でだけ減らせる =====
  await seed(OLD);await load(390);
  assert.deepEqual(await rowText('①周期'),['2/2 100%','うち種別未記録 2']);
  assert.deepEqual(await rowText('④周期'),['0/0 —']);
  assert.equal(await frame(`return d.querySelectorAll('[data-bump="cycle.c1"]').length;`),0);
  const tOld=await template();
  assert.match(tOld,/①周期▶︎ 2回　②周期▶︎ 1回\n③周期▶︎ 3回　④周期▶︎ 0回\n⑤周期▶︎ 1回/);
  assert.match(tOld,/ブレイクゾーン▶︎ 12回\nアイルー福引　▶︎ 4回/);
  await click('[aria-label="①周期 ハズレ"]');
  S=await state();assert.equal(S.rareBzBase,7);assert.deepEqual(S.cycle,OLD.cycle);assert.deepEqual(S.czType,OLD.czType);
  assert.deepEqual(await rowText('①周期'),['2/3 67%','うち種別未記録 2']);
  // 移行後のレア役BZ 1件で、BZ合計が1だけ増える
  await click('[aria-label="弱レア 通常 当選"]');
  assert.match(await template(),/ブレイクゾーン▶︎ 13回/);
  await click('#modeBtn');
  await click('[aria-label="①周期 種別未記録を1減らす"]');S=await state();assert.equal(S.cycle.c1,1);
  await click('[data-c="czType.airou"] .plus');S=await state();assert.equal(S.czType.airou,3);
  await click('#undoBtn');await click('#undoBtn');S=await state();assert.equal(S.cycle.c1,2);assert.equal(S.czType.airou,4);
  await click('#modeBtn');
  pass('旧データ：周期・CZ種別の旧記録を保持、旧記録は減算モードでだけ減る、移行後のレア役BZは+1');

  // ===== 3. 幅ごとの実測と縦の長さ（改修前と比較）=====
  const heights=[];
  for(const width of [320,360,390,412]){
    const row={width};
    for(const before of [true,false]){
      await seed(OLD);await load(width,740,before);
      const tag=before?'before':'after';
      row[tag+'Input']=await mainHeight();
      if(!before)row.inputLayout=await layout('input '+width,width);
      if(!before){await click('#modeBtn');row.minusLayout=await layout('input minus '+width,width);await click('#modeBtn');}
      await tab(2);
      row[tag+'Bz']=await mainHeight();
      await openTotals();
      row[tag+'BzTotalsOpen']=await mainHeight();
      if(!before)row.bzLayout=await layout('bz '+width,width);
      if(!before){
        // ％（整数）の文字が設定差の文字に重ならないこと。旧データには「1/1 100%」の行がある
        const qi=await frame(`const box=e=>{const r=d.createRange();r.selectNodeContents(e);return r.getBoundingClientRect();};
          return [...d.querySelectorAll('.qi-row')].map(row=>{const p=row.querySelector('.qi-pct'),f=row.querySelector('.qi-diff'),a=box(p),b=box(f);
            return {pct:p.textContent,diff:f.textContent,pctRight:a.right,diffLeft:b.left,gap:b.left-a.right,sameLine:Math.abs(a.top-b.top)<4};});`);
        assert.ok(qi.some(r=>r.pct==='100%'),'100% の行がない '+JSON.stringify(qi));
        assert.ok(qi.every(r=>r.gap>=2&&r.sameLine),width+' ％と設定差が重なる '+JSON.stringify(qi));
        row.qiGap=Math.min(...qi.map(r=>Math.round(r.gap)));
      }
      if(width===390||width===320){
        await tab(0);row[tag+'InputShot']=await shot(`input-${tag}-${width}`,width);
        await tab(2);await openTotals();row[tag+'BzShot']=await shot(`bz-totals-${tag}-${width}`,width);
        if(!before){
          await shotPart(`part-quest-icon-${width}`,width,`[...d.querySelectorAll('details.bz-fold>summary')].find(e=>e.textContent.startsWith('集計'))`,`[...d.querySelectorAll('.hint')].find(e=>e.textContent.startsWith('結果アイコン未記録のBZ'))`);
          await tab(0);
          await shotPart(`part-cycle-cz-${width}`,width,`[...d.querySelectorAll('.sec-h')].find(e=>e.textContent==='規定リプレイ周期')`,`[...d.querySelectorAll('.cz-row')].pop()`);
        }
      }
    }
    heights.push(row);
    pass('layout '+width,{input:[row.beforeInput,row.afterInput],bz:[row.beforeBz,row.afterBz],bzTotalsOpen:[row.beforeBzTotalsOpen,row.afterBzTotalsOpen],buttons:row.inputLayout,minus:row.minusLayout});
  }
  fs.writeFileSync(path.join(artifacts,'heights.json'),JSON.stringify(heights,null,2));
  // BZタブの折りたたみを閉じた状態は変えない
  for(const r of heights)assert.equal(r.afterBz,r.beforeBz,'BZタブ（集計を閉じた状態）の長さ '+r.width);

  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('browser console errors = 0');
  console.log('PASS '+results.filter(r=>r.status==='PASS').length+' browser checks');
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack});console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
  fs.rmSync(beforeRoot,{recursive:true,force:true});
}

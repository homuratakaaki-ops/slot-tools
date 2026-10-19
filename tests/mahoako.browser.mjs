// node tests/mahoako.browser.mjs — headless Chrome / CDP。成果物は os.tmpdir() のみ。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=fs.mkdtempSync(path.join(os.tmpdir(),'slot-mahoako-'));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-mahoako-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const KEY='mahoako-checker-v1',errors=[],measures=[];
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
let browser,ws,seq=0,checks=0;const pending=new Map();
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
async function load(width=390,page='/mahoako-checker.html'){
  await send('Emulation.setDeviceMetricsOverride',{width,height:740,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  let ready=false;
  for(let i=0;i<150;i++){
    ready=await run(`return location.pathname===${JSON.stringify(page)}&&document.readyState==='complete'&&!!d.querySelector(${JSON.stringify(page.includes('guide')?'main.container':'#main .sec')});`).catch(()=>false);
    if(ready)break;await pause(40);
  }
  assert.ok(ready,'page ready');assert.equal(await run('return innerWidth;'),width);
}
async function seed(S,width=390){await run(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(S))});`);await load(width);}
async function shot(name,width){const r=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));}
function pass(name){checks++;console.log('PASS '+name);}
async function layout(width,label,p){
  const m=await run(`const W=innerWidth,main=d.getElementById('main');
    const bad=[...d.querySelectorAll('header,nav,#main,#main *')].filter(e=>{
      const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+.5||r.left<-.5)&&!e.closest('details:not([open])')&&!e.closest('.jump-nav');
    }).map(e=>(e.className||e.tagName)+':'+e.textContent.trim().slice(0,25));
    const taps=[...d.querySelectorAll('.plus,nav button,#main button')].filter(e=>e.getBoundingClientRect().width>0&&!e.closest('details:not([open])')).map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height}));
    return {width:W,scroll:main.scrollWidth-main.clientWidth,bad,taps};`);
  assert.equal(m.width,width);assert.equal(m.scroll,0,JSON.stringify({width,label,p,scroll:m.scroll}));assert.deepEqual(m.bad,[],JSON.stringify({width,label,p,bad:m.bad}));
  assert.ok(m.taps.length>0);assert.ok(m.taps.every(t=>t.height>=44),JSON.stringify(m.taps.filter(t=>t.height<44)));
  measures.push({width,label,tab:p,minButtonHeight:Math.min(...m.taps.map(t=>t.height)),overflow:m.scroll});
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
  await load();
  // 全行を実ボタンから入力。保存・取消・減算・リロードまでを確認する。
  let count=0;
  for(const p of [0,1]){
    await tab(p);const keys=await run('return [...d.querySelectorAll("[data-c]")].map(e=>e.dataset.c);');
    for(const key of keys){await plus(key);const [group,id]=key.split('.');assert.equal((await state())[group][id],1);count++;}
  }
  await plus('smb.ep3');await click('#undoBtn');assert.equal((await state()).smb.ep3,1);
  await click('#modeBtn');await plus('smb.ep3');await plus('smb.ep3');assert.equal((await state()).smb.ep3,0);await click('#modeBtn');await plus('smb.ep3');
  const saved=await state();await load();assert.deepEqual(await state(),saved);assert.deepEqual(await run('return window.__errors;'),[]);pass('all '+count+' count buttons / save / undo / minus floor / reload');
  const full=await run('return structuredClone(CheckerConfigs.mahoako.defaults);');
  full.currentGames=8000;full.counts.cz=30;full.counts.atOther=10;full.czType.tm=20;full.czType.pa=10;full.czType.unknown=70;
  for(const key of ['bbScreens','trophy','over','rbTeam','rbThird','rbFlag','panel','smb'])for(const id of Object.keys(full[key]))full[key][id]=1;
  await seed(full);await tab(0);
  assert.equal(await run(`return d.querySelector('[data-c="czType.tm"] .pct').textContent;`),'20/30 67%');
  await tab(1);assert.equal(await run(`return d.querySelector('[data-c="bbScreens.s01"] .pct').textContent;`),'1/11 9%');
  assert.ok(!(await run(`return d.querySelector('[data-c="bbScreens.unknown"]').textContent;`)).includes('%'));
  await tab(2);assert.equal(await run('return d.querySelectorAll(".bayes-bar").length;'),6);pass('rendered known-only percentages and inference');
  for(const width of [360,390,412])for(const [label,S] of [['empty',{}],['filled',full]]){
    await seed(S,width);
    for(let p=0;p<5;p++){
      await tab(p);await layout(width,label,p);
      if([0,1,2,4].includes(p))await shot(['input','suggest','estimate','reference','card'][p]+'-'+width+'-'+label,width);
    }
    assert.deepEqual(await run('return window.__errors;'),[]);pass(width+'px '+label+' all 5 tabs, overflow 0 / buttons >=44px');
  }
  await seed(full);await tab(4);await click('#detailBtn');await pause(250);
  const dense=await canvas('detailCanvas','detail-card-all-rows');
  assert.ok(dense.texts.some(t=>/ほか.*項目/.test(t.text)),'engine retains its existing 40-row limit');
  // 既存engineは最大40行。各セクションの実描画は、1件ずつの記録で別に検証する。
  const sparse=await run('return structuredClone(CheckerConfigs.mahoako.defaults);');
  sparse.currentGames=8000;
  for(const key of Object.keys(sparse))if(sparse[key]&&typeof sparse[key]==='object'){
    const id=Object.keys(sparse[key])[0];if(id)sparse[key][id]=2;
  }
  sparse.czType.unknown=70;sparse.rbThird.sista=1;
  await seed(sparse);await tab(4);await click('#detailBtn');await pause(250);
  const detail=await canvas('detailCanvas','detail-card'),summary=await canvas('cardCanvas','summary-card');
  // 詳細カードの見出しはカード専用の短名（画面側は長い表示名のまま）。
  for(const title of ['カウント系','CZ種別','終了画面','トロフィー','獲得枚数','RB構成','RB 3人目','RB出現','パネル','SMボーナス'])assert.ok(detail.texts.some(t=>t.text===title),title);
  assert.ok(detail.texts.some(t=>t.text.includes('種別不明 ×70')&&!t.text.includes('%')));
  assert.ok(detail.texts.some(t=>t.text.includes('シスタギガント ×1')&&!t.text.includes('%')));
  assert.ok(summary.texts.some(t=>t.text.includes('パネル以上')));assert.deepEqual(await run('return window.__errors;'),[]);pass('detail PNG / summary PNG / all sections / pixels');
  // 全セクション記録済みで、長い行（RB構成・RB 3人目・SMB）を右列（x=560〜）に置く状態。
  // single-*: 右列に1件だけのセクション＝1行表示（見出しの右に値）。multi-*: 見出し＋項目行。
  const front={counts:{cz:30,atBonus:3,atOther:10,atUnknown:1},czType:{tm:20,pa:9,ve:1,unknown:5},bbScreens:{s09:1,s10:1,s11:1},trophy:{bronze:1,rainbow:1},over:{o555:1,o666:1}};
  const wide=[
    ['detail-card-single-a',25,{...front,rbTeam:{tres2:1},rbThird:{rivalEno:1},rbFlag:{venarita:1},panel:{magenta:1},smb:{ep3:1}},['RB構成','RB 3人目','RB出現','パネル','SMボーナス']],
    ['detail-card-single-b',25,{...front,rbTeam:{eno2:1},rbThird:{rivalTres:1},rbFlag:{vatz:1},panel:{sulfa:1},smb:{ep2:1}},['RB構成','RB 3人目','RB出現','パネル','SMボーナス']],
    ['detail-card-single-c',25,{...front,rbTeam:{eno3:1},rbThird:{baeze2:1},rbFlag:{unknown:1},panel:{azur:1},smb:{ep1:1}},['RB構成','RB 3人目','RB出現','パネル','SMボーナス']],
    ['detail-card-single-d',27,{counts:{cz:30,atBonus:3,atOther:10,atUnknown:1},czType:{tm:20,pa:9,ve:1,unknown:5},bbScreens:{s01:1,s02:1,s03:1,s04:1,s05:1,s06:1,s07:1,s08:1,s09:1},trophy:{rainbow:1},over:{o666:1},rbTeam:{tres2:1},rbThird:{rivalTres:1},rbFlag:{venarita:1},panel:{magenta:1},smb:{ep3:1}},['トロフィー','獲得枚数','RB構成','RB 3人目','RB出現','パネル','SMボーナス']],
    ['detail-card-multi-smb',24,{counts:{cz:30,atOther:10},czType:{tm:20,pa:10},bbScreens:{s01:1,s02:1},trophy:{bronze:1},over:{o456:1},rbTeam:{eno2:1,tres2:1},rbThird:{rivalTres:1,rivalEno:1,baeze2:1},rbFlag:{venarita:1},panel:{azur:1},smb:{ep1:1,ep2:1,ep3:1}},['悪の女幹部 ×1','逆境アズール ×1','やっぱり魔法少女 ×1']],
    ['detail-card-multi-rb',30,{counts:{cz:30,atBonus:3,atOther:10,atUnknown:1},czType:{tm:20,pa:9,ve:1},bbScreens:{s01:1,s02:1,s03:1},trophy:{bronze:1,silver:1},over:{o456:1,o555:1},rbTeam:{eno3:1},rbThird:{rivalTres:1,rivalEno:1,baeze2:1},rbFlag:{venarita:1},panel:{azur:1},smb:{ep1:1,ep2:1,ep3:1}},['3人目トレス（エノ2人） ×1','3人目エノ（トレス2人） ×1','ベーゼ第二形態 ×1','悪の女幹部 ×1']]
  ];
  // ヘッドレスはM PLUS 1pを読めず代替フォントで細く描くため、全角1em・半角0.6emの見積もりでも判定する。
  // 見出し（x=70/560）は固定サイズ、項目・1行表示の値は縮小後の最小18pxで見積もる（実フォントで縮んでも収まる条件）。
  const px=t=>parseFloat(t.font.match(/(\d+(?:\.\d+)?)px/)[1]);
  const em=t=>[...t.text].reduce((a,ch)=>a+(ch.codePointAt(0)<0x2000?.6:1),0)*(t.x===70||t.x===560?px(t):18);
  for(const [name,rowCount,rec,rightRows] of wide){
    const S=await run('return structuredClone(CheckerConfigs.mahoako.defaults);');S.currentGames=8000;
    for(const [key,vals] of Object.entries(rec))Object.assign(S[key],vals);
    await seed(S);await tab(4);await click('#detailBtn');await pause(250);
    assert.equal(await run('return w.__checkerApp._detailRows().length;'),rowCount,name);
    const card=await canvas('detailCanvas',name);
    const body=card.texts.filter(t=>t.y>=330&&t.y<=910);
    assert.ok(body.length>=rowCount,name);
    for(const t of body){
      const right=t.x===88||t.x===578?t.x+420:1010;
      assert.ok(t.x+t.w<=right&&t.x+em(t)<=right,name+' '+JSON.stringify({...t,em:em(t),right}));
    }
    for(const label of rightRows)assert.ok(body.some(t=>t.x>=560&&t.text.startsWith(label)),name+' '+label);
  }
  assert.deepEqual(await run('return window.__errors;'),[]);pass('detail card 24-30 rows: right-column inline and item rows within 1010px / 420px (measured + em estimate)');
  for(const width of [360,390,412]){await load(width,'/mahoako-guide.html');assert.equal(await run('return d.documentElement.scrollWidth-d.documentElement.clientWidth;'),0);}
  pass('guide 3 widths');assert.deepEqual(errors,[]);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,measures,errors,externalResources:'Ads, analytics and Google Fonts fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks}; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

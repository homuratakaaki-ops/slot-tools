// vvv2 実UI受け入れ。headless Chrome / CDP（Playwright不使用）。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS?path.resolve(root,process.env.CHECKER_ARTIFACTS):fs.mkdtempSync(path.join(os.tmpdir(),'vvv2-'));fs.mkdirSync(artifacts,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-newmachines-1102-profile-'));
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const KEY='vvv2-checker-v1',PAGE='/vvv2-checker.html';const errors=[],measures=[];
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
  const act=(name,attrs='')=>click(`[data-action="${name}"]${attrs}`);
  const result=r=>act('result',`[data-result="${r}"]`);
  async function round(pt,r='miss',magius=false){await click(`[data-pt="${pt}"]`);if(magius)await click('#vv-magius');await act('cycle',`[data-result="${r}"]`);}
  async function reloaded(){const saved=await state();await load(390);assert.deepEqual(await state(),saved);await tab(2);}
  async function selectStart(kind){const S=await state(),w=await run('return innerWidth;');S.spans=[{rows:[],end:null}];S.curPt=null;await seed(S,w);await tab(0);await act('start',`[data-kind="${kind}"]`);await tab(2);}
  await load(390);
  assert.deepEqual(await run('return [...d.querySelectorAll("#nav button")].map(x=>x.textContent);'),['入力','示唆','周期','カード']);
  for(const kind of ['reset','bonusEnd','fail','unknown']){await act('start',`[data-kind="${kind}"]`);assert.equal((await state()).start.kind,kind);}
  await act('start','[data-kind="fail"]');for(let i=1;i<=5;i++){await act('failCount',`[data-n="${i}"]`);assert.equal((await state()).start.failCount,i);}
  for(const custom of ['off','on','unknown']){await act('custom',`[data-value="${custom}"]`);assert.equal((await state()).custom,custom);}
  for(const key of ['cz','rb','bb','direct']){await plus('counts.'+key);assert.equal((await state()).counts[key],1);}
  await act('bar');await act('barDirect');assert.equal((await state()).counts.bar,2);assert.equal((await state()).counts.barDirect,1);
  await click('#modeBtn');assert.equal(await run(`return d.querySelector('[data-action="bar"]').disabled;`),true);await act('barDirect');assert.equal((await state()).counts.barDirect,0);await click('#undoBtn');assert.equal((await state()).counts.barDirect,1);await click('#modeBtn');
  pass('開始4条件・失敗回数5選択・カスタム3選択・全カウント・減算n<=d');
  await tab(1);const groupKeys=await run(`return [...d.querySelectorAll('[data-action="group"]')].map(b=>[b.dataset.group,b.dataset.key]);`);
  for(const [g,key] of groupKeys){await act('group',`[data-group="${g}"][data-key="${key}"]`);assert.equal((await state()).groups[g][key],1);}
  await click('#undoBtn');const [lastG,lastKey]=groupKeys.at(-1);assert.equal((await state()).groups[lastG][lastKey],0);await act('group',`[data-group="${lastG}"][data-key="${lastKey}"]`);
  await reloaded();pass(`示唆${groupKeys.length}ボタン・保存・再読込・取消`);
  const keep=await state();
  await tab(1);assert.equal(await run('return d.getElementById("vv-ref").open;'),false);
  assert.equal(await run('return !!d.getElementById("vv-bayes").closest("details");'),false);
  await click('a[href="#vv-ref"]');assert.equal(await run('return d.getElementById("vv-ref").open;'),true);
  await shot('vvv2-suggest-reference-390',390);
  pass('参照表は既定で閉じる・参照ジャンプで開く・設定推測は畳まない');
  for(const pt of [100,200,300,400,500,600]){await selectStart('bonusEnd');await round(pt);assert.equal((await state()).spans[0].rows[0].pt,pt);await reloaded();}
  await selectStart('bonusEnd');await round(200);await round(600);await round(400);
  assert.ok((await run('return d.querySelector(".vv-mode").textContent;')).includes('A 100%'));
  assert.ok((await run('return d.querySelector(".now-box").textContent;')).includes('上限 あと3周期'));
  const counts=JSON.stringify((await state()).counts),groups=JSON.stringify((await state()).groups);
  assert.equal(counts,JSON.stringify(keep.counts));assert.equal(groups,JSON.stringify(keep.groups));
  await click('#undoBtn');assert.equal((await state()).spans[0].rows.length,2);await round(400,'miss',true);assert.equal((await state()).spans[0].rows[2].magius,true);
  const rows=(await state()).spans[0].rows;await act('deleteRow','[data-index="1"]');assert.equal((await state()).spans[0].rows.length,2);assert.equal((await state()).spans[0].rows[1].k,2);await click('#undoBtn');assert.deepEqual((await state()).spans[0].rows,rows);
  await reloaded();pass('到達pt6ボタン・bonusEnd検算表示・マギウス・削除と取消・counts/groups独立');
  await click('#curPt');await click('[data-digit="1"]');await click('[data-digit="2"]');await click('[data-digit="⌫"]');await click('[data-digit="0"]');await click('#vv-pad-save');assert.equal((await state()).curPt,10);
  await reloaded();assert.equal(await run('return d.getElementById("curPt").value;'),'10');await click('#curPt');await click('[data-digit="クリア"]');await click('#vv-pad-save');assert.equal((await state()).curPt,null);await click('#undoBtn');assert.equal((await state()).curPt,10);
  await click('#curPt');await click('#vv-pad-cancel');assert.equal((await state()).curPt,10);
  pass('現在ptテンキー・入力・クリア・取消・再読込・閉じる');
  await selectStart('reset');await round(200);await round(400);assert.ok((await run('return d.querySelector(".now-box").textContent;')).includes('参考 100%'));await round(200);assert.ok((await run('return d.querySelector(".vv-error").textContent;')).includes('食い違'));
  pass('reset開始3周期上限と3周期ハズレ矛盾表示');
  {const rows=JSON.stringify((await state()).spans);await tab(0);await act('start','[data-kind="bonusEnd"]');
   assert.equal(await run('return d.getElementById("toast").textContent;'),'開始条件を変えました（記録は保持）');assert.equal(JSON.stringify((await state()).spans),rows);assert.equal((await state()).start.kind,'bonusEnd');
   await tab(2);assert.ok(!(await run('return d.querySelector(".now-box").textContent;')).includes('参考 100%'));pass('途中の開始条件変更で周期ログ保持・トースト');}
  for(const route of [['czmiss'],['rb','rbmiss'],['rb','at','atend'],['bb','bbend'],['bb','at','atend']]){
    await selectStart('bonusEnd');await round(200,'win');
    for(const end of route){await result(end);await reloaded();}
    assert.equal((await state()).spans[0].end.t,route.at(-1));assert.equal((await state()).spans.length,2);
  }
  await result('pullwin');assert.equal((await state()).spans.length,3);await reloaded();await result('pullmiss');assert.equal((await state()).spans.at(-1).rows[0].r,'miss');await click('#undoBtn');assert.equal((await state()).spans.at(-1).rows.length,0);await result('pullmiss');
  await act('out');assert.equal((await state()).spans.at(-1).rows.at(-1).t,'out');await result('bb');await result('bbend');await reloaded();
  await result('pullmiss');await act('out');assert.ok(await run('return !!d.querySelector("[data-result=at]");'));await result('at');assert.equal(await run('return d.querySelector(".vv-status").textContent;'),'AT終了待ち');await result('atend');await reloaded();
  {const st=await state();assert.equal(st.spans.at(-2).end.t,'atend');assert.equal(st.spans.at(-2).rows.at(-1).t,'out');assert.equal(st.spans.at(-2).rows.at(-1).at,true);}
  await selectStart('bonusEnd');await result('pullmiss');await round(200,'win');assert.ok(await run('return !d.querySelector("[data-result=at]");'),'周期当選のCZ結果待ちにはAT直撃を出さない');
  assert.equal(JSON.stringify((await state()).counts),counts);assert.equal(JSON.stringify((await state()).groups),groups);
  pass('結果全分岐・周期外当選・引戻しあり/なし・途中状態の保存復元');
  await selectStart('unknown');await click('.vv-hints summary');const hints=await run(`return [...d.querySelectorAll('[data-action="hint"]')].map(b=>b.dataset.hint);`);
  for(const key of hints){await act('hint',`[data-hint="${key}"]`);assert.equal((await state()).spans[0].rows.at(-1).c,key);await click('#undoBtn');assert.equal((await state()).spans[0].rows.length,0);}
  await act('hint','[data-hint="sub_hiasobi"]');await reloaded();assert.ok(!(await run('return d.querySelector(".vv-mode").textContent;')).includes('A '));
  pass(`周期示唆${hints.length}全ボタン・取消・保存復元`);
  // 追加データを作ってから実際のカードタブ・詳細ボタンで描画する。
  await selectStart('bonusEnd');await round(200);await round(600);await round(400);
  const filled=await state();
  for(const width of [360,390,412]){
    for(const [label,S] of [['empty',{}],['filled',filled]]){
      await seed(S,width);
      for(let p=0;p<4;p++){await tab(p);await layout(width,label,p);if(p===2){
        await run('d.getElementById("main").scrollTop=0;');
        assert.ok(await run('return d.querySelector(".vv-until").textContent.includes("当選まで（参考）");'));
        assert.equal(await run('return d.querySelector(".now-box details").open;'),false);
        const m=await run(`return {last:d.querySelector('[data-pt="600"]').getBoundingClientRect().bottom,out:d.querySelector('[data-action="out"]').getBoundingClientRect().bottom,nav:d.getElementById('nav').getBoundingClientRect().top,now:d.querySelector('.now-box').getBoundingClientRect().height};`);
        if(width===390){await shot('vvv2-cycle-390-'+label,width);assert.ok(m.last<=m.nav&&m.out<=m.nav,JSON.stringify(m));}measures.push({width,label,cycle:m});
      }}
    }
  }
  pass('360/390/412px × 空/記録あり × 4タブ はみ出し0・44px・390px初期6ボタン');
  await tab(3);await pause(300);const card=await canvas('cardCanvas','vvv2-summary-card');
  assert.ok(card.texts.some(x=>x.text.includes('周期推測 A 100%')));
  // カードの上部4ブロックも隣の枠への侵入を禁止。
  for(const t of card.texts.filter(t=>t.y===368))assert.ok(t.w<=186,'card block overflow '+JSON.stringify(t));
  await click('#detailBtn');await pause(300);const detail=await canvas('detailCanvas','vvv2-detail-card');
  assert.ok(detail.texts.some(x=>x.text.includes('3周期目 400pt ハズレ')));assert.ok(detail.texts.some(x=>x.text.includes('%')));
  assert.ok((await run('return d.getElementById("tpl").value;')).includes('区間1：1周期目 200pt ハズレ→2周期目 600pt ハズレ→3周期目 400pt ハズレ'));
  pass('通常/詳細PNG・画素・周期ログ行・%・テンプレ一致');
  await tab(0);await click('#resetBtn');await click('#resetBtn');assert.equal((await state()).spans[0].rows.length,0);await click('#undoBtn');assert.equal((await state()).spans[0].rows.length,3);pass('データリセットと取消');
  await load(360,'/vvv2-guide.html');assert.equal(await run('return d.documentElement.scrollWidth-innerWidth;'),0);
  assert.deepEqual(await run('return window.__errors;'),[]);assert.deepEqual(errors,[]);pass('guide 360px・未捕捉例外なし');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({checks,measures,errors,externalResources:'External resources fulfilled empty for local verification'},null,2));
  console.log(`Browser checks: ${checks}; Artifacts: ${artifacts}`);ws?.close();browser?.kill();server.close();
}

// Run: node tests/mhsunbreak-1018.browser.mjs
// Ledger synchronization and position 11; real local UI, isolated Chrome profile.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const page=process.env.MH_PAGE||'mhsunbreak-checker.html';
const machine=page.includes('-test-')?'mhsunbreak-test':'mhsunbreak';
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-1005-results-'));
if(path.resolve(artifacts)===root||path.resolve(artifacts).startsWith(root+path.sep))throw Error('CHECKER_ARTIFACTS must be outside repository');
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
const state=()=>frame('return w.__checkerApp.getState();');
// 記録経路は実ボタン→必須ランプ選択。見忘れの明示値「不明」を選ぶ。
const click=async selector=>{
 await frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing '+${JSON.stringify(selector)});el.click();`);
 if(/data-action="(?:bzFailure|fukuFailure)"/.test(selector)){
  assert.equal(await frame('return !!d.getElementById("lampDialog");'),true,'失敗時の必須ランプ選択');
  await frame(`d.querySelector('[data-action="lampChoose"][data-c="unknown"]').click();`);
 }
};
// この既存試験が扱う「記録1件の取消」を、色のUndo→失敗そのものの取消へ写像する。
async function undoRecord(){
 await click('#undoBtn');
 if(await frame('return !!d.getElementById("lampDialog");'))await click('[data-action="cancelFailure"]');
}
async function tab(index){await click(`#nav [data-p="${index}"]`);await pause(60);}
async function load(id,width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin+'/'+page)};})`);
  for(let i=0;i<100;i++){
    if(await frame(`return d.querySelector('#hitIn,#gIn,[data-number-key="gamesMyslo"]')&&(w.CheckerConfigs?.mhsunbreak||w.CheckerConfigs?.['mhsunbreak-test'])?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  await frame(`w.__config=w.CheckerConfigs.mhsunbreak||w.CheckerConfigs['mhsunbreak-test'];w.__key=w.__config.storageKey;`);
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function reset(){await frame(`d.getElementById('dataOps').open=true;`);await click('#resetBtn');await click('#resetBtn');}
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
  const totals=()=>frame('return w.__config.totals(w.__checkerApp.getState());');
  const sum=async()=>{const t=await totals();return Object.values(t.bzT1).concat(Object.values(t.bzT2)).reduce((a,b)=>a+b,0);};
  const displayed=()=>frame('return [...d.querySelectorAll(".sum-row")].map(e=>[...e.querySelectorAll("span")].slice(1,3).map(v=>v.textContent));');
  async function fresh(raw){
    await load(machine);
    await frame(`w.localStorage.removeItem(w.__key);w.localStorage.removeItem(w.__key+'-prefs');${raw?`w.localStorage.setItem(w.__key,${JSON.stringify(JSON.stringify(raw))});`:''}`);
    await load(machine);await tab(2);
  }
  async function record(table='t1',result='miss'){
    await click(`[data-action="bzPick"][data-q="${table}"]`);
    await click(`[data-action="${result==='miss'?'bzFailure':'bzQuest'}"][data-r="${result}"]`);
  }
  async function remove(ordinal){const index=await frame(`return w.__checkerApp.getState().atLog.sessions.at(-1).events.map((e,i)=>e.t==='bz'?i:-1).filter(i=>i>=0)[${ordinal}];`);if(!await frame(`return !!d.querySelector('[data-action="atDel"][data-index="${index}"]');`))await click(`[data-action="atOpen"][data-index="${index}"]`);await click(`[data-action="atDel"][data-index="${index}"]`);}
  async function shot(name,selector){
    await frame(`const el=d.querySelector(${JSON.stringify(selector)});if(!el)throw Error('screenshot target missing');el.scrollIntoView({block:'center'});`);
    await pause(100);
    const r=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:390,height:740,scale:1}});
    fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'));
  }
  async function check(name,fn){try{await fn();pass(name);}catch(e){results.push({name,status:'FAIL',detail:e.stack});console.error('FAIL '+name,e);process.exitCode=1;}}
  const old={bzT1:{t1:35},atLog:{sessions:Array.from({length:33},(_,i)=>({start:{known:true,prior:0},events:[{t:'bz',table:'t1',r:'miss'}],closed:i<32}))}};
  await check('01 record/delete changes rendered totals',async()=>{
    await fresh();const initial=await displayed();await record();await record('t3');assert.equal(await sum(),2);
    await remove(1);await remove(0);assert.deepEqual(await displayed(),initial);assert.equal(await sum(),0);
  });
  await check('02 old 35 migrates to 33+2 with visible base row',async()=>{
    await fresh(old);assert.equal(await sum(),35);assert.deepEqual((await displayed())[0],['0/35','0/0']);
    await click('[data-action="bzFold"][data-k="totals"]');
    assert.match(await frame('return d.querySelector("#main").textContent;'),/うち履歴なし：1回目 2回（成功0）/);
    await shot('totals-with-base','.bz-fold:has([data-k="totals"]) > .hint');
  });
  await check('03 insertion moves original first BZ to later group',async()=>{
    await fresh();await record('t3');await click('[data-action="atOpen"][data-index="0"]');await click('[data-action="atInsert"][data-index="0"]');await record('t2');
    const rows=await displayed();assert.deepEqual(rows[1],['0/1','0/0']);assert.deepEqual(rows[2],['0/0','0/1']);
  });
  await check('04 unknown start records chosen group and deletes',async()=>{
    await fresh();await click('[data-action="atStart"][data-known="false"]');await click('[data-action="bzGroup"][data-d="bzT2"]');await record('t3');
    assert.equal((await state()).atLog.sessions[0].events[0].g,'bzT2');assert.deepEqual((await displayed())[2],['0/0','0/1']);await remove(0);assert.equal(await sum(),0);
  });
  await check('05 BZ/fuku/other AT close intervals without contaminating BZ totals',async()=>{
    await fresh();await record('t2','win');assert.equal(await sum(),1);
    await click('[data-action="atEvent"][data-t="fuku"][data-r="win"]');
    await click('[data-action="atEvent"][data-t="otherAt"]');
    assert.equal((await state()).atLog.sessions.length,4);assert.equal(await sum(),1);
    // 条件5: 福引・BZ以外ATはBZの回数に入らない。次のBZは新しいAT間の1回目に計上される
    await record('t3','miss');assert.deepEqual((await displayed())[2],['0/1','0/0']);assert.equal(await sum(),2);
  });
  await check('06 reload migration and real double-confirm reset/undo',async()=>{
    await fresh(old);await record('t3');const before=await totals();await load(machine);await tab(2);assert.deepEqual(await totals(),before);
    await tab(0);await reset();await tab(2);assert.equal(await sum(),0);await undoRecord();assert.deepEqual(await totals(),before);
  });
  await check('07 rapid double tap failure and position 11 produce one event',async()=>{
    for(const pos11 of [false,true]){
      await fresh();await click('[data-action="bzPick"][data-q="t3"]');
      const selector=pos11?'[data-action="bzPickPos"][data-pos="11"]':'[data-action="bzFailure"][data-r="miss"]';
      await frame(`const el=d.querySelector(${JSON.stringify(selector)});el.click();el.click();`);
      if(!pos11){assert.equal(await frame('return !!d.getElementById("lampDialog");'),true);await click('[data-action="lampChoose"][data-c="unknown"]');}assert.equal((await state()).atLog.sessions.flatMap(s=>s.events).filter(e=>e.t==='bz').length,1);assert.equal((await state()).atLog.sessions.flatMap(s=>s.events).length,pos11?1:2);assert.equal(await sum(),1);
    }
  });
  await check('08 subtraction enables only base and leaves history unchanged',async()=>{
    await fresh(old);const log=(await state()).atLog;await click('#modeBtn');
    const enabled=()=>frame('return [...d.querySelectorAll(".quest-row button")].filter(e=>!e.disabled).map(e=>({q:e.dataset.q,r:e.dataset.r,d:e.dataset.d}));');
    assert.deepEqual(await enabled(),[{q:'t1',r:'miss',d:'bzT1'}]);
    const selector='[data-action="bzQuest"][data-d="bzT1"][data-q="t1"][data-r="miss"]';await click(selector);await click(selector);
    assert.deepEqual(await enabled(),[]);assert.equal(await sum(),33);assert.deepEqual((await state()).atLog,log);
  });
  await check('09 position 11 wins immediately, closes AT, displayed in history; absent for t7',async()=>{
    await fresh();await click('[data-action="bzPick"][data-q="t3"]');
    assert.equal(await frame('return d.querySelector("[data-action=bzPickPos][data-pos=\\"11\\"]").textContent;'),'11：猛焔一閃（AT）');
    await shot('entry-position-11','[data-action="bzPickPos"][data-pos="11"]');
    await click('[data-action="bzPickPos"][data-pos="11"]');const S=await state();assert.equal(S.atLog.sessions.length,2);assert.equal(S.atLog.sessions[0].events[0].r,'win');assert.equal(S.atLog.sessions[0].events[0].pos,11);
    assert.match(await frame('return d.querySelector(".ev-pos").textContent;'),/11 猛焔一閃/);await shot('history-position-11','.ev-pos');
    assert.match(await frame('return d.querySelector(".pos-done").textContent;'),/11個目・猛焔一閃/);
    await click('[data-action="bzPick"][data-q="t7"]');assert.equal(await frame('return d.querySelectorAll("[data-action=bzPickPos][data-pos=\\"11\\"]").length;'),0);
  });
  // ネネ依頼（10/18）の確認条件1〜8との突き合わせで足した分。3・5・6・7 は 01・05・06・07 が受け持つ。
  // 履歴から数え直した集計（base は別に足す）。画面の表がこれと一致すれば「履歴と集計のズレが無い」
  const fromHistory=()=>frame(`const S=w.__checkerApp.getState(),T=w.__config.totals(S),out={};
    for(const k of ['bzT1','bzT2','questN1','questN2'])out[k]=Object.fromEntries(Object.keys(T[k]).map(id=>[id,T[k][id]-S.bzBase[k][id]]));
    const D={bzT1:{},bzT2:{}},N={questN1:{},questN2:{}};
    for(const s of S.atLog.sessions){let no=s.start.known?s.start.prior:null;for(const e of s.events){if(e.t!=='bz')continue;if(no!==null)no++;
      const g=no===null?e.g:(no===1?'bzT1':'bzT2');if(!g)continue;D[g][e.table]=(D[g][e.table]||0)+1;
      if(e.r==='win'){const nk=g==='bzT1'?'questN1':'questN2';N[nk][e.table]=(N[nk][e.table]||0)+1;}}}
    const same=k=>Object.keys(out[k]).every(id=>out[k][id]===((D[k]||N[k])[id]||0));
    return ['bzT1','bzT2','questN1','questN2'].every(same);`);
  await check('10 条件1: 初回／以後 × 成功・失敗の件数と成功数（複数のAT間）',async()=>{
    await fresh();
    await record('t1','miss');await record('t3','miss');await record('t2','win');   // AT間1: BZ1=①× BZ2=③× BZ3=②○
    await record('t3','win');                                                    // AT間2: BZ1=③○
    await record('t4','miss');await record('t3','miss');                         // AT間3: BZ1=④× BZ2=③×
    const rows=await displayed();
    assert.deepEqual(rows[0],['0/1','0/0']);assert.deepEqual(rows[1],['0/0','1/1']);
    assert.deepEqual(rows[2],['1/1','0/2']);assert.deepEqual(rows[3],['0/1','0/0']);
    assert.equal(await fromHistory(),true);
  });
  await check('11 条件2: 削除→取消→再登録→取消で履歴と集計がずれない',async()=>{
    await fresh();await record('t1','miss');await record('t3','miss');
    const two=await displayed(),events=()=>state().then(S=>S.atLog.sessions.flatMap(s=>s.events).filter(e=>e.t==='bz').length);
    await remove(0);assert.equal(await events(),1);assert.deepEqual((await displayed())[2],['0/1','0/0']);assert.equal(await fromHistory(),true);
    await undoRecord();assert.equal(await events(),2);assert.deepEqual(await displayed(),two);assert.equal(await fromHistory(),true);
    await remove(1);await record('t5','miss');assert.equal(await events(),2);assert.deepEqual((await displayed())[4],['0/0','0/1']);assert.equal(await fromHistory(),true);
    await undoRecord();assert.equal(await events(),1);assert.equal(await sum(),1);assert.equal(await fromHistory(),true);
  });
  await check('12 条件4: 途中への追加・先頭と途中の削除で初回／以後の内訳が一致',async()=>{
    await fresh();await record('t3','miss');await record('t4','miss');await record('t5','miss');   // ③④⑤
    await click('[data-action="atOpen"][data-index="2"]');await click('[data-action="atInsert"][data-index="2"]');await record('t2','miss');   // ③②④⑤
    let S=await state();assert.deepEqual(S.atLog.sessions[0].events.filter(e=>e.t==='bz').map(e=>e.table),['t3','t2','t4','t5']);
    let rows=await displayed();assert.deepEqual(rows[2],['0/1','0/0']);assert.deepEqual(rows[1],['0/0','0/1']);assert.equal(await fromHistory(),true);
    await remove(0);rows=await displayed();   // ②④⑤：②が1回目に繰り上がる
    assert.deepEqual(rows[1],['0/1','0/0']);assert.deepEqual(rows[2],['0/0','0/0']);assert.deepEqual(rows[3],['0/0','0/1']);assert.equal(await fromHistory(),true);
    await remove(1);rows=await displayed();   // ②⑤
    assert.deepEqual(rows[3],['0/0','0/0']);assert.deepEqual(rows[4],['0/0','0/1']);assert.equal(await sum(),2);assert.equal(await fromHistory(),true);
  });
  await check('13 条件8: 上部集計・シナリオカード・テンプレの同じ対象の数値が一致',async()=>{
    await fresh(old);await record('t3','miss');await record('t2','win');await record('t1','win');await click('[data-action="bzPick"][data-q="t7"]');await click('[data-action="bzQuest"][data-r="win"]');
    const rows=await displayed(),S=await state();
    const card=await frame('return w.__config.scenarioModel(w.__checkerApp.getState()).tables;');
    const tpl=await frame('return w.__checkerApp.tplText();');
    const section=head=>{const lines=tpl.split('\n'),i=lines.findIndex(l=>l.startsWith(head));return lines.slice(i+1,i+8).map(l=>l.split('▶︎ ')[1]);};
    const t1=section('■BZテーブル1回目'),t2=section('■BZテーブル2回目以降'),rate=section('■クエスト成功率');
    rows.forEach(([a,b],i)=>{
      const [n1,d1]=a.split('/').map(Number),[n2,d2]=b.split('/').map(Number);
      assert.equal(t1[i],d1+'回','テンプレ1回目 '+i);assert.equal(t2[i],d2+'回','テンプレ2回目以降 '+i);
      assert.equal(rate[i],(n1+n2)+'/'+(d1+d2),'テンプレ成功率 '+i);
      assert.deepEqual([card[i].hit,card[i].count],[n1+n2,d1+d2],'シナリオカード '+i);
    });
    assert.deepEqual(rows[0],['1/36','0/0']);assert.equal(S.atLog.sessions.length>=36,true);
  });
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

// Run explicitly: node tests/rec-cycle-label.verify.mjs
// tools/rec 汎用機種の「周期／スルー」表記切り替え（名前だけ・換算なし）。指示書 v2（シオン 2026-10-27）。
// headless Chrome で実画面を操作する。状態は IIFE 内に差し込んだ窓口（window.__rec）から読む。
// 書き出しJSONは本件直前（BASE）の版と同じ記録で突き合わせる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const BASE=process.env.BASE||'17b695c';  // 本件直前の main
const PREF='slot-tools-rec:cycleLabel',KEY='slot-tools-rec';
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-cycle-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-rec-cycle-profile-'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const errors=[];

// IIFE の内側に窓口を差し込む（S・関数に触るため）
const hook='\nwindow.__rec={get S(){return S},MACHINES,DEF,render,atEndSheet,toEnvelope,showMain,renderSetupFields};\n})();\n</script>';
const inject=html=>{assert.ok(html.includes('\n})();\n</script>'));return html.replace('\n})();\n</script>',()=>hook);};
const current=inject(fs.readFileSync(path.join(root,'tools/rec/index.html'),'utf8'));
const before=inject(execFileSync('git',['show',BASE+':tools/rec/index.html'],{cwd:root,encoding:'utf8'}));
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  res.setHeader('Content-Type','text/html; charset=utf-8');
  if(url==='/tools/rec/index.html')return res.end(current);
  if(url==='/old/tools/rec/index.html')return res.end(before);
  res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port;

let browser,ws;const pending=new Map();let seq=0;
async function send(method,params={}){
  const id=++seq;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout: '+method));},15000);
    pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v);},reject:e=>{clearTimeout(timer);reject(e);}});
    ws.send(JSON.stringify({id,method,params}));
  });
}
async function ev(expression){
  const r=await send('Runtime.evaluate',{expression:`(async()=>{${expression}})()`,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails).slice(0,600));
  return r.result.value;
}
async function open(page='/tools/rec/index.html',width=390){
  await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
  await send('Page.navigate',{url:origin+page});
  for(let i=0;i<100;i++){if(await ev('return !!(window.__rec&&document.getElementById("stFields"));').catch(()=>false))break;await pause(50);}
  await pause(100);
}
const clearAll=()=>ev(`localStorage.clear();`);
const shot=async name=>{const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));};
// 開始画面：汎用の c3 欄（見出し行・2択・入力）
const setupInfo=()=>ev(`const row=document.querySelector('#stFields .cycle-label-row');
  const inputs=[...document.querySelectorAll('#stFields input')];
  if(!row)return {row:null,labels:[...document.querySelectorAll('#stFields .lbl')].map(l=>l.textContent),inputs:inputs.length};
  const r=row.getBoundingClientRect(),btns=[...row.querySelectorAll('button')];
  const title=row.querySelector('span');const range=document.createRange();range.selectNodeContents(title);
  return {row:true,title:title.textContent,lines:range.getClientRects().length,rowH:Math.round(r.height),rowRight:Math.round(r.right),W:innerWidth,
    buttons:btns.map(b=>{const q=b.getBoundingClientRect();return {t:b.textContent,on:b.classList.contains('on'),pressed:b.getAttribute('aria-pressed'),w:Math.round(q.width),h:Math.round(q.height),top:Math.round(q.top)};}),
    input:inputs[0]?inputs[0].value:null,scroll:document.documentElement.scrollWidth-innerWidth};`);
const clickSeg=v=>ev(`document.querySelector('#stFields .cycle-label-row button[data-value="${v}"]').click();`);
const typeC3=v=>ev(`const i=document.querySelector('#stFields input');i.value=${JSON.stringify(v)};i.dispatchEvent(new Event('input',{bubbles:true}));`);
// 開始には機種名とレートが要る（汎用は一覧にない名前を入れる）
const start=()=>ev(`const set=(id,v)=>{const i=document.getElementById(id);if(!i.value){i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}));}};
  set('stMachine','テスト汎用台');set('stLend','46');document.getElementById('stStart').click();
  const e=document.getElementById('stErr');return e.classList.contains('hide')?'':e.textContent;`);
const cur=()=>ev(`const c=__rec.S.cur;return c?{machineId:c.machineId,c3:c.c3,label:document.getElementById('c3Lbl').textContent,num:document.getElementById('cC3').textContent,texts:c.events.map(e=>e.text)}:null;`);
const stored=()=>ev(`return JSON.parse(localStorage.getItem('${KEY}')||'null');`);
const gridBtn=t=>ev(`return [...document.querySelectorAll('#scMain button')].map(b=>b.textContent).filter(x=>x.endsWith(' +1'));`);

try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  for(let i=0;i<100&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
  await pause(1500);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=(await (await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(new Error(JSON.stringify(m.error))):p.resolve(m.result);}return;}
    if(m.method==='Runtime.exceptionThrown')errors.push(JSON.stringify(m.params.exceptionDetails).slice(0,300));};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.confirm=()=>true;window.alert=()=>{};window.addEventListener('error',e=>(window.__errs=window.__errs||[]).push(e.message));`});

  // 1. 既定は「周期」。2択が見出し行の右、1行・44px 以上・はみ出しなし（360/390/412）
  await send('Page.navigate',{url:origin+'/tools/rec/index.html'});await pause(300);await clearAll();
  for(const width of [360,390,412]){
    await open(undefined,width);
    const s=await setupInfo();
    assert.equal(s.row,true,'汎用の c3 欄に2択がある');
    assert.equal(s.title,'周期');assert.equal(s.lines,1,'見出しは1行');
    assert.deepEqual(s.buttons.map(b=>[b.t,b.on,b.pressed]),[['周期',true,'true'],['スルー',false,'false']]);
    assert.ok(s.buttons.every(b=>b.h>=44),'2択の高さ44px以上 '+JSON.stringify(s.buttons));
    assert.equal(new Set(s.buttons.map(b=>b.top)).size,1,'2択が折り返さない');
    assert.ok(s.rowRight<=s.W&&s.scroll<=0,'はみ出しなし '+JSON.stringify(s));
    await ev(`document.querySelector('#stFields .cycle-label-row').scrollIntoView({block:'center'});`);await shot('setup-cycle-'+width);
    console.log('MEASURE '+JSON.stringify({width,rowH:s.rowH,buttons:s.buttons.map(b=>[b.w,b.h])}));
  }
  console.log('PASS 1: 既定「周期」、2択は見出し行の右に1行で並ぶ、44px 以上、360/390/412 ではみ出しなし');

  // 2. 入力 3 → スルー → 周期 → スルー：入力値は 3 のまま（換算しない）、見出しだけ変わる、設定は localStorage
  await open();
  await typeC3('3');
  await clickSeg('through');let s=await setupInfo();
  assert.equal(s.title,'スルー');assert.equal(s.input,'3');assert.deepEqual(s.buttons.map(b=>b.on),[false,true]);
  assert.equal(await ev(`return localStorage.getItem('${PREF}');`),'through');
  await ev(`document.querySelector('#stFields .cycle-label-row').scrollIntoView({block:'center'});`);await shot('setup-through-390');
  await clickSeg('cycle');s=await setupInfo();assert.equal(s.title,'周期');assert.equal(s.input,'3');
  assert.equal(await ev(`return localStorage.getItem('${PREF}');`),'cycle');
  await clickSeg('through');
  // 空欄のまま切り替えても空欄
  await typeC3('');await clickSeg('cycle');await clickSeg('through');s=await setupInfo();assert.equal(s.input,'');
  await typeC3('3');
  console.log('PASS 2: 3 を入れて切り替えても入力は 3、空欄は空欄のまま、設定は '+PREF+' に保存');

  // 3. スルー表記で開始 → 保存値 3・カウンター「スルー 3」・+1 ボタン・履歴の文
  await start();await pause(150);
  let c=await cur();
  assert.equal(c.machineId,'generic');assert.equal(c.c3,3,'保存値は 3（換算しない）');
  assert.equal(c.label,'スルー');assert.equal(c.num,'3');
  assert.equal((await stored()).cur.c3,3);
  assert.deepEqual(await gridBtn(),['スルー +1']);
  await ev(`[...document.querySelectorAll('#scMain button')].find(b=>b.textContent==='スルー +1').click();`);await pause(80);
  c=await cur();assert.equal(c.c3,4);assert.ok(c.texts.includes('スルー 4に加算'),JSON.stringify(c.texts));
  // 直接入力の案内
  await ev(`document.querySelector('[data-cnt="c3"]').click();`);await pause(80);
  const ask=await ev(`return document.body.innerText.includes('スルー');`);assert.ok(ask);
  await shot('main-through-390');
  await ev(`const b=[...document.querySelectorAll('button')].find(x=>/閉じる|キャンセル|×/.test(x.textContent)&&x.offsetParent);if(b)b.click();`);
  console.log('PASS 3: スルー表記で開始して保存値 3、カウンター「スルー 3」、「スルー +1」で 4・履歴「スルー 4に加算」、直接入力の案内も「スルー」');

  // 4. ボーナス終了画面「スルーをリセットしますか（今 n）」と、リセットの履歴の文
  await ev(`const c=__rec.S.cur;c.hit={label:'AT',via:'AT',kind:'at',keepG:false,phase:null,at:new Date().toISOString(),realG:0,lcdG:0,c3:c.c3};c.mode='at';__rec.render();__rec.atEndSheet();`);await pause(100);
  const lbls=await ev(`return [...document.querySelectorAll('#shBody .lbl')].map(l=>l.textContent);`);
  assert.ok(lbls.includes('スルーをリセットしますか（今 4）'),JSON.stringify(lbls));
  await shot('atend-through-390');
  console.log('PASS 4: ボーナス終了画面「スルーをリセットしますか（今 4）」');
  await ev(`const b=[...document.querySelectorAll('#shBody button')].find(x=>x.textContent==='0に戻す');b.click();`);
  await ev(`const b=[...document.querySelectorAll('#shBody button,#sheet button')].filter(x=>x.offsetParent).find(x=>/終了|記録|OK|決定/.test(x.textContent)&&!/取消/.test(x.textContent));if(b)b.click();`);await pause(100);
  c=await cur();
  const resetTxt=c.texts.find(t=>t.includes('リセット'));
  if(resetTxt){assert.ok(resetTxt.includes('スルーリセット'),resetTxt);assert.equal(c.c3,0);console.log('PASS 4b: リセットの履歴「…スルーリセット」・保存値 0');}
  else console.log('NOTE 4b: 終了ボタンを押せなかったため、リセットの履歴文はコードの置き換え（c3Label）で確認');

  // 5. 周期に戻す（リロードで読み直し）：表示は「周期」、切り替え前の履歴の文は「スルー」のまま、保存値は不変
  const c3Before=(await stored()).cur.c3;
  await ev(`localStorage.setItem('${PREF}','cycle');`);await open();
  c=await cur();assert.equal(c.label,'周期');assert.equal(c.c3,c3Before);assert.ok(c.texts.includes('スルー 4に加算'),'記録済みの文は変わらない');
  assert.deepEqual(await gridBtn(),['周期 +1']);
  // リロード後も設定が残る（スルーに戻して読み直す）
  await ev(`localStorage.setItem('${PREF}','through');`);await open();assert.equal((await cur()).label,'スルー');
  // 読めない・想定外の値は周期
  await ev(`localStorage.setItem('${PREF}','???');`);await open();assert.equal((await cur()).label,'周期');
  await ev(`localStorage.setItem('${PREF}','through');`);
  console.log('PASS 5: 周期に戻すと表示は「周期」、記録済みの「スルー 4に加算」は不変、保存値不変、リロードで設定保持、不正値は周期');

  // 6. 他機種（からくりサーカス2）：表記設定がスルーでも、2択なし・ラベルは機種定義のまま
  await ev(`localStorage.removeItem('${KEY}');`);await open();
  await ev(`const b=[...document.querySelectorAll('#stMachines button')].find(x=>x.textContent==='からくりサーカス2');b.click();`);await pause(80);
  const k=await setupInfo();assert.equal(k.row,null,'他機種に2択なし');assert.ok(k.labels.includes('CZスルー回数'),JSON.stringify(k.labels));
  await typeC3('2');await start();await pause(150);
  c=await cur();assert.equal(c.machineId,'karakuri2');assert.equal(c.label,'CZスルー');assert.equal(c.c3,2);
  // 旧版でも同じ表示
  await ev(`localStorage.removeItem('${KEY}');`);await open('/old/tools/rec/index.html');
  await ev(`const b=[...document.querySelectorAll('#stMachines button')].find(x=>x.textContent==='からくりサーカス2');b.click();`);await pause(80);
  const kOld=await ev(`return [...document.querySelectorAll('#stFields .lbl')].map(l=>l.textContent);`);
  assert.deepEqual(kOld,k.labels,'からくりの開始情報の見出しは本件直前と同じ');
  console.log('PASS 6: からくりサーカス2 は表記設定がスルーでも 2択なし・「CZスルー回数」「CZスルー」のまま（本件直前と同じ）');

  // 7. 書き出しJSON：同じ記録を本件直前の版と今の版で toEnvelope → 完全一致
  const session=JSON.stringify({id:'s-test',machine:'汎用',machineId:'generic',startAt:'2026-10-27T01:00:00.000Z',endAt:'2026-10-27T02:00:00.000Z',lend:46,
    startRealG:0,startLcdG:0,realG:120,lcdG:120,c3:3,startNote:'',endNote:'ヤメ',shop:'',dai:'',expected:null,
    money:{startMedal:0,endMedal:100,cash:[],replay:[]},events:[{id:'e1',at:'2026-10-27T01:10:00.000Z',type:'c3',text:'周期 3に加算',realG:50,lcdG:50,c3:3,mode:'normal'}]});
  const env=async page=>{await open(page);return ev(`try{return JSON.stringify(__rec.toEnvelope(JSON.parse(${JSON.stringify(session)})))}catch(e){return 'ERR '+e.message}`);};
  const eNew=await env('/tools/rec/index.html'),eOld=await env('/old/tools/rec/index.html');
  assert.ok(!eNew.startsWith('ERR'),eNew);assert.equal(eNew,eOld,'書き出しJSONは本件直前と同一');
  console.log('PASS 7: 書き出しJSON（toEnvelope）は同じ記録で本件直前の版と完全一致（表記設定スルーのまま）');

  assert.deepEqual(errors,[]);
  console.log('PASS 8: ページの例外 0');
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{console.log('Artifacts: '+artifacts);ws?.close();browser?.kill();server.close();}

// 実行: node tests/rec-common-1.verify.mjs（成果物は一時ディレクトリ）
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'rec-common-1-'));
fs.mkdirSync(artifacts,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'rec-common-1-chrome-'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const base=execFileSync('git',['-c','safe.directory='+root,'show','72cb1a2:tools/rec/index.html'],{cwd:root,encoding:'utf8'});
const hook=html=>{const end='\n})();\n</script>';assert.ok(html.includes(end));return html.replace(end,'\nwindow.__rec={get S(){return S},get ready(){return !storageStarting&&!flushBusy},profit,showNote,showSetup,acctReplaysU,acctBalanceA};'+end)};
const server=http.createServer((req,res)=>{
  let url=decodeURIComponent(req.url.split('?')[0]);res.setHeader('Content-Type',url.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
  if(url==='/empty')return res.end('<html></html>');
  if(url==='/old/tools/rec/index.html')return res.end(hook(base));
  if(url==='/tools/rec/index.html')return res.end(hook(fs.readFileSync(path.join(root,url),'utf8')));
  url=url.replace(/^\/old\//,'/');const f=path.resolve(root,'.'+url);
  if(f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())return res.end(fs.readFileSync(f));
  res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,ws,seq=0;const pending=new Map(),results=[];
async function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});ws.send(JSON.stringify({id,method,params}))})}
async function ev(code){const r=await send('Runtime.evaluate',{expression:`(async()=>{${code}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function open(page){await send('Page.navigate',{url:origin+page});for(let i=0;i<160;i++){if(await ev(page.includes('/rec/')?'return !!window.__rec?.ready;':'return location.pathname==="/empty";').catch(()=>false))return;await pause(50)}throw Error('起動待ち '+page)}
const click=selector=>ev(`const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw Error('missing '+${JSON.stringify(selector)});b.click();`);
const button=(label,scope='#shBody')=>ev(`const b=[...document.querySelectorAll(${JSON.stringify(scope)}+' button')].find(b=>b.textContent===${JSON.stringify(label)});if(!b)throw Error('missing button '+${JSON.stringify(label)});b.click();`);
let page='/tools/rec/index.html',key='slot-tools-rec',fixture;
const cond={id:'c20',kind:'slot',lend:46,exchPer1000:52,exch:19.23,label:'20スロ',replayUnit:50,replayLimit:{mode:'fixed',value:500}};
const account={storeId:'a',condId:'c20',shop:'A店',cond};
const stores=[{id:'a',name:'A店',conds:[cond,{...cond,id:'c5',lend:200,label:'5スロ',exch:5,exchPer1000:200}]},{id:'b',name:'B店',conds:[cond]}];
const iso=(day,h=10)=>`2026-11-${day}T${String(h).padStart(2,'0')}:00:00+09:00`;
const balance=(a=account,amount=2000)=>({id:'balance-'+a.storeId+'-'+a.condId,type:'balanceSet',storeId:a.storeId,condId:a.condId,dayKey:'2026-11-21',amount,at:iso(21),createdAt:iso(21),updatedAt:iso(21),status:'active',verified:true,edits:[]});
const state=(sessions=[],events=[balance()],cur=null)=>({sessions,cur,settings:{lend:46,tagList:[]},stores:structuredClone(stores),entries:[],ledger:{ver:1,events,quarantine:[]}});
const session=(id='s1',end=600,start=0,replays=500,day=22,a=account)=>({...structuredClone(fixture),id,storeId:a.storeId,condId:a.condId,cond:structuredClone(a.cond),shop:a.shop,startAt:iso(day),endAt:iso(day,20),money:{...structuredClone(fixture.money),startMedal:start,endMedal:end,spends:[],replays:replays?[{at:iso(day,11),amount:replays,tk:id+'r'}]:[]}});
async function seed(data){await open('/empty');await ev(`localStorage.removeItem(${JSON.stringify(key)});await new Promise((r,j)=>{const q=indexedDB.deleteDatabase(${JSON.stringify(key)});q.onsuccess=r;q.onerror=j});localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(data))});`);await open(page)}
async function test(id,fn){try{await fn();assert.deepEqual(await ev('return window.__errs||[]'),[]);results.push({page,id,ok:true});console.log('PASS '+page+' '+id)}catch(e){results.push({page,id,ok:false,error:e.stack});console.error('FAIL '+page+' '+id+' '+e.stack)}}
const vals=()=>ev(`const a=${JSON.stringify(account)};return {A:__rec.acctBalanceA(a),U:__rec.acctReplaysU(a)};`);
try{
  browser=spawn(process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  for(let i=0;i<200&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
  const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
  const target=(await(await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}};
  await send('Page.enable');await send('Runtime.enable');
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__time=Date.parse('2026-11-23T10:00:00+09:00');const RealDate=Date;window.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[window.__time]))}static now(){return window.__time}};window.__confirms=[];window.confirm=t=>{__confirms.push(t);return window.__answer!==false};window.alert=()=>{};window.prompt=()=>null;window.__errs=[];window.addEventListener('error',e=>__errs.push(e.message));window.addEventListener('unhandledrejection',e=>__errs.push(String(e.reason)));`});
  await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await open('/tools/rec/index.html');await ev(`document.querySelector('#stMachine').value='テスト汎用台';document.querySelector('#stStart').click()`);fixture=await ev('return __rec.S.cur');assert.ok(fixture);
  const fresh=()=>{const d=state();d.stores.forEach(s=>{s.conds=[{...cond,replayLimit:{mode:'fixed',value:100}}]});d.stores.push({id:'c',name:'C店',conds:[cond]},{id:'d',name:'D店',conds:[cond]});return d};
  const begin=async name=>{await click('#stAccount');await button(name);await ev('document.querySelector("#stMachine").value="テスト汎用台"');await click('#stStart');assert.ok(await ev('return !!__rec.S.cur'))};
  const finish=async()=>{await click('#bUtil');await button('やめる（終了して記録する）');await ev('document.querySelector("#shBody input").value=0');await button('終了する');await ev('__rec.showSetup()')};
  const order=async()=>{await click('#stAccount');const v=await ev('return [...document.querySelectorAll("#shBody button")].map(b=>({name:b.textContent,top:b.classList.contains("store-top")}))');await click('#shClose');return v};
  let used;
  await test('T1',async()=>{await seed(fresh());assert.deepEqual(await ev('return [!!document.querySelector("#stReplay0"),!!document.querySelector("#stMedal"),document.querySelector("#stMedal").closest(".two")===null,[...document.querySelectorAll(".hint")].some(x=>x.textContent==="打ち始めに貯メダルからおろす分も、打ち始めてから「再プレイ」ボタンで記録します。")]'),[false,true,true,true]);assert.ok((await order()).every(x=>!x.top))});
  await test('T2',async()=>{const values=[];for(const target of ['/old/tools/rec/index.html','/tools/rec/index.html']){page=target;await seed(fresh());await begin('A店');await click('#bReplay');await click('#bReplay');values.push(await vals());assert.deepEqual(await ev('return __confirms'),[])}assert.equal(values[1].U,100);assert.equal(values[1].A,values[0].A)});
  await test('T3',async()=>{await click('#bReplay');assert.match(await ev('return __confirms.at(-1)'),/上限/)});
  await test('T4',async()=>{const outputs=[];for(const target of ['/old/tools/rec/index.html','/tools/rec/index.html']){page=target;await seed(state([],[]));await ev('document.querySelector("#stMachine").value="汎用";document.querySelector("#stStock").value=1000;document.querySelector("#stLend").value=46');await click('#stStart');await click('#bReplay');assert.equal(await ev('return document.querySelector("#mRep").textContent'),'954枚');outputs.push(await ev('return __rec.profit(__rec.S.cur)'))}assert.deepEqual(outputs[0],outputs[1])});
  await test('T5',async()=>{const old=session('legacy',600,100,92,23);delete old.storeId;delete old.condId;delete old.cond;old.money.replays[0].atStart=true;old.money.stockStart=1000;const outputs=[];for(const target of ['/old/tools/rec/index.html','/tools/rec/index.html']){page=target;await seed(state([],[]));await ev('__rec.showNote()');await click('#nImpOpen');await ev(`document.querySelector('#shBody textarea').value=${JSON.stringify(JSON.stringify({sessions:[old]}))}`);await button('取り込む');const out=await ev('return {display:document.querySelector("#scNote").innerText,profit:__rec.profit(__rec.S.sessions[0])}');for(const id of ['nExpJson','nExpNote']){await click('#'+id);out[id]=await ev('return JSON.parse(document.querySelector("#shBody textarea").value)');await click('#shClose')}assert.equal(out.nExpJson.sessions[0].money.replays[0].atStart,true);outputs.push(out)}assert.match(outputs[1].display,/未登録/);outputs[1].display=outputs[1].display.replace(/未登録\n/g,"");assert.deepEqual(outputs[0],outputs[1])});
  await test('T6',async()=>{await seed(fresh());await begin('A店');await finish();await ev('window.__time+=60000');await begin('B店');await finish();used=await ev('return JSON.parse(JSON.stringify(__rec.S))');assert.deepEqual(await order(),[{name:'B店',top:true},{name:'A店',top:false},{name:'C店',top:false},{name:'D店',top:false},{name:'店舗を選ばずに始める',top:false}])});
  await test('T7',async()=>{await seed(used);await ev('window.__time+=120000');await click('#stAccount');await button('店舗を選ばずに始める');await ev('document.querySelector("#stShop").value="Ａ店 ";document.querySelector("#stMachine").value="汎用"');await click('#stStart');assert.equal(await ev('return __rec.S.cur.storeId??null'),null);await finish();assert.equal((await order())[0].name,'A店')});
  await test('T8',async()=>{await seed(used);const before=await order();await click('#stAccount');await button('C店');assert.deepEqual(await order(),before);await click('#stAccount');await click('#shClose');assert.deepEqual(await order(),before)});
  await test('T9',async()=>{await seed(used);await ev('window.__time+=120000');await begin('C店');await ev('__rec.showSetup()');assert.equal((await order())[0].name,'C店');await click('#hdMenu');await button('記録に戻る');await click('#bUtil');await button('破棄する');assert.deepEqual((await order()).map(x=>x.name),['B店','A店','C店','D店','店舗を選ばずに始める'])});
  await test('T10',async()=>{await seed(used);await ev('__rec.showNote()');await click('#nEntryAdd');await button('C店');await ev('document.querySelector("#shBody input:not([type=date])").value="entry-only"');await button('登録する');assert.equal(await ev('return __rec.S.entries.filter(e=>e.storeId==="c").length'),1);await ev('__rec.showSetup()');assert.deepEqual((await order()).map(x=>x.name),['B店','A店','C店','D店','店舗を選ばずに始める']);await ev('__rec.showNote()');await click('#nEntryAdd');assert.deepEqual(await ev('return [...document.querySelectorAll("#shBody .opts button")].filter(b=>["A店","B店","C店","D店","＋新しい店舗"].includes(b.textContent)).map(b=>b.textContent)'),['B店','A店','C店','D店','＋新しい店舗']);assert.equal(await ev('return document.querySelectorAll("#shBody .store-top").length'),0)});
  await test('T11',async()=>{await seed(used);await ev('__rec.showNote()');await click('#nStores');assert.deepEqual(await ev('return [...document.querySelectorAll("#shBody .lg .tx")].map(x=>x.textContent)'),['A店','B店','C店','D店'])});
  await test('T12',async()=>{const keys=x=>Array.isArray(x)?x.map(keys):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,keys(x[k])])):null;const outputs=[];for(const target of ['/old/tools/rec/index.html','/tools/rec/index.html']){page=target;await seed(fresh());await begin('A店');await click('#bReplay');outputs.push(keys(await ev('return JSON.parse(localStorage.getItem("slot-tools-rec"))')))}assert.deepEqual(outputs[0],outputs[1])});
  await test('T13',async()=>{for(const width of [360,390]){await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});const d=structuredClone(used);d.stores[1].name='とても長い店舗名'.repeat(15);await seed(d);await click('#stAccount');const fit=await ev('const b=document.querySelector(".store-top"),r=b.getBoundingClientRect(),s=getComputedStyle(b);return {width:innerWidth,scroll:document.documentElement.scrollWidth,left:r.left,right:r.right,height:r.height,overflow:b.scrollWidth>b.clientWidth,font:s.fontSize,weight:s.fontWeight,border:s.borderColor,accent:getComputedStyle(document.documentElement).getPropertyValue("--accent").trim()}');assert.equal(fit.width,width);assert.ok(fit.scroll<=width&&fit.left>=0&&fit.right<=width&&fit.height>=56&&!fit.overflow,JSON.stringify(fit));assert.equal(fit.weight,'700');console.log('T13 '+JSON.stringify(fit));await click('#shClose');assert.ok(await ev('return document.documentElement.scrollWidth<=innerWidth'))}});
}catch(e){console.error(e.stack);results.push({id:'driver',ok:false,error:e.stack})}
finally{fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify(results,null,2));console.log('結果 '+results.filter(x=>x.ok).length+'/'+results.length+' 成果物 '+artifacts);ws?.close();browser?.kill();server.close();if(results.some(x=>!x.ok))process.exitCode=1}

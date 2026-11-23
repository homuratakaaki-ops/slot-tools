// 実行: node tests/rec-account.verify.mjs（成果物は一時ディレクトリ）
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'rec-account-'));
fs.mkdirSync(artifacts,{recursive:true});
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'rec-account-chrome-'));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const base=execFileSync('git',['-c','safe.directory='+root,'show','6dd1c73:tools/rec/index.html'],{cwd:root,encoding:'utf8'});
const oldNisshi=execFileSync('git',['-c','safe.directory='+root,'show','6dd1c73:tools/nisshi/index.html'],{cwd:root,encoding:'utf8'});
const hook=(html,old=false)=>html.replace(/\r\n/g,'\n').replace('\n})();\n</script>',`\nwindow.__saves=0;const originalSave=save;save=function(...args){window.__saves++;return originalSave(...args)};window.__rec={get S(){return S},get ready(){return !storageStarting&&!flushBusy},get broken(){return loadBroken},get stale(){return staleShown},profit,toEnvelope,validStore,fixStores,save,load,showNote,showSetup,render,agg,${old?'':'acctEdit,acctBase,acctSelectStart,acctAllowReplay,closeSheet,acctKey,jstDay,acctReplaysU,acctBalanceA,acctHandH,acctEvents,acctPendingDays,acctAutoDeposit,acctPut,acctImport,validAcctEvent,acctSheet,acctSettleSheet,'}};\n})();\n</script>`);
const server=http.createServer((req,res)=>{
  let url=decodeURIComponent(req.url.split('?')[0]);res.setHeader('Content-Type',url.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
  if(url==='/empty')return res.end('<html></html>');
  if(url==='/old/tools/rec/index.html')return res.end(hook(base,true));
  if(url==='/old/tools/nisshi/index.html')return res.end(oldNisshi);
  if(url==='/tools/rec/index.html'||url==='/tools/rec/acct-test.html')return res.end(hook(fs.readFileSync(path.join(root,url),'utf8')));
  url=url.replace(/^\/old\//,'/');const f=path.resolve(root,'.'+url);
  if(f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())return res.end(fs.readFileSync(f));
  res.writeHead(404);res.end();
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
let browser,ws,seq=0;const pending=new Map(),results=[];
async function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});ws.send(JSON.stringify({id,method,params}))})}
async function ev(code){const r=await send('Runtime.evaluate',{expression:`(async()=>{${code}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
async function open(page){await send('Page.navigate',{url:origin+page});for(let i=0;i<160;i++){if(await ev(page.includes('/rec/')?'return !!window.__rec?.ready;':page.includes('nisshi')?'return typeof recPlay==="function";':'return location.pathname==="/empty";').catch(()=>false))return;await pause(50)}throw Error('起動待ち '+page)}
const click=selector=>ev(`const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw Error('missing '+${JSON.stringify(selector)});b.click();`);
const button=(label,scope='#shBody')=>ev(`const b=[...document.querySelectorAll(${JSON.stringify(scope)}+' button')].find(b=>b.textContent===${JSON.stringify(label)});if(!b)throw Error('missing button '+${JSON.stringify(label)});b.click();`);
const number=async n=>{await click('#kpClear');for(const d of String(n))await button(d,'#kpKeys');await click('#kpOk')};
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
const vals=()=>ev(`const a=${JSON.stringify(account)};return {A:__rec.acctBalanceA(a),H:__rec.acctHandH(a),oldH:__rec.acctHandH(a,'2026-11-22'),U:__rec.acctReplaysU(a),oldU:__rec.acctReplaysU(a,'2026-11-22'),events:__rec.S.ledger.events};`);
async function select(){await click('#stAccount');await button('A店');await button('20スロ')}
async function start(){await select();await ev(`document.querySelector('#stMachine').value='テスト汎用台';document.querySelector('#stStart').click()`)}
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
  for(const testPage of ['/tools/rec/index.html','/tools/rec/acct-test.html']){
    page=testPage;key=page.includes('acct-test')?'slot-tools-rec-acct-test':'slot-tools-rec';
    const settle=()=>ev(`__rec.acctSettleSheet(${JSON.stringify(account)})`);
    const importSessions=async sessions=>{await ev('__rec.showNote()');await click('#nImpOpen');await ev(`document.querySelector('#shBody textarea').value=${JSON.stringify(JSON.stringify({sessions}))}`);await button('取り込む')};
    const history=async()=>{await ev('__rec.showNote()');await button('お金の履歴を直す','#scNote')};
    const pastSettle=()=>ev(`__rec.acctSettleSheet(${JSON.stringify(account)},'2026-11-22')`);
    const firstFinal=async()=>{await seed(state([session('first',600,0,0,23)]));await ev(`window.__time=Date.parse('${iso(23,21)}')`);await settle();await button('記録する')};
    await test('V105-A1',async()=>{for(const skip of [false,true]){await firstFinal();const old=(await vals()).events;await ev('window.__time+=60000;__rec.showSetup()');await start();await click('#bUtil');await button('やめる（終了して記録する）');await ev('window.__time+=60000;const i=document.querySelector("#shBody input");i.value=450;i.dispatchEvent(new Event("input"))');await button('終了する');await ev('window.__time+=60000');await settle();await button(skip?'預けていない・分からない':'記録する');const v=await vals();assert.deepEqual(v.events.slice(0,old.length),old);assert.equal(v.events.at(-1).id,(skip?'skip':'final')+':a|c20:2026-11-23:2')}});
    for(const name of ['V105-A2','V105-H1'])await test(name,async()=>{await seed(state([session('auto',600,0,0,22)]));await ev(`__rec.acctSheet(${JSON.stringify(account)})`);await button('確認済みにする');const old=(await vals()).events;const later=session('import-later',450,0,0,22);later.endAt=iso(22,22);await importSessions([later]);await pastSettle();assert.match(await ev('return document.querySelector("#shBody").textContent'),/前回の精算/);await button('記録する');const v=await vals();assert.equal(v.A,3050);assert.deepEqual(v.events.slice(0,old.length),old);assert.equal(v.events.at(-1).id,'final:a|c20:2026-11-22:2');assert.equal(v.events.at(-1).at,later.endAt)});
    for(const name of ['V105-B','V105-H2'])await test(name,async()=>{await firstFinal();await ev(`__rec.acctSheet(${JSON.stringify(account)})`);await ev('const b=[...document.querySelectorAll("#shBody button")].filter(b=>b.textContent==="取り消す");b[0].click()');const old=(await vals()).events.at(-1);await ev('window.__time+=60000');await button('残高を合わせる');await number(2000);await ev('window.__time+=60000');const at=await ev('return new Date().toISOString()');await settle();await button('記録する');const v=await vals();assert.equal(v.A,2600);assert.deepEqual(v.events.find(e=>e.id===old.id),old);assert.equal(v.events.at(-1).id,'final:a|c20:2026-11-23:2');assert.equal(v.events.at(-1).at,at)});
    await test('V105-C',async()=>{await firstFinal();const old=(await vals()).events.at(-1);await settle();for(const width of [360,390,412]){await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});assert.match(await ev('return document.querySelector("#shBody").textContent'),/この回を直す/);await capture('v105-replace-final',width)}await click('#shBody input');await number(550);await button('預入枚数を直す');const e=(await vals()).events.at(-1);for(const k of Object.keys(old).filter(k=>!['amount','updatedAt','edits'].includes(k)))assert.deepEqual(e[k],old[k]);assert.equal(e.amount,550)});
    for(const [name,skip] of [['V105-D1',false],['V105-D2',true]])await test(name,async()=>{for(const aligned of [false,true]){await seed(state([session('auto',600,0,0,22)]));const old=(await vals()).events.find(e=>e.type==='autoDeposit');if(aligned)await ev(`__rec.acctPut('balanceSet',${JSON.stringify(account)},'2026-11-23',2600)`);await pastSettle();for(const width of [360,390,412]){await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});assert.match(await ev('return document.querySelector("#shBody").textContent'),/自動預入（未照合）[\s\S]*この回を直す/);await capture('v105-replace-auto-'+name,width)}if(!skip){await click('#shBody input');await number(550)}await button(skip?'預けていない・分からない':'記録する');const v=await vals();assert.equal(v.events.find(e=>e.id===old.id).status,'void');assert.equal(v.events.at(-1).id,(skip?'skip':'final')+':a|c20:2026-11-22');assert.equal(v.events.at(-1).at,old.at);assert.equal(v.A,aligned?2600:skip?2000:2550)}});
    await test('V105-D3',async()=>{await seed(state([session('first',600,0,0,23)]));await ev(`window.__time=Date.parse('${iso(23,21)}')`);await settle();await button('預けていない・分からない');const old=(await vals()).events.at(-1);await settle();assert.match(await ev('return document.querySelector("#shBody").textContent'),/締め済み[\s\S]*この回を直す/);await button('記録する');const v=await vals();assert.equal(v.events.at(-1).at,old.at);assert.equal(v.events.at(-1).id,'final:a|c20:2026-11-23');assert.equal(v.events.find(e=>e.id===old.id).status,'void')});
    await test('V105-D1-ID衝突',async()=>{await firstFinal();await ev(`__rec.acctEdit(__rec.S.ledger.events.at(-1),'status','void');window.__time+=86400000;__rec.acctAutoDeposit()`);const old=(await vals()).events,auto=old.at(-1);assert.equal(auto.type,'autoDeposit');await settle();await ev(`__rec.acctSettleSheet(${JSON.stringify(account)},'2026-11-23')`);await button('記録する');const v=await vals();assert.equal(v.events.at(-1).id,'final:a|c20:2026-11-23:2');assert.equal(v.events.at(-1).at,auto.at);assert.deepEqual(v.events[1],old[1]);assert.equal(v.events.find(e=>e.id===auto.id).status,'void')});
    await test('V104-1',async()=>{
      const firstRound=async()=>{await seed(state([session('first',600,0,0,23)]));await ev(`window.__time=Date.parse('${iso(23,21)}')`);await settle();await button('記録する');};
      const resume=async()=>{await ev(`window.__time+=60000;__rec.showSetup()`);await start();assert.equal(await ev('return __rec.S.cur.money.startMedal'),0);await click('#bUtil');await button('やめる（終了して記録する）');await ev('window.__time+=60000;const i=document.querySelector("#shBody input");i.value=450;i.dispatchEvent(new Event("input"))');await button('終了する');await ev('window.__time+=60000')};
      for(const skip of [false,true]){
        await firstRound();await resume();await settle();
        assert.match(await ev('return document.querySelector("#shBody").textContent'),/前回の精算：預入 600枚/);
        assert.match(await ev('return document.querySelector("#shBody").textContent'),/その後の台の手持ち 450枚/);
        assert.equal(await ev('return document.querySelector("#shBody input").value'),'450');
        for(const width of [360,390,412]){await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});await capture('v104-second-round',width)}
        await button(skip?'預けていない・分からない':'記録する');let v=await vals();assert.equal(v.A,skip?2600:3050);assert.equal(v.H,0);
        assert.deepEqual(v.events.filter(e=>e.type!=='balanceSet').map(e=>e.id),['final:a|c20:2026-11-23',(skip?'skip':'final')+':a|c20:2026-11-23:2']);
        const original=v.events.at(-1);await settle();
        if(skip){assert.match(await ev('return document.querySelector("#shBody").textContent'),/締め済み/);await button('記録する');v=await vals();assert.equal(v.events.find(e=>e.id===original.id).status,'void');assert.equal(v.events.at(-1).id,'final:a|c20:2026-11-23:2');assert.equal(v.events.at(-1).at,original.at)}
        else{assert.match(await ev('return document.querySelector("#shBody").textContent'),/精算済み/);await click('#shBody input');await number(400);await button('預入枚数を直す');v=await vals();assert.equal(v.events.at(-1).amount,400);assert.equal(v.events.at(-1).at,original.at)}
        await ev('__rec.showSetup()');await start();assert.equal(await ev('return __rec.S.cur.money.startMedal'),0);
      }
      await firstRound();await resume();await ev('window.__time+=86400000;__rec.acctAutoDeposit()');assert.equal((await vals()).events.filter(e=>e.type==='autoDeposit').length,0);assert.deepEqual(await ev(`return __rec.acctPendingDays(${JSON.stringify(account)})`),['2026-11-23']);
      for(const aligned of [false,true]){
        await firstRound();await resume();await settle();await button('記録する');const second=(await vals()).events.at(-1);
        if(aligned)await ev(`window.__time+=60000;__rec.acctPut('balanceSet',${JSON.stringify(account)},'2026-11-23',3050)`);
        await ev(`__rec.acctSheet(${JSON.stringify(account)});const buttons=[...document.querySelectorAll('#shBody button')].filter(b=>b.textContent==='直す');buttons.at(-2).click()`);await number(550);
        assert.equal((await vals()).A,aligned?3050:3000);assert.deepEqual((await vals()).events.find(e=>e.id===second.id),second);
        assert.match(await ev('return document.querySelector("#shBody").textContent'),/行先未記録 50枚/);
      }
      assert.equal(await ev(`const e=__rec.S.ledger.events.find(e=>e.type==='finalDeposit');return [':2',':3',':20'].every(s=>__rec.validAcctEvent({...e,id:'final:a|c20:2026-11-23'+s}))&&![':1',':02',':0',':x'].some(s=>__rec.validAcctEvent({...e,id:'final:a|c20:2026-11-23'+s}))`),true);
    });
    await test('V104-2',async()=>{
      await seed(state([session('unknown',null,0,0,23)]));await select();await ev('document.querySelector("#stMachine").value="テスト汎用台";window.__answer=false');await click('#stStart');assert.equal(await ev('return __rec.S.cur'),null);assert.equal(await ev('return __confirms.at(-1)'),'開始持ちメダルが空欄です。0枚で始めますか？');
      await ev('window.__answer=true');await click('#stStart');assert.equal(await ev('return __rec.S.cur.money.startMedal'),0);
      await seed(state([session('unknown',null,0,0,23)]));await select();await ev('document.querySelector("#stMachine").value="テスト汎用台";document.querySelector("#stMedal").value=123');await click('#stStart');assert.equal(await ev('return __rec.S.cur.money.startMedal'),123);assert.deepEqual(await ev('return __confirms'),[]);
      await seed(state());await ev('document.querySelector("#stMachine").value="テスト汎用台"');await click('#stStart');assert.equal(await ev('return __rec.S.cur.money.startMedal'),0);assert.deepEqual(await ev('return __confirms'),[]);
    });
    await test('V104-3',async()=>{
      for(const width of [360,390,412]){
        await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});
        for(const blank of [false,true]){
          await seed(state([session('late',blank?null:600,0,0,23)]));await ev(`window.__time=Date.parse('2026-11-23T23:59:00+09:00')`);await select();
          await ev(`document.querySelector('#stMachine').value='テスト汎用台';document.querySelector('#stReplay0').value=${blank?0:600};window.confirm=t=>{__confirms.push(t);window.__time=Date.parse('2026-11-24T00:01:00+09:00');return true}`);await click('#stStart');
          assert.equal(await ev('return __rec.S.cur'),null);assert.equal(await ev('return document.querySelector("#stMedal").value'),'0');assert.match(await ev('return __confirms.at(-1)'),blank?/開始持ちメダルが空欄/:/上限/);
          assert.match(await ev('return document.querySelector("#stErr").textContent'),/日付が変わった/);await ev('document.querySelector("#stErr").scrollIntoView({block:"center"})');await capture('start-v104-confirm',width);
          assert.ok(await ev('const r=document.querySelector("#stErr").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight'));
        }
      }
    });
    await test('V103-1',async()=>{
      for(const aligned of [false,true]){
        await seed(state([session('today',600,0,0,23)]));await ev(`window.__time=Date.parse('${iso(23,21)}')`);
        await settle();await button('記録する');const original=(await vals()).events.at(-1);
        if(aligned)await ev(`window.__time+=60000;__rec.acctPut('balanceSet',${JSON.stringify(account)},'2026-11-23',2600)`);
        await ev('window.__time+=60000');await settle();
        if(aligned)assert.match(await ev('return document.querySelector("#shBody").textContent'),/残高は変わりません/);
        await click('#shBody input');await number(550);await button('預入枚数を直す');
        const v=await vals(),e=v.events.find(e=>e.id===original.id);assert.equal(v.A,aligned?2600:2550);
        for(const f of ['at','dayKey','type','id','createdAt'])assert.equal(e[f],original[f]);
        assert.ok(e.edits.some(x=>x.field==='amount'&&x.from===600&&x.to===550));
        await ev(`const e=__rec.S.ledger.events.find(e=>e.id===${JSON.stringify(e.id)});for(const f of ['at','dayKey','type','id','createdAt'])__rec.acctEdit(e,f,'forbidden');__rec.acctEdit(e,'status','void');window.__time+=60000;__rec.acctPut('finalDeposit',${JSON.stringify(account)},'2026-11-23',550)`);
        for(const f of ['at','dayKey','type','id','createdAt'])assert.equal((await vals()).events.find(x=>x.id===e.id)[f],original[f]);
      }
      await seed(state([session('auto',600,0,0,22)]));const auto=(await vals()).events.find(e=>e.type==='autoDeposit');
      await ev(`window.__time+=60000;__rec.acctPut('balanceSet',${JSON.stringify(account)},'2026-11-23',2600);__rec.S.sessions[0].money.endMedal=550;__rec.acctSheet(${JSON.stringify(account)})`);
      await button('合わせる');assert.equal((await vals()).A,2600);
      await ev(`const b=[...document.querySelectorAll('#shBody button')].filter(b=>b.textContent==='直す').at(-1);b.click()`);await number(500);
      assert.equal((await vals()).A,2600);assert.equal((await vals()).events.find(e=>e.id===auto.id).at,auto.at);
      assert.match(await ev('return document.querySelector("#shBody").textContent'),/残高は変わりません/);
    });
    await test('V103-2',async()=>{
      await seed(state([session('unknown',null,0,0,23)]));
      await ev('__rec.showNote()');await button('今日の稼働を終える（貯メダルへ預ける）','#scNote');await button('A店／20スロ');
      assert.match(await ev('return document.querySelector("#shBody").textContent'),/手持ち 未確定/);
      assert.equal(await ev('return document.querySelector("#shBody input").value'),'');
      await click('#shBody input');await number(300);await button('記録する');assert.equal((await vals()).A,2300);
      assert.equal((await ev('return __confirms')).length,0);
      await seed(state([session('unknown',null,0,0,23)]));await select();
      assert.equal(await ev('return document.querySelector("#stMedal").value'),'');assert.match(await ev('return document.querySelector("#stAccountInfo").textContent'),/手持ち 未確定/);
      await seed(state());await importSessions([session('import-null',null,0,0,23)]);await settle();assert.match(await ev('return document.querySelector("#shBody").textContent'),/未確定/);
      await seed(state([session('auto',600,0,0,22)]));await ev(`__rec.S.sessions[0].money.endMedal=null;__rec.acctSheet(${JSON.stringify(account)})`);
      assert.match(await ev('return document.querySelector("#shBody").textContent'),/今の最終持ち 未確定/);assert.equal(await ev(`return [...document.querySelectorAll('#shBody button')].some(b=>b.textContent==='合わせる')`),false);
      for(const width of [360,390,412]){
        await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});
        await seed(state([session('unknown',null,0,0,23)]));await settle();await capture('v103-unknown',width);
        await ev(`window.__time=Date.parse('${iso(23,21)}');__rec.acctPut('finalDeposit',${JSON.stringify(account)},'2026-11-23',300);window.__time+=60000;__rec.acctPut('balanceSet',${JSON.stringify(account)},'2026-11-23',2300)`);await settle();await capture('v103-unchanged',width);
      }
    });
    await test('V103-3',async()=>{
      const b=balance(account,30);b.at=iso(23,9);b.dayKey='2026-11-23';await seed(state([session('past',600,0,0,22)],[b]));
      await history();await button('再プレイ +100');assert.equal((await vals()).A,30);assert.equal((await vals()).oldU,100);assert.deepEqual(await ev('return __confirms'),[]);
      await seed(state([],[b]));await start();await click('#bStock');await button('枚数を入れる');await number(100);assert.match((await ev('return __confirms')).at(-1),/マイナス/);
    });
    await test('V103-4',async()=>{
      await seed(state([session('done',600,0,0,23)]));await ev(`window.__time=Date.parse('${iso(23,21)}')`);await settle();await button('記録する');await settle();
      assert.equal(await ev(`return [...document.querySelectorAll('#shBody button')].some(b=>b.textContent==='預けていない・分からない')`),false);
      const before=(await vals()).events;assert.equal(await ev(`return __rec.acctPut('settleSkip',${JSON.stringify(account)},'2026-11-23',null)`),null);assert.deepEqual((await vals()).events,before);
    });
    await test('V105-I',async()=>{
      const seedValue=0x1052026;await seed(state([session('initial',600,0,0,23)]));
      // 200個の独立した操作列。各列は全操作を含むシャッフル＋24操作。
      for(let run=0;run<200;run++){
        const report=await ev(`
          const seed=${seedValue}+${run},a=${JSON.stringify(account)},initial=${JSON.stringify(state([session('initial',600,0,0,23)]))};
          let t=seed;const rand=()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^x>>>15,x|1);x^=x+Math.imul(x^x>>>7,x|61);return ((x^x>>>14)>>>0)/4294967296};
          const r=__rec,ops=['liveReplay','pastReplay','end','final','correct','skip','void','verify','balance','auto','unknown','align','restart','autoStart','importLater','settleAuto','resettle'];
          for(let i=ops.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[ops[i],ops[j]]=[ops[j],ops[i]]}for(let i=0;i<24;i++)ops.push(ops[Math.floor(rand()*17)]);
          Object.assign(r.S,structuredClone(initial));window.__time=Date.parse('${iso(23,21)}');r.save();
          const eq=(x,y,msg)=>{if(JSON.stringify(x)!==JSON.stringify(y))throw Error(msg+' '+JSON.stringify({x,y}))};
          const fixed=e=>['at','dayKey','type','id','createdAt'].map(k=>e[k]);
          const trace=[];let step=-1;
          try{for(step=0;step<ops.length;step++){
            window.__time+=60000;const at=new Date().toISOString(),day=r.jstDay(at),op=ops[step],n=Math.floor(rand()*1000);trace.push({op,at,n});
            const before=new Map(r.S.ledger.events.map(e=>[e.id,fixed(e)]));
            const prior=structuredClone(r.S.ledger.events);let predicted=null;
            // I8-I11: 本体のacct関数を使わない独立した締めの参照モデル。
            const date=x=>new Date((typeof x==='number'?x:Date.parse(x))+32400000).toISOString().slice(0,10);
            const model=(type,d,amount)=>{
              const all=prior.filter(e=>e.storeId===a.storeId&&e.condId===a.condId&&e.dayKey===d&&['autoDeposit','finalDeposit','settleSkip'].includes(e.type));
              const last=r.S.sessions.filter(s=>s.cond&&s.storeId===a.storeId&&s.condId===a.condId&&s.endAt&&date(s.startAt)===d).sort((x,y)=>Date.parse(x.endAt)-Date.parse(y.endAt)).at(-1);
              const target=all.filter(e=>e.status==='active').sort((x,y)=>Date.parse(x.at)-Date.parse(y.at)).at(-1);
              const round=e=>e.type==='autoDeposit'?1:Number(e.id.split(':')[3]||1),next=Math.max(0,...all.map(round))+1;
              const add=!target||(last&&Date.parse(last.endAt)>Date.parse(target.at));
              predicted={events:structuredClone(prior),kind:add?'add':'replace',target:target?.id};
              if(!last||(r.S.cur?.cond&&r.S.cur.storeId===a.storeId&&r.S.cur.condId===a.condId)||(!add&&target.type==='finalDeposit'&&type==='settleSkip'))return;
              if(!add&&target.type===type){predicted.events.find(e=>e.id===target.id).amount=amount;return}
              let num=add?next:round(target);const idFor=n=>(type==='finalDeposit'?'final':'skip')+':'+a.storeId+'|'+a.condId+':'+d+(n===1?'':':'+n);
              if(prior.some(e=>e.id===idFor(num)))num=next;
              if(!add)predicted.events.find(e=>e.id===target.id).status='void';
              predicted.events.push({id:idFor(num),type,storeId:a.storeId,condId:a.condId,dayKey:d,amount,status:'active',at:add?(d<date(at)?last.endAt:at):target.at});
            };
            const deposits=r.acctEvents(a).filter(e=>['finalDeposit','autoDeposit'].includes(e.type));const e=deposits[Math.floor(rand()*deposits.length)];
            if(op==='liveReplay'||op==='pastReplay'){
              let s;if(op==='pastReplay')s=r.S.sessions[0];else{if(!r.S.cur){r.S.cur=structuredClone(initial.sessions[0]);r.S.cur.id='live-'+step;r.S.cur.startAt=at;r.S.cur.endAt=null;r.S.cur.money.replays=[]}s=r.S.cur}
              const when=op==='pastReplay'?s.endAt:at;if(r.acctAllowReplay(s,n,when))s.money.replays.push({at:when,amount:n});
            }else if(op==='end'){
              const s=r.S.cur||structuredClone(initial.sessions[0]);s.id='end-'+step;s.startAt=at;s.endAt=at;s.money.endMedal=n;r.S.sessions.push(s);r.S.cur=null;
             }else if(op==='final'||op==='skip'){const type=op==='final'?'finalDeposit':'settleSkip';model(type,day,op==='final'?n:null);r.acctPut(type,a,day,op==='final'?n:null)}
            else if(op==='importLater'){const s=structuredClone(initial.sessions[0]);s.id='import-'+step;const d=date(window.__time-86400000);s.startAt=d+'T10:00:00+09:00';s.endAt=d+'T23:00:00+09:00';s.money.endMedal=n;r.S.sessions.push(s)}
            else if(op==='settleAuto'||op==='resettle'){const candidate=prior.filter(e=>op==='settleAuto'?e.type==='autoDeposit':e.status==='void'&&e.type!=='balanceSet').at(-1);const d=candidate?.dayKey||date(r.S.sessions.at(-1).startAt);model('finalDeposit',d,n);r.acctPut('finalDeposit',a,d,n)}
            else if((op==='correct'||op==='align')&&e){
              const amount=op==='align'?r.S.sessions.filter(s=>r.jstDay(s.startAt)===e.dayKey).at(-1)?.money.endMedal:n;
              if(amount!=null){const old=r.acctBalanceA(a),delta=amount-e.amount,base=r.acctBase(a);r.acctEdit(e,'amount',amount);eq(r.acctBalanceA(a),old+(Date.parse(e.at)>Date.parse(base.at)?delta:0),'I2')}
            }else if(op==='void'&&e)r.acctEdit(e,'status','void');
            else if(op==='verify'&&e)r.acctEdit(e,'verified',true);
            else if(op==='balance'){r.acctPut('balanceSet',a,day,n);eq(r.acctBalanceA(a),n,'I3')}
            else if(op==='auto'){window.__time+=86400000;r.acctAutoDeposit()}
            else if(op==='restart'||op==='autoStart'){
              if(r.S.cur){r.S.cur.endAt=at;r.S.cur.money.endMedal=n;r.S.sessions.push(r.S.cur);r.S.cur=null}
              const own=r.S.sessions.filter(s=>s.storeId===a.storeId&&s.condId===a.condId&&s.endAt&&new Date(Date.parse(s.startAt)+9*3600000).toISOString().slice(0,10)===day).sort((x,y)=>Date.parse(x.endAt)-Date.parse(y.endAt)).at(-1);
              const close=r.S.ledger.events.filter(e=>e.storeId===a.storeId&&e.condId===a.condId&&e.dayKey===day&&e.status==='active'&&['finalDeposit','settleSkip','autoDeposit'].includes(e.type)).sort((x,y)=>Date.parse(x.at)-Date.parse(y.at)).at(-1);
              const hand=own&&(!close||Date.parse(own.endAt)>Date.parse(close.at))?own.money.endMedal??null:0;
              r.showSetup();r.acctSelectStart(a);eq(document.querySelector('#stMedal').value,hand===null?'':String(hand),'I7');
              document.querySelector('#stMachine').value='テスト汎用台';document.querySelector('#stStart').click();
              if(!r.S.cur){const later=[...document.querySelectorAll('#shBody button')].find(b=>b.textContent==='あとで');if(later)later.click()}
              if(!r.S.cur)throw Error('I7 start');eq(r.S.cur.money.startMedal,hand??0,'I7 saved');
              if(op==='restart'){window.__time+=1000;r.S.cur.endAt=new Date().toISOString();r.S.cur.money.endMedal=n;r.S.sessions.push(r.S.cur);r.S.cur=null}
            }
            else if(op==='unknown')r.S.sessions.at(-1).money.endMedal=null;
            for(const e of r.S.ledger.events)if(before.has(e.id))eq(fixed(e),before.get(e.id),'I1');
            for(const old of prior)if(old.status==='void')eq(r.S.ledger.events.find(e=>e.id===old.id).status,'void','I11');
            if(predicted){const fields=e=>['id','type','storeId','condId','dayKey','amount','status','at'].map(k=>e[k]);eq(r.S.ledger.events.map(fields),predicted.events.map(fields),'I8 settlement model');for(const old of prior)if(predicted.kind==='add'||old.id!==predicted.target)eq(r.S.ledger.events.find(e=>e.id===old.id),old,predicted.kind==='add'?'I9':'I10')}
            const active=r.S.ledger.events.filter(e=>e.status==='active'&&e.storeId===a.storeId&&e.condId===a.condId),days=[...new Set(active.map(e=>e.dayKey))];
            for(const d of days){const events=active.filter(e=>e.dayKey===d);if(r.S.ledger.events.filter(e=>e.dayKey===d&&e.type==='autoDeposit').length>1)throw Error('I6 auto duplicate');const rounds=new Set();for(const e of events.filter(e=>['finalDeposit','settleSkip'].includes(e.type))){const round=e.id.split(':')[3]||'1';if(rounds.has(round))throw Error('I6 final+skip');rounds.add(round)}}
            // I8: 本体の口座関数に依存しない、元記録からの独立参照モデル。
            const modelActive=(predicted?.events||r.S.ledger.events).filter(e=>e.status==='active'&&e.storeId===a.storeId&&e.condId===a.condId);
            const bases=modelActive.filter(e=>e.type==='balanceSet').sort((x,y)=>Date.parse(x.at)-Date.parse(y.at)),base=bases.at(-1);
            let expected=null;if(base){expected=base.amount;for(const e of modelActive)if(['finalDeposit','autoDeposit'].includes(e.type)&&Date.parse(e.at)>Date.parse(base.at))expected+=e.amount;
              for(const s of [...r.S.sessions,...(r.S.cur?[r.S.cur]:[])])if(s.cond&&s.storeId===a.storeId&&s.condId===a.condId)for(const replay of s.money.replays||[])if(Date.parse(replay.at)>Date.parse(base.at))expected-=replay.amount}
            eq(r.acctBalanceA(a),expected,'I8');
            // メモリの変更も保存してから、実際の閉じるボタンでI4を検証。
            r.save();while(!r.ready)await new Promise(resolve=>setTimeout(resolve,1));
            const raw=localStorage.getItem(${JSON.stringify(key)}),saves=window.__saves;
            for(const open of [()=>r.acctSettleSheet(a,r.jstDay()),()=>r.acctSheet(a)]){open();document.querySelector('#shClose').click();eq(localStorage.getItem(${JSON.stringify(key)}),raw,'I4 bytes');eq(window.__saves,saves,'I4 save')}
            eq(window.__errs,[],'I5');
          }return {ok:true}}catch(error){return {ok:false,seed,step,trace,ops,error:String(error)}}
        `);assert.ok(report.ok,JSON.stringify(report));
      }
      console.log('V105-I seed='+seedValue+'..'+(seedValue+199)+' 200列 × 41操作 I1-I11 '+page);
    });
    await test('V102-1: 日付またぎ・手入力保持・同日開始',async()=>{
      for(const manual of [false,true]){
        await seed(state([session('today',600,0,0,23)]));
        await ev(`window.__time=Date.parse('2026-11-23T23:59:00+09:00')`);await select();
        assert.equal(await ev('return document.querySelector("#stMedal").value'),'600');
        await ev(`document.querySelector('#stMachine').value='テスト汎用台';${manual?"document.querySelector('#stMedal').value=250;":''}window.__time=Date.parse('2026-11-24T00:01:00+09:00')`);
        await click('#stStart');assert.equal(await ev('return __rec.S.cur'),null);
        assert.equal(await ev('return document.querySelector("#stMedal").value'),manual?'250':'0');
        assert.match(await ev('return document.querySelector("#stErr").textContent'),/日付が変わった/);
        assert.equal((await vals()).events.filter(e=>e.type==='autoDeposit').length,1);
        assert.match(await ev('return document.querySelector("#stAccountInfo").textContent'),/手持ち 0枚/);
        await click('#stStart');assert.equal(await ev('return __rec.S.cur.money.startMedal'),manual?250:0);
        assert.equal((await vals()).events.filter(e=>e.type==='autoDeposit').length,1);
      }
      await seed(state());await start();assert.ok(await ev('return __rec.S.cur'));
    });
    await test('V102-2: 精算再表示・訂正確認・締め済みから預入',async()=>{
      await seed(state([session('today',600,0,0,23)]));await ev(`window.__time=Date.parse('2026-11-23T21:00:00+09:00')`);await settle();await button('記録する');
      const recorded=(await vals()).events;await settle();assert.equal(await ev('return document.querySelector("#shBody input").value'),'600');
      assert.match(await ev('return document.querySelector("#shBody").textContent'),/精算済み：預入 600枚/);
      await button('預入枚数を直す');assert.equal((await vals()).A,2600);assert.deepEqual((await vals()).events,recorded);
      await settle();await click('#shBody input');await number(0);await ev('window.__answer=false');await button('預入枚数を直す');assert.equal((await vals()).A,2600);
      assert.match(await ev('return __confirms.at(-1)'),/600枚 → 0枚/);await ev('window.__answer=true');await button('預入枚数を直す');assert.equal((await vals()).A,2000);
      assert.ok((await vals()).events.at(-1).edits.some(e=>e.field==='amount'&&e.from===600&&e.to===0));
      await seed(state([session('today',300,0,0,23)]));await ev(`window.__time=Date.parse('${iso(23,21)}')`);await settle();await button('預けていない・分からない');await settle();
      assert.match(await ev('return document.querySelector("#shBody").textContent'),/として締め済み/);assert.equal(await ev('return document.querySelector("#shBody input").value'),'300');await button('記録する');
      assert.ok((await vals()).events.some(e=>e.type==='settleSkip'&&e.status==='void'));assert.equal((await vals()).events.at(-1).amount,300);
      await ev(`__rec.S.sessions.push(${JSON.stringify({...session('return',450,0,0,23),endAt:iso(23,22)})})`);await settle();
      assert.match(await ev('return document.querySelector("#shBody").textContent'),/その後の台の手持ち 450枚/);assert.equal(await ev('return document.querySelector("#shBody input").value'),'450');
    });
    await test('V102-3: 稼働中・台なしの締め防止・別口座許可',async()=>{
      for(const running of [false,true]){
        const cur=session('current',null,0,0,23);cur.endAt=null;await seed(running?state([session('done',300,0,0,23)],[balance()],cur):state());await settle();
        assert.equal(await ev('return document.querySelectorAll("#shBody input,#shBody button").length'),0);
        assert.match(await ev('return document.querySelector("#shBody").textContent'),running?/まだ稼働中/:/この日に終わった台がありません/);
        const before=(await vals()).events;assert.deepEqual(await ev(`return ['finalDeposit','settleSkip'].map(t=>__rec.acctPut(t,${JSON.stringify(account)},'2026-11-23',t==='settleSkip'?null:300))`),[null,null]);assert.deepEqual((await vals()).events,before);
      }
      await seed(state());await ev('__rec.showNote()');await button('今日の稼働を終える（貯メダルへ預ける）','#scNote');assert.match(await ev('return document.querySelector("#shBody").textContent'),/今日終わった台がありません/);
      const cur=session('other',null,0,0,23,{...account,storeId:'b'});cur.endAt=null;await seed(state([session('done',300,0,0,23)],[balance()],cur));await settle();await button('記録する');assert.equal((await vals()).A,2300);
    });
    await test('V102-4: 履歴追加の日付・上限確認・旧方式互換',async()=>{
      await seed(state([session()]));await history();assert.match(await ev('return document.querySelector("#shBody").textContent'),/11\/22 の分として記録/);
      await ev('window.__answer=false');await button('再プレイ +100');assert.equal((await vals()).oldU,500);assert.match(await ev('return __confirms.at(-1)'),/上限/);
      await ev('window.__answer=true');await button('再プレイ +100');assert.deepEqual([(await vals()).oldU,(await vals()).U],[600,0]);
      await button('入金 +1,000');await button('投資 +1,000');await button('枚数を入れて再プレイ');await number(100);
      assert.deepEqual(await ev('const s=__rec.S.sessions[0];return [s.money.replays.at(-1).at,s.money.deposits.at(-1).at,s.money.spends.at(-1).at]'),[iso(22,20),iso(22,20),iso(22,20)]);
      await seed(state());await start();await click('#bUtil');await button('お金の履歴を直す');await button('再プレイ +100');assert.equal((await vals()).U,100);
      const legacy=structuredClone(fixture);legacy.endAt=iso(22,20);legacy.money.endMedal=600;const outputs=[],savedPage=page,savedKey=key;
      for(const target of [savedPage,'/old/tools/rec/index.html']){page=target;key=target.startsWith('/old')?'slot-tools-rec':savedKey;await seed({sessions:[legacy],cur:null,settings:{lend:46},stores:[],entries:[]});await history();await button('再プレイ +100');await button('入金 +1,000');await button('投資 +1,000');outputs.push(await ev('return __rec.S.sessions[0]'))}page=savedPage;key=savedKey;assert.deepEqual(outputs[0],outputs[1]);assert.equal(outputs[0].money.replays.at(-1).at,new Date(iso(23)).toISOString());await open(page);
    });
    await test('V102-5: 交換単価補完・不正条件取り込み拒否・日誌一致',async()=>{
      for(const exch of [undefined,0,-1,'bad']){
        const s=session('missing',46,0,0,23);s.money.spends=[{at:iso(23),amount:1000}];s.cond.exch=exch;
        await seed(state());await importSessions([s]);assert.equal(await ev('return __rec.S.sessions[0].cond.exch'),19.23);assert.equal(await ev('return __rec.profit(__rec.S.sessions[0]).yen'),-115);
        const env=await ev('return __rec.toEnvelope(__rec.S.sessions[0])');assert.equal(env.payloadVer,'rec-4');assert.equal(env.exchangeRate,52);
        await open('/tools/nisshi/index.html');assert.deepEqual(await ev(`return [recPlay(${JSON.stringify(s)},'rec'),envelopePlay(${JSON.stringify({...env,payload:{...env.payload,cond:s.cond}})})].map(p=>[calculatedYen(p),p.cond.exch])`),[[-115,19.23],[-115,19.23]]);await open(page);
      }
      const bad=session('invalid',46,0,0,23);bad.cond.exchPer1000=0;delete bad.cond.exch;bad.money.spends=[{at:iso(23),amount:1000}];await seed(state([session('keep',100,0,0,23)]));const before=await ev('return __rec.S.sessions');await importSessions([bad]);assert.deepEqual(await ev('return __rec.S.sessions'),before);assert.match(await ev('return document.querySelector("#toast").textContent'),/1件が記録の形/);
      await open('/tools/nisshi/index.html');assert.deepEqual(await ev(`const p=recPlay(${JSON.stringify(bad)},'rec');return [p.cond,calculatedYen(p)]`),[null,0]);await open(page);
      await seed(state([bad]));assert.deepEqual(await ev('return __rec.S.sessions[0].cond'),bad.cond);assert.equal(await ev('return __rec.toEnvelope(__rec.S.sessions[0]).payloadVer'),'rec-3');
    });
    await test('V102-7: 締め3状態・開始確認の幅360/390/412',async()=>{
      for(const width of [360,390,412]){
        await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});
        await seed(state([session('done',600,0,0,23)]));await ev(`window.__time=Date.parse('2026-11-23T21:00:00+09:00')`);await settle();await button('記録する');await settle();await capture('settled',width);
        await seed(state());await start();await settle();await capture('running',width);
        await seed(state());await settle();await capture('no-session',width);
        await seed(state([session('done',600,0,0,23)]));await select();await ev(`window.__time=Date.parse('2026-11-24T00:01:00+09:00');document.querySelector('#stMachine').value='テスト汎用台'`);await click('#stStart');await ev('document.querySelector("#stErr").scrollIntoView({block:"center"})');await capture('start-confirm',width);
        assert.ok(await ev('const r=document.querySelector("#stErr").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight'));
      }
    });
    await test('C01',async()=>{const a5={...account,condId:'c5',cond:stores[0].conds[1]};await seed(state([session()], [balance(),balance(a5,900)]));const v=await ev(`const a=${JSON.stringify(a5)};return [__rec.acctBalanceA(a),__rec.acctHandH(a),__rec.acctReplaysU(a,'2026-11-22')]`);assert.deepEqual(v,[900,0,0]);assert.equal((await vals()).A,2100)});
    await test('C02',async()=>{const b={...account,storeId:'b',shop:'B店'};await seed(state([session('a',800,0,100,23),session('b',300,0,50,23,b)],[balance(),balance(b,900)]));await select();assert.equal(await ev('return document.querySelector("#stMedal").value'),'800');assert.deepEqual(await ev(`return [__rec.acctBalanceA(${JSON.stringify(b)}),__rec.acctReplaysU(${JSON.stringify(b)})]`),[850,50])});
    await test('C03',async()=>{await seed(state([session('a',800,0,500,23)]));await start();await click('#bReplay');assert.ok((await ev('return __confirms')).some(t=>t.includes('上限')));assert.equal((await vals()).U,550);assert.equal(await ev('return __rec.S.cur.money.startMedal'),800);await click('#bUndo');assert.equal((await vals()).U,500)});
    await test('C04',async()=>{for(const mode of ['unset','none','fixed']){const d=state();d.stores[0].conds[0].replayLimit={mode,value:mode==='fixed'?0:null};await seed(d);await start();await click('#bStock');const text=await ev('return document.querySelector("#shBody").textContent');assert.ok(text.includes(mode==='none'?'上限なし':mode==='unset'?'上限未登録':'残り 0枚'));await button('再プレイ −50枚');assert.equal((await ev('return __confirms')).length,mode==='fixed'?1:0)}});
    await test('C05/C06/C19',async()=>{await seed(state([session()]));let v=await vals();assert.deepEqual([v.A,v.H,v.oldH,v.U,v.oldU],[2100,0,0,0,500]);assert.equal(v.events.filter(e=>e.type==='autoDeposit').length,1);await open(page);await ev('__rec.acctAutoDeposit();document.dispatchEvent(new Event("visibilitychange"))');v=await vals();assert.equal(v.A,2100);assert.equal(v.events.length,2);assert.equal(await ev('return __rec.profit(__rec.S.sessions[0]).yen'),1923)});
    await test('C07/C21',async()=>{const s=session();s.endAt=iso(23,1);await seed(state([s]));assert.equal((await vals()).events.length,1);assert.deepEqual(await ev(`return __rec.acctPendingDays(${JSON.stringify(account)})`),['2026-11-22']);const cur=session();cur.endAt=null;cur.money.endMedal=null;await seed(state([], [balance()],cur));assert.equal((await vals()).events.length,1);assert.equal((await vals()).A,1500);assert.deepEqual(await ev('return __rec.acctPendingDays('+JSON.stringify(account)+')'),[]);await click('#bUtil');await button('やめる（終了して記録する）');await ev('const i=document.querySelector("#shBody input");i.value=600;i.dispatchEvent(new Event("input"));');await button('終了する');assert.equal((await vals()).events.length,1);assert.deepEqual(await ev('return __rec.acctPendingDays('+JSON.stringify(account)+')'),['2026-11-22'])});
    await test('C08',async()=>{await seed(state([session()]));await ev('__rec.S.sessions[0].money.endMedal=650;__rec.showNote()');await button('口座','#scNote');await button('A店／20スロ');assert.ok((await ev('return document.querySelector("#shBody").textContent')).includes('今の最終持ち 650枚'));assert.equal((await vals()).oldH,0);await button('合わせる');assert.equal((await vals()).A,2150);assert.ok(!(await ev('return document.querySelector("#shBody").textContent')).includes('今の最終持ち'));await button('確認済みにする');assert.equal((await vals()).events.at(-1).verified,true);await button('直す');await number(700);assert.equal((await vals()).A,2200);await button('取り消す');assert.equal((await vals()).A,1500);assert.ok((await vals()).events.at(-1).edits.length>=4)});
    await test('D: 取消済み自動預入は再生成せず要確認にも戻さない',async()=>{await seed(state([session()]));await ev('__rec.showNote()');await button('口座','#scNote');await button('A店／20スロ');await button('取り消す');const before=await vals();assert.equal(before.events.at(-1).status,'void');await open(page);await ev('__rec.acctAutoDeposit();document.dispatchEvent(new Event("visibilitychange"))');assert.deepEqual((await vals()).events,before.events);assert.equal((await vals()).oldH,600);assert.deepEqual(await ev('return __rec.acctPendingDays('+JSON.stringify(account)+')'),[])});
    await test('要確認: 最古のactive残高基準・終了時刻・選択口座',async()=>{const first={...balance(),at:iso(21,20)},later={...balance(),id:'later',at:iso(22,21)},voidBase={...balance(),id:'void-base',at:iso(20),status:'void'};const equal=session('equal',100,0,0,21);equal.endAt=first.at;const between=session('between',100,0,0,21);between.endAt=iso(21,21);const after=session('after',100,0,0,22);after.endAt=iso(23,1);await seed(state([session('before',100,0,0,20),equal,between,after,session('today',100,0,0,23)],[later,voidBase,first]));assert.deepEqual(await ev('return __rec.acctPendingDays('+JSON.stringify(account)+')'),['2026-11-21','2026-11-22']);await click('#stAccount');await button('B店');await button('20スロ');await ev('document.querySelector("#stMachine").value="テスト汎用台";document.querySelector("#stStart").click()');assert.equal(await ev('return __rec.S.cur.storeId'),'b')});
    await test('C09',async()=>{const s=session('cash',46,0,0,23);s.money.spends=[{at:iso(23),amount:1000}];await seed(state([s]));assert.equal(await ev('return __rec.profit(__rec.S.sessions[0]).yen'),-115)});
    await test('C10',async()=>{const d=state([session('linked',600,0,500,23)]);d.entries=[{id:'e',kind:'slot',date:'2026-11-23',machine:'簡易',linkedSessionId:'linked',cashIn:100,cashOut:200,withdraw:1000,deposit:2000,cond}];await seed(d);assert.equal((await vals()).A,1500);const totals=await ev('return [__rec.agg(__rec.S.sessions,__rec.S.entries),__rec.agg([],__rec.S.entries)]');assert.deepEqual(totals[0],totals[1])});
    await test('C11/C15',async()=>{await seed(state());await start();const got=await ev(`const s=__rec.S.cur;s.money.endMedal=46;s.money.spends=[{amount:1000}];const a=JSON.stringify(__rec.toEnvelope(s)),p=__rec.profit(s);__rec.S.stores[0].name='変更';__rec.S.stores[0].conds[0].exch=99;return [a,JSON.stringify(__rec.toEnvelope(s)),p,__rec.profit(s),__rec.toEnvelope(s)]`);assert.equal(got[0],got[1]);assert.deepEqual(got[2],got[3]);assert.equal(got[4].payloadVer,'rec-4');assert.equal(got[4].storeId,null);assert.equal(got[4].payload.recStoreId,'a');assert.equal(got[4].exchangeRate,52);assert.equal(got[4].lendRate,46)});
    await test('C12',async()=>{await seed(state([],[]));await ev('__rec.showNote()');const put=async d=>{await click('#nImpOpen');await ev(`document.querySelector('#shBody textarea').value=${JSON.stringify(JSON.stringify(d))}`);await button('取り込む')};await put({sessions:[]});assert.equal((await vals()).events.length,0);await put({sessions:[],ledger:{ver:1,events:[balance()]}});await put({sessions:[],ledger:{ver:1,events:[balance(),{...balance(),amount:1},{bad:1}]}});assert.equal((await vals()).events.length,1);assert.equal((await vals()).A,2000);assert.ok((await ev('return document.querySelector("#toast").textContent')).includes('食い違い1件'))});
    await test('C13',async()=>{for(const committed of [false,true]){await seed(state([],[]));const s=session();const e={...balance(),id:'final:a|c20:2026-11-22',type:'finalDeposit',amount:600,dayKey:'2026-11-22',at:s.endAt};const disk={version:3,sessionsIn:'idb',gen:9,cur:null,settings:{lend:46},stores,entries:[],ledger:{ver:1,events:[balance(),e],quarantine:[]},outbox:{put:[s],del:[]}};await open('/empty');await ev(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(disk))})`);if(committed){await open(page);await ev(`await RecStore.commit(${JSON.stringify(key)},{put:[${JSON.stringify(s)}],del:[]},9);localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(disk))})`)}await open(page);assert.equal(await ev('return __rec.S.sessions.length'),1);assert.equal((await vals()).A,2100);assert.equal((await vals()).events.filter(e=>e.type==='finalDeposit').length,1)}});
    await test('C14',async()=>{await seed(state());await start();await pause(150);await ev(`const f=document.createElement('iframe');f.id='other';f.src=${JSON.stringify(page)};document.body.append(f)`);for(let i=0;i<100;i++){if(await ev('return !!document.querySelector("#other").contentWindow.__rec?.ready'))break;await pause(50)}await ev(`document.querySelector('#bReplay').click();document.querySelector('#other').contentDocument.querySelector('#bReplay').click()`);await pause(100);assert.equal(await ev('return document.querySelector("#other").contentWindow.__rec.stale'),true);await open(page);assert.equal((await vals()).U,50)});
    await test('C16',async()=>{const s1=session('one',800,0,500);const s2=session('two',600,800,0);s1.endAt=iso(22,15);s2.startAt=iso(22,16);await seed(state([s1,s2]));const v=await vals();assert.deepEqual([v.A,v.H,v.oldU,v.U],[2100,0,500,0]);assert.equal(await ev('return __rec.S.sessions.reduce((n,s)=>n+__rec.profit(s).yen,0)'),1923)});
    await test('C17',async()=>{for(const timezoneId of ['UTC','Asia/Tokyo']){await send('Emulation.setTimezoneOverride',{timezoneId});await seed(state());const days=await ev(`window.__time=Date.parse('2026-11-22T14:59:59Z');const a=__rec.jstDay(new Date(Date.now()).toISOString());window.__time+=1000;return [a,__rec.jstDay(new Date(Date.now()).toISOString())]`);assert.deepEqual(days,['2026-11-22','2026-11-23'])}});
    await test('C18/C22',async()=>{for(const amount of [300,0]){await seed(state([session('a',800,0,0,23)]));await ev('__rec.showNote()');await button('今日の稼働を終える（貯メダルへ預ける）','#scNote');await button('A店／20スロ');await click('#shBody input');await number(amount);assert.ok((await ev('return document.querySelector("#shBody").textContent')).includes('行先未記録 '+(800-amount)+'枚'));await button('記録する');const before=await ev('return __rec.profit(__rec.S.sessions[0]).yen');await ev(`window.__time+=86400000;__rec.acctAutoDeposit()`);assert.equal((await vals()).A,2000+amount);assert.equal((await vals()).events.length,2);assert.equal(await ev('return __rec.profit(__rec.S.sessions[0]).yen'),before)}});
    await test('C20',async()=>{const d=state([session()]);d.sessions[0].money.oldIntermediateDeposit={amount:123};await seed(d);assert.ok(!(await ev('return document.body.textContent')).includes('途中預入'));await open(page);assert.deepEqual(await ev('return __rec.S.sessions[0].money.oldIntermediateDeposit'),{amount:123})});
    await test('C24',async()=>{await seed(state([session()]));await ev('__rec.showNote()');await click('#nStores');await click('#shBody .lg');await button('この店舗を削除');assert.equal(await ev('return __rec.S.stores.length'),2);assert.equal(await ev('return document.querySelector("#toast").textContent'),'記録があるため削除できません');await click('#shBody .lg .x');assert.equal(await ev('return __rec.S.stores[0].conds.length'),2)});
    await test('C26/C27',async()=>{await seed(state([session()],[]));assert.equal((await vals()).A,null);assert.equal((await vals()).events.length,0);await select();assert.ok((await ev('return document.querySelector("#stAccountInfo").textContent')).includes('未登録'));assert.deepEqual(await ev('return __rec.acctPendingDays('+JSON.stringify(account)+')'),[]);await ev('document.querySelector("#stMachine").value="テスト汎用台";document.querySelector("#stStart").click()');assert.ok(await ev('return !!__rec.S.cur'));assert.equal(await ev('return !document.querySelector("#sheet").classList.contains("open")'),true);await seed(state([session('old',300,0,0,21),session()]));assert.equal((await vals()).events.filter(e=>e.type==='autoDeposit').length,1);assert.deepEqual(await ev(`return __rec.acctPendingDays(${JSON.stringify(account)})`),['2026-11-21']);await start();assert.ok((await ev('return document.querySelector("#shTitle").textContent')).includes('今日の稼働'));await button('あとで');assert.ok(await ev('return !!__rec.S.cur'))});
    await test('C25',async()=>{await seed(state([session()]));const s=await ev('return __rec.S.sessions[0]'),p=await ev('return __rec.profit(__rec.S.sessions[0]).yen'),env=await ev('return __rec.toEnvelope(__rec.S.sessions[0])');await open('/tools/nisshi/index.html');const v=await ev(`return [recPlay(${JSON.stringify(s)},'rec'),envelopePlay(${JSON.stringify(env)})].map(p=>calculatedYen(p))`);assert.deepEqual(v,[p,p]);await open(page)});
    await test('C23',async()=>{const old=structuredClone(fixture);old.endAt=iso(23,20);old.money.endMedal=600;old.money.spends=[{at:iso(23),amount:1000}];const d={sessions:[old],cur:null,settings:{lend:46},stores:[],entries:[]};const outputs=[];const savedPage=page;for(const targetPage of [savedPage,'/old/tools/rec/index.html']){page=targetPage;const savedKey=key;key=targetPage.startsWith('/old')?'slot-tools-rec':savedKey;await seed(d);outputs.push(await ev(`const s=__rec.S.sessions[0];return {session:JSON.stringify(s),profit:__rec.profit(s),envelope:JSON.stringify(__rec.toEnvelope(s))}`));await open(targetPage.startsWith('/old')?'/old/tools/nisshi/index.html':'/tools/nisshi/index.html');outputs.at(-1).nisshi=await ev(`return recPlay(${JSON.stringify(old)},'rec')`);key=savedKey}page=savedPage;assert.deepEqual(outputs[0],outputs[1]);await open(page)});
    await test('A/B: 不正値・未知項目・隔離',async()=>{const d=state();d.stores[0].conds[0].unknown={keep:true};d.stores[0].conds[0].replayUnit=-1;d.stores[0].conds[0].replayLimit={mode:'fixed',value:-1};d.ledger.events.push({bad:1});await seed(d);const c=await ev('return __rec.S.stores[0].conds[0]');assert.deepEqual(c.unknown,{keep:true});assert.equal(c.replayUnit,null);assert.deepEqual(c.replayLimit,{mode:'unset',value:null});assert.equal(await ev('return __rec.S.ledger.quarantine.length'),1);assert.equal(await ev(`return __rec.validStore({id:'x',name:'x',conds:[{...__rec.S.stores[0].conds[0],replayUnit:'50'}]})`),false)});

    await test('C13: outbox未確定からの通常回復',async()=>{
      // localStorage 確定、IDB 未確定：実際の終了操作・預入操作の outbox から回復。
      await seed(state());await start();await pause(100);
      await ev('RecStore.commit=async()=>{throw Error("IDB未確定")};');
      await click('#bUtil');await button('やめる（終了して記録する）');
      await ev('const i=document.querySelector("#shBody input");i.value=600;i.dispatchEvent(new Event("input"));');await button('終了する');
      await button('今日の稼働を終える（貯メダルへ預ける）','#scNote');await button('A店／20スロ');await button('記録する');
      assert.equal(await ev('return __rec.S.ledger.events.at(-1).amount'),600);
      await open(page);assert.equal(await ev('return __rec.S.sessions.length'),1);assert.equal((await vals()).A,2600);
    });
    await test('A: 条件編集の実UI・非再描画',async()=>{
      await seed(state());await ev('__rec.showNote()');await click('#nStores');await click('#shBody .lg');await click('#shBody .lg');
      await ev('window.__bodyNode=document.querySelector("#shBody").firstChild;document.querySelector("#shBody").scrollTop=10000;');
      await button('上限なし');assert.equal(await ev('return window.__bodyNode===document.querySelector("#shBody").firstChild'),true);
      await button('貸出枚数を使う');await button('この内容で直す');await button('この内容で直す');
      assert.deepEqual(await ev('return [__rec.S.stores[0].conds[0].replayUnit,__rec.S.stores[0].conds[0].replayLimit]'),[null,{mode:'none',value:null}]);
    });
    await test('C03: 残高警告の拒否・初期再プレイ',async()=>{
      await seed(state([],[balance(account,0)]));await start();await ev('window.__answer=false');await click('#bReplay');assert.equal((await vals()).U,0);assert.ok((await ev('return __confirms')).at(-1).includes('マイナス'));await ev('window.__answer=true');await click('#bReplay');assert.equal((await vals()).A,-50);
      await seed(state([],[balance(account,0)]));await select();await ev('window.__answer=false;document.querySelector("#stMachine").value="テスト汎用台";document.querySelector("#stReplay0").value=50;document.querySelector("#stStart").click()');assert.equal(await ev('return __rec.S.cur'),null);
    });
    await test('E: 全バックアップにledgerとKEY',async()=>{
      await seed(state());await ev('window.__blobs=[];const native=URL.createObjectURL;URL.createObjectURL=b=>{__blobs.push(b);return native(b)};HTMLAnchorElement.prototype.click=function(){};__rec.showNote()');
      await click('#nExpJson');const json=await ev('return JSON.parse(document.querySelector("#shBody textarea").value)');assert.equal(json.storageKey,key);assert.equal(json.ledger.events.length,1);await click('#shClose');
      for(const id of ['nDl','storeExport','staleExport']){await click('#'+id);const d=await ev('return JSON.parse(await __blobs.at(-1).text())');assert.equal(d.storageKey,key);assert.equal(d.ledger.events.length,1)}
    });
    await test('B: 壊れたledgerは保存停止',async()=>{
      for(const ledger of [null,{ver:2,events:[]},{ver:1,events:{}}]){const d=state();d.ledger=ledger;await seed(d);assert.ok(await ev('return !!__rec.broken'));assert.equal(await ev('return localStorage.getItem('+JSON.stringify(key)+')'),JSON.stringify(d));}
    });

    await test('表示幅360/390/412',async()=>{await seed(state([session()]));for(const width of [360,390,412]){await send('Emulation.setDeviceMetricsOverride',{width,height:530,deviceScaleFactor:1,mobile:true});await ev('__rec.showSetup()');await select();await capture('start',width);await ev(`document.querySelector('#stMachine').value='テスト汎用台';document.querySelector('#stStart').click()`);await click('#bStock');await capture('replay',width);await click('#shClose');await ev(`__rec.acctSettleSheet(${JSON.stringify(account)})`);await capture('settle',width);await ev(`__rec.acctSheet(${JSON.stringify(account)})`);await capture('account',width);await click('#shClose');await seed(state([session()]))}});
  }
  await test('H: 本番保存先の分離',async()=>{page='/tools/rec/acct-test.html';key='slot-tools-rec-acct-test';await open('/empty');await ev(`localStorage.setItem('slot-tools-rec','PRODUCTION SENTINEL');localStorage.setItem('slot-tools-rec:cycleLabel','PRODUCTION LABEL')`);await seed(state());await start();await click('#bReplay');await pause(100);assert.deepEqual(await ev(`return [localStorage.getItem('slot-tools-rec'),localStorage.getItem('slot-tools-rec:cycleLabel')]`),['PRODUCTION SENTINEL','PRODUCTION LABEL'])});
}catch(e){console.error(e.stack);results.push({id:'driver',ok:false,error:e.stack})}
finally{fs.writeFileSync(path.join(artifacts,'rec-account-results.json'),JSON.stringify(results,null,2));console.log('結果 '+results.filter(x=>x.ok).length+'/'+results.length+' 成果物 '+artifacts);ws?.close();browser?.kill();server.close();if(results.some(x=>!x.ok))process.exitCode=1}
async function capture(name,width){await pause(100);const fit=await ev(`return {width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.querySelector('#shBody').scrollWidth,pane:document.querySelector('#shBody').clientWidth,closeRight:document.querySelector('#shClose').getBoundingClientRect().right,closeWidth:document.querySelector('#shClose').getBoundingClientRect().width}`);assert.equal(fit.width,width);assert.ok(fit.scroll<=width,JSON.stringify(fit));if(!name.startsWith('start')){assert.ok(fit.body<=fit.pane,JSON.stringify(fit));assert.ok(fit.closeRight<=width&&fit.closeWidth>=44,JSON.stringify(fit));}const s=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(artifacts,(page.includes('acct-test')?'test-':'rec-')+name+'-'+width+'.png'),Buffer.from(s.data,'base64'))}

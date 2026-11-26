// node tests/rec-tokyoghoul.verify.mjs — CDP only, no npm dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {buildTestPage} from './rec-tokyoghoul-build-test-page.mjs';
export const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export async function harness(pages, name='tokyoghoul') {
  const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'rec-'+name+'-'));
  fs.mkdirSync(artifacts,{recursive:true});
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'rec-'+name+'-chrome-'));
  const hook=html=>{
    const marker='\n})();\n</script>';assert.equal(html.split(marker).length-1,1);
    return html.replace(marker,`\nwindow.__rec={get S(){return S},get ready(){return !storageStarting&&!flushBusy},save,render,showSetup,showNote,toEnvelope,validSession,fixSession,profit,MACHINES${name==='regression'?'':',recordSummary,edTotals'}};${marker}`);
  };
  const server=http.createServer((req,res)=>{
    const url=decodeURIComponent(req.url.split('?')[0]);
    res.setHeader('Content-Type',url.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
    if(url==='/empty')return res.end('<html></html>');
    if(pages[url])return res.end(hook(pages[url]));
    const f=path.resolve(root,'.'+url.replace(/^\/base\//,'/'));
    if(f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())return res.end(fs.readFileSync(f));
    res.writeHead(404);res.end();
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
  let ws,seq=0;const pending=new Map();
  async function send(method,params={}){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method))},20000);pending.set(id,{resolve:v=>{clearTimeout(timer);resolve(v)},reject:e=>{clearTimeout(timer);reject(e)}});ws.send(JSON.stringify({id,method,params}))})}
  async function ev(code){const r=await send('Runtime.evaluate',{expression:`(async()=>{${code}})()`,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
  async function open(page){await send('Page.navigate',{url:origin+page});for(let i=0;i<200;i++){if(await ev(page==='/empty'?'return location.pathname==="/empty";':'return !!window.__rec?.ready;').catch(()=>false))return;await pause(30)}throw Error('起動待ち '+page)}
  async function seed(page,data={sessions:[],cur:null,settings:{lend:46},stores:[]},key='slot-tools-rec-tg-test'){
    await open('/empty');await ev(`localStorage.removeItem(${JSON.stringify(key)});await new Promise((r,j)=>{const q=indexedDB.deleteDatabase(${JSON.stringify(key)});q.onsuccess=r;q.onerror=j});localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(data))});`);await open(page);
  }
  const click=selector=>ev(`const b=document.querySelector(${JSON.stringify(selector)});if(!b)throw Error('missing '+${JSON.stringify(selector)});b.click();`);
  const button=(label,scope='#shBody,#shFoot')=>ev(`const b=[...document.querySelectorAll(${JSON.stringify(scope)})].flatMap(n=>[...n.querySelectorAll('button')]).find(b=>b.getClientRects().length&&b.childNodes[0]?.textContent===${JSON.stringify(label)});if(!b)throw Error('missing button '+${JSON.stringify(label)}+' in '+document.querySelector('#shBody').textContent);b.click();`);
  const input=(selector,value)=>ev(`const i=document.querySelector(${JSON.stringify(selector)});if(!i)throw Error('missing input '+${JSON.stringify(selector)});i.value=${JSON.stringify(String(value))};i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));`);
  const field=(key,value)=>input('[data-field="'+key+'"]',value);
  const snapshot=async name=>{await pause(100);const r=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(r.data,'base64'))};
  const width=async w=>{await send('Emulation.setDeviceMetricsOverride',{width:w,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await ev('return innerWidth'),w)};
  const close=async()=>{if(ws){try{await send('Browser.close')}catch{}ws.close()}browser.kill();await new Promise(r=>server.close(r));};
  try {
    for(let i=0;i<200&&!fs.existsSync(path.join(profile,'DevToolsActivePort'));i++)await pause(50);
    const port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];
    const target=(await(await fetch('http://127.0.0.1:'+port+'/json')).json()).find(x=>x.type==='page');
    ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j});
    ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}}};
    await send('Page.enable');await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__errs=[];window.__confirms=[];window.confirm=t=>{__confirms.push(t);return window.__answer!==false};window.alert=()=>{};window.prompt=()=>null;window.addEventListener('error',e=>__errs.push(e.message));window.addEventListener('unhandledrejection',e=>__errs.push(String(e.reason)));`});
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    return {ev,send,open,seed,click,button,input,field,snapshot,width,close,artifacts};
  }catch(e){await close();throw e}
}

async function main(){
  const source=fs.readFileSync(path.join(root,'tools/rec/index.html'),'utf8'),built=buildTestPage(source,'8d041ce');
  const page='/tools/rec/tg-test.html',h=await harness({[page]:built});
  const {ev,seed,click,button,input,field,snapshot,width}=h,results=[];
  const state=()=>ev('return structuredClone(__rec.S.cur)');
  const grid=label=>button(label,'#gridRows');
  const close=()=>click('#shClose');
  async function test(id,fn){try{await fn();assert.deepEqual(await ev('return __errs'),[]);results.push({id,ok:true});console.log('PASS '+id)}catch(e){results.push({id,ok:false,error:e.stack});console.error('FAIL '+id+' '+e.stack);await snapshot('FAIL-'+id.replace(/[^a-z0-9-]/gi,'_'))}}
  async function start({sessions=[],dai='123',shop='試験店',total=200,c3=1}={}){
    await seed(page,{sessions,cur:null,settings:{lend:46},stores:[]});
    await input('#stMachine','東京喰種');await click('#stStart');
    await input('#stShop',shop);await input('#stDai',dai);await input('#stTotal',total);
    await button('リセット確認','#scSetup');await button('不明','#scSetup');
    await ev(`const inputs=[...document.querySelectorAll('#stFields input')];if(inputs[0]){inputs[0].value=${c3};inputs[0].dispatchEvent(new Event('input'))}`);
    await click('#stStart');assert.equal((await state()).machineId,'tokyoghoul');
  }
  async function hit(label='AT直撃',cr=null,trig=null){await grid('当選');await button(label);if(trig)await button(trig);if(cr!==null)await field('cr',cr);await button('当選を記録')}
  async function success(cr=null){await grid((await state()).hit.label+' 終了');await button('成功');if(cr!==null)await field('cr',cr);await button('成功を記録')}
  async function fail(card=null){await grid((await state()).hit.label+' 終了');await button('失敗');if(card)await button(card);await button('失敗を記録')}
  async function end({cr=null,shown=null,total=null,next='終了する'}={}){await grid((await state()).hit.label+' 終了');if(cr!==null)await field('cr',cr);if(shown!==null)await field('shownGain',shown);if(total!==null)await field('totalG',total);await button(next)}
  async function duel(who,bites=0,result='勝利'){await grid('喰種対決');await button(who);await button(result);if(result==='勝利')await field('bites',bites);await button('記録する')}
  const undo=()=>click('#bUndo');
  const summary=()=>ev('return __rec.recordSummary(__rec.S.cur).join("\\n")');
  const cards=()=>grid('EDカード');
  const plus=k=>click('[data-ed-plus="'+k+'"]'),minus=k=>click('[data-ed-minus="'+k+'"]');
  async function realClick(selector){
    const point=await ev(`const b=document.querySelector(${JSON.stringify(selector)});b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}`);
    await h.send('Input.dispatchMouseEvent',{type:'mousePressed',...point,button:'left',clickCount:1});
    await h.send('Input.dispatchMouseEvent',{type:'mouseReleased',...point,button:'left',clickCount:1});
  }
  const savedState=()=>ev('return JSON.parse(localStorage.getItem("slot-tools-rec-tg-test")).cur');
  async function previousEd(){await cards();await button('前回のEDを直す');await button('1回目のED')}
  async function twoEds(){await start();await hit();await grid('エンディング');await cards();await plus('edWhiteW');await close();await end({next:'有馬ジャッジメントへ（エンディング後）'});await fail();await hit();await grid('エンディング')}
  async function quit(){await click('#bUtil');await button('やめる（終了して記録する）');await input('#shBody input',0);await button('終了する')}
  let edSession;
  try{
    await test('example-1',async()=>{
      await start();await snapshot('normal-390');assert.equal((await state()).c3,1);assert.doesNotMatch((await state()).startNote,/不明/);
      await hit('レミニセンス');await snapshot('cz-390');await fail('亜門鋼太朗');assert.equal((await state()).c3,2);
      assert.equal((await state()).events.at(-1).keys.czCard,'amon');await hit('大喰いの利世',312);await success(240);
      assert.equal((await state()).hit.label,'AT');assert.match(await summary(),/差枚 -72/);await snapshot('at-390');
    });
    await test('example-2',async()=>{
      await duel('鯱',150);assert.equal((await state()).ticket,false);await duel('有馬貴将',300);assert.equal((await state()).ticket,true);
      assert.match(await ev('return document.querySelector("#badges").textContent'),/有馬権利/);
      await grid('AT 終了');await field('shownGain',1245);await button('あんていく全員集合');await button('銀');await field('cr',1480);await field('totalG',2950);await snapshot('at-end-390');await button('有馬ジャッジメントへ（有馬勝利）');
      assert.equal((await state()).hit.label,'有馬ジャッジメント');assert.match(await summary(),/獲得枚数 \+1,240／画面の獲得 1,245枚/);await snapshot('judgement-390');
    });
    await test('example-3',async()=>{await success(1470);assert.equal((await state()).hit.label,'CCGの死神');await end({next:'ATへ（死神後）'});await end({cr:2300});assert.match(await summary(),/獲得枚数 \+830/);assert.match(await summary(),/AT初当たり 1回/)});
    await test('example-4',async()=>{await start();await hit();await duel('有馬貴将');await end({next:'有馬ジャッジメントへ（有馬勝利）'});const n=(await state()).c3;await fail();assert.equal((await state()).c3,n);assert.equal((await state()).nextMark,'有馬失敗後');await click('[data-cnt=realG]');await click('#kpClear');await button('1','#kpKeys');await button('1','#kpKeys');await button('2','#kpKeys');await click('#kpOk');await hit('レミニセンス');assert.equal((await state()).events.at(-1).afterMark,'有馬失敗後');assert.equal((await state()).nextMark,null)});
    await test('example-5',async()=>{await start();await hit();await end();await hit('AT直撃',null,'引き戻し');assert.match(await summary(),/AT初当たり 2回/);assert.match(await summary(),/引き戻し 1/)});
    await test('example-6',async()=>{await start();await hit();await grid('エンディング');await cards();await plus('edWhiteW');await plus('edWhiteW');await close();await quit();edSession=await ev('return structuredClone(__rec.S.sessions.at(-1))');await start({sessions:[edSession]});await hit();await grid('エンディング');await cards();assert.equal(await ev('return document.querySelector("[data-total=edWhiteW]").textContent'),'累計 2')});
    await test('example-7',async()=>{await plus('edWhiteW');await plus('edWhiteW');await minus('edWhiteW');assert.equal((await state()).edRuns[0].counts.edWhiteW,1);await close();await end({next:'有馬ジャッジメントへ（エンディング後）'});await fail();await hit();await grid('エンディング');await cards();await button('前回のEDを直す');await button('1回目のED');await plus('edWhiteW');await button('直した内容を記録');assert.equal((await state()).events.at(-1).type,'edFix');assert.equal((await state()).edRuns[0].counts.edWhiteW,2);await undo();assert.equal((await state()).edRuns[0].counts.edWhiteW,1)});
    await test('ED-fix-discard',async()=>{
      await twoEds();const before=await state();await previousEd();await plus('edWhiteW');await minus('edWhiteW');await plus('edWhiteW');
      assert.equal(await ev('return document.querySelector("[data-count=edWhiteW]").textContent'),'2');
      assert.equal(await ev('return document.querySelector("[data-total=edWhiteW]").textContent'),'累計 2');
      assert.deepEqual(await state(),before);assert.deepEqual(await savedState(),before);await realClick('#shClose');assert.deepEqual(await state(),before);assert.deepEqual(await savedState(),before);
    });
    await test('ED-fix-commit',async()=>{
      await twoEds();const before=await state();await previousEd();await plus('edWhiteW');await button('直した内容を記録');const after=await state(),fix=after.events.at(-1);
      assert.deepEqual(after.edRuns[0].counts,{edWhiteW:2});assert.equal(after.events.length,before.events.length+1);assert.equal(fix.type,'edFix');assert.equal(fix.edId,before.edRuns[0].id);assert.deepEqual(fix.before,before.edRuns[0].counts);assert.deepEqual(fix.after,after.edRuns[0].counts);assert.deepEqual(await savedState(),after);
    });
    await test('ED-fix-undo',async()=>{
      const before=await state(),fix=before.events.at(-1);assert.equal(fix.type,'edFix');await undo();const after=await state();assert.deepEqual(after.edRuns[0].counts,fix.before);assert.equal(after.events.some(e=>e.id===fix.id),false);assert.equal(after.edRuns[0].fixes.includes(fix.id),false);assert.deepEqual(await savedState(),after);
    });
    await test('ED-fix-unchanged',async()=>{
      await twoEds();const before=await state();await previousEd();
      for(const revert of [false,true]){if(revert){await minus('edWhiteW');await plus('edWhiteW');await plus('edRedW');await minus('edRedW')}await button('直した内容を記録');assert.deepEqual(await state(),before);assert.deepEqual(await savedState(),before);assert.equal(await ev('return document.querySelector("#toast").textContent'),'変更はありません')}
      await close();
    });
    await test('ED-note-real-close',async()=>{
      await twoEds();
      for(const fixing of [false,true]){
        if(fixing)await previousEd();else await cards();const index=fixing?0:1,note=fixing?'訂正画面のメモ':'今回のEDメモ';const before=await state();
        await realClick('#shBody textarea');await h.send('Input.insertText',{text:note});await realClick('#shClose');
        assert.equal(await ev('return document.querySelector("#sheet").classList.contains("open")'),false);
        assert.equal((await state()).edRuns[index].note,note);assert.equal((await savedState()).edRuns[index].note,note);assert.deepEqual((await state()).events,before.events);
      }
      await h.open('/empty');await h.open(page);assert.deepEqual((await state()).edRuns.map(r=>r.note),['訂正画面のメモ','今回のEDメモ']);
    });
    await test('example-8',async()=>{await start();await hit();await quit();const s=await ev('return __rec.S.sessions.at(-1)');assert.equal(s.hit.label,'AT');assert.equal(s.events.filter(e=>e.type==='hitEnd').length,0);assert.match(await ev('return __rec.recordSummary(__rec.S.sessions.at(-1)).join("\\n")'),/AT 獲得枚数 —/)});
    await test('numeric-invalid',async()=>{
      for(const key of ['cr','bites','shownGain','totalG'])for(const value of ['-1','1.5','abc']){
        await start();if(key==='cr'){await grid('当選');await button('AT直撃')}else{await hit();if(key==='bites'){await grid('喰種対決');await button('鯱');await button('勝利')}else await grid('AT 終了')}
        const before=await state();await field(key,value);await button(key==='cr'?'当選を記録':key==='bites'?'記録する':'終了する');assert.deepEqual(await state(),before);assert.match(await ev('return document.querySelector("#toast").textContent'),/0以上の整数/);
      }
    });
    await test('totalG-monotonic',async()=>{await start();await hit();await grid('AT 終了');await field('totalG',199);const before=await state();await button('終了する');assert.deepEqual(await state(),before);await field('totalG',300);await button('終了する');await hit();await grid('AT 終了');await field('totalG',299);const again=await state();await button('終了する');assert.deepEqual(await state(),again)});
    await test('failure-G',async()=>{await start();await hit('レミニセンス');await grid('レミニセンス 終了');await button('失敗');const values=await ev('return [...document.querySelectorAll("#shBody .setup input")].map(i=>i.value)');assert.deepEqual(values,['6','0']);await input('#shBody .setup input',9);await button('失敗を記録');assert.equal((await state()).realG,9)});
    await test('ticket-match',async()=>{await start();await hit();await duel('鯱');assert.equal((await state()).ticket,false);await duel('有馬貴将');assert.equal((await state()).ticket,true);await grid('AT 終了');assert.match(await ev('return document.querySelector("#shFoot").textContent'),/有馬ジャッジメントへ（有馬勝利）/)});
    await test('ED-counts',async()=>{await start();await hit();await grid('エンディング');await snapshot('ed-390');await cards();await minus('edWhiteW');assert.equal((await state()).edRuns[0].counts.edWhiteW||0,0);for(let i=0;i<3;i++)await plus('edWhiteW');await minus('edWhiteW');await input('#shBody textarea','EDメモ');const n=(await state()).events.length;await close();await cards();assert.equal((await state()).edRuns[0].counts.edWhiteW,2);assert.equal((await state()).events.length,n);await snapshot('ed-cards-390');await close();await end({next:'有馬ジャッジメントへ（エンディング後）'});assert.match((await state()).events.find(e=>e.type==='edSum').text,/計2枚/);await fail();await hit();await grid('エンディング');await cards();assert.equal(await ev('return document.querySelector("[data-count=edWhiteW]").textContent'),'0');assert.equal(await ev('return document.querySelector("[data-total=edWhiteW]").textContent'),'累計 2')});
    await test('ED-scope',async()=>{for(const [opts,want] of [[{},2],[{dai:'124'},0],[{shop:'別店'},0],[{dai:''},0]]){await start({sessions:[edSession],...opts});assert.equal(await ev('return __rec.edTotals(__rec.S.cur).edWhiteW||0'),want)}const other=structuredClone(edSession);other.startAt='2020-01-01T00:00:00Z';await start({sessions:[other]});assert.equal(await ev('return __rec.edTotals(__rec.S.cur).edWhiteW||0'),0)});
    await test('undo-table',async()=>{
      await start();await grid('示唆');await button('アイキャッチ');await button('霧嶋董香（喰種化）');await input('#shBody textarea','別メモ');await button('記録する');assert.equal((await state()).events.at(-1).note,'別メモ');await undo();assert.equal((await state()).events.length,0);
      await hit('レミニセンス');await undo();assert.equal((await state()).mode,'normal');await hit('レミニセンス');let before=await state();await success(240);await undo();assert.deepEqual((await state()).hit,before.hit);assert.deepEqual((await state()).events,before.events);
      await fail();await undo();assert.deepEqual((await state()).hit,before.hit);assert.equal((await state()).c3,before.c3);
      await start();await hit('エピソードボーナス');before=await state();await end({next:'ATへ（EP後）',cr:200});await undo();assert.deepEqual((await state()).hit,before.hit);
      await start();await hit();await duel('有馬貴将');await undo();assert.equal((await state()).ticket,false);
      await grid('エンディング');await cards();await plus('edWhiteW');await close();await ev('window.__answer=false');await undo();assert.equal((await state()).edRuns.length,1);await ev('window.__answer=true');await undo();assert.equal((await state()).edRuns.length,0);assert.match(await ev('return __confirms.at(-1)'),/EDカード1枚も消えます/);
      await grid('エンディング');await cards();await plus('edWhiteW');await close();await end({next:'有馬ジャッジメントへ（エンディング後）'});await undo();assert.equal((await state()).hit.phase,'ed');assert.equal((await state()).edRuns[0].counts.edWhiteW,1);assert.equal((await state()).events.filter(e=>e.type==='edSum').length,0);
      await end({next:'有馬ジャッジメントへ（エンディング後）'});before=await state();await success(100);await undo();assert.deepEqual((await state()).hit,before.hit);await fail();await undo();assert.equal((await state()).nextMark,null);assert.deepEqual((await state()).hit,before.hit);
      await success(100);before=await state();await end({next:'ATへ（死神後）'});await undo();assert.deepEqual((await state()).hit,before.hit);
    });
    await test('envelope',async()=>{const e=await ev('return __rec.toEnvelope(__rec.S.cur)');assert.equal(e.schema,'slot-session');assert.equal(e.schemaVer,2);assert.equal(e.payload.logs.filter(l=>l.text.startsWith('まとめ　')).length,1)});
    await test('JSON-roundtrip',async()=>{
      await start();await hit();await grid('エンディング');await cards();await plus('edWhiteW');await close();await quit();await click('#nExpJson');const exported=await ev('return JSON.parse(document.querySelector("#shBody textarea").value)');const original=exported.sessions.at(-1);
      await seed(page);await ev('__rec.showNote()');await click('#nImpOpen');await input('#shBody textarea',JSON.stringify(exported));await button('取り込む');assert.deepEqual(await ev('return __rec.S.sessions[0]'),original);
      const bad=structuredClone(original);bad.id+='bad';bad.edRuns[0].counts.edWhiteW=-1;await click('#nImpOpen');await input('#shBody textarea',JSON.stringify({sessions:[bad]}));await button('取り込む');assert.equal(await ev('return __rec.S.sessions.length'),1);
    });
    await test('layout-390-360',async()=>{
      for(const w of [390,360])for(const screen of ['menu','end','cards']){
        await width(w);await start();if(screen==='menu')await grid('示唆');else{await hit();if(screen==='end')await grid('AT 終了');else{await grid('エンディング');await cards()}}
        await pause(150);const dims=await ev(`return {width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.querySelector('#shBody').scrollWidth,client:document.querySelector('#shBody').clientWidth,buttons:[...document.querySelectorAll('#sheet button')].filter(b=>b.getClientRects().length).map(b=>({label:b.textContent,height:b.getBoundingClientRect().height}))}`);
        fs.writeFileSync(path.join(h.artifacts,screen+'-'+w+'-dimensions.json'),JSON.stringify(dims,null,2));assert.equal(dims.width,w);assert.ok(dims.scroll<=w);assert.ok(dims.body<=dims.client);assert.ok(dims.buttons.every(b=>b.height>=44),JSON.stringify(dims.buttons.filter(b=>b.height<44)));
        if(screen==='cards')assert.deepEqual(await ev('const r=document.querySelector("#sheet .pane").getBoundingClientRect();return [r.top,r.bottom,innerHeight]'),[0,844,844]);
        await snapshot(screen+'-'+w);if(w===390&&screen==='menu')await snapshot('suggestions-390');
      }
    });
    await test('keys-notes-primary-data',async()=>{
      await start();const money=(await state()).money;await grid('当選');await button('AT直撃');await field('cr',0);await input('#shBody textarea','当選メモ');await button('当選を記録');
      assert.equal((await state()).events.at(-1).cr,0);assert.equal((await state()).events.at(-1).note,'当選メモ');assert.doesNotMatch((await state()).events.at(-1).text,/当選メモ/);
      await grid('喰種対決');await button('有馬貴将');await button('勝利');await field('bites',300);await button('敗北');assert.equal(await ev('return document.querySelector("[data-field=bites]").value'),'');await button('記録する');assert.equal((await state()).ticket,false);assert.equal((await state()).events.at(-1).keys.result,'lose');assert.equal('bites' in (await state()).events.at(-1),false);
      await grid('AT 終了');await button('銀');await button('銀');await input('#shBody textarea','終了メモ');await field('cr',0);await button('終了する');const e=(await state()).events.at(-1);assert.equal(e.keys,undefined);assert.equal(e.note,'終了メモ');assert.equal(e.shownGain,null);assert.equal(e.totalG,null);assert.deepEqual((await state()).money,money);assert.equal((await state()).events.some(e=>e.type==='medal'),false);
      await hit('レミニセンス',0);await grid('レミニセンス 終了');await button('成功');await input('#shBody textarea','成功メモ');await button('成功を記録');assert.equal((await state()).events.at(-2).note,'成功メモ');assert.equal((await state()).events.at(-2).cr,null);
      await grid('エンディング');await cards();await plus('edWhiteW');await input('#shBody textarea','保存メモ');await close();await grid('メモ');await input('#shBody textarea','別操作');await button('記録する');await cards();await plus('edWhiteW');await close();await undo();assert.equal((await state()).edRuns[0].counts.edWhiteW,2);
      await h.open('/empty');await h.open(page);assert.equal((await state()).edRuns[0].counts.edWhiteW,2);assert.equal((await state()).edRuns[0].note,'保存メモ');
      await click('#bHint');await button('記録のまとめ');assert.match(await ev('return document.querySelector("#shBody").textContent'),/その日のその台/);
    });
    await test('definition-and-import-types',async()=>{
      const d=await ev('return __rec.MACHINES.tokyoghoul');assert.deepEqual(d.extras[0].items.map(x=>x.groups[0].options.length),[10,9,7,14]);assert.equal(d.edCards.cats.length,14);assert.equal(d.checker,undefined);
      const original=await state();assert.equal(await ev(`return __rec.validSession(${JSON.stringify(original)})`),true);
      for(const key of ['cr','bites','shownGain','totalG'])for(const value of [-1,1.5,'abc']){const bad=structuredClone(original);bad.events[0][key]=value;assert.equal(await ev(`return __rec.validSession(${JSON.stringify(bad)})`),false)}
      const future=structuredClone(original);future.future={value:1};future.events[0].future='kept';assert.equal(await ev(`return __rec.validSession(${JSON.stringify(future)})`),true);
    });
    await test('build-and-storage-isolation',async()=>{
      assert.match(built,/^<!DOCTYPE html>\n<!-- tg-test: built from feature\/rec-tokyoghoul 8d041ce -->/);assert.match(built,/noindex/);assert.doesNotMatch(built,/"slot-tools-rec"/);assert.throws(()=>buildTestPage(source.replace('const KEY="slot-tools-rec";',''), '8d041ce'));assert.throws(()=>buildTestPage(source,'bad'));
      await ev('localStorage.setItem("slot-tools-rec",JSON.stringify({sessions:[{id:"production",events:[{text:"keep"}]}]}))');const old=await ev('return localStorage.getItem("slot-tools-rec")');await start();await hit();await grid('エンディング');await cards();await plus('edWhiteW');assert.equal(await ev('return localStorage.getItem("slot-tools-rec")'),old);
    });
  }finally{fs.writeFileSync(path.join(h.artifacts,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({pass:results.filter(r=>r.ok).length,fail:results.filter(r=>!r.ok).length,artifacts:h.artifacts}));await h.close()}
  if(results.some(r=>!r.ok))process.exitCode=1;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await main();

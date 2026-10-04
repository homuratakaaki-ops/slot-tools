// Run explicitly: node tests/new-1005-four-machines.browser.mjs
// Real iframe viewports, production handlers, canvas pixels and clipboard boundary.
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
const visualFindings=[];
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
    if(await frame(`return d.querySelector('#gIn')&&w.CheckerConfigs?.[${JSON.stringify(id)}]?true:false;`).catch(()=>false))break;
    await pause(40);
  }
  await frame(`w.__key=${JSON.stringify(id+'-checker-v1')};`);
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function clear(id,width=390){
  await evaluate(`localStorage.removeItem(${JSON.stringify(id+'-checker-v1')});`);
  await load(id,width);
}
async function games(value){await frame(`const el=d.getElementById('gIn');el.value=${JSON.stringify(String(value))};el.dispatchEvent(new w.Event('input',{bubbles:true}));el.dispatchEvent(new w.Event('change',{bubbles:true}));`);}
async function bump(key){await click(`[data-c="${key}"] .plus`);}
async function canvas(id){
  return frame(`const cv=d.getElementById(${JSON.stringify(id)});const x=cv.getContext('2d');const a=x.getImageData(0,0,cv.width,cv.height).data;let opaque=0,bright=0;for(let i=0;i<a.length;i+=4){if(a[i+3])opaque++;if(a[i]+a[i+1]+a[i+2]>180)bright++;}return {width:cv.width,height:cv.height,opaque,bright,text:w.__texts[cv.id]||[],data:cv.toDataURL()};`);
}
function saveCanvas(name,c){fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(c.data.split(',')[1],'base64'));}
async function copy(plain=false){await click(plain?'#cpPlainBtn':'#cpBtn');return frame('return w.__clipboard;');}
async function reset(){await frame(`d.getElementById('dataOps').open=true;`);await click('#resetBtn');await click('#resetBtn');}
function pass(name,detail){results.push({name,status:'PASS',detail});console.log('PASS '+name);}
async function measure(name){
  const r=await frame(`const width=w.innerWidth;const nodes=[...d.querySelectorAll('header *,#main *,nav *')].filter(e=>e.getClientRects().length&&w.getComputedStyle(e).visibility!=='hidden');return {width,overflow:nodes.filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>width+.5;}).map(e=>({tag:e.tagName,cls:e.className,text:e.textContent.slice(0,60),rect:e.getBoundingClientRect().toJSON()})),buttons:nodes.filter(e=>e.matches('button,.plus')).map(e=>({text:e.textContent,height:e.getBoundingClientRect().height,minHeight:w.getComputedStyle(e).minHeight})),ndLabels:[...d.querySelectorAll('.bz-row .ct')].map(e=>{const range=d.createRange();range.selectNodeContents(e.firstElementChild);return {text:e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,rowHeight:e.closest('.bz-row').getBoundingClientRect().height,lineCount:range.getClientRects().length,font:w.getComputedStyle(e.firstElementChild).fontSize};})};`);
  fs.writeFileSync(path.join(artifacts,name+'-layout.json'),JSON.stringify(r,null,2));
  // Jump navigation intentionally scrolls horizontally. Its clipped children do
  // not overflow the page viewport; test the scroll container itself instead.
  const visibleOverflow=[];
  for(const item of r.overflow){
    const clipped=await frame(`return [...d.querySelectorAll('.jump-nav button')].some(e=>e.textContent===${JSON.stringify(item.text)}&&['auto','scroll','hidden'].includes(w.getComputedStyle(e.parentElement).overflowX));`);
    if(!clipped)visibleOverflow.push(item);
  }
  assert.deepEqual(visibleOverflow,[],name+' horizontal overflow');
  assert.ok(r.buttons.every(b=>b.height>=44),name+' button below 44px: '+JSON.stringify(r.buttons.filter(b=>b.height<44)));
  pass(name+' viewport',{width:r.width,minButtonHeight:Math.min(...r.buttons.map(b=>b.height)),overflow:0,ndLabels:r.ndLabels});
  if(r.ndLabels.length){
    assert.deepEqual(r.ndLabels.map(l=>l.text),['通常','高確','超高確','通常','高確']);
    if(r.ndLabels.some(l=>l.lineCount!==1))visualFindings.push({name:name+' n/d single-line labels',status:'FAIL',detail:r.ndLabels});
    else pass(name+' n/d single-line labels',r.ndLabels);
  }
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
  for(const id of ['juuou','paripi','tenten','mhsunbreak']){
    const cardTab=id==='mhsunbreak'?2:1;
    await clear(id);
    assert.equal(await frame(`return d.querySelector('#gIn').closest('section').querySelector('details')===null;`),true);
    const countKey=id==='juuou'?'sc':id==='paripi'?'cz':'at';
    await bump('counts.'+countKey);
    assert.equal((await state()).counts[countKey],1);
    assert.equal(await frame(`return d.querySelector('[data-c="counts.${countKey}"]').textContent.includes('現在');`),false);
    await tab(cardTab);await pause(120);
    let c=await canvas('cardCanvas');assert.ok(c.bright>1000&&c.opaque===c.width*c.height);
    assert.ok(!c.text.some(t=>/1\/\d/.test(t.text)));
    assert.ok(!/1\/\d/.test(await copy()));
    saveCanvas(id+'-empty-games-card',c);
    await click('#detailBtn');c=await canvas('detailCanvas');assert.ok(c.bright>1000);assert.ok(!c.text.some(t=>/1\/\d/.test(t.text)));
    pass(id+' blank-games measured-rate absent (input/card/detail/template)');
    await tab(0);await games(1000);await tab(cardTab);
    c=await canvas('cardCanvas');assert.ok(c.text.some(t=>t.text.includes('1/1000.0')));saveCanvas(id+'-card',c);
    const normal=await copy();assert.ok(normal.includes('1/1000.0'));
    const plain=await copy(true);assert.ok(plain.includes('→'));assert.ok(!/[▶↪\uFE0E\uFE0F]/u.test(plain));
    await click('#detailBtn');c=await canvas('detailCanvas');assert.ok(c.bright>1000);assert.ok(c.text.some(t=>t.text.includes('1/1000.0')));saveCanvas(id+'-detail',c);
    pass(id+' card/detail pixels and both copy buttons');
    await tab(0);assert.ok(await frame(`return d.querySelector('[data-c="counts.${countKey}"]').textContent.includes('現在 1/1000.0');`));
    pass(id+' games input updates rate');
    const before=await state();await reset();assert.equal((await state()).counts[countKey],0);await click('#undoBtn');assert.deepEqual(await state(),before);
    pass(id+' double-reset and undo restore');
    for(let p=0;p<=cardTab;p++){
      await tab(p);
      const scroll=await frame(`const m=d.getElementById('main');m.scrollTop=83+p*0; m.dispatchEvent(new w.Event('scroll'));return m.scrollTop;`.replace('83+p*0',String(83+p*21)));
      await tab((p+1)%(cardTab+1));await tab(p);
      assert.equal(await frame('return d.getElementById("main").scrollTop;'),scroll);
    }
    pass(id+' per-tab scroll retention with explicit event');
    for(const width of [360,390]){
      await load(id,width,530);
      if(id==='mhsunbreak'){
        await frame("const s=JSON.parse(w.localStorage.getItem(w.__key));for(const key of Object.keys(s.bz))s.bz[key]=99;w.localStorage.setItem(w.__key,JSON.stringify(s));");
        await load(id,width,530);
        assert.ok(Object.values((await state()).bz).every(v=>v===99),'saved BZ keys survive reload');
      }
      for(let p=0;p<=cardTab;p++){
        await tab(p);await measure(id+'-'+width+'-tab'+p);
        if(p===0){
          if(id==='mhsunbreak')await frame(`d.querySelector('.bz-sub').scrollIntoView({block:'start'});`);
          const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,id+'-'+width+'-input.png'),Buffer.from(shot.data,'base64'));
        }
      }
    }
    if(id==='juuou'){
      for(let p=0;p<=cardTab;p++){await tab(p);assert.ok(!(await frame('return d.documentElement.outerHTML;')).includes('設定3'));}
      assert.ok(!normal.includes('設定3'));assert.ok(!(await canvas('cardCanvas')).text.some(t=>t.text.includes('設定3')));
      assert.ok(!fs.readFileSync(path.join(root,'checker-data/juuou.js'),'utf8').includes('設定3'));
      pass('juuou absent-setting text excluded');
    }
    assert.deepEqual(await frame('return w.__errors;'),[]);
    pass(id+' zero console/unhandled errors');
  }
  // Independent expectations come from the issuer's tables and immutable template.
  const spec=fs.readFileSync(path.join(root,'docs/specs/new-1005-four-machines-instructions.md'),'utf8');
  const groups=[['atEnd','#### (1) AT終了画面'],['trophy','#### (2) エンタトロフィー'],['over','#### (3) 獲得枚数表示'],['stamp','#### (4) エンディング中のスタンプ色']].map(([key,start])=>{
    const chunk=spec.slice(spec.indexOf(start)).split(/\n#### |\n### /)[0];
    return {key,rows:chunk.split(/\r?\n/).filter(l=>/^\| `\w+` \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(x=>x.trim().replace(/[`*]/g,'')))};
  });
  await clear('mhsunbreak');
  const bzUi=await frame(`const rows=[...d.querySelectorAll('.bz-row')];const sec=rows[0].closest('section');return {titles:[...sec.querySelectorAll('.bz-sub')].map(e=>e.textContent),hints:sec.querySelectorAll('.hint').length,rows:rows.map(e=>[...e.querySelectorAll('button')].map(b=>[b.dataset.label,b.getAttribute('aria-label')]))};`);
  assert.deepEqual(bzUi.titles,['弱レア','強レア']);assert.equal(bzUi.hints,1);
  assert.deepEqual(bzUi.rows,['弱レア 通常','弱レア 高確','弱レア 超高確','強レア 通常','強レア 高確'].map(name=>['当選','ハズレ'].map(action=>[name+' '+action,name+' '+action])));
  pass('MH BZ subheadings, single hint and full operation labels');
  await tab(1);
  const labels=await frame(`return [...d.querySelectorAll('.crow[data-c]')].map(e=>[e.dataset.c,e.querySelector('.nm').textContent,e.querySelector('.mn').textContent]);`);
  // Keep the historical instruction sheet intact; apply the approved wording rule to expectations only.
  assert.deepEqual(labels,groups.flatMap(g=>g.rows.map(r=>[g.key+'.'+r[0],r[1],r[2].replace(/設定([0-9０-９・]*(?:以上)?)確定演出/g,'設定$1濃厚')])));
  assert.equal(labels.length,31);assert.equal(await frame('return d.querySelectorAll("#nav button").length;'),3);
  pass('MH 31 exact hint labels/sublabels and 3 tabs');
  await tab(2);
  const zero=await copy();
  const original=fs.readFileSync(path.join(root,'docs/specs/mhsunbreak-nana-template-v01.txt'),'utf8');
  const expected='設定判別メモ｜スマスロ モンスターハンターライズ：サンブレイク\n通常 0G / AT0回\n_______\n\n'+original.replace(/▶︎ (?=\r?\n)/g,'▶︎ 0回')+'\n\nby slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様';
  assert.equal(zero,expected);assert.equal((original.match(/▶︎ (?=\r?\n)/g)||[]).length,14);
  fs.writeFileSync(path.join(artifacts,'mhsunbreak-zero-template.txt'),zero);
  const plain=await copy(true);assert.ok(plain.includes('1周期→ 0回'));assert.ok(plain.includes('→BZ突入時に告知される'));assert.ok(!/[▶↪①-⑤\uFE0E\uFE0F]|\p{Emoji_Presentation}/u.test(plain));
  pass('MH zero-template bytes (14 filled lines) and plain-copy substitutions');
  const screenTargets={
    jay:['男(奇数)▶︎ ','ｼﾞｪｲ       ▶︎ '],arlo:['男(奇数)▶︎ ','ｱﾙﾛｰ       ▶︎ '],galeas:['男(奇数)▶︎ ','ｶﾞﾚｱｽ     ▶︎ '],
    rondine:['女(偶数)▶︎ ','ﾛﾝﾃﾞｨｰﾈ ▶︎ '],luchika:['女(偶数)▶︎ ','ﾙｰﾁｶ       ▶︎ '],
    fioreneAirou:['高設定弱▶︎ '],chicheAirouGaruku:['高設定強▶︎ '],fioreneRondine:['2否定　▶︎ '],jayArloGaleas:['3否定　▶︎ '],
    hinoeMinoto:['2以上　▶︎ '],zenin:['5以上　▶︎ '],entalion:['6確　　▶︎ ']
  };
  const stampTargets={blue:'🔵奇  ',yellow:'🟡 偶 ',green:'🟢弱  ',red:'🔴 強 ',bronze:'銅 ',silver:'銀 ',gold:'金 ',momiji:'🍁 ',rainbow:'🌈 '};
  // Every input goes through a production click, then its output is compared and undone.
  for(const g of groups)for(const r of g.rows){
    await tab(1);await bump(g.key+'.'+r[0]);await tab(2);
    const output=await copy();const changed=output.split('\n').flatMap((l,i)=>l===zero.split('\n')[i]?[]:[i]);
    const expectedChanges=g.key==='trophy'||g.key==='over'?0:g.key==='atEnd'&&['jay','arlo','galeas','rondine','luchika'].includes(r[0])?2:1;
    assert.equal(changed.length,expectedChanges,g.key+'.'+r[0]+' template delta');
    let expectedOutput=zero;
    const targets=g.key==='atEnd'?screenTargets[r[0]]:g.key==='stamp'?[stampTargets[r[0]]]:[];
    for(const prefix of targets)expectedOutput=expectedOutput.replace(prefix+'0回',prefix+'1回');
    assert.equal(output,expectedOutput,g.key+'.'+r[0]+' exact template target');
    const card=await canvas('cardCanvas');const first=card.text.find(t=>t.x===70&&t.y===752)?.text;
    if(Number(r[5])!==1)assert.equal(first,'確定演出 なし',g.key+'.'+r[0]+' excluded from best');
    else assert.ok(first?.includes(r[1]),g.key+'.'+r[0]+' selected in best');
    assert.equal(card.text.find(t=>t.x===814&&t.y===312)?.text,'確定演出');
    const cert=card.text.find(t=>t.x===814&&t.y===368)?.text;
    assert.equal(cert,'計'+(Number(r[3])>0?1:0)+'回');
    await click('#undoBtn');
  }
  pass('MH all 31 hints: single-input template delta, oneL exclusion/inclusion, rank counts');
  const bz=['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'];
  for(const key of bz){
    await tab(0);
    const selector=`[data-bump-many="bz.${key}D,bz.${key}N"]`;
    const fullName={'weakNormal':'弱レア 通常','weakHigh':'弱レア 高確','weakSuper':'弱レア 超高確','strongNormal':'強レア 通常','strongHigh':'強レア 高確'}[key];
    await click(selector);assert.equal((await state()).bz[key+'D'],1);assert.equal((await state()).bz[key+'N'],1);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(fullName+' 当選'));
    await tab(2);
    const winTemplate=await copy();
    const ratioMatch=[...zero.matchAll(/0\/0/g)][bz.indexOf(key)];
    assert.equal(winTemplate,zero.slice(0,ratioMatch.index)+'1/1'+zero.slice(ratioMatch.index+3));
    await tab(0);
    await click('#modeBtn');
    assert.equal(await frame(`return d.querySelector(${JSON.stringify(selector)}).parentElement.querySelector('button:last-child').disabled;`),true);
    await click(selector);assert.equal((await state()).bz[key+'D'],0);assert.equal((await state()).bz[key+'N'],0);
    await click('#undoBtn');
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(fullName+' 当選'));
    await click('#modeBtn');await click('#undoBtn');
    await click(`[data-bump="bz.${key}D"]`);
    await tab(2);assert.equal(await copy(),zero.slice(0,ratioMatch.index)+'0/1'+zero.slice(ratioMatch.index+3));
    await tab(0);await click('#modeBtn');await click(`[data-bump="bz.${key}D"]`);
    assert.equal((await state()).bz[key+'D'],0);await click('#undoBtn');await click('#modeBtn');
    await click('#undoBtn');
  }
  pass('MH five n/d rows: wins/misses, minus disabled at n=d, undo and template values');
  for(const key of ['cycle.c1','cycle.c2','cycle.c3','cycle.c4','cycle.c5','czType.breakzone','czType.airou']){
    await tab(0);await bump(key);await tab(2);
    assert.equal((await copy()).split('\n').filter((l,i)=>l!==zero.split('\n')[i]).length,1,key);
    const prefix=key.startsWith('cycle.')?['①','②','③','④','⑤'][Number(key.at(-1))-1]+'周期▶︎ ':key==='czType.breakzone'?'ブレイクゾーン▶︎ ':'アイルー福引　▶︎ ';
    assert.equal(await copy(),zero.replace(prefix+'0回',prefix+'1回'));
    await click('#undoBtn');
  }
  pass('MH cycle/CZ single-input template deltas');
  await tab(0);await bump('czType.breakzone');await bump('czType.airou');await bump('czType.airou');
  const percents=await frame(`return [...d.querySelectorAll('[data-c^="czType."] .pct')].map(e=>e.textContent);`);
  assert.deepEqual(percents,['1/3 33%','2/3 67%']);await tab(2);await click('#detailBtn');
  const detail=await canvas('detailCanvas');assert.ok(detail.text.some(t=>t.text.includes('ブレイクゾーン ×1 (33%)')));assert.ok(detail.text.some(t=>t.text.includes('アイルー福引 ×2 (67%)')));
  pass('MH CZ denominator matches screen/detail');
  await clear('mhsunbreak');await tab(1);
  for(const g of groups)for(const r of g.rows)await bump(g.key+'.'+r[0]);
  await tab(0);await games(1000);await bump('counts.at');
  for(const key of bz)await click(`[data-bump-many="bz.${key}D,bz.${key}N"]`);
  for(const key of ['cycle.c1','cycle.c2','cycle.c3','cycle.c4','cycle.c5','czType.breakzone','czType.airou'])await bump(key);
  await tab(2);
  const allCard=await canvas('cardCanvas');
  const summary=allCard.text.filter(t=>[70,560].includes(t.x)&&t.y>=752&&t.y<=936);
  assert.equal(summary.length,10);
  for(const x of [70,560])assert.deepEqual(summary.filter(t=>t.x===x).map(t=>t.y),[752,788,824,860,896]);
  const minFont=Math.min(...summary.map(t=>Number(t.font.match(/([\d.]+)px/)[1])));
  // Bold glyphs may extend left of their text origin without clipping or overlap.
  const leftOverhang=Math.max(...summary.map(t=>Math.max(0,t.x-t.left)));
  const overflow=summary.filter(t=>t.left<0||t.right>(t.x===70?560:1010));
  for(const right of summary.filter(t=>t.x===560))assert.ok(summary.find(t=>t.x===70&&t.y===right.y).right<=right.left);
  assert.ok(minFont>=16);assert.deepEqual(overflow,[]);
  assert.ok(allCard.bright>1000&&allCard.opaque===allCard.width*allCard.height);
  pass('MH all-31 summary: 5+5 rows, Y896, fitted visible bounds and pixels',{rows:summary,minFont,overflow:overflow.length,leftOverhang,lastY:Math.max(...summary.map(t=>t.y))});
  saveCanvas('mhsunbreak-all-card',allCard);await click('#detailBtn');saveCanvas('mhsunbreak-all-detail',await canvas('detailCanvas'));
  assert.deepEqual(errors,[]);pass('all browser console errors = 0');
  results.push(...visualFindings);
  if(visualFindings.length){console.error('FAIL n/d label wrapping. See layout measurements and screenshots.');process.exitCode=1;}
}catch(e){results.push({name:'browser acceptance',status:'FAIL',detail:e.stack,cause:String(e.cause||'')});console.error(e.stack,e.cause||'');process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({results,errors,externalResources:'Ads, analytics and Google Fonts requests fulfilled empty for offline test'},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

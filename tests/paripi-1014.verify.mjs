// Run explicitly: node tests/paripi-1014.verify.mjs
// パリピ孔明 10/14 解析更新：ボーナス獲得枚数（bonusOver）・ED中の1枚絵（edPic）の記録追加、
// CZ種別・150G・レア役CZ率の説明（ガイド）、なな様テンプレ v02。
// 前半は vm で機種データを読む検査、後半は headless Chrome で実クリック・再読込・3幅を確かめる。
// PAGE=/paripi-test-checker.html KEY=paripi-checker-v1-test CFG=paripi-test でテスト版も検証できる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createHash} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const PAGE=process.env.PAGE||'/paripi-checker.html';
const KEY=process.env.KEY||'paripi-checker-v1';
const CFG=process.env.CFG||'paripi';
const DATA=PAGE==='/paripi-checker.html'?'checker-data/paripi.js':'checker-data/paripi-test.js';
const BASE='19e7792';  // 本件直前の main
const source=read(DATA),box={window:{}};
vm.runInNewContext(source,box);
const c=box.window.CheckerConfigs[CFG],state=()=>clone(c.defaults);
const ctx=(S,rows=[])=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',pct:(n,d)=>`${n}/${d}`,
  crow:(key,label,sub,hot,pct)=>{rows.push({key,label,sub,hot,pct:!!pct});return `<button>${label}</button><small>${sub}</small>`;}});

// ---- 1. 出典（ちょんぼりすた 2026-10-14 取得）から転記した表。実装から読まず、ここに独立に書く ----
const BONUS=[['o222','222 OVER','設定2以上濃厚',2],['o456','456 OVER','設定4以上濃厚',4],['o555','555 OVER','設定5以上濃厚',5],
  ['o803','803 OVER','設定5以上濃厚',5],['o666','666 OVER','設定6濃厚',6]];
const ED=[['even1','偶数設定期待度UP（弱）','画像①',0],['even2','偶数設定期待度UP（強）','画像②',0],['high1','高設定期待度UP（弱）','画像③',0],
  ['high2','高設定期待度UP（強）','画像④',0],['s2','設定2以上濃厚','画像⑤',2],['s3','設定3以上濃厚','画像⑥',3],['s4','設定4以上濃厚','画像⑦',4],
  ['s5','設定5以上濃厚','画像⑧',5],['s6','設定6濃厚','画像⑨',6]];
const CZ={sanka:['三歌の礼',['369.9','359.9','345.6','332.1','323.0','314.8']],eiko:['英子の試練',['701.9','676.9','648.8','607.1','560.9','528.4']],
  sekihei:['石兵八陣',['1809.0','1761.7','1710.5','1564.5','1440.7','1324.4']]};
const G150=['41.4','42.5','45.6','48.1','51.2','53.9'];
const RARE=[['弱チェリー','0.4','0.4','12.5'],['スイカ','2.0','20.3','50.0'],['チャンス目','25.0','50.0','75.0']];
const ST_CERT=[['s2',2],['s3',3],['s4',4],['s5',5],['s6',6]];

const rows=[],shisa=c.pages(ctx(state(),rows),()=> '')[2]();
assert.deepEqual(rows.filter(r=>r.key.startsWith('bonusOver.')).map(r=>[r.key.slice(10),r.label,r.sub,r.hot,r.pct]),BONUS.map(b=>[b[0],b[1],b[2],true,false]));
assert.deepEqual(rows.filter(r=>r.key.startsWith('edPic.')).map(r=>[r.key.slice(6),r.label,r.sub,r.hot,r.pct]),ED.map(e=>[e[0],e[1],e[2],e[3]>0,false]));
// 10/26 にイイネ下3桁（iine.*）が枚数とEDの間に入った（tests/paripi-1026.verify.mjs）。10/14 分の並びはそれを除いて見る。
assert.deepEqual(rows.filter(r=>!r.key.startsWith('iine.')).map(r=>r.key.split('.')[0]),[...Array(12).fill('stEnd'),...Array(5).fill('bonusOver'),...Array(9).fill('edPic')]);
assert.ok(shisa.includes('<div class="hint">ED中に表示される1枚絵を記録します。ST終了画面とは別です。</div>'));
assert.ok(shisa.indexOf('ST終了画面')<shisa.indexOf('ボーナス獲得枚数')&&shisa.indexOf('ボーナス獲得枚数')<shisa.indexOf('ED中の1枚絵'));
const inputRows=[];c.pages(ctx(state(),inputRows),()=> '')[0]();
for(const [k,[name,v]] of Object.entries(CZ))assert.deepEqual(inputRows.find(r=>r.key==='czType.'+k),{key:'czType.'+k,label:name,sub:`設1:1/${v[0]}⇔設6:1/${v[5]}`,hot:false,pct:false});
const guide=read('paripi-guide.html');
for(let i=0;i<6;i++){
  assert.ok(guide.includes(`<tr><td>設定${i+1}</td><td>1/${CZ.sanka[1][i]}</td><td>1/${CZ.eiko[1][i]}</td><td>1/${CZ.sekihei[1][i]}</td></tr>`),'CZ種別 設定'+(i+1));
  assert.ok(guide.includes(`<tr><td>設定${i+1}</td><td>${G150[i]}%</td></tr>`),'150G 設定'+(i+1));
}
for(const [role,a,b,d] of RARE)assert.ok(guide.includes(`<tr><td>${role}</td><td>${a}%</td><td>${b}%</td><td>${d}%</td></tr>`),role);
for(const [,label,hint] of BONUS)assert.ok(guide.includes(`<tr><td>${label}</td><td>${hint}</td></tr>`),label);
for(const [,label,image] of ED)assert.ok(guide.includes(`<tr><td>${label}</td><td>${label}</td><td>${image}</td></tr>`),label);
assert.ok(guide.includes('150G以内にボーナスへ当選する期待度です（ゾーンの当選率ではありません）。'));
assert.ok(guide.includes('起点の条件'));
assert.ok(guide.includes('設定1の値です。他設定は公表されていません。'));
assert.doesNotMatch(guide,/全設定共通で[^。]*CZ|設定差なし|設定差はありません/);
assert.ok(guide.includes('（2026年10月14日取得）'));
assert.ok(guide.includes('なな様テンプレ（v02）'));
// レア役CZ率は説明だけ。通常時タブの行の表示（名前・サブ）は本件直前と同じ
const oldBox={window:{}};vm.runInNewContext(execFileSync('git',['show',BASE+':checker-data/paripi.js'],{cwd:root,encoding:'utf8'}),oldBox);
const old=oldBox.window.CheckerConfigs.paripi;
// 10/26 に士気高揚ゾーンの小役別3行＋説明が入り、ｽﾃﾁｪﾝ⑤の説明が平均周期回数に変わった。その2か所を戻すと本件直前と同じ
const tab1=c.pages(ctx(state()),()=> '')[1](),roleFrom=tab1.indexOf('\n      <div class="cgrid" style="margin-top:6px">'),roleTo=tab1.indexOf('</div>',tab1.indexOf('母数は読み替えません。'))+6;
assert.ok(roleFrom>0&&roleTo>roleFrom);
assert.equal((tab1.slice(0,roleFrom)+tab1.slice(roleTo)).replace(/\n *\.role-row[^\n]*/g,'').replace(/<div class="hint" data-fold="no">CZ天井までの平均周期回数[^<]*<\/div>/,'<div class="hint">設定差は公表されていません</div>'),old.pages(ctx(clone(old.defaults)),()=> '')[1]());
console.log('PASS 1: 出典照合 枚数5・ED9・CZ種別18・150G 6・レア役9、画面の行／ガイドの表、通常時タブは本件（10/26）の追加分を除いて不変');

// ---- 2. テンプレ v02 ----
const v01=read('docs/specs/paripi-nana-template-v01.txt'),v02=read('docs/specs/paripi-nana-template-v02.txt');
const P='\u25B6\uFE0E',blank=new RegExp(P+' *(?=\\n|$)','g');
assert.equal(createHash('sha256').update(v02).digest('hex'),'cade1fcb673c38fb9cade6630c9c690bdad3ba2262b4fc27296cb6fdb70ef0ca');
assert.equal(Buffer.byteLength(v02),1091);assert.ok(v02.startsWith(v01));assert.ok(!v02.includes('\r'));
assert.equal(v02.slice(v01.length),['','','■ﾎﾞｰﾅｽ獲得枚数',...['222','456','555','803','666'].map(x=>x+' OVER'+P+' '),'','■ED中の1枚絵',
  ...['偶数弱\u3000','偶数強\u3000','高設定弱','高設定強','2以上\u3000','3以上\u3000','4以上\u3000','5以上\u3000'].map(x=>x+P+' '),'6濃厚\u3000'+P].join('\n'));
// 10/26 にテンプレを v03 にした（2見出しの追加だけ・tests/paripi-1026.verify.mjs）。その2見出しを除くと v02 のまま
const strip1026=t=>t.replace(/■士気高揚 小役別\n(?:[^\n]+\n){3}\n/,'').replace(/■ｲｲﾈ下3桁\nなし\n\n/,'');
assert.equal(strip1026(vm.runInNewContext(source.match(/const TEMPLATE=.*;/)[0]+'TEMPLATE')),v02);
const body=S=>c.template(ctx(S)).split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0];
assert.deepEqual(Buffer.from(strip1026(body(state()))),Buffer.from(v02.replace(blank,P+' 0回')));
// 新しい14項目は1つずつ +1 すると対応する1行だけが変わる
const zeroLines=body(state()).split('\n');
for(const [g,list,head] of [['bonusOver',BONUS,'■ﾎﾞｰﾅｽ獲得枚数'],['edPic',ED,'■ED中の1枚絵']]){
  list.forEach(([k],i)=>{
    const S=state();S[g][k]=3;const out=body(S).split('\n'),changed=out.flatMap((l,j)=>l!==zeroLines[j]?[j]:[]);
    assert.deepEqual(changed,[zeroLines.indexOf(head)+1+i],g+'.'+k);assert.ok(out[changed[0]].endsWith(P+' 3回'));
  });
}
console.log('PASS 2: テンプレ v02 = v01 + 2見出し14行（1091バイト・hash固定）、全0出力のバイト一致、新14項目は各1行だけ動く');

// ---- 3. 旧データ（stEnd のみ）の読み込み ----
const legacy={games:1500,counts:{cz:2,bonus:3},stEnd:{kanban:2,s4:1},czType:{sanka:1},future:{keep:true}};
const norm=c.normalizeState(clone(legacy));
assert.deepEqual(clone(norm.bonusOver),Object.fromEntries(BONUS.map(b=>[b[0],0])));
assert.deepEqual(clone(norm.edPic),Object.fromEntries(ED.map(e=>[e[0],0])));
assert.equal(norm.stEnd.kanban,2);assert.equal(norm.stEnd.s4,1);assert.equal(norm.counts.bonus,3);assert.equal(norm.future.keep,true);
assert.deepEqual(clone(c.normalizeState(clone(norm))),clone(norm));
// 10/26 に iine・shikiRole を末尾に足した
assert.deepEqual(clone(c.mergeKeys).slice(-4,-2),['bonusOver','edPic']);
const bad=c.normalizeState({bonusOver:{o666:-1,o222:'2',future:5},edPic:{s6:NaN,even1:1.9}});
assert.deepEqual([bad.bonusOver.o666,bad.bonusOver.o222,bad.bonusOver.future,bad.edPic.s6,bad.edPic.even1],[0,2,5,0,1.9]);
// 旧データのテンプレは、本件直前の版の出力に新しい2見出し（全0）を足しただけ
const oldOut=old.template(ctx(old.normalizeState(clone(legacy)))),newOut=c.template(ctx(norm));
assert.equal(strip1026(newOut),oldOut.replace('\n\nby slot-tools.jp','\n\n'+v02.slice(v01.length+2).replace(blank,P+' 0回')+'\n\nby slot-tools.jp'));
console.log('PASS 3: 旧データ（stEnd のみ）で新キー14個が0で補完、既存値・未知キーを保持、冪等、テンプレは2見出しの追加だけ');

// ---- 4. 確定演出サマリー：15項目 32768通り ----
const cert=[...ST_CERT.map(([k,r])=>['stEnd',k,r]),...BONUS.map(b=>['bonusOver',b[0],b[3]]),...ED.filter(e=>e[3]>0).map(e=>['edPic',e[0],e[3]])];
const labelOf=([g,k])=>g==='stEnd'?{s2:'設定2以上濃厚',s3:'設定3以上濃厚',s4:'設定4以上濃厚',s5:'設定5以上濃厚',s6:'設定6濃厚'}[k]
  :g==='bonusOver'?BONUS.find(b=>b[0]===k).slice(1,3).join(' '):'ED1枚絵 '+ED.find(e=>e[0]===k)[1];
assert.equal(cert.length,15);
for(let mask=0;mask<1<<15;mask++){
  const S=state();let total=0,st=0;
  cert.forEach(([g,k],i)=>{if(mask>>i&1){S[g][k]=1+(i%3);total+=1+(i%3);if(g==='stEnd')st+=1+(i%3);}});
  // 最も高い設定、同じ設定なら ST終了画面→ボーナス獲得枚数→ED中の1枚絵、同じ群なら並び順
  let best=-1;cert.forEach((item,i)=>{if(mask>>i&1&&(best<0||item[2]>cert[best][2]))best=i;});
  const b=c.card.bottom({S});
  assert.equal(b.columns[0].items[0].text,best<0?'確定演出 なし':`確定 ${labelOf(cert[best])} ×${1+(best%3)}`,'mask '+mask);
  assert.equal(b.columns[0].items[0].value,total);
  assert.equal(b.columns[1].items[2].value,st);   // 右列の「濃厚」は ST終了画面の符号だけを並べる行
  assert.deepEqual(clone(b.columns.map(col=>col.items.length)),[5,3]);
}
// 詳細カード
const S4=state();S4.bonusOver.o803=1;S4.edPic.even2=2;S4.edPic.s5=1;
// 10/26 に「イイネ下3桁」が枚数とEDの間に入った。10/14 分の4セクションはそれを除いて見る
const det=c.card.detail({S:S4}).filter(s=>s.title!=='イイネ下3桁');
assert.deepEqual(clone(det.map(s=>s.title)),['初当り','ST終了画面','ボーナス獲得枚数','ED中の1枚絵','通常時']);
assert.deepEqual(clone(det[2].items),BONUS.map(b=>({label:b[1]+' '+b[2],value:b[0]==='o803'?1:0,hot:true})));
assert.deepEqual(clone(det[3].items),ED.map(e=>({label:e[1],value:{even2:2,s5:1}[e[0]]||0,hot:e[3]>0})));
assert.ok(!det[2].percent&&!det[3].percent);
assert.ok(!source.includes('(?<=')&&!source.includes('(?<!'));
console.log('PASS 4: 確定演出15項目×32768通りで1行目が設定順（同設定は ST→枚数→ED）、合計回数、5+3行；詳細カード2セクション；後読みなし');

// ---- 5. ブラウザ：加算・減算・取消・再読込・旧データ・3幅 ----
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-paripi-1014-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-paripi-1014-profile-'));
const errors=[];const measures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
// /__main/ 以下は本件直前の main（19e7792）の版を返す（縦の増減の突き合わせ用）
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(url==='/harness'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');}
  if(url.startsWith('/__main/')){
    try{const body=execFileSync('git',['show',BASE+':'+url.slice(8)],{cwd:root});res.setHeader('Content-Type',types[path.extname(url)]||'text/plain');return res.end(body);}
    catch{res.writeHead(404);return res.end();}
  }
  const file=path.resolve(root,'.'+url);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',types[path.extname(file)]||'text/plain');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
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
async function evaluate(expression){
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
const frame=code=>evaluate(`(async()=>{const w=document.getElementById('frame').contentWindow;const d=w.document;${code}})()`);
const getState=()=>frame(`return JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}));`);
const click=sel=>frame(`const el=d.querySelector(${JSON.stringify(sel)});if(!el)throw Error('Missing '+${JSON.stringify(sel)});el.click();`);
const plus=key=>click(`[data-c="${key}"] .plus`);
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(60);}
async function load(page=PAGE,width=390,height=740,cfg=CFG){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin)}+${JSON.stringify(page)};})`);
  for(let i=0;i<100;i++){if(await frame(`return !!(d.querySelector("#main .sec")&&w.CheckerConfigs?.[${JSON.stringify(cfg)}]);`).catch(()=>false))break;await pause(40);}
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function seed(obj,page,width,key=KEY,cfg=CFG){await evaluate(`localStorage.setItem(${JSON.stringify(key)},${JSON.stringify(JSON.stringify(obj))});`);await load(page,width,740,cfg);}
async function clear(page=PAGE,width=390){await evaluate(`localStorage.removeItem(${JSON.stringify(KEY)});`);await load(page,width);}
const overflow=()=>frame(`const m=d.getElementById('main');const W=w.innerWidth;
  const bad=[...m.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+0.5||r.left<-0.5)&&!e.closest('details:not([open])')&&!(e.parentElement&&e.parentElement.closest('.jump-nav'));}).map(e=>(e.className||e.tagName)+":"+(e.textContent||"").trim().slice(0,12));
  return {scroll:m.scrollWidth-m.clientWidth,bad:bad.slice(0,5),count:bad.length,height:m.scrollHeight};`);

try{
  browser=spawn(chrome,['--headless=new','--disable-gpu','--no-sandbox','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=1200,1000','about:blank'],{windowsHide:true,stdio:['ignore','ignore','pipe']});
  browser.on('error',e=>errors.push(e.message));
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
    if(m.method==='Fetch.requestPaused'){
      // 広告・計測・Webフォントは空で返す（ローカル検証の範囲外）
      await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Access-Control-Allow-Origin',value:'*'},{name:'Content-Type',value:m.params.resourceType==='Stylesheet'?'text/css':'application/javascript'}],body:''}).catch(e=>errors.push(e.message));
    }
  };
  await send('Page.enable');await send('Runtime.enable');
  await send('Fetch.enable',{patterns:[{urlPattern:'https://*'},{urlPattern:'http://www.*'}]});
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__errors=[];window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;window.addEventListener('error',e=>window.__errors.push(e.message));`});
  await send('Page.navigate',{url:origin+'/harness'});await pause(100);

  // 5a. 新14項目の加算・取消・減算（0では減らない）・再読込
  await clear();await tab(2);
  const keys=[...BONUS.map(b=>'bonusOver.'+b[0]),...ED.map(e=>'edPic.'+e[0])];
  for(const key of keys){
    const [g,k]=key.split('.');
    await plus(key);await plus(key);let S=await getState();assert.equal(S[g][k],2,key);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes('＋1'));
    await click('#undoBtn');S=await getState();assert.equal(S[g][k],1,key+' undo');
    await click('#modeBtn');await plus(key);await plus(key);await click('#modeBtn');
    S=await getState();assert.equal(S[g][k],0,key+' minus floor 0');
    await plus(key);
  }
  await load();let S=await getState();
  for(const key of keys){const [g,k]=key.split('.');assert.equal(S[g][k],1,key+' reload');}
  for(const v of Object.values(S.stEnd))assert.equal(v,0);
  await tab(2);
  // 10/26 の「イイネ下3桁」見出しは除いて見る
  assert.equal(await frame('return [...d.querySelectorAll(".sec-h")].map(e=>e.textContent).filter(t=>!t.startsWith("イイネ下3桁")).join("|");'),'ST終了画面計0回|ボーナス獲得枚数計5回|ED中の1枚絵計9回');
  const tpl=await (async()=>{await tab(3);await pause(80);return frame('return d.getElementById("tpl").value;');})();
  assert.ok(tpl.includes('■ﾎﾞｰﾅｽ獲得枚数\n222 OVER'+P+' 1回\n')&&tpl.includes('6濃厚\u3000'+P+' 1回\n\nby slot-tools.jp'));
  const bottom=await frame(`const c=w.CheckerConfigs[${JSON.stringify(CFG)}];return c.card.bottom({S:JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}))}).columns[0].items[0].text;`);
  assert.equal(bottom,'確定 666 OVER 設定6濃厚 ×1');
  console.log('PASS 5a: 新14項目 加算・取消・減算（0止まり）・再読込・見出し合計・テンプレ・カード1行目');

  // 5b. 旧データ（stEnd のみ）の実読み込み
  await seed(legacy,PAGE,390);await tab(2);
  assert.equal(await frame('return d.querySelectorAll("[data-c^=\\"bonusOver.\\"],[data-c^=\\"edPic.\\"]").length;'),14);
  await plus('edPic.s3');S=await getState();
  assert.deepEqual(S.edPic,Object.assign(Object.fromEntries(ED.map(e=>[e[0],0])),{s3:1}));
  assert.deepEqual(S.bonusOver,Object.fromEntries(BONUS.map(b=>[b[0],0])));
  assert.equal(S.stEnd.kanban,2);assert.equal(S.stEnd.s4,1);assert.equal(S.games,1500);assert.equal(S.future.keep,true);
  await click('#undoBtn');S=await getState();assert.equal(S.edPic.s3,0);assert.equal(S.stEnd.s4,1);
  console.log('PASS 5b: 旧データの実読み込みで新14行が出て、操作後の保存に新キーが0で入る・取消で戻る');

  // 5c. 3幅のはみ出し・タップ領域・CZ目安の行数・縦の増減（本件直前の版と比べる）
  const full={games:12345,counts:{cz:99,bonus:999},czType:{sanka:999,eiko:999,sekihei:999},stEnd:Object.fromEntries(['kanban','blue','yellow','even1','even2','high1','high2','s2','s3','s4','s5','s6'].map(k=>[k,999])),
    bonusOver:Object.fromEntries(BONUS.map(b=>[b[0],999])),edPic:Object.fromEntries(ED.map(e=>[e[0],999]))};
  for(const width of [360,390,412]){
    for(const [label,data] of [['empty',{}],['full',full]]){
      const heights={};
      for(const [ver,page,key,cfg] of [['old','/__main/paripi-checker.html','paripi-checker-v1','paripi'],['new',PAGE,KEY,CFG]]){
        await seed(data,page,width,key,cfg);
        for(const p of [0,2]){
          await tab(p);await pause(50);const ov=await overflow();heights[ver+p]=ov.height;
          if(ver==='old')continue;
          assert.equal(ov.scroll,0,`横スクロール0 ${width} ${label} tab${p}`);assert.equal(ov.count,0,'はみ出し0 '+JSON.stringify(ov));
          const sel=p===0?'[data-c^="czType."]':'[data-c^="bonusOver."],[data-c^="edPic."]';
          const taps=await frame(`return [...d.querySelectorAll(${JSON.stringify(sel)})].map(e=>{const r=e.getBoundingClientRect(),b=e.querySelector('.plus').getBoundingClientRect();return [Math.round(r.height),Math.round(b.width),Math.round(b.height)];});`);
          assert.equal(taps.length,p===0?3:14);assert.ok(taps.every(t=>t.every(v=>v>=44)),'44px以上 '+JSON.stringify(taps));
          const lines=await frame(`return [...d.querySelectorAll(${JSON.stringify(sel)})].map(e=>[...e.querySelectorAll('.lbl .nm,.lbl .mn')].map(x=>{const r=d.createRange();r.selectNodeContents(x);return x.textContent+':'+r.getClientRects().length;})).flat();`);
          assert.ok(lines.every(l=>l.endsWith(':1')),'名前・サブは1行 '+JSON.stringify(lines));
          await frame(`d.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:"start"});`);await pause(50);
          const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:740,scale:1}});
          fs.writeFileSync(path.join(artifacts,`tab${p}-${width}-${label}.png`),Buffer.from(shot.data,'base64'));
        }
      }
      const m={width,label,input:heights.new0-heights.old0,shisa:heights.new2-heights.old2,heights};measures.push(m);console.log('MEASURE '+JSON.stringify(m));
    }
  }
  for(const width of [360,390,412]){
    await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.src=${JSON.stringify(origin+'/paripi-guide.html')};})`);
    const g=await frame('return {W:w.innerWidth,scroll:d.documentElement.scrollWidth-d.documentElement.clientWidth};');
    assert.equal(g.W,width);assert.equal(g.scroll,0,'ガイドの横スクロール0');
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);
  assert.deepEqual(errors,[]);
  console.log(`PASS 5c: 360/390/412px × 空/満杯で入力・示唆タブのはみ出し0、新行とCZ行のタップ44px以上・名前とサブ1行、ガイド3幅 (${PAGE})`);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({measures,errors},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

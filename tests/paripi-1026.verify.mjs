// Run explicitly: node tests/paripi-1026.verify.mjs
// パリピ孔明 10/26 解析更新：イイネ下3桁（iine）・士気高揚ゾーンの小役別ボーナス当選（shikiRole）の記録追加、
// ｽﾃﾁｪﾝ⑤／CZ成功率の説明更新、なな様テンプレ v03。
// 前半は vm で機種データを読む検査、後半は headless Chrome で実クリック・再読込・3幅・カードPNGを確かめる。
// PAGE=/paripi-test-checker.html KEY=paripi-checker-v1-test CFG=paripi-test でテスト版も検証できる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {spawn,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const PAGE=process.env.PAGE||'/paripi-checker.html';
const KEY=process.env.KEY||'paripi-checker-v1';
const CFG=process.env.CFG||'paripi';
const DATA=PAGE==='/paripi-checker.html'?'checker-data/paripi.js':'checker-data/paripi-test.js';
const BASE='a14c1b9';  // 本件直前の main
const source=read(DATA),box={window:{}};
vm.runInNewContext(source,box);
const c=box.window.CheckerConfigs[CFG],state=()=>clone(c.defaults);
const oldBox={window:{}};vm.runInNewContext(execFileSync('git',['show',BASE+':checker-data/paripi.js'],{cwd:root,encoding:'utf8'}),oldBox);
const old=oldBox.window.CheckerConfigs.paripi;
const ctx=(S,rows=[])=>({S,mode:1,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',pct:(n,d)=>`${n}/${d}`,
  crow:(key,label,sub,hot,pct)=>{rows.push({key,label,sub,hot,pct:!!pct});return `<button>${label}</button><small>${sub}</small>`;}});
const P='\u25B6\uFE0E';

// ---- 1. 出典（ちょんぼりすた 2026-10-20 更新・2026-10-26 取得）から転記した表。実装から読まず、ここに独立に書く ----
// [key, 表示, 示唆, 保証設定（カード1行目の段）, 否定される設定]
const IINE=[['i222','222','設定2以上濃厚',2,[1]],['i333','333','設定3以上濃厚',3,[1,2]],['i246','246','設定2・4・6濃厚',2,[1,3,5]],
  ['i123','123','設定4以上濃厚',4,[1,2,3]],['i444','444','設定4以上濃厚',4,[1,2,3]],['i456','456','設定4以上濃厚',4,[1,2,3]],
  ['i555','555','設定5以上濃厚',5,[1,2,3,4]],['i803','803','設定5以上濃厚',5,[1,2,3,4]],['i666','666','設定6濃厚',6,[1,2,3,4,5]]];
const ROLE=[['rb','リプレイ・ベル','設1:25.0%⇔設6:43.4%',[.250,.270,.324,.352,.402,.434]],
  ['wm','弱チェリー・スイカ','設1:40.6%⇔設6:59.4%',[.406,.438,.492,.531,.570,.594]],
  ['ch','チャンス目','設1〜3:75.0%⇔設4〜6:79.7%',[.750,.750,.750,.797,.797,.797]]];
const EIKO=[['0.4','12.1','25.0','40.0'],['0.4','12.5','25.0','40.0'],['0.8','12.9','25.0','40.0'],['1.2','13.3','33.6','50.0'],['1.6','13.7','33.6','50.0'],['2.0','14.5','37.5','55.0']];
const CYCLE=['17.2','16.6','15.9','15.1','14.2','13.3'];
const IINE_HINT='渋谷決戦ボーナス中に表示されるイイネポイントの下3桁を記録します。獲得枚数の『○○○ OVER』とは別の表示なので、両方出たら両方記録します。出典の『設定示唆が出ると勝利も濃厚!?』は暫定表記のため扱いません。';
const ROLE_HINT='士気高揚ゾーン中に小役が揃ったとき、ボーナスに当選したら当選、しなければハズレで記録します。役ごとに分けて押してください。既存の『突入／なし』（109G／209G）とは別の記録で、母数は読み替えません。';
const STECHEN_HINT='CZ天井までの平均周期回数は設定1 17.2回⇔設定6 13.3回（設定2 16.6／3 15.9／4 15.1／5 14.2）。平均のみ公表で分布は未公表のため、推定には使いません。';

// 示唆タブ：イイネ9行は獲得枚数の直後、ED中の1枚絵の前。全行が確定演出（hot）、割合なし
const rows=[],shisa=c.pages(ctx(state(),rows),()=> '')[2]();
assert.deepEqual(rows.filter(r=>r.key.startsWith('iine.')).map(r=>[r.key.slice(5),r.label,r.sub,r.hot,r.pct]),IINE.map(x=>[x[0],x[1],x[2],true,false]));
assert.deepEqual(rows.map(r=>r.key.split('.')[0]),[...Array(12).fill('stEnd'),...Array(5).fill('bonusOver'),...Array(9).fill('iine'),...Array(9).fill('edPic')]);
assert.ok(shisa.includes('<div class="sec-h">イイネ下3桁<span class="sub">計0回</span></div>'));
assert.ok(shisa.includes(`<div class="hint" data-fold="no">${IINE_HINT}</div>`));
// 生データの5つ目（否定設定）は 246 だけ
const rawIine=vm.runInNewContext(source.match(/const IINE=\[[\s\S]*?\];/)[0]+'IINE');
assert.deepEqual(clone(rawIine.map(r=>r.slice(0,3))),IINE.map(x=>x.slice(0,3)));
assert.deepEqual(clone(rawIine.filter(r=>r[4]).map(r=>[r[0],r[3],r[4]])),[['i246',0,[1,3,5]]]);
// 通常時タブ：士気高揚ゾーンの 109G／209G 行の下に3行（当選／ハズレ）。説明は spec どおり
const normal=c.pages(ctx(state()),()=> '')[1]();
const shikiSec=normal.split('<div class="sec-h">士気高揚ゾーン</div>')[1].split('</section>')[0];
const order=['109G','209G以降',...ROLE.map(r=>r[1])].map(t=>shikiSec.indexOf('<b>'+t+'</b>'));
assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])),JSON.stringify(order));
for(const [k,name,sub] of ROLE){
  assert.ok(shikiSec.includes(`<b>${name}</b><small class="mn">${sub}</small>`),name);
  assert.ok(shikiSec.includes(`data-bump-many="shikiRole.${k}D,shikiRole.${k}N" data-label="士気 ${name} 当選"`),name+' win');
  assert.ok(shikiSec.includes(`data-bump="shikiRole.${k}D" data-label="士気 ${name} ハズレ"`),name+' miss');
}
assert.ok(shikiSec.includes(`<div class="hint" data-fold="no">${ROLE_HINT}</div>`));
assert.ok(normal.includes(`<div class="hint" data-fold="no">${STECHEN_HINT}</div>`));
assert.ok(!normal.includes('設定差は公表されていません'));
const rawRole=vm.runInNewContext(source.match(/const SHIKI_ROLE=\[[\s\S]*?\];/)[0]+'SHIKI_ROLE');
assert.deepEqual(clone(rawRole.map(r=>[r[0],r[1],r[2],[1,2,3,4,5,6].map(s=>r[3][s])])),ROLE);
// 入力・カードタブは本件直前と同じ（入力タブには行を足していない）
assert.equal(c.pages(ctx(state()),()=> '')[0](),old.pages(ctx(clone(old.defaults)),()=> '')[0]());
// ガイド：表と文言
const guide=read('paripi-guide.html');
for(const [,label,hint] of IINE)assert.ok(guide.includes(`<tr><td>${label}</td><td>${hint}</td></tr>`),label);
for(let s=0;s<6;s++){
  assert.ok(guide.includes(`<tr><td>設定${s+1}</td>${ROLE.map(r=>`<td>${(r[3][s]*100).toFixed(1)}%</td>`).join('')}</tr>`),'士気 設定'+(s+1));
  assert.ok(guide.includes(`<tr><td>設定${s+1}</td>${EIKO[s].map(v=>`<td>${v}%</td>`).join('')}</tr>`),'英子 設定'+(s+1));
}
assert.ok(guide.includes(STECHEN_HINT));
assert.ok(guide.includes('石兵八陣・三歌の礼の成功率は公表されていません。'));
assert.ok(!guide.includes('CZ別の成功率'));
assert.ok(!guide.includes('設定差は公表されていません。</p>\n    <h3>士気高揚ゾーン</h3>'));
// 「勝利も濃厚!?」は暫定表記のまま（扱わない）。確定に強めた表記を作らない
for(const text of [guide,shisa])assert.doesNotMatch(text,/勝利(?:も)?(?:確定|濃厚(?!!\?))/);
assert.ok(guide.includes('「設定示唆が出ると勝利も濃厚!?」は暫定表記のため扱いません。'));
assert.ok(guide.includes('2026年10月26日に取得'));
console.log('PASS 1: 出典照合 イイネ9・士気小役3×6設定・英子4×6・平均周期6、画面の行と説明・ガイドの表、入力タブ不変');

// ---- 2. 確定演出：イイネ9行の段（246 は設定2相当）と件数、群の順 ST→枚数→イイネ→ED ----
const label=x=>'イイネ'+x[1]+' '+x[2];
for(let mask=0;mask<1<<9;mask++){
  const S=state();let total=0,best=-1;
  IINE.forEach((x,i)=>{if(mask>>i&1){S.iine[x[0]]=1+(i%2);total+=1+(i%2);if(best<0||x[3]>IINE[best][3])best=i;}});
  const b=c.card.bottom({S});
  assert.equal(b.columns[0].items[0].text,best<0?'確定演出 なし':`確定 ${label(IINE[best])} ×${1+(best%2)}`,'mask '+mask);
  assert.equal(b.columns[0].items[0].value,total);
  assert.equal(b.columns[1].items[2].value,0);  // 右列の「濃厚」は ST終了画面だけ
  assert.deepEqual(clone(b.columns.map(col=>col.items.length)),[5,3]);
}
// 246 の奇数否定：設定2相当の段なので、設定2以上濃厚の各演出と同段（群の順で決まる）・設定3以上には負ける
const groups=[['stEnd','s2','設定2以上濃厚'],['bonusOver','o222','222 OVER 設定2以上濃厚'],['edPic','s2','ED1枚絵 設定2以上濃厚']];
for(const [g,k,text] of groups){
  const S=state();S.iine.i246=1;S[g][k]=1;
  const want=g==='edPic'?label(IINE[2]):text;
  assert.equal(c.card.bottom({S}).columns[0].items[0].text,`確定 ${want} ×1`,g);
  assert.equal(c.card.bottom({S}).columns[0].items[0].value,2);
}
{const S=state();S.iine.i246=3;S.stEnd.s3=1;assert.equal(c.card.bottom({S}).columns[0].items[0].text,'確定 設定3以上濃厚 ×1');}
{const S=state();S.iine.i246=1;S.iine.i333=1;assert.equal(c.card.bottom({S}).columns[0].items[0].text,'確定 イイネ333 設定3以上濃厚 ×1');}
// 同じ段なら 枚数→イイネ→ED（例：803 OVER と イイネ803 と ED 設定5）
{const S=state();S.iine.i803=1;S.edPic.s5=1;assert.equal(c.card.bottom({S}).columns[0].items[0].text,'確定 イイネ803 設定5以上濃厚 ×1');
 S.bonusOver.o803=1;assert.equal(c.card.bottom({S}).columns[0].items[0].text,'確定 803 OVER 設定5以上濃厚 ×1');assert.equal(c.card.bottom({S}).columns[0].items[0].value,3);}
// 期待度UP・デフォルトの ST終了画面（符号が文字列）は段を持たないまま
{const S=state();for(const k of ['kanban','blue','yellow','even1','even2','high1','high2'])S.stEnd[k]=1;assert.equal(c.card.bottom({S}).columns[0].items[0].text,'確定演出 なし');}
// イイネが0なら、旧データ相当の全確定演出の組み合わせで本件直前と同じ（15項目×32768）
const OLD_CERT=[...['s2','s3','s4','s5','s6'].map(k=>['stEnd',k]),...['o222','o456','o555','o803','o666'].map(k=>['bonusOver',k]),...['s2','s3','s4','s5','s6'].map(k=>['edPic',k])];
for(let mask=0;mask<1<<15;mask++){
  const S=state();OLD_CERT.forEach(([g,k],i)=>{if(mask>>i&1)S[g][k]=1+(i%3);});
  assert.equal(JSON.stringify(c.card.bottom({S})),JSON.stringify(old.card.bottom({S:old.normalizeState(clone(S))})),'old mask '+mask);
}
// 詳細カード：イイネ下3桁は獲得枚数の直後。士気小役は「通常時」に d>0 のときだけ出る
const S4=state();S4.iine.i246=2;S4.iine.i666=1;S4.shikiRole.wmN=1;S4.shikiRole.wmD=3;
const det=c.card.detail({S:S4});
assert.deepEqual(clone(det.map(s=>s.title)),['初当り','ST終了画面','ボーナス獲得枚数','イイネ下3桁','ED中の1枚絵','通常時']);
assert.deepEqual(clone(det[3].items),IINE.map(x=>({label:x[1]+' '+x[2],value:{i246:2,i666:1}[x[0]]||0,hot:true})));
assert.ok(!det[3].percent);
const normalDet=clone(det[5].items).filter(r=>r.label.startsWith('士気 '));
assert.deepEqual(normalDet,ROLE.map(([k,name])=>({label:'士気 '+name,value:k==='wm'?1:0,text:'士気 '+name+' '+(k==='wm'?'1/3':'0/0'),show:k==='wm',hot:false})));
console.log('PASS 2: イイネ9項目×512通り（246は設定2相当・奇数否定）、他群との同段の順、イイネ0なら15項目×32768通りが本件直前と一致、詳細カード');

// ---- 3. 保存互換：旧データ（10/14 版・10/5 版）の0補完、増減、冪等 ----
const v1014={games:1500,counts:{cz:2,bonus:3},stEnd:{kanban:2,s4:1},bonusOver:{o456:1},edPic:{s3:1},stechen:{n:1,d:4},shiki:{n109:1,d109:2,n209:0,d209:3},czType:{sanka:1},future:{keep:true}};
const v1005={games:900,counts:{cz:1,bonus:1},stEnd:{blue:1}};
for(const legacy of [v1014,v1005,{}]){
  const norm=c.normalizeState(clone(legacy));
  assert.deepEqual(clone(norm.iine),Object.fromEntries(IINE.map(x=>[x[0],0])));
  assert.deepEqual(clone(norm.shikiRole),{rbN:0,rbD:0,wmN:0,wmD:0,chN:0,chD:0});
  assert.deepEqual(clone(c.normalizeState(clone(norm))),clone(norm));
  // 既存キーは本件直前の正規化と同じ
  const was=old.normalizeState(clone(legacy));
  for(const k of Object.keys(was))assert.deepEqual(clone(norm[k]),clone(was[k]),k);
  // テンプレは本件直前の出力に2見出し（全0・イイネ「なし」）を足しただけ
  const before=old.template(ctx(was)).split('\n'),after=c.template(ctx(norm)).split('\n');
  let j=0;const added=[];for(const line of after){if(j<before.length&&line===before[j])j++;else added.push(line);}
  assert.equal(j,before.length);
  assert.deepEqual(added,['■士気高揚 小役別','ﾘﾌﾟ/ﾍﾞﾙ'+P+' 0/0','弱ﾁｪ/ｽｲｶ'+P+' 0/0','ﾁｬﾝｽ目'+P+' 0/0','','■ｲｲﾈ下3桁','なし','']);
}
assert.deepEqual(clone(c.mergeKeys),['counts','stEnd','stechen','shiki','rare','czType','bonusOver','edPic','iine','shikiRole']);
// shikiRole の n≦d・負数・小数・文字列・非有限、iine の負数・文字列・未知キー
for(const [k] of ROLE){
  const S=state();S.shikiRole[k+'N']=9;S.shikiRole[k+'D']=2;const out=c.normalizeState(S);
  assert.deepEqual([out.shikiRole[k+'N'],out.shikiRole[k+'D']],[2,2]);
  for(const [a,b,en,ed] of [[-1,-2,0,0],[3.9,5.9,3,5],['7','4',4,4],[Infinity,NaN,0,0]]){
    const bad=state();bad.shikiRole[k+'N']=a;bad.shikiRole[k+'D']=b;c.normalizeState(bad);
    assert.deepEqual([bad.shikiRole[k+'N'],bad.shikiRole[k+'D']],[en,ed],k+' '+a+'/'+b);
  }
}
const bad=c.normalizeState({iine:{i666:-1,i222:'2',future:5}});
assert.deepEqual([bad.iine.i666,bad.iine.i222,bad.iine.future],[0,2,5]);
// 未知キーはテンプレ・カードに出ない
{const S=state();S.iine.future=9;S.shikiRole.futureN=1;S.shikiRole.futureD=1;
 assert.equal(c.template(ctx(S)),c.template(ctx(state())));
 for(const key of ['bottom','detail'])assert.deepEqual(clone(c.card[key]({S})),clone(c.card[key]({S:state()})));}
console.log('PASS 3: 旧データ3種で新キー0補完・既存キーは本件直前と同じ・冪等・テンプレは2見出しの追加だけ、n≦d と不正値の正規化');

// ---- 4. テンプレ v03：正本・v02 からの差分が追加行のみ・新項目は1行ずつ動く・冪等 ----
const v02=read('docs/specs/paripi-nana-template-v02.txt'),v03=read('docs/specs/paripi-nana-template-v03.txt');
const blank=new RegExp(P+' *(?=\\n|$)','g');
assert.ok(!v03.includes('\r'));
assert.equal(vm.runInNewContext(source.match(/const TEMPLATE=.*;/)[0]+'TEMPLATE'),v03);
{const a=v02.split('\n'),b=v03.split('\n');let j=0;const added=[];for(const line of b){if(j<a.length&&line===a[j])j++;else added.push(line);}
 assert.equal(j,a.length,'v02 の全行が順序どおり残る');
 assert.deepEqual(added,['■士気高揚 小役別','ﾘﾌﾟ/ﾍﾞﾙ'+P+' 0/0','弱ﾁｪ/ｽｲｶ'+P+' 0/0','ﾁｬﾝｽ目'+P+' 0/0','','■ｲｲﾈ下3桁','なし','']);
 // 挿入位置：士気小役は ■士気高揚ゾーン の直後、イイネは ■ﾎﾞｰﾅｽ獲得枚数 の直後
 assert.ok(v03.includes('209g以降'+P+' 0/0\n\n■士気高揚 小役別\n'));assert.ok(v03.includes('666 OVER'+P+' \n\n■ｲｲﾈ下3桁\nなし\n\n■ED中の1枚絵'));}
const body=S=>c.template(ctx(S)).split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0];
assert.deepEqual(Buffer.from(body(state())),Buffer.from(v03.replace(blank,P+' 0回')));
const zeroLines=body(state()).split('\n');
// 士気小役：当選・ハズレで対象の1行だけが n/d になる
ROLE.forEach(([k],i)=>{
  const S=state();S.shikiRole[k+'N']=2;S.shikiRole[k+'D']=5;
  const out=body(S).split('\n'),changed=out.flatMap((l,j)=>l!==zeroLines[j]?[j]:[]);
  assert.deepEqual(changed,[zeroLines.indexOf('■士気高揚 小役別')+1+i],k);
  assert.ok(out[changed[0]].endsWith(P+' 2/5'));
});
// イイネ：出た行だけ、表の順で「下3桁▶︎ n回」。他の行は動かない
for(let mask=1;mask<1<<9;mask++){
  const S=state(),want=[];
  IINE.forEach((x,i)=>{if(mask>>i&1){S.iine[x[0]]=i+1;want.push(x[1]+P+' '+(i+1)+'回');}});
  const out=body(S);
  assert.equal(out,body(state()).replace('■ｲｲﾈ下3桁\nなし','■ｲｲﾈ下3桁\n'+want.join('\n')),'mask '+mask);
  assert.equal(c.template(ctx(S)),c.template(ctx(clone(S))));                     // 冪等
  assert.equal(c.template(ctx(c.normalizeState(clone(S)))),c.template(ctx(S)));   // 正規化しても同じ
}
assert.ok(!source.includes('(?<=')&&!source.includes('(?<!'));
// 仕様書に v02→v03 の差分を明記
const spec=read('docs/specs/paripi-nana-template-v03.md');
assert.ok(spec.includes('■士気高揚 小役別')&&spec.includes('■ｲｲﾈ下3桁')&&spec.includes('v02'));
console.log('PASS 4: テンプレ v03 = v02 + 8行（位置固定）、全0出力のバイト一致、士気小役3行は各1行だけ、イイネ511通りは出た行だけ・冪等、後読みなし');

// ---- 5. 公開まわり：?v=・NEW欄 ----
const checkerHtml=read(PAGE.slice(1));
assert.ok(checkerHtml.includes(DATA+'?v=20261026'));
if(PAGE==='/paripi-checker.html'){
  const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
  assert.equal((news.match(/<p>/g)||[]).length,8);
  assert.ok(news.includes('｜<a href="paripi-checker.html">パリピ孔明 イイネ下3桁の示唆・士気高揚ゾーン小役別ボーナス率を追加</a></p>'));
}
console.log('PASS 5: ?v=20261026・NEW欄8行');

// ---- 6. ブラウザ：加算・減算・取消・再読込・旧データ・3幅・カードPNG ----
const artifacts=process.env.CHECKER_ARTIFACTS||fs.mkdtempSync(path.join(os.tmpdir(),'slot-paripi-1026-'));
fs.mkdirSync(artifacts,{recursive:true});
const chrome=process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe';
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'slot-paripi-1026-profile-'));
const errors=[];const measures=[];
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0]);
  if(url==='/favicon.ico'){res.writeHead(204);return res.end();}
  if(url==='/harness'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end('<!doctype html><html><body style="margin:0"><iframe id="frame" style="border:0;width:390px;height:740px"></iframe></body></html>');}
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
const feed=()=>frame('return d.getElementById("feed").textContent;');
async function tab(i){await click(`#nav [data-p="${i}"]`);await pause(60);}
async function load(width=390,height=740){
  await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.style.height='${height}px';f.src=${JSON.stringify(origin)}+${JSON.stringify(PAGE)};})`);
  for(let i=0;i<100;i++){if(await frame(`return !!(d.querySelector("#main .sec")&&w.CheckerConfigs?.[${JSON.stringify(CFG)}]);`).catch(()=>false))break;await pause(40);}
  assert.equal(await frame('return w.innerWidth;'),width);
}
async function seed(obj,width){await evaluate(`localStorage.setItem(${JSON.stringify(KEY)},${JSON.stringify(JSON.stringify(obj))});`);await load(width);}
async function clear(width=390){await evaluate(`localStorage.removeItem(${JSON.stringify(KEY)});`);await load(width);}
const overflow=()=>frame(`const m=d.getElementById('main');const W=w.innerWidth;
  const bad=[...m.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>W+0.5||r.left<-0.5)&&!e.closest('details:not([open])')&&!(e.parentElement&&e.parentElement.closest('.jump-nav'));}).map(e=>(e.className||e.tagName)+":"+(e.textContent||"").trim().slice(0,12));
  return {scroll:m.scrollWidth-m.clientWidth,bad:bad.slice(0,5),count:bad.length,height:m.scrollHeight};`);
async function shot(name,width,height=740){
  const s=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height,scale:1}});
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(s.data,'base64'));
}
async function savePng(id,name){
  const url=await frame(`return d.getElementById(${JSON.stringify(id)}).toDataURL('image/png');`);
  fs.writeFileSync(path.join(artifacts,name+'.png'),Buffer.from(url.split(',')[1],'base64'));
}

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
  // カードの文字の右端を測るため fillText を記録する
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.__errors=[];window.__texts=[];window.confirm=()=>true;window.alert=()=>{};window.prompt=()=>null;window.addEventListener('error',e=>window.__errors.push(e.message));
    const ft=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,x,y,max){const wd=this.measureText(String(t)).width;window.__texts.push({canvas:this.canvas.id,text:String(t),x,y,align:this.textAlign,width:max!==undefined?Math.min(wd,max):wd});return ft.apply(this,arguments);};`});
  await send('Page.navigate',{url:origin+'/harness'});await pause(100);

  // 6a. イイネ9行：加算・取消・減算（0止まり）・再読込
  await clear();await tab(2);
  for(const [k] of IINE){
    const key='iine.'+k;
    await plus(key);await plus(key);let S=await getState();assert.equal(S.iine[k],2,key);
    assert.ok((await feed()).includes('＋1'));
    await click('#undoBtn');S=await getState();assert.equal(S.iine[k],1,key+' undo');
    await click('#modeBtn');await plus(key);await plus(key);await click('#modeBtn');
    S=await getState();assert.equal(S.iine[k],0,key+' minus floor 0');
    await plus(key);
  }
  // 6b. 士気小役3行：当選／ハズレ・取消・減算（n=d のときハズレの減算は不可）
  await tab(1);
  for(const [k,name] of ROLE){
    const win=`[data-bump-many="shikiRole.${k}D,shikiRole.${k}N"]`,miss=`[data-bump="shikiRole.${k}D"]`;
    await click(win);let S=await getState();assert.deepEqual([S.shikiRole[k+'N'],S.shikiRole[k+'D']],[1,1]);
    assert.ok((await feed()).includes(name));
    await click(miss);await click(miss);S=await getState();assert.deepEqual([S.shikiRole[k+'N'],S.shikiRole[k+'D']],[1,3]);
    await click('#undoBtn');S=await getState();assert.deepEqual([S.shikiRole[k+'N'],S.shikiRole[k+'D']],[1,2]);
    await click('#modeBtn');await click(miss);S=await getState();assert.deepEqual([S.shikiRole[k+'N'],S.shikiRole[k+'D']],[1,1]);
    assert.equal(await frame(`return d.querySelector(${JSON.stringify(win)}).nextElementSibling.disabled;`),true);
    await click(win);S=await getState();assert.deepEqual([S.shikiRole[k+'N'],S.shikiRole[k+'D']],[0,0]);
    await click('#modeBtn');await click(win);await click(miss);
    // 既存の 109G／209G は動かない
    S=await getState();assert.deepEqual(S.shiki,{n109:0,d109:0,n209:0,d209:0});
  }
  await load();let S=await getState();
  for(const [k] of IINE)assert.equal(S.iine[k],1,k+' reload');
  for(const [k] of ROLE)assert.deepEqual([S.shikiRole[k+'N'],S.shikiRole[k+'D']],[1,2],k+' reload');
  await tab(2);
  assert.equal(await frame('return [...d.querySelectorAll(".sec-h")].map(e=>e.textContent).join("|");'),'ST終了画面計0回|ボーナス獲得枚数計0回|イイネ下3桁計9回|ED中の1枚絵計0回');
  await tab(3);await pause(80);
  const tpl=await frame('return d.getElementById("tpl").value;');
  assert.ok(tpl.includes('■士気高揚 小役別\nﾘﾌﾟ/ﾍﾞﾙ'+P+' 1/2\n弱ﾁｪ/ｽｲｶ'+P+' 1/2\nﾁｬﾝｽ目'+P+' 1/2\n'));
  assert.ok(tpl.includes('■ｲｲﾈ下3桁\n'+IINE.map(x=>x[1]+P+' 1回').join('\n')+'\n\n■ED中の1枚絵'));
  const bottom=await frame(`const c=w.CheckerConfigs[${JSON.stringify(CFG)}];return c.card.bottom({S:JSON.parse(w.localStorage.getItem(${JSON.stringify(KEY)}))}).columns[0].items[0];`);
  assert.deepEqual(bottom,{text:'確定 イイネ666 設定6濃厚 ×1',value:9,active:true,color:'#ffc94d'});
  console.log('PASS 6a/6b: イイネ9行と士気小役3行の 加算・取消・減算・再読込、109G/209G 不変、見出し合計・テンプレ・カード1行目');

  // 6c. 旧データ（10/14 版の保存）の実読み込み
  await seed(v1014,390);await tab(2);
  assert.equal(await frame('return d.querySelectorAll("[data-c^=\\"iine.\\"]").length;'),9);
  await plus('iine.i246');S=await getState();
  assert.deepEqual(S.iine,Object.assign(Object.fromEntries(IINE.map(x=>[x[0],0])),{i246:1}));
  assert.deepEqual(S.shikiRole,{rbN:0,rbD:0,wmN:0,wmD:0,chN:0,chD:0});
  assert.equal(S.stEnd.kanban,2);assert.equal(S.bonusOver.o456,1);assert.equal(S.edPic.s3,1);assert.equal(S.games,1500);assert.equal(S.future.keep,true);
  assert.deepEqual(S.shiki,{n109:1,d109:2,n209:0,d209:3});
  await click('#undoBtn');S=await getState();assert.equal(S.iine.i246,0);assert.equal(S.stEnd.s4,1);
  console.log('PASS 6c: 10/14 版の保存を実読み込みして新9行が出る、操作後の保存に新キーが0で入る、既存値・未知キー保持、取消で戻る');

  // 6d. 3幅：はみ出し0・タップ44px以上・スクリーンショット・カードPNG
  const full={games:12345,counts:{cz:99,bonus:999},czType:{sanka:999,eiko:999,sekihei:999},
    stEnd:{kanban:999,s6:999},bonusOver:{o803:999},iine:Object.fromEntries(IINE.map(x=>[x[0],999])),edPic:{s5:999},
    shiki:{n109:99,d109:999,n209:99,d209:999},shikiRole:{rbN:999,rbD:999,wmN:999,wmD:999,chN:999,chD:999},stechen:{n:99,d:999}};
  for(const width of [360,390,412]){
    for(const [label,data] of [['empty',{}],['full',full]]){
      await seed(data,width);
      const m={width,label};
      for(const p of [1,2]){
        await tab(p);await pause(50);const ov=await overflow();m['tab'+p]=ov.height;
        assert.equal(ov.scroll,0,`横スクロール0 ${width} ${label} tab${p}`);assert.equal(ov.count,0,'はみ出し0 '+JSON.stringify(ov));
        if(p===1){
          const rowsInfo=await frame(`return [...d.querySelectorAll('.cycle-row')].filter(r=>r.querySelector('[data-bump-many^="shikiRole."]')).map(r=>({name:r.querySelector('b').textContent,sub:(()=>{const x=r.querySelector('small');const g=d.createRange();g.selectNodeContents(x);return g.getClientRects().length;})(),buttons:[...r.querySelectorAll('button')].map(b=>{const q=b.getBoundingClientRect();return [Math.round(q.width),Math.round(q.height)];})}));`);
          assert.equal(rowsInfo.length,3);
          assert.ok(rowsInfo.every(r=>r.buttons.length===2&&r.buttons.every(([bw,bh])=>bw>=44&&bh>=44)),'44px '+JSON.stringify(rowsInfo));
          m.roleSubLines=rowsInfo.map(r=>r.sub);
          await frame('d.querySelector(\'[data-bump-many^="shikiRole."]\').closest(".cycle-row").scrollIntoView({block:"center"});');await pause(50);
          await shot(`normal-shikiRole-${width}-${label}`,width);
        }else{
          const taps=await frame(`return [...d.querySelectorAll('[data-c^="iine."]')].map(e=>{const r=e.getBoundingClientRect(),b=e.querySelector('.plus').getBoundingClientRect();return [Math.round(r.height),Math.round(b.width),Math.round(b.height)];});`);
          assert.equal(taps.length,9);assert.ok(taps.every(t=>t.every(v=>v>=44)),'44px以上 '+JSON.stringify(taps));
          const lines=await frame(`return [...d.querySelectorAll('[data-c^="iine."]')].map(e=>[...e.querySelectorAll('.lbl .nm,.lbl .mn')].map(x=>{const r=d.createRange();r.selectNodeContents(x);return x.textContent+':'+r.getClientRects().length;})).flat();`);
          assert.ok(lines.every(l=>l.endsWith(':1')),'名前・サブは1行 '+JSON.stringify(lines));
          await frame('d.querySelector(\'[data-c^="iine."]\').scrollIntoView({block:"start"});');await pause(50);
          await shot(`shisa-iine-${width}-${label}`,width);
        }
      }
      if(label==='full'){
        await frame('w.__texts=[];');await tab(3);await pause(150);
        await click('#detailBtn');await pause(200);
        const texts=await frame('return w.__texts;');
        const first=texts.filter(t=>t.canvas==='cardCanvas'&&t.text.startsWith('確定 '));
        assert.ok(first.length>0,'カード1行目が描かれる');
        // 左列（x=70）は右列（x=560）に掛からない
        assert.ok(first.every(t=>t.x+t.width<=560),'カード1行目の幅 '+JSON.stringify(first));
        const detailIine=texts.filter(t=>t.canvas==='detailCanvas'&&/^(?:222|333|246|123|444|456|555|803|666) 設定/.test(t.text));
        m.detailIine=detailIine.length;m.cardFirst=first.map(t=>t.text);
        await savePng('cardCanvas',`card-${width}`);await savePng('detailCanvas',`card-detail-${width}`);
        await shot(`card-tab-${width}`,width);
      }
      measures.push(m);console.log('MEASURE '+JSON.stringify(m));
    }
  }
  // カード1行目で最も長いイイネの表記（246・×999）も左列に収まる
  await seed({iine:{i246:999}},390);await frame('w.__texts=[];');await tab(3);await pause(150);
  const longest=(await frame('return w.__texts;')).filter(t=>t.canvas==='cardCanvas'&&t.text.startsWith('確定 '));
  assert.ok(longest.length>0&&longest.every(t=>t.text==='確定 イイネ246 設定2・4・6濃厚 ×999'&&t.x+t.width<=560),JSON.stringify(longest));
  await savePng('cardCanvas','card-iine246-390');
  console.log('MEASURE '+JSON.stringify({longestRight:Math.max(...longest.map(t=>Math.round(t.x+t.width)))}));
  for(const width of [360,390,412]){
    await evaluate(`new Promise(resolve=>{const f=document.getElementById('frame');f.onload=()=>resolve(true);f.style.width='${width}px';f.src=${JSON.stringify(origin+'/paripi-guide.html')};})`);
    const g=await frame('return {W:w.innerWidth,scroll:d.documentElement.scrollWidth-d.documentElement.clientWidth};');
    assert.equal(g.W,width);assert.equal(g.scroll,0,'ガイドの横スクロール0');
  }
  assert.deepEqual(await frame('return w.__errors;'),[]);
  assert.deepEqual(errors,[]);
  console.log(`PASS 6d: 360/390/412px × 空/満杯で通常時・示唆タブのはみ出し0、新行のタップ44px以上、カード1行目の幅、ガイド3幅、PNG保存 (${PAGE})`);
}catch(e){console.error(e.stack);process.exitCode=1;}
finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({measures,errors},null,2));
  console.log('Artifacts: '+artifacts);
  ws?.close();browser?.kill();server.close();
}

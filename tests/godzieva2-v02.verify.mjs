// node tests/godzieva2-v02.verify.mjs — 正本と独立した項目順による検査。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),clone=x=>JSON.parse(JSON.stringify(x));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
function config(src,key){const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs[key];}
const c=config(read('checker-data/godzieva2.js'),'godzieva2');
// 基点は反映前の main（2dc06d3）。origin/main は進むので比較に使わない。
const BASE='2dc06d3';
const production=config(git('show',BASE+':checker-data/godzieva2.js'),'godzieva2');
const fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=S=>({S,mode:1,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',pct:(v,d)=>`${v}/${d}`,crow:(key,label,sub,hot)=>`<div data-c="${key}" data-hot="${!!hot}">${label} ${sub}</div>`});
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const roles=['henyaku','zoushoku','bunretsu','boost','kasseika','gesshoku','gRensa','shouri','kakutei'];
const labels=['小役変異','増殖変異','画面分裂','ブースト','活性化','月蝕変異','Ｇ連鎖','勝利変異','確定変異'];
const bonus=[['cbNormal',true],['cbHigh',true],['cbSuper',true],['blueNormal',true],['blueHigh',true],['blueSuper',false],['redNormal',true],['redHigh',true],['redSuper',false],['rainbowNormal',false],['rainbowHigh',false],['rainbowSuper',false]];
const end=['shinji','rei','mari','asuka','mothra','xrei','reiBg','godzillaShogoki','allStars','kaworu'],voice=['shinji','misato','mari','asuka','rei','kaji','gendo','kaworu']; // 11/6 追加解析（v04）：EDボイスは原典順の8種
const entries=[...roles.map(k=>['gRole',k,false]),...bonus.map(([k,r])=>['bonusRate',k,r]),...['normal','at'].map(k=>['suika',k,true]),...[100,250,400,550,700,850].flatMap(g=>['after','other'].map(p=>['kitei',p+g,true])),...end.map(k=>['endScreen',k,false]),...voice.map(k=>['edVoice',k,false])];
const raw=read('docs/specs/godzieva2-nana-template-v02.txt');
// 行ごとに承認差分を適用。実装のTEMPLATEや定義は参照しない。
let group='';let approved=raw.split('\n').map(line=>{
  if(line.startsWith('🍒🔔'))group='cb';if(line.startsWith('🌈'))group='rainbow';
  if(line.startsWith('🟦')||line.startsWith('🟥')||line.startsWith('■'))group='';
  if(line.startsWith('150g'))line=line.replaceAll('150g','100g');
  if(group==='cb')line=line.replace('超高▶︎ 0回','超高▶︎ 0/0');
  if(group==='rainbow')line=line.replace('通常▶︎ 0/0','通常▶︎ 0回').replace('高確▶︎ 0/0','高確▶︎ 0回');
  return line;
}).join('\n');
// v04 の承認差分（夢爽判断・なな様へ事後報告）：■エンディング中ボイス を8行に。それ以外は原文のまま。
const ED5='■エンディング中ボイス\nシンジ▶︎ \nアスカ▶︎ \nミサト▶︎ \nゲンドウ▶︎ \nカヲル▶︎',ED8='■エンディング中ボイス\nシンジ▶︎ \nミサト▶︎ \nマリ▶︎ \nアスカ▶︎ \nレイ▶︎ \n加持▶︎ \nゲンドウ▶︎ \nカヲル▶︎';
if(!approved.endsWith(ED5))throw Error('原文のEDボイス5行が見つからない');approved=approved.slice(0,-ED5.length)+ED8;
function expected(S){
  let i=0;return approved.split('\n').map(line=>{
    line=line.replace(/0\/0|0回/g,()=>{const [g,k,r]=entries[i++];return r?`${S[g][k+'W']}/${S[g][k+'D']}`:`${S[g][k]}回`;});
    if(line.endsWith('▶︎ ')||line.endsWith('▶︎')){const [g,k]=entries[i++];line=line.replace(/▶︎ ?$/,'▶︎ '+S[g][k]+'回');}return line;
  }).join('\n');
}
const body=S=>c.template(ctx(S)).split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0];
check('正本SHA256・全0の本文完全一致',()=>{assert.equal(createHash('sha256').update(raw).digest('hex'),'a4c0b959706b5ceb1fcea2b3fa414ae5ccedb697d02c9d17d5287fabb55784ea');assert.equal(body(fresh()),expected(fresh()));});
check('全項目異なる値・ヘッダー・compact・フッター',()=>{
  const S=fresh();let i=1;for(const [g,k,r] of entries){if(r){S[g][k+'W']=i++;S[g][k+'D']=i++;}else S[g][k]=i++;}
  S.gameLog=[1000,2000];S.counts.first=12;S.counts.at=5;
  assert.equal(body(S),expected(S));const text=c.template(ctx(S));assert.equal(c.compactTemplate(ctx(S)),text);
  assert.equal(text.split('\n')[1],'累計通常G 3000G（2件） / ボーナス初当り12回 1/250.0 / AT5回 1/600.0');assert.ok(!text.includes('ボーナス▶︎'));
  assert.equal(text.split('\n\nby ')[1],production.template(ctx(production.defaults)).split('\n\nby ')[1]);
  assert.ok(!c.template(ctx(fresh())).includes('1/'));
});
for(const [g,k,r] of entries)for(const field of r?[k+'D',k+'W']:[k])check('単項目 '+g+'.'+field,()=>{
  const S=fresh(),before=body(S);S[g][field]=1; // コピーの独立性を検査するため補正前の値。
  assert.equal(body(S),expected(S));assert.equal(body(S).split('\n').filter((l,i)=>l!==before.split('\n')[i]).length,1);
  // 文字列の共通接頭・接尾を除くと置換位置は1か所、0→1のみ。
  let start=0;while(before[start]===body(S)[start])start++;
  assert.equal(before.slice(start+1),body(S).slice(start+1));assert.equal(before[start],'0');assert.equal(body(S)[start],'1');
});
for(const k of ['first','at'])check('ヘッダー単項目 counts.'+k,()=>{
  const S=fresh(),before=c.template(ctx(S));S.counts[k]=1;const after=c.template(ctx(S));
  assert.equal(body(S),expected(S));assert.equal(after.split('\n').filter((l,i)=>l!==before.split('\n')[i]).length,1);
  assert.ok(after.split('\n')[1].includes((k==='first'?'ボーナス初当り':'AT')+'1回'));
});
check('main保存互換・未知キー・冪等・新規0・schemaVersion',()=>{
  let old=clone(production.defaults);old.gameLog=[234,567];old.games=89;old.img='data:image/png;base64,future';old.iconChoice='custom';old.futureRoot={keep:[1,2]};
  for(const g of production.mergeKeys){for(const k of Object.keys(old[g]))old[g][k]=7;old[g].future={keep:true};}
  old=clone(production.normalizeState(old));
  assert.equal(c.storageKey,production.storageKey);
  // v04（11/6）：EDボイスのマリ・レイ・加持と終了画面のボイス endVoice は新規なので0で足される。既存の値はそのまま。
  const S=c.normalizeState(clone(old));for(const k of Object.keys(old))assert.deepEqual(clone(S[k]),k==='edVoice'?{...old[k],mari:0,rei:0,kaji:0}:old[k],k);
  assert.deepEqual(clone(S.endVoice),{shinji:0,asuka:0,misato:0,ritsuko:0,mari:0});
  for(const g of ['gRole','bonusRate'])assert.ok(Object.values(S[g]).every(v=>v===0));
  S.gRole.future={x:1};S.bonusRate.future=[9];assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));
  assert.equal(S.schemaVersion,1);S.schemaVersion=99;assert.equal(c.normalizeState(S).schemaVersion,99);
});
check('D/W補正・不正値・冪等',()=>{
  for(const [g,k,r] of entries)if(r){const S=fresh();S[g][k+'D']=2;S[g][k+'W']=5;c.normalizeState(S);assert.equal(S[g][k+'D'],5);assert.equal(S[g][k+'W'],5);assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));}
  for(const g of ['gRole','bonusRate'])for(const k of Object.keys(c.defaults[g]))for(const bad of [-1,null,'bad',Infinity]){const S=fresh();S[g][k]=bad;c.normalizeState(S);assert.equal(S[g][k],0);}
});
check('詳細カード・率・非表示・23全角字幅・記録のみ',()=>{
  const S=fresh();for(const [g,k,r] of entries){if(r){S[g][k+'D']=123;S[g][k+'W']=41;}else S[g][k]=29;}
  const sections=c.card.detail(ctx(S));assert.deepEqual(clone(sections.map(x=>x.title)),['カウント系','G侵食役','ボーナス当選率','スイカCZ','規定G','終了画面','終了ボイス','EDボイス']); // 終了ボイスは v04（11/6）で追加
  assert.deepEqual(clone(sections[1].items.map(x=>x.label)),labels);
  const shorts=['弱ﾁｪ/ﾍﾞﾙ3連','強ﾚｱ/ﾍﾞﾙ4他','弱ﾚｱ→強ﾚｱ','ﾘｰﾁ目/ﾍﾞﾙ5他'];
  sections[2].items.forEach((it,i)=>{assert.equal(it.text,shorts[Math.floor(i/3)]+' '+['通常','高確','超高'][i%3]+(bonus[i][1]?' 41/123 33%':' ×29'));assert.ok(it.show);});
  for(const sec of sections.slice(1,3))for(const it of sec.items){assert.equal(it.hot,false);const width=[...it.text].reduce((n,ch)=>n+(/[\x00-\x7f\uff61-\uff9f]/.test(ch)?0.5:1),0);assert.ok(width<=23,it.text);}
  for(const sec of c.card.detail(ctx(fresh())).slice(1,3))assert.ok(sec.items.every(x=>x.show===false));
  // v04（11/6）：カード上部に「確定演出 計n回」が入る（終了画面4・EDボイス4の各29回で232回）。それ以外のブロックは v02 のまま。
  const blocks=clone(production.card.blocks(ctx(S)));blocks.splice(2,0,['確定演出','計232回']);assert.deepEqual(clone(c.card.blocks(ctx(S))),blocks);
  const input=c.pages(ctx(S),()=>'')[0]();assert.equal((input.match(/bonus-group-h">/g)||[]).length,4);assert.ok(!/14\.1%|18\.7%|38\.2%|44\.9%/.test(input));assert.equal(c.pages(ctx(S),()=>'').length,4);
});
check('本番差分限定・削除・全ページ導線なし・NEW8行',()=>{
  // v03 の反映（776791a）時点の本番で見る。11/6 の v04 は tests/addl-1106b.verify.mjs が検収したテスト版との一致を見る。
  const RELEASED='776791a';
  assert.equal(git('show',RELEASED+':godzieva2-checker.html'),git('show',BASE+':godzieva2-checker.html').replace('checker-data/godzieva2.js?v=20261101-nana4','checker-data/godzieva2.js?v=20261102-nana5'));
  const tested=git('show','4a5c35a:checker-data/godzieva2-test.js');
  const released=tested.split('\n').slice(1).join('\n').replace(/^\/\/ 2026-11-01.*$/m,"// 2026-11-02 更新分を確認（第三者解析）。数値・文言の正本: docs/specs/godzieva2-checker-v03.md（テスト版 4a5c35a をネネ検収合格・夢爽スマホ確認○の後に本番へ反映）").replace('window.CheckerConfigs["godzieva2-test"]','window.CheckerConfigs.godzieva2').replace('storageKey:"godzieva2-checker-v1-test"','storageKey:"godzieva2-checker-v1"');
  assert.equal(git('show',RELEASED+':checker-data/godzieva2.js'),released);assert.equal(c.storageKey,'godzieva2-checker-v1');
  for(const p of ['checker-data/godzieva2-test.js','godzieva2-test-checker.html'])assert.ok(!fs.existsSync(path.join(root,p)));
  for(const p of fs.readdirSync(root,{recursive:true}).filter(p=>p.endsWith('.html')))assert.doesNotMatch(read(p),/(?:href|src)=["'][^"']*godzieva2-test/);
  const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
  assert.equal((news.match(/<p>/g)||[]).length,8);
  // 後の更新（11/2 Vivy）で先頭に行が足されたので、位置ではなく行があることを見る。
  /* 同日・同機種の公開の行と1行に統合（§9-92） */assert.ok(news.includes('<p>11/2｜<a href="godzieva2-checker.html">L ゴジラ対エヴァンゲリオン2 設定判別カウンターを公開（なな様テンプレ v02：G侵食役・ボーナス当選率に対応）</a></p>'));
  // 10/21 とんスキの行は 11/2 の §9-92 統合で空いた枠に戻した（夢爽 11/2）ので、消えたことは見ない。
  assert.equal(read('docs/specs/godzieva2-nana-template-v02.txt'),git('show',BASE+':docs/specs/godzieva2-nana-template-v02.txt'));
  const guide=read('godzieva2-guide.html');
  const proposals=git('show',BASE+':docs/specs/godzieva2-checker-v03.md').split('## 本番ガイドの反映案')[1].split('### ').slice(1);
  for(const proposal of proposals){const [title,...body]=proposal.split('\n');assert.ok(guide.includes('<h3>'+title+'</h3>'));assert.ok(guide.includes('<p>'+body.join('\n').trim()+'</p>'));}
  assert.ok(guide.includes('2026年11月2日確認'));assert.ok(!guide.includes('ボーナス▶︎'));
});
check('構文・LF・後読みなし',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gz2-v02-syntax-'));
  for(const p of ['checker-data/godzieva2.js','godzieva2-checker.html','docs/specs/godzieva2-checker-v03.md','tests/godzieva2-v02.verify.mjs','tests/godzieva2-v02.browser.mjs'])assert.ok(!read(p).includes('\r'),p);
  for(const p of ['checker-data/godzieva2.js','tests/godzieva2-v02.verify.mjs','tests/godzieva2-v02.browser.mjs'])execFileSync(process.execPath,['--check',path.join(root,p)]);
  assert.doesNotMatch(read('checker-data/godzieva2.js'),/\(\?<([=!])/);
  for(const [i,m] of [...read('godzieva2-checker.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
});
// §9-108-4：知らない項目は、トップレベル・グループ内とも型ごと保持する（数値に変換しない・捨てない）。知っている項目だけ非負整数に検証する。
check('未知キーをトップレベル・グループ内とも型ごと保持（§9-108-4）',()=>{
  const unknown={str:'keep',num:2.5,neg:-3,bool:false,nul:null,arr:[1,'a',{x:1}],obj:{deep:{v:'x'}}};
  const S=clone(c.defaults);
  Object.assign(S,{futureRoot:clone(unknown),futureStr:'root',futureNum:-1.5});
  for(const g of c.mergeKeys)Object.assign(S[g],clone(unknown));
  S.counts.first='4';S.gRole.henyaku=-2;S.bonusRate.cbNormalD=1.9;
  const out=c.normalizeState(clone(S));
  assert.deepEqual(clone(out.futureRoot),unknown);assert.equal(out.futureStr,'root');assert.equal(out.futureNum,-1.5);
  for(const g of c.mergeKeys)for(const [k,v] of Object.entries(unknown))assert.deepEqual(clone(out[g][k]),v,g+'.'+k);
  assert.equal(out.counts.first,4);assert.equal(out.gRole.henyaku,0);assert.equal(out.bonusRate.cbNormalD,1);
  assert.deepEqual(clone(c.normalizeState(clone(out))),clone(out),'冪等');
});
console.log(`godzieva2-v02: ${checks} passed / 0 failed`);

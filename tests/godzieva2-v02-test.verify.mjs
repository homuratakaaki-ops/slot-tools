// node tests/godzieva2-v02-test.verify.mjs — 正本と独立した項目順による検査。
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
const c=config(read('checker-data/godzieva2-test.js'),'godzieva2-test');
// 基点は反映前の main（0c6162e）。origin/main は進むので比較に使わない。
const BASE='0c6162e';
const production=config(git('show',BASE+':checker-data/godzieva2.js'),'godzieva2');
const fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=S=>({S,mode:1,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',pct:(v,d)=>`${v}/${d}`,crow:(key,label,sub,hot)=>`<div data-c="${key}" data-hot="${!!hot}">${label} ${sub}</div>`});
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const roles=['henyaku','zoushoku','bunretsu','boost','kasseika','gesshoku','gRensa','shouri','kakutei'];
const labels=['小役変異','増殖変異','画面分裂','ブースト','活性化','月蝕変異','Ｇ連鎖','勝利変異','確定変異'];
const bonus=[['cbNormal',true],['cbHigh',true],['cbSuper',true],['blueNormal',true],['blueHigh',true],['blueSuper',false],['redNormal',true],['redHigh',true],['redSuper',false],['rainbowNormal',false],['rainbowHigh',false],['rainbowSuper',false]];
const end=['shinji','rei','mari','asuka','mothra','xrei','reiBg','godzillaShogoki','allStars','kaworu'],voice=['shinji','asuka','misato','gendo','kaworu'];
const entries=[...roles.map(k=>['gRole',k,false]),...bonus.map(([k,r])=>['bonusRate',k,r]),...['normal','at'].map(k=>['suika',k,true]),...[100,250,400,550,700,850].flatMap(g=>['after','other'].map(p=>['kitei',p+g,true])),...end.map(k=>['endScreen',k,false]),...voice.map(k=>['edVoice',k,false])];
const raw=read('docs/specs/godzieva2-nana-template-v02.txt');
// 行ごとに承認差分を適用。実装のTEMPLATEや定義は参照しない。
let group='';const approved=raw.split('\n').map(line=>{
  if(line.startsWith('🍒🔔'))group='cb';if(line.startsWith('🌈'))group='rainbow';
  if(line.startsWith('🟦')||line.startsWith('🟥')||line.startsWith('■'))group='';
  if(line.startsWith('150g'))line=line.replaceAll('150g','100g');
  if(group==='cb')line=line.replace('超高▶︎ 0回','超高▶︎ 0/0');
  if(group==='rainbow')line=line.replace('通常▶︎ 0/0','通常▶︎ 0回').replace('高確▶︎ 0/0','高確▶︎ 0回');
  return line;
}).join('\n');
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
  const old=clone(production.defaults);old.gameLog=[234,567];old.games=89;old.img='data:image/png;base64,future';old.iconChoice='custom';old.futureRoot={keep:[1,2]};
  for(const g of production.mergeKeys){for(const k of Object.keys(old[g]))old[g][k]=7;old[g].future={keep:true};}
  const S=c.normalizeState(clone(old));for(const k of Object.keys(old))assert.deepEqual(clone(S[k]),old[k],k);
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
  const sections=c.card.detail(ctx(S));assert.deepEqual(clone(sections.map(x=>x.title)),['カウント系','G侵食役','ボーナス当選率','スイカCZ','規定G','終了画面','EDボイス']);
  assert.deepEqual(clone(sections[1].items.map(x=>x.label)),labels);
  const shorts=['弱ﾁｪ/ﾍﾞﾙ3連','強ﾚｱ/ﾍﾞﾙ4他','弱ﾚｱ→強ﾚｱ','ﾘｰﾁ目/ﾍﾞﾙ5他'];
  sections[2].items.forEach((it,i)=>{assert.equal(it.text,shorts[Math.floor(i/3)]+' '+['通常','高確','超高'][i%3]+(bonus[i][1]?' 41/123 33%':' ×29'));assert.ok(it.show);});
  for(const sec of sections.slice(1,3))for(const it of sec.items){assert.equal(it.hot,false);const width=[...it.text].reduce((n,ch)=>n+(/[\x00-\x7f\uff61-\uff9f]/.test(ch)?0.5:1),0);assert.ok(width<=23,it.text);}
  for(const sec of c.card.detail(ctx(fresh())).slice(1,3))assert.ok(sec.items.every(x=>x.show===false));
  assert.deepEqual(clone(c.card.blocks(ctx(S))),clone(production.card.blocks(ctx(S))));
  const input=c.pages(ctx(S),()=>'')[0]();assert.equal((input.match(/bonus-group-h">/g)||[]).length,4);assert.ok(!/14\.1%|18\.7%|38\.2%|44\.9%/.test(input));assert.equal(c.pages(ctx(S),()=>'').length,4);
});
check('HTML差分限定・本番全追跡ファイル不変・導線なし',()=>{
  let html=read('godzieva2-test-checker.html');const banner=git('show','65de568:ggo-test-checker.html').split('\n').find(l=>l.includes('テスト版です。'));
  assert.ok(html.includes(banner));assert.ok(html.includes('<meta name="robots" content="noindex,nofollow">'));
  html=html.replace('<meta name="robots" content="noindex,nofollow">\n','').replaceAll('【テスト版】','').replaceAll('https://slot-tools.jp/godzieva2-test-checker.html','https://slot-tools.jp/godzieva2-checker.html').replace(banner+'\n','').replace('checker-data/godzieva2-test.js?v=20261102-test3','checker-data/godzieva2.js?v=20261101-nana4').replace('CheckerConfigs["godzieva2-test"]','CheckerConfigs.godzieva2');assert.equal(html,read('godzieva2-checker.html'));
  assert.equal(c.storageKey,'godzieva2-checker-v1-test');
  const allowed=new Set(['checker-data/godzieva2-test.js','docs/specs/godzieva2-checker-v03.md','docs/specs/godzieva2-nana-template-v02.txt','godzieva2-test-checker.html','tests/godzieva2-v02-test.browser.mjs','tests/godzieva2-v02-test.verify.mjs','tests/magireco-remove-estimate.verify.mjs','tests/mhsunbreak-bz-groups.verify.mjs','tests/mhsunbreak-template-v02.verify.mjs','tests/new-1005-public.verify.mjs']);
  // 11/2 の Vivy なな様テンプレのテスト版（vivy を含むパス）は別作業なので対象外。
  assert.deepEqual(git('diff','--name-only',BASE,'--').trim().split('\n').filter(Boolean).filter(p=>!allowed.has(p)&&!p.includes('vivy')),[]);
  for(const p of ['godzieva2-checker.html','godzieva2-guide.html','checker-data/godzieva2.js','index.html','sitemap.xml','checker-engine.js'])assert.equal(read(p),git('show',BASE+':'+p));
  for(const p of ['index.html','checkers.html','sitemap.xml'])assert.ok(!read(p).includes('godzieva2-test'));
});
check('構文・LF・後読みなし',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gz2-v02-syntax-'));
  for(const p of ['checker-data/godzieva2-test.js','godzieva2-test-checker.html','docs/specs/godzieva2-checker-v03.md','tests/godzieva2-v02-test.verify.mjs','tests/godzieva2-v02-test.browser.mjs'])assert.ok(!read(p).includes('\r'),p);
  for(const p of ['checker-data/godzieva2-test.js','tests/godzieva2-v02-test.verify.mjs','tests/godzieva2-v02-test.browser.mjs'])execFileSync(process.execPath,['--check',path.join(root,p)]);
  assert.doesNotMatch(read('checker-data/godzieva2-test.js'),/\(\?<([=!])/);
  for(const [i,m] of [...read('godzieva2-test-checker.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
});
console.log(`godzieva2-v02-test: ${checks} passed / 0 failed`);

// node tests/vivy-nana-test.verify.mjs — 正本と独立した項目順による検査。
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
const git=(...args)=>execFileSync('git',['-c','safe.directory=*',...args],{cwd:root,encoding:'utf8'});
function config(src,key){const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs[key];}
const c=config(read('checker-data/vivy-test.js'),'vivy-test');
// 基点は反映前の main（4a5c35a）。origin/main は進むので比較に使わない。
const BASE='4a5c35a';
const production=config(git('show',BASE+':checker-data/vivy.js'),'vivy');
const fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=S=>({S,mode:1,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',pct:(v,d)=>`${v}/${d}`,crow:(key,label,sub,hot)=>`<div data-c="${key}" data-hot="${!!hot}">${label} ${sub}</div>`});
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}

const cycles=['c1','c2','c3','c4','c5','c6'],points=['p111','p222','p333','p444','p555'];
const end=['estella','beach','matsumoto','hug','gaze','bear','reach','mini','all'];
const chars=['vivy','elizabeth','estella','grace','ophelia','matsumoto'];
// 正本の各数値位置を独立して列挙。継続Dは回数と分母の2か所に現れる。
const slots=[...cycles.map(k=>[['cycle',k+'W'],['cycle',k+'D']]),...points.map(k=>[['pt',k]]),
 [['access','weakW'],['access','weakD']],[['access','weakEx']],[['access','chanceW'],['access','chanceD']],[['access','chanceEx']],
 [['cont','k1D']],[['cont','k1W'],['cont','k1D']],[['cont','k2D']],[['cont','k2W'],['cont','k2D']],
 ...end.map(k=>[['atEnd',k]]),...chars.map(k=>[['ending',k]])];
// 原文からの変更は「ﾏﾂﾓﾄ人形」→「ﾏﾂﾓﾄ変形」の1か所だけ（夢爽 11/2）。それ以外は数値の位置しか違わない。
const original=read('docs/specs/vivy-nana-template-v01.txt');
const raw=original.replace('ﾏﾂﾓﾄ人形  ▶︎ 0回','ﾏﾂﾓﾄ変形  ▶︎ 0回');
function expected(S){let i=0;return raw.split('\n').map(line=>{
 line=line.replace(/0\/0|0回/g,m=>{const fields=slots[i++];return fields.map(([g,k])=>S[g][k]).join('/')+(m==='0回'?'回':'');});
 if(/▶︎ ?$/.test(line)){const [[g,k]]=slots[i++];line=line.replace(/▶︎ ?$/,'▶︎ '+S[g][k]+'回');}return line;
}).join('\n');}
const body=S=>c.template(ctx(S)).split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0];
check('正本SHA256・全0本文完全一致',()=>{
 assert.equal(createHash('sha256').update(original).digest('hex'),'734200252f8da2c2817c46e8e688d6aab4d8d777b31033e1f3df8e1015620dc1');
 assert.equal(body(fresh()),raw.replace(/▶︎ ?(?=\n|$)/g,'▶︎ 0回'));assert.equal(body(fresh()),expected(fresh()));
});
check('全項目別値・数値以外完全一致・ヘッダー・フッター',()=>{
 const S=fresh();let i=1;for(const g of c.mergeKeys)for(const k of Object.keys(S[g]))S[g][k]=i++;
 S.gameLog=[1000,2000];S.counts.at=5;
 assert.equal(body(S),expected(S));assert.equal(body(S).replace(/[0-9]+/g,'#'),body(fresh()).replace(/[0-9]+/g,'#'));
 const text=c.template(ctx(S));assert.equal(c.compactTemplate(ctx(S)),text);assert.equal(c.nanaCollab,true);
 const strong=production.card.blocks(ctx(S)).find(x=>x[0]==='確定演出')[1].replace('計','');
 assert.equal(text.split('\n')[1],'累計通常G 3000G（2件） / AT初当り5回 1/600.0 / 確定演出'+strong);
 assert.ok(text.endsWith('by slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様'));
});
for(const g of c.mergeKeys)for(const k of Object.keys(c.defaults[g]))check('単項目 '+g+'.'+k,()=>{
 const S=fresh(),before=body(S);S[g][k]=1;const after=body(S);assert.equal(after,expected(S));
 const occurrences=slots.flat().filter(([a,b])=>a===g&&b===k).length;
 assert.equal([...before].filter((ch,i)=>ch!==[...after][i]).length,occurrences);
 assert.equal(after.length,before.length);
 if(!occurrences)assert.equal(after,before);
});
check('本番保存互換・未知キー・冪等',()=>{
 const old=clone(production.defaults);old.games=89;old.gameLog=[234,567];old.img='data:image/png;base64,future';old.iconChoice='custom';old.futureRoot={keep:[1,2]};
 for(const g of production.mergeKeys){for(const k of Object.keys(old[g]))old[g][k]=7;old[g].future=9;}
 // 本番の normalizeState はグループ内の知らない項目も非負整数にして保存する。保存済みの形（本番で正規化済み）から読み込む。
 assert.deepEqual(clone(production.normalizeState(clone(old))),clone(old),'本番が保存する形');
 const S=c.normalizeState(clone(old));for(const k of Object.keys(old))assert.deepEqual(clone(S[k]),old[k],k);
 for(const g of ['cycle','pt','pt555','access','cont']){assert.ok(Object.values(S[g]).every(v=>v===0));S[g].future=9;}
 assert.equal(S.schemaVersion,1);assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));S.schemaVersion=99;assert.equal(c.normalizeState(S).schemaVersion,99);
});
check('W>D・EX>W・不正値補正・冪等',()=>{
 for(const [g,keys] of [['cycle',cycles],['access',['weak','chance']],['cont',['k1','k2']]])for(const k of keys){
 const S=fresh();S[g][k+'D']=2;S[g][k+'W']=5;if(g==='access')S[g][k+'Ex']=9;
 c.normalizeState(S);assert.equal(S[g][k+'D'],5);assert.equal(S[g][k+'W'],5);if(g==='access')assert.equal(S[g][k+'Ex'],5);
 assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));}
 for(const g of c.mergeKeys)for(const k of Object.keys(c.defaults[g]))for(const bad of [-1,null,'bad',Infinity]){const S=fresh();S[g][k]=bad;c.normalizeState(S);assert.equal(S[g][k],0);}
});
check('詳細カード・率書式・23全角字・確定演出本番一致',()=>{
 const S=fresh();for(const g of c.mergeKeys)for(const k of Object.keys(S[g]))S[g][k]=k.endsWith('D')?123:k.endsWith('W')?41:29;
 const sections=c.card.detail(ctx(S));assert.deepEqual(clone(sections.map(x=>x.title)),['カウント系','規定周期','規定pt','前回555後pt','AC(EX)','AC継続','AT終了画面','トロフィー','枚数表示','ED中キャラ']);
 for(const sec of sections.slice(1,6))for(const it of sec.items){assert.equal(it.hot,false);assert.ok(it.show);assert.match(it.text,/( 41\/123 33%| ×29)$/);const width=[...it.text].reduce((n,ch)=>n+(/[\x00-\x7f\uff61-\uff9f]/.test(ch)?0.5:1),0);assert.ok(width<=23,it.text);}
 for(const sec of c.card.detail(ctx(fresh())).slice(1,6))assert.ok(sec.items.every(x=>x.show===false));
 assert.deepEqual(clone(c.card.blocks(ctx(S))),clone(production.card.blocks(ctx(S))));assert.deepEqual(clone(c.card.bottom(ctx(S))),clone(production.card.bottom(ctx(S))));
 assert.equal(c.pages(ctx(S),()=>'').length,4);
 const input=c.pages(ctx(S),()=>'')[0]();assert.ok(input.includes('Ａ2~6・Ｂ2.3・天国1周期'));assert.ok(input.includes('>EX昇格</button>'));assert.ok(input.includes('>昇格なし</button>'));
});
check('HTML差分限定・本番全追跡ファイル不変・導線なし',()=>{
  let html=read('vivy-test-checker.html');const banner=git('show','65de568:ggo-test-checker.html').split('\n').find(l=>l.includes('テスト版です。'));
  assert.ok(html.includes(banner));assert.ok(html.includes('<meta name="robots" content="noindex,nofollow">'));
  html=html.replace('<meta name="robots" content="noindex,nofollow">\n','').replaceAll('【テスト版】','').replaceAll('https://slot-tools.jp/vivy-test-checker.html','https://slot-tools.jp/vivy-checker.html').replace(banner+'\n','').replace('checker-data/vivy-test.js?v=20261102-nana-test','checker-data/vivy.js?v=20261102-suggest').replace('CheckerConfigs["vivy-test"]','CheckerConfigs.vivy');assert.equal(html,read('vivy-checker.html'));
  assert.equal(c.storageKey,'vivy-checker-v1-test');
  const allowed=new Set(['checker-data/vivy-test.js','vivy-test-checker.html','docs/specs/vivy-checker-v03.md','tests/vivy-nana-test.verify.mjs','tests/vivy-nana-test.browser.mjs','docs/specs/vivy-nana-template-v01.txt','tests/ggovivy-suggest.verify.mjs','tests/godzieva2-v02-test.verify.mjs']);
  assert.deepEqual(git('diff','--name-only',BASE,'--').trim().split('\n').filter(Boolean).filter(p=>!allowed.has(p)),[]);
  for(const p of ['vivy-checker.html','vivy-guide.html','checker-data/vivy.js','index.html','sitemap.xml','checker-engine.js'])assert.equal(read(p),git('show',BASE+':'+p));
  for(const p of ['index.html','checkers.html','sitemap.xml'])assert.ok(!read(p).includes('vivy-test'));
});
check('構文・LF・後読みなし',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gz2-v02-syntax-'));
  for(const p of ['checker-data/vivy-test.js','vivy-test-checker.html','docs/specs/vivy-checker-v03.md','tests/vivy-nana-test.verify.mjs','tests/vivy-nana-test.browser.mjs'])assert.ok(!read(p).includes('\r'),p);
  for(const p of ['checker-data/vivy-test.js','tests/vivy-nana-test.verify.mjs','tests/vivy-nana-test.browser.mjs'])execFileSync(process.execPath,['--check',path.join(root,p)]);
  assert.doesNotMatch(read('checker-data/vivy-test.js'),/\(\?<([=!])/);
  for(const [i,m] of [...read('vivy-test-checker.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
});
console.log(`vivy-nana-test: ${checks} passed / 0 failed`);

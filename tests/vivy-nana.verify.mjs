// node tests/vivy-nana.verify.mjs（本番反映後。旧 vivy-nana-test） — 正本と独立した項目順による検査。
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
const c=config(read('checker-data/vivy.js'),'vivy');
// 基点は反映前の main（4a5c35a）。origin/main は進むので比較に使わない。
// 基点は反映直前の main（e2e720a）。反映前の本番 js・テスト版 js・HTML をここから読む。origin/main は使わない。
const BASE='e2e720a';
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
check('W>D・EX保持・不正値補正・冪等',()=>{
 for(const [g,keys] of [['cycle',cycles],['access',['weak','chance']],['cont',['k1','k2']]])for(const k of keys){
 const S=fresh();S[g][k+'D']=2;S[g][k+'W']=5;if(g==='access')S[g][k+'Ex']=9;
 c.normalizeState(S);assert.equal(S[g][k+'D'],5);assert.equal(S[g][k+'W'],5);if(g==='access')assert.equal(S[g][k+'Ex'],9,'EXは当選回数に切り詰めない（ネネ検収 P2）');
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
check('本番 js はテスト版との差が3か所だけ・HTML は ?v だけ・テスト版削除・NEW欄・導線なし',()=>{
  const testJs=git('show',BASE+':checker-data/vivy-test.js');
  const reverted=read('checker-data/vivy.js').replace(/^\/\/ 出典: [^\n]*\n\/\/ [^\n]*\n/,'').replace('window.CheckerConfigs.vivy={','window.CheckerConfigs["vivy-test"]={').replace('storageKey:"vivy-checker-v1"','storageKey:"vivy-checker-v1-test"');
  assert.equal(reverted,testJs.replace(/^(\/\/ [^\n]*\n){3}/,''),'先頭コメント・設定名・保存キー以外はテスト版と同じ');
  assert.equal(c.storageKey,'vivy-checker-v1');assert.equal(c.nanaCollab,true);
  assert.equal(read('vivy-checker.html'),git('show',BASE+':vivy-checker.html').replace('checker-data/vivy.js?v=20261102-suggest"','checker-data/vivy.js?v=20261102-nana"'));
  for(const p of ['vivy-test-checker.html','checker-data/vivy-test.js'])assert.ok(!fs.existsSync(path.join(root,p)),p+' は削除');
  for(const p of fs.readdirSync(root).filter(p=>p.endsWith('.html')))assert.doesNotMatch(read(p),/(?:href|src)=["'][^"']*vivy-test/,p);
  const allowed=new Set(['checker-data/vivy.js','checker-data/vivy-test.js','vivy-checker.html','vivy-test-checker.html','vivy-guide.html','index.html','docs/specs/vivy-checker-v03.md']);
  assert.deepEqual(git('diff','--name-only',BASE,'--').trim().split('\n').filter(Boolean).filter(p=>!allowed.has(p)&&!p.startsWith('tests/')),[]);
  const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
  assert.equal((news.match(/<p>/g)||[]).length,8);
  const line='<p>11/2｜<a href="vivy-checker.html">Vivy 規定周期・規定ポイント・アクセスチャンスを追加（なな様テンプレ対応）</a></p>';
  assert.equal(news.match(/<p>.*<\/p>/)[0],line);
  const oldIndex=git('show',BASE+':index.html'),oldest=oldIndex.split('\n').find(l=>l.includes('<p>10/21｜')&&l.includes('mogumogu-checker.html'));
  assert.ok(oldest);
  assert.equal(read('index.html'),oldIndex.replace('NEW</div>\n  <section class="info-block">\n','NEW</div>\n  <section class="info-block">\n    '+line+'\n').replace(oldest+'\n',''));
  const guide=read('vivy-guide.html');
  for(const t of ['アクセスチャンスの継続回数は記録のみ。レア役による昇格があるため、規定回数とは一致しないことがあります。','<h3>規定周期・規定ポイント</h3>','<h3>レア役からのアクセスチャンス</h3>','<h3>アクセスチャンスの継続回数</h3>','<h2>テンプレのコピー</h2>'])assert.ok(guide.includes(t),t);
  assert.ok(!guide.includes('内部値と一致しないため記録しない'));
});
check('構文・LF・後読みなし',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'gz2-v02-syntax-'));
  for(const p of ['checker-data/vivy.js','vivy-checker.html','vivy-guide.html','docs/specs/vivy-checker-v03.md','tests/vivy-nana.verify.mjs','tests/vivy-nana.browser.mjs'])assert.ok(!read(p).includes('\r'),p);
  for(const p of ['checker-data/vivy.js','tests/vivy-nana.verify.mjs','tests/vivy-nana.browser.mjs'])execFileSync(process.execPath,['--check',path.join(root,p)]);
  assert.doesNotMatch(read('checker-data/vivy.js'),/\(\?<([=!])/);
  for(const [i,m] of [...read('vivy-checker.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
});
check('前回555pt選択は111〜333ptの3行・444/555ptは読み込み時に捨てる（夢爽 11/2）',()=>{
 assert.deepEqual(clone(Object.keys(c.defaults.pt555)),['p111','p222','p333']);
 const S=fresh();Object.assign(S.pt555,{p111:1,p222:2,p333:3,p444:4,p555:5,future:6});const out=c.normalizeState(clone(S));
 assert.deepEqual(clone(out.pt555),{p111:1,p222:2,p333:3,future:6});assert.deepEqual(clone(c.normalizeState(clone(out))),clone(out));
 const input=c.pages(ctx(out),()=>'')[0]();for(const p of [111,222,333])assert.ok(input.includes('data-c="pt555.p'+p+'"'));for(const p of [444,555])assert.ok(!input.includes('data-c="pt555.p'+p+'"'));
 const sec=c.card.detail(ctx(out)).find(x=>x.title==='前回555後pt');assert.deepEqual(clone(sec.items.map(i=>i.label)),['111pt','222pt','333pt']);
});
// ネネ検収（d279952）P2：EX は再読込で減らさない。当選回数を超えたらセクションに注意文（入力は止めない）。
check('EX＞当選でも保存値のまま・注意文を表示・入力は止めない',()=>{
  const warn='EXの回数がアクセスチャンス当選の回数を超えています。';
  const S=fresh();Object.assign(S.access,{weakD:3,weakW:1,weakEx:4,chanceD:2,chanceW:2,chanceEx:1});
  const out=c.normalizeState(clone(S),clone(S));assert.equal(out.access.weakEx,4);assert.equal(out.access.chanceEx,1);
  assert.deepEqual(clone(c.normalizeState(clone(out),clone(out)).access),clone(out.access),'再読込で減らない');
  const input=c.pages(ctx(out),()=>'')[0]();assert.equal(input.split(warn).length-1,1);
  const access=input.split('レア役からのアクセスチャンス(EX)')[1].split('</section>')[0];assert.ok(access.includes(warn),'アクセスチャンスのセクションに出る');
  assert.ok(input.includes('data-c="access.weakEx"'),'入力は止めない');
  for(const k of ['weak','chance']){const T=fresh();T.access[k+'Ex']=T.access[k+'W']=2;T.access[k+'D']=3;assert.ok(!c.pages(ctx(T),()=>'')[0]().includes(warn),k+' EX=当選なら出ない');}
  assert.ok(!c.pages(ctx(fresh()),()=>'')[0]().includes(warn));
});
// ネネ検収 P2：§9-108-4 どおり、知っている項目だけ検証し、未知キーはトップレベル・グループ内とも型ごと一切変えずに保持（ゴジエヴァ2と同じ観点）。
check('未知キーをトップレベル・グループ内とも型ごと保持（§9-108-4）',()=>{
  const unknown={str:'keep',num:2.5,neg:-3,bool:false,nul:null,arr:[1,'a',{x:1}],obj:{deep:{v:'x'}}};
  const S=clone(c.defaults);
  Object.assign(S,{futureRoot:clone(unknown),futureStr:'root',futureNum:-1.5});
  for(const g of c.mergeKeys)Object.assign(S[g],clone(unknown));
  S.counts.at='4';S.cycle.c1D=-2;S.access.weakD=1.9;
  const out=c.normalizeState(clone(S),clone(S));
  assert.deepEqual(clone(out.futureRoot),unknown);assert.equal(out.futureStr,'root');assert.equal(out.futureNum,-1.5);
  for(const g of c.mergeKeys)for(const [k,v] of Object.entries(unknown))assert.deepEqual(clone(out[g][k]),v,g+'.'+k);
  assert.equal(out.counts.at,4);assert.equal(out.cycle.c1D,0);assert.equal(out.access.weakD,1);
  assert.deepEqual(clone(c.normalizeState(clone(out),clone(out))),clone(out),'冪等');
});
// ネネ検収 P3：nanaCollab にする前の保存データ（iconChoice が default／未設定、nanaIconInit なし）は1回だけなな様にする。以後はユーザーの選択（§9-89）。
check('旧データのアイコンは1回だけなな様・以後はユーザーの選択',()=>{
  for(const iconChoice of ['default',undefined,null,'']){
    const old=clone(c.defaults);delete old.nanaIconInit;if(iconChoice===undefined)delete old.iconChoice;else old.iconChoice=iconChoice;
    const out=c.normalizeState(clone(old),clone(old));assert.equal(out.iconChoice,'nana',String(iconChoice));assert.equal(out.nanaIconInit,true);
    out.iconChoice='default';const again=c.normalizeState(clone(out),clone(out));assert.equal(again.iconChoice,'default','slot-tools を選んだ後は再読込でも slot-tools');
  }
  for(const iconChoice of ['nana','upload','custom']){const old=clone(c.defaults);delete old.nanaIconInit;old.iconChoice=iconChoice;assert.equal(c.normalizeState(clone(old),clone(old)).iconChoice,iconChoice);}
});
// 0以外の既存本番データ（反映前の本番 js が保存する形、iconChoice:"default" 入り）を読み込む。既存値は不変・新項目は0・アイコンは1回だけなな様。
check('0以外の既存本番データ（iconChoice:"default"）の読み込み',()=>{
  const raw=clone(production.defaults);raw.games=12;raw.gameLog=[321,654];raw.img='data:image/png;base64,AAAA';raw.iconChoice='default';
  for(const g of production.mergeKeys)Object.keys(raw[g]).forEach((k,i)=>{raw[g][k]=i+2;});
  const saved=clone(production.normalizeState(clone(raw)));assert.equal(saved.iconChoice,'default');
  const out=c.normalizeState(clone(saved),clone(saved));
  for(const [k,v] of Object.entries(saved))if(k!=='iconChoice')assert.deepEqual(clone(out[k]),v,k+' は変わらない');
  assert.equal(out.iconChoice,'nana');assert.equal(out.nanaIconInit,true);
  for(const g of ['cycle','pt','pt555','access','cont'])assert.deepEqual(clone(out[g]),clone(c.defaults[g]),g+' は0で追加');
  assert.equal(c.storageKey,production.storageKey,'保存キーは本番のまま');
  out.iconChoice='default';assert.equal(c.normalizeState(clone(out),clone(out)).iconChoice,'default','以後はユーザーの選択');
});
console.log(`vivy-nana: ${checks} passed / 0 failed`);

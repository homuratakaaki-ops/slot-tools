// 2026-11-07: 指定文言・参照クエリだけをファイル別の期待値へ適用し、全文一致を維持する。
const wordingChanges={
  "checker-data/aobuta.js":[["確認手段（アプリ等）と分母条件が未確認のため、現時点で1/x表示は行いません。","現時点では1/xは表示せず、回数だけを表示します。"]],
  "checker-data/mieruko.js":[["確認手段と分母条件が未確認のため、現時点で1/x表示は行いません。","現時点では1/xは表示せず、回数だけを表示します。"]],
  "checker-data/kabaneri2.js":[["実測の1/x表示は行いません。出典の確率がどの区間（通常時だけか、ST中も含むか）を分母にしているか明示されていないためです（AGENTS.md §9-70）。下段ベルはST中にも成立するため、上の通常回転数を分母にしても解析値と条件が揃いません。回数だけを記録してください。","回数だけを記録してください。1/xは表示しません。下段ベルはST中にも成立するため、通常回転数で割った値は、解析値と比べられません。"]],
  "checker-data/juuou.js":[["の分母は0として扱い、確率表示は行いません。","の確率は表示しません。"]],
  "checker-data/otome5.js":[["（解析の分母定義に合わせるため）",""]],
  "checker-data/enen2.js":[["（通常時は混ぜない。解析の分母定義に合わせるため）","（通常時は混ぜない）"],["分母用","炎炎激闘当選率を見るための回数"],["'罠中 小V成立','炎炎激闘当選率を見るための回数","'罠中 小V成立','十字目変換の発生率を見るための回数"]],
  "checker-data/jashinchan.js":[["ホール側で出現バランスを変更できるカスタムが搭載されているため、出現頻度そのものは設定推測に使えません。","出現バランスを変更できるカスタムが搭載されており、出現頻度はホールの設定で変わります。"],["設定推測には使わず記録のみです","記録のみです"],["確率の算出には使わず、稼働メモとして保存します。","稼働メモとして保存します（確率は出しません）。"],["AT中の消化分を含む総回転数のため、確率の算出には使わず回数のみ記録します","回数だけを記録します（AT中の消化分を含むため、1/xは出しません）"]],
  "checker-data/milliongod.js":[["未入力の場合、15枚役は設定推定に使われません。","入力すると、15枚役が設定推測の％に反映されます。"]],
  "checker-data/monkey5.js":[["5枚役の設定推定に使う分母になります","打ち始めとの差（自遊技G）で5枚役の1/xを出します"]],
  "checker-data/karakuri2.js":[["分母用","直撃当選率を見るための回数"]],
  "checker-data/taktop.js":[["分母用","報酬チャンス当選率を見るための回数"]],
  "aobuta-checker.html":[["checker-data/aobuta.js?v=20260924","checker-data/aobuta.js?v=20261107-wording"]],
  "jashinchan-checker.html":[["checker-data/jashinchan.js?v=20260924-2","checker-data/jashinchan.js?v=20261107-wording"]],
  "juuou-checker.html":[["checker-data/juuou.js?v=20261004-2","checker-data/juuou.js?v=20261107-wording"]],
  "mieruko-checker.html":[["checker-data/mieruko.js?v=20260924","checker-data/mieruko.js?v=20261107-wording"]],
  "milliongod-checker.html":[["checker-data/milliongod.js?v=20260925","checker-data/milliongod.js?v=20261107-wording"]],
  "monkey5-checker.html":[["checker-data/monkey5.js?v=20260924","checker-data/monkey5.js?v=20261107-wording"]]
};
const wordingExpected=(file,s)=>(wordingChanges[file]||[]).reduce((text,[before,after])=>text.split(before).join(after),s);
// Run explicitly: node tests/magireco-remove-estimate.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
// 2026-11-02: allow only the specified orphan spacer insertion and engine cache query.
const beforeOrphan=s=>s.replace("      // drawDetailCard の maxRows=20 に対応：省略を終えた最終の行で、見出しが左の列の最後（index 19）に来たら\n      // spacer を入れて右の列の先頭へ送る。「ほか」行込みで40行を超えたら同じ優先順で1項目だけ追加で省略し、やり直す（最大2回）。\n      function finish(rows,moreCount){\n        for(let retry=0;;retry++){\n          if(rows[19]&&rows[19].type==='section')rows.splice(19,0,{type:'spacer',hot:false,value:0});\n          if(rows.length+(moreCount>0?1:0)<=maxRows||retry>=2)break;\n          if(!removeOne(prepared,false)&&!removeOne(prepared,true))break;\n          moreCount++;\n          prepared=prepared.filter(sec=>sec.items.length>0);\n          rows=build(prepared);\n        }\n        if(moreCount>0)rows.push({type:'more',text:'ほか '+moreCount+'項目',hot:false,value:0});\n        return rows;\n      }\n","").replace("if(rows.length<=maxRows)return finish(rows,0);","if(rows.length<=maxRows)return rows;").replace("      return finish(rows,moreCount);\n","      if(moreCount>0)rows.push({type:'more',text:'ほか '+moreCount+'項目',hot:false,value:0});\n      return rows;\n").replace("        if(row.type==='spacer')return;\n","").replaceAll('checker-engine.js?v=20261102-orphan','checker-engine.js?v=20260924');
const root=fileURLToPath(new URL('../',import.meta.url));
const baseline=file=>execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'show','6d1f3e0:'+file],{cwd:root,encoding:'utf8'});
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const load=source=>{const sandbox={window:{}};vm.runInNewContext(source,sandbox);return sandbox.window.CheckerConfigs.magireco;};
const old=load(baseline('checker-data/magireco.js')),now=load(read('checker-data/magireco.js'));
const clone=x=>JSON.parse(JSON.stringify(x));
const same=(a,b)=>assert.deepEqual(clone(a),clone(b));
same(now.defaults,old.defaults);same(now.mergeKeys,old.mergeKeys);assert.equal(now.storageKey,old.storageKey);
const certs=[...['copper','silver','gold','firework','rainbow'].map(k=>['plates',k]),...['mizugi','keyvis2nd','keyvis1st','kyubey'].map(k=>['bigScreens',k]),['atScreens','madokaIroha'],['chars','p9'],...['sekichuugyo','tachimimi','furiko','iinchou','yodaka','butaisouchi'].map(k=>['edCards',k]),...['deny1','deny2','deny3','deny1High','descAll'].map(k=>['story',k])];
let cases=0;
function compare(S){
  const a={S:clone(S)},b={S:clone(S)};
  same(now.card.blocks(b),old.card.blocks(a));
  const before=old.card.bottom(a),after=now.card.bottom(b);
  same(after,{...before,columns:[{...before.columns[0],items:before.columns[0].items.filter((_,i)=>i!==1)},{...before.columns[1],items:[...before.columns[1].items.slice(0,-1),before.columns[0].items[1]]}]});
  assert.equal(after.columns[0].items.length,5);assert.equal(after.columns[1].items.length,5);
  assert.equal(after.startY+4*after.rowGap,896);
  cases++;
}
compare(clone(old.defaults));
for(const [g,k] of certs)for(const count of [1,3]){const S=clone(old.defaults);S[g][k]=count;compare(S);}
for(let i=0;i<certs.length;i++)for(let j=i+1;j<certs.length;j++){const S=clone(old.defaults);for(const [g,k] of [certs[i],certs[j]])S[g][k]=2;compare(S);}
for(const mode of ['zero','mixed','all']){
  const S=clone(old.defaults);let i=0;
  if(mode!=='zero'){
    S.gamesApp=3000;S.gamesAppTotal=4000;S.cherryApp=65;
    for(const group of old.mergeKeys)for(const key of Object.keys(S[group]))S[group][key]=mode==='all'?3:i++%3;
    old.normalizeState(S);
  }
  compare(S);
  assert.deepEqual(Buffer.from(now.template({S:clone(S)})),Buffer.from(old.template({S:clone(S)})));
  same(now.normalizeState(clone(S)),old.normalizeState(clone(S)));
}
console.log(JSON.stringify({status:'PASS',certaintyTypes:certs.length,certaintyStates:cases,templateByteEqual:3,defaultsAndMergeKeys:'unchanged'}));
const sources=read('checker-data/magireco.js');
assert.ok(!/bayesSpec|bayesResult|bayesPct|bayesExcludedSettings|bayesUnder4|bayesExcludeSummary|bayesExclusions|pageBayes|denomProbs|EPISODE_PROBS|CZ_SOURCE|DENOMS|const SETTINGS|exclude:/.test(sources));
assert.ok(sources.includes('const MITAMA_PROBS='));
assert.ok(!read('magireco-checker.html').includes('checker-bayes.js'));
// preview/ は本番の過去版とのバイト比較の対象外。
const tracked=execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'ls-files','*-checker.html','checker-data/*.js','checker-engine.js','checker-bayes.js'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(file=>!file.startsWith('preview/')&&!/-test(?:-checker\.html|\.js)$/.test(file));
// MH v02 has its own exhaustive 3be5e98 comparison in mhsunbreak-template-v02.verify.mjs.
// tenten は断定表現・獲得枚数表示の修正で変更済み。
// takoslot-checker.html and checker-data/takoslot.js were changed by the current wording correction.
// paripi-checker.html と checker-data/paripi.js は夢爽裁可の ST終了画面追加で変更済み。
// toaru2の説明文・参照クエリと9機種のヘッダー区切り記号を修正したため除外。
// kanokari は設定推測タブ追加（docs/specs/kanokari-estimate-v01.md）のため除外。
// ricorico は 10/14 の解析更新（弱リコリス目の変換高確記録の追加ほか）のため除外。
// garei_zero_re は 10/14 の解析更新（ステージチェンジ演出・強チャンス目CZ）のため除外。
// mahoako は 10/19 の新規機種（docs/specs/mahoako-checker-v01.md）のため除外。
// seiya12 は 10/28 の新規機種（docs/specs/seiya12-checker-v01.md）のため除外。
// ragnador・garo・ggo・godzieva2・vivy は 10/28 の新規機種（11/2導入の最小版）のため除外。
// vvv2 は 10/28 の新規機種（docs/specs/vvv2-checker-v01.md）のため除外。
// mogumogu-checker.html・checker-data/mogumogu.js・mogumogu-guide.html は 10/21 のED中の巻物・CZ種別の内訳の追加で変更済み。
// tonski-checker.html・checker-data/tonski.js・tonski-guide.html は 10/21 の333G到達時の女神の舞の記録追加で変更済み。
const changed=['mogumogu-checker.html','checker-data/mogumogu.js','mogumogu-guide.html','tonski-checker.html','checker-data/tonski.js','tonski-guide.html','magireco-checker.html','checker-data/magireco.js','mhsunbreak-checker.html','checker-data/mhsunbreak.js','tenten-checker.html','checker-data/tenten.js','takoslot-checker.html','checker-data/takoslot.js','paripi-checker.html','checker-data/paripi.js',
  'checker-data/toaru2.js','toaru2-checker.html',
  'checker-data/kanokari.js','kanokari-checker.html',
  'checker-data/ricorico.js','ricorico-checker.html',
  'checker-data/garei_zero_re.js','garei-zero-re-checker.html',
  'checker-data/mahoako.js','mahoako-checker.html',
  'checker-data/seiya12.js','seiya12-checker.html',
  'checker-data/ragnador.js','ragnador-checker.html','checker-data/garo.js','garo-checker.html','checker-data/ggo.js','ggo-checker.html',
  'checker-data/godzieva2.js','godzieva2-checker.html','checker-data/vivy.js','vivy-checker.html',
  'checker-data/vvv2.js','vvv2-checker.html',
  'enen2-checker.html','kabaneri2-checker.html','karakuri2-checker.html','otome5-checker.html',
  'sao2-checker.html','taktop-checker.html','yajikita-checker.html','yoshimune-checker.html'];
for(const file of tracked.filter(f=>!changed.includes(f)))assert.deepEqual(Buffer.from(beforeOrphan(read(file))),Buffer.from(wordingExpected(file,baseline(file))),file);
const news=s=>s.split('<div class="section-label">NEW</div>')[1].split('</section>')[0].match(/<p>.*?<\/p>/g);
const b=news(read('index.html'));
// §9-92 で NEW欄は公開のたびに更新され行がずれるため、基準との行単位の差分は固定しない。
// マギレコの行が1本だけ・想定の文面であることは下の entry 検査で担保する。
assert.equal(b.length,8);
console.log(JSON.stringify({status:'PASS',unrelatedFilesByteEqual:tracked.length-changed.length,newsRows:8}));
// Only these three Magireco files describe the removed tab; unrelated uses of this word elsewhere are out of scope.
for(const file of ['checker-data/magireco.js','magireco-checker.html','magireco-guide.html'])assert.ok(!read(file).includes('推測'),file);
// Other machines still estimate settings: inspect only Magireco's NEW entry and preserve the site-wide explanation.
const entry=b.filter(line=>line.includes('magireco-checker.html'));
// 8行上限で最古の行が押し出されるため（§9-92・10/14 に押し出し済み）、残っている間だけ文面を固定する。
assert.ok(entry.length<=1);
if(entry.length)assert.deepEqual(entry,['<p>9/30｜<a href="magireco-checker.html">マギアレコード 設定判別カウンターを公開</a></p>']);
assert.ok(entry.every(line=>!line.includes('設定推測')));
const explanation=s=>s.split('\n').find(line=>line.includes('設定推測や期待値は判断を補助する目安'));
assert.ok(explanation(read('index.html')));
assert.deepEqual(Buffer.from(explanation(read('index.html'))),Buffer.from(explanation(baseline('index.html'))));
console.log('PASS zero estimate references in Magireco and its NEW entry; site explanation byte-identical');

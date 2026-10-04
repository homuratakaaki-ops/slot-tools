// Run explicitly: node tests/magireco-remove-estimate.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
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
const tracked=execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'ls-files','*-checker.html','checker-data/*.js','checker-engine.js','checker-bayes.js'],{cwd:root,encoding:'utf8'}).trim().split('\n');
// MH v02 has its own exhaustive 3be5e98 comparison in mhsunbreak-template-v02.verify.mjs.
for(const file of tracked.filter(f=>!['magireco-checker.html','checker-data/magireco.js','mhsunbreak-checker.html','checker-data/mhsunbreak.js'].includes(f)))assert.deepEqual(Buffer.from(read(file)),Buffer.from(baseline(file)),file);
const news=s=>s.split('<div class="section-label">NEW</div>')[1].split('</section>')[0].match(/<p>.*?<\/p>/g);
const b=news(read('index.html'));
// §9-92 で NEW欄は公開のたびに更新され行がずれるため、基準との行単位の差分は固定しない。
// マギレコの行が1本だけ・想定の文面であることは下の entry 検査で担保する。
assert.equal(b.length,8);
console.log(JSON.stringify({status:'PASS',unrelatedFilesByteEqual:tracked.length-4,newsRows:8}));
// Only these three Magireco files describe the removed tab; unrelated uses of this word elsewhere are out of scope.
for(const file of ['checker-data/magireco.js','magireco-checker.html','magireco-guide.html'])assert.ok(!read(file).includes('推測'),file);
// Other machines still estimate settings: inspect only Magireco's NEW entry and preserve the site-wide explanation.
const entry=b.filter(line=>line.includes('magireco-checker.html'));
assert.deepEqual(entry,['<p>9/30｜<a href="magireco-checker.html">マギアレコード 設定判別カウンターを公開</a></p>']);
assert.ok(!entry[0].includes('設定推測'));
const explanation=s=>s.split('\n').find(line=>line.includes('設定推測や期待値は判断を補助する目安'));
assert.ok(explanation(read('index.html')));
assert.deepEqual(Buffer.from(explanation(read('index.html'))),Buffer.from(explanation(baseline('index.html'))));
console.log('PASS zero estimate references in Magireco and its NEW entry; site explanation byte-identical');

// Run explicitly: node tests/garei-1014.verify.mjs
// 喰霊-零-Re 10/14 解析更新：ステージチェンジ演出（stageChange）と強チャンス目からのCZ当選（rates.strongChance）。
// 出典はちょんぼりすた様 2026/10/09 更新分（2026-10-14 取得）。表はこのファイルに独立に書き、実装から読まない。
// 設定推測は CheckerBayes.estimate を包んで、示唆タブを描いたときに渡る spec と結果を捕まえて確かめる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const BASE='d4ba7cf';  // 本件直前の main
const baseline=p=>execFileSync('git',['-c','safe.directory='+root.replace(/\\/g,'/'),'show',BASE+':'+p],{cwd:root,encoding:'utf8'});
let checks=0;const ok=()=>checks++;

function load(src,id){
  const box={window:{}};vm.createContext(box);
  vm.runInContext(read('checker-bayes.js'),box);
  vm.runInContext(src,box);
  const win=box.window,est=win.CheckerBayes.estimate,log=[];
  win.CheckerBayes.estimate=spec=>{const r=est(spec);log.push({spec,r});return r;};
  return {c:win.CheckerConfigs[id],log};
}
const {c,log}=load(read('checker-data/garei_zero_re.js'),'garei_zero_re');
const {c:old}=load(baseline('checker-data/garei_zero_re.js'),'garei_zero_re');
const fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=(S,rows=[])=>({S,pct:(n,d)=>`${n}/${d}`,
  crow:(key,label,sub,hot,pct)=>{rows.push({key,label,sub,hot,pct:!!pct});return `<button>${label}</button><small>${sub}</small>`;}});
const pages=(S,rows)=>c.pages(ctx(S,rows),()=> '');
function bayes(S){log.length=0;pages(S)[2]();assert.equal(log.length>0,true);return log[log.length-1];}

// ---- 0. 出典から独立に転記した表 ----
const STAGE=[['hakuei','白叡','奇数設定 期待度UP',0],['ranguren','乱紅蓮','偶数設定 期待度UP',0],
  ['kaguraYomi','神楽と黄泉','設定2以上濃厚',2],['kaguraYomiKuda','神楽と黄泉と管狐','設定6濃厚',6]];
const STRONG_CHANCE={1:.102,2:.102,3:.113,4:.127,5:.137,6:.145};

// ---- 1. 画面の行 ----
const sRows=[],shisa=pages(fresh(),sRows)[1]();
assert.deepEqual(sRows.filter(r=>r.key.startsWith('stageChange.')).map(r=>[r.key.slice(12),r.label,r.sub,r.hot,r.pct]),
  STAGE.map(s=>[s[0],s[1],s[2],s[3],false]));ok();
assert.equal(sRows[0].key,'stageChange.hakuei');ok();  // 示唆タブの先頭（BB終了画面の前）
assert.ok(shisa.indexOf('ステージチェンジ演出')<shisa.indexOf('BB終了画面'));ok();
assert.ok(shisa.includes('<div class="hint">通常時のステージチェンジで上記4パターンが出たときだけ記録します。レア役成立時の炎背景も示唆内容は同じです。白叡・乱紅蓮は振り分けの数値が公表されていないため、記録のみで推定には使いません。</div>'));ok();
const cnt=pages(fresh())[0]();
assert.ok(cnt.includes('<b>強チャンス目からのCZ当選</b><small>設1・2:10.2%⇔設6:14.5%</small>'));ok();
assert.ok(cnt.indexOf('強チェリーからのCZ当選')<cnt.indexOf('強チャンス目からのCZ当選')&&cnt.indexOf('強チャンス目からのCZ当選')<cnt.indexOf('>BIG<'));ok();
assert.ok(cnt.includes('data-bump-many="rates.strongChancer,rates.strongChancew"')&&cnt.includes('data-bump="rates.strongChancer"'));ok();
assert.ok(cnt.includes('強チャンス目からのCZ当選も通常滞在時のみ記録します。'));ok();
assert.ok(!cnt.includes('弱チャンス目からのCZ'));ok();

// ---- 2. 設定推測 ----
// (1) 神楽と黄泉 1回 → 設定1が0
let S=fresh();S.stageChange.kaguraYomi=1;let b=bayes(S);
assert.equal(b.r.posterior[1],0);for(const s of [2,3,4,5,6])assert.ok(b.r.posterior[s]>0);ok();
// (2) 神楽と黄泉と管狐 1回 → 設定1〜5が0
S=fresh();S.stageChange.kaguraYomiKuda=1;b=bayes(S);
for(const s of [1,2,3,4,5])assert.equal(b.r.posterior[s],0);assert.equal(b.r.posterior[6],1);ok();
// 白叡・乱紅蓮は記録のみ（推定は空のまま）
S=fresh();S.stageChange.hakuei=3;S.stageChange.ranguren=2;b=bayes(S);
assert.equal(b.spec.binomial.length,0);assert.ok(b.spec.exclusions.every(e=>e.count===0));ok();
// (3) 強チャンス目 当選3/到達20 → 二項1本・矛盾なし・事後は独立計算と一致
S=fresh();S.rates.strongChancer=20;S.rates.strongChancew=3;b=bayes(S);
assert.deepEqual(clone(b.spec.binomial),[{label:'強チャンス目CZ当選',hit:3,total:20,probs:STRONG_CHANCE}]);
assert.ok(!b.r.contradiction&&!b.r.empty);
const lik=Object.fromEntries([1,2,3,4,5,6].map(s=>[s,STRONG_CHANCE[s]**3*(1-STRONG_CHANCE[s])**17]));
const z=Object.values(lik).reduce((a,v)=>a+v,0);
for(const s of [1,2,3,4,5,6])assert.ok(Math.abs(b.r.posterior[s]-lik[s]/z)<1e-12,'posterior '+s);
assert.ok(b.r.posterior[6]>b.r.posterior[1]);ok();
// 到達0なら推定に入らない
S=fresh();b=bayes(S);assert.ok(!b.spec.binomial.some(x=>x.label==='強チャンス目CZ当選'));ok();
// 既存の確定演出（BB水着＝6濃厚）と重ねても設定6が残る
S=fresh();S.stageChange.kaguraYomiKuda=1;S.bbScreens.swim=1;b=bayes(S);assert.equal(b.r.posterior[6],1);ok();

// ---- 3. テンプレ・詳細カード・確定演出 ----
S=fresh();S.stageChange.kaguraYomi=2;S.stageChange.hakuei=1;S.rates.strongChancer=20;S.rates.strongChancew=3;S.currentGames=1000;
const t=c.template(ctx(S));
assert.ok(t.includes('強チャンス目CZ▶3/20 15%'));ok();
assert.ok(t.includes('\n■ステージチェンジ演出\n白叡▶1回\n神楽と黄泉▶2回\n'));ok();
assert.ok(t.indexOf('■ステージチェンジ演出')<t.indexOf('■BB終了画面')||!t.includes('■BB終了画面'));ok();
assert.ok(!c.template(ctx(fresh())).includes('ステージチェンジ'));ok();
assert.ok(t.includes('確定演出2回'));ok();
const det=c.card.detail(ctx(S));
const sc=det.find(g=>g.title==='ステージチェンジ演出');
assert.deepEqual(clone(sc.items),STAGE.map(s=>({label:s[1],value:S.stageChange[s[0]],hot:!!s[3]})));ok();
assert.ok(det.findIndex(g=>g.title==='ステージチェンジ演出')<det.findIndex(g=>g.title==='BB終了画面'));ok();
assert.deepEqual(clone(det[0].items.find(i=>i.label==='強チャンス目CZ')),{label:'強チャンス目CZ',value:3,hot:true,text:'強チャンス目CZ 3/20 15%',show:true});ok();
const left=c.card.bottom(ctx(S)).columns[0].items[0];
assert.equal(left.text,'確定演出 ステージチェンジ 神楽と黄泉(2以上) ×2');ok();

// ---- 4. 保存互換：旧データは0で補完、旧キーはそのまま ----
const legacy=clone(old.defaults);legacy.counts.watermelon=12;legacy.rates.strongCzr=4;legacy.rates.strongCzw=1;legacy.bbScreens.childhood=1;
delete legacy.stageChange;
const migrated=c.normalizeState(clone(legacy));
assert.deepEqual(clone(migrated.stageChange),{hakuei:0,ranguren:0,kaguraYomi:0,kaguraYomiKuda:0});
assert.equal(migrated.rates.strongChancer,0);assert.equal(migrated.rates.strongChancew,0);
assert.equal(migrated.counts.watermelon,12);assert.equal(migrated.rates.strongCzr,4);assert.equal(migrated.bbScreens.childhood,1);ok();
assert.deepEqual(clone(c.normalizeState(clone(migrated))),clone(migrated));ok();  // 冪等
const bad=fresh();bad.rates.strongChancer=1;bad.rates.strongChancew=3;bad.stageChange.kaguraYomi=-2;
const fixed=c.normalizeState(bad);assert.equal(fixed.rates.strongChancer,3);assert.equal(fixed.stageChange.kaguraYomi,0);ok();
assert.deepEqual([...c.mergeKeys],[...old.mergeKeys.slice(0,3),'stageChange',...old.mergeKeys.slice(3)]);ok();
assert.equal(c.storageKey,old.storageKey);ok();
// 旧データだけの状態では推定・テンプレ（ステージチェンジ節と強チャンス目行以外）が旧版と一致
const oldS=old.normalizeState(clone(legacy));
const strip=s=>s.replace('強チャンス目CZ▶−\n','');
assert.equal(strip(c.template(ctx(clone(migrated)))),old.template(ctx(oldS)));ok();

// ---- 5. 本番ページ・テスト版・ガイド・NEW欄 ----
const prod=read('garei-zero-re-checker.html'),test=read('garei-zero-re-test-checker.html');
assert.ok(prod.includes('<script src="checker-data/garei_zero_re.js?v=20261014"></script>'));ok();
assert.ok(test.includes('<meta name="robots" content="noindex,nofollow">'));
assert.ok(test.includes('<script src="checker-data/garei_zero_re-test.js?v=20261014-test"></script>'));
assert.ok(test.includes('CheckerEngine.mount(CheckerConfigs["garei_zero_re-test"]);'));ok();
const tdata=read('checker-data/garei_zero_re-test.js'),pdata=read('checker-data/garei_zero_re.js');
assert.equal(tdata.replace('window.CheckerConfigs["garei_zero_re-test"]={','window.CheckerConfigs.garei_zero_re={').replace("storageKey:'garei-zero-re-checker-v1-test'","storageKey:'garei-zero-re-checker-v1'"),pdata);ok();
for(const p of ['index.html','checkers.html','sitemap.xml','garei-zero-re-guide.html','garei-zero-re-checker.html'])assert.ok(!read(p).includes('garei-zero-re-test'),p+' に導線なし');ok();
const guide=read('garei-zero-re-guide.html');
assert.ok(guide.includes('<h3>ステージチェンジ演出</h3>')&&guide.includes('<h3>強チャンス目からのCZ当選</h3>'));
assert.ok(guide.includes('<td>ステージチェンジ演出、BB終了画面'));ok();
const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0].match(/<p>.*?<\/p>/g);
assert.equal(news.length,8);assert.ok(news[0].includes('garei-zero-re-checker.html')&&news[0].includes('喰霊-零-Re ステージチェンジ演出・強チャンス目CZ当選率を追加'));ok();
for(const p of ['checker-data/garei_zero_re.js','checker-data/garei_zero_re-test.js','garei-zero-re-checker.html','garei-zero-re-test-checker.html','garei-zero-re-guide.html','index.html'])assert.ok(!read(p).includes('\r'),p+' LF');ok();

console.log(`PASS garei-1014: ${checks} checks`);

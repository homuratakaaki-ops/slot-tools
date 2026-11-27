import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const clone=x=>JSON.parse(JSON.stringify(x));
function config(src,key){const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs[key];}
const source=read('checker-data/godzieva2-test.js'),production=read('checker-data/godzieva2.js');
const c=config(source,'godzieva2-test'),b=config(git('show','fdf6e90:checker-data/godzieva2.js'),'godzieva2');
const fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=S=>({S,mode:1,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',pct:(v,d)=>d?`${(100*v/d).toFixed(0)}%`:'—',crow:(key,label,sub,hot,pct)=>JSON.stringify({key,label,sub,hot,pct:pct?.(key.split('.').reduce((o,k)=>o[k],S))})});
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
const voices=[['shinji','シンジ','デフォルト'],['ritsuko','リツコ','次回ゴジラボーナス期待度約50%'],['mari','マリ','ボーナス間天井250G以内の期待度約66%'],['asuka','アスカ','ボーナス間天井850G否定＋400G以内の期待度約50%'],['rei','レイ','AT間天井750G以内濃厚'],['misato','ミサト','次回ゴジラボーナス濃厚'],['gendo','ゲンドウ','AT間天井250G以内濃厚']];
check('旧データの全値・未知キー保持、新キー0、schemaVersion 1',()=>{
  const old=clone(b.defaults);old.gameLog=[123,456];old.future={keep:[1,'a',false]};
  for(const group of b.mergeKeys){for(const k of Object.keys(old[group]))old[group][k]=7;old[group].future={negative:-4,decimal:1.2};}
  const actual=clone(c.normalizeState(clone(old)));
  assert.deepEqual(actual.mothraG,{g44:0,g55:0,g66:0});delete actual.mothraG;
  assert.equal(actual.endVoice.rei,0);assert.equal(actual.endVoice.gendo,0);delete actual.endVoice.rei;delete actual.endVoice.gendo;
  assert.deepEqual(actual,old);assert.equal(c.defaults.schemaVersion,1);
  const future=fresh();future.mothraG.future={keep:true};assert.deepEqual(clone(c.normalizeState(future)).mothraG.future,{keep:true});
});
check('モスラ3回の確定演出と最高ランク',()=>{
  const S=fresh();S.mothraG={g44:1,g55:1,g66:1};const x=ctx(S);
  assert.deepEqual(clone(c.card.blocks(x)[2]),['確定演出','計3回']);
  assert.equal(c.card.bottom(x).columns[0].items[0].text,'確定演出 モスラ66G(6濃厚) ×1');
  for(const [key,rank] of [['g44',4],['g55',5],['g66',6]]){const T=fresh();T.mothraG[key]=1;assert.equal(c.card.bottom(ctx(T)).columns[0].items[0].text,`確定演出 モスラ${key.slice(1)}G(${rank===6?'6濃厚':rank+'以上'}) ×1`);}
});
check('終了画面モスラと初期G独立、否定表示不変',()=>{
  const S=fresh();S.endScreen.mothra=2;
  assert.deepEqual(clone(S.mothraG),{g44:0,g55:0,g66:0});
  const denial=clone(c.card.bottom(ctx(S)).columns[0].items[1]);assert.equal(denial.text,'否定 設1・3');
  assert.deepEqual(denial,clone(b.card.bottom(ctx(S)).columns[0].items[1]));
  S.mothraG.g66=3;assert.equal(S.endScreen.mothra,2);assert.deepEqual(clone(c.card.bottom(ctx(S)).columns[0].items[1]),denial);
  const T=fresh();T.mothraG.g44=1;assert.equal(T.endScreen.mothra,0);
});
check('終了ボイス7行の順番・原文・分母、確定演出から除外、詳細hot',()=>{
  const S=fresh();voices.forEach(([k],i)=>S.endVoice[k]=i+1);S.endVoice.unknown=999;
  const rows=[];const x=ctx(S);x.crow=(key,label,sub,hot,pct)=>{rows.push({key,label,sub,hot,pct:pct?.(key.split('.').reduce((o,k)=>o[k],S))});return '';};
  const html=c.pages(x,()=> '')[1]();
  assert.deepEqual(rows.filter(r=>r.key.startsWith('endVoice.')),voices.map(([k,label,sub],i)=>({key:'endVoice.'+k,label,sub,hot:false,pct:((i+1)*100/28).toFixed(0)+'%'})));
  assert.equal(c.card.blocks(x)[2][1],'計0回');
  assert.ok(html.indexOf('ボーナス・AT終了画面')<html.indexOf('ゴジエヴァアタック モスラの初期G数'));assert.ok(html.indexOf('ゴジエヴァアタック モスラの初期G数')<html.indexOf('終了画面のボイス'));
  assert.ok(html.includes('ゴジエヴァアタックでモスラが選ばれたとき、初期G数が44G・55G・66Gなら押します。終了画面のモスラとは別の項目です。'));
  assert.ok(rows.filter(r=>r.key.startsWith('mothraG.')).every(r=>r.hot===true));
  const sections=c.card.detail(x),idx=sections.findIndex(s=>s.title==='終了画面');assert.equal(sections[idx+1].title,'モスラ初期G');assert.equal(sections[idx+1].items.length,3);assert.ok(sections[idx+1].items.every(r=>r.hot===true));
  const detail=sections.find(s=>s.title==='終了ボイス');assert.equal(detail.denominator,28);assert.equal(detail.percent,true);assert.equal(detail.items.length,7);assert.ok(detail.items.every(r=>r.hot===false));
});
check('コピー本文は新4行以外main fdf6e90と完全一致、値の位置、engineプレーン変換',()=>{
  const box={window:{},localStorage:{getItem:()=>null}};vm.runInNewContext(read('checker-engine.js'),box);const engine=box.window.CheckerEngine.createApp(c);
  for(const filled of [false,true]){
    const S=fresh();if(filled){let n=1;for(const group of c.mergeKeys)for(const key of Object.keys(S[group]))S[group][key]=n++;S.gameLog=[200,350];}
    const out=c.template(ctx(S));const block=`■ゴジエヴァアタック モスラ初期G\n44G(4以上)▶︎ ${S.mothraG.g44}回\n55G(5以上)▶︎ ${S.mothraG.g55}回\n66G(6濃厚)▶︎ ${S.mothraG.g66}回\n\n`;
    assert.ok(out.includes(block));assert.equal(out.replace(block,''),b.template(ctx(S)));
    assert.ok(out.includes(`カヲル          ▶︎ ${S.endScreen.kaworu}回\n\n${block}■エンディング中ボイス\nシンジ▶︎ ${S.edVoice.shinji}回`));
    const plain=engine.plainText(out),plainBlock=block.replaceAll('▶︎','→');assert.ok(plain.includes(plainBlock));assert.equal(plain.replace(plainBlock,''),engine.plainText(b.template(ctx(S))));
    assert.equal(c.compactTemplate(ctx(S)),out);
  }
});
check('ソース差分は分離と指示書の対象行のみ、正規化・CSS不変',()=>{
  let restored=source.replace('window.CheckerConfigs["godzieva2-test"]','window.CheckerConfigs.godzieva2').replaceAll('godzieva2-checker-v1-test','godzieva2-checker-v1').replaceAll('godzieva2_test_check','godzieva2_check');
  const allowed=['  const END_VOICE=','  const CERT=','  const MERGE_KEYS=','  const TEMPLATE=','  const DEF=','    <section class="sec"><div class="sec-h">終了画面のボイス','      ...END_SCREEN.map'];
  const baseLines=production.split('\n');
  restored=restored.split('\n').filter(l=>!l.startsWith('    <section class="sec"><div class="sec-h">ゴジエヴァアタック')&&!l.startsWith("      {title:'モスラ初期G'")).map(l=>{const prefix=allowed.find(p=>l.startsWith(p));return prefix?baseLines.find(b=>b.startsWith(prefix)):l;}).join('\n');
  assert.equal(restored,production);
  for(const file of ['checker-data/godzieva2.js','godzieva2-checker.html','godzieva2-guide.html','index.html','checkers.html','sitemap.xml'])assert.equal(read(file),git('show','HEAD:'+file),file);
});
check('テスト保存キー・画像名・前例HTML・noindex・導線なし',()=>{
  assert.equal(c.storageKey,'godzieva2-checker-v1-test');assert.equal(c.card.downloadName,'godzieva2_test_check.png');assert.equal(c.card.detailDownloadName,'godzieva2_test_check_detail.png');
  const html=read('godzieva2-test-checker.html');assert.equal(html,git('show','a409d93:godzieva2-test-checker.html').replace('20261106-test','20261127-test'));
  assert.ok(html.includes('name="robots" content="noindex,nofollow"'));assert.ok(html.includes('CheckerEngine.mount(CheckerConfigs["godzieva2-test"])'));
  for(const file of ['index.html','checkers.html','sitemap.xml','godzieva2-guide.html'])assert.ok(!read(file).includes('godzieva2-test'),file);
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html')&&f!=='godzieva2-test-checker.html'))assert.doesNotMatch(read(file),/(?:href|src)=["'][^"']*godzieva2-test/,file);
});
console.log(`godzieva2-mothra-test: ${checks} passed / 0 failed`);

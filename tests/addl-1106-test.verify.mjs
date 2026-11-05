import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const git=(...args)=>execFileSync('git',['-c','safe.directory='+root,...args],{cwd:root,encoding:'utf8'});
const clone=x=>JSON.parse(JSON.stringify(x));
const load=(source,id)=>{const box={window:{}};vm.runInNewContext(source,box);return box.window.CheckerConfigs[id];};
const unknown={str:'keep',num:2.5,neg:-3,bool:false,nul:null,arr:[1,'a',{x:1}],obj:{deep:{v:'x'}}};
const configs={};let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function context(c,S){return {S,crow:(key,label,hint,rank,pct)=>`<row key="${key}">${label}|${hint}|${rank}|${pct?pct(key.split('.').reduce((o,k)=>o[k],S)):''}</row>`,pct:(v,n)=>n?`${v}/${n} ${(100*v/n).toFixed(0)}%`:'—'};}
const pages=(c,S)=>c.pages(context(c,S),()=>'<card>');
for(const id of ['seiya12','ragnador','ggo']){
 const source=read(`checker-data/${id}-test.js`),base=git('show',`HEAD:checker-data/${id}.js`),c=load(source,id+'-test'),b=load(base,id);configs[id]=c;
 check(id+' 分離・本番不変・HTMLの変更範囲',()=>{
  assert.equal(c.storageKey,id+'-checker-v1-test');
  for(const f of [`checker-data/${id}.js`,`${id}-checker.html`,`${id}-guide.html`])assert.equal(read(f),git('show','HEAD:'+f));
  const banner=git('show','65de568:ggo-test-checker.html').split('</header>')[1].split('<main')[0];
  const expected=git('show',`HEAD:${id}-checker.html`).replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">').replace('<title>','<title>【テスト版】').replace('property="og:title" content="','property="og:title" content="【テスト版】').replaceAll(`https://slot-tools.jp/${id}-checker.html`,`https://slot-tools.jp/${id}-test-checker.html`).replace('</header>\n','</header>'+banner).replace(new RegExp('checker-data/'+id+'\\.js\\?v=[^"\\s]+'),`checker-data/${id}-test.js?v=${id==='seiya12'?'20261106-test4':'20261106-test3'}`).replace(`CheckerConfigs["${id}"]`,`CheckerConfigs["${id}-test"]`);
  assert.equal(read(id+'-test-checker.html'),expected.replace(`CheckerConfigs.${id}`,`CheckerConfigs["${id}-test"]`));
  assert.ok(read(id+'-test-checker.html').includes(`CheckerEngine.mount(CheckerConfigs["${id}-test"])`));
  const defaults=clone(c.defaults);if(id==='seiya12')delete defaults.gfLamp;if(id==='ragnador')delete defaults.counts.czKakutei;
  assert.deepEqual(defaults,clone(b.defaults));
  // 公開APIのうち許可のない定義・関数は本番と同じ。
  for(const k of ['uiV2','nanaCollab','sourceUrl','actions','share','mergeKeys']){
   if(k==='mergeKeys'&&id==='seiya12')assert.deepEqual(clone(c[k]).filter(x=>x!=='gfLamp'),clone(b[k]));
   else if(k==='actions')for(const a of Object.keys(b[k]))assert.equal(String(c[k][a]),String(b[k][a]));
   else assert.deepEqual(clone(c[k]),clone(b[k]));
  }
  for(const k of Object.keys(b.card).filter(k=>!['detail','bottom','blocks'].includes(k)))assert.equal(typeof c.card[k]==='function'?String(c.card[k]):JSON.stringify(c.card[k]),typeof b.card[k]==='function'?String(b.card[k]):JSON.stringify(b.card[k]));
  assert.equal(String(c.card.blocks),String(b.card.blocks));if(id!=='seiya12')assert.equal(String(c.card.bottom),String(b.card.bottom)); // 星矢はサマリーの行組みを変えた（GFランプ行・折り返し、夢爽 11/6）。下の専用検査で見る。
 });
 check(id+' 旧データ・未知型・新規0・冪等',()=>{
  const S=clone(b.defaults);S.gameLog=[300,700];S.games=9;Object.assign(S,clone(unknown));
  for(const g of b.mergeKeys){for(const k of Object.keys(S[g]))S[g][k]=7;Object.assign(S[g],clone(unknown));}
  const out=clone(c.normalizeState(clone(S))),expected=clone(b.normalizeState(clone(S)));
  if(id==='seiya12'){assert.ok(Object.values(out.gfLamp).every(v=>v===0));delete out.gfLamp;}
  if(id==='ragnador'){assert.equal(out.counts.czKakutei,0);delete out.counts.czKakutei;}
  // 3機種とも §9-108-4：未知キーはトップレベル・グループ内とも型ごと保持（文字列・数値・負数・真偽・null・配列・オブジェクト）。
  for(const [k,v] of Object.entries(unknown)){assert.deepEqual(out[k],v,k);for(const g of b.mergeKeys)assert.deepEqual(out[g][k],v,g+'.'+k);}
  for(const g of b.mergeKeys){assert.equal(typeof out[g].str,'string');assert.ok(Array.isArray(out[g].arr));assert.equal(typeof out[g].obj,'object');}
  for(const g of b.mergeKeys)for(const k of Object.keys(b.defaults[g]))assert.equal(out[g][k],7,g+'.'+k);
  // 既知キーの値は本番の正規化と同じ（未知キーの扱いだけが違う）。
  for(const g of b.mergeKeys)for(const k of Object.keys(b.defaults[g]))assert.equal(out[g][k],expected[g][k]);
  for(const g of b.mergeKeys){
   const [k1,k2]=Object.keys(b.defaults[g]),invalid=clone(S);invalid[g][k1]='4.9';if(k2)invalid[g][k2]=-2;
   const fixed=c.normalizeState(invalid);assert.equal(fixed[g][k1],4);if(k2)assert.equal(fixed[g][k2],0);
  }
  const normalized=c.normalizeState(clone(S));assert.deepEqual(clone(c.normalizeState(clone(normalized))),clone(normalized));
 });
}
check('星矢 GF6色・濃厚3色だけ・コピー・詳細',()=>{
 const c=configs.seiya12,S=clone(c.defaults),colors=['白','青','黄','緑','赤','虹'];
 assert.ok(!c.template({S}).includes('グランドフィナーレ'));
 for(const [i,k] of Object.keys(S.gfLamp).entries()){
  const T=clone(S);T.gfLamp[k]=1;
  assert.ok(c.template({S:T}).includes('確定演出'+(i>=3?1:0)+'回'));
  const line=c.card.bottom({S:T}).columns[0].items[0].text;
  assert.ok(line.includes(i>=3?'GFランプ'+colors[i]:'確定演出 なし'));
  const text=c.template({S:T}).split('■グランドフィナーレ中のランプ')[1];assert.ok(text.includes(colors[i]+'▶1回'));assert.ok(!text.includes('%'));
 }
 const d=c.card.detail({S}).find(x=>x.title==='GFランプ');assert.equal(d.percent,false);assert.equal(d.items.length,6);
 const html=pages(c,S)[1]();assert.ok(html.indexOf('カード演出の星座')<html.indexOf('グランドフィナーレ中のランプ'));assert.ok(html.indexOf('グランドフィナーレ中のランプ')<html.indexOf('奇数・偶数・高設定の期待度UPは記録のみ'));
});
check('ラグナ 確定CZの分母・警告・出力・除外',()=>{
 const c=configs.ragnador;
 for(const [N,M,pct,percent] of [[10,0,'—',''],[10,2,'CZ 10回中 2回（20.0%）',' 20.0%'],[2,3,'CZ 2回中 3回',''],[0,1,'CZ 0回中 1回','']]){
  const S=clone(c.defaults);Object.assign(S.counts,{cz:N,czKakutei:M});
  const h=pages(c,S)[0]();assert.ok(h.includes(pct));assert.equal(h.includes('class="hint warn"'),M>N);
  assert.equal((h.match(/<summary>説明を見る<\/summary>/g)||[]).length,1);
  assert.ok(h.indexOf('key="counts.cz"')<h.indexOf('key="counts.czKakutei"'));assert.ok(h.indexOf('key="counts.czKakutei"')<h.indexOf('key="counts.at"'));
  const t=c.template({S});assert.ok(t.includes('確定演出0回'));
  if(M)assert.ok(t.includes(`確定CZ▶${M}回（CZ ${N}回中${percent}）`));else assert.ok(!t.includes('確定CZ▶'));
  const item=c.card.detail({S})[0].items[1];assert.equal(item.text,`確定CZ ${M}/${N}${percent}`);assert.equal(item.show,M>0);assert.equal(item.hot,false);
  assert.ok(!JSON.stringify(c.card.blocks({S})).includes('確定CZ'));assert.ok(!JSON.stringify(c.card.chart({S})).includes('確定CZ'));
 }
});
check('参照表 設定1〜6の値と注記・入力なし',()=>{
 for(const [id,title,values,note] of [
  ['ragnador','確定CZ当選率',['0.4','0.4','0.4','0.8','1.2','1.2'],'CZ突入時に抽選。'],
  ['ragnador','玄武選択率（通常テーブル）',['1.6','2.0','2.3','4.7','5.5','6.3'],'どのテーブルかは見た目では分かりません。'],
  ['ggo','天国選択率',['21.9','23.0','24.6','28.1','31.3','31.6'],'天国に入ったかどうかは、毎回確かめられるとは限りません。']]){
  const c=configs[id],h=pages(c,clone(c.defaults))[2]().split(title)[1].split('</section>')[0];
  values.forEach((v,i)=>assert.ok(h.includes(`<td>設定${i+1}</td><td>${v}%</td>`)));assert.ok(h.includes(note));assert.ok(!h.includes('<input'));
 }
});
check('構文・LF・保護ファイル・公開導線なし',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'addl-1106-syntax-'));
 for(const id of Object.keys(configs)){
  const html=read(id+'-test-checker.html');assert.ok(!html.includes('\r'));assert.ok(!read('checker-data/'+id+'-test.js').includes('\r'));
  execFileSync(process.execPath,['--check',path.join(root,'checker-data/'+id+'-test.js')]);
  for(const [i,m] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(dir,id+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
  for(const p of ['index.html','checkers.html','sitemap.xml'])assert.ok(!read(p).includes(id+'-test-checker.html'));
 }
 assert.equal(git('diff','HEAD','--','checker-engine.js','index.html','checkers.html','sitemap.xml','IDEAS.md','AGENTS.md'),'');
});
// 利用者向けの文言（夢爽 11/6）：ツール内部の計算の扱いを書いた文を残さない。
check('文言：内部の計算の扱いの文がない・新しい文がある・星矢GFランプのサマリー行',()=>{
 const src=Object.fromEntries(['seiya12','ragnador','ggo'].map(id=>[id,read('checker-data/'+id+'-test.js')]));
 for(const [id,t] of Object.entries(src))for(const bad of ['根拠にしません','推定に使わない','推測には使いません','設定推測','確率には使いません','根拠にはなりません'])assert.ok(!t.includes(bad),id+' '+bad);
 assert.ok(src.seiya12.includes('強レア役のときは強い示唆が出やすくなります。'));
 assert.ok(src.seiya12.includes("trophy:'黄金聖闘士バトル・千日戦争の継続バトル・サガバトル敗北時に出ることがあります。出現率はホール設定で変わります。'"));
 assert.ok(src.ragnador.includes('設定差があるのは通常テーブルだけで、どのテーブルかは見た目では分かりません。'));
 assert.ok(src.ggo.includes('抽選契機は初回有利区間移行時・通常時ボーナス終了時・SJ終了時です。天国に入ったかどうかは、毎回確かめられるとは限りません。'));
 const c=configs.seiya12,bottom=S=>c.card.bottom({S}),texts=col=>Array.from(col.items,r=>r.text);
 // 記録のある色をすべて出す（白・青・黄も）。0件なら行を出さない。
 let S=clone(c.defaults);S.gfLamp.blue=1;assert.ok(texts(bottom(S).columns[2]).includes('GFランプ 青×1'));
 S.gfLamp.green=1;assert.ok(texts(bottom(S).columns[2]).includes('GFランプ 青×1・緑×1'));
 assert.ok(!texts(bottom(clone(c.defaults)).columns[2]).some(t=>t.startsWith('GFランプ')));
 // 緑・赤・虹は確定演出にも数える（白・青・黄は数えない）。
 S=clone(c.defaults);S.gfLamp.white=3;S.gfLamp.blue=2;S.gfLamp.yellow=1;assert.equal(c.card.blocks({S})[2][1],'計0回');
 S.gfLamp.red=1;assert.equal(c.card.blocks({S})[2][1],'計1回');
 // 間の空列（x=540）で左列は右列の20px手前まで。全項目4回でも各列5行以内、折った行は「・」で続く。
 S=clone(c.defaults);for(const g of ['trophy','atEnd','erFirst','erSecond','card','gfLamp'])for(const k of Object.keys(S[g]))S[g][k]=4;S.counts.at=4;S.gameLog=[1000];
 const b=bottom(S);assert.deepEqual(Array.from(b.columns,col=>col.x),[70,540,560]);assert.equal(b.columns[1].items.length,0);
 for(const col of b.columns)assert.ok(col.items.length<=5);
 const left=texts(b.columns[0]),right=texts(b.columns[2]);
 assert.ok(left.some(t=>t.startsWith('　'))&&left.join('').replace(/　/g,'').includes('トロフィー 銅×4・銀×4・金×4・クマノミ柄×4・虹×4'),left.join('|'));
 assert.ok(right.join('').replace(/　/g,'').includes('GFランプ 白×4・青×4・黄×4・緑×4・赤×4・虹×4'),right.join('|'));
 assert.equal(right.at(-1),'AT初当り 4回 1/250.0');
});
console.log(`addl-1106 verify: ${checks} passed / 0 failed`);

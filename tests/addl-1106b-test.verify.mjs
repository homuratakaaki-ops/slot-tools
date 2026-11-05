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
const unknown={str:'keep',num:2.5,neg:-3,bool:false,nul:null,arr:[1,'a',{x:1}],obj:{deep:{v:'x'}}};
function load(source,id,storage=new Map()){
 const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v))};
 const box={window:{localStorage},localStorage};vm.runInNewContext(source,box);return box.window.CheckerConfigs[id];
}
function context(c,S){return {S,mode:1,nanaCreditText:()=>'',crow:(key,label,hint,rank,pct)=>`<row key="${key}">${label}|${hint}|${rank}|${pct?pct(key.split('.').reduce((o,k)=>o[k],S)):''}</row>`,pct:(v,n)=>n?`${(100*v/n).toFixed(0)}%`:'—'};}
const configs={};let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
for(const id of ['godzieva2','mhsunbreak']){
 const source=read(`checker-data/${id}-test.js`),base=git('show',`HEAD:checker-data/${id}.js`),c=load(source,id+'-test'),b=load(base,id);configs[id]=c;
 check(id+' 本番不変・保存分離・HTML差分',()=>{
  assert.equal(c.storageKey,id+'-checker-v1-test');
  for(const f of [`checker-data/${id}.js`,`${id}-checker.html`,`${id}-guide.html`])assert.equal(read(f),git('show','HEAD:'+f));
  for(const ext of ['js','html'])assert.ok(!(ext==='js'?source:read(id+'-test-checker.html')).match(new RegExp(id+'-checker-v1[\'\"]')));
  const banner=read('seiya12-test-checker.html').split('</header>')[1].split('<main')[0];
  const expected=git('show',`HEAD:${id}-checker.html`).replace('<head>','<head>\n<meta name="robots" content="noindex,nofollow">').replace('<title>','<title>【テスト版】').replace('property="og:title" content="','property="og:title" content="【テスト版】').replaceAll(`https://slot-tools.jp/${id}-checker.html`,`https://slot-tools.jp/${id}-test-checker.html`).replace('</header>\n','</header>'+banner).replace(new RegExp('checker-data/'+id+'\\.js\\?v=[^"\\s]+'),`checker-data/${id}-test.js?v=20261106-test`).replace(`CheckerConfigs.${id}`,`CheckerConfigs["${id}-test"]`).replace("const KEY='mhsunbreak-checker-v1'","const KEY='mhsunbreak-checker-v1-test'");
  assert.equal(read(id+'-test-checker.html'),expected);
  for(const [k,v] of Object.entries(b.actions))assert.equal(String(c.actions[k]).replaceAll('mhsunbreak_test_','mhsunbreak_'),String(v),k);
  for(const key of ['share','sourceUrl','uiV2','nanaCollab'])assert.deepEqual(clone(c[key]),clone(b[key]));
 });
 check(id+' 旧形式・未知型・既知値・新規0・冪等',()=>{
  const old=clone(b.defaults);Object.assign(old,clone(unknown));old.games=37;
  for(const g of b.mergeKeys.filter(k=>k!=='bzBase')){for(const k of Object.keys(old[g]))old[g][k]=7;Object.assign(old[g],clone(unknown));}
  const actual=clone(c.normalizeState(clone(old))),expected=clone(b.normalizeState(clone(old)));
  if(id==='godzieva2'){assert.deepEqual(actual.endVoice,{shinji:0,asuka:0,misato:0,ritsuko:0,mari:0});for(const k of ['mari','rei','kaji']){assert.equal(actual.edVoice[k],0);delete actual.edVoice[k];}delete actual.endVoice;}
  else {assert.deepEqual(actual.kareCut,{entalion:0});delete actual.kareCut;}
  for(const g of b.mergeKeys.filter(k=>k!=='bzBase'))for(const k of Object.keys(b.defaults[g]))assert.deepEqual(actual[g][k],expected[g][k]);
  for(const k of Object.keys(expected).filter(k=>!b.mergeKeys.includes(k)))assert.deepEqual(actual[k],expected[k]);
  for(const [k,v] of Object.entries(unknown)){assert.deepEqual(actual[k],v);for(const g of b.mergeKeys.filter(k=>k!=='bzBase'))assert.deepEqual(actual[g][k],v);}
  const out=clone(c.normalizeState(clone(old)));assert.deepEqual(clone(c.normalizeState(clone(out))),out);
  const future=clone(c.defaults);for(const g of c.mergeKeys)Object.assign(future[g],clone(unknown));
  if(id==='mhsunbreak')for(const g of ['bzT1','bzT2','questN1','questN2'])Object.assign(future.bzBase[g],clone(unknown));
  const kept=c.normalizeState(future);for(const g of c.mergeKeys)for(const [k,v] of Object.entries(unknown))assert.deepEqual(clone(kept[g][k]),v,g+'.'+k);
  if(id==='mhsunbreak')for(const g of ['bzT1','bzT2','questN1','questN2'])for(const [k,v] of Object.entries(unknown))assert.deepEqual(clone(kept.bzBase[g][k]),v);
  for(const g of c.mergeKeys.filter(k=>k!=='bzBase')){
   const s=clone(c.defaults),keys=Object.keys(s[g]);s[g][keys[0]]='4.9';if(keys[1])s[g][keys[1]]=-2;
   const n=c.normalizeState(s);assert.equal(n[g][keys[0]],id==='mhsunbreak'?4.9:4);if(keys[1])assert.equal(n[g][keys[1]],0);
  }
 });
 check(id+' テンプレ指定箇所のみ・新項目値の位置',()=>{
  const S=clone(c.defaults),old=b.template(context(b,clone(b.defaults))),out=c.template(context(c,S));
  const expected=id==='godzieva2'?old.replace('■エンディング中ボイス\nシンジ▶︎ 0回\nアスカ▶︎ 0回\nミサト▶︎ 0回\nゲンドウ▶︎ 0回\nカヲル▶︎ 0回','■エンディング中ボイス\nシンジ▶︎ 0回\nミサト▶︎ 0回\nマリ▶︎ 0回\nアスカ▶︎ 0回\nレイ▶︎ 0回\n加持▶︎ 0回\nゲンドウ▶︎ 0回\nカヲル▶︎ 0回'):old.replace('6確　　▶︎ 0回\n\n■エンディング','6確　　▶︎ 0回\n\n■狩れカットイン\nｴﾝﾀﾗｲｵﾝ▶︎ 0回\n\n■エンディング');
  assert.equal(out,expected);
  for(const [group,key,label] of id==='godzieva2'?[['edVoice','mari','マリ'],['edVoice','rei','レイ'],['edVoice','kaji','加持']]:[['kareCut','entalion','ｴﾝﾀﾗｲｵﾝ']]){
   const T=clone(S);T[group][key]=1;assert.equal(c.template(context(c,T)),out.replace(label+'▶︎ 0回',label+'▶︎ 1回'));
  }
  if(id==='godzieva2'){S.endVoice.mari=7;assert.equal(c.template(context(c,S)),out);}
 });
 check(id+' カード左右5行・下端936px以内',()=>{
  const bottom=c.card.bottom(context(c,clone(c.defaults)));for(const col of bottom.columns){assert.ok(col.items.length<=5);assert.ok(bottom.startY+(col.items.length-1)*bottom.rowGap<=936);}
 });
}
check('ゴジエヴァ2 CERT8項目・否定・詳細比率',()=>{
 const c=configs.godzieva2;
 for(const [group,keys] of [['endScreen',{reiBg:2,godzillaShogoki:4,allStars:5,kaworu:6}],['edVoice',{rei:2,kaji:4,gendo:5,kaworu:6}]])for(const [key,rank] of Object.entries(keys)){
  const S=clone(c.defaults);S[group][key]=1;const ctx=context(c,S);
  const names={reiBg:'レイ背景',godzillaShogoki:'ゴジラ＆初号機',allStars:'全員集合',kaworu:'カヲル',rei:'レイ',kaji:'加持',gendo:'ゲンドウ'};
  assert.ok(c.card.bottom(ctx).columns[0].items[0].text.includes((group==='endScreen'?'終了':'ED')+names[key]));
  assert.ok(JSON.stringify(c.card.blocks(ctx)).includes('計1回'));assert.ok(c.card.bottom(ctx).columns[0].items[0].text.includes(rank===6?'6濃厚':rank+'以上'));
 }
 const S=clone(c.defaults);S.endScreen.mothra=1;S.endScreen.xrei=2;S.endVoice.mari=3;
 const ctx=context(c,S);assert.equal(c.card.bottom(ctx).columns[0].items[1].text,'否定 設1・2・3・4');assert.ok(JSON.stringify(c.card.blocks(ctx)).includes('計0回'));
 const d=c.card.detail(ctx);for(const title of ['終了画面','終了ボイス','EDボイス'])assert.equal(d.find(x=>x.title===title).percent,true);
 assert.equal(d.find(x=>x.title==='終了ボイス').denominator,3);
 const h=c.pages(ctx,()=> '')[1]();assert.ok(h.indexOf('ボーナス・AT終了画面')<h.indexOf('終了画面のボイス'));assert.ok(h.indexOf('終了画面のボイス')<h.indexOf('エンディング中ボイス'));assert.equal((h.match(/<summary>説明を見る<\/summary>/g)||[]).length,2);
});
check('サンブレイク 目安5行・説明・独立CERT・pre-ext分離',()=>{
 const c=configs.mhsunbreak,S=clone(c.defaults),ctx=context(c,S),h=c.pages(ctx,()=> '')[0]().replace(/<[^>]*>/g,'');
 for(const text of ['設1:9.8%⇔設6:16.4%','設1:33.2%⇔設6:42.2%','設1:66.8%⇔設6:78.9%','設1:66.8%⇔設6:76.6%','設1:20.0%⇔設6:39.5%','状態がはっきりしないときは記録しません。','AT後も規定リプレイポイントは引き継がれます。','別々の根拠として二重に数えません。'])assert.ok(h.includes(text),text);
 assert.equal((h.match(/設1:33.2%⇔設6:42.2%/g)||[]).length,2);
 S.kareCut.entalion=1;assert.equal(S.atEnd.entalion,0);assert.ok(JSON.stringify(c.card.blocks(ctx)).includes('計1回'));assert.ok(c.card.bottom(ctx).columns[0].items[0].text.includes('6濃厚'));
 assert.ok(!c.card.detail(ctx).find(x=>x.title.includes('狩れ')).percent);
 const storage=new Map([['mhsunbreak-checker-v1','{"production":7}'],['mhsunbreak-checker-v1-test','{"games":7}']]);
 load(read('checker-data/mhsunbreak-test.js'),'mhsunbreak-test',storage).normalizeState({});assert.equal(storage.get('mhsunbreak-checker-v1-test-pre-ext'),'{"games":7}');assert.ok(!storage.has('mhsunbreak-checker-v1-pre-ext'));assert.equal(storage.get('mhsunbreak-checker-v1'),'{"production":7}');
});
check('構文・LF・保護ファイル・導線なし',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'addl-1106b-syntax-'));
 for(const id of Object.keys(configs)){
  const html=read(id+'-test-checker.html');assert.ok(!html.includes('\r'));assert.ok(!read('checker-data/'+id+'-test.js').includes('\r'));
  execFileSync(process.execPath,['--check',path.join(root,'checker-data/'+id+'-test.js')]);
  for(const [i,m] of [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(dir,id+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
  for(const p of ['index.html','checkers.html','sitemap.xml'])assert.ok(!read(p).includes(id+'-test-checker.html'));
 }
 assert.equal(git('diff','HEAD','--','checker-engine.js','index.html','checkers.html','sitemap.xml','IDEAS.md','AGENTS.md','mhsunbreak-bz-import.html','docs/specs/*-nana-template-*.txt'),'');
});

// 各表は既存説明の中に置き、全セルを検査する。
check('サンブレイク 参照表4種の全設定値',()=>{
 const c=configs.mhsunbreak,h=c.pages(context(c,clone(c.defaults)),()=> '').map(p=>p()).join('');
 assert.equal(c.pages(context(c,clone(c.defaults)),()=> '').length,4);assert.ok(!h.includes('参照タブ'));
 const tables=[
  ['レア役のBZ当選率（弱レア）',[
   ['9.8','33.2','66.8'],['10.5','34.4','67.6'],['11.7','35.9','69.5'],['14.1','38.3','76.6'],['14.8','40.2','77.3'],['16.4','42.2','78.9']]],
  ['レア役のBZ当選率（強レア）',[
   ['33.2','66.8','BZ濃厚'],['34.4','68.0','BZ濃厚'],['35.9','69.5','BZ濃厚'],['38.3','71.9','BZ濃厚'],['40.2','74.2','BZ濃厚'],['42.2','76.6','BZ濃厚']]],
  ['規定周期の振り分け（オトモ潜水艇の規定周期）',[
   ['20.0','20.0','20.0','20.0','20.0'],['20.3','21.1','20.7','18.4','19.5'],['20.7','22.7','21.5','16.4','18.8'],
   ['22.3','26.6','23.0','13.7','14.5'],['23.4','28.5','23.8','11.7','12.5'],['25.0','30.5','25.0','9.8','9.8']]],
  ['規定周期到達時のCZ種別',[['80.0','20.0'],['78.5','21.5'],['75.8','24.2'],['71.9','28.1'],['67.2','32.8'],['60.5','39.5']]],
  ['猛焔一閃 段階1（レア役でのBZ当選時）',[['0.4','1.6'],['0.4','2.0'],['0.4','2.7'],['0.8','3.9'],['1.2','5.5'],['2.0','7.8']]],
  ['猛焔一閃 段階2（レア役・規定リプレイでのBZ当選時）',Array.from({length:6},()=>['0.4'])],
  ['猛焔一閃 実質の直撃確率',['16281.7','14875.5','12788.0','8702.1','6351.2','4263.1'].map(v=>['1/'+v])]

 ];
 for(const [title,rows] of tables){
  const fold=[...h.matchAll(/<details class="hint-fold">([\s\S]*?)<\/details>/g)].map(m=>m[1]).find(body=>body.includes('<caption>'+title+'</caption>'));
  assert.ok(fold,'説明を見る内の表: '+title);
  const section=[...fold.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/g)].map(m=>m[1]).find(t=>t.includes('<caption>'+title+'</caption>'));
  const rendered=[...section.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m=>[...m[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g)].map(x=>x[1].replace(/<[^>]+>/g,'').trim()));
  rows.forEach((values,i)=>assert.ok(rendered.some(cells=>cells[0]==='設定'+(i+1)&&values.every((v,j)=>cells[j+1]===(v.startsWith('1/')||v==='BZ濃厚'?v:v+'%'))),title+' 設定'+(i+1)));
 }
});

console.log(`VM checks: ${checks} passed`);

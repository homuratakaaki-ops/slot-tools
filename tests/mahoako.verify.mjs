// node tests/mahoako.verify.mjs — 仕様書 v0.1 の独立期待値による検証。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const box={window:{}};vm.createContext(box);
vm.runInContext(read('checker-bayes.js'),box);vm.runInContext(read('checker-data/mahoako.js'),box);
const c=box.window.CheckerConfigs.mahoako,estimate=box.window.CheckerBayes.estimate;
let last,checks=0,failures=0;
box.window.CheckerBayes.estimate=spec=>{const r=estimate(spec);last={spec:clone(spec),r:clone(r)};return r;};
const fresh=()=>c.normalizeState(clone(c.defaults));
function ctx(S){return {S,pct:(v,d)=>d>0?(100*v/d).toFixed(0)+'%':'−',crow:(key,label,sub,hot,pct)=>{
  const [group,id]=key.split('.');return `<div data-c="${key}"><b>${label}</b><small>${sub}</small><span class="pct">${pct?pct(S[group][id]):''}</span></div>`;
}};}
const pages=S=>c.pages(ctx(S),()=> '');
function bayes(S){pages(S)[2]();return last;}
function check(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
const exclusionCases=[
  ['bbScreens','s08',[1]],['bbScreens','s09',[1,2,3]],['bbScreens','s10',[1,2,3,4]],['bbScreens','s11',[1,2,3,4,5]],
  ['trophy','bronze',[1]],['trophy','silver',[1,2]],['trophy','gold',[1,2,3]],['trophy','tiger',[1,2,3,4]],['trophy','rainbow',[1,2,3,4,5]],
  ['over','o246',[1,3,5]],['over','o456',[1,2,3]],['over','o555',[1,2,3,4]],['over','o666',[1,2,3,4,5]],
  ['rbThird','sista',[1]],['rbThird','lord',[1,2]],['rbThird','baeze2',[1,2,3,4]],['rbFlag','vatz',[2]]
];
for(const [group,id,excluded] of exclusionCases)check('exclusion '+group+'.'+id,()=>{
  const S=fresh();S[group][id]=1;const b=bayes(S);
  assert.equal(b.spec.exclusions.length,17);assert.ok(!b.r.contradiction);
  assert.deepEqual(b.spec.exclusions.filter(e=>e.count>0).map(e=>e.exclude),[excluded]);
  for(const s of [1,2,3,4,5,6])assert.equal(b.r.posterior[s]===0,excluded.includes(s));
});
check('CZ 30/8000 + tm20/pa10: independent likelihood',()=>{
  const S=fresh();S.currentGames=8000;S.counts.cz=30;S.czType.tm=20;S.czType.pa=10;
  const b=bayes(S),den=[357,333.8,310.7,273.3,243,235.4],tm=[.758,.754,.734,.676,.656,.648],pa=[.238,.242,.262,.316,.336,.344],ve=[.004,.004,.004,.008,.008,.008];
  assert.equal(b.spec.binomial.length,1);assert.equal(b.spec.binomial[0].label,'CZ');
  assert.deepEqual(b.spec.multinomial[0].counts,[20,10,0]);assert.equal(b.spec.multinomial[0].label,'CZ種別');
  const logs=den.map((d,i)=>30*Math.log(1/d)+7970*Math.log1p(-1/d)+20*Math.log(tm[i])+10*Math.log(pa[i]));
  const weights=logs.map(v=>Math.exp(v-Math.max(...logs))),z=weights.reduce((a,b)=>a+b,0);
  for(let i=0;i<6;i++){
    assert.deepEqual(b.spec.multinomial[0].probs[i+1],[tm[i],pa[i],ve[i]]);
    assert.equal(b.spec.binomial[0].probs[i+1],1/den[i]);
    assert.ok(Math.abs(b.r.posterior[i+1]-weights[i]/z)<1e-12);
  }
  assert.ok(!b.r.contradiction&&!b.r.empty);assert.notEqual(b.r.posterior[1],b.r.posterior[6]);
  S.counts.atBonus=300;S.counts.atOther=400;S.counts.atUnknown=500;S.czType.unknown=600;
  assert.deepEqual(bayes(S),b,'AT初当り・不明は推定に混ぜない');
});
check('empty / unknown-only / qualitative hints / negative G',()=>{
  const S=fresh();assert.equal(bayes(S).r.empty,true);
  for(const group of c.mergeKeys)if('unknown' in S[group])S[group].unknown=10;
  S.bbScreens.s04=7;S.rbThird.rivalTres=5;S.rbFlag.venarita=2;S.panel.magenta=8;S.smb.ep3=9;
  assert.equal(bayes(S).r.empty,true);S.startGames=100;S.currentGames=50;
  assert.equal(bayes(S).spec.binomial.length,0);assert.match(pages(S)[0](),/下回っています/);
});
check('contradiction: 246 + 555 + vatz leaves 6; 2-only conflict',()=>{
  const S=fresh();S.over.o246=1;S.over.o555=1;S.rbFlag.vatz=1;
  assert.equal(bayes(S).r.posterior[6],1);
  // 17本の条件では設定6を除外する項目が無いため、除外だけの全設定矛盾は起こらない。
  S.currentGames=1;S.counts.cz=2;
  assert.equal(bayes(S).r.contradiction,true);assert.match(pages(S)[2](),/記録に矛盾があります（示唆の見間違いの可能性）/);
});
// 詳細カードの見出しはカード専用の短名（2026-10-19 ネネ検収⑦）。
const percentGroups={czType:'CZ種別',bbScreens:'終了画面',trophy:'トロフィー',over:'獲得枚数',panel:'パネル',smb:'SMボーナス'};
for(const [key,title] of Object.entries(percentGroups))check('known denominator '+key,()=>{
  const S=fresh(),ids=Object.keys(S[key]).filter(k=>k!=='unknown');S[key][ids[0]]=2;S[key][ids[1]]=1;S[key].unknown=9;S[key].future=500;
  const html=pages(S)[key==='czType'?0:1]();
  assert.ok(html.includes(`data-c="${key}.${ids[0]}"><b>`));
  const pct=id=>html.split(`data-c="${key}.${id}"`)[1].split('</div>')[0].match(/class="pct">(.*?)<\/span>/)[1];
  assert.equal(pct(ids[0]),'67%');assert.equal(pct(ids[1]),'33%');assert.equal(pct('unknown'),'');
  const d=c.card.detail(ctx(S)).find(s=>s.title===title);assert.equal(d.denominator,3);assert.equal(d.percent,true);
  assert.equal(d.items.find(i=>i.label===(key==='czType'?'種別不明':'不明')).text,(key==='czType'?'種別不明':'不明')+' ×9');
  assert.match(c.template(ctx(S)),/2回 \(67%\)/);
  S[key][ids[0]]=S[key][ids[1]]=0;assert.equal(c.card.detail(ctx(S)).find(s=>s.title===title).denominator,0);
  assert.ok(!c.template(ctx(S)).includes('%'));
});
check('RB: three groups, labels, no percentages',()=>{
  const S=fresh();
  assert.deepEqual(Object.keys(S.rbTeam),['eno3','tres3','eno2','tres2','unknown']);
  assert.deepEqual(Object.keys(S.rbThird),['loco','rubel','sista','lord','baeze2','rivalTres','rivalEno','unknown']);
  const rbHtml=pages(S)[1]();
  for(const [id,name,mean] of [
    ['rbTeam.eno3','エノルミータ3人','奇数設定 期待度UP'],['rbTeam.tres3','トレスマジア3人','偶数設定 期待度UP'],
    ['rbTeam.eno2','エノルミータ2人＋1人','3人目で示唆が決まる'],['rbTeam.tres2','トレスマジア2人＋1人','3人目で示唆が決まる'],
    ['rbThird.loco','ロコムジカ','2人側の奇偶 期待度UP＋高設定 期待度UP（弱）'],['rbThird.rubel','ルベルブルーメ','2人側の奇偶 期待度UP＋高設定 期待度UP（弱）'],
    ['rbThird.sista','シスタギガント','2人側の奇偶 期待度UP＋設定2以上濃厚'],['rbThird.lord','ロードエノルメ','2人側の奇偶 期待度UP＋設定3以上濃厚'],
    ['rbThird.baeze2','マジアベーゼ第二形態','2人側の奇偶 期待度UP＋設定5以上濃厚'],
    ['rbThird.rivalTres','3人目トレスマジア（エノルミータ2人のとき）','偶数設定 期待度UP＋高設定 期待度UP（強）'],
    ['rbThird.rivalEno','3人目エノルミータ（トレスマジア2人のとき）','奇数設定 期待度UP＋高設定 期待度UP（強）']
  ]){const seg=rbHtml.split(`data-c="${id}"`)[1];assert.ok(seg&&seg.includes(`>${name}<`)&&seg.includes(`>${mean}<`),id);}
  assert.ok(rbHtml.includes('2人＋1人のときの奇数・偶数は、2人側のチームで見ます（エノルミータ2人＝奇数、トレスマジア2人＝偶数）。3人目が相手チームのときだけ逆になります。'));
  for(const key of ['rbTeam','rbThird','rbFlag'])for(const id of Object.keys(S[key]))S[key][id]=1;
  const html=pages(S)[1]();
  for(const key of ['rbTeam','rbThird','rbFlag'])for(const id of Object.keys(S[key]))assert.equal(html.split(`data-c="${key}.${id}"`)[1].split('</div>')[0].match(/class="pct">(.*?)<\/span>/)[1],'');
  assert.ok(c.card.detail(ctx(S)).filter(s=>s.title.startsWith('RB')).every(s=>s.percent===false&&!s.denominator));
});
check('template/detail cover every section and nonzero row',()=>{
  const S=fresh();S.currentGames=8000;
  for(const key of c.mergeKeys)for(const id of Object.keys(S[key]))S[key][id]=1;
  const t=c.template(ctx(S)),detail=c.card.detail(ctx(S));assert.equal(detail.length,10);
  // テンプレは画面の表示名、詳細カードは短名。並び順を揃え、短名は対応表で元の表示名へ戻して照合する。
  const screenTitles=['カウント系','CZ種別','ボーナス終了画面','ギンちゃんトロフィー','獲得枚数表示','RB中のキャラ紹介（構成）','RB中のキャラ紹介（3人目）','RB中のキャラ紹介（出現）','パネルアタックのキャラ','SMボーナスのエピソード'];
  assert.equal(JSON.stringify(detail.map(sec=>sec.title)),JSON.stringify(['カウント系','CZ種別','終了画面','トロフィー','獲得枚数','RB構成','RB 3人目','RB出現','パネル','SMボーナス']));
  const longName={'エノ3人':'エノルミータ3人','トレス3人':'トレスマジア3人','エノ2人＋1人':'エノルミータ2人＋1人','トレス2人＋1人':'トレスマジア2人＋1人','3人目トレス（エノ2人）':'3人目トレスマジア（エノルミータ2人のとき）','3人目エノ（トレス2人）':'3人目エノルミータ（トレスマジア2人のとき）','ベーゼ第二形態':'マジアベーゼ第二形態','悪の女幹部':'悪の女幹部、誕生！？','やっぱり魔法少女':'やっぱり魔法少女にあこがれて'};
  detail.forEach((sec,i)=>{assert.ok(t.includes('■'+screenTitles[i]),screenTitles[i]);for(const item of sec.items){assert.ok(t.includes((longName[item.label]||item.label)+'▶'),item.label);}});
  assert.ok(!t.includes('■SMボーナス\n')&&!t.includes('悪の女幹部▶'));
  assert.ok(t.startsWith('設定判別メモ｜L 魔法少女にあこがれて'));
  assert.ok(t.endsWith('by slot-tools.jp\n解析出典:ちょんぼりすた様'));assert.equal(c.compactTemplate(ctx(S)),t);
  assert.ok(!c.template(ctx(fresh())).includes('■'));
  assert.equal(c.card.chart(ctx(S)).items.length,3);assert.equal(c.card.blocks(ctx(S))[2][1],'67%');
  const bottom=c.card.bottom(ctx(S));assert.equal(bottom.startY,760);assert.equal(bottom.rowGap,44);assert.equal(bottom.fontSize,22);
  assert.deepEqual(Array.from(bottom.columns,col=>col.x),[70,560]);
  S.bbScreens.s11=0;S.over.o666=0;S.trophy.rainbow=0;
  const only=fresh();only.over.o246=1;only.rbFlag.vatz=1;
  assert.equal(c.card.bottom(ctx(only)).columns[0].items[0].text,'確定演出 246枚OVER(2・4・6) ×1','246枚OVERは確定演出、ヴァーツ（否定）は数えない');
  assert.equal(c.card.blocks(ctx(only))[3][1],'計1回');
  const vatzOnly=fresh();vatzOnly.rbFlag.vatz=1;
  assert.equal(c.card.bottom(ctx(vatzOnly)).columns[0].items[0].text,'確定演出 なし');assert.equal(c.card.blocks(ctx(vatzOnly))[3][1],'計0回');
});
check('normalize: missing/default/invalid/fractional/future/idempotent',()=>{
  const S={startGames:-4,currentGames:'8000.9',counts:{cz:'3.8',atOther:-2,atBonus:Infinity},bbScreens:{s08:NaN,future:4.8},futureRoot:'keep'};
  const a=c.normalizeState(S),b=c.normalizeState(clone(a));assert.deepEqual(clone(a),clone(b));
  assert.equal(a.counts.cz,3);assert.equal(a.counts.atOther,0);assert.equal(a.counts.atBonus,0);assert.equal(a.bbScreens.s08,0);assert.equal(a.bbScreens.future,4);
  assert.equal(a.currentGames,8000);assert.equal(a.startGames,0);assert.equal(a.futureRoot,'keep');
  for(const key of c.mergeKeys)for(const id of Object.keys(c.defaults[key]))assert.ok(Number.isInteger(a[key][id])&&a[key][id]>=0);
  assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));
});
check('HTML shell, source, noindex, guide, LF, syntax',()=>{
  assert.equal(c.storageKey,'mahoako-checker-v1');assert.equal(c.uiV2,true);assert.equal(c.nanaCollab,false);
  assert.equal(c.sourceUrl,'https://chonborista.com/slot/newgin-slot/264698/');
  const html=read('mahoako-checker.html'),guide=read('mahoako-guide.html');
  assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','設定推測','参照','カード']);
  for(const s of ['checker-engine.js?v=20260924','checker-bayes.js?v=20260827-2','checker-data/mahoako.js?v=20261019','CheckerEngine.mount(CheckerConfigs.mahoako);','mahoako-guide.html'])assert.ok(html.includes(s),s);
  assert.equal(html.match(/<style>[\s\S]*?<\/style>/)[0],read('garei-zero-re-checker.html').match(/<style>[\s\S]*?<\/style>/)[0]);
  assert.equal(guide.match(/<style>[\s\S]*?<\/style>/)[0],read('garei-zero-re-guide.html').match(/<style>[\s\S]*?<\/style>/)[0]);
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mahoako-syntax-'));
  for(const [i,p] of ['mahoako-checker.html','mahoako-guide.html'].entries()){
    const src=read(p);assert.ok(src.includes('<meta name="robots" content="noindex,nofollow">'));
    assert.ok(src.includes(`href="https://slot-tools.jp/${p}"`));assert.ok(src.includes(`content="https://slot-tools.jp/${p}"`));
    assert.ok(!src.includes('\r'));
    for(const [j,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){
      const f=path.join(tmp,`${i}-${j}.mjs`);fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);
    }
  }
  for(const p of ['index.html','checkers.html','sitemap.xml'])assert.ok(!read(p).includes('mahoako'));
  assert.ok(!read('checker-data/mahoako.js').includes('\r'));
  assert.doesNotMatch(read('checker-data/mahoako.js'),/\(\?<([=!])/);
  assert.doesNotMatch(pages(fresh())[3](),/設定差なし/);
});
console.log(`mahoako: ${checks} passed / ${failures} failed`);
if(failures)process.exitCode=1;

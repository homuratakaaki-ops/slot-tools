// Run: node tests/mhsunbreak-setting-diff.verify.mjs
// 設定別解析の反映・周期3ボタン化・CZ種別の契機別表示（2026/10/22）。
// 旧データの互換（既存値・未知キーの保持、テンプレのバイト一致、正規化の冪等）と、新しい入力の集計を確かめる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const clone=v=>JSON.parse(JSON.stringify(v));
const BASE='3fd3f65';   // 改修前の main（PR #78 のマージ）
const show=spec=>execFileSync('git',['show',spec],{cwd:root,encoding:'utf8',maxBuffer:4e6});
function load(code){const box={window:{CheckerConfigs:{},localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}}};vm.runInNewContext(code,box);return box.window.CheckerConfigs.mhsunbreak;}
const src=fs.readFileSync(new URL('checker-data/mhsunbreak.js',root),'utf8');
const config=load(src),before=load(show(BASE+':checker-data/mhsunbreak.js'));
const ctx=(S,mode=1)=>({S,mode,nanaCreditText:()=>'',pct:(n,d)=>d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:`${n}/0 —`,
  crow:(path,name)=>`<div class="crow" data-c="${path}" data-l="${name}"><button class="plus">${mode<0?'−':'＋'}</button></div>`,get:()=>0});
const card=(cfg,S)=>JSON.stringify(Object.fromEntries(['blocks','chart','bottom','detail'].map(k=>[k,cfg.card[k](ctx(clone(S)))])));
let checks=0;const test=(label,fn)=>{fn();checks++;console.log('PASS '+label);};
const sumN=S=>Object.entries(S.bz).filter(([k])=>k.endsWith('N')).reduce((a,[,v])=>a+v,0);

// 旧データ（新キーなし）。cycle・czType・レア役BZ（N>0）に値があり、未知キーも持つ
const OLD={
  games:0,hits:[120,480],counts:{at:2},
  bz:{weakNormalD:20,weakNormalN:3,weakHighD:6,weakHighN:2,strongNormalD:8,strongNormalN:4,strongHighD:2,strongHighN:1},
  cycle:{c1:2,c2:1,c3:3,c4:0,c5:1},czType:{breakzone:12,airou:4},
  atEnd:{jay:1},trophy:{gold:1},
  futureKey:{keep:[1,2,3]},cycleNote:'keep'
};

test('旧データ：既存値と未知キーを保持し、新キーは0・控えは読み込み時点のレア役BZ当選数',()=>{
  const S=config.normalizeState(clone(OLD),clone(OLD));
  for(const key of ['bz','cycle','czType','hits','counts'])assert.deepEqual(clone(S[key]),clone(before.normalizeState(clone(OLD),clone(OLD))[key]),key);
  for(const [k,v] of Object.entries(OLD.bz))assert.equal(S.bz[k],v,k);
  assert.deepEqual(clone(S.cycle),OLD.cycle);assert.deepEqual(clone(S.czType),OLD.czType);
  assert.deepEqual(clone(S.futureKey),{keep:[1,2,3]});assert.equal(S.cycleNote,'keep');
  for(const k of ['cycleD','cycleBz','cycleFuku'])assert.deepEqual(clone(S[k]),{c1:0,c2:0,c3:0,c4:0,c5:0},k);
  assert.equal(S.czTenjo,0);
  assert.equal(S.rareBzBase,10);assert.equal(sumN(S),10);
});

test('旧データ：テンプレ（通常・収支帳用）とカードが改修前とバイト一致（レア役BZ N>0 を含む）',()=>{
  const now=config.normalizeState(clone(OLD),clone(OLD)),was=before.normalizeState(clone(OLD),clone(OLD));
  for(const key of ['template','compactTemplate'])
    assert.deepEqual(Buffer.from(config[key](ctx(clone(now)))),Buffer.from(before[key](ctx(clone(was)))),key);
  assert.equal(card(config,now),card(before,was));
  const t=config.template(ctx(clone(now)));
  assert.match(t,/①周期▶︎ 2回　②周期▶︎ 1回\n③周期▶︎ 3回　④周期▶︎ 0回\n⑤周期▶︎ 1回/);
  assert.match(t,/ブレイクゾーン▶︎ 12回\nアイルー福引　▶︎ 4回/);
});

test('正規化は冪等（旧データ・新データとも）／控えは上書きしない',()=>{
  const once=config.normalizeState(clone(OLD),clone(OLD));
  const twice=config.normalizeState(clone(once),clone(once));
  assert.equal(JSON.stringify(twice),JSON.stringify(once));
  // 控えができたあとにレア役BZが増えても、読み直しで控えは変わらない
  const later=clone(once);later.bz.weakNormalD++;later.bz.weakNormalN++;
  const re=config.normalizeState(clone(later),clone(later));
  assert.equal(re.rareBzBase,10);assert.equal(JSON.stringify(config.normalizeState(clone(re),clone(re))),JSON.stringify(re));
  // 数値でない控えは作り直す
  const bad=clone(once);bad.rareBzBase='10';
  assert.equal(config.normalizeState(clone(bad),clone(bad)).rareBzBase,10);
  // 新規ユーザーは0
  assert.equal(config.normalizeState({},{}).rareBzBase,0);
  assert.equal(config.defaults.rareBzBase,0);
});

test('移行後にレア役BZを1件記録すると、テンプレのBZ値が1だけ増える',()=>{
  const S=config.normalizeState(clone(OLD),clone(OLD));
  const t0=config.template(ctx(clone(S)));
  S.bz.strongHighD++;S.bz.strongHighN++;   // ndRow の［当選］＝ D と N を1ずつ
  const t1=config.template(ctx(clone(S)));
  assert.match(t0,/ブレイクゾーン▶︎ 12回/);assert.match(t1,/ブレイクゾーン▶︎ 13回/);
  // 変わるのはBZの値と、レア役の当選率の行だけ
  const diff=t1.split('\n').filter((l,i)=>l!==t0.split('\n')[i]);
  assert.deepEqual(diff,['通常▶︎ 4/8 ・高確▶︎ 2/3 ・超高▶︎CZ濃厚','ブレイクゾーン▶︎ 13回']);
  // 減算で控えを下回っても合計はマイナスにしない（控えは減らさない）
  const low=clone(S);for(const k of Object.keys(low.bz))if(k.endsWith('N'))low.bz[k]=0;
  const n=config.normalizeState(clone(low),clone(low));
  assert.equal(n.rareBzBase,10);
  assert.match(config.template(ctx(clone(n))),/ブレイクゾーン▶︎ 12回/);
});

test('合計式：BZ＝旧＋周期BZ＋レア役増分＋天井、福引＝旧＋周期福引（テンプレ・カード・詳細カード）',()=>{
  const S=config.normalizeState(clone(OLD),clone(OLD));
  S.cycleD={c1:3,c2:1,c3:0,c4:2,c5:0};S.cycleBz={c1:1,c2:0,c3:0,c4:1,c5:0};S.cycleFuku={c1:1,c2:1,c3:0,c4:0,c5:0};
  S.czTenjo=2;S.bz.weakNormalD+=2;S.bz.weakNormalN+=2;
  const t=config.template(ctx(clone(S)));
  // BZ 12+2+2+2=18、福引 4+2=6
  assert.match(t,/ブレイクゾーン▶︎ 18回\nアイルー福引　▶︎ 6回/);
  // 周期の値は当選（旧＋BZ＋福引）：c1 2+1+1=4、c2 1+0+1=2、c3 3、c4 0+1=1、c5 1
  assert.match(t,/①周期▶︎ 4回　②周期▶︎ 2回\n③周期▶︎ 3回　④周期▶︎ 1回\n⑤周期▶︎ 1回/);
  const detail=config.card.detail(ctx(clone(S)));
  assert.deepEqual(clone(detail.find(s=>s.title==='CZ種別')).items.map(i=>i.value),[18,6]);
  assert.equal(detail.find(s=>s.title==='CZ種別').denominator,24);
  assert.deepEqual(clone(detail.find(s=>s.title==='規定リプレイ周期')).items.map(i=>i.value),[4,2,3,1,1]);
  const bottom=JSON.stringify(config.card.bottom(ctx(clone(S))));
  assert.ok(bottom.includes('周期 ①周期×4・②周期×2・③周期×3・④周期×1・⑤周期×1'),bottom);
  assert.ok(bottom.includes('CZ BZ×18・アイルー×6'),bottom);
});

test('入力タブ：3ボタンの配線・当選／到達・種別未記録・減算の無効化',()=>{
  const S=config.normalizeState(clone(OLD),clone(OLD));
  S.cycleD.c1=3;S.cycleBz.c1=1;S.cycleFuku.c1=1;   // c1：当選 2+1+1=4／到達 2+3=5
  const page=mode=>config.pages(ctx(S,mode),()=> '')[0]();
  const plus=page(1),rowOf=(html,name)=>html.split('<div class="crow cycle-row cyc3">').find(s=>s.includes('<b>'+name+'</b>'));
  const c1=rowOf(plus,'①周期');
  assert.ok(c1.includes('data-bump-many="cycleD.c1,cycleBz.c1"'));
  assert.ok(c1.includes('data-bump-many="cycleD.c1,cycleFuku.c1"'));
  assert.ok(c1.includes('data-bump="cycleD.c1"'));
  assert.ok(c1.includes('<small>4/5 80%</small>'));
  assert.ok(c1.includes('うち種別未記録 2'));
  // 旧記録のない行には「うち種別未記録」を出さない
  assert.ok(!rowOf(plus,'④周期').includes('うち種別未記録'));
  assert.ok(rowOf(plus,'④周期').includes('<small>0/0 —</small>'));
  // 加算モードでは旧 cycle を増やす配線がない
  assert.ok(!/data-bump(?:-many)?="[^"]*\bcycle\.c/.test(plus));
  // 減算：ハズレは到達＞当選（新入力分）のときだけ。c1 は 3>2 なので有効、c3 は 0 で無効
  const minus=page(-1);
  const m1=rowOf(minus,'①周期'),m3=rowOf(minus,'③周期');
  assert.ok(m1.includes('data-bump="cycleD.c1"'));
  assert.ok(!m3.includes('data-bump="cycleD.c3"')&&!m3.includes('data-bump-many'));
  assert.equal((m3.match(/disabled aria-disabled="true"/g)||[]).length,3);
  // 旧記録は減算モードでだけ減らせる
  assert.ok(minus.includes('data-bump="cycle.c1"'));assert.ok(minus.includes('data-bump="cycle.c3"'));
  assert.ok(!minus.includes('data-bump="cycle.c4"'));
  // ハズレの減算で当選＞到達にならない：BZ・福引を埋めると到達＝当選
  S.cycleD.c1=2;
  assert.ok(!rowOf(page(-1),'①周期').includes('data-bump="cycleD.c1"'));
  assert.ok(page(1).includes('規定リプレイ到達ごとに、CZに当選したら種別を、当選しなければハズレを押します。設定1の規定周期の振り分けは①〜⑤が各20%で均等です（他の設定は未公表）。'));
});

test('入力タブ：CZ種別の契機別表示（旧記録は値があるときだけ・減算でだけ減らせる）',()=>{
  const S=config.normalizeState(clone(OLD),clone(OLD));
  S.cycleD.c1=3;S.cycleBz.c1=2;S.cycleFuku.c1=1;S.czTenjo=1;S.bz.weakNormalD++;S.bz.weakNormalN++;
  const page=mode=>config.pages(ctx(S,mode),()=> '')[0]();
  const plus=page(1);
  for(const text of ['規定周期から','レア役から','天井（CZ間333G＋α）から','契機未記録（旧記録）','合計','参考：設定1：BZ 80%・福引 20%',
    '超高確の強レア役（CZ濃厚）は含みません','これより前のレア役BZは旧記録に含まれています','設1:1/111.4⇔設6:1/95.8','設1:1/2290.1⇔設6:1/976.4'])
    assert.ok(plus.includes(text),text);
  assert.ok(plus.includes('data-c="czTenjo"'));
  // 旧記録は加算モードではボタンなし、減算モードで ctx.crow（−）
  assert.ok(!plus.includes('data-c="czType.'));
  assert.ok(page(-1).includes('data-c="czType.breakzone"')&&page(-1).includes('data-c="czType.airou"'));
  // 規定周期から：BZ 2 / 福引 1 → 67% / 33%
  assert.ok(plus.includes('<div class="num">2</div><div class="pct">2/3 67%</div>'));
  // レア役から：増分 1、合計 BZ 12+2+1+1=16
  assert.ok(plus.includes('<div class="nm">ブレイクゾーン</div><div class="mn">設1:1/111.4⇔設6:1/95.8</div></div><div class="num">16</div>'));
  // 旧記録が0なら契機未記録の見出しも出さない／控えが0なら注記を出さない
  const fresh=config.normalizeState({},{});
  const fp=config.pages(ctx(fresh,1),()=> '')[0]();
  assert.ok(!fp.includes('契機未記録（旧記録）'));assert.ok(!fp.includes('これより前のレア役BZ'));
  const one=clone(fresh);one.czType.airou=1;
  const op=config.pages(ctx(one,1),()=> '')[0]();
  assert.ok(op.includes('契機未記録（旧記録）')&&op.includes('<div class="nm">アイルー福引</div></div><div class="num">1</div>'));
});

test('BZタブ：獲得アイコン別のクエスト成功率（pos有無・対象外アイコン混在の手計算一致）',()=>{
  const bz=(table,r,pos)=>Object.assign({t:'bz',table,r},pos?{pos}:{});
  const events1=[
    bz('t1','miss',1),   // QUEST青 ×
    bz('t1','win',3),    // QUEST黄 ○
    bz('t2','miss',3),   // ライゼクス ×
    bz('t3','win',1),    // ライゼクス ○
    bz('t3','win',9),    // AT（対象外）
    bz('t3','win',10),   // ＋G（対象外）
    bz('t4','win',11),   // 猛焔一閃（対象外）
    bz('t4','miss'),     // 未記録
    {t:'eye',c:'jay'},
    bz('t6','win',1)     // テオ ○ → AT間を閉じる
  ];
  const events2=[bz('t5','miss',1),bz('t5','miss',2),bz('t2','miss'),bz('t7','win',1)];   // オロ×2、未記録1、AT（対象外）
  const S=config.normalizeState({atLog:{sessions:[{start:{known:true,prior:0},events:events1,closed:true},{start:{known:true,prior:0},events:events2,closed:true},{start:{known:true,prior:0},events:[],closed:false}]},
    bzBase:{bzT1:{t1:5},bzT2:{},questN1:{t1:2},questN2:{}}},{});
  const html=config.pages(ctx(S,1),()=> '')[2]();
  const rows=[...html.matchAll(/<div class="qi-row"[^>]*><span class="qi-name">([^<]+)<\/span><span>([^<]+)<\/span><span class="qi-pct">([^<]+)<\/span><span class="qi-diff">([^<]+)<\/span><\/div>/g)].map(m=>m.slice(1));
  assert.deepEqual(rows,[
    ['QUEST青','0/1','0.0%','0.4%⇔3.1%'],
    ['QUEST黄','1/1','100.0%','1.6%⇔7.8%'],
    ['ライゼクス','1/2','50.0%','30.1%⇔39.8%'],
    ['セルレギオス','0/0','—','44.9%⇔54.7%'],
    ['オロミドロ亜種','0/2','0.0%','59.8%⇔69.5%'],
    ['テオ・テスカトル','1/1','100.0%','75.0%⇔79.7%']
  ]);
  assert.ok(html.includes('<div class="hint" data-fold="no">結果アイコン未記録のBZ 2件、履歴のない累計分は含みません。</div>'));
  // テンプレ・カードには出さない
  assert.ok(!config.template(ctx(clone(S))).includes('獲得アイコン'));
  assert.ok(!card(config,S).includes('獲得アイコン'));
});

test('猛焔一閃直撃のhint・参照クエリ',()=>{
  assert.ok(src.includes('専用の記録ボタンはありません。出現率は設1:1/16281.7⇔設6:1/4263.1（一撃）。</div>'));
  const html=fs.readFileSync(new URL('mhsunbreak-checker.html',root),'utf8');
  assert.ok(html.includes('<script src="checker-data/mhsunbreak.js?v=20261022"></script>'));
});

test('共通ファイルは変更しない',()=>{
  assert.equal(fs.readFileSync(new URL('checker-engine.js',root),'utf8'),show(BASE+':checker-engine.js'));
});

console.log(`PASS mhsunbreak setting diff: ${checks} checks`);

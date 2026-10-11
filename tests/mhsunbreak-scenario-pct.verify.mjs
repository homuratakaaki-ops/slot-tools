// モンハンサンブレイク BZシナリオ候補の「参考％（設定1基準）」。
// 候補の絞り込み（消去法）は従来どおりで、残った候補に設定1基準の割合を添えるだけ。
// 仕様書は docs/specs/mhsunbreak-scenario-pct-v01.md。
//
// 正解は、実装の定数を一切使わず、この中で出典の表を手で転記して作る（二重転記で誤りを拾う）。
// 長さ1〜4のBZ列（7+49+343+2401=2800通り）と、長さ1〜3×開始 prior 0〜6 を実装と突き合わせる。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const repo=decodeURIComponent(root.pathname).replace(/^[/]/,'');
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=read('checker-data/mhsunbreak.js');
const load=src=>{const box={window:{},document:{getElementById:()=>null},setTimeout:()=>0};vm.runInNewContext(src,box);return box.window.CheckerConfigs.mhsunbreak;};
const config=load(source);
const clone=v=>JSON.parse(JSON.stringify(v));
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const BASE='e354c25';   // 改修前の main（PR #43 のマージ）
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

// ===== 正解側（手で転記。実装の定数は使わない）=====
// 出典: 一撃様 https://1geki.jp/slot/l_mh_sun/48/ ・ ちょんぼりすた様 https://chonborista.com/slot/enta-slot/264514/
// 2026-10-11 に両者を照合し、シナリオ×回数のレベル／レベル別のテーブル振り分け／
// シナリオ選択率【設定1】のすべてが一致することを確認した。
// [シナリオ, 1〜7回目のBZレベル（表の「−」は列を置かない）, 選択率【設定1】%]
const ROWS=[
  ['A','MID LOW LOW HI  LOW LOW SP',32.0],
  ['B','MID LOW HI  LOW LOW HI  SP',27.3],
  ['C','MID HI  LOW HI  LOW HI  SP',14.1],
  ['D','MID LOW LOW HI  HI  HI  SP',12.5],
  ['E','MID LOW HI  HI  HI  HI  SP',6.3],
  ['F','MID HI  HI  HI  HI  HI  SP',3.1],
  ['G','HI  HI  HI  HI  HI  HI  SP',3.1],
  ['H','LOW LOW SP',0.8],
  ['I','MID MID SP',0.8]
];
const NAMES=ROWS.map(r=>r[0]);
const LV=Object.fromEntries(ROWS.map(r=>[r[0],r[1].trim().split(/\s+/)]));
const P1=Object.fromEntries(ROWS.map(r=>[r[0],r[2]]));
// BZレベル別のテーブル振り分け（％）。出典の表の空欄は 0 で置く
const SHARE_ROWS=[
  ['t1',84.0,0,0,0],
  ['t2',9.8,50.0,0,0],
  ['t3',6.3,48.4,88.7,0],
  ['t4',0,1.6,7.8,0],
  ['t5',0,0,2.7,0],
  ['t6',0,0,0.4,0],
  ['t7',0,0,0.4,100]
];
const ORDER=['LOW','MID','HI','SP'];
const SHARE={};
for(const [t,...v] of SHARE_ROWS)SHARE[t]=Object.fromEntries(ORDER.map((lv,i)=>[lv,v[i]]));
const TABLES=SHARE_ROWS.map(r=>r[0]);
const MAX_NO=7;
assert.deepEqual(NAMES,['A','B','C','D','E','F','G','H','I'],'転記したシナリオ名が9つそろっていない');

// 候補（消去法）。開始が分かっている前提で、BZだけで絞る場合の正解
const expectedCand=(seq,prior)=>NAMES.filter(name=>seq.every((t,i)=>{
  const no=prior+i+1;
  if(no>MAX_NO)return true;           // 表の範囲外は絞らない
  const lv=LV[name][no-1]||'';
  return !!lv&&SHARE[t][lv]>0;
}));
// 与えた候補集合での参考％（重み＝選択率×各回の振り分け率。8回目以降は掛けない）
function pctFor(cand,seq,prior){
  const w=cand.map(name=>seq.reduce((acc,t,i)=>{
    const no=prior+i+1;
    return no>MAX_NO?acc:acc*SHARE[t][LV[name][no-1]];
  },P1[name]));
  const sum=w.reduce((a,b)=>a+b,0);
  return cand.map((name,i)=>{
    const share=w[i]/sum*100;
    return name+' '+(share<0.5?'1%未満':Math.round(share)+'%');
  }).join(' ／ ');
}
// 参考％。候補が2つ以上のときだけ出す
function expectedPct(seq,prior){
  const cand=expectedCand(seq,prior);
  return cand.length<2?null:pctFor(cand,seq,prior);
}

// ===== 実装側の状態づくり =====
const bz=t=>({t:'bz',table:t,r:'miss'});
const one=(events,start)=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[{start:start||{known:true,prior:0},events,closed:false}]};
  config.normalizeState(S);
  return S;
};
// 画面・カードに出る文字列（null なら％を出していない）
const pctOf=(S,session)=>{
  const list=config.scenarioPct(S,session||S.atLog.sessions[0]);
  return list?list.map(c=>c.name+' '+c.text).join(' ／ '):null;
};
const lineOf=S=>{
  const html=config.pages(ctx(S),()=>'[CARD]')[2]();
  const m=html.match(/<div class="at-sc([^"]*)">([^<]*)<\/div>/);
  return m?m[2]:null;
};

test('a. 長さ1〜4のBZ列 2800通りで、独立計算した％と一致する',()=>{
  let count=0,withPct=0,noPct=0;
  const walk=seq=>{
    if(seq.length){
      count++;
      const S=one(seq.map(bz));
      const got=pctOf(S),want=expectedPct(seq,0);
      assert.equal(got,want,JSON.stringify(seq)+' の％が一致しない');
      if(want)withPct++;else noPct++;
    }
    if(seq.length>=4)return;
    for(const t of TABLES)walk(seq.concat(t));
  };
  walk([]);
  assert.equal(count,2800,'2800通りになっていない: '+count);
  assert.ok(withPct>0&&noPct>0,'％を出す列と出さない列の両方が無い');
  console.log('  2800通り：％を出した '+withPct+'件／出さなかった '+noPct+'件');
});

test('b. 長さ1〜3のBZ列 × 開始 prior 0〜6（2793通り）でも一致する',()=>{
  let count=0,over=0;
  const walk=seq=>{
    if(seq.length){
      for(let prior=0;prior<=6;prior++){
        count++;
        const S=one(seq.map(bz),{known:true,prior});
        assert.equal(pctOf(S),expectedPct(seq,prior),JSON.stringify(seq)+' prior'+prior+' の％が一致しない');
        if(prior+seq.length>7)over++;
      }
    }
    if(seq.length>=3)return;
    for(const t of TABLES)walk(seq.concat(t));
  };
  walk([]);
  assert.equal(count,399*7,'通り数が合わない: '+count);
  assert.ok(over>0,'8回目以降に掛かる組合せが無い');
  console.log('  '+count+'通り（うち8回目以降に掛かる '+over+'件）');
});

test('c. 8回目以降のBZは重みに使わない（7回目までと同じ％になる）',()=>{
  // 1回目③ → 既にBZ6回の開始で2件目が8回目になる列。8回目のテーブルを変えても％は動かない
  for(const t of TABLES){
    const a=pctOf(one([bz('t3'),bz(t)],{known:true,prior:6}));
    const b=pctOf(one([bz('t3')],{known:true,prior:6}));
    assert.equal(a,b,'8回目の'+t+'で％が動いた');
  }
});

test('d. 出さない条件 a〜d',()=>{
  // a. 開始不明
  assert.equal(pctOf(one([bz('t3'),bz('t4')],{known:false})),null);
  assert.equal(lineOf(one([bz('t3')],{known:false})),'BZ番号が不明のため絞り込めません');
  // b. 候補0件（①→⑤）
  const none=one([bz('t1'),bz('t5')]);
  assert.deepEqual(clone(config.scenarioModel(none).rows[0].candidates),[]);
  assert.equal(pctOf(none),null);
  assert.equal(lineOf(none),'該当なし：開始の選び方・記録を確認してください');
  // d. 候補1件（①＝H だけ／⑤＝G だけ）
  assert.equal(pctOf(one([bz('t1')])),null);
  assert.equal(lineOf(one([bz('t1')])),'シナリオH濃厚：3回目のBZでAT濃厚');
  assert.equal(pctOf(one([bz('t5')])),null);
  assert.equal(lineOf(one([bz('t5')])),'シナリオG濃厚');
  // 記録が1件も無いAT間は候補9つ＝％を出す（事前の選択率そのまま）
  assert.equal(pctOf(one([])),'A 32% ／ B 27% ／ C 14% ／ D 13% ／ E 6% ／ F 3% ／ G 3% ／ H 1% ／ I 1%');
});

test('e. 設定1否定（濃厚下限2以上）があるあいだは％を出さない',()=>{
  const seq=[bz('t3')];
  const base=pctOf(one(seq));
  assert.ok(base&&base.startsWith('A 31%'),'基準の％が出ていない: '+base);
  // 銅1件 → 非表示 → 取消（0に戻す）→ 表示復帰
  const S=one(seq);
  S.trophy.bronze=1;
  assert.equal(pctOf(S),null,'銅1件で％が出ている');
  assert.equal(lineOf(S),'候補：A・B・C・D・E・F・G・H・I','％なしの候補行になっていない');
  S.trophy.bronze=0;
  assert.equal(pctOf(S),base,'取消で％が戻らない');
  // 246枚 OVER（設定2・4・6濃厚）→ 非表示
  const O=one(seq);O.over.o246=1;
  assert.equal(pctOf(O),null,'246枚 OVER で％が出ている');
  // 濃厚下限が2以上の項目すべてで非表示になる
  const hot=[['trophy','bronze'],['trophy','silver'],['trophy','gold'],['trophy','momiji'],['trophy','rainbow'],
    ['stamp','bronze'],['stamp','silver'],['stamp','gold'],['stamp','momiji'],['stamp','rainbow'],
    ['atEnd','hinoeMinoto'],['atEnd','zenin'],['atEnd','entalion'],
    ['over','o222'],['over','o246'],['over','o456'],['over','o555'],['over','o666']];
  for(const [group,key] of hot){
    const T=one(seq);T[group][key]=1;
    assert.equal(pctOf(T),null,group+'.'+key+' で％が出ている');
  }
  // 設定1を否定しない記録（奇数・偶数示唆／設定2否定・設定3否定／色スタンプ）では出したまま
  const cold=[['atEnd','jay'],['atEnd','rondine'],['atEnd','fioreneAirou'],['atEnd','chicheAirouGaruku'],
    ['atEnd','fioreneRondine'],['atEnd','jayArloGaleas'],
    ['stamp','blue'],['stamp','yellow'],['stamp','green'],['stamp','red']];
  for(const [group,key] of cold){
    const T=one(seq);T[group][key]=1;
    assert.equal(pctOf(T),base,group+'.'+key+' で％が消えている');
  }
  console.log('  否定あつかい '+hot.length+'項目／否定しない '+cold.length+'項目');
});

test('f. 四捨五入で0になる候補は消さず「1%未満」と出す',()=>{
  // 1回目③ の直後：シナリオH は 0.102%
  const list=config.scenarioPct(one([bz('t3')]),one([bz('t3')]).atLog.sessions[0]);
  const h=list.find(c=>c.name==='H');
  assert.deepEqual(clone(h),{name:'H',pct:0,text:'1%未満'});
  assert.equal(list.length,9,'候補から消えている');
  assert.ok(list.every(c=>c.text==='1%未満'||/^[0-9]+%$/.test(c.text)),'％の書式が崩れている');
  // 0.5% は切り上げて 1%（1%未満にしない）
  assert.ok(list.filter(c=>c.text==='1%').length>0,'1% の候補が無い（境界の確認ができない）');
});

test('g. BZ以外の出来事は重みに使わない（絞り込みだけ）',()=>{
  const base=pctOf(one([bz('t3'),bz('t4')]));
  // 福引・ランプ・期待度UPのセリフ（s1・s2）は候補も％も動かさない
  for(const extra of [{t:'fuku',r:'miss'},{t:'lamp',c:'red'},{t:'serif',c:'s1'},{t:'serif',c:'s2'}]){
    assert.equal(pctOf(one([bz('t3'),extra,bz('t4')])),base,JSON.stringify(extra)+' で％が動いた');
  }
  // アイキャッチ・s3・s4 は候補を絞る（＝％の母集団が変わる）だけで、重みそのものには入らない。
  // バハリ（E以上濃厚）→ ③ → ④ は {F,G,I} に絞られ、残った3つの重みの比は絞る前と同じ
  const eye=one([{t:'eye',c:'bahari'},bz('t3'),bz('t4')]);
  const cands=clone(config.scenarioModel(eye).rows[0].candidates);
  assert.deepEqual(cands,['F','G','I']);
  assert.equal(pctOf(eye),pctFor(cands,['t3','t4'],0),'絞ったあとの％が独立計算と合わない');
  // セリフ s3（次回BZレベルHI以上濃厚）も同じ扱い。③のあとに聞けば2回目を絞る
  const sf=one([bz('t3'),{t:'serif',c:'s3'},bz('t4')]);
  const sfc=clone(config.scenarioModel(sf).rows[0].candidates);
  assert.deepEqual(sfc,['C','F','G']);
  assert.equal(pctOf(sf),pctFor(sfc,['t3','t4'],0),'セリフで絞ったあとの％が独立計算と合わない');
});

test('h. 画面とカードの出し方',()=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[
    {start:{known:true,prior:0},events:[bz('t3'),bz('t4'),{t:'fuku',r:'win'}],closed:true},
    {start:{known:true,prior:0},events:[bz('t3')],closed:false}
  ]};
  config.normalizeState(S);
  const model=clone(config.scenarioModel(S));
  // 閉じたAT間にも同じルールで出す（カードの各行）
  assert.equal(model.rows.length,2);
  assert.equal(model.rows[0].pct,expectedPct(['t3','t4'],0));
  assert.equal(model.rows[1].pct,expectedPct(['t3'],0));
  // ％を出さない行にはキーごと足さない
  const noneRow=clone(config.scenarioModel(one([bz('t1')])).rows[0]);
  assert.ok(!Object.prototype.hasOwnProperty.call(noneRow,'pct'),'候補1件の行に pct が付いている');
  // 注記は3行目に参考値の断りを足した
  assert.deepEqual(model.note,['シナリオ選択率には設定差があるとされています（数値は設定1のみ公表）。',
    '候補は解析の表から確実に言えるものだけで絞っています。',
    '％は設定1の選択率に基づく参考値。設定1否定が出ると表示しません']);
  // 「現在の状況」は今のAT間の％。過去のAT間（折りたたみ）には閉じたAT間の％
  const html=config.pages(ctx(S),()=>'[CARD]')[2]();
  const lines=[...html.matchAll(/<div class="at-sc cand">候補（％は設定1の場合）：([^<]*)<\/div>/g)].map(m=>m[1]);
  assert.deepEqual(lines,[expectedPct(['t3'],0),expectedPct(['t3','t4'],0)],'画面の候補行が合わない');
  assert.ok(html.includes('候補（％は設定1の場合）：'+expectedPct(['t3'],0)),'現在の状況に％が出ていない');
  // ％を出していない行の見出しは従来どおり「候補：」のまま（断りを付けない）
  assert.ok(!html.includes('候補（％は設定1の場合）：A・B・'),'％なしの行に断りが付いている');
  // 順位・確定・推奨の言葉は足していない
  for(const word of ['1位','順位','確定','おすすめ','続行','やめ'])assert.ok(!lines.join('').includes(word),word+' を使っている');
});

test('i. テンプレ・画像カード・保存データには％を出さない',()=>{
  const S=one([bz('t3'),bz('t4')]);
  for(const key of ['template','compactTemplate']){
    const text=config[key](ctx(S));
    assert.ok(!text.includes('%'),key+' に％が出ている');
    assert.ok(!text.includes('1%未満'),key+' に 1%未満 が出ている');
  }
  const card=JSON.stringify(['blocks','chart','bottom','detail'].map(k=>config.card[k](ctx(S))));
  assert.ok(!card.includes('1%未満'),'画像カードに％が出ている');
  assert.ok(!JSON.stringify(S).includes('1%未満'),'保存データに％が入っている');
  assert.ok(!Object.prototype.hasOwnProperty.call(S.atLog,'pct'),'保存データに pct が入っている');
});

test('j. 転記した表（選択率・振り分け）の整合',()=>{
  // 選択率の合計は 100.0%
  assert.equal(Math.round(NAMES.reduce((a,n)=>a+P1[n],0)*10)/10,100.0);
  // 振り分けの合計（出典のまま。LOW だけ丸めで 100.1%）
  assert.deepEqual(ORDER.map(lv=>Math.round(TABLES.reduce((a,t)=>a+SHARE[t][lv],0)*10)/10),[100.1,100.0,100.0,100.0]);
  // 実装の定数は表を二重に持たない（レベル→テーブルの対応は振り分け表から導く）
  assert.equal(source.split('const TABLE_SHARE=').length-1,1,'TABLE_SHARE が1か所でない');
  assert.equal(source.split('const TABLE_LEVELS=').length-1,1,'TABLE_LEVELS が1か所でない');
  assert.ok(/const TABLE_LEVELS=Object\.fromEntries\(TABLES\.map/.test(source),'TABLE_LEVELS を振り分け表から導いていない');
  assert.equal(source.split('const SCENARIO_P1=').length-1,1,'SCENARIO_P1 が1か所でない');
  assert.ok(/const SCENARIO_P1=Object\.fromEntries\(SCENARIOS\.map/.test(source),'選択率を SCENARIOS から導いていない');
  // 導出した TABLE_LEVELS が従来の値と同じであること（候補の絞り込みが1ビットも変わらないことの固定）
  const want={t1:['LOW'],t2:['LOW','MID'],t3:['LOW','MID','HI'],t4:['MID','HI'],t5:['HI'],t6:['HI'],t7:['HI','SP']};
  for(const t of TABLES){
    const got=ORDER.filter(lv=>SHARE[t][lv]>0);
    assert.deepEqual(got,want[t],t+' のレベルが転記と合わない');
  }
  // 候補の絞り込み自体が改修前の main と完全に同じ（参考％を足しただけ）
  const before=load(execFileSync('git',['-c','safe.directory='+repo,'show',BASE+':checker-data/mhsunbreak.js'],{encoding:'utf8',maxBuffer:1<<26}));
  let cases=0;
  const walk=seq=>{
    if(seq.length){
      for(const start of [{known:true,prior:0},{known:true,prior:5},{known:false}]){
        const a=clone(before.scenarioModel(one(seq.map(bz),start)).rows[0].candidates);
        const b=clone(config.scenarioModel(one(seq.map(bz),start)).rows[0].candidates);
        assert.deepEqual(b,a,JSON.stringify(seq)+' '+JSON.stringify(start)+' の候補が変わった');
        cases++;
      }
    }
    if(seq.length>=3)return;
    for(const t of TABLES)walk(seq.concat(t));
  };
  walk([]);
  console.log('  候補の絞り込み：'+cases+'通りが '+BASE+' と一致');
});

console.log('PASS mhsunbreak BZシナリオの参考％: '+checks+' checks');

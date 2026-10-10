// モンハンサンブレイク「次のBZの候補表示」。
// 解析表から確定で言えること（次のBZのレベル候補 L と、そこから選ばれうるテーブル候補 T）だけを
// 「現在の状況」とBZシナリオカードに出す。確率・順位・「確定」は出さない。
//
// 正解は、実装の定数を一切使わず、この中で表を手で転記して作る（二重転記で誤りを拾う）。
// 全候補集合 2^9=512 通り × 次のBZ番号 n=1〜9 の 4608 件を実装と突き合わせる。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const repo=decodeURIComponent(root.pathname).replace(/^[/]/,'');
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const load=src=>{const box={window:{},document:{getElementById:()=>null},setTimeout:()=>0};vm.runInNewContext(src,box);return box.window.CheckerConfigs.mhsunbreak;};
const config=load(read('checker-data/mhsunbreak.js'));
const clone=v=>JSON.parse(JSON.stringify(v));
const cloneOrNull=v=>v===null?null:clone(v);   // 機種データは別の vm で読むので、比べる前に素の値に直す
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

// ===== 正解側（手で転記。実装の定数は使わない）=====
// 出典: 一撃様 https://1geki.jp/slot/l_mh_sun/48/ ・ ちょんぼりすた様 https://chonborista.com/slot/enta-slot/264514/
// 2026-10-10 に両者を再照合して一致を確認した。表の「−」は列を置かないことで表す。
const TABLE_ROWS=[
  'A MID LOW LOW HI  LOW LOW SP',
  'B MID LOW HI  LOW LOW HI  SP',
  'C MID HI  LOW HI  LOW HI  SP',
  'D MID LOW LOW HI  HI  HI  SP',
  'E MID LOW HI  HI  HI  HI  SP',
  'F MID HI  HI  HI  HI  HI  SP',
  'G HI  HI  HI  HI  HI  HI  SP',
  'H LOW LOW SP',
  'I MID MID SP'
].map(row=>row.trim().split(/\s+/));
const EXPECT_LEVEL={};
for(const row of TABLE_ROWS)EXPECT_LEVEL[row[0]]=row.slice(1);
const NAMES=TABLE_ROWS.map(r=>r[0]);
assert.deepEqual(NAMES,['A','B','C','D','E','F','G','H','I'],'転記したシナリオ名が9つそろっていない');
// レベル→選ばれうるテーブル（①〜⑦）。LOW=1〜3・MID=2〜4・HI=3〜7・SP=7
const EXPECT_TABLES={LOW:[1,2,3],MID:[2,3,4],HI:[3,4,5,6,7],SP:[7]};
const ORDER=['LOW','MID','HI','SP'];
const MAX_NO=7;   // 表は7回目まで
// 候補集合 cand と回数 no から、正解の L と T を作る
function expected(cand,no){
  if(!cand.length)return null;
  if(no>MAX_NO)return {no,over:true};
  const levels=ORDER.filter(lv=>cand.some(name=>(EXPECT_LEVEL[name][no-1]||'')===lv));
  if(!levels.length)return null;
  const nums=[1,2,3,4,5,6,7].filter(t=>levels.some(lv=>EXPECT_TABLES[lv].includes(t)));
  return {no,levels,tables:nums.map(t=>'t'+t),spOnly:levels.length===1&&levels[0]==='SP'};
}

test('a. 全候補集合 2^9 × n=1〜9 の 4608 件が実装と完全一致',()=>{
  let count=0,withLine=0,over=0,none=0;
  for(let bits=0;bits<512;bits++){
    const cand=NAMES.filter((_,i)=>bits&(1<<i));
    for(let no=1;no<=9;no++){
      const want=expected(cand,no);
      const got=cloneOrNull(config.nextBz(cand,no));
      assert.deepEqual(got,want,'候補{'+(cand.join(',')||'なし')+'} n='+no);
      count++;
      if(!want)none++;else if(want.over)over++;else withLine++;
    }
  }
  assert.equal(count,4608,'照合した件数が 4608 でない');
  console.log('  4608件：1行出す '+withLine+'件／範囲外 '+over+'件／出さない '+none+'件');
});

// ===== 画面に出る1行 =====
const bz=(table,r)=>({t:'bz',table,r:r||'miss'});
const one=(events,start,closed)=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[{start:start||{known:true,prior:0},events,closed:!!closed}]};
  config.normalizeState(S);
  return S;
};
const LINE=/<div class="at-next">(.*?)<\/div>/;
const bzPage=S=>config.pages(ctx(S),()=>'')[2]();
const line=S=>{const m=bzPage(S).match(LINE);return m?m[1]:'';};

test('b. 夢爽の指定した具体例',()=>{
  // 候補 C・F・G・I で n=3 → レベル LOW／HI／SP ・ テーブル ①〜⑦
  assert.deepEqual(cloneOrNull(config.nextBz(['C','F','G','I'],3)),
    {no:3,levels:['LOW','HI','SP'],tables:['t1','t2','t3','t4','t5','t6','t7'],spOnly:false});
  // 候補 H で n=3 → SP＝⑦でAT濃厚
  assert.deepEqual(cloneOrNull(config.nextBz(['H'],3)),{no:3,levels:['SP'],tables:['t7'],spOnly:true});
  // 候補 A のみ n=2 → LOW・①②③
  assert.deepEqual(cloneOrNull(config.nextBz(['A'],2)),{no:2,levels:['LOW'],tables:['t1','t2','t3'],spOnly:false});
  // 候補 H・I で n=4 → 出さない（表の「−」）
  assert.equal(config.nextBz(['H','I'],4),null);
  // 候補0 → 出さない／n=8 → 範囲外
  assert.equal(config.nextBz([],3),null);
  assert.deepEqual(cloneOrNull(config.nextBz(NAMES,8)),{no:8,over:true});
});

test('c. 画面の1行の文言',()=>{
  // 記録なし（候補9つ・n=1）
  assert.equal(line(one([{t:'fuku',r:'miss'}])),'次のBZ（1回目）：レベル LOW／MID／HI ・ テーブル ①②③④⑤⑥⑦');
  // ① → 候補 H だけ・n=2
  assert.equal(line(one([bz('t1')])),'次のBZ（2回目）：レベル LOW ・ テーブル ①②③');
  // ①① → 候補 H だけ・n=3（SPだけ）
  assert.equal(line(one([bz('t1'),bz('t1')])),'次のBZ（3回目）：SP ＝ ⑦でAT濃厚');
  // n=8（表の外）
  assert.equal(line(one([bz('t7','miss')],{known:true,prior:6})),'次のBZ（8回目）：8回目以降は解析表の範囲外です');
  // 開始不明は出さない（既存の「BZ番号が不明のため絞り込めません」だけ）
  const unknown=one([bz('t1')],{known:false});
  assert.equal(line(unknown),'');
  assert.ok(bzPage(unknown).includes('BZ番号が不明のため絞り込めません'));
  // 候補0件は出さない（該当なしの案内だけ）
  const nothing=one([bz('t1'),bz('t5')]);
  assert.equal(line(nothing),'');
  assert.ok(bzPage(nothing).includes('該当なし'));
});

test('d. 「確定」を書かず、「濃厚」は SP＝⑦ のときだけ（§9-103）',()=>{
  let sp=0,other=0;
  for(let bits=1;bits<512;bits++){
    const cand=NAMES.filter((_,i)=>bits&(1<<i));
    for(let no=1;no<=9;no++){
      const m=config.nextBz(cand,no);
      if(!m)continue;
      const text=m.over?'8回目以降は解析表の範囲外です':(m.spOnly?'SP ＝ ⑦でAT濃厚':'レベル '+m.levels.join('／'));
      assert.ok(!text.includes('確定'),'「確定」を使っている: '+text);
      if(text.includes('濃厚')){assert.ok(m.spOnly,'SPだけでないのに濃厚を使っている');sp++;}
      else other++;
    }
  }
  assert.ok(sp>0&&other>0,'濃厚あり・なしの両方を通っていない');
  // 画面に出る1行でも同じ（SPだけのときにしか濃厚が出ない）
  assert.ok(line(one([bz('t1'),bz('t1')])).includes('濃厚'));
  assert.ok(!line(one([bz('t1')])).includes('濃厚'));
  assert.ok(!line(one([bz('t1')])).includes('確定'));
});

test('e. BZシナリオカードは今のAT間にだけ1行を足す',()=>{
  const sess=(events,closed)=>({start:{known:true,prior:0},events,closed:!!closed});
  const S=clone(config.defaults);
  S.atLog={sessions:[sess([bz('t1'),bz('t1'),bz('t7','win')],true),sess([bz('t1')],false)]};
  config.normalizeState(S);
  const rows=clone(config.scenarioModel(S).rows);
  assert.equal(rows.length,2);
  assert.ok(!Object.prototype.hasOwnProperty.call(rows[0],'nextBz'),'閉じたAT間に次のBZが出ている');
  assert.equal(rows[1].nextBz,'次のBZ（2回目）：レベル LOW ・ テーブル ①②③');
  // 今のAT間が空（直前のAT間だけ記録がある）ときは、どの行にも足さない
  const S2=clone(config.defaults);
  S2.atLog={sessions:[sess([bz('t1')],true)]};
  config.normalizeState(S2);
  const rows2=clone(config.scenarioModel(S2).rows);
  assert.equal(rows2.length,1);
  assert.ok(!Object.prototype.hasOwnProperty.call(rows2[0],'nextBz'),'閉じたAT間に次のBZが出ている');
});

test('f. テンプレには出さない',()=>{
  for(const events of [[bz('t1')],[bz('t1'),bz('t1')],[{t:'fuku',r:'miss'}]]){
    const S=one(events);
    for(const text of [config.template(ctx(S)),config.compactTemplate(ctx(S))]){
      assert.ok(!text.includes('次のBZ'),'テンプレに次のBZが出ている');
      assert.ok(!text.includes('解析表の範囲外'),'テンプレに範囲外の文が出ている');
    }
  }
});

test('g. 表は1つしか持たない（レベル→テーブルは TABLE_LEVELS の裏返し）',()=>{
  const src=read('checker-data/mhsunbreak.js');
  assert.equal(src.split('const TABLE_LEVELS=').length-1,1,'TABLE_LEVELS が1か所でない');
  assert.equal(src.split('const SCENARIOS=').length-1,1,'SCENARIOS が1か所でない');
  assert.ok(/const LEVEL_TABLES=Object\.fromEntries\(LEVEL_ORDER\.map/.test(src),'LEVEL_TABLES を裏返しで作っていない');
  // レベルを添字にした別表が直書きされていないこと（二重管理の防止）
  assert.ok(!/\{\s*LOW:\s*\[/.test(src),'レベルを添字にした表が直書きされている');
});

// ===== この改修が保存・集計・テンプレ・カードを変えていないこと =====
// 比べる相手は改修前の main（7762afe）。保存データ6通りと、画面のボタンを順に押した操作列で、
// normalizeState のバイト列・集計・テンプレv05（通常／収支帳用）・カードJSON・
// シナリオカードJSON が一致することを見る。足してよいのは「今のAT間の nextBz」1キーだけ。
const BASE='7762afe';   // 改修前の main（PR #39 のマージ）
const show=ref=>execFileSync('git',['-c','safe.directory='+repo,'show',ref],{encoding:'utf8',maxBuffer:1<<26});
const before=load(show(BASE+':checker-data/mhsunbreak.js'));
const sess=(events,start,closed)=>({start:start||{known:true,prior:0},events,closed:!!closed});
const DATA={
  empty:{},
  legacyIcon:{
    iconPending:['qBlue','rai'],
    iconLog:[
      {group:'bzT1',icons:['qBlue','rai'],result:'win'},
      {group:'bzT2',icons:['qYellow','sel'],result:'miss'},
      {group:'bzT1',icons:['rai','oro'],result:'miss'},
      {group:'bzT2',icons:['sel','teo'],result:'win'},
      {group:'bzT1',icons:['oro','teo'],result:'miss'},
      {group:'bzT2',icons:['teo','rush'],result:'win'},
      {group:'bzT1',icons:['rush'],result:'miss'},
      {group:'bzT2',icons:['gold','teo'],result:'win'},
      {group:'bzT1',icons:['blaze'],result:'miss'},
      {group:'bzT2',icons:['unknown','rai'],result:'win'}
    ]
  },
  legacyQuestN:{
    questN:{blue:3,raizex:2,at:1},
    bzT1:{blue:4,raizex:3,t3:2},bzT2:{serregios:2,t5:1},
    questN1:{blue:2,t3:1},questN2:{t5:1}
  },
  atLogFull:{
    games:0,hits:[123,456,789],counts:{at:3},
    czType:{breakzone:12,airou:4},cycle:{c1:2,c2:1,c3:3,c4:0,c5:1},
    bz:{weakNormalD:20,weakNormalN:3,strongNormalD:8,strongNormalN:4},
    bzT1:{t1:1,t3:2,t5:1},bzT2:{t2:2,t4:1,t6:1,t7:1},
    questN1:{t3:1},questN2:{t4:1,t7:1},
    atLog:{sessions:[
      sess([{t:'eye',c:'jay'},bz('t3'),{t:'serif',c:'s3'},bz('t4'),{t:'fuku',r:'miss'},bz('t5','win')],null,true),
      sess([bz('t1'),{t:'eye',c:'chiche'},bz('t2'),{t:'serif',c:'s1'},{t:'fuku',r:'win'}],null,true),
      sess([bz('t6'),{t:'otherAt'}],null,false)
    ]}
  },
  unknownStart:{atLog:{sessions:[sess([bz('t1'),bz('t2'),bz('t3'),bz('t4'),bz('t5'),bz('t6'),{t:'eye',c:'bahari'}],{known:false},false)]}},
  sessionMax:{atLog:{sessions:Array.from({length:55},(_,i)=>sess([bz('t'+((i%7)+1)),bz('t'+((i%6)+1),'win')],null,true))}}
};
const totals=S=>clone({bzT1:S.bzT1,bzT2:S.bzT2,questN1:S.questN1,questN2:S.questN2,
  czType:S.czType,cycle:S.cycle,bz:S.bz,hits:S.hits,games:S.games,counts:S.counts});
const cardJson=(cfg,S)=>clone({blocks:cfg.card.blocks(ctx(S)),chart:cfg.card.chart(ctx(S)),
  bottom:cfg.card.bottom(ctx(S)),detail:cfg.card.detail(ctx(S))});
const dropNext=model=>{const m=clone(model);m.rows.forEach(r=>{delete r.nextBz;});return m;};
const sameOutputs=(name,was,now)=>{
  assert.deepEqual(Buffer.from(JSON.stringify(now)),Buffer.from(JSON.stringify(was)),name+': normalizeState のバイト列が一致しない');
  assert.deepEqual(totals(now),totals(was),name+': 集計が一致しない');
  for(const key of ['template','compactTemplate'])
    assert.deepEqual(Buffer.from(config[key](ctx(now))),Buffer.from(before[key](ctx(was))),name+': '+key+' が一致しない');
  assert.deepEqual(cardJson(config,now),cardJson(before,was),name+': カードJSONが一致しない');
  assert.deepEqual(dropNext(config.scenarioModel(now)),clone(before.scenarioModel(was)),name+': シナリオカードJSONが次のBZ以外で一致しない');
};

test('h. 保存データ6通りが改修前（'+BASE+'）と一致（足すのは今のAT間の nextBz だけ）',()=>{
  let added=0;
  for(const [name,data] of Object.entries(DATA)){
    const was=before.normalizeState(clone(data)),now=config.normalizeState(clone(data));
    sameOutputs(name,was,now);
    const rows=config.scenarioModel(now).rows;
    const withNext=rows.filter(r=>Object.prototype.hasOwnProperty.call(r,'nextBz'));
    assert.ok(withNext.length<=1,name+': 次のBZが2行以上に出ている');
    added+=withNext.length;
  }
  assert.ok(added>0,'6通りのどこでも次のBZが出ていない（基準データが今のAT間を含んでいない）');
  console.log('  6通り：次のBZを足した行は合計 '+added+'行');
});

test('i. 操作列（画面のボタンを順に押す）でも改修前と一致',()=>{
  // 開始の指定 → 1 テーブル → 2 結果アイコン → 3 成功／失敗 → 示唆・ランプ → 差し込み → 位置の訂正
  const steps=[
    ['atStart',{known:'true',prior:'1'}],
    ['bzPick',{q:'t3'}],['bzPickPos',{pos:'4'}],['bzQuest',{d:'bzT2',n:'questN2',q:'t3',r:'miss'}],
    ['atEvent',{t:'eye',c:'bahari'}],['atEvent',{t:'serif',c:'s3'}],['atEvent',{t:'lamp',c:'red'}],
    ['bzPick',{q:'t5'}],['bzQuest',{d:'bzT2',n:'questN2',q:'t5',r:'miss'}],
    ['atOpen',{index:'0'}],['atInsert',{index:'0'}],['atEvent',{t:'fuku',r:'miss'}],
    ['bzPos',{index:'1',pos:'2'}],['atOpen',{index:'1'}],
    ['bzPick',{q:'t7'}],['bzQuest',{d:'bzT2',n:'questN2',q:'t7',r:'win'}],   // AT当選でAT間が閉じる
    ['bzPick',{q:'t1'}],['bzPickPos',{pos:'1'}],['bzQuest',{d:'bzT1',n:'questN1',q:'t1',r:'miss'}]
  ];
  const run=cfg=>{
    const S=cfg.normalizeState({});
    const results=steps.map(([name,ds])=>{
      const out=cfg.actions[name](Object.assign(ctx(S),{mode:1}),ds);
      return typeof out==='string'?out:out;
    });
    return {S,results};
  };
  const a=run(before),b=run(config);
  assert.deepEqual(b.results,a.results,'操作の戻り値（取消のラベル）が一致しない');
  sameOutputs('操作列',a.S,b.S);
  // 操作のあと、今のAT間にだけ1行が出る
  const rows=config.scenarioModel(b.S).rows;
  assert.equal(rows.filter(r=>Object.prototype.hasOwnProperty.call(r,'nextBz')).length,1);
  assert.equal(rows[rows.length-1].nextBz,'次のBZ（2回目）：レベル LOW ・ テーブル ①②③');
});

console.log('PASS mhsunbreak 次のBZの候補表示: '+checks+' checks');

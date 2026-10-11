// モンハンサンブレイク「次のBZ」行のレベル別の参考％（設定1基準）。
// 候補ごとの参考％（scenarioPct と同じ重み）を、次のBZ番号のレベルごとに足して出すだけ。
// 絞り込み（scenarioCandidates）・レベルとテーブルの並べ方（nextBzOf）・重み（scenarioWeight）は変えない。
// 仕様書は docs/specs/mhsunbreak-next-bz-v01.md（§1.3）と docs/specs/mhsunbreak-scenario-pct-v01.md。
//
// 正解は、実装の定数を一切使わず、この中で出典の表を手で転記して作る（二重転記で誤りを拾う）。
// 長さ1〜4のBZ列（2800通り）と、長さ1〜3×開始 prior 0〜6（2793通り）を、
// 画面に出る1行そのままで突き合わせる。
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
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const BASE='ca87216';   // 改修前の main（PR #45 のマージ）
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

// ===== 正解側（手で転記。実装の定数は使わない）=====
// 出典: 一撃様 https://1geki.jp/slot/l_mh_sun/48/ ・ /57/ と
// ちょんぼりすた様 https://chonborista.com/slot/enta-slot/264514/ の表。
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
const MARKS={t1:'①',t2:'②',t3:'③',t4:'④',t5:'⑤',t6:'⑥',t7:'⑦'};
// レベル→選ばれうるテーブル（振り分けに数値がある列だけ）
const LEVEL_TABLES=Object.fromEntries(ORDER.map(lv=>[lv,TABLES.filter(t=>SHARE[t][lv]>0)]));
const MAX_NO=7;
const levelOf=(name,no)=>LV[name][no-1]||null;   // 表の「−」は null
assert.deepEqual(NAMES,['A','B','C','D','E','F','G','H','I'],'転記したシナリオ名が9つそろっていない');

// 候補（消去法）。開始が分かっている前提で、BZだけで絞る場合の正解
const expectedCand=(seq,prior)=>NAMES.filter(name=>seq.every((t,i)=>{
  const no=prior+i+1;
  if(no>MAX_NO)return true;           // 表の範囲外は絞らない
  const lv=levelOf(name,no);
  return !!lv&&SHARE[t][lv]>0;
}));
// 候補ごとの重み＝選択率×各回の振り分け率（8回目以降は掛けない）
const weightsOf=(cand,seq,prior)=>cand.map(name=>seq.reduce((acc,t,i)=>{
  const no=prior+i+1;
  return no>MAX_NO?acc:acc*SHARE[t][levelOf(name,no)];
},P1[name]));
// 候補ごとの参考％（四捨五入前）。候補が2つ以上のときだけ出す
function sharesOf(seq,prior){
  const cand=expectedCand(seq,prior);
  if(cand.length<2)return null;
  const w=weightsOf(cand,seq,prior);
  const sum=w.reduce((a,b)=>a+b,0);
  return sum>0?cand.map((name,i)=>({name,share:w[i]/sum*100})):null;
}
const fmt=share=>share<0.5?'1%未満':Math.round(share)+'%';
// 次のBZ番号 no のレベル別の参考％（出さないときは null）
function levelShares(seq,prior,no){
  if(no>MAX_NO)return null;
  const list=sharesOf(seq,prior);
  if(!list)return null;
  const out=ORDER.map(level=>({level,
    share:list.reduce((a,c)=>a+(levelOf(c.name,no)===level?c.share:0),0)})).filter(c=>c.share>0);
  return out.length?out:null;
}
// 画面に出る「次のBZ」の1行（出さないときは ''）。BZ以外の出来事を含まない列で使う
function expectedLine(seq,prior,denied){
  const cand=expectedCand(seq,prior),no=prior+seq.length+1;
  if(!cand.length)return '';
  const head='次のBZ（'+no+'回目）：';
  if(no>MAX_NO)return head+'8回目以降は解析表の範囲外です';
  const levels=ORDER.filter(lv=>cand.some(name=>levelOf(name,no)===lv));
  if(!levels.length)return '';
  if(levels.length===1&&levels[0]==='SP')return head+'SP ＝ ⑦でAT濃厚';
  const tables=' ・ テーブル '+TABLES.filter(t=>levels.some(lv=>LEVEL_TABLES[lv].includes(t))).map(t=>MARKS[t]).join('');
  const pct=denied?null:levelShares(seq,prior,no);
  if(pct)return head+pct.map(c=>c.level+' '+fmt(c.share)).join(' ／ ')+'（％は設定1の場合）'+tables;
  return head+'レベル '+levels.join('／')+tables;
}

// ===== 実装側の状態づくり =====
const bz=(table,r)=>({t:'bz',table,r:r||'miss'});
const one=(events,start,closed)=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[{start:start||{known:true,prior:0},events,closed:!!closed}]};
  config.normalizeState(S);
  return S;
};
const LINE=/<div class="at-next">(.*?)<\/div>/;
const page=(cfg,S)=>cfg.pages(ctx(S),()=>'[CARD]')[2]();
const line=S=>{const m=page(config,S).match(LINE);return m?m[1]:'';};
const pctOf=(S,no)=>config.nextBzPct(S,S.atLog.sessions[S.atLog.sessions.length-1],no);

test('a. 長さ1〜4のBZ列 2800通りで、画面の1行が独立計算と一致する',()=>{
  let count=0,withPct=0,noPct=0;
  const walk=seq=>{
    if(seq.length){
      count++;
      const S=one(seq.map(t=>bz(t)));
      const got=line(S),want=expectedLine(seq,0);
      assert.equal(got,want,JSON.stringify(seq)+' の1行が一致しない');
      if(want.includes('%'))withPct++;else noPct++;
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
  let count=0,over=0,noLevel=0;
  const walk=seq=>{
    if(seq.length){
      for(let prior=0;prior<=6;prior++){
        count++;
        const S=one(seq.map(t=>bz(t)),{known:true,prior});
        const want=expectedLine(seq,prior);
        assert.equal(line(S),want,JSON.stringify(seq)+' prior'+prior+' の1行が一致しない');
        if(want.includes('範囲外')){over++;assert.ok(!want.includes('%'),'範囲外の行に％が出ている');}
        if(!want)noLevel++;
      }
    }
    if(seq.length>=3)return;
    for(const t of TABLES)walk(seq.concat(t));
  };
  walk([]);
  assert.equal(count,399*7,'通り数が合わない: '+count);
  assert.ok(over>0,'8回目以降（範囲外）の組合せが無い');
  console.log('  '+count+'通り（うち範囲外 '+over+'件／1行も出さない '+noLevel+'件）');
});

test('c. レベル別％の合計は、次の回のレベルがある候補の％の合計と一致する',()=>{
  let full=0,partial=0;
  const walk=seq=>{
    if(seq.length){
      for(let prior=0;prior<=4;prior++){
        const no=prior+seq.length+1;
        const want=levelShares(seq,prior,no);
        const got=pctOf(one(seq.map(t=>bz(t)),{known:true,prior}),no);
        if(!want){assert.equal(got,null,JSON.stringify(seq)+' prior'+prior+' で％が出ている');continue;}
        assert.deepEqual(clone(got),want,JSON.stringify(seq)+' prior'+prior+' のレベル別％が一致しない');
        // 合計の照合（四捨五入前）。次の回のレベルがある候補の％だけが、どこかのレベルに入る
        const list=sharesOf(seq,prior,no);
        const all=list.reduce((a,c)=>a+c.share,0);
        const inTable=list.filter(c=>levelOf(c.name,no)).reduce((a,c)=>a+c.share,0);
        const sum=got.reduce((a,c)=>a+c.share,0);
        assert.ok(Math.abs(sum-inTable)<1e-9,JSON.stringify(seq)+' prior'+prior+' の合計が候補％の合計と合わない');
        assert.ok(Math.abs(all-100)<1e-9,'候補％の合計が100%でない');
        if(Math.abs(sum-all)<1e-9)full++;else{partial++;assert.ok(sum<all,'合計が候補％の合計を超えた');}
      }
    }
    if(seq.length>=3)return;
    for(const t of TABLES)walk(seq.concat(t));
  };
  walk([]);
  assert.ok(full>0,'合計が候補％の合計と一致する組合せが無い');
  // 表の「−」で次の回が無い候補（H・I）が残っている組合せでは、その分だけ合計が足りない
  console.log('  合計＝候補％の合計 '+full+'件／次の回が表の「−」の候補が残る '+partial+'件');
});

test('d. ％を出さない5条件（scenarioPct とまったく同じ）',()=>{
  const seq=[bz('t3')];   // ③1件 → 候補9つ・次は2回目
  const base=line(one(seq));
  assert.ok(base.includes('%')&&base.includes('（％は設定1の場合）'),'基準の行に％が出ていない: '+base);
  // 1. 開始不明 → 1行も出さない（既存の案内だけ）
  const unknown=one(seq,{known:false});
  assert.equal(line(unknown),'');
  assert.equal(config.nextBzPct(unknown,unknown.atLog.sessions[0],2),null);
  assert.ok(page(config,unknown).includes('BZ番号が不明のため絞り込めません'));
  // 2. 候補0件（①→⑤）→ 1行も出さない
  const none=one([bz('t1'),bz('t5')]);
  assert.equal(line(none),'');
  assert.equal(config.nextBzPct(none,none.atLog.sessions[0],3),null);
  // 3. 候補1件（①＝H だけ）→ 従来どおり「レベル …」
  assert.equal(line(one([bz('t1')])),'次のBZ（2回目）：レベル LOW ・ テーブル ①②③');
  const only=one([bz('t1')]);
  assert.equal(config.nextBzPct(only,only.atLog.sessions[0],2),null);
  // 4. 設定1否定（濃厚下限2以上）→ 従来どおり「レベル …」。取消で％が戻る
  const S=one(seq);
  S.trophy.bronze=1;
  assert.equal(line(S),'次のBZ（2回目）：レベル LOW／MID／HI ・ テーブル ①②③④⑤⑥⑦');
  assert.equal(config.nextBzPct(S,S.atLog.sessions[0],2),null);
  S.trophy.bronze=0;
  assert.equal(line(S),base,'取消で％が戻らない');
  // 設定1否定になる項目すべてで「レベル …」に戻る（scenarioPct と同じ範囲）
  const hot=[['trophy','bronze'],['trophy','silver'],['trophy','gold'],['trophy','momiji'],['trophy','rainbow'],
    ['stamp','bronze'],['stamp','silver'],['stamp','gold'],['stamp','momiji'],['stamp','rainbow'],
    ['atEnd','hinoeMinoto'],['atEnd','zenin'],['atEnd','entalion'],
    ['over','o222'],['over','o246'],['over','o456'],['over','o555'],['over','o666']];
  for(const [group,key] of hot){
    const T=one(seq);T[group][key]=1;
    assert.ok(!line(T).includes('%'),group+'.'+key+' で％が出ている');
    assert.ok(line(T).includes('レベル '),group+'.'+key+' で従来の行になっていない');
  }
  // 5. 8回目以降（表の範囲外）→ 範囲外の文だけ
  const over=one([bz('t7','miss')],{known:true,prior:6});
  assert.equal(line(over),'次のBZ（8回目）：8回目以降は解析表の範囲外です');
  assert.equal(config.nextBzPct(over,over.atLog.sessions[0],8),null);
  // SPだけに決まったときも従来どおり（レベルが1つなので％を添えない）
  const spOnly=one([bz('t3')],{known:true,prior:5});
  assert.equal(line(spOnly),'次のBZ（7回目）：SP ＝ ⑦でAT濃厚');
  assert.ok(config.nextBzPct(spOnly,spOnly.atLog.sessions[0],7),'候補は2つ以上なのでレベル別％そのものは出る（1行には足さない）');
  console.log('  設定1否定 '+hot.length+'項目＋開始不明・候補0件・候補1件・範囲外');
});

test('e. シナリオカード・過去のAT間・テンプレ・保存データには出さない',()=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[
    {start:{known:true,prior:0},events:[bz('t3'),bz('t4'),{t:'fuku',r:'win'}],closed:true},
    {start:{known:true,prior:0},events:[bz('t3')],closed:false}
  ]};
  config.normalizeState(S);
  // カードの「次のBZ」は従来の「レベル …」のまま（％はカードに出さない）
  const rows=clone(config.scenarioModel(S).rows);
  assert.equal(rows.length,2);
  assert.equal(rows[1].nextBz,'次のBZ（2回目）：レベル LOW／MID／HI ・ テーブル ①②③④⑤⑥⑦');
  assert.ok(!rows[1].nextBz.includes('%'),'カードの次のBZに％が出ている');
  assert.ok(!Object.prototype.hasOwnProperty.call(rows[0],'nextBz'),'閉じたAT間に次のBZが出ている');
  // 画面の「次のBZ」は1か所だけ（今のAT間）。過去のAT間の要約には出さない
  const html=page(config,S);
  assert.equal([...html.matchAll(/<div class="at-next">/g)].length,1,'次のBZの行が1か所でない');
  assert.equal(html.match(LINE)[1],'次のBZ（2回目）：LOW 77% ／ MID 1% ／ HI 22%（％は設定1の場合） ・ テーブル ①②③④⑤⑥⑦');
  assert.equal(html.match(LINE)[1],expectedLine(['t3'],0),'画面の1行が独立計算と合わない');
  // テンプレ・画像カード・保存データ
  for(const key of ['template','compactTemplate']){
    const text=config[key](ctx(S));
    assert.ok(!text.includes('次のBZ'),key+' に次のBZが出ている');
    assert.ok(!text.includes('%'),key+' に％が出ている');
  }
  const card=JSON.stringify(['blocks','chart','bottom','detail'].map(k=>config.card[k](ctx(S))));
  assert.ok(!card.includes('次のBZ'),'画像カードに次のBZが出ている');
  assert.ok(!JSON.stringify(S).includes('次のBZ'),'保存データに次のBZが入っている');
  assert.ok(!JSON.stringify(S).includes('%'),'保存データに％が入っている');
});

test('f. 文言・規則を二重に持たない',()=>{
  const src=read('checker-data/mhsunbreak.js');
  assert.equal(src.split("'（％は設定1の場合）'").length-1,1,'「（％は設定1の場合）」が1か所でない');
  assert.equal(src.split("'1%未満'").length-1,1,'「1%未満」の規則が1か所でない');
  assert.equal(src.split('const SCENARIOS=').length-1,1,'SCENARIOS が1か所でない');
  assert.equal(src.split('const TABLE_SHARE=').length-1,1,'TABLE_SHARE が1か所でない');
  // レベル別％は候補の重み（scenarioWeight）を足すだけ。重みの式を別に持たない
  assert.equal(src.split('function scenarioWeight(').length-1,1,'scenarioWeight が1か所でない');
  assert.ok(/levels=LEVEL_ORDER\.map\(level=>\(\{level,/.test(src),'レベルの並びを LEVEL_ORDER から作っていない');
  // 「確定」を書かず、％に順位・推奨の言葉を足していない
  const texts=[line(one([bz('t3')])),line(one([bz('t3'),bz('t4')])),line(one([{t:'fuku',r:'miss'}]))];
  for(const word of ['確定','1位','順位','おすすめ','続行','やめ'])
    assert.ok(!texts.join('').includes(word),word+' を使っている');
});

// ===== この改修が保存・集計・テンプレ・カードを変えていないこと =====
// 比べる相手は改修前の main（ca87216）。保存データ6通りで、normalizeState のバイト列・集計・
// テンプレv05（通常／収支帳用）・カードJSON・シナリオカードJSON が一致し、
// 画面のHTMLは「次のBZ」の1行だけが変わることを見る。
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
const stripNext=html=>html.replace(/<div class="at-next">.*?<\/div>/,'<div class="at-next">[NEXT]</div>');

test('g. 保存データ6通りが改修前（'+BASE+'）と一致（変わるのは画面の「次のBZ」1行だけ）',()=>{
  let changed=0;
  for(const [name,data] of Object.entries(DATA)){
    const was=before.normalizeState(clone(data)),now=config.normalizeState(clone(data));
    assert.deepEqual(Buffer.from(JSON.stringify(now)),Buffer.from(JSON.stringify(was)),name+': normalizeState のバイト列が一致しない');
    assert.deepEqual(totals(now),totals(was),name+': 集計が一致しない');
    for(const key of ['template','compactTemplate'])
      assert.deepEqual(Buffer.from(config[key](ctx(now))),Buffer.from(before[key](ctx(was))),name+': '+key+' が一致しない');
    assert.deepEqual(cardJson(config,now),cardJson(before,was),name+': カードJSONが一致しない');
    assert.deepEqual(clone(config.scenarioModel(now)),clone(before.scenarioModel(was)),name+': シナリオカードJSONが一致しない');
    // 画面は「次のBZ」の1行以外が1文字も変わらない
    const a=page(before,was),b=page(config,now);
    assert.equal(stripNext(b),stripNext(a),name+': 画面が次のBZ以外で変わった');
    const wasLine=(a.match(LINE)||[])[1]||'',nowLine=(b.match(LINE)||[])[1]||'';
    if(wasLine!==nowLine){changed++;assert.ok(nowLine.includes('%')&&wasLine.includes('レベル '),name+': 変わり方がレベル→％でない');}
  }
  assert.ok(changed>0,'6通りのどこでも「次のBZ」が％にならない（基準データが今のAT間を含んでいない）');
  console.log('  6通り：％に変わった行は '+changed+'件');
});

console.log('PASS mhsunbreak 次のBZのレベル別参考％: '+checks+' checks');

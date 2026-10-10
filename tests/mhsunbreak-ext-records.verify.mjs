// モンハンサンブレイク 追加記録（結果アイコンの位置 pos・サイドランプ lamp・過去への差し込み・
// 元データの控え -pre-ext）。指示書 docs/specs/mhsunbreak-ext-records-v01.md の §2 と §8 a〜h を固定する。
//
// 最優先は「保存済みのBZ記録を1件も失わない」こと。改修前（d5fe40d）との一致で担保する。
// 旧版との比較で差を認めるのは atLog.schemaVersion の1キーだけ。これは §3.1.2 で意図して
// 足した版数で、将来の版が保存形式を判断するためのもの（表示にも集計にも使わない）。
// 集計値・テンプレ・収支帳用・カードJSON・シナリオカードJSON は例外なしの完全一致。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const repo=decodeURIComponent(root.pathname).replace(/^\//,'');
const show=ref=>execFileSync('git',['-c','safe.directory='+repo,'show',ref],{encoding:'utf8',maxBuffer:1<<26});
const BASE='d5fe40d';   // 改修前の main（PR #38 のマージ）

// localStorage を差し替えられるように、機種データは毎回新しい箱で読む
const mkStore=mem=>({
  getItem:k=>Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null,
  setItem:(k,v)=>{mem[k]=String(v);},
  removeItem:k=>{delete mem[k];}
});
const load=(src,mem)=>{
  const box={window:mem?{localStorage:mkStore(mem)}:{}};
  vm.runInNewContext(src,box);
  return box.window.CheckerConfigs.mhsunbreak;
};
const source=read('checker-data/mhsunbreak.js');
const after=load(source);
const before=load(show(BASE+':checker-data/mhsunbreak.js'));

// 収支帳用コピーは engine の plainText。実装がずれないよう、engine の原文から切り出して使う。
const plainText=(()=>{
  const eng=read('checker-engine.js');
  const s=eng.indexOf('const EMOJI_PRESENTED=');
  const e=eng.indexOf('function plainTplText');
  assert.ok(s>0&&e>s,'checker-engine.js から plainText を切り出せない');
  return vm.runInNewContext(eng.slice(s,e)+'\nplainText;',{});
})();

const clone=v=>JSON.parse(JSON.stringify(v));
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const bz=(table,r,extra)=>Object.assign({t:'bz',table,r:r||'miss'},extra||{});
const eye=c=>({t:'eye',c});
const serif=c=>({t:'serif',c});
const fuku=r=>({t:'fuku',r});
const lamp=c=>({t:'lamp',c});
const sess=(events,start,closed)=>({start:start||{known:true,prior:0},events,closed:!!closed});

// ===== §2 基準づくり：改修前と比べる6通り =====
const DATA={
  // 1. 空（保存なしと同じ）
  empty:{},
  // 2. 旧10マス配列メモ（iconLog）からの移行済みデータ
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
  // 3. 旧 questN（合算セーブ）＋旧発展先キー
  legacyQuestN:{
    questN:{blue:3,raizex:2,at:1},
    bzT1:{blue:4,raizex:3,t3:2},
    bzT2:{serregios:2,t5:1},
    questN1:{blue:2,t3:1},
    questN2:{t5:1}
  },
  // 4. atLog に3つのAT間・集計にも値
  atLogFull:{
    games:0,hits:[123,456,789],
    counts:{at:3},
    czType:{breakzone:12,airou:4},
    cycle:{c1:2,c2:1,c3:3,c4:0,c5:1},
    bz:{weakNormalD:20,weakNormalN:3,strongNormalD:8,strongNormalN:4},
    bzT1:{t1:1,t3:2,t5:1},bzT2:{t2:2,t4:1,t6:1,t7:1},
    questN1:{t3:1},questN2:{t4:1,t7:1},
    atLog:{sessions:[
      sess([eye('jay'),bz('t3','miss'),serif('s3'),bz('t4','miss'),fuku('miss'),bz('t5','win')],{known:true,prior:0},true),
      sess([bz('t1','miss'),eye('chiche'),bz('t2','miss'),serif('s1'),fuku('win')],{known:true,prior:0},true),
      sess([bz('t6','miss'),{t:'otherAt'}],{known:true,prior:0},false)
    ]}
  },
  // 5. 開始が不明
  unknownStart:{
    atLog:{sessions:[sess([bz('t1'),bz('t2'),bz('t3'),bz('t4'),bz('t5'),bz('t6'),eye('bahari')],{known:false},false)]}
  },
  // 6. AT間 55件（上限50を超える）
  sessionMax:{
    atLog:{sessions:Array.from({length:55},(_,i)=>sess([bz('t'+((i%7)+1),'miss'),bz('t'+((i%6)+1),'win')],{known:true,prior:0},true))}
  }
};

const cardJson=(config,S)=>clone({
  blocks:config.card.blocks(ctx(S)),
  chart:config.card.chart(ctx(S)),
  bottom:config.card.bottom(ctx(S)),
  detail:config.card.detail(ctx(S))
});
const totals=S=>clone({
  bzT1:S.bzT1,bzT2:S.bzT2,questN1:S.questN1,questN2:S.questN2,
  czType:S.czType,cycle:S.cycle,bz:S.bz,hits:S.hits,games:S.games,counts:S.counts
});
const stripSchema=S=>{const c=clone(S);if(c.atLog)delete c.atLog.schemaVersion;return c;};

test('a. 6通りが改修前（'+BASE+'）と一致（例外は atLog.schemaVersion の1キーだけ）',()=>{
  for(const [name,data] of Object.entries(DATA)){
    const was=before.normalizeState(clone(data));
    const now=after.normalizeState(clone(data));
    assert.equal(now.atLog.schemaVersion,2,name+': schemaVersion が 2 でない');
    assert.deepEqual(stripSchema(now),stripSchema(was),name+': normalizeState が一致しない');
    assert.deepEqual(totals(now),totals(was),name+': 集計値が一致しない');
    const tplWas=before.template(ctx(was)),tplNow=after.template(ctx(now));
    assert.deepEqual(Buffer.from(tplNow),Buffer.from(tplWas),name+': テンプレが一致しない');
    assert.deepEqual(Buffer.from(plainText(tplNow)),Buffer.from(plainText(tplWas)),name+': 収支帳用が一致しない');
    assert.deepEqual(cardJson(after,now),cardJson(before,was),name+': カードJSONが一致しない');
    assert.deepEqual(clone(after.scenarioModel(now)),clone(before.scenarioModel(was)),name+': シナリオカードJSONが一致しない');
  }
});

// ===== §8-b 保存→読み直し→保存 がバイト一致（冪等） =====
test('b. pos・lamp・差し込み・知らない項目を含む状態で保存が冪等（3サイクル）',()=>{
  const cycles=[
    {atLog:{sessions:[sess([bz('t3','miss',{pos:4}),lamp('red'),bz('t5','win',{pos:1})],{known:true,prior:0},true),sess([],{known:true,prior:0},false)]}},
    {atLog:{schemaVersion:2,sessions:[sess([serif('s3'),bz('t2','miss',{pos:10,zz:9}),lamp('rainbow'),{t:'future',x:1}],{known:true,prior:2},false)]},bzT1:{t2:1}},
    {atLog:{sessions:[sess([lamp('other'),eye('galeas'),bz('t7','win',{pos:1}),{t:'future2',deep:{a:[1,2]}}],{known:false},true),sess([bz('t1','miss')],{known:true,prior:0},false)]}}
  ];
  for(const [i,data] of cycles.entries()){
    const first=JSON.stringify(after.normalizeState(clone(data)));
    const second=JSON.stringify(after.normalizeState(JSON.parse(first)));
    const third=JSON.stringify(after.normalizeState(JSON.parse(second)));
    assert.deepEqual(Buffer.from(second),Buffer.from(first),'cycle'+(i+1)+': 2回目がバイト一致しない');
    assert.deepEqual(Buffer.from(third),Buffer.from(second),'cycle'+(i+1)+': 3回目がバイト一致しない');
  }
});

// ===== §8-c 知らない種類・知らない項目を捨てない =====
test('c. 知らない種類と知らない項目が保存に残り、表示には出ない',()=>{
  const data={atLog:{sessions:[sess([
    {t:'future',x:1},
    bz('t3','miss',{zz:9}),
    lamp('pinkish'),            // この版が知らない色。捨てずに残す
    bz('t4','win')
  ],{known:true,prior:0},true)]}};
  const S=after.normalizeState(clone(data));
  const ev=S.atLog.sessions[0].events;
  assert.equal(ev.length,4,'件数が減っている');
  assert.deepEqual(clone(ev[0]),{t:'future',x:1});
  assert.equal(ev[1].zz,9,'知らない項目が落ちている');
  assert.deepEqual(clone(ev[2]),{t:'lamp',c:'pinkish'});
  // BZ番号は bz だけで数える（知らない種類・ランプは数えない）
  assert.equal(after.scenarioModel(S).rows[0].flow.filter(f=>f.no!==undefined).length,2);
  // 知らない種類・知らない色は流れにも出ない
  assert.equal(after.scenarioModel(S).rows[0].flow.length,2);
  // テンプレにも出ない
  assert.ok(!after.template(ctx(S)).includes('future'));
});

// ===== §8-d 元データの控え（-pre-ext） =====
const OLD_SAVE=JSON.stringify({counts:{at:2},bzT1:{t3:2},questN1:{t3:1},atLog:{sessions:[sess([bz('t3','miss')],{known:true,prior:0},false)]}});
test('d. 旧形式を開くと -pre-ext が1回だけ作られ、上書きもリセットもされない',()=>{
  const mem={'mhsunbreak-checker-v1':OLD_SAVE};
  const cfg=load(source,mem);
  const S=cfg.normalizeState(JSON.parse(OLD_SAVE));
  assert.equal(mem['mhsunbreak-checker-v1-pre-ext'],OLD_SAVE,'生の文字列のまま控えられていない');
  // 保存し直す（schemaVersion が付く）
  mem['mhsunbreak-checker-v1']=JSON.stringify(S);
  cfg.normalizeState(clone(S));
  assert.equal(mem['mhsunbreak-checker-v1-pre-ext'],OLD_SAVE,'2回目で上書きされた');
  // リセット相当（既定に戻して保存）のあとも残る
  mem['mhsunbreak-checker-v1']=JSON.stringify(cfg.normalizeState(clone(cfg.defaults)));
  cfg.normalizeState(clone(cfg.defaults));
  assert.equal(mem['mhsunbreak-checker-v1-pre-ext'],OLD_SAVE,'リセットで消えた');
  // 既に控えがあるときは、別の旧形式を読んでも上書きしない
  const mem2={'mhsunbreak-checker-v1':OLD_SAVE,'mhsunbreak-checker-v1-pre-ext':'{"keep":1}'};
  load(source,mem2).normalizeState(JSON.parse(OLD_SAVE));
  assert.equal(mem2['mhsunbreak-checker-v1-pre-ext'],'{"keep":1}','既にある控えを上書きした');
  // 保存が無い端末では作らない
  const mem3={};
  load(source,mem3).normalizeState({});
  assert.equal(mem3['mhsunbreak-checker-v1-pre-ext'],undefined,'保存が無いのに控えを作った');
  // 壊れた保存では作らない
  const mem4={'mhsunbreak-checker-v1':'{壊れ'};
  load(source,mem4).normalizeState({});
  assert.equal(mem4['mhsunbreak-checker-v1-pre-ext'],undefined,'壊れた保存を控えた');
});

// ===== §8-e 旧版に戻したときに落ちる範囲 =====
test('e. 旧版の normalize では pos と lamp だけが落ち、他は一致する',()=>{
  const data={bzT1:{t3:1,t5:1},questN1:{t5:1},atLog:{sessions:[sess([
    eye('jay'),bz('t3','miss',{pos:4}),lamp('red'),serif('s3'),bz('t5','win',{pos:1})
  ],{known:true,prior:0},true)]}};
  const now=after.normalizeState(clone(data));
  const old=before.normalizeState(clone(now));
  const oldEv=old.atLog.sessions[0].events;
  // ランプが1件落ちる
  assert.equal(oldEv.length,4);
  assert.ok(!oldEv.some(e=>e.t==='lamp'),'旧版にランプが残っている');
  assert.ok(!oldEv.some(e=>e.pos!==undefined),'旧版に pos が残っている');
  // pos と lamp を外した新版データと一致する（schemaVersion は旧版に無い）
  const stripped=clone(now);
  stripped.atLog.sessions=stripped.atLog.sessions.map(s=>Object.assign({},s,{
    events:s.events.filter(e=>e.t!=='lamp').map(e=>{const c=Object.assign({},e);delete c.pos;return c;})
  }));
  assert.deepEqual(stripSchema(before.normalizeState(clone(stripped))),clone(old));
  // 集計は動かない
  assert.deepEqual(totals(old),totals(now));
});

// ===== §8-f 標準配列（7テーブル×10）と ⑦ の既定 =====
const ICONS={
  t1:['QUEST青','QUEST青','QUEST黄','QUEST黄','ライゼクス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル'],
  t2:['QUEST黄','QUEST黄','ライゼクス','ライゼクス','セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル'],
  t3:['ライゼクス','ライゼクス','セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G'],
  t4:['セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G'],
  t5:['オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G','＋G','＋G'],
  t6:['テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G','＋G','＋G','＋G','＋G'],
  t7:['AT','＋G','＋G','＋G','＋G','＋G','＋G','＋G','＋G','＋G']
};
const page=(S,mode)=>{
  const pages=after.pages(Object.assign(ctx(S),{mode:mode===undefined?1:mode,crow:()=>''}),()=>'');
  return pages[2]();
};
const act=(S,name,ds,mode)=>after.actions[name](Object.assign(ctx(S),{mode:mode===undefined?1:mode}),ds||{});

test('f. 位置1〜10の表記が出典の標準配列と一致（7×10）／⑦は記録時に位置1が入る',()=>{
  let n=0;
  for(const [id,list] of Object.entries(ICONS)){
    // 記録するとその詳細が自動で開く（§3.7）ので、そのまま描いて中身を見る
    const S=after.normalizeState({});
    assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:id,r:id==='t7'?'win':'miss'}),id+': 記録できない');
    const html=page(S);
    list.forEach((name,i)=>{
      assert.ok(html.includes(`data-pos="${i+1}" aria-pressed="false" aria-label="位置${i+1} ${name}"`)
             || html.includes(`data-pos="${i+1}" aria-pressed="true" aria-label="位置${i+1} ${name}"`),
        `${id} 位置${i+1} が ${name} になっていない`);
      n++;
    });
    assert.ok(html.includes('>未記録</button>'),id+': ［未記録］が無い');
  }
  assert.equal(n,70);
  // ⑦ は記録した時点で位置1（配列の1個目が AT）
  const S7=after.normalizeState({});
  assert.ok(act(S7,'bzQuest',{d:'bzT1',n:'questN1',q:'t7',r:'win'}));
  assert.equal(S7.atLog.sessions[0].events[0].pos,1);
  // ⑥ は既定を入れない
  const S6=after.normalizeState({});
  assert.ok(act(S6,'bzQuest',{d:'bzT1',n:'questN1',q:'t6',r:'miss'}));
  assert.equal(S6.atLog.sessions[0].events[0].pos,undefined);
  // 押すと入り、同じ位置をもう一度押すと未記録に戻る
  assert.ok(act(S6,'bzPos',{index:'0',pos:'3'}));
  assert.equal(S6.atLog.sessions[0].events[0].pos,3);
  assert.ok(act(S6,'bzPos',{index:'0',pos:'3'}));
  assert.equal(S6.atLog.sessions[0].events[0].pos,undefined);
  // 範囲外は受け付けない
  assert.equal(act(S6,'bzPos',{index:'0',pos:'11'}),false);
  assert.equal(act(S6,'bzPos',{index:'0',pos:'0'}),false);
  // 減算モードでは押せない
  assert.equal(act(S6,'bzPos',{index:'0',pos:'2'},-1),false);
});

// ===== §8-g 差し込み =====
test('g. 差し込みで順序が直り、BZ番号は数え直し、集計は動かない',()=>{
  const S=after.normalizeState({});
  // BZ③ を先に記録してしまった（本当はその前にセリフが出ていた）
  assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t3',r:'miss'}));
  assert.ok(act(S,'bzQuest',{d:'bzT2',n:'questN2',q:'t4',r:'miss'}));
  const totalsBefore=totals(S);
  // 1件目の前に差し込む
  assert.equal(act(S,'atInsert',{index:'0'}),false);   // 画面だけの操作（履歴に積まない）
  assert.ok(act(S,'atEvent',{t:'serif',c:'s3'}));
  const ev=S.atLog.sessions[0].events;
  assert.deepEqual(clone(ev).map(e=>e.t),['serif','bz','bz'],'差し込み位置が違う');
  // BZ番号は順序から数え直す（セリフは数えない）
  const flow=after.scenarioModel(S).rows[0].flow;
  assert.deepEqual(clone(flow).map(f=>f.no),['1','2']);
  // 集計は1つも動かない
  assert.deepEqual(totals(S),totalsBefore);
  // 差し込みは1回で解除される（次の記録は末尾）
  assert.ok(act(S,'atEvent',{t:'lamp',c:'blue'}));
  assert.deepEqual(clone(S.atLog.sessions[0].events).map(e=>e.t),['serif','bz','bz','lamp']);
  // 閉じたAT間では差し込めない
  const S2=after.normalizeState({});
  assert.ok(act(S2,'bzQuest',{d:'bzT1',n:'questN1',q:'t5',r:'win'}));   // AT当選でAT間が閉じる
  assert.equal(act(S2,'atInsert',{index:'0'}),false);
  // 差し込んだBZの計上先は入った位置の番号で決まる（1件目の前なら1回目）
  const S3=after.normalizeState({});
  assert.ok(act(S3,'bzQuest',{d:'bzT1',n:'questN1',q:'t3',r:'miss'}));
  assert.equal(act(S3,'atInsert',{index:'0'}),false);
  assert.ok(act(S3,'bzQuest',{d:'bzT1',n:'questN1',q:'t2',r:'miss'}));
  assert.equal(S3.bzT1.t2,1,'差し込んだBZが1回目に入っていない');
  assert.equal(S3.bzT2.t2,0);
  assert.deepEqual(clone(S3.atLog.sessions[0].events).map(e=>e.table),['t2','t3']);
});

test('g2. 差し込み中は、入る位置のBZ番号と計上先を画面に出す',()=>{
  const S=after.normalizeState({});
  assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t3',r:'miss'}));
  assert.ok(page(S).includes('→ 2回目以降に計上（BZ2回目）'));
  assert.equal(act(S,'atInsert',{index:'0'}),false);
  const html=page(S);
  assert.ok(html.includes('→ 1回目に計上（BZ1回目）'),'差し込み位置の番号になっていない');
  assert.ok(html.includes('差し込み待ち'),'差し込み待ちの表示が無い');
  assert.ok(html.includes('data-action="atInsertCancel"'),'やめるボタンが無い');
  assert.equal(act(S,'atInsertCancel'),false);
  assert.ok(page(S).includes('→ 2回目以降に計上（BZ2回目）'),'やめたのに戻らない');
});

// ===== §8-h ランプ =====
test('h. ランプ8色が経過カードとシナリオカードに出て、テンプレは変わらない',()=>{
  const names=['白','青','黄','緑','赤','紫','虹','その他'];
  const keys=['white','blue','yellow','green','red','purple','rainbow','other'];
  const S=after.normalizeState({atLog:{sessions:[sess(keys.map(lamp),{known:true,prior:0},false)]}});
  const html=page(S);
  names.forEach((name,i)=>{
    assert.ok(html.includes(`aria-label="ランプ ${name}"`),name+': 経過カードに出ていない');
    assert.ok(html.includes(`data-t="lamp" data-c="${keys[i]}"`),name+': 記録ボタンが無い');
  });
  assert.ok(html.includes('解析が出るまで色だけ記録します。'));
  const flow=after.scenarioModel(S).rows[0].flow;
  assert.deepEqual(clone(flow).map(f=>f.lamp),names);
  // テンプレには出ない（ランプだけのAT間は見出しの1行だけ）
  const withLamp=after.template(ctx(S));
  const without=after.template(ctx(after.normalizeState({atLog:{sessions:[sess([],{known:true,prior:0},false)]}})));
  assert.deepEqual(Buffer.from(withLamp),Buffer.from(without),'テンプレにランプが出ている');
  // BZ番号に数えない／AT間を閉じない
  assert.equal(S.atLog.sessions.length,1);
  assert.equal(S.atLog.sessions[0].closed,false);
});

// ===== AT当選の直後に、そのBZの結果アイコンを押せる（夢爽裁定 2026/10/10） =====
test('i. AT当選の直後は「直前のAT間」が経過に残り、結果アイコンを押せる',()=>{
  const S=after.normalizeState({});
  assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t6',r:'miss'}));
  assert.ok(act(S,'bzQuest',{d:'bzT2',n:'questN2',q:'t4',r:'win'}));   // AT当選でAT間が閉じる
  assert.equal(S.atLog.sessions.length,2);
  assert.equal(S.atLog.sessions[1].events.length,0);
  const html=page(S);
  assert.ok(html.includes('直前のAT間（AT当選で終了）'),'直前のAT間の見出しが無い');
  assert.ok(html.includes('結果アイコン'),'記録直後に詳細が開いていない');
  assert.ok(!html.includes('data-action="atDel"'),'閉じたAT間に削除が出ている');
  assert.ok(!html.includes('data-action="atInsert"'),'閉じたAT間に差し込みが出ている');
  // そのまま結果アイコンを押せる
  assert.ok(act(S,'bzPos',{index:'1',pos:'7'}));
  assert.equal(S.atLog.sessions[0].events[1].pos,7);
  assert.ok(page(S).includes('結果：7 AT'),'経過カードに結果が出ていない');
  // 次の記録をすると新しいAT間に切り替わる
  assert.ok(act(S,'atEvent',{t:'eye',c:'jay'}));
  assert.ok(!page(S).includes('直前のAT間（AT当選で終了）'));
});

test('j. 画面だけの操作（カードを押す・差し込み・やめる）は取消の履歴に積まない',()=>{
  const S=after.normalizeState({atLog:{sessions:[sess([bz('t3','miss')],{known:true,prior:0},false)]}});
  assert.equal(act(S,'atOpen',{index:'0'}),false);
  assert.equal(act(S,'atInsert',{index:'0'}),false);
  assert.equal(act(S,'atInsertCancel'),false);
  // 保存を変えるものは文字列を返す（履歴に積む）
  assert.equal(typeof act(S,'bzPos',{index:'0',pos:'5'}),'string');
});

test('k. atEvent は dataset の画面都合の属性を保存に混ぜない',()=>{
  const S=after.normalizeState({});
  assert.ok(act(S,'atEvent',{action:'atEvent',t:'eye',c:'jay',index:'3',label:'押した'}));
  assert.deepEqual(clone(S.atLog.sessions[0].events[0]),{t:'eye',c:'jay'});
});

console.log('PASS mhsunbreak 追加記録: '+checks+' checks');

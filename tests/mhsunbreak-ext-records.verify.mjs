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

// シナリオH濃厚の表示だけは、台帳 S01 で改修前の判定を**直している**ので一致しない。
// ここでは「Hマーカーを外せば1バイトも変わらない」ことと、
// 「新しいHマーカーは候補集合がちょうど {H} のときだけ付く」ことの2つに分けて固定する。
const H_MARK=' ｼﾅﾘｵH濃厚';
const dropH=text=>text.split(H_MARK).join('');
const dropScenarioH=model=>{const m=clone(model);m.rows.forEach(r=>{delete r.scenarioH;});return m;};
const onlyH=row=>row.candidates.length===1&&row.candidates[0]==='H';
let s01Fixed=0;

test('a. 6通りが改修前（'+BASE+'）と一致（例外は atLog.schemaVersion と、台帳 S01 で直したH表示だけ）',()=>{
  for(const [name,data] of Object.entries(DATA)){
    const was=before.normalizeState(clone(data));
    const now=after.normalizeState(clone(data));
    assert.equal(now.atLog.schemaVersion,2,name+': schemaVersion が 2 でない');
    assert.deepEqual(stripSchema(now),stripSchema(was),name+': normalizeState が一致しない');
    assert.deepEqual(totals(now),totals(was),name+': 集計値が一致しない');
    assert.deepEqual(cardJson(after,now),cardJson(before,was),name+': カードJSONが一致しない');
    const tplWas=before.template(ctx(was)),tplNow=after.template(ctx(now));
    assert.deepEqual(Buffer.from(dropH(tplNow)),Buffer.from(dropH(tplWas)),name+': テンプレがH表示以外で一致しない');
    assert.deepEqual(Buffer.from(plainText(dropH(tplNow))),Buffer.from(plainText(dropH(tplWas))),name+': 収支帳用がH表示以外で一致しない');
    const modelWas=before.scenarioModel(was),modelNow=after.scenarioModel(now);
    assert.deepEqual(dropScenarioH(modelNow),dropScenarioH(modelWas),name+': シナリオカードJSONがH表示以外で一致しない');
    // 新しいH表示は候補集合がちょうど {H} のときだけ。テンプレのマーカー数とも一致する
    const rows=clone(modelNow.rows);
    rows.forEach((r,i)=>assert.equal(r.scenarioH,onlyH(r),name+' 行'+(i+1)+': H表示が候補集合と一致しない'));
    assert.equal(tplNow.split(H_MARK).length-1,rows.filter(onlyH).length,name+': テンプレのHマーカー数が合わない');
    const fixed=clone(modelWas.rows).filter((r,i)=>r.scenarioH!==rows[i].scenarioH).length;
    s01Fixed+=fixed;
    if(fixed)console.log('  '+name+': 改修前のH表示を '+fixed+' 行ぶん直した（S01）');
  }
  assert.ok(s01Fixed>0,'6通りのどこでも S01 の差が出ていない（基準データが不正解のケースを含んでいない）');
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
    if(id==='t7'){
      assert.ok(page(S).includes('選択済み：1個目・AT'),id+': 自動位置が無い');
      act(S,'bzPosOpen',{});
    }
    const html=page(S);
    list.forEach((name,i)=>{
      assert.ok(html.includes(`data-pos="${i+1}" aria-pressed="false" aria-label="位置${i+1} ${name}"`)
             || html.includes(`data-pos="${i+1}" aria-pressed="true" aria-label="位置${i+1} ${name}"`),
        `${id} 位置${i+1} が ${name} になっていない`);
      n++;
    });
    if(id!=='t7')assert.ok(html.includes('>未記録</button>'),id+': ［未記録］が無い');
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
  assert.ok(html.includes('経過（直前のAT間・AT当選で終了）'),'直前のAT間の見出しが無い');
  assert.ok(html.includes('結果アイコン'),'記録直後に詳細が開いていない');
  assert.ok(!html.includes('data-action="atDel"'),'閉じたAT間に削除が出ている');
  assert.ok(!html.includes('data-action="atInsert"'),'閉じたAT間に差し込みが出ている');
  // そのまま結果アイコンを押せる
  assert.ok(act(S,'bzPos',{index:'1',pos:'7'}));
  assert.equal(S.atLog.sessions[0].events[1].pos,7);
  assert.ok(page(S).includes('結果：7 AT'),'経過カードに結果が出ていない');
  // 次の記録をすると新しいAT間に切り替わる
  assert.ok(act(S,'atEvent',{t:'eye',c:'jay'}));
  assert.ok(!page(S).includes('経過（直前のAT間・AT当選で終了）'));
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

// ===== 台帳 S01: シナリオH濃厚は「候補がちょうど {H}」のときだけ =====
// 以前は「開始が分かっていて1回目のBZがテーブル1」という独自判定を別に持っていたため、
// 候補計算とずれる組合せがあった（①失敗→⑤失敗 は候補が空なのに H濃厚 と出ていた）。
const IDS=['t1','t2','t3','t4','t5','t6','t7'];
const sessionOf=(tables,start)=>({atLog:{sessions:[sess(tables.map(t=>bz(t,'miss')),start||{known:true,prior:0},false)]}});
const rowOf=S=>after.scenarioModel(S).rows[0];

test('S01. ①失敗→⑤失敗 でH表示が出ず、該当なしだけが出る',()=>{
  const S=after.normalizeState(sessionOf(['t1','t5']));
  const row=rowOf(S);
  assert.deepEqual(clone(row.candidates),[],'候補が空になっていない');
  assert.equal(row.scenarioH,false,'候補が空なのにH濃厚が出ている');
  const html=page(S);
  assert.ok(!html.includes('シナリオH濃厚'),'画面にH濃厚が残っている');
  assert.ok(html.includes('該当なし：開始の選び方・記録を確認してください'),'該当なしの案内が出ていない');
  assert.ok(!after.template(ctx(S)).includes('ｼﾅﾘｵH濃厚'),'テンプレ見出しにH濃厚が残っている');
});

test('S01. ①失敗→②失敗 ではH表示が残る',()=>{
  const S=after.normalizeState(sessionOf(['t1','t2']));
  const row=rowOf(S);
  assert.deepEqual(clone(row.candidates),['H']);
  assert.equal(row.scenarioH,true);
  assert.ok(page(S).includes('シナリオH濃厚：3回目のBZでAT濃厚'));
  assert.ok(after.template(ctx(S)).includes('ｼﾅﾘｵH濃厚'));
});

test('S01. ①失敗→取消でH表示が消える',()=>{
  const S=after.normalizeState({});
  assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t1',r:'miss'}));
  assert.ok(page(S).includes('シナリオH濃厚'));
  // 「↩ 取消」は engine が状態を巻き戻して normalizeState をかけ直す
  S.atLog.sessions[0].events=[];S.bzT1.t1=0;
  after.normalizeState(S);
  assert.ok(!page(S).includes('シナリオH濃厚'),'取消後もH濃厚が残っている');
  assert.ok(!page(S).includes('該当なし'),'記録が無いのに該当なしが出ている');
});

test('S01. 長さ1〜4の全テーブル列（7+49+343+2401）でH表示＝（候補=={H}）',()=>{
  let total=0,hTrue=0,empty=0,wasH=0;
  // 改修前の独自判定（開始が分かっていて1回目のBZがテーブル1）
  const oldRule=tables=>tables[0]==='t1';
  const walk=tables=>{
    const S=after.normalizeState(sessionOf(tables));
    const row=rowOf(S);
    const onlyH=row.candidates.length===1&&row.candidates[0]==='H';
    assert.equal(row.scenarioH,onlyH,tables.join('→')+': H表示が候補集合と一致しない');
    // 画面・テンプレ・カードモデルが同じ判定を見ていること
    assert.equal(page(S).includes('シナリオH濃厚'),onlyH,tables.join('→')+': 画面がずれている');
    assert.equal(after.template(ctx(S)).includes('ｼﾅﾘｵH濃厚'),onlyH,tables.join('→')+': テンプレがずれている');
    assert.equal(page(S).includes('該当なし：開始の選び方・記録を確認してください'),row.candidates.length===0,tables.join('→')+': 該当なしの出し方がずれている');
    if(onlyH)assert.ok(oldRule(tables),tables.join('→')+': 改修前の判定が正しいHを取りこぼしていた（偽陰性は0件のはず）');
    total++;if(onlyH)hTrue++;if(!row.candidates.length)empty++;if(oldRule(tables))wasH++;
  };
  let level=[[]];
  for(let depth=1;depth<=4;depth++){
    const next=[];
    for(const base of level)for(const id of IDS)next.push(base.concat(id));
    next.forEach(walk);
    level=next;
  }
  assert.equal(total,7+49+343+2401);
  console.log(`  S01 全組合せ ${total}件：H表示 ${hTrue}件／候補なし ${empty}件／改修前の独自判定でH ${wasH}件（誤表示 ${wasH-hTrue}件）`);
  // 実測で固定する。改修前は偽陽性393件・偽陰性0件だった（正しいHは必ず含んでいた）
  assert.equal(hTrue,7,'正しいH表示の件数が変わった');
  assert.equal(empty,1329,'候補が空になる件数が変わった');
  assert.equal(wasH,400,'改修前の独自判定の件数が変わった');
});

test('S01. 開始が不明のAT間はH表示を出さない（BZで絞らないため）',()=>{
  for(const tables of [['t1'],['t1','t2'],['t1','t5']]){
    const S=after.normalizeState(sessionOf(tables,{known:false}));
    assert.equal(rowOf(S).scenarioH,false,tables.join('→'));
    assert.ok(!page(S).includes('シナリオH濃厚'));
  }
});

// ===== 台帳 S02: 差し込み中はAT間を閉じる出来事を受け付けない =====
test('S02. 差し込み中は成功系4種を拒否し、記録・集計・AT間数が変わらない',()=>{
  // 先に ⑥失敗 を1件入れてあるので、次のBZは2回目＝計上先は bzT2。
  // 差し込みの拒否は計上先の判定より前に効くので、拒否の確認には bzT1 を渡している。
  const closers=[
    ['bzQuest',{d:'bzT1',n:'questN1',q:'t3',r:'win'},'BZ成功',{d:'bzT2',n:'questN2',q:'t3',r:'win'}],
    ['bzQuest',{d:'bzT1',n:'questN1',q:'t7',r:'win'},'⑦の［＋］',{d:'bzT2',n:'questN2',q:'t7',r:'win'}],
    ['atEvent',{t:'fuku',r:'win'},'福引成功',{t:'fuku',r:'win'}],
    ['atEvent',{t:'otherAt'},'BZ以外でAT',{t:'otherAt'}]
  ];
  for(const [name,ds,label,okDs] of closers){
    const S=after.normalizeState({});
    assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t6',r:'miss'}));
    assert.ok(act(S,'atEvent',{t:'eye',c:'jay'}));
    const before=JSON.stringify(S);
    assert.equal(act(S,'atInsert',{index:'0'}),false);
    assert.equal(act(S,name,ds),false,label+': 拒否されていない');
    assert.equal(JSON.stringify(S),before,label+': 状態が変わった');
    assert.equal(S.atLog.sessions.length,1,label+': AT間が増えた');
    assert.ok(page(S).includes('AT当選はこのカードの前に差し込めません（通常の記録で入れてください）'),label+': 断りが出ていない');
    // ［やめる］で断りも消える
    assert.equal(act(S,'atInsertCancel'),false);
    assert.ok(!page(S).includes('差し込めません'),label+': 断りが残っている');
    // 差し込みを外せば通常どおり記録できる（末尾に積まれ、AT間が閉じて次のAT間が始まる）
    assert.ok(act(S,name,okDs),label+': 通常の記録まで拒否している');
    assert.equal(S.atLog.sessions.length,2,label+': AT間が閉じていない');
    assert.equal(S.atLog.sessions[0].events.length,3,label+': 末尾に積まれていない');
  }
});

test('S02. 差し込み中でも失敗・示唆・ランプは従来どおり入る',()=>{
  for(const [name,ds,t] of [['bzQuest',{d:'bzT1',n:'questN1',q:'t3',r:'miss'},'bz'],
                            ['atEvent',{t:'serif',c:'s3'},'serif'],
                            ['atEvent',{t:'fuku',r:'miss'},'fuku'],
                            ['atEvent',{t:'lamp',c:'red'},'lamp'],
                            ['atEvent',{t:'eye',c:'jay'},'eye']]){
    const S=after.normalizeState({});
    assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t6',r:'miss'}));
    assert.equal(act(S,'atInsert',{index:'0'}),false);
    assert.ok(act(S,name,ds),t+': 差し込めない');
    assert.equal(S.atLog.sessions[0].events[0].t,t,t+': 先頭に入っていない');
    assert.equal(S.atLog.sessions.length,1);
    assert.ok(!page(S).includes('差し込めません'));
  }
});

// モンハンサンブレイク BZタブの導線改善3点（夢爽承認 2026-10-10）。
// 1. 入口の並びを実戦の流れに合わせる（BZ → ランプ → アイキャッチ → セリフ → 福引 → そのほか）
// 2. 「ここから記録」の見出し直下に入口へのジャンプ列を置く（画面だけの操作）
// 3. 結果アイコンのボタンに帯と文字色を付ける（テーブル①〜⑦の帯色。＋G は中立色）
//
// 保存形式・集計・AT間ログ・候補計算・テンプレ・両カードの中身は変えない。
// 色の正解は実装の定数を使わず、この中で手で転記する（二重転記で誤りを拾う）。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const repo=decodeURIComponent(root.pathname).replace(/^[/]/,'');
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const load=src=>{const box={window:{},document:{getElementById:()=>null},setTimeout:()=>0};vm.runInNewContext(src,box);return box.window.CheckerConfigs.mhsunbreak;};
const show=ref=>execFileSync('git',['-c','safe.directory='+repo,'show',ref],{encoding:'utf8',maxBuffer:1<<26});
const config=load(read('checker-data/mhsunbreak.js'));
const clone=v=>JSON.parse(JSON.stringify(v));
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const page=(S,mode)=>config.pages(Object.assign(ctx(S),{mode:mode===undefined?1:mode,crow:()=>''}),()=>'')[2]();
const act=(S,name,ds,mode)=>config.actions[name](Object.assign(ctx(S),{mode:mode===undefined?1:mode}),ds||{});
const bz=(table,r)=>({t:'bz',table,r:r||'miss'});
const sess=(events,start,closed)=>({start:start||{known:true,prior:0},events,closed:!!closed});
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const fresh=()=>config.normalizeState({});

// ===== 1. 入口の並び =====
const ORDER=['BZ（ブレイクゾーン）','BZ終了時PUSH ランプ','アイキャッチ（ステージチェンジ）','チッチェのセリフ','アイルー福引','そのほか'];
test('1. 入口の並びが実戦の流れ（BZ → ランプ → アイキャッチ → セリフ → 福引 → そのほか）',()=>{
  const html=page(fresh());
  const heads=[...html.matchAll(/<div class="entry-h">([^<]*)<\/div>/g)].map(m=>m[1]);
  // 先頭は「このAT間の開始」（記録前だけ出る）
  assert.equal(heads[0],'このAT間の開始');
  assert.deepEqual(heads.slice(1),ORDER,'入口の並びが指示と違う');
  // 1件記録すると開始の入口が消え、並びはそのまま
  const S=fresh();
  assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:'t3',r:'miss'}));
  assert.deepEqual([...page(S).matchAll(/<div class="entry-h">([^<]*)<\/div>/g)].map(m=>m[1]),ORDER);
  // 記録の種類と保存形式は変えていない（ランプは従来どおり atEvent の lamp）
  assert.ok(page(S).includes('data-action="atEvent" data-t="lamp" data-c="white"'));
});

// ===== 2. ジャンプ列 =====
const JUMPS=[['bz','BZ','ent-bz'],['lamp','ランプ','ent-lamp'],['eye','アイキャッチ','ent-eye'],
             ['serif','セリフ','ent-serif'],['fuku','福引','ent-fuku']];
test('2. ジャンプ5つが「ここから記録」の直下にあり、それぞれの入口に id がある',()=>{
  const html=page(fresh());
  const row=html.match(/<div class="jump-row">([\s\S]*?)<\/div>\s*\n/);
  assert.ok(row,'ジャンプ列が無い');
  const labels=[...row[1].matchAll(/data-k="(\w+)"[^>]*>([^<]*)</g)].map(m=>[m[1],m[2]]);
  assert.deepEqual(labels,JUMPS.map(j=>[j[0],j[1]]),'ジャンプの並び・文言が違う');
  // 見出しの直後に出る（入口より前）
  assert.ok(html.indexOf('<div class="rec-h">ここから記録</div>')<html.indexOf('<div class="jump-row">'));
  assert.ok(html.indexOf('<div class="jump-row">')<html.indexOf('id="ent-bz"'));
  // 飛び先の id が全部ある
  for(const [,,id] of JUMPS)assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id+' が1つでない');
  // 減算モードでもジャンプは出る（読むための移動なので止めない）
  assert.ok(page(fresh(),-1).includes('data-action="bzJump"'));
});

test('2. ジャンプは取消の履歴にも保存にも触れない（false を返す）',()=>{
  const S=fresh();
  const before=JSON.stringify(S);
  for(const [k] of JUMPS)assert.equal(act(S,'bzJump',{k}),false,k+': false を返していない');
  assert.equal(act(S,'bzJump',{k:'unknown'}),false);
  assert.equal(act(S,'bzJump',{}),false);
  assert.equal(JSON.stringify(S),before,'ジャンプで状態が変わった');
});

// ===== 3. 結果アイコンの色 =====
// 手で転記（テーブル①〜⑦の帯色。＋G だけ中立色）
const COLOR={'QUEST青':'#83caff','QUEST黄':'#ffe881','ライゼクス':'#a9e6ad','セルレギオス':'#ffb77f',
             'オロミドロ亜種':'#ff9b9b','テオ・テスカトル':'#cbb4ff','AT':'#ffc94d','＋G':'#9a90a8'};
const ICONS={
  t1:['QUEST青','QUEST青','QUEST黄','QUEST黄','ライゼクス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル'],
  t2:['QUEST黄','QUEST黄','ライゼクス','ライゼクス','セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル'],
  t3:['ライゼクス','ライゼクス','セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G'],
  t4:['セルレギオス','セルレギオス','オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G'],
  t5:['オロミドロ亜種','オロミドロ亜種','テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G','＋G','＋G'],
  t6:['テオ・テスカトル','テオ・テスカトル','AT','＋G','＋G','＋G','＋G','＋G','＋G','＋G'],
  t7:['AT','＋G','＋G','＋G','＋G','＋G','＋G','＋G','＋G','＋G']
};
const btnsOf=html=>[...html.matchAll(/<button[^>]*class="pos-btn[^"]*"[^>]*>[^<]*<\/button>/g)].map(m=>m[0]);
test('3. 結果アイコン11ボタンの色がテーブルの帯色と一致（入力フォーム側・6テーブル）',()=>{
  let n=0;
  for(const id of ['t1','t2','t3','t4','t5','t6']){
    const S=fresh();
    assert.equal(act(S,'bzPick',{q:id}),false);
    const btns=btnsOf(page(S));
    assert.equal(btns.length,11,id+': 11ボタンでない');
    ICONS[id].forEach((name,i)=>{
      const b=btns[i];
      assert.ok(b.includes('data-pos="'+(i+1)+'"'),id+' 位置'+(i+1)+': 並びが違う');
      assert.ok(b.includes('style="--c:'+COLOR[name]+'"'),id+' 位置'+(i+1)+'（'+name+'）: 色が '+COLOR[name]+' でない / '+b);
      // 色だけに頼らない（番号と名前の文字を残す）
      assert.ok(b.includes('>'+(i+1)+'：'+name+'<'),id+' 位置'+(i+1)+': 番号と名前の文字が無い');
      n++;
    });
    // ［未記録で進む］には色を付けない
    assert.ok(!btns[10].includes('--c:'),id+': 未記録に色が付いている');
    assert.ok(btns[10].includes('>未記録で進む<'));
  }
  assert.equal(n,60);
  // ⑦は結果アイコンを出さない（位置1 AT を自動で入れる）
  const S7=fresh();act(S7,'bzPick',{q:'t7'});
  assert.equal(btnsOf(page(S7)).length,0);
  assert.ok(page(S7).includes('位置1 AT を自動で記録します'));
});

test('3. 経過カードの詳細側も同じ色（7テーブル×10＝70）',()=>{
  let n=0;
  for(const id of Object.keys(ICONS)){
    const S=fresh();
    assert.ok(act(S,'bzQuest',{d:'bzT1',n:'questN1',q:id,r:id==='t7'?'win':'miss'}));
    if(id==='t7')act(S,'bzPosOpen',{});
    const btns=btnsOf(page(S));
    assert.equal(btns.length,11,id+': 11ボタンでない');
    ICONS[id].forEach((name,i)=>{
      assert.ok(btns[i].includes('data-action="bzPos"'),id+': 詳細側のボタンでない');
      assert.ok(btns[i].includes('style="--c:'+COLOR[name]+'"'),id+' 位置'+(i+1)+'（'+name+'）: 色が違う');
      assert.ok(btns[i].includes('>'+(i+1)+'：'+name+'<'));
      n++;
    });
    assert.ok(!btns[10].includes('--c:'),id+': ［未記録］に色が付いている');
  }
  assert.equal(n,70);
});

test('3. 「選択済み」の行にも同じ色を使い、文言は変えない',()=>{
  // 入力フォーム側（③の位置3＝セルレギオス）
  const S=fresh();
  act(S,'bzPick',{q:'t3'});act(S,'bzPickPos',{pos:'3'});
  let html=page(S);
  assert.ok(html.includes('選択済み：3個目・セル'),'文言が変わっている');
  assert.ok(html.includes('class="nm" style="color:'+COLOR['セルレギオス']+'">選択済み：3個目・セル'),'色が付いていない');
  // ［未記録で進む］のときは色を付けない
  act(S,'bzPickPosOpen',{});act(S,'bzPickPos',{pos:''});
  html=page(S);
  assert.ok(html.includes('>選択済み：未記録<'),'未記録の文言が変わっている');
  // 経過カードの詳細側（⑥の位置4＝＋G は中立色）
  const T=fresh();
  assert.ok(act(T,'bzQuest',{d:'bzT1',n:'questN1',q:'t6',r:'miss'}));
  assert.ok(act(T,'bzPos',{index:'0',pos:'4'}));
  assert.ok(page(T).includes('class="nm" style="color:'+COLOR['＋G']+'">選択済み：4個目・＋G'));
});

// ===== この改修が保存・集計・テンプレ・カードを変えていないこと =====
const BASE='ae75ca2';   // 改修前の main（PR #40 のマージ）
const before=load(show(BASE+':checker-data/mhsunbreak.js'));
const DATA={
  empty:{},
  legacyIcon:{iconPending:['qBlue','rai'],iconLog:[
    {group:'bzT1',icons:['qBlue','rai'],result:'win'},{group:'bzT2',icons:['qYellow','sel'],result:'miss'},
    {group:'bzT1',icons:['rai','oro'],result:'miss'},{group:'bzT2',icons:['sel','teo'],result:'win'},
    {group:'bzT1',icons:['oro','teo'],result:'miss'},{group:'bzT2',icons:['teo','rush'],result:'win'},
    {group:'bzT1',icons:['rush'],result:'miss'},{group:'bzT2',icons:['gold','teo'],result:'win'},
    {group:'bzT1',icons:['blaze'],result:'miss'},{group:'bzT2',icons:['unknown','rai'],result:'win'}]},
  legacyQuestN:{questN:{blue:3,raizex:2,at:1},bzT1:{blue:4,raizex:3,t3:2},bzT2:{serregios:2,t5:1},
    questN1:{blue:2,t3:1},questN2:{t5:1}},
  atLogFull:{games:0,hits:[123,456,789],counts:{at:3},czType:{breakzone:12,airou:4},
    cycle:{c1:2,c2:1,c3:3,c4:0,c5:1},bz:{weakNormalD:20,weakNormalN:3,strongNormalD:8,strongNormalN:4},
    bzT1:{t1:1,t3:2,t5:1},bzT2:{t2:2,t4:1,t6:1,t7:1},questN1:{t3:1},questN2:{t4:1,t7:1},
    atLog:{sessions:[
      sess([{t:'eye',c:'jay'},bz('t3'),{t:'serif',c:'s3'},bz('t4'),{t:'fuku',r:'miss'},bz('t5','win')],null,true),
      sess([bz('t1'),{t:'eye',c:'chiche'},bz('t2'),{t:'serif',c:'s1'},{t:'fuku',r:'win'}],null,true),
      sess([bz('t6'),{t:'otherAt'}],null,false)]}},
  unknownStart:{atLog:{sessions:[sess([bz('t1'),bz('t2'),bz('t3'),bz('t4'),bz('t5'),bz('t6'),{t:'eye',c:'bahari'}],{known:false},false)]}},
  sessionMax:{atLog:{sessions:Array.from({length:55},(_,i)=>sess([bz('t'+((i%7)+1)),bz('t'+((i%6)+1),'win')],null,true))}}
};
const totals=S=>clone({bzT1:S.bzT1,bzT2:S.bzT2,questN1:S.questN1,questN2:S.questN2,
  czType:S.czType,cycle:S.cycle,bz:S.bz,hits:S.hits,games:S.games,counts:S.counts});
const cardJson=(cfg,S)=>clone({blocks:cfg.card.blocks(ctx(S)),chart:cfg.card.chart(ctx(S)),
  bottom:cfg.card.bottom(ctx(S)),detail:cfg.card.detail(ctx(S))});
const sameOutputs=(name,was,now)=>{
  assert.deepEqual(Buffer.from(JSON.stringify(now)),Buffer.from(JSON.stringify(was)),name+': normalizeState のバイト列が一致しない');
  assert.deepEqual(totals(now),totals(was),name+': 集計が一致しない');
  for(const key of ['template','compactTemplate'])
    assert.deepEqual(Buffer.from(config[key](ctx(now))),Buffer.from(before[key](ctx(was))),name+': '+key+' が一致しない');
  assert.deepEqual(cardJson(config,now),cardJson(before,was),name+': カードJSONが一致しない');
  assert.deepEqual(clone(config.scenarioModel(now)),clone(before.scenarioModel(was)),name+': シナリオカードJSONが一致しない');
};
test('4. 保存データ6通りが改修前（'+BASE+'）と一致',()=>{
  for(const [name,data] of Object.entries(DATA))
    sameOutputs(name,before.normalizeState(clone(data)),config.normalizeState(clone(data)));
});

test('4. 操作列（ジャンプを挟んでも）改修前と一致',()=>{
  const steps=[
    ['atStart',{known:'true',prior:'1'}],
    ['bzJump',{k:'bz'}],
    ['bzPick',{q:'t3'}],['bzPickPos',{pos:'4'}],['bzQuest',{d:'bzT2',n:'questN2',q:'t3',r:'miss'}],
    ['bzJump',{k:'lamp'}],['atEvent',{t:'lamp',c:'red'}],
    ['bzJump',{k:'eye'}],['atEvent',{t:'eye',c:'bahari'}],
    ['bzJump',{k:'serif'}],['atEvent',{t:'serif',c:'s3'}],
    ['bzJump',{k:'fuku'}],['atEvent',{t:'fuku',r:'miss'}],
    ['bzPick',{q:'t5'}],['bzQuest',{d:'bzT2',n:'questN2',q:'t5',r:'miss'}],
    ['atOpen',{index:'0'}],['bzPos',{index:'0',pos:'2'}],
    ['bzPick',{q:'t7'}],['bzQuest',{d:'bzT2',n:'questN2',q:'t7',r:'win'}],
    ['bzPick',{q:'t1'}],['bzPickPos',{pos:'1'}],['bzQuest',{d:'bzT1',n:'questN1',q:'t1',r:'miss'}]
  ];
  const run=cfg=>{
    const S=cfg.normalizeState({});
    // 改修前には bzJump が無い。無いものは押さなかったことにする（戻り値は false 相当）
    const results=steps.map(([name,ds])=>typeof cfg.actions[name]==='function'
      ?cfg.actions[name](Object.assign(ctx(S),{mode:1}),ds):false);
    return {S,results};
  };
  const a=run(before),b=run(config);
  assert.deepEqual(b.results,a.results,'操作の戻り値（取消のラベル）が一致しない');
  sameOutputs('操作列',a.S,b.S);
});

// ===== なな様のイラスト（画像カードと同じ扱い）=====
test('5. イラストは1か所の設定で切れる／なな様を選んでいるときだけ出す',()=>{
  const src=read('checker-data/mhsunbreak.js');
  assert.equal(src.split('const NANA_ON_SCENARIO_CARD=').length-1,1,'切替の定数が1か所でない');
  assert.equal(src.split("const NANA_ICON=").length-1,1,'画像のパスが1か所でない');
  assert.ok(/const NANA_ICON='assets\/nana-icon\.jpg'/.test(src),'画像カードと同じファイルを使っていない');
  assert.ok(fs.existsSync(new URL('assets/nana-icon.jpg',root)),'assets/nana-icon.jpg が無い');
  // 出す条件は engine の effectiveIconChoice()==='nana' だけ（機種側で判定を持たない）
  assert.ok(/effectiveIconChoice\(\)==='nana'/.test(src),'engine の判定を使っていない');
  // クレジットの文は engine から取る（機種側に @nana_szsr を直書きしない）
  assert.ok(src.includes("nanaCreditText('card')"),'engine のクレジットを使っていない');
  assert.ok(!src.includes('@nana_szsr'),'機種側にクレジットの文が直書きされている');
  // 定数を false にすると、出す判定が必ず false になる
  const off=load(src.replace('const NANA_ON_SCENARIO_CARD=true','const NANA_ON_SCENARIO_CARD=false'));
  assert.ok(off,'定数を false にすると読み込めない');
  // 保存データ・カードJSONは絵の有無に関わらず同じ（描画だけの違い）
  const S=config.normalizeState({atLog:{sessions:[sess([bz('t1')])]}});
  const T=off.normalizeState({atLog:{sessions:[sess([bz('t1')])]}});
  assert.deepEqual(clone(off.scenarioModel(T)),clone(config.scenarioModel(S)),'絵の設定でカードの中身が変わっている');
  assert.deepEqual(Buffer.from(off.template(ctx(T))),Buffer.from(config.template(ctx(S))),'絵の設定でテンプレが変わっている');
});

console.log('PASS mhsunbreak BZタブの導線改善: '+checks+' checks');

// BZシナリオカードの候補絞り。出典（一撃 /48/・/57/、ちょんぼりすた 264514）の表から
// 「確実に言えること」だけで絞る仕様を固定する。保存データ・集計・テンプレ・既存カードは不変。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=read('checker-data/mhsunbreak.js');
const load=src=>{const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs.mhsunbreak;};
const config=load(source);
const baseline=load(execFileSync('git',['-c','safe.directory='+decodeURIComponent(root.pathname).replace(/^\//,''),'show','b280977:checker-data/mhsunbreak.js'],{encoding:'utf8',maxBuffer:1<<26}));
const clone=v=>JSON.parse(JSON.stringify(v));
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const ALL=['A','B','C','D','E','F','G','H','I'];
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
// 1つのAT間だけを持つ状態を作る
const one=(events,start)=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[{start:start||{known:true,prior:0},events,closed:false}]};
  config.normalizeState(S);
  return S;
};
const cand=(events,start)=>{
  const model=config.scenarioModel(one(events,start));
  return model.rows.length?[...model.rows[0].candidates]:[];
};
const bz=(table,r)=>({t:'bz',table,r:r||'miss'});
const eye=c=>({t:'eye',c});
const serif=c=>({t:'serif',c});

test('夢爽の指定した5ケース',()=>{
  // ジェイ（B以上）→ BZ1 ③× → BZ2 ④
  assert.deepEqual(cand([eye('jay'),bz('t3','miss'),bz('t4','miss')]),['C','F','G','I']);
  // BZ1 ①
  assert.deepEqual(cand([bz('t1')]),['H']);
  // BZ1 ⑤
  assert.deepEqual(cand([bz('t5')]),['G']);
  // チッチェ（G以上）→ BZ1 ②
  assert.deepEqual(cand([eye('chiche'),bz('t2')]),['H','I']);
  // 記録なしのAT間（イベントが無いので行自体が出ない）／イベントが1件でもあれば9つから始まる
  assert.deepEqual(clone(config.scenarioModel(clone(config.defaults)).rows),[]);
  assert.deepEqual(cand([{t:'fuku',r:'miss'}]),ALL);
});

test('known:false はアイキャッチだけで絞る',()=>{
  assert.deepEqual(cand([bz('t1'),bz('t5'),{t:'serif',c:'s4'}],{known:false}),ALL);
  assert.deepEqual(cand([eye('jay'),bz('t1')],{known:false}),['B','C','D','E','F','G','H','I']);
});

test('アイキャッチは H・I を消さない（アルファベット順の外）',()=>{
  assert.deepEqual(cand([eye('jay')]),['B','C','D','E','F','G','H','I']);
  assert.deepEqual(cand([eye('luchika')]),['C','D','E','F','G','H','I']);
  assert.deepEqual(cand([eye('fiorene')]),['D','E','F','G','H','I']);
  assert.deepEqual(cand([eye('bahari')]),['E','F','G','H','I']);
  assert.deepEqual(cand([eye('galeas')]),['F','G','H','I']);
  assert.deepEqual(cand([eye('chiche')]),['G','H','I']);
  // 弱いアイキャッチが後から出ても、強い方の絞りは残る
  assert.deepEqual(cand([eye('chiche'),eye('jay')]),['G','H','I']);
});

test('BZ4回目まで記録したAT間では H・I が消える',()=>{
  const four=cand([bz('t3'),bz('t3'),bz('t3'),bz('t3')]);
  assert.ok(!four.includes('H')&&!four.includes('I'),JSON.stringify(four));
  // 3回目までなら H・I は残る。⑦は HI/SP なので、3回目が HI の B・E も残る
  assert.deepEqual(cand([bz('t2'),bz('t2'),bz('t7')]),['B','E','H','I']);
  // ［途中から：既にBZ3回］なら、最初のBZが4回目になって H・I が消える
  assert.ok(!cand([bz('t3')],{known:true,prior:3}).some(n=>n==='H'||n==='I'));
});

test('テーブル→レベルの対応（①LOW ②LOW/MID ③LOW/MID/HI ④MID/HI ⑤⑥HI ⑦HI/SP）',()=>{
  // 1回目のレベル: A〜F=MID, G=HI, H=LOW, I=MID
  assert.deepEqual(cand([bz('t1')]),['H']);
  assert.deepEqual(cand([bz('t2')]),['A','B','C','D','E','F','H','I']);
  assert.deepEqual(cand([bz('t3')]),ALL);
  assert.deepEqual(cand([bz('t4')]),['A','B','C','D','E','F','G','I']);
  assert.deepEqual(cand([bz('t5')]),['G']);
  assert.deepEqual(cand([bz('t6')]),['G']);
  assert.deepEqual(cand([bz('t7')]),['G']);
  // ⑦は HI/SP。3回目が HI の B・E・F・G と、SP の H・I が残る（3回目が LOW の A・C・D は消える）
  assert.deepEqual(cand([bz('t3'),bz('t3'),bz('t7')]),['B','E','F','G','H','I']);
});

test('チッチェのセリフは次のBZを絞る（s1・s2 は使わない）',()=>{
  // s3（HI以上濃厚）→ 1回目が HI のシナリオだけ
  assert.deepEqual(cand([serif('s3')]),['G']);
  // s4（SP濃厚）→ 1回目が SP のシナリオは無い＝該当なし
  assert.deepEqual(cand([serif('s4')]),[]);
  // 2回目に向けた s4 → 3回目がSPの H・I ではなく「2回目がSP」なので該当なし
  assert.deepEqual(cand([bz('t3'),serif('s4')]),[]);
  // 2回目に向けた s3 → 2回目が HI のシナリオ（C・F・G）
  assert.deepEqual(cand([bz('t3'),serif('s3')]),['C','F','G']);
  // s1・s2 は絞らない
  assert.deepEqual(cand([serif('s1'),serif('s2')]),ALL);
  // 福引をまたいでも番号は進まない（COUNT_FUKU_AS_CZ=false）
  assert.deepEqual(cand([{t:'fuku',r:'miss'},serif('s3')]),['G']);
});

test('候補が0なら「該当なし」の行になる／表の範囲外（8回目以降）は絞らない',()=>{
  const S=one([bz('t1'),bz('t5')]);
  const row=clone(config.scenarioModel(S).rows[0]);
  assert.deepEqual(row.candidates,[]);
  // 7回目は全シナリオ SP なので、①（LOW）だと該当なしになる
  assert.deepEqual(cand([bz('t1')],{known:true,prior:6}),[]);
  // 8回目以降は表に無いので絞り込みに使わない（7回目までの絞りが残る）
  assert.deepEqual(cand([bz('t7')],{known:true,prior:6}),['A','B','C','D','E','F','G']);
  assert.deepEqual(cand([bz('t7'),bz('t1')],{known:true,prior:6}),['A','B','C','D','E','F','G']);
});

test('カードの中身（行・テーブル集計・注記）',()=>{
  const S=clone(config.defaults);
  S.atLog={sessions:[
    {start:{known:true,prior:0},events:[bz('t3','miss'),eye('bahari'),{t:'fuku',r:'win'}],closed:true},
    {start:{known:true,prior:0},events:[bz('t1','miss')],closed:false}
  ]};
  S.bzT1.t3=1;S.bzT2.t1=2;S.questN2.t1=1;
  config.normalizeState(S);
  const m=clone(config.scenarioModel(S));
  assert.deepEqual(m.rows.map(r=>r.label),['AT間1','AT間2']);
  assert.deepEqual(m.rows[0].eye,{text:'ﾊﾞﾊﾘ(E以上)',color:'#a9e6ad'});
  assert.equal(m.rows[0].scenarioH,false);
  assert.deepEqual(m.rows[0].flow,[{no:'1',mark:'③',color:'#a9e6ad',result:'×'}]);
  assert.equal(m.rows[1].scenarioH,true);
  assert.deepEqual(m.rows[1].flow,[{no:'1',mark:'①',color:'#83caff',result:'×'}]);
  assert.deepEqual(m.rows[1].candidates,['H']);
  assert.deepEqual(m.tables.map(t=>t.mark),['①','②','③','④','⑤','⑥','⑦']);
  assert.deepEqual(m.tables[0],{mark:'①',color:'#83caff',hit:1,count:2});
  assert.deepEqual(m.tables[2],{mark:'③',color:'#a9e6ad',hit:0,count:1});
  assert.deepEqual(m.note,['シナリオ選択率には設定差があるとされています（数値は設定1のみ公表）。','候補は解析の表から確実に言えるものだけで絞っています。']);
  // 番号なし（不明）の流れは BZ?
  const U=one([bz('t3','win')],{known:false});
  assert.deepEqual(clone(config.scenarioModel(U).rows[0].flow),[{no:'?',mark:'③',color:'#a9e6ad',result:'○'}]);
});

test('保存データ・集計・テンプレ・既存カードは b280977 と同じ',()=>{
  assert.equal(JSON.stringify(config.defaults),JSON.stringify(baseline.defaults));
  assert.equal(JSON.stringify(config.mergeKeys),JSON.stringify(baseline.mergeKeys));
  assert.equal(config.storageKey,baseline.storageKey);
  const raws=[null,{},{bzT1:{t1:2},questN1:{t1:1}},
    {bzT1:{blue:3},questN:{blue:1},iconLog:[{icons:['rai'],group:'bzT1',quest:'raizex',result:'win'}]},
    {atLog:{sessions:[{start:{known:false},events:[bz('t3')],closed:false}]}}];
  for(const raw of raws){
    const a=baseline.normalizeState(Object.assign(clone(baseline.defaults),clone(raw)||{}),clone(raw));
    const b=config.normalizeState(Object.assign(clone(config.defaults),clone(raw)||{}),clone(raw));
    assert.equal(JSON.stringify(b),JSON.stringify(a),JSON.stringify(raw));
  }
  const S=clone(config.defaults);
  S.hits=[300,520];S.atEnd.jay=1;S.trophy.gold=1;S.cycle.c1=2;
  config.actions.bzQuest(ctx(S),{d:'bzT1',q:'t3',r:'miss'});
  config.actions.atEvent(ctx(S),{t:'eye',c:'bahari'});
  for(const key of ['template','compactTemplate'])assert.deepEqual(Buffer.from(config[key](ctx(clone(S)))),Buffer.from(baseline[key](ctx(clone(S)))),key);
  const card=c=>JSON.stringify(Object.fromEntries(['blocks','chart','bottom','detail'].map(k=>[k,c.card[k](ctx(clone(S)))])));
  assert.equal(card(config),card(baseline));
  // カードタブは engine のカードの後ろに自分の節を足すだけ
  const page=cfg=>cfg.pages(ctx(clone(S)),()=> '[CARD]')[3]();
  assert.equal(page(baseline),'[CARD]');
  assert.ok(page(config).startsWith('[CARD]'));
  assert.match(page(config),/data-action="scenarioCard"/);
  assert.match(page(config),/data-action="scenarioSave"/);
  assert.match(page(config),/<canvas id="scenarioCanvas" width="1080" height="1080">/);
});

console.log(`PASS mhsunbreak BZ scenario card: ${checks} checks`);

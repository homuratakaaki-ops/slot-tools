import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('checker-data/mhsunbreak.js');
const load=code=>{const box={window:{}};vm.runInNewContext(code,box);return box.window.CheckerConfigs.mhsunbreak;};
const config=load(source),clone=v=>JSON.parse(JSON.stringify(v));
const fresh=()=>clone(config.defaults);
const ctx=(S,mode=1)=>({S,mode,pct:(n,d)=>`${n}/${d}`,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const html=(S,mode=1,c=config)=>c.pages(ctx(S,mode),()=> '')[2]();
const action=(S,name,ds,mode=1,c=config)=>c.actions[name](ctx(S,mode),ds);
const bz=(S,table='t1',r='miss',d='bzT1',mode=1,c=config)=>action(S,'bzQuest',{d,q:table,r},mode,c);
const event=(S,t,c,r)=>action(S,'atEvent',{t,c,r});
const current=S=>S.atLog.sessions.at(-1);
const buttons=(S,mode=1)=>[...html(S,mode).matchAll(/<button\b[^>]*>/g)].map(m=>m[0]);
const group=(S,d,mode=1)=>buttons(S,mode).filter(b=>b.includes(`data-d="${d}"`));
const empty={start:{known:true,prior:0},events:[],closed:false};
const equal=(a,b)=>assert.deepEqual(clone(a),clone(b));
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}

test('default open AT interval; atLog excluded from numeric merge',()=>{
  equal(fresh().atLog,{sessions:[empty]});assert.ok(!config.mergeKeys.includes('atLog'));
  const S=fresh();assert.equal(buttons(S).filter(b=>b.includes('data-action="atStart"')).length,8);
  assert.equal(buttons(S).filter(b=>b.includes('aria-pressed="true"')&&b.includes('class="at-btn on"')).length,1);
});
test('BZ1 table1 failure counts and shows H; group advances',()=>{
  const S=fresh();assert.notEqual(bz(S),false);assert.equal(S.bzT1.t1,1);assert.equal(S.questN1.t1,0);
  equal(current(S).events,[{t:'bz',table:'t1',r:'miss'}]);
  assert.match(html(S),/BZ1回目 ① 青スタート 失敗/);
  assert.match(html(S),/シナリオH濃厚：3回目のBZでAT濃厚/);
  assert.ok(group(S,'bzT1').every(b=>b.includes('disabled aria-disabled="true"')));
  assert.ok(group(S,'bzT2').every(b=>!b.includes('disabled')));
  assert.match(html(S),/今は2回目/);
});
test('fuku numbering controlled by the single constant; CZ aggregate untouched',()=>{
  for(const flag of [false,true]){
    const c=load(source.replace('COUNT_FUKU_AS_CZ=false',`COUNT_FUKU_AS_CZ=${flag}`)),S=clone(c.defaults);
    action(S,'atEvent',{t:'fuku',r:'miss'},1,c);
    assert.notEqual(bz(S,'t2','miss',flag?'bzT2':'bzT1',1,c),false);
    assert.match(html(S,1,c),new RegExp('BZ'+(flag?2:1)+'回目 ② 黄スタート'));
    equal(S.czType,{breakzone:0,airou:0});
  }
});
test('strongest eye remains after weaker eye; ordered events and all serif kinds',()=>{
  const S=fresh();for(const c of ['jay','bahari','jay'])event(S,'eye',c);
  assert.match(html(S),/<div class="at-top" style="--c:#a9e6ad">バハリ（緑）：シナリオE以上濃厚<\/div>/);
  equal(current(S).events.map(e=>e.c),['jay','bahari','jay']);
  for(const c of ['s1','s2','s3','s4'])assert.notEqual(event(S,'serif',c),false);
  assert.equal(current(S).events.length,7);
});
test('BZ win, t7 plus, fuku win and other AT close and open fresh intervals',()=>{
  for(const record of [S=>bz(S,'t2','win'),S=>bz(S,'t7','win'),S=>event(S,'fuku',null,'win'),S=>event(S,'otherAt')]){
    const S=fresh();record(S);assert.equal(S.atLog.sessions.length,2);assert.equal(S.atLog.sessions[0].closed,true);
    equal(current(S),empty);assert.match(html(S),/過去のAT間（1件）/);
    assert.doesNotMatch(html(S).split('<details class="hit-more">')[1].split('</details>')[0],/data-action="atDel"/);
    assert.doesNotMatch(html(S),/data-action="atStart"/);
  }
});
test('unknown start allows both groups and suppresses numbers and H',()=>{
  const S=fresh();action(S,'atStart',{known:'false'});
  assert.ok([...group(S,'bzT1'),...group(S,'bzT2')].every(b=>!b.includes('disabled')));
  bz(S);assert.match(html(S),/BZ ① 青スタート 失敗/);
  assert.doesNotMatch(html(S),/BZ1回目|シナリオH濃厚|今は\d回目/);assert.match(html(S),/開始：不明/);
});
test('prior2 only enables later group; action guard rejects wrong group without mutation',()=>{
  const S=fresh();action(S,'atStart',{known:'true',prior:'2'});
  assert.ok(group(S,'bzT1').every(b=>b.includes('disabled')));assert.ok(group(S,'bzT2').every(b=>!b.includes('disabled')));
  assert.match(html(S),/今は3回目/);const before=clone(S);assert.equal(bz(S),false);equal(S,before);
  assert.notEqual(bz(S,'t1','miss','bzT2'),false);assert.match(html(S),/BZ3回目/);assert.doesNotMatch(html(S),/シナリオH濃厚/);
});
test('start remains editable until first BZ; invalid choices rejected',()=>{
  const S=fresh();event(S,'eye','jay');event(S,'fuku',null,'miss');
  assert.notEqual(action(S,'atStart',{known:'true',prior:'2'}),false);
  for(const ds of [{known:'true',prior:'7'},{known:'true',prior:'1.5'},{known:'true',prior:'-1'},{known:'oops'}])assert.equal(action(S,'atStart',ds),false);
  bz(S,'t2','miss','bzT2');assert.doesNotMatch(html(S),/data-action="atStart"/);
  const before=clone(S);assert.equal(action(S,'atStart',{known:'false'}),false);equal(S,before);
});
test('delete only current memo; recompute numbering, strongest hint and H',()=>{
  const S=fresh();bz(S);bz(S,'t2','miss','bzT2');event(S,'eye','jay');event(S,'eye','bahari');
  action(S,'atDel',{index:'3'});assert.match(html(S),/<div class="at-top" style="--c:#f2eef5">ジェイ/);
  action(S,'atDel',{index:'0'});assert.equal(S.bzT1.t1,1);assert.equal(S.bzT2.t2,1);
  assert.match(html(S),/BZ1回目 ② 黄スタート/);assert.doesNotMatch(html(S),/シナリオH濃厚/);
  for(const index of ['-1','99','1.5','oops','',undefined])assert.equal(action(S,'atDel',{index}),false);
});
test('minus changes only aggregates, leaves memo; atEvent buttons and handler disabled',()=>{
  const S=fresh();bz(S);const log=clone(S.atLog);
  assert.notEqual(bz(S,'t1','miss','bzT1',-1),false);equal(S.atLog,log);assert.equal(S.bzT1.t1,0);
  assert.ok(group(S,'bzT1',-1).filter(b=>b.includes('data-r="win"')).every(b=>!b.includes('disabled')));
  assert.ok(buttons(S,-1).filter(b=>b.includes('data-action="atEvent"')).every(b=>b.includes('disabled')));
  assert.match(html(S,-1),/減算はテーブル別の回数だけを直します（AT間メモは各行の［削除］か「↩ 取消」で直します）。/);
  assert.equal(action(S,'atEvent',{t:'otherAt'},-1),false);equal(S.atLog,log);
});
test('invalid events are no-ops',()=>{
  const S=fresh();for(const ds of [{t:'unknown'},{t:'eye',c:'unknown'},{t:'serif',c:'s5'},{t:'fuku',r:'other'},{t:'bz',table:'t1',r:'win'}])assert.equal(action(S,'atEvent',ds),false);
  equal(S,fresh());
});
test('legacy and malformed logs normalize idempotently',()=>{
  for(const log of [undefined,null,3,{}, {sessions:{}},{sessions:[]},{sessions:[null,3,[]]}, {sessions:[{start:{known:true,prior:9.5},events:[null,{t:'unknown'},{t:'bz',table:'bad',r:'win'},{t:'eye',c:'bad'},{t:'fuku',r:'miss',extra:1}],closed:true}]}]){
    const S=fresh();S.atLog=log;config.normalizeState(S);const once=clone(S);config.normalizeState(S);equal(S,once);
    assert.equal(current(S).closed,false);assert.ok(S.atLog.sessions.length>=1);
  }
  const S=fresh();delete S.atLog;config.normalizeState(S);equal(S.atLog,{sessions:[empty]});
  S.atLog={sessions:[{start:{known:true,prior:9.5},events:[{t:'serif',c:'s1',extra:1}],closed:false}]};config.normalizeState(S);
  equal(clone(current(S)),{start:{known:true,prior:6},events:[{t:'serif',c:'s1'}],closed:false});
});
test('normalization keeps oldest 200 events and newest 50 intervals including open tail',()=>{
  const S=fresh();S.atLog={sessions:Array.from({length:55},(_,i)=>({start:{known:true,prior:i%7},closed:true,events:[{t:'eye',c:'jay'},...Array.from({length:200},()=>({t:'serif',c:'s4'}))]}))};
  config.normalizeState(S);assert.equal(S.atLog.sessions.length,50);equal(clone(current(S)),empty);
  assert.equal(S.atLog.sessions[0].start.prior,6);assert.equal(S.atLog.sessions[0].events.length,200);assert.equal(S.atLog.sessions[0].events[0].c,'jay');
  const once=clone(S);config.normalizeState(S);equal(S,once);
});
test('runtime event cap is atomic and runtime interval cap drops oldest',()=>{
  const S=fresh();for(let i=0;i<200;i++)event(S,'serif','s1');const before=clone(S);
  assert.equal(event(S,'otherAt'),false);assert.equal(bz(S),false);equal(S,before);
  const T=fresh();event(T,'eye','jay');for(let i=0;i<55;i++)event(T,'otherAt');
  assert.equal(T.atLog.sessions.length,50);equal(current(T),empty);assert.ok(T.atLog.sessions.slice(0,-1).every(s=>s.closed));
});
test('past intervals retain start, strongest eye and H',()=>{
  const S=fresh();bz(S);event(S,'eye','bahari');event(S,'otherAt');
  const past=html(S).split('<details class="hit-more">')[1].split('</details>')[0];
  assert.match(past,/1つ前のAT間/);assert.match(past,/バハリ（緑）：シナリオE以上濃厚/);assert.match(past,/シナリオH濃厚/);
});
test('v04 zero template bytes; AT log only appends the memo block at the tail',()=>{
  const S=fresh(),original=read('docs/specs/mhsunbreak-nana-template-v04.txt');
  const expected='設定判別メモ｜スマスロ モンスターハンターライズ：サンブレイク\n通常 0G / AT0回\n_______\n\n'+original.split('■').map(section=>section.replace(/▶︎ (?=\r?\n)/g,'▶︎ '+(section.startsWith('クエスト成功率')?'0/0':'0回'))).join('■')+'\n\nby slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様';
  equal(Buffer.from(config.template(ctx(S))),Buffer.from(expected));
  // 書式と ON/OFF は tests/mhsunbreak-tpl-atlog.verify.mjs が固定する。
  // ここでは「■AT間メモ 以外の本文が1バイトも動かない」ことだけを見る。
  for(const name of ['template','compactTemplate']){
    const T=fresh();
    const before=config[name](ctx(T));event(T,'eye','bahari');event(T,'serif','s4');event(T,'otherAt');
    const after=config[name](ctx(T));
    equal(Buffer.from(after.replace(/\n\n■AT間メモ\n[\s\S]*(?=\n\nby slot-tools\.jp)/,'')),Buffer.from(before));
    assert.match(after,/\n\n■AT間メモ\nAT間1 ﾊﾞﾊﾘ\(E以上\)\nﾁｯﾁｪSP濃厚 → BZ以外AT\n\nby slot-tools\.jp/);
  }
});
test('all card JSON unaffected by AT log with zero and populated aggregates',()=>{
  for(const filled of [false,true]){
    const S=fresh();if(filled){S.hits=[100,500];S.atEnd.jay=2;S.trophy.gold=1;S.czType.airou=3;}
    const card=()=>JSON.stringify(Object.fromEntries(['blocks','chart','bottom','detail'].map(k=>[k,config.card[k](ctx(S))])));
    const before=card();event(S,'eye','bahari');event(S,'serif','s4');event(S,'otherAt');assert.equal(card(),before);
  }
});
console.log(`PASS mhsunbreak AT log: ${checks} checks`);

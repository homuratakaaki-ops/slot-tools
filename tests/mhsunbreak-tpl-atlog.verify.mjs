// テンプレの「■AT間メモ」。正本 v05 の例とバイト一致すること、
// 空／チェックOFF のときは v04（＝0078fc9 の出力）と1バイトも変わらないことを固定する。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const source=read('checker-data/mhsunbreak.js');
// localStorage を差し替えられるように、機種データは毎回新しい箱で読む
const load=prefs=>{
  const mem=prefs===undefined?{}:{'mhsunbreak-checker-v1-prefs':JSON.stringify(prefs)};
  const box={window:{localStorage:prefs===null?undefined:{
    getItem:k=>Object.prototype.hasOwnProperty.call(mem,k)?mem[k]:null,
    setItem:(k,v)=>{mem[k]=String(v);}
  }},__mem:mem};
  vm.runInNewContext(source,box);
  return {config:box.window.CheckerConfigs.mhsunbreak,mem};
};
const baseline=(()=>{
  const box={window:{}};
  vm.runInNewContext(execFileSync('git',['-c','safe.directory='+decodeURIComponent(root.pathname).replace(/^\//,''),'show','0078fc9:checker-data/mhsunbreak.js'],{encoding:'utf8',maxBuffer:1<<26}),box);
  return box.window.CheckerConfigs.mhsunbreak;
})();
const clone=v=>JSON.parse(JSON.stringify(v));
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:k=>k==='card'?'テンプレ：鈴白なな様（@nana_szsr）':'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const bytes=(a,b,m)=>assert.deepEqual(Buffer.from(a),Buffer.from(b),m);
const block=text=>{const parts=text.split('■AT間メモ\n');return parts[1]===undefined?null:parts[1].split('\n\nby slot-tools.jp')[0];};
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

const v04=read('docs/specs/mhsunbreak-nana-template-v04.txt');
const v05=read('docs/specs/mhsunbreak-nana-template-v05.txt');
const EXAMPLE='AT間1 ﾊﾞﾊﾘ(E以上)\nBZ1 ③ﾗｲｾﾞｸｽ× → BZ2 ①青ｽﾀｰﾄ○\nAT間2\n福引× → BZ1 ⑤ｵﾛﾐﾄﾞﾛ亜種○';

test('正本 v05 は v04 のバイトで始まり、■AT間メモ の例を持つ',()=>{
  assert.ok(v05.startsWith(v04));
  assert.equal(Buffer.byteLength(v04),1881);
  assert.ok(!v05.includes('\r'));
  bytes(v05.slice(v04.length).split('■AT間メモ\n')[1].split('\n\n')[0],EXAMPLE);
});

test('指示の例と同じ操作で、出力が例とバイト一致する',()=>{
  const {config}=load();
  const S=clone(config.defaults);
  const act=(name,ds)=>assert.notEqual(config.actions[name](ctx(S),ds),false,name+' '+JSON.stringify(ds));
  act('bzQuest',{d:'bzT1',q:'t3',r:'miss'});
  act('atEvent',{t:'eye',c:'bahari'});
  act('bzQuest',{d:'bzT2',q:'t1',r:'win'});
  act('atEvent',{t:'fuku',r:'miss'});
  act('bzQuest',{d:'bzT1',q:'t5',r:'win'});
  const out=config.template(ctx(clone(S)));
  bytes(block(out),EXAMPLE);
  // 置き場所は■エンディング中スタンプの後ろ（最後尾）
  assert.match(out,/🍁 0回・🌈 0回\n\n■AT間メモ\n/);
  assert.equal(config.template,config.compactTemplate);
});

test('空のAT間メモは 0078fc9 の出力とバイト一致（本文は v04）',()=>{
  const {config}=load();
  const S=clone(config.defaults);
  bytes(config.template(ctx(clone(S))),baseline.template(ctx(clone(S))));
  let section='';
  const filled=v04.split('\n').map(line=>{if(line.startsWith('■'))section=line;return line.replace(/▶︎ $/,'▶︎ '+(section==='■クエスト成功率'?'0/0':'0回'));}).join('\n');
  bytes(config.template(ctx(clone(S))).split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0],filled);
  assert.equal(block(config.template(ctx(clone(S)))),null);
});

test('チェックOFF なら イベントがあっても 0078fc9 の出力とバイト一致',()=>{
  const {config:off}=load({tplAtLog:false});
  const S=clone(off.defaults);
  off.actions.bzQuest(ctx(S),{d:'bzT1',q:'t3',r:'miss'});
  off.actions.atEvent(ctx(S),{t:'eye',c:'bahari'});
  assert.ok(S.atLog.sessions[0].events.length>0);
  bytes(off.template(ctx(clone(S))),baseline.template(ctx(clone(S))));
  assert.equal(block(off.template(ctx(clone(S)))),null);
  // 明示ON・既定（キーなし）はどちらも出す
  for(const prefs of [{tplAtLog:true},undefined]){
    const {config}=load(prefs);
    const T=clone(config.defaults);
    config.actions.bzQuest(ctx(T),{d:'bzT1',q:'t3',r:'miss'});
    assert.equal(block(config.template(ctx(clone(T)))),'AT間1\nBZ1 ③ﾗｲｾﾞｸｽ×');
  }
});

test('番号なし・シナリオH・s1/s2 の扱い、福引とBZ以外ATの表記',()=>{
  const {config}=load();
  const U=clone(config.defaults);
  config.actions.atStart(ctx(U),{known:'false'});
  for(const ds of [{t:'serif',c:'s1'},{t:'serif',c:'s2'}])config.actions.atEvent(ctx(U),ds);
  config.actions.bzQuest(ctx(U),{d:'bzT1',q:'t3',r:'miss'});
  config.actions.atEvent(ctx(U),{t:'serif',c:'s3'});
  config.actions.atEvent(ctx(U),{t:'serif',c:'s4'});
  config.actions.atEvent(ctx(U),{t:'otherAt'});
  bytes(block(config.template(ctx(clone(U)))),'AT間1\nBZ? ③ﾗｲｾﾞｸｽ× → ﾁｯﾁｪHI以上濃厚 → ﾁｯﾁｪSP濃厚 → BZ以外AT');
  const H=clone(config.defaults);
  config.actions.bzQuest(ctx(H),{d:'bzT1',q:'t1',r:'miss'});
  config.actions.atEvent(ctx(H),{t:'eye',c:'jay'});
  config.actions.atEvent(ctx(H),{t:'eye',c:'chiche'});
  config.actions.atEvent(ctx(H),{t:'eye',c:'jay'});
  bytes(block(config.template(ctx(clone(H)))),'AT間1 ﾁｯﾁｪ(G以上) ｼﾅﾘｵH濃厚\nBZ1 ①青ｽﾀｰﾄ×');
  // 全7テーブルの行名と○×
  const A=clone(config.defaults);
  config.actions.atStart(ctx(A),{known:'false'});
  for(const id of ['t1','t2','t3','t4','t5','t6'])config.actions.atEvent(ctx(A),{t:'fuku',r:'miss'})&&config.actions.bzQuest(ctx(A),{d:'bzT1',q:id,r:'miss'});
  config.actions.bzQuest(ctx(A),{d:'bzT1',q:'t7',r:'win'});
  const flow=block(config.template(ctx(clone(A)))).split('\n')[1];
  for(const name of ['①青ｽﾀｰﾄ','②黄ｽﾀｰﾄ','③ﾗｲｾﾞｸｽ','④ｾﾙﾚｷﾞｵｽ','⑤ｵﾛﾐﾄﾞﾛ亜種','⑥ﾃｵﾃｽｶﾄﾙ','⑦AT'])assert.ok(flow.includes(name),name);
  assert.ok(flow.endsWith('⑦AT○'));
  assert.equal((flow.match(/福引×/g)||[]).length,6);
});

test('イベントのないAT間は出さず、番号はイベントのあるAT間の順につく',()=>{
  const {config}=load();
  const S=clone(config.defaults);
  // 1つ目：イベントあり → 閉じる、2つ目：何もせず閉じない（出ない）
  config.actions.bzQuest(ctx(S),{d:'bzT1',q:'t2',r:'win'});
  assert.equal(S.atLog.sessions.length,2);
  bytes(block(config.template(ctx(clone(S)))),'AT間1\nBZ1 ②黄ｽﾀｰﾄ○');
  // 3つ目に進めてから記録 → AT間2 になる
  config.actions.atEvent(ctx(S),{t:'otherAt'});
  config.actions.atEvent(ctx(S),{t:'fuku',r:'win'});
  bytes(block(config.template(ctx(clone(S)))),'AT間1\nBZ1 ②黄ｽﾀｰﾄ○\nAT間2\nBZ以外AT\nAT間3\n福引○');
});

test('チェックの切り替えは別キーだけを書き、記録のキーには触らない',()=>{
  const {config,mem}=load();
  const S=clone(config.defaults);
  const before=clone(S);
  assert.ok(config.actions.tplAtLog(ctx(S),{}));
  assert.deepEqual(clone(S),before,'状態を変えてはいけない');
  assert.deepEqual(Object.keys(mem),['mhsunbreak-checker-v1-prefs']);
  assert.deepEqual(JSON.parse(mem['mhsunbreak-checker-v1-prefs']),{tplAtLog:false});
  assert.ok(config.actions.tplAtLog(ctx(S),{}));
  assert.deepEqual(JSON.parse(mem['mhsunbreak-checker-v1-prefs']),{tplAtLog:true});
  assert.ok(!Object.keys(mem).includes(config.storageKey));
  // 画面のチェックは状態に合わせて出る
  const page=s=>config.pages(ctx(s),()=> '')[2]();
  assert.match(page(S),/data-action="tplAtLog" role="switch" aria-checked="true"[^>]*>☑ 入れる/);
  config.actions.tplAtLog(ctx(S),{});
  assert.match(page(S),/aria-checked="false"[^>]*>☐ 入れない/);
});

test('保存データ・集計・カードは 0078fc9 と同じ',()=>{
  const {config}=load();
  assert.equal(JSON.stringify(config.defaults),JSON.stringify(baseline.defaults));
  // vm の箱が違うと prototype が違うので、比較は JSON で行う
  assert.equal(JSON.stringify(config.mergeKeys),JSON.stringify(baseline.mergeKeys));
  assert.equal(config.storageKey,baseline.storageKey);
  const raws=[null,{},{games:3,hits:[300]},
    {bzT1:{blue:2,raizex:1},questN1:{blue:1},questN:{blue:1},iconPending:['qBlue'],iconLog:[{icons:['rai'],group:'bzT1',quest:'raizex',result:'win'}]},
    {bzT1:{t1:2,t3:1},questN1:{t1:9},atLog:{sessions:[{start:{known:false},events:[{t:'bz',table:'t3',r:'miss'}],closed:false}]}}];
  for(const raw of raws){
    const a=baseline.normalizeState(Object.assign(clone(baseline.defaults),clone(raw)||{}),clone(raw));
    const b=config.normalizeState(Object.assign(clone(config.defaults),clone(raw)||{}),clone(raw));
    assert.equal(JSON.stringify(b),JSON.stringify(a),'normalizeState: '+JSON.stringify(raw));
  }
  const S=clone(config.defaults);
  S.hits=[300,520];S.cycle.c1=2;S.atEnd.jay=1;S.trophy.gold=1;
  config.actions.bzQuest(ctx(S),{d:'bzT1',q:'t3',r:'miss'});
  config.actions.atEvent(ctx(S),{t:'eye',c:'galeas'});
  const card=c=>JSON.stringify(Object.fromEntries(['blocks','chart','bottom','detail'].map(k=>[k,c.card[k](ctx(clone(S)))])));
  assert.equal(card(config),card(baseline));
});

console.log(`PASS mhsunbreak template AT log: ${checks} checks`);

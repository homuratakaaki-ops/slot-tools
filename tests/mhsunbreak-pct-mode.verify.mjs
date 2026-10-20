// モンハンサンブレイク シナリオ参考％の表示モード（auto／p1／candidates）。
// 指示書 docs/specs/mhsunbreak-pct-mode-v01.md §4。
// 既定（prefs なし）は auto で従来どおり。モードは prefs にだけ保存し、記録には書かない。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../checker-data/mhsunbreak.js',import.meta.url),'utf8');
const KEY='mhsunbreak-checker-v1',PREFS=KEY+'-prefs';
const clone=v=>JSON.parse(JSON.stringify(v));
// prefs を data に入れて読み込む（undefined なら prefs キー自体を置かない）
function load(prefs){
  const data=new Map();
  if(prefs!==undefined)data.set(PREFS,typeof prefs==='string'?prefs:JSON.stringify(prefs));
  const box={window:{},document:{getElementById:()=>null},setTimeout:()=>0,
    localStorage:{getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}};
  vm.runInNewContext(source,box);
  return {c:box.window.CheckerConfigs.mhsunbreak,data};
}
const ctx=S=>({S,mode:1,pct:(n,d)=>`${n}/${d}`,nanaCreditText:()=>''});
const bz=t=>({t:'bz',table:t,r:'miss'});
const one=(c,events,denied)=>{
  const S=clone(c.defaults);
  S.atLog={sessions:[{start:{known:true,prior:0},events:clone(events),closed:false}]};
  c.normalizeState(S);
  if(denied)S.trophy.bronze=1;   // 設定2以上濃厚（rank 2）＝設定1否定
  return S;
};
const now=S=>S.atLog.sessions[S.atLog.sessions.length-1];
const pctOf=(c,S)=>c.scenarioPct(S,now(S));
const levelOf=(c,S)=>c.nextBzPct(S,now(S),2);
const page=(c,S)=>c.pages(ctx(S),()=>'[CARD]')[2]();
const WARN='⚠ 設定1否定の記録があります。表示中の％は設定1の場合の参考値で、実際の設定の確率ではありません。';
const NOTE={
  auto:'％は設定1の選択率に基づく参考値。設定1否定が出ると表示しません',
  p1:'％は設定1の場合の参考値。設定1否定時も実際の設定の確率ではありません',
  candidates:'候補のみ：参考％は非表示。候補の絞り込み条件は同じです'
};
const SEQ=[bz('t3')];   // 候補9つのまま％が出る列（次は2回目）
let checks=0;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};

test('1. 既定（prefs なし）は auto：設定1否定ありなら scenarioPct・nextBzLevelPct が null',()=>{
  for(const prefs of [undefined,{},{includeFuku:false,tplAtLog:true}]){
    const {c}=load(prefs);
    const S=one(c,SEQ,false),D=one(c,SEQ,true);
    assert.ok(pctOf(c,S)&&pctOf(c,S).length===9,'否定なしで％が出ていない');
    assert.ok(levelOf(c,S),'否定なしでレベル別％が出ていない');
    assert.equal(pctOf(c,D),null,'auto で否定ありなのに％が出ている');
    assert.equal(levelOf(c,D),null,'auto で否定ありなのにレベル別％が出ている');
    assert.ok(!page(c,D).includes(WARN),'auto で警告文が出ている');
    assert.ok(page(c,D).includes('data-value="auto" aria-pressed="true"'),'既定で「自動」が選ばれていない');
    assert.equal(c.scenarioModel(D).note[2],NOTE.auto);
  }
});

test('2. p1：設定1否定ありでも値が返り、警告文が％の上に出る',()=>{
  const {c}=load({scenarioPctMode:'p1'});
  const S=one(c,SEQ,false),D=one(c,SEQ,true);
  assert.deepEqual(clone(pctOf(c,D)),clone(pctOf(c,S)),'否定ありの％が否定なしと違う');
  assert.deepEqual(clone(levelOf(c,D)),clone(levelOf(c,S)),'否定ありのレベル別％が否定なしと違う');
  assert.ok(pctOf(c,D),'p1 で％が null');
  const h=page(c,D);
  assert.ok(h.includes(WARN),'p1 で否定ありなのに警告文が無い');
  assert.ok(h.indexOf(WARN)<h.indexOf('<div class="at-sc'),'警告文が候補行（％）の上にない');
  assert.ok(h.includes('候補（％は設定1の場合）：A '),'候補行に％が出ていない');
  assert.ok(!page(c,S).includes(WARN),'否定なしでも警告文が出ている');
  assert.ok(h.includes('data-value="p1" aria-pressed="true"'));
  assert.ok(clone(c.scenarioModel(D)).rows[0].pct,'カードの行に％が入っていない');
  assert.equal(c.scenarioModel(D).note[2],NOTE.p1);
});

test('3. candidates：否定の有無にかかわらず null（候補の絞り込みは同じ）',()=>{
  const {c}=load({scenarioPctMode:'candidates'});
  const base=load().c;
  for(const denied of [false,true]){
    const S=one(c,SEQ,denied);
    assert.equal(pctOf(c,S),null);
    assert.equal(levelOf(c,S),null);
    assert.ok(!page(c,S).includes(WARN));
    const m=clone(c.scenarioModel(S));
    assert.equal('pct' in m.rows[0],false,'カードの行に％が入っている');
    assert.deepEqual(m.rows[0].candidates,clone(base.scenarioModel(one(base,SEQ,denied))).rows[0].candidates,'候補が auto と違う');
    assert.equal(m.note[2],NOTE.candidates);
  }
  // 候補行は「候補：」の見出しで名前だけ、次のBZはレベルの並び
  const h=page(c,one(c,SEQ,false));
  assert.ok(h.includes('候補：A・B・C・D・E・F・G・H・I'),'候補のみの候補行になっていない');
  assert.match(h,/<div class="at-next">次のBZ（2回目）：レベル /);
});

test('4. 不正値・未設定は auto 扱い',()=>{
  for(const prefs of [{scenarioPctMode:'P1'},{scenarioPctMode:'x'},{scenarioPctMode:1},{scenarioPctMode:null},{scenarioPctMode:true},'{broken',JSON.stringify('p1'),'null']){
    const {c}=load(prefs);
    assert.ok(pctOf(c,one(c,SEQ,false)),JSON.stringify(prefs)+': 否定なしで％が出ていない');
    assert.equal(pctOf(c,one(c,SEQ,true)),null,JSON.stringify(prefs)+': auto 扱いになっていない');
    assert.equal(c.scenarioModel(one(c,SEQ,true)).note[2],NOTE.auto);
  }
  // 画面から不正値が来ても、モードも prefs も変えない
  const {c,data}=load({scenarioPctMode:'p1'});
  assert.equal(c.actions.scenarioPctMode(ctx(one(c,SEQ,true)),{value:'bogus'}),false);
  assert.equal(JSON.parse(data.get(PREFS)).scenarioPctMode,'p1');
});

test('5. 記録（storageKey の JSON）がモード切替で1バイトも変わらない',()=>{
  const {c,data}=load({includeFuku:false,tplAtLog:false,foreign:'retain'});
  const S=one(c,[bz('t3'),bz('t2')],true);
  const saved=JSON.stringify(S);
  data.set(KEY,saved);
  const order=['p1','candidates','auto','candidates','p1','p1','auto'];
  for(const value of order){
    // false を返す＝engine は取消の履歴にも保存にも触れない
    assert.equal(c.actions.scenarioPctMode(ctx(S),{value}),false,value+': false を返していない');
    assert.equal(JSON.stringify(S),saved,value+': 状態 S が変わった');
    assert.deepEqual(Buffer.from(data.get(KEY)),Buffer.from(saved),value+': 記録のキーが変わった');
    const p=JSON.parse(data.get(PREFS));
    assert.equal(p.scenarioPctMode,value);
    assert.equal(p.foreign,'retain','prefs の他のキーが消えた');
    assert.equal(p.tplAtLog,false);
    assert.equal(p.includeFuku,false);
  }
  assert.deepEqual([...data.keys()].sort(),[KEY,PREFS].sort(),'記録・prefs 以外のキーに書いた');
  // 保存したモードは読み直しても残る
  const again=load(data.get(PREFS)).c;
  assert.equal(again.scenarioPct(S,now(S)),null,'auto に戻したのに否定ありで％が出ている');
});

console.log('PASS mhsunbreak シナリオ参考％の表示モード: '+checks+' checks');

// かのかり 設定推測タブ（docs/specs/kanokari-estimate-v01.md）の検証。
// 振り分け表はネネ資料（kanokari-research-20261014.html）から独立に転記したもの。
// コード側の表（ちょんぼりすた様のページから転記）と1セルずつ突き合わせ、
// 推測の割合もこのファイル内の独立実装で計算して一致を見る。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

const root=new URL('..',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
// 比較の基準は本件の直前の main（23109d6）。マージ後に main が新版になっても意味が変わらないよう固定する。
const gitShow=p=>execFileSync('git',['show','23109d6:'+p],{cwd:root,encoding:'utf8'});
const clone=x=>JSON.parse(JSON.stringify(x));
function load(dataSrc){
  const box={window:{}};vm.createContext(box);
  vm.runInContext(read('checker-bayes.js'),box);
  vm.runInContext(dataSrc,box);
  return {c:box.window.CheckerConfigs.kanokari,win:box.window};
}
const {c,win}=load(read('checker-data/kanokari.js'));
const {c:old}=load(gitShow('checker-data/kanokari.js'));
const fresh=()=>c.normalizeState(clone(c.defaults));
let checks=0;const ok=()=>checks++;

// ---- 1. 独立転記の表（ネネ資料） ----
const END={1:[82.5,15,2.5,0,0,0,0],2:[80.9,15,2.5,1.6,0,0,0],3:[75.9,17.5,5,1.6,0,0,0],
  4:[75.2,17.5,5,1.6,0.8,0,0],5:[66.9,20,10,1.6,0.8,0.8,0],6:[66.1,20,10,1.6,0.8,0.8,0.8]};
const REG={1:[43.8,15.6,12.5,12.5,3.1,0,0,3.1,3.1,3.1,3.1,0,0,0,0],
  2:[41.4,12.5,15.6,13.3,3.1,0,6.3,0,1.6,1.6,1.6,3.1,0,0,0],
  3:[35.9,15.6,12.5,14.1,6.3,0,1.6,6.3,0,1.6,1.6,3.1,1.6,0,0],
  4:[34.8,12.5,15.6,14.8,6.3,0,1.6,1.6,6.3,0,1.6,3.1,1.6,0.4,0],
  5:[27.7,15.6,12.5,15.6,12.5,0,1.6,1.6,1.6,6.3,0,3.1,1.6,0.2,0.2],
  6:[25,12.5,15.6,16.4,12.5,0.4,1.6,1.6,1.6,1.6,6.3,3.1,1.6,0.2,0.2]};
const SCEN={1:[22.5,27.5,22.5,27.5],2:[27.5,22.5,27.5,22.5],3:[22.5,27.5,22.5,27.5],
  4:[27.5,22.5,27.5,22.5],5:[22.5,27.5,22.5,27.5],6:[27.5,22.5,27.5,22.5]};
// EDは「通常・各1種／弱／中／強／2以上／4以上／5以上／6」。通常は4キャラそれぞれの値。
const ED8={1:[16.4,25,6.3,3.1,0,0,0,0],2:[12.6,25.4,7,4.7,12.5,0,0,0],3:[11.2,26.2,8.6,7.8,12.5,0,0,0],
  4:[9.1,27,10.2,10.9,12.5,3.1,0,0],5:[7.3,27.7,11.7,14.1,12.5,3.1,1.6,0],6:[5.6,28.5,13.3,17.2,12.5,3.1,1.6,1.6]};
const ED={};for(const s in ED8)ED[s]=[ED8[s][0],ED8[s][0],ED8[s][0],ED8[s][0],...ED8[s].slice(1)];
const KEYS={
  screens:['none','bbq','beach','red','purple','silver','gold'],
  chara:Array.from({length:15},(_,i)=>'p'+String(i+1).padStart(2,'0')),
  scen:['s1','s2','s3','s4'],
  voice:Array.from({length:11},(_,i)=>'v'+String(i+1).padStart(2,'0'))
};
const R=c.bayes.rates;
for(const s of [1,2,3,4,5,6]){
  assert.deepEqual(clone(R.END_RATE[s]),END[s],'終了画面 設定'+s);
  assert.deepEqual(clone(R.REG_RATE[s]),REG[s],'キャラ紹介 設定'+s);
  assert.deepEqual(clone(R.SCEN_RATE[s]),SCEN[s],'攻略初回 設定'+s);
  assert.deepEqual(clone(R.ED_STRONG_RATE[s]),ED[s],'EDボイス 設定'+s);
}
ok();
// 行合計（出典の丸め）と、割り戻し後の合計1・0セルの維持
const sum=a=>Math.round(a.reduce((x,y)=>x+y,0)*10)/10;
assert.deepEqual([1,2,3,4,5,6].map(s=>sum(END[s])),[100,100,100,100.1,100.1,100.1]);
assert.deepEqual([1,2,3,4,5,6].map(s=>sum(REG[s])),[99.9,100.1,100.2,100.2,100.1,100.2]);
assert.deepEqual([1,2,3,4,5,6].map(s=>sum(SCEN[s])),[100,100,100,100,100,100]);
assert.deepEqual([1,2,3,4,5,6].map(s=>sum(ED[s])),[100,100,99.9,100.1,99.9,100.2]);
const P=c.bayes.probs;
for(const [k,t,keys] of [['screens',END,KEYS.screens],['chara',REG,KEYS.chara],['scen',SCEN,KEYS.scen],['edStrong',ED,KEYS.voice]]){
  for(const s of [1,2,3,4,5,6]){
    const row=P[k][s];
    assert.ok(Math.abs(keys.reduce((a,key)=>a+row[key],0)-1)<1e-12,k+' 設定'+s+' 合計1');
    keys.forEach((key,i)=>{
      if(t[s][i]===0)assert.equal(row[key],0,k+' '+key+' 設定'+s+' は0のまま');
      else assert.ok(Math.abs(row[key]-t[s][i]/t[s].reduce((a,b)=>a+b,0))<1e-15);
    });
  }
}
ok();

// ---- 2. 独立実装の推測と一致（ランダム3000状態） ----
const EXCL={screens:{red:[1],purple:[1,2,3],silver:[1,2,3,4],gold:[1,2,3,4,5]},
  chara:{p06:[1,2,3,4,5],p07:[1],p08:[2],p09:[3],p10:[4],p11:[5],p12:[1],p13:[1,2],p14:[1,2,3],p15:[1,2,3,4]},
  cm:{cm44:[1,2,3],cm55:[1,2,3,4],cm66:[1,2,3,4,5]},
  over:{o246:[1,3,5],o456:[1,2,3],o666:[1,2,3,4,5],o394:[1,2,3,4,5]},
  scen:{repeat:[1,2,3,4]},
  voice:{v08:[1],v09:[1,2,3],v10:[1,2,3,4],v11:[1,2,3,4,5]}};
function expected(S){
  const logs={},gone=new Set();let ev=0;
  for(const g in EXCL)for(const k in EXCL[g]){const n=S[g][k]||0;if(n>0){ev+=n;EXCL[g][k].forEach(x=>gone.add(x));}}
  const use=[['chara',REG,KEYS.chara,S.chara],['scen',SCEN,KEYS.scen,S.scen],['ed',ED,KEYS.voice,S.edStrong]];
  if(S.endCustom==='none')use.push(['screens',END,KEYS.screens,S.screens]);
  for(const s of [1,2,3,4,5,6]){
    logs[s]=gone.has(s)?-Infinity:0;
    for(const [,t,keys,cnt] of use){
      const tot=t[s].reduce((a,b)=>a+b,0);
      keys.forEach((k,i)=>{const n=cnt[k]||0;if(!n)return;logs[s]+=t[s][i]===0?-Infinity:n*Math.log(t[s][i]/tot);});
    }
  }
  for(const [,,keys,cnt] of use)ev+=keys.reduce((a,k)=>a+(cnt[k]||0),0);
  if(ev===0)return {empty:true};
  const fin=Object.values(logs).filter(Number.isFinite);
  if(!fin.length)return {contradiction:true};
  const m=Math.max(...fin),w={};let z=0;
  for(const s in logs){w[s]=Number.isFinite(logs[s])?Math.exp(logs[s]-m):0;z+=w[s];}
  for(const s in w)w[s]/=z;
  return {posterior:w,high:w[4]+w[5]+w[6],low:w[1]+w[2]};
}
let seed=20261014;const rnd=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
const pick=n=>Math.floor(rnd()*n);
let cases=0;
for(let i=0;i<3000;i++){
  const S=fresh();
  S.endCustom=['none','custom','unknown'][pick(3)];
  for(const g of ['screens','chara','scen','cm','over','voice']){
    for(const k of Object.keys(S[g])){if(k==='other')continue;if(rnd()<(g==='cm'||g==='over'||k==='repeat'?0.08:0.3))S[g][k]=1+pick(4);}
  }
  for(const k of KEYS.voice)S.edStrong[k]=rnd()<0.3?Math.min(S.voice[k],pick(3)):0;
  const exp=expected(S),got=c.bayes.result(S);
  if(exp.empty){assert.ok(got.empty);}
  else if(exp.contradiction){assert.ok(got.contradiction);}
  else{
    for(const s of [1,2,3,4,5,6])assert.ok(Math.abs(got.posterior[s]-exp.posterior[s])<1e-9,'状態'+i+' 設定'+s);
    assert.ok(Math.abs(got.high-exp.high)<1e-9&&Math.abs(got.low-exp.low)<1e-9);
  }
  cases++;
}
ok();

// ---- 3. 除外規則 ----
{
  const S=fresh();S.over.o246=1;S.chara.p10=1;
  const r=c.bayes.result(S);
  assert.deepEqual([1,2,3,4,5,6].filter(s=>r.posterior[s]>0),[2,6],'246枚＋⑩肺魚4人目 → 候補2・6');
  // 出なかったことでは減点しない：除外だけの状態は残る候補が均等
  const S2=fresh();S2.cm.cm55=1;
  const r2=c.bayes.result(S2);
  [0,0,0,0,.5,.5].forEach((v,i)=>assert.ok(Math.abs(r2.posterior[i+1]-v)<1e-12));
  // 終了画面の濃厚はカスタム不明でも除外に使う（割合には入れない）
  const S3=fresh();S3.screens.gold=1;
  assert.ok(Math.abs(c.bayes.result(S3).posterior[6]-1)<1e-12);
  // 規則の網羅：指示書の除外表とコードの除外が一致
  const spec=c.bayes.spec(fresh());
  const fromCode={};spec.exclusions.forEach(x=>{fromCode[x.label]=clone(x.exclude);});
  assert.equal(spec.exclusions.length,Object.values(EXCL).reduce((a,g)=>a+Object.keys(g).length,0));
  for(const g in EXCL)for(const k in EXCL[g]){
    const S4=fresh();S4[g][k]=1;
    const hit=c.bayes.spec(S4).exclusions.filter(x=>x.count>0);
    assert.equal(hit.length,1,g+'.'+k);assert.deepEqual(clone(hit[0].exclude),EXCL[g][k],g+'.'+k);
  }
  // 現行の表と規則では設定6が外れることは無い（候補ゼロは実入力では起きない）
  assert.ok(Object.values(EXCL).every(g=>Object.values(g).every(list=>!list.includes(6))));
  assert.ok([END,REG,SCEN,ED].every(t=>t[6].every(v=>v>0)));
}
ok();

// ---- 4. 画面：矛盾・材料なし・採用／不採用 ----
const ctxOf=(S,mode=1)=>({S,mode,get:p=>p.split('.').reduce((o,k)=>o[k],S),pct:(a,b)=>b>0?`${a}/${b}`:`${a}/0 —`,
  crow:(p,name)=>`<div class="crow" data-c="${p}" data-l="${name}"></div>`});
const page=(S,i)=>c.pages(ctxOf(S),()=>'')[i]();
{
  assert.equal(c.pages(ctxOf(fresh()),()=>'').length,4,'初当り／示唆／設定推測／カード');
  const empty=page(fresh(),2);
  assert.match(empty,/判別材料なし/);
  assert.match(empty,/入力データからの参考割合（設定1〜6を同じ事前条件で比較）。店の設定配分ではありません/);
  // 矛盾表示：実入力では起きないため、推定結果を差し替えて画面の分岐を確認する
  const real=win.CheckerBayes.estimate;
  win.CheckerBayes={...win.CheckerBayes,estimate:()=>({contradiction:true,reasons:[]})};
  assert.match(page(fresh(),2),/入力条件を確認してください/);
  win.CheckerBayes={...win.CheckerBayes,estimate:real};

  const S=fresh();S.screens.none=5;S.screens.red=1;S.chara.p01=2;
  assert.equal(S.endCustom,'unknown');
  let spec=c.bayes.spec(S);
  assert.ok(!spec.multinomial.some(m=>/終了画面/.test(m.label)),'カスタム不明では終了画面を割合に使わない');
  let html=page(S,2);
  assert.match(html,/終了画面：カスタム不明のため不採用（記録6回）/);
  assert.match(html,/終了画面 赤枠×1（設定1を除外）/);
  assert.match(html,/RB中のキャラ紹介 2回/);
  S.endCustom='custom';
  assert.match(page(S,2),/終了画面：カスタムありのため不採用（記録6回）/);
  S.endCustom='none';
  spec=c.bayes.spec(S);
  assert.ok(spec.multinomial.some(m=>m.label==='終了画面（カスタムなし）'&&m.counts.none===5&&m.counts.red===1));
  html=page(S,2);
  assert.doesNotMatch(html,/不採用/);
  assert.match(html,/終了画面（カスタムなし） 6回/);
  assert.match(html,/項目別の内訳を見る/);
  const exp=expected(S),got=c.bayes.result(S);
  for(const s of [1,2,3,4,5,6])assert.ok(Math.abs(got.posterior[s]-exp.posterior[s])<1e-12);
  // EDボイス：役不明の回数は割合に入れず、濃厚の除外には使う
  const E=fresh();E.voice.v01=3;E.voice.v09=1;E.edStrong.v01=1;
  const eSpec=c.bayes.spec(E);
  assert.deepEqual(clone(eSpec.multinomial.find(m=>/EDボイス/.test(m.label)).counts),{...Object.fromEntries(KEYS.voice.map(k=>[k,0])),v01:1});
  assert.match(page(E,2),/成立役が強チャンス目以外・不明の3回は割合に不採用/);
  assert.deepEqual([1,2,3,4,5,6].filter(s=>c.bayes.result(E).posterior[s]>0),[4,5,6]);
}
ok();

// ---- 5. 示唆タブの切替とEDボイスの両キー加算 ----
{
  const S=fresh();
  let html=page(S,1);
  assert.match(html,/data-action="kkEndCustom" data-v="none"[^>]*aria-pressed="false">なし/);
  assert.match(html,/data-action="kkEndCustom" data-v="unknown"[^>]*aria-pressed="true">不明/);
  assert.match(html,/終了画面の振り分けは店のカスタム設定で変わります。カスタムなしを確認できたときだけ推測に使います/);
  assert.match(html,/data-action="kkEdRole" data-v="other"[^>]*aria-pressed="true">それ以外・不明/);
  assert.match(html,/設定別の振り分けが公開されているのは強チャンス目で当選したときだけです/);
  // 終了画面のボタンはカスタムの値に関係なく従来どおり（data-c の単独加算）
  for(const v of ['none','custom','unknown']){S.endCustom=v;assert.equal((page(S,1).match(/data-c="screens\./g)||[]).length,7);}
  // 成立役：それ以外・不明 → 従来の単独加算。強チャンス目 → 両キー
  assert.equal((html.match(/data-c="voice\./g)||[]).length,11);
  assert.doesNotMatch(html,/edStrong/);
  S.edRole='strong';html=page(S,1);
  assert.equal((html.match(/data-c="voice\./g)||[]).length,0);
  for(const k of KEYS.voice)assert.ok(html.includes(`data-bump-many="voice.${k},edStrong.${k}"`),k);
  assert.doesNotMatch(html,/class="plus"/,'engineの単独加算（.plus）を繋がせない');
  // 切替アクション：同じ値は何もしない／別の値で書き換え
  const T=fresh();
  assert.equal(c.actions.kkEndCustom({S:T},{v:'unknown'}),false);
  assert.equal(c.actions.kkEndCustom({S:T},{v:'none'}),'店のカスタム：なし');assert.equal(T.endCustom,'none');
  assert.equal(c.actions.kkEndCustom({S:T},{v:'bogus'}),false);assert.equal(T.endCustom,'none');
  assert.equal(c.actions.kkEdRole({S:T},{v:'strong'}),'成立役：強チャンス目');assert.equal(T.edRole,'strong');
  // 旧文言（未公表のため推測しない）が残っていない
  assert.doesNotMatch(read('checker-data/kanokari.js'),/示唆から設定を数値で推測することはしません|数値推測には使わない/);
}
ok();

// ---- 6. 旧データ・保存の互換、テンプレ・カード不変 ----
{
  const legacy={games:1234,counts:{cz:7,first:4},screens:{none:5,bbq:2,red:1},chara:{p1:2,p7:1,p01:3,other:1},
    scen:{s1:2,repeat:1},cm:{cm44:1},over:{o246:1},voice:{v01:2,v09:1},img:null,iconChoice:'default'};
  const a=old.normalizeState(clone(legacy)),b=c.normalizeState(clone(legacy));
  assert.equal(b.endCustom,'unknown');assert.equal(b.edRole,'other');
  assert.deepEqual(clone(b.edStrong),Object.fromEntries(KEYS.voice.map(k=>[k,0])));
  const strip=x=>{const y=clone(x);delete y.endCustom;delete y.edRole;delete y.edStrong;return y;};
  assert.equal(JSON.stringify(strip(b)),JSON.stringify(a),'追加キー以外は旧版と同じ保存内容');
  // 保存済みの新キーは読み戻せる・不正値は既定へ
  const c2=c.normalizeState({...clone(legacy),endCustom:'none',edRole:'strong',edStrong:{v01:'2',v05:-3}});
  assert.equal(c2.endCustom,'none');assert.equal(c2.edRole,'strong');assert.equal(c2.edStrong.v01,2);assert.equal(c2.edStrong.v05,0);
  const c3=c.normalizeState({...clone(legacy),endCustom:'x',edRole:7});
  assert.equal(c3.endCustom,'unknown');assert.equal(c3.edRole,'other');
  // 旧データで推測が動く（終了画面は不明なので除外だけ、キャラ紹介は割合に入る）
  const r=c.bayes.result(b);
  assert.ok(r.posterior&&!r.contradiction);
  assert.deepEqual([1,2,3,4,5,6].filter(s=>r.posterior[s]>0),[6],'赤枠・⑦・⑭(旧⑦)・同一連続・44cm・246枚・瑠夏4以上');
  // テンプレ・カード・詳細カードは旧版と同じ出力（追加キーがあっても変わらない）
  const states=[legacy,{...clone(legacy),endCustom:'none',edRole:'strong',edStrong:{v01:2,v09:1}},{}];
  for(const st of states){
    const sa=old.normalizeState(clone(st)),sb=c.normalizeState(clone(st));
    const ca={S:sa},cb={S:sb};
    assert.equal(c.template(cb),old.template(ca));
    assert.equal(c.compactTemplate(cb),old.compactTemplate(ca));
    assert.deepEqual(clone(c.card.blocks(cb)),clone(old.card.blocks(ca)));
    assert.deepEqual(clone(c.card.chart(cb)),clone(old.card.chart(ca)));
    assert.deepEqual(clone(c.card.bottom(cb)),clone(old.card.bottom(ca)));
    assert.deepEqual(clone(c.card.detail(cb)),clone(old.card.detail(ca)));
  }
  assert.equal(c.storageKey,'kanokari-checker-v1');
  assert.deepEqual(clone(c.mergeKeys),[...old.mergeKeys,'edStrong']);
  // 共通ファイルは不変
  for(const f of ['checker-engine.js','checker-bayes.js'])assert.equal(read(f),gitShow(f),f+' 不変');
  // ?v=（§9-107）と checker-bayes の読み込み
  const html=read('kanokari-checker.html');
  assert.match(html,/<script src="checker-bayes\.js\?v=20260827-2"><\/script>\s*<script src="checker-data\/kanokari\.js\?v=20261014"><\/script>/);
  assert.match(html,/grid-template-columns:repeat\(4,1fr\)/);
  assert.match(html,/<button data-p="2">設定推測<\/button><button data-p="3">カード<\/button>/);
}
ok();

console.log(`PASS kanokari 設定推測: ${checks} checks（ランダム${cases}状態の独立計算一致を含む）`);

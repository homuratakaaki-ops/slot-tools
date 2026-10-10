import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../checker-data/mhsunbreak.js',import.meta.url),'utf8');
let config,checks=0;
const clone=v=>JSON.parse(JSON.stringify(v));
const fresh=()=>{const box={window:{}};vm.runInNewContext(source,box);config=box.window.CheckerConfigs.mhsunbreak;return config.normalizeState({});};
const ctx=(S,mode=1)=>({S,mode,pct:(n,d)=>n+'/'+d,crow:()=>''});
const page=(S,mode=1)=>config.pages(ctx(S,mode),()=>'')[2]();
const act=(S,name,ds={},mode=1)=>config.actions[name](ctx(S,mode),ds);
const quest=(S,q='t1',d='bzT1',r='miss')=>act(S,'bzQuest',{q,d,n:d==='bzT1'?'questN1':'questN2',r});
const count=(html,text)=>html.split(text).length-1;
const test=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
test('1. 新しい順番で1→位置3→失敗が1件になる',()=>{
 const S=fresh(),before=JSON.stringify(S);assert.equal(act(S,'bzPick',{q:'t1'}),false);assert.equal(JSON.stringify(S),before);assert.equal(act(S,'bzPickPos',{pos:'3'}),false);assert.equal(JSON.stringify(S),before);assert.equal(typeof quest(S),'string');
 const events=S.atLog.sessions[0].events;assert.deepEqual(clone(events),[{t:'bz',table:'t1',r:'miss',pos:3}]);assert.equal(JSON.stringify(events[0]),'{"t":"bz","table":"t1","r":"miss","pos":3}');
 assert.equal(S.bzT1.t1,1);assert.equal(S.questN1.t1,0);assert.equal(S.atLog.sessions.length,1);
 const first=JSON.stringify(config.normalizeState(clone(S)));assert.equal(JSON.stringify(config.normalizeState(JSON.parse(first))),first);
 const html=page(S);assert.ok(html.includes('記録しました：BZ1回目 ① 青スタート 失敗'));assert.ok(!html.includes('class="t-btn on"'));
 // 記録直後の詳細は選択済みを表示する。次の入力入口だけは未選択。
 assert.ok(!html.slice(html.indexOf('<div class="rec-h">')).includes('選択済み：'));
});
test('2. 未記録で進むではposを付けない',()=>{const S=fresh();act(S,'bzPick',{q:'t1'});act(S,'bzPickPos',{pos:''});assert.ok(page(S).includes('選択済み：未記録'));assert.ok(page(S).includes('data-action="bzPickPosOpen"'));quest(S);assert.deepEqual(clone(S.atLog.sessions[0].events),[{t:'bz',table:'t1',r:'miss'}]);});
test('3. 結果アイコンを選んだら一覧が閉じる',()=>{const S=fresh();act(S,'bzPick',{q:'t1'});assert.equal(count(page(S),'data-action="bzPickPos"'),11);act(S,'bzPickPos',{pos:'3'});let h=page(S);assert.equal(count(h,'data-action="bzPickPos"'),0);assert.ok(h.includes('選択済み：3個目・黄'));assert.equal(count(h,'data-action="bzPickPosOpen"'),1);act(S,'bzPickPosOpen');h=page(S);assert.equal(count(h,'data-action="bzPickPos"'),11);assert.equal(count(h,'data-pos="3" aria-pressed="true"'),1);});
test('4. テーブル再選択で前の位置と詳細を消す',()=>{const S=fresh();act(S,'bzPick',{q:'t1'});act(S,'bzPickPos',{pos:'3'});quest(S);assert.ok(page(S).includes('<div class="bz-sub">結果アイコン</div>'));act(S,'bzPick',{q:'t2'});const h=page(S);assert.ok(!h.includes('<div class="bz-sub">結果アイコン</div>'));const picker=h.match(/<div class="pos-pick">([\s\S]*?)<\/div>/)[1];assert.ok(!picker.includes('QUEST青'));assert.ok(!h.includes('data-pos="3" aria-pressed="true"'));});
test('5. テーブル⑦は位置1を自動記録',()=>{const S=fresh();act(S,'bzPick',{q:'t7'});const h=page(S);assert.ok(h.includes('位置1 AT を自動で記録します'));assert.equal(count(h,'data-action="bzPickPos"'),0);assert.equal(count(h,'data-action="bzQuest"'),1);quest(S,'t7','bzT1','win');assert.equal(S.atLog.sessions[0].events[0].pos,1);});
test('6. シナリオ候補の4通りとカード計算',()=>{
 for(const [tables,text,expected] of [[['t3'],'候補：A・B・C・D・E・F・G・H・I',['A','B','C','D','E','F','G','H','I']],[['t5'],'シナリオG濃厚',['G']],[['t1','t2'],'シナリオH濃厚：3回目のBZでAT濃厚',['H']],[['t1','t5'],'該当なし：開始の選び方・記録を確認してください',[]]]){const S=fresh();tables.forEach((q,i)=>quest(S,q,i?'bzT2':'bzT1'));assert.ok(page(S).includes(text));assert.deepEqual(clone(config.scenarioModel(S).rows[0].candidates),expected);}
 const S=fresh();act(S,'atStart',{known:'false'});quest(S);const h=page(S);assert.ok(h.includes('BZ番号が不明のため絞り込めません'));const line=h.match(/<div class="at-sc unknown">(.*?)<\/div>/)[1];assert.ok(!/候補：|該当なし|濃厚/.test(line));assert.ok(!h.includes('class="at-sc cand"'));assert.ok(!h.includes('class="at-sc none"'));assert.ok(!h.includes('class="at-sc"'));
});
test('7. 現在状況と5入口・折りたたみ・section数',()=>{const S=fresh();quest(S,'t7','bzT1','win');const h=page(S);for(const text of ['>現在の状況<','>ここから記録<'])assert.equal(count(h,text),1);for(const text of ['BZ（ブレイクゾーン）','アイキャッチ（ステージチェンジ）','チッチェのセリフ','アイルー福引','BZ終了時PUSH ランプ'])assert.equal(count(h,'class="entry-h">'+text+'<'),1);assert.equal(count(h,'data-k="extras"'),0);for(const key of ['totals','past','prefs'])assert.equal(count(h,'data-k="'+key+'"'),1);assert.equal(count(h,'<section class="sec">'),2);});
test('8. 減算では画面選択不可・訂正26ボタン',()=>{const S=fresh();const h=page(S,-1);assert.equal((h.match(/class="t-btn[^>]*disabled/g)||[]).length,7);assert.equal(count(h,'data-action="bzPickPos"'),0);assert.equal(count(h,'data-action="bzQuest"'),26);for(const [name,ds] of [['bzPick',{q:'t1'}],['bzPickPos',{pos:'3'}],['bzPickPosOpen',{}],['bzPosOpen',{}]])assert.equal(act(S,name,ds,-1),false);});
test('9. 最新の記録',()=>{const S=fresh();assert.ok(page(S).includes('最新：まだありません'));quest(S);quest(S,'t2','bzT2');assert.ok(page(S).includes('最新：BZ2回目 ② 黄スタート 失敗'));});
console.log('PASS '+checks+' tests');

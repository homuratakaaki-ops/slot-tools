// 指示書 2026-11-01 の独立期待値。node tests/ragnador-voice.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),clone=x=>JSON.parse(JSON.stringify(x));
const EXPECTED={
  edVoice:[
    ['default','イヅナ「よしっ！」','デフォルト',0],
    ['even','イヅナ「協力いたします！」','偶数設定期待度UP',0],
    ['highWeak','イヅナ「お任せ」','高設定期待度UP(弱)・「ここは私にお任せください！」',0],
    ['highStrong','のっぺらぼう','高設定期待度UP(強)・「見えそうで…見えない、でしょ？フフッ、ずっと気にしてて」',0],
    ['ten','貂','設定2以上濃厚・「イヅナちゃんと同じくらい、あなたイイ線いってますよ♡」',2],
    ['izunaSp','イヅナ「特別な日」','設定4以上濃厚・「特別な日なので、日頃の感謝を改めて伝えたかったのです」',4],
    ['keukegen','けうけげん','設定5以上濃厚・「終わったらみんなでパーチーですぞぉ～♪」',5],
    ['nurikabe','ぬりかべ','設定6濃厚・「一緒に歩んできた時間が、私の宝物です」',6]
  ],
  atVoice:[
    ['base','デフォルト・相手示唆','高設定示唆なし（「油断せずにいきましょう！」・白虎・玄武・朱雀のボイス）',0],
    ['mairimasu','まいります！','高設定期待度UP',0],
    ['byakko','勝負はここから','次回白虎以上＋高設定期待度UP・「勝負はここからです！」',0],
    ['genbu','本気でいかせて','次回玄武以上＋高設定期待度UP・「本気でいかせていただきます！」',0],
    ['suzaku','まだこんな力が','次回朱雀濃厚＋高設定期待度UP・「私にまだこんな力が眠っていたなんて…！」',0],
    ['suzaku2','あなたの刃に','次回・次々回朱雀＋高設定期待度UP・「私があなたの刃となりましょう！」',0]
  ],
  czVoice:[
    ['default','イヅナ','デフォルト・「油断せずにいきましょう！」',0],
    ['byakko','白虎','次回白虎以上・「拳で語り合おうじゃあねぇか！」',0],
    ['genbu','玄武','次回玄武以上・「邪魔するやつ、嫌い」',0],
    ['suzaku','朱雀','次回朱雀濃厚・「焼き尽くして差し上げますわ」',0]
  ]
};
const TITLES=['エンディング中ボイス','AT終了時ボイス','CZ終了時ボイス'];
const HINTS=['エンディング中にレア役が成立したとき、サブ液晶をタッチすると発生します。','AT終了時にサブ液晶をタッチすると発生します。高設定期待度UPのボイスはAT終了時のみ発生します。','CZ終了時にサブ液晶をタッチすると発生します。次回CZの対戦相手の示唆で、設定示唆ではありません。'];
const box={window:{}};vm.createContext(box);vm.runInContext(read('checker-data/ragnador.js'),box);
const c=box.window.CheckerConfigs.ragnador,fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=S=>({S,pct:(v,d)=>d>0?`${v}/${d} ${(100*v/d).toFixed(0)}%`:`${v}/0 —`,crow:(key,label,sub,hot,pct)=>{
  const [g,k]=key.split('.');return JSON.stringify([key,label,sub,hot,pct?pct(S[g][k]):null]);
}});
let checks=0,failures=0;
function check(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
for(const [group,rows] of Object.entries(EXPECTED))for(const [key,label,sub,rank] of rows)check(group+'.'+key+' 原文・hot・確定演出・テンプレ',()=>{
  const S=fresh();S[group][key]=2;const cx=ctx(S),html=c.pages(cx,()=>'')[1]();
  assert.ok(html.includes(JSON.stringify([group+'.'+key,label,sub,rank>0,'2/2 100%'])));
  assert.equal(c.card.blocks(cx)[2][1],rank>0?'計2回':'計0回');
  assert.equal(c.card.bottom(cx).columns[0].items[0].text,rank>0?`確定演出 ${label}(${rank===6?'6濃厚':rank+'以上'}) ×2`:'確定演出 なし');
  assert.ok(c.template(cx).includes(label+'▶2回 (100%)'));
  assert.equal(c.template(cx).split('▶').length-1,1);
  const item=c.card.detail(cx).flatMap(s=>s.items).find(i=>i.label===label&&i.value===2);assert.ok(item);assert.equal(item.hot,rank>0);
});
check('18行・3セクション・説明1つずつ・グループ内％・最上位',()=>{
  const S=fresh();for(const [g,rows] of Object.entries(EXPECTED))rows.forEach((r,i)=>{S[g][r[0]]=i+1;});
  const cx=ctx(S),html=c.pages(cx,()=>'')[1]();assert.equal((html.match(/<section /g)||[]).length,3);assert.equal((html.match(/class="hint"/g)||[]).length,3);
  HINTS.forEach(t=>assert.ok(html.includes('<div class="hint">'+t+'</div>')));assert.ok(html.includes('その他示唆'));
  for(const [g,rows] of Object.entries(EXPECTED)){
    const total=rows.length*(rows.length+1)/2;assert.ok(html.includes('計'+total+'回'));
    rows.forEach(([key,label,sub,rank],i)=>assert.ok(html.includes(JSON.stringify([g+'.'+key,label,sub,rank>0,`${i+1}/${total} ${(100*(i+1)/total).toFixed(0)}%`]))));
  }
  assert.equal(c.card.blocks(cx)[2][1],'計26回');assert.equal(c.card.bottom(cx).columns[0].items[0].text,'確定演出 ぬりかべ(6濃厚) ×8');
  const tpl=c.template(cx);assert.ok(tpl.includes('累計通常G 0G（0件） / 確定演出26回'));
  Object.entries(EXPECTED).forEach(([g,rows],i)=>{assert.ok(tpl.includes('■'+TITLES[i]));const total=rows.length*(rows.length+1)/2;rows.forEach(([key,label],j)=>assert.ok(tpl.includes(label+'▶'+(j+1)+'回 ('+(100*(j+1)/total).toFixed(0)+'%)')));});
  assert.equal(c.compactTemplate(cx),tpl);assert.ok(!c.template(ctx(fresh())).includes('■'));
});
check('詳細カード短縮名・母数・全項目25行（11/6 確定CZ）・既存カード維持',()=>{
  const S=fresh();for(const g of c.mergeKeys)for(const k of Object.keys(S[g]))S[g][k]=1;S.gameLog=[1000];const cx=ctx(S),d=c.card.detail(cx);
  assert.deepEqual(clone(d.map(s=>s.title)),['カウント系','EDボイス','AT終了ボイス','CZ終了ボイス']);
  // 11/6 追加解析：カウント系に「確定CZ」1行（docs/specs/ragnador-checker-v03.md）
  assert.equal(d.reduce((sum,s)=>sum+s.items.length+1,0),25);
  Object.entries(EXPECTED).forEach(([g,rows],i)=>{assert.equal(d[i+1].percent,true);assert.equal(d[i+1].denominator,rows.length);assert.deepEqual(clone(d[i+1].items.map(x=>x.label)),rows.map(r=>r[1]));});
  assert.deepEqual(clone(c.card.blocks(cx)),[['CZ','1/1000.0'],['AT初当り','1/1000.0'],['確定演出','計4回'],['通常G','1000G']]);
  assert.deepEqual(clone(c.card.chart(cx).items),[{label:'CZ',value:1},{label:'AT初当り',value:1}]);
  assert.equal(c.card.bottom(cx).columns[0].items.length,3);
  assert.equal(c.card.detail(ctx(fresh()))[1].denominator,0);
  const ref=c.pages(cx,()=>'')[2]();assert.ok(ref.includes('CZ・AT初当り・出玉率'));assert.ok(!ref.includes('ボイス'));
});
check('normalize旧データ補完・整数化・未知キーは型ごと保持（§9-108-4）・冪等',()=>{
  assert.deepEqual(clone(c.mergeKeys),['counts','edVoice','atVoice','czVoice']);assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));
  const S=c.normalizeState({counts:{cz:'4.9',future:99},edVoice:{ten:'2.9',future:99},atVoice:{base:-3},czVoice:{suzaku:Infinity},gameLog:['500.9',-1,'x'],futureRoot:'keep'});
  assert.equal(S.counts.cz,4);assert.equal(S.edVoice.ten,2);assert.equal(S.atVoice.base,0);assert.equal(S.czVoice.suzaku,0);assert.equal(S.futureRoot,'keep');
  // 11/6（§9-108-4）：知らないキーは型ごと残す
  assert.equal(S.counts.future,99);assert.equal(S.edVoice.future,99);
  for(const g of c.mergeKeys)assert.deepEqual(Object.keys(S[g]).filter(k=>k!=='future'),Object.keys(c.defaults[g]));assert.deepEqual(clone(S.gameLog),[500]);assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));
  for(const g of c.mergeKeys)for(const k of Object.keys(c.defaults[g]))for(const v of [-1,NaN,Infinity,'bad',null]){const t=fresh();t[g][k]=v;c.normalizeState(t);assert.equal(t[g][k],0);}
});
check('HTML4タブ・noindex・クエリ・ガイド・LF・後読みなし・構文',()=>{
  assert.equal(c.storageKey,'ragnador-checker-v1');assert.equal(c.pages(ctx(fresh()),()=>'').length,4);
  const html=read('ragnador-checker.html'),guide=read('ragnador-guide.html');
  assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','参照','カード']);
  for(const t of ['repeat(4,1fr)','checker-data/ragnador.js?v=20261107-wording'])assert.ok(html.includes(t));
  for(const kind of ['name="description"','property="og:description"'])assert.ok(html.split(kind)[1].split('>')[0].includes('ボイス示唆'));
  for(const t of [...TITLES,'2026年11月6日','母数','確定演出'])assert.ok(guide.includes(t));
  assert.ok(!c.pages(ctx(fresh()),()=>'')[0]().includes('調査中'));assert.ok(!guide.includes('調査中'));
  const tmp=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'ragnador-syntax-'));
  for(const p of ['ragnador-checker.html','ragnador-guide.html','checker-data/ragnador.js']){
    const src=read(p);assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);assert.doesNotMatch(src,/濃厚示唆|最強|設定差なし/);
    if(p.endsWith('.html')){assert.ok(!src.includes('name="robots"'),p+' 公開（11/2、PR #83）');for(const [i,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,path.basename(p)+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}}
    else execFileSync(process.execPath,['--check',path.join(root,p)]);
  }
});
console.log(`ragnador-voice: ${checks} passed / ${failures} failed`);if(failures)process.exitCode=1;

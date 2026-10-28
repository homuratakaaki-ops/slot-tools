// node tests/seiya12.verify.mjs — 仕様書 docs/specs/seiya12-checker-v01.md の独立期待値による検証。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
// 追加ボタンは入力欄 #gameLogIn の値を読む。テストでは document.getElementById だけを差し替える。
const doc={value:'',getElementById:id=>id==='gameLogIn'?{value:doc.value}:null};
const box={window:{},document:doc};vm.createContext(box);
vm.runInContext(read('checker-data/seiya12.js'),box);
const c=box.window.CheckerConfigs.seiya12;
let checks=0,failures=0;
const fresh=()=>c.normalizeState(clone(c.defaults));
// engine の pct と同じ書式（n/d xx%）。
function ctx(S){return {S,pct:(v,d)=>d>0?`${v}/${d} ${(100*v/d).toFixed(0)}%`:`${v}/0 —`,crow:(key,label,sub,hot,pct)=>{
  const [group,id]=key.split('.');return `<div data-c="${key}"><b>${label}</b><small>${sub}</small><span class="pct">${pct?pct(S[group][id]):''}</span></div>`;
}};}
const pages=S=>c.pages(ctx(S),()=>'');
const pctOf=(html,key)=>html.split(`data-c="${key}"`)[1].split('</div>')[0].match(/class="pct">(.*?)<\/span>/)[1];
function check(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}

const strongCases=[
  ['trophy','bronze',2,'銅'],['trophy','silver',3,'銀'],['trophy','gold',4,'金'],['trophy','clown',5,'クマノミ柄'],['trophy','rainbow',6,'虹'],
  ['atEnd','marin',4,'魔鈴＆シャイナ'],['atEnd','saori',6,'沙織'],['erFirst','gemini',4,'ジェミニ'],
  ['card','harisenbon',2,'ハリセンボン座'],['card','same',4,'サメ座'],['card','ebi',5,'エビ座'],['card','ankou',6,'アンコウ座']
];
for(const [group,id,rank,label] of strongCases)check('確定演出 '+group+'.'+id,()=>{
  const S=fresh();S[group][id]=2;
  assert.equal(c.card.blocks(ctx(S))[2][1],'計2回');
  assert.equal(c.card.bottom(ctx(S)).columns[0].items[0].text,`確定演出 ${label}(${rank===6?'6濃厚':rank+'以上'}) ×2`);
  assert.match(c.template(ctx(S)),/確定演出2回/);
});
check('期待度UP・一輝・不明は確定演出に数えない／最上位を選ぶ',()=>{
  const S=fresh();
  for(const [g,ids] of Object.entries({trophy:['unknown'],atEnd:['none','bronze3','bronze4','bronze4L','bronze5','ikki','unknown'],erFirst:['shaka','unknown'],erSecond:['mu','aiolos','unknown']}))for(const id of ids)S[g][id]=3;
  assert.equal(c.card.blocks(ctx(S))[2][1],'計0回');assert.equal(c.card.bottom(ctx(S)).columns[0].items[0].text,'確定演出 なし');
  S.trophy.bronze=1;S.card.ankou=1;S.erFirst.gemini=1;
  assert.equal(c.card.blocks(ctx(S))[2][1],'計3回');
  assert.equal(c.card.bottom(ctx(S)).columns[0].items[0].text,'確定演出 アンコウ座(6濃厚) ×1');
});
check('通常CZ合計（種別不明を含む）と種別割合（不明を除く）の分離',()=>{
  const S=fresh();S.gameLog=[700,600,500];S.counts.czWho=3;S.counts.czKage=1;S.counts.czUnknown=4;S.counts.at=5;
  const html=pages(S)[0]();
  assert.equal(pctOf(html,'counts.czWho'),'3/4 75%');assert.equal(pctOf(html,'counts.czKage'),'1/4 25%');assert.equal(pctOf(html,'counts.czUnknown'),'');
  const total=html.split('data-total="cz"')[1].split('<div class="hint">')[0];
  assert.match(total,/通常CZ合計/);assert.match(total,/<div class="num">8<\/div><div class="pct">1\/225\.0<\/div>/);
  assert.match(total,/設1:1\/214\.4⇔設6:1\/200\.3（設定差は小さい）/);
  assert.equal(pctOf(html,'counts.at'),'1/360.0');
  assert.match(html,/設1:1\/364\.2⇔設6:1\/310\.5/);
  assert.ok(!/data-c="counts\.czTotal"/.test(html),'合計行は押せない表示行');
  assert.deepEqual(clone(c.card.blocks(ctx(S)).slice(0,2)),[['CZ合計','1/225.0'],['AT','1/360.0']]);
  assert.deepEqual(clone(c.card.chart(ctx(S)).items),[{label:'フーアーユー',value:3},{label:'影ノ襲来',value:1}]);
  const t=c.template(ctx(S));
  for(const line of ['通常CZ合計▶8回（1/225.0）','CZ フーアーユー▶3回 (75%)','CZ 影ノ襲来▶1回 (25%)','通常CZ（種別不明）▶4回','AT初当り▶5回（1/360.0）'])assert.ok(t.includes(line),line);
  S.counts.czWho=S.counts.czKage=0;
  assert.equal(pctOf(pages(S)[0](),'counts.czWho'),'0/0 —');assert.ok(c.template(ctx(S)).includes('通常CZ合計▶4回（1/450.0）'));
  assert.ok(!c.template(ctx(S)).includes('%'));
  // 分母0（未登録）は「—」。旧方式の打ち始めG・現在Gが残っていても分母に使わない。
  S.gameLog=[];S.startGames=100;S.currentGames=3000;assert.equal(c.card.blocks(ctx(S))[0][1],'—');assert.equal(pctOf(pages(S)[0](),'counts.at'),'—');
  for(const s of ['サガバトル','セット継続・上位移行・千日戦争の引戻しは数えません','CZ成功からの自動加算はしません'])assert.ok(pages(fresh())[0]().includes(s),s);
});
check('当選ごとのG: 入力欄・追加・最後の1件の取消・hint・注記の移動',()=>{
  const HINT='当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。';
  const S=fresh(),cx=ctx(S),input=()=>pages(S)[0]();
  assert.ok(input().includes(`<div class="hint">${HINT}</div>`));
  assert.ok(input().includes('<label>当選時のG数</label><input type="number" inputmode="numeric" id="gameLogIn" value=""'));
  assert.ok(input().includes('data-action="popGameLog" data-label="当選G取消" disabled>最後の1件を取り消す'));
  assert.doesNotMatch(input(),/打ち始め|現在の回転数|data-number-key="(startGames|currentGames)"|液晶G数/);
  doc.value='';assert.equal(c.actions.addGameLog(cx),false);doc.value='0';assert.equal(c.actions.addGameLog(cx),false);
  assert.equal(c.actions.popGameLog(cx),false);
  doc.value='420';assert.equal(c.actions.addGameLog(cx),'当選G 420G を追加');doc.value='180';c.actions.addGameLog(cx);
  assert.deepEqual(clone(S.gameLog),[420,180]);
  assert.ok(input().includes('累計通常G <b style="color:#6fd8ff" data-glog-sum>600G</b> ／ <span data-glog-count>2</span>件'));
  assert.ok(input().includes('最後に追加：180G'));
  assert.equal(c.card.metaText(cx,'2026/10/28'),'2026/10/28  累計通常G 600G（2件）');
  assert.equal(c.actions.popGameLog(cx),'当選G 180G を取り消し');assert.deepEqual(clone(S.gameLog),[420]);
  const ref=pages(S)[2]();
  assert.ok(ref.includes('<td>液晶・メニューのG数</td><td>液晶G数は設定変更時と電源OFF→ON時に0Gへ戻ります（電源OFF→ONでは内部状態を引き継ぎます）。メニューのAT間G数も設定変更で0に戻ります。設定推定の分母には使わず、当選ごとのG数の合計を使います。</td>'));
  assert.ok(read('seiya12-guide.html').includes('当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）'));
  assert.ok(read('docs/specs/seiya12-checker-v01.md').includes('分母＝当選ごとのG合計（§9-105）'));
});
check('AT終了画面だけ割合（不明を除く）・ほかは割合なし',()=>{
  const S=fresh();S.atEnd.none=2;S.atEnd.saori=1;S.atEnd.ikki=1;S.atEnd.unknown=9;
  for(const g of ['trophy','erFirst','erSecond','card'])for(const id of Object.keys(S[g]))S[g][id]=1;
  const html=pages(S)[1]();
  assert.equal(pctOf(html,'atEnd.none'),'2/4 50%');assert.equal(pctOf(html,'atEnd.ikki'),'1/4 25%');assert.equal(pctOf(html,'atEnd.unknown'),'');
  for(const g of ['trophy','erFirst','erSecond','card'])for(const id of Object.keys(S[g]))assert.equal(pctOf(html,g+'.'+id),'',g+'.'+id);
  const d=c.card.detail(ctx(S));
  const at=d.find(s=>s.title==='AT終了画面');assert.equal(at.denominator,4);assert.equal(at.percent,true);
  assert.equal(at.items.find(i=>i.label==='不明').text,'不明 ×9');
  assert.ok(d.filter(s=>s.title!=='AT終了画面'&&s.title!=='カウント系').every(s=>s.percent===false&&!s.denominator));
  assert.ok(c.template(ctx(S)).includes('沙織▶1回 (25%)'));
  assert.equal(c.card.blocks(ctx(S))[3][1],'計6回','トロフィーは色不明も出現回数に入れる');
});
check('示唆の行名・示唆文・不明行・hint',()=>{
  const S=fresh(),html=pages(S)[1]();
  const rows=[
    ['trophy.bronze','銅','設定2以上濃厚'],['trophy.silver','銀','設定3以上濃厚'],['trophy.gold','金','設定4以上濃厚'],['trophy.clown','クマノミ柄','設定5以上濃厚'],['trophy.rainbow','虹','設定6濃厚'],['trophy.unknown','色不明',''],
    ['atEnd.none','キャラなし','デフォルト'],['atEnd.bronze3','青銅3人','奇数設定 期待度UP'],['atEnd.bronze4','青銅4人','偶数設定 期待度UP'],
    ['atEnd.bronze4L','左向きの青銅4人','高設定 期待度UP'],['atEnd.bronze5','青銅5人（正面に一輝）','高設定 期待度UP（強）'],
    ['atEnd.marin','魔鈴＆シャイナ','設定4以上濃厚'],['atEnd.saori','沙織','設定6濃厚'],['atEnd.ikki','一輝','復活濃厚（設定示唆ではない）'],['atEnd.unknown','不明','割合の母数に入れない'],
    ['erFirst.shaka','シャカ','高設定 期待度UP'],['erFirst.gemini','ジェミニ','設定4以上濃厚'],['erFirst.unknown','不明',''],
    ['erSecond.mu','ムウ','高設定 期待度UP'],['erSecond.aiolos','アイオロス','高設定 期待度UP（強）'],['erSecond.unknown','不明',''],
    ['card.harisenbon','ハリセンボン座','設定2以上濃厚'],['card.same','サメ座','設定4以上濃厚'],['card.ebi','エビ座','設定5以上濃厚'],['card.ankou','アンコウ座','設定6濃厚']
  ];
  const all=[...html.matchAll(/data-c="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(all,rows.map(r=>r[0]));
  for(const [id,name,mean] of rows){const seg=html.split(`data-c="${id}"`)[1].split('</div>')[0];assert.ok(seg.includes(`<b>${name}</b><small>${mean}</small>`),id);}
  for(const s of ['黄金聖闘士バトル・千日戦争の継続バトル・サガバトル敗北時に出ることがあります。出現率はホール設定で変わるため、出ないことを低設定の根拠にしません。',
    'AT・上位ATの終了時（黄金聖闘士バトル敗北後など）に出ます。一輝は復活の示唆で設定とは無関係です。',
    'エクストララウンド中の黄金聖闘士バトルに勝利したときに発生します。','通常時のカード演出で出る星座です。設定示唆のある4種だけ記録します。'])assert.ok(html.includes(s),s);
});
check('参照タブ：6設定表・小役・トロフィー・調査中',()=>{
  const html=pages(fresh())[2]();
  const tbl=[[214.4,364.2,97.5],[214.1,356.1,98.5],[211.7,345.6,100.5],[202.5,322.3,105.2],[197.2,313.7,110.0],[200.3,310.5,114.9]];
  tbl.forEach(([cz,at,p],i)=>assert.ok(html.includes(`<td>設定${i+1}</td><td>CZ合算 1/${cz.toFixed(1)} ／ AT初当り 1/${at.toFixed(1)} ／ 出玉率 ${p.toFixed(1)}%</td>`),'設定'+(i+1)));
  for(const [k,v] of [['リプレイ','1/11.3'],['15枚ベル','1/131.1'],['弱チェリー','1/99.9'],['スイカ','1/99.9'],['チャンス目（合算）','1/266.4'],['強チェリー','1/399.6']])assert.ok(html.includes(`<td>${k}</td><td>${v}</td>`),k);
  assert.ok(html.includes('小役確率（全設定共通の公表値）'));assert.doesNotMatch(html,/設定差なし|設定差はありません/);
  for(const s of ['規定周期の振り分け','守護星座の加護','調査中（推定に使わない）','第三者の独自調査値'])assert.ok(html.includes(s),s);
  assert.doesNotMatch(html,/メーカー公式|公式発表/);
});
check('テンプレ・detail が全セクション・全行を網羅',()=>{
  const S=fresh();S.gameLog=[5000,3000];
  for(const key of c.mergeKeys)for(const id of Object.keys(S[key]))S[key][id]=1;
  const t=c.template(ctx(S)),detail=c.card.detail(ctx(S));
  assert.deepEqual(clone(detail.map(s=>s.title)),['カウント系','トロフィー','AT終了画面','ER 1人目','ER 2人目','星座']);
  for(const sec of detail)for(const item of sec.items){assert.ok([...item.label].length<=10,item.label);assert.ok(item.value>0||item.text,item.label);}
  assert.deepEqual(clone(detail.find(s=>s.title==='AT終了画面').items.map(i=>i.label)),['キャラなし','青銅3人','青銅4人','左向き青銅4','青銅5一輝','魔鈴シャイナ','沙織','一輝','不明']);
  assert.deepEqual(clone(detail[0].items.map(i=>i.text)),['通常CZ合計 ×3 1/2666.7','CZ フーアーユー ×1 (50%)','CZ 影ノ襲来 ×1 (50%)','通常CZ 種別不明 ×1','AT初当り ×1 1/8000.0']);
  for(const s of ['■カウント系','■トロフィー','■AT終了画面','■エクストララウンド キャラ紹介（1人目）','■エクストララウンド キャラ紹介（2人目）','■カード演出の星座'])assert.ok(t.includes(s),s);
  for(const key of Object.keys(S).filter(k=>k!=='counts'&&S[k]&&typeof S[k]==='object'&&!Array.isArray(S[k])))for(const id of Object.keys(S[key])){
    const label=pages(S)[1]().split(`data-c="${key}.${id}"`)[1].match(/<b>(.*?)<\/b>/)[1];assert.ok(t.includes(label+'▶1回'),key+'.'+id);
  }
  assert.ok(t.startsWith('設定判別メモ｜L聖闘士星矢 黄金十二宮\n累計通常G 8000G（2件） / 確定演出12回'));
  assert.ok(t.endsWith('by slot-tools.jp\n解析出典:ちょんぼりすた様'));assert.equal(c.compactTemplate(ctx(S)),t);
  assert.ok(!c.template(ctx(fresh())).includes('■'));
  const b=c.card.bottom(ctx(S));assert.equal(b.startY,760);assert.equal(b.rowGap,44);assert.deepEqual(Array.from(b.columns,col=>col.x),[70,560]);
  const rows=b.columns.flatMap(col=>col.items);assert.ok(rows.length<=10);assert.ok(b.columns.every(col=>760+44*(col.items.length-1)<=936));
  assert.deepEqual(clone(rows.map(r=>r.text)),['確定演出 虹(6濃厚) ×1','トロフィー 銅×1・銀×1・金×1・クマノミ柄×1・虹×1','終了画面 魔鈴シャイナ×1・沙織×1','星座 ハリセンボン×1・サメ×1・エビ×1・アンコウ×1','ER1人目 シャカ×1・ジェミニ×1','ER2人目 ムウ×1・アイオロス×1','AT初当り 1回 1/8000.0']);
  assert.equal(c.card.footerTags,'#聖闘士星矢 #設定判別');assert.equal(c.card.title,'L聖闘士星矢 黄金十二宮');
});
check('normalize: 旧データ補完・不正値・未知キー保持・冪等',()=>{
  const S={startGames:-4,currentGames:'8000.9',gameLog:['8000.9',-4,'x',120],counts:{czWho:'3.8',at:-2,czKage:Infinity},trophy:{gold:NaN,future:4.8},futureRoot:'keep'};
  const a=c.normalizeState(S),b=c.normalizeState(clone(a));assert.deepEqual(clone(a),clone(b));
  assert.equal(a.counts.czWho,3);assert.equal(a.counts.at,0);assert.equal(a.counts.czKage,0);assert.equal(a.counts.czUnknown,0);
  assert.equal(a.trophy.gold,0);assert.equal(a.trophy.future,4);assert.deepEqual(clone(a.gameLog),[8000,120]);assert.equal(a.futureRoot,'keep');
  for(const key of c.mergeKeys)for(const id of Object.keys(c.defaults[key]))assert.ok(Number.isInteger(a[key][id])&&a[key][id]>=0,key+'.'+id);
  assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));
  const old={currentGames:500,counts:{czWho:2}};const o=c.normalizeState(clone(old));assert.deepEqual(clone(o.gameLog),[]);
  assert.equal(o.counts.czWho,2);assert.deepEqual(clone(o.atEnd),clone(c.defaults.atEnd));assert.deepEqual(clone(c.normalizeState(clone(o))),clone(o));
});
check('HTML: noindex・導線なし・推測タブなし・LF・構文',()=>{
  assert.equal(c.storageKey,'seiya12-checker-v1');assert.equal(c.uiV2,true);assert.equal(c.nanaCollab,false);
  assert.equal(c.sourceUrl,'https://chonborista.com/slot/sanyo-slot/260304/');
  assert.equal(c.pages(ctx(fresh()),()=>'').length,4);
  const html=read('seiya12-checker.html');
  assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','参照','カード']);
  assert.ok(!html.includes('checker-bayes.js'));
  for(const s of ['checker-engine.js?v=20260924','checker-data/seiya12.js?v=20261028','CheckerEngine.mount(CheckerConfigs.seiya12);','seiya12-guide.html'])assert.ok(html.includes(s),s);
  assert.equal(html.match(/<style>[\s\S]*?<\/style>/)[0],read('paripi-checker.html').match(/<style>[\s\S]*?<\/style>/)[0],'4タブのスタイル');
  for(const p of ['checkers.html','index.html','sitemap.xml'])assert.ok(!read(p).includes('seiya12'),p+' に導線なし');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'seiya12-syntax-'));
  for(const [i,p] of ['seiya12-checker.html','seiya12-guide.html'].entries()){
    const src=read(p);assert.ok(src.includes('<meta name="robots" content="noindex,nofollow">'),p);
    assert.ok(src.includes(`href="https://slot-tools.jp/${p}"`));assert.ok(!src.includes('\r'));
    for(const [j,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){
      const f=path.join(tmp,`${i}-${j}.mjs`);fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);
    }
  }
  const src=read('checker-data/seiya12.js');assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);
  assert.doesNotMatch(src+read('seiya12-guide.html'),/濃厚示唆|最強|ベイズ|事後確率/);
});
console.log(`seiya12: ${checks} passed / ${failures} failed`);
if(failures)process.exitCode=1;

// 指示書 2026-11-02 の独立期待値。node tests/garo-suggest.verify.mjs
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
  "bonusEnd": [
    [
      "ryuga",
      "流牙",
      "デフォルト",
      0,
      []
    ],
    [
      "rian",
      "莉杏",
      "偶数設定期待度UP(弱)",
      0,
      []
    ],
    [
      "furei",
      "符礼",
      "偶数設定期待度UP(中)",
      0,
      []
    ],
    [
      "rianMaid",
      "莉杏（メイド）",
      "偶数設定期待度UP(強)",
      0,
      []
    ],
    [
      "enpo",
      "燕邦",
      "高設定期待度UP(弱)",
      0,
      []
    ],
    [
      "libera",
      "リベラ",
      "高設定期待度UP(中)",
      0,
      []
    ],
    [
      "sonshi",
      "尊士",
      "高設定期待度UP(強)",
      0,
      []
    ],
    [
      "horror",
      "魔導ホラー集合",
      "設定2以上濃厚",
      2,
      []
    ],
    [
      "knights",
      "魔戒騎士集合",
      "設定4以上濃厚",
      4,
      []
    ],
    [
      "golden",
      "金色牙狼",
      "設定6濃厚",
      6,
      []
    ]
  ],
  "rushEnd": [
    [
      "garo",
      "牙狼",
      "デフォルト",
      0,
      []
    ],
    [
      "zen",
      "漸",
      "偶数設定期待度UP(弱)",
      0,
      []
    ],
    [
      "gai",
      "牙射",
      "高設定期待度UP(弱)",
      0,
      []
    ],
    [
      "rian",
      "莉杏",
      "設定2以上濃厚",
      2,
      []
    ],
    [
      "knights",
      "魔戒騎士集合",
      "設定4以上濃厚",
      4,
      []
    ],
    [
      "garoYami",
      "牙狼闇",
      "設定6濃厚",
      6,
      []
    ]
  ],
  "trophy": [
    [
      "bronze",
      "銅",
      "設定2以上濃厚",
      2,
      []
    ],
    [
      "silver",
      "銀",
      "設定3以上濃厚",
      3,
      []
    ],
    [
      "gold",
      "金",
      "設定4以上濃厚",
      4,
      []
    ],
    [
      "sansei",
      "サンセイ柄",
      "設定5以上濃厚",
      5,
      []
    ],
    [
      "rainbow",
      "虹",
      "設定6濃厚",
      6,
      []
    ],
    [
      "black",
      "黒",
      "次回銅以上のトロフィー出現濃厚（設定2以上濃厚として数える）",
      2,
      []
    ]
  ],
  "payout": [
    [
      "o246",
      "246枚OVER",
      "偶数設定濃厚",
      0,
      [
        1,
        3,
        5
      ]
    ],
    [
      "o456",
      "456枚OVER",
      "設定4以上濃厚",
      4,
      []
    ],
    [
      "o555",
      "555枚OVER",
      "設定5以上濃厚",
      5,
      []
    ],
    [
      "o666",
      "666枚OVER",
      "設定6濃厚",
      6,
      []
    ],
    [
      "o999",
      "999枚OVER",
      "設定6濃厚",
      6,
      []
    ]
  ],
  "lamp": [
    [
      "dWhite",
      "白",
      "デフォルト",
      0,
      []
    ],
    [
      "dCyan",
      "水色",
      "偶数設定期待度UP(弱)",
      0,
      []
    ],
    [
      "dGreen",
      "緑",
      "偶数設定期待度UP(強)",
      0,
      []
    ],
    [
      "dYellow",
      "黄",
      "高設定期待度UP(弱)",
      0,
      []
    ],
    [
      "dOrange",
      "オレンジ",
      "高設定期待度UP(強)",
      0,
      []
    ],
    [
      "gAll",
      "全てオレンジ",
      "設定2以上濃厚",
      2,
      []
    ],
    [
      "gAro",
      "「ARO」がオレンジ",
      "設定3以上濃厚",
      3,
      []
    ],
    [
      "gRo",
      "「RO」がオレンジ",
      "設定4以上濃厚",
      4,
      []
    ],
    [
      "gO",
      "「O」がオレンジ",
      "設定5以上濃厚",
      5,
      []
    ],
    [
      "gRainbow",
      "全て虹",
      "設定6濃厚",
      6,
      []
    ],
    [
      "gNot2",
      "「G」が青・「ARO」が黄",
      "設定2否定",
      0,
      [
        2
      ]
    ],
    [
      "gNot3",
      "「A」が青・「GRO」が黄",
      "設定3否定",
      0,
      [
        3
      ]
    ],
    [
      "gNot4",
      "「R」が青・「GAO」が黄",
      "設定4否定",
      0,
      [
        4
      ]
    ]
  ],
  "stepup": [
    [
      "tomo",
      "友",
      "次回BIG以上でなければ設定2以上濃厚",
      2,
      []
    ],
    [
      "gi",
      "義",
      "次回BIG以上でなければ設定3以上濃厚",
      3,
      []
    ],
    [
      "ran",
      "乱",
      "次回BIG以上でなければ設定4以上濃厚",
      4,
      []
    ],
    [
      "switchOn",
      "switch on!!",
      "出現時点で次回BIG以上＋規定G数での当選＋設定6濃厚",
      6,
      []
    ]
  ],
  "item": [
    [
      "madou",
      "魔導紀元史",
      "555Gまでに当選しなければ設定2以上濃厚",
      2,
      []
    ],
    [
      "kaneshiro",
      "金城グループマーク",
      "規定G数で当選しなければ設定2以上濃厚",
      2,
      []
    ],
    [
      "zanbaken",
      "牙狼斬馬剣",
      "出現時点で引き戻し以上＋設定2以上濃厚",
      2,
      []
    ],
    [
      "plant",
      "プラント",
      "333Gまでに当選しなければ偶数設定濃厚",
      0,
      [
        1,
        3,
        5
      ]
    ],
    [
      "sonshiSword",
      "尊士の剣",
      "222Gまでに当選しなければ設定4以上濃厚",
      4,
      []
    ],
    [
      "object",
      "禁断のオブジェ",
      "777Gまでに当選しなければ設定6濃厚",
      6,
      []
    ],
    [
      "tonton",
      "トントン",
      "出現時点で規定G数での当選＋設定6濃厚",
      6,
      []
    ]
  ]
};
const TITLES=["BONUS・金色になれ！終了画面","究極魔戒RUSH終了画面","トントントロフィー","獲得枚数表示","3000枚BONUS中のランプ","ステップアップの文字","設定示唆のアイテム"];
const HINTS=["初当りBONUSと金色になれ！の終了画面で設定を示唆します。ザルバ（復活）は設定示唆ではないため記録しません。","究極魔戒RUSHの終了画面で設定を示唆します。","初当りBONUS終了時・金色になれ！敗北時・究極魔戒RUSH終了時に出現することがあります。出現頻度はホールが調整できるため、出ないことは設定の根拠になりません。","一定枚数の獲得時に表示される「○○○枚OVER」の一部で設定を示唆します。","3000枚BONUS中にレア役が成立するとPUSHボタンが促され、押すと筐体ランプの色で示唆します。","通常時に画面下部のステップアップUIに文字が出現すると、次回ボーナスの種類と設定を示唆します。","通常時のアイテム転送で出現します。規定G数は滞在モードの天井G数（111G・222G…）です。"];
const SHORT={"dWhite":"ダイヤ白","dCyan":"ダイヤ水色","dGreen":"ダイヤ緑","dYellow":"ダイヤ黄","dOrange":"ダイヤオレンジ","gAll":"ロゴ全オレンジ","gAro":"ロゴARO橙","gRo":"ロゴRO橙","gO":"ロゴO橙","gRainbow":"ロゴ全虹","gNot2":"G青ARO黄","gNot3":"A青GRO黄","gNot4":"R青GAO黄"};
const NOTICE="友・義・乱、魔導紀元史・金城グループマーク・プラント・尊士の剣・禁断のオブジェは、条件を満たしたと確認できたときだけ押してください。出ただけでは押しません。";
const box={window:{}};vm.createContext(box);vm.runInContext(read('checker-data/garo.js'),box);
const c=box.window.CheckerConfigs.garo,fresh=()=>c.normalizeState(clone(c.defaults));
const ctx=S=>({S,pct:(v,d)=>d>0?`${v}/${d} ${(100*v/d).toFixed(0)}%`:`${v}/0 —`,crow:(key,label,sub,hot,pct)=>{
  const [g,k]=key.split('.');return JSON.stringify([key,label,sub,hot,pct?pct(S[g][k]):null]);
}});
let checks=0,failures=0;
function check(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}

// 独立期待値とclosure内マスタを照合（実行用configにテストAPIは追加しない）。
const inspect={window:{}};vm.createContext(inspect);
vm.runInContext(read('checker-data/garo.js').replace('  const DEF=','  window.__groups=GROUPS;\n  const DEF='),inspect);
check('51行のkey/行名/補足/rank/exclude完全一致',()=>{
  assert.deepEqual(clone(inspect.window.__groups),EXPECTED);
  assert.equal(Object.values(EXPECTED).flat().length,51);
});
for(const [group,rows] of Object.entries(EXPECTED))for(const [key,label,sub,rank,exclude] of rows)check(group+'.'+key+' 原文・hot・CERT・否定・コピー・詳細',()=>{
  const S=fresh();S[group][key]=2;const cx=ctx(S),html=c.pages(cx,()=>'')[1]();
  const percent=['bonusEnd','rushEnd'].includes(group),even=exclude.length===3,strong=rank>0||even,hot=rank>0||exclude.length>0;
  assert.ok(html.includes(JSON.stringify([group+'.'+key,label,sub,hot,percent?'2/2 100%':null])));
  assert.equal(c.card.blocks(cx)[2][1],strong?'計2回':'計0回');
  const bottom=c.card.bottom(cx).columns[0].items;
  assert.equal(bottom[0].text,strong?'確定演出 '+label+'('+(even?'2・4・6':rank===6?'6濃厚':rank+'以上')+') ×2':'確定演出 なし');
  assert.equal(bottom[1].text,exclude.length===1?'否定 設'+exclude[0]:'否定 −');
  assert.ok(c.template(cx).includes(label+'▶2回'+(percent?' (100%)':'')));
  assert.equal(c.template(cx).split('▶').length-1,1);
  const details=c.card.detail(cx).slice(1).flatMap(s=>s.items);assert.equal(details.length,1);
  assert.equal(details[0].label,group==='lamp'?SHORT[key]:label);assert.equal(details[0].hot,hot);
});
check('7セクション・説明・常時注意文・割合の分母・順位',()=>{
  const S=fresh();for(const [g,rows] of Object.entries(EXPECTED))rows.forEach((r,i)=>S[g][r[0]]=i+1);
  const cx=ctx(S),html=c.pages(cx,()=>'')[1]();
  assert.equal((html.match(/<section /g)||[]).length,7);assert.equal((html.match(/class="hint"/g)||[]).length,7);
  HINTS.forEach(t=>assert.ok(html.includes('<div class="hint">'+t+'</div>')));
  assert.ok(html.includes('<div class="condition-notice">'+NOTICE+'</div><section class="sec"><div class="sec-h">ステップアップの文字'));
  assert.equal(html.split(NOTICE).length-1,1);assert.ok(html.includes('color:var(--gold)'));
  for(const [g,rows] of Object.entries(EXPECTED)){
    const total=rows.length*(rows.length+1)/2;assert.ok(html.includes('計'+total+'回'));
    rows.forEach(([key,label,sub,rank,ex],i)=>assert.ok(html.includes(JSON.stringify([g+'.'+key,label,sub,rank>0||ex.length>0,['bonusEnd','rushEnd'].includes(g)?(i+1)+'/'+total+' '+(100*(i+1)/total).toFixed(0)+'%':null]))));
  }
  assert.ok(c.card.bottom(cx).columns[0].items[0].text.includes('金色牙狼(6濃厚)'));
  assert.equal(c.card.bottom(cx).columns[0].items[1].text,'否定 設2・設3・設4');
  const total=Object.entries(EXPECTED).reduce((a,[g,rs])=>a+rs.reduce((v,r)=>v+(r[3]>0||r[4].length===3?S[g][r[0]]:0),0),0);
  assert.equal(c.card.blocks(cx)[2][1],'計'+total+'回');
  assert.ok(c.template(cx).includes('累計通常G 0G（0件） / 確定演出'+total+'回'));
  assert.equal(c.compactTemplate(cx),c.template(cx));assert.ok(!c.template(ctx(fresh())).includes('■'));
  Object.entries(EXPECTED).forEach(([g,rs],i)=>{assert.ok(c.template(cx).includes('■'+TITLES[i]));const total=rs.length*(rs.length+1)/2;for(const [j,r] of rs.entries())assert.ok(c.template(cx).includes(r[1]+'▶'+(j+1)+'回'+(i<2?' ('+(100*(j+1)/total).toFixed(0)+'%)':'')));});
});
check('詳細0回除外・短縮名・A/Bだけ％・既存カード維持',()=>{
  const S=fresh();for(const g of c.mergeKeys)for(const k of Object.keys(S[g]))S[g][k]=1;S.gameLog=[1000];const cx=ctx(S),d=c.card.detail(cx);
  assert.deepEqual(clone(d.map(s=>s.title)),['カウント系','BONUS終了','RUSH終了','トロフィー','枚数表示','3000枚ランプ','ステップアップ','アイテム']);
  Object.entries(EXPECTED).forEach(([g,rs],i)=>{assert.equal(d[i+1].percent,i<2);assert.equal(d[i+1].denominator,i<2?rs.length:undefined);assert.deepEqual(clone(d[i+1].items.map(x=>x.label)),rs.map(r=>g==='lamp'?SHORT[r[0]]:r[1]));});
  assert.equal(d.slice(1).reduce((n,s)=>n+s.items.length,0),51);
  assert.equal(c.card.detail(ctx(fresh())).slice(1).flatMap(s=>s.items).length,0);
  assert.deepEqual(clone(c.card.blocks(cx)),[['トータルCZ','1/1000.0'],['BONUS初当り','1/1000.0'],['確定演出','計33回'],['通常G','1000G']]);
  assert.equal(c.card.bottom(cx).columns[0].items.length,4);
  assert.equal(c.card.chart(cx).items.length,2);
});
check('defaults・0埋め・既存データ・未知キー除去・整数化・冪等',()=>{
  assert.deepEqual(clone(c.mergeKeys),['counts',...Object.keys(EXPECTED)]);assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));
  for(const g of c.mergeKeys){assert.ok(Object.values(c.defaults[g]).every(v=>v===0));for(const k of Object.keys(c.defaults[g]))for(const [input,expected] of [[-1,0],[NaN,0],[Infinity,0],['bad',0],[null,0],['2.9',2]]){const S=fresh();S[g][k]=input;S[g].future=99;c.normalizeState(S);assert.equal(S[g][k],expected);assert.equal(S[g].future,undefined);assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));}}
  const old=c.normalizeState({counts:{cz:4,bonus:2},gameLog:['500.9',-1,'x'],futureRoot:'keep'});assert.equal(old.counts.cz,4);assert.equal(old.counts.bonus,2);assert.deepEqual(clone(old.gameLog),[500]);assert.equal(old.futureRoot,'keep');
});
check('HTML4タブ・公開（index可）・クエリ・ガイド・LF・後読みなし・構文',()=>{
  assert.equal(c.storageKey,'garo-checker-v1');assert.equal(c.pages(ctx(fresh()),()=>'').length,4);
  const html=read('garo-checker.html'),guide=read('garo-guide.html');
  assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','参照','カード']);
  for(const t of ['repeat(4,1fr)','checker-data/garo.js?v=20261102-garo'])assert.ok(html.includes(t));
  for(const t of [...TITLES,'2026年11月2日','分母','確定演出'])assert.ok(guide.includes(t));
  assert.ok(!c.pages(ctx(fresh()),()=>'')[0]().includes('調査中'));assert.ok(!guide.includes('調査中'));
  const tmp=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'garo-syntax-'));
  for(const p of ['garo-checker.html','garo-guide.html','checker-data/garo.js']){
    const src=read(p);assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);assert.doesNotMatch(src,/濃厚示唆|最強|設定差なし/);
    if(p.endsWith('.html')){assert.ok(!src.includes('name="robots"'),p+' 公開（11/2、PR #83）');for(const [i,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,path.basename(p)+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}}
    else execFileSync(process.execPath,['--check',path.join(root,p)]);
  }
});
console.log(`garo-suggest: ${checks} passed / ${failures} failed`);if(failures)process.exitCode=1;

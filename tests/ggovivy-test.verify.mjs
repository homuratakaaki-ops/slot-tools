// 指示書2026-11-02の期待値。§9-108 検収用テスト版。
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
  "ggo": {
    "bonusCard": [
      [
        "zemalHuey",
        "ZEMAL_ヒューイ",
        "調査中",
        0
      ],
      [
        "ketakuB",
        "結託チーム_B",
        "調査中",
        0
      ],
      [
        "ren",
        "レン",
        "調査中",
        0
      ]
    ]
  },
  "vivy": {
    "atEnd": [
      [
        "estella",
        "エステラ",
        "調査中",
        0
      ],
      [
        "beach",
        "ビーチ",
        "調査中",
        0
      ],
      [
        "matsumoto",
        "マツモト変形",
        "調査中",
        0
      ],
      [
        "hug",
        "抱きしめる",
        "調査中",
        0
      ],
      [
        "gaze",
        "見つめる",
        "調査中",
        0
      ],
      [
        "bear",
        "クマ",
        "調査中",
        0
      ],
      [
        "reach",
        "手を伸ばす",
        "調査中",
        0
      ],
      [
        "mini",
        "ミニキャラ",
        "調査中",
        0
      ],
      [
        "all",
        "全員集合",
        "調査中",
        0
      ]
    ],
    "trophy": [
      [
        "bronze",
        "銅",
        "設定2以上濃厚（※示唆内容は推測）",
        0
      ],
      [
        "silver",
        "銀",
        "設定3以上濃厚（※示唆内容は推測）",
        0
      ],
      [
        "gold",
        "金",
        "設定4以上濃厚（※示唆内容は推測）",
        0
      ],
      [
        "inazuma",
        "イナズマ",
        "設定5以上濃厚（※示唆内容は推測）",
        0
      ],
      [
        "rainbow",
        "虹",
        "設定6濃厚（※示唆内容は推測）",
        0
      ]
    ],
    "payout": [
      [
        "p411",
        "411",
        "設定4以上濃厚",
        4
      ],
      [
        "p619",
        "619",
        "設定6濃厚",
        6
      ],
      [
        "p2161",
        "2161",
        "設定4以上濃厚",
        4
      ],
      [
        "p2161x2",
        "2161×2",
        "設定5以上濃厚・4322枚の獲得時に出現する可能性",
        5
      ],
      [
        "p2161x3",
        "2161×3",
        "設定6濃厚・6483枚の獲得時に出現する可能性",
        6
      ]
    ],
    "ending": [
      [
        "vivy",
        "ヴィヴィ",
        "デフォルト",
        0
      ],
      [
        "elizabeth",
        "エリザベス",
        "設定2期待度UP",
        0
      ],
      [
        "estella",
        "エステラ",
        "設定3期待度UP",
        0
      ],
      [
        "grace",
        "グレイス",
        "設定4期待度UP",
        0
      ],
      [
        "ophelia",
        "オフィーリア",
        "設定5期待度UP",
        0
      ],
      [
        "matsumoto",
        "マツモト",
        "設定6期待度UP",
        0
      ],
      [
        "two",
        "2体",
        "設定2以上濃厚",
        2
      ],
      [
        "three",
        "3体",
        "設定3以上濃厚",
        3
      ],
      [
        "four",
        "4体",
        "設定4以上濃厚",
        4
      ],
      [
        "five",
        "5体",
        "設定5以上濃厚",
        5
      ],
      [
        "six",
        "6体",
        "設定6濃厚",
        6
      ]
    ]
  }
};
const TITLES={"bonusCard":"ボーナス終了画面のカード","atEnd":"AT終了画面","trophy":"コパンダトロフィー","payout":"獲得枚数表示","ending":"エンディング中のキャラ"},SHORT={"bonusCard":"終了画面カード","atEnd":"AT終了画面","trophy":"トロフィー","payout":"枚数表示","ending":"ED中キャラ"},HINTS={"bonusCard":"ボーナス終了画面で出現したカードを記録します。示唆内容は調査中です。出現したカードの履歴はメニュー画面で確認できます。","atEnd":"AT終了画面は全9種類です。示唆内容は調査中のため、記録のみです。","trophy":"AT終了時に出現することがあります。出現率はホールが調整できるため、出ないことは設定の根拠になりません。示唆内容は出典で推測とされているため、確定演出には数えません。","payout":"AT中の獲得枚数表示が特定の数字になると設定を示唆します。","ending":"エンディング中にレア役・共通ベルが成立したときPUSHボタンを押すとキャラが出現します。1体ならキャラの種類、2体以上なら体数で示唆します。"};
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function load(id,inspect=false){const box={window:{}};vm.createContext(box);let src=read('checker-data/'+id+'.js');if(inspect)src=src.replace('  const DEF=','  window.__groups=GROUPS;\n  const DEF=');vm.runInContext(src,box);return box.window;}
const ctx=S=>({S,pct:(v,d)=>d>0?v+'/'+d+' '+(100*v/d).toFixed(0)+'%':v+'/0 —',crow:(key,label,sub,hot,pct)=>{const [g,k]=key.split('.');return JSON.stringify([key,label,sub,hot,pct?pct(S[g][k]):null]);}});
for(const [id,groups] of Object.entries(EXPECTED)){
 const w=load(id+'-test',true),c=w.CheckerConfigs[id+'-test'],fresh=()=>c.normalizeState(clone(c.defaults));
 const percent=g=>g==='bonusCard'||g==='atEnd';
 check(id+' master exact / defaults / mergeKeys',()=>{assert.deepEqual(clone(w.__groups),groups);assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));assert.deepEqual(clone(c.mergeKeys),['counts',...Object.keys(groups)]);});
 for(const [g,rows] of Object.entries(groups))for(const [k,label,sub,rank] of rows)check(id+' '+g+'.'+k+' UI / rank / template / detail',()=>{
   const S=fresh();S[g][k]=2;const cx=ctx(S),html=c.pages(cx,()=>'')[1]();
   assert.ok(html.includes(JSON.stringify([g+'.'+k,label,sub,rank>0,percent(g)?'2/2 100%':null])));
   assert.ok(c.template(cx).includes(label+'▶2回'+(percent(g)?' (100%)':'')));assert.equal(c.template(cx).split('▶').length-1,1);
   const d=c.card.detail(cx).find(sec=>sec.title===SHORT[g]);assert.equal(d.items.find(i=>i.label===label).value,2);assert.equal(d.items.find(i=>i.label===label).hot,rank>0);
   if(id==='vivy'){assert.deepEqual(clone(c.card.blocks(cx).find(b=>b[0]==='確定演出')),['確定演出',rank>0?'計2回':'計0回']);assert.equal(c.card.bottom(cx).columns[0].items[0].text,rank>0?'確定演出 '+label+'('+(rank===6?'6濃厚':rank+'以上')+') ×2':'確定演出 なし');}
 });
 check(id+' totals / percentages / headings / highest / all detail rows',()=>{
   const S=fresh();for(const [g,rs] of Object.entries(groups))rs.forEach((r,i)=>S[g][r[0]]=i+1);
   const cx=ctx(S),html=c.pages(cx,()=>'')[1](),details=c.card.detail(cx);
   assert.equal((html.match(/class="hint"/g)||[]).length,Object.keys(groups).length);
   assert.deepEqual(clone(details.map(s=>s.title)),['カウント系',...Object.keys(groups).map(g=>SHORT[g])]);
   for(const [g,rs] of Object.entries(groups)){
     const total=rs.length*(rs.length+1)/2,d=details.find(d=>d.title===SHORT[g]);
     assert.ok(html.includes('<div class="hint">'+HINTS[g]+'</div>'));assert.ok(html.includes('計'+total+'回'));
     assert.equal(d.percent,percent(g));assert.equal(d.denominator,percent(g)?total:undefined);assert.equal(d.items.length,rs.length);
     rs.forEach(([k,label,sub,rank],i)=>{assert.ok(html.includes(JSON.stringify([g+'.'+k,label,sub,rank>0,percent(g)?(i+1)+'/'+total+' '+(100*(i+1)/total).toFixed(0)+'%':null])));assert.ok(c.template(cx).includes(label+'▶'+(i+1)+'回'+(percent(g)?' ('+(100*(i+1)/total).toFixed(0)+'%)':'')));});
     assert.ok(c.template(cx).includes('■'+TITLES[g]));
   }
   assert.ok(details.reduce((n,d)=>n+d.items.length+1,0)<=40);assert.equal(c.compactTemplate(cx),c.template(cx));assert.ok(!c.template(ctx(fresh())).includes('■'));
   if(id==='vivy'){const total=Object.entries(groups).reduce((sum,[g,rs])=>sum+rs.reduce((a,r)=>a+(r[3]>0?S[g][r[0]]:0),0),0);assert.equal(c.card.blocks(cx).find(b=>b[0]==='確定演出')[1],'計'+total+'回');assert.ok(c.template(cx).includes(' / 確定演出'+total+'回'));assert.ok(c.card.bottom(cx).columns[0].items[0].text.includes('619(6濃厚)'));assert.ok(html.includes('>1体</div>'));assert.ok(html.includes('>2体以上</div>'));}
   else {const original=load('ggo').CheckerConfigs.ggo;for(const key of ['blocks','bottom','chart','metaText'])assert.deepEqual(clone(c.card[key](cx,'date')),clone(original.card[key](cx,'date')));for(const key of Object.keys(original.card).filter(k=>typeof original.card[k]!=='function'))assert.deepEqual(c.card[key],original.card[key]);assert.ok(!c.template(cx).includes('確定演出'));}
 });
 check(id+' normalization / integers / unknown keys / idempotence',()=>{
   for(const g of c.mergeKeys){assert.ok(Object.values(c.defaults[g]).every(v=>v===0));for(const k of Object.keys(c.defaults[g]))for(const [value,want] of [[-1,0],[NaN,0],[Infinity,0],['bad',0],[null,0],['2.9',2]]){const S=fresh();S[g][k]=value;S[g].unknown=5;c.normalizeState(S);assert.equal(S[g][k],want);assert.equal(S[g].unknown,undefined);assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));}}
 });
 check(id+' HTML exact allowed delta / syntax / isolation / LF',()=>{
   assert.equal(c.storageKey,id+'-checker-v1-test');assert.equal(c.pages(ctx(fresh()),()=>'').length,4);assert.ok(!c.pages(ctx(fresh()),()=>'')[0]().includes('調査中'));
   const html=read(id+'-test-checker.html'),original=read(id+'-checker.html');
   assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','参照','カード']);
   for(const t of ['repeat(4,1fr)','<meta name="robots" content="noindex,nofollow">','<title>【テスト版】','property="og:title" content="【テスト版】','checker-data/'+id+'-test.js?v=20261102-test','CheckerEngine.mount(CheckerConfigs["'+id+'-test"]);','テスト版です。記録は本番と別に保存されます。'])assert.ok(html.includes(t),t);
   assert.ok(html.includes('rel="canonical" href="https://slot-tools.jp/'+id+'-test-checker.html"'));assert.ok(html.includes('property="og:url" content="https://slot-tools.jp/'+id+'-test-checker.html"'));
   assert.equal(html.match(/checker-engine.js\?v=[^"]+/)[0],original.match(/checker-engine.js\?v=[^"]+/)[0]);
   const reverted=html.replace('<meta name="robots" content="noindex,nofollow">\n','').replaceAll('【テスト版】','').replaceAll('https://slot-tools.jp/'+id+'-test-checker.html','https://slot-tools.jp/'+id+'-checker.html').replace(/<div style="flex:none;[^\n]+テスト版です。[^\n]+\n/,'').replace('repeat(4,1fr)','repeat(3,1fr)').replace('<button data-p="1">示唆</button><button data-p="2">参照</button><button data-p="3">カード</button>','<button data-p="1">参照</button><button data-p="2">カード</button>').replace('checker-data/'+id+'-test.js?v=20261102-test',original.match(new RegExp('checker-data/'+id+'\\.js\\?v=[^" ]+'))[0]).replace('CheckerConfigs["'+id+'-test"]','CheckerConfigs.'+id);assert.equal(reverted,original);
   const tmp=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'ggovivy-syntax-'));
   for(const p of [id+'-test-checker.html','checker-data/'+id+'-test.js']){const src=read(p);assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);assert.doesNotMatch(src,/濃厚示唆|最強|設定差なし/);if(p.endsWith('.js'))execFileSync(process.execPath,['--check',path.join(root,p)]);else for(const [i,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,id+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}}
 });
}
check('production 6 and protected 4 files byte-identical to HEAD / no incoming links',()=>{
 for(const p of ['ggo-checker.html','ggo-guide.html','checker-data/ggo.js','vivy-checker.html','vivy-guide.html','checker-data/vivy.js','checker-engine.js','checkers.html','index.html','sitemap.xml'])assert.deepEqual(fs.readFileSync(path.join(root,p)),execFileSync('git',['show','HEAD:'+p],{cwd:root}),p);
 for(const p of fs.readdirSync(root).filter(p=>p.endsWith('.html')&&!p.endsWith('-test-checker.html')))assert.doesNotMatch(read(p),/(?:href|src)=["'][^"']*(?:ggo|vivy)-test/);
});
console.log('ggovivy-test: '+checks+' passed / 0 failed');

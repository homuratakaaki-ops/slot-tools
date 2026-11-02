// node tests/ggovivy-suggest.verify.mjs — GGO・Vivy 示唆（本番、§9-108-2 で 65de568 のテスト版から反映）。
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
// 反映前の本番（テスト版 65de568 の時点の main）。GGO のカード本体と既存データの互換を比べる。
const BEFORE=p=>execFileSync('git',['show','65de568:'+p],{cwd:root,encoding:'utf8'});
function loadSrc(src){const box={window:{}};vm.createContext(box);vm.runInContext(src,box);return box.window;}
const ctx=S=>({S,pct:(v,d)=>d>0?v+'/'+d+' '+(100*v/d).toFixed(0)+'%':v+'/0 —',crow:(key,label,sub,hot,pct)=>{const [g,k]=key.split('.');return JSON.stringify([key,label,sub,hot,pct?pct(S[g][k]):null]);}});
for(const [id,groups] of Object.entries(EXPECTED)){
 const w=load(id,true),c=w.CheckerConfigs[id],fresh=()=>c.normalizeState(clone(c.defaults));
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
   else {const original=loadSrc(BEFORE('checker-data/ggo.js')).CheckerConfigs.ggo;for(const key of ['blocks','bottom','chart','metaText'])assert.deepEqual(clone(c.card[key](cx,'date')),clone(original.card[key](cx,'date')));for(const key of Object.keys(original.card).filter(k=>typeof original.card[k]!=='function'))assert.deepEqual(c.card[key],original.card[key]);assert.ok(!c.template(cx).includes('確定演出'));}
 });
 check(id+' normalization / integers / unknown keys kept (§9-108-4) / idempotence',()=>{
   for(const g of c.mergeKeys){assert.ok(Object.values(c.defaults[g]).every(v=>v===0));for(const k of Object.keys(c.defaults[g]))for(const [value,want] of [[-1,0],[NaN,0],[Infinity,0],['bad',0],[null,0],['2.9',2]]){const S=fresh();S[g][k]=value;S[g].unknown=5;c.normalizeState(S);assert.equal(S[g][k],want);assert.equal(S[g].unknown,5,'知らない項目は捨てずに保持');assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));}}
 });
 check(id+' existing production data (non-zero, pre-release shape) keeps every value and gains new items as 0',()=>{
   // 反映前の本番JS（65de568）が保存する形そのもの：0以外の値・画像・知らない項目入り。
   const before=loadSrc(BEFORE('checker-data/'+id+'.js')).CheckerConfigs[id];
   const raw={gameLog:[312,688,1500],games:7,counts:Object.fromEntries(Object.keys(before.defaults.counts).map((k,i)=>[k,i+3])),img:'data:image/png;base64,AAAA',iconChoice:'mine',futureRoot:'keep'};
   raw.counts.future=9;
   const saved=clone(before.normalizeState(clone(raw)));
   const out=c.normalizeState(clone(saved));
   for(const [k,v] of Object.entries(saved))if(!c.mergeKeys.includes(k))assert.deepEqual(out[k],v,k+' は変わらない');
   for(const [k,v] of Object.entries(saved.counts))assert.equal(out.counts[k],v,'counts.'+k+' は変わらない');
   for(const g of Object.keys(groups))assert.deepEqual(clone(out[g]),clone(c.defaults[g]),g+' は0で追加');
   assert.deepEqual(Object.keys(out).sort(),[...new Set([...Object.keys(saved),...c.mergeKeys])].sort());
   assert.deepEqual(clone(c.normalizeState(clone(out))),clone(out),'冪等');
   assert.equal(c.storageKey,before.storageKey,'保存キーは本番のまま');
 });
 check(id+' production HTML / guide / syntax / LF',()=>{
   assert.equal(c.storageKey,id+'-checker-v1');assert.equal(c.pages(ctx(fresh()),()=>'').length,4);assert.ok(!c.pages(ctx(fresh()),()=>'')[0]().includes('調査中'));
   const html=read(id+'-checker.html'),old=BEFORE(id+'-checker.html');
   assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','参照','カード']);
   for(const t of ['repeat(4,1fr)','checker-data/'+id+'.js?v=20261102-suggest','CheckerEngine.mount(CheckerConfigs.'+id+');'])assert.ok(html.includes(t),t);
   assert.ok(!html.includes('name="robots"')&&!html.includes('テスト版'));
   // 反映前の本番 HTML との差は、タブ4つ・grid・?v の3か所だけ。
   // PR #85（エンジンの見出し取り残し修正）で engine の ?v だけ変わる。
   const reverted=html.replace('checker-engine.js?v=20261102-orphan','checker-engine.js?v=20260924').replace('repeat(4,1fr)','repeat(3,1fr)').replace('<button data-p="1">示唆</button><button data-p="2">参照</button><button data-p="3">カード</button>','<button data-p="1">参照</button><button data-p="2">カード</button>').replace('checker-data/'+id+'.js?v=20261102-suggest',old.match(new RegExp('checker-data/'+id+'\\.js\\?v=[^" ]+'))[0]);assert.equal(reverted,old);
   const guide=read(id+'-guide.html');
   assert.ok(guide.includes('<h2>示唆タブ</h2>')&&guide.includes('「入力」「示唆」「参照」「カード」')&&guide.includes('2026年11月2日確認'));assert.ok(!guide.includes('設定示唆（終了画面・トロフィーなど）は出典で調査中'));
   for(const h of Object.values(HINTS).filter((h,i)=>Object.keys(HINTS)[i] in groups))assert.ok(guide.includes(h),h);
   const tmp=fs.mkdtempSync(path.join(process.env.CHECKER_ARTIFACTS||os.tmpdir(),'ggovivy-syntax-'));
   for(const p of [id+'-checker.html',id+'-guide.html','checker-data/'+id+'.js']){const src=read(p);assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);assert.doesNotMatch(src,/濃厚示唆|最強|設定差なし/);if(p.endsWith('.js'))execFileSync(process.execPath,['--check',path.join(root,p)]);else for(const [i,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,id+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}}
 });
}
check('test version removed (§9-108-2) / NEW欄 2 lines / no links to -test',()=>{
 // 11/2 に Vivy のなな様テンプレ対応で別のテスト版（vivy-test、?v=20261102-nana-test）を作り直した。示唆タブのテスト版（?v=20261102-test）が残っていないことだけを見る。
 for(const p of ['ggo-test-checker.html','checker-data/ggo-test.js'])assert.ok(!fs.existsSync(path.join(root,p)),p+' は削除');
 if(fs.existsSync(path.join(root,'vivy-test-checker.html')))assert.ok(!read('vivy-test-checker.html').includes('20261102-test"'),'示唆タブのテスト版は削除');
 for(const p of fs.readdirSync(root).filter(p=>p.endsWith('.html')&&p!=='vivy-test-checker.html'))assert.doesNotMatch(read(p),/(?:href|src)=["'][^"']*(?:ggo|vivy)-test/);
 const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
 assert.equal((news.match(/<p>/g)||[]).length,8);
 const ps=news.match(/<p>.*<\/p>/g);
 assert.equal(ps[0],'<p>11/2｜<a href="ggo-checker.html">GGO ボーナス終了画面のカードの記録を追加</a></p>');
 assert.equal(ps[1],'<p>11/2｜<a href="vivy-checker.html">Vivy コパンダトロフィー・獲得枚数表示・エンディング中キャラ・AT終了画面を追加</a></p>');
});
console.log('ggovivy-suggest: '+checks+' passed / 0 failed');

// node tests/mogumogu-1021.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=src=>{const b={window:{}};vm.runInNewContext(src,b);return b.window.CheckerConfigs.mogumogu;};
const c=load(read('checker-data/mogumogu.js'));
const clone=x=>JSON.parse(JSON.stringify(x)),state=()=>clone(c.defaults);
const rows=(S,page)=>{const rows=[];return {html:c.pages({S,crow:(...a)=>{rows.push(a);return a[1];},pct:()=>''},()=>'')[page](),rows};};
let checks=0;function check(name,fn){fn();console.log('PASS '+(++checks)+': '+name);}
check('scroll labels, hints, rank/hot, no percentage, section order',()=>{
  const box={window:{}};vm.runInNewContext(read('checker-data/mogumogu.js').replace('  const DEF={','  window.__scroll=SCROLL;\n  const DEF={'),box);
  assert.deepEqual(clone(box.window.__scroll),[['blue','青巻物','デフォルト',0,'青'],['yellow','黄巻物','高設定期待度UP(弱)',0,'黄'],['green','緑巻物','高設定期待度UP(強)',0,'緑'],['red','赤巻物','設定2以上濃厚',2,'赤'],['rainbow','虹巻物','設定6濃厚',6,'虹']]);
  const r=rows(state(),1),scroll=r.rows.filter(a=>a[0].startsWith('scroll.'));
  assert.deepEqual(scroll,[['scroll.blue','青巻物','デフォルト',false],['scroll.yellow','黄巻物','高設定期待度UP(弱)',false],['scroll.green','緑巻物','高設定期待度UP(強)',false],['scroll.red','赤巻物','設定2以上濃厚',true],['scroll.rainbow','虹巻物','設定6濃厚',true]]);
  const names=['くまトロフィー','エンディング中の巻物','解析待ちの示唆'];const pos=names.map(n=>r.html.indexOf(n));assert.ok(pos[0]>=0&&pos[0]<pos[1]&&pos[1]<pos[2]);
  assert.ok(!r.html.includes('エンディング中の1枚絵'));assert.ok(r.html.includes('巻物<span class="sub">計0回'));
  for(const [key,tier] of [['red','2以上'],['rainbow','6濃厚']]){const S=state();S.scroll[key]=1;assert.ok(c.card.bottom({S}).columns[0].items[0].text.includes('('+tier+')'));}
  for(const key of ['blue','yellow','green']){const S=state();S.scroll[key]=3;assert.equal(c.card.blocks({S})[3][1],'計0回');}
});
check('certCount, bestCert and equal-rank priority',()=>{
  const S=state();Object.assign(S.scroll,{red:2,rainbow:1,blue:3});
  assert.equal(c.card.blocks({S})[3][1],'計3回');assert.equal(c.card.chart({S}).items[3].value,3);
  assert.equal(c.card.bottom({S}).columns[0].items[0].text,'確定 虹巻物(6濃厚) ×1');
  S.screens.zenin=1;assert.ok(c.card.bottom({S}).columns[0].items[0].text.includes('虹巻物'));
  S.trophy.rainbow=1;assert.ok(c.card.bottom({S}).columns[0].items[0].text.includes('虹トロフィー'));
});
check('CZ row order, exact subs, no rate/percentage callback or aggregate changes',()=>{
  const S=state();S.games=3000;S.counts.cz=7;S.czType.taisen=3;S.czType.mogura=2;
  const r=rows(S,0).rows;assert.deepEqual(r.map(a=>a[0]),['counts.cz','czType.taisen','czType.mogura','counts.at','counts.direct']);
  assert.deepEqual(r.slice(1,3),[['czType.taisen','モグモグ大戦','設1:1/354⇔設6:1/324',0],['czType.mogura','モグラ叩き','設1:1/3778⇔設6:1/2507',0]]);
  c.normalizeState(S);assert.equal(S.counts.cz,7);assert.equal(c.card.chart({S}).items[0].value,7);
});
check('legacy missing/null/invalid fields and unknown keys',()=>{
  for(const value of [undefined,null]){const S=c.normalizeState({scroll:value,czType:value});assert.deepEqual(clone(S.scroll),state().scroll);assert.deepEqual(clone(S.czType),state().czType);}
  const S=c.normalizeState({scroll:{blue:-1,yellow:'bad',green:'3',red:null,rainbow:2,future:7},czType:{taisen:'4',mogura:-9,future:8},future:{keep:true}});
  assert.deepEqual(clone(S.scroll),{blue:0,yellow:0,green:3,red:0,rainbow:2,future:7});assert.deepEqual(clone(S.czType),{taisen:4,mogura:0,future:8});assert.deepEqual(S.future,{keep:true});
  for(const key of ['scroll','czType'])assert.ok(c.mergeKeys.includes(key));
});
check('normalization idempotence',()=>{
  for(const S of [{},{scroll:null,czType:null},{scroll:{blue:'3',future:5},czType:{taisen:-4,mogura:'bad'}},state()]){const once=clone(c.normalizeState(S));assert.deepEqual(clone(c.normalizeState(clone(once))),once);}
});
check('template and detail, zero omission, bottom fallback required by spec',()=>{
  const S=state();Object.assign(S.scroll,{blue:3,red:2,rainbow:1});S.czType.taisen=2;
  const t=c.template({S});assert.ok(t.includes('CZ当選▶0回\nCZ内訳 モグモグ大戦▶2回\nCZ内訳 モグラ叩き▶0回\nAT初当り'));
  assert.ok(t.includes('■エンディング中の巻物\n青巻物▶3回\n赤巻物(2以上)▶2回\n虹巻物(6濃厚)▶1回'));assert.ok(!t.includes('%'));assert.equal(c.compactTemplate({S}),t);
  assert.ok(!c.template({S:state()}).includes('CZ内訳'));
  S.trophy.bronze=1;const withTrophy=c.template({S});assert.ok(withTrophy.indexOf('■くまトロフィー')<withTrophy.indexOf('■エンディング中の巻物'));
  const d=clone(c.card.detail({S}));assert.deepEqual(d.map(x=>x.title),['初当り','AT終了画面','くまトロフィー','エンディング中の巻物']);assert.deepEqual(d[0].items.slice(0,4).map(x=>x.label),['CZ当選','モグモグ大戦','モグラ叩き','AT初当り']);assert.equal(d[3].items[3].value,2);assert.equal(d[3].denominator,undefined);
  // 指示書2(f): 右列は4行だったので巻物は5行目に入る。CZ内訳は6行目（y=980）でフッターy=976に重なるため追加しない。
  const b=c.card.bottom({S});assert.equal(b.startY+5*b.rowGap,980);assert.deepEqual(clone(b.columns.map(x=>x.items.length)),[5,5]);
  assert.equal(b.columns[1].items[4].text,'巻物 青×3・赤×2・虹×1');assert.equal(b.columns[1].items[4].value,6);
  assert.equal(c.card.bottom({S:state()}).columns[1].items[4].text,'巻物 —');
});
check('guide values, metadata, NEW 8 rows and cache query',()=>{
  const g=read('mogumogu-guide.html');for(const n of [354,349,341,331,330,324,3778,3477,3359,3101,2510,2507])assert.ok(g.includes('1/'+n));
  [[354,3778,324],[349,3477,317],[341,3359,310],[331,3101,299],[330,2510,292],[324,2507,287]].forEach((r,i)=>assert.ok(g.includes(`<tr><td>設定${i+1}</td>${r.map(n=>`<td>1/${n}</td>`).join('')}</tr>`)));
  for(const n of ['青巻物','黄巻物','緑巻物','赤巻物','虹巻物'])assert.ok(g.includes(n));assert.ok(!g.includes('エンディング中の1枚絵'));
  for(const m of g.matchAll(/<meta (?:name="description"|property="og:description") content="([^"]+)"/g)){assert.ok(m[1].includes('巻物')&&m[1].includes('CZ内訳'));}
  assert.ok(read('mogumogu-checker.html').includes('checker-data/mogumogu.js?v=20261021'));
  const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];const links=[...news.matchAll(/<p>[^\n]+<\/p>/g)];assert.equal(links.length,8);assert.ok(links[0][0].includes('mogumogu-checker.html'));
});
check('existing outputs unchanged except specified additions',()=>{
  const base=load(execFileSync('git',['show','4e98820:checker-data/mogumogu.js'],{encoding:'utf8'}));const S=state();S.counts.cz=4;S.screens.kerai=3;S.trophy.gold=1;
  assert.equal(c.template({S}),base.template({S}));for(const k of ['blocks','chart'])assert.deepEqual(clone(c.card[k]({S})),clone(base.card[k]({S})));
  const bot=clone(c.card.bottom({S}));bot.columns[1].items.pop();assert.deepEqual(bot,clone(base.card.bottom({S})));
  const d=clone(c.card.detail({S}));d.pop();d[0].items.splice(1,2);assert.deepEqual(d,clone(base.card.detail({S})));
  const html=read('mogumogu-checker.html'),old=execFileSync('git',['show','4e98820:mogumogu-checker.html'],{encoding:'utf8'});assert.equal(html.match(/checker-engine.js\?v=[^"]+/)[0],old.match(/checker-engine.js\?v=[^"]+/)[0]);
});
console.log(`PASS ${checks} verification groups`);

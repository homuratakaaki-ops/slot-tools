import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const box={window:{}};
vm.runInNewContext(read('checker-data/tonski.js'),box);
const c=box.window.CheckerConfigs.tonski;
const clone=x=>JSON.parse(JSON.stringify(x));
const state=()=>clone(c.defaults);
const html=(S,mode=1)=>c.pages({S,mode,crow:(key,name,sub)=>`<div data-c="${key}">${name} ${sub}</div>`},()=>'')[0]();
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
check('row position, labels, reference CSS, hint and attributes',()=>{
  const h=html(state());
  assert.match(h,/data-c="cz.bonus"[^]*?<\/div>\s*<div class="crow cycle-row has-row-sub">/);
  assert.ok(h.includes('333G到達時の女神の舞'));
  assert.ok(h.includes('設1:30.1%</span><wbr><span class="sub-chunk">⇔設6:44.9%'));
  assert.ok(h.includes('data-bump-many="rates.megami333r,rates.megami333w"'));
  assert.ok(h.includes('data-bump="rates.megami333r"'));
  assert.ok(h.includes('規定333Gに到達したとき、女神の舞へ移行したら当選、しなければハズレで記録します。777G到達時は全設定100%なので記録しません。'));
  const rico=read('checker-data/ricorico.js');
  // 名前を1段目に全幅で出す3行だけは ricorico と違う（360pxで名前が1文字ずつ折り返すため。夢爽 10/21 決定）。
  const nameTop=['      .cycle-row{flex-wrap:wrap;row-gap:4px}','      .cycle-row .ct{flex:0 0 100%;min-width:0}','      .cycle-actions{display:flex;gap:6px;margin-left:auto;flex:none}'];
  for(const line of nameTop)assert.ok(h.includes(line),line);
  for(const line of h.split('\n').filter(l=>(l.trim().startsWith('.cycle')||l.trim().startsWith('.minus .cycle'))&&!nameTop.includes(l)))assert.ok(rico.includes(line),line);
});
check('win/miss attributes yield 4/10 40%; minus boundary',()=>{
  const S=state();
  const bump=attr=>{for(const key of attr.split(',')){const [group,k]=key.split('.');S[group][k]++;}};
  for(let i=0;i<4;i++)bump(html(S).match(/data-bump-many="([^"]+)"/)[1]);
  for(let i=0;i<6;i++)bump(html(S).match(/data-bump="([^"]+)"/)[1]);
  assert.deepEqual(S.rates,{megami333r:10,megami333w:4});
  assert.ok(html(S).includes('4/10 40%'));
  assert.ok(html(S,-1).includes('data-bump="rates.megami333r"'));
  S.rates.megami333r=4;
  assert.ok(html(S,-1).includes('disabled aria-disabled="true"'));
  assert.ok(!html(S,-1).includes('data-bump="rates.megami333r"'));
  assert.ok(html(S,1).includes('data-bump="rates.megami333r"'));
  assert.ok(html(state(),-1).includes('disabled aria-disabled="true"'));
});
check('legacy, invalid, unknown keys and idempotence',()=>{
  assert.ok(c.mergeKeys.includes('rates'));
  for(const rates of [undefined,null,[],false,'broken',{}, {megami333r:-1,megami333w:'bad'}, {megami333r:Infinity,megami333w:NaN}, {megami333r:true,megami333w:{}}]){
    const input={games:123,cz:{cz:2},future:{keep:7},rates};
    const out=c.normalizeState(input);
    assert.deepEqual(clone(out.rates),{megami333r:0,megami333w:0});
    assert.equal(out.games,123);assert.equal(out.cz.cz,2);assert.equal(out.future.keep,7);
    assert.deepEqual(clone(c.normalizeState(out)),clone(out));
  }
  const src={rates:{megami333r:'10',megami333w:20,future:{keep:1}}};
  const out=c.normalizeState(src);
  assert.deepEqual(clone(out.rates),{megami333r:10,megami333w:10,future:{keep:1}});
  assert.equal(src.rates.megami333w,20);
  assert.deepEqual(clone(c.normalizeState(out)),clone(out));
});
check('template and detail; summary omitted under specification exception',()=>{
  const S=state();S.rates={megami333r:10,megami333w:4};
  assert.ok(c.template({S}).includes('333G女神の舞▶4/10（40%）'));
  assert.ok(!c.template({S:state()}).includes('333G女神の舞'));
  assert.equal(c.compactTemplate({S}),c.template({S}));
  const item=c.card.detail({S})[0].items.find(i=>i.label==='333G到達時の女神の舞');
  assert.equal(item.text,'333G到達時の女神の舞 4/10 40%');
  S.rates.megami333w=0;
  assert.ok(c.card.detail({S})[0].items.find(i=>i.label===item.label).value>0,'0 wins must still show denominator');
  const bottom=c.card.bottom({S});
  assert.deepEqual(clone(bottom.columns.map(col=>col.items.length)),[5,5]);
  assert.equal(bottom.startY+5*bottom.rowGap,980,'sixth row would overlap footer at y=976');
});
check('guide, version and NEW list',()=>{
  const guide=read('tonski-guide.html');
  for(const v of ['30.1','31.6','33.2','34.8','39.1','44.9'])assert.ok(guide.includes('<td>'+v+'%</td>'));
  assert.ok(guide.includes('CZ前兆と重複'));assert.ok(guide.includes('777G到達時は全設定100%'));
  assert.ok(read('tonski-checker.html').includes('checker-data/tonski.js?v=20261021'));
  const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</div>')[0];
  assert.equal((news.match(/<p>/g)||[]).length,8);
  assert.ok(news.indexOf('tonski-checker.html')<news.indexOf('tenten-checker.html'));
});
check('32768 certainty combinations preserve existing outputs against 4e98820 (main before this change)',()=>{
  const oldBox={window:{}};
  vm.runInNewContext(execFileSync('git',['show','4e98820:checker-data/tonski.js'],{encoding:'utf8'}),oldBox);
  const old=oldBox.window.CheckerConfigs.tonski;
  const keys=[...['set2','set4','set6'].map(k=>['screens',k]),...Object.keys(c.defaults.coins).map(k=>['coins',k]),...Object.keys(c.defaults.atcz).map(k=>['atcz',k]),...['goldWin','rainbowWin'].map(k=>['ed',k])];
  for(let mask=0;mask<2**keys.length;mask++){
    const S=state();S.games=1000;keys.forEach(([g,k],i)=>S[g][k]=(mask>>i)&1);
    assert.equal(c.template({S}),old.template({S}));
    assert.equal(JSON.stringify(c.card.bottom({S})),JSON.stringify(old.card.bottom({S})));
    const detail=clone(c.card.detail({S}));detail[0].items=detail[0].items.filter(i=>i.label!=='333G到達時の女神の舞');
    assert.equal(JSON.stringify(detail),JSON.stringify(old.card.detail({S})));
  }
});
console.log(`PASS ${checks} verification groups`);

// Explicit release audit: node tests/paripi-st-end.verify.mjs [--browser]
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const baseline=p=>execFileSync('git',['-c','safe.directory='+root.replaceAll('\\','/'),'show','c914173:'+p],{encoding:'utf8'});
const clone=x=>JSON.parse(JSON.stringify(x));
const config=source=>{const box={window:{}};vm.runInNewContext(source,box);return box.window.CheckerConfigs.paripi;};
const source=read('checker-data/paripi.js'),c=config(source),old=config(baseline('checker-data/paripi.js'));
const state=()=>clone(c.defaults);
// Independent expected facts: issued specification §1, not parsed from the implementation.
const defs=[
  ['kanban','看板','デフォルト',0,'①'],['blue','青背景','デフォルト',0,'②'],['yellow','黄背景','デフォルト',0,'③'],
  ['even1','偶数設定期待度UP・弱','偶数設定期待度UP・弱',0,'④'],['even2','偶数設定期待度UP・強','偶数設定期待度UP・強',0,'⑤'],
  ['high1','高設定期待度UP・弱','高設定期待度UP・弱',0,'⑥'],['high2','高設定期待度UP・強','高設定期待度UP・強',0,'⑦'],
  ['s2','設定2以上濃厚','設定2以上濃厚',2,'⑧'],['s3','設定3以上濃厚','設定3以上濃厚',3,'⑨'],
  ['s4','設定4以上濃厚','設定4以上濃厚',4,'⑩'],['s5','設定5以上濃厚','設定5以上濃厚',5,'⑪'],['s6','設定6濃厚','設定6濃厚',6,'⑫']
];
const context=(S,rows=[])=>({S,pct:(n,d)=>`${n}/${d}`,crow:(key,label,sub,hot,pct)=>{rows.push({key,label,sub,hot,ratio:pct?.(S[key.split('.')[0]][key.split('.')[1]])});return `<button>${label}</button><small>${sub}</small>`;}});
const guide=read('paripi-guide.html'),rows=[],html=c.pages(context(state(),rows),()=> '')[1]();
assert.equal(rows.length,12);
for(const [i,[key,label,hint,rank,image]] of defs.entries()){
  const sub=(rank===0&&i<3?'デフォルト・':'')+'画像'+image;
  assert.deepEqual(rows[i],{key:'stEnd.'+key,label,sub,hot:rank>0,ratio:'0/0'});
  assert.equal(html.split(`<button>${label}</button>`).length-1,1);
  assert.equal(html.split('画像'+image).length-1,1);
  assert.ok(guide.includes(`<td>${label}</td><td>${hint}</td><td>画像${image}</td>`));
}
assert.equal(c.pages(context(state()),()=> '').length,3);
assert.equal(html.split('class="hint"').length-1,1);
assert.equal(html.split('画像番号はちょんぼりすたの掲載順です。').length-1,1);
for(const row of rows)assert.doesNotMatch(row.sub,/ちょんぼりすた/);
console.log('PASS source match: all 12 labels, hints and image numbers; 5 hot / 7 neutral');
const rawDefs=vm.runInNewContext(source.match(/const ST_END=\[[\s\S]*?\];/)[0]+'ST_END');
assert.deepEqual(clone(rawDefs.map(r=>r[3])),defs.map(r=>r[3]));
// Perturb labels to misleading numbers. Selection must still follow numeric rank.
const renamed=source.replace(/const ST_END=\[[\s\S]*?\];/,()=> 'const ST_END='+JSON.stringify(rawDefs.map((r,i)=>[r[0],i<7?'設定999以上濃厚'+i:'数字なし'+i,...r.slice(2)]))+';');
const numeric=config(renamed);
for(let mask=0;mask<4096;mask++){
  const S=state();defs.forEach((r,i)=>{S.stEnd[r[0]]=(mask>>i)&1;});
  const best=defs.filter(r=>r[3]>0&&S.stEnd[r[0]]).at(-1),bottom=c.card.bottom({S});
  assert.equal(bottom.columns[0].items[0].text,best?`確定 ${best[1]} ×1`:'確定演出 なし','mask '+mask);
  assert.equal(numeric.card.bottom({S}).columns[0].items[0].text,best?`確定 数字なし${defs.indexOf(best)} ×1`:'確定演出 なし');
  assert.deepEqual(clone(bottom.columns.map(col=>col.items.length)),[5,3]);
  assert.equal(bottom.startY+bottom.rowGap*(Math.max(...bottom.columns.map(col=>col.items.length))-1),896);
  assert.ok(896<=936);
}
console.log('PASS 4096 combinations: numeric rank, first line, 5+3 rows / lastY 896; misleading-label mutation');
const S=state();S.stEnd.kanban=1;S.stEnd.s4=2;S.stEnd.future=100;S.counts.cz=2;
const pctRows=[];c.pages(context(S,pctRows),()=> '')[1]();
assert.ok(pctRows.every(r=>r.ratio.endsWith('/3')));
const detail=c.card.detail({S})[1];assert.equal(detail.denominator,3);assert.equal(detail.percent,true);assert.equal(detail.items.length,12);
assert.equal(detail.items.reduce((a,r)=>a+r.value,0),3);
assert.ok(c.template({S}).includes('看板▶1回(33%)'));assert.ok(c.template({S}).includes('設定4以上濃厚▶2回(67%)'));
assert.ok(!c.template({S}).includes('青背景▶'));assert.ok(!c.template({S:state()}).includes('■ST終了画面'));
assert.equal(c.template({S}).split('\n')[1],old.template({S}).split('\n')[1]);
for(const output of [c.template({S}),JSON.stringify(c.card.blocks({S})),JSON.stringify(c.card.chart({S})),JSON.stringify(c.card.bottom({S})),JSON.stringify(c.card.detail({S}))])assert.doesNotMatch(output,/1\/|NaN|Infinity/);
const legacy=c.normalizeState({games:1000,counts:{cz:3,bonus:2},future:{keep:true}});
assert.deepEqual(clone(legacy.stEnd),clone(c.defaults.stEnd));assert.equal(legacy.counts.cz,3);assert.equal(legacy.games,1000);assert.equal(legacy.future.keep,true);
const invalid=c.normalizeState({games:-1,counts:{cz:-2,future:8},stEnd:{kanban:-3,s4:'2',future:9},future:{keep:true}});
assert.equal(invalid.games,0);assert.equal(invalid.counts.cz,0);assert.equal(invalid.counts.future,8);assert.equal(invalid.stEnd.kanban,0);assert.equal(invalid.stEnd.s4,2);assert.equal(invalid.stEnd.future,9);assert.equal(invalid.future.keep,true);
assert.deepEqual(clone(c.normalizeState(clone(invalid))),clone(invalid));assert.deepEqual(clone(c.mergeKeys),['counts','stEnd']);
console.log('PASS percentages share known-key total; zero games; template omission/header; legacy/unknown/negative/idempotent state');
const checker=read('paripi-checker.html'),style=s=>s.match(/<style>([\s\S]*?)<\/style>/)[1];
assert.doesNotMatch(checker,/noindex/);assert.ok(checker.includes('href="paripi-guide.html">使い方</a>'));
assert.ok(checker.includes('checker-data/paripi.js?v=20261005-2"'));assert.ok(checker.includes('checker-engine.js?v=20260924'));
assert.equal(style(checker),style(read('mogumogu-checker.html')));
const list=read('checkers.html').split('<div class="section-label">スマスロ・AT機</div>')[1];
assert.equal(list.match(/class="checker-main" href="([^"]+)/)[1],'paripi-checker.html');
assert.ok(list.includes('href="paripi-guide.html">使い方</a>'));
const map=read('sitemap.xml');for(const kind of ['checker','guide']){const marker=`<loc>https://slot-tools.jp/paripi-${kind}.html</loc>\n    <lastmod>2026-10-05</lastmod>`;assert.equal(map.split(marker).length-1,1);assert.ok(map.indexOf(marker)<map.indexOf('<loc>https://slot-tools.jp/counter-howto.html'));}
const newsSection=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
const [beforeNews,news]=newsSection.split('<section class="info-block">');
assert.doesNotMatch(beforeNews,/<p\b/i,'NEW rows must not precede info-block');
assert.equal(typeof news,'string','NEW info-block must exist');
assert.equal((news.match(/<p>/g)||[]).length,8);assert.equal(news.match(/<p>(.*?)<\/p>/)[1],'10/5｜<a href="paripi-checker.html">パリピ孔明 設定判別カウンターを公開</a>');
assert.equal(style(guide),style(read('tonski-guide.html')));
assert.ok(guide.includes('rel="canonical" href="https://slot-tools.jp/paripi-guide.html"'));assert.ok(guide.includes('property="og:url" content="https://slot-tools.jp/paripi-guide.html"'));assert.ok(guide.includes('property="og:type" content="article"'));
assert.ok(guide.match(/<title>(.*?)<\/title>/)[1].startsWith(guide.match(/<h1>(.*?)<\/h1>/)[1]));
assert.doesNotMatch(guide,/濃厚示唆|最強|6確定|設定[○0-9０-９・]*(?:以上)?確定演出|ベイズ|事後確率/);
assert.ok(guide.includes('href="paripi-checker.html" style="margin-left:8px;">ツールを使う →'));
assert.ok(guide.includes('href="https://chonborista.com/slot/yamasa-slot/263531/#ST" target="_blank" rel="noopener"'));
const template=read('tonski-guide.html');assert.equal(guide.match(/<!-- Google tag[\s\S]*?<\/head>/)[0],template.match(/<!-- Google tag[\s\S]*?<\/head>/)[0]);assert.equal(guide.split('<footer>')[1],template.split('<footer>')[1]);
for(const [i,cz] of ['213.6','207.3','199.2','188.8','179.4','171.7'].entries())assert.ok(guide.includes(`<td>設定${i+1}</td><td>1/${cz}</td><td>1/${['309.9','299.6','280.0','262.0','243.9','228.8'][i]}</td>`));
console.log('PASS public routes, NEW 8, version, reciprocal links, guide CSS/meta/facts/wording/template shell');
for(const g of [0,1000])for(const v of [0,1,99]){
  const S=state();S.games=g;S.counts.cz=v;S.counts.bonus=v+1;
  assert.equal(c.pages(context(S),()=> '')[0](),old.pages(context(S),()=> '')[0]());
  for(const key of ['blocks','chart'])assert.equal(JSON.stringify(c.card[key]({S})),JSON.stringify(old.card[key]({S})));
}
for(const key of ['blocks','chart'])assert.equal(c.card[key].toString(),old.card[key].toString());
for(const name of ['gameSection','initialSection','pageInput'])assert.equal(source.match(new RegExp('  function '+name+'\\([^]*?(?=\\n  (?:function|const))'))[0],baseline('checker-data/paripi.js').match(new RegExp('  function '+name+'\\([^]*?(?=\\n  (?:function|const))'))[0]);
// toaru2.js は獲得枚数表示の誤った説明文を削除したため除外。
for(const p of ['checker-engine.js','checker-bayes.js',...fs.readdirSync(path.join(root,'checker-data')).filter(f=>f.endsWith('.js')&&!['paripi.js','toaru2.js'].includes(f)).map(f=>'checker-data/'+f)])assert.equal(read(p),baseline(p),p+' unchanged');
for(const p of ['checker-data/paripi.js','paripi-checker.html','paripi-guide.html','checkers.html','sitemap.xml','index.html','docs/ARCHITECTURE.md','tests/paripi-st-end.verify.mjs','tests/new-1005-four-machines.test.mjs','tests/new-1005-public.verify.mjs','tests/new-1005-four-machines.browser.mjs'])assert.ok(!read(p).includes('\r'),p+' LF');
console.log('PASS input HTML / blocks / chart bytes vs c914173; common files and all other machine data unchanged; LF');

if(process.argv.includes('--browser')){
  // Reuse only the existing CDP harness. The acceptance steps below are paripi-specific.
  const harness=read('tests/new-1005-four-machines.browser.mjs');
  const prefix=harness.split("  for(const id of ['juuou','paripi','tenten','mhsunbreak']){")[0].replace("const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');",'const root='+JSON.stringify(root)+';');
  const suffix=harness.slice(harness.indexOf('}catch(e){results.push'));
  const steps=String.raw`
  const defs=__DEFS__;
  await clear('paripi');await tab(1);
  for(const [key,label] of defs){
    await bump('stEnd.'+key);assert.equal((await state()).stEnd[key],1);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes(label));
    await click('#undoBtn');assert.equal((await state()).stEnd[key],0);
    await bump('stEnd.'+key);await click('#modeBtn');await bump('stEnd.'+key);
    assert.equal((await state()).stEnd[key],0);await click('#modeBtn');
  }
  await bump('stEnd.kanban');await tab(0);await games(1234);await bump('counts.cz');await click('#undoBtn');
  assert.equal((await state()).stEnd.kanban,1);assert.equal((await state()).games,1234);
  await load('paripi');assert.equal((await state()).stEnd.kanban,1);await tab(1);
  pass('paripi 12 inputs: feed / Undo / minus / independent input / saved reload');
  await clear('paripi');await frame('w.__gray=0;');
  for(let start=0;start<4096;start+=32){
    const output=await frame('const defs='+JSON.stringify(defs)+';const rows=[];for(let i='+start+';i<'+(start+32)+';i++){const gray=i^(i>>1),change=gray^w.__gray;if(change){const bit=Math.log2(change),minus=!(gray&change);d.querySelector("#nav [data-p=\\\"1\\\"]").click();if(minus)d.getElementById("modeBtn").click();d.querySelector("[data-c=\\\"stEnd."+defs[bit][0]+"\\\"] .plus").click();if(minus)d.getElementById("modeBtn").click();}d.querySelector("#nav [data-p=\\\"2\\\"]").click();const cv=d.getElementById("cardCanvas"),a=cv.getContext("2d").getImageData(70,730,490,30).data;let bright=0;for(let k=0;k<a.length;k+=4)if(a[k]+a[k+1]+a[k+2]>180)bright++;rows.push({mask:gray,text:w.__texts.cardCanvas.find(t=>t.x===70&&t.y===752)?.text,bright});w.__gray=gray;}return rows;');
    for(const r of output){const best=defs.filter((d,i)=>d[3]>0&&(r.mask&(1<<i))).at(-1);assert.equal(r.text,best?'確定 '+best[1]+' ×1':'確定演出 なし');assert.ok(r.bright>10);}
    if(start%512===0)console.log('PASS paripi browser combinations through '+(start+32));
  }
  pass('paripi 4096 combinations: production clicks, canvas first line and pixels');
  await clear('paripi');await tab(1);for(const [key] of defs)await bump('stEnd.'+key);
  await tab(0);await bump('counts.cz');await bump('counts.bonus');await tab(2);
  const card=await canvas('cardCanvas'),summary=card.text.filter(t=>[70,560].includes(t.x)&&t.y>=752&&t.y<=936);
  assert.equal(summary.length,8);assert.deepEqual(summary.filter(t=>t.x===70).map(t=>t.y),[752,788,824,860,896]);assert.deepEqual(summary.filter(t=>t.x===560).map(t=>t.y),[752,788,824]);
  assert.ok(summary.every(t=>t.right<=(t.x===70?560:1010)));assert.ok(card.bright>1000);saveCanvas('paripi-all-card',card);
  assert.ok(!card.text.some(t=>/1\/|NaN|Infinity/.test(t.text)));await click('#detailBtn');const detail=await canvas('detailCanvas');
  for(const [,label] of defs)assert.ok(detail.text.some(t=>t.text===label+' ×1 (8%)'),label);assert.ok(detail.bright>1000);saveCanvas('paripi-all-detail',detail);
  const tpl=await copy();for(const [,label] of defs)assert.ok(tpl.includes(label+'▶1回(8%)'));
  assert.ok(!/1\/|NaN|Infinity/.test(tpl));pass('paripi full summary 8 / lastY896 / full detail percentages / template / pixels',summary);
  await tab(1);await bump('stEnd.kanban');await bump('stEnd.kanban');
  assert.equal(await frame('return d.querySelector("[data-c=\\\"stEnd.kanban\\\"] .pct").textContent;'),'3/14 21%');
  await tab(2);await click('#detailBtn');assert.ok((await canvas('detailCanvas')).text.some(t=>t.text==='看板 ×3 (21%)'));assert.ok((await copy()).includes('看板▶3回(21%)'));
  pass('paripi unequal counts share denominator 14 on input/detail/template');
  for(const width of [360,390]){
    await load('paripi',width,530);
    for(let p=0;p<3;p++){await tab(p);await measure('paripi-'+width+'-tab'+p);const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,'paripi-'+width+'-tab'+p+'.png'),Buffer.from(shot.data,'base64'));}
    await tab(1);
    const labels=await frame('return {width:w.innerWidth,labels:[...d.querySelectorAll(".crow .lbl .nm,.crow .lbl .mn")].map(e=>{const range=d.createRange();range.selectNodeContents(e);return {kind:e.classList.contains("mn")?"mn":"nm",text:e.textContent,lineCount:range.getClientRects().length};})};');
    fs.writeFileSync(path.join(artifacts,'paripi-'+width+'-st-labels.json'),JSON.stringify(labels,null,2));
    assert.equal(labels.width,width);
    for(const kind of ['mn','nm']){
      const items=labels.labels.filter(e=>e.kind===kind);
      assert.equal(items.length,12,kind+' label count at '+width);
      for(const item of items)assert.equal(item.lineCount,1,width+' '+kind+' '+item.text);
    }
    for(const item of labels.labels.filter(e=>e.kind==='mn'))assert.doesNotMatch(item.text,/ちょんぼりすた/);
    pass('paripi all 12 sublabels and button labels single-line '+width,labels);
    const hint=await frame('const hints=d.querySelectorAll("#main .hint"),h=hints[0],fold=h.querySelector("details.hint-fold");return {count:hints.length,lead:[...h.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(""),tail:fold.querySelector(".hint-body").textContent,summary:fold.querySelector("summary").textContent,open:fold.open};');
    assert.deepEqual(hint,{count:1,lead:'ST終了時の画面を記録します。',tail:'画面の見分け方はガイドからちょんぼりすたの画像で確認できます。画像番号はちょんぼりすたの掲載順です。',summary:'説明を見る',open:false});
    assert.equal(hint.lead.length,15);assert.equal(hint.tail.length,50);
    assert.equal(hint.tail.split('画像番号はちょんぼりすたの掲載順です。').length-1,1);
    await click('#main .hint summary');
    assert.equal(await frame('return d.querySelector("#main .hint .hint-body").checkVisibility();'),true);
    await click('#main .hint summary');
    pass('paripi hint lead 15 / folded 50 / expand and collapse '+width,hint);
    assert.deepEqual(await frame('return w.__errors;'),[]);
    await click('.hd-link[href="paripi-guide.html"]');
    for(let i=0;i<100;i++){if(await frame('return w.location.pathname==="/paripi-guide.html"&&!!d.querySelector("main");').catch(()=>false))break;await pause(30);}
    const layout=await frame('return {width:w.innerWidth,scrollWidth:d.documentElement.scrollWidth,rows:d.querySelectorAll("table")[1].tBodies[0].rows.length,links:[...d.querySelectorAll("header a,footer a")].map(e=>({text:e.textContent,height:e.getBoundingClientRect().height}))};');
    assert.equal(layout.width,width);assert.ok(layout.scrollWidth<=width);assert.equal(layout.rows,12);pass('paripi guide layout '+width,layout);
    const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});fs.writeFileSync(path.join(artifacts,'paripi-'+width+'-guide.png'),Buffer.from(shot.data,'base64'));
    await click('header a[href="paripi-checker.html"]');for(let i=0;i<100;i++){if(await frame('return w.location.pathname==="/paripi-checker.html"&&!!d.querySelector("#nav");').catch(()=>false))break;await pause(30);}
    assert.equal(await frame('return d.querySelectorAll("#nav button").length;'),3);pass('paripi guide reciprocal navigation '+width);
  }
  await clear('paripi');await evaluate('localStorage.setItem("paripi-checker-v1",JSON.stringify({games:1000,counts:{cz:3,bonus:2},future:{keep:true}}));');await load('paripi');await tab(1);
  assert.equal(await frame('return d.querySelectorAll("[data-c^=\\\"stEnd.\\\"]").length;'),12);await bump('stEnd.s4');const legacy=await state();assert.equal(legacy.counts.cz,3);assert.equal(legacy.games,1000);assert.equal(legacy.future.keep,true);
  assert.deepEqual(await frame('return w.__errors;'),[]);assert.deepEqual(errors,[]);pass('paripi legacy actual reload and zero unhandled errors');
  await evaluate('new Promise(resolve=>{const f=document.getElementById("frame");f.onload=()=>resolve(true);f.src="/index.html";})');
  const newsLayout=await frame('const label=[...d.querySelectorAll(".section-label")].find(e=>e.textContent==="NEW");const section=label.nextElementSibling;return {inside:section.matches("section.info-block"),rows:section.querySelectorAll(":scope > p").length,first:section.querySelector("p a")?.getAttribute("href"),visible:[...section.querySelectorAll(":scope > p")].every(e=>e.getBoundingClientRect().height>0)};');
  assert.deepEqual(newsLayout,{inside:true,rows:8,first:'paripi-checker.html',visible:true});
  pass('NEW eight rendered rows inside info-block, paripi first',newsLayout);
`.replace('__DEFS__',JSON.stringify(defs));
  const run=spawnSync(process.execPath,['--input-type=module'],{input:prefix+steps+suffix,encoding:'utf8',stdio:['pipe','inherit','inherit'],cwd:root});
  assert.equal(run.status,0,run.error?.message||'browser acceptance failed');
}
console.log('PASS paripi ST-end release audit');

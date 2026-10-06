// Explicit release audit: node tests/paripi-nana-template.verify.mjs [--browser]
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const source=read('checker-data/paripi.js'),box={window:{}};
vm.runInNewContext(source,box);
const c=box.window.CheckerConfigs.paripi,state=()=>clone(c.defaults);
const ctx=S=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr',crow:()=>'',pct:(n,d)=>`${n}/${d}`});
const hash=s=>createHash('sha256').update(s).digest('hex');
const body=S=>c.template(ctx(S)).split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0];
const original=read('docs/specs/paripi-nana-template-v01.txt');
assert.equal(Buffer.byteLength(original),790);
assert.equal(hash(original),'a36537b082caae195d6cc47446a573c9479ba8c1e5406034124e6449c6ae6592');
assert.ok(!original.includes('\r'));
assert.equal((original.match(/0\/0/g)||[]).length,12);
assert.equal((original.match(/▶︎ *(?=\n|$)/g)||[]).length,15);
assert.equal(vm.runInNewContext(source.match(/const TEMPLATE=.*;/)[0]+'TEMPLATE'),original);
console.log('PASS 1: original bytes/hash/LF/12 fractions/15 blanks/embedded literal (6 checks)');
const zero=body(state()),filled=original.replace(/▶︎ *(?=\n|$)/g,'▶︎ 0回');
assert.deepEqual(Buffer.from(zero),Buffer.from(filled));
assert.equal(Buffer.byteLength(zero),850);
assert.equal(hash(zero),'afe00eea9bccd1a475a0948996aa46e507ca59fcdb6b930af88332448f51fcca');
assert.equal(c.nanaCollab,true);
assert.ok(c.template(ctx(state())).endsWith('by slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様'));
console.log('PASS 2: zero body exact bytes/850 bytes/hash/collaboration/credit (5 checks)');
// Independent instruction order, never inferred from implementation defaults.
const nd=[['stechen','n','d'],['shiki','n109','d109'],['shiki','n209','d209'],
  ...['normal','high','super'].flatMap(s=>['Weak','Melon','Chance'].map(r=>['rare',s+r+'N',s+r+'D']))];
const keys=[...nd.map(([g,n])=>[g,n]),...['sanka','eiko','sekihei'].map(k=>['czType',k]),
  ...['kanban','blue','yellow','even1','even2','high1','high2','s2','s3','s4','s5','s6'].map(k=>['stEnd',k])];
const lines=zero.split('\n'),slotLines=lines.flatMap((s,i)=>/▶︎ (?:0\/0|0回)/.test(s)?[i]:[]);
assert.equal(slotLines.length,27);
for(const [i,[g,k]] of keys.entries()){
  const S=state();S[g][k]=1;
  const out=body(S).split('\n'),changed=out.flatMap((s,j)=>s!==lines[j]?[j]:[]);
  assert.deepEqual(changed,[slotLines[i]],g+'.'+k);
  assert.equal(out[slotLines[i]],lines[slotLines[i]].replace(i<12?'0/0':'0回',i<12?'1/0':'1回'));
}
console.log('PASS 3: 27 isolated slots, exact target line and value (54 checks)');
const S=state();S.games=2000;S.counts.cz=4;S.czType={sanka:1,eiko:2,sekihei:3};
assert.equal(c.template(ctx(S)).split('\n')[1],'通常 2000G / CZ10回 1/200.0 / 初当り0回');
assert.ok(c.pages(ctx(S),()=> '')[0]().includes('CZ 計10回 1/200.0'));
assert.ok(c.pages(ctx(S),()=> '')[0]().includes('種類不明 4回'));
assert.deepEqual(clone(c.card.blocks({S})[0]),['CZ 10回','1/200.0']);
assert.equal(c.card.chart({S}).items[0].value,10);
assert.equal(c.card.bottom({S}).columns[0].items[1].text,'CZ 10回 1/200.0');
assert.equal(c.card.detail({S})[0].items[0].text,'CZ 10回 1/200.0');
assert.equal(body(S).split('■CZ選択率\n')[1].split('\n\n')[0],'三歌の礼　▶︎ 1回\n英子の試練▶︎ 2回\n石兵八陣　▶︎ 3回');
const known=clone(S);S.czType.future=800;S.stEnd.future=900;
assert.equal(c.template(ctx(S)),c.template(ctx(known)));
for(const key of ['blocks','chart','bottom','detail'])assert.deepEqual(clone(c.card[key]({S})),clone(c.card[key]({S:known})));
console.log('PASS 4: CZ total/rate on all six surfaces, known-only template/card (13 checks)');
for(const [g,n,d] of nd){
  const S=state();S[g][n]=9;S[g][d]=2;
  const out=c.normalizeState(S);assert.equal(out[g][n],2);assert.equal(out[g][d],2);
  assert.deepEqual(clone(c.normalizeState(clone(out))),clone(out));
  for(const [a,b,expectedN,expectedD] of [[-1,-2,0,0],[3.9,5.9,3,5],['7','4',4,4],[Infinity,NaN,0,0]]){
    const bad=state();bad[g][n]=a;bad[g][d]=b;c.normalizeState(bad);
    assert.deepEqual([bad[g][n],bad[g][d]],[expectedN,expectedD]);
  }
}
console.log('PASS 5: 12 pairs clamp/idempotence/negative/fraction/string/nonfinite (84 checks)');
assert.ok(!source.includes('(?<=')&&!source.includes('(?<!'));
console.log('PASS 6: no lookbehind (1 check)');
// engine の折りたたみ（§9-97）で行内の先頭文が消える説明を作らない。
// 畳まれる長さの説明は、data-fold="no" か、先頭1文が30字以内であること。
const hintCtx=S=>({S,nanaCreditText:()=> '',pct:(n,d)=>`${n}/${d}`,mode:1,
  crow:(key,label,sub)=>`<div class="crow"><div class="lbl"><div class="nm">${label}</div><div class="mn">${sub}</div></div></div>`});
const hintPages=c.pages(hintCtx(state()),()=> '').slice(0,3).map(fn=>fn()).join('');
const hints=[...hintPages.matchAll(/<div class="hint"([^>]*)>([^<]*)<\/div>/g)].map(m=>({attrs:m[1],text:m[2].trim()}));
assert.ok(hints.length>=5,'hint count '+hints.length);
let folded=0;
for(const {attrs,text} of hints){
  if(attrs.includes('data-fold="no"'))continue;
  if(text.length<60)continue;              // 畳まれない短い説明
  const first=text.slice(0,text.indexOf('。')+1);
  assert.ok(first.length>0&&first.length<=30,'先頭文が行内に残らない説明: '+text.slice(0,40));
  folded++;
}
assert.ok(folded>0,'折りたたみ対象の説明が1件もない');
console.log('PASS 8: '+hints.length+' hints, '+folded+' folded keep a <=30 char inline lead');
const regression=spawnSync(process.execPath,['tests/paripi-st-end.verify.mjs'],{cwd:root,stdio:'inherit'});
assert.equal(regression.status,0);
console.log('PASS 7: ST regression including 4096 combinations');

if(process.argv.includes('--browser')){
  const harness=read('tests/new-1005-four-machines.browser.mjs');
  const prefix=harness.split("  for(const id of ['juuou','paripi','tenten','mhsunbreak']){")[0].replace("const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');",'const root='+JSON.stringify(root)+';');
  const suffix=harness.slice(harness.indexOf('}catch(e){results.push'));
  const steps=String.raw`
  const pairs=__PAIRS__;
  await clear('paripi');await tab(1);
  for(const [g,nKey,dKey] of pairs){
    const win='[data-bump-many="'+g+'.'+dKey+','+g+'.'+nKey+'"]';
    const miss='[data-bump="'+g+'.'+dKey+'"]';
    await click(win);let S=await state();assert.equal(S[g][nKey],1);assert.equal(S[g][dKey],1);
    assert.ok((await frame('return d.getElementById("feed").textContent;')).includes('＋1'));
    await click('#undoBtn');S=await state();assert.equal(S[g][nKey],0);assert.equal(S[g][dKey],0);
    await click(win);await click('#modeBtn');
    assert.equal(await frame('return d.querySelector('+JSON.stringify(win)+').nextElementSibling.disabled;'),true);
    await frame('d.querySelector('+JSON.stringify(win)+').nextElementSibling.click();');
    S=await state();assert.equal(S[g][nKey],1);assert.equal(S[g][dKey],1);
    await click(win);S=await state();assert.equal(S[g][nKey],0);assert.equal(S[g][dKey],0);
    await click(win);S=await state();assert.equal(S[g][nKey],0);assert.equal(S[g][dKey],0);
    await click('#modeBtn');await click(win);await click(miss);await click('#modeBtn');await click(miss);
    S=await state();assert.equal(S[g][nKey],1);assert.equal(S[g][dKey],1);await click('#modeBtn');
    await tab(0);await bump('czType.sanka');await click('#undoBtn');
    S=await state();assert.equal(S[g][nKey],1);assert.equal(S[g][dKey],1);await tab(1);
  }
  pass('12 n/d pairs: production clicks, feed, Undo, minus at equal/zero/unequal, independent operation');
  await load('paripi');await tab(1);
  const saved=await state();for(const [g,n,d] of pairs){assert.equal(saved[g][n],1);assert.equal(saved[g][d],1);}
  await tab(3);await click('#detailBtn');const detail=await canvas('detailCanvas');
  assert.ok(detail.bright>1000);assert.equal(detail.text.filter(t=>t.text.endsWith(' 1/1')).length,12);
  saveCanvas('paripi-normal-detail',detail);
  const normal=await copy(),plain=await copy(true);
  assert.ok(normal.includes('▶︎ 1/1'));assert.ok(plain.includes('→ 1/1'));assert.ok(!/[▶↪\uFE0E\uFE0F]/u.test(plain));
  pass('12 n/d saved reload, detailed canvas rows/pixels, both production copy buttons');
  for(const width of [360,390]){
    await load('paripi',width,530);await tab(1);await measure('paripi-nana-'+width);
    const layout=await frame('return {width:w.innerWidth,scrollWidth:d.documentElement.scrollWidth,mainClient:d.getElementById("main").clientWidth,mainScroll:d.getElementById("main").scrollWidth,tabs:[...d.querySelectorAll("#nav button")].map(e=>e.textContent),rows:[...d.querySelectorAll(".cycle-row")].map(e=>({text:e.querySelector("b").textContent,buttons:[...e.querySelectorAll("button")].map(b=>b.getBoundingClientRect().height)})),hint:d.querySelector("[data-fold=no]").textContent,folded:!!d.querySelector("[data-fold=no] details")};');
    assert.equal(layout.width,width);assert.ok(layout.scrollWidth<=width);assert.ok(layout.mainScroll<=layout.mainClient,JSON.stringify(layout));
    assert.deepEqual(layout.tabs,['入力','通常時','示唆','カード']);assert.equal(layout.rows.length,12);
    assert.ok(layout.rows.every(r=>r.buttons.length===2&&r.buttons.every(h=>h>=44)));
    assert.equal(layout.folded,false);assert.ok(layout.hint.includes('115G'));assert.ok(layout.hint.includes('孔明前世'));
    fs.writeFileSync(path.join(artifacts,'paripi-nana-'+width+'-rows.json'),JSON.stringify(layout,null,2));
    for(let i=0;i<12;i++){
      await frame('d.querySelectorAll(".cycle-row")['+i+'].scrollIntoView({block:"center"});');
      const shot=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width,height:530,scale:1}});
      fs.writeFileSync(path.join(artifacts,'paripi-nana-'+width+'-row'+i+'.png'),Buffer.from(shot.data,'base64'));
    }
    pass('real viewport '+width+'x530: four tabs, all 12 rows/24 buttons >=44px, no horizontal scroll, unfolded shiki',layout);
    assert.deepEqual(await frame('return w.__errors;'),[]);
  }
  assert.deepEqual(errors,[]);
`.replace('__PAIRS__',JSON.stringify(nd));
  const run=spawnSync(process.execPath,['--input-type=module'],{input:prefix+steps+suffix,encoding:'utf8',stdio:['pipe','inherit','inherit'],cwd:root});
  assert.equal(run.status,0,run.error?.message||'browser acceptance failed');
}

// Release audit: run explicitly against the instructed base; not a history-dependent unit test.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const baseline=p=>execFileSync('git',['-c','safe.directory='+decodeURIComponent(root.pathname).replace(/^\//,''),'show',(process.env.RELEASE_BASE||'abbe054')+':'+p],{encoding:'utf8'});
const hitBaseline=p=>execFileSync('git',['-c','safe.directory='+decodeURIComponent(root.pathname).replace(/^\//,''),'show','74f8e03:'+p],{encoding:'utf8'});
const config=(id,source)=>{const x={window:{}};vm.runInNewContext(source,x);return x.window.CheckerConfigs[id];};
const clone=x=>JSON.parse(JSON.stringify(x));
const ctx=S=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const bytes=(a,b)=>assert.deepEqual(Buffer.from(a),Buffer.from(b));
const ids=['mhsunbreak','tenten'];
const style=s=>s.match(/<style>([\s\S]*?)<\/style>/)[1];
const list=read('checkers.html').split('<div class="section-label">スマスロ・AT機</div>')[1];
assert.deepEqual([...list.matchAll(/class="checker-main" href="([^"]+)/g)].slice(0,2).map(m=>m[1]),ids.map(id=>id+'-checker.html'));
for(const id of ids){
  const guide=read(id+'-guide.html'),html=read(id+'-checker.html');
  assert.equal(style(guide),style(read('tonski-guide.html')));
  assert.ok(html.includes(`href="${id}-guide.html">使い方`));
  assert.ok(list.includes(`href="${id}-guide.html">使い方`));
  assert.ok(guide.includes(`href="${id}-checker.html" style="margin-left:8px;">ツールを使う →`));
  assert.ok(guide.includes(`rel="canonical" href="https://slot-tools.jp/${id}-guide.html"`));
  assert.ok(guide.includes(`property="og:url" content="https://slot-tools.jp/${id}-guide.html"`));
  assert.ok(guide.match(/<title>(.*?)<\/title>/)[1].startsWith(guide.match(/<h1>(.*?)<\/h1>/)[1]));
  assert.ok(!/濃厚示唆|最強|6確定|設定[○0-9０-９・]*(?:以上)?確定演出|ベイズ|事後確率/.test(guide));
}
const map=read('sitemap.xml');
const locs=s=>[...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const baseLocs=locs(baseline('sitemap.xml')),nowLocs=locs(map);
assert.equal(baseLocs.length,78);
// 取り下げた2機種の経路だけが消えていること。以後のページ追加は許容する（§9-92 の運用と両立させる）。
assert.deepEqual(baseLocs.filter(u=>!nowLocs.includes(u)).sort(),[
  'https://slot-tools.jp/juuou-checker.html',
  'https://slot-tools.jp/juuou-guide.html',
  'https://slot-tools.jp/paripi-checker.html',
  'https://slot-tools.jp/paripi-guide.html'
].sort());
for(const id of ['juuou','paripi']){
  for(const file of ['checkers.html','sitemap.xml','index.html'])assert.ok(!read(file).includes(id),file+' excludes '+id);
  assert.ok(!fs.existsSync(new URL(id+'-guide.html',root)));
  const html=read(id+'-checker.html');assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.ok(!html.includes('>使い方</a>'));
}
console.log('PASS held machines 2: noindex, no guide files/links, absent from public routes');
for(const id of ids)for(const kind of ['checker','guide'])assert.ok(map.includes(`<loc>https://slot-tools.jp/${id}-${kind}.html</loc>\n    <lastmod>2026-10-04</lastmod>`));
const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
assert.equal((news.match(/<p>/g)||[]).length,8);
// §9-92 で NEW欄は公開のたびに増えるため、10/4 の行を機種2本に固定しない。
const oct4=[...news.matchAll(/<p>10\/4｜<a href="([^"]+)/g)].map(m=>m[1]);
assert.deepEqual(oct4.filter(u=>ids.some(id=>u===id+'-checker.html')),ids.map(id=>id+'-checker.html'));
const arch=read('docs/ARCHITECTURE.md');assert.equal((arch.match(/25機種/g)||[]).length,2);assert.ok(!arch.includes('23機種'));
assert.deepEqual(arch.split('\n').filter(l=>l.includes('21機種')),baseline('docs/ARCHITECTURE.md').split('\n').filter(l=>l.includes('21機種')));
console.log('PASS public routes 2, reciprocal links 2, sitemap 取り下げ4経路, NEW 8, architecture 2; guides style/meta/wording 2');
for(const id of ['ricorico','toaru2','mhsunbreak']){
  const a=config(id,hitBaseline('checker-data/'+id+'.js')),b=config(id,read('checker-data/'+id+'.js'));
  for(const mode of ['zero','mixed','all']){
    const S=clone(b.defaults);let index=0;
    if(mode!=='zero'){
      S.games=1000;
      for(const v of Object.values(S))if(v&&typeof v==='object'&&!Array.isArray(v))for(const k of Object.keys(v))if(typeof v[k]==='number')v[k]=mode==='all'?1:index++%3;
      // 合算の成功数は従来の questN と同じ値に保ち、1回目に入るだけ入れて残りを2回目以降に回す。
      if(id==='mhsunbreak')for(const key of Object.keys(S.questN1)){const t=Math.min(S.questN1[key],S.bzT1[key]+S.bzT2[key]);S.questN1[key]=Math.min(t,S.bzT1[key]);S.questN2[key]=t-S.questN1[key];}
      if(S.bz)for(const k of ['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'])S.bz[k+'D']=Math.max(S.bz[k+'D'],S.bz[k+'N']);
    }
    const old=a.template(ctx(clone(S))),now=b.template(ctx(clone(S)));
    const legacyNow=id==='mhsunbreak'?now.replace(/■BZテーブル1回目[\s\S]*?(?=■レア役からのBZ当選率)/,''):now;
    if(id==='mhsunbreak'&&mode!=='zero'){
      // Only the authorized tool header may change; compare every other byte.
      const oldLines=old.split('\n'),newLines=legacyNow.split('\n');
      assert.equal(newLines[1],'通常 0G / AT0回');
      assert.deepEqual(newLines.flatMap((line,i)=>line===oldLines[i]?[]:[i]),[1]);
      newLines[1]=oldLines[1];bytes(old,newLines.join('\n'));
    }else bytes(old,legacyNow);
    if(id==='mhsunbreak')bytes(now,read('tests/fixtures/mhsunbreak-'+mode+'-template.txt'));
  }
}
console.log('PASS nana templates vs 74f8e03: 7 exact outputs, 2 MH header-only deltas; all 9 legacy bodies byte-identical; MH golden 3');
const a=config('tonski',baseline('checker-data/tonski.js')),b=config('tonski',read('checker-data/tonski.js'));
const keys=[...['set2','set4','set6'].map(k=>['screens',k]),...Object.keys(b.defaults.coins).map(k=>['coins',k]),...Object.keys(b.defaults.atcz).map(k=>['atcz',k]),...['goldWin','rainbowWin'].map(k=>['ed',k])];
assert.equal(keys.length,15);
for(let mask=0;mask<2**keys.length;mask++){
  const S=clone(b.defaults);S.games=1000;
  keys.forEach(([group,key],i)=>{S[group][key]=(mask>>i)&1;});
  bytes(a.card.bottom(ctx(S)).columns[0].items[0].text,b.card.bottom(ctx(S)).columns[0].items[0].text);
  bytes(a.template(ctx(S)),b.template(ctx(S)));
  bytes(JSON.stringify(a.card.detail(ctx(S))),JSON.stringify(b.card.detail(ctx(S))));
}
console.log('PASS tonski all 32768 combinations of 15 certainty items: first line / template / detail bytes');
const j=config('juuou',read('checker-data/juuou.js'));
for(const [src,expected] of [[{games:1234,counts:{sc:4}},1234],[{games:1234,gamesMyslo:0,counts:{sc:4}},0],[{games:1234,gamesMyslo:300,gamesMysloStart:100,counts:{sc:4}},200]]){
  const out=j.normalizeState({...clone(j.defaults),...src},src);assert.equal(out.games,expected);assert.equal(out.counts.sc,4);
  assert.deepEqual(j.normalizeState(clone(out),clone(out)),out);
}
console.log('PASS legacy and explicit-zero/new-key migrations 3, each idempotent');
// magireco.js is intentionally changed by the approved estimate-tab removal; its dedicated audit compares preserved outputs.
for(const file of ['checker-engine.js','checker-bayes.js',...fs.readdirSync(new URL('checker-data/',root)).filter(f=>f.endsWith('.js')&&!['mhsunbreak.js','magireco.js'].includes(f)).map(f=>'checker-data/'+f)])bytes(read(file),hitBaseline(file));
console.log('PASS both common files, every other machine data file, unchanged vs 74f8e03; MH golden validated above');

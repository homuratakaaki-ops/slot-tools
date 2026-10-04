// Release audit: run explicitly against the instructed base; not a history-dependent unit test.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const baseline=p=>execFileSync('git',['-c','safe.directory='+decodeURIComponent(root.pathname).replace(/^\//,''),'show',(process.env.RELEASE_BASE||'579c8af')+':'+p],{encoding:'utf8'});
const config=(id,source)=>{const x={window:{}};vm.runInNewContext(source,x);return x.window.CheckerConfigs[id];};
const clone=x=>JSON.parse(JSON.stringify(x));
const ctx=S=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const bytes=(a,b)=>assert.deepEqual(Buffer.from(a),Buffer.from(b));
const ids=['mhsunbreak','juuou','paripi','tenten'];
const style=s=>s.match(/<style>([\s\S]*?)<\/style>/)[1];
const list=read('checkers.html').split('<div class="section-label">スマスロ・AT機</div>')[1];
assert.deepEqual([...list.matchAll(/class="checker-main" href="([^"]+)/g)].slice(0,4).map(m=>m[1]),ids.map(id=>id+'-checker.html'));
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
const map=read('sitemap.xml');assert.equal((baseline('sitemap.xml').match(/<url>/g)||[]).length,70);assert.equal((map.match(/<url>/g)||[]).length,78);
for(const id of ids)for(const kind of ['checker','guide'])assert.ok(map.includes(`<loc>https://slot-tools.jp/${id}-${kind}.html</loc>\n    <lastmod>2026-10-04</lastmod>`));
const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
assert.equal((news.match(/<p>/g)||[]).length,8);
assert.deepEqual([...news.matchAll(/<p>10\/4｜<a href="([^"]+)/g)].map(m=>m[1]),ids.map(id=>id+'-checker.html'));
const arch=read('docs/ARCHITECTURE.md');assert.equal((arch.match(/27機種/g)||[]).length,2);assert.ok(!arch.includes('23機種'));
assert.deepEqual(arch.split('\n').filter(l=>l.includes('21機種')),baseline('docs/ARCHITECTURE.md').split('\n').filter(l=>l.includes('21機種')));
console.log('PASS public routes 4, reciprocal links 4, sitemap 70->78, NEW 8, architecture 2; guides style/meta/wording 4');
for(const id of ['ricorico','toaru2','mhsunbreak']){
  const a=config(id,baseline('checker-data/'+id+'.js')),b=config(id,read('checker-data/'+id+'.js'));
  for(const mode of ['zero','mixed','all']){
    const S=clone(b.defaults);let index=0;
    if(mode!=='zero'){
      S.games=1000;
      for(const v of Object.values(S))if(v&&typeof v==='object'&&!Array.isArray(v))for(const k of Object.keys(v))if(typeof v[k]==='number')v[k]=mode==='all'?1:index++%3;
      if(S.bz)for(const k of ['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'])S.bz[k+'D']=Math.max(S.bz[k+'D'],S.bz[k+'N']);
    }
    const old=a.template(ctx(clone(S))),now=b.template(ctx(clone(S)));bytes(old,now);
    if(id==='mhsunbreak')bytes(now,read('tests/fixtures/mhsunbreak-'+mode+'-template.txt'));
  }
}
console.log('PASS nana templates 3 machines x 3 states = 9 byte comparisons; MH golden 3');
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
for(const file of ['checker-engine.js','checker-bayes.js','checker-data/mhsunbreak.js','checker-data/paripi.js','checker-data/tenten.js','tests/fixtures/mhsunbreak-zero-template.txt'])bytes(read(file),baseline(file));
console.log('PASS protected common files, 3 machine inputs, zero golden unchanged');

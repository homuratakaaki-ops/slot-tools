// 2026-11-07: 指定文言・参照クエリだけをファイル別の期待値へ適用し、全文一致を維持する。
const wordingChanges={
  "checker-data/aobuta.js":[["確認手段（アプリ等）と分母条件が未確認のため、現時点で1/x表示は行いません。","現時点では1/xは表示せず、回数だけを表示します。"]],
  "checker-data/mieruko.js":[["確認手段と分母条件が未確認のため、現時点で1/x表示は行いません。","現時点では1/xは表示せず、回数だけを表示します。"]],
  "checker-data/mogumogu.js":[["確認手段と分母条件が未確認のため、現時点で1/x表示は行いません。","現時点では1/xは表示せず、回数だけを表示します。"]],
  "checker-data/kabaneri2.js":[["実測の1/x表示は行いません。出典の確率がどの区間（通常時だけか、ST中も含むか）を分母にしているか明示されていないためです（AGENTS.md §9-70）。下段ベルはST中にも成立するため、上の通常回転数を分母にしても解析値と条件が揃いません。回数だけを記録してください。","回数だけを記録してください。1/xは表示しません。下段ベルはST中にも成立するため、通常回転数で割った値は、解析値と比べられません。"]],
  "checker-data/juuou.js":[["の分母は0として扱い、確率表示は行いません。","の確率は表示しません。"]],
  "checker-data/otome5.js":[["（解析の分母定義に合わせるため）",""]],
  "checker-data/enen2.js":[["（通常時は混ぜない。解析の分母定義に合わせるため）","（通常時は混ぜない）"],["分母用","炎炎激闘当選率を見るための回数"],["'罠中 小V成立','炎炎激闘当選率を見るための回数","'罠中 小V成立','十字目変換の発生率を見るための回数"]],
  "checker-data/jashinchan.js":[["ホール側で出現バランスを変更できるカスタムが搭載されているため、出現頻度そのものは設定推測に使えません。","出現バランスを変更できるカスタムが搭載されており、出現頻度はホールの設定で変わります。"],["設定推測には使わず記録のみです","記録のみです"],["確率の算出には使わず、稼働メモとして保存します。","稼働メモとして保存します（確率は出しません）。"],["AT中の消化分を含む総回転数のため、確率の算出には使わず回数のみ記録します","回数だけを記録します（AT中の消化分を含むため、1/xは出しません）"]],
  "checker-data/milliongod.js":[["未入力の場合、15枚役は設定推定に使われません。","入力すると、15枚役が設定推測の％に反映されます。"]],
  "checker-data/monkey5.js":[["5枚役の設定推定に使う分母になります","打ち始めとの差（自遊技G）で5枚役の1/xを出します"]],
  "checker-data/karakuri2.js":[["分母用","直撃当選率を見るための回数"]],
  "checker-data/taktop.js":[["分母用","報酬チャンス当選率を見るための回数"]]
};
const wordingExpected=(file,s)=>(wordingChanges[file]||[]).reduce((text,[before,after])=>text.split(before).join(after),s);
// Release audit: run explicitly against the instructed base; not a history-dependent unit test.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
// 2026-11-02: allow only the specified orphan spacer insertion and engine cache query.
const beforeOrphan=s=>s.replace("      // drawDetailCard の maxRows=20 に対応：省略を終えた最終の行で、見出しが左の列の最後（index 19）に来たら\n      // spacer を入れて右の列の先頭へ送る。「ほか」行込みで40行を超えたら同じ優先順で1項目だけ追加で省略し、やり直す（最大2回）。\n      function finish(rows,moreCount){\n        for(let retry=0;;retry++){\n          if(rows[19]&&rows[19].type==='section')rows.splice(19,0,{type:'spacer',hot:false,value:0});\n          if(rows.length+(moreCount>0?1:0)<=maxRows||retry>=2)break;\n          if(!removeOne(prepared,false)&&!removeOne(prepared,true))break;\n          moreCount++;\n          prepared=prepared.filter(sec=>sec.items.length>0);\n          rows=build(prepared);\n        }\n        if(moreCount>0)rows.push({type:'more',text:'ほか '+moreCount+'項目',hot:false,value:0});\n        return rows;\n      }\n","").replace("if(rows.length<=maxRows)return finish(rows,0);","if(rows.length<=maxRows)return rows;").replace("      return finish(rows,moreCount);\n","      if(moreCount>0)rows.push({type:'more',text:'ほか '+moreCount+'項目',hot:false,value:0});\n      return rows;\n").replace("        if(row.type==='spacer')return;\n","").replaceAll('checker-engine.js?v=20261102-orphan','checker-engine.js?v=20260924');
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
// 新機種は一覧の先頭に入るので、位置ではなく2機種が連続して並ぶことを見る。
const hrefs=[...list.matchAll(/class="checker-main" href="([^"]+)/g)].map(m=>m[1]);
assert.deepEqual(hrefs.slice(hrefs.indexOf(ids[0]+'-checker.html'),hrefs.indexOf(ids[0]+'-checker.html')+2),ids.map(id=>id+'-checker.html'));
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
// 取り下げた1機種の経路だけが消えていること。以後のページ追加は許容する（§9-92 の運用と両立させる）。
assert.deepEqual(baseLocs.filter(u=>!nowLocs.includes(u)).sort(),[
  'https://slot-tools.jp/juuou-checker.html',
  'https://slot-tools.jp/juuou-guide.html'
].sort());
for(const id of ['juuou']){
  for(const file of ['checkers.html','sitemap.xml','index.html'])assert.ok(!read(file).includes(id),file+' excludes '+id);
  assert.ok(!fs.existsSync(new URL(id+'-guide.html',root)));
  const html=read(id+'-checker.html');assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.ok(!html.includes('>使い方</a>'));
}
console.log('PASS held machines 1: noindex, no guide files/links, absent from public routes');
for(const id of ids)for(const kind of ['checker','guide'])assert.ok(map.includes(`<loc>https://slot-tools.jp/${id}-${kind}.html</loc>\n    <lastmod>2026-10-04</lastmod>`));
const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
assert.equal((news.match(/<p>/g)||[]).length,8);
// §9-92 で NEW欄は公開のたびに増え、8行を超えた分は古いものから消える。
// 10/4 の行は残っている分だけを、公開順（ids の先頭から）に並んでいることで見る。
const oct4=[...news.matchAll(/<p>10\/4｜<a href="([^"]+)/g)].map(m=>m[1]);
const oct4ids=oct4.filter(u=>ids.some(id=>u===id+'-checker.html'));
assert.deepEqual(oct4ids,ids.slice(0,oct4ids.length).map(id=>id+'-checker.html'));
const arch=read('docs/ARCHITECTURE.md');// 公開機種数は checkers.html の掲載数と一致させる（11/1 の godzieva2 公開で28、11/2 の5機種公開で33）。
const listed=(read('checkers.html').match(/class="checker-main"/g)||[]).length;assert.equal(listed,33);assert.equal((arch.match(new RegExp(listed+'機種','g'))||[]).length,2);assert.ok(!arch.includes('23機種')&&!arch.includes('26機種'));
assert.deepEqual(arch.split('\n').filter(l=>l.includes('21機種')),baseline('docs/ARCHITECTURE.md').split('\n').filter(l=>l.includes('21機種')));
console.log('PASS public routes 2, reciprocal links 2, sitemap 取り下げ2経路, NEW 8, architecture 2; guides style/meta/wording 2');
// ricorico は 10/14 に「■弱ﾘｺﾘｽ目変換高確」の1行を足した（解析更新）。その1行を除いた全バイトを旧版と比べる。
const dropWeakLyco=t=>{const m=t.match(/^■弱ﾘｺﾘｽ目変換高確▶︎ [0-9]+\/[0-9]+\n/gm)||[];assert.equal(m.length,1);return t.replace(m[0],'');};
for(const id of ['ricorico','toaru2','mhsunbreak']){
  const a=config(id,hitBaseline('checker-data/'+id+'.js')),b=config(id,read('checker-data/'+id+'.js'));
  for(const mode of ['zero','mixed','all']){
    const S=clone(b.defaults);let index=0;
    if(mode!=='zero'){
      S.games=1000;
      // 10/22 にサンブレイクへ足したキー（周期3種）は旧データには無いので埋めない。控えは旧データを読んだ直後と同じにする
      for(const [name,v] of Object.entries(S.bzBase?Object.assign({},S,S.bzBase):S))if(!(id==='mhsunbreak'&&['cycleD','cycleBz','cycleFuku','kareCut'].includes(name))&&v&&typeof v==='object'&&!Array.isArray(v))for(const k of Object.keys(v))if(typeof v[k]==='number')v[k]=mode==='all'?1:index++%3;
      // 合算の成功数は従来の questN と同じ値に保ち、1回目に入るだけ入れて残りを2回目以降に回す。
      if(id==='mhsunbreak')for(const key of Object.keys(S.bzBase.questN1)){const t=Math.min(S.bzBase.questN1[key],S.bzBase.bzT1[key]+S.bzBase.bzT2[key]);S.bzBase.questN1[key]=Math.min(t,S.bzBase.bzT1[key]);S.bzBase.questN2[key]=t-S.bzBase.questN1[key];}
      if(S.bz)for(const k of ['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'])S.bz[k+'D']=Math.max(S.bz[k+'D'],S.bz[k+'N']);
      if(id==='mhsunbreak')S.rareBzBase=Object.entries(S.bz).filter(([k])=>k.endsWith('N')).reduce((a,[,v])=>a+v,0);
    }
    const previous=clone(S);if(id==='mhsunbreak'){Object.assign(previous,clone(b.totals(S)));delete previous.bzBase;}
    const old=a.template(ctx(previous)),now=b.template(ctx(clone(S)));
    // 11/6 にサンブレイクへ足した「■狩れカットイン」2行（記録は0のまま）も旧版との比較では外す。
    const KARE='■狩れカットイン\nｴﾝﾀﾗｲｵﾝ▶︎ 0回\n\n';if(id==='mhsunbreak')assert.ok(now.includes('回\n\n'+KARE+'■エンディング'),'6確の後に狩れカットインの2行');
    const legacyNow=id==='ricorico'?dropWeakLyco(now):id==='mhsunbreak'?now.replace(/■BZテーブル1回目[\s\S]*?(?=■レア役からのBZ当選率)/,'').replace(KARE,''):now;
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
  // #77 adds exactly this zero-count item. Check it explicitly, then compare every legacy byte.
  const detail=clone(b.card.detail(ctx(S)));
  assert.equal(detail[0].title,'初当り');
  assert.equal(detail[0].items.length,3);
  assert.deepEqual(detail[0].items[2],{label:'333G到達時の女神の舞',value:0,hot:false,text:'333G到達時の女神の舞 -'});
  detail[0].items.splice(2,1);
  bytes(JSON.stringify(a.card.detail(ctx(S))),JSON.stringify(detail));
}
console.log('PASS tonski all 32768 combinations of 15 certainty items: first line / template / legacy detail bytes; #77 added item exact');
const j=config('juuou',read('checker-data/juuou.js'));
for(const [src,expected] of [[{games:1234,counts:{sc:4}},1234],[{games:1234,gamesMyslo:0,counts:{sc:4}},0],[{games:1234,gamesMyslo:300,gamesMysloStart:100,counts:{sc:4}},200]]){
  const out=j.normalizeState({...clone(j.defaults),...src},src);assert.equal(out.games,expected);assert.equal(out.counts.sc,4);
  assert.deepEqual(j.normalizeState(clone(out),clone(out)),out);
}
console.log('PASS legacy and explicit-zero/new-key migrations 3, each idempotent');
// magireco.js is intentionally changed by the approved estimate-tab removal; its dedicated audit compares preserved outputs.
// paripi.js: 夢爽裁可の ST終了画面追加のため除外。
// tenten.js and takoslot.js were changed by the current wording correction.
// toaru2.js は獲得枚数表示の誤った説明文を削除したため除外。
// kanokari.js は設定推測タブ追加（docs/specs/kanokari-estimate-v01.md）のため除外。
// ricorico.js は 10/14 の解析更新のため除外（テンプレは上で新規1行以外を比較済み）。
// garei_zero_re.js は 10/14 の解析更新のため除外（tests/garei-1014.verify.mjs で検証）。
// #76/#77 are now published. Compare these two complete files to their approved heads, not the old 10/4 snapshot.
// Keep them in the audit rather than excluding changed machine files.
const approvedData={
  'checker-data/mogumogu.js':'5b176a4ddd8170d8def74bf13fe085f4ef16e722',
  'checker-data/tonski.js':'2f9bc4a92b3d98c5b77397b10f006b573bafa922'
};
for(const file of ['checker-engine.js','checker-bayes.js',...fs.readdirSync(new URL('checker-data/',root)).filter(f=>f.endsWith('.js')&&!f.endsWith('-test.js')&&!['mhsunbreak.js','magireco.js','tenten.js','takoslot.js','paripi.js','toaru2.js','kanokari.js','ricorico.js','garei_zero_re.js','mahoako.js','seiya12.js','ragnador.js','garo.js','ggo.js','godzieva2.js','vivy.js','vvv2.js'].includes(f)).map(f=>'checker-data/'+f)]){
  const expected=approvedData[file]?execFileSync('git',['show',approvedData[file]+':'+file],{encoding:'utf8'}):hitBaseline(file);
  bytes(beforeOrphan(read(file)),wordingExpected(file,expected));
}
console.log('PASS both common files and every other machine data file: #76/#77 approved heads exact, others vs 74f8e03; MH golden validated above');

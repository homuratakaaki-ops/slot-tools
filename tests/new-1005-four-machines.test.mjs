import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');
const configs={};
for(const id of ['juuou','paripi','tenten','mhsunbreak']){
  const sandbox={window:{}};
  vm.runInNewContext(read('checker-data/'+id+'.js'),sandbox);
  configs[id]=sandbox.window.CheckerConfigs[id];
}
const clone=x=>JSON.parse(JSON.stringify(x));
const context=(config,S=clone(config.defaults))=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});

test('normalization keeps unknown data and clamps invalid n/d on reload',()=>{
  for(const [id,c] of Object.entries(configs)){
    const S=clone(c.defaults);S.future={keep:'yes'};S.counts.futureCount=9;S.games=-1;
    if(id==='mhsunbreak')for(const key of ['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh']){S.bz[key+'D']=2;S.bz[key+'N']=5;}
    const out=c.normalizeState(S);
    assert.equal(out.games,0);assert.deepEqual(out.future,{keep:'yes'});assert.equal(out.counts.futureCount,9);
    if(id==='mhsunbreak')for(const key of ['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'])assert.equal(out.bz[key+'N'],2);
  }
  const c=configs.juuou;
  for(const [src,expected] of [[{games:1234,counts:{sc:4}},1234],[{games:1234,gamesMyslo:0,counts:{sc:4}},0],[{games:1234,gamesMyslo:300,gamesMysloStart:100,counts:{sc:4}},200]]){
    const out=c.normalizeState({...clone(c.defaults),...src},src);
    assert.equal(out.games,expected);assert.equal(out.counts.sc,4);
    assert.deepEqual(c.normalizeState(clone(out),clone(out)),out);
  }
  const mh=configs.mhsunbreak;
  for(const [hits,want] of [[null,[]],[{},[]],[[0,-3,'',null,'oops',300,'600',9.9,'12x'],[300,600,9,12]]]){
    const out=mh.normalizeState({...clone(mh.defaults),games:3000,counts:{at:9},hits,atEnd:{jay:1}});
    assert.deepEqual(clone(out.hits),want);assert.equal(out.counts.at,9);assert.equal(out.atEnd.jay,1);
  }
  const out=mh.normalizeState({...clone(mh.defaults),hits:Array(1234).fill(300)});
  assert.equal(out.hits.length,1234);
  const mhCtx=context(mh,out);mh.pages(mhCtx,()=> '');assert.equal(out.games,370200);
  assert.ok(mh.template(mhCtx).includes('AT1234回 1/300.0'));
});

test('rates use normal games only, with no division for missing games or zero hits',()=>{
  for(const c of Object.values(configs)){
    const ctx=context(c),key=Object.keys(ctx.S.counts)[0];
    ctx.S.counts[key]=2;
    for(const g of [0,1000]){
      ctx.S.games=g;
      if(c===configs.mhsunbreak)ctx.S.hits=g?[300,700]:[];
      if(c===configs.juuou)ctx.S.gamesMyslo=g;
      const outputs=[c.template(ctx),JSON.stringify(c.card.blocks(ctx)),JSON.stringify(c.card.bottom(ctx)),JSON.stringify(c.card.detail(ctx))];
      for(const output of outputs)assert.equal(output.includes('1/500.0'),g===1000);
      for(const output of outputs)assert.ok(!output.includes('Infinity')&&!output.includes('NaN'));
    }
    ctx.S.counts[key]=0;
    if(c===configs.mhsunbreak)ctx.S.hits=[];
    for(const output of [c.template(ctx),JSON.stringify(c.card.blocks(ctx)),JSON.stringify(c.card.bottom(ctx))])assert.ok(!/1\/\d/.test(output));
  }
  const c=configs.juuou,ctx=context(c);ctx.S.counts.sc=4;ctx.S.games=9999;
  for(const [start,now,expected] of [[1000,1234,'1/58.5'],[1500,1234,null],[1000,1000,null]]){
    ctx.S.gamesMysloStart=start;ctx.S.gamesMyslo=now;
    for(const output of [c.template(ctx),JSON.stringify(c.card.blocks(ctx)),JSON.stringify(c.card.bottom(ctx)),JSON.stringify(c.card.detail(ctx))]){
      assert.equal(/1\/\d/.test(output),expected!==null);
      if(expected)assert.ok(output.includes(expected));
    }
  }
});

test('oneL, rank buckets and stable ties are independent of labels and count totals',()=>{
  const c=configs.mhsunbreak,ctx=context(c);
  ctx.S.over.o246=1;ctx.S.atEnd.fioreneRondine=1;ctx.S.atEnd.jayArloGaleas=1;
  assert.equal(c.card.bottom(ctx).columns[0].items[0].text,'確定演出 なし');
  assert.equal(c.card.blocks(ctx)[3][1],'計1回');
  assert.equal(c.card.chart(ctx).items[0].value,1);
  assert.equal(c.card.bottom(ctx).columns[1].items[4].text,'否定系 計2回');
  ctx.S.atEnd.zenin=2;ctx.S.trophy.rainbow=1;
  assert.match(c.card.bottom(ctx).columns[0].items[0].text,/虹\(6濃厚\)/);
  ctx.S.atEnd.entalion=1;
  assert.match(c.card.bottom(ctx).columns[0].items[0].text,/エンタライオン\(6濃厚\)/);
  assert.deepEqual(clone(c.card.chart(ctx).items.map(x=>x.value)),[1,0,0,2,2]);
});

test('HTML contract: original CSS apart from specified nav count, public links and LF',()=>{
  const style=s=>s.match(/<style>([\s\S]*?)<\/style>/)[1];
  const base=style(read('mogumogu-checker.html'));
  for(const id of Object.keys(configs)){
    const html=read(id+'-checker.html'),js=read('checker-data/'+id+'.js');
    assert.equal(style(html),['mhsunbreak','paripi'].includes(id)?base.replace('repeat(3,1fr);border-top','repeat(4,1fr);border-top'):id==='tenten'?base:base.replace('grid-template-columns:repeat(3,1fr);border-top','grid-template-columns:repeat(2,1fr);border-top'));
    assert.ok(!html.includes('checker-bayes.js'));assert.equal(html.includes('href="'+id+'-guide.html">使い方</a>'),['mhsunbreak','tenten','paripi'].includes(id));
    assert.equal(html.includes('<meta name="robots" content="noindex">'),['juuou'].includes(id));
    assert.ok(html.includes('<small>SETTING CHECKER ・ slot-tools.jp</small>'));
    // 設定判別カウンターにはUIバージョン文字列を出さない（AGENTS 作業規約4）。
    assert.doesNotMatch(html.match(/<header\b[^>]*>[\s\S]*?<\/header>/)[0],/\bUI\s/,id);
    assert.ok(html.includes('checker-engine.js?v=20260924'));
    assert.ok(html.includes('checker-data/'+id+'.js?v='+({mhsunbreak:'20261009-2',juuou:'20261004-2',tenten:'20261004-4',paripi:'20261006'}[id])+'"'));
    assert.ok(!html.includes('\r')&&!js.includes('\r'));
    assert.equal(configs[id].template,configs[id].compactTemplate);
    if(id==='juuou')assert.ok(!html.includes('設定3')&&!js.includes('設定3'));
  }
});

test('MH template preserves original bytes except the 34 blank values and wrapper',()=>{
  const c=configs.mhsunbreak,original=read('docs/specs/mhsunbreak-nana-template-v04.txt');
  let section='';
  const body=original.split('\n').map(line=>{if(line.startsWith('■'))section=line;return line.replace(/▶︎ $/,'▶︎ '+(section==='■クエスト成功率'?'0/0':'0回'));}).join('\n');
  assert.equal(c.template(context(c)),'設定判別メモ｜スマスロ モンスターハンターライズ：サンブレイク\n通常 0G / AT0回\n_______\n\n'+body+'\n\nby slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様');
  assert.equal((original.match(/▶︎ (?=\n)/g)||[]).length,34);
});

test('v04 template keeps the v04 golden bytes without regex lookbehind',()=>{
  assert.ok(!/\(\?<([=!])/.test(read('checker-data/mhsunbreak.js')));
  assert.equal(configs.mhsunbreak.template(context(configs.mhsunbreak)),read('tests/fixtures/mhsunbreak-zero-template.txt'));
});

test('MH template bytes match the golden files in zero, mixed and fully populated states',()=>{
  const c=configs.mhsunbreak;
  const fixture=Buffer.from(read('tests/fixtures/mhsunbreak-zero-template.txt'));
  assert.equal(fixture.length,2230);
  assert.deepEqual(Buffer.from(c.template(context(c))),fixture);
  for(const mode of ['zero','mixed','all']){
    const S=clone(c.defaults);let index=0;
    if(mode!=='zero'){
      S.games=1000;
      for(const value of Object.values(S))if(value&&typeof value==='object'&&!Array.isArray(value)){
        for(const key of Object.keys(value))if(typeof value[key]==='number')value[key]=mode==='all'?1:index++%3;
      }
      for(const key of ['weakNormal','weakHigh','weakSuper','strongNormal','strongHigh'])S.bz[key+'D']=Math.max(S.bz[key+'D'],S.bz[key+'N']);
      // 合算の成功数は従来の questN と同じ値に保ち、1回目に入るだけ入れて残りを2回目以降に回す。
      for(const id of Object.keys(S.questN1)){const t=Math.min(S.questN1[id],S.bzT1[id]+S.bzT2[id]);S.questN1[id]=Math.min(t,S.bzT1[id]);S.questN2[id]=t-S.questN1[id];}
    }
    const actual=Buffer.from(c.template(context(c,S)));
    assert.deepEqual(actual,Buffer.from(read('tests/fixtures/mhsunbreak-'+mode+'-template.txt')),mode);
    console.log('MH template bytes '+mode+': '+actual.length+' PASS');
  }
});

test('MH legacy icon logs migrate without any memo output or actions',()=>{
  const c=configs.mhsunbreak,S=clone(c.defaults);
  S.iconLog=[{icons:['rai'],group:'bzT1',quest:'blue',result:'win'}];
  const out=c.normalizeState(S);
  assert.equal(out.bzT1.t3,1);assert.equal(out.questN1.t3,1);
  assert.ok(!Object.hasOwn(out,'iconLog'));
  for(const text of [read('checker-data/mhsunbreak.js'),read('docs/specs/mhsunbreak-nana-template-v04.txt'),c.template(context(c,out))])assert.ok(!text.includes('■BZ配列メモ'));
  for(const action of ['bzIconAdd','bzIconBack','bzIconClear','bzIconDel','bzIconCopy'])assert.ok(!Object.hasOwn(c.actions,action));
});

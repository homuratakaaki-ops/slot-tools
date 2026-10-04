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
});

test('rates use normal games only, with no division for missing games or zero hits',()=>{
  for(const c of Object.values(configs)){
    const ctx=context(c),key=Object.keys(ctx.S.counts)[0];
    ctx.S.counts[key]=2;
    for(const g of [0,1000]){
      ctx.S.games=g;
      const outputs=[c.template(ctx),JSON.stringify(c.card.blocks(ctx)),JSON.stringify(c.card.bottom(ctx)),JSON.stringify(c.card.detail(ctx))];
      for(const output of outputs)assert.equal(output.includes('1/500.0'),g===1000);
      for(const output of outputs)assert.ok(!output.includes('Infinity')&&!output.includes('NaN'));
    }
    ctx.S.counts[key]=0;
    for(const output of [c.template(ctx),JSON.stringify(c.card.blocks(ctx)),JSON.stringify(c.card.bottom(ctx))])assert.ok(!/1\/\d/.test(output));
  }
});

test('oneL, rank buckets and stable ties are independent of labels and count totals',()=>{
  const c=configs.mhsunbreak,ctx=context(c);
  ctx.S.over.o246=1;ctx.S.atEnd.fioreneRondine=1;ctx.S.atEnd.jayArloGaleas=1;
  assert.equal(c.card.bottom(ctx).columns[0].items[0].text,'確定演出 なし');
  assert.equal(c.card.blocks(ctx)[3][1],'計1回');
  assert.equal(c.card.chart(ctx).items[0].value,1);
  assert.equal(c.card.bottom(ctx).columns[1].items[5].text,'否定系 計2回');
  ctx.S.atEnd.zenin=2;ctx.S.trophy.rainbow=1;
  assert.match(c.card.bottom(ctx).columns[0].items[0].text,/虹\(6確定\)/);
  ctx.S.atEnd.entalion=1;
  assert.match(c.card.bottom(ctx).columns[0].items[0].text,/エンタライオン\(6確定\)/);
  assert.deepEqual(clone(c.card.chart(ctx).items.map(x=>x.value)),[1,0,0,2,2]);
});

test('HTML contract: original CSS apart from specified nav count, limited scope and LF',()=>{
  const style=s=>s.match(/<style>([\s\S]*?)<\/style>/)[1];
  const base=style(read('mogumogu-checker.html'));
  for(const id of Object.keys(configs)){
    const html=read(id+'-checker.html'),js=read('checker-data/'+id+'.js');
    assert.equal(style(html),id==='mhsunbreak'?base:base.replace('grid-template-columns:repeat(3,1fr);border-top','grid-template-columns:repeat(2,1fr);border-top'));
    assert.ok(!html.includes('checker-bayes.js'));assert.ok(!html.includes('使い方'));
    assert.ok(html.includes('<small>SETTING CHECKER ・ slot-tools.jp</small>'));
    assert.ok(!html.includes('UI v1'));
    assert.ok(html.includes('checker-engine.js?v=20260924'));
    assert.ok(html.includes('checker-data/'+id+'.js?v=20261004'));
    assert.ok(!html.includes('\r')&&!js.includes('\r'));
    assert.equal(configs[id].template,configs[id].compactTemplate);
    if(id==='juuou')assert.ok(!html.includes('設定3')&&!js.includes('設定3'));
  }
});

test('MH template preserves original bytes except the 14 blank values and wrapper',()=>{
  const c=configs.mhsunbreak,original=read('docs/specs/mhsunbreak-nana-template-v01.txt');
  const body=original.replace(/▶︎ (?=\n)/g,'▶︎ 0回');
  assert.equal(c.template(context(c)),'設定判別メモ｜スマスロ モンスターハンターライズ：サンブレイク\n通常 0G / AT0回\n_______\n\n'+body+'\n\nby slot-tools.jp\nﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr\n解析出典:ちょんぼりすた様');
  assert.equal((original.match(/▶︎ (?=\n)/g)||[]).length,14);
});

test('v02 template keeps the v01 golden bytes without regex lookbehind',()=>{
  assert.ok(!/\(\?<([=!])/.test(read('checker-data/mhsunbreak.js')));
  assert.equal(configs.mhsunbreak.template(context(configs.mhsunbreak)),read('docs/reports/new-1005-four-machines-evidence/mhsunbreak-zero-template.txt'));
});

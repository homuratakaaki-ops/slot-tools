// v02 は歴史的正本、現在の出力は v03。
// Release comparison for the explicitly authorized MH v02 change.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(new URL(p,new URL('../',import.meta.url)),'utf8');
const before=p=>execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'show','3be5e98:'+p],{encoding:'utf8'});
const load=(id,s)=>{const x={window:{}};vm.runInNewContext(s,x);return x.window.CheckerConfigs[id];};
const clone=x=>JSON.parse(JSON.stringify(x));
const ctx=S=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const bytes=(a,b)=>assert.deepEqual(Buffer.from(a),Buffer.from(b));
const original=read('docs/specs/mhsunbreak-nana-template-v02.txt');
assert.equal(createHash('sha256').update(original).digest('hex'),'235abdc9ac7fc00f589995afd8fa2619fbd7bfb68eb6720100250885238119d2');
assert.equal(Buffer.byteLength(original),1881);
assert.equal((original.match(/▶︎ (?=\n)/g)||[]).length,34);
assert.equal((original.match(/0\/0|0回|▶︎ (?=\n)/g)||[]).length,56);
const v03=read('docs/specs/mhsunbreak-nana-template-v03.txt');
assert.equal(Buffer.byteLength(v03),1900);
assert.ok(!v03.includes('\r'));
bytes(v03,original.replace('■レア役からのBZ当選率','■BZ配列メモ\n\n■レア役からのBZ当選率'));
const filled=v03.split('■').map(s=>s.replace(/▶︎ (?=\n)/g,'▶︎ '+(s.startsWith('クエスト成功率')?'0/0':'0回'))).join('■');
const current=load('mhsunbreak',read('checker-data/mhsunbreak.js')),old=load('mhsunbreak',before('checker-data/mhsunbreak.js'));
const output=current.template(ctx(clone(current.defaults)));
bytes(output.split('_______\n\n')[1].split('\n\nby slot-tools.jp')[0],filled);
const legacy=s=>s.slice(s.indexOf('■レア役からのBZ当選率'));
bytes(legacy(output),legacy(before('tests/fixtures/mhsunbreak-zero-template.txt')));
bytes(read('docs/specs/mhsunbreak-nana-template-v01.txt'),before('docs/specs/mhsunbreak-nana-template-v01.txt'));
console.log('PASS original SHA256/1881 bytes, 34 blanks, 56 slots; normalized zero body diff empty; legacy zero tail diff empty');
const ids=Object.keys(current.defaults.questN1);
for(const id of ids){
  const S=clone(current.defaults);S.bzT1[id]=2;S.bzT2[id]=3;S.questN1[id]=9;S.questN2[id]=9;S.questN1.future=17;
  const out=current.normalizeState(S);assert.equal(out.questN1[id],2);assert.equal(out.questN2[id],3);assert.equal(out.questN1.future,17);
  assert.deepEqual(clone(current.normalizeState(clone(out))),clone(out));
}
const legacyState=clone(old.defaults);legacyState.atEnd.jay=3;
const migrated=current.normalizeState(legacyState);assert.equal(migrated.atEnd.jay,3);
for(const key of ['bzT1','bzT2','questN1','questN2'])assert.ok(Object.values(migrated[key]).every(v=>v===0));
console.log('PASS normalization: seven clamps/idempotence/unknown keys and one old-save migration');
const keys=[];
// Build keys from the stable detail order, independent of label text.
for(const [group,title] of [['atEnd','AT終了画面'],['trophy','エンタトロフィー'],['over','獲得枚数表示'],['stamp','エンディング中スタンプ']]){
  current.card.detail(ctx(clone(current.defaults))).find(s=>s.title===title).items.forEach((item,i)=>{if(item.hot)keys.push([group,Object.keys(current.defaults[group])[i]]);});
}
assert.equal(keys.length,18);
for(const key of ['blocks','chart','detail'])assert.equal(current.card[key].toString(),old.card[key].toString());
const S=clone(current.defaults);S.hits=[300,600];S.cycle.c1=2;S.czType.breakzone=3;
ids.forEach(id=>{S.bzT1[id]=4;S.bzT2[id]=5;S.questN1[id]=4;S.questN2[id]=2;});
const previous=clone(S);delete previous.bzT1;delete previous.bzT2;delete previous.questN1;delete previous.questN2;
for(let mask=0;mask<2**keys.length;mask++){
  keys.forEach(([g,k],i)=>{S[g][k]=previous[g][k]=(mask>>i)&1;});
  for(const key of ['blocks','chart','detail'])assert.equal(JSON.stringify(current.card[key](ctx(S))),JSON.stringify(old.card[key](ctx(previous))),key+' mask '+mask);
  const expectedBottom=clone(old.card.bottom(ctx(previous)));
  const deniedTotal=S.atEnd.fioreneRondine+S.atEnd.jayArloGaleas;
  if(deniedTotal===0){
    const rows=expectedBottom.columns.flatMap(column=>column.items).filter(row=>row.text.startsWith('否定系'));
    assert.equal(rows.length,1);
    rows[0].text='否定系 —';
  }
  assert.equal(JSON.stringify(current.card.bottom(ctx(S))),JSON.stringify(expectedBottom),'bottom mask '+mask);
}
console.log('PASS card blocks/bottom/chart/detail: all 262144 combinations of 18 certainty items byte-identical vs 3be5e98 except bottom zero-denial text, with nonzero BZ data');
for(const id of ['ricorico','toaru2']){
  const a=load(id,before('checker-data/'+id+'.js')),b=load(id,read('checker-data/'+id+'.js'));
  for(const mode of ['zero','mixed','all']){const S=clone(b.defaults);let i=0;if(mode!=='zero')for(const v of Object.values(S))if(v&&typeof v==='object'&&!Array.isArray(v))for(const k of Object.keys(v))if(typeof v[k]==='number')v[k]=mode==='all'?1:i++%3;bytes(a.template(ctx(clone(S))),b.template(ctx(clone(S))));}
}
console.log('PASS ricorico/toaru2 templates: six exact outputs vs 3be5e98');
// tenten.js and takoslot.js were changed by the current wording correction.
for(const file of ['checker-engine.js','checker-bayes.js',...fs.readdirSync(new URL('../checker-data/',import.meta.url)).filter(f=>f.endsWith('.js')&&!['mhsunbreak.js','tenten.js','takoslot.js'].includes(f)).map(f=>'checker-data/'+f)])bytes(read(file),before(file));
console.log('PASS both common files and all other machine definitions byte-identical vs 3be5e98');

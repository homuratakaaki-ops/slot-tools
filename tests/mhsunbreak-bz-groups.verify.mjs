import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(new URL(p,new URL('../',import.meta.url)),'utf8');
const load=source=>{const x={window:{}};vm.runInNewContext(source,x);return x.window.CheckerConfigs.mhsunbreak;};
const config=load(read('checker-data/mhsunbreak.js'));
const clone=x=>JSON.parse(JSON.stringify(x));
const ids=Object.keys(config.defaults.questN1);
const ctx=(S,mode=1)=>({S,mode,pct:(n,d)=>n+'/'+d+' '+(d?Math.round(n/d*100)+'%':'—'),nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
const html=(S,mode=1)=>config.pages(ctx(S,mode),()=> '')[2]();
const sections=S=>[...html(S).matchAll(/<section class="sec">([\s\S]*?)<\/section>/g)].map(m=>m[1]);
const blue=S=>sections(S).map(s=>s.match(/class="pct">([^<]*)/)[1]);
// Exercise the paths declared by the generated button; production clicks are
// covered separately by new-1005-four-machines.browser.mjs.
function tap(S,key,id,success){
  const nKey=key==='bzT1'?'questN1':'questN2';
  const paths=key+'.'+id+(success?','+nKey+'.'+id:'');
  const button=[...html(S).matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).find(b=>b.includes('data-bump-many="'+paths+'"'));
  assert.ok(button,paths);
  for(const p of button.match(/data-bump-many="([^"]+)"/)[1].split(',')){const [g,k]=p.split('.');S[g][k]++;}
}
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}

test('group independence and read-only seven-row aggregate',()=>{
  const S=clone(config.defaults);tap(S,'bzT1','blue',true);tap(S,'bzT1','blue',false);
  assert.deepEqual([S.questN1.blue,S.bzT1.blue,S.questN2.blue,S.bzT2.blue],[1,2,0,0]);
  assert.deepEqual(blue(S),['1/2 50%','0/0 —','1/2 50%']);
  tap(S,'bzT2','blue',true);
  assert.deepEqual(blue(S),['1/2 50%','1/1 100%','2/3 67%']);
  const aggregate=sections(S)[2];
  assert.equal((aggregate.match(/class="crow quest-row"/g)||[]).length,7);
  assert.doesNotMatch(aggregate,/<button\b|data-(?:c|bump|bump-many)=/);
  assert.ok(aggregate.includes('テンプレに出る成功率です（1回目＋2回目以降）'));
});
test('one success changes exactly two state paths',()=>{
  const S=clone(config.defaults),before=clone(S);tap(S,'bzT1','blue',true);
  function diff(a,b,p=''){return Object.keys({...a,...b}).flatMap(k=>{
    const path=p?p+'.'+k:k;
    if(JSON.stringify(a[k])===JSON.stringify(b[k]))return [];
    return a[k]&&b[k]&&typeof a[k]==='object'&&typeof b[k]==='object'?diff(a[k],b[k],path):[path];
  });}
  assert.deepEqual(diff(before,S).sort(),['bzT1.blue','questN1.blue']);
});
test('per-group clamp and minus failure guard',()=>{
  const S=clone(config.defaults);
  for(const id of ids){S.bzT1[id]=2;S.bzT2[id]=3;S.questN1[id]=9;S.questN2[id]=9;}
  config.normalizeState(S);
  for(const id of ids){assert.equal(S.questN1[id],2);assert.equal(S.questN2[id],3);}
  S.bzT2.blue=4;
  const buttons=[...html(S,-1).matchAll(/<button\b[^>]*>/g)].map(m=>m[0]);
  const failure=key=>buttons.find(b=>b.includes('data-bump-many="'+key+'.blue"'));
  assert.match(failure('bzT1'),/ disabled aria-disabled="true"/);
  assert.doesNotMatch(failure('bzT2'),/disabled/);
});
test('legacy migration retains totals, removes old key and is idempotent',()=>{
  for(const second of [0,3]){
    const src=clone(config.defaults);delete src.questN1;delete src.questN2;src.questN={};
    ids.forEach((id,i)=>{src.bzT1[id]=2;src.bzT2[id]=second;src.questN[id]=i;});
    for(const direct of [false,true]){
      const input=clone(src);
      const out=direct?config.normalizeState(input):config.normalizeState({...clone(config.defaults),...input},input);
      assert.ok(!Object.hasOwn(out,'questN'));
      ids.forEach((id,i)=>{
        const total=Math.min(i,2+second);
        assert.equal(out.questN1[id],Math.min(total,2));
        assert.equal(out.questN2[id],total-Math.min(total,2));
        assert.equal(out.questN1[id]+out.questN2[id],total);
      });
      assert.deepEqual(clone(config.normalizeState(clone(out))),clone(out));
    }
  }
  const S=clone(config.defaults);S.bzT1.blue=2;S.questN1.blue=1;S.questN={blue:9};
  config.normalizeState(S);assert.equal(S.questN1.blue,1);assert.ok(!Object.hasOwn(S,'questN'));
});
test('template buffers unchanged against 006e842 for zero and all quest rows',()=>{
  const old=load(execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'show','006e842:checker-data/mhsunbreak.js'],{encoding:'utf8',cwd:root}));
  for(const filled of [false,true]){
    const S=clone(config.defaults),previous=clone(old.defaults);
    if(filled)ids.forEach((id,i)=>{
      S.bzT1[id]=previous.bzT1[id]=i+2;S.bzT2[id]=previous.bzT2[id]=i+3;
      S.questN1[id]=i+1;S.questN2[id]=2;previous.questN[id]=i+3;
    });
    assert.deepEqual(Buffer.from(config.template(ctx(S))),Buffer.from(old.template(ctx(previous))));
  }
});
test('all 28 checker headers omit UI version labels',()=>{
  const files=fs.readdirSync(root).filter(p=>p.endsWith('-checker.html'));
  assert.equal(files.length,28);
  for(const file of files){
    const headers=[...read(file).matchAll(/<header\b[^>]*>([\s\S]*?)<\/header>/g)];
    assert.ok(headers.length,file);
    for(const [,header] of headers)assert.doesNotMatch(header,/\bUI\s/,file);
  }
});
console.log(`PASS mhsunbreak BZ groups: ${count} checks`);

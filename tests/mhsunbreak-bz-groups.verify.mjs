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
const sectionByTitle=(S,title)=>{
  const secs=[...html(S).matchAll(/<section class="sec">([\s\S]*?)<\/section>/g)].map(m=>m[1]);
  const hit=secs.find(s=>{const m=s.match(/class="sec-h">([^<]*)/);return m&&m[1].trim()===title;});
  if(!hit)throw new Error('section not found: '+title);
  return hit;
};
const t3=S=>{
  const results=sectionByTitle(S,'テーブル別の結果');
  const blocks=[...results.matchAll(/<div class="bz-sub">([^<]*)<\/div>([\s\S]*?)(?=<div class="bz-sub">|$)/g)];
  return [...['1回目','2回目以降'].map(title=>blocks.find(m=>m[1]===title)[2]),sectionByTitle(S,'テーブル別 成功率（合算）')].map(block=>[...block.matchAll(/class="pct">([^<]*)/g)][2][1]);
};
// Exercise the paths declared by the generated button; production clicks are
// covered separately by new-1005-four-machines.browser.mjs.
function tap(S,key,id,success){
  const nKey=key==='bzT1'?'questN1':'questN2';
  const paths=key+'.'+id+(success?','+nKey+'.'+id:'');
  const button=[...html(S).matchAll(/<button\b[^>]*>/g)].map(m=>m[0]).find(b=>b.includes('data-action="bzQuest"')&&b.includes('data-d="'+key+'"')&&b.includes('data-q="'+id+'"')&&b.includes('data-r="'+(success?'win':'miss')+'"'));
  assert.ok(button,paths);
  const d=button.match(/data-d="([^"]+)"/)[1],q=button.match(/data-q="([^"]+)"/)[1];
  S[d][q]++;
  if(button.includes('data-r="win"'))S[d==='bzT1'?'questN1':'questN2'][q]++;
}
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}

test('group independence and read-only seven-row aggregate',()=>{
  const S=clone(config.defaults);tap(S,'bzT1','t3',true);tap(S,'bzT1','t3',false);
  assert.deepEqual([S.questN1.t3,S.bzT1.t3,S.questN2.t3,S.bzT2.t3],[1,2,0,0]);
  assert.deepEqual(t3(S),['1/2 50%','0/0 —','1/2 50%']);
  tap(S,'bzT2','t3',true);
  assert.deepEqual(t3(S),['1/2 50%','1/1 100%','2/3 67%']);
  const aggregate=sectionByTitle(S,'テーブル別 成功率（合算）');
  assert.equal((aggregate.match(/class="crow quest-row"/g)||[]).length,7);
  assert.doesNotMatch(aggregate,/<button\b|data-(?:c|bump|bump-many)=/);
  assert.ok(aggregate.includes('テンプレに出る成功率です（1回目＋2回目以降）'));
});
test('one success changes exactly two state paths',()=>{
  const S=clone(config.defaults),before=clone(S);tap(S,'bzT1','t3',true);
  function diff(a,b,p=''){return Object.keys({...a,...b}).flatMap(k=>{
    const path=p?p+'.'+k:k;
    if(JSON.stringify(a[k])===JSON.stringify(b[k]))return [];
    return a[k]&&b[k]&&typeof a[k]==='object'&&typeof b[k]==='object'?diff(a[k],b[k],path):[path];
  });}
  assert.deepEqual(diff(before,S).sort(),['bzT1.t3','questN1.t3']);
});
test('per-group clamp and minus failure guard',()=>{
  const S=clone(config.defaults);
  for(const id of ids){S.bzT1[id]=2;S.bzT2[id]=3;S.questN1[id]=9;S.questN2[id]=9;}
  config.normalizeState(S);
  for(const id of ids){assert.equal(S.questN1[id],2);assert.equal(S.questN2[id],3);}
  S.bzT2.t3=4;
  const buttons=[...html(S,-1).matchAll(/<button\b[^>]*>/g)].map(m=>m[0]);
  const failure=key=>buttons.find(b=>b.includes('data-d="'+key+'"')&&b.includes('data-q="t3"')&&b.includes('data-r="miss"'));
  assert.match(failure('bzT1'),/ disabled aria-disabled="true"/);
  assert.doesNotMatch(failure('bzT2'),/disabled/);
});
test('legacy icon migration counts seven tables, skips three and is idempotent',()=>{
  const first=['qBlue','qYellow','rai','sel','oro','teo','rush','gold','blaze','unknown'];
  const oldIds=['blue','yellow','raizex','serregios','oromidro','teo','at'];
  const src=clone(config.defaults);
  for(const key of ['bzT1','bzT2','questN1','questN2'])src[key]=Object.fromEntries(oldIds.map(id=>[id,99]));
  src.questN={blue:99};src.iconPending=['rai'];
  src.iconLog=first.map((icon,i)=>({icons:[icon],group:i%2?'bzT2':'bzT1',result:i%2?'win':'miss',quest:i===4?'at':'blue'}));
  for(const direct of [false,true]){
    const input=clone(src);
    const out=direct?config.normalizeState(input):config.normalizeState({...clone(config.defaults),...input},input);
    for(const key of ['bzT1','bzT2','questN1','questN2'])assert.deepEqual(Object.keys(out[key]),ids);
    ids.forEach((id,i)=>{
      const group=i%2?'bzT2':'bzT1',other=i%2?'bzT1':'bzT2',nKey=i%2?'questN2':'questN1';
      assert.equal(out[group][id],1);assert.equal(out[other][id],0);
      assert.equal(out[nKey][id],i%2||i===4||i===6?1:0);
      assert.equal(out[i%2?'questN1':'questN2'][id],0);
    });
    assert.equal(Object.values(out.bzT1).concat(Object.values(out.bzT2)).reduce((a,b)=>a+b,0),7);
    for(const key of ['iconLog','iconPending','questN'])assert.ok(!Object.hasOwn(out,key));
    assert.deepEqual(clone(config.normalizeState(clone(out))),clone(out));
  }
  const invalid=clone(config.defaults);
  invalid.iconLog=[{icons:['rai'],group:'invalid',result:'win'},null,{icons:[],group:'bzT1'}];
  assert.deepEqual(clone(config.normalizeState(invalid)),clone(config.defaults));
  console.log('Migration fixture: qBlue/qYellow/rai/sel/oro/teo/rush = 1 each (7); gold/blaze/unknown = skipped (3), table indeterminate');
});
test('template buffers equal 006e842 for zero and all table rows',()=>{
  const old=load(execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'show','006e842:checker-data/mhsunbreak.js'],{encoding:'utf8',cwd:root}));
  for(const filled of [false,true]){
    const S=clone(config.defaults),previous=clone(old.defaults);
    if(filled)ids.forEach((id,i)=>{
      const oldId=Object.keys(old.defaults.bzT1)[i];
      S.bzT1[id]=previous.bzT1[oldId]=i+2;S.bzT2[id]=previous.bzT2[oldId]=i+3;
      S.questN1[id]=i+1;S.questN2[id]=2;previous.questN[oldId]=i+3;
    });
    assert.deepEqual(Buffer.from(config.template(ctx(S))),Buffer.from(old.template(ctx(previous))));
  }
});
test('all 28 checker headers omit UI version labels and use the ・ separator',()=>{
  const files=fs.readdirSync(root).filter(p=>p.endsWith('-checker.html'));
  assert.equal(files.length,28);
  for(const file of files){
    const headers=[...read(file).matchAll(/<header\b[^>]*>([\s\S]*?)<\/header>/g)];
    assert.ok(headers.length,file);
    const headerText=headers.map(([,header])=>header).join('');
    assert.equal(headerText.split('<small>SETTING CHECKER ・ slot-tools.jp</small>').length-1,1,file);
    assert.equal(headerText.split('SETTING CHECKER — slot-tools.jp').length-1,0,file);
    for(const [,header] of headers)assert.doesNotMatch(header,/\bUI\s/,file);
  }
});
test('f48130f template differs only by removed memo heading; card JSON identical',()=>{
  const old=load(execFileSync('git',['-c','safe.directory='+root.replace(/[\\/]$/,''),'show','f48130f:checker-data/mhsunbreak.js'],{encoding:'utf8',cwd:root}));
  const card=(c,S)=>Object.fromEntries(Object.entries(c.card).map(([k,v])=>[k,typeof v==='function'?v(ctx(S)):v]));
  for(const filled of [false,true]){
    const S=clone(config.defaults);
    if(filled){
      S.hits=[100,200,300,400];
      for(const key of config.mergeKeys||[])if(S[key]&&typeof S[key]==='object')Object.keys(S[key]).forEach((id,i)=>{S[key][id]=i+2;});
      ids.forEach((quest,i)=>{
        S.bzT1[quest]=i+2;S.bzT2[quest]=i+3;S.questN1[quest]=1;S.questN2[quest]=2;
      });
    }
    const previous=clone(S);
    for(const key of ['bzT1','bzT2','questN1','questN2'])previous[key]=Object.fromEntries(Object.keys(old.defaults[key]).map((id,i)=>[id,S[key][ids[i]]]));
    for(const key of ['template','compactTemplate'])assert.deepEqual(Buffer.from(config[key](ctx(clone(S)))),Buffer.from(old[key](ctx(clone(previous))).replace('■BZ配列メモ\n\n','')));
    assert.equal(JSON.stringify(card(config,clone(S))),JSON.stringify(card(old,clone(previous))));
  }
});
console.log(`PASS mhsunbreak BZ groups: ${count} checks`);

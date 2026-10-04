// Explicit regression audit: node tests/wording-noukou.verify.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const git=(...args)=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),...args],{encoding:'utf8',maxBuffer:16*1024*1024});
const ids=['kanokari','mhsunbreak','tonski','jashinchan','mogumogu','ricorico','magireco','garei_zero_re','mieruko','aobuta','takoslot'];
const clone=x=>JSON.parse(JSON.stringify(x));
const read=file=>fs.readFileSync(file,'utf8');
const before=file=>git('show','3c3f807:'+file);
const replace=s=>s.replace(/設定([0-9０-９・]*(?:以上)?)確定演出/g,'設定$1濃厚');
const ctx=S=>({S,nanaCreditText:()=> 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr'});
function load(id,old){
  const sandbox={window:{}};
  vm.runInNewContext(read('checker-bayes.js'),sandbox);
  let src=(old?before:read)('checker-data/'+id+'.js');
  src=src.replace(/\}\)\(\);\s*$/,`window.__certCount=typeof certCount==='function'?certCount:typeof strongCount==='function'?strongCount:()=>0;})();`);
  vm.runInNewContext(src,sandbox);
  return {c:sandbox.window.CheckerConfigs[id],cert:sandbox.window.__certCount};
}
function paths(obj,prefix=[]){return Object.entries(obj).flatMap(([k,v])=>typeof v==='number'?[prefix.concat(k)]:v&&typeof v==='object'&&!Array.isArray(v)?paths(v,prefix.concat(k)):[]);}
function set(S,p,v){let o=S;for(const k of p.slice(0,-1))o=o[k];o[p.at(-1)]=v;}
function outputs(c,S){const context=ctx(clone(S));return {template:c.template(context),bottom:JSON.stringify(c.card.bottom(context)),detail:JSON.stringify(c.card.detail(context))};}
const report={base:'3c3f807',machines:[],nana:[],static:{}};
const expectedCounts={kanokari:26,mhsunbreak:18,tonski:15,jashinchan:15,mogumogu:11,ricorico:10,magireco:7,garei_zero_re:7,mieruko:5,aobuta:4,takoslot:1};
for(const id of [...ids,'toaru2']){
  const a=load(id,true),b=load(id,false),ps=paths(a.c.defaults);
  assert.deepEqual(clone(b.c.defaults),clone(a.c.defaults),id+' defaults');
  const all=clone(a.c.defaults);for(const p of ps)set(all,p,1);
  const states=[['zero',clone(a.c.defaults)],['all',all]];
  let certPatterns=0;const certKeys=[];const changed=new Set();
  for(const p of ps){const S=clone(a.c.defaults);set(S,p,1);states.push([p.join('.'),S]);}
  for(const [key,S] of states){
    if(ids.includes(id)&&key!=='zero'&&key!=='all'&&a.cert(S)>0){
      certPatterns++;certKeys.push(key);
      const x=a.c.card.bottom(ctx(clone(S))).columns[0].items[0].text;
      const y=b.c.card.bottom(ctx(clone(S))).columns[0].items[0].text;
      const expected=id==='tonski'?replace(x):id==='magireco'?x.replaceAll('全て降順（設定5以上濃厚）','全て降順'):x;
      assert.equal(y,expected,id+' '+key+' first selected item');
      assert.equal(y.match(/\(([^()]*)\) ×/)?.[1],x.match(/\(([^()]*)\) ×/)?.[1],id+' '+key+' tier');
    }
    if(ids.includes(id)){
      const x=outputs(a.c,S),y=outputs(b.c,S);
      for(const field of Object.keys(x)){
        let expected=x[field];
        if(id==='tonski'||(id==='mieruko'&&field==='template'))expected=replace(expected);
        if(id==='magireco')expected=expected.replaceAll('全て降順（設定5以上濃厚）','全て降順');
        assert.equal(y[field],expected,`${id} ${key} ${field}: unexpected change`);
        if(y[field]!==x[field])changed.add(field);
      }
    }
    if(['ricorico','toaru2','mhsunbreak'].includes(id))assert.deepEqual(Buffer.from(b.c.template(ctx(clone(S)))),Buffer.from(a.c.template(ctx(clone(S)))),id+' '+key+' template bytes');
  }
  if(ids.includes(id)){
    assert.ok(certPatterns>0,id+' no cert patterns');
    const expected=['tonski','magireco'].includes(id)?['bottom','detail','template']:id==='mieruko'?['template']:[];
    assert.deepEqual([...changed].sort(),expected);
    report.machines.push({id,replacements:expectedCounts[id],certPatterns,certKeys,outputStates:states.length,changed:[...changed].sort()});
  }
  if(['ricorico','toaru2','mhsunbreak'].includes(id))report.nana.push({id,byteIdenticalStates:states.length});
  if(id==='mhsunbreak')assert.deepEqual(Buffer.from(b.c.template(ctx(clone(b.c.defaults)))),fs.readFileSync('tests/fixtures/mhsunbreak-zero-template.txt'));
  if(id==='magireco'){
    const d=b.c.card.detail(ctx(clone(all))).flatMap(g=>g.items).filter(i=>i.label==='全て降順');
    assert.equal(d.length,1);assert.ok(b.c.template(ctx(all)).includes('全て降順▶'));
  }
}
const files=git('ls-files','checker-data','*-checker.html','*-guide.html').trim().split('\n');
const replacements=Object.entries(expectedCounts).map(([id,n])=>['checker-data/'+id+'.js',n]).concat([['kanokari-guide.html',22],['mogumogu-guide.html',9],['magireco-guide.html',2]]);
for(const [file,n] of replacements){
  const original=before(file);
  assert.equal((original.match(/設定[0-9０-９・]*(?:以上)?確定演出/g)||[]).length,n,file+' replacement count');
  let expected=replace(original);
  if(['checker-data/kanokari.js','checker-data/mhsunbreak.js'].includes(file))expected=expected.replace('/設定([0-9・]+(?:以上)?)確定演出/','/設定([0-9・]+(?:以上)?)濃厚/');
  if(file==='checker-data/mogumogu.js')expected=expected.replace('/設定([0-9]+(?:・[0-9]+)*)(以上)?確定演出/','/設定([0-9]+(?:・[0-9]+)*)(以上)?濃厚/');
  if(file==='checker-data/magireco.js')expected=expected.replace("['descAll','全て降順（設定5以上濃厚）','5→4→3→2→1',5]","['descAll','全て降順','設定5以上濃厚（5→4→3→2→1）',5]");
  assert.equal(read(file),expected,file+' exact authorized changes; category labels and other logic retained');
}
const total=(get)=>files.reduce((n,f)=>n+(get(f).match(/確定演出/g)||[]).length,0);
report.static={beforeTotal:total(before),afterTotal:total(read),individualRemaining:files.reduce((n,f)=>n+(read(f).match(/設定[0-9０-９・]*(?:以上)?確定演出/g)||[]).length,0)};
assert.equal(report.static.individualRemaining,0);
// The three tierText regex literals also change; report them separately from the 152 wording replacements.
assert.equal(report.static.beforeTotal-report.static.afterTotal,155);
report.static.classificationPreserved=true;
report.static.specCountMatches=report.static.beforeTotal===353&&report.static.afterTotal===201;
report.static.replacements=152;
report.static.regexUpdates=3;
report.totalCertPatterns=report.machines.reduce((n,m)=>n+m.certPatterns,0);
if(process.env.CHECKER_ARTIFACTS){fs.mkdirSync(process.env.CHECKER_ARTIFACTS,{recursive:true});fs.writeFileSync(process.env.CHECKER_ARTIFACTS+'/wording-verification.json',JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));

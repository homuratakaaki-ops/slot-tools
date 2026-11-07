// PR #85（夢爽 11/2 の狭い直し方）：省略処理は main と同じ。省略を終えた最終の行で見出しが index 19 に来たときだけ spacer を入れる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'});
const old=git('show','2b85b40:checker-engine.js');
const current=read('checker-engine.js');
const clone=x=>JSON.parse(JSON.stringify(x));
function engine(source){const box={window:{},console};vm.createContext(box);vm.runInContext(source,box);return box.window.CheckerEngine;}
const before=engine(old),after=engine(current);
const env={document:{getElementById:()=>null},localStorage:{getItem:()=>null,setItem:()=>{}}};
function rows(engine,sections){return clone(engine.createApp({defaults:{},card:{detail:()=>sections}},env)._detailRows());}
function machineRows(engine,c,S){const app=engine.createApp(c,env);app.setState(clone(S));return clone(app._detailRows());}
const sec=(n,title='section')=>({title,items:Array.from({length:n},(_,i)=>({label:title+i,value:1}))});
const prefix=n=>Array.from({length:n},(_,i)=>sec(1,'inline'+i));
const body=r=>r.filter(x=>x.type!=='more'&&x.type!=='spacer');
const shown=r=>r.filter(x=>x.type==='item'||x.type==='inline').map(x=>x.type==='inline'?x.title+'|'+x.item._text:x.item._section+'|'+x.item._text);
const orphan=r=>body(r)[19]?.type==='section';
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
// 省略処理（prepare／build／removeOne／2つの while）は main と1字も変わらない。差は finish() と描画の1行だけ。
check('detailRows: omission code identical to main; only finish() and the draw line differ',()=>{
  const a=current.indexOf('      // drawDetailCard の maxRows=20 に対応：省略を終えた'),b=current.indexOf('      let prepared=prepare();',a);
  const reverted=current.slice(0,a)+current.slice(b)
    .replace('if(rows.length<=maxRows)return finish(rows,0);','if(rows.length<=maxRows)return rows;')
    .replace("      return finish(rows,moreCount);\n","      if(moreCount>0)rows.push({type:'more',text:'ほか '+moreCount+'項目',hot:false,value:0});\n      return rows;\n")
    .replace("        if(row.type==='spacer')return;\n",'');
  assert.equal(reverted,old);
});
check('section at 19 moves to 20 (no omission), spacer counts as a row',()=>{
  const data=[...prefix(19),sec(2)],r=rows(after,data);
  assert.deepEqual(r[19],{type:'spacer',hot:false,value:0});assert.equal(r[20].type,'section');
  assert.deepEqual(r.filter(r=>r.type!=='spacer'),rows(before,data));
});
for(const n of [18,20])check('section at '+n+' unchanged',()=>{const data=[...prefix(n),sec(2)];assert.deepEqual(rows(after,data),rows(before,data));});
check('inline at 19 unchanged',()=>assert.deepEqual(rows(after,prefix(23)),rows(before,prefix(23))));
check('exactly 40 rows with section at 19: spacer pushes over 40 → 2 extra omissions, ほか 2項目',()=>{
  const data=[...prefix(19),sec(20)];assert.equal(rows(before,data).length,40);
  const r=rows(after,data);assert.ok(r.length<=40);assert.equal(r[19].type,'spacer');assert.equal(r[20].type,'section');assert.equal(r.at(-1).text,'ほか 2項目');
});
for(const hot of [false,true])check('overflow, section at 19 after omission; hot='+hot,()=>{
  const data=[...prefix(19),sec(35,'overflow')];data.forEach(s=>s.items.forEach(i=>i.hot=hot));
  const r=rows(after,data),visible=r.filter(x=>x.type==='item'||x.type==='inline').length;
  assert.ok(r.length<=40);assert.equal(r[19].type,'spacer');assert.equal(r[20].type,'section');
  assert.equal(r.at(-1).text,'ほか '+(54-visible)+'項目');
});
// ネネの牙狼再現データ（P2）：main と同じく「ほか 12項目」で、RUSH終了の「牙狼 ×4 (29%)」が残る。
const garoRepro={"gameLog":[],"games":3,"counts":{"cz":2,"bonus":3},"bonusEnd":{"ryuga":1,"rian":3,"furei":0,"rianMaid":0,"enpo":0,"libera":3,"sonshi":1,"horror":4,"knights":3,"golden":0},"rushEnd":{"garo":4,"zen":1,"gai":3,"rian":1,"knights":3,"garoYami":2},"trophy":{"bronze":4,"silver":4,"gold":4,"sansei":4,"rainbow":2,"black":3},"payout":{"o246":1,"o456":0,"o555":0,"o666":0,"o999":4},"lamp":{"dWhite":4,"dCyan":4,"dGreen":4,"dYellow":2,"dOrange":0,"gAll":2,"gAro":2,"gRo":1,"gO":1,"gRainbow":3,"gNot2":3,"gNot3":3,"gNot4":4},"stepup":{"tomo":3,"gi":2,"ran":4,"switchOn":4},"item":{"madou":4,"kaneshiro":4,"zanbaken":1,"plant":3,"sonshiSword":0,"object":1,"tonton":0},"img":null,"iconChoice":null};
const configs=[];
for(const file of fs.readdirSync(path.join(root,'checker-data')).filter(f=>f.endsWith('.js')&&!f.endsWith('-test.js'))){
  const box={window:{},console};vm.createContext(box);vm.runInContext(read('checker-data/'+file),box);
  for(const [id,c] of Object.entries(box.window.CheckerConfigs||{}))if(c.card?.detail)configs.push([id,c]);
}
check('Nene garo repro: ほか 12項目 and 牙狼 ×4 (29%) same as main',()=>{
  const c=configs.find(([id])=>id==='garo')[1],m=machineRows(before,c,garoRepro),r=machineRows(after,c,garoRepro);
  assert.equal(m.at(-1).text,'ほか 12項目');assert.equal(r.at(-1).text,'ほか 12項目');
  for(const x of [m,r])assert.ok(x.some(y=>y.type==='item'&&y.item._section==='RUSH終了'&&y.item._text==='牙狼 ×4 (29%)'));
  assert.deepEqual(r,m);
});
// 36機種・ランダム入力（seed 固定）。取り残しが無い記録は main と完全一致、ある記録は見出しを右の列の先頭へ送り、差は項目の減少だけ。
let seed=20261102;const rand=()=>(seed=(seed*1103515245+12345)%2147483648)/2147483648;
function fill(o,p,max){for(const [k,v] of Object.entries(o)){if(typeof v==='number')o[k]=rand()<p?1+Math.floor(rand()*max):0;else if(v&&typeof v==='object'&&!Array.isArray(v))fill(v,p,max);}}
const stats={machines:0,records:0,same:0,orphan:0,omitted:0,reduced:{}};
check('36 machines x random records: no-orphan identical to main / orphan fixed, ≤40, only fewer items',()=>{
  for(const [id,c] of configs){
    stats.machines++;
    const samples=[];for(const p of [0.2,0.5,0.8,1])for(let i=0;i<60;i++){const S=clone(c.defaults);fill(S,p,[1,5,50][i%3]);if(Array.isArray(S.gameLog)&&rand()<0.5)S.gameLog=[300,500];samples.push(S);}
    {const S=clone(c.defaults);fill(S,1,1);samples.push(S);}
    for(const S of samples){
      const m=machineRows(before,c,S),r=machineRows(after,c,S);stats.records++;
      if(m.some(x=>x.type==='more'))stats.omitted++;
      assert.ok(r.length<=40,id);assert.notEqual(r[19]?.type,'section',id);
      if(!orphan(m)){assert.deepEqual(r,m,id);stats.same++;continue;}
      stats.orphan++;
      // 見出しは右の列の先頭へ（spacer）。追加の省略で見出しが左の列に収まった場合は spacer なしで取り残しが消える。
      if(r[19].type==='spacer'){assert.equal(r[20].type,'section',id);stats.spacer=(stats.spacer||0)+1;}else stats.shifted=(stats.shifted||0)+1;
      const a=shown(m),b=shown(r);let j=0;for(const s of b){while(j<a.length&&a[j]!==s)j++;assert.ok(j<a.length,id+' item not in main: '+s);j++;}
      const fewer=a.length-b.length;assert.ok(fewer>=0&&fewer<=2,id+' fewer '+fewer);
      stats.reduced[fewer]=(stats.reduced[fewer]||0)+1;
    }
  }
  assert.equal(stats.machines,36);
});
console.log('STATS '+JSON.stringify(stats));
check('all root HTML changes are exactly the engine query',()=>{
  let count=0;
  for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.html'))){
    const now=read(file);if(!now.includes('checker-engine.js?v='))continue;
    // テスト版ページ（*-test-checker.html）は検収中に ?v が変わるので、新しいエンジンを読むことだけを見る。
    if(file.endsWith('-test-checker.html')){assert.ok(now.includes('checker-engine.js?v=20261102-orphan'),file);count++;continue;}
    let base=git('show','d279952:'+file);
    if(file==='godzieva2-checker.html')base=base.replace('checker-data/godzieva2.js?v=20261101-nana4','checker-data/godzieva2.js?v=20261102-nana5');
    if(file==='vivy-checker.html')base=base.replace('checker-data/vivy.js?v=20261102-suggest','checker-data/vivy.js?v=20261107-wording');
    // 追加解析5機種の本番反映（11/6）は機種データの ?v だけが変わる。
    const addl=file.match(/^(seiya12|ragnador|ggo|godzieva2|mhsunbreak)-checker\.html$/);
    if(addl)base=base.replace(new RegExp('checker-data/'+addl[1]+'\\.js\\?v=[^"]+'),'checker-data/'+addl[1]+'.js?v=20261106-addl');
    // 今回更新した28機種の参照クエリだけを期待値に反映する。
    const wordingIds=["aobuta","enen2","garei_zero_re","garo","ggo","godzieva2","jashinchan","juuou","kabaneri2","kanokari","karakuri2","magireco","mahoako","mhsunbreak","mieruko","milliongod","mogumogu","monkey5","otome5","paripi","ragnador","ricorico","seiya12","takoslot","taktop","toaru2","vivy","vvv2"];
    for(const id of wordingIds)base=base.replace(new RegExp('checker-data/'+id+'\\.js\\?v=[^"\\s]+'),'checker-data/'+id+'.js?v=20261107-wording');
    assert.equal(now,base.replaceAll('checker-engine.js?v=20260924','checker-engine.js?v=20261102-orphan'),file);count++;
  }
  assert.ok(count>=36,String(count));
});
console.log(`PASS engine-detail-orphan: ${checks} checks; ${configs.length} machine configs`);

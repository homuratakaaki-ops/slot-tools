import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const box={window:{}};vm.runInNewContext(read('checker-data/tenten.js'),box);
const c=box.window.CheckerConfigs.tenten;
const clone=x=>JSON.parse(JSON.stringify(x));
const state=()=>clone(c.defaults);
const spec=read('docs/specs/new-1005-public-v01.md').split('# 追補 v02')[1];
const expected={};
for(const name of ['BONUS_END','OVER']){
  const source=spec.match(new RegExp('const '+name+'=\\[([\\s\\S]*?)\\];'))[0];
  expected[name]=vm.runInNewContext(source+'\n'+name);
}
const certs=[...expected.BONUS_END.map(x=>['screens',...x]),...expected.OVER.map(x=>['over',...x])].filter(x=>x[4]>0);
test('tenten issued facts: 36 probability values and 14 hint definitions',()=>{
  const rows=[];const ctx={S:state(),mode:1,crow:(...args)=>{rows.push(args);return '';},pct:()=>''};
  const pages=c.pages(ctx,()=> '');const html=pages[0]();pages[1]();
  const guide=read('tenten-guide.html');
  let count=0;
  for(const [label,values] of [
    ['AT初当り',['320.0','314.7','294.2','276.9','260.0','246.4']],
    ['CZ',['171.5','168.3','154.9','147.0','140.4','136.0']],
    ['成功期待度',['50.3','50.8','52.2','54.3','56.8','59.1']],
    ['150G',['63.1','64.0','68.1','70.7','72.8','73.9']],
    ['ポイント',['23.4','23.8','25.0','26.6','28.5','30.1']]
  ]){
    const isRate=label==='AT初当り'||label==='CZ';
    const sequence=values.map((v,i)=>(i===0?'設定1':String(i+1))+':'+(isRate?'1/':'')+v+(isRate?'':'%')).join('／');
    assert.ok(spec.includes(sequence),label+' issued order');assert.ok(html.includes(sequence),label+' input order');
    for(const [i,value] of values.entries()){
      assert.ok(guide.includes(value),label+' guide');
      if(!isRate){const heading={成功期待度:'CZ（エピソードバトル）最終レベル別の成功','150G':'150G以内のCZ以上当選',ポイント:'ポイントMAX時の報酬'}[label];const part=guide.split('<h2>'+heading+'</h2>')[1].split('</section>')[0];assert.ok(part.includes('<td>設定'+(i+1)+'</td><td>'+value+'%</td>'));}
      count++;
    }
  }
  for(const [i,v] of ['320.0','314.7','294.2','276.9','260.0','246.4'].entries())assert.ok(guide.includes('<td>設定'+(i+1)+'</td><td>1/'+v+'</td><td>1/'+['171.5','168.3','154.9','147.0','140.4','136.0'][i]+'</td>'));
  for(const [lv,lo,hi] of [[1,'15.2','31.5'],[2,'49.4','56.8'],[3,'70.9','75.9']]){
    assert.ok(html.includes(`EP LV${lv}</b><small class="mn">設1:${lo}%⇔設6:${hi}%`));
    assert.ok(guide.includes(`<td>EP LV${lv}</td><td>${lo}%</td><td>${hi}%</td>`));count+=2;
  }
  assert.equal(count,36);
  for(const [key,arr] of [['screens',expected.BONUS_END],['over',expected.OVER]])for(const [id,name,sub,rank] of arr){
    assert.deepEqual(rows.find(r=>r[0]===key+'.'+id).slice(0,4),[key+'.'+id,name,sub,rank>0]);
    assert.ok(guide.includes(`<td>${name}</td><td>${sub}</td>`));
  }
  assert.equal(rows.filter(r=>/^(screens|over)\./.test(r[0])).length,14);
  console.log('Issued values: 36 probabilities + 14 hint rows PASS');
});
test('tenten legacy load, unknown keys and all five n/d clamps remain stable',()=>{
  const old={games:1000,counts:{at:3,future:7},future:{keep:true}};
  const S=c.normalizeState(clone(old));assert.equal(S.games,1000);assert.equal(S.counts.at,3);assert.equal(S.counts.future,7);assert.equal(S.future.keep,true);
  for(const lv of [1,2,3]){S.cz['lv'+lv+'d']=2;S.cz['lv'+lv+'n']=5;}
  for(const key of ['g150','pt'])S[key]={d:2,n:5};
  const out=c.normalizeState(S);for(const lv of [1,2,3])assert.equal(out.cz['lv'+lv+'n'],2);
  for(const key of ['g150','pt'])assert.equal(out[key].n,2);
  assert.deepEqual(clone(c.normalizeState(clone(out))),clone(out));
});
test('tenten 1024 certainty combinations select numeric rank, stable tie and rank buckets',()=>{
  assert.equal(certs.length,10);
  for(let mask=0;mask<1024;mask++){
    const S=state();let hits=[];
    certs.forEach((r,i)=>{if(mask&(1<<i)){S[r[0]][r[1]]=1;hits.push(r);}});
    const highest=hits.reduce((a,r)=>!a||r[4]>a[4]?r:a,null);
    const first=c.card.bottom({S}).columns[0].items[0].text;
    assert.equal(first,highest?`確定 ${highest[2]}(${highest[4]===6?'6濃厚':highest[4]+'以上'}) ×1`:'確定演出 なし');
    assert.equal(c.card.blocks({S})[3][1],'計'+hits.length+'回');
    assert.deepEqual(clone(c.card.chart({S}).items.map(r=>r.value)),[2,3,4,5,6].map(rank=>hits.filter(r=>r[4]===rank).length));
  }
  const S=state();S.over.o1010=99;S.over.o666=1;
  assert.match(c.card.bottom({S}).columns[0].items[0].text,/666枚 OVER\(6濃厚\)/);
});
test('tenten LV4 aggregates as success, shares CZ denominator and omits rates for empty games',()=>{
  const S=state();S.cz={lv1d:3,lv1n:1,lv2d:2,lv2n:1,lv3d:4,lv3n:2,lv4:1};
  for(const games of [0,1000]){
    S.games=games;const ctx={S};
    assert.deepEqual(clone(c.card.blocks(ctx)[1]),games?['CZ 10回','1/100.0']:['CZ','10回']);
    assert.ok(c.template(ctx).includes('成功期待度▶5/10 50%'));
    assert.equal(c.card.bottom(ctx).columns[0].items[4].text,'CZ成功 5/10 50%');
    assert.equal(c.card.detail(ctx)[1].items.at(-1).text,'成功期待度 5/10 50%');
    assert.equal(c.template(ctx).includes('1/100.0'),games>0);
  }
});
test('tenten screen percent denominator excludes unknown keys and over has no percent',()=>{
  const S=state();S.screens.kokage=1;S.screens.tilty=2;S.screens.future=100;S.over.o1010=1;
  const detail=c.card.detail({S});assert.equal(detail[4].percent,true);assert.equal(detail[4].denominator,3);assert.equal(detail[5].percent,undefined);
  const tpl=c.template({S});assert.ok(tpl.includes('木陰の2人▶1回(33%)'));assert.ok(tpl.includes('ティルティ▶2回(67%)'));assert.ok(tpl.includes('1010枚 OVER(5以上)▶1回\n'));
  const summary=c.card.bottom({S});assert.deepEqual(clone(summary.columns.map(c=>c.items.length)),[5,5]);assert.equal(summary.startY+4*summary.rowGap,896);
  assert.deepEqual(clone(summary.columns[1].items.slice(0,3).map(r=>r.text)),['画面 木×1・テ×2','枚数 1010×1','EP LV 1:0/0・2:0/0・3:0/0・4:0']);
});

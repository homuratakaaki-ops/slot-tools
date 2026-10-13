import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../checker-data/mhsunbreak.js',import.meta.url),'utf8');
for(const [table,pos,text] of [
  ['t3','3','③ ライゼクス ・ 結果 3個目 セル'],
  ['t3',null,'③ ライゼクス'],
  ['t7',null,'⑦ AT'],
  [null,null,'テーブルを選んでください'],
  ['t5','10','⑤ オロミドロ亜種 ・ 結果 10個目 ＋G'],
  ['t6','2','⑥ テオ・テスカトル ・ 結果 2個目 テオ'],
]){
  const box={window:{}};vm.runInNewContext(source,box);
  const c=box.window.CheckerConfigs.mhsunbreak;
  const S=c.normalizeState({}),before=JSON.stringify(S);
  const ctx={S,mode:1,pct:(n,d)=>n+'/'+d,crow:()=>''};
  if(table)c.actions.bzPick(ctx,{q:table});
  if(pos)c.actions.bzPickPos(ctx,{pos});
  const html=c.pages(ctx,()=>'')[2]();
  const label=html.match(/class="crow pick-row"><div class="lbl"><div class="nm">([\s\S]*?)<\/div>/)[1];
  assert.equal(label.replace(/<[^>]+>/g,''),text);
  if(pos){
    const color=html.match(/class="pos-done"><div class="nm" style="color:([^"]+)"/)[1];
    assert.ok(label.includes('class="pick-result-label" style="color:'+color+'"'));
    assert.ok(label.startsWith('<span class="pick-table-label">'));
  }else assert.ok(!label.includes('style=')&&!label.includes('pick-result-label'));
  assert.equal(JSON.stringify(S),before,'label selection must not mutate saved state');
  console.log('PASS '+text);
}

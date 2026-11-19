import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
const box={window:{}};
vm.createContext(box);
for(const p of ['checker-bayes.js','checker-data/vvv2.js'])vm.runInContext(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'),box);
const c=box.window.CheckerConfigs.vvv2;
const make=()=>c.normalizeState(JSON.parse(JSON.stringify(c.defaults)));
test('VVV2の周期示唆はボタンで要点、説明を開くと正本の意味を読める',()=>{
  const S=make();
  const before=JSON.stringify(S);
  const html=c.pages({S,mode:1},()=>null)[2]();
  assert.match(html,/data-hint="sub_hito"[^>]*><span class="vv-hint-name">火人<\/span><span class="vv-hint-meaning">2周期以内にCZ濃厚<\/span>/);
  assert.match(html,/data-hint="eye_red"[^>]*>.*?2周期以内のCZ期待度大<\/span>/);
  assert.match(html,/<summary>説明を見る<\/summary><dl>.*?<dt>アイキャッチ 赤背景<\/dt><dd>2周期以内のCZ期待度大（出典により「濃厚」の記載あり）<\/dd>/);
  assert.equal((html.match(/<summary>説明を見る<\/summary>/g)||[]).length,5);
  assert.equal((html.match(/data-action="hint"/g)||[]).length,Object.keys(c.HINT).length-1);
  assert.equal(JSON.stringify(S),before,'説明を見るだけでは記録を変えない');
});
test('VVV2の記録した示唆は名前と意味を履歴に表示する',()=>{
  const S=make();
  c.actions.hint({S},{hint:'pino_chikai'});
  const html=c.pages({S,mode:1},()=>null)[2]();
  assert.match(html,/data-row-index="0"[^>]*>1周期目 ピノ「チカイ！」<span class="vv-hint-meaning">200pt以内濃厚<\/span>/);
  assert.equal(S.spans[0].rows.length,1);
  assert.equal(S.counts.cz,0);
});
test('VVV2の設定示唆は弱い示唆と濃厚を区別する（設定推測の入力は同じ）',()=>{
  const S=make(),before=JSON.stringify(c.bayesSpec(S));
  const html=c.pages({S,mode:1},()=>null)[1]();
  for(const [g,key,meaning] of [['endScreen','raizo','奇数設定寄り・高設定示唆（弱）'],['endScreen','silver','設定4以上濃厚'],['baffe','occupied','偶数設定でやや出やすい']]){
    const row=html.split('data-group-row="'+g+'.'+key+'"')[1].split('data-group-row=')[0];
    assert.ok(row.includes(meaning),meaning);
  }
  assert.equal(JSON.stringify(c.bayesSpec(S)),before);
});

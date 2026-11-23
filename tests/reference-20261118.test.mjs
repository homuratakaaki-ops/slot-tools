import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const BASE='20ead2ae5f3bcd6348d654ebf8573953c9c5ce27';
const load=(s,id)=>{const box={window:{}};vm.runInNewContext(s,box);return box.window.CheckerConfigs[id];};
const plain=x=>JSON.parse(JSON.stringify(x));
for(const id of ['ggo','seiya12'])test(id+' reference-only change and old/unknown data compatibility',()=>{
 const filename=`checker-data/${id}.js`,src=fs.readFileSync(filename,'utf8');
 const oldsrc=execFileSync('git',['show',`${BASE}:${filename}`],{encoding:'utf8'});
 const a=load(oldsrc,id),b=load(src,id);
 // Only the reference section and source comment may change in machine JS.
 const strip=s=>s.replace(/^\/\/.*\n/gm,'').replace(/  const REF_SECTIONS=\[[\s\S]*?\n  \];/,'');
 assert.equal(strip(src),strip(oldsrc));
 assert.equal(b.storageKey,`${id}-checker-v1`);
 assert.deepEqual(plain(b.defaults),plain(a.defaults));
 const unknown={string:'07',decimal:1.25,negative:-3,nil:null,array:[1,'x'],object:{v:true},bool:false};
 for(const seed of [{}, {counts:{},gameLog:[100,200]},plain(a.defaults)]){
  Object.assign(seed,unknown);
  for(const key of a.mergeKeys){seed[key]={...seed[key],...unknown};for(const k of Object.keys(a.defaults[key]))seed[key][k]=3;}
  const x=a.normalizeState(plain(seed)),y=b.normalizeState(plain(seed));
  assert.deepEqual(plain(y),plain(x));
  for(const [k,v] of Object.entries(unknown)){assert.deepEqual(plain(y[k]),v);for(const group of a.mergeKeys)assert.deepEqual(plain(y[group][k]),v);}
  assert.equal(b.template({S:y}),a.template({S:x}));
  for(const f of ['blocks','chart','bottom','detail'])assert.deepEqual(plain(b.card[f]({S:y})),plain(a.card[f]({S:x})));
 }
 const html=b.pages({S:b.defaults},()=>null)[2]();
 const expected=id==='ggo'?['ボーナス 14.8% ／ イエスマム 5.1%','ボーナス 15.2% ／ イエスマム 5.5%','ボーナス 15.6% ／ イエスマム 5.9%','ボーナス 19.9% ／ イエスマム 7.8%','ボーナス 23.4% ／ イエスマム 9.4%','ボーナス 25.0% ／ イエスマム 9.8%']:['加護なし 60.9% ／ 星矢 5.9% ／ 氷河 14.8%','加護なし 57.8% ／ 星矢 6.3% ／ 氷河 14.8%','加護なし 54.3% ／ 星矢 7.8% ／ 氷河 14.8%','加護なし 49.2% ／ 星矢 7.8% ／ 氷河 14.8%','瞬 11.7% ／ 紫龍 3.5% ／ 一輝 3.1%','瞬 11.7% ／ 紫龍 5.1% ／ 一輝 4.3%','瞬 11.7% ／ 紫龍 6.3% ／ 一輝 5.1%','瞬 11.7% ／ 紫龍 10.2% ／ 一輝 6.3%','AT直撃 0.8%','AT直撃 1.6%','AT直撃 2.3%','AT直撃 3.9%','AT直撃 6.3%'];
 for(const value of expected)assert.ok(html.includes(value),value);
 assert.match(html,/2026年11月18日/);assert.match(html,/第三者解析/);
 assert.doesNotMatch(html,/<input|<button|data-c=/);
 const guide=fs.readFileSync(`${id}-guide.html`,'utf8');
 for(const value of new Set(expected.flatMap(s=>s.match(/\d+\.\d+%/g))))assert.ok(guide.includes(value),value);
 if(id==='ggo')assert.match(guide,/<th>設定<\/th><th>ボーナス<\/th><th>イエスマム<\/th>/);
 const version=id==='seiya12'?'20261123-seiya-reference':'20261119-reference-release';
 assert.match(fs.readFileSync(`${id}-checker.html`,'utf8'),new RegExp(`${id}\\.js\\?v=${version}"`));
});

test('each setting row, including expanded merged cells, agrees with the guide',()=>{
 const groups={ggo:[['グレネードジャッジの報酬振り分け',[[14.8,5.1],[15.2,5.5],[15.6,5.9],[19.9,7.8],[23.4,9.4],[25,9.8]]]],seiya12:[['守護星座の加護（加護なし・星矢・氷河）',[[60.9,5.9,14.8],[57.8,6.3,14.8],[54.3,7.8,14.8],[49.2,7.8,14.8],[49.2,7.8,14.8],[49.2,7.8,14.8]]],['守護星座の加護（瞬・紫龍・一輝）',[[11.7,3.5,3.1],[11.7,5.1,4.3],[11.7,6.3,5.1],[11.7,10.2,6.3],[11.7,10.2,6.3],[11.7,10.2,6.3]]],['規定周期到達時のAT直撃',[[.8],[1.6],[2.3],[3.9],[3.9],[6.3]]]]};
 for(const [id,tables] of Object.entries(groups)){
  const c=load(fs.readFileSync(`checker-data/${id}.js`,'utf8'),id),html=c.pages({S:c.defaults},()=>null)[2]();
  const guide=fs.readFileSync(`${id}-guide.html`,'utf8');
  for(const [title,rows] of tables){
   const section=html.split('<div class="sec-h">'+title+'</div>')[1].split('</section>')[0];
   assert.ok(section.indexOf('<td>条件</td>')<section.indexOf('<td>設定1</td>'));
   const guideSection=guide.split('<h2>'+title+'</h2>')[1].split('</section>')[0];
   rows.forEach((row,i)=>{
    const rendered=section.split(`<td>設定${i+1}</td><td>`)[1].split('</td>')[0];
    assert.deepEqual(rendered.match(/[0-9]+\.[0-9]+%/g),row.map(v=>v.toFixed(1)+'%'));
    assert.ok(guideSection.includes('<tr><td>'+(i+1)+'</td>'+row.map(v=>'<td>'+v.toFixed(1)+'%</td>').join('')+'</tr>'));
   });
  }
 }
});

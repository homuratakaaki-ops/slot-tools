import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const base='6dd1c73b17687ddf57553caf5531a66740008cc7';
const read=p=>fs.readFileSync(p,'utf8');
const old=p=>execFileSync('git',['show',base+':'+p],{encoding:'utf8'});
const src='checker-data/seiya12.js', guide='seiya12-guide.html', checker='seiya12-checker.html';
function page(s){const box={window:{}};vm.runInNewContext(s,box);const c=box.window.CheckerConfigs.seiya12;return c.pages({S:c.defaults},()=>null)[2]();}
const html=page(read(src));
const ex='規定周期到達時のVゲットチャレンジEX移行率',pt='黄金降臨成功時の報酬ポイント';
const tables=[
 [ex,['EX移行'],[['2.73'],['2.73'],['3.52'],['3.52'],['3.52'],['3.91']],/AT中の規定周期到達.*通常のVゲットチャレンジに成功.*失敗、鳳凰Vゲットチャレンジ（一輝の加護を含む）、他の契機/],
 [pt,['5pt','10pt','15pt','20pt'],[['80.47','10.94','1.95','6.64'],['80.08','11.33','1.95','6.64'],['80.08','11.33','1.95','6.64'],['78.91','11.72','1.95','7.42'],['75.40','13.67','2.34','8.59'],['73.44','14.84','2.34','9.38']],/千日戦争.*1回ごとに予約する.*累計ポイントではありません/]
];
for(const [heading, cols, rows, condition] of tables)test(heading+'：条件と全行が直接照合した第三者解析の掲載値どおり',()=>{
 const reference=html.split('<div class="sec-h">'+heading+'</div>')[1].split('</section>')[0];
 const g=read(guide).split('<h2>'+heading+'</h2>')[1].split('</section>')[0];
 assert.match(reference.split('<td>設定1</td>')[0],condition);
 assert.match(g.split('<table>')[0],condition);
 const expected=rows.map((row,i)=>['設定'+(i+1),row.map((v,j)=>cols[j]+' '+v+'%').join(' ／ ')]);
 assert.deepEqual([...reference.matchAll(/<tr><td>(設定\d)<\/td><td>([^<]*)<\/td><\/tr>/g)].map(m=>m.slice(1)),expected);
 assert.deepEqual([...g.matchAll(/<tr><td>([1-6])<\/td>((?:<td>[^<]+<\/td>)+)<\/tr>/g)].map(m=>[m[1],...[...m[2].matchAll(/<td>([^<]+)<\/td>/g)].map(t=>t[1])]),rows.map((row,i)=>[String(i+1),...row.map(v=>v+'%')]));
 if(heading===pt)for(const text of [reference,g])assert.match(text,/ミロは5pt以上、アイオリアは10pt以上、シャカは20pt.*エクストララウンドの対戦相手「シャカ」の高設定示唆とは別/);
});

test('基準mainとの差分は静的参照表示とキャッシュ番号のみ（旧表・旧アンカー・全ロジックそのまま）',()=>{
 const source=read(src), orig=old(src), strip=s=>s.replace(/^\/\/ 追加参照表（.*\n/m,'').replace(/  const REF_SECTIONS=\[[\s\S]*?\n  \];/,'');
 assert.equal(strip(source),strip(orig));
 for(const section of page(orig).match(/<section class="sec" id="ref\d+">.*?<\/section>/g))assert.ok(html.includes(section),section.slice(0,120));
 assert.doesNotMatch(html,/<input|<button|data-c=/);
 assert.equal(read(checker).replace('20261123-seiya-reference','20261119-reference-release'),old(checker));
 for(const href of ['https://chonborista.com/slot/sanyo-slot/260304/','https://nana-press.com/kaiseki/machine/1193/39943/','https://1geki.jp/slot/l_seiya_ougon/0/','https://nana-press.com/kaiseki/machine/1193/40123/'])assert.ok(read(guide).includes(href));
 assert.match(read(guide),/2026年11月23日確認.*第三者解析/);
});

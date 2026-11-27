import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const baseline=p=>execFileSync('git',['-c','safe.directory=*','show','fdf6e90:'+p],{cwd:root,encoding:'utf8'});
const clone=x=>JSON.parse(JSON.stringify(x));
function load(src){const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs.vivy;}
const source=read('checker-data/vivy.js'),oldSource=baseline('checker-data/vivy.js');
const c=load(source),old=load(oldSource);
const rows=[
  ['estella','エステラ','奇数設定期待度UP',0],
  ['beach','ビーチ','偶数設定期待度UP',0],
  ['matsumoto','マツモト変形','偶数設定期待度UP（強）',0],
  ['hug','抱きしめる','高設定期待度UP（弱）',0],
  ['gaze','見つめる','高設定期待度UP（強）',0],
  ['bear','クマ','設定2以上濃厚',2],
  ['reach','手を伸ばす','設定4以上濃厚',4],
  ['mini','ミニキャラ','設定5以上濃厚',5],
  ['all','全員集合','設定6濃厚',6]
];
const ctx=S=>({S,nanaCreditText:()=> 'なな様',pct:(n,d)=>`${n}/${d}`,crow:(...args)=>JSON.stringify(args.slice(0,4))});
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
const S=clone(old.defaults);
for(const [key] of rows.slice(5))S.atEnd[key]=1;
const restored=c.normalizeState(clone(S),S);
check('旧保存データ・キー・defaults・正規化は不変',()=>{
  assert.equal(c.storageKey,'vivy-checker-v1');assert.equal(c.storageKey,old.storageKey);
  assert.deepEqual(clone(c.defaults),clone(old.defaults));
  assert.deepEqual(clone(c.mergeKeys),clone(old.mergeKeys));
  assert.deepEqual(clone(restored),clone(old.normalizeState(clone(S),S)));
});
function outputs(state,total){
  assert.deepEqual(clone(c.card.blocks(ctx(state)).find(b=>b[0]==='確定演出')),['確定演出',`計${total}回`]);
  assert.match(c.template(ctx(state)).split('\n')[1],new RegExp(`確定演出${total}回$`));
}
check('4種各1回: カード・サマリー・コピー集計',()=>{
  outputs(restored,4);
  assert.equal(c.card.bottom(ctx(restored)).columns[0].items[0].text,'確定演出 全員集合(6濃厚) ×1');
});
check('残り5種・全トロフィーは集計外',()=>{
  const s=clone(restored);
  for(const [key] of rows.slice(0,5)){s.atEnd[key]=7;outputs(s,4);}
  for(const key of Object.keys(s.trophy)){s.trophy[key]=7;outputs(s,4);}
});
check('全9行の説明・hotと詳細4種hot・独立カウント増減',()=>{
  const html=c.pages(ctx(restored),()=>'')[1]();
  const details=c.card.detail(ctx(restored)).find(b=>b.title==='AT終了画面');
  for(const [key,label,hint,rank] of rows){
    assert.ok(html.includes(JSON.stringify(['atEnd.'+key,label,hint,rank>0])));
    assert.equal(details.items.find(i=>i.label===label).hot,rank>0);
    const s=clone(restored);s.atEnd[key]++;outputs(s,rank>0?5:4);s.atEnd[key]--;outputs(s,4);
  }
});
check('テンプレ本文はmainと数字以外一致・同じ入力なら完全一致',()=>{
  const body=(config,s)=>config.template(ctx(s)).split('■AT終了画面')[1];
  const filled=clone(restored);let n=2;
  for(const group of c.mergeKeys)for(const key of Object.keys(filled[group]))filled[group][key]=n++;
  for(const s of [restored,filled]){
    assert.equal(body(c,s),body(old,s));
    assert.equal(body(c,s).replace(/\d+/g,'#'),body(old,old.defaults).replace(/\d+/g,'#'));
  }
});
check('本体の差分は指定9行・ヒント・出典コメントのみ',()=>{
  let expected=oldSource;
  for(const [key,label,hint,rank] of rows)expected=expected.replace(JSON.stringify([key,label,'調査中',0]),JSON.stringify([key,label,hint,rank]));
  expected=expected.replace('AT終了画面は全9種類です。示唆内容は調査中のため、記録のみです。','AT終了画面は全9種類です。クマ・手を伸ばす・ミニキャラ・全員集合は確定演出の回数に入ります。');
  const lines=expected.split('\n');lines[1]+='2026-11-27 更新分（AT終了画面の示唆）を反映。';
  assert.equal(source,lines.join('\n'));
  assert.equal(read('vivy-checker.html'),baseline('vivy-checker.html').replace('vivy.js?v=20261102-nana','vivy.js?v=20261128'));
});
check('NEWは11/28のゴジエヴァ2・Vivyの順・末尾2行削除・8行',()=>{
  const before=baseline('index.html'),now=read('index.html');
  const news=s=>s.split('<div class="section-label">NEW</div>')[1].split('</section>')[0].match(/    <p>.*<\/p>\n/g);
  const previous=news(before),current=news(now);
  assert.equal(current.length,8);
  assert.deepEqual(current,['    <p>11/28｜<a href="godzieva2-checker.html">ゴジエヴァ2 モスラ初期G数の記録と終了ボイスの示唆を追加</a></p>\n','    <p>11/28｜<a href="vivy-checker.html">Vivy AT終了画面の示唆を追加</a></p>\n',...previous.slice(0,-2)]);
  assert.equal(now,before.replace(previous.join(''),current.join('')));
});
check('ガイドは指定2文だけ変更・構成とCSSは不変',()=>{
  const expected=baseline('vivy-guide.html')
    .replace('AT終了画面は全9種類です。示唆内容は調査中のため、記録のみです。','AT終了画面は全9種類です。示唆内容は各行に表示しています。クマ（設定2以上濃厚）・手を伸ばす（設定4以上濃厚）・ミニキャラ（設定5以上濃厚）・全員集合（設定6濃厚）は確定演出として集計します。')
    .replace('獲得枚数表示とED中の2体以上だけを確定演出として集計します。','AT終了画面の4種、獲得枚数表示、ED中の2体以上を確定演出として集計します。');
  assert.equal(read('vivy-guide.html'),expected);
});
console.log(`vivy-atend-1127: ${checks} passed / 0 failed`);

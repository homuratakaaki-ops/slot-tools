// node tests/tenten-1021.verify.mjs
// 転生王女：リールロック発生率の記録（1段階目・2段階目）。指示書 fix/tenten-1021（シオン 2026-10-21）
// 出典：ちょんぼりすた https://chonborista.com/slot/orinpia-slot/264134/ のリールロック発生率の表
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=src=>{const box={window:{}};vm.runInNewContext(src,box);return box.window.CheckerConfigs.tenten;};
const c=load(read('checker-data/tenten.js'));
const clone=x=>JSON.parse(JSON.stringify(x));
const state=()=>clone(c.defaults);
const rows=S=>{const out=[];const ctx={S,mode:1,crow:(...args)=>{out.push(args);return `<div class="crow" data-c="${args[0]}">${args[1]}|${args[2]}</div>`;},pct:()=>''};return {html:c.pages(ctx,()=>'')[0](),rows:out};};

// (1) lock1/lock2 の増減と 1/x 表示（AT初当りと同じ rateSuffix・countRate）
{
  const S=state();
  assert.deepEqual(clone(S.lock),{lock1:0,lock2:0});
  assert.ok(c.mergeKeys.includes('lock'));
  let r=rows(S);
  const lockRows=r.rows.filter(x=>x[0].startsWith('lock.'));
  assert.deepEqual(lockRows.map(x=>x.slice(0,4)),[
    ['lock.lock1','リールロック1段階目','設1:1/1091.4⇔設6:1/1017.2',false],
    ['lock.lock2','リールロック2段階目','設1:1/1359.1⇔設6:1/939.1',false]
  ]);
  // 通常ゲーム数が空のあいだは 1/x を出さない
  S.lock.lock1=3;r=rows(S);
  assert.equal(r.rows.find(x=>x[0]==='lock.lock1')[2],'設1:1/1091.4⇔設6:1/1017.2');
  // 増：3000G・1段階目3回・2段階目1回
  S.games=3000;S.lock.lock2=1;r=rows(S);
  assert.equal(r.rows.find(x=>x[0]==='lock.lock1')[2],'設1:1/1091.4⇔設6:1/1017.2 / 現在 1/1000.0');
  assert.equal(r.rows.find(x=>x[0]==='lock.lock2')[2],'設1:1/1359.1⇔設6:1/939.1 / 現在 1/3000.0');
  // AT初当りと同じ書式
  S.counts.at=10;r=rows(S);
  assert.equal(r.rows.find(x=>x[0]==='counts.at')[2],'設1:1/320.0⇔設6:1/246.4 / 現在 1/300.0');
  // 減：0回に戻ると 1/x が消える
  S.lock.lock2=0;r=rows(S);
  assert.equal(r.rows.find(x=>x[0]==='lock.lock2')[2],'設1:1/1359.1⇔設6:1/939.1');
  // 初当りセクションの直後、CZセクションより前
  const h=r.html;
  const iInit=h.indexOf('<div class="sec-h">初当り</div>'),iLock=h.indexOf('<div class="sec-h">リールロック</div>'),iCz=h.indexOf('CZ（エピソードバトル）最終レベル別の成功');
  assert.ok(iInit>=0&&iInit<iLock&&iLock<iCz,'リールロックの節の位置');
  assert.ok(h.includes('<div class="hint">通常時のリールロックを段階ごとに記録します。1段階目と2段階目は別々に数えます。3段階目（ロングフリーズ）は発生率が公表されていないため記録欄を置いていません。発生回数は少ないので、設定を読む材料としては補助です。</div>'));
  console.log('PASS 1: lock1/lock2 rows, 1/x suffix same as AT, position after 初当り, hint text');
}

// (2) 旧保存データに lock が無くても0で補完（未知キーは残す・不正値は0）
{
  const old={games:1200,counts:{at:4,future:7},cz:{lv1d:2,lv1n:1},future:{keep:true}};
  const S=c.normalizeState(clone(old));
  assert.deepEqual(clone(S.lock),{lock1:0,lock2:0});
  assert.equal(S.counts.at,4);assert.equal(S.counts.future,7);assert.equal(S.future.keep,true);assert.equal(S.cz.lv1n,1);
  const bad=c.normalizeState({lock:{lock1:'5',lock2:-3,x:2}});
  assert.deepEqual(clone(bad.lock),{lock1:5,lock2:0,x:2});
  const nul=c.normalizeState({lock:null});
  assert.deepEqual(clone(nul.lock),{lock1:0,lock2:0});
  console.log('PASS 2: legacy data without lock fills 0, keeps unknown keys, clamps negatives');
}

// (3) tplText・detail・カード下段に出る
{
  const S=state();S.games=3000;S.lock.lock1=2;S.lock.lock2=1;S.counts.at=5;
  const tpl=c.template({S});
  assert.ok(tpl.includes('\n\n■初当り\nAT初当り▶5回 1/600.0\nCZ▶0回\n\n■リールロック\n1段階目▶2回 1/1500.0\n2段階目▶1回 1/3000.0\n\n■CZ最終レベル\n'),tpl);
  assert.equal(c.compactTemplate({S}),tpl);
  const zero=c.template({S:state()});
  assert.ok(zero.includes('\n\n■リールロック\n1段階目▶0回\n2段階目▶0回\n\n■CZ最終レベル\n'));
  const detail=c.card.detail({S});
  assert.deepEqual(clone(detail.map(d=>d.title)),['初当り','リールロック','CZ最終レベル','150G以内','ポイントMAX','ボーナス終了画面','獲得枚数表示']);
  assert.deepEqual(clone(detail[1]),{title:'リールロック',items:[
    {label:'1段階目',value:2,text:'1段階目 2回 1/1500.0',show:true,hot:false},
    {label:'2段階目',value:1,text:'2段階目 1回 1/3000.0',show:true,hot:false}
  ]});
  assert.deepEqual(clone(c.card.detail({S:state()})[1].items.map(i=>i.show)),[false,false]);
  const bottom=c.card.bottom({S});
  assert.deepEqual(clone(bottom.columns.map(col=>col.items.length)),[6,5]);
  assert.deepEqual(clone(bottom.columns[0].items[5]),{text:'ロック 1段:2・2段:1',value:3,active:true});
  assert.equal(c.card.bottom({S:state()}).columns[0].items[5].active,false);
  // 6行目の基線は 932。フッター（slot-tools.jp）は H-104=976
  assert.equal(bottom.startY+5*bottom.rowGap,932);
  assert.ok(932+bottom.fontSize<976);
  // 推定は無い（設定推測タブなし・表示のみ）。blocks と chart は変わらない
  assert.deepEqual(clone(c.card.blocks({S})),[['AT初当り 5回','1/600.0'],['CZ','0回'],['通常ゲーム数','3000G'],['確定演出','計0回']]);
  console.log('PASS 3: template section, detail section, card summary row (6th, y=932)');
}

// (4) 正規化の冪等性
{
  const S=state();S.games=999;S.lock={lock1:3,lock2:'2'};S.cz.lv1d=1;S.cz.lv1n=5;S.g150={d:1,n:4};
  const once=clone(c.normalizeState(clone(S)));
  const twice=clone(c.normalizeState(clone(once)));
  assert.deepEqual(twice,once);
  assert.deepEqual(once.lock,{lock1:3,lock2:2});
  for(const legacy of [{},{games:10},{lock:{lock1:1}}]){const a=clone(c.normalizeState(clone(legacy)));assert.deepEqual(clone(c.normalizeState(clone(a))),a);}
  console.log('PASS 4: normalizeState idempotent (5 inputs)');
}

// 出典の12値がガイドの表と一致し、ガイドの「扱っていない項目」から1・2段階目が外れている
{
  const guide=read('tenten-guide.html');
  const v=[['1091.4','1359.1'],['1085.2','1313.6'],['1055.9','1127.0'],['1041.1','1048.5'],['1027.0','981.8'],['1017.2','939.1']];
  const part=guide.split('<h2>リールロック</h2>')[1].split('</section>')[0];
  v.forEach((x,i)=>assert.ok(part.includes(`<tr><td>設定${i+1}</td><td>1/${x[0]}</td><td>1/${x[1]}</td></tr>`),'guide 設定'+(i+1)));
  assert.ok(!guide.includes('リールロック発生率は、まれで分母が取れない'));
  assert.ok(guide.includes('リールロック3段階目（ロングフリーズ）は、発生率が公表されていないため扱っていません。'));
  assert.ok(guide.indexOf('<h2>初当り</h2>')<guide.indexOf('<h2>リールロック</h2>')&&guide.indexOf('<h2>リールロック</h2>')<guide.indexOf('<h2>CZ（エピソードバトル）最終レベル別の成功</h2>'));
  assert.ok(read('tenten-checker.html').includes('<script src="checker-data/tenten.js?v=20261021"></script>'));
  console.log('PASS 5: guide table 12 values, out-of-scope note, ?v=20261021');
}

// main からの差分：既存の項目（初当り・CZ・150G・ポイントMAX・示唆）の出力は不変
{
  const base=load(execFileSync('git',['show','4ebb085:checker-data/tenten.js'],{encoding:'utf8'}));
  const S=state();S.games=2000;S.counts.at=6;S.cz={lv1d:3,lv1n:1,lv2d:2,lv2n:1,lv3d:4,lv3n:2,lv4:1};S.g150={d:5,n:3};S.pt={d:4,n:1};S.screens.kokage=3;S.screens.ryo=1;S.over.o456=1;S.lock={lock1:1,lock2:2};
  const strip=t=>t.replace(/\n\n■リールロック\n[^■]*?\n\n■CZ/,'\n\n■CZ');
  assert.equal(strip(c.template({S})),base.template({S}));
  const d=clone(c.card.detail({S}));d.splice(1,1);assert.deepEqual(d,clone(base.card.detail({S})));
  const b=clone(c.card.bottom({S}));b.columns[0].items.pop();assert.deepEqual(b,clone(base.card.bottom({S})));
  for(const k of ['blocks','chart'])assert.deepEqual(clone(c.card[k]({S})),clone(base.card[k]({S})));
  const legacy={games:100,counts:{at:1}};const n=clone(c.normalizeState(clone(legacy)));delete n.lock;assert.deepEqual(n,clone(base.normalizeState(clone(legacy))));
  console.log('PASS 6: everything except the lock additions equals 4ebb085');
}

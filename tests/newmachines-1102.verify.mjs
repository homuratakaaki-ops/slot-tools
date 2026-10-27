// node tests/newmachines-1102.verify.mjs — 11/2導入5機種の最小版（指示書【作業②】2026-10-28）。
// 目安値は指示書の値をここに直書きし（独立期待値）、仕様書の表・画面・参照タブの3か所と突き合わせる。
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
let checks=0,failures=0;
function check(name,fn){try{fn();checks++;console.log('PASS '+name);}catch(e){failures++;console.error('FAIL '+name+'\n'+e.stack);}}
const PENDING='設定示唆（終了画面・トロフィーなど）は出典で調査中です。公表され次第この機種に追加します。';
const THIRD='当ページの解析値は第三者の独自調査値です。';
const EXPECTED={
  ragnador:{title:'スマスロ ラグナドール',url:'https://chonborista.com/slot/universal-slot/266983/',
    counts:[['cz','CZ',[172.8,167.2,161.8,145.0,143.0,142.4]],['at','AT初当り',[326.4,317.2,307.7,271.2,260.8,258.3]]],
    hint:'連動アプリでAT間G数が確認できる場合はそれを通常Gに使えます（直ATはCZに数えない）。'},
  garo:{title:'L牙狼 闇を照らす者',url:'https://chonborista.com/slot/sansei-slot/270768/',
    counts:[['cz','トータルCZ',[156.6,154.6,151.4,148.7,144.2,141.1]],['bonus','BONUS初当り',[291.1,283.7,276.1,265.8,259.4,256.5]]],
    hint:'牙狼モード・魔界の通常CZを合算。『金色になれ！』は別段階で数えない。SUPER GARO BONUS・RUSH は初当りに含めない。'},
  ggo:{title:'Lソードアート・オンライン オルタナティブ ガンゲイル・オンライン',url:'https://chonborista.com/slot/kyoraku-slot/267264/',
    counts:[['bonus','通常ボーナス初当り',[192.0,189.2,180.9,168.6,155.4,153.9]],['sj','SJ初当り',[521.7,510.4,486.6,445.3,405.0,392.6]]],
    hint:'SJ中の報酬ボーナスは通常初当りに数えない。'},
  godzieva2:{title:'Lパチスロ ゴジラ対エヴァンゲリオン2',url:'https://chonborista.com/slot/bisty-slot/267113/',
    counts:[['first','初当り',[234.2,229.0,221.8,207.0,201.5,195.0]],['at','AT',[460.5,446.5,425.5,390.4,374.2,355.5]]],
    hint:'ボーナスのストック放出・上位移行・引戻しは初当りに数えない。'},
  vivy:{title:"スロット Vivy -Fluorite Eye's Song-",url:'https://chonborista.com/slot/daito-slot/268864/',
    counts:[['at','AT初当り',[276.5,251.7,272.1,222.8,235.9,210.3]]],
    target:{at:'設1:1/276.5⇔設6:1/210.3（設定順に並びません。参照タブ参照）'},
    hint:'引戻しは数えない。アクセスチャンス（ポイント獲得）はCZではない。アクセスチャンスの継続回数は内部値と一致しないため記録しない。'}
};
function load(id){const box={window:{}};vm.createContext(box);vm.runInContext(read('checker-data/'+id+'.js'),box);return box.window.CheckerConfigs[id];}
function ctx(S){return {S,pct:(v,d)=>d>0?`${v}/${d} ${(100*v/d).toFixed(0)}%`:`${v}/0 —`,crow:(key,label,sub,hot,pct)=>{
  const [group,id]=key.split('.');return `<div data-c="${key}"><b>${label}</b><small>${sub}</small><span class="pct">${pct?pct(S[group][id]):''}</span></div>`;
}};}
// 仕様書「## 3.」の表を読む（列：設定 / 各カウント / 出玉率）。
function specTable(id){
  const sec=read(`docs/specs/${id}-checker-v01.md`).split('## 3.')[1].split('## 4.')[0];
  const lines=sec.split('\n').filter(l=>l.startsWith('|'));
  const head=lines[0].split('|').slice(1,-1).map(s=>s.trim());
  const rows=lines.slice(2).map(l=>l.split('|').slice(1,-1).map(s=>s.trim()));
  return {head,rows};
}
const checkerFiles=fs.readdirSync(root).filter(p=>p.endsWith('-checker.html'));
for(const [id,E] of Object.entries(EXPECTED)){
  const c=load(id),fresh=()=>c.normalizeState(clone(c.defaults));
  check(id+': 目安値が指示書・仕様書・画面・参照タブで一致',()=>{
    const {head,rows}=specTable(id);
    assert.deepEqual(head,['設定',...E.counts.map(x=>x[1]),'出玉率']);
    assert.equal(rows.length,6);
    const ref=c.pages(ctx(fresh()),()=>'')[1](),input=c.pages(ctx(fresh()),()=>'')[0]();
    E.counts.forEach(([key,label,dens],ci)=>{
      dens.forEach((d,i)=>{assert.equal(rows[i][ci+1],'1/'+d.toFixed(1),`${id} ${label} 設定${i+1}`);assert.ok(ref.includes(label+' 1/'+d.toFixed(1)),`${id} ref ${label} ${i+1}`);});
      const target=(E.target||{})[key]||`設1:1/${dens[0].toFixed(1)}⇔設6:1/${dens[5].toFixed(1)}`;
      assert.ok(input.includes(`data-c="counts.${key}"><b>${label}</b><small>${target}</small>`),id+' '+key);
    });
    rows.forEach((r,i)=>{assert.equal(r[0],String(i+1));assert.ok(ref.includes(`<td>設定${i+1}</td>`)&&ref.includes('出玉率 '+r[r.length-1]),id+' payout '+(i+1));});
    assert.deepEqual(Object.keys(c.defaults.counts),E.counts.map(x=>x[0]));
    assert.ok(input.startsWith(input.match(/^<style>[\s\S]*?<\/style>/)[0]+`<div class="hint">${PENDING}</div>`),'入力タブ先頭の調査中 hint');
    assert.ok(input.includes(`<div class="hint">${E.hint}</div>`));
    assert.ok(ref.includes(THIRD));assert.doesNotMatch(ref+input,/設定差なし|メーカー公式/);
    if(id==='vivy')assert.ok(ref.includes('設定1＜設定3＜設定2＜設定5＜設定4＜設定6'));
  });
  check(id+': 1/x・テンプレ・カード・detail',()=>{
    const S=fresh();S.startGames=100;S.currentGames=3100;
    E.counts.forEach(([key],i)=>{S.counts[key]=[12,7][i];});
    const input=c.pages(ctx(S),()=>'')[0]();
    E.counts.forEach(([key,label],i)=>{
      const v=[12,7][i],x='1/'+(3000/v).toFixed(1);
      assert.ok(input.split(`data-c="counts.${key}"`)[1].includes(`<span class="pct">${x}</span>`),key);
      assert.ok(c.template(ctx(S)).includes(`${label}▶${v}回（${x}）`));
      assert.equal(c.card.blocks(ctx(S))[i][1],x);
      assert.equal(c.card.detail(ctx(S))[0].items[i].text,`${label} ×${v} ${x}`);
      assert.equal(c.card.bottom(ctx(S)).columns[0].items[i].text,`${label} ${v}回 ${x}`);
    });
    const blocks=c.card.blocks(ctx(S));assert.deepEqual(clone(blocks[blocks.length-1]),['通常G','3000G']);assert.ok(blocks.length<=4);
    for(const b of blocks)assert.ok([...b[0]].length<=8,b[0]);
    assert.equal(c.card.chart(ctx(S)).items.length,E.counts.length);
    const t=c.template(ctx(S));assert.ok(t.startsWith(`設定判別メモ｜${E.title}\n通常回転 3000G`));assert.ok(t.endsWith('by slot-tools.jp\n解析出典:ちょんぼりすた様'));
    assert.equal(c.compactTemplate(ctx(S)),t);assert.ok(!c.template(ctx(fresh())).includes('■'));
    const z=fresh();z.currentGames=500;assert.equal(c.card.blocks(ctx(z))[0][1],'−');
    z.startGames=900;assert.match(c.pages(ctx(z),()=>'')[0](),/下回っています/);assert.equal(c.card.blocks(ctx(z)).at(-1)[1],'−');
    const b=c.card.bottom(ctx(S));assert.equal(b.startY,760);assert.ok(b.columns.every(col=>760+44*(col.items.length-1)<=936));
  });
  check(id+': 旧データ補完・不正値・未知キー保持・冪等',()=>{
    const first=E.counts[0][0];
    const old={currentGames:'800.7',startGames:-3,counts:{[first]:'4.9',future:3.2},futureRoot:'keep'};
    const a=c.normalizeState(clone(old)),b=c.normalizeState(clone(a));
    assert.deepEqual(clone(a),clone(b));assert.equal(a.counts[first],4);assert.equal(a.counts.future,3);assert.equal(a.futureRoot,'keep');
    assert.equal(a.currentGames,800);assert.equal(a.startGames,0);
    for(const [key] of E.counts)assert.ok(Number.isInteger(a.counts[key])&&a.counts[key]>=0);
    assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));
    assert.equal(c.normalizeState({counts:{[first]:NaN}}).counts[first],0);
  });
  check(id+': HTML（noindex・導線なし・3タブ・LF・構文）',()=>{
    assert.equal(c.storageKey,id+'-checker-v1');assert.equal(c.uiV2,true);assert.equal(c.nanaCollab,false);assert.equal(c.sourceUrl,E.url);
    assert.deepEqual(clone(c.mergeKeys),['counts']);assert.equal(c.pages(ctx(c.defaults),()=>'').length,3);
    assert.equal(c.card.title,E.title);assert.ok(c.card.footerTags.endsWith(' #設定判別'));
    const html=read(id+'-checker.html');
    assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','参照','カード']);
    assert.ok(html.includes('grid-template-columns:repeat(3,1fr)'));assert.ok(!html.includes('checker-bayes.js'));
    for(const s of ['checker-engine.js?v=20260924',`checker-data/${id}.js?v=20261028`,`CheckerEngine.mount(CheckerConfigs.${id});`,`${id}-guide.html`,`<div class="hd-title">${E.title}<small>`])assert.ok(html.includes(s),s);
    for(const p of ['checkers.html','index.html','sitemap.xml'])assert.ok(!read(p).includes(id+'-checker')&&!read(p).includes(id+'-guide'),p+' に導線なし');
    const tmp=fs.mkdtempSync(path.join(os.tmpdir(),id+'-syntax-'));
    for(const [i,p] of [id+'-checker.html',id+'-guide.html'].entries()){
      const src=read(p);assert.ok(src.includes('<meta name="robots" content="noindex,nofollow">'),p);
      assert.ok(src.includes(`href="https://slot-tools.jp/${p}"`));assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/ +\n/);
      for(const [j,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){
        const f=path.join(tmp,`${i}-${j}.mjs`);fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);
      }
    }
    const src=read('checker-data/'+id+'.js');assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);
    assert.ok(read(id+'-guide.html').includes(PENDING));
    assert.ok(checkerFiles.includes(id+'-checker.html'));
  });
}
console.log(`newmachines-1102: ${checks} passed / ${failures} failed`);
if(failures)process.exitCode=1;

// node tests/godzieva2-nana.verify.mjs — v0.2 / 独立期待値と原文を使用。
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
const doc={value:'',getElementById:id=>id==='gameLogIn'?{value:doc.value}:null};
const box={window:{},document:doc};vm.createContext(box);vm.runInContext(read('checker-data/godzieva2.js'),box);
const c=box.window.CheckerConfigs.godzieva2,fresh=()=>c.normalizeState(clone(c.defaults));
const CREDIT='ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr';
const ctx=(S,mode=1)=>({S,mode,nanaCreditText:()=>CREDIT,pct:(v,d)=>d>0?`${v}/${d} ${(100*v/d).toFixed(0)}%`:`${v}/0 —`,crow:(key,label,sub,hot,pct)=>{
  const [group,id]=key.split('.');return `<div data-c="${key}" data-hot="${!!hot}"><b>${label}</b><small>${sub}</small><span class="pct">${pct?pct(S[group][id]):''}</span></div>`;
}});
const G=[100,250,400,550,700,850];
const END=['shinji','rei','mari','asuka','mothra','xrei','reiBg','godzillaShogoki','allStars','kaworu'];
const VOICE=['shinji','asuka','misato','gendo','kaworu'];
const RATES=[['suika','normal'],['suika','at'],...['after','other'].flatMap(p=>G.map(g=>['kitei',p+g]))];
const GROUPS=['counts','suika','kitei','endScreen','edVoice'];
const COUNT=[['first','ボーナス初当り',[234.2,229.0,221.8,207.0,201.5,195.0]],['at','AT',[460.5,446.5,425.5,390.4,374.2,355.5]]];
const PAY=[97.7,98.9,101.2,105.8,110.6,114.9],CZ=[21.9,23.4,25.0,28.1,29.7,31.3];
const raw=read('docs/specs/godzieva2-nana-template-v01.txt');
// 実装の定数・正規表現を流用せず、原文を行ごとに加工して期待値を作る。
function expected(S){
  const g=S.gameLog.reduce((a,v)=>a+v,0),rate=n=>g>0&&n>0?'1/'+(g/n).toFixed(1):'';
  const fractions=[S.suika.normalW+'/'+S.suika.normalD,S.suika.atW+'/'+S.suika.atD,...G.flatMap(v=>['after','other'].map(p=>S.kitei[p+v+'W']+'/'+S.kitei[p+v+'D']))];
  const counts=[...END.map(k=>S.endScreen[k]),...VOICE.map(k=>S.edVoice[k])];let fi=0,ci=0;
  const body=raw.split('\n').flatMap(line=>{
    for(const [a,b] of [[150,100],[300,250],[450,400],[600,550],[750,700]])line=line.split(a+'g').join(b+'g');
    line=line.split('0/0').reduce((acc,part,i)=>acc+(i?fractions[fi++]: '')+part,'');
    if(line.trimEnd().endsWith('▶︎'))line=line.trimEnd()+' '+counts[ci++]+'回';
    return line==='■ボーナス当選率'?[line,'ボーナス▶︎ '+S.counts.first+'回'+(rate(S.counts.first)?'（'+rate(S.counts.first)+'）':'')]:[line];
  }).join('\n');
  return `設定判別メモ｜Lパチスロ ゴジラ対エヴァンゲリオン2\n累計通常G ${g}G（${S.gameLog.length}件） / AT${S.counts.at}回${rate(S.counts.at)?' '+rate(S.counts.at):''}\n_______\n\n${body}\n\nby slot-tools.jp\n${CREDIT}\n解析出典:ちょんぼりすた様`;
}
check('目安値・仕様書§3・入力・参照',()=>{
  const S=fresh(),pages=c.pages(ctx(S),()=>''),input=pages[0](),ref=pages[2]();
  const rows=read('docs/specs/godzieva2-checker-v02.md').split('## 3.')[1].split('## 4.')[0].split('\n').filter(l=>/^\| [1-6] \|/.test(l)).map(l=>l.split('|').slice(1,-1).map(x=>x.trim()));
  assert.equal(rows.length,6);
  for(let i=0;i<6;i++){
    assert.deepEqual(rows[i],[String(i+1),...COUNT.map(x=>'1/'+x[2][i].toFixed(1)),PAY[i].toFixed(1)+'%',CZ[i].toFixed(1)+'%']);
    for(const [,label,values] of COUNT)assert.ok(ref.includes(label+' 1/'+values[i].toFixed(1)));
    assert.ok(ref.includes('出玉率 '+PAY[i].toFixed(1)+'%'));assert.ok(ref.includes(CZ[i].toFixed(1)+'%'));
  }
  for(const [key,label,v] of COUNT)assert.ok(input.includes(`<b>${label}</b><small>設1:1/${v[0].toFixed(1)}⇔設6:1/${v[5].toFixed(1)}</small>`),key);
  assert.ok(input.includes('設1:21.9%⇔設6:31.3%'));assert.ok(ref.includes('当ページの解析値は第三者の独自調査値です。'));
  assert.ok(!input.includes('設定示唆（終了画面・トロフィーなど）は出典で調査中'));
  assert.ok(input.includes('今まわしている未当選区間のG数は分母に含めません。'));
  assert.equal((input.match(/class="hint hint-paras"/g)||[]).length,1);
});
check('状態キー・v0.1補完・不正値・未知キー保持・冪等',()=>{
  assert.deepEqual(clone(c.mergeKeys),GROUPS);assert.deepEqual(clone(c.normalizeState({})),clone(c.defaults));
  const old={games:'12.9',gameLog:['800.7',-3,'x',0,250],counts:{first:'4.9',future:{keep:true}},futureRoot:'keep'};
  const S=c.normalizeState(clone(old));assert.equal(S.counts.first,4);assert.equal(S.counts.at,0);assert.deepEqual(clone(S.counts.future),{keep:true});assert.equal(S.futureRoot,'keep');assert.equal(S.games,12);
  assert.deepEqual(clone(S.gameLog),[800,250]);assert.deepEqual(clone(c.normalizeState(clone(S))),clone(S));
  for(const group of GROUPS.slice(1))assert.ok(Object.values(S[group]).every(v=>v===0));
  assert.deepEqual(Object.keys(S.endScreen),END);assert.deepEqual(Object.keys(S.edVoice),VOICE);
  for(const [group,key] of RATES){const v=fresh();v[group][key+'D']=-3;v[group][key+'W']='4.9';v[group].future={text:'keep'};c.normalizeState(v);assert.equal(v[group][key+'D'],4);assert.equal(v[group][key+'W'],4);assert.deepEqual(v[group].future,{text:'keep'});assert.deepEqual(clone(c.normalizeState(clone(v))),clone(v));}
  for(const group of GROUPS)for(const key of Object.keys(c.defaults[group]))for(const invalid of [-1,NaN,Infinity,'bad',null]){const S=fresh();S[group][key]=invalid;c.normalizeState(S);assert.equal(S[group][key],0);}
  assert.deepEqual(clone(c.normalizeState({gameLog:'500'}).gameLog),[]);
});
check('1/x・カード本体はv0.1維持',()=>{
  const S=fresh();S.gameLog=[1200,800,1000];S.counts={first:12,at:7};const cx=ctx(S),input=c.pages(cx,()=>'')[0]();
  COUNT.forEach(([key,label],i)=>{const n=[12,7][i],rate='1/'+(3000/n).toFixed(1);assert.ok(input.split(`data-c="counts.${key}"`)[1].includes(rate));assert.equal(c.card.blocks(cx)[i][1],rate);assert.equal(c.card.detail(cx)[0].items[i].text,`${label} ×${n} ${rate}`);assert.equal(c.card.bottom(cx).columns[0].items[i].text,`${label} ${n}回 ${rate}`);});
  assert.deepEqual(clone(c.card.blocks(cx).at(-1)),['通常G','3000G']);assert.equal(c.card.chart(cx).items.length,2);assert.equal(c.card.metaText(cx,'2026/11/01'),'2026/11/01  累計通常G 3000G（3件）');assert.equal(c.card.bottom(cx).startY,760);
  const z=fresh();z.counts.first=5;z.startGames=100;z.currentGames=3100;assert.equal(c.card.blocks(ctx(z))[0][1],'—');assert.ok(!c.template(ctx(z)).includes('1/'));
});
check('当選Gの追加取消・空入力・小数',()=>{
  const S=fresh(),cx=ctx(S);for(const v of ['',0,-5,'abc']){doc.value=v;assert.equal(c.actions.addGameLog(cx),false);}assert.equal(c.actions.popGameLog(cx),false);
  doc.value='312';assert.equal(c.actions.addGameLog(cx),'当選G 312G を追加');doc.value='88.9';assert.equal(c.actions.addGameLog(cx),'当選G 88G を追加');assert.deepEqual(clone(S.gameLog),[312,88]);assert.equal(c.card.blocks(cx).at(-1)[1],'400G');
  assert.equal(c.actions.popGameLog(cx),'当選G 88G を取り消し');assert.deepEqual(clone(S.gameLog),[312]);
});
check('テンプレ全0・原文から独立構築した全体と完全一致',()=>{assert.equal(Buffer.byteLength(raw),800);assert.ok(!raw.endsWith('\n'));assert.equal(c.template(ctx(fresh())),expected(fresh()));});
for(const [group,key] of [...RATES.flatMap(([g,k])=>[[g,k+'D'],[g,k+'W']]),...END.map(k=>['endScreen',k]),...VOICE.map(k=>['edVoice',k]),['counts','first'],['counts','at']]){
  check('テンプレ単項目 '+group+'.'+key,()=>{
    const S=fresh(),base=c.template(ctx(S)).split('\n');S[group][key]=1;c.normalizeState(S);
    const text=c.template(ctx(S));assert.equal(text,expected(S));const changed=text.split('\n').filter((line,i)=>line!==base[i]);assert.equal(changed.length,1);
    if(group==='counts')assert.ok(key==='first'?changed[0].startsWith('ボーナス▶︎ 1回'):changed[0].startsWith('累計通常G '));
    else if(key.endsWith('W'))assert.ok(changed[0].includes('1/1'));else if(key.endsWith('D'))assert.ok(changed[0].includes('0/1'));
  });
}
check('全項目異なる値・テンプレ順序・分母ありのボーナス初当り/AT',()=>{
  const S=fresh();S.gameLog=[1000,2000];let i=1;for(const group of GROUPS)for(const key of Object.keys(S[group]))S[group][key]=i++;c.normalizeState(S);
  assert.equal(c.template(ctx(S)),expected(S));assert.equal(c.compactTemplate(ctx(S)),c.template(ctx(S)));
});
check('入力順・減算境界・終了画面の割合・ED割合なし',()=>{
  const S=fresh(),html=c.pages(ctx(S,-1),()=>'')[0]();assert.equal((html.match(/disabled aria-disabled="true"/g)||[]).length,14);
  const names=[...html.matchAll(/class="ct"><b>(.*?)<\/b>/g)].map(m=>m[1]);assert.deepEqual(names,['通常時','AT中',...['AT後 ','AT後以外 '].flatMap(p=>G.map(g=>p+g+'G'))]);
  S.suika.normalD=2;S.suika.normalW=1;assert.ok(c.pages(ctx(S,-1),()=>'')[0]().includes('data-bump="suika.normalD"'));
  S.endScreen.shinji=3;S.endScreen.rei=1;S.edVoice.misato=1;const shisa=c.pages(ctx(S),()=>'')[1]();assert.ok(shisa.includes('計4回'));assert.ok(shisa.split('エンディング中ボイス')[0].includes('<div class="hint">ATを獲得したボーナスの後は終了画面が出ません。</div>'),'終了画面の説明（v0.2.1）');assert.equal((html.match(/class="crow cycle-row role-row"/g)||[]).length,2,'補足のある2行だけ role-row（v0.2.1）');assert.ok(shisa.includes('3/4 75%'));assert.ok(!shisa.includes('data-hot="true"'));assert.ok(shisa.split('data-c="edVoice.misato"')[1].startsWith(' data-hot="false"><b>ミサト</b><small>示唆内容は調査中</small><span class="pct"></span>'));
});
check('詳細カード全項目36行・母数0非表示・終了画面割合',()=>{
  const S=fresh();for(const group of GROUPS)for(const key of Object.keys(S[group]))S[group][key]=1;
  const sections=c.card.detail(ctx(S)),rows=sections.reduce((sum,sec)=>{const items=sec.items.filter(item=>item&&item.show!==false&&((item.value||0)>0||item.text));return sum+items.length+(items.length>1?1:0);},0);
  assert.equal(rows,36);assert.ok(rows<=40);assert.deepEqual(clone(sections.map(s=>s.title)),['カウント系','スイカCZ','規定G','終了画面','EDボイス']);
  assert.deepEqual(clone(sections[3].items.map(x=>x.label)),['シンジ(奇数)','レイ(偶数)','マリ(高弱)','アスカ(高強)','モスラ','Xレイ','レイ背景','ゴジラ初号機','全員集合','カヲル']);
  assert.equal(sections[3].percent,true);assert.equal(sections[3].denominator,10);assert.ok(!sections[4].percent);assert.ok(!sections[4].denominator);
  for(const sec of c.card.detail(ctx(fresh())).slice(1,3))assert.ok(sec.items.every(x=>x.show===false));
  S.kitei.after100W=0;assert.equal(c.card.detail(ctx(S))[2].items[0].text,'AT後100G 0/1 0%');
  // 詳細カードの率の行（スイカCZ・規定G の14行）は入力画面と同じ ratio() の％付き。分母0は％を付けない（§9-47・ネネ検収 11/1）
  const R=fresh();R.suika.normalD=3;R.suika.normalW=2;R.kitei.other850D=8;R.kitei.other850W=1;
  const rd=c.card.detail(ctx(R)),inp=c.pages(ctx(R),()=>'')[0]();
  assert.equal(rd[1].items[0].text,'通常時 2/3 67%');assert.ok(inp.includes('<div class="pct">2/3 67%</div>'),'入力画面と同じ％');
  assert.equal(rd[2].items[11].text,'AT後以外850G 1/8 13%');assert.ok(inp.includes('<div class="pct">1/8 13%</div>'));
  for(const it of [...rd[1].items,...rd[2].items])if(it.show)assert.match(it.text,/ \d+\/[1-9]\d* \d+%$/);else assert.ok(!it.text.includes('%'),it.text);
  assert.equal(rd[1].items[1].text,'AT中 0/0');assert.equal(rd[1].items[1].show,false);
  for(const sec of rd.slice(3))for(const it of sec.items)assert.ok(!it.text||!it.text.includes('/'),'終了画面・EDは件数のみ');assert.equal(c.card.detail(ctx(S))[2].items[0].show,true);
});
check('HTML・ガイド・LF・後読みなし・構文・公開（index可・checkers.html／sitemap／NEW欄）',()=>{
  assert.equal(c.storageKey,'godzieva2-checker-v1');assert.equal(c.uiV2,true);assert.equal(c.nanaCollab,true);assert.equal(c.pages(ctx(fresh()),()=>'').length,4);
  const html=read('godzieva2-checker.html'),guide=read('godzieva2-guide.html');assert.deepEqual([...html.matchAll(/<button data-p="\d"[^>]*>(.*?)<\/button>/g)].map(m=>m[1]),['入力','示唆','参照','カード']);
  for(const text of ['grid-template-columns:repeat(4,1fr)','checker-data/godzieva2.js?v=20261101-nana4','checker-engine.js?v=20261102-orphan','← 機種選択','使い方','G-QCKV9H0DT1'])assert.ok(html.includes(text),text);
  assert.ok(!html.includes('checker-bayes.js'));
  // 11/1 公開（ネネ①②③・％再確認合格、360px 夢爽合格）。導線なしの固定を公開状態の検査に置き換えた。
  const list=read('checkers.html').split('<div class="section-label">スマスロ・AT機</div>')[1];
  assert.ok(list.includes('<a class="checker-main" href="godzieva2-checker.html">Lパチスロ ゴジラ対エヴァンゲリオン2</a><a class="checker-guide" href="godzieva2-guide.html">使い方</a>'),'checkers.html に掲載');
  for(const k of ['checker','guide'])assert.ok(read('sitemap.xml').includes(`<loc>https://slot-tools.jp/godzieva2-${k}.html</loc>\n    <lastmod>2026-11-01</lastmod>`),'sitemap '+k);
  const news=read('index.html').split('<div class="section-label">NEW</div>')[1].split('</section>')[0];
  assert.ok(news.includes('<p>11/2｜<a href="godzieva2-checker.html">L ゴジラ対エヴァンゲリオン2 設定判別カウンターを公開（テンプレ：鈴白なな様）</a></p>'),'NEW欄');
  assert.ok((news.match(/<p>/g)||[]).length<=8,'NEW欄は8行上限（§9-92）');
  for(const text of ['スイカからのCZ','規定ゲーム数','ボーナス・AT終了画面','エンディング中ボイス','カードとテンプレ','テンプレのコピー','2026年11月1日','「入力」「示唆」「参照」「カード」'])assert.ok(guide.includes(text),text);
  assert.ok(!guide.includes('設定示唆（終了画面・トロフィーなど）は出典で調査中'));
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'godzieva2-syntax-'));
  for(const p of ['godzieva2-checker.html','godzieva2-guide.html']){
    const src=read(p);assert.ok(!src.includes('name="robots"'),p+' robots 指定なし（index可）');assert.ok(src.includes(`href="https://slot-tools.jp/${p}"`));assert.ok(!src.includes('\r'));
    for(const [i,m] of [...src.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].entries())if(!/\bsrc=/.test(m[1])){const f=path.join(tmp,p+i+'.mjs');fs.writeFileSync(f,m[2]);execFileSync(process.execPath,['--check',f]);}
  }
  const src=read('checker-data/godzieva2.js');assert.ok(!src.includes('\r'));assert.doesNotMatch(src,/\(\?<([=!])/);execFileSync(process.execPath,['--check',path.join(root,'checker-data/godzieva2.js')]);
});
check('名称「ボーナス初当り」（夢爽 11/1）・保存キーは counts.first のまま・テンプレ本文は不変',()=>{
  const S=fresh();S.counts.first=3;const cx=ctx(S),input=c.pages(cx,()=>'')[0](),ref=c.pages(cx,()=>'')[2](),tpl=c.template(cx);
  assert.ok('first' in c.defaults.counts&&!('bonus' in c.defaults.counts));
  assert.ok(input.includes('<b>ボーナス初当り</b>')&&input.includes('data-c="counts.first"'));
  assert.ok(input.includes('<div class="hint">ボーナスのストック放出・上位移行・引戻しはボーナス初当りに数えない。</div>'));
  assert.equal(c.card.blocks(cx)[0][0],'ボーナス初当り');assert.equal(c.card.chart(cx).items[0].label,'ボーナス初当り');
  assert.ok(c.card.detail(cx)[0].items[0].text.startsWith('ボーナス初当り ×3'));assert.ok(c.card.bottom(cx).columns[0].items[0].text.startsWith('ボーナス初当り 3回'));
  assert.ok(ref.includes('ボーナス初当り・AT・出玉率')&&ref.includes('ボーナス初当り 1/234.2'));
  assert.ok(tpl.includes('■ボーナス当選率\nボーナス▶︎ 3回\n'));assert.ok(!tpl.includes('初当り'),'テンプレ本文は「ボーナス▶︎ N回」のまま');
  // 「ボーナス」の付かない「初当り」が画面・ガイド・HTMLに残っていない
  for(const [name,s] of [['input',input],['ref',ref],['detail',JSON.stringify(c.card.detail(cx))],['js',read('checker-data/godzieva2.js')],['html',read('godzieva2-checker.html')],['guide',read('godzieva2-guide.html')]])
    assert.ok(!s.split('ボーナス初当り').join('').includes('初当り'),name);
});
console.log(`godzieva2-nana: ${checks} passed / ${failures} failed`);if(failures)process.exitCode=1;

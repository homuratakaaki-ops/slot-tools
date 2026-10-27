// 出典: ちょんぼりすた様 https://chonborista.com/slot/sansei-slot/270768/
// 2026-10-19 更新分を 2026-10-28 確認（第三者解析）。数値・文言の正本: docs/specs/garo-checker-v01.md
// 出典の設定判別欄が調査中のため、初当り系カウント＋参照表だけの最小構成（推測タブ・示唆タブなし）。
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const TITLE="L牙狼 闇を照らす者";
  // [path の末尾, 行名, 設定別の分母, 目安, カード用の短名]
  const COUNTS=[
    ["cz","トータルCZ",{1:156.6,2:154.6,3:151.4,4:148.7,5:144.2,6:141.1},"設1:1/156.6⇔設6:1/141.1","トータルCZ"],
    ["bonus","BONUS初当り",{1:291.1,2:283.7,3:276.1,4:265.8,5:259.4,6:256.5},"設1:1/291.1⇔設6:1/256.5","BONUS初当り"]
  ];
  const PAYOUT={1:97.5,2:98.8,3:101.2,4:104.6,5:110.5,6:114.9};
  const HINTS={
    pending:'設定示唆（終了画面・トロフィーなど）は出典で調査中です。公表され次第この機種に追加します。',
    games:'データカウンターのG数を入力します。1/xの分母になります。',
    counts:"牙狼モード・魔界の通常CZを合算。『金色になれ！』は別段階で数えない。SUPER GARO BONUS・RUSH は初当りに含めない。"
  };
  const REF_NOTES=['当ページの解析値は第三者の独自調査値です。'];
  const DEF={startGames:0,currentGames:0,games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  function freeGames(S){return n(S,'currentGames')-n(S,'startGames');}
  function freeText(S){const g=freeGames(S);return g>=0?g+'G':'−';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'−';}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
    </style>`;
  }
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),neg=g<0;
    return pageStyle()+`<div class="hint">${HINTS.pending}</div><section class="sec">
      <div class="sec-h">回転数<span class="sub">通常回転 <b style="color:${neg?'#ff5c5c':'#6fd8ff'}">${freeText(S)}</b></span></div>
      <div class="inrow"><label>打ち始めの回転数</label><input type="number" inputmode="numeric" data-number-key="startGames" value="${S.startGames||''}" placeholder="0"></div>
      <div class="inrow" style="margin-top:6px"><label>現在の回転数</label><input type="number" inputmode="numeric" data-number-key="currentGames" value="${S.currentGames||''}" placeholder="0"></div>
      <div class="hint ${neg?'hot':''}">${HINTS.games}${neg?' 現在G数が打ち始めG数を下回っています。':''}</div>
    </section><section class="sec"><div class="sec-h">カウント系</div><div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[3],0,v=>oneIn(v,g))).join('')}</div><div class="hint">${HINTS.counts}</div></section>`;
  }
  const REF_SECTIONS=[
    [COUNTS.map(c=>c[1]).join('・')+'・出玉率',SETTINGS.map(s=>['設定'+s,COUNTS.map(c=>c[1]+' 1/'+c[2][s].toFixed(1)).join(' ／ ')+' ／ 出玉率 '+PAYOUT[s].toFixed(1)+'%']).concat(REF_NOTES.map(t=>['補足',t]))]
  ];
  function pageReference(){
    return pageStyle()+REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div><table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S);
    const lines=COUNTS.filter(c=>n(S.counts,c[0])>0).map(c=>`${c[1]}▶${n(S.counts,c[0])}回（${oneIn(n(S.counts,c[0]),g)}）`);
    return `設定判別メモ｜${TITLE}\n通常回転 ${freeText(S)}\n_______\n`+(lines.length?'\n■カウント系\n'+lines.join('\n')+'\n':'')+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))}];
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    ['startGames','currentGames','games'].forEach(k=>{out[k]=integer(out[k]);});
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=integer(out.counts[k]);});
    if(out.img===undefined)out.img=DEF.img;
    if(out.iconChoice===undefined)out.iconChoice=DEF.iconChoice;
    return out;
  }
  window.CheckerConfigs.garo={
    uiV2:true,nanaCollab:false,storageKey:"garo-checker-v1",defaults:DEF,
    mergeKeys:['counts'],sourceUrl:"https://chonborista.com/slot/sansei-slot/270768/",normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:"#牙狼 #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  通常回転 '+freeText(ctx.S),titleFitMax:650,
      footerTags:"#牙狼 #設定判別",downloadName:"garo_check.png",detailDownloadName:"garo_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))},
        {x:560,items:[row('通常回転 '+freeText(S),Math.max(0,g))]}
      ]};}
    }
  };
})();

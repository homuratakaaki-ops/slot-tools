// 出典: ちょんぼりすた様 https://chonborista.com/slot/bisty-slot/267113/
// 2026-10-26 公開分を 2026-10-28 確認（第三者解析）。数値・文言の正本: docs/specs/godzieva2-checker-v01.md
// 出典の設定判別欄が調査中のため、初当り系カウント＋参照表だけの最小構成（推測タブ・示唆タブなし）。
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const TITLE="Lパチスロ ゴジラ対エヴァンゲリオン2";
  // [path の末尾, 行名, 設定別の分母, 目安, カード用の短名]
  const COUNTS=[
    ["first","初当り",{1:234.2,2:229.0,3:221.8,4:207.0,5:201.5,6:195.0},"設1:1/234.2⇔設6:1/195.0","初当り"],
    ["at","AT",{1:460.5,2:446.5,3:425.5,4:390.4,5:374.2,6:355.5},"設1:1/460.5⇔設6:1/355.5","AT"]
  ];
  const PAYOUT={1:97.7,2:98.9,3:101.2,4:105.8,5:110.6,6:114.9};
  const HINTS={
    pending:'設定示唆（終了画面・トロフィーなど）は出典で調査中です。公表され次第この機種に追加します。',
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。',
    counts:"ボーナスのストック放出・上位移行・引戻しは初当りに数えない。"
  };
  const REF_NOTES=['当ページの解析値は第三者の独自調査値です。'];
  const DEF={gameLog:[],games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  // 分母＝当選ごとのG数の合計（§9-105）。今まわしている未当選区間は含めない。
  function gameLog(S){return Array.isArray(S.gameLog)?S.gameLog:[];}
  function freeGames(S){return gameLog(S).reduce((a,v)=>a+(Number(v)||0),0);}
  function freeText(S){return freeGames(S)+'G';}
  function logText(S){return freeText(S)+'（'+gameLog(S).length+'件）';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'—';}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .glog-btn{flex:none;min-height:44px;padding:0 14px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-family:var(--body);font-size:12px;font-weight:800}.glog-btn:disabled{opacity:.4}
      .glog-row{display:flex;align-items:center;gap:8px;margin-top:6px}.glog-last{flex:1;font-size:11px;color:var(--muted)}
    </style>`;
  }
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),log=gameLog(S);
    return pageStyle()+`<div class="hint">${HINTS.pending}</div><section class="sec">
      <div class="sec-h">当選ごとのG<span class="sub">累計通常G <b style="color:#6fd8ff" data-glog-sum>${g}G</b> ／ <span data-glog-count>${log.length}</span>件</span></div>
      <div class="inrow"><label>当選時のG数</label><input type="number" inputmode="numeric" id="gameLogIn" value="" placeholder="0"><button type="button" class="glog-btn" data-action="addGameLog" data-label="当選G追加">追加</button></div>
      <div class="glog-row"><span class="glog-last">${log.length?'最後に追加：'+log[log.length-1]+'G':'まだ登録がありません'}</span><button type="button" class="glog-btn" data-action="popGameLog" data-label="当選G取消" ${log.length?'':'disabled'}>最後の1件を取り消す</button></div>
      <div class="hint">${HINTS.games}</div>
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
    return `設定判別メモ｜${TITLE}\n累計通常G ${logText(S)}\n_______\n`+(lines.length?'\n■カウント系\n'+lines.join('\n')+'\n':'')+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))}];
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    out.games=integer(out.games);
    out.gameLog=Array.isArray(out.gameLog)?out.gameLog.map(integer).filter(v=>v>0):[];
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=integer(out.counts[k]);});
    if(out.img===undefined)out.img=DEF.img;
    if(out.iconChoice===undefined)out.iconChoice=DEF.iconChoice;
    return out;
  }
  // 当選G数の追加・最後の1件の取消。入力欄は data-number-key を付けない（blur で再描画されて押下が消えないように）。
  function addGameLog(ctx){
    const el=document.getElementById('gameLogIn');
    const v=Math.floor(Number(el&&el.value));
    if(!(v>0))return false;
    ctx.S.gameLog=gameLog(ctx.S).concat([v]);
    return '当選G '+v+'G を追加';
  }
  function popGameLog(ctx){
    const log=gameLog(ctx.S);
    if(!log.length)return false;
    ctx.S.gameLog=log.slice(0,-1);
    return '当選G '+log[log.length-1]+'G を取り消し';
  }
  window.CheckerConfigs.godzieva2={
    uiV2:true,nanaCollab:false,storageKey:"godzieva2-checker-v1",defaults:DEF,
    mergeKeys:['counts'],sourceUrl:"https://chonborista.com/slot/bisty-slot/267113/",normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:TITLE+' 設定判別メモ',hashtags:"#ゴジエヴァ2 #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:"#ゴジエヴァ2 #設定判別",downloadName:"godzieva2_check.png",detailDownloadName:"godzieva2_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))},
        {x:560,items:[row('累計通常G '+logText(S),g)]}
      ]};}
    }
  };
})();

// 出典: ちょんぼりすた様 https://chonborista.com/slot/daito-slot/268864/
// 2026-11-02 取得。正本: docs/specs/vivy-checker-v02.md（§9-108 検収用テスト版）。
// 初当り系カウント・示唆記録・参照表（推測タブなし）。
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const TITLE="スロット Vivy -Fluorite Eye's Song-";
  // [path の末尾, 行名, 設定別の分母, 目安, カード用の短名]
  const COUNTS=[
    ["at","AT初当り",{1:276.5,2:251.7,3:272.1,4:222.8,5:235.9,6:210.3},"設1:1/276.5⇔設6:1/210.3（設定順に並びません。参照タブ参照）","AT初当り"]
  ];
  const PAYOUT={1:97.7,2:98.7,3:100.2,4:104.7,5:108.3,6:112.8};
  const HINTS={
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。',
    counts:"引戻しは数えない。アクセスチャンス（ポイント獲得）はCZではない。アクセスチャンスの継続回数は内部値と一致しないため記録しない。"
  };
  const REF_NOTES=["AT初当りは設定順に並びません（出典の注記：設定1＜設定3＜設定2＜設定5＜設定4＜設定6の順に優遇）。",'当ページの解析値は第三者の独自調査値です。'];
  const GROUPS={
    atEnd:[
      ["estella","エステラ","調査中",0],
      ["beach","ビーチ","調査中",0],
      ["matsumoto","マツモト変形","調査中",0],
      ["hug","抱きしめる","調査中",0],
      ["gaze","見つめる","調査中",0],
      ["bear","クマ","調査中",0],
      ["reach","手を伸ばす","調査中",0],
      ["mini","ミニキャラ","調査中",0],
      ["all","全員集合","調査中",0]
    ],
    trophy:[
      ["bronze","銅","設定2以上濃厚（※示唆内容は推測）",0],
      ["silver","銀","設定3以上濃厚（※示唆内容は推測）",0],
      ["gold","金","設定4以上濃厚（※示唆内容は推測）",0],
      ["inazuma","イナズマ","設定5以上濃厚（※示唆内容は推測）",0],
      ["rainbow","虹","設定6濃厚（※示唆内容は推測）",0]
    ],
    payout:[
      ["p411","411","設定4以上濃厚",4],
      ["p619","619","設定6濃厚",6],
      ["p2161","2161","設定4以上濃厚",4],
      ["p2161x2","2161×2","設定5以上濃厚・4322枚の獲得時に出現する可能性",5],
      ["p2161x3","2161×3","設定6濃厚・6483枚の獲得時に出現する可能性",6]
    ],
    ending:[
      ["vivy","ヴィヴィ","デフォルト",0],
      ["elizabeth","エリザベス","設定2期待度UP",0],
      ["estella","エステラ","設定3期待度UP",0],
      ["grace","グレイス","設定4期待度UP",0],
      ["ophelia","オフィーリア","設定5期待度UP",0],
      ["matsumoto","マツモト","設定6期待度UP",0],
      ["two","2体","設定2以上濃厚",2],
      ["three","3体","設定3以上濃厚",3],
      ["four","4体","設定4以上濃厚",4],
      ["five","5体","設定5以上濃厚",5],
      ["six","6体","設定6濃厚",6]
    ]
  };
  const TITLES={"atEnd":"AT終了画面","trophy":"コパンダトロフィー","payout":"獲得枚数表示","ending":"エンディング中のキャラ"};
  const DETAIL_TITLES={"atEnd":"AT終了画面","trophy":"トロフィー","payout":"枚数表示","ending":"ED中キャラ"};
  const SUGGEST_HINTS={"atEnd":"AT終了画面は全9種類です。示唆内容は調査中のため、記録のみです。","trophy":"AT終了時に出現することがあります。出現率はホールが調整できるため、出ないことは設定の根拠になりません。示唆内容は出典で推測とされているため、確定演出には数えません。","payout":"AT中の獲得枚数表示が特定の数字になると設定を示唆します。","ending":"エンディング中にレア役・共通ベルが成立したときPUSHボタンを押すとキャラが出現します。1体ならキャラの種類、2体以上なら体数で示唆します。"};
  const PERCENT_GROUPS=["atEnd"];
  const DEF={gameLog:[],games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),...Object.fromEntries(Object.entries(GROUPS).map(([key,arr])=>[key,Object.fromEntries(arr.map(c=>[c[0],0]))])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  // 分母＝当選ごとのG数の合計（§9-105）。今まわしている未当選区間は含めない。
  function gameLog(S){return Array.isArray(S.gameLog)?S.gameLog:[];}
  function freeGames(S){return gameLog(S).reduce((a,v)=>a+(Number(v)||0),0);}
  function freeText(S){return freeGames(S)+'G';}
  function logText(S){return freeText(S)+'（'+gameLog(S).length+'件）';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'—';}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function groupTotal(S,key){return GROUPS[key].reduce((sum,c)=>sum+n(S[key],c[0]),0);}
  function section(title,lines){return lines.length?'\n■'+title+'\n'+lines.join('\n')+'\n':'';}
  function pageSuggest(ctx){
    return pageStyle()+Object.entries(GROUPS).map(([key,arr])=>{
      const total=groupTotal(ctx.S,key);
      const rows=items=>'<div class="cgrid">'+items.map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3]>0,PERCENT_GROUPS.includes(key)?v=>ctx.pct(v,total):undefined)).join('')+'</div>';
      return '<section class="sec"><div class="sec-h">'+TITLES[key]+'<span class="sub">計'+total+'回</span></div>'+(key==='ending'?'<div class="sec-h">1体</div>'+rows(arr.slice(0,6))+'<div class="sec-h">2体以上</div>'+rows(arr.slice(6)):rows(arr))+'<div class="hint">'+SUGGEST_HINTS[key]+'</div></section>';
    }).join('');
  }
  function strongEntries(S){return Object.entries(GROUPS).flatMap(([key,arr])=>arr.filter(c=>c[3]>0).map(c=>({row:c,count:n(S[key],c[0])})));}
  function strongCount(S){return strongEntries(S).reduce((sum,c)=>sum+c.count,0);}
  function bestStrong(S){
    const hit=strongEntries(S).filter(c=>c.count>0).sort((a,b)=>b.row[3]-a.row[3])[0];
    return hit?'確定演出 '+hit.row[1]+'('+(hit.row[3]===6?'6濃厚':hit.row[3]+'以上')+') ×'+hit.count:'確定演出 なし';
  }
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
    return pageStyle()+`<section class="sec">
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
    let t=`設定判別メモ｜${TITLE}\n累計通常G ${logText(S)} / 確定演出${strongCount(S)}回\n_______\n`+section('カウント系',lines);
    Object.entries(GROUPS).forEach(([key,arr])=>{
      const total=groupTotal(S,key);
      t+=section(TITLES[key],arr.filter(c=>n(S[key],c[0])>0).map(c=>`${c[1]}▶${n(S[key],c[0])}回${PERCENT_GROUPS.includes(key)?' ('+(100*n(S[key],c[0])/total).toFixed(0)+'%)':''}`));
    });
    return t+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))},
      ...Object.entries(GROUPS).map(([key,arr])=>({title:DETAIL_TITLES[key],percent:PERCENT_GROUPS.includes(key),denominator:PERCENT_GROUPS.includes(key)?groupTotal(S,key):undefined,items:arr.map(c=>({label:c[1],value:n(S[key],c[0]),hot:c[3]>0}))}))];
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    out.games=integer(out.games);
    out.gameLog=Array.isArray(out.gameLog)?out.gameLog.map(integer).filter(v=>v>0):[];
    ['counts',...Object.keys(GROUPS)].forEach(key=>{
      out[key]=Object.fromEntries(Object.keys(DEF[key]).map(k=>[k,integer((out[key]||{})[k])]));
    });
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
  window.CheckerConfigs["vivy-test"]={
    uiV2:true,nanaCollab:false,storageKey:"vivy-checker-v1-test",defaults:DEF,
    mergeKeys:['counts',...Object.keys(GROUPS)],sourceUrl:"https://chonborista.com/slot/daito-slot/268864/",normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:TITLE+' 設定判別メモ',hashtags:"#Vivy #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:"#Vivy #設定判別",downloadName:"vivy_check.png",detailDownloadName:"vivy_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['確定演出','計'+strongCount(S)+'回'],['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:[row(bestStrong(S),strongCount(S),undefined,'#ffc94d'),...COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))]},
        {x:560,items:[row('累計通常G '+logText(S),g)]}
      ]};}
    }
  };
})();

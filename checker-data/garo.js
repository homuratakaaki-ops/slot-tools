// 出典: ちょんぼりすた様 https://chonborista.com/slot/sansei-slot/270768/
// 2026-10-28 公開分を 2026-11-02 取得（第三者解析）。数値・文言の正本: docs/specs/garo-checker-v02.md
// 初当り系カウント・設定示唆7群・参照表（推測タブなし）。
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
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。当選ごとのG数を合計して、1/xを出します。今まわしている未当選区間のG数は分母に含めません。',
    counts:"牙狼モード・魔界の通常CZを合算。『金色になれ！』は別段階で数えない。SUPER GARO BONUS・RUSH は初当りに含めない。"
  };
  const REF_NOTES=['当ページの解析値は第三者の独自調査値です。'];
  // [key, 行名, 補足, rank, exclude]
  const GROUPS={
    bonusEnd:[
      ["ryuga","流牙","デフォルト",0,[]],
      ["rian","莉杏","偶数設定期待度UP(弱)",0,[]],
      ["furei","符礼","偶数設定期待度UP(中)",0,[]],
      ["rianMaid","莉杏（メイド）","偶数設定期待度UP(強)",0,[]],
      ["enpo","燕邦","高設定期待度UP(弱)",0,[]],
      ["libera","リベラ","高設定期待度UP(中)",0,[]],
      ["sonshi","尊士","高設定期待度UP(強)",0,[]],
      ["horror","魔導ホラー集合","設定2以上濃厚",2,[]],
      ["knights","魔戒騎士集合","設定4以上濃厚",4,[]],
      ["golden","金色牙狼","設定6濃厚",6,[]]
    ],
    rushEnd:[
      ["garo","牙狼","デフォルト",0,[]],
      ["zen","漸","偶数設定期待度UP(弱)",0,[]],
      ["gai","牙射","高設定期待度UP(弱)",0,[]],
      ["rian","莉杏","設定2以上濃厚",2,[]],
      ["knights","魔戒騎士集合","設定4以上濃厚",4,[]],
      ["garoYami","牙狼闇","設定6濃厚",6,[]]
    ],
    trophy:[
      ["bronze","銅","設定2以上濃厚",2,[]],
      ["silver","銀","設定3以上濃厚",3,[]],
      ["gold","金","設定4以上濃厚",4,[]],
      ["sansei","サンセイ柄","設定5以上濃厚",5,[]],
      ["rainbow","虹","設定6濃厚",6,[]],
      ["black","黒","次回銅以上のトロフィー出現濃厚（設定2以上濃厚として数える）",2,[]]
    ],
    payout:[
      ["o246","246枚OVER","偶数設定濃厚",0,[1,3,5]],
      ["o456","456枚OVER","設定4以上濃厚",4,[]],
      ["o555","555枚OVER","設定5以上濃厚",5,[]],
      ["o666","666枚OVER","設定6濃厚",6,[]],
      ["o999","999枚OVER","設定6濃厚",6,[]]
    ],
    lamp:[
      ["dWhite","白","デフォルト",0,[]],
      ["dCyan","水色","偶数設定期待度UP(弱)",0,[]],
      ["dGreen","緑","偶数設定期待度UP(強)",0,[]],
      ["dYellow","黄","高設定期待度UP(弱)",0,[]],
      ["dOrange","オレンジ","高設定期待度UP(強)",0,[]],
      ["gAll","全てオレンジ","設定2以上濃厚",2,[]],
      ["gAro","「ARO」がオレンジ","設定3以上濃厚",3,[]],
      ["gRo","「RO」がオレンジ","設定4以上濃厚",4,[]],
      ["gO","「O」がオレンジ","設定5以上濃厚",5,[]],
      ["gRainbow","全て虹","設定6濃厚",6,[]],
      ["gNot2","「G」が青・「ARO」が黄","設定2否定",0,[2]],
      ["gNot3","「A」が青・「GRO」が黄","設定3否定",0,[3]],
      ["gNot4","「R」が青・「GAO」が黄","設定4否定",0,[4]]
    ],
    stepup:[
      ["tomo","友","次回BIG以上でなければ設定2以上濃厚",2,[]],
      ["gi","義","次回BIG以上でなければ設定3以上濃厚",3,[]],
      ["ran","乱","次回BIG以上でなければ設定4以上濃厚",4,[]],
      ["switchOn","switch on!!","出現時点で次回BIG以上＋規定G数での当選＋設定6濃厚",6,[]]
    ],
    item:[
      ["madou","魔導紀元史","555Gまでに当選しなければ設定2以上濃厚",2,[]],
      ["kaneshiro","金城グループマーク","規定G数で当選しなければ設定2以上濃厚",2,[]],
      ["zanbaken","牙狼斬馬剣","出現時点で引き戻し以上＋設定2以上濃厚",2,[]],
      ["plant","プラント","333Gまでに当選しなければ偶数設定濃厚",0,[1,3,5]],
      ["sonshiSword","尊士の剣","222Gまでに当選しなければ設定4以上濃厚",4,[]],
      ["object","禁断のオブジェ","777Gまでに当選しなければ設定6濃厚",6,[]],
      ["tonton","トントン","出現時点で規定G数での当選＋設定6濃厚",6,[]]
    ]
  };
  const TITLES={"bonusEnd":"BONUS・金色になれ！終了画面","rushEnd":"究極魔戒RUSH終了画面","trophy":"トントントロフィー","payout":"獲得枚数表示","lamp":"3000枚BONUS中のランプ","stepup":"ステップアップの文字","item":"設定示唆のアイテム"};
  const DETAIL_TITLES={"bonusEnd":"BONUS終了","rushEnd":"RUSH終了","trophy":"トロフィー","payout":"枚数表示","lamp":"3000枚ランプ","stepup":"ステップアップ","item":"アイテム"};
  const SUGGEST_HINTS={"bonusEnd":"初当りBONUSと金色になれ！の終了画面で設定を示唆します。ザルバ（復活）は設定示唆ではないため記録しません。","rushEnd":"究極魔戒RUSHの終了画面で設定を示唆します。","trophy":"初当りBONUS終了時・金色になれ！敗北時・究極魔戒RUSH終了時に出現することがあります。出現率はホール設定で変わります。","payout":"一定枚数の獲得時に表示される「○○○枚OVER」の一部で設定を示唆します。","lamp":"3000枚BONUS中にレア役が成立するとPUSHボタンが促され、押すと筐体ランプの色で示唆します。","stepup":"通常時に画面下部のステップアップUIに文字が出現すると、次回ボーナスの種類と設定を示唆します。","item":"通常時のアイテム転送で出現します。規定G数は滞在モードの天井G数（111G・222G…）です。"};
  const LAMP_LABELS={"dWhite":"ダイヤ白","dCyan":"ダイヤ水色","dGreen":"ダイヤ緑","dYellow":"ダイヤ黄","dOrange":"ダイヤオレンジ","gAll":"ロゴ全オレンジ","gAro":"ロゴARO橙","gRo":"ロゴRO橙","gO":"ロゴO橙","gRainbow":"ロゴ全虹","gNot2":"G青ARO黄","gNot3":"A青GRO黄","gNot4":"R青GAO黄"};
  const CONDITION_NOTICE="友・義・乱、魔導紀元史・金城グループマーク・プラント・尊士の剣・禁断のオブジェは、条件を満たしたと確認できたときだけ押してください。出ただけでは押しません。";
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
  function hasPercent(key){return key==='bonusEnd'||key==='rushEnd';}
  function isEven(c){return c[4].length===3&&c[4].every((v,i)=>v===[1,3,5][i]);}
  function isStrong(c){return c[3]>0||isEven(c);}
  function isHot(c){return c[3]>0||c[4].length>0;}
  function allStrong(S){return Object.entries(GROUPS).flatMap(([key,arr])=>arr.filter(isStrong).map(c=>({label:c[1],rank:c[3]||2,odd:isEven(c),value:n(S[key],c[0])})));}
  function strongCount(S){return allStrong(S).reduce((sum,c)=>sum+c.value,0);}
  function bestStrong(S){
    const hit=allStrong(S).filter(c=>c.value>0).sort((a,b)=>b.rank-a.rank)[0];
    return hit?'確定演出 '+hit.label+'('+(hit.odd?'2・4・6':hit.rank===6?'6濃厚':hit.rank+'以上')+') ×'+hit.value:'確定演出 なし';
  }
  function denialRow(S){
    const hit=Object.entries(GROUPS).flatMap(([key,arr])=>arr.filter(c=>c[3]===0&&c[4].length===1&&n(S[key],c[0])>0));
    return row('否定 '+(hit.length?hit.map(c=>'設'+c[4][0]).join('・'):'−'),hit.length);
  }
  function detailLabel(key,c){return key==='lamp'?LAMP_LABELS[c[0]]:c[1];}
  function section(title,lines){return lines.length?'\n■'+title+'\n'+lines.join('\n')+'\n':'';}
  function pageSuggest(ctx){
    return pageStyle()+Object.entries(GROUPS).map(([key,arr])=>{
      const total=groupTotal(ctx.S,key);
      const grid=rows=>'<div class="cgrid">'+rows.map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],isHot(c),hasPercent(key)?v=>ctx.pct(v,total):undefined)).join('')+'</div>';
      const notice=key==='stepup'?`<div class="condition-notice">${CONDITION_NOTICE}</div>`:'';
      return notice+`<section class="sec"><div class="sec-h">${TITLES[key]}<span class="sub">計${total}回</span></div>${key==='lamp'?'<div class="sec-h">ダイヤ</div>'+grid(arr.slice(0,5))+'<div class="sec-h">GAROロゴ</div>'+grid(arr.slice(5)):grid(arr)}<div class="hint">${SUGGEST_HINTS[key]}</div></section>`;
    }).join('');
  }
  function pageStyle(){
    return `<style>
      .condition-notice{color:var(--gold);border:1px solid var(--gold);border-radius:10px;padding:12px;margin-bottom:12px;font-size:13px;line-height:1.6;font-weight:700}
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
      t+=section(TITLES[key],arr.filter(c=>n(S[key],c[0])>0).map(c=>`${c[1]}▶${n(S[key],c[0])}回`+(hasPercent(key)?` (${(100*n(S[key],c[0])/total).toFixed(0)}%)`:'')));
    });
    return t+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))},
      ...Object.entries(GROUPS).map(([key,arr])=>({title:DETAIL_TITLES[key],percent:hasPercent(key),denominator:hasPercent(key)?groupTotal(S,key):undefined,
        items:arr.filter(c=>n(S[key],c[0])>0).map(c=>({label:detailLabel(key,c),value:n(S[key],c[0]),hot:isHot(c)}))}))];
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
  window.CheckerConfigs.garo={
    uiV2:true,nanaCollab:false,storageKey:"garo-checker-v1",defaults:DEF,
    mergeKeys:['counts','bonusEnd','rushEnd','trophy','payout','lamp','stepup','item'],sourceUrl:"https://chonborista.com/slot/sansei-slot/270768/",normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:TITLE+' 設定判別メモ',hashtags:"#牙狼 #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:"#牙狼 #設定判別",downloadName:"garo_check.png",detailDownloadName:"garo_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['確定演出','計'+strongCount(S)+'回'],['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:[row(bestStrong(S),strongCount(S),undefined,'#ffc94d'),denialRow(S),...COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))]},
        {x:560,items:[row('累計通常G '+logText(S),g)]}
      ]};}
    }
  };
})();

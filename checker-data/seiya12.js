// 出典: ちょんぼりすた様 https://chonborista.com/slot/sanyo-slot/260304/
// 2026-10-27 更新分を 2026-10-28 確認（第三者解析）。数値・文言の正本: docs/specs/seiya12-checker-v01.md
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const DENOMS={
    cz:{1:214.4,2:214.1,3:211.7,4:202.5,5:197.2,6:200.3},
    at:{1:364.2,2:356.1,3:345.6,4:322.3,5:313.7,6:310.5}
  };
  const PAYOUT={1:97.5,2:98.5,3:100.5,4:105.2,5:110.0,6:114.9};
  // 推測タブは作らない（夢爽決定：カウントのみ）。rank は確定演出の集計とカードの選定にだけ使う。
  const CZ_TYPES=[
    ['czWho','CZ フーアーユー'],
    ['czKage','CZ 影ノ襲来']
  ];
  const TROPHY=[
    ['bronze','銅','設定2以上濃厚',2],['silver','銀','設定3以上濃厚',3],['gold','金','設定4以上濃厚',4],
    ['clown','クマノミ柄','設定5以上濃厚',5],['rainbow','虹','設定6濃厚',6],['unknown','色不明','',0]
  ];
  const AT_END=[
    ['none','キャラなし','デフォルト',0],
    ['bronze3','青銅3人','奇数設定 期待度UP',0],
    ['bronze4','青銅4人','偶数設定 期待度UP',0],
    ['bronze4L','左向きの青銅4人','高設定 期待度UP',0],
    ['bronze5','青銅5人（正面に一輝）','高設定 期待度UP（強）',0],
    ['marin','魔鈴＆シャイナ','設定4以上濃厚',4],
    ['saori','沙織','設定6濃厚',6],
    ['ikki','一輝','復活濃厚（設定示唆ではない）',0],
    ['unknown','不明','割合の母数に入れない',0]
  ];
  const ER_FIRST=[
    ['shaka','シャカ','高設定 期待度UP',0],['gemini','ジェミニ','設定4以上濃厚',4],['unknown','不明','',0]
  ];
  const ER_SECOND=[
    ['mu','ムウ','高設定 期待度UP',0],['aiolos','アイオロス','高設定 期待度UP（強）',0],['unknown','不明','',0]
  ];
  const CARD=[
    ['harisenbon','ハリセンボン座','設定2以上濃厚',2],['same','サメ座','設定4以上濃厚',4],
    ['ebi','エビ座','設定5以上濃厚',5],['ankou','アンコウ座','設定6濃厚',6]
  ];
  const GROUPS={trophy:TROPHY,atEnd:AT_END,erFirst:ER_FIRST,erSecond:ER_SECOND,card:CARD};
  const TITLES={trophy:'トロフィー',atEnd:'AT終了画面',erFirst:'エクストララウンド キャラ紹介（1人目）',erSecond:'エクストララウンド キャラ紹介（2人目）',card:'カード演出の星座'};
  // 詳細カード・サマリー専用の短名（10文字以内）。画面・hint・テンプレは上の表示名のまま。
  const DETAIL_TITLES={trophy:'トロフィー',atEnd:'AT終了画面',erFirst:'ER 1人目',erSecond:'ER 2人目',card:'星座'};
  const SHORT={
    atEnd:{bronze4L:'左向き青銅4',bronze5:'青銅5一輝',marin:'魔鈴シャイナ'},
    card:{harisenbon:'ハリセンボン',same:'サメ',ebi:'エビ',ankou:'アンコウ'}
  };
  const HINTS={
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。',
    cz:'通常CZ（フーアーユー・影ノ襲来）を突入のたびに1回押します。種別が分からなければ「通常CZ（種別不明）」。合計には種別不明も入り、種別の割合には入りません。上位CZ「最終決戦サガバトル」は数えません。',
    at:'AT初当りは初当りだけを押します。セット継続・上位移行・千日戦争の引戻しは数えません。CZ成功からの自動加算はしません。',
    trophy:'黄金聖闘士バトル・千日戦争の継続バトル・サガバトル敗北時に出ることがあります。出現率はホール設定で変わるため、出ないことを低設定の根拠にしません。',
    atEnd:'AT・上位ATの終了時（黄金聖闘士バトル敗北後など）に出ます。一輝は復活の示唆で設定とは無関係です。',
    er:'エクストララウンド中の黄金聖闘士バトルに勝利したときに発生します。1人目・2人目をそれぞれ記録します。割合は出しません。',
    card:'通常時のカード演出で出る星座です。設定示唆のある4種だけ記録します。'
  };
  const DEF={gameLog:[],games:0,counts:{czWho:0,czKage:0,czUnknown:0,at:0},
    ...Object.fromEntries(Object.entries(GROUPS).map(([key,arr])=>[key,Object.fromEntries(arr.map(c=>[c[0],0]))])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  // 分母＝当選ごとのG数の合計（§9-105）。今まわしている未当選区間は含めない。
  function gameLog(S){return Array.isArray(S.gameLog)?S.gameLog:[];}
  function freeGames(S){return gameLog(S).reduce((a,v)=>a+(Number(v)||0),0);}
  function freeText(S){return freeGames(S)+'G';}
  function logText(S){return freeText(S)+'（'+gameLog(S).length+'件）';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'—';}
  // 通常CZ合計は種別不明を含む。種別の割合の母数は種別が分かった2種だけ（値の出典はこの2関数）。
  function czTotal(S){return n(S.counts,'czWho')+n(S.counts,'czKage')+n(S.counts,'czUnknown');}
  function czKnown(S){return n(S.counts,'czWho')+n(S.counts,'czKage');}
  function knownTotal(S,key){return GROUPS[key].filter(c=>c[0]!=='unknown').reduce((a,c)=>a+n(S[key],c[0]),0);}
  // トロフィーは出現回数（色不明も出現として数える）。
  function trophyTotal(S){return TROPHY.reduce((a,c)=>a+n(S.trophy,c[0]),0);}
  function hasPercent(key){return key==='atEnd';}
  function shortLabel(key,c){return (SHORT[key]||{})[c[0]]||c[1];}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function section(title,lines){return lines.length?'\n■'+title+'\n'+lines.join('\n')+'\n':'';}
  // 確定演出＝濃厚系（rank>0）。期待度UP・一輝（復活）は数えない。
  function allStrong(S){
    return Object.entries(GROUPS).flatMap(([key,arr])=>arr.filter(c=>c[3]>0).map(c=>({label:c[1],rank:c[3],value:n(S[key],c[0])})));
  }
  function strongCount(S){return allStrong(S).reduce((a,c)=>a+c.value,0);}
  function bestStrong(S){
    const hit=allStrong(S).filter(c=>c.value>0).sort((a,b)=>b.rank-a.rank)[0];
    return hit?'確定演出 '+hit.label+'('+(hit.rank===6?'6濃厚':hit.rank+'以上')+') ×'+hit.value:'確定演出 なし';
  }
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .crow.total-row{border-style:dashed}.crow.total-row .num{color:var(--gold);text-shadow:none}
      .glog-btn{flex:none;min-height:44px;padding:0 14px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-family:var(--body);font-size:12px;font-weight:800}.glog-btn:disabled{opacity:.4}
      .glog-row{display:flex;align-items:center;gap:8px;margin-top:6px}.glog-last{flex:1;font-size:11px;color:var(--muted)}
    </style>`;
  }
  function groupRows(ctx,key){
    const total=knownTotal(ctx.S,key);
    return GROUPS[key].map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3],hasPercent(key)&&c[0]!=='unknown'?v=>ctx.pct(v,total):undefined)).join('');
  }
  function groupSection(ctx,key){return `<section class="sec"><div class="sec-h">${TITLES[key]}</div><div class="cgrid">${groupRows(ctx,key)}</div><div class="hint">${HINTS[key]}</div></section>`;}
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),log=gameLog(S),known=czKnown(S);
    return pageStyle()+`<section class="sec">
      <div class="sec-h">当選ごとのG<span class="sub">累計通常G <b style="color:#6fd8ff" data-glog-sum>${g}G</b> ／ <span data-glog-count>${log.length}</span>件</span></div>
      <div class="inrow"><label>当選時のG数</label><input type="number" inputmode="numeric" id="gameLogIn" value="" placeholder="0"><button type="button" class="glog-btn" data-action="addGameLog" data-label="当選G追加">追加</button></div>
      <div class="glog-row"><span class="glog-last">${log.length?'最後に追加：'+log[log.length-1]+'G':'まだ登録がありません'}</span><button type="button" class="glog-btn" data-action="popGameLog" data-label="当選G取消" ${log.length?'':'disabled'}>最後の1件を取り消す</button></div>
      <div class="hint">${HINTS.games}</div>
    </section><section class="sec"><div class="sec-h">カウント系</div><div class="cgrid">
      ${CZ_TYPES.map(c=>ctx.crow('counts.'+c[0],c[1],'種別の割合（種別不明を除く）',0,v=>ctx.pct(v,known))).join('')}
      ${ctx.crow('counts.czUnknown','通常CZ（種別不明）','合計に入れ、種別の割合には入れない',0)}
      <div class="crow total-row" data-total="cz"><div class="lbl"><div class="nm">通常CZ合計</div><div class="mn">設1:1/214.4⇔設6:1/200.3（設定差は小さい）</div></div><div class="num">${czTotal(S)}</div><div class="pct">${oneIn(czTotal(S),g)}</div></div>
      </div><div class="hint">${HINTS.cz}</div>
      <div class="cgrid" style="margin-top:6px">${ctx.crow('counts.at','AT初当り','設1:1/364.2⇔設6:1/310.5',0,v=>oneIn(v,g))}</div>
      <div class="hint">${HINTS.at}</div></section>`;
  }
  function pageSuggest(ctx){
    return pageStyle()+['trophy','atEnd'].map(k=>groupSection(ctx,k)).join('')+
      `<section class="sec"><div class="sec-h">エクストララウンド キャラ紹介</div>${['erFirst','erSecond'].map((k,i)=>`<div class="sec-h">${['1人目','2人目'][i]}</div><div class="cgrid">${groupRows(ctx,k)}</div>`).join('')}<div class="hint">${HINTS.er}</div></section>`+
      groupSection(ctx,'card')+
      '<div class="hint">奇数・偶数・高設定の期待度UPは記録のみです。</div>';
  }
  const REF_SECTIONS=[
    ['CZ合算・AT初当り・出玉率',SETTINGS.map(s=>['設定'+s,'CZ合算 1/'+DENOMS.cz[s].toFixed(1)+' ／ AT初当り 1/'+DENOMS.at[s].toFixed(1)+' ／ 出玉率 '+PAYOUT[s].toFixed(1)+'%']).concat([['補足','CZ合算はフーアーユーと影ノ襲来の合算値。上位CZ「最終決戦サガバトル」は含みません。']])],
    ['小役確率（全設定共通の公表値）',[
      ['リプレイ','1/11.3'],['15枚ベル','1/131.1'],['弱チェリー','1/99.9'],['スイカ','1/99.9'],['チャンス目（合算）','1/266.4'],['強チェリー','1/399.6']
    ]],
    ['トロフィー',[['出現場面',HINTS.trophy],['示唆','銅＝設定2以上濃厚、銀＝設定3以上濃厚、金＝設定4以上濃厚、クマノミ柄＝設定5以上濃厚、虹＝設定6濃厚']]],
    ['調査中の項目',[
      ['液晶・メニューのG数','液晶G数は設定変更時と電源OFF→ON時に0Gへ戻ります（電源OFF→ONでは内部状態を引き継ぎます）。メニューのAT間G数も設定変更で0に戻ります。設定推定の分母には使わず、当選ごとのG数の合計を使います。'],
      ['規定周期の振り分け','調査中（推定に使わない）'],['守護星座の加護','調査中（推定に使わない）'],
      ['解析値について','当ページの解析値は第三者の独自調査値です。']
    ]]
  ];
  function pageReference(){
    return pageStyle()+`<div class="jump-grid">${REF_SECTIONS.map((s,i)=>`<a href="#ref${i+1}">${s[0]}</a>`).join('')}</div>`+
      REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div><table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S),known=czKnown(S);
    let t=`設定判別メモ｜L聖闘士星矢 黄金十二宮\n累計通常G ${logText(S)} / 確定演出${strongCount(S)}回\n_______\n`;
    const lines=[];
    if(czTotal(S)>0)lines.push(`通常CZ合計▶${czTotal(S)}回（${oneIn(czTotal(S),g)}）`);
    CZ_TYPES.forEach(c=>{const v=n(S.counts,c[0]);if(v>0)lines.push(`${c[1]}▶${v}回${known>0?' ('+(100*v/known).toFixed(0)+'%)':''}`);});
    if(n(S.counts,'czUnknown')>0)lines.push(`通常CZ（種別不明）▶${n(S.counts,'czUnknown')}回`);
    if(n(S.counts,'at')>0)lines.push(`AT初当り▶${n(S.counts,'at')}回（${oneIn(n(S.counts,'at'),g)}）`);
    t+=section('カウント系',lines);
    Object.entries(GROUPS).forEach(([key,arr])=>{
      const total=knownTotal(S,key);
      t+=section(TITLES[key],arr.filter(c=>n(S[key],c[0])>0).map(c=>`${c[1]}▶${n(S[key],c[0])}回${hasPercent(key)&&c[0]!=='unknown'&&total>0?' ('+(100*n(S[key],c[0])/total).toFixed(0)+'%)':''}`));
    });
    return t+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S),known=czKnown(S);
    const item=(label,value,text)=>({label,value,hot:false,text,show:value>0});
    return [{title:'カウント系',items:[
      item('通常CZ合計',czTotal(S),'通常CZ合計 ×'+czTotal(S)+' '+oneIn(czTotal(S),g)),
      ...CZ_TYPES.map(c=>{const v=n(S.counts,c[0]);return item(c[1],v,c[1]+' ×'+v+(known>0?' ('+(100*v/known).toFixed(0)+'%)':''));}),
      item('通常CZ不明',n(S.counts,'czUnknown'),'通常CZ 種別不明 ×'+n(S.counts,'czUnknown')),
      item('AT初当り',n(S.counts,'at'),'AT初当り ×'+n(S.counts,'at')+' '+oneIn(n(S.counts,'at'),g))
    ]},
    ...Object.entries(GROUPS).map(([key,arr])=>({title:DETAIL_TITLES[key],percent:hasPercent(key),...(hasPercent(key)?{denominator:knownTotal(S,key)}:{}),
      items:arr.map(c=>({label:shortLabel(key,c),value:n(S[key],c[0]),hot:!!c[3],...(c[0]==='unknown'&&hasPercent(key)?{text:c[1]+' ×'+n(S[key],c[0]),show:n(S[key],c[0])>0}:{})}))}))];
  }
  function summary(S,key,label,predicate){
    const hits=GROUPS[key].filter(c=>c[0]!=='unknown'&&(!predicate||predicate(c))&&n(S[key],c[0])>0);
    return row(label+' '+(hits.map(c=>shortLabel(key,c)+'×'+n(S[key],c[0])).join('・')||'−'),hits.reduce((a,c)=>a+n(S[key],c[0]),0));
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    out.games=integer(out.games);
    out.gameLog=Array.isArray(out.gameLog)?out.gameLog.map(integer).filter(v=>v>0):[];
    ['counts',...Object.keys(GROUPS)].forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=integer(out[key][k]);});
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
  window.CheckerConfigs.seiya12={
    uiV2:true,nanaCollab:false,storageKey:'seiya12-checker-v1',defaults:DEF,
    mergeKeys:['counts',...Object.keys(GROUPS)],sourceUrl:'https://chonborista.com/slot/sanyo-slot/260304/',normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:'L聖闘士星矢 黄金十二宮 設定判別メモ',hashtags:'#聖闘士星矢 #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:'L聖闘士星矢 黄金十二宮',metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:'#聖闘士星矢 #設定判別',downloadName:'seiya12_check.png',detailDownloadName:'seiya12_check_detail.png',detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return [
        ['CZ合計',oneIn(czTotal(S),g)],['AT',oneIn(n(S.counts,'at'),g)],
        ['確定演出','計'+strongCount(S)+'回'],['トロフィー','計'+trophyTotal(S)+'回']
      ];},
      chart:ctx=>({title:'CZ種別',x:130,step:200,width:80,items:[
        {label:'フーアーユー',value:n(ctx.S.counts,'czWho')},{label:'影ノ襲来',value:n(ctx.S.counts,'czKage')}
      ]}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:[row(bestStrong(S),strongCount(S),undefined,'#ffc94d'),summary(S,'trophy','トロフィー'),summary(S,'atEnd','終了画面',c=>c[3]>0),summary(S,'card','星座')]},
        {x:560,items:[summary(S,'erFirst','ER1人目'),summary(S,'erSecond','ER2人目'),row('AT初当り '+n(S.counts,'at')+'回 '+oneIn(n(S.counts,'at'),g),n(S.counts,'at'))]}
      ]};}
    }
  };
})();

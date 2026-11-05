// 出典: ちょんぼりすた様 https://chonborista.com/slot/universal-slot/266983/
// 2026-11-06 取得（第三者解析）。正本: docs/specs/ragnador-checker-v03.md
// 初当り系カウント・ボイス示唆・参照表（推測タブなし）。
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const TITLE="スマスロ ラグナドール";
  // [path の末尾, 行名, 設定別の分母, 目安, カード用の短名]
  const COUNTS=[
    ["cz","CZ",{1:172.8,2:167.2,3:161.8,4:145.0,5:143.0,6:142.4},"設1:1/172.8⇔設6:1/142.4","CZ"],
    ["at","AT初当り",{1:326.4,2:317.2,3:307.7,4:271.2,5:260.8,6:258.3},"設1:1/326.4⇔設6:1/258.3","AT初当り"]
  ];
  const PAYOUT={1:97.6,2:98.8,3:100.3,4:105.7,5:110.5,6:114.5};
  const HINTS={
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。',
    counts:"直ATはCZに数えない。"
  };
  const REF_NOTES=['当ページの解析値は第三者の独自調査値です。'];
  const GROUPS={
    edVoice:[
      ['default','イヅナ「よしっ！」','デフォルト',0],
      ['even','イヅナ「協力いたします！」','偶数設定期待度UP',0],
      ['highWeak','イヅナ「お任せ」','高設定期待度UP(弱)・「ここは私にお任せください！」',0],
      ['highStrong','のっぺらぼう','高設定期待度UP(強)・「見えそうで…見えない、でしょ？フフッ、ずっと気にしてて」',0],
      ['ten','貂','設定2以上濃厚・「イヅナちゃんと同じくらい、あなたイイ線いってますよ♡」',2],
      ['izunaSp','イヅナ「特別な日」','設定4以上濃厚・「特別な日なので、日頃の感謝を改めて伝えたかったのです」',4],
      ['keukegen','けうけげん','設定5以上濃厚・「終わったらみんなでパーチーですぞぉ～♪」',5],
      ['nurikabe','ぬりかべ','設定6濃厚・「一緒に歩んできた時間が、私の宝物です」',6]
    ],
    atVoice:[
      ['base','デフォルト・相手示唆','高設定示唆なし（「油断せずにいきましょう！」・白虎・玄武・朱雀のボイス）',0],
      ['mairimasu','まいります！','高設定期待度UP',0],
      ['byakko','勝負はここから','次回白虎以上＋高設定期待度UP・「勝負はここからです！」',0],
      ['genbu','本気でいかせて','次回玄武以上＋高設定期待度UP・「本気でいかせていただきます！」',0],
      ['suzaku','まだこんな力が','次回朱雀濃厚＋高設定期待度UP・「私にまだこんな力が眠っていたなんて…！」',0],
      ['suzaku2','あなたの刃に','次回・次々回朱雀＋高設定期待度UP・「私があなたの刃となりましょう！」',0]
    ],
    czVoice:[
      ['default','イヅナ','デフォルト・「油断せずにいきましょう！」',0],
      ['byakko','白虎','次回白虎以上・「拳で語り合おうじゃあねぇか！」',0],
      ['genbu','玄武','次回玄武以上・「邪魔するやつ、嫌い」',0],
      ['suzaku','朱雀','次回朱雀濃厚・「焼き尽くして差し上げますわ」',0]
    ]
  };
  const TITLES={edVoice:'エンディング中ボイス',atVoice:'AT終了時ボイス',czVoice:'CZ終了時ボイス'};
  const DETAIL_TITLES={edVoice:'EDボイス',atVoice:'AT終了ボイス',czVoice:'CZ終了ボイス'};
  const VOICE_HINTS={
    edVoice:'エンディング中にレア役が成立したとき、サブ液晶をタッチすると発生します。',
    atVoice:'AT終了時にサブ液晶をタッチすると発生します。高設定期待度UPのボイスはAT終了時のみ発生します。',
    czVoice:'CZ終了時にサブ液晶をタッチすると発生します。次回CZの対戦相手の示唆で、設定示唆ではありません。'
  };
  const DEF={gameLog:[],games:0,counts:{...Object.fromEntries(COUNTS.map(c=>[c[0],0])),czKakutei:0},
    ...Object.fromEntries(Object.entries(GROUPS).map(([key,arr])=>[key,Object.fromEntries(arr.map(c=>[c[0],0]))])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  // 分母＝当選ごとのG数の合計（§9-105）。今まわしている未当選区間は含めない。
  function gameLog(S){return Array.isArray(S.gameLog)?S.gameLog:[];}
  function freeGames(S){return gameLog(S).reduce((a,v)=>a+(Number(v)||0),0);}
  function freeText(S){return freeGames(S)+'G';}
  function logText(S){return freeText(S)+'（'+gameLog(S).length+'件）';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'—';}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function groupTotal(S,key){return GROUPS[key].reduce((sum,c)=>sum+n(S[key],c[0]),0);}
  function strongCount(S){return GROUPS.edVoice.filter(c=>c[3]>0).reduce((sum,c)=>sum+n(S.edVoice,c[0]),0);}
  function bestStrong(S){
    const hit=GROUPS.edVoice.filter(c=>c[3]>0&&n(S.edVoice,c[0])>0).sort((a,b)=>b[3]-a[3])[0];
    return hit?'確定演出 '+hit[1]+'('+(hit[3]===6?'6濃厚':hit[3]+'以上')+') ×'+n(S.edVoice,hit[0]):'確定演出 なし';
  }
  function section(title,lines){return lines.length?'\n■'+title+'\n'+lines.join('\n')+'\n':'';}
  function pageSuggest(ctx){
    return pageStyle()+Object.entries(GROUPS).map(([key,arr])=>{
      const total=groupTotal(ctx.S,key);
      return `<section class="sec"><div class="sec-h">${key==='czVoice'?'その他示唆':TITLES[key]}<span class="sub">計${total}回</span></div>${key==='czVoice'?'<div class="sec-h">CZ終了時ボイス</div>':''}<div class="cgrid">${arr.map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,total))).join('')}</div><div class="hint">${VOICE_HINTS[key]}</div></section>`;
    }).join('');
  }
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .glog-btn{flex:none;min-height:44px;padding:0 14px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-family:var(--body);font-size:12px;font-weight:800}.glog-btn:disabled{opacity:.4}
      .glog-row{display:flex;align-items:center;gap:8px;margin-top:6px}.glog-last{flex:1;font-size:11px;color:var(--muted)}
    </style>`;
  }
  // 確定CZの分母はCZ回数。超過時と未記録時には割合を出さない。
  function kakutei(S){
    const N=n(S.counts,'cz'),M=n(S.counts,'czKakutei');
    return {N,M,percent:M>0&&M<=N?' '+(100*M/N).toFixed(1)+'%':''};
  }
  function kakuteiPct(S){const {N,M,percent}=kakutei(S);return M===0?'—':'CZ '+N+'回中 '+M+'回'+(percent?'（'+percent.trim()+'）':'');}
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),log=gameLog(S);
    return pageStyle()+`<section class="sec">
      <div class="sec-h">当選ごとのG<span class="sub">累計通常G <b style="color:#6fd8ff" data-glog-sum>${g}G</b> ／ <span data-glog-count>${log.length}</span>件</span></div>
      <div class="inrow"><label>当選時のG数</label><input type="number" inputmode="numeric" id="gameLogIn" value="" placeholder="0"><button type="button" class="glog-btn" data-action="addGameLog" data-label="当選G追加">追加</button></div>
      <div class="glog-row"><span class="glog-last">${log.length?'最後に追加：'+log[log.length-1]+'G':'まだ登録がありません'}</span><button type="button" class="glog-btn" data-action="popGameLog" data-label="当選G取消" ${log.length?'':'disabled'}>最後の1件を取り消す</button></div>
      <div class="hint">${HINTS.games}</div>
    </section><section class="sec"><div class="sec-h">カウント系</div><div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[3],0,v=>oneIn(v,g))+(c[0]==='cz'?ctx.crow('counts.czKakutei','確定CZ','設1〜3:0.4%⇔設6:1.2%',0,()=>kakuteiPct(S)):'')).join('')}</div>${n(S.counts,'czKakutei')>n(S.counts,'cz')?'<div class="hint warn" data-fold="no">確定CZの回数がCZ回数を超えています。</div>':''}<div class="hint">${HINTS.counts}<details class="hint-fold"><summary>説明を見る</summary><div class="hint-body">CZ突入時の抽選で選ばれると、BGMが歌付きになり、勝敗にかかわらずATに当選します。CZ回数にも数えたうえで、確定CZだった回数をここで数えます。</div></details></div></section>`;
  }
  const REF_SECTIONS=[
    [COUNTS.map(c=>c[1]).join('・')+'・出玉率',SETTINGS.map(s=>['設定'+s,COUNTS.map(c=>c[1]+' 1/'+c[2][s].toFixed(1)).join(' ／ ')+' ／ 出玉率 '+PAYOUT[s].toFixed(1)+'%']).concat(REF_NOTES.map(t=>['補足',t]))],
    ['確定CZ当選率',SETTINGS.map((s,i)=>['設定'+s,['0.4%','0.4%','0.4%','0.8%','1.2%','1.2%'][i]]).concat([['補足','CZ突入時に抽選。当選するとCZの結果にかかわらずATに突入します。']])],
    ['玄武選択率（通常テーブル）',SETTINGS.map((s,i)=>['設定'+s,['1.6%','2.0%','2.3%','4.7%','5.5%','6.3%'][i]]).concat([['補足','設定差は通常テーブルだけです。どのテーブルが選ばれたかを1回ごとに見分けられないため、記録・推測には使いません。']])]
  ];
  function pageReference(){
    return pageStyle()+REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div><table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S);
    const lines=COUNTS.filter(c=>n(S.counts,c[0])>0).map(c=>`${c[1]}▶${n(S.counts,c[0])}回（${oneIn(n(S.counts,c[0]),g)}）`);
    const {N,M,percent}=kakutei(S);
    if(M>0)lines.splice(n(S.counts,'cz')>0?1:0,0,`確定CZ▶${M}回（CZ ${N}回中${percent}）`);
    let t=`設定判別メモ｜${TITLE}\n累計通常G ${logText(S)} / 確定演出${strongCount(S)}回\n_______\n`+section('カウント系',lines);
    Object.entries(GROUPS).forEach(([key,arr])=>{
      const total=groupTotal(S,key);
      t+=section(TITLES[key],arr.filter(c=>n(S[key],c[0])>0).map(c=>`${c[1]}▶${n(S[key],c[0])}回 (${(100*n(S[key],c[0])/total).toFixed(0)}%)`));
    });
    return t+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    const {N,M,percent}=kakutei(S);
    const items=COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}));
    items.splice(1,0,{label:'確定CZ',value:M,hot:false,text:`確定CZ ${M}/${N}${percent}`,show:M>0});
    return [{title:'カウント系',items},
      ...Object.entries(GROUPS).map(([key,arr])=>({title:DETAIL_TITLES[key],percent:true,denominator:groupTotal(S,key),items:arr.map(c=>({label:c[1],value:n(S[key],c[0]),hot:c[3]>0}))}))];
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    out.games=integer(out.games);
    out.gameLog=Array.isArray(out.gameLog)?out.gameLog.map(integer).filter(v=>v>0):[];
    ['counts',...Object.keys(GROUPS)].forEach(key=>{
      // §9-108-4：知っている項目は検証（非負整数）、知らない項目は捨てずに型ごと保持。新しい項目は0で足す。
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(DEF[key]).forEach(k=>{out[key][k]=integer(out[key][k]);});
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
  window.CheckerConfigs['ragnador-test']={
    uiV2:true,nanaCollab:false,storageKey:"ragnador-checker-v1-test",defaults:DEF,
    mergeKeys:['counts','edVoice','atVoice','czVoice'],sourceUrl:"https://chonborista.com/slot/universal-slot/266983/",normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:TITLE+' 設定判別メモ',hashtags:"#ラグナドール #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:"#ラグナドール #設定判別",downloadName:"ragnador_check.png",detailDownloadName:"ragnador_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['確定演出','計'+strongCount(S)+'回'],['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:[row(bestStrong(S),strongCount(S),undefined,'#ffc94d'),...COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))]},
        {x:560,items:[row('累計通常G '+logText(S),g)]}
      ]};}
    }
  };
})();

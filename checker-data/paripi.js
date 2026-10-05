(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="paripi";
  const TITLE="スマスロパリピ孔明";
  const SOURCE="https://chonborista.com/slot/yamasa-slot/263531/";
  const TAGS="#パリピ孔明 #設定判別";
  const COUNTS=[["cz","CZ","設1:1/213.6⇔設6:1/171.7"],["bonus","ボーナス初当り","設1:1/309.9⇔設6:1/228.8"]];
  const ST_END=[
    ['kanban','看板','デフォルト・画像①',0,'看','def'],
    ['blue','青背景','デフォルト・画像②',0,'青','def'],
    ['yellow','黄背景','デフォルト・画像③',0,'黄','def'],
    ['even1','偶数設定期待度UP・弱','画像④',0,'偶弱','up'],
    ['even2','偶数設定期待度UP・強','画像⑤',0,'偶強','up'],
    ['high1','高設定期待度UP・弱','画像⑥',0,'高弱','up'],
    ['high2','高設定期待度UP・強','画像⑦',0,'高強','up'],
    ['s2','設定2以上濃厚','画像⑧',2,'2','cert'],
    ['s3','設定3以上濃厚','画像⑨',3,'3','cert'],
    ['s4','設定4以上濃厚','画像⑩',4,'4','cert'],
    ['s5','設定5以上濃厚','画像⑪',5,'5','cert'],
    ['s6','設定6濃厚','画像⑫',6,'6','cert']
  ];
  const ST_HINT='ST終了時の画面を記録します。画面の見分け方はガイドからちょんぼりすたの画像で確認できます。画像番号はちょんぼりすたの掲載順です。';

  const stGroup=g=>ST_END.filter(c=>c[5]===g);
  function stTotal(S){return ST_END.reduce((a,c)=>a+n(S.stEnd,c[0]),0);}
  function certItems(S){return ST_END.filter(c=>c[3]>0).map((c,i)=>({label:c[1],rank:c[3],value:n(S.stEnd,c[0]),order:i}));}
  function certCount(S){return certItems(S).reduce((a,c)=>a+c.value,0);}
  function bestCert(S){
    const hit=certItems(S).filter(c=>c.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label} ×${hit.value}`:'確定演出 なし';
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }

  const INITIAL_HINT="CZとボーナスの初当りを記録します。CZは設定1:1/213.6／2:1/207.3／3:1/199.2／4:1/188.8／5:1/179.4／6:1/171.7。ボーナス初当りは設定1:1/309.9／2:1/299.6／3:1/280.0／4:1/262.0／5:1/243.9／6:1/228.8。";

  function n(obj,key){return Number((obj||{})[key])||0;}
  function rate(g,c){return (g>0&&c>0)?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function initialBlock(S,c){const v=n(S.counts,c[0]),r=rate(S.games,v);return r?[c[1]+' '+v+'回',r]:[c[1],v+'回'];}
  function initialDetail(S){return {title:'初当り',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),text:c[1]+' '+countRate(S.games,n(S.counts,c[0])),show:n(S.counts,c[0])>0,hot:false}))};}
  function gameSection(S){const g=S.games;return `<section class="sec">
  <div class="sec-h">通常ゲーム数</div>
  <div class="inrow"><label>通常ゲーム数</label>
    <input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  <div class="hint">連動アプリ等で確認した通常時のゲーム数。メニューの総ゲーム数はAT中を含むため入れない</div>
</section>`;}
  function initialSection(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[2]+rateSuffix(S.games,n(S.counts,c[0])),false)).join('')}</div>
    <div class="hint">${INITIAL_HINT}</div>
  </section>`;}

  const DEF={games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),stEnd:Object.fromEntries(ST_END.map(c=>[c[0],0])),img:null,iconChoice:null};
  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
    out.stEnd=Object.assign({},DEF.stEnd,out.stEnd||{});
    Object.keys(out.stEnd).forEach(k=>{out.stEnd[k]=Math.max(0,Number(out.stEnd[k])||0);});
    return out;
  }
  function pageInput(ctx){return gameSection(ctx.S)+initialSection(ctx);}
  function pageShisa(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">ST終了画面<span class="sub">計${stTotal(S)}回</span></div>
    <div class="cgrid">${ST_END.map(c=>ctx.crow('stEnd.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,stTotal(S)))).join('')}</div>
    <div class="hint">${ST_HINT}</div>
  </section>`;}
  function tplText(ctx){const S=ctx.S,g=S.games;
    const st=stTotal(S);
    const stLines=ST_END.filter(c=>n(S.stEnd,c[0])>0)
      .map(c=>`${c[1]}▶${n(S.stEnd,c[0])}回(${Math.round(100*n(S.stEnd,c[0])/st)}%)`).join('\n');
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / ${COUNTS.map(c=>c[1]+n(S.counts,c[0])+'回').join(' / ')}\n_______\n\n■初当り\n${COUNTS.map(c=>c[1]+'▶'+countRate(g,n(S.counts,c[0]))).join('\n')}${st>0?'\n\n■ST終了画面\n'+stLines:''}\n\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
  }
  window.CheckerConfigs[ID]={
    uiV2:true,nanaCollab:false,storageKey:ID+'-checker-v1',defaults:DEF,mergeKeys:['counts','stEnd'],sourceUrl:SOURCE,
    normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    pages:(ctx,pageCard)=>[()=>pageInput(ctx),()=>pageShisa(ctx),pageCard],template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,
      downloadName:ID+'_check.png',detailDownloadName:ID+'_check_detail.png',
      detail:ctx=>[initialDetail(ctx.S),
        {title:'ST終了画面',items:ST_END.map(c=>({label:c[1],value:n(ctx.S.stEnd,c[0]),hot:c[3]>0})),percent:true,denominator:stTotal(ctx.S)}
      ],
      blocks:ctx=>[...COUNTS.map(c=>initialBlock(ctx.S,c)),['通常ゲーム数',(ctx.S.games||0)+'G']],
      chart:ctx=>({title:'初当り',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[1],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S;return {title:'サマリー',startY:752,rowGap:36,fontSize:23,columns:[
        {x:70,items:[
          row(bestCert(S),certCount(S),undefined,'#ffc94d'),
          ...COUNTS.map(c=>row(c[1]+' '+countRate(S.games,n(S.counts,c[0])),n(S.counts,c[0]))),
          row('通常回転 '+(S.games||0)+'G',S.games||0),
          row('ST終了画面 計'+stTotal(S)+'回',stTotal(S))
        ]},
        {x:560,items:[
          row(shown('画面',codes(stGroup('def'),S.stEnd)),stGroup('def').reduce((a,c)=>a+n(S.stEnd,c[0]),0)),
          row(shown('期待度',codes(stGroup('up'),S.stEnd)),stGroup('up').reduce((a,c)=>a+n(S.stEnd,c[0]),0)),
          row(shown('濃厚',codes(stGroup('cert'),S.stEnd)),certCount(S))
        ]}
      ]};}
    }
  };

})();

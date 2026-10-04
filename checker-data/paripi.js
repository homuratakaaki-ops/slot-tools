(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="paripi";
  const TITLE="スマスロパリピ孔明";
  const SOURCE="https://chonborista.com/slot/yamasa-slot/263531/";
  const TAGS="#パリピ孔明 #設定判別";
  const COUNTS=[["cz","CZ","設1:1/213.6⇔設6:1/171.7"],["bonus","ボーナス初当り","設1:1/309.9⇔設6:1/228.8"]];
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

  const DEF={games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),img:null,iconChoice:null};
  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
    return out;
  }
  function pageInput(ctx){return gameSection(ctx.S)+initialSection(ctx);}
  function tplText(ctx){const S=ctx.S,g=S.games;
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / ${COUNTS.map(c=>c[1]+n(S.counts,c[0])+'回').join(' / ')}\n_______\n\n■初当り\n${COUNTS.map(c=>c[1]+'▶'+countRate(g,n(S.counts,c[0]))).join('\n')}\n\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
  }
  window.CheckerConfigs[ID]={
    uiV2:true,nanaCollab:false,storageKey:ID+'-checker-v1',defaults:DEF,mergeKeys:['counts'],sourceUrl:SOURCE,
    normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    pages:(ctx,pageCard)=>[()=>pageInput(ctx),pageCard],template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,
      downloadName:ID+'_check.png',detailDownloadName:ID+'_check_detail.png',
      detail:ctx=>[initialDetail(ctx.S)],
      blocks:ctx=>[...COUNTS.map(c=>initialBlock(ctx.S,c)),['通常ゲーム数',(ctx.S.games||0)+'G']],
      chart:ctx=>({title:'初当り',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[1],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>({title:'サマリー',startY:760,rowGap:44,fontSize:23,columns:[{x:70,items:[
        ...COUNTS.map(c=>row(c[1]+' '+countRate(ctx.S.games,n(ctx.S.counts,c[0])),n(ctx.S.counts,c[0]))),
        row('通常回転 '+(ctx.S.games||0)+'G',ctx.S.games||0)
      ]}]})
    }
  };

})();

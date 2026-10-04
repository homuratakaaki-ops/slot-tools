(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="juuou";
  const TITLE="スマスロ 獣王";
  const SOURCE="https://chonborista.com/slot/sammy-slot/263920/";
  const TAGS="#獣王 #設定判別";
  const COUNTS=[["sc","SC初当り","設1:1/326.5⇔設6:1/279.7"]];
  const INITIAL_HINT="SC（サバンナチャンス）に当選するたび記録します。この機種は設定1・2・4・5・6の5段階です。設定1:1/326.5／設定2:1/321.6／設定4:1/295.8／設定5:1/287.6／設定6:1/279.7。";

  function n(obj,key){return Number((obj||{})[key])||0;}
  function num(v){return Math.max(0,Number(v)||0);}
  function rawDenom(S){return num(S.gamesMyslo)-num(S.gamesMysloStart);}
  function denom(S){const v=rawDenom(S);return v>0?v:0;}
  function denomWarn(S){return num(S.gamesMyslo)>0&&num(S.gamesMyslo)<num(S.gamesMysloStart);}
  function syncGames(S){if(S)S.games=denom(S);return S?S.games:0;}
  function rate(g,c){return (g>0&&c>0)?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function initialBlock(S,c){const v=n(S.counts,c[0]),r=rate(denom(S),v);return r?[c[1]+' '+v+'回',r]:[c[1],v+'回'];}
  function initialDetail(S){return {title:'初当り',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),text:c[1]+' '+countRate(denom(S),n(S.counts,c[0])),show:n(S.counts,c[0])>0,hot:false}))};}
  function gamePair(title,note,startKey,nowKey,S){
    return `<div class="gpair">
        <div class="gpair-h">${title}${note?`<small>${note}</small>`:''}</div>
        <div class="gpair-row">
          <label class="gcell"><span>開始</span><input type="number" inputmode="numeric" data-number-key="${startKey}" value="${S[startKey]||''}" placeholder="0"></label>
          <label class="gcell"><span>現在</span><input type="number" inputmode="numeric" data-number-key="${nowKey}" value="${S[nowKey]||''}" placeholder="0"></label>
        </div>
      </div>`;
  }
  function gameSection(S){return `<section class="sec">
  <div class="sec-h">通常ゲーム数</div>
  <style>
      .hint.warn{color:#ff9b9b}
      .gpair+.gpair{margin-top:8px}
      .gpair-h{font-size:11px;font-weight:800;color:var(--txt);letter-spacing:.06em;margin-bottom:6px}
      .gpair-h small{font-size:10px;font-weight:500;color:var(--muted);letter-spacing:0;margin-left:6px}
      .gpair-row{display:flex;gap:8px}
      .gcell{flex:1;min-width:0;display:flex;align-items:center;gap:8px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 10px;min-height:48px}
      .gcell span{flex:none;font-size:12px;font-weight:700}
      .gcell input{flex:1;min-width:0;width:auto;font-family:var(--seg);font-size:20px;text-align:right;color:var(--gold);background:#0d0a12;border:1px solid var(--line);border-radius:8px;padding:6px 8px}
  </style>
  ${gamePair('通常ゲーム数','','gamesMysloStart','gamesMyslo',S)}
  ${denomWarn(S)?'<div class="hint warn">通常ゲーム数の現在が開始を下回っています。通常時の分母は0として扱い、確率表示は行いません。入力を確認してください。</div>':''}
  <div class="hint">マイスロの通常ゲーム数を入力します。途中から打ち始めた場合や途中から数え始めた場合は、その時点の数値を開始欄に入れてください。差分があなたのカウント区間になります。実機での確認方法が分かり次第、入力方法を追加します。</div>
</section>`;}
  function initialSection(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[2]+rateSuffix(denom(S),n(S.counts,c[0])),false)).join('')}</div>
    <div class="hint">${INITIAL_HINT}</div>
  </section>`;}

  const DEF={games:0,gamesMyslo:0,gamesMysloStart:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),img:null,iconChoice:null};
  function normalizeState(out,src){
    ['gamesMyslo','gamesMysloStart'].forEach(k=>{out[k]=num(out[k]);});
    // 旧単欄の保存値は、新キーがないときだけ現在欄へ引き継ぐ。
    // 開始0で従来の分母を保ち、再読み込み時の二重移行を防ぐ。
    if((src||{}).gamesMyslo===undefined&&!out.gamesMyslo)out.gamesMyslo=num((src||{}).games);
    out.games=denom(out);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
    return out;
  }
  function pageInput(ctx){return gameSection(ctx.S)+initialSection(ctx);}
  function tplText(ctx){const S=ctx.S,g=denom(S);
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / ${COUNTS.map(c=>c[1]+n(S.counts,c[0])+'回').join(' / ')}\n_______\n\n■初当り\n${COUNTS.map(c=>c[1]+'▶'+countRate(g,n(S.counts,c[0]))).join('\n')}\n\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
  }
  window.CheckerConfigs[ID]={
    uiV2:true,nanaCollab:false,storageKey:ID+'-checker-v1',defaults:DEF,mergeKeys:['counts'],sourceUrl:SOURCE,
    normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    pages:(ctx,pageCard)=>{syncGames(ctx.S);return [()=>pageInput(ctx),pageCard];},template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,
      downloadName:ID+'_check.png',detailDownloadName:ID+'_check_detail.png',
      detail:ctx=>[initialDetail(ctx.S)],
      blocks:ctx=>[...COUNTS.map(c=>initialBlock(ctx.S,c)),['通常ゲーム数',denom(ctx.S)+'G']],
      chart:ctx=>({title:'初当り',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[1],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>({title:'サマリー',startY:760,rowGap:44,fontSize:23,columns:[{x:70,items:[
        ...COUNTS.map(c=>row(c[1]+' '+countRate(denom(ctx.S),n(ctx.S.counts,c[0])),n(ctx.S.counts,c[0]))),
        row('通常回転 '+denom(ctx.S)+'G',denom(ctx.S))
      ]}]})
    }
  };

})();

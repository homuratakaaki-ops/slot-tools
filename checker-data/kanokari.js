(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const DEF={
    games:0,
    counts:{cz:0,first:0},
    img:null,
    iconChoice:null
  };

  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function row(text,value){return {text,value:Number(value)||0,active:(Number(value)||0)>0};}

  function normalizeState(data){
    const src=data&&typeof data==='object'?data:{};
    const out=Object.assign({},DEF,src);
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(key=>{
      out.counts[key]=Math.max(0,Number(out.counts[key])||0);
    });
    return out;
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.cz','CZ当選','設1:1/172⇔設6:1/149',0)}
      ${ctx.crow('counts.first','初当り','設1:1/269⇔設6:1/226',1)}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">解析待ちの示唆<span class="sub">未実装</span></div>
    <div class="hint">ボーナス終了画面とREGULAR BONUS中のキャラ紹介に設定示唆が存在する可能性が報告されていますが、パターン・内容とも解析待ちのため本ツールでは未実装です。判明後に追加します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,cz=n(S.counts,'cz'),first=n(S.counts,'first');
    let t=`設定判別メモ｜Lパチスロ 彼女、お借りします\n通常 ${g||0}G / CZ${cz}回 / 初当り${first}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(cz)}`,
      `初当り▶${countLine(first)}`
    ]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',n(S.counts,'cz'),0),
        detailItem('初当り',n(S.counts,'first'),1)
      ]}
    ];
  }

  window.CheckerConfigs.kanokari={
    nanaCollab:false,
    storageKey:'kanokari-checker-v1',
    defaults:DEF,
    mergeKeys:['counts'],
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/263079/',
    normalizeState:normalizeState,
    share:{title:'Lパチスロ 彼女、お借りします 設定判別メモ',hashtags:'#かのかり #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lパチスロ 彼女、お借りします',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#かのかり #設定判別',
      downloadName:'kanokari_check.png',
      detailDownloadName:'kanokari_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['通常回転',(S.games||0)+'G'],
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['初当り',n(S.counts,'first')+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:350,
        step:260,
        width:120,
        items:[
          {label:'CZ',value:n(ctx.S.counts,'cz')},
          {label:'初当り',value:n(ctx.S.counts,'first')}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S;
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(`通常回転 ${S.games||0}G`,S.games||0),
              row(`CZ当選 ${n(S.counts,'cz')}回`,n(S.counts,'cz')),
              row(`初当り ${n(S.counts,'first')}回`,n(S.counts,'first'))
            ]}
          ]
        };
      }
    }
  };
})();

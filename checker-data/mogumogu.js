(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const DEF={
    games:0,
    counts:{cz:0,at:0,direct:0},
    img:null,
    iconChoice:null
  };

  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){
    const out=lines.filter(Boolean);
    return out.length?`\n■${title}\n${out.join('\n')}\n`:'';
  }
  function detailItem(label,value,hot){
    return {label,value:Number(value)||0,hot:!!hot};
  }
  function row(text,value,active,color){
    return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};
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
      ${ctx.crow('counts.cz','CZ当選','設1:1/324⇔設6:1/287',0)}
      ${ctx.crow('counts.at','AT初当り','設1:1/431⇔設6:1/358',1)}
      ${ctx.crow('counts.direct','AT直撃','CZ非経由の当選。高設定ほど当選しやすいとされる（数値は解析待ち）',0)}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">解析待ちの示唆<span class="sub">未実装</span></div>
    <div class="hint">AT終了画面の種類、内部モードの移行率、AT終了後の制覇ロード引き戻し率（全設定平均 約31%）にも設定差の可能性が報告されていますが、数値未判明のため本ツールでは扱いません。判明後に追加します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games;
    const cz=n(S.counts,'cz'),at=n(S.counts,'at'),direct=n(S.counts,'direct');
    let t=`設定判別メモ｜Lモグモグ風林火山 大海戦の巻\n通常 ${g||0}G / CZ${cz}回 / AT${at}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(cz)}`,
      `AT初当り▶${countLine(at)}`,
      `AT直撃▶${countLine(direct)}`
    ]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',n(S.counts,'cz'),0),
        detailItem('AT初当り',n(S.counts,'at'),1),
        detailItem('AT直撃',n(S.counts,'direct'),0)
      ]}
    ];
  }

  window.CheckerConfigs.mogumogu={
    nanaCollab:false,
    storageKey:'mogumogu-checker-v1',
    defaults:DEF,
    mergeKeys:['counts'],
    sourceUrl:'https://chonborista.com/slot/net-slot/263515/',
    normalizeState:out=>{
      out=out||{};
      out.games=Math.max(0,Number(out.games)||0);
      out.counts=Object.assign({},DEF.counts,out.counts||{});
      Object.keys(out.counts).forEach(k=>{
        out.counts[k]=Math.max(0,Number(out.counts[k])||0);
      });
      return out;
    },
    share:{
      title:'Lモグモグ風林火山 大海戦の巻 設定判別メモ',
      hashtags:'#モグモグ風林火山 #設定判別'
    },
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lモグモグ風林火山 大海戦の巻',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#モグモグ風林火山 #設定判別',
      downloadName:'mogumogu_check.png',
      detailDownloadName:'mogumogu_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['通常回転',(S.games||0)+'G'],
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['AT初当り',n(S.counts,'at')+'回'],
          ['AT直撃',n(S.counts,'direct')+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:250,
        step:230,
        width:100,
        items:[
          {label:'CZ',value:n(ctx.S.counts,'cz')},
          {label:'AT',value:n(ctx.S.counts,'at')},
          {label:'直撃',value:n(ctx.S.counts,'direct')}
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
              row(`AT初当り ${n(S.counts,'at')}回`,n(S.counts,'at')),
              row(`AT直撃 ${n(S.counts,'direct')}回`,n(S.counts,'direct'))
            ]}
          ]
        };
      }
    }
  };
})();

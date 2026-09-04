(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const BB_END=[
    ['normal','通常パターン','デフォルト',0,'通'],
    ['rare','レアパターン','示唆調査中',0,'レ']
  ];

  const DEF={
    games:0,
    counts:{big:0,reg:0},
    screens:Object.fromEntries(BB_END.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]>0));}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}

  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    out.screens=Object.assign({},DEF.screens,out.screens||{});
    Object.keys(out.counts).forEach(key=>{out.counts[key]=Math.max(0,Number(out.counts[key])||0);});
    Object.keys(out.screens).forEach(key=>{out.screens[key]=Math.max(0,Number(out.screens[key])||0);});
    return out;
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段（ユニメモ等）と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.big','BIG','設1:1/324.4⇔設6:1/297.9',1)}
      ${ctx.crow('counts.reg','REG','設1:1/352.3⇔設6:1/300.6',1)}
    </div>
    <div class="hint">合算は設1:1/168.9⇔設6:1/149.6。本機の設定は1・2・5・6の4段階です。</div>
  </section>`;
  }

  function pageSuggest(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">BB終了画面<span class="sub">計${sum(S.screens)}回</span></div>
    <div class="cgrid">${BB_END.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],0)).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">解析待ちの示唆<span class="sub">未実装</span></div>
    <div class="hint">BB終了画面のレアパターンの示唆内容は解析待ちです。判明後に更新します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,big=n(S.counts,'big'),reg=n(S.counts,'reg');
    let t=`設定判別メモ｜スマスロ タコスロ\n通常 ${g||0}G / BIG${big}回 / REG${reg}回\n_______\n`;
    t+=section('初当り',[
      `BIG▶${countLine(big)}`,
      `REG▶${countLine(reg)}`
    ]);
    t+=section('BB終了画面',sum(S.screens)>0?BB_END.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('BIG',n(S.counts,'big'),1),
        detailItem('REG',n(S.counts,'reg'),1)
      ]},
      {title:'BB終了画面',items:detailItems(BB_END,S.screens)}
    ];
  }

  window.CheckerConfigs.takoslot={
    nanaCollab:false,
    storageKey:'takoslot-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','screens'],
    sourceUrl:'https://chonborista.com/slot/universal-slot/262349/',
    normalizeState:normalizeState,
    share:{title:'スマスロ タコスロ 設定判別メモ',hashtags:'#タコスロ #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageSuggest(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'スマスロ タコスロ',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#タコスロ #設定判別',
      downloadName:'takoslot_check.png',
      detailDownloadName:'takoslot_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['通常回転',(S.games||0)+'G'],
          ['BIG',n(S.counts,'big')+'回'],
          ['REG',n(S.counts,'reg')+'回'],
          ['ボーナス計',(n(S.counts,'big')+n(S.counts,'reg'))+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:250,
        step:230,
        width:100,
        items:[
          {label:'BIG',value:n(ctx.S.counts,'big')},
          {label:'REG',value:n(ctx.S.counts,'reg')},
          {label:'終了画面',value:sum(ctx.S.screens)}
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
              row(`BIG ${n(S.counts,'big')}回`,n(S.counts,'big')),
              row(`REG ${n(S.counts,'reg')}回`,n(S.counts,'reg')),
              row(`レアパターン ${n(S.screens,'rare')}回`,n(S.screens,'rare'))
            ]}
          ]
        };
      }
    }
  };
})();

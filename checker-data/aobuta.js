(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const SCREENS=[
    ['sakuta','梓川咲太','デフォルト',0,'咲'],
    ['tomoe','古賀朋絵','示唆調査中',0,'朋'],
    ['nodoka','豊浜のどか','示唆調査中',0,'の'],
    ['rio','双葉理央','示唆調査中',0,'理'],
    ['mai','桜島麻衣','示唆調査中',0,'麻'],
    ['kaede','かえで(吉)','設定3以上確定演出',3,'吉'],
    ['shoko','翔子(良)','設定4以上確定演出',4,'良'],
    ['maiBunny','麻衣バニー(優)','設定5以上確定演出',5,'優'],
    ['all','全員集合(極)','設定6確定演出',6,'極']
  ];

  const DEF={
    games:0,
    counts:{first:0},
    screens:Object.fromEntries(SCREENS.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot,text){
    const item={label,value:Number(value)||0,hot:!!hot};
    if(text)item.text=text;
    return item;
  }
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]>0));}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'−'}`;
  }
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function rankText(rank){return rank===6?'6確定':rank+'以上';}
  function allCert(S){
    return SCREENS.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.screens,c[0]),rank:c[3],order:10+c[3]}));
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function certTier(S,rank){return allCert(S).filter(v=>v.rank===rank).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }

  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(key=>{out.counts[key]=Math.max(0,Number(out.counts[key])||0);});
    out.screens=Object.assign({},DEF.screens,out.screens||{});
    Object.keys(out.screens).forEach(key=>{out.screens[key]=Math.max(0,Number(out.screens[key])||0);});
    return out;
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段（アプリ等）と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.first','初当り（青春BONUS）','設2:1/350.8⇔設6:1/207.8',1)}
    </div>
    <div class="hint">本機は設定1非搭載（設定L搭載）です。設定6の初当りは1/207.8と突出して軽いため、初当り確率が最重要の判別材料になります。</div>
  </section>`;
  }

  function pageScreens(ctx){
    const total=sum(ctx.S.screens);
    return `<section class="sec">
    <div class="sec-h">ST（青ブタJUDGE）終了画面<span class="sub">計${total}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">確定演出系の画面にはスタンプ（吉/良/優/極）が併記されます。示唆調査中の4種は解析判明後に更新します。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,first=n(S.counts,'first');
    let t=`設定判別メモ｜L青春ブタ野郎はバニーガール先輩の夢を見ない\n通常 ${g||0}G / 初当り${first}回\n_______\n`;
    t+=section('初当り',[
      `初当り（青春BONUS）▶${countLine(first)}`,
      `通常回転▶${g||0}G`
    ]);
    t+=section('ST（青ブタJUDGE）終了画面',sum(S.screens)>0?SCREENS.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('初当り（青春BONUS）',n(S.counts,'first'),0)
      ]},
      {title:'ST（青ブタJUDGE）終了画面',items:detailItems(SCREENS,S.screens)}
    ];
  }

  window.CheckerConfigs.aobuta={
    nanaCollab:false,
    storageKey:'aobuta-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','screens'],
    sourceUrl:'https://chonborista.com/slot/orinpia-slot/261018/',
    normalizeState:normalizeState,
    share:{
      title:'L青春ブタ野郎はバニーガール先輩の夢を見ない 設定判別メモ',
      hashtags:'#青ブタ #設定判別'
    },
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageScreens(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'L青春ブタ野郎はバニーガール先輩の夢を見ない',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#青ブタ #設定判別',
      downloadName:'aobuta_check.png',
      detailDownloadName:'aobuta_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['初当り',n(S.counts,'first')+'回'],
          ['通常回転',(S.games||0)+'G'],
          ['終了画面',sum(S.screens)+'回'],
          ['確定演出','計'+certCount(S)+'回']
        ];
      },
      chart:ctx=>({
        title:'示唆分布',
        x:190,
        step:200,
        width:90,
        items:[
          {label:'3+',value:certTier(ctx.S,3)},
          {label:'4+',value:certTier(ctx.S,4)},
          {label:'5+',value:certTier(ctx.S,5)},
          {label:'6',value:certTier(ctx.S,6)}
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
              row(bestCert(S),certCount(S),certCount(S)>0,'#ffc94d'),
              row(`初当り ${n(S.counts,'first')}回`,n(S.counts,'first')),
              row(`通常回転 ${S.games||0}G`,S.games||0),
              row(`終了画面 計${sum(S.screens)}回`,sum(S.screens)),
              row(shown('示唆調査中',[['朋',n(S.screens,'tomoe')],['の',n(S.screens,'nodoka')],['理',n(S.screens,'rio')],['麻',n(S.screens,'mai')]]),
                  n(S.screens,'tomoe')+n(S.screens,'nodoka')+n(S.screens,'rio')+n(S.screens,'mai'))
            ]},
            {x:560,items:[
              row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
              row(`かえで(吉) ${n(S.screens,'kaede')}回`,n(S.screens,'kaede')),
              row(`翔子(良) ${n(S.screens,'shoko')}回`,n(S.screens,'shoko')),
              row(`麻衣バニー(優) ${n(S.screens,'maiBunny')}回`,n(S.screens,'maiBunny')),
              row(`全員集合(極) ${n(S.screens,'all')}回`,n(S.screens,'all'))
            ]}
          ]
        };
      }
    }
  };
})();

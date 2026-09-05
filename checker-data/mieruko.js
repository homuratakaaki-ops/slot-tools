(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const BONUS_END=[
    ['white','白枠','示唆調査中',0,'白'],
    ['purple','紫枠','チャンス（暫定情報）',0,'紫'],
    ['rainbow','虹枠','高設定示唆（暫定情報）',0,'虹']
  ];
  const RB_CHARA=[
    ['yamanokami','山の神様出現','出現しづらいキャラ（暫定情報）',0,'山']
  ];

  const DEF={
    games:0,
    counts:{big:0,reg:0},
    screens:Object.fromEntries(BONUS_END.map(v=>[v[0],0])),
    chara:Object.fromEntries(RB_CHARA.map(v=>[v[0],0])),
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
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}

  function normalizeState(src){
    const out=Object.assign({},DEF,src||{});
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    out.screens=Object.assign({},DEF.screens,out.screens||{});
    out.chara=Object.assign({},DEF.chara,out.chara||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
    Object.keys(out.screens).forEach(k=>{out.screens[k]=Math.max(0,Number(out.screens[k])||0);});
    Object.keys(out.chara).forEach(k=>{out.chara[k]=Math.max(0,Number(out.chara[k])||0);});
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
      ${ctx.crow('counts.big','BIG（超BIG含む）','設1:1/266.5⇔設6:1/227.1',1)}
      ${ctx.crow('counts.reg','REGULAR','設1:1/275.1⇔設6:1/233.6',1)}
    </div>
    <div class="hint">合算は設1:1/135.4⇔設6:1/115.1。超BIGはBIGに含めてカウントしてください。</div>
  </section>`;
  }

  function pageSuggest(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">ボーナス終了画面<span class="sub">計${sum(S.screens)}回</span></div>
    <div class="cgrid">${BONUS_END.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],0)).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">RB中のキャラ紹介<span class="sub">計${sum(S.chara)}回</span></div>
    <div class="cgrid">${RB_CHARA.map(c=>ctx.crow('chara.'+c[0],c[1],c[2],0)).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">暫定情報の示唆<span class="sub">未実装</span></div>
    <div class="hint">エンディング中の1枚絵、規定ゲーム数からの高確移行率、CZ恐怖トノ遭遇の初期配列にも設定差の可能性が報告されていますが、暫定情報のため本ツールでは扱いません。正式解析判明後に追加します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,big=n(S.counts,'big'),reg=n(S.counts,'reg');
    let t=`設定判別メモ｜L見える子ちゃん\n通常 ${g||0}G / BIG${big}回 / REG${reg}回\n_______\n`;
    t+=section('初当り',[
      `BIG（超BIG含む）▶${countLine(big)}`,
      `REGULAR▶${countLine(reg)}`
    ]);
    t+=section('ボーナス終了画面',sum(S.screens)>0?BONUS_END.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=section('RB中のキャラ紹介',sum(S.chara)>0?RB_CHARA.filter(c=>n(S.chara,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.chara,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('BIG（超BIG含む）',n(S.counts,'big'),1),
        detailItem('REGULAR',n(S.counts,'reg'),1)
      ]},
      {title:'ボーナス終了画面',items:detailItems(BONUS_END,S.screens)},
      {title:'RB中のキャラ紹介',items:detailItems(RB_CHARA,S.chara)}
    ];
  }

  window.CheckerConfigs.mieruko={
    nanaCollab:false,
    storageKey:'mieruko-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','screens','chara'],
    sourceUrl:'https://chonborista.com/slot/pionia-slot/261153/',
    normalizeState:normalizeState,
    share:{title:'L見える子ちゃん 設定判別メモ',hashtags:'#見える子ちゃん #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageSuggest(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'L見える子ちゃん',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#見える子ちゃん #設定判別',
      downloadName:'mieruko_check.png',
      detailDownloadName:'mieruko_check_detail.png',
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
              row(shown('終了画面',[['白',n(S.screens,'white')],['紫',n(S.screens,'purple')],['虹',n(S.screens,'rainbow')]]),sum(S.screens)),
              row(`山の神様 ${n(S.chara,'yamanokami')}回`,n(S.chara,'yamanokami'))
            ]}
          ]
        };
      }
    }
  };
})();

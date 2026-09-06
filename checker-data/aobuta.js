(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  // [id, 表示名, サブラベル, rank(確定設定/0=なし), カード略号, 示唆系統]
  const SCREENS=[
    ['sakuta','梓川咲太','デフォルト',0,'咲',null],
    ['tomoe','古賀朋絵','偶数設定示唆',0,'朋','even'],
    ['nodoka','豊浜のどか','奇数設定示唆',0,'の','odd'],
    ['rio','双葉理央','高設定示唆（弱）',0,'理','weak'],
    ['mai','桜島麻衣','高設定示唆（強）',0,'麻','strong'],
    ['kaede','かえで(吉)','設定3以上確定演出',3,'吉',null],
    ['shoko','翔子(良)','設定4以上確定演出',4,'良',null],
    ['maiBunny','麻衣バニー(優)','設定5以上確定演出',5,'優',null],
    ['all','全員集合(極)','設定6確定演出',6,'極',null]
  ];

  // 規定ポイント [id, 表示名, サブラベル]
  const POINTS=[
    ['p300','300pt',''],
    ['p400','400pt','前兆移行率1.0〜2.8%（設定差あり）'],
    ['p500','500pt','']
  ];
  // アオハルチャンス（報酬獲得ゾーン）
  const AOHAL=[
    ['cherry','チェリー','成功30〜40%'],
    ['chance','チャンス目','成功50〜60%']
  ];
  // 咲太クエスト（単カウント）
  const QUEST=[
    ['suika','スイカ','',0,'ス'],
    ['chance','チャンス目','',0,'チ']
  ];
  // 不可思議モード（単カウント・示唆内容は当該モードの効果）
  const FUSHIGI=[
    ['tomoe','古賀朋絵','次回規定ポイントが100pt',0,'朋'],
    ['nodoka','豊浜のどか','アオハルCHANCE報酬優遇',0,'の'],
    ['rio','双葉理央','常にアオハルCHANCE高確率',0,'理'],
    ['mai','桜島麻衣','規定ポイント500pt以内',0,'麻'],
    ['kaede','梓川かえで','次回CZに梓川かえで出現',0,'か'],
    ['shoko','牧之原翔子','次回CZに牧之原翔子出現',0,'翔']
  ];
  // CZエピソードチャンス 最終ゲームの特殊抽選（キャラ別・成立役別）
  const CZ_CHARS=[
    ['tomoe','古賀朋絵',[['t1','リプレイ・チェリー'],['t2','ベル'],['t3','チャンス目']]],
    ['nodoka','豊浜のどか',[['n1','リプレイ'],['n2','ベル・スイカ・チェリー'],['n3','チャンス目']]],
    ['rio','双葉理央',[['r1','リプレイ・スイカ'],['r2','ベル'],['r3','チャンス目']]],
    ['mai','桜島麻衣',[['m1','リプレイ'],['m2','ベル'],['m3','チャンス目']]],
    ['kaede','梓川かえで',[['k1','リプレイ'],['k2','ベル']]],
    ['shoko','牧之原翔子',[['s1','リプレイ'],['s2','ベル']]]
  ];
  const CZ_ROWS=CZ_CHARS.flatMap(c=>c[2].map(r=>[r[0],c[1]+' '+r[1]]));

  function pairKeys(list){return Object.fromEntries(list.flatMap(v=>[[v[0]+'d',0],[v[0]+'c',0]]));}

  const DEF={
    games:0,
    counts:{first:0},
    points:pairKeys(POINTS),
    aohal:pairKeys(AOHAL),
    quest:Object.fromEntries(QUEST.map(v=>[v[0],0])),
    fushigi:Object.fromEntries(FUSHIGI.map(v=>[v[0],0])),
    czr:pairKeys(CZ_ROWS),
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
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],n(state,c[0]),c[3]>0));}
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
  function tierCount(S,tier){
    return SCREENS.filter(c=>c[5]===tier).reduce((a,c)=>a+n(S.screens,c[0]),0);
  }

  // ---- n/d 型（到達を分母、当選を分子として数える行） ----
  function den(S,key,id){return n(S[key],id+'d');}
  function hit(S,key,id){return n(S[key],id+'c');}
  function ndText(S,key,id){return `${hit(S,key,id)}/${den(S,key,id)}`;}
  function ndRow(ctx,key,id,name,sub,winLabel,missLabel){
    const S=ctx.S;
    // 減算モードで「外れ側」を押すと分母だけが減り、当選回数を下回りうる。
    // n<=d を壊さないよう、減らせる外れが残っていない場合はボタンを無効化する。
    const canMinus=den(S,key,id)>hit(S,key,id);
    const missAttrs=ctx.mode<0&&!canMinus?'disabled aria-disabled="true"':`data-bump="${key}.${id}d"`;
    return `<div class="crow cycle-row nd-row">
      <div class="ct"><b>${name}</b>${sub?`<small>${sub}</small>`:''}</div>
      <div class="num">${hit(S,key,id)}</div>
      <div class="pct">${ndText(S,key,id)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${key}.${id}d,${key}.${id}c" data-label="${name} ${winLabel}" aria-label="${name} ${winLabel}">${winLabel}</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${name} ${missLabel}" aria-label="${name} ${missLabel}">${missLabel}</button>
      </div>
    </div>`;
  }
  const ND_STYLE=`<style>
      .cycle-row .num{min-width:34px}
      .cycle-row .ct{flex:1;min-width:0}
      .cycle-row .ct b{display:block;font-size:12px;font-weight:700;line-height:1.25}
      .cycle-row .ct small{display:block;font-size:9.5px;color:var(--muted);line-height:1.3}
      .cycle-row .pct{min-width:50px;text-align:right}
      .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}
      .cycle-btn{height:44px;min-width:50px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 7px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}
      .cycle-btn.win{color:#ffc94d}
      .cycle-btn[disabled]{opacity:.4}
      .minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
    </style>`;

  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    ['counts','quest','fushigi','screens'].forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    });
    [['points',POINTS],['aohal',AOHAL],['czr',CZ_ROWS]].forEach(entry=>{
      const key=entry[0];
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
      entry[1].forEach(v=>{if(out[key][v[0]+'c']>out[key][v[0]+'d'])out[key][v[0]+'d']=out[key][v[0]+'c'];});
    });
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
  </section>
  <section class="sec">
    <div class="sec-h">規定ポイント当選<span class="sub">到達 ${POINTS.reduce((a,p)=>a+den(S,'points',p[0]),0)}回</span></div>
    ${ND_STYLE}
    <div class="cgrid">${POINTS.map(p=>ndRow(ctx,'points',p[0],p[1],p[2],'当選','スルー')).join('')}</div>
    <div class="hint">規定ポイント到達時に記録します。当選したら当選側、スルーしたらスルー側を押してください。減算モードでは「当選」が分母と当選回数の両方を、「スルー」が分母だけを1つ戻します。</div>
  </section>`;
  }

  function pageNormal(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">アオハルチャンス（報酬獲得ゾーン）<span class="sub">発生 ${AOHAL.reduce((a,v)=>a+den(S,'aohal',v[0]),0)}回</span></div>
    ${ND_STYLE}
    <div class="cgrid">${AOHAL.map(v=>ndRow(ctx,'aohal',v[0],v[1],v[2],'成功','失敗')).join('')}</div>
    <div class="hint">アオハルチャンスの契機役ごとに、成功・失敗を記録します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">咲太クエスト<span class="sub">計${sum(S.quest)}回</span></div>
    <div class="cgrid">${QUEST.map(c=>ctx.crow('quest.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">咲太クエストの発生契機となった小役を記録します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">不可思議モード<span class="sub">計${sum(S.fushigi)}回</span></div>
    <div class="cgrid">${FUSHIGI.map(c=>ctx.crow('fushigi.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">不可思議モード移行時のキャラを記録します。サブの表記は、そのキャラが示すモードの効果です。設定示唆ではありません。</div>
  </section>`;
  }

  function pageCz(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">CZエピソードチャンス 最終ゲーム特殊抽選<span class="sub">計${CZ_ROWS.reduce((a,r)=>a+den(S,'czr',r[0]),0)}回</span></div>
    ${ND_STYLE}
    <div class="hint">CZ最終ゲームで成立した小役と、その結果を記録します。キャラごとに当選率が異なるため、キャラ別・小役別に分けています。当選率が同じ小役は1行にまとめ、当選が確定する小役は判別材料にならないため行を設けていません。</div>
  </section>
  ${CZ_CHARS.map(c=>`<section class="sec">
    <div class="sec-h">${c[1]}<span class="sub">${c[2].reduce((a,r)=>a+hit(S,'czr',r[0]),0)}/${c[2].reduce((a,r)=>a+den(S,'czr',r[0]),0)}</span></div>
    <div class="cgrid">${c[2].map(r=>ndRow(ctx,'czr',r[0],r[1],'','当選','ハズレ')).join('')}</div>
  </section>`).join('')}`;
  }

  function pageScreens(ctx){
    const total=sum(ctx.S.screens);
    return `<section class="sec">
    <div class="sec-h">ST（青ブタJUDGE）終了画面<span class="sub">計${total}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">確定演出系の画面にはスタンプ（吉/良/優/極）が併記されます。偶数・奇数示唆と高設定示唆は上下関係を持たないため、確定演出とは別枠で集計します。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,first=n(S.counts,'first');
    let t=`設定判別メモ｜L青春ブタ野郎はバニーガール先輩の夢を見ない\n通常 ${g||0}G / 初当り${first}回\n_______\n`;
    t+=section('初当り',[
      `初当り（青春BONUS）▶${countLine(first)}`,
      `通常回転▶${g||0}G`
    ]);
    t+=section('規定ポイント当選',POINTS.map(p=>`${p[1]}▶${ndText(S,'points',p[0])}`));
    t+=section('アオハルチャンス',AOHAL.map(v=>`${v[1]}▶${ndText(S,'aohal',v[0])}`));
    t+=section('咲太クエスト',QUEST.map(c=>`${c[1]}▶${countLine(n(S.quest,c[0]))}`));
    t+=section('不可思議モード',FUSHIGI.map(c=>`${c[1]}▶${countLine(n(S.fushigi,c[0]))}`));
    t+=section('CZ最終G特殊抽選',CZ_CHARS.map(c=>
      `${c[1]}▶${c[2].map(r=>`${r[1]} ${ndText(S,'czr',r[0])}`).join('／')}`));
    t+=section('ST（青ブタJUDGE）終了画面',SCREENS.map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`));
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('初当り（青春BONUS）',n(S.counts,'first'),0)
      ]},
      {title:'規定ポイント当選',items:POINTS.map(p=>({
        label:p[1],value:hit(S,'points',p[0]),hot:false,
        text:`${p[1]} ${ndText(S,'points',p[0])}`,show:den(S,'points',p[0])>0}))},
      {title:'アオハルチャンス',items:AOHAL.map(v=>({
        label:v[1],value:hit(S,'aohal',v[0]),hot:false,
        text:`${v[1]} ${ndText(S,'aohal',v[0])}`,show:den(S,'aohal',v[0])>0}))},
      {title:'咲太クエスト',items:detailItems(QUEST,S.quest)},
      {title:'不可思議モード',items:detailItems(FUSHIGI,S.fushigi)},
      {title:'CZ最終G特殊抽選',items:CZ_ROWS.map(r=>({
        label:r[1],value:hit(S,'czr',r[0]),hot:false,
        text:`${r[1]} ${ndText(S,'czr',r[0])}`,show:den(S,'czr',r[0])>0}))},
      {title:'ST（青ブタJUDGE）終了画面',items:detailItems(SCREENS,S.screens)}
    ];
  }

  window.CheckerConfigs.aobuta={
    nanaCollab:true,
    storageKey:'aobuta-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','points','aohal','quest','fushigi','czr','screens'],
    sourceUrl:'https://chonborista.com/slot/orinpia-slot/261018/',
    normalizeState:normalizeState,
    share:{
      title:'L青春ブタ野郎はバニーガール先輩の夢を見ない 設定判別メモ',
      hashtags:'#青ブタ #設定判別'
    },
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageNormal(ctx),()=>pageCz(ctx),()=>pageScreens(ctx),pageCard],
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
        const ptHit=POINTS.reduce((a,p)=>a+hit(S,'points',p[0]),0);
        const ptDen=POINTS.reduce((a,p)=>a+den(S,'points',p[0]),0);
        const tiers=tierCount(S,'even')+tierCount(S,'odd')+tierCount(S,'weak')+tierCount(S,'strong');
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
              row(`規定ポイント当選 ${ptHit}/${ptDen}`,ptDen),
              row(shown('示唆',[['偶',tierCount(S,'even')],['奇',tierCount(S,'odd')],['高弱',tierCount(S,'weak')],['高強',tierCount(S,'strong')]]),tiers)
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

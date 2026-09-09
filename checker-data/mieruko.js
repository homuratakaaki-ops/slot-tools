(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  // [id, 表示名, サブラベル, rank(確定設定/0=なし), カード略号]
  const BONUS_END=[
    ['p1','パターン①','デフォルト',0,'①'],
    ['p2','パターン②','偶数設定期待度UP',0,'②'],
    ['p3','パターン③','高設定期待度UP（弱）',0,'③'],
    ['p4','パターン④','高設定期待度UP（強）',0,'④'],
    ['p5','パターン⑤','設定2以上確定演出',2,'⑤'],
    ['p6','パターン⑥','次回（超）BIG期待度85%',0,'⑥'],
    ['p7','パターン⑦','次回300or600G天井の示唆',0,'⑦'],
    ['p8','パターン⑧','CZ高確ループ移行の示唆（REG後のみ出現）',0,'⑧'],
    ['p9','パターン⑨','次回テーブルDの示唆',0,'⑨'],
    ['p10','パターン⑩','設定4以上確定演出',4,'⑩'],
    ['p11','パターン⑪','設定5以上確定演出',5,'⑪'],
    ['p12','パターン⑫','設定6確定演出',6,'⑫'],
    ['p13','パターン⑬','設定6確定演出',6,'⑬']
  ];
  const RB_CHARA=[
    ['s1','シナリオ①','奇数設定期待度UP',0,'①'],
    ['s2','シナリオ②','偶数設定期待度UP',0,'②'],
    ['s3','シナリオ③','奇数かつ高設定期待度UP',0,'③'],
    ['s4','シナリオ④','偶数かつ高設定期待度UP',0,'④']
  ];

  const DEF={
    games:0,
    counts:{cz:0,big:0,reg:0},
    screens:Object.fromEntries(BONUS_END.map(v=>[v[0],0])),
    chara:Object.fromEntries(RB_CHARA.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function n(obj,key){return Number((obj||{})[key])||0;}
  // 旧キー（白/紫/虹・山の神様）は state に残すが集計には入れないため、行定義のキーだけを合計する
  function sumRows(rows,obj){return rows.reduce((a,c)=>a+n(obj,c[0]),0);}
  function screenTotal(S){return sumRows(BONUS_END,S.screens);}
  function charaTotal(S){return sumRows(RB_CHARA,S.chara);}
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
  function rankText(rank){return rank===6?'6確定':rank+'以上';}
  function allStrong(S){
    return BONUS_END.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.screens,c[0]),rank:c[3]}));
  }
  function strongCount(S){return allStrong(S).reduce((a,b)=>a+b.value,0);}
  function bestStrong(S){
    const hit=allStrong(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank))[0];
    return hit?`確定演出 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }

  function normalizeState(src){
    const out=Object.assign({},DEF,src||{});
    out.games=Math.max(0,Number(out.games)||0);
    // 旧キーは Object.assign で引き継がれる。新キーは DEF 側で0初期化される
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
      ${ctx.crow('counts.cz','CZ当選（恐怖トノ遭遇）','設1:1/166.6⇔設6:1/136.1',1)}
      ${ctx.crow('counts.big','BIG（超BIG含む）','設1:1/266.5⇔設6:1/227.1',1)}
      ${ctx.crow('counts.reg','REGULAR','設1:1/275.1⇔設6:1/233.6',1)}
    </div>
    <div class="hint">合算は設1:1/135.4⇔設6:1/115.1。超BIGはBIGに含めてカウントしてください。CZは「恐怖トノ遭遇」のトータル出現率です。</div>
  </section>`;
  }

  function pageSuggest(ctx){
    const S=ctx.S,scr=screenTotal(S),chr=charaTotal(S);
    return `<section class="sec">
    <div class="sec-h">ボーナス終了画面<span class="sub">計${scr}回</span></div>
    <div class="cgrid">${BONUS_END.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,screenTotal(ctx.S)))).join('')}</div>
    <div class="hint">パターンの絵柄は解析ページの画像でご確認ください。<a href="https://chonborista.com/slot/pionia-slot/261153/" target="_blank" rel="noopener">ちょんぼりすた様の解析ページ</a>で番号順に掲載されています。</div>
  </section>
  <section class="sec">
    <div class="sec-h">RB中のキャラ紹介<span class="sub">計${chr}回</span></div>
    <div class="cgrid">${RB_CHARA.map(c=>ctx.crow('chara.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,charaTotal(ctx.S)))).join('')}</div>
    <div class="hint">2人目（百合川ハナ=①③／四谷恭介=②④）と5人目（神社の怪=①②／山の神様=③④）の組み合わせでシナリオを特定できます。</div>
  </section>
  <section class="sec">
    <div class="sec-h">参照<span class="sub">記録対象外</span></div>
    <div class="hint">エンディング中の1枚絵は終了画面と同じ設定示唆パターンが出現します（到達自体が稀なため記録欄は設けていません）。弱レア役のCZ当選率・レア役契機のCZ高確移行率にも設定差がありますが、通常中とCZ高確中で数値が大きく異なり、高確状態を遊技中に確定できないため本ツールでは記録対象外としています。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,cz=n(S.counts,'cz'),big=n(S.counts,'big'),reg=n(S.counts,'reg');
    let t=`設定判別メモ｜L見える子ちゃん\n通常 ${g||0}G / CZ${cz}回 / BIG${big}回 / REG${reg}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選（恐怖トノ遭遇）▶${countLine(cz)}`,
      `BIG（超BIG含む）▶${countLine(big)}`,
      `REGULAR▶${countLine(reg)}`
    ]);
    t+=section('ボーナス終了画面',screenTotal(S)>0?BONUS_END.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}（${c[2]}）▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=section('RB中のキャラ紹介',charaTotal(S)>0?RB_CHARA.filter(c=>n(S.chara,c[0])>0).map(c=>`${c[1]}（${c[2]}）▶${countLine(n(S.chara,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選（恐怖トノ遭遇）',n(S.counts,'cz'),1),
        detailItem('BIG（超BIG含む）',n(S.counts,'big'),1),
        detailItem('REGULAR',n(S.counts,'reg'),1)
      ]},
      {title:'ボーナス終了画面',items:detailItems(BONUS_END,S.screens),percent:true},
      {title:'RB中のキャラ紹介',items:detailItems(RB_CHARA,S.chara),percent:true}
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
          ['確定演出',`計${strongCount(S)}回`]
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:130,
        step:200,
        width:80,
        items:[
          {label:'CZ',value:n(ctx.S.counts,'cz')},
          {label:'BIG',value:n(ctx.S.counts,'big')},
          {label:'REG',value:n(ctx.S.counts,'reg')},
          {label:'確定',value:strongCount(ctx.S)}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S,scr=screenTotal(S),chr=charaTotal(S),bonus=n(S.counts,'big')+n(S.counts,'reg');
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(bestStrong(S),strongCount(S),strongCount(S)>0,'#ffc94d'),
              row(`通常回転 ${S.games||0}G`,S.games||0),
              row(`BIG ${n(S.counts,'big')}回・REG ${n(S.counts,'reg')}回`,bonus),
              row(`CZ ${n(S.counts,'cz')}回`,n(S.counts,'cz'))
            ]},
            {x:560,items:[
              row(`確定演出 計${strongCount(S)}回`,strongCount(S),strongCount(S)>0,'#ffc94d'),
              row(shown(`終了画面 計${scr}回`,BONUS_END.map(c=>[c[4],n(S.screens,c[0])])),scr),
              row(shown(`シナリオ 計${chr}回`,RB_CHARA.map(c=>[c[4],n(S.chara,c[0])])),chr)
            ]}
          ]
        };
      }
    }
  };
})();

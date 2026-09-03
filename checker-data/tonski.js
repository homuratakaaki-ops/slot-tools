(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const BONUS_END=[
    ['def','デフォルト','設定示唆なし',0,'デ'],
    ['odd','奇数設定示唆','奇数設定期待度UP',0,'奇'],
    ['even','偶数設定示唆','偶数設定期待度UP',0,'偶'],
    ['highWeak','高設定示唆・弱','高設定期待度UP（弱）',0,'弱'],
    ['highStrong','高設定示唆・強','高設定期待度UP（強）',0,'強'],
    ['set2','設定2以上確定演出','設定2以上が確定',2,'2+'],
    ['set4','設定4以上確定演出','設定4以上が確定',4,'4+'],
    ['set6','設定6確定演出','設定6が確定',6,'6']
  ];
  const TROPHIES=[
    ['bronze','銅','設定2以上確定演出',2,'銅'],
    ['silver','銀','設定3以上確定演出',3,'銀'],
    ['gold','金','設定4以上確定演出',4,'金'],
    ['clover','クローバー柄','設定5以上確定演出',5,'ク'],
    ['rainbow','虹','設定6確定演出',6,'虹']
  ];
  const REMAIN=[
    ['r2','残り2体','設定2以上確定演出',2,'2'],
    ['r3','残り3体','設定3以上確定演出',3,'3'],
    ['r4','残り4体','設定4以上確定演出',4,'4'],
    ['r5','残り5体','設定5以上確定演出',5,'5'],
    ['r6','残り6体','設定6確定演出',6,'6']
  ];
  const ED=[
    ['blueSui','青枠 スイ','奇数設定期待度UP',0,'青ス'],
    ['blueFel','青枠 フェル','偶数設定期待度UP',0,'青フ'],
    ['red','赤枠','高設定期待度UP（弱）',0,'赤'],
    ['purple','紫枠','高設定期待度UP（強）',0,'紫'],
    ['goldWin','金枠','設定4以上確定演出',4,'金'],
    ['rainbowWin','虹枠','設定6確定演出',6,'虹']
  ];

  const DEF={
    games:0,
    cz:{cz:0,bonus:0},
    screens:Object.fromEntries(BONUS_END.map(v=>[v[0],0])),
    coins:Object.fromEntries(TROPHIES.map(v=>[v[0],0])),
    atcz:Object.fromEntries(REMAIN.map(v=>[v[0],0])),
    ed:Object.fromEntries(ED.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function rate(g,c){return c&&g?'1/'+(g/c).toFixed(1):'−';}
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
    return [
      ...BONUS_END.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.screens,c[0]),rank:c[3],order:10+c[3]})),
      ...TROPHIES.filter(c=>c[3]>0).map(c=>({label:'アリス'+c[1],value:n(S.coins,c[0]),rank:c[3],order:20+c[3]})),
      ...REMAIN.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.atcz,c[0]),rank:c[3],order:30+c[3]})),
      ...ED.filter(c=>c[3]>0).map(c=>({label:'ED'+c[1],value:n(S.ed,c[0]),rank:c[3],order:40+c[3]}))
    ];
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function certTier(S,rank){return allCert(S).filter(v=>v.rank===rank).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }
  function oddEvenTotal(S){
    return n(S.screens,'odd')+n(S.screens,'even')+n(S.ed,'blueSui')+n(S.ed,'blueFel');
  }
  function highTotal(S){
    return n(S.screens,'highWeak')+n(S.screens,'highStrong')+n(S.ed,'red')+n(S.ed,'purple');
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    const czNow=g&&S.cz.cz?` / 現在 ${rate(g,S.cz.cz)}`:'';
    const bonusNow=g&&S.cz.bonus?` / 現在 ${rate(g,S.cz.bonus)}`:'';
    return `<section class="sec">
    <div class="sec-h">通常ゲーム数</div>
    <div class="inrow"><label>通常ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">e-slot+（実機メニューの「遊技情報の集計」と連動）の遊技履歴「通常ゲーム数」を入力してください。総ゲーム数ではなく通常ゲーム数を使います（AT中を含まないため確率と直接比較できます）。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">分母＝通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('cz.cz','CZ当選',`設1:1/216.7⇔設6:1/189.5${czNow}`,0)}
      ${ctx.crow('cz.bonus','ボーナス初当り',`設1:1/349.3⇔設6:1/247.3${bonusNow}`,1)}
    </div>
    <div class="hint">CZよりボーナス初当りの方が設定差が大きいため、初当りで見るならボーナス初当り確率を重視してください。それぞれ通常ゲーム数を分母に1/xを表示します。</div>
  </section>`;
  }
  function pageEnd(ctx){
    const total=sum(ctx.S.screens);
    return `<section class="sec">
    <div class="sec-h">ボーナス終了画面<span class="sub">計${total}回</span></div>
    <div class="cgrid">${BONUS_END.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">ボーナス終了時に表示される画面を記録します。デフォルト以外が出た回数の内訳が判別材料になります。</div>
  </section>`;
  }
  function pageTrophy(ctx){
    const trophyN=sum(ctx.S.coins),remainN=sum(ctx.S.atcz);
    return `<section class="sec">
    <div class="sec-h">アリストロフィー<span class="sub">ST終了画面・計${trophyN}回</span></div>
    <div class="cgrid">${TROPHIES.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],1)).join('')}</div>
    <div class="hint">ホールカスタムで出現の可否が変わる可能性があります。出ない＝低設定ではありません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">スイCZ失敗時の残り体数<span class="sub">計${remainN}回</span></div>
    <div class="cgrid">${REMAIN.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],1)).join('')}</div>
    <div class="hint">スイチャンス失敗時に表示される残り体数です。残り1体はデフォルトのため記録不要。2体以上は表示数の設定以上が確定します。</div>
  </section>`;
  }
  function pageEd(ctx){
    const edN=sum(ctx.S.ed);
    return `<section class="sec">
    <div class="sec-h">エンディング中のウィンドウ<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">エンディング中に出現するウィンドウの枠色で記録します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">CZポイント・モード示唆<span class="sub">カウント対象外</span></div>
    <div class="hint">ST終了画面のボイス、通常時の会話・アイキャッチ・セリフ、ソテーコンロはCZポイントやモードの示唆のため、本ツールでは記録しません。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games;
    let t=`設定判別メモ｜Lとんでもスキルで異世界放浪メシ\n通常 ${g||0}G / CZ${S.cz.cz}回 / ボーナス${S.cz.bonus}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(S.cz.cz)}（${rate(g,S.cz.cz)}）`,
      `ボーナス初当り▶${countLine(S.cz.bonus)}（${rate(g,S.cz.bonus)}）`
    ]);
    t+=section('ボーナス終了画面',sum(S.screens)>0?BONUS_END.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=section('アリストロフィー',sum(S.coins)>0?TROPHIES.filter(c=>n(S.coins,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.coins,c[0]))}`):[]);
    t+=section('スイCZ失敗時の残り体数',sum(S.atcz)>0?REMAIN.filter(c=>n(S.atcz,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.atcz,c[0]))}`):[]);
    t+=section('エンディング中のウィンドウ',sum(S.ed)>0?ED.filter(c=>n(S.ed,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.ed,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function detail(ctx){
    const S=ctx.S,g=S.games;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',S.cz.cz,0,S.cz.cz>0?`CZ当選 ×${S.cz.cz}（${rate(g,S.cz.cz)}）`:''),
        detailItem('ボーナス初当り',S.cz.bonus,0,S.cz.bonus>0?`ボーナス初当り ×${S.cz.bonus}（${rate(g,S.cz.bonus)}）`:'')
      ]},
      {title:'ボーナス終了画面',items:detailItems(BONUS_END,S.screens)},
      {title:'アリストロフィー',items:detailItems(TROPHIES,S.coins)},
      {title:'スイCZ失敗時の残り体数',items:detailItems(REMAIN,S.atcz)},
      {title:'エンディング中のウィンドウ',items:detailItems(ED,S.ed)}
    ];
  }

  window.CheckerConfigs.tonski={
    nanaCollab:false,
    storageKey:'tonski-checker-v1',
    defaults:DEF,
    mergeKeys:['cz','screens','coins','atcz','ed'],
    sourceUrl:'https://chonborista.com/slot/konami-slot/260742/',
    share:{
      title:'Lとんでもスキルで異世界放浪メシ 設定判別メモ',
      hashtags:'#とんスキ #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageEnd(ctx),
      ()=>pageTrophy(ctx),
      ()=>pageEd(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lとんでもスキルで異世界放浪メシ',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#とんスキ #設定判別',
      downloadName:'tonski_check.png',
      detailDownloadName:'tonski_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=S.games;
        return [
          ['CZ当選',S.cz.cz+'回'],
          ['CZ確率',rate(g,S.cz.cz)],
          ['ボーナス',S.cz.bonus+'回'],
          ['ボーナス確率',rate(g,S.cz.bonus)]
        ];
      },
      chart:ctx=>({
        title:'示唆分布',
        x:150,
        step:160,
        width:80,
        items:[
          {label:'2+',value:certTier(ctx.S,2)},
          {label:'3+',value:certTier(ctx.S,3)},
          {label:'4+',value:certTier(ctx.S,4)},
          {label:'5+',value:certTier(ctx.S,5)},
          {label:'6',value:certTier(ctx.S,6)}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S,g=S.games;
        const cert=certCount(S);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(bestCert(S),cert,cert>0,'#ffc94d'),
              row(shown('終了画面確定',[['2+',n(S.screens,'set2')],['4+',n(S.screens,'set4')],['6',n(S.screens,'set6')]]),n(S.screens,'set2')+n(S.screens,'set4')+n(S.screens,'set6')),
              row(shown('アリストロフィー',[['銅',n(S.coins,'bronze')],['銀',n(S.coins,'silver')],['金',n(S.coins,'gold')],['ク',n(S.coins,'clover')],['虹',n(S.coins,'rainbow')]]),sum(S.coins)),
              row(shown('残り体数',[['2',n(S.atcz,'r2')],['3',n(S.atcz,'r3')],['4',n(S.atcz,'r4')],['5',n(S.atcz,'r5')],['6',n(S.atcz,'r6')]]),sum(S.atcz)),
              row(shown('ED確定',[['金',n(S.ed,'goldWin')],['虹',n(S.ed,'rainbowWin')]]),n(S.ed,'goldWin')+n(S.ed,'rainbowWin'))
            ]},
            {x:560,items:[
              row(`確定演出 計${cert}回`,cert,cert>0,'#ffc94d'),
              row(`CZ当選 ${S.cz.cz}回 ${rate(g,S.cz.cz)}`,S.cz.cz),
              row(`ボーナス ${S.cz.bonus}回 ${rate(g,S.cz.bonus)}`,S.cz.bonus),
              row(shown('奇偶示唆',[['奇',n(S.screens,'odd')],['偶',n(S.screens,'even')],['青ス',n(S.ed,'blueSui')],['青フ',n(S.ed,'blueFel')]]),oddEvenTotal(S)),
              row(shown('高設定示唆',[['弱',n(S.screens,'highWeak')],['強',n(S.screens,'highStrong')],['赤',n(S.ed,'red')],['紫',n(S.ed,'purple')]]),highTotal(S))
            ]}
          ]
        };
      }
    }
  };
})();

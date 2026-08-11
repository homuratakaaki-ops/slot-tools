(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const TABLES=[
    ['a','通常A','最大999まいる・奇数百ゾーン',0,'通A'],
    ['b','通常B','最大699まいる・偶数百ゾーン',0,'通B'],
    ['sa','特殊A','最大399まいる・設定変更時に移行しやすい',0,'特A'],
    ['sb','特殊B','最大999まいる・次回天国濃厚',1,'特B'],
    ['ta','天国A','最大199まいる',0,'天A'],
    ['tb','天国B','最大199まいる・次回天国濃厚',1,'天B']
  ];
  const CHARACTERS=[
    ['yaji','やじ','変更後15.2%（通常時は調査中）',0],
    ['kita','きた','変更後15.2%（通常時は調査中）',0],
    ['akane','茜','変更後25.0%（通常時は調査中）',0],
    ['kurige','くりげ','変更後25.0%（通常時は調査中）',0],
    ['kappa','河童','変更後12.1%（通常時は調査中）',0],
    ['tengu','天狗','変更後7.0%（通常時は調査中）',0],
    ['yajikita','やじきた','変更後0.4%（通常時は調査中）',1]
  ];
  const DEF={
    games:0,
    zones:Object.fromEntries(TABLES.map(t=>[t[0],0])),
    cz:{rg:0,ac:0}, atcz:{gab:0,useki:0}, choku:0, atCount:0,
    screens:{s1:0,s2:0,s3:0,s4:0,s5:0},
    ed:{e1:0},
    icons:Object.fromEntries(CHARACTERS.map(c=>[c[0],0])),
    coins:{cu:0,ag:0,au:0,dg:0,rb:0},
    img:null,
    iconChoice:null,
    tableHist:[]
  };
  const SCREENS=[
    ['s1','街道','奇数設定 期待度UP',0],
    ['s2','茶屋','偶数設定 期待度UP',0],
    ['s3','茜ちゃん','高設定 期待度UP',1],
    ['s4','男湯','示唆内容調査中',0],
    ['s5','その他','その他の終了画面',0]
  ];
  const ED=[
    ['e1','ED中の手形','レア役成立で出現・設定示唆（詳細調査中）',1]
  ];
  const COINS=[
    ['cu','ユニバプレート 銅','設定2以上濃厚',1],
    ['ag','ユニバプレート 銀','設定3以上濃厚',1],
    ['au','ユニバプレート 金','設定4以上濃厚',1],
    ['dg','ユニバプレート 花火柄','設定5以上濃厚',1],
    ['rb','ユニバプレート 虹','設定6濃厚',1]
  ];
  function tableShort(key){
    const t=TABLES.find(v=>v[0]===key);
    return t?t[4]:key;
  }
  function pageZones(ctx){
    const total=TABLES.reduce((a,t)=>a+ctx.S.zones[t[0]],0);
    const hist=[...ctx.S.tableHist].reverse().slice(0,10);
    const histHtml=hist.length?hist.map((h,i)=>`<div class="hint">${i===0?'前回':(i+1)+'回前'}：${h.label}</div>`).join(''):'<div class="hint">まだ入力履歴はありません。</div>';
    return `<section class="sec">
    <div class="sec-h">まいるテーブル<span class="sub">分母＝テーブル記録 計${total}回</span></div>
    <div class="cgrid">
      ${TABLES.map(t=>ctx.crow('zones.'+t[0],t[1],t[2],t[3],n=>ctx.pct(n,total))).join('')}
    </div>
    <div class="hint">ユニメモは直近5回分しか表示されないため、本ツールで累計を記録。特殊Aの出やすさは設定変更（リセット）判別の参考に。</div>
  </section>
  <section class="sec">
    <div class="sec-h">入力履歴<span class="sub">直近10件</span></div>
    ${histHtml}
  </section>`;
  }
  function pageHatsu(ctx){
    const g=ctx.S.games;
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.rg','関所チャレンジ当選','設1:1/231.1⇔設6:1/157.5',0)}
      ${ctx.crow('atCount','やじきた祭当選','設1:1/473.9⇔設6:1/318.3',0)}
      ${ctx.crow('choku','AT直撃','当選時は勝率100%関所チャレンジ',1)}
      ${ctx.crow('atcz.gab','関頂アタック突入','主にレア役で突入・成功期待度約50%',0)}
      ${ctx.crow('atcz.useki','温泉ステージ移行','関所チャレンジ本前兆濃厚',0)}
    </div>
  </section>`;
  }
  function pageShisa(ctx){
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    const iconN=Object.values(ctx.S.icons).reduce((a,b)=>a+b,0);
    return `
  <section class="sec"><div class="sec-h">あっぱれチャンス キャラ<span class="sub">計${iconN}回</span></div>
    <div class="cgrid">${CHARACTERS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,iconN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,scN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">ユニバプレート</div>
    <div class="cgrid">${COINS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div>
    <div class="hint">⚠ ホール側カスタム機能で出現バランスが変化するため過信は禁物（出典参照）。</div></section>
  <section class="sec"><div class="sec-h">ED中の手形<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,edN))).join('')}</div></section>`;
  }
  function tplText(ctx){
    const czN=ctx.S.cz.rg;
    const p=(n,d)=>d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;
    const charN=Object.values(ctx.S.icons).reduce((a,b)=>a+b,0);
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜スマスロ やじきた道中記参る！\n総回転数 ${ctx.S.games||0}G / CZ${czN}回 / AT${ctx.S.atCount}回\n_______\n\n■まいるテーブル\n`;
    TABLES.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.zones[c[0]]}回\n`;});
    const recent=ctx.S.tableHist.slice(-5).reverse().map(h=>tableShort(h.key)).join('←')||'なし';
    t+=`直近履歴：${recent}\n`;
    t+=sec('関頂アタック',ctx.S.atcz.gab>0?[`関頂アタック▶︎ ${ctx.S.atcz.gab}回`]:[]);
    t+=sec('温泉ステージ',ctx.S.atcz.useki>0?[`温泉ステージ▶︎ ${ctx.S.atcz.useki}回`]:[]);
    t+=sec('AT直撃',ctx.S.choku>0?[`AT直撃▶︎ ${ctx.S.choku}回`]:[]);
    t+=sec('あっぱれキャラ',charN>0?CHARACTERS.filter(c=>ctx.S.icons[c[0]]>0).map(c=>`${c[1]}▶︎ ${p(ctx.S.icons[c[0]],charN)}`):[]);
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    t+=sec('AT終了画面',scN>0?SCREENS.filter(c=>ctx.S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${p(ctx.S.screens[c[0]],scN)}`):[]);
    t+=sec('ユニバプレート',[
      ['銅',ctx.S.coins.cu],['銀',ctx.S.coins.ag],['金',ctx.S.coins.au],['花火',ctx.S.coins.dg],['虹',ctx.S.coins.rb]
    ].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${v[1]}回`));
    t+=sec('ED中の手形',ctx.S.ed.e1>0?[`ED中の手形▶︎ ${ctx.S.ed.e1}回`]:[]);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.yajikita={
    nanaCollab:true,
    storageKey:'yajikita-checker-v1',
    defaults:DEF,
    arrayDefaults:[{
      key:'tableHist',
      max:50,
      filter:v=>v&&v.key&&v.label
    }],
    historyRules:[{
      prefix:'zones.',
      stateKey:'tableHist',
      max:50,
      makeEntry:(path,label)=>({key:path.split('.')[1],label}),
      findRemoveIndex:(list,path)=>list.map(v=>v.key).lastIndexOf(path.split('.')[1]),
      findUndoAddedIndex:(list,entry)=>list.map(v=>v.key).lastIndexOf(entry.key)
    }],
    sourceUrl:'https://chonborista.com/slot/universal-slot/259841/',
    share:{
      title:'スマスロ やじきた道中記参る！ 設定判別メモ',
      hashtags:'#やじきた道中記参る #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageZones(ctx),
      ()=>pageHatsu(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    card:{
      title:'スマスロ やじきた道中記参る！',
      titleFitMax:690,
      footerTags:'#やじきた道中記参る #設定判別',
      downloadName:'yajikita_check.png',
      blocks:ctx=>{
        const czN=ctx.S.cz.rg, g0=ctx.S.games;
        const czP=czN&&g0?'1/'+(g0/czN).toFixed(1):'—';
        const atP=ctx.S.atCount&&g0?'1/'+(g0/ctx.S.atCount).toFixed(1):'—';
        return [['CZ確率',czP],['AT確率',atP],['AT直撃',ctx.S.choku+'回'],['関頂アタック',ctx.S.atcz.gab+'回']];
      },
      chart:ctx=>({
        title:'まいるテーブル分布',
        x:110,
        step:145,
        width:72,
        items:TABLES.map(t=>({label:t[4],value:ctx.S.zones[t[0]]}))
      }),
      bottom:ctx=>{
        const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
        return {
          title:`終了画面・プレート（計${scN}回）`,
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:SCREENS.map(v=>({label:v[1],value:ctx.S.screens[v[0]]}))},
            {x:560,items:COINS.map(v=>({label:v[1].replace('ユニバプレート ',''),value:ctx.S.coins[v[0]]}))}
          ]
        };
      }
    }
  };
})();

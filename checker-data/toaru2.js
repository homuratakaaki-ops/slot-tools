(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'—'),show:d>0};}
function detail(ctx){
    const S=ctx.S;
    const zoneN=ZONES.reduce((a,z)=>a+(S.zones[z]||0),0), czN=S.cz.rg+S.cz.ac, atczN=S.atcz.gab+S.atcz.useki, iconN=Object.values(S.icons).reduce((a,b)=>a+b,0), scN=Object.values(S.screens).reduce((a,b)=>a+b,0), edN=Object.values(S.ed).reduce((a,b)=>a+b,0);
    return [
      {title:'規定ゲーム数 当選ゾーン',items:ZONES.map(z=>detailItem(z+'G台',S.zones[z],0)),denominator:zoneN},
      {title:'初当り',items:[detailRatio('CZ 超電磁砲チャンス',S.cz.rg,czN,0),detailRatio('CZ 一方通行チャンス',S.cz.ac,czN,1),detailItem('AT当選',S.atCount,0),detailItem('AT直撃',S.choku,1)]},
      {title:'AT中CZ 振り分け',items:[detailRatio('神の力BATTLE',S.atcz.gab,atczN,0),detailRatio('神の右席BATTLE',S.atcz.useki,atczN,1)]},
      {title:'CZ・AT終了時 アイコン',items:detailItems(ICONS,S.icons),denominator:iconN},
      {title:'藤丸コイン（AT終了画面）',items:detailItems(COINS,S.coins)},
      {title:'AT終了画面',items:detailItems(SCREENS,S.screens),denominator:scN},
      {title:'ED中 お知らせ演出',items:detailItems(ED,S.ed),denominator:edN}
    ];
  }
  window.CheckerConfigs=window.CheckerConfigs||{};

  const ZONES=[50,100,150,200,300,400,500,600,700,800];
  const DEF={
    games:0,
    zones:Object.fromEntries(ZONES.map(z=>[z,0])),
    cz:{rg:0,ac:0}, atcz:{gab:0,useki:0}, choku:0, atCount:0,
    screens:{s1:0,s2:0,s3:0,s4:0,s5:0,s6:0,s7:0,s8:0},
    ed:{e1:0,e2:0,e3:0,e4:0,e5:0,e6:0,e7:0,e8:0,e9:0},
    icons:{blue:0,green:0,red:0,gold:0,none:0},
    coins:{cu:0,ag:0,au:0,dg:0,rb:0},
    img:null,
    iconChoice:null
  };
  const SCREENS=[
    ['s1','当麻＆インデックス','奇数設定 期待度UP',0],
    ['s2','黒子＆美琴','偶数設定 期待度UP',0],
    ['s3','打ち止め＆一方通行','高設定 期待度UP（弱）',0],
    ['s4','番外個体＆一方通行','高設定 期待度UP（中）',0],
    ['s5','アリサ＆シャットアウラ','設定2・4・6 濃厚',1],
    ['s6','初春＆美琴','設定4以上 濃厚',1],
    ['s7','当麻ハーレム','設定6 濃厚',1],
    ['s8','その他（残りG示唆等）','アイテム/スクール/グループ等',0]
  ];
  const ED=[
    ['e1','頑張ったね','奇数設定 期待度UP',0],
    ['e2','調子良いね','偶数設定 期待度UP',0],
    ['e3','ワクワクしてきたかも','高設定 期待度UP（弱）',0],
    ['e4','いけるかも','高設定 期待度UP（中）',0],
    ['e5','やったあ！','設定2以上 濃厚',1],
    ['e6','すごい！すごい！','設定3以上 濃厚',1],
    ['e7','とっても美味しい！','設定4以上 濃厚',1],
    ['e8','すっごくうれしい！','設定5以上 濃厚',1],
    ['e9','おめでとう！','設定6 濃厚',1]
  ];
  const ICONS=[
    ['blue','🔵 青アイコン','AT+10G以上 or Vスト',0],
    ['green','🟢 緑アイコン','AT+30G以上 or Vスト',0],
    ['red','🔴 赤アイコン','AT+50G以上',0],
    ['gold','✨ 金アイコン','AT+100G以上',1],
    ['none','アイコンなし','恩恵なし（分母確定用）',0]
  ];
  const COINS=[
    ['cu','藤丸コイン 銅','設定2以上 濃厚',1],
    ['ag','藤丸コイン 銀','設定3以上 濃厚',1],
    ['au','藤丸コイン 金','設定4以上 濃厚',1],
    ['dg','藤丸コイン デンジャー柄','設定5以上 濃厚',1],
    ['rb','藤丸コイン 虹','設定6 濃厚',1]
  ];
  function pageZones(ctx){
    const total=ZONES.reduce((a,z)=>a+ctx.S.zones[z],0);
    return `<section class="sec">
    <div class="sec-h">規定ゲーム数 当選ゾーン<span class="sub">分母＝ゾーン当選 計${total}回</span></div>
    <div class="cgrid two">
      ${ZONES.map(z=>ctx.crow('zones.'+z, z+'G台','',0,n=>ctx.pct(n,total))).join('')}
    </div>
    <div class="hint">当選したゲーム数帯をタップ。分布からモード（通常A：偶数百G／通常B：奇数百G／天国準備：100G毎）を推測します。％は全ゾーン当選に対する割合です。</div>
  </section>`;
  }
  function pageHatsu(ctx){
    const czN=ctx.S.cz.rg+ctx.S.cz.ac, atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
    const g=ctx.S.games;
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">台のメニュー画面で総ゲーム数を確認して入力します。AT中の消化ゲーム数も含んだ総回転数です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.rg','CZ 超電磁砲チャンス','CZ合算 設1:1/235.6⇔設6:1/207.2',0,n=>ctx.pct(n,czN))}
      ${ctx.crow('cz.ac','CZ 一方通行チャンス','上位CZ（約80%）割合に設定差の可能性',1,n=>ctx.pct(n,czN))}
      ${ctx.crow('atCount','AT当選','設1:1/398.8⇔設6:1/338.4',0)}
      ${ctx.crow('choku','AT直撃','設1 約1/8000 ⇔ 設6 約1/4000',1)}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">AT中CZ 振り分け</div>
    <div class="cgrid">
      ${ctx.crow('atcz.gab','神の力BATTLE','AT中CZ（約50%）',0,n=>ctx.pct(n,atczN))}
      ${ctx.crow('atcz.useki','神の右席BATTLE','上位CZ 割合に設定差の可能性',1,n=>ctx.pct(n,atczN))}
    </div>
    <div class="hint">⚠ 神の右席の割合はAT獲得枚数・上乗遊技回数でも変化するため参考値です。</div>
  </section>`;
  }
  function pageShisa(ctx){
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    const iconN=Object.values(ctx.S.icons).reduce((a,b)=>a+b,0);
    return `
  <section class="sec"><div class="sec-h">CZ・AT終了時 アイコン</div>
    <div class="cgrid">${ICONS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,iconN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,scN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">藤丸コイン（AT終了画面）</div>
    <div class="cgrid">${COINS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">ED中 お知らせ演出<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,edN))).join('')}</div></section>`;
  }
  function tplText(ctx){
    const czN=ctx.S.cz.rg+ctx.S.cz.ac,atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
    const p=(n,d)=>d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;
    let t=`設定判別メモ｜Lとある魔術の禁書目録2\n総回転数 ${ctx.S.games||0}G / CZ${czN}回 / AT${ctx.S.atCount}回\n_______\n\n■規定ゲーム数\n`;
    for(let i=0;i<ZONES.length;i+=2){
      t+=`${ZONES[i]}g▶︎ ${ctx.S.zones[ZONES[i]]}回`;
      if(ZONES[i+1])t+=`　${ZONES[i+1]}g▶︎ ${ctx.S.zones[ZONES[i+1]]}回`;
      t+='\n';
    }
    t+=`\n■AT直撃▶︎ ${ctx.S.choku}回\n\n■通常CZ振り分け\n超電磁砲ﾁｬﾝｽ▶︎ ${p(ctx.S.cz.rg,czN)}\n一方通行ﾁｬﾝｽ▶︎ ${p(ctx.S.cz.ac,czN)}\n\n■AT中CZ振り分け\n神の力ﾊﾞﾄﾙ▶︎ ${p(ctx.S.atcz.gab,atczN)}\n神の右席ﾊﾞﾄﾙ▶︎ ${p(ctx.S.atcz.useki,atczN)}\n\n■終了時アイコン\n🔵▶︎ ${ctx.S.icons.blue}回　🟢▶︎ ${ctx.S.icons.green}回\n🔴▶︎ ${ctx.S.icons.red}回　✨▶︎ ${ctx.S.icons.gold}回\nなし▶︎ ${ctx.S.icons.none}回\n\n■藤丸コイン\n銅▶︎ ${ctx.S.coins.cu}回　銀▶︎ ${ctx.S.coins.ag}回　金▶︎ ${ctx.S.coins.au}回\nﾃﾞﾝｼﾞｬｰ▶︎ ${ctx.S.coins.dg}回　虹▶︎ ${ctx.S.coins.rb}回\n\n■AT終了画面\n`;
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${p(ctx.S.screens[c[0]],scN)}\n`;});
    t+=`\n■エンディング中お知らせ演出\n`;
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    ED.forEach(c=>{t+=`${c[1]}▶︎ ${p(ctx.S.ed[c[0]],edN)}\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  function tplTextCompact(ctx){
    const czN=ctx.S.cz.rg+ctx.S.cz.ac,atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
    const p=(n,d)=>d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜Lとある魔術の禁書目録2\n総回転数 ${ctx.S.games||0}G / CZ${czN}回 / AT${ctx.S.atCount}回\n_______\n`;
    t+=sec('規定ゲーム数',ZONES.filter(z=>ctx.S.zones[z]>0).map(z=>`${z}g▶︎ ${ctx.S.zones[z]}回`));
    t+=sec('AT直撃',ctx.S.choku>0?[`AT直撃▶︎ ${ctx.S.choku}回`]:[]);
    t+=sec('通常CZ振り分け',czN>0?[[`超電磁砲ﾁｬﾝｽ`,ctx.S.cz.rg],[`一方通行ﾁｬﾝｽ`,ctx.S.cz.ac]].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${p(v[1],czN)}`):[]);
    t+=sec('AT中CZ振り分け',atczN>0?[[`神の力ﾊﾞﾄﾙ`,ctx.S.atcz.gab],[`神の右席ﾊﾞﾄﾙ`,ctx.S.atcz.useki]].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${p(v[1],atczN)}`):[]);
    t+=sec('終了時アイコン',[
      ['🔵',ctx.S.icons.blue],['🟢',ctx.S.icons.green],['🔴',ctx.S.icons.red],['✨',ctx.S.icons.gold],['なし',ctx.S.icons.none]
    ].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${v[1]}回`));
    t+=sec('藤丸コイン',[
      ['銅',ctx.S.coins.cu],['銀',ctx.S.coins.ag],['金',ctx.S.coins.au],['ﾃﾞﾝｼﾞｬｰ',ctx.S.coins.dg],['虹',ctx.S.coins.rb]
    ].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${v[1]}回`));
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    t+=sec('AT終了画面',scN>0?SCREENS.filter(c=>ctx.S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${p(ctx.S.screens[c[0]],scN)}`):[]);
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    t+=sec('エンディング中お知らせ演出',edN>0?ED.filter(c=>ctx.S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${p(ctx.S.ed[c[0]],edN)}`):[]);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.toaru2={
    nanaCollab:true,
    storageKey:'toaru2-checker-v1',
    defaults:DEF,
    sourceUrl:'https://chonborista.com/slot/fuji-slot/260325/',
    share:{
      title:'Lとある魔術の禁書目録2 設定判別メモ',
      hashtags:'#とある魔術の禁書目録2 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageZones(ctx),
      ()=>pageHatsu(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplTextCompact,
    card:{
      title:'Lとある魔術の禁書目録2',
      footerTags:'#とある魔術の禁書目録2 #設定判別',
      downloadName:'toaru2_check.png',
      detailDownloadName:'toaru2_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const czN=ctx.S.cz.rg+ctx.S.cz.ac, atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
        const g=ctx.S.games;
        const rate=(n)=>n&&g?'1/'+(g/n).toFixed(1):'—';
        const acR=czN?`${ctx.S.cz.ac}/${czN} ${(100*ctx.S.cz.ac/czN).toFixed(0)}%`:'—';
        const usR=atczN?`${ctx.S.atcz.useki}/${atczN} ${(100*ctx.S.atcz.useki/atczN).toFixed(0)}%`:'—';
        return [['CZ確率',`${rate(czN)} ${czN}回`],['AT確率',`${rate(ctx.S.atCount)} ${ctx.S.atCount}回`],['一方通行',acR],['神の右席',usR]];
      },
      chart:ctx=>({
        title:'当選ゾーン分布',
        x:70,
        step:96,
        width:72,
        items:ZONES.map(z=>({label:String(z),value:ctx.S.zones[z]}))
      }),
      bottom:ctx=>{
        const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
        return {
          title:`AT終了画面（計${scN}回）`,
          startY:762,
          rowGap:48,
          fontSize:25,
          columns:[
            {x:70,items:SCREENS.slice(0,4).map(v=>({label:v[1],value:ctx.S.screens[v[0]]}))},
            {x:560,items:SCREENS.slice(4).map(v=>({label:v[1],value:ctx.S.screens[v[0]]}))}
          ]
        };
      }
    }
  };
})();

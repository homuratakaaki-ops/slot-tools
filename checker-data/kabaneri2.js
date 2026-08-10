(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const CYCLES=[
    ['c1','①周期','チャンス周期（300G以内当選率 約77%）',0,'①'],
    ['c2','②周期','チャンス周期',0,'②'],
    ['c3','③周期','当選率に設定差大（設1:18.4%↔設6:37.1%）',1,'③'],
    ['c4','④周期','当選率に設定差（設1:33.6%↔設6:46.9%）',1,'④'],
    ['c5','⑤周期','',0,'⑤'],
    ['c6','⑥周期','天井・エピソードボーナス',0,'⑥']
  ];
  const ITEMS=[
    ['tsutsu','ツラヌキ筒','設定4で出現しづらい',0],
    ['tanju','無名の短銃','設定3で出現しづらい',0],
    ['jiketsu','自決袋','設定1で出現しづらい',0],
    ['kurusu','来栖の刀','特定設定を否定（設2否定の可能性・実戦予想）',0],
    ['kendama','無名のけん玉','特定設定を否定（設1否定の可能性・実戦予想）',0],
    ['ayame','菖蒲の弓','高設定期待度UP（弱）',1],
    ['butterfly','ミヤマカラスアゲハ','高設定期待度UP（強）',1],
    ['shokichi','小吉','設定2以上濃厚',1],
    ['chukichi','中吉','設定4以上濃厚',1],
    ['daikichi','大吉','設定6濃厚',1]
  ];
  const VOICES=[
    ['female','女性ボイス','偶数設定期待度UP',0],
    ['male','男性ボイス','設定3・5期待度UP',0],
    ['kage1','景之「なぜ言わなかった〜」','高設定期待度UP（弱）',0],
    ['kage2','景之「私は…ヒトか、カバネか!?」','高設定期待度UP（中）',0],
    ['kage3','景之「今年は最後かな」','高設定期待度UP（強）',1],
    ['mumei','無名「やっぱりこの台普通じゃないね」','設定2以上濃厚',1],
    ['none','ボイスなし','設定5以上濃厚（実戦上の反例報告あり・過信禁物）',1]
  ];
  const CHARS=[
    ['female','女性','偶数設定期待度UP',0],
    ['male','男性','設定3・5期待度UP',0],
    ['biba','美馬','設定4以上濃厚',1]
  ];
  const SCREENS=[
    ['geta','鉄下駄','デフォルト',0],
    ['group','集合','高設定期待度UP',0],
    ['swim','水着','設定6濃厚',1]
  ];
  const TROPHIES=[
    ['cu','サミートロフィー 銅','設定2以上濃厚',1],
    ['ag','サミートロフィー 銀','設定3以上濃厚',1],
    ['au','サミートロフィー 金','設定4以上濃厚',1],
    ['dg','サミートロフィー キリン柄','設定5以上濃厚',1],
    ['rb','サミートロフィー 虹','設定6濃厚',1]
  ];
  const ATTACK=[
    ['a44','＋44','設定4以上濃厚',1],
    ['a55','＋55','設定5以上濃厚',1],
    ['a66','＋66','設定6濃厚',1],
    ['a77','＋77','設定6濃厚',1]
  ];
  const OVER=[
    ['o456','456 OVER','設定4以上濃厚',1],
    ['o666','666 OVER','設定6濃厚',1]
  ];
  const BONUS_TH=[254.2,242.3,239.6,214.0,203.2,195.1];
  const ST_TH=[422.5,405.9,398.7,357.2,332.6,318.5];
  const DEF={
    games:0,
    zones:Object.fromEntries(CYCLES.map(c=>[c[0],0])),
    cz:{rg:0},
    atcz:Object.fromEntries(VOICES.map(v=>[v[0],0])),
    choku:0,
    atCount:0,
    screens:Object.fromEntries(SCREENS.map(s=>[s[0],0])),
    ed:Object.fromEntries(CHARS.map(c=>[c[0],0])),
    icons:Object.fromEntries(ITEMS.map(i=>[i[0],0])),
    coins:Object.fromEntries(TROPHIES.map(t=>[t[0],0])),
    attack:Object.fromEntries(ATTACK.map(a=>[a[0],0])),
    over:Object.fromEntries(OVER.map(o=>[o[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj).reduce((a,b)=>a+b,0);}
  function pctLine(n,d){return d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;}
  function pageCycles(ctx){
    const total=CYCLES.reduce((a,c)=>a+ctx.S.zones[c[0]],0);
    return `<section class="sec">
    <div class="sec-h">周期当選<span class="sub">分母＝周期当選 計${total}回</span></div>
    <div class="cgrid">
      ${CYCLES.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,total))).join('')}
    </div>
    <div class="hint">③④周期での当選が多いほど好材料。リセット・ST駆け抜け・上位ST後は天井が596G／最大4周期に短縮。</div>
  </section>`;
  }
  function pageHatsu(ctx){
    const bonusN=ctx.S.cz.rg;
    const g=ctx.S.games, bonusP=bonusN>0&&g>0?g/bonusN:0, stP=ctx.S.atCount>0&&g>0?g/ctx.S.atCount:0;
    const rows=[1,2,3,4,5,6].map(i=>{
      const near=(bonusP>0&&Math.abs(BONUS_TH[i-1]-bonusP)===Math.min(...BONUS_TH.map(t=>Math.abs(t-bonusP))));
      return `<tr class="${near?'near':''}"><td>設定${i}</td><td>1/${BONUS_TH[i-1]}</td><td>1/${ST_TH[i-1]}</td></tr>`;
    }).join('');
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.rg','ボーナス初当り','カバネリボーナス／エピソードボーナス',0)}
      ${ctx.crow('atCount','ST当選','ST突入',0)}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">実践値 vs 理論値</div>
    <table class="ptable">
      <tr class="me"><td>実践値</td><td>${bonusP?'1/'+bonusP.toFixed(1):'—'}</td><td>${stP?'1/'+stP.toFixed(1):'—'}</td></tr>
      <tr><th></th><th>ボーナス確率</th><th>ST確率</th></tr>
      ${rows}
    </table>
    <div class="hint">ピンク行＝ボーナス実践値に最も近い設定。初当り・STとも設定差が大きく判別の主軸です。</div>
  </section>`;
  }
  function pageShisa(ctx){
    const itemN=sum(ctx.S.icons), voiceN=sum(ctx.S.atcz), charN=sum(ctx.S.ed), screenN=sum(ctx.S.screens);
    return `
  <section class="sec"><div class="sec-h">アイテムくじ<span class="sub">計${itemN}回</span></div>
    <div class="cgrid">${ITEMS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,itemN))).join('')}</div>
    <div class="hint">朝イチ1〜5回目と5の倍数回は特殊示唆が出やすい（出現時に赤く光る）。小吉は朝イチn回目＝設定n＆6で出やすい法則あり（出典参照）。</div></section>
  <section class="sec"><div class="sec-h">技術介入ボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${VOICES.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,voiceN))).join('')}</div>
    <div class="hint">マイスロでも自動カウント可。景之の強弱はLED発光では判別不可。</div></section>
  <section class="sec"><div class="sec-h">キャラ紹介<span class="sub">計${charN}回</span></div>
    <div class="cgrid">${CHARS.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,charN))).join('')}</div>
    <div class="hint">設定1は男女50:50。美馬は5001G以降に出現率アップ。</div></section>
  <section class="sec"><div class="sec-h">ST終了画面<span class="sub">計${screenN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,screenN))).join('')}</div>
    <div class="hint">水着は5001〜8000G区間で出現率アップ。</div></section>
  <section class="sec"><div class="sec-h">サミートロフィー</div>
    <div class="cgrid">${TROPHIES.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div>
    <div class="hint">⚠ 店長カスタム搭載機。非カスタム時の出現率は非常に低い（設6で8000G回して約30%）。出現しない＝低設定ではありません。</div></section>
  <section class="sec"><div class="sec-h">カバネリアタック連打枚数</div>
    <div class="cgrid">${ATTACK.map(c=>ctx.crow('attack.'+c[0],c[1],c[2],c[3])).join('')}</div>
    <div class="hint">連打枚数はBETでキャンセルすると確認不可。見逃し注意。</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示</div>
    <div class="cgrid">${OVER.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div></section>`;
  }
  function tplText(ctx){
    const itemN=sum(ctx.S.icons), voiceN=sum(ctx.S.atcz), charN=sum(ctx.S.ed), screenN=sum(ctx.S.screens);
    let t=`設定判別メモ｜スマスロ カバネリ海門決戦\n総回転数 ${ctx.S.games||0}G / ボーナス${ctx.S.cz.rg}回 / ST${ctx.S.atCount}回\n_______\n\n■アイテムくじ\n`;
    ITEMS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.icons[c[0]],itemN)}\n`;});
    t+=`\n■周期当選\n`;
    CYCLES.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.zones[c[0]]}回\n`;});
    t+=`\n■ボイス\n`;
    VOICES.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.atcz[c[0]],voiceN)}\n`;});
    t+=`\n■キャラ紹介\n`;
    CHARS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.ed[c[0]],charN)}\n`;});
    t+=`\n■ST終了画面\n`;
    SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.screens[c[0]],screenN)}\n`;});
    t+=`\n■サミートロフィー\n銅▶︎ ${ctx.S.coins.cu}回　銀▶︎ ${ctx.S.coins.ag}回　金▶︎ ${ctx.S.coins.au}回\nキリン柄▶︎ ${ctx.S.coins.dg}回　虹▶︎ ${ctx.S.coins.rb}回\n\n■連打枚数・獲得枚数\n`;
    ATTACK.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.attack[c[0]]}回\n`;});
    OVER.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.over[c[0]]}回\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.kabaneri2={
    nanaCollab:true,
    storageKey:'kabaneri2-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins','attack','over'],
    sourceUrl:'https://chonborista.com/slot/sammy-slot/248689/',
    share:{
      title:'スマスロ カバネリ海門決戦 設定判別メモ',
      hashtags:'#カバネリ海門決戦 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageCycles(ctx),
      ()=>pageHatsu(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    card:{
      title:'スマスロ カバネリ海門決戦',
      titleFitMax:690,
      footerTags:'#カバネリ海門決戦 #設定判別',
      downloadName:'kabaneri2_check.png',
      blocks:ctx=>{
        const g0=ctx.S.games;
        const bonusP=ctx.S.cz.rg&&g0?'1/'+(g0/ctx.S.cz.rg).toFixed(1):'—';
        const stP=ctx.S.atCount&&g0?'1/'+(g0/ctx.S.atCount).toFixed(1):'—';
        const c34=ctx.S.zones.c3+ctx.S.zones.c4;
        const trophy=sum(ctx.S.coins);
        return [['ボーナス確率',bonusP],['ST確率',stP],['3・4周期当選',c34+'回'],['トロフィー',trophy+'回']];
      },
      chart:ctx=>({
        title:'周期当選分布',
        x:110,
        step:145,
        width:72,
        items:CYCLES.map(c=>({label:c[4],value:ctx.S.zones[c[0]]}))
      }),
      bottom:ctx=>{
        const strong=sum(ctx.S.coins)+ctx.S.screens.swim+ctx.S.ed.biba+sum(ctx.S.attack)+sum(ctx.S.over);
        return {
          title:`濃厚示唆（計${strong}回）`,
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:[
              {label:'銅トロ',value:ctx.S.coins.cu},
              {label:'銀トロ',value:ctx.S.coins.ag},
              {label:'金トロ',value:ctx.S.coins.au},
              {label:'キリン柄',value:ctx.S.coins.dg},
              {label:'虹トロ',value:ctx.S.coins.rb}
            ]},
            {x:560,items:[
              {label:'水着画面',value:ctx.S.screens.swim},
              {label:'美馬紹介',value:ctx.S.ed.biba},
              {label:'連打44-77',value:sum(ctx.S.attack)},
              {label:'456 OVER',value:ctx.S.over.o456},
              {label:'666 OVER',value:ctx.S.over.o666}
            ]}
          ]
        };
      }
    }
  };
})();

(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const BONUS_SCREENS=[
    ['def','デフォルト','低設定ほど出現率高（設1:BIG後86%⇔設6:70%）',0,'デ'],
    ['s2','設定示唆②','全設定出現・高設定ほど率UP',0,'②'],
    ['s3','設定示唆③','全設定出現・高設定ほど率UP',0,'③'],
    ['s4','設定示唆④','設定4以上濃厚',1,'④'],
    ['s5','設定示唆⑤','設定5以上濃厚',1,'⑤'],
    ['s6','設定示唆⑥','設定6濃厚',1,'⑥'],
    ['mode','モード示唆（黒シル/帽子/119）','モード示唆・設定示唆なし',0,'モ'],
    ['stock1','ストック示唆①','序列①＜②＜③',0,'S1'],
    ['stock2','ストック示唆②','序列①＜②＜③',0,'S2'],
    ['stock3','ストック示唆③','序列①＜②＜③',0,'S3']
  ];
  const SCENARIOS=[
    ['d8_1','第8①','第8特殊シナリオ',0],
    ['d8_2','第8②','第8特殊シナリオ',0],
    ['d8_3','第8③','設定4以上',1],
    ['d8_4','第8④','設定6のみ',1],
    ['conduct_1','伝導者①','伝導者系シナリオ',0],
    ['conduct_2','伝導者②','伝導者系シナリオ',0],
    ['conduct_3','伝導者③','伝導者系シナリオ',0],
    ['conduct_4','伝導者④','設定5以上',1],
    ['iris_1','アイリス①','アイリス系シナリオ',0],
    ['iris_2','アイリス②','アイリス系シナリオ',0],
    ['iris_3','アイリス③','アイリス系シナリオ',0],
    ['iris_4','アイリス④','アイリス系シナリオ',0],
    ['iris_5','アイリス⑤','アイリス系シナリオ',0],
    ['iris_6','アイリス⑥','設定6のみ',1],
    ['captain','大隊長','設定4以上',1]
  ];
  const SPECIALS=[
    ['gold','金背景','設定4以上濃厚',1],
    ['kurono','黒野','設定4以上',1],
    ['joker','ジョーカー','設定5以上',1],
    ['death','シンラ（死ノ圧）','設定6濃厚',1]
  ];
  const MAMORU=[
    ['m1','まもる1人目','設定1否定',0],
    ['m2','まもる2人目','設定2否定',0],
    ['m3','まもる3人目','設定3否定',0],
    ['m4','まもる4人目','設定4否定',0],
    ['m5','まもる5人目','設定5否定',0]
  ];
  const OVER=[
    ['o119','119枚OVER','設定2以上濃厚',1],
    ['o246','246枚OVER','偶数設定濃厚',1],
    ['o456','456枚OVER','設定4以上濃厚',1],
    ['o666','666枚OVER','設定6濃厚',1]
  ];
  const ED_CHARS=[
    ['shinra','シンラ','デフォルト',0],
    ['arthur','アーサー','デフォルト',0],
    ['tamaki','タマキ','高設定期待度UP',0],
    ['deny1','119','設定1否定',0],
    ['iris','アイリス','設定4以上濃厚',1],
    ['benij','紅丸＆ジョーカー','設定5以上濃厚',1],
    ['sho','ショウ','設定6濃厚',1]
  ];
  const BONUS_TH=[272,269,257,242,236,227];
  const LOOP_TH=[684,662,617,546,518,486];
  const DEF={
    games:0,
    zones:Object.fromEntries(BONUS_SCREENS.map(v=>[v[0],0])),
    cz:{bonus:0,trap:0,trapHit:0,smallv:0,convert:0,convertBonus:0,giovanni:0,orochi:0},
    atcz:Object.fromEntries(ED_CHARS.map(v=>[v[0],0])),
    choku:0,
    atCount:0,
    screens:Object.fromEntries(SCENARIOS.map(v=>[v[0],0])),
    ed:Object.fromEntries(SPECIALS.map(v=>[v[0],0])),
    icons:Object.fromEntries(MAMORU.map(v=>[v[0],0])),
    coins:Object.fromEntries(OVER.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function pctLine(n,d){return d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;}
  function ratio(n,d){return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:'—';}

  function pageHatsu(ctx){
    const bonusN=ctx.S.cz.bonus, loopN=ctx.S.atCount;
    const g=ctx.S.games, bonusP=bonusN>0&&g>0?g/bonusN:0, loopP=loopN>0&&g>0?g/loopN:0;
    const rows=[1,2,3,4,5,6].map(i=>{
      const near=(loopP>0&&Math.abs(LOOP_TH[i-1]-loopP)===Math.min(...LOOP_TH.map(t=>Math.abs(t-loopP))));
      return `<tr class="${near?'near':''}"><td>設定${i}</td><td>1/${BONUS_TH[i-1]}</td><td>1/${LOOP_TH[i-1]}</td></tr>`;
    }).join('');
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.bonus','ボーナス初当り','通常時のボーナス初当り',0)}
      ${ctx.crow('atCount','炎炎ループ','設1:1/684⇔設6:1/486',1)}
      ${ctx.crow('choku','SPエピソードボーナス','突入で炎炎激闘濃厚',0)}
    </div>
    <div class="hint">初当りと炎炎ループの両輪で判別。天井はボーナス間850G/炎炎ループ間2000G（リセット時650G/1500G）。</div>
  </section>
  <section class="sec">
    <div class="sec-h">実践値 vs 理論値</div>
    <table class="ptable">
      <tr class="me"><td>実践値</td><td>${bonusP?'1/'+bonusP.toFixed(1):'—'}</td><td>${loopP?'1/'+loopP.toFixed(1):'—'}</td></tr>
      <tr><th></th><th>ボナ</th><th>ループ</th></tr>
      ${rows}
    </table>
    <div class="hint">ピンク行＝炎炎ループ実践値に最も近い設定。分母が小さいうちは参考程度に。</div>
  </section>`;
  }
  function pageTrap(ctx){
    return `<section class="sec">
    <div class="sec-h">伝導者の罠</div>
    <div class="cgrid">
      ${ctx.crow('cz.trap','伝導者の罠 突入','分母用',0)}
      ${ctx.crow('cz.trapHit','罠から炎炎激闘 当選','期待度約40%・5連続スルーで次回SPエピボ',0,n=>ctx.pct(n,ctx.S.cz.trap))}
      ${ctx.crow('cz.smallv','罠中 小V成立','分母用。伝導者の罠中のみ記録',0)}
      ${ctx.crow('cz.convert','罠中 十字目変換 発生','発生率 設1:42%⇔高設定:50%',1,n=>ctx.pct(n,ctx.S.cz.smallv))}
      ${ctx.crow('cz.convertBonus','変換からボーナス当選','期待度 設1:30%⇔高設定:40%',1,n=>ctx.pct(n,ctx.S.cz.convert))}
      ${ctx.crow('cz.giovanni','バトル ジョヴァンニ','伝導者バトル',0)}
      ${ctx.crow('cz.orochi','バトル オロチ','オロチ発展は期待度85%',0)}
    </div>
    <div class="hint">⚠小V・変換のカウントは伝導者の罠中のみ行う（通常時は混ぜない。解析の分母定義に合わせるため）。</div>
  </section>`;
  }
  function pageShisa(ctx){
    const zoneN=sum(ctx.S.zones), scenarioN=sum(ctx.S.screens), mamoruN=sum(ctx.S.icons), edN=sum(ctx.S.atcz);
    return `
  <section class="sec"><div class="sec-h">ボーナス終了画面<span class="sub">計${zoneN}回</span></div>
    <div class="cgrid">${BONUS_SCREENS.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,zoneN))).join('')}</div>
    <div class="hint">⚠ 店長カスタム搭載機（カスタム報知機能あり）。設定狙い時はホールのカスタム設定を必ず確認。REG系後の方がBIG後より設定差大（デフォ率 設1:77%⇔設6:55%）。</div></section>
  <section class="sec"><div class="sec-h">RB中のキャラ紹介シナリオ<span class="sub">計${scenarioN}回</span></div>
    <div class="cgrid">${SCENARIOS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,scenarioN))).join('')}</div>
    <div class="hint">REG中のキャラ紹介順でシナリオ判別。1〜2キャラ目の組み合わせで特定（例：シンラ→リヒト系は伝導者系）。詳細は出典参照。</div></section>
  <section class="sec"><div class="sec-h">キャラ紹介の特殊パターン</div>
    <div class="cgrid">${SPECIALS.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">まもるくん出現位置<span class="sub">計${mamoruN}回</span></div>
    <div class="cgrid">${MAMORU.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,mamoruN))).join('')}</div>
    <div class="hint">出現した順番の設定を否定する重要示唆。位置を必ず記録。</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示</div>
    <div class="cgrid">${OVER.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">エンディング中のミニキャラ<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED_CHARS.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,edN))).join('')}</div>
    <div class="hint">EDレア役成立時に液晶左下。十字リプレイ契機は高設定確定系のチャンス。</div></section>`;
  }
  function tplText(ctx){
    let t=`設定判別メモ｜L炎炎ノ消防隊2\n総回転数 ${ctx.S.games||0}G / ボーナス${ctx.S.cz.bonus}回 / 炎炎ループ${ctx.S.atCount}回\n_______\n\n■キャラ紹介シナリオ（系統別）\n`;
    const scenarioN=sum(ctx.S.screens);
    SCENARIOS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.screens[c[0]],scenarioN)}\n`;});
    t+=`\n■特殊パターン\n`;
    SPECIALS.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.ed[c[0]]}回\n`;});
    t+=`\n■まもるくん\n`;
    MAMORU.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.icons[c[0]]}回\n`;});
    t+=`\n■罠・変換\n伝導者の罠成功▶︎ ${ratio(ctx.S.cz.trapHit,ctx.S.cz.trap)}\n十字目変換▶︎ ${ratio(ctx.S.cz.convert,ctx.S.cz.smallv)}\n変換からボーナス▶︎ ${ratio(ctx.S.cz.convertBonus,ctx.S.cz.convert)}\n`;
    t+=`\n■バトル\nジョヴァンニ▶︎ ${ctx.S.cz.giovanni}回\nオロチ▶︎ ${ctx.S.cz.orochi}回\n`;
    t+=`\n■ボーナス終了画面\n`;
    const zoneN=sum(ctx.S.zones);
    BONUS_SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.zones[c[0]],zoneN)}\n`;});
    t+=`\n■獲得枚数\n`;
    OVER.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.coins[c[0]]}回\n`;});
    t+=`\n■EDミニキャラ\n`;
    const edN=sum(ctx.S.atcz);
    ED_CHARS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.atcz[c[0]],edN)}\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.enen2={
    nanaCollab:true,
    storageKey:'enen2-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins'],
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/247643/',
    share:{
      title:'L炎炎ノ消防隊2 設定判別メモ',
      hashtags:'#炎炎ノ消防隊2 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageTrap(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    card:{
      title:'L炎炎ノ消防隊2',
      footerTags:'#炎炎ノ消防隊2 #設定判別',
      downloadName:'enen2_check.png',
      blocks:ctx=>{
        const g0=ctx.S.games;
        const bonusP=ctx.S.cz.bonus&&g0?'1/'+(g0/ctx.S.cz.bonus).toFixed(1):'—';
        const loopP=ctx.S.atCount&&g0?'1/'+(g0/ctx.S.atCount).toFixed(1):'—';
        return [['ボーナス確率',bonusP],['炎炎ループ',loopP],['罠成功',ratio(ctx.S.cz.trapHit,ctx.S.cz.trap)],['変換発生',ratio(ctx.S.cz.convert,ctx.S.cz.smallv)]];
      },
      chart:ctx=>({
        title:'ボーナス終了画面分布',
        x:110,
        step:145,
        width:72,
        items:BONUS_SCREENS.slice(0,6).map(v=>({label:v[4],value:ctx.S.zones[v[0]]}))
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'シンラ死ノ圧(6濃厚)',value:S.ed.death},
          {tier:6,order:2,label:'示唆⑥(6濃厚)',value:S.zones.s6},
          {tier:6,order:3,label:'666 OVER(6濃厚)',value:S.coins.o666},
          {tier:6,order:4,label:'ショウ(6濃厚)',value:S.atcz.sho},
          {tier:6,order:5,label:'第8④(6濃厚)',value:S.screens.d8_4},
          {tier:6,order:6,label:'アイリス⑥(6濃厚)',value:S.screens.iris_6},
          {tier:5,order:1,label:'ジョーカー(5以上)',value:S.ed.joker},
          {tier:5,order:2,label:'示唆⑤(5以上)',value:S.zones.s5},
          {tier:5,order:3,label:'紅丸＆ジョーカー(5以上)',value:S.atcz.benij},
          {tier:5,order:4,label:'伝導者④(5以上)',value:S.screens.conduct_4},
          {tier:4,order:1,label:'金背景(4以上)',value:S.ed.gold},
          {tier:4,order:2,label:'示唆④(4以上)',value:S.zones.s4},
          {tier:4,order:3,label:'456 OVER(4以上)',value:S.coins.o456},
          {tier:4,order:4,label:'アイリスED(4以上)',value:S.atcz.iris},
          {tier:4,order:5,label:'黒野(4以上)',value:S.ed.kurono},
          {tier:4,order:6,label:'大隊長(4以上)',value:S.screens.captain},
          {tier:4,order:7,label:'第8③(4以上)',value:S.screens.d8_3},
          {tier:2.46,order:1,label:'246 OVER(偶数)',value:S.coins.o246},
          {tier:2,order:1,label:'119枚OVER(2以上)',value:S.coins.o119}
        ];
        const strong=strongItems.reduce((a,b)=>a+b.value,0);
        const best=strongItems.filter(v=>v.value>0).sort((a,b)=>b.tier-a.tier||a.order-b.order)[0];
        const mamoru=sum(S.icons);
        const scenarioD8=S.screens.d8_1+S.screens.d8_2+S.screens.d8_3+S.screens.d8_4;
        const scenarioConduct=S.screens.conduct_1+S.screens.conduct_2+S.screens.conduct_3+S.screens.conduct_4;
        const scenarioIris=S.screens.iris_1+S.screens.iris_2+S.screens.iris_3+S.screens.iris_4+S.screens.iris_5+S.screens.iris_6;
        const scenarioTotal=scenarioD8+scenarioConduct+scenarioIris+S.screens.captain;
        const specialTotal=sum(S.ed);
        const edPick=S.atcz.tamaki+S.atcz.iris+S.atcz.benij+S.atcz.sho;
        const overTotal=sum(S.coins);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              {text:best?`最強 ${best.label} ×${best.value}`:'濃厚示唆 なし',value:best?best.value:0,active:!!best},
              {text:`終了 ②${S.zones.s2}③${S.zones.s3}④${S.zones.s4}⑤${S.zones.s5}⑥${S.zones.s6}`,value:S.zones.s2+S.zones.s3+S.zones.s4+S.zones.s5+S.zones.s6},
              {text:`シナリオ 第8${scenarioD8}・伝${scenarioConduct}・ア${scenarioIris}・隊${S.screens.captain}`,value:scenarioTotal},
              {text:`ED タマ${S.atcz.tamaki}・アイ${S.atcz.iris}・紅J${S.atcz.benij}・ショ${S.atcz.sho}`,value:edPick},
              {text:`罠成功 ${ratio(S.cz.trapHit,S.cz.trap)}`,value:S.cz.trapHit,active:S.cz.trap>0&&S.cz.trapHit>0}
            ]},
            {x:560,items:[
              {text:`濃厚示唆 計${strong}回`,value:strong},
              {text:`まもる否定 ①${S.icons.m1}②${S.icons.m2}③${S.icons.m3}④${S.icons.m4}⑤${S.icons.m5}`,value:mamoru},
              {text:`特殊 金${S.ed.gold}・黒${S.ed.kurono}・ジ${S.ed.joker}・死${S.ed.death}`,value:specialTotal},
              {text:`枚数 119${S.coins.o119}・246${S.coins.o246}・456${S.coins.o456}・666${S.coins.o666}`,value:overTotal},
              {text:`変換 ${ratio(S.cz.convert,S.cz.smallv)}`,value:S.cz.convert,active:S.cz.smallv>0&&S.cz.convert>0}
            ]}
          ]
        };
      }
    }
  };
})();

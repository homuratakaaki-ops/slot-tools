(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'-'),show:d>0};}
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[detailItem('CZ当選',S.cz.cz,0),detailItem('AT当選',S.atCount,1),detailItem('AT直撃',S.choku,0)]},
      {title:'周期当選',items:detailItems(CYCLES,S.zones)},
      {title:'規定pt帯',items:detailItems(POINTS,S.pts)},
      {title:'ポイント特化ゾーン',items:[detailItem('百花繚乱チャンス 突入',S.cz.hyakka,0),detailItem('人馬一体チャンス 突入',S.cz.jinba,1)]},
      {title:'CZ対戦相手',items:detailItems(OPPONENTS,S.icons)},
      {title:'抜刀チャンス',items:[detailItem('抜刀メーターMAX到達',S.cz.battoMax,0),detailRatio('抜刀チャンス当選',S.cz.battoHit,S.cz.battoMax,1)]},
      {title:'御白洲ビジョン',items:detailItems(VISIONS,S.vision)},
      {title:'メニュー画面',items:detailItems(MENUS,S.menu)},
      {title:'AT終了画面',items:detailItems(SCREENS,S.screens)},
      {title:'コパンダトロフィー',items:detailItems(TROPHIES,S.coins)},
      {title:'獲得枚数表示',items:detailItems(MEDALS,S.over)},
      {title:'真BB中のボイス',items:detailItems(VOICES,S.ed)}
    ];
  }
  window.CheckerConfigs=window.CheckerConfigs||{};

  const CYCLES=[
    ['c1','①周期','天国モードは1周期天井',1,'①'],
    ['c2','②周期','',0,'②'],
    ['c3','③周期','',0,'③'],
    ['c4','④周期','通常B・Cは4周期天井',0,'④'],
    ['c5','⑤周期','',0,'⑤'],
    ['c6','⑥周期','通常Aの天井',0,'⑥']
  ];
  const POINTS=[
    ['p100','100pt台','夜回りC・D期待',0,'100'],
    ['p200','200pt台','夜回りD天井',0,'200'],
    ['p300','300pt台','夜回りC天井',0,'300'],
    ['p400','400pt台','夜回りA/Bの中間帯',0,'400'],
    ['p500','500pt台','夜回りA/Bの深め',0,'500'],
    ['p600','600pt台','夜回りA・Bの天井',0,'600']
  ];
  const OPPONENTS=[
    ['nezumi','鼠小僧','対応役スイカ・期待度60%',0],
    ['wanyudo','和入道','対応役チェリー・期待度60%',0],
    ['anego','姉御','チェリー大チャンス',0],
    ['bukiya','武器商人','スイカ大チャンス',0],
    ['yagyu','VS柳生','選択率に設定差 設1:3.7%⇔設6:8.7%',1]
  ];
  const VISIONS=[
    ['yoshi','吉宗','デフォルト',0],
    ['echizen','大岡越前','偶数設定期待度UP',0],
    ['tenei','天英院','高設定期待度UP',0]
  ];
  const MENUS=[
    ['yoshi','吉宗','デフォルト',0],
    ['echizen','大岡越前','偶数設定期待度UP',0],
    ['tenei','天英院','高設定期待度UP',0]
  ];
  const SCREENS=[
    ['none','月無し','デフォルト',0],
    ['crescent','三日月','高設定期待度UP（弱）',0],
    ['fullmoon','満月','高設定期待度UP（強）',0],
    ['echizen','大岡越前','設定2以上濃厚',1],
    ['yagyu','柳生','設定4以上濃厚',1],
    ['ooku','大奥','設定5以上濃厚',1],
    ['yoshi','吉宗','設定6濃厚',1]
  ];
  const TROPHIES=[
    ['bronze','コパンダ銅','設定2以上濃厚',1],
    ['silver','コパンダ銀','設定3以上濃厚',1],
    ['gold','コパンダ金','設定4以上濃厚',1],
    ['thunder','コパンダイナズマ','設定5以上濃厚',1],
    ['rainbow','コパンダ虹','設定6濃厚',1]
  ];
  const MEDALS=[
    ['m456','456枚','設定4以上濃厚',1],
    ['m555','555枚','設定5以上濃厚',1],
    ['m666','666枚','設定6濃厚',1]
  ];
  const VOICES=[
    ['aoi1','葵「流石でございます」','奇数設定期待度UP（弱）',0],
    ['sakura1','桜「どごさ目いってんだが〜」','奇数設定期待度UP（強）',0],
    ['midori1','翠「やるじゃない」','偶数設定期待度UP（弱）',0],
    ['beni1','紅「早く捕まえてぇ〜」','偶数設定期待度UP（強）',0],
    ['tenei1','天英院「やるではないか」','高設定期待度UP（弱）',0],
    ['tenei2','天英院「今宵は特別な日に〜」','高設定期待度UP（強）',0],
    ['yoshi2','吉宗「胸が高鳴るのう」','設定2以上濃厚',1],
    ['echizen4','越前「この越前！この上ない喜び〜」','設定4以上濃厚',1],
    ['yoshi5','吉宗「これで江戸も安泰じゃ！」','設定5以上濃厚',1],
    ['edo6','吉宗・越前・天英院「江戸を守る」','設定6濃厚',1]
  ];
  const DEF={
    games:0,
    zones:Object.fromEntries(CYCLES.map(c=>[c[0],0])),
    pts:Object.fromEntries(POINTS.map(c=>[c[0],0])),
    cz:{cz:0,hyakka:0,jinba:0,battoMax:0,battoHit:0},
    atcz:{},
    choku:0,
    atCount:0,
    screens:Object.fromEntries(SCREENS.map(c=>[c[0],0])),
    ed:Object.fromEntries(VOICES.map(c=>[c[0],0])),
    icons:Object.fromEntries(OPPONENTS.map(c=>[c[0],0])),
    coins:Object.fromEntries(TROPHIES.map(c=>[c[0],0])),
    menu:Object.fromEntries(MENUS.map(c=>[c[0],0])),
    vision:Object.fromEntries(VISIONS.map(c=>[c[0],0])),
    over:Object.fromEntries(MEDALS.map(c=>[c[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function rate(g,n){return n&&g?'1/'+(g/n).toFixed(1):'-';}
  function ratio(n,d){return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:'-';}
  function pctText(n,d){return d>0?`${n}回 (${(100*n/d).toFixed(0)}%)`:`${n}回 (-)`;}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'−'}`;
  }
  function pageHatsu(ctx){
    const g=ctx.S.games;
    return `
  <section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">ダイトモの『通常プレイ数』を入力（CZ込みの方ではなく、CZを含まない値）</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.cz','CZ当選（悪人成敗チャンス）','設1:1/313.0⇔設6:1/250.6',0)}
      ${ctx.crow('atCount','AT当選（勧善懲悪RUSH）','設1:1/488.9⇔設6:1/354.9・1/400を切れば設4以上の目安',1)}
      ${ctx.crow('choku','AT直撃','周期到達からの直撃は通常C濃厚（モード示唆を兼ねる）',0)}
    </div>
    <div class="hint">CZ・ATとも高設定ほど優遇。天井はCZ間1000G+α or 6周期／AT間1500G+α（リセット時1000G+α・真BB後700G）。</div>
  </section>`;
  }
  function pageCycle(ctx){
    const cycleN=sum(ctx.S.zones), ptN=sum(ctx.S.pts), oppN=sum(ctx.S.icons);
    return `<section class="sec">
    <div class="sec-h">周期当選<span class="sub">計${cycleN}回</span></div>
    <div class="cgrid two">${CYCLES.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,cycleN))).join('')}</div>
    <div class="hint">当選周期の分布からCZモードを推測（天国=1／B・C=4天井／A=6天井）。周期到達からのAT直撃は通常C濃厚。6周期後は次回最大4周期に短縮（CZ失敗時のみ有効・AT当選時は無効）。</div>
  </section>
  <section class="sec">
    <div class="sec-h">規定pt帯<span class="sub">計${ptN}回</span></div>
    <div class="cgrid two">${POINTS.map(c=>ctx.crow('pts.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,ptN))).join('')}</div>
    <div class="hint">夜回りモード推測用（A=百の位偶数がチャンス／B=奇数／C=300pt以下／D=200pt以下）。規定ptは高設定ほど優遇の可能性。600pt台はA・Bの天井。</div>
  </section>
  <section class="sec">
    <div class="sec-h">ポイント特化ゾーン</div>
    <div class="cgrid">
      ${ctx.crow('cz.hyakka','百花繚乱チャンス 突入','平均約90pt・滞在中BAR揃い高確',0)}
      ${ctx.crow('cz.jinba','人馬一体チャンス 突入','上位特化・平均約230pt',1)}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">CZ対戦相手<span class="sub">計${oppN}回</span></div>
    <div class="cgrid">${OPPONENTS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,oppN))).join('')}</div>
    <div class="hint">柳生の選択率は設1と設6で2倍以上の差。CZ回数が増えるほど柳生率が判別材料になります。</div>
  </section>
  <section class="sec">
    <div class="sec-h">抜刀チャンス</div>
    <div class="cgrid">
      ${ctx.crow('cz.battoMax','抜刀メーターMAX到達','抜刀チャンス当選率の分母',0)}
      ${ctx.crow('cz.battoHit','抜刀チャンス当選','設1:20.3%⇔設6:25.8%',1,n=>ratio(n,ctx.S.cz.battoMax))}
    </div>
    <div class="hint">⚠ AT後1回目と5周期目はサンプル外（当選が濃厚になるため到達・当選ともカウントしない）。共通ベル成立時は50%でMAXになる仕様。</div>
  </section>`;
  }
  function pageShisa(ctx){
    const visionN=sum(ctx.S.vision), menuN=sum(ctx.S.menu), screenN=sum(ctx.S.screens), voiceN=sum(ctx.S.ed);
    return `<section class="sec"><div class="sec-h">御白洲ビジョン<span class="sub">計${visionN}回</span></div>
    <div class="cgrid">${VISIONS.map(c=>ctx.crow('vision.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,visionN))).join('')}</div>
    <div class="hint">AT・CZ・特化ゾーン終了時などPUSHボタンが光ったタイミングで出現。おみくじ（末吉〜大吉）はモード示唆でここではカウント対象外。</div></section>
  <section class="sec"><div class="sec-h">メニュー画面のキャラ<span class="sub">計${menuN}回</span></div>
    <div class="cgrid">${MENUS.map(c=>ctx.crow('menu.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,menuN))).join('')}</div>
    <div class="hint">示唆内容は現時点で予想段階の情報を含みます。周期ごとに変化する場合があるのでこまめに確認。</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${screenN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,screenN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">コパンダトロフィー</div>
    <div class="cgrid">${TROPHIES.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示</div>
    <div class="cgrid">${MEDALS.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">真BB中のボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${VOICES.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,voiceN))).join('')}</div>
    <div class="hint">真BB前半・宝船パート中のレア役成立時にPUSHで発生。</div></section>`;
  }
  function tplText(ctx){
    const S=ctx.S, cycleN=sum(S.zones), ptN=sum(S.pts), oppN=sum(S.icons), visionN=sum(S.vision), voiceN=sum(S.ed), screenN=sum(S.screens), menuN=sum(S.menu);
    let t=`設定判別メモ｜L真打吉宗\n通常 ${S.games||0}G / CZ${S.cz.cz}回 / AT${S.atCount}回\n_______\n\n■ポイント特化ゾーン\n`;
    t+=`百花繚乱チャンス▶︎ ${S.cz.hyakka}回\n人馬一体チャンス▶︎ ${S.cz.jinba}回\n\n■御白洲ビジョン\n`;
    VISIONS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.vision[c[0]],visionN)}\n`;});
    t+='\n■CZ対戦相手\n';
    OPPONENTS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.icons[c[0]],oppN)}\n`;});
    t+='\n■規定pt帯\n';
    POINTS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.pts[c[0]],ptN)}\n`;});
    t+='\n■周期当選\n';
    CYCLES.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.zones[c[0]],cycleN)}\n`;});
    t+='\n■真BBボイス\n';
    VOICES.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.ed[c[0]],voiceN)}\n`;});
    t+='\n■AT終了画面\n';
    SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.screens[c[0]],screenN)}\n`;});
    t+='\n■メニュー画面\n';
    MENUS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.menu[c[0]],menuN)}\n`;});
    t+=`\n■抜刀チャンス\n抜刀チャンス▶︎ ${ratio(S.cz.battoHit,S.cz.battoMax)}\n\n■コパンダトロフィー\n`;
    TROPHIES.forEach(c=>{t+=`${c[1]}▶︎ ${S.coins[c[0]]}回\n`;});
    t+='\n■獲得枚数\n';
    MEDALS.forEach(c=>{t+=`${c[1]}▶︎ ${S.over[c[0]]}回\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function tplTextCompact(ctx){
    const S=ctx.S, cycleN=sum(S.zones), ptN=sum(S.pts), oppN=sum(S.icons), visionN=sum(S.vision), voiceN=sum(S.ed), screenN=sum(S.screens), menuN=sum(S.menu);
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜L真打吉宗\n通常 ${S.games||0}G / CZ${S.cz.cz}回 / AT${S.atCount}回\n_______\n`;
    t+=sec('ポイント特化ゾーン',[['百花繚乱チャンス',S.cz.hyakka],['人馬一体チャンス',S.cz.jinba]].filter(x=>x[1]>0).map(x=>`${x[0]}▶︎ ${x[1]}回`));
    t+=sec('御白洲ビジョン',visionN>0?VISIONS.filter(c=>S.vision[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.vision[c[0]],visionN)}`):[]);
    t+=sec('CZ対戦相手',oppN>0?OPPONENTS.filter(c=>S.icons[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.icons[c[0]],oppN)}`):[]);
    t+=sec('規定pt帯',POINTS.map(c=>`${c[1]}▶︎ ${pctText(S.pts[c[0]],ptN)}`));
    t+=sec('周期当選',CYCLES.map(c=>`${c[1]}▶︎ ${pctText(S.zones[c[0]],cycleN)}`));
    t+=sec('真BBボイス',voiceN>0?VOICES.filter(c=>S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.ed[c[0]],voiceN)}`):[]);
    t+=sec('AT終了画面',screenN>0?SCREENS.filter(c=>S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.screens[c[0]],screenN)}`):[]);
    t+=sec('メニュー画面',menuN>0?MENUS.filter(c=>S.menu[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.menu[c[0]],menuN)}`):[]);
    if(S.cz.battoMax>0)t+=sec('抜刀チャンス',[`抜刀チャンス▶︎ ${ratio(S.cz.battoHit,S.cz.battoMax)}`]);
    t+=sec('コパンダトロフィー',TROPHIES.filter(c=>S.coins[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.coins[c[0]]}回`));
    t+=sec('獲得枚数',MEDALS.filter(c=>S.over[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.over[c[0]]}回`));
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.yoshimune={
    nanaCollab:true,
    storageKey:'yoshimune-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','pts','cz','atcz','screens','ed','icons','coins','menu','vision','over'],
    sourceUrl:'https://chonborista.com/slot/daito-slot/252676/',
    share:{title:'L真打吉宗 設定判別メモ',hashtags:'#真打吉宗 #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageCycle(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplTextCompact,
    card:{
      title:'L真打吉宗',
      gameLabel:'通常',
      footerTags:'#真打吉宗 #設定判別',
      downloadName:'yoshimune_check.png',
      detailDownloadName:'yoshimune_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=S.games,oppN=sum(S.icons);
        return [
          ['CZ確率',rate(g,S.cz.cz)],
          ['AT確率',rate(g,S.atCount)],
          ['VS柳生',ratio(S.icons.yagyu,oppN)],
          ['抜刀',ratio(S.cz.battoHit,S.cz.battoMax)]
        ];
      },
      chart:ctx=>({title:'周期当選分布',x:135,step:140,width:70,items:CYCLES.map(c=>({label:c[4],value:ctx.S.zones[c[0]]}))}),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'吉宗画面',value:S.screens.yoshi},
          {tier:6,order:2,label:'虹コパンダ',value:S.coins.rainbow},
          {tier:6,order:3,label:'666枚',value:S.over.m666},
          {tier:6,order:4,label:'江戸を守る',value:S.ed.edo6},
          {tier:5,order:1,label:'大奥画面',value:S.screens.ooku},
          {tier:5,order:2,label:'イナズマコパンダ',value:S.coins.thunder},
          {tier:5,order:3,label:'555枚',value:S.over.m555},
          {tier:5,order:4,label:'江戸も安泰',value:S.ed.yoshi5},
          {tier:4,order:1,label:'柳生画面',value:S.screens.yagyu},
          {tier:4,order:2,label:'金コパンダ',value:S.coins.gold},
          {tier:4,order:3,label:'456枚',value:S.over.m456},
          {tier:4,order:4,label:'ボイス越前',value:S.ed.echizen4},
          {tier:3,order:1,label:'銀コパンダ',value:S.coins.silver},
          {tier:2,order:1,label:'大岡越前画面',value:S.screens.echizen},
          {tier:2,order:2,label:'銅コパンダ',value:S.coins.bronze},
          {tier:2,order:3,label:'胸が高鳴るのう',value:S.ed.yoshi2}
        ];
        const strong=strongItems.reduce((a,b)=>a+b.value,0);
        const best=strongItems.filter(v=>v.value>0).sort((a,b)=>b.tier-a.tier||a.order-b.order)[0];
        const odd=S.ed.aoi1+S.ed.sakura1, even=S.ed.midori1+S.ed.beni1, high=S.ed.tenei1+S.ed.tenei2;
        const trophy=sum(S.coins), medals=sum(S.over);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:[
              {text:best?`最強 ${best.label} ×${best.value}`:'濃厚示唆 なし',value:best?best.value:0,active:!!best},
              {text:`終了 三日月${S.screens.crescent}・満月${S.screens.fullmoon}`,value:S.screens.crescent+S.screens.fullmoon},
              {text:`ボイス 奇${odd}・偶${even}・高${high}`,value:odd+even+high},
              {text:`特化 百${S.cz.hyakka}・人馬${S.cz.jinba}`,value:S.cz.hyakka+S.cz.jinba},
              {text:`トロフィー 計${trophy}`,value:trophy}
            ]},
            {x:560,items:[
              {text:`濃厚示唆 計${strong}回`,value:strong,active:strong>0},
              {text:`ビジョン 越前${S.vision.echizen}・天英${S.vision.tenei}`,value:S.vision.echizen+S.vision.tenei},
              {text:`メニュー 越前${S.menu.echizen}・天英${S.menu.tenei}`,value:S.menu.echizen+S.menu.tenei},
              {text:`直撃 ×${S.choku}`,value:S.choku},
              {text:`枚数 計${medals}`,value:medals}
            ]}
          ]
        };
      }
    }
  };
})();

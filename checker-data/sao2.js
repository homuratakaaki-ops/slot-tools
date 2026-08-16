(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'—'),show:d>0};}
  function detail(ctx){
    const S=ctx.S;
    const atEnd=S.atcz.atEnd||0;
    const over2=(S.atcz.set2||0)+(S.atcz.set3||0)+(S.atcz.set4||0);
    return [
      {title:'初当り・小役',items:[detailItem('CZ当選',S.cz.cz,0),detailItem('AT当選',S.atCount,0),detailItem('確定CZ',S.cz.end,1),detailItem('曠野の決闘',S.cz.duel,1),{label:'共通ベル',value:S.cz.bell,hot:false,text:S.cz.bell>0?'共通ベル 1/'+((S.games||0)/S.cz.bell).toFixed(1):'',show:S.cz.bell>0},{label:'強チャンス目B',value:S.cz.chanceB,hot:false,text:S.cz.chanceB>0?'強チャンス目B 1/'+((S.games||0)/S.cz.chanceB).toFixed(1):'',show:S.cz.chanceB>0}]},
      {title:'CZ失敗後',items:[detailItem('CZ失敗',S.atcz.fail,0),detailRatio('CZ失敗後のアイテム獲得',S.atcz.item,S.atcz.fail,1),detailItem('SC1・2戦目デスガン',S.atcz.deathgun,1)]},
      {title:'AT終了後・継続セット',items:[detailItem('AT終了',atEnd,0)].concat(SETS.map(c=>Object.assign(detailItem(c[1],S.atcz[c[0]],c[3]),{denominator:atEnd})),[detailRatio('AT後50G以内の引き戻し',S.atcz.return50,atEnd,1),detailRatio('2セット以上継続',over2,atEnd,0)])},
      {title:'AT終了画面',items:detailItems(SCREENS,S.screens),percent:true},
      {title:'コパンダトロフィー',items:detailItems(TROPHIES,S.coins)},
      {title:'ED中のミニキャラ',items:detailItems(ED,S.ed),percent:true},
      {title:'GGOモード示唆',items:detailItems(GGO,S.icons),percent:true}
    ];
  }
  window.CheckerConfigs=window.CheckerConfigs||{};

  const SETS=[
    ['set1','1セット','高設定ほど2セット以上継続しやすい',0,'1'],
    ['set2','2セット','高設定ほど2セット以上継続しやすい',0,'2'],
    ['set3','3セット','高設定ほど2セット以上継続しやすい',0,'3'],
    ['set4','4セット以上','高設定ほど2セット以上継続しやすい',0,'4+']
  ];
  const SCREENS=[
    ['kiritoSinon','キリト＆シノン','デフォルト',0],
    ['uniform','制服','奇数設定期待度UP',0],
    ['sofa','ソファー','偶数設定期待度UP',0],
    ['sunlight','木漏れ日','高設定期待度UP',0],
    ['festival','夏祭り','高設定期待度UP（強）',1],
    ['childhood','幼少期','設定5期待度UP（設定6より出やすい）',1],
    ['shirt','Yシャツ','設定2以上濃厚',1],
    ['bath','お風呂','設定3以上濃厚',1],
    ['swimsuit','水着','設定4以上濃厚',1],
    ['pajamas','パジャマ','設定6濃厚',1]
  ];
  const TROPHIES=[
    ['bronze','コパンダ銅','設定2以上濃厚',1],
    ['silver','コパンダ銀','設定3以上濃厚',1],
    ['gold','コパンダ金','設定4以上濃厚',1],
    ['thunder','コパンダイナズマ','設定5以上濃厚',1],
    ['rainbow','コパンダ虹','設定6濃厚',1]
  ];
  const ED=[
    ['kirito','キリト','奇数設定期待度UP',0],
    ['sinonYuuki','シノン・ユウキ','偶数設定期待度UP',0],
    ['liz','リズベット','奇数設定期待度UP（強）',0],
    ['silica','シリカ','偶数設定期待度UP（強）',0],
    ['gunnerLeafa','銃士X・リーファ','高設定期待度UP',0],
    ['asuna','アスナ','高設定期待度UP（強）',0],
    ['shinoYui','詩乃・ユイ','設定4以上濃厚',1],
    ['edRainbow','虹','設定6濃厚',1]
  ];
  const GGO=[
    ['sword','光剣','キリトモード示唆（天井500G短縮）',0],
    ['amusphere','アミュスフィア','詩乃モード示唆（CZ→AT直撃化）',0],
    ['hecate','ヘカートII','シノンモード示唆（AT中SC高確率）',0],
    ['blackStar','黒星','死銃モード示唆（1戦目デス・ガン）',0],
    ['buggy','バギー','GGOモード示唆（全モード対応）',0],
    ['histDeathGun','履歴画面：デス・ガン','死銃モード濃厚',1],
    ['histHost','履歴画面：司会者','モードアップ濃厚',0]
  ];
  const DEF={
    games:0,
    zones:{},
    cz:{cz:0,end:0,duel:0,bell:0,chanceB:0},
    atcz:{fail:0,item:0,deathgun:0,atEnd:0,set1:0,set2:0,set3:0,set4:0,return50:0},
    choku:0,
    atCount:0,
    screens:Object.fromEntries(SCREENS.map(s=>[s[0],0])),
    ed:Object.fromEntries(ED.map(e=>[e[0],0])),
    icons:Object.fromEntries(GGO.map(g=>[g[0],0])),
    coins:Object.fromEntries(TROPHIES.map(t=>[t[0],0])),
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
    <div class="hint">ダイトモの通常回転数を入力（AT中は含めない）</div>
    <div class="hint">⚠ 本機はCZ・AT確率だと設定5が設定4よりやや重い。設定5は確率ではなく優遇項目群（優遇タブ）で見抜く機種。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り・小役</div>
    <div class="cgrid">
      ${ctx.crow('cz.cz','CZ当選','設1:1/238.4⇔設6:1/191.7',0)}
      ${ctx.crow('atCount','AT当選','設1:1/386.2⇔設6:1/269.6',0)}
      ${ctx.crow('cz.end','確定CZ','THE END状態スタート・設1:1/20178⇔設6:1/7077',1)}
      ${ctx.crow('cz.duel','曠野の決闘','CZ失敗時フリーズ・設1:1/128⇔設6:1/64',1)}
      ${ctx.crow('cz.bell','共通ベル（斜め揃い）',`実戦値 設5:1/47.6・設6:1/45.4 / 現在 ${rate(g,ctx.S.cz.bell)}`,0)}
      ${ctx.crow('cz.chanceB','強チャンス目B',`設1:1/1057⇔設6実戦値:1/769 / 現在 ${rate(g,ctx.S.cz.chanceB)}`,0)}
    </div>
  </section>`;
  }
  function pageYuugu(ctx){
    const fail=ctx.S.atcz.fail, atEnd=ctx.S.atcz.atEnd;
    return `
  <section class="sec">
    <div class="sec-h">CZ失敗後</div>
    <div class="cgrid">
      ${ctx.crow('atcz.fail','CZ失敗','アイテム獲得率の分母',0)}
      ${ctx.crow('atcz.item','CZ失敗後のアイテム獲得','獲得率 設1:20.3%⇔設5:25.0%⇔設6:30.1%',1,n=>ratio(n,fail))}
      ${ctx.crow('atcz.deathgun','SC1・2戦目デス・ガン','設定5で選択率優遇（GGO死銃モード時は1戦目確定なので除外）',1)}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">AT終了後・継続セット<span class="sub">分母＝AT終了 ${atEnd}回</span></div>
    <div class="cgrid">
      ${ctx.crow('atcz.atEnd','AT終了','継続セット・引き戻しの分母',0)}
      ${SETS.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],n=>ratio(n,atEnd))).join('')}
      ${ctx.crow('atcz.return50','AT後50G以内の引き戻し','設定差あり。50G目ちょうどのレア役引き戻しは除外',1,n=>ratio(n,atEnd))}
    </div>
    <div class="hint">通常時スイカのシューティングチャージ当選（設1:40.2%⇔設6:55.1%）と強チェリーのCZ当選にも設定差あり。counting負荷が高いため本ツールでは任意。共有テキストへ手書き追記推奨。</div>
  </section>`;
  }
  function pageShisa(ctx){
    const scN=sum(ctx.S.screens), edN=sum(ctx.S.ed), ggoN=sum(ctx.S.icons);
    return `
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,scN))).join('')}</div>
    <div class="hint">キャラ誕生日前後のお祝い画面は設定示唆と無関係（カウント不要）。幼少期は設定5のほうが6より出やすい本機の特徴的示唆。</div></section>
  <section class="sec"><div class="sec-h">コパンダトロフィー</div>
    <div class="cgrid">${TROPHIES.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">ED中のミニキャラ<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,edN))).join('')}</div>
    <div class="hint">EDとマザーズ・ロザリオ中のレア役で出現。</div></section>
  <section class="sec"><div class="sec-h">GGOモード示唆<span class="sub">計${ggoN}回</span></div>
    <div class="cgrid">${GGO.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,ggoN))).join('')}</div>
    <div class="hint">アイテムは青＜緑＜赤。緑＝いずれかのGGOモード滞在期待度約50%、赤＝該当モード濃厚。いずれかのGGOモード滞在で機械割100%超＋高設定ほど滞在率優遇（設1:約20%）。色は共有テキストに手書き補足推奨。</div></section>`;
  }
  function tplText(ctx){
    const S=ctx.S, czN=S.cz.cz, atN=S.atCount, fail=S.atcz.fail, atEnd=S.atcz.atEnd;
    let t=`設定判別メモ｜L SAO2\n通常 ${S.games||0}G / CZ${czN}回 / AT${atN}回\n_______\n\n■GGOモード示唆\n`;
    GGO.forEach(c=>{t+=`${c[1]}▶︎ ${S.icons[c[0]]}回\n`;});
    t+='\n■AT継続セット数\n';
    SETS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.atcz[c[0]],atEnd)}\n`;});
    t+='\n■AT終了画面\n';
    const scN=sum(S.screens);
    SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.screens[c[0]],scN)}\n`;});
    t+='\n■コパンダトロフィー\n';
    TROPHIES.forEach(c=>{t+=`${c[1]}▶︎ ${S.coins[c[0]]}回\n`;});
    t+='\n■EDミニキャラ\n';
    const edN=sum(S.ed);
    ED.forEach(c=>{t+=`${c[1]}▶︎ ${pctText(S.ed[c[0]],edN)}\n`;});
    t+=`\n■優遇項目\n確定CZ▶︎ ${S.cz.end}回\n曠野の決闘▶︎ ${S.cz.duel}回\nCZ失敗→アイテム▶︎ ${ratio(S.atcz.item,fail)}\nSC1・2戦目デスガン▶︎ ${S.atcz.deathgun}回\nAT引き戻し▶︎ ${ratio(S.atcz.return50,atEnd)}\n共通ベル▶︎ ${rate(S.games,S.cz.bell)}（${S.cz.bell}回）\n強チャンス目B▶︎ ${rate(S.games,S.cz.chanceB)}（${S.cz.chanceB}回）\n`;
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function tplTextCompact(ctx){
    const S=ctx.S, czN=S.cz.cz, atN=S.atCount, fail=S.atcz.fail, atEnd=S.atcz.atEnd;
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜L SAO2\n通常 ${S.games||0}G / CZ${czN}回 / AT${atN}回\n_______\n`;
    t+=sec('GGOモード示唆',GGO.filter(c=>S.icons[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.icons[c[0]]}回`));
    t+=sec('AT継続セット数',atEnd>0?SETS.filter(c=>S.atcz[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.atcz[c[0]],atEnd)}`):[]);
    const scN=sum(S.screens);
    t+=sec('AT終了画面',scN>0?SCREENS.filter(c=>S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.screens[c[0]],scN)}`):[]);
    t+=sec('コパンダトロフィー',TROPHIES.filter(c=>S.coins[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.coins[c[0]]}回`));
    const edN=sum(S.ed);
    t+=sec('EDミニキャラ',edN>0?ED.filter(c=>S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.ed[c[0]],edN)}`):[]);
    const yuugu=[];
    if(S.cz.end>0)yuugu.push(`確定CZ▶︎ ${S.cz.end}回`);
    if(S.cz.duel>0)yuugu.push(`曠野の決闘▶︎ ${S.cz.duel}回`);
    if(fail>0)yuugu.push(`CZ失敗→アイテム▶︎ ${ratio(S.atcz.item,fail)}`);
    if(S.atcz.deathgun>0)yuugu.push(`SC1・2戦目デスガン▶︎ ${S.atcz.deathgun}回`);
    if(atEnd>0)yuugu.push(`AT引き戻し▶︎ ${ratio(S.atcz.return50,atEnd)}`);
    if(S.cz.bell>0)yuugu.push(`共通ベル▶︎ ${rate(S.games,S.cz.bell)}（${S.cz.bell}回）`);
    if(S.cz.chanceB>0)yuugu.push(`強チャンス目B▶︎ ${rate(S.games,S.cz.chanceB)}（${S.cz.chanceB}回）`);
    t+=sec('優遇項目',yuugu);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.sao2={
    nanaCollab:true,
    storageKey:'sao2-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins'],
    sourceUrl:'https://chonborista.com/slot/daito-slot/256112/',
    share:{
      title:'L SAO2 設定判別メモ',
      hashtags:'#SAO2 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageYuugu(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplTextCompact,
    card:{
      title:'L SAO2',
      gameLabel:'通常',
      footerTags:'#SAO2 #設定判別',
      downloadName:'sao2_check.png',
      detailDownloadName:'sao2_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=S.games;
        return [
          ['CZ確率',rate(g,S.cz.cz)],
          ['AT確率',rate(g,S.atCount)],
          ['確定CZ',S.cz.end+'回'],
          ['SCデスガン',S.atcz.deathgun+'回']
        ];
      },
      chart:ctx=>({
        title:'AT継続セット数分布',
        x:165,
        step:180,
        width:78,
        items:SETS.map(s=>({label:s[4],value:ctx.S.atcz[s[0]]}))
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'虹コパンダ',value:S.coins.rainbow},
          {tier:6,order:2,label:'パジャマ',value:S.screens.pajamas},
          {tier:6,order:3,label:'ED虹',value:S.ed.edRainbow},
          {tier:5,order:1,label:'イナズマコパンダ',value:S.coins.thunder},
          {tier:4,order:1,label:'金コパンダ',value:S.coins.gold},
          {tier:4,order:2,label:'水着',value:S.screens.swimsuit},
          {tier:4,order:3,label:'ED詩乃・ユイ',value:S.ed.shinoYui},
          {tier:3,order:1,label:'銀コパンダ',value:S.coins.silver},
          {tier:3,order:2,label:'お風呂',value:S.screens.bath},
          {tier:2,order:1,label:'銅コパンダ',value:S.coins.bronze},
          {tier:2,order:2,label:'Yシャツ',value:S.screens.shirt}
        ];
        const strong=strongItems.reduce((a,b)=>a+b.value,0);
        const best=strongItems.filter(v=>v.value>0).sort((a,b)=>b.tier-a.tier||a.order-b.order)[0];
        const fail=S.atcz.fail, atEnd=S.atcz.atEnd;
        const over2=S.atcz.set2+S.atcz.set3+S.atcz.set4;
        const ggo=sum(S.icons);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:[
              {text:best?`最強 ${best.label} ×${best.value}`:'濃厚示唆 なし',value:best?best.value:0,active:!!best},
              {text:`確定CZ ×${S.cz.end}`,value:S.cz.end},
              {text:`CZ失敗→アイテム ${ratio(S.atcz.item,fail)}`,value:S.atcz.item,active:fail>0&&S.atcz.item>0},
              {text:`2セット以上 ${ratio(over2,atEnd)}`,value:over2,active:atEnd>0&&over2>0},
              {text:`GGO示唆 計${ggo}`,value:ggo}
            ]},
            {x:560,items:[
              {text:`濃厚示唆 計${strong}回`,value:strong},
              {text:`SC1・2戦デスガン ×${S.atcz.deathgun}`,value:S.atcz.deathgun},
              {text:`引き戻し ${ratio(S.atcz.return50,atEnd)}`,value:S.atcz.return50,active:atEnd>0&&S.atcz.return50>0},
              {text:shown('終了画面',[['幼',S.screens.childhood],['祭',S.screens.festival],['木',S.screens.sunlight]]),value:S.screens.childhood+S.screens.festival+S.screens.sunlight},
              {text:`共通ベル ${rate(S.games,S.cz.bell)}`,value:S.cz.bell}
            ]}
          ]
        };
      }
    }
  };
})();

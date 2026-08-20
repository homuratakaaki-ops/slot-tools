(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'—'),show:d>0};}
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[detailItem('ボーナス初当り',S.cz.bonus,0),detailItem('炎炎ループ',S.atCount,1),detailItem('SPエピソードボーナス',S.choku,0)]},
      {title:'伝導者の罠',items:[detailItem('伝導者の罠 突入',S.cz.trap,0),detailRatio('罠から炎炎激闘 当選',S.cz.trapHit,S.cz.trap,0),detailItem('罠中 小V成立',S.cz.smallv,0),detailRatio('罠中 十字目変換 発生',S.cz.convert,S.cz.smallv,1),detailRatio('変換からボーナス当選',S.cz.convertBonus,S.cz.convert,1),detailItem('バトル ジョヴァンニ',S.cz.giovanni,0),detailItem('バトル オロチ',S.cz.orochi,0)]},
      {title:'REG後 ボーナス終了画面',items:detailItems(BONUS_SCREENS,S.zonesReg),percent:true},
      {title:'BIG後 ボーナス終了画面',items:detailItems(BONUS_SCREENS,S.zonesBig),percent:true},
      {title:'RB中のキャラ紹介シナリオ',items:detailItems(SCENARIOS,S.screens),percent:true},
      {title:'キャラ紹介の特殊パターン',items:detailItems(SPECIALS,S.ed)},
      {title:'まもるくん出現位置',items:detailItems(MAMORU,S.icons),percent:true},
      {title:'獲得枚数表示',items:detailItems(OVER,S.coins)},
      {title:'エンディング中のミニキャラ',items:detailItems(ED_CHARS,S.atcz),percent:true}
    ];
  }
  window.CheckerConfigs=window.CheckerConfigs||{};

  const BONUS_SCREENS=[
    ['def','デフォルト','デ'],
    ['laugh','大笑い','笑'],
    ['blackWoman','黒の女','女'],
    ['blackFrame','黒枠','黒'],
    ['redFrame','赤枠','赤'],
    ['goldFrame','金枠','金'],
    ['other','その他','他']
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
  const DEF={
    games:0,
    zonesReg:Object.fromEntries(BONUS_SCREENS.map(v=>[v[0],0])),
    zonesBig:Object.fromEntries(BONUS_SCREENS.map(v=>[v[0],0])),
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
  function rate(g,n){return n&&g?'1/'+(g/n).toFixed(1):'—';}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'−'}`;
  }

  function pageHatsu(ctx){
    const g=ctx.S.games;
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">台のサブ液晶メニューで総ゲーム数を確認して入力します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.bonus','ボーナス初当り','設1:1/272⇔設6:1/227',0)}
      ${ctx.crow('atCount','炎炎ループ','設1:1/684⇔設6:1/486',1)}
      ${ctx.crow('choku','SPエピソードボーナス','突入で炎炎激闘濃厚',0)}
    </div>
    <div class="hint">初当りと炎炎ループの両輪で判別。天井はボーナス間850G/炎炎ループ間2000G（リセット時650G/1500G）。</div>
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
    const regN=sum(ctx.S.zonesReg), bigN=sum(ctx.S.zonesBig), scenarioN=sum(ctx.S.screens), mamoruN=sum(ctx.S.icons), edN=sum(ctx.S.atcz);
    return `
  <section class="sec"><div class="sec-h">REG後 ボーナス終了画面<span class="sub">計${regN}回</span></div>
    <div class="cgrid">${BONUS_SCREENS.map(c=>ctx.crow('zonesReg.'+c[0],c[1],'',0,n=>ctx.pct(n,regN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">BIG後 ボーナス終了画面<span class="sub">計${bigN}回</span></div>
    <div class="cgrid">${BONUS_SCREENS.map(c=>ctx.crow('zonesBig.'+c[0],c[1],'',0,n=>ctx.pct(n,bigN))).join('')}</div>
    <div class="hint">黒枠＜赤枠＜金枠の順で上位ほど高設定に期待。⚠店長カスタム搭載機（カスタム報知機能あり）。</div></section>
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
    t+=`\n■ボーナス終了画面\nREG後\n`;
    const regN=sum(ctx.S.zonesReg), bigN=sum(ctx.S.zonesBig);
    BONUS_SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.zonesReg[c[0]],regN)}\n`;});
    t+=`BIG後\n`;
    BONUS_SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.zonesBig[c[0]],bigN)}\n`;});
    t+=`\n■獲得枚数\n`;
    OVER.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.coins[c[0]]}回\n`;});
    t+=`\n■EDミニキャラ\n`;
    const edN=sum(ctx.S.atcz);
    ED_CHARS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.atcz[c[0]],edN)}\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  function tplTextCompact(ctx){
    const S=ctx.S;
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜L炎炎ノ消防隊2\n総回転数 ${S.games||0}G / ボーナス${S.cz.bonus}回 / 炎炎ループ${S.atCount}回\n_______\n`;
    const scenarioN=sum(S.screens);
    t+=sec('キャラ紹介シナリオ（系統別）',scenarioN>0?SCENARIOS.filter(c=>S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctLine(S.screens[c[0]],scenarioN)}`):[]);
    t+=sec('特殊パターン',SPECIALS.filter(c=>S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.ed[c[0]]}回`));
    t+=sec('まもるくん',MAMORU.filter(c=>S.icons[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.icons[c[0]]}回`));
    const trap=[];
    if(S.cz.trap>0)trap.push(`伝導者の罠成功▶︎ ${ratio(S.cz.trapHit,S.cz.trap)}`);
    if(S.cz.smallv>0)trap.push(`十字目変換▶︎ ${ratio(S.cz.convert,S.cz.smallv)}`);
    if(S.cz.convert>0)trap.push(`変換からボーナス▶︎ ${ratio(S.cz.convertBonus,S.cz.convert)}`);
    t+=sec('罠・変換',trap);
    const battle=[];
    if(S.cz.giovanni>0)battle.push(`ジョヴァンニ▶︎ ${S.cz.giovanni}回`);
    if(S.cz.orochi>0)battle.push(`オロチ▶︎ ${S.cz.orochi}回`);
    t+=sec('バトル',battle);
    const regN=sum(S.zonesReg), bigN=sum(S.zonesBig);
    const bonus=[];
    if(regN>0){
      bonus.push('REG後');
      BONUS_SCREENS.filter(c=>S.zonesReg[c[0]]>0).forEach(c=>bonus.push(`${c[1]}▶︎ ${pctLine(S.zonesReg[c[0]],regN)}`));
    }
    if(bigN>0){
      bonus.push('BIG後');
      BONUS_SCREENS.filter(c=>S.zonesBig[c[0]]>0).forEach(c=>bonus.push(`${c[1]}▶︎ ${pctLine(S.zonesBig[c[0]],bigN)}`));
    }
    t+=sec('ボーナス終了画面',bonus);
    t+=sec('獲得枚数',OVER.filter(c=>S.coins[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.coins[c[0]]}回`));
    const edN=sum(S.atcz);
    t+=sec('EDミニキャラ',edN>0?ED_CHARS.filter(c=>S.atcz[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctLine(S.atcz[c[0]],edN)}`):[]);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.enen2={
    nanaCollab:true,
    storageKey:'enen2-checker-v1',
    defaults:DEF,
    mergeKeys:['zonesReg','zonesBig','cz','atcz','screens','ed','icons','coins'],
    normalizeState:out=>{
      delete out.zones;
      out.zonesReg=Object.assign({},DEF.zonesReg,out.zonesReg||{});
      out.zonesBig=Object.assign({},DEF.zonesBig,out.zonesBig||{});
      return out;
    },
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
    compactTemplate:tplTextCompact,
    card:{
      title:'L炎炎ノ消防隊2',
      footerTags:'#炎炎ノ消防隊2 #設定判別',
      downloadName:'enen2_check.png',
      detailDownloadName:'enen2_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const g=ctx.S.games;
        return [['ボーナス確率',`${rate(g,ctx.S.cz.bonus)} ${ctx.S.cz.bonus}回`],['炎炎ループ',`${rate(g,ctx.S.atCount)} ${ctx.S.atCount}回`],['罠成功',ratio(ctx.S.cz.trapHit,ctx.S.cz.trap)],['変換発生',ratio(ctx.S.cz.convert,ctx.S.cz.smallv)]];
      },
      chart:ctx=>({
        title:'ボーナス終了画面分布',
        type:'percentGroups',
        dividerX:540,
        groups:[
          {
            title:'REG後',
            titleX:290,
            x:95,
            step:90,
            width:56,
            total:sum(ctx.S.zonesReg),
            color:'#ff3d8f',
            items:[
              {label:'デ',value:ctx.S.zonesReg.def},
              {label:'笑',value:ctx.S.zonesReg.laugh},
              {label:'女',value:ctx.S.zonesReg.blackWoman},
              {label:'他',value:ctx.S.zonesReg.other}
            ]
          },
          {
            title:'BIG後',
            titleX:790,
            x:595,
            step:90,
            width:56,
            total:sum(ctx.S.zonesBig),
            color:'#7aa8ff',
            items:[
              {label:'デ',value:ctx.S.zonesBig.def},
              {label:'笑',value:ctx.S.zonesBig.laugh},
              {label:'女',value:ctx.S.zonesBig.blackWoman},
              {label:'他',value:ctx.S.zonesBig.other}
            ]
          }
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'シンラ死ノ圧(6濃厚)',value:S.ed.death},
          {tier:6,order:2,label:'666 OVER(6濃厚)',value:S.coins.o666},
          {tier:6,order:3,label:'ショウ(6濃厚)',value:S.atcz.sho},
          {tier:6,order:4,label:'第8④(6濃厚)',value:S.screens.d8_4},
          {tier:6,order:5,label:'アイリス⑥(6濃厚)',value:S.screens.iris_6},
          {tier:5,order:1,label:'ジョーカー(5以上)',value:S.ed.joker},
          {tier:5,order:2,label:'紅丸＆ジョーカー(5以上)',value:S.atcz.benij},
          {tier:5,order:3,label:'伝導者④(5以上)',value:S.screens.conduct_4},
          {tier:4,order:1,label:'金背景(4以上)',value:S.ed.gold},
          {tier:4,order:2,label:'456 OVER(4以上)',value:S.coins.o456},
          {tier:4,order:3,label:'アイリスED(4以上)',value:S.atcz.iris},
          {tier:4,order:4,label:'黒野(4以上)',value:S.ed.kurono},
          {tier:4,order:5,label:'大隊長(4以上)',value:S.screens.captain},
          {tier:4,order:6,label:'第8③(4以上)',value:S.screens.d8_3},
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
        const endR=shown('終了R',[['黒',S.zonesReg.blackFrame],['赤',S.zonesReg.redFrame],['金',S.zonesReg.goldFrame]]);
        const endB=shown('終了B',[['黒',S.zonesBig.blackFrame],['赤',S.zonesBig.redFrame],['金',S.zonesBig.goldFrame]]);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              {text:best?`確定演出 ${best.label} ×${best.value}`:'確定演出 なし',value:best?best.value:0,active:!!best},
              {text:endR,value:S.zonesReg.blackFrame+S.zonesReg.redFrame+S.zonesReg.goldFrame},
              {text:endB,value:S.zonesBig.blackFrame+S.zonesBig.redFrame+S.zonesBig.goldFrame},
              {text:shown('シナリオ',[['第8系',scenarioD8],['伝',scenarioConduct],['ア',scenarioIris],['隊',S.screens.captain]]),value:scenarioTotal},
              {text:shown('ED',[['タマ',S.atcz.tamaki],['アイ',S.atcz.iris],['紅J',S.atcz.benij],['ショ',S.atcz.sho]]),value:edPick}
            ]},
            {x:560,items:[
              {text:`確定演出 計${strong}回`,value:strong},
              {text:shown('否定',[['①',S.icons.m1],['②',S.icons.m2],['③',S.icons.m3],['④',S.icons.m4],['⑤',S.icons.m5]]),value:mamoru},
              {text:shown('特殊',[['金',S.ed.gold],['黒',S.ed.kurono],['ジ',S.ed.joker],['死',S.ed.death]]),value:specialTotal},
              {text:shown('枚数',[['119',S.coins.o119],['246',S.coins.o246],['456',S.coins.o456],['666',S.coins.o666]]),value:overTotal}
            ]}
          ]
        };
      }
    }
  };
})();

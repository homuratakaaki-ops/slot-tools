(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'—'),show:d>0};}
  function detail(ctx){
    const S=ctx.S;
    const c34n=['c3','c4'].reduce((a,k)=>a+(S.zones[k+'w']||0),0);
    const c34d=['c3','c4'].reduce((a,k)=>a+(S.zones[k+'r']||0),0);
    return [
      {title:'アイテムくじ',items:detailItems(ITEMS,S.icons)},
      {title:'周期当選',items:CYCLES.map(c=>detailRatio(c[1],S.zones[c[0]+'w']||0,S.zones[c[0]+'r']||0,c[3]))},
      {title:'3・4周期',items:[detailRatio('3・4周期',c34n,c34d,1)]},
      {title:'ボイス',items:detailItems(VOICES,S.atcz)},
      {title:'キャラ紹介',items:detailItems(CHARS,S.ed)},
      {title:'ST終了画面',items:detailItems(SCREENS,S.screens)},
      {title:'サミートロフィー',items:detailItems(TROPHIES,S.coins)},
      {title:'連打枚数',items:detailItems(ATTACK,S.attack)},
      {title:'獲得枚数',items:detailItems(OVER,S.over)}
    ];
  }
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
    ['kurusu','来栖の刀','特定設定を否定（設2否定の可能性）',0],
    ['kendama','無名のけん玉','特定設定を否定（設1否定の可能性）',0],
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
  const DEF={
    games:0,
    zones:Object.fromEntries(CYCLES.flatMap(c=>[[`${c[0]}r`,0],[`${c[0]}w`,0]])),
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
  function cycleReach(S,id){return Number(S.zones[`${id}r`])||0;}
  function cycleWin(S,id){return Number(S.zones[`${id}w`])||0;}
  function cycleRate(n,d){return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:'—';}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'−'}`;
  }
  function cycleRowRate(S,id){
    const n=cycleWin(S,id), d=cycleReach(S,id);
    return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:`${n}/0 —`;
  }
  function c34Rate(S){
    const n=cycleWin(S,'c3')+cycleWin(S,'c4');
    const d=cycleReach(S,'c3')+cycleReach(S,'c4');
    return {n,d,text:cycleRate(n,d)};
  }
  function pageCycles(ctx){
    const totalReach=CYCLES.reduce((a,c)=>a+cycleReach(ctx.S,c[0]),0);
    const totalWin=CYCLES.reduce((a,c)=>a+cycleWin(ctx.S,c[0]),0);
    return `<section class="sec">
    <style>
      .cycle-row .pct{min-width:74px;color:#ffc94d;font-size:12px;white-space:nowrap}
      .cycle-row .cycle-plus{
        flex:none;width:34px;height:34px;border-radius:9px;border:1px solid var(--pink-dim);
        background:rgba(255,61,143,.12);color:var(--pink);font-size:12px;font-weight:800;
        display:flex;align-items:center;justify-content:center;font-family:var(--body);
      }
      .cycle-row .cycle-plus:active{background:var(--pink);color:#fff}
      body.minus .cycle-row .cycle-plus{border-color:#7a3040;background:rgba(255,92,92,.14);color:var(--danger)}
      body.minus .cycle-row .cycle-plus:active{background:var(--danger);color:#fff}
    </style>
    <div class="sec-h">周期到達／当選<span class="sub">到達${totalReach}回・当選${totalWin}回</span></div>
    <div class="cgrid">
      ${CYCLES.map(c=>`<div class="crow cycle-row" data-c="zones.${c[0]}r" data-l="${c[1]} 到達">
        <div class="lbl"><div class="nm">${c[1]}</div><div class="mn ${c[3]?'hot':''}">${c[2]}</div></div>
        <div class="pct">${cycleRowRate(ctx.S,c[0])}</div>
        <button class="cycle-plus" data-bump="zones.${c[0]}w" data-label="${c[1]} 当選" aria-label="${c[1]}当選を1回${ctx.mode<0?'減算':'追加'}">当</button>
      </div>`).join('')}
    </div>
    <div class="hint">周期到達（規定ゲーム数消化で周期抽選発生）ごとに行をタップ。その周期で当選したら右端の「当」もタップ。⑥周期は天井のため当選率100%（到達＝当選）。</div>
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
      ${ctx.crow('cz.rg','ボーナス初当り','設1:1/254.2⇔設6:1/195.1',0)}
      ${ctx.crow('atCount','ST当選','設1:1/422.5⇔設6:1/318.5',0)}
    </div>
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
    CYCLES.forEach(c=>{t+=`${c[1]}▶︎ ${cycleWin(ctx.S,c[0])}/${cycleReach(ctx.S,c[0])}当選\n`;});
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

  function tplTextCompact(ctx){
    const itemN=sum(ctx.S.icons), voiceN=sum(ctx.S.atcz), charN=sum(ctx.S.ed), screenN=sum(ctx.S.screens);
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜スマスロ カバネリ海門決戦\n総回転数 ${ctx.S.games||0}G / ボーナス${ctx.S.cz.rg}回 / ST${ctx.S.atCount}回\n_______\n`;
    t+=sec('アイテムくじ',itemN>0?ITEMS.filter(c=>ctx.S.icons[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctLine(ctx.S.icons[c[0]],itemN)}`):[]);
    t+=`\n■周期当選\n`;
    CYCLES.forEach(c=>{t+=`${c[1]}▶︎ ${cycleWin(ctx.S,c[0])}/${cycleReach(ctx.S,c[0])}当選\n`;});
    t+=sec('ボイス',voiceN>0?VOICES.filter(c=>ctx.S.atcz[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctLine(ctx.S.atcz[c[0]],voiceN)}`):[]);
    t+=sec('キャラ紹介',charN>0?CHARS.filter(c=>ctx.S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctLine(ctx.S.ed[c[0]],charN)}`):[]);
    t+=sec('ST終了画面',screenN>0?SCREENS.filter(c=>ctx.S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctLine(ctx.S.screens[c[0]],screenN)}`):[]);
    t+=sec('サミートロフィー',TROPHIES.filter(c=>ctx.S.coins[c[0]]>0).map(c=>`${c[1]}▶︎ ${ctx.S.coins[c[0]]}回`));
    t+=sec('連打枚数・獲得枚数',ATTACK.filter(c=>ctx.S.attack[c[0]]>0).map(c=>`${c[1]}▶︎ ${ctx.S.attack[c[0]]}回`).concat(OVER.filter(c=>ctx.S.over[c[0]]>0).map(c=>`${c[1]}▶︎ ${ctx.S.over[c[0]]}回`)));
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.kabaneri2={
    nanaCollab:true,
    storageKey:'kabaneri2-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins','attack','over'],
    normalizeState:(out,src)=>{
      const oldZones=src&&src.zones&&typeof src.zones==='object'?src.zones:{};
      CYCLES.forEach(c=>{
        const id=c[0];
        const legacy=Number(oldZones[id]);
        if(Number.isFinite(legacy)&&oldZones[`${id}w`]===undefined&&oldZones[`${id}r`]===undefined){
          out.zones[`${id}w`]=legacy;
          out.zones[`${id}r`]=0;
        }
      });
      return out;
    },
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
    compactTemplate:tplTextCompact,
    card:{
      title:'スマスロ カバネリ海門決戦',
      titleFitMax:690,
      footerTags:'#カバネリ海門決戦 #設定判別',
      downloadName:'kabaneri2_check.png',
      detailDownloadName:'kabaneri2_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const g0=ctx.S.games;
        const bonusP=ctx.S.cz.rg&&g0?'1/'+(g0/ctx.S.cz.rg).toFixed(1):'—';
        const stP=ctx.S.atCount&&g0?'1/'+(g0/ctx.S.atCount).toFixed(1):'—';
        const c34=c34Rate(ctx.S);
        const trophy=sum(ctx.S.coins);
        return [['ボーナス確率',bonusP],['ST確率',stP],['3・4周期当選',c34.text],['トロフィー',trophy+'回']];
      },
      chart:ctx=>({
        title:'周期当選分布',
        x:110,
        step:145,
        width:72,
        items:CYCLES.map(c=>({label:c[4],value:cycleWin(ctx.S,c[0])}))
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'虹トロフィー(6濃厚)',value:S.coins.rb},
          {tier:6,order:2,label:'大吉(6濃厚)',value:S.icons.daikichi},
          {tier:6,order:3,label:'水着画面(6濃厚)',value:S.screens.swim},
          {tier:6,order:4,label:'666 OVER(6濃厚)',value:S.over.o666},
          {tier:6,order:5,label:'+66・77連打(6濃厚)',value:S.attack.a66+S.attack.a77},
          {tier:5,order:1,label:'キリン柄トロフィー(5以上)',value:S.coins.dg},
          {tier:5,order:2,label:'ボイスなし(5以上)',value:S.atcz.none},
          {tier:5,order:3,label:'+55連打(5以上)',value:S.attack.a55},
          {tier:4,order:1,label:'金トロフィー(4以上)',value:S.coins.au},
          {tier:4,order:2,label:'中吉(4以上)',value:S.icons.chukichi},
          {tier:4,order:3,label:'美馬紹介(4以上)',value:S.ed.biba},
          {tier:4,order:4,label:'456 OVER(4以上)',value:S.over.o456},
          {tier:4,order:5,label:'+44連打(4以上)',value:S.attack.a44},
          {tier:3,order:1,label:'銀トロフィー(3以上)',value:S.coins.ag},
          {tier:2,order:1,label:'銅トロフィー(2以上)',value:S.coins.cu},
          {tier:2,order:2,label:'小吉(2以上)',value:S.icons.shokichi},
          {tier:2,order:3,label:'無名ボイス(2以上)',value:S.atcz.mumei}
        ];
        const strong=strongItems.reduce((a,b)=>a+b.value,0);
        const best=strongItems.filter(v=>v.value>0).sort((a,b)=>b.tier-a.tier||a.order-b.order)[0];
        const c34=c34Rate(S);
        const attackOver=sum(S.attack)+sum(S.over);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:[
              {text:best?`最強 ${best.label} ×${best.value}`:'濃厚示唆 なし',value:best?best.value:0,active:!!best},
              {text:shown('ボイス',[['女',S.atcz.female],['男',S.atcz.male]]),value:S.atcz.female+S.atcz.male},
              {text:shown('キャラ紹介',[['女',S.ed.female],['男',S.ed.male],['美馬',S.ed.biba]]),value:S.ed.female+S.ed.male+S.ed.biba},
              {text:shown('くじ',[['弓',S.icons.ayame],['アゲハ',S.icons.butterfly]]),value:S.icons.ayame+S.icons.butterfly},
              {text:`周期③④ ${c34.text}`,value:c34.n}
            ]},
            {x:560,items:[
              {text:`濃厚示唆 計${strong}回`,value:strong},
              {text:shown('景之',[['弱',S.atcz.kage1],['中',S.atcz.kage2],['強',S.atcz.kage3]]),value:S.atcz.kage1+S.atcz.kage2+S.atcz.kage3},
              {text:shown('終了画面',[['鉄',S.screens.geta],['集',S.screens.group],['水',S.screens.swim]]),value:S.screens.geta+S.screens.group+S.screens.swim},
              {text:shown('吉',[['小',S.icons.shokichi],['中',S.icons.chukichi],['大',S.icons.daikichi]]),value:S.icons.shokichi+S.icons.chukichi+S.icons.daikichi},
              {text:`連打/枚数 ×${attackOver}`,value:attackOver}
            ]}
          ]
        };
      }
    }
  };
})();

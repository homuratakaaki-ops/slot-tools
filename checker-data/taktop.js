(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'-'),show:d>0};}
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[detailItem('AT当選',S.atCount,1),detailItem('デスティニーボーナス',S.cz.bonus,0)]},
      {title:'CZムジカートチャンス種別',items:detailItems(CZ_TYPES,S.zones).concat([detailItem('巨人 小役なし勝利',S.cz.giantNoRole,1)])},
      {title:'報酬チャンス',items:[detailItem('0pt到達',S.cz.rewardReach,0),detailRatio('報酬チャンス当選',S.cz.rewardHit,S.cz.rewardReach,1)]},
      {title:'ムジカートバトル',items:detailItems(BATTLES,S.atcz)},
      {title:'上位AT引き戻し',items:[detailItem('引き戻し区間 突入',S.cz.loopEnter,0),detailRatio('オルフェループ 当選',S.cz.loopHit,S.cz.loopEnter,1)]},
      {title:'CZ失敗時のボイス',items:detailItems(FAIL_VOICES,S.icons)},
      {title:'AT終了画面',items:detailItems(AT_SCREENS,S.screens)},
      {title:'デスティニーボーナス終了画面',items:detailItems(BONUS_SCREENS,S.ed)},
      {title:'ED画面',items:detailItems(ED_SCREENS,S.coins)},
      {title:'獲得枚数',items:detailItems(MEDALS,S.over)},
      {title:'凪のセリフ',items:detailItems(NAGI,S.nagi)}
    ];
  }
  window.CheckerConfigs=window.CheckerConfigs||{};

  const CZ_TYPES=[
    ['giant','巨人','設1:73.7%⇔設6:64.0%',0,'巨'],
    ['destiny','運命','設1:25.5%⇔設6:35.2%・高設定ほど選択されやすい',1,'運'],
    ['chicago','バトルオブシカゴ','全設定共通0.8%・期待度約76%',0,'シ']
  ];
  const BATTLES=[
    ['hell','地獄','ムジカートバトル種別',0,'地'],
    ['heaven','天国','ムジカートバトル種別',0,'天'],
    ['orphe','オルフェ','出現率に特大設定差（設1:1/943⇔設6:1/340）',1,'オ']
  ];
  const FAIL_VOICES=[
    ['default','ここからが正念場よ','デフォルト',0],
    ['music','僕はここで自分の音楽を〜','次回通常C期待度UP',0],
    ['good','いい感じだね♪','次回通常C期待度大UP',0],
    ['suspicious','だいぶ怪しい気配です','次回通常C濃厚',0]
  ];
  const AT_SCREENS=[
    ['girl','画面①（女・運命）','デフォルト',0],
    ['boy','画面②（男・タクト）','デフォルト',0],
    ['stampKa','可スタンプ','設定2以上濃厚',1],
    ['stampKichi','吉スタンプ','設定3以上濃厚',1],
    ['stampRyo','良スタンプ','設定4以上濃厚',1],
    ['stampYu','優スタンプ','設定5以上濃厚',1],
    ['stampKyoku','極スタンプ','設定6濃厚',1]
  ];
  const BONUS_SCREENS=[
    ['def1','①デフォルト','デフォルト',0,'①'],
    ['lenyGiant','②レニー＆巨人','高設定期待度UP',0,'②'],
    ['destinyGiant','③運命＆巨人','設定2以上濃厚',1,'③'],
    ['duet','④タクト＆運命（連弾）','設定4以上濃厚',1,'④'],
    ['rose','⑤タクト＆運命（バラ）','設定5以上濃厚',1,'⑤'],
    ['concert','⑥コンサート','設定6濃厚',1,'⑥']
  ];
  const ED_SCREENS=[
    ['white','白（アメコミ風運命）','デフォルト',0],
    ['blue','青（コゼット系）','偶数設定期待度UP',0],
    ['purple','紫（月光・アリア・くるみ割り）','高設定期待度UP',0],
    ['greenTakt','緑・タクト','設定2以上濃厚',1],
    ['greenGiant','緑・巨人','設定3以上濃厚',1],
    ['redAnna','赤・アンナ','設定4以上濃厚',1],
    ['goldLeny','金・レニー','設定5以上濃厚',1],
    ['rainbowDestiny','虹・運命','設定6濃厚',1]
  ];
  const MEDALS=[
    ['m222','222枚OVER','設定2以上濃厚',1],
    ['m333','333枚OVER','設定3以上濃厚',1],
    ['m444','444枚OVER','設定4以上濃厚',1],
    ['m555','555枚OVER','設定5以上濃厚',1],
    ['m666','666枚OVER','設定6濃厚',1]
  ];
  const NAGI=[
    ['default','また遊んでくださいね','デフォルト',0],
    ['different','一味違いますね','設定2以上濃厚',1],
    ['strange','何やら不思議な気配です','設定3以上濃厚',1],
    ['good','良い予感がします','設定4以上濃厚',1],
    ['play','遊び尽くしちゃいましょう','設定5以上濃厚',1],
    ['meat','お肉〜お肉〜','設定6濃厚',1]
  ];

  const DEF={
    games:0,
    zones:{giant:0,destiny:0,chicago:0},
    cz:{bonus:0,giantNoRole:0,rewardReach:0,rewardHit:0,loopEnter:0,loopHit:0},
    atCount:0,
    atcz:{hell:0,heaven:0,orphe:0},
    icons:{default:0,music:0,good:0,suspicious:0},
    screens:{girl:0,boy:0,stampKa:0,stampKichi:0,stampRyo:0,stampYu:0,stampKyoku:0},
    ed:{def1:0,lenyGiant:0,destinyGiant:0,duet:0,rose:0,concert:0},
    coins:{white:0,blue:0,purple:0,greenTakt:0,greenGiant:0,redAnna:0,goldLeny:0,rainbowDestiny:0},
    over:{m222:0,m333:0,m444:0,m555:0,m666:0},
    nagi:{default:0,different:0,strange:0,good:0,play:0,meat:0},
    iconChoice:null,
    img:null
  };

  function sum(o){return Object.values(o).reduce((a,b)=>a+(Number(b)||0),0);}
  function rate(g,n){return n&&g?'1/'+(g/n).toFixed(1):'-';}
  function ratio(n,d){return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:'-';}
  function pctText(n,d){return d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回(-)`;}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'-'}`;
  }
  function sec(title,rows){return rows.length?`\n■${title}\n${rows.join('\n')}\n`:'';}

  function pageHatsu(ctx){
    const g=ctx.S.games;
    return `
  <section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">打-WIN LITEの通常回転数を入力（QRコードから遊技情報を確認できます）</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('atCount','AT当選（バトルオーケストラ）','設1:1/358.5⇔設6:1/297.4・1/300が高設定の目安',1)}
      ${ctx.crow('cz.bonus','デスティニーボーナス（赤7）','全設定1/770・ループ率11.2%',0)}
    </div>
    <div class="hint">天井はAT間999G+α／CZ間500G+α（リセット時300G+α）。AT間ハマりはメニュー画面右上で確認。</div>
  </section>`;
  }

  function pageCz(ctx){
    const czN=sum(ctx.S.zones), battleN=sum(ctx.S.atcz), voiceN=sum(ctx.S.icons);
    return `
  <section class="sec">
    <div class="sec-h">CZムジカートチャンス種別<span class="sub">計${czN}回</span></div>
    <div class="cgrid">${CZ_TYPES.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,czN))).join('')}</div>
    <div class="cgrid" style="margin-top:6px">${ctx.crow('cz.giantNoRole','巨人 小役なし勝利','開始時AT当選の可能性大（設1:1.6%⇔設6:13.5%）。高設定の強材料',1)}</div>
    <div class="hint">運命の失敗が続く場合は高設定期待度ダウン（設4以上は運命の約半分が開始時当選のため）。</div>
  </section>
  <section class="sec">
    <div class="sec-h">報酬チャンス</div>
    <div class="cgrid">
      ${ctx.crow('cz.rewardReach','0pt到達（999pt減算）','分母用',0)}
      ${ctx.crow('cz.rewardHit','報酬チャンス当選','設1:27.2%⇔設4:31.2%',1,n=>ctx.pct(n,ctx.S.cz.rewardReach))}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">ムジカートバトル<span class="sub">計${battleN}回</span></div>
    <div class="cgrid">${BATTLES.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,battleN))).join('')}</div>
    <div class="hint">オルフェ出現が多いほど強材料。同一AT中に地獄2連続なら次回天国orオルフェ濃厚。</div>
  </section>
  <section class="sec">
    <div class="sec-h">上位AT引き戻し</div>
    <div class="cgrid">
      ${ctx.crow('cz.loopEnter','引き戻し区間 突入','紫モヤ・約30G',0)}
      ${ctx.crow('cz.loopHit','オルフェループ 当選','特大設定差 設1:69.9%⇔設6:94.1%',1,n=>ctx.pct(n,ctx.S.cz.loopEnter))}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">CZ失敗時のボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${FAIL_VOICES.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,voiceN))).join('')}</div>
  </section>`;
  }

  function pageShisa(ctx){
    const atN=sum(ctx.S.screens), bonusN=sum(ctx.S.ed), edN=sum(ctx.S.coins), nagiN=sum(ctx.S.nagi);
    return `
  <section class="sec">
    <div class="sec-h">AT終了画面<span class="sub">計${atN}回</span></div>
    <div class="cgrid">${AT_SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,atN))).join('')}</div>
    <div class="hint">終了画面は要PUSHの可能性あり。必ずPUSHで確認。</div>
  </section>
  <section class="sec">
    <div class="sec-h">デスティニーボーナス終了画面<span class="sub">計${bonusN}回</span></div>
    <div class="cgrid">${BONUS_SCREENS.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,bonusN))).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">ED画面<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED_SCREENS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,edN))).join('')}</div>
    <div class="hint">なな様テンプレの7色カウント準拠。緑のみ示唆が2種あるためタクト/巨人で分割。</div>
  </section>
  <section class="sec">
    <div class="sec-h">獲得枚数</div>
    <div class="cgrid">${MEDALS.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">凪のセリフ<span class="sub">計${nagiN}回</span></div>
    <div class="cgrid">${NAGI.map(c=>ctx.crow('nagi.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,nagiN))).join('')}</div>
    <div class="hint">1000G毎にセリフが切り替わる可能性あり。切り替わりタイミングでの再確認を推奨。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S, czN=sum(S.zones), bonusN=sum(S.ed), atN=sum(S.screens), edN=sum(S.coins), nagiN=sum(S.nagi), voiceN=sum(S.icons);
    let t=`設定判別メモ｜Lタクトオーパス\n通常 ${S.games||0}G / AT${S.atCount}回 / ボーナス${S.cz.bonus}回\n`;
    t+=sec('CZムジカートチャンス',CZ_TYPES.map(c=>`${c[1]}▶︎ ${pctText(S.zones[c[0]],czN)}`).concat([`巨人 小役なし勝利▶︎ ${S.cz.giantNoRole}回`]));
    t+=sec('ボーナス終了画面',BONUS_SCREENS.map(c=>`${c[1]}▶︎ ${pctText(S.ed[c[0]],bonusN)}`));
    t+=sec('AT終了画面',AT_SCREENS.map(c=>`${c[1]}▶︎ ${pctText(S.screens[c[0]],atN)}`));
    t+=sec('ED画面',ED_SCREENS.map(c=>`${c[1]}▶︎ ${pctText(S.coins[c[0]],edN)}`));
    t+=sec('獲得枚数',MEDALS.map(c=>`${c[1]}▶︎ ${S.over[c[0]]}回`));
    t+=sec('凪のセリフ',NAGI.map(c=>`${c[1]}▶︎ ${pctText(S.nagi[c[0]],nagiN)}`));
    t+=sec('バトル・引き戻し',[
      `オルフェ▶︎ ${pctText(S.atcz.orphe,sum(S.atcz))}`,
      `引き戻し▶︎ ${ratio(S.cz.loopHit,S.cz.loopEnter)}`,
      `報酬Ch▶︎ ${ratio(S.cz.rewardHit,S.cz.rewardReach)}`
    ]);
    t+=sec('CZ失敗ボイス',FAIL_VOICES.map(c=>`${c[1]}▶︎ ${pctText(S.icons[c[0]],voiceN)}`));
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t.trim();
  }

  function tplTextCompact(ctx){
    const S=ctx.S, czN=sum(S.zones), bonusN=sum(S.ed), atN=sum(S.screens), edN=sum(S.coins), nagiN=sum(S.nagi), voiceN=sum(S.icons);
    let t=`設定判別メモ｜Lタクトオーパス\n通常 ${S.games||0}G / AT${S.atCount}回 / ボーナス${S.cz.bonus}回\n`;
    t+=sec('CZムジカートチャンス',
      (czN>0?CZ_TYPES.filter(c=>S.zones[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.zones[c[0]],czN)}`):[])
      .concat(S.cz.giantNoRole>0?[`巨人 小役なし勝利▶︎ ${S.cz.giantNoRole}回`]:[])
    );
    t+=sec('ボーナス終了画面',bonusN>0?BONUS_SCREENS.filter(c=>S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.ed[c[0]],bonusN)}`):[]);
    t+=sec('AT終了画面',atN>0?AT_SCREENS.filter(c=>S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.screens[c[0]],atN)}`):[]);
    t+=sec('ED画面',edN>0?ED_SCREENS.filter(c=>S.coins[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.coins[c[0]],edN)}`):[]);
    t+=sec('獲得枚数',MEDALS.filter(c=>S.over[c[0]]>0).map(c=>`${c[1]}▶︎ ${S.over[c[0]]}回`));
    t+=sec('凪のセリフ',nagiN>0?NAGI.filter(c=>S.nagi[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.nagi[c[0]],nagiN)}`):[]);
    t+=sec('バトル・引き戻し',[
      sum(S.atcz)>0?`オルフェ▶︎ ${pctText(S.atcz.orphe,sum(S.atcz))}`:'',
      (S.cz.loopEnter||S.cz.loopHit)?`引き戻し▶︎ ${ratio(S.cz.loopHit,S.cz.loopEnter)}`:'',
      (S.cz.rewardReach||S.cz.rewardHit)?`報酬Ch▶︎ ${ratio(S.cz.rewardHit,S.cz.rewardReach)}`:''
    ].filter(Boolean));
    t+=sec('CZ失敗ボイス',voiceN>0?FAIL_VOICES.filter(c=>S.icons[c[0]]>0).map(c=>`${c[1]}▶︎ ${pctText(S.icons[c[0]],voiceN)}`):[]);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t.trim();
  }

  window.CheckerConfigs.taktop={
    nanaCollab:true,
    storageKey:'taktop-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','icons','screens','ed','coins','over','nagi'],
    sourceUrl:'https://chonborista.com/slot/amute/254099/',
    share:{
      title:'Lタクトオーパス 設定判別メモ',
      hashtags:'#タクトオーパス #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageCz(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplTextCompact,
    card:{
      title:'Lタクトオーパス',
      gameLabel:'通常',
      footerTags:'#タクトオーパス #設定判別',
      downloadName:'taktop_check.png',
      detailDownloadName:'taktop_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=S.games;
        return [
          ['AT確率',rate(g,S.atCount)],
          ['ボーナス',S.cz.bonus+'回'],
          ['報酬Ch',ratio(S.cz.rewardHit,S.cz.rewardReach)],
          ['オルフェループ',ratio(S.cz.loopHit,S.cz.loopEnter)]
        ];
      },
      chart:ctx=>({
        title:'ボーナス終了画面分布',
        x:135,
        step:140,
        width:70,
        items:BONUS_SCREENS.map(c=>({label:c[4],value:ctx.S.ed[c[0]]}))
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'極スタンプ',value:S.screens.stampKyoku},
          {tier:6,order:2,label:'⑥コンサート',value:S.ed.concert},
          {tier:6,order:3,label:'虹・運命ED',value:S.coins.rainbowDestiny},
          {tier:6,order:4,label:'666 OVER',value:S.over.m666},
          {tier:6,order:5,label:'凪「お肉〜」',value:S.nagi.meat},
          {tier:5,order:1,label:'優スタンプ',value:S.screens.stampYu},
          {tier:5,order:2,label:'⑤タクト＆運命バラ',value:S.ed.rose},
          {tier:5,order:3,label:'金・レニーED',value:S.coins.goldLeny},
          {tier:5,order:4,label:'555 OVER',value:S.over.m555},
          {tier:5,order:5,label:'凪「遊び尽くし」',value:S.nagi.play},
          {tier:4,order:1,label:'良スタンプ',value:S.screens.stampRyo},
          {tier:4,order:2,label:'④タクト＆運命連弾',value:S.ed.duet},
          {tier:4,order:3,label:'赤・アンナED',value:S.coins.redAnna},
          {tier:4,order:4,label:'444 OVER',value:S.over.m444},
          {tier:4,order:5,label:'凪「良い予感」',value:S.nagi.good},
          {tier:3,order:1,label:'吉スタンプ',value:S.screens.stampKichi},
          {tier:3,order:2,label:'緑・巨人ED',value:S.coins.greenGiant},
          {tier:3,order:3,label:'333 OVER',value:S.over.m333},
          {tier:3,order:4,label:'凪「不思議な気配」',value:S.nagi.strange},
          {tier:2,order:1,label:'可スタンプ',value:S.screens.stampKa},
          {tier:2,order:2,label:'③運命＆巨人',value:S.ed.destinyGiant},
          {tier:2,order:3,label:'緑・タクトED',value:S.coins.greenTakt},
          {tier:2,order:4,label:'222 OVER',value:S.over.m222},
          {tier:2,order:5,label:'凪「一味違う」',value:S.nagi.different}
        ];
        const strong=strongItems.reduce((a,b)=>a+b.value,0);
        const best=strongItems.filter(v=>v.value>0).sort((a,b)=>b.tier-a.tier||a.order-b.order)[0];
        const czN=sum(S.zones), battleN=sum(S.atcz);
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:[
              {text:best?`最強 ${best.label} ×${best.value}`:'濃厚示唆 なし',value:best?best.value:0,active:!!best},
              {text:`AT終了 ①${S.screens.girl}・②${S.screens.boy}`,value:S.screens.girl+S.screens.boy},
              {text:shown('バトル',[['地',S.atcz.hell],['天',S.atcz.heaven],['オ',S.atcz.orphe]]),value:battleN},
              {text:`小役なし勝利 ×${S.cz.giantNoRole}`,value:S.cz.giantNoRole},
              {text:`報酬Ch ${ratio(S.cz.rewardHit,S.cz.rewardReach)}`,value:S.cz.rewardHit,active:S.cz.rewardReach>0&&S.cz.rewardHit>0}
            ]},
            {x:560,items:[
              {text:`濃厚示唆 計${strong}回`,value:strong},
              {text:shown('CZ',[['巨',S.zones.giant],['運',S.zones.destiny],['シ',S.zones.chicago]]),value:czN},
              {text:shown('ED',[['青',S.coins.blue],['紫',S.coins.purple]]),value:S.coins.blue+S.coins.purple},
              {text:`凪 計${sum(S.nagi)}`,value:sum(S.nagi)},
              {text:`引き戻し ${ratio(S.cz.loopHit,S.cz.loopEnter)}`,value:S.cz.loopHit,active:S.cz.loopEnter>0&&S.cz.loopHit>0}
            ]}
          ]
        };
      }
    }
  };
})();

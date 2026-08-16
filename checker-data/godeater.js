(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const NORMAL_G=[
    ['g100','100G','規定G到達でAT当選',0,'100'],
    ['g200','200G','高設定ほど当選率が高い!?',1,'200'],
    ['g300','300G','規定G到達でAT当選',0,'300'],
    ['g450','450G','高設定ほど当選率が高い!?',1,'450'],
    ['g600','600G','規定G到達でAT当選',0,'600'],
    ['g750','750G','規定G到達でAT当選',0,'750'],
    ['tenjo','天井','1000G+α',0,'天井']
  ];
  const SHORT_G=[
    ['s100','100G','逆鱗ハンニバル敗北後は100G+α',0],
    ['s200','200G','設定変更後・漆黒後の短縮時に使用',0],
    ['s300','300G','設定変更後・漆黒後の短縮時に使用',0],
    ['s450','450G','設定変更後・漆黒後の短縮時に使用',0],
    ['s600','600G','設定変更後・漆黒後は天井600G+α',0]
  ];
  const VOICES=[
    ['kouta','コウタ「一緒にバガラリー〜」','デフォルト',0],
    ['alisa','アリサ「側面、後方ともに〜」','デフォルト',0],
    ['hibari','ヒバリ「私にもお役に〜」','偶数設定期待度UP（弱）',0],
    ['sakuya','サクヤ「私は〜しなくちゃね」','偶数設定期待度UP（強）',0],
    ['soma','ソーマ「思い出ってのは〜」','高設定期待度UP（弱）',0],
    ['ren','レン「あなたは〜殺せますか」','高設定期待度UP（強）',0],
    ['yu','ユウ「信じられる仲間が〜」','設定2・3否定',0],
    ['erina','エリナ「私大きくなったら〜」','設定2・4・6濃厚',1],
    ['lindow','リンドウ「いつでもお前の背中は〜」','設定2以上濃厚',1],
    ['shio','シオ「いただきま〜す」','設定5以上濃厚',1]
  ];
  const SCREENS=[
    ['default','デフォルト','デフォルト',0],
    ['alisa','アリサ','偶数設定期待度UP（弱）',0],
    ['kouta','コウタ','高設定期待度UP（弱）',0],
    ['soma','ソーマ','高設定期待度UP（強）',0],
    ['sakuya','サクヤ','偶数設定期待度UP（強）',0],
    ['yu','ユウ','設定2・3・4否定',0],
    ['lindow','リンドウ','設定3以上濃厚',1],
    ['shio','シオ','設定4以上濃厚',1],
    ['cafe','カフェ','設定2・4・6濃厚',1],
    ['all','全員集合','設定5以上濃厚',1],
    ['deforme','デフォルメ','設定6濃厚',1]
  ];
  const RENDA=[
    ['r44','+44枚','設定4以上濃厚',1],
    ['r55','+55枚','設定5以上濃厚',1],
    ['r66','+66枚','設定6濃厚',1]
  ];
  const PAYOUT=[
    ['p246','246枚','設定2・4・6濃厚',1],
    ['p456','456枚','設定4以上濃厚',1],
    ['p555','555枚','設定5以上濃厚',1],
    ['p666','666枚','設定6濃厚',1]
  ];
  const DEF={
    games:0,
    zones:Object.fromEntries(NORMAL_G.map(v=>[v[0],0])),
    triggers:Object.fromEntries(SHORT_G.map(v=>[v[0],0])),
    cz:{strong:0,strongHit:0,czAt:0,kamiochi:0,czTotal:0,chance:0,chanceCz:0},
    atcz:Object.fromEntries(VOICES.map(v=>[v[0],0])),
    screens:Object.fromEntries(SCREENS.map(v=>[v[0],0])),
    coins:Object.fromEntries(RENDA.map(v=>[v[0],0])),
    over:Object.fromEntries(PAYOUT.map(v=>[v[0],0])),
    ed:{timer6:0},
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:'-';}
  function pctLine(v,d){return d>0?`${v}回(${(100*v/d).toFixed(0)}%)`:`${v}回(-)`;}
  function section(title,lines){const a=lines.filter(Boolean);return a.length?`\n■${title}\n${a.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,a,b,hot){return {label,value:Number(a)||0,hot:!!hot,text:label+' '+(b>0?ratio(a,b):'-'),show:b>0};}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'-'}`;
  }
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}

  function atTotal(S){return sum(S.zones)+sum(S.triggers)+n(S.cz,'strongHit')+n(S.cz,'czAt');}
  function confirmItems(S){
    return [
      {tier:6,order:1,label:'デフォルメ画面',value:n(S.screens,'deforme'),best:true},
      {tier:6,order:2,label:'+66',value:n(S.coins,'r66'),best:true},
      {tier:6,order:3,label:'666枚',value:n(S.over,'p666'),best:true},
      {tier:6,order:4,label:'ユウタイマー6',value:n(S.ed,'timer6'),best:true},
      {tier:5,order:1,label:'全員集合',value:n(S.screens,'all'),best:true},
      {tier:5,order:2,label:'+55',value:n(S.coins,'r55'),best:true},
      {tier:5,order:3,label:'555枚',value:n(S.over,'p555'),best:true},
      {tier:5,order:4,label:'シオボイス',value:n(S.atcz,'shio'),best:true},
      {tier:4,order:1,label:'シオ画面',value:n(S.screens,'shio'),best:true},
      {tier:4,order:2,label:'+44',value:n(S.coins,'r44'),best:true},
      {tier:4,order:3,label:'456枚',value:n(S.over,'p456'),best:true},
      {tier:3,order:1,label:'リンドウ画面',value:n(S.screens,'lindow'),best:true},
      {tier:2,order:1,label:'リンドウボイス',value:n(S.atcz,'lindow'),best:true},
      {tier:2.46,order:1,label:'エリナボイス',value:n(S.atcz,'erina'),best:false},
      {tier:2.46,order:2,label:'カフェ画面',value:n(S.screens,'cafe'),best:false},
      {tier:2.46,order:3,label:'246枚',value:n(S.over,'p246'),best:false}
    ];
  }
  function bestStrong(S){
    const hit=confirmItems(S).filter(x=>x.best&&x.value>0).sort((a,b)=>(b.tier-a.tier)||(a.order-b.order))[0];
    return hit?`${hit.label}(${hit.tier===6?'6濃厚':hit.tier+'以上'}) ×${hit.value}`:'濃厚示唆 なし';
  }
  function confirmCount(S){return confirmItems(S).reduce((a,b)=>a+(Number(b.value)||0),0);}

  function pageHatsu(ctx){
    const S=ctx.S, normalN=sum(S.zones), shortN=sum(S.triggers);
    return `<section class="sec">
    <div class="sec-h">規定ゲーム数・通常<span class="sub">計${normalN}回</span></div>
    <div class="cgrid">${NORMAL_G.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,normalN))).join('')}</div>
    <div class="hint">規定G到達＝AT当選。CZ経由やレア役で先に当たった場合は、このセクションではなくCZ経由に記録します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">規定ゲーム数・短縮<span class="sub">計${shortN}回</span></div>
    <div class="cgrid">${SHORT_G.map(c=>ctx.crow('triggers.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,shortN))).join('')}</div>
    <div class="hint">設定変更後・漆黒の捕喰者後の天井短縮時に使用。逆鱗ハンニバル敗北後は100G+α。</div>
  </section>
  <section class="sec">
    <div class="sec-h">その他の契機<span class="sub">AT計${atTotal(S)}回</span></div>
    <div class="cgrid">
      ${ctx.crow('cz.strong','強チェリー成立','AT直撃の分母。変換強チェリーも同抽選',0)}
      ${ctx.crow('cz.strongHit','強チェリーからAT直撃','設1:0.4%⇔設6:5.9%・特大設定差',1,v=>ratio(v,S.cz.strong))}
      ${ctx.crow('cz.czAt','CZ経由 AT当選','アラガミ防衛戦・殲滅モード経由のAT',0)}
      ${ctx.crow('cz.kamiochi','神堕 突入','フリーズ／リザレクションゲート・リンドウ覚醒／ED後の一部',0)}
    </div>
  </section>`;
  }
  function pageCz(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">CZ</div>
    <div class="cgrid">
      ${ctx.crow('cz.czTotal','CZ当選（防衛戦＋殲滅モード）','設1:1/392.0⇔設6:1/310.6（高設定ほど優遇）',0)}
      ${ctx.crow('cz.chance','チャンス目 成立（通常時）','CZ当選率の分母。高確示唆ステージ中は除外推奨',0)}
      ${ctx.crow('cz.chanceCz','チャンス目からCZ当選','通常滞在時 設1:15.8%⇔設6:24.9%',1,v=>ratio(v,S.cz.chance))}
    </div>
    <div class="hint">内部高確中は全設定共通のため、高確示唆ステージ（カフェ・月の楽園・バカンス）中の成立は除外推奨です。</div>
  </section>`;
  }
  function pageShisa(ctx){
    const S=ctx.S, voiceN=sum(S.atcz), screenN=sum(S.screens), rendaN=sum(S.coins), payN=sum(S.over);
    return `<section class="sec"><div class="sec-h">ストーリー終了画面ボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${VOICES.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,voiceN))).join('')}</div>
    <div class="hint">ストーリー終了画面でサブ液晶タッチ。ED中レア役時のタッチでも同じセリフが出現します。</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${screenN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,screenN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">連打時の枚数表示</div>
    <div class="cgrid">${RENDA.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示</div>
    <div class="cgrid">${PAYOUT.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">ユウタイマー演出</div>
    <div class="cgrid">${ctx.crow('ed.timer6','タイマー「6」開始でAT非当選','設定6濃厚',1)}</div></section>`;
  }
  function tplText(ctx){
    const S=ctx.S, normalN=sum(S.zones), shortN=sum(S.triggers), voiceN=sum(S.atcz), screenN=sum(S.screens);
    let t=`設定判別メモ｜スマスロ ゴッドイーター\nAT計${atTotal(S)}回 / CZ${S.cz.czTotal}回\n_______\n`;
    t+=section('AT直撃',[S.cz.strong>0?`強チェリー直撃▶${ratio(S.cz.strongHit,S.cz.strong)}`:null]);
    t+='\n■規定ゲーム数・通常\n';
    NORMAL_G.forEach(c=>{t+=`${c[1]}▶${pctLine(n(S.zones,c[0]),normalN)}\n`;});
    t+='\n■規定ゲーム数・短縮\n';
    SHORT_G.forEach(c=>{t+=`${c[1]}▶${pctLine(n(S.triggers,c[0]),shortN)}\n`;});
    t+=section('セリフ',voiceN>0?VOICES.filter(c=>n(S.atcz,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.atcz,c[0]),voiceN)}`):[]);
    t+=section('終了画面',screenN>0?SCREENS.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.screens,c[0]),screenN)}`):[]);
    t+=section('神堕',[S.cz.kamiochi>0?`神堕▶${S.cz.kamiochi}回`:null]);
    t+=section('連打・獲得枚数',[
      ...RENDA.filter(c=>n(S.coins,c[0])>0).map(c=>`${c[1]}▶${n(S.coins,c[0])}回`),
      ...PAYOUT.filter(c=>n(S.over,c[0])>0).map(c=>`${c[1]}▶${n(S.over,c[0])}回`)
    ]);
    t+=section('ユウタイマー',[S.ed.timer6>0?`タイマー「6」開始でAT非当選▶${S.ed.timer6}回`:null]);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'規定ゲーム数・通常',items:detailItems(NORMAL_G,S.zones)},
      {title:'規定ゲーム数・短縮',items:detailItems(SHORT_G,S.triggers)},
      {title:'その他の契機',items:[
        detailItem('強チェリー成立',S.cz.strong,0),
        detailRatio('強チェリーからAT直撃',S.cz.strongHit,S.cz.strong,1),
        detailItem('CZ経由 AT当選',S.cz.czAt,0),
        detailItem('神堕 突入',S.cz.kamiochi,0)
      ]},
      {title:'CZ',items:[
        detailItem('CZ当選',S.cz.czTotal,0),
        detailItem('チャンス目 成立',S.cz.chance,0),
        detailRatio('チャンス目からCZ当選',S.cz.chanceCz,S.cz.chance,1)
      ]},
      {title:'ストーリー終了画面ボイス',items:detailItems(VOICES,S.atcz)},
      {title:'AT終了画面',items:detailItems(SCREENS,S.screens)},
      {title:'連打時の枚数表示',items:detailItems(RENDA,S.coins)},
      {title:'獲得枚数表示',items:detailItems(PAYOUT,S.over)},
      {title:'ユウタイマー演出',items:[detailItem('タイマー「6」開始でAT非当選',S.ed.timer6,1)]}
    ];
  }

  window.CheckerConfigs.godeater={
    nanaCollab:true,
    storageKey:'godeater-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','triggers','cz','atcz','screens','coins','over','ed'],
    sourceUrl:'https://chonborista.com/slot/yamasa-slot/211285/',
    share:{title:'スマスロ ゴッドイーター 設定判別メモ',hashtags:'#ゴッドイーター #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageCz(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'スマスロ ゴッドイーター',
      hideGames:true,
      titleFitMax:650,
      footerTags:'#ゴッドイーター #設定判別',
      downloadName:'godeater_check.png',
      detailDownloadName:'godeater_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['AT当選',`計${atTotal(S)}`],
          ['CZ',`計${S.cz.czTotal}`],
          ['強チェ直撃',ratio(S.cz.strongHit,S.cz.strong)],
          ['神堕',`×${S.cz.kamiochi}`]
        ];
      },
      chart:ctx=>({title:'規定G当選分布（通常）',x:82,step:135,width:64,items:NORMAL_G.map(c=>({label:c[4],value:n(ctx.S.zones,c[0])}))}),
      bottom:ctx=>{
        const S=ctx.S, count=confirmCount(S);
        return {
          title:'判別サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(bestStrong(S),count,count>0,'#ffc94d'),
              row(shown('終了画面',[['リ',n(S.screens,'lindow')],['シ',n(S.screens,'shio')],['全',n(S.screens,'all')],['デ',n(S.screens,'deforme')]]),n(S.screens,'lindow')+n(S.screens,'shio')+n(S.screens,'all')+n(S.screens,'deforme')),
              row(shown('否定',[['ユ声',n(S.atcz,'yu')],['ユ画',n(S.screens,'yu')]]),n(S.atcz,'yu')+n(S.screens,'yu')),
              row(shown('連打',[['44',n(S.coins,'r44')],['55',n(S.coins,'r55')],['66',n(S.coins,'r66')]]),sum(S.coins)),
              row('直撃 '+ratio(S.cz.strongHit,S.cz.strong),S.cz.strongHit,S.cz.strong>0)
            ]},
            {x:560,items:[
              row(`濃厚示唆 計${count}回`,count,count>0,'#ffc94d'),
              row(shown('ボイス',[['エ',n(S.atcz,'erina')],['リ',n(S.atcz,'lindow')],['シ',n(S.atcz,'shio')]]),n(S.atcz,'erina')+n(S.atcz,'lindow')+n(S.atcz,'shio')),
              row(`短縮G 計${sum(S.triggers)}`,sum(S.triggers)),
              row(shown('枚数',[['246',n(S.over,'p246')],['456',n(S.over,'p456')],['555',n(S.over,'p555')],['666',n(S.over,'p666')]]),sum(S.over)),
              row(`タイマー6 ×${S.ed.timer6}`,S.ed.timer6)
            ]}
          ]
        };
      }
    }
  };
})();

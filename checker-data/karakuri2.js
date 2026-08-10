(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const REWARDS=[
    ['dance','マリオネット演舞','運命盤の報酬',0],
    ['makuma','CZ幕間チャンス','運命盤の報酬',0],
    ['direct','AT直撃','規定6〜7回なら報酬AT直撃以上!?',1],
    ['god','機械仕掛けの神','上位報酬',1]
  ];
  const CZ_ILLUST=[
    ['narumi','鳴海','デフォルト',0],
    ['masaru','勝','通常B期待度UP',0],
    ['shirogane','しろがね','通常C期待度UP',0],
    ['pray','祈るフランシーヌ','通常D期待度UP',0],
    ['doll','フランシーヌ人形','通常D濃厚',1],
    ['smilef','笑顔のフランシーヌ','3回以内に通常D有り濃厚',0],
    ['angelina','アンジェリーナ','5回以内に通常D有り濃厚',0],
    ['lise','リーゼ','3回以内全て通常B以上濃厚',0],
    ['enemy4','敵4人','5回中2回以上天国濃厚',0],
    ['hand','手','3回以内に天国有り濃厚',0],
    ['guy','ギイ＆オリンピア','天国濃厚',1],
    ['clown','ピエロ','通常C or 天国濃厚',1],
    ['midnight','真夜中のサーカス','2回以内に天国有り濃厚',1],
    ['faceless','フェイスレス','5回中3回以上天国濃厚',0]
  ];
  const AT_SCREENS=[
    ['ele','エレオノール','デフォルト',0,'エレ'],
    ['ancient','最古の四人','奇数かつ高設定期待度UP',0,'四人'],
    ['lucille','ルシール＆アンジェリーナ','偶数かつ高設定期待度UP',0,'ルシ'],
    ['gear','歯車','設定2以上濃厚',1,'歯'],
    ['narukatsu','鳴海＆勝','設定4以上濃厚',1,'鳴勝'],
    ['smile','エレオノール（笑顔）','設定6濃厚',1,'笑']
  ];
  const VOICES=[
    ['def','私の名前はしろがね','デフォルト',0],
    ['neg2','人生はそういうものだよ','設定2否定',0],
    ['neg3','何を恐れることがある','設定3否定',0],
    ['neg4','俺をしろがねと呼びな','設定4否定',0],
    ['neg5','僕は僕さ','設定5否定',0],
    ['water3','近づいてきているようです','スイカ規定 残り3回以下',0],
    ['water1','すぐそばまで来ているようです','スイカ規定 残り1回',0],
    ['nextmakuma','何かを感じます','次回運命盤 幕間チャンス以上',0],
    ['stock','あるるかんがある限り〜','SHOW TIMEストック（復活）',0],
    ['nextdirect','女神が留守のようです','次回運命盤 AT直撃以上',1],
    ['fate','あなたの運命が変わるかも〜','次回運命盤 AT＋上位AT-CZ',1]
  ];
  const JUDGES=[
    ['min','ミンシア','奇数設定期待度UP',0],
    ['lise','リーゼロッテ','偶数設定期待度UP',0],
    ['vil','ヴィルマ','奇数かつ高設定期待度UP',0],
    ['geo','ジョージ','偶数かつ高設定期待度UP',0]
  ];
  const LAMPS=[
    ['white','白','デフォルト',0],
    ['blue','青','奇数UP',0],
    ['yellow','黄','偶数UP',0],
    ['green','緑','高設定UP',0],
    ['red','赤','設定2以上期待度UP',0],
    ['purple','紫','設定4以上濃厚',1],
    ['rainbow','虹','設定6濃厚',1]
  ];
  const OVER=[
    ['o222','222枚OVER','設定2以上濃厚',1],
    ['o246','246枚OVER','設定2・4・6濃厚',1],
    ['o456','456枚OVER','設定4以上濃厚',1],
    ['o666','666枚OVER','設定6濃厚',1],
    ['olympia20','オリンピア＋20','設定2以上濃厚',1],
    ['olympia4','オリンピア＋4','設定4以上濃厚',1],
    ['olympia6','オリンピア＋6','設定6濃厚',1]
  ];
  const STAGES=[
    ['narumi','鳴海ステージ','奇数設定期待度UP',0],
    ['masaru','勝ステージ','偶数設定期待度UP',0]
  ];
  const DEF={
    games:0,
    zones:Object.fromEntries(REWARDS.map(v=>[v[0],0])),
    cz:{rg:0,theater:0,strong:0,strongHit:0},
    atcz:Object.fromEntries(VOICES.map(v=>[v[0],0])),
    choku:0,
    atCount:0,
    screens:Object.fromEntries(AT_SCREENS.map(v=>[v[0],0])),
    ed:Object.fromEntries(JUDGES.map(v=>[v[0],0])),
    icons:Object.fromEntries(CZ_ILLUST.map(v=>[v[0],0])),
    coins:Object.fromEntries(LAMPS.map(v=>[v[0],0])),
    over:Object.fromEntries(OVER.map(v=>[v[0],0])),
    stages:Object.fromEntries(STAGES.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function pctLine(n,d){return d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;}
  function ratio(n,d){return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:'—';}

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
      ${ctx.crow('cz.rg','CZ当選','設1:1/342⇔設6:1/318・設1〜4はほぼ差なし',0)}
      ${ctx.crow('atCount','AT当選','設1:1/519⇔設6:1/410・1/460を切れば設4以上の目安',1)}
      ${ctx.crow('choku','AT直撃','通常時の直撃は強材料',1)}
    </div>
    <div class="hint">CZ・AT初当りが判別の主軸。CZ間天井は液晶1200G/実890G、AT間2500G。</div>
  </section>`;
  }
  function pageFate(ctx){
    const rewardN=sum(ctx.S.zones);
    return `<section class="sec">
    <div class="sec-h">運命盤の報酬<span class="sub">計${rewardN}回</span></div>
    <div class="cgrid">${REWARDS.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,rewardN))).join('')}</div>
    <div class="hint">スイカ規定回数（最大7回・平均2.4回）到達で突入する運命盤の報酬内訳。規定6〜7回なら報酬AT直撃以上!?</div>
  </section>
  <section class="sec">
    <div class="sec-h">CZ・設定差項目</div>
    <div class="cgrid">
      ${ctx.crow('cz.theater','劇場ジャッジ突入','CZ当選時の一部・成功で激情1クリア済みATスタート',0)}
      ${ctx.crow('cz.strong','強チェリー成立','分母用。高確示唆中は除外推奨',0)}
      ${ctx.crow('cz.strongHit','強チェリーから直撃当選','通常滞在時 設1:9.8%⇔設6:16.4%。高確中は25%共通',1,n=>ctx.pct(n,ctx.S.cz.strong))}
    </div>
  </section>`;
  }
  function pageShisa(ctx){
    const czIllN=sum(ctx.S.icons), scN=sum(ctx.S.screens), voiceN=sum(ctx.S.atcz), judgeN=sum(ctx.S.ed), lampN=sum(ctx.S.coins), stageN=sum(ctx.S.stages);
    return `
  <section class="sec"><div class="sec-h">CZ終了画面イラスト<span class="sub">計${czIllN}回</span></div>
    <div class="cgrid">${CZ_ILLUST.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,czIllN))).join('')}</div>
    <div class="hint">女神・幕間（AT後含む）・運命の一劇の失敗時にPUSHで出現。数回先を対象にした示唆が多く、記憶では追えないためタップ記録が有効。</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${AT_SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,scN))).join('')}</div>
    <div class="hint">⚠ 終了画面はホール側がカスタム可能。出現傾向はホールのカスタム込みで判断。後乗せSHOW TIMEや幕間引き戻し時は複数回確認できサンプル増のチャンス。</div></section>
  <section class="sec"><div class="sec-h">AT終了画面タッチボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${VOICES.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,voiceN))).join('')}</div>
    <div class="hint">リール下の液晶タッチで発生。否定系4種は設定を直接絞り込める重要示唆（例：設2否定＋歯車なら設3以上）。必ず記録。</div></section>
  <section class="sec"><div class="sec-h">激情ジャッジ 1キャラ目<span class="sub">計${judgeN}回</span></div>
    <div class="cgrid">${JUDGES.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,judgeN))).join('')}</div>
    <div class="hint">キャラは4種のシナリオ管理。激情ジャッジ突入時の1キャラ目のみ記録（成功で進行するため2キャラ目以降は対象外）。</div></section>
  <section class="sec"><div class="sec-h">ED中のレア役ランプ<span class="sub">計${lampN}回</span></div>
    <div class="cgrid">${LAMPS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,lampN))).join('')}</div>
    <div class="hint">ED中レア役成立→次GのMAX BET時に上部ランプの色で示唆。</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示・踊れ！オリンピア</div>
    <div class="cgrid">${OVER.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">AT開始ステージ<span class="sub">計${stageN}回</span></div>
    <div class="cgrid">${STAGES.map(c=>ctx.crow('stages.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,stageN))).join('')}</div></section>`;
  }
  function tplText(ctx){
    let t=`設定判別メモ｜Lからくりサーカス2\n総回転数 ${ctx.S.games||0}G / CZ${ctx.S.cz.rg}回 / AT${ctx.S.atCount}回\n_______\n\n■運命盤・スイカ規定\n`;
    const rewardN=sum(ctx.S.zones);
    REWARDS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.zones[c[0]],rewardN)}\n`;});
    t+=`\n■CZ劇場ジャッジ・強チェ直撃\n劇場ジャッジ▶︎ ${ctx.S.cz.theater}回\n強チェ直撃▶︎ ${ctx.S.cz.strongHit}/${ctx.S.cz.strong} ${ctx.S.cz.strong?`${(100*ctx.S.cz.strongHit/ctx.S.cz.strong).toFixed(0)}%`:'—'}\n\n■AT開始ステージ\n`;
    const stageN=sum(ctx.S.stages);
    STAGES.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.stages[c[0]],stageN)}\n`;});
    t+=`\n■AT終了画面\n`;
    const scN=sum(ctx.S.screens);
    AT_SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.screens[c[0]],scN)}\n`;});
    t+=`\n■タッチボイス\n`;
    const voiceN=sum(ctx.S.atcz);
    VOICES.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.atcz[c[0]],voiceN)}\n`;});
    t+=`\n■激情ジャッジシナリオ\n`;
    const judgeN=sum(ctx.S.ed);
    JUDGES.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.ed[c[0]],judgeN)}\n`;});
    t+=`\n■EDランプ\n`;
    const lampN=sum(ctx.S.coins);
    LAMPS.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.coins[c[0]],lampN)}\n`;});
    t+=`\n■獲得枚数・オリンピア\n`;
    OVER.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.over[c[0]]}回\n`;});
    t+=`\n■CZ終了画面イラスト\n`;
    const czIllN=sum(ctx.S.icons);
    CZ_ILLUST.forEach(c=>{t+=`${c[1]}▶︎ ${pctLine(ctx.S.icons[c[0]],czIllN)}\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.karakuri2={
    nanaCollab:true,
    storageKey:'karakuri2-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins','over','stages'],
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/256699/',
    share:{
      title:'Lからくりサーカス2 設定判別メモ',
      hashtags:'#からくりサーカス2 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageFate(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    card:{
      title:'Lからくりサーカス2',
      footerTags:'#からくりサーカス2 #設定判別',
      downloadName:'karakuri2_check.png',
      blocks:ctx=>{
        const g0=ctx.S.games;
        const czP=ctx.S.cz.rg&&g0?'1/'+(g0/ctx.S.cz.rg).toFixed(1):'—';
        const atP=ctx.S.atCount&&g0?'1/'+(g0/ctx.S.atCount).toFixed(1):'—';
        return [['CZ確率',czP],['AT確率',atP],['AT直撃',ctx.S.choku+'回'],['強チェ直撃',ratio(ctx.S.cz.strongHit,ctx.S.cz.strong)]];
      },
      chart:ctx=>({
        title:'AT終了画面分布',
        x:110,
        step:145,
        width:72,
        items:AT_SCREENS.map(v=>({label:v[4],value:ctx.S.screens[v[0]]}))
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const strongItems=[
          {tier:6,order:1,label:'エレオノール笑顔(6濃厚)',value:S.screens.smile},
          {tier:6,order:2,label:'虹ランプ(6濃厚)',value:S.coins.rainbow},
          {tier:6,order:3,label:'666 OVER(6濃厚)',value:S.over.o666},
          {tier:6,order:4,label:'オリンピア+6(6濃厚)',value:S.over.olympia6},
          {tier:4,order:1,label:'鳴海＆勝(4以上)',value:S.screens.narukatsu},
          {tier:4,order:2,label:'紫ランプ(4以上)',value:S.coins.purple},
          {tier:4,order:3,label:'456 OVER(4以上)',value:S.over.o456},
          {tier:4,order:4,label:'オリンピア+4(4以上)',value:S.over.olympia4},
          {tier:2.46,order:1,label:'246 OVER(2・4・6)',value:S.over.o246},
          {tier:2,order:1,label:'歯車(2以上)',value:S.screens.gear},
          {tier:2,order:2,label:'222 OVER(2以上)',value:S.over.o222},
          {tier:2,order:3,label:'オリンピア+20(2以上)',value:S.over.olympia20}
        ];
        const strong=strongItems.reduce((a,b)=>a+b.value,0);
        const best=strongItems.filter(v=>v.value>0).sort((a,b)=>b.tier-a.tier||a.order-b.order)[0];
        const neg=S.atcz.neg2+S.atcz.neg3+S.atcz.neg4+S.atcz.neg5;
        const heaven=S.icons.enemy4+S.icons.hand+S.icons.guy+S.icons.clown+S.icons.midnight+S.icons.faceless;
        const dMode=S.icons.pray+S.icons.doll+S.icons.smilef+S.icons.angelina;
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              {text:best?`最強 ${best.label} ×${best.value}`:'濃厚示唆 なし',value:best?best.value:0,active:!!best},
              {text:`AT終了 歯${S.screens.gear}・鳴勝${S.screens.narukatsu}・笑${S.screens.smile}`,value:S.screens.gear+S.screens.narukatsu+S.screens.smile},
              {text:`シナリオ ミ${S.ed.min}・リ${S.ed.lise}・ヴ${S.ed.vil}・ジ${S.ed.geo}`,value:sum(S.ed)},
              {text:`EDランプ 紫${S.coins.purple}・虹${S.coins.rainbow}`,value:S.coins.purple+S.coins.rainbow},
              {text:`CZ絵 天国系${heaven}`,value:heaven}
            ]},
            {x:560,items:[
              {text:`濃厚示唆 計${strong}回`,value:strong},
              {text:`否定 ②${S.atcz.neg2}・③${S.atcz.neg3}・④${S.atcz.neg4}・⑤${S.atcz.neg5}`,value:neg},
              {text:`開始 鳴${S.stages.narumi}・勝${S.stages.masaru}`,value:sum(S.stages)},
              {text:`枚数 246${S.over.o246}・456${S.over.o456}・666${S.over.o666}`,value:S.over.o246+S.over.o456+S.over.o666},
              {text:`CZ絵 D系${dMode}`,value:dMode}
            ]}
          ]
        };
      }
    }
  };
})();

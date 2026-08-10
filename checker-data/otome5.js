(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const RYORAN=[
    ['c1e','①焔舞','通常前兆',0,'①'],
    ['c1s','①紫炎','上位前兆',1,'①'],
    ['c2e','②焔舞','通常前兆',0,'②'],
    ['c2s','②紫炎','上位前兆',1,'②'],
    ['c3e','③焔舞','通常前兆',0,'③'],
    ['c3s','③紫炎','上位前兆',1,'③'],
    ['c4e','④焔舞','通常前兆',0,'④'],
    ['c4s','④紫炎','上位前兆',1,'④'],
    ['c5e','⑤焔舞','通常前兆',0,'⑤'],
    ['c5s','⑤紫炎','上位前兆',1,'⑤'],
    ['c6e','⑥焔舞','通常前兆',0,'⑥'],
    ['c6s','⑥紫炎','上位前兆',1,'⑥']
  ];
  const STRAPS=[
    ['goemon','ゴエモン','周期最大200G／設定差あり（出るほど良）',1],
    ['nobunaga','ノブナガ','強カワ獲得率UP／設定差あり（出るほど良）',1],
    ['hideyoshi','ヒデヨシ','テーブルB以上滞在／設定差あり（出るほど良）',1],
    ['kansuke','カンスケ','乙女アタック当選率UP',0],
    ['mitsuhide','ミツヒデ','本能寺ストックありでAT開始',0],
    ['yoshiteru','ヨシテル','AT当選で剣聖チャンス or 上位AT',0]
  ];
  const BONUS=[
    ['a','スタンプ無しA','ノブナガ・ゴエモン（示唆調査中）',0],
    ['b','スタンプ無しB','カンスケ・イエヤス・ヨシテル（示唆調査中）',0],
    ['c','スタンプ無しC','西国 ソウリン・ドウセツ（示唆調査中）',0],
    ['ka','可スタンプ','設定2以上濃厚',1],
    ['kichi','吉スタンプ','設定3以上濃厚',1],
    ['ryo','良スタンプ','設定4以上濃厚',1],
    ['yu','優スタンプ','設定5以上濃厚',1],
    ['goku','極スタンプ','設定6濃厚',1]
  ];
  const SCREENS=[
    ['nobu','ノブナガ','デフォルト',0],
    ['two','乙女2人','テーブルB以上のチャンス',0],
    ['three','乙女3人','テーブルB以上＋1周期目100G以内のチャンス',0],
    ['enemy','敵集合','ストラップモード：ヨシテル濃厚（激アツ）',1],
    ['four','乙女4人','テーブルB以上濃厚（テーブルAなら設定4以上濃厚）',1],
    ['allA','乙女集合A','天国濃厚（天国否定で設定4以上濃厚）',1],
    ['allB','乙女集合B','天国濃厚＋設定2以上濃厚',1]
  ];
  const MEDALS=[
    ['m222','222枚OVER','設定2以上濃厚',1],
    ['m333','333枚OVER','設定3以上濃厚',1],
    ['m444','444枚OVER','設定4以上濃厚',1],
    ['m555','555枚OVER','設定5以上濃厚',1],
    ['m666','666枚OVER','設定6濃厚',1]
  ];
  const VOICES=[
    ['v1','なんとかなるっしょ！','デフォルト',0],
    ['v2','感謝、感謝！','奇数示唆',0],
    ['v3','怪しい…！','偶数示唆',0],
    ['v4','どーよ？あたしも中々いけてるっしょ','高設定弱',0],
    ['v5','きゅい〜ん♪','高設定強',0],
    ['v6','さんきゅ〜！','設定2以上濃厚',1],
    ['v7','ご機嫌っしょ！','設定3以上濃厚',1],
    ['v8','攻めどきっしょ！','設定4以上濃厚',1],
    ['v9','気分アゲアゲだし！','設定5以上濃厚',1],
    ['v10','戦乱に忍ぶ深紅の影、石川ゴエモン！','設定6濃厚',1],
    ['v11','なになに、気になるー？','設定2否定',0],
    ['v12','ちょ〜っとホンキ出しちゃおっかな？','設定3否定',0]
  ];
  const AT_TH=[359.5,350.8,332.5,302.8,281.0,262.9];
  const DEF={
    games:0,
    zones:Object.fromEntries(RYORAN.map(c=>[c[0],0])),
    cz:{miko:0,attack:0},
    atcz:{},
    choku:0,
    atCount:0,
    screens:Object.fromEntries(SCREENS.map(s=>[s[0],0])),
    ed:Object.fromEntries(VOICES.map(v=>[v[0],0])),
    icons:Object.fromEntries(STRAPS.map(s=>[s[0],0])),
    coins:Object.fromEntries(BONUS.map(b=>[b[0],0])),
    attack:Object.fromEntries(MEDALS.map(m=>[m[0],0])),
    over:{haru:0},
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj).reduce((a,b)=>a+b,0);}
  function p(n,d){return d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;}
  function shienTotal(S){return ['c1s','c2s','c3s','c4s','c5s','c6s'].reduce((a,k)=>a+S.zones[k],0);}
  function ryoranTotal(S){return sum(S.zones);}
  function cycleTotal(S,n){return S.zones[`c${n}e`]+S.zones[`c${n}s`];}

  function pageRyoran(ctx){
    const total=ryoranTotal(ctx.S);
    return `<style>
    .ryoran-grid .crow{padding:8px 6px;gap:5px}
    .ryoran-grid .crow .lbl .mn{display:none}
    .ryoran-grid .crow:has(.mn.hot){border-color:rgba(255,201,77,.38)}
    .ryoran-grid .crow:has(.mn.hot) .nm{color:var(--gold)}
    .ryoran-grid .crow .num{min-width:24px}
    .ryoran-grid .crow .pct{min-width:42px;font-size:10px}
    .ryoran-grid .crow .plus{width:30px;height:30px}
  </style>
  <section class="sec">
    <div class="sec-h">繚乱の刻<span class="sub">分母＝繚乱の刻 計${total}回</span></div>
    <div class="cgrid two ryoran-grid">
      ${RYORAN.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,total))).join('')}
    </div>
    <div class="hint">紫炎は期待度61%超の上位前兆。3周期目以降の紫炎突入率に設定差あり（テンプレの周期別記録がそのまま判別材料になります）。1・2周期目は紫炎が選ばれやすい仕様です。</div>
  </section>`;
  }
  function pageHatsu(ctx){
    const g=ctx.S.games, atP=ctx.S.atCount>0&&g>0?g/ctx.S.atCount:0;
    const rows=[1,2,3,4,5,6].map(i=>{
      const near=(atP>0&&Math.abs(AT_TH[i-1]-atP)===Math.min(...AT_TH.map(t=>Math.abs(t-atP))));
      return `<tr class="${near?'near':''}"><td>設定${i}</td><td>1/${AT_TH[i-1]}</td></tr>`;
    }).join('');
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('atCount','AT当選','強カワRUSH突入',0)}
      ${ctx.crow('choku','ボーナス直撃','設1:1/21207⇔設6:1/5503・約4倍の設定差',1)}
      ${ctx.crow('cz.miko','巫女pt 0到達','乙女アタック抽選の分母',0)}
      ${ctx.crow('cz.attack','乙女アタック当選','当選率に設定差 設1:20.3%⇔設6:25.7%',1,n=>ctx.pct(n,ctx.S.cz.miko))}
    </div>
    <div class="hint">⚠ 乙女アタックのカウントは、乙女ストラップモード「カンスケ」滞在時とリールロック2段階経由を除外して記録（解析の分母定義に合わせるため）。</div>
  </section>
  <section class="sec">
    <div class="sec-h">実践値 vs 理論値</div>
    <table class="ptable">
      <tr class="me"><td>実践値</td><td>${atP?'1/'+atP.toFixed(1):'—'}</td></tr>
      <tr><th></th><th>AT確率</th></tr>
      ${rows}
    </table>
  </section>`;
  }
  function pageShisa(ctx){
    const strapN=sum(ctx.S.icons), bonusN=sum(ctx.S.coins), screenN=sum(ctx.S.screens), voiceN=sum(ctx.S.ed);
    return `
  <section class="sec"><div class="sec-h">乙女ストラップ<span class="sub">計${strapN}回</span></div>
    <div class="cgrid">${STRAPS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,strapN))).join('')}</div>
    <div class="hint">同キャラ2体で期待度UP、3体で期待大。ここでは3体表示 or 2体表示を確認した時に該当キャラをカウント。</div></section>
  <section class="sec"><div class="sec-h">ボーナス終了画面<span class="sub">計${bonusN}回</span></div>
    <div class="cgrid">${BONUS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,bonusN))).join('')}</div>
    <div class="hint">⚠ スタンプカスタマイズ搭載機。時間管理（デフォルト8/12/17/20時）でホール側が出すスタンプまで設定可能。出現時刻とホールのカスタム傾向を必ず考慮。</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${screenN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,screenN))).join('')}</div>
    <div class="hint">モード示唆と設定示唆の複合。「乙女4人でその後6周期天井」「集合Aで天国否定」は高設定の強材料。</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示</div>
    <div class="cgrid">${MEDALS.map(c=>ctx.crow('attack.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">ED中のゴエモンボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${VOICES.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,voiceN))).join('')}</div>
    <div class="hint">EDでレア役成立時に発生。否定系ボイスも判別上重要なので必ず記録。</div></section>
  <section class="sec"><div class="sec-h">ハルルナPUSH</div>
    <div class="cgrid">${ctx.crow('over.haru','ハルルナPUSH','出現で設定4以上濃厚（推測段階）',1)}</div></section>`;
  }
  function tplText(ctx){
    const strapN=sum(ctx.S.icons), bonusN=sum(ctx.S.coins), screenN=sum(ctx.S.screens), voiceN=sum(ctx.S.ed);
    let t=`設定判別メモ｜L戦国乙女5\n総回転数 ${ctx.S.games||0}G / AT${ctx.S.atCount}回 / 直撃${ctx.S.choku}回\n_______\n\n■繚乱の刻\n`;
    ['①','②','③','④','⑤','⑥'].forEach((mark,idx)=>{
      const i=idx+1;
      t+=`${mark}周期▶焔舞${ctx.S.zones[`c${i}e`]}回・紫炎${ctx.S.zones[`c${i}s`]}回\n`;
    });
    t+=`\n■乙女ストラップモード\n`;
    STRAPS.forEach(c=>{t+=`${c[1]}▶ ${ctx.S.icons[c[0]]}回\n`;});
    t+=`\n■ボーナス終了画面\n`;
    t+=`スタンプ無しA▶ ${ctx.S.coins.a}回\nスタンプ無しB▶ ${ctx.S.coins.b}回\nスタンプ無しC▶ ${ctx.S.coins.c}回\n`;
    t+=`可▶ ${ctx.S.coins.ka}回・吉▶ ${ctx.S.coins.kichi}回\n良▶ ${ctx.S.coins.ryo}回・優▶ ${ctx.S.coins.yu}回・極▶ ${ctx.S.coins.goku}回\n`;
    t+=`\n■AT終了画面\n`;
    SCREENS.forEach(c=>{t+=`${c[1]}▶ ${p(ctx.S.screens[c[0]],screenN)}\n`;});
    t+=`\n■獲得枚数\n222▶ ${ctx.S.attack.m222}回・333▶ ${ctx.S.attack.m333}回・444▶ ${ctx.S.attack.m444}回・555▶ ${ctx.S.attack.m555}回・666▶ ${ctx.S.attack.m666}回\n`;
    t+=`\n■EDゴエモンボイス\n`;
    VOICES.forEach(c=>{t+=`${c[1]}▶ ${p(ctx.S.ed[c[0]],voiceN)}\n`;});
    t+=`\n■ハルルナPUSH▶ ${ctx.S.over.haru}回\n`;
    t+=`\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.otome5={
    nanaCollab:true,
    storageKey:'otome5-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins','attack','over'],
    sourceUrl:'https://chonborista.com/slot/orinpia-slot/256147/',
    share:{
      title:'L戦国乙女5 設定判別メモ',
      hashtags:'#L戦国乙女5 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageRyoran(ctx),
      ()=>pageHatsu(ctx),
      ()=>pageShisa(ctx),
      pageCard
    ],
    template:tplText,
    card:{
      title:'L戦国乙女5',
      footerTags:'#L戦国乙女5 #設定判別',
      downloadName:'otome5_check.png',
      blocks:ctx=>{
        const g0=ctx.S.games;
        const atP=ctx.S.atCount&&g0?'1/'+(g0/ctx.S.atCount).toFixed(1):'—';
        const attackR=ctx.S.cz.miko?`${ctx.S.cz.attack}/${ctx.S.cz.miko} ${(100*ctx.S.cz.attack/ctx.S.cz.miko).toFixed(0)}%`:'—';
        const total=ryoranTotal(ctx.S), shien=shienTotal(ctx.S);
        const shienR=total?`${shien}/${total} ${(100*shien/total).toFixed(0)}%`:'—';
        return [['AT確率',atP],['直撃',ctx.S.choku+'回'],['乙女アタック',attackR],['紫炎',shienR]];
      },
      chart:ctx=>({
        title:'繚乱の刻・周期分布',
        x:110,
        step:145,
        width:72,
        items:[1,2,3,4,5,6].map(n=>({label:String(n),value:cycleTotal(ctx.S,n)}))
      }),
      bottom:ctx=>{
        const strong=ctx.S.coins.ka+ctx.S.coins.kichi+ctx.S.coins.ryo+ctx.S.coins.yu+ctx.S.coins.goku+sum(ctx.S.attack);
        return {
          title:`濃厚示唆（計${strong}回）`,
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:[
              {label:'可スタンプ',value:ctx.S.coins.ka},
              {label:'吉スタンプ',value:ctx.S.coins.kichi},
              {label:'良スタンプ',value:ctx.S.coins.ryo},
              {label:'優スタンプ',value:ctx.S.coins.yu},
              {label:'極スタンプ',value:ctx.S.coins.goku}
            ]},
            {x:560,items:[
              {label:'222 OVER',value:ctx.S.attack.m222},
              {label:'333 OVER',value:ctx.S.attack.m333},
              {label:'444 OVER',value:ctx.S.attack.m444},
              {label:'555 OVER',value:ctx.S.attack.m555},
              {label:'666 OVER',value:ctx.S.attack.m666}
            ]}
          ]
        };
      }
    }
  };
})();

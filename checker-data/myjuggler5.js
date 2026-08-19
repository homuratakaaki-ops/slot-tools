(function(){
  'use strict';

  window.CheckerConfigs=window.CheckerConfigs||{};

  const BONUS=[
    ['soloBig','単独BIG','設1:1/409.6⇔設6:1/341.3',0,'単BB','目安 1/409.6⇔1/341.3'],
    ['cherryBig','チェリー重複BIG','設1:1/1213.6⇔設6:1/1024.0',0,'チェBB','目安 1/1213.6⇔1/1024.0'],
    ['soloReg','単独REG','設1:1/655.4⇔設6:1/327.7・約2倍差の判別主軸',1,'単RB','目安 1/655.4⇔1/327.7'],
    ['cherryReg','チェリー重複REG','設1:1/1092.3⇔設6:1/762.0・高設定ほど優遇',1,'チェRB','目安 1/1092.3⇔1/762.0']
  ];
  const ROLES=[
    ['grape','ぶどう','設1:1/5.90⇔設6:1/5.66（北電子公式値）',1,'ぶどう','目安 1/5.90⇔1/5.66'],
    ['soloCherry','単独チェリー（非重複）','設定差あり（補助材料）',0,'単チェ','目安 設定差あり']
  ];
  const DEF={
    games:0,
    zones:Object.fromEntries(BONUS.map(c=>[c[0],0])),
    icons:Object.fromEntries(ROLES.map(c=>[c[0],0])),
    cz:{gakkun:0},
    atcz:{},screens:{},ed:{},coins:{},over:{},
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function count(obj,key){return Number((obj||{})[key])||0;}
  function rate(g,n){return g>0&&n>0?'1/'+(g/n).toFixed(1):'−';}
  function lineRate(label,n,g){return `${label}▶${n}回 ${rate(g,n)}`;}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function statText(title,value,range,color){
    return {label:title,value:value>0?value:0,active:value>0,text:`${title} ${value}`,color:color};
  }
  function rangeText(text){
    return {label:text,value:0,active:false,text:text,color:'#8b8494'};
  }
  function showText(label,n,g,force){
    if(!force&&n<=0)return null;
    return lineRate(label,n,g);
  }
  function section(title,lines){
    const clean=lines.filter(Boolean);
    return clean.length?`\n■${title}\n${clean.join('\n')}\n`:'';
  }

  function pageBonus(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>総回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">台データの総スタート回数を入力（BB/RB中は含まれません）</div>
  </section>
  <section class="sec">
    <div class="sec-h">ボーナス契機</div>
    <div class="cgrid">
      ${BONUS.map(c=>ctx.crow('zones.'+c[0],c[1],c[2],c[3],n=>rate(g,n))).join('')}
    </div>
    <div class="hint">BB合算・RB合算・総合算はカードで自動計算（合算目安 BB:1/273.1⇔1/229.1／RB:1/409.6⇔1/229.1／総:1/163.8⇔1/114.6）。中段チェリー・単チェリーはボーナス濃厚（成立時は契機に応じ上記4種でカウント）</div>
  </section>`;
  }

  function pageRoles(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">小役</div>
    <div class="cgrid">
      ${ROLES.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>rate(g,n))).join('')}
    </div>
    <div class="hint">ぶどうは分母が大きいほど信頼度UP。2000G未満での判断は禁物</div>
  </section>
  <section class="sec">
    <div class="sec-h">朝一チェック</div>
    <div class="cgrid">
      ${ctx.crow('cz.gakkun','ガックンチェック（朝一1G目）','設定変更示唆。据え置き・対策店では無効',0)}
    </div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games;
    const bb=count(S.zones,'soloBig')+count(S.zones,'cherryBig');
    const rb=count(S.zones,'soloReg')+count(S.zones,'cherryReg');
    const total=bb+rb;
    const force=g>0;
    let t=`設定判別メモ｜SマイジャグラーV\n通常 ${g||0}G / BB${bb}回 / RB${rb}回\n_______\n`;
    t+=section('ボーナス',[
      showText('単独BIG',count(S.zones,'soloBig'),g,force),
      showText('チェリー重複BIG',count(S.zones,'cherryBig'),g,force),
      showText('単独REG',count(S.zones,'soloReg'),g,force),
      showText('チェリー重複REG',count(S.zones,'cherryReg'),g,force),
      g>0||bb>0?`BB合算▶${bb}回 ${rate(g,bb)}`:null,
      g>0||rb>0?`RB合算▶${rb}回 ${rate(g,rb)}`:null,
      g>0||total>0?`総合算▶${total}回 ${rate(g,total)}`:null
    ]);
    t+=section('小役',[
      showText('ぶどう',count(S.icons,'grape'),g,force),
      showText('単独チェリー（非重複）',count(S.icons,'soloCherry'),g,false)
    ]);
    t+=section('ガックン',[S.cz.gakkun>0?`ガックンチェック▶${S.cz.gakkun}回`:null]);
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様／契機別・小役:北電子公式アプリ公表値`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'ボーナス契機',items:detailItems(BONUS,S.zones)},
      {title:'小役',items:detailItems(ROLES,S.icons)},
      {title:'朝一チェック',items:[detailItem('ガックンチェック',S.cz.gakkun,0)]}
    ];
  }

  window.CheckerConfigs.myjuggler5={
    nanaCollab:false,
    storageKey:'myjuggler5-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','icons','cz','atcz','screens','ed','coins','over'],
    sourceUrl:'https://chonborista.com/slot/kitadenshi/152973/',
    sourceCreditHtml:'<div class="credit">出典：ボーナス確率＝ちょんぼりすた パチスロ解析様／契機別・小役＝北電子公式アプリ公表値<br>ボーナス確率の詳細は <a href="https://chonborista.com/slot/kitadenshi/152973/" target="_blank" rel="noopener">ちょんぼりすた様の解析ページ</a> をご覧ください。</div>',
    share:{title:'SマイジャグラーV 設定判別メモ',hashtags:'#マイジャグラーV #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageBonus(ctx),
      ()=>pageRoles(ctx),
      pageCard
    ],
    cardPageIndex:2,
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'SマイジャグラーV',
      gameLabel:'通常',
      footerTags:'#マイジャグラーV #設定判別',
      downloadName:'myjuggler5_check.png',
      detailDownloadName:'myjuggler5_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=S.games;
        const bb=count(S.zones,'soloBig')+count(S.zones,'cherryBig');
        const rb=count(S.zones,'soloReg')+count(S.zones,'cherryReg');
        return [
          ['BB合算',rate(g,bb)],
          ['RB合算',rate(g,rb)],
          ['総合算',rate(g,bb+rb)],
          ['ぶどう',rate(g,count(S.icons,'grape'))]
        ];
      },
      chart:ctx=>({title:'ボーナス内訳',x:185,step:180,width:82,items:BONUS.map(c=>({label:c[4],value:count(ctx.S.zones,c[0])}))}),
      bottom:ctx=>{
        const S=ctx.S,g=S.games;
        const rows=[
          ['単独RB',rate(g,count(S.zones,'soloReg')),count(S.zones,'soloReg'),BONUS[2][5],'#ffc94d'],
          ['チェ重RB',rate(g,count(S.zones,'cherryReg')),count(S.zones,'cherryReg'),BONUS[3][5],'#f2eef5'],
          ['単独BB',rate(g,count(S.zones,'soloBig')),count(S.zones,'soloBig'),BONUS[0][5],'#f2eef5'],
          ['チェ重BB',rate(g,count(S.zones,'cherryBig')),count(S.zones,'cherryBig'),BONUS[1][5],'#f2eef5'],
          ['ぶどう',rate(g,count(S.icons,'grape')),count(S.icons,'grape'),ROLES[0][5],'#f2eef5']
        ];
        return {
          title:'実測 vs 目安レンジ',
          startY:760,
          rowGap:44,
          fontSize:24,
          columns:[
            {x:70,items:rows.map(r=>statText(r[0],r[2],r[3],r[4])).map((item,i)=>Object.assign(item,{text:`${rows[i][0]} ${rows[i][1]}`}))},
            {x:560,items:rows.map(r=>rangeText(r[3]))}
          ]
        };
      }
    }
  };
})();

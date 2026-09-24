(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  // 設定示唆の行定義。[id, UI表示名, サブラベル, rank, カード略号, 確定演出の段位表記(任意)]
  // rank>0 は確定演出（集計・グラフ・カードのサマリーに乗る）。rank0 は示唆のみ。
  // 出典: ちょんぼりすた様 https://chonborista.com/slot/net-slot/263515/（2026-09-25 再取得）

  // AT終了画面。終了のたびに必ずいずれか1種が出る＝§9-90 の割合表示の対象。
  // モグ玄・騎乗モグ玄は「SPモードへ移行したか」で示唆が変わる条件付き。
  // AT後の挙動まで確認してSPモード非移行だった場合にだけ設定の確定になるため、
  // サマリーの段位表記に「SP非移行時」を添える（第6要素）。
  const AT_END=[
    ['kerai','家来','奇数設定示唆',0,'家'],
    ['taihou','大砲家来','偶数設定示唆',0,'砲'],
    ['ninmogu','忍モグ＆くモ一','高設定示唆(弱)',0,'忍'],
    ['hime','モグ姫','高設定示唆(弱)',0,'姫'],
    ['gen','モグ玄','SPモード1つ以上 or 設定2以上確定演出',2,'玄','2以上・SP非移行時'],
    ['kijou','騎乗モグ玄','SPモード2つ以上 or 設定3以上確定演出',3,'騎','3以上・SP非移行時'],
    ['teitoku','モグー提督','設定4以上確定演出',4,'提'],
    ['zenin','全員集合','設定6確定演出',6,'全'],
    // 出典の一覧は上の8種。どれにも当てはまらない画面が出たときの受け皿を置き、
    // 割合の分母を閉じる（出典に無い画面を作らないため、示唆は付けない）。
    ['other','その他（上記以外）','示唆不明（出典の一覧は上の8種）',0,'他']
  ];
  // くまトロフィー。AT終了画面・エンディング終了画面に出現。出現有無型なので割合は出さない。
  const TROPHY=[
    ['bronze','銅トロフィー','設定2以上確定演出',2,'銅'],
    ['silver','銀トロフィー','設定3以上確定演出',3,'銀'],
    ['gold','金トロフィー','設定4以上確定演出',4,'金'],
    ['kuma','熊柄トロフィー','設定5以上確定演出',5,'熊'],
    ['rainbow','虹トロフィー','設定6確定演出',6,'虹']
  ];

  const DEF={
    games:0,
    counts:{cz:0,at:0,direct:0},
    screens:Object.fromEntries(AT_END.map(v=>[v[0],0])),
    trophy:Object.fromEntries(TROPHY.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function n(obj,key){return Number((obj||{})[key])||0;}
  function total(arr,state){return arr.reduce((a,c)=>a+n(state,c[0]),0);}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){
    const out=lines.filter(Boolean);
    return out.length?`\n■${title}\n${out.join('\n')}\n`:'';
  }
  function detailItem(label,value,hot){
    return {label,value:Number(value)||0,hot:!!hot};
  }
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],n(state,c[0]),c[3]>0));}
  function row(text,value,active,color){
    return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};
  }
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}

  // 確定演出の段位表記。第6要素があればそれを使い、無ければサブラベル（＝出典の示唆内容）から
  // 導く。値の出典を1つにする（§9-84）。「設定4以上確定演出」→「4以上」／「設定6確定演出」→「6確定」
  function tierText(c){
    if(c[5])return c[5];
    const m=String(c[2]||'').match(/設定([0-9]+(?:・[0-9]+)*)(以上)?確定演出/);
    if(!m)return '';
    return m[2]?m[1]+'以上':(m[1]==='6'?'6確定':m[1]);
  }
  // 確定演出の一覧。order は同じ rank が並んだときの優先順（小さいほど先）。
  // 条件の付かないトロフィーを、条件付きの終了画面より先に出す。
  function allCert(S){
    const pick=(arr,state,base)=>arr.filter(c=>c[3]>0)
      .map(c=>({label:c[1],tier:tierText(c),value:n(state,c[0]),rank:c[3],order:base+c[3]}));
    return [...pick(TROPHY,S.trophy,10),...pick(AT_END,S.screens,20)];
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${hit.tier}) ×${hit.value}`:'確定演出 なし';
  }

  function normalizeState(out){
    out=out||{};
    out.games=Math.max(0,Number(out.games)||0);
    ['counts','screens','trophy'].forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    });
    return out;
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.cz','CZ当選','設1:1/324⇔設6:1/287',0)}
      ${ctx.crow('counts.at','AT初当り','設1:1/431⇔設6:1/358',1)}
      ${ctx.crow('counts.direct','AT直撃','設1:1/32252.6（他設定は調査中）',0)}
    </div>
    <div class="hint">AT直撃は設定1だけ判明しています。設定2以降は調査中のため、回数だけ記録して比較には使わないでください。周期到達時の抽選とは別枠なので、周期非到達で前兆が出たときが該当します。天井や周期からのCZ当選時のAT書き換え（当選率3.1%）は直撃ではありません。</div>
  </section>`;
  }

  function pageShisa(ctx){
    const S=ctx.S,scN=total(AT_END,S.screens);
    return `<section class="sec">
    <div class="sec-h">AT終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${AT_END.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,scN))).join('')}</div>
    <div class="hint">⚠ モグ玄と騎乗モグ玄はSPモードへの移行の有無で示唆が変わります。AT後の挙動まで確認し、SPモードへ移行しなかった場合にだけモグ玄＝設定2以上、騎乗モグ玄＝設定3以上として扱ってください（騎乗はSPモード2つ以上への非移行が条件です）。</div>
    <div class="hint">終了画面は出るたびに記録します。出典に載っているのは上の8種類です。どれにも当てはまらない画面が出た場合は「その他（上記以外）」に記録すると、判明分の割合が正しく出ます。</div>
  </section>
  <section class="sec">
    <div class="sec-h">くまトロフィー<span class="sub">計${total(TROPHY,S.trophy)}回</span></div>
    <div class="cgrid">${TROPHY.map(c=>ctx.crow('trophy.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">出た色の行を記録します。AT終了画面とエンディング終了画面に出現する可能性があります。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">解析待ちの示唆<span class="sub">未実装</span></div>
    <div class="hint">次の項目はまだ扱っていません。内部モードの移行率（高設定ほど通常Bモード以上に移行しやすいとされる）、AT終了後の制覇ロード引き戻し率（全設定平均 約31%）、エンディング中の1枚絵、モグラ叩き突入抽選の当選率（設定1のみ判明）です。いずれも設定別の数値が揃っていないため、判明後に追加します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  // テンプレの行。確定演出は段位を添える（貼り付け先だけを見ても内容が分かるようにする）。
  function tplRow(c,value,denom){
    const label=c[3]>0?`${c[1]}(${tierText(c)})`:c[1];
    const pctText=denom>0?`(${(100*value/denom).toFixed(0)}%)`:'';
    return `${label}▶${countLine(value)}${pctText}`;
  }
  function tplSection(title,arr,state,denom){
    return section(title,arr.filter(c=>n(state,c[0])>0).map(c=>tplRow(c,n(state,c[0]),denom)));
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games;
    const cz=n(S.counts,'cz'),at=n(S.counts,'at'),direct=n(S.counts,'direct');
    let t=`設定判別メモ｜Lモグモグ風林火山 大海戦の巻\n通常 ${g||0}G / CZ${cz}回 / AT${at}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(cz)}`,
      `AT初当り▶${countLine(at)}`,
      `AT直撃▶${countLine(direct)}`
    ]);
    t+=tplSection('AT終了画面',AT_END,S.screens,total(AT_END,S.screens));
    t+=tplSection('くまトロフィー',TROPHY,S.trophy,0);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',n(S.counts,'cz'),0),
        detailItem('AT初当り',n(S.counts,'at'),1),
        detailItem('AT直撃',n(S.counts,'direct'),0)
      ]},
      {title:'AT終了画面',items:detailItems(AT_END,S.screens),denominator:total(AT_END,S.screens)},
      {title:'くまトロフィー',items:detailItems(TROPHY,S.trophy)}
    ];
  }

  window.CheckerConfigs.mogumogu={
    // 実戦中のUI（タブごとのスクロール位置・説明の折りたたみ・データリセット・
    // 44pxのタップ領域・入力欄のラベル）。2026-09-24 に全機種へ展開。
    uiV2:true,
    nanaCollab:false,
    storageKey:'mogumogu-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','screens','trophy'],
    sourceUrl:'https://chonborista.com/slot/net-slot/263515/',
    normalizeState:normalizeState,
    share:{
      title:'Lモグモグ風林火山 大海戦の巻 設定判別メモ',
      hashtags:'#モグモグ風林火山 #設定判別'
    },
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageShisa(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lモグモグ風林火山 大海戦の巻',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#モグモグ風林火山 #設定判別',
      downloadName:'mogumogu_check.png',
      detailDownloadName:'mogumogu_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['通常回転',(S.games||0)+'G'],
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['AT初当り',n(S.counts,'at')+'回'],
          ['確定演出','計'+certCount(S)+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:130,
        step:200,
        width:80,
        items:[
          {label:'CZ',value:n(ctx.S.counts,'cz')},
          {label:'AT',value:n(ctx.S.counts,'at')},
          {label:'終了画面',value:total(AT_END,ctx.S.screens)},
          {label:'確定',value:certCount(ctx.S)}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S;
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(bestCert(S),certCount(S),certCount(S)>0,'#ffc94d'),
              row(`通常回転 ${S.games||0}G`,S.games||0),
              row(`CZ当選 ${n(S.counts,'cz')}回`,n(S.counts,'cz')),
              row(`AT初当り ${n(S.counts,'at')}回`,n(S.counts,'at')),
              row(`AT直撃 ${n(S.counts,'direct')}回`,n(S.counts,'direct'))
            ]},
            {x:560,items:[
              row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
              row(`終了画面 計${total(AT_END,S.screens)}回`,total(AT_END,S.screens)),
              row(shown('画面',codes(AT_END,S.screens)),total(AT_END,S.screens)),
              row(shown('トロフィー',codes(TROPHY,S.trophy)),total(TROPHY,S.trophy))
            ]}
          ]
        };
      }
    }
  };
})();

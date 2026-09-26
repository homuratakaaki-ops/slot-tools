(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  // 設定示唆の行定義。[id, UI表示名, サブラベル, rank, カード略号]
  // rank>0 は確定演出（集計・グラフ・カードのサマリーに乗る）。rank0 は示唆のみ。
  // 出典: ちょんぼりすた様 https://chonborista.com/slot/sankyo-slot/263079/（2026-09-25 再取得）
  // 設定別の出現率はいずれも未公表のため、記録・共有に徹して数値推測には使わない。

  // 終了画面。かのかりBONUS・1GレンCHANCE終了時に必ずいずれか1種が出る＝§9-90 の割合表示の対象。
  const END_SCREEN=[
    ['none','枠なし','デフォルト',0,'無'],
    ['bbq','白枠BBQ','高設定示唆(弱)',0,'B'],
    ['beach','白枠浜辺','高設定示唆(強)',0,'浜'],
    ['red','赤枠','設定2以上確定演出',2,'赤'],
    ['purple','紫枠','設定4以上確定演出',4,'紫'],
    ['silver','銀枠','設定5以上確定演出',5,'銀'],
    ['gold','金枠','設定6確定演出',6,'金']
  ];
  // RB中のキャラ紹介シナリオ。全15パターンのうち示唆が判明しているのは8パターン。
  // 残り7パターンは「その他のパターン」に集約し、8パターンと合わせて割合の分母を閉じる。
  // ⑥〜⑧の水着は出典が「高設定」とだけ記し、対象の設定範囲が公表されていないため rank を持たせない。
  const REG_CHARA=[
    ['p1','①コスプレ無し','デフォルト',0,'①'],
    ['p2','②5人目千鶴がコスプレ','奇数設定示唆',0,'②'],
    ['p3','③4人目墨からコスプレ','偶数設定示唆',0,'③'],
    ['p4','④3人目瑠夏からコスプレ','高設定示唆(弱)',0,'④'],
    ['p5','⑤2人目麻美からコスプレ','高設定示唆(強)',0,'⑤'],
    ['p6','⑥2人目麻美から水着','高設定示唆(強・範囲は非公表)',0,'⑥'],
    ['p7','⑦4人目墨のみ水着','高設定示唆(強・範囲は非公表)',0,'⑦'],
    ['p8','⑧5人目千鶴のみ水着','高設定示唆(強・範囲は非公表)',0,'⑧'],
    ['other','その他のパターン','示唆不明(全15種中7種未判明)',0,'他']
  ];
  // 1GレンCHANCE 攻略キャラの初回シナリオ。4種のいずれかが必ず選ばれる＝割合表示の対象。
  const SCENARIO=[
    ['s1','①麻美から','偶数設定示唆',0,'①'],
    ['s2','②瑠夏から','奇数設定示唆',0,'②'],
    ['s3','③墨から','偶数設定示唆',0,'③'],
    ['s4','④千鶴から','奇数設定示唆',0,'④']
  ];
  // 同一シナリオの連続は「出たかどうか」を数える行。上の振り分けの分母には入れない。
  const SCENARIO_X=[
    ['repeat','同一シナリオが連続','設定5以上確定演出',5,'連']
  ];
  // センチメートル演出の特定数値。出現有無型のため割合は出さない。
  const CM=[
    ['cm44','44cm','設定4以上確定演出',4,'44'],
    ['cm55','55cm','設定5以上確定演出',5,'55'],
    ['cm66','66cm','設定6確定演出',6,'66']
  ];
  // 獲得枚数表示。出現有無型のため割合は出さない。
  // 246枚は設定1・3・5を否定する（とある2・からくり2と同じ書き方に揃える）。
  const OVER=[
    ['o246','246枚OVER','設定2・4・6確定演出',2,'246'],
    ['o456','456枚OVER','設定4以上確定演出',4,'456'],
    ['o666','666枚OVER','設定6確定演出',6,'666'],
    ['o394','394枚OVER','設定6確定演出',6,'394']
  ];
  // エンディング中のボイス。エンディング中のレア役でPUSHボタンを押すと必ずいずれか1種が出る
  // ＝§9-90 の割合表示の対象。
  // 出典: SANKYO公式「開発こぼれ話」エンディング（2026-09-26 公表）
  // https://www.secret-story.sankyo-fever.jp/article/szf_56
  // セリフの表記と並びは公式記事のまま（一字も変えない。”恋人” の引用符も記事どおり U+201D）。
  // 公式は「設定示唆のボイス」であることだけを明かし、どのボイスが何を示すかは非公表。
  // 記事内の3つの段落区切り・太字は段階を示すとは書かれていないため、rank も示唆内容も付けない。
  // カード略号は定義のみ（サマリー右列は6行で上限に達しているため載せていない）。
  const ED_VOICE=[
    ['v01','麻美「アガる～↑」','示唆内容は非公表',0,'麻1'],
    ['v02','瑠夏「彼女入りまーす」','示唆内容は非公表',0,'瑠1'],
    ['v03','墨「ふん、ふん、！！」','示唆内容は非公表',0,'墨1'],
    ['v04','水原「今は”恋人”。遠慮しない」','示唆内容は非公表',0,'水1'],
    ['v05','麻美「あれ～？嫉妬させちゃった？」','示唆内容は非公表',0,'麻2'],
    ['v06','瑠夏「私が一番…好きだもん…っ」','示唆内容は非公表',0,'瑠2'],
    ['v07','墨「私…っいるか…っ」','示唆内容は非公表',0,'墨2'],
    ['v08','麻美「もう恋なんてしないって決めてるんだから！」','示唆内容は非公表',0,'麻3'],
    ['v09','瑠夏「なんだか少し、お酒の味…」','示唆内容は非公表',0,'瑠3'],
    ['v10','墨「今日は私がお饗しする番…」','示唆内容は非公表',0,'墨3'],
    ['v11','水原「私……どんなカオ…してたかな……」','示唆内容は非公表(公式が『特に注目』と記載)',0,'水2']
  ];

  const DEF={
    games:0,
    counts:{cz:0,first:0},
    screens:Object.fromEntries(END_SCREEN.map(v=>[v[0],0])),
    chara:Object.fromEntries(REG_CHARA.map(v=>[v[0],0])),
    scen:Object.fromEntries(SCENARIO.concat(SCENARIO_X).map(v=>[v[0],0])),
    cm:Object.fromEntries(CM.map(v=>[v[0],0])),
    over:Object.fromEntries(OVER.map(v=>[v[0],0])),
    voice:Object.fromEntries(ED_VOICE.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function n(obj,key){return Number((obj||{})[key])||0;}
  function total(arr,state){return arr.reduce((a,c)=>a+n(state,c[0]),0);}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],n(state,c[0]),c[3]>0));}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}

  // 確定演出の段位表記。サブラベル（＝出典の示唆内容）を唯一の出典にする（§9-84）。
  // 「設定4以上確定演出」→「4以上」／「設定6確定演出」→「6確定」／「設定2・4・6確定演出」→「2・4・6」
  function tierText(sub){
    const t=String(sub||'').replace(/^設定/,'').replace(/確定演出$/,'');
    return t==='6'?'6確定':t;
  }
  // 確定演出の一覧。order は同じ rank が並んだときの優先順（小さいほど先）。
  // 246枚OVER は設定1・3・5を否定するので、同じ rank2 の赤枠より前に出す。
  function allCert(S){
    const pick=(arr,state,base)=>arr.filter(c=>c[3]>0)
      .map(c=>({label:c[1],sub:c[2],value:n(state,c[0]),rank:c[3],order:base+c[3]}));
    return [
      ...pick(OVER,S.over,10),
      ...pick(CM,S.cm,20),
      ...pick(SCENARIO_X,S.scen,30),
      ...pick(END_SCREEN,S.screens,40)
    ];
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function certTier(S,rank){return allCert(S).filter(v=>v.rank===rank).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${tierText(hit.sub)}) ×${hit.value}`:'確定演出 なし';
  }
  // 示唆として記録した総回数（デフォルト行も含む）。
  function hintTotal(S){
    return total(END_SCREEN,S.screens)+total(REG_CHARA,S.chara)
      +total(SCENARIO.concat(SCENARIO_X),S.scen)+total(CM,S.cm)+total(OVER,S.over)
      +total(ED_VOICE,S.voice);
  }

  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    ['counts','screens','chara','scen','cm','over','voice'].forEach(key=>{
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
      ${ctx.crow('counts.cz','CZ当選','設1:1/172⇔設6:1/149',0)}
      ${ctx.crow('counts.first','初当り','設1:1/269⇔設6:1/226',1)}
    </div>
  </section>`;
  }

  function pageShisa(ctx){
    const S=ctx.S;
    const scN=total(END_SCREEN,S.screens),chN=total(REG_CHARA,S.chara),scenN=total(SCENARIO,S.scen);
    const voN=total(ED_VOICE,S.voice);
    return `<section class="sec">
    <div class="sec-h">終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${END_SCREEN.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,scN))).join('')}</div>
    <div class="hint">終了画面は出るたびに記録します。かのかりBONUSと1GレンCHANCEの終了画面が対象です。画面上部に枠がなければデフォルトで、告知モードにより全6種類に変化します。銀枠はKNKRの文字、金枠はヒロイン4人の画面です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">RB中のキャラ紹介<span class="sub">計${chN}回</span></div>
    <div class="cgrid">${REG_CHARA.map(c=>ctx.crow('chara.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,chN))).join('')}</div>
    <div class="hint">押し順ベル2回ごとにキャラが切り替わります。紹介シナリオは全15パターンあり、示唆内容が判明しているのは上の8パターンだけです。どれにも当てはまらない場合は「その他のパターン」に記録してください。水着の3種は出典が「高設定」とだけ記し、対象となる設定の範囲が公表されていないため確定演出としては扱いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">1GレンCHANCE 攻略キャラ<span class="sub">初回${scenN}回</span></div>
    <div class="cgrid">${SCENARIO.map(c=>ctx.crow('scen.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,scenN))).join('')}
      ${SCENARIO_X.map(c=>ctx.crow('scen.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">初回シナリオだけを記録します。1GレンCHANCE中の攻略キャラは4種類のシナリオで管理され、4人を攻略した後は番号が＋1されたシナリオへ変わりますが、そちらに設定示唆の役割はありません。引き戻し時は初回として扱います。同一シナリオが連続した場合は、割合には含めず専用の行に記録してください。</div>
  </section>
  <section class="sec">
    <div class="sec-h">センチメートル<span class="sub">計${total(CM,S.cm)}回</span></div>
    <div class="cgrid">${CM.map(c=>ctx.crow('cm.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">出た数値の行を記録します。数値の文字色は44cmが紫、55cmが赤、66cmが金です。通常時のヒミツ恋ゴコロステージ中と、かのかりBONUS中のチャンス告知選択時が対象です。通常時に出た場合はボーナスの本前兆にも期待できます。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">獲得枚数表示<span class="sub">計${total(OVER,S.over)}回</span></div>
    <div class="cgrid">${OVER.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">表示された枚数の行を記録します。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。394枚はSANKYOの語呂合わせです。</div>
  </section>
  <section class="sec">
    <div class="sec-h">エンディング中のボイス<span class="sub">計${voN}回</span></div>
    <div class="cgrid">${ED_VOICE.map(c=>ctx.crow('voice.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,voN))).join('')}</div>
    <div class="hint">レア役時のPUSHで出たボイスを記録。エンディング中にレア役が成立したときPUSHボタンを押すと、上の11種のいずれかが発生します。設定示唆のボイスであることは公式が公表していますが、どのボイスが何を示すかは公表されていません。セリフと並びは公式発表の表記どおりです。</div>
  </section>
  <section class="sec">
    <div class="hint">設定別の出現率は公表されていません。そのため本ツールは記録と共有に徹し、示唆から設定を数値で推測することはしません。</div>
  </section>`;
  }

  // テンプレの行。確定演出は段位を添える（貼り付け先だけを見ても内容が分かるようにする）。
  function tplRow(c,value,denom){
    const label=c[3]>0?`${c[1]}(${tierText(c[2])})`:c[1];
    const pctText=denom>0?`(${(100*value/denom).toFixed(0)}%)`:'';
    return `${label}▶${countLine(value)}${pctText}`;
  }
  function tplLines(arr,state,denom){
    return arr.filter(c=>n(state,c[0])>0).map(c=>tplRow(c,n(state,c[0]),denom));
  }
  function tplSection(title,arr,state,denom){
    return section(title,tplLines(arr,state,denom));
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,cz=n(S.counts,'cz'),first=n(S.counts,'first');
    let t=`設定判別メモ｜Lパチスロ 彼女、お借りします\n通常 ${g||0}G / CZ${cz}回 / 初当り${first}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(cz)}`,
      `初当り▶${countLine(first)}`
    ]);
    t+=tplSection('終了画面',END_SCREEN,S.screens,total(END_SCREEN,S.screens));
    t+=tplSection('RB中のキャラ紹介',REG_CHARA,S.chara,total(REG_CHARA,S.chara));
    // 攻略キャラは初回シナリオ（割合あり）と同一シナリオ連続（出現有無）を1セクションに並べる。
    t+=section('1GレンCHANCE 攻略キャラ',
      tplLines(SCENARIO,S.scen,total(SCENARIO,S.scen)).concat(tplLines(SCENARIO_X,S.scen,0)));
    t+=tplSection('センチメートル',CM,S.cm,0);
    t+=tplSection('獲得枚数表示',OVER,S.over,0);
    t+=tplSection('エンディング中のボイス',ED_VOICE,S.voice,total(ED_VOICE,S.voice));
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',n(S.counts,'cz'),0),
        detailItem('初当り',n(S.counts,'first'),1)
      ]},
      {title:'終了画面',items:detailItems(END_SCREEN,S.screens),denominator:total(END_SCREEN,S.screens)},
      {title:'RB中のキャラ紹介',items:detailItems(REG_CHARA,S.chara),denominator:total(REG_CHARA,S.chara)},
      {title:'1GレンCHANCE 攻略キャラ',items:detailItems(SCENARIO,S.scen),denominator:total(SCENARIO,S.scen)},
      {title:'シナリオの連続',items:detailItems(SCENARIO_X,S.scen)},
      {title:'センチメートル',items:detailItems(CM,S.cm)},
      {title:'獲得枚数表示',items:detailItems(OVER,S.over)}
      // エンディング中のボイスは詳細カードに載せていない。セリフが長く、
      // 「麻美「もう恋なんてしないって決めてるんだから！」 ×1 (9%)」が
      // engine の行幅（420px・最小18px・省略記号なし）で513pxになり、
      // 22行のセッションで使われる右列（x=560）に掛かるため。表記の短縮は
      // 「一字も変えない」と両立しないので、扱いはシオンの判断を待つ。
    ];
  }

  window.CheckerConfigs.kanokari={
    // 実戦中のUI（タブごとのスクロール位置・説明の折りたたみ・データリセット・
    // 44pxのタップ領域・入力欄のラベル）。2026-09-24 に全機種へ展開。
    uiV2:true,
    nanaCollab:false,
    storageKey:'kanokari-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','screens','chara','scen','cm','over','voice'],
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/263079/',
    normalizeState:normalizeState,
    share:{title:'Lパチスロ 彼女、お借りします 設定判別メモ',hashtags:'#かのかり #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageShisa(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lパチスロ 彼女、お借りします',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#かのかり #設定判別',
      downloadName:'kanokari_check.png',
      detailDownloadName:'kanokari_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['通常回転',(S.games||0)+'G'],
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['初当り',n(S.counts,'first')+'回'],
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
          {label:'初当り',value:n(ctx.S.counts,'first')},
          {label:'終了画面',value:total(END_SCREEN,ctx.S.screens)},
          {label:'確定',value:certCount(ctx.S)}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S;
        // 右列が6行になったので行間を詰める。最終行 752+5*36=932 で、
        // フッタ（slot-tools.jp・y=976）に掛からない上限 936 の内側に収める。
        return {
          title:'サマリー',
          startY:752,
          rowGap:36,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(bestCert(S),certCount(S),certCount(S)>0,'#ffc94d'),
              row(`通常回転 ${S.games||0}G`,S.games||0),
              row(`CZ当選 ${n(S.counts,'cz')}回`,n(S.counts,'cz')),
              row(`初当り ${n(S.counts,'first')}回`,n(S.counts,'first')),
              row(`示唆の記録 計${hintTotal(S)}回`,hintTotal(S))
            ]},
            {x:560,items:[
              row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
              row(shown('終了画面',codes(END_SCREEN,S.screens)),total(END_SCREEN,S.screens)),
              row(shown('RB紹介',codes(REG_CHARA,S.chara)),total(REG_CHARA,S.chara)),
              row(shown('シナリオ',codes(SCENARIO.concat(SCENARIO_X),S.scen)),total(SCENARIO.concat(SCENARIO_X),S.scen)),
              row(shown('センチ',codes(CM,S.cm)),total(CM,S.cm)),
              row(shown('枚数',codes(OVER,S.over)),total(OVER,S.over))
            ]}
          ]
        };
      }
    }
  };
})();

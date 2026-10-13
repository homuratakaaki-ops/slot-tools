(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  // 設定示唆の行定義。[id, UI表示名, サブラベル, rank, カード略号]
  // rank>0 は確定演出（集計・グラフ・カードのサマリーに乗る）。rank0 は示唆のみ。
  // ED_VOICE だけ6列目に「詳細カード用の略記」を持つ（画面の行は出典どおりのまま）。
  // 出典: ちょんぼりすた様 https://chonborista.com/slot/sankyo-slot/263079/（2026-09-29 再取得・9/28版）
  // 2026-10-14 に設定別の振り分けが公開された。終了画面（カスタムなし）・RB中のキャラ紹介・
  // 攻略キャラの初回シナリオ・エンディング中のボイス（強チャンス目時）は「設定推測」タブの参考割合に使う。
  // 数値の正本は docs/specs/kanokari-estimate-v01.md（下の *_RATE は同書の表の転記）。

  // 終了画面。かのかりBONUS・1GレンCHANCE終了時に必ずいずれか1種が出る＝§9-90 の割合表示の対象。
  const END_SCREEN=[
    ['none','枠なし','デフォルト',0,'無'],
    ['bbq','白枠BBQ','高設定示唆(弱)',0,'B'],
    ['beach','白枠浜辺','高設定示唆(強)',0,'浜'],
    ['red','赤枠','設定2以上濃厚',2,'赤'],
    ['purple','紫枠','設定4以上濃厚',4,'紫'],
    ['silver','銀枠','設定5以上濃厚',5,'銀'],
    ['gold','金枠','設定6濃厚',6,'金']
  ];
  // RB中のキャラ紹介シナリオ。2026-09-28 の出典更新で全15パターンの示唆内容が判明した。
  // 押し順ベル2回ごとにキャラが切り替わり、紹介順のコスプレ・水着・肺魚の位置で示唆を読む。
  // 出るたびに必ず1種が選ばれる＝§9-90 の割合表示の対象。
  // ⑦の「設定1否定」は設定2以上と同義なので rank2 として確定演出に数える。
  // ⑧〜⑪の「設定n否定」は「設定n以上」に読み替えられないため rank を持たせず示唆のみとする。
  const REG_CHARA=[
    ['p01','①コスプレ無し','デフォルト',0,'①'],
    ['p02','②5人目千鶴がコスプレ','奇数設定示唆',0,'②'],
    ['p03','③4人目墨からコスプレ','偶数設定示唆',0,'③'],
    ['p04','④3人目瑠夏からコスプレ','高設定示唆(弱)',0,'④'],
    ['p05','⑤2人目麻美からコスプレ','高設定示唆(強)',0,'⑤'],
    ['p06','⑥2人目麻美から全員水着','設定6濃厚',6,'⑥'],
    ['p07','⑦肺魚が1人目','設定1否定(設定2以上濃厚)',2,'⑦'],
    ['p08','⑧肺魚が2人目','設定2否定',0,'⑧'],
    ['p09','⑨肺魚が3人目','設定3否定',0,'⑨'],
    ['p10','⑩肺魚が4人目','設定4否定',0,'⑩'],
    ['p11','⑪肺魚が5人目','設定5否定',0,'⑪'],
    ['p12','⑫2人目麻美だけ水着','設定2以上濃厚',2,'⑫'],
    ['p13','⑬3人目瑠夏だけ水着','設定3以上濃厚',3,'⑬'],
    ['p14','⑭4人目墨だけ水着','設定4以上濃厚',4,'⑭'],
    ['p15','⑮5人目千鶴だけ水着','設定5以上濃厚',5,'⑮']
  ];
  // 旧「その他のパターン」(chara.other) は全15種が判明したため行を廃止した。
  // 旧データの値は内部に残して失わないようにするが、表示・割合の分母・集計には入れない。
  // 旧id p1〜p8 から新id p01〜p15 への移行表。旧⑥→⑥／旧⑦(4人目墨のみ水着)→⑭／
  // 旧⑧(5人目千鶴のみ水着)→⑮。移した旧キーは削除するので二重加算は起きない。
  const CHARA_MIGRATION={p1:'p01',p2:'p02',p3:'p03',p4:'p04',p5:'p05',p6:'p06',p7:'p14',p8:'p15'};
  // 1GレンCHANCE 攻略キャラの初回シナリオ。4種のいずれかが必ず選ばれる＝割合表示の対象。
  const SCENARIO=[
    ['s1','①麻美から','偶数設定示唆',0,'①'],
    ['s2','②瑠夏から','奇数設定示唆',0,'②'],
    ['s3','③墨から','偶数設定示唆',0,'③'],
    ['s4','④千鶴から','奇数設定示唆',0,'④']
  ];
  // 同一シナリオの連続は「出たかどうか」を数える行。上の振り分けの分母には入れない。
  const SCENARIO_X=[
    ['repeat','同一シナリオが連続','設定5以上濃厚',5,'連']
  ];
  // センチメートル演出の特定数値。出現有無型のため割合は出さない。
  const CM=[
    ['cm44','44cm','設定4以上濃厚',4,'44'],
    ['cm55','55cm','設定5以上濃厚',5,'55'],
    ['cm66','66cm','設定6濃厚',6,'66']
  ];
  // 獲得枚数表示。出現有無型のため割合は出さない。
  // 246枚は設定1・3・5を否定する（とある2・からくり2と同じ書き方に揃える）。
  const OVER=[
    ['o246','246枚OVER','設定2・4・6濃厚',2,'246'],
    ['o456','456枚OVER','設定4以上濃厚',4,'456'],
    ['o666','666枚OVER','設定6濃厚',6,'666'],
    ['o394','394枚OVER','設定6濃厚',6,'394']
  ];
  // エンディング中のボイス。エンディング中のレア役でPUSHボタンを押すと必ずいずれか1種が出る
  // ＝§9-90 の割合表示の対象。
  // 出典: SANKYO公式「開発こぼれ話」エンディング（2026-09-26 公表）
  // https://www.secret-story.sankyo-fever.jp/article/szf_56
  // セリフの表記と並びは公式記事のまま（一字も変えない。”恋人” の引用符も記事どおり U+201D）。
  // 示唆内容は 2026-09-28 のちょんぼりすた様の表が出典（公式記事はセリフだけで示唆を明かしていない）。
  // 最初の4種はデフォルトで、以降が高設定示唆(弱/中/強)と設定2以上/4以上/5以上/6の確定演出。
  // カード略号は定義のみ（サマリー右列は6行で上限に達しているため載せていない）。
  // 6列目は詳細カード用の略記。詳細カードの行は幅420px・最小18px・省略記号なしで描かれ、
  // 全角23.3字を超えると右列（x=560）に掛かるため、長いセリフだけ「…」で短縮する。
  // 画面（示唆タブ）とテンプレ出力は2列目の出典どおりの表記を使い、短縮しない。
  const ED_VOICE=[
    ['v01','麻美「アガる～↑」','デフォルト',0,'麻1','麻美「アガる～↑」'],
    ['v02','瑠夏「彼女入りまーす」','デフォルト',0,'瑠1','瑠夏「彼女入りまーす」'],
    ['v03','墨「ふん、ふん、！！」','デフォルト',0,'墨1','墨「ふん、ふん、！！」'],
    ['v04','水原「今は”恋人”。遠慮しない」','デフォルト',0,'水1','水原「今は”恋人”…」'],
    ['v05','麻美「あれ～？嫉妬させちゃった？」','高設定示唆(弱)',0,'麻2','麻美「あれ～？嫉妬させちゃった？」'],
    ['v06','瑠夏「私が一番…好きだもん…っ」','高設定示唆(中)',0,'瑠2','瑠夏「私が一番…」'],
    ['v07','墨「私…っいるか…っ」','高設定示唆(強)',0,'墨2','墨「私…っいるか…っ」'],
    ['v08','麻美「もう恋なんてしないって決めてるんだから！」','設定2以上濃厚',2,'麻3','麻美「もう恋なんて…」'],
    ['v09','瑠夏「なんだか少し、お酒の味…」','設定4以上濃厚',4,'瑠3','瑠夏「お酒の味…」'],
    ['v10','墨「今日は私がお饗しする番…」','設定5以上濃厚',5,'墨3','墨「私がお饗しする番…」'],
    ['v11','水原「私……どんなカオ…してたかな……」','設定6濃厚',6,'水2','水原「どんなカオ…」']
  ];

  // ---- 設定推測（参考割合） ----
  // 設定別の振り分け（％）。出典: ちょんぼりすた様 https://chonborista.com/slot/sankyo-slot/263079/
  // 2026-10-14 取得。列の並びは上の行定義（END_SCREEN／REG_CHARA／SCENARIO／ED_VOICE）と同じ。
  // 出典の「−」は0。出典の数値をそのまま持ち、計算のときに行ごとに合計100%へ割り戻す（rateDist）。
  // 割り戻しは各セルを行合計で割るだけなので、元が0のセルは0のまま残る。
  // 行合計：終了画面 100.0／100.0／100.0／100.1／100.1／100.1、キャラ紹介 99.9／100.1／100.2／100.2／100.1／100.2、
  // 攻略初回 すべて100.0、EDボイス 100.0／100.0／99.9／100.1／99.9／100.2。
  const BAYES_SETTINGS=[1,2,3,4,5,6];
  // 終了画面（カスタムなし時）。店のカスタム設定で振り分けが変わるため、カスタムなしを確認できたときだけ使う。
  const END_RATE={
    1:[82.5,15,2.5,0,0,0,0],
    2:[80.9,15,2.5,1.6,0,0,0],
    3:[75.9,17.5,5,1.6,0,0,0],
    4:[75.2,17.5,5,1.6,0.8,0,0],
    5:[66.9,20,10,1.6,0.8,0.8,0],
    6:[66.1,20,10,1.6,0.8,0.8,0.8]
  };
  // RB中のキャラ紹介 ①〜⑮。
  const REG_RATE={
    1:[43.8,15.6,12.5,12.5,3.1,0,0,3.1,3.1,3.1,3.1,0,0,0,0],
    2:[41.4,12.5,15.6,13.3,3.1,0,6.3,0,1.6,1.6,1.6,3.1,0,0,0],
    3:[35.9,15.6,12.5,14.1,6.3,0,1.6,6.3,0,1.6,1.6,3.1,1.6,0,0],
    4:[34.8,12.5,15.6,14.8,6.3,0,1.6,1.6,6.3,0,1.6,3.1,1.6,0.4,0],
    5:[27.7,15.6,12.5,15.6,12.5,0,1.6,1.6,1.6,6.3,0,3.1,1.6,0.2,0.2],
    6:[25,12.5,15.6,16.4,12.5,0.4,1.6,1.6,1.6,1.6,6.3,3.1,1.6,0.2,0.2]
  };
  // 1GレンCHANCE 攻略キャラの初回シナリオ ①〜④。
  const SCEN_RATE={
    1:[22.5,27.5,22.5,27.5],
    2:[27.5,22.5,27.5,22.5],
    3:[22.5,27.5,22.5,27.5],
    4:[27.5,22.5,27.5,22.5],
    5:[22.5,27.5,22.5,27.5],
    6:[27.5,22.5,27.5,22.5]
  };
  // エンディング中のボイス（強チャンス目時だけ）。出典の「デフォルト（各キャラ）」は4キャラそれぞれの値なので
  // v01〜v04 に同じ値を置く。弱チャンス目・チャンス目の振り分けは未公表のため、この表は強チャンス目にだけ使う。
  const ED_STRONG_RATE={
    1:[16.4,16.4,16.4,16.4,25,6.3,3.1,0,0,0,0],
    2:[12.6,12.6,12.6,12.6,25.4,7,4.7,12.5,0,0,0],
    3:[11.2,11.2,11.2,11.2,26.2,8.6,7.8,12.5,0,0,0],
    4:[9.1,9.1,9.1,9.1,27,10.2,10.9,12.5,3.1,0,0],
    5:[7.3,7.3,7.3,7.3,27.7,11.7,14.1,12.5,3.1,1.6,0],
    6:[5.6,5.6,5.6,5.6,28.5,13.3,17.2,12.5,3.1,1.6,1.6]
  };
  // 出たら候補から外す設定（出なかったことでは減点しない）。終了画面・キャラ紹介・EDボイスの濃厚／否定は
  // 上の振り分け表の0とも一致する。EDボイスの除外は成立役を問わず全回数（voice）で行う。
  const EXCLUDE={
    screens:{red:[1],purple:[1,2,3],silver:[1,2,3,4],gold:[1,2,3,4,5]},
    chara:{p06:[1,2,3,4,5],p07:[1],p08:[2],p09:[3],p10:[4],p11:[5],p12:[1],p13:[1,2],p14:[1,2,3],p15:[1,2,3,4]},
    cm:{cm44:[1,2,3],cm55:[1,2,3,4],cm66:[1,2,3,4,5]},
    over:{o246:[1,3,5],o456:[1,2,3],o666:[1,2,3,4,5],o394:[1,2,3,4,5]},
    scen:{repeat:[1,2,3,4]},
    voice:{v08:[1],v09:[1,2,3],v10:[1,2,3,4],v11:[1,2,3,4,5]}
  };
  // 終了画面の店のカスタム。既定は「不明」（旧データも不明として読む＝推測に使わない）。
  const END_CUSTOM=[['none','なし'],['custom','あり'],['unknown','不明']];
  // EDボイスの成立役。既定は「それ以外・不明」。
  const ED_ROLE=[['strong','強チャンス目'],['other','それ以外・不明']];

  const DEF={
    games:0,
    counts:{cz:0,first:0},
    screens:Object.fromEntries(END_SCREEN.map(v=>[v[0],0])),
    chara:Object.assign(Object.fromEntries(REG_CHARA.map(v=>[v[0],0])),{other:0}),
    scen:Object.fromEntries(SCENARIO.concat(SCENARIO_X).map(v=>[v[0],0])),
    cm:Object.fromEntries(CM.map(v=>[v[0],0])),
    over:Object.fromEntries(OVER.map(v=>[v[0],0])),
    voice:Object.fromEntries(ED_VOICE.map(v=>[v[0],0])),
    // 2026-10-14 追加。旧データに無くても既定値で読む（既存の回数の意味は変えない）。
    // edStrong は「強チャンス目」に切り替えて押した分だけ。voice にも同時に加算されるので内訳にあたる。
    endCustom:'unknown',
    edRole:'other',
    edStrong:Object.fromEntries(ED_VOICE.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function n(obj,key){return Number((obj||{})[key])||0;}
  function total(arr,state){return arr.reduce((a,c)=>a+n(state,c[0]),0);}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],n(state,c[0]),c[3]>0));}
  // 詳細カードだけ6列目の略記を使う（無い行は2列目のまま）。§9-85 の省略をデータ側で行う形。
  function detailItemsShort(arr,state){return arr.map(c=>detailItem(c[5]||c[1],n(state,c[0]),c[3]>0));}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}

  // 確定演出の段位表記。サブラベル（＝出典の示唆内容）を唯一の出典にする（§9-84）。
  // 「設定4以上濃厚」→「4以上」／「設定6濃厚」→「6濃厚」／「設定2・4・6濃厚」→「2・4・6」
  // ⑦のように「設定1否定(設定2以上濃厚)」と前置きが付く行もあるため、文字列の途中から拾う。
  function tierText(sub){
    const m=String(sub||'').match(/設定([0-9・]+(?:以上)?)濃厚/);
    if(!m)return '';
    return m[1]==='6'?'6濃厚':m[1];
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
      ...pick(END_SCREEN,S.screens,40),
      ...pick(REG_CHARA,S.chara,50),
      ...pick(ED_VOICE,S.voice,60)
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

  // 旧データ移行。engine が DEF とマージした直後（値のクランプ前）に旧キーを新キーへ移す。
  function migrateChara(chara){
    Object.keys(CHARA_MIGRATION).forEach(oldKey=>{
      if(!Object.prototype.hasOwnProperty.call(chara,oldKey))return;
      const moved=Math.max(0,Number(chara[oldKey])||0);
      const newKey=CHARA_MIGRATION[oldKey];
      chara[newKey]=Math.max(0,Number(chara[newKey])||0)+moved;
      delete chara[oldKey];
    });
    return chara;
  }

  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    ['counts','screens','chara','scen','cm','over','voice','edStrong'].forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      if(key==='chara')migrateChara(out[key]);
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    });
    if(!END_CUSTOM.some(v=>v[0]===out.endCustom))out.endCustom=DEF.endCustom;
    if(!ED_ROLE.some(v=>v[0]===out.edRole))out.edRole=DEF.edRole;
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

  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  // 切替（店のカスタム／成立役）。押すと actions の kkEndCustom／kkEdRole が値を書き換える。
  // engine の #main button{min-height:44px} がID付きで勝つため、48pxは #main 付きで指定する。
  function switchRow(title,action,list,value){
    const chips=list.map(v=>`<button type="button" class="kk-chip${v[0]===value?' on':''}" data-action="${action}" data-v="${v[0]}" data-label="${title}：${v[1]}" aria-pressed="${v[0]===value?'true':'false'}">${v[1]}</button>`).join('');
    return `<div class="kk-sw" role="group" aria-label="${title}"><span class="kk-sw-l">${title}</span>${chips}</div>`;
  }
  // EDボイスの行。成立役が「強チャンス目」のときは voice と edStrong の両方に1操作で加算する
  // （engine の data-bump-many。取消も両方まとめて戻る）。engine の .crow 配線は data-c と .plus を
  // 見て単独加算を繋ぐため、この行は data-c を持たず、ボタンも .plus ではなく .plus-many にする。
  // 表示（回数・割合）は従来どおり voice のまま。
  function edRow(ctx,c,voN){
    if(ctx.S.edRole!=='strong')return ctx.crow('voice.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,voN));
    const v=n(ctx.S.voice,c[0]),minus=ctx.mode<0;
    return `<div class="crow" data-bump-many="voice.${c[0]},edStrong.${c[0]}" data-label="${esc(c[1])}（強チャンス目）">
    <div class="lbl"><div class="nm">${c[1]}</div><div class="mn ${c[3]>0?'hot':''}">${c[2]}</div></div>
    <div class="num">${v}</div><div class="pct">${ctx.pct(v,voN)}</div>
    <button type="button" class="plus-many" aria-label="${esc(c[1])}を強チャンス目として1回${minus?'減算':'追加'}">${minus?'−':'＋'}</button></div>`;
  }
  function shisaStyle(){
    return `<style>
      .kk-sw{display:flex;align-items:center;gap:6px;margin-bottom:6px}
      .kk-sw-l{flex:none;font-size:11px;font-weight:800;color:var(--muted);min-width:64px}
      #main .kk-chip{flex:1;min-width:0;min-height:48px;border-radius:10px;border:1px solid var(--line);background:var(--panel2);color:var(--muted);font-family:var(--body);font-size:12px;font-weight:800;padding:4px 6px;line-height:1.25}
      #main .kk-chip.on{border-color:var(--pink-dim);background:rgba(255,61,143,.16);color:#fff}
      .crow .plus-many{flex:none;width:34px;height:34px;min-width:44px;min-height:44px;border-radius:9px;border:1px solid var(--pink-dim);background:rgba(255,61,143,.12);color:var(--pink);font-size:18px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:var(--body)}
      body.minus .crow .plus-many{border-color:#7a3040;background:rgba(255,92,92,.14);color:var(--danger)}
    </style>`;
  }

  // ---- 設定推測 ----
  // 行ごとに合計100%へ割り戻した振り分け（setting → {key:確率}）。
  function rateDist(arr,table){
    const out={};
    BAYES_SETTINGS.forEach(s=>{
      const row=table[s],sum=row.reduce((a,b)=>a+b,0),d={};
      arr.forEach((c,i)=>{d[c[0]]=sum>0?row[i]/sum:0;});
      out[s]=d;
    });
    return out;
  }
  const PROBS={
    screens:rateDist(END_SCREEN,END_RATE),
    chara:rateDist(REG_CHARA,REG_RATE),
    scen:rateDist(SCENARIO,SCEN_RATE),
    edStrong:rateDist(ED_VOICE,ED_STRONG_RATE)
  };
  function countsOf(arr,state){return Object.fromEntries(arr.map(c=>[c[0],n(state,c[0])]));}
  // 推測に入れる多項分布の項目。終了画面はカスタムなしのときだけ、EDボイスは強チャンス目の回数だけ。
  function bayesItems(S){
    const items=[
      {key:'chara',label:'RB中のキャラ紹介',counts:countsOf(REG_CHARA,S.chara),probs:PROBS.chara},
      {key:'scen',label:'攻略キャラの初回シナリオ',counts:countsOf(SCENARIO,S.scen),probs:PROBS.scen}
    ];
    if(S.endCustom==='none')items.push({key:'screens',label:'終了画面（カスタムなし）',counts:countsOf(END_SCREEN,S.screens),probs:PROBS.screens});
    items.push({key:'edStrong',label:'EDボイス（強チャンス目）',counts:countsOf(ED_VOICE,S.edStrong),probs:PROBS.edStrong});
    return items.map(it=>Object.assign(it,{total:Object.values(it.counts).reduce((a,b)=>a+b,0)}));
  }
  const EXCLUDE_GROUPS=[
    ['screens','終了画面',END_SCREEN],['chara','RB紹介',REG_CHARA],['cm','センチ',CM],
    ['over','枚数',OVER],['scen','攻略キャラ',SCENARIO_X],['voice','EDボイス',ED_VOICE]
  ];
  function bayesExclusions(S){
    const out=[];
    EXCLUDE_GROUPS.forEach(([key,prefix,arr])=>{
      arr.forEach(c=>{
        const ex=EXCLUDE[key][c[0]];
        if(ex)out.push({label:`${prefix} ${c[5]||c[1]}`,count:n(S[key],c[0]),exclude:ex});
      });
    });
    return out;
  }
  function bayesSpec(S){
    return {
      settings:BAYES_SETTINGS,
      binomial:[],
      multinomial:bayesItems(S).map(it=>({label:it.label,counts:it.counts,probs:it.probs})),
      exclusions:bayesExclusions(S)
    };
  }
  function bayesResult(S){
    if(!window.CheckerBayes)return {empty:true};
    return window.CheckerBayes.estimate(bayesSpec(S));
  }
  // 推測に使わなかった記録の理由。回数が残っているものだけ出す。
  function bayesSkipped(S){
    const out=[];
    const scN=total(END_SCREEN,S.screens);
    if(S.endCustom!=='none'&&scN>0)out.push(`終了画面：${S.endCustom==='custom'?'カスタムあり':'カスタム不明'}のため不採用（記録${scN}回）`);
    const other=Math.max(0,total(ED_VOICE,S.voice)-total(ED_VOICE,S.edStrong));
    if(other>0)out.push(`EDボイス：成立役が強チャンス目以外・不明の${other}回は割合に不採用（濃厚・否定の除外には使用）`);
    return out;
  }
  function bayesPct(v){return window.CheckerBayes?window.CheckerBayes.percent(v):'--';}
  function setList(list){return list.length?'設定'+list.join('・'):'なし';}
  function bayesStyle(){
    return `<style>
      .bayes-main{display:flex;align-items:center;justify-content:space-between;gap:10px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:8px 0}.bayes-main b{color:var(--gold);font-size:16px}.bayes-main span{color:var(--muted);font-size:12px}
      .bayes-bar{display:grid;grid-template-columns:44px 1fr 52px;gap:8px;align-items:center;margin:6px 0;font-size:12px;color:var(--muted)}.bayes-bar b{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,var(--pink),var(--gold))}.bayes-bar em{font-style:normal;text-align:right;color:var(--txt)}
      .hint.warn{color:#ff9b9b}
      .kk-list{margin:6px 0 0 1.2em;font-size:11px;color:var(--txt);line-height:1.6}
      .kk-sub{font-size:11px;font-weight:800;color:var(--gold);margin-top:10px}
      .kk-bd{margin-top:6px;background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:8px 10px}
      .kk-bd>summary{display:flex;align-items:center;min-height:44px;font-size:12px;font-weight:800;color:var(--cyan);cursor:pointer;list-style:none}
      .kk-bd>summary::-webkit-details-marker{display:none}
      .kk-bd-h{font-size:11px;font-weight:700;color:var(--txt);margin-top:8px}
      .kk-bd-row{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:4px}
      .kk-bd-row span{font-size:9.5px;color:var(--muted);text-align:center;background:var(--panel2);border-radius:6px;padding:3px 0}
      .kk-bd-row b{display:block;font-family:var(--seg);font-size:11px;color:var(--txt);font-weight:400}
    </style>`;
  }
  // 項目別の内訳。1項目だけで計算した各設定の割合（他の項目は入れない）。
  function breakdownRow(label,r){
    if(!r||!r.posterior)return `<div class="kk-bd-h">${label}</div><div class="hint">${r&&r.contradiction?'候補なし':'材料なし'}</div>`;
    return `<div class="kk-bd-h">${label}</div><div class="kk-bd-row">${BAYES_SETTINGS.map(s=>`<span>設定${s}<b>${bayesPct(r.posterior[s])}</b></span>`).join('')}</div>`;
  }
  function pageBayes(ctx){
    const S=ctx.S,r=bayesResult(S),items=bayesItems(S),ex=bayesExclusions(S).filter(x=>x.count>0);
    const skipped=bayesSkipped(S);
    const used=items.filter(it=>it.total>0).map(it=>`${it.label} ${it.total}回`);
    const exLines=ex.map(x=>`${x.label}×${x.count}（設定${x.exclude.join('・')}を除外）`);
    let body='';
    if(r.contradiction){
      body=`<div class="hint warn" data-fold="no">⚠入力条件を確認してください。記録した濃厚・否定の示唆をすべて満たす設定がありません（示唆の見間違い・押し間違いの可能性）。</div>`;
    }else if(r.empty){
      body=`<div class="hint" data-fold="no">判別材料なし。下の項目を記録すると参考割合が出ます。</div>`;
    }else{
      const post=r.posterior||{};
      const left=BAYES_SETTINGS.filter(s=>(post[s]||0)>0);
      const bars=BAYES_SETTINGS.map(s=>{
        const p=post[s]||0;
        return `<div class="bayes-bar"><span>設定${s}</span><b style="width:${p>0?Math.max(2,p*100):0}%"></b><em>${bayesPct(p)}</em></div>`;
      }).join('');
      const per=items.filter(it=>it.total>0).map(it=>breakdownRow(`${it.label}（${it.total}回）`,
        window.CheckerBayes.estimate({settings:BAYES_SETTINGS,multinomial:[{counts:it.counts,probs:it.probs}]})));
      if(ex.length)per.push(breakdownRow('濃厚・否定の除外だけ',window.CheckerBayes.estimate({settings:BAYES_SETTINGS,exclusions:ex})));
      body=`<div class="bayes-main"><b>高設定(4〜6) ${bayesPct(r.high)}</b><span>低設定(1〜2) ${bayesPct(r.low)}</span></div>
      <div class="bayes-bars">${bars}</div>
      <div class="hint" data-fold="no">残る候補：${setList(left)}</div>
      <details class="kk-bd"><summary>項目別の内訳を見る</summary>${per.join('')}
      <div class="hint">項目ごとに、その項目だけで計算した割合です。示唆同士が独立かどうかは確認されていないため、上の合算は独立と仮定した参考値です。</div></details>`;
    }
    return bayesStyle()+`<section class="sec"><div class="sec-h">設定推測</div>
    <div class="hint" data-fold="no">入力データからの参考割合（設定1〜6を同じ事前条件で比較）。店の設定配分ではありません</div>
    ${body}
    <div class="kk-sub">採用した項目</div>
    ${used.length?`<ul class="kk-list">${used.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<div class="hint" data-fold="no">なし</div>'}
    <div class="kk-sub">除外の理由（出た示唆）</div>
    ${exLines.length?`<ul class="kk-list">${exLines.map(x=>`<li>${x}</li>`).join('')}</ul>`:'<div class="hint" data-fold="no">なし</div>'}
    ${skipped.length?`<div class="kk-sub">不採用</div><ul class="kk-list">${skipped.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}
    <div class="hint">割合に使うのは、終了画面（店のカスタムなしを確認できたときだけ）・RB中のキャラ紹介・攻略キャラの初回シナリオ・エンディング中のボイス（強チャンス目で記録した分だけ）の4つです。センチメートル・獲得枚数表示・同一シナリオの連続などの濃厚／否定は、出たときにその設定を候補から外すだけで、出なかったことでは減点しません。CZ当選・初当りの確率は計算に入れていません（初当りタブの参考値のみ）。記録が少ないうちは割合が大きく動きます。</div>
    </section>`;
  }

  function pageShisa(ctx){
    const S=ctx.S;
    const scN=total(END_SCREEN,S.screens),chN=total(REG_CHARA,S.chara),scenN=total(SCENARIO,S.scen);
    const voN=total(ED_VOICE,S.voice);
    return shisaStyle()+`<section class="sec">
    <div class="sec-h">終了画面<span class="sub">計${scN}回</span></div>
    ${switchRow('店のカスタム','kkEndCustom',END_CUSTOM,S.endCustom)}
    <div class="hint" data-fold="no">終了画面の振り分けは店のカスタム設定で変わります。カスタムなしを確認できたときだけ推測に使います</div>
    <div class="cgrid">${END_SCREEN.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,scN))).join('')}</div>
    <div class="hint">終了画面は出るたびに記録します。かのかりBONUSと1GレンCHANCEの終了画面が対象です。画面上部に枠がなければデフォルトで、告知モードにより全6種類に変化します。銀枠はKNKRの文字、金枠はヒロイン4人の画面です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">RB中のキャラ紹介<span class="sub">計${chN}回</span></div>
    <div class="cgrid">${REG_CHARA.map(c=>ctx.crow('chara.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,chN))).join('')}</div>
    <div class="hint">紹介順のコスプレ・水着・肺魚に注目。押し順ベル2回ごとにキャラが切り替わり、出るたびに全15パターンのいずれかが選ばれます。①〜⑤はコスプレが何人目から始まるか、⑦〜⑪は肺魚が何人目に出るか、⑥と⑫〜⑮は誰が水着かで見分けます。⑧〜⑪の「設定2否定」〜「設定5否定」は「設定n以上」に読み替えられないため、確定演出には数えず示唆として記録します。</div>
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
    ${switchRow('成立役','kkEdRole',ED_ROLE,S.edRole)}
    <div class="hint" data-fold="no">設定別の振り分けが公開されているのは強チャンス目で当選したときだけです</div>
    <div class="cgrid">${ED_VOICE.map(c=>edRow(ctx,c,voN)).join('')}</div>
    <div class="hint">レア役時のPUSHで出たボイスを記録。エンディング中にレア役が成立したときPUSHボタンを押すと、上の11種のいずれかが発生します。最初の4種はデフォルトで、麻美「あれ～？嫉妬させちゃった？」以降が示唆・確定演出です。セリフと並びはメーカー公式発表の表記どおりです。</div>
  </section>
  <section class="sec">
    <div class="hint">終了画面（カスタムなし）・RB中のキャラ紹介・攻略キャラの初回シナリオ・エンディング中のボイス（強チャンス目時）は設定別の振り分けが公表されています。「設定推測」タブで、記録した回数からの参考割合を確認できます。</div>
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
      {title:'獲得枚数表示',items:detailItems(OVER,S.over)},
      // ボイスは行幅の都合で6列目の略記を使う（画面の行は出典どおりのまま）。
      {title:'エンディング中のボイス',items:detailItemsShort(ED_VOICE,S.voice),denominator:total(ED_VOICE,S.voice)}
    ];
  }

  window.CheckerConfigs["kanokari-test"]={
    // 実戦中のUI（タブごとのスクロール位置・説明の折りたたみ・データリセット・
    // 44pxのタップ領域・入力欄のラベル）。2026-09-24 に全機種へ展開。
    uiV2:true,
    nanaCollab:false,
    storageKey:'kanokari-checker-v1-test',
    defaults:DEF,
    mergeKeys:['counts','screens','chara','scen','cm','over','voice','edStrong'],
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/263079/',
    normalizeState:normalizeState,
    // 切替。同じ値を押し直したときは何もしない（取消の履歴にも積まない）。
    actions:{
      kkEndCustom:(ctx,ds)=>{
        const v=END_CUSTOM.find(x=>x[0]===ds.v);
        if(!v||ctx.S.endCustom===v[0])return false;
        ctx.S.endCustom=v[0];
        return '店のカスタム：'+v[1];
      },
      kkEdRole:(ctx,ds)=>{
        const v=ED_ROLE.find(x=>x[0]===ds.v);
        if(!v||ctx.S.edRole===v[0])return false;
        ctx.S.edRole=v[0];
        return '成立役：'+v[1];
      }
    },
    // テスト用の参照口（画面からは使わない）。
    bayes:{spec:bayesSpec,result:bayesResult,skipped:bayesSkipped,rates:{END_RATE,REG_RATE,SCEN_RATE,ED_STRONG_RATE},probs:PROBS},
    share:{title:'Lパチスロ 彼女、お借りします 設定判別メモ',hashtags:'#かのかり #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageShisa(ctx),()=>pageBayes(ctx),pageCard],
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

(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  // 出典: https://chonborista.com/slot/universal-slot/228995/
  // 取得日: 2026-09-29 / 信頼区分: official（解析サイト掲載値）。
  const SETTINGS=[1,2,3,4,5,6];
  const DENOMS={
    bonus:{1:240.6,2:236.1,3:222.8,4:208.5,5:195.1,6:184.3},
    at:{1:654.6,2:633.4,3:571.8,4:516.6,5:456.5,6:416.7},
    weakCherry:{1:60.0,2:57.7,3:55.5,4:53.5,5:51.7,6:50.0}
  };
  // 出典本文は、さな滞在時の48.4%＋1.6%を「スイカの50%でCZ」と説明。
  // そのため、さな以外もマギア＋黒江の合算をCZ当選率として採用する。
  const CZ_SOURCE={
    magia:{1:.199,2:.223,3:.246,4:.273,5:.301,6:.328},
    kuroe:{1:.004,2:.004,3:.004,4:.008,5:.008,6:.008},
    combined:{1:.203,2:.227,3:.250,4:.281,5:.309,6:.336}
  };
  // rowspan展開済み。公表値の丸めによる行合計のずれも補正せず、そのまま使う。
  const EPISODE_PROBS={
    1:{yachiyo:.281,tsuruno:.281,sana:.219,felicia:.219,kuroe:.001},
    2:{yachiyo:.327,tsuruno:.234,sana:.219,felicia:.219,kuroe:.001},
    3:{yachiyo:.234,tsuruno:.313,sana:.219,felicia:.219,kuroe:.016},
    4:{yachiyo:.281,tsuruno:.156,sana:.313,felicia:.234,kuroe:.016},
    5:{yachiyo:.172,tsuruno:.219,sana:.234,felicia:.313,kuroe:.063},
    6:{yachiyo:.234,tsuruno:.141,sana:.313,felicia:.250,kuroe:.063}
  };
  // 参考記録のみ。見た目と内部の報酬レベルは完全一致しないため推測には渡さない。
  const MITAMA_PROBS={
    blue:{1:.008,2:.012,3:.023,4:.047,5:.063,6:.078},
    green:{1:.051,2:.063,3:.078,4:.094,5:.109,6:.125}
  };
  // 出典の示唆内容は『(管理人予想)』表記だが、ユニバーサル標準仕様として確定扱いにする（2026-09-29 夢爽裁定）。
  const PLATES=[
    ['copper','銅','設定2以上濃厚',2],
    ['silver','銀','設定3以上濃厚',3],
    ['gold','金','設定4以上濃厚',4],
    ['firework','花火柄','設定5以上濃厚',5],
    ['rainbow','虹','設定6濃厚',6]
  ];
  // パターン別の紹介メンバー（出典の表どおり。1〜5人目の登場順）。
  // 半角カナは画面の他の行にそろえて全角で持つ（ﾌｪﾘｼｱ→フェリシア・ｷｭｩべえ→キュゥべえ）。
  // ⑧は出典が4人目を2列結合で「杏子」としているため4人。
  // AT終了画面（出典: ちょんぼりすた様 universal-slot/228995 の「AT終了画面」の画像内の表記。
  // 本文には画面名が書かれていないため、夢爽が画像を確認して文字起こししたものを正とする
  // 2026-09-30）。「設定3・5・6示唆」「設定2・4・6示唆」は飛び値の示唆で振り分けの数値が
  // 公表されていないため rank を付けず記録のみ（§9-54 の1L選定対象外でもある）。
  // 「まどか＆いろは」は設定6濃厚なので rank6＝確定演出集計と推測の除外に使う。
  // ＆は画面の他の行にそろえて全角（例: 委員長の魔女の「設定1否定＆高設定期待度UP」）。
  const AT_SCREENS=[
    ['default','キャラなし','デフォルト',0],
    ['magius','マギウスメンバー','設定3・5・6示唆',0],
    ['mikazuki','みかづき荘メンバー','設定2・4・6示唆',0],
    ['madokaIroha','まどか＆いろは','設定6濃厚',6]
  ];
  const CHAR_MEMBERS=[
    ['①','いろは→やちよ→鶴乃→フェリシア→さな'],
    ['②','ももこ→レナ→かえで→みたま→黒江'],
    ['③','灯花→ねむ→天音姉妹→みふゆ→アリナ'],
    ['④','まどか→さやか→マミ→杏子→ほむら'],
    ['⑤','①〜④の逆順'],
    ['⑥','ももこ→やちよ→鶴乃→みふゆ→みたま'],
    ['⑦','いろは→うい→灯花→ねむ→アリナ'],
    ['⑧','まどか→さやか→マミ→杏子'],
    ['⑨','①〜⑦のいずれかで、5人目が小さいキュゥべえ']
  ];
  // BIG終了画面（出典: ちょんぼりすた様 universal-slot/228995 の「BIG終了画面」の画像内の表記。
  // 本文には画面名と示唆が書かれていないため、夢爽が画像を確認して文字起こししたものを正とする
  // 2026-09-30）。以前は終了画面の専用記事（magireco/235633）の本文だけを見て示唆を
  // 非公表として扱っていたが、本ページの画像に示唆が明記されていたので作り直した。
  // 確定演出の4つ（水着みかづき荘・キービジュアル2種・小さいキュゥべえ）は rank を付けて
  // 確定演出集計と推測の除外に使う。示唆の4つは飛び値・強弱示唆で振り分けの数値が
  // 公表されていないため rank なし（§9-54 の1L選定対象外でもある）。
  // 既存キー（default／mizugi／keyvis2nd／keyvis1st／kyubey）は保存済みデータを
  // 引き継ぐため変えていない。
  const BIG_SCREENS=[
    ['default','デフォルト','デフォルト',0],
    ['irohaFelicia','いろは＆フェリシア','設定3・5・6示唆',0],
    ['irohaSana','いろは＆さな','設定2・4・6示唆',0],
    ['irohaYachiyoTsuruno','いろは＆やちよ＆鶴乃','高設定示唆(弱)',0],
    ['irohaYachiyoMomoko','いろは＆やちよ＆ももこチーム','高設定示唆(強)',0],
    ['mizugi','水着みかづき荘','設定2以上濃厚',2],
    ['keyvis2nd','2nd Season キービジュアル','設定4以上濃厚',4],
    ['keyvis1st','1st Season キービジュアル','設定5以上濃厚',5],
    ['kyubey','小さいキュゥべえ','設定6濃厚',6]
  ];
  const CHARS=[
    ['p1to4','①〜④','デフォルト',0],
    ['p5','⑤（①〜④の逆順）','高設定期待度UP（弱）',0],
    ['p6to8','⑥〜⑧','高設定期待度UP（強）',0],
    ['p9','⑨（小さいキュゥべえ）','設定5以上濃厚',5]
  ];
  const ED_CARDS=[
    ['zekkou','絶交階段のウワサ','奇数設定 期待度UP（弱）',0],
    ['fukurou','フクロウの幸運水のウワサ','奇数設定 期待度UP（強）',0],
    ['machibito','マチビト馬のウワサ','偶数設定 期待度UP（弱）',0],
    ['hitoribocchi','ひとりぼっちの最果てのウワサ','偶数設定 期待度UP（強）',0],
    ['kioku','記憶ミュージアムのウワサ','高設定 期待度UP（弱）',0],
    ['mannenzakura','万年桜のウワサ','高設定 期待度UP（強）',0],
    ['sekichuugyo','石中魚の魔女','設定2否定',0],
    ['tachimimi','立ち耳の魔女','設定3否定',0],
    ['furiko','振子の魔女','設定4否定',0],
    ['iinchou','委員長の魔女','設定1否定＆高設定期待度UP',2],
    ['yodaka','ヨダカの魔女','設定4否定＆高設定期待度UP',0],
    ['butaisouchi','舞台装置の魔女','設定4以上濃厚',4]
  ];
  const STORY=[
    ['oddLow','奇数設定期待度UP','1→2→3→4→5 ／ 1→3→2→4→5 ／ 3→1→2→4→5',0],
    ['oddHigh','奇数かつ高設定期待度UP','1→2→3→5→4 ／ 1→3→2→5→4 ／ 3→1→2→5→4',0],
    ['evenLow','偶数設定期待度UP','2→1→3→4→5 ／ 2→4→1→3→5 ／ 4→1→2→3→5',0],
    ['evenHigh','偶数かつ高設定期待度UP','2→1→3→5→4 ／ 2→4→1→5→3 ／ 4→1→2→5→3',0],
    ['deny1','設定1否定','5→1→2→3→4',2],
    ['deny2','設定2否定','5→2→1→3→4 ／ 5→4→2→1→3',0],
    ['deny3','設定3否定','5→3→1→2→4',0],
    ['deny1High','設定1否定かつ高設定期待度UP','5→4→3→1→2',2],
    ['descAll','全て降順','設定5以上濃厚（5→4→3→2→1）',5]
  ];
  const EPISODES=[
    ['yachiyo','やちよ','設1:28.1%⇔設6:23.4%',0],
    ['tsuruno','鶴乃','設1:28.1%⇔設6:14.1%',0],
    ['sana','さな','設1:21.9%⇔設6:31.3%',0],
    ['felicia','フェリシア','設1:21.9%⇔設6:25.0%',0],
    ['kuroe','黒江','設1・2:0.1%⇔設5・6:6.3%',0]
  ];
  const GROUPS=[
    ['plates','ユニバプレート',PLATES,false,'AT終了画面でサブ液晶に出た色を記録します。ホールが任意で表示する店長カスタムもあるため、出たときだけ記録してください。'],
    ['bigScreens','BIG終了画面',BIG_SCREENS,true,'BIGの終了画面を毎回記録します。キャラ単体など下記以外の画面はすべてデフォルトです。水着みかづき荘・キービジュアル2種・小さいキュゥべえは確定演出なので設定推測にも使います。設定3・5・6示唆と設定2・4・6示唆、高設定示唆の弱・強は、振り分けの数値が公表されていないため記録のみです。'],
    ['atScreens','AT終了画面',AT_SCREENS,true,'ATが終わった時の画面を記録。キャラなしの画面は背景が数種類ありますが、どれもデフォルトです。「まどか＆いろは」は設定6濃厚なので設定推測にも使います。設定3・5・6示唆と設定2・4・6示唆の2つは、振り分けの数値が公表されていないため記録のみです。'],
    ['chars','キャラ紹介',CHARS,true,'紹介メンバーの並びでパターンを判別。ストーリーコンプリート後、またはエンブリオ・イブ覚醒中のSTORY当選時に出現するキャラ紹介シナリオで設定を示唆します。パターンが分からなかった回は記録しないでください。\n'+CHAR_MEMBERS.map(c=>c[0]+' '+c[1]).join('\n')],
    ['edCards','エンディング中のカード',ED_CARDS,true,'エンディング中のレア役成立時にサブ液晶へ出ます。出たカードをそのまま記録してください。'],
    ['story','ストーリーの順番',STORY,true,'AT中のストーリー紹介順を記録します。1話または3話スタートは奇数示唆系、2話または4話スタートは偶数示唆系、5話スタートは否定系で、降順が崩れた部分の設定を否定します（5→1なら1否定、5→4→2なら2否定）。全て降順なら設定5以上濃厚です。'],
    ['episodes','エピソード選択',EPISODES,true,'黒江チャレンジ経由の回は記録しません。黒江チャレンジ経由・ドッペルモード（いろは）・フリーズ（うい）のエピソードは記録しないでください。黒江の選択率に特大の設定差があり、設定1・2では0.1%でしか選ばれません。']
  ];
  const MITAMA=[
    ['blueR','blueW','発展（青）','報酬レベル2'],
    ['greenR','greenW','発展（緑）','報酬レベル3']
  ];
  const REFERENCE=[
    ['BIG終了画面','示唆タブで画面ごとに記録できます。確定演出の4種は設定推測にも使い、示唆系4種は振り分けが非公表のため記録のみです'],
    ['AT終了画面','示唆タブで画面ごとに記録できます。ユニバプレートはこの画面のサブ液晶に出ます'],
    ['魔法少女モード選択率','高設定ほどいろは以外から始まりやすいが、遊技中にモードを確定できないため対象外'],
    ['高確移行率','AT後・BB後の移行率に設定差があるが、遊技中に滞在状態を判定できないため対象外']
  ];
  // 規定ptゾーンの到達／当選（記録のみ）。
  // ゾーンごとの当選率は理論値・実戦値のどちらも公表されていないため、サブラベルは空にし、
  // 設定推測にも使わない。数値が使えるようになったらサブを足すだけで済む形にしてある。
  const ZONES=['100','200','300','400','500','600','700','800'];
  const GAME_SRC=[['unimemo','ユニメモで記録'],['real','実機の通常ゲーム数で記録']];
  const MERGE_KEYS=['counts','rates','zones','plates','bigScreens','atScreens','chars','edCards','story','episodes','mitama'];
  const DEF={
    // gamesApp＝ユニメモの通常プレイ数（AT・ボーナス初当りの分母）
    // gamesAppTotal＝ユニメモの総プレイ数（弱チェリーの分母。ユニメモの小役欄と同じ分母）
    // cherryApp＝ユニメモの弱チェリー回数。実機モードでは counts.weakCherry のタップ回数を使う
    games:0,gameSrc:'unimemo',gamesApp:0,gamesAppTotal:0,cherryApp:0,gamesStart:0,gamesNow:0,
    counts:{at:0,bonus:0,weakCherry:0},
    rates:{suikaCzr:0,suikaCzw:0},
    zones:Object.fromEntries(ZONES.flatMap(z=>[['p'+z+'r',0],['p'+z+'w',0]])),
    ...Object.fromEntries(GROUPS.map(g=>[g[0],Object.fromEntries(g[2].map(c=>[c[0],0]))])),
    mitama:{blueR:0,blueW:0,greenR:0,greenW:0},img:null,iconChoice:null
  };
  function n(obj,key){return Number((obj||{})[key])||0;}
  function num(v){const x=Number(v);return Number.isFinite(x)?Math.max(0,Math.floor(x)):0;}
  function zoneReach(S){return ZONES.reduce((a,z)=>a+n(S.zones,'p'+z+'r'),0);}
  function zoneWin(S){return ZONES.reduce((a,z)=>a+n(S.zones,'p'+z+'w'),0);}
  function groupTotal(S,key){return GROUPS.find(g=>g[0]===key)[2].reduce((a,c)=>a+n(S[key],c[0]),0);}
  function gameSrcOf(S){return (S&&S.gameSrc)==='real'?'real':'unimemo';}
  function rawDenom(S){return gameSrcOf(S)==='real'?num(S.gamesNow)-num(S.gamesStart):num(S.gamesApp);}
  function denom(S){const v=rawDenom(S);return v>0?v:0;}
  // 打ち始めより現在が小さいときだけ注意を出す。現在が未入力(0)の間は入力途中とみなす。
  function denomWarn(S){return gameSrcOf(S)==='real'&&num(S.gamesNow)>0&&num(S.gamesNow)<num(S.gamesStart);}
  function syncGames(S){if(S)S.games=denom(S);return S?S.games:0;}
  // 弱チェリーだけ分母と回数の出どころがモードで変わる（§9-84。ここだけを正本にする）。
  // ユニメモ：小役欄と同じ「総プレイ数」を分母にし、回数もユニメモの値を使う。
  // 実機：通常ゲーム数の差分を分母にし、通常時にタップした回数を使う。
  function cherryDenom(S){return gameSrcOf(S)==='real'?denom(S):num(S.gamesAppTotal);}
  function cherryHit(S){return gameSrcOf(S)==='real'?n(S.counts,'weakCherry'):num(S.cherryApp);}
  function rate(g,c){return g>0&&c>0?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:`${a}/0 —`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function section(title,lines){return lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';}
  function denomProbs(key){return Object.fromEntries(SETTINGS.map(s=>[s,1/DENOMS[key][s]]));}
  function bayesExclusions(S){
    return [
      ...PLATES.map(c=>({label:'ユニバプレート '+c[1],count:n(S.plates,c[0]),exclude:SETTINGS.filter(s=>s<c[3])})),
      // BIG終了画面の確定演出。rank から除外する設定を作るのでラベルと同じ1箇所で完結する。
      ...BIG_SCREENS.filter(c=>c[3]>0).map(c=>({label:'BIG終了画面 '+c[1],count:n(S.bigScreens,c[0]),exclude:SETTINGS.filter(s=>s<c[3])})),
      {label:'AT終了画面 まどか＆いろは',count:n(S.atScreens,'madokaIroha'),exclude:[1,2,3,4,5]},
      {label:'キャラ紹介 ⑨小さいキュゥべえ',count:n(S.chars,'p9'),exclude:[1,2,3,4]},
      {label:'EDカード 石中魚の魔女',count:n(S.edCards,'sekichuugyo'),exclude:[2]},
      {label:'EDカード 立ち耳の魔女',count:n(S.edCards,'tachimimi'),exclude:[3]},
      {label:'EDカード 振子の魔女',count:n(S.edCards,'furiko'),exclude:[4]},
      {label:'EDカード 委員長の魔女',count:n(S.edCards,'iinchou'),exclude:[1]},
      {label:'EDカード ヨダカの魔女',count:n(S.edCards,'yodaka'),exclude:[4]},
      {label:'EDカード 舞台装置の魔女',count:n(S.edCards,'butaisouchi'),exclude:[1,2,3]},
      {label:'ストーリー 設定1否定',count:n(S.story,'deny1'),exclude:[1]},
      {label:'ストーリー 設定2否定',count:n(S.story,'deny2'),exclude:[2]},
      {label:'ストーリー 設定3否定',count:n(S.story,'deny3'),exclude:[3]},
      {label:'ストーリー 設定1否定かつ高設定',count:n(S.story,'deny1High'),exclude:[1]},
      {label:'ストーリー 全て降順',count:n(S.story,'descAll'),exclude:[1,2,3,4]}
    ];
  }
  function certCount(S){return bayesExclusions(S).reduce((a,c)=>a+c.count,0);}
  function bestCert(S){
    const hit=GROUPS.flatMap(g=>g[2].filter(c=>c[3]>0).map(c=>({label:c[1],rank:c[3],value:n(S[g[0]],c[0])})))
      .filter(c=>c.value>0).sort((a,b)=>b.rank-a.rank)[0];
    return hit?`確定演出 ${hit.label}(${hit.rank===6?'6濃厚':hit.rank+'以上'}) ×${hit.value}`:'確定演出 なし';
  }
  function bayesSpec(S){
    const g=denom(S),binomial=[];
    if(g>0)binomial.push({label:'AT初当り',hit:n(S.counts,'at'),total:g,probs:denomProbs('at')});
    // 弱チェリーは分母が別（ユニメモ＝総プレイ数／実機＝通常ゲーム数）
    const cd=cherryDenom(S);
    if(cd>0)binomial.push({label:'弱チェリー',hit:cherryHit(S),total:cd,probs:denomProbs('weakCherry')});
    if(n(S.rates,'suikaCzr')>0)binomial.push({label:'スイカからのCZ当選',hit:n(S.rates,'suikaCzw'),total:n(S.rates,'suikaCzr'),probs:CZ_SOURCE.combined});
    return {settings:SETTINGS,binomial,multinomial:[{label:'エピソード選択',counts:Object.fromEntries(EPISODES.map(c=>[c[0],n(S.episodes,c[0])])),probs:EPISODE_PROBS}],exclusions:bayesExclusions(S)};
  }
  function bayesResult(S){return window.CheckerBayes?window.CheckerBayes.estimate(bayesSpec(S)):{empty:true};}
  function bayesPct(v){return window.CheckerBayes?window.CheckerBayes.percent(v):'--';}
  function bayesExcludedSettings(result){
    const set=new Set();
    (result.reasons||[]).forEach(r=>(r.exclude||[]).forEach(s=>set.add(Number(s))));
    return Array.from(set).sort((a,b)=>a-b);
  }
  function bayesUnder4(S){const r=bayesResult(S);return r.posterior?SETTINGS.filter(s=>s<=3).reduce((a,s)=>a+(r.posterior[s]||0),0):0;}
  function bayesExcludeSummary(S){
    const r=bayesResult(S);
    if(r.contradiction)return row('除外 矛盾',1,true,'#ff5c5c');
    const excluded=bayesExcludedSettings(r);
    return row(excluded.length?'除外 設'+excluded.join(','):'除外 −',excluded.length,excluded.length>0);
  }
  function normalizeState(out){
    out.gameSrc=gameSrcOf(out);
    ['gamesApp','gamesAppTotal','cherryApp','gamesStart','gamesNow'].forEach(k=>{out[k]=num(out[k]);});
    MERGE_KEYS.forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=num(out[key][k]);});
    });
    [['rates','suikaCzr','suikaCzw'],
     ...ZONES.map(z=>['zones','p'+z+'r','p'+z+'w']),
     ...MITAMA.map(c=>['mitama',c[0],c[1]])].forEach(([group,d,w])=>{
      if(out[group][w]>out[group][d])out[group][d]=out[group][w];
    });
    syncGames(out);
    return out;
  }
  function rateRow(ctx,group,d,w,name,sub){
    const a=n(ctx.S[group],w),b=n(ctx.S[group],d);
    const missAttrs=ctx.mode<0&&b<=a?'disabled aria-disabled="true"':`data-bump="${group}.${d}"`;
    return `<div class="crow cycle-row">
      <div class="ct"><b>${name}</b>${sub?`<small>${sub}</small>`:''}</div>
      <div class="pct">${ratio(a,b)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${group}.${d},${group}.${w}" data-label="${name} 当選" aria-label="${name} 当選">当選</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${name} ハズレ" aria-label="${name} ハズレ">ハズレ</button>
      </div>
    </div>`;
  }
  function pageCounts(ctx){
    const S=ctx.S,g=denom(S);
    return pageStyle()+gameSection(ctx)+`<section class="sec"><div class="sec-h">初当り</div>
      <div class="cgrid">
        ${ctx.crow('counts.at','AT初当り',`設1:1/654.6⇔設6:1/416.7${rateSuffix(g,n(S.counts,'at'))}`,1)}
        ${ctx.crow('counts.bonus','ボーナス初当り',`設1:1/240.6⇔設6:1/184.3${rateSuffix(g,n(S.counts,'bonus'))}`,0)}
      </div>
      <div class="hint">ボーナス初当りは記録のみです。AT初当りと連動して動くため、二重に効かせないよう設定推測には使いません。表示と記録だけに使います。</div>
    </section>
    <section class="sec"><div class="sec-h">弱チェリー<span class="sub">設1:1/60.0⇔設6:1/50.0${rateSuffix(cherryDenom(S),cherryHit(S))}</span></div>
      ${gameSrcOf(S)==='unimemo'
        ? `<div class="inrow"><label>ユニメモの弱チェリー回数</label><input type="number" inputmode="numeric" data-number-key="cherryApp" value="${S.cherryApp||''}" placeholder="0"></div>
      <div class="hint">ユニメモの弱チェリー回数をそのまま入力。ユニメモの小役欄と同じ「総プレイ数」を分母にするので、表示される1/xはユニメモの数値と一致します。実機モードに切り替えると、通常時にタップで数える方式（分母は通常ゲーム数）に変わります。設定推測の主力になります。</div>`
        : `<div class="cgrid">${ctx.crow('counts.weakCherry','弱チェリー',`設1:1/60.0⇔設6:1/50.0${rateSuffix(cherryDenom(S),cherryHit(S))}`,1)}</div>
      <div class="hint">通常時の弱チェリーだけ数えます。左リール角チェリー停止時の弱チェリーを通常時のみ記録してください。分母は通常ゲーム数です。ユニメモモードに切り替えると、ユニメモの弱チェリー回数を入力する方式（分母は総プレイ数）に変わります。設定推測の主力になります。</div>`}
    </section>
    <section class="sec"><div class="sec-h">スイカからのCZ当選</div>
      <div class="cgrid">${rateRow(ctx,'rates','suikaCzr','suikaCzw','スイカからのCZ当選','設1:20.3%⇔設6:33.6%')}</div>
      <div class="hint">スイカが成立したら当選・ハズレを記録。マギアチャレンジ・黒江チャレンジのどちらに入った場合も『当選』として記録してください。出典はこの2つを合わせてCZ当選率としています。魔法少女モード『さな』中はスイカのCZ当選率が上がるため、実測はやや高めに出ます。</div>
    </section>
    <section class="sec"><div class="sec-h">規定ptゾーン<span class="sub">${ratio(zoneWin(S),zoneReach(S))}</span></div>
      <div class="cgrid">${ZONES.map(z=>rateRow(ctx,'zones','p'+z+'r','p'+z+'w',z+'pt','')).join('')}</div>
      <div class="hint">各ゾーンに到達したら当選かハズレを記録。「当選」は到達と当選の両方を、「ハズレ」は到達だけを1つ加算します。ゾーンごとの当選率は理論値も実戦値も公表されていないため、設定推測には使わず記録だけを残します。</div>
    </section>`;
  }
  function pageSuggest(ctx){
    const S=ctx.S;
    return pageStyle()+GROUPS.map(([key,title,arr,percent,hint])=>`<section class="sec">
      <div class="sec-h">${title}<span class="sub">計${groupTotal(S,key)}回</span></div>
      <div class="cgrid">${arr.map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3],percent?v=>ctx.pct(v,groupTotal(S,key)):undefined)).join('')}</div>
      <div class="hint">${hint}</div></section>`).join('')+`
    <section class="sec"><div class="sec-h">みたまボーナス「発展」からのAT当選</div>
      <div class="cgrid">${MITAMA.map(c=>{
        const p=MITAMA_PROBS[c[0]==='blueR'?'blue':'green'];
        return rateRow(ctx,'mitama',c[0],c[1],c[2],`${c[3]} 設1:${(p[1]*100).toFixed(1)}%⇔設6:${(p[6]*100).toFixed(1)}%（参考）`);
      }).join('')}</div>
      <div class="hint">見た目と内部が一致しないため参考記録です。見た目と内部の報酬レベルは完全には一致しないため、設定推測には使わず記録だけを残します。主に発展青が報酬レベル2、発展緑が報酬レベル3に対応します。調整屋選択時のAT当選率に設定差はありません。</div>
    </section>
    <section class="sec"><div class="sec-h">参照</div><table class="ref-table"><tbody>${REFERENCE.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`;
  }
  function tplText(ctx){
    const S=ctx.S,g=denom(S);
    let t=`設定判別メモ｜スマスロ マギアレコード\n通常回転 ${g}G / 確定演出${certCount(S)}回\n_______\n`;
    t+=section('初当り',[
      ...[['at','AT初当り'],['bonus','ボーナス初当り']].map(([key,label])=>`${label}▶${n(S.counts,key)}回${rate(g,n(S.counts,key))?'（'+rate(g,n(S.counts,key))+'）':''}`),
      `弱チェリー▶${cherryHit(S)}回${rate(cherryDenom(S),cherryHit(S))?'（'+rate(cherryDenom(S),cherryHit(S))+'）':''}`,
      `スイカCZ▶${ratio(n(S.rates,'suikaCzw'),n(S.rates,'suikaCzr'))}`
    ]);
    t+=section('規定ptゾーン',ZONES.filter(z=>n(S.zones,'p'+z+'r')>0)
      .map(z=>`${z}pt▶${ratio(n(S.zones,'p'+z+'w'),n(S.zones,'p'+z+'r'))}`));
    GROUPS.forEach(([key,title,arr,percent])=>{
      const total=groupTotal(S,key);
      t+=section(title,arr.filter(c=>n(S[key],c[0])>0).map(c=>`${c[1]}▶${n(S[key],c[0])}回${percent&&total>0?' ('+(100*n(S[key],c[0])/total).toFixed(0)+'%)':''}`));
    });
    t+=section('みたまボーナス「発展」',MITAMA.filter(c=>n(S.mitama,c[0])>0).map(c=>`${c[2]}▶${ratio(n(S.mitama,c[1]),n(S.mitama,c[0]))}`));
    return t+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detailRatio(S,group,d,w,label){return {label,value:n(S[group],w),text:label+' '+ratio(n(S[group],w),n(S[group],d)),show:n(S[group],d)>0};}
  function detail(ctx){
    const S=ctx.S,g=denom(S);
    return [
      {title:'初当り',items:[
        ...[['at','AT初当り'],['bonus','ボーナス初当り']].map(([key,label])=>({label,value:n(S.counts,key),hot:key!=='bonus',text:label+' '+countRate(g,n(S.counts,key)),show:n(S.counts,key)>0})),
        {label:'弱チェリー',value:cherryHit(S),hot:true,text:'弱チェリー '+countRate(cherryDenom(S),cherryHit(S)),show:cherryHit(S)>0},
        detailRatio(S,'rates','suikaCzr','suikaCzw','スイカCZ')
      ]},
      {title:'規定ptゾーン',items:ZONES.map(z=>detailRatio(S,'zones','p'+z+'r','p'+z+'w',z+'pt'))},
      ...GROUPS.map(([key,title,arr,percent])=>({title,percent,denominator:percent?groupTotal(S,key):0,items:arr.map(c=>({label:c[0]==='deny1High'?'設定1否定かつ高設定':c[1],value:n(S[key],c[0]),hot:c[3]>0}))})),
      {title:'みたまボーナス「発展」',items:MITAMA.map(c=>detailRatio(S,'mitama',c[0],c[1],c[2]))}
    ];
  }
  function shown(S,key,title){return title+' '+(GROUPS.find(g=>g[0]===key)[2].filter(c=>n(S[key],c[0])>0).map(c=>c[1]+'×'+n(S[key],c[0])).join('・')||'−');}

  function gameSection(ctx){
    const S=ctx.S,src=gameSrcOf(S),g=denom(S);
    const chips=GAME_SRC.map(v=>
      `<button type="button" class="srcchip${v[0]===src?' on':''}" data-action="gameSrc" data-src="${v[0]}" data-label="通常回転数：${v[1]}" aria-pressed="${v[0]===src?'true':'false'}">${v[1]}</button>`
    ).join('');
    return `<section class="sec">
    <div class="sec-h">通常回転数<span class="sub">分母 ${g}G</span></div>
    <style>
      .srcchips{display:flex;gap:8px;margin-bottom:10px}
      .srcchip{flex:1;min-height:48px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#cfc7da;font-weight:800;font-size:13px;padding:6px 8px;line-height:1.25}
      .srcchip.on{border-color:#ff3d8f;background:rgba(255,61,143,.16);color:#fff}
      .gsrc[hidden]{display:none}
      .hint.warn{color:#ff9b9b}
    </style>
    <div class="srcchips" role="group" aria-label="通常回転数の入力ソース">${chips}</div>
    <div class="gsrc" data-gsrc="unimemo"${src==='unimemo'?'':' hidden'}>
      <div class="inrow"><label>総プレイ数</label><input type="number" inputmode="numeric" data-number-key="gamesAppTotal" value="${S.gamesAppTotal||''}" placeholder="0"></div>
      <div class="inrow" style="margin-top:6px"><label>通常プレイ数</label><input type="number" inputmode="numeric" data-number-key="gamesApp" value="${S.gamesApp||''}" placeholder="0"></div>
      <div class="hint">ユニメモの総プレイ数と通常プレイ数を入力。弱チェリーは総プレイ数、AT・ボーナス初当りは通常プレイ数で計算します（AT初当りの解析値は通常時あたりのため）。どちらも公式アプリ『ユニメモ』の基本情報の表記どおりです。着席時にログインしていれば、自分の遊技分だけが集計されるのでそのまま使えます。</div>
    </div>
    <div class="gsrc" data-gsrc="real"${src==='real'?'':' hidden'}>
      <div class="inrow"><label>打ち始め時の通常ゲーム数</label><input type="number" inputmode="numeric" data-number-key="gamesStart" value="${S.gamesStart||''}" placeholder="0"></div>
      <div class="inrow"><label>現在の通常ゲーム数</label><input type="number" inputmode="numeric" data-number-key="gamesNow" value="${S.gamesNow||''}" placeholder="0"></div>
      ${denomWarn(S)?'<div class="hint warn">現在の通常ゲーム数が打ち始めを下回っています。分母は0として扱い、確率表示は行いません。入力を確認してください。</div>':''}
      <div class="hint">実機の通常ゲーム数を2回見て入れます。打ち始めた時点と現在の2回確認して入力してください。差分があなたの遊技分になります。朝イチから打っている場合は打ち始め0で構いません。</div>
    </div>
  </section>`;
  }


  function pageStyle(){
    return `<style>
      .cycle-row .ct,.count-row .ct{flex:1;min-width:0}
      .cycle-row .ct b,.count-row .ct b{font-size:16px}.cycle-row .ct b,.cycle-row .ct small,.count-row .ct b,.count-row .ct small{display:block}.cycle-row .ct small,.count-row .ct small{font-size:13px;color:var(--muted);line-height:1.35}
      .cycle-row .pct,.count-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      /* 畳んだ説明の中で改行を活かす（キャラ紹介のパターン別メンバーを1行1パターンで出すため）。
         エンジンは畳む側を textContent で入れるので、改行はこの指定がないと詰まってしまう。
         改行を含まない説明の見え方は変わらない。 */
      .hint-body{white-space:pre-line}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .bayes-main{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#171220;border:1px solid #2c2340;border-radius:10px;padding:10px 12px;margin:8px 0}.bayes-main b{color:#ffc94d;font-size:18px}.bayes-main span{color:#9a90a8;font-size:13px}
      .bayes-bar{display:grid;grid-template-columns:44px 1fr 48px;gap:8px;align-items:center;margin:6px 0;font-size:12px;color:#9a90a8}.bayes-bar b{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,#ff3d8f,#ffc94d);min-width:2px}.bayes-bar em{font-style:normal;text-align:right;color:#f2eef5}
    </style>`;
  }

  function pageBayes(ctx){
    const S=ctx.S,r=bayesResult(S);
    let body='';
    if(r.contradiction){
      body='<div class="hint hot">⚠記録に矛盾があります（示唆の見間違いの可能性）。</div>';
    }else if(r.empty){
      body='<div class="hint">記録が増えると推定できます。</div>';
    }else{
      const excluded=bayesExcludedSettings(r);
      const bars=SETTINGS.map(setting=>{
        const p=(r.posterior||{})[setting]||0;
        return `<div class="bayes-bar"><span>設定${setting}</span><b style="width:${Math.max(2,p*100)}%"></b><em>${bayesPct(p)}</em></div>`;
      }).join('');
      const reasons=(r.reasons||[]).map(x=>`${x.label}×${x.count}`).join('、');
      body=`<div class="bayes-main"><b>設定4以上 ${bayesPct(r.high)}</b><span>設定3以下 ${bayesPct(bayesUnder4(S))}</span></div>
      <div class="bayes-bars">${bars}</div>
      <div class="hint">除外根拠：${reasons||'なし'}${excluded.length?'（除外済み：設定'+excluded.join('・')+'）':''}</div>
      <div class="hint">ボーナス初当りとみたまボーナスは推測に使いません。AT初当りと連動する項目、見た目と内部が一致しない項目のため、記録だけにとどめています。</div>
      <div class="hint">推定は入力されたカウントに基づく参考値です。サンプルが少ないほど信頼度は下がります。</div>`;
    }
    return pageStyle()+`<section class="sec"><div class="sec-h">設定推測</div>
    <div class="hint">記録した内容から、各設定である可能性を%で表示します。</div>${body}</section>`;
  }

  window.CheckerConfigs.magireco={
    uiV2:true,nanaCollab:false,storageKey:'magireco-checker-v1',defaults:DEF,mergeKeys:MERGE_KEYS,
    sourceUrl:'https://chonborista.com/slot/universal-slot/228995/',
    sources:[{url:'https://chonborista.com/slot/universal-slot/228995/',date:'2026-09-29',type:'official'}],
    normalizeState,
    actions:{gameSrc:(ctx,ds)=>{
      const v=ds.src==='real'?'real':'unimemo';
      if(gameSrcOf(ctx.S)===v)return false;
      ctx.S.gameSrc=v;syncGames(ctx.S);
      return '通常回転数：'+GAME_SRC.find(x=>x[0]===v)[1];
    }},
    share:{title:'スマスロ マギアレコード 設定判別メモ',hashtags:'#マギレコ #設定判別'},
    pages:(ctx,pageCard)=>{syncGames(ctx.S);return [()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageBayes(ctx),pageCard];},
    template:tplText,compactTemplate:tplText,
    card:{
      title:'スマスロ マギアレコード',titleFitMax:680,gameLabel:'通常',footerTags:'#マギレコ #設定判別',
      downloadName:'magireco_check.png',detailDownloadName:'magireco_check_detail.png',detail,
      blocks:ctx=>{
        const S=ctx.S,g=syncGames(S);
        const cc=cherryHit(S),cr=rate(cherryDenom(S),cc);
        return [['通常回転',g+'G'],...[['at','AT初当り']].map(([key,label])=>{
          const c=n(S.counts,key),r=rate(g,c);return [r?`${label} ${c}回`:label,r||c+'回'];
        }),[cr?`弱チェリー ${cc}回`:'弱チェリー',cr||cc+'回'],['確定演出','計'+certCount(S)+'回']];
      },
      chart:ctx=>({title:'カウント分布',x:130,step:200,width:80,items:[
        {label:'AT',value:n(ctx.S.counts,'at')},{label:'ボーナス',value:n(ctx.S.counts,'bonus')},
        {label:'弱チェ',value:cherryHit(ctx.S)},{label:'CZ当選',value:n(ctx.S.rates,'suikaCzw')}
      ]}),
      bottom:ctx=>{
        const S=ctx.S,g=syncGames(S);
        // 左列が6行になったので行間を詰める。最終行 752+5*36=932 で、
        // フッタ（slot-tools.jp・y=976）に掛からない上限 936 の内側に収める。
        return {title:'サマリー',startY:752,rowGap:36,fontSize:22,columns:[
          {x:70,items:[row(bestCert(S),certCount(S),certCount(S)>0,'#ffc94d'),row(`通常回転 ${g}G`,g),
            row('AT初当り '+countRate(g,n(S.counts,'at')),n(S.counts,'at')),
            row('ボーナス '+countRate(g,n(S.counts,'bonus')),n(S.counts,'bonus')),
            row('弱チェリー '+countRate(cherryDenom(S),cherryHit(S)),cherryHit(S)),
            row('規定ptゾーン '+ratio(zoneWin(S),zoneReach(S)),zoneReach(S))]},
          {x:560,items:[row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
            row('スイカCZ '+ratio(n(S.rates,'suikaCzw'),n(S.rates,'suikaCzr')),n(S.rates,'suikaCzr')),
            row(shown(S,'plates','プレート'),groupTotal(S,'plates')),
            row(shown(S,'episodes','エピソード'),groupTotal(S,'episodes')),bayesExcludeSummary(S)]}
        ]};
      }
    }
  };
})();

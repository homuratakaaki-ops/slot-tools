(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="mhsunbreak-test";
  const TITLE="スマスロ モンスターハンターライズ：サンブレイク";
  const SOURCE="https://chonborista.com/slot/enta-slot/264514/";
  const TAGS="#モンハンサンブレイク #設定判別";
  const COUNTS=[["at","AT初当り","設1:1/349.9⇔設6:1/242.3"]];

  function n(obj,key){return Number((obj||{})[key])||0;}
  function rate(g,c){return (g>0&&c>0)?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  // エンタライズ機種は連動アプリがなく、メニューは総ゲーム数のみ。
  // 通常時のゲーム数を取れないため、AT当選ごとのハマりゲーム数を合計する（§9-70）。
  function hitList(S){return Array.isArray(S.hits)?S.hits:[];}
  function hitCount(S){return hitList(S).length;}
  function hitSum(S){return hitList(S).reduce((a,b)=>a+(Number(b)||0),0);}
  function syncGames(S){if(S)S.games=hitSum(S);return S?S.games:0;}
  function initialBlock(S,c){const v=hitCount(S),r=rate(hitSum(S),v);return r?[c[1]+' '+v+'回',r]:[c[1],v+'回'];}
  function initialDetail(S){return {title:'初当り',items:[{label:'AT初当り',value:hitCount(S),text:'AT初当り '+countRate(hitSum(S),hitCount(S)),show:hitCount(S)>0,hot:false}]};}
  function hitSection(S){
    const rows=hitList(S).map((v,i)=>`<div class="crow hit-row"><div class="lbl"><div class="nm">${v}G</div></div><button type="button" class="cycle-btn" data-action="delHit" data-i="${i}">削除</button></div>`).reverse();
    return `<section class="sec">
    <div class="sec-h">AT当選ゲーム数<span class="sub">合計 ${hitSum(S)}G</span></div>
    <div class="inrow"><input type="number" inputmode="numeric" id="hitIn" placeholder="0" aria-label="AT当選ゲーム数"><button type="button" class="cycle-btn" data-action="addHit" data-label="AT当選ゲーム数を追加">追加</button></div>
    <div class="cgrid">${rows.slice(0,3).join('')}</div>
    ${rows.length>3?`<details class="hit-more"><summary>すべて表示（残り${rows.length-3}件）</summary><div class="cgrid">${rows.slice(3).join('')}</div></details>`:''}
    <div class="crow sumrow">
      <div class="lbl"><div class="nm">AT初当り</div><div class="mn">設1:1/349.9⇔設6:1/242.3${rateSuffix(hitSum(S),hitCount(S))}</div></div>
      <div class="num">${hitCount(S)}</div><div class="autotag" aria-hidden="true">自動</div>
    </div>
    <div class="hint">AT当選時に、データカウンターの当選ゲーム数（通常時のハマりゲーム数）を入力します。途中から打ち始めた場合も、表示どおりの数値を入れてください。訂正は一覧の「削除」で行います。</div>
  </section>`;
  }

  const AT_END=[
    ["jay","ジェイ","奇数設定期待度UP",0,"ジ",0],
    ["arlo","アルロー","奇数設定期待度UP",0,"ア",0],
    ["galeas","ガレアス","奇数設定期待度UP",0,"ガ",0],
    ["rondine","ロンディーネ","偶数設定期待度UP",0,"ロ",0],
    ["luchika","ルーチカ","偶数設定期待度UP",0,"ル",0],
    ["fioreneAirou","フィオレーネ＆アイルー","高設定期待度UP(弱)",0,"フ弱",0],
    ["chicheAirouGaruku","チッチェ＆アイルー＆ガルク","高設定期待度UP(強)",0,"チ強",0],
    ["fioreneRondine","フィオレーネ＆ロンディーネ","設定2否定",0,"2否",0],
    ["jayArloGaleas","ジェイ＆アルロー＆ガレアス","設定3否定",0,"3否",0],
    ["hinoeMinoto","ヒノエ＆ミノト","設定2以上濃厚",2,"ヒ2",1],
    ["zenin","全員集合","設定5以上濃厚",5,"全5",1],
    ["entalion","エンタライオン","設定6濃厚",6,"獅6",1]
  ];

  const TROPHY=[
    ["bronze","銅","設定2以上濃厚",2,"銅",1],
    ["silver","銀","設定3以上濃厚",3,"銀",1],
    ["gold","金","設定4以上濃厚",4,"金",1],
    ["momiji","紅葉柄","設定5以上濃厚",5,"紅",1],
    ["rainbow","虹","設定6濃厚",6,"虹",1]
  ];

  const OVER=[
    ["o222","222枚 OVER","設定2以上濃厚",2,"222",1],
    ["o246","246枚 OVER","設定2・4・6濃厚",2,"246",0],
    ["o456","456枚 OVER","設定4以上濃厚",4,"456",1],
    ["o555","555枚 OVER","設定5以上濃厚",5,"555",1],
    ["o666","666枚 OVER","設定6濃厚",6,"666",1]
  ];

  const STAMP=[
    ["blue","青","奇数設定期待度UP",0,"青",0],
    ["yellow","黄","偶数設定期待度UP",0,"黄",0],
    ["green","緑","高設定期待度UP(弱)",0,"緑",0],
    ["red","赤","高設定期待度UP(強)",0,"赤",0],
    ["bronze","銅","設定2以上濃厚",2,"銅",1],
    ["silver","銀","設定3以上濃厚",3,"銀",1],
    ["gold","金","設定4以上濃厚",4,"金",1],
    ["momiji","紅葉柄","設定5以上濃厚",5,"紅",1],
    ["rainbow","虹","設定6濃厚",6,"虹",1]
  ];
  const TEMPLATE="モンハンライズサンブレイク\n\n■BZテーブル1回目\n青ｽﾀｰﾄ        ▶︎ \n黄ｽﾀｰﾄ        ▶︎ \nﾗｲｾﾞｸｽ        ▶︎ \nｾﾙﾚｷﾞｵｽ      ▶︎ \nｵﾛﾐﾄﾞﾛ亜種▶︎ \nﾃｵﾃｽｶﾄﾙ      ▶︎ \nAT               ▶︎ \n\n■BZテーブル2回目以降\n青ｽﾀｰﾄ        ▶︎ \n黄ｽﾀｰﾄ        ▶︎ \nﾗｲｾﾞｸｽ        ▶︎ \nｾﾙﾚｷﾞｵｽ      ▶︎ \nｵﾛﾐﾄﾞﾛ亜種▶︎ \nﾃｵﾃｽｶﾄﾙ      ▶︎ \nAT               ▶︎ \n\n■クエスト成功率\n青ｽﾀｰﾄ        ▶︎ 0/0\n黄ｽﾀｰﾄ        ▶︎ \nﾗｲｾﾞｸｽ        ▶︎ \nｾﾙﾚｷﾞｵｽ      ▶︎ \nｵﾛﾐﾄﾞﾛ亜種▶︎ \nﾃｵﾃｽｶﾄﾙ      ▶︎ \nAT               ▶︎ \n\n■レア役からのBZ当選率\n弱レア\n通常▶︎ 0/0 ・高確▶︎ 0/0 ・超高▶︎ 0/0\n強レア\n通常▶︎ 0/0 ・高確▶︎ 0/0 ・超高▶︎CZ濃厚\n\n■規定リプレイ周期\n①周期▶︎ 0回　②周期▶︎ 0回\n③周期▶︎ 0回　④周期▶︎ 0回\n⑤周期▶︎ 0回\n\nブレイクゾーン▶︎ 0回\nアイルー福引　▶︎ 0回\n\n■ 猛焔一閃直撃\n↪︎BZ突入時に告知される\n\n■AT終了画面\n女(偶数)▶︎ \nﾛﾝﾃﾞｨｰﾈ ▶︎ \nﾙｰﾁｶ       ▶︎ \n\n男(奇数)▶︎ \nｼﾞｪｲ       ▶︎ \nｱﾙﾛｰ       ▶︎ \nｶﾞﾚｱｽ     ▶︎ \n\n高設定弱▶︎ \n↪︎ﾌｨｵﾚｰﾈ&ｱｲﾙｰ\n高設定強▶︎ \n↪︎ﾁｯﾁｪ&ｱｲﾙｰ&ｶﾞﾙｸ\n2否定　▶︎ \n↪︎ﾌｨｵﾚｰﾈ&ﾛﾝﾃﾞｨｰﾈ\n3否定　▶︎ \n↪︎男3人\n2以上　▶︎ \n↪︎ﾋﾉｴ&ﾐﾉﾄ\n5以上　▶︎ \n6確　　▶︎ \n\n■エンディング中スタンプ\n🔵奇  0回・🟡 偶 0回\n🟢弱  0回・🔴 強 0回\n銅 0回・銀 0回・金 0回\n🍁 0回・🌈 0回";
  function ndRow(ctx,opt){
    const canMinus=opt.d>opt.n;
    const missAttrs=ctx.mode<0&&!canMinus?'disabled aria-disabled="true"':`data-bump="${opt.dPath}"`;
    return `<div class="crow cycle-row ${opt.cls||''}">
      <div class="ct"><b>${opt.displayName||opt.name}</b>${opt.sub?`<small class="mn">${opt.sub}</small>`:''}</div>
      <div class="num">${opt.n}</div>
      <div class="pct">${opt.n}/${opt.d}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${opt.dPath},${opt.nPath}" data-label="${opt.name} ${opt.winLabel}" aria-label="${opt.name} ${opt.winLabel}">${opt.winLabel}</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${opt.name} ${opt.missLabel}" aria-label="${opt.name} ${opt.missLabel}">${opt.missLabel}</button>
      </div>
    </div>`;
  }
  const ND_STYLE="      .cycle-row .num{min-width:38px}\n      .cycle-row .ct{flex:1;min-width:0}\n      .cycle-row .ct b,.cycle-row .ct small{display:block}\n      .cycle-row .ct b{font-size:16px}\n      .cycle-row .ct small{font-size:13px;color:var(--muted)}\n      .cycle-row .pct{min-width:92px;text-align:right}\n      .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}\n      .cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}\n      .cycle-btn.win{color:#ffc94d}\n      .minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}\n      .cycle-btn[disabled]{opacity:.4}\n      details.hit-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;list-style:none}\n      details.hit-more>summary::-webkit-details-marker{display:none}\n      details.hit-more>summary::before{content:'▾ ';margin-right:4px}\n      details.hit-more[open]>summary::before{content:'▴ '}\n      .jump-nav button{padding:6px 10px}\n";

  const BZ=[['weakNormal','弱レア 通常'],['weakHigh','弱レア 高確'],['weakSuper','弱レア 超高確'],['strongNormal','強レア 通常'],['strongHigh','強レア 高確']];
  const CYCLE=[['c1','①周期'],['c2','②周期'],['c3','③周期'],['c4','④周期'],['c5','⑤周期']];
  const CZ_TYPE=[['breakzone','ブレイクゾーン'],['airou','アイルー福引']];
  const GROUPS=[
    ['atEnd','AT終了画面',AT_END,'AT終了画面が出たら該当の行を記録します。デフォルト画面は解析に示唆の記載がないため項目を置いていません。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。'],
    ['trophy','エンタトロフィー',TROPHY,'AT終了画面で出現します。出た色の行を記録します。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。'],
    ['over','獲得枚数表示',OVER,'246枚 OVERは設定1・3・5を否定する飛び値の示唆なので、カードの確定演出の欄には出しません。'],
    ['stamp','エンディング中スタンプ',STAMP,'エンディング中のレア役成立時に出たスタンプの色を記録します。']
  ];
  // BZのアイコンテーブル。1個目のアイコンでテーブルが決まる（原本 2026/10/9 更新で確認）。
  // [キー, 丸数字, 短い表示名, 1個目のアイコン, 帯と文字の色]
  const TABLES=[
    ['t1','①','青スタート','QUEST青','#83caff'],
    ['t2','②','黄スタート','QUEST黄','#ffe881'],
    ['t3','③','ライゼクス','ライゼクス','#a9e6ad'],
    ['t4','④','セルレギオス','セルレギオス','#ffb77f'],
    ['t5','⑤','オロミドロ亜種','オロミドロ亜種','#ff9b9b'],
    ['t6','⑥','テオ・テスカトル','テオ・テスカトル','#cbb4ff'],
    ['t7','⑦','AT','AT','#ffc94d']
  ];
  // 画面は「③ ライゼクス」で1行に収める。読み上げ名には番号を残し、色だけに頼らない。
  const TABLE_NAMES=Object.fromEntries(TABLES.map(c=>[c[0],c[1]+' '+c[2]]));
  const TABLE_READS=Object.fromEntries(TABLES.map((c,i)=>[c[0],'テーブル'+(i+1)+' '+c[2]]));
  const TABLE_COLORS=Object.fromEntries(TABLES.map(c=>[c[0],c[4]]));
  // ステージチェンジ時のアイキャッチ。滞在しているBZシナリオを示唆する
  // （出典: https://1geki.jp/slot/l_mh_sun/57/）。[キー,名前,色,示唆,帯と文字の色] は強さ順。
  const EYE=[
    ['jay','ジェイ','白','シナリオB以上濃厚','#f2eef5'],
    ['luchika','ルーチカ','青','シナリオC以上濃厚','#83caff'],
    ['fiorene','フィオレーネ','黄','シナリオD以上濃厚','#ffe881'],
    ['bahari','バハリ','緑','シナリオE以上濃厚','#a9e6ad'],
    ['galeas','ガレアス','赤','シナリオF以上濃厚','#ff9b9b'],
    ['chiche','チッチェ','紫','シナリオG以上濃厚','#cbb4ff']
  ];
  // チッチェのセリフ。次回BZレベルの示唆（出典: 同上）。
  // [キー, 示唆, セリフの見分けどころ]
  const SERIF=[
    ['s1','次回BZレベルHI以上期待度UP(弱)','どちらのクエスト'],
    ['s2','次回BZレベルHI以上期待度UP(強)','おすすめしたいクエスト'],
    ['s3','次回BZレベルHI以上濃厚','重要なクエスト'],
    ['s4','次回BZレベルSP濃厚','珍しい依頼']
  ];
  // 一撃の「ブレイクゾーン当選回数ごと」に準拠し、BZ番号は福引を数えない。
  // true にすると福引も数える（切り替えはこの定数1か所だけで済むようにする）。
  const COUNT_FUKU_AS_CZ=false;
  const AT_SESSION_MAX=50;   // AT間の保存上限。超えたら古い順に捨てる
  const AT_EVENT_MAX=200;    // 1つのAT間に入るイベントの上限（防御。超えたら追加しない）
  const AT_PRIOR_MAX=6;      // ［途中から：既にBZ n回］の n の上限
  const newAtSession=()=>({start:{known:true,prior:0},events:[],closed:false});
  function normalizeAtEvent(e){
    if(!e||typeof e!=='object')return null;
    if(e.t==='bz'&&TABLES.some(c=>c[0]===e.table)&&['win','miss'].includes(e.r))return {t:e.t,table:e.table,r:e.r};
    if(e.t==='fuku'&&['win','miss'].includes(e.r))return {t:e.t,r:e.r};
    if((e.t==='eye'&&EYE.some(c=>c[0]===e.c))||(e.t==='serif'&&SERIF.some(c=>c[0]===e.c)))return {t:e.t,c:e.c};
    return e.t==='otherAt'?{t:e.t}:null;
  }
  function normalizeAtLog(log){
    const sessions=(Array.isArray(log&&log.sessions)?log.sessions:[]).filter(s=>s&&typeof s==='object'&&!Array.isArray(s)).slice(-AT_SESSION_MAX).map(s=>({
      start:s.start&&s.start.known===true?{known:true,prior:Math.max(0,Math.min(AT_PRIOR_MAX,Math.trunc(Number(s.start.prior)||0)))}:{known:false},
      events:(Array.isArray(s.events)?s.events:[]).map(normalizeAtEvent).filter(Boolean).slice(0,AT_EVENT_MAX),
      closed:s.closed===true
    }));
    if(!sessions.length||sessions[sessions.length-1].closed)sessions.push(newAtSession());
    return {sessions:sessions.slice(-AT_SESSION_MAX)};
  }
  const currentAt=S=>S.atLog.sessions[S.atLog.sessions.length-1];
  const countsForNo=e=>e.t==='bz'||(COUNT_FUKU_AS_CZ&&e.t==='fuku');
  function bzNoAt(session,index){return session.start.known?session.start.prior+session.events.slice(0,index+1).filter(countsForNo).length:null;}
  function nextBzNo(session){return session.start.known?session.start.prior+session.events.filter(countsForNo).length+1:null;}
  function atGroupAllowed(S,dKey){const no=nextBzNo(currentAt(S));return no===null||(no===1?dKey==='bzT1':dKey==='bzT2');}
  function appendAtEvent(S,event){
    const session=currentAt(S);
    if(session.events.length>=AT_EVENT_MAX)return false;
    session.events.push(event);
    if(event.t==='otherAt'||(['bz','fuku'].includes(event.t)&&event.r==='win')){
      session.closed=true;
      S.atLog.sessions.push(newAtSession());
      if(S.atLog.sessions.length>AT_SESSION_MAX)S.atLog.sessions.shift();
    }
    return true;
  }
  function canAtStart(S){return S.atLog.sessions.length===1&&!currentAt(S).events.some(e=>e.t==='bz');}
  function atStartAction(ctx,ds){
    if(!canAtStart(ctx.S))return false;
    const prior=Number(ds.prior);
    if(ds.known!=='false'&&(ds.known!=='true'||!Number.isInteger(prior)||prior<0||prior>AT_PRIOR_MAX))return false;
    const start=ds.known==='false'?{known:false}:{known:true,prior};
    if(JSON.stringify(currentAt(ctx.S).start)===JSON.stringify(start))return false;
    currentAt(ctx.S).start=start;
    return '開始：'+(!start.known?'不明':start.prior?'既にBZ'+start.prior+'回':'リセット後・AT後から');
  }
  function atEventText(session,index){
    const e=session.events[index];
    if(e.t==='bz'){
      const no=bzNoAt(session,index);
      return `BZ${no===null?'':no+'回目'} ${TABLE_NAMES[e.table]} ${e.r==='win'?'成功':'失敗'}`;
    }
    if(e.t==='fuku')return '福引 '+(e.r==='win'?'成功':'失敗');
    if(e.t==='eye'){const c=EYE.find(c=>c[0]===e.c);return `アイキャッチ ${c[1]}（${c[2]}）${c[3]}`;}
    if(e.t==='serif')return 'セリフ '+SERIF.find(c=>c[0]===e.c)[1];
    return 'BZ以外でAT当選';
  }
  function atEventAction(ctx,ds){
    if(ctx.mode<0||ds.t==='bz')return false;
    const event=normalizeAtEvent(ds),session=currentAt(ctx.S),index=session.events.length;
    if(!event||!appendAtEvent(ctx.S,event))return false;
    return atEventText(session,index);
  }
  function atDelAction(ctx,ds){
    const index=Number(ds.index),session=currentAt(ctx.S);
    if(ds.index===undefined||ds.index===''||!Number.isInteger(index)||index<0||index>=session.events.length)return false;
    const label=atEventText(session,index);
    session.events.splice(index,1);
    return label+' を削除';
  }
  // テンプレ（なな様テンプレ・収支帳用）の表記。画面の表記とは別に持つ。
  const TPL_TABLES={t1:'①青ｽﾀｰﾄ',t2:'②黄ｽﾀｰﾄ',t3:'③ﾗｲｾﾞｸｽ',t4:'④ｾﾙﾚｷﾞｵｽ',t5:'⑤ｵﾛﾐﾄﾞﾛ亜種',t6:'⑥ﾃｵﾃｽｶﾄﾙ',t7:'⑦AT'};
  const TPL_EYES={jay:'ｼﾞｪｲ(B以上)',luchika:'ﾙｰﾁｶ(C以上)',fiorene:'ﾌｨｵﾚｰﾈ(D以上)',bahari:'ﾊﾞﾊﾘ(E以上)',galeas:'ｶﾞﾚｱｽ(F以上)',chiche:'ﾁｯﾁｪ(G以上)'};
  // s1・s2（期待度UP）はテンプレには載せない。
  const TPL_SERIFS={s3:'ﾁｯﾁｪHI以上濃厚',s4:'ﾁｯﾁｪSP濃厚'};
  // テンプレに入れるかの設定。記録のキー（storageKey）には書かない。
  const PREFS_KEY='mhsunbreak-checker-v1-test-prefs';
  function store(){
    try{return (typeof window!=='undefined'&&window.localStorage)||(typeof localStorage!=='undefined'?localStorage:null);}
    catch(e){return null;}
  }
  function prefs(){
    const s=store();
    if(!s)return {};
    try{const o=JSON.parse(s.getItem(PREFS_KEY));return o&&typeof o==='object'?o:{};}
    catch(e){return {};}
  }
  function tplAtLogOn(){return prefs().tplAtLog!==false;}
  function setTplAtLog(on){
    const s=store();
    if(!s)return;
    try{s.setItem(PREFS_KEY,JSON.stringify(Object.assign(prefs(),{tplAtLog:!!on})));}catch(e){}
  }
  function strongestEye(session){return EYE.filter(c=>session.events.some(e=>e.t==='eye'&&e.c===c[0])).pop();}
  // https://1geki.jp/slot/l_mh_sun/48/ : テーブル1はLOWのみ、1回目がLOWはHのみ。
  // H・Iの3回目はSP＝テーブル7濃厚。Iの1回目はMID以上なのでテーブル1にはならない。
  function scenarioH(session){return !!session.start.known&&session.events.some((e,i)=>e.t==='bz'&&e.table==='t1'&&bzNoAt(session,i)===1);}
  function tplAtFlow(session){
    return session.events.map((e,i)=>{
      if(e.t==='bz'){const no=bzNoAt(session,i);return 'BZ'+(no===null?'?':no)+' '+TPL_TABLES[e.table]+(e.r==='win'?'○':'×');}
      if(e.t==='fuku')return '福引'+(e.r==='win'?'○':'×');
      if(e.t==='otherAt')return 'BZ以外AT';
      if(e.t==='serif')return TPL_SERIFS[e.c]||'';
      return '';
    }).filter(Boolean).join(' → ');
  }
  // ■AT間メモ。イベントのあるAT間だけを古い順に。流れがあれば2行、無ければ見出しの1行。
  // AT間メモが空（またはチェックOFF）のときは1バイトも足さない（v04 と一致）。
  function tplAtLogBlock(S){
    if(!tplAtLogOn())return '';
    const list=(S.atLog&&Array.isArray(S.atLog.sessions)?S.atLog.sessions:[]).filter(s=>s.events.length);
    if(!list.length)return '';
    return '\n\n■AT間メモ\n'+list.map((s,i)=>{
      const eye=strongestEye(s);
      const head='AT間'+(i+1)+(eye?' '+TPL_EYES[eye[0]]:'')+(scenarioH(s)?' ｼﾅﾘｵH濃厚':'');
      // 流れに出すものが無いAT間（アイキャッチだけ・s1/s2だけ）は空行を作らず見出しの1行だけにする
      const flow=tplAtFlow(s);
      return flow?head+'\n'+flow:head;
    }).join('\n');
  }
  function atStartLine(session){return !session.start.known?'開始：不明':session.start.prior?'開始：既にBZ'+session.start.prior+'回':'';}
  function atSummary(session){
    const strongest=strongestEye(session);
    return (strongest?`<div class="at-top" style="--c:${strongest[4]}">${strongest[1]}（${strongest[2]}）：${strongest[3]}</div>`:'<div class="at-top none">アイキャッチ なし</div>')+(scenarioH(session)?'<div class="at-sc">シナリオH濃厚：3回目のBZでAT濃厚</div>':'');
  }
  function atRows(session,editable){return session.events.length?session.events.map((e,i)=>`<div class="crow at-row"><div class="lbl"><div class="nm">${atEventText(session,i)}</div></div>${editable?`<button type="button" class="cycle-btn" data-action="atDel" data-index="${i}">削除</button>`:''}</div>`).join(''):'<div class="hint">まだありません</div>';}
  function atSection(ctx){
    const S=ctx.S,session=currentAt(S),past=S.atLog.sessions.slice(0,-1).filter(s=>s.closed).reverse();
    const disabled=ctx.mode<0?' disabled aria-disabled="true"':'';
    const startButton=(known,prior,label)=>{const selected=session.start.known===known&&(!known||session.start.prior===prior);return `<button type="button" class="at-btn${selected?' on':''}" data-action="atStart" data-known="${known}"${known?` data-prior="${prior}"`:''} aria-pressed="${selected}">${label}</button>`;};
    return `<section class="sec"><div class="sec-h">AT間メモ<span class="sub">過去 ${past.length}件</span></div>
      ${canAtStart(S)?`<div class="bz-sub">このAT間の開始</div><div class="at-pick">${startButton(true,0,'リセット後・AT後から')}${Array.from({length:AT_PRIOR_MAX},(_,i)=>startButton(true,i+1,'既にBZ'+(i+1)+'回')).join('')}${startButton(false,0,'途中から：不明')}</div>`:atStartLine(session)?`<div class="bz-sub">${atStartLine(session)}</div>`:''}
      ${atSummary(session)}<div class="cgrid">${atRows(session,true)}</div>
      ${past.length?`<details class="hit-more"><summary>過去のAT間（${past.length}件）</summary>${past.map((s,i)=>`<div class="at-past"><div class="at-past-h">${i+1}つ前のAT間</div>${atStartLine(s)?`<div class="bz-sub">${atStartLine(s)}</div>`:''}${atSummary(s)}<div class="cgrid">${atRows(s,false)}</div></div>`).join('')}</details>`:''}
      <div class="bz-sub">アイキャッチ（ステージチェンジ）</div><div class="at-pick">${EYE.map(c=>`<button type="button" class="at-btn eye" data-action="atEvent" data-t="eye" data-c="${c[0]}" style="--c:${c[4]}"${disabled}><b>${c[1]}（${c[2]}）</b><small>${c[3]}</small></button>`).join('')}</div>
      <div class="bz-sub">チッチェのセリフ</div><div class="at-pick">${SERIF.map(c=>`<button type="button" class="at-btn" data-action="atEvent" data-t="serif" data-c="${c[0]}" aria-label="セリフ 「${c[2]}」 ${c[1]}"${disabled}><b>「${c[2]}」</b><small>${c[1]}</small></button>`).join('')}</div>
      <div class="bz-sub">アイルー福引</div><div class="at-pick">${['win','miss'].map(r=>`<button type="button" class="at-btn" data-action="atEvent" data-t="fuku" data-r="${r}" aria-label="アイルー福引 ${r==='win'?'成功':'失敗'}"${disabled}>${r==='win'?'成功':'失敗'}</button>`).join('')}</div>
      <div class="bz-sub">そのほか</div><div class="at-pick"><button type="button" class="at-btn" data-action="atEvent" data-t="otherAt"${disabled}>BZ以外でAT</button></div>
      <div class="crow at-pref"><div class="lbl"><div class="nm">AT間メモをテンプレに入れる</div></div><button type="button" class="cycle-btn${tplAtLogOn()?' win':''}" data-action="tplAtLog" role="switch" aria-checked="${tplAtLogOn()}" aria-label="AT間メモをテンプレに入れる">${tplAtLogOn()?'☑ 入れる':'☐ 入れない'}</button></div>
      ${ctx.mode<0?'<div class="hint">減算はテーブル別の回数だけを直します（AT間メモは各行の［削除］か「↩ 取消」で直します）。</div>':''}
      <div class="hint">AT間ごとに、出た順でメモを残します。AT終了から次のAT当選までを1つのAT間として、BZ・アイルー福引・アイキャッチ・チッチェのセリフを押した順に並べます。BZ番号はブレイクゾーンの当選回数で数え、アイルー福引は数えません。据え置きの朝一は前日のAT間の続きなので、［途中から］を選んでください。アイキャッチはステージチェンジで出て、滞在しているBZシナリオを示唆します（AT終了画面の設定示唆とは別の記録です）。BZ成功・福引成功・［BZ以外でAT］を押すと、そのAT間を閉じて次のAT間を始めます。減算はテーブル別の回数だけを直します（AT間メモは各行の［削除］か「↩ 取消」で直します）。テンプレ（収支帳用コピーも）の最後に「■AT間メモ」として出します。入れたくないときは「AT間メモをテンプレに入れる」を押して外してください（この設定は記録とは別に保存します）。設定推測には使いません。出典は一撃様です。</div>
    </section>`;
  }
  // 旧データ（10マス配列メモ）の移行。1個目のアイコンでテーブルを判定する（夢爽承認 2026/10/9）。
  // 旧ログの成功＝クエスト成功＝AT当選なので、新方式の成功と同じ意味。
  const LEGACY_FIRST_ICON={qBlue:'t1',qYellow:'t2',rai:'t3',sel:'t4',oro:'t5',teo:'t6',rush:'t7'};
  function bzQuestAction(ctx,ds){
    const group=BZ_GROUPS.find(g=>g[0]===ds.d);
    if(!group||!TABLES.some(c=>c[0]===ds.q)||!['win','miss'].includes(ds.r))return false;
    const S=ctx.S,[dKey,nKey,title]=group,id=ds.q;
    const keys=ds.r==='win'?[dKey,nKey]:[dKey];
    if(ctx.mode<0){
      if(keys.some(key=>n(S[key],id)<=0)||(ds.r==='miss'&&n(S[dKey],id)<=n(S[nKey],id)))return false;
      keys.forEach(key=>{S[key][id]--;});
    }else{
      if(!atGroupAllowed(S,dKey)||!appendAtEvent(S,{t:'bz',table:id,r:ds.r}))return false;
      keys.forEach(key=>{S[key][id]=n(S[key],id)+1;});
    }
    return `${title} ${TABLE_NAMES[id]} ${ds.r==='win'?'成功':'失敗'}${ctx.mode<0?'を減算':''}`;
  }
  // questN1 / questN2 は、そのグループのテーブル別のBZ成功（AT当選）数。
  // BZのグループ: [回数キー, 成功キー, 見出し]
  const BZ_GROUPS=[['bzT1','questN1','1回目'],['bzT2','questN2','2回目以降']];
  function questD(S,id){return n(S.bzT1,id)+n(S.bzT2,id);}
  // テンプレ・合算表示はグループをまたいだ合計を使う（出力はv02から不変）
  function questHit(S,id){return n(S.questN1,id)+n(S.questN2,id);}
  const zero=arr=>Object.fromEntries(arr.map(c=>[c[0],0]));
  // AT間（AT終了〜次のAT当選）ごとのメモ。順番を残すだけで、確率計算には使わない。
  const DEF={games:0,hits:[],counts:{at:0},bz:Object.fromEntries(BZ.flatMap(c=>[[c[0]+'D',0],[c[0]+'N',0]])),cycle:zero(CYCLE),czType:zero(CZ_TYPE),...Object.fromEntries(GROUPS.map(g=>[g[0],zero(g[2])])),img:null,iconChoice:null,bzT1:zero(TABLES),bzT2:zero(TABLES),questN1:zero(TABLES),questN2:zero(TABLES),atLog:{sessions:[newAtSession()]}};
  const MERGE_KEYS=['counts','bz','cycle','czType',...GROUPS.map(g=>g[0]),'bzT1','bzT2','questN1','questN2'];
  function total(arr,state){return arr.reduce((a,c)=>a+n(state,c[0]),0);}
  function czTotal(S){return total(CZ_TYPE,S.czType);}
  function normalizeState(out,src=out){
    out.atLog=normalizeAtLog(out.atLog);
    out.games=Math.max(0,Number(out.games)||0);
    out.hits=Array.isArray(out.hits)?out.hits.map(v=>Math.max(0,parseInt(v,10)||0)).filter(v=>v>0):[];
    MERGE_KEYS.forEach(key=>{
      const tableKey=BZ_GROUPS.some(([dKey,nKey])=>key===dKey||key===nKey);
      out[key]=tableKey?Object.fromEntries(TABLES.map(([id])=>[id,n(out[key],id)])):Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    });
    BZ.forEach(c=>{out.bz[c[0]+'N']=Math.min(out.bz[c[0]+'N'],out.bz[c[0]+'D']);});
    for(const row of Array.isArray(src&&src.iconLog)?src.iconLog:[]){
      if(!row||!Array.isArray(row.icons)||!BZ_GROUPS.some(g=>g[0]===row.group))continue;
      const first=row.icons[0];
      if(!Object.prototype.hasOwnProperty.call(LEGACY_FIRST_ICON,first))continue;
      const id=LEGACY_FIRST_ICON[first],nKey=row.group==='bzT1'?'questN1':'questN2';
      out[row.group][id]++;
      if(id==='t7'||row.result==='win'||row.quest==='at')out[nKey][id]++;
    }
    delete out.iconLog;
    delete out.iconPending;
    delete out.questN;
    // n≦d をグループごとに保つ（§9-87）
    BZ_GROUPS.forEach(([dKey,nKey])=>{
      TABLES.forEach(([id])=>{out[nKey][id]=Math.min(n(out[nKey],id),n(out[dKey],id));});
    });
    return out;
  }
  function pageInput(ctx){const S=ctx.S;return hitSection(S)+`
  <section class="sec">
    <div class="sec-h">レア役からのBZ当選</div>
    <style>${ND_STYLE}
      .bz-row .pct{min-width:48px;text-align:right}
      .bz-sub{font-size:11px;font-weight:800;color:var(--txt);letter-spacing:.06em;margin-bottom:6px}
    </style>
    ${[['弱レア',BZ.slice(0,3)],['強レア',BZ.slice(3)]].map(([title,rows])=>`
    <div class="bz-sub">${title}</div>
    <div class="cgrid">${rows.map(c=>ndRow(ctx,{cls:'bz-row',name:c[1],displayName:c[1].split(' ')[1],dPath:'bz.'+c[0]+'D',nPath:'bz.'+c[0]+'N',d:n(S.bz,c[0]+'D'),n:n(S.bz,c[0]+'N'),winLabel:'当選',missLabel:'ハズレ'})).join('')}
      ${title==='強レア'?'<div class="crow"><div class="lbl"><div class="nm">超高確</div></div><div class="pct">CZ濃厚</div></div>':''}
    </div>`).join('')}
    <div class="hint">滞在ステージで状態を判断（砂原＝高確示唆、溶岩洞＝超高確示唆）。設定差は公表されていません。記録してサンプルを集める項目です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">規定リプレイ周期</div>
    <div class="cgrid">${CYCLE.map(c=>ctx.crow('cycle.'+c[0],c[1],'',false)).join('')}</div>
    <div class="hint">CZに当選した周期を記録します。設定差は公表されていません。記録してサンプルを集める項目です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">CZ種別</div>
    <div class="cgrid">${CZ_TYPE.map(c=>ctx.crow('czType.'+c[0],c[1],'',false,v=>ctx.pct(v,czTotal(S)))).join('')}</div>
    <div class="hint">当選したCZの種別を記録します。設定差は公表されていません。記録してサンプルを集める項目です。</div>
  </section>`;}
  function pageShisa(ctx){return GROUPS.map(([key,title,arr,hint])=>`<section class="sec">
    <div class="sec-h">${title}<span class="sub">計${total(arr,ctx.S[key])}回</span></div>
    <div class="cgrid">${arr.map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">${hint}</div>
  </section>`).join('');}
  function pageBZ(ctx){const S=ctx.S;return `<style>${ND_STYLE}
    .bz-sub{font-size:11px;font-weight:800;color:var(--txt);letter-spacing:.06em;margin-bottom:6px}
    .quest-row .lbl .nm{font-size:16px;overflow-wrap:anywhere}
    .quest-row .lbl .pct{text-align:left;margin-top:4px}
    /* 色は見分けやすさのため。番号と名前の文字は必ず残す（色だけに頼らない） */
    .quest-row{border-left-width:4px;border-left-color:var(--c,var(--line))}
    .quest-row .lbl .nm{color:var(--c,var(--txt))}
    .at-btn.eye{border-left-width:4px;border-left-color:var(--c,var(--line))}
    .at-btn.eye b{color:var(--c,var(--txt))}
    .at-top{font-size:17px;font-weight:800;line-height:1.3;margin:2px 0 6px;color:var(--c,var(--txt))}
    .at-top.none{font-size:13px;font-weight:700;color:var(--muted)}
    .at-sc{font-size:13px;font-weight:800;color:var(--gold);margin:0 0 6px}
    .at-row{font-size:13px}
    .at-row .lbl{flex:1;min-width:0}
    .at-row .nm{overflow-wrap:anywhere}
    .at-pick{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px}
    .at-btn{min-height:48px;padding:6px 8px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--txt);font:inherit;text-align:left}
    .at-btn b{display:block;font-size:14px;font-weight:800}
    .at-btn small{display:block;font-size:11px;color:var(--muted);line-height:1.3}
    .at-btn.on{border-color:var(--pink-dim);background:rgba(255,61,143,.14);color:var(--pink)}
    .at-btn:disabled{opacity:.4}
    .at-past{margin-top:8px}
    .at-past-h{font-size:11px;font-weight:800;color:var(--muted);margin:8px 0 4px}
    .at-pref{margin-top:8px}
    .at-pref .nm{font-size:13px}
    .at-pref .cycle-btn{min-width:96px}
  </style>`+`<section class="sec">
    <div class="sec-h">テーブル別の結果</div>`+BZ_GROUPS.map(([dKey,nKey,title])=>`
    <div class="bz-sub">${title}${ctx.mode>=0&&!atGroupAllowed(S,dKey)?`<small class="mn">今は${nextBzNo(currentAt(S))}回目</small>`:''}</div>
    <div class="cgrid">${TABLES.map(([id])=>{
      const name=TABLE_NAMES[id];
      const label=title+' '+TABLE_READS[id];
      const hit=n(S[nKey],id),d=n(S[dKey],id);
      const groupDisabled=ctx.mode>=0&&!atGroupAllowed(S,dKey)?' disabled aria-disabled="true"':'';
      const disabled=groupDisabled||(ctx.mode<0&&d<=hit?' disabled aria-disabled="true"':'');
      return `<div class="crow quest-row" style="--c:${TABLE_COLORS[id]}">
        <div class="lbl"><div class="nm">${name}</div><div class="pct">${ctx.pct(hit,d)}</div></div>
        <div class="cycle-actions">
          <button type="button" class="cycle-btn win" data-action="bzQuest" data-d="${dKey}" data-n="${nKey}" data-q="${id}" data-r="win" data-label="${label} 成功" aria-label="${label} 成功"${groupDisabled}>${id==='t7'?'＋':'成功'}</button>
          ${id==='t7'?'':`<button type="button" class="cycle-btn" data-action="bzQuest" data-d="${dKey}" data-q="${id}" data-r="miss" data-label="${label} 失敗" aria-label="${label} 失敗"${disabled}>失敗</button>`}
        </div>
      </div>`;
    }).join('')}</div>
  `).join('')+`<div class="hint">BZ開始時のアイコン1個目でテーブルが決まります。①〜⑦はテーブル1〜7（BZ開始時の1個目のアイコン）です。並んだアイコンの1個目を見てテーブルを選び、BZとその後のクエストが終わったら、ATに当選したかで［成功］［失敗］を押してください。テーブル7はAT濃厚のため［＋］だけを置き、成功として数えます。1回目はAT終了後（朝一を含む）最初のブレイクゾーン、2回目以降はそれ以外です。訂正は減算モードで同じボタンを押します。設定差は公表されていません。記録してサンプルを集める項目です。</div></section>`+atSection(ctx)+`<section class="sec">
    <div class="sec-h">テーブル別 成功率（合算）</div>
    <div class="cgrid">${TABLES.map(([id])=>`<div class="crow quest-row" style="--c:${TABLE_COLORS[id]}" aria-label="${TABLE_READS[id]}"><div class="lbl"><div class="nm">${TABLE_NAMES[id]}</div></div><div class="pct">${ctx.pct(questHit(S,id),questD(S,id))}</div></div>`).join('')}</div>
    <div class="hint">テンプレに出る成功率です（1回目＋2回目以降）</div>
  </section>`;}
  // サブラベルだけを段位表記の出典にする。強さの判定には数値rankを使う。
  function tierText(sub){
    const m=String(sub||'').match(/設定([0-9・]+(?:以上)?)濃厚/);
    if(!m)return '';
    return m[1]==='6'?'6濃厚':m[1];
  }
  function allCert(S){return GROUPS.flatMap((g,i)=>g[2].map((c,j)=>({label:c[1],sub:c[2],rank:c[3],oneL:c[5],value:n(S[g[0]],c[0]),order:i*100+j})).filter(c=>c.rank>0));}
  function certCount(S){return allCert(S).reduce((a,c)=>a+c.value,0);}
  function certTier(S,rank){return allCert(S).filter(c=>c.rank===rank).reduce((a,c)=>a+c.value,0);}
  function hintTotal(S){return GROUPS.reduce((a,g)=>a+total(g[2],S[g[0]]),0);}
  function deniedTotal(S){return n(S.atEnd,'fioreneRondine')+n(S.atEnd,'jayArloGaleas');}
  function bestCert(S){
    const hit=allCert(S).filter(c=>c.oneL===1&&c.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${tierText(hit.sub)}) ×${hit.value}`:'確定演出 なし';
  }
  function shown(title,arr,state){const hits=arr.filter(c=>n(state,c[0])>0).map(c=>(c[4]||c[1])+'×'+n(state,c[0]));return title+' '+(hits.length?hits.join('・'):'—');}
  function tplText(ctx){const S=ctx.S,g=hitSum(S),e=S.atEnd;
    // 正本の空白・異体字セレクタ・改行を保持し、56箇所の値だけ置換する。
    const values=[
      ...TABLES.map(c=>n(S.bzT1,c[0])+'回'),
      ...TABLES.map(c=>n(S.bzT2,c[0])+'回'),
      ...TABLES.map(c=>questHit(S,c[0])+'/'+questD(S,c[0])),
      ...BZ.map(c=>n(S.bz,c[0]+'N')+'/'+n(S.bz,c[0]+'D')),
      ...CYCLE.map(c=>n(S.cycle,c[0])+'回'),
      ...CZ_TYPE.map(c=>n(S.czType,c[0])+'回'),
      n(e,'rondine')+n(e,'luchika'),n(e,'rondine'),n(e,'luchika'),
      n(e,'jay')+n(e,'arlo')+n(e,'galeas'),n(e,'jay'),n(e,'arlo'),n(e,'galeas'),
      n(e,'fioreneAirou'),n(e,'chicheAirouGaruku'),n(e,'fioreneRondine'),n(e,'jayArloGaleas'),n(e,'hinoeMinoto'),n(e,'zenin'),n(e,'entalion'),
      ...STAMP.map(c=>n(S.stamp,c[0])+'回')
    ];
    let i=0;
    const text=TEMPLATE.replace(/0\/0|0回|▶︎ (?=\r?\n)/g,m=>{
      const v=values[i++];
      const s=typeof v==='number'?v+'回':v;
      return m.startsWith('▶')?m+s:s;
    });
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / AT${countRate(g,hitCount(S))}\n_______\n\n${text}${tplAtLogBlock(S)}\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
  }
  function detailItems(arr,state){return arr.map(c=>({label:c[1],value:n(state,c[0]),hot:c[3]>0}));}
  function detail(ctx){const S=ctx.S;return [
    initialDetail(S),
    {title:'レア役からのBZ当選',items:BZ.map(c=>({label:c[1],value:n(S.bz,c[0]+'N'),text:c[1]+' '+n(S.bz,c[0]+'N')+'/'+n(S.bz,c[0]+'D'),show:n(S.bz,c[0]+'D')>0,hot:false}))},
    {title:'規定リプレイ周期',items:detailItems(CYCLE,S.cycle)},
    {title:'CZ種別',items:detailItems(CZ_TYPE,S.czType),percent:true,denominator:czTotal(S)},
    ...GROUPS.map(g=>({title:g[1],items:detailItems(g[2],S[g[0]])}))
  ];}
  window.CheckerConfigs["mhsunbreak-test"]={
    uiV2:true,nanaCollab:true,storageKey:'mhsunbreak-checker-v1-test',defaults:DEF,mergeKeys:MERGE_KEYS,sourceUrl:SOURCE,normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    actions:{
      bzQuest:bzQuestAction,
      // 記録のキーには書かない。テンプレに入れるかだけを別キーに持つ。
      tplAtLog:()=>{const on=!tplAtLogOn();setTplAtLog(on);return 'AT間メモをテンプレに'+(on?'入れます':'入れません');},
      atStart:atStartAction,atEvent:atEventAction,atDel:atDelAction,
      // 素の入力欄を直接読む。減算モードでも追加・削除の意味は変えない。
      addHit:(ctx)=>{
        const el=document.getElementById('hitIn');
        const v=Math.max(0,parseInt(el&&el.value,10)||0);
        if(!v)return false;
        ctx.S.hits=hitList(ctx.S).concat(v);
        if(el)el.value='';
        return `AT当選 ${v}G を追加`;
      },
      delHit:(ctx,ds)=>{
        const i=parseInt(ds.i,10),list=hitList(ctx.S);
        if(!(i>=0&&i<list.length))return false;
        const v=list[i];
        ctx.S.hits=list.slice(0,i).concat(list.slice(i+1));
        return `AT当選 ${v}G を削除`;
      }
    },
    pages:(ctx,pageCard)=>{syncGames(ctx.S);return [()=>pageInput(ctx),()=>pageShisa(ctx),()=>pageBZ(ctx),pageCard];},template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,downloadName:'mhsunbreak_check.png',detailDownloadName:'mhsunbreak_check_detail.png',detail,
      blocks:ctx=>[initialBlock(ctx.S,COUNTS[0]),['通常ゲーム数',hitSum(ctx.S)+'G'],['示唆の記録','計'+hintTotal(ctx.S)+'回'],['確定演出','計'+certCount(ctx.S)+'回']],
      chart:ctx=>({title:'示唆分布',x:150,step:160,width:80,items:[2,3,4,5,6].map(r=>({label:r===6?'6':r+'+',value:certTier(ctx.S,r)}))}),
      bottom:ctx=>{const S=ctx.S;return {title:'サマリー',startY:752,rowGap:36,fontSize:23,columns:[
        {x:70,items:[
          row(bestCert(S),certCount(S),undefined,'#ffc94d'),
          row('AT初当り '+countRate(hitSum(S),hitCount(S)),hitCount(S)),
          row('通常回転 '+hitSum(S)+'G',hitSum(S)),
          row(shown('周期',CYCLE,S.cycle),total(CYCLE,S.cycle)),
          row(shown('CZ',[['breakzone','BZ'],['airou','アイルー']],S.czType),czTotal(S))
        ]},
        {x:560,items:[
          ...GROUPS.map(g=>row(shown(g[1],g[2],S[g[0]]),total(g[2],S[g[0]]))),
          row(deniedTotal(S)>0?'否定系 計'+deniedTotal(S)+'回':'否定系 —',deniedTotal(S))
        ]}
      ]};}
    }
  };

})();

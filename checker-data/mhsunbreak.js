(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="mhsunbreak";
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
  const TEMPLATE="モンハンライズサンブレイク\n\n■BZテーブル1回目\n青ｽﾀｰﾄ        ▶︎ \n黄ｽﾀｰﾄ        ▶︎ \nﾗｲｾﾞｸｽ        ▶︎ \nｾﾙﾚｷﾞｵｽ      ▶︎ \nｵﾛﾐﾄﾞﾛ亜種▶︎ \nﾃｵﾃｽｶﾄﾙ      ▶︎ \nAT               ▶︎ \n\n■BZテーブル2回目以降\n青ｽﾀｰﾄ        ▶︎ \n黄ｽﾀｰﾄ        ▶︎ \nﾗｲｾﾞｸｽ        ▶︎ \nｾﾙﾚｷﾞｵｽ      ▶︎ \nｵﾛﾐﾄﾞﾛ亜種▶︎ \nﾃｵﾃｽｶﾄﾙ      ▶︎ \nAT               ▶︎ \n\n■クエスト成功率\n青ｽﾀｰﾄ        ▶︎ 0/0\n黄ｽﾀｰﾄ        ▶︎ \nﾗｲｾﾞｸｽ        ▶︎ \nｾﾙﾚｷﾞｵｽ      ▶︎ \nｵﾛﾐﾄﾞﾛ亜種▶︎ \nﾃｵﾃｽｶﾄﾙ      ▶︎ \nAT               ▶︎ \n\n■BZ配列メモ\n\n■レア役からのBZ当選率\n弱レア\n通常▶︎ 0/0 ・高確▶︎ 0/0 ・超高▶︎ 0/0\n強レア\n通常▶︎ 0/0 ・高確▶︎ 0/0 ・超高▶︎CZ濃厚\n\n■規定リプレイ周期\n①周期▶︎ 0回　②周期▶︎ 0回\n③周期▶︎ 0回　④周期▶︎ 0回\n⑤周期▶︎ 0回\n\nブレイクゾーン▶︎ 0回\nアイルー福引　▶︎ 0回\n\n■ 猛焔一閃直撃\n↪︎BZ突入時に告知される\n\n■AT終了画面\n女(偶数)▶︎ \nﾛﾝﾃﾞｨｰﾈ ▶︎ \nﾙｰﾁｶ       ▶︎ \n\n男(奇数)▶︎ \nｼﾞｪｲ       ▶︎ \nｱﾙﾛｰ       ▶︎ \nｶﾞﾚｱｽ     ▶︎ \n\n高設定弱▶︎ \n↪︎ﾌｨｵﾚｰﾈ&ｱｲﾙｰ\n高設定強▶︎ \n↪︎ﾁｯﾁｪ&ｱｲﾙｰ&ｶﾞﾙｸ\n2否定　▶︎ \n↪︎ﾌｨｵﾚｰﾈ&ﾛﾝﾃﾞｨｰﾈ\n3否定　▶︎ \n↪︎男3人\n2以上　▶︎ \n↪︎ﾋﾉｴ&ﾐﾉﾄ\n5以上　▶︎ \n6確　　▶︎ \n\n■エンディング中スタンプ\n🔵奇  0回・🟡 偶 0回\n🟢弱  0回・🔴 強 0回\n銅 0回・銀 0回・金 0回\n🍁 0回・🌈 0回";
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
  const ND_STYLE="      .cycle-row .num{min-width:38px}\n      .cycle-row .ct{flex:1;min-width:0}\n      .cycle-row .ct b,.cycle-row .ct small{display:block}\n      .cycle-row .ct b{font-size:16px}\n      .cycle-row .ct small{font-size:13px;color:var(--muted)}\n      .cycle-row .pct{min-width:92px;text-align:right}\n      .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}\n      .cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}\n      .cycle-btn.win{color:#ffc94d}\n      .minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}\n      .cycle-btn[disabled]{opacity:.4}\n";

  const BZ=[['weakNormal','弱レア 通常'],['weakHigh','弱レア 高確'],['weakSuper','弱レア 超高確'],['strongNormal','強レア 通常'],['strongHigh','強レア 高確']];
  const CYCLE=[['c1','①周期'],['c2','②周期'],['c3','③周期'],['c4','④周期'],['c5','⑤周期']];
  const CZ_TYPE=[['breakzone','ブレイクゾーン'],['airou','アイルー福引']];
  const GROUPS=[
    ['atEnd','AT終了画面',AT_END,'AT終了画面が出たら該当の行を記録します。デフォルト画面は解析に示唆の記載がないため項目を置いていません。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。'],
    ['trophy','エンタトロフィー',TROPHY,'AT終了画面で出現します。出た色の行を記録します。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。'],
    ['over','獲得枚数表示',OVER,'246枚 OVERは設定1・3・5を否定する飛び値の示唆なので、カードの確定演出の欄には出しません。'],
    ['stamp','エンディング中スタンプ',STAMP,'エンディング中のレア役成立時に出たスタンプの色を記録します。']
  ];
  const QUEST=[['blue','クエスト青'],['yellow','クエスト黄'],['raizex','ライゼクス'],['serregios','セルレギオス'],['oromidro','オロミドロ亜種'],['teo','テオ・テスカトル'],['at','SUNBREAK RUSH']];
  const ICONS=[['qBlue','Q青'],['qYellow','Q黄'],['rai','ライ'],['sel','セル'],['oro','オロ'],['teo','テオ'],['rush','RUSH'],['gold','＋G'],['blaze','猛焔'],['unknown','？']];
  // テンプレ表記は画面のチップ・発展先ラベルから独立させる。
  const TEMPLATE_ICONS={qBlue:'🔵',qYellow:'🟡',rai:'ﾗ',sel:'ｾ',oro:'ｵ',teo:'ﾃ',rush:'🌈',gold:'＋',blaze:'炎',unknown:'？'};
  const TEMPLATE_QUEST={blue:'青ｽﾀｰﾄ',yellow:'黄ｽﾀｰﾄ',raizex:'ﾗｲｾﾞｸｽ',serregios:'ｾﾙﾚｷﾞｵｽ',oromidro:'ｵﾛﾐﾄﾞﾛ亜種',teo:'ﾃｵﾃｽｶﾄﾙ',at:'AT'};
  function iconLogLines(S){
    return (S.iconLog||[]).map(row=>
      (row.group==='bzT1'?'1回目':'2回目〜')+' '+row.icons.map(k=>TEMPLATE_ICONS[k]).join('')+'→'+TEMPLATE_QUEST[row.quest]+(row.quest==='at'||row.result==='win'?'○':'×'));
  }
  const ICON_KEYS=new Set(ICONS.map(c=>c[0]));
  const ICON_NAMES=Object.fromEntries(ICONS);
  const QUEST_NAMES=Object.fromEntries(QUEST);
  const cleanIcons=list=>(Array.isArray(list)?list:[]).filter(k=>ICON_KEYS.has(k)).slice(0,10);
  function isIconLogRow(row){
    return !!row&&Array.isArray(row.icons)&&cleanIcons(row.icons).length>0&&
      ['bzT1','bzT2'].includes(row.group)&&QUEST.some(c=>c[0]===row.quest)&&['win','miss'].includes(row.result);
  }
  function normalizeIconLog(list){
    return (Array.isArray(list)?list:[]).filter(isIconLogRow).map(row=>({...row,icons:cleanIcons(row.icons)})).slice(-200);
  }
  function iconChip(key){return `<span class="bz-icon bz-icon-${key}">${ICON_NAMES[key]}</span>`;}
  function iconInput(S){
    const pending=S.iconPending;
    return `<section class="sec"><div class="sec-h">初期アイコン配列（メモ）</div>
      <div class="bz-icon-slots">${Array.from({length:10},(_,i)=>`<div class="bz-icon-slot${i===pending.length?' current':''}" aria-label="${i+1}番目${i===pending.length?' 入力位置':''}">${pending[i]?iconChip(pending[i]):''}</div>`).join('')}</div>
      <div class="bz-icon-picks">${ICONS.map(([key,label])=>`<button type="button" class="bz-icon-button" data-action="bzIconAdd" data-icon="${key}" data-label="${label}">${iconChip(key)}</button>`).join('')}</div>
      <div class="bz-icon-tools"><button type="button" class="bz-icon-button" data-action="bzIconBack"${pending.length?'':' disabled'}>1つ戻す</button><button type="button" class="bz-icon-button" data-action="bzIconClear"${pending.length?'':' disabled'}>クリア</button></div>
      <div class="hint">ブレイクゾーン開始時の並びを左から順に押します。途中まででも保存できます。</div>
      <div class="hint">設定差は公表されていません。記録してサンプルを集める項目です。</div>
    </section>`;
  }
  function iconHistory(S){
    const rows=S.iconLog.map((row,index)=>`<div class="bz-icon-log-row"><div class="bz-icon-log-body"><div class="bz-icon-line">${row.icons.map(iconChip).join('')}</div><div>${row.group==='bzT1'?'1回目':'2回目以降'}／${QUEST_NAMES[row.quest]}／${row.result==='win'?'成功':'失敗'}</div></div><button type="button" class="bz-icon-button" data-action="bzIconDel" data-index="${index}">削除</button></div>`).reverse();
    return `<section class="sec"><div class="sec-h">配列メモ<span class="sub">計${rows.length}件</span></div>
      ${rows.length?rows.slice(0,3).join(''):'<div class="hint">まだありません</div>'}
      ${rows.length>3?`<div class="hint"><details><summary>残り${rows.length-3}件を見る</summary>${rows.slice(3).join('')}</details></div>`:''}
    </section>`;
  }
  function bzQuestAction(ctx,ds){
    const group=BZ_GROUPS.find(g=>g[0]===ds.d);
    if(!group||!QUEST.some(c=>c[0]===ds.q)||!['win','miss'].includes(ds.r))return false;
    const S=ctx.S,[dKey,nKey,title]=group,id=ds.q;
    const keys=ds.r==='win'?[dKey,nKey]:[dKey];
    if(ctx.mode<0){
      if(keys.some(key=>n(S[key],id)<=0)||(ds.r==='miss'&&n(S[dKey],id)<=n(S[nKey],id)))return false;
      keys.forEach(key=>{S[key][id]--;});
    }else{
      keys.forEach(key=>{S[key][id]=n(S[key],id)+1;});
      if(S.iconPending.length){
        S.iconLog=normalizeIconLog([...S.iconLog,{icons:[...S.iconPending],group:dKey,quest:id,result:ds.r}]);
        S.iconPending=[];
      }
    }
    return `${title} ${QUEST_NAMES[id]} ${ds.r==='win'?'成功':'失敗'}${ctx.mode<0?'を減算':''}`;
  }
  // BZのグループ: [回数キー, 成功キー, 見出し]
  const BZ_GROUPS=[['bzT1','questN1','1回目'],['bzT2','questN2','2回目以降']];
  function questD(S,id){return n(S.bzT1,id)+n(S.bzT2,id);}
  // テンプレ・合算表示はグループをまたいだ合計を使う（出力はv02から不変）
  function questHit(S,id){return n(S.questN1,id)+n(S.questN2,id);}
  const zero=arr=>Object.fromEntries(arr.map(c=>[c[0],0]));
  const DEF={games:0,hits:[],iconPending:[],iconLog:[],counts:{at:0},bz:Object.fromEntries(BZ.flatMap(c=>[[c[0]+'D',0],[c[0]+'N',0]])),cycle:zero(CYCLE),czType:zero(CZ_TYPE),...Object.fromEntries(GROUPS.map(g=>[g[0],zero(g[2])])),img:null,iconChoice:null,bzT1:zero(QUEST),bzT2:zero(QUEST),questN1:zero(QUEST),questN2:zero(QUEST)};
  const MERGE_KEYS=['counts','bz','cycle','czType',...GROUPS.map(g=>g[0]),'bzT1','bzT2','questN1','questN2'];
  function total(arr,state){return arr.reduce((a,c)=>a+n(state,c[0]),0);}
  function czTotal(S){return total(CZ_TYPE,S.czType);}
  function normalizeState(out,src=out){
    out.iconPending=cleanIcons(out.iconPending);
    out.iconLog=normalizeIconLog(out.iconLog);
    const legacyQuest=src&&src.questN&&typeof src.questN==='object'&&!src.questN1&&!src.questN2;
    out.games=Math.max(0,Number(out.games)||0);
    out.hits=Array.isArray(out.hits)?out.hits.map(v=>Math.max(0,parseInt(v,10)||0)).filter(v=>v>0):[];
    MERGE_KEYS.forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    });
    BZ.forEach(c=>{out.bz[c[0]+'N']=Math.min(out.bz[c[0]+'N'],out.bz[c[0]+'D']);});
    // 旧セーブ（questN＝合算）からの移行。合算の総数は保存する（テンプレ出力を変えないため）。
    if(legacyQuest){
      QUEST.forEach(([id])=>{
        const total=Math.min(Math.max(0,Number(src.questN[id])||0),questD(out,id));
        // 1回目に入るだけ入れ、あふれた分だけを2回目以降に回す。
        out.questN1[id]=Math.min(total,n(out.bzT1,id));
        out.questN2[id]=total-out.questN1[id];
      });
    }
    delete out.questN;
    // n≦d をグループごとに保つ（§9-87）
    BZ_GROUPS.forEach(([dKey,nKey])=>{
      QUEST.forEach(([id])=>{out[nKey][id]=Math.min(n(out[nKey],id),n(out[dKey],id));});
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
    .quest-row .lbl .nm{font-size:16px;overflow-wrap:anywhere}
    .quest-row .lbl .pct{text-align:left;margin-top:4px}
    .bz-icon-slots{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-bottom:8px}
    .bz-icon-slot{min-height:44px;border:1px solid var(--line);border-radius:8px;display:flex;align-items:center;justify-content:center}
    .bz-icon-slot.current{outline:2px solid var(--txt);outline-offset:-2px}
    .bz-icon-picks{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
    .bz-icon-button{min-height:44px;min-width:44px;padding:6px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--txt);font:inherit;font-size:16px}
    .bz-icon-button:disabled{opacity:.4}
    .bz-icon-tools,.bz-icon-line{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
    .bz-icon{display:inline-block;font-size:13px;font-weight:800;white-space:nowrap;border:1px solid currentColor;border-radius:5px;padding:3px}
    .bz-icon-qBlue{color:#83caff}.bz-icon-qYellow{color:#ffe881}
    /* モンスターの色はUI上の識別用。 */
    .bz-icon-rai{color:#a9e6ad}.bz-icon-sel{color:#cbb4ff}.bz-icon-oro{color:#ffb77f}.bz-icon-teo{color:#ff9fbd}
    .bz-icon-gold{color:#e8ca70}.bz-icon-unknown{color:#b5bac4}
    .bz-icon-rush,.bz-icon-blaze{color:#fff;background:linear-gradient(110deg,#85333e,#675000,#246b3e,#275985,#643d89)}
    .bz-icon-log-row{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
    .bz-icon-log-body{flex:1;min-width:0}
  </style>`+iconInput(S)+BZ_GROUPS.map(([dKey,nKey,title])=>`<section class="sec">
    <div class="sec-h">${title}</div>
    <div class="cgrid">${QUEST.map(([id,name])=>{
      const label=title+' '+name;
      const hit=n(S[nKey],id),d=n(S[dKey],id);
      const disabled=ctx.mode<0&&d<=hit?' disabled aria-disabled="true"':'';
      return `<div class="crow quest-row">
        <div class="lbl"><div class="nm">${name}</div><div class="pct">${ctx.pct(hit,d)}</div></div>
        <div class="cycle-actions">
          <button type="button" class="cycle-btn win" data-action="bzQuest" data-d="${dKey}" data-n="${nKey}" data-q="${id}" data-r="win" data-label="${label} 成功" aria-label="${label} 成功">${id==='at'?'＋':'成功'}</button>
          ${id==='at'?'':`<button type="button" class="cycle-btn" data-action="bzQuest" data-d="${dKey}" data-q="${id}" data-r="miss" data-label="${label} 失敗" aria-label="${label} 失敗"${disabled}>失敗</button>`}
        </div>
      </div>`;
    }).join('')}</div>
  </section>`).join('')+`<div class="hint">ブレイクゾーン終了時に、どのアイコンからクエストへ発展したかを記録します。1回目はAT終了後（朝一を含む）最初のブレイクゾーン、2回目以降はそれ以外です。クエストの結果まで見てから［成功］［失敗］を押してください。設定差は公表されていません。記録してサンプルを集める項目です。</div><div class="hint">訂正は減算モードで同じボタンを押します</div>`+`<section class="sec">
    <div class="sec-h">クエスト成功率（合算）</div>
    <div class="cgrid">${QUEST.map(([id,name])=>`<div class="crow quest-row"><div class="lbl"><div class="nm">${name}</div></div><div class="pct">${ctx.pct(questHit(S,id),questD(S,id))}</div></div>`).join('')}</div>
    <div class="hint">テンプレに出る成功率です（1回目＋2回目以降）</div>
  </section>`+iconHistory(S);}
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
      ...QUEST.map(c=>n(S.bzT1,c[0])+'回'),
      ...QUEST.map(c=>n(S.bzT2,c[0])+'回'),
      ...QUEST.map(c=>questHit(S,c[0])+'/'+questD(S,c[0])),
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
    const memo=iconLogLines(S);
    const body=memo.length?text.replace('■BZ配列メモ\n',()=> '■BZ配列メモ\n'+memo.join('\n')+'\n'):text;
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / AT${countRate(g,hitCount(S))}\n_______\n\n${body}\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
  }
  function detailItems(arr,state){return arr.map(c=>({label:c[1],value:n(state,c[0]),hot:c[3]>0}));}
  function detail(ctx){const S=ctx.S;return [
    initialDetail(S),
    {title:'レア役からのBZ当選',items:BZ.map(c=>({label:c[1],value:n(S.bz,c[0]+'N'),text:c[1]+' '+n(S.bz,c[0]+'N')+'/'+n(S.bz,c[0]+'D'),show:n(S.bz,c[0]+'D')>0,hot:false}))},
    {title:'規定リプレイ周期',items:detailItems(CYCLE,S.cycle)},
    {title:'CZ種別',items:detailItems(CZ_TYPE,S.czType),percent:true,denominator:czTotal(S)},
    ...GROUPS.map(g=>({title:g[1],items:detailItems(g[2],S[g[0]])}))
  ];}
  window.CheckerConfigs.mhsunbreak={
    uiV2:true,nanaCollab:true,storageKey:'mhsunbreak-checker-v1',defaults:DEF,mergeKeys:MERGE_KEYS,sourceUrl:SOURCE,normalizeState,
    arrayDefaults:[{key:'iconPending',max:10,filter:k=>ICON_KEYS.has(k)},{key:'iconLog',max:200,filter:isIconLogRow}],
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    actions:{
      bzQuest:bzQuestAction,
      bzIconAdd:(ctx,ds)=>{
        if(!ICON_KEYS.has(ds.icon)||ctx.S.iconPending.length>=10)return false;
        ctx.S.iconPending.push(ds.icon);
        return `アイコン ${ICON_NAMES[ds.icon]} を追加`;
      },
      bzIconBack:ctx=>{
        if(!ctx.S.iconPending.length)return false;
        return `アイコン ${ICON_NAMES[ctx.S.iconPending.pop()]} を戻しました`;
      },
      bzIconClear:ctx=>{
        if(!ctx.S.iconPending.length)return false;
        ctx.S.iconPending=[];return '入力中の配列をクリアしました';
      },
      bzIconDel:(ctx,ds)=>{
        const index=Number(ds.index);
        if(!Number.isInteger(index)||index<0||index>=ctx.S.iconLog.length)return false;
        ctx.S.iconLog.splice(index,1);return '配列メモを削除しました';
      },
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

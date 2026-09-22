(function(){
  'use strict';
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,n,d,hot){return {label,value:Number(n)||0,hot:!!hot,text:label+' '+(d>0?(n+'/'+d+' '+(100*n/d).toFixed(0)+'%'):'—'),show:d>0};}
function detail(ctx){
    const S=ctx.S;
    const zoneN=ZONES.reduce((a,z)=>a+(S.zones[z]||0),0), czN=S.cz.rg+S.cz.ac, atczN=S.atcz.gab+S.atcz.useki, iconN=Object.values(S.icons).reduce((a,b)=>a+b,0), scN=Object.values(S.screens).reduce((a,b)=>a+b,0), edN=Object.values(S.ed).reduce((a,b)=>a+b,0);
    return [
      {title:'規定ゲーム数 当選ゾーン',items:ZONES.map(z=>detailItem(z+'G台',S.zones[z],0)),denominator:zoneN},
      {title:'初当り',items:[detailRatio('CZ 超電磁砲チャンス',S.cz.rg,czN,0),detailRatio('CZ 一方通行チャンス',S.cz.ac,czN,1),detailItem('AT当選',S.atCount,0),detailItem('AT直撃',S.choku,1)]},
      {title:'AT中CZ 振り分け',items:[detailRatio('神の力BATTLE',S.atcz.gab,atczN,0),detailRatio('神の右席BATTLE',S.atcz.useki,atczN,1)]},
      {title:'CZ・AT終了時 アイコン',items:detailItems(ICONS,S.icons),denominator:iconN},
      {title:'藤丸コイン（AT終了画面）',items:detailItems(COINS,S.coins)},
      {title:'AT終了画面',items:detailItems(SCREENS,S.screens),denominator:scN},
      {title:'ED中 お知らせ演出',items:detailItems(ED,S.ed),denominator:edN},
      {title:'獲得枚数表示',items:detailItems(OVER,S.over)}
    ];
  }
  window.CheckerConfigs=window.CheckerConfigs||{};

  const ZONES=[50,100,150,200,300,400,500,600,700,800];
  const DEF={
    games:0,
    zones:Object.fromEntries(ZONES.map(z=>[z,0])),
    cz:{rg:0,ac:0}, atcz:{gab:0,useki:0}, choku:0, atCount:0,
    screens:{s1:0,s2:0,s3:0,s4:0,s5:0,s6:0,s7:0,s8:0},
    ed:{e1:0,e2:0,e3:0,e4:0,e5:0,e6:0,e7:0,e8:0,e9:0},
    icons:{blue:0,green:0,red:0,gold:0,none:0},
    coins:{cu:0,ag:0,au:0,dg:0,rb:0},
    over:{o174:0,o246:0,o456:0,o666:0},
    img:null,
    iconChoice:null
  };
  const SCREENS=[
    ['s1','当麻＆インデックス','奇数設定 期待度UP',0],
    ['s2','黒子＆美琴','偶数設定 期待度UP',0],
    ['s3','打ち止め＆一方通行','高設定 期待度UP（弱）',0],
    ['s4','番外個体＆一方通行','高設定 期待度UP（中）',0],
    ['s5','アリサ＆シャットアウラ','設定2・4・6 濃厚',1],
    ['s6','初春＆美琴（ステージ衣装）','設定4以上 濃厚',1],
    ['s7','当麻ハーレム','設定6 濃厚',1],
    ['s8','その他（残りG示唆等）','アイテム/スクール/グループ等',0]
  ];
  const BAYES_SETTINGS=[1,2,3,4,5,6];
  // AT終了画面の振り分け（出典: ちょんぼりすた様「終了画面の振り分け」2026/9/22 再取得）。
  //        当麻・IDX 美琴・黒子 一方・打止 一方・番外 アリサ  衣装   ハーレム  合計
  // 設定1   45.8%    37.4%     15.4%    1.3%     −      −      −      99.9%
  // 設定2   32.1%    39.2%     16.4%    2.3%    10.0%   −      −     100.0%
  // 設定3   43.6%    35.7%     17.4%    3.4%     −      −      −     100.1%
  // 設定4   26.7%    32.7%     20.2%    8.0%    10.0%  2.4%    −     100.0%
  // 設定5   37.1%    30.3%     21.2%    9.0%     −     2.4%    −     100.0%
  // 設定6   23.8%    29.1%     22.2%   10.0%    10.0%  2.4%   2.4%    99.9%
  // 各行の合計が約100%になることから、この7つが「設定示唆を持つ終了画面」の
  // 完全な振り分けであり、残りG示唆系（アイテム／スクール／グループ／カエル顔の医者）は
  // この振り分けに含まれない。よって s8「その他」は多項分布の試行から除外する。
  // 振り分け表の「ステージ衣装」列は、示唆一覧の「初春・美琴（設定4以上濃厚）」と同じ枠
  // （どちらも設定4以上のみに存在し、示唆内容も一致する）。s6 をこの列に対応させる。
  const SCREEN_BAYES_KEYS=['s1','s2','s3','s4','s5','s6','s7'];
  const SCREEN_PROBS={
    1:{s1:.458,s2:.374,s3:.154,s4:.013,s5:0,   s6:0,   s7:0},
    2:{s1:.321,s2:.392,s3:.164,s4:.023,s5:.100,s6:0,   s7:0},
    3:{s1:.436,s2:.357,s3:.174,s4:.034,s5:0,   s6:0,   s7:0},
    4:{s1:.267,s2:.327,s3:.202,s4:.080,s5:.100,s6:.024,s7:0},
    5:{s1:.371,s2:.303,s3:.212,s4:.090,s5:0,   s6:.024,s7:0},
    6:{s1:.238,s2:.291,s3:.222,s4:.100,s5:.100,s6:.024,s7:.024}
  };
  const ED=[
    ['e1','頑張ったね','奇数設定 期待度UP',0],
    ['e2','調子良いね','偶数設定 期待度UP',0],
    ['e3','ワクワクしてきたかも','高設定 期待度UP（弱）',0],
    ['e4','いけるかも','高設定 期待度UP（中）',0],
    ['e5','やったあ！','設定2以上 濃厚',1],
    ['e6','すごい！すごい！','設定3以上 濃厚',1],
    ['e7','とっても美味しい！','設定4以上 濃厚',1],
    ['e8','すっごくうれしい！','設定5以上 濃厚',1],
    ['e9','おめでとう！','設定6 濃厚',1]
  ];
  const ICONS=[
    ['blue','🔵 青アイコン','AT+10G以上 or Vスト',0],
    ['green','🟢 緑アイコン','AT+30G以上 or Vスト',0],
    ['red','🔴 赤アイコン','AT+50G以上',0],
    ['gold','✨ 金アイコン','AT+100G以上',1],
    ['none','アイコンなし','恩恵なし（分母確定用）',0]
  ];
  const COINS=[
    ['cu','藤丸コイン 銅','設定2以上 濃厚',1],
    ['ag','藤丸コイン 銀','設定3以上 濃厚',1],
    ['au','藤丸コイン 金','設定4以上 濃厚',1],
    ['dg','藤丸コイン デンジャー柄','設定5以上 濃厚',1],
    ['rb','藤丸コイン 虹','設定6 濃厚',1]
  ];
  // 獲得枚数表示（出典: ちょんぼりすた様、2026/9/22 再取得）。
  // 示唆内容ごとに出典の表がまとめている4行をそのまま行にする。
  const OVER=[
    ['o174','174枚OVER','設定2以上 濃厚',1],
    ['o246','246枚OVER','設定2・4・6 濃厚',1],
    ['o456','456枚・1456枚OVER','設定4以上 濃厚',1],
    ['o666','220枚・666枚・777枚・1666枚・1777枚OVER','設定6 濃厚',1]
  ];
  function pageZones(ctx){
    const total=ZONES.reduce((a,z)=>a+ctx.S.zones[z],0);
    return `<section class="sec">
    <div class="sec-h">規定ゲーム数 当選ゾーン<span class="sub">分母＝ゾーン当選 計${total}回</span></div>
    <div class="cgrid two">
      ${ZONES.map(z=>ctx.crow('zones.'+z, z+'G台','',0,n=>ctx.pct(n,total))).join('')}
    </div>
    <div class="hint">当選したゲーム数帯をタップ。分布からモード（通常A：偶数百G／通常B：奇数百G／天国準備：100G毎）を推測します。％は全ゾーン当選に対する割合です。</div>
  </section>`;
  }
  function pageHatsu(ctx){
    const czN=ctx.S.cz.rg+ctx.S.cz.ac, atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
    const g=ctx.S.games;
    return `
  <section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">台のメニュー画面で総ゲーム数を確認して入力します。AT中の消化ゲーム数も含んだ総回転数です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.rg','CZ 超電磁砲チャンス','設1:1/258.5⇔設6:1/227.9',0,n=>ctx.pct(n,czN))}
      ${ctx.crow('cz.ac','CZ 一方通行チャンス','設1:1/2668.5⇔設6:1/2273.0',1,n=>ctx.pct(n,czN))}
      ${ctx.crow('atCount','AT当選','設1:1/398.8⇔設6:1/338.4',0)}
      ${ctx.crow('choku','AT直撃','設1:1/7926.8⇔設6:1/3736.2',1)}
    </div>
    <div class="hint">CZ合算は設1:1/235.6⇔設6:1/207.2。％は通常時CZの内訳（超電磁砲／一方通行）の割合です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">AT中CZ 振り分け</div>
    <div class="cgrid">
      ${ctx.crow('atcz.gab','神の力BATTLE','AT中CZ（約50%）',0,n=>ctx.pct(n,atczN))}
      ${ctx.crow('atcz.useki','神の右席BATTLE','上位CZ 割合に設定差の可能性',1,n=>ctx.pct(n,atczN))}
    </div>
    <div class="hint">⚠ 神の右席の割合はAT獲得枚数・上乗遊技回数でも変化するため参考値です。</div>
  </section>`;
  }
  function num(v){return Math.max(0,Number(v)||0);}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  // 確定演出（片側を完全に潰す示唆）。分母・ラベルの出典はこの1関数にまとめる（§9-84）。
  function bayesExclusions(S){
    return [
      {label:'AT終了画面 アリサ＆シャットアウラ',count:num(S.screens.s5),exclude:[1,3,5]},
      {label:'AT終了画面 初春＆美琴',count:num(S.screens.s6),exclude:[1,2,3]},
      {label:'AT終了画面 当麻ハーレム',count:num(S.screens.s7),exclude:[1,2,3,4,5]},
      {label:'藤丸コイン 銅',count:num(S.coins.cu),exclude:[1]},
      {label:'藤丸コイン 銀',count:num(S.coins.ag),exclude:[1,2]},
      {label:'藤丸コイン 金',count:num(S.coins.au),exclude:[1,2,3]},
      {label:'藤丸コイン デンジャー柄',count:num(S.coins.dg),exclude:[1,2,3,4]},
      {label:'藤丸コイン 虹',count:num(S.coins.rb),exclude:[1,2,3,4,5]},
      {label:'獲得枚数 174枚OVER',count:num(S.over.o174),exclude:[1]},
      {label:'獲得枚数 246枚OVER',count:num(S.over.o246),exclude:[1,3,5]},
      {label:'獲得枚数 456枚・1456枚OVER',count:num(S.over.o456),exclude:[1,2,3]},
      {label:'獲得枚数 220枚・666枚ほかOVER',count:num(S.over.o666),exclude:[1,2,3,4,5]},
      {label:'ED やったあ！',count:num(S.ed.e5),exclude:[1]},
      {label:'ED すごい！すごい！',count:num(S.ed.e6),exclude:[1,2]},
      {label:'ED とっても美味しい！',count:num(S.ed.e7),exclude:[1,2,3]},
      {label:'ED すっごくうれしい！',count:num(S.ed.e8),exclude:[1,2,3,4]},
      {label:'ED おめでとう！',count:num(S.ed.e9),exclude:[1,2,3,4,5]}
    ];
  }
  function certCount(S){return bayesExclusions(S).reduce((a,r)=>a+(Number(r.count)||0),0);}
  // 多項分布の試行数。s8（残りG示唆等）は振り分けに含まれないため数えない。
  function screenBayesTotal(S){return SCREEN_BAYES_KEYS.reduce((a,k)=>a+num(S.screens[k]),0);}
  function bayesSpec(S){
    const counts={};
    SCREEN_BAYES_KEYS.forEach(k=>{counts[k]=num(S.screens[k]);});
    return {
      settings:BAYES_SETTINGS,
      binomial:[],
      multinomial:[{label:'AT終了画面',counts,probs:SCREEN_PROBS}],
      exclusions:bayesExclusions(S)
    };
  }
  function bayesResult(S){
    if(!window.CheckerBayes)return {empty:true};
    return window.CheckerBayes.estimate(bayesSpec(S));
  }
  function bayesPct(v){return window.CheckerBayes?window.CheckerBayes.percent(v):'--';}
  function bayesExcludedSettings(result){
    const set=new Set();
    (result.reasons||[]).forEach(r=>(r.exclude||[]).forEach(s=>set.add(Number(s))));
    return Array.from(set).sort((a,b)=>a-b);
  }
  function bayesUnder4(S){
    const r=bayesResult(S);
    if(!r.posterior)return 0;
    return BAYES_SETTINGS.filter(s=>Number(s)<=3).reduce((a,s)=>a+(r.posterior[s]||0),0);
  }
  function bayesExcludeSummary(S){
    const r=bayesResult(S);
    if(r.contradiction)return row('除外 矛盾',1,true,'#ff5c5c');
    const excluded=bayesExcludedSettings(r);
    return row(excluded.length?'除外 設'+excluded.join(','):'除外 −',excluded.length,excluded.length>0);
  }
  function bayesStyle(){
    return `<style>
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
      const bars=BAYES_SETTINGS.map(setting=>{
        const p=(r.posterior||{})[setting]||0;
        return `<div class="bayes-bar"><span>設定${setting}</span><b style="width:${Math.max(2,p*100)}%"></b><em>${bayesPct(p)}</em></div>`;
      }).join('');
      const reasons=(r.reasons||[]).map(x=>`${x.label}×${x.count}`).join('、');
      body=`<div class="bayes-main"><b>設定4以上 ${bayesPct(r.high)}</b><span>設定3以下 ${bayesPct(bayesUnder4(S))}</span></div>
      <div class="bayes-bars">${bars}</div>
      <div class="hint">証拠：AT終了画面（示唆あり）${screenBayesTotal(S)}回 ／ 確定演出 計${certCount(S)}回</div>
      <div class="hint">除外根拠：${reasons||'なし'}${excluded.length?'（除外済み：設定'+excluded.join('・')+'）':''}</div>
      <div class="hint">推定は入力されたカウントに基づく参考値です。サンプルが少ないほど信頼度は下がります。</div>`;
    }
    return bayesStyle()+`<section class="sec"><div class="sec-h">ベイズ設定推定</div>${body}
    <div class="hint">AT終了画面の振り分けと確定演出から推定します。CZ・AT確率は通常ゲーム数が取れないため推定に使いません。終了画面は毎回記録してください（残り◯G系の画面はカウント対象外）。</div>
    </section>`;
  }
  function pageShisa(ctx){
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    const iconN=Object.values(ctx.S.icons).reduce((a,b)=>a+b,0);
    const ovN=Object.values(ctx.S.over).reduce((a,b)=>a+b,0);
    return `
  <section class="sec"><div class="sec-h">CZ・AT終了時 アイコン</div>
    <div class="cgrid">${ICONS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,iconN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${scN}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,scN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">藤丸コイン（AT終了画面）</div>
    <div class="cgrid">${COINS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3])).join('')}</div></section>
  <section class="sec"><div class="sec-h">ED中 お知らせ演出<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],n=>ctx.pct(n,edN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示<span class="sub">計${ovN}回</span></div>
    <div class="cgrid">${OVER.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div>
    <div class="hint">AT終了時の獲得枚数表示が該当のゾロ目・特定数字を超えていたら記録します。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。</div></section>`;
  }
  function tplText(ctx){
    const czN=ctx.S.cz.rg+ctx.S.cz.ac,atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
    const p=(n,d)=>d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;
    let t=`設定判別メモ｜Lとある魔術の禁書目録2\n総回転数 ${ctx.S.games||0}G / CZ${czN}回 / AT${ctx.S.atCount}回\n_______\n\n■規定ゲーム数\n`;
    for(let i=0;i<ZONES.length;i+=2){
      t+=`${ZONES[i]}g▶︎ ${ctx.S.zones[ZONES[i]]}回`;
      if(ZONES[i+1])t+=`　${ZONES[i+1]}g▶︎ ${ctx.S.zones[ZONES[i+1]]}回`;
      t+='\n';
    }
    t+=`\n■AT直撃▶︎ ${ctx.S.choku}回\n\n■通常CZ振り分け\n超電磁砲ﾁｬﾝｽ▶︎ ${p(ctx.S.cz.rg,czN)}\n一方通行ﾁｬﾝｽ▶︎ ${p(ctx.S.cz.ac,czN)}\n\n■AT中CZ振り分け\n神の力ﾊﾞﾄﾙ▶︎ ${p(ctx.S.atcz.gab,atczN)}\n神の右席ﾊﾞﾄﾙ▶︎ ${p(ctx.S.atcz.useki,atczN)}\n\n■終了時アイコン\n🔵▶︎ ${ctx.S.icons.blue}回　🟢▶︎ ${ctx.S.icons.green}回\n🔴▶︎ ${ctx.S.icons.red}回　✨▶︎ ${ctx.S.icons.gold}回\nなし▶︎ ${ctx.S.icons.none}回\n\n■藤丸コイン\n銅▶︎ ${ctx.S.coins.cu}回　銀▶︎ ${ctx.S.coins.ag}回　金▶︎ ${ctx.S.coins.au}回\nﾃﾞﾝｼﾞｬｰ▶︎ ${ctx.S.coins.dg}回　虹▶︎ ${ctx.S.coins.rb}回\n\n■AT終了画面\n`;
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    SCREENS.forEach(c=>{t+=`${c[1]}▶︎ ${p(ctx.S.screens[c[0]],scN)}\n`;});
    t+=`\n■エンディング中お知らせ演出\n`;
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    ED.forEach(c=>{t+=`${c[1]}▶︎ ${p(ctx.S.ed[c[0]],edN)}\n`;});
    t+=`\n■獲得枚数表示\n`;
    OVER.forEach(c=>{t+=`${c[1]}▶︎ ${ctx.S.over[c[0]]}回\n`;});
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  function tplTextCompact(ctx){
    const czN=ctx.S.cz.rg+ctx.S.cz.ac,atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
    const p=(n,d)=>d>0?`${n}回(${(100*n/d).toFixed(0)}%)`:`${n}回`;
    const sec=(title,lines)=>lines.length?`\n■${title}\n${lines.join('\n')}\n`:'';
    let t=`設定判別メモ｜Lとある魔術の禁書目録2\n総回転数 ${ctx.S.games||0}G / CZ${czN}回 / AT${ctx.S.atCount}回\n_______\n`;
    t+=sec('規定ゲーム数',ZONES.filter(z=>ctx.S.zones[z]>0).map(z=>`${z}g▶︎ ${ctx.S.zones[z]}回`));
    t+=sec('AT直撃',ctx.S.choku>0?[`AT直撃▶︎ ${ctx.S.choku}回`]:[]);
    t+=sec('通常CZ振り分け',czN>0?[[`超電磁砲ﾁｬﾝｽ`,ctx.S.cz.rg],[`一方通行ﾁｬﾝｽ`,ctx.S.cz.ac]].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${p(v[1],czN)}`):[]);
    t+=sec('AT中CZ振り分け',atczN>0?[[`神の力ﾊﾞﾄﾙ`,ctx.S.atcz.gab],[`神の右席ﾊﾞﾄﾙ`,ctx.S.atcz.useki]].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${p(v[1],atczN)}`):[]);
    t+=sec('終了時アイコン',[
      ['🔵',ctx.S.icons.blue],['🟢',ctx.S.icons.green],['🔴',ctx.S.icons.red],['✨',ctx.S.icons.gold],['なし',ctx.S.icons.none]
    ].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${v[1]}回`));
    t+=sec('藤丸コイン',[
      ['銅',ctx.S.coins.cu],['銀',ctx.S.coins.ag],['金',ctx.S.coins.au],['ﾃﾞﾝｼﾞｬｰ',ctx.S.coins.dg],['虹',ctx.S.coins.rb]
    ].filter(v=>v[1]>0).map(v=>`${v[0]}▶︎ ${v[1]}回`));
    const scN=Object.values(ctx.S.screens).reduce((a,b)=>a+b,0);
    t+=sec('AT終了画面',scN>0?SCREENS.filter(c=>ctx.S.screens[c[0]]>0).map(c=>`${c[1]}▶︎ ${p(ctx.S.screens[c[0]],scN)}`):[]);
    const edN=Object.values(ctx.S.ed).reduce((a,b)=>a+b,0);
    t+=sec('エンディング中お知らせ演出',edN>0?ED.filter(c=>ctx.S.ed[c[0]]>0).map(c=>`${c[1]}▶︎ ${p(ctx.S.ed[c[0]],edN)}`):[]);
    t+=sec('獲得枚数表示',OVER.filter(c=>ctx.S.over[c[0]]>0).map(c=>`${c[1]}▶︎ ${ctx.S.over[c[0]]}回`));
    t+=`\nby slot-tools.jp\n${ctx.nanaCreditText('text')?ctx.nanaCreditText('text')+'\n':''}解析出典:ちょんぼりすた様`;
    return t;
  }

  window.CheckerConfigs.toaru2={
    nanaCollab:true,
    storageKey:'toaru2-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins','over'],
    sourceUrl:'https://chonborista.com/slot/fuji-slot/260325/',
    share:{
      title:'Lとある魔術の禁書目録2 設定判別メモ',
      hashtags:'#とある魔術の禁書目録2 #設定判別'
    },
    pages:(ctx,pageCard)=>[
      ()=>pageZones(ctx),
      ()=>pageHatsu(ctx),
      ()=>pageShisa(ctx),
      ()=>pageBayes(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplTextCompact,
    card:{
      title:'Lとある魔術の禁書目録2',
      footerTags:'#とある魔術の禁書目録2 #設定判別',
      downloadName:'toaru2_check.png',
      detailDownloadName:'toaru2_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const czN=ctx.S.cz.rg+ctx.S.cz.ac, atczN=ctx.S.atcz.gab+ctx.S.atcz.useki;
        const acR=czN?`${ctx.S.cz.ac}/${czN} ${(100*ctx.S.cz.ac/czN).toFixed(0)}%`:'—';
        const usR=atczN?`${ctx.S.atcz.useki}/${atczN} ${(100*ctx.S.atcz.useki/atczN).toFixed(0)}%`:'—';
        return [['通常CZ合計',czN+'回'],['AT当選',ctx.S.atCount+'回'],['一方通行',acR],['神の右席',usR]];
      },
      chart:ctx=>({
        title:'当選ゾーン分布',
        x:70,
        step:96,
        width:72,
        items:ZONES.map(z=>({label:String(z),value:ctx.S.zones[z]}))
      }),
      bottom:ctx=>{
        const S=ctx.S;
        const scN=Object.values(S.screens).reduce((a,b)=>a+b,0);
        return {
          title:`AT終了画面（計${scN}回）`,
          startY:762,
          rowGap:43,
          fontSize:25,
          columns:[
            {x:70,items:SCREENS.slice(0,4).map(v=>({label:v[1],value:S.screens[v[0]]}))},
            {x:560,items:SCREENS.slice(4).map(v=>({label:v[1],value:S.screens[v[0]]})).concat([bayesExcludeSummary(S)])}
          ]
        };
      }
    }
  };
})();

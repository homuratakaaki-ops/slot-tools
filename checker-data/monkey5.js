(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const CYCLES=[
    ['c1','周期①','',0,'①'],
    ['c2','周期②','',0,'②'],
    ['c3','周期③','',0,'③'],
    ['c4','周期④','',0,'④'],
    ['c5','周期⑤','',0,'⑤'],
    ['c6','周期⑥','',0,'⑥']
  ];
  const TRIGGERS=[
    ['directWeak','AT直撃（弱レア役）','設定4以上濃厚（前兆5〜9G経由。本前兆・フェイク前兆中は対象外）',1],
    ['directStrong','AT直撃（強レア役）','設1:0.4%⇔設6:6.3%',1],
    ['yushutsu','優出モード経由','通常の優出勝利からのAT',0],
    ['tenjo','天井到達','',0],
    ['instant','即優出（AT終了後すぐ優出）','設1:1.6%⇔設6:3.7%＋AT当選濃厚',1]
  ];
  const CHARGE_VOICES=[
    ['default','波多野「落ち着くんだ…」','デフォルト',0],
    ['sign','波多野「この気配は!?」','比率に設定差',0],
    ['otsu','榎木「おつかれ」','設定2・4・6濃厚',1],
    ['teiou','榎木「これが艇王」','設定4以上濃厚',1],
    ['other','その他','示唆なし',0]
  ];
  const TROPHIES=[
    ['blue','青メダル','黒メダル後1回目のトロフィー率UPに注意',0],
    ['yellow','黄メダル','黒メダル後1回目のトロフィー率UPに注意',0],
    ['black','黒メダル','次回トロフィー出現率UP',0],
    ['bronze','銅トロフィー','設定2以上濃厚',1],
    ['gold','金トロフィー','設定4以上濃厚',1],
    ['kero','ケロット柄トロフィー','設定5以上濃厚',1],
    ['rainbow','虹トロフィー','設定6濃厚',1]
  ];
  const ED=[
    ['hatanoBlue','波多野 青','デフォルト',0],
    ['aoshimaBlue','青島 青','偶数設定期待度UP',0],
    ['hatanoYellow','波多野 黄','高設定期待度UP（弱）',0],
    ['arisaGreen','ありさ 緑','高設定期待度UP（強）',0],
    ['enokiRed','榎木 赤','設定2・4・6濃厚',1],
    ['enokiPurple','榎木 紫','設定4以上濃厚',1],
    ['aoshimaPurple','青島 紫','設定5以上濃厚',1],
    ['sumiPurple','澄 紫','設定6濃厚',1],
  ];
  const TICKETS=[
    ['silver','舟券 銀','設定2・4・6濃厚',1],
    ['gold','舟券 金','設定4以上濃厚',1],
    ['rainbow','舟券 虹','設定6濃厚',1]
  ];
  const ROUNDS=[
    ['yamasa','山佐集合','設定5以上濃厚',1],
    ['aohata','青島＆波多野','設定5以上濃厚（SPフリーズ後は除外）',1],
    ['dress','ドレス','選択率20%⇔37.5%',0]
  ];
  const MEDALS=[
    ['m456','456枚','設定4以上濃厚',1],
    ['m803','803枚','設定5以上濃厚',1],
    ['m666','666枚','設定6濃厚',1]
  ];
  const DEF={
    startGames:0,
    currentGames:0,
    games:0,
    zones:Object.fromEntries(CYCLES.flatMap(c=>[[c[0]+'r',0],[c[0]+'w',0]])),
    cz:{five:0,boat:0,boatEx:0,weakChance:0,weakChanceEx:0,strongChance:0,strongChanceEx:0},
    atcz:Object.fromEntries(CHARGE_VOICES.map(c=>[c[0],0])),
    screens:Object.fromEntries(TROPHIES.map(c=>[c[0],0])),
    ed:Object.fromEntries(ED.map(c=>[c[0],0])),
    icons:Object.fromEntries(TICKETS.map(c=>[c[0],0])),
    coins:Object.fromEntries(ROUNDS.map(c=>[c[0],0])),
    over:Object.fromEntries(MEDALS.map(c=>[c[0],0])),
    triggers:Object.fromEntries(TRIGGERS.map(c=>[c[0],0])),
    img:null,
    iconChoice:null,
    bayes:{rate1:'',rate2:'',rate4:'',rate5:'',rate6:''}
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function freeGames(S){return (Number(S.currentGames)||0)-(Number(S.startGames)||0);}
  function freeText(S){const g=freeGames(S);return g>=0?g+'G':'−';}
  function oneIn(count,den){count=Number(count)||0;den=Number(den)||0;return den>0&&count>0?'1/'+(den/count).toFixed(1):'−';}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:'−';}
  function pctText(a,b){return b>0?`${a}回 (${(100*a/b).toFixed(0)}%)`:`${a}回 (−)`;}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,a,b,hot){return {label,value:Number(a)||0,hot:!!hot,text:label+' '+(b>0?ratio(a,b):'−'),show:b>0};}
  function nonZeroParts(parts){const out=parts.filter(p=>p.v>0).map(p=>p.t+'×'+p.v);return out.length?out.join('・'):'−';}
  function row(text,value,active,color){return {label:text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,text,color};}
  function section(title,lines){const a=lines.filter(Boolean);return a.length?`\n■${title}\n${a.join('\n')}\n`:'';}

  const BAYES_SETTINGS=[1,2,4,5,6];
  const BAYES_RATE_KEYS={1:'rate1',2:'rate2',4:'rate4',5:'rate5',6:'rate6'};
  const BAYES_EX_PROBS={
    boat:{1:.250,2:.262,4:.328,5:.391,6:.430},
    weakChance:{1:.313,2:.320,4:.375,5:.406,6:.469},
    strongChance:{1:.500,2:.508,4:.586,5:.625,6:.664}
  };
  const BAYES_HATANO_PROBS={
    1:{default:.50,sign:.50},
    2:{default:.40,sign:.60},
    4:{default:.40,sign:.60},
    5:{default:.70,sign:.30},
    6:{default:.40,sign:.60}
  };
  const BAYES_ED_PROBS={
    1:{hatanoBlue:.50,aoshimaBlue:.35,hatanoYellow:.12,arisaGreen:.03,enokiRed:0,enokiPurple:0,aoshimaPurple:0,sumiPurple:0},
    2:{hatanoBlue:.375,aoshimaBlue:.45,hatanoYellow:.12,arisaGreen:.03,enokiRed:.025,enokiPurple:0,aoshimaPurple:0,sumiPurple:0},
    4:{hatanoBlue:.30,aoshimaBlue:.425,hatanoYellow:.15,arisaGreen:.075,enokiRed:.025,enokiPurple:.025,aoshimaPurple:0,sumiPurple:0},
    5:{hatanoBlue:.50,aoshimaBlue:.15,hatanoYellow:.20,arisaGreen:.10,enokiRed:0,enokiPurple:.025,aoshimaPurple:.025,sumiPurple:0},
    6:{hatanoBlue:.30,aoshimaBlue:.35,hatanoYellow:.20,arisaGreen:.10,enokiRed:.0125,enokiPurple:.0125,aoshimaPurple:.0125,sumiPurple:.0125}
  };
  function bayesRateMap(S){
    const parsed={},invalid=[],missing=[];
    if(!window.CheckerBayes)return {parsed,invalid,missing,complete:false};
    BAYES_SETTINGS.forEach(setting=>{
      const key=BAYES_RATE_KEYS[setting];
      const raw=String(((S.bayes||{})[key])||'').trim();
      if(!raw){missing.push(setting);return;}
      const p=window.CheckerBayes.parseRate(raw);
      if(!p)invalid.push(setting);
      else parsed[setting]=p;
    });
    return {parsed,invalid,missing,complete:!invalid.length&&!missing.length};
  }
  function bayesExclusions(S){
    return [
      {label:'銅トロフィー',count:n(S.screens,'bronze'),exclude:[1]},
      {label:'金トロフィー',count:n(S.screens,'gold'),exclude:[1,2]},
      {label:'ケロ柄トロフィー',count:n(S.screens,'kero'),exclude:[1,2,4]},
      {label:'虹トロフィー',count:n(S.screens,'rainbow'),exclude:[1,2,4,5]},
      {label:'456枚',count:n(S.over,'m456'),exclude:[1,2]},
      {label:'803枚',count:n(S.over,'m803'),exclude:[1,2,4]},
      {label:'666枚',count:n(S.over,'m666'),exclude:[1,2,4,5]},
      {label:'舟券銀',count:n(S.icons,'silver'),exclude:[1,5]},
      {label:'舟券金',count:n(S.icons,'gold'),exclude:[1,2]},
      {label:'舟券虹',count:n(S.icons,'rainbow'),exclude:[1,2,4,5]},
      {label:'AT直撃弱レア役',count:n(S.triggers,'directWeak'),exclude:[1,2]},
      {label:'艇王ボイス',count:n(S.atcz,'teiou'),exclude:[1,2]},
      {label:'おつかれボイス',count:n(S.atcz,'otsu'),exclude:[1,5]},
      {label:'山佐集合',count:n(S.coins,'yamasa'),exclude:[1,2,4]},
      {label:'青島＆波多野',count:n(S.coins,'aohata'),exclude:[1,2,4]},
      {label:'榎木赤',count:n(S.ed,'enokiRed'),exclude:[1,5]},
      {label:'榎木紫',count:n(S.ed,'enokiPurple'),exclude:[1,2]},
      {label:'青島紫',count:n(S.ed,'aoshimaPurple'),exclude:[1,2,4]},
      {label:'澄紫',count:n(S.ed,'sumiPurple'),exclude:[1,2,4,5]}
    ];
  }
  function bayesSpec(S){
    const rates=bayesRateMap(S);
    const binomial=[
      {label:'ボート弱チェEX',hit:n(S.cz,'boatEx'),total:n(S.cz,'boat'),probs:BAYES_EX_PROBS.boat},
      {label:'弱チャンス目EX',hit:n(S.cz,'weakChanceEx'),total:n(S.cz,'weakChance'),probs:BAYES_EX_PROBS.weakChance},
      {label:'強チャンス目EX',hit:n(S.cz,'strongChanceEx'),total:n(S.cz,'strongChance'),probs:BAYES_EX_PROBS.strongChance}
    ];
    if(rates.complete&&freeGames(S)>0){
      binomial.unshift({label:'5枚役',hit:n(S.cz,'five'),total:freeGames(S),probs:rates.parsed});
    }
    return {
      settings:BAYES_SETTINGS,
      binomial,
      multinomial:[
        {label:'波多野ボイス',counts:{default:n(S.atcz,'default'),sign:n(S.atcz,'sign')},probs:BAYES_HATANO_PROBS},
        {label:'EDボイス',counts:{
          hatanoBlue:n(S.ed,'hatanoBlue'),aoshimaBlue:n(S.ed,'aoshimaBlue'),hatanoYellow:n(S.ed,'hatanoYellow'),arisaGreen:n(S.ed,'arisaGreen'),
          enokiRed:n(S.ed,'enokiRed'),enokiPurple:n(S.ed,'enokiPurple'),aoshimaPurple:n(S.ed,'aoshimaPurple'),sumiPurple:n(S.ed,'sumiPurple')
        },probs:BAYES_ED_PROBS}
      ],
      exclusions:bayesExclusions(S)
    };
  }
  function bayesResult(S){
    if(!window.CheckerBayes)return {empty:true};
    return window.CheckerBayes.estimate(bayesSpec(S));
  }
  function bayesInternalEvidence(S){
    return n(S.cz,'boat')+n(S.cz,'weakChance')+n(S.cz,'strongChance')+n(S.atcz,'default')+n(S.atcz,'sign')+sum(S.ed);
  }
  function bayesInsufficient(S){
    return freeGames(S)<2000 && bayesInternalEvidence(S)<20;
  }
  function bayesPct(v){return window.CheckerBayes?window.CheckerBayes.percent(v):'--';}
  function bayesExcludedSettings(result){
    const set=new Set();
    (result.reasons||[]).forEach(r=>(r.exclude||[]).forEach(s=>set.add(Number(s))));
    return Array.from(set).sort((a,b)=>a-b);
  }
  function bayesSummary(S){
    const r=bayesResult(S);
    if(r.contradiction)return row('推定 矛盾',1,true,'#ff5c5c');
    if(r.empty)return row('推定 −',0,false);
    if(bayesInsufficient(S))return row('推定中',1,false);
    return row('推定 4以上'+bayesPct(r.high),1,true,'#ffc94d');
  }
  function bayesExcludeSummary(S){
    const r=bayesResult(S);
    if(r.contradiction)return row('除外 矛盾',1,true,'#ff5c5c');
    const excluded=bayesExcludedSettings(r);
    return row(excluded.length?'除外 設'+excluded.join(','):'除外 −',excluded.length,excluded.length>0);
  }
  function escAttr(v){
    return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function cycleReach(S,id){return n(S.zones,id+'r');}
  function cycleWin(S,id){return n(S.zones,id+'w');}
  function cycleTotalReach(S){return CYCLES.reduce((a,c)=>a+cycleReach(S,c[0]),0);}
  function cycleTotalWin(S){return CYCLES.reduce((a,c)=>a+cycleWin(S,c[0]),0);}
  function cycleRowRate(S,id){return ratio(cycleWin(S,id),cycleReach(S,id));}
  function atTotal(S){return cycleTotalWin(S)+sum(S.triggers);}
  function pageBayes(ctx){
    const S=ctx.S,r=bayesResult(S),rates=bayesRateMap(S);
    const invalid=rates.invalid.length?`<div class="hint hot">5枚役の入力形式が不正です：設定${rates.invalid.join('・')}。分母の数値で入力してください。</div>`:'';
    let body='';
    if(r.contradiction){
      body='<div class="hint hot">⚠記録に矛盾があります（示唆の見間違いの可能性）。</div>';
    }else if(r.empty){
      body='<div class="hint">記録が増えると推定できます。</div>';
    }else if(bayesInsufficient(S)){
      const excluded=bayesExcludedSettings(r);
      const reasons=(r.reasons||[]).map(x=>`${x.label}×${x.count}`).join('、');
      body=`<div class="bayes-main"><b>推定中</b><span>サンプル不足</span></div>
      <div class="hint">サンプルが増えると表示されます。目安：自遊技2000G以上、または内蔵証拠20件以上。</div>
      <div class="hint">除外根拠：${reasons||'なし'}${excluded.length?'（除外済み：設定'+excluded.join('・')+'）':''}</div>`;
    }else{
      const excluded=bayesExcludedSettings(r);
      const bars=BAYES_SETTINGS.map(setting=>{
        const p=(r.posterior||{})[setting]||0;
        return `<div class="bayes-bar"><span>設定${setting}</span><b style="width:${Math.max(2,p*100)}%"></b><em>${bayesPct(p)}</em></div>`;
      }).join('');
      const reasons=(r.reasons||[]).map(x=>`${x.label}×${x.count}`).join('、');
      body=`<div class="bayes-main"><b>設定4以上 ${bayesPct(r.high)}</b><span>設定2以下 ${bayesPct(r.low)}</span></div>
      <div class="bayes-bars">${bars}</div>
      <div class="hint">除外根拠：${reasons||'なし'}${excluded.length?'（除外済み：設定'+excluded.join('・')+'）':''}</div>
      <div class="hint">推定は入力されたカウントに基づく参考値です。サンプルが少ないほど信頼度は下がります。</div>`;
    }
    return `<section class="sec">
    <style>
      .bayes-rate-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
      .bayes-rate-grid label{display:block;font-size:10px;color:#9a90a8;margin-bottom:3px}
      .bayes-rate-grid input{width:100%;box-sizing:border-box;background:#171220;border:1px solid #2c2340;border-radius:8px;color:#f2eef5;font-size:13px;padding:8px 6px}
      .bayes-main{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#171220;border:1px solid #2c2340;border-radius:10px;padding:10px 12px;margin:8px 0}
      .bayes-main b{color:#ffc94d;font-size:18px}.bayes-main span{color:#9a90a8;font-size:13px}
      .bayes-bar{display:grid;grid-template-columns:44px 1fr 48px;gap:8px;align-items:center;margin:6px 0;font-size:12px;color:#9a90a8}
      .bayes-bar b{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,#ff3d8f,#ffc94d);min-width:2px}
      .bayes-bar em{font-style:normal;text-align:right;color:#f2eef5}
    </style>
    <div class="sec-h">設定推定<span class="sub">フェーズ1.5</span></div>
    <div class="bayes-rate-grid">
      ${BAYES_SETTINGS.map(setting=>`<div><label>設定${setting} 5枚役</label><input type="number" inputmode="decimal" step="0.1" min="1.1" data-state-path="bayes.${BAYES_RATE_KEYS[setting]}" data-rate-input="1" value="${escAttr((S.bayes||{})[BAYES_RATE_KEYS[setting]])}" placeholder="xx"></div>`).join('')}
    </div>
    <div class="hint">5枚役確率は手元の数値を分母のみ入力（例：24.3）。入力値は端末内に保存し、カード・テンプレには出力しません。</div>
    ${invalid}
    ${body}
  </section>`;
  }
  function strongList(S){
    return [
      {tier:6,order:1,label:'虹トロフィー',value:n(S.screens,'rainbow')},
      {tier:6,order:2,label:'666枚',value:n(S.over,'m666')},
      {tier:6,order:3,label:'舟券虹',value:n(S.icons,'rainbow')},
      {tier:6,order:4,label:'澄紫',value:n(S.ed,'sumiPurple')},
      {tier:5,order:1,label:'ケロット柄',value:n(S.screens,'kero')},
      {tier:5,order:2,label:'803枚',value:n(S.over,'m803')},
      {tier:5,order:3,label:'山佐集合',value:n(S.coins,'yamasa')},
      {tier:5,order:4,label:'青島＆波多野',value:n(S.coins,'aohata')},
      {tier:5,order:5,label:'青島紫',value:n(S.ed,'aoshimaPurple')},
      {tier:4,order:1,label:'金トロフィー',value:n(S.screens,'gold')},
      {tier:4,order:2,label:'456枚',value:n(S.over,'m456')},
      {tier:4,order:3,label:'舟券金',value:n(S.icons,'gold')},
      {tier:4,order:4,label:'AT直撃弱',value:n(S.triggers,'directWeak')},
      {tier:4,order:5,label:'榎木艇王',value:n(S.atcz,'teiou')},
      {tier:4,order:6,label:'榎木紫',value:n(S.ed,'enokiPurple')},
      {tier:2,order:1,label:'銅トロフィー',value:n(S.screens,'bronze')}
    ];
  }
  function bestStrong(S){
    const hit=strongList(S).filter(x=>x.value>0).sort((a,b)=>(b.tier-a.tier)||(a.order-b.order))[0];
    return hit?`${hit.label}(${hit.tier===6?'6濃厚':hit.tier+'以上'}) ×${hit.value}`:'濃厚示唆 なし';
  }
  function strongCount(S){return strongList(S).reduce((a,b)=>a+(Number(b.value)||0),0);}

  function pageHatsu(ctx){
    const S=ctx.S,g=freeGames(S),neg=g<0;
    return `<section class="sec">
    <div class="sec-h">回転数<span class="sub">自遊技 <b style="color:${neg?'#ff5c5c':'#6fd8ff'}">${freeText(S)}</b></span></div>
    <div class="inrow"><label>打ち始めの回転数</label><input type="number" inputmode="numeric" data-number-key="startGames" value="${S.startGames||''}" placeholder="0"></div>
    <div class="inrow" style="margin-top:6px"><label>現在の回転数</label><input type="number" inputmode="numeric" data-number-key="currentGames" value="${S.currentGames||''}" placeholder="0"></div>
    <div class="hint ${neg?'hot':''}">データカウンターのG数を入力。5枚役の設定推定（次回更新予定）の分母になります${neg?'。現在G数が打ち始めG数を下回っています。':''}</div>
  </section>
  <section class="sec">
    <div class="sec-h">5枚役</div>
    <div class="cgrid">
      ${ctx.crow('cz.five','5枚役','設定差あり・本機の最重要判別要素。分母は自遊技G',1,v=>oneIn(v,freeGames(S)))}
    </div>
  </section>
  <section class="sec">
    <div class="sec-h">AT当選の契機別記録<span class="sub">計${atTotal(S)}回</span></div>
    <style>
      .cycle-row .ct{flex:1;min-width:0}
      .cycle-row .ct b,.cycle-row .ct small{display:block}
      .cycle-row .ct small:empty{display:none}
      .cycle-row .pct{min-width:104px;text-align:right;color:#ffc94d;font-size:12px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}
      .cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}
      .cycle-btn.win{color:#ffc94d}
      .minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
    </style>
    <div class="cgrid">
      ${CYCLES.map(c=>`<div class="crow cycle-row ${c[3]?'hot':''}">
        <div class="ct"><b>${c[1]}</b><small>${c[2]}</small></div>
        <div class="pct">${cycleRowRate(S,c[0])}</div>
        <div class="cycle-actions">
          <button type="button" class="cycle-btn win" data-bump-many="zones.${c[0]}r,zones.${c[0]}w" data-label="${c[1]} 当選" aria-label="${c[1]} 当選">当選</button>
          <button type="button" class="cycle-btn" data-bump="zones.${c[0]}r" data-label="${c[1]} ハズレ" aria-label="${c[1]} ハズレ">ハズレ</button>
        </div>
      </div>`).join('')}
      ${TRIGGERS.map(c=>ctx.crow('triggers.'+c[0],c[1],c[2],c[3])).join('')}
    </div>
    <div class="hint">周期到達ごとに「当選」または「ハズレ」を1回タップ。当選は到達と当選を同時に記録します。直撃はレア役から5G以内・9G超の当選は対象外</div>
  </section>`;
  }

  function pageCharge(ctx){
    const S=ctx.S, voiceN=sum(S.atcz);
    return `<section class="sec">
    <div class="sec-h">チャージ終了画面タッチのボイス<span class="sub">計${voiceN}回</span></div>
    <div class="cgrid">${CHARGE_VOICES.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,voiceN))).join('')}</div>
    <div class="hint">終了画面でサブ液晶タッチ。EXアイテム付近のタッチは説明表示のため誤認注意</div>
  </section>
  <section class="sec">
    <div class="sec-h">EXアイテム</div>
    <div class="cgrid">
      ${ctx.crow('cz.boat','ボート弱チェ 成立','EXアイテム抽選の分母',0)}
      ${ctx.crow('cz.boatEx','ボート弱チェ EX獲得','設1:25.0%⇔設6:43.0%',1,v=>ratio(v,S.cz.boat))}
      ${ctx.crow('cz.weakChance','弱チャンス目 成立','EXアイテム抽選の分母',0)}
      ${ctx.crow('cz.weakChanceEx','弱チャンス目 EX獲得','設1:31.3%⇔設6:46.9%',1,v=>ratio(v,S.cz.weakChance))}
      ${ctx.crow('cz.strongChance','強チャンス目 成立','EXアイテム抽選の分母',0)}
      ${ctx.crow('cz.strongChanceEx','強チャンス目 EX獲得','設1:50.0%⇔設6:66.4%',1,v=>ratio(v,S.cz.strongChance))}
    </div>
    <div class="hint">EXアイテムの対象は上記3役のみで役別に記録します。</div>
  </section>`;
  }

  function pageShisa(ctx){
    const S=ctx.S, trophyN=sum(S.screens), edN=sum(S.ed), ticketN=sum(S.icons), roundN=sum(S.coins);
    return `<section class="sec"><div class="sec-h">メダル・トロフィー<span class="sub">計${trophyN}回</span></div>
    <div class="cgrid">${TROPHIES.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,trophyN))).join('')}</div>
    <div class="hint">黒メダル後1回目はトロフィー出現率UP。出現順も考慮してください。</div></section>
  <section class="sec"><div class="sec-h">舟券<span class="sub">計${ticketN}回</span></div>
    <div class="cgrid">${TICKETS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,ticketN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">EDボイス<span class="sub">計${edN}回</span></div>
    <div class="cgrid">${ED.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,edN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">特殊ラウンド画面<span class="sub">計${roundN}回</span></div>
    <div class="cgrid">${ROUNDS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,roundN))).join('')}</div></section>
  <section class="sec"><div class="sec-h">獲得枚数</div>
    <div class="cgrid">${MEDALS.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div></section>`;
  }

  function tplText(ctx){
    const S=ctx.S, voiceN=sum(S.atcz), trophyN=sum(S.screens), edN=sum(S.ed), ticketN=sum(S.icons), roundN=sum(S.coins);
    let t=`設定判別メモ｜スマスロ モンキーターンV\n自遊技 ${freeText(S)} / AT計${atTotal(S)}回 / 5枚役${S.cz.five}回\n_______\n`;
    t+='\n■AT当選契機\n';
    CYCLES.forEach(c=>{t+=`${c[1]}▶${cycleWin(S,c[0])}/${cycleReach(S,c[0])}当選\n`;});
    TRIGGERS.filter(c=>n(S.triggers,c[0])>0).forEach(c=>{t+=`${c[1]}▶${n(S.triggers,c[0])}回\n`;});
    t+=section('5枚役',[`5枚役▶${S.cz.five}回（${oneIn(S.cz.five,freeGames(S))}）`]);
    t+=section('チャージ終了ボイス',voiceN>0?CHARGE_VOICES.filter(c=>n(S.atcz,c[0])>0).map(c=>`${c[1]}▶${pctText(n(S.atcz,c[0]),voiceN)}`):[]);
    t+=section('チャージ・アイテム',[
      S.cz.boat>0?`ボート弱チェEX▶${ratio(S.cz.boatEx,S.cz.boat)}`:null,
      S.cz.weakChance>0?`弱チャンス目EX▶${ratio(S.cz.weakChanceEx,S.cz.weakChance)}`:null,
      S.cz.strongChance>0?`強チャンス目EX▶${ratio(S.cz.strongChanceEx,S.cz.strongChance)}`:null
    ]);
    t+=section('メダル・トロフィー',trophyN>0?TROPHIES.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${pctText(n(S.screens,c[0]),trophyN)}`):[]);
    t+=section('舟券',ticketN>0?TICKETS.filter(c=>n(S.icons,c[0])>0).map(c=>`${c[1]}▶${pctText(n(S.icons,c[0]),ticketN)}`):[]);
    t+=section('EDボイス',edN>0?ED.filter(c=>n(S.ed,c[0])>0).map(c=>`${c[1]}▶${pctText(n(S.ed,c[0]),edN)}`):[]);
    t+=section('ラウンド',roundN>0?ROUNDS.filter(c=>n(S.coins,c[0])>0).map(c=>`${c[1]}▶${pctText(n(S.coins,c[0]),roundN)}`):[]);
    t+=section('枚数',MEDALS.filter(c=>n(S.over,c[0])>0).map(c=>`${c[1]}▶${n(S.over,c[0])}回`));
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'AT当選周期',items:CYCLES.map(c=>detailRatio(c[1],cycleWin(S,c[0]),cycleReach(S,c[0]),c[3]))},
      {title:'AT当選契機',items:detailItems(TRIGGERS,S.triggers)},
      {title:'5枚役',items:[
        {label:'5枚役',value:n(S.cz,'five'),hot:true,text:'5枚役 '+oneIn(S.cz.five,freeGames(S)),show:n(S.cz,'five')>0}
      ]},
      {title:'チャージ終了ボイス',items:detailItems(CHARGE_VOICES,S.atcz),percent:true},
      {title:'チャージ・アイテム',items:[
        detailItem('ボート弱チェ成立',S.cz.boat,0),
        detailRatio('ボート弱チェEX',S.cz.boatEx,S.cz.boat,1),
        detailItem('弱チャンス目成立',S.cz.weakChance,0),
        detailRatio('弱チャンス目EX',S.cz.weakChanceEx,S.cz.weakChance,1),
        detailItem('強チャンス目成立',S.cz.strongChance,0),
        detailRatio('強チャンス目EX',S.cz.strongChanceEx,S.cz.strongChance,1)
      ]},
      {title:'メダル・トロフィー',items:detailItems(TROPHIES,S.screens),percent:true},
      {title:'舟券',items:detailItems(TICKETS,S.icons),percent:true},
      {title:'EDボイス',items:detailItems(ED,S.ed),percent:true},
      {title:'特殊ラウンド画面',items:detailItems(ROUNDS,S.coins),percent:true},
      {title:'獲得枚数',items:detailItems(MEDALS,S.over)}
    ];
  }

  window.CheckerConfigs.monkey5={
    nanaCollab:false,
    storageKey:'monkey5-checker-v1',
    defaults:DEF,
    mergeKeys:['zones','cz','atcz','screens','ed','icons','coins','over','triggers','bayes'],
    sourceUrl:'https://chonborista.com/slot/yamasa-slot/198173/',
    normalizeState:(out,src)=>{
      const oldZones=(src&&src.zones)||{};
      CYCLES.forEach(c=>{
        const id=c[0];
        const legacy=Number(oldZones[id]);
        if(Number.isFinite(legacy) && oldZones[id+'w']===undefined && oldZones[id+'r']===undefined){
          out.zones[id+'w']=legacy;
          out.zones[id+'r']=legacy;
        }
        out.zones[id+'r']=Number(out.zones[id+'r'])||0;
        out.zones[id+'w']=Number(out.zones[id+'w'])||0;
        if(out.zones[id+'w']>out.zones[id+'r']){
          out.zones[id+'r']=Number.isFinite(legacy)?out.zones[id+'w']+out.zones[id+'r']:out.zones[id+'w'];
        }
      });
      const oldEd=(src&&src.ed)||{};
      if(oldEd.hatano!==undefined && oldEd.hatanoBlue===undefined) out.ed.hatanoBlue=Number(oldEd.hatano)||0;
      if(oldEd.aoshima!==undefined && oldEd.aoshimaBlue===undefined) out.ed.aoshimaBlue=Number(oldEd.aoshima)||0;
      BAYES_SETTINGS.forEach(setting=>{
        const key=BAYES_RATE_KEYS[setting];
        const raw=String((out.bayes||{})[key]||'').trim();
        const m=raw.match(/^1\s*\/\s*(\d+(?:\.\d+)?)$/);
        if(m)out.bayes[key]=m[1];
      });
      return out;
    },
    share:{title:'スマスロ モンキーターンV 設定判別メモ',hashtags:'#モンキーターンV #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageCharge(ctx),
      ()=>pageShisa(ctx),
      ()=>pageBayes(ctx)+pageCard()
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'スマスロ モンキーターンV',
      metaText:(ctx,date)=>date+'  自遊技 '+freeText(ctx.S),
      titleFitMax:650,
      footerTags:'#モンキーターンV #設定判別',
      downloadName:'monkey5_check.png',
      detailDownloadName:'monkey5_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['AT当選',`計${atTotal(S)}`],
          ['直撃',`計${n(S.triggers,'directWeak')+n(S.triggers,'directStrong')}`],
          ['EX獲得',`計${n(S.cz,'boatEx')+n(S.cz,'weakChanceEx')+n(S.cz,'strongChanceEx')}`],
          ['5枚役',oneIn(S.cz.five,freeGames(S))]
        ];
      },
      chart:ctx=>({title:'周期当選分布',x:130,step:140,width:70,items:CYCLES.map(c=>({label:c[4],value:cycleWin(ctx.S,c[0])}))}),
      bottom:ctx=>{
        const S=ctx.S;
        return {
          title:'判別サマリー',
          startY:760,
          rowGap:44,
          fontSize:23,
          columns:[
            {x:70,items:[
              row(bestStrong(S),strongCount(S),strongCount(S)>0,'#ffc94d'),
              row('トロフィー '+nonZeroParts([{t:'銅',v:n(S.screens,'bronze')},{t:'金',v:n(S.screens,'gold')},{t:'ケロ',v:n(S.screens,'kero')},{t:'虹',v:n(S.screens,'rainbow')}]),sum(S.screens),sum(S.screens)>0),
              row('EDボイス '+nonZeroParts([{t:'榎赤',v:n(S.ed,'enokiRed')},{t:'榎紫',v:n(S.ed,'enokiPurple')},{t:'青紫',v:n(S.ed,'aoshimaPurple')},{t:'澄',v:n(S.ed,'sumiPurple')}]),sum(S.ed),sum(S.ed)>0),
              row('ボイス '+nonZeroParts([{t:'おつ',v:n(S.atcz,'otsu')},{t:'艇王',v:n(S.atcz,'teiou')}]),sum(S.atcz),sum(S.atcz)>0),
              bayesSummary(S)
            ]},
            {x:560,items:[
              row('濃厚示唆 計'+strongCount(S)+'回',strongCount(S),strongCount(S)>0,'#ffc94d'),
              row('契機 '+nonZeroParts([{t:'直',v:n(S.triggers,'directWeak')+n(S.triggers,'directStrong')},{t:'優',v:n(S.triggers,'yushutsu')},{t:'天',v:n(S.triggers,'tenjo')},{t:'即',v:n(S.triggers,'instant')}]),sum(S.triggers),sum(S.triggers)>0),
              row('舟券 '+nonZeroParts([{t:'銀',v:n(S.icons,'silver')},{t:'金',v:n(S.icons,'gold')},{t:'虹',v:n(S.icons,'rainbow')}]),sum(S.icons),sum(S.icons)>0),
              row('ラウンド '+nonZeroParts([{t:'山',v:n(S.coins,'yamasa')},{t:'青波',v:n(S.coins,'aohata')},{t:'ド',v:n(S.coins,'dress')}]),sum(S.coins),sum(S.coins)>0),
              bayesExcludeSummary(S)
            ]}
          ]
        };
      }
    }
  };
})();

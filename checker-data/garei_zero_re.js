(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const SETTINGS=[1,2,3,4,5,6];
  const DENOMS={
    watermelon:{1:81.9,2:79.9,3:77.8,4:75.6,5:73.8,6:72.1},
    weakCherry:{1:99.0,2:95.3,3:91.0,4:85.1,5:80.5,6:78.2},
    big:{1:385.5,2:385.5,3:378.8,4:372.4,5:368.2,6:364.1},
    reg:{1:414.8,2:409.6,3:402.1,4:385.5,5:376.6,6:364.1}
  };
  const RATE_PROBS={
    weakCz:{1:.082,2:.082,3:.092,4:.103,5:.111,6:.117},
    strongCz:{1:.253,2:.253,3:.281,4:.315,5:.340,6:.359}
  };
  const BB_SCREENS=[
    ['phone','神楽と黄泉と携帯電話','デフォルト',0],
    ['childhood','幼少期','設定2以上濃厚',2],
    ['casual','私服','設定4以上濃厚',4],
    ['swim','水着','設定6濃厚',6]
  ];
  const ART_SCREENS=[
    ['default','デフォルト','デフォルト',0],
    ['kaguraYomi1','神楽と黄泉①','設定2以上濃厚',2],
    ['yomiMei','黄泉と冥','設定4以上濃厚',4],
    ['kaguraYomi2','神楽と黄泉②','エンディング後に出現',0]
  ];
  const OVER=[
    ['o222','222枚突破','設定2以上濃厚',2],
    ['o444','444枚突破','設定4以上濃厚',4],
    ['o456','456枚突破','設定4以上濃厚',4],
    ['o666','666枚突破','設定6濃厚',6],
    ['o0123','0123枚突破','設定6濃厚',6]
  ];
  const SPECIAL_BONUS=[
    ['watermelonOdd','スイカ＋赤BB／スイカ＋青頭RB','奇数設定優遇'],
    ['watermelonEven','スイカ＋青BB／スイカ＋赤頭RB','偶数設定優遇'],
    ['strongCherryRb','強チェリー＋RB','高設定の大チャンス']
  ];
  const REF_SECTIONS=[
    ['天井・狙い目',[
      ['天井','ボーナス・ART間999G＋α。恩恵は無限ART「喰霊チャンス・夢幻」。'],
      ['やめどき','ボーナス・ART後に状態を確認してヤメ。'],
      ['朝一','リセット恩恵は調査中。']
    ]],
    ['RT状態',[
      ['ボーナス後','RT0'],
      ['通常時','RT1〜3'],
      ['解放の刻','RT4 or 5'],
      ['ART準備中(ベルナビなし)','RT0'],
      ['ART準備中(ベルナビあり)','RT1 or 2'],
      ['ART','RT3'],
      ['殺生石RUSH','RT5'],
      ['殺生石RUSHロング','RT4'],
      ['補足','RT3滞在時は押し順チャレンジ（6択）が発生する可能性あり。正解すればCZ「解放の刻」へ。筐体右の役モノが頻繁に可動すればRT3滞在の可能性。']
    ]],
    ['内部状態・ステージ',[
      ['黄泉の部屋','デフォルト'],
      ['対策室','デフォルト'],
      ['公園','高確 or 前兆を示唆'],
      ['幼少期','超高確濃厚'],
      ['補足','高確移行はチャンス目＜チェリー＜スイカの順に期待。100G消化毎にも移行抽選あり。RB終了後は高確濃厚。レア役の高確とゲーム数の高確が重なると超高確。']
    ]],
    ['通常時の連続演出',[
      ['仲直り作戦','期待度 低'],
      ['VS天井嘗','↓'],
      ['VS土蜘蛛','↓'],
      ['VS山彦','↓'],
      ['VS冥','期待度 高']
    ]],
    ['ART中の殺生石チャレンジ当選率',[
      ['スイカ','通常4.4% 高確10.0% 超高確100%'],
      ['弱チェリー','通常17.5% 高確40.0% 超高確100%'],
      ['強チェリー','通常35.1% 高確80.1% 超高確100%'],
      ['弱チャンス目','通常8.8% 高確20.0% 超高確100%'],
      ['強チャンス目','通常23.2% 高確52.9% 超高確100%']
    ]],
    ['殺生石RUSHの種別',[
      ['通常','平均上乗せ約35G'],
      ['ロング','平均滞在約30G・平均上乗せ約205G'],
      ['極','最低上乗せ50G・平均上乗せ約150G'],
      ['極ロング','平均上乗せ約810G'],
      ['補足','突入時の移行リプレイで通常かロングかが決まる。上段にスイカ・ベル・ベル停止ならロング。上乗せ時に右上がりベル揃いなら次回上乗せも濃厚。']
    ]],
    ['継続バトルの対戦相手',[
      ['VS桜庭','期待度 低'],
      ['VSナブー','↓'],
      ['VS岩端','↓'],
      ['VS室長&桐','↓'],
      ['VS飯綱','↓'],
      ['VS神楽','期待度 高'],
      ['VS確定神楽','継続濃厚']
    ]],
    ['フリーズ・特化ゾーン',[
      ['特戦四課モード','ストック特化ゾーン。平均5個・期待約1,000枚'],
      ['殺生石レクイエム','最強特化ゾーン。平均ストック5個・平均上乗せ300G・期待約3,600枚'],
      ['喰霊フリーズ','単独赤7の一部。期待約3,000枚'],
      ['補足','フリーズフラグ3種の合算は約1/8,000。']
    ]]
  ];

  const DEF={
    startGames:0,
    currentGames:0,
    games:0,
    counts:{watermelon:0,weakCherry:0,big:0,reg:0},
    rates:{weakCzr:0,weakCzw:0,strongCzr:0,strongCzw:0},
    specialBonus:Object.fromEntries(SPECIAL_BONUS.map(v=>[v[0],0])),
    bbScreens:Object.fromEntries(BB_SCREENS.map(v=>[v[0],0])),
    artScreens:Object.fromEntries(ART_SCREENS.map(v=>[v[0],0])),
    over:Object.fromEntries(OVER.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function freeGames(S){return (Number(S.currentGames)||0)-(Number(S.startGames)||0);}
  function freeText(S){const g=freeGames(S);return g>=0?g+'G':'−';}
  function oneIn(count,den){count=Number(count)||0;den=Number(den)||0;return den>0&&count>0?'1/'+(den/count).toFixed(1):'−';}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:'−';}
  function pctLine(a,b){return b>0?`${a}回 (${(100*a/b).toFixed(0)}%)`:`${a}回`;}
  function rateWin(S,id){return n(S.rates,id+'w');}
  function rateReach(S,id){return n(S.rates,id+'r');}
  function rateText(S,id){return ratio(rateWin(S,id),rateReach(S,id));}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,a,b,hot){return {label,value:Number(a)||0,hot:!!hot,text:label+' '+(b>0?ratio(a,b):'−'),show:b>0};}
  function nonZeroParts(parts){const out=parts.filter(p=>p.v>0).map(p=>p.t+'×'+p.v);return out.length?out.join('・'):'−';}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function countTotal(S){return n(S.counts,'watermelon')+n(S.counts,'weakCherry')+n(S.counts,'big')+n(S.counts,'reg');}
  function bonusTotal(S){return n(S.counts,'big')+n(S.counts,'reg');}
  function bonusOneIn(S){return oneIn(bonusTotal(S),freeGames(S));}
  function denomProbs(key){return Object.fromEntries(SETTINGS.map(s=>[s,1/DENOMS[key][s]]));}
  function rankText(rank){return rank===6?'6濃厚':rank+'以上';}

  function allStrong(S){
    return [
      ...BB_SCREENS.filter(c=>c[3]).map(c=>({label:c[1],value:n(S.bbScreens,c[0]),rank:c[3]})),
      ...ART_SCREENS.filter(c=>c[3]).map(c=>({label:c[1],value:n(S.artScreens,c[0]),rank:c[3]})),
      ...OVER.filter(c=>c[3]).map(c=>({label:c[1],value:n(S.over,c[0]),rank:c[3]}))
    ];
  }
  function strongCount(S){return allStrong(S).reduce((a,b)=>a+b.value,0);}
  function bestStrong(S){
    const hit=allStrong(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank))[0];
    return hit?`確定演出 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }

  function bayesExclusions(S){
    return [
      {label:'BB終了画面 幼少期',count:n(S.bbScreens,'childhood'),exclude:[1]},
      {label:'BB終了画面 私服',count:n(S.bbScreens,'casual'),exclude:[1,2,3]},
      {label:'BB終了画面 水着',count:n(S.bbScreens,'swim'),exclude:[1,2,3,4,5]},
      {label:'ART終了画面 神楽と黄泉①',count:n(S.artScreens,'kaguraYomi1'),exclude:[1]},
      {label:'ART終了画面 黄泉と冥',count:n(S.artScreens,'yomiMei'),exclude:[1,2,3]},
      {label:'獲得枚数 222枚突破',count:n(S.over,'o222'),exclude:[1]},
      {label:'獲得枚数 444枚突破',count:n(S.over,'o444'),exclude:[1,2,3]},
      {label:'獲得枚数 456枚突破',count:n(S.over,'o456'),exclude:[1,2,3]},
      {label:'獲得枚数 666枚突破',count:n(S.over,'o666'),exclude:[1,2,3,4,5]},
      {label:'獲得枚数 0123枚突破',count:n(S.over,'o0123'),exclude:[1,2,3,4,5]}
    ];
  }
  function bayesSpec(S){
    const g=freeGames(S),binomial=[];
    if(g>0){
      binomial.push({label:'スイカ',hit:n(S.counts,'watermelon'),total:g,probs:denomProbs('watermelon')});
      binomial.push({label:'弱チェリー',hit:n(S.counts,'weakCherry'),total:g,probs:denomProbs('weakCherry')});
      binomial.push({label:'BIG',hit:n(S.counts,'big'),total:g,probs:denomProbs('big')});
      binomial.push({label:'REG',hit:n(S.counts,'reg'),total:g,probs:denomProbs('reg')});
    }
    if(rateReach(S,'weakCz')>0)binomial.push({label:'弱チェリーCZ当選',hit:rateWin(S,'weakCz'),total:rateReach(S,'weakCz'),probs:RATE_PROBS.weakCz});
    if(rateReach(S,'strongCz')>0)binomial.push({label:'強チェリーCZ当選',hit:rateWin(S,'strongCz'),total:rateReach(S,'strongCz'),probs:RATE_PROBS.strongCz});
    return {settings:SETTINGS,binomial,multinomial:[],exclusions:bayesExclusions(S)};
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
  function bayesExcludeSummary(S){
    const r=bayesResult(S);
    if(r.contradiction)return row('除外 矛盾',1,true,'#ff5c5c');
    const excluded=bayesExcludedSettings(r);
    return row(excluded.length?'除外 設'+excluded.join(','):'除外 −',excluded.length,excluded.length>0);
  }
  function bayesUnder4(S){
    const r=bayesResult(S);
    if(!r.posterior)return 0;
    return SETTINGS.filter(s=>Number(s)<=3).reduce((a,s)=>a+(r.posterior[s]||0),0);
  }

  function pageStyle(){
    return `<style>
      .cycle-row .ct,.count-row .ct{flex:1;min-width:0}.cycle-row .ct b,.cycle-row .ct small,.count-row .ct b,.count-row .ct small{display:block}.cycle-row .ct small,.count-row .ct small{font-size:9.5px;color:var(--muted);line-height:1.35}
      .cycle-row .pct,.count-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .bayes-main{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#171220;border:1px solid #2c2340;border-radius:10px;padding:10px 12px;margin:8px 0}.bayes-main b{color:#ffc94d;font-size:18px}.bayes-main span{color:#9a90a8;font-size:13px}
      .bayes-bar{display:grid;grid-template-columns:44px 1fr 48px;gap:8px;align-items:center;margin:6px 0;font-size:12px;color:#9a90a8}.bayes-bar b{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,#ff3d8f,#ffc94d);min-width:2px}.bayes-bar em{font-style:normal;text-align:right;color:#f2eef5}
    </style>`;
  }
  function rateRow(ctx,id,name,sub){
    const S=ctx.S;
    return `<div class="crow cycle-row hot">
      <div class="ct"><b>${name}</b><small>${sub}</small></div>
      <div class="pct">${rateText(S,id)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="rates.${id}r,rates.${id}w" data-label="${name} 当選" aria-label="${name} 当選">当選</button>
        <button type="button" class="cycle-btn" data-bump="rates.${id}r" data-label="${name} ハズレ" aria-label="${name} ハズレ">ハズレ</button>
      </div>
    </div>`;
  }
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),neg=g<0;
    return pageStyle()+`<section class="sec">
      <div class="sec-h">回転数<span class="sub">通常回転 <b style="color:${neg?'#ff5c5c':'#6fd8ff'}">${freeText(S)}</b></span></div>
      <div class="inrow"><label>打ち始めの回転数</label><input type="number" inputmode="numeric" data-number-key="startGames" value="${S.startGames||''}" placeholder="0"></div>
      <div class="inrow" style="margin-top:6px"><label>現在の回転数</label><input type="number" inputmode="numeric" data-number-key="currentGames" value="${S.currentGames||''}" placeholder="0"></div>
      <div class="hint ${neg?'hot':''}">データカウンターのG数を入力します。設定推定の分母になります。${neg?' 現在G数が打ち始めG数を下回っています。':''}</div>
    </section>
    <section class="sec"><div class="sec-h">カウント系</div>
      <div class="cgrid">
        ${ctx.crow('counts.watermelon','スイカ','設1:1/81.9⇔設6:1/72.1',1,v=>oneIn(v,g))}
        ${ctx.crow('counts.weakCherry','弱チェリー','設1:1/99.0⇔設6:1/78.2',1,v=>oneIn(v,g))}
        ${rateRow(ctx,'weakCz','弱チェリーからのCZ当選','設1・2:8.2%⇔設6:11.7%')}
        ${rateRow(ctx,'strongCz','強チェリーからのCZ当選','設1・2:25.3%⇔設6:35.9%')}
        ${ctx.crow('counts.big','BIG','設1:1/385.5⇔設6:1/364.1',1,v=>oneIn(v,g))}
        ${ctx.crow('counts.reg','REG','設1:1/414.8⇔設6:1/364.1',1,v=>oneIn(v,g))}
      </div>
      <div class="hint">スイカは左リール上段にスイカまたは⑪番のBARが停止した際、中リールに赤7目安でスイカを狙って成立を確認します。左上段にBARが停止した場合は取りこぼしに注意してください。弱チェリーは左リール角チェリー停止かつ右リール中段ベル停止。強チェリーは左リール角チェリー停止かつ右リール中段ベル以外停止です。CZ当選率は通常滞在時のみ記録します。</div>
    </section>
    <section class="sec"><div class="sec-h">特定ボーナス（記録のみ）<span class="sub">計${sum(S.specialBonus)}回</span></div>
      <div class="cgrid">${SPECIAL_BONUS.map(c=>ctx.crow('specialBonus.'+c[0],c[1],c[2],0)).join('')}</div>
      <div class="hint">ボーナス当選契機はボーナス成立時のWINランプの色で判別できます。振り分けの数値が公表されていないため、記録のみで推定には使いません。</div>
    </section>`;
  }
  function pageSuggest(ctx){
    const S=ctx.S;
    return pageStyle()+`<section class="sec"><div class="sec-h">BB終了画面<span class="sub">計${sum(S.bbScreens)}回</span></div>
      <div class="cgrid">${BB_SCREENS.map(c=>ctx.crow('bbScreens.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.bbScreens)))).join('')}</div>
    </section>
    <section class="sec"><div class="sec-h">ART終了画面<span class="sub">計${sum(S.artScreens)}回</span></div>
      <div class="cgrid">${ART_SCREENS.map(c=>ctx.crow('artScreens.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.artScreens)))).join('')}</div>
      <div class="hint">神楽と黄泉②は設定示唆ではなく、エンディング到達後に出現する画面です。</div>
    </section>
    <section class="sec"><div class="sec-h">獲得枚数表示<span class="sub">計${sum(S.over)}回</span></div>
      <div class="cgrid">${OVER.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.over)))).join('')}</div>
      <div class="hint">RB中のキャラ紹介は示唆内容が未確定のため収録していません。</div>
    </section>`;
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
      <div class="hint">本機は設定1と設定2で同じ数値の項目が多いため、この2つの区別は難しくなります。</div>
      <div class="hint">推定は入力されたカウントに基づく参考値です。サンプルが少ないほど信頼度は下がります。</div>`;
    }
    return pageStyle()+`<section class="sec"><div class="sec-h">ベイズ設定推定</div>${body}</section>`;
  }
  function pageReference(){
    return pageStyle()+`<div class="jump-grid">${REF_SECTIONS.map((s,i)=>`<a href="#ref${i+1}">${s[0]}</a>`).join('')}</div>`+
      REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div>
      <table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
    </section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S);
    let t=`設定判別メモ｜Lパチスロ喰霊-零-Re\n通常回転 ${freeText(S)} / 確定演出${strongCount(S)}回\n_______\n`;
    t+=section('カウント系',[
      `スイカ▶${n(S.counts,'watermelon')}回（${oneIn(n(S.counts,'watermelon'),g)}）`,
      `弱チェリー▶${n(S.counts,'weakCherry')}回（${oneIn(n(S.counts,'weakCherry'),g)}）`,
      `弱チェリーCZ▶${rateText(S,'weakCz')}`,
      `強チェリーCZ▶${rateText(S,'strongCz')}`,
      `BIG▶${n(S.counts,'big')}回（${oneIn(n(S.counts,'big'),g)}）`,
      `REG▶${n(S.counts,'reg')}回（${oneIn(n(S.counts,'reg'),g)}）`
    ]);
    t+=section('BB終了画面',sum(S.bbScreens)>0?BB_SCREENS.filter(c=>n(S.bbScreens,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.bbScreens,c[0]),sum(S.bbScreens))}`):[]);
    t+=section('ART終了画面',sum(S.artScreens)>0?ART_SCREENS.filter(c=>n(S.artScreens,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.artScreens,c[0]),sum(S.artScreens))}`):[]);
    t+=section('獲得枚数表示',sum(S.over)>0?OVER.filter(c=>n(S.over,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.over,c[0]),sum(S.over))}`):[]);
    t+=section('特定ボーナス',sum(S.specialBonus)>0?SPECIAL_BONUS.filter(c=>n(S.specialBonus,c[0])>0).map(c=>`${c[1]}▶${n(S.specialBonus,c[0])}回`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [
      {title:'カウント系',items:[
        {label:'スイカ',value:n(S.counts,'watermelon'),hot:true,text:'スイカ '+oneIn(n(S.counts,'watermelon'),g),show:n(S.counts,'watermelon')>0},
        {label:'弱チェリー',value:n(S.counts,'weakCherry'),hot:true,text:'弱チェリー '+oneIn(n(S.counts,'weakCherry'),g),show:n(S.counts,'weakCherry')>0},
        detailRatio('弱チェリーCZ',rateWin(S,'weakCz'),rateReach(S,'weakCz'),1),
        detailRatio('強チェリーCZ',rateWin(S,'strongCz'),rateReach(S,'strongCz'),1),
        {label:'BIG',value:n(S.counts,'big'),hot:true,text:'BIG '+oneIn(n(S.counts,'big'),g),show:n(S.counts,'big')>0},
        {label:'REG',value:n(S.counts,'reg'),hot:true,text:'REG '+oneIn(n(S.counts,'reg'),g),show:n(S.counts,'reg')>0}
      ]},
      {title:'BB終了画面',items:detailItems(BB_SCREENS,S.bbScreens),percent:true},
      {title:'ART終了画面',items:detailItems(ART_SCREENS,S.artScreens),percent:true},
      {title:'獲得枚数表示',items:detailItems(OVER,S.over),percent:true},
      {title:'特定ボーナス',items:SPECIAL_BONUS.map(c=>detailItem(c[1],n(S.specialBonus,c[0]),0))}
    ];
  }

  window.CheckerConfigs.garei_zero_re={
    nanaCollab:false,
    storageKey:'garei-zero-re-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','rates','specialBonus','bbScreens','artScreens','over'],
    sourceUrl:'https://chonborista.com/slot/oizumi-slot/259743/',
    normalizeState:out=>{
      out.startGames=Math.max(0,Number(out.startGames)||0);
      out.currentGames=Math.max(0,Number(out.currentGames)||0);
      out.counts=Object.assign({},DEF.counts,out.counts||{});
      out.rates=Object.assign({},DEF.rates,out.rates||{});
      out.specialBonus=Object.assign({},DEF.specialBonus,out.specialBonus||{});
      out.bbScreens=Object.assign({},DEF.bbScreens,out.bbScreens||{});
      out.artScreens=Object.assign({},DEF.artScreens,out.artScreens||{});
      out.over=Object.assign({},DEF.over,out.over||{});
      Object.keys(out.counts||{}).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
      ['weakCz','strongCz'].forEach(id=>{
        out.rates[id+'r']=Math.max(0,Number(out.rates[id+'r'])||0);
        out.rates[id+'w']=Math.max(0,Number(out.rates[id+'w'])||0);
        if(out.rates[id+'w']>out.rates[id+'r'])out.rates[id+'r']=out.rates[id+'w'];
      });
      ['specialBonus','bbScreens','artScreens','over'].forEach(group=>{
        Object.keys(out[group]||{}).forEach(k=>{out[group][k]=Math.max(0,Number(out[group][k])||0);});
      });
      return out;
    },
    share:{title:'Lパチスロ喰霊-零-Re 設定判別メモ',hashtags:'#喰霊零 #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageCounts(ctx),
      ()=>pageSuggest(ctx),
      ()=>pageBayes(ctx),
      ()=>pageReference(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lパチスロ喰霊-零-Re',
      metaText:(ctx,date)=>date+'  通常回転 '+freeText(ctx.S),
      titleFitMax:650,
      footerTags:'#喰霊零 #設定判別',
      downloadName:'garei_zero_re_check.png',
      detailDownloadName:'garei_zero_re_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=freeGames(S);
        return [
          ['スイカ',oneIn(n(S.counts,'watermelon'),g)],
          ['弱チェリー',oneIn(n(S.counts,'weakCherry'),g)],
          ['ボーナス合算',bonusOneIn(S)],
          ['確定演出',`計${strongCount(S)}回`]
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:130,
        step:200,
        width:80,
        items:[
          {label:'スイカ',value:n(ctx.S.counts,'watermelon')},
          {label:'弱チェ',value:n(ctx.S.counts,'weakCherry')},
          {label:'BIG',value:n(ctx.S.counts,'big')},
          {label:'REG',value:n(ctx.S.counts,'reg')}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S,g=freeGames(S);
        const bbSummaryTotal=n(S.bbScreens,'childhood')+n(S.bbScreens,'casual')+n(S.bbScreens,'swim');
        const artSummaryTotal=n(S.artScreens,'kaguraYomi1')+n(S.artScreens,'yomiMei');
        return {
          title:'サマリー',
          startY:760,
          rowGap:44,
          fontSize:22,
          columns:[
            {x:70,items:[
              row(bestStrong(S),strongCount(S),strongCount(S)>0,'#ffc94d'),
              row('BB画面 '+nonZeroParts([{t:'幼',v:n(S.bbScreens,'childhood')},{t:'私',v:n(S.bbScreens,'casual')},{t:'水',v:n(S.bbScreens,'swim')}]),bbSummaryTotal,bbSummaryTotal>0),
              row('ART画面 '+nonZeroParts([{t:'神①',v:n(S.artScreens,'kaguraYomi1')},{t:'黄冥',v:n(S.artScreens,'yomiMei')}]),artSummaryTotal,artSummaryTotal>0),
              row('枚数 '+nonZeroParts([{t:'222',v:n(S.over,'o222')},{t:'444',v:n(S.over,'o444')},{t:'456',v:n(S.over,'o456')},{t:'666',v:n(S.over,'o666')},{t:'0123',v:n(S.over,'o0123')}]),sum(S.over),sum(S.over)>0),
              row(`スイカ ${n(S.counts,'watermelon')}回 ${oneIn(n(S.counts,'watermelon'),g)}`,n(S.counts,'watermelon'),n(S.counts,'watermelon')>0)
            ]},
            {x:560,items:[
              row(`確定演出 計${strongCount(S)}回`,strongCount(S),strongCount(S)>0,'#ffc94d'),
              row(`弱チェ ${n(S.counts,'weakCherry')}回 ${oneIn(n(S.counts,'weakCherry'),g)}`,n(S.counts,'weakCherry'),n(S.counts,'weakCherry')>0),
              row(`ボーナス BIG×${n(S.counts,'big')}・REG×${n(S.counts,'reg')}`,bonusTotal(S),bonusTotal(S)>0),
              row(`弱チェCZ ${rateWin(S,'weakCz')}/${rateReach(S,'weakCz')} ・ 強チェCZ ${rateWin(S,'strongCz')}/${rateReach(S,'strongCz')}`,rateReach(S,'weakCz')+rateReach(S,'strongCz'),rateReach(S,'weakCz')+rateReach(S,'strongCz')>0),
              bayesExcludeSummary(S)
            ]}
          ]
        };
      }
    }
  };
})();

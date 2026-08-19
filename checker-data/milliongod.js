(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const PLATES=[
    ['bronze','銅','設定2以上濃厚',2],
    ['silver','銀','設定3以上濃厚',3],
    ['gold','金','設定4以上濃厚',4],
    ['hanabi','花火柄','設定5以上濃厚',5],
    ['rainbow','虹','設定6濃厚',6]
  ];
  const REF_SECTIONS=[
    ['天井・狙い目',[
      ['天井','GG間1480G。恩恵はGG当選＋ループストック抽選。'],
      ['設定変更時の天井振り分け','510G 15.2%・1000G 20.3%・1480G 64.5%'],
      ['狙い目','朝イチリセット 410G〜・AT後(奇数挙動) 580G〜・AT後(偶数挙動) 700G〜'],
      ['やめどき','AT終了後にストックの有無と状態を確認してヤメ']
    ]],
    ['裏ボタンLED',[
      ['GG入賞画面 なし','裏天国＋ストック1個以上'],
      ['GG入賞画面 白','デフォルト'],
      ['GG入賞画面 青','ループストックB以上のチャンス'],
      ['GG入賞画面 黄','ストックが出た場合はループストックB or D'],
      ['GG入賞画面 緑','ループストックC以上濃厚'],
      ['GG入賞画面 赤','ループストックC以上濃厚＋ストックに期待'],
      ['GG入賞画面 虹','ループストックD濃厚＋ストック1個以上'],
      ['GG終了画面 白/青/黄/緑/赤/虹','ストック期待度 10% / 25% / 50% / 75% / 濃厚 / ストック3つ以上'],
      ['SGG引き戻しZONE なし','当選時は20G否定'],
      ['SGG引き戻しZONE 白','SGG当選濃厚'],
      ['SGG引き戻しZONE 青','20G以上濃厚'],
      ['SGG引き戻しZONE 黄','20G以上濃厚＋50G否定'],
      ['SGG引き戻しZONE 緑','30G以上濃厚'],
      ['SGG引き戻しZONE 赤','50 or 100G濃厚（1:1）'],
      ['SGG引き戻しZONE 虹','100G濃厚'],
      ['Z-ZONE・Z-GAME 白','黄7以上濃厚'],
      ['Z-ZONE・Z-GAME 黄','レア役の黄7濃厚']
    ]],
    ['モード示唆',[
      ['雷＋奇数非テンパイ','裏天国示唆。通常1/2794.9 → 裏天国1/26.6'],
      ['アルテミスの矢＋上段青7否定','裏天国示唆。通常1/5122.8 → 裏天国1/38.8'],
      ['地震＋下段黄7(3枚)＋偶数テンパイハズレ','裏天国濃厚'],
      ['右回転→泉/森/遺跡','デフォルト'],
      ['右回転→麓','天国準備以上の期待大'],
      ['右回転→神殿','天国以上の期待大'],
      ['左回転→泉/森/遺跡','天国準備以上の期待大'],
      ['左回転→麓','天国以上の期待大'],
      ['左回転→神殿','超天国の期待大'],
      ['奥進行→神殿','天国以上の期待大'],
      ['奥進行→麓','GG濃厚'],
      ['チャンスボタン→麓','天国以上の期待大'],
      ['チャンスボタン→神殿','超天国の期待大'],
      ['チャンスボタン→泉/森/遺跡','GG濃厚'],
      ['ワイプ→泉/森/遺跡','転落演出'],
      ['ワイプ→神殿','GG濃厚'],
      ['光の風 左から','モードアップに期待'],
      ['光の風 左から＋リプレイ','モードアップ濃厚'],
      ['光の風 右から','モードアップ以上濃厚'],
      ['光の風 右から＋リプレイ','GG前兆以上濃厚'],
      ['ブラックホール1回','天国準備以上の期待大'],
      ['ブラックホール2回・3回','デフォルト'],
      ['ブラックホール4回','奇数揃い濃厚'],
      ['陽炎 ALL黄（偶数）','偶数揃い示唆'],
      ['陽炎 ALL赤（奇数）','奇数テンパイで前兆を示唆、それ以外で表モードを示唆'],
      ['陽炎 上記以外','GG前兆以上濃厚'],
      ['陽炎 ALL偶数のハズレ','ガイアモード天国かつ規定回数残り1回の期待大'],
      ['遅れ ALL赤バラケ','天国準備以上の期待大'],
      ['遅れ 奇数ケツテンパイ','天国以上の期待大'],
      ['遅れ 7ハサミ中偶数','天国以上の期待大'],
      ['遅れ 70V・7V0','天国以上の期待大'],
      ['遅れ 700・707・7VV','超天国の期待大']
    ]],
    ['ガイア・G-ZONE・出目',[
      ['ガイアナビ 0頭','ガイアモード期待度 低'],
      ['ガイアナビ 0頭奇数','ガイアモード期待度 ↓'],
      ['ガイアナビ 0頭偶数ケツテンパイ','ガイアモード期待度 ↓'],
      ['ガイアナビ 0ハサミ偶数','ガイアモード期待度 高'],
      ['ガイアナビ 0ハサミ奇数','天国の期待大'],
      ['ガイアナビ 0V7・07V','天国の期待大'],
      ['リールフラッシュ 風','デフォルト'],
      ['リールフラッシュ スコール','規定回数が残り3回以下で出現率UP'],
      ['リールフラッシュ 台風','周期到達濃厚 or GG前兆濃厚'],
      ['リールフラッシュ 落雷SP','ガイアステージ移行濃厚 or Z-ZONE前兆濃厚'],
      ['風＋0V7・07V','ガイアステージ移行濃厚 or Z-ZONE前兆濃厚'],
      ['ガイア周期到達時の移行率','低確 10.2% / 通常 30.1% / 天国 66.8%'],
      ['G-ZONE 1・3G目に奇テ','期待度 低'],
      ['G-ZONE 2・4G目に奇テ','期待度 ↓'],
      ['G-ZONE 3G目のみ','期待度 ↓'],
      ['G-ZONE 4G目のみ','期待度 中'],
      ['G-ZONE 3・4G目','期待度 ↓'],
      ['G-ZONE 2・3G目','期待度 ↓'],
      ['G-ZONE 1G目のみ','期待度 ↓'],
      ['G-ZONE 1・2G目','期待度 70%'],
      ['G-ZONE 1・4G目','期待度 ↓'],
      ['G-ZONE 2G目のみ','期待度 ↓'],
      ['G-ZONE 1・3・4G目','期待度 85%以上'],
      ['G-ZONE 2・3・4G目','期待度 ↓'],
      ['G-ZONE 1・2・4G目','期待度 ↓'],
      ['G-ZONE 1・2・3G目','期待度 ↓'],
      ['奇テなしで5G目に奇数揃い','濃厚'],
      ['1〜4G全て奇テで5G目に奇数揃い','濃厚'],
      ['1〜4G目に鏡発生','チャンス'],
      ['5G目に鏡発生','80%'],
      ['11V（奇数テンパイケツV）','90%'],
      ['117（奇数テンパイケツ7）','97.5%'],
      ['330（奇数テンパイケツ0）','99.5%'],
      ['下段黄7＋偶数揃い','97.5%'],
      ['押し順ナビ＋黄7ハズレ','濃厚'],
      ['モード示唆出目','濃厚'],
      ['最終Gが奇数テンパイケツ偶数以外 or 偶数揃い以外','潜伏濃厚'],
      ['奇数テンパイ（例112）','期待度 低'],
      ['奇数のみ（例153）','期待度 ↓'],
      ['左偶数＋奇数ケツテンパイ（例633）','期待度 ↓'],
      ['左奇数＋奇数ケツテンパイ（例155）','期待度 ↓'],
      ['奇数順目（例567）','期待度 ↓'],
      ['奇数ハサミ＋中奇数（例313）','期待度 ↓'],
      ['Vハサミ＋中奇数（例V3V）','期待度 高'],
      ['液晶リーチ目','1V3・223・315・4V8・526・634・808・V31']
    ]]
  ];

  const DEF={
    startGames:0,
    nav15StartGames:0,
    nav15StartSet:0,
    currentGames:0,
    games:0,
    counts:{nav15:0,ggFirst:0,mysteryGg:0},
    rates:{blue3r:0,blue3w:0,zzoner:0,zzonew:0},
    plates:Object.fromEntries(PLATES.map(v=>[v[0],0])),
    bayes:{rate1:'',rate2:'',rate3:'',rate4:'',rate5:'',rate6:'',blue1:'1.2',blue2:'10.2',blue3:'',blue4:'',blue5:'',blue6:''},
    img:null,
    iconChoice:null
  };
  const BAYES_SETTINGS=[1,2,3,4,5,6];
  const BAYES_RATE_KEYS={1:'rate1',2:'rate2',3:'rate3',4:'rate4',5:'rate5',6:'rate6'};
  const BAYES_BLUE_KEYS={1:'blue1',2:'blue2',3:'blue3',4:'blue4',5:'blue5',6:'blue6'};
  const ZZONE_PROBS={1:.012,2:.010,3:.042,4:.010,5:.116,6:.010};

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function freeGames(S){return (Number(S.currentGames)||0)-(Number(S.startGames)||0);}
  function freeText(S){const g=freeGames(S);return g>=0?g+'G':'−';}
  function hasNav15Start(S){return !!Number(S.nav15StartSet);}
  function nav15Games(S){return hasNav15Start(S)?(Number(S.currentGames)||0)-(Number(S.nav15StartGames)||0):0;}
  function nav15Text(S){if(!hasNav15Start(S))return '−';const g=nav15Games(S);return g>=0?g+'G':'−';}
  function nav15OneIn(S){return hasNav15Start(S)&&nav15Games(S)>0?oneIn(n(S.counts,'nav15'),nav15Games(S)):'−';}
  function oneIn(count,den){count=Number(count)||0;den=Number(den)||0;return den>0&&count>0?'1/'+(den/count).toFixed(1):'−';}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:'−';}
  function pctLine(a,b){return b>0?`${a}回 (${(100*a/b).toFixed(0)}%)`:`${a}回`;}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailRatio(label,a,b,hot){return {label,value:Number(a)||0,hot:!!hot,text:label+' '+(b>0?ratio(a,b):'−'),show:b>0};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function nonZeroParts(parts){const out=parts.filter(p=>p.v>0).map(p=>p.t+'×'+p.v);return out.length?out.join('・'):'−';}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function escAttr(v){return String(v||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  function rateWin(S,id){return n(S.rates,id+'w');}
  function rateReach(S,id){return n(S.rates,id+'r');}
  function rateText(S,id){return ratio(rateWin(S,id),rateReach(S,id));}
  function plateTotal(S){return sum(S.plates);}

  function allStrong(S){
    return PLATES.map(c=>({label:c[1],value:n(S.plates,c[0]),rank:c[3]}));
  }
  function strongCount(S){return allStrong(S).reduce((a,b)=>a+b.value,0);}
  function bestStrong(S){
    const hit=allStrong(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank))[0];
    return hit?`確定演出 ${hit.label}(${hit.rank===6?'6濃厚':hit.rank+'以上'}) ×${hit.value}`:'確定演出 なし';
  }

  function completeRateMap(S){
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
  function completeBlueMap(S){
    const parsed={},invalid=[],missing=[];
    BAYES_SETTINGS.forEach(setting=>{
      const key=BAYES_BLUE_KEYS[setting];
      const raw=String(((S.bayes||{})[key])||'').trim();
      if(!raw){missing.push(setting);return;}
      const p=Number(raw)/100;
      if(!(p>0&&p<1))invalid.push(setting);
      else parsed[setting]=p;
    });
    return {parsed,invalid,missing,complete:!invalid.length&&!missing.length};
  }
  function bayesExclusions(S){
    return [
      {label:'銅プレート',count:n(S.plates,'bronze'),exclude:[1]},
      {label:'銀プレート',count:n(S.plates,'silver'),exclude:[1,2]},
      {label:'金プレート',count:n(S.plates,'gold'),exclude:[1,2,3]},
      {label:'花火柄プレート',count:n(S.plates,'hanabi'),exclude:[1,2,3,4]},
      {label:'虹プレート',count:n(S.plates,'rainbow'),exclude:[1,2,3,4,5]}
    ];
  }
  function bayesSpec(S){
    const rates=completeRateMap(S),blue=completeBlueMap(S),binomial=[];
    if(rates.complete&&hasNav15Start(S)&&nav15Games(S)>0)binomial.push({label:'押し順ナビ15枚役',hit:n(S.counts,'nav15'),total:nav15Games(S),probs:rates.parsed});
    if(blue.complete&&rateReach(S,'blue3')>0)binomial.push({label:'青7×3連GG当選',hit:rateWin(S,'blue3'),total:rateReach(S,'blue3'),probs:blue.parsed});
    if(rateReach(S,'zzone')>0)binomial.push({label:'Z-ZONE昇格率',hit:rateWin(S,'zzone'),total:rateReach(S,'zzone'),probs:ZZONE_PROBS});
    return {settings:BAYES_SETTINGS,binomial,multinomial:[],exclusions:bayesExclusions(S)};
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
    return BAYES_SETTINGS.filter(s=>Number(s)<=3).reduce((a,s)=>a+(r.posterior[s]||0),0);
  }

  function pageStyle(){
    return `<style>
      .cycle-row .ct,.count-row .ct{flex:1;min-width:0}.cycle-row .ct b,.cycle-row .ct small,.count-row .ct b,.count-row .ct small{display:block}.cycle-row .ct small,.count-row .ct small{font-size:9.5px;color:var(--muted);line-height:1.35}
      .cycle-row .pct,.count-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .mini-btn{flex:none;font-family:var(--body);font-size:10px;font-weight:800;padding:7px 8px;border-radius:8px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);white-space:nowrap}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .bayes-rate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.bayes-rate-grid label{display:block;font-size:10px;color:var(--muted);margin-bottom:3px}.bayes-rate-grid input{width:100%;box-sizing:border-box;background:#171220;border:1px solid #2c2340;border-radius:8px;color:#f2eef5;font-size:13px;padding:8px 6px}
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
  function pageHatsu(ctx){
    const S=ctx.S,g=freeGames(S),ng=nav15Games(S),neg=g<0,navNeg=hasNav15Start(S)&&ng<0;
    return pageStyle()+`<section class="sec">
      <div class="sec-h">回転数<span class="sub">通常回転 <b style="color:${neg?'#ff5c5c':'#6fd8ff'}">${freeText(S)}</b> ／ 15枚役区間 <b style="color:${navNeg?'#ff5c5c':'#6fd8ff'}">${nav15Text(S)}</b></span></div>
      <div class="inrow"><label>打ち始めの回転数</label><input type="number" inputmode="numeric" data-number-key="startGames" value="${S.startGames||''}" placeholder="0"></div>
      <div class="inrow" style="margin-top:6px"><label>15枚役のカウント開始G数</label><button type="button" class="mini-btn" data-copy-number-from="startGames" data-copy-number-to="nav15StartGames" data-copy-number-flag="nav15StartSet">打ち始めと同じにする</button><input type="number" inputmode="numeric" data-number-key="nav15StartGames" data-number-set-flag="nav15StartSet" value="${hasNav15Start(S)?S.nav15StartGames:''}" placeholder="0"></div>
      <div class="inrow" style="margin-top:6px"><label>現在の回転数</label><input type="number" inputmode="numeric" data-number-key="currentGames" value="${S.currentGames||''}" placeholder="0"></div>
      <div class="hint ${(neg||navNeg)?'hot':''}">データカウンターのG数を入力します。15枚役のカウント開始G数は、15枚役を数え始めた時点のG数を入力してください。未入力の場合、15枚役は設定推定に使われません。${neg?' 現在G数が打ち始めG数を下回っています。':''}${navNeg?' 現在G数が15枚役のカウント開始G数を下回っています。':''}</div>
    </section>
    <section class="sec"><div class="sec-h">カウント系</div>
      <div class="cgrid">
        ${ctx.crow('counts.nav15','押し順ナビあり15枚役','通常時に押し順ナビが出て15枚を獲得した回数。',1,()=>nav15OneIn(S))}
        ${rateRow(ctx,'blue3','青7×3連からのGG当選','小役履歴に青7が3つ並んだ回数と、そこからGGに当選した回数。')}
        ${ctx.crow('counts.ggFirst','GG初当り','設1:1/532.8⇔設6:1/294.8',1,v=>oneIn(v,freeGames(S)))}
        ${rateRow(ctx,'zzone','Z-ZONE昇格','通常時からGGに当選した回数と、Z-ZONEへ移行した回数。')}
        ${ctx.crow('counts.mysteryGg','謎GG','記録のみ・判別非関与。レア役・小役履歴・天井以外のGG当選。',0,v=>oneIn(v,freeGames(S)))}
      </div>
      <div class="hint">青7×3連とZ-ZONEは、当選=d+1,n+1／ハズレ=d+1。行タップでは加算されません。白7（ガイアベル）は青7としても扱います。G-ZONE中やガイアステージ中のZ-ZONE昇格は別抽選なので数えません。</div>
    </section>`;
  }
  function pageSuggest(ctx){
    const S=ctx.S,total=plateTotal(S);
    return pageStyle()+`<section class="sec"><div class="sec-h">ユニバプレート（GG終了画面）<span class="sub">計${total}回</span></div>
      <div class="cgrid">${PLATES.map(c=>ctx.crow('plates.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,total))).join('')}</div>
      <div class="hint">GG終了画面でプレートが出現すれば特定設定以上が濃厚です。</div>
    </section>`;
  }
  function pageBayes(ctx){
    const S=ctx.S,r=bayesResult(S),rates=completeRateMap(S),blue=completeBlueMap(S);
    const invalidRate=rates.invalid.length?`<div class="hint hot">15枚役の入力形式が不正です：設定${rates.invalid.join('・')}。分母の数値で入力してください。</div>`:'';
    const invalidBlue=blue.invalid.length?`<div class="hint hot">青7×3連の入力形式が不正です：設定${blue.invalid.join('・')}。0より大きく100未満の%で入力してください。</div>`:'';
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
      <div class="hint">除外根拠：${reasons||'なし'}${excluded.length?'（除外済み：設定'+excluded.join('・')+'）':''}</div>
      <div class="hint">推定は入力されたカウントに基づく参考値です。サンプルが少ないほど信頼度は下がります。</div>`;
    }
    return pageStyle()+`<section class="sec">
      <div class="sec-h">数値の入手先について</div>
      <div class="hint">押し順ナビあり15枚役の設定別出現率、および青7×3連の設定3〜6のGG当選率は、パチマガスロマガ様に掲載されています。本ツールはこれらの数値を収録していないため、お手元の数値を入力してご利用ください。<br><a href="https://cs62.cs-plaza.com/g/pachi/pla/s_conq/mizuho_slot/57/mizuho_slot_57.php" target="_blank" rel="noopener">パチマガスロマガ様の機種ページ</a></div>
    </section>
    <section class="sec">
      <div class="sec-h">押し順ナビあり15枚役（分母）</div>
      <div class="bayes-rate-grid">${BAYES_SETTINGS.map(s=>`<div><label>設定${s}</label><input type="number" inputmode="decimal" step="0.01" min="1.1" data-state-path="bayes.${BAYES_RATE_KEYS[s]}" data-rate-input="1" value="${escAttr((S.bayes||{})[BAYES_RATE_KEYS[s]])}" placeholder="xx"></div>`).join('')}</div>
      <div class="hint">手元の数値を入力してください。入力値は端末内に保存され、カード・テンプレートには出力しません。</div>
      ${invalidRate}
    </section>
    <section class="sec">
      <div class="sec-h">青7×3連のGG当選率（%）</div>
      <div class="bayes-rate-grid">${BAYES_SETTINGS.map(s=>`<div><label>設定${s}</label><input type="number" inputmode="decimal" step="0.1" min="0.1" max="99.9" data-state-path="bayes.${BAYES_BLUE_KEYS[s]}" value="${escAttr((S.bayes||{})[BAYES_BLUE_KEYS[s]])}" placeholder="xx.x"></div>`).join('')}</div>
      <div class="hint">手元の数値を入力してください。設定1・2は公開されている数値をあらかじめ入れてあります。入力値は端末内に保存され、カード・テンプレートには出力しません。</div>
      ${invalidBlue}
    </section>
    <section class="sec"><div class="sec-h">ベイズ設定推定</div>${body}</section>`;
  }
  function pageReference(){
    return pageStyle()+`<div class="jump-grid">${REF_SECTIONS.map((s,i)=>`<a href="#ref${i+1}">${s[0]}</a>`).join('')}</div>`+
      REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div>
      <table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
      ${sec[0]==='裏ボタンLED'?'<div class="hint">ユニメモでカスタムをONにしておく必要があります。Z-GAME中は白のみ点灯します。</div>':''}
      ${sec[0]==='ガイア・G-ZONE・出目'?'<div class="hint">上段青7や下段黄7(3枚)で対応フラッシュが出ればGG前兆濃厚。ガイアモードはGG当選でもクリアされません（有利区間リセット時を除く）。</div>':''}
    </section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S;
    let t=`設定判別メモ｜スマスロ ミリオンゴッド\n通常回転 ${freeText(S)} / 確定演出${strongCount(S)}回\n_______\n`;
    t+=section('カウント系',[
      `押し順ナビ15枚役▶${n(S.counts,'nav15')}回（${nav15OneIn(S)}）`,
      `青7×3連GG当選▶${rateText(S,'blue3')}`,
      `GG初当り▶${n(S.counts,'ggFirst')}回（${oneIn(n(S.counts,'ggFirst'),freeGames(S))}）`,
      `Z-ZONE昇格▶${rateText(S,'zzone')}`,
      `謎GG▶${n(S.counts,'mysteryGg')}回（${oneIn(n(S.counts,'mysteryGg'),freeGames(S))}）`
    ]);
    t+=section('ユニバプレート',plateTotal(S)>0?PLATES.filter(c=>n(S.plates,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.plates,c[0]),plateTotal(S))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'カウント系',items:[
        {label:'押し順ナビ15枚役',value:n(S.counts,'nav15'),hot:true,text:'押し順ナビ15枚役 '+nav15OneIn(S),show:n(S.counts,'nav15')>0},
        detailRatio('青7×3連GG当選',rateWin(S,'blue3'),rateReach(S,'blue3'),1),
        {label:'GG初当り',value:n(S.counts,'ggFirst'),hot:true,text:'GG初当り '+oneIn(n(S.counts,'ggFirst'),freeGames(S)),show:n(S.counts,'ggFirst')>0},
        detailRatio('Z-ZONE昇格',rateWin(S,'zzone'),rateReach(S,'zzone'),1),
        {label:'謎GG',value:n(S.counts,'mysteryGg'),hot:false,text:'謎GG '+oneIn(n(S.counts,'mysteryGg'),freeGames(S)),show:n(S.counts,'mysteryGg')>0}
      ]},
      {title:'ユニバプレート',items:detailItems(PLATES,S.plates),percent:true}
    ];
  }

  window.CheckerConfigs.milliongod={
    nanaCollab:false,
    storageKey:'milliongod-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','rates','plates','bayes'],
    sourceUrl:'https://chonborista.com/slot/universal-slot/252303/',
    normalizeState:out=>{
      out.nav15StartGames=Math.max(0,Number(out.nav15StartGames)||0);
      out.nav15StartSet=(Number(out.nav15StartSet)||out.nav15StartGames>0)?1:0;
      out.counts=Object.assign({},DEF.counts,out.counts||{});
      out.rates=Object.assign({},DEF.rates,out.rates||{});
      out.plates=Object.assign({},DEF.plates,out.plates||{});
      out.bayes=Object.assign({},DEF.bayes,out.bayes||{});
      if(!String(out.bayes.blue1||'').trim())out.bayes.blue1='1.2';
      if(!String(out.bayes.blue2||'').trim())out.bayes.blue2='10.2';
      Object.keys(out.counts||{}).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
      ['blue3','zzone'].forEach(id=>{
        out.rates[id+'r']=Math.max(0,Number(out.rates[id+'r'])||0);
        out.rates[id+'w']=Math.max(0,Number(out.rates[id+'w'])||0);
        if(out.rates[id+'w']>out.rates[id+'r'])out.rates[id+'r']=out.rates[id+'w'];
      });
      Object.keys(out.plates||{}).forEach(k=>{out.plates[k]=Math.max(0,Number(out.plates[k])||0);});
      BAYES_SETTINGS.forEach(setting=>{
        const key=BAYES_RATE_KEYS[setting];
        const raw=String((out.bayes||{})[key]||'').trim();
        const m=raw.match(/^1\s*\/\s*(\d+(?:\.\d+)?)$/);
        if(m)out.bayes[key]=m[1];
      });
      return out;
    },
    share:{title:'スマスロ ミリオンゴッド 設定判別メモ',hashtags:'#ミリオンゴッド #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageSuggest(ctx),
      ()=>pageBayes(ctx),
      ()=>pageReference(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'スマスロ ミリオンゴッド',
      metaText:(ctx,date)=>date+'  通常回転 '+freeText(ctx.S),
      titleFitMax:650,
      footerTags:'#ミリオンゴッド #設定判別',
      downloadName:'milliongod_check.png',
      detailDownloadName:'milliongod_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['GG初当り',oneIn(n(S.counts,'ggFirst'),freeGames(S))],
          ['15枚役',nav15OneIn(S)],
          ['Z-ZONE',`${rateWin(S,'zzone')}/${rateReach(S,'zzone')}`],
          ['確定演出',`計${strongCount(S)}回`]
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:130,
        step:200,
        width:80,
        items:[
          {label:'15枚',value:n(ctx.S.counts,'nav15')},
          {label:'初当',value:n(ctx.S.counts,'ggFirst')},
          {label:'青7',value:rateWin(ctx.S,'blue3')},
          {label:'Z-Z',value:rateWin(ctx.S,'zzone')}
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
              row(bestStrong(S),strongCount(S),strongCount(S)>0,'#ffc94d'),
              row('プレート '+nonZeroParts([{t:'銅',v:n(S.plates,'bronze')},{t:'銀',v:n(S.plates,'silver')},{t:'金',v:n(S.plates,'gold')},{t:'花',v:n(S.plates,'hanabi')},{t:'虹',v:n(S.plates,'rainbow')}]),plateTotal(S),plateTotal(S)>0),
              row(`15枚役 ${n(S.counts,'nav15')}回 ${nav15OneIn(S)}`,n(S.counts,'nav15'),n(S.counts,'nav15')>0),
              row(`青7×3連 ${rateWin(S,'blue3')}/${rateReach(S,'blue3')}`,rateReach(S,'blue3'),rateReach(S,'blue3')>0)
            ]},
            {x:560,items:[
              row(`確定演出 計${strongCount(S)}回`,strongCount(S),strongCount(S)>0,'#ffc94d'),
              row(`GG初当り ${n(S.counts,'ggFirst')}回 ${oneIn(n(S.counts,'ggFirst'),freeGames(S))}`,n(S.counts,'ggFirst'),n(S.counts,'ggFirst')>0),
              row(`Z-ZONE ${rateText(S,'zzone')}`,rateReach(S,'zzone'),rateReach(S,'zzone')>0),
              row(`謎GG ${n(S.counts,'mysteryGg')}回`,n(S.counts,'mysteryGg'),n(S.counts,'mysteryGg')>0),
              bayesExcludeSummary(S)
            ]}
          ]
        };
      }
    }
  };
})();

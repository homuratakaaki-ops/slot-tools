// 出典: ちょんぼりすた様 https://chonborista.com/slot/newgin-slot/264698/
// 2026-10-19 確認。数値・文言の正本: docs/specs/mahoako-checker-v01.md
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const DENOMS={cz:{1:357.0,2:333.8,3:310.7,4:273.3,5:243.0,6:235.4}};
  const AT_OTHER={1:680.7,2:649.9,3:603.5,4:501.7,5:434.0,6:414.9};
  // counts の配列順 tm / pa / ve に対応する、設定ごとの振り分け。
  const CZ_TYPE_PROBS={
    1:[.758,.238,.004],2:[.754,.242,.004],3:[.734,.262,.004],
    4:[.676,.316,.008],5:[.656,.336,.008],6:[.648,.344,.008]
  };
  const UNKNOWN=['unknown','不明','割合の母数に入れない',0];
  const COUNTS=[
    ['cz','CZ','設1:1/357.0⇔設6:1/235.4',1],
    ['atBonus','AT初当り（ボーナス契機）','',0],
    ['atOther','AT初当り（ボーナス以外）','設1:1/680.7⇔設6:1/414.9',0],
    ['atUnknown','AT初当り（契機不明）','',0]
  ];
  const CZ_TYPE=[
    ['tm','トランスマジア','設1:75.8%⇔設6:64.8%',0],
    ['pa','パネルアタック','設1:23.8%⇔設6:34.4%',0],
    ['ve','ヴェナリータ','設1:0.4%⇔設6:0.8%',0],
    ['unknown','種別不明','割合の母数に入れない',0]
  ];
  const BB_SCREENS=[
    ['s01','①ピンク杖背景','デフォルト・チャンス告知',0],
    ['s02','②顔アップ背景','デフォルト・完全告知',0],
    ['s03','③机上のスマホ','デフォルト・後告知',0],
    ['s04','④青枠悪役３人','奇数設定 期待度UP',0],
    ['s05','⑤青枠魔法少女３人','偶数設定 期待度UP',0],
    ['s06','⑥赤枠３人後ろ姿','高設定 期待度UP（弱）',0],
    ['s07','⑦赤枠５人見上げ','高設定 期待度UP（強）',0],
    ['s08','⑧金枠ベーゼ着席','設定2以上濃厚',2],
    ['s09','⑨金枠３人街中','設定4以上濃厚',4],
    ['s10','⑩金枠ベーゼ単体','設定5以上濃厚',5],
    ['s11','⑪虹枠サンタ３人','設定6濃厚',6],UNKNOWN
  ];
  const TROPHY=[
    ['none','なし','',0],['bronze','銅','設定2以上濃厚',2],
    ['silver','銀','設定3以上濃厚',3],['gold','金','設定4以上濃厚',4],
    ['tiger','虎柄','設定5以上濃厚',5],['rainbow','虹','設定6濃厚',6],UNKNOWN
  ];
  const OVER=[
    ['o246','246枚OVER','設定2・4・6濃厚',0,[1,3,5]],
    ['o456','456枚OVER','設定4以上濃厚',4],
    ['o555','555枚OVER','設定5以上濃厚',5],
    ['o666','666枚OVER','設定6濃厚',6],UNKNOWN
  ];
  // 2人＋1人の奇偶は2人側のチームで決まり、3人目が相手チームのときだけ逆になる（2026-10-19 シオン確定）。
  const RB_TEAM=[
    ['eno3','エノルミータ3人','奇数設定 期待度UP',0],
    ['tres3','トレスマジア3人','偶数設定 期待度UP',0],
    ['eno2','エノルミータ2人＋1人','3人目で示唆が決まる',0],
    ['tres2','トレスマジア2人＋1人','3人目で示唆が決まる',0],['unknown','不明','',0]
  ];
  const RB_THIRD=[
    ['loco','ロコムジカ','2人側の奇偶 期待度UP＋高設定 期待度UP（弱）',0],
    ['rubel','ルベルブルーメ','2人側の奇偶 期待度UP＋高設定 期待度UP（弱）',0],
    ['sista','シスタギガント','2人側の奇偶 期待度UP＋設定2以上濃厚',2],
    ['lord','ロードエノルメ','2人側の奇偶 期待度UP＋設定3以上濃厚',3],
    ['baeze2','マジアベーゼ第二形態','2人側の奇偶 期待度UP＋設定5以上濃厚',5],
    ['rivalTres','3人目トレスマジア（エノルミータ2人のとき）','偶数設定 期待度UP＋高設定 期待度UP（強）',0],
    ['rivalEno','3人目エノルミータ（トレスマジア2人のとき）','奇数設定 期待度UP＋高設定 期待度UP（強）',0],['unknown','不明','',0]
  ];
  const RB_FLAG=[
    ['venarita','ヴェナリータ出現','高設定 期待度UP（弱）',0],
    ['vatz','ヴァーツ出現','設定2否定',0,[2]],['unknown','不明','',0]
  ];
  const PANEL=[
    ['azur','アズール','奇数 期待度UP',0],['sulfa','サルファ','偶数 期待度UP',0],
    ['magenta','マゼンタ','高設定 期待度UP',0],UNKNOWN
  ];
  const SMB=[
    ['ep1','悪の女幹部、誕生！？','奇数 期待度UP',0],
    ['ep2','逆境アズール','偶数 期待度UP',0],
    ['ep3','やっぱり魔法少女にあこがれて','高設定 期待度UP',0],UNKNOWN
  ];
  const GROUPS={czType:CZ_TYPE,bbScreens:BB_SCREENS,trophy:TROPHY,over:OVER,rbTeam:RB_TEAM,rbThird:RB_THIRD,rbFlag:RB_FLAG,panel:PANEL,smb:SMB};
  const TITLES={czType:'CZ種別',bbScreens:'ボーナス終了画面',trophy:'ギンちゃんトロフィー',over:'獲得枚数表示',rbTeam:'RB中のキャラ紹介（構成）',rbThird:'RB中のキャラ紹介（3人目）',rbFlag:'RB中のキャラ紹介（出現）',panel:'パネルアタックのキャラ',smb:'SMボーナスのエピソード'};
  // 詳細カード専用の短い見出し・行名（右列の1行表示が1010pxを越えないため）。画面・hint・テンプレは上の表示名のまま。
  const DETAIL_TITLES={czType:'CZ種別',bbScreens:'終了画面',trophy:'トロフィー',over:'獲得枚数',rbTeam:'RB構成',rbThird:'RB 3人目',rbFlag:'RB出現',panel:'パネル',smb:'SMボーナス'};
  const DETAIL_LABELS={
    rbTeam:{eno3:'エノ3人',tres3:'トレス3人',eno2:'エノ2人＋1人',tres2:'トレス2人＋1人'},
    rbThird:{rivalTres:'3人目トレス（エノ2人）',rivalEno:'3人目エノ（トレス2人）',baeze2:'ベーゼ第二形態'},
    smb:{ep1:'悪の女幹部',ep2:'逆境アズール',ep3:'やっぱり魔法少女'}
  };
  const HINTS={
    counts:'CZ回数は契機を問わず突入した回数。CZ種別は種別が分かったCZだけ押し、分からなければ種別不明。AT初当りは初当りのみ（継続・引き戻し・上位移行は数えない）。ボーナス契機とそれ以外を分けます。',
    bbScreens:'番号はちょんぼりすたの掲載順です。枠の色だけで判断せず、絵柄で見分けてください。',
    trophy:'AT終了時に記録。出現率はホールが設定できるため、出ないことを低設定の根拠にはしません。',
    over:'『枚OVER』の特殊表示だけを記録します。実際の枚数が一致しただけでは押しません。',
    rb:'1回のRBで、3人の構成を1つ、2人＋1人のときは3人目を1つ、ヴェナリータ・ヴァーツが出たらそれぞれ押します。2人＋1人のときの奇数・偶数は、2人側のチームで見ます（エノルミータ2人＝奇数、トレスマジア2人＝偶数）。3人目が相手チームのときだけ逆になります。期待度UPは記録のみで推定には使いません。割合は出しません。'
  };
  const DEF={startGames:0,currentGames:0,games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),
    ...Object.fromEntries(Object.entries(GROUPS).map(([key,arr])=>[key,Object.fromEntries(arr.map(c=>[c[0],0]))])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  function freeGames(S){return n(S,'currentGames')-n(S,'startGames');}
  function freeText(S){const g=freeGames(S);return g>=0?g+'G':'−';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'−';}
  // 割合の分母は定義済みの既知行だけ。未知の拡張キーも母数には混ぜない。
  function knownTotal(S,key){return GROUPS[key].filter(c=>c[0]!=='unknown').reduce((a,c)=>a+n(S[key],c[0]),0);}
  function hasPercent(key){return !['rbTeam','rbThird','rbFlag'].includes(key);}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function section(title,lines){return lines.length?'\n■'+title+'\n'+lines.join('\n')+'\n':'';}
  // 確定演出＝濃厚系（rank>0 と 246枚OVER）。ヴァーツ出現（設定2否定）は除外には使うが確定演出には数えない。
  function allStrong(S){
    return Object.entries(GROUPS).filter(([key])=>key!=='rbFlag').flatMap(([key,arr])=>arr.filter(c=>c[3]>0||c[4]).map(c=>({label:c[1],rank:c[3]||Math.min(...SETTINGS.filter(s=>!c[4].includes(s))),odd:!!c[4],value:n(S[key],c[0])})));
  }
  function bayesExclusions(S){
    return Object.entries(GROUPS).flatMap(([key,arr])=>arr.filter(c=>c[3]>0||c[4]).map(c=>({
      label:TITLES[key]+' '+c[1],count:n(S[key],c[0]),exclude:c[4]||SETTINGS.filter(s=>s<c[3])
    })));
  }
  function strongCount(S){return allStrong(S).reduce((a,c)=>a+c.value,0);}
  function bestStrong(S){
    const hit=allStrong(S).filter(c=>c.value>0).sort((a,b)=>b.rank-a.rank)[0];
    return hit?'確定演出 '+hit.label+'('+(hit.odd?'2・4・6':hit.rank===6?'6濃厚':hit.rank+'以上')+') ×'+hit.value:'確定演出 なし';
  }
  function bayesSpec(S){
    const g=freeGames(S);
    return {settings:SETTINGS,exclusions:bayesExclusions(S),
      binomial:g>0?[{label:'CZ',hit:n(S.counts,'cz'),total:g,probs:Object.fromEntries(SETTINGS.map(s=>[s,1/DENOMS.cz[s]]))}]:[],
      multinomial:knownTotal(S,'czType')>0?[{label:'CZ種別',counts:['tm','pa','ve'].map(k=>n(S.czType,k)),probs:CZ_TYPE_PROBS}]:[]};
  }
  function bayesResult(S){return window.CheckerBayes?window.CheckerBayes.estimate(bayesSpec(S)):{empty:true};}
  function bayesPct(p){return window.CheckerBayes?window.CheckerBayes.percent(p):'--';}
  function bayesExcludedSettings(r){return [...new Set((r.reasons||[]).flatMap(x=>x.exclude||[]))].sort((a,b)=>a-b);}
  function bayesExcludeSummary(S){
    const r=bayesResult(S),excluded=bayesExcludedSettings(r);
    return r.contradiction?row('除外 矛盾',1,true,'#ff5c5c'):row(excluded.length?'除外 設'+excluded.join(','):'除外 −',excluded.length);
  }
  function pageStyle(){
    return `<style>
      .cycle-row .ct,.count-row .ct{flex:1;min-width:0}
      /* 文字サイズは明示して固定する（ブラウザ既定に依存させない）。
         現状と同じ16pxを明示するだけで、見た目は変わらない。 */
      .cycle-row .ct b,.count-row .ct b{font-size:16px}.cycle-row .ct b,.cycle-row .ct small,.count-row .ct b,.count-row .ct small{display:block}.cycle-row .ct small,.count-row .ct small{font-size:9.5px;color:var(--muted);line-height:1.35}
      .cycle-row .pct,.count-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .bayes-main{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#171220;border:1px solid #2c2340;border-radius:10px;padding:10px 12px;margin:8px 0}.bayes-main b{color:#ffc94d;font-size:18px}.bayes-main span{color:#9a90a8;font-size:13px}
      .bayes-bar{display:grid;grid-template-columns:44px 1fr 48px;gap:8px;align-items:center;margin:6px 0;font-size:12px;color:#9a90a8}.bayes-bar b{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,#ff3d8f,#ffc94d);min-width:2px}.bayes-bar em{font-style:normal;text-align:right;color:#f2eef5}
    </style>`;
  }
  function groupRows(ctx,key){
    const total=knownTotal(ctx.S,key);
    return GROUPS[key].map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3],hasPercent(key)&&c[0]!=='unknown'?v=>ctx.pct(v,total):undefined)).join('');
  }
  function groupSection(ctx,key){return `<section class="sec"><div class="sec-h">${TITLES[key]}</div><div class="cgrid">${groupRows(ctx,key)}</div>${HINTS[key]?`<div class="hint">${HINTS[key]}</div>`:''}</section>`;}
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),neg=g<0;
    return pageStyle()+`<section class="sec">
      <div class="sec-h">回転数<span class="sub">通常回転 <b style="color:${neg?'#ff5c5c':'#6fd8ff'}">${freeText(S)}</b></span></div>
      <div class="inrow"><label>打ち始めの回転数</label><input type="number" inputmode="numeric" data-number-key="startGames" value="${S.startGames||''}" placeholder="0"></div>
      <div class="inrow" style="margin-top:6px"><label>現在の回転数</label><input type="number" inputmode="numeric" data-number-key="currentGames" value="${S.currentGames||''}" placeholder="0"></div>
      <div class="hint ${neg?'hot':''}">データカウンターのG数を入力します。設定推定の分母になります。${neg?' 現在G数が打ち始めG数を下回っています。':''}</div>
    </section><section class="sec"><div class="sec-h">カウント系</div><div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[2],c[3],v=>oneIn(v,g))).join('')}</div><div class="hint">${HINTS.counts}</div></section>`+groupSection(ctx,'czType');
  }
  function pageSuggest(ctx){
    return pageStyle()+['bbScreens','trophy','over'].map(k=>groupSection(ctx,k)).join('')+
      `<section class="sec"><div class="sec-h">RB中のキャラ紹介</div>${['rbTeam','rbThird','rbFlag'].map((k,i)=>`<div class="sec-h">${['構成','3人目','出現'][i]}</div><div class="cgrid">${groupRows(ctx,k)}</div>`).join('')}<div class="hint">${HINTS.rb}</div></section>`+
      ['panel','smb'].map(k=>groupSection(ctx,k)).join('');
  }
  function pageBayes(ctx){
    const r=bayesResult(ctx.S);let body='';
    if(r.contradiction)body='<div class="hint hot">⚠記録に矛盾があります（示唆の見間違いの可能性）。</div>';
    else if(r.empty)body='<div class="hint">記録が増えると推定できます。</div>';
    else{
      const excluded=bayesExcludedSettings(r),under4=[1,2,3].reduce((a,s)=>a+(r.posterior[s]||0),0);
      body=`<div class="bayes-main"><b>設定4以上 ${bayesPct(r.high)}</b><span>設定3以下 ${bayesPct(under4)}</span></div>
        <div class="bayes-bars">${SETTINGS.map(s=>{const p=r.posterior[s]||0;return `<div class="bayes-bar"><span>設定${s}</span><b style="width:${Math.max(2,p*100)}%"></b><em>${bayesPct(p)}</em></div>`;}).join('')}</div>
        <div class="hint">除外根拠：${(r.reasons||[]).map(x=>x.label+'×'+x.count).join('、')||'なし'}${excluded.length?'（除外済み：設定'+excluded.join('・')+'）':''}</div>
        <div class="hint">推定は入力されたカウントに基づく参考値です。サンプルが少ないほど信頼度は下がります。</div>`;
    }
    return pageStyle()+`<section class="sec"><div class="sec-h">設定推測</div><div class="hint">記録した内容から、各設定である可能性を%で表示します。</div>${body}<div class="hint">CZ確率・CZ種別の振り分け・確定演出から推定します。AT初当りはCZの結果と連動するため表示のみ。奇数・偶数・高設定の期待度UPは記録のみで推定には使いません。</div></section>`;
  }
  const REF_SECTIONS=[
    ['CZ・AT初当り・出玉率',SETTINGS.map((s,i)=>['設定'+s,'CZ 1/'+DENOMS.cz[s].toFixed(1)+' ／ AT初当り全体 1/'+[436.3,422.7,401.4,352.4,316.1,305.7][i].toFixed(1)+' ／ AT初当り（ボーナス契機除外）1/'+AT_OTHER[s].toFixed(1)+' ／ 出玉率 '+[97.6,98.8,100.5,105.0,110.2,112.0][i].toFixed(1)+'%'])],
    ['CZ種別振り分け',SETTINGS.map(s=>['設定'+s,CZ_TYPE_PROBS[s].map((p,i)=>CZ_TYPE[i][1]+' '+(p*100).toFixed(1)+'%').join(' ／ ')])],
    ['ボーナス確率（全設定共通の公表値）',[['ボーナス','1/249.6']]],
    ['小役確率（全設定共通の公表値）',[
      ['ベル','1/6.4'],['リプレイ','1/8.4'],['弱チェ','1/60.9'],['弱スイカ','1/86.6'],
      ['強チェ・強スイカ','各1/500.3'],['悶え','各1/5461.3'],['百合目','1/99.9'],['レア役合算','1/30.0']
    ]],
    ['ギンちゃんトロフィー',[['ホール設定',HINTS.trophy]]]
  ];
  function pageReference(){
    return pageStyle()+`<div class="jump-grid">${REF_SECTIONS.map((s,i)=>`<a href="#ref${i+1}">${s[0]}</a>`).join('')}</div>`+
      REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div><table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S);
    let t=`設定判別メモ｜L 魔法少女にあこがれて\n通常回転 ${freeText(S)} / 確定演出${strongCount(S)}回\n_______\n`;
    t+=section('カウント系',COUNTS.filter(c=>n(S.counts,c[0])>0).map(c=>`${c[1]}▶${n(S.counts,c[0])}回（${oneIn(n(S.counts,c[0]),g)}）`));
    Object.entries(GROUPS).forEach(([key,arr])=>{
      const total=knownTotal(S,key);
      t+=section(TITLES[key],arr.filter(c=>n(S[key],c[0])>0).map(c=>`${c[1]}▶${n(S[key],c[0])}回${hasPercent(key)&&c[0]!=='unknown'&&total>0?' ('+(100*n(S[key],c[0])/total).toFixed(0)+'%)':''}`));
    });
    return t+'\nby slot-tools.jp\n解析出典:ちょんぼりすた様';
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:!!c[3],text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))},
      ...Object.entries(GROUPS).map(([key,arr])=>({title:DETAIL_TITLES[key]||TITLES[key],percent:hasPercent(key),...(hasPercent(key)?{denominator:knownTotal(S,key)}:{}),items:arr.map(c=>({label:(DETAIL_LABELS[key]||{})[c[0]]||c[1],value:n(S[key],c[0]),hot:!!c[3],...(c[0]==='unknown'?{text:c[1]+' ×'+n(S[key],c[0]),show:n(S[key],c[0])>0}:{})}))}))];
  }
  function summary(S,key,label,predicate){
    const hits=GROUPS[key].filter(c=>c[0]!=='unknown'&&(!predicate||predicate(c))&&n(S[key],c[0])>0);
    return row(label+' '+(hits.map(c=>c[1]+'×'+n(S[key],c[0])).join('・')||'−'),hits.reduce((a,c)=>a+n(S[key],c[0]),0));
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    ['startGames','currentGames','games'].forEach(k=>{out[k]=integer(out[k]);});
    ['counts',...Object.keys(GROUPS)].forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=integer(out[key][k]);});
    });
    if(out.img===undefined)out.img=DEF.img;
    if(out.iconChoice===undefined)out.iconChoice=DEF.iconChoice;
    return out;
  }
  window.CheckerConfigs.mahoako={
    uiV2:true,nanaCollab:false,storageKey:'mahoako-checker-v1',defaults:DEF,
    mergeKeys:['counts',...Object.keys(GROUPS)],sourceUrl:'https://chonborista.com/slot/newgin-slot/264698/',normalizeState,
    share:{title:'L 魔法少女にあこがれて 設定判別メモ',hashtags:'#まほあこ #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageBayes(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:'L 魔法少女にあこがれて',metaText:(ctx,date)=>date+'  通常回転 '+freeText(ctx.S),titleFitMax:650,
      footerTags:'#まほあこ #設定判別',downloadName:'mahoako_check.png',detailDownloadName:'mahoako_check_detail.png',detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S),total=knownTotal(S,'czType');return [
        ['CZ',oneIn(n(S.counts,'cz'),g)],['AT ボーナス以外',oneIn(n(S.counts,'atOther'),g)],
        ['パネル以上',total>0?((n(S.czType,'pa')+n(S.czType,'ve'))*100/total).toFixed(0)+'%':'−'],['確定演出','計'+strongCount(S)+'回']
      ];},
      chart:ctx=>({title:'CZ種別',x:130,step:200,width:80,items:CZ_TYPE.slice(0,3).map(c=>({label:c[1],value:n(ctx.S.czType,c[0])}))}),
      bottom:ctx=>{const S=ctx.S;return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:[row(bestStrong(S),strongCount(S),undefined,'#ffc94d'),summary(S,'bbScreens','終了画面',c=>c[3]>0),summary(S,'trophy','トロフィー',c=>c[3]>0)]},
        {x:560,items:[summary(S,'over','枚数'),summary(S,'rbThird','RB濃厚',c=>c[3]>0),bayesExcludeSummary(S)]}
      ]};}
    }
  };
})();

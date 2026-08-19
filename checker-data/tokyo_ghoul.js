(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const SCREENS=[
    ['kaneki','金木研','デフォルト',0],
    ['amonMado','亜門＆真戸','奇数設定期待度UP',0],
    ['suzuyaShinohara','鈴屋＆篠原','偶数設定期待度UP',0],
    ['rize','神代利世','設定1否定',0],
    ['fueguchi','笛口親子','高設定期待度UP(弱)',0],
    ['yomoItoriUta','四方＆イトリ＆ウタ','高設定期待度UP(強)',0],
    ['kanekiKirishima','金木＆霧嶋','設定4以上濃厚',1],
    ['anteiku','あんていく全員集合','設定6濃厚',1]
  ];
  const TROPHIES=[
    ['bronze','銅トロフィー','設定2以上濃厚',1],
    ['silver','銀トロフィー','設定3以上濃厚',1],
    ['gold','金トロフィー','設定4以上濃厚',1],
    ['ghoul','喰柄トロフィー','設定5以上濃厚',1],
    ['rainbow','虹トロフィー','設定6濃厚',1]
  ];
  const INVITES=[
    ['evenDinner','偶にはディナーでもどうだい','偶数設定期待度UP',0],
    ['strangeScent','不思議な香りだ','設定1否定',0],
    ['bookworm','君はなかなかの活字中毒らしいね','設定2否定',0],
    ['booksGood','本は良いよね…','設定3否定',0],
    ['sorry','僕としたことがすまない','設定4否定',0],
    ['enjoy','存分に楽しもうじゃないか','設定4以上濃厚',1],
    ['specialNight','特別な夜を楽しもうじゃないか','設定6濃厚',1]
  ];
  const CZ_CARDS=[
    ['suzuya','鈴屋什造','偶数設定濃厚',0],
    ['owl','梟','設定4以上濃厚',1],
    ['arima','有馬貴将','設定6濃厚',1]
  ];
  const OVER=[
    ['o456','456OVER','設定4以上濃厚',1],
    ['o666','666OVER','設定6濃厚',1],
    ['o1000m7','1000-7OVER','設定6濃厚（993枚獲得時に出現）',1]
  ];
  const ED_CARDS=[
    ['gold','金カード','高設定濃厚',1],
    ['rainbow','虹カード','設定6濃厚',1]
  ];
  const RATES=[
    ['weakCherryCz','超高確中の弱チェリーからのCZ当選率','精神世界中の弱チェリーからCZ当選','設1:40.3%⇔設6:64.4%',1],
    ['spirit33','超高確(精神世界)の保証G数 33G割合','33G ÷ 13G/23G/33G合計','設1:3.1%⇔設6:12.5%',1],
    ['atReturn','AT引き戻し当選率','AT終了後の引き戻し当選','設1:7.8%⇔設6:15.2%',1],
    ['cz100','100G以内のCZ以上当選率','通常時スタートから100G+前兆以内','設1:19.6%⇔設6:36.0%',1]
  ];
  const RECORDS=[
    ['uraAt','裏AT突入回数','有馬貴将ジャッジメント経由は除外'],
    ['episodeBonus','エピソードボーナス回数','中段チェリー経由は除外']
  ];
  const REF_SECTIONS=[
    ['招待状（規定G数示唆）',[
      ['今夜ディナーを楽しもう','デフォルト'],
      ['パーティーの時間は未定だ','規定G数を示唆'],
      ['1時35分に…','残り100G or 300G or 500G以内'],
      ['2時46分に…','残り200G or 400G or 600G以内'],
      ['最悪の事態にはならないだろう','600G否定'],
      ['喰うか喰われるかは君次第だ','残り200G以内 or 500G以上'],
      ['3時までに…','残り300G以内濃厚'],
      ['2時までに…','残り200G以内濃厚'],
      ['今すぐ…','残り100G以内濃厚']
    ]],
    ['CZ終了画面のカード（モード示唆）',[
      ['金木研① / 金木研②','デフォルト'],
      ['霧嶋董香 / 笛口雛実','モードB以上期待度UP'],
      ['亜門鋼太朗','モードB以上濃厚'],
      ['真戸呉緒','モードC以上濃厚'],
      ['金木研(喰種) / 霧嶋董香(喰種)','チャンスモード以上濃厚'],
      ['月山習','天国準備モード以上濃厚'],
      ['神代利世','天国モード濃厚']
    ]],
    ['アイキャッチ',[
      ['金木研','デフォルト'],
      ['霧嶋董香','通常B以上期待度UP'],
      ['笛口雛実','通常C以上期待度UP'],
      ['月山習','本前兆期待度UP'],
      ['神代利世','本前兆期待度大幅UP'],
      ['赫眼キャラ(金木・董香・雛実・月山)','規定ゲームまで残り100G以内濃厚'],
      ['神代利世(赫眼)','連続演出復活濃厚']
    ]],
    ['前兆発生ゲームの法則',[
      ['50G','前兆発生でチャンス以上、前兆ステージ移行で天国濃厚'],
      ['100G','前兆ステージ移行ナシで天国準備濃厚'],
      ['150G','前兆発生で通常B以上、前兆ステージ移行で本前兆濃厚'],
      ['200G','前兆発生ナシで天国準備濃厚、前兆ステージ移行ナシで通常B以上期待度UP'],
      ['250G','前兆発生で通常C以上濃厚、前兆ステージ移行で本前兆濃厚'],
      ['300G','前兆ステージ移行ナシでチャンス濃厚'],
      ['400G','前兆発生ナシで通常C濃厚'],
      ['500G','前兆ステージ移行ナシでチャンス濃厚'],
      ['600G','本前兆濃厚']
    ]]
  ];

  const DEF={
    games:0,
    screens:Object.fromEntries(SCREENS.map(v=>[v[0],0])),
    trophies:Object.fromEntries(TROPHIES.map(v=>[v[0],0])),
    invites:Object.fromEntries(INVITES.map(v=>[v[0],0])),
    czCards:Object.fromEntries(CZ_CARDS.map(v=>[v[0],0])),
    over:Object.fromEntries(OVER.map(v=>[v[0],0])),
    edCards:Object.fromEntries(ED_CARDS.map(v=>[v[0],0])),
    rates:Object.fromEntries(RATES.flatMap(v=>[[v[0]+'r',0],[v[0]+'w',0]])),
    spirit:{g13:0,g23:0,g33:0},
    records:Object.fromEntries(RECORDS.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:'—';}
  function pctLine(a,b){return b>0?`${a}回 (${(100*a/b).toFixed(0)}%)`:`${a}回`;}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]));}
  function detailRatio(label,a,b,hot){return {label,value:Number(a)||0,hot:!!hot,text:label+' '+(b>0?ratio(a,b):'—'),show:b>0};}
  function nonZeroParts(parts){const out=parts.filter(p=>p.v>0).map(p=>p.t+'×'+p.v);return out.length?out.join('・'):'−';}
  function shown(prefix,parts){return `${prefix} ${nonZeroParts(parts)}`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function rateWin(S,id){return id==='spirit33'?n(S.spirit,'g33'):n(S.rates,id+'w');}
  function rateReach(S,id){return id==='spirit33'?sum(S.spirit):n(S.rates,id+'r');}
  function rateText(S,id){return ratio(rateWin(S,id),rateReach(S,id));}
  function allStrong(S){
    return [
      ...SCREENS.filter(c=>c[3]).map(c=>({label:c[1],value:n(S.screens,c[0])})),
      ...TROPHIES.map(c=>({label:c[1],value:n(S.trophies,c[0])})),
      ...INVITES.filter(c=>c[3]).map(c=>({label:c[1],value:n(S.invites,c[0])})),
      ...CZ_CARDS.filter(c=>c[3]).map(c=>({label:c[1],value:n(S.czCards,c[0])})),
      ...OVER.map(c=>({label:c[1],value:n(S.over,c[0])})),
      ...ED_CARDS.map(c=>({label:c[1],value:n(S.edCards,c[0])}))
    ];
  }
  function strongCount(S){return allStrong(S).reduce((a,b)=>a+b.value,0);}
  function bestStrong(S){
    const rank=label=>label.includes('6')||label.includes('虹')||label.includes('666')||label.includes('1000')||label.includes('全員')||label.includes('特別')||label.includes('有馬')?6:label.includes('5')||label.includes('喰柄')?5:4;
    const hit=allStrong(S).filter(x=>x.value>0).sort((a,b)=>rank(b.label)-rank(a.label))[0];
    return hit?`最強 ${hit.label} ×${hit.value}`:'濃厚示唆 なし';
  }

  function cycleRow(ctx,id,name,sub){
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
  function countRow(ctx,path,name,sub,hot){
    const value=path.split('.').reduce((obj,key)=>obj&&obj[key],ctx.S);
    return `<div class="crow count-row ${hot?'hot':''}">
      <div class="ct"><b>${name}</b><small>${sub}</small></div>
      <div class="num">${Number(value)||0}</div>
      <button type="button" class="cycle-btn" data-bump="${path}" data-label="${name}" aria-label="${name}を1回${ctx.mode<0?'減算':'追加'}">${ctx.mode<0?'−':'＋'}</button>
    </div>`;
  }
  function pageStyle(){
    return `<style>
      .cycle-row .ct,.count-row .ct{flex:1;min-width:0}.cycle-row .ct b,.cycle-row .ct small,.count-row .ct b,.count-row .ct small{display:block}.cycle-row .ct small,.count-row .ct small{font-size:9.5px;color:var(--muted);line-height:1.35}
      .cycle-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
    </style>`;
  }

  function pageSuggest(ctx){
    const S=ctx.S;
    return pageStyle()+`
  <section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${sum(S.screens)}回</span></div>
    <div class="cgrid">${SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.screens)))).join('')}</div>
    <div class="hint">AT終了画面で設定を示唆。</div></section>
  <section class="sec"><div class="sec-h">トロフィー<span class="sub">計${sum(S.trophies)}回</span></div>
    <div class="cgrid">${TROPHIES.map(c=>ctx.crow('trophies.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.trophies)))).join('')}</div>
    <div class="hint">AT終了画面のトロフィーで設定を示唆。示唆内容は解析上の予想値。未確定パターンは未収録。</div></section>
  <section class="sec"><div class="sec-h">招待状（設定示唆）<span class="sub">計${sum(S.invites)}回</span></div>
    <div class="cgrid">${INVITES.map(c=>ctx.crow('invites.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.invites)))).join('')}</div>
    <div class="hint">◯50G消化時に出現する招待状のうち、設定を示唆するパターン。</div></section>
  <section class="sec"><div class="sec-h">CZ終了画面のカード（設定示唆）<span class="sub">計${sum(S.czCards)}回</span></div>
    <div class="cgrid">${CZ_CARDS.map(c=>ctx.crow('czCards.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.czCards)))).join('')}</div>
    <div class="hint">CZ失敗時のPUSHで出現するカードのうち、設定を示唆するパターン。</div></section>
  <section class="sec"><div class="sec-h">獲得枚数表示</div>
    <div class="cgrid">${OVER.map(c=>ctx.crow('over.'+c[0],c[1],c[2],c[3])).join('')}</div>
    <div class="hint">AT中の特定の獲得枚数表示で設定を示唆。</div></section>
  <section class="sec"><div class="sec-h">エンディング中のカード<span class="sub">計${sum(S.edCards)}回</span></div>
    <div class="cgrid">${ED_CARDS.map(c=>ctx.crow('edCards.'+c[0],c[1],c[2],c[3],v=>ctx.pct(v,sum(S.edCards)))).join('')}</div>
    <div class="hint">エンディング中に出現するカードで設定を示唆。青・赤等の弱示唆は未収録。</div></section>`;
  }
  function pageCounts(ctx){
    const S=ctx.S;
    return pageStyle()+`<section class="sec"><div class="sec-h">カウント系</div>
    <div class="cgrid">
      ${cycleRow(ctx,'weakCherryCz','超高確中の弱チェリーからのCZ当選率','設1:40.3%⇔設6:64.4%')}
      <div class="crow cycle-row hot">
        <div class="ct"><b>超高確(精神世界)の保証G数</b><small>33G割合: ${rateText(S,'spirit33')} / 設1:3.1%⇔設6:12.5%</small></div>
        <div class="pct">${sum(S.spirit)}回</div>
      </div>
      ${countRow(ctx,'spirit.g13','13G','到達したG数で加算',0)}
      ${countRow(ctx,'spirit.g23','23G','到達したG数で加算',0)}
      ${countRow(ctx,'spirit.g33','33G','判定対象',1)}
      ${cycleRow(ctx,'atReturn','AT引き戻し当選率','設1:7.8%⇔設6:15.2%')}
      ${cycleRow(ctx,'cz100','100G以内のCZ以上当選率','設1:19.6%⇔設6:36.0%')}
    </div>
    <div class="hint">当選=d+1,n+1／ハズレ=d+1。行タップでは加算されません。精神世界中の弱チェリーは滞在が目視できる場合のみ、前兆中の内部超高確は対象外です。100G以内判定は朝一スタートを除外。</div>
  </section>
  <section class="sec"><div class="sec-h">記録枠（判別非関与）</div>
    <div class="cgrid">${RECORDS.map(c=>countRow(ctx,'records.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">裏ATは有馬貴将ジャッジメント経由を除外。エピソードボーナスは中段チェリー経由を除外。B群のため確率表示は行いません。</div>
  </section>`;
  }
  function pageReference(){
    return pageStyle()+REF_SECTIONS.map(sec=>`<section class="sec"><div class="sec-h">${sec[0]}</div>
      <table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
      ${sec[0]==='前兆発生ゲームの法則'?'<div class="hint">前兆発生=東京上空への移行煽り発生、前兆ステージ=東京上空。レア役による前兆が重なると法則が崩れる場合があります。</div>':''}
    </section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S;
    let t=`設定判別メモ｜L東京喰種\n濃厚示唆${strongCount(S)}回 / 主要率 ${RATES.map(r=>r[1].replace('超高確中の','').replace('超高確(精神世界)の保証G数','保証33G')).map((name,i)=>`${name}:${rateText(S,RATES[i][0])}`).join(' / ')}\n_______\n`;
    t+=section('AT終了画面',sum(S.screens)>0?SCREENS.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.screens,c[0]),sum(S.screens))}`):[]);
    t+=section('トロフィー',sum(S.trophies)>0?TROPHIES.filter(c=>n(S.trophies,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.trophies,c[0]),sum(S.trophies))}`):[]);
    t+=section('招待状（設定示唆）',sum(S.invites)>0?INVITES.filter(c=>n(S.invites,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.invites,c[0]),sum(S.invites))}`):[]);
    t+=section('CZ終了カード',sum(S.czCards)>0?CZ_CARDS.filter(c=>n(S.czCards,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.czCards,c[0]),sum(S.czCards))}`):[]);
    t+=section('獲得枚数',OVER.filter(c=>n(S.over,c[0])>0).map(c=>`${c[1]}▶${n(S.over,c[0])}回`));
    t+=section('EDカード',sum(S.edCards)>0?ED_CARDS.filter(c=>n(S.edCards,c[0])>0).map(c=>`${c[1]}▶${pctLine(n(S.edCards,c[0]),sum(S.edCards))}`):[]);
    t+=section('カウント系',RATES.map(c=>`${c[1]}▶${rateText(S,c[0])}`));
    t+=section('記録枠',RECORDS.filter(c=>n(S.records,c[0])>0).map(c=>`${c[1]}▶${n(S.records,c[0])}回`));
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'AT終了画面',items:detailItems(SCREENS,S.screens),percent:true},
      {title:'トロフィー',items:detailItems(TROPHIES,S.trophies),percent:true},
      {title:'招待状（設定示唆）',items:detailItems(INVITES,S.invites),percent:true},
      {title:'CZ終了カード（設定示唆）',items:detailItems(CZ_CARDS,S.czCards),percent:true},
      {title:'獲得枚数表示',items:detailItems(OVER,S.over)},
      {title:'EDカード',items:detailItems(ED_CARDS,S.edCards),percent:true},
      {title:'カウント系',items:RATES.map(c=>detailRatio(c[1],rateWin(S,c[0]),rateReach(S,c[0]),c[4]))},
      {title:'記録枠',items:RECORDS.map(c=>detailItem(c[1],n(S.records,c[0]),0))}
    ];
  }

  window.CheckerConfigs.tokyo_ghoul={
    nanaCollab:false,
    storageKey:'tokyo-ghoul-checker-v1',
    defaults:DEF,
    mergeKeys:['screens','trophies','invites','czCards','over','edCards','rates','spirit','records'],
    normalizeState:out=>{
      Object.keys(out.rates||{}).forEach(k=>{out.rates[k]=Math.max(0,Number(out.rates[k])||0);});
      ['weakCherryCz','atReturn','cz100'].forEach(id=>{if(out.rates[id+'w']>out.rates[id+'r'])out.rates[id+'r']=out.rates[id+'w'];});
      ['g13','g23','g33'].forEach(k=>{out.spirit[k]=Math.max(0,Number(out.spirit[k])||0);});
      return out;
    },
    sourceUrl:'https://chonborista.com/slot/spiky/226073/',
    share:{title:'L東京喰種 設定判別メモ',hashtags:'#東京喰種 #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageSuggest(ctx),
      ()=>pageCounts(ctx),
      ()=>pageReference(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'L東京喰種',
      hideGames:true,
      footerTags:'#東京喰種 #設定判別',
      downloadName:'tokyo_ghoul_check.png',
      detailDownloadName:'tokyo_ghoul_check_detail.png',
      detail:detail,
      blocks:ctx=>[
        ['濃厚示唆',strongCount(ctx.S)+'回'],
        ['弱チェCZ',rateText(ctx.S,'weakCherryCz')],
        ['保証33G',rateText(ctx.S,'spirit33')],
        ['100G以内',rateText(ctx.S,'cz100')]
      ],
      chart:ctx=>({
        title:'主要カウント率',
        type:'percentGroups',
        groups:[{
          title:'設定差項目',
          titleX:540,
          x:170,
          step:185,
          width:86,
          total:100,
          color:'#ff3d8f',
          items:[
            {label:'弱CZ',value:rateReach(ctx.S,'weakCherryCz')>0?100*rateWin(ctx.S,'weakCherryCz')/rateReach(ctx.S,'weakCherryCz'):0},
            {label:'33G',value:rateReach(ctx.S,'spirit33')>0?100*rateWin(ctx.S,'spirit33')/rateReach(ctx.S,'spirit33'):0},
            {label:'引戻',value:rateReach(ctx.S,'atReturn')>0?100*rateWin(ctx.S,'atReturn')/rateReach(ctx.S,'atReturn'):0},
            {label:'100G',value:rateReach(ctx.S,'cz100')>0?100*rateWin(ctx.S,'cz100')/rateReach(ctx.S,'cz100'):0}
          ]
        }]
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
              row(shown('トロフィー',[{t:'銅',v:n(S.trophies,'bronze')},{t:'銀',v:n(S.trophies,'silver')},{t:'金',v:n(S.trophies,'gold')},{t:'喰',v:n(S.trophies,'ghoul')},{t:'虹',v:n(S.trophies,'rainbow')}]),sum(S.trophies)),
              row(shown('AT画面',[{t:'4+',v:n(S.screens,'kanekiKirishima')},{t:'6',v:n(S.screens,'anteiku')}]),n(S.screens,'kanekiKirishima')+n(S.screens,'anteiku')),
              row(shown('招待状',[{t:'4+',v:n(S.invites,'enjoy')},{t:'6',v:n(S.invites,'specialNight')}]),n(S.invites,'enjoy')+n(S.invites,'specialNight')),
              row(shown('CZカード',[{t:'4+',v:n(S.czCards,'owl')},{t:'6',v:n(S.czCards,'arima')}]),n(S.czCards,'owl')+n(S.czCards,'arima'))
            ]},
            {x:560,items:[
              row(`濃厚示唆 計${strongCount(S)}回`,strongCount(S),strongCount(S)>0,'#ffc94d'),
              row(shown('枚数',[{t:'456',v:n(S.over,'o456')},{t:'666',v:n(S.over,'o666')},{t:'1000-7',v:n(S.over,'o1000m7')}]),sum(S.over)),
              row(shown('EDカード',[{t:'金',v:n(S.edCards,'gold')},{t:'虹',v:n(S.edCards,'rainbow')}]),sum(S.edCards)),
              row('弱チェCZ '+rateText(S,'weakCherryCz'),rateReach(S,'weakCherryCz')),
              row('100G以内 '+rateText(S,'cz100'),rateReach(S,'cz100'))
            ]}
          ]
        };
      }
    }
  };
})();

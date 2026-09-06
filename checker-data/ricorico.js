(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const PROLOGUE=[
    ['ep1','EP1','Time will tell①／デフォルト',0,'P1'],
    ['ep2','EP2','The more the merrier／デフォルト',0,'P2'],
    ['ep3','EP3','Repay evil with evil／示唆調査中',0,'P3'],
    ['ep4','EP4','Time will tell②／示唆調査中',0,'P4']
  ];
  const RUSH_EP=[
    ['ep1','EP1','Easy does it／デフォルト',0,'R1'],
    ['ep2','EP2','Nothing seek, nothing find／デフォルト',0,'R2'],
    ['ep3','EP3','Opposites attract／調査中',0,'R3'],
    ['ep4','EP4','Recoil of Lycoris -side千束＆真島-／調査中',0,'R4']
  ];
  const W_EP=[
    ['ep1','EP1','More haste, less speed／デフォルト',0,'W1'],
    ['ep2','EP2','So far, so good／デフォルト',0,'W2'],
    ['ep3','EP3','-sideリコリコ-／調査中',0,'W3'],
    ['ep4','EP4','-sideハワイ-／調査中',0,'W4']
  ];
  const TROPHY=[
    ['bronze','銅トロフィー','設定2以上確定演出',2,'銅'],
    ['silver','銀トロフィー','設定3以上確定演出',3,'銀'],
    ['gold','金トロフィー','設定4以上確定演出',4,'金'],
    ['kirin','キリン柄トロフィー','設定5以上確定演出',5,'キ'],
    ['rainbow','虹トロフィー','設定6確定演出',6,'虹']
  ];
  const ZONES=[
    ['z100','100g'],
    ['z250','250g'],
    ['z400','400g'],
    ['z600','600g'],
    ['z750','750g']
  ];
  const BONUS_ART=[
    ['appear','一枚絵出現','示唆調査中',0,'絵']
  ];
  // [id, UI表示名, サブラベル, rank, カード略号, テンプレ表記]
  // テンプレ表記の全角スペースは、なな様テンプレの ▶︎ 位置を揃えるための原文どおりの詰め物。
  const AT_END=[
    ['def','デフォルト（2パターン）','デフォルト',0,'デ','デフォ(2ﾊﾟﾀｰﾝ)'],
    ['takina','たきな私服','示唆調査中',0,'た','たきな私服　　'],
    ['chisato','千束私服','示唆調査中',0,'千','千束私服　　　'],
    ['dress','ドレスコード','示唆調査中',0,'ド','ドレスコード　'],
    ['kitaoshiage','北押上の風景','示唆調査中',0,'北','北押上の風景　'],
    ['robota','ロボ太','示唆調査中',0,'ロ','ロボ太　　　　'],
    ['hawaii','ハワイ','示唆調査中',0,'ハ','ハワイ🌺　　　']
  ];
  // [id, UI表示名, テンプレ表記]
  const CONV=[
    ['weak','弱役変換','弱役変換　'],
    ['strong','強役変換','強役変換　']
  ];
  // [stateキー, ①②合算行, ③行, ④行]（テンプレ表記は原文どおり）
  const EP_GROUPS=[
    ['prologue','ﾌﾟﾛﾛｰｸﾞ①.②','ﾌﾟﾛﾛｰｸﾞEP③','ﾌﾟﾛﾛｰｸﾞEP④'],
    ['rush','ﾗｯｼｭ中①.②','ﾗｯｼｭ中EP③','ﾗｯｼｭ中EP④'],
    ['wep','ﾗｯｼｭW①.②','ﾗｯｼｭW EP③','ﾗｯｼｭW EP④']
  ];

  const DEF={
    games:0,
    counts:{cz:0,at:0,direct:0,child:0},
    prologue:{ep1:0,ep2:0,ep3:0,ep4:0},
    rush:{ep1:0,ep2:0,ep3:0,ep4:0},
    wep:{ep1:0,ep2:0,ep3:0,ep4:0},
    trophy:Object.fromEntries(TROPHY.map(v=>[v[0],0])),
    rates:Object.fromEntries(ZONES.flatMap(z=>[[z[0]+'r',0],[z[0]+'w',0]])),
    conv:Object.fromEntries(CONV.flatMap(c=>[[c[0]+'d',0],[c[0]+'c',0],[c[0]+'w',0]])),
    art:Object.fromEntries(BONUS_ART.map(v=>[v[0],0])),
    atEnd:Object.fromEntries(AT_END.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function detailItem(label,value,hot,text){
    const item={label,value:Number(value)||0,hot:!!hot};
    if(text)item.text=text;
    return item;
  }
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],n(state,c[0]),c[3]>0));}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function normalizeCounterObject(out,key){
    out[key]=Object.assign({},DEF[key],out[key]||{});
    Object.keys(out[key]||{}).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
  }
  function rateReach(S,id){return n(S.rates,id+'r');}
  function rateWin(S,id){return n(S.rates,id+'w');}
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:'-';}
  function rateText(S,id){return ratio(rateWin(S,id),rateReach(S,id));}
  function cycleRow(ctx,id,name){
    const S=ctx.S;
    // 減算モードで「ハズレ」を押すと到達だけが減り、当選回数を下回りうる。
    // n<=d を壊さないよう、減らせるハズレが残っていない場合はボタンを無効化する。
    const canMinus=rateReach(S,id)>rateWin(S,id);
    const missAttrs=ctx.mode<0&&!canMinus?'disabled aria-disabled="true"':`data-bump="rates.${id}r"`;
    return `<div class="crow cycle-row">
      <div class="ct"><b>${name}</b></div>
      <div class="num">${rateWin(S,id)}</div>
      <div class="pct">${rateText(S,id)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="rates.${id}r,rates.${id}w" data-label="${name} 当選" aria-label="${name} 当選">当選</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${name} ハズレ" aria-label="${name} ハズレ">ハズレ</button>
      </div>
    </div>`;
  }
  function convDenom(S,id){return n(S.conv,id+'d');}
  function convHit(S,id){return n(S.conv,id+'c');}
  function convWin(S,id){return n(S.conv,id+'w');}
  function convText(S,id){return `${convHit(S,id)}/${convDenom(S,id)}`;}
  function convRow(ctx,id,name){
    const S=ctx.S;
    // 減算モードで「しなかった」を押すと分母だけが減り、変換した回数を下回りうる。
    // n<=d を壊さないよう、減らせる「しなかった」が残っていない場合はボタンを無効化する。
    const canMinus=convDenom(S,id)>convHit(S,id);
    const missAttrs=ctx.mode<0&&!canMinus?'disabled aria-disabled="true"':`data-bump="conv.${id}d"`;
    return `<div class="crow cycle-row conv-row">
      <div class="ct"><b>${name}</b></div>
      <div class="num">${convHit(S,id)}</div>
      <div class="pct">${convText(S,id)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="conv.${id}d,conv.${id}c" data-label="${name} 変換した" aria-label="${name} 変換した">変換した</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${name} しなかった" aria-label="${name} しなかった">しなかった</button>
      </div>
    </div>`;
  }
  function rankText(rank){return rank===6?'6確定':rank+'以上';}
  function allCert(S){
    return TROPHY.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.trophy,c[0]),rank:c[3],order:10+c[3]}));
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function certTier(S,rank){return allCert(S).filter(v=>v.rank===rank).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段（アプリ等）と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">規定ゲーム数（当選G数帯）<span class="sub">到達 ${ZONES.reduce((a,z)=>a+rateReach(S,z[0]),0)}回</span></div>
    <style>
      .cycle-row .num{min-width:38px}
      .cycle-row .ct{flex:1;min-width:0}
      .cycle-row .ct b,.cycle-row .ct small{display:block}
      .cycle-row .pct{min-width:92px;text-align:right}
      .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}
      .cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}
      .cycle-btn.win{color:#ffc94d}
      .minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      .cycle-btn[disabled]{opacity:.4}
    </style>
    <div class="cgrid">${ZONES.map(z=>cycleRow(ctx,z[0],z[1])).join('')}</div>
    <div class="hint">各ゾーン到達時に記録。当選したら当選側を押してください。減算モードでは「当選」が到達と当選の両方を、「ハズレ」が到達だけを1つ戻します。戻せるハズレが残っていない場合、そのボタンは押せません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">変換<span class="sub">弱 ${convHit(S,'weak')}/${convDenom(S,'weak')}・強 ${convHit(S,'strong')}/${convDenom(S,'strong')}</span></div>
    <style>
      .conv-row .pct{min-width:56px}
      .conv-row .cycle-btn{min-width:62px}
    </style>
    <div class="cgrid">
      ${convRow(ctx,'weak','弱役変換')}
      ${ctx.crow('conv.weakw','弱役変換からの当選','変換後に当選した回数',0)}
      ${convRow(ctx,'strong','強役変換')}
      ${ctx.crow('conv.strongw','強役変換からの当選','変換後に当選した回数',0)}
    </div>
    <div class="hint">レア役成立時の変換有無と、変換からの当選を記録します。減算モードでは「変換した」が分母と変換回数の両方を、「しなかった」が分母だけを1つ戻します。戻せる「しなかった」が残っていない場合、そのボタンは押せません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.cz','CZ(オポジット)','設1:1/198.7⇔設6:1/169.4',0)}
      ${ctx.crow('counts.at','AT初当り','設1:1/328.8⇔設6:1/256.7',1)}
      ${ctx.crow('counts.direct','AT直撃','設1:1/22429.5⇔設6:1/6263.7（他設定は調査中）',1)}
      ${ctx.crow('counts.child','幼少期CZ(ファースト)','設1:1/3965.0⇔設6:1/2084.8（他設定は調査中）',1)}
    </div>
    <div class="hint">AT直撃と幼少期CZは出現率が低いため、引けた場合の判別材料として扱ってください。</div>
  </section>`;
  }
  function pageSuggest(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">プロローグエピソード<span class="sub">計${sum(S.prologue)}回</span></div>
    <div class="cgrid">${PROLOGUE.map(c=>ctx.crow('prologue.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">プロローグで発生したエピソードを記録します。EP3・EP4の示唆内容は解析待ちです。</div>
  </section>
  <section class="sec">
    <div class="sec-h">RUSH中エピソードボーナス<span class="sub">計${sum(S.rush)}回</span></div>
    <div class="cgrid">${RUSH_EP.map(c=>ctx.crow('rush.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">RUSH中のエピソードボーナスで発生したエピソードを記録します。EP3・EP4の示唆内容は解析待ちです。</div>
  </section>
  <section class="sec">
    <div class="sec-h">W中エピソードボーナス<span class="sub">計${sum(S.wep)}回</span></div>
    <div class="cgrid">${W_EP.map(c=>ctx.crow('wep.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">W中のエピソードボーナスで発生したエピソードを記録します。EP3・EP4の示唆内容は解析待ちです。</div>
  </section>
  <section class="sec">
    <div class="sec-h">サミートロフィー<span class="sub">計${sum(S.trophy)}回</span></div>
    <div class="cgrid">${TROPHY.map(c=>ctx.crow('trophy.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">ボーナス中一枚絵<span class="sub">計${sum(S.art)}回</span></div>
    <div class="cgrid">${BONUS_ART.map(c=>ctx.crow('art.'+c[0],c[1],c[2],0)).join('')}</div>
  </section>
  <section class="sec">
    <div class="sec-h">AT終了画面<span class="sub">計${sum(S.atEnd)}回</span></div>
    <div class="cgrid">${AT_END.map(c=>ctx.crow('atEnd.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">現在はデフォルト画面のみ記録できます。AT終了画面は複数パターンの存在が判明していますが、各パターンの示唆内容が解析待ちのため、判明後に行を追加します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  // なな様完成版テンプレの行構成・表記・空行位置に一致させる。
  // 未記録でも全行を出す（テンプレが記入枠として全行並ぶ形式のため）。
  // 例外はサミートロフィーのみで、出現時だけ見出しごと追記する。
  function tplText(ctx){
    const S=ctx.S,g=S.games;
    const L=['設定判別メモ｜スマスロ リコリス・リコイル',`通常 ${g||0}G`,'_______','','■規定ゲーム数'];
    ZONES.forEach(z=>L.push(`${z[1]}▶︎ ${rateWin(S,z[0])}/${rateReach(S,z[0])}`));
    L.push('','■変換');
    CONV.forEach(c=>{
      L.push(`${c[2]}▶︎ ${convHit(S,c[0])}/${convDenom(S,c[0])}`);
      L.push(`からの当選▶︎ ${countLine(convWin(S,c[0]))}`);
    });
    L.push('',
      `■CZ(ｵﾎﾟｼﾞｯﾄ)▶︎ ${countLine(n(S.counts,'cz'))}`,
      `■幼少期CZ(ﾌｧｰｽﾄ)▶︎ ${countLine(n(S.counts,'child'))}`,
      '↪︎(1/3965〜1/2084)',
      '',
      `■AT直撃(1/22429〜1/6263)▶︎ ${countLine(n(S.counts,'direct'))}`,
      '',
      '■エピソード');
    EP_GROUPS.forEach((grp,i)=>{
      const st=S[grp[0]];
      if(i>0)L.push('');
      L.push(`${grp[1]}▶︎ ${countLine(n(st,'ep1')+n(st,'ep2'))}`);
      L.push(`${grp[2]}▶︎ ${countLine(n(st,'ep3'))}`);
      L.push(`${grp[3]}▶︎ ${countLine(n(st,'ep4'))}`);
    });
    L.push('',`■ボーナス中一枚絵▶︎ ${countLine(sum(S.art))}`,'','■終了画面');
    AT_END.forEach(c=>L.push(`${c[5]}▶︎ ${countLine(n(S.atEnd,c[0]))}`));
    if(sum(S.trophy)>0){
      L.push('','■サミートロフィー');
      TROPHY.filter(c=>n(S.trophy,c[0])>0)
        .forEach(c=>L.push(`${c[1]}▶︎ ${countLine(n(S.trophy,c[0]))}`));
    }
    L.push('','by slot-tools.jp');
    const credit=ctx.nanaCreditText('text');
    if(credit)L.push(credit);
    L.push('解析出典:ちょんぼりすた様');
    return L.join('\n');
  }
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',n(S.counts,'cz'),0),
        detailItem('AT初当り',n(S.counts,'at'),1),
        detailItem('AT直撃',n(S.counts,'direct'),1),
        detailItem('幼少期CZ突入',n(S.counts,'child'),1)
      ]},
      {title:'変換',items:CONV.flatMap(c=>[
        {label:c[1],value:convHit(S,c[0]),hot:false,text:`${c[1]} ${convHit(S,c[0])}/${convDenom(S,c[0])}`,show:convDenom(S,c[0])>0},
        detailItem(`${c[1]}からの当選`,convWin(S,c[0]),0)
      ])},
      {title:'プロローグエピソード',items:detailItems(PROLOGUE,S.prologue)},
      {title:'RUSH中エピソードボーナス',items:detailItems(RUSH_EP,S.rush)},
      {title:'W中エピソードボーナス',items:detailItems(W_EP,S.wep)},
      {title:'サミートロフィー',items:detailItems(TROPHY,S.trophy)},
      {title:'規定ゲーム数',items:ZONES.map(z=>({label:z[1],value:rateWin(S,z[0]),hot:false,text:`${z[1]} ${rateWin(S,z[0])}/${rateReach(S,z[0])}`,show:rateReach(S,z[0])>0}))},
      {title:'ボーナス中一枚絵',items:detailItems(BONUS_ART,S.art)},
      {title:'AT終了画面',items:detailItems(AT_END,S.atEnd)}
    ];
  }

  window.CheckerConfigs.ricorico={
    nanaCollab:true,
    storageKey:'ricorico-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','prologue','rush','wep','trophy','rates','conv','art','atEnd'],
    sourceUrl:'https://chonborista.com/slot/sammy-slot/261631/',
    normalizeState:out=>{
      out.games=Math.max(0,Number(out.games)||0);
      ['counts','prologue','rush','wep','trophy','art','atEnd'].forEach(key=>normalizeCounterObject(out,key));
      out.rates=Object.assign({},DEF.rates,out.rates||{});
      Object.keys(out.rates).forEach(k=>{out.rates[k]=Math.max(0,Number(out.rates[k])||0);});
      ZONES.forEach(z=>{if(out.rates[z[0]+'w']>out.rates[z[0]+'r'])out.rates[z[0]+'r']=out.rates[z[0]+'w'];});
      out.conv=Object.assign({},DEF.conv,out.conv||{});
      Object.keys(out.conv).forEach(k=>{out.conv[k]=Math.max(0,Number(out.conv[k])||0);});
      CONV.forEach(c=>{if(out.conv[c[0]+'c']>out.conv[c[0]+'d'])out.conv[c[0]+'d']=out.conv[c[0]+'c'];});
      return out;
    },
    share:{title:'スマスロ リコリス・リコイル 設定判別メモ',hashtags:'#リコリコ #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageSuggest(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'スマスロ リコリス・リコイル',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#リコリコ #設定判別',
      downloadName:'ricorico_check.png',
      detailDownloadName:'ricorico_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['AT初当り',n(S.counts,'at')+'回'],
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['トロフィー',sum(S.trophy)+'回'],
          ['確定演出','計'+certCount(S)+'回']
        ];
      },
      chart:ctx=>({
        title:'示唆分布',
        x:150,
        step:160,
        width:80,
        items:[
          {label:'2+',value:certTier(ctx.S,2)},
          {label:'3+',value:certTier(ctx.S,3)},
          {label:'4+',value:certTier(ctx.S,4)},
          {label:'5+',value:certTier(ctx.S,5)},
          {label:'6',value:certTier(ctx.S,6)}
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
              row(bestCert(S),certCount(S),certCount(S)>0,'#ffc94d'),
              row(`AT初当り ${n(S.counts,'at')}回`,n(S.counts,'at')),
              row(`CZ当選 ${n(S.counts,'cz')}回`,n(S.counts,'cz')),
              row(`AT直撃 ${n(S.counts,'direct')}回 / 幼少期CZ ${n(S.counts,'child')}回`,
                  n(S.counts,'direct')+n(S.counts,'child')),
              row(`通常回転 ${S.games||0}G`,S.games||0)
            ]},
            {x:560,items:[
              row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
              row(shown('トロフィー',[['銅',n(S.trophy,'bronze')],['銀',n(S.trophy,'silver')],['金',n(S.trophy,'gold')],['キ',n(S.trophy,'kirin')],['虹',n(S.trophy,'rainbow')]]),sum(S.trophy)),
              row(shown('プロローグ',[['1',n(S.prologue,'ep1')],['2',n(S.prologue,'ep2')],['3',n(S.prologue,'ep3')],['4',n(S.prologue,'ep4')]]),sum(S.prologue)),
              row(shown('RUSH中EP',[['1',n(S.rush,'ep1')],['2',n(S.rush,'ep2')],['3',n(S.rush,'ep3')],['4',n(S.rush,'ep4')]]),sum(S.rush)),
              row(shown('W中EP',[['1',n(S.wep,'ep1')],['2',n(S.wep,'ep2')],['3',n(S.wep,'ep3')],['4',n(S.wep,'ep4')]]),sum(S.wep))
            ]}
          ]
        };
      }
    }
  };
})();

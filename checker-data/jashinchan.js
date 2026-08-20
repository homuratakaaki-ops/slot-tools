(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const AT_SCREENS=[
    ['jashin','邪神ちゃん','デフォルト',0,'邪'],
    ['minos','ミノス','奇数設定期待度UP（弱）',0,'ミ'],
    ['medusa','メデューサ','奇数設定期待度UP（強）',0,'メ'],
    ['pekora','ぺこら','偶数設定期待度UP（弱）',0,'ぺ'],
    ['poporon','ぽぽろん','偶数設定期待度UP（強）',0,'ぽ'],
    ['yurineA','ゆりねA','高設定期待度UP（弱）',0,'ゆA'],
    ['yurineB','ゆりねB','高設定期待度UP（強）',0,'ゆB'],
    ['evil','悪だくみ','設定2以上確定演出',2,'悪'],
    ['swim','水着','設定4以上確定演出',4,'水'],
    ['pajama','パジャマ','設定5以上確定演出',5,'パ'],
    ['all','全員集合','設定6確定演出',6,'全']
  ];
  const KUJILUCKY=[
    ['bronze','銅','設定2以上確定演出',2],
    ['silver','銀','設定3以上確定演出',3],
    ['gold','金','設定4以上確定演出',4],
    ['kumanomi','クマノミ柄','設定5以上確定演出',5],
    ['rainbow','虹','設定6確定演出',6]
  ];
  const CHARS=[
    ['def','デフォルト','邪神ちゃん・ゆりね・氷ちゃん・遊佐',0],
    ['odd','奇数設定期待度UP','ミノス・ぺこら・キョンキョン・ランラン',0],
    ['even','偶数設定期待度UP','メデューサ・ペルセポネ2世・ぴの・ぽぽろん',0],
    ['highWeak','高設定期待度UP・弱','芽依・リエール・ペルセポネ1世',0],
    ['ecute','エキュート','高設定期待度UP（強）',0],
    ['atre','アトレ','高設定期待度UP（強）',0],
    ['justice','ジャスティス','設定1否定',0],
    ['fighter','ファイター','設定2否定',0],
    ['commander','コマンダー','設定3否定',0],
    ['esp','エスプ','設定1・2否定',0],
    ['genius','ジーニアス','設定1・3否定',0],
    ['perfect','パーフェクト','設定4以上確定演出',4],
    ['devilYurine','悪魔コス ゆりね','設定6確定演出',6]
  ];
  const COMBOS=[
    ['high2','高設定キャラ2回','同一小悪魔ボーナス内。設定2以上期待度UP',0],
    ['high3','高設定キャラ3回','同一小悪魔ボーナス内。設定3以上期待度UP',0],
    ['high4','高設定キャラ4回','同一小悪魔ボーナス内。設定4以上確定演出',4],
    ['ecuteAtre','エキュート＆アトレ両方出現','設定2以上確定演出',2]
  ];
  const SEALS=[
    ['mei','橘芽依','奇数設定期待度UP',0],
    ['yusaHyouchan','遊佐＆氷ちゃん','偶数設定期待度UP',0],
    ['kyonRan','キョンキョン＆ランラン','奇数設定期待度UP（強）',0],
    ['pinoPoporon','ぴの＆ぽぽろん','偶数設定期待度UP（強）',0],
    ['persephone2','ペルセポネ2世','高設定期待度UP',0],
    ['lierPersephone1','リエール＆ペルセポネ1世','設定4以上確定演出',4],
    ['ecuteAtre','エキュート＆アトレ','設定6確定演出',6]
  ];
  const REF_SECTIONS=[
    ['キャラ分類対応表',[
      ['デフォルト','邪神ちゃん・ゆりね・氷ちゃん・遊佐'],
      ['奇数設定期待度UP','ミノス・ぺこら・キョンキョン・ランラン'],
      ['偶数設定期待度UP','メデューサ・ペルセポネ2世・ぴの・ぽぽろん'],
      ['高設定期待度UP・弱','芽依・リエール・ペルセポネ1世'],
      ['高設定期待度UP・強','エキュート、アトレは複合条件があるため個別に記録'],
      ['否定系','ジャスティス=設定1否定、ファイター=設定2否定、コマンダー=設定3否定、エスプ=設定1・2否定、ジーニアス=設定1・3否定'],
      ['確定演出','パーフェクト=設定4以上、悪魔コス ゆりね=設定6']
    ]],
    ['ボーナス終了時PUSH',[
      ['18種','内部モード示唆。設定判別ではなく次回モードや状態を確認するための演出です。'],
      ['扱い','本ツールではカウント対象外。必要な場合は出典ページで演出内容を確認してください。']
    ]],
    ['ステチェンアイキャッチ',[
      ['36種','内部モード示唆。設定判別ではなく滞在モード推測の材料です。'],
      ['扱い','本ツールではカウント対象外。画像やキャラ対応は出典ページを参照してください。']
    ]],
    ['ステチェンワイプ',[
      ['4種','内部モード示唆。設定判別ではなくモード推測用です。'],
      ['扱い','カウンターには含めません。参照専用の情報として扱います。']
    ]]
  ];
  const DEF={
    games:0,
    cz:{bonus:0,at:0,direct:0,returnAt:0},
    screens:Object.fromEntries(AT_SCREENS.map(v=>[v[0],0])),
    atcz:Object.fromEntries(KUJILUCKY.map(v=>[v[0],0])),
    icons:Object.fromEntries(CHARS.map(v=>[v[0],0])),
    ed:Object.fromEntries(COMBOS.map(v=>[v[0],0])),
    coins:Object.fromEntries(SEALS.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]>0));}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'-'}`;
  }
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function rankText(rank){return rank===6?'6確定':rank+'以上';}
  function allCert(S){
    return [
      ...AT_SCREENS.filter(c=>c[3]>0).map(c=>({label:c[1]+'画面',value:n(S.screens,c[0]),rank:c[3],order:10+c[3]})),
      ...KUJILUCKY.filter(c=>c[3]>0).map(c=>({label:'クジラッキー'+c[1],value:n(S.atcz,c[0]),rank:c[3],order:20+c[3]})),
      ...CHARS.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.icons,c[0]),rank:c[3],order:30+c[3]})),
      ...COMBOS.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.ed,c[0]),rank:c[3],order:40+c[3]})),
      ...SEALS.filter(c=>c[3]>0).map(c=>({label:c[1]+'シール',value:n(S.coins,c[0]),rank:c[3],order:50+c[3]}))
    ];
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}
      .jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
      .ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}
      .ref-table tr:last-child td{border-bottom:0}
      .ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}
      .ref-table td:last-child{color:var(--muted);line-height:1.45}
    </style>`;
  }

  function pageHatsu(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${S.games||''}" placeholder="0"></div>
    <div class="hint">台のメニュー画面で総ゲーム数を確認して入力します。AT中の消化分を含むため、確率の算出には使わず記録として保存します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">
      ${ctx.crow('cz.bonus','ボーナス回数','AT中の消化分を含む総回転数のため、確率の算出には使わず回数のみ記録します',0)}
      ${ctx.crow('cz.at','AT回数','AT当選回数の記録',0)}
      ${ctx.crow('cz.direct','AT直撃','高設定ほど発生しやすいとされますが数値が未公表のため、設定推測には使わず記録のみです',0)}
      ${ctx.crow('cz.returnAt','AT引き戻し','高設定ほど発生しやすいとされますが数値が未公表のため、設定推測には使わず記録のみです',0)}
    </div>
  </section>`;
  }
  function pageEnd(ctx){
    const screenN=sum(ctx.S.screens), kujiN=sum(ctx.S.atcz);
    return `<section class="sec"><div class="sec-h">AT終了画面<span class="sub">計${screenN}回</span></div>
    <div class="cgrid">${AT_SCREENS.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0)).join('')}</div></section>
  <section class="sec"><div class="sec-h">クジラッキー<span class="sub">計${kujiN}回</span></div>
    <div class="cgrid">${KUJILUCKY.map(c=>ctx.crow('atcz.'+c[0],c[1],c[2],1)).join('')}</div>
    <div class="hint">初当りの小悪魔ボーナスを除くボーナス終了画面で出現します。ホール側で出現バランスを変更できるカスタムが搭載されているため、出現頻度そのものは設定推測に使えません。</div></section>`;
  }
  function pageChars(ctx){
    return `<section class="sec"><div class="sec-h">キャラ紹介分類<span class="sub">小悪魔ボーナス中</span></div>
    <div class="cgrid">${CHARS.map(c=>ctx.crow('icons.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">24種を示唆内容ごとに13分類へ集約しています。個々のキャラ名は参照タブで確認できます。</div></section>
  <section class="sec"><div class="sec-h">複合条件</div>
    <div class="cgrid">${COMBOS.map(c=>ctx.crow('ed.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">1回の小悪魔ボーナス内で高設定期待度UPのキャラが何回出たかを記録します。強弱は問いません。4回出た場合は「4回」だけを押してください（2回・3回は押さない）。エキュート＆アトレは回数条件とは別枠なので、両方出た場合はあわせて押してください。</div></section>`;
  }
  function pageSeals(ctx){
    return `<section class="sec"><div class="sec-h">シール<span class="sub">うれしいちゃんす</span></div>
    <div class="cgrid">${SEALS.map(c=>ctx.crow('coins.'+c[0],c[1],c[2],c[3]>0)).join('')}</div></section>
    <section class="sec"><div class="sec-h">参照</div>
    <div class="hint">キャラ分類、内部モード示唆、ステチェン系の参照情報です。カウンター・カード出力の対象外です。</div></section>
    ${pageReference()}`;
  }
  function pageReference(){
    return pageStyle()+`<div class="jump-grid">${REF_SECTIONS.map((s,i)=>`<a href="#ref${i+1}">${s[0]}</a>`).join('')}</div>`+
      REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div>
      <table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table>
    </section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S;
    let t=`設定判別メモ｜L邪神ちゃんドロップキック\n総回転数 ${S.games||0}G / ボーナス${S.cz.bonus}回 / AT${S.cz.at}回\n_______\n`;
    t+=section('初当り',[
      `AT直撃▶${countLine(S.cz.direct)}`,
      `AT引き戻し▶${countLine(S.cz.returnAt)}`
    ]);
    t+=section('AT終了画面',sum(S.screens)>0?AT_SCREENS.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=section('クジラッキー',sum(S.atcz)>0?KUJILUCKY.filter(c=>n(S.atcz,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.atcz,c[0]))}`):[]);
    t+=section('キャラ紹介',sum(S.icons)>0?CHARS.filter(c=>n(S.icons,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.icons,c[0]))}`):[]);
    t+=section('複合条件',sum(S.ed)>0?COMBOS.filter(c=>n(S.ed,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.ed,c[0]))}`):[]);
    t+=section('シール',sum(S.coins)>0?SEALS.filter(c=>n(S.coins,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.coins,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }
  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[detailItem('ボーナス回数',S.cz.bonus,0),detailItem('AT回数',S.cz.at,0),detailItem('AT直撃',S.cz.direct,0),detailItem('AT引き戻し',S.cz.returnAt,0)]},
      {title:'AT終了画面',items:detailItems(AT_SCREENS,S.screens)},
      {title:'クジラッキー',items:detailItems(KUJILUCKY,S.atcz)},
      {title:'キャラ紹介分類',items:detailItems(CHARS,S.icons)},
      {title:'複合条件',items:detailItems(COMBOS,S.ed)},
      {title:'シール',items:detailItems(SEALS,S.coins)}
    ];
  }

  window.CheckerConfigs.jashinchan={
    nanaCollab:false,
    storageKey:'jashinchan-checker-v1',
    defaults:DEF,
    mergeKeys:['cz','screens','atcz','icons','ed','coins'],
    sourceUrl:'https://chonborista.com/slot/sanyo-slot/260992/',
    share:{title:'L邪神ちゃんドロップキック 設定判別メモ',hashtags:'#邪神ちゃんドロップキック #設定判別'},
    pages:(ctx,pageCard)=>[
      ()=>pageHatsu(ctx),
      ()=>pageEnd(ctx),
      ()=>pageChars(ctx),
      ()=>pageSeals(ctx),
      pageCard
    ],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'L邪神ちゃんドロップキック',
      titleFitMax:610,
      footerTags:'#邪神ちゃんドロップキック #設定判別',
      downloadName:'jashinchan_check.png',
      detailDownloadName:'jashinchan_check_detail.png',
      detail:detail,
      blocks:ctx=>[
        ['ボーナス',ctx.S.cz.bonus+'回'],
        ['AT',ctx.S.cz.at+'回'],
        ['AT直撃',ctx.S.cz.direct+'回'],
        ['引き戻し',ctx.S.cz.returnAt+'回']
      ],
      chart:ctx=>({
        title:'示唆分布',
        x:100,
        step:115,
        width:60,
        items:[
          {label:'2+',value:allCert(ctx.S).filter(v=>v.rank===2).reduce((a,b)=>a+b.value,0)},
          {label:'3+',value:allCert(ctx.S).filter(v=>v.rank===3).reduce((a,b)=>a+b.value,0)},
          {label:'4+',value:allCert(ctx.S).filter(v=>v.rank===4).reduce((a,b)=>a+b.value,0)},
          {label:'5+',value:allCert(ctx.S).filter(v=>v.rank===5).reduce((a,b)=>a+b.value,0)},
          {label:'6',value:allCert(ctx.S).filter(v=>v.rank===6).reduce((a,b)=>a+b.value,0)},
          {label:'否',value:n(ctx.S.icons,'justice')+n(ctx.S.icons,'fighter')+n(ctx.S.icons,'commander')+n(ctx.S.icons,'esp')+n(ctx.S.icons,'genius')},
          {label:'奇偶',value:n(ctx.S.screens,'minos')+n(ctx.S.screens,'medusa')+n(ctx.S.screens,'pekora')+n(ctx.S.screens,'poporon')+n(ctx.S.icons,'odd')+n(ctx.S.icons,'even')+n(ctx.S.coins,'mei')+n(ctx.S.coins,'yusaHyouchan')+n(ctx.S.coins,'kyonRan')+n(ctx.S.coins,'pinoPoporon')}
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
              row(shown('終了確定',[['悪',n(S.screens,'evil')],['水',n(S.screens,'swim')],['パ',n(S.screens,'pajama')],['全',n(S.screens,'all')]]),n(S.screens,'evil')+n(S.screens,'swim')+n(S.screens,'pajama')+n(S.screens,'all')),
              row(shown('キャラ確定',[['完',n(S.icons,'perfect')],['悪ゆ',n(S.icons,'devilYurine')]]),n(S.icons,'perfect')+n(S.icons,'devilYurine')),
              row(shown('否定',[['1否',n(S.icons,'justice')],['2否',n(S.icons,'fighter')],['3否',n(S.icons,'commander')],['12否',n(S.icons,'esp')],['13否',n(S.icons,'genius')]]),n(S.icons,'justice')+n(S.icons,'fighter')+n(S.icons,'commander')+n(S.icons,'esp')+n(S.icons,'genius')),
              row(shown('初当り',[['直',S.cz.direct],['戻',S.cz.returnAt]]),S.cz.direct+S.cz.returnAt)
            ]},
            {x:560,items:[
              row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
              row(shown('クジラッキー',[['銅',n(S.atcz,'bronze')],['銀',n(S.atcz,'silver')],['金',n(S.atcz,'gold')],['ク',n(S.atcz,'kumanomi')],['虹',n(S.atcz,'rainbow')]]),sum(S.atcz)),
              row(shown('複合',[['2回',n(S.ed,'high2')],['3回',n(S.ed,'high3')],['4回',n(S.ed,'high4')],['エア',n(S.ed,'ecuteAtre')]]),sum(S.ed)),
              row(shown('シール',[['4+',n(S.coins,'lierPersephone1')],['6',n(S.coins,'ecuteAtre')]]),n(S.coins,'lierPersephone1')+n(S.coins,'ecuteAtre')),
              row(shown('高設定系',[['ゆA',n(S.screens,'yurineA')],['ゆB',n(S.screens,'yurineB')],['弱',n(S.icons,'highWeak')],['エ',n(S.icons,'ecute')],['ア',n(S.icons,'atre')]]),n(S.screens,'yurineA')+n(S.screens,'yurineB')+n(S.icons,'highWeak')+n(S.icons,'ecute')+n(S.icons,'atre'))
            ]}
          ]
        };
      }
    }
  };
})();

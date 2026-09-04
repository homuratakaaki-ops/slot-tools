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
    ['trophy','トロフィー出現','特定設定以上の示唆（色別ランクは解析待ち）',0,'ト']
  ];

  const DEF={
    games:0,
    counts:{cz:0,at:0,direct:0,child:0},
    prologue:{ep1:0,ep2:0,ep3:0,ep4:0},
    rush:{ep1:0,ep2:0,ep3:0,ep4:0},
    wep:{ep1:0,ep2:0,ep3:0,ep4:0},
    trophy:{trophy:0},
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
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
  function epTotal(S){return sum(S.prologue)+sum(S.rush)+sum(S.wep);}
  function normalizeCounterObject(out,key){
    out[key]=Object.assign({},DEF[key],out[key]||{});
    Object.keys(out[key]||{}).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段（アプリ等）と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.cz','CZ当選','設1:1/198.7⇔設6:1/169.4',0)}
      ${ctx.crow('counts.at','AT初当り','設1:1/328.8⇔設6:1/256.7',1)}
      ${ctx.crow('counts.direct','AT直撃','設1:1/22429.5⇔設6:1/6263.7（他設定は調査中）',1)}
      ${ctx.crow('counts.child','幼少期CZ突入','設1:1/3965.0⇔設6:1/2084.8（他設定は調査中）',1)}
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
    <div class="cgrid">${TROPHY.map(c=>ctx.crow('trophy.'+c[0],c[1],c[2],0)).join('')}</div>
    <div class="hint">サミートロフィーの色別ランクは解析待ちのため、出現回数のみ記録します。</div>
  </section>
  <section class="sec">
    <div class="sec-h">AT終了画面<span class="sub">本ツール未実装</span></div>
    <div class="hint">AT終了画面は複数パターンの存在が判明していますが、各パターンの示唆内容が解析待ちのため本ツールでは未実装です。解析判明後に追加します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games;
    let t=`設定判別メモ：スマスロ リコリス・リコイル\n通常 ${g||0}G / CZ${n(S.counts,'cz')}回 / AT${n(S.counts,'at')}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(n(S.counts,'cz'))}`,
      `AT初当り▶${countLine(n(S.counts,'at'))}`,
      `AT直撃▶${countLine(n(S.counts,'direct'))}`,
      `幼少期CZ突入▶${countLine(n(S.counts,'child'))}`
    ]);
    t+=section('プロローグエピソード',sum(S.prologue)>0?PROLOGUE.filter(c=>n(S.prologue,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.prologue,c[0]))}`):[]);
    t+=section('RUSH中エピソードボーナス',sum(S.rush)>0?RUSH_EP.filter(c=>n(S.rush,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.rush,c[0]))}`):[]);
    t+=section('W中エピソードボーナス',sum(S.wep)>0?W_EP.filter(c=>n(S.wep,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.wep,c[0]))}`):[]);
    t+=section('サミートロフィー',sum(S.trophy)>0?TROPHY.filter(c=>n(S.trophy,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.trophy,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
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
      {title:'プロローグエピソード',items:detailItems(PROLOGUE,S.prologue)},
      {title:'RUSH中エピソードボーナス',items:detailItems(RUSH_EP,S.rush)},
      {title:'W中エピソードボーナス',items:detailItems(W_EP,S.wep)},
      {title:'サミートロフィー',items:detailItems(TROPHY,S.trophy)}
    ];
  }

  window.CheckerConfigs.ricorico={
    nanaCollab:false,
    storageKey:'ricorico-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','prologue','rush','wep','trophy'],
    sourceUrl:'https://chonborista.com/slot/sammy-slot/261631/',
    normalizeState:out=>{
      out.games=Math.max(0,Number(out.games)||0);
      ['counts','prologue','rush','wep','trophy'].forEach(key=>normalizeCounterObject(out,key));
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
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['AT初当り',n(S.counts,'at')+'回'],
          ['AT直撃',n(S.counts,'direct')+'回'],
          ['幼少期CZ',n(S.counts,'child')+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:150,
        step:160,
        width:80,
        items:[
          {label:'CZ',value:n(ctx.S.counts,'cz')},
          {label:'AT',value:n(ctx.S.counts,'at')},
          {label:'直撃',value:n(ctx.S.counts,'direct')},
          {label:'幼少',value:n(ctx.S.counts,'child')},
          {label:'ト',value:n(ctx.S.trophy,'trophy')}
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
              row(`AT初当り ${n(S.counts,'at')}回`,n(S.counts,'at')),
              row(`CZ当選 ${n(S.counts,'cz')}回`,n(S.counts,'cz')),
              row(`AT直撃 ${n(S.counts,'direct')}回`,n(S.counts,'direct')),
              row(`幼少期CZ ${n(S.counts,'child')}回`,n(S.counts,'child')),
              row(`トロフィー ${n(S.trophy,'trophy')}回`,n(S.trophy,'trophy'))
            ]},
            {x:560,items:[
              row(`EP計 ${epTotal(S)}回`,epTotal(S)),
              row(shown('プロローグ',[['1',n(S.prologue,'ep1')],['2',n(S.prologue,'ep2')],['3',n(S.prologue,'ep3')],['4',n(S.prologue,'ep4')]]),sum(S.prologue)),
              row(shown('RUSH中EP',[['1',n(S.rush,'ep1')],['2',n(S.rush,'ep2')],['3',n(S.rush,'ep3')],['4',n(S.rush,'ep4')]]),sum(S.rush)),
              row(shown('W中EP',[['1',n(S.wep,'ep1')],['2',n(S.wep,'ep2')],['3',n(S.wep,'ep3')],['4',n(S.wep,'ep4')]]),sum(S.wep)),
              row(`通常回転 ${S.games||0}G`,S.games||0)
            ]}
          ]
        };
      }
    }
  };
})();

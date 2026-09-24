(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const DEF={
    games:0,
    counts:{cz:0,first:0},
    img:null,
    iconChoice:null
  };

  // 設定別出現率が未公表の示唆は記録のみ。推測値の重み付けには使わない。
  const HINT_GROUPS=[
  {
    "title": "終了画面",
    "key": "screen",
    "items": [
      [
        "bbq",
        "白枠 BBQ",
        "高設定示唆（弱）"
      ],
      [
        "beach",
        "白枠 浜辺",
        "高設定示唆（強）"
      ],
      [
        "red",
        "赤枠",
        "設定2以上濃厚"
      ],
      [
        "purple",
        "紫枠",
        "設定4以上濃厚"
      ],
      [
        "silver",
        "銀枠",
        "設定5以上濃厚"
      ],
      [
        "gold",
        "金枠",
        "設定6濃厚"
      ]
    ]
  },
  {
    "title": "REG中キャラ紹介",
    "key": "reg",
    "items": [
      [
        "odd",
        "5人目千鶴からコスプレ",
        "奇数設定期待度UP"
      ],
      [
        "even",
        "4人目墨からコスプレ",
        "偶数設定期待度UP"
      ],
      [
        "highWeak",
        "3人目瑠夏からコスプレ",
        "高設定期待度UP（弱）"
      ],
      [
        "highStrong",
        "2人目麻美からコスプレ",
        "高設定期待度UP（強）"
      ],
      [
        "swimMami",
        "2人目麻美から水着",
        "高設定濃厚"
      ],
      [
        "swimSumi",
        "4人目墨のみ水着",
        "高設定濃厚"
      ],
      [
        "swimChizuru",
        "5人目千鶴のみ水着",
        "高設定濃厚"
      ]
    ]
  },
  {
    "title": "1GレンCHANCE 攻略キャラ",
    "key": "scenario",
    "items": [
      [
        "one",
        "初回① 麻美から",
        "偶数設定期待度UP"
      ],
      [
        "two",
        "初回② 瑠夏から",
        "奇数設定期待度UP"
      ],
      [
        "three",
        "初回③ 墨から",
        "偶数設定期待度UP"
      ],
      [
        "four",
        "初回④ 千鶴から",
        "奇数設定期待度UP"
      ],
      [
        "repeat",
        "同一シナリオ連続",
        "設定5以上濃厚"
      ]
    ]
  },
  {
    "title": "センチメートル演出",
    "key": "cm",
    "items": [
      [
        "44",
        "44cm",
        "設定4以上濃厚"
      ],
      [
        "55",
        "55cm",
        "設定5以上濃厚"
      ],
      [
        "66",
        "66cm",
        "設定6濃厚"
      ]
    ]
  },
  {
    "title": "獲得枚数表示",
    "key": "coins",
    "items": [
      [
        "246",
        "246枚OVER",
        "設定2・4・6濃厚"
      ],
      [
        "456",
        "456枚OVER",
        "設定4以上濃厚"
      ],
      [
        "666",
        "666枚OVER",
        "設定6濃厚"
      ],
      [
        "394",
        "394枚OVER",
        "設定6濃厚"
      ]
    ]
  }
];
  HINT_GROUPS.forEach(group=>group.items.forEach(([id])=>{DEF.counts[group.key+'_'+id]=0;}));
  function hintTotal(S,group){return group.items.reduce((sum,[id])=>sum+n(S.counts,group.key+'_'+id),0);}

  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function row(text,value){return {text,value:Number(value)||0,active:(Number(value)||0)>0};}

  function normalizeState(data){
    const src=data&&typeof data==='object'?data:{};
    const out=Object.assign({},DEF,src);
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(key=>{
      out.counts[key]=Math.max(0,Number(out.counts[key])||0);
    });
    return out;
  }

  function pageHatsu(ctx){
    const S=ctx.S,g=S.games;
    return `<section class="sec">
    <div class="sec-h">通常回転数</div>
    <div class="inrow"><label>通常回転数</label><input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
    <div class="hint">通常時のゲーム数を入力してください。確認手段と分母条件が未確認のため、現時点で1/x表示は行いません。</div>
  </section>
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.cz','CZ当選','設1:1/172⇔設6:1/149',0)}
      ${ctx.crow('counts.first','初当り','設1:1/269⇔設6:1/226',1)}
    </div>
  </section>
  `;
  }


  function pageShisa(ctx){
    return HINT_GROUPS.map(group=>{
      const rows=group.items.map(([id,label,hint])=>ctx.crow('counts.'+group.key+'_'+id,label,hint,/濃厚/.test(hint))).join('');
      const note=group.key==='scenario'?'設定示唆の対象は初回シナリオ。4人攻略後の切替は数えません。引き戻し時は初回として扱います。':
        group.key==='reg'?'キャラ紹介は全15パターンのうち、示唆内容が判明したものだけを掲載しています。':
        group.key==='cm'?'通常時のヒミツ恋ゴコロステージ中と、かのかりBONUSのチャンス告知中が対象です。':'';
      return `<section class="sec"><div class="sec-h">${group.title}<span class="sub">${hintTotal(ctx.S,group)}回</span></div><div class="cgrid">${rows}</div>${note?`<div class="hint">${note}</div>`:''}</section>`;
    }).join('')+'<section class="sec"><div class="hint">エンディング中のボイスは示唆内容が調査中です。設定別の出現率が未公表の項目は、記録・共有のみで数値推測に加味しません。</div></section>';
  }

  function tplText(ctx){
    const S=ctx.S,g=S.games,cz=n(S.counts,'cz'),first=n(S.counts,'first');
    let t=`設定判別メモ｜Lパチスロ 彼女、お借りします\n通常 ${g||0}G / CZ${cz}回 / 初当り${first}回\n_______\n`;
    t+=section('初当り',[
      `CZ当選▶${countLine(cz)}`,
      `初当り▶${countLine(first)}`
    ]);
    HINT_GROUPS.forEach(group=>{
      t+=section(group.title,group.items.filter(([id])=>n(S.counts,group.key+'_'+id)>0)
        .map(([id,label,hint])=>`${label}（${hint}）▶${countLine(n(S.counts,group.key+'_'+id))}`));
    });
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('CZ当選',n(S.counts,'cz'),0),
        detailItem('初当り',n(S.counts,'first'),1)
      ]},
      ...HINT_GROUPS.map(group=>({title:group.title,items:group.items.map(([id,label,hint])=>
        detailItem(label+'（'+hint+'）',n(S.counts,group.key+'_'+id),/濃厚/.test(hint))) }))
    ];
  }

  window.CheckerConfigs.kanokari={
    // 実戦中のUI（タブごとのスクロール位置・説明の折りたたみ・データリセット・
    // 44pxのタップ領域・入力欄のラベル）。2026-09-24 に全機種へ展開。
    uiV2:true,
    nanaCollab:false,
    storageKey:'kanokari-checker-v1',
    defaults:DEF,
    mergeKeys:['counts'],
    sourceUrl:'https://chonborista.com/slot/sankyo-slot/263079/',
    normalizeState:normalizeState,
    share:{title:'Lパチスロ 彼女、お借りします 設定判別メモ',hashtags:'#かのかり #設定判別'},
    pages:(ctx,pageCard)=>[()=>pageHatsu(ctx),()=>pageShisa(ctx),pageCard],
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'Lパチスロ 彼女、お借りします',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#かのかり #設定判別',
      downloadName:'kanokari_check.png',
      detailDownloadName:'kanokari_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S;
        return [
          ['通常回転',(S.games||0)+'G'],
          ['CZ当選',n(S.counts,'cz')+'回'],
          ['初当り',n(S.counts,'first')+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:350,
        step:260,
        width:120,
        items:[
          {label:'CZ',value:n(ctx.S.counts,'cz')},
          {label:'初当り',value:n(ctx.S.counts,'first')}
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
              row(`通常回転 ${S.games||0}G`,S.games||0),
              row(`CZ当選 ${n(S.counts,'cz')}回`,n(S.counts,'cz')),
              row(`初当り ${n(S.counts,'first')}回`,n(S.counts,'first'))
            ]}
          ]
        };
      }
    }
  };
})();

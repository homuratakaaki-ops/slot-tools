(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};

  const BB_END=[
    ['normal','通常パターン(夕方)','デフォルト',0,'通'],
    ['rare','レアパターン(夜)','高設定ほど出現しやすい',0,'レ'],
    ['rareNoTako','タコゲーム未入賞時のレア画面','設定2以上確定演出',2,'2+']
  ];

  // 通常回転数の入力ソース。[id, チップ表記]
  const GAME_SRC=[
    ['unimemo','ユニメモで記録'],
    ['real','実機の通常ゲーム数で記録']
  ];

  // 通常時の小役確率（出典: ちょんぼりすた様、2026/9/22 再取得）。本機の設定は1・2・5・6の4段階。
  // ユニメモで基本カウントされるのは プラム・チェリー合算・スイカ合成 の3つ。
  //   リプレイ     設1・2・5・6:1/7.3（設定差なし）
  //   プラム       設1:1/9.8  設2:1/9.7  設5:1/9.4  設6:1/9.0
  //   チェリー合算 設1:1/22.9 設2:1/21.9 設5:1/21.0 設6:1/20.1
  //   スイカ合成   設1:1/60.0 設2:1/56.2 設5:1/53.0 設6:1/50.0
  // 以下はユニメモで特定条件を解放しないとカウントできないため入力欄を設けていない。
  //   チェリーA 設1・2・5・6:1/184.6（設定差なし）
  //   チェリーB 設1:1/136.5 設2:1/126.0 設5:1/117.0 設6:1/109.2
  //   チェリーC 設1:1/32.3  設2:1/30.9  設5:1/29.7  設6:1/28.5
  //   スイカA   設1:1/66.6  設2:1/62.4  設5:1/58.8  設6:1/55.5
  //   スイカB   設1:1/601.2 設2:1/565.0 設5:1/541.6 設6:1/504.1
  const KOYAKU=[
    ['plum','プラム','設1:1/9.8⇔設6:1/9.0','9.8'],
    ['cherry','チェリー合算','設1:1/22.9⇔設6:1/20.1','22.9'],
    ['melon','スイカ合成','設1:1/60.0⇔設6:1/50.0','60.0']
  ];
  const DEF={
    games:0,
    gameSrc:'unimemo',
    gamesApp:0,
    gamesStart:0,
    gamesNow:0,
    counts:{big:0,reg:0,replayTako:0},
    app:Object.fromEntries(KOYAKU.map(v=>[v[0],0])),
    screens:Object.fromEntries(BB_END.map(v=>[v[0],0])),
    img:null,
    iconChoice:null
  };

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function num(v){return Math.max(0,Number(v)||0);}

  // ---- 通常回転数（分母）----
  // 分母の出典はこの3関数だけにする（§9-84）。1/x・カード・テンプレは必ず denom() を通す。
  function gameSrcOf(S){return (S&&S.gameSrc)==='real'?'real':'unimemo';}
  function rawDenom(S){
    if(gameSrcOf(S)==='real')return num(S.gamesNow)-num(S.gamesStart);
    return num(S.gamesApp);
  }
  function denom(S){const v=rawDenom(S);return v>0?v:0;}
  // 打ち始めより現在が小さいときだけ注意を出す。現在が未入力(0)の間は入力途中とみなす。
  function denomWarn(S){return gameSrcOf(S)==='real'&&num(S.gamesNow)>0&&num(S.gamesNow)<num(S.gamesStart);}
  // カードのメタ行はエンジンが S.games を直接読むため、描画前に必ず同期させる。
  function syncGames(S){if(S)S.games=denom(S);return S?S.games:0;}
  function escAttr(v){return String(v===0||v===undefined||v===null?'':v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  // ---- ユニメモ入力（小役確率）----
  // 小役はボーナス中も成立するため、通常回転数を分母にした実測とは条件が合わない。
  // ユニメモが集計した確率の分母をそのまま入力して使う（SAO2 のダイトモ入力と同じ方式）。
  // 読み出しはこの2関数に集約する（§9-84）。0＝未入力。
  function appRate(S,key){
    const v=Number(String(((S||{}).app||{})[key]??'').trim());
    return Number.isFinite(v)&&v>0?v:0;
  }
  function appRateText(S,key){const d=appRate(S,key);return d>0?'1/'+d.toFixed(1):'';}
  function appFilled(S){return KOYAKU.filter(c=>appRate(S,c[0])>0);}
  function appSummary(S){
    const out=appFilled(S).map(c=>c[1]+appRateText(S,c[0]));
    return out.length?out.join('・'):'−';
  }
  function rate(g,c){return (g>0&&c>0)?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]>0));}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function rankText(rank){return rank===6?'6確定':rank+'以上';}
  function allCert(S){
    return BB_END.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.screens,c[0]),rank:c[3],order:10+c[3]}));
  }
  function certCount(S){return allCert(S).reduce((a,b)=>a+b.value,0);}
  function bestCert(S){
    const hit=allCert(S).filter(x=>x.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }

  function normalizeState(out,src){
    out.gameSrc=gameSrcOf(out);
    ['gamesApp','gamesStart','gamesNow'].forEach(k=>{out[k]=num(out[k]);});
    // 旧版（単欄）の保存値はユニメモ欄へ引き継ぐ。storageKey は v1 のまま。
    if((src||{}).gamesApp===undefined&&!out.gamesApp)out.gamesApp=num((src||{}).games);
    out.games=denom(out);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    out.app=Object.assign({},DEF.app,out.app||{});
    // 小役確率は分母の入力値。空欄・非数・0以下は 0（＝未入力）に倒す。
    Object.keys(out.app).forEach(key=>{
      const v=Number(String(out.app[key]??'').trim());
      out.app[key]=Number.isFinite(v)&&v>0?v:0;
    });
    out.screens=Object.assign({},DEF.screens,out.screens||{});
    Object.keys(out.counts).forEach(key=>{out.counts[key]=Math.max(0,Number(out.counts[key])||0);});
    Object.keys(out.screens).forEach(key=>{out.screens[key]=Math.max(0,Number(out.screens[key])||0);});
    return out;
  }

  // 通常回転数セクション。入力ソースをチップで選び、欄は両方DOMに残して表示だけ切り替える
  // （切替で入力値を消さないため。値は state 側に持つので表示の切替だけで済む）。
  function gameSection(ctx){
    const S=ctx.S,src=gameSrcOf(S),g=denom(S);
    const chips=GAME_SRC.map(v=>
      `<button type="button" class="srcchip${v[0]===src?' on':''}" data-action="gameSrc" data-src="${v[0]}" data-label="通常回転数：${v[1]}" aria-pressed="${v[0]===src?'true':'false'}">${v[1]}</button>`
    ).join('');
    return `<section class="sec">
    <div class="sec-h">通常回転数<span class="sub">分母 ${g}G</span></div>
    <style>
      .srcchips{display:flex;gap:8px;margin-bottom:10px}
      .srcchip{flex:1;min-height:48px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#cfc7da;font-weight:800;font-size:13px;padding:6px 8px;line-height:1.25}
      .srcchip.on{border-color:#ff3d8f;background:rgba(255,61,143,.16);color:#fff}
      .gsrc[hidden]{display:none}
      .hint.warn{color:#ff9b9b}
    </style>
    <div class="srcchips" role="group" aria-label="通常回転数の入力ソース">${chips}</div>
    <div class="gsrc" data-gsrc="unimemo"${src==='unimemo'?'':' hidden'}>
      <div class="inrow"><label>ユニメモの通常時プレイ数</label><input type="number" inputmode="numeric" data-number-key="gamesApp" value="${S.gamesApp||''}" placeholder="0"></div>
      <div class="hint">公式アプリ『ユニメモ』の通常時プレイ数を入力してください。着席時にログインしていれば、自分の遊技分だけが集計されるのでそのまま使えます。総プレイ数ではなく通常時プレイ数を使用します。</div>
    </div>
    <div class="gsrc" data-gsrc="real"${src==='real'?'':' hidden'}>
      <div class="inrow"><label>打ち始め時の通常ゲーム数</label><input type="number" inputmode="numeric" data-number-key="gamesStart" value="${S.gamesStart||''}" placeholder="0"></div>
      <div class="inrow"><label>現在の通常ゲーム数</label><input type="number" inputmode="numeric" data-number-key="gamesNow" value="${S.gamesNow||''}" placeholder="0"></div>
      ${denomWarn(S)?'<div class="hint warn">現在の通常ゲーム数が打ち始めを下回っています。分母は0として扱い、確率表示は行いません。入力を確認してください。</div>':''}
      <div class="hint">実機サブ画面の『通常ゲーム数』を、打ち始めた時点と現在の2回確認して入力してください。差分があなたの遊技分になります。朝イチから打っている場合は打ち始め0で構いません。</div>
    </div>
  </section>`;
  }
  // 確率を入力する行。タップカウントではないので data-c も ＋ボタンも持たせない。
  // 分母だけを入力させ（例: 58.3）、表示は「/ 入力 1/58.3」。未入力なら出さない。
  function appRateRow(S,c){
    const txt=appRateText(S,c[0]);
    return `<div class="crow raterow">
      <div class="lbl"><div class="nm">${c[1]}</div><div class="mn hot">${c[2]}${txt?` / 入力 ${txt}`:''}</div></div>
      <span class="unit">1/</span>
      <input type="number" inputmode="decimal" step="0.1" min="0" data-state-path="app.${c[0]}" value="${escAttr((S.app||{})[c[0]])}" placeholder="${c[3]}" aria-label="${c[1]}の確率（分母）">
    </div>`;
  }
  function pageHatsu(ctx){
    const S=ctx.S,g=denom(S);
    return `${gameSection(ctx)}
  <section class="sec">
    <div class="sec-h">初当り<span class="sub">通常 ${g||0}G</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.big','BIG',`設1:1/324.4⇔設6:1/297.9${rateSuffix(g,n(S.counts,'big'))}`,1)}
      ${ctx.crow('counts.reg','REG',`設1:1/352.3⇔設6:1/300.6${rateSuffix(g,n(S.counts,'reg'))}`,1)}
    </div>
    <div class="hint">合算は設1:1/168.9⇔設6:1/149.6。本機の設定は1・2・5・6の4段階です。</div>
  </section>
  <section class="sec">
    <div class="sec-h">小役確率（ユニメモ）<span class="sub">入力 ${appFilled(S).length}/3</span></div>
    <style>
      .raterow .unit{flex:none;font-size:13px;font-weight:800;color:var(--muted)}
      .raterow input{width:96px}
    </style>
    <div class="cgrid">
      ${KOYAKU.map(c=>appRateRow(S,c)).join('')}
    </div>
    <div class="hint">ユニメモの小役カウントに表示される確率の分母をそのまま入力してください（例: 1/58.3なら58.3）。スイカ合成は設定差が約20%と大きく、判別の主力になります。</div>
  </section>
  <section class="sec">
    <div class="sec-h">リプレイ＋タコゲーム同時成立<span class="sub">計${n(S.counts,'replayTako')}回</span></div>
    <div class="cgrid">
      ${ctx.crow('counts.replayTako','リプレイ＋タコゲーム','設1・2:1/728.2／設5:1/366.1／設6:1/242.7',1)}
    </div>
    <div class="hint">ボーナスゲーム中に擬似リプレイハズシ手順（中・右をフリー打ちしてリプレイテンパイ→左リール枠上に鉢巻付きの白7をビタ押し）を行い、タコランプが点灯した回数を記録します。設定1・2と設定6で約3倍の差がある判別材料です。</div>
    <div class="hint">出典の確率の分母（通常時プレイ数か総プレイ数か）が明示されていないため、実測の1/x表示は行いません（AGENTS.md §9-70）。</div>
  </section>`;
  }

  function pageSuggest(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">BB終了画面<span class="sub">計${sum(S.screens)}回</span></div>
    <div class="cgrid">${BB_END.map(c=>ctx.crow('screens.'+c[0],c[1],c[2],c[3]>0,n=>ctx.pct(n,sum(S.screens)))).join('')}</div>
    <div class="hint">タコゲームに一度も入賞しなかったBBの終了画面がレアパターンだった場合は、専用の行（設定2以上）で記録してください。通常のレアパターン行と重複カウントは不要です。</div>
    <div class="hint">ユニメモはこのツールでは通常回転数（分母）と小役確率の入力に使います。BB終了画面は出るたびにこちらで記録してください。同じ遊技分の分母と示唆が揃い、初当り確率と終了画面を突き合わせて見られます。</div>
  </section>
  <section class="sec">
    <div class="sec-h">解析待ちの示唆<span class="sub">未実装</span></div>
    <div class="hint">BB終了画面のレアパターンの示唆内容は解析待ちです。判明後に更新します。詳細はちょんぼりすた様の解析ページをご覧ください。</div>
  </section>`;
  }

  function tplText(ctx){
    const S=ctx.S,g=denom(S),big=n(S.counts,'big'),reg=n(S.counts,'reg'),rt=n(S.counts,'replayTako');
    let t=`設定判別メモ｜スマスロ タコスロ\n通常 ${g||0}G / BIG${big}回 / REG${reg}回\n_______\n`;
    t+=section('初当り',[
      `BIG▶${countLine(big)}`,
      `REG▶${countLine(reg)}`
    ]);
    t+=section('小役確率（ユニメモ）',appFilled(S).map(c=>`${c[1]}▶${appRateText(S,c[0])}`));
    t+=section('リプレイ＋タコゲーム同時成立',rt>0?[`リプレイ＋タコゲーム▶${countLine(rt)}`]:[]);
    t+=section('BB終了画面',sum(S.screens)>0?BB_END.filter(c=>n(S.screens,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.screens,c[0]))}`):[]);
    t+=`\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
    return t;
  }

  function detail(ctx){
    const S=ctx.S;
    return [
      {title:'初当り',items:[
        detailItem('BIG',n(S.counts,'big'),1),
        detailItem('REG',n(S.counts,'reg'),1)
      ]},
      {title:'小役確率（ユニメモ）',items:KOYAKU.map(c=>({
        label:c[1],value:appRate(S,c[0])>0?1:0,hot:true,
        text:c[1]+' '+appRateText(S,c[0]),show:appRate(S,c[0])>0
      }))},
      {title:'リプレイ＋タコゲーム',items:[
        detailItem('リプレイ＋タコゲーム同時成立',n(S.counts,'replayTako'),1)
      ]},
      {title:'BB終了画面',items:detailItems(BB_END,S.screens),percent:true}
    ];
  }

  window.CheckerConfigs.takoslot={
    // 実戦中のUI（タブごとのスクロール位置・説明の折りたたみ・データリセット・
    // 44pxのタップ領域・入力欄のラベル）。2026-09-24 に全機種へ展開。
    uiV2:true,
    nanaCollab:false,
    actions:{
      // 入力ソースの切替。カウンタではないので減算モードでも同じ動作をする（値は消さない）。
      gameSrc:(ctx,ds)=>{
        const v=ds.src==='real'?'real':'unimemo';
        if(gameSrcOf(ctx.S)===v)return false;
        ctx.S.gameSrc=v;
        syncGames(ctx.S);
        return '通常回転数：'+(GAME_SRC.find(x=>x[0]===v)||[,''])[1];
      }
    },
    storageKey:'takoslot-checker-v1',
    defaults:DEF,
    mergeKeys:['counts','app','screens'],
    sourceUrl:'https://chonborista.com/slot/universal-slot/262349/',
    normalizeState:normalizeState,
    share:{title:'スマスロ タコスロ 設定判別メモ',hashtags:'#タコスロ #設定判別'},
    // 描画のたびに分母を作り直す。エンジンはカードのメタ行で S.games を直接読むため、
    // ページ生成（カードページ含む）より前にここで同期させておく。
    pages:(ctx,pageCard)=>{
      syncGames(ctx.S);
      return [()=>pageHatsu(ctx),()=>pageSuggest(ctx),pageCard];
    },
    template:tplText,
    compactTemplate:tplText,
    card:{
      title:'スマスロ タコスロ',
      titleFitMax:680,
      gameLabel:'通常',
      footerTags:'#タコスロ #設定判別',
      downloadName:'takoslot_check.png',
      detailDownloadName:'takoslot_check_detail.png',
      detail:detail,
      blocks:ctx=>{
        const S=ctx.S,g=syncGames(S);
        // 1/x が出せる項目は、回数を見出し側へ寄せて値を確率にする（枠が222pxしかないため）
        const big=n(S.counts,'big'),reg=n(S.counts,'reg');
        return [
          ['通常回転',g+'G'],
          [rate(g,big)?`BIG ${big}回`:'BIG',rate(g,big)||`${big}回`],
          [rate(g,reg)?`REG ${reg}回`:'REG',rate(g,reg)||`${reg}回`],
          ['ボーナス計',(big+reg)+'回']
        ];
      },
      chart:ctx=>({
        title:'カウント分布',
        x:250,
        step:230,
        width:100,
        items:[
          {label:'BIG',value:n(ctx.S.counts,'big')},
          {label:'REG',value:n(ctx.S.counts,'reg')},
          {label:'終了画面',value:sum(ctx.S.screens)}
        ]
      }),
      bottom:ctx=>{
        const S=ctx.S,g=syncGames(S);
        return {
          title:'サマリー', startY:760, rowGap:44, fontSize:23,
          columns:[
            {x:70,items:[
              row(bestCert(S),certCount(S),certCount(S)>0,'#ffc94d'),
              row(`通常回転 ${g}G`,g),
              row(`BIG ${countRate(g,n(S.counts,'big'))}`,n(S.counts,'big')),
              row(`REG ${countRate(g,n(S.counts,'reg'))}`,n(S.counts,'reg')),
              row(`ボーナス計 ${n(S.counts,'big')+n(S.counts,'reg')}回`,n(S.counts,'big')+n(S.counts,'reg'))
            ]},
            {x:560,items:[
              row(`確定演出 計${certCount(S)}回`,certCount(S),certCount(S)>0,'#ffc94d'),
              row(`通常パターン(夕方) ${n(S.screens,'normal')}回`,n(S.screens,'normal')),
              row(`レアパターン(夜) ${n(S.screens,'rare')}回`,n(S.screens,'rare')),
              row(`タコ未入賞レア ${n(S.screens,'rareNoTako')}回`,n(S.screens,'rareNoTako')),
              row(`小役 ${appSummary(S)}`,appFilled(S).length,appFilled(S).length>0)
            ]}
          ]
        };
      }
    }
  };
})();

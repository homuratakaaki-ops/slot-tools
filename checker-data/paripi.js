(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="paripi";
  const TITLE="スマスロパリピ孔明";
  const SOURCE="https://chonborista.com/slot/yamasa-slot/263531/";
  const TAGS="#パリピ孔明 #設定判別";
  const COUNTS=[["cz","CZ","設1:1/213.6⇔設6:1/171.7"],["bonus","ボーナス初当り","設1:1/309.9⇔設6:1/228.8"]];
  const ST_END=[
    ['kanban','看板','デフォルト・画像①',0,'看','def'],
    ['blue','青背景','デフォルト・画像②',0,'青','def'],
    ['yellow','黄背景','デフォルト・画像③',0,'黄','def'],
    ['even1','偶数設定期待度UP・弱','画像④',0,'偶弱','up'],
    ['even2','偶数設定期待度UP・強','画像⑤',0,'偶強','up'],
    ['high1','高設定期待度UP・弱','画像⑥',0,'高弱','up'],
    ['high2','高設定期待度UP・強','画像⑦',0,'高強','up'],
    ['s2','設定2以上濃厚','画像⑧',2,'2','cert'],
    ['s3','設定3以上濃厚','画像⑨',3,'3','cert'],
    ['s4','設定4以上濃厚','画像⑩',4,'4','cert'],
    ['s5','設定5以上濃厚','画像⑪',5,'5','cert'],
    ['s6','設定6濃厚','画像⑫',6,'6','cert']
  ];
  const TEMPLATE="新台 スマスロ パリピ孔明 \n____\n\n■ｽﾃﾁｪﾝ⑤の倍数CZ直撃▶︎ 0/0\n\n■士気高揚ゾーン\n109g        ▶︎ 0/0\n209g以降▶︎ 0/0\n\n■レア役からのCZ\n\n通常\n弱ﾁｪ    ▶︎ 0/0\nｽｲｶ      ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n高確\n弱ﾁｪ    ▶︎ 0/0\nｽｲｶ      ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n超高\n弱ﾁｪ    ▶︎ 0/0\nｽｲｶ      ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n■CZ選択率\n三歌の礼　▶︎ \n英子の試練▶︎ \n石兵八陣　▶︎  \n\n■AT終了画面\nﾃﾞﾌｫ①   ▶︎ \nﾃﾞﾌｫ②   ▶︎ \nﾃﾞﾌｫ③   ▶︎ \n偶数弱　▶︎ \n偶数強　▶︎ \n高設定弱▶︎ \n高設定強▶︎ \n2以上　▶︎ \n3以上　▶︎ \n4以上　▶︎ \n5以上　▶︎ \n6濃厚　▶︎";
  function ndRow(ctx,opt){
    const canMinus=opt.d>opt.n;
    const missAttrs=ctx.mode<0&&!canMinus?'disabled aria-disabled="true"':`data-bump="${opt.dPath}"`;
    return `<div class="crow cycle-row ${opt.cls||''}">
      <div class="ct"><b>${opt.displayName||opt.name}</b>${opt.sub?`<small class="mn">${opt.sub}</small>`:''}</div>
      <div class="num">${opt.n}</div>
      <div class="pct">${opt.n}/${opt.d}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${opt.dPath},${opt.nPath}" data-label="${opt.name} ${opt.winLabel}" aria-label="${opt.name} ${opt.winLabel}">${opt.winLabel}</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${opt.name} ${opt.missLabel}" aria-label="${opt.name} ${opt.missLabel}">${opt.missLabel}</button>
      </div>
    </div>`;
  }
  const ND_STYLE="      .cycle-row .num{min-width:38px}\n      .cycle-row .ct{flex:1;min-width:0}\n      .cycle-row .ct b,.cycle-row .ct small{display:block}\n      .cycle-row .ct b{font-size:16px}\n      .cycle-row .ct small{font-size:13px;color:var(--muted)}\n      .cycle-row .pct{min-width:92px;text-align:right}\n      .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}\n      .cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}\n      .cycle-btn.win{color:#ffc94d}\n      .minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}\n      .cycle-btn[disabled]{opacity:.4}\n      details.hit-more>summary{display:flex;align-items:center;min-height:44px;cursor:pointer;list-style:none}\n      details.hit-more>summary::-webkit-details-marker{display:none}\n      details.hit-more>summary::before{content:'▾ ';margin-right:4px}\n      details.hit-more[open]>summary::before{content:'▴ '}\n      .jump-nav button{padding:6px 10px}\n";

  const ST_HINT='ST終了時の画面を記録します。画面の見分け方はガイドからちょんぼりすたの画像で確認できます。画像番号はちょんぼりすたの掲載順です。';
  const CZ_TYPE=[['sanka','三歌の礼'],['eiko','英子の試練'],['sekihei','石兵八陣']];
  const RARE_STATES=[['normal','通常'],['high','高確'],['super','超高確']];
  const RARE_ROLES=[['Weak','弱チェリー'],['Melon','スイカ'],['Chance','チャンス目']];
  const ND=[
    ['stechen','n','d','ｽﾃﾁｪﾝ⑤の倍数CZ直撃'],
    ['shiki','n109','d109','109G'],['shiki','n209','d209','209G以降'],
    ...RARE_STATES.flatMap(([key,label])=>RARE_ROLES.map(([role,name])=>['rare',key+role+'N',key+role+'D',label+' '+name]))
  ];
  const SHIKI_HINT='ゲーム数の下2桁が09を超えた後、最初のステージチェンジだけを数えます。例：115Gでステチェン→109Gの欄、220Gでステチェン→209G以降の欄。そのあとのステチェン（例：160G）は数えません。孔明前世のときはボーナス前兆なので数えません。';
  // 先頭に30字以内の要約を置き、畳んだときも行内に1文が残るようにする（§9-97）。
  const RARE_HINT='状態はステージで見分けます。英子の部屋＝高確、スカイスクエア＝超高確、それ以外（BBラウンジ・公園・竹下通り）＝通常。孔明前世のときはボーナス前兆なので数えません。';
  function czTotal(S){return CZ_TYPE.reduce((a,c)=>a+n(S.czType,c[0]),n(S.counts,'cz'));}
  function initialCount(S,key){return key==='cz'?czTotal(S):n(S.counts,key);}

  const stGroup=g=>ST_END.filter(c=>c[5]===g);
  function stTotal(S){return ST_END.reduce((a,c)=>a+n(S.stEnd,c[0]),0);}
  function certItems(S){return ST_END.filter(c=>c[3]>0).map((c,i)=>({label:c[1],rank:c[3],value:n(S.stEnd,c[0]),order:i}));}
  function certCount(S){return certItems(S).reduce((a,c)=>a+c.value,0);}
  function bestCert(S){
    const hit=certItems(S).filter(c=>c.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label} ×${hit.value}`:'確定演出 なし';
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }

  const INITIAL_HINT="CZとボーナスの初当りを記録します。CZは設定1:1/213.6／2:1/207.3／3:1/199.2／4:1/188.8／5:1/179.4／6:1/171.7。ボーナス初当りは設定1:1/309.9／2:1/299.6／3:1/280.0／4:1/262.0／5:1/243.9／6:1/228.8。";

  function n(obj,key){return Number((obj||{})[key])||0;}
  function rate(g,c){return (g>0&&c>0)?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function initialBlock(S,c){const v=initialCount(S,c[0]),r=rate(S.games,v);return r?[c[1]+' '+v+'回',r]:[c[1],v+'回'];}
  function initialDetail(S){return {title:'初当り',items:COUNTS.map(c=>({label:c[1],value:initialCount(S,c[0]),text:c[1]+' '+countRate(S.games,initialCount(S,c[0])),show:initialCount(S,c[0])>0,hot:false}))};}
  function gameSection(S){const g=S.games;return `<section class="sec">
  <div class="sec-h">通常ゲーム数</div>
  <div class="inrow"><label>通常ゲーム数</label>
    <input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  <div class="hint">連動アプリ等で確認した通常時のゲーム数。メニューの総ゲーム数はAT中を含むため入れない</div>
</section>`;}
  function initialSection(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">${CZ_TYPE.map(c=>ctx.crow('czType.'+c[0],c[1],'',false)).join('')}
      <div class="crow sumrow"><div class="lbl"><div class="nm">CZ 計${countRate(S.games,czTotal(S))}</div>${n(S.counts,'cz')>0?`<div class="mn">種類不明 ${n(S.counts,'cz')}回</div>`:''}</div></div>
      ${ctx.crow('counts.bonus',COUNTS[1][1],COUNTS[1][2]+rateSuffix(S.games,n(S.counts,'bonus')),false)}</div>
    <div class="hint">${INITIAL_HINT}</div>
  </section>`;}

  const DEF={games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),stEnd:Object.fromEntries(ST_END.map(c=>[c[0],0])),stechen:{n:0,d:0},shiki:{n109:0,d109:0,n209:0,d209:0},rare:Object.fromEntries(ND.filter(c=>c[0]==='rare').flatMap(c=>[[c[1],0],[c[2],0]])),czType:Object.fromEntries(CZ_TYPE.map(c=>[c[0],0])),img:null,iconChoice:null};
  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
    out.stEnd=Object.assign({},DEF.stEnd,out.stEnd||{});
    Object.keys(out.stEnd).forEach(k=>{out.stEnd[k]=Math.max(0,Number(out.stEnd[k])||0);});
    for(const key of ['stechen','shiki','rare','czType']){
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{const v=Number(out[key][k]);out[key][k]=Number.isFinite(v)?Math.max(0,Math.floor(v)):0;});
    }
    ND.forEach(([key,nKey,dKey])=>{out[key][nKey]=Math.min(out[key][nKey],out[key][dKey]);});
    return out;
  }
  function pageInput(ctx){return gameSection(ctx.S)+initialSection(ctx);}
  function pageNormal(ctx){
    const draw=(items,winLabel,missLabel)=>items.map(([key,nKey,dKey,name])=>ndRow(ctx,{cls:'normal-row',name,nPath:key+'.'+nKey,dPath:key+'.'+dKey,n:n(ctx.S[key],nKey),d:n(ctx.S[key],dKey),winLabel,missLabel})).join('');
    return `<style>${ND_STYLE}
      .normal-row .pct{min-width:48px;text-align:right}
    </style>
    <section class="sec"><div class="sec-h">ｽﾃﾁｪﾝ⑤の倍数CZ直撃</div>
      <div class="cgrid">${draw(ND.slice(0,1),'直撃','なし')}</div>
      <div class="hint">ステージチェンジ回数が5の倍数の周期に到達するたびに記録します</div>
      <div class="hint">設定差は公表されていません</div>
    </section>
    <section class="sec"><div class="sec-h">士気高揚ゾーン</div>
      <div class="hint" data-fold="no">${SHIKI_HINT}</div>
      <div class="cgrid">${draw(ND.slice(1,3),'突入','なし')}</div>
    </section>
    <section class="sec"><div class="sec-h">レア役からのCZ</div>
      <div class="hint">${RARE_HINT}</div>
      <div class="cgrid">${draw(ND.slice(3),'当選','ハズレ')}</div>
    </section>`;
  }
  function pageShisa(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">ST終了画面<span class="sub">計${stTotal(S)}回</span></div>
    <div class="cgrid">${ST_END.map(c=>ctx.crow('stEnd.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,stTotal(S)))).join('')}</div>
    <div class="hint">${ST_HINT}</div>
  </section>`;}
  function tplText(ctx){const S=ctx.S,g=S.games;
    const values=[...ND.map(([key,nKey,dKey])=>n(S[key],nKey)+'/'+n(S[key],dKey)),...CZ_TYPE.map(c=>n(S.czType,c[0])+'回'),...ST_END.map(c=>n(S.stEnd,c[0])+'回')];
    let i=0;
    const text=TEMPLATE.replace(/0\/0|▶︎ *(?=\r?\n|$)/g,m=>{
      const v=values[i++];
      return m.startsWith('0')?v:'▶︎ '+v;
    });
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / CZ${countRate(g,czTotal(S))} / 初当り${countRate(g,n(S.counts,'bonus'))}\n_______\n\n${text}\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
  }
  window.CheckerConfigs[ID]={
    uiV2:true,nanaCollab:true,storageKey:ID+'-checker-v1',defaults:DEF,mergeKeys:['counts','stEnd','stechen','shiki','rare','czType'],sourceUrl:SOURCE,
    normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    pages:(ctx,pageCard)=>[()=>pageInput(ctx),()=>pageNormal(ctx),()=>pageShisa(ctx),pageCard],template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,
      downloadName:ID+'_check.png',detailDownloadName:ID+'_check_detail.png',
      detail:ctx=>[initialDetail(ctx.S),
        {title:'ST終了画面',items:ST_END.map(c=>({label:c[1],value:n(ctx.S.stEnd,c[0]),hot:c[3]>0})),percent:true,denominator:stTotal(ctx.S)},
        {title:'通常時',items:ND.map(([key,nKey,dKey,label])=>({label,value:n(ctx.S[key],nKey),text:label+' '+n(ctx.S[key],nKey)+'/'+n(ctx.S[key],dKey),show:n(ctx.S[key],dKey)>0,hot:false}))}
      ],
      blocks:ctx=>[...COUNTS.map(c=>initialBlock(ctx.S,c)),['通常ゲーム数',(ctx.S.games||0)+'G']],
      chart:ctx=>({title:'初当り',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[1],value:initialCount(ctx.S,c[0])}))}),
      bottom:ctx=>{const S=ctx.S;return {title:'サマリー',startY:752,rowGap:36,fontSize:23,columns:[
        {x:70,items:[
          row(bestCert(S),certCount(S),undefined,'#ffc94d'),
          ...COUNTS.map(c=>row(c[1]+' '+countRate(S.games,initialCount(S,c[0])),initialCount(S,c[0]))),
          row('通常回転 '+(S.games||0)+'G',S.games||0),
          row('ST終了画面 計'+stTotal(S)+'回',stTotal(S))
        ]},
        {x:560,items:[
          row(shown('画面',codes(stGroup('def'),S.stEnd)),stGroup('def').reduce((a,c)=>a+n(S.stEnd,c[0]),0)),
          row(shown('期待度',codes(stGroup('up'),S.stEnd)),stGroup('up').reduce((a,c)=>a+n(S.stEnd,c[0]),0)),
          row(shown('濃厚',codes(stGroup('cert'),S.stEnd)),certCount(S))
        ]}
      ]};}
    }
  };

})();

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
  // ボーナス中の獲得枚数表示。表記は出典の表示列（「222 OVER」等）どおり。
  // 出た時だけ数える項目なので割合は出さない（§9-90）。全5種が確定演出。
  const BONUS_OVER=[
    ['o222','222 OVER','設定2以上濃厚',2],
    ['o456','456 OVER','設定4以上濃厚',4],
    ['o555','555 OVER','設定5以上濃厚',5],
    ['o803','803 OVER','設定5以上濃厚',5],
    ['o666','666 OVER','設定6濃厚',6]
  ];
  // 渋谷決戦ボーナス中のイイネポイント下3桁（10/26 追加）。獲得枚数の「○○○ OVER」とは別の表示。
  // 出た時だけ数える（§9-90）。246 は奇数設定否定（5つ目の配列）で、確定演出では設定2相当に数える。
  const IINE=[
    ['i222','222','設定2以上濃厚',2],
    ['i333','333','設定3以上濃厚',3],
    ['i246','246','設定2・4・6濃厚',0,[1,3,5]],
    ['i123','123','設定4以上濃厚',4],
    ['i444','444','設定4以上濃厚',4],
    ['i456','456','設定4以上濃厚',4],
    ['i555','555','設定5以上濃厚',5],
    ['i803','803','設定5以上濃厚',5],
    ['i666','666','設定6濃厚',6]
  ];
  // 否定された設定を除いた最小の設定を保証設定とみなす（246 → 2）。ST_END の5つ目は符号の文字列なので配列だけを見る。
  const certRank=c=>c[3]||(Array.isArray(c[4])?[1,2,3,4,5,6].find(s=>!c[4].includes(s)):0);
  // エンディング中のレア役で画面右上に出る1枚絵（ST終了画面とは別）。名称・画像番号は出典どおり。
  // デフォルトの絵が無く出た時だけ数えるので割合は出さない（§9-90）。
  const ED_PIC=[
    ['even1','偶数設定期待度UP（弱）','画像①',0],
    ['even2','偶数設定期待度UP（強）','画像②',0],
    ['high1','高設定期待度UP（弱）','画像③',0],
    ['high2','高設定期待度UP（強）','画像④',0],
    ['s2','設定2以上濃厚','画像⑤',2],
    ['s3','設定3以上濃厚','画像⑥',3],
    ['s4','設定4以上濃厚','画像⑦',4],
    ['s5','設定5以上濃厚','画像⑧',5],
    ['s6','設定6濃厚','画像⑨',6]
  ];
  // なな様テンプレ v03（10/26）。v02 に「■士気高揚 小役別」3行と「■ｲｲﾈ下3桁」を足しただけ。
  // ｲｲﾈ下3桁は出た数字の行だけを出し、1つも無ければ「なし」のまま（tplText で差し替える）。
  const TEMPLATE="新台 スマスロ パリピ孔明 \n____\n\n■ｽﾃﾁｪﾝ⑤の倍数CZ直撃▶︎ 0/0\n\n■士気高揚ゾーン\n109g        ▶︎ 0/0\n209g以降▶︎ 0/0\n\n■士気高揚 小役別\nﾘﾌﾟ/ﾍﾞﾙ▶︎ 0/0\n弱ﾁｪ/ｽｲｶ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n■レア役からのCZ\n\n通常\n弱ﾁｪ    ▶︎ 0/0\nｽｲｶ      ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n高確\n弱ﾁｪ    ▶︎ 0/0\nｽｲｶ      ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n超高\n弱ﾁｪ    ▶︎ 0/0\nｽｲｶ      ▶︎ 0/0\nﾁｬﾝｽ目▶︎ 0/0\n\n■CZ選択率\n三歌の礼　▶︎ \n英子の試練▶︎ \n石兵八陣　▶︎  \n\n■AT終了画面\nﾃﾞﾌｫ①   ▶︎ \nﾃﾞﾌｫ②   ▶︎ \nﾃﾞﾌｫ③   ▶︎ \n偶数弱　▶︎ \n偶数強　▶︎ \n高設定弱▶︎ \n高設定強▶︎ \n2以上　▶︎ \n3以上　▶︎ \n4以上　▶︎ \n5以上　▶︎ \n6濃厚　▶︎\n\n■ﾎﾞｰﾅｽ獲得枚数\n222 OVER▶︎ \n456 OVER▶︎ \n555 OVER▶︎ \n803 OVER▶︎ \n666 OVER▶︎ \n\n■ｲｲﾈ下3桁\nなし\n\n■ED中の1枚絵\n偶数弱　▶︎ \n偶数強　▶︎ \n高設定弱▶︎ \n高設定強▶︎ \n2以上　▶︎ \n3以上　▶︎ \n4以上　▶︎ \n5以上　▶︎ \n6濃厚　▶︎";
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
  const BONUS_OVER_HINT='ボーナス中の獲得枚数表示に出た「○○○ OVER」を記録します。';
  const ED_HINT='ED中に表示される1枚絵を記録します。ST終了画面とは別です。';
  const IINE_HINT='渋谷決戦ボーナス中に表示されるイイネポイントの下3桁を記録します。獲得枚数の『○○○ OVER』とは別の表示なので、両方出たら両方記録します。出典の『設定示唆が出ると勝利も濃厚!?』は暫定表記のため扱いません。';
  // 3つ目は設定1⇔設定6の目安（ちょんぼりすたのCZ確率詳細）。実測の1/xは出さない。
  const CZ_TYPE=[['sanka','三歌の礼','設1:1/369.9⇔設6:1/314.8'],['eiko','英子の試練','設1:1/701.9⇔設6:1/528.4'],['sekihei','石兵八陣','設1:1/1809.0⇔設6:1/1324.4']];
  const RARE_STATES=[['normal','通常'],['high','高確'],['super','超高確']];
  const RARE_ROLES=[['Weak','弱チェリー'],['Melon','スイカ'],['Chance','チャンス目']];
  // 士気高揚ゾーン中の小役揃い時のボーナス当選（10/26 追加）。3つ目は表示用の目安、probs は出典の設定1〜6。
  // 推定タブが無いので probs は計算に使わない（記録と表示のみ）。
  const SHIKI_ROLE=[
    ['rb','リプレイ・ベル','設1:25.0%⇔設6:43.4%',{1:.250,2:.270,3:.324,4:.352,5:.402,6:.434}],
    ['wm','弱チェリー・スイカ','設1:40.6%⇔設6:59.4%',{1:.406,2:.438,3:.492,4:.531,5:.570,6:.594}],
    ['ch','チャンス目','設1〜3:75.0%⇔設4〜6:79.7%',{1:.750,2:.750,3:.750,4:.797,5:.797,6:.797}]
  ];
  const ND=[
    ['stechen','n','d','ｽﾃﾁｪﾝ⑤の倍数CZ直撃'],
    ['shiki','n109','d109','109G'],['shiki','n209','d209','209G以降'],
    ...SHIKI_ROLE.map(([key,name])=>['shikiRole',key+'N',key+'D','士気 '+name]),
    ...RARE_STATES.flatMap(([key,label])=>RARE_ROLES.map(([role,name])=>['rare',key+role+'N',key+role+'D',label+' '+name]))
  ];
  const SHIKI_HINT='ゲーム数の下2桁が09を超えた後、最初のステージチェンジだけを数えます。例：115Gでステチェン→109Gの欄、220Gでステチェン→209G以降の欄。そのあとのステチェン（例：160G）は数えません。孔明前世のときはボーナス前兆なので数えません。';
  // 母数は「小役が揃って孔明前世へ移行した回数」（出典の定義：小役が揃い、孔明前世へ移行した際のボーナス期待度）。
  const SHIKI_ROLE_HINT='士気高揚ゾーン中に小役が揃って孔明前世（ボーナス前兆）へ移行したとき、ボーナスに当選したら当選、当選せず戻ったらハズレで記録します。小役が揃っても前世へ移行しなかったときは押しません。役ごとに分けて押してください。既存の『突入／なし』とは別の記録です。';
  const STECHEN_HINT='CZ天井までの平均周期回数は設定1 17.2回⇔設定6 13.3回（設定2 16.6／3 15.9／4 15.1／5 14.2）。平均のみ公表で分布は未公表のため、推定には使いません。';
  // 先頭に30字以内の要約を置き、畳んだときも行内に1文が残るようにする（§9-97）。
  const RARE_HINT='状態はステージで見分けます。英子の部屋＝高確、スカイスクエア＝超高確、それ以外（BBラウンジ・公園・竹下通り）＝通常。孔明前世のときはボーナス前兆なので数えません。';
  function czTotal(S){return CZ_TYPE.reduce((a,c)=>a+n(S.czType,c[0]),n(S.counts,'cz'));}
  function initialCount(S,key){return key==='cz'?czTotal(S):n(S.counts,key);}

  const stGroup=g=>ST_END.filter(c=>c[5]===g);
  function stTotal(S){return ST_END.reduce((a,c)=>a+n(S.stEnd,c[0]),0);}
  const bonusTotal=S=>BONUS_OVER.reduce((a,c)=>a+n(S.bonusOver,c[0]),0);
  const edTotal=S=>ED_PIC.reduce((a,c)=>a+n(S.edPic,c[0]),0);
  const iineTotal=S=>IINE.reduce((a,c)=>a+n(S.iine,c[0]),0);
  // 確定演出は ST終了画面 → ボーナス獲得枚数 → イイネ下3桁 → ED中の1枚絵 の順に並べ、同じ設定ならこの順で選ぶ。
  const CERT_GROUPS=[[ST_END,'stEnd',c=>c[1]],[BONUS_OVER,'bonusOver',c=>c[1]+' '+c[2]],[IINE,'iine',c=>'イイネ'+c[1]+' '+c[2]],[ED_PIC,'edPic',c=>'ED1枚絵 '+c[1]]];
  function certItems(S){
    let order=0;
    return CERT_GROUPS.flatMap(([defs,key,label])=>defs.filter(c=>certRank(c)>0).map(c=>({label:label(c),rank:certRank(c),value:n(S[key],c[0]),order:order++})));
  }
  function certCount(S){return certItems(S).reduce((a,c)=>a+c.value,0);}
  function stCertCount(S){return stGroup('cert').reduce((a,c)=>a+n(S.stEnd,c[0]),0);}
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
    <div class="cgrid">${CZ_TYPE.map(c=>ctx.crow('czType.'+c[0],c[1],c[2],false)).join('')}
      <div class="crow sumrow"><div class="lbl"><div class="nm">CZ 計${countRate(S.games,czTotal(S))}</div>${n(S.counts,'cz')>0?`<div class="mn">種類不明 ${n(S.counts,'cz')}回</div>`:''}</div></div>
      ${ctx.crow('counts.bonus',COUNTS[1][1],COUNTS[1][2]+rateSuffix(S.games,n(S.counts,'bonus')),false)}</div>
    <div class="hint">${INITIAL_HINT}</div>
  </section>`;}

  const DEF={games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),stEnd:Object.fromEntries(ST_END.map(c=>[c[0],0])),bonusOver:Object.fromEntries(BONUS_OVER.map(c=>[c[0],0])),edPic:Object.fromEntries(ED_PIC.map(c=>[c[0],0])),iine:Object.fromEntries(IINE.map(c=>[c[0],0])),stechen:{n:0,d:0},shiki:{n109:0,d109:0,n209:0,d209:0},shikiRole:Object.fromEntries(SHIKI_ROLE.flatMap(c=>[[c[0]+'N',0],[c[0]+'D',0]])),rare:Object.fromEntries(ND.filter(c=>c[0]==='rare').flatMap(c=>[[c[1],0],[c[2],0]])),czType:Object.fromEntries(CZ_TYPE.map(c=>[c[0],0])),img:null,iconChoice:null};
  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    out.counts=Object.assign({},DEF.counts,out.counts||{});
    Object.keys(out.counts).forEach(k=>{out.counts[k]=Math.max(0,Number(out.counts[k])||0);});
    // bonusOver・edPic は 10/14 追加、iine・shikiRole は 10/26 追加。無い旧データは0で補完する。
    for(const key of ['stEnd','bonusOver','edPic','iine']){
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    }
    for(const key of ['stechen','shiki','shikiRole','rare','czType']){
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{const v=Number(out[key][k]);out[key][k]=Number.isFinite(v)?Math.max(0,Math.floor(v)):0;});
    }
    ND.forEach(([key,nKey,dKey])=>{out[key][nKey]=Math.min(out[key][nKey],out[key][dKey]);});
    return out;
  }
  function pageInput(ctx){return gameSection(ctx.S)+initialSection(ctx);}
  function pageNormal(ctx){
    const draw=(items,winLabel,missLabel,extra=()=>({}))=>items.map(([key,nKey,dKey,name],i)=>ndRow(ctx,Object.assign({cls:'normal-row',name,nPath:key+'.'+nKey,dPath:key+'.'+dKey,n:n(ctx.S[key],nKey),d:n(ctx.S[key],dKey),winLabel,missLabel},extra(i)))).join('');
    const group=key=>ND.filter(c=>c[0]===key);
    return `<style>${ND_STYLE}
      .normal-row .pct{min-width:48px;text-align:right}
      .role-row{flex-wrap:wrap;row-gap:6px}
      .role-row .ct{flex:1 0 100%}
      .role-row .ct b,.role-row .ct small{display:inline}
      .role-row .ct small{margin-left:8px;white-space:nowrap}
      .role-row .num{margin-left:auto}
    </style>
    <section class="sec"><div class="sec-h">ｽﾃﾁｪﾝ⑤の倍数CZ直撃</div>
      <div class="cgrid">${draw(group('stechen'),'直撃','なし')}</div>
      <div class="hint">ステージチェンジ回数が5の倍数の周期に到達するたびに記録します</div>
      <div class="hint" data-fold="no">${STECHEN_HINT}</div>
    </section>
    <section class="sec"><div class="sec-h">士気高揚ゾーン</div>
      <div class="hint" data-fold="no">${SHIKI_HINT}</div>
      <div class="cgrid">${draw(group('shiki'),'突入','なし')}</div>
      <div class="cgrid" style="margin-top:6px">${draw(group('shikiRole'),'当選','ハズレ',i=>({cls:'normal-row role-row',displayName:SHIKI_ROLE[i][1],sub:SHIKI_ROLE[i][2]}))}</div>
      <div class="hint" data-fold="no">${SHIKI_ROLE_HINT}</div>
    </section>
    <section class="sec"><div class="sec-h">レア役からのCZ</div>
      <div class="hint">${RARE_HINT}</div>
      <div class="cgrid">${draw(group('rare'),'当選','ハズレ')}</div>
    </section>`;
  }
  function pageShisa(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">ST終了画面<span class="sub">計${stTotal(S)}回</span></div>
    <div class="cgrid">${ST_END.map(c=>ctx.crow('stEnd.'+c[0],c[1],c[2],c[3]>0,v=>ctx.pct(v,stTotal(S)))).join('')}</div>
    <div class="hint">${ST_HINT}</div>
  </section>
  <section class="sec">
    <div class="sec-h">ボーナス獲得枚数<span class="sub">計${bonusTotal(S)}回</span></div>
    <div class="cgrid">${BONUS_OVER.map(c=>ctx.crow('bonusOver.'+c[0],c[1],c[2],true)).join('')}</div>
    <div class="hint">${BONUS_OVER_HINT}</div>
  </section>
  <section class="sec">
    <div class="sec-h">イイネ下3桁<span class="sub">計${iineTotal(S)}回</span></div>
    <div class="cgrid">${IINE.map(c=>ctx.crow('iine.'+c[0],c[1],c[2],true)).join('')}</div>
    <div class="hint" data-fold="no">${IINE_HINT}</div>
  </section>
  <section class="sec">
    <div class="sec-h">ED中の1枚絵<span class="sub">計${edTotal(S)}回</span></div>
    <div class="cgrid">${ED_PIC.map(c=>ctx.crow('edPic.'+c[0],c[1],c[2],c[3]>0)).join('')}</div>
    <div class="hint">${ED_HINT}</div>
  </section>`;}
  function tplText(ctx){const S=ctx.S,g=S.games;
    const values=[...ND.map(([key,nKey,dKey])=>n(S[key],nKey)+'/'+n(S[key],dKey)),...CZ_TYPE.map(c=>n(S.czType,c[0])+'回'),...ST_END.map(c=>n(S.stEnd,c[0])+'回'),...BONUS_OVER.map(c=>n(S.bonusOver,c[0])+'回'),...ED_PIC.map(c=>n(S.edPic,c[0])+'回')];
    let i=0;
    const iine=IINE.filter(c=>n(S.iine,c[0])>0).map(c=>c[1]+'▶︎ '+n(S.iine,c[0])+'回');
    const text=TEMPLATE.replace(/0\/0|▶︎ *(?=\r?\n|$)/g,m=>{
      const v=values[i++];
      return m.startsWith('0')?v:'▶︎ '+v;
    }).replace('■ｲｲﾈ下3桁\nなし',()=>'■ｲｲﾈ下3桁\n'+(iine.length?iine.join('\n'):'なし'));
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / CZ${countRate(g,czTotal(S))} / 初当り${countRate(g,n(S.counts,'bonus'))}\n_______\n\n${text}\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
  }
  window.CheckerConfigs[ID]={
    uiV2:true,nanaCollab:true,storageKey:ID+'-checker-v1',defaults:DEF,mergeKeys:['counts','stEnd','stechen','shiki','rare','czType','bonusOver','edPic','iine','shikiRole'],sourceUrl:SOURCE,
    normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    pages:(ctx,pageCard)=>[()=>pageInput(ctx),()=>pageNormal(ctx),()=>pageShisa(ctx),pageCard],template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,
      downloadName:ID+'_check.png',detailDownloadName:ID+'_check_detail.png',
      detail:ctx=>[initialDetail(ctx.S),
        {title:'ST終了画面',items:ST_END.map(c=>({label:c[1],value:n(ctx.S.stEnd,c[0]),hot:c[3]>0})),percent:true,denominator:stTotal(ctx.S)},
        {title:'ボーナス獲得枚数',items:BONUS_OVER.map(c=>({label:c[1]+' '+c[2],value:n(ctx.S.bonusOver,c[0]),hot:true}))},
        {title:'イイネ下3桁',items:IINE.map(c=>({label:c[1]+' '+c[2],value:n(ctx.S.iine,c[0]),hot:true}))},
        {title:'ED中の1枚絵',items:ED_PIC.map(c=>({label:c[1],value:n(ctx.S.edPic,c[0]),hot:c[3]>0}))},
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
          row(shown('濃厚',codes(stGroup('cert'),S.stEnd)),stCertCount(S))
        ]}
      ]};}
    }
  };

})();

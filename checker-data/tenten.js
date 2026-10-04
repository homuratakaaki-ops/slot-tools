(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const ID="tenten";
  const TITLE="L転生王女と天才令嬢の魔法革命";
  const SOURCE="https://chonborista.com/slot/orinpia-slot/264134/";
  const TAGS="#転天 #設定判別";
  const COUNTS=[["at","AT初当り","設1:1/320.0⇔設6:1/246.4"]];
  const INITIAL_HINT='ATとCZの初当りです。CZの回数はEP LVの記録から自動で合算します。AT初当りは設定1:1/320.0／2:1/314.7／3:1/294.2／4:1/276.9／5:1/260.0／6:1/246.4。CZは設定1:1/171.5／2:1/168.3／3:1/154.9／4:1/147.0／5:1/140.4／6:1/136.0。';
  const BONUS_END=[
    ['kokage','木陰の2人','デフォルト',0,'木'],
    ['tilty','ティルティ','偶数設定期待度UP',0,'テ'],
    ['ushiro','2人の後ろ姿','高設定期待度UP(弱)',0,'後'],
    ['nekoro','寝転ぶ2人','高設定期待度UP(強)',0,'寝'],
    ['ka','可スタンプ','設定2以上濃厚',2,'可'],
    ['kichi','吉スタンプ','設定3以上濃厚',3,'吉'],
    ['ryo','良スタンプ','設定4以上濃厚',4,'良'],
    ['yu','優スタンプ','設定5以上濃厚',5,'優'],
    ['goku','極スタンプ','設定6濃厚',6,'極']
  ];
  const OVER=[
    ['o222','222枚 OVER','設定2以上濃厚',2,'222'],
    ['o333','333枚 OVER','設定3以上濃厚',3,'333'],
    ['o456','456枚 OVER','設定4以上濃厚',4,'456'],
    ['o1010','1010枚 OVER','設定5以上濃厚',5,'1010'],
    ['o666','666枚 OVER','設定6濃厚',6,'666']
  ];
  const LEVELS=[['lv1','EP LV1','設1:15.2%⇔設6:31.5%'],['lv2','EP LV2','設1:49.4%⇔設6:56.8%'],['lv3','EP LV3','設1:70.9%⇔設6:75.9%']];
  const CZ_HINT='CZが終わった時点の最終レベルで記録します。EP LV4はボーナス濃厚なので成功率の対象外で、回数だけ数えます。CZの回数と成功期待度はこの記録から自動で出ます。設定別の成功期待度は設定1:50.3%／2:50.8%／3:52.2%／4:54.3%／5:56.8%／6:59.1%。';
  const PAIRS=[
    ['g150','150GまでのCZ以上当選','設1:63.1%⇔設6:73.9%','CZ間ごとに、150G以内にCZ以上へ当選したら当選、150Gを超えたらハズレで記録します。設定1でも6割以上は当選するので、サンプルを集めてから判断してください。設定1:63.1%／2:64.0%／3:68.1%／4:70.7%／5:72.8%／6:73.9%。'],
    ['pt','ポイントMAX時の報酬','設1:23.4%⇔設6:30.1%','通常時にアニスポイントまたはユフィポイントがMAXになったとき、報酬が付いたら当選で記録します。アニスはCZ当選、ユフィはCZレベルアップが報酬です。設定1:23.4%／2:23.8%／3:25.0%／4:26.6%／5:28.5%／6:30.1%。']
  ];
  const GROUPS=[
    ['screens','ボーナス終了画面',BONUS_END,'ボーナスが終わるたびに出た画面を記録します。木陰の2人がデフォルトです。'],
    ['over','獲得枚数表示',OVER,'AT終了時の獲得枚数表示が該当の数値を超えていたら記録します。出るたびに必ずどれかが選ばれる振り分けではないため、割合は表示しません。']
  ];
  const zero=arr=>Object.fromEntries(arr.map(c=>[c[0],0]));
  const MERGE_KEYS=['counts','cz','g150','pt','screens','over'];
  function total(arr,state){return arr.reduce((a,c)=>a+n(state,c[0]),0);}
  function screenTotal(S){return total(BONUS_END,S.screens);}
  function czTotal(S){return n(S.cz,'lv1d')+n(S.cz,'lv2d')+n(S.cz,'lv3d')+n(S.cz,'lv4');}
  function czWin(S){return n(S.cz,'lv1n')+n(S.cz,'lv2n')+n(S.cz,'lv3n')+n(S.cz,'lv4');}
  function ratio(win,denom){return win+'/'+denom+(denom>0?' '+(100*win/denom).toFixed(0)+'%':'');}
  function rankText(rank){return rank===6?'6濃厚':rank+'以上';}
  function allCert(S){return GROUPS.flatMap((g,i)=>g[2].map((c,j)=>({label:c[1],rank:c[3],value:n(S[g[0]],c[0]),order:i*100+j}))).filter(c=>c.rank>0);}
  function certCount(S){return allCert(S).reduce((a,c)=>a+c.value,0);}
  function certTier(S,rank){return allCert(S).filter(c=>c.rank===rank).reduce((a,c)=>a+c.value,0);}
  function bestCert(S){
    // 同rankは終了画面、枚数表示の定義順。枚数の大小は順位に使わない。
    const hit=allCert(S).filter(c=>c.value>0).sort((a,b)=>(b.rank-a.rank)||(a.order-b.order))[0];
    return hit?`確定 ${hit.label}(${rankText(hit.rank)}) ×${hit.value}`:'確定演出 なし';
  }
  function autoRow(name,sub,value){return `<div class="crow sumrow"><div class="lbl"><div class="nm">${name}</div><div class="mn hot">${sub}</div></div><div class="num">${value}</div><div class="autotag" aria-hidden="true">自動</div></div>`;}
  // ricoricoのndRowを移植。減算時に外れが残らない場合は外れ側を無効化する。
  function ndRow(ctx,opt){
    const canMinus=opt.d>opt.n;
    const missAttrs=ctx.mode<0&&!canMinus?'disabled aria-disabled="true"':`data-bump="${opt.dPath}"`;
    return `<div class="crow cycle-row ${opt.cls||''}">
      <div class="ct"><b>${opt.name}</b>${opt.sub?`<small class="mn">${opt.sub}</small>`:''}</div>
      <div class="num">${opt.n}</div>
      <div class="pct">${opt.n}/${opt.d}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${opt.dPath},${opt.nPath}" data-label="${opt.name} ${opt.winLabel}" aria-label="${opt.name} ${opt.winLabel}">${opt.winLabel}</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${opt.name} ${opt.missLabel}" aria-label="${opt.name} ${opt.missLabel}">${opt.missLabel}</button>
      </div>
    </div>`;
  }

  function n(obj,key){return Number((obj||{})[key])||0;}
  function rate(g,c){return (g>0&&c>0)?'1/'+(g/c).toFixed(1):'';}
  function rateSuffix(g,c){const r=rate(g,c);return r?` / 現在 ${r}`:'';}
  function countRate(g,c){const r=rate(g,c);return r?`${c}回 ${r}`:`${c}回`;}
  function row(text,value,active,color){return {text,value:Number(value)||0,active:active!==undefined?active:(Number(value)||0)>0,color};}
  function initialBlock(S,c){const v=n(S.counts,c[0]),r=rate(S.games,v);return r?[c[1]+' '+v+'回',r]:[c[1],v+'回'];}
  function initialDetail(S){return {title:'初当り',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),text:c[1]+' '+countRate(S.games,n(S.counts,c[0])),show:n(S.counts,c[0])>0,hot:false}))};}
  function gameSection(S){const g=S.games;return `<section class="sec">
  <div class="sec-h">通常ゲーム数</div>
  <div class="inrow"><label>通常ゲーム数</label>
    <input type="number" inputmode="numeric" id="gIn" value="${g||''}" placeholder="0"></div>
  <div class="hint">連動アプリ等で確認した通常時のゲーム数。メニューの総ゲーム数はAT中を含むため入れない</div>
</section>`;}
  function initialSection(ctx){const S=ctx.S;return `<section class="sec">
    <div class="sec-h">初当り</div>
    <div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[2]+rateSuffix(S.games,n(S.counts,c[0])),false)).join('')}${autoRow('CZ','設1:1/171.5⇔設6:1/136.0'+rateSuffix(S.games,czTotal(S)),czTotal(S))}</div>
    <div class="hint">${INITIAL_HINT}</div>
  </section>`;}

  const DEF={games:0,counts:{at:0},cz:{lv1d:0,lv1n:0,lv2d:0,lv2n:0,lv3d:0,lv3n:0,lv4:0},g150:{d:0,n:0},pt:{d:0,n:0},screens:zero(BONUS_END),over:zero(OVER),img:null,iconChoice:null};
  function normalizeState(out){
    out.games=Math.max(0,Number(out.games)||0);
    MERGE_KEYS.forEach(key=>{
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(out[key]).forEach(k=>{out[key][k]=Math.max(0,Number(out[key][k])||0);});
    });
    LEVELS.forEach(c=>{out.cz[c[0]+'n']=Math.min(out.cz[c[0]+'n'],out.cz[c[0]+'d']);});
    ['g150','pt'].forEach(k=>{out[k].n=Math.min(out[k].n,out[k].d);});
    return out;
  }
  function pageInput(ctx){const S=ctx.S;return gameSection(S)+initialSection(ctx)+`
  <style>
    .cycle-row .ct{flex:1;min-width:0}.cycle-row .ct b,.cycle-row .ct small{display:block}
    .cycle-row .ct b{font-size:16px}.cycle-row .ct small{font-size:13px;color:var(--muted)}
    .cycle-row .num{min-width:24px}.cycle-row .pct{min-width:40px;text-align:right}
    .cycle-actions{display:flex;gap:6px;margin-left:6px;flex:none}
    .cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}
    .cycle-btn.win{color:#ffc94d}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}.cycle-btn[disabled]{opacity:.4}
    .sumrow{background:var(--panel2)}.sumrow .num{color:var(--gold);text-shadow:0 0 8px rgba(255,201,77,.35);white-space:nowrap;font-size:20px}
    .autotag{font-size:11px;color:var(--muted);padding:4px 8px;border:1px solid var(--line);border-radius:6px}
  </style>
  <section class="sec"><div class="sec-h">CZ（エピソードバトル）最終レベル別の成功</div><div class="cgrid">
    ${LEVELS.map(c=>ndRow(ctx,{name:c[1],sub:c[2],dPath:'cz.'+c[0]+'d',nPath:'cz.'+c[0]+'n',d:n(S.cz,c[0]+'d'),n:n(S.cz,c[0]+'n'),winLabel:'成功',missLabel:'失敗'})).join('')}
    ${ctx.crow('cz.lv4','EP LV4','精霊契約エピソード・ボーナス濃厚',false)}
    ${autoRow('成功期待度','設1:50.3%⇔設6:59.1%',ratio(czWin(S),czTotal(S)))}
  </div><div class="hint">${CZ_HINT}</div></section>
  ${PAIRS.map(c=>`<section class="sec"><div class="sec-h">${c[1]}</div><div class="cgrid">${ndRow(ctx,{name:c[1],sub:c[2],dPath:c[0]+'.d',nPath:c[0]+'.n',d:n(S[c[0]],'d'),n:n(S[c[0]],'n'),winLabel:'当選',missLabel:'ハズレ'})}</div><div class="hint">${c[3]}</div></section>`).join('')}`;}
  function pageShisa(ctx){const S=ctx.S;return GROUPS.map(g=>`<section class="sec"><div class="sec-h">${g[1]}<span class="sub">計${total(g[2],S[g[0]])}回</span></div><div class="cgrid">${g[2].map(c=>ctx.crow(g[0]+'.'+c[0],c[1],c[2],c[3]>0,g[0]==='screens'?v=>ctx.pct(v,screenTotal(S)):undefined)).join('')}</div><div class="hint">${g[3]}</div></section>`).join('');}
  function tplRow(c,value,denom){return `${c[1]}${c[3]>0?'('+rankText(c[3])+')':''}▶${value}回${denom>0?'('+Math.round(100*value/denom)+'%)':''}`;}
  function tplText(ctx){const S=ctx.S,g=S.games;
    return `設定判別メモ｜${TITLE}\n通常 ${g||0}G / AT${n(S.counts,'at')}回 / CZ${czTotal(S)}回\n_______\n\n■初当り\nAT初当り▶${countRate(g,n(S.counts,'at'))}\nCZ▶${countRate(g,czTotal(S))}\n\n■CZ最終レベル\n${LEVELS.map(c=>c[1]+'▶'+ratio(n(S.cz,c[0]+'n'),n(S.cz,c[0]+'d'))).join('\n')}\nEP LV4▶${n(S.cz,'lv4')}回\n成功期待度▶${ratio(czWin(S),czTotal(S))}\n\n■150G以内\nCZ以上当選▶${ratio(n(S.g150,'n'),n(S.g150,'d'))}\n\n■ポイントMAX\n報酬▶${ratio(n(S.pt,'n'),n(S.pt,'d'))}\n${GROUPS.map(g=>'\n■'+g[1]+'\n'+g[2].filter(c=>n(S[g[0]],c[0])>0).map(c=>tplRow(c,n(S[g[0]],c[0]),g[0]==='screens'?screenTotal(S):0)).join('\n')).join('\n')}\n\nby slot-tools.jp\n解析出典:ちょんぼりすた様`;
  }
  function detailRatio(label,win,denom){return {label,value:win,text:label+' '+ratio(win,denom),show:denom>0,hot:false};}
  function detail(ctx){const S=ctx.S;const initial=initialDetail(S);initial.items.push({label:'CZ',value:czTotal(S),text:'CZ '+countRate(S.games,czTotal(S)),show:czTotal(S)>0,hot:false});return [initial,
    {title:'CZ最終レベル',items:[...LEVELS.map(c=>detailRatio(c[1],n(S.cz,c[0]+'n'),n(S.cz,c[0]+'d'))),{label:'EP LV4',value:n(S.cz,'lv4'),hot:false},detailRatio('成功期待度',czWin(S),czTotal(S))]},
    {title:'150G以内',items:[detailRatio('CZ以上当選',n(S.g150,'n'),n(S.g150,'d'))]},
    {title:'ポイントMAX',items:[detailRatio('報酬',n(S.pt,'n'),n(S.pt,'d'))]},
    ...GROUPS.map(g=>({title:g[1],items:g[2].map(c=>({label:c[1],value:n(S[g[0]],c[0]),hot:c[3]>0})),...(g[0]==='screens'?{percent:true,denominator:screenTotal(S)}:{})}))
  ];}
  function shown(prefix,items){
    const out=items.filter(item=>item[1]>0).map(item=>`${item[0]}×${item[1]}`);
    return `${prefix} ${out.length?out.join('・'):'—'}`;
  }
  function codes(arr,state){return arr.map(c=>[c[4],n(state,c[0])]);}
  window.CheckerConfigs[ID]={
    uiV2:true,nanaCollab:false,storageKey:ID+'-checker-v1',defaults:DEF,mergeKeys:MERGE_KEYS,sourceUrl:SOURCE,
    normalizeState,
    share:{title:TITLE+' 設定判別メモ',hashtags:TAGS},
    pages:(ctx,pageCard)=>[()=>pageInput(ctx),()=>pageShisa(ctx),pageCard],template:tplText,compactTemplate:tplText,
    card:{title:TITLE,titleFitMax:680,gameLabel:'通常',footerTags:TAGS,
      downloadName:ID+'_check.png',detailDownloadName:ID+'_check_detail.png',
      detail,
      blocks:ctx=>{const S=ctx.S,v=czTotal(S),r=rate(S.games,v);return [initialBlock(S,COUNTS[0]),r?['CZ '+v+'回',r]:['CZ',v+'回'],['通常ゲーム数',(S.games||0)+'G'],['確定演出','計'+certCount(S)+'回']];},
      chart:ctx=>({title:'示唆分布',x:150,step:160,width:80,items:[2,3,4,5,6].map(r=>({label:r===6?'6':r+'+',value:certTier(ctx.S,r)}))}),
      bottom:ctx=>{const S=ctx.S;return {title:'サマリー',startY:752,rowGap:36,fontSize:23,columns:[
        {x:70,items:[row(bestCert(S),certCount(S),undefined,'#ffc94d'),row('AT初当り '+countRate(S.games,n(S.counts,'at')),n(S.counts,'at')),row('CZ '+countRate(S.games,czTotal(S)),czTotal(S)),row('通常回転 '+(S.games||0)+'G',S.games),row('CZ成功 '+ratio(czWin(S),czTotal(S)),czTotal(S))]},
        {x:560,items:[row(shown('画面',codes(BONUS_END,S.screens)),screenTotal(S)),row(shown('枚数',codes(OVER,S.over)),total(OVER,S.over)),row('EP LV '+LEVELS.map(c=>c[0].slice(-1)+':'+n(S.cz,c[0]+'n')+'/'+n(S.cz,c[0]+'d')).join('・')+'・4:'+n(S.cz,'lv4'),czTotal(S)),row('150G以内 '+ratio(n(S.g150,'n'),n(S.g150,'d')),n(S.g150,'d')),row('ポイントMAX '+ratio(n(S.pt,'n'),n(S.pt,'d')),n(S.pt,'d'))]}
      ]};}
    }
  };

})();

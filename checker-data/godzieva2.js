// 出典: ちょんぼりすた様 https://chonborista.com/slot/bisty-slot/267113/
// 2026-11-01 更新分を確認（第三者解析）。数値・文言の正本: docs/specs/godzieva2-checker-v02.md
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const TITLE="Lパチスロ ゴジラ対エヴァンゲリオン2";
  // [path の末尾, 行名, 設定別の分母, 目安, カード用の短名]
  const COUNTS=[
    ["first","ボーナス初当り",{1:234.2,2:229.0,3:221.8,4:207.0,5:201.5,6:195.0},"設1:1/234.2⇔設6:1/195.0","ボーナス初当り"],
    ["at","AT",{1:460.5,2:446.5,3:425.5,4:390.4,5:374.2,6:355.5},"設1:1/460.5⇔設6:1/355.5","AT"]
  ];
  const PAYOUT={1:97.7,2:98.9,3:101.2,4:105.8,5:110.6,6:114.9};
  const HINTS={
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。',
    counts:"ボーナスのストック放出・上位移行・引戻しはボーナス初当りに数えない。"
  };
  const REF_NOTES=['当ページの解析値は第三者の独自調査値です。'];
  const G_VALUES=[100,250,400,550,700,850];
  const SUIKA_CZ=[21.9,23.4,25.0,28.1,29.7,31.3];
  const SUIKA=[['normal','通常時','設1:21.9%⇔設6:31.3%'],['at','AT中','記録のみ']];
  const KITEI=['after','other'].flatMap(prefix=>G_VALUES.map(g=>[prefix+g,(prefix==='after'?'AT後 ':'AT後以外 ')+g+'G']));
  const END_SCREEN=[
    ['shinji','シンジ','奇数設定示唆','シンジ(奇数)'],
    ['rei','レイ','偶数設定示唆','レイ(偶数)'],
    ['mari','マリ','高設定示唆（弱）','マリ(高弱)'],
    ['asuka','アスカ','高設定示唆（強）','アスカ(高強)'],
    ['mothra','モスラ'],['xrei','Xレイ'],['reiBg','レイ背景'],
    ['godzillaShogoki','ゴジラ＆初号機','示唆内容は調査中','ゴジラ初号機'],['allStars','全員集合'],['kaworu','カヲル']
  ].map(c=>[c[0],c[1],c[2]||'示唆内容は調査中',c[3]||c[1]]);
  const ED_VOICE=[['shinji','シンジ'],['asuka','アスカ'],['misato','ミサト'],['gendo','ゲンドウ'],['kaworu','カヲル']];
  const MERGE_KEYS=['counts','suika','kitei','endScreen','edVoice'];
  const zeroCounts=rows=>Object.fromEntries(rows.map(c=>[c[0],0]));
  const zeroRates=rows=>Object.fromEntries(rows.flatMap(c=>[[c[0]+'D',0],[c[0]+'W',0]]));
  const SUIKA_HINT='表はスイカ成立時の当選率です。小役変異の緑アイコンからの当選が表に含まれるかは出典に書かれていません。\nAT中：設定別の数値は出典で確認できていないため、記録のみです。';
  const END_HINT='ATを獲得したボーナスの後は終了画面が出ません。';
  const KITEI_HINT='その規定ゲーム数に到達したとき、当選したら当選、しなかったらハズレを押します。設定差は公表されていないため記録のみです。';
  // 正本: docs/specs/godzieva2-nana-template-v01.txt。行名だけ出典に合わせて置換。夢爽 2026-11-01 裁定・なな様へ事後報告。
  const TEMPLATE="ゴジエヴァ2\n\n\n■ボーナス当選率\n\n■スイカからのCZ\n通常 ▶︎ 0/0\nAT中▶︎ 0/0\n\n■規定ゲーム数\nAT後⤵︎             AT後以外⤵︎\n100g▶︎ 0/0   ・100g▶︎ 0/0\n250g▶︎ 0/0   ・250g▶︎ 0/0\n400g▶︎ 0/0   ・400g▶︎0/0\n550g▶︎ 0/0   ・550g▶︎ 0/0\n700g▶︎ 0/0   ・700g▶︎ 0/0\n850g▶︎ 0/0   ・850g▶︎ 0/0\n\n■ボーナス・AT終了画面\nシンジ(奇数)▶︎ \nレイ(偶数)    ▶︎ \nマリ(弱)        ▶︎ \nアスカ(強)    ▶︎ \nモスラ　　　▶︎ \nXレイ　　　▶︎ \nレイ背景       ▶︎ \nｺﾞｼﾞﾗ初号機 ▶︎ \n全員集合       ▶︎ \nカヲル          ▶︎ \n\n■エンディング中ボイス\nシンジ▶︎ \nアスカ▶︎ \nミサト▶︎ \nゲンドウ▶︎ \nカヲル▶︎";
  const DEF={gameLog:[],games:0,counts:zeroCounts(COUNTS),suika:zeroRates(SUIKA),kitei:zeroRates(KITEI),endScreen:zeroCounts(END_SCREEN),edVoice:zeroCounts(ED_VOICE),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  // 分母＝当選ごとのG数の合計（§9-105）。今まわしている未当選区間は含めない。
  function gameLog(S){return Array.isArray(S.gameLog)?S.gameLog:[];}
  function freeGames(S){return gameLog(S).reduce((a,v)=>a+(Number(v)||0),0);}
  function freeText(S){return freeGames(S)+'G';}
  function logText(S){return freeText(S)+'（'+gameLog(S).length+'件）';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'—';}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .glog-btn{flex:none;min-height:44px;padding:0 14px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-family:var(--body);font-size:12px;font-weight:800}.glog-btn:disabled{opacity:.4}
      .glog-row{display:flex;align-items:center;gap:8px;margin-top:6px}.glog-last{flex:1;font-size:11px;color:var(--muted)}
      .cycle-row .ct{flex:1;min-width:0}
      .cycle-row .ct b{font-size:16px}.cycle-row .ct b,.cycle-row .ct small{display:block}.cycle-row .ct small{font-size:13px;color:var(--muted);line-height:1.35}
      .cycle-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
      .hint-paras .hint-body{white-space:pre-line}
      .role-row{flex-wrap:wrap;row-gap:6px}.role-row .ct{flex:1 0 100%}.role-row .ct b,.role-row .ct small{display:inline}.role-row .ct small{margin-left:8px;white-space:nowrap}.role-row .pct{margin-left:auto}
    </style>`;
  }
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:`${a}/0 -`;}
  function endTotal(S){return END_SCREEN.reduce((sum,c)=>sum+n(S.endScreen,c[0]),0);}
  // 補足（目安）のある行は paripi の role-row と同じく1行目を行名＋補足の全幅にし、目安を途中で折らない。
  function rateRow(ctx,group,d,w,name,sub){
    const a=n(ctx.S[group],w),b=n(ctx.S[group],d);
    const missAttrs=ctx.mode<0&&b<=a?'disabled aria-disabled="true"':`data-bump="${group}.${d}"`;
    return `<div class="crow cycle-row${sub?" role-row":""}">
      <div class="ct"><b>${name}</b>${sub?`<small>${sub}</small>`:''}</div>
      <div class="pct">${ratio(a,b)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${group}.${d},${group}.${w}" data-label="${name} 当選" aria-label="${name} 当選">当選</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${name} ハズレ" aria-label="${name} ハズレ">ハズレ</button>
      </div>
    </div>`;
  }
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),log=gameLog(S);
    return pageStyle()+`<section class="sec">
      <div class="sec-h">当選ごとのG<span class="sub">累計通常G <b style="color:#6fd8ff" data-glog-sum>${g}G</b> ／ <span data-glog-count>${log.length}</span>件</span></div>
      <div class="inrow"><label>当選時のG数</label><input type="number" inputmode="numeric" id="gameLogIn" value="" placeholder="0"><button type="button" class="glog-btn" data-action="addGameLog" data-label="当選G追加">追加</button></div>
      <div class="glog-row"><span class="glog-last">${log.length?'最後に追加：'+log[log.length-1]+'G':'まだ登録がありません'}</span><button type="button" class="glog-btn" data-action="popGameLog" data-label="当選G取消" ${log.length?'':'disabled'}>最後の1件を取り消す</button></div>
      <div class="hint">${HINTS.games}</div>
    </section><section class="sec"><div class="sec-h">カウント系</div><div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[3],0,v=>oneIn(v,g))).join('')}</div><div class="hint">${HINTS.counts}</div></section>
    <section class="sec"><div class="sec-h">スイカからのCZ</div><div class="cgrid">${SUIKA.map(c=>rateRow(ctx,'suika',c[0]+'D',c[0]+'W',c[1],c[2])).join('')}</div><div class="hint hint-paras">${SUIKA_HINT}</div></section>
    <section class="sec"><div class="sec-h">規定ゲーム数</div><div class="cgrid">${KITEI.map(c=>rateRow(ctx,'kitei',c[0]+'D',c[0]+'W',c[1],'')).join('')}</div><div class="hint">${KITEI_HINT}</div></section>`;
  }
  function pageSuggest(ctx){
    const S=ctx.S,total=endTotal(S),voices=ED_VOICE.reduce((sum,c)=>sum+n(S.edVoice,c[0]),0);
    return pageStyle()+`<section class="sec"><div class="sec-h">ボーナス・AT終了画面<span class="sub">計${total}回</span></div><div class="cgrid">${END_SCREEN.map(c=>ctx.crow('endScreen.'+c[0],c[1],c[2],false,v=>ctx.pct(v,total))).join('')}</div><div class="hint">${END_HINT}</div></section>
    <section class="sec"><div class="sec-h">エンディング中ボイス<span class="sub">計${voices}回</span></div><div class="cgrid">${ED_VOICE.map(c=>ctx.crow('edVoice.'+c[0],c[1],'示唆内容は調査中',false)).join('')}</div></section>`;
  }
  const REF_SECTIONS=[
    [COUNTS.map(c=>c[1]).join('・')+'・出玉率',SETTINGS.map(s=>['設定'+s,COUNTS.map(c=>c[1]+' 1/'+c[2][s].toFixed(1)).join(' ／ ')+' ／ 出玉率 '+PAYOUT[s].toFixed(1)+'%']).concat(REF_NOTES.map(t=>['補足',t]))],
    ['スイカ成立時のCZ当選率',SETTINGS.map((s,i)=>['設定'+s,SUIKA_CZ[i].toFixed(1)+'%']).concat([['補足',SUIKA_HINT.split('\n')[0]]])]
  ];
  function pageReference(){
    return pageStyle()+REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div><table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S);
    const values=[
      ...SUIKA.map(c=>n(S.suika,c[0]+'W')+'/'+n(S.suika,c[0]+'D')),
      ...G_VALUES.flatMap(g=>['after','other'].map(p=>n(S.kitei,p+g+'W')+'/'+n(S.kitei,p+g+'D'))),
      ...END_SCREEN.map(c=>n(S.endScreen,c[0])+'回'),...ED_VOICE.map(c=>n(S.edVoice,c[0])+'回')
    ];
    let i=0;
    const first=n(S.counts,'first'),at=n(S.counts,'at');
    const text=TEMPLATE.replace(/0\/0|▶︎ *(?=\r?\n|$)/g,m=>{
      const value=values[i++];return m.startsWith('0')?value:'▶︎ '+value;
    }).replace('■ボーナス当選率','■ボーナス当選率\nボーナス▶︎ '+first+'回'+(g>0&&first>0?'（'+oneIn(first,g)+'）':''));
    return `設定判別メモ｜${TITLE}\n累計通常G ${logText(S)} / AT${at}回${g>0&&at>0?' '+oneIn(at,g):''}\n_______\n\n${text}\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))},
      // 率の行は入力画面と同じ ratio() で「n/d xx%」（§9-47・ネネ検収 11/1）。分母0の行は％を省く（show:false で出さない）。
      ...[['スイカCZ','suika',SUIKA],['規定G','kitei',KITEI]].map(([title,group,rows])=>({title,items:rows.map(c=>({label:c[1].replace(' ',''),value:n(S[group],c[0]+'W'),hot:false,text:c[1].replace(' ','')+' '+(n(S[group],c[0]+'D')>0?ratio(n(S[group],c[0]+'W'),n(S[group],c[0]+'D')):n(S[group],c[0]+'W')+'/0'),show:n(S[group],c[0]+'D')>0}))})),
      {title:'終了画面',items:END_SCREEN.map(c=>({label:c[3],value:n(S.endScreen,c[0]),hot:false})),percent:true,denominator:endTotal(S)},
      {title:'EDボイス',items:ED_VOICE.map(c=>({label:c[1],value:n(S.edVoice,c[0]),hot:false}))}
    ];
  }
  function normalizeState(out){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    out.games=integer(out.games);
    out.gameLog=Array.isArray(out.gameLog)?out.gameLog.map(integer).filter(v=>v>0):[];
    MERGE_KEYS.forEach(group=>{
      out[group]=Object.assign({},DEF[group],out[group]||{});
      Object.keys(DEF[group]).forEach(k=>{out[group][k]=integer(out[group][k]);});
    });
    [['suika',SUIKA],['kitei',KITEI]].forEach(([group,rows])=>rows.forEach(c=>{
      const d=c[0]+'D',w=c[0]+'W';
      if(out[group][w]>out[group][d])out[group][d]=out[group][w];
    }));
    if(out.img===undefined)out.img=DEF.img;
    if(out.iconChoice===undefined)out.iconChoice=DEF.iconChoice;
    return out;
  }
  // 当選G数の追加・最後の1件の取消。入力欄は data-number-key を付けない（blur で再描画されて押下が消えないように）。
  function addGameLog(ctx){
    const el=document.getElementById('gameLogIn');
    const v=Math.floor(Number(el&&el.value));
    if(!(v>0))return false;
    ctx.S.gameLog=gameLog(ctx.S).concat([v]);
    return '当選G '+v+'G を追加';
  }
  function popGameLog(ctx){
    const log=gameLog(ctx.S);
    if(!log.length)return false;
    ctx.S.gameLog=log.slice(0,-1);
    return '当選G '+log[log.length-1]+'G を取り消し';
  }
  window.CheckerConfigs.godzieva2={
    uiV2:true,nanaCollab:true,storageKey:"godzieva2-checker-v1",defaults:DEF,
    mergeKeys:MERGE_KEYS,sourceUrl:"https://chonborista.com/slot/bisty-slot/267113/",normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:TITLE+' 設定判別メモ',hashtags:"#ゴジエヴァ2 #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:"#ゴジエヴァ2 #設定判別",downloadName:"godzieva2_check.png",detailDownloadName:"godzieva2_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))},
        {x:560,items:[row('累計通常G '+logText(S),g)]}
      ]};}
    }
  };
})();

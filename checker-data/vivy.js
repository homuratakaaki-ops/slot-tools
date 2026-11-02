// 出典: ちょんぼりすた様 https://chonborista.com/slot/daito-slot/268864/
// 2026-10-31 公開・2026-11-02 更新分を 2026-11-02 取得（第三者解析）。数値・文言の正本: docs/specs/vivy-checker-v03.md（なな様テンプレ v01 対応。テスト版 2d58393 をネネ再検収合格・夢爽スマホ確認○の後に本番へ反映）。
// 初当り系カウント・示唆記録・参照表（推測タブなし）。
(function(){
  'use strict';
  window.CheckerConfigs=window.CheckerConfigs||{};
  const SETTINGS=[1,2,3,4,5,6];
  const TITLE="スロット Vivy -Fluorite Eye's Song-";
  // [path の末尾, 行名, 設定別の分母, 目安, カード用の短名]
  const COUNTS=[
    ["at","AT初当り",{1:276.5,2:251.7,3:272.1,4:222.8,5:235.9,6:210.3},"設1:1/276.5⇔設6:1/210.3（設定順に並びません。参照タブ参照）","AT初当り"]
  ];
  const PAYOUT={1:97.7,2:98.7,3:100.2,4:104.7,5:108.3,6:112.8};
  const HINTS={
    games:'当選するたびに、その当選までのG数（ホールのデータカウンターの当選G、または台メニューのAT間G）を入力して追加します。合計が設定推定の分母になります。今まわしている未当選区間のG数は分母に含めません。',
    counts:"引戻しは数えない。アクセスチャンス（ポイント獲得）はCZではない。アクセスチャンスの継続回数は記録のみ。レア役による昇格があるため、規定回数とは一致しないことがあります。"
  };
  const REF_NOTES=["AT初当りは設定順に並びません（出典の注記：設定1＜設定3＜設定2＜設定5＜設定4＜設定6の順に優遇）。",'当ページの解析値は第三者の独自調査値です。'];
  const GROUPS={
    atEnd:[
      ["estella","エステラ","調査中",0],
      ["beach","ビーチ","調査中",0],
      ["matsumoto","マツモト変形","調査中",0],
      ["hug","抱きしめる","調査中",0],
      ["gaze","見つめる","調査中",0],
      ["bear","クマ","調査中",0],
      ["reach","手を伸ばす","調査中",0],
      ["mini","ミニキャラ","調査中",0],
      ["all","全員集合","調査中",0]
    ],
    trophy:[
      ["bronze","銅","設定2以上濃厚（※示唆内容は推測）",0],
      ["silver","銀","設定3以上濃厚（※示唆内容は推測）",0],
      ["gold","金","設定4以上濃厚（※示唆内容は推測）",0],
      ["inazuma","イナズマ","設定5以上濃厚（※示唆内容は推測）",0],
      ["rainbow","虹","設定6濃厚（※示唆内容は推測）",0]
    ],
    payout:[
      ["p411","411","設定4以上濃厚",4],
      ["p619","619","設定6濃厚",6],
      ["p2161","2161","設定4以上濃厚",4],
      ["p2161x2","2161×2","設定5以上濃厚・4322枚の獲得時に出現する可能性",5],
      ["p2161x3","2161×3","設定6濃厚・6483枚の獲得時に出現する可能性",6]
    ],
    ending:[
      ["vivy","ヴィヴィ","デフォルト",0],
      ["elizabeth","エリザベス","設定2期待度UP",0],
      ["estella","エステラ","設定3期待度UP",0],
      ["grace","グレイス","設定4期待度UP",0],
      ["ophelia","オフィーリア","設定5期待度UP",0],
      ["matsumoto","マツモト","設定6期待度UP",0],
      ["two","2体","設定2以上濃厚",2],
      ["three","3体","設定3以上濃厚",3],
      ["four","4体","設定4以上濃厚",4],
      ["five","5体","設定5以上濃厚",5],
      ["six","6体","設定6濃厚",6]
    ]
  };
  const TITLES={"atEnd":"AT終了画面","trophy":"コパンダトロフィー","payout":"獲得枚数表示","ending":"エンディング中のキャラ"};
  const DETAIL_TITLES={"atEnd":"AT終了画面","trophy":"トロフィー","payout":"枚数表示","ending":"ED中キャラ"};
  const SUGGEST_HINTS={"atEnd":"AT終了画面は全9種類です。示唆内容は調査中のため、記録のみです。","trophy":"AT終了時に出現することがあります。出現率はホールが調整できるため、出ないことは設定の根拠になりません。示唆内容は出典で推測とされているため、確定演出には数えません。","payout":"AT中の獲得枚数表示が特定の数字になると設定を示唆します。","ending":"エンディング中にレア役・共通ベルが成立したときPUSHボタンを押すとキャラが出現します。1体ならキャラの種類、2体以上なら体数で示唆します。"};
  const PERCENT_GROUPS=["atEnd"];
  const CYCLE=Array.from({length:6},(_,i)=>['c'+(i+1),'①②③④⑤⑥'[i]+'周期',true]);
  const POINTS=[111,222,333,444,555].map(v=>['p'+v,v+'pt',false]);
  // 前回555pt選択の次の周期は最大333pt（出典「555pt選択時：次回の最大が333pt」、夢爽 11/2）。
  const POINTS555=POINTS.slice(0,3);
  const ACCESS=[['weak','弱チェリー',true],['chance','チャンス目',true],['weakEx','弱チェリー→EX',false],['chanceEx','チャンス目→EX',false]];
  const CONT=[['k1','1回目継続',true],['k2','2回目継続',true]];
  const RECORDS=[
    ['cycle','規定周期','規定周期',CYCLE,'その周期に到達したとき、ATに当選したら当選、しなかったらハズレを押します。通常Aは2〜6周期、通常Bは2・3周期、天国は1周期が規定周期です。設定差は公表されていないため記録のみです。'],
    ['pt','規定ポイント(2周期以降)','規定pt',POINTS,'2周期目以降に選ばれた規定ポイントを数えます。555ptが選ばれた次の周期は333ptまでです。設定差は公表されていないため記録のみです。'],
    ['pt555','規定ポイント(前回555pt選択)','前回555後pt',POINTS555,'前回555ptが選ばれた次の周期は333ptまでになるため、別に数えます。'],
    ['access','レア役からのアクセスチャンス(EX)','AC(EX)',ACCESS,'弱チェリー・チャンス目が成立したとき、アクセスチャンスに当選したら当選、しなかったらハズレを押します。そのうちアクセスチャンスEXだった回数を「→EX」で数えます。設定差は公表されていないため記録のみです。'],
    ['cont','アクセスチャンスの継続回数','AC継続',CONT,'アクセスチャンスが1回目（2回目）の継続をしたとき、そこでアクセスチャンスEXに昇格したら「EX昇格」、しなかったら「昇格なし」を押します。記録のみ。レア役による昇格があるため、規定回数とは一致しないことがあります。']
  ];
  const MERGE_KEYS=['counts',...RECORDS.map(c=>c[0]),...Object.keys(GROUPS)];
  const DEF={schemaVersion:1,...Object.fromEntries(RECORDS.map(([key,,,rows])=>[key,Object.fromEntries(rows.flatMap(([k,,rate])=>rate?[[k+'D',0],[k+'W',0]]:[[k,0]]))])),gameLog:[],games:0,counts:Object.fromEntries(COUNTS.map(c=>[c[0],0])),...Object.fromEntries(Object.entries(GROUPS).map(([key,arr])=>[key,Object.fromEntries(arr.map(c=>[c[0],0]))])),img:null,iconChoice:null};
  function n(obj,key){return Number((obj||{})[key])||0;}
  // 分母＝当選ごとのG数の合計（§9-105）。今まわしている未当選区間は含めない。
  function gameLog(S){return Array.isArray(S.gameLog)?S.gameLog:[];}
  function freeGames(S){return gameLog(S).reduce((a,v)=>a+(Number(v)||0),0);}
  function freeText(S){return freeGames(S)+'G';}
  function logText(S){return freeText(S)+'（'+gameLog(S).length+'件）';}
  function oneIn(count,den){return den>0&&count>0?'1/'+(den/count).toFixed(1):'—';}
  function row(text,value,active,color){return {text,value,active:active===undefined?value>0:active,color};}
  function groupTotal(S,key){return GROUPS[key].reduce((sum,c)=>sum+n(S[key],c[0]),0);}
  function section(title,lines){return lines.length?'\n■'+title+'\n'+lines.join('\n')+'\n':'';}
  function pageSuggest(ctx){
    return pageStyle()+Object.entries(GROUPS).map(([key,arr])=>{
      const total=groupTotal(ctx.S,key);
      const rows=items=>'<div class="cgrid">'+items.map(c=>ctx.crow(key+'.'+c[0],c[1],c[2],c[3]>0,PERCENT_GROUPS.includes(key)?v=>ctx.pct(v,total):undefined)).join('')+'</div>';
      return '<section class="sec"><div class="sec-h">'+TITLES[key]+'<span class="sub">計'+total+'回</span></div>'+(key==='ending'?'<div class="sec-h">1体</div>'+rows(arr.slice(0,6))+'<div class="sec-h">2体以上</div>'+rows(arr.slice(6)):rows(arr))+'<div class="hint">'+SUGGEST_HINTS[key]+'</div></section>';
    }).join('');
  }
  function strongEntries(S){return Object.entries(GROUPS).flatMap(([key,arr])=>arr.filter(c=>c[3]>0).map(c=>({row:c,count:n(S[key],c[0])})));}
  function strongCount(S){return strongEntries(S).reduce((sum,c)=>sum+c.count,0);}
  function bestStrong(S){
    const hit=strongEntries(S).filter(c=>c.count>0).sort((a,b)=>b.row[3]-a.row[3])[0];
    return hit?'確定演出 '+hit.row[1]+'('+(hit.row[3]===6?'6濃厚':hit.row[3]+'以上')+') ×'+hit.count:'確定演出 なし';
  }
  function pageStyle(){
    return `<style>
      .jump-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px}.jump-grid a{display:flex;align-items:center;justify-content:center;min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-size:11px;font-weight:800;text-decoration:none;text-align:center;padding:6px}
      .ref-table{width:100%;border-collapse:collapse;font-size:11px;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}.ref-table td{border-bottom:1px solid var(--line);padding:8px 10px;vertical-align:top}.ref-table tr:last-child td{border-bottom:0}.ref-table td:first-child{width:42%;color:var(--txt);font-weight:700}.ref-table td:last-child{color:var(--muted);line-height:1.45}
      .glog-btn{flex:none;min-height:44px;padding:0 14px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--cyan);font-family:var(--body);font-size:12px;font-weight:800}.glog-btn:disabled{opacity:.4}
      .glog-row{display:flex;align-items:center;gap:8px;margin-top:6px}.glog-last{flex:1;font-size:11px;color:var(--muted)}
      .cycle-row .ct{flex:1;min-width:0}
      .hint.warn{color:#ff9b9b}
      .cycle-row .ct b{font-size:16px}.cycle-row .ct b,.cycle-row .ct small{display:block}.cycle-row .ct small{font-size:13px;color:var(--muted);line-height:1.35}
      .cycle-row .pct{min-width:78px;text-align:right;color:var(--cyan);font-family:var(--seg);font-size:11px;white-space:nowrap}
      .cycle-actions{display:flex;gap:6px;margin-left:4px;flex:none}.cycle-btn{height:44px;min-width:54px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.08);color:#fff;font-weight:900;font-size:12px;padding:0 8px;white-space:nowrap;writing-mode:horizontal-tb;line-height:1;display:flex;align-items:center;justify-content:center}.cycle-btn.win{color:var(--gold)}.minus .cycle-btn{border-color:rgba(255,91,91,.55);color:#ff9b9b}
    </style>`;
  }
  function ratio(a,b){return b>0?`${a}/${b} ${(100*a/b).toFixed(0)}%`:`${a}/0 -`;}
  function rateRow(ctx,group,d,w,name,sub,win='当選',miss='ハズレ'){
    const a=n(ctx.S[group],w),b=n(ctx.S[group],d);
    const missAttrs=ctx.mode<0&&b<=a?'disabled aria-disabled="true"':`data-bump="${group}.${d}"`;
    return `<div class="crow cycle-row${sub?" role-row":""}">
      <div class="ct"><b>${name}</b>${sub?`<small>${sub}</small>`:''}</div>
      <div class="pct">${ratio(a,b)}</div>
      <div class="cycle-actions">
        <button type="button" class="cycle-btn win" data-bump-many="${group}.${d},${group}.${w}" data-label="${name} ${win}" aria-label="${name} ${win}">${win}</button>
        <button type="button" class="cycle-btn" ${missAttrs} data-label="${name} ${miss}" aria-label="${name} ${miss}">${miss}</button>
      </div>
    </div>`;
  }
  // EX の回数は保存値のまま（当選回数に切り詰めない）。当選回数を超えたらセクションに注意文だけ出す（ネネ検収 P2、11/2）。
  function exOver(S){return ['weak','chance'].some(k=>n(S.access,k+'Ex')>n(S.access,k+'W'));}
  function recordInputs(ctx){
    return RECORDS.map(([key,title,,rows,hint])=>`<section class="sec"><div class="sec-h">${title}${key==='cycle'?'<span class="sub">Ａ2~6・Ｂ2.3・天国1周期</span>':''}</div><div class="cgrid">${rows.map(([k,label,rate])=>rate?rateRow(ctx,key,k+'D',k+'W',label,'',key==='cont'?'EX昇格':'当選',key==='cont'?'昇格なし':'ハズレ'):ctx.crow(key+'.'+k,label,'',false)).join('')}</div>${key==='access'&&exOver(ctx.S)?'<div class="hint warn" data-fold="no">EXの回数がアクセスチャンス当選の回数を超えています。</div>':''}<div class="hint"><details class="hint-fold"><summary>説明を見る</summary><div class="hint-body">${hint}</div></details></div></section>`).join('');
  }
  function pageCounts(ctx){
    const S=ctx.S,g=freeGames(S),log=gameLog(S);
    return pageStyle()+`<section class="sec">
      <div class="sec-h">当選ごとのG<span class="sub">累計通常G <b style="color:#6fd8ff" data-glog-sum>${g}G</b> ／ <span data-glog-count>${log.length}</span>件</span></div>
      <div class="inrow"><label>当選時のG数</label><input type="number" inputmode="numeric" id="gameLogIn" value="" placeholder="0"><button type="button" class="glog-btn" data-action="addGameLog" data-label="当選G追加">追加</button></div>
      <div class="glog-row"><span class="glog-last">${log.length?'最後に追加：'+log[log.length-1]+'G':'まだ登録がありません'}</span><button type="button" class="glog-btn" data-action="popGameLog" data-label="当選G取消" ${log.length?'':'disabled'}>最後の1件を取り消す</button></div>
      <div class="hint">${HINTS.games}</div>
    </section><section class="sec"><div class="sec-h">カウント系</div><div class="cgrid">${COUNTS.map(c=>ctx.crow('counts.'+c[0],c[1],c[3],0,v=>oneIn(v,g))).join('')}</div><div class="hint">${HINTS.counts}</div></section>`+recordInputs(ctx);
  }
  const REF_SECTIONS=[
    [COUNTS.map(c=>c[1]).join('・')+'・出玉率',SETTINGS.map(s=>['設定'+s,COUNTS.map(c=>c[1]+' 1/'+c[2][s].toFixed(1)).join(' ／ ')+' ／ 出玉率 '+PAYOUT[s].toFixed(1)+'%']).concat(REF_NOTES.map(t=>['補足',t]))]
  ];
  function pageReference(){
    return pageStyle()+REF_SECTIONS.map((sec,i)=>`<section class="sec" id="ref${i+1}"><div class="sec-h">${sec[0]}</div><table class="ref-table"><tbody>${sec[1].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></section>`).join('');
  }
  // 正本ファイルから機械生成。原文からの変更は「ﾏﾂﾓﾄ人形」→「ﾏﾂﾓﾄ変形」の1か所だけ（夢爽 11/2、なな様へ事後報告）。空白はそのまま。
  const TEMPLATE="VIVY\n\n\n■規定周期 Ａ2~6・Ｂ2.3・天国1周期\n①周期▶︎ 0/0\n②周期▶︎ 0/0\n③周期▶︎ 0/0\n④周期▶︎ 0/0\n⑤周期▶︎ 0/0\n⑥周期▶︎ 0/0\n\n■規定ポイント(2周期以降)\n111pt▶︎ 0回\n222pt▶︎ 0回\n333pt▶︎ 0回\n444pt▶︎ 0回\n555pt▶︎ 0回\n⚠️555pt選択された次の周期は333ptまで\n\n■レア役からのアクセスチャンス(EX)\n弱ﾁｪ   ▶︎ 0/0\n↪︎EX 0回\nﾁｬﾝｽ目▶︎ 0/0\n↪︎EX 0回\n\n■アクセスチャンスの継続回数\n1回目継続▶︎ 0回\n↪︎EX昇格 0/0回\n2回目継続▶︎ 0回\n↪︎EX昇格 0/0回\n\n■AT終了画面\nｴｽﾃﾗ          ▶︎ 0回\nﾋﾞｰﾁ          ▶︎ 0回\nﾏﾂﾓﾄ変形  ▶︎ 0回\n抱きしめる▶︎ 0回\n見つめる　▶︎ 0回\nｸﾏ               ▶︎ 0回\n手を伸ばす▶︎ 0回\nﾐﾆｷｬﾗ         ▶︎ 0回\n全員集合　▶︎ 0回\n\n■エンディング中のキャラ(複数体確定系)\nｳﾞｨｳﾞｨ(ﾃﾞﾌｫ)▶︎ \nｴﾘｻﾞﾍﾞｽ(2↑)▶︎ \nｴｽﾃﾗ(3↑)      ▶︎ \nｸﾞﾚｲｽ(4↑)    ▶︎ \nｵﾌｨｰﾘｱ(5↑)  ▶︎ \nﾏﾂﾓﾄ(6↑)     ▶︎";
  function tplText(ctx){
    const S=ctx.S,g=freeGames(S),at=n(S.counts,'at');
    const rate=(group,k)=>n(S[group],k+'W')+'/'+n(S[group],k+'D');
    const values=[...CYCLE.map(c=>rate('cycle',c[0])),...POINTS.map(c=>n(S.pt,c[0])+'回'),
      rate('access','weak'),n(S.access,'weakEx')+'回',rate('access','chance'),n(S.access,'chanceEx')+'回',
      ...CONT.flatMap(c=>[n(S.cont,c[0]+'D')+'回',rate('cont',c[0])]),
      ...GROUPS.atEnd.map(c=>n(S.atEnd,c[0])+'回'),...GROUPS.ending.slice(0,6).map(c=>n(S.ending,c[0])+'回')];
    let i=0;
    const text=TEMPLATE.replace(/0\/0|0回|▶︎ *(?=\n|$)/g,m=>{const value=values[i++];return m.startsWith('0')?value:'▶︎ '+value;});
    return `設定判別メモ｜${TITLE}\n累計通常G ${logText(S)} / AT初当り${at}回${g>0&&at>0?' '+oneIn(at,g):''} / 確定演出${strongCount(S)}回\n_______\n\n${text}\n\nby slot-tools.jp\n${ctx.nanaCreditText('text')}\n解析出典:ちょんぼりすた様`;
  }
  function detail(ctx){
    const S=ctx.S,g=freeGames(S);
    return [{title:'カウント系',items:COUNTS.map(c=>({label:c[1],value:n(S.counts,c[0]),hot:false,text:c[1]+' ×'+n(S.counts,c[0])+' '+oneIn(n(S.counts,c[0]),g),show:n(S.counts,c[0])>0}))},
      ...RECORDS.map(([key,,title,rows])=>({title,items:rows.map(([k,label,rate])=>{const value=n(S[key],k+(rate?'W':'')),d=n(S[key],k+'D');return {label,value,hot:false,text:label+(rate?' '+ratio(value,d):' ×'+value),show:rate?d>0:value>0};})})),
      ...Object.entries(GROUPS).map(([key,arr])=>({title:DETAIL_TITLES[key],percent:PERCENT_GROUPS.includes(key),denominator:PERCENT_GROUPS.includes(key)?groupTotal(S,key):undefined,items:arr.map(c=>({label:c[1],value:n(S[key],c[0]),hot:c[3]>0}))}))];
  }
  function normalizeState(out,src){
    const integer=v=>Number.isFinite(Number(v))?Math.max(0,Math.floor(Number(v))):0;
    if(out.schemaVersion===undefined)out.schemaVersion=DEF.schemaVersion;
    out.games=integer(out.games);
    out.gameLog=Array.isArray(out.gameLog)?out.gameLog.map(integer).filter(v=>v>0):[];
    MERGE_KEYS.forEach(key=>{
      // §9-108-4：知っている項目だけ検証（非負整数）、知らない項目はトップレベル・グループ内とも型ごと一切変えずに保持。新しい項目は0で足す。
      out[key]=Object.assign({},DEF[key],out[key]||{});
      Object.keys(DEF[key]).forEach(k=>{out[key][k]=integer(out[key][k]);});
    });
    RECORDS.forEach(([key,,,rows])=>rows.filter(c=>c[2]).forEach(([k])=>{if(out[key][k+'W']>out[key][k+'D'])out[key][k+'D']=out[key][k+'W'];}));
    // 前回555pt選択の 444/555pt は外した（テスト版のみの項目のため移行せず捨てる）。
    delete out.pt555.p444;delete out.pt555.p555;
    if(out.img===undefined)out.img=DEF.img;
    if(out.iconChoice===undefined)out.iconChoice=DEF.iconChoice;
    // nanaCollab 化する前の保存データ（iconChoice が default／未設定）は、1回だけなな様アイコンにする。以後はユーザーの選択に従う（§9-89、ネネ検収 P3）。
    const raw=src&&typeof src==='object'?src:out;
    if(!raw.nanaIconInit&&(raw.iconChoice==='default'||!raw.iconChoice))out.iconChoice='nana';
    out.nanaIconInit=true;
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
  window.CheckerConfigs.vivy={
    uiV2:true,nanaCollab:true,storageKey:"vivy-checker-v1",defaults:DEF,
    mergeKeys:MERGE_KEYS,sourceUrl:"https://chonborista.com/slot/daito-slot/268864/",normalizeState,
    actions:{addGameLog,popGameLog},
    share:{title:TITLE+' 設定判別メモ',hashtags:"#Vivy #設定判別"},
    pages:(ctx,pageCard)=>[()=>pageCounts(ctx),()=>pageSuggest(ctx),()=>pageReference(ctx),pageCard],
    template:tplText,compactTemplate:tplText,
    card:{title:TITLE,metaText:(ctx,date)=>date+'  累計通常G '+logText(ctx.S),titleFitMax:650,
      footerTags:"#Vivy #設定判別",downloadName:"vivy_check.png",detailDownloadName:"vivy_check_detail.png",detail,
      blocks:ctx=>{const S=ctx.S,g=freeGames(S);return COUNTS.map(c=>[c[4],oneIn(n(S.counts,c[0]),g)]).concat([['確定演出','計'+strongCount(S)+'回'],['通常G',freeText(S)]]);},
      chart:ctx=>({title:'カウント',x:130,step:200,width:80,items:COUNTS.map(c=>({label:c[4],value:n(ctx.S.counts,c[0])}))}),
      bottom:ctx=>{const S=ctx.S,g=freeGames(S);return {title:'サマリー',startY:760,rowGap:44,fontSize:22,columns:[
        {x:70,items:[row(bestStrong(S),strongCount(S),undefined,'#ffc94d'),...COUNTS.map(c=>row(c[1]+' '+n(S.counts,c[0])+'回 '+oneIn(n(S.counts,c[0]),g),n(S.counts,c[0])))]},
        {x:560,items:[row('累計通常G '+logText(S),g)]}
      ]};}
    }
  };
})();

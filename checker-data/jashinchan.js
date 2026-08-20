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
  const CHARACTER_GROUPS=[
    ['デフォルト',[
      ['jashinChan','邪神ちゃん','def'],
      ['yurine','ゆりね','def'],
      ['hyouchan','氷ちゃん','def'],
      ['yusa','遊佐','def']
    ]],
    ['奇数設定期待度UP',[
      ['minosChar','ミノス','odd'],
      ['pekoraChar','ぺこら','odd'],
      ['kyonkyon','キョンキョン','odd'],
      ['ranran','ランラン','odd']
    ]],
    ['偶数設定期待度UP',[
      ['medusaChar','メデューサ','even'],
      ['persephone2Char','ペル2世','even'],
      ['pino','ぴの','even'],
      ['poporonChar','ぽぽろん','even']
    ]],
    ['高設定期待度UP・弱',[
      ['meiChar','芽依','highWeak'],
      ['lier','リエール','highWeak'],
      ['persephone1Char','ペル1世','highWeak']
    ]],
    ['高設定期待度UP・強',[
      ['ecuteChar','エキュート','ecute'],
      ['atreChar','アトレ','atre']
    ]],
    ['否定系',[
      ['justiceChar','ジャスティス','justice'],
      ['fighterChar','ファイター','fighter'],
      ['commanderChar','コマンダー','commander'],
      ['espChar','エスプ','esp'],
      ['geniusChar','ジーニアス','genius']
    ]],
    ['確定演出',[
      ['perfectChar','パーフェクト','perfect'],
      ['devilYurineChar','悪魔ゆりね','devilYurine']
    ]]
  ];
  const COMBOS=[
    ['combo2','高設定キャラ2回','同一小悪魔ボーナス内。設定2以上期待度UP',0],
    ['combo3','高設定キャラ3回','同一小悪魔ボーナス内。設定3以上期待度UP',0],
    ['combo4','高設定キャラ4回','同一小悪魔ボーナス内。設定4以上確定演出',4],
    ['comboEA','エキュート＆アトレ両方出現','設定2以上確定演出',2]
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
    ['内部モード示唆（カウント対象外）',[
      ['扱い','以下はいずれも設定示唆ではなく内部モードの示唆のため、本ツールでは記録しません。詳細はちょんぼりすた様の解析ページをご覧ください。'],
      ['ボーナス終了時PUSH','18種'],
      ['ステチェンアイキャッチ','36種'],
      ['ステチェンワイプ','4種']
    ]]
  ];
  const DEF={
    games:0,
    cz:{bonus:0,at:0,direct:0,returnAt:0},
    screens:Object.fromEntries(AT_SCREENS.map(v=>[v[0],0])),
    atcz:Object.fromEntries(KUJILUCKY.map(v=>[v[0],0])),
    icons:Object.fromEntries(CHARS.map(v=>[v[0],0])),
    combos:Object.fromEntries(COMBOS.map(v=>[v[0],0])),
    coins:Object.fromEntries(SEALS.map(v=>[v[0],0])),
    bonusLog:[],
    pending:[],
    img:null,
    iconChoice:null
  };

  const CHARACTERS=CHARACTER_GROUPS.flatMap(group=>group[1]);
  const CHAR_NAMES=Object.fromEntries(CHARACTERS.map(c=>[c[0],c[1]]));
  const CHAR_TO_CLASS=Object.fromEntries(CHARACTERS.map(c=>[c[0],c[2]]));
  const CHAR_KEYS=new Set(CHARACTERS.map(c=>c[0]));
  const HIGH_CHAR_KEYS=new Set(['highWeak','ecute','atre']);

  function sum(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function n(obj,key){return Number((obj||{})[key])||0;}
  function countLine(v){return `${Number(v)||0}回`;}
  function section(title,lines){const out=lines.filter(Boolean);return out.length?`\n■${title}\n${out.join('\n')}\n`:'';}
  function detailItem(label,value,hot){return {label,value:Number(value)||0,hot:!!hot};}
  function detailItems(arr,state){return arr.map(c=>detailItem(c[1],state[c[0]],c[3]>0));}
  function historyItems(S){
    return normalizeBonusLog(S.bonusLog).map((bonus,i)=>({
      text:`${i+1}回目: ${bonusLabel(bonus)}`,
      value:1,
      hot:false,
      priority:100
    }));
  }
  function bonusLabel(bonus){
    return (bonus||[]).map(key=>CHAR_NAMES[key]||key).join('→');
  }
  function lastBonusText(S){
    const log=normalizeBonusLog(S.bonusLog);
    return log.length?`前回: ${bonusLabel(log[log.length-1])}`:'';
  }
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
      ...COMBOS.filter(c=>c[3]>0).map(c=>({label:c[1],value:n(S.combos,c[0]),rank:c[3],order:40+c[3]})),
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
      .char-sticky-scope{position:relative}
      .pending-box{display:grid;gap:8px;margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:#171220;position:sticky;top:0;z-index:5;box-shadow:0 8px 18px rgba(0,0,0,.35)}
      .pending-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
      .pending-slot{min-height:42px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);display:flex;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:800;color:var(--txt);padding:5px}
      .pending-slot.empty{color:var(--muted)}
      .last-bonus{font-size:11px;color:var(--muted);font-weight:800;line-height:1.35;margin:-2px 2px 8px;overflow-wrap:anywhere}
      .char-group{margin-top:10px}
      .char-group-title{font-size:11px;color:var(--cyan);font-weight:900;margin:10px 0 6px}
      .char-button-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      .char-pick{min-height:44px;border-radius:9px;border:1px solid var(--cyan);background:rgba(75,221,255,.10);color:var(--txt);font-weight:900;font-size:12px;line-height:1.15;padding:6px 4px;text-align:center;white-space:normal;overflow-wrap:anywhere}
      .char-row{display:grid;grid-template-columns:minmax(0,1fr) 42px;gap:8px;align-items:stretch;border:1px solid var(--line);border-radius:10px;background:var(--panel);padding:8px}
      .char-row.readonly{grid-template-columns:1fr}
      .char-main{min-width:0}
      .char-name{font-weight:800;font-size:13px;color:var(--txt);line-height:1.25}
      .char-sub{font-size:11px;color:var(--muted);line-height:1.35;margin-top:3px}
      .char-meta{font-size:12px;color:var(--cyan);font-weight:800;margin-top:4px}
      .manual-finalize{min-height:36px;border-radius:9px;border:1px solid var(--line);background:var(--panel2);color:var(--txt);font-weight:800}
      .manual-finalize:disabled{opacity:.45;color:var(--muted)}
    </style>`;
  }

  function normalizeBonusLog(list){
    return (Array.isArray(list)?list:[]).map(bonus=>{
      const row=Array.isArray(bonus)?bonus:[];
      return row.filter(k=>CHAR_KEYS.has(k)).slice(0,4);
    }).filter(row=>row.length>0).slice(-50);
  }
  function pendingLabels(S){
    const pending=(S.pending||[]).slice(0,4);
    return [0,1,2,3].map(i=>pending[i]||null);
  }
  function finalizePending(S){
    const keys=(S.pending||[]).filter(k=>CHAR_KEYS.has(k)).slice(0,4);
    if(!keys.length)return false;
    const classKeys=keys.map(key=>CHAR_TO_CLASS[key]).filter(Boolean);
    const highCount=classKeys.filter(key=>HIGH_CHAR_KEYS.has(key)).length;
    if(highCount>=4)S.combos.combo4=(n(S.combos,'combo4')+1);
    else if(highCount===3)S.combos.combo3=(n(S.combos,'combo3')+1);
    else if(highCount===2)S.combos.combo2=(n(S.combos,'combo2')+1);
    if(classKeys.includes('ecute')&&classKeys.includes('atre'))S.combos.comboEA=(n(S.combos,'comboEA')+1);
    S.bonusLog=normalizeBonusLog([...(S.bonusLog||[]),keys]);
    S.pending=[];
    return true;
  }
  function addCharAction(ctx,dataset){
    if(ctx.mode<0)return false;
    const key=dataset.char;
    if(!CHAR_KEYS.has(key))return false;
    ctx.S.pending=(ctx.S.pending||[]).filter(k=>CHAR_KEYS.has(k)).slice(0,3);
    const classKey=CHAR_TO_CLASS[key];
    ctx.S.icons[classKey]=n(ctx.S.icons,classKey)+1;
    ctx.S.pending.push(key);
    const count=ctx.S.pending.length;
    if(count>=4){
      finalizePending(ctx.S);
      return `4人目: ${CHAR_NAMES[key]} → このボーナスを確定しました`;
    }
    return `${count}人目: ${CHAR_NAMES[key]}`;
  }
  function finalizeAction(ctx){
    if(ctx.mode<0)return false;
    ctx.S.pending=(ctx.S.pending||[]).filter(k=>CHAR_KEYS.has(k)).slice(0,4);
    if(!ctx.S.pending.length)return false;
    finalizePending(ctx.S);
    return 'このボーナスを確定しました';
  }
  function characterGroupRows(){
    return CHARACTER_GROUPS.map(group=>`<div class="char-group">
      <div class="char-group-title">${group[0]}</div>
      <div class="char-button-grid">${group[1].map(c=>`<button class="char-pick" type="button" data-action="jashinAddChar" data-char="${c[0]}" data-label="${c[1]}">${c[1]}</button>`).join('')}</div>
    </div>`).join('');
  }
  function readOnlyRow(state,c){
    const count=n(state,c[0]);
    return `<div class="char-row readonly">
      <div class="char-main">
        <div class="char-name">${c[1]}</div>
        <div class="char-sub">${c[2]}</div>
        <div class="char-meta">${count}回</div>
      </div>
    </div>`;
  }

  function pageHatsu(ctx){
    const S=ctx.S;
    return `<section class="sec">
    <div class="sec-h">総回転数</div>
    <div class="inrow"><label>本日の総ゲーム数</label><input type="number" inputmode="numeric" id="gIn" value="${S.games||''}" placeholder="0"></div>
    <div class="hint">実機では総ゲーム数を確認できないため、ホールのデータカウンター等の数値を参考値として入力してください。確率の算出には使わず、稼働メモとして保存します。</div>
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
    const pending=pendingLabels(ctx.S);
    return pageStyle()+`<div class="char-sticky-scope">
  <section class="sec"><div class="sec-h">今回のボーナス<span class="sub">${(ctx.S.pending||[]).length}/4人</span></div></section>
    <div class="pending-box">
      <div class="pending-slots">${pending.map((key,i)=>`<div class="pending-slot ${key?'':'empty'}">${i+1}人目<br>${key?(CHAR_NAMES[key]||key):'-'}</div>`).join('')}</div>
      <button class="manual-finalize" type="button" data-action="jashinFinalizeBonus" data-label="このボーナスを確定" ${(ctx.S.pending||[]).length?'':'disabled'}>このボーナスを確定</button>
    </div>
    ${lastBonusText(ctx.S)?`<div class="last-bonus">${lastBonusText(ctx.S)}</div>`:''}
    <section class="sec"><div class="hint">小悪魔ボーナス1回につき基本4キャラが紹介されます。出てきた順にタップしてください。4人目で自動確定し、高設定キャラの複合条件も自動で判定します。4人未満で終わった場合のみ「このボーナスを確定」を押してください。継続率示唆のキャラ表示・ミニキャラ参戦演出は別物なので対象外です。異なるパターンに気づいたらお問い合わせから教えてください。押し間違いは右上の取消ボタンで戻せます（このセクションは減算モード非対応です）。順番の法則は解析未掲載です。過去のボーナスの並びは、カードタブの詳細カード「キャラ出現順」で確認できます。</div></section>
  <section class="sec"><div class="sec-h">キャラ紹介<span class="sub">小悪魔ボーナス中</span></div>
    ${characterGroupRows()}
    <div class="hint">実機に出たキャラ名をそのまま選びます。集計・カード・テンプレでは従来の13分類へ自動変換します。</div></section>
  <section class="sec"><div class="sec-h">累計<span class="sub">13分類</span></div>
    <div class="cgrid">${CHARS.map(c=>readOnlyRow(ctx.S.icons,c)).join('')}</div></section>
  <section class="sec"><div class="sec-h">複合条件<span class="sub">自動判定</span></div>
    <div class="cgrid">${COMBOS.map(c=>readOnlyRow(ctx.S.combos,c)).join('')}</div>
    <div class="hint">複合条件は、今回のボーナスを確定したタイミングで自動加算されます。ここでは累計のみ確認できます。</div></section></div>`;
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
    t+=section('複合条件',sum(S.combos)>0?COMBOS.filter(c=>n(S.combos,c[0])>0).map(c=>`${c[1]}▶${countLine(n(S.combos,c[0]))}`):[]);
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
      {title:'複合条件',items:detailItems(COMBOS,S.combos)},
      {title:'シール',items:detailItems(SEALS,S.coins)},
      {title:'キャラ出現順',priority:100,items:historyItems(S)}
    ];
  }

  window.CheckerConfigs.jashinchan={
    nanaCollab:false,
    storageKey:'jashinchan-checker-v3',
    defaults:DEF,
    mergeKeys:['cz','screens','atcz','icons','combos','coins'],
    arrayDefaults:[
      {key:'bonusLog',max:50,filter:row=>Array.isArray(row)&&row.some(k=>CHAR_KEYS.has(k))},
      {key:'pending',max:3,filter:key=>CHAR_KEYS.has(key)}
    ],
    normalizeState:(out)=>{
      out.bonusLog=normalizeBonusLog(out.bonusLog);
      out.pending=(Array.isArray(out.pending)?out.pending:[]).filter(k=>CHAR_KEYS.has(k)).slice(0,3);
      return out;
    },
    actions:{
      jashinAddChar:addCharAction,
      jashinFinalizeBonus:finalizeAction
    },
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
              row(shown('複合',[['2回',n(S.combos,'combo2')],['3回',n(S.combos,'combo3')],['4回',n(S.combos,'combo4')],['エア',n(S.combos,'comboEA')]]),sum(S.combos)),
              row(shown('シール',[['4+',n(S.coins,'lierPersephone1')],['6',n(S.coins,'ecuteAtre')]]),n(S.coins,'lierPersephone1')+n(S.coins,'ecuteAtre')),
              row(shown('高設定系',[['ゆA',n(S.screens,'yurineA')],['ゆB',n(S.screens,'yurineB')],['弱',n(S.icons,'highWeak')],['エ',n(S.icons,'ecute')],['ア',n(S.icons,'atre')]]),n(S.screens,'yurineA')+n(S.screens,'yurineB')+n(S.icons,'highWeak')+n(S.icons,'ecute')+n(S.icons,'atre'))
            ]}
          ]
        };
      }
    }
  };
})();

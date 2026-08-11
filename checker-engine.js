(function(){
  'use strict';

  const DEFAULT_CARD_ICON='assets/toaru2-default-icon.jpg';
  const NANA_CARD_ICON='assets/nana-icon.jpg';

  function clone(v){
    if(typeof structuredClone==='function')return structuredClone(v);
    return JSON.parse(JSON.stringify(v));
  }
  function sumValues(obj){return Object.values(obj||{}).reduce((a,b)=>a+(Number(b)||0),0);}
  function byPath(obj,path){
    const p=path.split('.');
    return p.length===1?obj[p[0]]:obj[p[0]][p[1]];
  }
  function setPath(obj,path,value){
    const p=path.split('.');
    if(p.length===1)obj[p[0]]=value;
    else obj[p[0]][p[1]]=value;
  }
  function roundRect(x,a,b,w,h,r){
    x.beginPath();
    x.moveTo(a+r,b);
    x.arcTo(a+w,b,a+w,b+h,r);
    x.arcTo(a+w,b+h,a,b+h,r);
    x.arcTo(a,b+h,a,b,r);
    x.arcTo(a,b,a+w,b,r);
    x.closePath();
  }

  function createApp(config, env){
    env=env||{};
    const document=env.document||window.document;
    const localStorage=env.localStorage||window.localStorage;
    const navigatorRef=env.navigator||window.navigator;
    const ImageCtor=env.Image||window.Image;
    const FileCtor=env.File||window.File;
    const FileReaderCtor=env.FileReader||window.FileReader;
    const NANA_COLLAB=!!config.nanaCollab;
    const DEF=config.defaults;
    const mergeKeys=config.mergeKeys||['zones','cz','atcz','screens','ed','icons','coins'];
    const historyRules=config.historyRules||[];
    let S=load();
    let hist=[];
    let mode=1;
    let cur=0;
    let resetArm=null;
    let toastT=null;
    let cardImg=null;
    let detailReady=false;

    function nanaCreditText(kind){
      if(NANA_COLLAB){
        if(kind==='card')return 'テンプレ：鈴白なな様（@nana_szsr）';
        if(kind==='share')return 'ﾃﾝﾌﾟﾚ:@nana_szsr 様';
        return 'ﾃﾝﾌﾟﾚ:鈴白なな様 @nana_szsr';
      }
      return 'テンプレ形式：考案者様の許諾確認中';
    }
    function shareText(){
      const lines=[config.share.title];
      if(NANA_COLLAB)lines.push(nanaCreditText('share'));
      lines.push(config.share.hashtags);
      return lines.join('\n');
    }
    function normalizeState(data){
      const base=clone(DEF);
      const src=data&&typeof data==='object'?data:{};
      const out=Object.assign(base,src);
      mergeKeys.forEach(key=>{
        out[key]=Object.assign({},DEF[key]||{},src[key]||{});
      });
      if(!src.iconChoice)out.iconChoice=src.img?'upload':defaultIconChoice();
      (config.arrayDefaults||[]).forEach(rule=>{
        const list=Array.isArray(src[rule.key])?src[rule.key]:[];
        const filtered=rule.filter?list.filter(rule.filter):list;
        out[rule.key]=filtered.slice(rule.max?-rule.max:undefined);
      });
      if(typeof config.normalizeState==='function')return config.normalizeState(out,src);
      return out;
    }
    function load(){
      try{
        const j=JSON.parse(localStorage.getItem(config.storageKey));
        return normalizeState(j);
      }catch(e){
        return clone(DEF);
      }
    }
    function save(){
      try{localStorage.setItem(config.storageKey,JSON.stringify(S));}
      catch(e){toast('保存失敗（容量超過の可能性）');}
    }
    function get(path){return byPath(S,path);}
    function set(path,value){setPath(S,path,value);}
    function pct(n,d){return d>0?`${n}/${d} ${(100*n/d).toFixed(0)}%`:`${n}/0 —`;}
    function feed(html){
      const el=document.getElementById('feed');
      if(el)el.innerHTML=html;
    }
    function toast(m){
      const t=document.getElementById('toast');
      if(!t)return;
      t.textContent=m;
      t.classList.add('show');
      clearTimeout(toastT);
      toastT=setTimeout(()=>t.classList.remove('show'),1800);
    }
    function defaultIconChoice(){return NANA_COLLAB?'nana':'default';}
    function effectiveIconChoice(){
      if(S.iconChoice==='upload'&&S.img)return 'upload';
      if(S.iconChoice==='nana'&&NANA_COLLAB)return 'nana';
      if(S.iconChoice==='default')return 'default';
      return defaultIconChoice();
    }
    function iconSrc(){
      const choice=effectiveIconChoice();
      if(choice==='upload')return S.img;
      if(choice==='nana')return NANA_CARD_ICON;
      return DEFAULT_CARD_ICON;
    }
    function historyRuleFor(path){
      return historyRules.find(rule=>path.startsWith(rule.prefix));
    }
    function bump(path,label){
      if(mode<0&&get(path)<=0){feed(`${label} は0のため減算できません`);return;}
      const rule=historyRuleFor(path);
      let extraAdded=null,extraRemoved=null,extraRemovedIndex=-1;
      if(rule){
        if(mode>0){
          extraAdded=rule.makeEntry(path,label,S);
          S[rule.stateKey].push(extraAdded);
          if(rule.max&&S[rule.stateKey].length>rule.max)S[rule.stateKey].shift();
        }else{
          extraRemovedIndex=rule.findRemoveIndex(S[rule.stateKey],path,label,S);
          if(extraRemovedIndex>=0)extraRemoved=S[rule.stateKey].splice(extraRemovedIndex,1)[0];
        }
      }
      set(path,get(path)+mode);
      hist.push({path,label,delta:mode,extraAdded,extraRemoved,extraRemovedIndex,ruleKey:rule&&rule.stateKey});
      if(hist.length>50)hist.shift();
      feed(`<b>${mode<0?'−1':'＋1'}</b> ${label}（累計 ${get(path)}）`);
      save();
      renderAll();
    }
    function undo(){
      const a=hist.pop();
      if(!a){feed('取り消せる操作がありません');return;}
      if(a.reset){
        try{S=JSON.parse(a.snap);}
        catch(e){feed('復元に失敗しました');return;}
        feed('<b>復元</b> リセット前の状態に戻しました');
        save();renderAll();return;
      }
      set(a.path,Math.max(0,get(a.path)-(a.delta||1)));
      if(a.extraAdded&&a.ruleKey){
        const rule=historyRules.find(r=>r.stateKey===a.ruleKey);
        const idx=rule?rule.findUndoAddedIndex(S[a.ruleKey],a.extraAdded):-1;
        if(idx>=0)S[a.ruleKey].splice(idx,1);
      }
      if(a.extraRemoved&&a.ruleKey){
        const idx=Math.max(0,Math.min(a.extraRemovedIndex,S[a.ruleKey].length));
        S[a.ruleKey].splice(idx,0,a.extraRemoved);
        const rule=historyRules.find(r=>r.stateKey===a.ruleKey);
        if(rule&&rule.max&&S[a.ruleKey].length>rule.max)S[a.ruleKey].shift();
      }
      feed(`<b>取消</b> ${a.label}（累計 ${get(a.path)}）`);
      save();
      renderAll();
    }
    function reset(){
      const b=document.getElementById('resetBtn');
      if(resetArm){
        clearTimeout(resetArm);resetArm=null;
        const snap=JSON.stringify(S);
        try{localStorage.setItem(config.storageKey+'-bak',snap);}catch(e){}
        hist.push({reset:true,snap});
        if(hist.length>50)hist.shift();
        const img=S.img,iconChoice=S.iconChoice;
        S=clone(DEF);
        S.img=img;
        S.iconChoice=iconChoice==='upload'&&img?'upload':(iconChoice==='nana'&&NANA_COLLAB?'nana':(iconChoice==='default'?'default':defaultIconChoice()));
        if(b)b.textContent='リセット';
        feed('<b>リセット完了</b> 「↩ 取消」で直前の状態に戻せます');
        save();renderAll();return;
      }
      if(b)b.textContent='実行する？';
      feed('もう一度「実行する？」を押すとリセットします（3秒で解除）');
      resetArm=setTimeout(()=>{resetArm=null;if(b)b.textContent='リセット';feed('リセットを解除しました');},3000);
    }
    function crow(path,name,mean,hot,pctFn){
      const n=get(path);
      return `<div class="crow" data-c="${path}" data-l="${name}">
    <div class="lbl"><div class="nm">${name}</div><div class="mn ${hot?'hot':''}">${mean}</div></div>
    <div class="num">${n}</div>${pctFn?`<div class="pct">${pctFn(n)}</div>`:''}
    <button class="plus" aria-label="${name}を1回${mode<0?'減算':'追加'}">${mode<0?'−':'＋'}</button></div>`;
    }
    function pageCard(){
      const canDetail=hasDetailItems();
      if(!canDetail)detailReady=false;
      return `
  <div class="cardwrap">
    <canvas id="cardCanvas" width="1080" height="1080"></canvas>
    <div class="btnrow">
      <button class="act" id="shareBtn">Xで共有する</button>
      <button class="act gold" id="dlBtn">画像を保存</button>
    </div>
    <div class="btnrow one" style="margin-top:8px">
      <button class="act plain" id="detailBtn" type="button" ${canDetail?'':'disabled'}>${canDetail?'詳細カードも作成':'記録が増えると作成できます'}</button>
    </div>
    <div id="detailWrap" class="detailwrap" ${detailReady?'':'hidden'}>
      <canvas id="detailCanvas" width="1080" height="1080"></canvas>
      <div class="btnrow">
        <button class="act" id="detailShareBtn">詳細カードを共有</button>
        <button class="act gold" id="detailDlBtn">詳細カードを保存</button>
      </div>
    </div>
    <div class="icon-choices">
      <button class="icon-choice" type="button" data-icon-choice="default">slot-tools</button>
      <button class="icon-choice" type="button" data-icon-choice="nana" ${NANA_COLLAB?'':'hidden'}>鈴白なな様</button>
      <button class="icon-choice" type="button" data-icon-choice="upload" id="imgBtn">自分の画像を選ぶ</button>
    </div>
    <button class="text-btn" id="resetImgBtn" type="button" ${effectiveIconChoice()!=='default'?'':'hidden'}>アイコンをデフォルトに戻す</button>
    <input type="file" id="imgIn" accept="image/*" style="display:none">
    <div class="imgnote">※ アイコン枠は空でも生成できます。他者のイラストを使用する場合は、本人および絵師の許可を得たうえで設定してください。</div>
  </div>
  <section class="sec" style="margin-top:14px">
    <div class="sec-h">テキスト出力（テンプレ形式）</div>
    <textarea id="tpl" readonly></textarea>
    <div class="btnrow one" style="margin-top:8px"><button class="act plain" id="cpBtn">テキストをコピー</button></div>
  </section>`;
    }
    function context(){
      return {
        S,get,set,pct,crow,sumValues,nanaCreditText,shareText,
        defaultIconChoice,effectiveIconChoice,mode
      };
    }
    function sourceCredit(){
      return `<div class="credit">示唆内容・解析数値の出典：ちょんぼりすた パチスロ解析様<br>
より詳しい解析・最新情報は <a href="${config.sourceUrl}" target="_blank" rel="noopener">ちょんぼりすた様の解析ページ</a> をご覧ください。</div>`;
    }
    function renderAll(){
      const main=document.getElementById('main');
      if(!main)return;
      const sc=main.scrollTop;
      const pages=config.pages(context(),pageCard);
      main.innerHTML=pages[cur]()+sourceCredit();
      main.scrollTop=sc;
      main.querySelectorAll('.crow').forEach(el=>{
        const plus=el.querySelector('.plus');
        if(plus)plus.addEventListener('click',ev=>{ev.stopPropagation();bump(el.dataset.c,el.dataset.l);});
        el.addEventListener('click',()=>bump(el.dataset.c,el.dataset.l));
      });
      main.querySelectorAll('[data-bump]').forEach(el=>{
        el.addEventListener('click',ev=>{
          ev.stopPropagation();
          bump(el.dataset.bump,el.dataset.label||el.textContent.trim());
        });
      });
      const gIn=document.getElementById('gIn');
      if(gIn)gIn.addEventListener('change',()=>{S.games=Math.max(0,parseInt(gIn.value)||0);save();renderAll();});
      if(cur===3)initCard();
    }
    function drawCardShell(x,headline){
      const W=1080,H=1080;
      x.fillStyle='#0a070d';x.fillRect(0,0,W,H);
      let g=x.createRadialGradient(W/2,H/2,100,W/2,H/2,760);
      g.addColorStop(0,'rgba(255,61,143,.10)');g.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=g;x.fillRect(0,0,W,H);
      x.strokeStyle='#ff3d8f';x.lineWidth=6;x.shadowColor='#ff3d8f';x.shadowBlur=26;
      roundRect(x,34,34,W-68,H-68,40);x.stroke();x.shadowBlur=0;
      x.fillStyle='#ff3d8f';x.font="700 30px 'M PLUS 1p'";x.fillText(headline,70,110);
      x.fillStyle='#f2eef5';
      let titleSize=52;
      if(config.card.titleFitMax){
        do{x.font='800 '+titleSize+"px 'M PLUS 1p'";titleSize-=2;}
        while(x.measureText(config.card.title).width>config.card.titleFitMax&&titleSize>=38);
      }else{x.font="800 52px 'M PLUS 1p'";}
      x.fillText(config.card.title,70,172);
      x.fillStyle='#9a90a8';x.font="500 26px 'M PLUS 1p'";
      x.fillText(cardMetaText(),70,215);
      const cx=W-190,cy=175,r=105;
      x.save();x.strokeStyle='#ff3d8f';x.lineWidth=8;x.shadowColor='#ff3d8f';x.shadowBlur=22;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.restore();
      if(cardImg){
        x.save();x.beginPath();x.arc(cx,cy,r-8,0,7);x.clip();
        const s=Math.max((r*2-16)/cardImg.width,(r*2-16)/cardImg.height);
        x.drawImage(cardImg,cx-cardImg.width*s/2,cy-cardImg.height*s/2,cardImg.width*s,cardImg.height*s);x.restore();
      }else{
        x.fillStyle='#1f1830';x.beginPath();x.arc(cx,cy,r-8,0,7);x.fill();
        x.fillStyle='#9a90a8';x.font="700 28px 'M PLUS 1p'";x.textAlign='center';x.fillText('ICON',cx,cy+10);x.textAlign='left';
      }
    }
    function drawCardFooter(x,W,H){
      x.fillStyle='#ff3d8f';x.font="700 26px 'M PLUS 1p'";x.fillText('slot-tools.jp',70,H-104);
      x.fillStyle='#9a90a8';x.font="500 22px 'M PLUS 1p'";x.fillText(config.card.footerTags,300,H-104);
      x.fillStyle='#9a90a8';x.font="500 21px 'M PLUS 1p'";x.fillText(nanaCreditText('card')+'／ 解析出典：ちょんぼりすた様',70,H-62);
    }
    function cardGameText(){
      const label=config.card.gameLabel;
      return label?label+' '+(S.games||0)+'G':(S.games||0)+'G';
    }
    function cardMetaText(){
      const d=new Date();
      const date=d.getFullYear()+'/'+(d.getMonth()+1)+'/'+d.getDate();
      return config.card.hideGames?date:date+'  '+cardGameText();
    }
    function detailSections(){
      if(!config.card.detail)return [];
      return (config.card.detail(context())||[]).map(sec=>({
        title:sec.title,
        items:(sec.items||[]).filter(item=>item&&(item.show!==false)&&((item.value||0)>0||item.text))
      })).filter(sec=>sec.items.length>0);
    }
    function detailValue(item){return Number(item.value)||0;}
    function detailText(item){
      if(item.text)return item.text;
      return item.label+' ×'+detailValue(item);
    }
    function hasDetailItems(){return detailSections().some(sec=>sec.items.length>0);}
    function detailRows(sections){
      const maxRows=36;
      const rows=[];
      sections.forEach(sec=>{
        const items=sec.items.map(item=>Object.assign({},item,{_section:sec.title,_text:detailText(item),_value:detailValue(item)}));
        if(items.length===1){rows.push({type:'inline',title:sec.title,item:items[0],hot:!!items[0].hot,value:items[0]._value});return;}
        rows.push({type:'section',title:sec.title,hot:false,value:0});
        items.forEach(item=>rows.push({type:'item',item,hot:!!item.hot,value:item._value}));
      });
      if(rows.length<=maxRows)return rows;
      const removable=rows.map((row,index)=>({row,index})).filter(x=>x.row.type==='item'&&!x.row.hot).sort((a,b)=>(a.row.value-b.row.value)||(b.index-a.index));
      const removed=new Set();
      while(rows.length-removed.size>maxRows-1&&removable.length)removed.add(removable.shift().index);
      let moreCount=removed.size;
      let compact=rows.filter((_,i)=>!removed.has(i));
      compact=compact.filter((row,i)=>{
        if(row.type!=='section')return true;
        return compact[i+1]&&(compact[i+1].type==='item');
      });
      while(compact.length>maxRows-1){
        const sectionIndex=compact.findIndex(row=>row.type==='section');
        if(sectionIndex<0)break;
        compact.splice(sectionIndex,1);
      }
      if(compact.length>maxRows-1){
        const rest=compact.map((row,index)=>({row,index})).filter(x=>x.row.type==='item').sort((a,b)=>(a.row.value-b.row.value)||(b.index-a.index));
        while(compact.length>maxRows-1&&rest.length){
          const target=rest.shift().row;
          const index=compact.indexOf(target);
          if(index>=0){
            compact.splice(index,1);
            moreCount++;
          }
        }
      }
      if(moreCount>0)compact.push({type:'more',text:'ほか '+moreCount+'項目',hot:false,value:0});
      return compact;
    }
    function fitText(x,text,tx,ty,maxWidth,fontSize,color,weight){
      let size=fontSize;
      do{x.font=(weight||700)+' '+size+"px 'M PLUS 1p'";size-=1;}
      while(x.measureText(text).width>maxWidth&&size>=18);
      x.fillStyle=color;x.fillText(text,tx,ty);
    }
    function drawDetailCard(){
      const cv=document.getElementById('detailCanvas');if(!cv)return;
      const x=cv.getContext('2d');const W=1080,H=1080;
      drawCardShell(x,'SETTING CHECK RESULT - DETAIL -');
      const sections=detailSections();
      const rows=detailRows(sections);
      x.fillStyle='#9a90a8';x.font="700 26px 'M PLUS 1p'";x.fillText('詳細カウント',70,286);
      x.strokeStyle='#2c2340';x.lineWidth=2;x.beginPath();x.moveTo(70,306);x.lineTo(1010,306);x.stroke();
      const colX=[70,560],maxRows=18,rowGap=34,startY=338;
      rows.forEach((row,i)=>{
        const col=Math.floor(i/maxRows),slot=i%maxRows,x0=colX[col]||colX[1],y=startY+slot*rowGap;
        if(row.type==='section'){
          x.fillStyle='#ff3d8f';x.font="800 22px 'M PLUS 1p'";x.fillText(row.title,x0,y);return;
        }
        if(row.type==='inline'){
          x.fillStyle='#ff3d8f';x.font="800 21px 'M PLUS 1p'";x.fillText(row.title,x0,y);
          const tx=x0+x.measureText(row.title).width+18;
          fitText(x,row.item._text,tx,y,1010-tx,22,row.item.hot?'#ffc94d':'#f2eef5',800);return;
        }
        if(row.type==='more'){
          fitText(x,row.text,x0,y,420,22,'#6b6278',800);return;
        }
        const color=row.item.hot?'#ffc94d':'#f2eef5';
        fitText(x,row.item._text,x0+18,y,420,22,color,700);
        x.fillStyle=color;x.font="700 20px 'M PLUS 1p'";x.fillText('•',x0,y);
      });
      drawCardFooter(x,W,H);
      return rows;
    }
    function drawCard(){
      const cv=document.getElementById('cardCanvas');if(!cv)return;
      const x=cv.getContext('2d');
      const W=1080,H=1080;
      x.fillStyle='#0a070d';x.fillRect(0,0,W,H);
      let g=x.createRadialGradient(W/2,H/2,100,W/2,H/2,760);
      g.addColorStop(0,'rgba(255,61,143,.10)');g.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=g;x.fillRect(0,0,W,H);
      x.strokeStyle='#ff3d8f';x.lineWidth=6;x.shadowColor='#ff3d8f';x.shadowBlur=26;
      roundRect(x,34,34,W-68,H-68,40);x.stroke();x.shadowBlur=0;
      x.fillStyle='#ff3d8f';x.font="700 30px 'M PLUS 1p'";
      x.fillText('SETTING CHECK RESULT',70,110);
      x.fillStyle='#f2eef5';
      let titleSize=52;
      if(config.card.titleFitMax){
        do{x.font=`800 ${titleSize}px 'M PLUS 1p'`;titleSize-=2;}
        while(x.measureText(config.card.title).width>config.card.titleFitMax&&titleSize>=38);
      }else{
        x.font="800 52px 'M PLUS 1p'";
      }
      x.fillText(config.card.title,70,172);
      x.fillStyle='#9a90a8';x.font="500 26px 'M PLUS 1p'";
      x.fillText(cardMetaText(),70,215);
      const cx=W-190,cy=175,r=105;
      x.save();x.strokeStyle='#ff3d8f';x.lineWidth=8;x.shadowColor='#ff3d8f';x.shadowBlur=22;
      x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.restore();
      if(cardImg){
        x.save();x.beginPath();x.arc(cx,cy,r-8,0,7);x.clip();
        const s=Math.max((r*2-16)/cardImg.width,(r*2-16)/cardImg.height);
        x.drawImage(cardImg,cx-cardImg.width*s/2,cy-cardImg.height*s/2,cardImg.width*s,cardImg.height*s);
        x.restore();
      }else{
        x.fillStyle='#1f1830';x.beginPath();x.arc(cx,cy,r-8,0,7);x.fill();
        x.fillStyle='#9a90a8';x.font="700 28px 'M PLUS 1p'";x.textAlign='center';
        x.fillText('ICON',cx,cy+10);x.textAlign='left';
      }
      config.card.blocks(context()).forEach((b,i)=>{
        const bx=70+i*242,by=270;
        x.fillStyle='#171220';roundRect(x,bx,by,222,130,18);x.fill();
        x.strokeStyle='#2c2340';x.lineWidth=2;roundRect(x,bx,by,222,130,18);x.stroke();
        x.fillStyle='#9a90a8';x.font="700 24px 'M PLUS 1p'";x.fillText(b[0],bx+18,by+42);
        x.fillStyle='#ffc94d';x.font="34px 'DotGothic16'";x.fillText(b[1],bx+18,by+98);
      });
      const chart=config.card.chart(context());
      x.fillStyle='#9a90a8';x.font="700 26px 'M PLUS 1p'";x.fillText(chart.title,70,470);
      if(chart.type==='percentGroups'){
        const barMax=100,by=630;
        x.strokeStyle='#3b314f';x.lineWidth=2;
        if(chart.dividerX){x.beginPath();x.moveTo(chart.dividerX,495);x.lineTo(chart.dividerX,670);x.stroke();}
        chart.groups.forEach(group=>{
          x.fillStyle='#9a90a8';x.font="700 21px 'M PLUS 1p'";x.textAlign='center';
          x.fillText(`${group.title} ${group.total}回`,group.titleX,500);
          group.items.forEach((item,i)=>{
            const bx=group.x+i*group.step;
            const pct=group.total>0?(item.value/group.total*100):0;
            const h=Math.round(120*pct/barMax);
            x.fillStyle='#2c2340';x.fillRect(bx,by-120,group.width,120);
            if(group.total>0&&item.value>0){
              x.fillStyle=item.color||group.color||'#ff3d8f';
              x.shadowColor=x.fillStyle;x.shadowBlur=12;x.fillRect(bx,by-h,group.width,h);x.shadowBlur=0;
            }else if(group.total===0){
              x.fillStyle='#46404f';x.fillRect(bx,by-120,group.width,120);
            }
            x.fillStyle='#9a90a8';x.font="22px 'DotGothic16'";
            x.fillText(item.label,bx+group.width/2,by+30);
            x.fillStyle='#f2eef5';
            x.fillText(group.total>0?`${pct.toFixed(0)}%`:'-',bx+group.width/2,by-h-8);
          });
        });
        x.textAlign='left';
      }else{
      const hasStack=chart.items.some(item=>item.value2!==undefined);
      if(hasStack){
        const legend=chart.legend||[{label:'REG',color:'#ff3d8f'},{label:'BIG',color:chart.color2||'#7aa8ff'}];
        x.font="700 20px 'M PLUS 1p'";
        legend.forEach((item,i)=>{x.fillStyle=item.color;x.fillText(`■ ${item.label}`,360+i*86,470);});
      }
      const max=Math.max(1,Math.max(...chart.items.map(item=>item.value+(item.value2||0))));
      chart.items.forEach((item,i)=>{
        const bx=chart.x+i*chart.step,by=630;
        const v1=item.value||0,v2=item.value2||0,total=v1+v2;
        const h1=Math.round(120*v1/max),h2=Math.round(120*v2/max),h=h1+h2;
        x.fillStyle='#2c2340';x.fillRect(bx,by-120,chart.width,120);
        if(v1>0){x.fillStyle=item.color||'#ff3d8f';x.shadowColor=x.fillStyle;x.shadowBlur=12;x.fillRect(bx,by-h1,chart.width,h1);x.shadowBlur=0;}
        if(v2>0){x.fillStyle=item.color2||chart.color2||'#7aa8ff';x.shadowColor=x.fillStyle;x.shadowBlur=12;x.fillRect(bx,by-h1-h2,chart.width,h2);x.shadowBlur=0;}
        x.fillStyle='#9a90a8';x.font="22px 'DotGothic16'";x.textAlign='center';
        x.fillText(item.label,bx+chart.width/2,by+30);
        if(total>0){x.fillStyle='#f2eef5';x.fillText(total,bx+chart.width/2,by-h-8);}
        x.textAlign='left';
      });
      }
      const bottom=config.card.bottom(context());
      x.fillStyle='#9a90a8';x.font="700 26px 'M PLUS 1p'";x.fillText(bottom.title,70,720);
      bottom.columns.forEach(col=>{
        col.items.forEach((item,i)=>{
          const by=bottom.startY+i*bottom.rowGap;
          const count=item.value;
          const active=item.active!==undefined?item.active:count>0;
          x.fillStyle=item.color||(active?'#ffc94d':'#6b6278');
          x.font=`800 ${bottom.fontSize}px 'M PLUS 1p'`;
          x.fillText(item.text||`${item.label} ×${count}`,col.x,by);
        });
      });
      x.fillStyle='#ff3d8f';x.font="700 26px 'M PLUS 1p'";
      x.fillText('slot-tools.jp',70,H-104);
      x.fillStyle='#9a90a8';x.font="500 22px 'M PLUS 1p'";
      x.fillText(config.card.footerTags,300,H-104);
      x.fillStyle='#9a90a8';x.font="500 21px 'M PLUS 1p'";
      x.fillText(`${nanaCreditText('card')}／ 解析出典：ちょんぼりすた様`,70,H-62);
    }
    function loadCardImg(cb){
      const primary=iconSrc();
      const sources=primary===NANA_CARD_ICON?[NANA_CARD_ICON,DEFAULT_CARD_ICON]:[primary];
      let i=0;
      const im=new ImageCtor();
      im.onload=()=>{cardImg=im;cb&&cb();};
      im.onerror=()=>{i++;if(i<sources.length){im.src=sources[i];return;}cardImg=null;cb&&cb();};
      im.src=sources[i];
    }
    function fontsReady(){
      return document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve();
    }
    function initCard(){
      loadCardImg(()=>fontsReady().then(()=>{drawCard();if(detailReady)drawDetailCard();}));
      fontsReady().then(()=>{drawCard();if(detailReady)drawDetailCard();});drawCard();
      const tpl=document.getElementById('tpl');
      if(tpl)tpl.value=tplText();
      document.querySelectorAll('.icon-choice').forEach(btn=>{
        btn.classList.toggle('on',btn.dataset.iconChoice===effectiveIconChoice());
        btn.onclick=()=>{
          const choice=btn.dataset.iconChoice;
          if(choice==='upload'){document.getElementById('imgIn').click();return;}
          S.iconChoice=choice;
          S.img=null;
          save();renderAll();
        };
      });
      const resetImgBtn=document.getElementById('resetImgBtn');
      if(resetImgBtn){
        resetImgBtn.hidden=effectiveIconChoice()===defaultIconChoice();
        resetImgBtn.onclick=()=>{
          S.iconChoice=defaultIconChoice();S.img=null;save();toast('デフォルト画像に戻しました');renderAll();
        };
      }
      const imgIn=document.getElementById('imgIn');
      if(imgIn)imgIn.onchange=e=>{
        const f=e.target.files[0];if(!f)return;
        const rd=new FileReaderCtor();
        rd.onload=()=>{
          const im=new ImageCtor();
          im.onload=()=>{
            const c=document.createElement('canvas');const m=512;
            const s=Math.min(1,m/Math.max(im.width,im.height));
            c.width=im.width*s;c.height=im.height*s;
            c.getContext('2d').drawImage(im,0,0,c.width,c.height);
            S.img=c.toDataURL('image/jpeg',.85);S.iconChoice='upload';save();
            loadCardImg(()=>{drawCard();if(detailReady)drawDetailCard();});toast('画像を設定しました');
          };
          im.src=rd.result;
        };
        rd.readAsDataURL(f);
      };
      const detailBtn=document.getElementById('detailBtn');
      if(detailBtn)detailBtn.onclick=()=>{detailReady=true;const w=document.getElementById('detailWrap');if(w)w.hidden=false;drawDetailCard();};
      const detailDlBtn=document.getElementById('detailDlBtn');
      if(detailDlBtn)detailDlBtn.onclick=()=>{
        detailReady=true;drawDetailCard();
        const a=document.createElement('a');
        a.download=config.card.detailDownloadName||config.card.downloadName.replace(/(\.[^.]+)?$/,'_detail.png');
        a.href=document.getElementById('detailCanvas').toDataURL('image/png');
        a.click();toast('詳細カードを保存しました');
      };
      const detailShareBtn=document.getElementById('detailShareBtn');
      if(detailShareBtn)detailShareBtn.onclick=()=>{
        detailReady=true;drawDetailCard();
        document.getElementById('detailCanvas').toBlob(async b=>{
          const f=new FileCtor([b],config.card.detailDownloadName||config.card.downloadName.replace(/(\.[^.]+)?$/,'_detail.png'),{type:'image/png'});
          if(navigatorRef.canShare&&navigatorRef.canShare({files:[f]})){
            try{await navigatorRef.share({files:[f],text:shareText()});}catch(e){}
          }else{toast('この端末は直接共有に非対応。詳細カードを保存してください');}
        });
      };
      const dlBtn=document.getElementById('dlBtn');
      if(dlBtn)dlBtn.onclick=()=>{
        const a=document.createElement('a');
        a.download=config.card.downloadName;
        a.href=document.getElementById('cardCanvas').toDataURL('image/png');
        a.click();toast('画像を書き出しました');
      };
      const shareBtn=document.getElementById('shareBtn');
      if(shareBtn)shareBtn.onclick=()=>{
        document.getElementById('cardCanvas').toBlob(async b=>{
          const f=new FileCtor([b],config.card.downloadName,{type:'image/png'});
          if(navigatorRef.canShare&&navigatorRef.canShare({files:[f]})){
            try{await navigatorRef.share({files:[f],text:shareText()});}catch(e){}
          }else{toast('この端末は直接共有に非対応。画像を保存してください');}
        });
      };
      const cpBtn=document.getElementById('cpBtn');
      if(cpBtn)cpBtn.onclick=async()=>{
        try{await navigatorRef.clipboard.writeText(tplText());toast('コピーしました');}
        catch(e){document.getElementById('tpl').select();document.execCommand('copy');toast('コピーしました');}
      };
    }
    function tplText(){return config.template(context());}
    function setMode(nextMode){
      mode=nextMode;
      if(document.body)document.body.classList.toggle('minus',mode<0);
      const b=document.getElementById('modeBtn');
      if(b){
        b.textContent=mode<0?'−減算':'＋加算';
        b.classList.toggle('on',mode<0);
      }
    }
    function mount(){
      const modeBtn=document.getElementById('modeBtn');
      if(modeBtn)modeBtn.onclick=()=>{
        setMode(mode*-1);
        feed(mode<0?'<b>減算モード</b>：タップで−1します。もう一度押すと加算に戻ります':'加算モードに戻しました');
        renderAll();
      };
      const undoBtn=document.getElementById('undoBtn');
      if(undoBtn)undoBtn.onclick=undo;
      const resetBtn=document.getElementById('resetBtn');
      if(resetBtn)resetBtn.onclick=reset;
      const nav=document.getElementById('nav');
      if(nav)nav.addEventListener('click',e=>{
        const b=e.target.closest('button');if(!b)return;
        cur=+b.dataset.p;
        document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x===b));
        renderAll();
      });
      renderAll();
    }
    function testSetState(next){S=normalizeState(next);save();renderAll();}
    function testState(){return clone(S);}
    function testSetMode(next){setMode(next);}

    return {
      mount,normalizeState,shareText,tplText,drawCard,drawDetailCard,renderAll,bump,undo,reset,
      getState:testState,setState:testSetState,setMode:testSetMode,
      effectiveIconChoice,defaultIconChoice,nanaCreditText,
      _context:context,_detailRows:()=>detailRows(detailSections())
    };
  }

  function mount(config){
    const app=createApp(config);
    window.__checkerApp=app;
    app.mount();
    return app;
  }

  window.CheckerEngine={createApp,mount};
})();

(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SF6Schema=api;
  root.normalizeSf6Export=api.normalizeSf6Export;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const SCHEMA_VERSION='13';
  const MONEY_OPS=['init','deposit','loan','creditUpdate','medalIn','mochidama','saipurei','diffSync','collectEnd'];
  const MEDAL_SOURCES=['mochidama','saipurei','unknown'];
  const SUMAHO_CHARAS=['cammy','juri','zangief','blanka','lily','deejay','jp','kimberly','jamie','ken','ryu','other'];

  function safeObject(value){
    return value&&typeof value==='object'&&!Array.isArray(value)?value:{};
  }

  function gameValue(value){
    if(value===null||value===undefined||value==='')return null;
    const n=Number(value);
    return Number.isSafeInteger(n)&&n>=0?n:null;
  }

  function normalizeCurrentState(value){
    const src=safeObject(value);
    return {realG:gameValue(src.realG),lcdG:gameValue(src.lcdG)};
  }

  function normalizeBattleState(value){
    return value==='battle'?'battle':'normal';
  }
  function normalizeHadWin(value){
    return value===true;
  }
  function normalizeCurrentStage(value){
    const text=String(value??'').trim();
    return text||null;
  }
  function normalizeCurrentZenchou(value){
    return value==='in'||value==='stage'?value:null;
  }
  function normalizeCurrentColor(value){
    return value==='青'||value==='赤'?value:null;
  }
  function normalizePendingAutoColor(value){
    const src=safeObject(value);
    const boundary=gameValue(src.boundary);
    return boundary===null?null:{boundary};
  }
  function normalizeAutoColorBoundary(value){
    const boundary=gameValue(value);
    return boundary===null?null:boundary;
  }
  function normalizeAntenPattern(value){
    const text=String(value??'').trim();
    return ['black','blue','logo','red','chance'].includes(text)?text:null;
  }
  function normalizeSumahoChara(value){
    const text=String(value??'').trim();
    return SUMAHO_CHARAS.includes(text)?text:null;
  }
  function signedNumber(value){
    if(value===null||value===undefined||value==='')return null;
    const n=Number(value);
    return Number.isSafeInteger(n)?n:null;
  }
  function positiveNumberOrDefault(value,defaultValue){
    const text=String(value??'').trim();
    if(!/^\d+(?:\.\d+)?$/.test(text))return defaultValue;
    const n=Number(text);
    return Number.isFinite(n)&&n>0?n:defaultValue;
  }
  function normalizeSessionMoney(value){
    const src=safeObject(value);
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const startCredit=gameValue(src.startCredit);
    const initialMedalInSource=MEDAL_SOURCES.includes(src.initialMedalInSource)?src.initialMedalInSource:null;
    return {
      startCredit,
      startMochidama:gameValue(src.startMochidama),
      startSaipurei:gameValue(src.startSaipurei),
      startRealG:gameValue(src.startRealG),
      startLcdG:gameValue(src.startLcdG),
      initialMedalInAmount:gameValue(src.initialMedalInAmount),
      initialMedalInSource,
      loanRate:positiveNumberOrDefault(src.loanRate,50),
      sandBalance:signedNumber(src.sandBalance)??(startCredit||0),
      credit:gameValue(src.credit),
      investedYen:Math.max(0,signedNumber(src.investedYen)??0),
      usedMochidama:Math.max(0,signedNumber(src.usedMochidama)??0),
      usedSaipurei:Math.max(0,signedNumber(src.usedSaipurei)??0),
      usedUnknown:Math.max(0,signedNumber(src.usedUnknown)??0),
      initialDiff:signedNumber(src.initialDiff),
      diffAdjust:signedNumber(src.diffAdjust)??0,
      collectMedals:gameValue(src.collectMedals)
    };
  }

  function normalizeFbLog(log,isLegacy){
    const out={...log};
    if(isLegacy&&Object.prototype.hasOwnProperty.call(out,'trig')){
      out.legacy_trig=out.trig;
      delete out.trig;
    }
    if(!Object.prototype.hasOwnProperty.call(out,'rank'))out.rank=null;
    if(!Object.prototype.hasOwnProperty.call(out,'opponent'))out.opponent=null;
    if(!Object.prototype.hasOwnProperty.call(out,'kiteiG'))out.kiteiG=null;
    if(!Object.prototype.hasOwnProperty.call(out,'icatch'))out.icatch=null;
    if(!Object.prototype.hasOwnProperty.call(out,'icatchNote'))out.icatchNote=null;
    if(!Object.prototype.hasOwnProperty.call(out,'roundStart'))out.roundStart=null;
    if(!Object.prototype.hasOwnProperty.call(out,'bonusMedals'))out.bonusMedals=null;
    if(!Object.prototype.hasOwnProperty.call(out,'endScreen'))out.endScreen=null;
    if(!Object.prototype.hasOwnProperty.call(out,'continue'))out.continue=null;
    if(!Object.prototype.hasOwnProperty.call(out,'exitRealG'))out.exitRealG=null;
    return out;
  }

  function normalizeLog(log,isLegacy){
    if(!log||typeof log!=='object'||Array.isArray(log))return log;
    if(log.type==='fb')return normalizeFbLog(log,isLegacy);
    if(log.type==='money'){
      const out={...log};
      if(!MONEY_OPS.includes(out.op))out.op='init';
      if(out.op==='mochidama'){
        out.op='medalIn';
        out.source='mochidama';
      }else if(out.op==='saipurei'){
        out.op='medalIn';
        out.source='saipurei';
      }else if(out.op==='medalIn'&&!MEDAL_SOURCES.includes(out.source)){
        out.source='unknown';
      }
      out.amount=signedNumber(out.amount);
      out.after=normalizeSessionMoney(out.after);
      return out;
    }
    if(log.type==='gcolor')return {...log,auto:log.auto===true};
    if(log.type==='anten')return {...log,pattern:normalizeAntenPattern(log.pattern)};
    if(log.type==='sumaho')return {...log,chara:normalizeSumahoChara(log.chara)};
    if(log.type==='stage_end')return {...log,stage:normalizeCurrentStage(log.stage)};
    return {...log};
  }

  function normalizeSf6Export(data){
    const src=safeObject(data);
    const inputVer=src.ver==null?null:String(src.ver);
    const sourceVer=src.sourceVer==null?inputVer:String(src.sourceVer);
    const isLegacy=inputVer!=='2'&&inputVer!=='3'&&inputVer!=='4'&&inputVer!=='5'&&inputVer!=='6'&&inputVer!=='7'&&inputVer!=='8'&&inputVer!=='9'&&inputVer!=='10'&&inputVer!=='11'&&inputVer!=='12'&&inputVer!==SCHEMA_VERSION;
    const logs=Array.isArray(src.logs)?src.logs.map(log=>normalizeLog(log,isLegacy)):[];
    return {
      ...src,
      machine:src.machine||'L-SF6',
      ver:SCHEMA_VERSION,
      sourceVer,
      battleState:normalizeBattleState(src.battleState),
      hadWin:normalizeHadWin(src.hadWin),
      currentStage:normalizeCurrentStage(src.currentStage),
      currentZenchou:normalizeCurrentZenchou(src.currentZenchou),
      currentColor:normalizeCurrentColor(src.currentColor),
      currentState:normalizeCurrentState(src.currentState),
      initialThrough:gameValue(src.initialThrough)??0,
      pendingAutoColor:normalizePendingAutoColor(src.pendingAutoColor),
      autoColorBoundary:normalizeAutoColorBoundary(src.autoColorBoundary),
      sessionMoney:normalizeSessionMoney(src.sessionMoney),
      logs
    };
  }

  return {SCHEMA_VERSION,normalizeSf6Export};
});

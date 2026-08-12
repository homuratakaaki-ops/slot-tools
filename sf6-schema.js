(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SF6Schema=api;
  root.normalizeSf6Export=api.normalizeSf6Export;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const SCHEMA_VERSION='3';

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

  function normalizeFbLog(log,isLegacy){
    const out={...log};
    if(isLegacy&&Object.prototype.hasOwnProperty.call(out,'trig')){
      out.legacy_trig=out.trig;
      delete out.trig;
    }
    if(isLegacy){
      if(!Object.prototype.hasOwnProperty.call(out,'rank'))out.rank=null;
      if(!Object.prototype.hasOwnProperty.call(out,'opponent'))out.opponent=null;
      if(!Object.prototype.hasOwnProperty.call(out,'kiteiG'))out.kiteiG=null;
      if(!Object.prototype.hasOwnProperty.call(out,'icatch'))out.icatch=null;
      if(!Object.prototype.hasOwnProperty.call(out,'icatchNote'))out.icatchNote=null;
    }
    return out;
  }

  function normalizeLog(log,isLegacy){
    if(!log||typeof log!=='object'||Array.isArray(log))return log;
    if(log.type==='fb')return normalizeFbLog(log,isLegacy);
    return {...log};
  }

  function normalizeSf6Export(data){
    const src=safeObject(data);
    const inputVer=src.ver==null?null:String(src.ver);
    const sourceVer=src.sourceVer==null?inputVer:String(src.sourceVer);
    const isLegacy=inputVer!=='2'&&inputVer!==SCHEMA_VERSION;
    const logs=Array.isArray(src.logs)?src.logs.map(log=>normalizeLog(log,isLegacy)):[];
    return {
      ...src,
      machine:src.machine||'L-SF6',
      ver:SCHEMA_VERSION,
      sourceVer,
      battleState:normalizeBattleState(src.battleState),
      currentState:normalizeCurrentState(src.currentState),
      logs
    };
  }

  return {SCHEMA_VERSION,normalizeSf6Export};
});

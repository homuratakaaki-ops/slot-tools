/* Shared storage for rec and read-only consumers (classic script). */
(function(){
"use strict";
function open(dbName){
  return new Promise((resolve,reject)=>{
    let req,settled=false;
    const timer=setTimeout(()=>finish(new Error("IndexedDB open timed out")),3000);
    function finish(error,db){if(settled){if(db)db.close();return}settled=true;clearTimeout(timer);error?reject(error):resolve(db)}
    try{req=indexedDB.open(dbName,1)}catch(e){finish(e);return}
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains("sessions"))req.result.createObjectStore("sessions",{keyPath:"id"})};
    req.onsuccess=()=>{req.result.onversionchange=()=>req.result.close();finish(null,req.result)};
    req.onerror=()=>finish(req.error||new Error("IndexedDB open failed"));
  });
}
async function transact(dbName,mode,work){
  const db=await open(dbName);
  return new Promise((resolve,reject)=>{
    let tx,result;
    try{tx=db.transaction("sessions",mode);result=work(tx.objectStore("sessions"))}catch(e){if(tx)try{tx.abort()}catch(x){}db.close();reject(e);return}
    tx.oncomplete=()=>{db.close();resolve(result&&result.result)};
    tx.onabort=()=>{db.close();reject(tx.error||new Error("IndexedDB transaction aborted"))};
    tx.onerror=()=>{};
  });
}
const getAll=dbName=>transact(dbName,"readonly",s=>s.getAll());
const putMany=(dbName,rows)=>transact(dbName,"readwrite",s=>{rows.forEach(row=>s.put(row))});
const deleteMany=(dbName,ids)=>transact(dbName,"readwrite",s=>{ids.forEach(id=>s.delete(id))});
function mergeRecState(state,rows){
  if(!state)return null;
  const legacy=Array.isArray(state.sessions),out=state.outbox;
  if(!legacy&&(state.version!==3||state.sessionsIn!=="idb"||!out||!Array.isArray(out.put)||!Array.isArray(out.del)))throw new Error("Invalid rec state");
  const map=new Map(rows.map(row=>[row.id,row]));
  (legacy?state.sessions:out.put).forEach(row=>map.set(row.id,row));
  if(!legacy)out.del.forEach(id=>map.delete(id));
  return {...state,sessions:[...map.values()].sort((a,b)=>new Date(a.startAt)-new Date(b.startAt))};
}
async function readRecState(key,dbName){
  const raw=localStorage.getItem(key);
  if(!raw)return null;
  const state=JSON.parse(raw);
  let rows;
  try{rows=await getAll(dbName)}catch(e){if(!Array.isArray(state.sessions))throw e;rows=[]}
  if(localStorage.getItem(key)!==raw)throw new Error("Rec changed while reading; retry");
  return mergeRecState(state,rows);
}
window.RecStore={open,getAll,putMany,deleteMany,mergeRecState,readRecState};
})();

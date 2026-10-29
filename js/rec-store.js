/* Shared storage for rec and read-only consumers (classic script). */
(function(){
"use strict";
function open(dbName){
  return new Promise((resolve,reject)=>{
    let req,settled=false;
    const timer=setTimeout(()=>finish(new Error("IndexedDB open timed out")),3000);
    function finish(error,db){if(settled){if(db)db.close();return}settled=true;clearTimeout(timer);error?reject(error):resolve(db)}
    try{req=indexedDB.open(dbName,2)}catch(e){finish(e);return}
    // 版2：世代を持つ meta ストアを足す。版1の sessions の中身はそのまま使う
    req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains("sessions"))d.createObjectStore("sessions",{keyPath:"id"});if(!d.objectStoreNames.contains("meta"))d.createObjectStore("meta",{keyPath:"key"})};
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
// 書き込みはこれだけ。sessions と meta を1つの readwrite トランザクションで扱い、
// その中で meta の世代を確かめる（readwrite はタブをまたいでも1本ずつ処理されるので割り込まれない）。
// 自分の世代より新しい世代が書かれていたら何も書かずに中止し、err.stale=true で返す。
async function commit(dbName,batch,gen){
  const db=await open(dbName);
  return new Promise((resolve,reject)=>{
    let tx,stale=false;
    const done=e=>{db.close();reject(e)};
    try{tx=db.transaction(["sessions","meta"],"readwrite")}catch(e){done(e);return}
    tx.oncomplete=()=>{db.close();resolve()};
    tx.onabort=()=>{if(stale){const e=new Error("IndexedDB has a newer generation");e.stale=true;done(e)}else done(tx.error||new Error("IndexedDB transaction aborted"))};
    tx.onerror=()=>{};
    const meta=tx.objectStore("meta"),q=meta.get("gen");
    q.onsuccess=()=>{
      const cur=q.result&&typeof q.result.gen==="number"?q.result.gen:0;
      if(cur>gen){stale=true;tx.abort();return}
      try{
        const sessions=tx.objectStore("sessions");
        (batch.put||[]).forEach(row=>sessions.put(row));
        (batch.del||[]).forEach(id=>sessions.delete(id));
        meta.put({key:"gen",gen:Math.max(cur,gen)});
      }catch(e){try{tx.abort()}catch(x){}}
    };
  });
}
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
window.RecStore={open,getAll,commit,mergeRecState,readRecState};
})();

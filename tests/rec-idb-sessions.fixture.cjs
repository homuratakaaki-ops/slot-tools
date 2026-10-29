'use strict';
// Synthetic only. No real play records are used.
function fixture(){
  const sessions=Array.from({length:200},(_,i)=>{
    const startAt=new Date(Date.UTC(2026,7+Math.floor(i/70),1+i%28,1,i%60)).toISOString();
    return {id:'synthetic-'+i,machineId:'generic',machine:'合成機種'+i%3,startAt,endAt:new Date(Date.parse(startAt)+3600000).toISOString(),
      lend:46,shop:'合成店舗'+i%2,dai:String(i),realG:100,lcdG:100,c3:0,expected:1000,totalStart:0,totalEnd:100,
      events:Array.from({length:30+i%121},(_,j)=>({at:startAt,type:'memo',text:'合成記録'+j})),
      money:{cash:[{at:startAt,amount:1000}],deposits:[],spends:[],replays:[],startMedal:0,endMedal:100,startReplay:0,endReplay:0,credit:100},
      endNote:'合成データ',follow:[],tags:{},rare:{melon:{w:0,s:0,nMission:0,nPending:0},cherry:{w:0,s:0},chance:{w:0,s:0},other:{w:0,s:0}},modeHints:[],_steps:[],mode:'normal',parallel:{},
      revive:0,melonLeft:null,melonApprox:false,rewardHint:null,modeHint:null,ticket:false,judgeWins:0,
      returnHit:null,pendingReward:null,modeEra:0,melonPhase:'normal',zenchou:false};
  }).sort((a,b)=>new Date(a.startAt)-new Date(b.startAt));
  let padding=Math.max(0,1400000-JSON.stringify(sessions).length);
  sessions.forEach((s,i)=>{const n=Math.ceil(padding/(sessions.length-i));s.endNote+='検'.repeat(n);padding-=n});
  return {version:2,gen:4,settings:{lend:46},cur:null,sessions,
    entries:Array.from({length:6},(_,i)=>({id:'entry-'+i,kind:'slot',machine:'合成収支',date:'2026-10-01',cashIn:1000,cashOut:2000,withdraw:0,deposit:0,storeId:'store-0',storeName:'合成店舗0'})),
    stores:[{id:'store-0',name:'合成店舗0',conds:[]},{id:'store-1',name:'合成店舗1',conds:[]}]};
}
module.exports=fixture;
if(require.main===module){const d=fixture();console.log(JSON.stringify({sessions:d.sessions.length,characters:JSON.stringify(d).length,events:[Math.min(...d.sessions.map(s=>s.events.length)),Math.max(...d.sessions.map(s=>s.events.length))],entries:d.entries.length,stores:d.stores.length}))}

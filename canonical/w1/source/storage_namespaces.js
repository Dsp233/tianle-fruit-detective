'use strict';
// Read-only archive inventory. QA records never share the production writer.
const StorageNamespaces=(()=>{
 const store=typeof module!=='undefined'?require('./progress_store'):ProgressStore;
 function releaseNumber(release){const m=String(release?.siteVersion||release||'').match(/rc\.(\d+)/);if(!m)throw Error('INVALID_RELEASE');return Number(m[1])}
 function registry(release){
  const current=releaseNumber(release),rows=[{key:'tianle_amc8_question_design_v1',scope:'main',label:'正式练习'}];
  const versions=[current,...Array.from({length:Math.max(0,current-72)},(_,i)=>current-1-i)];
  for(const version of versions)for(const [scope,label,prefix]of [['qa','定向 QA','qa'],['qa-normal','正常入口 QA','qa_normal'],['qa-history','历史兼容 QA','qa_history']])rows.push({key:'tianle_amc8_'+prefix+'_rc'+version+'_v1',scope,label:label+' · RC'+version,version});
  return rows;
 }
 function utf8Text(raw){return Array.from(raw,c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff?'\ufffd':c).join('')}
 function bytes(raw){return unescape(encodeURIComponent(utf8Text(raw))).length}
 function inspect(storage,release){return registry(release).map(row=>{try{const raw=storage.getItem(row.key);return {...row,present:raw!==null,bytes:raw===null?0:bytes(raw)}}catch{return {...row,present:false,error:'READ_FAILED'}}})}
 function archive(storage,release,keys,at=new Date().toISOString()){
  const allowed=new Map(registry(release).map(r=>[r.key,r])),selected=[...new Set(keys||[...allowed.keys()])],entries=[],errors=[];
  for(const key of selected){
   if(!allowed.has(key)){errors.push({namespace:key,reason:'UNREGISTERED_NAMESPACE'});continue}
   try{
    const raw=storage.getItem(key);if(raw===null)continue;
    const backups=[];for(let i=0;i<storage.length;i++){const backupKey=storage.key(i);if(!backupKey?.startsWith(key+'_backup_'))continue;try{const value=storage.getItem(backupKey);if(value!==null)backups.push({key:backupKey,raw:value,bytes:bytes(value),sha256:store.digest(utf8Text(value))})}catch{errors.push({namespace:backupKey,reason:'BACKUP_READ_FAILED'})}}
    entries.push({namespace:key,scope:allowed.get(key).scope,raw,bytes:bytes(raw),sha256:store.digest(utf8Text(raw)),backups});
   }catch{errors.push({namespace:key,reason:'READ_FAILED'})}
  }
  return {format:'tianle-record-archive-v2',release:release?.siteVersion||release,exportedAt:at,entries,errors};
 }
 return {registry,inspect,archive,bytes,releaseNumber};
})();
if(typeof module!=='undefined')module.exports=StorageNamespaces;

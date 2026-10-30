'use strict';
var ProgressStore=(typeof globalThis!=='undefined'&&globalThis.__AMC8_ProgressStore)||(()=>{
 function digest(text){
  const bytes=Array.from(unescape(encodeURIComponent(String(text))),x=>x.charCodeAt(0)),length=bytes.length*8;
  bytes.push(128);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push(i>=4?0:(length>>>((i%4)*8))&255);
  const prime=[],initial=[],constants=[];for(let n=2;constants.length<64;n++)if(!prime.some(p=>n%p===0)){prime.push(n);if(initial.length<8)initial.push((Math.sqrt(n)%1*4294967296)|0);constants.push((Math.cbrt(n)%1*4294967296)|0)}
  const rotate=(x,n)=>(x>>>n)|(x<<(32-n)),h=initial.slice();
  for(let offset=0;offset<bytes.length;offset+=64){const w=[];for(let i=0;i<16;i++)w[i]=(bytes[offset+4*i]<<24)|(bytes[offset+4*i+1]<<16)|(bytes[offset+4*i+2]<<8)|bytes[offset+4*i+3];for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2],a=rotate(x,7)^rotate(x,18)^(x>>>3),b=rotate(y,17)^rotate(y,19)^(y>>>10);w[i]=(w[i-16]+a+w[i-7]+b)|0}let [a,b,c,d,e,f,g,j]=h;for(let i=0;i<64;i++){const s=rotate(e,6)^rotate(e,11)^rotate(e,25),ch=(e&f)^(~e&g),t=(j+s+ch+constants[i]+w[i])|0,u=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))|0;j=g;g=f;f=e;e=(d+t)|0;d=c;c=b;b=a;a=(t+u)|0}for(const [i,v]of [a,b,c,d,e,f,g,j].entries())h[i]=(h[i]+v)|0}
  return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
 }
 function open(namespace,adapter={}){
  const storage=adapter.storage||localStorage,test=adapter.test===true,nav=typeof navigator==='undefined'?null:navigator;
  const idb=Object.prototype.hasOwnProperty.call(adapter,'indexedDB')?adapter.indexedDB:(typeof indexedDB==='undefined'?null:indexedDB);
  const releasedKey=namespace+'_writer_released';
  let writer=test,closed=false,pending=null,lastRaw=null,status=test?'ready':'acquiring',release=null,acquiring=false,fallbackMode=false,fallbackBusy=false;
  try{lastRaw=storage.getItem(namespace)}catch{writer=false;status='read_only'}
  const backups=[];
  const notify=()=>adapter.onStatus?.({status,raw:lastRaw});
  function flush(){return fallbackMode?flushFallback():writeNow()}
  function writeNow(){if(!writer||closed)return {ok:false,reason:'NOT_WRITER'};let current;
   try{current=storage.getItem(namespace)}catch(_){status='read_only';notify();return {ok:false,reason:'STORAGE_UNAVAILABLE'}}
   if(current!==lastRaw){status='conflict';notify();return {ok:false,reason:'CONFLICT'}}
   try{while(backups.length){const [key,value]=backups[0],old=storage.getItem(key);if(old!==null&&old!==value)throw Error('BACKUP_CONFLICT');if(old===null)storage.setItem(key,value);backups.shift()}if(pending!==null){storage.setItem(namespace,pending);lastRaw=pending;pending=null}status='ready';notify();return {ok:true,raw:lastRaw}}
   catch(e){status=e.message==='BACKUP_CONFLICT'?'conflict':'unsaved';notify();return {ok:false,reason:status==='conflict'?'CONFLICT':'QUOTA'}}
  }
  function commit(snapshot,expectedRaw){if(status==='conflict'||closed)return {ok:false,reason:'CONFLICT'};if(expectedRaw!==lastRaw)return {ok:false,reason:'CONFLICT'};try{pending=JSON.stringify(snapshot)}catch{status='unsaved';notify();return {ok:false,reason:'SERIALIZATION'}}if(!writer){notify();return {ok:false,reason:'NOT_WRITER',pending:true}}return flush()}
  // A fallback writer owns only an IndexedDB readwrite transaction, never a
  // persistent page lease. Every compare-and-write runs inside that serialized
  // transaction. A destroyed page therefore leaves no lock that needs a timer.
  // Unreleased claims from the older lifetime-lock protocol stay protected.
  function acquireFallback(){
   if(!idb)return false;
   fallbackMode=true;
   flushFallback();
   return true;
  }
  function flushFallback(){
   if(closed||status==='conflict')return {ok:false,reason:'CONFLICT_OR_CLOSED'};
   if(fallbackBusy)return {ok:false,reason:'PENDING',pending:true};
   fallbackBusy=true;acquiring=true;status='acquiring';Promise.resolve().then(notify);
   let done=false,canceled=false,initializing=false,db=null,tx=null,request;
   const finish=(failure)=>{
    if(done)return;done=true;clearTimeout(timer);db?.close();fallbackBusy=false;acquiring=false;
    if(closed)return;
    if(failure){writer=false;if(status!=='conflict')status='read_only';notify();return;}
    if(initializing){flushFallback();return;}
    if(status==='ready'&&(pending!==null||backups.length))flushFallback();
   };
   const timer=setTimeout(()=>{canceled=true;try{tx?.abort()}catch(_){}finish(true)},15000);
   try{request=idb.open('amc8-writer-locks-v1',1)}catch(_){finish(true);return {ok:false,reason:'LOCK_UNAVAILABLE',pending:true}}
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('locks'))request.result.createObjectStore('locks')};
   request.onblocked=request.onerror=()=>{canceled=true;finish(true)};
   request.onsuccess=()=>{
    db=request.result;if(canceled||closed){db.close();finish(true);return;}
    try{
     tx=db.transaction('locks','readwrite');const locks=tx.objectStore('locks'),get=locks.get(namespace);
     get.onsuccess=()=>{
      if(canceled||closed){try{tx.abort()}catch(_){}return;}
      let marker;try{marker=storage.getItem(releasedKey)}catch(_){try{tx.abort()}catch(_){}finish(true);return;}
      const claim=get.result;
      if(claim&&claim.protocol!==2&&!(typeof claim.owner==='string'&&claim.owner.length>0&&claim.owner===marker)){writer=false;status='read_only';notify();return;}
      // Commit the protocol marker before any localStorage write. An aborted
      // IndexedDB migration must never make a record appear safely saved.
      if(!claim||claim.protocol!==2){locks.put({protocol:2},namespace);initializing=true;return;}
      writer=true;
      // Recheck the stored baseline while the transaction excludes every
      // other current fallback writer. No await may separate this check/write.
      writeNow();
     };
     tx.oncomplete=()=>finish(false);
     tx.onabort=tx.onerror=()=>finish(true);
    }catch(_){finish(true)}
   };
   return {ok:false,reason:'PENDING',pending:true};
  }
  function retry(){
   if(closed||status==='conflict')return {ok:false,reason:'CONFLICT_OR_CLOSED'};
   // A failed write remains exportable in `pending`. If this page already
   // owns the lock (for example after a quota error), retry the write. If it
   // does not, acquire normally and let flush recheck the stored baseline
   // under the lock before writing the retained draft.
   if(writer)return pending!==null||backups.length?flush():{ok:true,raw:lastRaw};
   if(acquiring)return {ok:false,reason:'ACQUIRING'};
   try{if(storage.getItem(namespace)!==lastRaw){status='conflict';Promise.resolve().then(notify);return {ok:false,reason:'CONFLICT'}}}
   catch(_){status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'STORAGE_UNAVAILABLE'}}
   if(adapter.transactional||!nav?.locks?.request){if(acquireFallback())return {ok:false,reason:'ACQUIRING'};status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'LOCK_UNAVAILABLE'}}
   acquiring=true;status='acquiring';Promise.resolve().then(notify);
   Promise.resolve().then(()=>nav.locks.request('amc8-writer:'+namespace,{mode:'exclusive',ifAvailable:true},lock=>{
    acquiring=false;if(!lock||closed){status='read_only';notify();return}
    writer=true;status='ready';flush();return new Promise(resolve=>release=resolve)
   })).catch(()=>{acquiring=false;status='read_only';notify()});
   return {ok:false,reason:'ACQUIRING'};
  }
  if(!test)retry();
  return {commit,backup:(key,raw)=>{backups.push([key,raw]);return writer?flush():{ok:false,reason:'NOT_WRITER',pending:true}},flush,retry,exportSnapshot:()=>({stored:lastRaw,pending}),getStatus:()=>status,close(){flush();closed=true;writer=false;release?.()}};
 }
 return {open,digest};
})();
if(typeof globalThis!=='undefined')globalThis.__AMC8_ProgressStore=ProgressStore;
if(typeof module!=='undefined')module.exports=ProgressStore;

'use strict';
const ProgressStore=(()=>{
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
  const idb=adapter.indexedDB||(typeof indexedDB==='undefined'?null:indexedDB),random=typeof crypto==='undefined'?null:crypto;
  const releasedKey=namespace+'_writer_released';
  let writer=test,closed=false,pending=null,lastRaw=null,status=test?'ready':'acquiring',release=null,acquiring=false,fallbackOwner=null;
  try{lastRaw=storage.getItem(namespace)}catch{writer=false;status='read_only'}
  const backups=[];
  const notify=()=>adapter.onStatus?.({status,raw:lastRaw});
  function flush(){if(!writer||closed)return {ok:false,reason:'NOT_WRITER'};if((()=>{try{return storage.getItem(namespace)}catch{status='read_only';return Symbol('unreadable')}})()!==lastRaw){status='conflict';notify();return {ok:false,reason:'CONFLICT'}}
   try{while(backups.length){const [key,value]=backups[0],old=storage.getItem(key);if(old!==null&&old!==value)throw Error('BACKUP_CONFLICT');if(old===null)storage.setItem(key,value);backups.shift()}if(pending!==null){storage.setItem(namespace,pending);lastRaw=pending;pending=null}status='ready';notify();return {ok:true,raw:lastRaw}}
   catch(e){status=e.message==='BACKUP_CONFLICT'?'conflict':'unsaved';notify();return {ok:false,reason:status==='conflict'?'CONFLICT':'QUOTA'}}
  }
  function commit(snapshot,expectedRaw){if(status==='conflict'||closed)return {ok:false,reason:'CONFLICT'};if(expectedRaw!==lastRaw)return {ok:false,reason:'CONFLICT'};try{pending=JSON.stringify(snapshot)}catch{status='unsaved';notify();return {ok:false,reason:'SERIALIZATION'}}if(!writer){notify();return {ok:false,reason:'NOT_WRITER',pending:true}}return flush()}
  // IndexedDB transactions provide a serialized claim when Web Locks are not
  // available. A claim is reusable only after its owner synchronously marks it
  // released; there is deliberately no time-based takeover of a live writer.
  function acquireFallback(){
   if(!idb||!random?.getRandomValues)return false;
   const bytes=new Uint8Array(16);try{random.getRandomValues(bytes)}catch(_){return false}
   const owner=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
   let canceled=false,claimed=false,finished=false,timer=null;
   const markReleased=()=>{try{storage.setItem(releasedKey,owner)}catch(_){/* Preserve the claim on storage failure. */}};
   const finishReadOnly=()=>{if(finished)return;finished=true;if(timer!==null)clearTimeout(timer);acquiring=false;if(!closed){status='read_only';notify()}};
   acquiring=true;status='acquiring';Promise.resolve().then(notify);
   // Some older engines can leave IndexedDB requests pending indefinitely.
   // A timed-out request may finish later but is never allowed to become a writer.
   timer=setTimeout(()=>{canceled=true;finishReadOnly()},15000);
   let request;
   try{request=idb.open('amc8-writer-locks-v1',1)}catch(_){finishReadOnly();return true}
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('locks'))request.result.createObjectStore('locks')};
   request.onblocked=()=>{canceled=true;finishReadOnly()};
   request.onerror=()=>finishReadOnly();
   request.onsuccess=()=>{
    const db=request.result;if(canceled||closed){db.close();finishReadOnly();return}
    let tx;
    try{
     tx=db.transaction('locks','readwrite');const store=tx.objectStore('locks'),get=store.get(namespace);
     get.onsuccess=()=>{
      if(canceled||closed)return;
      let marker;try{marker=storage.getItem(releasedKey)}catch(_){tx.abort();return}
      if(!get.result||get.result.owner===marker){store.put({owner},namespace);claimed=true}
     };
     tx.oncomplete=()=>{
      db.close();
      if(!claimed){finishReadOnly();return}
      if(canceled||closed){markReleased();finishReadOnly();return}
      finished=true;if(timer!==null)clearTimeout(timer);acquiring=false;fallbackOwner=owner;
      // Another page may have written since this page read its snapshot.
      try{if(storage.getItem(namespace)!==lastRaw){fallbackOwner=null;markReleased();status='conflict';notify();return}}
      catch(_){fallbackOwner=null;markReleased();status='read_only';notify();return}
      writer=true;status='ready';flush();
     };
     tx.onabort=tx.onerror=()=>{db.close();finishReadOnly()};
    }catch(_){db.close();finishReadOnly()}
   };
   return true;
  }
  function retry(){
   if(closed||status==='conflict')return {ok:false,reason:'CONFLICT_OR_CLOSED'};
   if(writer)return {ok:true};
   if(pending!==null)return {ok:false,reason:'PENDING_DRAFT'};
   if(acquiring)return {ok:false,reason:'ACQUIRING'};
   try{if(storage.getItem(namespace)!==lastRaw){status='conflict';Promise.resolve().then(notify);return {ok:false,reason:'CONFLICT'}}}
   catch(_){status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'STORAGE_UNAVAILABLE'}}
   if(!nav?.locks?.request){if(acquireFallback())return {ok:false,reason:'ACQUIRING'};status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'LOCK_UNAVAILABLE'}}
   acquiring=true;status='acquiring';Promise.resolve().then(notify);
   Promise.resolve().then(()=>nav.locks.request('amc8-writer:'+namespace,{mode:'exclusive',ifAvailable:true},lock=>{
    acquiring=false;if(!lock||closed){status='read_only';notify();return}
    writer=true;status='ready';flush();return new Promise(resolve=>release=resolve)
   })).catch(()=>{acquiring=false;status='read_only';notify()});
   return {ok:false,reason:'ACQUIRING'};
  }
  if(!test)retry();
  return {commit,backup:(key,raw)=>{backups.push([key,raw]);return writer?flush():{ok:false,reason:'NOT_WRITER',pending:true}},flush,retry,exportSnapshot:()=>({stored:lastRaw,pending}),getStatus:()=>status,close(){flush();closed=true;writer=false;if(fallbackOwner){try{storage.setItem(releasedKey,fallbackOwner)}catch(_){}fallbackOwner=null}release?.()}};
 }
 return {open,digest};
})();
if(typeof module!=='undefined')module.exports=ProgressStore;

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
  const idb=Object.prototype.hasOwnProperty.call(adapter,'indexedDB')?adapter.indexedDB:(typeof indexedDB==='undefined'?null:indexedDB),random=typeof crypto==='undefined'?null:crypto;
  const releasedKey=namespace+'_writer_released';
  let writer=test,closed=false,pending=null,lastRaw=null,status=test?'ready':'acquiring',release=null,acquiring=false,fallbackOwner=null,fallbackMode=false,fallbackBusy=false;
  try{lastRaw=storage.getItem(namespace);if(Object.prototype.hasOwnProperty.call(adapter,'expectedRaw')&&lastRaw!==adapter.expectedRaw){writer=false;status='conflict'}}catch{writer=false;status='read_only'}
  const backups=[];
  const notify=()=>{try{adapter.onStatus?.({status,raw:lastRaw})}catch(error){if(typeof console!=='undefined')console.error('Could not update the save indicator',error)}};
  function flush(){return fallbackMode?flushFallback():writeNow()}
  function writeNow(deferReady=false){if(!writer||closed)return {ok:false,reason:'NOT_WRITER'};let current;
   try{current=storage.getItem(namespace)}catch(_){status='read_only';notify();return {ok:false,reason:'STORAGE_UNAVAILABLE'}}
   if(current!==lastRaw){status='conflict';notify();return {ok:false,reason:'CONFLICT'}}
   try{while(backups.length){const [key,value]=backups[0],old=storage.getItem(key);if(old!==null&&old!==value)throw Error('BACKUP_CONFLICT');if(old===null)storage.setItem(key,value);backups.shift()}if(pending!==null){storage.setItem(namespace,pending);lastRaw=pending;pending=null}if(!deferReady){status='ready';notify();}return {ok:true,raw:lastRaw}}
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
  // A fallback writer owns only an IndexedDB readwrite transaction, never a
  // persistent page lease. Every compare-and-write runs inside that serialized
  // transaction. A destroyed page therefore leaves no lock that needs a timer.
  // Unreleased claims from the older lifetime-lock protocol stay protected.
  function acquireSerialized(){
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
      writeNow(true);
     };
     tx.oncomplete=()=>{if(!initializing&&status==='acquiring'){status='ready';notify();}finish(false);};
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
   // Mathematics can coexist with old versions that use Web Locks but do not
   // consult the IndexedDB fallback claim. Hold both protocols when available.
   if(adapter.transactional&&adapter.guardWebLock&&nav?.locks?.request&&!release){
    acquiring=true;status='acquiring';Promise.resolve().then(notify);
    Promise.resolve().then(()=>nav.locks.request('amc8-writer:'+namespace,{mode:'exclusive',ifAvailable:true},lock=>{
     acquiring=false;if(!lock||closed){status='read_only';notify();return;}
     const held=new Promise(resolve=>release=resolve);
     if(!acquireSerialized()){status='read_only';notify();}
     return held;
    })).catch(()=>{acquiring=false;status='read_only';notify()});
    return {ok:false,reason:'ACQUIRING'};
   }
   if(adapter.transactional){if(acquireSerialized())return {ok:false,reason:'ACQUIRING'};status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'LOCK_UNAVAILABLE'}}
   if(!nav?.locks?.request){if(acquireFallback())return {ok:false,reason:'ACQUIRING'};status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'LOCK_UNAVAILABLE'}}
   acquiring=true;status='acquiring';Promise.resolve().then(notify);
   Promise.resolve().then(()=>nav.locks.request('amc8-writer:'+namespace,{mode:'exclusive',ifAvailable:true},lock=>{
    acquiring=false;if(!lock||closed){status='read_only';notify();return}
    writer=true;status='ready';flush();return new Promise(resolve=>release=resolve)
   })).catch(()=>{acquiring=false;status='read_only';notify()});
   return {ok:false,reason:'ACQUIRING'};
  }
  if(status==='conflict')Promise.resolve().then(notify);else if(!test)retry();
  return {commit,backup:(key,raw)=>{backups.push([key,raw]);return writer?flush():{ok:false,reason:'NOT_WRITER',pending:true}},flush,retry,exportSnapshot:()=>({stored:lastRaw,pending}),getStatus:()=>status,close(){flush();closed=true;writer=false;if(fallbackOwner){try{storage.setItem(releasedKey,fallbackOwner)}catch(_){}fallbackOwner=null}release?.()}};
 }
 return {open,digest};
})();
if(typeof globalThis!=='undefined')globalThis.__AMC8_ProgressStore=ProgressStore;
if(typeof module!=='undefined')module.exports=ProgressStore;

/* Reading R1: additive local evidence. This module never opens the mathematics key. */
window.ReadingEngine=(()=>{
 'use strict';
 const DAY=86400000, MODES=['all','demand','focus','none'];
 const clone=x=>JSON.parse(JSON.stringify(x));
 const voiceKinds=new Set(['voice','story','sentence','word','character','question','repeat','option']);
 const aidKeys=new Set(['all','focus']);
 function hash(value){let h=2166136261;for(const c of String(value)){h^=c.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
 function create(data,storage,key,clock=()=>Date.now(),options={}){
  if(!data||!Array.isArray(data.materials)||typeof key!=='string'||!key)throw Error('阅读数据或存储键无效');
  const diagnostics=data.diagnostics?.sets||[];
  const materials=[...data.materials,...diagnostics.flatMap(s=>s.forms.flatMap(f=>f.materials))];
  const bank=new Map(materials.map(m=>[m.id,m])),qs=new Map(materials.flatMap(m=>m.questions.map(q=>[q.id,{q,m}])));
  // A new-ID matching item records each destination separately; partial drafts
  // are allowed, but duplicates and incomplete submissions never count.
  function validMatchDraft(q,value,complete=false){
   if(!Array.isArray(value)||value.length!==q.matchLeft.length)return false;
   const filled=value.filter(x=>x!==null);
   return (!complete||filled.length===value.length)&&new Set(filled).size===filled.length&&filled.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length);
  }
  function validDepartureAnswer(q,value){const t=q.departure;return Number.isInteger(value)&&value>=t.min&&value<=t.max&&(value-t.min)%t.step===0;}
  function validDepartureQuestion(q){const t=q.departure;return Array.isArray(q.options)&&q.options.length>0&&q.options.every(x=>typeof x==='string'&&x.length>0)&&t&&Number.isInteger(t.min)&&Number.isInteger(t.max)&&Number.isInteger(t.step)&&Number.isInteger(t.initial)&&t.min>=0&&t.max<=1439&&t.min<t.max&&t.step>0&&t.step<=60&&(t.max-t.min)%t.step===0&&validDepartureAnswer(q,t.initial)&&validDepartureAnswer(q,q.answer);}
  for(const {q} of qs.values())if(q.type==='departure'&&!validDepartureQuestion(q))throw Error('出发时间题配置无效');
  function validRouteDraft(q,value,complete=false){
   return Array.isArray(value)&&value.length<=(q.route.maxStops||12)&&(!complete||value.length>=2)&&value.every(x=>Number.isInteger(x)&&x>=0&&x<q.options.length);
  }
  function validRouteQuestion(q){
   const r=q.route;
   if(!(Array.isArray(q.options)&&q.options.length>=2&&q.options.length<=30&&q.options.every(x=>typeof x==='string'&&x.length>0)&&new Set(q.options).size===q.options.length&&r&&Number.isInteger(r.maxStops)&&r.maxStops>=2&&r.maxStops<=30&&q.answer==='route'&&Array.isArray(r.acceptedRoutes)&&r.acceptedRoutes.length>0&&r.acceptedRoutes.length<=100&&r.acceptedRoutes.every(v=>validRouteDraft(q,v,true))&&new Set(r.acceptedRoutes.map(v=>JSON.stringify(v))).size===r.acceptedRoutes.length))return false;
   const g=r.graph;if(g===undefined)return true;
   if(!g||!Array.isArray(g.positions)||g.positions.length!==q.options.length||new Set(g.positions.map(p=>JSON.stringify(p))).size!==g.positions.length||g.positions.some(p=>!Array.isArray(p)||p.length!==2||!Number.isFinite(p[0])||!Number.isFinite(p[1])||p[0]<20||p[0]>580||p[1]<20||p[1]>240)||!Array.isArray(g.edges)||g.edges.length>100||g.edges.some(e=>!e||!Number.isInteger(e.from)||!Number.isInteger(e.to)||e.from<0||e.to<0||e.from>=q.options.length||e.to>=q.options.length||e.from===e.to||!['open','closed','notYet'].includes(e.state))||new Set(g.edges.map(e=>e.from+':'+e.to)).size!==g.edges.length)return false;
   return r.acceptedRoutes.every(v=>v.slice(1).every((to,i)=>g.edges.some(e=>e.from===v[i]&&e.to===to&&e.state==='open')));
  }
  function routeCorrect(q,value){return validRouteDraft(q,value,true)&&q.route.acceptedRoutes.some(route=>JSON.stringify(route)===JSON.stringify(value));}
  for(const {q} of qs.values())if(q.type==='route'&&!validRouteQuestion(q))throw Error('路线题配置无效');
  function validCargoDraft(q,value,complete=false){
   return Array.isArray(value)&&value.length===q.options.length&&value.every(x=>x===1||x===2||!complete&&x===null);
  }
  function cargoCorrect(q,value){
   if(!validCargoDraft(q,value,true))return false;
   const spec=q.cargo;
   if(spec.requireBoth===true&&(!value.includes(1)||!value.includes(2)))return false;
   if(spec.firstRequired.some(i=>value[i]!==1)||spec.strictBefore.some(([a,b])=>value[a]>=value[b]))return false;
   return [1,2].every(trip=>spec.weights.reduce((sum,w,i)=>sum+(value[i]===trip?w:0),0)<=spec.capacity);
  }
  function validCargoQuestion(q){
   const n=q.options?.length,c=q.cargo;
   if(!Array.isArray(q.options)||!Number.isInteger(n)||n<1||n>12||q.options.some(x=>typeof x!=='string'||!x)||!c||!Array.isArray(c.weights)||c.weights.length!==n||c.weights.some(x=>!Number.isSafeInteger(x)||x<=0||x>100000)||!Number.isSafeInteger(c.capacity)||c.capacity<=0||c.capacity>1200000||!Array.isArray(c.firstRequired)||new Set(c.firstRequired).size!==c.firstRequired.length||c.firstRequired.some(i=>!Number.isInteger(i)||i<0||i>=n)||!Array.isArray(c.strictBefore)||c.strictBefore.some(p=>!Array.isArray(p)||p.length!==2||p.some(i=>!Number.isInteger(i)||i<0||i>=n)||p[0]===p[1])||!(c.requireBoth===undefined||typeof c.requireBoth==='boolean')||q.answer!=='cargo')return false;
   for(let mask=0;mask<2**n;mask++){const v=Array.from({length:n},(_,i)=>mask&(1<<i)?2:1);if(cargoCorrect(q,v))return true;}
   return false;
  }
  for(const {q} of qs.values())if(q.type==='cargo'&&!validCargoQuestion(q))throw Error('装载题配置无效或没有可行方案');
  for(const {q} of qs.values())if(q.type==='match'){
   if(!Array.isArray(q.matchLeft)||q.matchLeft.length<2||q.matchLeft.length>12||q.matchLeft.some(x=>typeof x!=='string'||!x)||!Array.isArray(q.options)||q.options.length!==q.matchLeft.length||q.options.some(x=>typeof x!=='string'||!x)||!validMatchDraft(q,q.answer,true))throw Error('对应题配置无效');
  }
  // Preserve the preview's answer structures and distinguish a partial draft
  // from a complete submission; unknown interaction types fail closed.
  const extraTypes=new Set(['pair','anypair','sequence','loop','rule','purchase','classification','strip','grid','mirror','allocation','manifest']);
  const baseTypes=new Set(['choice','relation','order','evidence','truefalse','match','route','departure','cargo']);
  const validIndexArray=(v,n,maxLength,completeLength=null)=>Array.isArray(v)&&v.length<=maxLength&&(completeLength===null||v.length===completeLength)&&new Set(v).size===v.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<n);
  const validVector=(v,n,test,complete)=>Array.isArray(v)&&v.length===n&&v.every(x=>x===null?!complete:test(x));
  function validExtraDraft(q,v,complete=false){
   switch(q.type){
    case 'pair':case 'anypair':return validIndexArray(v,q.options.length,2,complete?2:null);
    case 'sequence':return typeof v==='string'&&/^[AB]{0,4}$/.test(v)&&(!complete||v.length===4);
    case 'loop':return typeof v==='string'&&/^loop:[0-6]$/.test(v);
    case 'rule':return typeof v==='string'&&/^(blue|red)[&|](square|circle)$/.test(v);
    case 'purchase':return typeof v==='string'&&/^packs:[0-6],[0-6],[0-6]$/.test(v)&&(!complete||v!=='packs:0,0,0');
    case 'classification':return validVector(v,q.items.length,x=>Number.isInteger(x)&&x>=0&&x<q.options.length,complete);
    case 'manifest':return validVector(v,q.manifest.weights.length,x=>x===1||x===2,complete);
    case 'allocation':return validVector(v,q.allocation.minimum.length,x=>Number.isInteger(x)&&x>=0&&x<=q.allocation.total,complete);
    case 'grid':case 'mirror':return validIndexArray(v,q.grid.rows*q.grid.cols,q.grid.rows*q.grid.cols,null)&&(!complete||v.length>0);
    case 'strip':return Number.isInteger(v)&&v>=0&&v<=2;
    default:return false;
   }
  }
  function validExtraQuestion(q){
   if(!Array.isArray(q.options)||!q.options.length||q.options.length>30||q.options.some(x=>typeof x!=='string'||!x))return false;
   if(q.type==='pair')return validIndexArray(q.answer,q.options.length,2,2);
   if(q.type==='anypair')return Array.isArray(q.answer)&&q.answer.length>0&&q.answer.length<=100&&q.answer.every(v=>validIndexArray(v,q.options.length,2,2))&&new Set(q.answer.map(v=>JSON.stringify([...v].sort((a,b)=>a-b)))).size===q.answer.length;
   if(q.type==='sequence')return Array.isArray(q.answer)&&q.answer.length>0&&q.answer.length<=16&&q.answer.every(v=>validExtraDraft(q,v,true))&&new Set(q.answer).size===q.answer.length;
   if(['loop','rule','purchase'].includes(q.type))return validExtraDraft(q,q.answer,true);
   if(q.type==='strip')return /^overlap:[0-2]$/.test(q.answer);
   if(q.type==='classification')return Array.isArray(q.items)&&q.items.length>0&&q.items.length<=12&&q.items.every(x=>typeof x==='string'&&x)&&validExtraDraft(q,q.answer,true);
   if(q.type==='allocation'){const a=q.allocation;return !!a&&Number.isInteger(a.total)&&a.total>=0&&a.total<=100&&Array.isArray(a.minimum)&&a.minimum.length===q.options.length&&a.minimum.length<=12&&a.minimum.every(n=>Number.isInteger(n)&&n>=0)&&a.minimum.reduce((x,y)=>x+y,0)<=a.total;}
   if(q.type==='manifest'){const a=q.manifest,n=q.options.length;return !!a&&n<=12&&Array.isArray(a.weights)&&a.weights.length===n&&a.weights.every(w=>Number.isSafeInteger(w)&&w>0&&w<=100000)&&Number.isSafeInteger(a.capacity)&&a.capacity>0&&Number.isInteger(a.maxItems)&&a.maxItems>0&&a.maxItems<=n&&Array.isArray(a.firstRequired)&&new Set(a.firstRequired).size===a.firstRequired.length&&a.firstRequired.every(i=>Number.isInteger(i)&&i>=0&&i<n)&&Array.from({length:2**n},(_,mask)=>Array.from({length:n},(_,i)=>mask&(1<<i)?2:1)).some(v=>manifestCorrect(q,v));}
   if(q.type==='grid'||q.type==='mirror'){
    const g=q.grid;if(!g||!Number.isInteger(g.rows)||!Number.isInteger(g.cols)||g.rows<1||g.cols<1||g.rows*g.cols>100)return false;
    if(q.type==='grid')return g.rectangle===true&&Number.isInteger(g.area)&&g.area>0&&g.area<=g.rows*g.cols&&Number.isInteger(g.perimeter)&&g.perimeter>0&&Array.isArray(g.blocked)&&validIndexArray(g.blocked,g.rows*g.cols,g.rows*g.cols);
    if(!validIndexArray(g.fixed,g.rows*g.cols,g.rows*g.cols)||!validIndexArray(g.editable,g.rows*g.cols,g.rows*g.cols)||!validIndexArray(g.target,g.rows*g.cols,g.rows*g.cols)||g.fixed.some(i=>g.editable.includes(i)))return false;
    const reflected=g.fixed.map(i=>Math.floor(i/g.cols)*g.cols+g.cols-1-i%g.cols).sort((a,b)=>a-b);
    return JSON.stringify(reflected)===JSON.stringify([...g.target].sort((a,b)=>a-b))&&g.target.every(i=>g.editable.includes(i));
   }
   return false;
  }
  function manifestCorrect(q,v){const a=q.manifest;return a.firstRequired.every(i=>v[i]===1)&&[1,2].every(t=>v.filter(x=>x===t).length<=a.maxItems&&a.weights.reduce((sum,w,i)=>sum+(v[i]===t?w:0),0)<=a.capacity);}
  function extraCorrect(q,v){
   if(!validExtraDraft(q,v,true))return false;
   if(q.type==='pair')return JSON.stringify([...v].sort((a,b)=>a-b))===JSON.stringify([...q.answer].sort((a,b)=>a-b));
   if(q.type==='anypair')return q.answer.some(a=>JSON.stringify([...a].sort((x,y)=>x-y))===JSON.stringify([...v].sort((x,y)=>x-y)));
   if(q.type==='sequence')return q.answer.includes(v);
   if(q.type==='classification')return JSON.stringify(v)===JSON.stringify(q.answer);
   if(q.type==='strip')return v===Number(q.answer.slice('overlap:'.length));
   if(q.type==='allocation')return v.reduce((a,b)=>a+b,0)===q.allocation.total&&v.every((n,i)=>n>=q.allocation.minimum[i]);
   if(q.type==='manifest')return manifestCorrect(q,v);
   if(q.type==='mirror')return JSON.stringify([...v].sort((a,b)=>a-b))===JSON.stringify([...q.grid.target].sort((a,b)=>a-b));
   if(q.type==='grid'){
    const g=q.grid;if(v.some(i=>g.blocked.includes(i))||v.length!==g.area)return false;
    const rows=v.map(i=>Math.floor(i/g.cols)),cols=v.map(i=>i%g.cols),height=Math.max(...rows)-Math.min(...rows)+1,width=Math.max(...cols)-Math.min(...cols)+1;
    return height*width===v.length&&2*(height+width)===g.perimeter;
   }
   return JSON.stringify(v)===JSON.stringify(q.answer);
  }
  for(const {q} of qs.values()){
   if(!baseTypes.has(q.type)&&!extraTypes.has(q.type))throw Error('不支持的阅读题型：'+q.type);
   if(extraTypes.has(q.type)&&!validExtraQuestion(q))throw Error('互动题配置无效：'+q.id);
   if(q.metadataStatus==='unreviewed'&&(q.classification!==null||q.category!==null||q.ability!==null||q.errorType!==null))throw Error('未审校题目不能带能力或错因分类：'+q.id);
  }

  // Opt-in scope for a future additive course. Unscoped existing releases keep
  // their historical behavior; scoped banks must retain uniquely identified
  // legacy material and cannot silently treat it as current curriculum.
  const courseScope=data.courseScope??null;
  if(courseScope&&(courseScope.schema!==1||typeof courseScope.activeCourseId!=='string'||!courseScope.activeCourseId))throw Error('课程版本范围无效');
  if(courseScope){
   if(courseScope.legacyCourseIds!==undefined&&(!Array.isArray(courseScope.legacyCourseIds)||new Set(courseScope.legacyCourseIds).size!==courseScope.legacyCourseIds.length||courseScope.legacyCourseIds.some(id=>typeof id!=='string'||!id||id===courseScope.activeCourseId)))throw Error('历史课程白名单无效');
   if(materials.some(m=>!m||typeof m.id!=='string'||typeof m.courseId!=='string'||!m.courseId||!Array.isArray(m.questions))||new Set(materials.map(m=>m.id)).size!==materials.length)throw Error('课程材料版本或编号无效');
   const ids=materials.flatMap(m=>m.questions.map(q=>q.id));if(ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)throw Error('课程题目编号重复');
   if(!Array.isArray(data.lessons)||new Set(data.lessons.map(l=>l.day)).size!==data.lessons.length||data.lessons.some(l=>!Array.isArray(l.coreIds)||!l.coreIds.length||!Array.isArray(l.reserveIds)||(l.optionalIds!==undefined&&!Array.isArray(l.optionalIds))||![...l.coreIds,...l.reserveIds,...(l.optionalIds||[])].every(id=>bank.get(id)?.courseId===courseScope.activeCourseId)||(l.optionalIds||[]).some(id=>bank.get(id)?.day!==l.day||l.coreIds.includes(id)||l.reserveIds.includes(id))))throw Error('当前课程路线混入历史材料或可选挑战配置无效');
   if(new Set(diagnostics.map(d=>d.id)).size!==diagnostics.length||diagnostics.some(d=>typeof d.courseId!=='string'||!d.courseId||!Array.isArray(d.forms)||d.forms.some(f=>!Array.isArray(f.materials)||f.materials.some(m=>m.courseId!==d.courseId))))throw Error('诊断材料版本不一致');
   const passageGroups=new Map();
   for(const m of materials)if(m.exposureGroup!==undefined){
    if(typeof m.exposureGroup!=='string'||!m.exposureGroup||m.exposureGroup.length>200||typeof m.text!=='string')throw Error('共享原文标识无效');
    const id=JSON.stringify([m.courseId,m.exposureGroup]),previous=passageGroups.get(id);
    if(previous!==undefined&&previous!==m.text)throw Error('同一共享原文标识对应不同正文');
    passageGroups.set(id,m.text);
   }

  }
  const optionalMaterials=new Set((data.lessons||[]).flatMap(l=>l.optionalIds||[]));
  const activeMaterial=m=>!courseScope||!!m&&m.courseId===courseScope.activeCourseId;
  const legacyCourses=new Set(courseScope?.legacyCourseIds||[]);
  // Retain the original diagnostic protocol for explicitly retained courses.
  // This exception never changes active-course progress or reporting scope.
  const diagnosticAllowed=set=>!!set&&(!courseScope||set.courseId===courseScope.activeCourseId||legacyCourses.has(set.courseId));
  const diagnosticReviewed=set=>!set.forms.some(f=>f.materials.some(m=>m.questions.some(q=>q.metadataStatus==='unreviewed')));
  const sessionCourse=s=>{if(!courseScope||!s)return null;const ids=new Set((s.materialIds||[]).map(id=>bank.get(id)?.courseId));return ids.size===1?[...ids][0]||null:null;};
  const activeEvent=e=>!courseScope||(e.materialId?activeMaterial(bank.get(e.materialId)):e.courseId===courseScope.activeCourseId);
  const activeCompletion=e=>!courseScope||e.courseId===courseScope.activeCourseId&&state.events.some(x=>x.type==='material_open'&&x.sessionId===e.sessionId&&activeMaterial(bank.get(x.materialId)))&&!state.events.some(x=>x.type==='material_open'&&x.sessionId===e.sessionId&&!activeMaterial(bank.get(x.materialId)));

  const writer=clock().toString(36)+'-'+Math.random().toString(36).slice(2,10);let sequence=0,raw=null,writeStatus='ready',writeMessage='',contentUpgradeBlocked=false;
  const defaults=()=>({pinyin:'all',rate:.85,remoteVoiceConsent:false,knownMath:[],dayRange:{start:1,end:84}});
  const fresh=()=>({schema:1,contentHash:data.contentHash,revision:0,createdAt:clock(),settings:defaults(),events:[],session:null,suspendedSessions:[],legacy:[]});
  let state=fresh();
  const finite=v=>Number.isFinite(v)&&v>=0;
  function safeObject(value){return value&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;}
  const validDayRange=value=>safeObject(value)&&Number.isInteger(value.start)&&Number.isInteger(value.end)&&value.start>=1&&value.start<=value.end&&value.end<=84;
  const inDayRange=day=>{const range=state.settings.dayRange||{start:1,end:84};return Number.isInteger(day)&&day>=range.start&&day<=range.end};
  const inMaterialRange=m=>Number.isInteger(m?.day)?inDayRange(m.day):Number.isInteger(m?.week)&&m.week>=Math.ceil((state.settings.dayRange?.start||1)/7)&&m.week<=Math.ceil((state.settings.dayRange?.end||84)/7);
  const shortString=(v,max=200)=>typeof v==='string'&&v.length<=max;
  const stringList=(v,max=200)=>Array.isArray(v)&&v.length<=max&&v.every(x=>shortString(x,100));
  function validSession(s){if(s===null)return true;if(!safeObject(s)||!shortString(s.id)||!stringList(s.materialIds,20)||!s.materialIds.length||s.materialIds.some(id=>!bank.has(id))||!Number.isInteger(s.materialIndex)||s.materialIndex<0||s.materialIndex>=s.materialIds.length||!Number.isInteger(s.questionIndex)||!safeObject(s.drafts)||!finite(s.activeMs)||!finite(s.lastTick)||!finite(s.questionActiveStart)||typeof s.paused!=='boolean'||!MODES.includes(s.pinyinMode)||!Number.isInteger(s.panelIndex)||!stringList(s.openMaterialIds,20)||!safeObject(s.priorExposure)||Object.values(s.priorExposure).some(x=>typeof x!=='boolean'))return false;
   if(courseScope&&!sessionCourse(s))return false;
   if(s.purpose==='optional-challenge'&&(!Number.isInteger(s.scopeDay)||s.materialIds.some(id=>bank.get(id)?.day!==s.scopeDay)||s.day!==null))return false;
   if(s.purpose==='unseen-choice'&&(!Number.isInteger(s.scopeDay)||s.materialIds.some(id=>bank.get(id)?.day!==s.scopeDay)||s.day!==null))return false;
   if(s.purpose==='review'&&s.scopeDay!==undefined&&!Number.isInteger(s.scopeDay))return false;
   const material=bank.get(s.materialIds[s.materialIndex]);if(s.questionIndex<0||s.questionIndex>=material.questions.length||s.panelIndex<0||s.panelIndex>=material.panels.length)return false;
   for(const [qid,value]of Object.entries(s.drafts)){const q=qs.get(qid)?.q;if(!q)return false;if(extraTypes.has(q.type)){if(!validExtraDraft(q,value))return false;}else if(q.type==='route'){if(!validRouteDraft(q,value))return false;}else if(q.type==='cargo'){if(!validCargoDraft(q,value))return false;}else if(q.type==='match'){if(!validMatchDraft(q,value))return false;}else if(q.type==='order'){if(!Array.isArray(value)||value.length>q.options.length||new Set(value).size!==value.length||value.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))return false;}else if(!validAnswer(q,value))return false;}
   if(s.diagnostic&&(!safeObject(s.diagnostic)||!['A','B','C','D'].includes(s.diagnostic.condition)||typeof s.diagnostic.knowledgeConfirmed!=='boolean'||!shortString(s.diagnostic.setId)||!shortString(s.diagnostic.formId)))return false;
   if(s.restoredFromBackup!==undefined&&typeof s.restoredFromBackup!=='boolean')return false;
   return !s.activeByDate||safeObject(s.activeByDate)&&Object.entries(s.activeByDate).every(([d,ms])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&finite(ms));
  }
  function safeTree(value,depth=0){if(depth>30)return false;if(!value||typeof value!=='object')return true;return Object.keys(value).every(k=>!['__proto__','prototype','constructor'].includes(k)&&safeTree(value[k],depth+1));}
  function validEvent(e){if(!safeObject(e)||!shortString(e.id)||!shortString(e.type,80)||!finite(e.at))return false;
   if(e.imported!==undefined&&typeof e.imported!=='boolean')return false;
   if(['material_open','aid_requested','speech_status','answer_revealed','attempt'].includes(e.type)&&(!shortString(e.sessionId)||!shortString(e.materialId)))return false;
   if(e.type==='aid_requested')return shortString(e.kind,50)&&(!e.mode||MODES.includes(e.mode));
   if(e.type==='speech_status')return shortString(e.status,50)&&(!e.spokenText||shortString(e.spokenText,2000));
   if(e.type==='material_open')return MODES.includes(e.pinyinMode)&&typeof e.priorExposure==='boolean';
   if(e.type!=='attempt')return true;
   const classified=['character','vocabulary','sentence','information','relation','calculation'].includes(e.errorType)&&['reading','math','literacy'].includes(e.category)&&['recognition','facts','sequence','inference','conditions','model'].includes(e.ability);
   const unreviewed=e.metadataStatus==='unreviewed'&&e.errorType===null&&e.category===null&&e.ability===null;
   if(!shortString(e.questionId)||!shortString(e.materialId)||typeof e.correct!=='boolean'||typeof e.first!=='boolean'||!Number.isInteger(e.aidLevel)||e.aidLevel<0||e.aidLevel>4||!Number.isInteger(e.practiceAidLevel)||e.practiceAidLevel<0||e.practiceAidLevel>4||!(classified||unreviewed)||e.metadataStatus==='unreviewed'&&!unreviewed||!stringList(e.targetWords,50)||e.targetWords.some(w=>['__proto__','prototype','constructor'].includes(w))||!stringList(e.tags,100)||!finite(e.activeMs)||!Number.isInteger(e.attemptNumber)||e.attemptNumber<1||!Number.isInteger(e.week)||e.week<0||e.week>12||![e.independent,e.pinyinEver,e.voiceEver,e.parentEver,e.answerExposed,e.priorExposure,e.prerequisitesConfirmed].every(v=>typeof v==='boolean'))return false;
   const descriptor=qs.get(e.questionId);return !descriptor||e.questionHash!==hash(JSON.stringify(descriptor.q))||e.materialHash!==hash(descriptor.m.text)||e.materialId===descriptor.m.id&&(descriptor.q.metadataStatus==='unreviewed')===unreviewed&&validAnswer(descriptor.q,e.selected);
  }
  function valid(s){return safeObject(s)&&safeTree(s)&&s.schema===1&&Number.isSafeInteger(s.revision)&&s.revision>=0&&safeObject(s.settings)&&MODES.includes(s.settings.pinyin)&&[.65,.85,1].includes(s.settings.rate)&&typeof s.settings.remoteVoiceConsent==='boolean'&&stringList(s.settings.knownMath,100)&&(s.settings.dayRange===undefined||validDayRange(s.settings.dayRange))&&Array.isArray(s.events)&&s.events.length<120000&&s.events.every(validEvent)&&new Set(s.events.map(e=>e.id)).size===s.events.length&&validSession(s.session)&&(!s.legacy||Array.isArray(s.legacy))&&(!s.suspendedSessions||Array.isArray(s.suspendedSessions)&&s.suspendedSessions.every(validSession));}
  try{raw=storage.getItem(key);if(raw!==null){const parsed=JSON.parse(raw);if(valid(parsed))state=parsed;else{writeStatus='read_only';writeMessage='原阅读记录的格式或版本无法安全读取，已保留原文并停止覆盖。';}}}
  catch(_){writeStatus='read_only';writeMessage='原阅读记录未能安全读取，当前仅保留草稿，不覆盖原记录。';}
  state.settings={...defaults(),...state.settings};state.legacy??=[];state.suspendedSessions??=[];
  let persistence=null;
  if(writeStatus==='ready'&&typeof ProgressStore!=='undefined'&&window.__AMC8_STORAGE_TEST!==true){
   persistence=ProgressStore.open(key,{storage,transactional:true,expectedRaw:raw,onStatus:result=>{
    if(contentUpgradeBlocked){options.onStatus?.({status:writeStatus,message:writeMessage});return;}
    if(result.status!=='conflict')raw=result.raw;
    writeStatus=result.status;
    writeMessage=({ready:'',acquiring:'正在保存阅读草稿，请稍候。',unsaved:'阅读记录尚未保存，请先导出当前草稿，再检查存储空间。原记录未清空。',read_only:'暂时无法保存阅读记录。请保留本页并重试，或先导出草稿。',conflict:'另一个页面更新了阅读记录。当前草稿仍在，请导出后合并。'})[result.status]||'阅读草稿尚未保存。';
    options.onStatus?.({status:writeStatus,message:writeMessage});
   }});
  }
  else if(writeStatus==='ready'&&options.requireSafe&&window.__AMC8_STORAGE_TEST!==true){writeStatus='read_only';writeMessage='安全保存功能暂不可用。请先导出阅读草稿，原记录不会被覆盖。';}
  if(writeStatus==='ready'&&raw!==null&&state.contentHash!==data.contentHash){
   // Store the exact previous record before any upgrade is allowed to write.
   // The production transactional store orders this backup before the pending
   // new snapshot while holding the same serialized writer transaction.
   let backupKey=null,protectedOriginal=false;
   try{
    const backupDigest=typeof ProgressStore!=='undefined'&&typeof ProgressStore.digest==='function'?ProgressStore.digest(raw):hash(raw);
    backupKey=key+'_backup_before_content_'+backupDigest;
    if(persistence){const result=persistence.backup(backupKey,raw);protectedOriginal=result.ok===true||result.pending===true;}
    else {const existing=storage.getItem(backupKey);if(existing!==null&&existing!==raw)throw Error('BACKUP_CONFLICT');if(existing===null)storage.setItem(backupKey,raw);protectedOriginal=storage.getItem(backupKey)===raw;}
   }catch(_){protectedOriginal=false;}
   if(!protectedOriginal){contentUpgradeBlocked=true;writeStatus='read_only';writeMessage='升级前的原始阅读记录无法安全备份，已停止升级；请导出原记录并检查存储空间。';}
   else{
    const previous=state.contentHash,policy=data.compatibility||{},knownUpgrade=policy.fromContentHash===previous,changed=new Set(policy.changedMaterialIds||[]),affected=s=>!knownUpgrade||!!s.diagnostic||s.materialIds.some(id=>changed.has(id));
    const archived=[state.session,...state.suspendedSessions].filter(s=>s&&affected(s));
    if(archived.length){state.legacy.push({schema:'amc8-reading-content-upgrade-session-archive',fromContentHash:previous,toContentHash:data.contentHash,archivedAt:clock(),reason:'题文或选项已更新，旧选项和草稿仅归档，不按新题解释。',sessions:clone(archived)});if(state.session&&affected(state.session))state.session=null;state.suspendedSessions=state.suspendedSessions.filter(s=>!affected(s));}
    state.contentHash=data.contentHash;append('content_upgrade',{fromContentHash:previous,toContentHash:data.contentHash,backupKey,archivedSessionIds:archived.map(s=>s.id),preservedSessionIds:[state.session,...state.suspendedSessions].filter(Boolean).map(s=>s.id)});
   }
  }
  if(state.session){state.session.paused=true;state.session.lastTick=clock();}
  function persist(){
   if(contentUpgradeBlocked)return false;
   if(persistence){
    if(writeStatus==='conflict')return false;
    state.revision++;writeStatus='acquiring';writeMessage='正在保存阅读草稿，请稍候。';
    const result=persistence.commit(state,raw);
    if(result.reason==='CONFLICT'){writeStatus='conflict';writeMessage='另一个页面更新了阅读记录。当前草稿仍在，请导出后合并。';}
    if(result.reason==='NOT_WRITER')persistence.retry();
    return result.ok;
   }
   if(['read_only','conflict'].includes(writeStatus))return false;
   try{if(storage.getItem(key)!==raw){writeStatus='conflict';writeMessage='另一个页面更新了阅读记录。当前草稿仍在，请导出后合并。';return false;}
    const revision=state.revision+1,next=JSON.stringify({...state,revision});storage.setItem(key,next);state.revision=revision;raw=next;writeStatus='ready';writeMessage='';return true;
   }catch(_){writeStatus='unsaved';writeMessage='阅读记录尚未保存，请先导出当前草稿，再检查存储空间。原记录未清空。';return false;}
  }
  function append(type,detail={}){const c=courseScope?(detail.courseId||(detail.materialId?bank.get(detail.materialId)?.courseId:type==='diagnostic_plan'?diagnostics.find(d=>d.id===detail.setId)?.courseId:sessionCourse(state.session))):null;const row={...clone(detail),...(c?{courseId:c}:{}),id:writer+'-'+(++sequence),type,at:clock(),contentHash:data.contentHash};state.events.push(row);persist();return clone(row);}
  const rows=(type,id)=>state.events.filter(e=>(!type||e.type===type)&&(!id||e.questionId===id));
  const attempts=id=>clone(rows('attempt',id));
  // Course progress remains separate, but the same exact passage is not
  // unseen merely because a question or course acquired a new identifier.
  function samePassage(a,b){if(a===b)return true;const one=bank.get(a),other=bank.get(b);return !!(courseScope&&one&&other&&typeof one.text==='string'&&one.text.length>0&&one.text===other.text);}
  function exposure(materialId){return state.events.some(e=>samePassage(materialId,e.materialId)&&['material_open','attempt','answer_revealed','legacy_exposure'].includes(e.type));}
  function current(){const s=state.session;if(!s)return null;const m=bank.get(s.materialIds[s.materialIndex]),q=m?.questions[s.questionIndex];if(!m||!q)return null;
   return {session:clone(s),material:m,question:q,attempts:attempts(q.id),readingComplete:state.events.some(e=>e.sessionId===s.id&&e.materialId===m.id&&['reading_phase_complete','attempt'].includes(e.type))||Object.keys(s.drafts).some(id=>m.questions.some(q=>q.id===id)),revealed:state.events.some(e=>e.type==='answer_revealed'&&e.questionId===q.id)};
  }
  function touch(){const s=state.session;if(!s||s.paused)return;const now=clock(),dt=now-s.lastTick;if(dt>0&&dt<=60000){s.activeMs+=dt;s.activeByDate??={};let from=s.lastTick;while(from<now){const d=new Date(from),midnight=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime(),end=Math.min(now,midnight),day=localDate(from);s.activeByDate[day]=(s.activeByDate[day]||0)+end-from;from=end;}}s.lastTick=now;}
  function pause(){if(!state.session)return false;touch();state.session.paused=true;append('session_pause',{sessionId:state.session.id,day:state.session.day,activeMs:state.session.activeMs,activeByDate:state.session.activeByDate||{}});return true;}
  function resume(){const s=state.session,scopeDay=['optional-challenge','unseen-choice','review'].includes(s?.purpose)?s.scopeDay:s?.day;if(!s||Number.isInteger(scopeDay)&&!inDayRange(scopeDay)||['optional-challenge','unseen-choice'].includes(s.purpose)&&s.materialIds.some(id=>!practiceAllowed(bank.get(id))))return false;state.session.paused=false;state.session.lastTick=clock();append('session_resume',{sessionId:state.session.id,day:state.session.day});return true;}
  function unfinished(){
   return [state.session,...state.suspendedSessions].filter(Boolean).map(s=>({id:s.id,active:s.id===state.session?.id,day:s.day,purpose:s.purpose,materialId:s.materialIds[s.materialIndex],title:bank.get(s.materialIds[s.materialIndex])?.title||'',diagnostic:clone(s.diagnostic||null),restoredFromBackup:s.restoredFromBackup===true}));
  }
  function resumeSession(id=state.session?.id){
   if(!id)return null;
   if(state.session?.id===id){if(!resume())return null;return current();}
   const selected=state.suspendedSessions.find(s=>s.id===id);if(!selected)return null;
   const scopeDay=['optional-challenge','unseen-choice','review'].includes(selected.purpose)?selected.scopeDay:selected.day;
   if(Number.isInteger(scopeDay)&&!inDayRange(scopeDay)||['optional-challenge','unseen-choice'].includes(selected.purpose)&&selected.materialIds.some(id=>!practiceAllowed(bank.get(id))))return null;
   if(state.session){pause();state.suspendedSessions.push(clone(state.session));}
   state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==id);
   state.session=clone(selected);resume();return current();
  }
  function openCurrent(){const c=current();if(!c)return null;const s=state.session;
   if(!s.openMaterialIds.includes(c.material.id)){const seen=exposure(c.material.id);s.priorExposure[c.material.id]=seen;s.openMaterialIds.push(c.material.id);s.readActiveStarts??={};s.readActiveStarts[c.material.id]=s.activeMs;append('material_open',{sessionId:s.id,materialId:c.material.id,priorExposure:seen,pinyinMode:s.pinyinMode,purpose:s.purpose,diagnostic:s.diagnostic,materialHash:hash(c.material.text)});}
   s.questionActiveStart=s.activeMs;s.openQuestionAt=clock();persist();return current();
  }
  function start(ids,{day=null,purpose='practice',diagnostic=null,scopeDay=null}={}){
   if(!Array.isArray(ids)||!ids.length||ids.some(id=>!bank.has(id)))throw Error('课程材料不存在');
   if(courseScope&&new Set(ids.map(id=>bank.get(id)?.courseId)).size!==1)throw Error('不能把不同版本的课程材料混在同一次练习。');
   if(purpose==='optional-challenge'&&(day!==null||!inDayRange(scopeDay)||ids.some(id=>bank.get(id)?.day!==scopeDay||!practiceAllowed(bank.get(id)))))throw Error('挑战材料不在当前允许的范围内。');
   if(purpose==='unseen-choice'&&(day!==null||!inDayRange(scopeDay)||ids.length!==1||ids.some(id=>bank.get(id)?.day!==scopeDay||!practiceAllowed(bank.get(id))||exposure(id))))throw Error('未见材料不在当前允许的范围内。');
   if(diagnostic){const set=diagnostics.find(x=>x.id===diagnostic.setId),form=set?.forms.find(x=>x.id===diagnostic.formId),plan=rows('diagnostic_plan').some(e=>e.setId===diagnostic.setId&&e.formId===diagnostic.formId&&e.condition===diagnostic.condition&&!e.imported);if(!diagnosticAllowed(set)||!diagnosticReviewed(set)||!form||!plan||JSON.stringify(form.materials.map(m=>m.id))!==JSON.stringify(ids)||diagnostic.knowledgeConfirmed!==true)throw Error('诊断必须使用已分配的未见平行材料。');}
   if(state.session){pause();state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==state.session.id);state.suspendedSessions.push(clone(state.session));}
   const existing=!diagnostic&&state.suspendedSessions.find(s=>s.day===day&&s.purpose===purpose&&(s.scopeDay??null)===scopeDay&&JSON.stringify(s.materialIds)===JSON.stringify(ids));
   if(existing){state.session=clone(existing);state.suspendedSessions=state.suspendedSessions.filter(s=>s.id!==existing.id);resume();return current();}
   const session={id:writer+'-session-'+(++sequence),day,purpose,...(Number.isInteger(scopeDay)?{scopeDay}:{}),diagnostic:diagnostic?clone(diagnostic):null,materialIds:[...ids],materialIndex:0,questionIndex:0,panelIndex:0,openMaterialIds:[],priorExposure:{},drafts:{},activeMs:0,activeByDate:{},lastTick:clock(),paused:false,pinyinMode:diagnostic?diagnostic.condition==='B'?'all':'none':state.settings.pinyin,startedAt:clock(),questionActiveStart:0};
   state.session=session;append('session_start',{sessionId:session.id,day,purpose,diagnostic:session.diagnostic});if(purpose==='remediation'){const rec=recommend();if(rec.mathSignalId&&ids.includes(rec.materialId))append('remediation_assigned',{sessionId:session.id,mathSignalId:rec.mathSignalId,materialIds:ids});}return openCurrent();
  }
  function classifyAid(e){
   if(e.type==='material_open'&&aidKeys.has(e.pinyinMode))return 1;
   if(e.type==='answer_revealed')return 4;
   if(e.type==='speech_status'&&['requested','started','start'].includes(e.status))return 2;
   if(e.type!=='aid_requested')return 0;
   if(e.kind==='pinyin')return 1;if(e.kind==='parent')return 3;if(voiceKinds.has(e.kind))return 2;return 0;
  }
  function sharedPassageAid(e){
   if(e.type==='material_open')return true;
   if(e.type==='aid_requested')return ['pinyin','parent','story','sentence','word','character'].includes(e.kind)||e.kind==='repeat'&&['story','sentence','word','character'].includes(e.originKind);
   return e.type==='speech_status'&&['story','sentence','word','character'].includes(e.originKind||e.kind);
  }
  function aidState(materialId,sessionId=null){const relevant=state.events.filter(e=>e.materialId===materialId&&(!sessionId||e.sessionId===sessionId)||!sessionId&&e.materialId!==materialId&&samePassage(materialId,e.materialId)&&sharedPassageAid(e));let level=0,pinyin=false,voice=false,parent=false,revealed=false,hint=false,exploration=false;
   for(const e of relevant){const n=classifyAid(e);level=Math.max(level,n);pinyin||=n===1;voice||=n===2;parent||=n===3;revealed||=n===4;exploration||=e.type==='aid_requested'&&e.kind==='explore';hint||=e.type==='aid_requested'&&(e.kind==='feedback_hint'||e.kind==='explore');}
   return {level,pinyinEver:pinyin,voiceEver:voice,parentEver:parent,answerExposed:revealed,feedbackHintEver:hint,explorationEver:exploration};
  }
  function requestAid(kind,detail={}){const c=current();if(!c)return false;touch();
   if(kind==='pinyin'&&MODES.includes(detail.mode))state.session.pinyinMode=detail.mode;
   append('aid_requested',{...detail,kind,sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,condition:c.session.diagnostic?.condition||null});return true;
  }
  function speechStatus(info={}){const c=current(),status=info.state||info.status;if(!c||typeof status!=='string')return false;
   const scoped=typeof info.requestId==='string'&&info.requestId.length>0;
   // Async callbacks must stay attached to the question/session that requested
   // them; a late callback must not establish evidence for a newer context.
   if(scoped&&(!shortString(info.requestId,200)||info.sessionId!==c.session.id||info.materialId!==c.material.id||info.questionId!==c.question.id))return false;
   const materialId=info.materialId||c.material.id;if(!bank.has(materialId))return false;
   const voice=typeof info.voice==='string'?info.voice:info.voice&&typeof info.voice==='object'?{name:String(info.voice.name||''),lang:String(info.voice.lang||''),localService:info.voice.localService===true}:null;
   append('speech_status',{sessionId:info.sessionId||c.session.id,materialId,questionId:info.questionId||c.question.id,status,kind:info.kind||'voice',spokenText:String(info.spokenText||info.text||'').slice(0,2000),voice,...(scoped?{requestId:info.requestId,originKind:info.originKind||info.kind||'voice',startedBy:info.startedBy||null}:{})});return true;
  }
  // A request must contain the actual original text, and the matching browser
  // onstart callback must have happened before the answer being evaluated.
  // Browser onstart is not proof of audibility, completion or comprehension.
  function originalStoryStarted(sessionId,material,cutoff=state.events.length){
   if(!material)return false;const prior=state.events.slice(0,cutoff);
   for(let i=0;i<prior.length;i++){const request=prior[i];
    if(request.type!=='aid_requested'||request.sessionId!==sessionId||request.materialId!==material.id||!request.requestId||request.requestedText!==material.text||!(request.kind==='story'||request.kind==='repeat'&&request.originKind==='story'))continue;
    if(prior.slice(i+1).some(e=>e.type==='speech_status'&&e.status==='started'&&e.startedBy==='onstart'&&e.sessionId===sessionId&&e.materialId===material.id&&e.questionId===request.questionId&&e.requestId===request.requestId&&e.originKind==='story'))return true;
   }return false;
  }
  function setting(name,value){if(!['pinyin','rate','remoteVoiceConsent','knownMath','dayRange'].includes(name))return false;
   if(name==='pinyin'&&!MODES.includes(value))return false;if(name==='rate'&&![.65,.85,1].includes(Number(value)))return false;
   if(name==='remoteVoiceConsent'&&typeof value!=='boolean')return false;if(name==='knownMath'&&(!Array.isArray(value)||value.some(x=>typeof x!=='string'||x.length>80)||value.length>100))return false;
   if(name==='dayRange'&&!validDayRange(value))return false;
   state.settings[name]=name==='rate'?Number(value):clone(value);append('setting',{name,value:state.settings[name]});
   if(name==='pinyin'&&state.session){state.session.pinyinMode=value;if(aidKeys.has(value))requestAid('pinyin',{mode:value});else persist();}return true;
  }
  function validAnswer(q,value){if(extraTypes.has(q.type))return validExtraDraft(q,value,true);if(q.type==='departure')return validDepartureAnswer(q,value);if(q.type==='route')return validRouteDraft(q,value,true);if(q.type==='cargo')return validCargoDraft(q,value,true);if(q.type==='match')return validMatchDraft(q,value,true);if(q.type==='order')return Array.isArray(value)&&value.length===q.options.length&&new Set(value).size===value.length&&value.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);return Number.isInteger(value)&&value>=0&&value<q.options.length;}
  function select(value){const c=current();if(!c||state.session.paused)return false;let ok;if(extraTypes.has(c.question.type))ok=validExtraDraft(c.question,value);else if(c.question.type==='route')ok=validRouteDraft(c.question,value);else if(c.question.type==='cargo')ok=validCargoDraft(c.question,value);else if(c.question.type==='match')ok=validMatchDraft(c.question,value);else if(c.question.type==='order')ok=Array.isArray(value)&&value.length<=c.question.options.length&&new Set(value).size===value.length&&value.every(i=>Number.isInteger(i)&&i>=0&&i<c.question.options.length);else ok=validAnswer(c.question,value);
   if(!ok)return false;touch();state.session.drafts[c.question.id]=clone(value);persist();return true;
  }
  function diagnosticValidity(c,aid){const dx=c.session.diagnostic;if(!dx)return {eligible:false,reason:'普通练习'};if(c.session.restoredFromBackup)return {eligible:false,reason:'本次对照从备份恢复，跨设备独立性尚未核验'};
   if(c.question.metadataStatus==='unreviewed')return {eligible:false,reason:'题目分类尚未审校，暂不计入诊断对照'};
   if(dx.knowledgeConfirmed!==true)return {eligible:false,reason:'数学先修知识未确认'};
   if(c.session.priorExposure[c.material.id]||rows('attempt',c.question.id).length)return {eligible:false,reason:'材料或题目已经见过'};
   if(aid.answerExposed||aid.feedbackHintEver)return {eligible:false,reason:'本材料已经看过答案、讲解或针对性提示'};
   const actualSpeech=originalStoryStarted(c.session.id,c.material);
   if(dx.condition==='A'&&aid.level>0)return {eligible:false,reason:'无辅助条件受到污染'};
   if(dx.condition==='B'&&(aid.voiceEver||aid.parentEver))return {eligible:false,reason:'拼音条件使用了听读或家长帮助'};
   if(dx.condition==='C'&&(aid.pinyinEver||aid.parentEver||!actualSpeech))return {eligible:false,reason:'原文朗读未确认开始，或使用了拼音／家长帮助'};
   if(dx.condition==='D'&&(aid.pinyinEver||aid.voiceEver||!aid.parentEver))return {eligible:false,reason:'家长代读未记录，或请求过系统朗读或显示过拼音'};
   return {eligible:true,reason:'未见材料、先修确认和指定辅助条件完整；仍需多次对照'};
  }
  function submit(value){const c=current();if(!c||state.session.paused)return null;const q=c.question;if(value===undefined)value=state.session.drafts[q.id];if(!validAnswer(q,value))return null;touch();
   const prior=rows('attempt',q.id),aid=aidState(c.material.id),practiceAid=aidState(c.material.id,c.session.id),correct=extraTypes.has(q.type)?extraCorrect(q,value):q.type==='route'?routeCorrect(q,value):q.type==='cargo'?cargoCorrect(q,value):JSON.stringify(value)===JSON.stringify(q.answer),validity=diagnosticValidity(c,aid);
   const row=append('attempt',{sessionId:c.session.id,questionId:q.id,materialId:c.material.id,materialHash:hash(c.material.text),questionHash:hash(JSON.stringify(q)),pinyinHash:data.pinyinHash||null,day:c.session.day??c.material.day??null,week:c.material.week||c.session.diagnostic?.week||0,category:q.category,ability:q.ability,errorType:q.errorType,...(q.metadataStatus==='unreviewed'?{metadataStatus:'unreviewed'}:{}),targetWords:q.targetWords?.length?q.targetWords:c.material.focusWords||[],tags:c.material.tags||[],prerequisitesConfirmed:c.session.diagnostic?.knowledgeConfirmed===true||known(c.material),selected:clone(value),correct,first:prior.length===0,attemptNumber:prior.length+1,aidLevel:aid.level,practiceAidLevel:practiceAid.level,pinyinEver:aid.pinyinEver,voiceEver:aid.voiceEver,parentEver:aid.parentEver,answerExposed:aid.answerExposed,feedbackHintEver:aid.feedbackHintEver,practiceFeedbackHintEver:practiceAid.feedbackHintEver,...(aid.explorationEver?{explorationEver:true}:{}),priorExposure:c.session.priorExposure[c.material.id]===true,independent:prior.length===0&&aid.level===0&&!aid.feedbackHintEver&&!c.session.priorExposure[c.material.id]&&!c.session.restoredFromBackup,purpose:c.session.purpose,diagnostic:c.session.diagnostic,diagnosticValidity:validity,activeMs:Math.max(0,state.session.activeMs-state.session.questionActiveStart),imported:c.session.restoredFromBackup===true});
   delete state.session.drafts[q.id];persist();return row;
  }
  function markReadDone(){const c=current();if(!c||c.session.paused||c.session.diagnostic)return false;if(state.events.some(e=>e.type==='reading_phase_complete'&&e.sessionId===c.session.id&&e.materialId===c.material.id))return false;touch();const activeMs=Math.max(0,state.session.activeMs-(state.session.readActiveStarts?.[c.material.id]||0));append('reading_phase_complete',{sessionId:c.session.id,materialId:c.material.id,activeMs,characters:Array.from(c.material.text).filter(ch=>/[\u3400-\u9fff]/u.test(ch)).length,aidLevel:aidState(c.material.id).level,method:'self-reported-read-button-interval'});return true;}
  function reveal(){const c=current();if(!c)return false;
   if(c.session.diagnostic){if(c.material.questions.some(q=>!rows('attempt',q.id).some(a=>a.sessionId===c.session.id)))return false;
    for(const q of c.material.questions)if(!state.events.some(e=>e.type==='answer_revealed'&&e.sessionId===c.session.id&&e.questionId===q.id))append('answer_revealed',{sessionId:c.session.id,materialId:c.material.id,questionId:q.id,kind:'explanation'});
    return true;
   }append('answer_revealed',{sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,kind:'explanation'});return true;}

  function panel(index){const c=current();if(!c||!Number.isInteger(index)||index<0||index>=c.material.panels.length)return false;state.session.panelIndex=index;touch();persist();return true;}
  function next(){const c=current();if(!c||!rows('attempt',c.question.id).some(e=>e.sessionId===c.session.id))return false;touch();const s=state.session;
   if(s.questionIndex+1<c.material.questions.length)s.questionIndex++;else if(s.materialIndex+1<s.materialIds.length){s.materialIndex++;s.questionIndex=0;s.panelIndex=0;}else{const complete={sessionId:s.id,day:s.purpose==='optional-challenge'?null:s.day,purpose:s.purpose,diagnostic:s.diagnostic,activeMs:s.activeMs,activeByDate:s.activeByDate||{},...(courseScope?{courseId:sessionCourse(s)}:{})};state.session=null;append('session_complete',complete);return 'complete';}
   openCurrent();return true;
  }
  function allFirstRows(){const seen=new Set();return clone(rows('attempt').filter(e=>{const d=qs.get(e.questionId);if(!d||e.questionHash!==hash(JSON.stringify(d.q))||e.materialHash!==hash(d.m.text)||seen.has(e.questionId))return false;seen.add(e.questionId);return true;}));}
  function firstRows(){return allFirstRows().filter(e=>activeMaterial(qs.get(e.questionId)?.m));}
  function due(){const list=[];for(const m of data.materials){if(!activeMaterial(m))continue;for(const q of m.questions){const a=rows('attempt',q.id).filter(e=>e.materialHash===hash(m.text)&&e.questionHash===hash(JSON.stringify(q)));if(!a.length)continue;const retention=a[0].correct&&a[0].aidLevel===0&&!a[0].feedbackHintEver&&!a[0].priorExposure&&!a[0].imported;
    const practiceDays=new Set(a.filter(e=>e.correct&&e.practiceAidLevel===0&&!e.practiceFeedbackHintEver&&!e.imported&&e.at>a[0].at&&localDate(e.at)!==localDate(a[0].at)).map(e=>localDate(e.at))).size;const intervals=retention?[7,14,28]:[1,3,7,14];if(practiceDays>=intervals.length)continue;
    const last=a[a.length-1],interval=intervals[practiceDays],dueAt=last.at+interval*DAY;if(clock()>=dueAt)list.push({materialId:m.id,questionId:q.id,errorType:q.errorType,dueAt,reviewLevel:practiceDays});
   }}return list.sort((a,b)=>a.dueAt-b.dueAt||a.questionId.localeCompare(b.questionId));}
  // Unreviewed prerequisites permit practice, but are not evidence of prior knowledge.
  const known=m=>!!m&&m.prerequisitesStatus!=='unreviewed'&&(m.prerequisites||[]).every(k=>state.settings.knownMath.includes(k));
  const practiceAllowed=m=>!!m&&(m.prerequisitesStatus==='unreviewed'||known(m));
  function weekReadiness(){const first=firstRows().filter(a=>a.metadataStatus!=='unreviewed'&&!optionalMaterials.has(a.materialId)&&!a.imported&&!a.answerExposed&&!a.feedbackHintEver&&!a.priorExposure);return Array.from({length:12},(_,i)=>{const week=i+1,all=first.filter(a=>a.week===week),reading=all.filter(a=>a.category!=='math'&&a.aidLevel<=1),extraction=all.filter(a=>a.category==='math'&&['conditions','model'].includes(a.ability)&&a.aidLevel<=1&&a.prerequisitesConfirmed),L0=reading.filter(a=>a.aidLevel===0),readingRate=reading.length?reading.filter(a=>a.correct).length/reading.length:0,mathRate=extraction.length?extraction.filter(a=>a.correct).length/extraction.length:0,needL0=week<=3?0:week<=6?3:week<=9?5:8,dates=new Set([...reading,...extraction].map(a=>localDate(a.at))).size;
    const possible=data.materials.filter(m=>activeMaterial(m)&&m.week===week&&!optionalMaterials.has(m.id)).flatMap(m=>m.questions),reviewed=possible.filter(q=>q.metadataStatus!=='unreviewed');
    const unreviewedCount=possible.length-reviewed.length,readingPossible=reviewed.filter(q=>q.category==='reading'||q.category==='literacy').length,extractionPossible=reviewed.filter(q=>q.category==='math'&&['conditions','model'].includes(q.ability)).length;
    const evaluable=!(courseScope&&unreviewedCount&&(readingPossible<10||extractionPossible<3));
    if(!evaluable)return {week,ready:false,evaluable:false,reason:'本周题目分类尚未完成审校，暂不做周准入评定；可以继续学习。',samples:all.length,dates,reading:ratio(reading),extraction:ratio(extraction),L0:ratio(L0),thresholds:{readingItems:10,readingAccuracy:.75,extractionItems:3,extractionAccuracy:.75,L0Items:needL0,L0Accuracy:needL0?.7:null,learningDates:2},confidence:'分类待审，暂不评级'};
    const ready=reading.length>=10&&readingRate>=.75&&extraction.length>=3&&mathRate>=.75&&L0.length>=needL0&&(!needL0||L0.filter(a=>a.correct).length/L0.length>=.7)&&dates>=2;
    const reason=reading.length<10?'需积累至少10道无语音、无家长帮助的新材料首答。':readingRate<.75?'阅读首答尚未达到本周75%的观察标准，先补强常见错因。':extraction.length<3?'需积累至少3道先修已确认的条件提取或建模新题。':mathRate<.75?'数学文字条件提取尚不稳定，先补充语言任务；不降低数学主线。':L0.length<needL0?'本阶段还需要更多新材料的无拼音首答；家长可逐步减少辅助，不强制撤掉。':needL0&&L0.filter(a=>a.correct).length/L0.length<.7?'无拼音新材料首答还需巩固。':dates<2?'需要至少两个学习日期的观察，不能凭一次集中作答决定进阶。':'本周任务证据达到观察门槛，可尝试更长文字，并继续用未见材料核实。';
    return {week,ready,reason,samples:all.length,dates,reading:ratio(reading),extraction:ratio(extraction),L0:ratio(L0),thresholds:{readingItems:10,readingAccuracy:.75,extractionItems:3,extractionAccuracy:.75,L0Items:needL0,L0Accuracy:needL0?.7:null,learningDates:2},confidence:ready?'训练内观察达标，非固定能力标签':'证据不足或尚需补强'};});}
  function navigation(){const range=state.settings.dayRange||{start:1,end:84},completed=new Set(rows('session_complete').filter(e=>e.day&&activeCompletion(e)).map(e=>e.day)),calendar=data.lessons.find(l=>inDayRange(l.day)&&!completed.has(l.day))?.day||range.end,week=Math.ceil(calendar/7),readiness=weekReadiness();const held=readiness.find(r=>r.week<week&&r.evaluable!==false&&!r.ready&&r.week*7>=range.start);return {calendar,day:Math.max(range.start,Math.min(range.end,held?held.week*7:calendar)),held};}
  function challenge(){
   // Consecutive means the last three actual first attempts, not three
   // successes filtered out of a longer sequence. Language assistance may
   // inform a practice suggestion, but never changes the independence of the
   // underlying first answer. Hints, revealed answers and prior exposure do
   // not qualify; no mastery is awarded.
   const recent=firstRows().filter(a=>a.metadataStatus!=='unreviewed'&&!optionalMaterials.has(a.materialId)).slice(-3);
   if(recent.length<3||recent.some(a=>!a.correct||!a.first||a.imported||a.diagnostic||a.feedbackHintEver||a.answerExposed||a.priorExposure||!a.prerequisitesConfirmed))return {eligible:false,materialId:null};
   const baseline=bank.get(recent[recent.length-1].materialId);
   if(!baseline||!Number.isFinite(baseline.difficulty))return {eligible:true,materialId:null};
   const originalPrerequisites=new Set(baseline.prerequisites||[]);
   const candidates=data.materials.filter(m=>activeMaterial(m)&&!optionalMaterials.has(m.id)&&m.kind===baseline.kind&&inMaterialRange(m)&&known(m)&&!exposure(m.id)&&
    Number.isFinite(m.difficulty)&&m.difficulty>baseline.difficulty&&
    (m.prerequisites||[]).every(k=>originalPrerequisites.has(k)));
   candidates.sort((a,b)=>a.difficulty-b.difficulty||a.day-b.day||a.id.localeCompare(b.id));
   const candidate=candidates[0];
   return {eligible:true,materialId:candidate?.id||null,day:candidate?.day||null,title:candidate?.title||null,goal:candidate?.goal||null};
  }
  function startChallenge(){
   const offer=challenge();if(!(writeStatus==='ready'||writeStatus==='acquiring'&&persistence)||!offer.materialId||!inDayRange(offer.day))return null;
   // Keep day null so an older reader or rollback cannot mistake this single
   // optional passage for completion of the whole calendar day.
   return start([offer.materialId],{day:null,scopeDay:offer.day,purpose:'optional-challenge'});
  }
  function dailyOptional(day){if(!inDayRange(day))return null;const lesson=data.lessons.find(l=>l.day===day),id=lesson?.optionalIds?.[0],m=bank.get(id);if(!m||!activeMaterial(m)||!practiceAllowed(m))return null;return {materialId:m.id,day,title:m.title||'',priorExposure:exposure(m.id)};}
  function startDailyOptional(day){const offer=dailyOptional(day);if(!(writeStatus==='ready'||writeStatus==='acquiring'&&persistence)||!offer)return null;return start([offer.materialId],{day:null,scopeDay:day,purpose:'optional-challenge'});}
  function recommend(){const nav=navigation(),wrong=firstRows().filter(a=>a.metadataStatus!=='unreviewed'&&!a.correct&&(!nav.held||a.week<=nav.held.week)),counts=Object.create(null);for(const r of wrong)counts[r.errorType]=(counts[r.errorType]||0)+1;const usedSignals=new Set(rows('remediation_assigned').map(e=>e.mathSignalId));const signal=rows('math_reading_signal').slice().reverse().find(e=>e.reason!=='math'&&!usedSignals.has(e.id));const errorType=signal?({character:'character',sentence:'sentence',conditions:'information',uncertain:'information'})[signal.reason]||null:Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0]||null;
   const available=data.materials.filter(m=>activeMaterial(m)&&!optionalMaterials.has(m.id)&&inMaterialRange(m)&&!exposure(m.id)&&practiceAllowed(m)&&(!nav.held||m.week<=nav.held.week)),matched=errorType&&available.find(m=>m.kind==='reserve'&&m.questions.some(q=>q.metadataStatus!=='unreviewed'&&q.errorType===errorType)),candidate=matched||available.find(m=>m.kind==='reserve')||available[0];
   const reason=signal&&matched?'根据数学读题时的自报困难推荐对应语言补强；这是支持线索，不改写数学能力。':nav.held?nav.held.reason:matched?'按多次首答错误安排对应阅读补强；错误类别是线索，需要新材料核实。':signal?'已记录数学读题时的自报困难；现有材料尚无已审校的对应分类，可自由选择练习。':'先读短篇材料，逐步积累独立证据；数学主线保持原进度。';
   return {materialId:candidate?.id||null,errorType:matched?errorType:null,mathSignalId:matched?signal?.id||null:null,fromMathTaskId:matched?signal?.mathTaskId||null:null,stageReady:!nav.held,nextWeek:nav.held?nav.held.week:Math.min(12,Math.ceil(nav.calendar/7)),reason};
  }
  function transfer(){const tags=new Set(firstRows().filter(a=>a.category==='math').slice(-8).flatMap(a=>a.tags||[]));const available=data.materials.filter(m=>activeMaterial(m)&&m.kind==='math'&&inMaterialRange(m)&&!exposure(m.id)&&known(m));return available.find(m=>m.tags.some(t=>tags.has(t)))||available[0]||null;}
  function freshDayCandidate(day){if(!inDayRange(day))return null;const lesson=data.lessons.find(x=>x.day===day);if(!lesson)return null;return [...lesson.coreIds,...lesson.reserveIds].map(id=>bank.get(id)).find(m=>m&&m.day===day&&practiceAllowed(m)&&!exposure(m.id))||null;}
  function startFreshDayChoice(day){const m=freshDayCandidate(day);if(!(writeStatus==='ready'||writeStatus==='acquiring'&&persistence)||!m)return null;return start([m.id],{day:null,scopeDay:day,purpose:'unseen-choice'});}
  function startDay(day){if(!inDayRange(day))return null;const l=data.lessons.find(x=>x.day===day);if(!l)return null;const queue=due().filter(x=>inMaterialRange(bank.get(x.materialId))),nav=navigation(),rec=nav.held&&day===nav.day?recommend():null;
   const isDueReview=!rec?.materialId&&l.kind==='review'&&queue.length>0;
   const ids=rec?.materialId?[rec.materialId]:l.kind==='light'?l.coreIds.slice(0,1):isDueReview?[...new Set(queue.map(x=>x.materialId))].slice(0,2):l.coreIds;
   // A scheduled review can still complete its calendar day, as in the
   // existing course, but its purpose and material provenance stay explicit.
   // A separately chosen unseen passage never completes the calendar day.
   const result=start(ids,{day,scopeDay:isDueReview?day:null,purpose:rec?.materialId?'readiness-review':isDueReview?'review':l.kind||'practice'});if(nav.held){state.session.adaptive={heldWeek:nav.held.week,reason:nav.held.reason,explicitSelection:day!==nav.day};persist();}return result;
  }
  function nextDay(){return navigation().day;}
  function startDiagnostic(setId,knowledgeConfirmed){const set=diagnostics.find(s=>s.id===setId&&diagnosticAllowed(s));if(!set)return {ok:false,reason:'诊断套题不存在。'};if(knowledgeConfirmed!==true)return {ok:false,reason:'请家长先确认本组数学知识已经掌握。'};
   if(!diagnosticReviewed(set))return {ok:false,reason:'本套题目分类尚未审校，暂不用于诊断对照。'};
   const used=rows('diagnostic_plan').filter(e=>e.setId===setId),form=set.forms.find(f=>!used.some(e=>e.formId===f.id)&&f.materials.every(m=>!exposure(m.id)));
   if(!form)return {ok:false,reason:'本套四份材料已经使用，不能重记为未见诊断；请保留结果并换新的套题。'};
   const rotation=(set.week||0)%4,condition=['A','B','C','D'][(set.forms.indexOf(form)+rotation)%4],diagnostic={setId,formId:form.id,condition,week:set.week,knowledgeConfirmed:true,blueprint:clone(set.blueprint)};
   append('diagnostic_plan',{setId,formId:form.id,condition,blueprint:set.blueprint,knowledgeConfirmed:true});start(form.materials.map(m=>m.id),{purpose:'diagnostic',diagnostic});return {ok:true,condition,setId,formId:form.id};
  }
  function mathSignal(task,reason){if(!task||!['character','sentence','conditions','math','uncertain'].includes(reason))return false;append('math_reading_signal',{mathTaskId:String(task.id||''),mathSkillId:String(task.skillId||''),mathContentVersion:task.contentVersion??null,reason,source:'learner-or-parent-self-report',statement:'不修改数学得分、原始首答、已学知识或掌握状态。'});return true;}
  const ratio=a=>({correct:a.filter(x=>x.correct).length,total:a.length});
  // Reinterpret only diagnostic comparison eligibility when historic D aids or
  // C audio provenance cannot be verified. Keep original events unchanged.
  function reportDiagnosticValidity(a){
   if(!a.diagnosticValidity?.eligible)return a.diagnosticValidity||{eligible:false,reason:'条件不完整'};
   if(a.diagnostic?.condition==='D'&&(!a.parentEver||a.voiceEver||a.pinyinEver))return {eligible:false,reason:'家长代读未记录，或请求过系统朗读或显示过拼音'};
   if(a.diagnostic?.condition==='C'){const index=state.events.findIndex(e=>e.id===a.id);if(index<0||!originalStoryStarted(a.sessionId,bank.get(a.materialId),index))return {eligible:false,reason:'历史事件无法核实同次原文朗读开始，暂不计入 C 组对照'};}
   return a.diagnosticValidity;
  }
  function historicalDiagnosticReport(first){
   if(!courseScope)return [];
   return diagnostics.filter(set=>legacyCourses.has(set.courseId)).map(set=>{
    // A first answer belongs to its original question and content version.
    // Repeated answers and a newer release never create another first answer.
    const answers=first.filter(a=>a.diagnostic?.setId===set.id&&set.forms.some(f=>f.id===a.diagnostic.formId&&f.materials.some(m=>m.id===a.materialId)));
    const versions=[...new Set(answers.map(a=>a.contentHash))].map(contentHash=>{
     const evidence=answers.filter(a=>a.contentHash===contentHash),conditions={};
     for(const condition of ['A','B','C','D']){
      const selected=evidence.filter(a=>a.diagnostic.condition===condition);
      conditions[condition]={first:ratio(selected),conditionCompleteFirst:ratio(selected.filter(a=>!a.imported&&reportDiagnosticValidity(a).eligible)),importedFirst:selected.filter(a=>a.imported).length};
     }
     return {contentHash,currentContentVersion:contentHash===data.contentHash,first:ratio(evidence),conditions};
    });
    return {setId:set.id,courseId:set.courseId,week:set.week,versions};
   });
  }
  function report(){const first=firstRows(),all=rows('attempt').filter(activeEvent),complete=rows('session_complete').filter(activeCompletion),history=allFirstRows().filter(e=>!activeMaterial(qs.get(e.questionId)?.m)),levels=[0,1,2,3].map(level=>({level,...ratio(first.filter(a=>a.aidLevel===level&&!a.feedbackHintEver))}));
   const eligible=first.filter(a=>a.metadataStatus!=='unreviewed'&&!optionalMaterials.has(a.materialId)&&a.diagnostic&&reportDiagnosticValidity(a).eligible&&!a.imported&&a.contentHash===data.contentHash),conditions={};for(const condition of ['A','B','C','D'])conditions[condition]=ratio(eligible.filter(a=>a.diagnostic.condition===condition));
   const matchedSets=Object.create(null);for(const a of eligible){const g=matchedSets[a.diagnostic.setId]??={blueprint:a.diagnostic.blueprint,conditions:{}};(g.conditions[a.diagnostic.condition]??=[]).push({questionId:a.questionId,correct:a.correct,category:a.category,ability:a.ability});}
   const errors=Object.create(null),words=Object.create(null);for(const a of first.filter(x=>x.metadataStatus!=='unreviewed'&&!optionalMaterials.has(x.materialId))){if(!a.correct)errors[a.errorType]=(errors[a.errorType]||0)+1;for(const word of a.targetWords||[]){const w=words[word]??={word,correct:0,total:0,independentCorrect:0,evidenceIds:[],dates:[]};w.total++;if(a.correct)w.correct++;if(a.correct&&a.independent&&a.category==='literacy'&&a.ability==='recognition'&&!a.imported){w.independentCorrect++;w.evidenceIds.push(a.questionId);w.dates.push(localDate(a.at));}}}
   const vocabulary=Object.values(words).map(w=>({...w,status:new Set(w.evidenceIds).size>=3&&new Set(w.dates).size>=2?'跨材料稳定表现':'继续观察',scope:'任务内字词表现，非标准化识字量认证'}));
   const weeks=Array.from({length:12},(_,i)=>{const a=first.filter(x=>x.week===i+1);return {week:i+1,completedDays:new Set(complete.filter(e=>e.day&&Math.ceil(e.day/7)===i+1).map(e=>e.day)).size,first:ratio(a),L0:ratio(a.filter(x=>x.aidLevel===0&&!x.feedbackHintEver)),L1:ratio(a.filter(x=>x.aidLevel===1&&!x.feedbackHintEver)),L2:ratio(a.filter(x=>x.aidLevel===2&&!x.feedbackHintEver)),L3:ratio(a.filter(x=>x.aidLevel===3&&!x.feedbackHintEver)),explained:ratio(a.filter(x=>x.aidLevel===4))};});
   const sessionTimes=Object.create(null);for(const e of state.events.filter(x=>['session_pause','session_complete'].includes(x.type)&&activeEvent(x))){const p=sessionTimes[e.sessionId];if(!p||e.activeMs>=p.activeMs)sessionTimes[e.sessionId]={at:e.at,activeMs:e.activeMs||0,activeByDate:e.activeByDate||{}};}
   if(state.session&&(!courseScope||sessionCourse(state.session)===courseScope.activeCourseId))sessionTimes[state.session.id]={at:clock(),activeMs:state.session.activeMs,activeByDate:state.session.activeByDate||{}};const daily=Object.create(null);for(const s of Object.values(sessionTimes)){if(Object.keys(s.activeByDate).length){for(const [d,ms]of Object.entries(s.activeByDate))daily[d]=(daily[d]||0)+ms;}else{const d=localDate(s.at);daily[d]=(daily[d]||0)+s.activeMs;}}
   const signals=[{key:'character',label:'识字标签题的首答错误',count:errors.character||0},{key:'language',label:'词句标签题的首答错误',count:(errors.vocabulary||0)+(errors.sentence||0)},{key:'listening',label:'符合条件的听读对照题',count:conditions.C.total+conditions.D.total},{key:'conditions',label:'信息提取标签题的首答错误',count:errors.information||0},{key:'math',label:'关系或计算标签题的首答错误',count:(errors.relation||0)+(errors.calculation||0)},{key:'independent',label:'未见无辅助首答正确',count:first.filter(a=>a.correct&&a.independent&&!a.imported).length}];
   const classifiedFirst=first.filter(a=>a.metadataStatus!=='unreviewed'&&!optionalMaterials.has(a.materialId));
   const supportEvidence={interpretation:'题目标签不等于孩子答错的原因；先看首答与求助事实，再用多份未见材料核对。未审校题不进入分类统计。',unreviewedFirst:ratio(first.filter(a=>a.metadataStatus==='unreviewed')),byCategory:['reading','math','literacy'].map(category=>({category,first:ratio(classifiedFirst.filter(a=>a.category===category)),independent:ratio(classifiedFirst.filter(a=>a.category===category&&a.independent&&!a.imported)),assistedFirst:ratio(classifiedFirst.filter(a=>a.category===category&&a.aidLevel>0&&!a.imported)),imported:classifiedFirst.filter(a=>a.category===category&&a.imported).length})),wrongFirst:classifiedFirst.filter(a=>!a.correct).map(a=>({questionId:a.questionId,materialId:a.materialId,category:a.category,itemTag:a.errorType,aidLevel:a.aidLevel,prerequisitesConfirmed:a.prerequisitesConfirmed,imported:a.imported,at:a.at})),causeConfirmed:false};
   const observations=rows('reading_phase_complete').filter(e=>activeEvent(e)&&!e.imported&&bank.has(e.materialId)&&finite(e.activeMs)&&finite(e.characters));const readingPace={method:'self-reported-read-button-interval',caution:'按钮前的前台活动时间包含思考，不是标准化阅读速度；诊断不计此指标。',observations:clone(observations),byAidLevel:[0,1,2,3,4].map(level=>{const a=observations.filter(e=>e.aidLevel===level&&e.activeMs>0),characters=a.reduce((n,e)=>n+e.characters,0),activeMs=a.reduce((n,e)=>n+e.activeMs,0);return {level,observations:a.length,characters,activeMs,charactersPerMinute:activeMs?Math.round(characters*60000/activeMs):null};})};const tapped=Object.create(null);for(const e of rows('aid_requested').filter(e=>activeEvent(e)&&e.kind==='pinyin'&&typeof e.character==='string'))tapped[e.character]=(tapped[e.character]||0)+1;const tappedCharacters=Object.entries(tapped).map(([character,requests])=>({character,requests})).sort((a,b)=>b.requests-a.requests);
   const storyReadDays=new Set(rows('reading_phase_complete').filter(activeEvent).map(e=>bank.get(e.materialId)).filter(m=>m?.kind==='story'&&Number.isInteger(m.day)&&m.day>=1&&m.day<=84).map(m=>m.day)).size;
   return {historicalDiagnostics:historicalDiagnosticReport(history),historical:courseScope?{first:ratio(history),completedDays:new Set(rows('session_complete').filter(e=>e.day&&!activeCompletion(e)).map(e=>e.day)).size,interpretation:'历史课程单独保留，不计入当前课程。'}:null,storyReadDays,hintedFirst:ratio(first.filter(a=>a.feedbackHintEver)),supportEvidence,diagnosticExcluded:first.filter(a=>a.diagnostic&&(!reportDiagnosticValidity(a).eligible||a.imported||a.contentHash!==data.contentHash)).map(a=>({questionId:a.questionId,setId:a.diagnostic.setId,condition:a.diagnostic.condition,reason:a.imported?'导入证据独立性未核验':a.contentHash!==data.contentHash?'旧版本对照保留历史，不与本版本辅助条件混算':reportDiagnosticValidity(a).reason||'条件不完整',aidLevel:a.aidLevel})),readingPace,tappedCharacters,contentHash:data.contentHash,first:ratio(first),retries:Math.max(0,all.filter(e=>qs.has(e.questionId)&&e.questionHash===hash(JSON.stringify(qs.get(e.questionId).q))&&e.materialHash===hash(qs.get(e.questionId).m.text)).length-first.length),completedDays:new Set(complete.filter(e=>e.day).map(e=>e.day)).size,levels,explained:ratio(first.filter(a=>a.aidLevel===4)),conditions,matchedSets,weeks,readiness:weekReadiness(),errors,focusWords:vocabulary.filter(w=>w.status!=='跨材料稳定表现').sort((a,b)=>(b.total-b.correct)-(a.total-a.correct)).slice(0,20),vocabulary,due:due(),recommendation:recommend(),daily,signals,interpretation:'错误类型只是训练线索。需要在先修已确认、同蓝图、未见且辅助条件完整的多次对照中讨论可能原因；不能凭一次测验贴标签或把正确率差异当因果结论。',independenceCaution:'隐藏拼音不会清除已见拼音；已经看过的材料和已见讲解不计未见独立证据。',legacyCount:state.legacy.length,voiceRequests:state.events.filter(e=>activeEvent(e)&&e.type==='aid_requested'&&voiceKinds.has(e.kind)).length,voiceStarts:rows('speech_status').filter(e=>activeEvent(e)&&['started','start'].includes(e.status)).length,voiceFailures:rows('speech_status').filter(e=>activeEvent(e)&&['failed','error','blocked','no_voice','unsupported'].includes(e.status)).length,unverifiedImportedAttempts:first.filter(a=>a.imported).length,quarantinedAttempts:rows('attempt').filter(e=>!qs.has(e.questionId)||e.questionHash!==hash(JSON.stringify(qs.get(e.questionId).q))||e.materialHash!==hash(qs.get(e.questionId).m.text)).length,diagnosticCaution:'四份材料仅按设计蓝图匹配，尚未经过真实儿童样本等值检验。'};
  }
  function localDate(at){const d=new Date(at);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function backup(){const preserveBoth=['conflict','read_only','unsaved'].includes(writeStatus);let currentStoredRecord=null,currentStoredReadable=preserveBoth?true:null;if(preserveBoth)try{currentStoredRecord=storage.getItem(key)}catch(_){currentStoredReadable=false}
   const latestUpgrade=[...state.events].reverse().find(e=>e.type==='content_upgrade'&&typeof e.backupKey==='string'&&e.backupKey.startsWith(key+'_backup_before_content_')&&e.backupKey.length<=512);let upgradeOriginal=null,upgradeOriginalReadable=latestUpgrade?true:null;
   if(latestUpgrade)try{upgradeOriginal=storage.getItem(latestUpgrade.backupKey);if(upgradeOriginal===null)upgradeOriginalReadable=false}catch(_){upgradeOriginalReadable=false}
   return JSON.stringify({schema:'amc8-reading-r1-backup',exportedAt:clock(),contentHash:data.contentHash,reading:clone(state),unreadableOriginal:writeStatus==='read_only'?raw:null,currentStoredRecord,currentStoredReadable,baselineStoredRecord:preserveBoth&&raw!==currentStoredRecord&&writeStatus!=='read_only'?raw:null,upgradeOriginal,upgradeOriginalReadable,saveStatus:writeStatus},null,2);}

  function importBackup(text){if(['read_only','conflict'].includes(writeStatus))return {ok:false,reason:'当前处于记录保护状态，请先导出草稿并刷新核对，不能覆盖原记录。'};if(typeof text!=='string'||text.length>16000000)return {ok:false,reason:'备份格式或大小无效。'};let parsed;try{parsed=JSON.parse(text);}catch(_){return {ok:false,reason:'备份不是有效 JSON。'};}
   if(parsed.format==='tianle-record-backup-v1'&&parsed.reading)parsed={schema:'amc8-reading-r1-backup',reading:parsed.reading};
   if(parsed.schema==='tianle-reading-v2-backup'&&parsed.store?.version===2&&safeObject(parsed.store.answers)&&safeObject(parsed.store.review)&&safeObject(parsed.store.readingAids)){
    const encoded=JSON.stringify(parsed.store);if(encoded.length>4000000)return {ok:false,reason:'旧版记录过大。'};const digest=hash(encoded);if(!state.legacy.some(x=>x.digest===digest&&JSON.stringify(x.data)===encoded))state.legacy.push({digest,schema:parsed.schema,importedAt:clock(),data:clone(parsed.store),evidenceStatus:'legacy-unverified'});const saved=persist();return {ok:saved,saved,legacy:true,count:Object.keys(parsed.store.answers).length,reason:saved?undefined:'旧版记录已加入草稿，但尚未保存，请导出草稿。'};
   }
   if(parsed.schema!=='amc8-reading-r1-backup'||!valid(parsed.reading))return {ok:false,reason:'不支持的记录版本或结构，原记录没有被替换。'};
   const knownIds=new Map(state.events.map(e=>[e.id,e]));for(const e of parsed.reading.events){const old=knownIds.get(e.id);if(old){const comparable=clone(old);delete comparable.imported;const incoming=clone(e);delete incoming.imported;if(JSON.stringify(comparable)!==JSON.stringify(incoming))return {ok:false,reason:'同一事件出现冲突内容，已停止合并。'};}}
   let count=0;for(const e of parsed.reading.events)if(!knownIds.has(e.id)){state.events.push({...clone(e),imported:true});count++;}
   const restoredSessions=[],sessionsSkipped=[];
   const completed=new Set(rows('session_complete').map(e=>e.sessionId));
   const localSessions=new Set([state.session,...state.suspendedSessions].filter(Boolean).map(s=>s.id));
   for(const incoming of [parsed.reading.session,...(parsed.reading.suspendedSessions||[])].filter(Boolean)){
    if(localSessions.has(incoming.id)||completed.has(incoming.id))continue;
    if(parsed.reading.contentHash!==data.contentHash){sessionsSkipped.push({id:incoming.id,reason:'content_mismatch'});continue;}
    const restored=clone(incoming);restored.paused=true;restored.lastTick=clock();restored.restoredFromBackup=true;
    // Previous reading and assistance remain exposure, never fresh L0 evidence.
    for(const id of restored.openMaterialIds)restored.priorExposure[id]=true;
    if(!state.session)state.session=restored;else state.suspendedSessions.push(restored);
    localSessions.add(restored.id);restoredSessions.push(restored.id);
   }
   for(const legacy of parsed.reading.legacy||[])if(legacy?.digest&&!state.legacy.some(x=>x.digest===legacy.digest&&JSON.stringify(x.data)===JSON.stringify(legacy.data)))state.legacy.push(clone(legacy));
   const saved=persist();return {ok:saved,saved,count,merged:true,restoredSessions,sessionsSkipped,reason:saved?undefined:'记录已合并到草稿，但尚未保存，请导出草稿。',note:'保留本机课程；备份恢复的未完成课程暂停待续，不更改家长语音授权；外部独立性单独标记，数学记录不变。'};
  }
  function externalChange(){try{if(storage.getItem(key)!==raw){writeStatus='conflict';writeMessage='另一页面修改了阅读进度，请先导出本页草稿再合并。';}}catch(_){writeStatus='unsaved';writeMessage='暂时不能读取存储，请导出草稿。';}return {status:writeStatus,message:writeMessage};}
  return {unfinished,resumeSession,markReadDone,key,data,start,startDay,startFreshDayChoice,freshDayCandidate,startChallenge,challenge,dailyOptional,startDailyOptional,current,nextDay,select,submit,next,panel,pause,resume,touch,setting,requestAid,speechStatus,reveal,due,recommend,transfer,startDiagnostic,mathSignal,report,backup,importBackup,externalChange,exposure,known,firstRows,attempts,snapshot:()=>clone(state),status:()=>({status:writeStatus,message:writeMessage}),persist};
 }
 return {create,hash};
})();

/* Original, controllable vector scenes; no external images, microphones or network calls. */
window.ReadingComic=(()=>{
 'use strict';
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sceneNames={forest:'林间',school:'校园',home:'家中',garden:'花园',lab:'探索室',library:'图书角',park:'公园',station:'车站',workshop:'工作间',space:'太空想象'};
 const backgrounds={
  forest:'<path d="M0 185Q80 158 165 183T360 180V240H0Z" fill="#b9d9ad"/><g fill="#54886a"><path d="M15 165 42 55 70 165Z"/><path d="M282 160 314 42 347 160Z"/></g><g stroke="#7c6851" stroke-width="9"><path d="M42 145v55M314 143v53"/></g>',
  school:'<path d="M205 184V62h120v122" fill="#e9c28e"/><path d="M195 62 265 25 337 62" fill="#ad6e60"/><path d="M225 85h25v25h-25zm48 0h25v25h-25z" fill="#d8eef1"/><path d="M256 140h29v45h-29" fill="#8ab3b4"/>',
  home:'<path d="M20 183V67h120v116" fill="#e0d2b5"/><path d="M7 70 79 21 153 70" fill="#c68f7e"/><path d="M42 98h38v38H42Z" fill="#bae0e0"/><path d="M24 182h296" stroke="#a19279" stroke-width="7"/>',
  garden:'<path d="M0 187q80-38 180-1t180 0v54H0Z" fill="#c4dbaa"/><g fill="#688b58"><path d="M33 182v-35m0 17q-25 1-22-20 23-4 22 20m0-7q24-3 24-22-21 0-24 22M319 181v-40m0 17q-22-2-24-20 22-4 24 20"/></g><path d="M4 210h350" stroke="#b9b18a" stroke-width="4"/>',
  lab:'<path d="M18 180h324v13H18Z" fill="#a9b7b0"/><path d="M35 192v35m288-35v35" stroke="#7e928b" stroke-width="7"/><path d="M259 130v-35h23v35l14 28q-21 14-49 0Z" fill="#b3d8dd" stroke="#71989a" stroke-width="3"/><path d="M38 45h83v60H38Z" fill="#dae8dc"/><path d="M49 82 66 62l18 17 24-24" fill="none" stroke="#79a190" stroke-width="4"/>',
  library:'<path d="M16 39h95v145H16Zm233 0h95v145h-95Z" fill="#bca584"/><path d="M21 83h85M21 134h85m148-51h85m-85 51h85" stroke="#896f55" stroke-width="6"/><g stroke-width="12"><path d="M35 49v29m24-29v29m25-29v29m185-29v29m24-29v29m25-29v29" stroke="#8fa7b2"/><path d="M35 100v29m24-29v29m25-29v29m185-29v29m24-29v29m25-29v29" stroke="#b98e7d"/></g>',
  park:'<path d="M0 188q100-23 170 0t190-3v55H0Z" fill="#bfd3aa"/><path d="M260 134h73v13h-73zm-6 20h86v12h-86z" fill="#b99570"/><path d="M269 164v26m57-26v26" stroke="#826e58" stroke-width="5"/><path d="M22 160q-12-84 27-91 49 9 24 91" fill="#91b489"/><path d="M48 137v52" stroke="#8b735c" stroke-width="8"/>',
  station:'<path d="M0 204h360M0 215h360" stroke="#8c9b99" stroke-width="5"/><path d="M226 61h111v95H226Z" fill="#d5e4dd"/><path d="M218 61 281 30l65 31" fill="#89aaa3"/><path d="M271 85h33v34h-33Z" fill="#eff4e7"/><path d="M287 90v13l10 7" fill="none" stroke="#7a9991" stroke-width="3"/>',
  workshop:'<path d="M20 171h320v13H20Z" fill="#b9a07b"/><path d="M38 185v42m284-42v42" stroke="#8e785c" stroke-width="8"/><path d="M28 47h91v68H28Z" fill="#c4d6ca"/><path d="m50 58 23 42m17-42-23 42" stroke="#839c8c" stroke-width="6"/>',
  space:'<path d="M0 188q160-60 360 0v52H0Z" fill="#d2d4df"/><g fill="#fff7d9"><circle cx="30" cy="34" r="3"/><circle cx="87" cy="68" r="3"/><circle cx="312" cy="26" r="4"/><circle cx="272" cy="76" r="3"/></g><circle cx="293" cy="119" r="24" fill="#c4cfdb"/><path d="M250 123q44-17 85 0" fill="none" stroke="#a2b5cb" stroke-width="5"/>'
 };
 const props={
  basket:'<path d="M-20-1h40l-5 24h-30Z" fill="#d6af70" stroke="#997341" stroke-width="3"/><path d="M-14-1q0-25 28 0" fill="none" stroke="#997341" stroke-width="4"/>',
  book:'<path d="M-24-14q12-7 24 0 12-7 24 0v31q-12-5-24 1-12-6-24-1Z" fill="#f7f0d9" stroke="#6d969a" stroke-width="3"/><path d="M0-12v28" stroke="#6d969a" stroke-width="2"/>',
  seed:'<path d="M-18 18Q-33-7-10-22 19-37 25-7 20 23-5 26Z" fill="#af8056" stroke="#7c5a3d" stroke-width="3"/><path d="M-9 15Q8 0 10-14" fill="none" stroke="#d8b88d" stroke-width="3"/>',
  sprout:'<path d="M0 22V-2m0 8q-23-2-22-19 22-3 22 19m0-2q22-3 21-22Q1-18 0 4" fill="#6d9a69" stroke="#56865b" stroke-width="3"/>',
  robot:'<rect x="-21" y="-17" width="42" height="37" rx="9" fill="#8ebeb5" stroke="#527c78" stroke-width="3"/><circle cx="-8" cy="-3" r="3" fill="#284e4f"/><circle cx="8" cy="-3" r="3" fill="#284e4f"/><path d="M-8 9H8M0-17v-9" stroke="#527c78" stroke-width="3"/>',
  bridge:'<path d="M-34 18Q0-22 34 18M-34 7Q0-30 34 7" fill="none" stroke="#a58262" stroke-width="6"/><path d="M-23 2v14M0-8v14M23 2v14" stroke="#a58262" stroke-width="4"/>',
  map:'<path d="m-25-17 17 5 17-5 17 5v37l-17-5-17 5-17-5Z" fill="#efe1b3" stroke="#ad9563" stroke-width="3"/><path d="m-14 7 8-8L6 7l10-12" stroke="#91aa7b" fill="none" stroke-width="4"/>',
  clock:'<circle cy="2" r="23" fill="#f8f2de" stroke="#91a99a" stroke-width="4"/><circle cy="2" r="3" fill="#839a8d"/>',
  box:'<path d="m-24-9 24-12 25 12v31l-25 10-24-10Z" fill="#d4b186" stroke="#a37f57" stroke-width="3"/><path d="M-24-9 0 3 25-9M0 3v29" fill="none" stroke="#a37f57" stroke-width="3"/>',
  water:'<path d="M0-23q-35 40 0 46 35-6 0-46Z" fill="#a9d7e0" stroke="#6aa8ba" stroke-width="3"/>',
  paper:'<path d="M-20-25h27l15 14v39h-42Z" fill="#faf6e7" stroke="#a1b7aa" stroke-width="3"/><path d="M7-25v15h15M-10 2h22M-10 13h17" stroke="#b7c7ba" fill="none" stroke-width="3"/>',
  light:'<path d="M-12 10q-24-28 1-37 28-7 27 17-1 14-12 20v12h-16Z" fill="#f2da8e" stroke="#bba75f" stroke-width="3"/><path d="M-11 28h16" stroke="#82988c" stroke-width="5"/>',
  ball:'<circle r="24" fill="#d6a58b" stroke="#a77965" stroke-width="3"/><path d="M-23 0h46M0-23q-16 23 0 46M0-23q16 23 0 46" fill="none" stroke="#f2d5b5" stroke-width="3"/>',
  leaf:'<path d="M-22 22q-14-45 48-45 6 53-48 45Z" fill="#9bbe83" stroke="#6c965b" stroke-width="3"/><path d="m-23 23 40-39" stroke="#6c965b" stroke-width="3"/>',
  train:'<rect x="-32" y="-17" width="64" height="37" rx="8" fill="#8eb8bf" stroke="#6c989d" stroke-width="3"/><path d="M-22-8h44v13h-44Z" fill="#e6efde"/><path d="M-20 23h40" stroke="#6e8588" stroke-width="7"/>',
  tool:'<path d="m-12-25 12 11 13-11 7 14-13 12-7 26-12-4L-5-3-20-14Z" fill="#aab7b6" stroke="#7e9090" stroke-width="3"/>',
  umbrella:"<path d=\"M-48-54q48-61 96 0-13-12-25 0-12-12-23 0-12-12-24 0-12-12-24 0Z\" fill=\"#95b9c8\" stroke=\"#668b9c\" stroke-width=\"3\"/><path d=\"M0-87v96q0 14-11 12-8-2-7-11\" fill=\"none\" stroke=\"#866d58\" stroke-width=\"4\"/>",
  bell:"<path d=\"M-18 16q7-8 7-25 0-16 12-16 13 0 13 16 0 17 7 25Z\" fill=\"#d7be77\" stroke=\"#a18a51\" stroke-width=\"3\"/><path d=\"M-21 17h45M1-25v-9\" stroke=\"#a18a51\" stroke-width=\"4\"/><circle cx=\"1\" cy=\"21\" r=\"4\" fill=\"#a18a51\"/>",
  hat:"<path d=\"M-34 14h68l-11 9h-46Z\" fill=\"#cbac78\"/><path d=\"M-21 14V-13q21-24 42 0v27Z\" fill=\"#e3c48c\" stroke=\"#a88b5e\" stroke-width=\"3\"/>",
  glove:"<path d=\"M-16 25v-28l-10-12q-6-9 0-12 7-4 14 9v-24q1-9 6-7 5 0 5 8v12-20q4-8 9-1v25-19q5-7 9 0v23-14q7-7 10 2v33q-1 19-18 22Z\" fill=\"#cdafa0\" stroke=\"#9b7d70\" stroke-width=\"3\"/>",
  door:"<path d=\"M-28 34v-89h56v89Z\" fill=\"#d3b68c\" stroke=\"#8e785b\" stroke-width=\"4\"/><path d=\"M-19 34v-79h38v79\" fill=\"#f1dfb9\" stroke=\"#b29974\" stroke-width=\"2\"/><circle cx=\"10\" cy=\"-2\" r=\"3\" fill=\"#8e785b\"/>",
  none:"",
  boat:"<path d=\"M-43 5h86L24 27h-50Z\" fill=\"#d4c8ac\" stroke=\"#9d8d6c\" stroke-width=\"3\"/><path d=\"M-23 5 0-24 24 5Z\" fill=\"#f7edcf\" stroke=\"#b2a080\" stroke-width=\"3\"/>",
  windmill:"<path d=\"M0 9v43\" stroke=\"#9b8064\" stroke-width=\"6\"/><g fill=\"#91b8bd\" stroke=\"#658e97\" stroke-width=\"2\"><path d=\"M0 0-28-34 8-22Z\"/><path d=\"M0 0 34-28 22 8Z\"/><path d=\"M0 0 28 34-8 22Z\"/><path d=\"M0 0-34 28-22-8Z\"/></g><circle r=\"5\" fill=\"#d7be7b\"/>",
  scissors:"<path d=\"m-12 9 24-42M12 9-24-42\" stroke=\"#9aa9aa\" stroke-width=\"7\"/><circle cx=\"-17\" cy=\"18\" r=\"10\" fill=\"none\" stroke=\"#bd9581\" stroke-width=\"6\"/><circle cx=\"17\" cy=\"18\" r=\"10\" fill=\"none\" stroke=\"#bd9581\" stroke-width=\"6\"/><circle cy=\"0\" r=\"4\" fill=\"#7d898a\"/>",
  telescope:"<path d=\"m-32 8 55-27 12 25-55 27Z\" fill=\"#8fa9b1\" stroke=\"#607f8b\" stroke-width=\"3\"/><path d=\"m20-20 9-5 16 31-10 4Z\" fill=\"#b8d6d8\" stroke=\"#607f8b\" stroke-width=\"3\"/><path d=\"M0 20v19m0 0-16 13m16-13 16 13\" stroke=\"#8d806d\" stroke-width=\"5\"/>"
 };
 function person(id,x,action){const robot=id==='tuantuan',body=robot?'#70aaa0':id==='xiaohe'?'#db9c6a':'#76a7c4',skin='#efd0b3';let arms='M-16 8-34 25M16 8 34 25',legs='M-10 48-15 76M10 48l6 28';
  if(action==='carry'||action==='share')arms='M-16 8-33 5M16 8l27-8';
  if(action==='build'||action==='repair')arms='M-16 8-30 31M16 8 42 26';
  if(action==='plan'||action==='compare')arms='M-16 8-34 21M16 8 41-6';
  if(action==='read')arms='M-16 8-25 24M16 8 25 24';
  if(action==='celebrate')arms='M-16 8-32-18M16 8l18-26';
  if(action==='wait')arms='M-16 8-13 34M16 8 13 34';
  if(action==='observe')arms='M-16 8-32 26M16 8 27-8';
  return `<g transform="translate(${x} 126)"><path d="${legs}" fill="none" stroke="#5d767e" stroke-width="11" stroke-linecap="round"/><path d="${arms}" fill="none" stroke="${robot?body:skin}" stroke-width="11" stroke-linecap="round"/><rect x="-19" y="0" width="38" height="51" rx="12" fill="${body}"/>${robot?'<rect x="-23" y="-48" width="46" height="43" rx="12" fill="#9bc7bc" stroke="#5d8b83" stroke-width="3"/><path d="M0-48v-11" stroke="#5d8b83" stroke-width="4"/><circle cy="-62" r="4" fill="#d3b779"/>':`<circle cy="-27" r="25" fill="${skin}"/><path d="M-25-29q-1-35 28-24 23 5 22 28-10-5-14-15-15 13-36 11" fill="#535653"/>`}<circle cx="-8" cy="-28" r="2.7" fill="#36505a"/><circle cx="8" cy="-28" r="2.7" fill="#36505a"/><path d="M-6-16q6 5 12 0" fill="none" stroke="#826b61" stroke-width="2.5" stroke-linecap="round"/></g>`;
 }
 function panel(p={},index=0){const scene=Object.hasOwn(backgrounds,p.scene)?p.scene:'park',action=['observe','carry','share','build','plan','compare','read','wait','repair','celebrate'].includes(p.action)?p.action:'observe',prop=Object.hasOwn(props,p.prop)?p.prop:'book',cast=(Array.isArray(p.cast)?p.cast:['tianle']).filter(x=>['tianle','xiaohe','tuantuan'].includes(x)).slice(0,3),positions=cast.length===1?[172]:cast.length===2?[110,235]:[90,180,270];
  const background=scene==='space'?'#aebace':'#edf3e8';const propY=['carry','share','read'].includes(action)||['umbrella','bell','telescope'].includes(prop)?149:184,held=['carry','share','read','build','repair'].includes(action),propX=held?(positions[0]||172)+(action==='read'?0:32):180;
  return `<svg class="rd-art" viewBox="0 0 360 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${E(sceneNames[scene])}里的阅读情境；请从文字寻找答案"><rect width="360" height="240" rx="18" fill="${background}"/><path d="M0 194h360v46H0Z" fill="#d7e1ce"/>${backgrounds[scene]}${cast.map((id,i)=>person(id,positions[i],i===0?action:'observe')).join('')}<g transform="translate(${propX} ${propY})">${props[prop]}</g><path d="M15 225h330" stroke="#bdcdb9" stroke-width="2"/></svg>`;
 }
 return {panel};
})();

window.ReadingSpeech=(()=>{
 'use strict';
 function create(opts={}){
  const synth=window.speechSynthesis,U=window.SpeechSynthesisUtterance||(typeof SpeechSynthesisUtterance==='function'?SpeechSynthesisUtterance:null);let token=0,active=null,last=null,queue=[],currentState='idle',destroyed=false,voiceTimer=null,startTimer=null,requestSequence=0;
  const requestPrefix='speech-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const notify=(state,extra={})=>{currentState=state;opts.onStatus?.({state,status:state,...extra});};
  const voices=()=>{try{return synth?.getVoices?.()||[];}catch(_){return [];}};
  const mandarin=v=>/^(zh[-_]CN|zh[-_]Hans)(?:[-_]|$)/i.test(v.lang||'');
  const choose=()=>{const rows=voices().filter(mandarin),local=rows.find(v=>v.localService===true);return local||(opts.getRemoteConsent?.()===true?rows[0]:null);};
  function capabilities(){const rows=voices().filter(mandarin);return {available:!!(synth&&U),mandarinVoices:rows.length,confirmedLocalVoices:rows.filter(v=>v.localService===true).length,remoteConsent:opts.getRemoteConsent?.()===true,state:currentState,boundary:'device-dependent',recording:false,recognition:false,audioQuality:'NOT_VERIFIED'};}
  function clear(){opts.onHighlight?.(null);}
  function cancelTimer(which){const id=which==='voice'?voiceTimer:startTimer;if(id!==null)window.clearTimeout?.(id);if(which==='voice')voiceTimer=null;else startTimer=null;}
  function stop(){token++;cancelTimer('voice');cancelTimer('start');queue=[];active=null;try{synth?.cancel?.();}catch(_){}clear();if(!destroyed)notify('stopped');}
  function context(text,meta){if(meta.kind!=='character'&&meta.originKind!=='character'||!meta.contextText)return {text,from:meta.offset||0};const chars=Array.from(meta.contextText),i=Number(meta.charIndex)||0;const reviewed=window.__AMC8_READING_DATA?.contextReviewedPositions?.[meta.contextText]||[];if(reviewed.includes(i)){let from=i,to=i+1;while(from>0&&!/[。！？；\n]/u.test(chars[from-1]))from--;while(to<chars.length&&!/[。！？；\n]/u.test(chars[to-1]))to++;return {text:chars.slice(from,to).join(''),from};}const phrases=Object.keys(window.__AMC8_READING_DATA?.phrases||{}).filter(x=>Array.from(x).length<=8).sort((a,b)=>b.length-a.length);
   for(const word of phrases){const w=Array.from(word);for(let start=Math.max(0,i-w.length+1);start<=i;start++)if(start+w.length>i&&chars.slice(start,start+w.length).join('')===word)return {text:word,from:start};}
   return {text,from:i};
  }
  function segment(text){const out=[];let start=0;for(const match of text.matchAll(/[^。！？\n]+[。！？\n]?|[。！？\n]/gu)){out.push({text:match[0],from:Array.from(text.slice(0,match.index)).length});start=match.index+match[0].length;}return out.length?out:[{text,from:0}];}
  function speak(text,meta={}){
   if(destroyed)return false;text=String(text||'').slice(0,12000);if(!text.trim())return false;const resolved=context(text,meta),actualMeta={...meta,offset:resolved.from};
   const kind=meta.kind||'voice',originKind=meta.originKind||kind,requestId=requestPrefix+'-'+(++requestSequence);
   const origin={requestId,kind,originKind,sessionId:meta.sessionId,materialId:meta.materialId,questionId:meta.questionId};
   const scoped=(state,extra={})=>notify(state,{...origin,...extra});
   opts.onAid?.(kind,{...origin,requestedText:text,spokenText:resolved.text,contextualWord:resolved.text!==text,recording:false});
   last={text,meta:{...meta,originKind}};stop();const t=token;scoped('requested',{spokenText:resolved.text,contextualWord:resolved.text!==text});
   if(!synth||!U){scoped('unsupported',{spokenText:resolved.text});return false;}const voice=choose();if(!voice){const rows=voices(),reason='No confirmed local Mandarin voice; remote voice requires parent consent.';
    if(!rows.length&&typeof window.setTimeout==='function'){scoped('voices_loading',{spokenText:resolved.text});voiceTimer=window.setTimeout(()=>{voiceTimer=null;if(t===token&&currentState==='voices_loading')scoped('no_voice',{spokenText:resolved.text,reason});},3000);}
    else scoped(rows.some(mandarin)?'blocked':'no_voice',{spokenText:resolved.text,reason});return false;}
   queue=segment(resolved.text);const allText=resolved.text;
   const play=()=>{if(t!==token||destroyed)return;if(!queue.length){active=null;clear();scoped('ended',{spokenText:allText,voice:voice.name||'',local:voice.localService===true});return;}const part=queue.shift(),u=new U(part.text);active=u;u.lang=voice.lang;u.voice=voice;u.rate=Math.max(.6,Math.min(1.1,Number(opts.getRate?.())||.85));u.pitch=1;
    const base=(actualMeta.offset||0)+part.from,info={materialId:meta.materialId,elementKey:meta.elementKey,spokenText:part.text};
    let started=false;u.onstart=()=>{if(t!==token)return;started=true;cancelTimer('start');scoped('started',{spokenText:part.text,voice:voice.name||'',local:voice.localService===true,startedBy:'onstart'});opts.onHighlight?.({...info,from:base,to:base+Array.from(part.text).length,source:'sentence',precise:false});};
    u.onboundary=e=>{if(t!==token||!Number.isFinite(e.charIndex))return;const from=base+Array.from(part.text.slice(0,e.charIndex)).length,length=e.charLength?Array.from(part.text.slice(e.charIndex,e.charIndex+e.charLength)).length:1;opts.onHighlight?.({...info,from,to:from+Math.max(1,length),utf16Index:e.charIndex,source:'boundary',precise:true});};
    u.onpause=()=>{if(t===token)scoped('paused',{spokenText:part.text});};u.onresume=()=>{if(t===token)scoped('started',{spokenText:part.text,startedBy:'onresume'});};
    u.onend=()=>{if(t===token){cancelTimer('start');if(!started){queue=[];active=null;clear();scoped('failed',{spokenText:part.text,error:'missing_start'});return;}play();}};u.onerror=e=>{if(t!==token)return;cancelTimer('start');queue=[];active=null;clear();scoped('failed',{spokenText:part.text,error:String(e.error||'speech_error')});};
    try{synth.speak(u);if(!started&&t===token&&active===u&&typeof window.setTimeout==='function')startTimer=window.setTimeout(()=>{startTimer=null;if(t!==token||active!==u||started)return;token++;queue=[];active=null;try{synth.cancel();}catch(_){}clear();scoped('failed',{spokenText:part.text,error:'start_timeout'});},8000);}catch(e){cancelTimer('start');queue=[];active=null;clear();scoped('failed',{spokenText:part.text,error:String(e.message||e)});}
   };play();return true;
  }
  function pause(){if(!active||typeof synth?.pause!=='function')return false;try{synth.pause();notify('pause_requested');return true;}catch(_){notify('failed',{error:'pause_failed'});return false;}}
  function resume(){if(!active||typeof synth?.resume!=='function')return false;try{synth.resume();notify('resume_requested');return true;}catch(_){notify('failed',{error:'resume_failed'});return false;}}
  function repeat(){return last?speak(last.text,{...last.meta,kind:'repeat'}):false;}
  const voiceChange=()=>{if(destroyed||active||!['voices_loading','no_voice','blocked','voices_ready'].includes(currentState))return;const rows=voices();if(!rows.length)return;cancelTimer('voice');notify(choose()?'voices_ready':rows.some(mandarin)?'blocked':'no_voice',{capabilities:capabilities()});};synth?.addEventListener?.('voiceschanged',voiceChange);
  function destroy(){stop();destroyed=true;synth?.removeEventListener?.('voiceschanged',voiceChange);}
  return {speak,pause,resume,stop,repeat,capabilities,destroy};
 }
 return {create};
})();

/* Additive child and parent route; lazily attaches to the existing AMC8 application. */
window.__AMC8_ReadingRuntime=(()=>{
 const host=window.__AMC8_READING_HOST;
 const STORE=host.store;
 'use strict';
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const hash=s=>{let n=2166136261;for(const c of String(s)){n^=c.codePointAt(0);n=Math.imul(n,16777619);}return(n>>>0).toString(36);};
 const ui={screen:'home',phase:'read',parent:false,parentSettingsUnlocked:false,rangeStart:null,rangeEnd:null,message:'',allPanels:false,tapped:new Set(),texts:new Map(),voice:{state:'idle'},dxSet:'BASELINE',knowledgeConfirmed:false,importText:'',finishedDay:null};
 let engine=null,speech=null,heartbeat=null,phrases=null,paintState=null,orderDrag=null;
 // Scope is opt-in: legacy releases retain their existing set IDs and layout.
 function activeSets(data){const sets=data.diagnostics?.sets||[],scope=data.courseScope;return scope?sets.filter(x=>x.courseId===scope.activeCourseId):sets;}
 function diagnosticSets(data){const scope=data.courseScope;return scope?(data.diagnostics?.sets||[]).filter(s=>s.courseId===scope.activeCourseId||(scope.legacyCourseIds||[]).includes(s.courseId)):activeSets(data);}
 function legacyDiagnostic(data,set){return !!set&&!!data.courseScope&&(data.courseScope.legacyCourseIds||[]).includes(set.courseId);}
 function historicalDiagnostics(r){const rows=(r.historicalDiagnostics||[]).filter(s=>s.versions.length);return `<section class="rd-parent-card" data-historical-diagnostics><h2>历史诊断记录</h2><p>旧课程的诊断继续保留。以下按原内容版本分别展示首答和辅助条件完整的记录，不计入新版课程的诊断、能力、准入或完成天数。条件完整也不代表材料已经校准等难度。</p>${rows.length?rows.map(s=>`<details><summary>${s.week===0?'旧版初测':'旧版第'+s.week+'周诊断'}</summary>${s.versions.map((v,i)=>`<p>${v.currentContentVersion?'本次课程更新后的记录':'以前内容版本的记录 '+(i+1)}：首答 ${percent(v.first)}</p><ul>${Object.entries(v.conditions).map(([c,x])=>`<li>${c}：首答 ${percent(x.first)}；条件完整且非导入 ${percent(x.conditionCompleteFirst)}；导入首答 ${x.importedFirst} 条。</li>`).join('')}</ul>`).join('')}</details>`).join(''):'<p>暂无历史诊断首答。</p>'}</section>`;}
 function selectedSet(e){const sets=diagnosticSets(e.data);let set=sets.find(x=>x.id===ui.dxSet);if(!set){set=sets.find(x=>x.week===0)||sets[0]||null;ui.dxSet=set?.id||'';ui.knowledgeConfirmed=false;}return set;}
 function weekDiagnostic(data,week){const id='W'+String(week).padStart(2,'0'),sets=activeSets(data),matches=data.courseScope?sets.filter(x=>x.week===week):sets.filter(x=>x.id===id);if(matches.length!==1){const old=diagnosticSets(data).filter(s=>legacyDiagnostic(data,s)&&s.week===week);return old.length===1?'<p>新版阶段诊断尚未启用。可由家长安排旧课程诊断，结果单独保留。</p>'+button('rdOpenDiagnostic','查看旧版阶段诊断',`data-set="${E(old[0].id)}"`):'<p>本阶段诊断尚未配置或需要核对。</p>';}return button('rdOpenDiagnostic',week===12?'请家长安排终测':'请家长安排阶段诊断',`data-set="${E(matches[0].id)}"`);}
 function historicalMaterial(e,m){return !!e.data.courseScope&&!!m&&m.courseId!==e.data.courseScope.activeCourseId;}
 function findMaterial(data,id){return data.materials.find(m=>m.id===id)||(data.diagnostics?.sets||[]).flatMap(s=>s.forms.flatMap(f=>f.materials)).find(m=>m.id===id);}

 function syncReadingStorage(result){
  if(host.view!=='reading')return;
  const root=document.querySelector?.('.rd-app');if(!root)return;
  let alert=root.querySelector('.rd-storage-alert');
  if(result.status==='ready'){
   alert?.remove();
   let messageAfterSave=null;const pendingMessage=String(ui.message||'');
   if(pendingMessage==='正在保存阅读草稿，请稍候。')messageAfterSave='阅读草稿已保存。';
   else if(pendingMessage.startsWith('记录已合并到草稿，但尚未保存'))messageAfterSave='阅读记录已合并并保存，原数学记录保留。';
   else if(pendingMessage.startsWith('旧版记录已加入草稿，但尚未保存'))messageAfterSave='旧版记录已归档并保存，原键保留。';
   else if(pendingMessage==='范围尚未保存，请先导出并检查记录状态。')messageAfterSave='阅读范围已保存；不在范围内的课程和草稿仍保留。';
   if(messageAfterSave){ui.message=messageAfterSave;const message=root.querySelector('.rd-message');if(message)message.textContent=ui.message;}
  }else{
   if(!alert){alert=document.createElement('div');alert.className='rd-storage-alert';alert.setAttribute('role','alert');root.prepend(alert);}
   alert.innerHTML=`<p>${E(result.message)}</p><div class="rd-nav">${['unsaved','read_only'].includes(result.status)?button('rdRetrySave','重试保存'):''}${button('rdExport','导出阅读草稿')}</div>`;
  }
  const notice=root.querySelector('.rd-save-status'),last=engine?.current()?.attempts?.at(-1);
  if(notice&&last)notice.textContent=result.status!=='ready'?'当前阅读记录尚未保存，请先导出草稿或检查保存状态。':last.first?'第一次的回答已经保留。':'这是再次练习，原来的首答仍然保留。';
  const finishStatus=root.querySelector('.rd-finish-save-status');if(finishStatus)finishStatus.textContent=result.status==='ready'?'这次练习已经保存。':result.status==='acquiring'?'正在保存这次练习，请稍候。':'这次练习还没有保存，请家长导出草稿。';
 }
 function ensure(){if(engine)return engine;engine=window.ReadingEngine.create(window.__AMC8_READING_DATA,localStorage,STORE+'_reading_r1',undefined,{requireSafe:true,onStatus:syncReadingStorage});
  speech=window.ReadingSpeech.create({getRemoteConsent:()=>engine.snapshot().settings.remoteVoiceConsent===true,getRate:()=>engine.snapshot().settings.rate,onAid:(kind,detail)=>engine.requestAid(kind,detail),onStatus:info=>{ui.voice=info;engine.speechStatus(info);const el=document.getElementById('rd-voice-state');if(el)el.textContent=voiceText(info);syncVoiceControls(info);},onHighlight:highlight});
  window.addEventListener?.('storage',e=>{if(e.key===engine.key){engine.externalChange();if(host.view==='reading')host.render();}});
  window.addEventListener?.('beforeunload',event=>{if(engine.status().status!=='ready'){event.preventDefault?.();event.returnValue='';}});
  document.addEventListener?.('visibilitychange',()=>{if(document.hidden){engine.pause();speech.stop();}else if(host.view==='reading'&&ui.screen==='course'){ui.message='回来啦，点继续后再读。';host.render();}});
  window.addEventListener?.('pagehide',()=>{engine.pause();speech.stop();});
  document.addEventListener?.('keydown',e=>{if(e.isComposing||!['Enter',' '].includes(e.key))return;const node=e.target?.closest?.('[data-action="rdChar"]');if(node){e.preventDefault?.();handle('rdChar',node.dataset);}});
  // A separate handle leaves card selection, the adjacent speech button and
  // page scrolling usable. Moving a handle commits the entire visible order
  // as a draft; no attempt is recorded until the learner submits it.
  document.addEventListener?.('pointerdown',e=>{const handle=e.target?.closest?.('[data-rd-order-drag]'),c=engine.current();if(!handle||host.view!=='reading'||ui.phase!=='quiz'||!c||c.session.paused||c.question.type!=='order'||e.button!==0)return;
   orderDrag={pointerId:e.pointerId,from:Number(handle.dataset.rdOrderDrag),questionId:c.question.id,sessionId:c.session.id,x:e.clientX,y:e.clientY,active:false};handle.setPointerCapture?.(e.pointerId);e.preventDefault?.();});
  document.addEventListener?.('pointermove',e=>{if(!orderDrag||e.pointerId!==orderDrag.pointerId)return;if(Math.hypot(e.clientX-orderDrag.x,e.clientY-orderDrag.y)>8)orderDrag.active=true;if(!orderDrag.active)return;e.preventDefault?.();
   for(const n of document.querySelectorAll?.('.rd-order-over')||[])n.classList.remove('rd-order-over');document.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('.rd-option-row')?.classList.add('rd-order-over');});
  document.addEventListener?.('pointerup',e=>{if(!orderDrag||e.pointerId!==orderDrag.pointerId)return;const drag=orderDrag;orderDrag=null;for(const n of document.querySelectorAll?.('.rd-order-over')||[])n.classList.remove('rd-order-over');if(!drag.active)return;const c=engine.current(),target=document.elementFromPoint?.(e.clientX,e.clientY)?.closest?.('.rd-option-row')?.querySelector?.('[data-action="rdPick"]');
   if(host.view!=='reading'||ui.phase!=='quiz'||!c||c.session.paused||c.session.id!==drag.sessionId||c.question.id!==drag.questionId||!target)return;const visible=[...(document.querySelectorAll?.('.rd-options [data-action="rdPick"]')||[])].map(n=>Number(n.dataset.index)),from=visible.indexOf(drag.from),to=visible.indexOf(Number(target.dataset.index));if(from<0||to<0||from===to||visible.length!==c.question.options.length)return;visible.splice(to,0,visible.splice(from,1)[0]);engine.select(visible);host.render();});
  document.addEventListener?.('pointercancel',e=>{if(orderDrag?.pointerId===e.pointerId){orderDrag=null;for(const n of document.querySelectorAll?.('.rd-order-over')||[])n.classList.remove('rd-order-over');}});
  if(typeof window.setInterval==='function')heartbeat=window.setInterval(()=>{if(host.view==='reading'&&ui.screen==='course'&&!document.hidden&&engine.current()&&!engine.current().session.paused){engine.touch();engine.persist();}},15000);
  return engine;
 }
 function pronounce(text){const d=window.__AMC8_READING_DATA,chars=Array.from(String(text)),exact=d.pinyinTexts?.[text];if(Array.isArray(exact)&&exact.length===chars.length)return exact;
  const marker=String(text).match(/^[0-9]+ · /u);if(marker)return [...Array.from(marker[0],()=>''),...pronounce(String(text).slice(marker[0].length))];
  const out=chars.map(c=>d.pinyinMap?.[c]||'');phrases??=Object.entries({...d.phrases,'题目要求':['tí','mù','yāo','qiú'],'只能对应':['zhǐ','néng','duì','yìng'],'先后要求':['xiān','hòu','yāo','qiú'],'：要求':['','yāo','qiú']}).sort((a,b)=>Array.from(b[0]).length-Array.from(a[0]).length);
  for(let i=0;i<chars.length;i++){for(const [word,pron] of phrases){const w=Array.from(word);if(chars.slice(i,i+w.length).join('')!==word)continue;const p=Array.isArray(pron)?pron:String(pron).split(' ');if(p.length!==w.length)continue;for(let j=0;j<w.length;j++)out[i+j]=p[j];i+=w.length-1;break;}}
  if(/^(?:短闪|长闪)(?: → (?:短闪|长闪))?；和为 [1-4](?:，约定：(北门|西门|暂缓|无约定))?$/u.test(text))out[chars.indexOf('为')]='wéi';
  if(/^(?:6:04 第一段声音|6:06 调整天线|6:12 第二段声音)(?: → (?:6:04 第一段声音|6:06 调整天线|6:12 第二段声音))*$/u.test(text)&&chars.includes('调'))out[chars.indexOf('调')]='tiáo';
  if(text==='固定的格子不能修改；在右边补上对应的格子。')out[chars.indexOf('应')]='yìng';
  if(['这是同文自愿挑战；如果原文已经看过，会记录为已见。','这是自愿挑战，已经看过的原文会记录为已见。','还有一道自愿挑战，使用今天的原文。看过原文会记录为已见，不作为未见材料。'].includes(text))out[chars.indexOf('过')]='guo';
  if(/^(?:已放 [0-9]+ 只，总重 [0-9]+ 千克。|已选 [0-9]+ 只，剩余空间共 [0-9]+ 升。)$/u.test(text))out[chars.indexOf('只')]='zhī';
  return out.map((p,i)=>chars[i]==='一'?'yī':chars[i]==='不'?'bù':p);
 }
 function rt(value,{clickable=false,mode=null,reference=null,offset=0,focus=null}={}){const text=String(value??''),whole=reference||text,key=hash(whole),pins=pronounce(whole),chars=Array.from(text),c=paintState?paintState.current:engine?.current(),setting=paintState?paintState.settings:engine?.snapshot().settings;ui.texts.set(key,whole);const m=mode||c?.session.pinyinMode||setting?.pinyin||'all',focusChars=new Set(Array.from((focus||c?.material.focusWords||[]).join('')));
  return chars.map((char,i)=>{if(!/[\u3400-\u9fff]/u.test(char))return E(char);const pos=i+offset,visible=m==='all'||m==='focus'&&focusChars.has(char)||m==='demand'&&ui.tapped.has(key+':'+pos);return `<ruby class="rd-char" data-rd-key="${key}" data-rd-index="${pos}" ${clickable?`role="button" tabindex="0" data-action="rdChar" data-key="${key}" data-index="${pos}" aria-label="${E(char)}，查看拼音和听读"`:''}><rb>${E(char)}</rb><rt aria-hidden="${!visible}">${visible?E(pins[pos]||''):''}</rt></ruby>`;}).join('');
 }
 const button=(action,label,attrs='',classes='rd-button')=>`<button class="${classes}" data-action="${action}" ${attrs}>${rt(label)}</button>`;
 const percent=x=>x?.total?`${Math.round(100*x.correct/x.total)}% (${x.correct}/${x.total})`:'暂无样本';
 const conditionLabels={A:'无拼音，自己读',B:'有拼音，自己读',C:'不看拼音，先听原文',D:'请家长只读原文，再自己回答'};
 function syncVoiceControls(info){const state=info.state||info.status,paused=['paused','pause_requested'].includes(state),playing=['requested','started','resume_requested'].includes(state),pause=document.getElementById('rd-voice-pause'),resume=document.getElementById('rd-voice-resume');if(pause)pause.hidden=!playing;if(resume)resume.hidden=!paused;}
 function voiceText(info){const s=info.state||info.status;return({idle:'需要时可以点喇叭。',requested:'正在准备朗读。',started:'正在朗读。',pause_requested:'正在请求暂停。',resume_requested:'正在请求继续朗读。',paused:'朗读已暂停。',ended:'朗读结束。',stopped:'朗读已停止。',voices_loading:'正在读取系统音色，请稍等。',blocked:'远程音色需要家长先授权，也可以请家长代读。',no_voice:'没有已确认的本地普通话音色，可再试或请家长代读原文。',unsupported:'当前环境无法朗读，可请家长代读原文。',failed:info.error==='start_timeout'?'浏览器未开始朗读，请再点一次或请家长代读。':'这次朗读未完成，请再试或请家长代读。',voices_ready:'音色已准备好，请再点一次朗读。'})[s]||'朗读状态已记录。';}
 function highlight(info){if(typeof document.querySelectorAll!=='function')return;for(const el of document.querySelectorAll('.rd-speaking'))el.classList.remove('rd-speaking');if(!info?.elementKey)return;for(const el of document.querySelectorAll(`[data-rd-key="${info.elementKey}"]`)){const i=Number(el.dataset.rdIndex);if(i>=info.from&&i<info.to)el.classList.add('rd-speaking');}}
 function show(screen){ensure();if(ui.screen==='course'&&screen!=='course')engine.pause();if(screen!=='parent'){ui.parent=false;ui.parentSettingsUnlocked=false;}speech.stop();ui.screen=screen;ui.message='';host.view='reading';host.render();window.scrollTo({top:0,behavior:'instant'});}
 function leave(){if(engine){engine.pause();speech.stop();}ui.parent=false;ui.parentSettingsUnlocked=false;}
 function header(title,sub=''){return `<header class="rd-header"><div><p class="rd-kicker">${rt('天乐的阅读探险队')}</p><h1>${rt(title)}</h1>${sub?`<p>${rt(sub)}</p>`:''}</div><nav class="rd-nav">${button('rdHome','阅读首页')}${button('home','回到数学')}</nav></header>`;}
 function entry(){const e=ensure(),r=e.report();return `<section class="panel rd-entry rd-app"><div><h2>${rt('今天的中文阅读冒险')}</h2><p>${rt('先自己读，需要时再用拼音和朗读。完成过课程')} ${r.completedDays}/84 ${rt('天。')}</p></div><button class="primary" data-action="reading">${rt('进入中文阅读')} →</button><button class="secondary" data-action="rdParent">家长阅读看板</button></section>`;}
 function mathBridge(task,feedback){if(!task||!feedback||feedback.ok)return '';return `<section class="panel rd-math-bridge"><h3>这次卡在哪里？</h3><p>读题和数学想法可以分别记录。</p><button class="secondary" data-action="rdMathConcern" data-reason="character">有字不认识</button><button class="secondary" data-action="rdMathConcern" data-reason="conditions">没有找清条件</button><button class="secondary" data-action="rdMathConcern" data-reason="math">读懂了，还在想解法</button></section>`;}
 function home(){const e=ensure(),r=e.report(),day=e.nextDay(),l=e.data.lessons.find(x=>x.day===day),w=e.data.weeks.find(x=>x.week===l.week),m=e.data.materials.find(x=>x.id===l.coreIds[0]);return `${header('今天的中文阅读冒险','先读故事，再读数学。需要帮助时可以点一下。')}<section class="rd-today"><div aria-hidden="true">${window.ReadingComic.panel({scene:'library',cast:['tianle','xiaohe','tuantuan'],action:'read',prop:'book'},0)}</div><div><p>${rt('第')} ${day} ${rt('天')} · ${rt(w?.theme||'阅读探索')}</p><h2>${rt(m?.title||'打开今天的故事')}</h2><p>${rt(l.kind==='light'?'轻量阅读和每周小发现':l.kind==='review'?'先复习，再换个情境':'故事阅读与数学读题')} · ${l.targetMinutes} ${rt('分钟左右')}</p>${button('rdStart','开始今天的冒险',`data-day="${day}"`,'rd-button rd-primary')}${e.current()?button('rdResume',historicalMaterial(e,e.current().material)?'继续历史课程':'继续上次的阅读'):''}</div></section><p class="rd-soft">${rt('蓝衣天乐 · 橙衣小禾 · 小机器人团团')}</p><nav class="rd-nav">${button('rdPlan','十二周地图')}${button('rdReview','到期复习')}${button('rdRemediate','补一小步')}${button('rdParent','家长看板')}</nav>${unfinishedCourses()}<p class="rd-soft">${rt('练习过不等于完全掌握。下一次可以换一段没见过的文字再试试。')}</p>`;}
 function plan(){const e=ensure(),range=e.snapshot().settings.dayRange||{start:1,end:84};return `${header('十二周阅读地图','按能力放慢或回看，不必赶日历。')}<p>当前阅读范围：第 ${range.start} 至 ${range.end} 天。范围外的课程与记录继续保留。</p><div class="rd-week-grid">${e.data.weeks.map(w=>`<section class="rd-week"><h2>${rt('第')} ${w.week} ${rt('周')} · ${rt(w.theme)}</h2><p>${rt((w.goals||[]).join('；'))}</p><div class="rd-days">${e.data.lessons.filter(l=>l.week===w.week).map(l=>`<div class="rd-day-entry">${button('rdStart',String(l.day),`data-day="${l.day}" aria-label="第${l.day}天课程" ${l.day<range.start||l.day>range.end?'disabled':''}`)}${e.data.courseScope&&l.optionalIds?.length?button('rdDailyOptional','自愿挑战',`data-day="${l.day}" aria-label="第${l.day}天自愿挑战" ${l.day<range.start||l.day>range.end?'disabled':''}`,'rd-button rd-optional-day'):''}</div>`).join('')}</div>${[4,8,12].includes(w.week)?weekDiagnostic(e.data,w.week):''}<details><summary>${rt('本周目标与复习')}</summary><p>${rt(w.reviewTask)}</p><p>${rt(w.standard)}</p><p>${rt(w.nextCriteria)}</p></details></section>`).join('')}</div>`;}
 function comic(m,s){const all=ui.allPanels,panels=all?m.panels:[m.panels[Math.min(s.panelIndex,m.panels.length-1)]];return `<div class="rd-comic-grid ${all?'rd-entire':''}">${panels.map((p,j)=>{const i=all?j:s.panelIndex,offset=Array.from(m.panels.slice(0,i).map(x=>x.text).join('')).length;return `<article class="rd-panel"><span class="rd-panel-number">${i+1}/${m.panels.length}</span>${window.ReadingComic.panel(p,i)}<div class="rd-story-text">${rt(p.text,{clickable:true,reference:m.text,offset})}</div>${button('rdSpeakSentence','听这一格',`data-index="${i}"`)}</article>`;}).join('')}</div><div class="rd-nav">${button('rdPanelPrev','上一格',s.panelIndex<=0?'disabled':'')}${button('rdPanelNext','下一格',s.panelIndex+1>=m.panels.length?'disabled':'')}${button('rdPanelAll',all?'逐格阅读':'整篇阅读')}${button('rdReadDone','我读好了，回答问题','','rd-button rd-primary')}</div>`;}
 function aids(c){const state=ui.voice.state||ui.voice.status,paused=['paused','pause_requested'].includes(state),playing=['requested','started','resume_requested'].includes(state);return `<section class="rd-aids" aria-label="阅读辅助"><div class="rd-nav">${button('rdPinyin',c.session.pinyinMode==='none'?'显示拼音':'隐藏拼音',`data-mode="${c.session.pinyinMode==='none'?'all':'none'}"`)}${button('rdSpeakAll','听全文')}${button('rdVoicePause','暂停朗读','id="rd-voice-pause"'+(playing?'':' hidden'))}${button('rdVoiceResume','继续朗读','id="rd-voice-resume"'+(paused?'':' hidden'))}${button('rdVoiceStop','停止朗读')}</div><p id="rd-voice-state" role="status">${rt(voiceText(ui.voice))}</p><p>${rt('点正文中的字，可以看拼音和听读。多音字可能连同所在词句一起读。')}</p><details><summary>${rt('更多阅读帮助')}</summary><div class="rd-nav">${button('rdVoiceRepeat','再听一次')}${button('rdParentRead','家长读过原文')}${button('rdFollow','我来跟读')}${button('rdRetell','我来复述')}</div><p>${rt('跟读与复述由自己或家长观察，不录音，不自动评分。')}</p></details></section>`;}
 function shuffled(q,sid){const arr=q.options.map((_,i)=>i);let n=parseInt(hash(q.id+sid),36)>>>0;for(let i=arr.length-1;i>0;i--){n=(Math.imul(n,1664525)+1013904223)>>>0;const j=n%(i+1);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
 // These examples are bound to the exact question, option order and passage;
 // edited or unreviewed material keeps the general, conservative prompt.
 function reviewedFeedback(m,q,last){
  const story='天乐先把书放进篮子，再把篮子搬到屋里。雨点落下来时，书还是干的。';
  const math='天乐有3张星星贴纸，小禾又送给他2张。天乐把这些贴纸放进同一个袋子，现在袋里共有多少张贴纸？';
  const rows={
   'R-D001-S1-Q1':{material:'R-D001-S1',text:story,prompt:'把天乐做的事排一排。',options:['把书放进篮子','看见书是干的','把篮子搬到屋里'],answer:[0,2,1]},
   'R-D001-S1-Q2':{material:'R-D001-S1',text:story,prompt:'书没有淋湿，哪件事帮了忙？',options:['只把书放进篮子，仍留门外','下雨前把装书的篮子搬进屋','下雨后才把装书的篮子搬进屋'],answer:1,hints:{0:'再看篮子放在哪里：门外和屋里有什么不同？',2:'比较搬进屋和雨落下的先后顺序。'}},
   'R-D001-M-Q1':{material:'R-D001-M',text:math,prompt:'这道题要找什么？',options:['小禾原来有几张','袋子的颜色','现在袋里的贴纸总数'],answer:2,hints:{0:'先找到问题里的对象，再看问题句：问的是谁现在的什么数量？',1:'先找到问题里的对象，再看问题末尾：它是在问数量，还是在问颜色？'}},
   'R-D001-M-Q2':{material:'R-D001-M',text:math,prompt:'哪两个数说的是合起来的贴纸？',options:['2张和1个袋子','3张和2张','3张和1个袋子'],answer:1,hints:{0:'比较已知条件里的“张”和“个”：袋子的个数是否也是贴纸的数量？',2:'找一找另一个以“张”为单位的已知条件；袋子以“个”为单位。'}},
   'R-D001-M-Q3':{material:'R-D001-M',text:math,prompt:'哪一个算式表示现在的贴纸数？',options:['3+2','3-2','3×2'],answer:0,hints:{1:'先看数量关系：“又送给他”表示贴纸增加还是减少？',2:'看数量关系：题目说的是增加一次，还是有若干组相同数量？'}},
   'R-D001-M-Q4':{material:'R-D001-M',text:math,prompt:'袋里共有多少张贴纸？',options:['1张','6张','5张'],answer:2,hints:{0:'先看数量关系：“又送给他”表示贴纸增加还是减少？',1:'先按数量关系数原有的3张，再数新收到的2张，核对有没有多算。'}}
  };
  const row=rows[q.id];
  const expectedType=q.id==='R-D001-S1-Q1'?'order':q.id==='R-D001-M-Q3'?'relation':'choice';
  if(!row||m?.id!==row.material||m.text!==row.text||q.type!==expectedType||q.prompt!==row.prompt||JSON.stringify(q.options)!==JSON.stringify(row.options)||JSON.stringify(q.answer)!==JSON.stringify(row.answer))return '';
  if(Array.isArray(row.answer)&&Array.isArray(last.selected)){
   if(last.selected[0]!==row.answer[0])return '从表示先后顺序的“先”后面核对第一张卡。';
   if(last.selected[1]!==row.answer[1])return '回看表示先后顺序的“再”后面的动作，核对第二张卡。';
   return '';
  }
  return Number.isInteger(last.selected)?row.hints?.[last.selected]||'':'';
 }
 function feedbackHint(q,last,m){
  const prompt={facts:'先找到问题里的对象，再回原文核对有没有提到。',sequence:'回看表示先后顺序的词，把发生过的事依次对照。',inference:'找出原文中能支持这个想法的句子，再比较选项。',conditions:'把题目问的对象和每个已知条件分别圈出来。',model:'留意文字中的动作或数量关系，再核对所选关系。',recognition:'回到这个字或词所在的句子，看看上下文在说什么。'}[q.ability]||'回到原文，对照问题和自己选择的内容。';
  const selected=wpSupports(q)||['cargo','match','route','departure'].includes(q.type)?[]:(Array.isArray(last.selected)?last.selected:[last.selected]).map(i=>q.options[i]).filter(Boolean);
  return (selected.length?rt('再核对你选的“')+selected.map(option=>rt(option)).join('、')+'”。':'')+rt(reviewedFeedback(m,q,last)||prompt);
 }
 function hasFeedbackHint(c){return engine.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='feedback_hint'&&e.sessionId===c.session.id&&e.questionId===c.question.id);}
 function matchBoard(c,pick){const q=c.question,chosen=Array.isArray(pick)?pick:Array(q.matchLeft.length).fill(null);return `<div class="rd-match-board" role="group" aria-label="逐项配对">${q.matchLeft.map((left,li)=>`<div class="rd-match-row"><p>${rt(left)}</p><div class="rd-nav">${q.options.map((option,index)=>`<div class="rd-option-row">${button('rdMatchPick',option,`data-left="${li}" data-index="${index}" aria-label="${E(left+'，选择'+option)}" aria-pressed="${chosen[li]===index}"`,chosen[li]===index?'rd-option rd-selected':'rd-option')}${button('rdSpeakOption','听',`data-index="${index}" aria-label="${E('朗读'+option)}"`,'rd-option-speak')}</div>`).join('')}</div></div>`).join('')}</div>`;}
 function cargoBoard(c,pick){const q=c.question,chosen=Array.isArray(pick)?pick:Array(q.options.length).fill(null);return `<div class="rd-cargo-board" role="group" aria-label="安排两趟运输">${q.options.map((item,i)=>`<div class="rd-cargo-row"><p>${rt(item)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+item)}"`,'rd-option-speak')}</p><div class="rd-nav">${[1,2].map(trip=>button('rdCargoPick',trip===1?'第一趟':'第二趟',`data-item="${i}" data-trip="${trip}" aria-label="${E(item+'，'+(trip===1?'第一趟':'第二趟'))}" aria-pressed="${chosen[i]===trip}"`,chosen[i]===trip?'rd-option rd-selected':'rd-option')).join('')}</div></div>`).join('')}</div>`;}
 function routeMap(q){const g=q.route.graph;if(!g)return '';const state={open:'开放',closed:'关闭',notYet:'尚未开放'},description=g.edges.map(e=>q.options[e.from]+'到'+q.options[e.to]+'，'+state[e.state]).join('；');return `<svg class="rd-route-map" viewBox="0 0 600 260" role="img" aria-label="${E('路线图：'+description)}"><defs><marker id="rd-route-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#315a55"></path></marker></defs>${g.edges.map(e=>{const a=g.positions[e.from],b=g.positions[e.to],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),x1=a[0]+dx/length*20,y1=a[1]+dy/length*20,x2=b[0]-dx/length*22,y2=b[1]-dy/length*22;return `<g><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${e.state==='open'?'rd-route-open':'rd-route-blocked'}" marker-end="url(#rd-route-arrow)"></line>${e.state==='open'?'':`<text x="${x}" y="${y-8}" text-anchor="middle" class="rd-route-note">${state[e.state]}</text>`}</g>`;}).join('')}${g.positions.map((p,i)=>`<g><circle cx="${p[0]}" cy="${p[1]}" r="19"></circle><text x="${p[0]}" y="${p[1]+6}" text-anchor="middle" class="rd-route-label">${E(q.options[i])}</text></g>`).join('')}</svg>`;}
 function routeBoard(c,pick){const q=c.question,chosen=Array.isArray(pick)?pick:[];return `<div class="rd-route-board" role="group" aria-label="规划路线">${routeMap(q)}<p aria-live="polite">${rt('我的路线')}：${chosen.length?chosen.map(i=>rt(q.options[i])).join(' → '):rt('还没有选择地点')}</p><div class="rd-nav rd-route-places">${q.options.map((place,i)=>button('rdRoutePick',place,`data-index="${i}" aria-label="${E('加入地点 '+place)}"`,'rd-option')).join('')}</div><div class="rd-nav">${button('rdRouteUndo','撤回上一个地点',chosen.length?'':'disabled')}${button('rdRouteClear','清空路线',chosen.length?'':'disabled')}</div></div>`;}
 function timeLabel(value){return Math.floor(value/60)+':'+String(value%60).padStart(2,'0');}
 function departureBoard(c,pick,last){const q=c.question,t=q.departure,chosen=Number.isInteger(pick),previous=Number.isInteger(last?.selected),value=chosen?pick:previous?last.selected:t.initial;return `<div class="rd-departure-board" role="group" aria-label="选择出发时间"><p>${rt('拖动时间轴，或用按钮调整。')}</p><p><output id="rd-departure-value" aria-live="polite">${chosen?E(timeLabel(value)):previous?rt('上次选择')+' '+E(timeLabel(value)):rt('先调整时间，指针现在在')+' '+E(timeLabel(value))}</output></p><input type="range" min="${t.min}" max="${t.max}" step="${t.step}" value="${value}" data-reading-field="departure" aria-label="选择出发时间" aria-valuetext="${E(timeLabel(value))}"><div class="rd-departure-endpoints" aria-hidden="true"><span>${E(timeLabel(t.min))}</span><span>${E(timeLabel(t.max))}</span></div><div class="rd-nav">${button('rdDepartureStep','提前 '+t.step+' 分钟','data-delta="-1"')}${button('rdDepartureStep','推后 '+t.step+' 分钟','data-delta="1"')}</div></div>`;}
 // Direct construction boards for the remaining pilot task types. Inputs are
 // drafts only; grading and complete-answer validation remain in the engine.
 const wpTypes=new Set(['pair','anypair','sequence','loop','rule','purchase','classification','strip','grid','mirror','allocation','manifest']);
 const wpSupports=q=>wpTypes.has(q?.type);
 function wpArray(v,n){return Array.isArray(v)&&v.length===n?[...v]:Array(n).fill(null);}
 function wpPack(v){const m=typeof v==='string'&&/^packs:(\d+),(\d+),(\d+)$/.exec(v);return m?m.slice(1).map(Number):[0,0,0];}
 function wpRule(v){const m=typeof v==='string'&&/^(blue|red)([&|])(square|circle)$/.exec(v);return m?{color:m[1],logic:m[2],shape:m[3]}:{color:'blue',logic:'|',shape:'square'};}
 function wpComplete(q,v){
  if(q.type==='pair'||q.type==='anypair')return Array.isArray(v)&&v.length===2&&new Set(v).size===2&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);
  if(q.type==='sequence')return typeof v==='string'&&/^[AB]{4}$/.test(v);
  if(q.type==='loop')return typeof v==='string'&&/^loop:[0-6]$/.test(v);
  if(q.type==='rule')return typeof v==='string'&&/^(blue|red)[&|](square|circle)$/.test(v);
  if(q.type==='purchase')return typeof v==='string'&&/^packs:[0-6],[0-6],[0-6]$/.test(v)&&v!=='packs:0,0,0';
  if(q.type==='strip')return Number.isInteger(v)&&v>=0&&v<=2;
  if(q.type==='grid'||q.type==='mirror')return Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.grid.rows*q.grid.cols);
  if(q.type==='classification')return Array.isArray(v)&&v.length===q.items.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);
  if(q.type==='manifest')return Array.isArray(v)&&v.length===q.options.length&&v.every(i=>i===1||i===2);
  if(q.type==='allocation')return Array.isArray(v)&&v.length===q.options.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<=q.allocation.total);
  return false;
 }
 function wpNext(q,v,action,d){
  const type=q.type,i=Number(d.index),value=Number(d.value);
  if(action==='rdWpReset'){
   if(['pair','anypair','grid','mirror'].includes(type))return [];
   if(type==='sequence')return '';
   if(type==='loop')return 'loop:0';
   if(type==='rule')return 'blue|square';
   if(type==='purchase')return 'packs:0,0,0';
   if(type==='classification')return Array(q.items.length).fill(null);
   if(type==='manifest')return Array(q.options.length).fill(null);
   if(type==='allocation')return Array(q.options.length).fill(0);
   return undefined;
  }
  if(action==='rdWpPair'&&['pair','anypair'].includes(type)&&Number.isInteger(i)&&i>=0&&i<q.options.length){const a=Array.isArray(v)?[...v]:[];return a.includes(i)?a.filter(x=>x!==i):a.length<2?[...a,i]:a;}
  if(action==='rdWpSeq'&&type==='sequence'&&['A','B'].includes(d.value)){const s=typeof v==='string'?v:'';return s.length<4?s+d.value:s;}
  if(action==='rdWpUndo'&&type==='sequence')return typeof v==='string'?v.slice(0,-1):'';
  if(action==='rdWpLoop'&&type==='loop'&&Number.isInteger(value)&&Math.abs(value)===1){const n=typeof v==='string'&&/^loop:[0-6]$/.test(v)?Number(v.slice(5)):0;return 'loop:'+Math.max(0,Math.min(6,n+value));}
  if(action==='rdWpRule'&&type==='rule'){const a=wpRule(v);if(d.part==='color'&&['blue','red'].includes(d.value))a.color=d.value;else if(d.part==='shape'&&['square','circle'].includes(d.value))a.shape=d.value;else if(d.part==='logic'&&['&','|'].includes(d.value))a.logic=d.value;else return undefined;return a.color+a.logic+a.shape;}
  if(action==='rdWpAcceptRule'&&type==='rule'){const a=wpRule(v);return a.color+a.logic+a.shape;}
  if(action==='rdWpPack'&&type==='purchase'&&Number.isInteger(i)&&i>=0&&i<3&&Number.isInteger(value)&&Math.abs(value)===1){const a=wpPack(v);a[i]=Math.max(0,Math.min(6,a[i]+value));return 'packs:'+a.join(',');}
  if(action==='rdWpClass'&&type==='classification'&&Number.isInteger(i)&&i>=0&&i<q.items.length&&Number.isInteger(value)&&value>=0&&value<q.options.length){const a=wpArray(v,q.items.length);a[i]=a[i]===value?null:value;return a;}
  if(action==='rdWpStrip'&&type==='strip'&&Number.isInteger(i)&&i>=0&&i<=2)return i;
  if(action==='rdWpCell'&&['grid','mirror'].includes(type)&&Number.isInteger(i)&&i>=0&&i<q.grid.rows*q.grid.cols){const g=q.grid,editable=type==='mirror'?(g.editable||[]).includes(i):!(g.blocked||[]).includes(i);if(!editable)return undefined;const a=Array.isArray(v)?[...v]:[];return a.includes(i)?a.filter(x=>x!==i):[...a,i];}
  if(action==='rdWpAmount'&&type==='allocation'&&Number.isInteger(i)&&i>=0&&i<q.options.length&&Number.isInteger(value)&&Math.abs(value)===1){const a=Array.isArray(v)&&v.length===q.options.length?[...v]:Array(q.options.length).fill(0);a[i]=Math.max(0,Math.min(q.allocation.total,a[i]+value));return a;}
  if(action==='rdWpTrip'&&type==='manifest'&&Number.isInteger(i)&&i>=0&&i<q.options.length&&(value===1||value===2)){const a=wpArray(v,q.options.length);a[i]=a[i]===value?null:value;return a;}
  return undefined;
 }
 function wpBoard(q,v){
  const t=q.type,reset=button('rdWpReset','清空重做');let content='';
  if(t==='pair'||t==='anypair'){
   const selected=Array.isArray(v)?v:[];
   content=`<p>${rt('选择两项；再次点击可以撤回。')}</p><div class="wp-options">${q.options.map((x,i)=>`<div class="rd-option-row">${button('rdWpPair',x,`data-index="${i}" aria-pressed="${selected.includes(i)}"`,selected.includes(i)?'rd-option rd-selected':'rd-option')}${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</div>`).join('')}</div>`;
  }else if(t==='sequence'){
   const s=typeof v==='string'?v:'';content=`<p>${rt('依次安排四次，可以撤回。')}</p><p aria-live="polite">${rt('我的安排')}：${s?Array.from(s).map(x=>rt(x==='A'?'甲':'乙')).join(' → '):rt('还没有安排')}</p><div class="rd-nav">${button('rdWpSeq','甲','data-value="A"')}${button('rdWpSeq','乙','data-value="B"')}${button('rdWpUndo','撤回一次',s?'':'disabled')}</div>`;
  }else if(t==='loop'){
   const n=typeof v==='string'&&/^loop:[0-6]$/.test(v)?Number(v.slice(5)):0;
   content=`<p>${rt('从 1 开始，每次加 3。自己判断什么时候停止。')}</p><p aria-live="polite">${rt('已经执行')} ${n} ${rt('次，请自己算出现在的数。')}</p><div class="rd-nav">${button('rdWpLoop','执行一次',`data-value="1" ${n>=6?'disabled':''}`)}${button('rdWpLoop','撤回一次',`data-value="-1" ${n<=0?'disabled':''}`)}</div>`;
  }else if(t==='rule'){
   const a=wpRule(v),groups=[['color',[['blue','蓝色'],['red','红色']]],['logic',[['&','并且'],['|','或者']]],['shape',[['square','方形'],['circle','圆形']]]];
   content=`<p>${rt('选择颜色、连接词和形状，再把规则与题目中的样例逐一比较。可以修改起始规则；点击下方按钮才能采用它。')}</p>${groups.map(([part,items])=>`<div class="rd-nav">${items.map(([key,label])=>button('rdWpRule',label,`data-part="${part}" data-value="${key}" aria-pressed="${a[part]===key}"`,a[part]===key?'rd-option rd-selected':'rd-option')).join('')}</div>`).join('')}<p>${rt('当前规则')}：${rt((a.color==='blue'?'蓝色':'红色')+(a.logic==='&'?'并且':'或者')+(a.shape==='square'?'方形':'圆形')+'才送出。')}</p>${button('rdWpAcceptRule','采用当前规则')}`;
  }else if(t==='purchase'){
   const a=wpPack(v);content=`<p>${rt('增减包装；自己核对张数和积分。')}</p>${q.options.map((x,i)=>`<div class="wp-row"><p>${rt(x)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</p><div class="rd-nav">${button('rdWpPack','少一份',`data-index="${i}" data-value="-1" ${a[i]===0?'disabled':''}`)}<output aria-label="${E(x+'已选份数')}">${a[i]}</output>${button('rdWpPack','多一份',`data-index="${i}" data-value="1" ${a[i]>=6?'disabled':''}`)}</div></div>`).join('')}`;
  }else if(t==='classification'){
   const a=wpArray(v,q.items.length);content=q.items.map((item,i)=>`<fieldset class="wp-row"><legend>${rt(item)} ${button('rdWpSpeakItem','听',`data-index="${i}" aria-label="${E('朗读第'+(i+1)+'条')}"`,'rd-option-speak')}</legend><div class="rd-nav">${q.options.map((x,j)=>button('rdWpClass',x,`data-index="${i}" data-value="${j}" aria-pressed="${a[i]===j}"`,a[i]===j?'rd-option rd-selected':'rd-option')).join('')}</div></fieldset>`).join('');
  }else if(t==='strip'){
   const n=Number.isInteger(v)?v:0;content=`<p>${rt('选择两条纸条重叠的长度；自己算拼接后的总长。')}</p><svg class="wp-strip" viewBox="0 0 360 100" role="img" aria-label="${E('两条纸条，当前重叠 '+n+' 厘米')}"><rect x="20" y="15" width="120" height="25" rx="4" fill="#4e91aa"></rect><rect x="${140-n*40}" y="45" width="160" height="25" rx="4" fill="#df9b46"></rect></svg><div class="rd-nav">${q.options.map((x,i)=>button('rdWpStrip',x,`data-index="${i}" aria-pressed="${v===i}"`,v===i?'rd-option rd-selected':'rd-option')).join('')}</div>`;
  }else if(t==='grid'||t==='mirror'){
   const g=q.grid,a=Array.isArray(v)?v:[],n=g.rows*g.cols;
   content=`<p>${rt(t==='grid'?'点格子选择或取消；深色格子不能使用。':'固定的格子不能修改；在右边补上对应的格子。')}</p><div class="wp-grid" role="group" aria-label="${E(t==='grid'?'方格拼图':'对称方格')}" style="grid-template-columns:repeat(${g.cols},minmax(44px,1fr))">${Array.from({length:n},(_,i)=>{const fixed=(g.fixed||[]).includes(i),blocked=(g.blocked||[]).includes(i),editable=t==='grid'?!blocked:(g.editable||[]).includes(i),selected=fixed||a.includes(i),label='第 '+(Math.floor(i/g.cols)+1)+' 行第 '+(i%g.cols+1)+' 列'+(fixed?'，已固定':blocked?'，不可用':'');return `<button type="button" class="wp-cell ${selected?'wp-cell-selected':''}" data-action="rdWpCell" data-index="${i}" aria-label="${E(label)}" aria-pressed="${selected}" ${editable?'':'disabled'}>${blocked?'×':fixed?'●':selected?'■':'□'}</button>`}).join('')}</div>`;
  }else if(t==='allocation'){
   const a=Array.isArray(v)&&v.length===q.options.length?v:Array(q.options.length).fill(0);
   content=`<p>${rt('分别调整各组数量；自己核对总数与每组要求。')}</p>${q.options.map((x,i)=>`<div class="wp-row"><p>${rt(x)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</p><div class="rd-nav">${button('rdWpAmount','减一',`data-index="${i}" data-value="-1" ${a[i]<=0?'disabled':''}`)}<output aria-label="${E(x+'数量')}">${a[i]}</output>${button('rdWpAmount','加一',`data-index="${i}" data-value="1" ${a[i]>=q.allocation.total?'disabled':''}`)}</div></div>`).join('')}`;
  }else if(t==='manifest'){
   const a=wpArray(v,q.options.length);content=`<p>${rt('每件物品选择一趟；自己检查每趟的限制。')}</p>${q.options.map((x,i)=>`<div class="wp-row"><p>${rt(x)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</p><div class="wp-two">${[1,2].map(n=>button('rdWpTrip',n===1?'第一趟':'第二趟',`data-index="${i}" data-value="${n}" aria-pressed="${a[i]===n}"`,a[i]===n?'rd-option rd-selected':'rd-option')).join('')}</div></div>`).join('')}`;
  }
  return `<div class="wp-board" data-wp-type="${E(t)}">${content}${t==='strip'?'':`<div class="rd-nav">${reset}</div>`}</div>`;
 }

 // Original preview exploration is gated and treated as assistance.
 // Changes to the passage, question or options disable the unreviewed board.
 const wpExplore=((outerButton)=>{
  const expected={"days":{"3":"温室的记录小组说，他们把一本旧簿子装进蓝袋，交给了运输机器人；小禾还不能确定是不是编号 47 的观察簿。小组请他们去轨道打印台查看运输单。桌上还留着两张小苗记录卡。两盆苗使用同种种子、同样的盆和土，每次浇水也一样；甲盆放在亮处，乙盆放在较暗处。一段时间后，甲从 4 厘米长到 7 厘米，乙从 5 厘米长到 7 厘米。“它们现在一样高，所以长得一样多。”团团说。小禾指着起始数字：“等一下，还要看这里。”","4":"轨道入口的屏幕显示，机器人曾把蓝袋送往仓库。轨道从第 0 格开始，打印台在第 7 格。机器人一次只能向前走 2 格或 3 格，不能后退，也不能走出轨道后折返。它想尽快到打印台，请天乐设计路线。打印台里有张尚未取出的仓库通行卡。团团正要按“3 格”按钮，又犹豫起来：“两次能到吗？”","5":"通行卡打开了仓库门。仓库里有红、蓝、绿三个盒子，只有一个装着干燥柜的钥匙。管理员留下三张纸条，并说明三句话中恰好只有一句是真的。红盒纸条：“钥匙不在红盒。”蓝盒纸条：“钥匙在绿盒。”绿盒纸条：“钥匙不在绿盒。”团团伸手想拿蓝盒。小禾说：“先比较后面两张纸条，它们可能同时为假吗？”","6":"钥匙打开干燥柜，柜里有三只纸袋：A 袋是手套，重 2 千克；蓝色的 B 袋装着编号 47 的观察簿，重 3 千克；C 袋是展板，重 4 千克。升降机每趟最多装两只袋子，总重不能超过 6 千克。观察簿必须第一趟上楼。管理员还叮嘱：拿到手套之前，不要打开装观察簿的袋子。“我想把展板和观察簿一起带上去。”天乐说。团团看了看限重牌。","7":"观察簿终于回到展厅。天乐戴上手套，翻开记录页：第一晚看到 3 颗，第二晚看到 5 颗，第三晚看到 1 颗；每晚都观察了 20 分钟。记录还写着第三晚有云。小禾准备展签：“第三晚有云，看来只要有云就一定看得少。”天乐把笔递给她：“我们把看到的写清楚，再说哪些还不能确定。”展厅的门外，第一批参观者已经到了。团团把找到观察簿的路线画成一张地图，贴在展柜旁。","8":"展览结束后，天乐想邀请邻居一起看夜空。他、小禾和团团在地图上圈出操场、屋顶和小山坡。大家约定晚上 8 点开始观察，8 点 20 分结束。从集合点出发，走到操场要 20 分钟，屋顶要 10 分钟，小山坡要 15 分钟。操场和小山坡视野开阔；操场的灯晚上 8 点半才亮，屋顶有一半天空被遮住。大家计划不早于 7 点 40 分出发，步行不超过 15 分钟，还希望视野开阔。下过雨后，去山坡之前要请大人确认路面不滑。团团拿起笔：“先按条件找，再确认安全。”","9":"地点还没最后定，小禾找来三次观察卡。每次都从同一个位置、用同一种方法数天空中能看见的星星。甲卡：观察 20 分钟，云量记为 2，看到 4 颗。乙卡：观察 20 分钟，云量记为 7，看到 2 颗。丙卡：观察 10 分钟，云量记为 2，看到 2 颗。团团指着甲、乙两张卡：“云越多，看见的星星就一定越少。”天乐想了想：“这两张卡有个条件相同，但我们还需要更多记录。”","10":"观星夜要把物资从集合点送到观察处。A 袋装手电，重 2 千克；B 袋装饮水，重 4 千克；C 袋装记录本，重 3 千克。运输车每趟最多装两袋，总重不能超过 5 千克。饮水必须第一趟送到。工作人员到达后再打开记录本袋。团团把 B 袋搬到车边，又想把手电一起放上车。天乐指着限重牌：“我们先算一算，再安排第二趟。”","11":"场地确定后，大家排练开场。两套方案都从晚上 7 点整开始，而且每一步都紧接着进行：先布置，再检查，再向客人介绍，最后观察。甲方案依次用 10、5、10、20 分钟；乙方案依次用 5、10、15、20 分钟。负责人要求整个安排最晚在 7 点 45 分结束。团团在钟面上贴了两条时间线：“先把每一步走完，再看哪条没有超过结束时间。”","12":"到观察处有几条小路。地图上写着：集合点 S 可以到 A 或 B；A 可以到 C 或 D；B 只能到 C；C、D 都可以到观察处 T。路线只能沿图上写出的连接走，不走回头路。出发前，工作人员发现 C 点积水，暂时不能经过 C；A、B、D 和 T 都可以走。团团想从 S 经过 B 再到 D。小禾把地图转过来：“别只看点的位置，先找有没有连着的路。”","13":"观星夜开始前，工作人员给团团一张安全卡：只要出现闪电，就暂停户外观察；没有闪电时，还要等大人确认地面不滑，才能开始。下雨本身没有写成自动取消条件，但雨后仍要检查地面。检查时，小禾发现对讲机里只传来“暂时没有闪电”，还没收到路面检查结果。团团把手放在开始按钮上。天乐说：“我们先看看卡上还有哪一项没有确认。”","14":"晚上 8 点，大家安全到达观察处。回集合点的路通常要走 10 分钟，负责人要求大家最晚在 8 点 40 分回到集合点。天乐准备了三个观察方案：观察 15 分钟、25 分钟或 35 分钟，观察一结束就立刻返程。大家想在按时返回的前提下，尽量多观察一会儿。刚要开始，对讲机又传来消息：有一段路可能需要绕行。天乐把计划卡留在桌上，决定先按现有路况做安排，再看看变化会怎样影响计划。","15":"观星夜结束后，社区广播站邀请天乐和小禾帮忙准备一期节目。傍晚 6:04，录音里传来一句断断续续的话：“我们到……之前……”；后半句听不清。6:06，值班员调整天线后，广播站音箱里的声音变清楚了。6:12，又收到一段声音：“……七点……见。”记录上没有写两段是否属于同一句话。团团想立刻播报：“大家七点前一定能到！”小禾拦住他：“先把听见的、看见的和猜出来的分开。”","16":"广播站找到两份针对 6:04 同一句话的文字记录。这句话只说了一个集合地点：甲单写“在东门集合”，乙单写“在北门集合”。两张单都标了 6:04，记录人不同。保留下来的片段只能听清“……门集合”。甲、乙记录人都说自己是边听边记的；现场没有其他能确认 6:04 原话的人。团团指着两张单：“总有一个人在骗人！”天乐摇头：“记录互相冲突，可能听错，也可能记错。先找能核对原话的材料。”","17":"发送者告诉广播站：备用信号每组有两次闪光，然后停一下。短闪记 1，长闪记 2，把一组两次的数相加。约定的结果是：2 表示北门，3 表示西门，4 表示暂缓。监测器保存了一组“短闪、长闪、停顿”，但另一段录像只保存了解码结果“西门”。团团说：“既然都是西门，就能知道录像里先闪了什么。”小禾把两张闪光卡倒过来，发现事情没那么简单。","18":"广播站用来检查声音的音箱又出现杂音。问题可能来自远端收音、传输途中，或台内的监听设备；目前还没有足够证据确定是哪一处。小禾找到一段确认清晰的测试录音。她让同一段录音同时进入耳机和音箱，保持同一音源与音量设置。耳机听起来清楚，音箱仍有杂音。团团想马上宣布远端话筒坏了。天乐说：“先看这次比较改变了什么。我们可以继续检查音箱和连接处。”","19":"广播站要把发射器和监听器同时运行一个完整时段。监听器用来检查播放的声音。三块电池的可用容量分别为 9、6、5 单位；每个设备只能接一块电池，一块电池不能同时供给两个设备。这个时段里，发射器至少需要 6 单位，监听器至少需要 5 单位。还要留一块未使用的电池做应急备用，备用容量不能少于 5 单位。团团把最大的电池拿给发射器。小禾说：“不一定错，我们把所有条件都检查一下，再看看还能不能留更充足的备用。”","20":"广播站想研究开窗是否影响接收。第一次用同一段包含十个字的测试录音，在同一位置、同一设备上试听：窗开时正确辨认 8 个字，窗关时正确辨认 9 个字。两次测试不是同时进行的，当时周围还有其他可能变化的声音。团团指着 8 和 9：“只要关窗，永远都会多听清一个字。”天乐提议再做多组比较：尽量保持位置、设备和录音相同，交替改变开窗状态，并把每次结果和周围情况记下来。","21":"广播站找回了能核实的原始记录：6:04 的通话提过东门；6:09，活动负责人发来一条更改通知，地点改为北门。两条记录都保留了时间。6:12 的片段仍只听清“七点……见”，没有说清日期。负责人暂时没有回复确认集合时间，编辑不能把猜测写成已经确认的安排。节目即将开始。小禾要写一句简短播报：既让听众知道地点有过更新，也把尚未确认的时间和下一步核查说清楚。","22":"广播节目结束后，社区观察馆想做一张雨水地图。工作人员在雨停后的同一段 30 分钟内，测量了东、西、南三个位置的积水深度。东点从 8 厘米降到 5 厘米；西点从 5 厘米降到 4 厘米；南点两次都是 6 厘米。测量位置和工具没有改变。团团只看最后的数：“西点的水最浅，所以它下降得最多。”天乐拿起两次记录：“先算变化，再看看记录能不能解释原因。”","23":"观察馆用三只容器收集用于测量的雨水：大桶最多装 8 升，已经有 4 升；中桶最多装 5 升，目前为空；小桶最多装 3 升，目前也为空。这次实验需要选两只容器，分别把所选容器的剩余空间都接满。工作人员想让新增水量正好是 7 升。容器里的水不能在这次选择中倒来倒去。小禾先算每只容器还能装多少。团团说：“别只看桶有几只，还要看每只剩下多少空间。”","24":"工作人员绘制了一张从观察馆 S 到集合处 T 的路线草图：经 A 走 5＋5 分钟，经 B 走 4＋7 分钟，经 C 走 3＋4 分钟。每条路线都只能按草图上列出的两段走。C 路因积水暂时关闭；B 路刚由工作人员检查可通行；A 路的门是否打开还没有确认。孩子们只在工作人员陪同并确认安全后行动。团团想选用时最短的 C 路。小禾说：“先看这条路现在能不能走，再比较时间。”","25":"观察馆整理某天下午连续三小时的雨量。第一小时记录了 2 毫米，第二小时记录了 3 毫米，第三小时的格子是空白。每小时雨量都不会是负数。旧记录上没有说明空白是“没有下雨”还是“没有记录”。团团把空格填成 0，写出总雨量是 5 毫米。天乐说：“我们知道前两小时共 5 毫米，但空格的意思要先核实。”","26":"工作人员用两块相同表面的模型板做小实验：每次倒入相同量的水，板的长度和起点相同。第一次坡度较小，水到终点用了 6 秒；第二次坡度较大，用了 4 秒。每种坡度目前只测了一次。团团说：“坡度更大，任何情况下都一定更快。”小禾指出，两次结果值得继续研究，但还不能说明所有情况。他们决定在工作人员指导下重复比较，并记录每次的坡度、用水量、板面和时间。","27":"社区准备在白天开放通往观察馆的步行路线。工作人员说明：安全门和桥板都修好后，这条路线才可开放；照明灯是另一个可选改进项目，今天的计划不包含夜间通行。安全门维修需要 3 个预算单位，桥板需要 4 个单位，照明灯需要 2 个单位。现在的预算为 7 个单位，费用按题中数值计算。维修由工作人员安排。团团先选了桥板和照明灯。小禾核对清单：“预算够不够是一件事，路线开放的条件有没有满足是另一件事。”","28":"观察馆准备把雨水地图介绍给邻居。记录显示：某次 30 分钟里东点水深从 8 厘米降到 5 厘米；同一天第三小时的雨量格子没有填写。另有一张最新路线表：B 路已由工作人员确认可通行；C 路暂时关闭。工作人员还在核对 A 路的门是否打开。实际出行需要遵循现场人员的指引。小禾写说明时，把测量事实、还不知道的事和下一步要核查的内容分开。团团提醒：“别为了让地图看起来完整，就替空格编数字。”","29":"观察馆准备把三封工作信分别交给播报组、造型组和后勤组，每组恰好收到一封。信封 A、B、C 的外标签在搬运时脱落了。登记簿确认 A 应交给播报组；另一张核对单确认 B 不是给后勤组的。除此之外，每封信和每个组都只对应一次。团团看着一张松动的“后勤组”标签，想把它贴回 B。小禾说：“这张标签没有固定在信封上，先用已核实的两条记录推一推。”","30":"交接地图上只有这些连接：S 可到 A 或 B；A 可到 C；B 可到 C 或 D；C 和 D 都可到 T。路线可以沿列出的连接向终点前进。上午 9:30，A 到 C 的路关闭；B 到 D 的门要到 10:00 才开放。其余列出的连接已经确认开放。出发前仍由工作人员确认现场安全。团团看到 A 到 C 关闭，说：“那 C 一定到不了。”天乐沿着地图从 B 走了一遍。","31":"工作人员要把资料从 S 送到 T，必须不晚于 10:00 到达。按计划，从 S 步行到中转点 H 用 12 分钟；在 H 整理资料用 5 分钟；从 H 到 T 再用 8 分钟。三段所需时间都已计入计划，不另加等待。天乐想从 9:40 出发；小禾拿纸画了一条时间线：“我们先倒着算一遍。”实际出发前还要由工作人员确认路况；这里先按题中给定的时间规划。","32":"编号 47 的包裹起初由阿宁保管。9:05，阿宁交给小禾；9:14，小禾交给天乐；9:20，天乐在交接单上签收。记录确认 9:05 至 9:20 之间没有其他交接。签收时间是完成登记的时间，不是包裹第一次进入天乐手里的时间。团团指着 9:20：“天乐那时才拿到包裹。”小禾请他把“交到手里”和“签字登记”放在不同的时间点。","33":"工作人员要把三件物品从 S 送到 T：A 重 3 千克，B 和 C 各重 2 千克。每件物品都不能拆开；车每趟最多运 5 千克。A 必须在第一趟送到。车卸下物品后可以返回，第二趟的载重单独计算。这里先不限制 B 和 C 哪个先到。团团把 A 和 B 放在第一趟，小禾又试了 A 和 C：“看看是否还有另一种同样符合条件的安排。”","34":"上一天的三件物品仍是 A 重 3 千克、B 和 C 各重 2 千克；每趟最多运 5 千克，物品不能拆开，A 必须第一趟到。工作人员新增规则：C 必须严格早于 B 到达。同一趟到达算同时，不能算作一件早于另一件。今天仍希望用两趟完成。团团准备沿用“第一趟 A 和 B，第二趟 C”。天乐把新规则放到计划旁边，重新检查。","35":"交接结束后，工作台上有三条记录：A 在 9:05 送达；C 在 9:15 签收；B 的签收栏没有填写。记录没有说明 B 是尚未送到，还是已经送到但漏填。团团想写：“三件都已签收。”小禾说：“A 的记录说送达，不等于写了签收；B 的签收栏也需要核对。”天乐准备一份交接说明，分别写清已记录的事情、待确认事项和下一次核查的对象。","36":"观察馆的影子实验室里有两根固定的小棒。工作人员在两个时刻分别记录它们的影子长度，使用同一把尺，并从小棒底部量到影子末端。甲棒的影子从 4 厘米变成 9 厘米；乙棒的影子从 6 厘米变成 10 厘米。两次测量之间没有留下其他记录。团团看着最后的 9 和 10：“乙的影子最后更长，增加的长度也一定更多。”天乐指着第一列：“先算一算，每根影子增加了多少。”","37":"工作人员把三次影子实验写在卡片上。灯距指灯与纸片之间的距离；屏距指纸片与屏幕之间的距离。三次都使用同一张纸片、同一盏灯，灯的亮度也相同。甲：灯距 30 厘米，屏距 20 厘米；乙：灯距 40 厘米，屏距 20 厘米；丙：灯距 40 厘米，屏距 30 厘米。小禾想先研究灯距变化。团团拿起丙卡，天乐说：“先找两张卡：只改变我们想研究的距离，另一个距离保持相同。”","38":"实验室正在整理三次测量的影子长度：甲是 8 厘米，乙的格子空着，丙是 10 厘米。乙到底没有测量，还是测过却丢了记录？表格上没有说明。团团看到两个数字，就把乙填为 9 厘米：“这样刚好排得整齐。”小禾说：“整齐不是证据。先保留空格，并找原始记录。”工作人员找来了当天的原始记录本，还要核对测量时间和实验卡，才能知道哪条记录属于乙。","39":"观察馆想比较两种纸片遮挡灯光的效果。工作人员准备了大小相同的甲、乙纸片：甲不透光，乙能透过一部分光。两次都用同一盏灯和同一个屏幕，灯、纸片和屏幕的位置不变。每次更换纸片后，都记录屏幕上影子的样子。团团提出换纸片时顺便把灯移远。小禾提醒：“这样结果不同，也许有不止一个原因。”","40":"同一组实验重复四次，记录的影长为 10、10、11、4 厘米。小禾发现第四次和其他三次差得比较多。团团说：“4 肯定是错的，删掉它。”天乐说：“可能是记录或测量出了问题，也可能有别的变化。先保留它，再查那次的条件。”工作人员决定先核对尺的位置、实验卡和记录方法，再按记录中的条件重做几次，看看结果是否相近。","41":"实验室准备比较甲、乙两种纸片，每种各做两次。灯、屏幕、纸片大小和测量方法尽量保持相同；每次都记录时间和结果。灯开得久了，亮度会不会变化？大家还不知道。小禾建议把甲、乙的测试穿插安排，让两种纸片都在前半段和后半段出现。团团问：“这样就能保证没有其他影响吗？”天乐说：“不能保证，但可以让两种纸片都出现在较早和较晚的测试中，再继续核对。”","42":"观察馆要写一张介绍影子实验的卡片。实验使用同一张纸片，纸片和屏幕的位置不变，只设置两种灯距。甲设置测得 6 厘米，乙设置测得 9 厘米，各测了一次。这两条记录来自刚才的实验。换一张纸片再测，或者明天再做，结果还会一样吗？这些情况还没有试过。团团想把“乙的影子总比甲长 3 厘米”写成标题。小禾拿出三种标签：“本次记录”“猜测”“下一步”，准备把卡片整理清楚。","43":"团团在规则工坊里测试一个数字盒。盒子最初显示 3，规则卡依次写着：“加 2”，然后“把现在的数乘 2”。每条规则只执行一次。屏幕上会显示每一步的结果。团团说：“乘 2 时要用刚开始的 3 吧？”天乐指着规则卡：“它说的是现在的数。”大家决定先逐步运行，再和一次算出来的结果对照。","44":"工坊用一个模拟盒练习判断规则。卡片写着：只有“指示灯为绿”并且“盖子已合上”，才显示“可以继续”；其他已确认情况显示“先等待”。今天小禾把指示灯设为绿，但盖子仍打开。团团看到绿灯就想点“可以继续”，天乐请他把两项条件都看完。这是纸面模拟规则，显示结果只用于这次练习。","45":"工坊有两套数字规则，初始数都是 3。甲方案先加 2 再乘 2；乙方案先乘 2 再加 2。每个操作都对上一步得到的数执行一次。团团说：“两套都用了加 2 和乘 2，结果一定一样。”小禾把两条运行轨道画在纸上，准备逐步比较。他们不先猜结论，而是分别记录每一步。","46":"数字盒最初显示 1。规则写着：“如果当前数还小于 10，就加 3；然后再次检查。当前数达到或超过 10 时停止。”团团每次执行一步后都记下数字。小禾提醒：“要用更新后的数判断是否继续，达到 10 也要停。”屏幕每次只执行一步，可以撤回并重新试。","47":"工坊的模拟卡有两项输入：指示灯是否为绿、盖子是否合上。规则仍是确认两项都满足时，显示“可以继续”。这次已确认灯为绿，但盖子状态没有检查。卡片用三种标记记录每一项：“是”“否”“尚未确认”。这张卡规定：只要有一项还没确认，就先显示“待核实”；两项都确认后，再判断能否继续。团团想把“尚未确认”直接当成“否”。小禾说：“它们可能导致同样暂时不能继续，但记录的含义不同。”","48":"工坊整理了三张卡：甲是蓝色圆形，乙是红色方形，丙是蓝色三角形。团团说：“所有蓝色卡都是圆形。”小禾没有马上评价，而是逐张对照这句话：先找蓝色卡，再看它们是不是圆形。只要找到一张蓝色却不是圆形的卡，就能说明团团的话有漏洞。这样的例子叫反例。","49":"工坊要为一组卡编写“送出”规则。工作人员给出三张已确认的样例：蓝色方形要送出；蓝色圆形不送出；红色方形也不送出。团团写下一条规则：“蓝色或者方形就送出。”小禾用三张样例逐一试运行，发现这条规则会多送出一些卡。大家准备修改规则，并保留这三张样例用于再次检查；没有给出样例的其他情况仍需进一步确认。","50":"观察馆要布置一个可以照出影子的角落。桌上有 10 节同样的电池，每支小手电要装 2 节。工作人员要求先留下 3 节备用，不能把备用电池装进手电。团团排出五支手电：“正好装完！”小禾把备用盒推过来：“先把答应留下的电池放进去。”天乐准备画一张分配表：备用盒、手电、没有用上的电池，都要记清楚。","51":"展台需要 6 张卡片。材料柜有两种包装：甲包每盒 3 张，乙包每盒 2 张，盒子都要完整取走。两种卡片大小和用途相同。小禾取了 2 盒甲包，团团取了 3 盒乙包。两人都说自己正好拿够了。工作人员又提醒：“这次运输盘最多摆 2 盒。”天乐把“卡片够不够”和“盒子放不放得下”分成两行检查。","52":"卡片兑换柜改用了积分：4 张装一包要 5 分，2 张装一包要 3 分，单张要 2 分。可以组合兑换，每种都有足够库存。这次必须正好拿到 6 张，不能多拿。团团先拿三包 2 张装，小禾却想试试不同大小的包装。天乐准备把能凑成 6 张的买法列出来，找出花分最少的一种。","53":"展台小组共有 15 分。灯架必须兑换，花 6 分；记录本也必须兑换，花 4 分。负责人还要求至少留下 3 分，处理当天临时缺少的材料。装饰柜有彩带 2 分、贴纸 3 分、海报 4 分。三种装饰都不是必需品，最多选一种。团团看见 15－6－4＝5，就想拿海报。天乐请他再看一眼“至少留下 3 分”的便条。","54":"展台还缺一张底板和一张说明标签。蓝底板、红底板各要 4 分，说明标签也要 4 分。每件最多取一份，这次最多用 8 分。工作人员说：“底板选蓝色或红色都可以，但标签一定要有。”小禾选蓝底板，团团想用红底板。天乐准备把两种方案都摆出来，看看是不是都满足要求。颜色不同，并不一定说明其中一个错了。","55":"昨天的清单写着：蓝底板、红底板和说明标签都有货，各要 4 分。小组计划拿红底板加标签，限额是 8 分。今天柜台贴了带日期的新便条：“红底板暂时没有；蓝底板和标签仍有货，价格不变。”旁边还有一句：“下午也许会补红底板，数量未确认。”展台要在中午之前布置完。小禾不想把“也许下午补货”当成中午前一定能拿到。","56":"天乐准备把布展任务交给下一位同伴。已兑换的材料有：灯架 6 分、记录本 4 分、彩带 2 分；原来共有 15 分，还剩 3 分备用。另一张“底板计划”写着：蓝底板 4 分、标签 4 分，使用另一笔专门的 8 分。工作人员还没签字确认这两件已经领到，不能把计划直接写成“已领取”。小禾建议交接卡分成“已经完成”和“还要确认”，并注明每笔积分属于哪张清单，免得算在一起。"},"questions":{"S03-1":{"day":3,"prompt":"哪盆在这段时间里长得更多？","options":["乙盆多长了 1 厘米。","两盆长得一样多。","甲盆多长了 1 厘米。"],"type":"choice","answer":2},"S03-2":{"day":3,"prompt":"如果想比较光照的影响，这次记录里哪个条件有意不同？","options":["两盆放置位置的光照。","两盆浇水量。","两盆使用的种子种类。"],"type":"choice","answer":0},"S03-3":{"day":3,"prompt":"仅凭这两盆苗的一次记录，能得出什么结论？","options":["所有植物在亮处一定长得更快。","这次甲盆长得更多，但还不能断言所有植物都如此。","因为最后一样高，所以光照没有任何影响。"],"type":"choice","answer":1},"S03-X":{"day":3,"prompt":"下次怎样补充观察，更有助于检查这个发现？","options":["只测量最后的高度，把开始高度省略。","换成不同种子和不同浇水量后，只比较最后高度。","用更多同类小苗重复比较，并继续记录起始与结束高度。"],"type":"choice","answer":2},"S04-1":{"day":4,"prompt":"机器人最少走几次，才能刚好到第 7 格？","options":["3 次","2 次","4 次"],"type":"choice","answer":0},"S04-2":{"day":4,"prompt":"哪一组动作能让它刚好停在第 7 格？","options":["3 格、3 格、3 格","2 格、2 格、3 格","2 格、2 格、2 格"],"type":"choice","answer":1},"S04-3":{"day":4,"prompt":"为什么不能只用两次就到第 7 格？","options":["因为每次都必须走 2 格。","因为打印台不在轨道上。","每次最多 3 格，两次最多 6 格。"],"type":"choice","answer":2},"S04-X":{"day":4,"prompt":"如果打印台改在第 8 格，从第 0 格出发最少要走几次？","options":["3 次","2 次","4 次"],"type":"choice","answer":0},"S05-1":{"day":5,"prompt":"钥匙在哪个盒子里？","options":["蓝盒","红盒","绿盒"],"type":"choice","answer":1},"S05-2":{"day":5,"prompt":"为什么蓝盒和绿盒的纸条恰有一句是真的？","options":["因为它们都贴在盒子上。","因为三只盒子颜色不同。","一句说在绿盒，一句说不在绿盒，两句正好相反。"],"type":"choice","answer":2},"S05-3":{"day":5,"prompt":"既然蓝、绿纸条中已有一句真，红盒纸条应当怎样？","options":["是假话，因此钥匙在红盒。","是真话，因此钥匙不在红盒。","真假无法判断，不能使用管理员的说明。"],"type":"choice","answer":0},"S05-X":{"day":5,"prompt":"如果其他内容不变，改成“三句话中恰好两句是真的”，钥匙可能在哪？","options":["只可能在红盒","可能在蓝盒或绿盒","三个盒子都可能"],"type":"choice","answer":1},"S06-1":{"day":6,"prompt":"如果第一趟要装两只袋子，哪种搭配符合条件？","options":["B 袋和 C 袋","A 袋和 C 袋","A 袋和 B 袋"],"type":"choice","answer":2},"S06-2":{"day":6,"prompt":"为什么不能按天乐的想法第一趟带 B 和 C？","options":["两袋总重 7 千克，超过 6 千克。","两袋加起来只有 5 千克。","规定第一趟不能运观察簿。"],"type":"choice","answer":0},"S06-3":{"day":6,"prompt":"拿到手套之前，应该怎样处理观察簿的袋子？","options":["立刻打开，否则不能上楼。","先保持封好，拿到手套后再打开。","只要两只袋子一起运，就可以不管这条叮嘱。"],"type":"choice","answer":1},"S06-X":{"day":6,"prompt":"如果限重改为 4 千克，仍要求第一趟运观察簿，下面哪种方式可行？","options":["第一趟运 A 袋和 B 袋。","第一趟运 B 袋和 C 袋。","第一趟只运 B 袋。"],"type":"choice","answer":2},"S07-1":{"day":7,"prompt":"这三次同样长的观察中，哪一次看到的数量最多？","options":["第二晚","第一晚","第三晚"],"type":"choice","answer":0},"S07-2":{"day":7,"prompt":"哪句展签既符合记录，也没有把一次观察说成普遍规律？","options":["只要有云，看到的星星就一定比没云时少。","这三次中第二晚看到的最多；是否与云有关还需继续观察。","三晚都看到了同样多的星星。"],"type":"choice","answer":1},"S07-3":{"day":7,"prompt":"如果想继续研究云量是否影响观测，哪种记录更有帮助？","options":["只记有云的夜晚，不记看到的数量。","只把第二晚的结果重复写三遍。","多记录几个夜晚的云量、观察时长和看到的数量。"],"type":"choice","answer":2},"S07-X":{"day":7,"prompt":"第四晚同样观察了 20 分钟，看到 4 颗。四晚一共记录了多少颗？","options":["13 颗","12 颗","14 颗"],"type":"choice","answer":0},"S08-1":{"day":8,"prompt":"如果大人确认山坡路面安全，哪个地方符合大家现在的计划？","options":["操场","屋顶","小山坡"],"type":"choice","answer":2},"S08-2":{"day":8,"prompt":"出发前，哪条新消息最能帮助决定能不能去山坡？","options":["大人刚检查过，雨后的坡道不滑。","白天有人看见屋顶上的鸟。","操场的灯晚上 8 点半才亮。"],"type":"choice","answer":0},"S08-3":{"day":8,"prompt":"把去山坡的安排按先后排好。","options":["到山坡观察夜空","请大人确认坡道安全","从集合点出发"],"type":"order","answer":[1,2,0]},"S08-X":{"day":8,"prompt":"如果只把步行上限改成 20 分钟，其他条件不变，又确认山坡安全，哪些地方符合计划？","options":["只有屋顶","操场和小山坡","三个地方都符合"],"type":"choice","answer":1},"S09-1":{"day":9,"prompt":"想先比较云量不同的两次记录，哪一组的观察时长相同？","options":["甲和乙","甲和丙","乙和丙"],"type":"choice","answer":0},"S09-2":{"day":9,"prompt":"哪些说法既符合记录，又没有把三次观察当成普遍规律？","options":["这三次证明云多时永远看不到星星。","甲比乙看到的多，但云量是不是原因还要继续观察。","丙看到 2 颗，说明观察时间不影响计数。"],"type":"choice","answer":1},"S09-3":{"day":9,"prompt":"下一次记录什么，最有助于继续研究？","options":["只写“看得多”或“看得少”","只记录看到的数量，其他都省略","记录多个夜晚的云量、观察时长、地点和数量"],"type":"choice","answer":2},"S09-X":{"day":9,"prompt":"如果有一张丁卡：同一地点、观察 20 分钟、云量记为 2、看到 3 颗，它说明什么？","options":["云量为 2 时每次一定看到 4 颗。","相同云量下记录到的数量也可能不同。","乙卡一定抄错了。"],"type":"choice","answer":1},"S10-1":{"day":10,"prompt":"按现在的限制，第一趟怎样装车可行？","options":["B 袋和 A 袋","B 袋和 C 袋","只运 B 袋"],"type":"choice","answer":2},"S10-2":{"day":10,"prompt":"如果第二趟要把 A、C 两袋都运走，是否符合限重？","options":["符合，总重正好 5 千克。","不符合，两袋总重 6 千克。","不符合，每趟只能运一袋。"],"type":"choice","answer":0},"S10-3":{"day":10,"prompt":"记录本袋送到后，哪种处理符合工作人员的要求？","options":["送到就立刻打开，不用等工作人员。","等工作人员到达后再打开。","只要手电也到了，就能提前打开。"],"type":"choice","answer":1},"S10-X":{"day":10,"prompt":"如果只把每趟限重提高到 6 千克，第一趟仍要运 B，哪种两袋搭配可行？","options":["B 和 C","A 和 C","A 和 B"],"type":"choice","answer":2},"S11-1":{"day":11,"prompt":"哪套方案按原安排能在截止时间前或恰好结束？","options":["只有甲方案","只有乙方案","两套方案都可以"],"type":"choice","answer":0},"S11-2":{"day":11,"prompt":"按甲方案，观察从什么时候开始？","options":["晚上 7 点 15 分","晚上 7 点 25 分","晚上 7 点 45 分"],"type":"choice","answer":1},"S11-3":{"day":11,"prompt":"甲方案如果临时多耽误 5 分钟、起点和其他时长都不变，会怎样？","options":["仍在 7:45 结束","7:40 就能结束","7:50 结束，会超过截止时间"],"type":"choice","answer":2},"S11-X":{"day":11,"prompt":"如果截止时间改为 7 点 50 分，起点和两个方案都不变，哪些方案可以按时结束？","options":["只有甲","只有乙","甲和乙都可以"],"type":"choice","answer":2},"S12-1":{"day":12,"prompt":"C 点不能经过时，哪条路线符合地图？","options":["S → B → D → T","S → A → D → T","S → B → C → T"],"type":"choice","answer":1},"S12-2":{"day":12,"prompt":"如果 C 点的积水处理好了，所有列出的连接都能走，不走回头路，一共有几条从 S 到 T 的路线？","options":["2 条","3 条","4 条"],"type":"choice","answer":1},"S12-3":{"day":12,"prompt":"如果 C、D 两点都不能经过，按这张地图还能到 T 吗？","options":["能，只要先走到 B。","能，从 A 直接到 T。","不能；到 T 的已列连接都要经过 C 或 D。"],"type":"choice","answer":2},"S12-X":{"day":12,"prompt":"如果 C 可以通行，但从 A 到 C 的那段路关闭，其他连接都可走，有几条不走回头路的路线？","options":["1 条","2 条","3 条"],"type":"choice","answer":1},"S13-1":{"day":13,"prompt":"现在还没有收到路面检查结果，团团应当怎么做？","options":["立即开始，因为没有闪电。","先等大人确认地面不滑。","直接取消整个观星夜，因为下过雨。"],"type":"choice","answer":1},"S13-2":{"day":13,"prompt":"大人确认地面不滑后，如果又出现闪电，应该怎样？","options":["暂停户外观察。","照常开始，因为地面已经确认。","只要下雨就能继续。"],"type":"choice","answer":0},"S13-3":{"day":13,"prompt":"收到哪条消息后，可以按安全卡开始？","options":["“地面还没检查，暂时没有闪电。”","“地面不滑，但远处刚出现闪电。”","“没有闪电，大人刚确认地面不滑。”"],"type":"choice","answer":2},"S13-X":{"day":13,"prompt":"雨停了、没有闪电，但大人说“路面正在检查，还不能确定”，这时呢？","options":["可以开始，因为雨已经停了。","继续等待路面确认。","可以开始，因为大人已经出发去检查。"],"type":"choice","answer":1},"S14-1":{"day":14,"prompt":"按通常的 10 分钟返程，既按时返回又观察最久，应选哪个方案？","options":["观察 15 分钟","观察 25 分钟","观察 35 分钟"],"type":"choice","answer":1},"S14-2":{"day":14,"prompt":"如果返程确定要 20 分钟，截止时间仍为 8:40，哪个方案能按时返回且观察最久？","options":["观察 15 分钟","观察 25 分钟","观察 35 分钟"],"type":"choice","answer":0},"S14-3":{"day":14,"prompt":"这次实际看到 3 颗，比团团猜的 6 颗少。哪句记录更准确？","options":["今天记录到 3 颗；数量比预想少，原因还需要更多信息。","今天只看到 3 颗，证明观察地点永远不适合观星。","既然猜的是 6 颗，就把记录改成 6 颗。"],"type":"choice","answer":0},"S14-X":{"day":14,"prompt":"如果返程只要 5 分钟，截止时间仍是 8:40，哪个方案能按时返回且观察最久？","options":["观察 15 分钟","观察 25 分钟","观察 35 分钟"],"type":"choice","answer":2},"S15-1":{"day":15,"prompt":"把已经记录的三件事按时间排好。","options":["6:12 收到第二段声音","6:04 收到第一段声音","6:06 调整天线"],"type":"order","answer":[1,2,0]},"S15-2":{"day":15,"prompt":"下面哪句只描述了记录，没有把原因或缺失的内容补进去？","options":["声音一定是因为天线才断续。","两段话合起来一定是“七点前到”。","调整天线后，音箱里的声音变清楚了。"],"type":"choice","answer":2},"S15-3":{"day":15,"prompt":"要弄清原话到底是什么，先查哪项最直接？","options":["联系发送者，核对两段原话和发送时间。","检查广播站桌子的颜色。","只根据“七点”和“见”补全句子。"],"type":"choice","answer":0},"S15-X":{"day":15,"prompt":"后来发现，6:03 广播站的音箱里也有杂音。现在可以确定什么？","options":["6:06 转天线肯定是杂音消失的唯一原因。","至少在 6:03，音箱里已经出现杂音。","发送者肯定要求大家七点前到。"],"type":"choice","answer":1},"S16-1":{"day":16,"prompt":"两张记录最明确的冲突是什么？","options":["记录的通话时间不同。","记录的集合地点不同。","一张说有人到场，另一张说没有人到场。"],"type":"choice","answer":1},"S16-2":{"day":16,"prompt":"仅凭这两张记录，哪种判断更稳妥？","options":["甲记录人一定在说谎。","乙记录人一定在说谎。","至少有一份文字记录不准确；原因还要核对。"],"type":"choice","answer":2},"S16-3":{"day":16,"prompt":"哪项新材料最有助于核对 6:04 的原话？","options":["保留完整声音的 6:04 原始录音。","第二天的天气预报。","某人对广播站装饰的记忆。"],"type":"choice","answer":0},"S16-X":{"day":16,"prompt":"如果甲改为记录 6:04 的东门，乙改为记录 6:09 的北门，又有 6:09 的改地点通知，怎样理解？","options":["两份记录一定相互矛盾。","两份记录可能分别记下了改动前和改动后的地点。","可以确定两处已经同时有人集合。"],"type":"choice","answer":1},"S17-1":{"day":17,"prompt":"“短闪、长闪”这一组表示什么？","options":["北门","西门","暂缓"],"type":"choice","answer":1},"S17-2":{"day":17,"prompt":"只知道一组解码结果是“西门”，能确定两次闪光的先后吗？","options":["能，一定先短后长。","能，一定先长后短。","不能；短长与长短都能得到 3。"],"type":"choice","answer":2},"S17-3":{"day":17,"prompt":"要发出“暂缓”，应使用哪组？","options":["短闪、短闪","短闪、长闪","长闪、长闪"],"type":"choice","answer":2},"S17-X":{"day":17,"prompt":"如果录像又显示：这组表示“西门”，并且第一下是长闪，那么第二下是什么？","options":["短闪","长闪","仍不能确定"],"type":"choice","answer":0},"S18-1":{"day":18,"prompt":"这次比较里，两边刻意使用了什么相同条件？","options":["同一段测试录音和音源设置。","同一个播放设备。","远端发送者说话时的天气。"],"type":"choice","answer":0},"S18-2":{"day":18,"prompt":"耳机清楚、音箱有杂音，下一步最有依据的方向是什么？","options":["优先检查音箱及其连接处。","断定远端话筒一定损坏。","断定广播内容已经完整无误。"],"type":"choice","answer":0},"S18-3":{"day":18,"prompt":"如果换用另一只音箱后声音清楚了，下面哪句最准确？","options":["原音箱或原来的连接处值得进一步检查。","远端所有设备永远不会再出问题。","所有曾经丢失的字都能自动恢复。"],"type":"choice","answer":0},"S18-X":{"day":18,"prompt":"如果同一测试音源经耳机和音箱都出现杂音，能立即确定只有音箱损坏吗？","options":["能，因为音箱也有杂音。","不能，还要检查两路共用的音源或连接。","能，因为耳机听到了杂音。"],"type":"choice","answer":1},"S19-1":{"day":19,"prompt":"方案甲：9 给发射器、6 给监听器、备用 5。方案乙：6 给发射器、5 给监听器、备用 9。哪些符合现有条件？","options":["只有甲","甲和乙都符合","只有乙"],"type":"choice","answer":1},"S19-2":{"day":19,"prompt":"如果要在符合现有条件时留下容量最大的备用电池，应怎样分配？","options":["6 给发射器，5 给监听器，备用 9。","9 给发射器，5 给监听器，备用 6。","5 给发射器，6 给监听器，备用 9。"],"type":"choice","answer":0},"S19-3":{"day":19,"prompt":"为什么不能把 5 给发射器、9 给监听器、备用 6？","options":["发射器至少需要 6 单位，5 不够。","监听器不能使用容量大于 5 的电池。","备用电池必须恰好是 5 单位。"],"type":"choice","answer":0},"S19-X":{"day":19,"prompt":"如果取消备用要求，新增一盏至少需要 3 单位的灯；三个设备仍各接一块电池，能同时运行吗？","options":["能：6 给发射器、5 给监听器、9 给灯。","不能：灯只能接容量恰好为 3 的电池。","不能：三块电池无法连接三个设备。"],"type":"choice","answer":0},"S20-1":{"day":20,"prompt":"第一次的记录直接说明什么？","options":["那两次分别辨认出 8 个字和 9 个字。","关窗在所有情况下都能多辨认一个字。","开窗一定是唯一影响听清字数的原因。"],"type":"choice","answer":0},"S20-2":{"day":20,"prompt":"哪种后续做法更有助于比较开窗状态？","options":["同位置、同设备、同录音，交替开关窗并多次记录。","开窗时换一个房间，关窗时换一台设备。","只记录最满意的一次，丢掉其他结果。"],"type":"choice","answer":0},"S20-3":{"day":20,"prompt":"如果重复测试里某次出现了与预期相反的结果，应先怎么做？","options":["保留该次记录，核对条件与记录方法。","直接删除，因为它不符合猜想。","只凭这一条就宣布原先所有记录无效。"],"type":"choice","answer":0},"S20-X":{"day":20,"prompt":"若三组开窗结果为 8、7、9，三组关窗结果也为 8、7、9，下面哪句合理？","options":["这几次记录没有显示两种状态的差别；还不能说明所有环境都一样。","已经证明开窗永远不会产生任何影响。","可以确定前一天的 8 和 9 都记录错了。"],"type":"choice","answer":0},"S21-1":{"day":21,"prompt":"哪句播报符合现有证据？","options":["负责人 6:09 通知改到北门；集合时间还在核实。","所有人今天七点已经到齐。","两条记录写了不同地点，所以一定有人故意撒谎。"],"type":"choice","answer":0},"S21-2":{"day":21,"prompt":"播报前若只能做一项核对，哪项最直接帮助确认集合时间？","options":["联系活动负责人，核对日期、时间和当前地点。","查询广播站成立年份。","根据“七点”自行补上日期。"],"type":"choice","answer":0},"S21-3":{"day":21,"prompt":"把播报前的步骤按合理顺序排好。","options":["把已核实事项和待确认事项分别写清楚","核对记录的时间和来源","播出，并在收到新消息后及时更正"],"type":"order","answer":[1,0,2]},"S21-X":{"day":21,"prompt":"如果负责人后来明确回复“今天 19:00 在北门”，接着又在 18:18 通知改为 19:10，怎样更新记录？","options":["保留先前记录，标明 18:18 的最新时间为 19:10。","删除所有先前记录，假装从未变更。","继续播报 19:00，不注明后来的通知。"],"type":"choice","answer":0},"S22-1":{"day":22,"prompt":"这 30 分钟里，哪个位置记录的水深下降得最多？","options":["东点","西点","南点"],"type":"choice","answer":0},"S22-2":{"day":22,"prompt":"下面哪句能由这两次测量直接支持？","options":["东点记录的水深下降了 3 厘米。","东点的排水设施一定比其他位置好。","南点的水一直没有流动。"],"type":"choice","answer":0},"S22-3":{"day":22,"prompt":"如果要研究水位变化的原因，哪项信息最有帮助？","options":["核对各点附近的排水口、地面和测量过程。","只记下水最浅的地点名称。","把中间没有测量的数都补成零。"],"type":"choice","answer":0},"S22-X":{"day":22,"prompt":"另一天同样用 30 分钟测量东点，水深从 7 厘米降到 4 厘米。与第一次相比，下降量怎样？","options":["两次一样，都是 3 厘米。","另一天多下降 1 厘米。","无法计算另一天的下降量。"],"type":"choice","answer":0},"S23-1":{"day":23,"prompt":"选哪两只，把它们的剩余空间都接满，新增水量正好是 7 升？","options":["大桶和中桶","大桶和小桶","中桶和小桶"],"type":"choice","answer":1},"S23-2":{"day":23,"prompt":"如果选大桶和中桶并都接满，会新增多少升？","options":["7 升","8 升","9 升"],"type":"choice","answer":2},"S23-3":{"day":23,"prompt":"为什么不能把大桶的全部 8 升都算成新增水量？","options":["其中 4 升原本已经在桶里。","大桶不能装超过 4 升。","大桶和中桶的容量一样。"],"type":"choice","answer":0},"S23-X":{"day":23,"prompt":"如果大桶原来已有 5 升，其他条件不变，恰好选两只并把剩余空间接满，能新增 7 升吗？","options":["能，选大桶和小桶。","能，选大桶和中桶。","不能，任何一对都不能正好新增 7 升。"],"type":"choice","answer":2},"S24-1":{"day":24,"prompt":"根据目前已经确认的信息，先考虑哪条可通行路线？","options":["经 A","经 B","经 C"],"type":"choice","answer":1},"S24-2":{"day":24,"prompt":"如果 A 路的门也被确认打开，C 路仍关闭，A、B 中哪条用时更短？","options":["A，10 分钟","B，10 分钟","两条都需要 11 分钟"],"type":"choice","answer":0},"S24-3":{"day":24,"prompt":"为什么现在不能直接安排最短的 C 路？","options":["C 路暂时关闭。","C 路需要 11 分钟。","所有路线都没有经过检查。"],"type":"choice","answer":0},"S24-X":{"day":24,"prompt":"如果 C 路后来由工作人员确认开放，其他数据不变，三条路线中哪条给定用时最短？","options":["A 路","B 路","C 路"],"type":"choice","answer":2},"S25-1":{"day":25,"prompt":"现在对三小时的总雨量，哪句有依据？","options":["至少是 5 毫米，准确总量仍未知。","正好是 5 毫米。","一定超过 5 毫米。"],"type":"choice","answer":0},"S25-2":{"day":25,"prompt":"第三小时的空格现在代表什么？","options":["没有足够信息确定它是零还是漏记。","一定没有下雨。","一定下了 1 毫米。"],"type":"choice","answer":0},"S25-3":{"day":25,"prompt":"哪项最直接有助于核实第三小时的雨量？","options":["查该小时的原始仪器记录。","查下一周的课程安排。","只重复抄写现有空格。"],"type":"choice","answer":0},"S25-X":{"day":25,"prompt":"如果核实另一份可靠汇总记录显示三小时总雨量为 7 毫米，第三小时是多少？","options":["0 毫米","2 毫米","5 毫米"],"type":"choice","answer":1},"S26-1":{"day":26,"prompt":"材料明确说明两次模型实验改变了什么？","options":["坡度","板的长度","用水量"],"type":"choice","answer":0},"S26-2":{"day":26,"prompt":"关于这两次测量，哪句正确？","options":["较大坡度那次用时 4 秒，比另一次少 2 秒。","这两次已经证明任何板面上都一样。","没有记录两次用时。"],"type":"choice","answer":0},"S26-3":{"day":26,"prompt":"哪种后续做法更能帮助继续比较？","options":["保持板面、长度和水量，重复两种坡度并记录每次结果。","同时换板面和水量，只记录最快的一次。","删掉较慢的一次，再下结论。"],"type":"choice","answer":0},"S26-X":{"day":26,"prompt":"如果下一次把坡度和板面同时改变，得到的时间不同，能只凭这次比较确定是坡度造成的吗？","options":["能，一定是坡度造成。","不能，板面变化也可能有影响。","能，因为每次都倒了水。"],"type":"choice","answer":1},"S27-1":{"day":27,"prompt":"在预算为 7 且必须满足路线开放条件时，应选哪组？","options":["安全门和桥板","桥板和照明灯","安全门和照明灯"],"type":"choice","answer":0},"S27-2":{"day":27,"prompt":"桥板和照明灯花费 6 个单位，为什么仍不能按材料开放路线？","options":["安全门尚未维修。","总费用超过预算。","桥板的费用是 6 个单位。"],"type":"choice","answer":0},"S27-3":{"day":27,"prompt":"如果先完成安全门和桥板，预算还剩多少？","options":["0 个单位","1 个单位","2 个单位"],"type":"choice","answer":0},"S27-X":{"day":27,"prompt":"如果预算增加到 9 个单位，费用和规则不变，能否三项都完成？","options":["能，三项共 9 个单位。","不能，三项共 10 个单位。","不能，因为照明灯永远不可选。"],"type":"choice","answer":0},"S28-1":{"day":28,"prompt":"哪句说明符合现有记录？","options":["东点那次下降 3 厘米；第三小时雨量仍待核实。","第三小时没有记录，所以一定没有下雨。","C 路暂时关闭，所以 A、B 路都关闭。"],"type":"choice","answer":0},"S28-2":{"day":28,"prompt":"想确认 A 路现在能否通行，哪项最直接？","options":["联系现场工作人员核实门和路线状态。","只看上周的天气预报。","把“未确认”改写成“已开放”。"],"type":"choice","answer":0},"S28-3":{"day":28,"prompt":"把写说明的步骤按顺序排好。","options":["分开写已知信息和待核实事项","核对记录的时间与来源","发布说明，并按新消息更正"],"type":"order","answer":[1,0,2]},"S28-X":{"day":28,"prompt":"如果工作人员后来确认 A 门已经打开，应怎样更新地图说明？","options":["保留旧记录，写明确认时间和新的状态。","删除所有旧记录，假装没有变化。","仍把 A 门写成已经关闭。"],"type":"choice","answer":0},"S29-2":{"day":29,"prompt":"C 应交给哪个组？","options":["播报组","造型组","后勤组"],"type":"choice","answer":2},"S29-3":{"day":29,"prompt":"为什么不能仅凭松动的“后勤组”标签认定 B 属于后勤组？","options":["标签没有固定在信封上，还要结合 B 不是后勤组的记录核对。","只要标签写着后勤组，就能知道它原来贴在 B 信封上。","A 属于播报组，所以不用其他记录就能确定 B 的归属。"],"type":"choice","answer":0},"S29-X":{"day":29,"prompt":"如果 A 仍交播报组，但 B“不是后勤组”的核对单尚未确认，B 的归属能唯一确定吗？","options":["能，一定是造型组。","不能，B 可能是造型组，也可能是后勤组。","能，一定是后勤组。"],"type":"choice","answer":1},"S30-2":{"day":30,"prompt":"A 到 C 关闭能否说明 C 一定到不了？","options":["能，因为所有通往 C 的连接都关闭。","不能，还可以由 S 经 B 到 C。","能，因为 B 不连接 C。"],"type":"choice","answer":1},"S30-3":{"day":30,"prompt":"若 10:00 时只有 B 到 D 的门按时开放，其他状态不变，哪些完整路线可用？","options":["只有 S → B → C → T","S → B → C → T 和 S → B → D → T","三条选项里的路线都可用"],"type":"choice","answer":1},"S30-X":{"day":30,"prompt":"如果 9:30 时 B 到 C 也临时关闭，而其余状态都不变，给定连接中还有通向 T 的路线吗？","options":["有，S → A → C → T。","有，S → B → D → T。","没有，三种通向 T 的给定路线都受阻。"],"type":"choice","answer":2},"S31-2":{"day":31,"prompt":"如果 9:40 出发且三段用时不变，预计几点到达？","options":["9:55","10:00","10:05"],"type":"choice","answer":2},"S31-3":{"day":31,"prompt":"为什么不能只把两段步行时间相加来判断能否准时？","options":["中转点还要花 5 分钟整理资料。","整理资料要等到到达 T 之后才开始。","整理的 5 分钟已经包含在第一段 12 分钟里。"],"type":"choice","answer":0},"S31-X":{"day":31,"prompt":"如果在 H 还必须等待 3 分钟，其他时间和截止时刻不变，最晚几点出发？","options":["9:32","9:35","9:38"],"type":"choice","answer":0},"S32-1":{"day":32,"prompt":"9:10 时，根据记录由谁保管包裹？","options":["阿宁","小禾","天乐"],"type":"choice","answer":1},"S32-2":{"day":32,"prompt":"天乐第一次拿到包裹和签字登记分别是什么时候？","options":["9:14 拿到，9:20 签字。","9:20 拿到，9:14 签字。","都是 9:20。"],"type":"choice","answer":0},"S32-3":{"day":32,"prompt":"假设发现一条可靠的新交接记录，与原记录有冲突。哪条会改变对 9:10 保管人的判断？","options":["小禾 9:08 把包裹交回阿宁，9:12 再取回。","小禾 9:11 把包裹交回阿宁，9:13 再取回。","天乐 9:15 把包裹暂交小禾，9:19 再取回。"],"type":"choice","answer":0},"S32-X":{"day":32,"prompt":"如果后来确认 9:08 交回、9:12 取回的新增记录准确，且其余交接不变，9:10 由谁保管？","options":["阿宁","小禾","天乐"],"type":"choice","answer":0},"S33-2":{"day":33,"prompt":"为什么三件物品不能在一趟运完？","options":["总重 7 千克，超过 5 千克上限。","A 和 B 合计 5 千克，已经超过 5 千克上限。","A 要第一趟到，说明不能和其他物品同车。"],"type":"choice","answer":0},"S33-3":{"day":33,"prompt":"如果第一趟只运 A，第二趟把 B、C 一起运走，是否可行？","options":["可行，第二趟是 4 千克。","不可行，第二趟是 6 千克。","不可行，A 必须与 B 同一趟。"],"type":"choice","answer":0},"S33-X":{"day":33,"prompt":"如果每趟上限改为 4 千克，A 仍须第一趟送到，最少能用几趟运完？","options":["两趟：第一趟 A，第二趟 B 和 C。","三趟：每趟只能运一件。","一趟：三件总重不超过 4 千克。"],"type":"choice","answer":0},"S34-2":{"day":34,"prompt":"为什么原先“第一趟 A 和 B，第二趟 C”的安排现在不行？","options":["B 比 C 先到，不符合新规则。","B 和 C 同一趟到达，没有满足严格先后。","C 比 B 先到，但第一趟重量超过 5 千克。"],"type":"choice","answer":0},"S34-3":{"day":34,"prompt":"第一趟只运 A，第二趟一起运 B 和 C，为什么也不符合新规则？","options":["B 和 C 同一趟到达，属于同时。","第二趟总重 7 千克。","A 必须最后到。"],"type":"choice","answer":0},"S34-X":{"day":34,"prompt":"如果新规则改为“B 不得早于 C”，其他条件不变，第一趟 A、第二趟 B 和 C 的安排怎样？","options":["可行：B 与 C 同时到达，不早于 C。","不可行：B 与 C 必须先后到达。","不可行：第二趟重 7 千克。"],"type":"choice","answer":0},"S35-1":{"day":35,"prompt":"哪句说明最符合现有记录？","options":["A 记录为 9:05 送达，C 在 9:15 签收，B 签收状态待核实。","三件都已签收。","B 一定丢失。"],"type":"choice","answer":0},"S35-2":{"day":35,"prompt":"为什么不能把 B 的空白签收栏直接解释成“包裹丢失”？","options":["没有填写也可能是漏记，需要核实。","没有填写一定表示已经签收。","B 的签收时间已经写明。"],"type":"choice","answer":0},"S35-3":{"day":35,"prompt":"哪项下一步最直接？","options":["联系 B 的接收方并核对交接单。","查看 A 的送达时间，用它补全 B 的签收栏。","只核对 C 的签收时间，就能确定 B 是否签收。"],"type":"choice","answer":0},"S35-X":{"day":35,"prompt":"如果 B 的接收方后来确认 9:18 已签收，应该怎样更新？","options":["保留原来未填写的记录，补记确认来源和 9:18 签收时间。","删除原记录并假装从未缺失。","仍宣布 B 一定丢失。"],"type":"choice","answer":0},"S36-1":{"day":36,"prompt":"两次记录之间，哪根棒子的影子长度增加得更多？","options":["甲棒","乙棒","两根增加一样多"],"type":"choice","answer":0},"S36-2":{"day":36,"prompt":"从这些记录中能直接知道什么？","options":["甲在第二次测量时的影长是 9 厘米。","甲在两次测量之间每一分钟都变长。","乙的影子在所有时刻都比甲长。"],"type":"choice","answer":0},"S36-3":{"day":36,"prompt":"小禾只抄下了第二次的 9 和 10。要判断哪根影子增加得更多，她还要查什么？","options":["两根影子第一次的长度。","两根小棒各有多高。","两次测量相隔多少分钟。"],"type":"choice","answer":0},"S36-X":{"day":36,"prompt":"如果另一次记录中甲从 5 厘米变到 9 厘米，乙从 6 厘米变到 10 厘米，这次两者增加量怎样？","options":["甲更多","乙更多","一样多"],"type":"choice","answer":2},"S37-2":{"day":37,"prompt":"如果先比较屏距不同、灯距相同的两次，应选哪一对？","options":["甲和乙","甲和丙","乙和丙"],"type":"choice","answer":2},"S37-3":{"day":37,"prompt":"为什么甲和丙不适合只研究灯距变化？","options":["灯距和屏距都不同。","两次的灯距完全相同。","材料没有给出甲和丙的距离。"],"type":"choice","answer":0},"S37-X":{"day":37,"prompt":"如果新增丁卡：灯距 30 厘米、屏距 30 厘米，其他设置相同，哪一对适合先比较灯距？","options":["甲和丁","丙和丁","乙和丙"],"type":"choice","answer":1},"S38-1":{"day":38,"prompt":"现在能确定乙的影长是多少吗？","options":["能，一定是 9 厘米。","能，一定是 0 厘米。","不能，乙的记录需要核实。"],"type":"choice","answer":2},"S38-2":{"day":38,"prompt":"哪条说法目前有依据？","options":["甲和丙记录的影长分别为 8 和 10 厘米。","乙一定比甲长。","三次的平均长度一定是 9 厘米。"],"type":"choice","answer":0},"S38-3":{"day":38,"prompt":"哪项最直接帮助核实乙？","options":["查与乙的时间和实验卡一致的原始记录。","查同一天任意一次写着 9 厘米的记录。","查第二天使用相同纸片的新记录。"],"type":"choice","answer":0},"S38-X":{"day":38,"prompt":"如果可靠记录后来确认三次影长的平均值是 9 厘米，乙是多少厘米？","options":["8","9","10"],"type":"choice","answer":1},"S39-1":{"day":39,"prompt":"要先比较纸片类型的影响，哪种安排更合适？","options":["保持灯和位置等条件相同，只更换纸片。","换纸片的同时移动灯和屏幕。","两次都用甲纸片，只改变灯的位置。"],"type":"choice","answer":0},"S39-2":{"day":39,"prompt":"如果换纸片的同时移动了灯，结果发生变化，能只凭这次实验确定原因是纸片吗？","options":["能，因为纸片也换了。","不能，灯的位置变化也可能有影响。","能，因为两次都使用了屏幕。"],"type":"choice","answer":1},"S39-3":{"day":39,"prompt":"为了让下次能复核实验，哪种记录更有帮助？","options":["写下纸片、灯和屏幕位置，以及观察到的影子。","写下影子的样子和测量时间，位置凭记忆。","写下灯的位置和纸片类型，影子的样子凭记忆。"],"type":"choice","answer":0},"S39-X":{"day":39,"prompt":"如果两张纸片大小也不同，想继续只比较透光程度，下一步怎样改更合适？","options":["换成大小相同但透光程度不同的纸片。","继续使用不同大小的纸片并忽略大小。","把灯移到不同位置。"],"type":"choice","answer":0},"S40-1":{"day":40,"prompt":"发现 4 厘米与其他三次差别较大，先怎么做更合适？","options":["保留记录并核对那次的条件与测量方法。","直接删除 4，因为它与其他数不同。","把 4 改成 10，让数据一致。"],"type":"choice","answer":0},"S40-2":{"day":40,"prompt":"目前能确定 4 厘米一定记录错了吗？","options":["能，因为其他三次更接近。","不能，还缺少核对那次的证据。","不能，先把 4 换成前三次的平均数就可以了。"],"type":"choice","answer":1},"S40-3":{"day":40,"prompt":"如果后来找到记录：第四次尺的起点放错了位置，下一步应怎样处理？","options":["保留原记录，注明核查结果，并按约定重新测量。","悄悄删除原记录，不留说明。","把所有四次记录都当作无效。"],"type":"choice","answer":0},"S40-X":{"day":40,"prompt":"把 10、10、11、4 从小到大排列。四个数的“中位数”按中间两个数的平均数计算，是多少？","options":["7","10","11"],"type":"choice","answer":1},"S41-2":{"day":41,"prompt":"采用穿插顺序后，能否保证所有其他影响都已经排除？","options":["能，顺序一改变就保证排除所有影响。","不能，仍需记录和核对其他条件。","能，因此不必记录结果。"],"type":"choice","answer":1},"S41-3":{"day":41,"prompt":"如果一次试验与其他结果不同，计划表应怎么记录？","options":["保留结果并写下当时条件，之后再核查。","只保留最接近预期的结果。","直接用上一次结果代替。"],"type":"choice","answer":0},"S41-X":{"day":41,"prompt":"如果用“乙、甲、甲、乙”的顺序，是否也满足每种两次、前后各有两种的条件？","options":["满足","不满足，因为必须从甲开始","不满足，因为乙出现两次"],"type":"choice","answer":0},"S42-1":{"day":42,"prompt":"哪句话适合写在“本次记录”里？","options":["甲、乙条件下分别记录到 6 和 9 厘米。","所有环境下乙都一定比甲长 3 厘米。","两次结果证明其他条件永远没有影响。"],"type":"choice","answer":0},"S42-2":{"day":42,"prompt":"哪项适合写在“下一步核查”里？","options":["在记录条件的基础上重复试验，再比较结果。","只重做甲设置，用新结果和原来的乙比较。","两种设置各重做一次，同时换一种纸片和一盏灯。"],"type":"choice","answer":0},"S42-3":{"day":42,"prompt":"如果有人提出“灯距可能影响影长”，展签上应怎样标记？","options":["放在“猜测”一栏，再写出准备怎样比较。","放在“本次记录”一栏，和两个长度写在一起。","放在“下一步”一栏，不再写具体试验安排。"],"type":"choice","answer":0},"S42-X":{"day":42,"prompt":"如果重复测量后，甲分别为 6、7 厘米，乙分别为 9、8 厘米，哪句合理？","options":["这几次中乙的记录都比甲对应的记录长；仍不代表所有环境都如此。","已经证明乙在任何环境下一定更长。","可以确定第一次的两条记录都是假的。"],"type":"choice","answer":0},"S43-1":{"day":43,"prompt":"按顺序执行两条规则后，盒子显示多少？","options":["8","10","12"],"type":"choice","answer":1},"S43-2":{"day":43,"prompt":"执行第二条规则时，应该把哪个数乘 2？","options":["最初的 3","第一步得到的 5","两条规则的次数 2"],"type":"choice","answer":1},"S43-3":{"day":43,"prompt":"如果只执行第一条规则，盒子会显示什么？","options":["3","5","10"],"type":"choice","answer":1},"S43-X":{"day":43,"prompt":"如果初始数改为 4，两条规则及顺序不变，结果是多少？","options":["10","12","14"],"type":"choice","answer":1},"S44-1":{"day":44,"prompt":"绿灯、盖子打开时，按规则显示什么？","options":["可以继续","先等待","无法判断灯的颜色"],"type":"choice","answer":1},"S44-2":{"day":44,"prompt":"哪种状态满足“绿灯并且盖子合上”？","options":["绿灯、盖子合上","绿灯、盖子打开","红灯、盖子合上"],"type":"choice","answer":0},"S44-3":{"day":44,"prompt":"红灯、盖子打开时，按原规则显示什么？","options":["可以继续","先等待","两种结果同时显示"],"type":"choice","answer":1},"S44-X":{"day":44,"prompt":"如果规则改成“绿灯或者盖子合上就可以继续”，绿灯、盖子打开时显示什么？","options":["可以继续","先等待","没有给出规则"],"type":"choice","answer":0},"S45-1":{"day":45,"prompt":"初始数为 3 时，甲和乙的结果分别是多少？","options":["甲 10，乙 8","甲 8，乙 10","甲、乙都是 10"],"type":"choice","answer":0},"S45-2":{"day":45,"prompt":"团团“结果一定一样”的说法能否被这次记录支持？","options":["能，两次都使用了同样的操作。","不能，给定初始数下两种顺序得到 10 和 8。","能，因为两个方案都从 3 开始。"],"type":"choice","answer":1},"S45-3":{"day":45,"prompt":"甲方案执行完第一步时，盒子里的数是多少？","options":["3","5","6"],"type":"choice","answer":1},"S45-X":{"day":45,"prompt":"如果初始数改为 4，甲、乙方案各执行一次，结果差多少？","options":["0","2","4"],"type":"choice","answer":1},"S46-2":{"day":46,"prompt":"为什么显示 10 时不再继续？","options":["10 已达到停止条件。","10 小于 10。","规则要求必须再加一次。"],"type":"choice","answer":0},"S46-3":{"day":46,"prompt":"执行两次“加 3”后，盒子显示多少？","options":["4","7","10"],"type":"choice","answer":1},"S46-X":{"day":46,"prompt":"如果停止条件改为“当前数大于 10”，其余不变，需要执行几次？","options":["3 次","4 次","5 次"],"type":"choice","answer":1},"S47-1":{"day":47,"prompt":"绿灯已确认，盖子尚未检查时，按这张卡显示什么？","options":["可以继续","先等待，盖子已确认没合上","待核实"],"type":"choice","answer":2},"S47-2":{"day":47,"prompt":"如果后来确认盖子没有合上，记录中的状态应怎样写？","options":["否","尚未确认","是"],"type":"choice","answer":0},"S47-3":{"day":47,"prompt":"为什么不能把未检查直接记成“否”？","options":["未检查不能说明实际状态。","所有未检查的状态都是“是”。","这张卡没有“否”的选项。"],"type":"choice","answer":0},"S47-X":{"day":47,"prompt":"如果灯后来也变成“尚未确认”，盖子确认合上，按这张卡应显示什么？","options":["可以继续","待核实","先等待，灯已确认不是绿"],"type":"choice","answer":1},"S48-1":{"day":48,"prompt":"哪张卡是“所有蓝色卡都是圆形”的反例？","options":["甲：蓝色圆形","乙：红色方形","丙：蓝色三角形"],"type":"choice","answer":2},"S48-2":{"day":48,"prompt":"为什么红色方形的乙不是这句话的反例？","options":["它不是蓝色卡，原话只讨论蓝色卡。","它是圆形。","它没有颜色。"],"type":"choice","answer":0},"S48-3":{"day":48,"prompt":"找到丙之后，能确定“所有卡都是三角形”吗？","options":["能，因为丙是三角形。","不能，甲和乙并不是三角形。","能，因为丙是蓝色。"],"type":"choice","answer":1},"S48-X":{"day":48,"prompt":"如果又有一张蓝色圆形的丁卡，团团原话是否因此变成正确？","options":["是，因为丁支持原话。","否，丙仍是蓝色三角形。","是，因为现在有两张圆形卡。"],"type":"choice","answer":1},"S49-2":{"day":49,"prompt":"为什么“蓝色或者方形就送出”不符合样例？","options":["蓝色圆形和红色方形也会被送出。","蓝色方形不会被送出。","三张样例都没有颜色。"],"type":"choice","answer":0},"S49-3":{"day":49,"prompt":"三张样例都符合修改后的规则，是否证明所有未给出的情况也已经核实？","options":["是，不需要再检查。","否，尚未给出的情况仍需进一步确认。","是，因为三张样例都有形状。"],"type":"choice","answer":1},"S49-X":{"day":49,"prompt":"若后来确认红色圆形也不送出，蓝色并且方形规则是否与这条新样例一致？","options":["一致，红色圆形不同时满足两项。","不一致，红色圆形同时满足两项。","无法运行，因为没有规则。"],"type":"choice","answer":0},"S50-1":{"day":50,"prompt":"保留 3 节备用后，最多能同时装好几支手电？","options":["3 支","4 支","5 支"],"type":"choice","answer":0},"S50-2":{"day":50,"prompt":"装好最多的手电后，桌上还没装进手电的电池怎样记录？","options":["备用 3 节，另外剩 1 节。","备用 1 节，另外剩 3 节。","备用 3 节，没有其他剩余。"],"type":"choice","answer":0},"S50-3":{"day":50,"prompt":"团团想让 4 支手电同时亮着，又不动备用的 3 节。至少还需要补几节？","options":["1 节","2 节","3 节"],"type":"choice","answer":0},"S50-X":{"day":50,"prompt":"若总数仍是 10 节，备用要求改成至少 4 节，最多的手电数量会怎样？","options":["仍是 3 支","变成 2 支","变成 4 支"],"type":"choice","answer":0},"S51-1":{"day":51,"prompt":"按故事中的两种拿法，谁正好拿到 6 张卡片？","options":["只有小禾","只有团团","两人都拿到了"],"type":"choice","answer":2},"S51-2":{"day":51,"prompt":"还要满足运输盘最多摆 2 盒，哪一种拿法可一次运完？","options":["2 盒甲包","3 盒乙包","两种拿法都可一次运完"],"type":"choice","answer":0},"S51-3":{"day":51,"prompt":"团团改成拿 1 盒甲包和 1 盒乙包。这次哪里还不符合要求？","options":["有 2 盒但只有 5 张。","有 6 张但超过 2 盒。","有 5 张且超过 2 盒。"],"type":"choice","answer":0},"S51-X":{"day":51,"prompt":"如果需求改成 5 张、最多仍运 2 盒，而且不能多拿，怎样取？","options":["1 盒甲包和 1 盒乙包","2 盒甲包","2 盒乙包"],"type":"choice","answer":0},"S52-2":{"day":52,"prompt":"有人提出买 2 包四张装，理由是每包的单张价格低。这符合本次要求吗？","options":["符合，总积分只要 10 分。","不符合，会拿到 8 张。","不符合，只会拿到 4 张。"],"type":"choice","answer":1},"S52-3":{"day":52,"prompt":"如果只能花 7 分，在原价格下能正好拿到 6 张吗？","options":["能，用 1 包四张装加 2 张单张。","能，用 2 包两张装加 2 张单张。","不能，最便宜也要 8 分。"],"type":"choice","answer":2},"S52-X":{"day":52,"prompt":"若四张包涨到 7 分，其他价格不变，正好兑换 6 张，至少要花多少积分？","options":["8 分","9 分","10 分"],"type":"choice","answer":1},"S53-1":{"day":53,"prompt":"买好两件必需品并留下至少 3 分，最多还能花几分买装饰？","options":["2 分","3 分","5 分"],"type":"choice","answer":0},"S53-2":{"day":53,"prompt":"如果想选一种装饰，哪件符合全部要求？","options":["彩带","贴纸","海报"],"type":"choice","answer":0},"S53-3":{"day":53,"prompt":"团团选海报时，哪一项要求被漏掉了？","options":["必须兑换灯架。","必须兑换记录本。","至少留 3 分备用。"],"type":"choice","answer":2},"S53-X":{"day":53,"prompt":"如果积分增加到 16 分，其他条件不变，彩带和贴纸都能单独选择吗？","options":["都能","只能选彩带","两件都不能"],"type":"choice","answer":0},"S54-2":{"day":54,"prompt":"蓝底板加红底板也只花 8 分，为什么还不能完成任务？","options":["缺少说明标签。","总花费超过 8 分。","两张底板都不能使用。"],"type":"choice","answer":0},"S54-3":{"day":54,"prompt":"小禾和团团用了不同颜色的底板，怎样判断两人是否都完成了任务？","options":["只看颜色是否与小禾的一样。","分别核对底板、标签和总花费。","只看两人是否都花完 8 分。"],"type":"choice","answer":1},"S54-X":{"day":54,"prompt":"如果红底板改为 5 分，蓝底板和标签仍各 4 分，限额仍是 8 分，哪种方案还能用？","options":["蓝底板加标签","红底板加标签","两种都能"],"type":"choice","answer":0},"S55-1":{"day":55,"prompt":"按已确认的信息，哪种方案能在中午前拿齐材料并符合限额？","options":["蓝底板加标签","等下午红底板补货再拿标签","按昨天清单直接领红底板"],"type":"choice","answer":0},"S55-2":{"day":55,"prompt":"原来的红底板方案现在主要在哪里失效？","options":["金额变成了 9 分。","已确认的当前库存不支持它。","说明标签改成了必需品。"],"type":"choice","answer":1},"S55-3":{"day":55,"prompt":"如果记录这次换方案，哪种写法能说清楚原因？","options":["红方案算错了，所以永远不用红色。","今天红底板缺货，改用同价蓝底板，仍在中午前完成。","红底板已经补货，所以改成蓝色。"],"type":"choice","answer":1},"S55-X":{"day":55,"prompt":"如果后来在上午确认红底板已经到柜台，价格仍为 4 分，截止时间也来得及，原来的红方案是否可以重新考虑？","options":["可以，仍要按当前库存和时间核对。","不可以，任何放弃过的方案都不能再用。","不可以，红底板一定会比蓝色更贵。"],"type":"choice","answer":0},"S56-1":{"day":56,"prompt":"第一笔 15 分的账目，哪种写法能对上？","options":["已用 12 分，备用 3 分。","已用 10 分，备用 5 分。","已用 20 分，还差 5 分。"],"type":"choice","answer":0},"S56-2":{"day":56,"prompt":"底板和标签应怎样写进交接卡？","options":["已领取两件，因为计划金额正好是 8 分。","计划兑换两件，领取结果待确认。","确定没有领取，因为没有签字。"],"type":"choice","answer":1},"S56-3":{"day":56,"prompt":"下一位同伴要确认底板任务是否完成，最直接应查什么？","options":["这两件的领取记录或柜台确认。","第一笔预算的彩带价格。","昨天有没有红底板。"],"type":"choice","answer":0},"S56-X":{"day":56,"prompt":"如果领取记录确认只拿到了蓝底板、花了 4 分，专用的 8 分预算还剩多少，接下来缺什么？","options":["剩 4 分，缺标签。","剩 3 分，缺彩带。","剩 0 分，两件都拿到了。"],"type":"choice","answer":0}}},esc=E;
  const state={day:0,question:0,robot:0,bags:[],box:null,message:'',explorationEver:false};
  let key=null,visible=false;
  function button(action,label,attrs='',classes=''){
   const style=classes.includes('speak')?'rd-option-speak':classes.includes('choice')?'rd-option'+(classes.includes('selected')?' rd-selected':''):'rd-button';
   return outerButton('rdExploreAction',label,`data-sub-action="${E(action)}" ${attrs}`,style);
  }
  function currentRecord(){return {help:[]};}
  function say(text,kind){const c=engine.current();if(c&&!c.session.paused)speech.speak(text,{kind:kind==='option'?'option':'question',sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,elementKey:hash(text)});}
  function futureActivity(){return '';}
   function activity(){if(state.day===2)return `<div class="activity"><h3>${rt('两盆苗的记录')}</h3><p>${rt('甲盆：开始 4 厘米，后来 7 厘米。')}</p><p>${rt('乙盆：开始 5 厘米，后来 7 厘米。')}</p></div>`;
 if(state.day===3)return `<div class="activity"><h3>${rt('让机器人试着走一走')}</h3><div class="track">${Array.from({length:state.question===3?9:8},(_,i)=>`<span class="cell ${i===state.robot?'active':''}">${i}</span>`).join('')}</div><p>${rt('现在在第 '+state.robot+' 格')}</p><div class="nav">${button('move','走 2 格','data-amount="2"')}${button('move','走 3 格','data-amount="3"')}${button('resetRobot','重新开始')}</div></div>`;
 if(state.day===4){const truth=state.box===null?'':(() =>{const k=['红','蓝','绿'][state.box],facts=[k!=='红',k==='绿',k!=='绿'];return `<p>${rt('假设钥匙在'+k+'盒，三张纸条依次是：'+facts.map(v=>v?'真':'假').join('、'))}</p>`})();return `<div class="activity"><h3>${rt('试着假设钥匙的位置')}</h3><div class="nav">${['红','蓝','绿'].map((x,i)=>button('box','假设在'+x+'盒',`data-index="${i}"`)).join('')}</div>${truth}</div>`;}
 if(state.day===5){const weight=state.bags.reduce((a,i)=>a+[2,3,4][i],0);return `<div class="activity"><h3>${rt('把袋子放上升降机')}</h3><div class="nav">${['A 袋 2 千克','B 袋 3 千克','C 袋 4 千克'].map((x,i)=>button('bag',x,`data-index="${i}" aria-pressed="${state.bags.includes(i)}"`,state.bags.includes(i)?'selected':'')).join('')}</div><p>${rt('已放 '+state.bags.length+' 只，总重 '+weight+' 千克。')}</p></div>`;}
 if(state.day===6)return `<div class="activity"><h3>${rt('三晚观察记录')}</h3>${(state.question===3?[3,5,1,4]:[3,5,1]).map((n,i)=>`<div class="bar-row"><span>${rt('第 '+(i+1)+' 晚')}</span><div class="bar" style="width:${n*12}%"></div><span>${n}</span></div>`).join('')}</div>`;
 if(state.day>=56)return futureActivity();
 if(state.day>=49)return week8Activity();
 if(state.day>=42)return week7Activity();
 if(state.day>=35)return week6Activity();
 if(state.day>=28)return week5Activity();
 if(state.day>=21)return week4Activity();
 if(state.day>=14)return week3Activity();
 if(state.day>=7)return v3Activity();
 return '';}

  // Exploratory boards for days 8-14. They are support, not independent answers.
function v3Activity(){
 if(state.day===7){
  const rows=[['操场','步行 20 分钟，视野开阔，灯在 8 点半亮。'],['屋顶','步行 10 分钟，一半天空被遮住。'],['小山坡','步行 15 分钟，视野开阔；雨后须确认坡道不滑。']];
  return `<div class="activity"><h3>${rt('地点比较板')}</h3><p>${rt('点一个地方，查看记录。')}</p><div class="nav">${rows.map((row,i)=>button('v3Place',row[0],`data-index="${i}" aria-pressed="${state.place===i}"`)).join('')}</div>${state.place===null?'':`<p data-v3-place>${rt(rows[state.place][1])}</p>`}</div>`;
 }
 if(state.day===8){
  const rows=['甲：20 分钟，云量 2，看到 4 颗。','乙：20 分钟，云量 7，看到 2 颗。','丙：10 分钟，云量 2，看到 2 颗。'];
  return `<div class="activity"><h3>${rt('观察卡对照')}</h3><p>${rt('最多选两张卡，并排比较。')}</p><div class="nav">${['甲卡','乙卡','丙卡'].map((label,i)=>button('v3Card',label,`data-index="${i}" aria-pressed="${state.cards.includes(i)}"`)).join('')}</div><div data-v3-cards>${state.cards.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;
 }
 if(state.day===9){
  const weights=[2,4,3],total=state.bags.reduce((n,i)=>n+weights[i],0),limit=state.question===3?6:5;
  return `<div class="activity"><h3>${rt('装车试一试')}</h3><div class="nav">${['A 袋 2 千克','B 袋 4 千克','C 袋 3 千克'].map((label,i)=>button('v3Bag',label,`data-index="${i}" aria-pressed="${state.bags.includes(i)}"`)).join('')}</div><p data-v3-weight>${rt('已选 '+state.bags.length+' 袋，总重 '+total+' 千克；本题限重 '+limit+' 千克。'+(total>limit?'超出 '+(total-limit)+' 千克。':''))}</p></div>`;
 }
 if(state.day===10){
  const plans=[[10,5,10,20],[5,10,15,20]],labels=['布置','检查','介绍','观察'];
  let text='';
  if(state.schedule!==null){let minute=0;const clock=m=>'7:'+String(m).padStart(2,'0');text=plans[state.schedule].map((n,i)=>{const start=minute;minute+=n;return `<p>${rt(labels[i]+'：'+clock(start)+' 到 '+clock(minute)+'。')}</p>`}).join('')}
  return `<div class="activity"><h3>${rt('时间线拼板')}</h3><p>${rt('选择一套计划，查看各阶段时间。')}</p><div class="nav">${['甲方案','乙方案'].map((label,i)=>button('v3Schedule',label,`data-index="${i}" aria-pressed="${state.schedule===i}"`)).join('')}</div><div data-v3-schedule>${text}</div></div>`;
 }
 if(state.day===11){
  const graph={S:['A','B'],A:['C','D'],B:['C'],C:['T'],D:['T'],T:[]};
  const blocked=state.question===0?'本题 C 点积水。':state.question===2?'本题 C、D 都不能经过。':state.question===3?'本题 A 到 C 的路关闭。':'本题列出的连接都可走。';
  return `<div class="activity"><h3>${rt('路线板')}</h3><p>${rt('连接：S 到 A 或 B；A 到 C 或 D；B 到 C；C、D 到 T。')}</p><p>${rt(blocked)}</p><p data-v3-route>${esc(state.path.join(' → '))}</p><div class="nav">${['A','B','C','D','T'].map(n=>button('v3Route',n,`data-node="${n}"`)).join('')}${button('v3UndoRoute','撤回一步')}${button('v3ResetRoute','重新开始')}</div></div>`;
 }
 if(state.day===12){
  const status=state.lightning==='yes'?'出现闪电，暂停户外观察。':state.lightning==='no'&&state.ground==='safe'?'两项条件已满足，可以按安全卡开始。':'还有条件未确认，先等一等。';
  return `<div class="activity"><h3>${rt('安全卡试验')}</h3><p>${rt('先分别选择闪电和路面状态。')}</p><div class="nav">${button('v3Light','没有闪电','data-value="no"')}${button('v3Light','出现闪电','data-value="yes"')}${button('v3Ground','大人确认不滑','data-value="safe"')}${button('v3Ground','路面未确认','data-value="unknown"')}</div><p data-v3-safety>${rt(status)}</p></div>`;
 }
 if(state.day===13){
  const back=state.tripReturn??(state.question===1?20:state.question===3?5:10),finish=state.observe===null?null:state.observe+back;
  return `<div class="activity"><h3>${rt('观星和返程计划卡')}</h3><p>${rt('选择观察和返程时长。')}</p><div class="nav">${[15,25,35].map(n=>button('v3Observe','观察 '+n+' 分钟',`data-value="${n}" aria-pressed="${state.observe===n}"`)).join('')}</div><div class="nav">${[5,10,20].map(n=>button('v3Return','返程 '+n+' 分钟',`data-value="${n}" aria-pressed="${back===n}"`)).join('')}</div><p data-v3-trip>${rt(finish===null?'先选择观察时间。':'从 8 点开始，预计 8 点 '+finish+' 分回到集合点。')}</p></div>`;
 }
 return '';
}
function v3Handle(a,b,i){
 if(!a.startsWith('v3'))return false;
 const record=currentRecord();state.explorationEver=true;record.help.push({type:'explore',activity:a});
 if(a==='v3Place')state.place=i;
 else if(a==='v3Card')state.cards=state.cards.includes(i)?state.cards.filter(x=>x!==i):[...state.cards,i].slice(-2);
 else if(a==='v3Bag')state.bags=state.bags.includes(i)?state.bags.filter(x=>x!==i):[...state.bags,i];
 else if(a==='v3Schedule')state.schedule=i;
 else if(a==='v3Route'){
  const graph={S:['A','B'],A:['C','D'],B:['C'],C:['T'],D:['T'],T:[]},from=state.path.at(-1),to=b.dataset.node;
  const nodeBlocked=(state.question===0&&to==='C')||(state.question===2&&(to==='C'||to==='D'));
  const edgeBlocked=state.question===3&&from==='A'&&to==='C';
  if(!graph[from]?.includes(to)||nodeBlocked||edgeBlocked)state.message='这一步不能走，试试其他连接。';
  else state.path.push(to);
 }
 else if(a==='v3UndoRoute'){if(state.path.length>1)state.path.pop()}
 else if(a==='v3ResetRoute')state.path=['S'];
 else if(a==='v3Light')state.lightning=b.dataset.value;
 else if(a==='v3Ground')state.ground=b.dataset.value;
 else if(a==='v3Observe')state.observe=Number(b.dataset.value);
 else if(a==='v3Return')state.tripReturn=Number(b.dataset.value);
 return true;
}
function resetV3(){resetWeek3();resetWeek4();resetWeek5();resetWeek6();resetWeek7();resetWeek8();state.place=null;state.cards=[];state.schedule=null;state.path=['S'];state.lightning=null;state.ground=null;state.observe=null;state.tripReturn=null;}


// Exploratory boards for the radio editing week. Choices here are assistance,
// not answers and not evidence of independent mastery.
function resetWeek3(){state.week3={timeline:[],comparison:[],flashes:[],channel:null,allocation:[null,null,null],target:0,experiment:[],editor:[null,null,null]};}
function week3Activity(){
 const s=state.week3;
 if(state.day===14){const labels=['6:04 第一段声音','6:06 调整天线','6:12 第二段声音'];return `<div class="activity"><h3>${rt('整理时间线')}</h3><p>${rt('点卡片排列记录；可以撤回。')}</p><div class="nav">${labels.map((x,i)=>button('w3Timeline',x,`data-index="${i}" aria-pressed="${s.timeline.includes(i)}"`)).join('')}</div><p data-w3-timeline>${rt(s.timeline.map(i=>labels[i]).join(' → ')||'尚未放入记录')}</p>${button('w3Undo','撤回一张')}</div>`;}
 if(state.day===15){const rows=['时间：两张都是 6:04。','地点：甲写东门，乙写北门。','来源：两人分别听写，原片段不完整。'];return `<div class="activity"><h3>${rt('并排核对记录')}</h3><p>${rt('选择需要比较的项目。')}</p><div class="nav">${['时间','地点','来源'].map((x,i)=>button('w3Comparison',x,`data-index="${i}" aria-pressed="${s.comparison.includes(i)}"`)).join('')}</div><div data-w3-comparison>${s.comparison.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;}
 if(state.day===16){const sum=s.flashes.reduce((n,x)=>n+x,0),code=s.flashes.length===2?({2:'北门',3:'西门',4:'暂缓'}[sum]||'无约定'):'';return `<div class="activity"><h3>${rt('闪光编码卡')}</h3><p>${rt('选择两次闪光，试试交换顺序。')}</p><div class="nav">${button('w3Flash','短闪','data-value="1"')}${button('w3Flash','长闪','data-value="2"')}${button('w3FlashUndo','撤回一次')}${button('w3FlashClear','重新试')}</div><p data-w3-flash>${rt(s.flashes.length?s.flashes.map(x=>x===1?'短闪':'长闪').join(' → ')+'；和为 '+sum+(code?'，约定：'+code:''):'还没有选择闪光。')}</p></div>`;}
 if(state.day===17){const rows=['同一段确认清晰的测试录音。','耳机输出：听起来清楚。','音箱输出：仍有杂音。'];return `<div class="activity"><h3>${rt('检查路径')}</h3><p>${rt('选一处查看本次记录。')}</p><div class="nav">${['测试音源','耳机','音箱'].map((x,i)=>button('w3Channel',x,`data-index="${i}" aria-pressed="${s.channel===i}"`)).join('')}</div><p data-w3-channel>${s.channel===null?'':rt(rows[s.channel])}</p></div>`;}
 if(state.day===18){const targets=['发射器','监听器',state.question===3?'灯':'备用'],vals=s.allocation.filter(x=>x!==null),dupe=new Set(vals).size!==vals.length;return `<div class="activity"><h3>${rt('电池分配板')}</h3><p>${rt('先选分配对象，再选电池；再次点同一块可撤回。')}</p><div class="nav">${targets.map((x,i)=>button('w3Target',x,`data-index="${i}" aria-pressed="${s.target===i}"`)).join('')}</div><div class="nav">${[9,6,5].map(n=>button('w3Battery',n+' 单位',`data-value="${n}" aria-pressed="${s.allocation[s.target]===n}"`)).join('')}</div><p data-w3-allocation>${rt(targets.map((x,i)=>x+'：'+(s.allocation[i]===null?'未选':s.allocation[i]+' 单位')).join('；')+(dupe?'。同一块电池不能同时分配给两个对象。':''))}</p></div>`;}
 if(state.day===19){const items=['位置','设备','测试录音','开窗状态','周围声音'];return `<div class="activity"><h3>${rt('实验条件板')}</h3><p>${rt('点选想记录或核对的条件；选择不自动判分。')}</p><div class="nav">${items.map((x,i)=>button('w3Experiment',x,`data-index="${i}" aria-pressed="${s.experiment.includes(i)}"`)).join('')}</div><p data-w3-experiment>${rt('已选：'+(s.experiment.map(i=>items[i]).join('、')||'无'))}</p></div>`;}
 if(state.day===20){const rows=['6:09 收到更改到北门的通知','集合日期和时间尚未确认','联系负责人核对当前安排'],kinds=['事实','待确认','下一步'];return `<div class="activity"><h3>${rt('播报编辑板')}</h3><p>${rt('点每张卡，为它选择一个标记；可反复修改。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w3Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p data-w3-editor>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week3Handle(a,b,i){
 if(!a.startsWith('w3'))return false;
 const s=state.week3;state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});
 if(a==='w3Timeline'&&!s.timeline.includes(i))s.timeline.push(i);
 else if(a==='w3Undo')s.timeline.pop();
 else if(a==='w3Comparison')s.comparison=s.comparison.includes(i)?s.comparison.filter(x=>x!==i):[...s.comparison,i];
 else if(a==='w3Flash'&&s.flashes.length<2)s.flashes.push(Number(b.dataset.value));
 else if(a==='w3FlashUndo')s.flashes.pop();
 else if(a==='w3FlashClear')s.flashes=[];
 else if(a==='w3Channel')s.channel=i;
 else if(a==='w3Target')s.target=i;
 else if(a==='w3Battery'){const n=Number(b.dataset.value);s.allocation[s.target]=s.allocation[s.target]===n?null:n;}
 else if(a==='w3Experiment')s.experiment=s.experiment.includes(i)?s.experiment.filter(x=>x!==i):[...s.experiment,i];
 else if(a==='w3Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}


// Day 22–28 exploration is assistance and cannot establish independent mastery.
function resetWeek4(){state.week4={point:null,containers:[],route:null,rain:[],experiment:[],repairs:[],editor:[null,null,null]};}
function week4Activity(){
 const s=state.week4;
 if(state.day===21){const rows=[['东点',8,5],['西点',5,4],['南点',6,6]],r=s.point===null?null:rows[s.point];return `<div class="activity"><h3>${rt('水位记录板')}</h3><p>${rt('选择一个位置，比较开始与结束的水深。')}</p><div class="nav">${rows.map((x,i)=>button('w4Point',x[0],`data-index="${i}" aria-pressed="${s.point===i}"`)).join('')}</div><p data-w4-point>${r?rt(r[0]+'：开始 '+r[1]+' 厘米，结束 '+r[2]+' 厘米；下降 '+(r[1]-r[2])+' 厘米。'):''}</p></div>`;}
 if(state.day===22){const remaining=[state.question===3?3:4,5,3],labels=['大桶','中桶','小桶'],total=s.containers.reduce((n,i)=>n+remaining[i],0);return `<div class="activity"><h3>${rt('容器剩余空间')}</h3><p>${rt('最多选择两只容器；再点一次可撤回。')}</p><div class="nav">${labels.map((x,i)=>button('w4Container',x+ ' 剩余 '+remaining[i]+' 升',`data-index="${i}" aria-pressed="${s.containers.includes(i)}"`)).join('')}</div><p data-w4-capacity>${rt('已选 '+s.containers.length+' 只，剩余空间共 '+total+' 升。')}</p></div>`;}
 if(state.day===23){const rows=[['A 路',10,state.question===1?'门已确认打开':'门未确认'],['B 路',11,'已确认可通行'],['C 路',7,state.question===3?'已确认开放':'暂时关闭']],r=s.route===null?null:rows[s.route];return `<div class="activity"><h3>${rt('路线比较')}</h3><p>${rt('选一条路线，查看本题的时间和状态。')}</p><div class="nav">${rows.map((x,i)=>button('w4Route',x[0],`data-index="${i}" aria-pressed="${s.route===i}"`)).join('')}</div><p data-w4-route>${r?rt(r[0]+'：'+r[1]+' 分钟；'+r[2]+'。实际行动仍听工作人员指引。'):''}</p></div>`;}
 if(state.day===24){const labels=['第一小时','第二小时','第三小时'],rows=['第一小时：2 毫米。','第二小时：3 毫米。','第三小时：空白，含义尚未核实。'];return `<div class="activity"><h3>${rt('雨量记录卡')}</h3><p>${rt('点选要查看的时段；空白先保留为未知。')}</p><div class="nav">${labels.map((x,i)=>button('w4Rain',x,`data-index="${i}" aria-pressed="${s.rain.includes(i)}"`)).join('')}</div><div data-w4-rain>${s.rain.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;}
 if(state.day===25){const items=['坡度','板面','用水量','用时'];return `<div class="activity"><h3>${rt('实验条件面板')}</h3><p>${rt('点选你想核对的条件；选择不自动判分。')}</p><div class="nav">${items.map((x,i)=>button('w4Experiment',x,`data-index="${i}" aria-pressed="${s.experiment.includes(i)}"`)).join('')}</div><p data-w4-experiment>${rt('已选：'+(s.experiment.map(i=>items[i]).join('、')||'无'))}</p></div>`;}
 if(state.day===26){const items=['安全门','桥板','照明灯'],cost=[3,4,2],total=s.repairs.reduce((n,i)=>n+cost[i],0),budget=state.question===3?9:7,required=s.repairs.includes(0)&&s.repairs.includes(1);return `<div class="activity"><h3>${rt('预算卡')}</h3><p>${rt('选择维修项目；再点一次可撤回。')}</p><div class="nav">${items.map((x,i)=>button('w4Repair',x+' '+cost[i]+' 单位',`data-index="${i}" aria-pressed="${s.repairs.includes(i)}"`)).join('')}</div><p data-w4-budget>${rt('合计 '+total+' 单位，预算 '+budget+' 单位。'+(total>budget?'已超过预算。':'')+(required?'题目要求的两项维修已选择。':'还有题目要求的维修未选。')+'是否开放仍由工作人员现场确认。')}</p></div>`;}
 if(state.day===27){const rows=['东点那次水深下降 3 厘米','第三小时雨量尚未核实','联系工作人员确认 A 门'],kinds=['事实','待确认','下一步'];return `<div class="activity"><h3>${rt('邻里说明卡')}</h3><p>${rt('点每张卡，选择标记；可以反复修改。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w4Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p data-w4-editor>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week4Handle(a,b,i){
 if(!a.startsWith('w4'))return false;
 const s=state.week4;state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});
 if(a==='w4Point')s.point=i;
 else if(a==='w4Container')s.containers=s.containers.includes(i)?s.containers.filter(x=>x!==i):[...s.containers,i].slice(-2);
 else if(a==='w4Route')s.route=i;
 else if(a==='w4Rain')s.rain=s.rain.includes(i)?s.rain.filter(x=>x!==i):[...s.rain,i];
 else if(a==='w4Experiment')s.experiment=s.experiment.includes(i)?s.experiment.filter(x=>x!==i):[...s.experiment,i];
 else if(a==='w4Repair')s.repairs=s.repairs.includes(i)?s.repairs.filter(x=>x!==i):[...s.repairs,i];
 else if(a==='w4Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}


// Exploration is recorded as help; it is not an independent answer.
function resetWeek5(){state.week5={match:[null,null,null],target:0,path:['S'],start:null,interval:null,loads:[0,0,0],editor:[null,null,null]};}
function week5RouteRule(){return state.question===2?'A 到 C 关闭；B 到 D 已开放。':state.question===3?'A 到 C、B 到 C 关闭；B 到 D 尚未开放。':'A 到 C 关闭；B 到 D 尚未开放。';}
function week5Activity(){
 const s=state.week5;
 if(state.day===28){const envelopes=['A','B','C'],groups=['播报组','造型组','后勤组'],chosen=s.match.filter(x=>x!==null),dupe=new Set(chosen).size!==chosen.length;return `<div class="activity"><h3>${rt('信封匹配板')}</h3><p>${rt('先选信封，再选接收组；再次点击同一组可撤回。')}</p><div class="nav">${envelopes.map((x,i)=>button('w5Target',x+' 信封',`data-index="${i}" aria-pressed="${s.target===i}"`)).join('')}</div><div class="options">${groups.map((x,i)=>`<div class="choice-row">${button('w5Match',x,`data-index="${i}" aria-pressed="${s.match[s.target]===i}"`,'choice')}${button('w5SpeakGroup','听',`data-index="${i}" aria-label="听${x}"`,'speak')}</div>`).join('')}</div><p data-w5-match>${rt(envelopes.map((x,i)=>x+'：'+(s.match[i]===null?'未选':groups[s.match[i]])).join('；')+(dupe?'。每个组只能对应一封。':''))}</p></div>`;}
 if(state.day===29){const rule=week5RouteRule();return `<div class="activity"><h3>${rt('交接路线板')}</h3><p>${rt('连接：S 到 A 或 B；A 到 C；B 到 C 或 D；C、D 到 T。')}</p><p>${rt(rule)}</p>${button('w5SpeakRoute','听路线说明')}<p data-w5-path>${esc(s.path.join(' → '))}</p><div class="nav">${['A','B','C','D','T'].map(n=>button('w5Route',n,`data-node="${n}"`)).join('')}${button('w5Undo','撤回一步')}${button('w5Clear','重新开始')}</div></div>`;}
 if(state.day===30){const total=25+(state.question===3?3:0),end=s.start===null?null:s.start+total,clock=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0'),primary=state.question===0;const description=primary?'选择出发时刻，先自己推算到达时间。':'选择出发时刻，查看按题目时间计算的到达时刻。';const display=end===null?'':primary?'已选择 '+clock(s.start)+' 出发。请自己计算到达时间。':'预计 '+clock(end)+' 到达；这次计划共 '+total+' 分钟。';return `<div class="activity"><h3>${rt('出发时间轴')}</h3><p>${rt(description)}</p><div class="nav">${[570,572,575,580].map(n=>button('w5Start',clock(n),`data-value="${n}" aria-pressed="${s.start===n}"`)).join('')}</div><p data-w5-time>${rt(display)}</p></div>`;}
 if(state.day===31){const r=s.interval===null?'':s.interval===0?(state.question===3?'新增交接已确认：9:10 由阿宁保管。':'按原记录：9:10 由小禾保管。'):'按记录：9:16 由天乐保管。';return `<div class="activity"><h3>${rt('交接时间线')}</h3><p>${rt('选择时刻，查看本题已确认的交接状态。')}</p><div class="nav">${['9:10','9:16'].map((x,i)=>button('w5Interval',x,`data-index="${i}" aria-pressed="${s.interval===i}"`)).join('')}</div><p data-w5-interval>${rt(r)}</p></div>`;}
 if(state.day===32||state.day===33){const weights=[3,2,2],names=['A','B','C'],cap=state.day===32&&state.question===3?4:5,totals=[1,2].map(t=>s.loads.reduce((n,v,i)=>n+(v===t?weights[i]:0),0)),primary=state.question===0;let order='';if(state.day===33&&s.loads[1]&&s.loads[2])order=s.loads[2]<s.loads[1]?'C 比 B 先到。':s.loads[2]===s.loads[1]?'B 和 C 同时到达。':'C 比 B 后到。';const assigned=t=>names.filter((_,i)=>s.loads[i]===t).join('、')||'暂无';const display=primary?'第一趟：'+assigned(1)+'；第二趟：'+assigned(2)+'。请自己检查重量和先后要求。':'第一趟 '+totals[0]+' 千克，第二趟 '+totals[1]+' 千克；每趟上限 '+cap+' 千克。'+(totals.some(n=>n>cap)?'有一趟超重。':'')+order;return `<div class="activity"><h3>${rt('两趟装车板')}</h3><p>${rt('点击物品依次切换未分配、第一趟和第二趟。')}</p><div class="nav">${names.map((x,i)=>button('w5Load',x+' '+weights[i]+' 千克：'+(s.loads[i]===0?'未分配':s.loads[i]===1?'第一趟':'第二趟'),`data-index="${i}"`)).join('')}</div><p data-w5-load>${rt(display)}</p></div>`;}
 if(state.day===34){const rows=['A 在 9:05 送达','C 在 9:15 签收','B 的签收栏未填写'],kinds=['已记录','待确认','下一步'];return `<div class="activity"><h3>${rt('交接记录卡')}</h3><p>${rt('点击卡片旁的标记，区分已记录与待确认。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w5Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week5Handle(a,b,i){
 if(!a.startsWith('w5'))return false;
 if(a==='w5SpeakGroup'){const groups=['播报组','造型组','后勤组'];if(groups[i])say(groups[i],'option');return true}
 if(a==='w5SpeakRoute'){say('连接：S 到 A 或 B；A 到 C；B 到 C 或 D；C、D 到 T。'+week5RouteRule(),'support');return true}
 const s=state.week5,primaryInput=state.question===0&&((state.day===28&&['w5Target','w5Match'].includes(a))||(state.day===29&&['w5Route','w5Undo','w5Clear'].includes(a))||(state.day===30&&a==='w5Start')||([32,33].includes(state.day)&&a==='w5Load'));
 if(!primaryInput){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a})}
 if(a==='w5Target')s.target=i;
 else if(a==='w5Match')s.match[s.target]=s.match[s.target]===i?null:i;
 else if(a==='w5Route'){
  const graph={S:['A','B'],A:['C'],B:['C','D'],C:['T'],D:['T'],T:[]},from=s.path.at(-1),to=b.dataset.node;
  if(!graph[from]?.includes(to))state.message='地图上没有这条连接，试试其他路线。';else s.path.push(to);
 }
 else if(a==='w5Undo'){if(s.path.length>1)s.path.pop()}
 else if(a==='w5Clear')s.path=['S'];
 else if(a==='w5Start')s.start=Number(b.dataset.value);
 else if(a==='w5Interval')s.interval=i;
 else if(a==='w5Load')s.loads[i]=(s.loads[i]+1)%3;
 else if(a==='w5Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}


// Exploration is recorded as help; comparison and plan inputs are first-class tasks.
function resetWeek6(){state.week6={point:null,cards:[],records:[],setup:[],outlier:null,sequence:[],editor:[null,null,null]};}
function week6Cards(){return [['甲卡','灯距 30 厘米，屏距 20 厘米。'],['乙卡','灯距 40 厘米，屏距 20 厘米。'],['丙卡','灯距 40 厘米，屏距 30 厘米。'],['丁卡','灯距 30 厘米，屏距 30 厘米。']].slice(0,state.question===3?4:3);}
function week6Activity(){
 const s=state.week6;
 if(state.day===35){const rows=[['甲棒',state.question===3?5:4,9],['乙棒',6,10]],r=s.point===null?null:rows[s.point];return `<div class="activity"><h3>${rt('影长对照板')}</h3><p>${rt('选择一根棒，比较开始和结束的影长。')}</p><div class="nav">${rows.map((x,i)=>button('w6Point',x[0],`data-index="${i}" aria-pressed="${s.point===i}"`)).join('')}</div><p data-w6-point>${r?rt(r[0]+'：开始 '+r[1]+' 厘米，结束 '+r[2]+' 厘米；增加 '+(r[2]-r[1])+' 厘米。'):''}</p></div>`;}
 if(state.day===36){const rows=week6Cards();return `<div class="activity"><h3>${rt('实验卡对照')}</h3><p>${rt('选择两张卡并排查看；再次点击可撤回。')}</p><div class="options">${rows.map((x,i)=>`<div class="choice-row">${button('w6Card',x[0],`data-index="${i}" aria-pressed="${s.cards.includes(i)}"`,'choice')}${button('w6SpeakCard','听',`data-index="${i}" aria-label="听${x[0]}"`,'speak')}</div>`).join('')}</div><div data-w6-cards>${s.cards.map(i=>`<p>${rt(rows[i][0]+'：'+rows[i][1])}</p>`).join('')}</div></div>`;}
 if(state.day===37){const rows=['甲：8 厘米。','乙：空白，含义尚未核实。','丙：10 厘米。'];return `<div class="activity"><h3>${rt('实验记录表')}</h3><p>${rt('点选要查看的记录；未知值不会自动填补。')}</p><div class="nav">${['甲','乙','丙'].map((x,i)=>button('w6Record',x,`data-index="${i}" aria-pressed="${s.records.includes(i)}"`)).join('')}</div><div data-w6-records>${s.records.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;}
 if(state.day===38){const items=['纸片','灯','位置','屏幕'];return `<div class="activity"><h3>${rt('实验搭建板')}</h3><p>${rt('选择要核对的条件；选择不自动判分。')}</p><div class="nav">${items.map((x,i)=>button('w6Setup',x,`data-index="${i}" aria-pressed="${s.setup.includes(i)}"`)).join('')}</div><p data-w6-setup>${rt('已选：'+(s.setup.map(i=>items[i]).join('、')||'无'))}</p></div>`;}
 if(state.day===39){const rows=[10,10,11,4];return `<div class="activity"><h3>${rt('测量记录卡')}</h3><p>${rt('点选一次记录，标记想核查的数；原始记录保留。')}</p><div class="nav">${rows.map((x,i)=>button('w6Outlier','第 '+(i+1)+' 次：'+x+' 厘米',`data-index="${i}" aria-pressed="${s.outlier===i}"`)).join('')}</div><p data-w6-outlier>${rt(s.outlier===null?'尚未标记。':'标记第 '+(s.outlier+1)+' 次；是否有误还需核查。')}</p></div>`;}
 if(state.day===40){const seq=s.sequence.map(x=>x==='A'?'甲':'乙');return `<div class="activity"><h3>${rt('四次实验计划')}</h3><p>${rt('依次点甲或乙安排四次试验；可以撤回。')}</p><div class="nav">${button('w6Sequence','甲','data-value="A"')}${button('w6Sequence','乙','data-value="B"')}${button('w6Undo','撤回一次')}${button('w6Clear','重新开始')}${button('w6SpeakPlan','听计划说明')}</div><p data-w6-sequence>${rt(seq.length?seq.join(' → '):'还没有安排试验。')}</p></div>`;}
 if(state.day===41){const rows=['本次甲、乙分别记录 6 和 9 厘米','灯距可能影响影长','重复试验并记录条件'],kinds=['本次记录','猜测','下一步'];return `<div class="activity"><h3>${rt('实验展签')}</h3><p>${rt('给每条内容选择一个标记，可以修改。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w6Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week6Handle(a,b,i){
 if(!a.startsWith('w6'))return false;
 if(a==='w6SpeakCard'){const row=week6Cards()[i];if(row)say(row[0]+'：'+row[1],'option');return true}
 if(a==='w6SpeakPlan'){say('依次点甲或乙安排四次试验；可以撤回。','support');return true}
 const s=state.week6,primaryInput=state.question===0&&((state.day===36&&a==='w6Card')||(state.day===40&&['w6Sequence','w6Undo','w6Clear'].includes(a)));
 if(!primaryInput){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a})}
 if(a==='w6Point')s.point=i;
 else if(a==='w6Card')s.cards=s.cards.includes(i)?s.cards.filter(x=>x!==i):[...s.cards,i].slice(-2);
 else if(a==='w6Record')s.records=s.records.includes(i)?s.records.filter(x=>x!==i):[...s.records,i];
 else if(a==='w6Setup')s.setup=s.setup.includes(i)?s.setup.filter(x=>x!==i):[...s.setup,i];
 else if(a==='w6Outlier')s.outlier=i;
 else if(a==='w6Sequence'&&s.sequence.length<4&&['A','B'].includes(b.dataset.value))s.sequence.push(b.dataset.value);
 else if(a==='w6Undo')s.sequence.pop();
 else if(a==='w6Clear')s.sequence=[];
 else if(a==='w6Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}


// Rule-building and loop execution are direct tasks. Revealing test results is support.
function resetWeek7(){state.week7={step:0,aStep:0,bStep:0,loop:0,green:1,closed:0,unknownGreen:1,unknownClosed:2,card:null,rule:{color:'blue',shape:'square',logic:'or',tested:false}};}
function week7Condition(g,c,or=false){if(g===2||c===2)return '待核实';return (or?(g===1||c===1):(g===1&&c===1))?'可以继续':'先等待';}
function week7RuleValue(){const r=state.week7.rule;return r.color+(r.logic==='and'?'&':'|')+r.shape;}
function week7RunRule(color,shape,rule=state.week7.rule){const a=color===rule.color,b=shape===rule.shape;return rule.logic==='and'?a&&b:a||b;}
function week7RuleSamples(){return [['蓝色方形','blue','square',true],['蓝色圆形','blue','circle',false],['红色方形','red','square',false],...(state.question===3?[['红色圆形','red','circle',false]]:[])];}
function week7Activity(){
 const s=state.week7;
 if(state.day===42){const start=state.question===3?4:3,values=[start,start+2,(start+2)*2];return `<div class="activity"><h3>${rt('一步一步运行')}</h3><p>${rt('先加 2，再把现在的数乘 2。')}</p><p data-w7-step>${rt('已运行 '+s.step+' 步；现在是 '+values[s.step]+'。')}</p><div class="nav">${button('w7Step','执行下一步',s.step===2?'disabled':'')}${button('w7StepUndo','撤回一步')}${button('w7StepClear','重新开始')}</div></div>`;}
 if(state.day===43){const or=state.question===3;return `<div class="activity"><h3>${rt('条件开关')}</h3><p>${rt(or?'本题用“或者”：至少一项满足即可。':'本题用“并且”：两项都要满足。')}</p><div class="nav">${button('w7Green',s.green?'绿灯':'红灯')}${button('w7Closed',s.closed?'盖子合上':'盖子打开')}</div><p data-w7-condition>${rt(week7Condition(s.green,s.closed,or))}</p></div>`;}
 if(state.day===44){const n=state.question===3?4:3,a=[n,n+2,(n+2)*2],b=[n,n*2,n*2+2];return `<div class="activity"><h3>${rt('两条运行轨道')}</h3><p>${rt('甲先加 2 再乘 2；乙先乘 2 再加 2。')}</p><div class="nav">${button('w7A','甲执行下一步',s.aStep===2?'disabled':'')}${button('w7B','乙执行下一步',s.bStep===2?'disabled':'')}${button('w7TracksClear','两条都重来')}</div><p data-w7-tracks>${rt('甲：'+a.slice(0,s.aStep+1).join(' → ')+'；乙：'+b.slice(0,s.bStep+1).join(' → '))}</p></div>`;}
 if(state.day===45)return `<div class="activity"><h3>${rt('由你决定何时停止')}</h3><p>${rt(state.question===3?'从 1 开始，每次加 3；大于 10 时停止。':'从 1 开始，每次加 3；达到或超过 10 时停止。')}</p><p data-w7-loop>${rt('已加 '+s.loop+' 次；现在是 '+(1+3*s.loop)+'。')}</p><div class="nav">${button('w7Loop','加 3',s.loop>=6?'disabled':'')}${button('w7LoopUndo','撤回一次')}${button('w7LoopClear','重新开始')}${button('w7SpeakLoop','听操作说明')}</div><p class="muted">${rt('数字盒不会替你停止。看规则，决定何时提交。')}</p></div>`;
 if(state.day===46){const labels=['否','是','尚未确认'];return `<div class="activity"><h3>${rt('输入状态卡')}</h3><p>${rt('点卡片可切换状态。有一项尚未确认时，先显示“待核实”。')}</p><div class="nav">${button('w7UnknownGreen','灯为绿：'+labels[s.unknownGreen])}${button('w7UnknownClosed','盖子合上：'+labels[s.unknownClosed])}</div><p data-w7-unknown>${rt(week7Condition(s.unknownGreen,s.unknownClosed))}</p></div>`;}
 if(state.day===47){const rows=['甲：蓝色圆形','乙：红色方形','丙：蓝色三角形',...(state.question===3?['丁：蓝色圆形']:[])];return `<div class="activity"><h3>${rt('找卡片检查一句话')}</h3><p>${rt('原话：所有蓝色卡都是圆形。')}</p><div class="nav">${rows.map((v,i)=>button('w7Card',v,`data-index="${i}" aria-pressed="${s.card===i}"`)).join('')}</div><p data-w7-card>${rt(s.card===null?'选择一张卡，查看它的颜色和形状。':rows[s.card])}</p></div>`;}
 if(state.day===48){const r=s.rule,samples=week7RuleSamples();return `<div class="activity"><h3>${rt('规则修理台')}</h3><p>${rt('选择颜色、连接词和形状。运行样例会显示检查结果。')}</p><div class="nav">${['blue','red'].map(v=>button('w7RuleColor',v==='blue'?'蓝色':'红色',`data-value="${v}" aria-pressed="${r.color===v}"`)).join('')}${['and','or'].map(v=>button('w7RuleLogic',v==='and'?'并且':'或者',`data-value="${v}" aria-pressed="${r.logic===v}"`)).join('')}${['square','circle'].map(v=>button('w7RuleShape',v==='square'?'方形':'圆形',`data-value="${v}" aria-pressed="${r.shape===v}"`)).join('')}</div><p data-w7-rule>${rt((r.color==='blue'?'蓝色':'红色')+(r.logic==='and'?'并且':'或者')+(r.shape==='square'?'方形':'圆形')+'就送出。')}</p><ul>${samples.map(([label,c,shape,want])=>`<li>${rt(label+'：要求'+(want?'送出':'留下')+(r.tested?'；运行结果'+(week7RunRule(c,shape)?'送出':'留下')+'，'+(week7RunRule(c,shape)===want?'相符':'不相符'):'')+'。')}</li>`).join('')}</ul><div class="nav">${button('w7RuleTest','运行样例')}${button('w7SpeakRule','听当前规则')}</div></div>`;}
 return '';
}
function week7Handle(a,b,i){
 if(!a.startsWith('w7'))return false;
 if(a==='w7SpeakLoop'){say('从 1 开始，每次加 3。数字盒不会替你停止，请按题目规则决定何时提交。','support');return true}
 if(a==='w7SpeakRule'){const r=state.week7.rule;say((r.color==='blue'?'蓝色':'红色')+(r.logic==='and'?'并且':'或者')+(r.shape==='square'?'方形':'圆形')+'就送出。','support');return true}
 const s=state.week7,primary=state.question===0&&((state.day===45&&['w7Loop','w7LoopUndo','w7LoopClear'].includes(a))||(state.day===48&&['w7RuleColor','w7RuleShape','w7RuleLogic'].includes(a)));
 if(!primary){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a})}
 if(a==='w7Step')s.step=Math.min(2,s.step+1);
 else if(a==='w7StepUndo')s.step=Math.max(0,s.step-1);
 else if(a==='w7StepClear')s.step=0;
 else if(a==='w7Green')s.green=1-s.green;
 else if(a==='w7Closed')s.closed=1-s.closed;
 else if(a==='w7A')s.aStep=Math.min(2,s.aStep+1);
 else if(a==='w7B')s.bStep=Math.min(2,s.bStep+1);
 else if(a==='w7TracksClear'){s.aStep=0;s.bStep=0}
 else if(a==='w7Loop')s.loop=Math.min(6,s.loop+1);
 else if(a==='w7LoopUndo')s.loop=Math.max(0,s.loop-1);
 else if(a==='w7LoopClear')s.loop=0;
 else if(a==='w7UnknownGreen')s.unknownGreen=(s.unknownGreen+1)%3;
 else if(a==='w7UnknownClosed')s.unknownClosed=(s.unknownClosed+1)%3;
 else if(a==='w7Card')s.card=i;
 else if(a==='w7RuleColor'&&['blue','red'].includes(b.dataset.value)){s.rule.color=b.dataset.value;s.rule.tested=false}
 else if(a==='w7RuleShape'&&['square','circle'].includes(b.dataset.value)){s.rule.shape=b.dataset.value;s.rule.tested=false}
 else if(a==='w7RuleLogic'&&['and','or'].includes(b.dataset.value)){s.rule.logic=b.dataset.value;s.rule.tested=false}
 else if(a==='w7RuleTest')s.rule.tested=true;
 return true;
}


// Choosing packages and composing plans are primary answers; other boards expose support.
function resetWeek8(){state.week8={torches:0,boxes:[0,0],packs:[0,0,0],decoration:null,plan:[],stock:null,ledger:null};}
function week8PurchaseValue(){return 'packs:'+state.week8.packs.join(',');}
function week8PackTotals(packs=state.week8.packs,prices=state.question===3?[7,3,2]:[5,3,2]){return {cards:packs.reduce((n,k,i)=>n+k*[4,2,1][i],0),points:packs.reduce((n,k,i)=>n+k*prices[i],0)};}
function week8Activity(){
 const s=state.week8;
 if(state.day===49){const reserve=state.question===3?4:3,left=10-s.torches*2-reserve;return `<div class="activity"><h3>${rt('给手电分电池')}</h3><p>${rt('一共 10 节；每支手电用 2 节；至少留 '+reserve+' 节备用。')}</p><div class="nav">${Array.from({length:6},(_,i)=>button('w8Torch',i+' 支',`data-index="${i}" aria-pressed="${s.torches===i}"`)).join('')}</div><p data-w8-battery>${rt('手电用 '+s.torches*2+' 节，备用 '+reserve+' 节，'+(left>=0?'另外剩 '+left+' 节。':'还差 '+(-left)+' 节。'))}</p></div>`;}
 if(state.day===50){const [a,b]=s.boxes;return `<div class="activity"><h3>${rt('把包装放上运输盘')}</h3><p>${rt('甲每盒 3 张，乙每盒 2 张；最多运 2 盒。')}</p><div class="nav">${['甲','乙'].map((v,i)=>button('w8BoxLess',v+'少一盒',`data-index="${i}" ${s.boxes[i]===0?'disabled':''}`)+button('w8BoxMore',v+'多一盒',`data-index="${i}" ${s.boxes[i]>=3?'disabled':''}`)).join('')}</div><p data-w8-boxes>${rt('甲 '+a+' 盒，乙 '+b+' 盒；共 '+(a+b)+' 盒、'+(a*3+b*2)+' 张卡片。')}</p></div>`;}
 if(state.day===51){const total=week8PackTotals(),prices=state.question===3?[7,3,2]:[5,3,2];return `<div class="activity"><h3>${rt('我的兑换清单')}</h3><p>${rt('要正好 6 张，还要比较要花的积分。可以增减包装，再提交自己的方案。')}</p>${['四张包','两张包','单张'].map((v,i)=>`<div class="panel"><p>${rt(v+'：每份 '+prices[i]+' 分，已选 '+s.packs[i]+' 份。')}</p><div class="nav">${button('w8PackLess','少一份',`data-index="${i}" ${s.packs[i]===0?'disabled':''}`)}${button('w8PackMore','多一份',`data-index="${i}" ${s.packs[i]>=6?'disabled':''}`)}</div></div>`).join('')}<p data-w8-purchase>${rt('共 '+total.cards+' 张，花 '+total.points+' 分。')}</p><div class="nav">${button('w8PacksClear','清空清单')}${button('w8SpeakPrices','听价格')}</div></div>`;}
 if(state.day===52){const budget=state.question===3?16:15,cost=s.decoration===null?0:[2,3,4][s.decoration];return `<div class="activity"><h3>${rt('留好备用积分')}</h3><p>${rt('一共 '+budget+' 分；灯架 6 分，记录本 4 分；至少留 3 分。')}</p><div class="nav">${['彩带 2 分','贴纸 3 分','海报 4 分'].map((v,i)=>button('w8Decoration',v,`data-index="${i}" aria-pressed="${s.decoration===i}"`)).join('')}</div><p data-w8-budget>${rt('已用 '+(10+cost)+' 分，还剩 '+(budget-10-cost)+' 分。')}</p></div>`;}
 if(state.day===53){const labels=['蓝底板','红底板','说明标签'],prices=state.question===3?[4,5,4]:[4,4,4],cost=s.plan.reduce((n,i)=>n+prices[i],0);return `<div class="activity"><h3>${rt('拼出自己的布展方案')}</h3><p>${rt('一张底板加一张标签，最多 8 分；每件最多一份。点已选物品可以撤回。')}</p><div class="nav">${labels.map((v,i)=>button('w8Plan',v+' '+prices[i]+' 分',`data-index="${i}" aria-pressed="${s.plan.includes(i)}"`)).join('')}</div><p data-w8-plan>${rt('已选：'+(s.plan.length?s.plan.map(i=>labels[i]).join('、'):'还没有')+'；共 '+cost+' 分。')}</p>${button('w8SpeakPlan','听要求')}</div>`;}
 if(state.day===54){const rows=['昨天：三种都有货，各 4 分。','今天已确认：蓝底板和标签有货；红底板缺货。','下午补货：也许会到，数量未确认。'];return `<div class="activity"><h3>${rt('查看库存便条')}</h3><p>${rt('中午之前要布置完。')}</p><div class="nav">${['昨天清单','今天确认','可能的补货'].map((v,i)=>button('w8Stock',v,`data-index="${i}" aria-pressed="${s.stock===i}"`)).join('')}</div><p data-w8-stock>${rt(s.stock===null?'选一张便条查看。':rows[s.stock])}</p></div>`;}
 if(state.day===55){const rows=['第一笔 15 分：灯架 6、记录本 4、彩带 2；剩 3 分备用。',state.question===3?'第二笔 8 分：蓝底板已领，花 4 分；还剩 4 分，标签待领。':'第二笔 8 分：计划领蓝底板和标签；领取结果待确认。'];return `<div class="activity"><h3>${rt('分开核对两本账')}</h3><div class="nav">${['第一笔预算','第二笔预算'].map((v,i)=>button('w8Ledger',v,`data-index="${i}" aria-pressed="${s.ledger===i}"`)).join('')}</div><p data-w8-ledger>${rt(s.ledger===null?'两笔预算分别记账，不能混算。':rows[s.ledger])}</p></div>`;}
 return '';
}
function week8Handle(a,b,i){
 if(!a.startsWith('w8'))return false;
 if(a==='w8SpeakPrices'){say(state.question===3?'四张包每包 7 分，两张包每包 3 分，单张每张 2 分。':'四张包每包 5 分，两张包每包 3 分，单张每张 2 分。','support');return true;}
 if(a==='w8SpeakPlan'){say('一张底板加一张标签，总花费不超过 8 分。','support');return true;}
 const s=state.week8,primary=state.question===0&&((state.day===51&&['w8PackMore','w8PackLess','w8PacksClear'].includes(a))||(state.day===53&&a==='w8Plan'));
 if(!primary){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});}
 if(a==='w8Torch'&&i>=0&&i<=5)s.torches=i;
 else if(a==='w8BoxMore'&&i>=0&&i<2)s.boxes[i]=Math.min(3,s.boxes[i]+1);
 else if(a==='w8BoxLess'&&i>=0&&i<2)s.boxes[i]=Math.max(0,s.boxes[i]-1);
 else if(a==='w8PackMore'&&i>=0&&i<3)s.packs[i]=Math.min(6,s.packs[i]+1);
 else if(a==='w8PackLess'&&i>=0&&i<3)s.packs[i]=Math.max(0,s.packs[i]-1);
 else if(a==='w8PacksClear')s.packs=[0,0,0];
 else if(a==='w8Decoration'&&i>=0&&i<3)s.decoration=s.decoration===i?null:i;
 else if(a==='w8Plan'&&i>=0&&i<3)s.plan=s.plan.includes(i)?s.plan.filter(x=>x!==i):[...s.plan,i].slice(-2);
 else if(a==='w8Stock'&&i>=0&&i<3)s.stock=i;
 else if(a==='w8Ledger'&&i>=0&&i<2)s.ledger=i;
 return true;
}


  function matches(c){
   if(!c||c.session.diagnostic||!['choice','order'].includes(c.question.type))return false;
   const q=c.question,id=q.sourcePreviewId,row=expected.questions[id];
   return !!row&&id===q.id.replace(/^R2-/,'')&&q.type===row.type&&q.prompt===row.prompt&&
    JSON.stringify(q.options)===JSON.stringify(row.options)&&JSON.stringify(q.answer)===JSON.stringify(row.answer)&&
    c.material.text===expected.days[row.day]&&c.material.day===row.day;
  }
  function prepare(c){const id=c.question.sourcePreviewId,next=c.session.id+':'+id;if(key!==next){key=next;visible=false;state.day=expected.questions[id].day-1;state.question=id.endsWith('-X')?3:Number(id.slice(-1))-1;state.robot=0;state.bags=[];state.box=null;state.message='';resetV3();}}
  return {
   available(c){if(!matches(c))return false;prepare(c);return true;},
   html(c){if(!this.available(c))return '';return visible?`<section class="rd-explore" data-exploration-board><p>${rt('辅助板是临时工作区；刷新后会清空。使用会记录为辅助。')}</p>${activity()}${outerButton('rdExplore','收起辅助板')}</section>`:`<section class="rd-explore"><p>${rt('可以打开辅助板查看或计算；使用会记录为辅助。')}</p>${outerButton('rdExplore','打开辅助板')}</section>`;},
   toggle(c){if(!this.available(c)||c.session.paused)return;if(!visible){engine.requestAid('explore',{activity:'pilot-board-'+c.question.sourcePreviewId});visible=true;}else visible=false;},
   handle(c,d){if(!this.available(c)||!visible||c.session.paused)return;const a=d.subAction,i=Number(d.index),b={dataset:d};
    if(a==='move'){const next=state.robot+Number(d.amount),limit=state.question===3?8:7;if(next<=limit)state.robot=next;else state.message='这一步会走出轨道，先换一种走法。';}
    else if(a==='resetRobot')state.robot=0;
    else if(a==='bag')state.bags=state.bags.includes(i)?state.bags.filter(x=>x!==i):[...state.bags,i];
    else if(a==='box')state.box=i;
    else if(!v3Handle(a,b,i)&&!week3Handle(a,b,i)&&!week4Handle(a,b,i)&&!week5Handle(a,b,i)&&!week6Handle(a,b,i)&&!week7Handle(a,b,i))week8Handle(a,b,i);
    if(state.message){ui.message=state.message;state.message='';}
   }
  };
 })(button);

 function quiz(c){const {material:m,question:q,session:s}=c,local=c.attempts.filter(a=>a.sessionId===s.id),last=local[local.length-1],pick=s.drafts[q.id],order=Array.isArray(pick)?pick:Array.isArray(last?.selected)?last.selected:[],valid=wpSupports(q)?wpComplete(q,pick):q.type==='departure'?Number.isInteger(pick):q.type==='route'?Array.isArray(pick)&&pick.length>=2:q.type==='cargo'?Array.isArray(pick)&&pick.length===q.options.length&&pick.every(x=>x===1||x===2):q.type==='match'?Array.isArray(pick)&&pick.length===q.matchLeft.length&&pick.every(Number.isInteger):q.type==='order'?Array.isArray(pick)&&pick.length===q.options.length:Number.isInteger(pick),labels={reading:'读懂文字',math:'数学读题',literacy:'字词小发现'};
  const originalOrder=shuffled(q,s.id),displayOrder=q.type==='order'?[...order,...originalOrder.filter(i=>!order.includes(i))]:originalOrder;
  const diagnosisReady=!s.diagnostic||m.questions.every(item=>engine.attempts(item.id).some(a=>a.sessionId===s.id));
  return `<section class="rd-text-evidence"><h2>${rt('回到文字里找依据')}</h2><div class="rd-story-text">${rt(m.text,{clickable:true})}</div></section><section class="rd-question"><p>${rt(labels[q.category]||'阅读小挑战')}</p><h2>${rt(q.prompt)}</h2>${button('rdSpeakQuestion','听问题')}${wpExplore.html(c)}${wpSupports(q)?wpBoard(q,pick??last?.selected):q.type==='departure'?departureBoard(c,pick,last):q.type==='route'?routeBoard(c,order):q.type==='cargo'?cargoBoard(c,order):q.type==='match'?matchBoard(c,order):`<div class="rd-options">${displayOrder.map(i=>`<div class="rd-option-row ${q.type==='order'?'rd-order-row':''}">${q.type==='order'?`<span class="rd-order-drag" data-rd-order-drag="${i}" aria-hidden="true" title="拖动调整顺序">↕</span>`:''}${button('rdPick',(q.type==='order'&&order.includes(i)?(order.indexOf(i)+1)+' · ':'')+q.options[i],`data-index="${i}" aria-pressed="${q.type==='order'?order.includes(i):pick===i}"`,(q.type==='order'?order.includes(i):pick===i)?'rd-option rd-selected':'rd-option')}${button('rdSpeakOption','听',`data-index="${i}" aria-label="朗读这个选项"`,'rd-option-speak')}</div>`).join('')}</div>`}${q.type==='order'?`<p>${rt('按顺序点卡片，或拖动左侧把手调整整排。')} ${button('rdSpeakOrderHelp','听排序方法')}</p><p>${rt('我的顺序')}：${order.map(i=>rt(q.options[i])).join(' → ')}</p>${button('rdOrderUndo','撤回一张卡')}`:''}${button('rdSubmit',last?'再次提交':'我选好了',valid?'':'disabled','rd-button rd-primary')}${last?`<div class="rd-feedback ${last.correct?'rd-good':'rd-try'}" role="status"><strong>${rt(c.session.diagnostic?(last.correct?'选好了，说说你的依据。':'先别急，再读一次文字。'):(last.correct?'答对了，说说你的依据。':'这次还没答对，再读一次文字。'))}</strong>${!last.correct&&!c.session.diagnostic?(hasFeedbackHint(c)?'<p>'+feedbackHint(q,last,m)+'</p>':button('rdTargetHint','查看一小步提示')):''}<p class="rd-save-status">${rt(engine.status().status!=='ready'?'当前阅读记录尚未保存，请先导出草稿或检查保存状态。':last.first?'第一次的回答已经保留。':'这是再次练习，原来的首答仍然保留。')}</p>${!last.correct&&!c.revealed?button('rdRetry','再读或听原文，再试一次'):''}${diagnosisReady?button('rdReveal',s.diagnostic?'看本篇讲解':'看讲解'):'<p>'+rt('本篇题目完成后可看讲解。')+'</p>'}${button('rdNext','下一步','','rd-button rd-primary')}</div>`:''}${c.revealed&&diagnosisReady?`<aside class="rd-explanation"><h3>${rt('一起看依据')}</h3>${(s.diagnostic?m.questions:[q]).map(item=>`<p>${rt(item.prompt)}</p><p>${rt(item.explanation)}</p><p>${rt('答案')}：${item.type==='departure'?E(timeLabel(item.answer)):item.type==='route'?rt('符合题目中各项条件的路线'):item.type==='cargo'?rt('符合题目中各项条件的安排'):wpSupports(item)?rt('请根据上面的讲解核对自己的方案。'):Array.isArray(item.answer)?item.type==='match'?item.answer.map((i,j)=>rt(item.matchLeft[j])+' → '+rt(item.options[i])).join('；'):item.answer.map(i=>rt(item.options[i])).join(' → '):rt(item.options[item.answer])}</p>`).join('')}</aside>`:''}</section>`;
 }
 function course(){const c=ensure().current();if(!c){ui.screen='finish';return finish();}const {material:m,session:s}=c,dx=s.diagnostic;const readingPhase=ui.phase==='read'&&!dx;const materialLabel=rt('第')+' '+(s.materialIndex+1)+'/'+s.materialIds.length+' '+rt('篇');const position=readingPhase?(ui.allPanels?rt('漫画共')+' '+m.panels.length+' '+rt('格'):rt('漫画第')+' '+(s.panelIndex+1)+'/'+m.panels.length+' '+rt('格')):rt('第')+' '+(s.questionIndex+1)+'/'+m.questions.length+' '+rt('题');const progress=materialLabel+' · '+position;
  const review=!dx&&(s.purpose==='review'||s.priorExposure[m.id]===true),fresh=s.purpose==='review'&&Number.isInteger(s.scopeDay)?engine.freshDayCandidate(s.scopeDay):null;
  const reviewNotice=review?`<aside class="rd-condition" data-reading-review><p>${rt(s.purpose==='optional-challenge'?'这是同文自愿挑战；如果原文已经看过，会记录为已见。':'这是复习')} · ${rt('原材料来自第')} ${m.day} ${rt('天。第一次作答仍会保留。')}</p>${fresh?button('rdFreshDay','先看当天没见过的篇章',`data-day="${s.scopeDay}"`):''}</aside>`:'';
  return `${header(m.title,dx?conditionLabels[dx.condition]:'先看漫画和文字，再从文字里找依据。')}<div class="rd-session-line"><span>${progress}</span>${button(s.paused?'rdResume':'rdPause',s.paused?'继续':'休息一下')}</div>${historicalMaterial(engine,m)?`<p class="rd-condition" data-historical-session>${rt(dx?'这是旧课程诊断，记录单独保留，不计入新版课程。':'这是历史课程草稿，继续后记录仍归入历史课程。')}</p>`:''}${reviewNotice}${s.restoredFromBackup?`<p class="rd-condition">${rt('本次是备份恢复，继续原来的位置；独立性另行核实。')}</p>`:''}${dx?`<p class="rd-condition">${rt('本次对照')} ${dx.condition} · ${rt('额外帮助会单独记录，不影响继续学习。')}</p>`:''}${s.paused?`<section class="rd-pause"><h2>${rt('休息一下吧')}</h2>${button('rdResume','继续阅读','','rd-button rd-primary')}</section>`:`${readingPhase?comic(m,s):quiz(c)}${aids(c)}`}`;}
 function finish(){
  if(engine.data.courseScope){const offer=Number.isInteger(ui.finishedDay)&&engine.dailyOptional?.(ui.finishedDay);return `${header('这次阅读练习结束啦')}<section class="rd-finish"><h2 class="rd-finish-save-status">${rt(engine.status().status==='ready'?'这次练习已经保存。':'这次练习还没有保存，请家长导出草稿。')}</h2>${offer?.materialId?`<aside class="rd-condition" data-daily-optional><p>${rt('还有一道自愿挑战，使用今天的原文。看过原文会记录为已见，不作为未见材料。')}</p>${button('rdDailyOptional','试试同文自愿挑战',`data-day="${offer.day}"`)}</aside>`:''}<p>${rt('也可以从十二周地图选择其他天的挑战。')}</p>${button('rdPlan','十二周地图')}${button('rdHome','回到阅读首页')}${button('rdParent','请家长看看记录')}</section>`;}
  const offer=engine.challenge();const challenge=!offer.eligible?'':offer.materialId?
  '<aside class="rd-condition" data-reading-challenge><p>'+rt('最近三道未见题首答正确。可以继续使用拼音和朗读，自愿试一段新文字。')+'</p><p>'+rt('新段落：')+E(offer.title)+' · '+E(offer.goal||'阅读理解')+'</p><p>'+rt('这只是练习建议；辅助记录不变，也不算完成整天课程。')+'</p>'+button('rdChallenge','试试新的阅读挑战')+'</aside>':
  '<p class="rd-condition" data-reading-challenge>'+rt('最近三道未见题首答正确；当前范围暂时没有合适的新材料，可以继续原计划。')+'</p>';
  return `${header('这次阅读练习结束啦')}<section class="rd-finish"><h2 class="rd-finish-save-status">${rt(engine.status().status==='ready'?'这次练习已经保存。':'这次练习还没有保存，请家长导出草稿。')}</h2><p>${rt('换一段没见过的文字，看看能不能自己读懂。')}</p>${challenge}${button('rdTransfer','试一段没见过的数学题','','rd-button rd-primary')}${button('rdHome','回到阅读首页')}${button('rdParent','请家长看看记录')}</section>`;
 }
 function parent(){const e=ensure(),r=e.report(),s=e.snapshot().settings,known=[...new Set(e.data.materials.filter(m=>(!e.data.courseScope||m.courseId===e.data.courseScope.activeCourseId)&&m.prerequisitesStatus!=='unreviewed').flatMap(m=>m.prerequisites||[]))],set=selectedSet(e),math={attempts:host.saved.attempts?.length||0,topics:host.saved.topicPractice?.selectedTopicIds?.length||0};let academyInfo='学院历史记录可在原学院入口查看。';try{const academy=JSON.parse(localStorage.getItem('tianle_academy_v5_prototype')||'null');if(academy&&typeof academy==='object')academyInfo='已检测到原学院本机记录，保持原结构；仅在统一备份中保留。';}catch(_){academyInfo='原学院记录暂不能读取，未修改原文。';}
  return `<div class="rd-parent">${header('家长阅读看板',e.data.courseScope?'当前课程的首答、求助、重试与最后结果分别保存。':'首答、求助、重试与最后结果分别保存。')}<section class="rd-summary"><div><b>${r.storyReadDays}/84</b><span>读过故事的天数</span></div><div><b>${r.completedDays}/84</b><span>完成过课程的天数</span></div><div><b>${percent(r.first)}</b><span>原始首答</span></div><div><b>${r.retries}</b><span>再次练习次数</span></div><div><b>${math.attempts}</b><span>旧路线提交</span></div></section>${r.historical?`<section class="rd-parent-card" data-course-history><h2>历史课程单独保留</h2><p>历史或待核实的完成天数：${r.historical.completedDays}；可关联旧材料的历史首答：${percent(r.historical.first)}。</p><p>上面的完成天数、首答和下面的诊断只统计当前课程。历史草稿和原始作答继续保留。</p></section>`:''}<section class="rd-parent-card"><h2>家长设置</h2><p>确认后可调整阅读范围与设置；这是本机防误操作，不是账号安全锁。离开家长看板后会重新锁定。</p><button class="rd-button" data-action="rdSettingsUnlock" aria-pressed="${ui.parentSettingsUnlocked}">${ui.parentSettingsUnlocked?'锁定设置':'我是家长，确认调整设置'}</button><p>阅读范围：第 ${s.dayRange?.start||1} 至 ${s.dayRange?.end||84} 天。阶段测评需单独确认先修知识。</p><label>开始天 <input type="number" min="1" max="84" data-reading-field="rangeStart" value="${E(ui.rangeStart??s.dayRange?.start??1)}" ${ui.parentSettingsUnlocked?'':'disabled'}></label> <label>结束天 <input type="number" min="1" max="84" data-reading-field="rangeEnd" value="${E(ui.rangeEnd??s.dayRange?.end??84)}" ${ui.parentSettingsUnlocked?'':'disabled'}></label> <button class="rd-button" data-action="rdSaveRange" ${ui.parentSettingsUnlocked?'':'disabled'}>保存阅读范围</button><p>超出范围的课程不会被删除；如需继续，家长可以调整范围。</p></section><section class="rd-parent-card"><h2>辅助策略与隐私</h2><div class="rd-nav">${[['all','全拼音'],['demand','按需拼音'],['focus','重点字拼音'],['none','无拼音']].map(([m,t])=>`<button class="rd-button" data-action="rdSetMode" ${ui.parentSettingsUnlocked?'':'disabled'} data-mode="${m}" aria-pressed="${s.pinyin===m}">${t}</button>`).join('')}</div><p>由家长结合跨材料表现逐渐减少辅助，孩子仍可随时求助。隐藏拼音不抹去看过拼音的历史。重点字取自当前材料的焦点字词。</p><div class="rd-nav">${[[.65,'慢速'],[.85,'自然偏慢'],[1,'正常语速']].map(([rate,t])=>`<button class="rd-button" data-action="rdRate" ${ui.parentSettingsUnlocked?'':'disabled'} data-rate="${rate}" aria-pressed="${s.rate===rate}">${t}</button>`).join('')}</div><p>默认只使用浏览器明确标记为本地的普通话音色。不录音、不调用麦克风、不做语音识别。选择远程音色时，文字可能由设备语音服务传输处理。</p><button class="rd-button" data-action="rdRemoteConsent" ${ui.parentSettingsUnlocked?'':'disabled'} aria-pressed="${s.remoteVoiceConsent===true}">${s.remoteVoiceConsent?'撤销远程语音授权':'家长同意使用远程语音服务'}</button><p>音色能力：${E(JSON.stringify(speech.capabilities()))}。声调、停顿和实机音质需要实际听音复核。</p></section><section class="rd-parent-card"><h2>首答辅助分层</h2><div class="rd-summary">${r.levels.map(x=>`<div><b>${percent(x)}</b><span>L${x.level} · ${['无辅助','看过拼音','请求语音','家长代读'][x.level]||'额外支持'}</span></div>`).join('')}</div><p>看过题目提示后的首答：${percent(r.hintedFirst)}，单列，不计无辅助首答。</p><p>已见讲解后的首答：${percent(r.explained)}，单列，不混入 L3。待核实的旧版或未知题目作答：${r.quarantinedAttempts||0} 条，仅保留记录。</p><p>${E(r.independenceCaution||'首答关闭拼音不代表此前从未看过拼音。')}</p><p>语音请求和播放开始分别记录；未能播放也保留求助事实。播放开始不代表已经听完或听清。听过后答对不能覆盖原始首答。</p></section><section class="rd-parent-card" id="rd-diagnostic" tabindex="-1"><h2>阅读与数学分离诊断</h2>${legacyDiagnostic(e.data,set)?'<p data-legacy-diagnostic-notice>当前选择的是旧课程诊断。继续沿用原有未见材料和辅助条件规则，结果在下方历史诊断记录中单列。新版诊断尚未启用。</p>':''}<p>家长代读组需要记录家长只读原文；请求过系统朗读或显示过拼音时，不计入该组对照。上面的首答分层按实际使用的帮助统计；这里的 A/B/C/D 按预先安排的对照条件统计，是两套不同口径。C 组须记录本篇原文朗读开始。条件不完整时不计入该组对照，也不自动转成 A 组；旧记录无法核实时暂不计入。历史答案和求助记录保持不变。</p><p>请确认孩子已经掌握本组数学知识。A/B/C/D 使用同蓝图不同新材料，轮换分配，建议分次进行以控制疲劳。蓝图匹配尚不等于经过儿童样本校准的等难度。</p><div class="rd-nav">${diagnosticSets(e.data).map(x=>`<button class="rd-button" data-action="rdDxSet" data-set="${E(x.id)}" aria-pressed="${x.id===ui.dxSet}">${legacyDiagnostic(e.data,x)?'旧版 · ':''}${x.week===0?'初测':`第${x.week}周${[4,8,12].includes(x.week)?'阶段诊断':'周测'}`}</button>`).join('')}</div><p>${set?'本组先修：'+E((set.blueprint?.mathKnowledge||[]).join('、')):'当前课程还没有可用诊断。'}</p><button class="rd-button" data-action="rdKnowledgeConfirm" ${set?'':'disabled'} aria-pressed="${ui.knowledgeConfirmed}">${ui.knowledgeConfirmed?'已确认本组先修':'家长确认：本组数学知识已掌握'}</button><button class="rd-button rd-primary" data-action="rdDiagnostic" ${set&&ui.knowledgeConfirmed?'':'disabled'}>开始下一份未见材料</button><p>以下对照统计仅属于当前课程；旧课程诊断在下方单独展示。</p><div class="rd-summary">${Object.entries(r.conditions||{}).map(([c,x])=>`<div><b>${c} · ${percent(x)}</b><span>${{A:'无拼音无语音',B:'有拼音无语音',C:'无拼音系统听读',D:'代读原文后解答'}[c]}</span></div>`).join('')}</div><p>${E(r.interpretation||'这些是支持需求线索，不是固定能力标签。')}</p><ul>${(r.signals||[]).map(x=>`<li>${E(x.label)}：${x.count} 条相关记录，需结合多次未见材料复核。</li>`).join('')}</ul><details><summary>同蓝图对照明细</summary><pre>${E(JSON.stringify({valid:r.matchedSets,excluded:r.diagnosticExcluded||[]},null,2))}</pre></details></section>${e.data.courseScope?historicalDiagnostics(r):''}<section class="rd-parent-card"><h2>十二周变化</h2><div class="rd-table-wrap"><table><thead><tr><th>周</th><th>完成天数</th><th>首答</th><th>L0</th><th>L1</th><th>L2</th><th>L3</th></tr></thead><tbody>${r.weeks.map(w=>`<tr><td>${w.week}${[4,8,12].includes(w.week)?' 阶段':''}</td><td>${w.completedDays}/7</td><td>${percent(w.first)}</td><td>${percent(w.L0)}</td><td>${percent(w.L1)}</td><td>${percent(w.L2)}</td><td>${percent(w.L3)}</td></tr>`).join('')}</tbody></table></div><p>原数学仍保留 ${math.topics} 个已选知识区域。中文训练不降低或替代原数学主线。</p><button class="rd-button" data-action="progress">查看数学学习记录</button><p>${E(academyInfo)}</p><h3>本周与下一周准入</h3>${(r.readiness||[]).map(x=>`<p>第${x.week}周：${E(x.reason)}；样本 ${x.samples||0}，${x.evaluable===false?'未评级':x.ready?'达到本地准入条件':'继续观察与补强'}。</p>`).join('')}</section><section class="rd-parent-card"><h2>先看首答与求助事实</h2><p>${E(r.supportEvidence?.interpretation||'题目标签不等于实际错因。')}</p>${r.supportEvidence?.unreviewedFirst?`<p>尚未分类的首答：${percent(r.supportEvidence.unreviewedFirst)}。作答继续保留，不进入分类、错因、周准入或诊断统计。</p>`:''}<div class="rd-table-wrap"><table><thead><tr><th>任务</th><th>未见无辅助首答</th><th>有辅助首答</th></tr></thead><tbody>${(r.supportEvidence?.byCategory||[]).map(x=>`<tr><td>${{reading:'阅读理解',math:'数学读题',literacy:'字词句'}[x.category]}</td><td>${percent(x.independent)}</td><td>${percent(x.assistedFirst)}</td></tr>`).join('')}</tbody></table></div><p>答错后借助帮助答对，仍保留原始首答。表中比例是任务记录，不是阅读障碍诊断。</p></section><section class="rd-parent-card"><h2>重点补强与下一阶段</h2><p>错误线索：${E(Object.entries(r.errors||{}).map(([k,v])=>`${k}: ${v}`).join('；')||'暂无首答错误记录')}</p><p>需要关注的字词：${E((r.focusWords||[]).map(x=>x.word).join('、')||'等待跨材料记录')}</p><p>字词稳定表现需要多个日期、多个不同题目的无辅助证据，不能凭一次作答确认识字。</p><p>${E(r.recommendation?.reason||'先积累短篇阅读表现。')}</p><button class="rd-button" data-action="rdRemediate">打开对应补强</button><p>到期复习 ${r.due?.length||0} 题。旧题复习不计未见迁移。</p><h3>家长选择已掌握的数学知识</h3>${e.data.materials.some(m=>(!e.data.courseScope||m.courseId===e.data.courseScope.activeCourseId)&&m.prerequisitesStatus==='unreviewed')?'<p>当前课程部分先修知识尚未审校，不会作为已确认先修或周准入证据。</p>':''}<div class="rd-nav">${known.map(k=>`<button class="rd-button" data-action="rdKnown" ${ui.parentSettingsUnlocked?'':'disabled'} data-value="${E(k)}" aria-pressed="${s.knownMath.includes(k)}">${E(k)}</button>`).join('')}</div><p>若文字或条件理解不稳定，优先完成对应备用材料；周目标稳定后再提高文字复杂度，数学仍按原有进度学习。</p></section><section class="rd-parent-card"><h2>点字求助与读文间隔</h2><p>点字次数是求助线索，不是永久生字标签。</p><p>${E((r.tappedCharacters||[]).map(x=>x.character+'：'+x.requests).join('；')||'暂无点字记录')}</p><p>${E(r.readingPace?.caution||'读好按钮前的活动时间不是标准化阅读速度。')}</p>${(r.readingPace?.byAidLevel||[]).map(x=>`<p>L${x.level}：${x.observations} 段，${Math.round(x.activeMs/1000)} 秒，${x.characters} 字。</p>`).join('')}<h2>每日有效时长</h2><p>只累计前台互动和短心跳间的时间；后台、暂停和长时间空置不计。</p>${Object.entries(r.daily||{}).map(([d,t])=>`<p>${E(d)}：${Math.round(t/6000)/10} 分钟</p>`).join('')||'<p>暂无有效时长记录。</p>'}</section><section class="rd-parent-card"><h2>备份与旧版迁移</h2><p>数学与阅读记录分开保存，统一导出同时保留。旧 v2 记录只归档参考，不授予新版独立首答。题目更新后保留原始作答；受影响的未完成草稿归档在备份中，不按新版选项重判。导入合并记录并保留本机课程；同内容版本的未完成课程可暂停恢复，不更改本机语音授权。</p><div class="rd-nav"><button class="rd-button" data-action="progressExport">导出数学与阅读统一备份</button><button class="rd-button" data-action="rdExport">导出阅读备份</button><button class="rd-button" data-action="rdLegacyLocal">归档本机 v2 记录</button></div><label>选择阅读备份 JSON <input type="file" accept="application/json,.json" data-reading-import="true"></label><label>也可粘贴备份 JSON<textarea id="rd-import" data-reading-field="import" rows="5">${E(ui.importText)}</textarea></label><button class="rd-button" data-action="rdImport">合并阅读备份</button><p>已归档旧版备份 ${r.legacyCount||0} 份。</p></section></div>`;
 }
 function renderPage(){ensure();ui.texts.clear();paintState={current:engine.current(),settings:engine.snapshot().settings};try{const state=engine.status(),body=ui.screen==='course'?course():ui.screen==='plan'?plan():ui.screen==='parent'?parent():ui.screen==='finish'?finish():home();return `<div class="rd-app">${state.status!=='ready'?`<div class="rd-storage-alert" role="alert"><p>${E(state.message)}</p><div class="rd-nav">${['unsaved','read_only'].includes(state.status)?button('rdRetrySave','重试保存'):''}${button('rdExport','导出阅读草稿')}</div></div>`:''}${ui.message?`<p class="rd-message" role="status">${rt(ui.message)}</p>`:''}${body}</div>`;}finally{paintState=null;}}
 function syncCoursePhase(){const c=engine.current();ui.phase=c?.session.diagnostic||c?.readingComplete?'quiz':'read';ui.allPanels=false;ui.tapped.clear();}
 function unfinishedCourses(){const pending=engine.unfinished().filter(s=>!s.active);return pending.length?`<details class="rd-unfinished"><summary>${rt('其他未完成的阅读')} (${pending.length})</summary><div class="rd-nav">${pending.map(s=>button('rdResume',(historicalMaterial(engine,findMaterial(engine.data,s.materialId))?'历史课程 · ':'')+s.title,`data-session="${E(s.id)}"`)).join('')}</div></details>`:'';}
 function begin(ids,opts={}){speech.stop();engine.start(ids,opts);syncCoursePhase();ui.screen='course';host.view='reading';host.render();}
 function handle(action,d={}){if(action!=='reading'&&!String(action).startsWith('rd'))return false;const e=ensure();ui.message='';
  if(action==='reading'||action==='rdHome'){show('home');return true;}
  if(action==='rdParent'){ui.parent=true;ui.parentSettingsUnlocked=false;ui.rangeStart=null;ui.rangeEnd=null;show('parent');return true;}
  if(action==='rdOpenDiagnostic'){const set=diagnosticSets(e.data).find(x=>x.id===d.set);if(!set)return true;ui.parent=true;ui.dxSet=set.id;ui.knowledgeConfirmed=false;show('parent');ui.message=(legacyDiagnostic(e.data,set)?'已选择旧版第':'已选择第')+set.week+'周诊断，请家长先确认已学知识。';host.render();const panel=document.getElementById('rd-diagnostic');panel?.scrollIntoView?.({block:'start'});return true;}
  if(action==='rdPlan'){show('plan');return true;}
  if(action==='rdStart'){speech.stop();const c=e.startDay(Math.max(1,Math.min(84,Number(d.day)||e.nextDay())));if(c){syncCoursePhase();ui.screen='course';}else{ui.screen='home';ui.message='这一天不在家长选择的阅读范围内；原课程和记录仍保留。';}host.view='reading';host.render();return true;}
  if(action==='rdDailyOptional'){speech.stop();const day=Number(d.day),c=Number.isInteger(day)?e.startDailyOptional?.(day):null;if(c){syncCoursePhase();ui.screen='course';ui.message='这是自愿挑战，已经看过的原文会记录为已见。';}else ui.message='这一天暂时没有可用的自愿挑战，原记录仍保留。';host.view='reading';host.render();return true;}
  if(action==='rdChallenge'){speech.stop();const c=e.startChallenge();if(c){syncCoursePhase();ui.screen='course';}else ui.message='当前范围暂时没有符合条件的新挑战，原记录仍保留。';host.view='reading';host.render();return true;}
  if(action==='rdFreshDay'){speech.stop();const c=e.startFreshDayChoice(Number(d.day));if(c){syncCoursePhase();ui.screen='course';ui.message='原复习已保留，可以从阅读首页继续。';}else ui.message='当天暂时没有符合先修条件的未见篇章；原复习仍保留。';host.view='reading';host.render();return true;}
  if(action==='rdResume'){speech.stop();const c=e.resumeSession(d.session||e.current()?.session.id);if(c){syncCoursePhase();ui.screen='course';}else{ui.screen='home';ui.message='课程暂不可继续，可能不在当前阅读范围内；原记录和草稿仍保留。';}host.view='reading';host.render();return true;}
  if(action==='rdPause'){e.pause();speech.stop();host.render();return true;}
  if(action==='rdReadDone'){if(ui.phase==='read')e.markReadDone?.();speech.stop();ui.phase='quiz';host.render();return true;}
  if(action==='rdPanelPrev'||action==='rdPanelNext'){const c=e.current();if(c)e.panel(c.session.panelIndex+(action==='rdPanelNext'?1:-1));host.render();return true;}
  if(action==='rdPanelAll'){ui.allPanels=!ui.allPanels;host.render();return true;}
  if(action==='rdWpSpeakItem'){const c=e.current(),i=Number(d.index),text=c?.question.type==='classification'&&c.question.items?.[i];if(ui.phase==='quiz'&&c&&!c.session.paused&&text)speech.speak(text,{kind:'option',sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,elementKey:hash(text)});return true;}
  if(action==='rdExplore'){const c=e.current();if(ui.phase==='quiz'&&c)wpExplore.toggle(c);host.render();return true;}
  if(action==='rdExploreAction'){const c=e.current();if(ui.phase==='quiz'&&c)wpExplore.handle(c,d);host.render();return true;}
  if(String(action).startsWith('rdWp')){const c=e.current();if(ui.phase==='quiz'&&c&&!c.session.paused&&wpSupports(c.question)){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,next=wpNext(c.question,old,action,d);if(next!==undefined)e.select(next);}host.render();return true;}
  if(action==='rdDepartureStep'){const c=e.current(),delta=Number(d.delta);if(ui.phase==='quiz'&&c?.question.type==='departure'&&(delta===-1||delta===1)){const t=c.question.departure,last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected??t.initial;e.select(Math.max(t.min,Math.min(t.max,old+delta*t.step)));}host.render();return true;}
  if(['rdRoutePick','rdRouteUndo','rdRouteClear'].includes(action)){const c=e.current();if(ui.phase==='quiz'&&c?.question.type==='route'){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,draft=Array.isArray(old)?[...old]:[];if(action==='rdRoutePick'){const i=Number(d.index);if(Number.isInteger(i)&&i>=0&&i<c.question.options.length&&draft.length<c.question.route.maxStops)draft.push(i);}else if(action==='rdRouteUndo')draft.pop();else draft.length=0;e.select(draft);}host.render();return true;}
  if(action==='rdCargoPick'){const c=e.current(),i=Number(d.item),trip=Number(d.trip);if(ui.phase==='quiz'&&c?.question.type==='cargo'&&Number.isInteger(i)&&i>=0&&i<c.question.options.length&&(trip===1||trip===2)){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,draft=Array.isArray(old)?[...old]:Array(c.question.options.length).fill(null);draft[i]=draft[i]===trip?null:trip;e.select(draft);}host.render();return true;}
  if(action==='rdMatchPick'){const c=e.current(),li=Number(d.left),index=Number(d.index);if(ui.phase==='quiz'&&c?.question.type==='match'&&Number.isInteger(li)&&li>=0&&li<c.question.matchLeft.length&&Number.isInteger(index)&&index>=0&&index<c.question.options.length){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,draft=Array.isArray(old)?[...old]:Array(c.question.matchLeft.length).fill(null);if(draft[li]===index)draft[li]=null;else{const previous=draft.indexOf(index);if(previous>=0)draft[previous]=null;draft[li]=index;}e.select(draft);}host.render();return true;}
  if(action==='rdPick'){const c=e.current(),i=Number(d.index);if(ui.phase==='quiz'&&c&&Number.isInteger(i)&&i>=0&&i<c.question.options.length){if(c.question.type==='order'){const order=c.session.drafts[c.question.id]||[];if(!order.includes(i))e.select([...order,i]);}else e.select(i);}host.render();return true;}
  if(action==='rdOrderUndo'){const c=e.current();if(c)e.select((c.session.drafts[c.question.id]||[]).slice(0,-1));host.render();return true;}
  if(action==='rdSubmit'){const c=e.current();if(c&&ui.phase==='quiz'){const result=e.submit(c.session.drafts[c.question.id]);if(result&&!result.correct&&!c.session.diagnostic&&!hasFeedbackHint(c))e.requestAid('feedback_hint',{reason:'practice-feedback'});}host.render();return true;}
  if(action==='rdTargetHint'){const c=e.current();if(c&&!c.session.diagnostic&&c.attempts.some(a=>a.sessionId===c.session.id&&!a.correct)&&!hasFeedbackHint(c))e.requestAid('feedback_hint',{reason:'practice-feedback'});host.render();return true;}
  if(action==='rdNext'){const old=e.current();speech.stop();const result=e.next();if(result==='complete'){ui.finishedDay=old?.session.purpose==='optional-challenge'?null:old?.session.day;ui.screen='finish';}else if(result){const c=e.current();if(c&&old?.material.id!==c.material.id){ui.phase=c.session.diagnostic?'quiz':'read';ui.allPanels=false;}}host.render();window.scrollTo({top:0,behavior:'instant'});return true;}
  if(action==='rdReveal'){e.reveal();host.render();return true;}
  if(action==='rdRetry'){ui.message='可以再读文字，或点听全文。第一次的答案不会改变。';host.render();return true;}
  if(action==='rdPinyin'){e.setting('pinyin',d.mode==='none'?'none':'all');host.render();return true;}
  if(action==='rdSettingsUnlock'&&ui.parent&&ui.screen==='parent'){ui.parentSettingsUnlocked=!ui.parentSettingsUnlocked;host.render();return true;}
  if(action==='rdSaveRange'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){const current=e.snapshot().settings.dayRange||{start:1,end:84},start=Number(ui.rangeStart??current.start),end=Number(ui.rangeEnd??current.end);if(!e.setting('dayRange',{start,end}))ui.message='请填写 1 到 84 的起止天数，开始天不能晚于结束天。';else ui.message=e.status().status==='ready'?'阅读范围已保存；不在范围内的课程和草稿仍保留。':'范围尚未保存，请先导出并检查记录状态。';host.render();return true;}
  if(action==='rdSetMode'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){e.setting('pinyin',d.mode);host.render();return true;}
  if(action==='rdRate'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){e.setting('rate',Number(d.rate));host.render();return true;}
  if(action==='rdRemoteConsent'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){e.setting('remoteVoiceConsent',!e.snapshot().settings.remoteVoiceConsent);speech.stop();host.render();return true;}
  if(action==='rdKnown'&&ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked){const known=e.snapshot().settings.knownMath;e.setting('knownMath',known.includes(d.value)?known.filter(x=>x!==d.value):[...known,d.value]);host.render();return true;}
  if(action==='rdDxSet'&&ui.parent){if(diagnosticSets(e.data).some(x=>x.id===d.set)){ui.dxSet=d.set;ui.knowledgeConfirmed=false;}host.render();return true;}
  if(action==='rdKnowledgeConfirm'&&ui.parent){if(selectedSet(e))ui.knowledgeConfirmed=!ui.knowledgeConfirmed;host.render();return true;}
  if(action==='rdDiagnostic'&&ui.parent){const set=selectedSet(e),result=set?e.startDiagnostic(set.id,ui.knowledgeConfirmed):{ok:false,reason:'当前课程还没有可用诊断。'};if(result.ok){speech.stop();ui.phase='quiz';ui.screen='course';}else ui.message=result.reason==='本套四份材料已经使用，不能重记为未见诊断；请保留结果并换新的套题。'?'本套四份材料已经使用，不能再次计入未见诊断；请保留结果并换新的套题。':result.reason;host.render();return true;}
  if(action==='rdReview'){const due=e.due();if(due.length)begin([...new Set(due.map(x=>x.materialId))].slice(0,2),{purpose:'review'});else{ui.message='今天没有到期复习，可以读一段新故事。';host.view='reading';host.render();}return true;}
  if(action==='rdRemediate'){const r=e.recommend();if(r.materialId)begin([r.materialId],{purpose:'remediation'});else{ui.message='暂时没有符合先修选择的新补强材料，请家长看看记录。';host.view='reading';host.render();}return true;}
  if(action==='rdTransfer'){const m=e.transfer();if(m)begin([m.id],{purpose:'unseen-math-transfer'});else{ui.message='暂时没有符合已掌握知识的新题，请家长看看先修选择。';host.render();}return true;}
  if(action==='rdMathConcern'){const task=host.taskNow();if(task)e.mathSignal(task,d.reason);const rec=e.recommend();if(d.reason!=='math'&&rec.materialId)begin([rec.materialId],{purpose:'remediation'});else show('home');return true;}
  if(action==='rdParentRead'){e.requestAid('parent',{attestation:'家长只读原文，不解释答案'});ui.message='已记录家长代读，请孩子继续自己回答。';host.render();return true;}
  if(action==='rdFollow'||action==='rdRetell'){e.requestAid(action==='rdFollow'?'follow_reading':'oral_retell',{evaluation:'self-or-parent-observation',recording:false});ui.message=action==='rdFollow'?'听一句，再自己读一句。不录音，不自动评分。':'说一说人物、发生的事和文字依据。家长观察，不自动评分。';host.render();return true;}
  if(action==='rdChar'){const text=ui.texts.get(d.key),i=Number(d.index);if(text&&Number.isInteger(i)&&i>=0&&i<Array.from(text).length){const mode=e.current()?.session.pinyinMode||e.snapshot().settings.pinyin,changed=mode==='none'?'demand':mode;ui.tapped.add(d.key+':'+i);e.requestAid('pinyin',{mode:changed,character:Array.from(text)[i]});if(mode==='none')e.setting('pinyin','demand');host.render();const c=e.current();speech.speak(Array.from(text)[i],{kind:'character',contextText:text,charIndex:i,elementKey:d.key,sessionId:c?.session.id,materialId:c?.material.id,questionId:c?.question.id});}return true;}
  if(action==='rdVoicePause'){speech.pause();return true;}if(action==='rdVoiceResume'){speech.resume();return true;}if(action==='rdVoiceStop'){speech.stop();return true;}if(action==='rdVoiceRepeat'){speech.repeat();return true;}
  if(['rdSpeakAll','rdSpeakSentence','rdSpeakQuestion','rdSpeakOption','rdSpeakOrderHelp'].includes(action)){const c=e.current();if(c){const index=Number(d.index),text=action==='rdSpeakAll'?c.material.text:action==='rdSpeakSentence'?c.material.panels[index]?.text:action==='rdSpeakQuestion'?c.question.prompt:action==='rdSpeakOrderHelp'?'按顺序点卡片，或拖动左侧把手调整整排。':c.question.options[index];if(text){const isPanel=action==='rdSpeakSentence',offset=isPanel?Array.from(c.material.panels.slice(0,index).map(x=>x.text).join('')).length:0;speech.speak(text,{kind:action==='rdSpeakAll'?'story':isPanel?'sentence':action==='rdSpeakOption'?'option':'question',offset,sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,elementKey:hash(isPanel?c.material.text:text)});}}return true;}
  if(action==='rdRetrySave'){const ok=e.persist();ui.message=ok?'阅读草稿已保存。':e.status().message;host.render();return true;}
  if(action==='rdExport'){download(e.backup(),'tianle-reading-r1-'+Date.now()+'.json');return true;}
  if(action==='rdImport'&&ui.parent){const result=importText(ui.importText);ui.message=result.ok?'阅读记录已合并，原数学记录保留。':result.reason;host.render();return true;}
  if(action==='rdLegacyLocal'&&ui.parent){try{const raw=localStorage.getItem('tianle-reading-v2');if(!raw)ui.message='本机没有 v2 阅读记录。';else{const r=e.importBackup(JSON.stringify({schema:'tianle-reading-v2-backup',store:JSON.parse(raw)}));ui.message=r.ok?'旧版记录已归档，原键保留，不授予新版独立证据。':r.reason;}}catch(_){ui.message='旧版记录未能安全读取，原记录保留。';}host.render();return true;}
  return true;
 }
 function importText(text){try{const b=JSON.parse(text);if(b.format==='tianle-record-backup-v1'&&b.reading)text=JSON.stringify({schema:'amc8-reading-r1-backup',reading:b.reading});}catch(_){}return engine.importBackup(text);}
 function download(text,name){if(typeof document.createElement!=='function'||typeof Blob==='undefined'||typeof URL==='undefined'){ui.message='当前环境无法下载，请用支持下载的浏览器导出。';return;}const u=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 function input(target){if(target?.dataset?.readingField==='departure'){const e=ensure(),c=e.current(),value=Number(target.value);if(ui.phase==='quiz'&&c?.question.type==='departure'&&e.select(value)){const label=document.getElementById('rd-departure-value');if(label)label.textContent=timeLabel(value);target.setAttribute('aria-valuetext',timeLabel(value));const submit=document.querySelector('[data-action=\"rdSubmit\"]');if(submit)submit.disabled=false;}return true;}if(target?.dataset?.readingField==='rangeStart'||target?.dataset?.readingField==='rangeEnd'){if(ui.parent&&ui.screen==='parent'&&ui.parentSettingsUnlocked)ui[target.dataset.readingField]=String(target.value||'');return true;}if(target?.dataset?.readingField==='import'){ui.importText=String(target.value||'').slice(0,16000000);return true;}if(target?.dataset?.readingImport&&target.files?.[0]&&ui.parent){target.files[0].text().then(text=>{const r=importText(text);ui.message=r.ok?'阅读记录已合并。':r.reason;host.render();}).catch(()=>{ui.message='未能读取所选备份。';host.render();});return true;}return false;}
 function afterRender(){if(host.view==='reading'&&engine?.current()?.session.paused)speech.stop();}
 function navigationState(){return {screen:ui.screen,sessionId:engine?.current()?.session.id||null};}
 function restoreNavigation(target){
  if(target?.screen==='course'&&target.sessionId){const c=ensure().resumeSession(target.sessionId);if(c){syncCoursePhase();ui.screen='course';ui.parent=false;ui.parentSettingsUnlocked=false;host.view='reading';host.render();return true}ui.message='这段课程暂不能继续；原记录仍保留，可在家长设置中检查阅读范围。';ui.screen='home';host.view='reading';host.render();return false;}
  if(target?.screen==='parent')return handle('rdParent');
  if(target?.screen==='plan')return handle('rdPlan');
  if(target?.screen==='finish'){show('finish');return true}
  return handle('reading');
 }
 return {render:renderPage,handle,input,entry,mathBridge,leave,afterRender,navigationState,restoreNavigation,snapshot:()=>ensure().snapshot(),report:()=>ensure().report(),engine:()=>ensure(),backup:()=>ensure().backup(),openMaterials:(ids,opts={})=>{ensure();return begin(ids,opts);},rt,pronounce};
})();

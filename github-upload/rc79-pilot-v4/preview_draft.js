// Isolated to this browser tab's sessionStorage. Never reads the formal
// course's saved records, and never replaces an incompatible stored draft.
const PREVIEW_DRAFT_KEY='tianle_reading_preview_v4_tab_draft_v1';
let draftStore=null,draftStatus='unavailable',retainedRaw=null;
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const selectionOk=x=>x===null||(Number.isInteger(x)&&x>=0&&x<3)||(Array.isArray(x)&&x.length<=3&&new Set(x).size===x.length&&x.every(i=>Number.isInteger(i)&&i>=0&&i<3));
function draftStateValid(s){
 if(!plain(s)||!['map','story','question','finish'].includes(s.screen)||!Number.isInteger(s.day)||s.day<0||s.day>=data.days.length)return false;
 if(!Number.isInteger(s.panel)||s.panel<0||s.panel>=data.days[s.day].panels.length||!Number.isInteger(s.question)||s.question<0||s.question>3||!selectionOk(s.selected))return false;
 if(!plain(s.records)||!plain(s.reflections))return false;
 const ids=new Set(data.days.flatMap(d=>[...d.questions,d.extra].map(q=>q.id)));
 for(const [id,r] of Object.entries(s.records)){
  if(!ids.has(id)||!plain(r)||r.questionId!==id||!Array.isArray(r.attempts)||!Array.isArray(r.help)||r.attempts.length>1000||r.help.length>10000)return false;
  if(r.help.some(h=>!plain(h)||typeof h.type!=='string'))return false;
  if(r.first!==null&&!plain(r.first))return false;
  if(r.first!==null&&(!r.attempts.length||JSON.stringify(r.first)!==JSON.stringify(r.attempts[0])))return false;
  for(const a of r.attempts)if(!plain(a)||!selectionOk(a.selected)||typeof a.correct!=='boolean')return false;
 }
 for(const [key,value] of Object.entries(s.reflections))if(!/^([1-9]|1[0-9]|2[01])$/.test(key)||typeof value!=='string'||value.length>5000)return false;
 for(const k of ['pinyin','pinyinEver','audioEver','explorationEver','showHint','showExplanation'])if(typeof s[k]!=='boolean')return false;
 if(!Number.isInteger(s.robot)||s.robot<0||s.robot>8||!Array.isArray(s.bags)||s.bags.some(i=>!Number.isInteger(i)||i<0||i>2))return false;
 if(s.box!==null&&(!Number.isInteger(s.box)||s.box<0||s.box>2))return false;
 if(s.cards!==undefined&&(!Array.isArray(s.cards)||s.cards.length>2||s.cards.some(i=>!Number.isInteger(i)||i<0||i>2)))return false;
 if(s.path!==undefined&&(!Array.isArray(s.path)||s.path.length<1||s.path.length>4||s.path.some(x=>!['S','A','B','C','D','T'].includes(x))))return false;
 if(s.place!==undefined&&s.place!==null&&(!Number.isInteger(s.place)||s.place<0||s.place>2))return false;
 if(s.schedule!==undefined&&s.schedule!==null&&![0,1].includes(s.schedule))return false;
 if(s.lightning!==undefined&&s.lightning!==null&&!['yes','no'].includes(s.lightning))return false;
 if(s.ground!==undefined&&s.ground!==null&&!['safe','unknown'].includes(s.ground))return false;
 if(s.observe!==undefined&&s.observe!==null&&![15,25,35].includes(s.observe))return false;
 if(s.tripReturn!==undefined&&s.tripReturn!==null&&![5,10,20].includes(s.tripReturn))return false;
 const w=s.week3, unique=(a,max)=>Array.isArray(a)&&a.length<=max+1&&new Set(a).size===a.length&&a.every(i=>Number.isInteger(i)&&i>=0&&i<=max);
 if(!plain(w)||!unique(w.timeline,2)||!unique(w.comparison,2)||!unique(w.experiment,4))return false;
 if(!Array.isArray(w.flashes)||w.flashes.length>2||w.flashes.some(n=>![1,2].includes(n)))return false;
 if(w.channel!==null&&(!Number.isInteger(w.channel)||w.channel<0||w.channel>2))return false;
 if(!Array.isArray(w.allocation)||w.allocation.length!==3||w.allocation.some(n=>n!==null&&![9,6,5].includes(n)))return false;
 if(!Number.isInteger(w.target)||w.target<0||w.target>2)return false;
 if(!Array.isArray(w.editor)||w.editor.length!==3||w.editor.some(n=>n!==null&&(!Number.isInteger(n)||n<0||n>2)))return false;
 return true;
}
function restorePreviewDraft(){
 try{draftStore=window.sessionStorage;const raw=draftStore.getItem(PREVIEW_DRAFT_KEY);
  if(raw===null){draftStatus='ready';return}
  retainedRaw=raw;
  if(raw.length>1000000){draftStatus='readonly';return}
  const value=JSON.parse(raw);
  if(!plain(value)||value.schema!==1||value.contentHash!==data.contentHash||!draftStateValid(value.state)){draftStatus='readonly';return}
  const fields=['screen','day','panel','question','selected','showHint','showExplanation','pinyin','pinyinEver','audioEver','explorationEver','robot','bags','box','records','reflections','place','cards','schedule','path','lightning','ground','observe','tripReturn','week3'];
  for(const key of fields)if(Object.prototype.hasOwnProperty.call(value.state,key))state[key]=value.state[key];
  state.message='';state.sound='idle';retainedRaw=null;draftStatus='ready';
 }catch(_){draftStatus=retainedRaw===null?'unavailable':'readonly'}
}
function savePreviewDraft(){
 if(draftStatus!=='ready'||!draftStore)return;
 try{const value=JSON.stringify({schema:1,contentHash:data.contentHash,savedAt:new Date().toISOString(),state});
  if(value.length>1000000)throw Error('PREVIEW_DRAFT_TOO_LARGE');
  draftStore.setItem(PREVIEW_DRAFT_KEY,value);
 }catch(_){draftStatus='unavailable'}
}
function previewDraftMessage(){
 return draftStatus==='ready'?'本标签页会暂存试玩进度；关闭前仍请下载。':
  draftStatus==='readonly'?'已有试玩记录暂不能安全恢复，未覆盖；请先下载原记录。新的进度只在当前页面保留。':
  '试玩暂存不可用；当前进度只在页面保留，请先下载。';
}
function downloadRetainedPreview(){
 if(retainedRaw===null)return;
 const url=URL.createObjectURL(new Blob([retainedRaw],{type:'application/json'})),link=document.createElement('a');
 link.href=url;link.download='reading-preview-original-backup.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

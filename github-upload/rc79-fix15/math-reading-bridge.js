
const readingHost=window.__AMC8_READING_HOST;
const previousReadingView=readingHost.view;
Object.defineProperties(readingHost,{view:{configurable:true,get:()=>view,set:value=>{view=value}},saved:{configurable:true,get:()=>saved}});
readingHost.render=render;readingHost.taskNow=taskNow;
if(previousReadingView==='reading')view='reading';
window.__AMC8_MATH_NAV={
 math(){homePortal=false;open('home')},home(){homePortal=true;open('home')},progress(){homePortal=false;open('progress')},stop(){stopAllSpeech()},
 route(){if(view==='reading')return null;if(view==='home')return {page:homePortal?'hub':'math-select'};if(view==='progress')return {page:'math-progress'};if(view==='examMapping'){const a=saved.rtm1?.sessions?.active;return {page:'math-work',attemptId:a?.attemptId||null,finished:a?.finished===true}}if(view==='competition'&&topicActive&&topicSession()){const s=topicSession();return {page:'math-topic',sessionId:s.id,cursor:s.cursor,taskId:s.items[s.cursor]?.taskId||null}}return {page:'math-select'}},
 restore(target){
  homePortal=false;
  if(target?.page==='math-progress'){open('progress');return}
  if(target?.page==='math-topic'){const s=topicSession();if(s?.id===target.sessionId&&s.cursor===target.cursor&&s.items[s.cursor]?.taskId===target.taskId){topicOpenCurrent();return}open('progress');return}
  if(target?.page==='math-work'){
   const a=saved.rtm1?.sessions?.active;
   if(!target.attemptId||a?.attemptId===target.attemptId&&(!a.finished||target.finished)){ExamMappingUI.handle('rtmOpen',{});return}
   const old=a?.attemptId===target.attemptId?a:(saved.rtm1?.sessions?.archived||[]).find(x=>x.attemptId===target.attemptId);
   if(old){ExamMappingUI.handle('rtmHistory',{});ExamMappingUI.handle('rtmReview',{id:old.attemptId});return}
   open('progress');return;
  }
  open('home');
 }
};

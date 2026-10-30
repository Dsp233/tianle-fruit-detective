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


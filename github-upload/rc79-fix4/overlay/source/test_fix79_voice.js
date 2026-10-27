'use strict';
// Synthetic callbacks only: audio and iPad Safari remain device-pending.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(path.join(__dirname,'reading_media.js'),'utf8');
function setup(initial=[],consent=false){
 let rows=initial,id=0;const timers=new Map(),states=[],aids=[],utterances=[],listeners={},calls=[];
 const synth={getVoices:()=>rows,cancel(){calls.push('cancel')},speak(u){utterances.push(u);calls.push('speak')},pause(){calls.push('pause')},resume(){calls.push('resume')},addEventListener(k,f){listeners[k]=f},removeEventListener(k){delete listeners[k]}};
 const window={speechSynthesis:synth,SpeechSynthesisUtterance:function(text){this.text=text},setTimeout(f,ms){const key=++id;timers.set(key,{f,ms});return key},clearTimeout(key){timers.delete(key)}};
 const ctx={window,console};vm.createContext(ctx);vm.runInContext(source,ctx);
 const speech=window.ReadingSpeech.create({getRemoteConsent:()=>consent,onStatus:v=>states.push(v),onAid:(kind,info)=>aids.push({kind,...info})});
 return {speech,states,aids,utterances,listeners,timers,calls,setRows:v=>{rows=v},fire(ms){for(const [key,value] of [...timers])if(value.ms===ms){timers.delete(key);value.f()}},last:()=>states.at(-1)?.state};
}
const local={lang:'zh-CN',name:'Synthetic local',localService:true};
{
 const a=setup();assert.equal(a.speech.speak('等音色。',{kind:'story'}),false);assert.equal(a.last(),'voices_loading');assert.equal(a.utterances.length,0);assert.equal(a.aids.length,1);
 a.setRows([local]);a.listeners.voiceschanged();assert.equal(a.last(),'voices_ready');assert.equal(a.utterances.length,0,'Late voice must not start without another user action');assert.equal(a.timers.size,0);
 assert(a.speech.repeat());assert.equal(a.utterances.length,1);assert.equal(a.last(),'requested');assert(!a.states.some(s=>s.state==='started'));a.utterances[0].onstart();assert.equal(a.last(),'started');
 a.listeners.voiceschanged();assert.equal(a.last(),'started','Voice updates must not replace active playback state');a.fire(8000);assert.equal(a.last(),'started');a.utterances[0].onend();assert.equal(a.last(),'ended');
}
{
 const a=setup();a.speech.speak('没有音色。');a.fire(3000);assert.equal(a.last(),'no_voice');assert.equal(a.utterances.length,0);a.setRows([local]);a.listeners.voiceschanged();assert.equal(a.last(),'voices_ready');
}
{
 const a=setup([{lang:'zh-CN',name:'remote',localService:false}]);assert.equal(a.speech.speak('不上传。'),false);assert.equal(a.last(),'blocked');assert.equal(a.utterances.length,0);
}
{
 const a=setup([local]);a.speech.speak('被阻止。');const old=a.utterances[0];a.fire(8000);assert.equal(a.last(),'failed');assert.equal(a.states.at(-1).error,'start_timeout');assert(a.calls.filter(x=>x==='cancel').length>=2);old.onstart();assert.equal(a.last(),'failed','Late start from cancelled utterance must be ignored');assert(a.speech.repeat());assert.equal(a.utterances.length,2);a.utterances[1].onerror({error:'not-allowed'});assert.equal(a.last(),'failed');assert.equal(a.states.at(-1).error,'not-allowed');
}
{
 const a=setup([local]);a.speech.speak('先停止。');const old=a.utterances[0];a.speech.stop();a.fire(8000);old.onstart();assert.equal(a.last(),'stopped');assert.equal(a.timers.size,0);a.speech.destroy();assert(!a.listeners.voiceschanged);
}
{
 const a=setup([local]);a.speech.speak('结束却未开始。');a.utterances[0].onend();assert.equal(a.last(),'failed');assert.equal(a.states.at(-1).error,'missing_start');assert(!a.states.some(s=>s.state==='started'));
}
console.log('PASS voice loading, manual retry, blocked remote, missing start, cancellation, and late callback; synthetic only');

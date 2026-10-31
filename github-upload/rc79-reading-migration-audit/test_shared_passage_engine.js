'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(path.join(__dirname,'reading_engine.shared_passage.prototype.js'),'utf8'),key='shared_test_reading_r1';
const q=id=>({id,type:'choice',category:'reading',ability:'inference',errorType:'information',targetWords:[],prompt:'哪一项？',options:['甲','乙','丙'],answer:1,explanation:'乙',evidence:[]});
const m=(id,course,text,group)=>({id,courseId:course,...(group?{exposureGroup:group}:{}),day:1,week:1,kind:'story',title:id,text,goal:'推理',tags:[],difficulty:1,focusWords:[],prerequisites:[],panels:[{text}],questions:[q(id+'-q')]});
function data(){return {schema:1,contentHash:'shared-v1',courseScope:{schema:1,activeCourseId:'NEW'},materials:[m('old','OLD','共同原文。','old-group'),m('core','NEW','共同原文。','new-group'),m('extra','NEW','共同原文。','new-group'),m('fresh','NEW','另一段新文字。','fresh-group')],lessons:[{day:1,week:1,weekDay:1,kind:'new',coreIds:['core'],reserveIds:['fresh'],targetMinutes:15}],weeks:[],diagnostics:{sets:[]}}}
function storage(){const x=new Map();return {getItem:k=>x.has(k)?x.get(k):null,setItem:(k,v)=>x.set(k,String(v)),removeItem:k=>x.delete(k)}}
function engine(d=data(),s=storage()){const context={window:{__AMC8_STORAGE_TEST:true},console,Math,Date};vm.createContext(context);vm.runInContext(code,context);return {e:context.window.ReadingEngine.create(d,s,key,()=>2000000000000),s}}
{
 const {e}=engine();e.setting('pinyin','none');e.start(['core']);e.requestAid('story',{});e.submit(1);assert.equal(e.exposure('extra'),true);assert.equal(e.exposure('fresh'),false);e.start(['extra']);const a=e.submit(1);assert.equal(a.priorExposure,true);assert.equal(a.independent,false);assert.equal(a.voiceEver,true);assert.equal(a.aidLevel,2);assert.equal(a.practiceAidLevel,0);
}
{
 const {e}=engine();e.setting('pinyin','none');e.start(['core']);e.requestAid('question',{});e.reveal();e.submit(1);e.start(['extra']);const a=e.submit(1);assert.equal(a.priorExposure,true);assert.equal(a.independent,false);assert.equal(a.voiceEver,false);assert.equal(a.answerExposed,false);
}
{
 const {e}=engine();e.setting('pinyin','all');e.start(['core']);e.submit(1);e.setting('pinyin','none');e.start(['extra']);const a=e.submit(1);assert.equal(a.pinyinEver,true);assert.equal(a.aidLevel,1);assert.equal(a.practiceAidLevel,0);
}
{
 const {e}=engine();e.setting('pinyin','none');e.start(['old']);e.requestAid('story',{});e.submit(1);e.start(['core']);const a=e.submit(1);assert.equal(a.priorExposure,true);assert.equal(a.voiceEver,true);assert.equal(a.independent,false);assert.equal(e.report().first.total,1);assert.equal(e.report().historical.first.total,1);
}
{
 const d=data();delete d.materials[2].exposureGroup;const {e}=engine(d);e.start(['core']);assert.equal(e.exposure('extra'),true);
}
{
 const d=data(),s=storage();s.setItem(key,'unchanged');d.materials[2].text='不相同的正文。';assert.throws(()=>engine(d,s));assert.equal(s.getItem(key),'unchanged');
}
{
 const d=data();delete d.courseScope;const {e}=engine(d);e.setting('pinyin','none');e.start(['core']);assert.equal(e.exposure('extra'),false);e.start(['extra']);assert.equal(e.submit(1).priorExposure,false);
}
console.log(JSON.stringify({result:'PASS',scope:'isolated shared-passage engine, synthetic records',samePassageAcrossIdsSeen:true,samePassageAcrossCoursesSeen:true,storyAidCarried:true,questionAidNotCarried:true,practiceAidSeparate:true,oldAndNewProgressSeparate:true,mismatchedGroupBlocked:true,unscopedLegacyBehaviorPreserved:true}));

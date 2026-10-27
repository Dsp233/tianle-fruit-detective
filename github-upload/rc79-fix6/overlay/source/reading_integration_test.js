'use strict';
/* Executes the compiled application with synthetic storage/clock/speech events.
 * It is intentionally not a native browser, acoustic review or learner result.
 */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {boot}=require('./test_support');
const ROOT=path.resolve(__dirname,'..'),args=process.argv.slice(2);
function option(name,fallback){const i=args.indexOf(name);return i<0?fallback:args[i+1];}
const htmlPath=path.resolve(ROOT,option('--html','qa/normal/index.html'));
const only=option('--only',null),html=fs.readFileSync(htmlPath,'utf8');
if(only&&!['data','daily','bank','diagnostic','evidence'].includes(only)){console.error('Unknown --only group: '+only);process.exit(2);}
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const storeMatch=html.match(/const STORE='([^']+)';/);assert(storeMatch,'Compiled mathematics namespace missing');
const mathKey=storeMatch[1],readingKey=mathKey+'_reading_r1',rows=[],populations={dailyRoutes:0,dailySubmissions:0,courseMaterials:0,courseQuestions:0,diagnosticSets:0,diagnosticForms:0,diagnosticQuestions:0,pinyinTexts:0,pinyinHanzi:0};
let bankIdentity=null;
const now0=Date.UTC(2026,9,25,1);
function app(seed={}){const time={now:now0};const a=boot(seed,time,html);return {a,time};}
const current=a=>a.value('ReadingUI.engine().current()');
function pick(a,q,value=q.answer){if(q.type==='order'){let draft=current(a).session.drafts[q.id]||[];for(let i=0;i<draft.length;i++)a.click('rdOrderUndo');for(const index of value)a.click('rdPick',{index:String(index)});}else a.click('rdPick',{index:String(value)});}
function readDone(a,time){if(a.root.innerHTML.includes('data-action="rdReadDone"')){time.now+=12000;a.click('rdReadDone');}}
function finish(a,time,{onMaterial=()=>{},onQuestion=()=>{}}={}){let n=0,lastMaterial='';while(current(a)){assert(n++<40,'A session failed to advance');let c=current(a);if(c.material.id!==lastMaterial){lastMaterial=c.material.id;onMaterial(c);c=current(a);}readDone(a,time);c=current(a);assert(!a.root.innerHTML.includes('class="rd-art"'),'Scored quiz must not display the story illustration');assert(!a.root.innerHTML.includes('class="rd-explanation"'),'Answers must remain unrevealed before an explicit request');onQuestion(c);const before=a.value('ReadingUI.engine().attempts('+JSON.stringify(c.question.id)+').length');pick(a,c.question);assert.equal(a.value('ReadingUI.engine().attempts('+JSON.stringify(c.question.id)+').length'),before,'Selecting an option must not submit it');time.now+=2500;a.click('rdSubmit');const submitted=current(a).attempts;assert.equal(submitted.length,before+1,c.question.id+' missing actual submission');assert.equal(submitted[submitted.length-1].correct,true,c.question.id+' canonical answer was misgraded');a.click('rdNext');}return n;}
function check(id,name,fn){if(only&&id!==only)return;const started=Date.now();try{const actual=fn();rows.push({id,name,status:'PASS',elapsedMs:Date.now()-started,actual:actual??true});console.log('PASS '+id+' '+name);}catch(error){rows.push({id,name,status:'FAIL',elapsedMs:Date.now()-started,error:error.stack});console.error('FAIL '+id+'\n'+error.stack);}}
function data(a){return a.value('window.__AMC8_READING_DATA');}
function fakeLocalVoice(a){a.run('window.speechSynthesis.getVoices=()=>[{name:"SYNTHETIC_TEST_MANDARIN",lang:"zh-CN",localService:true}];window.speechSynthesis.pause=()=>{};window.speechSynthesis.resume=()=>{};');}
function syntheticListen(a){const start=a.utterances.length;a.click('rdSpeakAll');assert(a.utterances.length>start,'Synthetic local voice was not queued');let index=start,guard=0;while(index<a.utterances.length){assert(++guard<30,'Speech sentence queue did not terminate');const u=a.utterances[index++];u.onstart?.();u.onboundary?.({charIndex:0,charLength:u.text.length});u.onend?.();}return index-start;}

check('data','Exact compiled bank, weekly map, per-codepoint pinyin and six abilities',()=>{
 const {a}=app(),d=data(a);bankIdentity=d.contentHash;
 assert.equal(d.materials.length,252);assert.equal(d.lessons.length,84);assert.equal(d.weeks.length,12);assert.equal(d.diagnostics.sets.length,13);
 assert.deepEqual(d.lessons.map(l=>l.day),Array.from({length:84},(_,i)=>i+1));
 const categories={reading:0,math:0,literacy:0},abilities=new Set(),ids=new Set();
 for(const m of d.materials){assert(!ids.has(m.id));ids.add(m.id);assert.equal(m.panels.map(p=>p.text).join(''),m.text);for(const q of m.questions){assert(!ids.has(q.id));ids.add(q.id);categories[q.category]++;abilities.add(q.ability);}}
 assert.deepEqual(categories,{reading:420,math:252,literacy:168});assert.equal(abilities.size,6);
 const dx=d.diagnostics.sets.flatMap(s=>s.forms.flatMap(f=>f.materials));assert.equal(dx.length,104);assert.equal(dx.reduce((n,m)=>n+m.questions.length,0),208);
 const annotated=[...new Set([...d.materials,...dx].flatMap(m=>[m.title,m.text,...m.questions.flatMap(q=>[q.prompt,q.explanation,...q.options])]))];
 for(const text of annotated){if(!/[\u3400-\u9fff]/u.test(text))continue;const chars=Array.from(text),pin=d.pinyinTexts[text];assert(Array.isArray(pin),text+' missing exact annotation');assert.equal(pin.length,chars.length,text+' annotation misaligned');for(let i=0;i<chars.length;i++)if(/[\u3400-\u9fff]/u.test(chars[i])){assert(pin[i]&&!/[\u3400-\u9fff]/u.test(pin[i]),chars[i]+' lacks a pinyin syllable');populations.pinyinHanzi++;}populations.pinyinTexts++;}
 return {materials:252,courseQuestions:840,diagnosticMaterials:104,diagnosticQuestions:208,categories,abilities:[...abilities],contentHash:d.contentHash};
});

check('daily','All 84 daily routes open and finish through actual child handlers',()=>{
 const {a,time}=app();a.click('reading');const baselineMath=a.storage[mathKey]??null;
 for(let day=1;day<=84;day++){a.click('rdStart',{day:String(day)});assert.equal(a.value('view'),'reading');assert.equal(current(a).session.day,day);assert(current(a).material.text.length>0);populations.dailyRoutes++;populations.dailySubmissions+=finish(a,time);assert.equal(current(a),null);if(day%14===0)console.log('daily progress '+day+'/84');}
 assert.equal(populations.dailyRoutes,84);assert.equal(a.storage[mathKey]??null,baselineMath,'Reading routes changed the mathematics store');
 const report=a.value('ReadingUI.report()');assert.equal(report.completedDays,84);assert.equal(report.weeks.length,12);
 return {dailyRoutes:populations.dailyRoutes,actualSubmissions:populations.dailySubmissions,mathBytesPreserved:true,calendarCompletionIsNotMastery:true,recordBytes:Buffer.byteLength(a.storage[readingKey]||'')};
});

check('bank','All 252 authored materials and 840 questions render, shuffle and submit',()=>{
 const {a,time}=app();a.click('reading');a.run('ReadingUI.engine().setting("pinyin","none")');const baselineMath=a.storage[mathKey]??null,materials=a.value('window.__AMC8_READING_DATA.materials.map(m=>({id:m.id,count:m.questions.length}))'),positionCounts={};
 for(const [n,m]of materials.entries()){
  a.run('ReadingUI.openMaterials('+JSON.stringify([m.id])+',{purpose:"synthetic-full-bank-acceptance"})');assert.equal(current(a).material.id,m.id);populations.courseMaterials++;
  populations.courseQuestions+=finish(a,time,{onQuestion:c=>{const indices=Array.from(a.root.innerHTML.matchAll(/class="rd-option(?: rd-selected)?"[^>]*data-action="rdPick"[^>]*data-index="(\d+)"/g),m=>Number(m[1]));assert.equal(indices.length,c.question.options.length,'Option buttons missing canonical indices');assert.deepEqual([...indices].sort((x,y)=>x-y),c.question.options.map((_,i)=>i));if(c.question.type!=='order'){const p=indices.indexOf(c.question.answer);positionCounts[p]=(positionCounts[p]||0)+1;}const first=indices.join(',');pick(a,c.question);const after=Array.from(a.root.innerHTML.matchAll(/class="rd-option(?: rd-selected)?"[^>]*data-action="rdPick"[^>]*data-index="(\d+)"/g),m=>Number(m[1]));assert.equal(after.join(','),first,'Option order changed during selection');}});
  if((n+1)%42===0)console.log('bank progress '+(n+1)+'/252');
 }
 assert.equal(populations.courseMaterials,252);assert.equal(populations.courseQuestions,840);assert(Object.keys(positionCounts).length>=3,'Correct displayed option positions are systematically fixed');assert.equal(a.storage[mathKey]??null,baselineMath);
 const report=a.value('ReadingUI.report()');assert.equal(report.first.total,840);assert.equal(report.first.correct,840);assert.equal(report.levels.find(x=>x.level===0).total,840);
 assert.equal(a.value('ReadingUI.engine().transfer()'),null,'A previously opened bank was relabeled as unseen transfer');
 return {materials:252,questions:840,correctDisplayPositions:positionCounts,mathBytesPreserved:true,syntheticCanonicalAnswersOnly:true,recordBytes:Buffer.byteLength(a.storage[readingKey]||'')};
});

check('diagnostic','All 13 diagnostic sets and 52 forms preserve A/B/C/D boundaries',()=>{
 const {a,time}=app();a.click('reading');fakeLocalVoice(a);const sets=a.value('window.__AMC8_READING_DATA.diagnostics.sets.map(s=>({id:s.id,forms:s.forms.length}))');
 for(const set of sets){const conditions=[];for(let form=0;form<4;form++){
   a.click('rdParent');a.click('rdDxSet',{set:set.id});a.click('rdKnowledgeConfirm');a.click('rdDiagnostic');assert(current(a),'Diagnostic did not start');const condition=current(a).session.diagnostic.condition;conditions.push(condition);assert(!a.root.innerHTML.includes('class="rd-art"'),'Diagnostic exposed story art');
   populations.diagnosticForms++;populations.diagnosticQuestions+=finish(a,time,{onMaterial:c=>{if(condition==='C')syntheticListen(a);if(condition==='D')a.click('rdParentRead');},onQuestion:c=>{assert.equal(c.session.diagnostic.setId,set.id);if(condition==='A'||condition==='C'||condition==='D')assert.equal(c.session.pinyinMode,'none');if(condition==='B')assert.equal(c.session.pinyinMode,'all');}});
  }assert.deepEqual([...conditions].sort(),['A','B','C','D']);const reused=a.value('ReadingUI.engine().startDiagnostic('+JSON.stringify(set.id)+',true)');assert.equal(reused.ok,false,'Used diagnostic forms were relabeled unseen');populations.diagnosticSets++;console.log('diagnostic progress '+populations.diagnosticSets+'/13');}
 const report=a.value('ReadingUI.report()');for(const c of ['A','B','C','D']){assert.equal(report.conditions[c].total,52,c+' eligible population mismatch');assert.equal(report.conditions[c].correct,52);}
 assert.equal(populations.diagnosticForms,52);assert.equal(populations.diagnosticQuestions,208);
 return {sets:13,forms:52,questions:208,conditions:report.conditions,speechLifecycle:'SYNTHETIC_START_BOUNDARY_END_ONLY_NOT_ACOUSTIC_QUALITY',allFormsUnseenAtFirstOpen:true};
});

check('evidence','Integrated first response, help, pinyin, pause, backup and legacy preservation',()=>{
 const legacy={version:2,answers:{'legacy-q':{correct:false,usedVoice:true}},review:{},readingAids:{'1:story':true},openedAt:'2026-10-01'};
 const oldMath=JSON.stringify({contentRevision:153,storageVersion:2,attempts:[{id:'historical-attempt',taskInstanceId:'historical-preserved',gradingResult:'incorrect',firstSubmissionCorrect:false}],taskHistory:{},topicPractice:{selectedTopicIds:['A01'],session:null,nextSeed:1},competition:{attempts:[],extensions:[]}});
 const {a,time}=app({[mathKey]:oldMath,'tianle-reading-v2':JSON.stringify(legacy),'tianle_academy_v5_prototype':'{"version":12,"events":[{"id":"old-academy-event"}]}'});
 a.click('reading');const mathBefore=a.storage[mathKey]??null,legacyBefore=a.storage['tianle-reading-v2'],stateBefore=a.value('saved');
 a.run('ReadingUI.openMaterials(["R-D002-S1"],{purpose:"synthetic-evidence"})');const material=current(a).material;readDone(a,time);
 // Actual ruby order must match the full text and its contextual annotation.
 const evidence=a.root.innerHTML.match(/<section class="rd-text-evidence">[\s\S]*?<div class="rd-story-text">([\s\S]*?)<\/div>/)?.[1];assert(evidence);
 const rubies=Array.from(evidence.matchAll(/<ruby[^>]*data-rd-index="(\d+)"[^>]*><rb>([\s\S]*?)<\/rb><rt[^>]*>([\s\S]*?)<\/rt><\/ruby>/g));
 const pins=a.value('window.__AMC8_READING_DATA.pinyinTexts['+JSON.stringify(material.text)+']'),chars=Array.from(material.text);assert.equal(rubies.length,chars.filter(c=>/[\u3400-\u9fff]/u.test(c)).length);
 for(const row of rubies){const i=Number(row[1]);assert.equal(row[2],chars[i]);assert.equal(row[3],pins[i]);}
 a.click('rdPinyin',{mode:'none'});let c=current(a);const wrong=c.question.type==='order'?[...c.question.answer].reverse():(c.question.answer+1)%c.question.options.length;pick(a,c.question,wrong);a.click('rdSubmit');let first=current(a).attempts[0];assert.equal(first.correct,false);assert.equal(first.aidLevel,1,'Hiding previously displayed pinyin erased aid history');assert(!a.root.innerHTML.includes('class="rd-explanation"'),'Wrong answer exposed the explanation automatically');
 a.click('rdSpeakAll');pick(a,c.question,c.question.answer);a.click('rdSubmit');const after=current(a).attempts;assert.equal(after.length,2);assert.equal(after[0].correct,false);assert.equal(after[1].correct,true);assert(after[1].aidLevel>=2);assert.equal(after[0].id,first.id);assert.equal(a.value('ReadingUI.report().first.correct'),0);
 a.click('rdReveal');assert(a.root.innerHTML.includes('class="rd-explanation"'));assert(a.value('ReadingUI.engine().current().revealed'));
 a.click('rdPause');assert.equal(current(a).session.paused,true);a.click('rdResume');assert.equal(current(a).session.paused,false);
 // All four display strategies are selectable by a parent and do not erase aid.
 a.click('rdParent');a.click('rdSettingsUnlock');for(const mode of ['all','demand','focus','none']){a.click('rdSetMode',{mode});assert.equal(a.value('ReadingUI.snapshot().settings.pinyin'),mode);}
 a.click('rdLegacyLocal');assert.equal(a.value('ReadingUI.report().legacyCount'),1);a.click('rdLegacyLocal');assert.equal(a.value('ReadingUI.report().legacyCount'),1);assert.equal(a.storage['tianle-reading-v2'],legacyBefore);
 a.click('rdSetMode',{mode:'demand'});a.run('ReadingUI.openMaterials(["R-D003-S2"],{purpose:"synthetic-character-help"})');const tap=a.root.innerHTML.match(/data-action="rdChar" data-key="([^"]+)" data-index="(\d+)"/);assert(tap,'Story characters lack a real click target');a.click('rdChar',{key:tap[1],index:tap[2]});assert(a.value('ReadingUI.snapshot().events.some(e=>e.type==="aid_requested"&&e.kind==="pinyin"&&typeof e.character==="string")'),'Character help was not recorded');
 const backup=a.value('progressSnapshot()');assert(backup.reading&&backup.record);assert.equal(backup.academyRecord,'{"version":12,"events":[{"id":"old-academy-event"}]}');assert.deepEqual(backup.record,stateBefore,'Reading overwrote the original math profile');assert.equal(a.storage[mathKey]??null,mathBefore);
 const exported=a.value('ReadingUI.backup()'),merged=a.value('ReadingUI.engine().importBackup('+JSON.stringify(exported)+')');assert.equal(merged.ok,true);assert.equal(merged.count,0,'Reimport duplicated event history');assert.equal(a.value('ReadingUI.engine().importBackup("{bad").ok'),false);
 a.click('rdResume');readDone(a,time);c=current(a);const prior=current(a).attempts.length;a.click('rdPick',{index:'999'});a.click('rdSubmit');assert.equal(current(a).attempts.length,prior,'Out-of-range selection was accepted');
 a.click('rdParent');a.click('rdDxSet',{set:'BASELINE'});a.click('rdKnowledgeConfirm');a.click('rdDiagnostic');assert.equal(current(a).session.diagnostic.condition,'A');a.click('rdPinyin',{mode:'all'});a.click('rdPinyin',{mode:'none'});c=current(a);pick(a,c.question);a.click('rdSubmit');assert.equal(current(a).attempts[0].diagnosticValidity.eligible,false,'An assisted A condition was accepted as unassisted evidence');
 a.click('home');assert.equal(a.value('view'),'home');a.click('fruit');assert.equal(a.value('view'),'fruit');const mathTaskId=a.value('taskNow().id');assert(mathTaskId,'Original mathematics route is not playable');
 a.click('person',{index:'2'});a.click('check');assert.equal(a.value('feedback.ok'),false,'Mathematics first response did not reach its actual incorrect feedback');assert(a.root.innerHTML.includes('data-action="rdMathConcern"'),'Incorrect math feedback lacks the reading-support entry');const mathAfterIncorrect=a.storage[mathKey]??null;
 a.click('rdMathConcern',{reason:'character'});assert.equal(a.value('view'),'reading');assert.equal(current(a).session.purpose,'remediation');assert.equal(current(a).material.kind,'reserve');assert(a.value('ReadingUI.snapshot().events.some(e=>e.type==="math_reading_signal"&&e.mathTaskId==='+JSON.stringify(mathTaskId)+'&&e.reason==="character")'));assert.equal(a.storage[mathKey]??null,mathAfterIncorrect,'Reading remediation rewrote mathematics first-answer evidence');
 return {originalFirstPreserved:true,priorPinyinPreserved:true,wrongAnswerNotAutomaticallyRevealed:true,mathProfileAndBytesPreserved:true,legacyRawPreserved:true,unifiedBackup:true,allPinyinModes:true,actualRubyPairs:rubies.length,returnToMath:true,actualWrongMathToTargetedReading:true};
});

const failures=rows.filter(r=>r.status==='FAIL'),sourceFiles=['reading_engine.js','reading_ui.js','reading_media.js','reading_integration_test.js','reading_data.js'];
const result={schema:1,result:failures.length?'FAIL':'PASS',completeSuite:!only,environment:'Node VM executes the compiled application with synthetic DOM/storage/clock and explicitly synthetic speech lifecycle callbacks; no native browser, physical device, acoustic or real child claim.',compiledHtmlPath:path.relative(ROOT,htmlPath),compiledHtmlSha256:sha(html),productionBuildSha256:sha(fs.readFileSync(path.join(ROOT,'index.html'))),contentHash:bankIdentity||(()=>{try{const {a}=app();return a.value('window.__AMC8_READING_DATA.contentHash');}catch(_){return null;}})(),sourceHashes:Object.fromEntries(sourceFiles.map(name=>[name,sha(fs.readFileSync(path.join(__dirname,name)))])),cases:rows.length,passed:rows.length-failures.length,populations,rows,failures,nativeBrowser:'NOT_RUN',realAudioQuality:'NOT_RUN',realChildEffect:'NOT_MEASURED',learningRecords:'SYNTHETIC_ISOLATED_TEST_ONLY'};
if(only&&result.result==='PASS')result.result='PARTIAL_PASS';
const output=path.resolve(ROOT,option('--out',only?'docs/reading/integration_'+only+'_results.json':'docs/reading/integration_test_results.json'));fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:result.result,cases:result.cases,passed:result.passed,populations,compiledHtmlSha256:result.compiledHtmlSha256,output}));if(failures.length)process.exitCode=1;

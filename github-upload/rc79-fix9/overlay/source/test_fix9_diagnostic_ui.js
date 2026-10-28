'use strict';
const assert=require('node:assert/strict'),{boot}=require('./test_support');
const a=boot(),current=()=>a.value('ReadingUI.engine().current()');
a.run('window.speechSynthesis.getVoices=()=>[{name:"Synthetic local",lang:"zh-CN",localService:true}];');
a.click('reading');
for(const condition of ['A','B','C']){a.click('rdHome');a.click('rdParent');a.click('rdDxSet',{set:'BASELINE'});a.click('rdKnowledgeConfirm');a.click('rdDiagnostic');assert.equal(current().session.diagnostic.condition,condition)}
const firstMaterial=current().material.id;
function answer(){const q=current().question;if(q.type==='order')for(const i of q.answer)a.click('rdPick',{index:String(i)});else a.click('rdPick',{index:String(q.answer)});a.click('rdSubmit');return current().attempts.at(-1)}
// The real UI requests question audio, then receives a synthetic browser start.
a.click('rdSpeakQuestion');assert(a.utterances.length>0);a.utterances.at(-1).onstart();const first=answer();
assert.equal(first.diagnosticValidity.eligible,false);assert(!a.root.innerHTML.includes('data-action="rdReveal"'));assert(!a.root.innerHTML.includes('class="rd-explanation"'));
a.click('rdReveal');assert(!a.root.innerHTML.includes('class="rd-explanation"'));assert.equal(a.value('ReadingUI.snapshot().events.filter(e=>e.type==="answer_revealed").length'),0);
a.click('rdNext');assert.equal(current().material.id,firstMaterial);
// The real UI requests original text; onstart is intentionally simulated.
a.click('rdSpeakAll');a.utterances.at(-1).onstart();const second=answer();assert.equal(second.diagnosticValidity.eligible,true);assert.equal(second.answerExposed,false);
assert(a.root.innerHTML.includes('data-action="rdReveal"'));a.click('rdReveal');assert(a.root.innerHTML.includes('class="rd-explanation"'));
const before=a.value('ReadingUI.snapshot().events.filter(e=>e.type==="attempt")');assert.equal(before.length,2);assert.equal(a.value('ReadingUI.snapshot().events.filter(e=>e.type==="answer_revealed"&&e.materialId==='+JSON.stringify(firstMaterial)+').length'),current().material.questions.length);
const b=boot(a.storage);assert.deepEqual(b.value('ReadingUI.snapshot().events.filter(e=>e.type==="attempt")'),before);assert.equal(b.value('ReadingUI.engine().report().conditions.C.total'),1);
console.log(JSON.stringify({result:'PASS',scope:'built UI in a VM with synthetic speech callbacks',questionVoiceExcluded:true,originalStoryStartQualified:true,explanationDeferred:true,bothExposuresRecorded:true,attemptsSurviveReload:true,physicalAudio:'NOT_TESTED',physicalIPad:'NOT_TESTED',realChild:'NOT_RUN'}));

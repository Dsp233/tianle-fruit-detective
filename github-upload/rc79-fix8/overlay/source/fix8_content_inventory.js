'use strict';
// Inventory is not an editorial or teaching assessment. All rows start open.
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const c={window:{}};vm.createContext(c);vm.runInContext(fs.readFileSync(path.join(__dirname,'reading_data.js'),'utf8'),c);
const data=c.window.__AMC8_READING_DATA,hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const cases={
 'R-D001-S1':['screenshot_age_fit','review_can_recur_at_later_days'],
 'R-D002-M':['four_leading_subquestions'],
 'R-D042-M':['wording_condition_ambiguity'],
 'R-D083-S1':['unnatural_phrase']
};
function row(m,scope,extra={}){return {id:m.id,scope,day:m.day??null,week:m.week??null,kind:m.kind,title:m.title,difficulty:m.difficulty,prerequisites:m.prerequisites,questionIds:m.questions.map(q=>q.id),questionTypes:m.questions.map(q=>q.type),questionCount:m.questions.length,materialSha256:hash(m),identifiedReviewLeads:cases[m.id]||[],languageReview:'NOT_RUN',cognitiveFitReview:'NOT_RUN',independentAnswerReview:'NOT_RUN',mediaAndPinyinReview:'NOT_RUN',...extra};}
const daily=data.materials.map(m=>row(m,'daily'));
const diagnostic=data.diagnostics.sets.flatMap(s=>s.forms.flatMap(f=>f.materials.map(m=>row(m,'diagnostic',{set:s.id,form:f.id}))));
assert.equal(daily.length,252);assert.equal(daily.reduce((n,x)=>n+x.questionCount,0),840);
assert.equal(diagnostic.length,104);assert.equal(diagnostic.reduce((n,x)=>n+x.questionCount,0),208);
assert.equal(new Set([...daily,...diagnostic].map(x=>x.id)).size,356);
const result={schema:1,baseline:'FIX7',purpose:'Content inventory and traceability; every item remains unreviewed until actual human/content review',readingContentHash:data.contentHash,dailyMaterials:daily.length,dailyQuestions:840,diagnosticMaterials:diagnostic.length,diagnosticQuestions:208,sourceFileSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'reading_data.js'))).digest('hex'),manualReview:'NOT_RUN',materials:[...daily,...diagnostic]};
const out=process.argv[2]||path.join(__dirname,'../../fix8-evidence/content-inventory.json');fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({result:'PASS',dailyMaterials:daily.length,dailyQuestions:840,diagnosticMaterials:diagnostic.length,diagnosticQuestions:208,manualReview:'NOT_RUN',sha256:crypto.createHash('sha256').update(fs.readFileSync(out)).digest('hex')}));

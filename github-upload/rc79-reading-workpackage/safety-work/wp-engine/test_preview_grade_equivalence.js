'use strict';
// Compare the candidate's actual submit grading against the pinned v11 preview.
// A test-only early return avoids persisting tens of thousands of test attempts.
// This checks equivalence to the preview, not the educational correctness of it.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),v11=path.join(root,'safety-work/wp-integration/v11-source');
const data=JSON.parse(fs.readFileSync(path.join(root,'safety-work/wp-course-data/candidate_reading_data.json'),'utf8'));
const template=fs.readFileSync(path.join(v11,'preview.template.html'),'utf8');
const snippet=template.slice(template.indexOf(' function taskSelectionComplete('),template.indexOf(' function quiz()'));
assert(snippet.includes('function taskCorrect('));
const original={};vm.createContext(original);vm.runInContext(fs.readFileSync(path.join(v11,'future_tasks.js'),'utf8')+'\n'+snippet+'\nthis.check=taskSelectionComplete;this.grade=taskCorrect;',original);
let source=fs.readFileSync(path.join(__dirname,'reading_engine.js'),'utf8');
const needle="   const row=append('attempt',{sessionId:c.session.id";
assert.equal(source.split(needle).length,2,'instrument exactly one submit path');
source=source.replace(needle,"   if(window.__AUDIT_PURE_GRADE__)return {correct};\n"+needle);
const ctx={window:{__AMC8_STORAGE_TEST:true,__AUDIT_PURE_GRADE__:true},Math,Date,console};vm.createContext(ctx);vm.runInContext(source,ctx);
function values(q){
 const range=n=>Array.from({length:n},(_,i)=>i),product=(xs,n)=>n===0?[[]]:product(xs,n-1).flatMap(v=>xs.map(x=>[...v,x]));
 const permutations=a=>a.length===0?[[]]:a.flatMap((x,i)=>permutations(a.filter((_,j)=>i!==j)).map(rest=>[x,...rest]));
 switch(q.type){
 case 'choice':return range(q.options.length);
 case 'order':case 'match':return permutations(range(q.options.length));
 case 'route':{const middles=[1,2,3,4];return [...middles.map(x=>[0,x,5]),...product(middles,2).map(x=>[0,...x,5])];}
 case 'departure':return [570,572,575,580];
 case 'cargo':case 'manifest':return product([1,2],q.options.length);
 case 'pair':case 'anypair':return product(range(q.options.length),2).filter(x=>x[0]!==x[1]);
 case 'sequence':return product(['A','B'],4).map(x=>x.join(''));
 case 'loop':return range(7).map(x=>'loop:'+x);
 case 'rule':return product(['blue','red'],1).flatMap(([color])=>['&','|'].flatMap(op=>['square','circle'].map(shape=>color+op+shape)));
 case 'purchase':return product(range(7),3).filter(a=>a.some(x=>x)).map(a=>'packs:'+a.join(','));
 case 'classification':return product(range(q.options.length),q.items.length);
 case 'strip':return [0,1,2];
 case 'grid':case 'mirror':return range(2**(q.grid.rows*q.grid.cols)).slice(1).map(mask=>range(q.grid.rows*q.grid.cols).filter(i=>mask&(1<<i)));
 case 'allocation':return product(range(q.allocation.total+1),q.options.length);
 default:throw Error('Unhandled type '+q.type);
 }
}
const counts={},questions=data.materials.filter(m=>m.courseId===data.courseScope.activeCourseId).flatMap(m=>m.questions);
for(const q of questions){
 const m={id:'test',day:1,week:1,kind:'story',title:'test',text:'test',goal:'test',tags:[],difficulty:1,focusWords:[],prerequisites:[],panels:[{text:'test'}],questions:[q]};
 const bank={schema:1,contentHash:'equivalence',materials:[m],lessons:[{day:1,coreIds:[m.id],reserveIds:[]}],weeks:[],diagnostics:{sets:[]}};
 const s={v:null,getItem(){return this.v},setItem(_k,v){this.v=String(v)}};
 const e=ctx.window.ReadingEngine.create(bank,s,'grade',()=>2000000000000);e.start([m.id]);
 for(const v of values(q)){
  const originalValue=q.type==='route'?v.map(i=>q.options[i]).join('>'):v;
  assert.equal(original.check(q.sourceQuestion,originalValue),true,'source completeness '+q.sourcePreviewId+' '+JSON.stringify(v));
  const expected=original.grade(q.sourceQuestion,originalValue),actual=e.submit(v);
  assert(actual,'candidate rejected complete source value '+q.sourcePreviewId+' '+JSON.stringify(v));
  assert.equal(actual.correct,expected,'different grading '+q.sourcePreviewId+' '+JSON.stringify(v));
  counts[q.type]=(counts[q.type]||0)+1;
 }
}
console.log(JSON.stringify({result:'PASS_PREVIEW_EQUIVALENCE',questions:questions.length,states:Object.values(counts).reduce((a,b)=>a+b,0),byType:counts,scope:'source-preview equivalence only; no independent educational or mathematical validation'}));

'use strict';
// Renew only the source context after proving all inherited tasks and grading
// contracts byte-for-byte equivalent as structured data. Retain every old note.
const fs=require('fs'),assert=require('assert/strict'),path=require('path'),cp=require('child_process');
const root=path.resolve(process.argv[2]);process.chdir(root);
const read=n=>JSON.parse(fs.readFileSync('source/'+n,'utf8')),oldNative=read('joint_native_snapshot.json'),oldReviews=read('joint_reuse_reviews.json');
cp.execFileSync('node',['source/capture_joint_reuse.js'],{stdio:'inherit'});
const next=read('joint_native_snapshot.json');for(const key of ['families','tasks','contracts'])assert.deepEqual(next[key],oldNative[key],key+' changed; a fresh semantic review is required');
const J=require(root+'/source/joint_reuse_review'),reviews=read('joint_reuse_reviews.json');
for(const [id,row] of Object.entries(reviews.families)){
 const snapshot=J.snapshot(id,row.targets);assert(snapshot,'Missing current snapshot '+id);
 const strip=x=>{const y=JSON.parse(JSON.stringify(x));delete y.sourceHashes;return y};
 assert.deepEqual(strip(snapshot),strip(row.snapshot),'Review meaning changed '+id);
 row.snapshot=snapshot;
 const before=JSON.parse(JSON.stringify(oldReviews.families[id])),after=JSON.parse(JSON.stringify(row));delete before.snapshot.sourceHashes;delete after.snapshot.sourceHashes;assert.deepEqual(after,before);
}
fs.writeFileSync('source/joint_reuse_reviews.json',JSON.stringify(reviews,null,2)+'\n');
const delta=Object.keys(next.sourceHashes).filter(k=>next.sourceHashes[k]!==oldNative.sourceHashes[k]);
const report={schema:1,result:'PASS_SCOPED_CONTEXT_REFRESH',sourceContextDelta:delta,inheritedFamilies:Object.keys(next.families).length,inheritedTasks:Object.keys(next.tasks).length,gradingContracts:Object.keys(next.contracts).length,tasksAndContractsUnchanged:true,oldReviewScopeAndNotesPreserved:true,newTeachingOrLearningApproval:false};
fs.mkdirSync('docs/rc79',{recursive:true});fs.writeFileSync('docs/rc79/home-r1-context-refresh.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));

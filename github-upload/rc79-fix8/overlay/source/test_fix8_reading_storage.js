'use strict';
// Synthetic isolated profiles; exercises the built UI and the real reading engine.
const assert=require('node:assert/strict'),{boot}=require('./test_support');
function begin(){const a=boot();a.click('reading');a.click('rdStart',{day:'1'});a.click('rdReadDone');return a;}
function answer(a){const q=a.value('ReadingUI.engine().current().question');if(q.type==='order')for(const i of q.answer)a.click('rdPick',{index:String(i)});else a.click('rdPick',{index:String(q.answer)});a.click('rdSubmit');}
function visible(html){return html.replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/g,'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ');}

// Another page changed the record: grading is explicitly unsaved, the local
// draft is exportable, and the changed stored record is never overwritten.
const a=begin(),key=a.value('ReadingUI.engine().key'),other=JSON.parse(a.storage[key]);
other.revision++;a.storage[key]=JSON.stringify(other);const external=a.storage[key];
a.run('ReadingUI.engine().externalChange();render()');assert.equal(a.value('ReadingUI.engine().status().status'),'conflict');
assert(a.root.innerHTML.includes('data-action="rdExport"'));assert(!a.root.innerHTML.includes('data-action="rdRetrySave"'));
answer(a);assert(visible(a.root.innerHTML).includes('当前阅读记录尚未保存'));
assert.equal(a.storage[key],external);const draft=JSON.parse(a.value('ReadingUI.engine().backup()'));
assert.equal(draft.reading.events.filter(x=>x.type==='attempt').length,1);
a.click('rdRetrySave');assert.equal(a.value('ReadingUI.engine().status().status'),'conflict');assert.equal(a.storage[key],external);

// A temporary quota failure can be retried: original record remains until the
// retry succeeds and the complete pending attempt survives a clean reload.
const b=begin(),key2=b.value('ReadingUI.engine().key'),before=b.storage[key2],set=b.ctx.localStorage.setItem;
b.ctx.localStorage.setItem=(k,v)=>{if(k===key2)throw Error('QuotaExceededError');set(k,v);};
answer(b);assert.equal(b.value('ReadingUI.engine().status().status'),'unsaved');assert.equal(b.storage[key2],before);
assert(b.root.innerHTML.includes('data-action="rdRetrySave"'));assert(visible(b.root.innerHTML).includes('当前阅读记录尚未保存'));
assert.equal(JSON.parse(b.value('ReadingUI.engine().backup()')).reading.events.filter(x=>x.type==='attempt').length,1);
b.ctx.localStorage.setItem=set;b.click('rdRetrySave');assert.equal(b.value('ReadingUI.engine().status().status'),'ready');
assert(visible(b.root.innerHTML).includes('阅读草稿已保存'));const restored=boot(b.storage);restored.click('reading');
assert.equal(restored.value('ReadingUI.snapshot().events.filter(x=>x.type==="attempt").length'),1);
assert.equal(restored.value('ReadingUI.engine().current().session.paused'),true);
console.log(JSON.stringify({result:'PASS',scope:'isolated VM reading UI/storage',conflictExport:true,conflictNeverOverwrites:true,unsavedFeedback:true,quotaRetry:true,attemptSurvivesReload:true,nativeBrowser:'NOT_RUN'}));

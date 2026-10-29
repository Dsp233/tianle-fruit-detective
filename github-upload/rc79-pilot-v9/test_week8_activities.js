'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const state={day:49,question:0,explorationEver:false},record={help:[]};
const ctx={state,rt:x=>String(x),button:(a,l,extra='')=>'<button data-action="'+a+'" '+extra+'>'+l+'</button>',currentRecord:()=>record,say:(text,kind)=>record.help.push({type:'audio',kind,text})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/week8_activities.js','utf8'),ctx);ctx.resetWeek8();
const act=(a,i=0)=>ctx.week8Handle(a,{dataset:{}},i);
act('w8Torch',4);assert(ctx.week8Activity().includes('还差 1 节'));act('w8Torch',3);assert(ctx.week8Activity().includes('另外剩 1 节'));state.question=3;assert(ctx.week8Activity().includes('另外剩 0 节'));
state.question=0;state.day=50;act('w8BoxMore',0);act('w8BoxMore',1);assert(ctx.week8Activity().includes('共 2 盒、5 张'));
state.day=51;const before=record.help.length;act('w8PackMore',0);act('w8PackMore',1);assert.equal(ctx.week8PurchaseValue(),'packs:1,1,0');assert.equal(record.help.length,before);assert(ctx.week8Activity().includes('共 6 张，花 8 分'));act('w8SpeakPrices');assert.equal(record.help.at(-1).type,'audio');
// Enumerate all reachable package states and all exact-six combinations, including dominated options.
let combinations=0,best=Infinity,optimal=[];
for(let a=0;a<=6;a++)for(let b=0;b<=6;b++)for(let c=0;c<=6;c++){const total=ctx.week8PackTotals([a,b,c]);assert.equal(total.cards,4*a+2*b+c);assert.equal(total.points,5*a+3*b+2*c);if(total.cards===6){combinations++;if(total.points<best){best=total.points;optimal=[[a,b,c]];}else if(total.points===best)optimal.push([a,b,c]);}}
assert.equal(combinations,6);assert.equal(best,8);assert.deepEqual(optimal,[[1,1,0]]);
state.question=3;assert.equal(ctx.week8PackTotals([1,1,0]).points,10);assert.equal(ctx.week8PackTotals([0,3,0]).points,9);state.question=0;
act('w8PacksClear');for(let i=0;i<8;i++)act('w8PackMore',2);assert.equal(state.week8.packs[2],6);for(let i=0;i<8;i++)act('w8PackLess',2);assert.equal(state.week8.packs[2],0);
state.day=52;act('w8Decoration',2);assert(ctx.week8Activity().includes('还剩 1 分'));act('w8Decoration',2);assert.equal(state.week8.decoration,null);
state.day=53;const planBefore=record.help.length;act('w8Plan',0);act('w8Plan',2);assert.equal(record.help.length,planBefore);assert(ctx.week8Activity().includes('蓝底板、说明标签；共 8 分'));act('w8Plan',0);assert.deepEqual(Array.from(state.week8.plan),[2]);act('w8Plan',1);assert(ctx.week8Activity().includes('说明标签、红底板；共 8 分'));state.question=3;assert(ctx.week8Activity().includes('共 9 分'));act('w8SpeakPlan');assert.equal(record.help.at(-1).type,'audio');
state.day=54;act('w8Stock',2);assert(ctx.week8Activity().includes('数量未确认'));state.day=55;act('w8Ledger',1);assert(ctx.week8Activity().includes('还剩 4 分，标签待领'));
console.log(JSON.stringify({result:'PASS',scope:'343 package states, 6 exact-six combinations, reserve accounting and reversible multi-plan assembly; not teaching acceptance'}));

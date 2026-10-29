'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/preview.template.html','utf8'),start=source.indexOf(' function taskSelectionComplete'),end=source.indexOf(' function quiz()',start);assert(start>=0&&end>start);
const ctx={rt:x=>String(x)};vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
const pair={type:'pair',answer:[0,1],options:['甲','乙','丙']};assert(ctx.taskSelectionComplete(pair,[1,0]));assert(ctx.taskCorrect(pair,[1,0]));assert(!ctx.taskCorrect(pair,[0,2]));assert(!ctx.taskSelectionComplete(pair,[0,0]));
const sequence={type:'sequence',answer:['ABAB','ABBA','BAAB','BABA'],options:['甲','乙']};
for(let n=0;n<16;n++){const value=Array.from({length:4},(_,i)=>(n>>i)&1?'A':'B').join(''),expected=new Set(value.slice(0,2)).size===2&&new Set(value.slice(2)).size===2;assert.equal(ctx.taskCorrect(sequence,value),expected,value)}
assert(!ctx.taskSelectionComplete(sequence,'AB'));assert(!ctx.taskSelectionComplete(sequence,'ABCX'));assert(ctx.taskSelectionComplete(sequence,'AABB'));
assert(ctx.taskCorrect({type:'route',answer:'S>B>C>T'},'S>B>C>T'));assert(!ctx.taskCorrect({type:'route',answer:'S>B>C>T'},'S>A>C>T'));
console.log(JSON.stringify({result:'PASS',scope:'pair order, all 16 planning sequences and route correctness; no child or teaching acceptance'}));

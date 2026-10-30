'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(__dirname+'/preview.template.html','utf8'),start=source.indexOf(' function taskSelectionComplete'),end=source.indexOf(' function quiz()',start);assert(start>=0&&end>start);
const ctx={rt:x=>String(x)};vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/future_tasks.js','utf8'),ctx);vm.runInContext(source.slice(start,end),ctx);
const pair={type:'pair',answer:[0,1],options:['甲','乙','丙']};assert(ctx.taskSelectionComplete(pair,[1,0]));assert(ctx.taskCorrect(pair,[1,0]));assert(!ctx.taskCorrect(pair,[0,2]));assert(!ctx.taskSelectionComplete(pair,[0,0]));
const sequence={type:'sequence',answer:['ABAB','ABBA','BAAB','BABA'],options:['甲','乙']};
for(let n=0;n<16;n++){const value=Array.from({length:4},(_,i)=>(n>>i)&1?'A':'B').join(''),expected=new Set(value.slice(0,2)).size===2&&new Set(value.slice(2)).size===2;assert.equal(ctx.taskCorrect(sequence,value),expected,value)}
assert(!ctx.taskSelectionComplete(sequence,'AB'));assert(!ctx.taskSelectionComplete(sequence,'ABCX'));assert(ctx.taskSelectionComplete(sequence,'AABB'));
assert(ctx.taskCorrect({type:'route',answer:'S>B>C>T'},'S>B>C>T'));assert(!ctx.taskCorrect({type:'route',answer:'S>B>C>T'},'S>A>C>T'));
const loop={type:'loop',answer:'loop:3'};for(let n=0;n<=6;n++){assert(ctx.taskSelectionComplete(loop,'loop:'+n));assert.equal(ctx.taskCorrect(loop,'loop:'+n),n===3)}assert(!ctx.taskSelectionComplete(loop,'loop:7'));
const rule={type:'rule',answer:'blue&square'};for(const c of ['blue','red'])for(const shape of ['square','circle'])for(const op of ['&','|']){const v=c+op+shape;assert(ctx.taskSelectionComplete(rule,v));assert.equal(ctx.taskCorrect(rule,v),c==='blue'&&shape==='square'&&op==='&')}assert(!ctx.taskSelectionComplete(rule,'purple&square'));
console.log(JSON.stringify({result:'PASS',scope:'pair order, all 16 planning sequences and route correctness; no child or teaching acceptance'}));

const purchase={type:'purchase',answer:'packs:1,1,0'};for(let a=0;a<=6;a++)for(let b=0;b<=6;b++)for(let c=0;c<=6;c++){const v='packs:'+a+','+b+','+c;assert.equal(ctx.taskSelectionComplete(purchase,v),a+b+c>0);assert.equal(ctx.taskCorrect(purchase,v),a===1&&b===1&&c===0)}assert(!ctx.taskSelectionComplete(purchase,'packs:7,0,0'));assert(!ctx.taskSelectionComplete(purchase,'packs:-1,0,0'));
const anypair={type:'anypair',answer:[[0,2],[1,2]]};let valid=0;for(let a=0;a<3;a++)for(let b=0;b<3;b++){const v=[a,b];assert.equal(ctx.taskSelectionComplete(anypair,v),a!==b);const expected=a!==b&&(a===2||b===2);assert.equal(ctx.taskCorrect(anypair,v),expected);if(expected)valid++;}assert.equal(valid,4);assert(!ctx.taskSelectionComplete(anypair,[0,1,2]));


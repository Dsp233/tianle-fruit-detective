'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const state={day:35,question:0,explorationEver:false},record={help:[]};
const ctx={state,rt:x=>String(x),button:(a,l,extra='')=>'<button data-action="'+a+'" '+extra+'>'+l+'</button>',currentRecord:()=>record,say:(text,kind)=>record.help.push({type:'audio',kind,text})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/week6_activities.js','utf8'),ctx);ctx.resetWeek6();
ctx.week6Handle('w6Point',{dataset:{}},0);assert(ctx.week6Activity().includes('增加 5 厘米'));state.question=3;assert(ctx.week6Activity().includes('增加 4 厘米'));
state.day=36;state.question=0;const before=record.help.length;ctx.week6Handle('w6Card',{dataset:{}},1);ctx.week6Handle('w6Card',{dataset:{}},0);assert.deepEqual(Array.from(state.week6.cards),[1,0]);assert.equal(record.help.length,before);ctx.week6Handle('w6SpeakCard',{dataset:{}},0);assert(record.help.at(-1).text.includes('灯距 30'));
state.day=37;ctx.week6Handle('w6Record',{dataset:{}},1);assert(ctx.week6Activity().includes('空白，含义尚未核实'));
state.day=38;ctx.week6Handle('w6Setup',{dataset:{}},0);ctx.week6Handle('w6Setup',{dataset:{}},2);assert(ctx.week6Activity().includes('纸片、位置'));
state.day=39;ctx.week6Handle('w6Outlier',{dataset:{}},3);assert(ctx.week6Activity().includes('是否有误还需核查'));
state.day=40;state.question=0;const prior=record.help.length;for(const value of ['A','B','B','A'])ctx.week6Handle('w6Sequence',{dataset:{value}},0);assert.equal(state.week6.sequence.join(''),'ABBA');assert.equal(record.help.length,prior);ctx.week6Handle('w6Undo',{dataset:{}},0);assert.equal(state.week6.sequence.join(''),'ABB');
state.day=41;ctx.week6Handle('w6Editor',{dataset:{}},1);ctx.week6Handle('w6Editor',{dataset:{}},1);assert.equal(state.week6.editor[1],1);assert(state.explorationEver);
console.log(JSON.stringify({result:'PASS',boards:7,scope:'synthetic state transitions only; child and physical device NOT_RUN'}));


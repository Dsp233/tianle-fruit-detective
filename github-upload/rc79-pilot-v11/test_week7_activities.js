'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const state={day:42,question:0,explorationEver:false},record={help:[]};const ctx={state,rt:x=>String(x),button:(a,l,extra='')=>'<button data-action="'+a+'" '+extra+'>'+l+'</button>',currentRecord:()=>record,say:(text,kind)=>record.help.push({type:'audio',kind,text})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/week7_activities.js','utf8'),ctx);ctx.resetWeek7();const act=(a,v,i=0)=>ctx.week7Handle(a,{dataset:{value:v}},i);
act('w7Step');assert(ctx.week7Activity().includes('现在是 5'));act('w7Step');assert(ctx.week7Activity().includes('现在是 10'));act('w7StepUndo');assert.equal(state.week7.step,1);state.question=3;assert(ctx.week7Activity().includes('现在是 6'));
for(const g of [0,1,2])for(const c of [0,1,2]){const expected=g===2||c===2?'待核实':g===1&&c===1?'可以继续':'先等待';assert.equal(ctx.week7Condition(g,c),expected);}
for(const g of [0,1])for(const c of [0,1])assert.equal(ctx.week7Condition(g,c,true),g+c>0?'可以继续':'先等待');
state.day=44;state.question=0;act('w7A');act('w7A');act('w7B');act('w7B');assert(ctx.week7Activity().includes('甲：3 → 5 → 10；乙：3 → 6 → 8'));
state.day=45;const before=record.help.length;for(let n=0;n<8;n++)act('w7Loop');assert.equal(state.week7.loop,6);assert.equal(record.help.length,before);act('w7LoopClear');act('w7Loop');act('w7LoopUndo');assert.equal(state.week7.loop,0);act('w7SpeakLoop');assert.equal(record.help.at(-1).type,'audio');
state.day=46;act('w7UnknownClosed');assert.equal(state.week7.unknownClosed,0);assert(ctx.week7Activity().includes('先等待'));act('w7UnknownGreen');assert(ctx.week7Activity().includes('待核实'));
state.day=47;act('w7Card',null,2);assert(ctx.week7Activity().includes('丙：蓝色三角形'));
state.day=48;const help=record.help.length;act('w7RuleLogic','and');assert.equal(ctx.week7RuleValue(),'blue&square');assert.equal(record.help.length,help);
// Independently enumerate all eight editable rule configurations against confirmed samples.
const samples=[['blue','square',true],['blue','circle',false],['red','square',false]];let matching=0;
for(const color of ['blue','red'])for(const shape of ['square','circle'])for(const logic of ['and','or']){const rule={color,shape,logic};const agrees=samples.every(([c,s,want])=>ctx.week7RunRule(c,s,rule)===want);if(agrees){matching++;assert.deepEqual(rule,{color:'blue',shape:'square',logic:'and'});}}
assert.equal(matching,1);act('w7RuleTest');assert.equal(record.help.at(-1).activity,'w7RuleTest');assert(state.week7.rule.tested);act('w7RuleColor','red');assert(!state.week7.rule.tested);act('w7SpeakRule');assert(record.help.at(-1).text.includes('红色并且方形'));
console.log(JSON.stringify({result:'PASS',boards:7,scope:'step execution, loop bounds, all 9 input states and 8 rule configurations; no child or teaching acceptance'}));


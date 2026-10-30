'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const state={day:21,question:0,explorationEver:false},record={help:[]};
const ctx={state,rt:x=>String(x),button:(a,l,extra='')=>'<button data-action="'+a+'" '+extra+'>'+l+'</button>',currentRecord:()=>record};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/week4_activities.js','utf8'),ctx);ctx.resetWeek4();
ctx.week4Handle('w4Point',{dataset:{}},0);assert(ctx.week4Activity().includes('下降 3 厘米'));
state.day=22;ctx.week4Handle('w4Container',{dataset:{}},0);ctx.week4Handle('w4Container',{dataset:{}},2);assert(ctx.week4Activity().includes('共 7 升'));state.question=3;assert(ctx.week4Activity().includes('共 6 升'));
state.day=23;state.question=0;ctx.week4Handle('w4Route',{dataset:{}},2);assert(ctx.week4Activity().includes('暂时关闭'));state.question=3;assert(ctx.week4Activity().includes('已确认开放'));
state.day=24;ctx.week4Handle('w4Rain',{dataset:{}},2);assert(ctx.week4Activity().includes('空白，含义尚未核实'));
state.day=25;ctx.week4Handle('w4Experiment',{dataset:{}},0);ctx.week4Handle('w4Experiment',{dataset:{}},2);assert(ctx.week4Activity().includes('坡度、用水量'));
state.day=26;state.question=0;ctx.week4Handle('w4Repair',{dataset:{}},0);ctx.week4Handle('w4Repair',{dataset:{}},1);assert(ctx.week4Activity().includes('合计 7 单位'));ctx.week4Handle('w4Repair',{dataset:{}},2);assert(ctx.week4Activity().includes('已超过预算'));assert(ctx.week4Activity().includes('现场确认'));
state.day=27;ctx.week4Handle('w4Editor',{dataset:{}},1);ctx.week4Handle('w4Editor',{dataset:{}},1);assert.equal(state.week4.editor[1],1);assert(state.explorationEver&&record.help.length>=10);
console.log(JSON.stringify({result:'PASS',boards:7,scope:'synthetic state transitions only; child and physical device NOT_RUN'}));


'use strict';
// Exercise the actual generated pronunciation function with a selected order
// option whose exact reading differs from the character fallback.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'reading_ui.js'),'utf8');
assert(source.includes("(q.type==='order'&&order.includes(i)?(order.indexOf(i)+1)+' · ':'')+q.options[i]"));
const start=source.indexOf('function pronounce(text){'),end=source.indexOf('\n function rt(',start);
assert(start>=0&&end>start);
const ctx={window:{__AMC8_READING_DATA:{pinyinTexts:{'调整天线':['tiáo','zhěng','tiān','xiàn']},pinyinMap:{'调':'diào','整':'zhěng','天':'tiān','线':'xiàn'},phrases:{}}},Array,String,Object};
vm.createContext(ctx);vm.runInContext('let phrases=null;\n'+source.slice(start,end),ctx);
const pronounce=s=>Array.from(ctx.pronounce(s));
assert.deepEqual(pronounce('调整天线'),['tiáo','zhěng','tiān','xiàn']);
assert.deepEqual(pronounce('1 · 调整天线'),['','','','','tiáo','zhěng','tiān','xiàn']);
assert.deepEqual(pronounce('12 · 调整天线'),['','','','','','tiáo','zhěng','tiān','xiàn']);
assert.deepEqual(pronounce('调'),['diào']);
console.log(JSON.stringify({result:'PASS_TARGETED',selectedOrderOptionKeepsExactPinyin:true,otherFallbackUnchanged:true}));

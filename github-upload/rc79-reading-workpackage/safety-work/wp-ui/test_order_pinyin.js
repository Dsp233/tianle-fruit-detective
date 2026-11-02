'use strict';
// Exercise the actual generated pronunciation function with a selected order
// option whose exact reading differs from the character fallback.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'reading_ui.js'),'utf8');
assert(source.includes("(q.type==='order'&&order.includes(i)?(order.indexOf(i)+1)+' · ':'')+q.options[i]"));
const start=source.indexOf('function pronounce(text){'),end=source.indexOf('\n function rt(',start);
assert(start>=0&&end>start);
const ctx={window:{__AMC8_READING_DATA:{pinyinTexts:{'调整天线':['tiáo','zhěng','tiān','xiàn'],'题目要求':['tí','mù','yào','qiú']},pinyinMap:{'调':'diào','整':'zhěng','天':'tiān','线':'xiàn','题':'tí','目':'mù','要':'yào','求':'qiú','只':'zhǐ','能':'néng','对':'duì','应':'yīng','先':'xiān','后':'hòu'},phrases:{}}},Array,String,Object};
vm.createContext(ctx);vm.runInContext('let phrases=null;\n'+source.slice(start,end),ctx);
const pronounce=s=>Array.from(ctx.pronounce(s));
assert.deepEqual(pronounce('调整天线'),['tiáo','zhěng','tiān','xiàn']);
assert.deepEqual(pronounce('1 · 调整天线'),['','','','','tiáo','zhěng','tiān','xiàn']);
assert.deepEqual(pronounce('12 · 调整天线'),['','','','','','tiáo','zhěng','tiān','xiàn']);
assert.deepEqual(pronounce('调'),['diào']);
assert.deepEqual(pronounce('题目要求'),['tí','mù','yào','qiú'],'existing exact entry wins');
assert.deepEqual(pronounce('题目要求的'),['tí','mù','yāo','qiú','']);
assert.deepEqual(pronounce('只能对应'),['zhǐ','néng','duì','yìng']);
assert.deepEqual(pronounce('先后要求'),['xiān','hòu','yāo','qiú']);
assert.deepEqual(pronounce('：要求'),['','yāo','qiú']);
assert.equal(pronounce('短闪 → 长闪；和为 3，约定：西门')['短闪 → 长闪；和为 3，约定：西门'.indexOf('为')],'wéi','computed flash sum uses wéi');
assert.notEqual(pronounce('；和为 3')[2],'wéi','unrelated fallback is unchanged');
assert.deepEqual(pronounce('要求'),['yào','qiú'],'generic cross-boundary fallback stays unchanged');
// 哪儿 is one erhua syllable; the character-aligned ruby values are nǎ + r.
// Test actual generated data and speech context selection without claiming
// audible playback or using a real voice.
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../wp-course-data/candidate_reading_data.json'),'utf8'));
ctx.window.__AMC8_READING_DATA=data;
const texts=['如果甲单的日期改成明天，它还能直接说明今天蓝箱去哪儿了吗？','规则中有没有指定它必须放在哪儿？','第二行第二列的镜像应该在哪儿？'];
const mediaContext={window:{__AMC8_READING_DATA:data},Date,Math,Array,String,Object};vm.createContext(mediaContext);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../wp-integration/v11-source/reading_media.js'),'utf8'),mediaContext);
for(const text of texts){const i=text.indexOf('哪儿');assert.deepEqual(pronounce(text).slice(i,i+2),['nǎ','r']);
 for(const at of [i,i+1]){let aid=null;const speech=mediaContext.window.ReadingSpeech.create({onAid:(_kind,event)=>{aid=event}});speech.speak(text[at],{kind:'character',contextText:text,charIndex:at});assert(aid?.spokenText.includes('哪儿'),'character speech must request context');}}
console.log(JSON.stringify({result:'PASS_TARGETED',selectedOrderOptionKeepsExactPinyin:true,dynamicBoardContextsCorrected:true,erhuaCharacterContextRequested:true,exactAndGenericFallbackUnchanged:true,actualAudio:'NOT_RUN'}));

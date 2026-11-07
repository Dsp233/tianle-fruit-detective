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
// Reproduce both reachable quantified board labels without changing the
// generic 只 pronunciation or existing exact/historical entries.
for(const label of ['已放 2 只，总重 5 千克。','已选 3 只，剩余空间共 7 升。']){
 assert.equal(pronounce(label)[label.indexOf('只')],'zhī',label);
}
assert.equal(pronounce('只')[0],'zhǐ','generic 只 fallback stays unchanged');
// 哪儿 is one erhua syllable; the character-aligned ruby values are nǎ + r.
// Test actual generated data and speech context selection without claiming
// audible playback or using a real voice.
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../wp-course-data/candidate_reading_data.json'),'utf8'));
ctx.window.__AMC8_READING_DATA=data;
for(const [label,character,expected] of [
 ['固定的格子不能修改；在右边补上对应的格子。','应','yìng'],
 ['这是同文自愿挑战；如果原文已经看过，会记录为已见。','过','guo'],
 ['这是自愿挑战，已经看过的原文会记录为已见。','过','guo'],
 ['还有一道自愿挑战，使用今天的原文。看过原文会记录为已见，不作为未见材料。','过','guo']
])assert.equal(pronounce(label)[label.indexOf(character)],expected,label);
// All reachable one- and two-flash states must keep the mathematical 为
// correct with the actual candidate dictionary, including its phrase overlaps.
for(const flashes of [[1],[2],[1,1],[1,2],[2,1],[2,2]]){
 const sum=flashes.reduce((a,b)=>a+b,0),code=flashes.length===2?'，约定：'+({2:'北门',3:'西门',4:'暂缓'}[sum]):'';
 const label=flashes.map(x=>x===1?'短闪':'长闪').join(' → ')+'；和为 '+sum+code;
 assert.equal(pronounce(label)[label.indexOf('为')],'wéi',label);
}
for(const label of ['6:06 调整天线','6:04 第一段声音 → 6:06 调整天线','6:06 调整天线 → 6:12 第二段声音','6:12 第二段声音 → 6:06 调整天线 → 6:04 第一段声音']){
 assert.equal(pronounce(label)[label.indexOf('调')],'tiáo',label);
}
const texts=['如果甲单的日期改成明天，它还能直接说明今天蓝箱去哪儿了吗？','规则中有没有指定它必须放在哪儿？','第二行第二列的镜像应该在哪儿？'];
const mediaContext={window:{__AMC8_READING_DATA:data},Date,Math,Array,String,Object};vm.createContext(mediaContext);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../wp-integration/v11-source/reading_media.js'),'utf8'),mediaContext);
for(const text of texts){const i=text.indexOf('哪儿');assert.deepEqual(pronounce(text).slice(i,i+2),['nǎ','r']);
 for(const at of [i,i+1]){let aid=null;const speech=mediaContext.window.ReadingSpeech.create({onAid:(_kind,event)=>{aid=event}});speech.speak(text[at],{kind:'character',contextText:text,charIndex:at});assert(aid?.spokenText.includes('哪儿'),'character speech must request context');}}
console.log(JSON.stringify({result:'PASS_TARGETED',selectedOrderOptionKeepsExactPinyin:true,dynamicBoardContextsCorrected:true,erhuaCharacterContextRequested:true,exactAndGenericFallbackUnchanged:true,actualAudio:'NOT_RUN'}));

const hintStart=source.indexOf('function feedbackHint(q,last,m){'),hintEnd=source.indexOf('\n function hasFeedbackHint',hintStart);
assert(hintStart>=0&&hintEnd>hintStart);
const hintContext={rt:s=>s,wpSupports:()=>false,reviewedFeedback:()=>'',Array,Boolean};
const rendered=[];hintContext.rt=s=>{rendered.push([s,pronounce(s)]);return s;};
vm.createContext(hintContext);vm.runInContext(source.slice(hintStart,hintEnd),hintContext);
const quoted='调整天线后，音箱里的声音变清楚了。';
assert(hintContext.feedbackHint({type:'choice',options:[quoted]},{selected:0},{}).startsWith('再核对你选的“'+quoted+'”。'));
assert.equal(rendered.find(([s])=>s===quoted)?.[1][0],'tiáo');
assert(source.includes("'<p>'+feedbackHint(q,last,m)+'</p>'"));

// Compact transport may omit a standalone exact row that the UI can resolve.
const timelineOption='6:06 调整天线';
const exactTimelineOption=data.pinyinTexts[timelineOption];
delete data.pinyinTexts[timelineOption];
assert.equal(pronounce(timelineOption)[5],'tiáo');
assert.deepEqual(pronounce('1 · '+timelineOption),['','','','',...pronounce(timelineOption)]);
data.pinyinTexts[timelineOption]=exactTimelineOption;

'use strict';
const fs=require('fs'),vm=require('vm'),zlib=require('zlib'),crypto=require('crypto');
const [input,code,output,proof]=process.argv.slice(2),data=JSON.parse(fs.readFileSync(input,'utf8')),original=data.pinyinTexts;
const context={window:{__AMC8_READING_DATA:data,__AMC8_READING_HOST:{store:'test'}},console};vm.createContext(context);vm.runInContext(fs.readFileSync(code,'utf8'),context);
data.pinyinTexts={};const exceptions={};
for(const [text,pins] of Object.entries(original)){const computed=Array.from(context.window.__AMC8_ReadingRuntime.pronounce(text));if(JSON.stringify(computed)!==JSON.stringify(pins))exceptions[text]=pins;}
data.pinyinTexts=exceptions;
for(const [text,pins] of Object.entries(original))if(JSON.stringify(Array.from(context.window.__AMC8_ReadingRuntime.pronounce(text)))!==JSON.stringify(pins))throw Error('Pinyin mismatch: '+text);
const full=JSON.stringify(data);fs.writeFileSync(output,full);const result={checked:Object.keys(original).length,exceptions:Object.keys(exceptions).length,pinyinExact:true,outputBytes:Buffer.byteLength(full),gzipBytes:zlib.gzipSync(full).length,originalPinyinHash:data.pinyinHash,originalContentHash:data.contentHash};if(proof)fs.writeFileSync(proof,JSON.stringify(result,null,2));console.log(JSON.stringify(result));

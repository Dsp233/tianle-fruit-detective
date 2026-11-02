'use strict';
// Source-level inventory only: call sites do not enumerate every runtime value.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),Module=require('node:module');
function nodeBuiltin(name){const source=process.binding('natives')[name];if(!source)throw Error('Node bundled Acorn unavailable');const m=new Module.Module(name);m._compile(source,name);return m.exports;}
const acorn=nodeBuiltin('internal/deps/acorn/acorn/dist/acorn');
const walk=nodeBuiltin('internal/deps/acorn/acorn-walk/dist/walk');
const file=path.join(__dirname,'reading_ui.js'),source=fs.readFileSync(file,'utf8');
const hash=crypto.createHash('sha256').update(source).digest('hex');
const expected='38835736005c9c3ee0b99ace89488bd93560d8a0aeefb7ff8ae424fd3fed206e';
if(hash!==expected)throw Error('Dynamic UI inventory does not match the reviewed generated UI');
const tree=acorn.parse(source,{ecmaVersion:'latest',locations:true}),sites=[];
walk.simple(tree,{CallExpression(node){
 const name=node.callee.type==='Identifier'?node.callee.name:'';
 const index=name==='rt'?0:['button','outerButton'].includes(name)?1:-1;
 if(index<0||!node.arguments[index])return;
 const arg=node.arguments[index];
 if(arg.type==='Literal'&&typeof arg.value==='string')return;
 sites.push({line:node.loc.start.line,column:node.loc.start.column,call:name,expression:source.slice(arg.start,arg.end),status:'PARTIAL_OR_UNREVIEWED'});
}});
console.log(JSON.stringify({status:'SOURCE_SITES_NOT_RUNTIME_COVERAGE',readingUiSha256:hash,count:sites.length,sites},null,2));

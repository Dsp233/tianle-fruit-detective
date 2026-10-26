'use strict';
// User-requested navigation copy changes one expectation, not any learning rule.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),Module=require('module');
const root=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]),file=path.join(root,'source/reading_upgrade_test.js');
const original=fs.readFileSync(file,'utf8'),before='进入数学探索和主题选择',after='进入数学侦探和主题选择';
assert.equal(original.split(before).length-1,1,'Only the explicitly identified navigation-copy assertion may change');
const code=original.replace(before,after),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
process.argv=[process.execPath,file,'--out',out];const test=new Module(file,module);test.filename=file;test.paths=Module._nodeModulePaths(path.dirname(file));test._compile(code,file);
const report=JSON.parse(fs.readFileSync(out,'utf8'));report.sourceHashes['reading_upgrade_test.js']=sha(code);report.testRevision={revision:2,reason:'Homepage navigation was renamed to Math Detective by user request',changedAssertionCount:1,oldNavigationLabel:before,newNavigationLabel:after,frozenTestSourceSha256:sha(original),executedTestSourceSha256:sha(code),otherAssertionsUnchanged:true};fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');assert.equal(report.result,'PASS');assert.equal(report.passed,11);assert.equal(report.total,11);

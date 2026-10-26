'use strict';
// Math-screen fixtures must enter the math screen through the new homepage.
// Every assertion in the original frozen test remains unchanged.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const root=path.resolve(process.argv[2]),name=process.argv[3];assert(['test_connected_learning','test_knowledge'].includes(name));process.chdir(root);
const support=require(root+'/source/test_support'),raw=support.boot;let entrances=0;
support.boot=(...args)=>{const app=raw(...args);if(app.root.innerHTML.includes('data-home-hub')){assert.equal((app.root.innerHTML.match(/class="dojo-path /g)||[]).length,2);app.click('home');assert(app.root.innerHTML.includes('data-action="topicStart"'));entrances++;}return app};
require(root+'/source/'+name+'.js');
process.on('exit',code=>{const out=path.join(process.env.RUNNER_TEMP||path.dirname(root),'home-followup');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,name+'-fixture.json'),JSON.stringify({test:name,result:code===0&&!process.exitCode?'PASS':'FAIL',originalTestSourceSha256:crypto.createHash('sha256').update(fs.readFileSync(root+'/source/'+name+'.js')).digest('hex'),fixtureRevision:2,explicitMathEntrances:entrances,originalAssertionsUnchanged:true},null,2)+'\n')});

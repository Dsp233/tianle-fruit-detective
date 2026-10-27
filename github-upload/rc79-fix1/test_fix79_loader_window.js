'use strict';
// Check bounded script preparation, execution order, and retry after a failure.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'load2-tools/loader.js'),'utf8');
const begin=source.indexOf('  async function loadScripts(rows) {'),end=source.indexOf('  if (config.legacy)',begin);
assert(begin>=0&&end>begin);const fn=source.slice(begin,end)+'\nthis.loadScripts=loadScripts;';
function harness(failOnce){
 const scripts=new Map(),packets=new Map(),events=[],inflated=new Set();let peak=0,fail=failOnce;
 const readPacket=row=>{
  if(!packets.has(row.id))packets.set(row.id,new Promise((resolve,reject)=>setTimeout(()=>{
   if(fail===row.id){fail=null;reject(new Error('simulated packet failure'));return}
   inflated.add(row.id);peak=Math.max(peak,inflated.size);events.push('prepared:'+row.id);resolve('source:'+row.id);
  },1)).catch(error=>{packets.delete(row.id);throw error}));return packets.get(row.id);
 };
 const script=async(row,text)=>{assert.equal(text,'source:'+row.id);events.push('executed:'+row.id);inflated.delete(row.id);scripts.set(row.id,Promise.resolve());};
 const ctx={Map,Promise,scripts,packets,readPacket,script,yieldFrame:()=>Promise.resolve()};vm.createContext(ctx);vm.runInContext(fn,ctx);
 return {run:ctx.loadScripts,events,getPeak:()=>peak,scripts,packets};
}
(async()=>{
 const rows=Array.from({length:11},(_,i)=>({id:'script-'+i}));
 const normal=harness(null);await normal.run(rows);assert(normal.getPeak()<=3);assert.deepEqual(normal.events.filter(x=>x.startsWith('executed:')),rows.map(x=>'executed:'+x.id));assert.equal(normal.packets.size,0);
 const retry=harness('script-1');await assert.rejects(retry.run(rows),/simulated packet failure/);await new Promise(resolve=>setTimeout(resolve,5));await retry.run(rows);
 assert.deepEqual(retry.events.filter(x=>x.startsWith('executed:')),rows.map(x=>'executed:'+x.id));assert.equal(retry.packets.size,0);assert.equal(retry.scripts.size,rows.length);
 console.log('PASS bounded three-script inflating window, ordered execution, and failed-packet retry');
})().catch(e=>{console.error(e);process.exitCode=1});

/* Reproduce startup defects in LOAD1 before upgrading; no user data is touched. */
'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium}=require('playwright');
const root=path.resolve('.'),out='/tmp/loading-evidence';fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{let p=path.join(root,decodeURIComponent(new URL(req.url,'http://local').pathname));try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');res.setHeader('Content-Type',p.endsWith('.html')?'text/html; charset=utf-8':p.endsWith('.js')?'text/javascript; charset=utf-8':p.endsWith('.css')?'text/css':'application/octet-stream');fs.createReadStream(p).pipe(res);}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true});const evidence={revision:'RC79-LOAD1',scope:'synthetic reproduction of startup compatibility and deferred-entry defects',physicalIPad:'NOT_TESTED'};
 try{
  const c=await browser.newContext(),p=await c.newPage(),errors=[];
  await c.addInitScript(()=>{Element.prototype.replaceChildren=undefined;});p.on('pageerror',e=>errors.push(String(e)));
  await p.goto(base,{waitUntil:'networkidle'});
  await p.locator('[data-home-hub] [data-action="reading"]').click();await p.waitForTimeout(100);
  assert.equal(await p.locator('[data-home-hub]').count(),1);assert(errors.some(x=>x.includes('replaceChildren')));
  await p.locator('[data-home-hub] [data-action="home"]').click();await p.waitForTimeout(100);
  assert.equal(await p.locator('[data-home-hub]').count(),1);
  evidence.withoutReplaceChildren={bothChannelsFailed:true,errors};await c.close();
  const d=await browser.newContext(),q=await d.newPage();let release;const blocked=new Promise(resolve=>{release=resolve});
  await q.route('**/assets/loading-r1/*.js',async route=>{await blocked;await route.continue()});
  await q.goto(base,{waitUntil:'commit'});await q.locator('[data-home-hub] [data-action="reading"]').click();
  release();await q.waitForLoadState('networkidle');assert.equal(await q.locator('[data-home-hub]').count(),1);
  evidence.deferredEntry={firstClickLost:true};await d.close();evidence.result='DEFECTS_REPRODUCED';
 }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'baseline-result.json'),JSON.stringify(evidence,null,2));}
 console.log(JSON.stringify(evidence));
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

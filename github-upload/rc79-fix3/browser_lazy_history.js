'use strict';
// Browser-only smoke for the deferred, unchanged historical correspondence.
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix3-evidence');let server;
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),match=html.match(/<script id="learning-delivery" type="application\/json">([\s\S]*?)<\/script>/);assert(match);
const config=JSON.parse(match[1]),packet=(config.math.optionalData||[]).find(row=>row.key==='__AMC8_REUSE_REVIEWS');assert(packet&&packet.bytes>2000000);
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
async function serve(){server=http.createServer((req,res)=>{let p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res)}catch(_){res.writeHead(404).end()}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/';}
(async()=>{const base=process.env.PUBLIC_BASE||await serve(),checks=[];
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});try{const context=await browser.newContext({locale:'zh-CN'});await context.addInitScript(()=>{window.DecompressionStream=undefined;window.fetch=undefined;window.TextDecoder=undefined;window.AbortController=undefined;});
   const p=await context.newPage(),errors=[],requests=[];p.setDefaultTimeout(60000);p.on('pageerror',e=>errors.push(String(e)));p.on('request',r=>requests.push(r.url()));
   await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});await p.waitForFunction(()=>progressStore.getStatus()==='ready');
   assert.equal(await p.evaluate(()=>typeof window.__AMC8_REUSE_REVIEWS),'undefined');assert(!requests.some(url=>packet.parts.some(part=>url.endsWith('/'+part))));
   const before=await p.evaluate(()=>JSON.stringify(saved.rtm1||null));for(const part of packet.parts)await p.route('**/'+part,route=>route.abort());
   await p.locator('.topic-parent > summary').click();await action(p,'rtmOpen').click();await action(p,'rtmLoadReviews').waitFor({state:'visible'});
   assert((await p.locator('[data-reuse-loading]').innerText()).includes('原记录仍保留'));assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1||null)),before);
   for(const part of packet.parts)await p.unroute('**/'+part);await action(p,'rtmLoadReviews').click();await p.waitForFunction(()=>!!window.__AMC8_REUSE_REVIEWS);await p.locator('[data-reuse-loading]').waitFor({state:'detached'});
   const review=await p.evaluate(()=>{const rows=JointReuseReview.projection();return {count:rows.length,reviewed:rows.filter(row=>row.status==='REVIEWED').length}});
   assert.deepEqual(review,{count:95,reviewed:95});assert.equal(await p.evaluate(()=>JSON.stringify(saved.rtm1||null)),before);assert.deepEqual(errors,[]);
   checks.push({engine:name,result:'PASS',deferred:true,failedDownloadRetry:true,reviewedFamilies:95,oldApisMissing:true,recordsPreserved:true});console.log('PASS '+name+' deferred reviewed history and retry');await context.close();
  }finally{await browser.close()}
 }
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'lazy-history-browser.json'),JSON.stringify({result:'PASS',deferredBytes:packet.bytes,checks,physicalIPad:'NOT_TESTED'},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(server)server.close()});

'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [root,out,evidence]=process.argv.slice(2).map(x=>path.resolve(x));
const candidate=path.join(out,'site'),manifest=JSON.parse(fs.readFileSync(path.join(out,'manifest.json')));
assert.equal(manifest.source,'daed3c1405338ee58edb9187f335a64aa8b544a7');
const fullBytes=fs.readFileSync(path.join(out,'site-manifest.json'));
assert.equal(crypto.createHash('sha256').update(fullBytes).digest('hex'),'88e22d98b930493720139b21cb58ec6d452e6def003aacde069e3256e8ce69f1');
for(const [f,d] of Object.entries(JSON.parse(fullBytes)))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(candidate,f))).digest('hex'),d,f);
fs.mkdirSync(evidence,{recursive:true});
let dir=root;
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/, '')||'index.html';if(name.split('/').includes('..')){res.writeHead(403).end();return}const f=path.join(dir,name);if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');fs.createReadStream(f).pipe(res);});
const action=(p,n)=>p.locator('[data-action="'+n+'"]');
const overlay=p=>p.locator('#amc8-review-layer');
const descriptions=[
 '答对后只能进入下一题，缺少改变盒子开启时间条件的证据推理；需要先解释原结论依赖的条件，再自查理由。',
 '答对后缺少编号不可见的证据不足情境；应要求孩子判断封面相似为何不足以确定身份。',
 '答对后缺少最终高度与实际生长量相反的独立反例；增加初末高度比较，避免只看最终高度。'
];
async function boot(ctx,url){const p=await ctx.newPage();p.setDefaultTimeout(20000);await p.goto(url);await p.waitForFunction(()=>window.__AMC8_BOOT_READY===true);return p}
async function version(p,v){const o=overlay(p);await o.locator('#open-list').click();await o.locator('#review-version').fill(v);await o.locator('#review-list-title').fill('P 隔离工程观察（非用户原始意见）');await o.locator('#close-list').click()}
async function answer(p,c,i){await action(p,'rdPlan').first().click();await p.locator('[data-action=rdStart][data-day="'+(i+1)+'"]').click();await action(p,'rdReadDone').click();assert.equal(await p.evaluate(()=>window.__AMC8_ReadingRuntime.engine().current().question.id),c.questionId);await p.locator('.rd-options [data-action=rdPick][data-index="'+c.answer+'"]').click();await action(p,'rdSubmit').click();await action(p,'rdNext').waitFor();}
async function exportMd(p,file){const o=overlay(p);await o.locator('#open-list').click();const dl=p.waitForEvent('download');await o.locator('#download-md').click();const d=await dl;const data=await fs.promises.readFile(await d.path(),'utf8');fs.writeFileSync(path.join(evidence,file),data);await o.locator('#close-list').click();return data}
async function main(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true});
 try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true});const p=await boot(ctx,url);await version(p,'P-BASE-595ff83');
  await p.locator('[data-home-hub] [data-action=reading]').click();await action(p,'rdPlan').waitFor();
  for(const [i,c] of manifest.cases.entries()){
   await answer(p,c,i);assert.equal(await p.locator('[data-p-reason]').count(),0);
   await p.screenshot({path:path.join(evidence,'baseline-'+c.material+'.png')});
   const o=overlay(p);await o.locator('#toggle-review').click();await action(p,'rdNext').click();await o.locator('#confirm-region').click();await o.locator('#note-category').selectOption('内容');await o.locator('#note-reporter').fill('P工程观察');await o.locator('#note-text').fill(c.material+' / '+c.questionId+'：'+descriptions[i]);await o.locator('#save-annotation').click();await o.locator('#toggle-review').click();await action(p,'rdHome').first().click();
  }
  const before=await exportMd(p,'q0-before.md');for(const [i,c] of manifest.cases.entries()){assert(before.includes('#'+(i+1))&&before.includes(c.questionId)&&before.includes(descriptions[i]))}
  assert(before.includes('待处理 3 / 已处理 0'));
  const state=await ctx.storageState();for(const o of state.origins)o.localStorage=o.localStorage.filter(x=>['tianle_q0_production_review_v1','tianle_w1_device_review_v1'].includes(x.name));assert(state.origins.some(o=>o.localStorage.length===1));await ctx.close();
  dir=candidate;
  const afterCtx=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,storageState:state});const q=await boot(afterCtx,url);await version(q,'P-CANDIDATE-daed3c1');await q.locator('[data-home-hub] [data-action=reading]').click();await action(q,'rdPlan').waitFor();
  const results=[];
  for(const [i,c] of manifest.cases.entries()){
   await answer(q,c,i);const reason=q.locator('[data-p-reason]');await reason.waitFor();await reason.locator('summary').first().click();await reason.locator('[data-p-self-check] summary').click();const content=await reason.evaluate(n=>{const el=n.cloneNode(true);el.querySelectorAll('rt,.rd-pinyin').forEach(x=>x.remove());return el.textContent});assert(content.includes(c.challenge)&&content.includes(c.selfCheck));
   await reason.screenshot({path:path.join(evidence,'candidate-'+c.material+'.png')});
   const o=overlay(q);await o.locator('#open-list').click();const item=o.locator('.review-note').filter({hasText:c.questionId});assert.equal(await item.count(),1);assert.equal(await item.locator('.note-id').textContent(),'#'+(i+1));await item.getByRole('button',{name:'标为已处理',exact:true}).click();assert.equal(await item.locator('.note-status').textContent(),'已处理');await o.locator('#close-list').click();
   results.push({id:i+1,material:c.material,questionId:c.questionId,status:'processed',baseline:'post-correct no separate transfer prompt',candidate:'real prompt and self-check visible'});
   await action(q,'rdHome').first().click();
  }
  const after=await exportMd(q,'q0-after.md');assert(after.includes('待处理 0 / 已处理 3'));assert(results.every(x=>after.includes(x.questionId)));
  fs.writeFileSync(path.join(evidence,'q0-results.json'),JSON.stringify({source:manifest.source,base:manifest.base,scope:'isolated engineer findings, not recovered owner notes',results},null,2));
  console.log('Q0_CLOSEOUT_PASS '+JSON.stringify(results));await afterCtx.close();
 }finally{await browser.close()}
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());

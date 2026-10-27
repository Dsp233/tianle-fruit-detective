'use strict';
// Isolated WebKit comparison: lightweight history, plain channel switching,
// and the app's back/forward path. Synthetic profiles only.
const fs=require('fs'),path=require('path'),http=require('http'),{execFileSync}=require('child_process'),{webkit}=require('playwright');
const root=path.resolve(process.argv[2]||'.'),out=path.resolve(process.argv[3]||'/tmp/fix79-evidence');
const action=(p,name,extra='')=>p.locator('[data-action="'+name+'"]'+extra).first();
const cases=[];let server;
function memory(){
 const info={};
 for(const name of ['memory.current','memory.max'])try{info[name]=fs.readFileSync('/sys/fs/cgroup/'+name,'utf8').trim()}catch{}
 try{info.webkit=execFileSync('ps',['-eo','rss,comm'],{encoding:'utf8'}).split('\n').filter(x=>/WebKit|MiniBrowser|playwright/i.test(x)).slice(0,20)}catch{}
 return info;
}
async function serve(){
 server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://local');
  if(url.pathname==='/probe.html'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>History control</title><p>Small control page</p>');return}
  let p=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403).end();return}
  try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const ext=path.extname(p);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.css':'text/css','.png':'image/png'})[ext]||'application/octet-stream');fs.createReadStream(p).pipe(res)}catch(_){res.writeHead(404).end()}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port+'/';
}
async function math(p,base){
 await p.goto(base);await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});
 await p.waitForFunction(()=>progressStore.getStatus()==='ready');await action(p,'topicParentUnlock').click();
 await action(p,'topicSelect','[data-code="A01"]').click();await action(p,'topicSelect','[data-code="A02"]').click();
 await action(p,'topicStart').click();await p.locator('[data-rtm-task]').waitFor({state:'visible'});
 await action(p,'rtmChoice').click();
}
async function run(name,base){
 const browser=await webkit.launch({headless:true}),context=await browser.newContext({locale:'zh-CN'}),p=await context.newPage(),row={name,result:'PENDING',errors:[]};
 p.setDefaultTimeout(45000);p.on('pageerror',e=>row.errors.push(String(e)));p.on('crash',()=>{row.crashed=true});
 try{
  if(name==='small-history-control'){
   await p.goto(base+'probe.html');await p.evaluate(()=>{for(let i=1;i<=4;i++)history.pushState({i},'')});
   for(let i=0;i<3;i++)await p.goBack();for(let i=0;i<2;i++)await p.goForward();
  }else if(name==='plain-switch'){
   await math(p,base);await action(p,'reading').click();await action(p,'rdPlan').waitFor({state:'visible'});
   await action(p,'home').click();await action(p,'topicSelect').waitFor({state:'visible'});
  }else{
   await math(p,base);await action(p,'reading').click();await action(p,'rdParent').waitFor({state:'visible'});await action(p,'rdParent').click();await p.locator('#rd-diagnostic').waitFor({state:'visible'});
   await p.goBack();await action(p,'rdPlan').waitFor({state:'visible'});await p.goBack();await p.locator('[data-rtm-task]').waitFor({state:'visible'});
   await p.goBack();await action(p,'topicSelect').waitFor({state:'visible'});await p.goBack();await p.locator('[data-home-hub]').waitFor({state:'visible'});
   await p.goForward();await action(p,'topicSelect').waitFor({state:'visible'});await p.goForward();await p.locator('[data-rtm-task]').waitFor({state:'visible'});
  }
  row.before=await p.evaluate(()=>({url:location.href,history:history.state,length:history.length,ua:navigator.userAgent}));
  row.memoryBefore=memory();await p.reload({timeout:45000});row.memoryAfter=memory();
  row.after=await p.evaluate(()=>({url:location.href,history:history.state,body:document.body.innerText.slice(0,200)}));
  row.result='PASS';
 }catch(error){row.result='FAIL';row.error=String(error);row.memoryAfter=memory()}
 finally{await context.close().catch(()=>{});await browser.close().catch(()=>{})}
 cases.push(row);console.log('HISTORY PROBE '+JSON.stringify(row));
}
(async()=>{const base=await serve();for(const name of ['small-history-control','plain-switch','history-traversal'])await run(name,base);
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'history-probe.json'),JSON.stringify({cases},null,2)+'\n');
 if(cases.some(x=>x.result!=='PASS'))process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>{if(server)server.close()});

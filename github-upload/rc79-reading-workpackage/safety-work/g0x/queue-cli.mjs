#!/usr/bin/env node
// AMC8 G0-X queue CLI. Local tests and GitHub Git-API optimistic transactions.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {validate,ready,explain,claim,renew,checkpoint,finish,block,unblock,recoverExpired} from './queue-core.mjs';

const DEFAULT_PATH='github-upload/rc79-reading-workpackage/safety-work/g0x/queue.json';
const localDefault=path.join(path.dirname(fileURLToPath(import.meta.url)),'queue.json');
function parse(argv){
  const args={};let command=null;
  for(let i=0;i<argv.length;i++){
    const k=argv[i];
    if(k.startsWith('--')){const key=k.slice(2);if(key==='manual'){args.manual=true;continue}if(!argv[i+1]||argv[i+1].startsWith('--'))throw Error(`Missing value for --${key}`);args[key]=argv[++i]}
    else if(command===null) command=k;
    else throw Error(`Unexpected argument ${k}`);
  }
  return {command:command||'status',args};
}
function jsonBody(value){return JSON.stringify(value,null,2)+'\n'}
const now=()=>new Date().toISOString();
function localRead(file){return JSON.parse(fs.readFileSync(file,'utf8'))}
function writeAtomic(file,content){
  const tmp=`${file}.${process.pid}.${randomUUID()}.tmp`;
  try{fs.writeFileSync(tmp,content,{flag:'wx',mode:0o600});fs.renameSync(tmp,file)}
  finally{try{fs.unlinkSync(tmp)}catch{}}
}
function localTransaction(file,mutate,expectRevision){
  const lock=file+'.lock';let fd;
  try{
    fd=fs.openSync(lock,'wx');const old=localRead(file);validate(old);
    if(expectRevision!==undefined&&old.revision!==Number(expectRevision))throw Error(`REVISION_CONFLICT current=${old.revision} expected=${expectRevision}`);
    const next=mutate(old);validate(next);
    if(next.revision!==old.revision+1)throw Error('Exactly one state transition required');
    writeAtomic(file,jsonBody(next));return {state:next,previousRevision:old.revision,write:'LOCAL_ONLY_NOT_GITHUB_COMMITTED'};
  }finally{if(fd!==undefined){fs.closeSync(fd);fs.unlinkSync(lock)}}
}
async function api(repo,url,options={}){
  const token=process.env.GH_TOKEN||process.env.GITHUB_TOKEN;
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...options.headers};
  if(token)headers.Authorization=`Bearer ${token}`;
  const res=await fetch(`https://api.github.com/repos/${repo}${url}`,{method:options.method||'GET',headers,body:options.body?JSON.stringify(options.body):undefined});
  const body=await res.text();let data;try{data=JSON.parse(body)}catch{data={message:body}}
  if(!res.ok)throw Error(`GitHub ${res.status} ${url}: ${data.message||body.slice(0,300)}`);
  return data;
}
async function readRemote(repo,branch){
  if(!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo))throw Error('Invalid --repo owner/name');
  const b=await api(repo,`/branches/${encodeURIComponent(branch)}`);
  const head=b.commit.sha;
  const file=await api(repo,`/contents/${DEFAULT_PATH}?ref=${head}`);
  if(file.encoding!=='base64'||!file.content)throw Error('GitHub queue content is not base64');
  const state=JSON.parse(Buffer.from(file.content.replace(/\s/g,''),'base64').toString('utf8'));
  validate(state);
  if(state.branch!==branch)throw Error(`Queue designed for ${state.branch}; branch is ${branch}`);
  return {head,state};
}
async function remoteTransaction(repo,branch,mutate,expectedHead,expectedRevision,command){
  if(!(process.env.GH_TOKEN||process.env.GITHUB_TOKEN))throw Error('GH_TOKEN or GITHUB_TOKEN required to persist GitHub changes');
  const {head,state}=await readRemote(repo,branch);
  if(expectedHead&&expectedHead!==head)throw Error(`HEAD_CONFLICT current=${head} expected=${expectedHead}`);
  if(expectedRevision!==undefined&&state.revision!==Number(expectedRevision))throw Error(`REVISION_CONFLICT current=${state.revision} expected=${expectedRevision}`);
  const next=mutate(state);validate(next);
  if(next.revision!==state.revision+1)throw Error('Exactly one state transition required');
  const originalCommit=await api(repo,`/git/commits/${head}`);
  const blob=await api(repo,'/git/blobs',{method:'POST',headers:{'Content-Type':'application/json'},body:{content:jsonBody(next),encoding:'utf-8'}});
  const tree=await api(repo,'/git/trees',{method:'POST',headers:{'Content-Type':'application/json'},body:{base_tree:originalCommit.tree.sha,tree:[{path:DEFAULT_PATH,mode:'100644',type:'blob',sha:blob.sha}]}});
  const created=await api(repo,'/git/commits',{method:'POST',headers:{'Content-Type':'application/json'},body:{message:`chore(g0x): ${command} queue revision ${next.revision}`,tree:tree.sha,parents:[head]}});
  // force:false rejects non-fast-forward concurrent writes. Do not retry blindly.
  await api(repo,`/git/refs/heads/${encodeURIComponent(branch)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:{sha:created.sha,force:false}});
  return {state:next,previousHead:head,commitSha:created.sha,write:'GITHUB_COMMITTED_FAST_FORWARD'};
}
function transition(command,q,a){
  const common={id:a.task,owner:a.owner,leaseId:a['lease-id'],at:a.at||now()};
  switch(command){
    case 'claim':return claim(q,{...common,leaseId:a['lease-id']||randomUUID(),ttlMinutes:Number(a['ttl-minutes']||60),approvalRef:a['approval-ref']});
    case 'renew':return renew(q,{...common,ttlMinutes:Number(a['ttl-minutes']||60)});
    case 'checkpoint':return checkpoint(q,{...common,note:a.note});
    case 'pass':return finish(q,{...common,resultSha:a['result-sha'],evidence:a.evidence?.split(';').filter(Boolean)||[],disposition:a['disposition-file']?JSON.parse(fs.readFileSync(a['disposition-file'],'utf8')):undefined});
    case 'block':return block(q,{...common,reason:a.reason,category:a.category||'OTHER'});
    case 'unblock':return unblock(q,{id:a.task,at:common.at,note:a.note});
    case 'recover':return recoverExpired(q,{id:a.task,at:common.at,note:a.note});
    default:throw Error(`Unknown mutation ${command}`);
  }
}
const {command,args}=parse(process.argv.slice(2));
const mode=args.mode||'local';
const commands=['status','validate','next','claim','checkpoint','renew','pass','block','unblock','recover'];
if(!commands.includes(command))throw Error(`Unknown command: ${command}`);
if(!['local','github'].includes(mode))throw Error('--mode must be local or github');
if(mode==='github'&&(!args.repo||!args.branch))throw Error('--repo and --branch required for GitHub mode');
let result;
if(['status','validate','next'].includes(command)){
  const q=mode==='local'?localRead(args.file||localDefault):(await readRemote(args.repo,args.branch)).state;
  validate(q);
  result=command==='validate'?{valid:true,revision:q.revision,totalTasks:q.tasks.length}:
    command==='next'?{revision:q.revision,next:ready(q)[0]||null,ready:ready(q).map(t=>t.id),other:explain(q).filter(x=>x.status==='BLOCKED'||x.status==='ACTIVE'||x.manualGate)}:
    {revision:q.revision,updatedAt:q.updatedAt,ready:ready(q).map(t=>t.id),tasks:explain(q)};
}else{
  const mutator=q=>transition(command,q,args);
  const output=mode==='local'?localTransaction(args.file||localDefault,mutator,args['expected-revision']):
    await remoteTransaction(args.repo,args.branch,mutator,args['expected-head'],args['expected-revision'],command);
  result={action:command,...output,ready:ready(output.state).map(t=>t.id),tasks:explain(output.state).filter(t=>t.status==='ACTIVE'||t.status==='BLOCKED')};
}
console.log(jsonBody(result));

"""Materialize exact tested public trees on staging refs only. Never push main."""
import hashlib,json,os,subprocess,sys,tempfile
from pathlib import Path,PurePosixPath
repo=Path(__file__).resolve().parents[2]; root=Path(sys.argv[1]); out=Path(sys.argv[2])
BASE='595ff83b862228ee676e357d0cf0c78a8e129764'
def git(*args,env=None,input=None):
 return subprocess.check_output(['git',*args],cwd=repo,env=env,input=input).decode().strip()
def sha(b):return hashlib.sha256(b).hexdigest()
assert git('rev-parse','origin/main')==BASE
env=os.environ.copy()
env.update(GIT_AUTHOR_NAME='github-actions[bot]',GIT_AUTHOR_EMAIL='41898282+github-actions[bot]@users.noreply.github.com',GIT_COMMITTER_NAME='github-actions[bot]',GIT_COMMITTER_EMAIL='41898282+github-actions[bot]@users.noreply.github.com')
names={'m':'codex/final-release-m-20261124','w2':'codex/final-release-w2-20261124','p':'codex/final-release-p-20261124'}
extra=['tools/g1-source-lock.json','tools/final-integration/recover_inputs.py','tools/final-integration/native_proof.py','tools/final-integration/compose.py']
previous=BASE;results={}
with tempfile.TemporaryDirectory() as td:
 env['GIT_INDEX_FILE']=str(Path(td)/'index')
 for stage,branch in names.items():
  m=json.loads((root/(stage+'-manifest.json')).read_text())
  assert m['stage']==stage
  site=root/stage
  actual={p.relative_to(site).as_posix():sha(p.read_bytes()) for p in site.rglob('*') if p.is_file()}
  assert actual==m['files']
  git('read-tree',previous,env=env)
  inputs={n:site/n for n in actual}
  inputs.update({n:repo/n for n in extra})
  lines=[]
  for n,f in sorted(inputs.items()):
   assert not f.is_symlink() and f.is_file()
   p=PurePosixPath(n)
   assert not p.is_absolute() and '..' not in p.parts and not n.startswith(('.github/','code-review/G1/'))
   assert not n.startswith(('canonical/','github-upload/','source/content/'))
   blob=git('hash-object','-w','--',str(f))
   lines.append(f'100644 {blob}\t{n}\0')
  git('update-index','-z','--index-info',env=env,input=''.join(lines).encode())
  target=git('write-tree',env=env)
  commit=git('commit-tree',target,'-p',previous,'-m',f'AMC8 exact {stage.upper()} isolated release candidate',env=env)
  # Idempotent recovery: reuse an existing exact candidate, refuse every drift.
  remote=git('ls-remote','--heads','origin','refs/heads/'+branch)
  if remote:
   old=remote.split()[0]
   git('fetch','origin',old)
   assert git('rev-parse',old+'^{tree}')==target
   assert git('show','-s','--format=%P',old)==previous
   commit=old
  else:
   git('push','origin',commit+':refs/heads/'+branch)
  results[stage]={'branch':branch,'commit':commit,'tree':target,'parent':previous,'manifestSha256':sha((root/(stage+'-manifest.json')).read_bytes()),'files':len(actual)}
  previous=commit
  print('EXACT_STAGED_TREE',stage,commit,target,flush=True)
out.write_text(json.dumps(results,indent=2,sort_keys=True)+'\n')

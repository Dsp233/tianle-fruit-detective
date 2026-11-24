"""Read-only isolated rehearsal of the existing production gate's exact successor pins.
No production writes, no Ruleset changes, no real deployment authorization.
"""
import json, os, pathlib, subprocess, sys, tempfile
BASE="595ff83b862228ee676e357d0cf0c78a8e129764"
POLICY="a692559d28f7c2ac7a3b9e4cb1fe2473d0f3f444"
STAGES=[
 ("M","cd34e02035d7bc62cbde9a4a39b1a0dac7492709"),
 ("W2","2a94f29d5f0b47a7c80f503d6479ce5d4332430c"),
 ("P-F","6a8b7ea235154223bc78a9961d20d9c77b7ecf20"),
]
CONTROL={"code-review/G1/"+x for x in ("production_gate.py","auto_release.py","test_production_gate.py","test_auto_release.py")}
ENV=dict(os.environ,GIT_AUTHOR_NAME="Isolated gate rehearsal",GIT_AUTHOR_EMAIL="noreply@example.invalid",GIT_COMMITTER_NAME="Isolated gate rehearsal",GIT_COMMITTER_EMAIL="noreply@example.invalid")
def git(*args, data=None, env=ENV):
 return subprocess.check_output(["git",*args],input=data,env=env).decode().strip()
def run(script,*args,ok=True):
 p=subprocess.run([sys.executable,"-I","-B",str(script),*args],capture_output=True,text=True)
 if (p.returncode==0)!=ok: raise AssertionError((script.name,args,p.returncode,p.stdout,p.stderr))
 print(p.stdout.strip() if ok else "EXPECTED_REJECTION "+p.stderr.strip()[:300],flush=True)
 return json.loads(p.stdout) if ok else None
def merge(a,b):
 tree=git("merge-tree","--write-tree",a,b)
 assert len(tree)==40,tree
 return git("commit-tree",tree,"-p",a,"-p",b,"-m","isolated exact tree rehearsal")
def bad_commit(parent,name,dir):
 env=dict(ENV,GIT_INDEX_FILE=str(dir/"index"))
 git("read-tree",parent,env=env)
 blob=git("hash-object","-w","--stdin",data=b"Unapproved rehearsal-only drift\n")
 git("update-index","--add","--cacheinfo","100644,"+blob+","+name,env=env)
 return git("commit-tree",git("write-tree",env=env),"-p",parent,"-m","isolated refusal probe")
def main():
 assert git("rev-parse","origin/main")==BASE
 assert set(git("diff","--name-only","--no-renames",BASE,POLICY).splitlines())==CONTROL
 with tempfile.TemporaryDirectory() as td:
  d=pathlib.Path(td)
  for p in CONTROL:
   (d/pathlib.Path(p).name).write_bytes(subprocess.check_output(["git","show",POLICY+":"+p]))
  subprocess.run([sys.executable,"-B","-m","unittest","discover","-v"],cwd=d,check=True)
  gate=d/"production_gate.py"; release=d/"auto_release.py"
  # Old protected baseline MUST reject the ordinary policy PR.
  old=d/"old_gate.py";old.write_bytes(subprocess.check_output(["git","show",BASE+":code-review/G1/production_gate.py"]))
  policy_merge=merge(BASE,POLICY)
  run(old,"--target","main","--base",BASE,"--head",POLICY,"--merge",policy_merge,ok=False)
  run(release,"--mode","release","--ref",policy_merge,"--main",policy_merge)
  parent=policy_merge
  for label,head in STAGES:
   testmerge=merge(parent,head)
   g=run(gate,"--target","main","--base",parent,"--head",head,"--merge",testmerge)
   a=run(release,"--mode","release","--ref",testmerge,"--main",testmerge,"--base",parent,"--head",head)
   assert g["reference"]==head==a["reference"],(label,g,a)
   print("EXACT_SUCCESSOR_PASS",label,head,flush=True)
   bad=bad_commit(head,"data/learning-records.json",d)
   badmerge=merge(parent,bad)
   run(gate,"--target","main","--base",parent,"--head",bad,"--merge",badmerge,ok=False)
   run(release,"--mode","release","--ref",badmerge,"--main",badmerge,ok=False)
   parent=testmerge
  bad=bad_commit(parent,"code-review/G1/production_gate.py",d)
  run(gate,"--target","main","--base",parent,"--head",bad,"--merge",merge(parent,bad),ok=False)
  run(release,"--mode","rollback","--ref","05f73af21ddf35134bb7c5e598cd75845e82baf2","--main",parent)
 print("REAL_TREE_POLICY_REHEARSAL_PASS (isolated only)",flush=True)
if __name__=="__main__":main()

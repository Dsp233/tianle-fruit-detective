"""Compare historical write behavior with the CR3 guard in disposable worktrees."""
import base64, gzip, hashlib, json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = '05f73af21ddf35134bb7c5e598cd75845e82baf2'
HISTORY = 'b39ece48917d834e611565432e6cbe7f59ec2edd'
OUT = ROOT / 'code-review/CR3/evidence'
OUT.mkdir(parents=True, exist_ok=True)

def run(args, cwd, label):
    r = subprocess.run(args, cwd=cwd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    (OUT / (label + '.log')).write_text('$ ' + ' '.join(args) + '\n' + r.stdout + '\nexit=' + str(r.returncode) + '\n')
    return r

def digest(b): return hashlib.sha256(b).hexdigest()
def files(root):
    return {str(p.relative_to(root)): digest(p.read_bytes()) for p in root.rglob('*') if p.is_file() and '.git' not in p.parts }
def runtime(root):
    h=(root/'index.html').read_text()
    c=json.loads(re.search(r'<script id="learning-delivery" type="application/json">(.*?)</script>',h)[1])
    row=c['reading']['scripts'][0]
    b=gzip.decompress(b''.join(base64.b64decode(json.loads((root/p).read_text())['gz']) for p in row['parts']))
    return {'sha256':digest(b),'art':b'const storyArtByMaterial' in b,'glossary':b'dayOneVocabulary' in b}

def worktree(ref, temp, name):
    path=Path(temp)/name
    subprocess.run(['git','worktree','add','--detach',str(path),ref],cwd=ROOT,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    return path

def remove(p): subprocess.run(['git','worktree','remove','--force',str(p)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)

def main():
    report={'baseline':BASE,'historical_base':HISTORY,'candidate_head':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'cases':[]}
    with tempfile.TemporaryDirectory(prefix='cr3-') as temp:
        old=worktree(BASE,temp,'old')
        try:
            before=runtime(old); r=run([sys.executable,'reading-quality/build.py'],old,'old-builder')
            after=runtime(old); changed=subprocess.check_output(['git','diff','--name-only'],cwd=old,text=True).splitlines()
            assert r.returncode==0 and before['art'] and before['glossary'] and not after['art'] and not after['glossary'] and before['sha256']!=after['sha256']
            report['cases'].append({'case':'original','exit':r.returncode,'before':before,'after':after,'changed':changed,'result':'FAIL'})
        finally:remove(old)
        for num in (1,2):
            p=worktree(BASE,temp,'candidate'+str(num))
            try:
                shutil.copy2(ROOT/'reading-quality/build.py',p/'reading-quality/build.py')
                before=files(p); rt=runtime(p)
                r=run([sys.executable,'reading-quality/build.py'],p,'guard-'+str(num))
                assert r.returncode!=0 and 'refused before writing' in r.stdout and before==files(p) and rt==runtime(p)
                report['cases'].append({'case':'guard-'+str(num),'exit':r.returncode,'filesIdentical':True,'runtime':rt,'result':'PASS'})
                r=run([sys.executable,'reading-art/build.py'],p,'art-'+str(num)); assert r.returncode==0
                release=json.loads((p/'reading-art/release.json').read_text())
                hashes={f:digest((p/f).read_bytes()) for f in release['files']}
                assert hashes==release['files'] and all((ROOT/f).read_bytes()==(p/f).read_bytes() for f in hashes)
                report['cases'].append({'case':'supported-'+str(num),'files':len(hashes),'matchesMain':True,'result':'PASS'})
            finally:remove(p)
        h=worktree(HISTORY,temp,'historical')
        try:
            for name in ('build.py','editorial.py','reading.css','words.json','word-layout.js'):
                dest=h/'reading-quality'/name;dest.parent.mkdir(exist_ok=True)
                shutil.copy2(ROOT/'reading-quality'/name,dest)
            # Each entry is independently protected, even when the other two
            # still match the historical baseline.
            for index,entry in enumerate(('index.html','amc8/index.html','source/index.html')):
                target=h/entry
                original=target.read_bytes()
                target.write_bytes(original+b'\n<!-- CR3 uncommitted change -->\n')
                before=files(h)
                blocked=run([sys.executable,'reading-quality/build.py'],h,'modified-entry-'+str(index+1))
                assert blocked.returncode!=0 and entry in blocked.stdout and before==files(h)
                target.write_bytes(original)
                report['cases'].append({'case':'modified-'+entry,'result':'PASS','exit':blocked.returncode})
            r=run([sys.executable,'reading-quality/build.py'],h,'historical-build')
            assert r.returncode==0,r.stdout
            report['cases'].append({'case':'historical','exit':0,'runtime':runtime(h),'result':'PASS'})
        finally:remove(h)
    (OUT/'results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False))

if __name__=='__main__': main()

"""Compose the three accepted modules in order, without replacing other channels."""
import argparse, copy, difflib, importlib.util, json, re, shutil, sys, tempfile
from pathlib import Path
from zipfile import ZipFile
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
import g1_runtime as g1
import build_site
from g1_reading_packets import config,replace_config,pack,unpack,sha,ENTRIES
ART={
 "m":("61865dfcee80376c8bb88a785eebc6500d684ea1b35c9bd99f54e3b17bee20f8","b41e24d9d5178cb4a279133d92cb01db2fd73e57"),
 "w2":("88ee13a54d8aa2fd53c6bc23339dc0ff1e5f8c26ffc874cf44b87477ad8706c3","fbcda932ab97b8897810d4565650de5861c6f55b"),
 "p":("0afc13bf96dbe2aa213671a356e39d125c0c49717bcd75baeab684dfc021dff6","daed3c1405338ee58edb9187f335a64aa8b544a7"),
}
RELEASE=re.compile(r'(window\.__AMC8_RELEASE=)(\{[^\n]*?\})(;)')
PORTAL=re.compile(r'(<section class="learning-home" data-home-hub>.*?</section>)',re.S)
def once(s,old,new):
 if s.count(old)!=1: raise ValueError("missing/ambiguous anchor "+str(old[:100]))
 return s.replace(old,new,1)
def member(z,n,d):
 x=z.read(n)
 if sha(x)!=d:raise ValueError("identity mismatch "+n)
 return x
def write(root,n,body):
 p=root/n;p.parent.mkdir(parents=True,exist_ok=True)
 if p.exists() and p.read_bytes()!=body and n.startswith('assets/'):raise ValueError("asset collision "+n)
 p.write_bytes(body)
def read(root,row):return unpack(row,lambda n:(root/n).read_bytes())
def inventory(root):return {p.relative_to(root).as_posix():sha(p.read_bytes()) for p in sorted(root.rglob('*')) if p.is_file()}
def receipt(root,out,stage,prev):
 now=inventory(root)
 assert set(prev)<=set(now)
 changed=[k for k in prev if prev[k]!=now[k]]
 assert set(changed)<=set(ENTRIES),changed
 for n in set(now)-set(prev):
  assert n.startswith('assets/final-'),n
  assert Path(n).stem==now[n],n
 for n in ENTRIES:
  c=config((root/n).read_text())
  for channel in ('math','reading'):
   for kind in ('data','optionalData','scripts'):
    for row in c[channel].get(kind,[]):read(root,row)
 (out/(stage+'-manifest.json')).write_text(json.dumps({"stage":stage,"source":ART[stage][1],"files":now,"changed":changed,"added":sorted(set(now)-set(prev))},sort_keys=True,indent=2)+'\n')
 print("COMPOSE",stage,len(now),"changed",len(changed),"added",len(now)-len(prev),flush=True)
 return now
def packed(root,body,kind,key=None):
 return pack(body,'final-integration',lambda n,x:write(root,n,x),kind=kind,key=key)
def math_payload(root,raw):
 spec=importlib.util.spec_from_file_location('fix15_package',ROOT/'github-upload/rc79-fix15/package.py')
 mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
 body=[m[2] for m in mod.SCRIPT.finditer(raw)]
 release_at=next(i for i,s in enumerate(body) if s.startswith('window.__AMC8_RELEASE='))
 rd=next(i for i,s in enumerate(body) if 'window.__AMC8_READING_DATA=' in s)
 ai=next(i for i,s in enumerate(body) if s.startswith("'use strict';\nconst ReadingUI=window.ReadingUI;"))
 assert ai==rd+5 or ai==rd+4,(ai,rd)
 meta=json.loads(body[release_at].split('=',1)[1].rstrip(';'))
 assert meta['contentRevision']==154
 with tempfile.TemporaryDirectory() as td:
  tmp=Path(td);pkg=mod.Package(tmp)
  code,rows=pkg.extract_app_packets('\n'.join(body[:release_at]+body[release_at+2:rd]))
  tail="\nrender();\nif(window.location?.hash==='#reading')ReadingUI.handle('reading',{});\nif(window.location?.hash==='#reading-parent')ReadingUI.handle('rdParent',{});\nif(window.location?.hash==='#math'){homePortal=false;open('home');}"
  app=once(body[ai],tail,pkg.math_reading_bridge)
  scripts=[(tmp/n).read_bytes() for n in pkg.chunks(code)]+[app.encode()]
  data={row['key']:(tmp/row['json']).read_bytes() for row in rows}
  assert len(data)==len(rows)
  for file in (tmp/'assets/loading-r1').iterdir():
   if file.suffix in ('.png','.webp','.jpg','.gif'):
    assert (root/file.relative_to(tmp)).read_bytes()==file.read_bytes(),file.name
 # Retain G1's reviewed lazy store, namespace and dispatcher edits.
 for old,new in g1.channel_edits(ROOT,build_site.frozen_store())['math']:
  hits=0
  for i,s in enumerate(scripts):
   if isinstance(old,bytes):
    count=s.count(old);s=s.replace(old,new)
   else:s,count=old.subn(lambda _:new,s)
   hits+=count;scripts[i]=s
  if hits!=1:raise ValueError("G1 math anchor "+str(old)[:100]+" count "+str(hits))
 return meta,data,scripts
def amend_meta(html,meta):
 def apply(m):
  old=json.loads(m[2])
  assert old['storageVersion']==meta['storageVersion']
  for k in ('contentRevision','jointReuseCompatibleUiHashes'):old[k]=meta[k]
  return m[1]+json.dumps(old,ensure_ascii=False,separators=(',',':')).replace('<',r'\u003c')+m[3]
 html,n=RELEASE.subn(apply,html);assert n==1
 return html
def math_stage(root,z):
 raw=member(z,'m1/index.html','7f0d629342a091dd0d2ecff6960f3b8cea5429a7e37ee9ba76b436a9b35472cc').decode()
 meta,data,scripts=math_payload(root,raw)
 for n in ENTRIES:
  html=(root/n).read_text();c=config(html);m=c['math'];before=copy.deepcopy(c)
  allrows=m['data']+m.get('optionalData',[])
  assert set(data)=={r['key'] for r in allrows}
  for kind in ('data','optionalData'):
   m[kind]=[r if read(root,r)==data[r['key']] else packed(root,data[r['key']],'json',r['key']) for r in m.get(kind,[])]
  shared=m['scripts'][0];assert shared['id']==c['reading']['scripts'][0]['id']
  assert not c['hasAfter']
  m['scripts']=[shared]+[packed(root,s,'js') for s in scripts if s.strip()]
  assert c['reading']==before['reading'] and c['store']==before['store']
  write(root,n,replace_config(amend_meta(html,meta),c).encode())
def apply_delta(old,new,target,*,special=False):
 # Transfer accepted source-level edits, with unique exact anchors.
 a=old.splitlines(keepends=True);b=new.splitlines(keepends=True)
 for op,i,j,k,l in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
  if op=='equal':continue
  before=''.join(a[i:j]);after=''.join(b[k:l])
  if special and 'return \x60<section class="rd-text-evidence">' in before:
   anchor="\x24{button('rdNext','下一步','','rd-button rd-primary')}</div>"
   repl="\x24{pReasonCard(m,q,last,s)}"+anchor
   assert once(before,anchor,repl)==after
   target=once(target,anchor,repl)
  else:
   assert before
   target=once(target,before,after)
 return target
def w2_stage(root,z,pz):
 m=json.loads(z.read('manifest.json'))
 assert m['baseMain']=='595ff83b862228ee676e357d0cf0c78a8e129764'
 assert m['newSets']==13 and m['legacySets']==13
 data=member(z,'candidate-data.json',m['dataPacket'])
 new=member(z,'candidate-runtime.js',m['runtimePacket']).decode()
 old=old_reading(pz)
 # W2 touches the accepted G1 runtime, not the shared storage module.
 for n in ENTRIES:
  h=(root/n).read_text();c=config(h);before=copy.deepcopy(c)
  r=c['reading'];assert len(r['scripts'])==2
  assert r['data'][0]['id']=='009e644a86618ef645f1cc7bcfaaee8c7017f5b2d2d65d878f590fca6641d6ae'
  rt=apply_delta(old,new,read(root,r['scripts'][1]).decode())
  r['data']=[packed(root,data,'json','__AMC8_READING_DATA')]
  r['scripts']=[r['scripts'][0],packed(root,rt.encode(),'js')]
  assert c['math']==before['math'] and c['store']==before['store']
  write(root,n,replace_config(h,c).encode())
def old_reading(pz):
 row={'parts':['assets/reading-art/ff5728decbc3fe6c686586670f84ed4d8c36d138ad8247610473c5366072e8f4.json','assets/reading-art/03096bbbfe1f9a80843040dac929226bd23857819779c9adccd9e50438297304.json'],'bytes':374253,'id':'7c9ab43332d698ef3971bf52495fef4369f2ca87ef126d3239fb10e5f8796116'}
 return unpack(row,lambda n:pz.read('site/'+n)).decode()
def p_stage(root,z):
 m=json.loads(z.read('manifest.json'));assert m['source']==ART['p'][1]
 old=old_reading(z)
 phtml=member(z,'overlay/index.html',m['files']['index.html']).decode()
 pc=config(phtml)
 new=unpack(pc['reading']['scripts'][0],lambda n:z.read('overlay/'+n)).decode()
 edits=[
 ("由家长确认后选择孩子已经学过的主题；孩子可以在已选范围里开始练习。","选好学过的知识，就可以开始挑战。想换知识范围，请家长确认。"),
 ("最近三道未见题都独立答对了。可以自愿试更高阶段的题，也可以继续原练习。","连闯三关：三道没见过的题都独立答对了！可以自愿挑战更难的一题，也可以按原计划继续。"),
 (">试试更高阶段</button>",">挑战更难的一题</button>"),
 ('>比较条件变化</button><button class="secondary" data-action="competitionIndependentVariation">单独做变式</button>','>对照解法，比较条件变化</button><button class="secondary" data-action="competitionIndependentVariation">先独立想，再做变式</button>')]
 css=next(n for n in m['files'] if n.endswith('.css'))
 cssbody=member(z,'overlay/'+css,m['files'][css])
 cssout='assets/final-integration/'+sha(cssbody)+'.css';write(root,cssout,cssbody)
 for n in ENTRIES:
  h=(root/n).read_text();c=config(h);before=copy.deepcopy(c);r=c['reading']
  rt=apply_delta(old,new,read(root,r['scripts'][1]).decode(),special=True)
  assert 'blindNew' in rt and 'pReasonCard(m,q,last,s)' in rt
  r['scripts'][1]=packed(root,rt.encode(),'js')
  scripts=[read(root,x).decode() for x in c['math']['scripts']]
  for a,b in edits:
   assert sum(s.count(a) for s in scripts)==1,a
   scripts=[s.replace(a,b) for s in scripts]
  c['math']['scripts']=[row if s.encode()==read(root,row) else packed(root,s.encode(),'js') for row,s in zip(c['math']['scripts'],scripts)]
  pentry=member(z,'overlay/'+n,m['files'][n]).decode()
  oldportal=PORTAL.search(h);newportal=PORTAL.search(pentry);assert oldportal and newportal
  h=once(h,oldportal[0],newportal[0])
  def component(s):
   start=s.index('const LearningPortal');end=s.index('</script>',start)
   return s[start:end].rstrip()
  h=once(h,component(h),component(pentry))
  h=once(h,'</head>',f'<link rel="stylesheet" href="{c["base"]}{cssout}">\n</head>')
  assert c['reading']['data']==before['reading']['data'] and c['math']['data']==before['math']['data'] and c['store']==before['store']
  write(root,n,replace_config(h,c).encode())
 (root.parent/'p-cases.json').write_text(json.dumps(m['cases'],ensure_ascii=False))
def main():
 ap=argparse.ArgumentParser();ap.add_argument('native',type=Path);ap.add_argument('inputs',type=Path);ap.add_argument('out',type=Path);a=ap.parse_args()
 assert not a.out.exists();a.out.mkdir()
 prev=inventory(a.native)
 for k,(digest,_) in ART.items():assert sha((a.inputs/(k+'.zip')).read_bytes())==digest,k
 # Copy only generated runtime. Controlled source remains outside every release.
 for stage,fn in [('m',math_stage),('w2',w2_stage),('p',p_stage)]:
  dst=a.out/stage
  shutil.copytree(a.native if stage=='m' else a.out/('m' if stage=='w2' else 'w2'),dst)
  with ZipFile(a.inputs/(stage+'.zip')) as z,ZipFile(a.inputs/'p.zip') as pz:
   if stage=='w2':fn(dst,z,pz)
   else:fn(dst,z)
  prev=receipt(dst,a.out,stage,prev)
 print('M_W2_P_COMPOSITION_PASS',flush=True)
if __name__=='__main__':main()

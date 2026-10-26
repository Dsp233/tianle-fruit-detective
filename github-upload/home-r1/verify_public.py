import hashlib,json,os,pathlib,time,urllib.request
tmp=pathlib.Path(os.environ['RUNNER_TEMP']);c=json.loads((tmp/'candidate/release-contract.json').read_text());assert c['release']['candidateId']=='RC79-A9-READING-R1.2-HOME1'
assert json.loads(pathlib.Path('production/muse/rc79/home-h1/release-contract.json').read_text())==c
request=urllib.request.Request('https://api.github.com/repos/Dsp233/tianle-fruit-detective/pages',headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'})
with urllib.request.urlopen(request,timeout=30) as response:base=json.load(response)['html_url']
assert base=='https://dsp233.github.io/tianle-fruit-detective/'
rows=[]
for name,expected in c['files'].items():
 for attempt in range(6):
  req=urllib.request.Request(base+name+'?home_h1='+os.environ['GITHUB_RUN_ID']+'-'+str(attempt),headers={'Cache-Control':'no-cache','Accept-Encoding':'identity'})
  with urllib.request.urlopen(req,timeout=60) as response:
   h=hashlib.sha256()
   while b:=response.read(1024*1024):h.update(b)
   actual=h.hexdigest();status=response.status
  if actual==expected:break
  time.sleep(5)
 assert actual==expected,name+' does not match the accepted homepage build'
 rows.append({'path':name,'httpStatus':status,'sha256':actual,'result':'PASS'})
out=tmp/'public-verification';out.mkdir(exist_ok=True);result={'schema':1,'result':'PASS','buildId':c['buildId'],'productionReleaseCommit':os.environ['EXPECTED_MAIN'],'publicUrl':base,'entries':rows,'fullLearningAcceptance':False}
(out/'public-bytes.json').write_text(json.dumps(result,indent=2)+'\n')
with open(os.environ['GITHUB_ENV'],'a') as f:f.write('PUBLIC_BASE='+base.rstrip('/')+'\n')
print(json.dumps(result))

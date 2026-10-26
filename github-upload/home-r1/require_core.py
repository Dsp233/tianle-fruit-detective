import json,os,time,urllib.request
url='https://api.github.com/repos/Dsp233/tianle-fruit-detective/actions/runs/40294526884/jobs?per_page=100'
headers={'Authorization':'Bearer '+os.environ['GH_TOKEN'],'Accept':'application/vnd.github+json'}
for attempt in range(70):
 with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=30) as response:jobs=json.load(response)['jobs']
 core=[j for j in jobs if j['name']=='core'];assert len(core)==1 and core[0]['id']==121477818626
 job=core[0]
 print('Original core regression:',job['status'],job['conclusion'],flush=True)
 if job['status']=='completed':
  assert job['conclusion']=='success','Original CPU/reading regression failed; staging is blocked'
  break
 time.sleep(15)
else:raise RuntimeError('Core regression has not completed; staging is blocked')

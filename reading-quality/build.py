"""Reproducible W1 language/layout delta from the exact released packet bytes.
No math, storage, grading, Q0, legacy diagnostics or frozen source is rebuilt.
"""
import base64,copy,difflib,gzip,hashlib,json,re,subprocess
from pathlib import Path
from editorial import EDITS,NOTES
ROOT=Path(__file__).resolve().parents[1]; HERE=Path(__file__).resolve().parent
BASE='b39ece48917d834e611565432e6cbe7f59ec2edd'
def sha(b):return hashlib.sha256(b).hexdigest()
def raw(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
def compact(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def config(h):return json.loads(re.search(r'<script id="learning-delivery" type="application/json">(.*?)</script>',h).group(1))
def unpack(row):
 b=gzip.decompress(b''.join(base64.b64decode(json.loads(raw(p))['gz']) for p in row['parts']))
 assert sha(b)==row['id'];return b
cfg=config(raw('index.html').decode());oldbytes=unpack(cfg['reading']['data'][0]);old=json.loads(oldbytes);data=copy.deepcopy(old)
js=unpack(cfg['reading']['scripts'][0]).decode();originaljs=js
assert set(EDITS)==set(range(1,85))
ledger=[];changed=[];newtexts={}
# Only leaf strings shown to learners are edited; original source/provenance stays immutable.
def edit(value,pairs):
 if isinstance(value,str):
  result=value
  for a,b in pairs:result=result.replace(a,b)
  if value!=result:newtexts[result]=value
  return result
 if isinstance(value,list):return [edit(v,pairs) for v in value]
 if isinstance(value,dict):return {k:(v if k in ['source','sourceQuestion','id','sourcePreviewId','relatedTo','answer'] else edit(v,pairs)) for k,v in value.items()}
 return value
for day,pairs in EDITS.items():
 originals=[m for m in old['materials'] if m.get('courseId')=='R2-84D-20261031' and m.get('day')==day]
 joined=json.dumps(originals,ensure_ascii=False)
 for before,after in pairs:assert before in joined,(day,before)
 for index,m in enumerate(data['materials']):
  if m.get('courseId')=='R2-84D-20261031' and m.get('day')==day:
   revised=edit(m,pairs)
   assert ''.join(p['text'] for p in revised['panels'])==revised['text']
   if revised!=m:
    changed.append(m['id']);data['materials'][index]=revised
    # Keep the existing content-matched exploration boards enabled: identical conditions/answers.
    js=js.replace(json.dumps(m['text'],ensure_ascii=False),json.dumps(revised['text'],ensure_ascii=False))
    for q,nq in zip(m['questions'],revised['questions']):
     for field in ['prompt','options']:
      js=js.replace(json.dumps(q.get(field),ensure_ascii=False),json.dumps(nq.get(field),ensure_ascii=False))
 ledger.append({'day':day,'sourceMaterial':originals[0]['id'],'status':'EDITED' if pairs else 'RETAINED_AFTER_READING','reviewer':'Codex editorial pass, not independent human review','scope':'complete passage + 3 core questions + optional task','reason':NOTES.get(day,'将书面化或指代不清的表达改为具体动作和自然对话；数量、限制、答案不变。' if pairs else '逐篇读通：人物指代清楚，必要条件完整；术语由上下文或操作说明解释，本轮保留。'),'replacements':[{'before':a,'after':b} for a,b in pairs]})
# Preserve reviewed pronunciation on every unchanged subsequence. Read changed clauses in context.
phrases=sorted(data['phrases'].items(),key=lambda x:-len(x[0]))
def pronounce(text):
 if text in old['pinyinTexts']:return old['pinyinTexts'][text][:]
 out=[data['pinyinMap'].get(c,'') for c in text];i=0
 while i<len(text):
  for w,p in phrases:
   if text.startswith(w,i):
    vals=p if isinstance(p,list) else p.split(' ')
    if len(vals)==len(w):out[i:i+len(w)]=vals;i+=len(w)-1;break
  i+=1
 return out
for new,previous in newtexts.items():
 values=pronounce(new);prior=pronounce(previous)
 for op,i,j,k,l in difflib.SequenceMatcher(None,previous,new,autojunk=False).get_opcodes():
  if op=='equal':values[k:l]=prior[i:j]
 # Explicit contextual readings introduced by editorial changes.
 for word,pins in {'记录':'jì lù','记录册':'jì lù cè','册子':'cè zi','看起来':'kàn qǐ lái','那是不是':'nà shì bù shì','开着':'kāi zhe','关着':'guān zhe','等着':'děng zhe','那块':'nà kuài','都不对':'dōu bù duì','更清楚':'gèng qīng chu','重新':'chóng xīn','种纸片':'zhǒng zhǐ piàn','那七只':'nà qī zhī','说不定':'shuō bù dìng','包着':'bāo zhe','对得上':'duì de shàng','两种':'liǎng zhǒng','比画':'bǐ hua','来记录':'lái jì lù','最开始':'zuì kāi shǐ','听清了':'tīng qīng le','还包着':'hái bāo zhe','一回事':'yī huí shì'}.items():
  start=0
  while (pos:=new.find(word,start))>=0:values[pos:pos+len(word)]=pins.split();start=pos+len(word)
 for i,c in enumerate(new):
  if c in '一不':values[i]=data['pinyinMap'][c]
  assert not re.match(r'[\u3400-\u9fff]',c) or values[i],(c,new)
 data['pinyinTexts'][new]=values
# Build a pinned word dictionary from the actual current + retained rendered corpus.
def strings(v):
 if isinstance(v,str):yield v
 elif isinstance(v,list):
  for z in v:yield from strings(z)
 elif isinstance(v,dict):
  for k,z in v.items():
   if k not in ['pinyinTexts','pinyinMap','contextReviewedPositions']:yield from strings(z)
words=json.loads((HERE/'words.json').read_text())
layout=(HERE/'word-layout.js').read_text().replace('__READING_WORDS__',json.dumps(words,ensure_ascii=False,separators=(',',':')))
start=js.index(' function rt(value,');end=js.index(' const button=',start);js=js[:start]+layout+'\n'+js[end:]
# Full text preserves semantic paragraph boundaries and exact full-passage character offsets.
needle='${rt(m.text,{clickable:true})}</div></section><section class="rd-question">'
replacement='${m.panels.map((p,i)=>`<p class="rd-paragraph">${rt(p.text,{clickable:true,reference:m.text,offset:Array.from(m.panels.slice(0,i).map(x=>x.text).join(\'\')).length})}</p>`).join(\'\')}</div></section><section class="rd-question">'
assert js.count(needle)==1;js=js.replace(needle,replacement)
data['compatibility']={'fromContentHash':old['contentHash'],'changedMaterialIds':changed,'policy':'Preserve all events verbatim; existing engine backs up original raw state and archives affected in-progress drafts before upgrade. Never regrade old answers.'}
data['contentHash']=sha(compact({k:data[k] for k in ['materials','lessons','diagnostics','courseScope']}))
data['pinyinHash']=sha(compact(data['pinyinTexts']));data['version']='W1-READING-LANGUAGE-20261115'
assets={}
def packet(b,kind,key=None):
 z=gzip.compress(b,compresslevel=9,mtime=0);parts=[]
 for i in range(0,len(z),85000):
  body=compact({'gz':base64.b64encode(z[i:i+85000]).decode()});path='assets/reading-quality/'+sha(body)+'.json';assets[path]=body;parts.append(path)
 row={'id':sha(b),'kind':kind,'bytes':len(b),'gzipBytes':len(z),'parts':parts}
 if key:row['key']=key
 return row
newreading={'data':[packet(compact(data),'json','__AMC8_READING_DATA')],'scripts':[packet(js.encode(),'js')]}
css=(HERE/'reading.css').read_bytes();csspath='assets/reading-quality/'+sha(css)+'.css';assets[csspath]=css
for path in ['index.html','amc8/index.html','source/index.html']:
 h=raw(path).decode();c=config(h);c['reading']=newreading
 h=re.sub(r'(<script id="learning-delivery" type="application/json">).*?(</script>)',lambda m:m[1]+compact(c).decode()+m[2],h)
 h=h.replace('</head>',f'<link rel="stylesheet" href="{c["base"]}{csspath}">\n</head>')
 h=h.replace('V12.0-rc.79 A9 · 中文阅读 84 天集成候选（未发布）','W1 · 中文阅读排版与语言修订 2026-11-15')
 assets[path]=h.encode()
for path,b in assets.items():p=ROOT/path;p.parent.mkdir(exist_ok=True,parents=True);p.write_bytes(b)
(HERE/'editorial-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
identity={'scope':'W1_READING_LANGUAGE_LAYOUT','baseMain':BASE,'baseReadingData':sha(oldbytes),'baseReadingRuntime':sha(originaljs.encode()),'contentHash':data['contentHash'],'changedMaterialIds':changed,'daysReviewed':84,'daysEdited':sum(bool(x) for x in EDITS.values()),'independentHumanReview':'DEFERRED','deviceUAT':'DEFERRED','childExperience':'DEFERRED','files':{k:sha(v) for k,v in assets.items()},'retainedOldAssets':True,'storageSchemaChanged':False,'gradingChanged':False}
(ROOT/'reading-quality-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
print(json.dumps({'daysReviewed':84,'daysEdited':identity['daysEdited'],'changedMaterials':len(changed),'changedTextVariants':len(newtexts),'assets':len(assets),'newContentHash':data['contentHash']}))

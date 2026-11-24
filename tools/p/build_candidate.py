#!/usr/bin/env python3
"""P isolated source-derived overlay against the frozen G1 product.
Not the native W1 compiler; never writes the checkout or changes production locks.
"""
import argparse,copy,hashlib,json,re,subprocess,sys,zlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import config,replace_config,compact,pack,unpack,sha,ENTRIES

BASE="595ff83b862228ee676e357d0cf0c78a8e129764"
PORTAL="canonical/w1/source/home_portal.js"
CSS="canonical/w1/source/home_portal.css"
SCENARIOS={
 "R2-D001-CORE":{"need":["4 点 20 分","盒子"],"question":"如果 4 点 15 分有人打开过盒子，还能确定这段时间里没有人动过里面的东西吗？","check":"不能。没有再打开盒子是原来判断的条件。条件变了，就要找新的记录。"},
 "R2-D002-CORE":{"need":["47","74","封面"],"question":"如果照片上的编号都被遮住，只看封面，能确认哪本是要找的簿子吗？还需要什么线索？","check":"不能。两本封面相似，需要能和清单对应的编号，或其他能确认身份的记录。"},
 "R2-D003-CORE":{"need":["高度"],"question":"如果两盆植物一开始的高度不同，只比较最后的高度，能判断哪盆长得更多吗？","check":"不能。要分别用最后的高度减去原来的高度，再比较增加的高度。"}
}
def patch(s,a,b):
 if s.count(a)!=1: raise ValueError(f"Expected one anchor, got {s.count(a)}: {a[:100]}")
 return s.replace(a,b,1)
def main(root,out):
 root=root.resolve();out=out.resolve()
 assert not out.is_relative_to(root) and not root.is_relative_to(out)
 assert not out.exists()
 out.mkdir(parents=True)
 def old(name):
  return subprocess.check_output(["git","show",BASE+":"+name],cwd=root)
 def read(name):
  body=(root/name).read_bytes()
  assert body==old(name),name
  return body
 files={}
 def write(name,body):
  p=out/"overlay"/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(body);files[name]=sha(body)
 basejs=old(PORTAL).decode()
 newjs=(root/PORTAL).read_text()
 def component(js):
  return js[js.index("const LearningPortal"):].strip()
 oldcomp,newcomp=component(basejs),component(newjs)
 assert oldcomp!=newcomp
 oldcss=old(CSS).decode()
 newcss=(root/CSS).read_text()
 assert newcss.startswith(oldcss)
 # source addition, not direct mutation of committed generated outputs
 css=(newcss[len(oldcss):]+"\n.p-reason-card{margin:14px 0;padding:14px;border:1px solid #b8d5bc;border-radius:14px;background:#f5faef;color:#194734}.p-reason-card summary{cursor:pointer;min-height:44px;font-weight:700;display:flex;align-items:center}.p-reason-card p{line-height:1.65;margin:8px 0}.p-reason-card details{border-top:1px solid #c9d9c7;margin-top:10px}.p-reason-card summary:focus-visible{outline:3px solid #315e4b;outline-offset:2px}\n").encode()
 csspath=f"assets/product-experience/{sha(css)}.css";write(csspath,css)
 data_cfg=config(read("index.html").decode())["reading"]
 assert len(data_cfg["data"])==1 and len(data_cfg["scripts"])==1
 data=json.loads(unpack(data_cfg["data"][0],read))
 runtime=unpack(data_cfg["scripts"][0],read).decode()
 cases=[]
 for mid,case in SCENARIOS.items():
  m=next(x for x in data["materials"] if x["id"]==mid)
  assert all(token in m["text"] for token in case["need"]),(mid,m["text"])
  q=next((q for q in m["questions"] if isinstance(q.get("answer"),int) and q.get("type")=="choice"),None)
  assert q is not None,(mid,m["questions"])
  cases.append(dict(material=mid,questionId=q["id"],prompt=q["prompt"],answer=q["answer"],options=q["options"],passage=m["text"],challenge=case["question"],selfCheck=case["check"]))
 # After a correct attempt, present a separate optional oral reasoning extension.
 # Never in diagnostics, never before submission, never saved or scored.
 mapping={x["material"]:dict(qid=x["questionId"],question=x["challenge"],check=x["selfCheck"]) for x in cases}
 function="""function pReasonCard(m,q,last,s){const spec=P_REASON_CASES[m.id];if(!spec||q.id!==spec.qid||s.diagnostic||!last||!last.correct)return '';return '<details class="p-reason-card" data-p-reason><summary>'+rt('功夫加练：换个条件，想一想')+'</summary><p>'+rt(spec.question)+'</p><p>'+rt('先自己说出理由。这一小步不计分，也不改变原来的答题记录。')+'</p><details data-p-self-check><summary>'+rt('想好了，核对理由')+'</summary><p>'+rt(spec.check)+'</p></details></details>';}
"""
 runtime=patch(runtime,"function hasFeedbackHint(c){","const P_REASON_CASES="+compact(mapping).decode()+";\n"+function+"function hasFeedbackHint(c){")
 anchor="${button('rdNext','下一步','','rd-button rd-primary')}</div>"
 runtime=patch(runtime,anchor,"${pReasonCard(m,q,last,s)}"+anchor)
 old_optional="'还有一道自愿挑战，使用今天的原文。看过原文会记录为已见，不作为未见材料。'"
 assert runtime.count(old_optional)==2,"Both existing optional challenge surfaces must be updated consistently"
 runtime=runtime.replace(old_optional,"'想再动动脑筋？用今天的故事试一道新问题。看过的原文仍记为已见，不算新材料。'")
 old_label="'试试同文自愿挑战'"
 assert runtime.count(old_label) in (1,2),"Unexpected challenge action count"
 runtime=runtime.replace(old_label,"'继续挑战一道题'")
 row=pack(runtime.encode(),"product-experience",write,kind="js")
 for name in ENTRIES:
  html=read(name).decode();original=copy.deepcopy(config(html))
  # Generate initial hub from the same source function in Node, keeping real art URL.
  section=re.search(r'<section class="learning-home" data-home-hub>.*?</section>',html,re.S)
  assert section is not None
  src=re.search(r'<img class="dojo-art" src="([^"]+)"',section[0])[1]
  def render(comp):
   code="global.window={__AMC8_HOME_PANDA:"+json.dumps(src)+"};"+comp+";process.stdout.write(LearningPortal.page());"
   return subprocess.check_output(["node","-e",code],text=True)
  assert render(oldcomp)==section[0],name
  html=patch(html,section[0],render(newcomp))
  html=patch(html,oldcomp,newcomp)
  prefix=original["base"]
  html=patch(html,"</head>",f'<link rel="stylesheet" href="{prefix}{csspath}">\n</head>')
  cf=copy.deepcopy(original);cf["reading"]["scripts"]=[row]
  html=replace_config(html,cf)
  assert config(html)["math"]==original["math"]
  assert config(html)["reading"]["data"]==original["reading"]["data"]
  assert {k:v for k,v in config(html).items() if k!="reading"}=={k:v for k,v in original.items() if k!="reading"}
  write(name,html.encode())
 manifest={"base":BASE,"source":subprocess.check_output(["git","rev-parse","HEAD"],cwd=root,text=True).strip(),"build":"isolated source-derived delta over verified G1 product; not native compiler","toolchain":{"python":sys.version.split()[0],"node":subprocess.check_output(["node","--version"],text=True).strip(),"zlib":zlib.ZLIB_RUNTIME_VERSION},"files":files,"readingDataUnchanged":True,"mathConfigUnchanged":True,"cases":cases,"release":"ISOLATED_ONLY"}
 (out/"manifest.json").write_bytes(compact(manifest));print(json.dumps(manifest,ensure_ascii=False))
if __name__=="__main__":
 p=argparse.ArgumentParser();p.add_argument("--root",type=Path,required=True);p.add_argument("--out",type=Path,required=True);a=p.parse_args();main(a.root,a.out)

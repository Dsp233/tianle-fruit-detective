"""R1.1 C #131/#132: exact source-level delta over the accepted P-F site.
Use the existing packet compiler. Never rewrite the exam data, history, storage
namespaces, recipe IDs or unaffected channels. Stage only on a frozen checkout.
"""
import argparse, copy, hashlib, json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import ENTRIES, config, pack, replace_config, unpack, sha

BASE="72f2f229246af362f9024db217479357890c8cd3"
JUDGMENT="2a9975e7d0b229fd1414cfc427dc70e8554ea1c0aab2e098159f79d8e3205d8b"
WEIGHTED="4f87cc2c86572c7ea933d34bcbb3c4ae4f5a5b71c1a68f6b7cc2e23892820652"
# The source identities are the actual deployed packets, not historical copies.
OLD_J=""" function task(task,response,support={}){
  const result=evaluate(task?.answerContract,response,support);"""
NEW_J=r""" // Choice IDs are persistent evidence, not mathematical expressions.
 // Only a declared unordered-addend contract (or the legacy distinct-prime
 // sum wording) permits commutation. Equal numerical values alone do not.
 function choiceEquivalenceKey(text){
  const s=P.normalizeNumerals(String(text??'')).replace(/\s+/g,'');
  if(!/^(?:0|[1-9]\d{0,8})(?:\+(?:0|[1-9]\d{0,8})){1,99}$/.test(s))return null;
  return s.split('+').sort().join('+');
 }
 function choiceResponse(task,response){
  const contract=task?.answerContract,raw=String(response??'').trim();
  if(contract?.kind!=='choice'||raw===String(contract.expected))return response;
  const policy=contract.equivalence==='unordered-integer-sum'||
   (contract.equivalence==null&&/不同质因数之和(?:如何求|怎么求)[？?]?$/.test(String(task.prompt??'').trim()));
  if(!policy||!Array.isArray(task.options))return response;
  const canonical=task.options.find(o=>String(o.id)===String(contract.expected));
  const chosen=task.options.find(o=>String(o.id)===raw);
  const key=canonical?choiceEquivalenceKey(canonical.text):null;
  return key!==null&&chosen&&choiceEquivalenceKey(chosen.text)===key?contract.expected:response;
 }
 function task(task,response,support={}){
  const result=evaluate(task?.answerContract,choiceResponse(task,response),support);"""
OLD_W="const prompt=\x60两队改为只让得分较高队的成员离开，其他人的每人得分不变。至少离开多少人，才能让剩余整体均分不超过\u0024{target}？\x60;"
NEW_W="const prompt=\x60本变式中，原来红队有 \u0024{m.red} 人、蓝队有 \u0024{m.blue} 人，两队每人得分与原题相同。只让得分较高队的成员离开，其他人的每人得分不变。至少离开多少人，才能让剩余整体均分不超过\u0024{target}？\x60;"

def change(raw,old,new):
    text=raw.decode("utf-8")
    assert text.count(old)==1, "missing or ambiguous accepted source anchor"
    return text.replace(old,new,1).encode("utf-8")

def apply(site,out):
    out.mkdir(parents=True,exist_ok=True)
    overlay=out/"overlay"
    overlay.mkdir(exist_ok=False)
    files={}; packet_changes={}
    def put(path,body):
        if path.startswith("assets/") and (site/path).exists():
            assert (site/path).read_bytes()==body
        for dest in (site/path,overlay/path):
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(body)
        files[path]=sha(body)
    for name in ENTRIES:
        html=(site/name).read_text(encoding="utf-8")
        cfg=config(html); before=copy.deepcopy(cfg)
        rows=cfg["math"]["scripts"]
        assert sum(row["id"] in (JUDGMENT,WEIGHTED) for row in rows)==2
        for i,row in enumerate(rows):
            old=row["id"]
            if old not in (JUDGMENT,WEIGHTED): continue
            raw=unpack(row,lambda n:(site/n).read_bytes())
            new=change(raw,OLD_J,NEW_J) if old==JUDGMENT else change(raw,OLD_W,NEW_W)
            revised=pack(new,"final-integration",put,kind="js")
            assert unpack(revised,lambda n:(site/n).read_bytes())==new
            if old in packet_changes: assert packet_changes[old]==revised
            packet_changes[old]=revised
            rows[i]=revised
        assert cfg["store"]==before["store"] and cfg["reading"]==before["reading"]
        assert cfg["math"]["data"]==before["math"]["data"]
        assert cfg["math"].get("optionalData")==before["math"].get("optionalData")
        assert [x for x in rows if x not in packet_changes.values()]==[x for x in before["math"]["scripts"] if x["id"] not in packet_changes]
        put(name,replace_config(html,cfg).encode("utf-8"))
    receipt={"base":BASE,"scope":"C product engineering only; D independent signoff excluded","packetChanges":packet_changes,"files":files,"storageAndDataUnchanged":True}
    (out/"candidate-manifest.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
    print("C_CANDIDATE "+json.dumps(receipt,ensure_ascii=False),flush=True)
    return receipt

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--site",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    apply(a.site,a.out)

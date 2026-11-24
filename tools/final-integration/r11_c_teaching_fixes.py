"""R1.1 C #135/#136: presentation-only delta of frozen deployed packets."""
import argparse, copy, json, sys, subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import ENTRIES, config, pack, replace_config, unpack, sha
BASE="3f22d8002406857a33a3e254ebafc4366f6cec51"
FEEDBACK="06f0ebc5970773563e60474d6ceaf95998173a816dfacd92969613112ff5d96b"
SCENE="9402f52462d89feb1796749c542cd2d3b523b296379802fb72382cfb9cbe1d87"
RENDER="797459e463c5258b5104028592f27768da0b26f5b134a647fb10efcdcdbf45f8"
# Do not change recipe/model classifications or numeric evaluation.
OLD_FEEDBACK="  const model=c.quality?.modelId||c.quality?.model||c.modelId,base=checks[model]||'这个数代表哪个量？请检查使用的条件、单位和所求目标。';"
NEW_FEEDBACK=OLD_FEEDBACK+"""
  // A broad model category is not the specific quantity relationship.
  // Do not infer a learner's misconception solely from a wrong numeric answer.
  if(familyId==='natural-tiles')return variation
   ?'条件已经改变。新的长和宽能被所选砖边长同时整除吗？如果两边都放大，地面与砖的面积怎样变化？再检查所需整砖块数。'
   :'所选正方形砖的边长能同时整除地面的长和宽吗？如果已找到最大合法边长，请分别检查两边能铺几块，再检查总块数（或用地面面积除以单块砖面积）。';
  if(familyId==='natural-offers')return variation
   ?'条件已经改变。两店每本实际价格分别是多少？甲店固定配送费只加一次。把候选整数本数及少一本的情况分别代入两店整单费用，检查临界条件。'
   :'同样的本数在两店分别要付多少整单费用？甲店折扣后的书款还要加一次固定配送费，乙店免配送费。请再比较两个整单总价的差。';
"""
OLD_SCENE="""case 'natural-catch':return {kind:'scene-journey',segments:[{name:'小乐',speed:m.slow},{name:'小明',speed:m.fast}],delay:m.delay,afterCatch:v,"""
NEW_SCENE="""case 'natural-catch':return {kind:'scene-journey',segments:[{name:'小乐',speed:m.slow,direction:'→'},{name:'小明',speed:v?0:m.fast,direction:v?'停':'→'}],speedUnit:'米/分钟',delay:m.delay,leadDistance:v?null:m.slow*m.delay,afterCatch:v,"""
OLD_ARROW="i?'←':'→'"
NEW_ARROW="e(s.direction??(i?'←':'→'))"
OLD_TIME="先行时间 \x24{d.delay} 分钟"
NEW_TIME="\x24{d.afterCatch?'追上后经过':'先行时间'} \x24{d.delay} 分钟"
# Keep the lead visible only in the main problem's hint; the variation's
# separation distance is its target, and must not be revealed by the diagram.
OLD_TAIL=": ''}" # unused; exact surrounding marker below
OLD_LEAD="分钟</p>\x60:''}\x60);"
NEW_LEAD="分钟</p>\x60:''}\x24{d.leadDistance!=null?\x60<p>先行距离 \x24{e(d.leadDistance)} 米</p>\x60:''}\x60);"

def change(raw, edits):
    text=raw.decode("utf-8")
    for old,new in edits:
        assert text.count(old)==1, ("missing or ambiguous frozen anchor",old)
        text=text.replace(old,new,1)
    return text.encode("utf-8")

def render_change(raw):
    text=raw.decode("utf-8")
    lines=text.splitlines(keepends=True)
    indices=[i for i,l in enumerate(lines) if "if(d.kind==='scene-journey')return wrap(" in l]
    assert len(indices)==1
    i=indices[0]
    lines[i]=change(lines[i].encode(),[(OLD_ARROW,NEW_ARROW),(OLD_TIME,NEW_TIME),(OLD_LEAD,NEW_LEAD)]).decode()
    return "".join(lines).encode()

def apply(site,out):
    assert site.resolve()!=out.resolve()
    overlay=out/"overlay";overlay.mkdir(parents=True,exist_ok=False)
    files={};packet_changes={}
    def put(path,body):
        if path.startswith("assets/") and (site/path).exists():
            assert (site/path).read_bytes()==body
        for dest in (site/path,overlay/path):
            dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(body)
        files[path]=sha(body)
    changes={FEEDBACK:lambda r:change(r,[(OLD_FEEDBACK,NEW_FEEDBACK)]),
             SCENE:lambda r:change(r,[(OLD_SCENE,NEW_SCENE)]),
             RENDER:render_change}
    for name in ENTRIES:
        html=(site/name).read_text(encoding="utf-8")
        cfg=config(html);before=copy.deepcopy(cfg);rows=cfg["math"]["scripts"]
        assert sum(row["id"] in changes for row in rows)==3
        for i,row in enumerate(rows):
            old=row["id"]
            if old not in changes:continue
            raw=unpack(row,lambda n:(site/n).read_bytes())
            revised=changes[old](raw)
            # Parse actual candidate JS, not a reimplemented demonstration.
            subprocess.run(["node","--check","-"],input=revised,check=True)
            new=pack(revised,"final-integration",put,kind="js")
            assert unpack(new,lambda n:(site/n).read_bytes())==revised
            if old in packet_changes:assert packet_changes[old]==new
            packet_changes[old]=new;rows[i]=new
        expect=copy.deepcopy(before)
        expect["math"]["scripts"]=[packet_changes.get(x["id"],x) for x in before["math"]["scripts"]]
        assert cfg==expect
        put(name,replace_config(html,cfg).encode())
    receipt={"base":BASE,"scope":"C #135/#136 only; D independent signoff excluded","packetChanges":packet_changes,"files":files,"allOtherConfigurationUnchanged":True}
    (out/"candidate-manifest.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
    print("C_CANDIDATE "+json.dumps(receipt,ensure_ascii=False),flush=True)

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--site",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args();apply(a.site,a.out)

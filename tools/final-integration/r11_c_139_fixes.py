"""C #139: bind presentation and diagnostic advice to the actual task and scope."""
import argparse, copy, json, sys, subprocess
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import ENTRIES, config, pack, replace_config, unpack, sha
BASE="f306ceafc90b16e5794e3e4a1df95101a73e2778"
FEEDBACK="51087cacdbb942cbca28671fc8484a3967745951d7fa03597432f74748ca8f36"
RENDER="51c421bdb348ed0ae2ccbc3432c4627fb2d395f9ccc2359c963350de54a6beb2"
# Existing CompetitionFeedback targeted layer: use the current configuration,
# then the current variation goal; preserve authored misconception precedence.
FEEDBACK_ANCHOR=" const targeted={\n  missingAverage:"
FEEDBACK_NEW=""" const targeted={
  overlapProbability:(c,v)=>v?'本次只在第一块正方形中等可能选点。重叠面积是分子，第一块面积是分母；请核对两边实际重叠的长度。':'这是连续面积上的等可能选点。分子是重叠面积，分母是两块合并覆盖的面积；重叠部分在并集里只能算一次。',
  ratioUnion:(c,v)=>v?'先还原两组原来的人数。原来只参加棋类的人又加入球类，棋类人数不变，球类与交集各增加一人；新比值的分子分母分别是谁？':'两组参加次数相加时，交集被算了两次。先用不同人数与交集还原总参加次数，再按比例分配；只参加球类的人应扣除哪部分？',
  parityPermutations:(c,v)=>{const first=v&&(c.recipe.configurationId==='first-odd-transfer'||c.extension.key==='first-odd-with-separated-evens');return first?'仍是偶数不相邻，首位必须是奇数。先排奇数，哪些间隙仍允许放偶数？分别核对奇数和偶数的内部顺序及合法空位。':v?'本次是不相邻的奇数。先排偶数，再选互不相同的间隙插入奇数；分别核对两类数字的内部顺序。':'先排奇数，再选互不相同的间隙插入偶数，检查两端空位是否计入；分别核对两类数字的内部顺序。'},
  stepwiseRoute:(c,v)=>v?'本次对完整合法路线等概率抽样。分母是全部合法完整路线数，分子是经过P的完整路线数；不要沿用逐步选择的权重。':'本次每一步才是按合法方向抽样。到边界后唯一方向的概率为1；请核对各条经过P的路径概率（逐步相乘），再将互斥路径的概率相加，不把完整路线当成等概率。',
  integratedWeightedPlan:(c,v)=>{const k=c.recipe.configurationId;if(k==='mean-admission')return v?'先检查新增人数上限内是否有合法整数人数能达到均分阈值；没有可行方案时按题目约定处理。有方案再核对每人材料数、整包向上取整和最少费用。':'先按人数还原总分，再比较新增的合法整数人数能否达到均分阈值。达到目标后，每人所需材料总数是否足够？只能整包购买，核对向上取整及最低费用。';if(k==='score-training')return v?'在预算内比较个人班人数与三人班组数；同一人只能参加一种，组数有限，增分须达到阈值。本次优化的是培训人数而非费用。':'先还原红队原成绩与所需增分，再比较个人班人数和三人班组数的合法组合：人数互斥、组数上限、增分阈值都满足吗？最后比较总费用。';return null},
  integratedRatioPlan:(c,v)=>c.recipe.configurationId==='perimeter-fence'?(v?'封上门洞后要覆盖完整周长。先扣除可继续使用的已有板材，角柱已备好；只对不足的整块板材比较整包与单块费用。':'先从周长扣除门洞，余料可跨边复用，核对需要的完整板材数；比较整包和单块的合法采购组合，并计入角柱费用。'):null,
  missingAverage:"""

# Bind the missing variation diagram where the current population-removal
# contract is authored, not to an ID, seed, or old weighted variation.
REMOVAL_ANCHOR="   c.extension={...c.extension,prompt,answer:String(k),key:'remove-high-to-target-v2'"
REMOVAL_NEW="""   const removalDiagram={kind:'scene-populationRemoval',red:m.red,blue:m.blue,redScore:m.redScore,blueScore:m.blueScore,highCount,score,count,total,target,caption:'移除高分成员：同一人数变化同时影响剩余人数和总分；离开人数由你确定。',statePhase:'variation-givens'};
   c.extension={...c.extension,prompt,answer:String(k),key:'remove-high-to-target-v2'"""
# The actual main/variant renderer; keep all other branches untouched.
REMOVAL_RENDER=r""" if(d.kind==='scene-populationRemoval'){
  const box=(x,y,w,h,label,fill)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" stroke="#54758b"/>`+text(x+w/2,y+h/2+5,label);
  let art=box(25,12,205,36,`红队 ${d.red} 人 · 每人 ${d.redScore} 分`,'#f4d6ce')+box(250,12,205,36,`蓝队 ${d.blue} 人 · 每人 ${d.blueScore} 分`,'#d5e8f5');
  art+=text(240,73,'只从高分队移除 ? 人（人数为整数）');
  art+=box(25,88,205,44,`原人数 ${d.count} − ? 人`,'#e6f1ec')+box(250,88,205,44,`原总分 − ${d.score} × ?`,'#e6f1ec');
  art+=`<path d="M128 135 L128 155 L240 171 M353 135 L353 155 L240 171" class="scene-line"/>`;
  art+=text(240,192,`剩余总分 ÷ 剩余人数 ≤ ${d.target} 分`)+text(240,220,'比较合法人数，找最少离开人数');
  return wrap(svg(art));
 }
"""
TILE_RENDER=r""" if(d.kind==='scene-tiledRectangle'){
  const scale=Math.min(290/d.w,146/d.h),w=d.w*scale,h=d.h*scale,x=225-w/2,y=108-h/2,t=Math.min(w,h)*0.27;
  const art=`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="scene-shape"/><rect x="${x}" y="${y}" width="${t}" height="${t}" fill="#f6d495" stroke="#967858"/>`+text(x+t/2,y+t/2+5,'?')+text(225,y+h+25,`长 ${d.w} 米`)+text(x+w+12,y+h/2+5,`宽 ${d.h} 米`,'start');
  return wrap(svg(art)+`<p class="scene-caption">地面长宽按比例绘制；角上的未知正方形砖仅作规格示意，不表示已求出的边长。</p>`);
 }
"""
ANGLE_RENDER=r""" if(d.kind==='scene-polygonAngles'){
  const total=d.ratios.reduce((a,b)=>a+b,0);let x=32;
  const art=d.ratios.map((r,i)=>{const w=416*r/total,seg=`<rect x="${x}" y="72" width="${w}" height="60" fill="${['#f2cda4','#b9dfd0','#bcd7ea','#d4c8e9'][i%4]}" stroke="#54758b"/>`+text(x+w/2,108,r+'份');x+=w;return seg}).join('');
  return wrap(svg(art+text(240,46,'四个内角的比例份数（不是四边形实形）')+text(240,168,'全部内角合计 360°；每份角度由你求')));
 }
"""
CUBE_RENDER=r""" if(d.kind==='scene-cube'){
  const A=[240,25],B=[355,79],C=[240,133],D=[125,79],E=[125,174],F=[240,228],G=[355,174];
  const all=d.faces.includes('all'),line=(p,q,attr='')=>`<path d="M${p[0]} ${p[1]} L${q[0]} ${q[1]}" class="scene-cube-grid" ${attr}/>`;
  const mix=(p,q,t)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];
  const face=(p,q,r,s,fill)=>{
   let a=`<polygon points="${[p,q,r,s].map(v=>v.join(',')).join(' ')}" fill="${fill}" stroke="#54758b"/>`;
   for(let i=1;i<d.n;i++){const t=i/d.n;a+=line(mix(p,q,t),mix(s,r,t))+line(mix(p,s,t),mix(q,r,t));}
   return a;
  };
  let art=face(D,C,F,E,all?'#e7aa90':'#e4edf2')+face(C,B,G,F,all?'#e7aa90':'#e4edf2')+face(A,B,C,D,'#f2bfa7');
  art+=text(418,120,`每棱 ${d.n} 个`)+text(418,150,all?'六面涂色':'只涂顶、底');
  return wrap(svg(art)+`<p class="scene-caption">三个可见面均按每棱 ${e(d.n)} 个分格；${all?'背面及底面也涂色':'侧面不涂色，底面涂色'}。不在图中标出所求类别的块数。</p>`);
 }
"""
def change(raw, edits):
    text=raw.decode("utf-8")
    for old,new in edits:
        assert text.count(old)==1, ("missing or ambiguous frozen anchor",old[:200])
        text=text.replace(old,new,1)
    return text.encode("utf-8")
def render_change(raw):
    text=raw.decode("utf-8")
    text=change(text.encode(),[(REMOVAL_ANCHOR,REMOVAL_NEW)]).decode()
    lines=text.splitlines(keepends=True)
    idx=[i for i,l in enumerate(lines) if "key:'remove-high-to-target-v2',answerContract:" in l]
    assert len(idx)==1 and lines[idx[0]].count("diagram:null")==2
    lines[idx[0]]=lines[idx[0]].replace("diagram:null","diagram:removalDiagram")
    text="".join(lines)
    # Replace exact renderer branches; leave the remaining code byte-identical.
    def segment(start,end,replacement):
        nonlocal text
        assert text.count(start)==1 and text.count(end)==1
        a=text.index(start);b=text.index(end,a);text=text[:a]+replacement+text[b:]
    segment(" if(d.kind==='scene-tiledRectangle')"," if(d.kind==='scene-coordinates')",REMOVAL_RENDER+TILE_RENDER)
    segment(" if(d.kind==='scene-cube'){"," if(d.kind==='scene-holeRectangle')",CUBE_RENDER)
    segment(" if(d.kind==='scene-polygonAngles')"," if(d.kind==='scene-rays')",ANGLE_RENDER)
    return text.encode("utf-8")

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
    changes={FEEDBACK:lambda r:change(r,[(FEEDBACK_ANCHOR,FEEDBACK_NEW)]),RENDER:render_change}
    for name in ENTRIES:
        html=(site/name).read_text(encoding="utf-8")
        cfg=config(html);before=copy.deepcopy(cfg);rows=cfg["math"]["scripts"]
        assert sum(row["id"] in changes for row in rows)==2
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
    receipt={"base":BASE,"scope":"C #139 only; D independent signoff excluded","packetChanges":packet_changes,"files":files,"allOtherConfigurationUnchanged":True}
    (out/"candidate-manifest.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+"\n")
    print("C_CANDIDATE "+json.dumps(receipt,ensure_ascii=False),flush=True)

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--site",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args();apply(a.site,a.out)

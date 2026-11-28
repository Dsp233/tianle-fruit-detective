"""R1.1 C #148: presentation only; unknown is not a zero history."""
import argparse,copy,json,subprocess,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from g1_reading_packets import ENTRIES,config,pack,replace_config,unpack,sha
BASE="fcef9785308363379b028129871c92700e1f93d4"
APP="6b11c525e2cc6047b73017eb36474fd2060ac33d95b08bc19db387ce6009c66d"
COMP="14ebb0bfd5e8244627817f57fe24d297aaf0f48cebbc5aee7b1f5ab225eab0a3"
RTM="d7f96ea2c1a06b4a08d3634ad9659470c99a58498d969f3aa8a04b75464860bd"
READ="9bbadbbb0eb5df87701feb636c1a49ce57b356e43ac7d64f7016bc595000c898"
LOADER="assets/g1-runtime/f945a7ca3723102c24998e33e2c2655e0be76f95761a0a67c2958dc4c4495b9f.js"
def once(s,a,b):
    assert s.count(a)==1,('anchor',a[:100],s.count(a))
    return s.replace(a,b,1)
def revise(id,raw):
    s=raw.decode()
    if id==APP:
        # A successful storage read/parse/hydration is separate from writer lock
        # acquisition and save status. A failed read stays unknown until refresh.
        s=once(s,"let migrated=false;\ntry{","let migrated=false;\nlet mathHistoryReadable=false;\ntry{")
        a="}catch{canPersist=false;storageMessage='学习记录未能读取"
        s=once(s,a," mathHistoryReadable=true;\n"+a)
        a="function mathActivityPanel(){"
        b="""function mathHistoryUnavailable(title='数学学习记录'){
 return '<div class="page-head"><div><p class="kicker">仅限当前浏览器</p><h1>'+esc(title)+'</h1></div><button class="back" data-action="home">← 地图</button></div><section class="panel" data-math-history-unavailable role="alert"><h2>学习记录暂不可用</h2><p>本机学习记录尚未能可信读取，当前无法确认完成次数、历史作答或待回看的记录。请保留浏览器数据，恢复存储访问后刷新页面重试。</p><button class="secondary" data-action="progressExport">导出记录与草稿</button></section>';
}
function mathActivityPanel(){"""
        s=once(s,a,b)
        s=once(s,"function progressPage(){","function progressPage(){\n if(!mathHistoryReadable)return mathHistoryUnavailable('本机学习进度');")
        s=once(s,"readingHost.mathSummary=readingHost.mathSummary.bind(null,()=>saved);","readingHost.mathSummary=readingHost.mathSummary.bind(null,()=>mathHistoryReadable?saved:null);")
    elif id==COMP:
        s=once(s,"function competitionRecordsPage(){","function competitionRecordsPage(){\n if(!mathHistoryReadable)return mathHistoryUnavailable('竞赛练习记录');")
    elif id==RTM:
        s=once(s,"function historyPage(){","function historyPage(){\n  if(!mathHistoryReadable)return mathHistoryUnavailable('真题及衔接历史');")
    elif id==READ:
        s=once(s,'\u0024{math.attempts}',"\u0024{math.attempts??'暂不可用'}")
        if '\u0024{math.topics}' in s:
            s=once(s,'\u0024{math.topics}',"\u0024{math.topics??'暂不可用'}")
    else: raise ValueError(id)
    return s.encode()
def apply(site,out):
    overlay=out/'overlay';overlay.mkdir(parents=True,exist_ok=False)
    files={};changes={}
    def put(path,body):
        if path.startswith('assets/') and (site/path).exists():assert (site/path).read_bytes()==body
        for dest in (site/path,overlay/path):
            dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(body)
        files[path]=sha(body)
    old=(site/LOADER).read_bytes()
    assert sha(old)==Path(LOADER).stem
    a="""      let record;
      try { record = read(); } catch (_) {}
      return {attempts:record?.attempts?.length || 0, topics:record?.topicPractice?.selectedTopicIds?.length || 0};"""
    b="""      let record;
      try { record = read(); } catch (_) { return {attempts:null, topics:null}; }
      if (!record || typeof record !== 'object' || Array.isArray(record)) return {attempts:null, topics:null};
      return {attempts:record?.attempts?.length || 0, topics:record?.topicPractice?.selectedTopicIds?.length || 0};"""
    loader=once(old.decode(),a,b).encode()
    subprocess.run(['node','--check','-'],input=loader,check=True)
    loader_path='assets/g1-runtime/'+sha(loader)+'.js'
    put(loader_path,loader)
    for name in ENTRIES:
        html=(site/name).read_text();c=config(html);before=copy.deepcopy(c)
        for channel in ('math','reading'):
            for i,row in enumerate(c[channel]['scripts']):
                id=row['id']
                if id not in (APP,COMP,RTM,READ):continue
                raw=unpack(row,lambda n:(site/n).read_bytes())
                revised=revise(id,raw)
                subprocess.run(['node','--check','-'],input=revised,check=True)
                new=pack(revised,'final-integration',put,kind='js')
                assert unpack(new,lambda n:(site/n).read_bytes())==revised
                if id in changes:assert changes[id]==new
                changes[id]=new;c[channel]['scripts'][i]=new
        assert len(changes)==4
        expected=copy.deepcopy(before)
        for channel in ('math','reading'):
            expected[channel]['scripts']=[changes.get(x['id'],x) for x in before[channel]['scripts']]
        assert c==expected
        html=once(html,LOADER,loader_path)
        put(name,replace_config(html,c).encode())
    report={'base':BASE,'scope':'history presentation only; no change to store, record schema, data packets, writer lock or recovery','packetChanges':changes,'loader':loader_path,'files':files,'dataAndStoreUnchanged':True}
    (out/'candidate-manifest.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('C148_CANDIDATE '+json.dumps(report,ensure_ascii=False),flush=True)
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--site',type=Path,required=True);p.add_argument('--out',type=Path,required=True);a=p.parse_args();apply(a.site,a.out)

"""Manual working map for preview week 5. No production integration or learner data."""
import collections,hashlib,json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
source=Path(__file__).resolve().parent/'fixtures/pilot-v11-story.json'
if not source.exists():source=root/'project/github-upload/rc79-pilot-v11/story.json'
data=json.loads(source.read_text());days=data['days'][28:35]
# Evidence indices point only to verbatim fragments of the source story.
evidence={
29:['每组恰好收到一封','A 应交给播报组','B 不是给后勤组','每封信和每个组都只对应一次','这张标签没有固定在信封上'],
30:['S 可到 A 或 B','A 可到 C','B 可到 C 或 D','C 和 D 都可到 T','A 到 C 的路关闭','B 到 D 的门要到 10:00 才开放'],
31:['必须不晚于 10:00 到达','从 S 步行到中转点 H 用 12 分钟','在 H 整理资料用 5 分钟','从 H 到 T 再用 8 分钟','三段所需时间都已计入计划，不另加等待','天乐想从 9:40 出发'],
32:['9:05，阿宁交给小禾','9:14，小禾交给天乐','9:20，天乐在交接单上签收','9:05 至 9:20 之间没有其他交接','签收时间是完成登记的时间'],
33:['A 重 3 千克','B 和 C 各重 2 千克','车每趟最多运 5 千克','A 必须在第一趟送到','第二趟的载重单独计算'],
34:['A 重 3 千克','B 和 C 各重 2 千克','每趟最多运 5 千克','A 必须第一趟到','C 必须严格早于 B 到达','同一趟到达算同时'],
35:['A 在 9:05 送达','C 在 9:15 签收','B 的签收栏没有填写','记录没有说明 B 是尚未送到，还是已经送到但漏填','A 的记录说送达，不等于写了签收']}
# category, ability, item error tag, story evidence indices, task hypothesis, review flags
manual={
'S29-1':('math','model','relation',[0,1,2,3],None,[]),
'S29-2':('math','model','relation',[0,1,2,3],None,[]),
'S29-3':('reading','inference','information',[2,4],None,[]),
'S29-X':('math','conditions','relation',[0,1,3],'B“不是后勤组”的核对单尚未确认',[]),
'S30-1':('math','model','relation',[0,1,2,3,4,5],None,[]),
'S30-2':('reading','inference','information',[0,2,4],None,[]),
'S30-3':('math','conditions','relation',[0,2,3,4,5],'10:00 时只有 B 到 D 的门按时开放',[]),
'S30-X':('math','model','relation',[0,1,2,3,4,5],'B 到 C 也临时关闭',[]),
'S31-1':('math','model','calculation',[0,1,2,3,4],None,[]),
'S31-2':('math','model','calculation',[1,2,3,4,5],'9:40 出发且三段用时不变',[]),
'S31-3':('reading','conditions','information',[1,2,3,4],None,[]),
'S31-X':('math','model','calculation',[0,1,2,3,4],'在 H 还必须等待 3 分钟',[]),
'S32-1':('reading','inference','information',[0,1,3],None,[]),
'S32-2':('reading','facts','information',[1,2,4],None,[]),
'S32-3':('reading','inference','information',[0,1,3],'小禾 9:08 把包裹交回阿宁，9:12 再取回',[]),
'S32-X':('reading','inference','information',[0,1,3],'9:08 交回、9:12 取回', ['假设中的交接双方应写明；正式版改题前保留旧题原义']),
'S33-1':('math','model','relation',[0,1,2,3,4],None,[]),
'S33-2':('math','model','calculation',[0,1,2],None,[]),
'S33-3':('math','conditions','calculation',[0,1,2,3,4],'第一趟只运 A',[]),
'S33-X':('math','model','calculation',[0,1,3,4],'每趟上限改为 4 千克',[]),
'S34-1':('math','model','relation',[0,1,2,3,4,5],None,[]),
'S34-2':('reading','conditions','information',[3,4,5],None,[]),
'S34-3':('literacy','inference','sentence',[4,5],'第二趟一起运 B 和 C',[]),
'S34-X':('literacy','inference','sentence',[5],'B 不得早于 C',[]),
'S35-1':('reading','facts','information',[0,1,2,3,4],None,[]),
'S35-2':('reading','inference','information',[2,3],None,[]),
'S35-3':('reading','inference','information',[2,3],None,[]),
'S35-X':('reading','conditions','information',[2,3],'B 的接收方后来确认 9:18 已签收',[])}
prereq={29:['简单逻辑'],30:['简单逻辑','顺序'],31:['时间','加减法'],32:['时间','顺序'],33:['加减法','至少至多'],34:['加减法','顺序','至少至多'],35:['时间','顺序']}
terms={29:['恰好','分别'],30:['关闭','开放'],31:['不晚于','最晚'],32:['交接','签收'],33:['最多','每趟'],34:['严格早于','同时'],35:['送达','签收']}
allowed_cat={'reading','math','literacy'};allowed_ability={'recognition','facts','sequence','inference','conditions','model'};allowed_error={'character','vocabulary','sentence','information','relation','calculation'}
rows=[]
for day in days:
 n=day['day'];story=''.join(day['story']);all_text=story+''.join(q['prompt'] for q in day['questions']+[day['extra']]);assert all(e in story for e in evidence[n]),n;assert all(term in all_text for term in terms[n]),n
 for q in day['questions']+[day['extra']]:
  id=q['id'];cat,ability,error,indices,hyp,flags=manual[id];assert cat in allowed_cat and ability in allowed_ability and error in allowed_error
  assert all(0<=i<len(evidence[n]) for i in indices)
  if hyp:assert hyp in q['prompt'] or any(hyp in option for option in q['options']),(id,hyp)
  rows.append({'previewId':id,'newFormalId':'R2-'+id,'day':n,'optional':id.endswith('-X'),'formalCategory':cat,'formalAbility':ability,'itemErrorTag':error,'prerequisites':prereq[n],'focusTerms':terms[n],'sourceEvidence':[evidence[n][i] for i in indices],'taskHypothesis':hyp,'interactionType':q['type'],'formalInteractionStatus':'CHOICE_SUPPORTED' if q['type']=='choice' else 'IMPLEMENTATION_REQUIRED','reviewFlags':flags,'proposedPrompt':('如果后来确认：9:08 小禾把包裹交回阿宁，9:12 又从阿宁手中取回；其余交接不变，9:10 由谁保管？' if id=='S32-X' else None),'reviewStatus':'DRAFT_NOT_INDEPENDENTLY_REVIEWED'})
assert len(rows)==28 and {x['previewId'] for x in rows}==set(manual)
# Independently enumerate the small mathematical structures, without calling
# the preview's grading code. These checks do not certify language or teaching.
import itertools
assignments=list(itertools.permutations(range(3)))
assert [x for x in assignments if x[0]==0 and x[1]!=2]==[(0,1,2)]
assert len([x for x in assignments if x[0]==0])==2
paths=[('S','A','C','T'),('S','B','C','T'),('S','B','D','T')]
def open_paths(blocked):return [p for p in paths if all((a,b) not in blocked for a,b in zip(p,p[1:]))]
assert open_paths({('A','C'),('B','D')})==[paths[1]]
assert open_paths({('A','C')})==[paths[1],paths[2]]
assert open_paths({('A','C'),('B','C'),('B','D')})==[]
assert 12+5+8==25 and 600-25==575 and 580+25==605 and 600-(25+3)==572
assert 8<=10<12 and not 11<=10<13 and not 15<=10<19
weights=(3,2,2)
def fits(v,cap):return all(sum(w for w,t in zip(weights,v) if t==trip)<=cap for trip in (1,2))
plans=[v for v in itertools.product((1,2),repeat=3) if v[0]==1 and fits(v,5)]
assert plans==[(1,1,2),(1,2,1),(1,2,2)]
assert [v for v in plans if v[2]<v[1]]==[(1,2,1)]
assert [v for v in itertools.product((1,2),repeat=3) if v[0]==1 and fits(v,4)]==[(1,2,2)]
assert (1,2,2)[1]>=(1,2,2)[2]
canonical=json.dumps(days,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
report={'schema':1,'status':'DRAFT_NOT_FORMAL_COURSE','sourcePath':'github-upload/rc79-pilot-v11/story.json','sourceDaysSha256':hashlib.sha256(canonical).hexdigest(),'dayRange':[29,35],'tasks':rows,'summary':{'tasks':len(rows),'categories':dict(collections.Counter(r['formalCategory'] for r in rows)),'interactionsRequiringImplementation':sum(r['formalInteractionStatus']=='IMPLEMENTATION_REQUIRED' for r in rows),'tasksWithExplicitReviewFlags':sum(bool(r['reviewFlags']) for r in rows),'independentFiniteChecks':'PASS_FOR_MATCHING_ROUTES_TIME_INTERVALS_AND_LOADS'},'caution':'题目标签是设计意图，不能据此判定孩子出错原因；假设与故事事实必须分开。尚需独立语言、教学与解题审核。'}
out=Path(__file__).with_name('week5-formal-mapping-draft.json');out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'result':'PASS_DRAFT_STRUCTURE_ONLY','sourceDaysSha256':report['sourceDaysSha256'],**report['summary']},ensure_ascii=False))

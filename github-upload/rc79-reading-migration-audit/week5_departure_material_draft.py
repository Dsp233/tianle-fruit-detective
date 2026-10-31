"""Map day 31's time task to a new-ID prototype; preview is unchanged."""
import hashlib
import json
from pathlib import Path

here=Path(__file__).resolve().parent
source=json.loads((here/'fixtures/pilot-v11-story.json').read_text(encoding='utf-8'))
days=source['days'][28:35]
canonical=json.dumps(days,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
assert hashlib.sha256(canonical).hexdigest()=='1c7ccd40761f5e6f3f058962d468b74868896a1585c30fa02e54035146a5af30'
day=days[2];question=day['questions'][0];assert day['day']==31 and question['id']=='S31-1' and question['answer']==575
evidence=['必须不晚于 10:00 到达','从 S 步行到中转点 H 用 12 分钟','在 H 整理资料用 5 分钟','从 H 到 T 再用 8 分钟','三段所需时间都已计入计划，不另加等待']
text=''.join(day['story']);assert all(x in text for x in evidence)
possible=[start for start in range(540,601) if start+12+5+8<=600]
assert max(possible)==575 and len(possible)==36
material={'id':'R2-D031-DEPARTURE','courseId':'R2-PROTOTYPE','day':31,'week':5,'kind':'story','title':day['title'],'text':text,
 'goal':'根据总用时倒推最晚出发时间','tags':['时间','不晚于'],'difficulty':3,'focusWords':['不晚于','最晚'],'prerequisites':['时间','加减法'],
 'panels':[{'text':part,'scene':'library','cast':['tianle','xiaohe','tuantuan'],'action':'read','prop':'book'} for part in day['story']],
 'questions':[{'id':'R2-S31-1','type':'departure','category':'math','ability':'model','errorType':'calculation','targetWords':['不晚于','最晚'],
 'prompt':question['prompt'],'options':['出发时间'],'answer':575,'departure':{'min':540,'max':600,'step':1,'initial':570},'explanation':question['reason'],'evidence':evidence}]}
result={'status':'DRAFT_NOT_FORMAL_COURSE','sourcePreviewId':'S31-1','material':material,'limits':['Slider displays only the chosen departure time, not calculated arrival','No independent teaching or language review','Illustrations are placeholders','Pinyin and actual spoken audio not reviewed','No production integration']}
(here/'week5-departure-material-draft.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'PASS_DRAFT_STRUCTURE_ONLY','sourcePreviewId':'S31-1','minutesChecked':61,'onTimeDepartures':len(possible),'latestDeparture':575},ensure_ascii=False))

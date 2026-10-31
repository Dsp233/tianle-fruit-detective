#!/usr/bin/env python3
"""Integrate the isolated 12-board prototype into the scoped reading UI.

This generator starts from the previously browser-tested departure UI.  It does
not modify production files; the output must still be integrated and tested.
"""
from pathlib import Path
import json
import hashlib

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
ui = (ROOT / 'formal-integration-audit/reading_ui.departure.prototype.js').read_text()
fragment = (HERE / 'interactions.fragment.js').read_text()
pilot = ROOT / 'wp-integration/v11-source'
manifest = json.loads((pilot.parent / 'v11-source-manifest.json').read_text())
if manifest['commit'] != '98cfd12797013845c4771719778b9b5f62214308':
    raise RuntimeError('Unexpected preview source revision')
blobs = {row['name']:row['sha'] for row in manifest['files']}
source_names = ['story.json','preview.template.html','activities.js','week3_activities.js',
                'week4_activities.js','week5_activities.js','week6_activities.js',
                'week7_activities.js','week8_activities.js']
for name in source_names:
    content = (pilot / name).read_bytes()
    blob = hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()
    if blob != blobs.get(name):
        raise RuntimeError('Preview source does not match pinned Git blob: ' + name)
source = json.loads((pilot / 'story.json').read_text())
expected = {'days':{}, 'questions':{}}
for day in source['days']:
    if not 3 <= day['day'] <= 56:
        continue
    expected['days'][day['day']] = ''.join(day['story'])
    for q in [*day['questions'], day['extra']]:
        if q['type'] in ('choice', 'order'):
            expected['questions'][q['id']] = {'day':day['day'], 'prompt':q['prompt'],
                                              'options':q['options'], 'type':q['type'], 'answer':q['answer']}
preview = (pilot / 'preview.template.html').read_text()
activity = preview[preview.index(' function activity(){'):preview.index(' __V3_ACTIVITIES__')]
upstream = '\n'.join((pilot / name).read_text() for name in [
    'activities.js', 'week3_activities.js', 'week4_activities.js',
    'week5_activities.js', 'week6_activities.js', 'week7_activities.js',
    'week8_activities.js'])
exploration = """ // Original preview exploration is gated and treated as assistance.
 // Changes to the passage, question or options disable the unreviewed board.
 const wpExplore=((outerButton)=>{
  const expected=__EXPECTED__,esc=E;
  const state={day:0,question:0,robot:0,bags:[],box:null,message:'',explorationEver:false};
  let key=null,visible=false;
  function button(action,label,attrs='',classes=''){
   const style=classes.includes('speak')?'rd-option-speak':classes.includes('choice')?'rd-option'+(classes.includes('selected')?' rd-selected':''):'rd-button';
   return outerButton('rdExploreAction',label,`data-sub-action="${E(action)}" ${attrs}`,style);
  }
  function currentRecord(){return {help:[]};}
  function say(text,kind){const c=engine.current();if(c&&!c.session.paused)speech.speak(text,{kind:kind==='option'?'option':'question',sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,elementKey:hash(text)});}
  function futureActivity(){return '';}
  __ACTIVITY__
  __UPSTREAM__
  function matches(c){
   if(!c||c.session.diagnostic||!['choice','order'].includes(c.question.type))return false;
   const q=c.question,id=q.sourcePreviewId,row=expected.questions[id];
   return !!row&&id===q.id.replace(/^R2-/,'')&&q.type===row.type&&q.prompt===row.prompt&&
    JSON.stringify(q.options)===JSON.stringify(row.options)&&JSON.stringify(q.answer)===JSON.stringify(row.answer)&&
    c.material.text===expected.days[row.day]&&c.material.day===row.day;
  }
  function prepare(c){const id=c.question.sourcePreviewId,next=c.session.id+':'+id;if(key!==next){key=next;visible=false;state.day=expected.questions[id].day-1;state.question=id.endsWith('-X')?3:Number(id.slice(-1))-1;state.robot=0;state.bags=[];state.box=null;state.message='';resetV3();}}
  return {
   available(c){if(!matches(c))return false;prepare(c);return true;},
   html(c){if(!this.available(c))return '';return visible?`<section class="rd-explore" data-exploration-board><p>${rt('辅助板是临时工作区；刷新后会清空。使用会记录为辅助。')}</p>${activity()}${outerButton('rdExplore','收起辅助板')}</section>`:`<section class="rd-explore"><p>${rt('可以打开辅助板查看或计算；使用会记录为辅助。')}</p>${outerButton('rdExplore','打开辅助板')}</section>`;},
   toggle(c){if(!this.available(c)||c.session.paused)return;if(!visible){engine.requestAid('explore',{activity:'pilot-board-'+c.question.sourcePreviewId});visible=true;}else visible=false;},
   handle(c,d){if(!this.available(c)||!visible||c.session.paused)return;const a=d.subAction,i=Number(d.index),b={dataset:d};
    if(a==='move'){const next=state.robot+Number(d.amount),limit=state.question===3?8:7;if(next<=limit)state.robot=next;else state.message='这一步会走出轨道，先换一种走法。';}
    else if(a==='resetRobot')state.robot=0;
    else if(a==='bag')state.bags=state.bags.includes(i)?state.bags.filter(x=>x!==i):[...state.bags,i];
    else if(a==='box')state.box=i;
    else if(!v3Handle(a,b,i)&&!week3Handle(a,b,i)&&!week4Handle(a,b,i)&&!week5Handle(a,b,i)&&!week6Handle(a,b,i)&&!week7Handle(a,b,i))week8Handle(a,b,i);
    if(state.message){ui.message=state.message;state.message='';}
   }
  };
 })(button);
""".replace('__EXPECTED__', json.dumps(expected,ensure_ascii=False,separators=(',',':'))).replace('__ACTIVITY__', activity).replace('__UPSTREAM__',upstream)
(HERE / 'exploration.fragment.js').write_text(exploration)

def once(old, new):
    global ui
    if ui.count(old) != 1:
        raise RuntimeError(f'Expected exactly one UI anchor: {old[:80]!r} ({ui.count(old)})')
    ui = ui.replace(old, new, 1)

once(' function quiz(c){', fragment + '\n' + exploration + '\n function quiz(c){')
once("valid=q.type==='departure'?", "valid=wpSupports(q)?wpComplete(q,pick):q.type==='departure'?")
once("${q.type==='departure'?departureBoard(c,pick,last):", "${wpSupports(q)?wpBoard(q,pick??last?.selected):q.type==='departure'?departureBoard(c,pick,last):")
once("${button('rdSpeakQuestion','听问题')}${wpSupports(q)?", "${button('rdSpeakQuestion','听问题')}${wpExplore.html(c)}${wpSupports(q)?")
once("const selected=q.type==='cargo'?'':Array.isArray(last.selected)?", "const selected=wpSupports(q)||['cargo','match','route','departure'].includes(q.type)?'':Array.isArray(last.selected)?")
once("item.type==='cargo'?rt('符合题目中各项条件的安排'):Array.isArray(item.answer)?", "item.type==='cargo'?rt('符合题目中各项条件的安排'):wpSupports(item)?rt('请根据上面的讲解核对自己的方案。'):Array.isArray(item.answer)?")
once("knowledgeConfirmed:false,importText:''", "knowledgeConfirmed:false,importText:'',finishedDay:null")
once("e.data.materials.filter(m=>!e.data.courseScope||m.courseId===e.data.courseScope.activeCourseId).flatMap(m=>m.prerequisites||[])", "e.data.materials.filter(m=>(!e.data.courseScope||m.courseId===e.data.courseScope.activeCourseId)&&m.prerequisitesStatus!=='unreviewed').flatMap(m=>m.prerequisites||[])")
once("${x.ready?'达到本地准入条件':'继续观察与补强'}", "${x.evaluable===false?'未评级':x.ready?'达到本地准入条件':'继续观察与补强'}")
once('<h3>家长选择已掌握的数学知识</h3><div class="rd-nav">', '<h3>家长选择已掌握的数学知识</h3>${e.data.materials.some(m=>(!e.data.courseScope||m.courseId===e.data.courseScope.activeCourseId)&&m.prerequisitesStatus===\'unreviewed\')?\'<p>当前课程部分先修知识尚未审校，不会作为已确认先修或周准入证据。</p>\':\'\'}<div class="rd-nav">')
once("${E(r.supportEvidence?.interpretation||'题目标签不等于实际错因。')}</p><div class=\"rd-table-wrap\">", "${E(r.supportEvidence?.interpretation||'题目标签不等于实际错因。')}</p>${r.supportEvidence?.unreviewedFirst?`<p>尚未分类的首答：${percent(r.supportEvidence.unreviewedFirst)}。作答继续保留，不进入分类、错因、周准入或诊断统计。</p>`:''}<div class=\"rd-table-wrap\">")
once(".map(l=>button('rdStart',String(l.day),`data-day=\"${l.day}\" aria-label=\"第${l.day}天课程\" ${l.day<range.start||l.day>range.end?'disabled':''}`)).join('')", ".map(l=>`<div class=\"rd-day-entry\">${button('rdStart',String(l.day),`data-day=\"${l.day}\" aria-label=\"第${l.day}天课程\" ${l.day<range.start||l.day>range.end?'disabled':''}`)}${e.data.courseScope&&l.optionalIds?.length?button('rdDailyOptional','自愿挑战',`data-day=\"${l.day}\" aria-label=\"第${l.day}天自愿挑战\" ${l.day<range.start||l.day>range.end?'disabled':''}`,'rd-button rd-optional-day'):''}</div>`).join('')")
once("const reviewNotice=review?`<aside class=\"rd-condition\" data-reading-review><p>${rt('这是复习')} · ${rt('原材料来自第')}", "const reviewNotice=review?`<aside class=\"rd-condition\" data-reading-review><p>${rt(s.purpose==='optional-challenge'?'这是同文自愿挑战；如果原文已经看过，会记录为已见。':'这是复习')} · ${rt('原材料来自第')}")

start = ui.index(' function finish(){')
end = ui.index(' function parent(){', start)
ui = ui[:start] + """ function finish(){
  if(engine.data.courseScope){const offer=Number.isInteger(ui.finishedDay)&&engine.dailyOptional?.(ui.finishedDay);return `${header('这次阅读练习结束啦')}<section class="rd-finish"><h2 class="rd-finish-save-status">${rt(engine.status().status==='ready'?'这次练习已经保存。':'这次练习还没有保存，请家长导出草稿。')}</h2>${offer?.materialId?`<aside class="rd-condition" data-daily-optional><p>${rt('还有一道自愿挑战，使用今天的原文。看过原文会记录为已见，不作为未见材料。')}</p>${button('rdDailyOptional','试试同文自愿挑战',`data-day="${offer.day}"`)}</aside>`:''}<p>${rt('也可以从十二周地图选择其他天的挑战。')}</p>${button('rdPlan','十二周地图')}${button('rdHome','回到阅读首页')}${button('rdParent','请家长看看记录')}</section>`;}
  const offer=engine.challenge();const challenge=!offer.eligible?'':offer.materialId?
  '<aside class="rd-condition" data-reading-challenge><p>'+rt('最近三道未见题首答正确。可以继续使用拼音和朗读，自愿试一段新文字。')+'</p><p>'+rt('新段落：')+E(offer.title)+' · '+E(offer.goal||'阅读理解')+'</p><p>'+rt('这只是练习建议；辅助记录不变，也不算完成整天课程。')+'</p>'+button('rdChallenge','试试新的阅读挑战')+'</aside>':
  '<p class="rd-condition" data-reading-challenge>'+rt('最近三道未见题首答正确；当前范围暂时没有合适的新材料，可以继续原计划。')+'</p>';
  return `${header('这次阅读练习结束啦')}<section class="rd-finish"><h2 class="rd-finish-save-status">${rt(engine.status().status==='ready'?'这次练习已经保存。':'这次练习还没有保存，请家长导出草稿。')}</h2><p>${rt('换一段没见过的文字，看看能不能自己读懂。')}</p>${challenge}${button('rdTransfer','试一段没见过的数学题','','rd-button rd-primary')}${button('rdHome','回到阅读首页')}${button('rdParent','请家长看看记录')}</section>`;
 }
""" + ui[end:]
once("if(result==='complete')ui.screen='finish';", "if(result==='complete'){ui.finishedDay=old?.session.purpose==='optional-challenge'?null:old?.session.day;ui.screen='finish';}")
once("  if(action==='rdChallenge'){", """  if(action==='rdDailyOptional'){speech.stop();const day=Number(d.day),c=Number.isInteger(day)?e.startDailyOptional?.(day):null;if(c){syncCoursePhase();ui.screen='course';ui.message='这是自愿挑战，已经看过的原文会记录为已见。';}else ui.message='这一天暂时没有可用的自愿挑战，原记录仍保留。';view='reading';render();return true;}
  if(action==='rdChallenge'){""")
anchor="  if(action==='rdDepartureStep'){"
insert="""  if(action==='rdWpSpeakItem'){const c=e.current(),i=Number(d.index),text=c?.question.type==='classification'&&c.question.items?.[i];if(ui.phase==='quiz'&&c&&!c.session.paused&&text)speech.speak(text,{kind:'option',sessionId:c.session.id,materialId:c.material.id,questionId:c.question.id,elementKey:hash(text)});return true;}
  if(action==='rdExplore'){const c=e.current();if(ui.phase==='quiz'&&c)wpExplore.toggle(c);render();return true;}
  if(action==='rdExploreAction'){const c=e.current();if(ui.phase==='quiz'&&c)wpExplore.handle(c,d);render();return true;}
  if(String(action).startsWith('rdWp')){const c=e.current();if(ui.phase==='quiz'&&c&&!c.session.paused&&wpSupports(c.question)){const last=c.attempts.filter(a=>a.sessionId===c.session.id).at(-1),old=c.session.drafts[c.question.id]??last?.selected,next=wpNext(c.question,old,action,d);if(next!==undefined)e.select(next);}render();return true;}
"""
once(anchor, insert + anchor)
(HERE / 'reading_ui.js').write_text(ui)
print('Wrote isolated reading_ui.js; 12 prototype board types integrated')

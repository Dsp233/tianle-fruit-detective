'use strict';
// Finite authored models. A changed label alone never creates a new instance.
// Rows: transfer, independent 1/2, reserves 1/2, 24h/7d/21d, demonstration.
const FOUNDATION_MODELS={
 'A01.01':[[6,'散放'],[5,'一排'],[3,'三角'],[7,'散放'],[8,'两排'],[2,'竖排'],[9,'三排'],[10,'两排'],[6,'两排']],
 'A01.02':[[2,12],[1,14],[3,11],[1,16],[2,15],[0,17],[3,18],[2,19],[0,12]],
 'A01.03':[[5,2,'钱币'],[4,8,'十棒'],[6,1,'整包'],[7,3,'钱币'],[2,9,'整包'],[8,2,'十棒'],[3,7,'钱币'],[9,0,'整包'],[2,6,'十棒']],
 'A01.04':[[52,49],[47,49],[67,76],[35,53],[82,79],[58,51],[64,46],[93,98],[24,27]],
 'A01.05':[[3,1,2],[4,2,3],[2,5,1],[3,4,1],[5,6,3],[4,8,2],[6,1,4],[5,3,2],[3,6,2]],
 'A02.01':[[6,2,'add'],[9,4,'remove'],[11,4,'remove'],[5,3,'add'],[12,5,'remove'],[8,3,'remove'],[7,5,'add'],[13,6,'remove'],[8,2,'add']],
 'A02.02':[[8],[7],[0],[9],[5],[4],[3],[2],[1]],
 'A02.03':[[5,4],[6,3],[8,2],[4,5],[9,3],[5,6],[8,4],[7,5],[3,4]],
 'A02.04':[[4,3],[5,2],[2,6],[3,5],[4,4],[2,7],[5,3],[3,6],[2,4]],
 'A02.05':[[12,4,'groups'],[15,5,'each'],[16,4,'each'],[18,3,'groups'],[20,5,'groups'],[8,2,'each'],[21,3,'groups'],[24,6,'each'],[10,2,'groups']],
 'A02.06':[[6,-2,2],[4,1,3],[5,1,2],[2,4,3],[7,-3,3],[3,3,4],[8,-2,2],[5,2,3],[4,-1,2]]
};
const foundationWork=typeof module!=='undefined'?require('./workshop').WORKSHOP_TASKS:WORKSHOP_TASKS;
const foundationStages=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
const FOUNDATION_DEMOS={};
function foundationInstance(sid,row,id,phase,dimension){
 const t={id,skillId:sid,contentVersion:68,phase,changeDimension:dimension,authorship:'原创儿童操作适配',semanticParameters:row};
 const [a,b,c]=row;
 if(sid==='A01.01')Object.assign(t,{mode:'counterBuild',target:a,layout:b,prompt:`图卡的星星按${b}摆放。摆出同样多的圆点，逐个对应。`,explain:`不论摆成什么形状，每颗星都与一个圆点配对，共${a}对。`});
 if(sid==='A01.02')Object.assign(t,{mode:'forwardExchange',initialTens:a,initialOnes:b,prompt:`已有${a}根十棒和${b}个散点。任选10个散点放进框，换成一根十棒，再判断总数是否改变。`,explain:`被选中的10个原散点组成新十棒，余下${b-10}个没有消失，总数仍是${10*a+b}。`});
 if(sid==='A01.03')Object.assign(t,{mode:'placeCompose',tens:a,ones:b,representation:c,prompt:c==='钱币'?`有${a}张十元和${b}枚一元。用十棒和散点摆出相同金额。`:c==='整包'?`${a}包积木，每包10块，外面还有${b}块。用十棒和散点表示。`:`用十棒和散点摆出${10*a+b}。`,explain:`${a}个十与${b}个一合成${10*a+b}，两种单位要分别核对。`});
 if(sid==='A01.04')Object.assign(t,{mode:'compareBuild',initial:[a,b],target:[a,b],prompt:`左盘表示${a}，右盘表示${b}。选较大的盘；也可以调整、放回圆点核对。`,explain:`先比较十位，再比较个位，${Math.max(a,b)}较大。`});
 if(sid==='A01.05')Object.assign(t,{mode:'reverseExchange',initialTens:a,initialOnes:b,targetTens:c,targetOnes:10*(a-c)+b,prompt:`从${a}十${b}一出发，拆成${c}根十棒和散点。再判断总数有没有改变。`,explain:`拆出的每根棒都带回原来的10个一，${c}十${10*(a-c)+b}一仍是${10*a+b}。`});
 if(sid==='A02.01')Object.assign(t,{mode:c==='add'?'counterChange':'counterRemove',initial:a,remove:b,add:b,prompt:c==='add'?`盘里有${a}颗，旁边又有${b}颗。逐颗搬进盘里。`:`盘里有${a}颗，逐颗拿走${b}颗，放在旁边。`,explain:c==='add'?`${b}个原对象搬进盘里，合并为${a+b}颗。`:`${b}颗搬到旁边，盘里剩${a-b}颗；合起来仍是原来的${a}颗。`});
 if(sid==='A02.02')Object.assign(t,{mode:'tenFill',filled:a,target:10,prompt:`十格板已有${a}颗。把空位置逐个补满，可以放回重新检查。`,explain:`已有${a}，补上${10-a}，合起来正好10；每个位置只放一颗。`});
 if(sid==='A02.03')Object.assign(t,{mode:'inverseMove',initial:a,delta:b,prompt:`先给${a}颗添${b}颗，再拿走同样多。完成这两个动作，选出相符的关系。`,explain:`${a}＋${b}－${b}回到${a}，添入和拿走互相抵消。`});
 if(sid==='A02.04')Object.assign(t,{mode:'equalGroups',groups:a,each:b,total:a*b,prompt:`把待分区的圆点摆成${a}组，每组${b}颗。每颗只能放在一组里。`,explain:`${a}组各${b}颗是${a}个${b}相加，共${a*b}颗。`});
 if(sid==='A02.05')Object.assign(t,{mode:'equalGroups',groups:c==='each'?b:a/b,each:c==='each'?a/b:b,total:a,unknownKind:c,dynamicGroups:c==='groups',prompt:c==='groups'?`${a}颗圆点，每盘装${b}颗。自己开盘，逐颗装完。`:`${a}颗圆点平均放入${b}盘。把全部圆点分完，让每盘一样多。`,explain:c==='groups'?`每盘${b}颗，${a}颗能装${a/b}盘，这是求盘数。`:`${a}颗平均分${b}盘，每盘${a/b}颗，这是求每份的量。`});
 if(sid==='A02.06')Object.assign(t,{mode:'orderGroups',initial:a,add:b,copies:c,prompt:`每组先有${a}颗，${b>=0?'添入':'拿走'}${Math.abs(b)}颗，再摆成${c}个完整相同的组。`,explain:`先完成括号里的${a}${b>=0?'＋':'－'}${Math.abs(b)}，得到${a+b}，再取${c}组，共${(a+b)*c}。`});
 if(phase==='练')t.hint='先按题意操作一个对象，再核对关系；可以撤销。';
 return t;
}
for(const [sid,rows] of Object.entries(FOUNDATION_MODELS)){
 const kinds=['transfer','independent','independent2','independent3','independent4','delayed','delayed7','delayed21'];
 const suffix={transfer:1,independent:2,delayed:3,independent2:4,independent3:5,independent4:6,delayed7:7,delayed21:8};
 foundationStages[sid]={};
 rows.slice(0,8).forEach((row,i)=>{const kind=kinds[i],phase=kind==='transfer'?'迁移':kind.startsWith('delayed')?'巩固':'测';foundationStages[sid][kind]=foundationInstance(sid,row,`T-${sid.replace('.','-')}-${suffix[kind]}`,phase,i===0?({'A01.01':'改变摆放结构，逐个对应，数量不依赖排列','A01.02':'非标准十与一实际交换；追踪原散点','A01.03':'钱币/整包单位转换到位值表示','A01.04':'十位不同，不能只看个位','A01.05':'从标准表示拆开，追踪同一批单位','A02.01':'从拿走改为合并，方向与对象来源改变','A02.02':'从算式辨识改为空位实际补齐','A02.03':'先构造再反向核对，保留原对象','A02.04':'组数与组大小角色分别核对','A02.05':'未知从每份量变为份数，自己开盘','A02.06':'括号内从加法变为减法'})[sid]:'有限新参数实例；不单独宣称新的迁移维度')});
 FOUNDATION_DEMOS[sid]=foundationInstance(sid,rows[8],`D-${sid.replace('.','-')}-1`,'学','不同于练习和正式测验的真实操作示范');
}
// Retain the eight original practice models, and add the three missing ones.
const foundationMissing={
 'A01.02':foundationInstance('A01.02',[1,13],'O-A01-02-1','练','任选10个入框'),
 'A01.03':foundationInstance('A01.03',[3,4,'十棒'],'O-A01-03-1','练','位值组成'),
 'A02.02':foundationInstance('A02.02',[6],'O-A02-02-1','练','补齐十格')
};
Object.assign(foundationWork,foundationMissing);
for(const t of Object.values(foundationWork)){
 t.contentVersion=68;
 if(!t.reason)t.reason={prompt:'什么说明这次操作符合题意？',options:[t.explain,'只要外形相似，数量和单位都可以忽略','改变表示就一定改变了总数'],answer:0};
}
if(typeof module!=='undefined')module.exports={FOUNDATION_MODELS,FOUNDATION_DEMOS,foundationInstance};

'use strict';
function stageAccess(skillId,kind){
 const tasks=STAGED_TASKS[skillId];if(!tasks?.[kind])return {allowed:false,reason:'此技能暂无该实例。'};
 if(kind==='transfer')return {allowed:true};
 const progress=saved.skillStage[skillId]||{};
 if(!progress.transferPassed)return {allowed:false,reason:'先完成另一种情境或表示。'};
 if(kind.startsWith('independent')){
  const number=Number(kind.replace('independent','')||1),prior=number===2?'independent':`independent${number-1}`;
  if(number===1||progress[prior+'Tried']||taskHistory(tasks[prior]).submissions>0)return {allowed:true};
  return {allowed:false,reason:'先提交上一道独立新题，再试备用题。'};
 }
 const qualifying=assessmentStageProgress(progress,tasks,saved.attempts);
 if(!qualifying.independentQualifiedAt)return {allowed:false,reason:`需要${ASSESSMENT_RULES.independentSuccesses}道不同新题的无提示首答正确记录。同题重试不会增加独立证据；可以回到操作练习。`};
 const delay=kind==='delayed7'?7:kind==='delayed21'?21:1;
 const dueAt=qualifying.independentQualifiedAt+delay*REVIEW_DELAY_MS;
 return Date.now()>=dueAt?{allowed:true,dueAt}:{allowed:false,dueAt,reason:'回访新实例尚未到期。'};
}
function stageLinks(skillId){
 if(!STAGED_TASKS[skillId])return '';
 const labels={transfer:'换情境或表示',independent:'独立新题一',independent2:'独立新题二',independent3:'备用新题一',independent4:'备用新题二',delayed:'隔日新实例',delayed7:'7天新实例',delayed21:'21天新实例'};
 const links=Object.entries(labels).filter(([kind])=>STAGED_TASKS[skillId][kind]).map(([kind,label])=>{
  const state=stageAccess(skillId,kind),task=STAGED_TASKS[skillId][kind];
  const tried=saved.attempts.some(a=>a.taskInstanceId===task.id);
  const due=state.dueAt?' '+new Date(state.dueAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+'（北京时间）':'';
  return `<button class="secondary" data-action="stage" data-code="${esc(skillId)}|${kind}" ${state.allowed?'':'disabled'}>${label}${tried?' · 已试过':''}</button>${state.allowed?'':`<small>${esc(state.reason+due)}</small>`}`;
 }).join('');
 return `<section class="panel stage-links"><h3>同一微技能的后续题</h3><p class="tiny-note">迁移题会改情境、表示、已知/未知位置或条件。无提示题先看关系独立作答；隔日题是不同的任务 ID，本机到期后开放。</p><div class="stage-buttons">${links}</div></section>`;
}
function stagePage(){const task=STAGED_TASKS[stageSkillId]?.[stageKind],access=stageAccess(stageSkillId,stageKind);if(!task||!access.allowed)return `<div class='panel'><h1>暂不能进入这道题</h1><p>${esc(access.reason||'任务不可用')}</p><button class='secondary' data-action='micro' data-code='${esc(stageSkillId)}'>回微技能</button></div>`;
 const heading=stageKind==='transfer'?'换一种方式试一试':stageKind==='delayed'?'隔日新题，自己想办法':'自己看题，独立作答';
 const history=taskHistory(task),assisted=history.modelViewed||history.hintEvents.length>0,attemptLabel=history.submissions?'同实例再练':history.legacyExposure?'旧实例再练':assisted?'已回看方法，本题记练习':'无提示';
 const board=taskBoard(task);
 return `<div class='page-head'><div><p class='kicker'>${esc(stageKind==='transfer'?stageSkillId+' · 迁移练习':'新实例')}</p><h1>${heading}</h1></div><button class='back' data-action='micro' data-code='${esc(stageSkillId)}'>← 微技能</button></div><div class='work'><article class='panel'><span class='phase'>${esc(task.phase)} · ${stageKind==='transfer'?'另一种表示/条件':attemptLabel}</span>${stageKind==='transfer'?`<p class='tiny-note'>本题改变：${esc(task.changeDimension)}。</p>`:''}<h2 class='task-title'>${esc(task.prompt)}</h2><div class='workshop-check-top'><button class='primary' data-action='${feedback?.ok?'next':'check'}'>${feedback?.ok?'完成本题，返回微技能 →':'检查当前操作 ✓'}</button></div>${board}${actionRow(task)}</article><aside class='side-stack'><section class='panel'><h3>本题证据边界</h3><p class='muted'>这是与前一题不同的固定实例。提交会记首答、操作状态和提示使用；同题重做不会生成新的独立首答。系统核对操作或所选对象，不判断口述是否正确。</p>${stageKind==='delayed'?'<p class="tiny-note">本机时间决定是否到期；不发送后台提醒。</p>':''}</section></aside></div>`;
}

'use strict';
// Seven authored fraction manipulatives. Every strip represents the same-size
// whole; a selected cell changes the mathematical state before checking.
const FRACTION_TASKS={
 'A03.01':{id:'O-A03-01-1',skillId:'A03.01',contentVersion:9,mode:'fractionLab',phase:'练',kind:'shade',denom:4,target:3,prompt:'把同样大的一块蛋糕平均分成4份。逐格涂出其中3份。',explain:'四等分中涂三格，涂色量是这同一整体的3/4。',hint:'先确认4格合成一个整体，再逐格点亮3格。',reason:{prompt:'为什么是3/4？',options:['整体平均分成4份，取其中3份','有3格涂色，所以分母也应是3','只看涂色面积，不必确认整体'],answer:0}},
 'A03.02':{id:'O-A03-02-1',skillId:'A03.02',contentVersion:9,mode:'fractionLab',phase:'练',kind:'shade',denom:4,target:1,prompt:'把一个等宽纸条平均折成4份。点亮恰好1份，找到单位分数。',explain:'同一整体的四个等份里取一个等份，是1/4。',hint:'四个小格宽度相同，先点亮其中一格。',reason:{prompt:'为什么一格是1/4？',options:['一个整体分成相等的4份，选其中1份','因为有1格涂色，所以总共只有1格','任意大小的一格都能叫1/4'],answer:0}},
 'A03.03':{id:'O-A03-03-1',skillId:'A03.03',contentVersion:9,mode:'fractionLab',phase:'练',kind:'compare',denomLeft:4,targetLeft:3,denomRight:4,targetRight:2,prompt:'两条同样长的纸条各分成4份。左条涂3份，右条涂2份，再点选涂色较多的一条。',explain:'整体同样大、每格同样宽，3/4比2/4多一格。',hint:'先在两条上逐格涂好，再比较同宽的涂色部分。',reason:{prompt:'比较为什么成立？',options:['两个整体同样大且都四等分，涂3格比2格多','左条放在左边就一定较多','分子3大于2，任何不同大小的整体都可直接比较'],answer:0}},
 'A03.04':{id:'O-A03-04-1',skillId:'A03.04',contentVersion:9,mode:'fractionLab',phase:'练',kind:'equal',denomLeft:4,targetLeft:2,denomRight:6,targetRight:3,prompt:'两条同样长的纸条，左条四等分涂2份，右条六等分涂3份。逐格涂好，再判断涂色长度。',explain:'2/4与3/6都占相同长度的一半；整体须同样长。',hint:'两条纸条外框等宽，点好两边，再看各自涂色到哪里。',reason:{prompt:'为什么它们等值？',options:['同样长的整体中，涂色都到一半的位置','两边涂的格数不同，所以绝不等值','只要分母不同就无法比较'],answer:0}},
 'A03.05':{id:'O-A03-05-1',skillId:'A03.05',contentVersion:9,mode:'fractionLab',phase:'练',kind:'line',denom:4,target:2,prompt:'从0到1的数轴平均分为4段。点到1/2所在的刻度。',explain:'四段中走过两段到达2/4，也就是1/2。',hint:'0与1之间有四段等长间隔，从0数两段。',reason:{prompt:'为什么这一点是1/2？',options:['从0到1走了4段中的2段，是2/4＝1/2','第二个刻度总是2，不看端点','数轴上1/2应在1的右边'],answer:0}},
 'A03.06':{id:'O-A03-06-1',skillId:'A03.06',contentVersion:9,mode:'fractionLab',phase:'练',kind:'decimal',denom:10,target:7,prompt:'把同样长的纸条分成10份，逐格点亮7份，再选出对应的小数。',explain:'十格中的七格是7/10，十分位为7，写作0.7。',hint:'先数出七个十分之一，再选小数卡。',reason:{prompt:'为什么写0.7？',options:['7份各是十分之一，所以是七个十分之一','7格写成0.07，因为7在百分位','小数点可以略去直接写7'],answer:0}},
 'A03.07':{id:'O-A03-07-1',skillId:'A03.07',contentVersion:9,mode:'fractionLab',phase:'练',kind:'remainder',total:12,first:6,second:3,prompt:'同一盘有12块。先逐块拿走一半的6块，再从剩下的6块中拿走一半。第二次拿走的是原来整体的几分之几？',explain:'第一次后余6，第二次拿走3；原来的整体是12，所以3/12＝1/4。',hint:'先点6块作为第一次拿走，切换步骤后从余下6块中点3块。',reason:{prompt:'第二次的3块为何是原整体的1/4？',options:['第二次取3块，原整体仍是12块，3/12＝1/4','第二次是剩余的一半，所以也是原来的1/2','两次都叫一半，原来的整体自动变成6块'],answer:0}}
};
if(typeof module!=='undefined')module.exports={FRACTION_TASKS};

'use strict';
// Fixed A03 cases: prompt, operation parameters, feedback, and the changed
// mathematical dimension. No random number substitutions or replayed IDs.
const FRACTION_CASES={
 'A03.01':[
  ['同样大的一张纸平均折6份，逐格涂4份。',{kind:'shade',denom:6,target:4},'四格占六等份，即4/6；整体仍是这张纸。','蛋糕换纸条，分母从4变6'],
  ['一个长方形等分8格，涂出5/8。',{kind:'shade',denom:8,target:5},'八个等格中取五格，表示5/8。','新的8格整体与5份'],
  ['一块相同大小的板分5格，涂出其中2/5。',{kind:'shade',denom:5,target:2},'五等份取二份，是2/5。','分成5格的新整体'],
  ['一条纸带等分6格，涂出其中5格。',{kind:'shade',denom:6,target:5},'六格整体取五格，是5/6。','另一个六等分新实例']
 ],
 'A03.02':[
  ['把一张纸折成5等份，只涂一个单位份。',{kind:'shade',denom:5,target:1},'一个等份是整体的1/5。','四等分换五等分'],
  ['一条纸带等分8格，只涂1/8。',{kind:'shade',denom:8,target:1},'八等份中只取一份。','八等份单位分数'],
  ['同样宽的纸条等分6格，涂一个单位份。',{kind:'shade',denom:6,target:1},'六等份中一份是1/6。','六等份的隔日实例'],
  ['把纸条等分3格，只涂1/3。',{kind:'shade',denom:3,target:1},'三等份中一份是1/3。','三等份新实例']
 ],
 'A03.03':[
  ['两个同样长的整体都分5格。左条涂4格，右条涂3格，比较涂色。',{kind:'compare',denomLeft:5,targetLeft:4,denomRight:5,targetRight:3,correctChoice:'left'},'同整体同分母，左边多一份。','从四格换成五格'],
  ['两条同样长的纸都六等分。左条涂2格，右条涂4格，选较多的一侧。',{kind:'compare',denomLeft:6,targetLeft:2,denomRight:6,targetRight:4,correctChoice:'right'},'右条的4/6多于左条2/6。','大小方向反转'],
  ['两条同样长的纸都八等分。左条涂5份，右条涂6份。',{kind:'compare',denomLeft:8,targetLeft:5,denomRight:8,targetRight:6,correctChoice:'right'},'相同整体的八等份中，右条多一格。','八等分新比较'],
  ['两个同长整体都五等分。左涂3格，右涂2格。',{kind:'compare',denomLeft:5,targetLeft:3,denomRight:5,targetRight:2,correctChoice:'left'},'左条3/5多于2/5。','五等分的另一新实例']
 ],
 'A03.04':[
  ['同样长的两条纸，左六等分涂3格，右八等分涂4格，判断是否等长。',{kind:'equal',denomLeft:6,targetLeft:3,denomRight:8,targetRight:4},'3/6与4/8都占各自同长整体的一半。','分母换6和8，同一半'],
  ['两条同长纸：左六等分涂2格，右三等分涂1格。',{kind:'equal',denomLeft:6,targetLeft:2,denomRight:3,targetRight:1},'2/6和1/3的涂色总长度一样。','等值改成三分之一'],
  ['两条同长纸：左八等分涂2格，右四等分涂1格。',{kind:'equal',denomLeft:8,targetLeft:2,denomRight:4,targetRight:1},'2/8与1/4相同。','等值改成四分之一'],
  ['两条同长纸：左九等分涂3格，右六等分涂2格。',{kind:'equal',denomLeft:9,targetLeft:3,denomRight:6,targetRight:2},'3/9与2/6都等于1/3。','九等分与六等分的新配对']
 ],
 'A03.05':[
  ['0到1的数轴六等分。点选1/2所在刻度。',{kind:'line',denom:6,target:3},'从0走三段，3/6＝1/2。','数轴从四段换六段'],
  ['0到1平均分八段。点选3/4所在刻度。',{kind:'line',denom:8,target:6},'六段占八段，6/8＝3/4。','目标位置换3/4'],
  ['0到1平均分十段。点选2/5所在刻度。',{kind:'line',denom:10,target:4},'四段占十段，4/10＝2/5。','十分位刻度换分数位置'],
  ['0到1平均分五段。点选2/5所在刻度。',{kind:'line',denom:5,target:2},'从0数两个等距间隔。','五等分的新数轴']
 ],
 'A03.06':[
  ['把一条纸分10格，涂4格，选择对应小数。',{kind:'decimal',denom:10,target:4,choices:['0.4','0.04','4'],correctChoice:'0.4'},'四个十分之一是0.4。','十分位由7换4，辨别百分位'],
  ['十格纸条涂9格，选出小数表示。',{kind:'decimal',denom:10,target:9,choices:['0.9','0.09','9'],correctChoice:'0.9'},'九个十分之一写作0.9。','接近整体1的新实例'],
  ['十格纸条涂2格，选择小数。',{kind:'decimal',denom:10,target:2,choices:['0.2','0.02','2'],correctChoice:'0.2'},'两个十分之一是0.2。','隔日较小份量'],
  ['十格纸条涂6格，选择小数。',{kind:'decimal',denom:10,target:6,choices:['0.6','0.06','6'],correctChoice:'0.6'},'六个十分之一是0.6。','另一个十分位实例']
 ],
 'A03.07':[
  ['一个整体16块，先拿走8块，再从剩下8块中取一半。',{kind:'remainder',total:16,first:8,second:4},'第二次拿走4/16，是原整体的1/4。','12块换16块，整体不变'],
  ['原有20块，先取一半，再取余下的一半。',{kind:'remainder',total:20,first:10,second:5},'第二次是5/20，原整体的1/4。','新20块整体'],
  ['原有8块，先取走4块，再取余下的一半。',{kind:'remainder',total:8,first:4,second:2},'第二次2/8，仍是原整体的1/4。','8块整体的隔日实例'],
  ['原有24块，先取走12块，再从余下取一半。',{kind:'remainder',total:24,first:12,second:6},'第二次6/24，是原整体的1/4。','24块整体的新实例']
 ]
};
const fractionStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(FRACTION_CASES)){
 if(cases.length!==4)throw Error('Four A03 cases required: '+skillId);
 fractionStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [prompt,params,explain,changeDimension]=cases[i];
  fractionStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:10,mode:'fractionLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,...(params.kind==='remainder'?{choices:['1/4','1/2','1/8'],correctChoice:'1/4'}:{}),prompt,explain,changeDimension,
   ...(kind==='transfer'?{hint:'先确认同一个整体、等分份数和本题要比较的量，再操作。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={FRACTION_CASES};

'use strict';
function fractionState(){return draft.work??(draft.work={left:[],right:[],first:[],second:[],phase:1,marker:-1,choice:'',moves:0})}
function fractionSectorPath(index,denom){if(denom===1)return 'M150 30A120 120 0 1 1 150 270A120 120 0 1 1 150 30Z';const a=index*2*Math.PI/denom-Math.PI/2,b=(index+1)*2*Math.PI/denom-Math.PI/2;return `M150 150L${150+120*Math.cos(a)} ${150+120*Math.sin(a)}A120 120 0 ${denom===1?1:0} 1 ${150+120*Math.cos(b)} ${150+120*Math.sin(b)}Z`}
function fractionStrip(side,denom,ordered=false,task={}){const w=fractionState(),picked=new Set(w[side]),shape=task.wholeShape||'strip',rows=task['partitionRows'+(side==='left'?'Left':'Right')]||task.partitionRows||1,scale=(task['wholeScale'+(side==='left'?'Left':'Right')]||1)/Math.max(task.wholeScaleLeft||1,task.wholeScaleRight||1);const buttons=Array.from({length:denom},(_,i)=>`<button class="fraction-cell ${picked.has(i)?'lit':''}" data-action="fractionCell" data-side="${side}" data-index="${i}" ${ordered&&i!==w[side].length&&i!==w[side].length-1?'disabled':''} aria-label="第${i+1}个等份，${picked.has(i)?'已涂色':'未涂色'}" aria-pressed="${picked.has(i)}">${shape==='circle'?i+1:''}</button>`).join('');
 if(shape==='circle')return `<div class="fraction-circle"><svg viewBox="0 0 300 300" role="img" aria-label="同一个圆平均分${denom}份，涂${picked.size}份">${Array.from({length:denom},(_,i)=>`<path d="${fractionSectorPath(i,denom)}" fill="${picked.has(i)?'#f3bd63':'#fff'}" stroke="#4d8674" stroke-width="2"/>`).join('')}</svg><div class="fraction-sector-controls">${buttons}</div></div>`;
 return `<div class="fraction-strip ${rows>1?'partition-grid':''}" style="--parts:${denom/rows};--partition-rows:${rows};width:${scale*100}%;" role="group" aria-label="${side==='left'?'左':'右'}整体，平均分${denom}份，${rows>1?rows+'行方格':'纸条'}">${buttons}</div>`;
}
function fractionChoices(task){const w=fractionState(),options=task.kind==='compare'?[['left','左条较多'],['right','右条较多'],['equal','一样多'],...(task.correctChoice==='differentWhole'?[['differentWhole','每格大小不同，不能只比格数']]:[])]:task.kind==='equal'?[['equal',task.compareArea?'面积一样大':'一样长'],['left','左边较多'],['right','右边较多']]:(task.choices||['0.7','0.07','7']).map(v=>[v,v]);return choiceButtons(task,options,'fractionChoice')}
function fractionBoard(task){const w=fractionState();
 if(['shade','decimal'].includes(task.kind))return `<div class="board fraction-board"><h3>同一个${task.wholeShape==='circle'?'圆':task.partitionRows?'方格面':'纸条'} · ${task.denom} 等份</h3>${fractionStrip('left',task.denom,false,task)}<p class="tiny-note">已点亮 ${w.left.length} / ${task.denom} 份。可再点一次撤回。</p>${task.kind==='decimal'?'<p>选出涂色部分的小数：</p>'+fractionChoices(task):''}</div>`;
 if(['compare','equal'].includes(task.kind))return `<div class="board fraction-board"><h3>${task.correctChoice==='differentWhole'?'先核对两个整体':task.compareArea?'外框面积一样大':'外框一样长'}，分法可以不同</h3><p class="tiny-note">从左逐格涂色；点最后一格可撤回。</p><p>左条 · ${task.denomLeft} 等份</p>${fractionStrip('left',task.denomLeft,true,task)}<p>右条 · ${task.denomRight} 等份</p>${fractionStrip('right',task.denomRight,true,task)}<p>${task.correctChoice==='differentWhole'?'能否只按涂色格数直接比较？':task.compareArea?'比较涂色面积：':'比较涂色长度：'}</p>${fractionChoices(task)}</div>`;
 if(task.kind==='line')return `<div class="board fraction-board"><h3>${task.lineStart??0} 到 ${task.lineEnd??1} · ${task.denom} 段等距</h3><div class="fraction-line" role="group" aria-label="数轴上的${task.denom+1}个刻度">${Array.from({length:task.denom+1},(_,i)=>`<button class="fraction-tick" data-action="fractionMark" data-index="${i}" aria-pressed="${w.marker===i}" aria-label="从${task.lineStart??0}向右第${i}段的位置">${i===0?task.lineStart??0:i===task.denom?task.lineEnd??1:'●'}</button>`).join('')}</div><p class="tiny-note">从左端点数经过的段数；端点也可以点。</p></div>`;
if(task.kind==='remainder')return `<div class="board fraction-board"><h3>原来${task.total}块 · 第${w.phase}次拿走</h3>${task.requireBasisSelection?`<div class="work-buttons"><button data-action="fractionReference" data-value="original" aria-pressed="${w.reference==='original'}">原来的一盘作为整体</button><button data-action="fractionReference" data-value="remaining" aria-pressed="${w.reference==='remaining'}">第一次后的一盘作为整体</button></div>`:''}<div class="fraction-pieces">${Array.from({length:task.total},(_,i)=>`<button class="fraction-piece ${w.first.includes(i)?'first':w.second.includes(i)?'second':''} ${w.reference==='original'||w.reference==='remaining'&&!w.first.includes(i)?'in-reference':''}" data-action="fractionPiece" data-index="${i}" data-object-id="P${i+1}" ${w.phase===2&&w.first.includes(i)?'disabled':''} aria-label="第${i+1}块，${w.first.includes(i)?'第一次拿走':w.second.includes(i)?'第二次拿走':'盘里剩余'}" aria-pressed="${w.phase===1?w.first.includes(i):w.second.includes(i)}">${w.first.includes(i)?'①':w.second.includes(i)?'②':'●'}</button>`).join('')}</div><p>第一次拿${w.first.length}块，第二次拿${w.second.length}块。</p><div class="work-buttons"><button data-action="fractionPhase" ${w.first.length===task.first||w.phase===2?'':'disabled'}>完成第一次，开始第二次</button><button data-action="fractionReset" ${w.moves?'':'disabled'}>↩ 从头重摆</button></div>${task.choices?`<p>第二次占${task.answerBasis==='remaining'?'第一次后的一盘':'原整体'}的几分之几？</p>`+fractionChoices(task):''}</div>`;
 return '';
}
function fractionGrade(task){const w=fractionState();let ok=false;
 if(task.kind==='shade')ok=w.left.length===task.target;
 if(task.kind==='decimal')ok=w.left.length===task.target&&w.choice===(task.correctChoice||'0.7');
 if(task.kind==='compare')ok=w.left.length===task.targetLeft&&w.right.length===task.targetRight&&w.choice===(task.correctChoice||'left');
 if(task.kind==='equal')ok=w.left.length===task.targetLeft&&w.right.length===task.targetRight&&w.choice==='equal';
 if(task.kind==='line')ok=w.marker===task.target;
 if(task.kind==='remainder')ok=w.phase===2&&w.first.length===task.first&&w.second.length===task.second&&new Set([...w.first,...w.second]).size===task.first+task.second&&(!task.correctChoice||w.choice===task.correctChoice)&&(!task.requireBasisSelection||w.reference===(task.answerBasis||'original'));
 return {ok,incomplete:w.moves===0||['decimal','compare','equal'].includes(task.kind)&&!w.choice||task.kind==='remainder'&&(w.phase===1||task.correctChoice&&!w.choice),reason:'检查同一个整体、等分份数、涂色格数和所选关系；再调整纸条或圆点。'};
}
function fractionAct(action,data,task){const w=fractionState();let changed=false;
 if(action==='fractionReference'&&task.requireBasisSelection&&['original','remaining'].includes(data.value)){w.reference=data.value;changed=true}
 if(action==='fractionCell'&&['shade','decimal','compare','equal'].includes(task.kind)){
  const side=data.side,i=Number(data.index),denom=side==='left'?task.denom??task.denomLeft:task.denomRight;
  if(['left','right'].includes(side)&&Number.isInteger(i)&&i>=0&&i<denom){
   if(['compare','equal'].includes(task.kind)){
    if(i===w[side].length){w[side].push(i);changed=true}
    else if(i===w[side].length-1){w[side].pop();changed=true}
   }else{const at=w[side].indexOf(i);at>=0?w[side].splice(at,1):w[side].push(i);changed=true}
  }
 }
 if(action==='fractionMark'&&task.kind==='line'){const i=Number(data.index);if(Number.isInteger(i)&&i>=0&&i<=task.denom){w.marker=i;changed=true}}
 if(action==='fractionChoice'&&['decimal','compare','equal','remainder'].includes(task.kind)&&(task.kind==='decimal'||task.kind==='remainder'?(task.choices||['0.7','0.07','7']).includes(data.value):['left','right','equal',...(task.correctChoice==='differentWhole'?['differentWhole']:[])].includes(data.value))){w.choice=data.value;changed=true}
 if(action==='fractionPiece'&&task.kind==='remainder'){
  const i=Number(data.index),list=w.phase===1?w.first:w.second;
  if(Number.isInteger(i)&&i>=0&&i<task.total&&!(w.phase===2&&w.first.includes(i))){const at=list.indexOf(i);at>=0?list.splice(at,1):list.push(i);changed=true}
 }
 if(action==='fractionPhase'&&task.kind==='remainder'&&w.phase===1&&w.first.length===task.first){w.phase=2;changed=true}
 if(action==='fractionReset'&&task.kind==='remainder'&&w.moves){draft.work={left:[],right:[],first:[],second:[],phase:1,marker:-1,choice:'',moves:0};return true}
 if(changed)w.moves++;
 return changed;
}
function fractionSpeech(task){const w=fractionState();return task.kind==='line'?w.marker<0?'还未选择刻度。':`从${task.lineStart??0}起向右第${w.marker}段的刻度。`:task.kind==='remainder'?`第一次拿走${w.first.length}块，第二次拿走${w.second.length}块，原来共有${task.total}块。`:`左条涂${w.left.length}格${task.denomRight?'，右条涂'+w.right.length+'格':''}。`}
function fractionPage(){const task=FRACTION_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return `<div class="panel">操作任务不存在。<button data-action="skillMap">回微技能目录</button></div>`;
 return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 分数操作</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${fractionBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>同一个整体</h3><p class="muted">先认出题目的整体，再看每个等份有多大。</p></section></aside></div>`;
}

'use strict';
const PERCENT_TASKS={
 'A04.01':{id:'O-A04-01-1',skillId:'A04.01',contentVersion:11,mode:'percentLab',phase:'练',kind:'shade',total:20,target:5,choices:['25%','5%','100%'],correctChoice:'25%',prompt:'一个整体是20格。逐格涂5格，再选涂色占这个整体的百分数。',explain:'5/20＝1/4＝25%，分母是整体20格。',hint:'先涂5格，再把5与整体20相比。',reason:{prompt:'为什么是25%？',options:['5格占20格的四分之一，等于25%','有5格涂色，所以一定是5%','涂色格子自己就是整体，等于100%'],answer:0}},
 'A04.02':{id:'O-A04-02-1',skillId:'A04.02',contentVersion:11,mode:'percentLab',phase:'练',kind:'shade',total:20,target:15,choices:['3/4','3/5','75'],correctChoice:'3/4',prompt:'20格纸条涂出75%，再从分数卡中选等值表示。',explain:'15/20约分成3/4，也等于75%。',hint:'四等份中取三份；20格的每一份有5格。',reason:{prompt:'75%为什么等于3/4？',options:['每5格是一份，共四份，涂三份','75%等于75格，与整体大小无关','涂了15格就写15/15'],answer:0}},
 'A04.03':{id:'O-A04-03-1',skillId:'A04.03',contentVersion:11,mode:'percentLab',phase:'练',kind:'shade',total:20,target:5,choices:['5','20','25'],correctChoice:'5',prompt:'20颗星排成20格。逐格点出其中25%，再选点亮的颗数。',explain:'20的四分之一是5颗。',hint:'25%是四分之一，分成四组各5颗。',reason:{prompt:'为什么是5颗？',options:['20颗平均分四份，每份5颗','25%表示直接取25颗','先把20颗当作25颗再分'],answer:0}},
 'A04.04':{id:'O-A04-04-1',skillId:'A04.04',contentVersion:11,mode:'percentLab',phase:'练',kind:'whole',part:10,copies:4,choices:['40','10','2.5'],correctChoice:'40',prompt:'原整体的25%是10颗。把一份10颗复制到四份，找回完整整体。',explain:'25%是一份四分之一，四份10颗组成40颗。',hint:'从一份10颗开始，逐组加到四份。',reason:{prompt:'为什么原整体是40？',options:['一份占25%，四份相同的10组成40','把10再乘25%就得到整体','只知道10颗，不能恢复四等份'],answer:0}},
 'A04.05':{id:'O-A04-05-1',skillId:'A04.05',contentVersion:11,mode:'percentLab',phase:'练',kind:'change',start:100,add:10,remove:11,choices:['99','100','90'],correctChoice:'99',prompt:'从100出发先涨10%。逐个添10到110；再按新整体110降10%，逐个拿走11。',explain:'两次10%的基准不同：100＋10＝110，110－11＝99。',hint:'先完成增长，再看110的10%是11，而不是10。',reason:{prompt:'为什么没有回到100？',options:['下降的10%按新的110算，是11','两次都是10%，所以必定相互抵消','第二次仍按旧整体100算'],answer:0}},
 'A04.06':{id:'O-A04-06-1',skillId:'A04.06',contentVersion:11,mode:'percentLab',phase:'练',kind:'estimate',a:49,b:21,targetA:50,targetB:20,choices:['约1000','约100','约10000'],correctChoice:'约1000',prompt:'估算49×21。调整两个因数到邻近整十50和20，观察百格块，再选估算量级。',explain:'50×20＝1000；49×21也在千附近。',hint:'49向上靠50，21向下靠20。',reason:{prompt:'为什么约1000合理？',options:['50×20是10个百，接近49×21','49×21只需把49和21相加','估算必须与准确积完全一样'],answer:0}}
};
if(typeof module!=='undefined')module.exports={PERCENT_TASKS};

'use strict';
const PERCENT_CASES={
 'A04.01':[
  ['12张贴纸组成整体。逐张点亮3张，判断它们占整体的百分数。',{kind:'shade',total:12,target:3,choices:['25%','3%','75%'],correctChoice:'25%'},'3/12＝1/4＝25%。','20格换12张贴纸'],
  ['整体是16格，涂出4格，选所占百分数。',{kind:'shade',total:16,target:4,choices:['25%','4%','75%'],correctChoice:'25%'},'4/16＝25%。','16格新整体'],
  ['一板8格取2格，选出占原整体的百分数。',{kind:'shade',total:8,target:2,choices:['25%','2%','50%'],correctChoice:'25%'},'2/8＝25%。','8格隔日实例'],
  ['24块积木作为整体，点亮其中6块，选百分数。',{kind:'shade',total:24,target:6,choices:['25%','6%','75%'],correctChoice:'25%'},'6/24＝25%。','24块新整体']
 ],
 'A04.02':[
  ['20格条涂出一半，再选与50%等值的分数。',{kind:'shade',total:20,target:10,choices:['1/2','1/5','50'],correctChoice:'1/2'},'10/20＝1/2＝50%。','75%换50%'],
  ['20格条涂出20%，选择相等的分数。',{kind:'shade',total:20,target:4,choices:['1/5','1/4','20'],correctChoice:'1/5'},'4/20＝1/5＝20%。','百分数换20%'],
  ['20格条涂出60%，选出等值分数。',{kind:'shade',total:20,target:12,choices:['3/5','3/4','60'],correctChoice:'3/5'},'12/20＝3/5＝60%。','60%隔日实例'],
  ['20格条涂40%，选出等值分数。',{kind:'shade',total:20,target:8,choices:['2/5','2/3','40'],correctChoice:'2/5'},'8/20＝2/5＝40%。','40%新实例']
 ],
 'A04.03':[
  ['16颗星的25%是多少颗？逐格点出部分量，再选颗数。',{kind:'shade',total:16,target:4,choices:['4','16','25'],correctChoice:'4'},'16的一半再一半是4。','整体由20换16'],
  ['30颗星的20%是多少？逐格点亮并选颗数。',{kind:'shade',total:30,target:6,choices:['6','20','30'],correctChoice:'6'},'30的五分之一是6。','目标百分比变20%'],
  ['24颗星的50%是多少？逐格点亮并选颗数。',{kind:'shade',total:24,target:12,choices:['12','24','50'],correctChoice:'12'},'24的一半是12。','50%新整体'],
  ['40颗星的75%是多少？点亮所求部分并选择数量。',{kind:'shade',total:40,target:30,choices:['30','40','75'],correctChoice:'30'},'40的四分之三是30。','75%与40颗新实例']
 ],
 'A04.04':[
  ['整体的20%是8颗。把8颗当一份，逐份复制到完整整体，再选总数。',{kind:'whole',part:8,copies:5,choices:['40','8','20'],correctChoice:'40'},'20%是一份五分之一，五份8颗合成40。','25%改20%，四份改五份'],
  ['一个整体的25%是6颗，复制相同份直到得到完整整体。',{kind:'whole',part:6,copies:4,choices:['24','6','25'],correctChoice:'24'},'四份各6颗合成24。','一份改6颗'],
  ['一个整体的50%是12颗，复制成完整整体。',{kind:'whole',part:12,copies:2,choices:['24','12','50'],correctChoice:'24'},'两半各12颗，整体24颗。','基准百分比改一半'],
  ['一个整体的20%是5颗，复制到完整整体。',{kind:'whole',part:5,copies:5,choices:['25','5','20'],correctChoice:'25'},'五份各5颗，完整整体25颗。','五等份的新实例']
 ],
 'A04.05':[
  ['从200先涨10%，再从新数降10%。逐个添20并从220逐个拿走22，选最终量。',{kind:'change',start:200,add:20,remove:22,choices:['198','200','180'],correctChoice:'198'},'200＋20＝220，220－22＝198。','起点由100换200'],
  ['从50先涨20%，再按新数降20%。逐个添10，再从60拿走12。',{kind:'change',start:50,add:10,remove:12,choices:['48','50','40'],correctChoice:'48'},'50＋10＝60，60－12＝48。','比例换20%和较小基准'],
  ['从80先涨25%，再按新数降25%。添20后从100拿走25。',{kind:'change',start:80,add:20,remove:25,choices:['75','80','60'],correctChoice:'75'},'80＋20＝100，100－25＝75。','比例换四分之一'],
  ['从150先涨20%，再按新数降20%。添30后从180拿走36。',{kind:'change',start:150,add:30,remove:36,choices:['144','150','120'],correctChoice:'144'},'150＋30＝180，180－36＝144。','150作原基准的新实例']
 ],
 'A04.06':[
  ['估算29×41。把两数调到30和40，观察百格块并选合理量级。',{kind:'estimate',a:29,b:41,targetA:30,targetB:40,choices:['约1200','约120','约12000'],correctChoice:'约1200'},'30×40＝1200，29×41接近这个量级。','因数换29与41'],
  ['估算39×19，调到邻近整十后选量级。',{kind:'estimate',a:39,b:19,targetA:40,targetB:20,choices:['约800','约80','约8000'],correctChoice:'约800'},'40×20＝800。','两个因数都向上取整十'],
  ['估算58×31，调整到60与30并选量级。',{kind:'estimate',a:58,b:31,targetA:60,targetB:30,choices:['约1800','约180','约18000'],correctChoice:'约1800'},'60×30＝1800。','58向上调两格'],
  ['估算69×29，调整到70与30并选量级。',{kind:'estimate',a:69,b:29,targetA:70,targetB:30,choices:['约2100','约210','约21000'],correctChoice:'约2100'},'70×30＝2100。','两个因数的新实例']
 ]
};
const percentStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(PERCENT_CASES)){
 if(cases.length!==4)throw Error('Four A04 cases required: '+skillId);
 percentStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [prompt,params,explain,changeDimension]=cases[i];
  percentStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:12,mode:'percentLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,
   ...(kind==='transfer'?{hint:'先确定哪一个量是本题的整体或第二次变化的基准，再逐步操作。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={PERCENT_CASES};

'use strict';
function percentState(t){
 if(draft.work){
  const w=draft.work;
  if(t.kind==='change'&&!w.activeIds){
   w.activeIds=Array.from({length:t.start},(_,i)=>'I'+(i+1));w.removedIds=[];
   const add=()=>w.activeIds.push(...Array.from({length:w.added},(_,i)=>'A'+(i+1))),remove=()=>{if(w.removed)w.removedIds.push(...w.activeIds.splice(-w.removed))};
   if(t.changeOrder==='removeFirst'){remove();add()}else{add();remove()}
  }
  return w;
 }
 const w={selected:[],copies:0,phase:1,added:0,removed:0,a:t.a,b:t.b,choice:'',reference:'',moves:0};
 if(t.kind==='change')Object.assign(w,{activeIds:Array.from({length:t.start},(_,i)=>'I'+(i+1)),removedIds:[]});
 if(t.kind==='whole'&&t.knownShares)Object.assign(w,{copies:t.knownShares,pool:Array.from({length:t.knownCount},(_,i)=>'K'+(i+1)),bins:Array.from({length:t.knownShares},()=>[]),copiedGroups:[]});
 if(t.kind==='estimate'&&t.bounds)Object.assign(w,{boundStage:'lower',boundRecords:{}});
 return draft.work=w;
}
function percentChoices(t){return choiceButtons(t,t.choices.map(v=>[v,v]),'percentChoice')}
function percentMarks(ids){return ids.map(id=>`<i data-object-id="${esc(id)}" aria-hidden="true"></i>`).join('')}
function percentChangeVisual(t,w){return `<div class="percent-visual"><section><b>当前盘</b><div class="percent-dots" role="img" aria-label="当前盘中的点">${percentMarks(w.activeIds)}</div></section><section><b>拿走的原点</b><div class="percent-dots removed">${percentMarks(w.removedIds)}</div></section></div>`}
function percentBoundArea(r,label){return `<section><h4>${label}：${r.a}×${r.b}</h4><div class="percent-hundreds" style="display:grid;grid-template-columns:repeat(${r.a/10},1fr)">${Array.from({length:r.a*r.b/100},()=>'<span>100</span>').join('')}</div></section>`}
function percentBoard(t){
 const w=percentState(t),formal=assessmentFormal(t);
 if(t.kind==='shade'){
  const cell=i=>`<button data-action="percentCell" data-index="${i}" class="percent-cell ${w.selected.includes(i)?'lit':''}" aria-label="第${i+1}个等份" aria-pressed="${w.selected.includes(i)}">${t.wholeShape==='circle'?i+1:''}</button>`;
  const content=t.wholeShape==='circle'?`<div class="fraction-circle"><svg viewBox="0 0 300 300" role="img" aria-label="同一个圆平均分${t.total}份">${Array.from({length:t.total},(_,i)=>`<path d="${fractionSectorPath(i,t.total)}" fill="${w.selected.includes(i)?'#f3bd63':'#fff'}" stroke="#4d8674" stroke-width="2"/>`).join('')}</svg><div class="fraction-sector-controls">${Array.from({length:t.total},(_,i)=>cell(i)).join('')}</div></div>`:t.wholeIndices?`<div class="reference-material ${w.reference==='table'?'reference-selected':''}"><section class="reference-group ${w.reference==='frame'?'reference-selected':''}"><h4>框内</h4><div class="percent-grid">${t.wholeIndices.map(cell).join('')}</div></section><section><h4>框外</h4><div class="percent-grid">${Array.from({length:t.total},(_,i)=>i).filter(i=>!t.wholeIndices.includes(i)).map(cell).join('')}</div></section></div>`:`<div class="percent-grid">${Array.from({length:t.total},(_,i)=>cell(i)).join('')}</div>`;
  return `<div class="board percent-board"><h3>先确认同一个整体</h3>${t.requireWholeSelection?`<div class="work-buttons"><button data-action="percentReference" data-value="frame" aria-pressed="${w.reference==='frame'}">框内作为整体</button><button data-action="percentReference" data-value="table" aria-pressed="${w.reference==='table'}">全桌作为整体</button></div>`:''}${content}<p>已涂 ${w.selected.length} 份。选择对应的量：</p>${percentChoices(t)}</div>`;
 }
 if(t.kind==='whole'){
  const split=t.knownShares,ready=split&&!w.pool.length&&w.bins.every(ids=>ids.length===t.part);
  const known=split?`<h3>已知部分 ${t.knownCount} 颗</h3><div class="percent-dots">${percentMarks(w.pool)}</div><div class="percent-groups">${w.bins.map((ids,i)=>`<section class="percent-group"><p>单位份${i+1}</p><div class="percent-dots">${percentMarks(ids)}</div><button data-action="percentSplit" data-index="${i}" ${!w.pool.length?'disabled':''}>放入1颗</button><button data-action="percentUnsplit" data-index="${i}" ${!ids.length||w.copiedGroups.length?'disabled':''}>放回1颗</button></section>`).join('')}</div>`:`<h3>一份 ${t.part} 颗</h3>`;
  const groups=split?w.copiedGroups:Array.from({length:w.copies},(_,i)=>Array.from({length:t.part},(_,j)=>`C${i+1}-${j+1}`));
  return `<div class="board percent-board">${known}<div class="percent-groups">${groups.map(ids=>`<div class="percent-group"><div class="percent-dots">${percentMarks(ids)}</div></div>`).join('')}</div><div class="work-buttons"><button data-action="percentCopy" ${w.copies>=8||split&&!ready?'disabled':''}>＋ 补出一个单位份</button><button data-action="percentUncopy" ${w.copies>(split?t.knownShares:0)?'':'disabled'}>↩ 拿回一份</button></div>${formal?'':`<p>当前共 ${w.copies*t.part} 颗</p>`}<p>原整体是多少？</p>${percentChoices(t)}</div>`;
 }
 if(t.kind==='change'){
  const reverse=t.changeOrder==='removeFirst',adding=reverse?w.phase===2:w.phase===1,n=adding?w.added:w.removed,target=adding?t.add:t.remove;
  return `<div class="board percent-board"><h3>原量 ${t.start} · 第${w.phase}次变化</h3>${percentChangeVisual(t,w)}<div class="percent-change"><span>已添 ${w.added}</span><span>已拿走 ${w.removed}</span>${formal?'':`<b>现在 ${w.activeIds.length}</b>`}</div><div class="work-buttons"><button data-action="${adding?'percentAdd':'percentRemove'}" ${n>=target?'disabled':''}>${adding?'＋ 添1颗':'－ 拿走1颗'}</button><button data-action="percentUndo" ${n?'':'disabled'}>↩ 撤销上一步</button>${w.phase===1?`<button data-action="percentPhase" ${n===target?'':'disabled'}>以当前盘为基准，开始第二步</button>`:''}<button data-action="percentReset" ${w.moves?'':'disabled'}>从头重摆</button></div><p>两次变化后的量：</p>${percentChoices(t)}</div>`;
 }
 if(t.kind==='estimate'){
  return `<div class="board percent-board"><h3>${t.bounds?w.boundStage==='lower'?'先构造整十下界':w.boundStage==='upper'?'再构造整十上界':'比较两个边界':'调到邻近整十'}</h3><div class="percent-factors">${[['a','第一个因数'],['b','第二个因数']].map(([side,label])=>`<div><b>${label} ${w[side]}</b><button data-action="percentAdjust" data-side="${side}" data-delta="-1">－1</button><button data-action="percentAdjust" data-side="${side}" data-delta="1">＋1</button></div>`).join('')}</div>${w.a%10===0&&w.b%10===0&&w.a*w.b/100<=24?percentBoundArea(w,'当前模型'):'<p>调到整十后，每块表示100。</p>'}${t.bounds?`<button data-action="percentBoundRecord" ${w.boundStage==='complete'?'disabled':''}>保存当前边界</button>${Object.entries(w.boundRecords).map(([kind,r])=>percentBoundArea(r,kind==='lower'?'保存的下界':'保存的上界')).join('')}<button data-action="percentReset">重新构造边界</button>`:''}<p>选择积的${t.bounds?'区间':'估算量级'}：</p>${percentChoices(t)}</div>`;
 }
 return '';
}
function percentGrade(t){
 const w=percentState(t);let ok=false;
 if(t.kind==='shade')ok=new Set(w.selected).size===t.target&&w.selected.length===t.target&&w.selected.every(i=>i>=0&&i<t.total&&(!t.wholeIndices||t.wholeIndices.includes(i)))&&(!t.requireWholeSelection||w.reference==='frame')&&w.choice===t.correctChoice;
 if(t.kind==='whole')ok=w.copies===t.copies&&w.choice===t.correctChoice&&(!t.knownShares||!w.pool.length&&w.bins.every(ids=>ids.length===t.part)&&w.bins.flat().length===t.knownCount&&new Set(w.bins.flat()).size===t.knownCount&&w.copiedGroups.length===t.copies-t.knownShares&&w.copiedGroups.every(ids=>ids.length===t.part));
 if(t.kind==='change')ok=w.phase===2&&w.added===t.add&&w.removed===t.remove&&w.activeIds.length===t.start+t.add-t.remove&&new Set([...w.activeIds,...w.removedIds]).size===t.start+t.add&&w.choice===t.correctChoice;
 if(t.kind==='estimate')ok=w.choice===t.correctChoice&&(t.bounds?['lower','upper'].every(k=>w.boundRecords[k]?.a===t.bounds[k][0]&&w.boundRecords[k]?.b===t.bounds[k][1]):w.a===t.targetA&&w.b===t.targetB);
 return {ok,incomplete:!w.moves||!w.choice||t.kind==='change'&&w.phase===1,reason:'核对整体、每步基准和原对象。'};
}
function percentAct(action,data,t){
 const w=percentState(t),reverse=t.changeOrder==='removeFirst';let changed=false;
 if(action==='percentReference'&&t.requireWholeSelection&&['frame','table'].includes(data.value)){w.reference=data.value;changed=true}
 if(action==='percentCell'&&t.kind==='shade'){const i=Number(data.index);if(Number.isInteger(i)&&i>=0&&i<t.total){const at=w.selected.indexOf(i);at>=0?w.selected.splice(at,1):w.selected.push(i);changed=true}}
 if(action==='percentSplit'&&t.knownShares&&!w.copiedGroups.length){const i=Number(data.index);if(Number.isInteger(i)&&w.bins[i]&&w.pool.length){w.bins[i].push(w.pool.shift());changed=true}}
 if(action==='percentUnsplit'&&t.knownShares&&!w.copiedGroups.length){const i=Number(data.index);if(Number.isInteger(i)&&w.bins[i]?.length){w.pool.push(w.bins[i].pop());changed=true}}
 if(action==='percentCopy'&&t.kind==='whole'&&w.copies<8&&(!t.knownShares||!w.pool.length&&w.bins.every(ids=>ids.length===t.part))){if(t.knownShares)w.copiedGroups.push(Array.from({length:t.part},(_,i)=>`C${w.copies-t.knownShares+1}-${i+1}`));w.copies++;changed=true}
 if(action==='percentUncopy'&&t.kind==='whole'&&w.copies>(t.knownShares||0)){if(t.knownShares)w.copiedGroups.pop();w.copies--;changed=true}
 if(action==='percentAdd'&&t.kind==='change'&&w.phase===(reverse?2:1)&&w.added<t.add){w.activeIds.push('A'+(++w.added));changed=true}
 if(action==='percentRemove'&&t.kind==='change'&&w.phase===(reverse?1:2)&&w.removed<t.remove){const id=w.activeIds.pop();if(id){w.removedIds.push(id);w.removed++;changed=true}}
 if(action==='percentPhase'&&t.kind==='change'&&w.phase===1&&(reverse?w.removed===t.remove:w.added===t.add)){w.phase=2;changed=true}
 if(action==='percentUndo'&&t.kind==='change'){const adding=reverse?w.phase===2:w.phase===1;if(adding&&w.added){const at=w.activeIds.indexOf('A'+w.added);if(at>=0){w.activeIds.splice(at,1);w.added--;changed=true}}else if(!adding&&w.removed){w.activeIds.push(w.removedIds.pop());w.removed--;changed=true}}
 if(action==='percentReset'&&['change','estimate'].includes(t.kind)&&w.moves){draft.work=null;percentState(t);return true}
 if(action==='percentAdjust'&&t.kind==='estimate'&&['a','b'].includes(data.side)&&[-1,1].includes(Number(data.delta))){const n=w[data.side]+Number(data.delta);if(n>=1&&n<=150){w[data.side]=n;changed=true}}
 if(action==='percentBoundRecord'&&t.bounds&&w.boundStage!=='complete'&&w.a%10===0&&w.b%10===0){const lower=w.boundStage==='lower';if(lower?w.a<t.a&&w.b<t.b:w.a>t.a&&w.b>t.b){w.boundRecords[w.boundStage]={a:w.a,b:w.b};w.boundStage=lower?'upper':'complete';if(lower){w.a=t.a;w.b=t.b}changed=true}}
 if(action==='percentChoice'&&t.choices.includes(data.value)){w.choice=data.value;changed=true}
 if(changed)w.moves++;return changed;
}
function percentSpeech(t){
 const w=percentState(t),formal=assessmentFormal(t);
 if(t.kind==='shade')return `涂了${w.selected.length}份。${t.requireWholeSelection?w.reference==='frame'?'选框内为整体。':w.reference==='table'?'选全桌为整体。':'尚未选择整体。':`同一整体有${t.total}份。`}`;
 if(t.kind==='whole')return `摆了${w.copies}个单位份。${t.knownShares?`还有${w.pool.length}个原点待分。`:''}${formal?'':`当前共${w.copies*t.part}颗。`}`;
 if(t.kind==='change')return `第${w.phase}次变化，已添${w.added}、已拿走${w.removed}。${formal?'':`现在${w.activeIds.length}。`}`;
 return `两个因数${w.a}与${w.b}。${t.bounds?`已保存${Object.keys(w.boundRecords).length}个边界。`:''}`;
}
function percentPage(){const task=PERCENT_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return `<div class="panel">操作任务不存在。<button data-action="skillMap">回目录</button></div>`;return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)}</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 返回</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题 →':'检查操作与理由 ✓'}</button></div>${percentBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack">${stageLinks(task.skillId)}</aside></div>`}

'use strict';
const INTEGER_TASKS={
 'A05.01':{kind:'position',start:0,target:-3,context:'温度计',prompt:'以0℃为界，沿刻度向下走到零下3℃。标记实际落在哪里？',explain:'从0向下走3格到−3；负号表示在零以下。',reason:{prompt:'为什么标在−3？',options:['零下3在0的下方三格','−3在0的上方三格','0也是负数'],answer:0}},
 'A05.02':{kind:'compare',left:-4,right:2,target:2,context:'东西方向',prompt:'把−4和＋2都标在数轴上，选出较大的位置。',explain:'＋2在−4右侧，所以＋2较大。',reason:{prompt:'为什么＋2较大？',options:['数轴右边的数较大','带负号的数一定比较大','−4离0更远所以较大'],answer:0}},
 'A05.03':{kind:'walk',start:-2,target:3,context:'升降电梯',prompt:'电梯从地下2层（−2）出发，每次上升一层，逐步走到3层。',explain:'−2→−1→0→1→2→3，共走5步，经过0。',reason:{prompt:'为什么走5层？',options:['从−2到0走2层，再从0到3走3层','3－2＝1层','从−2到3向下走5层'],answer:0}},
 'A05.04':{kind:'square',side:4,target:16,context:'铺地砖',prompt:'正方形每边4块方砖。逐行添砖到4行，数一数总面积。',explain:'4行，每行4格，共4×4＝16格。',reason:{prompt:'为什么是16格？',options:['每行4格，共4行','只数四条边所以是4格','两边相加是8格'],answer:0}},
 'A05.05':{kind:'root',target:25,side:5,context:'方形花圃',prompt:'面积25格的正方形花圃，逐层扩成正方形，找正的边长。',explain:'5行，每行5格得25格；边长取正数5。',reason:{prompt:'为什么边长是5？',options:['5×5＝25，长度取正值','−5是可以量出的负长度','边长等于面积25'],answer:0}},
 'A05.06':{kind:'power',base:2,exponent:4,target:16,context:'折纸翻倍',prompt:'从1张纸起，每轮变成原来的2倍。逐轮操作4轮，读出2⁴的结果。',explain:'1→2→4→8→16；2⁴是四个2相乘。',reason:{prompt:'为什么结果是16？',options:['连续四次乘2得到16','2乘4等于8，所以指数是8','四次加2从1开始得9'],answer:0}}
};
for(const [skillId,t] of Object.entries(INTEGER_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:13,mode:'integerLab',phase:'练',hint:'用刻度或方格逐步操作，再用自己的话说数量关系。'});
if(typeof module!=='undefined')module.exports={INTEGER_TASKS};

'use strict';
// Each row changes context, representation, unknown or condition; the last is a fresh fallback after a missed first answer.
const INTEGER_CASES={
 'A05.01':[
  [{kind:'position',start:0,target:-2,context:'潜水深度'},'海面为0，潜水员下潜2格，在垂直刻度标出深度。','从0向下两格到−2。','温度改水深'],
  [{kind:'position',start:0,target:4,context:'海拔'},'海拔0为起点，向上移动4格，在刻度上标高度。','从0向上四格到＋4。','负方向换正方向'],
  [{kind:'position',start:0,target:-5,context:'地下停车层'},'地面为0，向下移动5层，在垂直刻度标位置。','从0向下五格到−5。','楼层与新距离'],
  [{kind:'position',start:0,target:3,context:'气温'},'气温从0升到零上3℃，逐格移动标记。','从0向上三格到＋3。','气温正方向新实例']
 ],
 'A05.02':[
  [{kind:'compare',left:-2,right:-5,target:-2,context:'气温'},'标出−2℃与−5℃，比较哪一天温度更高。','−2在−5右侧。','两数均为负'],
  [{kind:'compare',left:0,right:-3,target:0,context:'楼层'},'把地面0层与地下3层标出，选较高楼层。','0在−3右侧。','引入0'],
  [{kind:'compare',left:4,right:-1,target:4,context:'海拔'},'在水平数轴标出＋4和−1，选较大的海拔数。','4在−1右侧。','交换左右顺序'],
  [{kind:'compare',left:-6,right:-4,target:-4,context:'气温'},'在数轴标出−6与−4，选较高气温。','−4在−6右侧。','两个负数新实例']
 ],
 'A05.03':[
  [{kind:'walk',start:-3,target:2,context:'游戏棋'},'棋子从−3向右走到2，逐格移动并数跨过0的步数。','−3到0有3步，0到2有2步，共5步。','从电梯换棋盘'],
  [{kind:'walk',start:2,target:-2,context:'温度'},'温度从＋2逐格下降到−2，数一数一共下降几格。','2到0有2格，0到−2有2格，共4格。','上升改下降'],
  [{kind:'walk',start:-4,target:1,context:'海拔'},'从海拔−4逐格上升到＋1，走过0并数步。','−4到0有4步，0到1有1步，共5步。','更远的负起点'],
  [{kind:'walk',start:3,target:-1,context:'棋盘'},'棋子从＋3逐格向左走到−1，数经过0的步数。','3到0有3步，0到−1有1步，共4步。','从正到负的新实例']
 ],
 'A05.04':[
  [{kind:'square',side:3,target:9,context:'方形窗格'},'每边3格的方窗，逐行搭好正方形再数格数。','3行每行3格，共9格。','砖换窗格与边长'],
  [{kind:'square',side:5,target:25,context:'方形棋盘'},'每边5格的棋盘，逐行铺好后求面积。','5×5＝25格。','增大边长'],
  [{kind:'square',side:2,target:4,context:'方形瓷砖'},'每边2块小砖，逐行铺正方形求面积。','2×2＝4块。','较小正方形新实例'],
  [{kind:'square',side:6,target:36,context:'方形贴纸'},'每边6张贴纸，逐行搭好并数总张数。','6×6＝36张。','六行六列新实例']
 ],
 'A05.05':[
  [{kind:'root',side:4,target:16,context:'方形桌面'},'方形桌面面积16格，从1×1逐层长大，找到正边长。','4×4＝16，边长4。','花圃换桌面'],
  [{kind:'root',side:3,target:9,context:'方形棋盘'},'面积9格的方棋盘，逐层扩正方形并读边长。','3×3＝9，边长3。','面积变小'],
  [{kind:'root',side:6,target:36,context:'方形地毯'},'面积36格的方毯，逐层扩成正方形找正边长。','6×6＝36，边长6。','面积增大'],
  [{kind:'root',side:2,target:4,context:'方形花坛'},'面积4格的方花坛，逐层扩成正方形找边长。','2×2＝4，边长2。','面积4的新实例']
 ],
 'A05.06':[
  [{kind:'power',base:3,exponent:2,target:9,context:'复制图案'},'从1个图案开始，每轮复制成原来的3倍，操作两轮。','1→3→9，是3²。','底数改3次数改2'],
  [{kind:'power',base:2,exponent:5,target:32,context:'折纸'},'从1个图案开始，每轮翻倍，操作五轮求2⁵。','1→2→4→8→16→32。','指数改5'],
  [{kind:'power',base:4,exponent:2,target:16,context:'卡片复制'},'从1张卡片开始，每轮复制成4倍，两轮后读4²。','1→4→16。','底数4与平方'],
  [{kind:'power',base:3,exponent:3,target:27,context:'种子分叉'},'每轮一变三，从1颗开始操作三轮求3³。','1→3→9→27。','底数指数都换的新实例']
 ]
};
const integerStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(INTEGER_CASES)){
 if(cases.length!==4)throw Error('Four A05 cases required: '+skillId);
 integerStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];
  integerStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:14,mode:'integerLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先画出起点或搭出第一行，再逐步改变模型。'}:{})};
 }
}
for(const tasks of Object.values(integerStageTarget))for(const t of Object.values(tasks))if(['测','巩固'].includes(t.phase)&&['square','root','power'].includes(t.kind))t.contentVersion=70;
if(typeof module!=='undefined')module.exports={INTEGER_CASES};

'use strict';
function integerState(task){return draft.work??(draft.work={position:task.start??0,path:[task.start??0],left:null,right:null,choice:null,rows:0,side:0,rounds:0,value:1,amount:0,amountSet:false,moves:0})}
function integerLine(task,w){
 const label=n=>n>0?'+'+n:String(n),low=task.axis==='vertical'?-3:-6,high=task.axis==='vertical'?1:6;
 const ticks=Array.from({length:high-low+1},(_,i)=>task.axis==='vertical'?high-i:low+i);
 return `<div class="integer-line ${task.axis==='vertical'?'vertical-number-line':''}" role="group" aria-label="${task.axis==='vertical'?'向上数值增大的竖直':'从左到右增大的'}数轴，每格相差一">${ticks.map(n=>`<button data-action="integerMark" data-value="${n}" class="integer-tick ${w.position===n&&task.kind!=='compare'?'now':''} ${w.left===n?'left':''} ${w.right===n?'right':''}" aria-label="刻度${label(n)}${w.position===n&&task.kind!=='compare'?'，当前标记':''}" aria-pressed="${task.kind==='compare'?w.left===n||w.right===n:w.position===n}"><span>${label(n)}</span><small>${task.kind==='compare'?(w.left===n?'甲':w.right===n?'乙':''):w.position===n?'●':''}</small></button>`).join('')}</div>`;
}
function integerSquares(side,rows,kind){if(!side)return '';return `<div class="integer-grid" style="--side:${side}" role="img" aria-label="${kind==='square'?rows+'行，每行'+side+'格':side+'行，每行'+side+'格'}，已填${kind==='square'?rows*side:side*side}格">${Array.from({length:side*side},(_,i)=>`<span class="${kind==='square'&&Math.floor(i/side)>=rows?'empty':''}" aria-hidden="true"></span>`).join('')}</div>`}
function integerAmountControls(task,w){if(!task.unitSize)return '';return `<p>每块方砖边长 ${task.unitSize} 米。${task.kind==='root'?'正方形的边长':'正方形的面积'}：${w.amount} ${task.kind==='root'?'米':'平方米'}</p><div class='work-buttons'>${[-10,-1,1,5,10].map(d=>`<button data-action='integerAmount' data-delta='${d}'>${d>0?'+':''}${d}</button>`).join('')}</div>`}
function integerBoard(task){const w=integerState(task),buttons=(...items)=>`<div class="work-buttons">${items.join('')}</div>`;
if(task.kind==='position'||task.kind==='walk')return `<div class="board integer-board"><h3>${esc(task.context)} · 0 是参照点</h3><div class="${task.axis==='vertical'?'vertical-line-layout':''}">${integerLine(task,w)}<section><p>起点 ${task.start}；当前 ${w.position}；已经走 ${w.path.length-1} 格${task.kind==='walk'?`；路径 ${w.path.join(' → ')}`:''}</p>${buttons(`<button data-action="integerStep" data-delta="-1" ${w.position<=(task.axis==='vertical'?-3:-6)?'disabled':''}>${task.axis==='vertical'?'↓ 向下1格':'← 向左1格'}</button>`,`<button data-action="integerStep" data-delta="1" ${w.position>=(task.axis==='vertical'?1:6)?'disabled':''}>${task.axis==='vertical'?'↑ 向上1格':'向右1格 →'}</button>`,`<button data-action="integerUndo" ${w.path.length===1?'disabled':''}>↩ 撤回一步</button>`)}</section></div></div>`;
 if(task.kind==='compare')return `<div class="board integer-board"><h3>${esc(task.context)} · 先放甲，再放乙</h3>${integerLine(task,w)}<p>甲 ${w.left===null?'未放':w.left}；乙 ${w.right===null?'未放':w.right}。点刻度放第一张和第二张标记，之后可重新放。</p>${buttons(`<button data-action="integerReset" ${w.moves?'':'disabled'}>↩ 清除两个标记</button>`)}<p>哪一个数在右边、更大？</p>${buttons(`<button data-action="integerChoice" data-value="left" aria-pressed="${w.choice==='left'}">甲 ${task.left}</button>`,`<button data-action="integerChoice" data-value="right" aria-pressed="${w.choice==='right'}">乙 ${task.right}</button>`)}</div>`;
 if(task.kind==='square')return `<div class="board integer-board"><h3>每行 ${task.side} 格 · 已铺 ${w.rows} 行</h3>${integerSquares(task.side,w.rows,'square')}${buttons(`<button data-action="integerRow" data-delta="1" ${w.rows>=task.side?'disabled':''}>＋ 添完整一行</button>`,`<button data-action="integerRow" data-delta="-1" ${w.rows<=0?'disabled':''}>↩ 撤回一行</button>`)}${assessmentFormal(task)?'':`<p>现在 ${w.rows} × ${task.side}＝${w.rows*task.side} 格。</p>`}${integerAmountControls(task,w)}</div>`;
 if(task.kind==='root')return `<div class="board integer-board"><h3>目标面积 ${task.target} ${task.unitSize?'平方米':'格'} · 边上已摆${w.side}块</h3>${integerSquares(w.side,w.side,'root')}${buttons(`<button data-action="integerGrow" data-delta="1" ${w.side>=6?'disabled':''}>＋ 扩大一圈</button>`,`<button data-action="integerGrow" data-delta="-1" ${w.side<=0?'disabled':''}>↩ 缩小一圈</button>`)}${assessmentFormal(task)?'':`<p>当前 ${w.side} × ${w.side}＝${w.side*w.side} 格。</p>`}${integerAmountControls(task,w)}</div>`;
 return `<div class="board integer-board"><h3>${esc(task.context)} · 每轮乘 ${task.base}</h3><div class="integer-dots" role="img" aria-label="当前${w.value}个点">${Array.from({length:w.value},()=>'<i aria-hidden="true"></i>').join('')}</div><p>从1开始，已做 ${w.rounds} / ${task.exponent} 轮，当前 ${w.value} 个。</p>${buttons(`<button data-action="integerMultiply" ${w.rounds>=task.exponent?'disabled':''}>× ${task.base} · 再做一轮</button>`,`<button data-action="integerUndo" ${w.rounds===0?'disabled':''}>↩ 撤回一轮</button>`)}</div>`;
}
function integerGrade(task){const w=integerState(task);let ok=false,incomplete=w.moves===0;
 if(task.kind==='position')ok=w.position===task.target&&w.path.length>1;
 if(task.kind==='walk')ok=w.position===task.target&&w.path.includes(0)&&w.path.length-1===Math.abs(task.target-task.start)&&w.path.every((n,i)=>!i||n-w.path[i-1]===Math.sign(task.target-task.start));
 if(task.kind==='compare'){ok=w.left===task.left&&w.right===task.right&&w.choice===(task.target===task.left?'left':'right');incomplete=w.left===null||w.right===null||!w.choice}
 if(task.kind==='square')ok=w.rows===task.side&&w.rows*task.side*(task.unitSize??1)**2===task.target&&(!task.unitSize||w.amountSet&&w.amount===task.target);
 if(task.kind==='root')ok=w.side===task.side&&w.side*w.side*(task.unitSize??1)**2===task.target&&(!task.unitSize||w.amountSet&&w.amount===task.side*task.unitSize);
 if(task.kind==='power')ok=w.rounds===task.exponent&&w.value===task.target;
 return {ok,incomplete,reason:'核对起点、方向、每格距离，以及方格的行列或每一轮相乘的次数。'};
}
function integerAct(action,data,task){const w=integerState(task);let changed=false;
 if(action==='integerAmount'&&task.unitSize&&[-10,-1,1,5,10].includes(Number(data.delta))){const n=w.amount+Number(data.delta);if(n>=0&&n<=200){w.amount=n;w.amountSet=true;changed=true}}
 if(action==='integerStep'&&['position','walk'].includes(task.kind)){const d=Number(data.delta);if([-1,1].includes(d)&&w.position+d>=(task.axis==='vertical'?-3:-6)&&w.position+d<=(task.axis==='vertical'?1:6)){w.position+=d;w.path.push(w.position);changed=true}}
 if(action==='integerMark'&&task.kind==='compare'){const n=Number(data.value);if(Number.isInteger(n)&&n>=-6&&n<=6){if(w.left===null)w.left=n;else w.right=n;changed=true}}
 if(action==='integerChoice'&&task.kind==='compare'&&['left','right'].includes(data.value)){w.choice=data.value;changed=true}
 if(action==='integerReset'&&task.kind==='compare'&&w.moves){w.left=null;w.right=null;w.choice=null;changed=true}
 if(action==='integerRow'&&task.kind==='square'){const d=Number(data.delta);if([-1,1].includes(d)&&w.rows+d>=0&&w.rows+d<=task.side){w.rows+=d;changed=true}}
 if(action==='integerGrow'&&task.kind==='root'){const d=Number(data.delta);if([-1,1].includes(d)&&w.side+d>=0&&w.side+d<=6){w.side+=d;changed=true}}
 if(action==='integerMultiply'&&task.kind==='power'&&w.rounds<task.exponent){w.rounds++;w.value*=task.base;changed=true}
 if(action==='integerUndo'&&['position','walk'].includes(task.kind)&&w.path.length>1){w.path.pop();w.position=w.path.at(-1);changed=true}
 if(action==='integerUndo'&&task.kind==='power'&&w.rounds){w.rounds--;w.value/=task.base;changed=true}
 if(changed)w.moves++;return changed;
}
function integerSpeech(task){const w=integerState(task);return ['position','walk'].includes(task.kind)?`从${task.start}出发，当前在${w.position}，走了${w.path.length-1}步。`:task.kind==='compare'?`甲标在${w.left}，乙标在${w.right}。`:task.kind==='square'?`已铺${w.rows}行，每行${task.side}格。`:task.kind==='root'?`当前边长${w.side}，面积${w.side*w.side}格。`:`已做${w.rounds}轮，当前${w.value}个。`}
function integerPage(){const task=INTEGER_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return `<div class="panel">操作任务不存在。</div>`;return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 数轴与方格操作</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${integerBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>先动手，再解释</h3><p class="muted">数轴每次移动一格；方格逐行铺或逐层扩；指数每轮按底数倍增。理由卡只核对所选依据，不能替代口头解释或完整六阶段验收。</p></section></aside></div>`}

'use strict';
const RATIO_TASKS={
 'R01.01':{kind:'unit',red:6,blue:3,unit:3,groups:2,context:'红蓝玻璃珠',prompt:'蓝珠3颗是一份。把6颗红珠每3颗圈成一组，数出红珠有几份蓝珠。',explain:'红珠6颗可分成两组3颗，所以是蓝珠的2份。',reason:{prompt:'为什么红珠是两份？',options:['以蓝珠3颗为一份，6颗红珠可圈两组','红珠6颗就是6份','红蓝合起来9颗，所以是9份'],answer:0}},
 'R01.02':{kind:'order',red:2,blue:3,context:'绘画颜料',prompt:'逐颗摆出2颗红和3颗蓝；先说红，后说蓝，写出红:蓝的顺序。',explain:'红在前为2，蓝在后为3，红:蓝是2:3。',reason:{prompt:'为什么是2:3？',options:['前项对应红2，后项对应蓝3','蓝在后就写成3:2','红蓝两色合起来是2:5'],answer:0}},
 'R01.03':{kind:'whole',red:2,blue:3,context:'棋子盒',prompt:'摆2红3蓝，合在同一个盒里。红色占整个盒子几分之几？',explain:'红2，整体2＋3＝5，红占2/5，区别于红:蓝＝2:3。',reason:{prompt:'为什么红占2/5？',options:['分子是红2，分母是整个盒子的5','分母只用蓝3，得到2/3','只看红色2颗，所以是2/2'],answer:0}},
 'R01.04':{kind:'scale',red:2,blue:3,copies:3,context:'饮料配方',prompt:'每份配方用2红3蓝；同时复制到3份，观察红蓝数量如何一起变化。',explain:'复制三份，红6蓝9，两边同乘3，比仍为2:3。',reason:{prompt:'为什么新比相同？',options:['两边都乘3，得到6:9','只复制红色也保持2:3','红蓝相加为15，比例就是15:1'],answer:0}},
 'R01.05':{kind:'partition',red:6,blue:9,unitRed:2,unitBlue:3,copies:3,context:'食材袋',prompt:'袋里红6蓝9，逐份分成相同的小袋，找回每袋红蓝数量。',explain:'红6分成3份每份2，蓝9分成3份每份3；一袋红2蓝3。',reason:{prompt:'为什么每份是红2蓝3？',options:['两色都分成同样的3份','只把红除以3，蓝不变','把红蓝数互换成3:2'],answer:0}}
};
for(const [skillId,t] of Object.entries(RATIO_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:15,mode:'ratioLab',phase:'练',hint:'先确定谁是一份、哪个是整体，再在两种颜色上同时操作。'});
if(typeof module!=='undefined')module.exports={RATIO_TASKS};

'use strict';
const RATIO_CASES={
 'R01.01':[
  [{kind:'unit',red:8,blue:2,unit:2,groups:4,context:'积木'},'蓝积木2个是一份，逐组圈出8个红积木有几份。','8÷2＝4份。','珠子换积木、单位一份改为2'],
  [{kind:'unit',red:9,blue:3,unit:3,groups:3,context:'纸花'},'蓝纸花3朵是一份，逐组圈出红纸花9朵有几份。','9÷3＝3份。','纸花与三份新实例'],
  [{kind:'unit',red:12,blue:4,unit:4,groups:3,context:'果盘'},'蓝果4个是一份，逐组圈出红果12个有几份。','12÷4＝3份。','隔日改为四个一份'],
  [{kind:'unit',red:10,blue:5,unit:5,groups:2,context:'彩灯'},'蓝灯5盏是一份，逐组圈出10盏红灯。','10÷5＝2份。','新单位五盏与彩灯']
 ],
 'R01.02':[
  [{kind:'order',red:3,blue:2,context:'队伍',order:'blueFirst'},'摆出3个红队员、2个蓝队员，按照蓝:红顺序选比。','蓝:红是2:3。','已知次序换为蓝:红'],
  [{kind:'order',red:4,blue:1,context:'花束',order:'redFirst'},'摆4朵红花、1朵蓝花，选红:蓝的比。','红:蓝是4:1。','换花束与单位一'],
  [{kind:'order',red:2,blue:5,context:'棋子',order:'blueFirst'},'摆红2蓝5，选蓝:红的比。','蓝:红是5:2。','隔日先蓝后红'],
  [{kind:'order',red:5,blue:3,context:'卡片',order:'redFirst'},'摆红5蓝3，选红:蓝的比。','红:蓝是5:3。','新卡片实例']
 ],
 'R01.03':[
  [{kind:'whole',red:3,blue:2,context:'果盘'},'摆红果3蓝果2，红果占全部的几分之几？','3/(3＋2)＝3/5。','红色份量变3，区别于红蓝之比'],
  [{kind:'whole',red:1,blue:4,context:'扣子盒'},'摆红扣1蓝扣4，红扣占整个盒子的几分之几？','1/(1＋4)＝1/5。','分子改1、整体仍为5'],
  [{kind:'whole',red:2,blue:4,context:'队伍'},'摆红队员2蓝队员4，红队员占全部的几分之几？','2/(2＋4)＝2/6＝1/3。','整体6并需约分'],
  [{kind:'whole',red:3,blue:5,context:'颜料'},'摆红3蓝5，红色占这8份的几分之几？','3/(3＋5)＝3/8。','整体8的新实例']
 ],
 'R01.04':[
  [{kind:'scale',red:3,blue:1,copies:2,context:'舞台灯'},'每组红3蓝1，同时复制成两组；观察新数量与原比。','两组红6蓝2，与3:1相同。','饮料换灯、两份'],
  [{kind:'scale',red:1,blue:2,copies:4,context:'花束'},'每束红1蓝2，同时复制四束。','红4蓝8，比仍是1:2。','单份红1与四份'],
  [{kind:'scale',red:2,blue:1,copies:3,context:'拼图'},'每组红2蓝1，同时复制三组。','红6蓝3，比仍是2:1。','隔日拼图两色新比'],
  [{kind:'scale',red:1,blue:3,copies:2,context:'彩旗'},'每组红1蓝3，同时复制两组。','红2蓝6，比仍是1:3。','新彩旗实例']
 ],
 'R01.05':[
  [{kind:'partition',red:8,blue:4,unitRed:2,unitBlue:1,copies:4,context:'拼图袋'},'红8蓝4分成相同的四份，逐袋分配找每份。','每份红2蓝1。','总数与份数均改'],
  [{kind:'partition',red:9,blue:6,unitRed:3,unitBlue:2,copies:3,context:'花束'},'红9蓝6分成三束相同花束，逐束分配。','每束红3蓝2。','红蓝单份交换大小'],
  [{kind:'partition',red:4,blue:8,unitRed:1,unitBlue:2,copies:4,context:'卡片袋'},'红4蓝8分成四袋相同卡片，逐袋分配。','每袋红1蓝2。','隔日红少于蓝'],
  [{kind:'partition',red:6,blue:4,unitRed:3,unitBlue:2,copies:2,context:'彩灯串'},'红6蓝4分成两串相同彩灯，逐串分配。','每串红3蓝2。','新两份实例']
 ]
};
const ratioStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(RATIO_CASES)){
 if(cases.length!==4)throw Error('Four R01 cases required: '+skillId);
 ratioStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];ratioStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:16,mode:'ratioLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先分清单份、前后项和整体，再实际摆出两种颜色。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={RATIO_CASES};

'use strict';
function ratioState(task){
 const w=draft.work??(draft.work={red:0,blue:0,groups:0,copiesRed:1,copiesBlue:1,perRed:task.knownUnit?task.unitRed:0,perBlue:task.knownUnit?task.unitBlue:0,bags:0,leftRed:task.red,leftBlue:task.blue,choice:'',moves:0,log:[]});
 w.log??=[];w.bagIds??=Array.from({length:w.bags},(_,i)=>({red:Array.from({length:w.perRed},(_,j)=>'R'+(i*w.perRed+j)),blue:Array.from({length:w.perBlue},(_,j)=>'B'+(i*w.perBlue+j))}));
 w.redPool??=Array.from({length:w.leftRed},(_,i)=>'R'+(w.bags*w.perRed+i));w.bluePool??=Array.from({length:w.leftBlue},(_,i)=>'B'+(w.bags*w.perBlue+i));
 return w;
}
function ratioDots(n,color,ids){return `<div class="ratio-dots" role="img" aria-label="${color==='red'?'红':'蓝'}色${n}颗">${Array.from({length:n},(_,i)=>`<i class="${color}" ${ids?`data-object-id="${ids[i]}"`:''} aria-hidden="true"></i>`).join('')}</div>`}
function ratioButtons(...items){return `<div class="work-buttons ratio-actions">${items.join('')}</div>`}
function ratioCorrectChoice(task){
 if(task.kind==='order')return task.order==='blueFirst'?`${task.blue}:${task.red}`:`${task.red}:${task.blue}`;
 const n=task.focusSide==='blue'?task.blue:task.red,d=task.red+task.blue,gcd=(a,b)=>b?gcd(b,a%b):a,g=gcd(n,d);return `${n/g}/${d/g}`;
}
function ratioChoice(task,w){
 const correct=ratioCorrectChoice(task),n=task.focusSide==='blue'?task.blue:task.red,other=task.focusSide==='blue'?task.red:task.blue;
 const alternatives=task.kind==='order'?[task.order==='blueFirst'?`${task.red}:${task.blue}`:`${task.blue}:${task.red}`,`${task.red}:${task.red+task.blue}`]:[`${n}/${other}`,`${other}/${task.red+task.blue}`];
 return `<p>${task.kind==='order'?'按规定的先后选择比：':`选择${task.focusSide==='blue'?'蓝':'红'}色占整个盒子的份量：`}</p>${choiceButtons(task,[...new Set([correct,...alternatives])].map(c=>[c,c]),'ratioChoice')}`;
}
function ratioTargets(task){return task.targetCopies||{red:task.copies,blue:task.copies}}
function ratioScaleChoice(task){const w=ratioState(task);return task.targetCopies?`<p>和原配比相比，现在的比：</p>${choiceButtons(task,[['same','保持相同'],['changed','已经改变']],'ratioChoice')}`:''}
function ratioBoard(task){const w=ratioState(task);
 if(task.kind==='unit')return `<div class="board ratio-board"><h3>${esc(task.context)} · 蓝色 ${task.blue} 颗是一份</h3>${ratioDots(task.blue,'blue')}<div class="ratio-group-list">${Array.from({length:task.groups},(_,i)=>`<div class="ratio-group ${i<w.groups?'circled':''}" aria-label="红珠第${i+1}份${i<w.groups?'已圈出':'未圈出'}">${ratioDots(task.unit,'red')}</div>`).join('')}</div><p>已圈出红色 ${w.groups} 份。</p>${ratioButtons(`<button data-action="ratioGroup" data-delta="1" ${w.groups>=task.groups?'disabled':''}>圈下一份 ${task.unit} 颗</button>`,`<button data-action="ratioGroup" data-delta="-1" ${!w.groups?'disabled':''}>↩ 撤回一份</button>`)}</div>`;
 if(['order','whole'].includes(task.kind))return `<div class="board ratio-board"><h3>${esc(task.context)} · 两种量分别摆出</h3><div class="ratio-pair">${['red','blue'].map(side=>`<section><b>${side==='red'?'红':'蓝'}色 ${w[side]} / ${task[side]}</b>${ratioDots(w[side],side)}${ratioButtons(`<button data-action="ratioAdd" data-side="${side}" data-delta="1" ${w[side]>=task[side]?'disabled':''}>＋${side==='red'?'红':'蓝'}1</button>`,`<button data-action="ratioAdd" data-side="${side}" data-delta="-1" ${!w[side]?'disabled':''}>↩${side==='red'?'红':'蓝'}1</button>`)}</section>`).join('')}</div><p>两色合起来 ${w.red+w.blue} 颗。</p>${ratioChoice(task,w)}</div>`;
 if(task.kind==='scale'){const limit=Math.max(...Object.values(ratioTargets(task)));return `<div class="board ratio-board"><h3>${esc(task.context)} · 原来红${task.red}、蓝${task.blue}</h3><div class="ratio-pair">${['red','blue'].map(side=>`<section><b>${side==='red'?'红':'蓝'} ${w['copies'+(side==='red'?'Red':'Blue')]} 份</b>${ratioDots(w['copies'+(side==='red'?'Red':'Blue')]*task[side],side)}</section>`).join('')}</div>${ratioButtons(...['both','red','blue'].map(side=>`<button data-action="ratioCopy" data-side="${side}" ${(side==='both'?Math.max(w.copiesRed,w.copiesBlue):w['copies'+(side==='red'?'Red':'Blue')])>=limit?'disabled':''}>${side==='both'?'同时复制红蓝一份':side==='red'?'只复制红一份':'只复制蓝一份'}</button>`),`<button data-action="ratioUndo" ${!w.log.length?'disabled':''}>↩ 撤回一次复制</button>`)}${ratioScaleChoice(task)}</div>`}
 const controls=task.knownUnit?'':ratioButtons(...['red','blue'].flatMap(side=>[1,-1].map(d=>`<button data-action="ratioPer" data-side="${side}" data-delta="${d}" ${w.bags?'disabled':''}>每袋${side==='red'?'红':'蓝'}${d>0?'＋':'－'}1</button>`)));
 return `<div class="board ratio-board"><h3>${esc(task.context)} · 原来红${task.red}、蓝${task.blue}</h3><p>每袋红 ${w.perRed}、蓝 ${w.perBlue}；已经分 ${w.bags}${task.knownUnit?'':' / '+task.copies} 袋。</p><div class="ratio-pair"><section><b>剩余红 ${w.leftRed}</b>${ratioDots(w.leftRed,'red',w.redPool)}</section><section><b>剩余蓝 ${w.leftBlue}</b>${ratioDots(w.leftBlue,'blue',w.bluePool)}</section></div><div class="ratio-group-list">${w.bagIds.map((ids,i)=>`<div class="ratio-group circled"><b>第${i+1}袋</b>${ratioDots(ids.red.length,'red',ids.red)}${ratioDots(ids.blue.length,'blue',ids.blue)}</div>`).join('')}</div>${controls}${ratioButtons(`<button data-action="ratioBag" ${!w.perRed||!w.perBlue||w.leftRed<w.perRed||w.leftBlue<w.perBlue||!task.knownUnit&&w.bags>=task.copies?'disabled':''}>分出一袋</button>`,`<button data-action="ratioUndo" ${!w.bags?'disabled':''}>↩ 同一袋放回</button>`,`<button data-action="ratioReset" ${w.moves?'':'disabled'}>从头重摆</button>`)}</div>`;
}
function ratioGrade(task){const w=ratioState(task);let ok=false,incomplete=w.moves===0;
 if(task.kind==='unit')ok=w.groups===task.groups&&w.groups*task.unit===task.red&&task.unit===task.blue;
 if(['order','whole'].includes(task.kind)){ok=w.red===task.red&&w.blue===task.blue&&w.choice===ratioCorrectChoice(task);incomplete=w.red===0&&w.blue===0||!w.choice}
 if(task.kind==='scale'){const target=ratioTargets(task);ok=w.copiesRed===target.red&&w.copiesBlue===target.blue&&(!task.targetCopies||w.choice===(target.red===target.blue?'same':'changed'));incomplete=w.moves===0||!!task.targetCopies&&!w.choice}
 if(task.kind==='partition'){
  const reds=[...w.redPool,...w.bagIds.flatMap(ids=>ids.red)],blues=[...w.bluePool,...w.bagIds.flatMap(ids=>ids.blue)];
  ok=w.bags===task.copies&&w.leftRed===0&&w.leftBlue===0&&w.perRed===task.unitRed&&w.perBlue===task.unitBlue&&w.bagIds.length===w.bags&&w.bagIds.every(ids=>ids.red.length===w.perRed&&ids.blue.length===w.perBlue)&&reds.length===task.red&&blues.length===task.blue&&new Set(reds).size===task.red&&new Set(blues).size===task.blue;
 }
 return {ok,incomplete,reason:'分别核对两种量。占整体的分母包括两色；只有两色按同一倍数改变，原配比才保持。'};
}
function ratioAct(action,data,task){const w=ratioState(task);let changed=false,d=Number(data.delta),side=data.side;
 if(action==='ratioGroup'&&task.kind==='unit'&&[-1,1].includes(d)&&w.groups+d>=0&&w.groups+d<=task.groups){w.groups+=d;changed=true}
 if(action==='ratioAdd'&&['order','whole'].includes(task.kind)&&['red','blue'].includes(side)&&[-1,1].includes(d)&&w[side]+d>=0&&w[side]+d<=task[side]){w[side]+=d;changed=true}
 if(action==='ratioChoice'&&['order','whole','scale'].includes(task.kind)&&typeof data.value==='string'){w.choice=data.value;changed=true}
 if(action==='ratioCopy'&&task.kind==='scale'&&['red','blue','both'].includes(side)){
  const keys=side==='both'?['copiesRed','copiesBlue']:[side==='red'?'copiesRed':'copiesBlue'],limit=Math.max(...Object.values(ratioTargets(task)));
  if(keys.every(k=>w[k]<limit)){for(const k of keys)w[k]++;w.log.push(keys);changed=true}
 }
 if(action==='ratioPer'&&task.kind==='partition'&&!task.knownUnit&&w.bags===0&&['red','blue'].includes(side)&&[-1,1].includes(d)&&w['per'+(side==='red'?'Red':'Blue')]+d>=0&&w['per'+(side==='red'?'Red':'Blue')]+d<=task[side]){w['per'+(side==='red'?'Red':'Blue')]+=d;changed=true}
 if(action==='ratioBag'&&task.kind==='partition'&&w.perRed>0&&w.perBlue>0&&(task.knownUnit||w.bags<task.copies)&&w.leftRed>=w.perRed&&w.leftBlue>=w.perBlue){
  w.bagIds.push({red:w.redPool.splice(0,w.perRed),blue:w.bluePool.splice(0,w.perBlue)});w.bags++;w.leftRed=w.redPool.length;w.leftBlue=w.bluePool.length;changed=true;
 }
 if(action==='ratioUndo'&&task.kind==='partition'&&w.bags){const ids=w.bagIds.pop();w.redPool.unshift(...ids.red);w.bluePool.unshift(...ids.blue);w.bags--;w.leftRed=w.redPool.length;w.leftBlue=w.bluePool.length;changed=true}
 if(action==='ratioUndo'&&task.kind==='scale'&&w.log.length){for(const k of w.log.pop())w[k]--;changed=true}
 if(action==='ratioReset'&&['scale','partition'].includes(task.kind)&&w.moves){draft.work=null;return true}
 if(changed)w.moves++;return changed;
}
function ratioSpeech(task){const w=ratioState(task);return task.kind==='unit'?`红已圈${w.groups}份，蓝色每份${task.blue}颗。`:task.kind==='scale'?`红${w.copiesRed*task.red}颗，蓝${w.copiesBlue*task.blue}颗。`:task.kind==='partition'?`每袋红${w.perRed}蓝${w.perBlue}，分了${w.bags}袋，还剩红${w.leftRed}蓝${w.leftBlue}。`:`红已摆${w.red}，蓝已摆${w.blue}。`}
function ratioPage(){const task=RATIO_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)}</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 返回</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题 →':'检查操作与理由 ✓'}</button></div>${ratioBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack">${stageLinks(task.skillId)}</aside></div>`}

'use strict';
const RATE_TASKS={
 'R02.01':{kind:'divide',total:8,units:4,per:2,amountUnit:'元',unit:'个苹果',context:'买苹果',prompt:'8枚一元钱对应4个苹果。把钱币逐枚分到每个苹果下，求每个苹果的价钱。',explain:'8元平均分给4个苹果，每个2元/个。',reason:{prompt:'为什么是2元/个？',options:['每个苹果分到同样的2枚一元钱','8元买4个，所以每个8元','只看苹果数就是4元/个'],answer:0}},
 'R02.02':{kind:'divide',total:12,units:3,per:4,amountUnit:'升',unit:'分钟',context:'接水',prompt:'3分钟接12升水。把12升逐升分到3个一分钟格，求每分钟流量。',explain:'12÷3＝4升/分钟。',reason:{prompt:'为什么单位是升/分钟？',options:['每个一分钟格分到4升','4分钟才能接1升','12升是每一分钟的量'],answer:0}},
 'R02.03':{kind:'compare',a:{total:6,units:3,per:2},b:{total:8,units:2,per:4},amountUnit:'元',unit:'支',context:'笔的单价',prompt:'甲6元买3支，乙8元买2支。分别把钱币逐枚分到每支笔下，选更便宜的一包。',explain:'甲每支2元，乙每支4元；同为每支，甲便宜。',reason:{prompt:'为什么甲便宜？',options:['甲2元/支，小于乙4元/支','甲总价6小于8就一定便宜','甲有3支、乙有2支，支数多就一定便宜'],answer:0}},
 'R02.04':{kind:'convert',count:2,factor:100,from:'米',to:'厘米',direction:'forward',context:'长度尺',prompt:'一米卡对应100厘米。逐张换出两张一米卡的厘米量。',explain:'2张一米卡换成2组100厘米，共200厘米。',reason:{prompt:'为什么是200厘米？',options:['每米100厘米，两张相同卡合成200厘米','2米就是20厘米','单位不同但数字总保持2'],answer:0}},
 'R02.05':{kind:'divide',total:10,units:2,per:5,amountUnit:'千米',unit:'小时',context:'行程',prompt:'2小时共走10千米。逐千米分到两个一小时格，求平均速度。',explain:'每小时5千米，即5千米/小时。',reason:{prompt:'为什么是5千米/小时？',options:['10千米平均分给2个一小时格','2小时走10千米就每小时走10千米','把时间除以路程得到5千米/小时'],answer:0}}
};
for(const [skillId,t] of Object.entries(RATE_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:17,mode:'rateLab',phase:'练',hint:'先把每一个的时间或物品摆出来，再逐个分配量，检查单位。'});
if(typeof module!=='undefined')module.exports={RATE_TASKS};

'use strict';
const RATE_CASES={
 'R02.01':[
  [{kind:'compose',units:3,per:4,total:12,amountUnit:'元',unit:'盒彩笔',context:'购物'},'每盒彩笔4元，逐枚给3盒彩笔各放4元，找总价。','3盒各4元，共12元。','从已知总价求单价改为已知单价求总价'],
  [{kind:'divide',total:15,units:5,per:3,amountUnit:'元',unit:'瓶水',context:'买水'},'15枚一元钱对应5瓶水，逐枚均分，求每瓶价格。','15÷5＝3元/瓶。','换水瓶与五个单位'],
  [{kind:'compose',units:4,per:2,total:8,amountUnit:'元',unit:'支笔',context:'文具'},'每支笔2元，给4支笔逐枚摆钱币，读出总价。','4×2＝8元。','隔日从单位率反求总价'],
  [{kind:'divide',total:12,units:4,per:3,amountUnit:'元',unit:'个面包',context:'面包店'},'12元买4个面包，逐枚均分，求每个价格。','12÷4＝3元/个。','新价格与商品']
 ],
 'R02.02':[
  [{kind:'compose',units:4,per:3,total:12,amountUnit:'升',unit:'分钟',context:'水龙头'},'每分钟接3升，给4个一分钟格各添3升，求总量。','3×4＝12升。','流量已知，未知变总量'],
  [{kind:'divide',total:20,units:4,per:5,amountUnit:'页',unit:'分钟',context:'打印机'},'打印机4分钟打20页，逐页分给4分钟，求每分钟页数。','20÷4＝5页/分钟。','水流换打印速度'],
  [{kind:'divide',total:18,units:3,per:6,amountUnit:'升',unit:'分钟',context:'水桶'},'3分钟注水18升，逐升平分到3分钟。','18÷3＝6升/分钟。','隔日水量新实例'],
  [{kind:'compose',units:5,per:2,total:10,amountUnit:'页',unit:'分钟',context:'传输'},'每分钟传2页，给5分钟格各放2页。','5×2＝10页。','新传输情境与反向未知']
 ],
 'R02.03':[
  [{kind:'compare',a:{total:8,units:2,per:4},b:{total:9,units:3,per:3},amountUnit:'元',unit:'本',context:'笔记本'},'甲8元2本、乙9元3本；分别逐枚分到每本，选便宜的一边。','甲4元/本，乙3元/本，乙便宜。','比较对象换本且较便宜者改乙'],
  [{kind:'compare',a:{total:12,units:4,per:3},b:{total:10,units:2,per:5},amountUnit:'元',unit:'个',context:'面包'},'甲12元4个、乙10元2个，分别均分后选单价更低者。','甲3元/个，乙5元/个。','包价大小反转'],
  [{kind:'compare',a:{total:6,units:2,per:3},b:{total:8,units:4,per:2},amountUnit:'元',unit:'支',context:'铅笔'},'甲6元2支、乙8元4支，均分后选更便宜的每支。','甲3元/支，乙2元/支。','隔日乙总价更高但单价更低'],
  [{kind:'compare',a:{total:9,units:3,per:3},b:{total:8,units:2,per:4},amountUnit:'元',unit:'瓶',context:'果汁'},'甲9元3瓶、乙8元2瓶，均分并选每瓶更便宜的。','甲3元/瓶，乙4元/瓶。','新果汁包装']
 ],
 'R02.04':[
  [{kind:'convert',count:2,factor:60,from:'小时',to:'分钟',direction:'forward',context:'时钟'},'每1小时换成60分钟，逐张换2张小时卡，读出分钟总数。','2小时＝120分钟。','长度单位换时间单位'],
  [{kind:'convert',count:3,factor:100,from:'米',to:'厘米',direction:'reverse',context:'卷尺'},'已有300厘米，逐组捆100厘米换成1米，读出米数。','300厘米＝3米。','从小单位反向换大单位'],
  [{kind:'convert',count:4,factor:60,from:'小时',to:'分钟',direction:'reverse',context:'日程'},'240分钟每60分钟换一张小时卡，读出小时数。','240分钟＝4小时。','隔日时间反向换算'],
  [{kind:'convert',count:5,factor:100,from:'米',to:'厘米',direction:'forward',context:'绳长'},'每米100厘米，逐张换5张米卡的厘米数。','5米＝500厘米。','五米新实例']
 ],
 'R02.05':[
  [{kind:'compose',units:3,per:4,total:12,amountUnit:'千米',unit:'小时',context:'步行'},'每小时走4千米，给3个一小时格各添4千米，求路程。','4×3＝12千米。','已知速度与时间反求路程'],
  [{kind:'divide',total:18,units:3,per:6,amountUnit:'千米',unit:'小时',context:'骑行'},'骑行3小时走18千米，逐千米分到小时格求速度。','18÷3＝6千米/小时。','交通方式变骑行'],
  [{kind:'compose',units:4,per:5,total:20,amountUnit:'千米',unit:'小时',context:'跑步'},'每小时5千米，给4个一小时格各放5千米求总路程。','5×4＝20千米。','隔日速度已知求路程'],
  [{kind:'divide',total:12,units:4,per:3,amountUnit:'千米',unit:'小时',context:'徒步'},'徒步4小时走12千米，逐千米分到4个小时格。','12÷4＝3千米/小时。','新时长与徒步']
 ]
};
const rateStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(RATE_CASES)){
 if(cases.length!==4)throw Error('Four R02 cases required: '+skillId);rateStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];rateStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:18,mode:'rateLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先统一单位，再把量逐个分给每一格；若已知每格的量就逐格合成。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={RATE_CASES};

'use strict';
function rateState(task){return draft.work??(draft.work={bins:Array(task.units||0).fill(0),a:Array(task.a?.units||0).fill(0),b:Array(task.b?.units||0).fill(0),log:[],choice:'',cards:0,moves:0})}
function ratePieces(n){return `<span class="rate-pieces" role="img" aria-label="${n}个单位量">${Array.from({length:n},()=>'<i aria-hidden="true"></i>').join('')}</span>`}
function rateBoxes(task,w,side){const bins=side?w[side]:w.bins,params=side?task[side]:task,used=bins.reduce((a,b)=>a+b,0),label=side?(side==='a'?'甲':'乙'):task.context;return `<section class="rate-pack"><h3>${label} · ${params.total} ${esc(task.amountUnit)} / ${params.units} ${esc(task.unit)}</h3><p>待分配 ${params.total-used} ${esc(task.amountUnit)}；每格依次代表1 ${esc(task.unit)}。</p><div class="rate-bins">${bins.map((n,i)=>`<div class="rate-bin"><b>第${i+1}${esc(task.unit)}：${n}${esc(task.amountUnit)}</b>${ratePieces(n)}<button data-action="rateMove" data-side="${side||'main'}" data-index="${i}" ${used>=params.total?'disabled':''}>＋ 放1${esc(task.amountUnit)}</button></div>`).join('')}</div></section>`}
function rateBoard(task){const w=rateState(task);
 if(task.kind==='convert'){const forward=task.direction==='forward',from=forward?task.from:task.to,to=forward?task.to:task.from;return `<div class="board rate-board"><h3>${esc(task.context)} · 每1${esc(task.from)}＝${task.factor}${esc(task.to)}</h3><p>待换 ${forward?task.count+' '+task.from:task.count*task.factor+' '+task.to}。每点击一次，${forward?'添一张'+task.factor+task.to+'卡':'把'+task.factor+task.to+'捆成一张'+task.from+'卡'}。</p><div class="rate-cards" role="img" aria-label="已换${w.cards}张单位卡">${Array.from({length:w.cards},()=>`<span>${forward?task.factor+task.to:'1'+task.from}</span>`).join('')}</div><p>当前已换 ${w.cards} 张；对应 ${forward?w.cards*task.factor+' '+to:w.cards+' '+to}。</p><div class="work-buttons"><button data-action="rateCard" data-delta="1" ${w.cards>=task.count+2?'disabled':''}>＋ 换一张</button><button data-action="rateCard" data-delta="-1" ${!w.cards?'disabled':''}>↩ 撤回一张</button></div></div>`}
 return `<div class="board rate-board">${task.kind==='compare'?`<h3>${esc(task.context)} · 同单位比较</h3><div class="rate-two">${rateBoxes(task,w,'a')}${rateBoxes(task,w,'b')}</div><p>每${esc(task.unit)}单价更低的是：</p>${choiceButtons(task,[['a','甲较低'],['b','乙较低'],['equal','单价相同']],'rateChoice')}`:rateBoxes(task,w,null)}<div class="work-buttons"><button data-action="rateUndo" ${!w.log.length?'disabled':''}>↩ 撤回最后一枚</button></div>${task.kind==='compose'?`<p class="tiny-note">已知每${esc(task.unit)} ${task.per} ${esc(task.amountUnit)}；要对每一个单位都添相同数量，再合成总量。</p>`:''}</div>`;
}
function rateGrade(task){const w=rateState(task);let ok=false,incomplete=w.moves===0;
 if(task.kind==='convert')ok=w.cards===task.count;
 if(['divide','compose'].includes(task.kind))ok=w.bins.length===task.units&&w.bins.every(n=>n===task.per)&&w.bins.reduce((a,b)=>a+b,0)===task.total;
 if(task.kind==='compare'){const each=(side,params)=>w[side].length===params.units&&w[side].every(n=>n===params.per)&&w[side].reduce((a,b)=>a+b,0)===params.total;ok=each('a',task.a)&&each('b',task.b)&&w.choice===(task.a.per<task.b.per?'a':task.a.per>task.b.per?'b':'equal');incomplete=w.log.length===0||!w.choice}
 return {ok,incomplete,reason:'检查每一个相同单位格分到的数量；比较前先统一到每一个，换算前先核对单位卡代表多少。'};
}
function rateAct(action,data,task){const w=rateState(task);let changed=false;
 if(action==='rateMove'&&['divide','compose','compare'].includes(task.kind)){
  const side=data.side==='main'?'bins':data.side,params=side==='bins'?task:task[side],i=Number(data.index),bins=w[side];
  if(params&&bins&&Number.isInteger(i)&&i>=0&&i<params.units&&bins.reduce((a,b)=>a+b,0)<params.total){bins[i]++;w.log.push([side,i]);changed=true}
 }
 if(action==='rateUndo'&&w.log.length){const [side,i]=w.log.pop();w[side][i]--;changed=true}
 if(action==='rateChoice'&&task.kind==='compare'&&['a','b','equal'].includes(data.value)){w.choice=data.value;changed=true}
 if(action==='rateCard'&&task.kind==='convert'&&[-1,1].includes(Number(data.delta))&&w.cards+Number(data.delta)>=0&&w.cards+Number(data.delta)<=task.count+2){w.cards+=Number(data.delta);changed=true}
 if(changed)w.moves++;return changed;
}
function rateSpeech(task){const w=rateState(task);return task.kind==='convert'?`已换${w.cards}张，每张代表${task.direction==='forward'?task.factor+task.to:'1'+task.from}。`:task.kind==='compare'?`甲各格为${w.a.join('、')}，乙各格为${w.b.join('、')}。`:`各个${task.unit}格分别是${w.bins.join('、')}${task.amountUnit}。`}
function ratePage(){const task=RATE_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return `<div class="panel">操作任务不存在。</div>`;return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 单位率操作</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${rateBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>先统一每一单位</h3><p class="muted">逐个分配量，或把相同的单位卡换出。相同单位格应有相同量；比较价格先统一到每件。系统核对状态与理由卡，口述和设备仍待验。</p></section></aside></div>`}

'use strict';
// A time slot is one equal interval. Segmented journeys use authored lengths;
// joint work requires both workers' contributions in the same interval.
const JOURNEY_TASKS={
 'R03.01':{kind:'equal',per:2,count:3,interval:'10分钟',unit:'千米',context:'骑车',prompt:'每10分钟走2千米。逐段摆出30分钟的路程，看看一共走多远。',explain:'三个相同的10分钟，每段2千米，共6千米。',reason:{prompt:'为什么要摆三段？',options:['30分钟有三个10分钟，每段同速走2千米','30分钟就是30千米','只要知道10分钟就不用看总时间'],answer:0}},
 'R03.02':{kind:'inverse',per:3,count:4,interval:'小时',unit:'千米',context:'徒步',prompt:'每小时走3千米，目标是12千米。逐小时摆路程，到达目标时数用了几小时。',explain:'3、6、9、12千米，走4个一小时，合计4小时。',reason:{prompt:'怎样从路程找时间？',options:['每添一个一小时的3千米，数到12千米用了4格','把12千米说成12小时','只看每小时3千米就说用了3小时'],answer:0}},
 'R03.03':{kind:'segment',segments:[2,3,4],interval:'段',unit:'千米',context:'公园路线',prompt:'路线分三段，依次是2、3、4千米。把每段放到路线上，读出累计路程。',explain:'各段不重叠，累计2、5、9千米。',reason:{prompt:'为什么能把三段相加？',options:['三段首尾相接、不重叠，走完整条路就是2＋3＋4','只算最长的一段','把三段的时间相加就是路程'],answer:0}},
 'R03.04':{kind:'remaining',segments:[2,3],whole:12,interval:'段',unit:'千米',context:'远足',prompt:'全程12千米，先走2千米再走3千米。把走过的路放进全程条，再选剩下多少千米。',explain:'已走2＋3＝5千米，剩12－5＝7千米。',reason:{prompt:'剩余路程怎么得到？',options:['从同一全程12千米中扣除已走的5千米','把12与5相加','把第二段3千米当成全部已走'],answer:0}},
 'R03.05':{kind:'joint',a:3,b:2,count:2,interval:'分钟',unit:'个',context:'两人装盒',prompt:'甲每分钟装3个，乙每分钟装2个。每一分钟分别给两人摆出成果，做2分钟后看总共多少个。',explain:'同一分钟甲乙合做5个，两分钟共10个。',reason:{prompt:'为什么两人的产量可以合并？',options:['同一分钟两人同时工作，先合并每分钟产量，再数两分钟','把两人的工作分钟也加成四分钟','只数甲的产量就代表两人'],answer:0}}
};
for(const [skillId,t] of Object.entries(JOURNEY_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:19,mode:'journeyLab',phase:'练',hint:'先找每个时间格或路线段代表什么，再逐格摆出来。'});
if(typeof module!=='undefined')module.exports={JOURNEY_TASKS};

'use strict';
// Each item is a distinct authored situation: transfer, two independent
// instances, and a delayed new instance. No random substitution is used.
const JOURNEY_CASES={
 'R03.01':[
  [{kind:'equal',per:1,count:4,interval:'10分钟',unit:'千米',context:'轮滑'},'每10分钟滑1千米。逐段摆出40分钟的路程。','四个10分钟，每段1千米，共4千米。','骑车改轮滑，路程率和时间段数均变化'],
  [{kind:'equal',per:4,count:3,interval:'小时',unit:'千米',context:'步行'},'每小时走4千米，连续走3小时。逐小时摆出路程。','4＋4＋4＝12千米。','无提示：分钟段换为整小时'],
  [{kind:'inverse',per:2,count:5,interval:'分钟',unit:'页',context:'打印机'},'每分钟打2页。逐分钟摆到10页，数出用时。','到10页需5个一分钟格。','备用：由总量反求相同时间段数'],
  [{kind:'equal',per:5,count:2,interval:'小时',unit:'千米',context:'晨跑'},'每小时跑5千米，逐小时摆出2小时的路程。','两小时共10千米。','隔日：新运动与新路程']
 ],
 'R03.02':[
  [{kind:'equal',per:6,count:3,interval:'分钟',unit:'张',context:'贴标签'},'每分钟贴6张。逐分钟摆3分钟的总数。','6×3＝18张。','由求时间换成给定时间求总量'],
  [{kind:'inverse',per:4,count:3,interval:'小时',unit:'千米',context:'徒步'},'每小时4千米，逐小时摆到12千米，数出时间。','12÷4＝3小时。','无提示：速度变化'],
  [{kind:'inverse',per:5,count:4,interval:'分钟',unit:'页',context:'扫描'},'每分钟扫5页，逐分钟摆到20页。','四分钟共20页。','备用：路程换成文件页数'],
  [{kind:'equal',per:7,count:2,interval:'小时',unit:'千米',context:'骑行'},'每小时骑7千米，摆出两小时的路程。','7×2＝14千米。','隔日：未知量从时间换为路程']
 ],
 'R03.03':[
  [{kind:'segment',segments:[3,1,4],interval:'段',unit:'千米',context:'三段步道'},'依次走3、1、4千米。逐段放进路线上，读累计路程。','3、4、8千米。','中段较短，检查是否漏加'],
  [{kind:'segment',segments:[2,5],interval:'段',unit:'千米',context:'河边骑行'},'第一段2千米，第二段5千米。摆出两段并读全程。','2＋5＝7千米。','无提示：路程段数改为两段'],
  [{kind:'segment',segments:[4,3,2],interval:'段',unit:'千米',context:'郊游'},'三段各4、3、2千米，逐段放在路线条上。','累计4、7、9千米。','备用：三段顺序与累计变化'],
  [{kind:'segment',segments:[1,6,2],interval:'段',unit:'千米',context:'湖边环线'},'从入口依次走1、6、2千米。摆出路段读全程。','1＋6＋2＝9千米。','隔日：新路径，非等长路段']
 ],
 'R03.04':[
  [{kind:'remaining',segments:[4,3],whole:15,interval:'段',unit:'千米',context:'登山'},'全程15千米，已走4千米又走3千米，摆进全程条并选剩余。','15－(4＋3)＝8千米。','全程与已走段同时改变'],
  [{kind:'remaining',segments:[3,2],whole:11,interval:'段',unit:'千米',context:'骑行计划'},'全程11千米，先走3再走2。摆出已走路程并选剩余。','已走5，剩6千米。','无提示：新全程与剩余'],
  [{kind:'remaining',segments:[1,5],whole:14,interval:'段',unit:'千米',context:'森林路线'},'全程14千米，前两段走1和5千米。摆进全程条并选剩余。','14－6＝8千米。','备用：第一段较短'],
  [{kind:'remaining',segments:[6,2],whole:17,interval:'段',unit:'千米',context:'河堤步道'},'全程17千米，已经走6千米和2千米，摆已走并选剩余。','17－8＝9千米。','隔日：新全程与分段']
 ],
 'R03.05':[
  [{kind:'joint',a:2,b:4,count:3,interval:'分钟',unit:'个',context:'两人叠纸盒'},'甲每分钟2个，乙每分钟4个，同时做3分钟。逐分钟分别摆出两人的成果。','每分钟合做6个，三分钟共18个。','两人速度交换且时间延长'],
  [{kind:'joint',a:4,b:1,count:2,interval:'分钟',unit:'张',context:'两人剪卡'},'甲每分钟剪4张，乙每分钟剪1张，同时剪2分钟。逐分钟给两人分别摆卡。','每分钟合剪5张，两分钟共10张。','无提示：成果单位从盒子换卡片'],
  [{kind:'joint',a:3,b:3,count:3,interval:'分钟',unit:'枚',context:'两人分棋子'},'两人每分钟各分3枚，同时做3分钟。每分钟各自摆出产量。','每分钟两人共6枚，三分钟18枚。','备用：两人速度相同'],
  [{kind:'joint',a:1,b:5,count:2,interval:'分钟',unit:'个',context:'两人装书签'},'甲每分钟装1个，乙每分钟装5个，同时做2分钟。逐分钟分别摆出成果。','每分钟6个，两分钟12个。','隔日：两人贡献悬殊，仍按相同时间合并']
 ]
};
const journeyStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(JOURNEY_CASES)){
 if(cases.length!==4)throw Error('Four R03 cases required: '+skillId);journeyStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];journeyStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:20,mode:'journeyLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先看相同时间格或各路段代表什么，再逐格累计。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={JOURNEY_CASES};

'use strict';
function journeyState(task){const w=draft.work??(draft.work={steps:[],rounds:[],log:[],choice:'',moves:0});w.elapsed??=0;w.elapsedSet??=false;w.whole??=0;w.wholeSet??=false;return w}
function journeyEligible(task,i,side){return i>=(task.starts?.[side]||0)}
function journeyRoundComplete(task,r,i){return ['a','b'].every(side=>journeyEligible(task,i,side)?r[side]:!r[side])}
function journeyTotal(task,w){return task.kind==='joint'?w.rounds.reduce((n,r)=>n+(r.a?task.a:0)+(r.b?task.b:0),0):w.steps.reduce((n,v)=>n+v,0)}
function journeyLimit(task){return task.kind==='equal'?task.count:task.kind==='inverse'?task.count+2:task.kind==='joint'?task.count:task.segments.length}
function journeyDots(n){return `<span class="journey-dots" role="img" aria-label="${n}个单位量">${Array.from({length:n},()=>'<i aria-hidden="true"></i>').join('')}</span>`}
function journeyInput(action,label,value){return `<section><b>${label}：${value}</b><div class="work-buttons">${[-10,-1,0,1,5,10].map(d=>`<button data-action="${action}" data-delta="${d}">${d===0?'填0':d>0?'＋'+d:d}</button>`).join('')}</div></section>`}
function journeyBoard(task){const w=journeyState(task),n=task.kind==='joint'?w.rounds.length:w.steps.length,limit=journeyLimit(task),total=journeyTotal(task,w);
 const slots=Array.from({length:limit},(_,i)=>{const active=i<n,round=w.rounds[i],part=active?(task.kind==='joint'?(round.a?task.a:0)+(round.b?task.b:0):w.steps[i]):0;return `<div class="journey-slot ${active?'filled':''}"><b>${['segment','remaining'].includes(task.kind)?'第'+(i+1)+'时段':'第'+(i+1)+task.interval}</b>${task.kind==='joint'?`<span>甲：${!journeyEligible(task,i,'a')?'未开工':round?.a?task.a:'待摆'}</span><span>乙：${!journeyEligible(task,i,'b')?'未开工':round?.b?task.b:'待摆'}</span>`:''}${journeyDots(part)}<small>${active?part+' '+task.unit:'待摆'}</small></div>`}).join('');
 let actions='';
 if(task.kind==='joint'){
  const last=w.rounds.at(-1),needsNew=!last||journeyRoundComplete(task,last,n-1),i=needsNew?n:n-1;
  actions=['a','b'].map(side=>`<button data-action="journeyWorker" data-side="${side}" ${i>=limit||!journeyEligible(task,i,side)||!needsNew&&last[side]?'disabled':''}>${side==='a'?'甲':'乙'}做 ${task[side]} ${esc(task.unit)}</button>`).join('');
 }else actions=`<button data-action="journeyStep" ${n>=limit?'disabled':''}>${['segment','remaining'].includes(task.kind)?'放下一段 '+(task.segments[n]??''):'走下一'+task.interval+' '+task.per} ${esc(task.unit)}</button>`;
 const choices=task.kind==='remaining'&&!task.unknownWhole?`<p>剩多少？</p>${choiceButtons(task,[...new Set([task.whole-task.segments.reduce((a,b)=>a+b,0),task.segments.reduce((a,b)=>a+b,0),task.whole])].map(v=>[String(v),v+' '+task.unit]),'journeyChoice')}`:'';
 const route=task.unknownWhole?`${journeyInput('journeyWhole','我拼出的全程（'+task.unit+'）',w.whole)}<div class="journey-route-track" style="--route-cols:${Math.max(1,Math.min(12,w.whole))}" role="img" aria-label="全程候选${w.whole}格，已走${total}格，剩下${Math.max(0,w.whole-total)}格">${Array.from({length:w.whole},(_,i)=>`<i data-object-id="J${i}" class="${i<total?'walked':''}"></i>`).join('')}</div><p>已知剩余 ${task.givenRemaining} ${esc(task.unit)}。核对末段是否正好放入外框。</p>`:'';
 return `<div class="board journey-board"><h3>${esc(task.context)} · ${task.kind==='joint'?task.starts?'两人起步时间不同':'同一分钟，两人分别做':task.kind==='remaining'?task.unknownWhole?'用已走和剩余拼全程':'全程 '+task.whole+' '+task.unit:task.kind==='segment'?'每个时段都要记录':'每'+task.interval+' '+task.per+' '+task.unit}</h3><div class="journey-slots">${slots}</div><p>已摆 ${total} ${esc(task.unit)}，记录 ${n} 个${['segment','remaining'].includes(task.kind)?'时段':task.interval}。</p>${route}<div class="work-buttons">${actions}<button data-action="journeyUndo" ${!w.steps.length&&!w.rounds.length?'disabled':''}>↩ 撤回一步</button></div>${task.elapsedPer?journeyInput('journeyElapsed','我的用时（分钟）',w.elapsed):''}${choices}</div>`;
}
function journeyGrade(task){const w=journeyState(task),total=journeyTotal(task,w),n=task.kind==='joint'?w.rounds.length:w.steps.length;let ok=false,incomplete=n===0;
 if(['equal','inverse'].includes(task.kind))ok=n===task.count&&w.steps.every(v=>v===task.per)&&total===task.per*task.count&&(!task.elapsedPer||w.elapsedSet&&w.elapsed===n*task.elapsedPer);
 if(task.kind==='segment')ok=n===task.segments.length&&w.steps.every((v,i)=>v===task.segments[i])&&total===task.segments.reduce((a,b)=>a+b,0);
 if(task.kind==='remaining'){
  ok=n===task.segments.length&&w.steps.every((v,i)=>v===task.segments[i])&&(task.unknownWhole?w.wholeSet&&w.whole===task.whole&&w.whole-total===task.givenRemaining:w.choice===String(task.whole-total));
  incomplete=n===0||(task.unknownWhole?!w.wholeSet:!w.choice);
 }
 if(task.kind==='joint'){
  const expected=['a','b'].reduce((sum,side)=>sum+task[side]*Math.max(0,task.count-(task.starts?.[side]||0)),0);
  ok=n===task.count&&w.rounds.every((r,i)=>journeyRoundComplete(task,r,i))&&total===expected;
  incomplete=n===0||w.rounds.some((r,i)=>!journeyRoundComplete(task,r,i));
 }
 return {ok,incomplete,reason:'逐时段核对量和时间；停留也要记录。两人只在各自实际开工的时间格内计成果。'};
}
function journeyAct(action,data,task){const w=journeyState(task),n=w.steps.length,limit=journeyLimit(task);let changed=false;
 if(action==='journeyStep'&&task.kind!=='joint'&&n<limit){w.steps.push(['segment','remaining'].includes(task.kind)?task.segments[n]:task.per);changed=true}
 if(action==='journeyWorker'&&task.kind==='joint'&&['a','b'].includes(data.side)){
  let round=w.rounds.at(-1),i=w.rounds.length-1;const needsNew=!round||journeyRoundComplete(task,round,i);if(needsNew)i++;
  if(i<limit&&journeyEligible(task,i,data.side)&&(needsNew||!round[data.side])){
   if(needsNew){round={a:false,b:false};w.rounds.push(round)}round[data.side]=true;w.log.push([i,data.side]);changed=true;
  }
 }
 if(action==='journeyUndo'){
  if(task.kind==='joint'){const last=w.log.pop();if(last){const [i,side]=Array.isArray(last)?last:[w.rounds.length-1,last],r=w.rounds[i];if(r){r[side]=false;if(!r.a&&!r.b)w.rounds.pop();changed=true}}}
  else if(n){w.steps.pop();w.choice='';changed=true}
 }
 if(action==='journeyChoice'&&task.kind==='remaining'&&!task.unknownWhole&&/^\d+$/.test(data.value||'')){w.choice=data.value;changed=true}
 if(action==='journeyElapsed'&&task.elapsedPer||action==='journeyWhole'&&task.unknownWhole){
  const key=action==='journeyElapsed'?'elapsed':'whole',d=Number(data.delta),value=w[key]+d;
  if([-10,-1,0,1,5,10].includes(d)&&value>=0&&value<=100){w[key]=value;w[key+'Set']=true;changed=true}
 }
 if(changed)w.moves++;return changed;
}
function journeySpeech(task){const w=journeyState(task);return task.kind==='joint'?w.rounds.map((r,i)=>`第${i+1}分钟，甲${r.a?task.a:0}个、乙${r.b?task.b:0}个`).join('；'):`已记录${w.steps.length}个时间格，各格${w.steps.join('、')||'尚未摆出'}${task.unit}。`+(task.unknownWhole?`我的全程候选${w.whole}${task.unit}。`:'')+(task.elapsedPer?`我的用时${w.elapsed}分钟。`:'')}
function journeyPage(){const task=JOURNEY_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)}</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 返回</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题 →':'检查操作与理由 ✓'}</button></div>${journeyBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack">${stageLinks(task.skillId)}</aside></div>`}

'use strict';
const SCALE_TASKS={
 'R04.01':{kind:'pair',red:2,blue:3,factor:3,context:'花束配色',prompt:'每束红2朵、蓝3朵。把两色一起复制到3束，比较红蓝关系；也可以试单独复制一色后撤回。',explain:'红6蓝9，两色都乘3，仍是2:3。',reason:{prompt:'为什么新旧花束的红蓝关系一样？',options:['红与蓝都复制3份','只复制红花也保持原关系','看红蓝合计15就能判断关系'],answer:0}},
 'R04.02':{kind:'length',short:2,long:4,factor:3,context:'长方形边框',prompt:'短边2格、长边4格。把每条边都放大到原来的3倍，观察新边长。',explain:'短边6格、长边12格；两条长度都乘3。',reason:{prompt:'哪种操作保留原形状？',options:['短边与长边同时乘3','只把长边乘3','把两边都加3就一定同形'],answer:0}},
 'R04.03':{kind:'area',rows:2,cols:3,factor:2,context:'方格地毯',prompt:'原来2行3列。将行数和列数分别放大2倍，实际铺出新方格，比较面积。',explain:'新图4行6列共24格；原图6格，面积变4倍。',reason:{prompt:'边长都变2倍，为什么面积变4倍？',options:['行数乘2且列数乘2，格数乘2×2','只看一条边就说面积2倍','把行列数相加就得面积'],answer:0}},
 'R04.04':{kind:'map',per:5,count:3,from:'1厘米地图线',to:'千米实路',context:'地图距离',prompt:'地图每1厘米代表实际5千米。逐张放3张一厘米卡，读出实际路程。',explain:'三张卡各代表5千米，合计15千米。',reason:{prompt:'为什么3厘米对应15千米？',options:['每1厘米都是5千米，三份相加','地图有3厘米，实际就只有3千米','只取第一厘米的5千米'],answer:0}},
 'R04.05':{kind:'change',start:100,add:20,remove:24,choices:['96','100','76'],correctChoice:'96',context:'连续价格变化',prompt:'价格从100元先涨20%。逐元添到120；再按新价120元降20%，逐元拿走24，选最后价格。',explain:'原价100涨20到120，新价120的20%是24，最后96元。',reason:{prompt:'为什么没有回到100元？',options:['第二次20%以120为基准，减少24元','两次20%一定互相抵消','第二次仍按原价100减少20元'],answer:0}}
};
for(const [skillId,t] of Object.entries(SCALE_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:21,mode:'scaleLab',phase:'练',hint:'找准单位份、两条边或新的百分比基准，再动手改变模型。'});
if(typeof module!=='undefined')module.exports={SCALE_TASKS};

'use strict';
const SCALE_CASES={
 'R04.01':[
  [{kind:'pair',red:3,blue:1,factor:2,context:'舞台灯'},'每组红3盏、蓝1盏，同时复制成两组。','红6蓝2，仍为3:1。','花束换灯光，份数改二'],
  [{kind:'pair',red:1,blue:2,factor:4,context:'彩旗'},'每组红1蓝2，做四组相同比例的彩旗。','红4蓝8，比仍1:2。','无提示：一色只有一面'],
  [{kind:'pair',red:2,blue:5,factor:2,context:'棋子袋'},'原来每袋红2蓝5，做两袋相同配方。','红4蓝10。','隔日：两色总数不同'],
  [{kind:'pair',red:4,blue:2,factor:3,context:'手工贴纸'},'每份红4蓝2，复制成三份同样配方。','红12蓝6。','备用：大份和较多红色']
 ],
 'R04.02':[
  [{kind:'length',short:3,long:5,factor:2,context:'模型边框'},'短边3格、长边5格。两边分别放大2倍。','短边6、长边10，均是原长2倍。','原边不成整倍数，保持同形'],
  [{kind:'length',short:2,long:5,factor:4,context:'照片外框'},'短边2格、长边5格。把两边都变成原来的4倍。','新边长8格与20格。','无提示：放大倍数改四'],
  [{kind:'length',short:4,long:6,factor:2,context:'海报'},'短边4格、长边6格。两边都按2倍画新海报。','新边8格和12格。','隔日：原边长均为偶数'],
  [{kind:'length',short:1,long:3,factor:3,context:'长方形卡'},'短边1格、长边3格，都放大3倍。','新边长3格和9格。','备用：短边为一单位']
 ],
 'R04.03':[
  [{kind:'area',rows:2,cols:2,factor:3,context:'方形花坛'},'原图2行2列，分别把行、列扩成3倍，观察新面积。','新图6行6列共36格，是原4格的9倍。','长方形换正方形，线性三倍'],
  [{kind:'area',rows:1,cols:4,factor:2,context:'地砖条'},'原图1行4列，分别将行列变2倍，数新格数。','2行8列共16格，原4格，面积4倍。','无提示：原图仅一行'],
  [{kind:'area',rows:3,cols:2,factor:2,context:'纸片'},'原来3行2列，两条方向都翻倍。','6行4列共24格；原6格，面积四倍。','隔日：原行列交换'],
  [{kind:'area',rows:2,cols:3,factor:3,context:'长方形地毯'},'2行3列的图，行列分别变3倍。','新图6行9列共54格，原6格的9倍。','备用：两条方向都三倍']
 ],
 'R04.04':[
  [{kind:'map',per:3,count:2,from:'2杯面粉卡',to:'个蛋糕',context:'蛋糕配方'},'每2杯面粉可做3个蛋糕。逐张放两张2杯卡，找4杯做几个。','两份配方可做6个蛋糕。','地图换配方，输入单位由厘米换杯'],
  [{kind:'map',per:4,count:3,from:'1厘米地图线',to:'千米实路',context:'徒步地图'},'每1厘米代表4千米，摆3张地图线卡。','实际12千米。','无提示：每厘米代表路程改4'],
  [{kind:'map',per:2,count:4,from:'1袋种子',to:'盆花',context:'园艺配方'},'每袋种子能种2盆花，逐张放四袋卡。','四袋种8盆花。','隔日：比例单位换花盆'],
  [{kind:'map',per:6,count:2,from:'1厘米地图线',to:'千米实路',context:'山路地图'},'每1厘米代表6千米，放2厘米地图线卡。','实际12千米。','备用：地图线长度缩成两厘米']
 ],
 'R04.05':[
  [{kind:'change',start:50,add:10,remove:12,choices:['48','50','40'],correctChoice:'48',context:'玩具价格'},'从50元先涨20%，逐元添10到60；再按60元降20%，逐元拿走12。','50→60→48元，第二次20%以60为基准。','原价换50，增长和降低仍同为20%'],
  [{kind:'change',start:200,add:20,remove:22,choices:['198','200','180'],correctChoice:'198',context:'储蓄积分'},'积分200先涨10%，再按新量降10%。先添20到220，再拿走22。','最后198点。','无提示：基数200，百分点10'],
  [{kind:'change',start:100,add:30,remove:39,choices:['91','100','70'],correctChoice:'91',context:'游戏分数'},'分数100先涨30%到130，再按130降30%，逐个拿走39。','最后91分。','隔日：百分比改30'],
  [{kind:'change',start:80,add:20,remove:25,choices:['75','80','55'],correctChoice:'75',context:'图书数量'},'图书80本先增25%到100本，再按100本减25%，逐本拿走25。','最后75本。','备用：基数80，百分比改25']
 ]
};
const scaleStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(SCALE_CASES)){
 if(cases.length!==4)throw Error('Four R04 cases required: '+skillId);scaleStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];scaleStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:22,mode:'scaleLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先认清单位份、对应边或变化后的新基准。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={SCALE_CASES};

'use strict';
function scaleState(task){if(task.kind==='change')return percentState(task);const w=draft.work??(draft.work={red:1,blue:1,short:1,long:1,rows:1,cols:1,cards:0,moves:0});w.log??=[];w.choice??='';return w}
function scaleDots(n,color){return `<span class="scale-dots" role="img" aria-label="${color} ${n}个">${Array.from({length:n},()=>`<i class="${color}" aria-hidden="true"></i>`).join('')}</span>`}
function scaleTarget(task,side){return task.targetFactors?.[side]??task.axisFactors?.[side]??task.factor}
function scaleLength(task,w,side){return task.direction==='shrink'?task[side]/w[side]:task[side]*w[side]}
function scaleVerdict(task){return task.targetFactors||task.axisFactors?`<p>${task.kind==='area'?'现在的形状与原图相似吗？':'现在保持原配比吗？'}</p>${choiceButtons(task,[['same','保持相同'],['changed','已经改变']],'scaleChoice')}`:''}
function scaleLengthPicture(task,w,side){const length=scaleLength(task,w,side);return `<div class="scale-ruler-strip" style="--ruler-count:${length}" role="img" aria-label="${side==='short'?'短':'长'}边当前${length}格">${Array.from({length:length},()=>'<i></i>').join('')}</div>`}
function scaleBoard(task){if(task.kind==='change')return percentBoard(task);const w=scaleState(task),limit=Math.max(task.factor||1,...Object.values(task.targetFactors||{}),...Object.values(task.axisFactors||{}));
 if(task.kind==='pair')return `<div class="board scale-board"><h3>${esc(task.context)} · 原来红${task.red}蓝${task.blue}</h3><div class="scale-pair"><section><b>红 ${w.red*task.red} 朵 · ${w.red}份</b>${scaleDots(w.red*task.red,'red')}</section><section><b>蓝 ${w.blue*task.blue} 朵 · ${w.blue}份</b>${scaleDots(w.blue*task.blue,'blue')}</section></div><div class="work-buttons">${['both','red','blue'].map(side=>`<button data-action="scaleCopy" data-side="${side}" ${(side==='both'?w.red>=limit||w.blue>=limit:w[side]>=limit)?'disabled':''}>${side==='both'?'同时复制红蓝':side==='red'?'只复制红':'只复制蓝'}</button>`).join('')}<button data-action="scaleUndo" ${!w.log.length?'disabled':''}>↩ 撤回</button></div>${scaleVerdict(task)}</div>`;
 if(task.kind==='length')return `<div class="board scale-board"><h3>${esc(task.context)} · ${task.direction==='shrink'?'缩成原来的一半':'长度按相同倍数改变'}</h3><div class="scale-pair">${['short','long'].map(side=>`<section><b>${side==='short'?'短':'长'}边 ${scaleLength(task,w,side)} 格（原来${task[side]}格）</b>${scaleLengthPicture(task,w,side)}</section>`).join('')}</div><div class="work-buttons"><button data-action="scaleBoth" ${w.short>=limit||w.long>=limit?'disabled':''}>${task.direction==='shrink'?'两边各缩为一半':'两边各放大一份'}</button>${['short','long'].map(side=>`<button data-action="scaleSide" data-side="${side}" ${w[side]>=limit?'disabled':''}>只${task.direction==='shrink'?'缩小':'放大'}${side==='short'?'短':'长'}边</button>`).join('')}<button data-action="scaleUndo" ${!w.log.length?'disabled':''}>↩ 撤回</button></div></div>`;
 if(task.kind==='area'){
  const rows=task.rows*w.rows,cols=task.cols*w.cols;
  return `<div class="board scale-board"><h3>${esc(task.context)} · 原图 ${task.rows}行×${task.cols}列</h3><div class="scale-area" style="--scale-cols:${cols}" role="img" aria-label="现在${rows}行、${cols}列，共${rows*cols}格">${Array.from({length:rows*cols},()=>'<i aria-hidden="true"></i>').join('')}</div><p>现在 ${rows}行×${cols}列${assessmentFormal(task)?'':'，共'+rows*cols+'格'}。</p><div class="work-buttons">${['rows','cols'].map(side=>`<button data-action="scaleAxis" data-side="${side}" ${w[side]>=limit?'disabled':''}>${side==='rows'?'行':'列'}数添一份</button>`).join('')}<button data-action="scaleUndo" ${!w.log.length?'disabled':''}>↩ 撤回</button></div>${scaleVerdict(task)}</div>`;
 }
 const input=task.inputUnitSize||1;
 return `<div class="board scale-board"><h3>${esc(task.context)} · 每${input}${esc(task.from)}对应${task.per}${esc(task.to)}</h3><div class="scale-cards">${Array.from({length:w.cards},(_,i)=>`<div><b>第${i+1}份</b><section aria-label="输入${input}${esc(task.from)}">${scaleDots(input,'input')}<span>${input}${esc(task.from)}</span></section><span aria-hidden="true">→</span><section aria-label="输出${task.per}${esc(task.to)}">${scaleDots(task.per,'map')}<span>${task.per}${esc(task.to)}</span></section></div>`).join('')}</div><p>已摆 ${w.cards*input}${esc(task.from)}。</p><div class="work-buttons"><button data-action="scaleCard" data-delta="1" ${w.cards>=task.count+2?'disabled':''}>放一组对应量</button><button data-action="scaleCard" data-delta="-1" ${!w.cards?'disabled':''}>↩ 同组收回</button></div></div>`;
}
function scaleGrade(task){if(task.kind==='change')return percentGrade(task);const w=scaleState(task);let ok=false;
 if(task.kind==='pair')ok=w.red===scaleTarget(task,'red')&&w.blue===scaleTarget(task,'blue')&&(!task.targetFactors||w.choice===(w.red===w.blue?'same':'changed'));
 if(task.kind==='length')ok=w.short===task.factor&&w.long===task.factor&&scaleLength(task,w,'short')/scaleLength(task,w,'long')===task.short/task.long;
 if(task.kind==='area')ok=w.rows===scaleTarget(task,'rows')&&w.cols===scaleTarget(task,'cols')&&(!task.axisFactors||w.choice===(w.rows===w.cols?'same':'changed'));
 if(task.kind==='map')ok=w.cards===task.count;
 return {ok,incomplete:w.moves===0||!!(task.targetFactors||task.axisFactors)&&!w.choice,reason:'核对各对应量的倍数。只变一边会改变比或形状；面积用实际行数乘列数。'};
}
function scaleAct(action,data,task){if(task.kind==='change')return percentAct(action,data,task);const w=scaleState(task);let changed=false,side=data.side,delta=Number(data.delta),limit=Math.max(task.factor||1,...Object.values(task.targetFactors||{}),...Object.values(task.axisFactors||{}));
 if(action==='scaleCopy'&&task.kind==='pair'&&['red','blue','both'].includes(side)){const keys=side==='both'?['red','blue']:[side];if(keys.every(k=>w[k]<limit)){for(const k of keys)w[k]++;w.log.push(keys);changed=true}}
 if(action==='scaleBoth'&&task.kind==='length'&&w.short<limit&&w.long<limit){w.short++;w.long++;w.log.push(['short','long']);changed=true}
 if(action==='scaleSide'&&task.kind==='length'&&['short','long'].includes(side)&&w[side]<limit){w[side]++;w.log.push([side]);changed=true}
 if(action==='scaleAxis'&&task.kind==='area'&&['rows','cols'].includes(side)&&w[side]<limit){w[side]++;w.log.push([side]);changed=true}
 if(action==='scaleCard'&&task.kind==='map'&&[-1,1].includes(delta)&&w.cards+delta>=0&&w.cards+delta<=task.count+2){w.cards+=delta;changed=true}
 if(action==='scaleChoice'&&(task.targetFactors||task.axisFactors)&&['same','changed'].includes(data.value)){w.choice=data.value;changed=true}
 if(action==='scaleUndo'&&w.log.length){for(const k of w.log.pop())w[k]--;changed=true}
 if(changed)w.moves++;return changed;
}
function scaleSpeech(task){if(task.kind==='change')return percentSpeech(task);const w=scaleState(task);return task.kind==='pair'?`红${w.red*task.red}朵、蓝${w.blue*task.blue}朵。`:task.kind==='length'?`短边${scaleLength(task,w,'short')}格，长边${scaleLength(task,w,'long')}格。`:task.kind==='area'?`现在${w.rows*task.rows}行、${w.cols*task.cols}列。`:`已放${w.cards}组，输入${w.cards*(task.inputUnitSize||1)}${task.from}。`}
function scalePage(){const task=SCALE_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)}</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 返回</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题 →':'检查操作与理由 ✓'}</button></div>${scaleBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack">${stageLinks(task.skillId)}</aside></div>`}

'use strict';
const EQUATION_TASKS={
 'L01.01':{kind:'equal',left:[4,3],right:[3,4],context:'两边的点盘',prompt:'左边按4和3两组，右边按3和4两组。逐组放上天平，比较两边完整总量。',explain:'左边4＋3＝7，右边3＋4＝7；等号表示两个总量相等。',reason:{prompt:'为什么这道等式成立？',options:['左右总量都为7','只有左边必须先算出结果','每边第一组要相同'],answer:0}},
 'L01.02':{kind:'unknown',known:3,total:7,context:'未知袋与砝码',prompt:'未知袋加3颗与右边7颗等重。两边各拿走3颗，再逐颗放进袋子，找到袋里的数量。',explain:'两边同拿3，右边余4，所以袋子里4颗。',reason:{prompt:'怎样确定未知袋的数量？',options:['两边各拿走3，右边余4','只从右边拿3颗','把右边7颗都放进袋子'],answer:0}},
 'L01.03':{kind:'bilateral',known:3,total:7,context:'逐颗平衡天平',prompt:'左边未知袋加3颗、右边7颗。每次分别从左、右拿走1颗，直到两边各拿走3颗；再填出袋里的数。',explain:'左右各拿3，剩未知袋＝4；只在单边拿走会暂时不平衡。',reason:{prompt:'每一步如何保持等量？',options:['左右拿走相同数量','只从有7颗的一边拿走','左边拿3，右边拿2也相等'],answer:0}},
 'L01.04':{kind:'inverse',initial:9,remain:5,context:'盒子里的玻璃珠',prompt:'原来9颗，拿走一个未知数量后还剩5颗。逐颗移到“拿走”区，数出未知数量。',explain:'9－4＝5；已拿走4颗，也可用9－5找回未知数。',reason:{prompt:'为什么未知数是4？',options:['原有9减去剩余5得到拿走4','把9和5相加','剩余5就是拿走的数'],answer:0}},
 'L01.05':{kind:'substitute',bag:4,known:3,total:7,context:'代回原天平',prompt:'已知袋里4颗。把4颗逐颗放入袋内，再摆出袋外3颗，检查左盘是否与右盘7颗一样多。',explain:'将4代回□＋3＝7，左边4＋3＝7，与右边相等。',reason:{prompt:'代回原式检验什么？',options:['替换未知袋后左右总量相等','只看袋内4颗是否等于右边7颗','把两边数全加在一起'],answer:0}}
};
for(const [skillId,t] of Object.entries(EQUATION_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:23,mode:'equationLab',phase:'练',methodSpecific:['unknown','bilateral'].includes(t.kind),hint:'先看等号两边的完整数量，再按题意同时拿走、逆向找回或代回。'});
if(typeof module!=='undefined')module.exports={EQUATION_TASKS};

'use strict';
const EQUATION_CASES={
 'L01.01':[
  [{kind:'equal',left:[5,2],right:[4,3],context:'水果盘'},'左盘按5和2两组放果子，右盘按4和3两组放；比较完整总量。','5＋2＝4＋3＝7，两侧总量相等。','换成两种不同拆分，左右第一组不相同'],
  [{kind:'equal',left:[2,4],right:[3,3],context:'积木盘'},'左边两组2和4，右边两组3和3。独立摆上两盘，看能否用等号连接。','2＋4和3＋3都为6。','无提示：含两组相同数'],
  [{kind:'equal',left:[6,1],right:[2,5],context:'游戏筹码'},'左边分成6和1，右边分成2和5；隔日重新摆盘核对。','两边各7枚，等号比较总量。','隔日：大小顺序和分组都变'],
  [{kind:'equal',left:[3,5],right:[4,4],context:'餐桌勺子'},'一侧两组3和5，另一侧两组4和4，独立摆放并核对。','两侧各8把。','备用：相等的两组放在右侧']
 ],
 'L01.02':[
  [{kind:'unknown',known:2,total:8,context:'神秘袋与棋子'},'袋子加2枚棋子与8枚等重。两边各拿走2，再逐个装出袋内数。','右侧余6，袋内是6枚。','已知量2，总量8，换棋子情境'],
  [{kind:'unknown',known:4,total:9,context:'未知盒与纽扣'},'一个未知盒加4颗纽扣等于9颗。先两边同取4，再摆出盒内颗数。','9－4＝5，盒内5颗。','无提示：已知量改4'],
  [{kind:'unknown',known:5,total:12,context:'未知罐与豆子'},'罐子加5颗豆子和12颗等重。隔日两边同取，再确定罐内数。','12－5＝7，罐内7颗。','隔日：总量超过十'],
  [{kind:'unknown',known:1,total:6,context:'密封袋与石子'},'袋子外有1颗，右盘6颗。两边同取后数袋内颗数。','6－1＝5，袋内5颗。','备用：已知量只一颗']
 ],
 'L01.03':[
  [{kind:'bilateral',known:2,total:8,context:'两边逐颗撤棋'},'左边未知盒加2枚、右边8枚。逐次从左右各撤2枚，再摆盒内数。','左右各撤2，未知盒＝6。','将一次同取改成左右逐次对应操作'],
  [{kind:'bilateral',known:4,total:9,context:'积木天平'},'左盘未知袋加4块，右盘9块。独立逐颗从两边各拿走4块，再摆出袋内数。','右边剩5块，未知袋5块。','无提示：需要四次对应动作'],
  [{kind:'bilateral',known:1,total:7,context:'水果天平'},'左盘未知篮加1个、右盘7个。隔日分别从左右拿走1个并摆篮内数。','两边各拿1，篮内6个。','隔日：只需一组对应动作'],
  [{kind:'bilateral',known:3,total:10,context:'砝码天平'},'左侧袋子外有3颗，右侧10颗；各边逐颗撤3，再摆袋内数。','右边剩7，袋内7。','备用：右侧总数十']
 ],
 'L01.04':[
  [{kind:'inverse',initial:8,remain:3,context:'铅笔盒'},'原来8支，拿走未知数后剩3支。逐支移到拿走区，找回未知数。','拿走5支，因为8－5＝3。','原数与余数均改变，换铅笔'],
  [{kind:'inverse',initial:12,remain:7,context:'贴纸簿'},'原来12张贴纸，拿走后剩7张；独立逐张移走。','拿走5张，12－7＝5。','无提示：跨过十'],
  [{kind:'inverse',initial:10,remain:4,context:'气球'},'原来10个气球，送出一些还剩4个。隔日逐个移到送出区。','送出6个，10－4＝6。','隔日：原数是十'],
  [{kind:'inverse',initial:7,remain:2,context:'卡片盒'},'7张卡片取走若干，盒内余2张。逐张移出求取走数。','取走5张，7－2＝5。','备用：小总量']
 ],
 'L01.05':[
  [{kind:'substitute',bag:5,known:2,total:7,context:'代回积木天平'},'已经求出袋内5块。逐块放进袋，再摆外面2块，核对右侧7块。','5＋2＝7，左右相等。','袋中5、袋外2，换积木'],
  [{kind:'substitute',bag:6,known:3,total:9,context:'棋子天平'},'未知盒是6枚。独立摆盒内6枚和盒外3枚，检验与右边9枚等重。','6＋3＝9，原式成立。','无提示：新未知量6'],
  [{kind:'substitute',bag:4,known:5,total:9,context:'纽扣盘'},'已求得袋内4颗，袋外5颗。隔日逐颗代回，比较右侧9颗。','4＋5＝9，代回两边相等。','隔日：袋外数量大于袋内'],
  [{kind:'substitute',bag:7,known:1,total:8,context:'彩珠盘'},'袋中7颗，外面1颗。独立摆两部分并核对右边8颗。','7＋1＝8，代回检验通过。','备用：袋外只有一颗']
 ]
};
const equationStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(EQUATION_CASES)){
 if(cases.length!==4)throw Error('Four L01 cases required: '+skillId);equationStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];equationStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:67,mode:'equationLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt:params.kind==='unknown'&&kind!=='transfer'?`一个未知盒加${params.known}个物件等于${params.total}个。自己找出盒内数量，再用天平检查。`:prompt,explain,changeDimension,methodSpecific:params.kind==='bilateral'||kind==='transfer'&&params.kind==='unknown',...(kind==='transfer'?{hint:'先看两边整体，动手找等量和未知部分。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={EQUATION_CASES};

'use strict';
function equationState(){const w=draft.work??(draft.work={left:[],right:[],taken:false,leftTaken:0,rightTaken:0,bag:0,removed:0,knownPlaced:0,moves:0,log:[]});w.leftAdded??=0;w.rightAdded??=0;w.returned??=0;w.wholeAnswer??=0;w.wholeSet??=false;w.choice??='';return w}
function equationDots(n,label,prefix='',offset=0){return `<span class="equation-dots" role="img" aria-label="${esc(label)}${n}颗">${Array.from({length:n},(_,i)=>`<i ${prefix?`data-object-id="${prefix}${i+offset}"`:''} aria-hidden="true"></i>`).join('')}</span>`}
function equationVerdict(task){return choiceButtons(task,[['equal','两边相等'],['unequal','两边不相等']],'equationVerdict')}
function equationCandidateVerdict(task){return choiceButtons(task,[['accept','满足原式'],['reject','不满足原式']],'equationVerdict')}
function equationBoard(task){const w=equationState(),undo=`<button data-action="equationUndo" ${w.log.length?'':'disabled'}>↩ 撤回一步</button>`;
 if(task.kind==='equal'){
  const left=w.left.reduce((sum,i)=>sum+task.left[i],0),right=w.right.reduce((sum,i)=>sum+task.right[i],0);
  return `<div class="board equation-board"><h3>${esc(task.context)} · 比较完整两盘</h3><div class="equation-pans">${[['left','左盘'],['right','右盘']].map(([side,name])=>`<section><b>${name} · 已摆 ${side==='left'?left:right}</b><div class="equation-groups">${task[side].map((n,i)=>`<button data-action="equationTerm" data-side="${side}" data-index="${i}" aria-pressed="${w[side].includes(i)}">${w[side].includes(i)?equationDots(n,`${name}第${i+1}组`,side+i+'-'):`放第${i+1}组 ${n}颗`}</button>`).join('')}</div></section>`).join('<strong class="equation-equals">?</strong>')}</div>${task.equalAnswer===false?equationVerdict(task):''}<div class="work-buttons">${undo}</div></div>`;
 }
 if(task.kind==='inverse'&&task.unknownInitial){
  return `<div class="board equation-board"><h3>${esc(task.context)} · □－${task.removedGiven}＝${task.remain}</h3><div class="equation-pans"><section><b>放回整体</b>${equationDots(task.remain,'原本剩余','R')}${equationDots(w.returned,'放回的原对象','N')}</section><strong class="equation-equals">←</strong><section><b>先前拿走的原对象</b>${Array.from({length:task.removedGiven-w.returned},(_,i)=>`<i class="equation-return-dot" data-object-id="N${w.returned+i}"></i>`).join('')}</section></div><div class="work-buttons"><button data-action="equationReturn" ${w.returned>=task.removedGiven?'disabled':''}>放回1颗原点</button>${undo}</div><p>我的原数量：${w.wholeAnswer}</p><div class="work-buttons">${[-1,0,1,5].map(d=>`<button data-action="equationWhole" data-delta="${d}">${d===0?'填0':d>0?'＋'+d:d}</button>`).join('')}</div></div>`;
 }
 if(task.kind==='inverse')return `<div class="board equation-board"><h3>${esc(task.context)} · ${task.initial}－□＝${task.remain}</h3><div class="equation-pans"><section><b>盒中 ${task.initial-w.removed} 颗</b>${Array.from({length:task.initial-w.removed},(_,i)=>`<i class="equation-return-dot" data-object-id="I${w.removed+i}"></i>`).join('')}</section><strong class="equation-equals">→</strong><section><b>已拿走 ${w.removed} 颗</b>${equationDots(w.removed,'已拿走','I')}</section></div><div class="work-buttons"><button data-action="equationRemove" ${w.removed>=task.initial?'disabled':''}>拿走1颗</button>${undo}</div></div>`;
 if(task.kind==='substitute')return `<div class="board equation-board"><h3>${esc(task.context)} · □＋${task.known}＝${task.total}</h3><div class="equation-pans"><section><b>候选未知袋 ${task.bag} 颗</b>${equationDots(w.bag,'袋内','X')}<p>袋外 ${w.knownPlaced} 颗</p>${equationDots(w.knownPlaced,'袋外','K')}</section><strong class="equation-equals">?</strong><section><b>右盘 ${task.total}颗</b>${equationDots(task.total,'右盘','T')}</section></div><div class="work-buttons"><button data-action="equationBag" ${w.bag>=task.total?'disabled':''}>候选袋中放1颗</button><button data-action="equationKnown" ${w.knownPlaced>=task.known?'disabled':''}>袋外放1颗</button>${undo}</div>${task.correctVerdict?equationCandidateVerdict(task):''}</div>`;
 const leftRemoved=task.kind==='unknown'&&w.taken?task.known:w.leftTaken,rightRemoved=task.kind==='unknown'&&w.taken?task.known:w.rightTaken,lt=task.known-leftRemoved+w.leftAdded,rt=task.total-rightRemoved+w.rightAdded;
 const unknown=`<section><b>未知盘：袋＋${lt}颗</b><div class="equation-bag">袋内已摆 ${w.bag}颗 ${equationDots(w.bag,'袋中','X')}</div>${equationDots(Math.max(0,task.known-leftRemoved),'原袋外','K',leftRemoved)}${equationDots(w.leftAdded,'添入未知盘','AL')}</section>`;
 const known=`<section><b>已知盘：${rt}颗</b>${equationDots(Math.max(0,task.total-rightRemoved),'原已知盘','T',rightRemoved)}${equationDots(w.rightAdded,'添入已知盘','AR')}</section>`;
 const pans=(task.unknownSide==='right'?[known,unknown]:[unknown,known]).join(`<strong class="equation-equals" aria-label="按已摆出的数量比较">${w.bag+lt===rt?'＝':'≠'}</strong>`);
 const removedTray=leftRemoved||rightRemoved?`<div class="equation-pans"><section><b>未知盘移出的原对象</b>${equationDots(leftRemoved,'未知盘移出','K')}</section><section><b>已知盘移出的原对象</b>${equationDots(rightRemoved,'已知盘移出','T')}</section></div>`:'';
 const addition=task.addBoth!==undefined;
 const controls=task.kind==='bilateral'?addition?`<button data-action="equationLeftAdd" ${w.leftAdded>=task.addBoth?'disabled':''}>未知盘添1颗</button><button data-action="equationRightAdd" ${w.rightAdded>=task.addBoth?'disabled':''}>已知盘添1颗</button>`:`<button data-action="equationLeftTake" ${w.leftTaken>=task.known?'disabled':''}>左边拿1颗</button><button data-action="equationRightTake" ${w.rightTaken>=task.known?'disabled':''}>右边拿1颗</button>`:`<button data-action="equationTake" ${w.taken?'disabled':''}>两边各拿走${task.known}颗</button>`;
 return `<div class="board equation-board"><h3>${esc(task.context)} · ${task.unknownSide==='right'?`${task.total}＝□＋${task.known}`:`□＋${task.known}＝${task.total}`}</h3><div class="equation-pans">${pans}</div>${removedTray}<p>${addition?'两盘同加相同数量，原来的未知袋不变。':task.kind==='bilateral'?`左边已拿${w.leftTaken}，右边已拿${w.rightTaken}。`:w.taken?'已按两边同取移出原对象。':'自己摆袋内数量，也可两边同取。'}</p><div class="work-buttons">${controls}<button data-action="equationBag" ${w.bag>=task.total?'disabled':''}>袋中放1颗</button>${undo}</div></div>`;
}
function equationGrade(task){const w=equationState();let ok=false,incomplete=w.moves===0;
 if(task.kind==='equal'){
  const equal=task.left.reduce((a,n)=>a+n,0)===task.right.reduce((a,n)=>a+n,0);
  ok=w.left.length===task.left.length&&w.right.length===task.right.length&&(task.equalAnswer===false?!equal&&w.choice==='unequal':equal);
  if(task.equalAnswer===false)incomplete=incomplete||!w.choice;
 }
 if(task.kind==='unknown')ok=w.bag+task.known===task.total&&(!task.methodSpecific||w.taken);
 if(task.kind==='bilateral')ok=task.addBoth!==undefined?w.leftAdded===task.addBoth&&w.rightAdded===task.addBoth&&w.leftTaken===0&&w.rightTaken===0&&w.bag===task.total-task.known&&w.bag+task.known+w.leftAdded===task.total+w.rightAdded:w.leftTaken===task.known&&w.rightTaken===task.known&&w.bag===task.total-task.known;
 if(task.kind==='inverse')ok=task.unknownInitial?w.returned===task.removedGiven&&w.wholeSet&&w.wholeAnswer===task.remain+task.removedGiven:w.removed===task.initial-task.remain;
 if(task.kind==='substitute'){
  const fits=w.bag+w.knownPlaced===task.total;
  ok=w.bag===task.bag&&w.knownPlaced===task.known&&(task.correctVerdict?w.choice===(fits?'accept':'reject'):fits);
  if(task.correctVerdict)incomplete=incomplete||!w.choice;
 }
 return {ok,incomplete,reason:'核对完整原式；相等必须比较两盘总量，同加同减不能只改一边，候选数也可能不满足。'};
}
function equationAct(action,data,task){const w=equationState();let key=null,value=null;
 if(action==='equationTerm'&&task.kind==='equal'&&['left','right'].includes(data.side)){const i=Number(data.index);if(Number.isInteger(i)&&i>=0&&i<task[data.side].length){key=data.side;value=i;const at=w[key].indexOf(i);if(at<0)w[key].push(i);else w[key].splice(at,1)}}
 if(action==='equationTake'&&task.kind==='unknown'&&!w.taken){key='taken';value=w.taken;w.taken=true}
 for(const [name,k] of [['equationLeftTake','leftTaken'],['equationRightTake','rightTaken']])if(action===name&&task.kind==='bilateral'&&task.addBoth===undefined&&w[k]<task.known){key=k;value=w[k];w[k]++}
 for(const [name,k] of [['equationLeftAdd','leftAdded'],['equationRightAdd','rightAdded']])if(action===name&&task.kind==='bilateral'&&task.addBoth!==undefined&&w[k]<task.addBoth){key=k;value=w[k];w[k]++}
 if(action==='equationBag'&&['unknown','bilateral','substitute'].includes(task.kind)&&w.bag<task.total){key='bag';value=w.bag;w.bag++}
 if(action==='equationKnown'&&task.kind==='substitute'&&w.knownPlaced<task.known){key='knownPlaced';value=w.knownPlaced;w.knownPlaced++}
 if(action==='equationRemove'&&task.kind==='inverse'&&!task.unknownInitial&&w.removed<task.initial){key='removed';value=w.removed;w.removed++}
 if(action==='equationReturn'&&task.kind==='inverse'&&task.unknownInitial&&w.returned<task.removedGiven){key='returned';value=w.returned;w.returned++}
 if(action==='equationWhole'&&task.unknownInitial){const d=Number(data.delta);if([-1,0,1,5].includes(d)&&w.wholeAnswer+d>=0&&w.wholeAnswer+d<=100){key='wholeAnswer';value=[w.wholeAnswer,w.wholeSet];w.wholeAnswer+=d;w.wholeSet=true}}
 if(action==='equationVerdict'&&['equal','substitute'].includes(task.kind)&&['equal','unequal','accept','reject'].includes(data.value)){key='choice';value=w.choice;w.choice=data.value}
 if(action==='equationUndo'&&w.log.length){const [previous,old]=w.log.pop();if(['left','right'].includes(previous)){const at=w[previous].indexOf(old);if(at<0)w[previous].push(old);else w[previous].splice(at,1)}else if(previous==='wholeAnswer'){w.wholeAnswer=old[0];w.wholeSet=old[1]}else w[previous]=old;w.moves++;return true}
 if(key===null)return false;w.log.push([key,value]);w.moves++;return true;
}
function equationSpeech(task){const w=equationState();if(task.kind==='equal')return `左盘已摆${w.left.reduce((a,i)=>a+task.left[i],0)}，右盘已摆${w.right.reduce((a,i)=>a+task.right[i],0)}。`;if(task.unknownInitial)return `原来剩余${task.remain}颗，已放回${w.returned}颗。我的原数量${w.wholeAnswer}。`;if(task.kind==='inverse')return `原来${task.initial}颗，已拿走${w.removed}颗。`;if(task.kind==='substitute')return `候选袋内${w.bag}颗，袋外${w.knownPlaced}颗，右盘${task.total}颗。`;return `未知袋已摆${w.bag}颗，未知盘原袋外${task.known}颗；两盘分别添${w.leftAdded}和${w.rightAdded}颗，分别拿走${w.leftTaken}和${w.rightTaken}颗。`}
function equationPage(){const task=EQUATION_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)}</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 返回</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题 →':'检查操作与理由 ✓'}</button></div>${equationBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack">${stageLinks(task.skillId)}</aside></div>`}

'use strict';
const CONSTRAINT_TASKS={
 'L02.01':{kind:'reverse',groups:3,extra:2,bag:5,context:'三袋加附加糖果',prompt:'3袋一样多，每袋里有未知数再加2颗，共21颗。先把21平均分成3份，再逐份拿掉2颗，找回每袋未知数。',explain:'21÷3＝7；每份7－2＝5，未知数5。',reason:{prompt:'为什么要先除3再减2？',options:['3倍作用于整份□＋2，先找回每份7','先从21直接减2再除3','每袋未知数就是21'],answer:0}},
 'L02.02':{kind:'verify',groups:3,extra:2,bag:5,context:'代回三袋',prompt:'假设未知数是5。给每袋逐颗摆5颗，再给每袋添2颗，核对3袋总共是否21颗。',explain:'每袋5＋2＝7；3袋共21颗，代回成立。',reason:{prompt:'代回时括号怎样处理？',options:['每袋都摆5＋2，再看三袋共21','三袋共摆5＋2','只检查一袋等于21'],answer:0}},
 'L02.03':{kind:'parity',total:7,divisor:2,context:'两两配对的棋子',prompt:'尝试把7枚棋子每2枚配成一组。逐组配对，观察剩余，判断2×一个整数能否等于7。',explain:'能配3组共6枚，余1枚；不存在整数使2×整数＝7。',reason:{prompt:'为什么7不可能是2的整数倍？',options:['两两配对后还剩1枚','有3组就说明7是偶数','把剩下1枚藏起来'],answer:0}},
 'L02.04':{kind:'stock',stock:13,per:5,context:'库存装袋',prompt:'库存13颗，每满袋要5颗。逐袋从库存移入袋中，再尝试多装一袋，观察余量够不够。',explain:'可装2个满袋，余3颗，不足以装第三袋。',reason:{prompt:'为什么三袋不可行？',options:['三袋需15颗，大于库存13','三袋只需3颗','还剩3颗所以一定可装第三袋'],answer:0}},
 'L02.05':{kind:'optimal',stock:13,per:5,context:'寻找最大可行袋数',prompt:'库存13颗，每袋要5颗。分别试1、2、3袋，观察每种方案所需量和余量，再选择最多的可行满袋数。',explain:'1袋和2袋可行，3袋需15颗超过13；最多2袋。',reason:{prompt:'为什么2袋是最优？',options:['2袋可行，3袋超库存，且比1袋多','只要1袋可行就无需比较','3袋更大所以最优'],answer:0}}
};
for(const [skillId,t] of Object.entries(CONSTRAINT_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:25,mode:'constraintLab',phase:'练',hint:'用点和分组看到每一步：先处理外层、再核对整数与库存界限。'});
if(typeof module!=='undefined')module.exports={CONSTRAINT_TASKS};

'use strict';
const CONSTRAINT_CASES={
 'L02.01':[
  [{kind:'reverse',groups:2,extra:3,bag:4,context:'两个积木盘'},'两个一样的盘，每盘是未知袋加3块，共14块。先把整体分两盘，再逐盘拿掉3块。','14÷2＝7，每盘7－3＝4，未知袋4。','由代数式改双盘模型，组数改二'],
  [{kind:'reverse',groups:4,extra:1,bag:3,context:'四份文具'},'四份各有未知数加1支笔，共16支。独立均分后，逐份拿掉附加1支。','每份4支，未知数3。','无提示：四份与单个附加物'],
  [{kind:'reverse',groups:2,extra:2,bag:6,context:'两袋彩珠'},'两袋各有未知数加2珠，共16珠。隔日先均分，再逐袋拿掉附加部分。','每袋8，未知数6。','隔日：未知数大于附加数'],
  [{kind:'reverse',groups:3,extra:1,bag:4,context:'三盒铅笔'},'三盒各有未知数再加1支，共15支。独立逆向分组求未知数。','15÷3＝5，再减1得4。','备用：三盒，每盒一支附加']
 ],
 'L02.02':[
  [{kind:'verify',groups:2,extra:3,bag:4,context:'双盘代回'},'已知袋中4块。两个盘各摆4块袋内和3块袋外，核对总共14块。','2×(4＋3)＝14。','由三袋换双盘，附加数3'],
  [{kind:'verify',groups:4,extra:1,bag:3,context:'四盒检验'},'每盒未知数是3。四盒分别摆3块袋内和1块袋外，核对16。','4×(3＋1)＝16。','无提示：四组代回'],
  [{kind:'verify',groups:2,extra:2,bag:6,context:'两篮水果'},'每篮未知部分6个、额外2个。隔日摆出两篮，核对总数16。','2×(6＋2)＝16。','隔日：额外数2，袋内6'],
  [{kind:'verify',groups:3,extra:1,bag:4,context:'三份卡片'},'每份袋中4张再加1张，独立代回核对总量15张。','3×(4＋1)＝15。','备用：每份只加一张']
 ],
 'L02.03':[
  [{kind:'parity',total:10,divisor:3,context:'三枚一组的贴纸'},'有10张贴纸，试每3张组成一整组。逐组配好，看3×整数能否刚好等于10。','3组用9张，余1张，无整数解。','从奇偶的两两配对迁移到三枚一组'],
  [{kind:'parity',total:9,divisor:2,context:'成双的手套'},'9只手套每2只配一双。独立逐双配对，观察是否能全配完。','4双用8只，余1只，不能全部成双。','无提示：9为奇数'],
  [{kind:'parity',total:11,divisor:2,context:'双座椅'},'11人按每排2人配座。隔日逐排安排，检查整数排数可否坐满。','5排10人余1人，无法正好排成双人排。','隔日：把物品换成人数'],
  [{kind:'parity',total:13,divisor:2,context:'两颗一袋的豆子'},'13颗豆每袋2颗。逐袋分组，判断能否刚好无余数。','6袋12颗余1颗，无整数袋数可全部装满。','备用：总数13']
 ],
 'L02.04':[
  [{kind:'stock',stock:14,per:4,context:'纸花库存'},'14朵纸花，每束4朵。逐束扎好，再试图多扎一束。','可做3束，余2朵，不够第四束。','把颗数与每袋5改成花束每束4'],
  [{kind:'stock',stock:17,per:6,context:'彩纸成套'},'17张彩纸，每套6张。独立逐套取纸，再检查下一套是否够。','可配2套，余5张，不够第三套。','无提示：每套6张'],
  [{kind:'stock',stock:10,per:3,context:'饼干盒'},'10块饼干，每盒3块。隔日逐盒装满并试下一盒。','可装3盒余1块。','隔日：余数缩为1'],
  [{kind:'stock',stock:19,per:5,context:'实验材料包'},'19件材料，每包5件。逐包分装，再检查下一包。','装3包，余4件不足一包。','备用：剩余接近一整包']
 ],
 'L02.05':[
  [{kind:'optimal',stock:14,per:4,context:'最多纸花束'},'14朵花每束4朵。试1、2、3、4束，比较哪一个最大仍可行。','3束用12余2，4束需16超库存。','从袋数改成纸花束，最大可行值改3'],
  [{kind:'optimal',stock:11,per:4,context:'文具套装'},'11支笔每套4支，独立试1、2、3套，选最大可行套数。','2套用8余3；3套需12不够。','无提示：11支与每套4'],
  [{kind:'optimal',stock:17,per:6,context:'小队徽章'},'17枚徽章，每队6枚。隔日试1、2、3队，确认最大可行队数。','2队用12余5；3队需18超出。','隔日：第三队只差1枚'],
  [{kind:'optimal',stock:10,per:3,context:'饼干礼包'},'10块饼干每礼包3块。试1至4包，选最大仍可行的礼包数。','3包用9余1，4包需12超出。','备用：最大可行3包']
 ]
};
const constraintStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(CONSTRAINT_CASES)){
 if(cases.length!==4)throw Error('Four L02 cases required: '+skillId);constraintStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];constraintStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:26,mode:'constraintLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先看每份和整数边界，动手分组，再核对完整条件。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={CONSTRAINT_CASES};

'use strict';
function constraintState(){return draft.work??(draft.work={divided:false,peeled:0,filled:0,extra:0,pairs:0,bags:0,probed:false,tried:[],trial:0,choice:'',moves:0,log:[]})}
function constraintTotal(task){return task.groups*task.bag+(task.extraOutside?task.extra:task.groups*task.extra)}
function constraintDots(n,label,ids){return `<span class="constraint-dots" role="img" aria-label="${esc(label)}${n}颗">${Array.from({length:n},(_,i)=>`<i ${ids?`data-object-id="${ids[i]}"`:''} aria-hidden="true"></i>`).join('')}</span>`}
function constraintIds(first,n){return Array.from({length:n},(_,i)=>'I'+(first+i))}
function constraintBoard(task){const w=constraintState(),undo=`<button data-action="constraintUndo" ${w.log.length?'':'disabled'}>↩ 撤回一步</button>`;
 if(task.kind==='reverse'){
  const total=constraintTotal(task),outside=!!task.extraOutside,per=task.bag+(outside?0:task.extra);
  const groups=w.divided?Array.from({length:task.groups},(_,g)=>{const remain=per-(outside?0:w.peeled);return `<section><b>第${g+1}份</b>${constraintDots(remain,'组内原点',constraintIds(g*per,remain))}${!outside?`<small>本组已移出${w.peeled}</small>${constraintDots(w.peeled,'本组移出',constraintIds(g*per+remain,w.peeled))}`:''}</section>`}).join(''):constraintDots(total-w.peeled,'尚未分组的原点',constraintIds(0,total-w.peeled));
  return `<div class="board constraint-board"><h3>${esc(task.context)} · ${outside?`${task.groups}×□＋${task.extra}`:`${task.groups}×(□＋${task.extra})`}＝${total}</h3><div class="constraint-groups">${groups}</div>${outside?`<section class="constraint-outside"><b>整体只移出一次</b>${constraintDots(w.peeled,'整批移出原点',constraintIds(total-w.peeled,w.peeled))}</section>`:''}<div class="work-buttons"><button data-action="constraintDivide" ${w.divided||outside&&w.peeled!==task.extra?'disabled':''}>把剩余原点均分成${task.groups}份</button><button data-action="constraintPeel" ${outside?w.divided||w.peeled>=task.extra?'disabled':'':!w.divided||w.peeled>=task.extra?'disabled':''}>${outside?'整体移出1颗':'每份移出1颗'}</button>${undo}</div></div>`;
 }
 if(task.kind==='verify'){
  const total=constraintTotal(task),target=task.givenTotal??total,actual=task.groups*w.filled+(task.extraOutside?w.extra:task.groups*w.extra);
  return `<div class="board constraint-board"><h3>${esc(task.context)} · ${task.extraOutside?`${task.groups}×□＋${task.extra}`:`${task.groups}×(□＋${task.extra})`}＝${target}</h3><div class="constraint-groups">${Array.from({length:task.groups},(_,g)=>`<section><b>第${g+1}袋：袋内${w.filled}${task.extraOutside?'':'，袋外'+w.extra}</b>${constraintDots(w.filled,'未知袋','')}${!task.extraOutside?constraintDots(w.extra,'本袋附加'):''}</section>`).join('')}</div>${task.extraOutside?`<section class="constraint-outside"><b>整批附加一次</b>${constraintDots(w.extra,'整批附加')}</section>`:''}<p>${assessmentFormal(task)?'核对完整原式。':'当前合计 '+actual+'，目标 '+target+'。'}</p><div class="work-buttons"><button data-action="constraintFill" ${w.filled>=task.bag+2?'disabled':''}>每袋添1颗未知部分</button><button data-action="constraintExtra" ${w.extra>=task.extra+2?'disabled':''}>${task.extraOutside?'整体':'每袋'}添1颗附加部分</button>${undo}</div>${task.correctVerdict?choiceButtons(task,[['accept','满足原式'],['reject','不满足原式']],'constraintChoose'):''}</div>`;
 }
 if(task.kind==='parity'){
  const left=task.total-task.divisor*w.pairs;
  return `<div class="board constraint-board"><h3>${esc(task.context)} · 平均分成${task.divisor}个整数组</h3><div class="constraint-groups">${Array.from({length:task.divisor},(_,g)=>`<section><b>第${g+1}组</b>${constraintDots(w.pairs,'本组原点',Array.from({length:w.pairs},(_,i)=>'I'+(i*task.divisor+g)))}</section>`).join('')}<section><b>未分 ${left} 枚</b>${constraintDots(left,'未分原点',constraintIds(task.divisor*w.pairs,left))}</section></div><div class="work-buttons"><button data-action="constraintPair" ${left<task.divisor?'disabled':''}>每组各放1颗</button>${undo}</div>${choiceButtons(task,[['impossible','没有整数解'],['possible','有整数解']],'constraintChoose')}</div>`;
 }
 if(task.kind==='stock'){
  const left=task.stock-w.bags*task.per;
  return `<div class="board constraint-board"><h3>${esc(task.context)} · 库存${task.stock}，每袋${task.per}</h3><div class="constraint-groups">${Array.from({length:w.bags},(_,g)=>`<section><b>第${g+1}满袋</b>${constraintDots(task.per,'袋内原点',constraintIds(g*task.per,task.per))}</section>`).join('')}<section><b>库存还剩 ${left}</b>${constraintDots(left,'未装原点',constraintIds(w.bags*task.per,left))}</section>${w.probed?`<section class="shortage"><b>下一袋还缺${task.per-left}个位置</b></section>`:''}</div><div class="work-buttons"><button data-action="constraintPack" ${left<task.per?'disabled':''}>装一满袋</button><button data-action="constraintProbe" ${left>=task.per||w.probed?'disabled':''}>核对下一袋的缺口</button>${undo}</div></div>`;
 }
 const candidates=Array.from({length:Math.floor(task.stock/task.per)+2},(_,i)=>i),needed=w.trial*task.per,left=task.stock-needed;
 return `<div class="board constraint-board"><h3>${esc(task.context)} · 库存${task.stock}，每袋${task.per}</h3><div class="work-buttons">${candidates.map(n=>`<button data-action="constraintTrial" data-value="${n}" aria-pressed="${w.trial===n}">试${n}袋${w.tried.includes(n)?' ✓':''}</button>`).join('')}</div>${w.tried.length?`<div class="constraint-demand" style="--demand-cols:${task.per}" role="img" aria-label="候选${w.trial}袋需要${needed}个位置，库存最多填${Math.min(task.stock,needed)}个">${Array.from({length:needed},(_,i)=>`<span class="${i<task.stock?'filled':''}">${i<task.stock?`<i data-object-id="I${i}"></i>`:''}</span>`).join('')}</div>${left>0?constraintDots(left,'剩余库存',constraintIds(needed,left)):''}<p>${left>=0?'库存足够':'空位还缺'+(-left)+'颗'}。</p>`:'<p>比较最多可行方案与紧邻的不可行方案。</p>'}${choiceButtons(task,candidates.map(n=>[String(n),'最多'+n+'袋']),'constraintChoose')}<div class="work-buttons">${undo}</div></div>`;
}
function constraintGrade(task){const w=constraintState(),max=Math.floor(task.stock/task.per);let ok=false;
 if(task.kind==='reverse')ok=w.divided&&w.peeled===task.extra;
 if(task.kind==='verify'){const total=task.groups*w.filled+(task.extraOutside?w.extra:task.groups*w.extra),fits=total===(task.givenTotal??constraintTotal(task));ok=w.filled===task.bag&&w.extra===task.extra&&(task.correctVerdict?w.choice===(fits?'accept':'reject'):fits)}
 if(task.kind==='parity')ok=w.pairs===Math.floor(task.total/task.divisor)&&w.choice===(task.total%task.divisor===0?'possible':'impossible');
 if(task.kind==='stock')ok=w.bags===max&&w.probed;
 if(task.kind==='optimal')ok=w.tried.includes(max)&&w.tried.includes(max+1)&&w.choice===String(max);
 return {ok,incomplete:w.moves===0||task.kind==='parity'&&!w.choice||!!task.correctVerdict&&!w.choice,reason:'先分清附加量属于每组还是整个整体；整数条件和库存边界须同时核对。最多方案要能装下，下一组要装不下。'};
}
function constraintAct(action,data,task){const w=constraintState(),max=Number.isInteger(task.stock)?Math.floor(task.stock/task.per):0;let key=null,old=null;
 const set=(k,v)=>{key=k;old=w[k];w[k]=v};
 if(action==='constraintDivide'&&task.kind==='reverse'&&!w.divided&&(!task.extraOutside||w.peeled===task.extra))set('divided',true);
 if(action==='constraintPeel'&&task.kind==='reverse'&&(task.extraOutside?!w.divided:w.divided)&&w.peeled<task.extra)set('peeled',w.peeled+1);
 if(action==='constraintFill'&&task.kind==='verify'&&w.filled<task.bag+2)set('filled',w.filled+1);
 if(action==='constraintExtra'&&task.kind==='verify'&&w.extra<task.extra+2)set('extra',w.extra+1);
 if(action==='constraintPair'&&task.kind==='parity'&&task.total-task.divisor*w.pairs>=task.divisor)set('pairs',w.pairs+1);
 if(action==='constraintPack'&&task.kind==='stock'&&task.stock-(w.bags+1)*task.per>=0)set('bags',w.bags+1);
 if(action==='constraintProbe'&&task.kind==='stock'&&task.stock-w.bags*task.per<task.per&&!w.probed)set('probed',true);
 if(action==='constraintTrial'&&task.kind==='optimal'){const n=Number(data.value);if(Number.isInteger(n)&&n>=0&&n<=max+1){key='trial';old=[w.trial,[...w.tried]];w.trial=n;if(!w.tried.includes(n))w.tried.push(n)}}
 if(action==='constraintChoose'&&['parity','optimal','verify'].includes(task.kind)){
  const choices=task.kind==='parity'?['impossible','possible']:task.kind==='verify'?['accept','reject']:Array.from({length:max+2},(_,i)=>String(i));if(choices.includes(data.value))set('choice',data.value);
 }
 if(action==='constraintUndo'&&w.log.length){const [k,v]=w.log.pop();if(k==='trial'){w.trial=v[0];w.tried=v[1]}else w[k]=v;w.moves++;return true}
 if(key===null)return false;w.log.push([key,old]);w.moves++;return true;
}
function constraintSpeech(task){const w=constraintState();if(task.kind==='reverse')return `${constraintTotal(task)}个原对象，${task.extraOutside?'整体只':'每组各'}移出${w.peeled}，${w.divided?'已经均分':'尚未均分'}。`;if(task.kind==='verify')return `每袋未知部分${w.filled}，${task.extraOutside?'整批只':'每袋各'}附加${w.extra}。`;if(task.kind==='parity')return `${task.divisor}组各放${w.pairs}个，剩余${task.total-task.divisor*w.pairs}。`;if(task.kind==='stock')return `已装${w.bags}袋，余${task.stock-w.bags*task.per}颗。`;return w.tried.length?`候选${w.trial}袋，库存${task.stock}。`:'还没有试装方案。'}
function constraintPage(){const task=CONSTRAINT_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)}</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 返回</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题 →':'检查操作与理由 ✓'}</button></div>${constraintBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack">${stageLinks(task.skillId)}</aside></div>`}

'use strict';
const PATTERN_TASKS={
 'L03.01':{kind:'period',base:['🔴','🔵'],context:'彩灯',prompt:'彩灯显示红蓝红蓝红蓝。圈出最短重复块，再让这块连续复制，看看是否和原串一致。',explain:'最短重复块是红蓝两格；红蓝红蓝虽也能重复，却不是最短。',reason:{prompt:'为什么要选两格？',options:['红蓝两格能生成全串，且一格不能','四格也能重复，所以四格一定最短','只看末尾两格'],answer:0}},
 'L03.02':{kind:'arithmetic',initial:[2,5,8,11],step:3,context:'楼梯编号',prompt:'2、5、8、11 每次跳相同的数。调好跳数，在数轴式序列上连续添两项。',explain:'每步加3，接下来14、17。',reason:{prompt:'为什么接下来是14、17？',options:['相邻两项的差都是3','每步乘3','只看最后一个11加1'],answer:0}},
 'L03.03':{kind:'geometric',initial:[2,4,8,16],factor:2,context:'翻倍贴纸',prompt:'2、4、8、16，每一轮按相同倍数增加。选倍数，连续复制两轮。',explain:'每轮乘2，得到32、64；差不是固定的数。',reason:{prompt:'为什么下一项是32？',options:['16乘2，倍数保持相同','16加2','把前两项相加'],answer:0}},
 'L03.04':{kind:'explicit',initial:[2],multiplier:2,add:1,context:'变数机器',prompt:'机器规定“把前项乘2，再加1”。从2开始，每轮亲手先乘后加，完成两轮。',explain:'2→5→11；每轮都重新对上一项乘2再加1。',reason:{prompt:'第二轮从哪个数开始？',options:['从第一轮的5重新乘2再加1','每次都回到最初的2','把两个结果相加'],answer:0}},
 'L03.05':{kind:'twoPrev',initial:[1,2],count:2,context:'接力数字卡',prompt:'前两项1、2，从第三项起每项等于前两项之和。每轮选两张前项卡合成下一张，连续做两轮。',explain:'1＋2＝3，再用2＋3＝5。',reason:{prompt:'第四项为什么是5？',options:['取刚得到的3与它前一项2相加','始终把最初1和2相加','只把上一步的3翻倍'],answer:0}},
 'L03.06':{kind:'grid',rows:3,cols:4,start:'red',context:'红蓝座位方格',prompt:'第一行已交替红蓝；相邻行的起色对调。逐格涂出下面两行，核对横向和纵向都交替。',explain:'行列每移动一格就换色；第2行蓝红蓝红，第3行红蓝红蓝。',reason:{prompt:'第2行第1格为什么是蓝？',options:['与正上方红格相邻，颜色要对调','每行都必须从红开始','只看本行最后一格'],answer:0}}
};
for(const [skillId,t] of Object.entries(PATTERN_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:27,mode:'patternLab',phase:'练',hint:'先读每一步的规则，再用材料实际生成后续项或格子。'});
if(typeof module!=='undefined')module.exports={PATTERN_TASKS};

'use strict';
const PATTERN_CASES={
 'L03.01':[
  [{kind:'period',base:['🔺','🟦','🟦'],context:'形状腰带'},'腰带重复三角、方、方。圈出最短的一组，再复制验证整条腰带。','最短一组是三角、方、方三格。','由双色两格换成有重复相邻方块的三格节'],
  [{kind:'period',base:['🍎','🍐'],context:'水果卡边框'},'苹果梨交替排成一圈。独立找最短重复块并复制验证。','苹果梨两格最短。','无提示：图案换水果'],
  [{kind:'period',base:['A','B','C'],context:'字母灯'},'字母A、B、C按序反复亮起。隔日找最短节并重复。','A、B、C三格是最短节。','隔日：三种字母无相邻同色'],
  [{kind:'period',base:['红','红','蓝'],context:'织物条纹'},'条纹红、红、蓝循环。独立确定最短节并复制。','红红蓝三格最短。','备用：同色连续两格在开头']
 ],
 'L03.02':[
  [{kind:'arithmetic',initial:[5,9,13],step:4,context:'编号台阶'},'台阶编号5、9、13。设定每步跳几格，继续添加两级。','差为4，后面17、21。','原来加3，改为加4且起点不同'],
  [{kind:'arithmetic',initial:[20,17,14],step:-3,context:'倒计数刻度'},'刻度20、17、14依次下降。独立调步长，再添两格。','每步减3，接着11、8。','无提示：增长改为下降'],
  [{kind:'arithmetic',initial:[1,6,11],step:5,context:'公交站号'},'站号1、6、11按固定间隔排列。隔日调好跳数并接两项。','间隔5，接着16、21。','隔日：初值1、步长5'],
  [{kind:'arithmetic',initial:[12,10,8],step:-2,context:'剩余贴纸'},'数量12、10、8每轮相同变化。独立续写两项。','每步少2，接着6、4。','备用：减少型等差']
 ],
 'L03.03':[
  [{kind:'geometric',initial:[3,6,12],factor:2,context:'分裂的纸片'},'纸片从3、6、12依次变化。调倍数，再实际复制后两轮。','每轮翻倍，接着24、48。','同倍数但起点改三，并与加3区分'],
  [{kind:'geometric',initial:[1,3,9],factor:3,context:'树枝分叉'},'树枝段数1、3、9。独立选相同倍数并续两轮。','每轮乘3，接着27、81。','无提示：倍数改3'],
  [{kind:'geometric',initial:[4,8,16],factor:2,context:'豆苗数量'},'豆苗4、8、16逐轮同倍。隔日接两轮。','再得32、64。','隔日：起点4'],
  [{kind:'geometric',initial:[2,6],factor:3,context:'三倍奖励卡'},'奖励卡从2变6，之后每轮相同倍数。独立续两轮。','6→18→54，每轮乘3。','备用：只给两项作为线索']
 ],
 'L03.04':[
  [{kind:'explicit',initial:[1],multiplier:3,add:2,context:'新变数机器'},'新机器规定每轮先乘3再加2。从1开始按顺序做两轮。','1→5→17。','同时改变乘数和加数'],
  [{kind:'explicit',initial:[3],multiplier:2,add:2,context:'能量机'},'能量3起，每轮先翻倍再添2。独立做两轮。','3→8→18。','无提示：起点改3，加数改2'],
  [{kind:'explicit',initial:[2],multiplier:3,add:1,context:'彩珠机'},'彩珠2起，每轮乘3再加1。隔日依规则做两轮。','2→7→22。','隔日：先乘3后添1'],
  [{kind:'explicit',initial:[4],multiplier:2,add:1,context:'积分机'},'积分4起，每轮先乘2再加1，做两轮。','4→9→19。','备用：起点4']
 ],
 'L03.05':[
  [{kind:'twoPrev',initial:[2,3],count:2,context:'双色接力卡'},'从2、3出发，每张新卡等于紧邻的前两张之和。逐次挑卡合成两项。','2＋3＝5，3＋5＝8。','种子从1、2换成2、3'],
  [{kind:'twoPrev',initial:[2,2],count:2,context:'接力分数牌'},'前两张是2、2。独立选相邻前两项，生成后两张。','2＋2＝4，2＋4＝6。','无提示：初始两项相同'],
  [{kind:'twoPrev',initial:[3,4],count:2,context:'树苗接力'},'数列3、4，之后每项取紧邻前两项的和。隔日生成两项。','3＋4＝7，4＋7＝11。','隔日：初始3、4'],
  [{kind:'twoPrev',initial:[1,3],count:2,context:'记分板'},'初始1、3。每轮选紧邻两项相加。独立生成两项。','1＋3＝4，3＋4＝7。','备用：初始不同差距']
 ],
 'L03.06':[
  [{kind:'grid',rows:3,cols:3,start:'blue',context:'蓝起点地砖'},'第一行从蓝开始交替。纵向也相邻换色；逐格补完其余两行。','蓝红蓝／红蓝红／蓝红蓝。','起色由红改蓝，四列改三列'],
  [{kind:'grid',rows:2,cols:5,start:'red',context:'剧院座位'},'座位第一行红蓝交替。第二行每座要与上方反色，独立补齐。','第二行蓝红蓝红蓝。','无提示：两行五列'],
  [{kind:'grid',rows:4,cols:3,start:'blue',context:'棋盘方格'},'棋盘第一行蓝红蓝，行列相邻均换色。隔日补完下面三行。','第二行红蓝红，第三行蓝红蓝，第四行红蓝红。','隔日：四行三列'],
  [{kind:'grid',rows:3,cols:5,start:'red',context:'彩纸地毯'},'红起点五列的第一行已给出。逐格涂完其余两行，使行列都交替。','第二行蓝红蓝红蓝，第三行红蓝红蓝红。','备用：三行五列']
 ]
};
const patternStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(PATTERN_CASES)){
 if(cases.length!==4)throw Error('Four L03 cases required: '+skillId);patternStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];patternStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:28,mode:'patternLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先对照生成规则，再动手续上两步或补齐整行。'}:{})};
 }
}
for(const tasks of Object.values(patternStageTarget))for(const t of Object.values(tasks))if(['测','巩固'].includes(t.phase)&&['arithmetic','geometric','explicit','twoPrev'].includes(t.kind))t.contentVersion=70;
Object.assign(patternStageTarget['L03.01'].independent,{base:["A", "B", "A", "C"],contentVersion:70,prompt:'圈出这串图案的最短重复块，再用它生成整串；字母表示不同的图形。',explain:'必须保留重复块内部的排列关系；换字母不产生新数学实例。'});
if(typeof module!=='undefined')module.exports={PATTERN_CASES};

'use strict';
function patternState(task){return draft.work??(draft.work={length:0,copied:false,step:0,factor:1,terms:[...(task.initial||[])],working:task.initial?.at(-1)??0,phase:0,selected:[],sums:[],cells:{},moves:0,log:[]})}
function patternDots(n){return `<span class="pattern-dots" role="img" aria-label="${n}个点">${Array.from({length:n},()=>'<i aria-hidden="true"></i>').join('')}</span>`}
function patternExpected(task){if(task.kind==='arithmetic')return [task.initial.at(-1)+task.step,task.initial.at(-1)+2*task.step];if(task.kind==='geometric')return [task.initial.at(-1)*task.factor,task.initial.at(-1)*task.factor*task.factor];if(task.kind==='explicit'){let v=task.initial.at(-1);return Array.from({length:2},()=>v=task.operationOrder==='addThenMultiply'?(v+task.add)*task.multiplier:v*task.multiplier+task.add)}if(task.kind==='twoPrev'){const arr=[...task.initial];for(let i=0;i<task.count;i++)arr.push(arr.at(-1)+arr.at(-2));return arr.slice(task.initial.length)}return []}
function patternPrimitive(task){const observed=Array.from({length:3},()=>task.base).flat();return Array.from({length:task.base.length},(_,i)=>i+1).find(n=>observed.every((v,i)=>v===observed[i%n]))}
function patternGivenRows(task){return task.tile?.length||1}
function patternColorAt(task,r,c){if(task.tile)return task.tile[r%task.tile.length][c%task.tile[0].length];const red=(r+c)%2===0?(task.start==='red'):(task.start!=='red');return red?'red':'blue'}
function patternMachineControls(task,w){const reversed=task.operationOrder==='addThenMultiply',items=reversed?[['patternAdd','＋'+task.add,0],['patternMultiply','×'+task.multiplier,1]]:[['patternMultiply','×'+task.multiplier,0],['patternAdd','＋'+task.add,1]];return items.map(([action,label,phase])=>`<button data-action="${action}" ${w.phase!==phase?'disabled':''}>${label}</button>`).join('')}
function patternBoard(task){const w=patternState(task),undo=`<button data-action="patternUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button>`;
 if(task.kind==='period'){const observed=Array.from({length:3},()=>task.base).flat(),max=Math.min(observed.length-1,task.base.length*2);const generated=w.copied?Array.from({length:observed.length},(_,i)=>observed[i%w.length]):[];return `<div class="board pattern-board"><h3>${esc(task.context)} · 原串</h3><div class="pattern-tiles">${observed.map(v=>`<span>${esc(v)}</span>`).join('')}</div><p>圈开头几格做重复块：</p><div class="work-buttons">${Array.from({length:max},(_,i)=>i+1).map(n=>`<button data-action="patternLength" data-value="${n}" aria-pressed="${w.length===n}">${n}格</button>`).join('')}<button data-action="patternCopy" ${!w.length?'disabled':''}>用这块重复</button>${undo}</div>${w.length?`<p>圈出的块：</p><div class="pattern-tiles">${observed.slice(0,w.length).map(v=>`<span>${esc(v)}</span>`).join('')}</div>`:''}${w.copied?`<p>复制出的整串：</p><div class="pattern-tiles">${generated.map(v=>`<span>${esc(v)}</span>`).join('')}</div>`:''}</div>`}
 if(['arithmetic','geometric'].includes(task.kind)){const knob=task.kind==='arithmetic'?w.step:w.factor,unit=task.kind==='arithmetic'?'跳数':'倍数';return `<div class="board pattern-board"><h3>${esc(task.context)} · ${unit} ${knob}</h3><div class="pattern-tiles">${w.terms.map(v=>`<span>${v}${task.kind==='geometric'?patternDots(v):''}</span>`).join('')}<span class="empty">?</span></div><p>相邻关系：${task.kind==='arithmetic'?w.terms.slice(1).map((v,i)=>v-w.terms[i]).join('、'):w.terms.slice(1).map((v,i)=>v/w.terms[i]).join('、')}</p><div class="work-buttons"><button data-action="patternAdjust" data-delta="-1" ${knob<=(task.kind==='arithmetic'?-8:1)?'disabled':''}>${unit}－1</button><button data-action="patternAdjust" data-delta="1" ${knob>=8?'disabled':''}>${unit}＋1</button><button data-action="patternAppend" ${w.terms.length>=task.initial.length+2?'disabled':''}>按${unit}添一项</button>${undo}</div></div>`}
 if(task.kind==='explicit')return `<div class="board pattern-board"><h3>${esc(task.context)} · ${task.operationOrder==='addThenMultiply'?'每轮先＋'+task.add+'，再×'+task.multiplier:'每轮先×'+task.multiplier+'，再＋'+task.add}</h3><div class="pattern-tiles">${w.terms.map(v=>`<span>${v}</span>`).join('')}<span class="empty">?</span></div><p>本轮起点 ${w.terms.at(-1)}；机器里现在 ${w.working}。</p><div class="work-buttons">${patternMachineControls(task,w)}<button data-action="patternCommit" ${w.phase!==2||w.terms.length>=task.initial.length+2?'disabled':''}>写下本轮结果</button>${undo}</div></div>`;
 if(task.kind==='twoPrev')return `<div class="board pattern-board"><h3>${esc(task.context)} · 每项用紧邻的前两项</h3><div class="pattern-tiles">${w.terms.map((v,i)=>`<button data-action="patternPick" data-index="${i}" aria-pressed="${w.selected.includes(i)}">第${i+1}项 ${v}</button>`).join('')}<span class="empty">?</span></div><p>已选 ${w.selected.map(i=>w.terms[i]).join('＋')||'无'}。</p><div class="work-buttons"><button data-action="patternSum" ${w.selected.length!==2||w.terms.length>=task.initial.length+task.count?'disabled':''}>合成下一项</button>${undo}</div></div>`;
 const cell=(r,c)=>{const value=r<patternGivenRows(task)?patternColorAt(task,r,c):(w.cells[`${r},${c}`]||'blank');return r<patternGivenRows(task)?`<span class="pattern-cell ${value}" role="img" aria-label="第${r+1}行第${c+1}列${value==='red'?'红':'蓝'}色，已给出"></span>`:`<button class="pattern-cell ${value}" data-action="patternCell" data-row="${r}" data-col="${c}" aria-label="第${r+1}行第${c+1}列，${value==='blank'?'未涂':value==='red'?'红':'蓝'}色，点按换色"></button>`};
 return `<div class="board pattern-board"><h3>${esc(task.context)} · ${task.tile?'按给出的两行三列重复块续铺':'每走一格换色'}</h3><div class="pattern-grid" style="--pattern-cols:${task.cols}" role="group" aria-label="${task.rows}行${task.cols}列周期方格">${Array.from({length:task.rows},(_,r)=>Array.from({length:task.cols},(_,c)=>cell(r,c)).join('')).join('')}</div><p class="tiny-note">空白 → 红 → 蓝 → 空白；前${patternGivenRows(task)}行是已知条件。</p><div class="work-buttons">${undo}</div></div>`;
}
function patternGrade(task){const w=patternState(task);let ok=false;
 if(task.kind==='period'){const observed=Array.from({length:3},()=>task.base).flat();ok=w.copied&&w.length===patternPrimitive(task)&&observed.every((v,i)=>v===observed[i%w.length])&&Array.from({length:w.length-1},(_,k)=>k+1).every(p=>!observed.every((v,i)=>v===observed[i%p]))}
 if(['arithmetic','geometric','explicit','twoPrev'].includes(task.kind)){const expected=patternExpected(task);ok=w.terms.length===task.initial.length+expected.length&&w.terms.slice(task.initial.length).every((v,i)=>v===expected[i]);if(task.kind==='arithmetic')ok=ok&&w.step===task.step;if(task.kind==='geometric')ok=ok&&w.factor===task.factor;if(task.kind==='explicit')ok=ok&&w.phase===0;if(task.kind==='twoPrev')ok=ok&&w.selected.length===0&&w.sums.length===task.count&&w.sums.every((pair,i)=>pair.length===2&&pair.includes(i)&&pair.includes(i+1))}
 if(task.kind==='grid')ok=Object.keys(w.cells).length===(task.rows-patternGivenRows(task))*task.cols&&Array.from({length:task.rows-patternGivenRows(task)},(_,r)=>r+patternGivenRows(task)).every(r=>Array.from({length:task.cols},(_,c)=>w.cells[`${r},${c}`]===patternColorAt(task,r,c)).every(Boolean));
 return {ok,incomplete:w.moves===0,reason:'先用同一个规则实际生成或涂出整个模型；短周期要排除更短的重复块。'};
}
function patternAct(action,data,task){const w=patternState(task);let changed=false;const save=(key,old)=>{w.log.push([key,old]);w.moves++;changed=true};
 if(action==='patternLength'&&task.kind==='period'){const n=Number(data.value),max=Math.min(task.base.length*2,task.base.length*3-1);if(Number.isInteger(n)&&n>=1&&n<=max){const old=[w.length,w.copied];w.length=n;w.copied=false;save('period',old)}}
 if(action==='patternCopy'&&task.kind==='period'&&w.length&&!w.copied){const old=w.copied;w.copied=true;save('copied',old)}
 if(action==='patternAdjust'&&['arithmetic','geometric'].includes(task.kind)){const d=Number(data.delta),key=task.kind==='arithmetic'?'step':'factor',v=w[key]+d;if([-1,1].includes(d)&&v>=(key==='step'?-8:1)&&v<=8){const old=w[key];w[key]=v;save(key,old)}}
 if(action==='patternAppend'&&['arithmetic','geometric'].includes(task.kind)&&w.terms.length<task.initial.length+2){const v=task.kind==='arithmetic'?w.terms.at(-1)+w.step:w.terms.at(-1)*w.factor;w.terms.push(v);save('popTerm',null)}
 if(action==='patternMultiply'&&task.kind==='explicit'&&w.phase===(task.operationOrder==='addThenMultiply'?1:0)){const old=[w.working,w.phase];w.working*=task.multiplier;w.phase=task.operationOrder==='addThenMultiply'?2:1;save('machine',old)}
 if(action==='patternAdd'&&task.kind==='explicit'&&w.phase===(task.operationOrder==='addThenMultiply'?0:1)){const old=[w.working,w.phase];w.working+=task.add;w.phase=task.operationOrder==='addThenMultiply'?1:2;save('machine',old)}
 if(action==='patternCommit'&&task.kind==='explicit'&&w.phase===2&&w.terms.length<task.initial.length+2){const old=[w.working,w.phase];w.terms.push(w.working);w.phase=0;save('commit',old)}
 if(action==='patternPick'&&task.kind==='twoPrev'){const i=Number(data.index);if(Number.isInteger(i)&&i>=0&&i<w.terms.length){const old=[...w.selected],at=w.selected.indexOf(i);if(at>=0)w.selected.splice(at,1);else if(w.selected.length<2)w.selected.push(i);else return false;save('selected',old)}}
 if(action==='patternSum'&&task.kind==='twoPrev'&&w.selected.length===2&&w.terms.length<task.initial.length+task.count){const old=[...w.selected];w.terms.push(w.selected.reduce((sum,i)=>sum+w.terms[i],0));w.sums.push([...w.selected]);w.selected=[];save('sum',old)}
 if(action==='patternCell'&&task.kind==='grid'){const r=Number(data.row),c=Number(data.col);if(Number.isInteger(r)&&Number.isInteger(c)&&r>=patternGivenRows(task)&&r<task.rows&&c>=0&&c<task.cols){const key=`${r},${c}`,old=w.cells[key]||'blank',next=old==='blank'?'red':old==='red'?'blue':'blank';if(next==='blank')delete w.cells[key];else w.cells[key]=next;save('cell',[key,old])}}
 if(action==='patternUndo'&&w.log.length){const [key,old]=w.log.pop();if(key==='period'){w.length=old[0];w.copied=old[1]}else if(key==='copied')w.copied=old;else if(key==='popTerm')w.terms.pop();else if(key==='machine'){w.working=old[0];w.phase=old[1]}else if(key==='commit'){w.terms.pop();w.working=old[0];w.phase=old[1]}else if(key==='selected')w.selected=old;else if(key==='sum'){w.terms.pop();w.sums.pop();w.selected=old}else if(key==='cell'){if(old[1]==='blank')delete w.cells[old[0]];else w.cells[old[0]]=old[1]}else w[key]=old;w.moves++;return true}
 return changed;
}
function patternSpeech(task){const w=patternState(task);
 if(task.kind==='period')return `原串是${Array.from({length:3},()=>task.base).flat().join('、')}。当前圈出${w.length}格${w.length?'：'+task.base.concat(task.base).slice(0,w.length).join('、'):''}；${w.copied?'已经按这组复制':'尚未复制'}。`;
 if(task.kind==='grid'){const name=v=>v==='red'?'红':v==='blue'?'蓝':'空';return `已涂${Object.keys(w.cells).length}格。`+Array.from({length:task.rows},(_,r)=>`第${r+1}行：`+Array.from({length:task.cols},(_,c)=>name(r<patternGivenRows(task)?patternColorAt(task,r,c):w.cells[`${r},${c}`])).join('、')).join('；')+'。'}
 if(task.kind==='explicit')return `当前数列${w.terms.join('、')}；本轮机器数${w.working}，${(task.operationOrder==='addThenMultiply'?['等待先加','已经加，等待乘','已乘，等待写下结果']:['等待先乘','已经乘，等待加','已加，等待写下结果'])[w.phase]}。`;
 if(task.kind==='twoPrev')return `当前数列${w.terms.join('、')}；选中${w.selected.map(i=>'第'+(i+1)+'项'+w.terms[i]).join('和')||'零项'}。`;
 return `当前数列${w.terms.join('、')}；${task.kind==='arithmetic'?'跳数'+w.step:'倍数'+w.factor}。`;
}
function patternPage(){const task=PATTERN_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 模式与递推操作</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${patternBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>先找到生成规则</h3><p class="muted">数列和方格都要按同一规则继续生成。可撤回最后一步；依据卡只记录所选理由。</p></section></aside></div>`}

'use strict';
const COORDINATE_TASKS={
 'L04.01':{kind:'machine',multiplier:2,add:1,inputs:[1,2,4],context:'输入输出机器',prompt:'机器的两张检验卡是1→3、2→5。调好“先乘、后加”的同一规则，亲手运行三张输入卡，求输入4的输出。',explain:'三张卡都按输入×2＋1运行，得到3、5、9；一个规则要同时符合多组对应。',reason:{prompt:'为什么不能只检验一张卡？',options:['同一规则必须同时符合两张检验卡','只要某一张碰巧对就行','输入4就一定输出4'],answer:0}},
 'L04.02':{kind:'pair',target:[2,3],maxX:5,maxY:5,context:'方格寻宝',prompt:'宝箱在横向2、纵向3。分别点横、纵刻度，再把宝箱落在两条定位线的交点。',explain:'数对(2,3)的第一位是横向2，第二位是纵向3。',reason:{prompt:'(2,3)第一位表示什么？',options:['横向位置2','纵向位置2','两位可以随意交换'],answer:0}},
 'L04.03':{kind:'order',targets:[[2,3],[3,2]],maxX:5,maxY:5,context:'A与B的位置',prompt:'把A(2,3)和B(3,2)分别落在网格上。每次先选要放的字母，再点横纵刻度和交点。',explain:'A横2纵3，B横3纵2；相同的两个数交换顺序会成为不同位置。',reason:{prompt:'A和B为什么不是同一个点？',options:['第一位与第二位分别控制不同方向','两个数一样就一定同点','先纵后横也没有关系'],answer:0}},
 'L04.04':{kind:'move',start:[1,2],dx:3,dy:2,maxX:5,maxY:5,context:'机器人走格',prompt:'机器人从(1,2)出发，向右3格、向上2格。用方向键逐格走到终点，不绕路。',explain:'横向1＋3＝4，纵向2＋2＝4；走5格到(4,4)。',reason:{prompt:'向右3格改变哪个数？',options:['只把横坐标加3','只把纵坐标加3','两个坐标都加3'],answer:0}},
 'L04.05':{kind:'table',pairs:[[1,3],[2,5],[3,7]],maxX:4,maxY:7,context:'表格变坐标图',prompt:'表格三行是输入1输出3、输入2输出5、输入3输出7。逐行选择横纵刻度，在图上放A、B、C三个对应点。',explain:'每一行变成一个数对：(1,3)、(2,5)、(3,7)，输入作横坐标，输出作纵坐标。',reason:{prompt:'表格的一行怎样变成图上的一点？',options:['同一行的输入和输出组成横纵数对','把第一行输入和最后一行输出随意配','输入与输出都放横轴'],answer:0}},
 'L04.06':{kind:'dynamic',startValue:1,step:2,duration:3,maxX:3,maxY:7,context:'机器人位置随时间变化',prompt:'0分钟机器人在位置1，每过1分钟向前2格。调好每分钟的变化，逐分钟运行到3分钟，同时看表格和位置图。',explain:'时间0、1、2、3对应位置1、3、5、7；起点1也要计入。',reason:{prompt:'为什么3分钟不是位置6？',options:['从原来的位置1再增加2×3格','0分钟必须在位置0','只看经过的分钟数'],answer:0}}
};
for(const [skillId,t] of Object.entries(COORDINATE_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:29,mode:'coordinateLab',phase:'练',hint:'先辨认横与纵或输入与输出，再让材料按关系实际变化。'});
if(typeof module!=='undefined')module.exports={COORDINATE_TASKS};

'use strict';
const COORDINATE_CASES={
 'L04.01':[
  [{kind:'machine',multiplier:2,add:1,inputs:[2,3,5],reverseIndex:2,context:'找回输入卡'},'机器2→5、3→7；输出11的输入卡丢了。调好同一规则，试输入并运行三张卡，找回丢失的输入。','先乘2后加1；丢失输入5，输出11。','由给输入求输出改为给输出反求输入'],
  [{kind:'machine',multiplier:3,add:1,inputs:[1,2,3],context:'三份复制机'},'检验卡1→4、2→7。独立调同一先乘后加规则，再运行输入3。','×3＋1，三张输出4、7、10。','无提示：乘数改变，验证两组关系'],
  [{kind:'machine',multiplier:2,add:2,inputs:[1,3,4],context:'印章机器'},'检验卡1→4、3→8。隔日调规则并运行三张输入卡，求输入4的输出。','×2＋2，得到4、8、10。','隔日：检验输入不等距，加数改变'],
  [{kind:'machine',multiplier:3,add:2,inputs:[1,2,4],reverseIndex:2,context:'逆向变数卡'},'机器1→5、2→8。输出14来自什么输入？独立运行规则并找回第三张输入。','×3＋2，输入4得到14。','备用：同时变规则和未知位置']
 ],
 'L04.02':[
  [{kind:'pair',target:[4,1],givenPoint:true,maxX:5,maxY:5,context:'从图读宝箱'},'图中已经放好A。分别点横纵刻度，再把它的位置写成数对。','A横4纵1，所以(4,1)。','由描述落点改为读图写数对'],
  [{kind:'pair',target:[1,4],maxX:5,maxY:5,context:'棋子定位'},'棋子在横1纵4。独立选两轴刻度并落点。','位置(1,4)。','无提示：横纵大小对调'],
  [{kind:'pair',target:[0,3],maxX:5,maxY:5,context:'纵轴上的气球'},'气球横向为0、纵向为3。隔日把它放进图中。','(0,3)在纵轴上。','隔日：包含零坐标'],
  [{kind:'pair',target:[3,0],givenPoint:true,maxX:5,maxY:5,context:'横轴上的旗子'},'图中A在横轴上。独立读出横纵位置，记录数对。','A为(3,0)。','备用：由图读取纵坐标0']
 ],
 'L04.03':[
  [{kind:'order',targets:[[0,3],[3,0]],maxX:5,maxY:5,context:'坐标轴上的两点'},'分别放A(0,3)和B(3,0)。先选字母，再定位两轴与交点。','A在纵轴，B在横轴；0在不同位置控制不同方向。','交换非零数与0，反例落在不同坐标轴'],
  [{kind:'order',targets:[[1,4],[4,1]],maxX:5,maxY:5,context:'交换位置卡'},'独立放好A(1,4)和B(4,1)。','A横1纵4，B横4纵1。','无提示：交换不同大小的两数'],
  [{kind:'order',targets:[[2,5],[5,2]],maxX:5,maxY:5,context:'两只风筝'},'隔日分别定位A(2,5)和B(5,2)。','两点互换横纵位置。','隔日：网格边界上的点'],
  [{kind:'order',targets:[[4,0],[0,4]],maxX:5,maxY:5,context:'零位置反例'},'独立落下A(4,0)和B(0,4)，两张卡都要用上。','A在横轴，B在纵轴。','备用：再次检验零坐标顺序']
 ],
 'L04.04':[
  [{kind:'move',start:[4,4],dx:-3,dy:-2,maxX:5,maxY:5,context:'机器人返回'},'机器人从(4,4)向左3格、向下2格。逐格返回，不绕路。','终点(1,2)，两轴分别减少。','右上位移改为左下反向位移'],
  [{kind:'move',start:[1,4],dx:3,dy:-2,maxX:5,maxY:5,context:'机器人下坡'},'从(1,4)向右3、向下2，独立走最短格数到终点。','终点(4,2)，共5格。','无提示：两个方向一增一减'],
  [{kind:'move',start:[3,1],dx:-2,dy:3,maxX:5,maxY:5,context:'隔日导航'},'从(3,1)向左2、向上3，逐格走到终点。','终点(1,4)。','隔日：改变水平与竖直方向组合'],
  [{kind:'move',start:[0,0],dx:2,dy:4,maxX:5,maxY:5,context:'原点出发'},'独立从(0,0)向右2、向上4，不绕路。','终点(2,4)，共6格。','备用：初始位置为原点']
 ],
 'L04.05':[
  [{kind:'table',direction:'read',pairs:[[1,2],[2,4],[3,6]],maxX:4,maxY:7,context:'坐标图变表格'},'图中A、B、C已经给出。逐点读横纵刻度，写进对应表行。','三行是(1,2)、(2,4)、(3,6)。','由表转图改为图转表，输入输出不能跨行混配'],
  [{kind:'table',pairs:[[0,1],[1,3],[2,5]],maxX:4,maxY:7,context:'零输入表'},'表格三行输入0、1、2，输出1、3、5。独立逐行落点。','A(0,1)、B(1,3)、C(2,5)。','无提示：表格包含0输入'],
  [{kind:'table',direction:'read',pairs:[[1,6],[2,4],[3,2]],maxX:4,maxY:7,context:'下降的点图'},'隔日从下降的A、B、C三点读数，并逐行记录表格。','(1,6)、(2,4)、(3,2)。','隔日：增量图改为下降关系'],
  [{kind:'table',pairs:[[3,6],[1,2],[2,4]],maxX:4,maxY:7,context:'打乱行顺序的表'},'表格按A(3,6)、B(1,2)、C(2,4)给出。独立逐行落点，保持字母对应。','行的顺序虽乱，每个字母仍要匹配自己的一行。','备用：表格行未按横坐标排序']
 ],
 'L04.06':[
  [{kind:'dynamic',startValue:7,step:-2,duration:3,maxX:3,maxY:7,context:'返回中的机器人'},'表格说0分钟在7、1分钟在5。每分钟变化相同；设定变化，运行到3分钟。','每分钟减2；位置7、5、3、1。','增长故事改为下降表格，初始位置非零'],
  [{kind:'dynamic',startValue:0,step:2,duration:3,maxX:3,maxY:7,context:'从原点前进'},'0分钟在0，每分钟前进2格。独立运行到3分钟。','位置0、2、4、6。','无提示：起点为0'],
  [{kind:'dynamic',startValue:1,step:3,duration:2,maxX:2,maxY:7,context:'快一步的机器人'},'0分钟在1，每分钟前进3格。隔日运行到2分钟。','位置1、4、7。','隔日：速率与总时间同时改变'],
  [{kind:'dynamic',startValue:6,step:-1,duration:3,maxX:3,maxY:7,context:'逐分钟返回'},'0分钟在6，每分钟退1格。独立运行到3分钟，逐点保留记录。','位置6、5、4、3。','备用：负变化与非零起点']
 ]
};
const coordinateStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(COORDINATE_CASES)){
 if(cases.length!==4)throw Error('Four L04 cases required: '+skillId);coordinateStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];coordinateStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:30,mode:'coordinateLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'先辨认已知与未知，按输入输出或横纵对应实际操作。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={COORDINATE_CASES};

'use strict';
function coordinateState(task){return draft.work??(draft.work={axisX:null,axisY:null,active:0,points:{},multiplier:1,add:0,inputs:(task.inputs||[]).map((v,i)=>i===task.reverseIndex?0:v),values:(task.inputs||[]).map((v,i)=>i===task.reverseIndex?0:v),phases:(task.inputs||[]).map(()=>0),rules:(task.inputs||[]).map(()=>({})),position:task.start?[...task.start]:[0,task.startValue??0],path:task.start?[[...task.start]]:[[0,task.startValue??0]],delta:0,time:0,trace:[[0,task.startValue??0]],moves:0,log:[]})}
function coordinateDots(n){return `<span class="coordinate-dots" role="img" aria-label="${n}个单位">${Array.from({length:n},()=>'<i aria-hidden="true"></i>').join('')}</span>`}
function coordinateGrid(task,w){const staticPoints=task.kind==='table'&&task.direction==='read'?task.pairs:task.kind==='pair'&&task.givenPoint?[task.target]:[],dynamic=task.kind==='dynamic',move=task.kind==='move',points=dynamic?Object.fromEntries(w.trace.map((p,i)=>[i,p])):move?{R:w.position}:w.points;
 const rows=Array.from({length:task.maxY+1},(_,i)=>task.maxY-i).map(y=>`<button class="coordinate-axis" data-action="coordAxis" data-axis="y" data-value="${y}" ${move||dynamic?'disabled':''} aria-pressed="${w.axisY===y}" aria-label="纵刻度${y}">${y}</button>`+Array.from({length:task.maxX+1},(_,x)=>{
  const fixed=staticPoints.map((p,i)=>p[0]===x&&p[1]===y?String.fromCharCode(65+i):'').filter(Boolean),placed=Object.entries(points).filter(([,p])=>p[0]===x&&p[1]===y).map(([i])=>dynamic?String(i):move?'🤖':String.fromCharCode(65+Number(i))),labels=[...fixed,...placed],trail=(move?w.path:dynamic?w.trace:[]).some(p=>p[0]===x&&p[1]===y),guide=w.axisX===x||w.axisY===y,cl=`coordinate-node${guide?' guide':''}${labels.length?' occupied':''}${trail?' trail':''}`;
  const accessible=`横${x}纵${y}${labels.length?'，'+labels.join('、'):''}`;
  return !move&&!dynamic&&!staticPoints.length?`<button class="${cl}" data-action="coordPoint" data-x="${x}" data-y="${y}" aria-label="${accessible}">${labels.join(' ')||'<i aria-hidden="true"></i>'}</button>`:`<span class="${cl}" role="img" aria-label="${accessible}">${labels.join(' ')||'<i aria-hidden="true"></i>'}</span>`;
 }).join('')).join('');
 return `<div class="coordinate-axis-title">↑ ${dynamic?'位置（格）':'纵坐标 y'}</div><div class="coordinate-grid" style="--coordinate-cols:${task.maxX+1}" role="group" aria-label="横轴从0到${task.maxX}，纵轴从0到${task.maxY}">${rows}<span></span>${Array.from({length:task.maxX+1},(_,x)=>`<button class="coordinate-axis" data-action="coordAxis" data-axis="x" data-value="${x}" ${move||dynamic?'disabled':''} aria-pressed="${w.axisX===x}" aria-label="横刻度${x}">${x}</button>`).join('')}</div><div class="coordinate-axis-end">${dynamic?'时间（分钟）':'横坐标 x'} →</div>`;
}
function coordinateBoard(task){const w=coordinateState(task),undo=`<button data-action="coordUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button>`;
 if(task.kind==='machine'){const rows=task.inputs.map((v,i)=>{const reverse=i===task.reverseIndex,output=v*task.multiplier+task.add,phase=w.phases[i];return `<section><h4>${i<2?'检验卡':'新卡'} ${i+1} · ${reverse?'输出给定 '+output:'输入 '+v}${i<2?'，应输出 '+output:''}</h4>${reverse?`<div class="work-buttons"><button data-action="coordInput" data-index="${i}" data-delta="-1" ${phase!==0||w.inputs[i]<=0?'disabled':''}>输入－1</button><strong>试输入 ${w.inputs[i]}</strong><button data-action="coordInput" data-index="${i}" data-delta="1" ${phase!==0||w.inputs[i]>=9?'disabled':''}>输入＋1</button></div>`:''}<p>机器内 ${w.values[i]} · ${['等待先乘','等待后加','已得到输出'][phase]}</p>${coordinateDots(w.values[i])}<div class="work-buttons"><button data-action="coordMultiply" data-index="${i}" ${phase!==0?'disabled':''}>按×${w.multiplier}复制</button><button data-action="coordAdd" data-index="${i}" ${phase!==1?'disabled':''}>再添${w.add}个</button></div></section>`}).join('');return `<div class="board coordinate-board"><h3>${esc(task.context)}</h3><div class="work-buttons"><button data-action="coordAdjust" data-key="multiplier" data-delta="-1" ${w.multiplier<=1?'disabled':''}>乘数－1</button><strong>×${w.multiplier}</strong><button data-action="coordAdjust" data-key="multiplier" data-delta="1" ${w.multiplier>=4?'disabled':''}>乘数＋1</button><button data-action="coordAdjust" data-key="add" data-delta="-1" ${w.add<=0?'disabled':''}>加数－1</button><strong>＋${w.add}</strong><button data-action="coordAdjust" data-key="add" data-delta="1" ${w.add>=4?'disabled':''}>加数＋1</button>${undo}</div><div class="coordinate-machine">${rows}</div></div>`}
 let controls='',table='';
 if(task.kind==='move')controls=`<p>当前位置 (${w.position.join(',')})；已走 ${w.path.length-1} 格。</p><div class="work-buttons">${[['左',-1,0],['右',1,0],['下',0,-1],['上',0,1]].map(([label,dx,dy])=>`<button data-action="coordMove" data-dx="${dx}" data-dy="${dy}">${label}1格</button>`).join('')}${undo}</div>`;
 else if(task.kind==='dynamic'){controls=`<p>第 ${w.time} 分钟 · 位置 ${w.position[1]} · 每分钟变化 ${w.delta}</p><div class="work-buttons"><button data-action="coordDelta" data-delta="-1" ${w.delta<=-4?'disabled':''}>变化－1</button><button data-action="coordDelta" data-delta="1" ${w.delta>=4?'disabled':''}>变化＋1</button><button data-action="coordTick" ${w.time>=task.duration?'disabled':''}>走过1分钟</button>${undo}</div>`;table=`<table class="coordinate-table"><thead><tr><th>时间（分）</th>${w.trace.map(([time])=>`<th>${time}</th>`).join('')}</tr></thead><tbody><tr><th>位置（格）</th>${w.trace.map(([,value])=>`<td>${value}</td>`).join('')}</tr></tbody></table>`}
 else{const count=task.kind==='order'?2:task.kind==='table'?task.pairs.length:1;controls=`<div class="work-buttons">${Array.from({length:count},(_,i)=>`<button data-action="coordActive" data-index="${i}" aria-pressed="${w.active===i}">${task.kind==='table'?'第'+(i+1)+'行 · ':''}${String.fromCharCode(65+i)}${task.kind==='order'?'('+task.targets[i].join(',')+')':''}</button>`).join('')}${(task.kind==='table'&&task.direction==='read')||(task.kind==='pair'&&task.givenPoint)?`<button data-action="coordRecord" ${w.axisX===null||w.axisY===null?'disabled':''}>把定位刻度写成数对</button>`:''}${undo}</div><p>当前定位：横 ${w.axisX??'未选'}，纵 ${w.axisY??'未选'}；${Object.entries(w.points).map(([i,p])=>String.fromCharCode(65+Number(i))+'('+p.join(',')+')').join('；')||'尚未记录点'}。</p>`;
  if(task.kind==='table')table=`<table class="coordinate-table"><thead><tr><th>点</th><th>输入（横）</th><th>输出（纵）</th></tr></thead><tbody>${task.pairs.map((p,i)=>{const shown=task.direction==='read'?w.points[i]:p;return `<tr><th>${String.fromCharCode(65+i)}</th><td>${shown?.[0]??'?'}</td><td>${shown?.[1]??'?'}</td></tr>`}).join('')}</tbody></table>`;
 }
 return `<div class="board coordinate-board"><h3>${esc(task.context)}</h3>${controls}${table}${coordinateGrid(task,w)}</div>`;
}
function coordinateGrade(task){const w=coordinateState(task),same=(a,b)=>a?.length===b?.length&&a.every((v,i)=>v===b[i]);let ok=false;
 if(task.kind==='machine')ok=w.multiplier===task.multiplier&&w.add===task.add&&w.values.every((v,i)=>w.phases[i]===2&&w.inputs[i]===task.inputs[i]&&v===task.inputs[i]*task.multiplier+task.add&&w.rules[i].multiplier===task.multiplier&&w.rules[i].add===task.add);
 if(task.kind==='pair')ok=same(w.points[0],task.target);
 if(task.kind==='order')ok=task.targets.every((p,i)=>same(w.points[i],p));
 if(task.kind==='table')ok=task.pairs.every((p,i)=>same(w.points[i],p));
 if(task.kind==='move')ok=same(w.position,[task.start[0]+task.dx,task.start[1]+task.dy])&&w.path.length-1===Math.abs(task.dx)+Math.abs(task.dy);
 if(task.kind==='dynamic')ok=w.delta===task.step&&w.time===task.duration&&w.trace.length===task.duration+1&&w.trace.every(([time,v],i)=>time===i&&v===task.startValue+task.step*i);
 return {ok,incomplete:w.moves===0,reason:task.kind==='machine'?'同一规则要在每张卡中先乘后加；检查多组输入输出。':task.kind==='dynamic'?'从0分钟的初始位置开始，逐分钟核对相同变化。':'先定位横刻度，再定位纵刻度；核对每个点或每步位移的实际位置。'};
}
function coordinateAct(action,data,task){const w=coordinateState(task),before=JSON.stringify({...w,log:[]});let changed=false;
 const index=Number(data.index),d=Number(data.delta),record=()=>{if(w.axisX!==null&&w.axisY!==null){w.points[w.active]=[w.axisX,w.axisY];changed=true}};
 if(action==='coordAxis'&&!['machine','move','dynamic'].includes(task.kind)){const value=Number(data.value),key=data.axis==='x'?'axisX':data.axis==='y'?'axisY':null,max=data.axis==='x'?task.maxX:task.maxY;if(key&&Number.isInteger(value)&&value>=0&&value<=max){w[key]=value;changed=true}}
 if(action==='coordActive'&&['pair','order','table'].includes(task.kind)){const count=task.kind==='pair'?1:task.kind==='order'?2:task.pairs.length;if(Number.isInteger(index)&&index>=0&&index<count){w.active=index;changed=true}}
 if(action==='coordPoint'&&['pair','order','table'].includes(task.kind)&&!task.givenPoint&&task.direction!=='read'){const x=Number(data.x),y=Number(data.y);if(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<=task.maxX&&y>=0&&y<=task.maxY&&w.axisX===x&&w.axisY===y)record()}
 if(action==='coordRecord'&&(task.givenPoint||task.direction==='read'))record();
 if(action==='coordAdjust'&&task.kind==='machine'&&['multiplier','add'].includes(data.key)&&[-1,1].includes(d)){const n=w[data.key]+d;if(n>=(data.key==='multiplier'?1:0)&&n<=4){w[data.key]=n;changed=true}}
 if(action==='coordInput'&&task.kind==='machine'&&index===task.reverseIndex&&[-1,1].includes(d)&&w.phases[index]===0){const n=w.inputs[index]+d;if(n>=0&&n<=9){w.inputs[index]=n;w.values[index]=n;changed=true}}
 if(task.kind==='machine'&&Number.isInteger(index)&&index>=0&&index<w.values.length){if(action==='coordMultiply'&&w.phases[index]===0){w.values[index]*=w.multiplier;w.rules[index].multiplier=w.multiplier;w.phases[index]=1;changed=true}if(action==='coordAdd'&&w.phases[index]===1){w.values[index]+=w.add;w.rules[index].add=w.add;w.phases[index]=2;changed=true}}
 if(action==='coordMove'&&task.kind==='move'){const dx=Number(data.dx),dy=Number(data.dy),x=w.position[0]+dx,y=w.position[1]+dy;if(Number.isInteger(dx)&&Number.isInteger(dy)&&Math.abs(dx)+Math.abs(dy)===1&&x>=0&&x<=task.maxX&&y>=0&&y<=task.maxY){w.position=[x,y];w.path.push([x,y]);changed=true}}
 if(action==='coordDelta'&&task.kind==='dynamic'&&[-1,1].includes(d)&&w.delta+d>=-4&&w.delta+d<=4){w.delta+=d;changed=true}
 if(action==='coordTick'&&task.kind==='dynamic'&&w.time<task.duration){const y=w.position[1]+w.delta;if(y>=0&&y<=task.maxY){w.time++;w.position=[w.time,y];w.trace.push([...w.position]);changed=true}}
 if(action==='coordUndo'&&w.log.length){const log=w.log,snapshot=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,snapshot,{log,moves});return true}
 if(changed){w.log.push(before);w.moves++;return true}return false;
}
function coordinateSpeech(task){const w=coordinateState(task);if(task.kind==='machine')return `当前规则先乘${w.multiplier}后加${w.add}。`+w.values.map((v,i)=>`第${i+1}张输入${w.inputs[i]}，机器内${v}，${['尚未乘','已乘等待加','已输出'][w.phases[i]]}`).join('；');if(task.kind==='dynamic')return w.trace.map(([t,p])=>`${t}分钟在位置${p}`).join('；')+`；当前每分钟变化${w.delta}。`;if(task.kind==='move')return `当前位置横${w.position[0]}纵${w.position[1]}，已走${w.path.length-1}格。`;const given=task.kind==='table'&&task.direction==='read'?task.pairs:task.givenPoint?[task.target]:[];return `已选横刻度${w.axisX??'无'}，纵刻度${w.axisY??'无'}。`+given.map((p,i)=>`图中${String.fromCharCode(65+i)}横${p[0]}纵${p[1]}`).join('；')+Object.entries(w.points).map(([i,p])=>`已记录${String.fromCharCode(65+Number(i))}横${p[0]}纵${p[1]}`).join('；')}
function coordinatePage(){const task=COORDINATE_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 表格、坐标与变化</p><h1>${esc(skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${coordinateBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>把对应关系做出来</h3><p class="muted">横、纵刻度从0开始。数对需要分别定位两轴；机器和时间图需要实际运行。每一步可撤回。</p></section></aside></div>`}


'use strict';
function chanceBag(colors,extra={}){return {type:'bag',name:'混匀袋中每个球等可能',atoms:colors.map((color,i)=>({id:'B'+(i+1),label:color+'球'+(i+1),color})),...extra}}
function chanceCoin(extra={}){return {type:'coin',name:'公平硬币',atoms:[{id:'H',label:'正',color:'正'},{id:'T',label:'反',color:'反'}],...extra}}
function chanceDie(n=3,extra={}){return {type:'die',name:'等可能编号卡',atoms:Array.from({length:n},(_,i)=>({id:'F'+(i+1),label:String(i+1),color:String(i+1)})),...extra}}
function chanceSpinner(sectors,extra={}){return {type:'spinner',name:'面积等效的等角小扇区',sectors:sectors.map(([color,size])=>({color,size})),atoms:sectors.flatMap(([color,size],sector)=>Array.from({length:size},(_,i)=>({id:`S${sector+1}-${i+1}`,label:color+'等角片'+(i+1),color,sector}))),...extra}}
const CHANCE_TASKS={
 'D03.01':{kind:'certainty',models:[chanceBag(['红','红','红'],{event:{type:'color',color:'红'},eventLabel:'取到红球'}),chanceBag(['蓝','蓝'],{event:{type:'color',color:'绿'},eventLabel:'取到绿球'}),chanceBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'取到红球'})],prompt:'分别亲手收录每袋的全部具体球身份，圈所问事件的球，判断一定、不可能或可能但不一定。没有有利结果时明确标空。',explain:'全红袋红球一定，蓝袋绿球不可能；3红1蓝更可能取红但仍可能取蓝，不是一定。'},
 'D03.02':{kind:'space',models:[chanceBag(['红','红','蓝'],{event:{type:'all'},eventLabel:'所有具体身份'})],prompt:'亲手逐球列一次取球的全部具体结果。两个红球颜色相同但编号不同；每个原身份收录一次，删除重复并补缺项。',explain:'B1、B2、B3是3个等可能原球身份，不能合并成只有红、蓝两个等可能结果。'},
 'D03.03':{kind:'equal',models:[chanceBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'颜色红与蓝是否等可能'})],prompt:'列全等可能原球身份，再区分“具体球等可能”与“红蓝颜色事件等可能”，分别作判断。',explain:'4个具体球各1/4；红3个身份、蓝1个身份，颜色概率3/4与1/4，不相等。'},
 'D03.04':{kind:'favorable',models:[chanceDie(4,{event:{type:'even'},eventLabel:'编号为偶数'})],prompt:'列全等可能编号卡，逐条圈有利结果“编号为偶数”，填写有利结果/全部结果的概率。可用等值分数。',explain:'2、4两个有利，共4个等可能结果；2/4＝1/2。'},
 'D03.05':{kind:'two',models:[chanceCoin({second:chanceCoin(),replacement:true,event:{type:'exact',color:'正',count:1},eventLabel:'两次恰好一次正面'})],prompt:'两次独立抛公平硬币。实际摆第一、第二次卡，按第一结果收录完整树，圈恰好一次正面的叶，填写概率。',explain:'正正、正反、反正、反反共4；正反、反正有利，2/4＝1/2。'},
 'D03.06':{kind:'weighted',models:[chanceSpinner([['红',3],['蓝',1]],{event:{type:'color',color:'红'},eventLabel:'转到红色',compare:['红','蓝']})],prompt:'转盘红色占270°、蓝色90°，按4块等角原片逐片收录并圈红色片，填写概率，比较红蓝哪个更可能。',explain:'按等角小扇区计，红3/4、蓝1/4；两种颜色不代表各1/2。'}
};
for(const [skillId,t] of Object.entries(CHANCE_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'chanceLab',contentVersion:61,phase:'练',context:'具体结果、事件与等可能条件',hint:'先列全具体等可能身份；两次按第一结果逐分支摆卡。颜色是事件，不自动是等可能基本结果。',reason:{prompt:'概率结论需要什么依据？',options:['完整列举具体结果，先确认基本结果等可能，再把所问事件的有利身份或叶与全体比较','只看有几种颜色就平均分概率','尝试没出现某结果就能证明它不可能'],answer:0}});
if(typeof module!=='undefined')module.exports={CHANCE_TASKS,chanceBag,chanceCoin,chanceDie,chanceSpinner};

'use strict';
const chanceFactory=typeof module!=='undefined'?require('./chance'):{chanceBag,chanceCoin,chanceDie,chanceSpinner},cBag=chanceFactory.chanceBag,cCoin=chanceFactory.chanceCoin,cDie=chanceFactory.chanceDie,cSpin=chanceFactory.chanceSpinner;
const CHANCE_CASES={
 'D03.01':[
  [[cCoin({event:{type:'all'},eventLabel:'出现正或反'}),cCoin({event:{type:'color',color:'侧立'},eventLabel:'本题模型仅正反，问出现侧立'})],'按仅含正反的公平硬币模型列全并判断两事件。','正或反一定；模型内侧立不可能。','球袋改明确的两结果模型'],
  [[cDie(3,{event:{type:'even'},eventLabel:'偶数'}),cDie(3,{event:{type:'color',color:'4'},eventLabel:'编号4'})],'独立列全三张等可能卡，圈事件并判一定/不可能/可能。','偶数可能非一定，4不可能。','无提示：编号条件与不存在结果'],
  [[cBag(['蓝','蓝','蓝','红'],{event:{type:'color',color:'蓝'},eventLabel:'取蓝'}),cBag(['红'],{event:{type:'color',color:'红'},eventLabel:'取红'})],'隔日列全各袋实际球并判断事件；更可能仍不保证发生。','第一袋蓝可能非一定，第二袋红一定。','隔日：更可能反例与单球边界'],
  [[cSpin([['红',1],['蓝',1]],{event:{type:'color',color:'绿'},eventLabel:'绿'}),cSpin([['红',2]],{event:{type:'color',color:'红'},eventLabel:'红'})],'独立列转盘等角片结果并判断事件范围。','绿不可能；全红盘红一定。','备用：转盘与空/全事件']
 ],
 'D03.02':[
  [[cCoin({second:cCoin(),replacement:true,event:{type:'all'},eventLabel:'全部两次叶'})],'自己摆两次硬币卡并按第一结果列完整树，每个叶收录一次。','正正、正反、反正、反反共4。','一次身份改两阶段样本树'],
  [[cBag(['红','红','蓝','绿'],{event:{type:'all'},eventLabel:'所有球身份'})],'独立列全一次抽球的具体编号结果，不能合并同色。','4个不同具体球身份。','无提示：三颜色不等于四个球'],
  [[cDie(3,{second:cCoin(),replacement:true,event:{type:'all'},eventLabel:'编号加硬币'})],'隔日先抽等可能编号1/2/3，再抛硬币，摆卡列全结果树。','每编号有正反，共6叶。','隔日：两个不同设备的顺序步骤'],
  [[cSpin([['红',2],['蓝',1]],{event:{type:'all'},eventLabel:'全部等角片'})],'独立按3片等角基本结果收录转盘样本空间。','三个等角结果，红事件包含其中两个。','备用：扇区分割与事件身份']
 ],
 'D03.03':[
  [[cCoin({event:{type:'all'},eventLabel:'正反是否等可能'})],'列全公平硬币基本结果，分别判断基本结果与正反事件等可能。','基本结果等可能，两个单结果事件也相等。','颜色不等例改等可能正反边界'],
  [[cSpin([['红',1],['蓝',3]],{event:{type:'color',color:'蓝'},eventLabel:'红蓝是否等可能'})],'独立收录所有等角片，判断等角基本结果与红蓝事件是否等可能。','等角片各1/4，颜色1/4与3/4不相等。','无提示：非等大实际扇区'],
  [[cBag(['红','红','蓝','蓝'],{event:{type:'all'},eventLabel:'颜色是否等可能'})],'隔日列全部四球身份，再判断球与颜色的等可能性。','每球等可能，红蓝各2/4也相等。','隔日：颜色频数相等的有效条件'],
  [[cBag(['红','红','红','蓝','绿'],{event:{type:'all'},eventLabel:'三个颜色是否都等可能'})],'独立列五球身份并判断基本球和三个颜色事件的等可能性。','具体球相等，红3/5与蓝绿各1/5不全相等。','备用：三个事件中只有两个相等']
 ],
 'D03.04':[
  [[cBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'红球'})],'列全部具体球身份，圈红事件身份后填概率。','3/4。','编号条件改颜色合并事件'],
  [[cDie(5,{event:{type:'atLeast',value:4},eventLabel:'编号至少4'})],'独立列1至5，圈编号至少4的结果并填写概率。','4、5有利，2/5。','无提示：不等式事件与五结果'],
  [[cCoin({second:cCoin(),replacement:true,event:{type:'atLeastCount',color:'正',count:1},eventLabel:'至少一次正面'})],'隔日列两次硬币结果并圈至少一次正面，填写概率。','正正、正反、反正，共3/4。','隔日：恰好改至少的事件差别'],
  [[cBag(['红','蓝'],{event:{type:'color',color:'绿'},eventLabel:'绿球'})],'独立列具体球，明确标无有利结果并填写绿事件概率。','0/2＝0。','备用：空事件概率']
 ],
 'D03.05':[
  [[cDie(3,{second:cCoin(),replacement:true,event:{type:'firstEvenSecond',color:'正'},eventLabel:'编号偶数且硬币正面'})],'先抽编号1/2/3，再抛硬币，列完整树并圈两个条件都满足的叶，填概率。','仅2正有利，1/6。','两个不同设备与且条件'],
  [[cBag(['红','红','蓝'],{second:cBag(['红','红','蓝']),replacement:false,event:{type:'both',color:'红'},eventLabel:'两次均红，不放回'})],'独立从三球混匀袋连续取两球不放回，列具体身份树，圈两次都红的叶，填概率。','B1B2、B2B1有利，2/6＝1/3。','无提示：不放回，第二支不能重复原身份'],
  [[cCoin({second:cCoin(),replacement:true,event:{type:'same'},eventLabel:'两次相同'})],'隔日两次独立公平硬币，列树圈两次相同并填概率。','正正、反反，共2/4。','隔日：事件由恰好一次改同结果'],
  [[cBag(['红','蓝'],{second:cBag(['红','蓝']),replacement:true,event:{type:'both',color:'红'},eventLabel:'两次均红，每次放回'})],'独立两球袋取一次放回混匀再取，列树圈两次红，填概率。','红红有利，1/4；同一球身份可以再次取到。','备用：放回与不放回条件对照']
 ],
 'D03.06':[
  [[cBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'取红',compare:['红','蓝']})],'转盘换球袋：列等可能具体球，圈红事件、填概率并比较红蓝。','红3/4，蓝1/4。','角度权重换实际球频数'],
  [[cSpin([['红',1],['蓝',2],['绿',1]],{event:{type:'color',color:'蓝'},eventLabel:'蓝色',compare:['红','蓝']})],'独立按等角片列转盘空间，圈蓝、填概率并比较红蓝。','蓝2/4＝1/2，红1/4；蓝更可能。','无提示：三色与非等大扇区'],
  [[cSpin([['红',2],['蓝',2]],{event:{type:'color',color:'红'},eventLabel:'红色',compare:['红','蓝']})],'隔日按四等角片列空间，圈红事件并比较两个颜色概率。','红蓝各2/4，相同。','隔日：等大事件边界'],
  [[cBag(['红','蓝','蓝','蓝','蓝'],{event:{type:'color',color:'蓝'},eventLabel:'蓝球',compare:['红','蓝']})],'独立列五个具体球，圈蓝球身份、填概率并比较红蓝。','蓝4/5，红1/5，蓝更可能。','备用：多球身份和方向反转']
 ]
};
const chanceSource=typeof module!=='undefined'?require('./chance').CHANCE_TASKS:CHANCE_TASKS,chanceTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(CHANCE_CASES)){chanceTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [models,prompt,explain,changeDimension]=cases[i];chanceTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'chanceLab',kind:chanceSource[skillId].kind,contentVersion:62,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',models,prompt,explain,changeDimension,context:'完整空间与有利结果',...(stage==='transfer'?{hint:'从等可能基本身份开始，按第一结果列所有后续；明确放回/不放回与事件条件。'}:{})}}}
if(typeof module!=='undefined')module.exports={CHANCE_CASES};

'use strict';
function chanceOutcomes(m){return m.second?m.atoms.flatMap(a=>m.second.atoms.filter(b=>m.replacement!==false||a.id!==b.id).map(b=>[a.id,b.id])):m.atoms.map(a=>[a.id])}
function chanceLegal(m,tuple){return tuple.length===(m.second?2:1)&&m.atoms.some(a=>a.id===tuple[0])&&(!m.second||m.second.atoms.some(b=>b.id===tuple[1])&&(m.replacement!==false||tuple[0]!==tuple[1]))}
function chanceFavorable(m,tuple){const values=tuple.map((id,i)=>(i===0?m:m.second).atoms.find(p=>p.id===id)),e=m.event;if(!values.every(Boolean))return false;if(e.type==='all')return true;if(e.type==='color')return values[0].color===e.color;if(e.type==='even')return Number(values[0].color)%2===0;if(e.type==='atLeast')return Number(values[0].color)>=e.value;if(e.type==='exact')return values.filter(p=>p.color===e.color).length===e.count;if(e.type==='atLeastCount')return values.filter(p=>p.color===e.color).length>=e.count;if(e.type==='both')return values.every(p=>p.color===e.color);if(e.type==='same')return values.every(p=>p.color===values[0].color);if(e.type==='firstEvenSecond')return Number(values[0].color)%2===0&&values[1].color===e.color;return false}
function chanceLabelEqual(m){const counts={};for(const p of m.atoms)counts[p.color]=(counts[p.color]||0)+1;return new Set(Object.values(counts)).size===1}
function chanceCertainty(m){const all=chanceOutcomes(m),n=all.filter(t=>chanceFavorable(m,t)).length;return n===0?'impossible':n===all.length?'certain':'possible'}
function chanceCompare(m){const counts=m.compare.map(color=>m.atoms.filter(p=>p.color===color).length);return counts[0]===counts[1]?'equal':counts[0]>counts[1]?'first':'second'}
function chanceState(t){return draft.work??(draft.work={models:t.models.map(()=>({slots:['',''],records:[],serial:0,favorable:[],empty:false,numerator:0,denominator:0,certainty:'',basic:'',labels:'',compare:''})),moves:0,log:[]})}
function chanceColor(color){return {'红':'#f07863','蓝':'#78add7','绿':'#78b59e','正':'#e4c15c','反':'#90b1c6'}[color]||'#b6d6c5'}
function chanceWedge(start,angle){const cx=160,cy=145,r=105,point=a=>[cx+r*Math.cos((a-90)*Math.PI/180),cy+r*Math.sin((a-90)*Math.PI/180)],a=point(start),b=point(start+angle);return angle>=359.999?`M${cx-r},${cy}a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0Z`:`M${cx},${cy}L${a.join(',')}A${r},${r} 0 ${angle>180?1:0},1 ${b.join(',')}Z`}
function chanceSpinnerSvg(m){if(m.type!=='spinner')return '';let start=0;const n=m.atoms.length;return `<svg viewBox="0 0 320 280" role="img" aria-label="${esc(m.sectors.map(s=>s.color+s.size*360/n+'度').join('、'))}">${m.sectors.map(s=>{const angle=s.size*360/n,path=chanceWedge(start,angle);start+=angle;return `<path d="${path}" fill="${chanceColor(s.color)}" stroke="#334e54" stroke-width="2"/>`}).join('')}${m.atoms.map((p,i)=>`<path d="${chanceWedge(i*360/n,360/n)}" fill="none" stroke="#fff" stroke-dasharray="4 3"/>`).join('')}<text x="160" y="270" text-anchor="middle" font-size="17">每个等角原片${360/n}°</text></svg>`}
function chanceBoard(t){const w=chanceState(t);return `<div class="board chance-board"><h3>${esc(t.context)}</h3><div class="work-buttons"><button data-action="chanceUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${t.models.map((m,index)=>{const s=w.models[index],needsEvent=['certainty','favorable','two','weighted'].includes(t.kind);return `<section class="chance-model"><h4>实验盘${index+1} · ${esc(m.name)}</h4><p>本模型${m.type==='spinner'?'每个等角小扇区':m.type==='coin'?'公平正反':m.type==='bag'?'每个原球':'每张原卡'}等可能。${m.second?`第二次：${esc(m.second.name)}；${m.replacement===false?'不放回，同一原球身份不能再取':'独立/放回，按本题可再出现同一结果'}。`:''}</p>${chanceSpinnerSvg(m)}<p>所问：${esc(m.eventLabel)}</p>${[m,...(m.second?[m.second]:[])].map((device,slot)=>`<section><b>第${slot+1}次来源 → 选择位：${esc(s.slots[slot]||'未摆')}</b><div class="work-buttons">${device.atoms.map(p=>`<button class="chance-atom" style="--atom-color:${chanceColor(p.color)}" data-action="chanceAtom" data-index="${index}" data-slot="${slot}" data-id="${p.id}" ${slot===1&&m.replacement===false&&s.slots[0]===p.id?'disabled':''} aria-pressed="${s.slots[slot]===p.id}">${esc(p.label)}<small>${p.id}</small></button>`).join('')}</div></section>`).join('')}<div class="work-buttons"><button data-action="chanceRecord" data-index="${index}" ${s.slots[0]&&(!m.second||s.slots[1])?'':'disabled'}>收录这一次具体结果/叶</button></div><div class="chance-tree">${m.atoms.map(a=>`<section><h5>首结果 ${esc(a.label)}（${a.id}）</h5>${s.records.filter(r=>r.tuple[0]===a.id).map(r=>`<div class="chance-leaf"><span>${r.tuple.map((id,slot)=>{const p=(slot?m.second:m).atoms.find(p=>p.id===id);return esc((p?.label||id)+'（'+id+'）')}).join(' → ')}</span>${needsEvent?`<button data-action="chanceFavor" data-index="${index}" data-id="${r.id}" aria-pressed="${s.favorable.includes(r.id)}">${s.favorable.includes(r.id)?'已圈有利叶':'圈为有利叶'}</button>`:''}<button data-action="chanceDelete" data-index="${index}" data-id="${r.id}">删这条记录</button></div>`).join('')||'<p>尚无记录</p>'}</section>`).join('')}</div>${needsEvent?`<div class="work-buttons"><button data-action="chanceEmpty" data-index="${index}" aria-pressed="${s.empty}">事件无有利结果</button></div>`:''}${['favorable','two','weighted'].includes(t.kind)?`<div class="work-buttons"><b>我填概率 ${s.numerator}/${s.denominator||'待填'}</b>${['numerator','denominator'].map(key=>`<span>${key==='numerator'?'分子':'分母'}</span>${[-1,1,5].map(delta=>`<button data-action="chanceAmount" data-index="${index}" data-key="${key}" data-delta="${delta}" ${s[key]+delta>=0&&s[key]+delta<=100?'':'disabled'}>${delta>0?'＋':'－'}${Math.abs(delta)}</button>`).join('')}`).join('')}</div>`:''}${t.kind==='certainty'?`<div class="work-buttons">${[['certain','一定'],['impossible','不可能'],['possible','可能但不一定']].map(([value,label])=>`<button data-action="chanceChoice" data-index="${index}" data-key="certainty" data-value="${value}" aria-pressed="${s.certainty===value}">${label}</button>`).join('')}</div>`:''}${t.kind==='equal'?['basic','labels'].map(key=>`<div class="work-buttons"><b>${key==='basic'?'可收录的基本身份/等角原片':'按颜色/标签合并后的全部事件'}是否都等可能？</b>${[['yes','是'],['no','否']].map(([value,label])=>`<button data-action="chanceChoice" data-index="${index}" data-key="${key}" data-value="${value}" aria-pressed="${s[key]===value}">${label}</button>`).join('')}</div>`).join(''):''}${t.kind==='weighted'?`<div class="work-buttons"><b>比较${esc(m.compare.join('与'))}</b>${[['first',m.compare[0]+'更可能'],['second',m.compare[1]+'更可能'],['equal','一样可能']].map(([value,label])=>`<button data-action="chanceChoice" data-index="${index}" data-key="compare" data-value="${value}" aria-pressed="${s.compare===value}">${esc(label)}</button>`).join('')}</div>`:''}</section>`}).join('')}</div>`}
function chanceGrade(t){const w=chanceState(t);const ok=t.models.every((m,index)=>{const s=w.models[index],all=chanceOutcomes(m),keys=s.records.map(r=>JSON.stringify(r.tuple));let good=keys.length===all.length&&new Set(keys).size===all.length&&all.every(p=>keys.includes(JSON.stringify(p)))&&s.records.every(r=>chanceLegal(m,r.tuple));if(['certainty','favorable','two','weighted'].includes(t.kind)){const favor=s.records.filter(r=>chanceFavorable(m,r.tuple)).map(r=>r.id);good=good&&s.favorable.length===favor.length&&favor.every(id=>s.favorable.includes(id))&&(favor.length?!s.empty:s.empty);if(t.kind==='certainty')good=good&&s.certainty===chanceCertainty(m);else good=good&&s.denominator>0&&s.numerator>=0&&s.numerator<=s.denominator&&s.numerator*all.length===s.denominator*all.filter(p=>chanceFavorable(m,p)).length}if(t.kind==='equal')good=good&&s.basic==='yes'&&s.labels===(chanceLabelEqual(m)?'yes':'no');if(t.kind==='weighted')good=good&&s.compare===chanceCompare(m);return good});return {ok,incomplete:w.moves===0,reason:'具体身份/等角片/两次叶必须全部恰好一次。按事件定义圈有利叶，先确认基本结果等可能再计概率；放回条件改变合法后续，同颜色或同标签不自动等可能。'}}
function chanceAct(action,data,t){const w=chanceState(t),index=Number(data.index),m=t.models[index],s=w.models[index],slot=Number(data.slot),delta=Number(data.delta),snapshot=JSON.stringify({...w,log:[]});let changed=false;
 if(action==='chanceAtom'&&m&&[0,1].includes(slot)){const device=slot?m.second:m;if(device?.atoms.some(p=>p.id===data.id)&&!(slot===1&&m.replacement===false&&s.slots[0]===data.id)){s.slots[slot]=data.id;if(slot===0&&m.replacement===false&&s.slots[1]===data.id)s.slots[1]='';changed=true}}
 if(action==='chanceRecord'&&m&&chanceLegal(m,s.slots.slice(0,m.second?2:1))&&s.records.length<50){s.records.push({id:'R'+(++s.serial),tuple:s.slots.slice(0,m.second?2:1)});s.slots=['',''];changed=true}
 if(action==='chanceDelete'&&s){const at=s.records.findIndex(r=>r.id===data.id);if(at>=0){s.records.splice(at,1);s.favorable=s.favorable.filter(id=>id!==data.id);changed=true}}
 if(action==='chanceFavor'&&s&&s.records.some(r=>r.id===data.id)){const at=s.favorable.indexOf(data.id);at<0?s.favorable.push(data.id):s.favorable.splice(at,1);s.empty=false;changed=true}
 if(action==='chanceEmpty'&&s){s.empty=!s.empty;if(s.empty)s.favorable=[];changed=true}
 if(action==='chanceAmount'&&s&&['numerator','denominator'].includes(data.key)&&[-1,1,5].includes(delta)&&s[data.key]+delta>=0&&s[data.key]+delta<=100){s[data.key]+=delta;changed=true}
 if(action==='chanceChoice'&&s&&({certainty:['certain','impossible','possible'],basic:['yes','no'],labels:['yes','no'],compare:['first','second','equal']}[data.key]||[]).includes(data.value)){s[data.key]=data.value;changed=true}
 if(action==='chanceUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});return true}if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function chanceSpeech(t){const w=chanceState(t);return t.models.map((m,i)=>`${m.name}；事件${m.eventLabel}；已录${w.models[i].records.length}个具体结果：${w.models[i].records.map(r=>r.tuple.join('然后')).join('、')||'无'}；有利圈${w.models[i].favorable.length}个；填概率${w.models[i].numerator}/${w.models[i].denominator||'未填'}；判断${w.models[i].certainty||w.models[i].compare||w.models[i].labels||'未选'}`).join('。')}
function chancePage(){const t=CHANCE_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!t||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(t.skillId)} · 概率</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(t.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(t.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${chanceBoard(t)}${reasonBlock(t)}${actionRow(t)}</article><aside class="side-stack"><section class="panel"><h3>原结果与合并事件</h3><p>同色不同编号是不同球；转盘用等角基本片比较实际角度。完整树按第一结果逐分支列举，不能用试验没出现来证明不可能。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={chanceOutcomes,chanceLegal,chanceFavorable,chanceLabelEqual,chanceCertainty,chanceCompare,chanceWedge};

'use strict';
function motionPolygon(points,steps,extra={}){return {points:points.map(([x,y],i)=>({id:String.fromCharCode(65+i),x,y})),steps,...extra}}
function motionFoldPaper(folds,cuts,extra={}){return {size:4,folds,cuts,...extra}}
const MV={type:'reflect',axis:'vertical',value:0},MH={type:'reflect',axis:'horizontal',value:0},MD={type:'reflect',axis:'diagonal',value:0},FX={axis:'vertical',value:1.5,from:'low'},FY={axis:'horizontal',value:1.5,from:'low'};
const MOTION_TASKS={
 'S01.01':{kind:'axis',...motionPolygon([[-2,0],[0,2],[2,0],[0,-1]],[MV]),prompt:'找出这只风筝的对称轴。先选择原点编号，在网格标每个点镜映后的预测位置，再锁定预测；选择轴实际镜映，核验各点对应与原图是否重合。',explain:'竖轴x＝0；A与C互换，B和D在轴上对应自己，整个图保持相同。'},
 'S01.02':{kind:'mirror',...motionPolygon([[1,0],[3,0],[1,2]],[MV]),prompt:'先预测三点关于竖线x＝0镜映后的对应位置；锁定后选择这根轴，实际镜映原三角形并检验朝向。',explain:'A(−1,0)、B(−3,0)、C(−1,2)；离轴距离相同，镜映改变朝向。'},
 'S01.03':{kind:'rotate',...motionPolygon([[2,1],[3,1],[2,2]],[{type:'rotate',cx:1,cy:1,angle:90,direction:'cw'}]),prompt:'三角形绕(1,1)顺时针旋转90°。先在网格预测各点，再锁定；点旋转中心、设方向角度并真正转动原图。',explain:'相对中心转四分之一圈，得到A(1,0)、B(1,−1)、C(2,0)。中心不应默认原点。'},
 'S01.04':{kind:'translate',...motionPolygon([[-2,-1],[0,-1],[-2,1]],[{type:'translate',dx:2,dy:1}]),prompt:'把三角形向右2格、向上1格平移。先预测每点位置，再锁定；设置同一位移，让原点整体实际移动。',explain:'每点都加(2,1)，朝向和大小不变：A(0,0)、B(2,0)、C(0,2)。'},
 'S01.05':{kind:'fold',...motionFoldPaper([FX,FY],[[3,3]]),prompt:'4×4方格纸，先把左半沿x＝1.5折向右，再把下半沿y＝1.5折向上；在叠层格(3,3)剪一个方孔。先圈完全展开的预测孔格，再锁定，亲手折、剪、逐次展开核验。',explain:'叠层(3,3)来自原格(0,0)、(0,3)、(3,0)、(3,3)。剪一次穿四层，完全展开有四孔。'}
};
for(const [skillId,t] of Object.entries(MOTION_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'motionLab',contentVersion:63,phase:'练',context:'先预测、再变换、逐帧检验',hint:'镜映看轴的等距对应，旋转看指定中心与方向角，平移每点同向同距；折纸保留每层原身份，剪孔穿过当前叠层。',reason:{prompt:'什么能证明预测与实际变换一致？',options:['原身份逐点对应，轴/中心/方向/位移正确；折纸剪到的是同一叠层中所有原格，展开逐层保留孔','只要最后外形相像，不用核对点的原编号','旋转总围绕原点，剪一次总只有一个孔'],answer:0}});
if(typeof module!=='undefined')module.exports={MOTION_TASKS,motionPolygon,motionFoldPaper,MV,MH,MD,FX,FY};

'use strict';
const motionFactory=typeof module!=='undefined'?require('./motion'):{motionPolygon,motionFoldPaper,MV,MH,MD,FX,FY},mp=motionFactory.motionPolygon,mf=motionFactory.motionFoldPaper,mv=motionFactory.MV,mh=motionFactory.MH,md=motionFactory.MD,fx=motionFactory.FX,fy=motionFactory.FY;
const MOTION_CASES={
 'S01.01':[
  [mp([[0,-2],[2,0],[0,2],[-1,0]],[mh]),'找横向风筝的轴，先标预测对应点，再锁定实际镜映。','横轴y＝0，A/C对应，B/D自对应。','竖轴改横轴'],
  [mp([[0,3],[2,2],[3,0],[-1,-1]],[md]),'独立从候选轴找本图对称轴，预测每点再实际镜映。','轴y＝x；A/C互换，B/D自对应。','无提示：斜轴'],
  [mp([[-1,0],[1,2],[3,0],[1,-1]],[{type:'reflect',axis:'vertical',value:1}]),'隔日找到偏离原点的竖对称轴，预测并镜映核验。','轴x＝1。','隔日：轴平移不再经过原点'],
  [mp([[0,-1],[2,1],[0,3],[-1,1]],[{type:'reflect',axis:'horizontal',value:1}]),'独立找偏移横轴，逐点预测并镜映。','轴y＝1。','备用：偏移横轴']
 ],
 'S01.02':[
  [mp([[0,1],[2,1],[0,3]],[mh]),'先预测关于y＝0的镜像，再锁定实际镜映。','各点y取相反数，朝向反转。','竖镜改横镜'],
  [mp([[0,0],[2,0],[0,1]],[{type:'reflect',axis:'vertical',value:1}]),'独立预测关于x＝1的镜像，再用正确轴变换。','A(2,0)、B(0,0)、C(2,1)。','无提示：偏移轴和轴两侧点'],
  [mp([[1,0],[2,0],[1,1]],[mv,{type:'translate',dx:1,dy:0}]),'隔日先关于x＝0镜映，再向右1格。预测最后每点，按规定顺序实际操作并回放。','先镜后移，A(0,0)、B(−1,0)、C(0,1)。','隔日：复合变换顺序明确'],
  [mp([[1,0],[3,0],[1,2]],[md]),'独立预测关于y＝x的镜像，实际变换后核验编号。','坐标互换：A(0,1)、B(0,3)、C(2,1)。','备用：斜轴镜像']
 ],
 'S01.03':[
  [mp([[1,0],[3,0],[1,2]],[{type:'rotate',cx:0,cy:0,angle:90,direction:'ccw'}]),'绕原点逆时针90°，先预测再设中心方向角实际旋转。','(x,y)变(−y,x)。','换中心并顺时针改逆时针'],
  [mp([[2,1],[3,1],[2,2]],[{type:'rotate',cx:1,cy:1,angle:180,direction:'cw'}]),'独立绕(1,1)旋转180°，预测并真正转图。','A(0,1)、B(−1,1)、C(0,0)。','无提示：半圈与非原点中心'],
  [mp([[0,1],[1,1],[0,2]],[{type:'rotate',cx:-1,cy:1,angle:90,direction:'cw'}]),'隔日绕(−1,1)顺时针90°，先预测再实际旋转。','相对新中心转动，中心不变。','隔日：负坐标中心'],
  [mp([[1,0],[2,0],[1,1]],[{type:'rotate',cx:0,cy:0,angle:270,direction:'ccw'}]),'独立绕原点逆时针270°，先预测再实际旋转并回放。','与顺时针90°终态相同，仍按指定方向角执行。','备用：等终态但不同指定转向角']
 ],
 'S01.04':[
  [mp([[0,0],[2,0],[0,1]],[{type:'translate',dx:-2,dy:2}]),'向左2、向上2，逐点预测后锁定实际平移。','所有点同加(−2,2)。','向右改向左并同时上移'],
  [mp([[-1,1],[1,1],[-1,3]],[{type:'translate',dx:1,dy:-2}]),'独立向右1、向下2，预测并实际移动全图。','所有点加(1,−2)，保留朝向。','无提示：向下与负坐标'],
  [mp([[1,0],[2,0],[1,1]],[{type:'translate',dx:1,dy:0},mv]),'隔日先向右1，再关于x＝0镜映。先预测最终点，按指定顺序操作并回放；与先镜后移比较位置。','先移后镜，A(−2,0)、B(−3,0)、C(−2,1)，不同于先镜后移。','隔日：与S01.02对照复合顺序'],
  [mp([[1,-1],[3,-1],[1,1]],[{type:'translate',dx:-1,dy:0}]),'独立只向左1，逐点预测和实际移动；竖坐标保持不变。','每点只减横坐标1。','备用：零纵向位移边界']
 ],
 'S01.05':[
  [mf([fx],[[3,1]]),'只把左半折向右，剪叠层格(3,1)。先预测展开孔，再实际折剪并逐层展开。','原(0,1)、(3,1)两孔。','两折改一折、四层改两层'],
  [mf([fy,fx],[[2,3]]),'独立先下半折上，再左半折右，剪(2,3)。先预测完全展开孔，再实操。','原(1,0)、(1,3)、(2,0)、(2,3)。','无提示：折序与切口换位置'],
  [mf([fx,fy],[[2,2],[3,3]]),'隔日两折后剪(2,2)与(3,3)两个方孔。先预测展开所有孔，再操作折剪展开。','两个叠层孔各穿4原格，共8孔。','隔日：两个切口与叠层原身份'],
  [mf([fy],[[1,2]]),'独立只把下半折上，剪(1,2)并展开；先预测各原孔格。','原(1,1)、(1,2)两孔。','备用：横折与相邻孔']
 ]
};
const motionSource=typeof module!=='undefined'?require('./motion').MOTION_TASKS:MOTION_TASKS,motionTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(MOTION_CASES)){motionTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [params,prompt,explain,changeDimension]=cases[i];motionTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'motionLab',kind:motionSource[skillId].kind,contentVersion:64,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,context:'原身份变换与叠层展开',...(stage==='transfer'?{hint:'先预测并锁定；按指定轴、中心、方向或位移操作；每折保留全部原纸层身份。'}:{})}}}
if(typeof module!=='undefined')module.exports={MOTION_CASES};

'use strict';
function motionTransform(points,op){return points.map(p=>{let x=p.x,y=p.y;if(op.type==='reflect'){if(op.axis==='vertical')x=2*op.value-x;else if(op.axis==='horizontal')y=2*op.value-y;else if(op.axis==='diagonal')[x,y]=[y,x];else if(op.axis==='antidiagonal')[x,y]=[-y,-x]}else if(op.type==='translate'){x+=op.dx;y+=op.dy}else if(op.type==='rotate'){const a=(op.direction==='cw'?-1:1)*op.angle*Math.PI/180,dx=x-op.cx,dy=y-op.cy;x=op.cx+dx*Math.cos(a)-dy*Math.sin(a);y=op.cy+dx*Math.sin(a)+dy*Math.cos(a)}return {id:p.id,x:Math.round(x*1e8)/1e8+0,y:Math.round(y*1e8)/1e8+0}})}
function motionFinal(t){return t.steps.reduce((points,step)=>motionTransform(points,step),t.points)}
function motionArea(points){return points.reduce((n,p,i)=>{const q=points[(i+1)%points.length];return n+p.x*q.y-q.x*p.y},0)/2}
function motionPaper(t){return Object.fromEntries(Array.from({length:t.size},(_,y)=>Array.from({length:t.size},(_,x)=>['C'+x+'-'+y,[x,y]])).flat())}
function motionFoldPositions(positions,fold){const moved=[],after={};for(const [id,p] of Object.entries(positions)){const [x,y]=p,v=fold.axis==='vertical'?x:y,move=fold.from==='low'?v<fold.value:v>fold.value;if(move)moved.push(id);after[id]=fold.axis==='vertical'&&move?[2*fold.value-x,y]:fold.axis==='horizontal'&&move?[x,2*fold.value-y]:[x,y]}return {after,moved}}
function motionPaperExpected(t){const positions=t.folds.reduce((state,fold)=>motionFoldPositions(state,fold).after,motionPaper(t));return Object.entries(positions).filter(([,p])=>t.cuts.some(c=>c[0]===p[0]&&c[1]===p[1])).map(([id])=>id)}
function motionOperationEqual(a,b){if(a.type!==b.type)return false;return (a.type==='reflect'?['axis','value']:a.type==='translate'?['dx','dy']:['cx','cy','angle','direction']).every(k=>a[k]===b[k])}
function normaliseFormalMotion(t){if(t.mode==='motionLab'&&['测','巩固'].includes(t.phase)){t.contentVersion=Math.max(t.contentVersion||1,82);t.firstResponseRuleVersion=1}return t}
function motionSavedPrediction(t,value){
 if(!t||t.mode!=='motionLab'||!['测','巩固'].includes(t.phase)||!value||value.ruleVersion!==1||!Number.isFinite(value.lockedAt)||value.lockedAt<=0)return null;
 if(t.kind==='fold'){
  const original=motionPaper(t);if(value.kind!=='holes'||!Array.isArray(value.holes)||value.holes.length>t.size*t.size||new Set(value.holes).size!==value.holes.length||value.holes.some(id=>!Object.hasOwn(original,id)))return null;
  return {ruleVersion:1,kind:'holes',holes:[...value.holes],lockedAt:value.lockedAt};
 }
 const ids=t.points.map(p=>p.id),given=value.predicted;
 if(value.kind!=='points'||!given||Array.isArray(given)||Object.keys(given).length!==ids.length||!ids.every(id=>Object.hasOwn(given,id)&&Array.isArray(given[id])&&given[id].length===2&&given[id].every(n=>Number.isInteger(n)&&n>=-4&&n<=4)))return null;
 return {ruleVersion:1,kind:'points',predicted:Object.fromEntries(ids.map(id=>[id,[...given[id]]])),lockedAt:value.lockedAt};
}
function motionRestorePrediction(t,w){
 if(!['测','巩固'].includes(t.phase))return w;
 const first=motionSavedPrediction(t,taskHistory(t).motionPrediction);
 if(first){w.locked=true;w.active='';if(first.kind==='holes')w.holes=[...first.holes];else w.predicted=Object.fromEntries(Object.entries(first.predicted).map(([id,p])=>[id,[...p]]))}
 return w;
}
function motionState(t){const w=draft.work??(draft.work={predicted:{},holes:[],active:t.points?.[0].id||'',locked:false,gridMode:'predict',live:t.points?.map(p=>({...p}))||[],axis:'vertical',axisValue:0,cx:0,cy:0,angle:90,direction:'cw',dx:0,dy:0,orientation:'',history:[],positions:t.kind==='fold'?motionPaper(t):{},foldHistory:[],removed:[],unfolded:0,timeline:[],preview:-1,notice:'',moves:0,log:[]});return motionRestorePrediction(t,w)}
function motionSvg(t,w){const p=w.preview>=0?w.history[w.preview]?.after||w.live:w.live,X=x=>45+(x+4)*50,Y=y=>445-(y+4)*50;return `<svg viewBox="0 0 490 490" role="img" aria-label="${esc('原点编号与实际变换坐标；'+p.map(v=>v.id+'('+v.x+','+v.y+')').join('；'))}">${Array.from({length:9},(_,i)=>`<path d="M${45+i*50} 45V445M45 ${45+i*50}H445" stroke="#d5e2da"/>`).join('')}<path d="M245 45V445M45 245H445" stroke="#899f98"/>${t.steps.some(step=>step.type==='reflect')?`<path d="${w.axis==='vertical'?'M'+X(w.axisValue)+' 45V445':w.axis==='horizontal'?'M45 '+Y(w.axisValue)+'H445':w.axis==='diagonal'?'M45 445L445 45':'M45 45L445 445'}" fill="none" stroke="#b78037" stroke-width="3" stroke-dasharray="8 4"/>`:''}<polygon points="${t.points.map(p=>X(p.x)+','+Y(p.y)).join(' ')}" fill="#90b4d1" fill-opacity=".22" stroke="#58849d" stroke-dasharray="5 4"/><polygon points="${p.map(p=>X(p.x)+','+Y(p.y)).join(' ')}" fill="#70ba92" fill-opacity=".35" stroke="#267355" stroke-width="3"/>${Object.entries(w.predicted).map(([id,[x,y]])=>`<path d="M${X(x)-7} ${Y(y)-7}l14 14m-14 0l14-14" stroke="#c18b29" stroke-width="3"/><text x="${X(x)+8}" y="${Y(y)+18}" font-size="16">预测${id}</text>`).join('')}${p.map(v=>`<circle cx="${X(v.x)}" cy="${Y(v.y)}" r="6" fill="#267355"/><text x="${X(v.x)+9}" y="${Y(v.y)-10}" font-size="18">${v.id}</text>`).join('')}${t.steps.some(step=>step.type==='rotate')?`<circle cx="${X(w.cx)}" cy="${Y(w.cy)}" r="5" fill="#c55551"/><text x="${X(w.cx)+6}" y="${Y(w.cy)+25}" font-size="16">中心</text>`:''}${Array.from({length:9},(_,i)=>`<text x="${45+i*50}" y="470" text-anchor="middle" font-size="16">${i-4}</text><text x="25" y="${445-i*50+5}" text-anchor="middle" font-size="16">${i-4}</text>`).join('')}</svg>`}
function motionPlane(t,w){return `<div class="motion-grid" aria-label="实际坐标定位教具">${Array.from({length:9},(_,r)=>Array.from({length:9},(_,c)=>{const x=c-4,y=4-r,ids=t.points.filter(p=>p.x===x&&p.y===y).map(p=>p.id);return `<button data-action="motionPlace" data-x="${x}" data-y="${y}" aria-label="${w.locked?'设置旋转中心':'预测'+w.active}(${x},${y})">${ids.join('、')||'·'}<small>${x},${y}</small></button>`}).join('')).join('')}</div>`}
function motionFoldGrid(t,w){const frame=w.preview>=0?w.timeline[w.preview]:null,positions=frame?.positions||w.positions,removed=frame?.removed||w.removed;return `<div class="motion-paper">${Array.from({length:t.size},(_,row)=>Array.from({length:t.size},(_,x)=>{const y=t.size-1-row,ids=Object.entries(positions).filter(([,p])=>p[0]===x&&p[1]===y).map(([id])=>id),survivors=ids.filter(id=>!removed.includes(id)),original='C'+x+'-'+y;return `<button class="paper-stack ${ids.length&&!survivors.length?'hole':''} ${w.holes.includes(original)?'predicted-hole':''}" data-action="${w.locked?'motionCut':'motionHole'}" data-x="${x}" data-y="${y}" data-id="${original}" ${w.locked&&(w.foldHistory.length!==t.folds.length||w.unfolded>0||!survivors.length||w.preview>=0)?'disabled':''} aria-pressed="${!w.locked&&w.holes.includes(original)}" aria-label="格(${x},${y})，当前${survivors.length}纸层，原身份${survivors.join('、')||'无'}"><b>${x},${y}${ids.length&&!survivors.length?' 孔':''}</b><span>${w.locked?survivors.length+'层':'原格'+original}</span>${w.locked?survivors.map((id,i)=>`<i style="--layer:${i}">${id}</i>`).join(''):''}</button>`}).join('')).join('')}</div>`}
function motionBoard(t){const w=motionState(t);return `<div class="board motion-board"><h3>${esc(t.context)}</h3>${['测','巩固'].includes(t.phase)&&w.locked?'<p class="prediction-summary">我的首次预测已保存；可以撤回操作再验证，预测保持不变。</p>':''}<div class="work-buttons"><button data-action="motionUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button><button data-action="motionCurrent">看当前真实状态</button></div>${w.notice?`<p role="status">${esc(w.notice)}</p>`:''}${t.kind==='fold'?`<p>${w.locked?'真实叠层教具：剪孔穿透此格的全部原纸层。':'原纸预测：点完全展开后有孔的每个原格，再锁定。'}预测原孔：${w.holes.join('、')||'无'}；已折${w.foldHistory.length}次、已展开${w.unfolded}次。</p>${motionFoldGrid(t,w)}<div class="work-buttons"><button data-action="motionLock" ${w.locked?'disabled':''}>锁定展开孔预测，开始真实折纸</button>${[['vertical','low','左半折向右'],['horizontal','low','下半折向上'],['vertical','high','右半折向左'],['horizontal','high','上半折向下']].map(([axis,from,label])=>`<button data-action="motionFold" data-axis="${axis}" data-from="${from}" ${w.locked&&w.foldHistory.length<t.folds.length&&!w.removed.length?'':'disabled'}>${label}（中线1.5）</button>`).join('')}<button data-action="motionUnfold" ${w.removed.length&&w.unfolded<w.foldHistory.length?'':'disabled'}>沿上次折线展开一层</button></div><div class="work-buttons">${w.timeline.map((frame,index)=>`<button data-action="motionReplay" data-index="${index}" aria-pressed="${w.preview===index}">回放${index+1}：${esc(frame.label)}</button>`).join('')}</div>`:`${motionSvg(t,w)}<p>原图虚线；实际图绿色；预测对应点金色。当前原点：${w.live.map(p=>p.id+'('+p.x+','+p.y+')').join('、')}。</p><div class="work-buttons">${t.points.map(p=>`<button data-action="motionSelect" data-id="${p.id}" ${w.locked?'disabled':''} aria-pressed="${w.active===p.id}">预测原点${p.id}的终位</button>`).join('')}<button data-action="motionLock" ${w.locked?'disabled':''}>锁定全部预测，再操作</button>${w.locked&&t.steps.some(step=>step.type==='rotate')?'<button data-action="motionGridMode" data-value="centre">点网格设旋转中心</button>':''}</div>${!w.locked||t.steps.some(step=>step.type==='rotate')?motionPlane(t,w):''}${t.steps.some(step=>step.type==='reflect')?`<section><h4>实际镜映</h4><div class="work-buttons">${[['vertical','竖线x＝所选值'],['horizontal','横线y＝所选值'],['diagonal','斜线y＝x'],['antidiagonal','斜线y＝−x']].map(([value,label])=>`<button data-action="motionAxis" data-value="${value}" aria-pressed="${w.axis===value}">${label}</button>`).join('')}<b>轴值${w.axisValue}</b>${[-1,1].map(delta=>`<button data-action="motionAdjust" data-key="axisValue" data-delta="${delta}">${delta>0?'＋':'－'}1</button>`).join('')}<button data-action="motionApply" data-type="reflect" ${w.locked?'':'disabled'}>沿所选实际轴镜映</button></div></section>`:''}${t.steps.some(step=>step.type==='rotate')?`<section><h4>实际旋转 · 中心(${w.cx},${w.cy})</h4><div class="work-buttons">${[['cw','顺时针'],['ccw','逆时针']].map(([value,label])=>`<button data-action="motionDirection" data-value="${value}" aria-pressed="${w.direction===value}">${label}</button>`).join('')}${[90,180,270].map(value=>`<button data-action="motionAngle" data-value="${value}" aria-pressed="${w.angle===value}">${value}°</button>`).join('')}<button data-action="motionApply" data-type="rotate" ${w.locked?'':'disabled'}>绕所选中心实际转动</button></div></section>`:''}${t.steps.some(step=>step.type==='translate')?`<section><h4>实际平移 · 横${w.dx}、纵${w.dy}</h4><div class="work-buttons">${['dx','dy'].map(key=>[-1,1].map(delta=>`<button data-action="motionAdjust" data-key="${key}" data-delta="${delta}">${key==='dx'?'横':'纵'}${delta>0?'＋':'－'}1</button>`).join('')).join('')}<button data-action="motionApply" data-type="translate" ${w.locked?'':'disabled'}>所有原点同向同距移动</button></div></section>`:''}${t.kind!=='axis'?`<div class="work-buttons"><b>按原编号连接的朝向相对原图</b>${[['same','保持'],['changed','反转']].map(([value,label])=>`<button data-action="motionOrientation" data-value="${value}" aria-pressed="${w.orientation===value}">${label}</button>`).join('')}</div>`:''}<div class="work-buttons">${w.history.map((frame,index)=>`<button data-action="motionReplay" data-index="${index}" aria-pressed="${w.preview===index}">回放第${index+1}次${{reflect:'镜映',rotate:'旋转',translate:'平移'}[frame.op.type]}</button>`).join('')}</div>`}</div>`}
function motionGrade(t){const w=motionState(t),same=(a,b)=>a.length===b.length&&b.every(id=>a.includes(id));let ok=w.locked&&(!['测','巩固'].includes(t.phase)||!!motionSavedPrediction(t,taskHistory(t).motionPrediction));if(t.kind==='fold'){const expected=motionPaperExpected(t),original=motionPaper(t);ok=ok&&same(Object.keys(w.positions),Object.keys(original))&&w.foldHistory.every((f,i)=>JSON.stringify(f.before)===JSON.stringify(i?w.foldHistory[i-1].after:original)&&JSON.stringify(f.after)===JSON.stringify(motionFoldPositions(f.before,f.fold).after))&&same(w.holes,expected)&&same(w.removed,expected)&&w.foldHistory.length===t.folds.length&&w.foldHistory.every((f,i)=>['axis','value','from'].every(k=>f.fold[k]===t.folds[i][k])&&f.moved.length>0)&&w.unfolded===t.folds.length&&Object.entries(original).every(([id,p])=>JSON.stringify(w.positions[id])===JSON.stringify(p))}else{const expected=motionFinal(t);ok=ok&&same(Object.keys(w.predicted),t.points.map(p=>p.id))&&w.live.length===t.points.length&&w.history.every((f,i)=>JSON.stringify(f.before)===JSON.stringify(i?w.history[i-1].after:t.points)&&JSON.stringify(f.after)===JSON.stringify(motionTransform(f.before,f.op)))&&JSON.stringify(w.live)===JSON.stringify(w.history.at(-1)?.after||t.points)&&expected.every(p=>w.predicted[p.id]?.[0]===p.x&&w.predicted[p.id]?.[1]===p.y)&&w.history.length===t.steps.length&&w.history.every((f,i)=>motionOperationEqual(f.op,t.steps[i]))&&expected.every(p=>w.live.some(v=>v.id===p.id&&v.x===p.x&&v.y===p.y))&&(t.kind==='axis'||w.orientation===(motionArea(t.points)*motionArea(expected)>0?'same':'changed'))}return {ok,incomplete:w.moves===0,reason:'先锁定每个原身份的预测，再按指定轴、中心方向角、位移或折序实际操作。最后逐点/逐原孔核对；相像轮廓、正确数字或回放不能替代真实过程，叠层切孔需完全逐层展开。'}}
function motionAct(action,data,t){const w=motionState(t),snapshot=JSON.stringify({...w,log:[]}),x=Number(data.x),y=Number(data.y),delta=Number(data.delta),index=Number(data.index);let changed=false;w.notice='';
 if(action==='motionSelect'&&!w.locked&&t.points?.some(p=>p.id===data.id)){w.active=data.id;changed=true}
 if(action==='motionPlace'&&t.kind!=='fold'&&Number.isInteger(x)&&Number.isInteger(y)&&x>=-4&&x<=4&&y>=-4&&y<=4){if(!w.locked&&w.active){w.predicted[w.active]=[x,y];changed=true}else if(w.locked&&w.gridMode==='centre'){w.cx=x;w.cy=y;changed=true}}
 if(action==='motionHole'&&t.kind==='fold'&&!w.locked&&Object.hasOwn(w.positions,data.id)){const at=w.holes.indexOf(data.id);at<0?w.holes.push(data.id):w.holes.splice(at,1);changed=true}
 if(action==='motionLock'&&!w.locked&&(t.kind==='fold'||t.points.every(p=>w.predicted[p.id]))){
  if(['测','巩固'].includes(t.phase)){
   const value={ruleVersion:1,kind:t.kind==='fold'?'holes':'points',...(t.kind==='fold'?{holes:[...w.holes]}:{predicted:JSON.parse(JSON.stringify(w.predicted))}),lockedAt:Date.now()},first=motionSavedPrediction(t,value);
   if(!first)return false;const h=taskHistory(t);h.motionPrediction??=first;persist();
  }
  w.locked=true;w.active='';changed=true;
 }
 if(action==='motionGridMode'&&data.value==='centre'&&w.locked){w.gridMode='centre';changed=true}
 if(action==='motionAxis'&&['vertical','horizontal','diagonal','antidiagonal'].includes(data.value)){w.axis=data.value;changed=true}
 if(action==='motionAdjust'&&['axisValue','dx','dy'].includes(data.key)&&[-1,1].includes(delta)&&Math.abs(w[data.key]+delta)<=4){w[data.key]+=delta;changed=true}
 if(action==='motionDirection'&&['cw','ccw'].includes(data.value)){w.direction=data.value;changed=true}
 if(action==='motionAngle'&&[90,180,270].includes(Number(data.value))){w.angle=Number(data.value);changed=true}
 if(action==='motionApply'&&t.kind!=='fold'&&w.locked&&w.history.length<t.steps.length&&['reflect','rotate','translate'].includes(data.type)){const op=data.type==='reflect'?{type:'reflect',axis:w.axis,value:['diagonal','antidiagonal'].includes(w.axis)?0:w.axisValue}:data.type==='rotate'?{type:'rotate',cx:w.cx,cy:w.cy,angle:w.angle,direction:w.direction}:{type:'translate',dx:w.dx,dy:w.dy},after=motionTransform(w.live,op);if(after.some(p=>Math.abs(p.x)>4||Math.abs(p.y)>4)){w.notice='变换超出当前网格，请调整轴、中心或位移。';changed=true}else{w.history.push({op,before:w.live.map(p=>({...p})),after});w.live=after;w.preview=-1;changed=true}}
 if(action==='motionOrientation'&&['same','changed'].includes(data.value)){w.orientation=data.value;changed=true}
 if(action==='motionFold'&&t.kind==='fold'&&w.locked&&w.foldHistory.length<t.folds.length&&!w.removed.length&&['vertical','horizontal'].includes(data.axis)&&['low','high'].includes(data.from)){const fold={axis:data.axis,value:1.5,from:data.from},before=JSON.parse(JSON.stringify(w.positions)),{after,moved}=motionFoldPositions(w.positions,fold);if(moved.length){w.foldHistory.push({fold,before,after,moved});w.positions=after;w.timeline.push({label:'折叠，移动'+moved.length+'个原格',positions:after,removed:[...w.removed]});w.preview=-1;changed=true}}
 if(action==='motionCut'&&t.kind==='fold'&&w.locked&&w.foldHistory.length===t.folds.length&&w.unfolded===0&&w.preview<0){const ids=Object.entries(w.positions).filter(([id,p])=>p[0]===x&&p[1]===y&&!w.removed.includes(id)).map(([id])=>id);if(ids.length){w.removed.push(...ids);w.timeline.push({label:'剪孔，穿透'+ids.length+'层',positions:JSON.parse(JSON.stringify(w.positions)),removed:[...w.removed]});changed=true}}
 if(action==='motionUnfold'&&t.kind==='fold'&&w.removed.length&&w.unfolded<w.foldHistory.length){const frame=w.foldHistory[w.foldHistory.length-1-w.unfolded];w.positions=JSON.parse(JSON.stringify(frame.before));w.unfolded++;w.timeline.push({label:'展开一层，孔随原格展开',positions:JSON.parse(JSON.stringify(w.positions)),removed:[...w.removed]});w.preview=-1;changed=true}
 if(action==='motionReplay'&&Number.isInteger(index)&&index>=0&&index<(t.kind==='fold'?w.timeline.length:w.history.length)){w.preview=index;changed=true}
 if(action==='motionCurrent'){w.preview=-1;changed=true}
 if(action==='motionUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});motionRestorePrediction(t,w);return true}if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function motionSpeech(t){const w=motionState(t);return t.kind==='fold'?`预测原孔${w.holes.join('、')||'无'}；实际已折${w.foldHistory.length}次，剪去原格${w.removed.join('、')||'无'}，逐次展开${w.unfolded}次。`:`预测${Object.entries(w.predicted).map(([id,p])=>id+p.join('、')).join('；')||'无'}；实际原点${w.live.map(p=>p.id+'横'+p.x+'纵'+p.y).join('；')}；已操作${w.history.length}次；中心横${w.cx}纵${w.cy}。`}
function motionPage(){const t=MOTION_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!t||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(t.skillId)} · 空间变换</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(t.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(t.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${motionBoard(t)}${reasonBlock(t)}${actionRow(t)}</article><aside class="side-stack"><section class="panel"><h3>保留每个原身份</h3><p>先预测再操作。回放查看每次真实位置；折后不同原格形成叠层，剪孔必须穿全部纸层，再逐次展开核验。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={motionTransform,motionFinal,motionArea,motionPaper,motionFoldPositions,motionPaperExpected,motionOperationEqual,normaliseFormalMotion,motionSavedPrediction};

'use strict';
function invariantCards(colors,rule,minOps=2,extra={}){return {coins:colors.map((color,i)=>({id:'C'+(i+1),color})),rule,minOps,...extra}}
function invariantFilter(items,conditions){return {items,conditions:conditions.map((c,i)=>({id:'K'+(i+1),...c}))}}
const INVARIANT_TASKS={
 'S02.01':{kind:'filter',...invariantFilter(['A','B','C'],[{type:'before',a:'A',b:'B',label:'A在B之前'},{type:'notSlot',a:'C',slot:1,label:'C不在中间'}]),prompt:'亲手摆三张原人卡，列全六种队列。每种分别判断保留或剔除；剔除时标出所有违反的条件，找到满足全部条件的队列。',explain:'ABC和CAB满足；只满足一个条件仍不合题意。逐候选六种审查证明列全。'},
 'S02.02':{kind:'parity',...invariantCards(['红','红','红','蓝','蓝','蓝'],'flipPair',3),prompt:'每次必须翻不同的两张红蓝卡。实际做3次合法翻转，然后把初态与终态的红卡各亲手圈成两两配对，剩1张则单列，判断两态奇偶。',explain:'红数变化只可能−2、0、＋2，原来奇数仍奇数；多少次都不能只翻一张。'},
 'S02.03':{kind:'legal',...invariantCards(['红','蓝','红','蓝'],'adjacentFlip',0,{attempts:[['C1','C2'],['C1','C3'],['C2','C3']]}),prompt:'规则是每次只翻位置相邻的两张卡。按给定顺序亲手选择C1/C2、C1/C3、C2/C3；先判断是否合法再实际试操作，观察非法选择不改变状态。',explain:'相邻二卡能翻；C1/C3隔位不合法，不能因按钮按了就算执行规则。'},
 'S02.04':{kind:'invariant',...invariantCards(['红','红','红','蓝','蓝','蓝'],'flipPair',3),prompt:'实际做3次不同双卡翻转，至少展示一次红数变化。逐次填总卡数、红数和红数奇偶；再操作三种局部颜色配对，记录变化量，选择对所有合法操作成立的不变量。',explain:'总卡数不变，红数奇偶不变；红数本身可变。两红→−2、一红一蓝→0、两蓝→＋2穷尽局部情形。'},
 'S02.05':{kind:'proof',...invariantCards(['红','蓝','蓝','蓝'],'flipPair',2,{goal:['红','红','蓝','蓝']}),prompt:'初态1红3蓝，目标位置为红红蓝蓝；每次翻两张不同卡。先实际尝试至少2次并记录状态，再判断可达否。不可达必须用覆盖全部局部情形的不变量证明，不能以一次失败作证。',explain:'初红数奇、目标偶；每次变化−2/0/＋2保留奇偶，所以不可达。尝试失败只是探索，不是证明。'}
};
for(const [skillId,t] of Object.entries(INVARIANT_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'invariantLab',contentVersion:65,phase:'练',context:'全部条件、合法状态与通用证据',hint:'只移动原卡、只执行题定规则。逐状态计数，再穷尽一次操作的颜色类型证明保存量；不可达要对所有合法步骤成立。',reason:{prompt:'怎样让筛选或不可达结论有完整依据？',options:['候选覆盖全部条件；每次合法操作的局部类型已穷尽，守恒量初态与目标矛盾才证明不可达；可达则给实际合法路径','一条条件满足即可保留，不用看其他条件','自己一次没做成就证明不可能'],answer:0}});
if(typeof module!=='undefined')module.exports={INVARIANT_TASKS,invariantCards,invariantFilter};

'use strict';
const invariantFactory=typeof module!=='undefined'?require('./invariant'):{invariantCards,invariantFilter},ic=invariantFactory.invariantCards,ifil=invariantFactory.invariantFilter;
const INVARIANT_CASES={
 'S02.01':[
  [ifil(['1','2','3'],[{type:'slotOdd',slot:0,label:'第一位为奇数'},{type:'before',a:'1',b:'3',label:'1在3之前'}]),'摆原数卡列全六个不重复三位编码，第一位奇数且1在3前；每项保留/剔除并圈全部违规条件。','123、132同时满足。','人物条件改数位奇偶与前后关系'],
  [ifil(['A','B','C'],[{type:'fixed',a:'B',slot:1,label:'B在中间'},{type:'before',a:'A',b:'C',label:'A在C前'}]),'独立列全三人队列，B中间且A在C前，逐项核查全部条件。','只有ABC。','无提示：固定位置与前后关系'],
  [ifil(['A','B','C'],[{type:'notSlot',a:'A',slot:1,label:'A不在中间'},{type:'before',a:'B',b:'C',label:'B在C前'},{type:'notSlot',a:'C',slot:0,label:'C不在首位'}]),'隔日列全并筛选三条件；剔除时所有违反条件均须标出。','ABC、BCA满足。','隔日：三条件同时作用'],
  [ifil(['A','B','C'],[{type:'adjacent',a:'A',b:'C',label:'A与C相邻'},{type:'notSlot',a:'B',slot:0,label:'B不在第一位'}]),'独立列全、逐项筛满足相邻及首位限制的队列。','ACB、CAB。','备用：相邻与否定条件']
 ],
 'S02.02':[
  [ic(['红','红','蓝','蓝'],'flipPair',2),'先实际翻双卡两次，再把初终红卡各圈成对，判断奇偶。','偶数仍偶数。','初态由奇数改偶数'],
  [ic(['红','蓝','蓝','蓝','蓝'],'flipPair',3),'独立翻不同双卡三次，再对初终红卡配对并判奇偶。','奇数仍奇数，剩1张。','无提示：五卡与单红初态'],
  [ic(['红','蓝','红','蓝'],'adjacentFlip',2),'隔日仅许翻相邻双卡，执行两次并给初终红卡配对判奇偶。','合法限制变严但仍每次翻二卡，偶数保持。','隔日：合法邻接限制变化'],
  [ic(['蓝','蓝','蓝','蓝'],'flipPair',1),'独立全蓝初态翻两卡一次，对初终红卡配对判奇偶，空红组要明确标无剩余。','初0红偶，终2红偶。','备用：零红边界']
 ],
 'S02.03':[
  [ic(['红','蓝','蓝','红'],'swapAdjacent',0,{attempts:[['C1','C2'],['C2','C4'],['C1','C3']]}),'本轮只能交换相邻位置的两张原卡，按C1/C2、C2/C4、C1/C3顺序判断并试；身份位置真的交换。','合法按当前实际位置判断，非法不动原卡。','翻色改移动交换身份'],
  [ic(['红','蓝','蓝'],'flipOne',0,{attempts:[['C1'],['C1','C2'],['C3']]}),'独立规则改为每次只翻一张，按给定单卡/双卡/单卡先判断再试。','双卡选择不符合只翻一张，状态不改变。','无提示：操作张数限制变化'],
  [ic(['红','红','蓝','蓝'],'adjacentFlip',0,{attempts:[['C1','C4'],['C2','C3'],['C1','C2']]}),'隔日按给定三组先判断再实际试，只有位置相邻的双卡能翻。','首末不相邻，中间及前两位相邻。','隔日：位置边界与不同非法对'],
  [ic(['红','蓝','红'],'swapAdjacent',0,{attempts:[['C1','C3'],['C2','C3'],['C1','C3']]}),'独立交换相邻原卡，按固定序试三组；后一次必须按已经改变的位置判断。','第一次C1/C3非法；交换C2/C3后C1/C3变相邻合法。','备用：位置改变使同编号对合法性改变']
 ],
 'S02.04':[
  [ic(['红','蓝','红','蓝'],'swapAdjacent',2),'实际交换相邻原卡两次，记录三状态，穷尽局部交换颜色类型后选择保存量。','总数、红数、红数奇偶都不变。','翻色改交换：红数也成为不变量'],
  [ic(['红','红','蓝','蓝'],'flipPair',2),'独立做双卡翻转并展示红数改变，填状态表，操作全部局部配对并选不变量。','总数与红数奇偶保存，红数不保存。','无提示：偶初态与反例见证'],
  [ic(['红','蓝','蓝'],'flipOne',3),'隔日每次只翻一张，填各状态，操作红/蓝两种局部情形后重新选择不变量。','总数保存；红数和红数奇偶都可变。','隔日：错误奇偶不变量被新规则反例推翻'],
  [ic(['红','红','蓝','蓝'],'adjacentFlip',2),'独立仅翻相邻双卡，展示红数变化，记录状态并穷尽局部颜色类型选保存量。','总数与红数奇偶保存。','备用：邻接限制下的全局守恒']
 ],
 'S02.05':[
  [ic(['红','蓝','蓝','蓝'],'flipPair',1,{goal:['蓝','红','蓝','蓝']}),'目标改为蓝红蓝蓝。亲手给合法路径并记录每步，判断可达并用实际路径作证。','翻C1/C2一步可达；同奇偶本身不是路径证据。','不可达目标改可达，必须构造路径'],
  [ic(['红','红','蓝','蓝'],'flipPair',2,{goal:['红','红','红','蓝']}),'独立尝试并记录，再用穷尽操作情形的不变量证明目标可达否。','初红偶、目标红奇，双翻保留奇偶，故不可达。','无提示：初偶目标奇'],
  [ic(['红','蓝','蓝','蓝'],'swapAdjacent',2,{goal:['红','红','红','蓝']}),'隔日规则改只交换相邻原卡，目标红红红蓝；先尝试再完整论证。','奇偶同为奇不足判断；原红数1保存、目标3，故不可达。','隔日：相同奇偶仍因更强计数不变量不可达'],
  [ic(['红','蓝','蓝','蓝'],'swapAdjacent',1,{goal:['蓝','蓝','蓝','红']}),'独立只许相邻交换，把红卡移到最右，提供实际合法路径及状态表。','连续把同一原红卡右移三次可达。','备用：移动原身份的多步可达路径']
 ]
};
const invariantSource=typeof module!=='undefined'?require('./invariant').INVARIANT_TASKS:INVARIANT_TASKS,invariantTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(INVARIANT_CASES)){invariantTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [params,prompt,explain,changeDimension]=cases[i];invariantTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'invariantLab',kind:invariantSource[skillId].kind,contentVersion:66,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,context:'合法变化与不可达的完整依据',...(stage==='transfer'?{hint:'逐条件/逐状态核对，穷尽局部操作类型；可达要构造路径，不可达用真正保存量与目标矛盾。'}:{})}}}
if(typeof module!=='undefined')module.exports={INVARIANT_CASES};

'use strict';
function invariantAll(items){return items.length?items.flatMap(id=>invariantAll(items.filter(v=>v!==id)).map(rest=>[id,...rest])):[[]]}
function invariantCondition(c,tuple){if(c.type==='before')return tuple.indexOf(c.a)<tuple.indexOf(c.b);if(c.type==='notSlot')return tuple[c.slot]!==c.a;if(c.type==='fixed')return tuple[c.slot]===c.a;if(c.type==='slotOdd')return Number(tuple[c.slot])%2===1;if(c.type==='adjacent')return Math.abs(tuple.indexOf(c.a)-tuple.indexOf(c.b))===1;return false}
function invariantInitial(t){return {order:t.coins.map(p=>p.id),colors:Object.fromEntries(t.coins.map(p=>[p.id,p.color]))}}
function invariantRed(s){return s.order.filter(id=>s.colors[id]==='红')}
function invariantLegal(rule,s,ids){if(ids.length!==(rule==='flipOne'?1:2)||new Set(ids).size!==ids.length||!ids.every(id=>s.order.includes(id)))return false;return !['adjacentFlip','swapAdjacent'].includes(rule)||Math.abs(s.order.indexOf(ids[0])-s.order.indexOf(ids[1]))===1}
function invariantStep(rule,s,ids){const out={order:[...s.order],colors:{...s.colors}};if(!invariantLegal(rule,s,ids))return out;if(rule==='swapAdjacent'){const a=out.order.indexOf(ids[0]),b=out.order.indexOf(ids[1]);[out.order[a],out.order[b]]=[out.order[b],out.order[a]]}else for(const id of ids)out.colors[id]=out.colors[id]==='红'?'蓝':'红';return out}
function invariantChoices(rule,s){return rule==='flipOne'?s.order.map(id=>[id]):s.order.flatMap((a,i)=>s.order.slice(i+1).map(b=>[a,b])).filter(ids=>invariantLegal(rule,s,ids))}
function invariantReachable(t){const initial=invariantInitial(t),key=s=>s.order.map(id=>s.colors[id]).join(','),seen=new Map([[key(initial),{state:initial,path:[]}]]),queue=[seen.get(key(initial))];for(let i=0;i<queue.length;i++){const node=queue[i];for(const ids of invariantChoices(t.rule,node.state)){const state=invariantStep(t.rule,node.state,ids),k=key(state);if(!seen.has(k)){const next={state,path:[...node.path,ids]};seen.set(k,next);queue.push(next)}}}return seen}
function invariantQuantities(rule){return rule==='swapAdjacent'?['total','red','redParity']:rule==='flipOne'?['total']:['total','redParity']}
function invariantProbes(rule){return (rule==='flipOne'?[['红'],['蓝']]:[['红','红'],['红','蓝'],['蓝','蓝']]).map((colors,row)=>{const state={order:colors.map((c,i)=>'Q'+row+'-'+i),colors:Object.fromEntries(colors.map((c,i)=>['Q'+row+'-'+i,c]))};return {before:state,after:state,selection:[],done:false,delta:null}})}
function invariantState(t){return draft.work??(draft.work={slots:t.items?.map(()=>null)||[],active:'',classification:'',failed:[],records:[],serial:0,state:t.coins?invariantInitial(t):null,selection:[],prediction:'',trials:[],history:[],ledger:[{total:0,red:0,parity:''}],pairSide:'initial',pairSelection:[],pairs:{initial:[],current:[]},left:{initial:[],current:[]},none:{initial:false,current:false},parity:{initial:'',current:''},probes:t.rule?invariantProbes(t.rule):[],quantities:[],verdict:'',proof:'',notice:'',moves:0,log:[]})}
function invariantRuleLabel(rule){return {flipPair:'每次翻两张不同原卡',adjacentFlip:'每次翻位置相邻的两张原卡',swapAdjacent:'每次交换位置相邻的两张原卡，颜色不改',flipOne:'每次只翻一张原卡'}[rule]}
function invariantCoin(id,color,action,extra='',selected=false){return `<button class="invariant-coin" style="--coin-color:${color==='红'?'#ee8b77':'#86b8de'}" data-action="${action}" data-id="${id}" ${extra} aria-pressed="${selected}"><b>${color}</b><small>${id}</small></button>`}
function invariantLedger(t,w){const states=[invariantInitial(t),...w.history.map(h=>h.after)];return `<section><h4>自己填写逐状态计数</h4>${states.map((s,row)=>{const r=w.ledger[row];return `<section class="invariant-ledger-row"><b>${row===0?'初态':'第'+row+'次合法操作后'}</b><div class="invariant-mini">${s.order.map((id,index)=>`<span style="background:${s.colors[id]==='红'?'#ee8b77':'#86b8de'}">第${index+1}位 ${id} ${s.colors[id]}</span>`).join('')}</div>${['total','red'].map(key=>`<div class="work-buttons"><b>${key==='total'?'总原卡数':'红数'} ${r[key]}</b>${[-1,1].map(delta=>`<button data-action="invariantLedger" data-row="${row}" data-key="${key}" data-delta="${delta}" ${r[key]+delta>=0&&r[key]+delta<=12?'':'disabled'}>${delta>0?'＋':'－'}1</button>`).join('')}</div>`).join('')}<div class="work-buttons"><b>红数奇偶</b>${[['even','偶'],['odd','奇']].map(([value,label])=>`<button data-action="invariantLedgerParity" data-row="${row}" data-value="${value}" aria-pressed="${r.parity===value}">${label}</button>`).join('')}</div></section>`}).join('')}</section>`}
function invariantPairBoard(t,w){const side=w.pairSide,s=side==='initial'?invariantInitial(t):w.state,red=invariantRed(s),used=[...w.pairs[side].flat(),...w.left[side]];return `<section><h4>原红卡亲手两两配对</h4><div class="work-buttons">${[['initial','初态红卡'],['current','当前红卡']].map(([value,label])=>`<button data-action="invariantPairSide" data-value="${value}" aria-pressed="${side===value}">${label}</button>`).join('')}</div><div class="work-buttons">${red.filter(id=>!used.includes(id)).map(id=>invariantCoin(id,'红','invariantPairCoin',`data-side="${side}"`,w.pairSelection.includes(id))).join('')||'<p>没有未归组红卡</p>'}</div><div class="work-buttons"><button data-action="invariantBindPair" ${w.pairSelection.length===2?'':'disabled'}>把所选两张原红卡圈成一对</button><button data-action="invariantSingle" ${w.pairSelection.length===1?'':'disabled'}>把这张作为剩余1张</button><button data-action="invariantNoSingle" aria-pressed="${w.none[side]}">无剩余单张（可为0张红）</button></div><p>已配对${w.pairs[side].map(p=>'('+p.join('、')+')').join(' ')||'无'}；单张${w.left[side].join('、')||'无'}。</p><div class="work-buttons">${[['even','偶数'],['odd','奇数']].map(([value,label])=>`<button data-action="invariantParity" data-value="${value}" aria-pressed="${w.parity[side]===value}">${label}</button>`).join('')}</div></section>`}
function invariantProbeBoard(t,w){return `<section><h4>穷尽一次合法操作的局部颜色类型</h4><p>每种类型先选全部原卡，再实际执行本题规则，观察原身份与颜色，自己填红数变化。每种颜色关系都要检验。</p>${w.probes.map((p,row)=>`<section class="invariant-probe"><b>类型${row+1} · 原${p.before.order.map(id=>p.before.colors[id]).join('、')}</b><div class="work-buttons">${p.after.order.map(id=>invariantCoin(id,p.after.colors[id],'invariantProbeCoin',`data-row="${row}" ${p.done?'disabled':''}`,p.selection.includes(id))).join('')}<button data-action="invariantProbeRun" data-row="${row}" ${!p.done&&p.selection.length===p.before.order.length?'':'disabled'}>让这些原卡实际执行规则</button></div><div class="work-buttons"><b>我填红数变化</b>${[-2,-1,0,1,2].map(value=>`<button data-action="invariantProbeDelta" data-row="${row}" data-value="${value}" aria-pressed="${p.delta===value}">${value>0?'＋':''}${value}</button>`).join('')}</div></section>`).join('')}<div class="work-buttons"><b>对所有合法操作都保存的量</b>${[['total','总原卡数'],['red','红数'],['redParity','红数奇偶']].map(([value,label])=>`<button data-action="invariantQuantity" data-value="${value}" aria-pressed="${w.quantities.includes(value)}">${label}</button>`).join('')}</div></section>`}
function invariantBoard(t){const w=invariantState(t);if(t.kind==='filter')return `<div class="board invariant-board"><h3>${esc(t.context)}</h3><div class="work-buttons"><button data-action="invariantUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div><ul>${t.conditions.map(c=>`<li>${c.id} ${esc(c.label)}</li>`).join('')}</ul><div class="work-buttons">${t.items.filter(id=>!w.slots.includes(id)).map(id=>`<button data-action="invariantCard" data-id="${id}" aria-pressed="${w.active===id}">原卡${id}</button>`).join('')}</div><div class="invariant-slots">${w.slots.map((id,slot)=>`<section><button data-action="invariantSlot" data-slot="${slot}" ${w.active?'':'disabled'}>放第${slot+1}位</button>${id?`<button data-action="invariantCard" data-id="${id}" aria-pressed="${w.active===id}">原卡${id}</button>`:'空'}</section>`).join('')}</div><div class="work-buttons">${[['keep','保留：所有条件都满足'],['reject','剔除：至少一条不满足']].map(([value,label])=>`<button data-action="invariantClass" data-value="${value}" aria-pressed="${w.classification===value}">${label}</button>`).join('')}${t.conditions.map(c=>`<button data-action="invariantFailed" data-id="${c.id}" aria-pressed="${w.failed.includes(c.id)}">标违反${c.id}</button>`).join('')}<button data-action="invariantRecord" ${w.slots.every(Boolean)&&w.classification?'':'disabled'}>收录实际候选及判断</button></div><div class="invariant-records">${w.records.map(r=>`<section><b>${r.tuple.join(' → ')}</b><span>${r.status==='keep'?'保留':'剔除'}，违反${r.failed.join('、')||'无'}</span><button data-action="invariantDelete" data-id="${r.id}">移去这条记录</button></section>`).join('')}</div></div>`;
 const s=w.state;return `<div class="board invariant-board"><h3>${esc(t.context)}</h3><p>规则：${esc(invariantRuleLabel(t.rule))}。${t.kind==='legal'?'按列出的组依次先判断再试。':'选择实际原卡后执行；每次的真实状态会保留。'}</p><div class="work-buttons"><button data-action="invariantUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${w.notice?`<p role="status">${esc(w.notice)}</p>`:''}<div class="invariant-current">${s.order.map((id,slot)=>`<section><b>位置${slot+1}</b>${invariantCoin(id,s.colors[id],'invariantCoin','',w.selection.includes(id))}</section>`).join('')}</div>${t.kind==='legal'?`<p>给定顺序：${t.attempts.map(ids=>ids.join('/')).join(' → ')}；已试${w.trials.length}组。</p><div class="work-buttons">${[['legal','我判断合法'],['illegal','我判断不合法']].map(([value,label])=>`<button data-action="invariantPredictLegal" data-value="${value}" aria-pressed="${w.prediction===value}">${label}</button>`).join('')}</div>`:''}<div class="work-buttons"><button data-action="invariantRun" ${w.selection.length&&(t.kind!=='legal'||w.prediction)?'':'disabled'}>实际尝试本题规则</button><span>已执行${w.history.length}次合法操作</span></div>${t.kind==='legal'?`<section><h4>实际尝试记录</h4>${w.trials.map(tr=>`<p>${tr.ids.join('/')}：预测${tr.predicted==='legal'?'合法':'不合法'}；实际${tr.legal?'已执行，原卡状态改变':'不合法，原卡状态保留'}</p>`).join('')}</section>`:''}${t.kind==='parity'?invariantPairBoard(t,w):''}${['invariant','proof'].includes(t.kind)?invariantLedger(t,w):''}${t.kind==='invariant'||t.kind==='proof'&&w.verdict==='unreachable'?invariantProbeBoard(t,w):''}${t.kind==='proof'?`<section><h4>目标位置与完整依据</h4><p>目标：${t.goal.map((color,i)=>'第'+(i+1)+'位'+color).join('、')}。</p><div class="work-buttons">${[['reachable','可达'],['unreachable','不可达']].map(([value,label])=>`<button data-action="invariantVerdict" data-value="${value}" aria-pressed="${w.verdict===value}">${label}</button>`).join('')}${[['path','用已经做出的合法路径作证'],['parity','局部类型穷尽，红数奇偶保存，与目标矛盾'],['count','局部类型穷尽，红数保存，与目标矛盾'],['failure','我试一次没成功']].map(([value,label])=>`<button data-action="invariantProof" data-value="${value}" aria-pressed="${w.proof===value}">${label}</button>`).join('')}</div></section>`:''}</div>`}
function invariantGrade(t){const w=invariantState(t),same=(a,b)=>a.length===b.length&&b.every(v=>a.includes(v));let ok=false;if(t.kind==='filter'){const all=invariantAll(t.items),keys=w.records.map(r=>JSON.stringify(r.tuple));ok=keys.length===all.length&&new Set(keys).size===all.length&&all.every(tuple=>keys.includes(JSON.stringify(tuple)))&&w.records.every(r=>{const failed=t.conditions.filter(c=>!invariantCondition(c,r.tuple)).map(c=>c.id);return r.status===(failed.length?'reject':'keep')&&same(r.failed,failed)})}else{const initial=invariantInitial(t),legalHistory=w.history.every((h,i)=>JSON.stringify(h.before)===JSON.stringify(i?w.history[i-1].after:initial)&&invariantLegal(t.rule,h.before,h.ids)&&JSON.stringify(invariantStep(t.rule,h.before,h.ids))===JSON.stringify(h.after))&&JSON.stringify(w.state)===JSON.stringify(w.history.at(-1)?.after||initial),enough=w.history.length>=t.minOps,states=[initial,...w.history.map(h=>h.after)],ledgerOk=states.every((s,i)=>{const r=w.ledger[i];return r&&r.total===s.order.length&&r.red===invariantRed(s).length&&r.parity===(invariantRed(s).length%2?'odd':'even')}),probesOk=w.probes.every(p=>p.done&&same(p.selection,p.before.order)&&JSON.stringify(p.after)===JSON.stringify(invariantStep(t.rule,p.before,p.before.order))&&p.delta===invariantRed(p.after).length-invariantRed(p.before).length)&&same(w.quantities,invariantQuantities(t.rule));
  if(t.kind==='legal')ok=legalHistory&&w.trials.length===t.attempts.length&&w.trials.every((tr,i)=>JSON.stringify(tr.before)===JSON.stringify(i?w.trials[i-1].after:initial)&&same(tr.ids,t.attempts[i])&&tr.legal===invariantLegal(t.rule,tr.before,tr.ids)&&tr.predicted===(tr.legal?'legal':'illegal')&&JSON.stringify(tr.after)===JSON.stringify(invariantStep(t.rule,tr.before,tr.ids)));
  if(t.kind==='parity')ok=legalHistory&&enough&&['initial','current'].every(side=>{const red=invariantRed(side==='initial'?initial:w.state),flat=w.pairs[side].flat();return w.pairs[side].every(p=>p.length===2&&new Set(p).size===2)&&new Set([...flat,...w.left[side]]).size===red.length&&same([...flat,...w.left[side]],red)&&w.left[side].length===red.length%2&&(red.length%2?!w.none[side]:w.none[side])&&w.parity[side]===(red.length%2?'odd':'even')});
  if(t.kind==='invariant')ok=legalHistory&&enough&&ledgerOk&&probesOk&&(invariantQuantities(t.rule).includes('red')||states.some(s=>invariantRed(s).length!==invariantRed(initial).length));
  if(t.kind==='proof'){const reachable=invariantReachable(t).has(t.goal.join(','));ok=legalHistory&&enough&&ledgerOk&&w.verdict===(reachable?'reachable':'unreachable');if(reachable)ok=ok&&w.proof==='path'&&JSON.stringify(w.state.order.map(id=>w.state.colors[id]))===JSON.stringify(t.goal);else{const initialRed=invariantRed(initial).length,goalRed=t.goal.filter(c=>c==='红').length,proof=t.rule==='swapAdjacent'?'count':'parity';ok=ok&&probesOk&&w.proof===proof&&(proof==='count'?initialRed!==goalRed:initialRed%2!==goalRed%2)}}
 }return {ok,incomplete:w.moves===0,reason:'覆盖所有候选并逐条件核查；只能执行合法原卡操作，计数表匹配真实状态。红卡配对必须保留每个身份；不变量须穷尽一次操作的局部类型，可达给真实路径，不可达要保存量与目标矛盾，单次失败不能证明。'}}
function invariantAct(action,data,t){const w=invariantState(t),snapshot=JSON.stringify({...w,log:[]}),slot=Number(data.slot),row=Number(data.row),delta=Number(data.delta),value=Number(data.value);let changed=false;w.notice='';
 if(action==='invariantCard'&&t.kind==='filter'&&t.items.includes(data.id)){w.active=w.active===data.id?'':data.id;changed=true}
 if(action==='invariantSlot'&&t.kind==='filter'&&w.active&&Number.isInteger(slot)&&slot>=0&&slot<t.items.length){const prior=w.slots.indexOf(w.active);if(prior>=0&&prior!==slot)w.slots[prior]=w.slots[slot];w.slots[slot]=w.active;w.active='';changed=true}
 if(action==='invariantClass'&&['keep','reject'].includes(data.value)){w.classification=data.value;changed=true}
 if(action==='invariantFailed'&&t.conditions?.some(c=>c.id===data.id)){const at=w.failed.indexOf(data.id);at<0?w.failed.push(data.id):w.failed.splice(at,1);changed=true}
 if(action==='invariantRecord'&&t.kind==='filter'&&w.slots.every(Boolean)&&w.classification&&w.records.length<40){w.records.push({id:'R'+(++w.serial),tuple:[...w.slots],status:w.classification,failed:[...w.failed]});w.slots.fill(null);w.classification='';w.failed=[];changed=true}
 if(action==='invariantDelete'&&t.kind==='filter'){const at=w.records.findIndex(r=>r.id===data.id);if(at>=0){w.records.splice(at,1);changed=true}}
 if(action==='invariantCoin'&&w.state?.order.includes(data.id)){const at=w.selection.indexOf(data.id);at<0?w.selection.push(data.id):w.selection.splice(at,1);changed=true}
 if(action==='invariantPredictLegal'&&t.kind==='legal'&&['legal','illegal'].includes(data.value)){w.prediction=data.value;changed=true}
 if(action==='invariantRun'&&w.state&&w.selection.length&&w.history.length<10&&(t.kind!=='legal'||w.prediction&&w.trials.length<t.attempts.length)){const before={order:[...w.state.order],colors:{...w.state.colors}},ids=[...w.selection],legal=invariantLegal(t.rule,before,ids),after=invariantStep(t.rule,before,ids);if(t.kind==='legal'){w.trials.push({ids,predicted:w.prediction,legal,before,after});w.prediction=''}if(legal){w.history.push({ids,before,after});w.state=after;w.ledger.push({total:0,red:0,parity:''});w.pairs.current=[];w.left.current=[];w.none.current=false;w.parity.current='';w.pairSelection=[]}else w.notice='这组原卡不符合本题规则，状态没有改变。';w.selection=[];changed=true}
 if(action==='invariantLedger'&&Number.isInteger(row)&&row>=0&&row<w.ledger.length&&['total','red'].includes(data.key)&&[-1,1].includes(delta)&&w.ledger[row][data.key]+delta>=0&&w.ledger[row][data.key]+delta<=12){w.ledger[row][data.key]+=delta;changed=true}
 if(action==='invariantLedgerParity'&&w.ledger[row]&&['even','odd'].includes(data.value)){w.ledger[row].parity=data.value;changed=true}
 if(action==='invariantPairSide'&&t.kind==='parity'&&['initial','current'].includes(data.value)){w.pairSide=data.value;w.pairSelection=[];changed=true}
 if(action==='invariantPairCoin'&&t.kind==='parity'){const side=w.pairSide,red=invariantRed(side==='initial'?invariantInitial(t):w.state),used=[...w.pairs[side].flat(),...w.left[side]];if(red.includes(data.id)&&!used.includes(data.id)){const at=w.pairSelection.indexOf(data.id);at<0?w.pairSelection.push(data.id):w.pairSelection.splice(at,1);changed=true}}
 if(action==='invariantBindPair'&&t.kind==='parity'&&w.pairSelection.length===2){w.pairs[w.pairSide].push([...w.pairSelection]);w.pairSelection=[];changed=true}
 if(action==='invariantSingle'&&t.kind==='parity'&&w.pairSelection.length===1&&w.left[w.pairSide].length===0){w.left[w.pairSide]=[...w.pairSelection];w.pairSelection=[];w.none[w.pairSide]=false;changed=true}
 if(action==='invariantNoSingle'&&t.kind==='parity'){w.none[w.pairSide]=!w.none[w.pairSide];if(w.none[w.pairSide])w.left[w.pairSide]=[];changed=true}
 if(action==='invariantParity'&&t.kind==='parity'&&['even','odd'].includes(data.value)){w.parity[w.pairSide]=data.value;changed=true}
 if(action==='invariantProbeCoin'&&w.probes[row]&&!w.probes[row].done&&w.probes[row].before.order.includes(data.id)){const p=w.probes[row],at=p.selection.indexOf(data.id);at<0?p.selection.push(data.id):p.selection.splice(at,1);changed=true}
 if(action==='invariantProbeRun'&&w.probes[row]&&!w.probes[row].done){const p=w.probes[row];if(p.selection.length===p.before.order.length&&p.before.order.every(id=>p.selection.includes(id))){p.after=invariantStep(t.rule,p.before,p.selection);p.done=true;changed=true}}
 if(action==='invariantProbeDelta'&&w.probes[row]&&[-2,-1,0,1,2].includes(value)){w.probes[row].delta=value;changed=true}
 if(action==='invariantQuantity'&&['total','red','redParity'].includes(data.value)){const at=w.quantities.indexOf(data.value);at<0?w.quantities.push(data.value):w.quantities.splice(at,1);changed=true}
 if(action==='invariantVerdict'&&t.kind==='proof'&&['reachable','unreachable'].includes(data.value)){w.verdict=data.value;changed=true}
 if(action==='invariantProof'&&t.kind==='proof'&&['path','parity','count','failure'].includes(data.value)){w.proof=data.value;changed=true}
 if(action==='invariantUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});return true}if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function invariantSpeech(t){const w=invariantState(t);if(t.kind==='filter')return '实际候选'+w.slots.join('、')+'；已收录'+w.records.length+'种，保留'+w.records.filter(r=>r.status==='keep').map(r=>r.tuple.join('')).join('、');return '当前位置'+w.state.order.map((id,i)=>'第'+(i+1)+'位原卡'+id+w.state.colors[id]).join('；')+'；已执行'+w.history.length+'次合法操作；判断'+(w.verdict||'未选')+'；依据'+(w.proof||'未选')}
function invariantPage(){const t=INVARIANT_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!t||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(t.skillId)} · 条件与不变量</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(t.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(t.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${invariantBoard(t)}${reasonBlock(t)}${actionRow(t)}</article><aside class="side-stack"><section class="panel"><h3>探索与证明各有证据</h3><p>记录真实操作与状态。保存量要对每种合法局部情况成立；与目标矛盾才推出不可达。可达需要亲手给合法路径。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={invariantAll,invariantCondition,invariantInitial,invariantRed,invariantLegal,invariantStep,invariantChoices,invariantReachable,invariantQuantities,invariantProbes};

'use strict';
// Presentation order never determines an answer's identity. Versioned IDs keep
// older instance records interpretable when authored content changes.
const ASSESSMENT_RULES=Object.freeze({version:4,independentSuccesses:2,reviewDelayMs:24*60*60*1000});
function assessmentHash(value){let h=2166136261;for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function assessmentOptionId(task,kind,index){const explicit=kind==='reason'?task.reason?.optionIds:kind==='objects'?task.objectIds:task.optionIds;return explicit?.[index]||`${task.id}:v${task.contentVersion??5}:${kind}:${index}`}
function assessmentPermutation(length,seed){const out=Array.from({length},(_,i)=>i);let state=assessmentHash(seed)||1;for(let i=length-1;i>0;i--){state^=state<<13;state^=state>>>17;state^=state<<5;const j=(state>>>0)%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function assessmentValidOrder(order,length){return Array.isArray(order)&&order.length===length&&new Set(order).size===length&&order.every(i=>Number.isInteger(i)&&i>=0&&i<length)}
function assessmentFormal(task){return task.phase==='测'||task.phase==='巩固'}
function assessmentEvidenceContext(task,context={}){
 const kind=context.stageKind||'',phase=task.phase||'样题';
 if(context.view==='competition')return {evidenceScope:'competition-reasoning',assessmentType:'competition-challenge',formalEligible:false};
 if(context.view==='joint'){const kind=task.joint?.kind;return {evidenceScope:'knowledge-relation',assessmentType:kind==='G'?'guided-application':kind==='C'?'counterexample-application':kind==='D'?'delayed-application':'independent-application',formalEligible:['I1','I2','D'].includes(kind)}}
 if(context.view==='stage'){
  const independent=/^independent(?:[2-4])?$/.test(kind)&&phase==='测';
  const review=/^delayed(?:7|21)?$/.test(kind)&&phase==='巩固';
  return {evidenceScope:'micro-skill',assessmentType:independent?'independent':review?'delayed-review':'guided-transfer',formalEligible:independent||review};
 }
 if(['fruit','course','transfer'].includes(context.view))return {evidenceScope:'legacy-route',assessmentType:assessmentFormal(task)?phase==='测'?'route-assessment':'route-review':phase==='学'?'learning-example':'practice',formalEligible:assessmentFormal(task)};
 if(context.view==='sample')return {evidenceScope:'legacy-route',assessmentType:'sample',formalEligible:false};
 return {evidenceScope:'micro-skill',assessmentType:context.view==='micro'?'local-diagnostic':context.view==='demo'?'demonstration':'practice',formalEligible:false};
}
function assessmentMigrateAttempt(attempt,descriptor){
 if(attempt.evidenceVersion!==2){
  if(attempt.evidenceStatus!=='legacy-unverified'){attempt.legacyIndependent=attempt.independent===true;attempt.legacyFirstSubmissionCorrect=attempt.firstSubmissionCorrect===true}
  attempt.independent=false;attempt.firstSubmissionCorrect=false;attempt.evidenceScope='historical-unverified';attempt.evidenceStatus='legacy-unverified';return attempt;
 }
 if(attempt.evidenceRuleVersion!==ASSESSMENT_RULES.version)attempt.previousEvidence??={ruleVersion:attempt.evidenceRuleVersion||3,independent:attempt.independent===true,phase:attempt.phase||null,stageKind:attempt.stageKind||null};
 if(!descriptor){attempt.priorFormalEvidence??={contentVersion:attempt.contentVersion,ruleVersion:attempt.evidenceRuleVersion||3,independent:attempt.independent===true,firstSubmissionCorrect:attempt.firstSubmissionCorrect===true,evidenceScope:attempt.evidenceScope||null,assessmentType:attempt.assessmentType||null};attempt.independent=false;attempt.evidenceScope='historical-unverified';attempt.assessmentType='unknown-or-revised-task';attempt.evidenceStatus='version-unverified';return attempt}
 const contract=assessmentEvidenceContext(descriptor.task,descriptor);
 const unassisted=attempt.firstSubmissionCorrect===true&&attempt.gradingResult==='correct'&&attempt.modelViewed===false&&Array.isArray(attempt.hintEvents)&&!attempt.hintEvents.length;
 attempt.unassistedFirstSubmissionCorrect=unassisted;
 attempt.independent=attempt.independent===true&&unassisted&&contract.formalEligible;
 Object.assign(attempt,contract,{phase:descriptor.task.phase||'样题',stageKind:descriptor.stageKind||null,evidenceRuleVersion:ASSESSMENT_RULES.version});
 attempt.evidenceStatus=attempt.previousEvidence?.independent&&!contract.formalEligible?'scope-corrected':'record-contract-checked';
 return attempt;
}
function assessmentIndependentRecord(attempt){return attempt.pendingSave!==true&&attempt.evidenceVersion===2&&attempt.evidenceRuleVersion===ASSESSMENT_RULES.version&&attempt.independent===true&&attempt.firstSubmissionCorrect===true&&attempt.gradingResult==='correct'&&attempt.modelViewed===false&&Array.isArray(attempt.hintEvents)&&!attempt.hintEvents.length&&attempt.formalEligible===true}
function assessmentEvidenceCounts(attempts){
 const scopes={'micro-skill':new Set(),'legacy-route':new Set()};
 for(const a of attempts)if(assessmentIndependentRecord(a)&&scopes[a.evidenceScope])scopes[a.evidenceScope].add(a.contentVersion+':'+a.taskInstanceId);
 return {microSkill:scopes['micro-skill'].size,legacyRoute:scopes['legacy-route'].size};
}
function assessmentReviewProgress(previous,tasks,attempts=[]){
 const state={...previous,reviewInstances:[]},reviews=Object.entries(tasks).filter(([kind])=>/^delayed(?:7|21)?$/.test(kind));
 const keep=a=>{const match=reviews.find(([,t])=>t.id===a?.taskInstanceId&&(t.contentVersion??5)===a.contentVersion);if(!match||a.evidenceScope!=='micro-skill'||a.assessmentType!=='delayed-review'||!assessmentIndependentRecord(a)||!Number.isFinite(a.submittedAt))return;const [kind]=match,days=kind==='delayed7'?7:kind==='delayed21'?21:1;if(!state.independentQualifiedAt||a.submittedAt<state.independentQualifiedAt+days*ASSESSMENT_RULES.reviewDelayMs)return;if(!state.reviewInstances.some(r=>r.taskInstanceId===a.taskInstanceId&&r.contentVersion===a.contentVersion))state.reviewInstances.push({...a,hintEvents:[],operationSummary:undefined,answer:undefined,explanationEvidence:undefined})};
 for(const a of Array.isArray(previous?.reviewInstances)?previous.reviewInstances:[]){if(reviews.some(([,t])=>t.id===a.taskInstanceId&&(t.contentVersion??5)===a.contentVersion))keep(attempts.find(r=>r.id===a.id)||a);else{state.legacyReviewInstances??=[];if(!state.legacyReviewInstances.some(r=>r.id===a.id))state.legacyReviewInstances.push(a)}}
 for(const a of attempts)keep(a);
 for(const [kind,t] of reviews)state[kind+'FirstCorrect']=state.reviewInstances.some(a=>a.taskInstanceId===t.id&&(t.contentVersion??5)===a.contentVersion);
 return state;
}
function choiceButtons(task,pairs,action,group='answer',selected=draft.work?.choice){
 const proxy={...task,options:pairs.map(p=>p[1]),optionIds:pairs.map(([v])=>`${task.id}:v${taskVersion(task)}:control:${group}:${v}`)};
 return `<div class="fraction-choices">${displayOrder(proxy,'control:'+group).map(i=>`<span class="semantic-choice"><button class="secondary" data-action="${esc(action)}" data-value="${esc(pairs[i][0])}" data-option-id="${esc(proxy.optionIds[i])}" aria-pressed="${selected===pairs[i][0]}">${esc(pairs[i][1])}</button><button class="speak-inline" data-action="speakControl" data-label="${esc(pairs[i][1])}" aria-label="朗读这张选择卡">🔊</button></span>`).join('')}</div>`;
}
function assessmentStageProgress(previous,tasks,attempts=[]){
 const state={...previous,cleanInstances:[]};
 const independent=Object.entries(tasks).filter(([kind])=>kind.startsWith('independent')).map(([,t])=>t);
 const keep=a=>{const t=independent.find(t=>t.id===a?.taskInstanceId&&(t.contentVersion??5)===a.contentVersion);if(t&&a.evidenceScope==='micro-skill'&&a.assessmentType==='independent'&&assessmentIndependentRecord(a)&&Number.isFinite(a.submittedAt)&&a.submittedAt>0&&!state.cleanInstances.some(x=>x.taskId===a.taskInstanceId&&x.contentVersion===a.contentVersion))state.cleanInstances.push({taskId:a.taskInstanceId,contentVersion:a.contentVersion,at:a.submittedAt,attemptId:a.id,evidenceRuleVersion:ASSESSMENT_RULES.version,record:{id:a.id,taskInstanceId:a.taskInstanceId,contentVersion:a.contentVersion,submittedAt:a.submittedAt,evidenceVersion:2,evidenceRuleVersion:ASSESSMENT_RULES.version,evidenceScope:'micro-skill',assessmentType:'independent',formalEligible:true,independent:true,firstSubmissionCorrect:true,gradingResult:'correct',modelViewed:false,hintEvents:[]}})};
 const historical=[];
 for(const entry of Array.isArray(previous?.cleanInstances)?previous.cleanInstances:[]){
  if(entry.evidenceRuleVersion===ASSESSMENT_RULES.version&&entry.record&&entry.attemptId===entry.record.id&&independent.some(t=>t.id===entry.taskId&&(t.contentVersion??5)===entry.contentVersion))keep(attempts.find(a=>a.id===entry.attemptId)||entry.record);
  else historical.push(entry);
 }
 if(historical.length)state.legacyCleanInstances=historical;
 for(const a of attempts)keep(a);
 state.cleanInstances.sort((a,b)=>a.at-b.at);
 state.cleanIndependentAt=state.cleanInstances[0]?.at||0;
 state.cleanTaskId=state.cleanInstances.at(-1)?.taskId||'';
 state.independentQualifiedAt=state.cleanInstances.length>=ASSESSMENT_RULES.independentSuccesses?state.cleanInstances[ASSESSMENT_RULES.independentSuccesses-1].at:0;
 return state;
}
if(typeof module!=='undefined')module.exports={ASSESSMENT_RULES,assessmentHash,assessmentOptionId,assessmentPermutation,assessmentValidOrder,assessmentFormal,assessmentEvidenceContext,assessmentMigrateAttempt,assessmentIndependentRecord,assessmentEvidenceCounts,assessmentStageProgress,assessmentReviewProgress};

'use strict';
// Authored transfers change a representation, condition, direction or unknown.
// Finite number variants are distinct instances, not new transfer dimensions.
const transferStages=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
const TRANSFER_AUDIT={};
function replaceTransfer(sid,params,dimension,proof,contentVersion=72){
 const old=transferStages[sid].transfer;
 transferStages[sid].transfer={id:old.id,skillId:sid,phase:'迁移',contentVersion,authorship:'原创儿童操作适配',...params,semanticParameters:Object.fromEntries(Object.entries(params).filter(([key])=>key!=='prompt')),changeDimension:dimension,explain:proof,hint:'先看改变的条件，再动手验证。'};
 TRANSFER_AUDIT[sid]={taskId:old.id,contentVersion,dimension,proof,codeStatus:'真实模型已接入；数学/状态按证据登记；浏览器与iPad待验'};
}
function retainTransfer(sid,dimension,proof){
 const t=transferStages[sid].transfer;
 if(dimension)t.changeDimension=dimension;
 if(proof)t.explain=proof;
 TRANSFER_AUDIT[sid]={taskId:t.id,contentVersion:t.contentVersion,dimension:t.changeDimension,proof:t.explain,codeStatus:'既有实质变化已审查；浏览器与iPad待验'};
}
replaceTransfer('A01.02',{mode:'reverseExchange',initialTens:2,initialOnes:2,targetTens:0,targetOnes:22,prompt:'把2根十棒都拆开，与原来的2个散点合起来，再判断总数。'},'捆十改为逐棒拆回；交换方向和次数改变','20个棒内原点和2个散点仍是22个，表示改变而数量不变。');
replaceTransfer('A01.03',{mode:'placeCompose',tens:5,ones:2,sourceMoney:[20,20,10,1,1],prompt:'看钱币图：两张20元、一张10元和两枚1元。用十棒和散点表示同样金额。'},'不同面额组合转成十与一','20＋20＋10＋1＋1＝52；每张20元对应两个十。');
replaceTransfer('A01.05',{mode:'forwardExchange',initialTens:2,initialOnes:13,prompt:'把2个十和13个一整理成个位不足10的表示。先将10个散点收入框，再捆棒。'},'标准表示拆回改为非标准表示重新组成十','同一批33个原单位由2十13一整理为3十3一。');
replaceTransfer('A02.02',{mode:'tenFill',filled:8,filledIndices:[0,1,2,4,5,6,8,9],target:10,prompt:'圆点散放在十格板里。只补空格，一格一颗，正好凑满十。'},'连续尾部空位改为中间分散空位','两个空位各补一个；位置变化，8＋2＝10不变。');
replaceTransfer('A02.03',{mode:'inverseMove',initial:8,delta:3,inverseOrder:'removeFirst',prompt:'先从8颗里拿走3颗，再把同样的3颗逐颗放回。选择整个过程的关系。'},'先加后减改为先减后加；放回同一批原点','8－3＋3＝8，被拿走的三个原点回到原盘。');
replaceTransfer('A02.04',{mode:'equalGroups',groups:4,each:3,total:12,arrayLayout:true,prompt:'把12个原点排成4行，每行3个。每点只占一个位置。'},'分盘等组改为二维行列阵列','4行各3点组成12点；行数是组数，列数是每组量。');
replaceTransfer('A03.01',{mode:'fractionLab',kind:'shade',denom:6,target:4,partitionRows:2,prompt:'同一个长方形平均分成两行共6格。涂其中4份。'},'一维纸条改为二维等面积分割','六个等面积小格合成同一整体，四格占4/6。');
replaceTransfer('A03.02',{mode:'fractionLab',kind:'shade',denom:6,target:1,wholeShape:'circle',prompt:'同一个圆平均分成6个扇形。点亮一个等份，表示1/6。'},'等长纸条改为等面积圆扇形','同圆六个等角扇形面积相等，其中一份是整个圆的1/6。');
replaceTransfer('A03.03',{mode:'fractionLab',kind:'compare',denomLeft:4,targetLeft:3,denomRight:4,targetRight:2,wholeScaleLeft:1,wholeScaleRight:2,correctChoice:'differentWhole',prompt:'左边整条只有右边的一半长。各四等分，左涂3格、右涂2格。能只按涂色格数比较实际长度吗？'},'整体不同的反例；区分分数大小与实际量','3/4与2/4这两个分数能比较，但左边每格更短，实际长度不能仅按3格与2格判断。');
replaceTransfer('A03.04',{mode:'fractionLab',kind:'equal',denomLeft:4,targetLeft:2,denomRight:8,targetRight:4,partitionRowsLeft:2,partitionRowsRight:2,compareArea:true,prompt:'两个外框面积一样大，左分4格涂2格，右分8格涂4格。比较涂色面积。'},'等长度等值改为二维等面积等值','同样大的两个面都涂一半，2/4＝4/8；格数无需相等。');
replaceTransfer('A03.05',{mode:'fractionLab',kind:'line',denom:4,target:3,lineStart:1,lineEnd:2,coordinate:1.75,prompt:'数轴显示1到2，平均分成4段。点出1又3/4的刻度。'},'数轴左端不再为零；由段数转绝对坐标','从1再走3/4单位到1又3/4，第三段端点不是3/4。');
replaceTransfer('A03.06',{mode:'fractionLab',kind:'decimal',denom:10,target:4,wholeShape:'circle',choices:['0.4','0.04','4'],correctChoice:'0.4',prompt:'同圆平均分10个扇形，涂4份，选择对应小数。'},'长度十分位改为面积十分位','4/10＝0.4，形状改变而整体单位不变。');
replaceTransfer('A03.07',{mode:'fractionLab',kind:'remainder',total:18,first:6,second:6,answerBasis:'remaining',requireBasisSelection:true,choices:['1/2','1/3','2/3'],correctChoice:'1/2',prompt:'18块先拿6块，再拿6块。选择第一次之后的一盘作为整体，判断第二次取走这盘的几分之几。'},'原整体改为剩余整体；主动选择原点集合','第一次剩12块，第二次6块占6/12＝1/2；按原18块才是1/3。');
replaceTransfer('A04.01',{mode:'percentLab',kind:'shade',total:20,wholeIndices:Array.from({length:12},(_,i)=>i),requireWholeSelection:true,target:3,choices:['25%','15%','3%'],correctChoice:'25%',prompt:'框内12颗是本题整体，桌上另有8颗。先选整体，再涂框内3颗，判断百分数。'},'加入框外对象；全部对象与规定整体分开','3颗占框内12颗的25%；15%采用全桌20颗，基准不符。');
replaceTransfer('A04.02',{mode:'fractionLab',kind:'decimal',denom:20,target:15,partitionRows:4,choices:['0.75','0.075','75'],correctChoice:'0.75',prompt:'同一个方格面共20格，涂出75%，再选小数表示。'},'百分数转分数改为转小数与二维面积','15/20＝3/4＝75/100＝0.75。');
replaceTransfer('A04.03',{mode:'percentLab',kind:'shade',total:8,target:6,wholeShape:'circle',choices:['6','8','75'],correctChoice:'6',prompt:'8个等面积扇形合成一个圆。点亮75%，选择亮了几份。'},'离散排点改为圆面积份','8份的四分之三是6份；75是每百份比例，并非本题份数。');
replaceTransfer('A04.04',{mode:'percentLab',kind:'whole',part:2,knownCount:6,givenPercent:60,knownShares:3,copies:5,choices:['10','6','3.6'],correctChoice:'10',prompt:'整体的60%有6颗。先把6个原点平均分成3个单位份，再补出其余份，恢复整体。'},'已知非单位分数；先拆单位份再反求整体','60%＝3/5，6颗对应3份，每份2颗，5份共10颗。');
replaceTransfer('A04.05',{mode:'percentLab',kind:'change',changeOrder:'removeFirst',start:100,remove:20,add:16,choices:['96','100','104'],correctChoice:'96',prompt:'100先减少20%，再按变化后的整体增加20%。按顺序操作，判断最终量。'},'先增后减改为先减后增；新基准变小','先剩80，再增加80的20%即16，最后96。');
replaceTransfer('A04.06',{mode:'percentLab',kind:'estimate',a:49,b:21,bounds:{lower:[40,20],upper:[50,30]},choices:['800＜积＜1500','积＜800','积＞1500'],correctChoice:'800＜积＜1500',prompt:'给49×21构造整十下界与上界，保存两幅面积模型，再选积所在区间。'},'单近似值改为有方向的严格上下界','正因数满足40＜49＜50、20＜21＜30，所以800＜积＜1500。');
replaceTransfer('R04.05',{mode:'scaleLab',kind:'change',changeOrder:'removeFirst',start:100,remove:20,add:16,choices:['96','100','104'],correctChoice:'96',prompt:'原量100，先减少20%，再按当前量增加20%。完成模型并判断最终量。'},'反向连续变化；每步采用当前基准','100×0.8×1.2＝96；相同百分比对应不同实际增减量。');
for(const sid of ['A01.01','A01.04','A02.01','A02.05','A02.06'])retainTransfer(sid);
replaceTransfer('A05.01',{mode:'integerLab',kind:'position',axis:'vertical',start:0,target:-2,context:'海面与潜水',prompt:'海面记作0。沿竖直数轴向下两格，标出潜水员所在的位置。'},'水平数轴改为正数在上、负数在下的竖直轴','方向取决于数轴：这里向下数值减小，0向下两格是−2。',73);
retainTransfer('A05.02','跨正负比较改为两个负数比较','−2位于−5右边，所以−2更大；绝对值更大不能代替数本身更大。');
replaceTransfer('A05.03',{mode:'integerLab',kind:'walk',start:3,target:-2,context:'反向跨零',prompt:'从＋3逐格走到−2，经过0；每步向左一格，不绕路。'},'由负到正改为由正到负；跨零方向反转','3到0是3格，再到−2是2格，共5格；每步坐标减1。',73);
replaceTransfer('A05.04',{mode:'integerLab',kind:'square',side:3,unitSize:2,target:36,context:'方砖面积',prompt:'每块方砖边长2米。铺出3行、每行3块的正方形，再写实际面积。'},'格数改为含实际边长的面积单位','9块方砖，每块4平方米，总面积36平方米；9是块数。',73);
replaceTransfer('A05.05',{mode:'integerLab',kind:'root',side:3,unitSize:2,target:36,context:'方砖边长',prompt:'每块方砖边长2米。拼出面积36平方米的正方形，再写实际边长。'},'平方根从方格边数改为实际长度','3块连成一边，每块2米，边长6米；6×6＝36。',73);
replaceTransfer('A05.06',{mode:'integerLab',kind:'power',base:1,exponent:4,target:1,context:'不增长的复制规则',prompt:'从1开始，每轮乘1，共做4轮。观察数量是否一定增长。'},'底数1的边界反例；重复乘法不一定增长','1的四次幂仍为1。轮数变化并不意味着数量必定变大。',73);
replaceTransfer('R01.01',{mode:'ratioLab',kind:'partition',red:12,blue:8,copies:4,unitRed:3,unitBlue:2,context:'反求单位份',prompt:'红12颗、蓝8颗，分成4个完全相同的份。先决定一份中各色的数量，再逐份分完。'},'已知一份求份数改为已知份数求单位份','蓝8颗对应4份，每份蓝2颗；红12颗对应同样4份，每份红3颗。',73);
retainTransfer('R01.02','比的先后顺序由红在前改为蓝在前','前项必须对应题目先说的颜色，不能按界面位置固定写红在前。');
replaceTransfer('R01.03',{mode:'ratioLab',kind:'whole',red:2,blue:3,focusSide:'blue',context:'部分换位',prompt:'摆出红2颗、蓝3颗。把整个盒子作为整体，选择蓝色占整体的几分之几。'},'关注的部分从红色改为蓝色；整体包含两色','蓝色3颗，整体5颗，所以蓝占3/5；3/2是蓝比红。',73);
replaceTransfer('R01.04',{mode:'ratioLab',kind:'scale',red:3,blue:2,copies:2,targetCopies:{red:2,blue:1},context:'单边复制反例',prompt:'原来红3颗、蓝2颗。只把红色复制一份，蓝色不变。完成模型，判断配比是否保持。'},'共同倍增改为只变一种量的反例','红变成6、蓝仍2；6:2不等于3:2，单边复制改变配比。',73);
replaceTransfer('R01.05',{mode:'ratioLab',kind:'partition',red:8,blue:4,copies:4,unitRed:2,unitBlue:1,knownUnit:true,context:'反求完整份数',prompt:'每袋红2颗、蓝1颗。把红8颗和蓝4颗按这个配方分袋，找出能分几袋。'},'已知总量与袋数求每袋量改为已知每袋量求袋数','两色每袋配方固定，4袋恰好用完红8颗、蓝4颗。',73);
retainTransfer('R02.01','给总价求单价改为给单价合成总价','每一件放入相同单价；未知量从每件价格换为总价。');
retainTransfer('R02.02','由总流量反求单位率改为给单位率合成总量','已知每单位的量，必须对全部时间格按同样量累计。');
replaceTransfer('R02.03',{mode:'rateLab',kind:'compare',a:{units:2,per:3,total:6},b:{units:4,per:3,total:12},unit:'本',amountUnit:'元',context:'总价不同、单价相同',prompt:'甲2本共6元，乙4本共12元。把两边总价分别平均分到每一本，再比较单价。'},'总价不同但单位率相等的反例','甲6÷2＝3，乙12÷4＝3；总价不同，单价可以相同。',73);
replaceTransfer('R02.04',{mode:'rateLab',kind:'convert',direction:'reverse',from:'米',to:'厘米',factor:100,count:6,context:'小单位捆回大单位',prompt:'600厘米，每100厘米捆成1米。逐份换成米，核对大单位的份数。'},'大单位展开成小单位改为小单位捆回大单位','600厘米含六个100厘米，换成6米；数字减小而长度不变。',73);
retainTransfer('R02.05','由总量求复合单位率改为按已知单位率求总量','距离与时间按同一单位率对应，未知位置从单位率改为总距离。');
replaceTransfer('R03.01',{mode:'journeyLab',kind:'inverse',per:2,count:3,elapsedPer:10,interval:'10分钟',unit:'千米',context:'时间单位转换',prompt:'每10分钟走2千米。逐个时间格摆到6千米，再写实际用了多少分钟。'},'时间格数反求后还需换算为实际分钟','三个时间格，每格10分钟，共30分钟；3是格数，不是分钟数。',73);
retainTransfer('R03.02','由总量反求时间改为给时间合成总量','时间已知时累计各分钟的成果；未知量换为总张数。');
replaceTransfer('R03.03',{mode:'journeyLab',kind:'segment',segments:[3,0,4],interval:'10分钟',unit:'千米',context:'中途停留',prompt:'三个相同时间段依次走3千米、停留、再走4千米。逐时段记录，停留时也保留时间格。'},'加入零路程时段；累计量不变而时间仍推进','三时段累计是3、3、7千米，停留那段不能从时间轴删除。',73);
replaceTransfer('R03.04',{mode:'journeyLab',kind:'remaining',segments:[4,3],whole:12,unknownWhole:true,givenRemaining:5,interval:'段',unit:'千米',context:'从部分恢复全程',prompt:'已经走4千米和3千米，还剩5千米。摆出已走部分，并调整全程外框，正好包含全部路程。'},'给全程求剩余改为给已走和剩余反求整体','已走7千米，加上剩余5千米，全程12千米；剩余只加入一次。',73);
replaceTransfer('R03.05',{mode:'journeyLab',kind:'joint',a:2,b:4,count:3,starts:{a:0,b:1},interval:'分钟',unit:'个',context:'不同开工时间',prompt:'甲每分钟2个，乙每分钟4个。甲先做1分钟，乙从第2分钟加入，到第3分钟结束。按实际开工时间摆成果。'},'同时开工改为乙晚1分钟；分别核对有效工作时长','甲做3分钟得6个，乙做2分钟得8个，共14个；不能把乙也计3分钟。',73);
replaceTransfer('R04.01',{mode:'scaleLab',kind:'pair',red:2,blue:3,factor:2,targetFactors:{red:2,blue:1},context:'只改一种颜色',prompt:'红2朵、蓝3朵。只复制红色一份，蓝色保持不变，判断原配比是否保持。'},'同倍缩放改为单边改变的反例','红4、蓝3的4:3与原2:3不同；两量必须同倍改变才保持比。',73);
replaceTransfer('R04.02',{mode:'scaleLab',kind:'length',short:6,long:10,factor:2,direction:'shrink',context:'反向缩小',prompt:'原图两边长6格和10格。把两条边都缩为原来的一半，观察对应长度。'},'放大改为缩小；长度除以相同倍数','6÷2＝3、10÷2＝5，两边都减为一半，3:5仍等于6:10。',73);
replaceTransfer('R04.03',{mode:'scaleLab',kind:'area',rows:2,cols:2,factor:3,axisFactors:{rows:1,cols:3},context:'只扩一个方向',prompt:'原图2行2列。保持行数，把列数扩成3份，判断新图是否仍与原图相似。'},'两轴共同扩展改为只扩列；面积与相似条件分开','现在2行6列，共12格，是原面积3倍；行列倍数不同，所以形状不相似。',73);
replaceTransfer('R04.04',{mode:'scaleLab',kind:'map',inputUnitSize:2,per:3,count:3,from:'杯面粉',to:'个蛋糕',context:'非单个输入份',prompt:'每2杯面粉对应3个蛋糕。用真实的两杯输入和三个输出组，摆出6杯面粉的对应蛋糕。'},'每一个输入单位改为每两个输入单位的对应组','6杯面粉是三组两杯，每组3个蛋糕，共9个；不能把每杯误当3个蛋糕。',73);

replaceTransfer('L01.01',{mode:'equationLab',kind:'equal',left:[3,2],right:[3,4],equalAnswer:false,methodSpecific:false,context:'等号反例',prompt:'把左盘3＋2、右盘3＋4全部摆出。判断两盘是否相等。'},'两个相等分解改为不相等的反例','左盘5、右盘7，总量不同；都含3并不表示两盘相等。',74);
replaceTransfer('L01.02',{mode:'equationLab',kind:'unknown',known:2,total:8,unknownSide:'right',methodSpecific:false,context:'未知袋换边',prompt:'左边8颗，右边未知袋加2颗，两盘相等。自己确定袋内数，可用两边同取验证。'},'未知袋从等号左边换到右边；允许自主有效解法','8＝袋＋2与袋＋2＝8表达同一等量关系，袋里6颗；不必固定先做同取。',74);
replaceTransfer('L01.03',{mode:'equationLab',kind:'bilateral',known:2,total:6,addBoth:3,methodSpecific:true,context:'双边同加',prompt:'未知袋加2颗等于6颗。两盘各添3颗，再摆出原未知袋，核对原式和新式。'},'两边同减改为两边同加；未知量不变','原袋4颗；两边各添3后，4＋5＝9。只添一边不能保持等量。',74);
replaceTransfer('L01.04',{mode:'equationLab',kind:'inverse',initial:8,remain:3,removedGiven:5,unknownInitial:true,methodSpecific:false,context:'反求原整体',prompt:'先前拿走5颗，现在剩3颗。把同一批拿走的原点放回，再写原来有多少颗。'},'已知原量求拿走量改为给拿走与剩余求原量','拿走的5颗和剩余3颗合成原来8颗，放回改变位置而不制造对象。',74);
replaceTransfer('L01.05',{mode:'equationLab',kind:'substitute',bag:6,known:2,total:9,correctVerdict:'reject',methodSpecific:false,context:'不合适的候选值',prompt:'原式是未知袋＋2＝9。试把袋里放6颗，代回完整原式，判断这个候选是否满足。'},'正确候选改为错误候选；代回是检验而非确认','6＋2＝8，不等于9，候选6不满足原式。',74);
replaceTransfer('L02.01',{mode:'constraintLab',kind:'reverse',groups:3,extra:2,bag:4,extraOutside:true,context:'整批附加一次',prompt:'3个相同未知袋，整批另外加2颗，总共14颗。先撤销整体附加，再把剩余原点均分，找每袋量。'},'每组附加改为整体只附加一次；逆运算层次改变','14－2＝12，再均分3组得每袋4；不能先用14除以3，也不能扣三次2。',74);
replaceTransfer('L02.02',{mode:'constraintLab',kind:'verify',groups:3,extra:2,bag:4,extraOutside:true,givenTotal:15,correctVerdict:'reject',context:'整体附加与错误候选',prompt:'3个相同袋，整批另加2颗，目标总数15。试每袋4颗，摆出完整模型，判断候选是否满足。'},'附加位置换到整体且候选不满足；不能把代回当自动成立','3×4＋2＝14，不是15；附加2只算一次，候选4不满足。',74);
replaceTransfer('L02.03',{mode:'constraintLab',kind:'parity',total:12,divisor:3,context:'可行的整数分组',prompt:'12个原点平均分成3个同样多的整数组。逐轮每组各放1颗，判断能否全分完。'},'有余数的不可行情况改为整除的可行边界','三组各4颗，无剩余，因此有整数解；不能固定选择“没有整数解”。',74);
replaceTransfer('L02.04',{mode:'constraintLab',kind:'stock',stock:3,per:4,context:'连一袋也装不满',prompt:'库存只有3颗，一满袋要4颗。核对原库存和下一袋空位，判断能否装一满袋。'},'可装若干袋改为最大完整袋数为0的边界','3＜4，一满袋也装不出；0个完整袋是有效结论，不是未操作。',74);
replaceTransfer('L02.05',{mode:'constraintLab',kind:'optimal',stock:12,per:4,context:'恰好用完的最优方案',prompt:'12颗，每满袋4颗。比较最多可行方案与再多一袋，选择最大完整袋数。'},'有剩余改为恰好用完；最大可行与邻近不可行证明','3袋正好用完12颗，4袋要16颗，缺4颗；无需强制试遍较小袋数。',74);
retainTransfer('L03.01','交替AB改为含相邻同符号的ABB最短重复块','ABB重复与AB交替不同。只取AB无法生成ABBABB，六格块可以重复但不是最短。');
replaceTransfer('L03.02',{mode:'patternLab',kind:'arithmetic',initial:[14,12,10],step:-2,context:'递减等差',prompt:'规则已给定：每次减2。从14、12、10继续两项。'},'正公差增长改为负公差递减','相邻差都是−2，后两项8、6；不能把差的大小2直接当加2。',74);
replaceTransfer('L03.03',{mode:'patternLab',kind:'geometric',initial:[3,3,3],factor:1,context:'公比为1的边界',prompt:'规则已给定：每次乘1。从3、3、3继续两项，核对是否必须变大。'},'公比大于1改为公比1的常量边界','同一非零数重复时，相邻比为1；后两项仍3、3。',74);
replaceTransfer('L03.04',{mode:'patternLab',kind:'explicit',initial:[1],multiplier:2,add:2,operationOrder:'addThenMultiply',context:'先加再乘',prompt:'从1开始，每一轮先加2，再乘2。按正确顺序生成接下来两项。'},'递推中的操作顺序反转；不是只换系数','(1＋2)×2＝6，(6＋2)×2＝16；先乘再加会得到4、10。',74);
replaceTransfer('L03.05',{mode:'patternLab',kind:'twoPrev',initial:[0,1],count:3,context:'从零开始的两前项递推',prompt:'从0、1开始，规则是每个新项等于紧邻前两项之和。接出三个新项。'},'加入零初始项的边界；迭代增加到三轮','依次0＋1＝1，1＋1＝2，1＋2＝3；每轮必须使用最新两项。',74);
replaceTransfer('L03.06',{mode:'patternLab',kind:'grid',tile:[['red','red','blue'],['blue','blue','red']],rows:4,cols:6,context:'二维重复块',prompt:'给出的两行按“红红蓝／蓝蓝红”构成两行三列重复块。横向和纵向重复这个块，填好下面两行。'},'棋盘相邻交替改为2×3重复块；允许相邻同色','横向每3列重复，纵向每2行重复；相邻两红是规则的一部分，不能强制处处换色。',74);
for(const sid of ['L04.01','L04.02','L04.03','L04.04','L04.05','L04.06'])retainTransfer(sid);

retainTransfer('N01.01','整除的等组改为有余数的反例','完整组数并不证明整除，必须保留余量并核对能否再成完整一组。');
replaceTransfer('N01.02',{mode:'groupingLab',kind:'remainder',total:3,divisor:4,context:'零个完整组',prompt:'3颗，每4颗一组。核对还能否圈出完整组，再选余数。'},'总量少于组量；商为0但余数不为0','3＝0×4＋3；没有完整组不表示余数也是0，余数3小于4。',75);
retainTransfer('N01.03','两位数改为含零的三位数；同时区分2/3/5规则与数位贡献','102除2无余、105除5无余、104除3余2。高位十的倍数除2/5无余；除3保留数位和余数，0的位置仍须明确选择。');
retainTransfer('N01.04','限制从十位改为个位；前导零仍被排除','个位限制与两位数条件须同时满足，02不属于两位数。');
retainTransfer('N01.05','单盘奇偶改为两部分相加，跨部分配对','合计奇偶由全部对象的两两配对决定，颜色和原分盘不限制配对。');
replaceTransfer('N02.01',{mode:'factorLab',kind:'pairs',numbers:[24],requiredPairs:2,minimumSide:2,context:'不许单行的长方阵',prompt:'24块排成完整长方阵，两边都至少2格。记录两种不同的边长对，转向不另算一种。'},'增加两边至少2的限制；平凡因数对不再可用','可用2×12、3×8、4×6；1×24不满足两边至少2，交换边长不产生新因数对。',75);
replaceTransfer('N02.02',{mode:'factorLab',kind:'all',numbers:[16,18],context:'平方与非平方的完整表',prompt:'分别用16块和18块拼遍完整整数长方阵，收录全部不同正因数。相同中间边长只收一次。'},'单一非平方表改为平方/非平方并列；中间因数重复规则不同','16的4×4只贡献一个不同因数；18的每对边长都不同，不能把两盘都按两倍对数计算。',75);
replaceTransfer('N02.03',{mode:'factorLab',kind:'prime',numbers:[1,2,9],context:'质数定义的三个边界',prompt:'用1、2、9块分别拼遍长方阵并收录不同正因数，再判断质数、合数或两者都不是。'},'加入1的定义边界并并列最小偶质数与奇平方合数','1只有一个正因数，两者都不是；2恰有两个，是质数；9有1、3、9，是合数。',75);
retainTransfer('N02.04','单独判断1改为和最小质数2并列比较','1×1中相同的1只算一个不同因数，2有1与2两个不同正因数。');
replaceTransfer('N02.05',{mode:'factorLab',kind:'square',numbers:[16,18],classifySquare:true,context:'检验是否有中间相同边',prompt:'分别拼遍16和18的长方阵，数不同因数，再判断哪盘是平方数。不能假定两盘都有相同的中间边长。'},'只处理平方数改为和非平方数对照；平方条件需要检验','16有4×4，中间因数4只一次，共5个；18无等边因数对，共6个，不是平方数。',75);
retainTransfer('N02.06','平方数改为非平方数；因数个数由奇变偶','非平方数每个因数都配一个不同的伙伴，不能沿用平方中间一项去重的计数。');
replaceTransfer('N03.01',{mode:'commonLab',kind:'multiples',periods:[3,4],starts:[1,2],horizon:25,context:'不同起点的事件',prompt:'甲第一次在1分钟，以后每3分钟；乙第一次在2分钟，以后每4分钟。生成到25分钟，选全部同时发生的时刻。'},'共同零起点改为不同起点；不能直接把时刻当周期公倍数','甲1、4、7、10…，乙2、6、10…，窗口内重合10、22；12是周期最小公倍数，却不是这里的第一次重合时刻。',75);
replaceTransfer('N03.02',{mode:'commonLab',kind:'least',periods:[4,6],starts:[1,3],horizon:30,context:'异起点的最早重合',prompt:'甲从1分钟起每4分钟一次，乙从3分钟起每6分钟一次。实际生成两条线，找最早同时发生的时刻。'},'有共同起点的最小公倍数应用改为异起点重合','甲1、5、9…，乙3、9…，最早9分钟；不能把周期的12直接当时刻答案。',75);
replaceTransfer('N03.03',{mode:'commonLab',kind:'divisors',numbers:[8,9],context:'只有单位共同因数',prompt:'8颗和9颗按相同正整数的组量试装，收录两盘都没有剩余的全部组量。'},'有非单位共同因数改为互质边界','8和9只有共同正因数1；共同不表示一定有大于1的因数。',75);
replaceTransfer('N03.04',{mode:'commonLab',kind:'greatest',dims:[6,9],unitSize:2,unit:'厘米',context:'方格边数与实际长度',prompt:'6格×9格纸板，每格边长2厘米。试铺最大整数格边长正方形，排除更大方案，再写实际边长。'},'格边数改为带物理长度单位的最大边长','最大边长3格，每格2厘米，所以实际6厘米；3是格数。',75);
replaceTransfer('N03.05',{mode:'commonLab',kind:'contexts',bells:{periods:[3,4],starts:[1,2],horizon:22},paper:{dims:[6,9],unitSize:2,unit:'厘米'},context:'不同条件的两个目标',prompt:'甲从1分钟起每3分钟，乙从2分钟起每4分钟，找首次重合；6×9格纸板每格2厘米，求最大方块实际边长。操作两套材料并选各自最小或最大目标。'},'同零起点与纯格数改为异起点事件和真实长度','事件首次重合10分钟；纸板最大方块3格即6厘米。两故事的目标和基准分别核对。',75);
replaceTransfer('N04.01',{mode:'groupingLab',kind:'reconstruct',total:14,divisor:4,knownGroups:3,remainder:2,context:'从商余恢复总数',prompt:'已有3组，每组4颗，另有2颗散点。把原组逐个打开合回一盘，再写原总数。'},'给总数求余数改为给完整组与余数反求总数','3×4＋2＝14，余数2小于4；只把原对象合回，不制造新点。',75);
replaceTransfer('N04.02',{mode:'patternLab',kind:'period',base:['A','A','A'],context:'看起来三格，实际一格',prompt:'整串全部是同一种图形。圈出最短的重复块，并用它生成整串。'},'多种图形的非平凡周期改为周期1边界；显示段不等于最短块','一格A就能生成全部A；三格可以重复，但不是最短。',75);
replaceTransfer('N04.03',{mode:'cycleLab',kind:'position',base:['A','B','B'],indexBase:0,target:8,context:'从编号0开始',prompt:'编号0是A，之后B、B，再重复。从编号0出发走到编号8，选择轮内编号。'},'第1项计数改为零基编号；先走距离再定位','编号8除以3余2，对应轮内编号2；零基编号无需再减1。',75);
replaceTransfer('N04.04',{mode:'cycleLab',kind:'weekday',base:['星期一','星期二','星期三','星期四','星期五','星期六','星期日'],start:1,direction:-1,target:9,context:'向过去倒数',prompt:'今天星期二记作0天。实际往前倒数9天，判断那天是星期几。'},'向未来过天改为向过去倒数；模负数需规范化','倒数7天仍星期二，再倒数2天到星期日；负位移不能仍顺向走。',75);
replaceTransfer('N04.05',{mode:'cycleLab',kind:'power',factor:4,period:2,target:0,context:'零次乘法的起点',prompt:'非零数4的0次方：从单位1开始，一次也不乘4。把原单位移到结果盘，选择保留的个位。'},'正指数末位循环改为零指数边界；不能套用正项周期','非零底数的0次方为1；4的正指数个位4、6不包含0次方的起始单位。',75);
replaceTransfer('N04.06',{mode:'cycleLab',kind:'position',base:['A','B','C','D'],indexBase:0,target:12,context:'零基编号的整轮',prompt:'编号0是A，之后B、C、D循环。从编号0走到编号12，选择轮内编号。'},'余数0对应第末位改为零基编号的第0位；起点改变','12除以4余0，轮内编号0是A；一基第12项才停第4位，不能混用。',75);

replaceTransfer('G01.04',{mode:'measureLab',kind:'units',rows:2,cols:3,cells:[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],unitSize:2,unit:'m',context:'一格边长两米',prompt:'花园图2行3列，每格边长2米。实际描外边、铺内部，再分别填写周长和面积并选单位。'},'每格实际边长由1变2；长度乘2、面积乘4，必须按量纲换算','外边10个单位段，每段2米，周长20米；6个单位方格，每格4平方米，面积24平方米。',76);
replaceTransfer('G03.04',{mode:'compositeLab',kind:'cut',rows:4,cols:4,remove:[[1,3],[2,3]],context:'边缘凹口与内部孔洞',hideDerivedValues:true,prompt:'4行4列纸板，只剪下最右列第2、3行的两格。形成边缘凹口，而不是内部孔洞。把原格移到材料盘，再填写保留面积。'},'内部孔洞改为边缘非角部凹口；保留面积相同但边界条件不同','原16格剪去2格，保留14；最右列切口与外部相通，原内部孔洞不与外部相通，面积相同不能代替位置条件。',76);
replaceTransfer('G04.01',{mode:'circleLab',kind:'center',radius:2,rotation:45,points:[0,90,180,270],origins:{O:[235,180],P:[180,180]},centerName:'P',context:'圆心标签需要重新核对',prompt:'两个候选点叫O和P，字母并不保证谁是圆心。任选起点连到四个圆周点，比较实际线段长度，找出等距的那个。'},'圆心从默认O换为候选P；须依据四条实际等距线段而不是名字','P到四个圆周点均为2厘米；O偏离中心，四段不等。圆心由等距关系确定，不能默认字母O就是答案。',76);
replaceTransfer('G06.03',{mode:'rightLab',kind:'solve',a:6,b:8,c:10,unit:2,unknown:'a',rotation:90,context:'斜边已知，恢复一条直角边',prompt:'已知直角三角形斜边10、另一条直角边8，每原格边长2。先核直角，再从斜边25个原平方格中扣出已知直角边平方，剩余原格拼未知正方形，填写实际未知边。'},'由两直角边求斜边改为斜边及一直角边求另一直角边；相加改相减','未知平方100－64＝36，实际边长是正根6；所有25个原格各4平方单位，在扣去盘和未知平方之间恰出现一次。',76);
replaceTransfer('G06.04',{mode:'rightLab',kind:'axis',A:[-2,3],B:[-6,3],minX:-6,maxX:0,minY:0,maxY:5,context:'负坐标之间向左量',prompt:'A在(−2,3)，B在(−6,3)。标端点，再从A向B实际逐格量，填写非负距离。'},'同列正坐标改为同行负坐标并反向行走；带符号差与距离分开','从−2走到−6向左4格，距离4；坐标差−4不能作为负长度。',76);
for(const [sid,dimension,proof] of [
 ['G01.01','单位段变2厘米且起点非0；绝对刻度与两端距离分开','1到4有3个单位段，每段2厘米，实际长度6厘米。'],
 ['G01.02','矩形外边改含凹边的L形；内接缝排除','L形4个原格的外露单位边10条，内部共用边不计，凹边仍属边界。'],
 ['G01.03','完整矩形改缺一角覆盖；空位不能补算','3×3框中仅8个目标方格，缺角不属于材料，面积8平方厘米。'],
 ['G01.05','同面积异周长改为同周长异面积；逆命题反例','原3×3面积9、周长12；新2×4面积8、周长12，等周长不保证等面积。'],
 ['G02.01','改变角边实际长度而保持转角；角度不由线长决定','缩短或延长从同顶点出发的角边，60度张角仍60度。'],
 ['G02.02','增加四分之一圈，与半圈及整圈的实际扫过路径比较','转动分别90、180、360度，不能只比较转动后的末方向。'],
 ['G02.03','未知角由第三角换到第二角；只使用另外两角条件','180－40－75＝65；角片对应位置随未知改变。'],
 ['G02.04','换锚点并旋转多边形；按有效对角线实际划分','凸六边形从B连接非邻顶点有3条对角线，分4个三角形，内角和720度。'],
 ['G02.05','已知角与未知角交换；读取直角标记和另一已知角','A未知、B40度、C90度，所以A50度；不能把原B未知的模板照搬。'],
 ['G03.01','同一目标采用两套不同原片分割；最终覆盖需一致','横分与竖分分别移动完整原片，两盘都形成同一7格L形，无重叠无遗漏。'],
 ['G03.02','角落方块改为整列条形切除；位置条件改变','原3×5中移出最右列3格，保留12格；等数量其他剪法不满足位置条件。'],
 ['G03.03','增加重排后周长改变的反例；保面积不保周长','同一12原格保面积，外边从14段变18段；原片身份与刚性位移保留。'],
 ['G03.05','单一尺寸枚举改全尺寸枚举；图形个数与格数分开','4×4网格按1/2/3/4边长分别16/9/4/1个，共30，不能只数16单位格。'],
 ['G04.02','已知直径反求半径；未知量与方向改变','直径10厘米由两条反向半径组成，各半径5厘米。'],
 ['G04.03','同一半圆改变测量对象；半圆弧与纸片闭边分别量','半径3：半圈弧3π厘米，半圆纸片整边3π＋6厘米。'],
 ['G04.04','用共同比例两圆比较；半径与面积倍数不同','半径2与4的面积4π与16π，半径2倍、面积4倍。'],
 ['G04.05','连续弧跨过编号起点；环形相邻而非线性编号相邻','八等分从7起连续3段为7、0、1，弧长32×3/8＝12。'],
 ['G04.06','相同数值系数而量纲不同的反例；必须选弧或扇形','半径2的四分之一弧π厘米、扇形π平方厘米；相同系数不表示同一量。'],
 ['G05.01','直角形改非直角形并转向换标签；按对应身份连点边角','旋转后同一顶点、边和角的对应保留，屏幕上下不能作为对应关系。'],
 ['G05.02','同比扩大改两轴不同倍数；相似条件反例','宽3倍、高2倍，对应边比例不一致，因此不相似。'],
 ['G05.03','整数比改分数比并旋转；实际量全部对应外边','宽2高4扩大1.5倍，新宽3高6，周长12到18，比例1.5。'],
 ['G05.04','同比扩大后另有预剪区域；剩余面积不是原相似面积','原4格，放大后16格剪去4格，剩12格是原3倍，不再是单纯2²。'],
 ['G05.05','反求放大比改反求缩小比；比例方向需核对','新边2除原边4得1/2，两方向共同缩小为1/2。'],
 ['G06.01','改变直角顶点与图方向，加入钝角反例','只有给定直角的卡满足勾股前提；旋转不影响直角，120度卡不满足。'],
 ['G06.02','原平方格边长变半厘米；格数与面积分开','9、16、25格各0.25平方厘米，面积2.25＋4＝6.25，边1.5、2、2.5。'],
 ['G06.05','坐标非零起点，构造垂直位移并区分直线与街区路径','(1,1)到(4,5)位移3与4；直线5，格线绕路7。'],
 ['G07.01','十字展开图改另一有效网；折后物理身份去重','不同有效六面网折成同一立方体，仍6面12棱8顶点，不能每面单独重复数棱。'],
 ['G07.02','连接结构改阶梯网；折后朝向改变而面身份不变','六原面各自按折叠方向转到实际位置，正背面切换不产生新身份。'],
 ['G07.03','无环重合反例改含额外连接环的冲突反例','2×3六格带额外连接，折叠约束冲突，不因六格连通就成为立方体网。'],
 ['G07.04','纸网和被问原面同时改变；相对由折后法向认定','相反法向才是相对面，展开平面上的远近或相邻不是判据。'],
 ['G07.05','单个盒体积改双等体积不同形状；外观大小反例','2×2×2与4×2×1都8原单位块，体积相等。'],
 ['G07.06','单表面积改等体积双形；体积与外面积关系反例','同为8单位块，2×2×2外面积24，4×2×1外面积28，内共享面均排除。']
])retainTransfer(sid,dimension,proof);
for(const p of transferStages['G03.01'].transfer.puzzles){p.label=p.label.startsWith('横')?'横向分割':'纵向分割';}
transferStages['G03.01'].transfer.hideDerivedValues=true;

const transferPeople=(r,o,y,n)=>Array.from({length:r+o+y+n},(_,i)=>({id:'P'+(i+1),name:'队员'+(i+1),group:i<r?'R':i<r+o?'O':i<r+o+y?'Y':'N'}));
const cLabels=['体育','艺术'];
const sameName=transferPeople(3,2,1,2);sameName[0].name=sameName[1].name='小安';
replaceTransfer('C01.01',{mode:'setsLab',kind:'identity',people:sameName,labels:cLabels,context:'同名但原身份不同',prompt:'名单上有两个同名“小安”，编号分别P1、P2；同一编号可能出现在两份活动名单。按原编号登记归位，再填不同原人物数，不能按名字合并。'},'两个同名不同编号加共同名单；显示名字不能替代原身份','P1与P2是两个人，同名不合并；同一P4在两个名单出现仍只对应一原人物。',77);
replaceTransfer('C01.02',{mode:'setsLab',kind:'members',people:transferPeople(2,0,1,1),labels:cLabels,queries:['A','R','O'],context:'共同区域可以为空',prompt:'按名册登记归位。分别圈体育整组、只体育、两项都参加；若某集合没有原人物，需明确标空。'},'交集非空改交集为空的边界；完整A和仅A此时可一致','体育整组与只体育均为P1、P2；两项都参加为空，必须主动标空，不能把未作答当空集合。',77);
replaceTransfer('C01.04',{mode:'setsLab',kind:'formula',people:transferPeople(3,2,0,1),labels:cLabels,target:'I',context:'一个活动组完全包含另一个',prompt:'艺术报名者都在体育名单中。登记归位，再用两种不同计数工作盘计至少参加一项的人，每个目标原身份恰计一次。'},'相交但不包含的双集合改B包含于A；空的仅B分区','仅体育3、共同2、仅艺术0，共5；并集就是体育整组，不能另加艺术而不移除重复计数。',77);
replaceTransfer('C01.05',{mode:'setsLab',kind:'dedup',people:transferPeople(2,0,3,1),labels:cLabels,target:'I',context:'两份名册没有共同编号',prompt:'登记归位这两份互不重合的活动名册与未参加者。叠完整A、B名单，再核对是否存在要移去的重复计数，填写至少一项的不同人数。'},'有重复名册改为完全不相交的边界；不能无条件扣共同人数','2名体育、3名艺术，没有共同原身份，至少一项共5；不参加者不加入目标，也没有重复可移。',77);
const cards=names=>names.map(id=>({id,label:id}));
replaceTransfer('C02.02',{mode:'combinLab',kind:'pair',models:[{type:'pair',name:'有禁止搭配的两位编码',first:cards(['A','B','C']),second:cards(['1','2']),forbidden:[['B','2']]}],context:'笛卡尔搭配有一个禁格',prompt:'编码第一位A/B/C，第二位1/2，但B2禁止。实际摆卡列出全部合法有序编码，不能把3×2直接当合法总数。'},'完整双类搭配改有禁止对的限制；分支不再同宽','A有2项、B有1项、C有2项，共5个合法编码；B2不属于样本列表。',77);
replaceTransfer('C02.03',{mode:'combinLab',kind:'complete',models:[{type:'pair',name:'有非法初始记录的票表',first:cards(['成人','儿童']),second:cards(['周一','周二','周三']),forbidden:[['儿童','周二']],seed:[['成人','周一'],['儿童','周二']]}],context:'补漏之前先核记录是否合法',prompt:'票种成人/儿童，日期周一/二/三，儿童周二票不提供。现有票表含一条禁止记录；实际删除非法项，再补齐全部合法票种日期组合。'},'只补空缺改同时删除非法种子记录与补漏；存在禁止分支','成人三日、儿童周一和周三共5；既有儿童周二必须移除，不能只把表补成六行。',77);
replaceTransfer('C02.04',{mode:'combinLab',kind:'dedup',models:[{type:'order',name:'无角色搭档的换序重复',items:cards(['A','B','C']),size:2,ordered:false,repeat:false,seed:[['A','B'],['B','A'],['A','C']]}],context:'记录不同，成员组可能相同',prompt:'从A/B/C选两人作无角色搭档。已有AB、BA、AC记录；换书写顺序不算新组。删除同成员的重复，再补齐全部不同搭档。'},'完全相同文本重复改反向元组的等价重复；去重依据成员集合','AB与BA是同组，保留一次；补BC后共AB、AC、BC三组。',77);
replaceTransfer('C03.03',{mode:'combinLab',kind:'choose',models:[{type:'order',name:'必须带D的两人小队',items:cards(['A','B','C','D']),size:2,ordered:false,repeat:false,include:'D'}],context:'无序选择新增必选成员',prompt:'从A/B/C/D选两人，D必须加入，队内无角色。实际收录全部合法小队，不重复换序。'},'无约束组合改必含指定成员；不能只换n套组合总数','只有AD、BD、CD三组；AB、AC、BC不含D，虽是两人组仍不合法。',77);
replaceTransfer('C04.01',{mode:'setsLab',kind:'universe',people:transferPeople(2,1,4,3),outside:[{id:'V1',name:'访客甲'},{id:'V2',name:'访客乙'}],universeLabel:'本班学生',labels:['科学','戏剧'],queries:['U'],context:'全桌对象与规定全集分开',prompt:'本题全集仅本班10名学生，包括两项都不参加的学生。桌边还有两名访客。登记本班原人物、圈规定全集，填写全集人数。'},'增加可见但不在规定全集内的访客；全桌对象不等于全集','本班10名原人物全部属于全集，含3名未报名者；V1/V2访客不属于本班，不能计入。',77);
replaceTransfer('C04.03',{mode:'setsLab',kind:'intersection',people:transferPeople(2,0,3,1),labels:cLabels,queries:['O','I','exact1'],context:'AND为空而OR非空的边界',prompt:'两份活动名册没有共同编号。登记归位后，分别圈两项都参加、至少一项、恰好一项；没有成员的集合要主动标空。'},'交集非空改两个不相交集合；OR与恰一一致、AND为空','同时参加0人，至少一项和恰好一项都是5人；三个提问不能按同一非空列表回答。',77);
replaceTransfer('C04.04',{mode:'setsLab',kind:'dedup',people:transferPeople(0,3,2,1),labels:cLabels,target:'I',context:'整个A名册在B名册里',prompt:'所有体育成员也参加艺术，另有只艺术和两项都不的人。叠完整A、B名册，再逐原身份移去多算的一次，填写至少一项人数。'},'普通重叠改整个A均重复的包含边界；保留一次原成员','体育3名都是交集，在两个名册各计一次；各移去一次后并集5名，不能删掉这3个原人物。',77);
for(const [sid,dimension,proof] of [
 ['C01.03','三分区并集改四分区全集；两项都不者需归位并计入','R3/O2/Y1/N2四个互斥区覆盖8原人物；并集只有6，全集8。'],
 ['C02.01','交换首选择与第二选择，实际表格分组方向改变','帽先选两类，每类接三种上衣；每条有序方案对应原衣帽配对，列举方向可换而完整性保留。'],
 ['C02.05','单一有禁配流程改两个互斥方案择一；求和而不是逐步乘积','室内4种、室外1种，共5；选择两类之一，不是每种室内再配一种室外。'],
 ['C03.01','明示重复许可及无序不同成员；顺序与重复分别判断','两位密码允许重复有11/12/21/22四种；无序抽两张不同数卡仅{1,2}一组。'],
 ['C03.02','全体排队改部分有序角色选择；没有使用的原卡不等于漏项','四人选前后两位有4×3＝12，不是4!也不是无序6组。'],
 ['C03.04','固定首位改指定二人相邻；需核块内两种顺序','甲乙作为相邻块，两种内部顺序与丙左右位置共4个队列。'],
 ['C03.05','有角色第一位分组改无角色最早成员规范分组','四选二共6不同成员组，AB与BA不另算；按名册最早成员分组以免重收。'],
 ['C04.02','补集目标由不A改不B；原集合范围及所减组改变','不B包括只A和两项都不；先取全集再移完整B，而不是仍移A。'],
 ['C04.05','目标由至少一项改两项都不；直接/间接构造分别核身份','直接计N3名，间接U10减并集7，也3；数值一致还需两盘逐原身份一致。']
])retainTransfer(sid,dimension,proof);

replaceTransfer('D01.01',{mode:'chartLab',kind:'legend',labels:['篮球','足球'],icons:[2,1.5],legend:4,unit:'球',values:[8,6],context:'半个图标也有实际单位',prompt:'一个完整图标代表4球。篮球有2个完整图标；足球有1个完整和半个图标。把每个来源图标拆成对应原单位点再计数，半个不能当一整个。'},'整数个符号改包含半个图标；图例份量按实际占比缩放','完整图标4球、半个2球；篮球8，足球6。半图标只产生2个原单位，不能制造另外2个。',78);
replaceTransfer('D01.02',{mode:'chartLab',kind:'read',orientation:'horizontal',labels:['铅笔','尺子'],values:[15,10],gap:5,unit:'支',ticks:[0,5,10,15,20],context:'数量轴横过来',prompt:'这张条形图横向显示数量，纵向是类别。选择每条末端对应的横轴刻度，填数量并选单位；不要把类别位置当数量。'},'竖直柱高改横向条长；数量轴与类别轴方向交换','每格5支，铅笔条长3格即15，尺子2格即10；数量读横轴。',78);
replaceTransfer('D01.03',{mode:'chartLab',kind:'ticks',labels:['甲'],values:[20],gap:5,unit:'人',ticks:[10,15,20,25,30],context:'量尺从10开始',prompt:'等距量尺底端是10、顶端30，中间有三张缺刻度卡。放入每个缺位置的真实数值，不把底端当0。'},'零起点改非零刻度起点；绝对刻度=起点+格数×步长','四个等间隔每格5，缺刻度依次15、20、25；第1格不是5。',78);
replaceTransfer('D01.04',{mode:'chartLab',kind:'build',labels:['甲班','乙班','丙班'],values:[0,5,15],gap:5,unit:'人',ticks:[0,5,10,15,20],context:'零人数的类别仍保留',prompt:'来源表甲班0、乙班5、丙班15。逐类别搭柱；甲班要主动确认零柱并填写0，类别不能消失。每格5人。'},'全部正数柱改含零柱的边界；没有柱与没有类别分开','三类仍有三个位置；甲班确认0，乙1格5人、丙3格15人。零值不能靠未操作的默认值通过。',78);
replaceTransfer('D01.06',{mode:'chartLab',kind:'interval',points:[[0,6],[2,2],[4,6],[6,2]],threshold:4,relation:'below',timeStep:1,unit:'分钟',valueUnit:'厘米',values:[],context:'由高于改低于阈值',prompt:'两标记点之间是直线。选择水位严格低于4厘米的所有时间小段并累计分钟；高于和恰在阈值处不能混入。'},'高于阈值改严格低于；不连续区间并保留末段','符合1–3和5–6分钟，累计2＋1＝3分钟；不把间隔3–5加入。',78);
replaceTransfer('D02.02',{mode:'statsLab',kind:'mean',values:[1,2,4,3],quantum:0.5,unit:'升',context:'平均量需要半单位',prompt:'四桶分别1、2、4、3升。每原点代表半升，移动全部原量使四桶一样多，再填总量、对象数和平均量。平均数可以不是整数。'},'整数均值改半单位均值；原量粒度改0.5升而人数仍按桶','10升平均分四桶，每桶2.5升；20个半升原点不是20桶。',78);
replaceTransfer('D02.06',{mode:'statsLab',kind:'weighted',rows:[{value:2,frequency:0,label:'未出现的值'},{value:4,frequency:1,label:'第一组'},{value:8,frequency:1,label:'第二组'}],quantum:1,unit:'本',context:'零频数行不增加人数',prompt:'表里2本有0人、4本有1人、8本有1人。实际展开每行原成员和原量，再均分填平均数。零频数行保留，但不是一个人。'},'全部正频数改包含零频数；行数与实际人数分开','实际只有2人，共12本，平均6；不能把三行当3人，也不能给0频数行制造成员。',78);
for(const [sid,dimension,proof] of [
 ['D01.05','柱图读成表改给表搭图；表示转换方向反转','表中6、2、4本按每格2本搭3、1、2格，类别和原数量同时保留。'],
 ['D02.01','包含零原量空盘；数据对象仍存在','0、3、9的总量12在三个盘均分，每盘4；空盘仍计一个对象。'],
 ['D02.03','升序改降序并保留重复值的不同原身份','7、5、2、2降序；两个2编号不同，不能去重。'],
 ['D02.04','偶数个取中间两项均值改奇数个取一项','五个原记录排序1、3、5、7、9，只圈中间原记录5。'],
 ['D02.05','唯一众数改两个并列最高频值','1和3各两次是两个众数，5一次不是众数，极差5－1＝4。'],
 ['D03.01','物理袋样本改明确只有正反两结果的模型；逻辑事件合并','正或反覆盖全部为必然，侧立不在本题两结果模型内为不可能；结论限定模型。'],
 ['D03.02','单次原子身份改两次有序样本树','两次硬币有HH/HT/TH/TT四个原子；HT与TH因阶段不同不合并。'],
 ['D03.03','原物等可能但颜色不等改颜色也等可能的边界','公平硬币正、反各一个等可能原子；红3蓝1袋的标签不等概率不能照搬。'],
 ['D03.04','数字偶数筛选改颜色合并事件；分母仍按原身份','红B1/B2/B3共3有利原子，总4，不是红蓝两个标签取1/2。'],
 ['D03.05','两次同硬币恰一正改不同设备的AND条件','3编号×2硬币共6有序原子，仅F2＋H符合，两条件同时成立概率1/6。'],
 ['D03.06','连续角度权重改离散原物重数；保留底层等可能原子','红3球蓝1球，每球公平，红3/4；两个颜色标签不等可能。'],
 ['S01.01','竖直对称轴改水平轴；固定点与反向坐标互换','水平0轴固定y=0原点，其他原点y取相反数，x和身份保留。'],
 ['S01.02','竖镜改横镜；翻转坐标方向改变','关于y=0反射保x、y变负，不能按原竖镜规则只改x。'],
 ['S01.03','改变旋转中心，并顺时针改逆时针','关于原点逆时针90度使用(x,y)→(−y,x)，不是原中心(1,1)顺时针的公式。'],
 ['S01.04','向右平移改向左且同时向上；带符号向量','每个原点都加向量(−2,2)，边方向、距离、朝向和身份保持。'],
 ['S01.05','两折四层改一折两层；剪痕原层数量改变','一次竖折后剪(3,1)，展开出现(0,1)与(3,1)两原纸格，不凭四层旧图补四孔。'],
 ['S02.01','人物前后限制改数位奇偶与前后同时限制','完整六排列逐条验证首位奇数且1在3之前，不能只满足一个条件。'],
 ['S02.02','奇数红初态改偶数红初态；双翻仍保持原奇偶','初始红2为偶，翻两片红数变化−2/0/2，当前红数仍偶，原片身份不变。'],
 ['S02.03','翻颜色改相邻位置交换；合法性需使用当前原身份邻接','交换C1/C2后顺序已改变，再判断其后的非邻身份；不是固定编号相邻。'],
 ['S02.04','双翻改相邻交换，红色数量也成为不变量','相邻交换只改变顺序，原颜色及红数2保持；原双翻只能保证红数奇偶。'],
 ['S02.05','不变量不同不可达目标改同类可达目标；须实际构造路径','初红C1改到红C2，可双翻C1/C2一步实现；不变量一致本身不作为可达证明。']
])retainTransfer(sid,dimension,proof);

function normaliseFormalPercent(t){
 if(['测','巩固'].includes(t.phase)&&((t.mode==='groupingLab'&&t.kind!=='digits')||t.mode==='cycleLab'))t.contentVersion=75;
 if(['测','巩固'].includes(t.phase)&&(['equationLab','constraintLab'].includes(t.mode)||t.mode==='coordinateLab'&&['machine','dynamic'].includes(t.kind)))t.contentVersion=74;
 if(['测','巩固'].includes(t.phase)&&['ratioLab','rateLab','journeyLab','scaleLab'].includes(t.mode)&&!(t.mode==='ratioLab'&&['order','whole'].includes(t.kind))&&!(t.mode==='scaleLab'&&t.kind==='change'))t.contentVersion=73;
 if(!['测','巩固'].includes(t.phase)||!['percentLab','scaleLab'].includes(t.mode)||!['whole','change'].includes(t.kind))return t;
 t.contentVersion=72;
 if(t.kind==='change'){
  const reverse=t.changeOrder==='removeFirst',upBase=reverse?t.start-t.remove:t.start,downBase=reverse?t.start:t.start+t.add;
  const rate=(n,d)=>Number.isInteger(100*n/d)?`${100*n/d}%`:`当前整体的${n}/${d}`;
  t.prompt=`原量${t.start}，先${reverse?'减少'+rate(t.remove,downBase):'增加'+rate(t.add,upBase)}，再按变化后的整体${reverse?'增加'+rate(t.add,upBase):'减少'+rate(t.remove,downBase)}。先保存最终量预测，再操作验证。`;
 }
 return t;
}
for(const tasks of Object.values(transferStages))for(const t of Object.values(tasks))normaliseFormalPercent(t);
if(typeof module!=='undefined')module.exports={TRANSFER_AUDIT,normaliseFormalPercent};

'use strict';
// Generated finite cases. Rebuild with make_pool.js; all emitted cases have a verified legal solution trace.
const GENERATED_POOLS=window.__AMC8_STATIC_GENERATED_POOLS;
const DEMO_TASKS=window.__AMC8_STATIC_DEMO_TASKS;
const generatedTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [sid,tasks] of Object.entries(GENERATED_POOLS))Object.assign(generatedTarget[sid],tasks);
const normaliseGeneratedPercent=typeof module!=='undefined'?require('./transfer_enrichment').normaliseFormalPercent:normaliseFormalPercent;
for(const tasks of Object.values(generatedTarget))for(const t of Object.values(tasks))normaliseGeneratedPercent(t);
const normaliseGeneratedMotion=typeof module!=='undefined'?require('./motion_ui').normaliseFormalMotion:normaliseFormalMotion;
for(const tasks of Object.values(generatedTarget))for(const t of Object.values(tasks))normaliseGeneratedMotion(t);
if(typeof module!=='undefined')module.exports={GENERATED_POOLS,DEMO_TASKS};

'use strict';
function predictionTarget(t){
 if(t.mode==='patternLab'&&['arithmetic','geometric','explicit','twoPrev'].includes(t.kind))return patternExpected(t);
 if(t.mode==='integerLab'&&['square','root','power'].includes(t.kind))return [t.kind==='root'?t.side*(t.unitSize??1):t.target];
 if(t.mode==='measureLab'&&t.kind!=='rearrange'){const per=measureEdges(t.cells||[],true).length*t.unitSize,area=(t.cells||[]).length*t.unitSize**2;return t.kind==='length'?[(t.end-t.start)*t.unitSize]:t.kind==='perimeter'?[per]:t.kind==='area'?[area]:[per,area]}
 if(t.mode==='angleLab'&&['triangle','conditions'].includes(t.kind))return [t.angles[t.unknown]];
 if(['percentLab','scaleLab'].includes(t.mode)){if(t.kind==='whole')return [t.part*t.copies];if(t.kind==='change')return [t.start+t.add-t.remove];if(t.kind==='estimate'&&t.bounds)return ['lower','upper'].map(k=>t.bounds[k][0]*t.bounds[k][1])}
if(t.mode==='ratioLab'){
  if(t.kind==='unit')return [t.groups];
  if(t.kind==='partition')return t.knownUnit?[t.copies]:[t.unitRed,t.unitBlue];
  if(t.kind==='scale')return [t.red*(t.targetCopies?.red||t.copies),t.blue*(t.targetCopies?.blue||t.copies)];
 }
 if(t.mode==='rateLab'){
  if(t.kind==='divide')return [t.per];if(t.kind==='compose')return [t.total];
  if(t.kind==='compare')return [t.a.total/t.a.units,t.b.total/t.b.units];
  if(t.kind==='convert')return [t.direction==='forward'?t.count*t.factor:t.count];
 }
 if(t.mode==='journeyLab'){
  const walked=t.segments?.reduce((a,b)=>a+b,0);
  return t.kind==='inverse'?[t.count*(t.elapsedPer||1)]:t.kind==='remaining'?[t.unknownWhole?t.whole:t.whole-walked]:t.kind==='joint'?[['a','b'].reduce((n,s)=>n+t[s]*Math.max(0,t.count-(t.starts?.[s]||0)),0)]:[t.kind==='segment'?walked:t.count*t.per];
 }
 if(t.mode==='scaleLab'){
  if(t.kind==='pair')return [t.red*(t.targetFactors?.red||t.factor),t.blue*(t.targetFactors?.blue||t.factor)];
  if(t.kind==='length')return ['short','long'].map(s=>t.direction==='shrink'?t[s]/t.factor:t[s]*t.factor);
  if(t.kind==='area')return [t.rows*t.cols*(t.axisFactors?.rows||t.factor)*(t.axisFactors?.cols||t.factor)];
  if(t.kind==='map')return [t.count*t.per];
 }
if(t.mode==='equationLab'){
  if(t.kind==='equal')return [Number(t.left.reduce((a,n)=>a+n,0)===t.right.reduce((a,n)=>a+n,0))];
  if(['unknown','bilateral'].includes(t.kind))return [t.total-t.known];
  if(t.kind==='inverse')return [t.unknownInitial?t.remain+t.removedGiven:t.initial-t.remain];
  if(t.kind==='substitute')return [Number(t.bag+t.known===t.total)];
 }
 if(t.mode==='constraintLab'){
  if(t.kind==='reverse')return [t.bag];
  if(t.kind==='verify')return [Number(t.groups*t.bag+(t.extraOutside?t.extra:t.groups*t.extra)===(t.givenTotal??t.groups*(t.bag+t.extra)))];
  if(t.kind==='parity')return [Number(t.total%t.divisor===0)];
  if(['stock','optimal'].includes(t.kind))return [Math.floor(t.stock/t.per)];
 }
 if(t.mode==='coordinateLab'){
  if(t.kind==='machine')return [t.reverseIndex===2?t.inputs[2]:t.inputs[2]*t.multiplier+t.add];
  if(t.kind==='dynamic')return [t.startValue+t.step*t.duration];
 }
if(t.mode==='groupingLab'&&t.kind==='digitRules')return t.cases.map(c=>c.number%c.divisor);
 if(t.mode==='groupingLab'&&t.kind!=='digits')return t.kind==='reconstruct'?[t.knownGroups*t.divisor+t.remainder]:(t.kind==='digitSum'?t.numbers.map(n=>String(n).split('').reduce((a,b)=>a+Number(b),0)):t.totals||[t.total]).map(n=>n%t.divisor);
 if(t.mode==='cycleLab'){
  if(t.kind==='power'){let digit=1;for(let i=0;i<t.target;i++)digit=digit*t.factor%10;return [digit]}
  const n=t.base.length,pos=(((t.kind==='weekday'?t.start:t.indexBase===0?0:-1)+(t.direction||1)*t.target)%n+n)%n;
  return [t.kind==='weekday'||t.indexBase===0?pos:pos+1];
 }
 return null;
}
function predictionNeeded(t){return assessmentFormal(t)&&predictionTarget(t)!==null}
function predictionApply(t,w,p){if(t.mode==='integerLab'&&t.unitSize){w.amount=p.firstValues[0];w.amountSet=true}if(t.mode==='measureLab'){const keys=t.kind==='length'||t.kind==='perimeter'?['length']:t.kind==='area'?['area']:['length','area'];keys.forEach((key,i)=>{w.amounts[key]=p.firstValues[i];w.amountSet[key]=true})}if(t.mode==='angleLab')w.answer=p.firstValues[0]}
function predictionState(t,w){
 if(w.prediction)return w.prediction;
 const count=predictionTarget(t)?.length||0,prior=taskHistory(t).firstPrediction;
 if(prior?.values?.length===count&&prior.values.every(Number.isInteger)){w.prediction={values:[...prior.values],set:Array(count).fill(true),locked:true,firstValues:[...prior.values]};predictionApply(t,w,w.prediction)}
 else w.prediction={values:Array(count).fill(0),set:Array(count).fill(false),locked:false,firstValues:null};
 return w.prediction;
}
function predictionVerdicts(t){if(t.mode==='cycleLab'&&t.kind==='weekday')return t.base;return t.mode==='equationLab'&&t.kind==='equal'?['两边不相等','两边相等']:t.mode==='equationLab'&&t.kind==='substitute'||t.mode==='constraintLab'&&t.kind==='verify'?['不满足原式','满足原式']:t.mode==='constraintLab'&&t.kind==='parity'?['没有整数解','有整数解']:null}
function predictionLabel(t,i,count){
 if(t.mode==='groupingLab'&&t.kind==='digitRules')return t.cases[i].number+'除以'+t.cases[i].divisor+'的余数';
 if(t.mode==='groupingLab')return t.kind==='reconstruct'?'原总数':(t.kind==='digitSum'?'数卡'+t.numbers[i]:'第'+(i+1)+'盘')+'的余数';
 if(t.mode==='cycleLab')return t.kind==='power'?'幂的个位':t.indexBase===0?'轮内编号':'周期第几位';
 if(t.mode==='ratioLab')return t.kind==='partition'?t.knownUnit?'完整袋数':i===0?'每份红色数量':'每份蓝色数量':t.kind==='scale'?i===0?'最后红色数量':'最后蓝色数量':'有几份';
 if(t.mode==='rateLab')return t.kind==='compare'?i===0?'甲的单位价格':'乙的单位价格':t.kind==='divide'?'每单位的量':t.kind==='convert'?t.direction==='forward'?t.to:t.from:'总量';
 if(t.mode==='journeyLab')return t.kind==='inverse'?t.elapsedPer?'用时（分钟）':'用时（'+t.interval+'）':t.kind==='remaining'?t.unknownWhole?'全程':'剩余路程':'总量';
 if(t.mode==='scaleLab')return t.kind==='pair'?i===0?'红色数量':'蓝色数量':t.kind==='length'?i===0?'短边长度':'长边长度':t.kind==='area'?'面积':'对应输出量';
 if(t.mode==='equationLab')return t.kind==='inverse'?t.unknownInitial?'原来的数量':'拿走的数量':'未知袋内数量';
 if(t.mode==='constraintLab')return t.kind==='reverse'?'每袋未知量':'最多完整袋数';
 if(t.mode==='coordinateLab')return t.kind==='machine'?t.reverseIndex===2?'找回的输入':'第三行输出':'最终量';
 return t.bounds?i===0?'下界':'上界':count>1?'第'+(i+1)+'个新值':t.kind==='root'?'边长':t.kind==='square'||t.mode==='measureLab'&&t.kind==='area'?'面积':t.mode==='measureLab'?t.kind==='length'?'长度':i===0?'周长':'面积':t.mode==='angleLab'?'未知角':'最终数量';
}
function predictionDisplay(t,values){const labels=predictionVerdicts(t);return labels?labels[values[0]]||'尚未判断':values.join('、')}
function predictionBoard(t,w,base){
 const p=predictionState(t,w),original=Array.isArray(t.initial)?t.initial.join('、'):null,verdicts=predictionVerdicts(t);
 const input=verdicts?`${choiceButtons(t,verdicts.map((label,value)=>[String(value),label]),'predictionPick','prediction',p.set[0]?String(p.values[0]):null)}<p>我的判断：${p.set[0]?esc(predictionDisplay(t,p.values)):'尚未选择'}</p>`:`<div class="prediction-values">${p.values.map((n,i)=>`<section><b>${esc(predictionLabel(t,i,p.values.length))}：${n}</b><div class="work-buttons">${[-10,-1,0,1,5,10,50].map(d=>`<button data-action="predictionAmount" data-index="${i}" data-delta="${d}">${d===0?'填0':d>0?'＋'+d:String(d)}</button>`).join('')}</div></section>`).join('')}</div>`;
 return `<div class="board prediction-board"><h3>先写下我的预测</h3>${original?`<p>已知数列：${esc(original)}</p>`:''}${input}${['measureLab','angleLab'].includes(t.mode)?base.board(t).replace(/<button\b/g,'<button disabled aria-disabled="true"'):''}<button class="primary" data-action="predictionLock" ${p.set.every(Boolean)?'':'disabled'}>保存预测，再操作验证 →</button></div>`;
}
function predictionAdapter(base){return {
 state:base.state,
 board(t){const w=base.state(t),p=predictionState(t,w);return p.locked?`<div class='prediction-summary'>我的预测：${esc(predictionDisplay(t,p.firstValues))}</div>`+base.board(t):predictionBoard(t,w,base)},
 act(action,data,t){const w=base.state(t),p=predictionState(t,w);
  if(action==='predictionPick'&&!p.locked&&predictionVerdicts(t)&&predictionVerdicts(t).some((_,i)=>String(i)===data.value)){p.values[0]=Number(data.value);p.set[0]=true;return true}
  if(action==='predictionAmount'&&!p.locked&&!predictionVerdicts(t)){const i=Number(data.index),d=Number(data.delta);if(Number.isInteger(i)&&i>=0&&i<p.values.length&&[-10,-1,0,1,5,10,50].includes(d)&&p.values[i]+d>=-100&&p.values[i]+d<=10000){p.values[i]+=d;p.set[i]=true;return true}return false}
  if(action==='predictionLock'&&!p.locked&&p.set.every(Boolean)){p.firstValues=[...p.values];p.locked=true;predictionApply(t,w,p);taskHistory(t).firstPrediction={values:[...p.firstValues],lockedAt:Date.now()};persist();return true}
  if(!p.locked)return false;const changed=base.act(action,data,t);if(draft.work!==w){const next=base.state(t);next.prediction=p;predictionApply(t,next,p)}return changed;
 },
 grade(t){const w=base.state(t),p=predictionState(t,w),result=base.grade(t),expected=predictionTarget(t);return {...result,ok:result.ok&&p.locked&&p.firstValues.every((n,i)=>n===expected[i]),incomplete:!p.locked||result.incomplete,reason:p.locked&&!p.firstValues.every((n,i)=>n===expected[i])?'预测与数学关系不符。回到例子，再用新题验证。':result.reason}},
 speech(t){const w=base.state(t),p=predictionState(t,w);return p.locked?`我的预测为${predictionDisplay(t,p.firstValues)}。`+base.speech(t):`还未保存预测。当前输入${predictionDisplay(t,p.values)}。`+(['measureLab','angleLab'].includes(t.mode)?base.speech(t):'')}
}}

'use strict';
// Shared adapter contract: a real state, legal actions, semantic grading and
// a spoken description of that same state. No separate text-card fallback.
const PRACTICE_BANKS={workshop:WORKSHOP_TASKS,fraction:FRACTION_TASKS,percent:PERCENT_TASKS,integer:INTEGER_TASKS,ratio:RATIO_TASKS,rate:RATE_TASKS,journey:JOURNEY_TASKS,scale:SCALE_TASKS,equation:EQUATION_TASKS,constraint:CONSTRAINT_TASKS,pattern:PATTERN_TASKS,coordinate:COORDINATE_TASKS,grouping:GROUPING_TASKS,factor:FACTOR_TASKS,common:COMMON_TASKS,cycle:CYCLE_TASKS,measure:MEASURE_TASKS,angle:ANGLE_TASKS,composite:COMPOSITE_TASKS,circle:CIRCLE_TASKS,similar:SIMILAR_TASKS,right:RIGHT_TASKS,solid:SOLID_TASKS,sets:SETS_TASKS,combin:COMBIN_TASKS,chart:CHART_TASKS,stats:STATS_TASKS,chance:CHANCE_TASKS,motion:MOTION_TASKS,invariant:INVARIANT_TASKS};
const TASK_ADAPTERS=Object.freeze({
 ...Object.fromEntries(WORKSHOP_MODES.map(mode=>[mode,{board:workshopBoard,state:workshopState,act:workshopAct,grade:workshopGrade,speech:workshopSpeech}])),
 fractionLab:{board:fractionBoard,state:fractionState,act:fractionAct,grade:fractionGrade,speech:fractionSpeech},
 percentLab:{board:percentBoard,state:percentState,act:percentAct,grade:percentGrade,speech:percentSpeech},
 integerLab:{board:integerBoard,state:integerState,act:integerAct,grade:integerGrade,speech:integerSpeech},
 ratioLab:{board:ratioBoard,state:ratioState,act:ratioAct,grade:ratioGrade,speech:ratioSpeech},
 rateLab:{board:rateBoard,state:rateState,act:rateAct,grade:rateGrade,speech:rateSpeech},
 journeyLab:{board:journeyBoard,state:journeyState,act:journeyAct,grade:journeyGrade,speech:journeySpeech},
 scaleLab:{board:scaleBoard,state:scaleState,act:scaleAct,grade:scaleGrade,speech:scaleSpeech},
 equationLab:{board:equationBoard,state:equationState,act:equationAct,grade:equationGrade,speech:equationSpeech},
 constraintLab:{board:constraintBoard,state:constraintState,act:constraintAct,grade:constraintGrade,speech:constraintSpeech},
 patternLab:{board:patternBoard,state:patternState,act:patternAct,grade:patternGrade,speech:patternSpeech},
 coordinateLab:{board:coordinateBoard,state:coordinateState,act:coordinateAct,grade:coordinateGrade,speech:coordinateSpeech},
 groupingLab:{board:groupingBoard,state:groupingState,act:groupingAct,grade:groupingGrade,speech:groupingSpeech},
 factorLab:{board:factorBoard,state:factorState,act:factorAct,grade:factorGrade,speech:factorSpeech},
 commonLab:{board:commonBoard,state:commonState,act:commonAct,grade:commonGrade,speech:commonSpeech},
 cycleLab:{board:cycleBoard,state:cycleState,act:cycleAct,grade:cycleGrade,speech:cycleSpeech},
 measureLab:{board:measureBoard,state:measureState,act:measureAct,grade:measureGrade,speech:measureSpeech},
 angleLab:{board:angleBoard,state:angleState,act:angleAct,grade:angleGrade,speech:angleSpeech},
 compositeLab:{board:compositeBoard,state:compositeState,act:compositeAct,grade:compositeGrade,speech:compositeSpeech},
 circleLab:{board:circleBoard,state:circleState,act:circleAct,grade:circleGrade,speech:circleSpeech},
 similarLab:{board:similarBoard,state:similarState,act:similarAct,grade:similarGrade,speech:similarSpeech},
 rightLab:{board:rightBoard,state:rightState,act:rightAct,grade:rightGrade,speech:rightSpeech},
 solidLab:{board:solidBoard,state:solidState,act:solidAct,grade:solidGrade,speech:solidSpeech},
 setsLab:{board:setsBoard,state:setsState,act:setsAct,grade:setsGrade,speech:setsSpeech},
 combinLab:{board:combinBoard,state:combinState,act:combinAct,grade:combinGrade,speech:combinSpeech},
 chartLab:{board:chartBoard,state:chartState,act:chartAct,grade:chartGrade,speech:chartSpeech},
 statsLab:{board:statsBoard,state:statsState,act:statsAct,grade:statsGrade,speech:statsSpeech},
 chanceLab:{board:chanceBoard,state:chanceState,act:chanceAct,grade:chanceGrade,speech:chanceSpeech},
 motionLab:{board:motionBoard,state:motionState,act:motionAct,grade:motionGrade,speech:motionSpeech},
 invariantLab:{board:invariantBoard,state:invariantState,act:invariantAct,grade:invariantGrade,speech:invariantSpeech}
});
function taskAdapter(task){if(task?.competition)return {board:competitionClues,state:competitionState,act:()=>false,grade:t=>({ok:draft.choice===t.answer,reason:'同时核对所有条件。'}),speech:t=>t.prompt};const base=TASK_ADAPTERS[task?.mode]||null;const adapter=base&&predictionNeeded(task)?predictionAdapter(base):base;return task?.joint&&adapter?jointAdapter(adapter):adapter}
function taskBoard(task){return taskAdapter(task)?.board(task)||objectSortBoard(task)}
function practiceFor(sid){for(const [view,bank] of Object.entries(PRACTICE_BANKS))if(bank[sid])return {view,task:bank[sid]};return null}
function taskSemanticModel(task){
 const omit=new Set(['id','skillId','contentVersion','phase','prompt','hint','explain','reason','worked','changeDimension','authorship','context','title','label','name','taskIds','bookReferences','examReferences','demoSteps','displayOrderPolicy','semanticParameters','generation','demoSteps','demoNarration','firstResponseRuleVersion']);
 const clean=value=>Array.isArray(value)?value.map(clean):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>!omit.has(k)).map(k=>[k,clean(value[k])])):value;
 const model=clean(task);
 if(task.mode==='rateLab'&&task.kind==='convert'){delete model.amountUnit;delete model.unit}
 if(Array.isArray(model.base)&&['period','position'].includes(task.kind)){const symbols=new Map();model.base=model.base.map(v=>{if(!symbols.has(v))symbols.set(v,symbols.size);return symbols.get(v)})}
 if(task.mode==='patternLab'&&task.kind==='period'){const observed=[...model.base,...model.base,...model.base],size=Array.from({length:model.base.length},(_,i)=>i+1).find(n=>observed.every((v,i)=>v===observed[i%n]));model.base=model.base.slice(0,size)}
 return model;
}
function taskFingerprint(task){return JSON.stringify(taskSemanticModel(task))}
function taskContractErrors(task){const errors=[];if(!/^[A-Z0-9-]+$/.test(task.id||''))errors.push('invalid stable ID');if(!Number.isInteger(task.contentVersion)||task.contentVersion<1)errors.push('missing content version');if(!task.skillId)errors.push('missing target');if(!task.prompt)errors.push('missing prompt');if(!taskAdapter(task)&&task.mode!=='objectSort')errors.push('no real adapter');return errors}

'use strict';
let demoSkillId='',demoCursor=0,demoTimer=null,demoSequence=0;
function demoStop(){demoSequence++;if(demoTimer!==null)clearTimeout(demoTimer);demoTimer=null}
function demoGroups(task){
 const groups=[];for(const step of task.demoSteps||[]){const scope=[step.action,step.data.side||'',step.data.index&&/Place|Move|Amount/.test(step.action)?step.data.index:'',step.data.key||''].join('|'),last=groups.at(-1);if(last&&last.scope===scope&&last.actions.length<6)last.actions.push(step);else groups.push({scope,actions:[step]})}return groups;
}
function demoReason(task,group,index,total){
 if(index===total-1)return task.explain;
 const action=group.actions[0].action;
 if(/Undo|Return|Unplace|Uncopy/.test(action))return '撤销时放回同一批原对象，数量和身份都可以核对。';
 if(/Bundle|Unbundle/.test(action))return '十棒里的每个一都还在，捆和拆只改变表示。';
 if(/Phase/.test(action))return '接下来换一个基准；原整体与剩余整体要分清。';
 if(/Copy|Both|Axis/.test(action))return '复制或缩放完整的一组，核对所有对应的量。';
 if(/Choice|Verdict|Proof/.test(action))return '把所选的关系与刚才的实际变化相互核对。';
 if(/Place|Move|Take|Fill|Cell|Add/.test(action))return '看清这一批原对象去了哪里，每次只按合法动作改变。';
 return '观察当前对象和前一步之间的变化，再核对题目条件。';
}
function demoAdvance(){
 const task=DEMO_TASKS[demoSkillId],groups=demoGroups(task),group=groups[demoCursor];if(!group)return false;
 for(const step of group.actions)if(!taskAdapter(task).act(step.action,step.data,task)){demoStop();feedback={ok:false,text:'这个示范动作未能恢复，请回放或返回练习。'};render();return false}
 demoCursor++;render();return true;
}
function demoPlay(){demoStop();const sequence=demoSequence;const tick=()=>{if(sequence!==demoSequence||view!=='demo')return;if(demoAdvance())demoTimer=setTimeout(tick,1100);else{demoTimer=null;render()}};demoTimer=setTimeout(tick,100);render()}
function demoReset(){demoStop();demoCursor=0;draft=freshDraft();feedback=null;render()}
function demoPage(){
 const task=DEMO_TASKS[demoSkillId];if(!task)return `<div class='panel'>示范还在补齐。<button data-action='micro' data-code='${esc(demoSkillId)}'>回练习</button></div>`;
 const groups=demoGroups(task),complete=demoCursor===groups.length,explanation=demoCursor?demoReason(task,groups[demoCursor-1],demoCursor-1,groups.length):'这是另一道例子。一起观察对象怎么改变。';
 const board=taskBoard(task).replace(/<button(?![^>]*data-action=['"](?:workSpeakChoice|speakSurface|speakControl))/g,'<button disabled');
 const practice=practiceFor(task.skillId);
 return `<div class='page-head'><div><p class='kicker'>学 · 另一道例子</p><h1>${esc(SKILL_DATA.skills.find(s=>s.id===task.skillId)?.title||'看示范')}</h1></div><button class='back' data-action='micro' data-code='${esc(task.skillId)}'>← 返回</button></div><div class='work'><article class='panel'><h2 class='task-title'>${esc(task.prompt)}</h2><div class='demo-controls'><button class='primary' data-action='demoNext' ${complete?'disabled':''}>下一步 →</button><button class='secondary' data-action='${demoTimer===null?'demoPlay':'demoPause'}' ${complete?'disabled':''}>${demoTimer===null?'▶ 连续看':'⏸ 暂停'}</button><button class='secondary' data-action='demoReset'>↩ 回放</button><span>第${demoCursor}/${groups.length}步</span></div>${board}<div class='hint' role='status'>${esc(explanation)}</div><div class='bottom-actions'><button class='secondary' data-action='speak'>🔊 听例题</button><button class='secondary' data-action='demoSpeak'>🔊 听这一步</button><button class='secondary' data-action='speakState'>🔊 听当前状态</button>${complete&&practice?`<button class='primary' data-action='${practice.view}' data-code='${esc(task.skillId)}'>轮到我动手 →</button>`:''}</div><div id='speech-status' role='status'>${esc(speechMessage)}</div></article><aside class='side-stack'><details class='panel'><summary>家长说明</summary><p>这里重放不同实例的真实合法动作；示范不计孩子作答，也不会增加独立成功。可以暂停、单步或回放。</p></details></aside></div>`;
}

'use strict';
const CURRICULUM=window.__AMC8_CURRICULUM;
const LEARNING_TASKS=Object.fromEntries(Object.entries(CURRICULUM.lessons).map(([sid,n])=>[sid,{id:`K-${sid.replace('.','-')}-1`,skillId:sid,contentVersion:CURRICULUM.contentVersion,phase:'学',mode:'conceptNote',prompt:n.definition+'。'+n.why+'。'+n.use}]));
let learnTab='definition',learnCounterOpen=false;
function learningPrerequisites(sid,visited=new Set()){for(const id of CURRICULUM.lessons[sid]?.prerequisiteIds||[])if(!visited.has(id)){visited.add(id);learningPrerequisites(id,visited)}return visited}
function rememberFormalOpen(task){
 if(!['stage','joint'].includes(view)||!task||!assessmentEvidenceContext(task,{view,stageKind}).formalEligible||taskHistory(task).submissions)return;
 const key=taskVersion(task)+':'+task.id;saved.pendingFormal[key]??={taskId:task.id,contentVersion:taskVersion(task),skillId:task.skillId,stageKind,view,openedAt:Date.now()};persist();
}
function noteTeachingExposure(sid,kind,relationId=''){
 let changed=false;
 for(const [key,pending] of Object.entries(saved.pendingFormal)){
  const descriptor=RECORD_TASK_INDEX.get(key),task=descriptor?.task;
  if(!task||!assessmentEvidenceContext(task,descriptor).formalEligible)continue;
  const targets=task.joint?[...task.joint.targetNodeIds,...task.joint.supportNodeIds]:[pending.skillId];if(!targets.some(id=>id===sid||knowledgeSupportSkills(id).has(sid)))continue;
  const h=taskHistory(task);if(h.submissions>0)continue;
  h.modelViewed=true;h.teachingExposure??=[];if(!h.teachingExposure.some(e=>e.skillId===sid&&e.kind===kind&&((e.relationId||'')===relationId)))h.teachingExposure.push({skillId:sid,kind,relationId,at:Date.now()});changed=true;
 }
 if(changed)persist();
}
function learningPage(){
 const sid=microSkillId,n=CURRICULUM.lessons[sid],s=SKILL_DATA.skills.find(s=>s.id===sid),p=practiceFor(sid),labels={definition:'是什么',why:'为什么',use:'何时能用'};
 if(!n||!s||!p)return '<div class="panel">知识说明暂不可用。</div>';
 const sources=(n.sourceReferences||[]).map(r=>`<li><b>${esc(r.book)}</b> · ${r.pdfPages.length?'PDF页 '+r.pdfPages.join('、'):'未定位直接页'} · ${esc(r.coverage)}<p class="tiny-note">${esc(r.limitations)}</p></li>`).join('');
 const prerequisites=n.prerequisiteIds.map(id=>`<button class="secondary" data-action="learn" data-code="${id}">${esc(SKILL_DATA.skills.find(s=>s.id===id)?.title||id)}</button>`).join('');
 return `<div class="page-head"><div><p class="kicker">${sid} · 学</p><h1>${esc(s.title)}</h1></div><button class="back" data-action="network" data-code="${sid}">← 相关知识</button></div><div class="work learning-work"><article class="panel"><div class="learning-tabs" role="group" aria-label="知识说明">${Object.entries(labels).map(([key,label])=>`<button class="secondary" data-action="learnTab" data-value="${key}" aria-pressed="${learnTab===key}">${label}</button>`).join('')}</div><h2>${labels[learnTab]}</h2><p class="learning-copy">${esc(n[learnTab])}</p><button class="secondary" data-action="learnSpeak" data-value="${learnTab}">🔊 听这段</button><div class="learning-counter"><button class="secondary" data-action="learnCounter" aria-expanded="${learnCounterOpen}">想一想容易混淆的地方</button>${learnCounterOpen?`<p>${esc(n.counterexample)}</p><button class="secondary" data-action="learnSpeak" data-value="counterexample">🔊 听反例</button>`:''}</div><div class="learning-actions"><button class="primary" data-action="demo" data-code="${sid}">看另一道例子的示范 →</button><button class="secondary" data-action="${p.view}" data-code="${sid}">轮到我动手操作 →</button></div><section class="reason-block"><h3>试着讲清楚</h3><p>${esc(p.task.reason?.prompt||'用操作中的对象说明为什么成立。')}</p><button class="secondary" data-action="learnExplainSpeak">🔊 听解释问题</button></section><div id="speech-status" role="status">${esc(speechMessage)}</div></article><aside class="side-stack">${prerequisites?`<section class="panel"><h3>可以先联系这些知识</h3><div class="stage-buttons">${prerequisites}</div></section>`:''}<details class="panel"><summary>家长查看来源与证据</summary><ul>${sources}</ul><p class="tiny-note">概念说明为原创儿童改写；来源定位不等于原图全部核验。操作题核对对象、变化和所选理由；口述仍需家长实际听取。阅读或播放示范不记作孩子答题。</p></details><section class="panel"><h3>接着试一试</h3><button class="secondary" data-action="stage" data-code="${sid}|transfer">换情境或表示 →</button><button class="secondary" data-action="micro" data-code="${sid}">单项对象辨识 →</button></section></aside></div>`;
}

'use strict';
const KNOWLEDGE=window.__AMC8_KNOWLEDGE,NODE_BY_ID=new Map(KNOWLEDGE.nodes.map(n=>[n.id,n])),RELATION_BY_ID=new Map(KNOWLEDGE.relations.map(r=>[r.id,r]));
const RELATION_LABELS={requires:'可以先联系',representation:'换一种表示',progression:'往前一步',analogy:'比较两种想法',application:'一起用'};
let networkRegionId='A01',networkSkillId='A01.01',networkRelationId='',networkFilter='all',networkGraphScope='nodes',networkGraphPage=0,networkGraphZoom=1;
function networkSelect(code){const node=NODE_BY_ID.get(code),region=SKILL_DATA.units.find(u=>u.id===(node?.regionId||code));if(!region)return false;const selected=node?.id||region.skillIds[0];if(selected!==networkSkillId){networkGraphPage=0;networkGraphZoom=1}networkRegionId=region.id;networkSkillId=selected;networkRelationId='';return true}
function knowledgeSupportSkills(sid){const related=learningPrerequisites(sid);for(const r of KNOWLEDGE.relations)if(r.type!=='requires'&&r.canAssistAssessment&&r.toNodeIds.includes(sid))for(const id of r.fromNodeIds){related.add(id);for(const parent of learningPrerequisites(id))related.add(parent)}return related}
function knowledgeState(sid){
 const original=saved.skillStage[sid]||{},state=assessmentReviewProgress(assessmentStageProgress(JSON.parse(JSON.stringify(original)),STAGED_TASKS[sid],saved.attempts),STAGED_TASKS[sid],saved.attempts),practice=practiceFor(sid)?.task;
 const practiced=practice&&saved.attempts.some(a=>a.taskInstanceId===practice.id&&a.contentVersion===taskVersion(practice)&&a.gradingResult==='correct');
 return {independent:state.cleanInstances.length,qualified:!!state.independentQualifiedAt,reviewed:state.delayedFirstCorrect===true,transfer:state.transferPassed===true,practiced,label:state.transferPassed&&state.independentQualifiedAt&&state.delayedFirstCorrect?'已有独立与换题回访证据':state.independentQualifiedAt?'两道新题独立通过':state.cleanInstances.length?state.cleanInstances.length+'道新题独立通过':practiced?'动手练过':'可以从这里开始'};
}
function knowledgeRegionSummary(code){const unit=SKILL_DATA.units.find(u=>u.id===code),states=unit.skillIds.map(knowledgeState);return {skills:states.length,qualified:states.filter(s=>s.qualified).length,reviewed:states.filter(s=>s.qualified&&s.transfer&&s.reviewed).length}}
function regionConnections(code){const result=new Map();for(const r of KNOWLEDGE.relations){if(networkFilter!=='all'&&r.type!==networkFilter)continue;for(const fromId of r.fromNodeIds)for(const toId of r.toNodeIds){const from=NODE_BY_ID.get(fromId).regionId,to=NODE_BY_ID.get(toId).regionId;if(from===to||from!==code&&to!==code)continue;const other=from===code?to:from,key=other+':'+r.type+':'+(from===code?'out':'in');if(!result.has(key))result.set(key,{other,type:r.type,direction:from===code?'out':'in',relationIds:[]});if(!result.get(key).relationIds.includes(r.id))result.get(key).relationIds.push(r.id)}}return [...result.values()]}

function networkGraphModel(){
 const region=SKILL_DATA.units.find(u=>u.id===networkRegionId),node=NODE_BY_ID.get(networkSkillId),map=new Map();
 const add=(code,label,edge)=>{if(!map.has(code))map.set(code,{code,label,edges:[]});const item=map.get(code);if(!item.edges.some(e=>e.type===edge.type&&e.direction===edge.direction))item.edges.push(edge)};
 if(networkGraphScope==='regions')for(const edge of regionConnections(region.id))add(edge.other,SKILL_DATA.units.find(u=>u.id===edge.other).title,edge);
 else for(const relation of KNOWLEDGE.relations){if(networkFilter!=='all'&&relation.type!==networkFilter||![...relation.fromNodeIds,...relation.toNodeIds].includes(node.id))continue;for(const other of new Set([...relation.fromNodeIds,...relation.toNodeIds]))if(other!==node.id){const direction=relation.fromNodeIds.includes(node.id)&&relation.toNodeIds.includes(other)?'out':relation.toNodeIds.includes(node.id)&&relation.fromNodeIds.includes(other)?'in':'shared';add(other,NODE_BY_ID.get(other).concept,{type:relation.type,direction,relationId:relation.id})}}
 const neighbors=[...map.values()],pages=Math.max(1,Math.ceil(neighbors.length/8)),page=Math.min(networkGraphPage,pages-1);return {center:{code:networkGraphScope==='regions'?region.id:node.id,label:networkGraphScope==='regions'?region.title:node.concept},neighbors,pages,page,shown:neighbors.slice(page*8,page*8+8)};
}
function networkDiagram(){
 const model=networkGraphModel(),x=260,y=210,placed=model.shown.map((item,i)=>{const angle=-Math.PI/2+i*2*Math.PI/model.shown.length;return {...item,x:x+180*Math.cos(angle),y:y+150*Math.sin(angle)}}),paths=placed.flatMap(item=>item.edges.map((edge,i)=>{const start=edge.direction==='in'?[item.x,item.y]:[x,y],end=edge.direction==='in'?[x,y]:[item.x,item.y],offset=(i-(item.edges.length-1)/2)*5;return `<path data-relation-type="${edge.type}" data-direction="${edge.direction}" d="M${start[0]+offset} ${start[1]}L${end[0]+offset} ${end[1]}" stroke="${edge.type==='requires'?'#53887a':edge.type==='application'?'#6a63a0':'#a67a42'}" stroke-width="2" ${edge.type==='requires'?'':'stroke-dasharray="5 4"'} ${edge.direction==='shared'?'':'marker-end="url(#network-arrow)"'}/>`})).join('');
 return `<div class="network-graph-controls" role="group" aria-label="知识图查看方式"><button id="network-graph-scope-nodes" class="secondary" data-action="networkGraphScope" data-value="nodes" aria-pressed="${networkGraphScope==='nodes'}">知识点之间</button><button id="network-graph-scope-regions" class="secondary" data-action="networkGraphScope" data-value="regions" aria-pressed="${networkGraphScope==='regions'}">看所属区域</button><button id="network-zoom-out" class="secondary" data-action="networkGraphZoom" data-value="out" ${networkGraphZoom<=1?'disabled':''}>缩小</button><button id="network-zoom-in" class="secondary" data-action="networkGraphZoom" data-value="in" ${networkGraphZoom>=2.5?'disabled':''}>放大</button><button id="network-zoom-fit" class="secondary" data-action="networkGraphZoom" data-value="fit">还原大小</button><span role="status">${Math.round(networkGraphZoom*100)}%</span></div><div class="network-diagram" tabindex="0" role="region" aria-label="${esc(model.center.label)}的局部知识图；放大后可滚动"><div class="network-canvas" style="width:${networkGraphZoom*100}%;min-width:${networkGraphZoom*360}px"><svg viewBox="0 0 520 420" aria-hidden="true" focusable="false"><defs><marker id="network-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#53887a"/></marker></defs>${paths}</svg><div class="network-center" style="left:50%;top:50%" aria-label="当前${esc(model.center.code+' '+model.center.label)}"><strong>${esc(model.center.code)}</strong><small>${esc(model.center.label)}</small></div>${placed.map(item=>`<button class="network-node" data-action="networkGraphNode" data-code="${item.code}" style="left:${item.x/520*100}%;top:${item.y/420*100}%" aria-label="选择${esc(item.code+' '+item.label)}并展开它的相邻${networkGraphScope==='nodes'?'知识点':'区域'}"><strong>${esc(item.code)}</strong><small>${esc(item.label)}</small></button>`).join('')}</div></div><div class="network-graph-controls" role="group" aria-label="展开其余相邻节点"><button id="network-graph-prev" class="secondary" data-action="networkGraphPage" data-delta="-1" ${model.page===0?'disabled':''}>前一组联系</button><span role="status">第${model.page+1}/${model.pages}组 · ${model.neighbors.length}个相邻${networkGraphScope==='nodes'?'知识点':'区域'}</span><button id="network-graph-next" class="secondary" data-action="networkGraphPage" data-delta="1" ${model.page+1>=model.pages?'disabled':''}>展开下一组</button></div><p class="tiny-note">点图里的节点，继续看它的联系。每组最多8个，完整关系也在下方；图中短标题的完整名称也在下方列表里。图的选择、缩放和展开只用于浏览。</p>`;
}
function networkPage(){
 const region=SKILL_DATA.units.find(u=>u.id===networkRegionId),node=NODE_BY_ID.get(networkSkillId);if(!region||!node)return '<div class="panel">请选择一个知识区域。</div>';
 const connections=regionConnections(region.id),neighbors=[...new Set(connections.map(c=>c.other))],practice=practiceFor(node.id),state=knowledgeState(node.id),relations=KNOWLEDGE.relations.filter(r=>(networkFilter==='all'||r.type===networkFilter)&&(r.fromNodeIds.includes(node.id)||r.toNodeIds.includes(node.id))),selected=RELATION_BY_ID.get(networkRelationId);
 return `<div class="page-head"><div><p class="kicker">${region.id} · 相连的知识</p><h1 id="network-title" tabindex="-1">${esc(region.title)}</h1></div><button class="back" data-action="home">← 全部33区域</button></div><div class="network-work"><section class="panel"><h2>它能联系到哪里？</h2><div class="network-filters" role="group" aria-label="查看联系类型"><button id="network-graph-filter-all" class="secondary" data-action="networkFilter" data-value="all" aria-pressed="${networkFilter==='all'}">全部联系</button>${Object.entries(RELATION_LABELS).map(([type,label])=>`<button id="network-graph-filter-${type}" class="secondary" data-action="networkFilter" data-value="${type}" aria-pressed="${networkFilter===type}">${label}</button>`).join('')}</div>${networkDiagram()}<div class="network-neighbors">${neighbors.map(id=>`<button class="secondary" data-action="network" data-code="${id}">${id} ${esc(SKILL_DATA.units.find(u=>u.id===id).title)}</button>`).join('')}</div><p class="tiny-note">实线是先修参考；虚线是表示、方法或共同应用。箭头表示先修/应用方向，共同参与的支持点之间不画方向箭头。所有知识点和区域都能自由打开。</p></section><article class="panel network-skill-panel"><h2>选一个知识点</h2><div class="network-skills">${region.skillIds.map(id=>`<button class="secondary" data-action="networkSkill" data-code="${id}" aria-pressed="${id===node.id}">${esc(NODE_BY_ID.get(id).concept)}</button>`).join('')}</div><h3>${node.id} ${esc(node.concept)}</h3><p class="network-evidence" role="status">${esc(state.label)}</p><div class="network-primary-actions"><button class="primary" data-action="learn" data-code="${node.id}">学：看概念 →</button><button class="secondary" data-action="${practice.view}" data-code="${node.id}">练：自己动手 →</button><button class="secondary" data-action="demo" data-code="${node.id}">看另一道例子</button><button class="secondary" data-action="stage" data-code="${node.id}|transfer">测：换一种题 →</button></div><h3>从这个点把知识连起来</h3><div class="network-relations">${relations.map(r=>{const others=[...new Set([...r.fromNodeIds,...r.toNodeIds].filter(id=>id!==node.id))];return `<section><b>${esc(RELATION_LABELS[r.type])} · ${esc(others.map(id=>NODE_BY_ID.get(id).concept).join('、'))}</b><div class="work-buttons"><button class="secondary" data-action="networkExplain" data-code="${r.id}" aria-expanded="${selected?.id===r.id}">为什么相连？</button>${others.map(id=>`<button class="secondary" data-action="network" data-code="${id}">去看${esc(NODE_BY_ID.get(id).concept)}</button>`).join('')}</div>${selected?.id===r.id?`<p>${esc(r.meaning)}</p><p>${esc(r.applicableConditions)}</p><button class="secondary" data-action="networkExplainSpeak" data-code="${r.id}">🔊 听这个联系</button>`:''}</section>`}).join('')||'<p>可以先从本知识的对象与概念开始。</p>'}</div>${stageLinks(node.id)}${jointLinks(node.id)}<details class="network-parent"><summary>家长：记录与范围</summary><p>${state.independent}个不同实例有正式独立证据。关系图浏览、说明和示范不授予掌握；支持知识不自动得分。共享题按题族条件评价；目前${JOINT_FAMILIES.size}族已接入，其余仍在编写，单点串列不算“通”。</p><p>原有练习可继续回看：${esc(reviewStatus(region.id))}。</p><button class="secondary" data-action="${region.id==='C01'?'fruit':'course'}" data-code="${region.id}">继续已有练习</button><button class="secondary" data-action="micro" data-code="${node.id}">对象辨识与原记录</button></details><div id="speech-status" role="status">${esc(speechMessage)}</div></article></div>`;
}

'use strict';
function jointLFamily(t){return t.joint.binding.startsWith('l-')}
function jointLQuantity(t){
 if(t.joint.binding!=='l-bag')throw Error('This logic task does not have one material quantity '+t.id);
 if(t.mode==='constraintLab')return t.bag;
 return t.kind==='inverse'?(t.unknownInitial?t.initial:t.initial-t.remain):t.total-t.known;
}
function jointLRole(t){if(t.joint.binding==='l-bag')return t.mode==='constraintLab'?'原操作实际一袋内的材料数':t.kind==='inverse'?(t.unknownInitial?'放回原对象后恢复的整体数':'原操作实际移出的材料数'):'实际未知袋中的材料数';return t.joint.quantityLabel}
const JOINT_L_OPERATORS=new Set(['pan-plan','equal-plan','stock-plan','motif-order','motif-budget','motif-stock','mosaic-bill','mosaic-budget','mosaic-offers','sequence-packs','sequence-capacity','machine-plan','grid-bill','grid-offers','travel-bill','travel-budget']);
const JOINT_L_OFFERS=new Set(['mosaic-offers','grid-offers']);
function jointLAlphabet(t){return [...new Set(t.base)]}
function jointLNewCount(t){return t.kind==='twoPrev'?t.count:2}
function jointLFields(t){const p=t.joint.params;switch(p.operator){
 case 'pan-plan':return [['left','原左盘实际总量'],['right','原右盘实际总量'],['change','指定盘计划改变量（加为正、拿走为负、不变为0）'],['cost','这次安排总金额（元）']];
 case 'equal-plan':return [['change','整批计划改变量（添入为正、取出为负）'],['perGroup','安排后每组的整数数量'],['cost','这次安排总金额（元）']];
 case 'stock-plan':return [['produce','本次最多交付的完整袋数'],['short','未完成的订单袋数'],['leftStock','交付后剩余原库存件数'],['cost','本次总金额（元）']];
 case 'motif-order':return [...jointLAlphabet(t).map((symbol,i)=>['material'+i,'新续接的'+symbol+'材料数']),['cost','新材料总金额（元）']];
 case 'motif-budget':return [['length','最多能连续续接的格数'],['left','最后剩余经费（元）']];
 case 'motif-stock':return [['length','最多能连续续接的格数'],...jointLAlphabet(t).map((symbol,i)=>['material'+i,'实际新用的'+symbol+'材料数']),['cost','实际用料金额（元）']];
 case 'mosaic-bill':case 'mosaic-budget':case 'mosaic-offers':return [['red','本次采购的红色片数'],['blue','本次采购的蓝色片数'],...(p.operator==='mosaic-offers'?[['plan','选择报价']]:[]),[p.operator==='mosaic-budget'?'left':'cost',p.operator==='mosaic-budget'?'经费剩余（元）':'总金额（元）']];
 case 'sequence-packs':return p.pool?[['boxes','合并后至少需要的箱数'],['empty','合并装箱后总空格数'],['cost','总金额（元）']]:[...Array.from({length:jointLNewCount(t)},(_,i)=>[['boxes'+i,'新第'+(i+1)+'批至少需要的箱数'],['empty'+i,'新第'+(i+1)+'批箱内空格数']]).flat(),['cost','总金额（元）']];
 case 'sequence-capacity':return [['capacity','每箱至少需要的容量'],['cost','这些箱的总金额（元）']];
 case 'machine-plan':return [['input','每轮安排的整数输入份数'],['output','全部新轮次实际产出份数'],['excess','超过需求的份数（没有时填0）'],['short','不足的份数（没有时填0）'],['cost','本次总金额（元）']];
 case 'grid-bill':case 'grid-offers':return [['horizontal','这趟路线的横向格数'],['vertical','这趟路线的纵向格数'],...(p.operator==='grid-offers'?[['plan','选择报价']]:[]),['cost','这趟总金额（元）']];
 case 'travel-bill':case 'travel-budget':return [['distance','连同题目指定返回段的实际路程格数'],[p.operator==='travel-budget'?'left':'cost',p.operator==='travel-budget'?'剩余经费（元）':'总金额（元）']];
 default:return null;
}}
function jointLText(t){const p=t.joint.params;
 if(p.operator==='pan-plan')return `用摆出的实际两盘制定新安排，不把“相等/不等”当材料数。${t.mode==='constraintLab'?'左边是实际组装出的整批，右边是原式要求的整批；':''}计划只改${p.side==='left'?'左':'右'}盘，让它${p.offset===0?'与另一盘一样多':p.offset>0?'比另一盘多'+p.offset+'颗':'比另一盘少'+(-p.offset)+'颗'}。填原两盘总量和指定盘的改变量；正数表示添入，负数表示取出，0表示不改。每处理1颗${p.unitPrice}元，另收一次${p.fee}元安排费，0颗也收安排费。总金额多少？`;
 if(p.operator==='equal-plan')return `沿用原题同一批原点和${t.divisor}组。${p.direction==='add'?'先用最少新增原点补到能够平均分完'+(p.extraEach?'，再给每组增加'+p.extraEach+'颗':''):'只取出最少原点，使留下的全部原点能平均分完'}。填整批改变量及最终每组数；添入为正、取出为负、不变填0。每处理1颗${p.unitPrice}元，另收一次${p.fee}元安排费，0颗也收；共多少元？`;
 if(p.operator==='stock-plan')return `同一库存要交付${p.demand}袋订单，每袋仍用原题${t.per}件。每交付一满袋收${p.unitPrice}元，另收一次${p.fee}元安排费${p.budget!==undefined?'，总经费上限'+p.budget+'元':''}；即使交付0袋也收安排费。只交付完整袋，数量不能超过订单、实际库存${p.budget!==undefined?'或经费上限':''}。最多交付几袋、订单还缺几袋、库存还剩几件、总额多少？`;
 if(p.operator.startsWith('motif-')){const prices=jointLAlphabet(t).map((symbol,i)=>symbol+'每格'+p.prices[i]+'元').join('、');return `沿用原串的重复规则，从整条已给原串的末尾继续，一格也不能跳过。原串用料已备好，只算新续接部分，${prices}。`+(p.operator==='motif-order'?`恰好再续${p.length}格，分别需几块各类材料，共多少元？`:p.operator==='motif-budget'?`另收一次${p.fee}元费用，含费用总共只有${p.budget}元。最多能连续续几格，剩多少元？`:`仅有${jointLAlphabet(t).map((symbol,i)=>symbol+p.stocks[i]+'块').join('、')}，不能换色或跳过下一格。最多续几格，实际各用几块，按用量计价共多少元？`)}
 if(p.operator.startsWith('mosaic-')){const scope=p.onlyAdded?'原题已给的行免费，只采购亲手补出的其他行':'包含原题已给各行的完整新图案',quote=x=>`红色每片${x.prices[0]}元、蓝色每片${x.prices[1]}元，另收一次${x.fee}元`;return `给${scope}配材料，不能改变涂出的颜色。先填本次红蓝各多少片。`+(p.operator==='mosaic-offers'?`报价A：${quote(p.plans[0])}；B：${quote(p.plans[1])}。选总额较低的报价并填总额，同价任选。`:`${quote(p)}。${p.operator==='mosaic-budget'?'从'+p.budget+'元付完剩多少？':'共多少元？'}`)}
 if(p.operator==='sequence-packs')return `把原规则亲手新生成的每项数看作一批物品，原题已给的项已经交付，不再计算。${p.pool?'把全部新批合成同一批后一次装箱':'各个新批必须分别装箱，上一批的空格不能给下一批用'}，每箱最多${p.capacity}件；要全部装下。填${p.pool?'合并后':'每个新批'}最少箱数和空格数。每箱${p.unitPrice}元，全单另收一次${p.fee}元，共多少元？`;
 if(p.operator==='sequence-capacity')return `把原规则亲手新生成的全部项各看作一批物品，只合并新批；已给的旧批不计算。要全部装进${p.containers}个相同箱，每箱至少需多少整数容量？每个箱每1格容量收${p.unitPrice}元，全部箱另收一次${p.fee}元，总金额多少？`;
 if(p.operator==='machine-plan')return `沿用实际在每张卡中检验过的同一输入输出规则。新工作每轮把输入看作原料份数、输出看作产成品份数，${p.runs}轮都用同一整数输入；规则中的附加量每轮都要计算。共需${p.demand}份产成品。${p.mode==='minimum'?'安排能满足需求的最少原料输入':'原料和经费有限，要安排可行的最多整数输入'}${p.stock!==undefined?'，新工作原料最多'+p.stock+'份':''}${p.budget!==undefined?'，新工作总经费最多'+p.budget+'元':''}。每份原料${p.unitPrice}元，全单另收一次${p.fee}元。填每轮输入、全部产出、超出/不足及总金额；没有超出或不足时分别填0。`;
 if(p.operator.startsWith('grid-')){const journey=t.kind==='move'?`先完成原移动路线，再从实际终点沿格线走到仓库(${p.depot.join(',')})`:`从仓库(${p.origin.join(',')})开始，依次按原题身份${(t.kind==='pair'?['A']:t.kind==='order'?['A','B']:t.pairs.map((_,i)=>String.fromCharCode(65+i))).join('→')}访问实际记录的点${p.return?'，最后回到同一仓库':''}`;const quote=x=>`横向每格${x.horizontalPrice}元，纵向每格${x.verticalPrice}元，另收一次${x.fee}元`;return `${journey}。每段只沿横纵格线走最短路线，横纵可先后交换；不按直线斜走，也不重排点的身份。填横向和纵向的总格数。`+(p.operator==='grid-offers'?`报价A：${quote(p.plans[0])}；B：${quote(p.plans[1])}。选择较低总额并填金额，同价任选。`:`${quote(p)}，总金额多少？`)}
 if(p.operator.startsWith('travel-'))return `原时间图记录的是位置，计费按实际走过的格数${p.returnPosition!==undefined?'，原时间段结束后还需走到位置'+p.returnPosition+'，这段也计入路程':''}，不能拿终点位置直接当路程。每走1格${p.unitPrice}元${p.minutePrice?'，原图记录的每1分钟另收'+p.minutePrice+'元；返回段不收这项时间费':''}，另收一次${p.fee}元。填总路程及${p.operator==='travel-budget'?'从'+p.budget+'元支付后剩余经费':'总金额'}。`;
 return null;
}
function jointLObserved(t,w){if(!w)return null;const p=t.joint.params,finite=n=>Number.isFinite(n),sum=a=>a.reduce((x,y)=>x+y,0);
 if(t.joint.binding==='l-pans')return t.kind==='equal'?{left:sum(w.left.map(i=>t.left[i])),right:sum(w.right.map(i=>t.right[i]))}:{left:w.bag+w.knownPlaced,right:t.total};
 if(t.joint.binding==='l-verify')return {left:t.groups*w.filled+(t.extraOutside?w.extra:t.groups*w.extra),right:t.givenTotal??constraintTotal(t)};
 if(t.joint.binding==='l-integer')return {perGroup:w.pairs,left:t.total-t.divisor*w.pairs,total:t.total};
 if(t.joint.binding==='l-stock')return {bags:t.kind==='stock'?w.bags:Number(w.choice),stock:t.stock};
 if(t.joint.binding==='l-motif'){const block=Array.from({length:3},()=>t.base).flat().slice(0,w.length);return block.length?{block,offset:t.base.length*3}:null}
 if(t.joint.binding==='l-mosaic'){const counts=[0,0];for(let r=p.onlyAdded?patternGivenRows(t):0;r<t.rows;r++)for(let c=0;c<t.cols;c++){const color=r<patternGivenRows(t)?patternColorAt(t,r,c):w.cells[r+','+c];if(color==='red')counts[0]++;if(color==='blue')counts[1]++}return {counts}}
 if(t.joint.binding==='l-sequence'){const quantities=w.terms.slice(t.initial.length);return quantities.length===jointLNewCount(t)&&quantities.every(n=>Number.isInteger(n)&&n>=0)?{quantities}:null}
 if(t.joint.binding==='l-machine'){const rule=w.rules?.at(-1);return rule&&Number.isInteger(rule.multiplier)&&rule.multiplier>0&&Number.isInteger(rule.add)&&rule.add>=0?{multiplier:rule.multiplier,add:rule.add}:null}
 if(t.joint.binding==='l-grid'||t.joint.binding==='l-trip'){let path;if(t.kind==='move')path=[...w.path,p.depot];else{const count=t.kind==='pair'?1:t.kind==='order'?2:t.pairs.length,points=Array.from({length:count},(_,i)=>w.points[i]);if(!points.every(point=>point?.length===2&&point.every(finite)))return null;path=[p.origin,...points,...(p.return?[p.origin]:[])]}return {path,horizontal:sum(path.slice(1).map((point,i)=>Math.abs(point[0]-path[i][0]))),vertical:sum(path.slice(1).map((point,i)=>Math.abs(point[1]-path[i][1])))} }
 if(t.joint.binding==='l-motion'){const values=w.trace.map(([,v])=>v),distance=sum(values.slice(1).map((v,i)=>Math.abs(v-values[i])))+(p.returnPosition!==undefined?Math.abs(values.at(-1)-p.returnPosition):0);return {distance,minutes:w.time,trace:w.trace.map(point=>[...point])}}
 return null;
}
function jointLExpected(t){const p=t.joint.params,o=jointLObserved(t,draft.work);if(!o)return null;switch(p.operator){
 case 'pan-plan':{const side=p.side==='left'?o.left:o.right,other=p.side==='left'?o.right:o.left,change=other+p.offset-side;return {...o,change,cost:Math.abs(change)*p.unitPrice+p.fee}}
 case 'equal-plan':{const perGroup=o.perGroup+(p.direction==='add'&&o.left>0?1:0)+p.extraEach,change=perGroup*t.divisor-o.total;return {change,perGroup,cost:Math.abs(change)*p.unitPrice+p.fee}}
 case 'stock-plan':{const affordable=p.budget===undefined?Infinity:Math.floor((p.budget-p.fee)/p.unitPrice),produce=Math.min(o.bags,p.demand,affordable);return {produce,short:p.demand-produce,leftStock:o.stock-produce*t.per,cost:produce*p.unitPrice+p.fee}}
 case 'motif-order':case 'motif-budget':case 'motif-stock':{const alphabet=jointLAlphabet(t),counts=alphabet.map(()=>0);let length=0,cost=0;while(length<(p.operator==='motif-order'?p.length:1000)){const index=alphabet.indexOf(o.block[(o.offset+length)%o.block.length]),price=p.prices[index];if(index<0||p.operator==='motif-budget'&&cost+price+p.fee>p.budget||p.operator==='motif-stock'&&counts[index]>=p.stocks[index])break;counts[index]++;cost+=price;length++}return {length,cost,left:p.budget-p.fee-cost,...Object.fromEntries(counts.map((n,i)=>['material'+i,n]))}}
 case 'mosaic-bill':case 'mosaic-budget':case 'mosaic-offers':{const [red,blue]=o.counts,cost=x=>red*x.prices[0]+blue*x.prices[1]+x.fee;if(p.operator==='mosaic-offers'){const values=p.plans.map(cost),min=Math.min(...values);return {red,blue,plans:p.plans.filter((_,i)=>values[i]===min).map(x=>x.id),cost:min}}return {red,blue,cost:cost(p),left:p.budget-cost(p)}}
 case 'sequence-packs':{const quantities=p.pool?[o.quantities.reduce((a,b)=>a+b,0)]:o.quantities,boxes=quantities.map(q=>Math.ceil(q/p.capacity)),empty=boxes.map((n,i)=>n*p.capacity-quantities[i]),cost=boxes.reduce((a,b)=>a+b,0)*p.unitPrice+p.fee;return p.pool?{boxes:boxes[0],empty:empty[0],cost}:{...Object.fromEntries(boxes.flatMap((n,i)=>[['boxes'+i,n],['empty'+i,empty[i]]])),cost}}
 case 'sequence-capacity':{const capacity=Math.ceil(o.quantities.reduce((a,b)=>a+b,0)/p.containers);return {capacity,cost:capacity*p.containers*p.unitPrice+p.fee}}
 case 'machine-plan':{const input=p.mode==='minimum'?Math.max(0,Math.ceil((p.demand-p.runs*o.add)/(p.runs*o.multiplier))):Math.min(Math.floor(p.stock/p.runs),Math.floor((p.budget-p.fee)/(p.runs*p.unitPrice))),output=p.runs*(input*o.multiplier+o.add);return {input,output,excess:Math.max(0,output-p.demand),short:Math.max(0,p.demand-output),cost:input*p.runs*p.unitPrice+p.fee}}
 case 'grid-bill':case 'grid-offers':{const {horizontal,vertical}=o,cost=x=>horizontal*x.horizontalPrice+vertical*x.verticalPrice+x.fee;if(p.operator==='grid-offers'){const values=p.plans.map(cost),min=Math.min(...values);return {horizontal,vertical,plans:p.plans.filter((_,i)=>values[i]===min).map(x=>x.id),cost:min}}return {horizontal,vertical,cost:cost(p)}}
 case 'travel-bill':case 'travel-budget':{const cost=o.distance*p.unitPrice+o.minutes*(p.minutePrice||0)+p.fee;return {distance:o.distance,cost,left:p.budget-cost}}
 default:throw Error('Unknown shared logic operator '+p.operator);
}}
function jointLValidate(t,base){const native=base.grade(t),expected=jointLExpected(t),answers=jointState().responses,support=!!expected&&jointReady(t)&&jointLFields(t).every(([key])=>key==='plan'?expected.plans.includes(answers.plan):jointNumber(answers[key])===expected[key]);return {ok:native.ok&&support,nativeAnchorPassed:!!native.ok,supportAnchorPassed:support,reason:!native.ok?native.reason:'核对实际两盘/分组/新批/图案身份/路线和这次安排的整数、预算、整包或费用条件。',observedErrors:[...(!native.ok?['primary-operation-condition']:[]),...(!support?['shared-condition-response']:[])]}}
function jointLGuard(t){const p=t.joint.params;if(t.joint.binding==='l-bag'){const q=jointLQuantity(t);if(!Number.isInteger(q)||q<0)throw Error('Invalid logic bag quantity '+t.id)}else if(!JOINT_L_OPERATORS.has(p.operator))throw Error('Missing logic shared operator '+t.id);if(p.operator==='machine-plan'&&(p.runs<1||p.mode==='maximum'&&(!(p.stock>=0)||!(p.budget>=p.fee))))throw Error('Invalid new machine work '+t.id)}


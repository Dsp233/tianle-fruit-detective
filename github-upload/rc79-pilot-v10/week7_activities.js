// Rule-building and loop execution are direct tasks. Revealing test results is support.
function resetWeek7(){state.week7={step:0,aStep:0,bStep:0,loop:0,green:1,closed:0,unknownGreen:1,unknownClosed:2,card:null,rule:{color:'blue',shape:'square',logic:'or',tested:false}};}
function week7Condition(g,c,or=false){if(g===2||c===2)return '待核实';return (or?(g===1||c===1):(g===1&&c===1))?'可以继续':'先等待';}
function week7RuleValue(){const r=state.week7.rule;return r.color+(r.logic==='and'?'&':'|')+r.shape;}
function week7RunRule(color,shape,rule=state.week7.rule){const a=color===rule.color,b=shape===rule.shape;return rule.logic==='and'?a&&b:a||b;}
function week7RuleSamples(){return [['蓝色方形','blue','square',true],['蓝色圆形','blue','circle',false],['红色方形','red','square',false],...(state.question===3?[['红色圆形','red','circle',false]]:[])];}
function week7Activity(){
 const s=state.week7;
 if(state.day===42){const start=state.question===3?4:3,values=[start,start+2,(start+2)*2];return `<div class="activity"><h3>${rt('一步一步运行')}</h3><p>${rt('先加 2，再把现在的数乘 2。')}</p><p data-w7-step>${rt('已运行 '+s.step+' 步；现在是 '+values[s.step]+'。')}</p><div class="nav">${button('w7Step','执行下一步',s.step===2?'disabled':'')}${button('w7StepUndo','撤回一步')}${button('w7StepClear','重新开始')}</div></div>`;}
 if(state.day===43){const or=state.question===3;return `<div class="activity"><h3>${rt('条件开关')}</h3><p>${rt(or?'本题用“或者”：至少一项满足即可。':'本题用“并且”：两项都要满足。')}</p><div class="nav">${button('w7Green',s.green?'绿灯':'红灯')}${button('w7Closed',s.closed?'盖子合上':'盖子打开')}</div><p data-w7-condition>${rt(week7Condition(s.green,s.closed,or))}</p></div>`;}
 if(state.day===44){const n=state.question===3?4:3,a=[n,n+2,(n+2)*2],b=[n,n*2,n*2+2];return `<div class="activity"><h3>${rt('两条运行轨道')}</h3><p>${rt('甲先加 2 再乘 2；乙先乘 2 再加 2。')}</p><div class="nav">${button('w7A','甲执行下一步',s.aStep===2?'disabled':'')}${button('w7B','乙执行下一步',s.bStep===2?'disabled':'')}${button('w7TracksClear','两条都重来')}</div><p data-w7-tracks>${rt('甲：'+a.slice(0,s.aStep+1).join(' → ')+'；乙：'+b.slice(0,s.bStep+1).join(' → '))}</p></div>`;}
 if(state.day===45)return `<div class="activity"><h3>${rt('由你决定何时停止')}</h3><p>${rt(state.question===3?'从 1 开始，每次加 3；大于 10 时停止。':'从 1 开始，每次加 3；达到或超过 10 时停止。')}</p><p data-w7-loop>${rt('已加 '+s.loop+' 次；现在是 '+(1+3*s.loop)+'。')}</p><div class="nav">${button('w7Loop','加 3',s.loop>=6?'disabled':'')}${button('w7LoopUndo','撤回一次')}${button('w7LoopClear','重新开始')}${button('w7SpeakLoop','听操作说明')}</div><p class="muted">${rt('数字盒不会替你停止。看规则，决定何时提交。')}</p></div>`;
 if(state.day===46){const labels=['否','是','尚未确认'];return `<div class="activity"><h3>${rt('输入状态卡')}</h3><p>${rt('点卡片可切换状态。有一项尚未确认时，先显示“待核实”。')}</p><div class="nav">${button('w7UnknownGreen','灯为绿：'+labels[s.unknownGreen])}${button('w7UnknownClosed','盖子合上：'+labels[s.unknownClosed])}</div><p data-w7-unknown>${rt(week7Condition(s.unknownGreen,s.unknownClosed))}</p></div>`;}
 if(state.day===47){const rows=['甲：蓝色圆形','乙：红色方形','丙：蓝色三角形',...(state.question===3?['丁：蓝色圆形']:[])];return `<div class="activity"><h3>${rt('找卡片检查一句话')}</h3><p>${rt('原话：所有蓝色卡都是圆形。')}</p><div class="nav">${rows.map((v,i)=>button('w7Card',v,`data-index="${i}" aria-pressed="${s.card===i}"`)).join('')}</div><p data-w7-card>${rt(s.card===null?'选择一张卡，查看它的颜色和形状。':rows[s.card])}</p></div>`;}
 if(state.day===48){const r=s.rule,samples=week7RuleSamples();return `<div class="activity"><h3>${rt('规则修理台')}</h3><p>${rt('选择颜色、连接词和形状。运行样例会显示检查结果。')}</p><div class="nav">${['blue','red'].map(v=>button('w7RuleColor',v==='blue'?'蓝色':'红色',`data-value="${v}" aria-pressed="${r.color===v}"`)).join('')}${['and','or'].map(v=>button('w7RuleLogic',v==='and'?'并且':'或者',`data-value="${v}" aria-pressed="${r.logic===v}"`)).join('')}${['square','circle'].map(v=>button('w7RuleShape',v==='square'?'方形':'圆形',`data-value="${v}" aria-pressed="${r.shape===v}"`)).join('')}</div><p data-w7-rule>${rt((r.color==='blue'?'蓝色':'红色')+(r.logic==='and'?'并且':'或者')+(r.shape==='square'?'方形':'圆形')+'就送出。')}</p><ul>${samples.map(([label,c,shape,want])=>`<li>${rt(label+'：要求'+(want?'送出':'留下')+(r.tested?'；运行结果'+(week7RunRule(c,shape)?'送出':'留下')+'，'+(week7RunRule(c,shape)===want?'相符':'不相符'):'')+'。')}</li>`).join('')}</ul><div class="nav">${button('w7RuleTest','运行样例')}${button('w7SpeakRule','听当前规则')}</div></div>`;}
 return '';
}
function week7Handle(a,b,i){
 if(!a.startsWith('w7'))return false;
 if(a==='w7SpeakLoop'){say('从 1 开始，每次加 3。数字盒不会替你停止，请按题目规则决定何时提交。','support');return true}
 if(a==='w7SpeakRule'){const r=state.week7.rule;say((r.color==='blue'?'蓝色':'红色')+(r.logic==='and'?'并且':'或者')+(r.shape==='square'?'方形':'圆形')+'就送出。','support');return true}
 const s=state.week7,primary=state.question===0&&((state.day===45&&['w7Loop','w7LoopUndo','w7LoopClear'].includes(a))||(state.day===48&&['w7RuleColor','w7RuleShape','w7RuleLogic'].includes(a)));
 if(!primary){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a})}
 if(a==='w7Step')s.step=Math.min(2,s.step+1);
 else if(a==='w7StepUndo')s.step=Math.max(0,s.step-1);
 else if(a==='w7StepClear')s.step=0;
 else if(a==='w7Green')s.green=1-s.green;
 else if(a==='w7Closed')s.closed=1-s.closed;
 else if(a==='w7A')s.aStep=Math.min(2,s.aStep+1);
 else if(a==='w7B')s.bStep=Math.min(2,s.bStep+1);
 else if(a==='w7TracksClear'){s.aStep=0;s.bStep=0}
 else if(a==='w7Loop')s.loop=Math.min(6,s.loop+1);
 else if(a==='w7LoopUndo')s.loop=Math.max(0,s.loop-1);
 else if(a==='w7LoopClear')s.loop=0;
 else if(a==='w7UnknownGreen')s.unknownGreen=(s.unknownGreen+1)%3;
 else if(a==='w7UnknownClosed')s.unknownClosed=(s.unknownClosed+1)%3;
 else if(a==='w7Card')s.card=i;
 else if(a==='w7RuleColor'&&['blue','red'].includes(b.dataset.value)){s.rule.color=b.dataset.value;s.rule.tested=false}
 else if(a==='w7RuleShape'&&['square','circle'].includes(b.dataset.value)){s.rule.shape=b.dataset.value;s.rule.tested=false}
 else if(a==='w7RuleLogic'&&['and','or'].includes(b.dataset.value)){s.rule.logic=b.dataset.value;s.rule.tested=false}
 else if(a==='w7RuleTest')s.rule.tested=true;
 return true;
}


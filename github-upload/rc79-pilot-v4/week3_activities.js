// Exploratory boards for the radio editing week. Choices here are assistance,
// not answers and not evidence of independent mastery.
function resetWeek3(){state.week3={timeline:[],comparison:[],flashes:[],channel:null,allocation:[null,null,null],target:0,experiment:[],editor:[null,null,null]};}
function week3Activity(){
 const s=state.week3;
 if(state.day===14){const labels=['6:04 第一段声音','6:06 调整天线','6:12 第二段声音'];return `<div class="activity"><h3>${rt('整理时间线')}</h3><p>${rt('点卡片排列记录；可以撤回。')}</p><div class="nav">${labels.map((x,i)=>button('w3Timeline',x,`data-index="${i}" aria-pressed="${s.timeline.includes(i)}"`)).join('')}</div><p data-w3-timeline>${rt(s.timeline.map(i=>labels[i]).join(' → ')||'尚未放入记录')}</p>${button('w3Undo','撤回一张')}</div>`;}
 if(state.day===15){const rows=['时间：两张都是 6:04。','地点：甲写东门，乙写北门。','来源：两人分别听写，原片段不完整。'];return `<div class="activity"><h3>${rt('并排核对记录')}</h3><p>${rt('选择需要比较的项目。')}</p><div class="nav">${['时间','地点','来源'].map((x,i)=>button('w3Comparison',x,`data-index="${i}" aria-pressed="${s.comparison.includes(i)}"`)).join('')}</div><div data-w3-comparison>${s.comparison.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;}
 if(state.day===16){const sum=s.flashes.reduce((n,x)=>n+x,0),code=s.flashes.length===2?({2:'北门',3:'西门',4:'暂缓'}[sum]||'无约定'):'';return `<div class="activity"><h3>${rt('闪光编码卡')}</h3><p>${rt('选择两次闪光，试试交换顺序。')}</p><div class="nav">${button('w3Flash','短闪','data-value="1"')}${button('w3Flash','长闪','data-value="2"')}${button('w3FlashUndo','撤回一次')}${button('w3FlashClear','重新试')}</div><p data-w3-flash>${rt(s.flashes.length?s.flashes.map(x=>x===1?'短闪':'长闪').join(' → ')+'；和为 '+sum+(code?'，约定：'+code:''):'还没有选择闪光。')}</p></div>`;}
 if(state.day===17){const rows=['同一段确认清晰的测试录音。','耳机输出：听起来清楚。','音箱输出：仍有杂音。'];return `<div class="activity"><h3>${rt('检查路径')}</h3><p>${rt('选一处查看本次记录。')}</p><div class="nav">${['测试音源','耳机','音箱'].map((x,i)=>button('w3Channel',x,`data-index="${i}" aria-pressed="${s.channel===i}"`)).join('')}</div><p data-w3-channel>${s.channel===null?'':rt(rows[s.channel])}</p></div>`;}
 if(state.day===18){const targets=['发射器','监听器',state.question===3?'灯':'备用'],vals=s.allocation.filter(x=>x!==null),dupe=new Set(vals).size!==vals.length;return `<div class="activity"><h3>${rt('电池分配板')}</h3><p>${rt('先选分配对象，再选电池；再次点同一块可撤回。')}</p><div class="nav">${targets.map((x,i)=>button('w3Target',x,`data-index="${i}" aria-pressed="${s.target===i}"`)).join('')}</div><div class="nav">${[9,6,5].map(n=>button('w3Battery',n+' 单位',`data-value="${n}"`)).join('')}</div><p data-w3-allocation>${rt(targets.map((x,i)=>x+'：'+(s.allocation[i]===null?'未选':s.allocation[i]+' 单位')).join('；')+(dupe?'。同一块电池不能同时分配给两个对象。':''))}</p></div>`;}
 if(state.day===19){const items=['位置','设备','测试录音','开窗状态','周围声音'];return `<div class="activity"><h3>${rt('实验条件板')}</h3><p>${rt('点选想记录或核对的条件；选择不自动判分。')}</p><div class="nav">${items.map((x,i)=>button('w3Experiment',x,`data-index="${i}" aria-pressed="${s.experiment.includes(i)}"`)).join('')}</div><p data-w3-experiment>${rt('已选：'+(s.experiment.map(i=>items[i]).join('、')||'无'))}</p></div>`;}
 if(state.day===20){const rows=['6:09 收到更改到北门的通知','集合日期和时间尚未确认','联系负责人核对当前安排'],kinds=['事实','待确认','下一步'];return `<div class="activity"><h3>${rt('播报编辑板')}</h3><p>${rt('点每张卡，为它选择一个标记；可反复修改。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w3Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p data-w3-editor>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week3Handle(a,b,i){
 if(!a.startsWith('w3'))return false;
 const s=state.week3;state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});
 if(a==='w3Timeline'&&!s.timeline.includes(i))s.timeline.push(i);
 else if(a==='w3Undo')s.timeline.pop();
 else if(a==='w3Comparison')s.comparison=s.comparison.includes(i)?s.comparison.filter(x=>x!==i):[...s.comparison,i];
 else if(a==='w3Flash'&&s.flashes.length<2)s.flashes.push(Number(b.dataset.value));
 else if(a==='w3FlashUndo')s.flashes.pop();
 else if(a==='w3FlashClear')s.flashes=[];
 else if(a==='w3Channel')s.channel=i;
 else if(a==='w3Target')s.target=i;
 else if(a==='w3Battery'){const n=Number(b.dataset.value);s.allocation[s.target]=s.allocation[s.target]===n?null:n;}
 else if(a==='w3Experiment')s.experiment=s.experiment.includes(i)?s.experiment.filter(x=>x!==i):[...s.experiment,i];
 else if(a==='w3Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}

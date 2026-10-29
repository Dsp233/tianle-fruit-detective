// Day 22–28 exploration is assistance and cannot establish independent mastery.
function resetWeek4(){state.week4={point:null,containers:[],route:null,rain:[],experiment:[],repairs:[],editor:[null,null,null]};}
function week4Activity(){
 const s=state.week4;
 if(state.day===21){const rows=[['东点',8,5],['西点',5,4],['南点',6,6]],r=s.point===null?null:rows[s.point];return `<div class="activity"><h3>${rt('水位记录板')}</h3><p>${rt('选择一个位置，比较开始与结束的水深。')}</p><div class="nav">${rows.map((x,i)=>button('w4Point',x[0],`data-index="${i}" aria-pressed="${s.point===i}"`)).join('')}</div><p data-w4-point>${r?rt(r[0]+'：开始 '+r[1]+' 厘米，结束 '+r[2]+' 厘米；下降 '+(r[1]-r[2])+' 厘米。'):''}</p></div>`;}
 if(state.day===22){const remaining=[state.question===3?3:4,5,3],labels=['大桶','中桶','小桶'],total=s.containers.reduce((n,i)=>n+remaining[i],0);return `<div class="activity"><h3>${rt('容器剩余空间')}</h3><p>${rt('最多选择两只容器；再点一次可撤回。')}</p><div class="nav">${labels.map((x,i)=>button('w4Container',x+ ' 剩余 '+remaining[i]+' 升',`data-index="${i}" aria-pressed="${s.containers.includes(i)}"`)).join('')}</div><p data-w4-capacity>${rt('已选 '+s.containers.length+' 只，剩余空间共 '+total+' 升。')}</p></div>`;}
 if(state.day===23){const rows=[['A 路',10,state.question===1?'门已确认打开':'门未确认'],['B 路',11,'已确认可通行'],['C 路',7,state.question===3?'已确认开放':'暂时关闭']],r=s.route===null?null:rows[s.route];return `<div class="activity"><h3>${rt('路线比较')}</h3><p>${rt('选一条路线，查看本题的时间和状态。')}</p><div class="nav">${rows.map((x,i)=>button('w4Route',x[0],`data-index="${i}" aria-pressed="${s.route===i}"`)).join('')}</div><p data-w4-route>${r?rt(r[0]+'：'+r[1]+' 分钟；'+r[2]+'。实际行动仍听工作人员指引。'):''}</p></div>`;}
 if(state.day===24){const labels=['第一小时','第二小时','第三小时'],rows=['第一小时：2 毫米。','第二小时：3 毫米。','第三小时：空白，含义尚未核实。'];return `<div class="activity"><h3>${rt('雨量记录卡')}</h3><p>${rt('点选要查看的时段；空白先保留为未知。')}</p><div class="nav">${labels.map((x,i)=>button('w4Rain',x,`data-index="${i}" aria-pressed="${s.rain.includes(i)}"`)).join('')}</div><div data-w4-rain>${s.rain.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;}
 if(state.day===25){const items=['坡度','板面','用水量','用时'];return `<div class="activity"><h3>${rt('实验条件面板')}</h3><p>${rt('点选你想核对的条件；选择不自动判分。')}</p><div class="nav">${items.map((x,i)=>button('w4Experiment',x,`data-index="${i}" aria-pressed="${s.experiment.includes(i)}"`)).join('')}</div><p data-w4-experiment>${rt('已选：'+(s.experiment.map(i=>items[i]).join('、')||'无'))}</p></div>`;}
 if(state.day===26){const items=['安全门','桥板','照明灯'],cost=[3,4,2],total=s.repairs.reduce((n,i)=>n+cost[i],0),budget=state.question===3?9:7,required=s.repairs.includes(0)&&s.repairs.includes(1);return `<div class="activity"><h3>${rt('预算卡')}</h3><p>${rt('选择维修项目；再点一次可撤回。')}</p><div class="nav">${items.map((x,i)=>button('w4Repair',x+' '+cost[i]+' 单位',`data-index="${i}" aria-pressed="${s.repairs.includes(i)}"`)).join('')}</div><p data-w4-budget>${rt('合计 '+total+' 单位，预算 '+budget+' 单位。'+(total>budget?'已超过预算。':'')+(required?'题目要求的两项维修已选择。':'还有题目要求的维修未选。')+'是否开放仍由工作人员现场确认。')}</p></div>`;}
 if(state.day===27){const rows=['东点那次水深下降 3 厘米','第三小时雨量尚未核实','联系工作人员确认 A 门'],kinds=['事实','待确认','下一步'];return `<div class="activity"><h3>${rt('邻里说明卡')}</h3><p>${rt('点每张卡，选择标记；可以反复修改。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w4Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p data-w4-editor>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week4Handle(a,b,i){
 if(!a.startsWith('w4'))return false;
 const s=state.week4;state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});
 if(a==='w4Point')s.point=i;
 else if(a==='w4Container')s.containers=s.containers.includes(i)?s.containers.filter(x=>x!==i):[...s.containers,i].slice(-2);
 else if(a==='w4Route')s.route=i;
 else if(a==='w4Rain')s.rain=s.rain.includes(i)?s.rain.filter(x=>x!==i):[...s.rain,i];
 else if(a==='w4Experiment')s.experiment=s.experiment.includes(i)?s.experiment.filter(x=>x!==i):[...s.experiment,i];
 else if(a==='w4Repair')s.repairs=s.repairs.includes(i)?s.repairs.filter(x=>x!==i):[...s.repairs,i];
 else if(a==='w4Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}

// Exploration is recorded as help; it is not an independent answer.
function resetWeek5(){state.week5={match:[null,null,null],target:0,path:['S'],start:null,interval:null,loads:[0,0,0],editor:[null,null,null]};}
function week5Activity(){
 const s=state.week5;
 if(state.day===28){const envelopes=['A','B','C'],groups=['播报组','造型组','后勤组'],chosen=s.match.filter(x=>x!==null),dupe=new Set(chosen).size!==chosen.length;return `<div class="activity"><h3>${rt('信封匹配板')}</h3><p>${rt('先选信封，再选接收组；再次点击同一组可撤回。')}</p><div class="nav">${envelopes.map((x,i)=>button('w5Target',x+' 信封',`data-index="${i}" aria-pressed="${s.target===i}"`)).join('')}</div><div class="nav">${groups.map((x,i)=>button('w5Match',x,`data-index="${i}" aria-pressed="${s.match[s.target]===i}"`)).join('')}</div><p data-w5-match>${rt(envelopes.map((x,i)=>x+'：'+(s.match[i]===null?'未选':groups[s.match[i]])).join('；')+(dupe?'。每个组只能对应一封。':''))}</p></div>`;}
 if(state.day===29){const rule=state.question===2?'A 到 C 关闭；B 到 D 已开放。':state.question===3?'A 到 C、B 到 C 关闭；B 到 D 尚未开放。':'A 到 C 关闭；B 到 D 尚未开放。';return `<div class="activity"><h3>${rt('交接路线板')}</h3><p>${rt('连接：S 到 A 或 B；A 到 C；B 到 C 或 D；C、D 到 T。')}</p><p>${rt(rule)}</p><p data-w5-path>${esc(s.path.join(' → '))}</p><div class="nav">${['A','B','C','D','T'].map(n=>button('w5Route',n,`data-node="${n}"`)).join('')}${button('w5Undo','撤回一步')}${button('w5Clear','重新开始')}</div></div>`;}
 if(state.day===30){const total=25+(state.question===3?3:0),end=s.start===null?null:s.start+total,clock=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');return `<div class="activity"><h3>${rt('出发时间轴')}</h3><p>${rt('选择出发时刻，查看按题目时间计算的到达时刻。')}</p><div class="nav">${[570,572,575,580].map(n=>button('w5Start',clock(n),`data-value="${n}" aria-pressed="${s.start===n}"`)).join('')}</div><p data-w5-time>${end===null?'':rt('预计 '+clock(end)+' 到达；这次计划共 '+total+' 分钟。')}</p></div>`;}
 if(state.day===31){const r=s.interval===null?'':s.interval===0?(state.question===3?'新增交接已确认：9:10 由阿宁保管。':'按原记录：9:10 由小禾保管。'):'按记录：9:16 由天乐保管。';return `<div class="activity"><h3>${rt('交接时间线')}</h3><p>${rt('选择时刻，查看本题已确认的交接状态。')}</p><div class="nav">${['9:10','9:16'].map((x,i)=>button('w5Interval',x,`data-index="${i}" aria-pressed="${s.interval===i}"`)).join('')}</div><p data-w5-interval>${rt(r)}</p></div>`;}
 if(state.day===32||state.day===33){const weights=[3,2,2],names=['A','B','C'],cap=state.day===32&&state.question===3?4:5,totals=[1,2].map(t=>s.loads.reduce((n,v,i)=>n+(v===t?weights[i]:0),0));let order='';if(state.day===33&&s.loads[1]&&s.loads[2])order=s.loads[2]<s.loads[1]?'C 比 B 先到。':s.loads[2]===s.loads[1]?'B 和 C 同时到达。':'C 比 B 后到。';return `<div class="activity"><h3>${rt('两趟装车板')}</h3><p>${rt('点击物品依次切换未分配、第一趟和第二趟。')}</p><div class="nav">${names.map((x,i)=>button('w5Load',x+' '+weights[i]+' 千克：'+(s.loads[i]===0?'未分配':s.loads[i]===1?'第一趟':'第二趟'),`data-index="${i}"`)).join('')}</div><p data-w5-load>${rt('第一趟 '+totals[0]+' 千克，第二趟 '+totals[1]+' 千克；每趟上限 '+cap+' 千克。'+(totals.some(n=>n>cap)?'有一趟超重。':'')+order)}</p></div>`;}
 if(state.day===34){const rows=['A 在 9:05 送达','C 在 9:15 签收','B 的签收栏未填写'],kinds=['已记录','待确认','下一步'];return `<div class="activity"><h3>${rt('交接记录卡')}</h3><p>${rt('点击卡片旁的标记，区分已记录与待确认。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w5Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week5Handle(a,b,i){
 if(!a.startsWith('w5'))return false;
 const s=state.week5;state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});
 if(a==='w5Target')s.target=i;
 else if(a==='w5Match')s.match[s.target]=s.match[s.target]===i?null:i;
 else if(a==='w5Route'){
  const graph={S:['A','B'],A:['C'],B:['C','D'],C:['T'],D:['T'],T:[]},from=s.path.at(-1),to=b.dataset.node,blocked=from==='A'&&to==='C'||from==='B'&&to==='D'&&state.question!==2||from==='B'&&to==='C'&&state.question===3;
  if(!graph[from]?.includes(to)||blocked)state.message='这条连接现在不可走，试试其他路线。';else s.path.push(to);
 }
 else if(a==='w5Undo'){if(s.path.length>1)s.path.pop()}
 else if(a==='w5Clear')s.path=['S'];
 else if(a==='w5Start')s.start=Number(b.dataset.value);
 else if(a==='w5Interval')s.interval=i;
 else if(a==='w5Load')s.loads[i]=(s.loads[i]+1)%3;
 else if(a==='w5Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}

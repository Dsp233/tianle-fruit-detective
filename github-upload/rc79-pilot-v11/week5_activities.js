// Exploration is recorded as help; it is not an independent answer.
function resetWeek5(){state.week5={match:[null,null,null],target:0,path:['S'],start:null,interval:null,loads:[0,0,0],editor:[null,null,null]};}
function week5RouteRule(){return state.question===2?'A 到 C 关闭；B 到 D 已开放。':state.question===3?'A 到 C、B 到 C 关闭；B 到 D 尚未开放。':'A 到 C 关闭；B 到 D 尚未开放。';}
function week5Activity(){
 const s=state.week5;
 if(state.day===28){const envelopes=['A','B','C'],groups=['播报组','造型组','后勤组'],chosen=s.match.filter(x=>x!==null),dupe=new Set(chosen).size!==chosen.length;return `<div class="activity"><h3>${rt('信封匹配板')}</h3><p>${rt('先选信封，再选接收组；再次点击同一组可撤回。')}</p><div class="nav">${envelopes.map((x,i)=>button('w5Target',x+' 信封',`data-index="${i}" aria-pressed="${s.target===i}"`)).join('')}</div><div class="options">${groups.map((x,i)=>`<div class="choice-row">${button('w5Match',x,`data-index="${i}" aria-pressed="${s.match[s.target]===i}"`,'choice')}${button('w5SpeakGroup','听',`data-index="${i}" aria-label="听${x}"`,'speak')}</div>`).join('')}</div><p data-w5-match>${rt(envelopes.map((x,i)=>x+'：'+(s.match[i]===null?'未选':groups[s.match[i]])).join('；')+(dupe?'。每个组只能对应一封。':''))}</p></div>`;}
 if(state.day===29){const rule=week5RouteRule();return `<div class="activity"><h3>${rt('交接路线板')}</h3><p>${rt('连接：S 到 A 或 B；A 到 C；B 到 C 或 D；C、D 到 T。')}</p><p>${rt(rule)}</p>${button('w5SpeakRoute','听路线说明')}<p data-w5-path>${esc(s.path.join(' → '))}</p><div class="nav">${['A','B','C','D','T'].map(n=>button('w5Route',n,`data-node="${n}"`)).join('')}${button('w5Undo','撤回一步')}${button('w5Clear','重新开始')}</div></div>`;}
 if(state.day===30){const total=25+(state.question===3?3:0),end=s.start===null?null:s.start+total,clock=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0'),primary=state.question===0;const description=primary?'选择出发时刻，先自己推算到达时间。':'选择出发时刻，查看按题目时间计算的到达时刻。';const display=end===null?'':primary?'已选择 '+clock(s.start)+' 出发。请自己计算到达时间。':'预计 '+clock(end)+' 到达；这次计划共 '+total+' 分钟。';return `<div class="activity"><h3>${rt('出发时间轴')}</h3><p>${rt(description)}</p><div class="nav">${[570,572,575,580].map(n=>button('w5Start',clock(n),`data-value="${n}" aria-pressed="${s.start===n}"`)).join('')}</div><p data-w5-time>${rt(display)}</p></div>`;}
 if(state.day===31){const r=s.interval===null?'':s.interval===0?(state.question===3?'新增交接已确认：9:10 由阿宁保管。':'按原记录：9:10 由小禾保管。'):'按记录：9:16 由天乐保管。';return `<div class="activity"><h3>${rt('交接时间线')}</h3><p>${rt('选择时刻，查看本题已确认的交接状态。')}</p><div class="nav">${['9:10','9:16'].map((x,i)=>button('w5Interval',x,`data-index="${i}" aria-pressed="${s.interval===i}"`)).join('')}</div><p data-w5-interval>${rt(r)}</p></div>`;}
 if(state.day===32||state.day===33){const weights=[3,2,2],names=['A','B','C'],cap=state.day===32&&state.question===3?4:5,totals=[1,2].map(t=>s.loads.reduce((n,v,i)=>n+(v===t?weights[i]:0),0)),primary=state.question===0;let order='';if(state.day===33&&s.loads[1]&&s.loads[2])order=s.loads[2]<s.loads[1]?'C 比 B 先到。':s.loads[2]===s.loads[1]?'B 和 C 同时到达。':'C 比 B 后到。';const assigned=t=>names.filter((_,i)=>s.loads[i]===t).join('、')||'暂无';const display=primary?'第一趟：'+assigned(1)+'；第二趟：'+assigned(2)+'。请自己检查重量和先后要求。':'第一趟 '+totals[0]+' 千克，第二趟 '+totals[1]+' 千克；每趟上限 '+cap+' 千克。'+(totals.some(n=>n>cap)?'有一趟超重。':'')+order;return `<div class="activity"><h3>${rt('两趟装车板')}</h3><p>${rt('点击物品依次切换未分配、第一趟和第二趟。')}</p><div class="nav">${names.map((x,i)=>button('w5Load',x+' '+weights[i]+' 千克：'+(s.loads[i]===0?'未分配':s.loads[i]===1?'第一趟':'第二趟'),`data-index="${i}"`)).join('')}</div><p data-w5-load>${rt(display)}</p></div>`;}
 if(state.day===34){const rows=['A 在 9:05 送达','C 在 9:15 签收','B 的签收栏未填写'],kinds=['已记录','待确认','下一步'];return `<div class="activity"><h3>${rt('交接记录卡')}</h3><p>${rt('点击卡片旁的标记，区分已记录与待确认。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w5Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week5Handle(a,b,i){
 if(!a.startsWith('w5'))return false;
 if(a==='w5SpeakGroup'){const groups=['播报组','造型组','后勤组'];if(groups[i])say(groups[i],'option');return true}
 if(a==='w5SpeakRoute'){say('连接：S 到 A 或 B；A 到 C；B 到 C 或 D；C、D 到 T。'+week5RouteRule(),'support');return true}
 const s=state.week5,primaryInput=state.question===0&&((state.day===28&&['w5Target','w5Match'].includes(a))||(state.day===29&&['w5Route','w5Undo','w5Clear'].includes(a))||(state.day===30&&a==='w5Start')||([32,33].includes(state.day)&&a==='w5Load'));
 if(!primaryInput){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a})}
 if(a==='w5Target')s.target=i;
 else if(a==='w5Match')s.match[s.target]=s.match[s.target]===i?null:i;
 else if(a==='w5Route'){
  const graph={S:['A','B'],A:['C'],B:['C','D'],C:['T'],D:['T'],T:[]},from=s.path.at(-1),to=b.dataset.node;
  if(!graph[from]?.includes(to))state.message='地图上没有这条连接，试试其他路线。';else s.path.push(to);
 }
 else if(a==='w5Undo'){if(s.path.length>1)s.path.pop()}
 else if(a==='w5Clear')s.path=['S'];
 else if(a==='w5Start')s.start=Number(b.dataset.value);
 else if(a==='w5Interval')s.interval=i;
 else if(a==='w5Load')s.loads[i]=(s.loads[i]+1)%3;
 else if(a==='w5Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}


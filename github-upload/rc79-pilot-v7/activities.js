// Exploratory boards for days 8-14. They are support, not independent answers.
function v3Activity(){
 if(state.day===7){
  const rows=[['操场','步行 20 分钟，视野开阔，灯在 8 点半亮。'],['屋顶','步行 10 分钟，一半天空被遮住。'],['小山坡','步行 15 分钟，视野开阔；雨后须确认坡道不滑。']];
  return `<div class="activity"><h3>${rt('地点比较板')}</h3><p>${rt('点一个地方，查看记录。')}</p><div class="nav">${rows.map((row,i)=>button('v3Place',row[0],`data-index="${i}" aria-pressed="${state.place===i}"`)).join('')}</div>${state.place===null?'':`<p data-v3-place>${rt(rows[state.place][1])}</p>`}</div>`;
 }
 if(state.day===8){
  const rows=['甲：20 分钟，云量 2，看到 4 颗。','乙：20 分钟，云量 7，看到 2 颗。','丙：10 分钟，云量 2，看到 2 颗。'];
  return `<div class="activity"><h3>${rt('观察卡对照')}</h3><p>${rt('最多选两张卡，并排比较。')}</p><div class="nav">${['甲卡','乙卡','丙卡'].map((label,i)=>button('v3Card',label,`data-index="${i}" aria-pressed="${state.cards.includes(i)}"`)).join('')}</div><div data-v3-cards>${state.cards.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;
 }
 if(state.day===9){
  const weights=[2,4,3],total=state.bags.reduce((n,i)=>n+weights[i],0),limit=state.question===3?6:5;
  return `<div class="activity"><h3>${rt('装车试一试')}</h3><div class="nav">${['A 袋 2 千克','B 袋 4 千克','C 袋 3 千克'].map((label,i)=>button('v3Bag',label,`data-index="${i}" aria-pressed="${state.bags.includes(i)}"`)).join('')}</div><p data-v3-weight>${rt('已选 '+state.bags.length+' 袋，总重 '+total+' 千克；本题限重 '+limit+' 千克。'+(total>limit?'超出 '+(total-limit)+' 千克。':''))}</p></div>`;
 }
 if(state.day===10){
  const plans=[[10,5,10,20],[5,10,15,20]],labels=['布置','检查','介绍','观察'];
  let text='';
  if(state.schedule!==null){let minute=0;const clock=m=>'7:'+String(m).padStart(2,'0');text=plans[state.schedule].map((n,i)=>{const start=minute;minute+=n;return `<p>${rt(labels[i]+'：'+clock(start)+' 到 '+clock(minute)+'。')}</p>`}).join('')}
  return `<div class="activity"><h3>${rt('时间线拼板')}</h3><p>${rt('选择一套计划，查看各阶段时间。')}</p><div class="nav">${['甲方案','乙方案'].map((label,i)=>button('v3Schedule',label,`data-index="${i}" aria-pressed="${state.schedule===i}"`)).join('')}</div><div data-v3-schedule>${text}</div></div>`;
 }
 if(state.day===11){
  const graph={S:['A','B'],A:['C','D'],B:['C'],C:['T'],D:['T'],T:[]};
  const blocked=state.question===0?'本题 C 点积水。':state.question===2?'本题 C、D 都不能经过。':state.question===3?'本题 A 到 C 的路关闭。':'本题列出的连接都可走。';
  return `<div class="activity"><h3>${rt('路线板')}</h3><p>${rt('连接：S 到 A 或 B；A 到 C 或 D；B 到 C；C、D 到 T。')}</p><p>${rt(blocked)}</p><p data-v3-route>${esc(state.path.join(' → '))}</p><div class="nav">${['A','B','C','D','T'].map(n=>button('v3Route',n,`data-node="${n}"`)).join('')}${button('v3UndoRoute','撤回一步')}${button('v3ResetRoute','重新开始')}</div></div>`;
 }
 if(state.day===12){
  const status=state.lightning==='yes'?'出现闪电，暂停户外观察。':state.lightning==='no'&&state.ground==='safe'?'两项条件已满足，可以按安全卡开始。':'还有条件未确认，先等一等。';
  return `<div class="activity"><h3>${rt('安全卡试验')}</h3><p>${rt('先分别选择闪电和路面状态。')}</p><div class="nav">${button('v3Light','没有闪电','data-value="no"')}${button('v3Light','出现闪电','data-value="yes"')}${button('v3Ground','大人确认不滑','data-value="safe"')}${button('v3Ground','路面未确认','data-value="unknown"')}</div><p data-v3-safety>${rt(status)}</p></div>`;
 }
 if(state.day===13){
  const back=state.tripReturn??(state.question===1?20:state.question===3?5:10),finish=state.observe===null?null:state.observe+back;
  return `<div class="activity"><h3>${rt('观星和返程计划卡')}</h3><p>${rt('选择观察和返程时长。')}</p><div class="nav">${[15,25,35].map(n=>button('v3Observe','观察 '+n+' 分钟',`data-value="${n}" aria-pressed="${state.observe===n}"`)).join('')}</div><div class="nav">${[5,10,20].map(n=>button('v3Return','返程 '+n+' 分钟',`data-value="${n}" aria-pressed="${back===n}"`)).join('')}</div><p data-v3-trip>${rt(finish===null?'先选择观察时间。':'从 8 点开始，预计 8 点 '+finish+' 分回到集合点。')}</p></div>`;
 }
 return '';
}
function v3Handle(a,b,i){
 if(!a.startsWith('v3'))return false;
 const record=currentRecord();state.explorationEver=true;record.help.push({type:'explore',activity:a});
 if(a==='v3Place')state.place=i;
 else if(a==='v3Card')state.cards=state.cards.includes(i)?state.cards.filter(x=>x!==i):[...state.cards,i].slice(-2);
 else if(a==='v3Bag')state.bags=state.bags.includes(i)?state.bags.filter(x=>x!==i):[...state.bags,i];
 else if(a==='v3Schedule')state.schedule=i;
 else if(a==='v3Route'){
  const graph={S:['A','B'],A:['C','D'],B:['C'],C:['T'],D:['T'],T:[]},from=state.path.at(-1),to=b.dataset.node;
  const nodeBlocked=(state.question===0&&to==='C')||(state.question===2&&(to==='C'||to==='D'));
  const edgeBlocked=state.question===3&&from==='A'&&to==='C';
  if(!graph[from]?.includes(to)||nodeBlocked||edgeBlocked)state.message='这一步不能走，试试其他连接。';
  else state.path.push(to);
 }
 else if(a==='v3UndoRoute'){if(state.path.length>1)state.path.pop()}
 else if(a==='v3ResetRoute')state.path=['S'];
 else if(a==='v3Light')state.lightning=b.dataset.value;
 else if(a==='v3Ground')state.ground=b.dataset.value;
 else if(a==='v3Observe')state.observe=Number(b.dataset.value);
 else if(a==='v3Return')state.tripReturn=Number(b.dataset.value);
 return true;
}
function resetV3(){resetWeek3();resetWeek4();resetWeek5();resetWeek6();state.place=null;state.cards=[];state.schedule=null;state.path=['S'];state.lightning=null;state.ground=null;state.observe=null;state.tripReturn=null;}

// Exploration is recorded as help; comparison and plan inputs are first-class tasks.
function resetWeek6(){state.week6={point:null,cards:[],records:[],setup:[],outlier:null,sequence:[],editor:[null,null,null]};}
function week6Cards(){return [['甲卡','灯距 30 厘米，屏距 20 厘米。'],['乙卡','灯距 40 厘米，屏距 20 厘米。'],['丙卡','灯距 40 厘米，屏距 30 厘米。'],['丁卡','灯距 30 厘米，屏距 30 厘米。']].slice(0,state.question===3?4:3);}
function week6Activity(){
 const s=state.week6;
 if(state.day===35){const rows=[['甲棒',state.question===3?5:4,9],['乙棒',6,10]],r=s.point===null?null:rows[s.point];return `<div class="activity"><h3>${rt('影长对照板')}</h3><p>${rt('选择一根棒，比较开始和结束的影长。')}</p><div class="nav">${rows.map((x,i)=>button('w6Point',x[0],`data-index="${i}" aria-pressed="${s.point===i}"`)).join('')}</div><p data-w6-point>${r?rt(r[0]+'：开始 '+r[1]+' 厘米，结束 '+r[2]+' 厘米；增加 '+(r[2]-r[1])+' 厘米。'):''}</p></div>`;}
 if(state.day===36){const rows=week6Cards();return `<div class="activity"><h3>${rt('实验卡对照')}</h3><p>${rt('选择两张卡并排查看；再次点击可撤回。')}</p><div class="options">${rows.map((x,i)=>`<div class="choice-row">${button('w6Card',x[0],`data-index="${i}" aria-pressed="${s.cards.includes(i)}"`,'choice')}${button('w6SpeakCard','听',`data-index="${i}" aria-label="听${x[0]}"`,'speak')}</div>`).join('')}</div><div data-w6-cards>${s.cards.map(i=>`<p>${rt(rows[i][0]+'：'+rows[i][1])}</p>`).join('')}</div></div>`;}
 if(state.day===37){const rows=['甲：8 厘米。','乙：空白，含义尚未核实。','丙：10 厘米。'];return `<div class="activity"><h3>${rt('实验记录表')}</h3><p>${rt('点选要查看的记录；未知值不会自动填补。')}</p><div class="nav">${['甲','乙','丙'].map((x,i)=>button('w6Record',x,`data-index="${i}" aria-pressed="${s.records.includes(i)}"`)).join('')}</div><div data-w6-records>${s.records.map(i=>`<p>${rt(rows[i])}</p>`).join('')}</div></div>`;}
 if(state.day===38){const items=['纸片','灯','位置','屏幕'];return `<div class="activity"><h3>${rt('实验搭建板')}</h3><p>${rt('选择要核对的条件；选择不自动判分。')}</p><div class="nav">${items.map((x,i)=>button('w6Setup',x,`data-index="${i}" aria-pressed="${s.setup.includes(i)}"`)).join('')}</div><p data-w6-setup>${rt('已选：'+(s.setup.map(i=>items[i]).join('、')||'无'))}</p></div>`;}
 if(state.day===39){const rows=[10,10,11,4];return `<div class="activity"><h3>${rt('测量记录卡')}</h3><p>${rt('点选一次记录，标记想核查的数；原始记录保留。')}</p><div class="nav">${rows.map((x,i)=>button('w6Outlier','第 '+(i+1)+' 次：'+x+' 厘米',`data-index="${i}" aria-pressed="${s.outlier===i}"`)).join('')}</div><p data-w6-outlier>${rt(s.outlier===null?'尚未标记。':'标记第 '+(s.outlier+1)+' 次；是否有误还需核查。')}</p></div>`;}
 if(state.day===40){const seq=s.sequence.map(x=>x==='A'?'甲':'乙');return `<div class="activity"><h3>${rt('四次实验计划')}</h3><p>${rt('依次点甲或乙安排四次试验；可以撤回。')}</p><div class="nav">${button('w6Sequence','甲','data-value="A"')}${button('w6Sequence','乙','data-value="B"')}${button('w6Undo','撤回一次')}${button('w6Clear','重新开始')}${button('w6SpeakPlan','听计划说明')}</div><p data-w6-sequence>${rt(seq.length?seq.join(' → '):'还没有安排试验。')}</p></div>`;}
 if(state.day===41){const rows=['本次甲、乙分别记录 6 和 9 厘米','灯距可能影响影长','重复试验并记录条件'],kinds=['本次记录','猜测','下一步'];return `<div class="activity"><h3>${rt('实验展签')}</h3><p>${rt('给每条内容选择一个标记，可以修改。')}</p>${rows.map((x,i)=>`<div class="choice-row"><p>${rt(x)}</p>${button('w6Editor',s.editor[i]===null?'选择标记':kinds[s.editor[i]],`data-index="${i}"`)}</div>`).join('')}<p>${rt('标记用于整理，不自动判分。')}</p></div>`;}
 return '';
}
function week6Handle(a,b,i){
 if(!a.startsWith('w6'))return false;
 if(a==='w6SpeakCard'){const row=week6Cards()[i];if(row)say(row[0]+'：'+row[1],'option');return true}
 if(a==='w6SpeakPlan'){say('依次点甲或乙安排四次试验；可以撤回。','support');return true}
 const s=state.week6,primaryInput=state.question===0&&((state.day===36&&a==='w6Card')||(state.day===40&&['w6Sequence','w6Undo','w6Clear'].includes(a)));
 if(!primaryInput){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a})}
 if(a==='w6Point')s.point=i;
 else if(a==='w6Card')s.cards=s.cards.includes(i)?s.cards.filter(x=>x!==i):[...s.cards,i].slice(-2);
 else if(a==='w6Record')s.records=s.records.includes(i)?s.records.filter(x=>x!==i):[...s.records,i];
 else if(a==='w6Setup')s.setup=s.setup.includes(i)?s.setup.filter(x=>x!==i):[...s.setup,i];
 else if(a==='w6Outlier')s.outlier=i;
 else if(a==='w6Sequence'&&s.sequence.length<4&&['A','B'].includes(b.dataset.value))s.sequence.push(b.dataset.value);
 else if(a==='w6Undo')s.sequence.pop();
 else if(a==='w6Clear')s.sequence=[];
 else if(a==='w6Editor')s.editor[i]=s.editor[i]===null?0:(s.editor[i]+1)%3;
 return true;
}


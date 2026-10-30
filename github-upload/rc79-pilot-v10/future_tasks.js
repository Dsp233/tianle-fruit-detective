const futureTypes=['classification','strip','grid','mirror','allocation','manifest'];
function futureComplete(q,v){
 if(q.type==='strip')return Number.isInteger(v)&&v>=0&&v<=2;
 if(!Array.isArray(v))return false;
 if(q.type==='grid'||q.type==='mirror')return v.length>0&&new Set(v).size===v.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.grid.rows*q.grid.cols);
 return v.length===3&&v.every(n=>Number.isInteger(n)&&n>=0&&n<=(q.type==='classification'?2:q.type==='manifest'?2:q.allocation.total))&&(q.type!=='manifest'||v.every(n=>n>=1));
}
function futureCorrect(q,v){
 if(!futureComplete(q,v))return false;
 if(q.type==='classification')return JSON.stringify(v)===JSON.stringify(q.answer);
 if(q.type==='strip')return 3+4-v===6;
 if(q.type==='allocation')return v.reduce((a,b)=>a+b,0)===q.allocation.total&&v.every((n,i)=>n>=q.allocation.minimum[i]);
 if(q.type==='manifest'){const m=q.manifest;return m.firstRequired.every(i=>v[i]===1)&&[1,2].every(t=>v.filter(x=>x===t).length<=m.maxItems&&m.weights.reduce((s,w,i)=>s+(v[i]===t?w:0),0)<=m.capacity);}
 if(q.type==='mirror')return JSON.stringify([...v].sort((a,b)=>a-b))===JSON.stringify(q.grid.fixed.map(i=>Math.floor(i/q.grid.cols)*q.grid.cols+q.grid.cols-1-i%q.grid.cols).sort((a,b)=>a-b));
 const g=q.grid;if(v.some(i=>(g.blocked||[]).includes(i))||v.length!==g.area)return false;
 const rows=v.map(i=>Math.floor(i/g.cols)),cols=v.map(i=>i%g.cols),h=Math.max(...rows)-Math.min(...rows)+1,w=Math.max(...cols)-Math.min(...cols)+1;
 return h*w===v.length&&2*(h+w)===g.perimeter;
}
function futureActivity(){const q=question(),v=state.selected;let html='';
 if(q.type==='classification')html=q.items.map((item,i)=>`<fieldset><legend>${rt(item)}</legend>${q.options.map((s,j)=>button('futureSet',s,`data-index="${i}" data-value="${j}" aria-pressed="${v?.[i]===j}"`,v?.[i]===j?'selected':'')).join('')}</fieldset>`).join('');
 else if(q.type==='strip'){const n=Number.isInteger(v)?v:0;html=`<p>${rt('每个刻度间隔 1 厘米。两条纸条沿同一直线拼接。')}</p><svg viewBox="0 0 360 100" role="img" aria-label="两条纸条及重叠位置"><rect x="20" y="15" width="120" height="25" fill="#48a"/><rect x="${140-n*40}" y="45" width="160" height="25" fill="#d93"/>${Array.from({length:8},(_,i)=>`<text x="${20+i*40}" y="94">${i}</text>`).join('')}</svg><p>${rt('重叠 '+n+' 厘米，整体 '+(7-n)+' 厘米。')}</p>${[0,1,2].map(n=>button('futureStrip','重叠 '+n+' 厘米',`data-index="${n}" aria-pressed="${v===n}"`)).join('')}`;}
 else if(q.type==='grid'||q.type==='mirror'){const g=q.grid;html=`<p>${rt(q.type==='grid'?'每格边长 1 厘米。点格子可以选中或取消。':'左边已固定，请点右边格子补图；粗竖线是对称轴。')}</p><div style="display:grid;grid-template-columns:repeat(${g.cols},minmax(44px,64px));gap:2px">${Array.from({length:g.rows*g.cols},(_,i)=>{const fixed=(g.fixed||[]).includes(i),blocked=(g.blocked||[]).includes(i),editable=q.type==='grid'?!blocked:g.editable.includes(i),selected=fixed||v?.includes(i);return `<button type="button" data-action="futureCell" data-index="${i}" aria-label="第 ${Math.floor(i/g.cols)+1} 行第 ${i%g.cols+1} 列" aria-pressed="${!!selected}" ${editable?'':'disabled'} style="aspect-ratio:1;height:auto;padding:0;min-height:44px;background:${blocked?'#444':selected?'#48a':'#fff'};${q.type==='mirror'&&i%g.cols===1?'border-right:4px solid #111':''}">${blocked?'×':fixed?'●':selected?'■':'□'}</button>`}).join('')}</div>`;}
 else if(q.type==='allocation'){const nums=v||[0,0,0];html=q.options.map((s,i)=>`<div>${rt(s)} ${button('futureAmount','减一',`data-index="${i}" data-value="-1"`)} <output>${nums[i]}</output> ${button('futureAmount','加一',`data-index="${i}" data-value="1"`)}</div>`).join('')+`<p>${rt('已分 '+nums.reduce((a,b)=>a+b,0)+' 枚，共有 '+q.allocation.total+' 枚。')}</p>`;}
 else if(q.type==='manifest')html=q.options.map((s,i)=>`<fieldset><legend>${rt(s)}</legend>${[1,2].map(t=>button('futureSet','第 '+t+' 趟',`data-index="${i}" data-value="${t}" aria-pressed="${v?.[i]===t}"`,v?.[i]===t?'selected':'')).join('')}</fieldset>`).join('');
 else return '';
 return `<div class="activity" data-future-board>${html}${button('futureReset','清空重做')}</div>`;
}
function futureHandle(a,b,i){if(!a.startsWith('future'))return false;const q=question();if(!futureTypes.includes(q.type))return false;
 if(a==='futureReset')state.selected=null;
 else if(a==='futureStrip')state.selected=i;
 else if(a==='futureSet'){const v=Array.isArray(state.selected)?[...state.selected]:[null,null,null];v[i]=Number(b.dataset.value);state.selected=v;}
 else if(a==='futureCell'){const v=Array.isArray(state.selected)?[...state.selected]:[];state.selected=v.includes(i)?v.filter(x=>x!==i):[...v,i];}
 else if(a==='futureAmount'){const v=Array.isArray(state.selected)?[...state.selected]:[0,0,0];v[i]=Math.max(0,Math.min(q.allocation.total,v[i]+Number(b.dataset.value)));state.selected=v;}
 return true;
}
if(typeof module!=='undefined')module.exports={futureComplete,futureCorrect};

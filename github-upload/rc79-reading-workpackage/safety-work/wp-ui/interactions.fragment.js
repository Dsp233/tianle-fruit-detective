 // Direct construction boards for the remaining pilot task types. Inputs are
 // drafts only; grading and complete-answer validation remain in the engine.
 const wpTypes=new Set(['pair','anypair','sequence','loop','rule','purchase','classification','strip','grid','mirror','allocation','manifest']);
 const wpSupports=q=>wpTypes.has(q?.type);
 function wpArray(v,n){return Array.isArray(v)&&v.length===n?[...v]:Array(n).fill(null);}
 function wpPack(v){const m=typeof v==='string'&&/^packs:(\d+),(\d+),(\d+)$/.exec(v);return m?m.slice(1).map(Number):[0,0,0];}
 function wpRule(v){const m=typeof v==='string'&&/^(blue|red)([&|])(square|circle)$/.exec(v);return m?{color:m[1],logic:m[2],shape:m[3]}:{color:'blue',logic:'|',shape:'square'};}
 function wpComplete(q,v){
  if(q.type==='pair'||q.type==='anypair')return Array.isArray(v)&&v.length===2&&new Set(v).size===2&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);
  if(q.type==='sequence')return typeof v==='string'&&/^[AB]{4}$/.test(v);
  if(q.type==='loop')return typeof v==='string'&&/^loop:[0-6]$/.test(v);
  if(q.type==='rule')return typeof v==='string'&&/^(blue|red)[&|](square|circle)$/.test(v);
  if(q.type==='purchase')return typeof v==='string'&&/^packs:[0-6],[0-6],[0-6]$/.test(v)&&v!=='packs:0,0,0';
  if(q.type==='strip')return Number.isInteger(v)&&v>=0&&v<=2;
  if(q.type==='grid'||q.type==='mirror')return Array.isArray(v)&&v.length>0&&new Set(v).size===v.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.grid.rows*q.grid.cols);
  if(q.type==='classification')return Array.isArray(v)&&v.length===q.items.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length);
  if(q.type==='manifest')return Array.isArray(v)&&v.length===q.options.length&&v.every(i=>i===1||i===2);
  if(q.type==='allocation')return Array.isArray(v)&&v.length===q.options.length&&v.every(i=>Number.isInteger(i)&&i>=0&&i<=q.allocation.total);
  return false;
 }
 function wpNext(q,v,action,d){
  const type=q.type,i=Number(d.index),value=Number(d.value);
  if(action==='rdWpReset'){
   if(['pair','anypair','grid','mirror'].includes(type))return [];
   if(type==='sequence')return '';
   if(type==='loop')return 'loop:0';
   if(type==='rule')return 'blue|square';
   if(type==='purchase')return 'packs:0,0,0';
   if(type==='classification')return Array(q.items.length).fill(null);
   if(type==='manifest')return Array(q.options.length).fill(null);
   if(type==='allocation')return Array(q.options.length).fill(0);
   return undefined;
  }
  if(action==='rdWpPair'&&['pair','anypair'].includes(type)&&Number.isInteger(i)&&i>=0&&i<q.options.length){const a=Array.isArray(v)?[...v]:[];return a.includes(i)?a.filter(x=>x!==i):a.length<2?[...a,i]:a;}
  if(action==='rdWpSeq'&&type==='sequence'&&['A','B'].includes(d.value)){const s=typeof v==='string'?v:'';return s.length<4?s+d.value:s;}
  if(action==='rdWpUndo'&&type==='sequence')return typeof v==='string'?v.slice(0,-1):'';
  if(action==='rdWpLoop'&&type==='loop'&&Number.isInteger(value)&&Math.abs(value)===1){const n=typeof v==='string'&&/^loop:[0-6]$/.test(v)?Number(v.slice(5)):0;return 'loop:'+Math.max(0,Math.min(6,n+value));}
  if(action==='rdWpRule'&&type==='rule'){const a=wpRule(v);if(d.part==='color'&&['blue','red'].includes(d.value))a.color=d.value;else if(d.part==='shape'&&['square','circle'].includes(d.value))a.shape=d.value;else if(d.part==='logic'&&['&','|'].includes(d.value))a.logic=d.value;else return undefined;return a.color+a.logic+a.shape;}
  if(action==='rdWpAcceptRule'&&type==='rule'){const a=wpRule(v);return a.color+a.logic+a.shape;}
  if(action==='rdWpPack'&&type==='purchase'&&Number.isInteger(i)&&i>=0&&i<3&&Number.isInteger(value)&&Math.abs(value)===1){const a=wpPack(v);a[i]=Math.max(0,Math.min(6,a[i]+value));return 'packs:'+a.join(',');}
  if(action==='rdWpClass'&&type==='classification'&&Number.isInteger(i)&&i>=0&&i<q.items.length&&Number.isInteger(value)&&value>=0&&value<q.options.length){const a=wpArray(v,q.items.length);a[i]=a[i]===value?null:value;return a;}
  if(action==='rdWpStrip'&&type==='strip'&&Number.isInteger(i)&&i>=0&&i<=2)return i;
  if(action==='rdWpCell'&&['grid','mirror'].includes(type)&&Number.isInteger(i)&&i>=0&&i<q.grid.rows*q.grid.cols){const g=q.grid,editable=type==='mirror'?(g.editable||[]).includes(i):!(g.blocked||[]).includes(i);if(!editable)return undefined;const a=Array.isArray(v)?[...v]:[];return a.includes(i)?a.filter(x=>x!==i):[...a,i];}
  if(action==='rdWpAmount'&&type==='allocation'&&Number.isInteger(i)&&i>=0&&i<q.options.length&&Number.isInteger(value)&&Math.abs(value)===1){const a=Array.isArray(v)&&v.length===q.options.length?[...v]:Array(q.options.length).fill(0);a[i]=Math.max(0,Math.min(q.allocation.total,a[i]+value));return a;}
  if(action==='rdWpTrip'&&type==='manifest'&&Number.isInteger(i)&&i>=0&&i<q.options.length&&(value===1||value===2)){const a=wpArray(v,q.options.length);a[i]=a[i]===value?null:value;return a;}
  return undefined;
 }
 function wpBoard(q,v){
  const t=q.type,reset=button('rdWpReset','清空重做');let content='';
  if(t==='pair'||t==='anypair'){
   const selected=Array.isArray(v)?v:[];
   content=`<p>${rt('选择两项；再次点击可以撤回。')}</p><div class="wp-options">${q.options.map((x,i)=>`<div class="rd-option-row">${button('rdWpPair',x,`data-index="${i}" aria-pressed="${selected.includes(i)}"`,selected.includes(i)?'rd-option rd-selected':'rd-option')}${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</div>`).join('')}</div>`;
  }else if(t==='sequence'){
   const s=typeof v==='string'?v:'';content=`<p>${rt('依次安排四次，可以撤回。')}</p><p aria-live="polite">${rt('我的安排')}：${s?Array.from(s).map(x=>rt(x==='A'?'甲':'乙')).join(' → '):rt('还没有安排')}</p><div class="rd-nav">${button('rdWpSeq','甲','data-value="A"')}${button('rdWpSeq','乙','data-value="B"')}${button('rdWpUndo','撤回一次',s?'':'disabled')}</div>`;
  }else if(t==='loop'){
   const n=typeof v==='string'&&/^loop:[0-6]$/.test(v)?Number(v.slice(5)):0;
   content=`<p>${rt('从 1 开始，每次加 3。自己判断什么时候停止。')}</p><p aria-live="polite">${rt('已经执行')} ${n} ${rt('次，请自己算出现在的数。')}</p><div class="rd-nav">${button('rdWpLoop','执行一次',`data-value="1" ${n>=6?'disabled':''}`)}${button('rdWpLoop','撤回一次',`data-value="-1" ${n<=0?'disabled':''}`)}</div>`;
  }else if(t==='rule'){
   const a=wpRule(v),groups=[['color',[['blue','蓝色'],['red','红色']]],['logic',[['&','并且'],['|','或者']]],['shape',[['square','方形'],['circle','圆形']]]];
   content=`<p>${rt('选择颜色、连接词和形状，再把规则与题目中的样例逐一比较。可以修改起始规则；点击下方按钮才能采用它。')}</p>${groups.map(([part,items])=>`<div class="rd-nav">${items.map(([key,label])=>button('rdWpRule',label,`data-part="${part}" data-value="${key}" aria-pressed="${a[part]===key}"`,a[part]===key?'rd-option rd-selected':'rd-option')).join('')}</div>`).join('')}<p>${rt('当前规则')}：${rt((a.color==='blue'?'蓝色':'红色')+(a.logic==='&'?'并且':'或者')+(a.shape==='square'?'方形':'圆形')+'才送出。')}</p>${button('rdWpAcceptRule','采用当前规则')}`;
  }else if(t==='purchase'){
   const a=wpPack(v);content=`<p>${rt('增减包装；自己核对张数和积分。')}</p>${q.options.map((x,i)=>`<div class="wp-row"><p>${rt(x)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</p><div class="rd-nav">${button('rdWpPack','少一份',`data-index="${i}" data-value="-1" ${a[i]===0?'disabled':''}`)}<output aria-label="${E(x+'已选份数')}">${a[i]}</output>${button('rdWpPack','多一份',`data-index="${i}" data-value="1" ${a[i]>=6?'disabled':''}`)}</div></div>`).join('')}`;
  }else if(t==='classification'){
   const a=wpArray(v,q.items.length);content=q.items.map((item,i)=>`<fieldset class="wp-row"><legend>${rt(item)} ${button('rdWpSpeakItem','听',`data-index="${i}" aria-label="${E('朗读第'+(i+1)+'条')}"`,'rd-option-speak')}</legend><div class="rd-nav">${q.options.map((x,j)=>button('rdWpClass',x,`data-index="${i}" data-value="${j}" aria-pressed="${a[i]===j}"`,a[i]===j?'rd-option rd-selected':'rd-option')).join('')}</div></fieldset>`).join('');
  }else if(t==='strip'){
   const n=Number.isInteger(v)?v:0;content=`<p>${rt('选择两条纸条重叠的长度；自己算拼接后的总长。')}</p><svg class="wp-strip" viewBox="0 0 360 100" role="img" aria-label="${E('两条纸条，当前重叠 '+n+' 厘米')}"><rect x="20" y="15" width="120" height="25" rx="4" fill="#4e91aa"></rect><rect x="${140-n*40}" y="45" width="160" height="25" rx="4" fill="#df9b46"></rect></svg><div class="rd-nav">${q.options.map((x,i)=>button('rdWpStrip',x,`data-index="${i}" aria-pressed="${v===i}"`,v===i?'rd-option rd-selected':'rd-option')).join('')}</div>`;
  }else if(t==='grid'||t==='mirror'){
   const g=q.grid,a=Array.isArray(v)?v:[],n=g.rows*g.cols;
   content=`<p>${rt(t==='grid'?'点格子选择或取消；深色格子不能使用。':'固定的格子不能修改；在右边补上对应的格子。')}</p><div class="wp-grid" role="group" aria-label="${E(t==='grid'?'方格拼图':'对称方格')}" style="grid-template-columns:repeat(${g.cols},minmax(44px,1fr))">${Array.from({length:n},(_,i)=>{const fixed=(g.fixed||[]).includes(i),blocked=(g.blocked||[]).includes(i),editable=t==='grid'?!blocked:(g.editable||[]).includes(i),selected=fixed||a.includes(i),label='第 '+(Math.floor(i/g.cols)+1)+' 行第 '+(i%g.cols+1)+' 列'+(fixed?'，已固定':blocked?'，不可用':'');return `<button type="button" class="wp-cell ${selected?'wp-cell-selected':''}" data-action="rdWpCell" data-index="${i}" aria-label="${E(label)}" aria-pressed="${selected}" ${editable?'':'disabled'}>${blocked?'×':fixed?'●':selected?'■':'□'}</button>`}).join('')}</div>`;
  }else if(t==='allocation'){
   const a=Array.isArray(v)&&v.length===q.options.length?v:Array(q.options.length).fill(0);
   content=`<p>${rt('分别调整各组数量；自己核对总数与每组要求。')}</p>${q.options.map((x,i)=>`<div class="wp-row"><p>${rt(x)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</p><div class="rd-nav">${button('rdWpAmount','减一',`data-index="${i}" data-value="-1" ${a[i]<=0?'disabled':''}`)}<output aria-label="${E(x+'数量')}">${a[i]}</output>${button('rdWpAmount','加一',`data-index="${i}" data-value="1" ${a[i]>=q.allocation.total?'disabled':''}`)}</div></div>`).join('')}`;
  }else if(t==='manifest'){
   const a=wpArray(v,q.options.length);content=`<p>${rt('每件物品选择一趟；自己检查每趟的限制。')}</p>${q.options.map((x,i)=>`<div class="wp-row"><p>${rt(x)} ${button('rdSpeakOption','听',`data-index="${i}" aria-label="${E('朗读'+x)}"`,'rd-option-speak')}</p><div class="wp-two">${[1,2].map(n=>button('rdWpTrip',n===1?'第一趟':'第二趟',`data-index="${i}" data-value="${n}" aria-pressed="${a[i]===n}"`,a[i]===n?'rd-option rd-selected':'rd-option')).join('')}</div></div>`).join('')}`;
  }
  return `<div class="wp-board" data-wp-type="${E(t)}">${content}${t==='strip'?'':`<div class="rd-nav">${reset}</div>`}</div>`;
 }

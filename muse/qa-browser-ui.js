'use strict';
function competitionState(){
 if(draft.work?.kind!=='competition-work')draft.work={kind:'competition-work',eliminated:[],notes:'',method:0,step:0,hintLevel:0,extensionInput:'',extensionResult:null};
 return draft.work;
}
function competitionRestoreWork(value){
 return {kind:'competition-work',eliminated:Array.isArray(value?.eliminated)?[...new Set(value.eliminated.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[],notes:typeof value?.notes==='string'?value.notes.slice(0,1200):'',method:Number.isInteger(value?.method)&&value.method>=0&&value.method<3?value.method:0,step:Number.isInteger(value?.step)&&value.step>=0&&value.step<12?value.step:0,hintLevel:Number.isInteger(value?.hintLevel)?Math.max(0,Math.min(2,value.hintLevel)):0,extensionInput:typeof value?.extensionInput==='string'?value.extensionInput.slice(0,40):'',extensionResult:null};
}
function competitionMainSnapshot(signature,value){
 try{const task=competitionCreate(value?.recipe);if(task.competition.signature!==signature||!Number.isFinite(value.at)||value.at<=0||!Number.isInteger(value.choice)||value.choice<0||value.choice>=5)return null;
 return {recipe:task.competition.recipe,choice:value.choice,at:value.at,order:Number.isSafeInteger(value.order)&&value.order>0?value.order:0,sessionId:typeof value.sessionId==='string'?value.sessionId.slice(0,100):'',hinted:value.hinted===true,priorSolutionViewed:value.priorSolutionViewed===true,independent:value.independent!==false,correct:value.choice===task.answer};}catch{return null}
}
function competitionExtensionSnapshot(signature,value){
 try{const task=competitionCreate(value?.recipe);if(competitionVariationSignature(task)!==signature||!Number.isFinite(value.at)||value.at<=0||typeof value.input!=='string'||value.input.length>40)return null;
 return {recipe:task.competition.recipe,input:value.input,at:value.at,correct:competitionValueEqual(value.input,task.competition.extension.answer)};}catch{return null}
}
function competitionUpdateMainHistory(state,a){
 const key=competitionHash(a.signature),h=state.views[key]??(state.views[key]={at:a.at,signature:a.signature,hinted:false,solutionViewed:false,attempted:false}),snapshot=competitionMainSnapshot(a.signature,a);if(!snapshot||h.signature!==a.signature)return;
 const ownAttempted=h.attempted;h.attempted=true;h.hinted=h.hinted||snapshot.hinted;h.solutionViewed=h.solutionViewed||snapshot.correct;
 if(!h.first&&(a.firstAttempt===true||a.firstCorrect===true||!ownAttempted&&a.equivalentRepeat===true))h.first={...snapshot,independent:a.firstAttempt===true||a.firstCorrect===true};
 if(snapshot.correct&&(!h.solved||snapshot.order>=h.solved.order))h.solved=snapshot;
 if(!h.last||snapshot.order>=h.last.order)h.last=snapshot;
 state.sequence=Math.max(state.sequence,snapshot.order);
 CompetitionIdentity.invalidate(state);
}
function competitionProgressCounts(state=saved.competition){
 return CompetitionIdentity.counts(state);
}
function competitionRestoreRecords(old){
 const state={version:1,sequence:0,attempts:[],views:{},extensions:[],extensionViews:{}};
 for(const [index,a] of (Array.isArray(old?.attempts)?old.attempts.slice(-500):[]).entries()){
  try{const task=competitionCreate(a.recipe);if(a.signature!==task.competition.signature||a.taskId!==task.id||a.contentVersion!==task.contentVersion||!Number.isFinite(a.at)||a.at<=0||!Number.isInteger(a.choice)||a.choice<0||a.choice>=5)continue;state.attempts.push({...a,order:Number.isSafeInteger(a.order)&&a.order>0?a.order:index+1,topicIds:[...task.competition.topicIds],correct:a.choice===task.answer,firstCorrect:a.firstCorrect===true&&a.choice===task.answer&&a.hinted!==true&&a.priorSolutionViewed!==true&&!state.attempts.some(prior=>prior.signature===a.signature),firstAttempt:a.firstAttempt===true&&!state.attempts.some(prior=>prior.signature===a.signature),priorSolutionViewed:a.priorSolutionViewed===true,hinted:a.hinted===true,notes:typeof a.notes==='string'?a.notes.slice(0,1200):''})}catch{}
 }
 for(const [key,h] of Object.entries(old?.views||{}))if(/^[A-F0-9]{8}$/.test(key)&&h&&Number.isFinite(h.at)&&h.at>0&&typeof h.signature==='string'&&h.signature.length<15000&&competitionHash(h.signature)===key){
  const restored=state.views[key]={at:h.at,signature:h.signature,hinted:h.hinted===true,solutionViewed:h.solutionViewed===true,attempted:h.attempted===true};
  if(Number.isFinite(h.hintedAt)&&h.hintedAt>0)restored.hintedAt=h.hintedAt;if(Number.isSafeInteger(h.hintOrder)&&h.hintOrder>0){restored.hintOrder=h.hintOrder;state.sequence=Math.max(state.sequence,h.hintOrder)}
  try{const t=competitionCreate(h.recipe);if(t.competition.signature===h.signature)restored.recipe=t.competition.recipe}catch{}
  for(const field of ['first','solved','last']){const snapshot=competitionMainSnapshot(h.signature,h[field]);if(snapshot&&(field!=='solved'||snapshot.correct)){restored[field]=snapshot;restored.attempted=true;restored.solutionViewed=restored.solutionViewed||snapshot.correct;state.sequence=Math.max(state.sequence,snapshot.order)}}
  if(!restored.solved&&restored.first?.correct)restored.solved=restored.first;
 }
 for(const a of state.attempts)competitionUpdateMainHistory(state,a);
 for(const a of state.attempts){const first=state.views[competitionHash(a.signature)]?.first;if(first){const same=a.choice===first.choice&&a.at===first.at&&a.order===first.order&&JSON.stringify(a.recipe)===JSON.stringify(first.recipe);a.firstAttempt=a.firstAttempt&&same;a.firstCorrect=a.firstCorrect&&same&&first.correct&&!first.hinted&&!first.priorSolutionViewed}}
 for(const [key,h] of Object.entries(old?.extensionViews||{}))if(/^[A-F0-9]{8}$/.test(key)&&h&&Number.isFinite(h.at)&&h.at>0&&typeof h.signature==='string'&&competitionHash(h.signature)===key){state.extensionViews[key]={at:h.at,order:Number.isSafeInteger(h.order)?h.order:0,signature:h.signature,attempted:h.attempted===true,firstIndependent:h.firstIndependent!==false,hinted:h.hinted===true,priorSolutionViewed:h.priorSolutionViewed===true};if(typeof h.firstInput==='string'&&h.firstInput.length<=40){try{const task=competitionCreate(h.recipe);if(competitionVariationSignature(task)===h.signature&&task.competition.signature===h.mainSignature)Object.assign(state.extensionViews[key],{recipe:task.competition.recipe,mainSignature:h.mainSignature,firstInput:h.firstInput.slice(0,40),firstCorrect:h.firstIndependent!==false&&h.hinted!==true&&h.priorSolutionViewed!==true&&competitionValueEqual(h.firstInput,task.competition.extension.answer)})}catch{}}const solved=competitionExtensionSnapshot(h.signature,h.solved);if(solved?.correct){state.extensionViews[key].solved=solved;state.extensionViews[key].attempted=true}else if(state.extensionViews[key].firstCorrect){state.extensionViews[key].solved=competitionExtensionSnapshot(h.signature,{recipe:h.recipe,input:h.firstInput,at:h.at})}}
 for(const a of Array.isArray(old?.extensions)?old.extensions.slice(-300):[]){try{const task=competitionCreate(a.recipe),signature=competitionVariationSignature(task);if(task.id!==a.taskId||task.competition.signature!==a.signature||!Number.isFinite(a.at)||a.at<=0||typeof a.input!=='string'||a.input.length>40||a.variationSignature&&a.variationSignature!==signature)continue;state.extensions.push({...a,variationSignature:signature,firstAttempt:a.firstAttempt===true&&!state.extensions.some(p=>p.variationSignature===signature),input:a.input.slice(0,40),correct:competitionValueEqual(a.input,task.competition.extension.answer)});const h=state.extensionViews[competitionHash(signature)]??(state.extensionViews[competitionHash(signature)]={at:a.at,signature,attempted:true});h.attempted=true;if(a.firstAttempt===true&&typeof h.firstInput!=='string')Object.assign(h,{recipe:task.competition.recipe,mainSignature:a.signature,firstInput:a.input.slice(0,40),firstCorrect:competitionValueEqual(a.input,task.competition.extension.answer)});const solved=competitionExtensionSnapshot(signature,{recipe:a.recipe,input:a.input.slice(0,40),at:a.at});if(solved?.correct)h.solved=solved;}catch{}}
 return state;
}
function competitionVariationSignature(task){return task.competition.extension.signature||JSON.stringify({main:task.competition.signature,variation:task.competition.extension.prompt})}
function competitionHistory(task){
 const c=task.competition,key=competitionHash(c.signature);if(!saved.competition.views[key]){saved.competition.views[key]={at:Date.now(),signature:c.signature,recipe:c.recipe,hinted:false,solutionViewed:false,attempted:false};CompetitionIdentity.invalidate(saved.competition)}return saved.competition.views[key];
}
function competitionSpeechText(value){
 const negative=s=>String(s).replace(/^[-−]/, '负');
 return String(value).replace(/(\d|\))\s*[-−]\s*(?=\d|\()/g,'$1减').replace(/(^|[=(×÷+])\s*[-−](?=\()/g,'$1负').replace(/([-−]?\d+(?:\.\d+)?)\s*\/\s*([-−]?\d+(?:\.\d+)?)/g,(_,n,d)=>negative(d)+'分之'+negative(n)).replace(/\((负?\d+(?:\.\d+)?分之负?\d+(?:\.\d+)?)\)/g,'$1').replace(/√(\d+(?:\.\d+)?)/g,'$1的平方根').replace(/(\d+)²/g,'$1的平方').replace(/(\d+)³/g,'$1的立方').replace(/([厘毫千]?米)²/g,'平方$1').replace(/([厘毫千]?米)³/g,'立方$1').replace(/(\d+(?:\.\d+)?)%/g,'百分之$1').replace(/(\d+(?:\.\d+)?)\s*[:：]\s*(?=\d)/g,'$1比').replace(/[-−](?=\d)/g,'负').replace(/×/g,'乘以').replace(/÷/g,'除以').replace(/\+/g,'加').replace(/≤/g,'小于或等于').replace(/≥/g,'大于或等于').replace(/−/g,'减').replace(/=/g,'等于').replace(/\(/g,'左括号').replace(/\)/g,'右括号').replace(/°/g,'度').replace(/□/g,'空格');
}
function competitionMaterialSpeech(diagram){
 if(!diagram)return '';
 if(diagram.kind==='bars')return '图中，'+diagram.values.map((v,i)=>diagram.names[i]+'柱高'+v+'格'+(diagram.known===i?'，标注'+diagram.knownValue+'人':'')).join('；')+'。';
 if(diagram.kind==='table')return '表格中，'+diagram.rows.map(row=>row.join('，')).join('；')+'。';
 return (diagram.labels||[]).join('；');
}
function competitionQuestionSpeech(task){
 const c=task.competition,material=/如图|如表/.test(task.prompt)?competitionMaterialSpeech(c.diagram):'';
 return competitionSpeechText(task.prompt+(material?' '+material:''));
}
function competitionDiagram(d){
 if(!d)return '';
 if(d.kind?.startsWith('scene-'))return competitionScene(d);
 if(d.kind?.startsWith('rule-'))return competitionRelationDiagram(d);
 const label=(x,y,text,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${esc(text)}</text>`;
 let art='',bottom='';const labels=d.labels||[];
 if(d.kind==='routes'){
  const px=x=>40+190*x/d.w,py=y=>110-80*y/d.h;
  for(let x=0;x<=d.w;x++)art+=`<path class="competition-grid-line" d="M${px(x)} 30 V110"/>`;
  for(let y=0;y<=d.h;y++)art+=`<path class="competition-grid-line" d="M40 ${py(y)} H230"/>`;
  art+=(d.firstUp?`<path stroke="#bc793c" stroke-width="4" d="M${px(0)} ${py(0)} V${py(1)}"/>`:`<circle class="competition-dot" cx="${px(d.x)}" cy="${py(d.y)}" r="4"/>`+label(px(d.x)+10,py(d.y)-8,'P'))+label(28,124,'A')+label(241,25,'B');
  bottom=label(140,145,`向右 ${d.w} 段，向上 ${d.h} 段`);
 }else if(d.kind==='fourAreas'){
  art='<rect class="competition-shape" x="44" y="22" width="196" height="98"/><path class="competition-line" d="M44 22 L145 67 L240 22 M44 120 L145 67 L240 120"/><circle class="competition-dot" cx="145" cy="67" r="3"/>'+label(156,68,'P')+label(143,40,String(d.top))+label(73,74,String(d.left))+label(212,74,String(d.right))+label(143,105,'?');
  bottom=label(142,143,'示意图，面积以标注为准');
 }else if(d.kind==='necklaceBlank'){
  art='<circle class="competition-grid-line" cx="142" cy="85" r="48"/>';
  for(let i=0;i<d.n;i++){const a=2*Math.PI*i/d.n-Math.PI/2;art+=`<circle class="competition-shape" cx="${142+48*Math.cos(a)}" cy="${85+48*Math.sin(a)}" r="7"/>`;if(d.fixed)art+=label(142+65*Math.cos(a),85+65*Math.sin(a)+5,i===0?'★1':i+1)}
  bottom=label(142,181,`${d.n} 个位置：${d.red} 红、${d.n-d.red} 蓝`);
 }else if(d.kind==='rectangleDiagonal'){
  art='<rect class="competition-shape" x="52" y="28" width="180" height="82"/><path class="competition-line" d="M52 110 L232 28"/>'+label(142,133,`长 ${d.w}`)+label(244,76,`宽 ${d.h}`);
 }else if(d.kind==='notch'){
  const cut=180*d.a/d.w,depth=82*d.depth/d.h,left=142-cut/2,right=142+cut/2;
  art=`<path class="competition-shape" d="M52 28 H${left} V${28+depth} H${right} V28 H232 V110 H52 Z"/>`+label(142,133,`长 ${d.w}`)+label(246,91,String(d.h))+label(142,18,`口宽 ${d.a}`)+label(right+17,33+depth/2,`深 ${d.depth}`);
 }else if(d.kind==='lShape'){
  const x=232-180*d.a/d.w,y=28+82*d.b/d.h;
  art=`<path class="competition-shape" d="M52 28 H${x} V${y} H232 V110 H52 Z"/><path class="competition-grid-line" d="M${x} 28 H232 V${y}"/>`+label(142,135,`长 ${d.w}`)+label(33,76,String(d.h))+label((x+232)/2,18,String(d.a))+label(247,26+82*d.b/d.h/2,String(d.b));
 }else if(d.kind==='cross'){
  const aw=180*d.a/d.w,bh=82*d.b/d.h;
  art=`<rect class="competition-shape" x="52" y="28" width="180" height="82"/><rect class="${d.intersectionOnly?'competition-shape':'competition-fill'}" x="${142-aw/2}" y="28" width="${aw}" height="82"/><rect class="${d.intersectionOnly?'competition-shape':'competition-fill'}" x="52" y="${69-bh/2}" width="180" height="${bh}"/>${d.intersectionOnly?`<rect class="competition-fill" x="${142-aw/2}" y="${69-bh/2}" width="${aw}" height="${bh}"/>`:''}`+label(142,135,`长 ${d.w}`)+label(246,79,String(d.h))+label(142,18,`条宽 ${d.a}`)+label(82,74,String(d.b));
 }else if(d.kind==='semicircle'){
  art='<path class="competition-shape" d="M78 100 A64 64 0 0 1 206 100 Z"/><path class="competition-line" d="M142 100 H206"/>'+label(171,122,`半径 ${d.radius}`);
 }else if(d.kind==='ring'){
  art=`<circle class="competition-shape" cx="142" cy="69" r="47"/><circle class="competition-shape" cx="142" cy="69" r="${47*d.r1/d.r2}"/>`+label(142,136,`半径 ${d.r1} 与 ${d.r2}`);
 }else if(d.kind==='parallelTriangle'){
  const q=d.k/d.n,y=24+86*q,x=142-80*q;
  art=`<path class="competition-shape" d="M142 24 L62 110 H222 Z"/><path class="competition-line" d="M${x} ${y} H${284-x}"/>`+label(142,137,`对应边长比 ${d.k}:${d.n}`);
 }else if(d.kind==='hypotenuseMidpoint'){
  const mx=d.legMidpoint?106:139;
  art='<path class="competition-shape" d="M106 110 V22 L172 110 Z"/><path class="competition-line" d="M106 99 H117 V110"/>'+(d.legMidpoint?'<path class="competition-line" d="M102 44 H110 M102 88 H110"/>':'<path class="competition-line" d="M119.5 46 L125.5 42 M152.5 90 L158.5 86"/>')+`<path class="competition-grid-line" stroke-dasharray="4 3" d="M106 110 L${mx} 66"/><circle class="competition-dot" cx="${mx}" cy="66" r="3"/>`+label(mx+15,67,'M')+label(121,94,'?')+label(139,132,String(3*d.k))+label(86,69,String(4*d.k));
 }else if(d.kind==='boxNet'){
  art='<rect class="competition-shape" x="98" y="25" width="84" height="84"/>';
  const cut=d.cut?84*d.cut/d.side:17;
  for(const x of [98,182-cut])for(const y of [25,109-cut])art+=`<rect class="competition-fill" x="${x}" y="${y}" width="${cut}" height="${cut}"/>`;
  art+=`<path class="competition-grid-line" stroke-dasharray="4 3" d="M${98+cut} ${25+cut} H${182-cut} V${109-cut} H${98+cut} Z"/>`+label(140,17,`纸边 ${d.side}`)+label(98+cut/2,25+cut/2+4,d.cut||'x')+label(140,128,`四角各剪 ${d.cut||'x'} × ${d.cut||'x'}`)+label(140,147,d.cut?'中央底面积 ?':'示意图，x 为待选长度');
 }else if(d.kind==='angleRatioTriangle'){
  art='<path class="competition-shape" d="M55 108 L113 31 L230 108 Z"/>'+label(38,111,`${d.ratios[0]}份`)+label(247,111,`${d.ratios[1]}份`)+label(113,18,`${d.ratios[2]}份`)+label(142,144,'示意图，角度按标注比例');
 }else if(d.kind==='truncatedBars'){
  const scale=80/d.b;
  art='<path class="competition-line" d="M54 22 V110 H240"/>';
  const tickEvery=Math.max(1,Math.ceil(d.b/4));
  for(let i=0;i<=d.b;i++){art+=`<path class="competition-grid-line" d="M54 ${110-i*scale} H240"/>`;if(i===0||i===d.b||i%tickEvery===0&&i<=d.b-tickEvery)art+=label(47,114-i*scale,String(d.base+i*d.step),'end')}
  art+=`<rect class="competition-fill" x="90" y="${110-d.a*scale}" width="37" height="${d.a*scale}"/><rect class="competition-fill" x="173" y="30" width="37" height="80"/>`+label(108,132,'甲')+label(192,132,'乙');
 }else if(d.kind==='checker'){
  const size=Math.min(190/d.w,106/d.h),ox=(285-size*d.w)/2,oy=10;
  for(let y=0;y<d.h;y++)for(let x=0;x<d.w;x++){
   const removed=x===0&&y===0||x===d.w-1&&y===(d.removeTop?0:d.h-1);
   art+=`<rect class="${removed?'competition-grid-line':(x+y)%2===0?'competition-dot':'competition-shape'}" x="${ox+x*size}" y="${oy+y*size}" width="${size}" height="${size}"/>`;
   if(removed)art+=`<path class="competition-line" d="M${ox+x*size+2} ${oy+y*size+2} l${size-4} ${size-4} m0 ${4-size} l${4-size} ${size-4}"/>`;
  }
  bottom=label(142,139,`${d.w} 列 × ${d.h} 行，${d.removeTop?'同一行两角':'对角'}去掉`);
 }else if(d.kind==='squareBorder'){
  art='<rect class="competition-fill" x="80" y="12" width="116" height="116"/><rect class="competition-shape" x="94" y="26" width="88" height="88"/>'+label(138,75,`${d.n} × ${d.n}`);bottom=label(138,146,'新增外面一圈');
 }else if(d.kind==='overlapSquares'){
  const scale=Math.min(190/(d.n+d.dx),100/(d.n+d.dy)),side=d.n*scale,ox=40,oy=122,dx=d.dx*scale,dy=d.dy*scale;
  art=`<rect class="${d.exclusive?'competition-fill':'competition-shape'}" x="${ox}" y="${oy-side}" width="${side}" height="${side}"/><rect class="${d.exclusive?'competition-fill':'competition-shape'}" x="${ox+dx}" y="${oy-side-dy}" width="${side}" height="${side}"/><rect class="${d.exclusive?'competition-shape':'competition-fill'}" x="${ox+dx}" y="${oy-side}" width="${side-dx}" height="${side-dy}"/>`;
  bottom=label(144,146,`边长 ${d.n}，右移 ${d.dx}，上移 ${d.dy}`);
 }else if(d.kind==='isoscelesExterior'){
  art='<path class="competition-shape" d="M67 108 L142 25 L217 108 Z"/><path class="competition-line" d="M217 108 L246 140"/>'+label(142,50,d.apex+'°')+label(237,105,d.target==='other-base'?(90+d.apex/2)+'°':'?')+(d.target==='other-base'?label(77,104,'?'):'');bottom=label(132,142,'两条腰相等');
 }else if(d.kind==='circleRoute'){
  art='<circle class="competition-shape" cx="142" cy="70" r="46"/>';
  for(let i=0;i<d.sectors;i++){const angle=-Math.PI/2+2*Math.PI*i/d.sectors,x=142+46*Math.cos(angle),y=70+46*Math.sin(angle);art+=`<circle class="competition-dot" cx="${x}" cy="${y}" r="2.5"/>`;if(i===0||i===d.steps)art+=label(142+61*Math.cos(angle),70+61*Math.sin(angle)+5,i===0?'A':'B')}
  bottom=label(142,145,`${d.sectors} 段等长弧`);
 }else if(d.kind==='foldHoles'){
  art='<rect class="competition-shape" x="95" y="22" width="90" height="90"/><path class="competition-line" d="M95 22 H185 M95 22 V112"/>';
  for(let i=0;i<d.interior;i++)art+=`<circle class="competition-dot" cx="${125+(i%2)*32}" cy="${52+Math.floor(i/2)*32}" r="4"/>`;
  for(let i=0;i<d.edge;i++)art+=`<circle class="competition-dot" cx="95" cy="${40+i*18}" r="4"/>`;
  if(d.center)art+='<circle class="competition-dot" cx="95" cy="22" r="4"/>';
  art+=label(142,15,'上边、左边是折痕');bottom=label(142,139,'折成四层后的示意图');
 }else if(d.kind==='bars'){
  const max=Math.max(...d.values),scale=84/max;
  art='<path class="competition-line" d="M40 20 V112 H257"/>';
  for(let i=0;i<=max;i++)art+=`<path class="competition-grid-line" d="M40 ${112-i*scale} H254"/>`+label(32,116-i*scale,String(i),'end');
  d.values.forEach((v,i)=>{art+=`<rect class="competition-fill" x="${65+i*63}" y="${112-v*scale}" width="35" height="${v*scale}"/>`+label(82+i*63,132,d.names[i]);if(d.known===i)art+=label(82+i*63,105-v*scale,d.knownValue+' 人')});
 }else if(d.kind==='garden'){
  const w=d.width,h=d.height,cw=d.cutWidth??0,ch=d.cutHeight??0;
  art=`<rect class="competition-shape" x="42" y="24" width="180" height="82"/>${cw?`<rect class="competition-fill" x="42" y="${106-82*ch/h}" width="${180*cw/w}" height="${82*ch/h}"/>`:''}`+label(132,17,`长 ${w}`)+label(232,70,`宽 ${h}`,'start');
  if(cw&&!(cw===w/2&&ch===h))bottom=label(132,137,`花区 ${cw} × ${ch}`);
 }else if(['rectangle','cut'].includes(d.kind)){
  art='<rect class="competition-shape" x="70" y="30" width="130" height="70"/>'+(d.kind==='cut'?'<rect class="competition-fill" x="70" y="82" width="130" height="18"/>':'')+label(135,22,labels[0])+label(215,70,labels[1],'start');bottom=label(135,133,labels[2]||'示意图');
 }else if(['triangle','right'].includes(d.kind)){
  art='<path class="competition-shape" d="M70 105 L70 28 L202 105 Z"/>'+(d.kind==='right'?'<path class="competition-line" d="M70 92 L83 92 L83 105"/>':'')+label(63,70,labels[0]||'','end')+label(135,125,labels[1]||'')+label(150,53,labels[2]||'');bottom=labels[3]?label(215,132,labels[3]):'';
 }else if(d.kind==='similar'){
  art='<path class="competition-shape" d="M30 85 L30 47 L92 85 Z M143 100 L143 24 L267 100 Z"/>'+label(48,104,labels[0])+label(195,120,labels[1])+label(66,53,labels[2])+label(202,52,labels[3]);
 }else if(d.kind==='circle'){
  art='<circle class="competition-shape" cx="135" cy="66" r="43"/><path class="competition-line" d="M135 66 H178"/>'+label(135,129,labels[0]);
 }else if(d.kind==='cuboid'){
  art='<path class="competition-shape" d="M91 27 L161 27 L193 10 L123 10 Z M91 27 V77 H161 V27 M161 77 L193 60 V10"/>'+label(142,98,labels[0])+label(142,121,labels[1])+label(142,145,labels[2]);
 }else if(d.kind==='coordinate'){
  const maxX=d.x+d.dx+1,maxY=d.y+d.dy+1,px=x=>35+205*x/maxX,py=y=>110-90*y/maxY;
  art='<path class="competition-line" d="M35 14 V110 H252"/>';
  for(let x=0;x<=maxX;x++)art+=`<path class="competition-grid-line" d="M${px(x)} 20 V110"/>`;
  for(let y=0;y<=maxY;y++)art+=`<path class="competition-grid-line" d="M35 ${py(y)} H240"/>`;
  art+=`<path class="competition-line" d="M${px(d.x)} ${py(d.y)} L${px(d.x+d.dx)} ${py(d.y+d.dy)}"/><circle class="competition-dot" cx="${px(d.x)}" cy="${py(d.y)}" r="4"/><circle class="competition-dot" cx="${px(d.x+d.dx)}" cy="${py(d.y+d.dy)}" r="4"/>`+label(px(d.x),py(d.y)+17,'A')+label(px(d.x+d.dx)-6,py(d.y+d.dy)-6,'B')+label(247,130,'x')+label(18,18,'y');
 }else if(d.kind==='sets'){
  art='<ellipse class="competition-shape" cx="111" cy="60" rx="49" ry="37"/><ellipse class="competition-shape" cx="168" cy="60" rx="49" ry="37"/>'+label(83,64,labels[0])+label(195,64,labels[1]);bottom=label(135,125,labels[2]);
 }else if(['strip','ratio'].includes(d.kind)){
  const parts=d.parts||4;
  for(let i=0;i<parts;i++)art+=`<rect class="${i<(d.filled??1)?'competition-fill':'competition-shape'}" x="${35+210*i/parts}" y="38" width="${210/parts}" height="38"/>`;
  art+=label(140,24,labels[0]);bottom=label(140,112,labels[1]);
 }else if(d.kind==='mirror'){
  art='<path class="competition-grid-line" d="M135 15 V103"/><path class="competition-shape" d="M65 50 L73 34 L81 50 L98 53 L85 67 L89 84 L73 76 L57 84 L61 67 L48 53 Z M205 50 L197 34 L189 50 L172 53 L185 67 L181 84 L197 76 L213 84 L209 67 L222 53 Z"/>'+label(67,124,labels[0])+label(205,124,labels[2]);
 }else if(d.kind==='chart'){
  art='<path class="competition-line" d="M60 15 V111 H215"/><rect class="competition-shape" x="111" y="24" width="48" height="87"/>';
  for(let i=0;i<5;i++)art+=`<path class="competition-grid-line" d="M56 ${111-21*i} H215"/>`+label(46,115-21*i,String(i*(d.step||1)),'end');
  art+='<path class="competition-line" d="M110 34 L160 45 M110 45 L160 56"/>'+label(174,23,'n 格');bottom=label(135,136,`每格 ${d.step} 张（省略中段）`);
 }else if(d.kind==='table'){
  return `<div class="competition-material-table"><table><tbody>${d.rows.map(row=>`<tr>${row.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 }else if(d.kind==='balls'&&Number.isInteger(d.red)){
  for(let i=0;i<d.red+d.blue;i++)art+=`<circle class="${i<d.red?'competition-fill':'competition-shape'}" cx="${47+(i%8)*26}" cy="${35+Math.floor(i/8)*31}" r="10"/>`;
  bottom=label(140,131,labels.join(' · '));
 }else{
  art=labels.map((v,i)=>label(140,28+i*31,v)).join('');
 }
 const description=labels.length?labels.join('，'):d.kind==='garden'?`长 ${d.width}，宽 ${d.height}，${d.cutWidth?'角落花区长 '+d.cutWidth+'，宽 '+d.cutHeight:'长方形地面'}`:d.kind==='coordinate'?'点 A 和 B 的坐标图':d.kind==='hypotenuseMidpoint'?`直角边长 ${3*d.k} 与 ${4*d.k}，M为${d.legMidpoint?'较长直角边':'斜边'}中点，虚线是所求距离`:d.kind==='boxNet'?`边长 ${d.side} 的正方形纸，四角各剪去边长${d.cut||'x'}的小正方形，虚线为折叠位置${d.cut?'':'，x是待选长度'}`:d.kind==='angleRatioTriangle'?`三个内角按顶点标注比例 ${d.ratios.join(':')}，示意图不按角度比例绘制`:d.kind==='truncatedBars'?`纵轴从 ${d.base} 人起，每个小格 ${d.step} 人，甲高 ${d.a} 格，乙高 ${d.b} 格`:'题目中的数学示意图';
 const schematic=['rectangleDiagonal','notch','lShape','cross','parallelTriangle','fourAreas','isoscelesExterior','angleRatioTriangle'].includes(d.kind);
 return `<figure class="competition-geometry"><svg class="competition-diagram" viewBox="0 0 285 ${d.kind==='necklaceBlank'?190:150}" role="img" aria-label="${esc(description)}">${art}${bottom}</svg>${d.caption||schematic?`<figcaption>${esc(d.caption||'')}${schematic?' 示意图，尺寸或角度以标注为准。':''}</figcaption>`:''}</figure>`;
}
function competitionRelationDiagram(d){
 const title=d.title||'数量关系';
 if(d.kind==='rule-table'||d.kind==='rule-candidates')return `<figure class="rule-figure"><figcaption>${esc(title)}</figcaption><div class="rule-table-scroll"><table aria-label="${esc(title)}">${d.headers?`<thead><tr>${d.headers.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead>`:''}<tbody>${(d.rows||[]).map(row=>`<tr>${row.map((x,i)=>i===0?`<th scope="row">${esc(x)}</th>`:`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></figure>`;
 if(d.kind==='rule-bars'){
  const max=Math.max(1,...d.rows.map(row=>row.parts.reduce((s,p)=>s+Math.max(0,p.size),0)));
  return `<figure class="rule-figure"><figcaption>${esc(title)}</figcaption>${d.rows.map(row=>`<div class="rule-bar-row"><b>${esc(row.label)}</b><div class="rule-bar-track" aria-hidden="true">${row.parts.map(p=>`<span class="rule-bar ${p.role==='change'?'rule-change':''}" style="width:${Math.max(0,p.size)/max*100}%"></span>`).join('')}</div><p>${row.parts.map(p=>esc(p.caption)).join(' ＋ ')}</p></div>`).join('')}</figure>`;
 }
 if(d.kind==='rule-links'){
  const n=d.n,px=i=>32+296*i/(n-1);let art='';
  for(let i=0;i<n;i++){art+=`<rect x="${px(i)-14}" y="30" width="28" height="28" rx="5"/><text x="${px(i)}" y="48" text-anchor="middle">${i+1}</text>`;if(i<n-1){const mid=(px(i)+px(i+1))/2;art+=`<path d="M${px(i)+14} 44 H${px(i+1)-14}"/><rect class="rule-joint" x="${mid-4}" y="40" width="8" height="8"/>`}}
  if(d.closed)art+='<path d="M328 58 V92 H32 V58"/><rect class="rule-joint" x="176" y="88" width="8" height="8"/>';
  return `<figure class="rule-figure"><svg class="rule-svg" viewBox="0 0 360 115" role="img" aria-label="${n}段${d.closed?'首尾相接':'排成长条'}的连接示意">${art}</svg><figcaption>${esc(d.caption)} 图只表示连接关系。</figcaption></figure>`;
 }
 if(d.kind==='rule-border'){
  const outer=d.n+2,size=120/outer;let art='';for(let y=0;y<outer;y++)for(let x=0;x<outer;x++){const border=x===0||y===0||x===outer-1||y===outer-1,topBottom=y===0||y===outer-1;art+=`<rect class="${border?'rule-new-cell':'rule-old-cell'}" ${d.focus==='sides'&&topBottom?'style="fill:var(--blue)"':''} opacity="${['added','sides'].includes(d.focus)&&!border?0.22:1}" x="${72+x*size}" y="${8+y*size}" width="${size}" height="${size}"/>`}
  return `<figure class="rule-figure"><svg class="rule-svg" viewBox="0 0 265 146" role="img" aria-label="原有${d.n}乘${d.n}方阵，周围新增一圈">${art}<text x="132" y="142" text-anchor="middle">中间：原有 ${d.n} × ${d.n}；外圈：新增</text></svg><figcaption>${esc(d.title)}</figcaption></figure>`;
 }
 return '';
}
function competitionHintPanel(c,state,history){
 if(!history.hinted)return '';const level=Math.max(1,Math.min(c.hints.length,state.hintLevel||1));
 return `<div class="competition-hint">${c.hints.slice(0,level).map(t=>`<p role="status">${esc(t)}</p>`).join('')}${level>1?competitionDiagram(c.hintDiagram):''}<div class="competition-hint-controls"><button class="secondary" data-action="competitionReadHint" aria-label="朗读当前提示">🔊 听提示</button><button class="secondary" data-action="competitionStopSpeech">停止朗读</button>${level<c.hints.length?'<button class="secondary" data-action="competitionHintMore">再给一个方向</button>':''}</div></div>`;
}
function competitionStopCurrentSpeech(){speechSequence++;if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}speechMessage=''}
function competitionClues(task){const c=task.competition;return c.clues?`<div class="competition-clues">${c.clues.map((clue,i)=>`<section class="competition-clue"><div class="competition-clue-label">条件 ${i+1} · ${esc(topicNames([clue.topicId]))}<button class="read-mini" data-action="competitionReadClue" data-index="${i}" aria-label="朗读条件 ${i+1}">🔊</button></div><p>${esc(clue.text)}</p>${competitionDiagram(clue.diagram)}</section>`).join('')}</div>`:competitionDiagram(c.diagram)}
function competitionSolutions(task){
 const c=task.competition,state=competitionState();if(!c.methods[state.method])state.method=0;const method=c.methods[state.method];state.step=Math.max(0,Math.min(state.step||0,method.steps.length-1));
 const table=state.method===1&&c.verification?`<div class="competition-material-table"><table aria-label="每个选项代入全部条件"><thead><tr><th>号码</th>${c.clues.map((_,i)=>`<th>条件 ${i+1}</th>`).join('')}</tr></thead><tbody>${c.verification.map(row=>`<tr><td>${row.number}</td>${row.checks.map(check=>`<td>${esc(check.value)} ${check.ok?'✓':'×'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
 return `<section class="competition-solutions"><h2>${c.methods.length>1?'比较解题路线':'看看解题思路'}</h2><div class="competition-methods">${c.methods.map((m,i)=>`<button class="secondary" data-action="competitionMethod" data-index="${i}" aria-pressed="${state.method===i}">${esc(m.name)}</button>`).join('')}</div>${competitionDiagram(method.frames?.[state.step])}<ol>${method.steps.map((text,i)=>`<li class="${method.frames&&state.step===i?'rule-active-step':''}">${method.frames?`<button class="rule-step secondary" data-action="competitionStep" data-index="${i}" aria-pressed="${state.step===i}" aria-label="查看第 ${i+1} 步的关系图">看这一步</button> `:''}${esc(text)} <button class="read-mini" data-action="competitionReadStep" data-index="${i}" aria-label="朗读这一步">🔊</button></li>`).join('')}</ol>${table}<details class="competition-extension"${state.extensionResult?' open':''}><summary>条件变了，还能用原来的办法吗？</summary><p>${esc(c.extension.prompt)} <button class="read-mini" data-action="competitionReadExtension" aria-label="朗读变式">🔊</button></p>${competitionDiagram(c.extension.diagram)}<div class="competition-extension-input"><label>答案 <input data-competition-input="extension" inputmode="decimal" autocomplete="off" value="${esc(state.extensionInput)}" placeholder="整数、小数或分数"></label><button class="secondary" data-action="competitionExtensionCheck">检查变式</button></div>${state.extensionResult?.ok?competitionDiagram(c.extension.solutionFrames?.at(-1)):''}${state.extensionResult?`<p role="status">${state.extensionResult.ok?'✓ '+esc(c.extension.solution):'再核对改变的是哪条条件。'}</p>`:''}</details></section>`;
}
function competitionQuestionPage(){
 const session=topicSession(),item=topicCurrent(),task=playerTask();if(!session||!item||!task?.competition)return topicSelectionPage();
 const c=task.competition,state=competitionState(),history=competitionHistory(task);
 return `<section class="topic-question competition-question"><div class="page-head"><div><p class="kicker">第 ${session.cursor+1} / ${session.total} 题 · ${c.level?['','起步','进阶','挑战'][c.level]:'思路挑战'}</p><h1>${esc(c.title||topicNames(c.topicIds))}</h1>${item.passed?`<p class="competition-topic-label">本题用到：${esc(topicNames(c.topicIds))}</p>`:''}</div><button class="back" data-action="topicExit">← 换主题</button></div><div class="topic-question-nav"><button class="secondary" data-action="topicPrevious" ${session.cursor?'':'disabled'}>← 上一题</button><span role="status">${item.passed?'答对了，可以比较解法或继续':'找关键关系，试试更简洁的解法'}</span></div><article class="panel topic-question-work"><h2 class="task-title">${esc(task.prompt)} <button class="read-mini" data-action="competitionRead" aria-label="朗读题目及图表条件">🔊</button></h2>${competitionClues(task)}<div class="competition-options" role="group" aria-label="选答案">${displayOrder(task,'options').map(i=>`<div class="competition-option"><button class="${draft.choice===i?'primary':'secondary'}" data-action="competitionPick" data-index="${i}" aria-pressed="${draft.choice===i}" ${item.passed?'disabled':''}>${esc(task.options[i])}</button><button class="competition-cross secondary" data-action="competitionEliminate" data-index="${i}" aria-label="${state.eliminated.includes(i)?'恢复':'划掉'}选项 ${esc(task.options[i])}" aria-pressed="${state.eliminated.includes(i)}" ${item.passed?'disabled':''}>${state.eliminated.includes(i)?'已划掉':'划掉'}</button><button class="read-mini" data-action="competitionReadOption" data-index="${i}" aria-label="朗读选项 ${esc(task.options[i])}">🔊</button></div>`).join('')}</div><details class="competition-notes"><summary>记下我的思路</summary><textarea data-competition-input="notes" maxlength="1200" aria-label="我的解题思路" placeholder="可以记算式，也可以在纸上画图。">${esc(state.notes)}</textarea></details>${feedback?`<p class="feedback ${feedback.ok?'ok':'retry'}" role="status">${esc(feedback.text)}</p>`:''}<div id="speech-status" class="tiny-note" role="status" aria-live="polite">${esc(speechMessage)}</div><div class="competition-actions"><button class="primary" data-action="${item.passed?'next':'check'}">${item.passed?'下一题 →':'提交答案 ✓'}</button>${!item.passed?'<button class="secondary" data-action="competitionHint">给我一个方向</button>':''}</div>${!item.passed?competitionHintPanel(c,state,history):''}${item.passed?competitionSolutions(task):''}</article></section>`;
}
function competitionSubmit(){
 const task=playerTask(),item=topicCurrent();if(!topicSessionMatches()||!task?.competition||item.passed)return;
 if(!Number.isInteger(draft.choice)||draft.choice<0||draft.choice>=5){feedback={ok:false,text:'先选一个答案。'};render();return}
 const c=task.competition,history=competitionHistory(task),exposure=CompetitionIdentity.exposure(saved.competition,task),state=competitionState(),ok=draft.choice===task.answer;
 const record={taskId:task.id,contentVersion:task.contentVersion,recipe:c.recipe,signature:c.signature,topicIds:[...c.topicIds],selectedTopicIds:[...topicSession().topicIds],sessionId:topicSession().id,at:Date.now(),order:++saved.competition.sequence,choice:draft.choice,correct:ok,firstCorrect:!exposure.attempted&&!exposure.uncertain&&ok&&!exposure.hinted&&!exposure.solutionViewed,firstAttempt:!exposure.attempted&&!exposure.uncertain,priorSolutionViewed:exposure.solutionViewed,hinted:exposure.hinted,priorExposureUnknown:exposure.uncertain===true,equivalentRepeat:(exposure.attempted||exposure.uncertain)&&!history.attempted,notes:state.notes};
 saved.competition.attempts.push(record);competitionUpdateMainHistory(saved.competition,record);
 saved.competition.attempts=saved.competition.attempts.slice(-500);item.passed=ok;
 feedback={ok,text:ok?(c.methods.length>1?'答对了。可以比较解题路线，再试条件变化。':'答对了。看看关键推理，再试条件变化。'):(c.misconceptions?.find(m=>competitionValueEqual(task.options[draft.choice],m.value))?.feedback||'还没同时满足题目条件。换一种方法核对一下。')};
 if(ok)history.solutionViewed=true;
 persist();render();
}
function competitionHandleInput(target){
 if(view!=='competition'||!playerTask()?.competition||!target.dataset?.competitionInput)return false;
 const state=competitionState();if(target.dataset.competitionInput==='notes')state.notes=String(target.value).slice(0,1200);else if(target.dataset.competitionInput==='extension'){state.extensionInput=String(target.value).slice(0,40);state.extensionResult=null}else return false;
 persist();return true;
}
function competitionHandleAction(action,data){
 if(action==='competitionRecords'){open('competitionRecords');return true}
 const task=playerTask();if(view!=='competition'||!task?.competition)return false;
 const c=task.competition,state=competitionState(),item=topicCurrent(),i=Number(data.index);
 if(action==='check'){competitionSubmit();return true}
 if(action==='competitionPick'){if(!item.passed&&Number.isInteger(i)&&i>=0&&i<5&&!state.eliminated.includes(i)){draft.choice=i;feedback=null;persist();render()}return true}
 if(action==='competitionEliminate'){if(!item.passed&&Number.isInteger(i)&&i>=0&&i<5){const at=state.eliminated.indexOf(i);if(at<0){state.eliminated.push(i);if(draft.choice===i)draft.choice=-1}else state.eliminated.splice(at,1);feedback=null;persist();render()}return true}
 if(action==='competitionHint'||action==='competitionHintMore'){if(!item.passed){competitionStopCurrentSpeech();const h=competitionHistory(task);if(!h.hinted){h.hintedAt=Date.now();h.hintOrder=++saved.competition.sequence}h.hinted=true;CompetitionIdentity.invalidate(saved.competition);state.hintLevel=action==='competitionHintMore'?Math.min(c.hints.length,Math.max(1,state.hintLevel||1)+1):Math.max(1,state.hintLevel||1);persist();render()}return true}
 if(action==='competitionStopSpeech'){
  speechSequence++;if('speechSynthesis' in window)try{window.speechSynthesis.cancel()}catch{}
  setSpeechStatus('朗读已停止。');return true;
 }
 if(action==='competitionMethod'){if(item.passed&&Number.isInteger(i)&&i>=0&&i<c.methods.length){competitionStopCurrentSpeech();state.method=i;state.step=0;persist();render()}return true}
 if(action==='competitionStep'){if(item.passed&&Number.isInteger(i)&&i>=0&&i<c.methods[state.method].steps.length){competitionStopCurrentSpeech();state.step=i;persist();render()}return true}
 if(action==='competitionExtensionCheck'){
  if(item.passed){if(state.extensionResult?.ok)return true;if(!state.extensionInput.trim()){state.extensionResult={ok:false};render();return true}const ok=competitionValueEqual(state.extensionInput,c.extension.answer);state.extensionResult={ok};const variationSignature=competitionVariationSignature(task),key=competitionHash(variationSignature),prior=saved.competition.extensionViews[key],exposure=CompetitionIdentity.exposure(saved.competition,task,'extension'),at=Date.now(),order=++saved.competition.sequence;const independent=!exposure.attempted&&!exposure.uncertain&&!exposure.hinted&&!exposure.solutionViewed;saved.competition.extensions.push({taskId:task.id,recipe:c.recipe,signature:c.signature,variationSignature,firstAttempt:!exposure.attempted&&!exposure.uncertain,priorExposureUnknown:exposure.uncertain===true,hinted:exposure.hinted,priorSolutionViewed:exposure.solutionViewed,at,order,input:state.extensionInput,correct:ok});if(!prior?.attempted)saved.competition.extensionViews[key]={at,order,signature:variationSignature,mainSignature:c.signature,recipe:c.recipe,attempted:true,firstInput:state.extensionInput,firstIndependent:independent,hinted:exposure.hinted,priorSolutionViewed:exposure.solutionViewed,firstCorrect:ok&&independent};if(ok)saved.competition.extensionViews[key].solved=competitionExtensionSnapshot(variationSignature,{recipe:c.recipe,input:state.extensionInput,at});saved.competition.extensions=saved.competition.extensions.slice(-300);CompetitionIdentity.invalidate(saved.competition);persist();render()}return true;
 }
 const speech=action==='competitionRead'?competitionQuestionSpeech(task):action==='competitionReadHint'&&!item.passed&&competitionHistory(task).hinted?c.hints[Math.max(0,Math.min(c.hints.length-1,(state.hintLevel||1)-1))]:action==='competitionReadClue'?c.clues?.[i]?.text:action==='competitionReadOption'?task.options[i]:action==='competitionReadStep'&&item.passed?c.methods[state.method].steps[i]:action==='competitionReadExtension'&&item.passed?c.extension.prompt:null;
 if(action.startsWith('competitionRead')){if(speech)speak('surface',-1,action==='competitionRead'?speech:competitionSpeechText(speech));return true}
 return false;
}
function competitionRecordsPage(){
 const answers=saved.competition.attempts,counts=competitionProgressCounts();
 return `<section class="panel competition-records"><div class="page-head"><h1>竞赛练习记录</h1><button class="back" data-action="home">← 选主题</button></div><p>已记录完成 ${counts.solved} 道不同题，${counts.first} 道未用提示首答正确，完成 ${counts.extensions} 道变式。</p><p>勾选主题表示允许出题；查看解法表示已经看过，不计为掌握了这种方法。</p><ol>${answers.slice(-15).reverse().map(a=>`<li>${esc(topicNames(a.topicIds))} · ${a.correct?'答对':'待再试'}${a.hinted?' · 使用了提示':''}</li>`).join('')||'<li>最近没有答题明细。</li>'}</ol><details><summary>查看原有学习记录</summary><button class="secondary" data-action="progress">打开历史记录</button></details></section>`;
}

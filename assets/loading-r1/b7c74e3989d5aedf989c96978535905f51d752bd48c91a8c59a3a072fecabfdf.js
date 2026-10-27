'use strict';
let competitionPauseRequested=false;
function competitionState(){
 if(draft.work?.kind!=='competition-work')draft.work={kind:'competition-work',eliminated:[],notes:'',method:0,step:0,hintLevel:0,extensionInput:'',extensionResult:null,reasoning:null,solutionOpen:false,variationMode:null};
 return draft.work;
}
function competitionRestoreWork(value){
 if(value?.schema===2){const work=JSON.parse(JSON.stringify(value));for(const scope of Object.values(work.scopes||{})){if(scope.reasoning)scope.reasoning.needsValidation=true;}return work;}
 if(value?.schema>2)throw Error('FUTURE_WORK_SCHEMA');
 const validationStatus=value?.extensionResult?.status||value?.extensionResultValidationStatus;
 return {kind:'competition-work',eliminated:Array.isArray(value?.eliminated)?[...new Set(value.eliminated.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[],notes:typeof value?.notes==='string'?value.notes.slice(0,1200):'',method:Number.isInteger(value?.method)&&value.method>=0&&value.method<3?value.method:0,step:Number.isInteger(value?.step)&&value.step>=0&&value.step<12?value.step:0,hintLevel:Number.isInteger(value?.hintLevel)?Math.max(0,Math.min(4,value.hintLevel)):0,extensionInput:typeof value?.extensionInput==='string'?value.extensionInput.slice(0,40):'',extensionResult:null,sketch:value?.sketch&&typeof value.sketch==='object'?JSON.parse(JSON.stringify(value.sketch)):null,needsExtensionValidation:true,extensionResultValidationStatus:['awaiting_input','invalid_input'].includes(validationStatus)?validationStatus:null,reasoning:value?.reasoning&&typeof value.reasoning==='object'?{...value.reasoning,needsValidation:true}:null,solutionOpen:value?.solutionOpen===true,variationMode:['comparison','independent'].includes(value?.variationMode)?value.variationMode:null};
}
function competitionProcessHistory(entry,task){if(!task.competition.integrated||entry.processVerificationVersion===2||(entry.processVerification!=='verified'&&entry.strategyIndependent!==true))return {};return {legacyProcessEvidence:entry.legacyProcessEvidence||{processVerification:entry.processVerification,strategyIndependent:entry.strategyIndependent===true},processVerification:'legacy_unverified',strategyIndependent:false};}
function competitionMainSnapshot(signature,value){
 try{const task=competitionCreate(value?.recipe);if(task.competition.signature!==signature||!Number.isFinite(value.at)||value.at<=0||(!(value.inputMode==='free'&&typeof value.freeInput==='string'&&value.freeInput.length<=40)&&(!Number.isInteger(value.choice)||value.choice<0||value.choice>=5)))return null;
 return {evidenceVersion:value.evidenceVersion||0,inputMode:value.inputMode,freeInput:value.freeInput,independenceStatus:EvidenceRules.known(value.evidenceVersion)?'known':'unknown',recipe:task.competition.recipe,choice:value.choice,at:value.at,order:Number.isSafeInteger(value.order)&&value.order>0?value.order:0,sessionId:typeof value.sessionId==='string'?value.sessionId.slice(0,100):'',hinted:value.hinted===true,priorSolutionViewed:value.priorSolutionViewed===true,independent:value.independent!==false,relatedMethodExposure:value.relatedMethodExposure,strategyIndependent:value.strategyIndependent===true&&(!task.competition.integrated||value.processVerificationVersion===2),processVerificationVersion:value.processVerificationVersion,...competitionProcessHistory(value,task),...(value.legacyProcessEvidence?{legacyProcessEvidence:value.legacyProcessEvidence,processVerification:value.processVerification}:{}),correct:value.inputMode==='free'?ProblemState.equal(value.freeInput,task.competition.answer):value.choice===task.answer};}catch{return null}
}
function competitionExtensionSnapshot(signature,value){
 try{const task=competitionCreate(value?.recipe);if(competitionVariationSignature(task)!==signature||!Number.isFinite(value.at)||value.at<=0||typeof value.input!=='string'||value.input.length>40)return null;
 return {evidenceVersion:value.evidenceVersion||0,recipe:task.competition.recipe,input:value.input,at:value.at,correct:EvidenceRules.known(value.evidenceVersion)?ProblemState.equal(value.input,task.competition.extension.answer):competitionValueEqual(value.input,task.competition.extension.answer)};}catch{return null}
}
function competitionUpdateMainHistory(state,a){
 const key=competitionHash(a.signature),h=state.views[key]??(state.views[key]={at:a.at,signature:a.signature,hinted:false,solutionViewed:false,attempted:false}),snapshot=competitionMainSnapshot(a.signature,a);if(!snapshot||h.signature!==a.signature)return;
 const ownAttempted=h.attempted;h.attempted=true;h.hinted=h.hinted||snapshot.hinted;h.solutionViewed=h.solutionViewed||snapshot.priorSolutionViewed;
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
 const state={...((old&&typeof old==='object')?old:{}),version:1,sequence:0,attempts:[],views:{},extensions:[],extensionViews:{},events:[],methodExposures:{},methodHistoryObservedAt:Number.isFinite(old?.methodHistoryObservedAt)&&old.methodHistoryObservedAt>0?old.methodHistoryObservedAt:Date.now()};
 for(const [key,m]of Object.entries(old?.methodExposures||{}))if(m&&key===CompetitionIdentity.methodKey(m.recipe)&&Number.isFinite(m.firstAt)&&m.firstAt>0&&Number.isFinite(m.lastAt)&&m.lastAt>=m.firstAt)state.methodExposures[key]={...m,types:(Array.isArray(m.types)?m.types:[]).filter(x=>typeof x==='string').slice(-20)};
 for(const e of Array.isArray(old?.events)?old.events:[])if(e&&typeof e.type==='string'&&typeof e.signature==='string'&&Number.isFinite(e.at))state.events.push({...e});
 for(const [index,a] of (Array.isArray(old?.attempts)?old.attempts:[]).entries()){
  try{const task=competitionCreate(a.recipe);if(a.signature!==task.competition.signature||a.taskId!==task.id||a.contentVersion!==task.contentVersion||!Number.isFinite(a.at)||a.at<=0||(!(a.inputMode==='free'&&typeof a.freeInput==='string'&&a.freeInput.length<=40)&&(!Number.isInteger(a.choice)||a.choice<0||a.choice>=5)))continue;state.attempts.push({...a,...competitionProcessHistory(a,task),order:Number.isSafeInteger(a.order)&&a.order>0?a.order:index+1,topicIds:[...task.competition.topicIds],correct:a.inputMode==='free'?ProblemState.equal(a.freeInput,task.competition.answer):a.choice===task.answer,firstCorrect:a.firstCorrect===true&&(a.inputMode==='free'?ProblemState.equal(a.freeInput,task.competition.answer):a.choice===task.answer)&&a.hinted!==true&&a.priorSolutionViewed!==true&&!state.attempts.some(prior=>prior.signature===a.signature),firstAttempt:a.firstAttempt===true&&!state.attempts.some(prior=>prior.signature===a.signature),priorSolutionViewed:a.priorSolutionViewed===true,hinted:a.hinted===true,notes:typeof a.notes==='string'?a.notes.slice(0,1200):''})}catch{}
 }
 for(const [key,h] of Object.entries(old?.views||{}))if(/^[A-F0-9]{8}$/.test(key)&&h&&Number.isFinite(h.at)&&h.at>0&&typeof h.signature==='string'&&h.signature.length<15000&&competitionHash(h.signature)===key){
  const restored=state.views[key]={...h,at:h.at,signature:h.signature,hinted:h.hinted===true,solutionViewed:h.solutionViewed===true,...(Object.prototype.hasOwnProperty.call(h,'solutionViewedAt')?{solutionViewedAt:Number.isFinite(h.solutionViewedAt)?h.solutionViewedAt:null}:{}),attempted:h.attempted===true};
  if(Number.isFinite(h.hintedAt)&&h.hintedAt>0)restored.hintedAt=h.hintedAt;if(Number.isSafeInteger(h.hintOrder)&&h.hintOrder>0){restored.hintOrder=h.hintOrder;state.sequence=Math.max(state.sequence,h.hintOrder)}
  try{const t=competitionCreate(h.recipe);if(t.competition.signature===h.signature)restored.recipe=t.competition.recipe}catch{}
  for(const field of ['first','solved','last']){const snapshot=competitionMainSnapshot(h.signature,h[field]);if(snapshot&&(field!=='solved'||snapshot.correct)){restored[field]=snapshot;restored.attempted=true;restored.solutionViewed=restored.solutionViewed||snapshot.priorSolutionViewed;state.sequence=Math.max(state.sequence,snapshot.order)}}
  if(!restored.solved&&restored.first?.correct)restored.solved=restored.first;
 }
 for(const a of state.attempts)competitionUpdateMainHistory(state,a);
 for(const a of state.attempts){const first=state.views[competitionHash(a.signature)]?.first;if(first){const same=a.choice===first.choice&&a.at===first.at&&a.order===first.order&&JSON.stringify(a.recipe)===JSON.stringify(first.recipe);a.firstAttempt=a.firstAttempt&&same;a.firstCorrect=a.firstCorrect&&same&&first.correct&&!first.hinted&&!first.priorSolutionViewed}}
 for(const [key,h] of Object.entries(old?.extensionViews||{}))if(/^[A-F0-9]{8}$/.test(key)&&h&&Number.isFinite(h.at)&&h.at>0&&typeof h.signature==='string'&&competitionHash(h.signature)===key){state.extensionViews[key]={...h,at:h.at,order:Number.isSafeInteger(h.order)?h.order:0,signature:h.signature,attempted:h.attempted===true,evidenceVersion:h.evidenceVersion||0,independenceStatus:EvidenceRules.known(h.evidenceVersion)?'known':'unknown',variationMode:h.variationMode,relatedMainSolutionViewed:h.relatedMainSolutionViewed===true,relatedSolutionAt:h.relatedSolutionAt,relatedMethodExposure:h.relatedMethodExposure,firstIndependent:h.firstIndependent!==false,hinted:h.hinted===true,priorSolutionViewed:h.priorSolutionViewed===true};if(typeof h.firstInput==='string'&&h.firstInput.length<=40){try{const task=competitionCreate(h.recipe);if(competitionVariationSignature(task)===h.signature&&task.competition.signature===h.mainSignature)Object.assign(state.extensionViews[key],{recipe:task.competition.recipe,mainSignature:h.mainSignature,firstInput:h.firstInput.slice(0,40),firstCorrect:h.firstIndependent!==false&&h.hinted!==true&&h.priorSolutionViewed!==true&&h.relatedMainSolutionViewed!==true&&(EvidenceRules.known(h.evidenceVersion)?ProblemState.equal(h.firstInput,task.competition.extension.answer):competitionValueEqual(h.firstInput,task.competition.extension.answer))})}catch{}}const solved=competitionExtensionSnapshot(h.signature,h.solved);if(solved?.correct){state.extensionViews[key].solved=solved;state.extensionViews[key].attempted=true}else if(state.extensionViews[key].firstCorrect){state.extensionViews[key].solved=competitionExtensionSnapshot(h.signature,{recipe:h.recipe,input:h.firstInput,at:h.at})}}
 for(const a of Array.isArray(old?.extensions)?old.extensions:[]){try{const task=competitionCreate(a.recipe),signature=competitionVariationSignature(task);if(task.id!==a.taskId||task.competition.signature!==a.signature||!Number.isFinite(a.at)||a.at<=0||typeof a.input!=='string'||a.input.length>40||a.variationSignature&&a.variationSignature!==signature)continue;state.extensions.push({...a,variationSignature:signature,firstAttempt:a.firstAttempt===true&&!state.extensions.some(p=>p.variationSignature===signature),input:a.input.slice(0,40),correct:EvidenceRules.known(a.evidenceVersion)?ProblemState.equal(a.input,task.competition.extension.answer):competitionValueEqual(a.input,task.competition.extension.answer)});const h=state.extensionViews[competitionHash(signature)]??(state.extensionViews[competitionHash(signature)]={evidenceVersion:a.evidenceVersion||0,independenceStatus:EvidenceRules.known(a.evidenceVersion)?'known':'unknown',at:a.at,signature,attempted:true});h.attempted=true;if(a.firstAttempt===true&&typeof h.firstInput!=='string')Object.assign(h,{recipe:task.competition.recipe,mainSignature:a.signature,firstInput:a.input.slice(0,40),firstCorrect:EvidenceRules.known(a.evidenceVersion)?ProblemState.equal(a.input,task.competition.extension.answer):competitionValueEqual(a.input,task.competition.extension.answer)});const solved=competitionExtensionSnapshot(signature,{evidenceVersion:a.evidenceVersion||0,recipe:a.recipe,input:a.input.slice(0,40),at:a.at});if(solved?.correct)h.solved=solved;}catch{}}
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
 return competitionSpeechText(CompetitionContentContracts.resolve(task).narrationText);
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
  const sum=d.ratios.reduce((a,b)=>a+b,0),angles=d.ratios.map(x=>Math.PI*x/sum),side=Math.sin(angles[1])/Math.sin(angles[2]);
  const raw=[[0,0],[1,0],[side*Math.cos(angles[0]),-side*Math.sin(angles[0])]],xs=raw.map(p=>p[0]),ys=raw.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),scale=Math.min(155/(maxX-minX),75/(-minY));
  const pts=raw.map(([x,y])=>[65+(x-minX)*scale,112+y*scale]),center=[pts.reduce((s,p)=>s+p[0],0)/3,pts.reduce((s,p)=>s+p[1],0)/3];
  art=`<path class="competition-shape" data-angle-ratios="${d.ratios.join(':')}" d="M${pts.map(p=>p.join(' ')).join(' L')} Z"/>`;
  pts.forEach((p,i)=>{const dx=p[0]-center[0],dy=p[1]-center[1],length=Math.hypot(dx,dy);art+=label(p[0]+18*dx/length,p[1]+18*dy/length+5,`${d.ratios[i]}份`)});
  art+=label(142,144,'角度按标注比例绘制');
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
  if(d.sampleFirst)art+=`<rect class="competition-sample-boundary" x="${ox}" y="${oy-side}" width="${side}" height="${side}" style="fill:none;stroke:#923d24;stroke-width:3;stroke-dasharray:5 3"/>`;
  bottom=label(144,146,`边长 ${d.n}，右移 ${d.dx}，上移 ${d.dy}`)+(d.sampleFirst?label(144,169,'虚线框：第一张纸为取点范围'):'');
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
 const description=labels.length?labels.join('，'):d.kind==='garden'?`长 ${d.width}，宽 ${d.height}，${d.cutWidth?'角落花区长 '+d.cutWidth+'，宽 '+d.cutHeight:'长方形地面'}`:d.kind==='coordinate'?'点 A 和 B 的坐标图':d.kind==='hypotenuseMidpoint'?`直角边长 ${3*d.k} 与 ${4*d.k}，M为${d.legMidpoint?'较长直角边':'斜边'}中点，虚线是所求距离`:d.kind==='boxNet'?`边长 ${d.side} 的正方形纸，四角各剪去边长${d.cut||'x'}的小正方形，虚线为折叠位置${d.cut?'':'，x是待选长度'}`:d.kind==='angleRatioTriangle'?`三个内角按顶点标注比例 ${d.ratios.join(':')}，按角度比例绘制`:d.kind==='truncatedBars'?`纵轴从 ${d.base} 人起，每个小格 ${d.step} 人，甲高 ${d.a} 格，乙高 ${d.b} 格`:'题目中的数学示意图';
 const schematic=['rectangleDiagonal','notch','lShape','cross','parallelTriangle','fourAreas','isoscelesExterior'].includes(d.kind);
 return `<figure class="competition-geometry"><svg class="competition-diagram" viewBox="0 0 285 ${d.kind==='necklaceBlank'?190:d.sampleFirst?180:150}" role="img" aria-label="${esc(description+(d.sampleFirst?'；取点范围只限第一张纸，虚线边界标出':''))}">${art}${bottom}</svg>${d.caption||schematic?`<figcaption>${esc(d.caption||'')}${schematic?' 示意图，尺寸或角度以标注为准。':''}</figcaption>`:''}</figure>`;
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
function competitionScopedContent(task){
 const c=task.competition,allowed=SourceCatalog.taskAllowed(task,topicSessionSettings());
 if(!allowed.length){const text=(SourceCatalog.knowledgeGaps(c)[0]?.message||'这组声明的知识范围暂无可展示路线。')+'已保存的作答和草稿仍保留。';return {...c,scopeBlocked:true,variationScopeBlocked:true,variationScopeMessage:text,methods:[{name:'检查这组知识范围',steps:[text]}],hints:[text,'可以保留自己的思路，或返回首页设置下一组。'],hintDiagram:{kind:'scene-quantities',quantities:[],caption:text},extension:{...c.extension,prompt:'',diagram:null,solution:text,solutionFrames:[]}}}
 const teaching=SourceCatalog.teachingScope(task,topicSessionSettings());
 if(teaching){
  const active=reasoningState(task).state.routeId,route=c.routes.find(r=>r.id===active&&allowed.some(a=>a.id===r.id))||c.routes.find(r=>r.id===allowed[0].id);
  const value=x=>SourceCatalog.presentationValue(task,x,topicSessionSettings());
  const methods=c.methods.flatMap((m,i)=>{if(!teaching.allowedMethodIndexes.includes(i))return [];const definition=teaching.methods[i];if(!definition.useRouteFrames)return [{...m,routeId:definition.routeId}];const nodes=c.routes.find(r=>r.id===definition.routeId).nodes;return [{...m,routeId:definition.routeId,frames:m.steps.map((text,step)=>({kind:'scene-stage',scene:{kind:'scene-quantities',quantities:nodes.slice(0,Math.max(1,Math.ceil((step+1)*nodes.length/m.steps.length))).map(n=>({label:n.prompt,value:value(n.answer),unit:n.unit})),caption:'按这条路线连接已经得到的量'},stage:{kind:'solution',step,text}}))}]} );
  const hints=['coordinateHorizontal','repeatedOnes','mixedPacks','mapScale','riverTravel','telescopingDifferences'].includes(c.recipe.familyId)?c.hints:[route.nodes[0].prompt,route.nodes[Math.min(1,route.nodes.length-1)].prompt];
  const message='这组知识范围暂不包含变式所需的'+teaching.variation.missingSkillIds.map(id=>window.__AMC8_SKILLS.skills.find(s=>s.id===id)?.title||id).slice(0,3).join('、')+'。可以先保留主问题的练习。';
  const extension=teaching.variation.solution?{...c.extension,solution:teaching.variation.solution,solutionFrames:c.extension.solutionFrames.map(f=>({...f,stage:{...f.stage,text:teaching.variation.solution}}))}:c.extension;
  return {...c,displayTopicIds:[...new Set(allowed.find(r=>r.id===route.id).directSkills.map(id=>id.split('.')[0]))],methods:methods.length?methods:[{name:'连接已经求出的量',routeId:route.id,steps:route.nodes.map(n=>n.prompt+' '+value(n.answer)+(n.unit||''))}],
   hints,hintDiagram:{...c.diagram,stage:{kind:'hint',text:hints[1]}},variationScopeBlocked:!teaching.variation.allowed,variationScopeMessage:message,
   extension:teaching.variation.allowed?extension:{...c.extension,prompt:'',diagram:null,solution:message,solutionFrames:[]}};
 }
 if(c.sourceProvenance?.matchType!=='full_structure'&&c.family!=='threeGroupBalance')return c;
 const routeIds=new Set(allowed.map(r=>r.id)),active=reasoningState(task).state.routeId,route=c.routes.find(r=>r.id===active&&routeIds.has(r.id))||c.routes.find(r=>routeIds.has(r.id));
 const methods=c.methods.filter(m=>routeIds.has(m.routeId)),hints=route?[route.nodes[0].prompt,route.nodes[Math.min(1,route.nodes.length-1)].prompt]:['当前知识范围不包含已核验路线的必要前提。','可以保留旧记录，并返回检查已掌握范围。'];
 let extension=c.extension;
 if(c.family==='signedProduct'&&route?.id==='sign-categories'){const cards=c.math.cards,neg=cards.filter(x=>x<0),pos=cards.filter(x=>x>0),value=Math.min(...neg)*Math.max(...pos);if(!ProblemState.equal(value,extension.answer))throw Error('Two-card classification disagreement');const solution='两张乘积为负，只能是一负一正。最负的卡乘最大的正卡为 '+value+'；负负为正，含零为零，不会更小。';extension={...extension,solution,solutionFrames:extension.solutionFrames.map(f=>({...f,stage:{...f.stage,text:solution}}))}}
 return {...c,methods:methods.length?methods:[{name:'当前范围暂无可展示解法',steps:['保留作答与历史记录，返回检查已掌握的必要知识。']}],hints,hintDiagram:{...c.hintDiagram,stage:{kind:'hint',text:hints[1]}},extension};
}
function competitionHintPanel(c,state,history,scopeId='main'){
 const scope=state.scopes[scopeId],variant=scopeId!=='main',hints=variant?CompetitionContentContracts.resolve(playerTask(),scopeId).hints.map(h=>h.prompt):c.hints;
 const level=scope.help.revealedHintIds.length;
 return `<section class="competition-hints" data-scope-id="${esc(scopeId)}"><button type="button" class="secondary" data-action="competitionHint" data-scope="${esc(scopeId)}" aria-expanded="${scope.help.open}">${level?'查看已用提示':'提示'}</button>${level&&scope.help.open?`<div class="competition-hint">${hints.slice(0,level).map((t,i)=>`<section data-hint-id="${variant?'variation':'main'}-h${i+1}"><p>${esc(t)}</p><button type="button" class="secondary" data-action="competitionReadHint" data-scope="${esc(scopeId)}" data-index="${i}" aria-label="朗读第${i+1}条提示">🔊 朗读提示 ${i+1}</button></section>`).join('')}${level>0?competitionDiagram(CompetitionPresentation.projectDiagram({...playerTask(),competition:c},state,scopeId)):''}<div class="competition-hint-controls"><button type="button" class="secondary" data-action="competitionStopSpeech">停止朗读</button><button type="button" class="secondary" data-action="competitionCloseHints" data-scope="${esc(scopeId)}">收起提示</button>${level<hints.length?`<button type="button" class="secondary" data-action="competitionHintMore" data-scope="${esc(scopeId)}">下一条提示</button>`:'<p role="status">提示已全部展开，可以回看和朗读。</p>'}</div></div>`:''}</section>`;
}
function competitionStopCurrentSpeech(){speechSequence++;competitionPauseRequested=false;if('speechSynthesis' in window)try{const engine=window.speechSynthesis;engine.cancel();if(engine.paused&&engine.resume)engine.resume()}catch{}speechMessage=''}
function competitionClues(task){
 const c=task.competition,contract=CompetitionContentContracts.resolve(task);
 return c.clues?`<div class="competition-clues">${c.clues.map((clue,i)=>`<section class="competition-clue"><p>${esc(clue.text)} <button type="button" class="read-mini" data-action="competitionReadClue" data-index="${i}">🔊</button></p>${CompetitionContentContracts.givenText(clue,clue.text)?'<p class="competition-givens">'+esc(CompetitionContentContracts.givenText(clue,clue.text))+'</p>':''}</section>`).join('')}</div>`:contract.givenText?'<p class="competition-givens" data-question-givens>'+esc(contract.givenText)+'</p>':'';
}
function competitionIntegratedFollowup(task){
 const map={'rule-weighted-mean':['integratedWeightedPlan','mean-admission'],'rule-weighted-score':['integratedWeightedPlan','score-training'],'rule-ratio-length':['integratedRatioPlan','length-border'],'rule-ratio-perimeter':['integratedRatioPlan','perimeter-fence']},pair=map[task.competition.recipe.familyId];if(!pair)return null;
 const recipe={engine:3,familyId:pair[0],configurationId:pair[1],generatorRevision:5,seed:task.competition.recipe.seed},next=competitionCreate(recipe),settings=topicSessionSettings();return settings.sourceIds.includes('original')&&SourceCatalog.taskAllowed(next,settings).length&&SourceCatalog.loadsAllowed(next,settings)?next:null;
}
function competitionSolutions(task){
 const c=competitionScopedContent(task),state=competitionState();const method=c.methods[state.method]||c.methods[0];
 const table=state.method===1&&c.verification?`<div class="competition-material-table"><table aria-label="每个选项代入全部条件"><thead><tr><th>号码</th>${c.clues.map((_,i)=>`<th>条件 ${i+1}</th>`).join('')}</tr></thead><tbody>${c.verification.map(row=>`<tr><td>${row.number}</td>${row.checks.map(check=>`<td>${esc(check.value)} ${check.ok?'✓':'×'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'';
 return `<section class="competition-solutions">${topicCurrent().passed&&topicSession().items.length<66&&competitionIntegratedFollowup(task)?'<button type="button" class="secondary" data-action="competitionIntegratedFollowup">把这些工具用于综合挑战</button>':''}<div class="stage-buttons"><button class="secondary" data-action="competitionShowSolution">查看解法</button>${c.variationScopeBlocked?'':`<button class="secondary" data-action="competitionCompareVariation">比较条件变化</button><button class="secondary" data-action="competitionIndependentVariation">单独做变式</button>`}</div>${c.variationScopeBlocked?`<p role="status">${esc(c.variationScopeMessage)}</p>`:''}${state.solutionOpen?`<h2>${c.methods.length>1?'比较解题路线':'看看解题思路'}</h2><div class="competition-methods">${c.methods.map((m,i)=>`<button class="secondary" data-action="competitionMethod" data-index="${i}" aria-pressed="${state.method===i}">${esc(m.name)}</button>`).join('')}</div>${competitionDiagram(method.frames?.[state.step])}<ol>${method.steps.map((text,i)=>`<li class="${method.frames&&state.step===i?'rule-active-step':''}">${method.frames?`<button class="rule-step secondary" data-action="competitionStep" data-index="${i}" aria-pressed="${state.step===i}" aria-label="查看第 ${i+1} 步的关系图">看这一步</button> `:''}${esc(text)} <button class="read-mini" data-action="competitionReadStep" data-index="${i}" aria-label="朗读这一步">🔊</button></li>`).join('')}</ol>${table}`:''}${state.variationMode&&!c.variationScopeBlocked?`<p>${state.variationMode==='comparison'?'比较练习：可以回看主问题解法。':'单独作答：既往看过的方法和本次帮助仍会记录。'}</p>${state.variationMode==='independent'&&CompetitionIdentity.methodContext(saved.competition,task).recent?'<p role="status">近期看过关联提示或解法，本次会按带有方法暴露的练习记录。</p>':''}<details class="competition-extension" open><summary>条件变了，还能用原来的办法吗？</summary><p data-variation-prompt>${esc(CompetitionContentContracts.resolve(task,CompetitionWork.variationId(task)).promptText)} <button class="read-mini" data-action="competitionReadExtension" aria-label="朗读变式">🔊</button></p>${CompetitionContentContracts.resolve(task,CompetitionWork.variationId(task)).givenText?'<p class="competition-givens" data-question-givens>'+esc(CompetitionContentContracts.resolve(task,CompetitionWork.variationId(task)).givenText)+'</p>':''}${competitionHintPanel(c,state,null,CompetitionWork.variationId(task))}${CompetitionModelWorkspace.panel(task,state,CompetitionWork.variationId(task))}${learnerSketchPanel(task,CompetitionWork.variationId(task))}<form class="competition-extension-input" data-competition-form="extension"><p>填写精确值；未要求近似时不把四舍五入当成相等。</p><label>答案 <input data-competition-input="extension" inputmode="decimal" autocomplete="off" value="${esc(state.extensionInput)}" placeholder="精确值，可填分数或算式"></label><button type="submit" class="secondary" data-action="competitionExtensionCheck">检查变式</button></form>${state.extensionResult?`<p class="variation-feedback competition-submit-feedback" tabindex="-1" data-answer-status="${state.extensionResult.status||(state.extensionResult.ok?'correct':'needs_revision')}" role="status" aria-live="polite">${state.extensionResult.ok?'✓ 变式答案正确。':esc(competitionFeedbackText(state.extensionResult,SubmissionContract.feedback(c,state.extensionInput,true)))}</p>`:''}${state.extensionResult?.ok?'<button type="button" class="secondary" data-action="competitionShowVariationSolution">查看变式解法</button>':''}${state.scopes[CompetitionWork.variationId(task)].help.solutionSeen?`<section class="variation-solution"><p>${esc(c.extension.solution)}</p>${(c.extension.solutionFrames||[]).map(competitionDiagram).join('')}</section>`:''}</details>`:''}</section>`;
}

function competitionAnswerInputs(task,item,state){
 if(task.competition.family==='threeGroupBalance'||task.competition.integrated)return `<label>最终答案 <input data-competition-input="final" inputmode="decimal" value="${esc(reasoningState(task).state.finalInput)}" placeholder="填写精确数值" ></label>`;
 return `<div class="competition-options" role="group" aria-label="选答案">${displayOrder(task,'options').map(i=>`<div class="competition-option"><button class="${draft.choice===i?'primary':'secondary'}" data-action="competitionPick" data-index="${i}" aria-pressed="${draft.choice===i}" >${esc(task.options[i])}</button><button class="competition-cross secondary" data-action="competitionEliminate" data-index="${i}" aria-label="${state.eliminated.includes(i)?'恢复':'划掉'}选项 ${esc(task.options[i])}" aria-pressed="${state.eliminated.includes(i)}" >${state.eliminated.includes(i)?'已划掉':'划掉'}</button>${CompetitionSpeech.numericOption(task.options[i])?'':`<button type="button" class="read-mini" data-action="competitionReadOption" data-index="${i}" aria-label="朗读选项 ${esc(task.options[i])}">🔊</button>`}</div>`).join('')}</div>`;
}
function competitionQuestionPage(){
 const session=topicSession(),item=topicCurrent(),task=playerTask();if(!session||!item||!task?.competition)return topicSelectionPage();
 const c=competitionScopedContent(task),state=competitionState(),history=competitionHistory(task);
 const offer=topicChallengeOffer(),challenge=!offer?'':offer.available?'<div class="tiny-note" data-math-challenge><p>最近三道未见题都独立答对了。可以自愿试更高阶段的题，也可以继续原练习。</p><button type="button" class="secondary" data-action="topicChallenge">试试更高阶段</button></div>':'<p class="tiny-note" data-math-challenge>最近三道未见题都独立答对了；当前已选范围暂无更高阶段的题，可以继续原练习。</p>';
 return `<section class="topic-question competition-question"><div class="page-head"><div><p class="kicker">第 ${session.cursor+1} / ${session.total} 题 · ${c.level?['','起步','进阶','挑战'][c.level]:'思路挑战'}</p><h1>${esc(c.title||topicNames(c.topicIds))}</h1>${item.passed?`<p class="competition-topic-label">本题用到：${esc(topicNames(c.displayTopicIds||c.topicIds))}</p>`:''}</div><button class="back" data-action="topicExit">← 换主题</button></div><div class="topic-question-nav"><button class="secondary" data-action="topicPrevious" ${session.cursor?'':'disabled'}>← 上一题</button><span role="status">${item.autoExcluded?'这道题以前已答对，当前是历史回看。':item.passed?'答对了，可以比较解法或继续':'找关键关系，试试更简洁的解法'}</span></div><article class="panel topic-question-work"><h2 class="task-title">${esc(CompetitionContentContracts.resolve(task).promptText)} <button class="read-mini" data-action="competitionRead" aria-label="朗读题目及图表条件">🔊</button></h2>${competitionClues(task)}${competitionHintPanel(c,state,history)}<form data-competition-form="main">${competitionAnswerInputs(task,item,state)}${CompetitionModelWorkspace.panel(task,state)}<button type="submit" class="primary" data-action="check">检查答案 ✓</button>${feedback?`<p class="feedback competition-submit-feedback ${feedback.ok?'ok':'retry'}" tabindex="-1" data-answer-status="${feedback.status||(feedback.ok?'correct':'needs_revision')}" role="status" aria-live="polite">${esc(competitionFeedbackText(feedback))}</p>`:''}</form>${learnerSketchPanel(task)}${!item.passed?reasoningPanel(task):''}<details class="competition-notes"><summary>记下我的思路</summary><textarea data-competition-input="notes" maxlength="1200" aria-label="我的解题思路" placeholder="可以记算式，也可以在纸上画图。">${esc(state.notes)}</textarea></details><div id="speech-status" class="tiny-note" role="status" aria-live="polite">${esc(speechMessage)}</div>${challenge}<div class="competition-actions">${item.passed||item.autoExcluded?'<button type="button" class="primary" data-action="next">下一题 →</button>':''}${!item.passed?'<button class="secondary" data-action="topicSkip">先跳过，保留草稿</button>':''}</div>${competitionSolutions(task)}</article></section>`;
}
function competitionFeedbackText(result,fallback=''){
 const text=result.text||fallback,status=result.status||(result.ok?'correct':'needs_revision');
 return status==='needs_revision'?'这次还没答对。'+text:text;
}
function competitionRenderFeedback(scopeId='main'){
 render();
 const target=root.querySelector?.(scopeId==='main'?'.feedback[data-answer-status]':'.variation-feedback[data-answer-status]');
 target?.focus?.({preventScroll:true});target?.scrollIntoView?.({block:'nearest'});
}
function competitionSubmit(){
 const task=playerTask(),item=topicCurrent();if(!topicSessionMatches()||!task?.competition)return;
 if(!topicRequireCurrentScope())return;
 if(!SourceCatalog.taskAllowed(task,topicSessionSettings()).length){feedback={ok:false,status:'unsupported_scope',text:competitionScopedContent(task).variationScopeMessage};competitionRenderFeedback();return;}
 const free=task.competition.family==='threeGroupBalance'||task.competition.integrated,freeInput=free?reasoningState(task).state.finalInput.trim():null;
 if(free&&!freeInput){feedback={ok:false,status:'awaiting_input',text:'先填写答案。'};competitionRenderFeedback();return}
 if(free&&!ProblemState.arithmetic(freeInput)){feedback=SubmissionContract.numeric(freeInput,task.competition.answer);competitionRenderFeedback();return}
 if(!free&&(!Number.isInteger(draft.choice)||draft.choice<0||draft.choice>=5)){feedback={ok:false,status:'awaiting_input',text:'先选一个答案。'};competitionRenderFeedback();return}
 const c=task.competition,history=competitionHistory(task),exposure=CompetitionIdentity.exposure(saved.competition,task),state=competitionState(),ok=free?ProblemState.equal(freeInput,c.answer):draft.choice===task.answer;
 if(free)draft.choice=task.options.findIndex(x=>ProblemState.equal(x,freeInput));
 const submissionKey=CompetitionWork.submissionKey(state,'main',free?freeInput:task.options[draft.choice]);if(state.scopes.main.lastSubmissionKey===submissionKey)return;state.scopes.main.lastSubmissionKey=submissionKey;
 CompetitionModelWorkspace.assess(task,state,'main',ok);
 const record={processVerificationVersion:2,candidateProofSnapshot:JSON.parse(JSON.stringify(state.scopes.main.model.candidateProof||null)),sketchVerification:JSON.parse(JSON.stringify(state.scopes.main.model.sketchVerification||null)),guidedProcessVerified:state.reasoning?.processVerified===true,processVerification:state.scopes.main.model.processVerified?'verified':'insufficient',toolSkillIds:[...state.scopes.main.model.selectedSkillIds],evidenceVersion:6,scopeId:'main',goalId:CompetitionContentContracts.resolve(task).goal.id,workId:state.workId,submissionKey,inputRevision:state.scopes.main.input.revision,inputMode:free?'free':'choice',freeInput,independenceStatus:'known',taskId:task.id,contentVersion:task.contentVersion,recipe:c.recipe,signature:c.signature,topicIds:[...c.topicIds],selectedTopicIds:[...topicSessionSettings().topicIds],declarationSnapshot:topicSessionSettings(),relatedMethodExposure:exposure.relatedMethod,strategyIndependent:(!c.integrated||state.scopes.main.model.processVerified)&&!exposure.relatedMethod.recent&&!exposure.hinted&&!exposure.solutionViewed,sessionId:topicSession().id,at:Date.now(),order:++saved.competition.sequence,choice:draft.choice,correct:ok,firstCorrect:!exposure.attempted&&!exposure.uncertain&&ok&&!exposure.hinted&&!exposure.solutionViewed,firstAttempt:!exposure.attempted&&!exposure.uncertain,priorSolutionViewed:exposure.solutionViewed,hinted:exposure.hinted,priorExposureUnknown:exposure.uncertain===true,equivalentRepeat:(exposure.attempted||exposure.uncertain)&&!history.attempted,notes:state.notes};
 saved.competition.attempts.push(record);competitionUpdateMainHistory(saved.competition,record);
 item.passed=item.passed||ok;state.scopes.main.answerState=ok?'correct':'incorrect';
 feedback={ok,status:ok?'correct':'needs_revision',text:ok?(c.methods.length>1?'答对了。可以比较解题路线，再试条件变化。':'答对了。看看关键推理，再试条件变化。'):(c.misconceptions?.find(m=>competitionValueEqual(task.options[draft.choice],m.value))?.feedback||'还没同时满足题目条件。换一种方法核对一下。')};
 if(!ok){
  const input=free?freeInput:task.options[draft.choice];feedback.text=competitionDirectedFeedback(task,input);
  if(c.family==='threeGroupBalance'){const m=c.math,extra=m.direction*m.d*(m.ref==='A'?m.k+1:1);if(ProblemState.equal(input,m.T+extra)||ProblemState.equal(input,(m.T+extra)/(m.k+2)))feedback.text='如果你先调整了人数差，请在图中核对：暂时拿开多出的部分或补齐缺少的部分后，总人数该增加还是减少？'}
  reasoningMarkHelp(task,'final-error-check',{input});
 }
 feedback={...feedback,scopeId:'main',goalId:CompetitionContentContracts.resolve(task).goal.id||'target',inputRevision:state.scopes.main.input.revision};state.scopes.main.feedback=feedback;persist();competitionRenderFeedback();
}
function competitionHandleInput(target){
 if(view!=='competition'||!playerTask()?.competition||!target.dataset?.competitionInput)return false;
 if(['transferProbeGap','transferProbeAmount'].includes(target.dataset.competitionInput)){
  const {state:s,graph}=reasoningState(),node=ReasoningSession.current(s,graph);
  if(node?.scaffoldKind==='two-sided-transfer'&&s.hintLevels[node.id]&&s.transferProbe?.mode==='external'){
   const key=target.dataset.competitionInput==='transferProbeGap'?'gapInput':'amountInput';s.transferProbe[key]=String(target.value).slice(0,40);s.transferProbe.calculationFeedback=null;persist();
  }return true;
 }
 const state=competitionState();if(['relation','candidates'].includes(target.dataset.competitionInput)){const scopeId=target.dataset.scope||'main',model=state.scopes[scopeId]?.model;if(model){CompetitionModelWorkspace.editDraft(state.scopes[scopeId],target.dataset.competitionInput==='relation'?'draft':'tableDraft',target.value);const panel=target.closest?.('.model-workspace');panel?.querySelector?.('[data-process-verification]')?.remove();const message=panel?.querySelector?.('[data-model-feedback]');if(message)message.textContent=model.feedback||'';persist()}return true;}if(target.dataset.competitionInput==='reasoning'){reasoningState().state.input=String(target.value).slice(0,160)}else if(target.dataset.competitionInput==='final'){if(state.activeScopeId!=='main')competitionStopCurrentSpeech();reasoningState().state.finalInput=String(target.value).slice(0,40);feedback=null;root.querySelector?.('.feedback[data-answer-status]')?.remove()}else if(target.dataset.competitionInput==='notes')state.notes=String(target.value).slice(0,1200);else if(target.dataset.competitionInput==='extension'){if(competitionScopedContent(playerTask()).variationScopeBlocked)return true;CompetitionController.dispatch({type:'SET_INPUT',scopeId:CompetitionWork.variationId(playerTask()),payload:{raw:String(target.value).slice(0,40)}})}else return false;
 persist();return true;
}
function competitionHandleAction(action,data){
 if(action==='competitionRecords'){open('competitionRecords');return true}
 const task=playerTask();if(view!=='competition'||!task?.competition)return false;
 if(!['competitionRead','competitionStopSpeech','competitionPauseSpeech','competitionCloseHints'].includes(action)&&!topicRequireCurrentScope())return true;
 const c=competitionScopedContent(task),state=competitionState(),item=topicCurrent(),i=Number(data.index);
 if(c.scopeBlocked&&['competitionHint','competitionHintMore','competitionReadHint','competitionReadStep'].includes(action)){feedback={ok:false,status:'unsupported_scope',text:c.variationScopeMessage};render();return true;}
 if(c.variationScopeBlocked&&['competitionCompareVariation','competitionIndependentVariation','competitionExtensionCheck','competitionReadExtension','competitionShowVariationSolution'].includes(action)){render();return true}
 if(!c.methods[state.method])state.method=0;
 if(reasoningHandleAction(action,data))return true;
 if(action==='competitionIntegratedFollowup'){const next=competitionIntegratedFollowup(task),session=topicSession();if(item.passed&&next&&session.items.length<66){competitionStopCurrentSpeech();topicCaptureDraft();const prior=session.items.findIndex(row=>topicDescriptor(row)?.task.competition.signature===next.competition.signature);if(prior>=0)session.cursor=prior;else{session.items.splice(session.cursor+1,0,{view:'competition',code:next.id,taskId:next.id,contentVersion:next.contentVersion,recipe:next.competition.recipe,openedAt:Date.now(),passed:false,draft:null,feedback:null});session.cursor++;}session.total=Math.max(session.total,session.items.length);topicOpenCurrent();persist()}return true}
 if(['competitionModelToggle','competitionTool','competitionRelationCheck','competitionCandidatesCheck'].includes(action)){
  const scopeId=data.scope||'main',scope=state.scopes[scopeId];if(!scope)return true;const model=CompetitionModelWorkspace.ensure(scope);
  if(action==='competitionModelToggle')model.open=!model.open;
  if(action==='competitionTool'&&topicSessionSettings().declaredSkillIds.includes(data.code)){state.scopes[scopeId].modelRevision=(state.scopes[scopeId].modelRevision||0)+1;const n=model.selectedSkillIds.indexOf(data.code);if(n<0)model.selectedSkillIds.push(data.code);else model.selectedSkillIds.splice(n,1);model.events.push({type:'tool-choice',skillId:data.code,selected:n<0,help:false});CompetitionModelWorkspace.assess(task,state,scopeId)}
  if(action==='competitionRelationCheck')CompetitionModelWorkspace.verifyRelation(task,state,scopeId,model.draft);
  if(action==='competitionCandidatesCheck')CompetitionModelWorkspace.verifyCandidates(task,state,scopeId);
  persist();render();return true;
 }
 if(action==='competitionPauseSpeech'){if('speechSynthesis' in window){const engine=window.speechSynthesis;if(competitionPauseRequested&&engine.resume){engine.resume();competitionPauseRequested=false}else if(engine.pause){engine.pause();competitionPauseRequested=true}}setSpeechStatus(competitionPauseRequested?'已请求暂停朗读。':'正在尝试朗读…');return true}
 if(action==='check'){competitionSubmit();return true}
 if(action==='competitionPick'){if(state.activeScopeId!=='main')competitionStopCurrentSpeech();if(Number.isInteger(i)&&i>=0&&i<5&&!state.eliminated.includes(i)){draft.choice=i;CompetitionWork.setInput(state,'main',task.options[i],task.optionIds[i]);feedback=null;persist();render()}return true}
 if(action==='competitionEliminate'){if(Number.isInteger(i)&&i>=0&&i<5){const at=state.eliminated.indexOf(i);if(at<0){state.eliminated.push(i);if(draft.choice===i)draft.choice=-1}else state.eliminated.splice(at,1);feedback=null;persist();render()}return true}
 if(action==='competitionHint'||action==='competitionHintMore'||action==='competitionCloseHints'){
  const scopeId=data.scope||'main',scope=state.scopes[scopeId];if(!scope)return true;
  competitionStopCurrentSpeech();
  if(action==='competitionCloseHints')scope.help.open=false;
  else{const hints=scopeId==='main'?c.hints:CompetitionContentContracts.resolve(task,scopeId).hints;
   const level=scope.help.revealedHintIds.length,target=action==='competitionHintMore'?Math.min(hints.length,level+1):Math.max(1,level);
   if(target>level){if(scopeId==='main')reasoningMarkHelp(task,'whole-problem-hint',{level:target});else{saved.competition.events.push({type:'variation-hint',scopeId,variationSignature:competitionVariationSignature(task),signature:c.signature,recipe:c.recipe,at:Date.now(),help:true});CompetitionIdentity.noteMethodExposure(saved.competition,task,'variation-hint')}
    for(let n=level;n<target;n++){const id=(scopeId==='main'?'main':'variation')+'-h'+(n+1);scope.help.revealedHintIds.push(id);scope.help.firstSeenAtByHint[id]=Date.now()}}
   scope.help.open=true;
  }persist();render();return true;
 }
 if(action==='competitionStopSpeech'){
  competitionStopCurrentSpeech();
  setSpeechStatus('朗读已停止。');return true;
 }
 if(['competitionShowSolution','competitionCompareVariation','competitionIndependentVariation'].includes(action)){if(!c.scopeBlocked){competitionStopCurrentSpeech();if(action==='competitionShowSolution'){state.solutionOpen=true;historySolutionExposure(task,'main')}else{state.variationMode=action==='competitionCompareVariation'?'comparison':'independent';state.activeScopeId=CompetitionWork.variationId(task);state.viewMode=action==='competitionCompareVariation'?'comparison':'question';state.solutionOpen=false}persist();render();if(action!=='competitionShowSolution'){const input=root.querySelector?.('[data-competition-input="extension"]');input?.focus();input?.scrollIntoView?.({block:'center'})}}return true}
 if(action==='competitionMethod'){if((item.passed||state.solutionOpen)&&Number.isInteger(i)&&i>=0&&i<c.methods.length){competitionStopCurrentSpeech();state.method=i;state.step=0;persist();render()}return true}
 if(action==='competitionStep'){if((item.passed||state.solutionOpen)&&Number.isInteger(i)&&i>=0&&i<c.methods[state.method].steps.length){competitionStopCurrentSpeech();state.step=i;persist();render()}return true}
 if(action==='competitionShowVariationSolution'){const scope=state.scopes[CompetitionWork.variationId(task)];competitionStopCurrentSpeech();scope.help.solutionSeen=true;historySolutionExposure(task,'extension');persist();render();return true}
 if(action==='competitionExtensionCheck'){
  if(!c.variationScopeBlocked){if(state.extensionResult?.ok)return true;state.variationMode||='comparison';if(!state.extensionInput.trim()){state.extensionResult={ok:false,status:'awaiting_input',text:'先填写变式的答案。'};persist();competitionRenderFeedback('variation');return true}const checked=SubmissionContract.numeric(state.extensionInput,c.extension.answer);if(!checked.recordAttempt){state.extensionResult=checked;persist();competitionRenderFeedback('variation');return true}const scopeId=CompetitionWork.variationId(task),scope=state.scopes[scopeId],submissionKey=CompetitionWork.submissionKey(state,scopeId,state.extensionInput);if(scope.lastSubmissionKey===submissionKey)return true;scope.lastSubmissionKey=submissionKey;const ok=checked.ok;scope.answerState=ok?'correct':'incorrect';state.extensionResult={ok,status:ok?'correct':'needs_revision',text:ok?'变式答案正确。':CompetitionFeedback.diagnose({task,input:state.extensionInput,scopeId}).text,scopeId,goalId:CompetitionContentContracts.resolve(task,scopeId).goal.id||'target',input:state.extensionInput,variationSignature:competitionVariationSignature(task)};const variationSignature=competitionVariationSignature(task),key=competitionHash(variationSignature),prior=saved.competition.extensionViews[key],exposure=CompetitionIdentity.exposure(saved.competition,task,'extension'),at=Date.now(),order=++saved.competition.sequence;const independent=!scope.help.revealedHintIds.length&&!exposure.attempted&&!exposure.uncertain&&!exposure.hinted&&!exposure.solutionViewed&&!exposure.relatedMainSolutionViewed&&!exposure.relatedMethod.recent&&state.variationMode==='independent';saved.competition.extensions.push({evidenceVersion:6,scopeId,goalId:CompetitionContentContracts.resolve(task,scopeId).goal.id,workId:state.workId,submissionKey,inputRevision:scope.input.revision,relatedMethodExposure:exposure.relatedMethod,variationMode:state.variationMode,relatedMainSolutionViewed:exposure.relatedMainSolutionViewed,relatedSolutionAt:exposure.relatedSolutionAt,independent,taskId:task.id,recipe:c.recipe,signature:c.signature,variationSignature,firstAttempt:!exposure.attempted&&!exposure.uncertain,priorExposureUnknown:exposure.uncertain===true,hinted:exposure.hinted||scope.help.revealedHintIds.length>0,helpSnapshot:JSON.parse(JSON.stringify(scope.help)),priorSolutionViewed:exposure.solutionViewed,at,order,input:state.extensionInput,correct:ok});if(!prior?.attempted)saved.competition.extensionViews[key]={evidenceVersion:6,relatedMethodExposure:exposure.relatedMethod,independenceStatus:'known',variationMode:state.variationMode,relatedMainSolutionViewed:exposure.relatedMainSolutionViewed,relatedSolutionAt:exposure.relatedSolutionAt,at,order,signature:variationSignature,mainSignature:c.signature,recipe:c.recipe,attempted:true,firstInput:state.extensionInput,firstIndependent:independent,hinted:exposure.hinted||scope.help.revealedHintIds.length>0,helpSnapshot:JSON.parse(JSON.stringify(scope.help)),priorSolutionViewed:exposure.solutionViewed,firstCorrect:ok&&independent};if(ok)saved.competition.extensionViews[key].solved=competitionExtensionSnapshot(variationSignature,{evidenceVersion:6,recipe:c.recipe,input:state.extensionInput,at});CompetitionIdentity.invalidate(saved.competition);persist();competitionRenderFeedback('variation')}return true;
 }
 const speech=action==='competitionRead'?competitionQuestionSpeech(task):action==='competitionReadHint'?(()=>{const id=data.scope||'main',scope=state.scopes[id],hints=id==='main'?c.hints:CompetitionContentContracts.resolve(task,id).hints.map(h=>h.prompt),index=Number.isInteger(i)?i:scope.help.revealedHintIds.length-1;return index>=0&&index<scope.help.revealedHintIds.length&&scope.help.open?hints[index]:null})():action==='competitionReadClue'&&c.clues?.[i]?[c.clues[i].text,CompetitionContentContracts.givenText(c.clues[i],c.clues[i].text)].filter(Boolean).join(' '):action==='competitionReadOption'&&!CompetitionSpeech.numericOption(task.options[i])?task.options[i]:action==='competitionReadStep'&&(item.passed||state.solutionOpen)?c.methods[state.method].steps[i]:action==='competitionReadExtension'&&state.variationMode?CompetitionContentContracts.resolve(task,CompetitionWork.variationId(task)).narrationText:null;
 if(action.startsWith('competitionRead')){if(speech){competitionStopCurrentSpeech();speak('surface',-1,action==='competitionRead'?speech:competitionSpeechText(speech))}return true}
 return false;
}
function competitionMethodExposureLabel(a){const e=a.relatedMethodExposure;if(e?.recent)return e.recentStatus==='possibly_recent'?' · 关联帮助时间不详，本次按练习记录':' · 近期看过关联方法，本次按练习记录';if(e?.everExposed&&a.strategyIndependent===true)return ' · 延后作答，本题未求助';return ''}
function competitionRecordsPage(){
 const answers=saved.competition.attempts,counts=competitionProgressCounts();
 return `<section class="panel competition-records"><div class="page-head"><h1>竞赛练习记录</h1><button class="back" data-action="home">← 选主题</button></div><p>已记录完成 ${counts.solved} 道不同题，${counts.first} 道未用提示首答正确，完成 ${counts.extensions} 道变式。</p><div class="stage-buttons"><button class="secondary" data-action="progressExport">导出全部记录与草稿</button></div><p>勾选主题表示允许出题；查看解法表示已经看过，不计为掌握了这种方法。</p><ol>${answers.slice(-15).reverse().map(a=>`<li>${esc(topicNames(a.topicIds))} · ${a.correct?'答对':'待再试'}${a.hinted?' · 使用了提示':''}${a.processVerification==='verified'?' · 工具与数量关系已核验':a.processVerification==='legacy_unverified'?' · 原策略独立结论待复核':a.evidenceVersion===6?' · 独立过程证据尚不完整':''}${competitionMethodExposureLabel(a)}${EvidenceRules.known(a.evidenceVersion)?'':' · 历史独立性未知'+(a.firstCorrect?'（保留原首次正确事实）':'')}</li>`).join('')||'<li>最近没有答题明细。</li>'}</ol><details><summary>查看原有学习记录</summary><button class="secondary" data-action="progress">打开历史记录</button></details></section>`;
}

'use strict';
const learnerSketchValidated=new WeakSet();
function learnerSketchState(task=playerTask(),scopeId='main'){
 const work=competitionState(),scope=work.scopes?.[scopeId],signature=task.competition.signature+(scopeId==='main'?'':':'+scopeId);
 if(!scope){if(!work.sketch)work.sketch=LearnerSketch.fresh(signature,scopeId);return work.sketch;}
 if(!scope.sketch)scope.sketch=LearnerSketch.fresh(signature,scopeId);
 if(!learnerSketchValidated.has(scope.sketch)){scope.sketch=LearnerSketch.restore(scope.sketch,signature,scopeId);learnerSketchValidated.add(scope.sketch)}return scope.sketch;
}
function learnerSketchGlyph(n){
 const count=n.count||1,shape='class="competition-shape"',line='class="competition-line"';let art='';
 if(n.kind==='quantity')return '<rect x="-39" y="-34" width="78" height="35" rx="7" '+shape+'/>';
 if(n.kind==='bar'){for(let i=0;i<count;i++)art+='<rect x="'+(-39+i*78/count)+'" y="-31" width="'+(78/count)+'" height="23" '+shape+'/>';return art}
 if(n.kind==='group'||n.kind==='set'||n.kind==='balance'){
  if(n.kind==='set')art+='<ellipse cx="0" cy="-18" rx="43" ry="26" '+shape+'/>';
  if(n.kind==='balance')art+='<path d="M-41-8 L-26 4 H26 L41-8 M0 4 V13 M-23 13 H23" '+line+' fill="none"/>';
  const columns=Math.min(4,count),rows=Math.ceil(count/columns);for(let i=0;i<count;i++)art+='<circle cx="'+((i%columns-(columns-1)/2)*17)+'" cy="'+(-24+Math.floor(i/columns)*13-(rows-1)*3)+'" r="5" '+shape+'/>';return art;
 }
 if(n.kind==='timeline'){art+='<path d="M-40-18 H40 M32-24 L40-18 L32-12" '+line+' fill="none"/>';for(let i=0;i<count;i++)art+='<path d="M'+(-34+i*68/Math.max(1,count-1))+'-24 V-12" '+line+'/>';return art}
 if(n.kind==='table'){
  const rowHeight=Math.min(16,50/(count+1));for(let row=0;row<=count;row++)for(let col=0;col<2;col++)art+='<rect x="'+(-36+col*36)+'" y="'+(-39+row*rowHeight)+'" width="36" height="'+rowHeight+'" fill="'+(row===0?'#c5dfd9':'white')+'" stroke="#286e78"/>';return art;
 }
 if(n.kind==='area'){
  const columns=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/columns),size=Math.min(19,50/rows);
  for(let i=0;i<count;i++)art+='<rect x="'+((i%columns-columns/2)*size)+'" y="'+(-38+Math.floor(i/columns)*size)+'" width="'+size+'" height="'+size+'" '+shape+'/>';return art;
 }
 if(n.kind==='stack'){for(let i=0;i<count;i++){const x=(i%4-1.5)*15,y=-14-Math.floor(i/4)*12;art+='<g data-student-block="true"><path d="M'+x+' '+y+' v-13 l7-5 13 0 v13 l-7 5 z" '+shape+'/><path d="M'+x+' '+(y-13)+' h13 v13 M'+(x+13)+' '+(y-13)+' l7-5" '+line+' fill="none"/></g>'}return art}
 return '';
}
function learnerSketchBindingInputs(task,s,scopeId){
 if(!LearnerSketchSemantics.contract(task,scopeId))return '';
 return `<label>这个图代表题目中的哪个量<input data-learner-sketch-input="quantityInput" value="${esc(s.quantityInput)}" maxlength="40" placeholder="填题目中的量名；也可留空画自由草稿"></label><label>图形怎样表示数量<select data-learner-sketch-input="representationInput"><option value="schematic" ${s.representationInput!=='counted'?'selected':''}>示意，不按图形个数核算</option><option value="counted" ${s.representationInput==='counted'?'selected':''}>按实际图形个数核算</option></select></label><label>每个图形表示多少<input data-learner-sketch-input="scaleInput" value="${esc(s.scaleInput)}" maxlength="40" placeholder="例如每个点表示4人，填4"></label>`;
}
function learnerSketchSemanticPanel(task,s,scopeId,result){
 if(!result.supported)return '<p class="tiny-note">自由草图与计算会保留；这道题的题意关系暂未自动核验。</p>';
 return `<section class="sketch-semantics"><h3>核对我画的数量关系</h3><p>先选输出量，用图中的量名写关系。只连接箭头不代表关系已通过。</p><label>选中量怎样由其他量得到<input data-learner-sketch-input="semanticExpressionInput" maxlength="160" value="${esc(s.semanticExpressionInput)}" placeholder="填写量名与运算，不用再写等号左边"></label><button type="button" class="secondary" data-action="learnerSketchSemanticCheck">核对图中关系</button><ul>${result.rows.map(r=>`<li data-sketch-relation="${esc(r.id)}" data-verification="${r.status}">${esc(s.nodes.find(n=>n.id===r.outputNodeId)?.label||'已移除的量')}：${r.status==='verified'?'量、单位及关系已核验':esc(r.issue)}</li>`).join('')}</ul></section>`;
}
function learnerSketchPanel(task,scopeId='main'){
 const s=learnerSketchState(task,scopeId);if(LearnerSketch.isProtected(s))return `<section class="panel learner-sketch-protected" data-sketch-protected data-sketch-scope="${esc(scopeId)}"><h2>这份草图已保留</h2><p role="status">当前页面暂不能读取这份草图，原始内容已保留。可先导出，再使用支持它的版本继续。</p><button type="button" class="secondary" data-action="learnerSketchExportOriginal">导出保留草图</button><button type="button" class="secondary" data-action="progressExport">导出全部记录</button></section>`;if(!s.open)return '<button type="button" class="secondary" data-scope="'+esc(scopeId)+'" data-action="learnerSketchOpen">自己画一张关系草图</button>';
 const semantic=LearnerSketchSemantics.assess(task,s,scopeId,competitionState().scopes[scopeId]?.model?.relations),arrowId='sketch-arrow-'+scopeId.replace(/[^a-zA-Z0-9_-]/g,'-'),byId=new Map(s.nodes.map(n=>[n.id,n])),height=Math.max(170,...s.nodes.map(n=>n.y+68));
 let art='';for(const e of s.edges){const a=byId.get(e.from),b=byId.get(e.to);if(!a||!b)continue;art+='<path class="competition-line" d="M'+a.x+' '+a.y+' L'+b.x+' '+b.y+'" stroke-dasharray="4 3" marker-end="url(#'+arrowId+')"/>'+ '<text x="'+((a.x+b.x)/2)+'" y="'+((a.y+b.y)/2-7)+'" text-anchor="middle">'+esc(e.label)+'</text>'}
 for(const n of s.nodes){art+='<g transform="translate('+n.x+' '+n.y+')" data-action="learnerSketchSelect" data-model-kind="'+esc(n.kind)+'" data-code="'+esc(n.id)+'" role="button" tabindex="0" aria-label="'+esc(n.label+'，'+(n.value||'未知量')+(n.unit||'')+'，'+({known:'自己标的已知',target:'自己选的目标',conjecture:'待比较的候选',derived:'推导的量'}[n.role]||''))+'"><rect x="-49" y="-46" width="98" height="104" rx="9" fill="white" stroke="'+(n.id===s.selected?'#ba7116':'#bed5d0')+'" stroke-width="'+(n.id===s.selected?3:1)+'"/>'+learnerSketchGlyph(n)+'<text x="-42" y="-40" font-size="9">'+esc({known:'已知',target:'要找',conjecture:'候选',derived:'推导'}[n.role]||'猜测')+'</text>';const lines=n.label.match(/.{1,6}/gu)||[''];lines.slice(0,2).forEach((l,i)=>art+='<text x="0" y="'+(20+i*14)+'" text-anchor="middle">'+esc(l)+'</text>');const v=(n.value||'?')+(n.unit||'');art+='<text x="0" y="49" text-anchor="middle">'+esc(v.length>10?v.slice(0,9)+'…':v)+'</text></g>'}
 return '<section class="learner-sketch panel" data-student-model="draft" data-sketch-scope="'+esc(scopeId)+'"><h2>我的关系草图</h2><p>自己放数量、连关系。图形是示意；份数或物件数由你填写，再核对题目。</p><div class="learner-sketch-scroll"><svg class="competition-diagram learner-sketch-canvas" viewBox="0 0 520 '+height+'" role="img" aria-label="孩子自己搭建的数量草图"><defs><marker id="'+arrowId+'" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="#286e78"/></marker></defs>'+art+'</svg></div><p class="tiny-note">可左右查看草图，也可用下面的数量按钮选择。</p><div class="learner-sketch-inputs"><label>这个量叫什么<input data-learner-sketch-input="labelInput" value="'+esc(s.labelInput)+'" maxlength="40" placeholder="例如红队人数"></label><label>数量或算式<input data-learner-sketch-input="valueInput" value="'+esc(s.valueInput)+'" placeholder="未知时可以留空"></label><label>用什么图形<select data-learner-sketch-input="kindInput">'+[['quantity','数量卡'],['bar','份数条'],['group','分组'],['balance','天平盘'],['set','集合圈'],['timeline','数轴标记'],['table','候选表格'],['area','面积格'],['stack','立体块']].map(([id,name])=>'<option value="'+id+'" '+(s.kindInput===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label><label>图中份数或物件数<input data-learner-sketch-input="countInput" type="text" inputmode="numeric" value="'+esc(s.countInput)+'" maxlength="2"></label><label>单位<input data-learner-sketch-input="unitInput" value="'+esc(s.unitInput)+'" maxlength="12" placeholder="例如人、厘米"></label><label>这个量的作用<select data-learner-sketch-input="roleInput">'+[['known','已知条件'],['target','我要找的量'],['derived','由关系推导的量'],['conjecture','待比较的候选或猜测']].map(([id,name])=>'<option value="'+id+'" '+(s.roleInput===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'+learnerSketchBindingInputs(task,s,scopeId)+'<button class="secondary" data-action="learnerSketchAdd">放进草图</button><button class="secondary" data-action="learnerSketchUpdate">更新选中的量</button></div><div class="stage-buttons">'+s.nodes.map(n=>'<button class="secondary" data-action="learnerSketchSelect" data-code="'+esc(n.id)+'" aria-pressed="'+(s.selected===n.id)+'">'+esc(n.label)+'</button>').join('')+'</div><p>'+ (s.linkFrom?'已选连线起点，请选择另一个量。':'先选择一个量，再点连线。')+'</p><label>关系<select data-learner-sketch-input="relationInput">'+['关联','=','+','−','×','÷'].map(id=>'<option value="'+id+'" '+(s.relationInput===id?'selected':'')+'>'+id+'</option>').join('')+'</select></label><button class="secondary" data-action="learnerSketchLink">从选中量连线</button><div class="stage-buttons"><button class="secondary" data-action="learnerSketchMove" data-code="left">←</button><button class="secondary" data-action="learnerSketchMove" data-code="right">→</button><button class="secondary" data-action="learnerSketchMove" data-code="up">↑</button><button class="secondary" data-action="learnerSketchMove" data-code="down">↓</button><button class="secondary" data-action="learnerSketchRemove">移除选中的量</button><button class="secondary" data-action="learnerSketchUndo">撤回一步</button><button class="secondary" data-action="learnerSketchRedo">重做一步</button></div><label>这个量的计算<input data-learner-sketch-input="expressionInput" value="'+esc(s.expressionInput)+'" placeholder="写出你的算式"></label><button class="secondary" data-action="learnerSketchCheck">核对计算</button>'+learnerSketchSemanticPanel(task,s,scopeId,semantic)+(s.feedback?'<p role="status">'+esc(s.feedback)+'</p>':'')+'<button class="secondary" data-action="learnerSketchClose">收起，保留草图</button></section>';
}
function learnerSketchHandleInput(target){const key=target.dataset?.learnerSketchInput;if(!key||!['labelInput','valueInput','expressionInput','kindInput','relationInput','countInput','unitInput','roleInput','quantityInput','representationInput','scaleInput','semanticExpressionInput'].includes(key)||view!=='competition')return false;const s=learnerSketchState(playerTask(),target.closest?.('[data-sketch-scope]')?.dataset.sketchScope||'main');if(LearnerSketch.isProtected(s))return true;s[key]=String(target.value).slice(0,key==='labelInput'?40:160);persist();return true}
function learnerSketchHandleAction(action,data){
 if(!action.startsWith('learnerSketch'))return false;if(view!=='competition'||!playerTask()?.competition)return true;if(!topicRequireCurrentScope())return true;const task=playerTask(),scopeId=data.scope||'main',work=competitionState(),s=learnerSketchState(task,scopeId);
 if(LearnerSketch.isProtected(s)){if(action==='learnerSketchExportOriginal'&&typeof document.createElement==='function'){const url=URL.createObjectURL(new Blob([JSON.stringify(LearnerSketch.original(s),null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='tianle-sketch-preserved-'+Date.now()+'.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}return true;}
 if(action==='learnerSketchOpen'){s.open=true;LearnerSketch.event(s,'scratch-open')}
 if(action==='learnerSketchClose')s.open=false;
 if(action==='learnerSketchAdd')LearnerSketch.add(s);
 if(action==='learnerSketchSelect')LearnerSketch.link(s,data.code,s.relationInput);
 if(action==='learnerSketchUpdate')LearnerSketch.update(s);
 if(action==='learnerSketchLink'){s.linkFrom=s.selected;s.feedback=s.selected?'选择要连接的另一个量。':'先选一个量作为起点。';}
 if(action==='learnerSketchRemove')LearnerSketch.remove(s);
 if(action==='learnerSketchUndo')LearnerSketch.undo(s);
 if(action==='learnerSketchRedo')LearnerSketch.redo(s);
 if(action==='learnerSketchCheck')LearnerSketch.calculate(s);
 if(action==='learnerSketchSemanticCheck'){LearnerSketch.remember(s);LearnerSketchSemantics.check(task,s,scopeId,work.scopes[scopeId]?.model?.relations)}
 if(action==='learnerSketchMove'){const delta={left:[-20,0],right:[20,0],up:[0,-20],down:[0,20]}[data.code];if(delta)LearnerSketch.move(s,...delta)}
 if(['learnerSketchAdd','learnerSketchUpdate','learnerSketchRemove','learnerSketchUndo','learnerSketchRedo','learnerSketchSemanticCheck'].includes(action)){const scope=work.scopes[scopeId];scope.modelRevision=(scope.modelRevision||0)+1;if(action!=='learnerSketchSemanticCheck'||s.semanticModelChanged)scope.model.candidateProof=null;}
 CompetitionModelWorkspace.assess(task,work,scopeId);persist();render();return true;
}

'use strict';
// A shared entry point keeps existing route renderers and task identities.
// Adapters continue to own real actions, state, grading and speech.
function practicePlayerPage(){const task=PRACTICE_BANKS[view]?.[microSkillId],node=NODE_BY_ID.get(microSkillId);if(!task||!node)return '<div class="panel">请选择一个操作任务。</div>';return `<div class="page-head"><div><p class="kicker">${task.skillId} · 练</p><h1>${esc(node.concept)}</h1></div><button class="back" data-action="network" data-code="${task.skillId}">← 相关知识</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到相关知识 →':'检查操作与理由 ✓'}</button></div>${taskBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>把思路连起来</h3><button class="secondary" data-action="learn" data-code="${task.skillId}">回看概念与条件</button><button class="secondary" data-action="demo" data-code="${task.skillId}">看另一道例子</button><button class="secondary" data-action="network" data-code="${task.skillId}">相关知识与后续新题</button></section></aside></div>`}
const TASK_PLAYERS={
 periodicReview:{page:()=>PeriodicPracticeUI.page(),readOnly:true},
 examMapping:{page:()=>ExamMappingUI.page(),readOnly:true},
 competition:{page:()=>competitionQuestionPage(),task:()=>topicActive?topicDescriptor(topicCurrent())?.task:null},
 competitionRecords:{page:()=>competitionRecordsPage(),readOnly:true},
 ...Object.fromEntries(Object.keys(PRACTICE_BANKS).map(name=>[name,{page:()=>practicePlayerPage(),task:()=>PRACTICE_BANKS[name][microSkillId]}])),
 joint:{page:()=>jointPage(),task:()=>jointAccess(jointTaskId).allowed?JOINT_TASKS[jointTaskId]:null},
 fruit:{page:()=>fruitPage(),task:()=>FRUIT_TASKS[saved.fruitCursor]},
 course:{page:()=>coursePage(),task:()=>COURSES[courseCode]?.steps[courseRecord(courseCode).cursor]},
 transfer:{page:()=>transferPage(),task:()=>FOCUS_REVIEW[courseCode]?.[reviewRecord(courseCode)?.cursor]},
 sample:{page:()=>samplePage(),task:()=>SAMPLE_TASKS[sampleCode]},
 stage:{page:()=>stagePage(),task:()=>stageAccess(stageSkillId,stageKind).allowed?STAGED_TASKS[stageSkillId]?.[stageKind]:null},
 micro:{page:()=>microPage(),task:()=>MICRO_TASKS[microSkillId]},
 learn:{page:()=>learningPage(),task:()=>LEARNING_TASKS[microSkillId],readOnly:true},
 demo:{page:()=>demoPage(),task:()=>DEMO_TASKS[demoSkillId],readOnly:true},
 network:{page:()=>networkPage(),task:()=>LEARNING_TASKS[networkSkillId],readOnly:true},
 catalog:{page:()=>catalogPageHtml(),readOnly:true},progress:{page:()=>progressPage(),readOnly:true},skillMap:{page:()=>skillMapPage(),readOnly:true},
 knowledge:{page:()=>knowledgeHome(),readOnly:true},topicSummary:{page:()=>topicSummaryPage(),readOnly:true}
};
function playerPage(){if(topicSessionMatches())return competitionQuestionPage();return TASK_PLAYERS[view]?.page()||home()}
function playerTask(){return TASK_PLAYERS[view]?.task?.()||null}

'use strict';
function sourceSelectionPanel(topicIds,availability=null){
 const state=saved.topicPractice,sourceIds=state.sourceIds||['AMC8'],excluded=state.excludedSkillIds||[],pool=SourceCatalog.eligible(COMPETITION_REVIEWED,{topicIds,sourceIds,maxCalculationLoad:state.maxCalculationLoad,maxReadingLoad:state.maxReadingLoad,excludedSkillIds:excluded,examIds:state.examIds||[]}).filter(f=>!ExamMappingUI.childEntryEnabled()||f.sourceId!=='AMC8'),skills=SKILL_DATA.skills.filter(s=>topicIds.includes(s.unitId));
 const connected=ExamMappingUI.enabled()&&ExamMappingUI.connectedAvailability()>0;
 const examPicker=ExamMappingUI.enabled()?sourceFullExamPicker(state):'<p>首批真题结构：</p><div class="stage-buttons">'+Object.values(SourceCatalog.definitions).filter(d=>d.examId).map(d=>`<button class="secondary" data-action="sourceExamToggle" data-code="${d.examId}" aria-pressed="${(state.examIds||[]).includes(d.examId)}">${(state.examIds||[]).includes(d.examId)?'✓ ':''}${d.examId}</button>`).join('')+'</div>';
 return `<section class="panel source-selection"><h2>参考来源</h2><div class="source-choices">${SourceCatalog.banks.map(bank=>{const {id,title:name}=bank;return `<button class="secondary" data-action="sourceToggle" data-code="${id}" aria-pressed="${sourceIds.includes(id)}" ${bank.enabled?'':'disabled'}>${sourceIds.includes(id)?'✓ ':''}${name}${bank.enabled?'':' · 资料待补'}</button>`}).join('')}</div><p role="status">${connected?'当前选择可在练习中自动衔接通过题目形式审核的真题。':'当前范围有 '+pool.length+' 个可用结构配置。'}${!pool.length&&!connected?'暂无匹配。'+esc(availability?.message||SourceCatalog.explain(COMPETITION_REVIEWED,{...state,topicIds}).message)+'':''}</p>${feedback?.ok===false?`<p role="status">${esc(feedback.text)}</p>`:''}<details><summary>细化已掌握知识 / 指定真题</summary>${sourceLoadControls(state)}<p>勾选主题表示你或家长声明其中小项已学会；可取消尚未学过的小项。开始和继续都会核验当前选择；旧首答、提示与草稿始终保留。系统不会自动勾选前置知识。</p><div class="stage-buttons">${skills.map(s=>`<button class="secondary" data-action="sourceSkillToggle" data-code="${s.id}" aria-pressed="${!excluded.includes(s.id)}">${!excluded.includes(s.id)?'✓ ':''}${esc(s.title)}</button>`).join('')}</div>${examPicker}<button class="secondary" data-action="sourceExamClear">${ExamMappingUI.enabled()?'按已选知识自动安排（不限题号）':'使用全部已验证真题结构'}</button></details></section>`;
}
function sourceSelectionAction(action,data){
 if(!action.startsWith('source'))return false;if(view!=='home')return true;if(!parentMathEdit){feedback={ok:false,text:'请家长先确认调整已学知识和选题设置。'};render();return true}const s=saved.topicPractice;
 if(action==='sourceToggle'&&SourceCatalog.banks.some(b=>b.id===data.code&&b.enabled)){const set=new Set(s.sourceIds||['AMC8']);set.has(data.code)?set.delete(data.code):set.add(data.code);s.sourceIds=[...set]}
 if(action==='sourceAddOriginal')s.sourceIds=[...new Set([...(s.sourceIds||[]),'original'])];
 if(action==='sourceLoadReset'){s.maxCalculationLoad=null;s.maxReadingLoad=null;}
 if(action==='sourceSkillToggle'&&SKILL_DATA.skills.some(x=>x.id===data.code)){const set=new Set(s.excludedSkillIds||[]);set.has(data.code)?set.delete(data.code):set.add(data.code);s.excludedSkillIds=[...set]}
 if(action==='sourceExamToggle'&&((s.examIds||[]).includes(data.code)||Object.values(SourceCatalog.definitions).some(x=>x.examId===data.code)||ExamMappingUI.enabled()&&ExamMapping.data.problems[data.code])){const set=new Set(s.examIds||[]);set.has(data.code)?set.delete(data.code):set.add(data.code);s.examIds=[...set]}
 if(action==='sourceLoad'&&['calculation','reading'].includes(data.code)&&[1,2,3].includes(Number(data.index)))s[data.code==='calculation'?'maxCalculationLoad':'maxReadingLoad']=Number(data.index)===3?null:Number(data.index);
 if(action==='sourceExamClear')s.examIds=[];feedback=null;persist();render();return true;
}

function sourceFullExamPicker(state){
 const selected=state.examIds||[],problems=Object.values(ExamMapping.data.registeredProblems||ExamMapping.data.problems),years=[...new Set(problems.map(p=>p.year))].sort((a,b)=>b-a);
 return '<p>通常按已选知识自动安排；家长也可指定题号，知识、负担和题目形式检查仍须通过。新导入且待映射的题目会显示在清单中，完成审核后开放。</p><label>添加或取消指定真题 <select data-source-exam-picker aria-label="指定真题"><option value="">选择年份和题号</option>'+years.map(year=>'<optgroup label="'+year+'">'+problems.filter(p=>p.year===year).sort((a,b)=>a.problemNumber-b.problemNumber).map(p=>{const mapped=ExamMapping.data.problems[p.examId],label=!mapped?'资料已导入 · 映射待编写':mapped.status.runtimeStatus!=='eligible'?'知识限制':ChildReviewStatus.label(ConnectedLearning.review(mapped));return '<option value="'+p.examId+'"'+(!mapped?' disabled':'')+'>'+(selected.includes(p.examId)?'✓ ':'')+p.examId+' · '+esc(label)+'</option>'}).join('')+'</optgroup>').join('')+'</select></label><div class="stage-buttons">'+selected.map(id=>'<button class="secondary" data-action="sourceExamToggle" data-code="'+esc(id)+'" aria-pressed="true">✓ '+esc(id)+' ×</button>').join('')+'</div>';
}
document.addEventListener('change',e=>{if(e.target.dataset?.sourceExamPicker!==undefined&&e.target.value)sourceSelectionAction('sourceExamToggle',{code:e.target.value})});

function sourceLoadControls(state){
 return '<div class="source-load-controls">'+[['calculation','计算量','maxCalculationLoad',['少算一点','适中','不限']],['reading','阅读量','maxReadingLoad',['简短','适中','不限']]].map(([code,label,key,labels])=>'<p><b>'+label+'</b> <span class="stage-buttons">'+labels.map((name,i)=>'<button class="secondary" data-action="sourceLoad" data-code="'+code+'" data-index="'+(i+1)+'" aria-pressed="'+((state[key]||3)===i+1)+'">'+name+'</button>').join('')+'</span></p>').join('')+'<p>这两项分别限制计算和阅读负担，关键思路难度仍单独调整。没有合格题时会说明原因。</p></div>';
}

'use strict';
let topicActive=false,topicOpening=false;
function topicIds(ids){const chosen=new Set(Array.isArray(ids)?ids:[]);return SKILL_DATA.units.filter(u=>chosen.has(u.id)).map(u=>u.id)}
function topicTaskKey(task){return taskVersion(task)+':'+task.id}
function topicTaskRegions(task){if(task.competition)return [...task.competition.topicIds];const ids=task.joint?[...task.joint.targetNodeIds,...task.joint.supportNodeIds]:[task.skillId];return [...new Set(ids.map(id=>NODE_BY_ID.get(id)?.regionId).filter(Boolean))]}
function topicDescriptor(item){
 if(item?.view!=='competition')return null;
 try{const task=competitionCreate(item.recipe);return {view:'competition',code:task.id,task}}catch{return null}
}
function topicRestoreDraft(value){
 const restored=freshDraft();if(!value||typeof value!=='object')return restored;
 if(Number.isInteger(value.choice)&&value.choice>=-1&&value.choice<5)restored.choice=value.choice;
 if(Number.isFinite(value.startedAt)&&value.startedAt>0)restored.startedAt=value.startedAt;
 restored.work=competitionRestoreWork(value.work);if(restored.work.eliminated.includes(restored.choice))restored.choice=-1;return restored;
}
function topicRestoreState(old){
 const state={maxCalculationLoad:[1,2].includes(old?.maxCalculationLoad)?old.maxCalculationLoad:null,maxReadingLoad:[1,2].includes(old?.maxReadingLoad)?old.maxReadingLoad:null,sourceIds:Array.isArray(old?.sourceIds)?old.sourceIds.filter(x=>SourceCatalog.banks.some(b=>b.id===x)):['AMC8'],examIds:Array.isArray(old?.examIds)?old.examIds.filter(x=>/^AMC8-\d{4}-\d{2}$/.test(x)):[],excludedSkillIds:Array.isArray(old?.excludedSkillIds)?old.excludedSkillIds.filter(x=>SKILL_DATA.skills.some(s=>s.id===x)):[],selectedTopicIds:topicIds(old?.selectedTopicIds),session:null,nextSeed:Number.isInteger(old?.nextSeed)&&old.nextSeed>0&&old.nextSeed<=2147483647?old.nextSeed:1,legacySession:null};
 const source=old?.session;
 // Preserve the old navigation snapshot without resuming isolated lessons.
 const legacy=source&&source.mode!=='competition-v2'?source:old?.legacySession;
 if(legacy&&typeof legacy==='object'&&JSON.stringify(legacy).length<500000)state.legacySession=legacy;
 if(source?.mode!=='competition-v2')return state;
 const ids=topicIds(source.topicIds);if(!ids.length||!Array.isArray(source.items)||!source.items.length||source.items.length>66)return state;
 const items=[],signatures=new Set();
 for(const row of source.items){
  const d=topicDescriptor(row),task=d?.task,c=task?.competition;
  if(!task||![2,3,4].includes(c.recipe.engine)||row.taskId!==task.id||row.code!==task.id||row.contentVersion!==task.contentVersion||!Number.isFinite(row.openedAt)||row.openedAt<=0||(!SourceCatalog.teachingScope(task,{...source,topicIds:ids})&&!c.topicIds.every(id=>ids.includes(id)))||signatures.has(c.signature))return state;
  signatures.add(c.signature);
  const solved=saved.competition.views[competitionHash(c.signature)]?.solved;
  const passed=solved?.correct===true&&solved.sessionId===source.id&&solved.at>=row.openedAt||saved.competition.attempts.some(a=>a.signature===c.signature&&a.sessionId===source.id&&a.correct&&a.at>=row.openedAt);
  const restoredDraft=topicRestoreDraft(row.draft),free=c.family==='threeGroupBalance'||c.integrated,input=free&&(restoredDraft.work?.scopes?.main?.reasoning?.signature===c.signature||restoredDraft.work?.reasoning?.signature===c.signature)?String(restoredDraft.work.scopes?.main?.input?.raw??restoredDraft.work.reasoning?.finalInput??''):!free&&restoredDraft.choice>=0?task.options[restoredDraft.choice]:'';
  const checked=SubmissionContract.numeric(input,c.answer);let restoredFeedback=passed&&checked.ok?{ok:true,status:'correct',text:'这题已经答对，可以比较解法或继续。'}:null;
  if(row.feedback?.ok===false){if(checked.recordAttempt&&!checked.ok)restoredFeedback={ok:false,status:'needs_revision',text:competitionDirectedFeedback(task,input)};else if(!checked.recordAttempt&&row.feedback.status===checked.status)restoredFeedback=checked;}
  items.push({view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:c.recipe,openedAt:row.openedAt,passed,skipped:row.skipped===true,autoExcluded:row.autoExcluded===true&&CompetitionIdentity.solved(saved.competition,task),skipReason:row.skipReason==='previously_solved'?'previously_solved':null,draft:restoredDraft,feedback:restoredFeedback});
 }
 const first=items.findIndex(i=>!i.passed&&!i.skipped),limit=first<0?items.length-1:first;
 const declared=SourceCatalog.profile({...source,topicIds:ids,excludedSkillIds:Array.isArray(source.excludedSkillIds)?source.excludedSkillIds:[]});
 state.session={...declared,mode:'competition-v2',profileOrigin:source.profileVersion===1?'saved-declaration':'legacy-topic-declaration',id:typeof source.id==='string'?source.id.slice(0,100):'restored',planSeed:Number.isInteger(source.planSeed)&&source.planSeed>0?source.planSeed:1,total:Math.max(items.length,Math.min(66,Number.isInteger(source.total)?source.total:10)),cursor:Math.max(0,Math.min(limit,Number.isInteger(source.cursor)?source.cursor:limit)),...(source.periodic?.kind==='biweekly'&&typeof source.periodic.cycleId==='string'?{periodic:{kind:'biweekly',cycleId:source.periodic.cycleId.slice(0,100),startedAt:source.periodic.startedAt,newOnly:true}}:{}),items,exhausted:source.exhausted===true,selectionStatus:source.selectionStatus&&['FOUND','SEARCH_BUDGET_REACHED','NO_ELIGIBLE_SCOPE'].includes(source.selectionStatus.code)?{code:source.selectionStatus.code}:null};return state;
}
function topicSession(){return saved.topicPractice?.session||null}
function topicLegacyExamSession(session=topicSession()){return topicDescriptor(session?.items?.[session.cursor])?.task?.competition?.sourceProvenance?.sourceId==='AMC8'}
function topicSessionSettings(session=topicSession()){
 if(window.AMC8_QA&&session?.id?.startsWith('qa-'))return SourceCatalog.profile(session);
 return SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds});
}
function topicCurrentEligibility(){
 const task=topicDescriptor(topicCurrent())?.task;if(!task)return {eligible:false,reasonCodes:['NO_CURRENT_TASK']};
 const result=SourceCatalog.taskEligibility(task,topicSessionSettings()),c=task.competition;
 const validation=window.AMC8_QA&&topicSession()?.id?.startsWith('qa-')&&c.qaValidation===true&&c.sourceProvenance?.productionEnabled===false&&ValidationRuntime.catalog.some(f=>f.id===c.family);
 if(validation){result.reasonCodes=result.reasonCodes.filter(code=>code!=='SOURCE_NOT_SELECTED');result.eligible=result.reasonCodes.length===0;result.qaOnlyValidation=true}
 return result;
}
function topicPauseForScope(){
 topicActive=false;open('home');feedback={ok:false,status:'retained_scope_paused',text:'这道保留题目前不符合家长当前选择的知识、来源或负担范围，已暂停。原首答、提示和草稿都保留；可以调整已掌握范围后继续，或只读回看历史。'};persist();render();return false;
}
function topicRequireCurrentScope(){
 if(!canPersist||['read_only','conflict'].includes(progressStore.getStatus())){feedback={ok:false,status:'retained_storage_paused',text:'当前记录暂不能写入，已暂停作答和提示。原首答、帮助及本页草稿都保留，可以先导出再刷新。'};render();return false;}
 if(topicCurrentEligibility().eligible)return true;
 if(window.AMC8_QA&&topicSession()?.id?.startsWith('qa-')){feedback={ok:false,status:'unsupported_scope',text:'当前QA声明不包含这道题的完整知识、来源或负担范围；不授作答或帮助证据。'};render();return false;}
 topicCaptureDraft();return topicPauseForScope();
}
function topicCurrent(){const s=topicSession();return s?.items[s.cursor]||null}
function topicFrontier(){const s=topicSession();if(!s)return 0;const i=s.items.findIndex(row=>!row.passed&&!row.skipped&&!row.autoExcluded);return i<0?s.items.length:i}
function topicSessionMatches(){const item=topicCurrent();return !!topicActive&&view==='competition'&&!!item&&item.view===view&&!!topicDescriptor(item)}
function topicCaptureDraft(){if(topicOpening||!topicSessionMatches())return;const item=topicCurrent();item.draft=JSON.parse(JSON.stringify(draft));item.feedback=feedback?{ok:feedback.ok===true,status:feedback.status,text:String(feedback.text||'')}:null}
function topicPickNext(session,options={}){
 const tasks=session.items.map(row=>topicDescriptor(row).task),used=new Set(tasks.map(t=>CompetitionIdentity.key(t))),solved=CompetitionIdentity.solvedKeys(saved.competition),seen=new Set([...CompetitionIdentity.index(saved.competition).values()].filter(h=>options.challengeLevel||session.periodic?.newOnly||h.attempted||h.hinted||h.solutionViewed).map(h=>h.key));
 // Prefer different problem structures and perspectives. No topic quotas.
 const profile=competitionAdaptiveProfile(saved.competition.attempts,saved.competition.extensions,session.topicIds,saved.competition.extensionViews,saved.competition.views);
 const settings=topicSessionSettings(session),families=competitionShuffle(SourceCatalog.eligible(COMPETITION_REVIEWED,settings).filter(f=>(!ExamMappingUI.childEntryEnabled()||f.sourceId!=='AMC8')&&(!options.challengeLevel||f.sourceId!=='AMC8'&&f.level>options.challengeLevel&&f.topicIds.some(id=>settings.topicIds.includes(id)))),competitionRng(session.planSeed+session.items.length));
 const byId=new Map(COMPETITION_REVIEWED.map(f=>[f.id,f])),history=[],historyMath=new Set(used);
 const activity=Object.values(saved.competition.views).filter(h=>h.last).map(h=>({...h.last,signature:h.signature})).concat(saved.competition.attempts).sort((a,b)=>b.at-a.at||(b.order||0)-(a.order||0));
 for(const a of activity){
  const f=byId.get(a.recipe?.familyId);let key;try{const t=competitionCreate(a.recipe);if(t.competition.signature!==a.signature)continue;key=CompetitionIdentity.key(t)}catch{continue}if(!f||historyMath.has(key)||!f.topicIds.every(id=>session.topicIds.includes(id)))continue;
  historyMath.add(key);history.unshift(f);if(history.length===12)break;
 }
 const trail=history.concat(tasks.map(t=>byId.get(t.competition.recipe.familyId)).filter(Boolean));
 const structure=f=>f.selectionReasoningKey||f.reasoningKey||f.strategy,
  poolStructures=new Set(families.map(structure)),sessionStructures=new Set(tasks.map(t=>structure(byId.get(t.competition.recipe.familyId)))),remaining=session.total-tasks.length;
 const lastTwo=tasks.slice(-2).map(t=>structure(byId.get(t.competition.recipe.familyId)));
 const preferNew=poolStructures.size>=5&&sessionStructures.size<5&&remaining<=5-sessionStructures.size;
 const admissible=f=>!(lastTwo.length===2&&lastTwo[0]===lastTwo[1]&&structure(f)===lastTwo[0]&&poolStructures.size>1)&&(!preferNew||!sessionStructures.has(structure(f)));
 const score=f=>{
  const target=competitionAdaptiveTarget(profile,f),count=tasks.filter(t=>t.competition.recipe.familyId===f.id).length;
  let streak=0;for(let i=trail.length-1;i>=0&&trail[i].id===f.id;i--)streak++;
  const canChange=families.some(g=>g.id!==f.id&&g.level<=competitionAdaptiveTarget(profile,g).level);
  // Keep a short reinforcing pair, then prefer another legal perspective.
  // A narrow low-band pool may repeat rather than force a harder question.
  const stayLow=target.band===1&&!target.probe&&f.level>target.level&&families.some(g=>g.level<=competitionAdaptiveTarget(profile,g).level);
  const reasoning=f.selectionReasoningKey||f.reasoningKey||f.strategy,reasoningCount=trail.filter(g=>(g.selectionReasoningKey||g.reasoningKey||g.strategy)===reasoning).length;
  let reasoningStreak=0;for(let i=trail.length-1;i>=0&&(trail[i].selectionReasoningKey||trail[i].reasoningKey||trail[i].strategy)===reasoning;i--)reasoningStreak++;
  const canChangeReasoning=families.some(g=>(g.selectionReasoningKey||g.reasoningKey||g.strategy)!==reasoning&&g.level<=competitionAdaptiveTarget(profile,g).level),loads=CompetitionDesign.familyLoads(f);
  return Math.abs(f.level-target.level)*80+(f.level>target.level?80*(f.level-target.level):0)+(stayLow?10000:0)+count*60+history.filter(g=>g.id===f.id).length*12+reasoningCount*8+(streak>=2&&canChange?100:0)+(reasoningStreak>=2&&canChangeReasoning?180:0)+loads.calculationLoad.level*5+loads.readingLoad.level*3+(f.topicIds.length>1?-4:0);
 };
 families.sort((a,b)=>score(a)-score(b));let repeated=null,generated=0;
 const ordered=[...families.filter(admissible),...families.filter(f=>!admissible(f))];
 for(const family of ordered){
  const candidates=[];
  for(let tries=0;tries<120;tries++){
   const seed=saved.topicPractice.nextSeed;saved.topicPractice.nextSeed=seed>=2147483647?1:seed+1;
   const task=competitionCreate({...competitionReviewedRecipe(family.id,seed),generatorRevision:family.generatorRevision||competitionReviewedRecipe(family.id,seed).generatorRevision,...(family.configurationId?{configurationId:family.configurationId}:{})}),signature=task.competition.signature,mathKey=CompetitionIdentity.key(task),exposure=options.challengeLevel?CompetitionIdentity.exposure(saved.competition,task):null;generated++;if(used.has(mathKey)||solved.has(mathKey)||(options.challengeLevel||session.periodic?.newOnly)&&seen.has(mathKey)||exposure&&(exposure.attempted||exposure.hinted||exposure.solutionViewed||exposure.uncertain||exposure.relatedMethod?.recent)||!SourceCatalog.loadsAllowed(task,settings)||!SourceCatalog.taskAllowed(task,settings).length)continue;
   const item={view:'competition',code:task.id,taskId:task.id,contentVersion:task.contentVersion,recipe:task.competition.recipe,openedAt:Date.now(),passed:false,draft:null,feedback:null};
   candidates.push({item,score:CompetitionDesign.comfort(task.competition),seen:seen.has(mathKey)});
   if(candidates.filter(c=>!c.seen).length>=12)break;
  }
  candidates.sort((a,b)=>Number(a.seen)-Number(b.seen)||a.score-b.score);
  if(candidates.some(c=>!c.seen)){session.selectionStatus={code:'FOUND',generated};return candidates.find(c=>!c.seen).item;}
  if(!options.challengeLevel)repeated??=candidates[0]?.item||null;
 }
 session.selectionStatus={code:repeated?'FOUND':families.length?'SEARCH_BUDGET_REACHED':'NO_ELIGIBLE_SCOPE',generated};
 return repeated;
}
function topicChallengeOffer(){
 const session=topicSession(),item=topicCurrent();
 if(!topicSessionMatches()||!item?.passed||session.cursor!==session.items.length-1||session.items.length>=session.total)return null;
 const recent=session.items.slice(Math.max(0,session.cursor-2),session.cursor+1);
 if(recent.length!==3)return null;
 for(const row of recent){
  const task=topicDescriptor(row)?.task;
  if(!task||!row.passed||row.skipped||row.autoExcluded)return null;
  const first=saved.competition.attempts.find(a=>a.signature===task.competition.signature&&a.sessionId===session.id);
  const exposure=CompetitionIdentity.exposure(saved.competition,task);
  if(!first||first.firstAttempt!==true||first.firstCorrect!==true||first.strategyIndependent!==true||
     first.hinted||first.priorSolutionViewed||first.priorExposureUnknown||exposure.uncertain||!exposure.cleanFirst||
     exposure.first?.signature!==first.signature||exposure.first?.at!==first.at)return null;
 }
 const task=topicDescriptor(item).task,family=COMPETITION_REVIEWED.find(f=>f.id===task.competition.recipe.familyId);
 if(!family||!Number.isFinite(family.level))return null;
 const settings=topicSessionSettings(session);
 const available=SourceCatalog.eligible(COMPETITION_REVIEWED,settings).some(f=>f.sourceId!=='AMC8'&&f.level>family.level&&f.topicIds.some(id=>settings.topicIds.includes(id)));
 return {level:family.level,available};
}
function topicTryChallenge(){
 const offer=topicChallengeOffer(),session=topicSession();if(!offer||!topicRequireCurrentScope())return;
 if(!offer.available){feedback={ok:true,status:'correct',text:'当前已选知识范围暂没有更高阶段的合格题，可以继续当前练习。'};render();return}
 const priorSeed=saved.topicPractice.nextSeed,priorStatus=session.selectionStatus;
 const next=topicPickNext(session,{challengeLevel:offer.level});
 if(!next){saved.topicPractice.nextSeed=priorSeed;session.selectionStatus=priorStatus;feedback={ok:true,status:'correct',text:'当前范围暂没有未见过的合格挑战题，可以继续当前练习。'};render();return}
 topicCaptureDraft();session.items.push(next);session.cursor++;topicOpenCurrent();
}
function topicExcludeSolved(item){
 if(!item||item.passed||item.autoExcluded||topicSession()?.id?.startsWith('qa-'))return !!item?.autoExcluded;
 const task=topicDescriptor(item)?.task;if(!task||!CompetitionIdentity.solved(saved.competition,task))return false;
 item.autoExcluded=true;item.skipped=true;item.skipReason='previously_solved';return true;
}
function topicOpenCurrent(){
 const item=topicCurrent();if(!item||!topicDescriptor(item))return;
 if(!item.passed&&!topicCurrentEligibility().eligible&&!(window.AMC8_QA&&topicSession()?.id?.startsWith('qa-'))){topicPauseForScope();return;}
 const previousDraft=item.draft,previousFeedback=item.feedback;topicActive=true;topicOpening=true;
 try{CompetitionController.invalidate();open('competition',item.code);draft=topicRestoreDraft(previousDraft);CompetitionController.prepare(playerTask());feedback=previousFeedback||((item.passed&&draft.work.scopes.main.answerState==='correct')?{ok:true,status:'correct',text:'这题已有通过记录，可以继续。'}:null)}finally{topicOpening=false}
 persist();render();window.scrollTo({top:0,behavior:'instant'});
}
function topicFinish(){topicActive=true;topicOpening=true;try{open('topicSummary')}finally{topicOpening=false}persist();PeriodicPracticeUI.finishBiweekly(topicSession()?.periodic,topicSession()?.items.length||0);render();window.scrollTo({top:0,behavior:'instant'})}
function topicAdvance(){
 const s=topicSession();if(!s)return;topicExcludeSolved(topicCurrent());if(!topicCurrent()?.passed&&!topicCurrent()?.skipped)return;topicCaptureDraft();
 while(s.cursor+1<s.items.length){s.cursor++;if(topicExcludeSolved(topicCurrent()))continue;topicOpenCurrent();return}
 if(s.items.length>=s.total||s.exhausted){topicFinish();return}
 const next=topicPickNext(s);if(!next){s.exhausted=true;topicFinish();return}s.items.push(next);s.cursor++;topicOpenCurrent();
}
function topicStart(options={}){
 if(!canPersist||progressStore.getStatus()!=='ready'){storageMessage='当前记录暂不能写入，请关闭其他练习页面后重试，或先导出草稿。';syncStorageStatus();return}
 const settings=SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds}),ids=settings.topicIds;if(!ids.length)return;
 if(ExamMappingUI.beginConnected(settings,options))return;
 if(ExamMappingUI.childEntryEnabled()&&!SourceCatalog.eligible(COMPETITION_REVIEWED,settings).some(f=>f.sourceId!=='AMC8')){feedback={ok:false,status:'awaiting_reviewed_problem',text:SourceCatalog.explain(COMPETITION_REVIEWED,settings).code==='unverified_knowledge'?SourceCatalog.explain(COMPETITION_REVIEWED,settings).message:SelectionDiagnostics.explain(settings).message};render();return}
 const s={...settings,profileOrigin:'user-declared',mode:'competition-v2',id:Date.now()+'-'+Math.random().toString(36).slice(2,8),planSeed:saved.topicPractice.nextSeed,total:10,cursor:0,items:[],exhausted:false,...(options.periodic?{periodic:options.periodic}:{})};
 const first=topicPickNext(s);if(!first){feedback={ok:false,status:s.selectionStatus?.code==='SEARCH_BUDGET_REACHED'?'awaiting_new_problem':'awaiting_scope',text:s.selectionStatus?.code==='SEARCH_BUDGET_REACHED'?'本次在已选范围内暂未找到更多未答对的新题，已经答对的题不会重复安排。可以稍后再试，或由家长调整范围。':SourceCatalog.explain(COMPETITION_REVIEWED,{...s,topicIds:ids}).message};render();return;}s.items.push(first);saved.topicPractice.session=s;topicOpenCurrent();
}
function topicResume(){const s=topicSession();if(!s)return;if(ExamMappingUI.childEntryEnabled()&&topicLegacyExamSession(s)){feedback={ok:false,status:'legacy_exam_retained',text:'旧真题草稿已保留在完整记录中，可导出查看。请从首页开始新的练习。'};render();return}const frontier=topicFrontier();s.cursor=Math.min(frontier,s.items.length-1);if(frontier===s.items.length||topicExcludeSolved(topicCurrent())){topicAdvance();return}topicOpenCurrent()}
function topicNames(ids){return ids.map(id=>SKILL_DATA.units.find(u=>u.id===id)?.title||id).join('、')}
function topicSelectionGuidance(availability){
 if(availability.available||!saved.topicPractice.selectedTopicIds.length)return '';
 const p=SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds}),names=new Map(SKILL_DATA.skills.map(s=>[s.id,s.title]));
 const missing=(availability.missingSkillIds||[]).slice(0,8),original=!p.examIds.length&&!p.sourceIds.includes('original')&&SourceCatalog.eligible(COMPETITION_REVIEWED,{...p,sourceIds:['original']}).length>0;
 return `<aside class="selection-guidance" data-selection-reason="${availability.reasonCode||availability.code}" aria-label="选题条件说明"><p><b>为什么暂时不能开始？</b> ${esc(availability.message)}</p>${missing.length?'<p>这条匹配路线涉及的具体小项：</p><ul>'+missing.map(id=>'<li>'+esc(names.get(id)||id)+'</li>').join('')+'</ul>':''}<div class="stage-buttons">${availability.reasonCode==='EXAM_FILTER'?'<button class="secondary" data-action="sourceExamClear">取消指定题号，按知识安排</button>':''}${availability.reasonCode==='LOAD_LIMIT'?'<button class="secondary" data-action="sourceLoadReset">调整为不限计算量与阅读量</button>':''}${original?'<button class="secondary" data-action="sourceAddOriginal">开启范围内的原创拓展题</button>':''}<button class="secondary" data-action="knowledge">查看知识地图</button></div><p>不会自动勾选未学知识，也不会用已做对的题凑数。</p></aside>`;
}
function topicSelectionPage(){
 const selected=topicIds(saved.topicPractice.selectedTopicIds),session=topicSession(),unfinished=session&&(!ExamMappingUI.childEntryEnabled()||!topicLegacyExamSession(session))&&(topicFrontier()<session.items.length||session.items.length<session.total&&!session.exhausted);
 const availability=SourceCatalog.explain(COMPETITION_REVIEWED,{...saved.topicPractice,topicIds:selected});
 const connected=ExamMappingUI.connectedStatus(),resumeConnected=connected?.status==='active',connectedCount=selected.length?ExamMappingUI.connectedAvailability():0;
 if(connectedCount){availability.available=true;availability.code='CONNECTED_SUPPLY';availability.message='已选范围可衔接真题。先把相关判断和条件变化想清楚，再在同一组里试真题。'}
 else if(ExamMappingUI.childEntryEnabled()&&!SourceCatalog.eligible(COMPETITION_REVIEWED,{...saved.topicPractice,topicIds:selected}).some(f=>f.sourceId!=='AMC8')){availability.available=false;availability.code='NO_REVIEWED_CONNECTED_SUPPLY';Object.assign(availability,SelectionDiagnostics.explain());}
 return `<section class="topic-selection"><div class="topic-intro"><h1>今天想练什么？</h1><p>由家长确认后选择孩子已经学过的主题；孩子可以在已选范围里开始练习。</p><button class="secondary" data-action="topicParentUnlock" aria-pressed="${parentMathEdit}">${parentMathEdit?'锁定选题设置':'我是家长，确认调整选题设置'}</button><p class="tiny-note">这是本机防误操作，离开选题页后会重新锁定。</p></div><div class="topic-start"><div class="topic-selection-status" role="status" aria-live="polite">${selected.length?'已选 '+selected.length+' 个主题：'+esc(topicNames(selected)):'先点选下面的主题'}</div><p class="topic-availability" data-pool-status="${availability.code}" role="status" aria-live="polite">${esc(availability.message)}</p><div class="topic-start-actions"><button class="primary" data-action="topicStart" ${availability.available?'':'disabled'}>开始做题 →</button>${selected.length?'<button class="secondary" data-action="topicClear" '+(parentMathEdit?'':'disabled')+'>清空选择</button>':''}</div></div>${topicSelectionGuidance(availability)}${resumeConnected?`<section class="topic-resume"><div><b>上次的练习</b><p>已进入 ${connected.attemptIds.length}/${connected.total} 题，草稿和提示已保存。</p><p>继续前会按家长当前选择重新核验；原首答、提示和草稿保留。</p></div><button class="secondary" data-action="rtmConnectedResume">继续上次 →</button></section>`:''}${unfinished&&!resumeConnected?`<section class="topic-resume"><div><b>上次的挑战</b><p>${esc(topicNames(session.topicIds))} · 已完成 ${session.items.filter(i=>i.passed).length}/${session.total} 题</p><p>继续前会核验当前选择的知识、来源和负担；不符合时暂停，原记录保留。</p></div><button class="secondary" data-action="topicResume">继续上次 →</button></section>`:''}${PeriodicPracticeUI.home()}<fieldset class="topic-settings" style="border:0;padding:0;margin:0;min-width:0" ${parentMathEdit?'':'disabled'}><legend>家长选择已学范围</legend><div class="topic-groups">${FAMILIES.map(([prefix,name,icon])=>`<section class="topic-group"><h2><span aria-hidden="true">${icon}</span> ${name}</h2><div class="topic-choices">${SKILL_DATA.units.filter(u=>u.id.startsWith(prefix)).map(u=>`<button class="topic-choice" type="button" data-action="topicSelect" data-code="${u.id}" aria-pressed="${selected.includes(u.id)}"><span>${esc(u.title)}</span><span class="topic-selected-mark" aria-hidden="true">${selected.includes(u.id)?'✓':'＋'}</span></button>`).join('')}</div></section>`).join('')}</div>${sourceSelectionPanel(selected,availability)}</fieldset><div class="topic-footer-actions"><span>${selected.length?'出题范围：'+selected.length+' 个主题 · 每组最多 10 题':'选择主题后开始'}</span><button class="primary" data-action="topicStart" ${availability.available?'':'disabled'}>开始做题 →</button></div><details class="panel topic-parent"><summary>家长查看</summary><div class="stage-buttons"><button class="secondary" data-action="progress">查看全部学习记录</button>${ExamMappingUI.enabled()?'<button class="secondary" data-action="rtmOpen">真题准备与作答记录</button>':''}<button class="secondary" data-action="competitionRecords">竞赛练习记录</button><button class="secondary" data-action="knowledge">知识地图与联系</button><button class="secondary" data-action="catalog">历年题目索引</button></div><p>勾选的是知识范围，每题可用其中一个或几个自然相关的主题。不要求每题用完所选主题，也不强求一组全部覆盖。题目重在关键推理、巧解和条件变化，直接开始，原有学习记录保留。</p></details></section>`;
}
function topicSummaryPage(){
 const s=topicSession();if(!s)return topicSelectionPage();const completed=s.items.filter(i=>i.passed).length,firstKeys=new Set();for(const row of s.items){const t=topicDescriptor(row).task,g=CompetitionIdentity.exposure(saved.competition,t),h=g.first;if(g.cleanFirst&&h?.kind==='main'&&h.sessionId===s.id&&h.at>=row.openedAt)firstKeys.add(g.key)}const first=firstKeys.size;
 return `<section class="panel completed topic-summary"><div class="award" aria-hidden="true">✓</div><h1>${s.exhausted?'这组先做到这里':'这组挑战完成了'}</h1>${s.periodic?.kind==='biweekly'?'<p data-periodic-shortage>双周新题：本次安排 '+s.items.length+'/10 道。'+(s.items.length<10?'当前范围内本次未找到更多合格新实例；不加入已做题或未学题凑数。':'')+'</p>':''}<p>${esc(topicNames(s.topicIds))}</p>${s.exhausted?'<p>本次在已选范围内暂未找到更多未答对的新题，已经答对的题不会重复安排。</p>':''}<p>完成 ${completed} 道题，跳过 ${s.items.filter(i=>i.skipped&&!i.passed&&!i.autoExcluded).length} 道，${first} 道未用提示首答正确。</p><div class="hero-cta"><button class="primary" data-action="topicStart">再来一组 →</button><button class="secondary" data-action="topicExit">换主题</button><button class="secondary" data-action="topicPrevious">回看上一题</button><button class="secondary" data-action="progress">家长查看学习记录</button></div></section>`;
}
function topicHandleAction(action,data){
 if(action==='topicParentUnlock'){if(view==='home'&&!homePortal){parentMathEdit=!parentMathEdit;feedback=null;render()}return true}
 if(['topicSelect','topicClear'].includes(action)&&!parentMathEdit){feedback={ok:false,text:'请家长先确认调整已学知识和选题设置。'};render();return true}
 if(sourceSelectionAction(action,data))return true;
 if(action==='topicSelect'){if(view!=='home'||!SKILL_DATA.units.some(u=>u.id===data.code))return true;const chosen=new Set(saved.topicPractice.selectedTopicIds);chosen.has(data.code)?chosen.delete(data.code):chosen.add(data.code);saved.topicPractice.selectedTopicIds=topicIds([...chosen]);feedback=null;persist();render();return true}
 if(action==='topicClear'){if(view==='home'){saved.topicPractice.selectedTopicIds=[];persist();render()}return true}
 if(action==='topicStart'){if(view==='home'||view==='topicSummary')topicStart();return true}
 if(action==='topicResume'){if(view==='home')topicResume();return true}
 if(action==='topicExit'){topicCaptureDraft();topicActive=false;persist();open('home');return true}
 if(action==='topicPrevious'){if(!topicActive||!topicSession())return true;const s=topicSession();topicCaptureDraft();if(view==='topicSummary')s.cursor=s.items.length-1;else if(s.cursor>0)s.cursor--;else return true;topicOpenCurrent();return true}
 if(action==='topicChallenge'){topicTryChallenge();return true}
 if(action==='topicSkip'&&topicSessionMatches()){const row=topicCurrent();row.skipped=true;ReasoningSession.event(reasoningState().state,'skip');topicCaptureDraft();persist();topicAdvance();return true}
 if(action==='next'&&topicSessionMatches()){topicAdvance();return true}
 return false;
}

'use strict';
// Local calendar and evidence records. A wrong-answer count is never a diagnosis.
const PeriodicPractice=(()=>{
 const DAY=86400000,copy=x=>JSON.parse(JSON.stringify(x));
 function restore(raw,firstAt,now=Date.now()){
  if(raw&&raw.schema!==1)return copy(raw);
  if(raw){const next=copy(raw);if(clock(raw,now).ok)next.lastObservedAt=now;return next;}
  const start=Number.isFinite(firstAt)&&firstAt>0?firstAt:now;
  return {schema:1,startedAt:start,lastObservedAt:Math.max(start,now),biweeklyCompletedAt:null,monthlyCompletedAt:null,probeResponses:[],confirmations:[],reviews:[],probe:null};
 }
 function clock(s,now){
  if(s?.schema!==1)return {ok:false,reason:'记录格式暂不能核验'};
  if(!['probeResponses','confirmations','reviews'].every(k=>Array.isArray(s[k])&&s[k].every(r=>r&&typeof r==='object'&&!Array.isArray(r)))||s.probe!==null&&(!s.probe||typeof s.probe!=='object'||Array.isArray(s.probe)))return {ok:false,reason:'复习记录结构暂不能核验，原记录保留'};
  if(!Number.isFinite(now)||!Number.isFinite(s.startedAt)||s.startedAt<=0||!Number.isFinite(s.lastObservedAt)||now<s.lastObservedAt||now<s.startedAt)return {ok:false,reason:'本地日期未知或发生回拨，暂不判断到期'};
  return {ok:true};
 }
 function due(s,kind,now=Date.now()){
  const c=clock(s,now);if(!c.ok)return {due:false,reason:c.reason};
  const field=kind==='biweekly'?'biweeklyCompletedAt':'monthlyCompletedAt',days=kind==='biweekly'?14:30;
  const anchor=s[field]===null||s[field]===undefined?s.startedAt:s[field];
  if(!Number.isFinite(anchor)||anchor>s.lastObservedAt)return {due:false,reason:'复习日期记录尚待核验'};
  const dueAt=anchor+days*DAY;return {due:now>=dueAt,dueAt,daysRemaining:Math.max(0,Math.ceil((dueAt-now)/DAY))};
 }
 function complete(s,kind,now){const d=due(s,kind,now);if(!d.due)return null;return {...copy(s),[kind==='biweekly'?'biweeklyCompletedAt':'monthlyCompletedAt']:now,lastObservedAt:now};}
 function unseenPlans(plans,history){
  const seen=new Set([...(history.exposedMathKeys||[]),...(history.solvedMathKeys||[])]);
  return plans.filter(p=>!seen.has(p.candidate.mathKey)&&p.pendingTaskIds.every(id=>!seen.has(p.training.find(t=>t.id===id)?.mathKey)));
 }
 return {DAY,restore,clock,due,complete,unseenPlans};
})();
if(typeof module!=='undefined')module.exports=PeriodicPractice;

const PeriodicPracticeUI=(()=>{
 let message='';
 const copy=x=>JSON.parse(JSON.stringify(x));
 const current=()=>saved.periodicPractice;
 const profile=()=>SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds});
 function writable(){return canPersist&&progressStore.getStatus()==='ready'&&current()?.schema===1&&PeriodicPractice.clock(current(),Date.now()).ok;}
 function commit(next,rtmState=null){
  if(!writable()){message='日期或记录暂不能写入，原始学习记录保持保留。';return false;}
  const previous=current(),previousRtm=saved.rtm1,previousRevision=saved.profileRevision;saved.periodicPractice=next;if(rtmState)saved.rtm1=rtmState;
  if(!persist()?.ok){saved.periodicPractice=previous;saved.rtm1=previousRtm;if(previousRevision===undefined)delete saved.profileRevision;else saved.profileRevision=previousRevision;message='本次复习记录未保存，请先导出记录。';return false;}
  message='';return true;
 }
 function home(){
  const b=PeriodicPractice.due(current(),'biweekly'),m=PeriodicPractice.due(current(),'monthly');
  const status=(d,word)=>d.reason?d.reason:d.due?word+'已到期':word+'还需 '+d.daysRemaining+' 天';
  return `<section class="panel periodic-practice" aria-label="定期练习"><h2>定期回访</h2><p role="status">${esc(status(b,'双周新题'))}；${esc(status(m,'月度复练'))}。</p><div class="stage-buttons"><button class="secondary" data-action="periodicBiweekly" ${b.due?'':'disabled'}>双周新题 · 最多10题</button><button class="secondary" data-action="periodicMonthly" ${m.due?'':'disabled'}>月度复练</button></div><p>按当前已掌握范围安排；新题不足会如实说明。只有错误次数时先核对原因。</p>${message?'<p role="status">'+esc(message)+'</p>':''}</section>`;
 }
 function beginBiweekly(){
  const due=PeriodicPractice.due(current(),'biweekly');
  if(!due.due){message=due.reason||('双周新题还需 '+due.daysRemaining+' 天。');render();return;}
  if(!writable()){message='双周新题已到期，但当前记录暂不能写入。请先处理保存状态，原记录会保留。';render();return;}
  const group=ExamMappingUI.connectedStatus(),s=topicSession();
  if(group?.periodic?.kind==='biweekly'&&group.status==='active'){ExamMappingUI.handle('rtmConnectedResume',{});return;}
  if(s?.periodic?.kind==='biweekly'&&!s.exhausted&&topicFrontier()<s.total){topicResume();return;}
  if(group?.status==='active'||s&&!s.exhausted&&topicFrontier()<s.total){message='请先继续或完成上次练习，草稿不会被双周任务覆盖。';render();return;}
  const periodic={kind:'biweekly',cycleId:'biweekly-'+(current().biweeklyCompletedAt||current().startedAt),startedAt:Date.now(),newOnly:true};
  topicStart({periodic});
 }
 function finishBiweekly(periodic,count){
  if(periodic?.kind!=='biweekly')return;
  const next=PeriodicPractice.complete(current(),'biweekly',Date.now());if(!next)return;
  next.reviews.push({kind:'biweekly',cycleId:periodic.cycleId,at:Date.now(),presented:count,maximum:10});commit(next);
 }
 function state(){return TransferEvidenceStore.inspect(saved.rtm1);}
 function parents(){
  const r=state();if(r.readOnly)return [];
  const s=r.state,solved=new Set(TransferEvidenceStore.history(s).solvedMathKeys);
  return [...(s.sessions.archived||[]),...(s.sessions.active?[s.sessions.active]:[])].filter((a,i,all)=>all.findIndex(x=>x.attemptId===a.attemptId)===i&&!a.diagnosticOf&&!solved.has(ExamMapping.resolveMathKey(a.mathKey))&&TransferEvidenceStore.attempt(s,a.attemptId).events.some(e=>e.type==='response_submitted'&&e.result?.outcome==='INCORRECT'));
 }
 function linkFor(parent){
  const p=profile(),problem=ExamMapping.getProblem(parent.examId||parent.originProblemGroupId);
  if(!problem||!p.sourceIds.includes(problem.sourceId)||p.examIds.length&&!p.examIds.includes(problem.examId))return null;
  const allowed=ExamMapping.check(problem,p,{},'practice');if(!allowed.eligible)return null;
  return (window.__AMC8_REMEDIATION_REVIEWS.links||[]).find(l=>l.parentId===parent.id&&allowed.allowedRouteIds.includes(l.routeId)&&ExamDiagnostics.review(l).eligible&&ExamMapping.taskAllowed(ExamMapping.data.tasks[l.probeTaskId],p).eligible)||null;
 }
 function key(link){return ProgressStore.digest(ExamMapping.canonical(link.snapshot));}
 function definition(link){const task=ExamMapping.data.tasks[link.probeTaskId],review=ChildReviewStatus.review(ExamMapping.getProblem(task.originProblemGroupId));return ChildReviewStatus.definition({definition:task},review.record.tasks[task.taskId]);}
 function validResponse(row,parent,link){
  if(!row||row.parentAttemptId!==parent.attemptId||row.linkId!==link.linkId||row.snapshotHash!==key(link)||typeof row.input!=='string')return false;
  const event=state().state?.eventsById[row.responseEventId];
  return event?.type==='response_submitted'&&event.attemptId===row.probeAttemptId&&event.diagnosticOf?.attemptId===parent.attemptId&&event.input===row.input&&event.result?.outcome==='INCORRECT'&&JudgmentEvidence.task(definition(link),row.input,{methodHelpCount:0}).outcome==='INCORRECT';
 }
 function confirmation(parent,link){return current().confirmations.find(c=>c.parentAttemptId===parent.attemptId&&c.linkId===link.linkId&&c.snapshotHash===key(link)&&c.reviewedBy==='parent_local_process_review'&&current().probeResponses.some(r=>r.responseId===c.probeResponseId&&validResponse(r,parent,link)))||null;}
 function monthlyPlan(){
  if(state().readOnly||!PeriodicPractice.clock(current(),Date.now()).ok)return {kind:'UNKNOWN',targets:[],wrongCount:0};
  const targets=parents().map(parent=>{const link=linkFor(parent);return {parent,link,confirmation:link?confirmation(parent,link):null};});
  const legacyWrong=saved.competition.attempts.some(a=>{if(a.correct)return false;try{return !CompetitionIdentity.solved(saved.competition,competitionCreate(a.recipe))}catch{return true}});
  return {kind:targets.some(t=>t.confirmation)?'CONFIRMED_REMEDIATION':targets.length||legacyWrong?'PROBE_FIRST':'NONE',targets,wrongCount:targets.length+(legacyWrong?1:0)};
 }
 function beginMonthly(){
  if(!writable()||!PeriodicPractice.due(current(),'monthly').due){message='月度复练尚未到期，或本地日期暂不能核验。';render();return;}
  open('periodicReview');
 }
 function beginProbe(id){
  if(!writable())return;
  const target=monthlyPlan().targets.find(t=>t.parent.attemptId===id);if(!target?.link){message='当前范围暂无已复核的区分题，保留未知原因，不将错误次数当作诊断。';render();return;}
  const next=copy(current());next.probe={parentAttemptId:id,linkId:target.link.linkId,snapshotHash:key(target.link),input:'',responseId:null,attemptId:'monthly-probe-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),nextSequence:1};
  let rtmState=state().state;
  for(const type of ['problem_presented','method_exposed']){const appended=appendProbeEvent(rtmState,next.probe,target,type);if(!appended.ok)return;rtmState=appended.state;next.probe.nextSequence++;}
  next.lastObservedAt=Date.now();if(commit(next,rtmState))render();
 }
 function appendProbeEvent(rtmState,probe,target,type,extra={}){
  const task=ExamMapping.data.tasks[target.link.probeTaskId];
  return TransferEvidenceStore.append(rtmState,{eventId:probe.attemptId+':'+probe.nextSequence,attemptId:probe.attemptId,type,at:Date.now(),sequence:probe.nextSequence,mathKey:ExamMapping.taskKey(task),mappingBuildId:ExamMapping.data.mappingBuildId,taskId:task.taskId,taskEvidenceKey:ConnectedLearning.taskEvidenceKey(task,definition(target.link)),originProblemGroupId:task.originProblemGroupId,presentationKind:'synthetic',mode:'training',evidenceScope:'remediation_support_only',diagnosticOf:{attemptId:target.parent.attemptId,linkId:target.link.linkId},supportSnapshot:{methodHelpCount:1},...extra});
 }
 function selectedProbe(){const p=current()?.probe,t=monthlyPlan().targets.find(t=>t.parent.attemptId===p?.parentAttemptId);return p&&t?.link&&p.linkId===t.link.linkId&&p.snapshotHash===key(t.link)?{probe:p,target:t}:null;}
 function submitProbe(){
  const selected=selectedProbe();if(!selected||!writable())return;
  const {probe,target}=selected,d=definition(target.link);
  if(!d.options?.some(o=>String(o.id??o.value)===probe.input)){message='先选择你认为符合条件的关系。';render();return;}
  const result=JudgmentEvidence.task(d,probe.input,{methodHelpCount:0}),next=copy(current());
  if(next.probe.responseId)return;
  const responseId='monthly-probe-'+Date.now()+'-'+next.probeResponses.length;
  const responseEventId=probe.attemptId+':'+probe.nextSequence,supportResult={...result,level:null,evidenceScope:'remediation_support_only',grantsJudgmentEvidence:false};
  const appended=appendProbeEvent(state().state,next.probe,target,'response_submitted',{input:probe.input,result:supportResult,submissionOrdinal:1});if(!appended.ok)return;next.probe.nextSequence++;
  next.probeResponses.push({responseId,parentAttemptId:probe.parentAttemptId,linkId:probe.linkId,snapshotHash:probe.snapshotHash,probeAttemptId:probe.attemptId,responseEventId,input:probe.input,outcome:result.outcome,at:Date.now(),scope:'local_discrimination_only',grantsMastery:false});next.probe.responseId=responseId;next.lastObservedAt=Date.now();if(commit(next,appended.state))render();
 }
 function confirmProbe(){
  const selected=selectedProbe();if(!selected||!writable())return;
  const {probe,target}=selected,row=current().probeResponses.find(r=>r.responseId===probe.responseId);
  if(!validResponse(row,target.parent,target.link))return;
  const next=copy(current());if(confirmation(target.parent,target.link))return;
  next.confirmations.push({parentAttemptId:target.parent.attemptId,linkId:target.link.linkId,snapshotHash:key(target.link),probeResponseId:row.responseId,judgmentId:target.link.judgmentId,reviewedBy:'parent_local_process_review',claim:'本组任务中的关键关系需要复练',scope:'this_parent_and_reviewed_contrast_only',at:Date.now(),changesDeclaredKnowledge:false});next.probe=null;next.lastObservedAt=Date.now();if(commit(next))render();
 }
 function remediate(id){
  const target=monthlyPlan().targets.find(t=>t.parent.attemptId===id);
  if(!target?.confirmation||!writable())return;
  if(!ExamMappingUI.resumeMonthly(id)){message='原任务或已复核短题目前不满足知识、来源、负担或内容要求，原记录保留。';render();}
 }
 function returned(parent){
  if(!writable())return;
  const next=copy(current());next.probe=null;next.reviews.push({kind:'monthly_return',parentAttemptId:parent.attemptId,at:Date.now(),outcome:parent.feedback?.outcome||'UNKNOWN',firstAnswerReplaced:false});next.lastObservedAt=Date.now();
  if(monthlyPlan().kind==='NONE')next.monthlyCompletedAt=Date.now();commit(next);
 }
 function page(){
  const plan=monthlyPlan(),selected=selectedProbe();
  let body=plan.kind==='UNKNOWN'?'<p>记录格式暂不能核验，先导出保留，不推断错因。</p>':plan.kind==='NONE'?'<p data-monthly-status="NONE">当前没有已确认需要复练的目标；不虚构诊断，也不改动已掌握范围。</p><button class="secondary" data-action="monthlyComplete">记录本次查看</button>':`<p data-monthly-status="${plan.kind}">${plan.kind==='CONFIRMED_REMEDIATION'?'有经区分题和家长过程复核确认的局部复练目标，先补相关关系，再回原尝试。':'目前只有错误记录，原因尚未确认。先用区分题核对，不按错误次数批量判不会。'}</p>`;
  if(selected){
   const {probe,target}=selected,d=definition(target.link),response=current().probeResponses.find(r=>r.responseId===probe.responseId);
   body+=`<section class="panel" data-monthly-probe><h2>先核对一个关系</h2><p>${esc(d.prompt)}</p><div class="stage-buttons">${d.options.map(o=>`<button class="secondary" data-action="monthlyProbeChoice" data-value="${esc(String(o.id??o.value))}" aria-pressed="${probe.input===String(o.id??o.value)}" ${response?'disabled':''}>${esc(o.text)}</button>`).join('')}</div><button class="primary" data-action="monthlyProbeSubmit" ${response?'disabled':''}>提交判断</button>${response?`<p>${response.outcome==='VERIFIED'?'这次区分题通过，不能据旧错误认定持续误区；可保留记录，再回原任务检查。':'这次区分题也未通过。仍需核对实际过程，不能只因两次错误就认定原因。'}</p>`:''}${response&&validResponse(response,target.parent,target.link)?'<details><summary>家长核对过程</summary><p>请结合原题和区分题的实际选择，确认本组关键关系确需复练。这里只确认这一组局部表现，不判断孩子普遍不会。</p><button class="secondary" data-action="monthlyConfirm">已核对过程，确认本组关系需复练</button></details>':''}</section>`;
  }
  body+=plan.targets.map(t=>`<section class="panel"><h2>保留的原任务</h2><p>${esc(t.parent.definition.prompt)}</p><p>首次作答、草稿和帮助记录保留。</p>${t.confirmation?`<p>本组关键关系已由区分题和家长过程复核确认需要复练。</p><button class="primary" data-action="monthlyRemediate" data-id="${esc(t.parent.attemptId)}">补相关短题，再回原尝试</button>`:t.link?`<button class="secondary" data-action="monthlyProbe" data-id="${esc(t.parent.attemptId)}">先做区分题</button>`:'<p>当前范围暂无已审核的对应区分题，原因保持未知。</p>'}</section>`).join('');
  if(plan.wrongCount&&!plan.targets.length)body+='<p>已有旧练习错误记录，但当前暂无已审核的对应区分题。原因保持未知，可保留记录，继续正常练习。</p>';
  return `<section class="periodic-review"><div class="page-head"><h1>月度复练</h1><button class="secondary" data-action="home">回到首页</button></div>${message?'<p role="status">'+esc(message)+'</p>':''}${body}<p>本页记录局部复查与帮助，不自动授予知识掌握或独立迁移结论。</p></section>`;
 }
 function handle(action,data){
  if(!/^(periodic|monthly)/.test(action))return false;
  if(action==='periodicBiweekly'&&view==='home')beginBiweekly();
  if(action==='periodicMonthly'&&view==='home')beginMonthly();
  if(view!=='periodicReview')return true;
  if(!writable()||!PeriodicPractice.due(current(),'monthly').due){message='日期或记录暂不能核验，原始记录保留。';render();return true;}
  if(action==='monthlyProbe')beginProbe(data.id);
  if(action==='monthlyProbeChoice'){const p=selectedProbe();if(p&&!p.probe.responseId){const next=copy(current());next.probe.input=String(data.value);next.lastObservedAt=Date.now();if(commit(next))render();}}
  if(action==='monthlyProbeSubmit')submitProbe();
  if(action==='monthlyConfirm')confirmProbe();
  if(action==='monthlyRemediate')remediate(data.id);
  if(action==='monthlyComplete'&&monthlyPlan().kind==='NONE'){const next=PeriodicPractice.complete(current(),'monthly',Date.now());if(next&&commit(next))open('home');}
  return true;
 }
 return {home,page,handle,finishBiweekly,monthlyPlan,returned};
})();

'use strict';
const ExamMappingUI=(()=>{
 let message='',volatileInput=null,showHistory=false,reviewingAttemptId=null,reuseLoading=false,reuseFailed=false;
 function enabled(){return window.__AMC8_RELEASE.features?.examMappingV1===true||/^tianle_amc8_qa_(?:normal_|history_)?rc\d+_v1$/.test(STORE)}
 function childEntryEnabled(){return enabled()&&!/^tianle_amc8_qa_rc\d+_v1$/.test(STORE)}
 function restored(){return TransferEvidenceStore.inspect(saved.rtm1)}
 function readState(){return restored().state}
 function state(){return TransferEvidenceStore.restore(saved.rtm1).state}
 function active(){return readState()?.sessions?.active||null}
 // A compatible old mapping may continue only when the specific presentation
 // has not changed. The two new given diagrams require a fresh presentation.
 function activeBuildCompatible(a){return !!a&&!!a.definition&&typeof a.definition==='object'&&ExamMapping.compatibleBuild(a.mappingBuildId)&&(a.mappingBuildId===ExamMapping.data.mappingBuildId||!ConnectedLearning.givenVisual(a.definition,a.definition));}
 function commit(next){
  if(!canPersist||restored().readOnly||progressStore.getStatus()!=='ready'){message='当前记录暂不能写入，已保存的历史仍可导出。';return false}
  const previous=saved.rtm1;saved.rtm1=next;const result=persist();
  if(!result?.ok){saved.rtm1=previous;message='本次记录未能保存，输入仍在页面中。请导出记录后重试。';return false}
  message='';return true;
 }
 function appendEvent(current,type,extra={}){
  const a=current?.sessions.active;if(!a)return {ok:false,reason:'NO_ACTIVE_ATTEMPT'};
  const e={eventId:a.attemptId+':'+a.nextSequence,type,at:Date.now(),attemptId:a.attemptId,
   sequence:a.nextSequence,mathKey:a.mathKey,examId:a.examId||null,originProblemGroupId:a.originProblemGroupId,
   structureClusterId:a.structureClusterId,mappingBuildId:a.mappingBuildId,presentationKind:a.presentationKind,
   renderingMode:a.renderingMode,priorExposure:a.priorExposure===true,mode:a.mode,
   assignmentId:a.assignmentId||null,pathwayStage:a.pathwayStage||null,
   taskId:a.definition.taskId,taskEvidenceKey:a.kind==='training'&&ExamMapping.data.tasks[a.id]?ConnectedLearning.taskEvidenceKey(ExamMapping.data.tasks[a.id],a.definition):null,
   connectedGroupId:a.connectedGroupId||null,connectedStage:a.connectedStage||null,readinessSnapshot:a.readinessSnapshot||null,
   evidenceScope:a.diagnosticOf?'remediation_support_only':'local_decision_prompt',diagnosticOf:a.diagnosticOf||null,
   supportSnapshot:{methodHelpCount:Math.max(a.helpLevel,a.priorMethodHelp?1:0),answerRevealed:false,statementRead:a.statementRead===true},...extra};
  const appended=TransferEvidenceStore.append(current,e);
  if(appended.ok)appended.state.sessions.active.nextSequence++;
  return appended;
 }
 function event(type,extra={},update){
  const appended=appendEvent(readState(),type,extra);if(!appended.ok){message=appended.reason;return false}
  if(update)update(appended.state);
  return commit(appended.state);
 }
 function profile(){return SourceCatalog.profile({...saved.topicPractice,topicIds:saved.topicPractice.selectedTopicIds})}
 function currentScopeAllowed(a=active()){
  if(!a)return false;
  const known=profile(),p=ExamMapping.getProblem(a.examId||a.originProblemGroupId);
  if(!p||childEntryEnabled()&&!ConnectedLearning.review(p).eligible)return false;
  if(a.kind==='training'){
   const t=ExamMapping.data.tasks[a.id];
   return !!t&&known.sourceIds.includes(p.sourceId)&&(!known.examIds.length||known.examIds.includes(p.examId))&&ExamMapping.taskAllowed(t,known).eligible;
  }
  return ExamMapping.check(p,known,history(),'practice').eligible;
 }
 function requireCurrentScope(){
  if(!canPersist||restored().readOnly||progressStore.getStatus()!=='ready'){stop();message='当前记录暂不能写入，已暂停作答和提示。原首答、帮助及本页草稿都保留，可以先导出再刷新。';render();return false;}
  if(!activeBuildCompatible(active())){stop();message='这道题的呈现版本发生变化，原首答和草稿已保留，可只读回看或导出。';render();return false;}
  if(currentScopeAllowed())return true;
  stop();message='这道保留题目前不符合家长当前选择的知识、来源、负担或题目审核范围，已暂停。原首答、提示和草稿都保留。';render();return false;
 }
 function legacyHistory(){
  const index=CompetitionIdentity.index(saved.competition),rows=[...index.values()],exposed=rows;
  const exposedOriginGroups=[],assistedOriginGroups=[];
  for(const p of Object.values(ExamMapping.data.problems)){
   if(!p.recipe)continue;
   const t=competitionCreate(p.recipe),key=CompetitionIdentity.key(t),row=index.get(key);
   if(row){exposedOriginGroups.push(p.examId);if(row.hinted||row.solutionViewed)assistedOriginGroups.push(p.examId)}
  }
  return {solvedMathKeys:[...CompetitionIdentity.solvedKeys(saved.competition)],exposedMathKeys:exposed.map(h=>h.key),assistedMathKeys:rows.filter(h=>h.hinted||h.solutionViewed).map(h=>h.key),exposedOriginGroups,assistedOriginGroups,historyUnknown:restored().historyUnknown};
 }
 function history(){return TransferEvidenceStore.history(readState(),legacyHistory())}
 function originals(known=profile(),historyOverride=null){
  const selected=known.examIds?.length?new Set(known.examIds):null;
  const scoped=Object.values(ExamMapping.data.problems).filter(p=>(!known.sourceIds||known.sourceIds.includes(p.sourceId))&&(!selected||selected.has(p.examId)));
  if(!scoped.length)return [];
  const h=historyOverride||history(),result=[];
  for(const p of scoped){
   const allowed=ExamMapping.check(p,known,h,'practice');if(!allowed.eligible)continue;
   const checked=ConnectedLearning.review(p);
   if(childEntryEnabled()&&!checked.eligible)continue;
   if(!p.recipe){
    const content=checked.eligible?{...p.presentation,...checked.record}:p.presentation;
    if((content.givenFigures||[]).some(f=>!window.__AMC8_SOURCE_FIGURES?.[f.sha256]))continue;
    result.push({id:p.examId,kind:'exam',examId:p.examId,mathKey:ExamMapping.problemKey(p),
     originProblemGroupId:p.originProblemGroupId,structureClusterId:p.structureClusterId,
     presentationKind:p.presentationKind,renderingMode:content.renderingMode,
     definition:{taskId:p.examId,prompt:content.prompt,givenText:content.givenText||'',
      answerContract:p.answerContract,options:content.options||[],hints:content.hints,
      givenFigures:content.givenFigures||[],givenTable:content.givenTable||[],auxiliaryFigure:null,grantsJudgmentEvidence:false}});
    continue;
   }
   const task=competitionCreate(p.recipe);if(!ExamMapping.sourceMatch(task,p)||!SourceCatalog.loadsAllowed(task,known))continue;
   const content=CompetitionContentContracts.resolve(task),name=p.recipe.familyId;
   let hints=name==='overlapAverages'?['这些平均数分别对应多少个数？怎样知道各组总量？','核对第4个数进入了哪些组，分别算了几次。','比较前组总量、后组总量与全体总量，保留目标一次。']:
    name==='lShapeArea'?(allowed.allowedRouteIds.some(id=>id.endsWith(':complete-remove'))?['先确定阴影所对应的外包区域。','补成正方形后，需要扣除哪一块？']:['把阴影分成不重叠的两条。','分别确认两条的长和宽，并检查交叠处。']):
    ['先检查严格范围与非零个位这两个条件。','选择按个位或十位分组，逐一检验候选，避免重复或遗漏。'];
   const candidate={id:p.examId,kind:'exam',examId:p.examId,mathKey:CompetitionIdentity.key(task),
    originProblemGroupId:p.originProblemGroupId,structureClusterId:p.structureClusterId,
    presentationKind:p.presentationKind,renderingMode:content.givenText?'verified_text_description':'equivalent_translation',
    definition:{taskId:p.examId,prompt:content.promptText,givenText:content.givenText||'',
     answerContract:p.answerContract,options:[],hints,auxiliaryFigure:task.competition.diagram,
     grantsJudgmentEvidence:false},recipe:p.recipe};
   result.push(checked.eligible?{...candidate,renderingMode:checked.record.renderingMode||candidate.renderingMode,definition:ConnectedLearning.definition(candidate,checked.record)}:candidate);
  }
  return result;
 }
 function candidates(mode,p=profile()){
  if(mode!=='training')return originals(p);
  if(!p.sourceIds.includes('AMC8'))return [];
  const selected=p.examIds.length?new Set(p.examIds):null;
  return Object.values(ExamMapping.data.tasks).filter(t=>t.verificationStatus==='PASS'&&
   (!selected||selected.has(t.originProblemGroupId))&&ExamMapping.taskAllowed(t,p).eligible).flatMap(t=>{const checked=ConnectedLearning.review(ExamMapping.getProblem(t.originProblemGroupId));if(childEntryEnabled()&&!checked.eligible)return [];const row=checked.record?.tasks[t.taskId];return [{id:t.taskId,kind:'training',mathKey:ExamMapping.taskKey(t),originProblemGroupId:t.originProblemGroupId,structureClusterId:t.structureClusterId,presentationKind:'synthetic',renderingMode:'authored_training',definition:row?ConnectedLearning.definition({definition:t},row):t}]});
 }
 function stop(){CompetitionSpeech.stop()}
 function start(mode,options={}){
  stop();const old=active();if(options.connectedGroup?.attemptIds.length>=10){message='本组已达到十题，当前尝试已保留。';render();return}
  const relatedPracticeOf=old&&options.connectedGroup?.variantParentAttemptId===old.attemptId?old.attemptId:null;
  if(old&&!old.finished&&!options.suspendParent&&!finish(old.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return;
  const current=readState()||TransferEvidenceStore.fresh(),seed=(current.sessions.nextSeed||1),selection=options.candidate?{candidateRef:options.candidate}:TransferPolicy.allocate(candidates(mode),history(),mode==='training'?'practice':mode,seed);
  if(!selection.candidateRef){message='当前范围内没有合格的新题。可以查看历史，或由家长调整已掌握范围。';open('examMapping');return}
  const c=selection.candidateRef,next=JSON.parse(JSON.stringify(current)),attemptId='rtm-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
  const previous=active();if(previous){next.sessions.archived??=[];next.sessions.archived.push({...previous})}
  if(options.assignment){
   next.assignmentsById??={};
   if(next.assignmentsById[options.assignment.assignmentId]){message='这组训练已经登记，请从当前记录继续。';return}
   next.assignmentsById[options.assignment.assignmentId]=options.assignment;
   next.sessions.pathway={assignmentId:options.assignment.assignmentId,attemptedTaskIds:[],completedTaskIds:[],stage:'training'};
  }
  if(options.connectedGroup){
   if(next.sessions.connected&&next.sessions.connected.groupId!==options.connectedGroup.groupId){next.sessions.connectedArchive??=[];next.sessions.connectedArchive.push(next.sessions.connected)}
   next.sessions.connected=JSON.parse(JSON.stringify(options.connectedGroup));delete next.sessions.connected.variantParentAttemptId;next.sessions.connected.attemptIds.push(attemptId);
  }
  const prior=history(),instance=TransferEvidenceStore.instance(current,c.mathKey);
  const correctedOriginal=c.kind==='exam'&&ExamMapping.getProblem(c.examId)?.sourceCorrection;
  next.sessions.nextSeed=seed+1;next.sessions.active={...c,attemptId,mode,mappingBuildId:ExamMapping.data.mappingBuildId,
   priorExposure:!!relatedPracticeOf||prior.exposedMathKeys.includes(c.mathKey)||!!correctedOriginal&&prior.exposedOriginGroups.includes(c.originProblemGroupId),priorMethodHelp:!!options.diagnosticOf||!!options.readinessSnapshot||instance.methodExposed||legacyHistory().assistedMathKeys.includes(c.mathKey)||!!correctedOriginal&&prior.assistedOriginGroups.includes(c.originProblemGroupId),
   nextSequence:1,submissionOrdinal:0,helpLevel:0,hintsOpen:false,input:'',feedback:null,finished:false,
   assignmentId:options.assignment?.assignmentId||options.assignmentId||null,pathwayStage:options.pathwayStage||null,
   diagnosticOf:options.diagnosticOf||null,connectedGroupId:options.connectedGroup?.groupId||null,connectedStage:options.connectedStage||null,
   connectedTarget:options.connectedGroup?.target?{examId:options.connectedGroup.target.examId,routeId:options.connectedGroup.target.routeId}:null,relatedPracticeOf,
   readinessSnapshot:options.readinessSnapshot||null,
   profileSnapshot:options.profileSnapshot||options.connectedGroup?.profileSnapshot||profile(),startedAt:Date.now(),shown:true};
  const givenVisual=ConnectedLearning.givenVisual(c.definition,c.definition);
  let presented=appendEvent(next,'problem_presented',{...(givenVisual?{givenDiagramPolicy:givenVisual}:{}),...(relatedPracticeOf?{relatedPracticeOf}:{})});if(!presented.ok)return;
  if(options.diagnosticOf)presented=appendEvent(presented.state,'method_exposed',{reason:'remediation_support',linkId:options.diagnosticOf.linkId});
  if(!presented.ok||!commit(presented.state))return;
  volatileInput=null;showHistory=false;reviewingAttemptId=null;open('examMapping');
 }
 function ensureShown(){const a=active();if(!a||a.shown||!activeBuildCompatible(a))return;
  event('problem_presented',{},next=>{next.sessions.active.shown=true});
 }
 function finish(reason){
  const a=active();if(!a||a.finished)return true;stop();return event('attempt_finished',{reason},next=>{next.sessions.active.finished=true});
 }
 function input(value){volatileInput=String(value).slice(0,1000);const next=state();if(next?.sessions.active){next.sessions.active.input=volatileInput;commit(next)}}
 function submit(){
  const a=active();if(!a||a.finished||!activeBuildCompatible(a))return;
  if(!requireCurrentScope())return;
  if(!statementFiguresReady(a)){
   message='题目图片还没有加载完成。请等待，或点击图片旁的重试；这次不会记为答错。';
   const status=typeof document.querySelector==='function'?document.querySelector('[data-rtm-feedback]'):null;
   if(status)status.textContent=message;else render();
   return;
  }
  const raw=String(volatileInput!==null?volatileInput:a.input||'').trim();if(!raw){message='先写下你的答案。';render();return}
  if(a.lastSubmittedInput===raw&&a.lastSubmittedHelp===a.helpLevel){message='这次答案已记录，可继续下一题。';render();return}
  let normalized=ProblemState.normalizeNumerals(raw);
  // This original specifically asks for percentage points and expects 50.
  // Never make a percent sign equivalent to a bare number on other questions.
  if(a.kind==='exam'&&a.examId==='AMC8-2025-01'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)\s*%$/.test(normalized))normalized=normalized.replace(/\s*%$/,'');
  let result=JudgmentEvidence.task(a.definition,normalized,{methodHelpCount:Math.max(a.helpLevel,a.priorMethodHelp?1:0),evidenceScope:a.diagnosticOf?'remediation_support_only':'local_decision_prompt'});
  if(a.diagnosticOf)result={...result,level:null,evidenceScope:'remediation_support_only',grantsJudgmentEvidence:false};
  const targeted=a.id==='RTM-2023-01-DECISION'&&normalized==='wrong1'&&result.outcome==='INCORRECT'
   ?'先看乘法和加法，想一想应先算哪一步。':'';
  const ordinal=a.submissionOrdinal+1;
  if(!event('response_submitted',{input:raw,normalizedInput:normalized,parserRevision:1,result,submissionOrdinal:ordinal},next=>{
   const current=next.sessions.active;current.submissionOrdinal=ordinal;current.feedback=result;current.input=raw;current.lastSubmittedInput=raw;current.lastSubmittedHelp=current.helpLevel;current.targetedFeedback=targeted;
   if(targeted){
    const hint=appendEvent(next,'hint_revealed',{hintId:'automatic-operation-order',reason:'targeted-feedback'});
    if(!hint.ok)throw Error(hint.reason);Object.assign(next,hint.state);next.sessions.active.helpLevel=Math.max(1,next.sessions.active.helpLevel);next.sessions.active.lastSubmittedHelp=next.sessions.active.helpLevel;
   }
   if(current.diagnosticOf){
    const probe=appendEvent(next,'diagnostic_probe_submitted',{parentAttemptId:current.diagnosticOf.attemptId,judgmentId:current.diagnosticOf.judgmentId,result});
    if(!probe.ok)throw Error(probe.reason);Object.assign(next,probe.state);
   }
  })){render();return}
  message='';render();
 }
 function help(){
  const a=active();if(!a||a.finished)return;
  if(!requireCurrentScope())return;
  let next=state();
  if(a.mode==='exam_holdout'){
   const changed=appendEvent(next,'mode_changed',{fromMode:'exam_holdout',toMode:'practice',reason:'learner_requested_method_help'});
   if(!changed.ok)return;next=changed.state;next.sessions.active.originalMode='exam_holdout';next.sessions.active.mode='practice';next.sessions.active.independentAbandoned=true;
  }
  const item=next.sessions.active;if(item.helpLevel===0)item.helpLevel=1;else if(item.hintsOpen&&item.helpLevel<item.definition.hints.length)item.helpLevel++;
  item.hintsOpen=true;
  const revealed=appendEvent(next,'hint_revealed',{hintId:'h'+item.helpLevel});
  if(revealed.ok)commit(revealed.state);render();
 }
 function read(hint=false){
  const a=active();if(!a)return;
  if(hint&&!requireCurrentScope())return;
  const tableText=(a.definition.givenTable||[]).map((row,i)=>'数据表第'+(i+1)+'行：'+row.join('，')).join('；');
  const text=hint?a.hintsOpen&&a.definition.hints[a.helpLevel-1]:a.definition.prompt+' '+(a.definition.givenText||'')+(tableText?' '+tableText:'');if(!text)return;
  if(!event(hint?'hint_read_requested':'statement_read_requested',{hintId:hint?'h'+a.helpLevel:null},next=>{if(!hint)next.sessions.active.statementRead=true}))return;
  if(!CompetitionSpeech.speak({text,scope:'rtm',attemptId:a.attemptId})){message='当前浏览器暂不能出声，文字仍可阅读。';render()}
 }
 function feedbackText(r){return r?.outcome==='VERIFIED'?'本题答案正确。'+(r.level==='E2'?'已记录这次局部判断证据。':r.level==='E1'?'这次完成使用过提示。':'终答已记录，具体判断过程尚未核验。'):r?.outcome==='INCORRECT'?'答案还未通过，可以保留草稿继续想。':r?'输入已保留，过程暂未自动核验。':''}
 function connectedSupportAdvice(g){
  if(!g)return '';
  const s=readState(),sessions=new Map([...(s?.sessions.archived||[]),...(s?.sessions.active?[s.sessions.active]:[])].map(a=>[a.attemptId,a]));
  const byAttempt=new Map();for(const e of TransferEvidenceStore.events(s))if(e.type==='response_submitted'&&!byAttempt.has(e.attemptId))byAttempt.set(e.attemptId,e);
  const outcomes=g.attemptIds.filter(id=>!sessions.get(id)?.diagnosticOf).map(id=>byAttempt.get(id)?.result?.outcome).filter(x=>x==='INCORRECT'||x==='VERIFIED');
  const recent=outcomes.slice(-4),needsSupport=outcomes.slice(-2).length===2&&outcomes.slice(-2).every(x=>x==='INCORRECT')||recent.length===4&&recent.filter(x=>x==='INCORRECT').length>=3;
  return needsSupport?'<aside class="panel" role="status" data-connected-support><b>可以先放慢一点</b><p>最近几道的首次回答还需要再想一想。可以先休息，或在有相关短题时练一小步；当前草稿和原始首答都会保留。</p><button class="secondary" data-action="rtmBack">先休息，回到选题页</button></aside>':'';
 }
 function connectedStatus(){
  const g=readState()?.sessions.connected;
  if(!enabled()||g?.schemaVersion!==1||typeof g.groupId!=='string'||typeof g.mappingBuildId!=='string'||g.total!==10||!Array.isArray(g.attemptIds)||g.attemptIds.length>10||new Set(g.attemptIds).size!==g.attemptIds.length||!g.attemptIds.every(id=>typeof id==='string')||!Array.isArray(g.deferredExamIds)||g.deferredTargets!==undefined&&!Array.isArray(g.deferredTargets)||!['active','completed','exhausted'].includes(g.status)||!g.profileSnapshot)return null;
  const p=SourceCatalog.profile(g.profileSnapshot);return ExamMapping.canonical(p)===ExamMapping.canonical(g.profileSnapshot)?JSON.parse(JSON.stringify(g)):null;
 }
 function supplyPlans(p=profile(),historyOverride=null){return ChildReviewStatus.withReviewSnapshot(()=>ConnectedLearning.plans(originals(p,historyOverride),candidates('training',p),p,historyOverride||history(),readState()))}
 function connectedPlans(p=profile()){return ConnectedLearning.focusPlans(supplyPlans(p),p)}
 function connectedAvailability(p=profile()){return childEntryEnabled()?connectedPlans(p).length:0}
 function launchConnected(savedGroup,preparedPlans=null){
  const group=JSON.parse(JSON.stringify(savedGroup));
  if(!ExamMapping.compatibleBuild(group.mappingBuildId)){message='这组草稿已保留，内容更新后请从新一组继续。';open('examMapping');return}
  if(group.attemptIds.length>=group.total){
   const next=state();next.sessions.connected={...group,status:'completed',finishedAt:Date.now()};if(commit(next)){PeriodicPracticeUI.finishBiweekly(group.periodic,group.attemptIds.length);open('examMapping');}return;
  }
  const p=profile(),plans=preparedPlans||connectedPlans(p),step=ConnectedLearning.nextFromPlans(group.periodic?.newOnly?PeriodicPractice.unseenPlans(plans,history()):plans,group);
  if(!step.candidate){
   const next=state();next.sessions.connected={...group,status:'exhausted',finishedAt:Date.now()};if(commit(next)){PeriodicPracticeUI.finishBiweekly(group.periodic,group.attemptIds.length);open('examMapping');}return;
  }
  group.target=step.target;
  start(step.mode,{candidate:step.candidate,profileSnapshot:p,connectedGroup:group,connectedStage:step.stage,readinessSnapshot:step.readiness});
 }
 function beginConnected(p=profile(),options={}){
  if(!childEntryEnabled())return false;const basePlans=connectedPlans(p),plans=options.periodic?.newOnly?PeriodicPractice.unseenPlans(basePlans,history()):basePlans;if(!plans.length)return false;
  if(restored().readOnly){message='这份记录暂时只读，请先导出保留。';open('examMapping');return true}
  const group=ConnectedLearning.freshGroup(p,readState()?.sessions.nextSeed||1);group.supplyFocusTopics=[...new Set(plans.flatMap(plan=>plan.focusTopics||[]).filter(id=>p.topicIds.includes(id)))];if(options.periodic)group.periodic=JSON.parse(JSON.stringify(options.periodic));launchConnected(group,plans);return true;
 }
 function resumeConnected(){
  const group=connectedStatus();if(!group||group.status!=='active')return;
  const a=active();if(a&&!a.finished&&a.connectedGroupId===group.groupId){showHistory=false;reviewingAttemptId=null;volatileInput=null;open('examMapping');return}
  launchConnected(group);
 }
 function relatedVariantPlan(a,group){
  if(!a||!group||a.diagnosticOf||a.feedback?.outcome!=='VERIFIED'||group.attemptIds.length>=group.total)return null;
  const plans=connectedPlans(profile()),step=ConnectedLearning.nextFromPlans(group.periodic?.newOnly?PeriodicPractice.unseenPlans(plans,history()):plans,group);
  return step.candidate&&step.mode==='training'&&step.candidate.id!==a.id&&step.target?.examId===a.originProblemGroupId?step:null;
 }
 function nextConnected({variantOf=null}={}){
  const a=active(),group=connectedStatus();if(!a?.connectedGroupId||a.connectedGroupId!==group?.groupId)return false;
  if(!finish(a.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return true;
  const next=state(),g=next.sessions.connected;
  if(a.feedback?.outcome!=='VERIFIED'){
   ConnectedLearning.defer(g,a,'LEARNER_DEFERRED');
  }else if(a.connectedStage==='application'){g.lastStructure=a.structureClusterId;g.coveredFocusTopics=[...new Set([...(g.coveredFocusTopics||[]),...ConnectedLearning.routeTopics(g.target?.routeId)])];g.target=null}
  if(variantOf)g.variantParentAttemptId=variantOf;
  if(g.attemptIds.length>=g.total&&g.target)ConnectedLearning.defer(g,a,'GROUP_LIMIT');
  if(commit(next))launchConnected(g);return true;
 }
 function retryDeferred(id){
  const group=connectedStatus();if(!group||group.status==='active')return;
  const descriptor=group.deferredTargets?.find(d=>d.deferredId===id);if(!descriptor)return;
  const p=profile(),checked=ConnectedLearning.deferredPlan(descriptor,originals(p),candidates('training',p),p,history(),readState());
  if(!checked.plan){message='这项保留任务目前不满足知识、来源、题号、负担或内容审核要求；原记录已保留。';render();return}
  const next=ConnectedLearning.freshGroup(p,readState().sessions.nextSeed||1);
  next.target=JSON.parse(JSON.stringify(descriptor.target));next.retryTarget=JSON.parse(JSON.stringify(descriptor.target));next.retryOf=descriptor.deferredId;
  launchConnected(next);
 }
 function connectedSummary(){
  const g=connectedStatus(),s=readState(),sessions=[...new Map([...(s.sessions.archived||[]),...(s.sessions.active?[s.sessions.active]:[])].filter(a=>g.attemptIds.includes(a.attemptId)).map(a=>[a.attemptId,a])).values()];
  const completed=sessions.filter(a=>a.feedback?.outcome==='VERIFIED').length,applications=sessions.filter(a=>a.connectedStage==='application');
  const topicNames=ids=>ids.map(id=>SKILL_DATA.units.find(unit=>unit.id===id)?.title||id).join('、');
  const wanted=(g.profileSnapshot.topicIds||[]).filter(id=>!['A01','A02'].includes(id)),attempted=new Set(sessions.flatMap(a=>ConnectedLearning.routeTopics(a.connectedTarget?.routeId)));
  const covered=wanted.filter(id=>attempted.has(id)),supplied=new Set(g.supplyFocusTopics||[]),remaining=wanted.filter(id=>supplied.has(id)&&!attempted.has(id)),unavailable=wanted.filter(id=>!supplied.has(id));
  const coverage=Array.isArray(g.supplyFocusTopics)&&wanted.length&&!(g.profileSnapshot.examIds||[]).length?'<p data-connected-coverage>本组涉及：'+esc(topicNames(covered)||'尚无进阶主题')+'。'+(remaining.length?'本组未轮到但开始时有合格供应：'+esc(topicNames(remaining))+'。':'')+(unavailable.length?'开始时当前条件下暂无合格供应：'+esc(topicNames(unavailable))+'。':'')+'</p>':'';
  // Counts and actions use the very same eligibility check as retryDeferred.
  // Reuse a single fresh supply snapshot so ten retained tasks do not rebuild
  // the same candidate pool ten times during one render.
  const retained=g.deferredTargets||[],p=profile(),past=history();
  const source=retained.length?originals(p):[],training=retained.length?candidates('training',p):[];
  const plans=retained.length?ChildReviewStatus.withReviewSnapshot(()=>ConnectedLearning.plans(source,training,p,past,s)):[];
  const checked=retained.map(d=>({d,...ConnectedLearning.deferredPlan(d,source,training,p,past,s,plans)}));
  const available=checked.filter(x=>x.plan),paused=checked.filter(x=>!x.plan);
  const reasonText={DEFERRED_CONTENT_CHANGED:'题目内容或呈现已更新，暂时只能回看原记录。',DEFERRED_RECORD_INVALID:'关联记录需要核对，原记录仍然保留。',DEFERRED_TARGET_OUTSIDE_CURRENT_SCOPE_OR_SUPPLY:'当前知识、来源、负担或题目审核范围内暂无可继续的题目。'};
  const retainedMarkup='<p data-retained-count>可继续的保留任务 '+available.length+' 项；暂停 '+paused.length+' 项。原作答记录均保留。</p>'+
   available.map(({d},i)=>'<button class="secondary" data-action="rtmConnectedRetry" data-id="'+esc(d.deferredId)+'">继续第'+(i+1)+'个保留任务</button>').join('')+
   paused.map(({d,reason})=>'<div class="tiny-note" data-retained-paused><p>'+esc(reasonText[reason]||'此任务暂不能继续，原记录仍然保留。')+'</p><button class="secondary" data-action="rtmReview" data-id="'+esc(d.sourceAttemptId)+'">只读回看原记录</button></div>').join('');
  return `<section class="panel completed" data-connected-summary><h1>${g.status==='completed'?'这组练习完成了':'这组先做到这里'}</h1>${g.periodic?.kind==='biweekly'?'<p data-periodic-shortage>双周新题：本次安排 '+g.attemptIds.length+'/10 道。'+(g.attemptIds.length<10?'当前已掌握范围内可继续衔接的合格新实例不足十题；不复用已做题，也不加入未学题。':'')+'</p>':''}<p>完成 ${completed} 道；另有 ${sessions.length-completed} 道尝试已保存在记录中；其中遇到了 ${applications.length} 道真题。</p>${coverage}${retainedMarkup}<p>相关练习后的真题按应用练习记录，首次作答和提示使用分别保留。</p><p role="status">${esc(message)}</p>${g.status==='exhausted'?'<p>当前范围暂时没有更多通过题目形式检查的新题，可以回到首页继续其他练习。</p>':''}<button class="primary" data-action="rtmConnectedNew">再来一组</button><button class="secondary" data-action="rtmBack">回到首页</button><details><summary>家长查看</summary><p>本组保留开始时的声明快照；继续与后续供题会重新检查首页当前知识、来源及负担设置。只核验了作答结果，没有自动认定知识已掌握。</p><button class="secondary" data-action="rtmHistory">查看作答记录</button></details></section>`;
 }
 function beginPathway(){
  const current=readState();if(!current){message='这份记录暂时只读，原始内容仍可导出。';render();return}const prepared=TransferPolicy.preparePathway(originals(),candidates('training'),history(),current.sessions.nextSeed||1);
  if(!prepared.plan){message='当前范围内还没有配齐未见真题的训练组。可以先练关键判断，或由家长查看供应。';render();return}
  const plan={...prepared.plan,assignmentId:'path-'+Date.now()+'-'+Math.random().toString(36).slice(2,10),assignedAt:Date.now(),profileSnapshot:profile()};
  const candidate=candidates('training').find(t=>t.id===plan.taskIds[0]);
  start('training',{candidate,assignment:plan,pathwayStage:'training'});
 }
 function nextInPathway(){
  const a=active(),s=readState(),progress=s?.sessions.pathway,plan=s?.assignmentsById?.[a?.assignmentId];
  if(!a||!progress||!plan||plan.assignmentId!==progress.assignmentId)return false;
  if(!finish(a.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return true;
  const next=state(),p=next.sessions.pathway;
  if(a.pathwayStage==='training'){
   p.attemptedTaskIds=[...new Set([...p.attemptedTaskIds,a.id])];
   if(a.feedback?.outcome==='VERIFIED')p.completedTaskIds=[...new Set([...p.completedTaskIds,a.id])];
   const available=candidates('training').filter(t=>plan.taskIds.includes(t.id)&&!p.attemptedTaskIds.includes(t.id)&&TransferPolicy.check(t,history()).eligible);
   const candidate=plan.taskIds.map(id=>available.find(t=>t.id===id)).find(Boolean);
   if(candidate){if(commit(next))start('training',{candidate,assignmentId:plan.assignmentId,pathwayStage:'training'});return true}
   const target=TransferPolicy.reservedTarget(plan,originals(),history());
   if(target.candidateRef){p.stage='holdout';if(commit(next))start('exam_holdout',{candidate:target.candidateRef,assignmentId:plan.assignmentId,pathwayStage:'holdout'});return true}
   p.stage='blocked';p.reasonCodes=target.reasonCodes;
   if(commit(next)){message='相关练习已保留；预留真题已经见过或不在当前知识范围，暂不能计作未见检验。';render()}
   return true;
  }
  p.stage='completed';p.finishedAt=Date.now();
  if(commit(next)){message='这一组尝试已保存。训练表现与新真题的首次作答分别记录。';render()}
  return true;
 }
 function diagnosticPlan(a){
  if(!a||a.diagnosticOf||a.finished||a.feedback?.outcome!=='INCORRECT')return null;
  const group=connectedStatus();if(a.connectedGroupId&&!a.monthlyReturn&&(!group||a.connectedGroupId!==group.groupId||group.attemptIds.length>=group.total))return null;
  const known=profile(),p=ExamMapping.getProblem(a.examId||a.originProblemGroupId),allowed=ExamMapping.check(p,known,history()).allowedRouteIds;
  return ExamDiagnostics.choose(a,candidates('training',known),allowed,history());
 }
 function diagnostic(){
  const a=active(),plan=diagnosticPlan(a);if(!plan){message='当前没有已复核且可用的相关短题，已保留这次尝试。';render();return}
  const {link,candidate}=plan,known=profile();let next=state();
  if(a.mode==='exam_holdout'){
   const changed=appendEvent(next,'mode_changed',{fromMode:'exam_holdout',toMode:'practice',reason:'learner_requested_diagnostic'});
   if(!changed.ok)return;next=changed.state;next.sessions.active.mode='practice';next.sessions.active.originalMode='exam_holdout';next.sessions.active.independentAbandoned=true;
  }
  next.sessions.active.priorMethodHelp=true;
  const helped=appendEvent(next,'method_exposed',{reason:'related_probe_opened',judgmentId:link.judgmentId,linkId:link.linkId});
  if(helped.ok&&commit(helped.state))start('training',{candidate,suspendParent:true,profileSnapshot:known,connectedGroup:a.connectedGroupId&&!a.monthlyReturn?connectedStatus():null,connectedStage:'remediation',diagnosticOf:{attemptId:a.attemptId,mathKey:a.mathKey,judgmentId:link.judgmentId,linkId:link.linkId,scope:link.scope}});
 }
 function returnFromDiagnostic(){
  const a=active();if(!a?.diagnosticOf)return;
  if(!finish(a.feedback?.outcome==='VERIFIED'?'completed':'skipped'))return;
  const next=state(),archived=next.sessions.archived||[],at=archived.findIndex(s=>s.attemptId===a.diagnosticOf.attemptId);
  if(at<0){message='原尝试保留在历史记录中。';render();return}
  const parent=archived.splice(at,1)[0];archived.push({...next.sessions.active});parent.finished=false;parent.priorMethodHelp=true;next.sessions.active=parent;
  if(commit(next)){volatileInput=null;showHistory=false;open('examMapping')}
 }
 function resumeMonthly(attemptId){
  const target=PeriodicPracticeUI.monthlyPlan().targets.find(t=>t.parent.attemptId===attemptId&&t.confirmation);
  if(!target||restored().readOnly||!currentScopeAllowed(target.parent)||!activeBuildCompatible(target.parent)||ExamMapping.canonical(ExamDiagnostics.presentation(target.parent.definition))!==ExamMapping.canonical(target.link.snapshot.parentPresentation))return false;
  const candidate=candidates('training',profile()).find(c=>c.id===target.link.probeTaskId);if(!candidate)return false;
  const next=state(),old=next.sessions.active,archived=next.sessions.archived||[];
  // Resume the current reviewed support task without replacing its draft or first response.
  if(old&&!old.finished&&old.kind==='training'&&old.id===candidate.id&&old.mathKey===candidate.mathKey&&
   activeBuildCompatible(old)&&old.diagnosticOf?.attemptId===attemptId&&
   old.diagnosticOf.linkId===target.link.linkId&&currentScopeAllowed(old)&&
   ExamMapping.canonical(ExamDiagnostics.presentation(old.definition))===ExamMapping.canonical(ExamDiagnostics.presentation(candidate.definition))){
   volatileInput=null;showHistory=false;reviewingAttemptId=null;message='';open('examMapping');return true;
  }
  next.sessions.archived=archived.filter(a=>a.attemptId!==attemptId);
  if(old&&old.attemptId!==attemptId&&!next.sessions.archived.some(a=>a.attemptId===old.attemptId))next.sessions.archived.push(old);
  next.sessions.active={...JSON.parse(JSON.stringify(target.parent)),finished:false,monthlyReturn:true,priorMethodHelp:true};
  const helped=appendEvent(next,'method_exposed',{reason:'monthly_related_task',linkId:target.link.linkId});
  if(!helped.ok||!commit(helped.state))return false;
  volatileInput=null;showHistory=false;reviewingAttemptId=null;
  // The related task is support only. It cannot create independent evidence.
  start('training',{candidate,suspendParent:true,profileSnapshot:profile(),connectedStage:'remediation',diagnosticOf:{attemptId,mathKey:target.parent.mathKey,judgmentId:target.link.judgmentId,linkId:target.link.linkId,scope:target.link.scope}});
  return active()?.diagnosticOf?.attemptId===attemptId;
 }
 function loadReuseReviews(){
  if(reuseLoading||!window.__AMC8_OPTIONAL_DATA?.load)return;
  reuseLoading=true;reuseFailed=false;
  window.__AMC8_OPTIONAL_DATA.load('__AMC8_REUSE_REVIEWS').then(()=>{reuseLoading=false;if(view==='examMapping'&&!showHistory)render()},()=>{reuseLoading=false;reuseFailed=true;if(view==='examMapping'&&!showHistory)render()});
 }
 function dashboard(){
  if(!window.__AMC8_REUSE_REVIEWS&&window.__AMC8_OPTIONAL_DATA?.load){
   if(!reuseLoading&&!reuseFailed)loadReuseReviews();
   return supplyDashboard()+'<section class="panel" data-reuse-loading role="status"><h2>旧练习与真题的对应</h2><p>'+(reuseFailed?'历史对应资料没有加载完成，原记录仍保留。':'正在准备历史对应资料，其他练习可以继续。')+'</p>'+(reuseFailed?'<button class="secondary" data-action="rtmLoadReviews">重试加载历史对应</button>':'')+'</section>';
  }
  const rows=JointReuseReview.projection(),count=level=>rows.filter(r=>r.status==='REVIEWED'&&r.matchLevel===level).length;
  const oldRecords=[...(saved.attempts||[]),...Object.values(saved.jointProgress||{}).flatMap(g=>g.records||[])],references=JointReuseReview.readLegacy(oldRecords);
  return supplyDashboard()+`<details class="panel"><summary>家长：旧练习与真题的对应</summary><p>旧练习共 ${rows.length} 组，其中 ${count('FOUNDATION_ONLY')} 组已复核为基础支持，${count('PARTIAL_DECISION')} 组有指定局部关系的对应，${rows.filter(r=>r.status!=='REVIEWED').length} 组等待复核。</p><p>当前历史中有 ${references.length} 条可供参考的局部准备记录。真题应用仍保留当前训练、首次作答与提示使用记录。</p><p>局部对应包括：两份覆盖相加后扣除多算的一次，以及长度按放大倍数变化。几何定位、完整解法和未见题检验需分别作答。</p></details>`;
 }
 function supplyDashboard(){
  const s=readState(),stat=TransferEvidenceStore.statistics(s),c=ExamMapping.data.coverage,childCoverage=ConnectedLearning.coverage();
  return `<section class="panel"><div class="page-head"><h1>家长：真题供应与记录复核</h1><button class="secondary" data-action="home">回到主题选择</button></div><p>孩子从首页“开始做题”进入，真题会在相关练习完成后自然出现。这里用于家长检查供应、呈现与历史记录。</p><div class="stage-buttons"><button class="primary" data-action="rtmPathway">复核跨题训练链</button><button class="secondary" data-action="rtmStart" data-mode="practice">复核单题呈现</button><button class="secondary" data-action="rtmStart" data-mode="training">复核准备任务</button><button class="secondary" data-action="rtmStart" data-mode="exam_holdout">复核未见题分配</button></div><p role="status">${esc(message)}</p><details><summary>家长查看供应与记录</summary><p>映射已核验题中，自动衔接入口题目形式已审通过 ${childCoverage.reviewed} 题，已审受限 ${childCoverage.restricted} 题，待审 ${childCoverage.pending} 题，内容变更需复审 ${childCoverage.stale} 题。另有 ${c.mappingPending} 题待编写映射。</p><p>登记${c.fixed}题：已取得来源资料${c.sourceRetrieved}题，映射已核验${c.mappingVerified}题，待映射${c.mappingPending}题。完整训练链${c.fullChain}题，数学与政策候选${c.runtimeEligible}题，知识限制${c.policyBlocked}题。映射数量与儿童题目形式审核分别统计。</p><p>本入口展示${stat.shown}次，首答提交${stat.submitted}次，无方法提示首答正确${stat.firstUnassistedCorrect}次，跳过${stat.skipped}次，进行中${stat.inProgress}次。</p><p>未见真题检验首次提交${stat.holdoutSubmitted}次，无方法提示首答正确${stat.holdoutFirstUnassistedCorrect}次，主动求助转练习${stat.holdoutHelpConversions}次。</p><p>本次记录来自当前设备。题干朗读与方法提示分别保存；当前尚未测得真实学习效果。</p><button class="secondary" data-action="progressExport">导出完整记录</button></details><button class="secondary" data-action="rtmHistory">历史记录</button></section>`;
 }
 function historyPage(){
  const s=readState(),selected=[...(s?.sessions.archived||[]),...(s?.sessions.active?[s.sessions.active]:[])].find(a=>a.attemptId===reviewingAttemptId);
  return (selected&&TransferEvidenceStore.supersededOriginal(selected)?'<aside class="panel" role="note"><p>这次尝试使用来源纠错前的题目版本。原内容和原结果保留为历史，当前版本的正确记录另行核验。</p></aside>':'')+historyPageBody();
 }
 function historyPageBody(){
  const s=readState(),sessions=[...(s?.sessions.archived||[]),...(s?.sessions.active?[s.sessions.active]:[])];
  const selected=sessions.find(a=>a.attemptId===reviewingAttemptId);
  if(selected){const first=TransferEvidenceStore.attempt(s,selected.attemptId).firstSubmission;return `<section class="panel rtm-record" data-rtm-history><h1>回看以前的尝试</h1><p>${esc(selected.definition.prompt)}</p>${selected.definition.givenText?'<p>'+esc(selected.definition.givenText)+'</p>':''}${statementFigures(selected)}${statementTable(selected)}${(selected.definition.options||[]).length?'<ul>'+selected.definition.options.map(o=>'<li>'+esc(o.id)+'：'+esc(o.text)+'</li>').join('')+'</ul>':''}<p>本次尝试首次提交：${esc(first?.input||'尚未提交')}</p><p>当前草稿：${esc(selected.input||'空')}</p><p>提示使用：${selected.helpLevel}级</p><p>这里只读回看，保留原首答与曝光记录。</p><button class="secondary" data-action="rtmReturn">${active()&&!active().finished?'回到当前练习':'返回练习入口'}</button><button class="secondary" data-action="rtmHistory">返回历史列表</button><button class="secondary" data-action="progressExport">导出完整记录</button></section>`}
  return `<section class="panel" data-rtm-history><h1>以前的尝试</h1>${sessions.length?'<div class="stage-buttons">'+sessions.slice().reverse().map(a=>'<button class="secondary" data-action="rtmReview" data-id="'+esc(a.attemptId)+'">'+esc(a.examId||'运用练习')+' · '+esc(a.definition.prompt.slice(0,45))+'</button>').join('')+'</div>':'<p>还没有记录。</p>'}<button class="secondary" data-action="rtmReturn">返回当前练习</button></section>`;
 }
 function figure(a){
  const f=a.definition.auxiliaryFigure;if(!f||!a.hintsOpen||!a.helpLevel)return '';
  if(f.kind==='groups')return `<figure data-rtm-help-figure><figcaption>按顺序核对两组成员</figcaption><p>${Array.from({length:f.n},(_,i)=>i+1).join('　')}</p><p>甲组：${f.groups[0].join('、')}；乙组：${f.groups[1].join('、')}</p></figure>`;
  if(f.kind==='lshape')return `<figure data-rtm-help-figure><figcaption>外包${f.outer}，去掉${f.inner}；核对重叠处</figcaption><svg viewBox="0 0 180 180" width="180" role="img" aria-label="L形辅助分割图"><path d="M20 20 H80 V100 H160 V160 H20 Z" fill="#a8d7bc" stroke="#346d54" stroke-width="2"/></svg></figure>`;
  return '<div data-rtm-help-figure>'+competitionDiagram(f)+'</div>';
 }
 function statementFigureSource(f){
  const digest=f?.sha256,src=window.__AMC8_SOURCE_FIGURES?.[digest];
  if(typeof digest!=='string'||!/^[a-f0-9]{64}$/.test(digest)||typeof src!=='string')return '';
  if(/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src))return src;
  // Delivery packaging moves the original PNG to a same-origin, content-addressed
  // asset. Accept only the expected hash/path; never interpolate arbitrary URLs.
  try{const page=window.location,url=new URL(src,page.href);
   if(!['http:','https:'].includes(url.protocol)||url.origin!==page.origin||
      !url.pathname.endsWith('/assets/loading-r1/'+digest+'.png')||url.search||url.hash)return '';
   return url.href;
  }catch(_){return ''}
 }
 function givenRayDiagram(a){
  const visual=ConnectedLearning.givenVisual(a.definition,a.definition);if(!visual)return '';
  const label=visual==='afg-rays-70-v1'?'图示：FA 与 FD 反向，FG 与 FB 同向；已知角 AFG 为 70 度。':'图示：比较角 AFG 与角 BFD；FA 与 FD 反向，FG 与 FB 同向。';
  const degrees=visual==='afg-rays-70-v1'?'<text x="130" y="120">70°</text>':'';
  return '<figure data-rtm-given-diagram><svg viewBox="0 0 320 220" role="img" aria-label="'+esc(label)+'" style="max-width:320px;width:100%;height:auto">'+
   '<path d="M99.52 134.35 L240.48 185.65 M170 160 L170 45" fill="none" stroke="#173344" stroke-width="2.5"/>'+
   '<circle cx="170" cy="160" r="3" fill="#173344"/><circle cx="170" cy="90" r="2.5" fill="#173344"/>'+
   '<g font-size="18" fill="#173344"><text x="82" y="135">A</text><text x="247" y="194">D</text><text x="178" y="169">F</text><text x="178" y="94">G</text><text x="178" y="47">B</text>'+degrees+'</g></svg>'+
   '<figcaption>题目给出的线段关系示意图；以文字条件为准。</figcaption></figure>';
 }
 function statementFiguresReady(a){
  const figures=a.definition.givenFigures||[];
  if(!figures.length)return true;
  if(figures.some(f=>!statementFigureSource(f)))return false;
  // A real browser must finish loading all required images before submission.
  if(typeof document.querySelectorAll!=='function')return true;
  const images=document.querySelectorAll('#app [data-rtm-statement-image]');
  return images.length===figures.length&&Array.from(images).every(img=>img.complete&&img.naturalWidth>0);
 }
 function statementFigures(a){
  return (a.definition.givenFigures||[]).map((f,i)=>{
   const src=statementFigureSource(f);
   if(!src)return '<p role="alert">题目图片暂不可用，请返回后重试；原答案和草稿会保留。</p>';
   return `<figure class="rtm-given-figure" data-rtm-given-figure><img data-rtm-statement-image src="${esc(src)}" alt="题目原有图示 ${i+1}"/><figcaption>题目图示 ${i+1}</figcaption><details data-rtm-figure-zoom><summary>放大查看图示 ${i+1}</summary><div tabindex="0" role="region" aria-label="放大的题目图示 ${i+1}，可横向滚动" style="overflow:auto;max-height:75vh;border:1px solid currentColor;padding:8px"><img src="${esc(src)}" alt="放大的题目原有图示 ${i+1}" style="width:auto;min-width:100%;max-width:none;height:auto"/></div></details></figure>`;
  }).join('')+givenRayDiagram(a);
 }
 function statementTable(a){
  const table=a.definition.givenTable;
  if(!table?.length)return '';
  return '<div class="rtm-given-table" data-rtm-given-table><table aria-label="题目数据表"><tbody>'+table.map(row=>'<tr>'+row.map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 function page(){
  if(!enabled())return '<section class="panel"><p>这项练习暂未开放。</p><button class="secondary" data-action="home">返回</button></section>';
  if(showHistory)return historyPage();
  const r=restored();if(r.readOnly)return dashboard()+'<p role="alert">这份新格式记录暂时只读，原始内容保留在完整导出中。</p>';
  const a=active(),group=connectedStatus();if(group&&group.status!=='active'&&(!a||a.finished&&a.connectedGroupId===group.groupId))return connectedSummary();
  if(a?.connectedGroupId&&(!group||a.connectedGroupId!==group.groupId))return dashboard()+'<p>这组资料不完整，原草稿仍可导出，请从首页开始新一组。</p>';
  if(!a||a.finished)return dashboard();
  if(!activeBuildCompatible(a))return dashboard()+'<p>旧草稿已保留，题目呈现或内容版本发生变化。可只读回看原记录，或保留草稿后从新题继续。</p><button class="secondary" data-action="rtmHistory">只读回看历史</button><button class="secondary" data-action="progressExport">导出完整记录与草稿</button><button class="secondary" data-action="rtmArchive">保留旧草稿并继续</button>';
  if(!currentScopeAllowed(a))return `<section class="panel" data-rtm-scope-paused><h1>这道保留题已暂停</h1><p>当前知识、来源、负担或题目审核范围不满足继续条件。原首答、提示和草稿都保留，可以由家长调整范围，或只读回看原记录。</p><button class="secondary" data-action="rtmBack">返回首页</button><button class="secondary" data-action="rtmHistory">只读回看历史</button><button class="secondary" data-action="progressExport">导出完整记录与草稿</button></section>`;
  const def=a.definition,answer=def.answerContract,readonly=a.mode==='history_review';
  return `<section class="panel rtm-task" data-rtm-task="${esc(a.id)}">
   <div class="page-head"><p>${a.connectedGroupId?`本组已练 ${group.attemptIds.length}/${group.total} 题 · ${a.kind==='exam'?'把知识用起来 · AMC8真题 · '+esc(a.examId):'为 '+esc(ConnectedLearning.routeTopics(a.connectedTarget?.routeId).filter(id=>group.profileSnapshot.topicIds.includes(id)).map(id=>SKILL_DATA.units.find(unit=>unit.id===id)?.title||id).join('、')||'当前目标')+' 作准备 · 对应 '+esc(a.connectedTarget?.examId||a.originProblemGroupId)}`:a.kind==='exam'?'AMC8真题 · '+esc(a.examId):'综合运用练习'}</p><button class="secondary" data-action="rtmBack">返回首页</button>${a.connectedGroupId?'':'<button class="secondary" data-action="rtmModes">换练习类型</button><button class="secondary" data-action="rtmHistory">历史记录</button>'}</div>
   ${connectedSupportAdvice(a.connectedGroupId?group:null)}${a.relatedPracticeOf?'<p class="tiny-note">这是关联上一题的练习，不计作未见独立迁移检验。</p>':''}
   <h1 class="task-title">${esc(def.prompt)}</h1>${def.givenText?'<p data-rtm-givens>'+esc(def.givenText)+'</p>':''}${statementFigures(a)}${statementTable(a)}<button class="secondary" data-action="rtmRead">🔊 朗读题目</button><button class="secondary" data-action="rtmStop">停止朗读</button>
   <section class="competition-hints"><button class="secondary" data-action="rtmHint" aria-expanded="${a.hintsOpen}">${a.helpLevel?'查看提示':'提示'}</button>${a.hintsOpen?`<div>${def.hints.slice(0,a.helpLevel).map(h=>'<p>'+esc(h)+'</p>').join('')}<button class="secondary" data-action="rtmReadHint">🔊 朗读提示</button><button class="secondary" data-action="rtmStop">停止朗读</button>${a.helpLevel<def.hints.length?'<button class="secondary" data-action="rtmHint">下一条提示</button>':''}<button class="secondary" data-action="rtmCloseHint">收起提示</button>${figure(a)}</div>`:''}</section>
   <form data-rtm-form>${answer.kind==='choice'?`<div class="choices">${def.options.map(o=>`<button type="button" class="${a.input===o.id?'primary':'secondary'}" data-action="rtmChoice" data-value="${esc(o.id)}" aria-pressed="${a.input===o.id}">${esc(o.text)}</button>`).join('')}</div>`:`<label>你的答案<input data-rtm-input="answer" inputmode="${a.connectedGroupId?'text':answer.kind==='rational'?'decimal':'text'}" maxlength="1000" value="${esc(volatileInput!==null?volatileInput:a.input||'')}" aria-label="你的答案"></label>`}<button type="submit" class="primary" data-action="rtmSubmit">提交答案</button></form>
   <p role="status" data-rtm-feedback>${esc(message||a.targetedFeedback||(a.diagnosticOf?(a.feedback?.outcome==='VERIFIED'?'短题完成了，回到刚才那题再试一试。':a.feedback?'还可以继续想一想，也可以回到刚才那题。':''):a.connectedGroupId?(a.feedback?.outcome==='VERIFIED'?'答对了，可以继续。':a.feedback?'还可以继续想一想；也可以查看提示。':''):feedbackText(a.feedback)))}</p>
   ${a.feedback?.outcome==='INCORRECT'?'<button class="secondary" data-action="rtmRetry">再试一次这道题</button>':''}
   ${diagnosticPlan(a)?'<p>可以先试一道相关短题，再回到这里继续。</p><button class="secondary" data-action="rtmDiagnostic">试一道相关短题</button>':''}${a.diagnosticOf?'<button class="secondary" data-action="rtmReturnParent">回到刚才那题</button>':''}${a.connectedGroupId&&relatedVariantPlan(a,group)?'<p>可以换个条件，继续练这道题的思路；这会记为相关练习。</p><button class="secondary" data-action="rtmVariant">换个条件继续练</button>':''}
   <div class="stage-buttons"><button class="secondary" data-action="rtmNext">${a.diagnosticOf?'回到刚才那题':a.feedback?.outcome==='VERIFIED'?'下一题':'保留当前尝试，换一道新题'}</button></div>${a.feedback?'<p class="tiny-note">首次作答已保留，后续修改另外记录。</p>':''}</section>`;
 }
 function handle(action,data){
  if(!action.startsWith('rtm'))return false;
  if(!enabled())return true;
  if(['rtmChoice','rtmDiagnostic','rtmRetry','rtmVariant'].includes(action)&&!requireCurrentScope())return true;
  if(action==='rtmOpen'){message='';showHistory=false;reviewingAttemptId=null;open('examMapping')}
  if(action==='rtmLoadReviews'){reuseFailed=false;loadReuseReviews();render();return true}
  if(action==='rtmStart')start(['training','practice','exam_holdout'].includes(data.mode)?data.mode:'practice');
  if(action==='rtmPathway')beginPathway();
  if(action==='rtmDiagnostic')diagnostic();
  if(action==='rtmVariant'){const a=active(),group=connectedStatus();if(relatedVariantPlan(a,group))nextConnected({variantOf:a.attemptId});else{message='当前范围暂无经过核验的相关新练习；原记录已保留。';render()}return true;}
  if(action==='rtmRetry'){
   const a=active();if(a&&!a.finished&&a.feedback?.outcome==='INCORRECT'){
    const next=state();next.sessions.active.feedback=null;next.sessions.active.input='';next.sessions.active.targetedFeedback='';
    if(commit(next)){volatileInput=null;message='可以再试一次。第一次的答案仍保留。';render()}
   }
  }
  if(action==='rtmReturnParent')returnFromDiagnostic();
  if(action==='rtmSubmit')submit();
  if(action==='rtmChoice'){input(data.value);render()}
  if(action==='rtmHint')help();
  if(action==='rtmCloseHint'){stop();const next=state();if(next?.sessions.active){next.sessions.active.hintsOpen=false;commit(next);render()}}
  if(action==='rtmRead')read();if(action==='rtmReadHint')read(true);if(action==='rtmStop')stop();
  if(action==='rtmConnectedResume')resumeConnected();
  if(action==='rtmConnectedRetry')retryDeferred(data.id);
  if(action==='rtmConnectedNew'){if(!beginConnected(profile()))open('home')}
  if(action==='rtmNext'){if(active()?.monthlyReturn&&!active()?.diagnosticOf){const parent=active();if(finish(parent.feedback?.outcome==='VERIFIED'?'completed':'skipped')){PeriodicPracticeUI.returned(parent);open('periodicReview')}return true;}if(active()?.diagnosticOf)returnFromDiagnostic();else if(!nextConnected()&&!nextInPathway()){const a=active(),mode=a?.mode||'practice';if(finish(a?.feedback?.outcome==='VERIFIED'?'completed':'skipped'))start(mode)}}
  if(action==='rtmBack'){stop();open('home')}
  if(action==='rtmModes'){if(finish(active()?.feedback?.outcome==='VERIFIED'?'completed':'skipped'))render()}
  if(action==='rtmArchive'){const next=state();if(next?.sessions.active){next.sessions.active.finished=true;commit(next);render()}}
  if(action==='rtmHistory'){showHistory=true;reviewingAttemptId=null;if(view==='examMapping')render();else open('examMapping')}
  if(action==='rtmReview'){showHistory=true;reviewingAttemptId=data.id;if(view==='examMapping')render();else open('examMapping')}
  if(action==='rtmReturn'){showHistory=false;reviewingAttemptId=null;render()}
  return true;
 }
 function afterRender(){if(view==='examMapping'&&typeof document.querySelector==='function'&&document.querySelector('[data-rtm-task]'))ensureShown()}
 document.addEventListener('input',e=>{if(e.target.dataset?.rtmInput)input(e.target.value)});
 document.addEventListener('submit',e=>{if(e.target.matches('[data-rtm-form]')){e.preventDefault();submit()}});
 function exportDraft(){return {mappingBuildId:ExamMapping.data.mappingBuildId,record:saved.rtm1??null,activeInput:volatileInput!==null?volatileInput:active()?.input||'',readOnly:restored().readOnly}}
 return {page,handle,afterRender,stop,history,exportDraft,enabled,childEntryEnabled,beginConnected,connectedStatus,connectedAvailability,supplyPlans,resumeMonthly};
})();

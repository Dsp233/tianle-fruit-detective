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
 return `<section class="topic-question competition-question"><div class="page-head"><div><p class="kicker">第 ${session.cursor+1} / ${session.total} 题 · ${c.level?['','起步','进阶','挑战'][c.level]:'思路挑战'}</p><h1>${esc(c.title||topicNames(c.topicIds))}</h1>${item.passed?`<p class="competition-topic-label">本题用到：${esc(topicNames(c.displayTopicIds||c.topicIds))}</p>`:''}</div><button class="back" data-action="topicExit">← 换主题</button></div><div class="topic-question-nav"><button class="secondary" data-action="topicPrevious" ${session.cursor?'':'disabled'}>← 上一题</button><span role="status">${item.autoExcluded?'这道题以前已答对，当前是历史回看。':item.passed?'答对了，可以比较解法或继续':'找关键关系，试试更简洁的解法'}</span></div><article class="panel topic-question-work"><h2 class="task-title">${esc(CompetitionContentContracts.resolve(task).promptText)} <button class="read-mini" data-action="competitionRead" aria-label="朗读题目及图表条件">🔊</button></h2>${competitionClues(task)}${competitionHintPanel(c,state,history)}<form data-competition-form="main">${competitionAnswerInputs(task,item,state)}${CompetitionModelWorkspace.panel(task,state)}<button type="submit" class="primary" data-action="check">检查答案 ✓</button>${feedback?`<p class="feedback competition-submit-feedback ${feedback.ok?'ok':'retry'}" tabindex="-1" data-answer-status="${feedback.status||(feedback.ok?'correct':'needs_revision')}" role="status" aria-live="polite">${esc(competitionFeedbackText(feedback))}</p>`:''}</form>${learnerSketchPanel(task)}${!item.passed?reasoningPanel(task):''}<details class="competition-notes"><summary>记下我的思路</summary><textarea data-competition-input="notes" maxlength="1200" aria-label="我的解题思路" placeholder="可以记算式，也可以在纸上画图。">${esc(state.notes)}</textarea></details><div id="speech-status" class="tiny-note" role="status" aria-live="polite">${esc(speechMessage)}</div><div class="competition-actions">${item.passed||item.autoExcluded?'<button type="button" class="primary" data-action="next">下一题 →</button>':''}${!item.passed?'<button class="secondary" data-action="topicSkip">先跳过，保留草稿</button>':''}</div>${competitionSolutions(task)}</article></section>`;
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

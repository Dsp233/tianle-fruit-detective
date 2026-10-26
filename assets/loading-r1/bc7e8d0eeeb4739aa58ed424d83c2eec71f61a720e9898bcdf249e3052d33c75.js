'use strict';
// New five-role families have a separate contract; the inherited 380 stay unchanged.
function jointExtended(t){return t.joint?.binding?.startsWith('extended-')===true}
function jointExtendedFamily(t){return JOINT_FAMILIES.get(t.joint.familyId)}
function jointExtendedWhole(t){
 const gcd=(a,b)=>b?gcd(b,a%b):a,ds=[t.denom,t.denomLeft,t.denomRight,t.total].filter(Number.isInteger);
 return 2*ds.reduce((n,d)=>n*d/gcd(n,d),1);
}
function jointExtendedPrefix(t){
 const s=t.skillId,p=t.joint.params;
 if(s.startsWith('A03'))return `本订单把原图每1个整体对应${jointExtendedWhole(t)}克原料；图上整体若放大，原料也按同一倍数变化。数轴上每1单位也对应这份原料。`;
 if(s==='A04.02'&&t.mode==='fractionLab')return `本图整体对应${t.denom}克原料，每个小格对应1克。`;
 if(s.startsWith('A04'))return s==='A04.06'?'估算订单按本题向上预留的计划数量采购；有上下界时用上界，没有上下界时用指定近似数的积。计划用量不表示精确实际数量。':'把本图每个实际对象对应1件材料；只对订单所求的部分、整体或变化后数量采购。';
 if(['A05.01','A05.02'].includes(s))return `储料层在数轴位置${p.referenceLevel}；每段长1米，采购所求位置到储料层的连接线。`;
 if(s==='A05.03')return '每个单位段长1米，采购本次移动所经过的总长度。';
 if(['A05.04','A05.05'].includes(s))return `本订单的每张单位格边长是${t.unitSize??1}厘米；图中贴纸或面积格都按这个实际边长换成订单所求的面积或长度。`;
 if(s==='G03.01'&&t.puzzles)return '两盘是同一个目标的不同分割，只采购一份目标材料，每格1平方厘米。';
 if(s.startsWith('G03'))return '每个单位格边长1厘米；若题目数正方形，则每个指定尺寸与位置的正方形各需要1张标签。';
 if(s==='G04.01')return `本圆实际半径为${t.radius}厘米，每个指定圆周点都需从真圆心连接一条导线。`;
 if(s==='G04.03')return '各盘各采购一次指定圆弧，直径线段另用旧料，本订单不采购直径；以π厘米为1个计价单位。';
 if(s==='G04.04')return '只采购较大圆的材料，以π平方厘米为1个计价单位。';
 if(s==='G04.06')return '只为图中指定扇形采购面料，以π平方厘米为1个计价单位；弧线不在这份订单内。';
 if(s==='G05.01'){const labels=similarLabels(t,'target');return `目标点${labels.map((v,i)=>v+'的负荷为'+(i+1)).join('，')}份。先找对应目标边，采购该边两个端点负荷之和。`;}
 if(s.startsWith('G05'))return '图中每个长度单位是1厘米。订单使用完成原操作后的新图形；预先剪去的格不采购。';
 if(s==='G07.02')return '面A、B、C、D、E、F的负荷依次为1、2、3、4、5、6份。完成面身份对应后，只采购与A面相对的面的负荷。';
 if(s==='G07.03')return '每个展开格边长1厘米。先选有效展开图，再选其中最省纸的、边平行格线的最小外接矩形；按整张矩形购纸。';
 if(s==='G07.04')return '面A、B、C、D、E、F的负荷依次为1、2、3、4、5、6份。把每个指定面的相对面负荷相加采购。';
 if(['G07.05','G07.06'].includes(s))return '每盘立体各采购一件，把各盘所求体积或表面积相加，不以比较结果代替总用量。';
 if(s.startsWith('D01'))return s==='D01.06'?'每1分钟合格时长需要1厘米标记带，按全部满足条件的区间总时长采购。':`图中每1${t.unit}的实际登记量需要1张记录卡，把各类实际数量相加采购记录卡。`;
 if(s.startsWith('D02'))return `把所求数值按每1${t.unit}对应1厘米的比例制作一条标记带；采购长度，不把分数个原对象当作可购买的物品。`;
 if(s.startsWith('D03'))return ['D03.01','D03.02','D03.03'].includes(s)?'每个模型的每个具体样本结果各印1张卡；两阶段保留先后及放回条件，同颜色不合并原身份。':'每个模型只给符合事件的具体样本结果各印1张卡；两阶段保留先后及放回条件。';
 if(s.startsWith('S01'))return s==='S01.05'?'完全展开后的每个实际孔需要1枚加固圈。':`取原图最后列出的点${t.points.at(-1).id}，完成全部指定变换后，从它的终位沿横纵格路走到材料站(${p.depot.join(',')})；每格1米，采购最短格路长度，不能走斜线。`;
 if(s==='S02.03')return '只给题目列出的试验中实际合法的操作各配1枚标记；自行增加的试验不计。';
 if(s==='S02.05')return '目标可达时按目标红卡数采购红套；目标不可达则拒绝订单，用量与费用均为0。';
 if(s.startsWith('G02'))return '按原操作所求角度或三角形数结算相应加工服务，不按图形看起来的大小结算。';
 return '请先完成图中操作并核对单位，再用本题指定的实际量填写订单。';
}
function jointExtendedQuantity(t,w=draft.work||{}){
 const s=t.skillId,k=t.kind,sum=a=>a.reduce((n,v)=>n+v,0);
 if(s.startsWith('A03')){
  const whole=jointExtendedWhole(t);
  if(k==='compare')return Math.max(t.targetLeft/t.denomLeft*(t.wholeScaleLeft||1),t.targetRight/t.denomRight*(t.wholeScaleRight||1))*whole;
  if(k==='equal')return t.targetLeft/t.denomLeft*whole;
  if(k==='line')return (t.coordinate??((t.lineStart||0)+t.target/t.denom*((t.lineEnd??1)-(t.lineStart||0))))*whole;
  if(k==='remainder')return t.second/t.total*whole;
  return t.target/t.denom*whole;
 }
 if(s.startsWith('A04')){
  if(k==='whole')return t.part*t.copies;
  if(k==='change')return t.start+t.add-t.remove;
  if(k==='estimate')return t.bounds?t.bounds.upper[0]*t.bounds.upper[1]:t.targetA*t.targetB;
  return t.target;
 }
 if(s.startsWith('A05')){
  if(k==='position'||k==='compare')return Math.abs(t.joint.params.referenceLevel-(k==='compare'?Math.max(t.left,t.right):t.target));
  if(k==='walk')return Math.abs(t.target-t.start);
  if(k==='square')return t.target;
  if(k==='root')return Math.sqrt(t.target);
  if(k==='power')return t.base**t.exponent;
 }
 if(t.mode==='measureLab'){
  if(k==='length')return (t.end-t.start)*t.unitSize;
  const cells=measureCells(t,{tiles:{},...w});
  return ['perimeter','rearrange'].includes(k)?measureEdges(cells,true).length*t.unitSize:cells.length*t.unitSize**2;
 }
 if(t.mode==='angleLab'){
  if(k==='arms')return w.angle??0;
  if(k==='turn')return w.turns?.[0]?.angle??0;
  if(k==='polygon')return w.triangles??0;
  return 180-sum(t.angles.filter((_,i)=>i!==t.unknown));
 }
 if(t.mode==='compositeLab'){
  if(k==='cut')return t.rows*t.cols-t.remove.length;
  if(k==='squares')return sum(t.sizes.map(a=>(t.rows-a+1)*(t.cols-a+1)));
  const p=compositePuzzles(t)[0];return p.fixed.length+p.piece.length;
 }
 if(t.mode==='circleLab'){
  if(k==='center')return t.radius*(w.rays?.length??0);
  if(k==='radii'||k==='arc')return w.answer??0;
  if(k==='walk')return sum((w.routes||[]).map(r=>r.coeff));
  if(k==='area')return Math.max(0,...(w.areas||[]).map(a=>a.coeff));
  if(k==='objects')return w.objects?.[1]?.coeff??0;
 }
 if(t.mode==='similarLab'){
  if(k==='correspond'){const edge=w.marks?.targetEdge??-1;return edge<0?0:(edge+1)+((edge+1)%similarBase(t).length+1);}
  if(k==='area')return (w.covered?.target||[]).length;
  const d=similarDimensions(t,'target',{scaleX:1,scaleY:1,...w});
  return k==='perimeter'?2*(d.width+d.height):d.width*d.height;
 }
 if(t.mode==='rightLab'){
  if(k==='condition')return t.cards.filter(c=>c.givenAngle===90).length;
  if(k==='squares')return t.c**2;
  if(k==='axis')return Math.abs(t.A[0]-t.B[0])+Math.abs(t.A[1]-t.B[1]);
  return t[t.unknown||'c'];
 }
 if(t.mode==='solidLab'){
  if(k==='counts')return sum((w.nets||[]).map(n=>n.counts.edges));
  if(k==='match'){const frames=solidAnalysis(t.nets[0],w.nets?.[0]?.angles||{}).frames,a=frames.A;const id=Object.keys(frames).find(id=>a&&solidDot(a.n,frames[id].n)<-1+1e-8);return id?id.charCodeAt(0)-64:0;}
  if(k==='valid'){
   const areas=t.nets.filter((_,i)=>w.nets?.[i]?.choice==='valid').map(net=>{const xs=net.map(p=>p[0]),ys=net.map(p=>p[1]);return (Math.max(...xs)-Math.min(...xs)+1)*(Math.max(...ys)-Math.min(...ys)+1)});
   return areas.length?Math.min(...areas):0;
  }
  if(k==='opposite')return sum((w.nets||[]).flatMap(n=>t.asked.map(id=>n.opposites[id]?.charCodeAt(0)-64||0)));
  return sum((w.stacks||[]).map(a=>a.answer));
 }
 if(t.mode==='chartLab')return k==='interval'?chartDuration(t,w.intervals||[]):sum(t.values);
 if(t.mode==='statsLab'){
  if(k==='sort')return Math.min(...t.values);
  return k==='modeRange'?w.range??0:w.answer??0;
 }
 if(t.mode==='chanceLab')return sum(t.models.map(m=>chanceOutcomes(m).filter(tuple=>!['favorable','two','weighted'].includes(k)||chanceFavorable(m,tuple)).length));
 if(t.mode==='motionLab'){
  if(k==='fold')return w.removed?.length??0;
  const point=w.live?.find(p=>p.id===t.points.at(-1).id);return point?Math.abs(point.x-t.joint.params.depot[0])+Math.abs(point.y-t.joint.params.depot[1]):0;
 }
 if(t.mode==='invariantLab'){
  if(k==='filter')return (w.records||[]).filter(r=>r.status==='keep').length;
  if(k==='legal')return (w.trials||[]).filter(r=>r.legal).length;
  if(k==='invariant')return w.state?.order.length??0;
  if(k==='proof')return w.verdict==='reachable'?t.goal.filter(c=>c==='红').length:0;
  return w.state?invariantRed(w.state).length:0;
 }
 throw Error('Unreviewed extended quantity '+s);
}
function jointExtendedUnit(t){
 const s=t.skillId;
 if(s.startsWith('A03')||s==='A04.02'&&t.mode==='fractionLab')return '克';
 if(s.startsWith('D02')||s==='D01.06')return '厘米';
 if(s.startsWith('D01')||s.startsWith('D03'))return '张';
 if(['A05.01','A05.02','A05.03'].includes(s)||s.startsWith('S01')&&s!=='S01.05')return '米';
 if(t.mode==='measureLab')return (['area','units'].includes(t.kind)?'平方':'')+(t.unit==='m'?'米':'厘米');
 if(t.mode==='angleLab')return t.kind==='polygon'?'个三角形':'度';
 if(t.mode==='circleLab')return ['walk'].includes(t.kind)?'π厘米':['area','objects'].includes(t.kind)?'π平方厘米':'厘米';
 if(t.mode==='similarLab')return t.kind==='correspond'?'份':t.kind==='perimeter'?'厘米':'平方厘米';
 if(t.mode==='compositeLab')return t.kind==='squares'?'个':'平方厘米';
 if(t.mode==='solidLab')return t.kind==='volume'?'立方厘米':['surface','valid'].includes(t.kind)?'平方厘米':t.kind==='counts'?'条':'份';
 if(t.mode==='rightLab')return t.kind==='condition'?'张':t.kind==='squares'?'平方厘米':'厘米';
 if(t.mode==='integerLab')return t.kind==='square'?'平方厘米':t.kind==='root'?'厘米':'件';
 return '件';
}
function jointExtendedFields(t){
 const unit=jointExtendedUnit(t),op=t.joint.params.operator,quantity=['quantity','订单用量（'+unit+'）'];
 if(op==='extended-cover')return [quantity,['packages','至少需要的整包数'],['unused','剩余容量（'+unit+'）']];
 if(op==='extended-offers')return [quantity,['plan','选择总价较低的报价'],['cost','所选报价总额（元）']];
 if(op==='extended-budget')return [quantity,['enough','预算够用填1，不够填0'],['left','预算剩余（元，不够填0）'],['short','还缺金额（元，够用填0）']];
 return [quantity,...(op==='extended-counter'?[['reason','哪项能纠正上面的说法']]:[]),['cost','本订单总额（元）']];
}
function jointExtendedText(t){
 const p=t.joint.params,f=jointExtendedFamily(t),u=jointExtendedUnit(t),head=jointExtendedPrefix(t)+' 本次取“'+f.quantityLabel+'”。';
 const zero='用量为0时不下单，不付固定费。';
 if(p.operator==='extended-cover')return head+`每包最多供应${p.capacity}${u}，只能买整包；填写最少包数和未用容量。`+zero;
 if(p.operator==='extended-offers')return head+`报价A每${u}${p.plans[0].unitPrice}元，固定费${p.plans[0].fee}元；报价B每${u}${p.plans[1].unitPrice}元，固定费${p.plans[1].fee}元。选择总额较低者，同价可选任意一个。`+zero;
 return head+(p.operator==='extended-counter'?`核对说法：“${f.counterClaim}”。`:'')+`每${u}${p.unitPrice}元，另收一次固定费${p.fee}元。`+(p.operator==='extended-budget'?`预算${p.budget}元，分别填是否够用、剩余和差额。`:'填写本订单总额。')+zero;
}
function jointExtendedNumber(raw){
 if(typeof raw!=='string'||!raw.trim()||raw.length>40)return null;
 const s=raw.trim();if(!/^-?\d+(?:\.\d+)?(?:\/-?\d+(?:\.\d+)?)?$/.test(s))return null;
 const [a,b]=s.split('/').map(Number);if(b===0)return null;const n=b===undefined?a:a/b;
 return Number.isFinite(n)&&Math.abs(n)<=1000000?n:null;
}
function jointExtendedReady(t){const r=jointState().responses;return jointExtendedFields(t).every(([k])=>k==='plan'?['A','B'].includes(r[k]):k==='reason'?['conditions','appearance','always'].includes(r[k]):jointExtendedNumber(r[k])!==null)}
function jointExtendedExpected(t){
 const q=jointExtendedQuantity(t),p=t.joint.params,cost=q>0?q*p.unitPrice+p.fee:0;
 if(!Number.isFinite(q)||q<0)throw Error('Invalid extended quantity '+t.id);
 if(p.operator==='extended-cover'){const packages=Math.ceil(q/p.capacity-1e-10);return {quantity:q,packages,unused:packages*p.capacity-q};}
 if(p.operator==='extended-offers'){const costs=p.plans.map(x=>q>0?q*x.unitPrice+x.fee:0),min=Math.min(...costs);return {quantity:q,plans:p.plans.filter((_,i)=>Math.abs(costs[i]-min)<1e-8).map(x=>x.id),cost:min};}
 if(p.operator==='extended-budget')return {quantity:q,enough:cost<=p.budget?1:0,left:Math.max(0,p.budget-cost),short:Math.max(0,cost-p.budget)};
 return {quantity:q,cost,...(p.operator==='extended-counter'?{reason:'conditions'}:{})};
}
function jointExtendedValidate(t,base){
 const native=base.grade(t),expected=jointExtendedExpected(t),r=jointState().responses;
 const support=jointExtendedReady(t)&&jointExtendedFields(t).every(([k])=>k==='plan'?expected.plans.includes(r[k]):k==='reason'?r[k]===expected[k]:Math.abs(jointExtendedNumber(r[k])-expected[k])<1e-8);
 return {ok:!!native.ok&&support,reason:!native.ok?native.reason:'核对原操作实际所求的量、单位，以及这份材料的单价、固定费、整包或预算。',nativeAnchorPassed:!!native.ok,supportAnchorPassed:support,observedErrors:[...(!native.ok?['primary-operation-condition']:[]),...(!support?['shared-condition-response']:[])]};
}
function jointExtendedBoard(t,base){
 const native=base.board(t),r=jointState().responses,f=jointExtendedFamily(t);
 return native+`<section class="joint-material"><h3>共同材料与订单</h3><p>${esc(jointExtendedText(t))}</p><button class="secondary" data-action="jointMaterialSpeak">🔊 听这份材料</button><div class="joint-fields">${jointExtendedFields(t).map(([k,label])=>k==='plan'||k==='reason'?`<section><p>${esc(label)}</p>${choiceButtons(t,k==='plan'?[['A','报价A'],['B','报价B']]:[['conditions',f.counterExplanation],['appearance','只要图看起来相像，就按外观决定'],['always','不必核对条件，上面的说法总成立']],k==='plan'?'jointPlan':'jointExtendedReason','extended-'+k,r[k])}</section>`:`<label>${esc(label)}<input class="joint-input" inputmode="text" data-joint-field="${k}" aria-label="${esc(label)}" value="${esc(r[k]??'')}" autocomplete="off"/></label>`).join('')}</div><p class="tiny-note">可填小数或分数，例如3/2；0也须填写。${t.joint.kind==='C'?'这是反例练习，不计独立通过。':''}</p></section>`;
}
function jointExtendedGuard(t){const p=t.joint.params;if(!['bill','cover','offers','counter','budget'].some(v=>p.operator==='extended-'+v)||!Number.isInteger(p.capacity)||p.capacity<=0||!Number.isInteger(p.unitPrice)||p.unitPrice<=0||!Number.isInteger(p.fee)||p.fee<0||!jointExtendedFamily(t)?.counterExplanation)throw Error('Invalid extended contract '+t.id)}
// Source identity is audit metadata. Cosmetic text/code changes must not turn
// an already seen mathematical problem into a fresh independent opportunity.
// A changed quantity/unit rule requires an explicit authored rule-version bump.
function jointExtendedRuleFingerprint(f){const hash=window.__AMC8_REUSE_SOURCE_HASHES['joint_extended.js'];if(!/^[a-f0-9]{64}$/.test(hash||'')||f.quantityRuleId!=='shared-quantity-'+f.primarySkillId||f.quantityRuleVersion!==1)throw Error('Extended rule identity is missing');return JSON.stringify(['shared-quantity',f.quantityRuleId,f.quantityRuleVersion])}
function jointExtendedObserved(t){return {primarySkillId:t.skillId,operator:t.joint.params.operator,quantity:jointExtendedQuantity(t),unit:jointExtendedUnit(t),quantityRule:jointExtendedRuleFingerprint(jointExtendedFamily(t)),sourceSha256:window.__AMC8_REUSE_SOURCE_HASHES['joint_extended.js'],counterexamplePractice:t.joint.kind==='C',noSingleSkillCredit:true}}

'use strict';
const JOINT_CONTENT=window.__AMC8_JOINT,JOINT_FAMILIES=new Map(JOINT_CONTENT.families.map(f=>[f.id,f]));
const JOINT_BINDINGS={
 count:t=>t.target,exchange:t=>10*t.initialTens+t.initialOnes,money:t=>10*t.tens+t.ones,larger:t=>Math.max(...t.target),
 changed:t=>t.initial+(t.mode==='counterChange'?t.add:-t.remove),missing:t=>10-(t.filledIndices?.length??t.filled),restored:t=>t.initial,
 product:t=>t.groups*t.each,division:t=>t.unknownKind==='groups'?t.total/t.each:t.total/t.groups,order:t=>(t.initial+t.add)*(t.copies??2)
};
function jointQuantity(task){if(jointExtended(task))return jointExtendedQuantity(task);if(jointLFamily(task))return jointLQuantity(task);if(jointRFamily(task))return jointRQuantity(task);const q=JOINT_BINDINGS[task.joint.binding]?.(task);if(!Number.isFinite(q)||q<0||!Number.isInteger(q))throw Error('Invalid shared quantity '+task.id);return q}
function jointRole(task){if(jointExtended(task))return jointExtendedFamily(task).quantityLabel;if(jointNFamily(task))return jointNRole(task);if(jointLFamily(task))return jointLRole(task);if(jointRFamily(task))return jointRRole(task);return task.joint.binding==='division'?(task.unknownKind==='groups'?'分得的组数':'一组实际分到的数量'):task.joint.quantityLabel}
function jointFields(task){if(jointExtended(task))return jointExtendedFields(task);if(jointNFamily(task)&&jointNFields(task))return jointNFields(task);if(jointLFamily(task)&&jointLFields(task))return jointLFields(task);if(jointRFamily(task)&&jointRFields(task))return jointRFields(task);if(jointRaffle(task))return [['numerator','机会的分子'],['denominator','机会的分母']];const p=task.joint.params;return p.operator==='bill'?[['cost','总金额（元）']]:p.operator==='remaining'?[['left','付完后的剩余经费（元）']]:p.operator==='offers'?[['plan','选择报价'],['cost','所选报价的总金额（元）']]:p.operator==='funds'?[['count','最多买到的材料件数'],['left','最后剩余经费（元）']]:p.operator==='capacity'?[['capacity','每箱至少能装的数量']]:p.operator==='cover'?[['boxes','至少需要的箱数'],['empty','按这些箱的容量合计还空多少格']]:p.operator==='full'?[['boxes','可以装满的完整箱数'],['loose','剩下未装入完整箱的数量']]:[]}
function jointMaterialText(task){if(jointExtended(task))return jointExtendedText(task);if(jointNFamily(task)&&jointNText(task))return jointNText(task);if(jointLFamily(task)&&jointLText(task))return jointLText(task);if(jointRFamily(task)&&jointRText(task))return jointRText(task);if(jointRaffle(task))return raffleMaterial(task);const p=task.joint.params,label=jointRole(task);return p.operator==='bill'?`按${label}采购，每个${p.unitPrice}元，一次另付${p.fee}元固定费。一共要付多少元？`:p.operator==='remaining'?`用${p.budget}元经费按${label}采购，每个${p.unitPrice}元，另付一次${p.fee}元固定费。付完还剩多少元？`:p.operator==='offers'?`按${label}采购。报价A每个${p.plans[0].unitPrice}元，另收一次${p.plans[0].fee}元；报价B每个${p.plans[1].unitPrice}元，另收一次${p.plans[1].fee}元。选总额较低的报价并填金额，若相同可选任意一个。`:p.operator==='funds'?`把${label}作为经费，先付一次${p.fee}元固定费。每个完整包${p.unitPrice}元，内有${p.packQuantity}件，不能拆卖。最多能买多少件，还剩多少元？`:p.operator==='capacity'?`把${label}装入${p.containers}个同样容量的箱，全部装下即可，每箱至少要能装多少？`:p.operator==='cover'?`把${label}全部装箱，每箱最多${p.capacity}个。至少用几箱，按这些箱的容量合计还空多少格？`:p.operator==='full'?`按${label}装箱，每完整箱${p.capacity}个。只发装满的箱，最多发几箱，留下多少个未装入完整箱？`:''}
const JOINT_TASKS=Object.fromEntries(JOINT_CONTENT.families.flatMap(f=>f.instances.map(spec=>{
 const base=spec.baseKind==='demo'?DEMO_TASKS[f.primarySkillId]:STAGED_TASKS[f.primarySkillId]?.[spec.baseKind];if(!base)throw Error('Missing joint source '+spec.id);
 const {reason,worked,hint,demoSteps,demoNarration,...body}=base,task={...body,id:spec.id,contentVersion:spec.contentVersion??f.contentVersion??JOINT_CONTENT.contentVersion,phase:['G','C'].includes(spec.kind)?'练':spec.kind==='D'?'巩固':'测',joint:{familyId:f.id,relationIds:['REL-APPLICATION-'+f.id],kind:spec.kind,binding:f.binding,quantityLabel:f.quantityLabel,targetNodeIds:[f.primarySkillId],supportNodeIds:spec.supportNodeIds,params:spec,baseTaskId:base.id,baseContentVersion:base.contentVersion,nativeFingerprint:taskFingerprint(base)},authorship:f.authorship};
 if(jointExtended(task))task.joint.bridgeFingerprint=jointExtendedRuleFingerprint(f);
 task.nativePrompt=base.prompt;task.prompt=spec.context+'。'+base.prompt+' '+jointMaterialText(task);task.changeDimension=spec.changeDimensions.join('；');
 if(spec.kind==='G')task.hint=jointRFamily(task)?'核对原操作所求的量及它的单位，再对照这份订单或时间安排的条件。':jointRaffle(task)?'每张入袋的票同样可能抽到；核对哪些具体票进入袋子、哪些符合中奖条件，别把袋外对象算进整体。':'核对模型中的同一批对象或金额，再检查这道问题的整包、容量或固定费条件。';
 task.explain='操作保持原数学关系。把'+jointRole(task)+'用于同一材料的条件，再核对最终响应；只报一个碰巧相同的数不算完成。';if(jointExtended(task)){jointExtendedGuard(task);if(spec.kind==='C')task.explain+=' '+f.counterExplanation;}else if(jointNFamily(task))jointNGuard(task);else if(jointLFamily(task))jointLGuard(task);else if(jointRFamily(task))jointRGuard(task);else if(!jointRaffle(task))jointQuantity(task);
 return [spec.id,task];
})));
let jointTaskId='';
function jointState(){return draft.joint??(draft.joint={responses:{}})}
function jointNumber(raw){if(typeof raw!=='string'||!raw.trim()||raw.length>40)return null;const s=raw.trim();if(!/^-?\d+(?:\.\d+)?$/.test(s))return null;const v=Number(s);return Number.isFinite(v)&&Math.abs(v)<=1000000?v:null}
function jointReady(task){if(jointExtended(task))return jointExtendedReady(task);if(jointRaffle(task))return raffleResponseReady(task);const w=jointState();return jointFields(task).every(([k])=>k==='plan'?['A','B'].includes(w.responses[k]):jointNumber(w.responses[k])!==null)}
function jointAnswerModel(task){const q=jointQuantity(task),p=task.joint.params;switch(p.operator){
 case 'bill':return {cost:q*p.unitPrice+p.fee};case 'remaining':return {left:p.budget-q*p.unitPrice-p.fee};
 case 'offers':{const costs=p.plans.map(x=>q*x.unitPrice+x.fee),min=Math.min(...costs);return {plans:p.plans.filter((x,i)=>costs[i]===min).map(x=>x.id),cost:min}}
 case 'funds':{const count=Math.floor((q-p.fee)/p.unitPrice);return {count:count*p.packQuantity,left:q-p.fee-count*p.unitPrice}}
 case 'cover':{const boxes=Math.ceil(q/p.capacity);return {boxes,empty:boxes*p.capacity-q}}
 case 'full':{const boxes=Math.floor(q/p.capacity);return {boxes,loose:q-boxes*p.capacity}}
 case 'capacity':return {capacity:Math.ceil(q/p.containers)};default:throw Error('Unknown joint operator');
}}
function jointValidate(task,base){if(jointExtended(task))return jointExtendedValidate(task,base);if(jointNFamily(task)&&!jointRaffle(task))return jointNValidate(task,base);if(jointLFamily(task)&&JOINT_L_OPERATORS.has(task.joint.params.operator))return jointLValidate(task,base);if(jointRFamily(task)&&JOINT_R_OPERATORS.has(task.joint.params.operator))return jointRValidate(task,base);if(jointRaffle(task))return raffleGrade(task,base);const native=base.grade(task),expected=jointAnswerModel(task),responses=jointState().responses;const support=jointReady(task)&&jointFields(task).every(([k])=>k==='plan'?expected.plans.includes(responses[k]):jointNumber(responses[k])===expected[k]);return {ok:native.ok&&support,reason:!native.ok?native.reason:'对照共同材料的单价、固定费、整包或容量条件，再核对响应。',nativeAnchorPassed:!!native.ok,supportAnchorPassed:!!support,observedErrors:[...(!native.ok?['primary-operation-condition']:[]),...(!support?['shared-condition-response']:[])]}}
function jointBoard(task,base){if(jointExtended(task))return jointExtendedBoard(task,base);if(jointRaffle(task))return raffleBoard(task,base);const w=jointState();return `${base.board(task)}<section class="joint-material"><h3>这道问题的共同材料</h3><p>${esc(jointMaterialText(task))}</p><button class="secondary" data-action="jointMaterialSpeak">🔊 听这份材料</button><div class="joint-fields">${jointFields(task).map(([key,label])=>key==='plan'?`<section><p>${label}</p>${choiceButtons(task,[['A','报价A'],['B','报价B']],'jointPlan','joint-plan',w.responses.plan)}</section>`:`<label>${esc(label)}<input class="joint-input" inputmode="decimal" data-joint-field="${key}" aria-label="${esc(label)}" value="${esc(w.responses[key]||'')}" autocomplete="off"/></label>`).join('')}</div></section>`}
function jointAdapter(base){return {...base,board:t=>jointBoard(t,base),grade:t=>jointValidate(t,base),act:(action,data,t)=>{if(action==='jointExtendedReason'){if(!jointExtended(t)||t.joint.kind!=='C'||!['conditions','appearance','always'].includes(data.value))return false;jointState().responses.reason=data.value;return true}if(jointRaffle(t)&&action.startsWith('raffle'))return raffleAct(action,data,t,base);if(action==='jointPlan'){if(!(['offers','vector-offers','pack-offers','extended-offers'].includes(t.joint.params.operator)||JOINT_L_OFFERS.has(t.joint.params.operator)||JOINT_N_OFFERS.has(t.joint.params.operator))||!['A','B'].includes(data.value))return false;jointState().responses.plan=data.value;return true}return base.act(action,data,t)},speech:t=>base.speech(t)+'。共同材料：'+jointMaterialText(t)+'。我已填写：'+jointFields(t).map(([k,label])=>label+' '+(jointState().responses[k]??'未填')).join('；')}}
const JOINT_SIGNATURE_METADATA=new Set(['id','kind','baseKind','context','supportNodeIds','changeDimensions','contentVersion','priorContentVersions','priorContractMathSignature']);
function jointMathSignature(task){const p=task.joint.params,fields=Object.entries(p).filter(([k])=>!JOINT_SIGNATURE_METADATA.has(k));if(jointExtended(task))fields.push(['bridgeRule',task.joint.bridgeFingerprint]);return JSON.stringify([task.joint.nativeFingerprint,task.joint.binding,Object.fromEntries(fields.sort(([a],[b])=>a.localeCompare(b)))])}
function jointSignatureKey(raw){if(typeof raw!=='string'||raw.length>20000)return null;try{const parts=JSON.parse(raw);if(!Array.isArray(parts)||parts.length!==3||typeof parts[0]!=='string'||typeof parts[1]!=='string'||!parts[2]||typeof parts[2]!=='object'||Array.isArray(parts[2]))return null;return JSON.stringify([parts[0],parts[1],Object.fromEntries(Object.entries(parts[2]).filter(([key])=>!JOINT_SIGNATURE_METADATA.has(key)).sort(([a],[b])=>a.localeCompare(b)))])}catch{return null}}
function jointSignatureEquivalent(a,b){const first=jointSignatureKey(a);return first!==null&&first===jointSignatureKey(b)}
function jointPriorRoleContract(task,version){const p=task.joint.params;return Number.isInteger(version)&&Array.isArray(p.priorContentVersions)&&p.priorContentVersions.includes(version)&&jointSignatureEquivalent(p.priorContractMathSignature,jointMathSignature(task))}

function prepareJointOpen(task){const h=taskHistory(task),currentKey=taskVersion(task)+':'+task.id;h.jointSignature??=jointMathSignature(task);const prior=new Set(Object.entries(saved.taskHistory).filter(([key,other])=>key!==currentKey&&jointSignatureEquivalent(other.jointSignature,h.jointSignature)).map(([key])=>key));for(const a of [...saved.attempts,...Object.values(saved.jointProgress).flatMap(s=>s.records||[])])if(jointSignatureEquivalent(a.jointFacts?.signature,h.jointSignature)&&typeof a.taskInstanceId==='string'&&Number.isInteger(a.contentVersion)&&a.contentVersion+':'+a.taskInstanceId!==currentKey)prior.add(a.contentVersion+':'+a.taskInstanceId);for(const [key,pending] of Object.entries(saved.pendingFormal))if(key!==currentKey&&pending.taskId===task.id&&jointPriorRoleContract(task,pending.contentVersion))prior.add(key);if(prior.size){h.legacyExposure=true;h.priorJointExposure=[...new Set([...(h.priorJointExposure||[]),...prior])].slice(-20)}h.priorNativeExposure??=!!saved.taskHistory[task.joint.baseContentVersion+':'+task.joint.baseTaskId]||!!saved.pendingFormal[task.joint.baseContentVersion+':'+task.joint.baseTaskId];persist()}
function jointFacts(task,result){return {familyId:task.joint.familyId,relationIds:[...task.joint.relationIds],kind:task.joint.kind,signature:jointMathSignature(task),baseTaskId:task.joint.baseTaskId,baseContentVersion:task.joint.baseContentVersion,priorNativeExposure:taskHistory(task).priorNativeExposure===true,targetNodeIds:[...task.joint.targetNodeIds],supportNodeIds:[...task.joint.supportNodeIds],nativeAnchorPassed:result.nativeAnchorPassed,supportAnchorPassed:result.supportAnchorPassed,responses:{...jointState().responses},...(jointRaffle(task)?{raffleFacts:raffleFacts()}:{}),...(jointLFamily(task)&&JOINT_L_OPERATORS.has(task.joint.params.operator)?{logicObserved:jointLObserved(task,draft.work)}:{}),...(jointNFamily(task)&&!jointRaffle(task)?{numbersObserved:jointNObserved(task,draft.work)}:{}),...(jointExtended(task)?{extendedObserved:jointExtendedObserved(task)}:{}),observedErrors:result.observedErrors,roleClaim:'主要目标操作与共享条件共同验证；支持知识只记使用，不授单点独立成功'}}
function jointRecordMatches(a,fid){const t=JOINT_TASKS[a?.taskInstanceId],facts=a?.jointFacts;if(a?.pendingSave===true||!t||!facts||t.joint.familyId!==fid)return false;const contract=assessmentEvidenceContext(t,{view:'joint'}),same=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((v,i)=>v===b[i]);return a.evidenceVersion===2&&a.evidenceRuleVersion===ASSESSMENT_RULES.version&&a.evidenceScope===contract.evidenceScope&&a.assessmentType===contract.assessmentType&&a.formalEligible===contract.formalEligible&&facts.familyId===fid&&facts.kind===t.joint.kind&&same(facts.targetNodeIds,t.joint.targetNodeIds)&&same(a.skillIds,t.joint.targetNodeIds)&&same(facts.supportNodeIds,t.joint.supportNodeIds)&&same(facts.relationIds,t.joint.relationIds)&&Number.isFinite(a.submittedAt)&&a.submittedAt>0&&a.gradingResult==='correct'&&facts.nativeAnchorPassed===true&&facts.supportAnchorPassed===true&&a.contentVersion===taskVersion(t)&&jointSignatureEquivalent(facts.signature,jointMathSignature(t))}
function jointEvidence(fid){const f=JOINT_FAMILIES.get(fid);if(!f)return {guided:false,independent:[],qualifiedAt:0,delayed:false};const archived=saved.jointProgress[fid]?.records||[],records=[...archived,...saved.attempts].filter(a=>jointRecordMatches(a,fid));
 const guided=records.some(a=>a.jointFacts.kind==='G'),independent=[...new Map(records.filter(a=>['I1','I2'].includes(a.jointFacts.kind)&&assessmentIndependentRecord(a)).sort((a,b)=>a.submittedAt-b.submittedAt).map(a=>[a.taskInstanceId,a])).values()],qualifiedAt=independent.length>=2?independent[1].submittedAt:0,delayed=!!qualifiedAt&&records.some(a=>a.jointFacts.kind==='D'&&assessmentIndependentRecord(a)&&a.submittedAt>=qualifiedAt+REVIEW_DELAY_MS);return {guided,independent,qualifiedAt,delayed};
}
function rememberJointRecord(a){if(a.evidenceScope!=='knowledge-relation'||!a.jointFacts)return;const state=saved.jointProgress[a.jointFacts.familyId]??(saved.jointProgress[a.jointFacts.familyId]={records:[]});if(a.gradingResult==='correct'&&(['G','C'].includes(a.jointFacts.kind)||assessmentIndependentRecord(a))&&!state.records.some(x=>x.taskInstanceId===a.taskInstanceId&&x.contentVersion===a.contentVersion))state.records.push({...a,operationSummary:undefined,answer:undefined});}
function jointAccess(id){const t=JOINT_TASKS[id];if(!t)return {allowed:false,message:'这道共享问题尚未编写。'};const state=jointEvidence(t.joint.familyId);if(t.joint.kind!=='G'&&!state.guided)return {allowed:false,message:'先亲手完成本题族的教学问题，再挑战新情境。'};if(t.joint.kind==='D'&&(!state.qualifiedAt||Date.now()<state.qualifiedAt+REVIEW_DELAY_MS))return {allowed:false,message:'两道不同的新情境首答独立通过后，隔24小时再来回访。'};return {allowed:true,message:''}}
function jointLinks(sid){const f=[...JOINT_FAMILIES.values()].find(f=>f.primarySkillId===sid);if(!f)return '';const state=jointEvidence(f.id);return `<section class="panel joint-links"><h3>通：一起解决一个问题</h3><p>${esc(f.title)}</p><div class="stage-buttons">${f.instances.map(i=>`<button class="${i.kind==='G'?'primary':'secondary'}" data-action="joint" data-code="${i.id}">${{G:'教学问题',I1:'新情境一',I2:'新情境二',C:'反例练习',D:'隔日回访'}[i.kind]} →</button>`).join('')}</div><p class="tiny-note">${state.delayed?'两种新情境和一次隔日回访有联合应用证据':state.qualifiedAt?'两种新情境有独立联合应用证据':state.independent.length+'种新情境有独立联合应用证据'}。只适用于本题族的条件。</p></section>`}
function jointPage(){const task=JOINT_TASKS[jointTaskId],access=jointAccess(jointTaskId);if(!task)return '<section class="panel">请选择共享问题。</section>';const f=JOINT_FAMILIES.get(task.joint.familyId);if(!access.allowed)return `<div class="panel"><p>${access.message}</p><button class="primary" data-action="joint" data-code="${f.id}-G">打开教学问题</button><button class="secondary" data-action="network" data-code="${f.primarySkillId}">返回相关知识</button></div>`;return `<div class="page-head"><div><p class="kicker">一起解决一个问题 · ${{G:'教学',I1:'新情境一',I2:'新情境二',C:'反例练习',D:'隔日回访'}[task.joint.kind]}</p><h1>${esc(f.title)}</h1></div><button class="back" data-action="network" data-code="${f.primarySkillId}">← 相关知识</button></div><div class="work"><article class="panel">${taskHistory(task).legacyExposure?'<p class="tiny-note" role="status">这道完整问题已有查看记录。重复练习保留结果，但不会记为新的独立证据；未见的新实例仍需另行提供。</p>':''}<h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成，回到相关知识 →':'检查操作与共同目标 ✓'}</button></div>${taskBoard(task)}${actionRow(task)}</article><aside class="side-stack"><details class="panel"><summary>家长：本题记录范围</summary><p>主要目标：${esc(NODE_BY_ID.get(f.primarySkillId).concept)}。支持知识按实际响应记录使用，不自动授予单点独立成功。复用原操作模型，${taskHistory(task).priorNativeExposure?'这部分已有查看记录；':''}新的共同条件单独评价。读题与逐项语音不提示答案。</p><p>${esc(f.primaryEvidenceAnchor)}</p><p>${esc(f.supportEvidenceAnchor)}</p></details><section class="panel"><button class="secondary" data-action="learn" data-code="${f.primarySkillId}">回看概念</button>${task.joint.supportNodeIds.map(id=>`<button class="secondary" data-action="learn" data-code="${id}">回看${esc(NODE_BY_ID.get(id).concept)}</button>`).join('')}</section></aside></div>`}

'use strict';
// Deterministic, local competition problems. Selected topics are assumed
// available; this engine neither reads nor awards teaching/mastery gates.
const COMPETITION_VERSION=93;
const COMPETITION_TOPIC_IDS=['A01','A02','A03','A04','A05','R01','R02','R03','R04','L01','L02','L03','L04','N01','N02','N03','N04','G01','G02','G03','G04','G05','G06','G07','C01','C02','C03','C04','D01','D02','D03','S01','S02'];
function competitionGcd(a,b){while(b){[a,b]=[b,a%b]}return a}
function competitionFraction(a,b){const d=competitionGcd(Math.abs(a),Math.abs(b));return b/d===1?String(a/d):`${a/d}/${b/d}`}
// Display a rational exactly: terminating decimals stay decimals, others stay fractions.
function competitionRatioText(a,b=1){
 if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||b===0)throw Error('Invalid display ratio');
 const divisor=competitionGcd(Math.abs(a),Math.abs(b)),num=a/divisor*(b<0?-1:1),den=Math.abs(b/divisor);
 let rest=den;while(rest%2===0)rest/=2;while(rest%5===0)rest/=5;
 if(rest!==1)return competitionFraction(num,den);
 let n=BigInt(Math.abs(num)),d=BigInt(den),remainder=n%d,text=String(n/d);
 if(remainder){text+='.';while(remainder){remainder*=10n;text+=String(remainder/d);remainder%=d}}
 return (num<0?'-':'')+text;
}
function competitionDivisors(n){let count=0;for(let i=1;i*i<=n;i++)if(n%i===0)count+=i*i===n?1:2;return count}
function competitionSumDigits(n){return [...String(n)].reduce((s,v)=>s+Number(v),0)}
function competitionHash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16).toUpperCase().padStart(8,'0')}
function competitionRng(seed){let state=(seed>>>0)||1;return max=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)%max}}
function competitionShuffle(list,rng){const out=[...list];for(let i=out.length-1;i>0;i--){const j=rng(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
function competitionCanonicalIds(ids){const wanted=new Set(Array.isArray(ids)?ids:[]);return COMPETITION_TOPIC_IDS.filter(id=>wanted.has(id))}

// Each clue computes a quantity from the SAME unknown n. Its allowed values
// leave several possible cards; intersecting the clues gives the only answer.
// Topic tags come from the actual model, never from text matching.
function competitionModel(topicId,seed){
 const r=competitionRng(seed),k=2+r(4),b=2+r(5);
 switch(topicId){
 case 'A01':return {kind:'place',text:`一个数有 n 个十和 ${b} 个一。这个数`,value:n=>10*n+b,calculation:n=>`${n}×10+${b}=${10*n+b}`,diagram:{kind:'place',labels:['n 个十',`${b} 个一`]}};
 case 'A02':return {kind:'bill',text:`每袋 ${k} 枚徽章，买 n 袋后再送 ${b} 枚。徽章总数`,value:n=>k*n+b,calculation:n=>`${k}×${n}+${b}=${k*n+b}`,diagram:{kind:'bags',labels:[`${k} 枚/袋`,'n 袋',`另送 ${b} 枚`]}};
 case 'A03':return {kind:'fraction',text:`一条长 n 米的彩带，取出它的 1/${k}。取出的长度（米）`,value:n=>competitionFraction(n,k),calculation:n=>`${n}÷${k}=${competitionFraction(n,k)} 米`,diagram:{kind:'strip',parts:k,labels:['总长 n 米',`取 1/${k}`]}};
 case 'A04':return {kind:'discount',text:'原价 n 元的徽章打八折。现价（元）',value:n=>competitionFraction(4*n,5),calculation:n=>`${n}×80%=${competitionFraction(4*n,5)} 元`,diagram:{kind:'strip',parts:5,filled:4,labels:['原价 n 元','现价 80%']}};
 case 'A05':return {kind:'square',text:'边长 n 的正方形，面积',value:n=>n*n,calculation:n=>`${n}²=${n*n}`,diagram:{kind:'rectangle',labels:['n','n']}};
 case 'R01':return {kind:'ratio',text:`红卡与蓝卡数量比为 1:${k}，红卡有 n 张。卡片总数`,value:n=>(k+1)*n,calculation:n=>`${n}×(1+${k})=${(k+1)*n}`,diagram:{kind:'ratio',parts:k+1,labels:['红 n 张',`红:蓝=1:${k}`]}};
 case 'R02':return {kind:'unit',text:`n 分钟，每分钟前进 ${k} 米。前进的路程（米）`,value:n=>k*n,calculation:n=>`${k} 米/分×${n} 分=${k*n} 米`,diagram:{kind:'line',labels:['n 分钟',`${k} 米/分钟`]}};
 case 'R03':return {kind:'meeting',text:`两人相向而行，速度是 ${k} 和 ${b} 米/分，n 分钟相遇。原来的距离（米）`,value:n=>(k+b)*n,calculation:n=>`(${k}+${b})×${n}=${(k+b)*n} 米`,diagram:{kind:'meeting',labels:[`${k} 米/分`,'n 分钟',`${b} 米/分`]}};
 case 'R04':return {kind:'scale',text:`长 n、宽 2 的长方形，两边都放大 ${k} 倍。新面积`,value:n=>2*n*k*k,calculation:n=>`(${n}×${k})×(2×${k})=${2*n*k*k}`,diagram:{kind:'rectangle',labels:['n','2',`边长 ×${k}`]}};
 case 'L01':return {kind:'equality',text:`天平一边是 ${k} 个同重的袋子，每袋 n 克，另加 ${b} 克。另一边的重量（克）`,value:n=>k*n+b,calculation:n=>`${k}×${n}+${b}=${k*n+b} 克`,diagram:{kind:'balance',labels:[`${k} 袋 + ${b} 克`,'每袋 n 克','另一边 ?']}};
 case 'L02':return {kind:'system',text:`大袋比小袋多 ${b} 枚，小袋有 n 枚。2 个大袋和 1 个小袋共有`,value:n=>3*n+2*b,calculation:n=>`2×(${n}+${b})+${n}=${3*n+2*b}`,diagram:{kind:'bags',labels:['小袋 n',`大袋 n+${b}`,'2 大 + 1 小']}};
 case 'L03':return {kind:'sequence',text:`数列 ${b}、${b+k}、${b+2*k}……每次加 ${k}。第 n 项`,value:n=>b+(n-1)*k,calculation:n=>`${b}+(${n}−1)×${k}=${b+(n-1)*k}`,diagram:{kind:'sequence',labels:[String(b),String(b+k),String(b+2*k),'…','第 n 项']}};
 case 'L04':return {kind:'function',text:`表格遵循 y=${k}x+${b}，x=n 时。y 的值`,value:n=>k*n+b,calculation:n=>`${k}×${n}+${b}=${k*n+b}`,diagram:{kind:'table',rows:[['x','1','2','n'],['y',String(k+b),String(2*k+b),'?']]}};
 case 'N01':return {kind:'digits',text:'整数 100+n 的各位数字之和',value:n=>competitionSumDigits(100+n),calculation:n=>`${100+n} 的数字相加得 ${competitionSumDigits(100+n)}`,diagram:{kind:'digits',labels:['100 + n','各位数字相加']}};
 case 'N02':return {kind:'factors',text:'n² 的正因数个数（包括 1 和它本身）',value:n=>competitionDivisors(n*n),calculation:n=>`${n}²=${n*n}，共有 ${competitionDivisors(n*n)} 个正因数`,diagram:{kind:'factors',labels:['n²','找所有正因数']}};
 case 'N03':return {kind:'lcm',text:'n 和 n+1 的最小公倍数',value:n=>n*(n+1),calculation:n=>`${n} 与 ${n+1} 互质，最小公倍数=${n}×${n+1}=${n*(n+1)}`,diagram:{kind:'line',labels:['每 n 分钟','每 n+1 分钟','第一次同时']}};
 case 'N04':return {kind:'remainder',text:`23 格圆环编号 0–22，从第 ${b} 格起每次前进 ${k} 格，走 n 次。最后的格号`,value:n=>(k*n+b)%23,calculation:n=>`前进后总格号 ${k}×${n}+${b}=${k*n+b}，除以 23 的余数是 ${(k*n+b)%23}`,diagram:{kind:'cycle',labels:['23 格一轮',`从 ${b} 起，每次 +${k}`,'走 n 次']}};
 case 'G01':return {kind:'perimeter',text:`长 n、宽 ${b} 的长方形，周长`,value:n=>2*(n+b),calculation:n=>`2×(${n}+${b})=${2*(n+b)}`,diagram:{kind:'rectangle',labels:['n',String(b)]}};
 case 'G02':return {kind:'angle',text:'三角形两个角为 n° 和 2n°。第三个角（度）',value:n=>180-3*n,calculation:n=>`180−${n}−2×${n}=${180-3*n}°`,diagram:{kind:'triangle',labels:['n°','2n°','?°']}};
 case 'G03':return {kind:'cutArea',text:'长 n、宽 n+2 的纸，沿长边剪去宽 1 的一条。剩余面积',value:n=>n*(n+1),calculation:n=>`${n}×(${n}+2)−${n}×1=${n*(n+1)}`,diagram:{kind:'cut',labels:['n','n+2','剪去宽 1']}};
 case 'G04':return {kind:'circle',text:'半径 n 的圆，圆周长',value:n=>`${2*n}π`,calculation:n=>`2π×${n}=${2*n}π`,diagram:{kind:'circle',labels:['半径 n']}};
 case 'G05':return {kind:'similar',text:`相似三角形中，小边 ${b} 对应大边 ${2*b}；另一条小边是 n。对应大边`,value:n=>2*n,calculation:n=>`${2*b}÷${b}=2，${n}×2=${2*n}`,diagram:{kind:'similar',labels:[String(b),String(2*b),'n','?']}};
 case 'G06':return {kind:'right',text:'直角三角形两条直角边是 3n 和 4n。斜边',value:n=>5*n,calculation:n=>`√[(${3*n})²+(${4*n})²]=${5*n}`,diagram:{kind:'right',labels:['3n','4n','?']}};
 case 'G07':return {kind:'volume',text:`长 n、宽 ${k}、高 ${b} 的长方体，体积`,value:n=>n*k*b,calculation:n=>`${n}×${k}×${b}=${n*k*b}`,diagram:{kind:'cuboid',labels:['n',String(k),String(b)]}};
 case 'C01':return {kind:'union',text:'红组 n+2 人，蓝组 n+3 人，两组都参加的 n 人。至少参加一组的人数',value:n=>n+5,calculation:n=>`(${n}+2)+(${n}+3)−${n}=${n+5}`,diagram:{kind:'sets',labels:['红 n+2','蓝 n+3','重叠 n']}};
 case 'C02':return {kind:'product',text:`n 种饼干配 ${k} 种饮料，每种各选一种。搭配数`,value:n=>n*k,calculation:n=>`${n}×${k}=${n*k} 种`,diagram:{kind:'tree',labels:['n 种饼干',`${k} 种饮料`]}};
 case 'C03':return {kind:'pairs',text:'从 n 名队员中选两名，先后顺序不计。选法数',value:n=>n*(n-1)/2,calculation:n=>`${n}×(${n}−1)÷2=${n*(n-1)/2}`,diagram:{kind:'pairs',labels:['n 名队员','每组 2 人','不计顺序']}};
 case 'C04':return {kind:'complement',text:'共 2n+8 人，红组 n+2 人，蓝组 n+3 人，重叠 n 人。不参加任何组的人数',value:n=>n+3,calculation:n=>`(2×${n}+8)−[(${n}+2)+(${n}+3)−${n}]=${n+3}`,diagram:{kind:'sets',labels:['全体 2n+8','红 n+2 / 蓝 n+3','重叠 n']}};
 case 'D01':return {kind:'chart',text:`柱形图从 0 开始，每格 ${k} 张，柱顶在第 n 格。张数`,value:n=>n*k,calculation:n=>`${n} 格×${k} 张/格=${n*k} 张`,diagram:{kind:'chart',step:k,labels:['n 格',`每格 ${k} 张`]}};
 case 'D02':return {kind:'mean',text:`三次得分为 n、${b}、${b+4}。平均分`,value:n=>competitionFraction(n+2*b+4,3),calculation:n=>`(${n}+${b}+${b+4})÷3=${competitionFraction(n+2*b+4,3)}`,diagram:{kind:'table',rows:[['第一','第二','第三'],['n',String(b),String(b+4)]]}};
 case 'D03':return {kind:'probability',text:`袋中 n 个红球、${b} 个蓝球，每球等可能取到。取到红球的概率`,value:n=>competitionFraction(n,n+b),calculation:n=>`${n}÷(${n}+${b})=${competitionFraction(n,n+b)}`,diagram:{kind:'balls',labels:['红球 n',`蓝球 ${b}`,'等可能取 1 个']}};
 case 'S01':return {kind:'mirror',text:'一张左右对称的图，左半边 n 个星，轴上没有星。全图星数',value:n=>2*n,calculation:n=>`对称的一对一配对：${n}+${n}=${2*n}`,diagram:{kind:'mirror',labels:['左侧 n 个','轴上 0 个','右侧 ?']}};
 case 'S02':return {kind:'invariant',text:'n 枚硬币均为反面；每步把恰好 2 枚反面改成正面，不再改回。全部变正面所需步数',value:n=>n/2,calculation:n=>`每步反面减少 2 枚，${n}÷2=${n/2} 步`,diagram:{kind:'coins',labels:['反面 n 枚','每步改 2 枚','不改回']}};
 default:throw Error('Unknown competition topic');
 }
}

function competitionConstraintProblem(ids,seed){
 const r=competitionRng(seed),models=ids.map((id,i)=>competitionModel(id,seed+97*(i+1)));
 // Distinct images prevent accidental clue redundancy. The small domain is
 // explicit in the five answer cards, not an unstated range assumption.
 const universe=competitionShuffle([2,4,6,8,10,12,14,16,18,20],r),domain=[];
 const find=start=>{if(domain.length===5)return true;for(let i=start;i<universe.length;i++){const n=universe[i];if(models.every(m=>!domain.some(v=>String(m.value(v))===String(m.value(n))))){domain.push(n);if(find(i+1))return true;domain.pop()}}return false};
 if(!find(0))throw Error('No valid constraint domain');
 const options=domain.slice(0,5),target=options[r(5)],others=competitionShuffle(options.filter(n=>n!==target),r);
 const accepted=ids.length===1?[[target]]:ids.length===2?[[target,...others.slice(0,2)],[target,...others.slice(2)]]:[[target,...others.slice(0,3)],[target,others[0],others[1],others[3]],[target,others[2],others[3]]];
 const clues=models.map((m,i)=>{const allowed=competitionShuffle(accepted[i].map(n=>String(m.value(n))),r);return {topicId:ids[i],modelSeed:seed+97*(i+1),kind:m.kind,allowed,text:m.text+'是 '+allowed.join('、')+' 中的一个。',diagram:m.diagram}});
 const survivors=(omit=-1)=>options.filter(n=>clues.every((clue,i)=>i===omit||clue.allowed.includes(String(models[i].value(n)))));
 if(survivors().length!==1||ids.length>1&&clues.some((_,i)=>survivors(i).length<2))throw Error('Nonessential combination');
 const order=competitionShuffle(ids.map((_,i)=>i),r),steps=[],remaining=[...options];
 for(const i of order){for(let j=remaining.length-1;j>=0;j--)if(!clues[i].allowed.includes(String(models[i].value(remaining[j]))))remaining.splice(j,1);steps.push(`用条件 ${i+1}，留下 ${remaining.join('、')}。`)}
 steps.push('所有条件要一起成立，不能只凭一条条件选答案。');
 const verify=models.map((m,i)=>`条件 ${i+1}：${m.calculation(target)}，在允许的值中。`);
 const omitted=r(ids.length),left=survivors(omitted);
 return {family:'constraints',prompt:'只有一张号码卡同时满足所有条件。它的号码是多少？',options:options.map(String),answer:String(target),clues,
  hints:['先挑一条容易算的条件，划掉不符合的号码卡。','再核对剩下的卡；满足一条条件还不够。'],
  methods:[{name:'逐条排除',steps},{name:'代入验证',steps:[`逐张代入。${target} 满足：`,...verify,'每张其他卡至少违反一条条件。']}],
  extension:{prompt:`如果取消条件 ${omitted+1}，还有几张可能的号码卡？`,answer:String(left.length),solution:`剩下 ${left.join('、')}，共 ${left.length} 张。`},
  verification:options.map(n=>({number:n,checks:clues.map((clue,i)=>({value:String(models[i].value(n)),ok:clue.allowed.includes(String(models[i].value(n)))}))})),
  math:{options:[...options].sort((a,b)=>a-b),target,clues:clues.map((c,i)=>({topicId:c.topicId,model:{kind:models[i].kind,text:models[i].text,diagram:models[i].diagram},allowed:[...c.allowed].sort()}))},ablation:ids.map((_,i)=>survivors(i))};
}

const COMPETITION_INTEGRATED_KEYS={
 'A03,G01':'garden','D03,G01':'areaChance','A03,D03,G01':'gardenChance',
 'D02,R01':'weighted','A03,D02,R01':'fractionWeighted','A03,D02':'fractionMean',
 'L01,R03':'catch','G01,N03':'tiles','C03,D03':'pairChance',
 'C01,D03':'unionChance','C04,D03':'complementChance','A04,R02':'offers',
 'G01,R04':'scaleArea','G01,G05':'similarArea','G06,L04':'coordinateDistance',
 'G02,R01':'angleRatio','N03,R03':'departures','C02,N01':'digitCount','C03,N01':'distinctDigitCount'
};
function competitionNumericOptions(answer,r){
 const a=String(answer),set=new Set([a]);
 if(a.includes('/')){const [n,d]=a.split('/').map(Number);for(const [x,y] of [[n+1,d],[n,d+1],[n+2,d+2],[Math.max(0,n-1),d],[n+1,d+2],[0,1],[1,1]])set.add(competitionFraction(x,y))}
 else {const n=Number(a);for(const delta of competitionShuffle([-2,-1,1,2,3,5,7],r))if(n+delta>=0)set.add(String(n+delta))}
 return competitionShuffle([...set].slice(0,5),r);
}
function competitionIntegratedProblem(ids,seed){
 const family=COMPETITION_INTEGRATED_KEYS[[...ids].sort().join(',')];if(!family)return null;
 const r=competitionRng(seed),k=2+r(3),b=2+r(3);let prompt,answer,diagram,methods,extension,math,hints;
 const method=(name,...steps)=>({name,steps});
 if(['garden','areaChance','gardenChance'].includes(family)){
  const width=2*(3+r(4)),height=4+r(4),cutHeight=1+r(height-1),area=width*height;
  if(family==='garden'){
   answer=String(area/2);prompt=`长 ${width} 米、宽 ${height} 米的花园，有 1/2 种花。没有种花的面积是多少平方米？`;
   methods=[method('先算整体',`${width}×${height}=${area} 平方米。`,`没有种花的也是 1/2：${area}÷2=${answer}。`),method('先切图形',`沿长边分成两半，每半长 ${width/2} 米。`,`${width/2}×${height}=${answer} 平方米。`)];
   extension={prompt:'如果改成 1/4 种花，没有种花的面积是多少平方米？',answer:competitionFraction(3*area,4),solution:`剩下 3/4：${area}×3÷4=${competitionFraction(3*area,4)}。`};
  }else{
   const cutWidth=family==='gardenChance'?width/2:1+r(width-1),patch=cutWidth*cutHeight;
   answer=competitionFraction(patch,area);prompt=family==='gardenChance'?`花园长 ${width} 米、宽 ${height} 米。左侧 1/2 的部分中，底部 ${cutHeight} 米种花。在整座花园等可能随机选一点，落在花区的概率是多少？`:`花园长 ${width} 米、宽 ${height} 米，角落有长 ${cutWidth} 米、宽 ${cutHeight} 米的花区。在整座花园等可能随机选一点，落在花区的概率是多少？`;
   methods=[method('用面积比较',`花区 ${cutWidth}×${cutHeight}=${patch}。整园 ${width}×${height}=${area}。`,`概率=${patch}/${area}=${answer}。`),method('按单位小格数',`把花园分成 ${area} 个面积为 1 的小格。`,`有 ${patch} 格属于花区，等可能取点的概率是 ${answer}。`)];
   extension={prompt:'落在花区外的概率是多少？',answer:competitionFraction(area-patch,area),solution:`用补集：1−${answer}=${competitionFraction(area-patch,area)}。`};
   diagram={kind:'garden',width,height,cutWidth,cutHeight};math={width,height,cutWidth,cutHeight};
  }
  diagram??={kind:'garden',width,height,cutWidth:width/2,cutHeight:height};math??={width,height,shade:'1/2'};
 }else if(['weighted','fractionWeighted','fractionMean'].includes(family)){
  const red=k,blue=b,den=family==='weighted'?1:2,redScore=den===1?2+r(3):3+2*r(2),blueScore=redScore+2*(1+r(2)),total=family==='fractionMean'?3:red+blue;
  const numerator=family==='fractionMean'?redScore+blueScore+blueScore:red*redScore+blue*blueScore;
  answer=competitionFraction(numerator,den*total);
  prompt=family==='fractionMean'?`三次得分为 ${competitionFraction(redScore,den)}、${competitionFraction(blueScore,den)}、${competitionFraction(blueScore,den)}。平均分是多少？`:`红队与蓝队人数比为 ${red}:${blue}。红队每人得 ${competitionFraction(redScore,den)} 分，蓝队每人得 ${competitionFraction(blueScore,den)} 分。所有队员的平均分是多少？`;
  const highCount=family==='fractionMean'?2:blue;
  methods=[method('合计后平均',family==='fractionMean'?'把三次得分合起来。':`按红队 ${red} 人、蓝队 ${blue} 人的一组计算。`,`总分=${competitionFraction(numerator,den)}，平均=${competitionFraction(numerator,den)}÷${total}=${answer}。`),method('从低分补上差额',`先把所有得分看作 ${competitionFraction(redScore,den)}。`,`补上 ${highCount}/${total}×${competitionFraction(blueScore-redScore,den)}，平均为 ${answer}。${family==='fractionMean'?'':'人数不同不能直接平均两种分数。'}`)];
  extension={prompt:'每个人（或每次）的得分都增加 1 分，平均分是多少？',answer:competitionFraction(numerator+den*total,den*total),solution:'总分增加的人均量为 1，所以平均分也增加 1。'};diagram={kind:'table',rows:family==='fractionMean'?[['次数','1','2','3'],['得分',competitionFraction(redScore,den),competitionFraction(blueScore,den),competitionFraction(blueScore,den)]]:[['队伍','人数比','每人得分'],['红',String(red),competitionFraction(redScore,den)],['蓝',String(blue),competitionFraction(blueScore,den)]]};math={red,blue,redScore,blueScore,den,total};
 }else if(family==='catch'){
  const slow=k,fast=k+1,delay=b;answer=String(slow*delay);
  prompt=`小乐每分钟走 ${slow} 米，先走了 ${delay} 分钟；小明从同一点每分钟走 ${fast} 米追赶。小明出发后几分钟追上？`;
  methods=[method('看每分钟缩小多少',`领先 ${slow}×${delay}=${slow*delay} 米。`,`每分钟缩小 ${fast}−${slow}=1 米，需 ${answer} 分钟。`),method('列等量关系',`设追了 t 分钟：${fast}t=${slow}(t+${delay})。`,`两边同时减 ${slow}t，得 t=${answer}。`)];
  extension={prompt:`小乐改成先走 ${delay+1} 分钟，小明出发后几分钟追上？`,answer:String(slow*(delay+1)),solution:`领先变成 ${slow*(delay+1)} 米，差速仍为 1 米/分。`};diagram={kind:'meeting',labels:[`小乐 ${slow} 米/分`,`先走 ${delay} 分`,`小明 ${fast} 米/分`]};math={slow,fast,delay};
 }else if(family==='tiles'){
  const unit=k,w=unit*(2+r(3)),h=unit*(3+r(3)),side=competitionGcd(w,h);answer=String(w*h/(side*side));prompt=`用同样大的正方形砖铺满长 ${w} 米、宽 ${h} 米的地面，不切砖。砖的边长取最大的整数米，需要多少块？`;
  methods=[method('先找最大边长',`边长要同时整除 ${w} 和 ${h}，最大是 ${side}。`,`横向 ${w/side} 块、纵向 ${h/side} 块，共 ${answer} 块。`),method('用面积核对',`地面面积 ${w*h}，每砖面积 ${side*side}。`,`${w*h}÷${side*side}=${answer}；更大边长不能同时整除两边。`)];
  extension={prompt:'地面的长和宽都变成原来的 2 倍，仍用原来的砖，需要多少块？',answer:String(Number(answer)*4),solution:'两个方向的砖数都乘 2，总块数乘 4。'};diagram={kind:'garden',width:w,height:h};math={w,h,side};
 }else if(family==='pairChance'){
  const red=k+1,blue=b,total=red+blue,pairs=total*(total-1)/2,good=red*(red-1)/2;answer=competitionFraction(good,pairs);prompt=`袋中有 ${red} 个红球、${blue} 个蓝球，不放回地随机取出两个球。每一对球等可能，两个都是红球的概率是多少？`;
  methods=[method('数不计顺序的球对',`全部有 ${total}×${total-1}÷2=${pairs} 对。`,`红红有 ${red}×${red-1}÷2=${good} 对，概率=${answer}。`),method('按先后顺序',`第一次红球概率 ${red}/${total}。`,`取走红球后剩 ${red-1} 红、${total-1} 总：相乘得 ${answer}。`)];
  extension={prompt:'两个球不全是红球的概率是多少？',answer:competitionFraction(pairs-good,pairs),solution:`用补集：1−${answer}=${competitionFraction(pairs-good,pairs)}。`};diagram={kind:'balls',red,blue,labels:[`红 ${red} / 蓝 ${blue}`,'不放回取 2 个']};math={red,blue};
 }else if(['unionChance','complementChance'].includes(family)){
  const red=k+3,blue=b+3,both=1+r(Math.min(red,blue)-1),union=red+blue-both,total=union+2+r(4),want=family==='unionChance'?union:total-union;answer=competitionFraction(want,total);prompt=`共有 ${total} 位小朋友，${red} 人参加红组，${blue} 人参加蓝组，其中 ${both} 人两组都参加。等可能随机选一人，${family==='unionChance'?'至少参加一组':'两个组都没参加'}的概率是多少？`;
  methods=[method('先去掉重复',`至少一组：${red}+${blue}−${both}=${union} 人。`,`${family==='unionChance'?union:total+'−'+union+'='+want} 人符合，概率=${answer}。`),method('按互不重叠的区域数',`只红 ${red-both}、只蓝 ${blue-both}、重叠 ${both}、组外 ${total-union}。`,`符合的人数 ${want}，总数 ${total}，概率=${answer}。`)];
  extension={prompt:`${family==='unionChance'?'两个组都没参加':'至少参加一组'}的概率是多少？`,answer:competitionFraction(total-want,total),solution:'与刚才的事件互为补集，概率之和为 1。'};diagram={kind:'sets',labels:[`红 ${red}`,`蓝 ${blue}`,`重叠 ${both} / 全体 ${total}`]};math={red,blue,both,total,want};
 }else if(family==='offers'){
  const count=4*(1+r(3)),price=4*(2+r(3)),fee=2+r(5),first=count*price*3/4+fee,second=count*(price-1),gap=Math.abs(first-second);answer=String(gap);prompt=`买 ${count} 本本子。甲店每本 ${price} 元，全单打七五折，另收 ${fee} 元配送费；乙店每本 ${price-1} 元，免配送费。两店总价相差多少元？`;
  methods=[method('分别算整单',`甲：${count}×${price}×75%+${fee}=${first}。乙：${count}×${price-1}=${second}。`,`差额 ${gap} 元。${gap===0?'两店同价。':(first<second?'甲':'乙')+'便宜。'}`),method('先比折后单价',`甲折后每本 ${price*3/4} 元，先比较 ${count} 本的差额。`,`再把只属于甲的 ${fee} 元费用加回，差额是 ${gap} 元。配送费不能一起打折。`)];
  extension={prompt:'甲店配送费改成 0 元，甲店整单总价是多少元？',answer:String(count*price*3/4),solution:`只去掉配送费：${first}−${fee}=${count*price*3/4}。`};diagram={kind:'table',rows:[['店','单价','规则'],['甲',String(price),'75% + 配送'+fee],['乙',String(price-1),'免配送']]};math={count,price,fee};
 }else if(['scaleArea','similarArea'].includes(family)){
  const w=k+2,h=b+2,factor=2+r(2),old=w*h,next=old*factor*factor;answer=String(next-old);prompt=`长 ${w}、宽 ${h} 的长方形，两条边都放大 ${factor} 倍。面积比原来增加多少？`;
  methods=[method('先算两张图',`原面积 ${w}×${h}=${old}，新面积 ${w*factor}×${h*factor}=${next}。`,`${next}−${old}=${answer}。`),method('先看面积倍数',`边长乘 ${factor}，面积乘 ${factor}²=${factor*factor}。`,`增加了原来的 ${factor*factor-1} 倍：${old}×${factor*factor-1}=${answer}。`)];
  extension={prompt:`如果只有长放大 ${factor} 倍、宽不变，面积是多少？`,answer:String(old*factor),solution:`只有一个方向变，面积只乘 ${factor}。`};diagram={kind:'rectangle',labels:[String(w),String(h),`两边 ×${factor}`]};math={w,h,factor};
 }else if(family==='coordinateDistance'){
  const scale=1+r(3),x=1+r(3),y=1+r(3),dx=3*scale,dy=4*scale;answer=String(5*scale);prompt=`坐标图上 A=(${x},${y})，B=(${x+dx},${y+dy})。从 A 到 B 的直线距离是多少？`;
  methods=[method('补成直角三角形',`横向差 ${dx}，纵向差 ${dy}。`,`距离²=${dx}²+${dy}²=${25*scale*scale}，距离=${answer}。`),method('识别缩放的 3-4-5',`两直角边为 3×${scale}、4×${scale}。`,`斜边也乘 ${scale}，为 5×${scale}=${answer}。沿网格绕行的长度不是直线距离。`)];
  extension={prompt:'若只沿水平和竖直线，从 A 到 B 最短需要走多少单位？',answer:String(dx+dy),solution:`沿网格至少走横向 ${dx} 加纵向 ${dy}，合计 ${dx+dy}。`};diagram={kind:'coordinate',x,y,dx,dy};math={x,y,dx,dy};
 }else if(family==='angleRatio'){
  const ratios=r(2)?[1,2,3]:[2,3,4],sum=ratios.reduce((a,v)=>a+v,0);answer=String(180*ratios[2]/sum);prompt=`三角形的三个内角之比为 ${ratios.join(':')}。最大的角是多少度？`;
  methods=[method('先求一份',`共 ${sum} 份，1 份是 180÷${sum}=${180/sum}°。`,`最大角 ${ratios[2]} 份，为 ${answer}°。`),method('直接看占比',`最大角占全部角的 ${ratios[2]}/${sum}。`,`180×${ratios[2]}/${sum}=${answer}°，三个角加起来必须是 180°。`)];
  extension={prompt:'最大的角比最小的角多多少度？',answer:String(180*(ratios[2]-ratios[0])/sum),solution:`份数相差 ${ratios[2]-ratios[0]}，乘每份 ${180/sum}°。`};diagram={kind:'triangle',labels:ratios.map(v=>v+' 份')};math={ratios};
 }else if(family==='departures'){
  const a=k+1,c=b+2,time=a*c/competitionGcd(a,c),speed=2+r(3);answer=String(time*speed);prompt=`两辆观光车同时出发，之后分别每 ${a} 分钟、${c} 分钟发车一次。一名游客从开始每分钟走 ${speed} 米。下一次两车同时发车时，游客已走多少米？`;
  methods=[method('先找共同时间',`${a} 与 ${c} 的最小公倍数是 ${time} 分钟。`,`${time}×${speed}=${answer} 米。`),method('按发车时刻列举',`两组发车时刻中，0 之后第一次相同是 ${time}。`,`同一个 ${time} 分钟用于路程计算，得到 ${answer} 米。`)];
  extension={prompt:'再下一次两车同时发车时，游客从开始共走多少米？',answer:String(2*time*speed),solution:`共同发车周期是 ${time} 分钟，第二次是 ${2*time} 分钟。`};diagram={kind:'line',labels:[`每 ${a} 分钟`,`每 ${c} 分钟`,`${speed} 米/分`]};math={a,c,speed};
 }else if(['digitCount','distinctDigitCount'].includes(family)){
  const digits=competitionShuffle([1,2,3,4,5,6,7,8,9],r).slice(0,4).sort(),distinct=family==='distinctDigitCount',numbers=[];
  for(const a of digits)for(const c of digits)if((!distinct||a!==c)&&(a+c)%3===0)numbers.push(10*a+c);
  answer=String(numbers.length);prompt=`从数字 ${digits.join('、')} 中各选一个作十位和个位，${distinct?'不能重复用同一个数字':'允许重复'}。能组成多少个被 3 整除的两位数？`;
  methods=[method('按十位有序列举',`符合的数：${numbers.length?numbers.join('、'):'没有'}。`,`没有重复或遗漏，共 ${answer} 个。`),method('先按余数分类',`各位数之和被 3 整除，才能被 3 整除。`,`只配 0+0、1+2、2+1 的余数组${distinct?'，去掉同数字重复':''}，共有 ${answer} 个。`)];
  const alt=[];for(const a of digits)for(const c of digits)if((distinct||a!==c)&&(a+c)%3===0)alt.push(10*a+c);
  extension={prompt:`如果改成${distinct?'允许重复':'不能重复'}，有多少个符合的两位数？`,answer:String(alt.length),solution:`重新检查同一个数字能否用两次，符合的是 ${alt.join('、')||'没有'}。`};diagram={kind:'digits',labels:[digits.join('、'),'十位 □ / 个位 □','被 3 整除']};math={digits,distinct};
 }else throw Error('Missing integrated family');
 hints??=['先找连接两个主题的共同量，再求题目最后问的量。','可以画图、列举或倒推；核对单位和每一条限制。'];
 return {family,prompt,answer,options:competitionNumericOptions(answer,r),diagram,methods,extension,hints,math};
}
// RC59 decoder remains only to read old answers. The active picker never
// requests a constraint-card recipe. A release change must not erase history.
function competitionLegacyCreate(recipe){
 const ids=competitionCanonicalIds(recipe?.topicIds),seed=recipe?.seed,format=recipe?.format??'auto';
 if(!ids.length||ids.length>3||!Number.isInteger(seed)||seed<1||seed>2147483647||!['auto','constraints'].includes(format))throw Error('Invalid competition recipe');
 const core=(format==='auto'?competitionIntegratedProblem(ids,seed):null)||competitionConstraintProblem(ids,seed);
 if(core.options.length!==5||new Set(core.options).size!==5||!core.options.includes(core.answer))throw Error('Invalid competition choices');
 const signature=JSON.stringify({engine:1,topicIds:ids,family:core.family,math:core.math}),id='COMP-'+competitionHash(signature);
 return {id,contentVersion:91,skillId:ids[0]+'.01',phase:'挑战',mode:'competition',prompt:core.prompt,options:core.options,optionIds:core.options.map(v=>id+':'+v),answer:core.options.indexOf(core.answer),competition:{...core,signature,topicIds:ids,recipe:{topicIds:ids,seed,format}}};
}
function competitionCreate(recipe){
 if(recipe?.engine===4)return typeof module!=='undefined'?require('./validation_runtime').create(recipe):ValidationRuntime.create(recipe);
 if(recipe?.engine===3)return typeof module!=='undefined'?require('./competition_reviewed').competitionCreate(recipe):competitionReviewedCreate(recipe);
 if(recipe?.engine===2)return typeof module!=='undefined'?require('./competition_catalog').competitionCreate(recipe):competitionCatalogCreate(recipe);
 if(recipe?.engine!==undefined)throw Error('Unknown competition engine');
 return competitionLegacyCreate(recipe);
}
function competitionValueEqual(input,expected){
 const parse=value=>{const s=String(value).trim();if(/^[-+]?\d+(?:\.\d+)?$/.test(s))return Number(s);if(/^[-+]?\d+\s*\/\s*\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return b?a/b:NaN}return NaN};
 const a=parse(input),b=parse(expected);return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-10;
}
if(typeof module!=='undefined')module.exports={COMPETITION_VERSION,COMPETITION_TOPIC_IDS,COMPETITION_INTEGRATED_KEYS,competitionModel,competitionCreate,competitionLegacyCreate,competitionConstraintProblem,competitionIntegratedProblem,competitionValueEqual,competitionGcd,competitionDivisors,competitionFraction,competitionRatioText,competitionRng,competitionShuffle,competitionCanonicalIds,competitionNumericOptions,competitionHash};

'use strict';
// Curated problem structures come first; selected themes only bound the pool.
// One setting, one question, no quota of tags and no synthetic clue fallback.
const {COMPETITION_CATALOG,COMPETITION_REUSED,competitionEligible,competitionCatalogCreate}=((deps)=>{
const {competitionRng,competitionCanonicalIds,competitionNumericOptions,competitionHash,competitionFraction,competitionIntegratedProblem}=deps;
// Engine-2 math contracts keep their revision across page-only releases.
const COMPETITION_CATALOG_REVISION=92;
const COMPETITION_CATALOG=[];
function competitionRegister(id,topicIds,title,strategy,build){COMPETITION_CATALOG.push({id,topicIds:competitionCanonicalIds(topicIds),title,strategy,build})}
function competitionMethod(name,...steps){return {name,steps}}
function competitionFamily(id,topicIds,title,strategy,build){competitionRegister(id,topicIds,title,strategy,(seed)=>{const r=competitionRng(seed),p=build(r);return {...p,family:id,title,strategy,options:competitionNumericOptions(p.answer,r),hints:p.hints||[p.methods[0].name+'：先找最能简化问题的关系。']}})}
function competitionFactorial(n){let v=1;for(let i=2;i<=n;i++)v*=i;return v}
function competitionChoose(n,k){let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v}
function competitionRouteCount(w,h,blocked=null){const a=Array.from({length:h+1},()=>Array(w+1).fill(0));for(let y=0;y<=h;y++)for(let x=0;x<=w;x++)a[y][x]=blocked&&x===blocked[0]&&y===blocked[1]?0:x===0&&y===0?1:(x?a[y][x-1]:0)+(y?a[y-1][x]:0);return a[h][w]}

competitionFamily('reverseDigits',['A01'],'倒过来的两位数','位值与逆推',r=>{
 const a=3+r(6),b=1+r(a-1),sum=a+b,diff=9*(a-b),answer=String(10*a+b);
 return {prompt:`一个两位数的十位数字比个位数字大，两个数字的和是 ${sum}。把两个数字交换后，数比原来小 ${diff}。原来的数是多少？`,answer,math:{a,b},diagram:{kind:'digits',labels:['原数：十位 □ / 个位 □','交换：十位 □ / 个位 □',`相差 ${diff}`]},methods:[competitionMethod('把位值差拆开',`交换让十位减少 10×(十位−个位)，个位增加同样的数字差。`,`所以数字差为 ${diff}÷9=${a-b}；与和 ${sum} 配合，得到十位 ${a}、个位 ${b}，原数 ${answer}。`),competitionMethod('列出数字对',`先列出和为 ${sum}、十位大于个位的数字对。`,`逐一交换核对差 ${diff}，只有 ${a} 与 ${b} 符合。`)],extension:{prompt:'交换后的数是多少？',answer:String(10*b+a),solution:`把个位放到十位：10×${b}+${a}=${10*b+a}。`}};
});
competitionFamily('groupProducts',['A02'],'不用逐项乘','提取共同部分',r=>{
 const price=13+r(37),a=2+r(7),b=10-a,c=1+r(4),answer=String(price*10-c);
 return {prompt:`同一种贴纸每包 ${price} 枚。小乐先买 ${a} 包，再买 ${b} 包，然后送出 ${c} 枚。他还剩多少枚？`,answer,math:{price,a,b,c},diagram:{kind:'table',rows:[['每包',String(price)+' 枚'],['两次购买',a+' 包 + '+b+' 包'],['送出',c+' 枚']]},methods:[competitionMethod('先合并包数',`${a}+${b}=10 包，先算 10×${price}。`,`再减送出的 ${c}，剩 ${answer} 枚。`),competitionMethod('分别算再合并',`${a}×${price}=${a*price}，${b}×${price}=${b*price}。`,`两次合计后减 ${c}，也得到 ${answer}。共同单价使合并计算更快。`)],extension:{prompt:'如果第二次多买 1 包，最后剩多少枚？',answer:String(Number(answer)+price),solution:`增加一包只需在原答案上加 ${price}。`}};
});
competitionFamily('fractionBackwards',['A03'],'最后剩下的一份','逆推与份数',r=>{
 const left=2+2*r(15),answer=String(3*left);
 return {prompt:`小乐第一天用掉贴纸的 1/2，第二天用掉剩下贴纸的 1/3，最后还剩 ${left} 枚。最初有多少枚？`,answer,math:{left},diagram:{kind:'strip',parts:6,filled:2,labels:['最初分成 6 份','第二天的 1/3 是剩下部分的 1/3']},methods:[competitionMethod('从最后倒着走',`第二天结束剩下第二天开始的 2/3，所以第二天开始有 ${left}÷2×3=${left*3/2} 枚。`,`这又是最初的一半，最初有 ${left*3} 枚。`),competitionMethod('统一看最初的份数',`最初分 6 份：第一天用 3 份，第二天用余下 3 份的 1 份。`,`最后 2 份是 ${left} 枚，6 份就是 ${answer} 枚。两次的分数对应的整体不同。`)],extension:{prompt:'第二天用掉了多少枚？',answer:competitionFraction(left,2),solution:`最后剩 2 份，第二天用 1 份，所以是 ${left}÷2。`}};
});
competitionFamily('percentRoundTrip',['A04'],'涨回去了吗？','基准量变化',r=>{
 const percent=[10,20,25,50][r(4)],start=100*(1+r(12)),answer=String(start*percent*percent/10000);
 return {prompt:`一件商品原价 ${start} 元，先涨价 ${percent}%，再按涨后的价格降价 ${percent}%。最后比原价便宜多少元？`,answer,math:{percent,start},diagram:{kind:'table',rows:[['原价',start+' 元'],['先涨',percent+'%'],['再降',percent+'%（按涨后价）']]},methods:[competitionMethod('逐次换基准',`涨后 ${start}×${1+percent/100}=${start*(1+percent/100)} 元。`,`再乘 ${1-percent/100}，最后比原价少 ${answer} 元。`),competitionMethod('比较两次变化量',`第一次涨 ${start*percent/100} 元。第二次还会对这段涨价降 ${percent}%。`,`这额外降下的 ${start*percent/100}×${percent}/100=${answer} 元就是净损失。`)],extension:{prompt:'最后的价格是多少元？',answer:String(start-Number(answer)),solution:`原价减净损失：${start}−${answer}=${start-Number(answer)}。`}};
});
competitionFamily('squareBorder',['A05'],'只数新边框','平方差与分割',r=>{
 const n=3+r(20),answer=String(4*n+4);
 return {prompt:`小方块排成每行 ${n} 块、共 ${n} 行的正方阵。在外面加一圈宽 1 块的边框，形成更大的正方阵。需要增加多少块？`,answer,math:{n},diagram:{kind:'squareBorder',n},methods:[competitionMethod('大平方减小平方',`新阵每边 ${n+2} 块。`,`${n+2}²−${n}²=${answer} 块。`),competitionMethod('只数四条新边',`上、下各 ${n+2} 块；左、右不再重复数角，各 ${n} 块。`,`2×${n+2}+2×${n}=${answer}，不必计算两个大平方。`)],extension:{prompt:'若边框改成宽 2 块，需要增加多少块？',answer:String(8*n+16),solution:`每边增加 4：${n+4}²−${n}²=${8*n+16}。`}};
});
competitionFamily('ratioEqualize',['R01'],'补到一样多','份数差',r=>{
 const a=1+r(4),b=a+1+r(3),unit=2+r(8),add=(b-a)*unit,answer=String(b*unit);
 return {prompt:`盒中红球与蓝球数量之比是 ${a}:${b}。只加入 ${add} 个红球后，两种球一样多。原来有多少个蓝球？`,answer,math:{a,b,unit},diagram:{kind:'table',rows:[['红球',a+' 份'],['蓝球',b+' 份'],['只增加红球',String(add)+' 个']]},methods:[competitionMethod('抓住份数差',`蓝球比红球多 ${b-a} 份，这就是加入的 ${add} 个。`,`一份 ${unit} 个，蓝球 ${b} 份，共 ${answer} 个。`),competitionMethod('从相等状态倒推',`原红球是蓝球的 ${a}/${b}，两种球的差是蓝球的 ${b-a}/${b}。`,`差 ${add} 个，对应蓝球 ${add}÷(${b-a}/${b})=${answer} 个。`)],extension:{prompt:'原来两种球一共有多少个？',answer:String((a+b)*unit),solution:`原来共 ${a+b} 份，每份 ${unit} 个。`}};
});
competitionFamily('packPrice',['R02'],'怎样买最省','单位率与有限比较',r=>{
 const single=3+r(5),pack=3*single-2-r(single-1),count=7+r(8),packs=Math.floor(count/3),cost=packs*pack+(count%3)*single;
 return {prompt:`一种笔单支 ${single} 元，3 支装每包 ${pack} 元。可以混合买，但必须恰好买 ${count} 支。最少花多少元？`,answer:String(cost),math:{single,pack,count},diagram:{kind:'table',rows:[['单支',single+' 元'],['3 支装',pack+' 元'],['必须恰好买',count+' 支']]},methods:[competitionMethod('用便宜的整包替换',`3 支单买要 ${3*single} 元，比一包贵 ${3*single-pack} 元。`,`所以尽可能买 ${packs} 包，再单买 ${count%3} 支，共 ${cost} 元。`),competitionMethod('按包数列方案',`包数只能为 0 到 ${packs}，每加一包就少买 3 支单支笔。`,`总价每次减少 ${3*single-pack} 元，最后一种方案最省。`)],extension:{prompt:'如果全部单支购买，要多花多少元？',answer:String(count*single-cost),solution:`全部单买 ${count*single} 元，减去最省方案 ${cost} 元。`}};
});
competitionFamily('equalDistanceSpeed',['R03'],'来回平均速度','统一路程',r=>{
 const speed=2+r(20),distance=6*speed,answer=competitionFraction(4*speed,3);
 return {prompt:`小乐沿同一路线往返，去程速度 ${speed} 千米/时，回程速度 ${2*speed} 千米/时。去、回路程相等，中途不停。整个往返的平均速度是多少千米/时？`,answer,math:{speed},diagram:{kind:'line',labels:[`去程：${speed} 千米/时`,`回程：${2*speed} 千米/时`,'两段路程相等']},methods:[competitionMethod('选方便的单程距离',`不妨令单程 ${distance} 千米，去程 6 小时、回程 3 小时。`,`总路程 ${2*distance} 除总时间 9，平均速度 ${answer}。不能直接平均两个速度。`),competitionMethod('按时间份数加权',`回程速度是去程的 2 倍，相同路程用时只有一半。`,`用时比 2:1，所以平均是 (${speed}×2+${2*speed})÷3=${answer}。`)],extension:{prompt:'去程时间是回程时间的几倍？',answer:'2',solution:'相等路程中速度越快用时越少，速度比 1:2 对应用时比 2:1。'}};
});
competitionFamily('oppositeScale',['R04'],'两边怎样配合','乘法比例',r=>{
 const a=2+r(7),b=a+1+r(4),old=10*(1+r(10)),answer=competitionFraction(old*a,b);
 return {prompt:`一个长方形的长变成原来的 ${b}/${a}，面积保持不变。原来的宽是 ${old}，新的宽是多少？`,answer,math:{a,b,old},diagram:{kind:'rectangle',labels:[`长 ×${b}/${a}`,`原宽 ${old}`,'面积不变']},methods:[competitionMethod('面积的两个方向相乘',`长乘 ${b}/${a}，宽必须乘倒数 ${a}/${b}。`,`新宽 ${old}×${a}/${b}=${answer}。`),competitionMethod('取一个方便的原长',`可令原长为 ${a}，原面积 ${a*old}。新长成为 ${b}。`,`新宽 ${a*old}÷${b}=${answer}。原长取多少都不影响宽的变化比例。`)],extension:{prompt:'如果宽也变成原来的相同倍数，面积是原来的几倍？',answer:competitionFraction(b*b,a*a),solution:`两个方向都乘 ${b}/${a}，面积乘它的平方。`}};
});
competitionFamily('balanceCancel',['L01'],'两边都有的先拿走','等量消去',r=>{
 const x=3+r(20),a=2+r(4),b=1+r(10),right=b+x,answer=String(x);
 return {prompt:`天平左边有 ${a+1} 个相同盒子和 ${b} 克砝码，右边有 ${a} 个同样的盒子和 ${right} 克砝码，天平平衡。每个盒子重多少克？`,answer,math:{x,a,b},diagram:{kind:'table',rows:[['左边',(a+1)+' 个盒子 + '+b+' 克'],['右边',a+' 个盒子 + '+right+' 克']]},methods:[competitionMethod('两边拿走相同部分',`两边各拿走 ${a} 个盒子。左边只剩 1 个盒子和 ${b} 克，右边剩 ${right} 克。`,`再拿走同样的 ${b} 克，盒子重 ${right}−${b}=${x} 克。`),competitionMethod('列等式',`设盒子重 t 克：${a+1}t+${b}=${a}t+${right}。`,`合并得到 t=${x}。用原天平两边核对总重量相等。`)],extension:{prompt:'两个这样的盒子共重多少克？',answer:String(2*x),solution:`2×${x}=${2*x}。`}};
});
competitionFamily('tickets',['L02'],'多出的票钱','假设与整数约束',r=>{
 const child=2+r(5),adult=child+2+r(4),people=8+r(13),adults=1+r(people-1),total=adults*adult+(people-adults)*child;
 return {prompt:`${people} 人买票，每人一张。成人票 ${adult} 元，儿童票 ${child} 元，共付 ${total} 元。成人有多少人？`,answer:String(adults),math:{child,adult,people,adults},diagram:{kind:'table',rows:[['成人',adult+' 元/张'],['儿童',child+' 元/张'],['总计',people+' 人，'+total+' 元']]},methods:[competitionMethod('先假设全是儿童',`全是儿童只需 ${people*child} 元，实际多 ${total-people*child} 元。`,`每换成一个成人多 ${adult-child} 元，所以有 ${(total-people*child)}/${adult-child}=${adults} 个成人。`),competitionMethod('列人数与费用关系',`设成人 t 人，儿童 ${people}−t 人。`,`费用 ${adult}t+${child}(${people}−t)=${total}，解得 t=${adults}，人数须为整数。`)],extension:{prompt:'如果成人和儿童各少 1 人，总价少多少元？',answer:String(adult+child),solution:`少一张成人票和一张儿童票，共 ${adult+child} 元。`}};
});
competitionFamily('recurrenceBackwards',['L03'],'把递推倒过来','逆向递推',r=>{
 const first=1+r(8),second=2+r(9),n=5+r(4),seq=[first,second];for(let i=2;i<n;i++)seq.push(seq[i-1]+seq[i-2]);
 return {prompt:`一列数从第 3 项起，每项等于前两项之和。第 ${n-1} 项是 ${seq[n-2]}，第 ${n} 项是 ${seq[n-1]}。第 1 项是多少？`,answer:String(first),math:{first,second,n},diagram:{kind:'table',rows:[['项号',String(n-1),String(n)],['数值',String(seq[n-2]),String(seq[n-1])]]},methods:[competitionMethod('从后往前相减',`前一项 = 当前项−紧邻的前项。`,`依次倒推：${[...seq].reverse().join(' → ')}。所以第一项 ${first}。`),competitionMethod('用未知起点表示',`把前两项写成 a、b，后面依次是 a+b、a+2b、2a+3b……。`,`将最后两个已知数代入，得到 a=${first}、b=${second}；正向核对满足每次相加。`)],extension:{prompt:`第 ${n+1} 项是多少？`,answer:String(seq[n-2]+seq[n-1]),solution:`最后两项相加：${seq[n-2]}+${seq[n-1]}=${seq[n-2]+seq[n-1]}。`}};
});
competitionFamily('linearTable',['L04'],'不用写完整公式','表格中的固定变化',r=>{
 const k=2+r(7),b=1+r(15),x=1+r(5),target=x+4+r(7),answer=k*target+b;
 return {prompt:`一台机器对每个输入都用同一规则：先乘一个固定数，再加一个固定数。输入 ${x} 时输出 ${k*x+b}，输入 ${x+2} 时输出 ${k*(x+2)+b}。输入 ${target} 时输出多少？`,answer:String(answer),math:{k,b,x,target},diagram:{kind:'table',rows:[['输入',String(x),String(x+2),String(target)],['输出',String(k*x+b),String(k*(x+2)+b),'?']]},methods:[competitionMethod('只追踪输入差',`输入增加 2，输出增加 ${2*k}，所以每增加 1 输出增加 ${k}。`,`从 ${x} 到 ${target} 增加 ${target-x}，输出为 ${k*x+b}+${target-x}×${k}=${answer}。`),competitionMethod('找出机器规则',`固定乘数 ${2*k}÷2=${k}，固定加数 ${k*x+b}−${x}×${k}=${b}。`,`输入 ${target}：${target}×${k}+${b}=${answer}。`)],extension:{prompt:'若输入再增加 3，输出增加多少？',answer:String(3*k),solution:`固定加数不变，输出只增加 3×${k}。`}};
});
competitionFamily('divisibleDigits',['N01'],'缺失的数字','整除特征',r=>{
 const a=1+r(8),b=1+r(9),possible=[];for(let x=0;x<=9;x++)for(const tail of [0,5]){const v=1000*a+100*x+10*b+tail;if(v%9===0)possible.push(v)}const answer=String(Math.max(...possible)),digit=Math.floor(Number(answer)/100)%10,tail=Number(answer)%10;
 return {prompt:`四位数 ${a}□${b}□ 能同时被 9 和 5 整除。符合条件的最大四位数是多少？`,answer,math:{a,b},diagram:{kind:'digits',labels:[`${a} □ ${b} □`,'被 9 和 5 整除','求最大的数']},methods:[competitionMethod('先限制末位再看数字和',`末位只可能是 0 或 5。分别补百位，让四个数字的和成为 9 的倍数。`,`符合的数：${possible.join('、')}。最大是 ${answer}。`),competitionMethod('从最大百位往下检验',`先从百位 9 开始往下试，每个百位先检查末位 5，再检查 0。`,`第一次两个整除条件都满足时，百位是 ${digit}、末位是 ${tail}，得到 ${answer}。顺序保证这是最大值。`)],extension:{prompt:'符合条件的四位数有几个？',answer:String(possible.length),solution:`符合的是 ${possible.join('、')}，共 ${possible.length} 个。`}};
});
competitionFamily('factorBalance',['N02'],'因数对靠近一些','因数配对与极值',r=>{
 const product=[24,30,36,40,42,48,54,56,60,63,70,72,80,84,90,96,100,108,120,144][r(20)],pairs=[];for(let a=1;a*a<=product;a++)if(product%a===0)pairs.push([a,product/a]);const best=pairs[pairs.length-1];
 return {prompt:`两个正整数的乘积是 ${product}。它们的和最小是多少？`,answer:String(best[0]+best[1]),math:{product},diagram:{kind:'table',rows:[['乘积',String(product)],['两个数','正整数'],['目标','和尽量小']]},methods:[competitionMethod('列出不重复的因数对',`因数对：${pairs.map(p=>p.join('×')).join('，')}。`,`逐对比较和，最小为 ${best.join('+')}=${best[0]+best[1]}。`),competitionMethod('先找靠近平方根的因数',`乘积固定时，两数靠近通常能让和更小，先检查平方根附近的因数。`,`最近的整数因数对为 ${best.join('、')}；用完整因数表核对，没有更小的和。`)],extension:{prompt:'若不计两个数的顺序，一共有几对？',answer:String(pairs.length),solution:`每个不超过平方根的因数对应唯一一对，共 ${pairs.length} 对。`}};
});
competitionFamily('bells',['N03'],'不要多算出发时刻','共同周期与端点',r=>{
 const a=3+r(8),b=4+r(9);let period=a;while(period%b)period+=a;const duration=period*(2+r(6))+r(period),answer=Math.floor(duration/period);
 return {prompt:`两只铃在开始时同时响，之后分别每 ${a} 分钟和每 ${b} 分钟响一次。在随后 ${duration} 分钟内（包括结束时刻，不算开始时刻），同时响了几次？`,answer:String(answer),math:{a,b,duration},diagram:{kind:'line',labels:[`每 ${a} 分钟`,`每 ${b} 分钟`,`0 之后，到 ${duration} 分钟`] },methods:[competitionMethod('先找共同周期',`下一次同时响是 ${period} 分钟，以后每 ${period} 分钟一次。`,`在 ${duration} 分钟内有 ${answer} 个完整周期。开始的 0 不计。`),competitionMethod('列共同时刻',`列出两种铃声时刻，重合的是 ${Array.from({length:answer},(_,i)=>(i+1)*period).join('、')} 分钟。`,`全部在区间内，共 ${answer} 次；下一次已超过结束时刻。`)],extension:{prompt:`如果也算开始时刻，共有几次同时响？`,answer:String(answer+1),solution:'在刚才的次数上加上 0 时刻的一次。'}};
});
competitionFamily('lastDigit',['N04'],'大指数的小循环','周期与余数',r=>{
 const base=[2,3,7,8][r(4)],exponent=20+r(180),cycle=Array.from({length:4},(_,i)=>(base**(i+1))%10),answer=cycle[(exponent-1)%4];
 return {prompt:`${base} 的 ${exponent} 次方的个位数字是多少？`,answer:String(answer),math:{base,exponent},diagram:{kind:'digits',labels:[`${base} × ${base} × … × ${base}`,`共 ${exponent} 个因子`,'只求个位数字']},methods:[competitionMethod('找末位的循环',`从一次方起，末位依次 ${cycle.join('、')}，4 次一循环。`,`${exponent} 除以 4 余 ${exponent%4}，对到循环中得到 ${answer}；余 0 时看第 4 个。`),competitionMethod('每四个因子成组',`四个 ${base} 的积末位是 ${base**4%10}，再乘本题循环中的末位仍保持那个末位。`,`保留最后 ${exponent%4||4} 个因子核对，末位 ${answer}。`)],extension:{prompt:`${base} 的 ${exponent+1} 次方的个位数字是多少？`,answer:String(cycle[exponent%4]),solution:`在循环中再前进一位，或把原个位 ${answer} 再乘 ${base} 后取个位。`}};
});
competitionFamily('fixedPerimeter',['G01'],'同样的周长','配对与极值',r=>{
 const half=6+r(20),a=Math.floor(half/2),b=half-a,answer=a*b;
 return {prompt:`长方形的长和宽都是正整数，周长是 ${2*half}。它的面积最大是多少？`,answer:String(answer),math:{half},diagram:{kind:'rectangle',labels:[`长 + 宽 = ${half}`,'边长为整数',`周长 ${2*half}`]},methods:[competitionMethod('枚举长宽配对',`长+宽=${half}，依次检查 1 与 ${half-1}、2 与 ${half-2}……。`,`乘积在 ${a} 与 ${b} 时最大，面积 ${answer}。`),competitionMethod('把较长一边挪给较短一边',`设较长边比短边多至少 2，把长减 1、短加 1，周长不变而面积增加。`,`所以最优两边相等或只差 1：${a}、${b}，面积 ${answer}。`)],extension:{prompt:'若周长增加 4，同样要求整数边长，最大面积是多少？',answer:String((a+1)*(b+1)),solution:`长宽和增加 2，最优两边各增加 1。`}};
});
competitionFamily('outsideAngle',['G02'],'外角不用绕远路','角关系',r=>{
 const apex=20+2*r(61),answer=90+apex/2;
 return {prompt:`等腰三角形的顶角是 ${apex}°。把一条腰经过底角的顶点向外延长，形成与这个底角相邻的外角。这个外角是多少度？`,answer:String(answer),math:{apex},diagram:{kind:'isoscelesExterior',apex},methods:[competitionMethod('先求两个相等的底角',`每个底角为 (180−${apex})÷2=${90-apex/2}°。`,`外角与底角合为 180°，所以外角 ${answer}°。`),competitionMethod('用不相邻的两个内角',`外角等于顶角加另一个底角。`,`${apex}+(180−${apex})÷2=90+${apex}/2=${answer}°。`)],extension:{prompt:'两个底角加起来是多少度？',answer:String(180-apex),solution:`三个内角总和 180°，减去顶角 ${apex}°。`}};
});
competitionFamily('overlapSquares',['G03'],'重叠部分数了几次','分割与去重',r=>{
 const n=5+r(8),dx=1+r(n-1),dy=1+r(n-1),overlap=(n-dx)*(n-dy),area=2*n*n-overlap;
 return {prompt:`两个边长都为 ${n} 的正方形，边互相平行。第二个比第一个向右移 ${dx}、向上移 ${dy}。两块正方形合起来覆盖的面积是多少？重叠部分只算一次。`,answer:String(area),math:{n,dx,dy},diagram:{kind:'overlapSquares',n,dx,dy},methods:[competitionMethod('两块相加再减重叠',`重叠长方形的边长是 ${n-dx} 和 ${n-dy}，面积 ${overlap}。`,`2×${n}²−${overlap}=${area}。`),competitionMethod('只加第二块新增的部分',`第一块有 ${n*n}。第二块新增右侧条带 ${dx*n} 和上侧余下条带 ${(n-dx)*dy}。`,`合计 ${n*n}+${dx*n}+${(n-dx)*dy}=${area}。条带的拐角不再重复数。`)],extension:{prompt:'重叠部分的面积是多少？',answer:String(overlap),solution:`重叠边长 ${n-dx} 与 ${n-dy}，相乘得 ${overlap}。`}};
});
competitionFamily('circleRoute',['G04'],'绕圆的两条路','弧长与补路',r=>{
 const sectors=8+r(5),unit=2+r(8),steps=1+r(sectors-1),short=Math.min(steps,sectors-steps),circumference=sectors*unit;
 return {prompt:`圆形跑道长 ${circumference} 米，被标记点分成 ${sectors} 段等长的弧。从 A 顺时针经过 ${steps} 段弧到 B。沿跑道从 A 到 B 的较短路线长多少米？`,answer:String(short*unit),math:{sectors,unit,steps},diagram:{kind:'circleRoute',sectors,steps},methods:[competitionMethod('比较两个方向的段数',`顺时针 ${steps} 段，另一个方向 ${sectors-steps} 段，较短 ${short} 段。`,`每段 ${circumference}÷${sectors}=${unit} 米，较短路线 ${short*unit} 米。`),competitionMethod('先算一条弧再求补弧',`顺时针弧长 ${steps*unit} 米，余下弧长 ${circumference}−${steps*unit}=${(sectors-steps)*unit} 米。`,`取两者较小值 ${short*unit}；经过较多标记点未必是较短方向。`)],extension:{prompt:'较长路线比较短路线长多少米？',answer:String(Math.abs(sectors-2*steps)*unit),solution:`两条弧段数之差为 ${Math.abs(sectors-2*steps)}，乘每段 ${unit} 米。`}};
});
competitionFamily('similarAreaPerimeter',['G05'],'面积比不是边长比','识别平方比例',r=>{
 const a=2+r(4),b=a+1+r(4),unit=3+r(12),perimeter=a*unit;
 return {prompt:`两个相似图形的面积之比是 ${a*a}:${b*b}。较小图形的周长是 ${perimeter}，较大图形的周长是多少？`,answer:String(b*unit),math:{a,b,unit},diagram:{kind:'table',rows:[['小图形面积',a*a+' 份'],['大图形面积',b*b+' 份'],['小图形周长',String(perimeter)]]},methods:[competitionMethod('先还原长度比',`面积比是长度比的平方，长度比为 ${a}:${b}。`,`周长也按长度比变化：${perimeter}÷${a}×${b}=${b*unit}。`),competitionMethod('看每条边如何缩放',`所有对应边都乘 ${b}/${a}，面积才会乘 ${b*b}/${a*a}。`,`边长相加的周长也乘 ${b}/${a}，得到 ${b*unit}。`)],extension:{prompt:'把较小图形所有边放大 2 倍，面积是原来的几倍？',answer:'4',solution:'长度变 2 倍，两个方向共同作用，面积变 2²=4 倍。'}};
});
competitionFamily('ladderShift',['G06'],'梯子两端的交换','勾股与结构识别',r=>{
 const k=1+r(20);
 return {prompt:`一根长 ${5*k} 米的梯子斜靠竖直墙面，底端离墙 ${3*k} 米。把底端移到离墙 ${4*k} 米的位置，梯顶仍贴墙。梯顶下降了多少米？`,answer:String(k),math:{k},diagram:{kind:'right',labels:[`原高度 ?`,`${3*k} → ${4*k}`,`梯长 ${5*k}`]},methods:[competitionMethod('分别求两次高度',`原高度²=${5*k}²−${3*k}²=${16*k*k}，原高度 ${4*k}。`,`新高度²=${5*k}²−${4*k}²=${9*k*k}，新高度 ${3*k}，下降 ${k} 米。`),competitionMethod('识别 3-4-5 的交换',`梯长不变，两次直角边都是 ${k} 倍的 3、4。`,`底端从 3 份变 4 份，高度从 4 份变 3 份，下降一份 ${k}。`)],extension:{prompt:'梯子竖直靠墙时，梯顶比移动后的高度高多少米？',answer:String(2*k),solution:`竖直时高度 ${5*k}，移动后 ${3*k}，相差 ${2*k}。`}};
});
competitionFamily('paintedCube',['G07'],'只有两个面涂色','分类与边界',r=>{
 const n=3+r(15),answer=12*(n-2);
 return {prompt:`一个大正方体的六个面都涂色，再切成每条棱上有 ${n} 个的小正方体。恰好有两个面涂色的小正方体有多少个？`,answer:String(answer),math:{n},diagram:{kind:'cuboid',labels:[`每棱 ${n} 个`,'六面涂色','恰好两面涂色']},methods:[competitionMethod('只数棱的中间',`恰好两面涂色的小块在棱上，但不是角块。每棱 ${n-2} 个。`,`12 条棱，共 12×${n-2}=${answer} 个。角块有 3 面涂色。`),competitionMethod('按三个方向分类',`每个方向有 4 条平行棱，每条去掉两个端点。`,`三个方向合计 3×4×${n-2}=${answer}，分类互不重叠。`)],extension:{prompt:'一个面也没有涂色的小正方体有多少个？',answer:String((n-2)**3),solution:`去掉外层后，里面每边 ${n-2} 个，共 ${n-2}³ 个。`}};
});
competitionFamily('exactlyOneSet',['C01'],'只参加一个组','不重叠分类',r=>{
 const a=6+r(18),b=5+r(18),both=1+r(Math.min(a,b)-1),answer=a+b-2*both;
 return {prompt:`参加棋类组的有 ${a} 人，参加球类组的有 ${b} 人，其中 ${both} 人两组都参加。恰好参加一个组的有多少人？`,answer:String(answer),math:{a,b,both},diagram:{kind:'sets',labels:[`棋 ${a}`,`球 ${b}`,`两组都参加 ${both}`]},methods:[competitionMethod('分别减去两组都参加的人',`只棋 ${a}−${both}=${a-both}，只球 ${b}−${both}=${b-both}。`,`两部分不重叠，合计 ${answer} 人。`),competitionMethod('从至少参加一组再扣掉交集',`至少一组 ${a}+${b}−${both}=${a+b-both}。`,`再减两组都参加的 ${both}，得到 ${answer}。两个“至少”和“恰好”不同。`)],extension:{prompt:'至少参加一个组的有多少人？',answer:String(a+b-both),solution:`两组人数相加时交集重复一次，减 ${both}。`}};
});
competitionFamily('gridDetour',['C02'],'最短路线绕过一点','分类与补集',r=>{
 const w=2+r(4),h=2+r(3),x=1+r(w-1),y=1+r(h-1),all=competitionRouteCount(w,h),through=competitionRouteCount(x,y)*competitionRouteCount(w-x,h-y),good=all-through;
 return {prompt:`方格路从 A 到 B，要向右走 ${w} 段、向上走 ${h} 段；每一步只能向右或向上。点 P 在 A 右方 ${x} 段、上方 ${y} 段。不能经过 P 的最短路线有多少条？`,answer:String(good),math:{w,h,x,y},diagram:{kind:'routes',w,h,x,y},methods:[competitionMethod('先数全部再减经过 P',`全部最短路线 ${all} 条。到 P 有 ${competitionRouteCount(x,y)} 条，从 P 到 B 有 ${competitionRouteCount(w-x,h-y)} 条。`,`经过 P 的 ${through} 条必须去掉，剩 ${all}−${through}=${good}。`),competitionMethod('逐点累加路线数',`A 写 1。每个点的路线数等于左边和下面的路线数之和，P 写 0。`,`按从左下到右上的顺序计算，B 得到 ${good}。这条路线数表直接排除了经过 P 的路。`)],extension:{prompt:'经过 P 的最短路线有多少条？',answer:String(through),solution:`到 P 的走法和从 P 出发的走法可独立配对，相乘得 ${through}。`}};
});
competitionFamily('adjacentLine',['C03'],'相邻的一对','捆绑与位置计数',r=>{
 const n=4+r(5),answer=2*competitionFactorial(n-1);
 return {prompt:`${n} 位不同的小朋友排成一列，其中小乐和小明必须相邻。共有多少种排列？`,answer:String(answer),math:{n},diagram:{kind:'line',labels:[`${n} 位不同的人`,'小乐、小明必须相邻','先后顺序算不同']},methods:[competitionMethod('把两人暂时捆成一块',`两人合成一块，连同其他人共有 ${n-1} 个对象，排法 ${(competitionFactorial(n-1))} 种。`,`块里两人可交换，所以乘 2，得到 ${answer}。`),competitionMethod('先选相邻位置',`相邻位置可从第 1 到第 ${n-1} 位开始，共 ${n-1} 种；两人内部 2 种。`,`其他 ${n-2} 人有 ${competitionFactorial(n-2)} 种排列，乘起来 ${answer}。`)],extension:{prompt:'如果小乐必须紧挨在小明左边，共有多少种排列？',answer:String(competitionFactorial(n-1)),solution:'两人的内部顺序固定，不再乘 2。'}};
});
competitionFamily('digitComplement',['C04'],'至少出现一次','补集与去重',r=>{
 const digit=r(10),length=2+r(2),all=10**length,without=9**length,answer=all-without;
 return {prompt:`有 ${length} 位的数字密码，每位可以用 0 到 9，开头也可以是 0。至少有一位是 ${digit} 的密码有多少个？`,answer:String(answer),math:{digit,length},diagram:{kind:'digits',labels:[Array(length).fill('□').join(' '),'允许开头为 0',`至少一个 ${digit}`]},methods:[competitionMethod('减掉一次也没出现的',`全部 ${length} 位密码 ${all} 个。每位不用 ${digit} 只有 9 种，共 ${without} 个。`,`至少出现一次：${all}−${without}=${answer}。`),competitionMethod('按第一次出现的位置分类',`第一次 ${digit} 在第 j 位：前面每位 9 种，后面每位 10 种。`,`各位置数 ${Array.from({length},(_,j)=>9**j*10**(length-j-1)).join(' + ')}，合计 ${answer}，分类不会重复。`)],extension:{prompt:`恰好最后一位是 ${digit}、前面各位都不是 ${digit} 的密码有多少个？`,answer:String(9**(length-1)),solution:`前 ${length-1} 位各 9 种，最后固定，共 ${9**(length-1)}。`}};
});
competitionFamily('restrictedTeam',['C03'],'不能同时入选','限制组合与分类',r=>{
 const n=6+r(15),all=competitionChoose(n,3),bad=n-2,answer=all-bad;
 return {prompt:`从 ${n} 位不同的小朋友中选 3 人组成小队，不分职位。其中小乐和小明不能同时入选。可以选出多少个不同的小队？`,answer:String(answer),math:{n},diagram:{kind:'line',labels:[`${n} 人中选 3 人`,'不计队内顺序','小乐、小明不能同时入选']},methods:[competitionMethod('减去不允许的小队',`全部 3 人小队 ${all} 个。不允许的小队已固定小乐和小明，第三人有 ${n-2} 种选法。`,`所以 ${all}−${n-2}=${answer} 个。`),competitionMethod('按选中两人的人数分类',`两人都不选：从其余 ${n-2} 人选 3，有 ${competitionChoose(n-2,3)} 个。`,`恰选一个：2×${competitionChoose(n-2,2)}=${2*competitionChoose(n-2,2)} 个。两类相加得 ${answer}。`)],extension:{prompt:'如果必须恰好选中小乐、小明中的一个，可选多少个小队？',answer:String(2*competitionChoose(n-2,2)),solution:`先选这两人中的一个，再从其余 ${n-2} 人中选 2。`}};
});
competitionFamily('chartScale',['D01'],'先读懂每一格','刻度与比例读图',r=>{
 const unit=2+r(8),a=2+r(4),b=2+r(5),c=2+r(4),answer=(b+c)*unit;
 return {prompt:`下面的柱状图从 0 起，每一横格代表相同人数。甲柱高 ${a} 格，表示 ${a*unit} 人；乙柱高 ${b} 格，丙柱高 ${c} 格。乙、丙两组共有多少人？`,answer:String(answer),math:{unit,a,b,c},diagram:{kind:'bars',values:[a,b,c],names:['甲','乙','丙'],known:0,knownValue:a*unit},methods:[competitionMethod('先求每格人数',`${a} 格表示 ${a*unit} 人，每格 ${unit} 人。`,`乙、丙共 ${b+c} 格，表示 ${(b+c)*unit} 人。`),competitionMethod('先看合并柱高与甲的比',`乙丙合并柱高为 ${b+c} 格，是甲的 (${b+c})/${a} 倍。`,`甲人数 ${a*unit} 乘这个倍数，得到 ${answer}。刻度代表人数，不能把格数当人数。`)],extension:{prompt:'三组共有多少人？',answer:String((a+b+c)*unit),solution:`三柱共 ${a+b+c} 格，乘每格 ${unit} 人。`}};
});
competitionFamily('missingAverage',['D02'],'消失的一个数','总量与偏差',r=>{
 const count=4+r(7),mean=8+r(13),other=mean-1-r(4),answer=count*mean-(count-1)*other;
 return {prompt:`${count} 个数的平均数是 ${mean}。删去其中一个后，其余 ${count-1} 个数的平均数是 ${other}。删去的数是多少？`,answer:String(answer),math:{count,mean,other},diagram:{kind:'table',rows:[['原来',count+' 个，平均 '+mean],['删去后',(count-1)+' 个，平均 '+other]]},methods:[competitionMethod('比较两个总和',`原总和 ${count}×${mean}=${count*mean}，余下总和 ${count-1}×${other}=${(count-1)*other}。`,`差就是删去的数 ${answer}。`),competitionMethod('用平均数作基准',`余下每个数相对原平均合计少 ${count-1}×(${mean}−${other})=${(count-1)*(mean-other)}。`,`删去的数必须比原平均多同样的量：${mean}+${(count-1)*(mean-other)}=${answer}。`)],extension:{prompt:'若每个原数都增加 2，原来的平均数是多少？',answer:String(mean+2),solution:'每个数同增 2，平均数也增加 2。'}};
});
competitionFamily('diceSum',['D03'],'哪些结果等可能？','样本空间',r=>{
 const faces=4+r(5),target=faces+1+r(3),pairs=[];for(let a=1;a<=faces;a++)for(let b=1;b<=faces;b++)if(a+b===target)pairs.push([a,b]);
 return {prompt:`同时掷两枚公平的 ${faces} 面骰子，每枚的数字为 1 到 ${faces}。两个数字之和是 ${target} 的概率是多少？`,answer:competitionFraction(pairs.length,faces*faces),math:{faces,target},diagram:{kind:'table',rows:[['第一枚',`1 到 ${faces}`],['第二枚',`1 到 ${faces}`],['目标和',String(target)]]},methods:[competitionMethod('列出有顺序的结果',`全部等可能结果 ${faces*faces} 个。符合的结果：${pairs.map(p=>'('+p.join(',')+')').join('、')}。`,`所以概率 ${pairs.length}/${faces*faces}=${competitionFraction(pairs.length,faces*faces)}。数字和本身并不等可能。`),competitionMethod('固定第一枚找搭档',`第一枚为 a 时，第二枚只能是 ${target}−a，且必须在 1 到 ${faces} 之间。`,`有 ${pairs.length} 个合法 a，每种只配一个结果，得到相同概率。`)],extension:{prompt:`两个数字之和不是 ${target} 的概率是多少？`,answer:competitionFraction(faces*faces-pairs.length,faces*faces),solution:'与原事件互为补集，用 1 减原概率。'}};
});
competitionFamily('foldHoles',['S01'],'展开后会有几个孔','对称中的固定位置',r=>{
 const interior=1+r(4),edge=1+r(4),center=r(2),answer=4*interior+2*edge+center;
 return {prompt:`正方形纸沿水平、竖直中线各折一次，折成四层的小正方形。剪出 ${interior} 个位于内部的孔、${edge} 个位于一条折痕边上的孔${center?'，另在两条折痕的交点剪一个孔':''}。各孔彼此分开，不碰纸的外边。完全展开后有多少个孔？`,answer:String(answer),math:{interior,edge,center},diagram:{kind:'foldHoles',interior,edge,center},methods:[competitionMethod('按孔的位置分类',`内部孔展开变 4 个，单条折痕边上的孔变 2 个，两条折痕交点的孔变 1 个。`,`总数 4×${interior}+2×${edge}${center?'+1':''}=${answer}。不能所有孔都乘 4。`),competitionMethod('分两次展开',`先展开一条折痕，再展开另一条。离开折痕的孔会复制，在折痕上的孔与镜像连成同一个孔。`,`按两次对称逐个追踪，内部各 4 个、折痕边各 2 个${center?'、交点 1 个':''}，共 ${answer}。`)],extension:{prompt:'如果在小正方形内部再剪一个孔，展开后总共多少个孔？',answer:String(answer+4),solution:'新增内部孔会出现 4 个，所以原数加 4。'}};
});
competitionFamily('checkerDomino',['S02'],'剩下够大，还能铺吗？','染色与构造',r=>{
 const w=4+2*r(5),h=2+2*r(6),answer=w*h/2-2;
 return {prompt:`一张 ${w} 列、${h} 行的棋盘，黑白格相间，左上角为黑格。去掉左上角和右下角两个格子。每块骨牌恰好覆盖两个相邻格子，不能重叠或盖到空缺。最多能放几块骨牌？`,answer:String(answer),math:{w,h},diagram:{kind:'checker',w,h},methods:[competitionMethod('先看每块必须覆盖的颜色',`两个被去掉的角都是黑格，剩黑格 ${answer}、白格 ${answer+2}。每块骨牌盖一黑一白。`,`最多 ${answer} 块；把首尾两行从缺口旁横着配对、中间行铺满，能达到这个数。光把剩余格数除以 2 会多算 1 块。`),competitionMethod('画出达到上限的摆法',`第一行从第 2 列向右成对摆，留最右一白格；最后一行从左成对摆，留最左一白格。`,`中间各行全部横着配对，共 ${answer} 块。剩下的两格是白格，所有黑格已用完，不能再多放一块。`)],extension:{prompt:'若不去掉任何格子，最多能放几块？',answer:String(w*h/2),solution:`每行有偶数格，可以两两横着摆，覆盖整个棋盘。`}};
});

// These RC59 natural scenarios keep their original mathematical signatures.
// Routine filler and the unrelated bell/traveller construction are excluded.
const COMPETITION_REUSED=[
 ['weighted',['R01','D02'],'两队平均分','份数与加权'],
 ['fractionWeighted',['A03','R01','D02'],'分数得分的平均','份数与加权'],
 ['catch',['L01','R03'],'什么时候追上？','差速与等量'],
 ['tiles',['N03','G01'],'最大的地砖','公因数与铺排'],
 ['pairChance',['C03','D03'],'不放回取球','组合与样本空间'],
 ['unionChance',['C01','D03'],'抽到组员','去重与概率'],
 ['complementChance',['C04','D03'],'两个组都没参加','补集与容斥'],
 ['offers',['A04','R02'],'折扣和配送费','单位价与整单价'],
 ['angleRatio',['R01','G02'],'角度的份数','整体与比例'],
 ['digitCount',['N01','C02'],'拼出整除的数','余数分类与计数'],
 ['distinctDigitCount',['N01','C03'],'数字不能重复','整除与限制排列'],
 ['coordinateDistance',['L04','G06'],'坐标里的直线距离','坐标与勾股']
];
for(const [family,topics,title,strategy] of COMPETITION_REUSED)competitionRegister('natural-'+family,topics,title,strategy,seed=>({...competitionIntegratedProblem(topics,seed),title,strategy,legacyIdentity:true}));

competitionFamily('routeProbability',['C02','D03'],'随机选一条路线','计数转概率',r=>{
 const w=2+r(4),h=2+r(3),x=1+r(w-1),y=1+r(h-1),all=competitionRouteCount(w,h),through=competitionRouteCount(x,y)*competitionRouteCount(w-x,h-y);
 return {prompt:`从 A 到 B 的最短方格路线都要向右 ${w} 段、向上 ${h} 段。等可能地随机选其中一条完整路线（每条路线被选中的机会相同）。P 在 A 右方 ${x} 段、上方 ${y} 段。选中的路线不经过 P 的概率是多少？`,answer:competitionFraction(all-through,all),math:{w,h,x,y},diagram:{kind:'routes',w,h,x,y},methods:[competitionMethod('先数路线再求比例',`全部最短路线 ${all} 条，经过 P 的有 ${through} 条。`,`不经过的 ${all-through} 条，概率 ${competitionFraction(all-through,all)}。这里等可能的是完整路线。`),competitionMethod('用经过 P 的补集',`到 P 与从 P 到 B 的路线可以配对，共 ${competitionRouteCount(x,y)}×${competitionRouteCount(w-x,h-y)}=${through} 条。`,`经过的概率 ${competitionFraction(through,all)}，用 1 减去它。`)],extension:{prompt:'经过 P 的概率是多少？',answer:competitionFraction(through,all),solution:'与不经过互补，概率之和为 1。'}};
});
competitionFamily('cubeProbability',['G07','D03'],'随机拿到棱块','空间分类转概率',r=>{
 const n=3+r(8),good=12*(n-2),all=n**3;
 return {prompt:`大正方体的六面都涂色，再切成每条棱 ${n} 个的小正方体，把所有小块打散。等可能随机取一块，恰好两个面涂色的概率是多少？`,answer:competitionFraction(good,all),math:{n},diagram:{kind:'cuboid',labels:[`每棱 ${n} 个`,'从全部小块中随机取 1 块','恰好两面涂色']},methods:[competitionMethod('先确定符合的小块',`恰好两个面涂色在棱的中间，12×(${n}−2)=${good} 块。`,`总共 ${n}³=${all} 块，概率 ${competitionFraction(good,all)}。`),competitionMethod('按方向分类后合并',`三个方向各有 4 条棱，每棱 ${n-2} 个符合。`,`每个方向符合 ${4*(n-2)} 块，把三类数量合计，再除全部 ${all} 块。`)],extension:{prompt:'随机取到三个面都涂色的小块的概率是多少？',answer:competitionFraction(8,all),solution:`只有 8 个角块有三个涂色面，概率 8/${all}。`}};
});
competitionFamily('overlapProbability',['G03','D03'],'重叠区域的机会','面积转概率',r=>{
 const n=5+r(7),dx=1+r(n-1),dy=1+r(n-1),overlap=(n-dx)*(n-dy),union=2*n*n-overlap;
 return {prompt:`两块边长 ${n} 的正方形边互相平行，第二块比第一块向右 ${dx}、向上 ${dy}。在两块合起来覆盖的区域中等可能选一点，落在重叠区域的概率是多少？`,answer:competitionFraction(overlap,union),math:{n,dx,dy},diagram:{kind:'overlapSquares',n,dx,dy},methods:[competitionMethod('画出共同覆盖的长方形',`重叠面积 (${n}−${dx})×(${n}−${dy})=${overlap}。`,`可选区域面积 2×${n}²−${overlap}=${union}，概率 ${competitionFraction(overlap,union)}。`),competitionMethod('把整体分成三块',`只第一块 ${n*n-overlap}、只第二块 ${n*n-overlap}、重叠 ${overlap}。`,`分母是这三块之和，不是两块面积直接相加；再求重叠占比。`)],extension:{prompt:'落在恰好一块正方形内的概率是多少？',answer:competitionFraction(union-overlap,union),solution:'在合起来的区域中，恰好一块与重叠互为补集。'}};
});
competitionFamily('ratioUnion',['R01','C01'],'先算参加次数','去重后的份数',r=>{
 const unit=3+r(8),a=2+r(3),b=a+1+r(3),both=1+r(a*unit-1),red=a*unit,blue=b*unit,union=red+blue-both;
 return {prompt:`每个小朋友至少参加棋类组或球类组之一，两组人数比是 ${a}:${b}。共有 ${union} 个不同的小朋友，其中 ${both} 人两组都参加。只参加球类组的有多少人？`,answer:String(blue-both),math:{unit,a,b,both},diagram:{kind:'sets',labels:[`棋 ${a} 份`,`球 ${b} 份`,`总人数 ${union}，重叠 ${both}`]},methods:[competitionMethod('先把重复参加加回来',`两组人数相加会把 ${both} 人数两遍，所以合计参加次数 ${union}+${both}=${red+blue}。`,`共 ${a+b} 份，每份 ${unit} 人；球类 ${blue} 人，减交集 ${both} 得 ${blue-both}。`),competitionMethod('用份数写集合关系',`设一份 t 人，不同人数 ${a}t+${b}t−${both}=${union}。`,`求出 t=${unit}，只球类为 ${b}t−${both}=${blue-both}。`)],extension:{prompt:'只参加棋类组的有多少人？',answer:String(red-both),solution:`棋类共 ${red} 人，减两组都参加的 ${both}。`}};
});
competitionFamily('chartAverage',['D01','D02'],'平均到哪一格？','频数与加权',r=>{
 const values=[2,4,6],counts=[1+r(5),1+r(5),1+r(5)],total=counts.reduce((a,b)=>a+b,0),sum=counts.reduce((a,b,i)=>a+b*values[i],0);
 return {prompt:`柱状图记录所有人的得分：得 2 分、4 分、6 分的人数分别如图（每格代表 1 人）。所有人的平均分是多少？`,answer:competitionFraction(sum,total),math:{counts},diagram:{kind:'bars',values:counts,names:['2 分','4 分','6 分']},methods:[competitionMethod('每个得分乘它的人数',`总人数 ${counts.join('+')}=${total}；总分 2×${counts[0]}+4×${counts[1]}+6×${counts[2]}=${sum}。`,`平均 ${sum}÷${total}=${competitionFraction(sum,total)}，三种分数的人数不同。`),competitionMethod('用中间的 4 分作基准',`先令每人都是 4 分，低分组每人少 2，高分组每人多 2。`,`平均为 4+2×(${counts[2]}−${counts[0]})/${total}=${competitionFraction(sum,total)}。`)],extension:{prompt:'每个人得分增加 1 后，平均分是多少？',answer:competitionFraction(sum+total,total),solution:'每人同增 1，平均也增 1。'}};
});
competitionFamily('parityPermutations',['C03','S02'],'偶数不能挨着','先安排再插空',r=>{
 const n=4+r(5),evens=Math.floor(n/2),odds=n-evens,answer=competitionFactorial(odds)*competitionChoose(odds+1,evens)*competitionFactorial(evens);
 return {prompt:`把 1 到 ${n} 这些不同的数字排成一行，要求任何两个偶数都不相邻。共有多少种排列？`,answer:String(answer),math:{n},diagram:{kind:'digits',labels:[`数字 1 到 ${n}`,'任意两个偶数不能相邻','奇数之间可以相邻']},methods:[competitionMethod('先放奇数再插入偶数',`${odds} 个奇数先排，有 ${competitionFactorial(odds)} 种；产生 ${odds+1} 个空位。`,`选 ${evens} 个空位各放一个偶数，有 ${competitionChoose(odds+1,evens)} 种选法；偶数再排列 ${competitionFactorial(evens)} 种，总共 ${answer}。`),competitionMethod('先确定奇偶位置模式',`先列出所有 ${evens} 个偶数位互不相邻的模式，共 ${competitionChoose(odds+1,evens)} 种。`,`每种模式中奇数可互换、偶数可互换，分别乘 ${competitionFactorial(odds)} 和 ${competitionFactorial(evens)}。`)],extension:{prompt:'如果按从小到大固定奇数的先后，仍允许偶数互换，有多少种？',answer:String(competitionChoose(odds+1,evens)*competitionFactorial(evens)),solution:`奇数只有一种先后顺序，去掉乘数 ${competitionFactorial(odds)}。`}};
});
competitionFamily('recurrenceRemainders',['L03','N04'],'递推里的余数周期','状态与循环',r=>{
 const n=12+r(80),period=[1,1,2,0,2,2,1,0],prefix=[0];for(const v of period)prefix.push(prefix[prefix.length-1]+v);const answer=9*Math.floor(n/8)+prefix[n%8];
 return {prompt:`数列前两项都是 1，从第三项起每项是前两项之和。把前 ${n} 项各自除以 3 后的余数加起来，得到多少？`,answer:String(answer),math:{n},diagram:{kind:'digits',labels:['1、1、2、3、5、8、…','每项都取除以 3 的余数',`加前 ${n} 项的余数`]},methods:[competitionMethod('余数也能递推',`余数依次 ${period.join('、')}，下一对又回到 1、1，于是 8 项循环，每轮和 9。`,`${n}=${Math.floor(n/8)}×8+${n%8}，总和 ${Math.floor(n/8)}×9+${prefix[n%8]}=${answer}。`),competitionMethod('用相邻余数对确认重复',`只知道单个余数相同还不能确定重复；要跟踪相邻两项。`,`从 (1,1) 开始，8 步后同一状态再次出现。完整轮数和剩余前缀分别相加，得到 ${answer}。`)],extension:{prompt:`第 ${n+1} 项除以 3 的余数是多少？`,answer:String(period[n%8]),solution:`第 ${n+1} 项对应循环中第 ${n%8+1} 项，余数 ${period[n%8]}。`}};
});

function competitionEligible(ids){const scope=new Set(competitionCanonicalIds(ids));return COMPETITION_CATALOG.filter(f=>f.topicIds.every(id=>scope.has(id)))}
function competitionCatalogCreate(recipe){
 const family=COMPETITION_CATALOG.find(f=>f.id===recipe?.familyId),seed=recipe?.seed;
 if(recipe?.engine!==2||!family||!Number.isInteger(seed)||seed<1||seed>2147483647)throw Error('Invalid natural competition recipe');
 const core=family.build(seed),ids=[...family.topicIds];
 if(!core.prompt||core.clues||core.family==='constraints'||core.options.length!==5||new Set(core.options).size!==5||!core.options.includes(core.answer)||core.methods.length!==2||!core.extension)throw Error('Invalid natural competition problem');
 // Reusing an unchanged RC59 scenario cannot turn exposure into a fresh try.
 const signature=JSON.stringify({engine:1,topicIds:ids,family:core.family,math:core.math}),id='COMP-'+competitionHash(signature);
 return {id,contentVersion:COMPETITION_CATALOG_REVISION,skillId:ids[0]+'.01',phase:'挑战',mode:'competition',prompt:core.prompt,options:core.options,optionIds:core.options.map(v=>id+':'+v),answer:core.options.indexOf(core.answer),competition:{...core,signature,topicIds:ids,recipe:{engine:2,familyId:family.id,seed}}};
}
return {COMPETITION_CATALOG,COMPETITION_REUSED,competitionEligible,competitionCatalogCreate};
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionCanonicalIds,competitionNumericOptions,competitionHash,competitionFraction,competitionIntegratedProblem});
if(typeof module!=='undefined')module.exports={COMPETITION_CATALOG,COMPETITION_REUSED,competitionEligible,competitionCreate:competitionCatalogCreate};

'use strict';
const COMPETITION_EXPANSION=((deps)=>{
 const {competitionRng:rng,competitionFraction:F,competitionNumericOptions:legacyOptions}=deps,out=[];
 const options=(answer,r)=>{if(Number(answer)>=0||String(answer).includes('/'))return legacyOptions(answer,r);const n=Number(answer),values=[n,n-1,n+1,-n,0];for(let k=2;new Set(values).size<5;k++)values.push(n+k);return requireShuffle([...new Set(values)].slice(0,5).map(String),r)};
 const requireShuffle=(a,r)=>{for(let i=a.length-1;i>0;i--){const j=r(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
 const method=(name,...steps)=>({name,steps});
 const change=(prompt,answer,solution)=>({prompt,answer:String(answer),solution,kind:'condition-change'});
 const add=(id,topic,level,title,strategy,insight,build)=>out.push({id,topicIds:[topic],level,title,strategy,insight,build(seed){const r=rng(seed),p=build(r);return {...p,family:id,title,strategy,options:options(String(p.answer),r),answer:String(p.answer),hints:p.hints||[p.methods[0].name+'：先找题目中可以确定的关系。']}}});
 const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a};
 const fact=n=>n<2?1:n*fact(n-1);
 const choose=(n,k)=>{let a=1;for(let i=1;i<=k;i++)a=a*(n-i+1)/i;return a};
 add('digitInsert','A01',1,'数字卡','位值比较','比较各个插入位置，前面的数位决定大小',r=>{
  const a=2+r(7),b=1+r(a-1),d=a+1,values=[100*d+10*a+b,100*a+10*d+b,100*a+10*b+d];
  return {prompt:`在两位数 ${10*a+b} 中插入数字 ${d}，原来的两个数字先后不变。能得到的最大三位数是多少？`,answer:Math.max(...values),math:{a,b,d},methods:[method('按数位比较',`可能的数是 ${values.join('、')}。`,`最高位越大，整个数越大，最大为 ${Math.max(...values)}。`)],extension:change('如果求最小三位数，答案是多少？',Math.min(...values),`仍比较同样三个位置，最小为 ${Math.min(...values)}。`)};
 });
 add('numberAppend','A01',2,'末尾的一位','位值等量','添一位会把原数乘十，改变的是数的表示',r=>{
  const n=12+r(76),digit=r(10),gap=9*n+digit;
  return {prompt:`在一个两位数的末尾添上数字 ${digit}，得到的三位数比原数大 ${gap}。原来的两位数是多少？`,answer:n,math:{n,digit},methods:[method('比较添位前后',`添位后等于原数的 10 倍再加 ${digit}。`,`所以差为原数的 9 倍加 ${digit}，原数 (${gap}−${digit})÷9=${n}。`),method('按候选数验证',`原数在 10 到 99 之间，添位后可直接减回原数。`,`验证 ${n}：${10*n+digit}−${n}=${gap}；相邻原数的差额会相差 9，所以答案唯一。`)],extension:change(`改为在原数前面添 ${digit||1}，新数比原数大多少？`,100*(digit||1),`添在前面增加的是 ${digit||1} 个百，原来的两位保持不变。`)};
 });
 add('pairedSum','A02',1,'连续的数字','首尾配对','相同总和的配对可以减少逐项运算',r=>{
  const n=8+2*r(16),answer=n*(n+1)/2;
  return {prompt:`把 1 到 ${n} 的所有整数加起来，和是多少？`,answer,math:{n},methods:[method('首尾配对',`1+${n}、2+${n-1}……，每对都是 ${n+1}，共 ${n/2} 对。`,`所以和是 ${n/2}×${n+1}=${answer}。`),method('正反两行相加',`把这列数正写、倒写，两行同列之和都是 ${n+1}。`,`两倍总和为 ${n}×${n+1}，除以 2 得 ${answer}。`)],extension:change(`只加其中的偶数，和是多少？`,(n/2)*(n/2+1),`偶数是 1 到 ${n/2} 各乘 2，先求这些数的和，再乘 2。`)};
 });
 add('telescopingDifferences','A02',2,'一串差','消去共同项','展开后中间项抵消，只留下端点',r=>{
  const start=12+r(20),n=4+r(12),step=2+r(7),end=start+n*step;
  return {prompt:`计算 (${start+step}−${start})+(${start+2*step}−${start+step})+……+(${end}−${end-step})。省略部分保持同样的相邻两数相减。结果是多少？`,answer:n*step,math:{start,n,step},methods:[method('只看最后留下的数',`展开后，中间的数各有一次加和一次减，会抵消。`,`只剩 ${end}−${start}=${n*step}。`),method('按每一段计算',`每个括号的差都是 ${step}，共有 ${n} 个括号。`,`合计 ${n}×${step}=${n*step}。`)],extension:change('如果去掉第一个括号，结果是多少？',(n-1)*step,`去掉一个差 ${step}，剩 ${n-1} 段；新的起点是 ${start+step}。`)};
 });
 add('neighborProducts','A02',3,'两张乘积卡','分配与抵消','相邻因子的乘积差可化为小量',r=>{
  const n=12+r(35);
  return {prompt:`两张卡分别写着 ${n}×${n} 和 ${n-1}×${n+1}。第一张的结果比第二张大多少？`,answer:1,math:{n},methods:[method('比较增加和减少的部分',`把 ${n-1}×${n+1} 拆成 (${n-1})×${n}+(${n-1})。`,`它比 ${n}×${n} 少 ${n}、又多 ${n-1}，最终少 1。`),method('计算核对',`第一张是 ${n*n}，第二张是 ${(n-1)*(n+1)}。`,`相减为 1。分配比较解释了为何换数字仍有同样结果。`)],extension:change(`第二张改写为 ${n-2}×${n+2}，第一张比它大多少？`,4,'两边各改动 2，展开后中间项抵消，第二张比平方少 2×2=4。')};
 });
 add('fractionDifferentWholes','A03',1,'两盒糖果','确定整体','同样的分数对应不同整体，数量未必相等',r=>{
  const a=4*(3+r(12)),b=3*(3+r(12));
  return {prompt:`甲盒有 ${a} 颗糖，取出 1/4；乙盒有 ${b} 颗糖，取出 1/3。两盒一共取出多少颗？`,answer:a/4+b/3,math:{a,b},methods:[method('分别确定每个分数的整体',`甲的整体是 ${a}，取出 ${a/4}；乙的整体是 ${b}，取出 ${b/3}。`,`相加得 ${a/4+b/3}，不能把两个分数直接作用到同一个整体。`)],extension:change('两盒剩下的糖果一共多少颗？',3*a/4+2*b/3,`从总数 ${a+b} 减去刚才取出的数量；或分别算两个盒子剩下的部分。`)};
 });
 add('fractionSharedRemainder','A03',3,'箱中的球','整体变化的逆推','中途补回固定数量，不能只相乘两次保留比例',r=>{
  const unit=2+2*r(8),add=8*(1+r(5)),total=12*unit,left=5*unit+5*add/8;
  return {prompt:`一箱球先取出原来总数的1/3，再放回 ${add} 个，接着取出现有球的3/8，最后剩 ${left} 个。最初有多少个？`,answer:total,math:{unit,add},methods:[method('逆着还原每次变化',`最后是第三次开始的5/8，所以第三次开始有 ${left}×8÷5=${8*unit+add} 个。`,`减去中途放回的 ${add}，剩 ${8*unit}，这是原来的2/3；再乘3/2，得 ${total}。`),method('先统一最后的整体',`原量的2/3加 ${add} 是最后一次的整体，它的5/8等于 ${left}。`,`先由5/8求这个整体，再扣固定加入量，原来的2/3便确定为 ${8*unit}，原量 ${total}。这是部分与固定量共同限制，而非纯倍率。`)],extension:change('最后一次改为取出最初总数的3/8，其余不变，最后剩多少个？',7*unit/2+add,`这次两个分数都以最初总数为整体，剩原量的7/24，再加中途放回的 ${add} 个，得 ${7*unit/2+add}。`)};
 });
 add('discountOrder','A04',1,'两张优惠券','固定量与百分比','减固定金额与按现价百分比减价的顺序会影响结果',r=>{
  const price=100*(2+r(10)),p=[10,20,25][r(3)],q=[10,20,50][r(3)],final=price*(100-p)/100-q;
  return {prompt:`一件商品原价 ${price} 元，先减价 ${p}%，再减去 ${q} 元优惠券。最后价格是多少元？`,answer:final,math:{price,p,q},methods:[method('按两种优惠的实际基准计算',`第一次按原价减去 ${price*p/100} 元，剩 ${price*(100-p)/100}。`,`第二次是固定金额，再减 ${q} 元，最终 ${final} 元。`)],extension:change(`把顺序改为先减 ${q} 元，再减现价的 ${p}%，最后价格是多少？`,(price-q)*(100-p)/100,`新的百分比基准是 ${price-q}，乘 ${100-p}/100；优惠券也受到百分比影响，两种顺序不再同价。`)};
 });
 add('percentRestore','A04',2,'恢复原价','逆向百分比','回到原价时，下降的基准是已经上涨的价格',r=>{
  const p=[10,20,25,50,60,100][r(6)],answer=F(100*p,100+p);
  return {prompt:`商品先涨价 ${p}%。要按涨后的价格打折恢复原价，应降价百分之几？请填写百分号前的数。`,answer,math:{p},methods:[method('取原价 100 作比较',`原价若为 100，涨后 ${100+p}，需减少 ${p}。`,`降价比例是 ${p}/${100+p}，百分号前的数为 ${answer}。`),method('看需要保留的比例',`恢复原价要保留涨后价的 100/${100+p}。`,`其余部分须去掉，1−100/${100+p}=${p}/${100+p}，换成百分数得 ${answer}%。`)],extension:change(`若先降价 ${p===100?50:p}%，恢复原价应涨价百分之几？`,F(100*(p===100?50:p),100-(p===100?50:p)),`这次基准是降低后的 ${100-(p===100?50:p)} 份，增加的份额要除以这个新基准。`)};
 });
 add('squareBounds','A05',1,'平方之间','平方界限','利用相邻平方确定平方根的位置',r=>{
  const k=3+r(15),n=k*k+1+r(2*k);
  return {prompt:`哪个整数是 √${n} 左边最近的整数？即不超过 √${n} 的最大整数是多少？`,answer:k,math:{k,n},methods:[method('比较相邻的平方',`${k}²=${k*k}，${k+1}²=${(k+1)**2}。`,`因为 ${n} 在这两个平方之间，√${n} 在 ${k} 与 ${k+1} 之间，答案为 ${k}。`)],extension:change(`不小于 √${n} 的最小整数是多少？`,k+1,`这个数不是完全平方数，所以右边最近的整数是 ${k+1}。`)};
 });
 add('signedProduct','A05',3,'三张数字卡','正负分类与极值','最小乘积需要比较一负两正和三负两类',r=>{
  const k=2+r(9),cards=[-4*k,-3*k,-k,0,2*k,5*k],answer=-40*k**3;
  return {prompt:`数字卡 ${cards.join('、')}，任选三张不同的卡，乘积最小是多少？`,answer,math:{k},methods:[method('按负数的个数分类',`负乘积可能来自一负两正，或三个负数。前者最小为 ${-4*k}×${2*k}×${5*k}=${answer}。`,`三负乘积为 ${-12*k**3}，含 0 为 0，其他乘积为正，所以最小为 ${answer}。`),method('有限列举并比较',`三张组合只需列 20 组；先剔除非负乘积。`,`在剩下的负乘积中比较绝对值，最大的负绝对值为 ${40*k**3}，对应最小乘积 ${answer}。`)],extension:change('如果改为任选两张卡，乘积最小是多少？',-20*k*k,`一负一正才为负；绝对值最大的负卡 ${-4*k} 与正卡 ${5*k} 相乘。`)};
 });
 add('ratioTotal','R01',1,'两色积木','整体份数','合计人数或物品数对应比例的总份数',r=>{
  const a=1+r(4),b=a+1+r(4),u=3+r(12);
  return {prompt:`红积木与蓝积木之比为 ${a}:${b}，总共有 ${(a+b)*u} 块。红积木有多少块？`,answer:a*u,math:{a,b,u},methods:[method('把整体分成份',`总共 ${a+b} 份，每份 ${u} 块。`,`红积木 ${a} 份，共 ${a*u} 块。`)],extension:change(`如果只增加 ${b-a} 块红积木，红蓝数量之差是多少？`,(b-a)*(u-1),`原差 ${(b-a)*u}，只增加红色会把差缩小 ${b-a}，剩 ${(b-a)*(u-1)}。`)};
 });
 add('linkedRatios','R01',2,'三色积木','统一共同份额','两个比通过同一种物品衔接',r=>{
  const a=1+r(4),b=2+r(4),c=2+r(4),d=1+r(4),u=2+r(7),red=a*c*u,blue=b*c*u,green=b*d*u;
  return {prompt:`红与蓝积木之比 ${a}:${b}，蓝与绿之比 ${c}:${d}。绿积木有 ${green} 块。三色一共有多少块？`,answer:red+blue+green,math:{a,b,c,d,u},methods:[method('把两个比中的蓝色统一',`把第一个比乘 ${c}，第二个比乘 ${b}，得到红:蓝:绿=${a*c}:${b*c}:${b*d}。`,`绿 ${b*d} 份是 ${green}，一份 ${u}，合计 ${red+blue+green}。`),method('从绿依次反求',`由蓝:绿=${c}:${d} 得蓝 ${blue}；再由红:蓝=${a}:${b} 得红 ${red}。`,`三色相加 ${red}+${blue}+${green}=${red+blue+green}。`)],extension:change('只增加蓝积木，使蓝与绿一样多，需要增加多少块？若蓝已经更多，则填写需要取走的块数。',Math.abs(green-blue),`红蓝与蓝绿两个比都会改变，但绿不变；比较原蓝 ${blue} 与绿 ${green} 的差。`)};
 });
 add('unitConversion','R02',1,'配制饮料','单位统一','相同量先用相同单位表达',r=>{
  const liters=2+r(8),cup=[100,125,250][r(3)];
  return {prompt:`有 ${liters} 升饮料，每杯装 ${cup} 毫升，1 升=1000 毫升。能装满多少杯？`,answer:liters*1000/cup,math:{liters,cup},methods:[method('把总量换成毫升',`${liters} 升是 ${liters*1000} 毫升。`,`每杯 ${cup} 毫升，相除得到 ${liters*1000/cup} 杯。`)],extension:change('杯子的容量改为原来两倍，能装满多少杯？',liters*500/cup,'总量不变、每杯容量加倍，杯数减半。')};
 });
 add('mixedPacks','R02',3,'两种包装','单位价格与整包约束','单价最低未必能组成恰好的购买量',r=>{
  const p=5+r(5),q=p+1+r(4),count=10+2*r(15),legal=[];for(let a=0;a*4<=count;a++)for(let b=0;4*a+6*b<=count;b++)if(4*a+6*b===count)legal.push({a,b,cost:a*p+b*q});const best=Math.min(...legal.map(x=>x.cost));
  return {prompt:`笔只有4支装和6支装，分别 ${p} 元、${q} 元。必须恰好买 ${count} 支，不能拆包。最少花多少元？`,answer:best,math:{p,q,count},methods:[method('列出能恰好组成总数的包装',`合法方案（4支包,6支包）：${legal.map(x=>`(${x.a},${x.b})`).join('、')}。`,`对应费用 ${legal.map(x=>x.cost).join('、')}，最小 ${best}。最低单价的包不一定能单独凑齐。`)],extension:change('如果允许买超过需要的数量，最少花多少元？',(()=>{let v=Infinity;for(let a=0;a<=Math.ceil(count/4);a++)for(let b=0;b<=Math.ceil(count/6);b++)if(4*a+6*b>=count)v=Math.min(v,a*p+b*q);return v})(),'把数量条件由等于改为至少，重新比较边界附近的整包方案。')};
 });
 add('jointWork','R03',1,'一起完成','单位时间工作量','合作时合并的是每分钟完成的量',r=>{
  const a=3+r(7),b=2+r(8),t=3+r(8),total=(a+b)*t;
  return {prompt:`甲每分钟装 ${a} 个盒子，乙每分钟装 ${b} 个。两人一起装 ${total} 个盒子，不停顿，需要几分钟？`,answer:t,math:{a,b,t},methods:[method('先求合作的每分钟工作量',`每分钟共同完成 ${a+b} 个。`,`总量 ${total} 除以 ${a+b}，需要 ${t} 分钟。`)],extension:change('如果只有甲完成同样的总量，需要多少分钟？',F(total,a),`只有甲的速率 ${a}，总量不变，时间为 ${total}/${a}。`)};
 });
 add('riverTravel','R03',2,'顺流与逆流','分解速度','同一水流对两个方向的速度作用相反',r=>{
  const v=6+r(10),c=1+r(v-2),distance=(v*v-c*c)*2;
  return {prompt:`船在静水中速度 ${v} 千米/时，水流 ${c} 千米/时。船沿河顺流 ${distance} 千米，再原路逆流返回，不停顿。整个行程多少小时？`,answer:4*v,math:{v,c,distance},methods:[method('分别计算两个方向',`顺流速度 ${v+c}，逆流速度 ${v-c}。`,`时间分别 ${distance/(v+c)} 与 ${distance/(v-c)} 小时，相加 ${4*v}。`),method('统一两个分母',`总时间 ${distance}/(${v+c})+${distance}/(${v-c})。`,`合并为 ${distance}×${2*v}/${v*v-c*c}=${4*v}。这个式子解释水流造成的往返时间变化。`)],extension:change('如果没有水流，同样的往返需要多少小时？',F(2*distance,v),`两个方向都是静水速度 ${v}，总路程 ${2*distance} 除以它。`)};
 });
 add('mapScale','R04',1,'两张地图','长度缩放','同一实际距离在不同缩放图中作比较',r=>{
  const k=2+r(7),a=3+r(12);
  return {prompt:`同一条路在甲地图长 ${a} 厘米。乙地图上所有长度都是甲地图的 ${k} 倍。这条路在乙地图长多少厘米？`,answer:a*k,math:{k,a},methods:[method('对应长度一起缩放',`每段长度都乘 ${k}。`,`同一条路的长度 ${a}×${k}=${a*k} 厘米。`)],extension:change('把乙地图再缩成其长度的 1/2，这条路是多少厘米？',F(a*k,2),'两次长度倍率相乘，第二次的整体是乙地图。')};
 });
 add('scaleAreaReverse','R04',2,'复印图形','平方倍率与逆推','两次缩放的面积变化可反求长度倍率',r=>{
  const k=2+r(5),s=2+r(4),old=s*s*(2+r(10)),final=old*k*k/(s*s);
  return {prompt:`一幅图先把所有长度放大为 ${k} 倍，再把所有长度缩为当前的 1/${s}。最后面积是 ${final}。原来的面积是多少？`,answer:old,math:{k,s,old},methods:[method('合并长度倍率',`最终长度是原来的 ${k}/${s}，面积倍率为 ${k*k}/${s*s}。`,`把最后面积除以这个倍率，得 ${old}。`),method('逐次倒推面积',`最后一次长度缩为 1/${s}，面积缩为 1/${s*s}，先把面积乘 ${s*s}。`,`第一次长度放大 ${k} 倍，面积放大 ${k*k} 倍，再除以 ${k*k}，得到 ${old}。`)],extension:change('若只完成第一次放大，面积是多少？',old*k*k,`第一次的面积倍率是 ${k*k}，原面积乘它。`)};
 });
 add('ageDifference','L01',2,'几年前','不变的差','年龄一起增长，年龄差保持不变',r=>{
  const past=5+r(11),ago=1+r(past-1),child=past+ago,parent=3*past+ago;
  return {prompt:`现在大人的年龄比孩子大 ${parent-child} 岁。${ago} 年前，大人的年龄是孩子的 3 倍。孩子现在几岁？`,answer:child,math:{child,ago,parent},methods:[method('先求当时的一份年龄',`年龄差不变。那时大人比孩子多 2 份，孩子当时为 ${parent-child}÷2=${(parent-child)/2}。`,`再加回 ${ago} 年，得到 ${child}。`)],extension:change('再过多少年，大人的年龄是孩子的 2 倍？',parent-2*child,`年龄差保持 ${parent-child}。成为 2 倍时孩子年龄等于这个差，减现在年龄。`)};
 });
 add('repeatedMachine','L01',2,'机器的输出','连续等量逆推','同一规则连续使用，未知量出现在嵌套关系中',r=>{
  const x=3+r(15),a=2+r(4),b=1+r(8),final=a*(a*x+b)+b;
  return {prompt:`机器每次把输入乘 ${a}，再加 ${b}。一个数连续通过机器两次后得到 ${final}。最初输入是多少？`,answer:x,math:{x,a,b},methods:[method('按相反次序还原',`最后一步先减 ${b} 再除以 ${a}，得到第一次输出 ${a*x+b}。`,`再减 ${b}、除以 ${a}，还原为 ${x}。`),method('写出两次的等量关系',`两次后等于 ${a*a} 倍原数加 ${a*b+b}。`,`所以原数 (${final}−${a*b+b})÷${a*a}=${x}。`)],extension:change('把每次规则改为先加同样的数、再乘同样的数；原输入通过两次后是多少？',a*(a*(x+b)+b),`改变顺序后，每次加上的 ${b} 也会被乘；按新规则逐次计算。`)};
 });
 add('twoCoins','L02',1,'一袋硬币','人数与差额','总枚数与总金额共同限制两类物品',r=>{
  const n=6+r(15),twos=1+r(n-1),total=n+twos;
  return {prompt:`一袋有 ${n} 枚硬币，只有1元和2元，共 ${total} 元。2元硬币有几枚？`,answer:twos,math:{n,twos},methods:[method('先把每枚当成1元',`每枚先算1元，共 ${n} 元，实际多 ${twos} 元。`,`每枚2元会多出1元，所以有 ${twos} 枚。`)],extension:change('如果取走一枚1元和一枚2元，剩下的总金额是多少？',total-3,'每类各取走一枚，金额减少3元，而不是只减少2元。')};
 });
 add('stampConstraint','L02',3,'邮票方案','整数解与约束','精确总价与每种至少一张限制可行方案',r=>{
  const total=17+r(32),legal=[];for(let a=1;3*a<total;a++)for(let b=1;3*a+5*b<=total;b++)if(3*a+5*b===total)legal.push([a,b]);
  return {prompt:`用3元和5元邮票凑恰好 ${total} 元，两种各至少一张。有多少种不同的张数方案？`,answer:legal.length,math:{total},methods:[method('固定一种邮票逐一检查',`5元邮票可从1张开始，每种数量都检查剩余金额能否分成正整数张3元邮票。`,`合法方案（3元张数,5元张数）为 ${legal.map(v=>v.join(',')).join('；')||'没有'}，共 ${legal.length} 种。`)],extension:change('如果允许某一种邮票完全不用，共有多少种方案？',(()=>{let n=0;for(let a=0;3*a<=total;a++)for(let b=0;3*a+5*b<=total;b++)if(3*a+5*b===total)n++;return n})(),'增加的方案只能来自全用3元或全用5元，需要分别检查整除，不是总能加2。')};
 });
 add('recurrenceForward','L03',1,'下一项','明确递推规则','按给定规则推进，而非猜测有限数列',r=>{
  const a=1+r(8),b=2+r(9),n=4+r(4),seq=[a,b];while(seq.length<n)seq.push(seq.at(-1)+seq.at(-2));
  return {prompt:`数列前两项是 ${a}、${b}，从第三项起，每项等于前两项之和。第 ${n} 项是多少？`,answer:seq[n-1],math:{a,b,n},methods:[method('按规则逐项推进',`依次得到 ${seq.join('、')}。`,`第 ${n} 项是 ${seq[n-1]}，每步都只取紧邻的前两项。`)],extension:change('把前两项交换，规则不变，同一个项号的数是多少？',(()=>{const x=[b,a];while(x.length<n)x.push(x.at(-1)+x.at(-2));return x[n-1]})(),'交换初始条件后要重新推进，不能只把最后答案的数字交换。')};
 });
 add('recurrenceTotal','L03',3,'前几项的和','相邻差与总和','递推关系可变成差，累计时中间项抵消',r=>{
  const a=1+r(5),b=1+r(6),n=5+r(6),seq=[a,b];while(seq.length<n+2)seq.push(seq.at(-1)+seq.at(-2));const sum=seq.slice(0,n).reduce((x,y)=>x+y,0);
  return {prompt:`数列前两项为 ${a}、${b}，从第三项起每项等于前两项之和。前 ${n} 项的和是多少？`,answer:sum,math:{a,b,n},methods:[method('列出并累加',`前 ${n} 项为 ${seq.slice(0,n).join('、')}。`,`相加得到 ${sum}。`),method('把每项改写为相邻两项的差',`第 j 项=第 j+2 项−第 j+1 项。相加时中间项抵消。`,`所以前 ${n} 项的和=第 ${n+2} 项−第2项=${seq[n+1]}−${b}=${sum}。`)],extension:change(`只加第2项到第${n}项，和是多少？`,sum-a,`原累计区间去掉第一项 ${a}。也可从差式的起点重新计算。`)};
 });
 add('machineMeeting','L04',2,'相同的输出','表格差与交点','两种线性规则的差每步固定改变',r=>{
  const x=3+r(15),a=2+r(4),b=1+r(4),c=a+1+r(4),d=(c-a)*x+b;
  return {prompt:`甲机器输出 ${a}×输入+${d}，乙机器输出 ${c}×输入+${b}。输入同一个数时，两台输出相等。这个输入是多少？`,answer:x,math:{x,a,b,c,d},methods:[method('看输出差如何消失',`输入0时甲比乙多 ${d-b}，输入每增加1，乙会多追上 ${c-a}。`,`需要 ${d-b}÷${c-a}=${x} 步，输入为 ${x}。`),method('写出相等的输出',`${a}t+${d}=${c}t+${b}。`,`把共同量移开，(${c-a})t=${d-b}，得 t=${x}。`)],extension:change('如果只给甲的输出再加 1，相等输出时的输入是多少？',F(d-b+1,c-a),`开始差增加1，但每步追赶量不变，新输入为 (${d-b}+1)/${c-a}。`)};
 });
 add('machineOrder','L04',3,'两台机器','函数复合次序','不同机器交换顺序时差可能与输入无关',r=>{
  const a=2+r(5),b=1+r(7),c=2+r(4),d=1+r(8),x=3+r(12),ab=c*(a*x+b)+d,ba=a*(c*x+d)+b;
  return {prompt:`甲把输入乘 ${a} 再加 ${b}，乙把输入乘 ${c} 再加 ${d}。输入 ${x}，先甲后乙与先乙后甲的最终结果相差多少？`,answer:Math.abs(ab-ba),math:{a,b,c,d,x},methods:[method('沿两条路径逐次算',`先甲后乙为 ${ab}，先乙后甲为 ${ba}。`,`相差 ${Math.abs(ab-ba)}。`),method('消去共同的输入部分',`两种结果中，原输入都乘 ${a*c}，这部分相同。`,`只需比较额外部分 ${c*b+d} 与 ${a*d+b}，差仍为 ${Math.abs(ab-ba)}。`)],extension:change('原输入改为原来两倍，两种顺序的结果相差多少？',Math.abs(ab-ba),'输入共同部分一起改变，差只来自加数被乘的不同方式，所以不变。')};
 });
 add('digitDivisor','N01',1,'两位数的个位','整除与数位','按非零个位分类检查整除',r=>{
  const tens=1+r(8),legal=[];for(let d=1;d<=9;d++)if((10*tens+d)%d===0)legal.push(10*tens+d);
  return {prompt:`十位是 ${tens} 的两位数中，有多少个能被自己的非零个位数字整除？`,answer:legal.length,math:{tens},methods:[method('逐个个位检验',`个位从1到9检查，符合的数为 ${legal.join('、')}。`,`共 ${legal.length} 个。个位0不能当作除数。`),method('只检查十位部分',`数为 ${10*tens}+d，d 本来就能被自身整除。`,`只需找能整除 ${10*tens} 的1到9，各对应一个数，仍有 ${legal.length} 个。`)],extension:change('允许个位为0，并把它也当作一个符合的数，规则是否有意义？有意义填1，没有意义填0。',0,'除以0没有定义，不能通过放宽个位条件把这种数加入整除计数。')};
 });
 add('divisibleEleven','N01',3,'四位数字','交错数位与整除','同时控制末位和交错数字和',r=>{
  const a=1+r(8),c=1+r(9),legal=[];for(let b=0;b<=9;b++)for(const d of [0,5]){const n=1000*a+100*b+10*c+d;if(n%11===0)legal.push(n)}
  return {prompt:`四位数 ${a}□${c}□ 能同时被11和5整除。这样的数中最大的是多少？`,answer:Math.max(...legal),math:{a,c},methods:[method('限制末位并检查11的规则',`末位为0或5；千位与十位和减去百位与个位和，要为11的倍数。`,`合法数 ${legal.join('、')}，最大 ${Math.max(...legal)}。`),method('检查有限候选',`百位有10种、末位有2种，共20个候选。`,`从大的候选开始做实际除法，第一个被11整除的是 ${Math.max(...legal)}。`)],extension:change('这样的四位数一共有几个？',legal.length,`检查两种末位和全部百位；本题符合的为 ${legal.join('、')}。`)};
 });
 add('threeDivisors','N02',1,'三个因数','因数配对','恰有三个因数意味着是质数的平方',r=>{
  const limit=20+5*r(17),values=[];for(let n=1;n<=limit;n++){let count=0;for(let d=1;d<=n;d++)if(n%d===0)count++;if(count===3)values.push(n)}
  return {prompt:`从1到 ${limit} 的正整数中，恰好有三个正因数的数有几个？`,answer:values.length,math:{limit},methods:[method('利用因数配对',`恰有三个因数时，除了1和自己，还只有一个平方根因数，而且平方根必须为质数。`,`若平方根是合数，还会有额外的因数对。因此只检查质数的平方，符合的是 ${values.join('、')}，共 ${values.length} 个。`),method('按因数个数核查',`对每个候选列正因数，例如4的因数为1、2、4。`,`完整检查1到 ${limit}，恰好三个的仍为 ${values.join('、')}。`)],extension:change('这些符合的数中最大的一个是多少？',Math.max(...values),`从刚才的质数平方列表取最大值；不是取不超过上限的任意平方。`)};
 });
 add('divisorPowers','N02',2,'因数的选择','指数配对计数','每个质因数的指数可独立选取，平方因数另有限制',r=>{
  const a=2+r(5),b=2+r(4),n=2**a*3**b;
  return {prompt:`整数 ${n}=2的${a}次方×3的${b}次方，有多少个正因数？`,answer:(a+1)*(b+1),math:{a,b},methods:[method('按2和3的指数列出所有因数',`因数中2的指数可选0到 ${a}，3的指数可选0到 ${b}。`,`每种指数对产生唯一因数，共 (${a}+1)×(${b}+1)=${(a+1)*(b+1)}。`),method('按3的指数分组',`先固定3的指数，每组包含 ${a+1} 个不同的2次幂倍数。`,`有 ${b+1} 组，互不重复，总数 ${((a+1)*(b+1))}。`)],extension:change('其中是完全平方数的正因数有几个？',(Math.floor(a/2)+1)*(Math.floor(b/2)+1),'平方因数要求两个质因数的指数都是偶数，分别列出可选的偶数指数再配对。')};
 });
 add('equalBags','N03',1,'相同的礼袋','最大共同分组','每种物品的数量都要被礼袋数整除',r=>{
  const k=2+r(10),a=k*(2+r(5)),b=k*(3+r(5)),bags=gcd(a,b);
  return {prompt:`${a} 颗红糖和 ${b} 颗蓝糖装进尽量多的相同礼袋，每袋两种数量分别相同，全部用完。最多几袋？`,answer:bags,math:{a,b},methods:[method('找两种数量的共同因数',`袋数必须同时整除 ${a} 与 ${b}。`,`最大的共同因数为 ${bags}，每袋分别 ${a/bags}、${b/bags} 颗。`)],extension:change('如果不要求袋数最多，所有可能的袋数有几种？',(()=>{let n=0;for(let d=1;d<=bags;d++)if(bags%d===0)n++;return n})(),'可选袋数就是最大公因数的正因数，不是从1到它的每个数都可行。')};
 });
 add('offsetBells','N03',3,'错开的铃声','共同周期与偏移','先找实际重合起点，再使用共同周期',r=>{
  const a=3+r(8),b=4+r(9),target=a*(2+r(6)),offset=target%b,period=a*b/gcd(a,b);let first=a;while((first-offset)%b)first+=a;
  return {prompt:`甲铃在第0分钟响，以后每 ${a} 分钟响；乙铃第一次在第 ${offset} 分钟响，以后每 ${b} 分钟响。第0分钟之后第一次同时响是在第几分钟？`,answer:first,math:{a,b,offset},methods:[method('列实际时刻找第一个重合',`甲的正时刻为 ${a}、${2*a}、${3*a}……，乙从 ${offset} 起每次加 ${b}。`,`第一次正重合为 ${first}；不能直接把最小公倍数当作这个起点。`)],extension:change('再下一次同时响是第几分钟？',first+period,`相邻两次共同响相差最小公倍数 ${period}，加到实际起点 ${first} 上。`)};
 });
 add('cyclicPosition','N04',1,'环形座位','循环与起点','完整圈不改变位置，余步从真实起点计算',r=>{
  const size=5+r(8),start=1+r(size),steps=10+r(80),answer=(start-1+steps)%size+1;
  return {prompt:`${size} 个座位按顺时针编号1到 ${size}。从 ${start} 号座位开始，每一步走到下一个座位，共走 ${steps} 步，停在哪个号？`,answer,math:{size,start,steps},methods:[method('去掉完整圈',`每 ${size} 步一圈，剩 ${steps%size} 步。`,`从 ${start} 号实际前进这些步，落在 ${answer}。起点不算已经走了一步。`)],extension:change('如果改成逆时针走同样多步，停在哪个号？',((start-1-steps)%size+size)%size+1,'余步数量相同，但方向相反，必须从同一个起点向后走。')};
 });
 add('repeatedOnes','N04',3,'一串1','余数状态循环','添一位引起的余数更新而不是直接处理大数',r=>{
  const n=8+r(60),remainders=[];let v=0;for(let i=0;i<n+1;i++){v=(10*v+1)%7;remainders.push(v)}
  return {prompt:`由 ${n} 个数字1组成的整数，除以7的余数是多少？`,answer:remainders[n-1],math:{n},methods:[method('逐次添位只保留余数',`添一个1后的余数为“原余数×10+1”再除以7取余。`,`前6个余数为1、4、6、5、2、0，之后重复；第 ${n} 个对应 ${remainders[n-1]}。`),method('每6个1成一个整块',`111111能被7整除，后面每添6位时，原块乘10的6次方仍被7整除。`,`完整6位块可以去掉，只需检查尾部 ${n%6} 个1（0个时余数0），得 ${remainders[n-1]}。`)],extension:change('末尾再添一个1，余数是多少？',remainders[n],`使用当前余数×10+1，再对7取余，得到 ${remainders[n]}。`)};
 });
 add('rectangleDiagonalArea','G01',1,'对角线两侧','等底等高','对角线把长方形分成等面积两部分',r=>{
  const w=4+2*r(12),h=3+r(14);
  return {prompt:`一个长方形长 ${w}、宽 ${h}，画一条对角线。对角线一侧的三角形面积是多少？`,answer:w*h/2,math:{w,h},diagram:{kind:'rectangleDiagonal',w,h},methods:[method('比较两边的三角形',`两边都用长方形的长和宽作直角边，面积相等。`,`所以每边占长方形面积一半，${w}×${h}÷2=${w*h/2}。`)],extension:change('只把长增加一半，宽不变，对角线一侧的面积是多少？',3*w*h/4,'总面积随长乘3/2，三角形仍占新长方形的一半。')};
 });
 add('boundaryNotch','G01',3,'凹进去的边','边界替换','凹口横向边抵消，新增的是两条深度边',r=>{
  const w=12+r(15),h=8+r(13),a=2+r(w-4),depth=1+r(h-2);
  return {prompt:`长 ${w}、宽 ${h} 的长方形，在一条长边的中间挖去宽 ${a}、深 ${depth} 的长方形凹口，不碰两个角。新图形的周长是多少？`,answer:2*(w+h)+2*depth,math:{w,h,a,depth},diagram:{kind:'notch',w,h,a,depth},methods:[method('比较被替换的边界',`原来长度 ${a} 的一段消失，凹口底边同样长 ${a}，互相抵消。`,`只新增两条深 ${depth} 的边，周长为 ${2*(w+h)}+${2*depth}=${2*(w+h)+2*depth}。`),method('沿新轮廓逐段数',`水平边合计仍为 ${2*w}，竖直边合计 ${2*h+2*depth}。`,`相加 ${2*w}+${2*h+2*depth}=${2*(w+h)+2*depth}。`)],extension:change('同样大小的缺口如果改在角上，新周长是多少？',2*(w+h),'角缺口去掉两条边、补回相同长度的两条边，周长不变。')};
 });
 add('angleMarks','G02',1,'圆周上的射线','角的等分','同一圆周的等间隔方向对应等角',r=>{
  const marks=[8,10,12,15,18][r(5)],step=1+r(Math.floor(marks/2)),angle=360*step/marks;
  return {prompt:`从圆心画出 ${marks} 条等间隔射线。两条射线沿较短方向相隔 ${step} 段等角，它们之间的角是多少度？`,answer:angle,math:{marks,step},methods:[method('先求一个等角',`一整圈360°，每段 ${360/marks}°。`,`相隔 ${step} 段，总角 ${angle}°。`)],extension:change('沿另一个方向围出的角是多少度？',360-angle,'两个方向围出的角合成360°，用整圈减去刚才的角。')};
 });
 add('polygonTurn','G02',2,'绕多边形走','外角与内角','走一圈的转角总和固定，求的不是内角总和',r=>{
  const n=[5,6,8,9,10,12,15,18][r(8)];
  return {prompt:`沿正 ${n} 边形边界走一圈，每个顶点向同一侧转相同的角。每次转向的角是多少度？`,answer:360/n,math:{n},methods:[method('看回到原方向的总转角',`绕一圈总转向360°，有 ${n} 次相同转角。`,`所以每次 ${360/n}°。`),method('从内角求相邻外角',`每个内角为 (${n}−2)×180÷${n}=${180-360/n}°。`,`转角与内角互补，180−${180-360/n}=${360/n}°。`)],extension:change('如果只走到经过一半数量的顶点，累计转了多少度？顶点数为奇数时，经过 (n−1)/2 个。',Math.floor(n/2)*360/n,'累计转角是每次转角乘实际经过顶点数，不是直接取180°。')};
 });
 add('lShapeArea','G03',1,'L形纸片','补形与分块','同一面积可以用大块减缺口或互不重叠块合成',r=>{
  const w=8+r(13),h=7+r(12),a=2+r(w-3),b=2+r(h-3),answer=w*h-a*b;
  return {prompt:`长 ${w}、宽 ${h} 的长方形纸片，从右上角剪去长 ${a}、宽 ${b} 的长方形。剩下的L形面积是多少？`,answer,math:{w,h,a,b},diagram:{kind:'lShape',w,h,a,b},methods:[method('补回完整长方形',`原面积 ${w*h}，剪去面积 ${a*b}。`,`相减得 ${answer}。`),method('分成不重叠的两块',`下面一块面积 ${w*(h-b)}，左上块面积 ${(w-a)*b}。`,`合计 ${answer}，两块没有重叠。`)],extension:change('改在长方形内部挖去同样大的洞，剩下的面积是多少？',answer,'挖去的位置影响轮廓，但没有改变被挖面积，剩下的面积相同。')};
 });
 add('crossArea','G03',2,'交叉的纸条','重叠扣除','横竖纸条重叠的部分被数两次',r=>{
  const w=10+r(15),h=8+r(14),a=1+r(w-2),b=1+r(h-2),answer=a*h+b*w-a*b;
  return {prompt:`长 ${w}、宽 ${h} 的长方形内，有一条贯穿上下、宽 ${a} 的竖纸条，和一条贯穿左右、宽 ${b} 的横纸条。两条覆盖的面积是多少？交叉处只算一次。`,answer,math:{w,h,a,b},diagram:{kind:'cross',w,h,a,b},methods:[method('合并两条再减交叉',`竖条 ${a*h}，横条 ${b*w}，交叉 ${a*b} 被重复一次。`,`覆盖 ${a*h}+${b*w}−${a*b}=${answer}。`),method('先数没有被覆盖的角块',`未覆盖角块合计可拼成边长 ${w-a}、${h-b} 的长方形，面积 ${(w-a)*(h-b)}。`,`用整张面积 ${w*h} 减去它，得到 ${answer}。`)],extension:change('只在交叉处涂色，其面积是多少？',a*b,`交叉的两边长为 ${a} 与 ${b}，只需计算这块面积。`)};
 });
 add('semicircleBoundary','G04',2,'半圆纸片','弧与直边','半圆边界含半个圆周和一条直径',r=>{
  const radius=2+r(20),circumference=6*radius;
  return {prompt:`一个圆的半径 ${radius}。沿直径剪成两个半圆，取其中一块。计算时取 π=3，这块半圆的周长近似是多少？`,answer:5*radius,math:{radius,circumference},diagram:{kind:'semicircle',radius},methods:[method('沿完整边界计算',`弧长是圆周的一半 ${3*radius}，还要加直径 ${2*radius}。`,`合计 ${5*radius}。这里按题目指定的 π=3 计算近似值。`)],extension:change('把两个半圆沿直径重新拼成原圆，仍取 π=3，外周长近似是多少？',circumference,'两条直径接触后成为内部边，不再计入外周长。')};
 });
 add('circleRingRatio','G04',2,'圆环','面积平方比','圆的长度比要平方后才成为面积比',r=>{
  const r1=2+r(5),r2=r1+1+r(5),answer=F(r2*r2-r1*r1,r2*r2);
  return {prompt:`两个同心圆半径分别 ${r1} 与 ${r2}。圆环面积占大圆面积的几分之几？`,answer,math:{r1,r2},diagram:{kind:'ring',r1,r2},methods:[method('两圆面积作差再比较',`两圆面积为 ${r1*r1}π 与 ${r2*r2}π，圆环为 ${r2*r2-r1*r1}π。`,`除以大圆面积，π消去，得到 ${answer}。`),method('先看小圆所占比例',`小圆占大圆面积 ${F(r1*r1,r2*r2)}。`,`其余就是圆环，用1减去它得 ${answer}。`)],extension:change('两圆半径都加倍，圆环占大圆的比例是多少？',answer,'每个面积都乘4，比例不变；只把圆环面积乘2会混淆长度与面积。')};
 });
 add('shadowSimilarity','G05',1,'同一时刻的影子','对应长度比','同角相似形的对应长度保持同一倍率',r=>{
  const unit=2+r(10),a=2+r(5),b=a+1+r(8);
  return {prompt:`同一时刻，竖直小杆高 ${a}，影长 ${2*a}。旁边竖直大杆的影长 ${2*b*unit}，阳光方向相同。大杆高多少？`,answer:b*unit,math:{a,b,unit},methods:[method('利用两组相似直角三角形',`小杆高与影长为1:2，太阳方向相同使两组对应比例相同。`,`大杆高度是影长的一半，为 ${b*unit}。`)],extension:change('若大杆高度不变，换时刻影长变为刚才的一半，小杆同一时刻的影长是多少？',a,'光照角变化使所有杆的影长同倍率减半，小杆原影长也减半。')};
 });
 add('parallelTriangle','G05',3,'三角形中的线段','相似面积与剩余','对应长度比例控制整个相似区域的面积',r=>{
  const n=3+r(7),k=1+r(n-1),area=n*n*(2+r(8));
  return {prompt:`三角形内画一条与底边平行的线段，截出顶端小三角形。小三角形的边长是原来对应边的 ${k}/${n}。原面积 ${area}，下方梯形的面积是多少？`,answer:area*(n*n-k*k)/(n*n),math:{n,k,area},diagram:{kind:'parallelTriangle',n,k},methods:[method('先求小三角形再扣除',`小三角形面积为原来的 ${k*k}/${n*n}，面积 ${area*k*k/(n*n)}。`,`原面积减去它，下方面积 ${area*(n*n-k*k)/(n*n)}。`),method('先求下方占比',`上方占 ${k*k}/${n*n}，下方占 ${n*n-k*k}/${n*n}。`,`这个比例乘原面积，得到同一结果。`)],extension:change('若线段改为对应边长度的一半，下方梯形占原面积的几分之几？','3/4','上方相似三角形占1/4，下方占3/4；不能把边长的一半直接当面积的一半。')};
 });
 add('coordinateHorizontal','G06',1,'两个点','直角坐标差','同一水平线上的直线距离只需横坐标差',r=>{
  const a=-10+r(10),b=1+r(20),y=2+r(8);
  return {prompt:`A=(${a},${y})，B=(${b},${y})。两点之间的直线距离是多少？`,answer:b-a,math:{a,b,y},methods:[method('沿同一水平线比较坐标',`两点纵坐标一样，不需要斜向距离公式。`,`横向跨过 ${b}−(${a})=${b-a} 个单位。`)],extension:change('若只把两点横坐标都增加5，距离是多少？',b-a,'整段平移，两个坐标的差保持不变。')};
 });
 add('hypotenuseMidpoint','G06',3,'斜边中点','补矩形与距离','斜边中点到直角顶点的距离等于斜边一半',r=>{
  const k=2+2*r(15);
  return {prompt:`直角三角形两条直角边为 ${3*k} 与 ${4*k}。M是斜边中点，M到直角顶点的距离是多少？`,answer:5*k/2,math:{k},diagram:{kind:'hypotenuseMidpoint',k},methods:[method('把中点位置放进坐标',`取直角顶点为(0,0)，斜边两端为(${3*k},0)、(0,${4*k})。中点为(${3*k/2},${2*k})。`,`勾股得距离 ${5*k/2}。`),method('补成矩形看中心',`补成边长 ${3*k}、${4*k} 的矩形，M是两条对角线的交点。`,`矩形对角线相等且互相平分，每半条长 ${5*k/2}，就是所求距离。`)],extension:change('若M改为一条长度为较长直角边的边的中点，到直角顶点的距离是多少？',2*k,'这时沿边直接取一半，不能仍把斜边的一半作为答案。')};
 });
 add('cubeSteps','G07',1,'台阶积木','空间分层','空间形状可以按列或按层无遗漏地计数',r=>{
  const n=4+r(12),answer=n*(n+1)/2;
  return {prompt:`用小正方体搭一排台阶，第1列高1块，第2列高2块，依次到第 ${n} 列高 ${n} 块，每列只有1块宽。总共用了多少小正方体？`,answer,math:{n},methods:[method('按列相加',`列高为1到 ${n}，首尾配对得到总数 ${answer}。`,`每块只属于一列，没有重复。`),method('按水平层数',`最底层有 ${n} 块，上一层 ${n-1} 块，直到顶层1块。`,`各层相加同样得 ${answer}；这是从空间形状的另一方向数。`)],extension:change('如果每列前后厚度都变成2块，总共用了多少块？',2*answer,'每层每列都向后多一块，整个数量加倍，而不是只把最高列加倍。')};
 });
 add('openBox','G07',3,'无盖盒子','展开图与有限优化','折叠决定三个维度，最大体积需要比较整数切角',r=>{
  const side=8+2*r(9),values=[];for(let x=1;2*x<side;x++)values.push({x,v:x*(side-2*x)**2});const max=Math.max(...values.map(v=>v.v));
  return {prompt:`边长 ${side} 的正方形纸，从四角各剪去边长x的小正方形，折成无盖盒子。x为正整数，底边长度必须为正。盒子最大体积是多少？`,answer:max,math:{side},methods:[method('先从展开图确定尺寸',`剪角后高为x，底边为 ${side}−2x。合法x为1到 ${(side-2)/2}。`,`分别比较体积 x×(${side}−2x)²：${values.map(v=>v.v).join('、')}，最大 ${max}。`)],extension:change('如果固定剪角边长为1，盒子底面积是多少？',(side-2)**2,'现在问底面积，不是体积；底的两边都因两个角而各减少2。')};
 });
 add('setOutside','C01',1,'兴趣小组','整体与并集','组外与至少一组把整体分成两块',r=>{
  const a=7+r(10),b=8+r(10),both=1+r(Math.min(a,b)-1),outside=2+r(10),total=a+b-both+outside;
  return {prompt:`共有 ${total} 人，${a} 人参加棋组，${b} 人参加球组，${both} 人两组都参加。两个组都没参加的有多少人？`,answer:outside,math:{a,b,both,total},methods:[method('先求至少参加一组的',`两组合计 ${a}+${b}−${both}=${total-outside} 人。`,`组外 ${total}−${total-outside}=${outside}。`)],extension:change('若每个组各增加一人，而且是同一个原来组外的人，两个组都没参加的还有多少人？',outside-1,'组员计数增加两次，但不同的人只增加一个，组外只减少一个。')};
 });
 add('threeSetExactlyTwo','C01',3,'三个小组','交集的重复次数','三组都参加的人在三个两两交集中被数三次',r=>{
  const ab=2+r(8),ac=2+r(8),bc=2+r(8),triple=1+r(Math.min(ab,ac,bc)),answer=ab+ac+bc-3*triple;
  return {prompt:`参加甲乙两组的 ${ab} 人、甲丙两组的 ${ac} 人、乙丙两组的 ${bc} 人，这些数都包括三组全参加的人。三组全参加有 ${triple} 人。恰好参加两组的有多少人？`,answer,math:{ab,ac,bc,triple},methods:[method('把三组都参加的人从每对中去掉',`只甲乙 ${ab-triple}、只甲丙 ${ac-triple}、只乙丙 ${bc-triple}。`,`三块不重叠，相加 ${answer}。`),method('先识别被数的次数',`三个两两交集相加时，恰好两组的人数一次，三组的人数三次。`,`要去掉三组的全部贡献，减3×${triple}，得 ${answer}。`)],extension:change('至少参加两组的有多少人？',answer+triple,'恰好两组与三组全参加是不重叠两类，把交集加回一次。')};
 });
 add('menuBranches','C02',1,'午餐选择','互斥分支加法','各分支选择数先乘，互斥分支再相加',r=>{
  const rice=2+r(6),dish=2+r(5),noodle=1+r(6);
  return {prompt:`午餐可选一份米饭配一道菜，或只选一份面。米饭 ${rice} 种、菜 ${dish} 种、面 ${noodle} 种。共有多少种午餐？`,answer:rice*dish+noodle,math:{rice,dish,noodle},methods:[method('分别数两种午餐分支',`米饭配菜有 ${rice}×${dish}=${rice*dish} 种，面有 ${noodle} 种。`,`两类互斥，相加 ${rice*dish+noodle}。`)],extension:change('如果还要求每份午餐再选一种饮料，饮料有3种，共有多少种？',3*(rice*dish+noodle),'饮料适用于两种午餐分支，乘3要作用到整份午餐数。')};
 });
 add('binaryNoNeighbors','C02',3,'一排灯','分支列举与约束','限制相邻情况会改变后续可选分支',r=>{
  const n=4+r(8);let count=0;for(let mask=0;mask<2**n;mask++)if(!(mask&(mask<<1)))count++;const totals=[1,2];for(let i=2;i<=n;i++)totals.push(totals[i-1]+totals[i-2]);
  return {prompt:`一排 ${n} 盏灯，每盏可亮或灭，要求没有两盏相邻的灯同时亮。不同的亮灭安排有多少种？`,answer:count,math:{n},methods:[method('从左向右分类延伸',`按第一盏分类：灭时剩下n−1盏自由安排，亮时第二盏必须灭、剩n−2盏自由安排。因此n盏的数量等于前两种规模的数量之和。`,`0盏有1种空安排，1盏有2种。从这里逐级得到 ${totals.map((v,i)=>i+'盏:'+v).join('；')}，所以 ${n} 盏有 ${count} 种，不能直接用2的${n}次方。`)],extension:change('如果第一盏必须亮，其他条件相同，有多少种？',(()=>{let c=0;for(let m=1;m<2**n;m+=2)if(!(m&(m<<1)))c++;return c})(),'第一盏亮会迫使第二盏灭，再对后面剩余位置延伸；不能简单除以2。')};
 });
 add('unorderedPairs','C03',1,'两人搭档','有序去重','两个人的先后顺序不能重复计数',r=>{
  const n=5+r(18);
  return {prompt:`${n} 位不同的小朋友任选两人组成搭档，不分先后。不同搭档有多少对？`,answer:n*(n-1)/2,math:{n},methods:[method('先有序选再去掉重复',`先选一人再选另一人有 ${n}×${n-1} 种，同一对被正反数两次。`,`除以2，得到 ${n*(n-1)/2} 对。`),method('按编号只向后选',`第1人与后面 ${n-1} 人，第2人与后面 ${n-2} 人……。`,`这些搭档互不重复，相加得 ${n*(n-1)/2}。`)],extension:change('如果给两人分别担任队长和记录员，有多少种安排？',n*(n-1),'有职位时交换两人会形成另一种安排，不再除以2。')};
 });
 add('circularSeating','C03',3,'围桌坐下','固定参照与相邻块','圆桌旋转相同，要先固定一个参照位置',r=>{
  const n=4+r(5);
  return {prompt:`${n} 位不同的小朋友围圆桌坐，整体旋转视为同一种，左右镜像视为不同。小乐、小明必须相邻。共有多少种坐法？`,answer:2*fact(n-2),math:{n},methods:[method('固定小乐再安排',`固定小乐，消去整体旋转。小明可坐其左边或右边2种。`,`其余 ${n-2} 人排列，共2×${fact(n-2)}=${2*fact(n-2)}。`),method('把相邻两人合成一块',`两人当一块，圆桌上有 ${n-1} 个对象，固定一块后有 ${fact(n-2)} 种顺序。`,`块内顺序2种，合计 ${2*fact(n-2)}。`)],extension:change('如果去掉两人相邻的限制，共有多少种坐法？',fact(n-1),'固定一人以后，其他n−1人的顺序都可选。')};
 });
 add('differentDigits','C04',1,'两位密码','补集','总数减去重复数字的密码',r=>{
  const digits=3+r(12);
  return {prompt:`密码有两位，每位可从 ${digits} 个不同符号中选一个。两位必须不同，一共有多少个密码？`,answer:digits*(digits-1),math:{digits},methods:[method('减去两位一样的',`全部 ${digits*digits} 个，两位相同有 ${digits} 个。`,`减去得 ${digits*(digits-1)}。`),method('直接限制第二位',`第一位 ${digits} 种，第二位不能重复，剩 ${digits-1} 种。`,`相乘得到 ${digits*(digits-1)}。`)],extension:change('如果交换两位也算同一个密码，共有多少个？',digits*(digits-1)/2,'每个不同符号对原来有两种顺序，现在两种合为一种。')};
 });
 add('allThreeColors','C04',3,'三色旗串','容斥','去掉缺色时，只有一种色的安排会被重复扣除',r=>{
  const n=4+r(6),answer=3**n-3*2**n+3;
  return {prompt:`一串 ${n} 面小旗，每个位置可用红、蓝、绿之一，位置顺序算不同。要求三种颜色都出现。共有多少种旗串？`,answer,math:{n},methods:[method('从全部安排中排除缺色',`全部3的${n}次方种。缺少指定一种色有2的${n}次方种，三种缺色都要扣。`,`只有一种颜色的三种旗串被各扣两次，要各加回一次，得到 ${answer}。`),method('按第一次出现和实际用色检查',`列出所有 ${3**n} 个有顺序色串，筛掉只用1色或2色的。`,`恰好3色的计数为 ${answer}；这种列举可作为容斥的独立核对。`)],extension:change('如果只要求恰好使用两种颜色，共有多少种？',3*(2**n-2),'先选缺哪一种颜色3种，每种仅用另两色但两色都出现，所以减去两种纯色。')};
 });
 add('truncatedBars','D01',2,'人数柱状图','刻度起点','柱高差不是从零开始的人数之比',r=>{
  const base=20+5*r(13),step=2+r(7),a=2+r(5),b=a+1+r(4),total=2*base+(a+b)*step;
  return {prompt:`柱状图的纵轴从 ${base} 人开始，每格 ${step} 人。甲柱高出起点 ${a} 格，乙柱高出起点 ${b} 格。两组实际一共有多少人？`,answer:total,math:{base,step,a,b},diagram:{kind:'truncatedBars',base,step,a,b},methods:[method('给每根柱子加回起点',`甲 ${base+a*step}，乙 ${base+b*step}。`,`相加 ${total}。只把柱子的可见高度相加会漏掉两次起点。`)],extension:change('乙组比甲组多多少人？',(b-a)*step,'比较差时共同起点会抵消，只有格数差乘每格人数。')};
 });
 add('cumulativeChart','D01',3,'累计统计表','累计与分段','累计记录相减才得到一段的实际数量',r=>{
  const a=2+r(9),b=2+r(9),c=2+r(9),d=2+r(9);
  return {prompt:`表格列出一次投篮活动“得分不超过某值”的累计人数。≤1分 ${a} 人，≤2分 ${a+b} 人，≤3分 ${a+b+c} 人，≤4分 ${a+b+c+d} 人。恰好2分或3分的有多少人？`,answer:b+c,math:{a,b,c,d},diagram:{kind:'table',rows:[['得分不超过','1','2','3','4'],['累计人数',a,a+b,a+b+c,a+b+c+d]]},methods:[method('从区间末端减起点之前',`≤3分包括1、2、3，去掉≤1分，只剩2、3。`,`${a+b+c}−${a}=${b+c}。`),method('恢复每档人数',`恰好2分=${a+b}−${a}=${b}；恰好3分=${a+b+c}−${a+b}=${c}。`,`两档相加 ${b+c}。不能把两个累计人数直接加。`)],extension:change('恰好4分的人有多少？',d,`≤4减≤3，得到 ${d}。`)};
 });
 add('medianSort','D02',1,'五次成绩','排序与中位数','中位数由位置决定，极端值未必改变它',r=>{
  const start=3+r(15),gap=1+r(7),values=[start+4*gap,start,start+3*gap,start+gap,start+2*gap];
  return {prompt:`五次成绩为 ${values.join('、')}。中位数是多少？`,answer:start+2*gap,math:{start,gap},methods:[method('先排序再找中间位置',`排序为 ${[...values].sort((a,b)=>a-b).join('、')}。`,`五个数的第三个为 ${start+2*gap}。中位数不是未排序列表的中间一项。`)],extension:change('把最大成绩增加100，中位数是多少？',start+2*gap,'只改变最大的一项，第三个位置仍然相同；平均数则会改变。')};
 });
 add('overlapAverages','D02',3,'重叠的平均数','总和与重复','两段平均数转换为总和后，重复部分可反求',r=>{
  const values=Array.from({length:7},()=>3+r(20)),first=values.slice(0,4).reduce((a,b)=>a+b,0),last=values.slice(3).reduce((a,b)=>a+b,0),sum=values.reduce((a,b)=>a+b,0);
  return {prompt:`7个数，前4个平均 ${F(first,4)}，后4个平均 ${F(last,4)}，全部平均 ${F(sum,7)}。第4个数是多少？`,answer:values[3],math:{values},methods:[method('比较两段总和与整体',`前4总和 ${first}，后4总和 ${last}，整体总和 ${sum}。`,`两段相加把第4个重复一次，故第4个=${first}+${last}−${sum}=${values[3]}。`),method('先求其余三项的总和',`整体减后4项，得到前3项总和 ${sum-last}。`,`前4总和再减前3总和，剩第4项 ${values[3]}。`)],extension:(()=>{const v=[...values,values[0],values[6]],a=v.slice(0,5).reduce((s,x)=>s+x,0),b=v.slice(4).reduce((s,x)=>s+x,0),t=v.reduce((s,x)=>s+x,0);return change(`另有9个数，前5个平均 ${F(a,5)}，后5个平均 ${F(b,5)}，全部平均 ${F(t,9)}。第5个数是多少？`,v[4],`这次两段总和分别为 ${a} 与 ${b}，全部总和为 ${t}；重叠的第5个是 ${a}+${b}−${t}=${v[4]}。人数和重叠位置变化，仍先还原总和。`)})()};
 });
 add('spinnerLabels','D03',1,'转盘的字母','等可能区域','字母重复出现时字母本身不等可能',r=>{
  const a=1+r(7),b=1+r(7),c=1+r(7),size=a+b+c;
  return {prompt:`转盘有 ${size} 个等面积扇区，A写在 ${a} 个，B写在 ${b} 个，C写在 ${c} 个。每个扇区被转中的机会相同。转中A或B的概率是多少？`,answer:F(a+b,size),math:{a,b,c},methods:[method('数等可能的扇区',`等可能的是 ${size} 个区域，其中A或B共 ${a+b} 个。`,`概率 ${F(a+b,size)}，不能直接把三个字母当三种等可能结果。`),method('减去C的机会',`C占 ${c}/${size}。`,`其余区域属于A或B，1−${c}/${size}=${F(a+b,size)}。`)],extension:change('在已经知道没转到C的条件下，转到A的概率是多少？',F(a,a+b),'样本空间缩小为A或B的扇区，只在这a+b个区域内比较。')};
 });
 add('conditionalBalls','D03',3,'取出的两个球','条件样本空间','至少一个红球的条件改变分母',r=>{
  const red=2+r(5),blue=2+r(5),all=choose(red+blue,2),valid=all-choose(blue,2),rr=choose(red,2);
  return {prompt:`袋中 ${red} 个红球、${blue} 个蓝球，不放回随机取两个，每一对具体球等可能。已知至少有一个红球，两个都是红球的概率是多少？`,answer:F(rr,valid),math:{red,blue},methods:[method('只数符合已知条件的球对',`原来 ${all} 对，蓝蓝 ${choose(blue,2)} 对不符合条件，所以新的总数 ${valid}。`,`红红 ${rr} 对，条件概率 ${F(rr,valid)}。`),method('把保留结果分成红红与红蓝',`红红 ${rr} 对，红蓝 ${red*blue} 对，二者是不重叠且全部符合条件的结果。`,`用红红除以两类总和，得 ${F(rr,valid)}。`)],extension:change('若改为已知两个颜色相同，两个都是红球的概率是多少？',F(rr,rr+choose(blue,2)),'保留结果变成红红或蓝蓝，新的分母不再含红蓝。')};
 });
 add('quarterTurn','S01',1,'纸上的箭头','旋转方向','旋转只改变方向，按实际角度追踪',r=>{
  const directions=['上','右','下','左'],start=r(4),turns=1+r(7);
  return {prompt:`箭头最初向${directions[start]}，每次顺时针旋转90°，连续旋转 ${turns} 次。最后向哪个方向？上填0，右填1，下填2，左填3。`,answer:(start+turns)%4,math:{start,turns},methods:[method('逐次追踪方向',`顺时针顺序为上、右、下、左。`,`从${directions[start]}出发 ${turns} 次，最后向${directions[(start+turns)%4]}，填 ${(start+turns)%4}。`)],extension:change('改为逆时针旋转同样次数，填哪个数字？',((start-turns)%4+4)%4,'逆时针次序相反，应从相同起点重新追踪。')};
 });
 add('transformOrder','S01',3,'两次变换','变换次序','旋转与反射交换次序通常不等价',r=>{
  const start=r(4),rot=1+r(3),mirror=v=>(4-v)%4,first=mirror((start+rot)%4),second=(mirror(start)+rot)%4;
  return {prompt:`箭头方向用上0、右1、下2、左3表示，最初是 ${start}。先顺时针转 ${rot} 个90°，再沿竖直轴作镜像（左右交换，上下不变），最后方向填几？`,answer:first,math:{start,rot},methods:[method('按次序逐次变换',`先旋转得到 ${(start+rot)%4}。镜像将1与3交换，0与2不变。`,`最终 ${first}。`),method('从最终方向倒着核对',`对候选方向先做同样镜像，再逆转 ${rot} 个90°。`,`只有 ${first} 会回到初始 ${start}，故它符合两步变换。`)],extension:change('先镜像、再做相同旋转，最终方向填几？',second,`交换次序后先变为 ${mirror(start)}，再旋转到 ${second}；两种次序不应默认相同。`)};
 });
 add('lightSwitchParity','S02',1,'一盏灯','奇偶保持','翻转两次恢复原状态',r=>{
  const groups=2+r(11),per=2+r(13),extra=1+r(20),on=r(2),total=groups*per+extra;
  return {prompt:`一盏灯最初${on?'亮':'灭'}。按开关 ${groups} 组，每组 ${per} 次，然后再按 ${extra} 次；每次都会翻转亮灭。最后亮填1，灭填0。`,answer:(on+total)%2,math:{groups,per,extra,on},methods:[method('只看总次数的奇偶',`共按 ${total} 次，偶数次不改状态，奇数次翻转。`,`从最初状态 ${on} 出发，最后填 ${(on+total)%2}。`)],extension:change('再多按一次，最后填几？',1-(on+total)%2,'多一次必然翻转，不需要重新追踪此前所有按键。')};
 });
 add('ballReplacement','S02',2,'盒中的两色球','不变量','每次白球数量的奇偶保持不变',r=>{
  const white=2+r(18),black=2+r(15);
  return {prompt:`盒中 ${white} 个白球、${black} 个黑球。每次取两球：同色放回一个黑球，异色放回一个白球。一直做到只剩一球。最后黑填0，白填1。`,answer:white%2,math:{white,black},methods:[method('检查每种操作对白球的影响',`白白变黑使白球少2；黑黑变黑使白球数不变；白黑变白也不变。`,`白球数奇偶始终不变，最后白球为0或1，所以填 ${white%2}。`)],extension:change('若最初多加一个白球，最后填几？',1-white%2,'初始白球奇偶改变，最终颜色也必然改变；黑球个数不决定这个不变量。')};
 });
 return out;
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionFraction,competitionNumericOptions});
if(typeof module!=='undefined')module.exports={COMPETITION_EXPANSION};

'use strict';
// RC64 originals: different constraints/models, not counts of parameter variants.
const COMPETITION_FRESH=((deps)=>{
 const {competitionRng:rng,competitionFraction:F,competitionNumericOptions:options}=deps,out=[];
 const method=(name,...steps)=>({name,steps});
 const change=(prompt,answer,solution)=>({prompt,answer:String(answer),solution,kind:'condition-change'});
 function add(id,topicIds,level,title,strategy,insight,build){out.push({id,topicIds,level,title,strategy,insight,build(seed){
  const r=rng(seed),p=build(r),answer=String(p.answer),values=[],number=v=>String(v).includes('/')?String(v).split('/').map(Number).reduce((a,b)=>a/b):Number(v),probability=topicIds.includes('D03');
  const fallback=probability?['0','1','1/2','1/3','2/3','1/4','3/4','1/5','2/5','3/5','4/5']:options(answer,r);
  for(const v of [answer,...(p.distractors||[]),...fallback]){const text=String(v),n=number(text);if(Number.isFinite(n)&&n>=0&&(!probability||n<=1)&&!values.some(x=>Math.abs(number(x)-n)<1e-12))values.push(text);if(values.length===5)break}
  if(values.length!==5)throw Error('Not enough distinct RC64 options');
  for(let i=values.length-1;i>0;i--){const j=r(i+1);[values[i],values[j]]=[values[j],values[i]]}
  return {...p,family:id,title,strategy,answer,options:values};
 }})}
 const choose=(n,k)=>{let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v};
 const fixedRedSets=(n,k)=>{const out=[];function visit(start,a){if(a.length===k){out.push(a);return}for(let i=start;i<=n-(k-a.length)+1;i++)visit(i+1,[...a,i])}visit(1,[]);return out};
 function cyclicGaps(n,red){
  const representatives=new Map();
  function visit(left,gaps){
   if(gaps.length===red-1){const g=[...gaps,left],keys=g.map((_,i)=>[...g.slice(i),...g.slice(0,i)]),canonical=keys.map(x=>x.join(',')).sort()[0];representatives.set(canonical,canonical.split(',').map(Number));return}
   for(let v=0;v<=left;v++)visit(left-v,[...gaps,v]);
  }
  visit(n-red,[]);return [...representatives.values()].sort((a,b)=>a.join(',').localeCompare(b.join(',')));
 }
 function routeWeights(w,h){
  const denominator=2**(w+h),a=Array.from({length:h+1},()=>Array(w+1).fill(0));a[0][0]=denominator;
  for(let y=0;y<=h;y++)for(let x=0;x<=w;x++){
   const choices=Number(x<w)+Number(y<h);if(!choices)continue;
   if(x<w)a[y][x+1]+=a[y][x]/choices;if(y<h)a[y+1][x]+=a[y][x]/choices;
  }
  return {a,denominator};
 }
 add('transferBetweenBoxes',['R01'],2,'两盒积木','总量不变与双向变化','转移时两边同时改变，先比较转移前后的数量差',r=>{
  const a=1+r(3),b=a+1+r(4),unit=2*(2+r(8)),moved=(b-a)*unit/2,answer=a*unit;
  return {prompt:`甲、乙两盒积木原来的数量之比是 ${a}:${b}。从乙盒拿出 ${moved} 块放入甲盒后，两盒一样多。甲盒原来有多少块？`,answer,distractors:[a*unit/2,answer+moved,(a+b)*unit,b*unit],math:{a,b,moved},diagram:{kind:'table',rows:[['原来甲:乙',`${a}:${b}`],['乙移到甲',`${moved} 块`],['移后','两盒相等']]},methods:[method('一次转移改变两边的差',`乙少 ${moved}、甲多 ${moved}，原来两盒的差是 ${2*moved} 块。`,`差对应 ${b-a} 份，一份 ${2*moved}÷${b-a}=${unit} 块。`,`原来甲有 ${a} 份，所以是 ${a}×${unit}=${answer} 块。`) ],extension:change(`回到原来的两盒。改为从外部只向甲加入 ${moved} 块，乙不变。乙还比甲多多少块？`,moved,`原差 ${2*moved}。从外部加入只缩小一次差，剩 ${2*moved}−${moved}=${moved}；不能按盒间转移缩小两倍来算。`)};
 });
 add('rectanglePointAreas',['G03'],2,'长方形里的点','共有高度与面积平衡','比较左右两块的面积和与上下两块的面积和',r=>{
  const w=4+2*r(7),h=4+2*r(6),x=1+r(w-1),y=1+r(h-1),top=w*(h-y)/2,left=h*x/2,right=h*(w-x)/2,bottom=w*y/2;
  return {prompt:`长方形内有一点P，连接P与四个顶点，分成上、右、下、左四个三角形。上边三角形面积 ${top}，左边 ${left}，右边 ${right}。下边三角形面积是多少？面积单位相同。`,answer:bottom,distractors:[left+right+top,left+right,top,right-left+top],math:{top,left,right},diagram:{kind:'fourAreas',top,left,right},methods:[method('两对相对三角形占同一半',`左右三角形的底边都等于长方形的高；两条对应的高相加等于长方形的宽。因此左右面积和是长方形面积的一半，为 ${left}+${right}=${left+right}。`,`同理，上下三角形面积和也是同一半，所以两对面积和相等。`,`下边面积=${left}+${right}−${top}=${bottom}，不需要求点P的具体位置。`)],extension:change('把P只向右移动，使左边三角形面积增加1，P仍在长方形内部。右边三角形的新面积是多少？',right-1,`左右面积和保持 ${left+right}；左增加1，右就减少1，所以为 ${right}−1=${right-1}。上下两块在这次水平移动中不变。`)};
 });
 add('worstCaseColors',['C04'],2,'袋里的三种球','最坏情况与保证','先想最多取几个仍能避免目标，再考虑下一次',r=>{
  const k=3+r(3),caps=[1+r(k-1),k+1+r(4),k+1+r(4)],safe=caps.map(v=>Math.min(v,k-1)),answer=safe.reduce((a,b)=>a+b,0)+1;
  const next=caps.map(v=>Math.min(v,k));
  return {prompt:`袋里有红球 ${caps[0]} 个、蓝球 ${caps[1]} 个、绿球 ${caps[2]} 个。看不到颜色，取出后不放回。至少取多少个，才能保证其中有 ${k} 个同色球？`,answer,distractors:[answer-1,k,3*(k-1)+1,caps.reduce((a,b)=>a+b,0)],math:{caps,k},diagram:{kind:'table',rows:[['颜色','红','蓝','绿'],['球数',...caps],['目标',`至少 ${k} 个同色`]]},methods:[method('构造还没达到目标的最大取法',`没有 ${k} 个同色时，每种最多取 ${k-1} 个，还要受库存限制。红、蓝、绿分别最多取 ${safe.join('、')} 个。`,`这三种数量可以同时取到，共 ${answer-1} 个，仍没有达到目标，说明少取这么多不能保证成功。`,`再取一个就超过这个最大数量，必有一种达到 ${k} 个；所以最少 ${answer} 个。`)],extension:change(`库存不变，目标改为保证 ${k+1} 个同色球。至少取多少个？`,next.reduce((a,b)=>a+b,0)+1,`避免 ${k+1} 同色时，每种至多取 ${k}，但不能超过库存；最大失败取法为 ${next.join('+')}=${next.reduce((a,b)=>a+b,0)}，再加1。`)};
 });
 add('stagedClimb',['R03'],2,'轨道上的机器人','完整周期与停止边界','先检查最后一次达到目标后，还会不会发生回落',r=>{
  const up=3+r(6),down=1+r(up-1),height=up+1+r(25),net=up-down,days=1+Math.ceil((height-up)/net);
  return {prompt:`机器人从竖直轨道的0米处出发。每天白天向上走 ${up} 米，夜晚向下退 ${down} 米。白天一到达 ${height} 米标记就立即停机，不再回退。它在第几天首次到达标记？`,answer:days,distractors:[Math.ceil(height/net),Math.floor(height/net),days-1,days+1],math:{up,down,height},diagram:{kind:'table',rows:[['白天向上',`${up} 米`],['夜晚回退',`${down} 米`],['停止标记',`${height} 米`]]},methods:[method('最后一天不再扣夜间回退',`一个完整昼夜净前进 ${up}−${down}=${net} 米，但到达标记的最后一天没有夜间回退。`,`第d天白天最高位置是 (d−1)×${net}+${up}。第 ${days-1} 天最高 ${(days-2)*net+up} 米，还未到；第 ${days} 天最高 ${(days-1)*net+up} 米，已到。`,`所以首次到达是第 ${days} 天，不能把整个目标高度直接除以昼夜净增量。`)],extension:change('取消到达标记立即停机的规则，每个夜晚都完整回退。第几天夜晚结束后，位置首次达到或超过这个标记？',Math.ceil(height/net),`每个完整昼夜净前进 ${net} 米。这次比较d×${net}与 ${height}，最小整数天数为 ${Math.ceil(height/net)}。`)};
 });
 add('consecutiveRepresentations',['A02','L02','N02'],3,'一串连续整数','连续和与因数约束','固定项数，检查首项是否为正整数，避免漏掉边界',r=>{
  const total=[9,15,21,25,27,33,35,45,55,63,75,81][r(12)],limit=Math.floor((Math.sqrt(1+8*total)-1)/2),legal=[];
  for(let k=2;k<=limit;k++){const start=(2*total/k-k+1)/2;if(Number.isInteger(start)&&start>=1)legal.push({k,start})}
  const extra=Number(Number.isInteger((Math.sqrt(1+8*total)-1)/2));
  return {prompt:`把 ${total} 写成至少两个连续正整数的和，有多少种写法？例如“首项不同”或“项数不同”都算不同写法，顺序固定为从小到大。`,answer:legal.length,distractors:[legal.length+1,legal.length+extra,Array.from({length:2*total},(_,i)=>i+1).filter(k=>2*total%k===0).length,legal.length-1],math:{total},methods:[method('由项数筛选合法的首项',`设有k项、首项a。首尾配对得总和=k×(2a+k−1)÷2，所以k必须是 ${2*total} 的因数，且a=(${2*total}÷k−k+1)÷2是正整数。`,`从1开始的k项已经是k项连续正整数的最小和，因此只检查2到 ${limit} 项；更长不可能。`,`逐个检查这个范围内的因数，合法情况为 ${legal.map(v=>`${v.k}项，从${v.start}到${v.start+v.k-1}`).join('；')}。`,`这些写法首项和长度均唯一，合计 ${legal.length} 种。`)],extension:change('其余不变，允许首项为0，即改为至少两个连续非负整数的和。有多少种写法？',legal.length+extra,`正整数写法保留。新写法只能从0开始，需要0+1+……+(k−1)=${total}，即k(k−1)÷2=${total}；${extra?'有一个整数k满足，增加1种':'没有整数k满足，没有新增写法'}，共 ${legal.length+extra} 种。`)};
 });
 add('remainderProbability',['N04','D03'],2,'抽到的数字卡','循环尾段与样本空间','每张整数卡等可能，不代表各余数出现次数相同',r=>{
  const mod=3+r(5),count=mod*(2+r(5))+1+r(mod-1),wanted=r(mod),blocks=Math.floor(count/mod),tail=count%mod,good=blocks+Number(wanted>0&&wanted<=tail),after=good+Number(wanted===0);
  return {prompt:`卡片分别写着1到 ${count} 的每个整数，每张被抽到的机会相同。随机抽一张，卡上整数除以 ${mod} 的余数是 ${wanted} 的概率是多少？`,answer:F(good,count),distractors:[F(1,mod),F(good,count+1),F(good+1,count),F(blocks,count)],math:{mod,count,wanted},diagram:{kind:'table',rows:[['卡片',`1 到 ${count}`],['除数',mod],['目标余数',wanted]]},methods:[method('完整循环之后还要数尾段',`每 ${mod} 个连续整数，各余数恰出现一次。完整的 ${blocks} 组贡献 ${blocks} 张符合的卡。`,`剩下 ${tail} 张，余数依次为1到 ${tail}，${wanted>0&&wanted<=tail?'目标余数还出现一次':'目标余数没有再出现'}。`,`所以符合的有 ${good} 张，总数 ${count} 张，概率 ${F(good,count)}。`)],extension:change('加入一张写0的卡，其余卡片不变，仍等概率抽一张。得到原目标余数的概率是多少？',F(after,count+1),`分母增加到 ${count+1}；0除以 ${mod} 余0，所以${wanted===0?'分子也增加1':'原目标余数不是0，分子不变'}，概率 ${F(after,count+1)}。`)};
 });
 add('rotatingColors',['S01','C02'],3,'圆环上的颜色','重复颜色与旋转等价','记录相邻红位置之间的蓝色数量，再检查哪些记录只是换了起点',r=>{
  const n=4+r(4),red=2+r(n-3),groups=cyclicGaps(n,red),fixed=fixedRedSets(n,red);
  return {prompt:`圆环有 ${n} 个等距位置，把其中 ${red} 个涂红，其余涂蓝。没有固定起点，旋转后能完全重合的算同一种涂法；镜像本身不算相同，除非还能旋转重合。共有多少种涂法？`,answer:groups.length,distractors:[choose(n,red),Math.floor(choose(n,red)/n),groups.length-1,groups.length+1],math:{n,red},diagram:{kind:'necklaceBlank',n,red},methods:[method('用间隔记录涂色并按循环归类',`顺时针从一个红位置出发，记录每两个相邻红位置之间的蓝色个数：共 ${red} 个非负整数，总和 ${n-red}。`,`把 ${n-red} 分入这 ${red} 个间隔，逐个列出全部记录；仅循环换起点的记录合并，倒序不能直接合并。`,`合并后可取这些代表：${groups.map(g=>'('+g.join('、')+')').join('；')}。每个代表都能还原一圈涂色，且其他记录都能循环到其中一个。`,`所以有 ${groups.length} 种。有的图案自身会在较小角度旋转后重合，不能把所有有序涂法统一除以 ${n}。`)],extension:change('给圆环的一个位置加上固定星标，以它为1号，顺时针编号到最后一个位置。不同的红色位置集合都算不同，旋转不再合并。共有多少种涂法？',choose(n,red),`依次确定红色位置，编号严格递增，这样每个集合只列一次。合法集合为 ${fixed.map(v=>"("+v.join("、")+")").join("；")}。所有递增选择都在这张列表里，共 ${fixed.length} 种；有固定星标后不能再按旋转合并。`)};
 });
 add('stepwiseRoute',['C02','D03'],3,'方格中的行走','随机过程与路径权重','先看随机规则作用于每个岔口还是整条路线，不能默认路线等可能',r=>{
  const w=2+r(3),h=1+r(3),weights=routeWeights(w,h),targets=[];
  for(let y=0;y<=h;y++)for(let x=1;x<=w;x++)if(x!==w||y!==h){const count=choose(x+y,x)*choose(w+h-x-y,w-x),all=choose(w+h,w);if(weights.a[y][x]*all!==count*weights.denominator)targets.push({x,y,count,all})}
  const {x,y,count,all}=targets[r(targets.length)],answer=F(weights.a[y][x],weights.denominator);
  const table=Array.from({length:y+1},(_,j)=>`y=${j}：`+Array.from({length:x+1},(_,i)=>`(${i},${j})为${F(weights.a[j][i],weights.denominator)}`).join('，'));
  return {prompt:`从方格点A(0,0)走到B(${w},${h})，每步只能向右或向上1格，不能走出长方形。两个方向都能走时，各以1/2概率选择；只剩一个合法方向时必须走它。经过点P(${x},${y})的概率是多少？`,answer,distractors:[F(count,all),F(weights.denominator-weights.a[y][x],weights.denominator),F(1,all),"1/2"],math:{w,h,x,y},diagram:{kind:'routes',w,h,x,y},methods:[method('把到达概率沿合法方向传递',`A的概率为1。每个有两个出口的点，各传一半给右、上邻点；边界只有一个出口时传全部。一个点从不同入口到达的事件互斥，可以相加。`,`依次填到P的各点概率（坐标按题面）：${table.join('；')}。`,`P得到的总概率为 ${answer}。完整路线在这种逐步选择中不一定等可能，所以不能直接用“经过P的路线数÷全部路线数”。`)],extension:change('改为先列出所有从A到B的合法完整路线，再等概率抽一条。经过同一个P的概率是多少？',F(count,all),`这次计数时在起点记1，每个点写左边和下边的路线数之和，得到A到B共 ${all} 条、A到P共 ${choose(x+y,x)} 条。从P同样逐点计数到B，共 ${choose(w+h-x-y,w-x)} 条。前后配对得 ${count} 条经过P。完整路线等可能，所以概率 ${F(count,all)}；不要沿用原来的岔口概率。`)};
 });
 return out;
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionFraction,competitionNumericOptions});
if(typeof module!=='undefined')module.exports={COMPETITION_FRESH};

'use strict';
// Small, exact relation interpreter. Definitions contain data, never executable
// strings or answers. All question, solution and diagram numbers share bindings.
const CompetitionRelations=(()=>{
 const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return Math.abs(a)||1};
 function q(n,d=1){if(!Number.isSafeInteger(n)||!Number.isSafeInteger(d)||!d)throw Error('Unsafe rational');const g=gcd(n,d),s=d<0?-1:1;return {n:n/g*s,d:Math.abs(d/g)}}
 function number(v){if(v&&typeof v==='object'&&'n'in v)return q(v.n,v.d);if(typeof v==='string'&&/^-?\d+\/\d+$/.test(v)){const [n,d]=v.split('/').map(Number);return q(n,d)}if(typeof v==='string'&&/^-?\d+$/.test(v))return q(Number(v));if(typeof v==='number')return q(v);throw Error('Invalid relation value '+v)}
 const add=(a,b)=>q(a.n*b.d+b.n*a.d,a.d*b.d),mul=(a,b)=>q(a.n*b.n,a.d*b.d),div=(a,b)=>q(a.n*b.d,a.d*b.n);
 const decimal=a=>a.n/a.d;
 function format(a){a=number(a);return a.d===1?String(a.n):a.n+'/'+a.d}
 // Render evaluated operands from the same expression tree as the relations.
 // Parentheses are structural, including fractional and negative operands.
 function expression(e,env){
  function node(x){
   if(!Array.isArray(x)){const v=evaluate(x,env);return {text:format(v),precedence:v.d===1?4:2,compound:v.d!==1||v.n<0}}
   const op=x[0],parts=x.slice(1).map(node),precedence={add:1,sub:1,mul:2,div:2,pow:3}[op];
   if(op==='floor'||op==='ceil')return {text:(op==='floor'?'向下取整':'向上取整')+'('+parts[0].text+')',precedence:4};
   if(op==='max'||op==='min')return {text:(op==='max'?'最大值':'最小值')+'('+parts.map(p=>p.text).join('，')+')',precedence:4};
   if(!precedence)throw Error('Unsupported display operation '+op);
   const symbol={add:' + ',sub:' − ',mul:' × ',div:' ÷ ',pow:' ^ '}[op];
   const text=parts.map((p,i)=>{
    const wrap=p.compound||p.precedence<precedence||(i>0&&['sub','div','pow'].includes(op)&&p.precedence<=precedence)||(op==='pow'&&i===0&&p.precedence===precedence);
    return wrap?'('+p.text+')':p.text;
   }).join(symbol);
   return {text,precedence};
  }
  return node(e).text;
 }
 function evaluate(e,env){
  if(typeof e==='number')return q(e);
  if(typeof e==='string'){if(e in env)return number(env[e]);if(/^-?\d+(\/\d+)?$/.test(e))return number(e.includes('/')?e:Number(e));throw Error('Unknown quantity '+e)}
  if(!Array.isArray(e)||e.length<2)throw Error('Invalid expression');
  const op=e[0],v=e.slice(1).map(x=>evaluate(x,env));
  if(op==='add')return v.reduce(add,q(0));if(op==='sub')return add(v[0],q(-v[1].n,v[1].d));
  if(op==='mul')return v.reduce(mul,q(1));if(op==='div')return div(v[0],v[1]);
  if(op==='pow'){if(v[1].d!==1||v[1].n<0||v[1].n>6)throw Error('Invalid exponent');return q(v[0].n**v[1].n,v[0].d**v[1].n)}
  if(op==='floor')return q(Math.floor(decimal(v[0])));if(op==='ceil')return q(Math.ceil(decimal(v[0])));
  if(op==='max'||op==='min')return v.reduce((a,b)=>(op==='max'?decimal(a)>decimal(b):decimal(a)<decimal(b))?a:b);
  throw Error('Unsupported operation '+op);
 }
 function condition(c,env){const a=decimal(evaluate(c[1],env)),b=c.length>2?decimal(evaluate(c[2],env)):0;return c[0]==='integer'?Number.isInteger(a):c[0]==='gt'?a>b:c[0]==='ge'?a>=b:c[0]==='lt'?a<b:c[0]==='le'?a<=b:c[0]==='eq'?a===b:c[0]==='ne'?a!==b:false}
 function bind(def,params){
  const env={};for(const key of def.inputs){if(!(key in params))throw Error('Missing '+key);env[key]=number(params[key])}
  if((def.inputChecks||[]).some(c=>!condition(c,env)))throw Error('Illegal relation parameters');
  for(const [key,e]of def.derive||[])env[key]=evaluate(e,env);
  let candidates=[];
  if(def.search){const s=def.search,lo=decimal(evaluate(s.from,env)),hi=decimal(evaluate(s.to,env));if(!Number.isInteger(lo)||!Number.isInteger(hi)||hi-lo>1000||hi<lo)throw Error('Illegal search domain');
   for(let k=lo;k<=hi;k++){const row={...env,[s.variable]:q(k)};for(const [name,e]of s.derive)row[name]=evaluate(e,row);if((s.checks||[]).every(c=>condition(c,row)))candidates.push(row)}
   if(!candidates.length)throw Error('No feasible solution');candidates.sort((a,b)=>decimal(evaluate(s.objective,a))-decimal(evaluate(s.objective,b)));Object.assign(env,candidates[0]);
  }
  for(const [key,e]of def.after||[])env[key]=evaluate(e,env);
  if((def.checks||[]).some(c=>!condition(c,env)))throw Error('Degenerate relation');
  return {env,candidates,answer:format(evaluate(def.target,env))};
 }
 function text(s,env,formulas={}){return String(s).replace(/\{(=?[A-Za-z][A-Za-z0-9]*)\}/g,(_,key)=>{if(key[0]==='='){if(!(key.slice(1)in formulas))throw Error('Unbound equation '+key);return formulas[key.slice(1)]}if(!(key in env))throw Error('Unbound display '+key);return typeof env[key]==='string'&&!/^-?\d+(\/\d+)?$/.test(env[key])?env[key]:format(env[key])})}
 function material(value,env,formulas={}){
  if(Array.isArray(value))return value.map(v=>material(v,env,formulas));
  if(value&&typeof value==='object'){if('$'in value)return decimal(evaluate(value.$,env));return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,material(v,env,formulas)]))}
  return typeof value==='string'?text(value,env,formulas):value;
 }
 function compile(def,params,context){
  const bound=bind(def,params),{env,candidates}=bound,skin=def.contexts[context];if(!skin)throw Error('Unreviewed context');
  // Prompt placeholders can only use declared givens, preventing derived-value leakage.
  const meta=def.contextMeta?.[context]||{},display={...env,...meta},given={...Object.fromEntries(def.inputs.map(k=>[k,env[k]])),...meta},formulas={};
  for(const [key,e]of [...(def.derive||[]),...(def.search?.derive||[]),...(def.after||[])])formulas[key]=expression(e,env)+' = '+format(env[key]);
  if(def.model==='finite-purchase')display.purchasePlan=decimal(env.singles)===0?text('买 {packs} 包即可，共买 {bought} {unit}',display):text('买 {packs} 包，再单买 {singles} {unit}，共买 {bought} {unit}',display);
  const methods=def.methods.map(m=>({name:m.name,steps:m.steps.map(s=>text(s,display,formulas)),frames:(m.frames||[]).map(f=>material(f,display,formulas))}));
  if(context==='supplies'&&['start','first','second','left'].some(k=>env[k]&&env[k].d!==1))throw Error('Paper quantities must be whole');
  const misconceptions=[];for(const m of def.misconceptions||[])try{misconceptions.push({value:format(evaluate(m.expr,env)),feedback:m.feedback})}catch{/* An undefined misconception is not a legal choice. */}
  const ordered=candidates.slice().sort((a,b)=>decimal(a[def.search.variable])-decimal(b[def.search.variable]));
  return {...bound,title:meta.title||def.title,prompt:text(skin, given),methods,hints:def.hints.map(h=>text(h,given)),diagram:material(def.diagram||null,given),hintDiagram:material(def.hintDiagram||null,given),misconceptions,candidateRows:ordered.map(row=>Object.fromEntries((def.search?.columns||[]).map(k=>[k,format(row[k])])))};
 }
 return {q,number,format,decimal,evaluate,expression,condition,bind,compile,material,text};
})();
if(typeof module!=='undefined')module.exports=CompetitionRelations;

'use strict';
// Reviewed configurations of shared operations. Changing a goal or boundary
// selects a different definition; it never changes a solved question in place.
const COMPETITION_RULE_MODELS=(()=>{
 const add=(...x)=>['add',...x],sub=(a,b)=>['sub',a,b],mul=(...x)=>['mul',...x],div=(a,b)=>['div',a,b];
 const cell=(label,size,caption,role='whole')=>({label,parts:[{size:{$:size},caption,role}]});
 const bars=(title,...rows)=>({kind:'rule-bars',title,rows});
 const table=(title,rows)=>({kind:'rule-table',title,rows});
 const domains=(...keys)=>keys.map(k=>['integer',k]);
 const models={};
 for(const closed of [false,true]){
  const key=closed?'join-closed':'join-open';
  models[key]={model:'joined-length',reasoningKey:'boundary-and-overlap',topics:['A02'],level:closed?2:1,title:closed?'拼接的圆环':'拼接的长条',inputs:['n','piece','lap'],
   inputChecks:[...domains('n','piece','lap'),['ge','n',closed?3:2],['le','n',8],['gt','lap',0],['gt','piece',mul(2,'lap')]],
   derive:[['joins',closed?'n':sub('n',1)],['gross',mul('n','piece')],['loss',mul('joins','lap')],['total',sub('gross','loss')]],target:'total',
   contexts:{panels:closed?'把 {n} 段同样的软塑料条接成闭环，每段长 {piece} 厘米。每个连接处重叠 {lap} 厘米，首尾也这样连接。闭环一周长多少厘米？':'把 {n} 块同样的展示板首尾搭接成长条，每块长 {piece} 厘米，相邻两块重叠 {lap} 厘米。长条总长多少厘米？',ribbon:closed?'用 {n} 条同样的彩带接成一个环，每条长 {piece} 厘米。每个连接处重叠 {lap} 厘米，首尾也这样连接。环的一周长多少厘米？':'用 {n} 条同样的彩带接成长条，每条长 {piece} 厘米，相邻两条重叠 {lap} 厘米。长条总长多少厘米？'},
   diagram:table('已知条件',[['段数','{n}'],['每段长','{piece} 厘米'],['每处重叠','{lap} 厘米']]),
   hints:[closed?'把首尾的连接也画出来，数一数连接处。':'先画出这些段，数一数段与段之间的连接处。','重叠处在两段的长度里出现了两次，合起来时应怎样处理？'],
   hintDiagram:{kind:'rule-links',n:{$:'n'},closed,caption:'数一数连接处；小框表示重叠的位置。'},
   methods:[{name:'先数连接，再扣重复部分',steps:['各段长度合计 {=gross} 厘米。',closed?'首尾相接，共有 {joins} 个连接处，重叠合计 {=loss} 厘米。':'{n} 段排成长条，共有 {joins} 个连接处，重叠合计 {=loss} 厘米。','每处重复的长度扣一次：{=total} 厘米。'],frames:[bars('先看所有段的长度',cell('未扣重叠','gross','合计 {gross} 厘米')),bars('只扣连接处的重复部分',cell('未扣重叠','gross','{gross} 厘米'),cell('重复部分','loss','{joins} 处，共 {loss} 厘米','change')),bars('合起来的实际长度',cell('实际长度','total','{total} 厘米'),cell('扣去的重复','loss','{loss} 厘米','change'))]}],
   misconceptions:[{expr:'gross',feedback:'检查重叠部分是否重复计算。'},{expr:sub('gross',mul(closed?sub('n',1):'n','lap')),feedback:'先数清连接处，尤其检查首尾是否相接。'},{expr:sub('gross','lap'),feedback:'检查是否只扣了一处重叠。'}]};
 }
 models['join-piece']={model:'joined-length',reasoningKey:'inverse-overlap',topics:['A02'],level:2,title:'同长的展示板',inputs:['n','total','lap'],inputChecks:[...domains('n','total','lap'),['ge','n',2],['le','n',8],['gt','lap',0]],derive:[['joins',sub('n',1)],['loss',mul('joins','lap')],['gross',add('total','loss')],['piece',div('gross','n')]],checks:[['integer','piece'],['gt','piece',mul(2,'lap')]],target:'piece',contexts:{panels:'{n} 块同样长的展示板首尾搭接成长条，相邻两块重叠 {lap} 厘米，长条总长 {total} 厘米。每块板长多少厘米？',ribbon:'{n} 条同样长的彩带接成长条，相邻两条重叠 {lap} 厘米，长条长 {total} 厘米。每条彩带长多少厘米？'},diagram:table('已知条件',[['段数','{n}'],['合起来的长度','{total} 厘米'],['每处重叠','{lap} 厘米']]),hints:['如果把重叠扣掉的部分加回，总长度代表什么？','先数连接处，再把重复长度还原，最后分成相同的几段。'],hintDiagram:{kind:'rule-links',n:{$:'n'},closed:false,caption:'每个连接处都少算了一段重叠长度。'},methods:[{name:'先还原，再等分',steps:['{n} 段有 {joins} 个连接处，重叠合计 {loss} 厘米。','还原各段长度合计：{=gross} 厘米。','每段长度 {=piece} 厘米。'],frames:[bars('加回被扣掉的长度',cell('实际长度','total','{total} 厘米'),cell('加回重叠','loss','{loss} 厘米','change')),bars('还原各段的合计',cell('各段合计','gross','{gross} 厘米')),bars('同长的一段',cell('每段','piece','{piece} 厘米'))]}],misconceptions:[{expr:div('total','n'),feedback:'合起来的长度已经扣过重叠，先还原再等分。'}]};
 for(const ends of ['both','neither']){
  models['posts-'+ends]={model:'interval-endpoints',reasoningKey:'boundary-and-overlap',topics:['A02'],level:1,title:'步道旁的标记',inputs:['distance','gap'],inputChecks:[...domains('distance','gap'),['gt','gap',0]],derive:[['intervals',div('distance','gap')],['posts',ends==='both'?add('intervals',1):sub('intervals',1)]],checks:[['integer','intervals'],['ge','intervals',2],['le','intervals',20]],target:'posts',contexts:{trail:ends==='both'?'一段笔直步道长 {distance} 米，每隔 {gap} 米放一个标记，两个端点也各放一个。共放多少个标记？':'一段笔直步道长 {distance} 米，每隔 {gap} 米放一个标记，但两个端点都不放。共放多少个标记？'},diagram:table('步道条件',[['总长','{distance} 米'],['间隔','{gap} 米'],['端点',ends==='both'?'两端都放':'两端都不放']]),hints:['先区分一段间隔和一个标记。','画一条短一些的步道，检查两端是否放标记对数量的影响。'],methods:[{name:'先数间隔，再处理两端',steps:['间隔数 {=intervals}。',ends==='both'?'每段间隔的起点各放一个，再加上最后终点，共 {=posts} 个。':'内部连接点比间隔少一个；两端不放，共 {=posts} 个。'],frames:[bars('总长分成相等间隔',cell('间隔数','intervals','{intervals} 段')),bars('按端点规则数标记',cell('标记数','posts','{posts} 个'))]}],misconceptions:[{expr:'intervals',feedback:'间隔数和标记数不同，检查两个端点。'},{expr:ends==='both'?sub('intervals',1):add('intervals',1),feedback:'核对题目要求两端放还是不放。'}]};
 }
 for(const reverse of [false,true]){
  const key=reverse?'weighted-score':'weighted-mean';
  models[key]={model:'weighted-total',reasoningKey:reverse?'inverse-weighted-total':'weighted-total',topics:['R01','D02'],level:2,title:'两队的积分',inputs:reverse?['a','b','high','mean']:['a','b','low','high'],inputChecks:[...domains('a','b'),['gt','a',0],['gt','b',0],['le','a',6],['le','b',6],['ne','a','b']],derive:reverse?[['people',add('a','b')],['total',mul('people','mean')],['blue',mul('b','high')],['red',sub('total','blue')],['low',div('red','a')]]:[['people',add('a','b')],['red',mul('a','low')],['blue',mul('b','high')],['total',add('red','blue')],['mean',div('total','people')]],checks:[['ge','low',0],['ge','high',0],['ne','low','high']],target:reverse?'low':'mean',contexts:{teams:reverse?'甲、乙两队人数之比是 {a}:{b}。甲队每人得分相同，乙队每人得 {high} 分，所有队员的平均分为 {mean}。甲队每人得多少分？':'甲、乙两队人数之比是 {a}:{b}。甲队每人得 {low} 分，乙队每人得 {high} 分。所有队员的平均分是多少？'},diagram:table('队伍条件',reverse?[['人数比','{a}:{b}'],['乙每人','{high} 分'],['全体平均','{mean} 分']]:[['人数比','{a}:{b}'],['甲每人','{low} 分'],['乙每人','{high} 分']]),hints:['两队人数是否相同？可以按人数比例取一组代表队员。',reverse?'先把全体平均分变成总分，再扣除乙队的部分。':'平均数要对应所有队员，而不只是两种得分。'],methods:[{name:reverse?'由平均还原总分':'按人数份数合计',steps:reverse?['按甲 {a} 人、乙 {b} 人，共 {people} 人计算，总分 {=total}。','乙队总分 {=blue}；甲队总分 {=red}。','甲每人 {=low} 分。']:['按甲 {a} 人、乙 {b} 人的一组计算，共 {people} 人。','甲总分 {=red}，乙总分 {=blue}，合计 {total}。','全体平均 {=mean} 分。'],frames:[bars('人数份数决定权重',cell('甲人数份数','a','{a} 份'),cell('乙人数份数','b','{b} 份')),bars('先合计总分',cell('甲总分','red','{red} 分'),cell('乙总分','blue','{blue} 分')),bars(reverse?'再还原甲每人得分':'再平均到每个人',cell(reverse?'甲每人':'全体平均',reverse?'low':'mean',reverse?'{low} 分':'{mean} 分'))]}],misconceptions:reverse?[{expr:sub('mean','high'),feedback:'先由平均和人数份数求总分，不能直接相减两个得分。'}]:[{expr:div(add('low','high'),2),feedback:'核对两队人数；人数不同，两种得分不能等权平均。'}]};
 }
 for(const forward of [false,true]){
  const key=forward?'ratio-perimeter':'ratio-length';
  models[key]={model:'ratio-perimeter',reasoningKey:forward?'ratio-to-perimeter':'perimeter-to-ratio',topics:['R01','G01'],level:2,title:'长方形围栏',inputs:forward?['a','b','width']:['a','b','perimeter'],inputChecks:[...domains('a','b'),['gt','a',0],['gt','b','a']],derive:forward?[['unit',div('width','a')],['length',mul('unit','b')],['half',add('width','length')],['perimeter',mul(2,'half')]]:[['half',div('perimeter',2)],['parts',add('a','b')],['unit',div('half','parts')],['width',mul('a','unit')],['length',mul('b','unit')]],checks:[['gt','unit',0]],target:forward?'perimeter':'length',contexts:{enclosure:forward?'长方形围栏的宽与长之比是 {a}:{b}，宽是 {width} 米。围栏一周长多少米？':'长方形围栏的宽与长之比是 {a}:{b}，一周长 {perimeter} 米。长是多少米？'},diagram:table('围栏条件',forward?[['宽:长','{a}:{b}'],['宽','{width} 米']]:[['宽:长','{a}:{b}'],['周长','{perimeter} 米']]),hints:[forward?'先从宽的份数确定一份，再求长。':'围栏一周包含几条长和几条宽？','先统一长度与份数的对应，再处理所求目标。'],methods:[{name:forward?'从份数得到两边':'半周长对应长宽份数',steps:forward?['宽 {width} 米对应 {a} 份，一份 {=unit} 米。','长 {b} 份，为 {length} 米，长宽和 {half} 米。','周长 {=perimeter} 米。']:['半周长 {=half} 米，等于一条长加一条宽。','这对应 {a}+{b}={parts} 份，一份 {=unit} 米。','长对应 {b} 份，长为 {=length} 米。'],frames:[bars('一条长与一条宽',cell('宽','width','{width} 米'),cell('长','length','{length} 米')),bars('从份数确定长度',cell('一份','unit','{unit} 米')),bars(forward?'完整的一周':'所求的长',cell(forward?'周长':'长',forward?'perimeter':'length',forward?'{perimeter} 米':'{length} 米'))]}],misconceptions:forward?[{expr:add('width','length'),feedback:'长加宽只是一半周长。'}]:[{expr:mul(div('perimeter',add('a','b')),'b'),feedback:'比例中的长加宽对应半周长。'}]};
 }
 for(const original of [false,true]){
  const key=original?'fraction-original':'fraction-reverse';
  models[key]={model:'fraction-wholes',reasoningKey:original?'same-whole-fractions':'inverse-changing-wholes',topics:['A03'],level:2,title:'两次使用',inputs:original?['d1','d2','start']:['d1','d2','left'],inputChecks:[...domains('d1','d2'),['ge','d1',2],['ge','d2',2]],derive:original?[['first',div('start','d1')],['second',div('start','d2')],['left',sub(sub('start','first'),'second')]]:[['keep2',div(sub('d2',1),'d2')],['afterFirst',div('left','keep2')],['keep1',div(sub('d1',1),'d1')],['start',div('afterFirst','keep1')],['first',sub('start','afterFirst')],['second',sub('afterFirst','left')]],checks:[['gt','left',0],['gt','start',0]],target:original?'left':'start',contexts:{supplies:original?'一批手工纸最初有 {start} 张。第一次用掉最初总数的 1/{d1}，第二次也按最初总数用掉 1/{d2}。最后剩多少张？':'一批手工纸，第一次用掉最初总数的 1/{d1}，第二次用掉剩下纸张的 1/{d2}，最后剩 {left} 张。最初有多少张？',water:original?'水箱最初有 {start} 升水。第一次用掉最初水量的 1/{d1}，第二次也按最初水量用掉 1/{d2}。最后剩多少升？':'水箱第一次用掉最初水量的 1/{d1}，第二次用掉剩下水量的 1/{d2}，最后剩 {left} 升。最初有多少升？'},diagram:table('两次使用的条件',original?[['最初总量','{start} {unit}'],['第一次整体','最初总量'],['第二次整体','最初总量']]:[['最终剩余','{left} {unit}'],['第一次整体','最初总量'],['第二次整体','第一次后的剩余']]),hints:['分别指出两次分数对应的整体。',original?'两次都以最初总量为整体，分别确定用掉的量。':'从最后剩余倒着走，先还原第二次之前，再还原最初。'],methods:[{name:original?'分别扣除同一整体的部分':'从剩余逐次还原',steps:original?['第一次用 {=first} {unit}。','第二次仍按最初总量：{=second} {unit}。','最后剩 {=left} {unit}。']:['第二次后保留其开始时的 {keep2}，所以之前有 {=afterFirst} {unit}。','第一次后保留最初的 {keep1}，所以最初有 {=start} {unit}。','核对：第一次用 {first} {unit}，第二次用 {second} {unit}，最终剩 {left} {unit}。'],frames:[bars('两次使用对应的整体',cell('最初','start','{start} {unit}'),cell('第一次用','first','{first} {unit}','change')),bars('第二次用量',cell('第二次用','second','{second} {unit}','change'),cell('最终剩余','left','{left} {unit}')),bars('总量核对',{label:'最初总量',parts:[{size:{$:'first'},caption:'第一次 {first} {unit}',role:'change'},{size:{$:'second'},caption:'第二次 {second} {unit}',role:'change'},{size:{$:'left'},caption:'剩余 {left} {unit}',role:'whole'}]})]}],misconceptions:original?[{expr:mul('start',sub(1,div(1,'d1')),sub(1,div(1,'d2'))),feedback:'第二次的整体是最初总量，还是第一次后的剩余？'}]:[{expr:div('left',sub(sub(1,div(1,'d1')),div(1,'d2'))),feedback:'两次分数对应不同整体，不能直接相加为用掉的比例。'}]};
 }
 for(const enough of [false,true]){
  const key=enough?'packs-enough':'packs-exact';
  models[key]={model:'finite-purchase',reasoningKey:enough?'minimum-under-lower-bound':'minimum-under-equality',topics:['R02'],level:2,title:'买画笔',inputs:['size','single','pack','count'],inputChecks:[...domains('size','single','pack','count'),['ge','size',2],['gt','single',0],['gt','pack',0],['lt','pack',mul('size','single')],['gt','count','size'],['le','count',40]],derive:[['limit',['ceil',div('count','size')]],['singleTotal',mul('count','single')]],search:{variable:'packs',from:0,to:'limit',derive:[['singles',enough?['max',0,sub('count',mul('packs','size'))]:sub('count',mul('packs','size'))],['bought',add(mul('packs','size'),'singles')],['cost',add(mul('packs','pack'),mul('singles','single'))]],checks:[['ge','singles',0],[enough?'ge':'eq','bought','count']],objective:'cost',columns:['packs','singles','bought','cost']},target:'cost',contexts:{brushes:enough?'画笔单支 {single} 元，{size} 支装每包 {pack} 元。可以混合买，至少要买够 {count} 支，允许多买。最少花多少元？':'画笔单支 {single} 元，{size} 支装每包 {pack} 元。可以混合买，必须恰好买 {count} 支。最少花多少元？',seedlings:enough?'树苗单棵 {single} 元，{size} 棵装每包 {pack} 元。至少要买够 {count} 棵，允许多买。最少花多少元？':'树苗单棵 {single} 元，{size} 棵装每包 {pack} 元。必须恰好买 {count} 棵。最少花多少元？'},diagram:table('购买条件',[['单{unit}','{single} 元'],['每包数量','{size} {unit}'],['每包费用','{pack} 元'],['数量要求',enough?'至少 {count} {unit}':'恰好 {count} {unit}']]),hints:['便宜的整包必须同时满足数量要求，先列出合法包数。',enough?'除了恰好买够的方案，再检查多买一整包是否更省。':'每多买一包，单买数量要相应减少；不允许超出所需数量。'],methods:[{name:'比较合法购买方案',steps:[enough?'从0包开始，一直到 {limit} 包已经足够；超过这个包数只会增加费用。':'包数从0开始检查，到 {limit} 包；超过所需数量的方案应排除。','每个方案的费用＝包数×{pack}＋单买数×{single}，比较所有合法方案。','最低费用为 {cost} 元，例如{purchasePlan}。'],frames:[table('按同一个数量要求列方案',[['需要','{count} {unit}'],['规则',enough?'可以多买':'必须恰好']]),{kind:'rule-candidates',title:'全部合法包数与费用'},bars('比较后确定最低费用',cell('最低费用','cost','{cost} 元'),cell('全部单买','singleTotal','{singleTotal} 元','change'))]}],misconceptions:[{expr:'singleTotal',feedback:'检查是否存在费用更低的整包与单买组合。'},{expr:mul('limit','pack'),feedback:'核对这个整包方案是否满足数量要求，以及是否真的最省。'}]};
 }
 // Frame order follows each configuration's actual steps.
 models['fraction-reverse'].methods[0].frames=[
  bars('先还原第二次使用之前',{label:'第一次后',parts:[{size:{$:'second'},caption:'第二次用 {second} {unit}',role:'change'},{size:{$:'left'},caption:'最后剩 {left} {unit}',role:'whole'}]}),
  bars('再还原最初的整体',{label:'最初',parts:[{size:{$:'first'},caption:'第一次用 {first} {unit}',role:'change'},{size:{$:'afterFirst'},caption:'第一次后 {afterFirst} {unit}',role:'whole'}]}),
  models['fraction-reverse'].methods[0].frames[2]
 ];
 models['ratio-length'].methods[0].frames=[
  bars('一条长加一条宽对应半周长',cell('半周长','half','{=half} 米')),
  table('长度与份数对应',[['长宽份数和','{a}+{b}={parts}'],['一份','{=unit} 米']]),
  bars('所求的长',cell('长','length','{b} 份 → {length} 米'))
 ];
 models['weighted-score'].methods[0].frames=[
  table('代表队员的总分',[['人数份数','{a}+{b}={people}'],['全体总分','{=total}']]),
  bars('从全体总分扣出乙队',cell('全体总分','total','{total}'),cell('乙队总分','blue','{=blue}'),cell('甲队总分','red','{=red}','change')),
  bars('由甲队份数还原每人得分',cell('甲每人','low','{=low} 分'))
 ];
 for(const [key,def]of Object.entries(models)){
  if(def.model==='joined-length')def.contextMeta={panels:{title:key==='join-closed'?'拼接的软塑料环':key==='join-piece'?'同长的展示板':'拼接的展示板',unit:'厘米'},ribbon:{title:key==='join-closed'?'拼接的彩带环':key==='join-piece'?'同长的彩带':'拼接的彩带',unit:'厘米'}};
  if(def.model==='fraction-wholes')def.contextMeta={supplies:{title:'两次使用手工纸',unit:'张'},water:{title:'两次使用水量',unit:'升'}};
  if(def.model==='finite-purchase')def.contextMeta={brushes:{title:'买画笔',item:'画笔',unit:'支'},seedlings:{title:'买树苗',item:'树苗',unit:'棵'}};
 }
 return models;
})();
if(typeof module!=='undefined')module.exports=COMPETITION_RULE_MODELS;


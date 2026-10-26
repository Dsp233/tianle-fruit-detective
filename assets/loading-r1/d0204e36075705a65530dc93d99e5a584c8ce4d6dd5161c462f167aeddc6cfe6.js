'use strict';
const CompetitionRules=((rel,models,h)=>{
 const {competitionRng:rng,competitionNumericOptions:numericOptions}=h;
 const value=v=>rel.decimal(rel.number(typeof v==='string'&&!v.includes('/')?Number(v):v));
 const A=(...x)=>['add',...x],S=(a,b)=>['sub',a,b],M=(...x)=>['mul',...x],D=(a,b)=>['div',a,b];
 const partners={'join-open':'join-closed','join-closed':'join-open','join-piece':'join-closed','posts-both':'posts-neither','posts-neither':'posts-both','weighted-mean':'weighted-score','weighted-score':'weighted-mean','ratio-length':'ratio-perimeter','ratio-perimeter':'ratio-length','fraction-reverse':'fraction-original','fraction-original':'fraction-reverse','packs-exact':'packs-enough','packs-enough':'packs-exact'};
 const tweaks={'weighted-mean':{mean:A('mean',D('a','people'))},'weighted-score':{low:A('low',1)},'ratio-length':{width:M('width',2)},'ratio-perimeter':{perimeter:M('perimeter',2)}};
 function parameters(key,r,generatorRevision=1){
  const d=models[key];let p,context;
  if(d.model==='joined-length'){const n=3+r(3),piece=18+r(15),lap=1+r(4);p={n,piece,lap,total:n*piece-(n-1)*lap};context=r(2)?'panels':'ribbon'}
  if(d.model==='interval-endpoints'){const gap=3+r(8),intervals=3+r(7);p={distance:gap*intervals,gap};context='trail'}
  if(d.model==='weighted-total'){const a=1+r(3),b=a+1+r(3),low=6+r(10),high=low+2+r(8);p={a,b,low,high,mean:rel.format(rel.evaluate(D(A(M('a','low'),M('b','high')),A('a','b')),{a:rel.q(a),b:rel.q(b),low:rel.q(low),high:rel.q(high)}))};context='teams'}
  if(d.model==='ratio-perimeter'){const a=1+r(3),b=a+1+r(3),unit=2+r(7);p={a,b,width:a*unit,perimeter:2*(a+b)*unit};context='enclosure'}
  if(d.model==='fraction-wholes'){const d1=2+r(3),d2=3+r(3),k=2+r(8);p={d1,d2,start:d1*d2*k,left:(d1-1)*(d2-1)*k};context=key==='fraction-original'?'water':r(2)?'supplies':'water'}
  if(d.model==='finite-purchase'&&generatorRevision===1){const size=3+r(3),single=3+r(6),pack=size*single-1-r(single),count=size+2+r(15);p={size,single,pack,count};context=r(2)?'brushes':'seedlings'}
  // Revision 1 must consume the same RNG calls to replay every RC65 recipe.
  // New recipes sample reviewed decision cases; classification is independently
  // checked by exhaustive purchase plans in the test, not by this case label.
  if(d.model==='finite-purchase'&&generatorRevision===2){
   const size=3+r(3),single=3+r(6),decision=r(4),quotient=2+r(3);
   const remainder=decision===3?0:decision===2?1+r(size-1):size-1;
   const pack=decision===0?(size-2)*single+1+r(single-1):decision===1?(size-1)*single:(size-1)*single+1+r(single-1);
   p={size,single,pack,count:quotient*size+remainder};context=r(2)?'brushes':'seedlings';
  }
  return {params:Object.fromEntries(d.inputs.map(k=>[k,p[k]])),context};
 }
 function options(answer,misconceptions,r){const out=[];for(const v of [answer,...misconceptions.map(m=>m.value),...numericOptions(answer,r)]){const n=value(v);if(Number.isFinite(n)&&n>=0&&!out.some(x=>Math.abs(value(x)-n)<1e-12))out.push(String(v));if(out.length===5)break}if(out.length!==5)throw Error('Five distinct choices unavailable');for(let i=4;i>0;i--){const j=r(i+1);[out[i],out[j]]=[out[j],out[i]]}return out}
 function create(key,params,context,r=rng(1)){
  const def=models[key];if(!def)throw Error('Unknown rule');const c=rel.compile(def,params,context),next=partners[key],env={...c.env};
  for(const [name,e]of Object.entries(tweaks[key]||{}))env[name]=rel.evaluate(e,env);
  const nextDef=models[next],nextParams=Object.fromEntries(nextDef.inputs.map(k=>[k,rel.format(env[k])]));
  let nextContext=context;
  if(nextDef.model==='fraction-wholes'&&context==='supplies'){
   const proposed=rel.bind(nextDef,nextParams).env;
   if(['start','first','second','left'].some(k=>proposed[k]?.d!==1))nextContext='water';
  }
  const changed=rel.compile(nextDef,nextParams,nextContext);
  function attachCandidates(x){for(const method of x.methods)for(const frame of method.frames)if(frame?.kind==='rule-candidates'){frame.rows=x.candidateRows.map(row=>[row.packs,row.singles,row.bought,row.cost]);frame.headers=['包数','单买数','总数量','费用']}}
  attachCandidates(c);attachCandidates(changed);
  return {family:'rule-'+key,title:c.title,strategy:def.reasoningKey,reasoningKey:def.reasoningKey,structureKey:def.model+':'+key,answer:c.answer,options:options(c.answer,c.misconceptions,r),prompt:c.prompt,
   math:{ruleVersion:1,variant:key,context,params},diagram:c.diagram,methods:c.methods,ruleHints:c.hints,hintDiagram:c.hintDiagram,misconceptions:c.misconceptions,
   relationModel:{key:def.model,variant:key,target:def.target,inputs:def.inputs,relations:def.derive||[],search:def.search||null},
   extension:{prompt:(context==='panels'&&def.model==='joined-length'&&next==='join-closed'?'换成同样长度的软塑料条，并改变连接方式：':'条件变化：')+changed.prompt,answer:changed.answer,solution:changed.methods[0].steps.join(' '),kind:'condition-change',key:'rules-v1:'+next+':'+JSON.stringify(nextParams),topicIds:nextDef.topics,math:{variant:next,context:nextContext,params:nextParams},diagram:changed.diagram,solutionFrames:changed.methods[0].frames},
   ruleEvidence:{model:def.model,variant:key,next,changeKind:'goal-or-condition'}};
 }
 const catalog=Object.entries(models).map(([key,def])=>({id:'rule-'+key,topicIds:def.topics,level:def.level,title:def.title,strategy:def.reasoningKey,reasoningKey:def.reasoningKey,structureKey:def.model+':'+key,insight:def.hints[0],origin:'rc65-rules',build(seed,generatorRevision=1){const r=rng(seed),p=parameters(key,r,generatorRevision);return create(key,p.params,p.context,r)}}));
 const cell=(label,amount,caption,role='whole')=>({label,parts:[{size:{$:amount},caption,role}]});
 const bars=(title,...rows)=>({kind:'rule-bars',title,rows});
 const grid=(focus)=>({kind:'rule-border',n:{$:'n'},focus,title:'同一边框中的新增与原有部分'});
 const adapters={
  squareBorder:{reasoningKey:'difference-and-disjoint-parts',params:m=>({n:m.n}),def:{inputs:['n'],derive:[['outer',A('n',2)],['old', ['pow','n',2]],['whole',['pow','outer',2]],['added',S('whole','old')],['partial',S(['pow',A('n',1),2],'old')]],target:'added'},variation:'partial',hints:['先想一想，题目求整个大阵，还是增加的那一圈？','可以只数新增部分；如果分成几条边，要检查角是否重复。'],frames:[grid('whole'),grid('added')],hintDiagram:{kind:'rule-border',n:{$:'n'},focus:'given',title:'原有方阵外加一圈，先找新增部分。'}},
  chartScale:{reasoningKey:'scale-and-total',params:m=>({a:m.a,b:m.b,c:m.c,known:m.a*m.unit}),def:{inputs:['a','b','c','known'],derive:[['unit',D('known','a')],['height',A('b','c')],['total',M('height','unit')],['increment',M(3,'unit')]],target:'total'},variation:'increment',hints:['先确定一格表示多少人。','合并乙丙的格数，再用同一个刻度转换人数。'],frames:[bars('由甲确定同一刻度',cell('甲人数','known','{a} 格 → {known} 人')),bars('格数与人数对应',cell('乙丙人数','total','{height} 格 → {total} 人'))]},
  missingAverage:{reasoningKey:'weighted-total',params:m=>({count:m.count,mean:m.mean,other:m.other}),def:{inputs:['count','mean','other'],derive:[['remaining',S('count',1)],['old',M('count','mean')],['rest',M('remaining','other')],['removed',S('old','rest')],['baseline',M('remaining','mean')],['deviation',M('remaining',S('mean','other'))],['variation',D(A('old','removed'),A('count',1))]],target:'removed'},variation:'variation',hints:['平均数和人数一起，能确定什么总量？','比较删去前后的总和，或比较相对于原平均的偏差。'],frames:[bars('平均数先转换为总和',cell('原总和','old','{count} 个，合计 {old}'),cell('余下总和','rest','{remaining} 个，合计 {rest}')),bars('原总和由剩下与删去两部分组成',{label:'原总和',parts:[{size:{$:'rest'},caption:'余下 {rest}',role:'whole'},{size:{$:'removed'},caption:'删去 {removed}',role:'change'}]})]},
  fractionBackwards:{reasoningKey:'inverse-changing-wholes',params:m=>({d1:2,d2:3,left:m.left}),def:models['fraction-reverse'],variationDef:{inputs:['start'],derive:[['remaining',D('start',6)]],target:'remaining'},hints:models['fraction-reverse'].hints},
  packPrice:{reasoningKey:'minimum-under-equality',params:m=>({size:3,single:m.single,pack:m.pack,count:m.count}),def:models['packs-exact'],variationDef:models['packs-enough'],hints:models['packs-exact'].hints},
  transferBetweenBoxes:{reasoningKey:'difference-and-conservation',params:m=>({a:m.a,b:m.b,moved:m.moved}),def:{inputs:['a','b','moved'],derive:[['difference',M(2,'moved')],['parts',S('b','a')],['unit',D('difference','parts')],['first',M('a','unit')],['second',M('b','unit')],['equal',A('first','moved')],['external',S('difference','moved')]],target:'first'},variation:'external',hints:['一次转移时，两盒各自怎样改变？','原来的数量差，对应的是转移数量的一倍还是两倍？'],frames:[bars('转移同时改变两边',cell('原来甲','first','{first} 块'),cell('原来乙','second','{second} 块')),bars('差与份数对应',cell('原来的差','difference','{parts} 份 → {difference} 块','change'),cell('一份','unit','{unit} 块')),bars('转移后相等，核对总量',cell('甲移后','equal','{equal} 块'),cell('乙移后','equal','{equal} 块'))]}
 };
 // Each old route receives frames for its own reasoning order, while its
 // wording, options and mathematical identity remain unchanged.
 const routeFrames={
  squareBorder:env=>[[grid('whole'),grid('added')],[{...grid('sides'),title:'上、下各 {outer} 块；左、右不重复角，各 {n} 块'},grid('added')]],
  chartScale:env=>[null,[{kind:'rule-table',title:'先比较柱高',rows:[['甲','{a} 格'],['乙丙','{height} 格'],['乙丙是甲的','{height}/{a} 倍']]},bars('同刻度下，人数随柱高同比变化',cell('甲','known','{known} 人'),cell('乙丙','total','{total} 人'))]],
  missingAverage:env=>[null,[bars('余下各数相对原平均的合计',cell('按原平均计','baseline','{remaining}×{mean}={baseline}'),cell('实际合计','rest','{remaining}×{other}={rest}')),bars('删去的数补足同样的偏差',{label:'删去的数',parts:[{size:{$:'mean'},caption:'原平均 {mean}',role:'whole'},{size:{$:'deviation'},caption:'补偿 {deviation}',role:'change'}]})]],
  fractionBackwards:env=>[[bars('先还原第二天开始的整体',{label:'第二天开始',parts:[{size:{$:'second'},caption:'第二天用 {second}',role:'change'},{size:{$:'left'},caption:'剩余 {left}',role:'whole'}]}),bars('再还原最初的整体',{label:'最初',parts:[{size:{$:'first'},caption:'第一天用 {first}',role:'change'},{size:{$:'afterFirst'},caption:'第一天后 {afterFirst}',role:'whole'}]})],[bars('把最初的六份对应到两次使用',{label:'最初的六份',parts:[{size:{$:'first'},caption:'第一天 3 份：{first}',role:'change'},{size:{$:'second'},caption:'第二天 1 份：{second}',role:'change'},{size:{$:'left'},caption:'最后 2 份：{left}',role:'whole'}]}),bars('由剩余的两份还原六份',cell('2 份','left','{left} 枚'),cell('6 份','start','{start} 枚'))]],
  packPrice:env=>[[{kind:'rule-table',title:'每包替代同样数量的单买',rows:[['{size} 支单买',rel.format(rel.evaluate(M('size','single'),env))+' 元'],['一包','{pack} 元'],['每替换一包省',rel.format(rel.evaluate(S(M('size','single'),'pack'),env))+' 元']]},bars('最低费用对应的恰好方案',cell('最低费用','cost','{packs} 包＋{singles} 支，共 {cost} 元'))],null],
  transferBetweenBoxes:env=>[[bars('转移让两边的差同时缩小',{label:'原来的差',parts:[{size:{$:'moved'},caption:'乙减少 {moved}',role:'change'},{size:{$:'moved'},caption:'甲增加 {moved}',role:'change'}]}),bars('差与份数对应',cell('原来的差','difference','{parts} 份 → {difference} 块'),cell('一份','unit','{unit} 块')),bars('原来甲的份数确定其数量',cell('原来甲','first','{a} 份 → {first} 块'))]]
 };
 function decorate(c,id){
  const a=adapters[id];if(!a)return c;const p=a.params(c.math),bound=rel.bind(a.def,p),env=bound.env;
  if(Math.abs(value(bound.answer)-value(c.answer))>1e-10)throw Error('Legacy rule mismatch '+id);
  const variation=a.variationDef?rel.bind(a.variationDef,Object.fromEntries(a.variationDef.inputs.map(k=>[k,rel.format(env[k])]))).answer:rel.format(env[a.variation]);
  if(Math.abs(value(variation)-value(c.extension.answer))>1e-10)throw Error('Legacy transfer mismatch '+id);
  let frames=a.frames?.map(f=>rel.material(f,env));
  if(a.def.contexts){const compiled=rel.compile(a.def,p,id==='fractionBackwards'?'water':'brushes');frames=compiled.methods[0].frames;for(const f of frames)if(f?.kind==='rule-candidates'){f.headers=['包数','单买数','总数量','费用'];f.rows=compiled.candidateRows.map(row=>[row.packs,row.singles,row.bought,row.cost])}}
  const perRoute=routeFrames[id]?.(env)||[];
  c.methods=c.methods.map((m,route)=>{const selected=perRoute[route]?perRoute[route].map(f=>rel.material(f,env)):frames;return {...m,frames:m.steps.map((_,i)=>selected[Math.min(i,selected.length-1)])}});
  c.ruleHints=a.hints.map(h=>rel.text(h,env));c.hintDiagram=a.hintDiagram?rel.material(a.hintDiagram,env):null;c.reasoningKey=a.reasoningKey;c.structureKey='legacy:'+id;
  c.relationModel={key:'legacy:'+id,target:a.def.target,inputs:a.def.inputs,relations:a.def.derive||[],search:a.def.search||null};return c;
 }
 return {catalog,models,adapters,create,decorate,parameters,reasoningKey:id=>adapters[id]?.reasoningKey};
})(typeof module!=='undefined'?require('./competition_relations'):CompetitionRelations,typeof module!=='undefined'?require('./competition_rule_models'):COMPETITION_RULE_MODELS,typeof module!=='undefined'?require('./competition'):{competitionRng,competitionNumericOptions});
if(typeof module!=='undefined')module.exports=CompetitionRules;

'use strict';
// Rendering quantities are explicit. This adapter never rewrites legacy maths
// signatures or seed recipes. Unsupported legacy changes stay marked partial.
const ProblemState=(()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 function create(c,f,variation=false){
  const id=f.id,base=copy(c.math),math=copy(variation&&c.extension.math||c.math);
  const state={schemaVersion:1,id:id+(variation?':variation':':main'),familyId:id,kind:variation?'variation':'main',math,baseMath:base,question:variation?c.extension.prompt:c.prompt,goal:f.qualityPolicy?.goal||id,units:{},relations:[],projection:{},adapterStatus:variation&&!c.extension.math?'legacy-change-not-normalized':'explicit'};
  if(['exactlyOneSet','setOutside','natural-unionChance','natural-complementChance','ratioUnion'].includes(id)){
   let a=base.a??base.red,b=base.b??base.blue,both=base.both,total=base.total??null;
   if(variation&&id==='exactlyOneSet'){b++;both++}
   if(variation&&id==='setOutside'){a++;b++;both++}
   state.projection.sets={a,b,both,total};state.units.members='人';
   if(['exactlyOneSet','setOutside'].includes(id)){state.math={...base,a,b,both,total};state.adapterStatus='explicit'}
  }
  if(id==='adjacentLine'){
   state.math={...base,adjacent:!variation};state.projection.line=variation?['乐','人','明',...Array.from({length:base.n-3},()=> '人')]:['乐','明',...Array.from({length:base.n-2},()=> '人')];state.adapterStatus='explicit';
  }
  if(['natural-digitCount','natural-distinctDigitCount'].includes(id)){
   state.math={...base,distinct:variation?!base.distinct:base.distinct};state.projection.repeat=!state.math.distinct;state.adapterStatus='explicit';
  }
  if(['equalDistanceSpeed','riverTravel','natural-catch'].includes(id))state.units.speed=id==='natural-catch'?'米/分钟':'千米/时';
  if(id==='recurrenceBackwards')state.projection.termIndices=[1,2,'…',base.n-1,base.n];
  if(id==='rule-ratio-length')state.goal='length';
  if(id==='threeGroupBalance'){
   state.goal={quantityId:id+':'+math.goal,object:({A:'甲组',B:'乙组',C:'丙组'})[math.goal],unit:'人'};state.units.members='人';
   state.relations=[{id:id+':total',inputs:['A','B','C'],operator:'sum',knownValue:math.T},{id:id+':difference',inputs:['A','B'],operator:'difference',knownValue:math.direction*math.d},{id:id+':multiple',inputs:['C',math.ref],operator:'multiple',knownValue:math.k}];
  }
  state.quantityIds=Object.keys(math.params||math).map(key=>({id:id+':'+state.kind+':'+key,key}));
  state.answerContract={kind:'exact-rational',value:variation?c.extension.answer:c.answer,unit:state.units.members||'',allowApproximation:false};
  return state;
 }
 function arithmetic(text){
  const s=String(text).trim().replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  if(!s||s.length>160||!/^[\d\s.+\-*/()]+$/.test(s))return null;
  const tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()]/g)||[];if(tokens.join('')!==s.replace(/\s/g,''))return null;let at=0;
  const pair=(n,d=1n)=>{if(d===0n)throw Error('Zero divisor');return [n,d]},calc=(a,b,op)=>op==='+'?pair(a[0]*b[1]+b[0]*a[1],a[1]*b[1]):op==='-'?pair(a[0]*b[1]-b[0]*a[1],a[1]*b[1]):op==='*'?pair(a[0]*b[0],a[1]*b[1]):pair(a[0]*b[1],a[1]*b[0]);
  function atom(){const t=tokens[at++];if(t==='+'||t==='-'){const a=atom();return [t==='-'?-a[0]:a[0],a[1]]}if(t==='('){const a=expr();if(tokens[at++]!==')')throw Error('Unclosed');return a}if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t||''))throw Error('Not numeric');const [n,f='']=t.split('.');return pair(BigInt((n||'0')+f),10n**BigInt(f.length))}
  function product(){let a=atom();while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++];a=calc(a,atom(),op)}return a}
  function expr(){let a=product();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++];a=calc(a,product(),op)}return a}
  try{const a=expr();return at===tokens.length?a:null}catch{return null}
 }
 function equal(a,b){const x=arithmetic(a),y=arithmetic(b);return !!x&&!!y&&x[0]*y[1]===y[0]*x[1]}
 return {create,arithmetic,equal};
})();
if(typeof module!=='undefined')module.exports=ProblemState;

'use strict';
// Current variants have their own conditions, target and quantity domain.
// Original recipe maths is immutable; this module does not rewrite signatures.
const VariationState=((h,math)=>{
 const F=h.competitionFraction,copy=x=>JSON.parse(JSON.stringify(x)),sum=a=>a.reduce((s,x)=>s+x,0),num=x=>String(x).split('/').map(Number).reduce((a,b)=>a/b);
 const fact=n=>{let v=1;for(let i=2;i<=n;i++)v*=i;return v};
 const choose=(n,k)=>{if(k<0||k>n)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return v};
 const gcd=(a,b)=>{while(b)[a,b]=[b,a%b];return a},lcm=(a,b)=>a*b/gcd(a,b);
 const sequence=(a,b,n)=>{const s=[a,b];while(s.length<n)s.push(s.at(-1)+s.at(-2));return s};
 const productMin=(a,k)=>{let best=Infinity;function visit(i,left,p){if(!left){best=Math.min(best,p);return}for(let j=i;j<=a.length-left;j++)visit(j+1,left-1,p*a[j])}visit(0,k,1);return best};
 const modPower=(a,k,m)=>{let v=1;while(k){if(k%2)v=v*a%m;a=a*a%m;k=Math.floor(k/2)}return v};
 function describe(c,f,revision){
  if(c.extension.key==='remove-high-to-target-v2'){const p=c.extension.problemState.math;let k=0;while(k<=p.highCount&&(p.count-k<=0||p.total-p.score*k>p.target*(p.count-k)))k++;return finalize(f.id,'population-removal',p,'removed-members',k,'人',['Numerator and denominator both change','Bounded integer removal']);}
  if(c.integrated){const e=c.extension;return finalize(f.id,e.key,e.problemState.math,e.problemState.goal.id,e.answer,e.problemState.goal.unit||'',['Changed goal or constraint']);}
  const id=f.id,m=c.math,v=c.extension.math||{},key=c.extension.key;let p,goal,value,unit='',model,conditions=[];
  const set=(type,parameters,target,result,u='',rules=[])=>{model=type;p=parameters;goal=target;value=String(result);unit=u;conditions=rules};
  if(c.configurationId&&id==='threeGroupBalance'){
   const q=v,extra=q.direction*q.d*(q.ref==='A'?q.k+1:1),B=(q.T-extra)/(q.k+2),A=B+q.direction*q.d,C=q.k*(q.ref==='A'?A:B);
   if(![A,B,C].every(x=>Number.isInteger(x)&&x>0))throw Error('Invalid discrete group variant');
   set('three-group-reference',{T:q.T,d:q.d,k:q.k,direction:q.direction,reference:q.ref,targetGroup:q.goal},'group-'+q.goal,({A,B,C})[q.goal],'人',['A+B+C=T','A-B=direction*d','C=k*reference']);
  }else if(c.configurationId&&id==='signedProduct')set('signed-card-product',{cards:v.cards,choose:2},'minimum-product',productMin(v.cards,2),'',['Distinct card positions','Exactly two cards']);
  else if(c.configurationId&&id==='digitDivisor'){
   const q=v;let count=0;for(let n=q.lo+1;n<q.hi;n++){const u=n%10;if(u&&n%u===0&&n%2===0)count++}
   set('strict-digit-divisor',{lower:q.lo,upper:q.hi,lowerIncluded:false,upperIncluded:false,zeroDivisorAllowed:false,evenOnly:true},'legal-count',count,'个',['Two-digit integers','Nonzero unit digit divides number','Even integer']);
  }else if(c.configurationId&&id==='lShapeArea')set('hidden-L-perimeter',{inner:m.inner,border:m.border,regionSide:m.inner+m.border},'shaded-boundary',4*(m.inner+m.border),'长度单位',['Boundary replaces removed inner edges','Area and perimeter are different targets']);
  else if(c.configurationId&&id==='overlapAverages'){const values=v.values,front=sum(values.slice(0,5)),back=sum(values.slice(4)),all=sum(values);set('overlap-averages',{frontMean:F(front,5),backMean:F(back,5),allMean:F(all,9),n:9,segmentSize:5,middlePosition:5},'middle-number',front+back-all,'',['First and last five overlap only at position five'])}
  else if(id.startsWith('rule-')){
   const q=Object.fromEntries(Object.entries(v.params).map(([k,x])=>[k,num(x)])),type=v.variant;
   if(type.startsWith('join-')){const joins=type==='join-closed'?q.n:q.n-1;set('joined-length',{...q,closed:type==='join-closed',joinCount:joins},type==='join-piece'?'piece-length':'joined-length',type==='join-piece'?F(q.total+joins*q.lap,q.n):q.n*q.piece-joins*q.lap,'厘米',['Each join removes one overlap length'])}
   else if(type.startsWith('posts-'))set('interval-endpoints',{...q,includeBothEnds:type==='posts-both'},'marker-count',q.distance/q.gap+(type==='posts-both'?1:-1),'个',['Equal whole intervals','Endpoint inclusion changes marker count']);
   else if(type==='weighted-mean')set('weighted-average',q,'mean-score',F(q.a*q.low+q.b*q.high,q.a+q.b),'分',['Scores are weighted by representative population parts']);
   else if(type==='weighted-score'){const [a,d=1]=String(v.params.mean).split('/').map(Number);set('weighted-score',q,'low-score',F(a*(q.a+q.b)-q.b*q.high*d,d*q.a),'分',['Representative total minus known group total'])}
   else if(type==='ratio-length')set('ratio-perimeter',q,'length',F(q.perimeter*q.b,2*(q.a+q.b)),'米',['Two lengths and two widths make perimeter']);
   else if(type==='ratio-perimeter')set('ratio-perimeter',q,'perimeter',F(2*q.width*(q.a+q.b),q.a),'米',['A width has a parts; length has b parts']);
   else if(type==='fraction-reverse')set('fraction-wholes',{...q,secondWhole:'remainder'},'original-amount',F(q.left*q.d1*q.d2,(q.d1-1)*(q.d2-1)),v.context==='supplies'?'张':'升',['Second fraction uses first remainder']);
   else if(type==='fraction-original')set('fraction-wholes',{...q,secondWhole:'original'},'remaining-amount',F(q.start*(q.d1*q.d2-q.d1-q.d2),q.d1*q.d2),v.context==='supplies'?'张':'升',['Both fractions use original amount']);
   else if(type==='fraction-of-used')set('fraction-wholes',{...q,secondWhole:'first-used'},'remaining-amount',F(q.start*(q.d1*q.d2-q.d2-1),q.d1*q.d2),v.context==='supplies'?'张':'升',['Second fraction uses first used amount']);
   else if(type.startsWith('packs-')){let best=Infinity;for(let n=0;n<=Math.ceil(q.count/q.size);n++){const remaining=q.count-n*q.size;if(type==='packs-only-exact'){if(remaining===0)best=Math.min(best,n*q.pack)}else if(type==='packs-exact'){if(remaining>=0)best=Math.min(best,n*q.pack+remaining*q.single)}else best=Math.min(best,n*q.pack+Math.max(0,remaining)*q.single)}set('finite-purchase',{...q,requirement:type==='packs-enough'?'at-least':'exact',singleAllowed:type!=='packs-only-exact'},'minimum-cost',Number.isFinite(best)?best:0,'元',['Whole packages','Positive costs','No feasible exact plan uses result zero'])}
   else throw Error('Unregistered rule variant '+type);
  }else switch(id){
   case 'reverseDigits':set('place-value',{digitSum:m.a+m.b,digitDifference:m.a-m.b,order:'smaller'},'two-digit-number',10*m.b+m.a,'',['Both digits nonzero','Swapped sum is 11 times digit sum']);break;
   case 'fractionBackwards':set('fraction-wholes',{original:3*m.left,d1:2,d2:3,secondWhole:'original'},'remaining-amount',F(m.left,2),'枚',['Both uses refer to original total']);break;
   case 'percentRoundTrip':set('changing-percent-base',{original:m.start,increasePercent:m.percent,secondGoal:'restore-original',secondBase:'raised-price'},'decrease-percent',F(100*m.percent,100+m.percent),'%前的数',['Reduction amount is divided by raised price']);break;
   case 'squareBorder':set('partial-border',{originalSide:m.n,width:1,sides:['left','top'],cornerCount:1},'new-cells',2*m.n+1,'块',['Top-left added corner counted once']);break;
   case 'ratioEqualize':set('external-removal',{red:m.a*m.unit,blue:m.b*m.unit,removedBlue:(m.b-m.a)*m.unit},'remaining-total',2*m.a*m.unit,'个',['Red amount unchanged','Blue reduced externally']);break;
   case 'packPrice':{let best=Infinity;for(let k=0;k<=Math.ceil(m.count/3);k++)best=Math.min(best,k*m.pack+Math.max(0,m.count-3*k)*m.single);set('finite-purchase',{...m,size:3,requirement:'at-least'},'minimum-cost',best,'元',['Whole packages','Surplus allowed']);break}
   case 'equalDistanceSpeed':set('journey',{speeds:[m.speed,2*m.speed],equalQuantity:'time'},'mean-speed',F(3*m.speed,2),'千米/时',['Equal time, not equal distance']);break;
   case 'oppositeScale':set('area-scale',{lengthNumerator:m.b,lengthDenominator:m.a,bothSidesScale:true},'area-multiplier',F(m.b*m.b,m.a*m.a),'倍',['Area uses two length factors']);break;
   case 'balanceCancel':set('balance',{boxWeight:m.x,removedBoxes:1,removedSide:'right'},'added-mass',m.x,'克',['A removed box needs equal replacement mass']);break;
   case 'tickets':{const total=m.adults*m.adult+(m.people-m.adults)*m.child;let count=0;for(let a=0;a*m.adult<=total;a++)if((total-a*m.adult)%m.child===0)count++;set('integer-ticket-plans',{adultPrice:m.adult,childPrice:m.child,total,peopleConstraint:null,zeroAllowed:true},'plan-count',count,'种',['Nonnegative integer ticket counts']);break}
   case 'recurrenceBackwards':{const delta=sequence(1,0,m.n).at(-1);set('recurrence-increment',{firstIncrease:1,secondIncrease:0,termCount:m.n,rule:'sum-previous-two'},'last-increase',delta,'',['Delta follows same recurrence']);break}
   case 'linearTable':set('ordered-machine',{multiplier:m.k,addition:m.b,input:m.target,order:'add-then-multiply'},'output',(m.target+m.b)*m.k,'',['Fixed constants preserved; operation order changes']);break;
   case 'divisibleDigits':{let max=0;for(let b=0;b<10;b++)for(let d=0;d<10;d+=2){const n=1000*m.a+100*b+10*m.b+d;if(n%9===0)max=Math.max(max,n)}set('digit-constraints',{thousands:m.a,tens:m.b,divisors:[9,2]},'maximum-number',max,'',['Four digits','Unknown hundreds and units']);break}
   case 'factorBalance':set('factor-pairs',{product:m.product,positiveIntegers:true,objective:'maximum-sum'},'factor-sum',m.product+1,'',['All positive factor pairs']);break;
   case 'bells':set('period-events',{periods:[m.a,m.b],start:0,end:lcm(m.a,m.b),includeStart:true,includeEnd:true},'simultaneous-count',2,'次',['Both boundaries included']);break;
   case 'lastDigit':set('last-digit',{base:m.base,exponents:[m.exponent,m.exponent+1],combine:'sum'},'units-digit',(modPower(m.base,m.exponent,10)+modPower(m.base,m.exponent+1,10))%10,'',['Add the two units before reducing modulo ten']);break;
   case 'fixedPerimeter':{const min=revision>=3?v.minSide:2,half=m.half,areas=[];for(let a=min;a<=half-min;a++)if(revision>=3||a%2===0&&(half-a)%2===0)areas.push(a*(half-a));set('integer-rectangle',{halfPerimeter:half,minSide:min,evenOnly:revision<3,objective:revision>=3?'minimum-area':'maximum-area'},'area',revision>=3?Math.min(...areas):Math.max(...areas),'面积单位',['Both sides positive and satisfy bounds']);break}
   case 'outsideAngle':set('isosceles-angle',{apex:m.apex,target:'other-base',knownExterior:90+m.apex/2},'base-angle',F(180-m.apex,2),'度',['Equal base angles']);break;
   case 'overlapSquares':set('square-overlap',{side:m.n,dx:m.dx,dy:m.dy,colorCoverage:'exactly-one'},'colored-area',2*(m.n*m.n-(m.n-m.dx)*(m.n-m.dy)),'面积单位',['Intersection removed from both sheets']);break;
   case 'circleRoute':set('cycle-cover',{segments:m.sectors,lengthPerSegment:m.unit,mustReturn:true,mustCoverAll:true},'shortest-distance',m.sectors*m.unit,'米',['At least one traversal per segment']);break;
   case 'similarAreaPerimeter':set('similar-scale',{perimeterMultiplier:m.b},'area-multiplier',m.b*m.b,'倍',['Length ratio squared']);break;
   case 'ladderShift':set('right-triangle',{hypotenuse:5*m.k,height:4*m.k},'base-distance',3*m.k,'米',['Same ladder length']);break;
   case 'paintedCube':set('painted-cube',{n:m.n,paintedFaces:['top','bottom'],exactPaintedFaceCount:1},'cube-count',2*m.n*m.n,'块',['Opposite faces do not share small cubes']);break;
   case 'exactlyOneSet':set('sets',{a:m.a,b:m.b+1,both:m.both+1},'exactly-one-count',m.a+m.b-2*m.both-1,'人',['One A-only person joins B']);break;
   case 'gridDetour':set('grid-routes',{w:m.w,h:m.h,excludedPoint:null,requiredFirstStep:'up'},'route-count',choose(m.w+m.h-1,m.w),'条',['Shortest right/up route']);break;
   case 'adjacentLine':set('line-arrangements',{n:m.n,specialPeople:2,adjacent:false},'arrangement-count',fact(m.n)-2*fact(m.n-1),'种',['People distinct','Special pair nonadjacent']);break;
   case 'restrictedTeam':set('team-selection',{n:m.n,teamSize:3,mandatoryPeople:2,roles:false},'team-count',m.n-2,'种',['Two mandatory people occupy two positions']);break;
   case 'digitComplement':set('passwords',{alphabetSize:10,length:m.length,targetDigit:m.digit,requiredOccurrences:1,leadingZeroAllowed:true},'password-count',m.length*9**(m.length-1),'个',['Exactly one position has target digit']);break;
   case 'chartScale':set('chart-increment',{originalHeights:[m.a,m.b,m.c],incrementEach:1,unit:m.unit},'population-increase',3*m.unit,'人',['Same scale for all three bars']);break;
   case 'missingAverage':{const omitted=m.count*m.mean-(m.count-1)*m.other;set('average-members',{remainingCount:m.count-1,remainingTotal:(m.count-1)*m.other,omitted,omittedCopies:2,newCount:m.count+1},'new-average',F((m.count-1)*m.other+2*omitted,m.count+1),'',['Duplicated omitted value changes numerator and denominator']);break}
   case 'diceSum':{let good=0;for(let a=1;a<=m.faces;a++){const b=m.target-a;if(b>=1&&b<=m.faces&&a!==b)good++}set('conditional-dice',{faces:m.faces,targetSum:m.target,different:true,sampleSize:m.faces*(m.faces-1)},'probability',F(good,m.faces*(m.faces-1)),'',['Ordered outcomes','Diagonal outcomes excluded']);break}
   case 'foldHoles':set('folded-holes',{interior:m.interior+1,edge:m.edge-1,center:m.center},'unfolded-count',4*(m.interior+1)+2*(m.edge-1)+m.center,'个',['Moved edge hole now has four symmetric copies']);break;
   case 'checkerDomino':set('domino-board',{w:m.w,h:m.h,removedCorners:['top-left','top-right']},'maximum-dominoes',(m.w*m.h-2)/2,'块',['Even board dimensions','Removed corners have opposite colors']);break;
   case 'natural-weighted':case 'natural-fractionWeighted':{const swap=revision>=3,red=swap?m.blue:2*m.red,blue=swap?m.red:m.blue;set('weighted-average',{red,blue,redScore:m.redScore,blueScore:m.blueScore,scoreDenominator:m.den,change:swap?'swap-population-parts':'double-red'},'mean-score',F(red*m.redScore+blue*m.blueScore,m.den*(red+blue)),'分',['Population weights change; scores unchanged']);break}
   case 'natural-catch':set('post-meeting-journey',{movingSpeed:m.slow,stationarySpeed:0,time:m.delay},'separation-distance',m.slow*m.delay,'米',['Fast walker stops after meeting']);break;
   case 'natural-tiles':{const w=2*m.w,h=2*m.h,s=gcd(w,h);set('square-tiling',{w,h,allowCut:false,side:s},'minimum-tiles',w*h/(s*s),'块',['Largest whole square side divides both dimensions']);break}
   case 'natural-pairChance':set('replacement-sampling',{red:m.red,blue:m.blue,draws:2,replacement:true},'two-red-probability',F(m.red*m.red,(m.red+m.blue)**2),'',['Independent draws after remix']);break;
   case 'natural-unionChance':case 'natural-complementChance':set('conditional-sets',{a:m.red,b:m.blue,both:m.both,total:m.total,condition:'union'},'both-given-union',F(m.both,m.red+m.blue-m.both),'',['Conditional denominator is union']);break;
   case 'natural-offers':set('price-threshold',{price:m.price,fee:m.fee,discountNumerator:3,discountDenominator:4,otherDiscountAmount:1,quantityDomain:'positive-integer'},'least-quantity',Math.ceil(4*m.fee/(m.price-4)),'件',['Compare whole orders','Round up to integer']);break;
   case 'natural-angleRatio':{const ratios=[...m.ratios,Math.max(...m.ratios)];set('polygon-angle-parts',{ratios,sides:4,totalAngle:360},'smallest-angle',F(360*Math.min(...ratios),sum(ratios)),'度',['Four interior angles']);break}
   case 'natural-digitCount':case 'natural-distinctDigitCount':{const distinct=!m.distinct;let count=0;for(const a of m.digits)for(const b of m.digits)if((!distinct||a!==b)&&(10*a+b)%3===0)count++;set('digit-choice',{digits:m.digits,distinct,divisor:3},'number-count',count,'个',['Digit repetition rule changed']);break}
   case 'natural-coordinateDistance':set('grid-distance',{start:[m.x,m.y],end:[m.x+m.dx,m.y+m.dy],allowedAxes:['horizontal','vertical']},'shortest-distance',Math.abs(m.dx)+Math.abs(m.dy),'长度单位',['No diagonal movement']);break;
   case 'routeProbability':set('uniform-grid-routes',{w:m.w,h:m.h,requiredFirstStep:'up',excludedPoint:null},'probability',F(m.h,m.w+m.h),'',['Complete shortest routes equiprobable']);break;
   case 'cubeProbability':set('conditional-painted-cube',{n:m.n,paintedFaces:6,condition:'at-least-one',targetPaintedFaces:2},'probability',F(12*(m.n-2),m.n**3-(m.n-2)**3),'',['Only boundary cubes form sample space']);break;
   case 'overlapProbability':set('square-overlap',{side:m.n,dx:m.dx,dy:m.dy,sample:'first-sheet'},'probability',F((m.n-m.dx)*(m.n-m.dy),m.n*m.n),'',['Sample space is one full first square']);break;
   case 'ratioUnion':set('set-ratio',{chess:m.a*m.unit,ball:m.b*m.unit+1,both:m.both+1,total:(m.a+m.b)*m.unit-m.both},'chess-over-ball',F(m.a*m.unit,m.b*m.unit+1),'',['One chess-only person joins ball group','Union unchanged','Original ratio no longer applies']);break;
   case 'chartAverage':{const counts=[...m.counts];counts[2]++;set('weighted-chart',{counts,scores:[2,4,6],newScore:6},'mean-score',F(counts[0]*2+counts[1]*4+counts[2]*6,sum(counts)),'分',['A new person joins top score bin']);break}
   case 'parityPermutations':{
    const odd=Math.ceil(m.n/2),even=Math.floor(m.n/2);
    if(c.configurationId==='first-odd-transfer')set('nonadjacent-evens-first-odd',{n:m.n,odd,even,distinct:true,firstParity:'odd',nonadjacent:'even'},'arrangement-count',fact(odd)*choose(odd,even)*fact(even),'种',['All evens occupy separate odd gaps','Leading gap is unavailable because the first number is odd']);
    else set('nonadjacent-odds',{n:m.n,odd,even,distinct:true},'arrangement-count',fact(even)*choose(even+1,odd)*fact(odd),'种',['All odd numbers placed in separate even gaps']);break}
   case 'recurrenceRemainders':{let a=2,b=2,total=0;for(let i=0;i<m.n;i++){total+=a%3;[a,b]=[b%3,(a+b)%3]}set('recurrence-remainders',{first:2,second:2,n:m.n,modulus:3},'remainder-sum',total,'',['Reduce each term before summing']);break}
   default:return describeMore(c,f,revision,set);
  }
  return finalize(id,model,p,goal,value,unit,conditions);
 }
 function finalize(id,model,p,goal,value,unit,conditions){return {schemaVersion:1,familyId:id,model,parameters:copy(p),goal:{id:id+':variation:'+goal,name:goal,unit},expectedAnswer:String(value),conditions:conditions.map((statement,i)=>({id:id+':variation:condition-'+(i+1),statement})),quantityDomain:unit||'dimensionless-exact'}}
 function describeMore(c,f,revision){
  const id=f.id,m=c.math,v=c.extension.math||{},set=(type,p,goal,value,unit='',rules=[])=>finalize(id,type,p,goal,value,unit,rules);
  switch(id){
   case 'digitInsert':{const s=String(10*m.a+m.b),candidates=[Number(String(m.d)+s),Number(String(m.a)+m.d+m.b),Number(s+m.d)];return set('digit-insertion',{originalDigits:[m.a,m.b],inserted:m.d,positions:3,objective:'minimum'},'number',Math.min(...candidates),'',['Original digit order preserved'])}
   case 'numberAppend':return set('place-value-prefix',{original:m.n,prefix:m.digit||1,originalDigits:2},'increase',100*(m.digit||1),'',['Two-digit original retains its value']);
   case 'pairedSum':{const k=Math.floor(m.n/2);return set('arithmetic-sum',{first:2,last:2*k,gap:2,count:k},'sum',k*(k+1),'',['Only even terms retained'])}
   case 'telescopingDifferences':return set('consecutive-differences',{start:m.start+m.step,step:m.step,terms:m.n-1},'sum',(m.n-1)*m.step,'',['First difference term omitted']);
   case 'neighborProducts':return set('neighbor-products',{center:m.n,offset:2},'difference',4,'',['Compare center square with symmetric product']);
   case 'fractionDifferentWholes':return set('separate-fraction-wholes',{firstWhole:m.a,secondWhole:m.b,firstUsedDenominator:4,secondUsedDenominator:3},'remaining-total',F(9*m.a+8*m.b,12),'颗',['Each fraction keeps its own box as whole']);
   case 'fractionSharedRemainder':{const original=12*m.unit;return set('fraction-wholes',{original,firstDenominator:3,externalAdded:m.add,secondNumerator:3,secondDenominator:8,secondWhole:'original'},'remaining-amount',F(7*original+24*m.add,24),'个',['External addition follows first use','Second use changes to original whole'])}
   case 'discountOrder':return set('ordered-price',{price:m.price,coupon:m.q,discountPercent:m.p,order:'coupon-then-percent'},'final-price',F((m.price-m.q)*(100-m.p),100),'元',['Percent applies after fixed coupon']);
   case 'percentRestore':{const percent=m.p===100?50:m.p;return set('restore-after-decrease',{originalReference:100,decreasePercent:percent,current:100-percent},'increase-percent',F(100*percent,100-percent),'%前的数',['Increase measured against decreased current price'])}
   case 'squareBounds':return set('square-root-bound',{number:m.n,direction:'upper-inclusive'},'integer',m.k*m.k===m.n?m.k:m.k+1,'',['Equality permitted at perfect square']);
   case 'signedProduct':{const cards=[-4*m.k,-3*m.k,-m.k,0,2*m.k,5*m.k];return set('signed-card-product',{cards,choose:2},'minimum-product',productMin(cards,2),'',['Two distinct cards'])}
   case 'ratioTotal':return set('external-addition',{red:m.a*m.u,blue:m.b*m.u,addedRed:m.b-m.a},'absolute-difference',Math.abs(m.b*m.u-m.a*m.u-(m.b-m.a)),'块',['Blue unchanged']);
   case 'linkedRatios':{const blue=m.b*m.c*m.u,green=m.b*m.d*m.u;return set('equalize-blue-green',{blue,green,changeOnly:'blue'},'adjustment',Math.abs(green-blue),'块',['Add if fewer; remove if more'])}
   case 'unitConversion':return set('capacity-units',{totalMilliliters:1000*m.liters,cupMilliliters:2*m.cup,wholeCupsOnly:true},'full-cups',Math.floor(1000*m.liters/(2*m.cup)),'杯',['Use same volume unit']);
   case 'mixedPacks':{let best=Infinity;for(let a=0;a<=Math.ceil(m.count/4);a++)for(let b=0;b<=Math.ceil(m.count/6);b++)if(4*a+6*b>=m.count)best=Math.min(best,a*m.p+b*m.q);return set('finite-purchase',{sizes:[4,6],prices:[m.p,m.q],count:m.count,requirement:'at-least',singleAllowed:false},'minimum-cost',best,'元',['Whole package types','Surplus allowed'])}
   case 'jointWork':return set('single-worker',{rate:m.a,total:(m.a+m.b)*m.t},'time',F((m.a+m.b)*m.t,m.a),'分钟',['Same work amount; only A works']);
   case 'riverTravel':return set('still-water-round-trip',{speed:m.v,waterSpeed:0,oneWay:m.distance,legs:2},'time',F(2*m.distance,m.v),'小时',['Current removed; both legs remain']);
   case 'mapScale':return set('map-scale',{originalLength:m.a,firstMultiplier:m.k,secondNumerator:1,secondDenominator:2},'map-length',F(m.a*m.k,2),'厘米',['Second scaling applies to current map']);
   case 'scaleAreaReverse':return set('area-scale',{originalArea:m.old,lengthMultiplier:m.k,secondScaling:false},'area',m.old*m.k*m.k,'面积单位',['Only first enlargement occurs']);
   case 'ageDifference':return set('future-age-ratio',{childNow:m.child,parentNow:m.parent,targetRatio:2},'elapsed-years',m.parent-2*m.child,'年',['Both ages increase by same time']);
   case 'repeatedMachine':{const first=m.a*(m.x+m.b);return set('repeated-machine',{input:m.x,addition:m.b,multiplier:m.a,order:'add-then-multiply',repetitions:2},'output',m.a*(first+m.b),'',['Same constants, new operation order'])}
   case 'twoCoins':return set('coin-removal',{coinCount:m.n,oneUnitCount:m.n-m.twos,twoUnitCount:m.twos,removed:[1,2]},'remaining-value',m.n+m.twos-3,'元',['Remove one of each coin type']);
   case 'stampConstraint':{let count=0;for(let a=0;3*a<=m.total;a++)if((m.total-3*a)%5===0)count++;return set('integer-stamp-plans',{prices:[3,5],total:m.total,zeroAllowed:true},'plan-count',count,'种',['Nonnegative counts; same amount'])}
   case 'recurrenceForward':return set('recurrence',{first:m.b,second:m.a,n:m.n,rule:'sum-previous-two'},'term',sequence(m.b,m.a,m.n).at(-1),'',['Initial terms exchanged']);
   case 'recurrenceTotal':return set('recurrence-sum',{first:m.a,second:m.b,n:m.n,startTerm:2,endTerm:m.n},'sum',sum(sequence(m.a,m.b,m.n).slice(1)),'',['Term one excluded']);
   case 'machineMeeting':return set('equal-machine-output',{leftMultiplier:m.a,leftAddition:m.d+1,rightMultiplier:m.c,rightAddition:m.b},'input',F(m.d+1-m.b,m.c-m.a),'',['Only left output gets extra one']);
   case 'machineOrder':{const x=2*m.x,ab=m.c*(m.a*x+m.b)+m.d,ba=m.a*(m.c*x+m.d)+m.b;return set('composition-order',{A:[m.a,m.b],B:[m.c,m.d],input:x},'absolute-output-difference',Math.abs(ab-ba),'',['Compare both full operation orders'])}
   case 'digitDivisor':return set('division-domain',{tens:m.tens,units:0,divisor:0},'rule-is-meaningful',0,'0/1',['Division by zero has no meaning']);
   case 'divisibleEleven':{let count=0;for(let b=0;b<=9;b++)for(const d of [0,5])if((1000*m.a+100*b+10*m.c+d)%11===0)count++;return set('digit-constraints',{thousands:m.a,tens:m.c,divisors:[11,5]},'legal-count',count,'个',['Count all valid four-digit integers'])}
   case 'threeDivisors':{let best=0;for(let p=2;p*p<=m.limit;p++){let prime=true;for(let d=2;d*d<=p;d++)if(p%d===0){prime=false;break}if(prime)best=p*p}return set('three-positive-divisors',{limit:m.limit,objective:'largest'},'integer',best,'',['Exactly three positive divisors'])}
   case 'divisorPowers':return set('square-divisors',{primeExponents:[m.a,m.b],primes:[2,3],exponentParity:'even'},'count',(Math.floor(m.a/2)+1)*(Math.floor(m.b/2)+1),'个',['Both prime exponents even']);
   case 'equalBags':{const g=gcd(m.a,m.b);let count=0;for(let n=1;n<=g;n++)if(g%n===0)count++;return set('equal-bag-counts',{amounts:[m.a,m.b],commonDivisor:g,objective:'count-all'},'bag-count-options',count,'种',['Bag count divides both stocks'])}
   case 'offsetBells':{let first=m.a;while((first-m.offset)%m.b!==0||first<m.offset)first+=m.a;return set('offset-period-events',{periods:[m.a,m.b],offset:m.offset,occurrence:2,includeStart:false},'time',first+lcm(m.a,m.b),'分钟',['Find next full simultaneous period'])}
   case 'cyclicPosition':return set('cyclic-walk',{size:m.size,start:m.start,steps:m.steps,direction:-1},'position',((m.start-1-m.steps)%m.size+m.size)%m.size+1,'',['Positions labeled one through size']);
   case 'repeatedOnes':{let r=0;for(let i=0;i<m.n+1;i++)r=(10*r+1)%7;return set('decimal-remainder',{digit:1,length:m.n+1,divisor:7},'remainder',r,'',['Append one more decimal digit'])}
   case 'rectangleDiagonalArea':return set('diagonal-area',{widthNumerator:3*m.w,widthDenominator:2,height:m.h,areaFraction:'1/2'},'triangle-area',F(3*m.w*m.h,4),'面积单位',['Only width increased by half']);
   case 'boundaryNotch':return revision>=3?set('internal-hole-boundary',{outer:[v.w,v.h],hole:[v.a,v.b],placement:'internal',includeHoleBoundary:true},'boundary-length',2*(v.w+v.h+v.a+v.b),'长度单位',['Outer and hole outlines both counted']):set('corner-notch',{outer:[m.w,m.h],notch:[m.a,m.depth],placement:'corner'},'boundary-length',2*(m.w+m.h),'长度单位',['Removed corner edges replaced by equal-length inner edges']);
   case 'angleMarks':return set('circle-angle',{marks:m.marks,steps:m.marks-m.step,direction:'other'},'angle',F(360*(m.marks-m.step),m.marks),'度',['Use complementary arc']);
   case 'polygonTurn':return set('polygon-turns',{sides:m.n,passedVertices:Math.floor(m.n/2)},'total-turn',F(360*Math.floor(m.n/2),m.n),'度',['Count actual passed vertices']);
   case 'lShapeArea':return set('internal-hole-area',{outer:[m.w,m.h],hole:[m.a,m.b],placement:'internal'},'remaining-area',m.w*m.h-m.a*m.b,'面积单位',['Same hole area, new placement']);
   case 'crossArea':return set('strip-intersection',{outer:[m.w,m.h],stripWidths:[m.a,m.b],target:'intersection'},'area',m.a*m.b,'面积单位',['Only region covered by both strips']);
   case 'semicircleBoundary':return set('whole-circle',{radius:m.radius,pi:3,joinedDiametersAreInternal:true},'outer-boundary',6*m.radius,'长度单位',['Straight joining edges are internal']);
   case 'circleRingRatio':return set('circle-ring',{innerRadius:2*m.r1,outerRadius:2*m.r2,sample:'outer-disk'},'area-ratio',F(m.r2*m.r2-m.r1*m.r1,m.r2*m.r2),'',['Common radius factor cancels']);
   case 'shadowSimilarity':return set('shadow-ratio',{smallHeight:m.a,bigHeight:m.b*m.unit,bigShadow:m.b*m.unit,timeChanged:true},'small-shadow',m.a,'长度单位',['New equal shadow-to-height ratio']);
   case 'parallelTriangle':return set('parallel-triangle',{originalArea:m.area,lengthRatio:'1/2',target:'lower-trapezoid-ratio'},'area-ratio','3/4','',['Triangle area ratio is length ratio squared']);
   case 'coordinateHorizontal':return set('horizontal-distance',{start:[m.a+5,m.y],end:[m.b+5,m.y],shift:5},'distance',Math.abs(m.b-m.a),'长度单位',['Both points share same translation']);
   case 'hypotenuseMidpoint':return set('leg-midpoint',{shortLeg:3*m.k,longLeg:4*m.k,midpointSide:'long-leg'},'vertex-distance',2*m.k,'长度单位',['Midpoint on a leg, not hypotenuse']);
   case 'cubeSteps':return set('stair-cubes',{columns:m.n,heights:'1..n',depth:2},'cube-count',m.n*(m.n+1),'块',['Thickness doubles all columns']);
   case 'openBox':return set('box-base',{paperSide:m.side,cornerCut:1,bottomSide:m.side-2},'bottom-area',(m.side-2)**2,'面积单位',['Fixed cut; target is bottom area, not volume']);
   case 'setOutside':return set('sets',{a:m.a+1,b:m.b+1,both:m.both+1,total:m.total},'outside-count',m.total-m.a-m.b+m.both-1,'人',['One previously outside person joins both groups']);
   case 'threeSetExactlyTwo':return set('three-sets',{ab:m.ab,ac:m.ac,bc:m.bc,triple:m.triple,pairCountsIncludeTriple:true},'at-least-two-count',m.ab+m.ac+m.bc-2*m.triple,'人',['Triple-members included once in target']);
   case 'menuBranches':return set('menu-branches',{rice:m.rice,dish:m.dish,noodle:m.noodle,drinks:3},'menu-count',3*(m.rice*m.dish+m.noodle),'种',['One of rice-with-dish or noodle; every lunch gets a drink']);
   case 'binaryNoNeighbors':{let count=0;for(let mask=0;mask<2**m.n;mask++)if((mask>>(m.n-1)&1)&&!(mask&(mask<<1)))count++;return set('binary-lights',{positions:m.n,adjacentOnAllowed:false,firstOn:true},'configuration-count',count,'种',['First position lit; no adjacent lit positions'])}
   case 'unorderedPairs':return set('distinct-roles',{n:m.n,roles:2,oneRolePerPerson:true},'arrangement-count',m.n*(m.n-1),'种',['Role order distinguishes arrangements']);
   case 'circularSeating':return set('circular-arrangements',{people:m.n,rotationEquivalent:true,adjacencyConstraint:null},'arrangement-count',fact(m.n-1),'种',['Fix a reference seat; no special adjacency']);
   case 'differentDigits':return set('unordered-code-symbols',{symbols:m.digits,choose:2,repeat:false,exchangeEquivalent:true},'code-count',choose(m.digits,2),'个',['Symbols distinct; exchanged positions equivalent']);
   case 'allThreeColors':return set('exact-color-usage',{positions:m.n,availableColors:3,requiredColors:2},'coloring-count',3*(2**m.n-2),'种',['Choose used pair; exclude its two single-color assignments']);
   case 'truncatedBars':return set('bar-difference',{base:m.base,step:m.step,heights:[m.a,m.b]},'population-difference',(m.b-m.a)*m.step,'人',['Common axis baseline cancels']);
   case 'cumulativeChart':return set('cumulative-chart',{counts:[m.a,m.b,m.c,m.d],targetExactScore:4},'count',m.d,'人',['Fourth exact bin, not cumulative total']);
   case 'medianSort':return set('median-change',{sortedOriginal:Array.from({length:5},(_,i)=>m.start+i*m.gap),changedIndex:4,increase:100},'median',m.start+2*m.gap,'',['Largest value remains largest']);
   case 'overlapAverages':{const values=[...m.values,m.values[0],m.values[6]],front=sum(values.slice(0,5)),back=sum(values.slice(4)),all=sum(values);return set('overlap-averages',{frontMean:F(front,5),backMean:F(back,5),allMean:F(all,9),n:9,segmentSize:5,middlePosition:5},'middle-number',front+back-all,'',['Position five is shared by two five-term segments'])}
   case 'spinnerLabels':return set('conditional-spinner',{counts:{A:m.a,B:m.b,C:m.c},excludedLabels:['C'],targetLabel:'A'},'probability',F(m.a,m.a+m.b),'',['All sectors equal area','Condition changes sample space']);
   case 'conditionalBalls':return set('conditional-ball-pairs',{red:m.red,blue:m.blue,draws:2,replacement:false,condition:'same-color'},'both-red-probability',F(m.red*(m.red-1),m.red*(m.red-1)+m.blue*(m.blue-1)),'',['Nonreplacement pairs; condition removes mixed pairs']);
   case 'quarterTurn':return set('quarter-turn',{start:m.start,turns:m.turns,direction:-1},'direction',((m.start-m.turns)%4+4)%4,'0..3',['Counterclockwise rotation']);
   case 'transformOrder':{const reflected=(4-m.start)%4;return set('transform-order',{start:m.start,rotation:m.rot,order:['mirror','rotate']},'direction',(reflected+m.rot)%4,'0..3',['Reflection precedes rotation'])}
   case 'lightSwitchParity':return set('toggle-state',{initial:m.on,presses:m.groups*m.per+m.extra+1},'final-state',(m.on+m.groups*m.per+m.extra+1)%2,'0/1',['One extra toggle']);
   case 'ballReplacement':return set('replacement-invariant',{white:m.white+1,black:m.black,rule:'same-black-different-white'},'last-ball-code',(m.white+1)%2,'0/1',['White parity preserved']);
   case 'transferBetweenBoxes':return set('external-box-addition',{firstBefore:F(2*m.a*m.moved,m.b-m.a),secondBefore:F(2*m.b*m.moved,m.b-m.a),externalAdded:m.moved,target:'remaining-gap'},'difference',m.moved,'块',['Addition from outside, not internal transfer']);
   case 'rectanglePointAreas':return set('point-area-balance',{leftBefore:m.left,rightBefore:m.right,leftIncrease:1,verticalPositionUnchanged:true},'right-area',m.right-1,'面积单位',['Opposite triangle areas have fixed sum']);
   case 'worstCaseColors':return set('guarantee-colors',{capacities:m.caps,targetSameColor:m.k+1},'draw-count',sum(m.caps.map(x=>Math.min(x,m.k)))+1,'个',['Maximal still-failing draw plus one']);
   case 'stagedClimb':return set('complete-day-night',{up:m.up,down:m.down,threshold:m.height,earlyStop:false,observedTime:'after-night'},'day-count',Math.ceil(m.height/(m.up-m.down)),'天',['Every nightly retreat is completed']);
   case 'consecutiveRepresentations':{let count=0;for(let n=2;n*(n-1)/2<=m.total;n++){const a=(m.total-n*(n-1)/2)/n;if(Number.isInteger(a)&&a>=0)count++}return set('consecutive-sum',{total:m.total,minStart:0,minTerms:2},'representation-count',count,'种',['Nonnegative, consecutive, at least two terms'])}
   case 'remainderProbability':{let good=0;for(let n=0;n<=m.count;n++)if(n%m.mod===m.wanted)good++;return set('remainder-cards',{start:0,end:m.count,modulus:m.mod,targetRemainder:m.wanted},'probability',F(good,m.count+1),'',['Zero included as one additional equally likely card'])}
   case 'rotatingColors':return set('marked-ring',{positions:m.n,red:m.red,fixedReference:true,rotationEquivalent:false},'coloring-count',choose(m.n,m.red),'种',['Star fixes position numbering']);
   case 'stepwiseRoute':return set('uniform-complete-routes',{w:m.w,h:m.h,point:[m.x,m.y],sampling:'complete-routes'},'through-point-probability',F(choose(m.x+m.y,m.x)*choose(m.w+m.h-m.x-m.y,m.w-m.x),choose(m.w+m.h,m.w)),'',['Complete routes equiprobable; no per-junction weighting']);
   default:return null;
  }
 }
 function normalize(c,f,revision){
  const prior=c.extension.problemState;
  // Historical recipes remain replayable under their original mathematical
  // contract. New state contracts apply to current revisions three and four.
  if(revision<3)return {...c,extension:{...c.extension,problemState:{...prior,legacyNormalization:'historical-contract-preserved'}}};
  const n=describe(c,f,revision);if(!n)throw Error('Missing current variant state '+f.id);
  if(!math.equal(n.expectedAnswer,c.extension.answer))throw Error('Variant state answer disagreement '+f.id);
  const d=copy(c.extension.diagram),before=['ratioUnion','ratioEqualize','ratioTotal'].includes(f.id);
  const captions={
   ratioUnion:'变化前的份数关系；同一位棋类组成员又加入球类组，原比例不再适用',
   ratioEqualize:'变化前的红蓝份数；只取走蓝球，红球不变',
   ratioTotal:'变化前的红蓝份数；增加的是实际红积木数量',
   cubeProbability:'取样范围：至少一面涂色的小块',
   paintedCube:'只涂顶面和底面；找恰好一面涂色的小块',
   fixedPerimeter:revision>=3?'周长不变；两边至少'+n.parameters.minSide+'，比较合法的最小面积':'周长不变；两条正偶数边，比较最大面积',
   naturalUnion:'已知至少参加一组；圈外不属于本次取样范围'
  };
  d.mathStateId=f.id+':variation';d.targetQuantityId=n.goal.id;d.statePhase=before?'before-change-with-operation':'variation-givens';
  if(captions[f.id])d.caption=captions[f.id];
  if(['natural-unionChance','natural-complementChance'].includes(f.id))d.caption=captions.naturalUnion;
  const state={...prior,math:n.parameters,normalizedModel:n.model,goal:n.goal,relations:n.conditions,quantityDomain:n.quantityDomain,expectedAnswer:n.expectedAnswer,adapterStatus:'explicit',quantityIds:Object.keys(n.parameters).map(key=>({id:f.id+':variation:'+key,key})),projection:{...prior.projection,diagram:d,diagramPhase:d.statePhase},answerContract:{kind:n.model==='whole-circle'?'exact-under-stated-assumption':'exact-rational',value:c.extension.answer,unit:n.goal.unit,allowApproximation:false,assumptions:n.parameters.pi?['pi='+n.parameters.pi]:[]}};
  const solutionFrames=(c.extension.solutionFrames||[]).map(frame=>({...frame,mathStateId:state.id,targetQuantityId:n.goal.id,scene:{...frame.scene,mathStateId:state.id,targetQuantityId:n.goal.id,statePhase:'variation-solution',...(captions[f.id]?{caption:captions[f.id]}:{})},stage:{...frame.stage,mathStateId:state.id,targetQuantityId:n.goal.id}}));
  return {...c,extension:{...c.extension,diagram:d,problemState:state,answerContract:state.answerContract,solutionFrames}};
 }
 return {describe,finalize,normalize};
})(typeof module!=='undefined'?require('./competition'):{competitionFraction},typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=VariationState;

'use strict';
const SubmissionContract=((P)=>{
 const checks={
  'place-and-choice':'把得到的数放回每个数位，检查顺序、是否允许重复和全部数位条件。',
  'changing-wholes':'每个分数指的是哪一个整体？画出每次变化前后的整体，再代回剩余量。',
  'changing-base':'每次百分数以哪个价格为基准？用你的结果检查前后变化能否回到题给价格。',
  'ratio-and-conservation':'比的两边分别代表谁？同一份的大小是否一致，转移前后总量是否保持？',
  'finite-purchase':'将你的包数代回总支数和总费用。检查整包、恰好或至少买够的条件。',
  'rate-and-boundary':'这个数表示时间、路程还是速度？分别代回两段行程，不把等路程当成等时间。',
  'length-and-area-scale':'当前倍率作用于长度还是面积？同一倍率作用于几条边？检查所求量。',
  'balance-and-constraints':'把候选结果代回每一条总量与差额条件。天平两边的操作是否保持等量？',
  'recurrence':'逐个检查相邻项的规则和项号，不能把第几项当成它的数值。',
  'affine-operations':'按题给顺序把候选数输入机器，再核对输出；两台机器的先后次序相同吗？',
  'factor-constraints':'将候选因数相乘，检查积和因数个数；所有合法分组都检查了吗？',
  'cycle-and-endpoints':'把事件标在时间轴上，核对周期以及开始、结束时刻是否计入。',
  'boundary-and-area':'当前求的是边界长度还是覆盖面积？检查转角、重叠和被移除的部分。',
  'angle-and-circle':'你的角度对应哪个顶点或哪段弧？检查总角与题给比例是否同时成立。',
  'distance-geometry':'先标出所求的两点或线段；检查方向、直角及图给长度，不用图上像素代替条件。',
  'spatial-boundary':'按层或面逐一核对，区分可见块与被遮住的块；同一块不能重复数。',
  'sets-and-multiplicity':'把同一个对象放进对应区域，核对交集被数了几次以及圈外对象。',
  'route-and-sampling':'逐段检查完整路线：分支是否合法、限制点有没有经过、是否漏数或重复？',
  'arrangement-and-equivalence':'检查顺序是否重要、旋转是否算同一种，再核对重复与遗漏。',
  'chart-and-scale':'先核对刻度起点和每格的单位，再把柱高或累计值还原成所求量。',
  'total-and-position':'这个数表示总量、每人量还是位置？先核对参与的人数或项数。',
  'sample-space':'每个基本结果是否等可能？检查满足条件的结果和完整样本空间是否对应。',
  'transformation':'按题给顺序追踪每次变换；中间的方向或位置有没有被跳过？',
  'invariant-and-guarantee':'对一次合法操作检查什么改变、什么保持。你的结论能应对每一种合法选择吗？',
  'structure-and-domain':'用一个较小实例检查你的规则，再核对端点、符号和全部合法情况。',
  'joined-length':'每次连接会减少哪一段长度？核对接口数量及开口、闭环的区别。',
  'interval-endpoints':'逐个检查间隔和标记的对应关系；两端分别是否需要标记？',
  'ratio-perimeter':'比例对应长宽还是一周？标出所求边，核对所有边与周长条件。',
  'unit-conversion':'写出每个数的单位，先换成相同单位，再代回题给数量关系。',
  'constant-age-gap':'比较同一时刻的两人年龄；时间变化会改变年龄差还是倍数？',
  'shared-height-balance':'找出哪些区域共用同一条高或底，再检查面积比与总面积。',
  'three-group-reference':'将人数代回三组总量、差额与倍数关系，核对所求组别。'
 };
 function numeric(input,expected){
  const text=String(input??'').trim();
  if(!text)return {ok:false,status:'awaiting_input',text:'先填写答案。',recordAttempt:false};
  if(!P.arithmetic(text))return {ok:false,status:'invalid_input',text:'这段输入还不能按数值核对。可填写数、分数或算式，草稿已保留。',recordAttempt:false};
  const ok=P.equal(text,expected);return {ok,status:ok?'correct':'needs_revision',recordAttempt:true};
 }
 function feedback(c,input,variation=false){
  const familyId=c.recipe?.familyId||c.problemState?.familyId||c.quality?.familyId||c.family;
  const model=c.quality?.modelId||c.quality?.model||c.modelId,base=checks[model]||'这个数代表哪个量？请检查使用的条件、单位和所求目标。';
  if(!variation&&['natural-weighted','natural-fractionWeighted'].includes(familyId)){
   const m=c.math,den=m.den||1;if(P.equal(input,(m.redScore+m.blueScore)/(2*den)))return '如果你直接平均两个队的每人得分：两队人数相同吗？请在图上分别表示人数，再检查全体平均分。';
  }
  if(!variation&&familyId==='ratioUnion'&&P.equal(input,(c.math.a+c.math.b)*c.math.unit))return '如果这是两组人数的合计：交集里的同一个人被数了几次？用区域图核对参加活动的不同人数。';
  const known=(variation?c.extension?.misconceptions:c.misconceptions)?.find(x=>P.equal(input,x.value));
  return known?.feedback||((variation?'条件已经改变。':'你得到的是 '+String(input)+'。')+base);
 }
 return {numeric,feedback,checks};
})(typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=SubmissionContract;

'use strict';
const EvidenceRules=(()=>{
 const supported=new Set([5,6]);
 const known=version=>supported.has(version);
 const capabilities=version=>({known:known(version),exact:known(version),scoped:version===6});
 const assess=entry=>({...capabilities(entry?.evidenceVersion),independenceStatus:known(entry?.evidenceVersion)?'known':'unknown'});
 const canCountIndependent=entry=>known(entry?.evidenceVersion)&&entry.independent===true&&!entry.hinted&&!entry.priorSolutionViewed;
 return {known,exact:known,capabilities,assess,canCountIndependent};
})();
if(typeof module!=='undefined')module.exports=EvidenceRules;

'use strict';
const CompetitionWork=(()=>{
 const clone=x=>x==null?x:JSON.parse(JSON.stringify(x));
 const emptyScope=id=>({scopeId:id,input:{raw:'',selectedOptionId:null,revision:0},eliminatedOptionIds:[],answerState:'editing',feedback:null,lastSubmissionKey:null,attemptIds:[],help:{open:false,revealedHintIds:[],solutionSeen:false,firstSeenAtByHint:{},legacyExposure:'known'},reasoning:null,sketch:null});
 const variationId=task=>'variation:'+task.competition.extension.key;
 function bind(work,task){
  const main=work.scopes.main,variation=work.scopes[variationId(task)];
  for(const [name,scope,key] of [['extensionInput',variation,'input'],['extensionResult',variation,'feedback'],['reasoning',main,'reasoning'],['sketch',main,'sketch'],['solutionOpen',main,'solutionSeen']]){
   Object.defineProperty(work,name,{configurable:true,get(){return key==='input'?scope.input.raw:key==='solutionSeen'?scope.help.solutionSeen:scope[key]},set(value){if(key==='input'){if(scope.input.raw!==value)scope.input.revision++;scope.input.raw=String(value)}else if(key==='solutionSeen')scope.help.solutionSeen=value===true;else scope[key]=value}});
  }
  Object.defineProperty(work,'hintLevel',{configurable:true,get:()=>main.help.revealedHintIds.length,set(value){for(let i=main.help.revealedHintIds.length;i<value;i++)main.help.revealedHintIds.push('main-h'+(i+1));main.help.open=value>0}});
  return work;
 }
 function restore(raw,task,ctx={}){
  if(raw?.schema>2)throw Error('FUTURE_WORK_SCHEMA');
  const variant=variationId(task),work={kind:'competition-work',schema:2,workId:(ctx.sessionId||'session')+':'+task.id,recipe:clone(task.competition.recipe),activeScopeId:'main',viewMode:'question',scopes:{main:emptyScope('main'),[variant]:emptyScope(variant)},notes:String(raw?.notes||'').slice(0,1200),eliminated:[],method:0,step:0,variationMode:null};
  if(raw?.schema===2&&(raw.workId!==work.workId||JSON.stringify(raw.recipe)!==JSON.stringify(task.competition.recipe))){work.migration={fromSchema:2,reason:'WORK_IDENTITY_MISMATCH',retainedDraft:clone(raw)};return bind(work,task);}
  if(raw?.schema===2){
   for(const id of ['main',variant])if(raw.scopes?.[id]){
    const s=raw.scopes[id],fresh=emptyScope(id);
    work.scopes[id]={...fresh,...clone(s),scopeId:id,input:{...fresh.input,...clone(s.input)},help:{...fresh.help,...clone(s.help)}};
   }
   work.activeScopeId=work.scopes[raw.activeScopeId]?raw.activeScopeId:'main';
  }else if(raw){
   const m=work.scopes.main,v=work.scopes[variant];m.input.raw=String(raw.reasoning?.finalInput||'').slice(0,40);m.reasoning=clone(raw.reasoning);m.sketch=clone(raw.sketch);m.help.solutionSeen=raw.solutionOpen===true;
   for(let i=0;i<Math.min(4,raw.hintLevel||0);i++)m.help.revealedHintIds.push('main-h'+(i+1));m.help.open=m.help.revealedHintIds.length>0;
   v.input.raw=String(raw.extensionInput||'').slice(0,40);v.feedback=clone(raw.extensionResult);m.help.legacyExposure=raw.hintLevel?'unknown':'known';
   work.migration={fromSchema:1};
  }
  for(const field of ['method','step'])work[field]=Number.isInteger(raw?.[field])?raw[field]:0;
  work.eliminated=Array.isArray(raw?.eliminated)?raw.eliminated.filter(n=>Number.isInteger(n)&&n>=0&&n<5):[];
  work.variationMode=['comparison','independent'].includes(raw?.variationMode)?raw.variationMode:null;
  work.scopes.main.eliminatedOptionIds=work.eliminated.map(i=>task.optionIds?.[i]||String(i));
  return bind(work,task);
 }
 function create(task,ctx){return restore(null,task,ctx)}
 function selectScope(work,id){if(!work.scopes[id])throw Error('UNKNOWN_SCOPE');return work.scopes[id]}
 function setInput(work,id,raw,optionId=null){work.activeScopeId=id;const s=selectScope(work,id),text=String(raw??'').slice(0,40);if(s.input.raw!==text||s.input.selectedOptionId!==optionId)s.input.revision++;s.input.raw=text;s.input.selectedOptionId=optionId;s.feedback=null;s.answerState='editing';return s}
 function reduce(work,command,decision={}){const next=clone(work),s=selectScope(next,command.scopeId);if(command.type==='SET_INPUT')setInput(next,command.scopeId,command.payload.raw,command.payload.optionId);if(command.type==='SUBMIT'){s.feedback=clone(decision);s.answerState=decision.ok?'correct':'incorrect';s.lastSubmissionKey=decision.submissionKey||null;if(decision.eventId)s.attemptIds.push(decision.eventId)}return next}
 function submissionKey(work,id,input){const s=selectScope(work,id);return JSON.stringify([work.workId,id,s.input.revision,String(input).trim(),s.modelRevision||0])}
 return {create,restore,bind,selectScope,setInput,variationId,submissionKey,reduce};
})();
if(typeof module!=='undefined')module.exports=CompetitionWork;

'use strict';
const CompetitionContentContracts=(()=>{
 function givenText(source,prompt){
  if(!/如图|如表|图中|表中/.test(prompt))return '';
  const d=source.diagram;if(!d)return '';
  if(d.kind==='bars')return '题中数据：'+d.values.map((v,i)=>d.names[i]+'对应'+v+'格'+(d.known===i?'，标注'+d.knownValue+'人':'')).join('；')+'。';
  if(d.kind==='table')return '题中数据：'+d.rows.map(row=>row.join('：')).join('；')+'。';
  if(d.kind==='scene-hiddenL')return '三个小正方形沿大正方形的左上到右下依次顶点相接。阴影是贴着大正方形左边和下边的等宽L形条带，条带宽度等于角上小正方形的边长；左上和右下的小正方形不计入阴影，条带交叠处只算一次。';
  if(d.labels?.length)return '题中条件：'+d.labels.join('；')+'。';
  throw Error('MISSING_TEXTUAL_DIAGRAM_GIVENS');
 }
 function presentation(task,variation){
  const c=task.competition,source=variation?c.extension:c,m=c.math,family=c.recipe.familyId;
  let promptText=variation?source.prompt:task.prompt,conditions=givenText(source,promptText);
  if(family==='natural-coordinateDistance'){
   const points=`A=(${m.x},${m.y})，B=(${m.x+m.dx},${m.y+m.dy})`;
   if(variation)conditions='两点坐标：'+points+'。';
   else promptText=promptText.replace('坐标图上','坐标平面中');
  }
  if(family==='chartAverage'){
   conditions=(variation?'原有人数：':'题中人数：')+m.counts.map((count,i)=>`得 ${2*(i+1)} 分的有 ${count} 人`).join('；')+'。';
   if(!variation)promptText='所有人的得分分为 2 分、4 分、6 分，人数条件如下。所有人的平均分是多少？';
  }
  if(variation&&family==='oppositeScale')promptText=`长和宽都变成原来的 ${m.b}/${m.a}，面积是原来的几倍？`;
  if(!variation&&family==='lShapeArea')promptText=promptText.replace('如图阴影L形','下方文字描述的阴影L形');
  return {promptText,givenText:conditions,narrationText:[promptText,conditions].filter(Boolean).join(' ')};
 }
 function resolve(task,scopeId='main'){
  const c=task.competition,v=scopeId!=='main',source=v?c.extension:c,ps=source.problemState||c.problemState;
  const text=presentation(task,v),rawGoal=typeof ps?.goal==='object'?ps.goal:{},goal={...rawGoal,id:rawGoal.id||c.recipe.familyId+':'+(v?'variation':'main')+':'+(rawGoal.quantityId||rawGoal.targetGroup||'target'),quantityId:rawGoal.quantityId||rawGoal.targetGroup||'target',questionText:text.promptText,unit:rawGoal.unit||source.unit||''};
  const answerContract=ps?.answerContract||source.answerContract||{kind:'exact-rational',value:source.answer,unit:source.unit||''};const math=typeof module!=='undefined'?require('./problem_state'):ProblemState;if(!math.equal(answerContract.value,source.answer)||source.answerContract&&!math.equal(source.answerContract.value,source.answer))throw Error('SCOPE_ANSWER_CONTRACT_MISMATCH');
  return {contractVersion:3,configurationId:c.recipe.configurationId||c.recipe.familyId,scopeId,modelId:c.quality?.modelId||c.quality?.model||c.modelId||'structure-and-domain',goal,answerContract,hints:(v?(source.hints||['比较变式和主问题：已知条件、所求目标或整体发生了什么变化？','按照变式的新条件重新建立数量关系，再检查单位与边界。']):c.hints||[]).map((prompt,i)=>({id:(v?'variation':'main')+'-h'+(i+1),order:i+1,prompt,narrationText:prompt})),diagram:source.diagram||null,...text,diagramRole:'hint',initialDiagramAllowed:false};
 }
 function validate(c){if(!c.goal||!c.answerContract||!c.scopeId)throw Error('INVALID_CONTENT_CONTRACT');return true}
 return {resolve,validate,givenText};
})();
if(typeof module!=='undefined')module.exports=CompetitionContentContracts;

'use strict';
const CompetitionFeedback=((P,S)=>{
 function evaluateInput(input,descriptor){const raw=typeof input==='object'?input.raw:input,result=S.numeric(String(raw??''),descriptor.answerContract.value);return {...result,outcome:result.status,scopeId:descriptor.scopeId,goalId:descriptor.goal.id||descriptor.goal.quantityId||'target',recordAttempt:result.recordAttempt===true,confidence:'not_applicable',diagnosticRuleId:null}}
 const targeted={
  missingAverage:(c,v)=>v?'本次求的是新整体的平均数。加入或移除成员后，总和与个数是否同步更新？':'把平均数还原为总和时，原来的个数和移除后的个数相同吗？再检查题目最终求的是哪一个量。',
  conditionalBalls:(c,v)=>v?'附加条件留下了哪些同色球对？分子与分母都应来自这个新样本范围。':'连续取两球且不放回。检查第二次取球时，袋中总数和目标颜色数量怎样变化。',
  diceSum:(c,v)=>v?'变式附加条件改变了哪些允许的点数对？先去掉不允许的对，再比较有利结果与全部允许结果。':'两枚骰子的有序点数对才是等可能对象。相同的点数和可能由几个不同点数对形成？',
  paintedCube:(c,v)=>v?'变式只涂题目指定的面。一个小块能同时接触这些面吗？按实际涂色面重新分类。':'角块、棱中块、面中块分别接触几个涂色面？先确定所求类别，再检查边界是否重复。',
  lightSwitchParity:()=> '从本题的初始开关状态出发，把整组按键与额外按键都计入。检查总次数的奇偶以及0、1所代表的状态。',
  mapScale:()=> '先标清两张地图的对应关系，再把本次给出的长度放到正确的地图上。同一条实际路线是比例的参照。',
  oppositeScale:(c,v)=>v?'变式中两个方向按同一长度倍率变化。你的面积倍率同时包含这两个方向了吗？':'原题要求面积保持不变。检查两个方向的长度倍率相乘后是否满足这个条件。',
  ballReplacement:()=> '逐种比较合法操作会怎样改变白球数。最后只剩一球时，还要核对0、1与颜色的对应，不能把操作次数当成颜色。',
  checkerDomino:()=> '一块骨牌覆盖两个相邻格。面积给出的数量上界能否由合法摆法达到？检查变式中的边界与染色条件。',
  'rule-packs-exact':(c,v)=>{const p=v?c.extension.problemState.math:c.math.params;return '每包'+p.size+'件，需求'+p.count+'件。'+(p.requirement==='at-least'?'本次允许多买，比较总费用而非只看单价。':'检查整包与单买的总数量是否恰好符合条件，再比较费用。')},
  unitConversion:()=> '先把总容量与每杯容量写成同一单位。本次求的是完整杯数还是可分装的精确数量？剩余容量必须按题意处理。',
  equalDistanceSpeed:(c,v)=>v?'这次相同的是时间。检查你的两段权重是否仍沿用了主问题的等路程条件。':'两个方向是等路程。先分别表示所用时间，再用总路程与总时间核对平均速度。',
  'natural-catch':(c,v)=>v?'本次求追上后继续运动的间距。共同起点是哪一时刻？不要把追及时间直接作为距离。':'先行造成的领先距离是多少？后者出发后，每分钟缩短多少距离？检查你的数代表时间还是路程。'
 };
 function diagnose({task,input,scopeId='main'}){
  const c=task.competition,v=scopeId!=='main',family=c.recipe.familyId,descriptor=(typeof module!=='undefined'?require('./competition_content_contracts'):CompetitionContentContracts).resolve(task,scopeId);
  const candidates=v?c.extension.misconceptions:c.misconceptions,explicit=candidates?.find(x=>P.equal(input,x.value));
  const text=explicit?.feedback||targeted[family]?.(c,v)||S.feedback(v?{...c,misconceptions:c.extension.misconceptions}:c,input,v);
  return {ok:false,status:'needs_revision',outcome:'needs_revision',text,scopeId,goalId:descriptor.goal.id||'target',modelId:descriptor.modelId,diagnosticRuleId:family+':'+(v?'variation':'main')+':'+(explicit?'authored-misconception':'condition-check'),confidence:'suggested_check',recordAttempt:true};
 }
 return {evaluateInput,diagnose,format:r=>r.text||r.message||''};
})(typeof module!=='undefined'?require('./problem_state'):ProblemState,typeof module!=='undefined'?require('./submission_contract'):SubmissionContract);
if(typeof module!=='undefined')module.exports=CompetitionFeedback;

'use strict';
const CompetitionPresentation=(()=>{
 function project(task,work,scopeId='main'){
  const c=CompetitionContentContracts.resolve(task,scopeId),s=CompetitionWork.selectScope(work,scopeId),visible=c.hints.filter(h=>s.help.revealedHintIds.includes(h.id));
  let diagram=c.diagram;const family=task.competition.recipe.familyId,m=task.competition.math;if(scopeId==='main'&&family==='digitInsert')diagram={kind:'scene-placeValue',rows:[{label:'原数字，顺序保持',digits:[m.a,m.b]},{label:'待插入的数字',digits:[m.d]}],caption:'插入位置由你选择'};if(scopeId==='main'&&family==='divisorPowers')diagram={kind:'scene-quantities',quantities:[{label:'2的指数上限',value:String(m.a),unit:''},{label:'3的指数上限',value:String(m.b),unit:''}],caption:'请自己确定每个指数的合法取值'};
  return {scopeId,prompt:c.promptText,givenText:c.givenText,narrationText:c.narrationText,hints:visible,input:{...s.input},feedback:s.feedback,diagram:c.initialDiagramAllowed?diagram:visible.length?diagram:null};
 }
 return {project,projectHint:(task,work,id)=>project(task,work,id).hints,projectDiagram:(task,work,id)=>project(task,work,id).diagram};
})();

'use strict';
const CompetitionSpeech=(()=>{
 let sequence=0,active=null;
 function stop(){sequence++;active=null;if(typeof window!=='undefined'&&window.speechSynthesis)window.speechSynthesis.cancel()}
 function speak(request,engine=window.speechSynthesis){stop();if(!engine||typeof SpeechSynthesisUtterance!=='function')return false;const n=sequence,u=new SpeechSynthesisUtterance(request.text);u.lang='zh-CN';active={...request,sequence:n};u.onend=u.onerror=()=>{if(sequence===n)active=null};engine.speak(u);return true}
 function numericOption(value){const text=String(value).replace(/[％]/g,'%').replace(/\s/g,'');return /^[+−\-]?(?:\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?%?|[\d()+−\-*/×÷.]+)$/.test(text)}
 return {speak,stop,numericOption,getStatus:()=>active?{...active}:null};
})();
if(typeof module!=='undefined')module.exports=CompetitionSpeech;

'use strict';
const ProgressStore=(()=>{
 function digest(text){
  const bytes=Array.from(unescape(encodeURIComponent(String(text))),x=>x.charCodeAt(0)),length=bytes.length*8;
  bytes.push(128);while(bytes.length%64!==56)bytes.push(0);for(let i=7;i>=0;i--)bytes.push(i>=4?0:(length>>>((i%4)*8))&255);
  const prime=[],initial=[],constants=[];for(let n=2;constants.length<64;n++)if(!prime.some(p=>n%p===0)){prime.push(n);if(initial.length<8)initial.push((Math.sqrt(n)%1*4294967296)|0);constants.push((Math.cbrt(n)%1*4294967296)|0)}
  const rotate=(x,n)=>(x>>>n)|(x<<(32-n)),h=initial.slice();
  for(let offset=0;offset<bytes.length;offset+=64){const w=[];for(let i=0;i<16;i++)w[i]=(bytes[offset+4*i]<<24)|(bytes[offset+4*i+1]<<16)|(bytes[offset+4*i+2]<<8)|bytes[offset+4*i+3];for(let i=16;i<64;i++){const x=w[i-15],y=w[i-2],a=rotate(x,7)^rotate(x,18)^(x>>>3),b=rotate(y,17)^rotate(y,19)^(y>>>10);w[i]=(w[i-16]+a+w[i-7]+b)|0}let [a,b,c,d,e,f,g,j]=h;for(let i=0;i<64;i++){const s=rotate(e,6)^rotate(e,11)^rotate(e,25),ch=(e&f)^(~e&g),t=(j+s+ch+constants[i]+w[i])|0,u=((rotate(a,2)^rotate(a,13)^rotate(a,22))+((a&b)^(a&c)^(b&c)))|0;j=g;g=f;f=e;e=(d+t)|0;d=c;c=b;b=a;a=(t+u)|0}for(const [i,v]of [a,b,c,d,e,f,g,j].entries())h[i]=(h[i]+v)|0}
  return h.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
 }
 function open(namespace,adapter={}){
  const storage=adapter.storage||localStorage,test=adapter.test===true,nav=typeof navigator==='undefined'?null:navigator;
  let writer=test,closed=false,pending=null,lastRaw=null,status=test?'ready':'acquiring',release=null;
  try{lastRaw=storage.getItem(namespace)}catch{writer=false;status='read_only'}
  const backups=[];
  const notify=()=>adapter.onStatus?.({status,raw:lastRaw});
  function flush(){if(!writer||closed)return {ok:false,reason:'NOT_WRITER'};if((()=>{try{return storage.getItem(namespace)}catch{status='read_only';return Symbol('unreadable')}})()!==lastRaw){status='conflict';notify();return {ok:false,reason:'CONFLICT'}}
   try{while(backups.length){const [key,value]=backups[0],old=storage.getItem(key);if(old!==null&&old!==value)throw Error('BACKUP_CONFLICT');if(old===null)storage.setItem(key,value);backups.shift()}if(pending!==null){storage.setItem(namespace,pending);lastRaw=pending;pending=null}status='ready';notify();return {ok:true,raw:lastRaw}}
   catch(e){status=e.message==='BACKUP_CONFLICT'?'conflict':'unsaved';notify();return {ok:false,reason:status==='conflict'?'CONFLICT':'QUOTA'}}
  }
  function commit(snapshot,expectedRaw){if(status==='conflict'||closed)return {ok:false,reason:'CONFLICT'};if(expectedRaw!==lastRaw)return {ok:false,reason:'CONFLICT'};try{pending=JSON.stringify(snapshot)}catch{status='unsaved';notify();return {ok:false,reason:'SERIALIZATION'}}if(!writer){notify();return {ok:false,reason:'NOT_WRITER',pending:true}}return flush()}
  if(!test&&nav?.locks?.request)nav.locks.request('amc8-writer:'+namespace,{mode:'exclusive',ifAvailable:true},lock=>{if(!lock||closed){status='read_only';notify();return}writer=true;status='ready';flush();return new Promise(resolve=>release=resolve)}).catch(()=>{status='read_only';notify()});
  else if(!test){status='read_only';Promise.resolve().then(notify)}
  return {commit,backup:(key,raw)=>{backups.push([key,raw]);return writer?flush():{ok:false,reason:'NOT_WRITER',pending:true}},flush,exportSnapshot:()=>({stored:lastRaw,pending}),getStatus:()=>status,close(){flush();closed=true;writer=false;release?.()}};
 }
 return {open,digest};
})();
if(typeof module!=='undefined')module.exports=ProgressStore;

'use strict';
// Read-only archive inventory. QA records never share the production writer.
const StorageNamespaces=(()=>{
 const store=typeof module!=='undefined'?require('./progress_store'):ProgressStore;
 function releaseNumber(release){const m=String(release?.siteVersion||release||'').match(/rc\.(\d+)/);if(!m)throw Error('INVALID_RELEASE');return Number(m[1])}
 function registry(release){
  const current=releaseNumber(release),rows=[{key:'tianle_amc8_question_design_v1',scope:'main',label:'正式练习'}];
  const versions=[current,...Array.from({length:Math.max(0,current-72)},(_,i)=>current-1-i)];
  for(const version of versions)for(const [scope,label,prefix]of [['qa','定向 QA','qa'],['qa-normal','正常入口 QA','qa_normal'],['qa-history','历史兼容 QA','qa_history']])rows.push({key:'tianle_amc8_'+prefix+'_rc'+version+'_v1',scope,label:label+' · RC'+version,version});
  return rows;
 }
 function utf8Text(raw){return Array.from(raw,c=>c.length===1&&c.charCodeAt(0)>=0xd800&&c.charCodeAt(0)<=0xdfff?'\ufffd':c).join('')}
 function bytes(raw){return unescape(encodeURIComponent(utf8Text(raw))).length}
 function inspect(storage,release){return registry(release).map(row=>{try{const raw=storage.getItem(row.key);return {...row,present:raw!==null,bytes:raw===null?0:bytes(raw)}}catch{return {...row,present:false,error:'READ_FAILED'}}})}
 function archive(storage,release,keys,at=new Date().toISOString()){
  const allowed=new Map(registry(release).map(r=>[r.key,r])),selected=[...new Set(keys||[...allowed.keys()])],entries=[],errors=[];
  for(const key of selected){
   if(!allowed.has(key)){errors.push({namespace:key,reason:'UNREGISTERED_NAMESPACE'});continue}
   try{
    const raw=storage.getItem(key);if(raw===null)continue;
    const backups=[];for(let i=0;i<storage.length;i++){const backupKey=storage.key(i);if(!backupKey?.startsWith(key+'_backup_'))continue;try{const value=storage.getItem(backupKey);if(value!==null)backups.push({key:backupKey,raw:value,bytes:bytes(value),sha256:store.digest(utf8Text(value))})}catch{errors.push({namespace:backupKey,reason:'BACKUP_READ_FAILED'})}}
    entries.push({namespace:key,scope:allowed.get(key).scope,raw,bytes:bytes(raw),sha256:store.digest(utf8Text(raw)),backups});
   }catch{errors.push({namespace:key,reason:'READ_FAILED'})}
  }
  return {format:'tianle-record-archive-v2',release:release?.siteVersion||release,exportedAt:at,entries,errors};
 }
 return {registry,inspect,archive,bytes,releaseNumber};
})();
if(typeof module!=='undefined')module.exports=StorageNamespaces;

'use strict';
// Student-authored relationships are checked structurally. A coincident number
// does not establish a relation, and unsupported notation remains an editable draft.
const CompetitionModelWorkspace=(()=>{
 const clean=x=>String(x).replace(/\s/g,'').replace(/×/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/＝/g,'=').replace(/≥/g,'>=').replace(/≤/g,'<=');
 function parse(source){
  const text=clean(source),tokens=text.match(/\d+(?:\.\d+)?|[\p{L}_][\p{L}\p{N}_]*|>=|<=|[<>()+*/-]/gu)||[];
  if(tokens.join('')!==text||text.length>160)return null;let i=0;
  function atom(){const t=tokens[i++];if(t==='('){const n=sum();if(tokens[i++]!==')')throw Error('paren');return n}if(t==='-')return {op:'neg',items:[atom()]};if(/^\d/.test(t||''))return {op:'number',value:t};if(/^[\p{L}_]/u.test(t||''))return {op:'quantity',value:t};throw Error('token')}
  function product(){let n=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++];n={op,items:[n,atom()]}}return n}
  function sum(){let n=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++];n={op,items:[n,product()]}}return n}
  try{let result=sum();if(['>=','<=','>','<'].includes(tokens[i])){const op=tokens[i++];result={op,items:[result,sum()]}}return i===tokens.length?result:null}catch{return null}
 }
 function canonical(ast){if(!ast)return null;if(ast.value!==undefined)return ast.op+':'+ast.value;let nodes=ast.items.map(canonical);if(['+','*'].includes(ast.op)){function flatten(n){return n.op===ast.op?n.items.flatMap(flatten):[canonical(n)]}nodes=ast.items.flatMap(flatten).sort()}return ast.op+'('+nodes.join(',')+')'}
 const rule=(id,left,forms,skills,deps=[])=>({id,left,forms,skills,deps});
 function contract(task,scopeId='main'){
  if(scopeId!=='main'||!task.competition.integrated)return null;
  const kind=task.competition.configurationId;
  const weighted=[rule('counts','红队人数',['总人数*2/5','2*总人数/5'],['R01.01']),rule('blue-count','蓝队人数',['总人数-红队人数','总人数*3/5'],['R01.01'],['counts'])];
  if(kind==='mean-admission')return {rules:[...weighted,rule('total','原总分',['红队人数*红队均分+蓝队人数*蓝队均分'],['D02.02'],['counts','blue-count']),rule('new-mean','新均分',['(原总分+新增人数*新增均分)/(总人数+新增人数)'],['D02.02'],['total']),rule('people','活动人数',['总人数+新增人数'],['A02.01'],['new-mean']),rule('materials','材料份数',['活动人数*4'],['A02.04'],['people']),rule('packing-enough','整包条件',['包数*8>=材料份数'],['N01.02'],['materials']),rule('packing-minimal','最少整包',['(包数-1)*8<材料份数'],['N01.02'],['packing-enough']),rule('cost','总费用',['包数*18'],['A02.04'],['materials'])],required:['total','new-mean','materials','packing-enough','packing-minimal','cost'],enumeration:true};
  if(kind==='score-training')return {rules:[...weighted,rule('red-score','红队原分',['(总人数*全体均分-蓝队人数*蓝队均分)/红队人数'],['D02.02'],['counts','blue-count']),rule('deficit','所需增分',['总人数*目标均分-总人数*全体均分','总人数*(目标均分-全体均分)'],['D02.02'],['red-score']),rule('personal','个人增分',['个人班目标分-红队原分'],['A02.01'],['red-score']),rule('group','小组增分',['3*(小组班目标分-红队原分)'],['A02.04'],['red-score']),rule('cost','总费用',['小组数*16+个人数*12'],['A02.04'],['deficit','personal','group'])],required:['red-score','deficit','personal','group','cost'],enumeration:true};
  if(kind==='length-border')return {rules:[rule('side-sum','长宽和',['周长/2'],['G01.02']),rule('width','宽',['长宽和*2/5','长宽和/5*2'],['R01.05'],['side-sum']),rule('length','长',['长宽和-宽','宽/2*3'],['R01.01'],['width']),rule('inner-length','内长',['长-2*边框宽'],['G01.03'],['length']),rule('inner-width','内宽',['宽-2*边框宽'],['G01.03'],['width']),rule('area','边框面积',['长*宽-内长*内宽'],['G01.03'],['inner-length','inner-width']),rule('tiles','砖块数',['边框面积/0.25'],['A03.04'],['area']),rule('packing-enough','整包条件',['包数*10>=砖块数'],['N01.02'],['tiles']),rule('packing-minimal','最少整包',['(包数-1)*10<砖块数'],['N01.02'],['packing-enough']),rule('cost','总费用',['包数*每包价格'],['A02.04'],['tiles'])],required:['side-sum','width','area','tiles','packing-enough','packing-minimal','cost'],enumeration:false};
  return {rules:[rule('length','长',['宽/2*3','宽*3/2'],['R01.05']),rule('perimeter','周长',['2*(长+宽)'],['G01.02'],['length']),rule('fence','围栏长度',['周长-门洞宽'],['A02.01'],['perimeter']),rule('panels','板材长度',['板数*2'],['A02.04'],['fence']),rule('panels-minimal','最少整板',['(板数-1)*2<围栏长度'],['N01.02'],['panels']),rule('panels-enough','整板条件',['板数*2>=围栏长度'],['N01.02'],['panels']),rule('purchase','板材费用',['整包数*70+单块数*15'],['A02.04'],['panels']),rule('cost','总费用',['板材费用+4*6'],['A02.04'],['purchase'])],required:['length','perimeter','fence','panels','panels-minimal','panels-enough','purchase','cost'],enumeration:true};
 }
 function ensure(scope){return scope.model??(scope.model={open:false,selectedSkillIds:[],draft:'',tableDraft:'',relations:{},candidateProof:null,events:[],feedback:null,processVerified:false})}
 function editDraft(scope,field,input){
  const s=ensure(scope),text=String(input).slice(0,160);if(s[field]===text)return false;
  s[field]=text;s.processVerified=false;scope.modelRevision=(scope.modelRevision||0)+1;
  if(field==='tableDraft'){s.candidateProof=null;s.feedback='候选表已修改，请重新核对。'}
  return true;
 }
 function facts(task,scope,scopeId){
  const model=ensure(scope),definition=contract(task,scopeId),relations={};let graph={facts:{},rows:[]};
  if(!definition)return {relations,graph};
  for(let pass=0;pass<=definition.rules.length;pass++){
   const before=Object.keys(relations).length;
   for(const r of definition.rules){const saved=model.relations[r.id],text=clean(saved?.input||''),index=text.indexOf('='),ast=index>=0?parse(text.slice(index+1)):null;
    if(saved?.status==='verified'&&text.slice(0,index)===r.left&&ast&&r.forms.some(form=>canonical(parse(form))===canonical(ast))&&r.deps.every(id=>relations[id]?.status==='verified'))relations[r.id]={...saved,usedSkillIds:r.skills};
   }
   if(scope.sketch){graph=(typeof module!=='undefined'?require('./learner_sketch_semantics'):LearnerSketchSemantics).assess(task,scope.sketch,scopeId,relations);Object.assign(relations,graph.facts)}
   if(Object.keys(relations).length===before)break;
  }
  return {relations,graph};
 }
 function verifyRelation(task,work,scopeId,input){
  const s=ensure(work.scopes[scopeId]),definition=contract(task,scopeId),text=clean(input),equal=text.indexOf('='),parts=equal<0?[]:[text.slice(0,equal),text.slice(equal+1)],ast=parts.length===2?parse(parts[1]):null;
  if(!definition||!ast){s.feedback='草稿已保留，这段表达暂未自动核验。可以继续完善或提交最终答案。';s.processVerified=false;return false}
  const r=definition.rules.find(r=>r.left===parts[0]&&r.forms.some(f=>canonical(parse(f))===canonical(ast)));
  if(!r){const prior=definition.rules.find(node=>node.left===parts[0]);if(prior&&s.relations[prior.id]){const changed=new Set([prior.id]);for(const node of definition.rules)if(node.deps.some(id=>changed.has(id)))changed.add(node.id);for(const id of changed)if(s.relations[id])s.relations[id].status='stale';s.candidateProof=null;}s.feedback='这段数量关系已保留，暂未核验量的对应、整体与单位。';s.processVerified=false;return false}
  if(r.deps.some(id=>facts(task,work.scopes[scopeId],scopeId).relations[id]?.status!=='verified')){s.feedback='这段关系涉及的前置量还未核验，请先确认你使用的量。';s.processVerified=false;return false}
  const invalid=new Set([r.id]);if(s.relations[r.id]?.semanticDigest!==canonical(ast)){for(const node of definition.rules)if(node.deps.some(id=>invalid.has(id)))invalid.add(node.id);for(const id of invalid)if(s.relations[id])s.relations[id].status='stale';s.candidateProof=null}
  work.scopes[scopeId].modelRevision=(work.scopes[scopeId].modelRevision||0)+1;
  s.relations[r.id]={input,status:'verified',providedBy:'student',quantityId:r.left,ruleId:r.id,semanticDigest:canonical(ast),usedSkillIds:r.skills,at:Date.now()};s.events.push({type:'relation-verified',ruleId:r.id,input,help:false});s.feedback='数量关系与条件一致。';assess(task,work,scopeId);return true;
 }
 function evaluateCandidates(task,scopeId,raw){
  const m=task.competition.math,kind=task.competition.configurationId;
  const fail=text=>({ok:false,text});
  if(scopeId!=='main'||!task.competition.integrated)return fail('当前任务的候选草稿暂不自动核验。');
  const entries=String(raw).split(/[,，、;；\s]+/).filter(Boolean).map(x=>x.split(/[:：]/)),values=entries.map(x=>Number(x[0]));if(!values.length||entries.some(x=>x.length!==2||!/^\d+$/.test(x[0]))||values.some(x=>!Number.isSafeInteger(x)||x<0)||new Set(values).size!==values.length)return fail('保留候选草稿，请逐个填写不重复的非负整数及判断或费用。');
  let required=[];
  if(kind==='mean-admission'){let k=0;while(k<=m.cap&&(m.total+k*m.score)<m.target*(m.N+k))k++;required=Array.from({length:k+1},(_,i)=>i)}
  else if(kind==='score-training')required=[0,1,2];
  else if(kind==='perimeter-fence')required=Array.from({length:Math.ceil(m.panels/5)+1},(_,i)=>i);
  else return fail('该任务按单位面积与完整包装核对，保留你的关系和最终答案。');
  if(required.some(x=>!values.includes(x))||values.some(x=>x>(kind==='mean-admission'?m.cap:kind==='score-training'?2:Math.ceil(m.panels/5))))return fail('候选范围还有遗漏；检查起点、边界以及是否覆盖所有可能更优的情况。');
  const results=entries.map(x=>x[1]),expected=values.map(value=>{if(kind==='mean-admission')return m.total+value*m.score>=m.target*(m.N+value)?'是':'否';if(kind==='score-training'){const personal=Math.max(0,Math.ceil((m.deficit-value*3*(m.high-10-m.low))/(m.high-m.low)));return value*3+personal<=m.red?String(value*16+personal*12):'不可行'}const singles=Math.max(0,m.panels-value*5);return String(value*70+singles*15)});
  if(results.some((x,i)=>x!==expected[i]))return fail('候选已保留；还需逐个填写并核对该候选的达标判断或最低费用。只列候选编号不足以验证最优性。');
  return {ok:true,candidates:values,decisions:entries.map((x,i)=>({candidate:values[i],result:results[i],providedBy:'student'}))};
 }
 function candidateProofCurrent(task,work,scopeId){
  const s=ensure(work.scopes[scopeId]),p=s.candidateProof;
  if(p?.contractVersion!==3||p.workId!==work.workId||p.scopeId!==scopeId||p.taskSignature!==task.competition.signature||p.input!==s.tableDraft||p.providedBy!=='student'||p.coverage!=='complete')return false;
  const result=evaluateCandidates(task,scopeId,s.tableDraft);
  return result.ok&&JSON.stringify(p.candidates)===JSON.stringify(result.candidates)&&JSON.stringify(p.decisions)===JSON.stringify(result.decisions)&&JSON.stringify(p.usedSkillIds)===JSON.stringify(['C02.03','A01.04','N01.02']);
 }
 function verifyCandidates(task,work,scopeId){
  const scope=work.scopes[scopeId],s=ensure(scope),prior=s.candidateProof,result=evaluateCandidates(task,scopeId,s.tableDraft);
  s.candidateProof=null;s.processVerified=false;
  if(!result.ok){if(prior)scope.modelRevision=(scope.modelRevision||0)+1;s.feedback=result.text;return false}
  const proof={contractVersion:3,workId:work.workId,scopeId,taskSignature:task.competition.signature,input:s.tableDraft,decisions:result.decisions,candidates:result.candidates,coverage:'complete',providedBy:'student',usedSkillIds:['C02.03','A01.04','N01.02']};
  if(JSON.stringify({...prior,at:undefined})!==JSON.stringify(proof))scope.modelRevision=(scope.modelRevision||0)+1;
  s.candidateProof={...proof,at:Date.now()};s.feedback='候选范围完整；仍需结合已建立的关系与最终答案核对可行性和最优性。';assess(task,work,scopeId);return true;
 }
 function assess(task,work,scopeId='main',finalCorrect){
  const scope=work.scopes[scopeId],s=ensure(scope),definition=contract(task,scopeId);if(!definition||scope.sketch?.readOnly===true){s.processVerified=false;return false}
  const current=facts(task,scope,scopeId),complete=definition.required.every(id=>current.relations[id]?.status==='verified'),used=new Set(Object.values(current.relations).flatMap(r=>r.usedSkillIds)),proofValid=candidateProofCurrent(task,work,scopeId);if(proofValid)for(const id of s.candidateProof.usedSkillIds)used.add(id);
  s.sketchVerification={contractVersion:1,verifiedRuleIds:Object.keys(current.graph.facts),unverifiedRelations:current.graph.rows.filter(r=>r.status!=='verified').map(r=>({id:r.id,status:r.status})),scopeId};
  const chosen=s.selectedSkillIds,tools=used.size>0&&[...used].every(id=>chosen.includes(id))&&chosen.every(id=>used.has(id));
  s.processVerified=complete&&tools&&(!definition.enumeration||proofValid)&&(finalCorrect??scope.answerState==='correct');return s.processVerified;
 }
 function panel(task,work,scopeId='main'){
  const scope=work.scopes[scopeId],s=scope.model;if(!s)return '';const e=esc,declared=new Set(topicSessionSettings().declaredSkillIds),skills=SKILL_DATA.skills.filter(k=>declared.has(k.id));
  return `<section class="model-workspace" data-scope-id="${e(scopeId)}"><button type="button" class="secondary" data-action="competitionModelToggle" data-scope="${e(scopeId)}">${s.open?'收起，保留我的工具和关系':'选择我的工具 / 写数量关系'}</button>${s.open?`<div class="model-tools">${SKILL_DATA.units.map(u=>{const available=skills.filter(k=>k.unitId===u.id);return available.length?`<details${s.selectedSkillIds.some(id=>id.startsWith(u.id+'.'))?' open':''}><summary>${e(u.title)}</summary>${available.map(k=>`<button type="button" class="secondary" data-action="competitionTool" data-scope="${e(scopeId)}" data-code="${e(k.id)}" aria-pressed="${s.selectedSkillIds.includes(k.id)}">${e(k.title)}</button>`).join('')}</details>`:''}).join('')}</div><p>先选你认为有用的已学知识，再写出量之间的关系。没有预选工具。</p><label>我的数量关系<input data-competition-input="relation" data-scope="${e(scopeId)}" maxlength="160" value="${e(s.draft)}" placeholder="量名=你建立的数量关系"></label><button type="button" class="secondary" data-action="competitionRelationCheck" data-scope="${e(scopeId)}">核对数量关系</button><ul>${Object.values(s.relations).map(r=>`<li>${e(r.input)} · ${r.status==='verified'?'关系已核验':'保留草稿，需重核'}</li>`).join('')}</ul><p>${task.competition.integrated&&scopeId==='main'?(task.competition.configurationId==='mean-admission'?'逐个记录 人数:是 或 人数:否，表示是否达到均分目标。':task.competition.configurationId==='length-border'?'核对单位面积与完整包装的数量关系。':'逐个记录 候选编号:最低费用；不可行时填写 不可行。'):'可记录自己检查过的整数候选。'}</p><label>我的候选检查表<input data-competition-input="candidates" data-scope="${e(scopeId)}" maxlength="160" value="${e(s.tableDraft)}" placeholder="候选:判断或费用，用分号分隔"></label><button type="button" class="secondary" data-action="competitionCandidatesCheck" data-scope="${e(scopeId)}">核对候选范围</button>${s.feedback?`<p data-model-feedback role="status">${e(s.feedback)}</p>`:''}${s.processVerified?'<p data-process-verification="verified" role="status">工具、数量关系和目标检查均有可核验记录。</p>':''}`:''}</section>`;
 }
 return {parse,canonical,contract,ensure,editDraft,verifyRelation,verifyCandidates,evaluateCandidates,candidateProofCurrent,assess,panel,facts};
})();
if(typeof module!=='undefined')module.exports=CompetitionModelWorkspace;

'use strict';
const CompetitionController=(()=>{
 let epoch=0;
 function invalidate(){epoch++;competitionStopCurrentSpeech()}
 function prepare(task){
  draft.work=CompetitionWork.restore(draft.work,task,{sessionId:topicSession()?.id});
  const m=draft.work.scopes.main;
  const free=task.competition.family==='threeGroupBalance'||task.competition.integrated;
  if(!free&&m.input.selectedOptionId)draft.choice=task.optionIds.indexOf(m.input.selectedOptionId);
  else if(!free&&draft.choice>=0)m.input.selectedOptionId=task.optionIds[draft.choice];
  for(const scope of Object.values(draft.work.scopes))CompetitionModelWorkspace.ensure(scope);
  reasoningState(task);learnerSketchState(task);learnerSketchState(task,CompetitionWork.variationId(task));competitionHistory(task);displayOrder(task,'options');
  const r=draft.work.reasoning;if(r){if(!m.input.raw)m.input.raw=String(r.finalInput||'');Object.defineProperty(r,'finalInput',{configurable:true,get:()=>m.input.raw,set:value=>CompetitionWork.setInput(draft.work,'main',value)})}
  const v=draft.work.scopes[CompetitionWork.variationId(task)],last=saved.competition.extensions.findLast(a=>a.signature===task.competition.signature&&a.variationSignature===competitionVariationSignature(task)&&a.input===v.input.raw);
  if(last){const checked=SubmissionContract.numeric(v.input.raw,task.competition.extension.answer);v.feedback={...checked,input:v.input.raw,variationSignature:competitionVariationSignature(task)};v.answerState=checked.ok?'correct':'incorrect'}
  if(!last&&['awaiting_input','invalid_input'].includes(v.feedback?.status))v.feedback=SubmissionContract.numeric(v.input.raw,task.competition.extension.answer);
  for(const [id,scope]of Object.entries(draft.work.scopes)){CompetitionModelWorkspace.assess(task,draft.work,id);if(scope.model.candidateProof?.contractVersion===2)scope.model.feedback='这份候选表需要重新核对，原作答记录仍保留。';}
  return draft.work;
 }
 function dispatch(command){if(command.runEpoch!==undefined&&command.runEpoch!==epoch)return {handled:true,changed:false,resultCode:'STALE_VIEW'};if(command.type==='RESET_QA'){invalidate();return {handled:true,changed:true,resultCode:'RESET'}}if(command.type==='SET_INPUT'){if(draft.work.activeScopeId!==command.scopeId)competitionStopCurrentSpeech();CompetitionWork.setInput(draft.work,command.scopeId,command.payload.raw,command.payload.optionId);return {handled:true,changed:true,resultCode:'EDITED'}}return {handled:false,changed:false,resultCode:'UNHANDLED'}}
 return {prepare,dispatch,invalidate,getEpoch:()=>epoch};
})();

'use strict';
// Student-created scratch models. Arithmetic checks never certify an invented
// relationship as relevant to the problem or as an independently proved route.
const LearnerSketch=((P)=>{
 const kinds=['quantity','bar','group','balance','set','timeline','table','area','stack'],relations=['=','+','−','×','÷','关联','→'],roles=['known','target','conjecture','derived'];
 const fresh=(signature,scopeId='main')=>({schemaVersion:2,signature,scopeId,open:false,nodes:[],edges:[],semanticRelations:[],nextId:1,selected:null,linkFrom:null,kindInput:'quantity',countInput:'1',unitInput:'',roleInput:'known',relationInput:'关联',labelInput:'',valueInput:'',quantityInput:'',representationInput:'schematic',scaleInput:'1',expressionInput:'',semanticExpressionInput:'',feedback:null,undo:[],redo:[],events:[]});
 const isProtected=s=>s?.kind==='protected-learner-sketch'&&s.readOnly===true&&Object.prototype.hasOwnProperty.call(s,'retainedDraft');
 const original=s=>isProtected(s)?s.retainedDraft:s;
 const protect=(raw,signature,scopeId,reason)=>({...fresh(signature,scopeId),kind:'protected-learner-sketch',readOnly:true,protectionReason:reason,retainedDraft:JSON.parse(JSON.stringify(original(raw)))});
 const event=(s,type,data={})=>{if(!isProtected(s))s.events.push({type,at:Date.now(),...data,help:false})};
 function restore(value,signature,scopeId='main'){
  if(isProtected(value))value=value.retainedDraft;
  if(value==null)return fresh(signature,scopeId);
  if(![1,2].includes(value.schemaVersion))return protect(value,signature,scopeId,'UNSUPPORTED_SCHEMA');
  if(value.signature!==signature)return protect(value,signature,scopeId,'IDENTITY_MISMATCH');
  const s={...fresh(signature,scopeId),open:value.open===true,kindInput:kinds.includes(value.kindInput)?value.kindInput:'quantity',countInput:String(value.countInput||'1').slice(0,2),unitInput:String(value.unitInput||'').slice(0,12),roleInput:roles.includes(value.roleInput)?value.roleInput:'known',relationInput:relations.includes(value.relationInput)?value.relationInput:'关联',labelInput:String(value.labelInput||'').slice(0,40),valueInput:String(value.valueInput||'').slice(0,160),quantityInput:String(value.quantityInput||'').slice(0,40),representationInput:value.representationInput==='counted'?'counted':'schematic',scaleInput:String(value.scaleInput||'1').slice(0,40),semanticExpressionInput:String(value.semanticExpressionInput||'').slice(0,160),expressionInput:String(value.expressionInput||'').slice(0,160),feedback:typeof value.feedback==='string'?value.feedback.slice(0,1000):null};
  const cleanNodes=items=>{const seen=new Set();return (Array.isArray(items)?items:[]).filter(n=>{if(!n||typeof n.id!=='string'||seen.has(n.id)||typeof n.label!=='string'||typeof n.value!=='string'||!Number.isFinite(n.x)||!Number.isFinite(n.y))return false;seen.add(n.id);return true}).slice(0,40).map(n=>({...n,label:n.label.slice(0,40),value:n.value.slice(0,160),quantityId:String(n.quantityId||'').slice(0,40),scopeId:String(n.scopeId||scopeId).slice(0,120),representation:n.representation==='counted'?'counted':'schematic',scale:String(n.scale||'1').slice(0,40),unit:String(n.unit||'').slice(0,12),role:roles.includes(n.role)?n.role:'known',kind:kinds.includes(n.kind)?n.kind:'quantity',count:Number.isInteger(n.count)&&n.count>=1&&n.count<=12?n.count:1,x:Math.max(55,Math.min(465,n.x)),y:Math.max(55,Math.min(1800,n.y)),verification:'student-draft'}))};
  const cleanEdges=(items,ids)=>(Array.isArray(items)?items:[]).filter(e=>e&&ids.has(e.from)&&ids.has(e.to)&&e.from!==e.to&&relations.includes(e.label)).slice(0,200).map(e=>({...e,verification:'student-draft'}));
  const cleanSemantic=(items,ids)=>(Array.isArray(items)?items:[]).filter(r=>r&&typeof r.id==='string'&&ids.has(r.outputNodeId)&&typeof r.expression==='string').slice(0,40).map(r=>({...r,expression:r.expression.slice(0,160),inputNodeIds:(Array.isArray(r.inputNodeIds)?r.inputNodeIds:[]).filter(id=>ids.has(id)),providedBy:'student'}));
  s.nodes=cleanNodes(value.nodes);const ids=new Set(s.nodes.map(n=>n.id));s.edges=cleanEdges(value.edges,ids);s.semanticRelations=cleanSemantic(value.semanticRelations,ids);
  s.selected=ids.has(value.selected)?value.selected:null;s.linkFrom=ids.has(value.linkFrom)?value.linkFrom:null;s.nextId=Math.max(s.nodes.length+1,...s.nodes.map(n=>Number(n.id.match(/^student-(\d+)$/)?.[1]||0)+1),Number.isSafeInteger(value.nextId)?value.nextId:1);
  for(const key of ['undo','redo'])s[key]=(Array.isArray(value[key])?value[key]:[]).slice(-20).map(old=>{const nodes=cleanNodes(old?.nodes),oldIds=new Set(nodes.map(n=>n.id));return {nodes,edges:cleanEdges(old?.edges,oldIds),semanticRelations:cleanSemantic(old?.semanticRelations,oldIds),selected:oldIds.has(old?.selected)?old.selected:null,linkFrom:oldIds.has(old?.linkFrom)?old.linkFrom:null}});
  s.events=(Array.isArray(value.events)?value.events:[]).filter(e=>e&&typeof e.type==='string'&&Number.isFinite(e.at)).map(e=>({...e,help:false}));
  return s;
 }
 const snapshot=s=>({nodes:JSON.parse(JSON.stringify(s.nodes)),edges:JSON.parse(JSON.stringify(s.edges)),semanticRelations:JSON.parse(JSON.stringify(s.semanticRelations||[])),selected:s.selected,linkFrom:s.linkFrom});
 function remember(s){if(isProtected(s))return false;s.undo.push(snapshot(s));if(s.undo.length>20)s.undo.shift();s.redo=[]}
 function attributes(s){const count=Number(s.countInput);if(!/^\d{1,2}$/.test(s.countInput)||count<1||count>12){s.feedback='图中份数或物件数请填 1 至 12；它由你决定，不是题目答案。';return null}return {kind:kinds.includes(s.kindInput)?s.kindInput:'quantity',count,unit:String(s.unitInput||'').slice(0,12),role:roles.includes(s.roleInput)?s.roleInput:'known',quantityId:String(s.quantityInput||'').trim().slice(0,40),scopeId:s.scopeId||'main',representation:s.representationInput==='counted'?'counted':'schematic',scale:String(s.scaleInput||'1').slice(0,40)}}
 function add(s){
  if(isProtected(s))return false;
  const label=s.labelInput.trim(),value=s.valueInput.trim();if(!label){s.feedback='给这个量起一个名字，例如“红队人数”。';return false}if(s.nodes.length>=40){s.feedback='先整理已有的量，或保留这张图后另画一张。';return false}
  const attrs=attributes(s);if(!attrs)return false;remember(s);const i=s.nodes.length,id='student-'+s.nextId++;s.nodes.push({id,label:label.slice(0,40),value:value.slice(0,160),...attrs,x:85+(i%3)*175,y:65+Math.floor(i/3)*130,verification:'student-draft'});s.selected=id;s.linkFrom=null;s.labelInput='';s.valueInput='';s.quantityInput='';s.semanticExpressionInput='';s.feedback='这个量已放进你的草图。可选一个量作为连线起点。';event(s,'quantity-added',{nodeId:id,label,value,...attrs});return true;
 }
 function link(s,id,label='关联'){
  if(isProtected(s))return false;
  if(!s.nodes.some(n=>n.id===id))return false;
  if(!s.linkFrom){s.selected=id;const n=s.nodes.find(n=>n.id===id);s.labelInput=n.label;s.valueInput=n.value;s.kindInput=n.kind||'quantity';s.countInput=String(n.count||1);s.unitInput=n.unit||'';s.roleInput=n.role||'known';s.quantityInput=n.quantityId||'';s.representationInput=n.representation||'schematic';s.scaleInput=n.scale||'1';s.semanticExpressionInput=s.semanticRelations?.find(r=>r.outputNodeId===id)?.expression||'';return true}
  if(!relations.includes(label))return false;
  if(s.linkFrom===id)return true;
  const from=s.linkFrom;if(s.edges.some(e=>e.from===from&&e.to===id&&e.label===label)){s.selected=id;s.linkFrom=null;return true}
  remember(s);s.edges.push({from,to:id,label,verification:'student-draft'});s.selected=id;s.linkFrom=null;s.feedback='关系已记下。检查它是否能由题目条件得到。';event(s,'relation-drafted',{from,to:id,label});return true;
 }
 function semantic(){return typeof module!=='undefined'?require('./learner_sketch_semantics'):LearnerSketchSemantics}
 function update(s){if(isProtected(s))return false;const n=s.nodes.find(n=>n.id===s.selected);if(!n||!s.labelInput.trim())return false;const attrs=attributes(s);if(!attrs)return false;remember(s);semantic().invalidate(s,n.id);n.label=s.labelInput.trim().slice(0,40);n.value=s.valueInput.trim().slice(0,160);Object.assign(n,attrs);s.feedback='已修改这个量，使用它的下游关系需重新核对。';event(s,'quantity-revised',{nodeId:n.id,label:n.label,value:n.value,...attrs});return true}
 function remove(s){if(isProtected(s)||!s.selected)return;remember(s);const id=s.selected;semantic().invalidate(s,id);s.nodes=s.nodes.filter(n=>n.id!==id);s.edges=s.edges.filter(e=>e.from!==id&&e.to!==id);s.semanticRelations=(s.semanticRelations||[]).filter(r=>r.outputNodeId!==id);s.selected=null;if(s.linkFrom===id)s.linkFrom=null;event(s,'quantity-removed',{nodeId:id})}
 function move(s,dx,dy){if(isProtected(s))return false;const n=s.nodes.find(n=>n.id===s.selected);if(!n||!Number.isFinite(dx)||!Number.isFinite(dy))return;remember(s);n.x=Math.max(55,Math.min(465,n.x+dx));n.y=Math.max(55,Math.min(1800,n.y+dy));event(s,'quantity-moved',{nodeId:n.id,x:n.x,y:n.y})}
 function undo(s){if(isProtected(s))return false;const old=s.undo.pop();if(!old)return false;s.redo.push(snapshot(s));Object.assign(s,old);s.feedback='已撤回上一步，原操作仍保留在记录中。';event(s,'undo');return true}
 function redo(s){if(isProtected(s))return false;const old=s.redo.pop();if(!old)return false;s.undo.push(snapshot(s));Object.assign(s,old);s.feedback='已重做一步。';event(s,'redo');return true}
 function calculate(s){
  if(isProtected(s))return false;
  const n=s.nodes.find(n=>n.id===s.selected),value=P.arithmetic(s.expressionInput);if(!n){s.feedback='先选你正在求的量。';return false}if(!value){s.feedback='算式已保留。可使用数、分数、括号及四则运算。';return false}
  const ok=n.value.trim()?P.equal(s.expressionInput,n.value):null;s.feedback=ok===null?'算式已记下。把计算结果写到对应的量，再代回题目条件。':ok?'计算一致。再检查这个量和所画关系是否符合题目条件。':'算式和这个量的数值还不一致，先核对计算。';
  event(s,'arithmetic-check',{nodeId:n.id,expression:s.expressionInput,arithmeticCorrect:ok,processVerified:false});return ok;
 }
 return {fresh,restore,isProtected,original,event,add,link,update,remove,move,undo,redo,calculate,remember,kinds,relations,roles};
})(typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=LearnerSketch;

'use strict';
// A drawing acquires meaning only through explicit student quantity bindings and
// checked directed relations. Saved verification labels are never authoritative.
const LearnerSketchSemantics=((Model,P)=>{
 const countedKinds=new Set(['bar','group','balance','set','area','stack']);
 const unit=x=>String(x||'').trim().replace(/m²|m2|㎡/g,'平方米').replace(/^m$/,'米');
 const refs=ast=>ast?.op==='quantity'?[ast.value]:(ast?.items||[]).flatMap(refs);
 const fingerprint=n=>JSON.stringify([n.id,n.label,n.quantityId,n.scopeId,n.role,unit(n.unit),n.value,n.kind,n.count,n.representation||'schematic',n.scale||'1']);
 function contract(task,scopeId='main'){
  const model=Model.contract(task,scopeId);if(!model)return null;
  const m=task.competition.math,k=task.competition.configurationId,quantities={};
  const put=(name,u,role='derived',value)=>quantities[name]={id:name,unit:u,role,...(value===undefined?{}:{value:String(value)})};
  const known=(name,u,value)=>put(name,u,'known',value);
  if(k==='mean-admission'||k==='score-training'){
   known('总人数','人',m.N);known('蓝队均分','分',m.high);
   for(const q of ['红队人数','蓝队人数'])put(q,'人');
   if(k==='mean-admission'){
    known('红队均分','分',m.low);known('新增均分','分',m.score);known('目标均分','分',m.target);
    put('原总分','分');put('新均分','分');put('新增人数','人','conjecture');put('活动人数','人');put('材料份数','份');put('包数','包','conjecture');put('整包条件','');put('最少整包','');
   }else{
    known('全体均分','分',m.mean);known('目标均分','分',m.target);known('个人班目标分','分',m.high);known('小组班目标分','分',m.high-10);
    for(const q of ['红队原分','所需增分','个人增分','小组增分'])put(q,'分');
    put('小组数','组','conjecture');put('个人数','人','conjecture');
   }
  }else if(k==='length-border'){
   known('周长','米',m.perimeter);known('边框宽','米',m.border);known('每包价格','元',m.price);
   for(const q of ['长宽和','宽','长','内长','内宽'])put(q,'米');
   put('边框面积','平方米');put('砖块数','块');put('包数','包','conjecture');put('整包条件','');put('最少整包','');
  }else{
   known('宽','米',m.W);known('门洞宽','米',m.gate);
   for(const q of ['长','周长','围栏长度','板材长度'])put(q,'米');
   put('板数','块','conjecture');put('整包数','包','conjecture');put('单块数','块','conjecture');put('板材费用','元');put('最少整板','');put('整板条件','');
  }
  put('总费用','元','target');return {...model,quantities};
 }
 function nodeIssue(n,definition,scopeId){
  const q=definition.quantities[n.quantityId];
  if(!q)return '这个量名尚未与本题的数量对应，草图仍保留。';
  if(n.scopeId!==scopeId)return '这个量属于另一题或另一作答范围，请重新放入当前草图。';
  if(n.role!==q.role)return '请核对“'+n.label+'”是题给条件、推导量、待比较的候选，还是最终目标。';
  if(unit(n.unit)!==q.unit)return '请核对“'+n.label+'”的单位与题中所指的量是否一致。';
  if(q.role==='known'&&!P.equal(n.value,q.value))return '“'+n.label+'”与题给数值还不一致。';
  if(n.representation==='counted'){
   if(!countedKinds.has(n.kind))return '这种图形保留为示意；按数量表示可使用份数条、分组、集合、天平盘、面积格或立体块。';
   const scale=P.arithmetic(n.scale||'1');
   if(!scale||scale[0]<=0n||!P.equal(String(n.count)+'*('+String(n.scale||'1')+')',n.value))return '实际图形个数乘每个代表的量，与填写的数量还不一致。';
  }
  return null;
 }
 function mappedAst(ast,byAlias){
  if(ast.op==='quantity'){const n=byAlias.get(ast.value);return n?{op:'quantity',value:n.quantityId}:null}
  if(ast.value!==undefined)return ast;
  const items=ast.items.map(x=>mappedAst(x,byAlias));return items.every(Boolean)?{op:ast.op,items}:null;
 }
 function numeric(ast,byQuantity){
  if(ast.op==='number')return ast.value;
  if(ast.op==='quantity'){const v=byQuantity.get(ast.value)?.value;return P.arithmetic(v)?'('+v+')':null}
  const a=ast.items.map(x=>numeric(x,byQuantity));if(a.some(x=>x===null))return null;
  if(ast.op==='neg')return '-('+a[0]+')';
  if(['<','>','<=','>='].includes(ast.op)){
   const x=P.arithmetic(a[0]),y=P.arithmetic(a[1]);if(!x||!y)return null;
   let left=x[0]*y[1],right=y[0]*x[1];if(x[1]*y[1]<0n){left=-left;right=-right}
   return ({'<':left<right,'>':left>right,'<=':left<=right,'>=':left>=right}[ast.op])?'是':'否';
  }
  return '('+a[0]+ast.op+a[1]+')';
 }
 function assess(task,sketch,scopeId='main',manualFacts={}){
  const definition=contract(task,scopeId),facts={},rows=[];
  if(!definition||!sketch||sketch.readOnly===true||sketch.signature!==task.competition.signature+(scopeId==='main'?'':':'+scopeId))return {supported:!!definition,facts,rows};
  const nodes=sketch.nodes||[],byId=new Map(nodes.map(n=>[n.id,n])),byQuantity=new Map(),byAlias=new Map(),duplicates=new Set();
  for(const n of nodes.filter(n=>n.quantityId)){
   if(byQuantity.has(n.quantityId))duplicates.add(n.quantityId);byQuantity.set(n.quantityId,n);
   for(const alias of new Set([n.label,n.quantityId])){if(byAlias.has(alias)&&byAlias.get(alias)!==n)byAlias.set(alias,null);else if(!byAlias.has(alias))byAlias.set(alias,n)}
  }
  for(const saved of (sketch.semanticRelations||[]).slice(0,40)){
   const output=byId.get(saved.outputNodeId),ast=Model.parse(saved.expression),mapped=ast&&mappedAst(ast,byAlias),rule=output&&definition.rules.find(r=>r.left===output.quantityId&&mapped&&r.forms.some(f=>Model.canonical(Model.parse(f))===Model.canonical(mapped))),inputs=mapped?[...new Set(refs(mapped))].map(q=>byQuantity.get(q)):[],involved=[output,...inputs];
   let issue=!output?'对应的输出量已移除。':ast&&refs(ast).some(name=>byAlias.has(name)&&byAlias.get(name)===null)?'同一个量对应了多个图或重名标签，请先明确使用哪个。':!rule?'这条关系暂未核验，草稿已保留；数值相同不能代替数量关系。':null;
   if(!issue)issue=involved.map(n=>!n?'关系里有尚未放入图中的量。':duplicates.has(n.quantityId)?'同一个题中量对应了多个图，请先明确使用哪个。':nodeIssue(n,definition,scopeId)).find(Boolean)||null;
   if(!issue&&(!saved.checked||saved.stale||involved.some(n=>saved.nodeFingerprints?.[n.id]!==fingerprint(n))))issue='使用的量已改变，请重新核对这条关系。';
   if(!issue&&output.value.trim()){
    const value=numeric(mapped,byQuantity);
    if(value===null||(['是','否'].includes(value)?value!==output.value.trim():!P.equal(value,output.value)))issue='这条关系与输出量填写的值还不一致，请核对计算或暂时留空。';
   }
   rows.push({id:saved.id,ruleId:rule?.id,outputNodeId:saved.outputNodeId,inputNodeIds:inputs.map(n=>n?.id).filter(Boolean),status:issue?(saved.stale?'stale':'unverified'):'pending',issue,rule,ast:mapped,saved});
  }
  // Fixed point supports any order of student entry without accepting a cycle.
  for(let pass=0;pass<=rows.length;pass++){let changed=false;for(const row of rows){if(row.status!=='pending')continue;if(row.rule.deps.some(id=>facts[id]?.status!=='verified'&&manualFacts[id]?.status!=='verified'))continue;row.status='verified';facts[row.rule.id]={status:'verified',providedBy:'student',origin:'sketch',quantityId:row.rule.left,ruleId:row.rule.id,semanticDigest:Model.canonical(row.ast),usedSkillIds:row.rule.skills,input:row.rule.left+'='+row.saved.expression,sketchRelationId:row.id};changed=true}if(!changed)break}
  for(const row of rows)if(row.status==='pending'){row.status='unverified';row.issue='关系使用的前置量还没有核验。'}
  return {supported:true,facts,rows,nodeIssues:Object.fromEntries(nodes.filter(n=>n.quantityId).map(n=>[n.id,nodeIssue(n,definition,scopeId)]))};
 }
 function check(task,sketch,scopeId='main',manualFacts={}){
  if(sketch.readOnly===true)return false;
  const output=sketch.nodes.find(n=>n.id===sketch.selected),definition=contract(task,scopeId);
  if(!definition){sketch.feedback='这道题的自由草图已保留，数量关系暂未自动核验。';return false}
  if(!output?.quantityId){sketch.feedback='先选择输出量，并填写它代表题目中的哪个量。';return false}
  const ast=Model.parse(sketch.semanticExpressionInput),byAlias=new Map();for(const n of sketch.nodes)for(const alias of [n.label,n.quantityId].filter(Boolean))if(!byAlias.has(alias))byAlias.set(alias,n);else if(byAlias.get(alias)!==n)byAlias.set(alias,null);
  const mapped=ast&&mappedAst(ast,byAlias),inputIds=mapped?[...new Set(refs(mapped))].map(q=>sketch.nodes.find(n=>n.quantityId===q)?.id).filter(Boolean):[];
  const previous=(sketch.semanticRelations||[]).find(r=>r.outputNodeId===output.id);
  sketch.semanticModelChanged=!!previous&&(previous.expression!==sketch.semanticExpressionInput||previous.stale||[output.id,...inputIds].some(id=>previous.nodeFingerprints?.[id]!==fingerprint(sketch.nodes.find(n=>n.id===id))));
  if(sketch.semanticModelChanged)invalidate(sketch,output.id);
  const rule=definition.rules.find(r=>r.left===output.quantityId&&mapped&&r.forms.some(f=>Model.canonical(Model.parse(f))===Model.canonical(mapped))),dependencyNodeIds=(rule?.deps||[]).map(id=>definition.rules.find(r=>r.id===id)?.left).map(q=>sketch.nodes.find(n=>n.quantityId===q)?.id).filter(Boolean);
  const relation={id:previous?.id||'relation-'+output.id,outputNodeId:output.id,inputNodeIds:inputIds,dependencyNodeIds,expression:String(sketch.semanticExpressionInput).slice(0,160),checked:true,stale:false,providedBy:'student',nodeFingerprints:Object.fromEntries([output.id,...inputIds].map(id=>sketch.nodes.find(n=>n.id===id)).filter(Boolean).map(n=>[n.id,fingerprint(n)]))};
  sketch.semanticRelations=(sketch.semanticRelations||[]).filter(r=>r.outputNodeId!==output.id);sketch.semanticRelations.push(relation);
  const result=assess(task,sketch,scopeId,manualFacts),row=result.rows.find(r=>r.id===relation.id),ok=row?.status==='verified';
  sketch.edges=sketch.edges.filter(e=>e.semanticRelationId!==relation.id);
  if(ok)for(const from of row.inputNodeIds)sketch.edges.push({from,to:output.id,label:'→',semanticRelationId:relation.id,relationRuleId:row.ruleId,inputNodeId:from,outputNodeId:output.id,verification:'student-draft'});
  sketch.feedback=ok?'图中的量、单位和这条有向关系已核验。最终还需核对工具、条件及最优性。':row?.issue||'这条关系暂未核验，草稿已保留。';
  sketch.events.push({type:'sketch-relation-check',at:Date.now(),relationId:relation.id,ruleId:row?.ruleId||null,verified:!!ok,help:false});return !!ok;
 }
 function invalidate(sketch,nodeId){
  const affected=new Set([nodeId]);let changed=true;
  while(changed){changed=false;for(const r of sketch.semanticRelations||[])if(!r.stale&&(affected.has(r.outputNodeId)||[...(r.inputNodeIds||[]),...(r.dependencyNodeIds||[])].some(id=>affected.has(id)))){r.stale=true;affected.add(r.outputNodeId);changed=true}}
 }
 return {contract,assess,check,invalidate,nodeIssue,fingerprint,countedKinds};
})(typeof module!=='undefined'?require('./competition_model_workspace'):CompetitionModelWorkspace,typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=LearnerSketchSemantics;

'use strict';
// Content-only engineering hold-outs use the same renderer, grader and history.
// No validation family is added to the normal 141-family supply registry.
const ValidationRuntime=((base,math)=>{
 const catalog=[],factories=new Map(),copy=x=>JSON.parse(JSON.stringify(x));
 function register(rows){for(const f of rows){if(!/^validation-[a-z-]+$/.test(f.id)||factories.has(f.id)||typeof f.build!=='function'||!f.topicIds.length)throw Error('Invalid validation content');factories.set(f.id,f);catalog.push({id:f.id,title:f.title,topicIds:f.topicIds,qaValidation:true})}}
 function state(f,s,phase){return {schemaVersion:1,id:f.id+':'+phase,familyId:f.id,kind:phase,math:copy(s.parameters),goal:{id:f.id+':'+phase+':target',object:s.goal,unit:s.unit||''},relations:copy(s.conditions),quantityDomain:s.domain,quantityIds:Object.keys(s.parameters).map(k=>({id:f.id+':'+phase+':'+k,key:k})),expectedAnswer:String(s.answer),adapterStatus:'explicit',answerContract:{kind:'exact-rational',value:String(s.answer),unit:s.unit||'',allowApproximation:false}}}
 function graph(f,s){
  return {schemaVersion:1,graphRevision:2,familyId:f.id,configurationId:'contract-v1',goal:s.goal,coverageStatus:'authored',routes:s.routes.map(r=>({id:r.id,name:r.name,requiredSkills:[...r.requiredSkills],nodes:r.nodes.map(n=>({...n,answer:String(n.answer),prerequisiteIds:[...(n.prerequisiteIds||[])],inputIds:[...(n.prerequisiteIds||[])],outputId:n.id,acceptedExpressions:[String(n.answer),...(n.acceptedExpressions||[])],sceneIncrement:{id:n.id,unit:n.unit||''},hintApplicability:{nodeId:n.id,prerequisiteIds:[...(n.prerequisiteIds||[])]},disclosure:'current-node-only'}))}))};
 }
 function create(recipe){
  const f=factories.get(recipe?.familyId);if(recipe?.engine!==4||!f||recipe.generatorRevision!==1||recipe.configurationId!=='contract-v1'||!Number.isInteger(recipe.seed)||recipe.seed<1||recipe.seed>2147483647)throw Error('Unknown or invalid QA validation recipe');
  const spec=f.build(recipe.seed),a=spec.main,b=spec.variation;
  for(const s of [a,b])if(!s.prompt||math.arithmetic(s.answer)===null||!s.conditions.length||!s.diagram||!s.routes.length)throw Error('Incomplete validation state');
  const ps=state(f,a,'main'),vs=state(f,b,'variation'),g=graph(f,a),vg=graph(f,b),signature=JSON.stringify({engine:4,family:f.id,configurationId:'contract-v1',math:a.parameters,conditions:a.conditions,goal:a.goal}),id='COMP-'+base.competitionHash(signature),variationSignature=JSON.stringify({engine:4,family:f.id,configurationId:'contract-v1',math:b.parameters,conditions:b.conditions,goal:b.goal});
  const diagram={...a.diagram,mathStateId:ps.id,targetQuantityId:ps.goal.id,statePhase:'main-givens'},vd={...b.diagram,mathStateId:vs.id,targetQuantityId:vs.goal.id,statePhase:'variation-givens'};ps.projection={diagram};vs.projection={diagram:vd};
  const methods=g.routes.map(r=>({name:r.name,steps:r.nodes.map(n=>n.prompt+' '+n.answer+' '+(n.unit||'')),frames:r.nodes.map((n,i)=>({kind:'scene-stage',scene:{kind:'scene-quantities',dependencyGraph:true,quantities:r.nodes.slice(0,i+1).map(q=>({id:q.id,prerequisiteIds:q.prerequisiteIds,label:q.prompt,value:q.answer,unit:q.unit})),caption:'该解法已经给出的量与依赖'},stage:{kind:'solution',route:r.id,step:i,text:n.prompt}}))}));
  const options=base.competitionNumericOptions(String(a.answer),base.competitionRng(recipe.seed)),hints=a.routes[0].nodes[0].hints.slice(0,2),solution=b.routes[0].nodes.map(n=>n.prompt+' '+n.answer+' '+(n.unit||'')).join('；');
  const extension={prompt:b.prompt,answer:String(b.answer),signature:variationSignature,math:b.parameters,diagram:vd,problemState:vs,answerContract:vs.answerContract,solution,solutionFrames:[{kind:'scene-stage',mathStateId:vs.id,targetQuantityId:vs.goal.id,scene:{...vd,statePhase:'variation-solution'},stage:{kind:'solution',step:0,text:solution,mathStateId:vs.id,targetQuantityId:vs.goal.id}}]};
  const c={family:f.id,title:f.title,prompt:a.prompt,answer:String(a.answer),math:a.parameters,signature,topicIds:[...f.topicIds],recipe:copy(recipe),configurationId:'contract-v1',diagram,hintDiagram:{...diagram,stage:{kind:'hint',text:hints[1]}},hints,ruleHints:hints,methods,extension,problemState:ps,answerContract:ps.answerContract,authoredGraph:g,variationGraph:vg,routes:g.routes,requiredSkillsByRoute:g.routes.map(r=>({id:r.id,requiredSkills:r.requiredSkills})),variantTransform:{category:spec.transform.category,changed:spec.transform.changed,preserved:spec.transform.preserved,newStrategyClaim:false},sourceProvenance:{sourceId:'engineering-validation',matchType:'original',productionEnabled:false},level:2,insight:spec.insight,reasoningLoad:{level:2,reason:spec.insight},readingLoad:{level:2,characters:a.prompt.length},calculationLoad:{level:2,operations:g.routes[0].nodes.length,enumeration:0,fractional:a.answer.includes('/'),digits:2},qaValidation:true};
  return {id,contentVersion:101,skillId:f.topicIds[0]+'.01',phase:'挑战',mode:'competition',prompt:a.prompt,options,optionIds:options.map(x=>id+':'+x),answer:options.indexOf(String(a.answer)),competition:c};
 }
 if(typeof window!=='undefined'&&window.__AMC8_VALIDATION_FACTORIES)register(window.__AMC8_VALIDATION_FACTORIES);
 return {catalog,register,create};
})(typeof module!=='undefined'?require('./competition'):{competitionHash,competitionNumericOptions,competitionRng},typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=ValidationRuntime;

'use strict';
// RC67: explicit adapters read mathematical data, never reverse-parse a story.
// Presentation is independent of the immutable mathematical recipe version.
const CompetitionDesign=((h,rules,problemState)=>{
 const {competitionRng:rng,competitionFraction:F,competitionNumericOptions:options}=h;
 const copy=x=>JSON.parse(JSON.stringify(x)),sum=a=>a.reduce((s,x)=>s+x,0);
 const method=(name,...steps)=>({name,steps});
 const configs={};
 function define(ids,model,goal,change,constraints){for(const id of ids.split(' '))configs[id]={model,goal,change,constraints}}
 define('reverseDigits digitInsert numberAppend divisibleDigits divisibleEleven natural-digitCount natural-distinctDigitCount digitComplement differentDigits digitDivisor','place-and-choice','数位或有序位置中的合法选择','改变位置、重复规则或目标，重新检查合法选择','各位置按题目顺序；首位和零的限制不能省略');
 define('fractionBackwards fractionDifferentWholes fractionSharedRemainder rule-fraction-reverse rule-fraction-original','changing-wholes','对应整体下的使用量或原量','改变分数所对应的整体','离散物品的每一步数量必须为整数；水量允许分数');
 define('percentRoundTrip percentRestore discountOrder natural-offers','changing-base','当前基准下的价格或临界数量','改变基准、顺序或比较目标','百分比作用于明确的价格；配送费只加一次');
 define('ratioEqualize ratioTotal linkedRatios transferBetweenBoxes ratioUnion','ratio-and-conservation','份数对应的实际数量','区分外部增加、内部转移与交集变化','份数不等于实际个数；转移不改变两边总量');
 define('packPrice mixedPacks rule-packs-exact rule-packs-enough','finite-purchase','合法购买方案中的最低费用','恰好与至少的数量边界','包装不可拆；单件和整包均非负整数；覆盖全部有限候选');
 define('equalDistanceSpeed natural-catch riverTravel jointWork stagedClimb','rate-and-boundary','时间、距离或加权速度','改变时间权重、移动规则或停止边界','速度单位一致；到达后是否继续运动须明确');
 define('oppositeScale mapScale scaleAreaReverse similarAreaPerimeter shadowSimilarity parallelTriangle','length-and-area-scale','长度倍率与面积倍率','改变倍率、光照或所求区域','相似的对应长度用同一倍率；面积倍率平方');
 define('balanceCancel tickets twoCoins stampConstraint machineMeeting','balance-and-constraints','同时满足总量与差额的未知数','改变一个约束并重新检查解集','金额和人数限制共同生效；票、硬币和邮票为完整个体');
 define('recurrenceBackwards recurrenceForward recurrenceTotal recurrenceRemainders','recurrence','初始条件及相邻项确定的数列','改变初始条件或累计区间','项号从1开始；初始项不套用第三项规则');
 define('linearTable repeatedMachine machineOrder','affine-operations','按指定顺序的机器输出','改变运算顺序或共同输入','先乘后加与先加后乘分别绑定；相同输入不会自动消去全部加数');
 define('factorBalance threeDivisors divisorPowers equalBags natural-tiles','factor-constraints','合法因数或共同规格','改变极值目标、袋数要求或缩放','正整数因数必须覆盖；规格能完整划分对象');
 define('bells offsetBells lastDigit cyclicPosition repeatedOnes','cycle-and-endpoints','循环位置或共同事件','改变方向、起止端点或追加一位','明确起点计不计；余数0对应完整周期而非首位置');
 define('fixedPerimeter boundaryNotch squareBorder rectangleDiagonalArea lShapeArea crossArea overlapSquares','boundary-and-area','边界、面积和新增部分','改变缺口位置、覆盖次数或合法边长','正尺寸；同一边界不重计；面积和周长分别求解');
 define('outsideAngle natural-angleRatio angleMarks polygonTurn semicircleBoundary circleRoute circleRingRatio','angle-and-circle','角量、弧长与完整边界','改变图形总量、行走方向或直边是否外露','按指定圆周率；弧和直径属于不同边界部分');
 define('ladderShift natural-coordinateDistance coordinateHorizontal hypotenuseMidpoint','distance-geometry','直线距离和对应直角边','改变已知边、路径限制或中点位置','坐标差与坐标值分开；网格行走不是直线距离');
 define('paintedCube cubeProbability cubeSteps openBox','spatial-boundary','空间位置分类或合法体积','改变涂色面、层数、样本空间或可用材料','角、棱、面不重复；盒底与高为正；遮挡不改变数量');
 define('exactlyOneSet setOutside threeSetExactlyTwo natural-unionChance natural-complementChance','sets-and-multiplicity','交集与补集中的不同对象','改变交集或样本范围','所有人数为整数；交集属于各组，不能重复计总人数');
 define('gridDetour routeProbability stepwiseRoute','route-and-sampling','受限制路径及其机会','改变路径限制或随机选择规则','完整路线等可能与每个岔口等可能是不同实验');
 define('adjacentLine restrictedTeam unorderedPairs circularSeating parityPermutations menuBranches binaryNoNeighbors allThreeColors rotatingColors','arrangement-and-equivalence','合法排列、分类或等价类','改变相邻限制、样本角色、旋转等价或可用类别','有序/无序和旋转等价明确；分类互斥且完整');
 define('chartScale chartAverage truncatedBars cumulativeChart','chart-and-scale','图表刻度及非重计总量','改变柱高、档位或累计区间','起点、每格、累计/单档须区分；不把图高当总量');
 define('missingAverage natural-weighted natural-fractionWeighted rule-weighted-mean rule-weighted-score overlapAverages medianSort','total-and-position','权重、总和或排序位置','改变人数、重叠位置、删放次数或极端值','人数权重不等时不能直接平均两组；重叠只能扣一次');
 define('diceSum natural-pairChance conditionalBalls spinnerLabels remainderProbability overlapProbability','sample-space','等可能具体结果中的有利部分','改变放回规则、条件样本空间或卡片范围','概率分母对应真正等可能对象；条件变化要同时复核分子');
 define('foldHoles quarterTurn transformOrder','transformation','同一对象在变换后的对应位置','改变折痕位置、转向或操作顺序','折痕上的点与内部点复制次数不同；镜像与旋转不可任意交换');
 define('checkerDomino lightSwitchParity ballReplacement worstCaseColors','invariant-and-guarantee','不变量给出的限制或最坏失败方案','改变颜色约束、开关次数或保证目标','上界须有达到它的构造；保证问题先构造最大失败情况');
 define('pairedSum telescopingDifferences neighborProducts consecutiveRepresentations squareBounds signedProduct','structure-and-domain','配对、消去、平方界或符号筛选','改变累计范围、允许的首项、因子个数或上下界','检查完整合法候选；负号、首项与非平方边界保留');
 define('rule-join-open rule-join-closed rule-join-piece','joined-length','连接后总长度或单段长度','长条改闭环，首尾是否新增连接处','每个连接处只扣一次重叠；材料必须适合弯曲或直排');
 define('rule-posts-both rule-posts-neither','interval-endpoints','间隔与标记的对应','两个端点计入与否','距离能被间隔整除；内部点与端点明确');
 define('rule-ratio-length rule-ratio-perimeter','ratio-perimeter','长宽份数与半周长','改变已知量、目标或整体尺度','周长是两条长和两条宽；长宽均正');
 define('unitConversion','unit-conversion','把容量转换为同一单位再求杯数','改变单杯容量','升和毫升不能直接相除；完整杯数为整数');
 define('ageDifference','constant-age-gap','同一年龄差下的倍数关系','改变时间和年龄倍数','同时长一岁不会改变年龄差；过去和现在的年龄不能混用');
 define('rectanglePointAreas','shared-height-balance','同一长方形中相对三角形的面积和','只平移内部点并改变所求面积','点在内部；相对三角形共享等长底边，两条高的和固定');
 define('threeGroupBalance','three-group-reference','用共同参照确定三组人数','改变差额方向、倍数参照或目标','三组正整数，三个条件同时满足');
 const variations={};
 const variation=(ids,category,recheck)=>{for(const id of ids.split(' '))variations[id]={category,recheck}};
 variation('reverseDigits','dependency','位值差换成数字差；由互换后两数之和还原数字和，再确定较小数');
 variation('digitInsert factorBalance','goal','在同一完整合法候选集合中把最大和最小目标互换');
 variation('numberAppend','dependency','追加的数字从个位移到百位，原数的位值不再整体乘10');
 variation('fractionBackwards fractionSharedRemainder rule-fraction-original','whole','第二次分数的整体在原量与余量之间改变，重建两次用量关系');
 variation('rule-fraction-reverse','whole','第二次分数改以第一次用量为整体；第一次用量与余量不相等');
 variation('fractionDifferentWholes','goal','所求从两盒取出量改为余量；各盒分数仍分别对应各自整体');
 variation('percentRoundTrip percentRestore','whole','恢复原价需要除以变化后的价格，不能沿用原百分数');
 variation('discountOrder linearTable repeatedMachine transformOrder','dependency','互换两步操作，追踪先操作的增量是否被后一步乘或反射');
 variation('squareBorder','boundary','完整外圈改为左上两边，新增外角与两条边分别只计一次');
 variation('ratioEqualize','goal','只加红球改为只减蓝球；相等后的数量对应原来的红球量');
 variation('ratioTotal transferBetweenBoxes','dependency','外部只向一边加入，数量差只缩小加入量；内部转移会同时改变两边');
 variation('linkedRatios','goal','只变蓝色到与绿色相等；原两个比例不再同时保持');
 variation('packPrice mixedPacks rule-packs-exact','constraint','数量恰好改为至少，额外整包成为合法候选；重新比较边界方案');
 variation('rule-packs-enough','constraint','禁止单买并要求恰好；先检查整包整除可行性，再考虑费用');
 variation('equalDistanceSpeed','whole','等路程改为等时间，平均速度使用的时间权重改变');
 variation('natural-catch','dependency','追上后快者停止，之后间距增长率由慢者速度决定');
 variation('jointWork riverTravel','dependency','取消一人工作或水流后，各段有效速率改变，总工作量或路程保留');
 variation('stagedClimb','boundary','白天到达后停止改为每夜都回退，比较完整昼夜位置而非白天峰值');
 variation('oppositeScale','constraint','取消面积固定，两个长度同倍率改变，面积使用倍率平方');
 variation('mapScale scaleAreaReverse','dependency','增加或取消一次缩放，每个长度倍率对应各自的阶段整体');
 variation('similarAreaPerimeter','dependency','由周长倍率求面积倍率，改走长度到面积的方向');
 variation('shadowSimilarity','invariant','光照改变使同一时刻两杆影长同倍率缩短，高度仍不变');
 variation('parallelTriangle','whole','改为半边长的小相似三角形，梯形占比需要先平方再取补集');
 variation('natural-tiles','invariant','地面加倍且允许重新选最大砖，地面与砖的面积同乘4，块数保持');
 variation('unitConversion','invariant','总容量不变，每杯容量加倍，完整杯数按反比改变');
 variation('balanceCancel','dependency','只从天平右边移去一个盒子，需在同侧补回其重量');
 variation('tickets stampConstraint','constraint','解除总人数或两种都须出现的约束；重新列完整非负整数解');
 variation('twoCoins','goal','每种各取一枚后求总金额，减少的金额与减少的枚数不同');
 variation('ageDifference','invariant','改问未来2倍年龄时刻，年龄差保持，倍数对应的时间改变');
 variation('recurrenceBackwards','dependency','只增加第一项，增量从1、0开始同规则递推，第二项保持');
 variation('recurrenceForward','dependency','交换不相等的初始项，按同一规则重新推进到指定项号');
 variation('recurrenceTotal','boundary','累计区间去掉第一项，起点和消去后的剩余边界改变');
 variation('recurrenceRemainders','dependency','初始项加倍但取余不是线性求和，1与2的余数类别交换');
 variation('machineMeeting','dependency','只给甲输出加1，共同输出的交点改变，差速保持');
 variation('machineOrder','invariant','共同输入加倍，两个合成式的输入项仍抵消，检查差由常数项决定');
 variation('divisibleDigits','constraint','末位被5整除改为偶数，再与数字和被9整除联合筛选');
 variation('digitDivisor','constraint','允许个位为0不能使除以0有定义，区分规则非法与计数增加');
 variation('divisibleEleven threeDivisors','goal','保留完整合法列表，从取最大或计数改为计数或取最大');
 variation('divisorPowers','constraint','只保留平方因数，各质因数指数必须为偶数');
 variation('equalBags','constraint','不再要求袋数最多，袋数必须是共同规格的因数，不能任取');
 variation('bells rule-posts-both rule-posts-neither','boundary','重新核对起点和终点是否计入，间隔数不等于点数');
 variation('offsetBells','boundary','从实际第一次共同响继续一个共同周期，不以第0分钟替代实际起点');
 variation('lastDigit','goal','从一个幂的末位改为两个相邻幂之和的末位，需分别定位并再取个位');
 variation('cyclicPosition quarterTurn','dependency','从同一个起点逆向走或转，余步相同但位置对应方向相反');
 variation('repeatedOnes','dependency','末尾添1把当前余数映射为10倍加1再取余，不能直接把余数加1');
 variation('fixedPerimeter','constraint','最大面积改为边长至少3时的最小面积，合法边界和极值方向同时改变');
 variation('rectangleDiagonalArea','invariant','只有长乘3/2，三角形仍占长方形一半，面积只随这一个长度变化');
 variation('boundaryNotch','boundary','中间凹口改为内部洞，外边没有被替换，内外两圈边界都要计入');
 variation('outsideAngle','goal','已知同一外角改求另一个底角，使用互补与等腰对应关系');
 variation('angleMarks','goal','较短方向角改为另一个方向围角，两个目标合计一整圈');
 variation('polygonTurn','boundary','只累计实际经过的顶点，奇数顶点的取整规则不能省略');
 variation('overlapSquares','goal','至少一张覆盖改为恰好一张，交集从扣一次改为扣两次');
 variation('lShapeArea','invariant','缺口移到内部，轮廓改变但挖去面积不变；重新核对所求仍为面积');
 variation('crossArea','goal','并集面积改为交叉面积，重计修正与目标区域不同');
 variation('circleRoute','constraint','较短补弧改为往返且覆盖全圆，目标受覆盖下界限制');
 variation('semicircleBoundary','boundary','两块沿直径合回整圆，原直径变成内部接触边不计外周');
 variation('circleRingRatio','invariant','半径都加倍，分子分母面积同乘4，占比保持');
 variation('ladderShift','dependency','固定梯长，把高度作为已知边求底距，已知未知位置交换');
 variation('coordinateHorizontal','invariant','两点同时平移，坐标差保持，不能把平移量加到距离');
 variation('natural-coordinateDistance','constraint','直线移动改为只走水平竖直网格，最短距离的合法路径集合改变');
 variation('hypotenuseMidpoint','dependency','中点移到较长直角边，不能沿用斜边中点到三顶点等距的关系');
 variation('paintedCube','constraint','只涂互不相邻的顶底面，恰好一面涂色分类改为两个完整表层');
 variation('cubeSteps','invariant','每列前后厚度都加倍，所有层数量加倍，列高关系保留');
 variation('openBox','goal','固定剪角为1并改求底面积，不再枚举体积最大值');
 variation('exactlyOneSet setOutside','dependency','同一个人增加另一个组，组计数可增两次，不同人数只增一次');
 variation('ratioUnion','dependency','同一位只在棋组的人加入球组，球组和交集同时加1，不同总人数保持，原比例失效');
 variation('threeSetExactlyTwo','goal','恰好两组改为至少两组，三组交集应只加回一次');
 variation('gridDetour routeProbability','constraint','避开P改为固定第一步向上，不再扣通过P的路线');
 variation('menuBranches','dependency','饮料选择作用于整份午餐，包括米饭和面两种互斥分支');
 variation('binaryNoNeighbors','constraint','第一盏必须亮会迫使第二盏灭，不能把全部安排简单减半');
 variation('adjacentLine','constraint','必须相邻改为不能相邻，用完整排列集合减相邻集合');
 variation('restrictedTeam','constraint','禁止两人同时入选改为必须同选，无职位的剩余位置只选第三人');
 variation('unorderedPairs differentDigits','constraint','是否分职位或交换顺序算不同改变，成对重复计数因子改变');
 variation('circularSeating','constraint','去掉相邻限制，但仍需固定旋转参照，镜像规则保持');
 variation('parityPermutations','constraint','奇偶交换限制角色，重查主体人数和空位是否足够，不能只改名称');
 variation('digitComplement','constraint','至少出现一次改为恰好一次，其他位置禁止再出现该数字');
 variation('allThreeColors','constraint','三色全出现改为恰好两色，先选颜色组再排除两种纯色');
 variation('natural-digitCount natural-distinctDigitCount','constraint','允许或禁止同一个数字重复使用，再与整除条件联合筛选');
 variation('chartScale','dependency','所有柱各加一格但刻度保持，总人数增加量由柱数乘每格人数');
 variation('truncatedBars','goal','实际总人数改为人数差，共同纵轴起点只在相减时抵消');
 variation('cumulativeChart','goal','改变实际分数档，累计上界之差对应新的目标区间');
 variation('chartAverage','dependency','新增一名6分者，总分与人数同时改变，重新核对平均权重');
 variation('missingAverage','dependency','被删数放回两次，总和和人数都增加，不能只改平均数');
 variation('medianSort','invariant','只增加最大值，排序中间位置保持；中位数与平均数响应不同');
 variation('overlapAverages','dependency','前后段从4+4改为5+5，唯一重叠位置从第4个移到第5个，总和乘数改变');
 variation('natural-weighted natural-fractionWeighted','whole','交换两队人数权重，个人积分不变，重新确定两组总分占比');
 variation('rule-weighted-mean rule-weighted-score rule-ratio-length rule-ratio-perimeter','dependency','沿用明确比例但交换已知和未知，重新确定总量、份量和所求的依赖方向');
 variation('diceSum natural-unionChance natural-complementChance cubeProbability spinnerLabels conditionalBalls overlapProbability','sampling','新条件或区域改变等可能样本空间，分子分母都需重新检查');
 variation('natural-pairChance','sampling','不放回改为放回，第二次红球数和总数保持，具体结果的概率关系改变');
 variation('stepwiseRoute','sampling','每岔口等概率改为完整路线等概率，同一P的路径权重改变');
 variation('foldHoles','dependency','一个孔从单折痕移到内部，对称复制次数由2改为4');
 variation('checkerDomino','constraint','去除两同色角改为一黑一白，颜色上界改变，还需给达到上界的铺法');
 variation('lightSwitchParity ballReplacement','invariant','只增加一次翻转或一个白球，使决定最终状态的奇偶改变');
 variation('pairedSum telescopingDifferences','boundary','求和只留偶数或去掉首项，配对和消去后的端点改变');
 variation('neighborProducts','invariant','对称偏移从1改为2，中间一次项仍抵消，差等于偏移的平方');
 variation('squareBounds','goal','不超过平方根改为不小于，非平方数的两侧整数不同');
 variation('signedProduct','constraint','改为选两张而非三张，负乘积需要的符号组合及枚举集合改变');
 variation('rule-join-open rule-join-closed rule-join-piece','boundary','长条与闭环互换，首尾闭合会增一个连接处；单段未知先还原各段总和');
 variation('rectanglePointAreas','invariant','P水平移动，左右三角形面积和保持，上下两块不变，重新定位改变的区域');
 variation('worstCaseColors','constraint','提高保证的同色数量，各色最大失败取数受库存上界共同限制');
 variation('consecutiveRepresentations','constraint','首项允许0，新增写法只能从0开始，是否新增必须独立检查三角数条件');
 variation('remainderProbability','sampling','加入写0卡，分母必增1，分子仅目标余数为0时增加');
 variation('rotatingColors','constraint','加入固定星标后旋转不再合并，每个递增红位置集合单独计数');
 variation('natural-offers','goal','两店单次费用差改为最低整数购买量，固定配送费与每本价差确定临界点');
 variation('natural-angleRatio','whole','三角形改为四边形，总角量从180改360，比例份数及所求角同步改变');
 const hintPolicy={
  'place-and-choice':'把不同位置分别列出，再用题目的零、重复、整除或数位条件筛选。哪些选择先被排除？',
  'changing-wholes':'给每次分数圈出它的整体。后一次的整体是原量、余量，还是前一次的用量？',
  'changing-base':'把每个百分比连到它实际作用的价格。固定金额和百分比作用于同一个量吗？',
  'ratio-and-conservation':'画同一大小的份数。改变一边时，另一边是否也同时改变？',
  'finite-purchase':'先判定数量是否满足限制，再比较完整方案的费用。允许多买时，边界外哪一个整包方案需要补查？',
  'rate-and-boundary':'把每段经过的时间、距离和停止规则分开。最后一步还会发生下一次变化吗？',
  'length-and-area-scale':'先找对应长度的倍率，再判断所求量含一个长度还是两个长度。',
  'balance-and-constraints':'先固定一种数量，看另一种数量能否同时满足总量与差额；不能只核对一个条件。',
  'recurrence':'标清项号，从已知的相邻两项向需要的方向推进。改变初始项后，增量是否也遵守同一规则？',
  'affine-operations':'把输入沿箭头依次送进每一步。先加的量会不会在后一步被乘？',
  'factor-constraints':'把合法因数配成完整的一对，检查所有边界，再比较题目要的是最大还是最小。',
  'cycle-and-endpoints':'先找一次完整循环，再从原起点数余下部分；检查起点与终点的计数规则。',
  'boundary-and-area':'沿轮廓或新增部分观察。哪些只是替换，哪些确实多出？面积与边界长度分别计算。',
  'angle-and-circle':'先确定完整图形的角总量或一周边界，再检查直边、补弧与转角的角色。',
  'distance-geometry':'只使用已知的边或坐标差。所求是直线、网格路线，还是中点到顶点？',
  'spatial-boundary':'按空间位置分组：角、棱、面、内部是否重复？先确认每块属于哪一类。',
  'sets-and-multiplicity':'追踪一个同时参加多组的人，在各项中被数了几次；目标希望最终保留几次？',
  'route-and-sampling':'在格点上标合法出口。题目随机的是每个岔口，还是已经完整列出的路线？',
  'arrangement-and-equivalence':'找一个不会重复的分类或参照位置。交换顺序、旋转和镜像分别算不算不同？',
  'chart-and-scale':'先看坐标起点、每格和累计含义；新增一格或减少一档分别对应什么数量？',
  'total-and-position':'平均数要和人数一起看；中位数要和排序位置一起看。哪一个整体或位置固定？',
  'sample-space':'先列真正等可能的具体对象，再圈出符合条件的部分；新条件排除了哪些结果？',
  'transformation':'逐步追踪同一点或方向，不跳过中间操作；位于折痕和内部的点是否相同？',
  'invariant-and-guarantee':'检查一次操作能改变什么、保留什么；保证问题先构造仍会失败的最多数量。',
  'structure-and-domain':'先按合法符号、位置或边界分类，再看能否配对、消去或用相邻平方夹住。',
  'joined-length':'数连接处而不是只数材料段；首尾闭合后是否还多一个连接处？',
  'interval-endpoints':'先区分线段间隔与圆点标记；两端加入或去掉时改变的是哪个数量？',
  'ratio-perimeter':'沿长方形走一周，有几条长和几条宽？一条长加一条宽对应哪部分周长？',
  'unit-conversion':'把总量和每份容量都写成相同单位，再比较有多少个完整份。',
  'constant-age-gap':'把过去、现在和未来分开；两人一起长大时，哪个差保持不变？',
  'shared-height-balance':'把相对的两块三角形放在一起，观察相同底边和两条高的总长度。'
 };

 variation('threeGroupBalance','dependency','差额方向或倍数参照改变，重新连接总量');
 hintPolicy['three-group-reference']='把每条关系连接到总人数；多出的部分属于哪一组？';
 function load(c,f){
  const id=f.id,m=c.math,p=m.params||m;
  const enumerations={fixedPerimeter:Math.floor(m.half/2),factorBalance:Math.floor(Math.sqrt(m.product)),signedProduct:20,divisibleDigits:20,divisibleEleven:20,openBox:Math.floor((m.side-1)/2),stampConstraint:Math.floor(m.total/3),consecutiveRepresentations:Math.floor(Math.sqrt(2*m.total)),rotatingColors:2**m.n};
  const enumeration=enumerations[id]||(/packs|packPrice|mixedPacks/.test(id)?Math.ceil((p.count||0)/(p.size||4))+1:0);
  const shortcut=['pairedSum','telescopingDifferences','neighborProducts','machineOrder','recurrenceTotal','lightSwitchParity','ballReplacement','boundaryNotch'].includes(id);
  const fractional=['natural-weighted','natural-fractionWeighted'].includes(id)?c.answer.includes('/')||m.den!==1:/fraction|percentRestore|Probability|Chance|diceSum|spinnerLabels|mean/.test(id);
  const answerMagnitude=String(c.answer).split('/').map(Number).filter(Number.isFinite);
  const digits=Math.max(...Object.values(p).filter(x=>typeof x==='number').concat(answerMagnitude).map(x=>String(Math.abs(Math.trunc(x))).length),1);
  const operations=shortcut?2:Math.min(8,c.methods[0].steps.length+Number(fractional));
  const score=operations+Number(fractional)*2+Number(digits>2&&!shortcut)*2+Number(digits>3&&!shortcut)*2+Number(enumeration>12)*3;
  return {reasoningLoad:{level:f.level,reason:f.insight},calculationLoad:{level:score<=4?1:score<=7?2:3,operations,fractional,enumeration,digits,reason:shortcut?'可利用已定义的消去、配对或不变量简算':`有效路线约 ${operations} 步${fractional?'，含分数或比值':''}${enumeration?`；需检查至多 ${enumeration} 个候选`:''}`},readingLoad:{level:c.prompt.length<100?1:c.prompt.length<165?2:3,characters:c.prompt.length,reason:'按一个情境、目标和必要限制的实际文本长度估计'}};
 }

 function revise(c,f,seed){
  const r=rng(seed),id=f.id;
  if(id==='packPrice'){
   const single=3+r(6),branch=r(3),count=6+3*r(3)+(branch===2?1:2),pack=branch===0?single+1+r(single-1):branch===1?2*single:2*single+1+r(single-1);
   const full=Math.floor(count/3),loose=count%3,exact=full*pack+loose*single,extra=(full+1)*pack,answer=String(exact);
   c={...c,math:{single,pack,count},answer,options:options(answer,r),prompt:`一种笔单支 ${single} 元，3 支装每包 ${pack} 元。可以混合买，但必须恰好买 ${count} 支。最少花多少元？`};
   c.methods=[method('逐个比较合法包数',`整包不能拆，包数从0到 ${full}；余下的笔单买。`,`每包比3支单买少 ${3*single-pack} 元，所以合法范围内包数越多越省。`,`买 ${full} 包、单买 ${loose} 支，费用 ${full}×${pack}+${loose}×${single}=${exact} 元。`)];
   c.extension={prompt:'数量条件改为至少买够，允许多买；最少需要多少元？',answer:String(Math.min(exact,extra)),solution:`必须补查 ${full+1} 包的方案：共 ${(full+1)*3} 支，费用 ${extra} 元。原来的恰好方案为 ${exact} 元。${extra<exact?'多买反而更省':extra===exact?'两种方案费用相同':'恰好方案更省'}，最低 ${Math.min(exact,extra)} 元。`,kind:'condition-change',math:{single,pack,count,atLeast:true}};
  }
  if(id==='mixedPacks'){
   const p=9+r(6),branch=r(3),q=branch===0?p-1-r(3):branch===1?p:p+3+r(3),count=8+6*r(3),plans=[];
   for(let a=0;a<=Math.ceil(count/4);a++)for(let b=0;b<=Math.ceil(count/6);b++)if(4*a+6*b>=count)plans.push({a,b,bought:4*a+6*b,cost:a*p+b*q});
   const exact=plans.filter(x=>x.bought===count).sort((a,b)=>a.cost-b.cost)[0],enough=plans.sort((a,b)=>a.cost-b.cost||a.bought-b.bought)[0],answer=String(exact.cost);
   c={...c,math:{p,q,count},answer,options:options(answer,r),prompt:`笔只有4支装和6支装，分别 ${p} 元、${q} 元。必须恰好买 ${count} 支，不能拆包。最少花多少元？`};
   c.methods=[method('固定一种包数，完整检查另一种',`4支装从0包到 ${Math.floor(count/4)} 包；余下数量必须能被6整除。`,`逐个核对 4×包数+6×包数=${count}，再比较所有合法方案费用。`,`最低方案：4支装 ${exact.a} 包、6支装 ${exact.b} 包，${exact.a}×${p}+${exact.b}×${q}=${exact.cost} 元。`)];
   c.extension={prompt:'如果允许买超过需要的数量，最少花多少元？',answer:String(enough.cost),solution:`分别检查4支装至 ${Math.ceil(count/4)} 包、6支装至 ${Math.ceil(count/6)} 包，数量至少 ${count}。最低买4支装 ${enough.a} 包、6支装 ${enough.b} 包，共 ${enough.bought} 支，${enough.cost} 元。边界外的方案也必须比较，不能只看原来的恰好方案。`,kind:'condition-change',math:{p,q,count,atLeast:true}};
  }
  if(id==='natural-weighted'||id==='natural-fractionWeighted'){
   const red=1+r(3),blue=red+1+r(2),low=2+r(4),high=low+(id==='natural-weighted'?(red+blue)*(1+r(2)):2+r(4)),total=red+blue;
   c={...c,math:{red,blue,redScore:low,blueScore:high,den:1,total},answer:F(red*low+blue*high,total)};
   c.prompt=`红队与蓝队人数比为 ${red}:${blue}。红队每人得 ${low} 分，蓝队每人得 ${high} 分。所有队员的平均分是多少？`;
   c.options=options(c.answer,r);
   c.methods=[method('按人数份数合计',`取红 ${red} 人、蓝 ${blue} 人的一组作代表，共 ${total} 人。`,`两队分别得 ${red}×${low}=${red*low} 与 ${blue}×${high}=${blue*high} 分，总分 ${red*low+blue*high}。`,`每人平均 ${red*low+blue*high}÷${total}=${c.answer} 分。`),method('以低分作基准补上差额',`如果每人都得 ${low} 分，平均也是 ${low} 分。`,`蓝队每人多 ${high-low} 分，${blue} 份共多 ${blue*(high-low)} 分。`,`把差额平均到 ${total} 份，${low}+${F(blue*(high-low),total)}=${c.answer} 分。`)];
   const next=F(blue*low+red*high,total);
   c.extension={prompt:`把两队的人数比改为 ${blue}:${red}，每人得分保持不变。新的平均分是多少？`,answer:next,solution:`改变的是人数权重。红 ${blue} 份得 ${blue*low} 分，蓝 ${red} 份得 ${red*high} 分，共 ${total} 份。新平均 (${blue*low}+${red*high})÷${total}=${next} 分。`,kind:'condition-change',key:'swap-weights',math:{red:blue,blue:red,redScore:low,blueScore:high,den:1,total}};
   c.ruleHints=['两队人数不同，直接把两个分数平均合适吗？','用每个队的代表人数，把每人得分转成整队得分。'];
  }
  if(id==='overlapAverages'){
   const u=7+r(4),v=u+3+r(3),w=Math.floor((4*u+4*v-4)/7),x=4*u+4*v-7*w;
   const split=n=>{const q=Math.floor(n/3);return [q,q,n-2*q]};
   const values=[...split(4*u-x),x,...split(4*v-x)];
   c={...c,math:{values},answer:String(x),prompt:`7个数，前4个平均 ${u}，后4个平均 ${v}，全部平均 ${w}。第4个数是多少？`,options:options(String(x),r)};
   c.methods=[method('先还原总和再去重',`前4个合计 ${4*u}，后4个合计 ${4*v}，全部合计 ${7*w}。`,`两段相加时只有第4个出现两次；${4*u}+${4*v}−${7*w}=${x}。`),method('先找不重叠部分',`全部总和减后4个总和，前3个合计 ${7*w-4*v}。`,`前4个再减前3个，只剩第4个：${4*u}−${7*w-4*v}=${x}。`)];
   const z=[...values,values[0],values[6]],a=sum(z.slice(0,5)),b=sum(z.slice(4)),all=sum(z);
   c.extension={prompt:`另有9个数，前5个平均 ${F(a,5)}，后5个平均 ${F(b,5)}，全部平均 ${F(all,9)}。第5个数是多少？`,answer:String(z[4]),solution:`重叠位置改为第5个。先还原三种总和 ${a}、${b}、${all}，第5个=${a}+${b}−${all}=${z[4]}。`,kind:'condition-change',math:{values:z,groupSize:5}};
  }
  if(id==='fixedPerimeter'){
   const half=c.math.half,min=3,answer=min*(half-min);
   c.extension={prompt:`周长仍为 ${2*half}。两边都是至少 ${min} 的整数，改为求最小面积，是多少？`,answer:String(answer),solution:`长宽和 ${half}。合法短边从 ${min} 到 ${Math.floor(half/2)}；面积在两边靠近时增大，所以最小在最远的一对 ${min}、${half-min}，面积 ${answer}。`,math:{half,minSide:min,target:'minimum-area'},key:'minimum-with-lower-bound',kind:'condition-change'};
  }
  if(id==='boundaryNotch'){
   const {w,h,a,depth}=c.math,outer=2*(w+h),inner=2*(a+depth);
   c.extension={prompt:`把同样宽 ${a}、深 ${depth} 的长方形改为完全挖在纸片内部，不碰外边。外边界和洞口边界都计入，它们的总长度是多少？`,answer:String(outer+inner),solution:`外边界仍为 ${outer}，洞口新形成一整圈 ${a}+${depth}+${a}+${depth}=${inner}。没有原边被替换，所以合计 ${outer+inner}；不能沿用中间凹口只增加两条深度边的规则。`,math:{w,h,a,b:depth,placement:'internal',countInner:true},key:'internal-hole-count-both-boundaries',kind:'condition-change'};
  }
  if(id==='rule-packs-enough'){
   const p=c.math.params,possible=p.count%p.size===0,answer=possible?p.count/p.size*p.pack:0;
   const unit=c.math.context==='seedlings'?'棵树苗':'支画笔';
   c.extension={prompt:`需求仍为 ${p.count} ${unit}，现在只能买 ${p.size} ${unit}装的整包，每包 ${p.pack} 元，不能单买，而且必须恰好。若做不到填写0；能做到填写最少费用。`,answer:String(answer),solution:possible?`${p.count} 能被 ${p.size} 整除，买 ${p.count/p.size} 包恰好，费用 ${answer}。`:`整包只能组成 ${p.size} 的整数倍，${p.count} 不是这样的倍数；费用再便宜也没有合法方案，填写0。`,math:{variant:'packs-only-exact',context:c.math.context,params:copy(p)},key:'whole-pack-feasibility',kind:'condition-change'};
  }
  if(id==='rule-fraction-reverse'){
   // If the first use were one half, its amount would equal the remainder.
   // Build integral supplies backwards with unequal wholes in revision 3.
   const prior=c.math.params,k=prior.left/((prior.d1-1)*(prior.d2-1)),d1=3+r(2);
   c=rules.create('fraction-reverse',{d1,d2:prior.d2,left:(d1-1)*(prior.d2-1)*k},c.math.context,r);
   const p=c.math.params,start=p.left*p.d1*p.d2/((p.d1-1)*(p.d2-1)),first=start/p.d1,second=first/p.d2,left=start-first-second,unit=c.math.context==='supplies'?'张':'升';
   c.extension={prompt:`沿用原来的 ${start} ${unit}。第一次仍用掉原量的 1/${p.d1}，第二次改为用掉“第一次用掉的量”的 1/${p.d2}。最后剩多少${unit}？`,answer:String(left),solution:`第二次的整体是第一次用量 ${first}，不是余量。第二次用 ${first}÷${p.d2}=${second}；原量减两次用量，${start}−${first}−${second}=${left} ${unit}。`,math:{variant:'fraction-of-used',context:c.math.context,params:{d1:p.d1,d2:p.d2,start}},key:'second-fraction-of-first-use',kind:'condition-change'};
  }
  if(id==='quarterTurn'||id==='transformOrder'){
   const start=r(4),count=id==='quarterTurn'?1+2*r(4):1+2*r(2),names=['上','右','下','左'],mirror=v=>(4-v)%4;
   const answer=id==='quarterTurn'?(start+count)%4:mirror((start+count)%4),changed=id==='quarterTurn'?((start-count)%4+4)%4:(mirror(start)+count)%4;
   c={...c,math:id==='quarterTurn'?{start,turns:count}:{start,rot:count},answer:String(answer),options:options(String(answer),r)};
   c.prompt=id==='quarterTurn'?`箭头最初向${names[start]}，每次顺时针旋转90°，连续旋转 ${count} 次。最后向哪个方向？上填0，右填1，下填2，左填3。`:`箭头方向用上0、右1、下2、左3表示，最初是 ${start}。先顺时针转 ${count} 个90°，再沿竖直轴作镜像（左右交换，上下不变），最后方向填几？`;
   c.methods=[method('按指定次序追踪',`从 ${names[start]} 开始，顺时针转 ${count} 个90°，先到 ${names[(start+count)%4]}。`,id==='quarterTurn'?`到 ${names[answer]}，填 ${answer}。`:`接着作左右镜像，到 ${names[answer]}，填 ${answer}。`)];
   c.extension={prompt:id==='quarterTurn'?'改为逆时针旋转同样次数，填哪个数字？':'先镜像、再做相同旋转，最终方向填几？',answer:String(changed),solution:id==='quarterTurn'?`从相同起点逆向转 ${count} 次，最后 ${names[changed]}，填 ${changed}。方向相反时不能沿用原来的结果。`:`先镜像到 ${names[mirror(start)]}，再顺时针转 ${count} 次，到 ${names[changed]}，填 ${changed}。每一步都合法，次序改变了结果。`,math:id==='quarterTurn'?{start,turns:count,direction:'anticlockwise'}:{start,rot:count,order:'mirror-first'},key:'reverse-direction-or-order',kind:'condition-change'};
  }
  return c;
 }

 function units(groups,caption='',extra={}){return {kind:'scene-units',groups,caption,...extra}}
 function slots(values,caption='',extra={}){return {kind:'scene-slots',values,caption,...extra}}
 function flow(nodes,caption='',extra={}){return {kind:'scene-flow',nodes,caption,...extra}}
 function strips(rows,caption='',extra={}){return {kind:'scene-strips',rows,caption,...extra}}
 function circle(values,caption='',extra={}){return {kind:'scene-circle',values,caption,...extra}}
 function timeline(events,caption='',extra={}){return {kind:'scene-timeline',events,caption,...extra}}
 const group=(name,count,unit='份',score=null)=>({name,count,unit,score});
 const row=(label,parts,value='?')=>({label,parts,value});
 const items=(n,text='?')=>Array.from({length:n},()=>text);
 function scene(c,f,variation=false){
  const id=f.id,m=c.math,p=m.params||m,v=variation,E=c.extension,state=problemState.create(c,f,v);
  if(c.rc68Diagram)return copy(v?E.rc68Diagram:c.rc68Diagram);
  if(id.startsWith('rule-')){
   const math=v?E.math:m,k=math.variant,a=math.params,context=math.context;
   if(k.startsWith('join-'))return {kind:'scene-join',n:Number(a.n),piece:k==='join-piece'?'?':Number(a.piece),lap:Number(a.lap),closed:k==='join-closed',total:k==='join-piece'?Number(a.total):'?',caption:k==='join-closed'?'首尾闭合；每个连接处只计一次重叠':context==='panels'?'展示板接成长条':'软材料拼接；阴影是重叠部分'};
   if(k.startsWith('posts-'))return {kind:'scene-intervals',distance:Number(a.distance),gap:Number(a.gap),ends:k==='posts-both',draft:true,caption:'先画一个间隔；其余标记由你建立'};
   if(k.startsWith('weighted-'))return units([group('甲',Number(a.a),'人数份',k==='weighted-score'?'?':a.low),group('乙',Number(a.b),'人数份',a.high)],'用比例中的一组作代表；不是实际总人数',{average:k==='weighted-score'?a.mean:'?',object:'person'});
   if(k.startsWith('ratio-'))return {kind:'scene-ratioRectangle',a:Number(a.a),b:Number(a.b),perimeter:k==='ratio-length'?a.perimeter:'?',width:k==='ratio-perimeter'?a.width:null,length:k==='ratio-length'?'?':null,caption:'长与宽同一份；两条长、两条宽组成一周'};
   if(k.startsWith('fraction-'))return {kind:'scene-fractions',d1:Number(a.d1),d2:Number(a.d2),original:k==='fraction-original',secondOfUsed:k==='fraction-of-used',left:k==='fraction-reverse'?a.left:'?',start:['fraction-original','fraction-of-used'].includes(k)?a.start:'?',unit:context==='supplies'?'张':'升',caption:'第二次分数的整体用括号标出'};
   if(k.startsWith('packs-'))return {kind:'scene-purchase',size:Number(a.size),single:k==='packs-only-exact'?undefined:a.single,pack:a.pack,count:Number(a.count),enough:k==='packs-enough',object:context==='seedlings'?'棵树苗':'支画笔',caption:k==='packs-only-exact'?'只能买整包，必须恰好':k==='packs-enough'?'允许多买，包装完整':'必须恰好，包装完整'};
   throw Error('No rule scene '+k);
  }
  switch(id){
   case 'natural-weighted':case 'natural-fractionWeighted':{const a=v&&E.key==='swap-weights'?E.math:{...m,red:v?2*m.red:m.red};return units([group('红队',a.red,'人数份',F(a.redScore,a.den)),group('蓝队',a.blue,'人数份',F(a.blueScore,a.den))],'按比例取一组代表；每人分数见积分标记',{object:'person',average:'?'})}
   case 'fractionBackwards':return {kind:'scene-fractions',d1:2,d2:3,original:v,left:v?'?':m.left,start:'?',unit:'枚',caption:v?'两次都按最初总数':'第二次按第一天剩下的贴纸'};
   case 'fractionSharedRemainder':return flow([{label:'最初',value:'?'},{label:'取原量1/3',value:'−'},{label:'放回',value:m.add+' 个'},{label:v?'取原量3/8':'取现有3/8',value:'−'},{label:'最后',value:v?'?':(5*m.unit+5*m.add/8)+' 个'}],'两个分数是否对应同一整体？');
   case 'fractionDifferentWholes':return strips([row('甲盒：'+m.a+' 颗',4,v?'剩余3份':'取出1份'),row('乙盒：'+m.b+' 颗',3,v?'剩余2份':'取出1份')],'每条代表各自的整体；两条不是同一份大小',{selected:v?'remaining':'removed',separateWholes:true});
   case 'packPrice':return {kind:'scene-purchase',size:3,single:m.single,pack:m.pack,count:m.count,enough:v,object:'支笔',caption:v?'至少买够，允许多买':'必须恰好买足'};
   case 'mixedPacks':return {kind:'scene-purchase',packs:[{size:4,price:m.p},{size:6,price:m.q}],count:m.count,enough:v,object:'支笔',caption:'不能拆包；分别比较4支装与6支装'};
   case 'ratioEqualize':return strips([row('红',m.a),row('蓝',m.b)],v?'只从蓝取走 '+(m.b-m.a)*m.unit+' 个':'只向红加入 '+(m.b-m.a)*m.unit+' 个',{equalAfter:true,changeSide:v?'blue':'red'});
   case 'ratioTotal':return strips([row('红',m.a),row('蓝',m.b)],'两色原来合计 '+(m.a+m.b)*m.u+' 块'+(v?'；只加 '+(m.b-m.a)+' 块红色':''));
   case 'linkedRatios':return strips([row('红:蓝',m.a+m.b,`${m.a}:${m.b}`),row('蓝:绿',m.c+m.d,`${m.c}:${m.d}`)],'绿 '+m.b*m.d*m.u+' 块'+(v?'；只改变蓝色':'；两行蓝色为同一数量'),{linked:true});
   case 'transferBetweenBoxes':return strips([row('甲',m.a),row('乙',m.b)],v?`外部只向甲加入 ${m.moved} 块`:`从乙移 ${m.moved} 块给甲后相等`,{transfer:v?'external':'between',moved:m.moved});
   case 'balanceCancel':return {kind:'scene-balance',left:{boxes:v?m.a+1:m.a+1,weight:m.b},right:{boxes:v?m.a-1:m.a,weight:m.x+m.b},caption:v?'右边少一个盒子，需要补砝码':'相同盒子，同一副水平天平'};
   case 'tickets':return units([group('成人票',1,'种',m.adult),group('儿童票',1,'种',m.child)],`总价 ${m.adults*m.adult+(m.people-m.adults)*m.child} 元${v?'；不限总人数':`；共 ${m.people} 人`}`,{object:'ticket'});
   case 'twoCoins':return units([group('1元币','?','枚',1),group('2元币','?','枚',2)],`${v?'取走每种各1枚前：':''}共 ${m.n} 枚，${m.n+m.twos} 元`,{object:'coin'});
   case 'stampConstraint':return units([group('3元邮票','?','张',3),group('5元邮票','?','张',5)],`恰好 ${m.total} 元；${v?'允许一种不用':'每种至少一张'}`,{object:'stamp'});
   case 'repeatedMachine':return flow([{label:'输入',value:v?m.x:'?'},{label:'第1次',value:v?`(+${m.b})×${m.a}`:`×${m.a}+${m.b}`},{label:'第2次',value:v?`(+${m.b})×${m.a}`:`×${m.a}+${m.b}`},{label:'输出',value:v?'?':(m.x*m.a+m.b)*m.a+m.b}],'机器每次使用同一个规则');
   case 'machineOrder':return {kind:'scene-twoFlows',rows:[{name:'先甲后乙',nodes:[v?2*m.x:m.x,`×${m.a}+${m.b}`,`×${m.c}+${m.d}`,'?']},{name:'先乙后甲',nodes:[v?2*m.x:m.x,`×${m.c}+${m.d}`,`×${m.a}+${m.b}`,'?']}],caption:'同一个输入，两种顺序'};
   case 'machineMeeting':return {kind:'scene-twoFlows',rows:[{name:'甲',nodes:['?',`×${m.a}+${m.d+(v?1:0)}`,'同一输出']},{name:'乙',nodes:['?',`×${m.c}+${m.b}`,'同一输出']}],caption:'比较每增加1输入，两边输出怎样变化'};
   case 'linearTable':return v?flow([{label:'输入',value:m.target},{label:'先加',value:m.b},{label:'后乘',value:m.k},{label:'输出',value:'?'}],'沿用从原表发现的两个固定数'):{kind:'table',rows:[['输入',m.x,m.x+2,m.target],['输出',m.k*m.x+m.b,m.k*(m.x+2)+m.b,'?']]};
   case 'percentRoundTrip':return flow([{label:'原价',value:m.start+' 元'},{label:'上涨',value:m.percent+'%'},{label:v?'恢复原价':'下降',value:v?'? %':m.percent+'%'},{label:v?'目标价格':'便宜多少',value:v?m.start+' 元':'? 元'}],'每个百分比的括号都指向它前面的价格');
   case 'discountOrder':return flow([{label:'原价',value:m.price},{label:v?'先用券':'先折扣',value:v?'−'+m.q:'×'+(100-m.p)+'%'},{label:v?'后折扣':'后用券',value:v?'×'+(100-m.p)+'%':'−'+m.q},{label:'价格',value:'?'}],'操作顺序决定百分比的整体');
   case 'percentRestore':{const p=v&&m.p===100?50:m.p;return strips([row('原价（看作100份）',100,'100 份'),row(v?'先降后的价':'先涨后的价',v?100-p:100+p,(v?100-p:100+p)+' 份')],v?'以降低后的价格为整体，涨回原价100份':'以提高后的价格为整体，降回原价100份',{continuous:true})}
   case 'natural-offers':return {kind:'scene-twoFlows',rows:[{name:'甲店',nodes:[v?'? 本':m.count+' 本',m.price+' 元/本','×75%','+'+m.fee+' 配送']},{name:'乙店',nodes:[v?'? 本':m.count+' 本',m.price-1+' 元/本','免配送']}],caption:v?'求甲总价不高于乙的最少整数本数':'比较同样本数的整单费用'};
   case 'equalDistanceSpeed':return {kind:'scene-journey',segments:[{name:'去',speed:m.speed},{name:'回',speed:2*m.speed}],speedUnit:state.units.speed,equal:v?'time':'distance',caption:v?'去回时间相同':'去回路程相同，时间未必相同'};
   case 'natural-catch':return {kind:'scene-journey',segments:[{name:'小乐',speed:m.slow},{name:'小明',speed:m.fast}],delay:m.delay,afterCatch:v,caption:v?`追上后小明停，小乐再走 ${m.delay} 分钟`:`小乐先走 ${m.delay} 分钟，小明再出发`};
   case 'riverTravel':return {kind:'scene-journey',segments:[{name:'顺流',speed:v?m.v:'?'},{name:'逆流',speed:v?m.v:'?'}],distance:m.distance,equal:'distance',caption:v?'取消水流，静水速度 '+m.v+' 千米/时':'已知静水 '+m.v+'，水流 '+m.c+' 千米/时；实际行驶速度由你推导'};
   case 'jointWork':return units([group('甲',1,'人',m.a),...(!v?[group('乙',1,'人',m.b)]:[])],`每分钟分别完成图中数量；目标 ${(m.a+m.b)*m.t} 个盒子`,{object:'person',scoreUnit:'个/分钟'});
   case 'unitConversion':return flow([{label:'总量',value:m.liters+' 升'},{label:'统一单位',value:'1升=1000毫升'},{label:'每杯',value:m.cup*(v?2:1)+' 毫升'},{label:'杯数',value:'?'}],'同一单位的容量相除');
   case 'stagedClimb':return {kind:'scene-climb',up:m.up,down:m.down,height:m.height,stop:!v,caption:v?'每个夜晚都完整回退':'白天到标记立即停，不再夜间回退'};
   case 'fixedPerimeter':return {kind:'scene-fixedPerimeter',half:m.half,even:v&&!E.math?.minSide,minSide:v?E.math?.minSide:null,caption:`周长 ${2*m.half}，${v&&E.math?.minSide?'每边至少 '+E.math.minSide:v?'两边为正偶数':'两边为正整数'}；${v&&E.math?.minSide?'求最小':'比较'}面积`};
   case 'overlapAverages':{const a=v?(E.math?.values||[...m.values,m.values[0],m.values[6]]):m.values,n=a.length,k=(n+1)/2;return {kind:'scene-overlapSequence',n,k,means:[F(sum(a.slice(0,k)),k),F(sum(a.slice(k-1)),k),F(sum(a),n)],caption:`第 ${k} 个位置同时属于前后两段；只给平均，不给各数`}}
   case 'missingAverage':return strips([row('原来 '+m.count+' 个',m.count,'平均 '+m.mean),row('余下 '+(m.count-1)+' 个',m.count-1,'平均 '+m.other),row(v?'再放回两次':'删去',v?2:1,'?')],v?'余下的数与两份删去数合并':'两条的总量差对应删去的数');
   case 'medianSort':{const a=[m.start+4*m.gap+(v?100:0),m.start,m.start+3*m.gap,m.start+m.gap,m.start+2*m.gap];return slots(a,'先比较大小，再确定中间位置',{positions:true})}
   case 'chartAverage':{const counts=m.counts.map((x,i)=>x+Number(v&&i===2));return {kind:'bars',values:counts,names:['2分','4分','6分']}}
   case 'cumulativeChart':return {kind:'scene-cumulative',values:[m.a,m.a+m.b,m.a+m.b+m.c,m.a+m.b+m.c+m.d],target:v?[3,4]:[1,3],caption:v?'恰好4分':'恰好2分或3分；每个累计包含前面的档'};
   case 'reverseDigits':return {kind:'scene-placeValue',rows:[{label:'原数',digits:v?['小','大']:['大','小']},{label:'交换',digits:v?['大','小']:['小','大']}],caption:v?`数字和 ${m.a+m.b}、差 ${m.a-m.b}`:`数字和 ${m.a+m.b}、交换后小 ${9*(m.a-m.b)}`};
   case 'digitInsert':return {kind:'scene-placeValue',rows:[{label:'位置1',digits:[m.d,m.a,m.b]},{label:'位置2',digits:[m.a,m.d,m.b]},{label:'位置3',digits:[m.a,m.b,m.d]}],caption:v?'比较同一组位置，取最小':'原来两张卡顺序保留；比较大小'};
   case 'numberAppend':return {kind:'scene-placeValue',rows:[{label:'原数',digits:['?','?']},{label:v?'前添':'末添',digits:v?[m.digit,'?','?']:['?','?',m.digit]}],caption:v?'前添的数字占百位':'新数比原数多 '+(9*m.n+m.digit)};
   case 'divisibleDigits':case 'divisibleEleven':return slots([m.a,'□',m.b??m.c,'□'],id==='divisibleDigits'?(v?'被9整除且为偶数':'同时被9和5整除'):(v?'数全部合法选择':'同时被11和5整除'),{positions:true});
   case 'natural-digitCount':case 'natural-distinctDigitCount':return {kind:'scene-choices',values:m.digits,places:2,repeat:state.projection.repeat,caption:'十位与个位有序；数字和须被3整除'};
   case 'digitComplement':return slots(items(m.length,`0…9`),v?`恰好一位 ${m.digit}`:`至少一位 ${m.digit}`,{positions:true});
   case 'differentDigits':return slots([`1…${m.digits}`,`1…${m.digits}`],v?'两位不同；交换顺序合为同一个':'两位必须不同；顺序不同算不同',{positions:true,exchangeEquivalent:v});
   case 'digitDivisor':return slots([m.tens,v?'0…9':'1…9'],'个位作除数'+(v?'：0能作除数吗？':''),{positions:true});
   case 'pairedSum':return strips([row(v?'只取偶数':'连续整数',m.n,`1、2、…、${m.n}`),row('反向排列',m.n,`${m.n}、…、2、1`)],'对应位置配对',{pairing:true});
   case 'telescopingDifferences':{const first=m.start+(v?m.step:0),left=m.start+2*m.step,right=m.start+(m.n-1)*m.step;return timeline([...new Set([first,...(!v?[m.start+m.step]:[]),left,right,m.start+m.n*m.step])].sort((a,b)=>a-b),'只标题目给出的端点，中间项仍省略',{omittedInterval:right>left+m.step?[left,right]:null})};
   case 'neighborProducts':return {kind:'scene-product',n:m.n,delta:v?2:1,caption:'比较 n×n 与 (n−d)×(n+d)，方格只表示对应关系'};
   case 'signedProduct':return slots([-4*m.k,-3*m.k,-m.k,0,2*m.k,5*m.k],v?'任选2张，先比较符号':'任选3张，先比较符号',{positions:false,choose:v?2:3});
   case 'squareBounds':return {kind:'scene-squareBounds',n:m.n,upper:v,caption:'找相邻整数的平方夹住这个数；边界整数未知'};
   case 'consecutiveRepresentations':return strips([row('连续数',5,v?'a≥0':'a≥1')],`总和 ${m.total}；至少2项；首项、项数都未知`,{sequence:true});
   case 'recurrenceForward':case 'recurrenceTotal':case 'recurrenceBackwards':case 'recurrenceRemainders':{let a=m.a??m.first??(v?2:1),b=m.b??m.second??(v?2:1);if(v&&id==='recurrenceForward')[a,b]=[b,a];const seq=[a,b];while(seq.length<m.n)seq.push(seq.at(-1)+seq.at(-2));return slots(id==='recurrenceBackwards'?['?', '?','…',seq.at(-2),seq.at(-1)]:[a,b,'?','?','…'],`${m.n} 项；从第3项起前两项相加`+(v&&id==='recurrenceBackwards'?'；第1项增加1':v&&id==='recurrenceTotal'?'；只加第2项起':''),{positions:true,positionLabels:state.projection.termIndices,positionUnit:'项'})}
   case 'factorBalance':return {kind:'scene-factorPairs',product:m.product,caption:v?'合法因数对中比较最大和':'合法因数对中比较最小和'};
   case 'threeDivisors':return timeline([1,m.limit],v?'恰好3个因数：找最大合法数':'区间内检查恰好3个因数',{domain:'integer'});
   case 'divisorPowers':return {kind:'scene-exponentGrid',a:m.a,b:m.b,even:v,caption:v?'两个指数都须为偶数':'每个因数由两个指数唯一确定'};
   case 'equalBags':return units([group('红糖',m.a,'颗'),group('蓝糖',m.b,'颗')],v?'比较所有可行袋数':'两色全部用完；每袋两色数量分别相同',{object:'ball',compress:true});
   case 'bells':return {kind:'scene-twoTimelines',periods:[m.a,m.b],start:0,end:v?(m.a*m.b/((a,b)=>{while(b)[a,b]=[b,a%b];return a})(m.a,m.b)):m.duration,includeStart:v,caption:v?'起点和终点都计入':'不算起点，结束时刻计入'};
   case 'offsetBells':return {kind:'scene-twoTimelines',periods:[m.a,m.b],offsets:[0,m.offset],start:0,end:m.a*m.b+m.offset,draft:true,unit:'分钟',caption:v?'用各自周期继续找下一次同时响':'从各自起点按周期标记；不把第0分钟当答案'};
   case 'lastDigit':return flow([{label:'底数',value:m.base},{label:'指数',value:v?`${m.exponent} 与 ${m.exponent+1}`:m.exponent},{label:v?'相邻幂相加个位':'个位',value:'?'}],'寻找从一次方开始的个位循环');
   case 'cyclicPosition':return circle(Array.from({length:m.size},(_,i)=>i+1),`从 ${m.start} 开始，${v?'逆':'顺'}时针 ${m.steps} 步`,{start:m.start,direction:v?-1:1});
   case 'repeatedOnes':return slots(['1','1','…','1'],`${v?m.n+1:m.n} 个1；除以7取余`,{positions:true,positionLabels:['第1位','第2位','…','第'+(v?m.n+1:m.n)+'位']});
   case 'menuBranches':return {kind:'scene-branch',branches:[{label:'米饭',count:m.rice,next:{label:'菜',count:m.dish}},{label:'面',count:m.noodle}],drinks:v?3:null,caption:v?'每份午餐都再配3选1饮料':'米饭配菜，或单独一份面'};
   case 'adjacentLine':return slots(state.projection.line,v?'两人不能相邻；这只是一个合法例子':'两人必须相邻；其余人各不相同',{positions:true,adjacent:state.math.adjacent});
   case 'restrictedTeam':return units([group('小乐',1,'人'),group('小明',1,'人'),{...group('其余人数','?','人'),quantityRole:'target'}],v?'共有'+m.n+'人；小乐小明固定入选，第三人从谁中选择？':'共有'+m.n+'人；选3人，无职位，乐明不能同选',{object:'person'});
   case 'unorderedPairs':return units([group('不同小朋友',m.n,'人')],v?'每对搭档指定角色':'选2人作搭档，不分先后',{object:'person'});
   case 'circularSeating':return circle(items(m.n,'人'),v?'取消相邻限制；旋转合并':'乐明相邻；旋转合并，镜像不合并',{special:['乐','明'],adjacent:!v});
   case 'parityPermutations':return slots(Array.from({length:m.n},(_,i)=>i+1),v?(m.transferConstraint==='first-odd'?'偶数彼此不能相邻，首位必须是奇数':'奇数彼此不能相邻'):'偶数彼此不能相邻',{positions:true});
   case 'binaryNoNeighbors':return slots([v?'●':'○/●',...items(m.n-1,'○/●')],v?'第一盏必须亮；亮灯不能相邻':'每盏亮或灭；亮灯不能相邻',{positions:true});
   case 'allThreeColors':return slots(items(m.n,'红/蓝/绿'),v?'三色中恰好出现两种':'三种颜色都必须出现',{positions:true});
   case 'spinnerLabels':return circle([...items(m.a,'A'),...items(m.b,'B'),...items(m.c,'C')],v?'已知不是C，只在A/B扇区比较':'每个扇区等面积、等机会',{sectors:true,excluded:v?['C']:[]});
   case 'natural-pairChance':case 'conditionalBalls':return units([group('红',m.red,'个'),group('蓝',m.blue,'个')],id==='natural-pairChance'?(v?'每次放回并混合':'不放回取2个，具体球对等可能'):(v?'已知两球颜色相同':'已知至少一个红球'),{object:'ball',sample:2});
   case 'diceSum':return {kind:'scene-diceGrid',faces:m.faces,target:m.target,different:v,caption:v?'只保留两个点数不同的有序对':'行列各对应一枚骰子的实际点数'};
   case 'remainderProbability':return {kind:'scene-remainderCards',mod:m.mod,count:m.count,wanted:m.wanted,includeZero:v,draft:true,caption:'每张卡等可能；分组与尾段由你建立'};
   case 'worstCaseColors':return units(m.caps.map((n,i)=>group(['红','蓝','绿'][i],n,'个')),`不放回；保证 ${m.k+Number(v)} 个同色`,{object:'ball',guarantee:m.k+Number(v)});
   case 'setOutside':case 'exactlyOneSet':case 'natural-unionChance':case 'natural-complementChance':case 'ratioUnion':{const s=state.projection.sets;return {kind:'scene-sets',a:id==='ratioUnion'?m.a+' 份':s.a,b:id==='ratioUnion'?m.b+' 份':s.b,both:s.both,total:s.total??(id==='ratioUnion'?(m.a+m.b)*m.unit-m.both:null),names:id==='ratioUnion'?['棋类组','球类组']:['甲组','乙组'],change:v&&['exactlyOneSet','ratioUnion'].includes(id)?'one-joins-second':v&&id==='setOutside'?'one-outside-joins-both':null,conditional:v&&id.startsWith('natural-'),caption:v?E.prompt:'两组交叠区域属于两组；圈外属于都没参加'}};
   case 'threeSetExactlyTwo':return {kind:'scene-threeSets',ab:m.ab,ac:m.ac,bc:m.bc,triple:m.triple,caption:v?'至少两组：中央三组区域也符合':'恰好两组：每个两组交集都包含中央三组交集'};
   case 'lightSwitchParity':return flow([{label:'开始',value:m.on?'亮':'灭'},{label:'重复按',value:`${m.groups}×${m.per}`},{label:'再按',value:m.extra+(v?1:0)},{label:'最后',value:'?'}],'每次在亮灭之间切换');
   case 'ballReplacement':return {kind:'scene-ballRule',white:m.white+Number(v),black:m.black,caption:'同色→黑；异色→白；每次少一球'};
   case 'quarterTurn':case 'transformOrder':return {kind:'scene-direction',start:m.start,turns:id==='quarterTurn'?m.turns:m.rot,mirror:id==='transformOrder',reverseOrder:v&&id==='transformOrder',anticlockwise:v&&id==='quarterTurn',caption:'上0、右1、下2、左3；按条件顺序追踪'};
   case 'cubeSteps':return {kind:'scene-stairs',n:m.n,depth:v?2:1,caption:`每列 ${v?2:1} 块厚；列高1到 ${m.n}`};
   case 'natural-tiles':{const scale=v?2:1;return {kind:'scene-tiledRectangle',w:m.w*scale,h:m.h*scale,caption:'同规格正方形砖铺满，不切砖；先找最大整数边长'}};
   case 'mapScale':return strips([row('甲地图',m.a,m.a+'厘米'),row('乙地图',m.a*m.k*(v?.5:1),'?')],v?'乙再缩成当前1/2':'乙所有长度为甲的 '+m.k+' 倍',{continuous:true});
   case 'scaleAreaReverse':return flow([{label:'原面积',value:'?'},{label:'长放大',value:m.k+' 倍'},...(v?[]:[{label:'长缩为当前',value:'1/'+m.s}]),{label:'面积',value:v?'?':m.old*m.k*m.k/(m.s*m.s)}],'长度倍率与面积倍率分别追踪');
   case 'oppositeScale':return strips([row('原长',m.a,m.a+'份'),row('新长',m.b,m.b+'份'),row('原宽',m.b,m.old),row('新宽',v?m.b*m.b/m.a:m.a,'?')],v?'长宽使用同一倍率，面积不再固定':'面积不变：宽须使用反向倍率',{continuous:true});
   case 'similarAreaPerimeter':return v?strips([row('小图周长',1,'1份'),row('新图周长',m.b,m.b+'份')],`已知周长倍率 ${m.b}，面积倍率待求`,{continuous:true}):strips([row('小面积',m.a*m.a,m.a*m.a+'份'),row('大面积',m.b*m.b,m.b*m.b+'份')],`小图周长 ${m.a*m.unit}；对应长度比由你推导`,{continuous:true});
   case 'shadowSimilarity':return {kind:'scene-shadows',smallHeight:m.a,smallShadow:v?'?':2*m.a,bigShadow:v?m.b*m.unit:2*m.b*m.unit,bigHeight:v?'原高不变':'?',caption:v?'两杆高度均不变，比较同一时刻的影长变化':'同一时刻、竖直杆、同一阳光方向'};
   case 'ageDifference':return {kind:'scene-age',ago:m.ago,gap:m.parent-m.child,child:v?m.child:'?',parent:v?m.parent:'?',caption:v?'年龄差不变，找未来2倍时刻':`${m.ago} 年前大人是孩子3倍；求孩子现在年龄`};
   default:return geometry(c,f,v);
  }
 }

 function geometry(c,f,v){
  const m=c.math,id=f.id,E=c.extension,d=copy(c.diagram||{});
  if(!v&&id!=='squareBorder'&&d.kind&&!['table','rule-table','line','digits','cuboid','coordinate','sets','meeting','garden','balls','rectangle'].includes(d.kind))return d;
  switch(id){
   case 'natural-coordinateDistance':return {kind:'scene-coordinates',a:[m.x,m.y],b:[m.x+m.dx,m.y+m.dy],gridOnly:v,caption:v?'只允许水平和竖直走':'比较直线与网格距离'};
   case 'coordinateHorizontal':return {kind:'scene-coordinates',a:[m.a+(v?5:0),m.y],b:[m.b+(v?5:0),m.y],caption:'两点同一纵坐标'};
   case 'paintedCube':case 'cubeProbability':return {kind:'scene-cube',n:m.n,faces:v&&id==='paintedCube'?['top','bottom']:['all'],conditional:v&&id==='cubeProbability',caption:v?configs[id].change:'棱上每边 '+m.n+' 个小块；角另分一类'};
   case 'ladderShift':return {kind:'scene-ladder',length:5*m.k,base:v?'?':3*m.k,nextBase:v?null:4*m.k,height:v?4*m.k:'?',caption:v?'已知高度，求底端距离':'同一根梯子；斜边长度不变'};
   case 'boundaryNotch':return v?(E.math?.placement==='internal'?{kind:'scene-holeRectangle',...E.math,caption:'外边与内洞都计入边界总长度'}:{kind:'lShape',w:m.w,h:m.h,a:m.a,b:m.depth,caption:'缺口在角上；比较移除与补入的边'}):{kind:'notch',...m,caption:'中间缺口；口宽与深度作用不同'};
   case 'rectangleDiagonalArea':return {kind:'rectangleDiagonal',w:m.w*(v?1.5:1),h:m.h};
   case 'lShapeArea':return v?{kind:'scene-holeRectangle',...m,caption:'洞在内部；面积与轮廓变化分开'}:{kind:'lShape',...m};
   case 'crossArea':return {kind:'cross',...m,intersectionOnly:v};
   case 'semicircleBoundary':return v?{kind:'scene-fullCircle',radius:m.radius,caption:'两条直径拼到内部，不属于外周'}:{kind:'semicircle',...m};
   case 'circleRingRatio':return {kind:'ring',r1:m.r1*(v?2:1),r2:m.r2*(v?2:1)};
   case 'parallelTriangle':return {kind:'parallelTriangle',n:v?2:m.n,k:v?1:m.k};
   case 'hypotenuseMidpoint':return {kind:'hypotenuseMidpoint',...m,legMidpoint:v};
   case 'openBox':return {kind:'boxNet',side:m.side,cut:v?1:null,caption:v?'固定每角剪1×1，求底面积':'x未知；底边必须为正'};
   case 'circleRoute':return {kind:'circleRoute',...m,whole:v};
   case 'outsideAngle':return {kind:'isoscelesExterior',...m,target:v?'other-base':'exterior'};
   case 'natural-angleRatio':return v?{kind:'scene-polygonAngles',ratios:[...m.ratios,m.ratios[2]],sides:4,caption:'四边形角总量360°'}:{kind:'angleRatioTriangle',ratios:m.ratios};
   case 'angleMarks':return {kind:'scene-rays',marks:m.marks,steps:m.step,other:v,caption:v?'沿另一个方向围出的角':'沿较短方向相隔 '+m.step+' 段'};
   case 'polygonTurn':return {kind:'scene-polygon',n:m.n,steps:v?Math.floor(m.n/2):m.n,caption:'沿边行走，外转角在顶点标出'};
   case 'overlapSquares':case 'overlapProbability':return {kind:'overlapSquares',...m,exclusive:v&&id==='overlapSquares',sampleFirst:v&&id==='overlapProbability'};
   case 'gridDetour':case 'routeProbability':case 'stepwiseRoute':return {kind:'routes',...m,firstUp:v&&id!=='stepwiseRoute',sampling:id==='stepwiseRoute'?!v:false};
   case 'rectanglePointAreas':return {kind:'fourAreas',top:m.top,left:m.left+(v?1:0),right:v?'?':m.right,bottom:'?',caption:v?'P只向右；左右总面积保持不变':'各三角形面积按标签给出，不按图估算'};
   case 'squareBorder':return {kind:'scene-border',n:m.n,partial:v,caption:v?'只加左、上；外角不重复':'外侧加一圈，原有格子不算新增'};
   case 'checkerDomino':return {kind:'checker',...m,removeTop:v};
   case 'foldHoles':return {kind:'foldHoles',interior:m.interior+Number(v),edge:m.edge-Number(v),center:m.center};
   case 'chartScale':return {kind:'bars',values:[m.a+Number(v),m.b+Number(v),m.c+Number(v)],names:['甲','乙','丙'],known:v?null:0,knownValue:m.a*m.unit,unit:v?m.unit:null};
   case 'truncatedBars':return {kind:'truncatedBars',...m,caption:v?'求乙比甲多的人数，刻度起点仍相同':'求两组实际总人数'};
   case 'rotatingColors':return {kind:'necklaceBlank',...m,fixed:v};
   default:throw Error('Missing explicit RC67 representation '+id);
  }
 }

 function decorate(c,f,generatorRevision){
  const config=configs[f.id];if(!config)throw Error('Missing family contract '+f.id);
  if(generatorRevision>=3){
   const unambiguous=text=>String(text).replace(/÷\s*([-−]?\d+(?:\.\d+)?\/[-−]?\d+(?:\.\d+)?)/g,'÷ ($1)');
   c={...c,methods:c.methods.map(m=>({...m,steps:m.steps.map(unambiguous)})),extension:{...c.extension,solution:unambiguous(c.extension.solution)}};
  }
  const initial=scene(c,f),variation=scene(c,f,true),loads=load(c,f);
  const original=copy(c.math);
  if(!variations[f.id])throw Error('Missing variation value contract '+f.id);
  const variationSpec=generatorRevision>=3?variations[f.id]:{category:'legacy-condition',recheck:config.change};
  const contract={schemaVersion:1,familyId:f.id,modelId:config.model,requiredTopics:[...f.topicIds],goal:config.goal,question:c.prompt,givens:original,constraints:config.constraints,criticalDecision:f.insight,reasoningKey:f.reasoningKey,configurationKey:f.structureKey||f.id,...loads,parameterPolicy:{domain:config.constraints,bounded:true,maxTrials:120,ordinaryScore:'integer',fractionReason:'fraction, ratio, probability, measurement or weighted result'},diagramSpec:{kind:initial.kind,source:'competition.math',stages:['initial','hint','solution','variation'],representationReason:config.model},variationSpec:{change:c.extension.prompt,category:variationSpec.category,decision:variationSpec.recheck,preserved:'未声明变化的原条件',independent:true,newStrategyClaim:false},validation:{oracle:'source/competition_reviewed_oracles.js + RC67 independent overrides',seeds:128}};
  c={...c,...loads,quality:contract,diagram:initial,problemState:problemState.create(c,f),displayRevision:2};
  const familyHints={openBox:['要使体积最大，需要同时知道哪些长度？','剪角长度决定底边和高度，先列合法剪角，再比较体积。'],menuBranches:['两种午餐选择会同时发生，还是只能选一种？','把米饭配菜与单独选面分成互斥分支；新增饮料作用于整份午餐。'],rotatingColors:['旋转后相同的涂法，能否当成两种？','找一个固定参照，检查每个涂法在旋转中重复几次；不是一律除以位置数。'],recurrenceBackwards:['从末尾两个已知数，能得到它们前面的哪个数？','向前是两个相邻数相加，倒推需要使用怎样的逆运算？']};
  c.ruleHints=c.ruleHints||familyHints[f.id]||['要得到题目问的量，还需要哪些条件？先选择一个能确定的中间量。',hintPolicy[config.model]];
  if(!c.ruleHints.every(Boolean))throw Error('Missing hint policy '+f.id);
  c.quality.hintStages=c.ruleHints.map((text,i)=>({level:i+1,text,representation:initial.kind}));
  c.hintDiagram={...copy(initial),stage:{kind:'hint',text:c.ruleHints[1]}};
  c.methods=c.methods.map((method,route)=>({...method,frames:method.steps.map((text,step)=>({kind:'scene-stage',scene:solutionScene(c,f,route,step,initial),stage:{kind:'solution',route,step,text},routeDiagram:method.frames?.[step]||null}))}));
  const solvedVariation=copy(variation);
  if(f.id==='offsetBells')solvedVariation.draft=false;  if(f.id==='restrictedTeam')solvedVariation.groups=[group('小乐',1,'人'),group('小明',1,'人'),group('其余人数',c.math.n-2,'人')];  if(solvedVariation.average==='?')solvedVariation.average=c.extension.answer;
  if(solvedVariation.kind==='scene-fractions'){if(solvedVariation.start==='?'&&solvedVariation.left!=='?')solvedVariation.start=c.extension.answer;else if(solvedVariation.left==='?')solvedVariation.left=c.extension.answer}
  const extension={...c.extension,diagram:variation,problemState:problemState.create(c,f,true),solutionFrames:[{kind:'scene-stage',scene:solvedVariation,stage:{kind:'solution',step:0,text:c.extension.solution}}]};
  if(generatorRevision>=3){
   extension.math=extension.math||{...original,baseFamily:f.id,condition:config.change};
   // Adding a diagram or explicit provenance must not create a new first chance.
   // Only a genuinely changed target/condition supplies a new key in revise().
  }
  c.extension=extension;return c;
 }
 function solutionScene(c,f,route,step,initial){
  const m=c.math;
  if(f.id==='offsetBells')return {...copy(initial),draft:false,caption:'解法回顾：分别按周期列出响铃时刻（分钟）'};
  if(f.id==='restrictedTeam')return {...copy(initial),groups:[group('小乐',1,'人'),group('小明',1,'人'),group('其余人数',m.n-2,'人')],caption:'解法回顾：从总人数扣除两名指定的人'};
  if(f.id==='riverTravel')return {...copy(initial),segments:[{name:'顺流',speed:m.v+m.c},{name:'逆流',speed:step>0?m.v-m.c:'?'}],caption:'按当前解法步骤确认实际速度'};
  if(f.id==='telescopingDifferences')return timeline(Array.from({length:m.n+1},(_,i)=>m.start+i*m.step),'解法回顾：按相邻关系补齐后核对端点');
  if(['natural-weighted','natural-fractionWeighted'].includes(f.id)&&m.den===1){
   const a=m.red,b=m.blue,low=m.redScore,high=m.blueScore,total=a+b,answer=c.answer;
   if(!route&&step===0)return copy(initial);
   if(!route&&step===1)return units([group('红队合计',a,'人数份',a*low),group('蓝队合计',b,'人数份',b*high)],'先分别合计，不把总分当每人分数',{object:'person',scoreLabel:'整队共'});
   if(route&&step===0)return units([group('红队',a,'人数份',low),group('蓝队',b,'人数份',low)],'假设每人先拿同样的低分',{object:'person'});
   if(route&&step===1)return units([group('红队额外',a,'人数份',0),group('蓝队额外',b,'人数份',high-low)],'只有蓝队高出基准；这部分要分给全体',{object:'person'});
   return {kind:'scene-share',people:total,average:answer,totalScore:a*low+b*high,base:route?low:null,extraAverage:route?F(b*(high-low),total):null,caption:route?'先均分额外分数，再加每人的基准分':'总分平均分到代表组的每个人'};
  }
  if(f.id==='overlapAverages'){
   const d=copy(initial),values=m.values,k=4;d.totals=[sum(values.slice(0,k)),sum(values.slice(k-1)),sum(values)];d.knownMiddle=step===c.methods[route].steps.length-1?values[k-1]:null;d.caption=route?'用整体减后段，找到前面不重叠的部分':'从两段合计中扣去整段，留下重叠位置';return d;
  }
  if(f.id==='fixedPerimeter'){
   const half=m.half,short=Math.floor(half/2),rows=[];
   if(!route&&step===1){for(let x=1;x<=short;x++)rows.push({w:x,h:half-x,area:x*(half-x)});return {kind:'scene-areaPairs',rows,caption:'合法短边逐个列出，交换长宽不新增面积'}};
   if(route&&step<2){const w=Math.max(1,short-2),h=half-w;return {kind:'scene-areaPairs',rows:[{w,h,area:w*h},{w:w+1,h:h-1,area:(w+1)*(h-1)}],caption:'长减1、短加1：长宽和不变，比较增加与去掉的条'}};
   if(step===c.methods[route].steps.length-1)return {kind:'scene-areaPairs',rows:[{w:short,h:half-short,area:short*(half-short)}],caption:'最接近的一对达到最大面积'};
  }
  return copy(initial);
 }
 function family(f){const config=configs[f.id];if(!config)throw Error('Unregistered RC67 family '+f.id);const sameWeights=['natural-weighted','natural-fractionWeighted','rule-weighted-mean','rule-weighted-score'];return {...f,modelId:config.model,criticalDecision:f.insight,qualityPolicy:config,selectionReasoningKey:sameWeights.includes(f.id)?'weighted-total':f.reasoningKey}}
 function comfort(c){const a=c.calculationLoad||load(c,{id:c.family,level:c.level||1,insight:c.insight||''}).calculationLoad,b=c.readingLoad;return a.level*10+a.operations+Math.min(a.enumeration,50)/10+Number(a.fractional)+a.digits/10+(b?.level||1)*2}
 function familyLoads(f){return f.selectionLoads||(f.selectionLoads=load(revise(f.build(1,2),f,1),f))}
 return {configs,family,revise,decorate,scene,load,comfort,familyLoads};
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionFraction,competitionNumericOptions},typeof module!=='undefined'?require('./competition_rules'):CompetitionRules,typeof module!=='undefined'?require('./problem_state'):ProblemState);
if(typeof module!=='undefined')module.exports=CompetitionDesign;

'use strict';
// New mathematical configurations use revision 4. Revisions 1--3 stay replayable.
const StructuredRecipes=((h)=>{
 const {competitionRng:rng,competitionNumericOptions:options,competitionFraction:F}=h;
 const M=(name,...steps)=>({name,steps}),copy=x=>JSON.parse(JSON.stringify(x));
 const catalog=[{id:'threeGroupBalance',topicIds:['A02','R01','L01'],level:3,title:'三个小组',strategy:'统一参照与总量',reasoningKey:'three-group-reference',origin:'rc68-original',insight:'选择共同参照，区分均等份和额外量，再检验三个条件',build:seed=>create('threeGroupBalance','main',seed)}];
 const sourceConfigs={overlapAverages:'amc2000-23-full',signedProduct:'amc2000-07-full',digitDivisor:'amc2000-11-full',lShapeArea:'amc2000-06-full'};
 const extraConfigs={parityPermutations:['first-odd-transfer']};
 function minProducts(cards,n){let best=Infinity,plans=[];function walk(start,pick){if(pick.length===n){const product=pick.reduce((a,b)=>a*b,1);if(product<best){best=product;plans=[pick]}else if(product===best)plans.push(pick);return}for(let i=start;i<cards.length;i++)walk(i+1,[...pick,cards[i]])}walk(0,[]);return {best,plans}}
 function groupState(T,d,k,config){
  const direction=config==='change-difference-direction'?-1:1,ref=config==='change-ratio-reference'?'A':'B',goal=config==='change-goal'?'B':'C';
  const B=(T-direction*d*(ref==='A'?k+1:1))/(k+2),A=B+direction*d,C=k*(ref==='A'?A:B);
  if(![T,d,k,A,B,C].every(Number.isSafeInteger)||Math.min(A,B,C)<=0)throw Error('人数条件没有正整数解');
  return {T,d,k,direction,ref,goal,A,B,C,configurationId:config};
 }
 function create(id,config,seed){
  const r=rng(seed);let c;
  if(id==='threeGroupBalance'){
   if(!['main','change-difference-direction','change-ratio-reference','change-goal','invalid-discrete'].includes(config))throw Error('Unknown group configuration');
   if(config==='invalid-discrete')return groupState(55,6,2,config);
   // Even differences and B>d make the direction/reference variations legal.
   let B,d,k,m;
   if(seed===1){B=12;d=6;k=2}else{k=2+r(3);d=(k===2?2:k===3?5:3)*(1+r(k===2?6:k===3?3:5));B=d+1+r(25-d)}
   const T=(k+2)*B+d;m=groupState(T,d,k,config);
   const relation=m.ref==='A'?'甲':'乙',direction=m.direction===1?'多':'少',answer=String(m[m.goal]);
   const extra=m.direction*d*(m.ref==='A'?k+1:1),net=T-extra,parts=k+2;
   const methods=[M('用乙作共同参照',`甲是乙${m.direction===1?'加':'减'} ${d}；丙是 ${k} 个${relation}。`,`三组总量可写为 ${parts} 个乙${extra>=0?'加':'减'} ${Math.abs(extra)}。`,`去掉额外量：${T}−(${extra})=${net}；乙 ${net}÷${parts}=${m.B}。`,`甲 ${m.A}，乙 ${m.B}，丙 ${m.C}；总和 ${T}、甲乙差 ${d}、丙是${relation} ${k} 倍。`)];
   if(k===2&&m.ref==='B'&&m.goal==='C')methods.push(M('直接表示丙',`甲加乙等于丙${m.direction===1?'加':'减'} ${d}。`,`三组总量是2个丙${m.direction===1?'加':'减'} ${d}；丙 (${T}−(${m.direction*d}))÷2=${m.C}。`,`代回三组条件，甲 ${m.A}、乙 ${m.B}、丙 ${m.C}。`));
   methods.push(M('有序试探并核对',`依次尝试乙为正整数，甲随之${m.direction===1?'加':'减'} ${d}，丙取${relation}的 ${k} 倍。`,`每增加1个乙，总量增加 ${parts} 人，故不会有两个不同解。`,`满足全部条件的是甲 ${m.A}、乙 ${m.B}、丙 ${m.C}。`));
   const vm=groupState(T,d,k,config==='main'?'change-difference-direction':'main');
   c={family:id,title:'三个小组',math:m,answer,prompt:`甲、乙、丙三个小组共有 ${T} 人。甲组比乙组${direction} ${d} 人，丙组人数是${relation}组的 ${k} 倍。${m.goal==='B'?'乙':'丙'}组有多少人？`,methods,rc68Diagram:{kind:'scene-groupDraft',T,d,k,goal:m.goal,ref:m.ref,direction:m.direction},ruleHints:['要得到所求小组人数，还需要知道哪个量？','甲和丙的条件中共同出现了哪一组？它能表示其他组吗？'],extension:{key:vm.configurationId,prompt:`三组仍共 ${T} 人，甲比乙${vm.direction===1?'多':'少'} ${d} 人，丙是乙 ${k} 倍。丙有多少人？`,answer:String(vm.C),solution:`先统一成乙组的份量，总量扣去带符号差额 ${vm.direction*d}，乙=${vm.B}，丙=${vm.C}；代回检验。`,math:vm,kind:'condition-change',rc68Diagram:{kind:'scene-groupDraft',T,d,k,goal:'C',ref:'B',direction:vm.direction}}};
  }else if(id==='signedProduct'&&config===sourceConfigs[id]){
   const branch=(seed-1)%4;
   const sets=[[-8,-6,-4,0,3,5,7],[-9,-8,-7,0,1,2,3],[-8,-6,-4,0,2,3,8],[-8,-6,-4,2,3,5,7]];
   const cards=sets[branch].map((x,i)=>seed<=4?x:x+(i===0?-r(4):i===6?r(4):0)),main=minProducts(cards,3),v=minProducts(cards,2),neg=cards.filter(x=>x<0),pos=cards.filter(x=>x>0),oneNeg=neg[0]*pos.at(-1)*pos.at(-2),threeNeg=neg.reduce((a,b)=>a*b,1);
   c={family:id,math:{cards,configurationId:config},answer:String(main.best),prompt:`数字卡 ${cards.join('、')}，任选三张不同的卡，乘积最小是多少？`,methods:[M('比较两类负乘积',`一负两正的最小候选 ${oneNeg}；三负的候选 ${threeNeg}。`,`含0为0，其余非负；比较两类负乘积，最小 ${main.best}。${main.plans.length>1?'有不同取法达到同一最小值。':''}`),M('完整枚举',`按卡片下标递增选三张，避免同一组合重复。`,`共 ${cards.length*(cards.length-1)*(cards.length-2)/6} 组，最小乘积 ${main.best}。`)],ruleHints:['三张乘积为负，负数张数可能有哪些情况？','各类里怎样选卡值，才能得到更小的负数？再比较类别。'],rc68Diagram:{kind:'scene-slots',values:cards,choose:3,caption:'卡值各不相同；先自主比较符号类别'},extension:{key:'choose-two',prompt:'改为任选两张不同的卡，最小乘积是多少？',answer:String(v.best),solution:`重新列举两张组合，最小 ${v.best}。三张的类别不能原封不动沿用。`,math:{cards,choose:2},kind:'condition-change',rc68Diagram:{kind:'scene-slots',values:cards,choose:2,caption:'任选两张，重新判断负数张数'}}};
  }else if(id==='digitDivisor'&&config===sourceConfigs[id]){
   const lo=seed===1?10:10+10*r(5),hi=seed===1?50:Math.min(99,lo+10*(2+r(3))),valid=[];
   for(let n=lo+1;n<hi;n++)if(n%10&&n%(n%10)===0)valid.push(n);
   const removed=valid.filter(n=>n%2===0);
   c={family:id,math:{lo,hi,valid,configurationId:config},answer:String(valid.length),prompt:`在 ${lo} 与 ${hi} 之间（不含两端）的整数中，有多少个能被自己的非零个位数字整除？`,methods:[M('按个位分组，跨十位检查',`个位只能取1到9，0不能作除数。分别列出范围内各个位的数。`,`逐一用数除以其个位，只有余数0才保留；合法数 ${valid.join('、')}。`,`共 ${valid.length} 个，各数只属于一个个位分组，不重计。`),M('按十位分段',`按各十位段逐段检查，排除不在严格区间内的端点。`,`合并合法数列表并去重，共 ${valid.length} 个。`)],ruleHints:['个位为0时，“被个位整除”有定义吗？其余数可以怎样分组？','选一个个位，检查它在不同十位段是否都能整除；区间两端算不算？'],rc68Diagram:{kind:'scene-digitRange',lo,hi},extension:{key:'even-only',prompt:`范围与整除条件不变，只保留偶数。共有多少个？`,answer:String(removed.length),solution:`从合法集合保留偶数：${removed.join('、')}，共 ${removed.length} 个。`,math:{lo,hi,evenOnly:true},kind:'condition-change',rc68Diagram:{kind:'scene-digitRange',lo,hi,evenOnly:true}}};
  }else if(id==='lShapeArea'&&config===sourceConfigs[id]){
   const inner=seed===1?3:2+r(7),border=seed===1?1:1+r(3),outer=inner+2*border,region=inner+border,answer=region**2-inner**2;
   c={family:id,math:{inner,border,configurationId:config},answer:String(answer),prompt:`大正方形内有三个小正方形：左上和右下的小正方形边长都是 ${border}，中央正方形边长 ${inner}。如图阴影L形面积是多少？`,methods:[M('推得边长后补形',`沿外边连接三段：${border}+${inner}+${border}=${outer}；阴影所在方块的边为 ${outer}−${border}=${region}。`,`从边长 ${region} 的方块减去中央边长 ${inner} 的方块，${region}²−${inner}²=${answer}。`),M('分为不重叠的两条',`阴影的竖条宽 ${border}，长 ${region}；横条宽 ${border}，除去竖条后长 ${inner}。`,`两条面积相加 ${border}×${region}+${border}×${inner}=${answer}，转角只计一次。`)],ruleHints:['图中哪些短边能连接成一条完整边？先找阴影外框的边长。','如果补成一个方块，需要减去哪块？也可以把L形分成不重叠的两条。'],rc68Diagram:{kind:'scene-hiddenL',inner,border},extension:{key:'perimeter',prompt:'尺寸不变，改求阴影L形的周长，是多少？',answer:String(4*region),solution:`外框边长 ${region}，凹进去的两边替代同长度的两段外边；周长为 ${4*region}。面积的相减不能用作周长。`,math:{inner,border,target:'perimeter'},kind:'condition-change',rc68Diagram:{kind:'scene-hiddenL',inner,border,target:'perimeter'}}};
  }else if(id==='overlapAverages'&&config===sourceConfigs[id]){
   const values=seed===1?[4,5,5,6,8,8,10]:Array.from({length:7},()=>2+r(15)),sum=a=>a.reduce((s,x)=>s+x,0),front=sum(values.slice(0,4)),back=sum(values.slice(3)),total=sum(values),answer=values[3],z=[...values,values[0],values[6]],vf=sum(z.slice(0,5)),vb=sum(z.slice(4)),vt=sum(z);
   c={family:id,math:{values,configurationId:config},answer:String(answer),prompt:`7个数，前4个平均 ${F(front,4)}，后4个平均 ${F(back,4)}，全部平均 ${F(total,7)}。第4个数是多少？`,methods:[M('总和与重叠',`先由平均乘人数，前4合计 ${front}，后4合计 ${back}，全部合计 ${total}。`,`两段合并时，第4个数出现两次，其余各一次；${front}+${back}−${total}=${answer}。`),M('先去除不重叠部分',`全部合计减后4合计，前3合计 ${total}−${back}=${total-back}。`,`前4减前3，只剩第4个：${front}−${total-back}=${answer}。`)],ruleHints:['平均数怎样和一段的总和联系？最后要找的是哪个位置？','把前后两段对齐，哪些位置在相加时被数了两次？'],extension:{key:'nine-term-overlap',prompt:`9个数，前5个平均 ${F(vf,5)}，后5个平均 ${F(vb,5)}，全部平均 ${F(vt,9)}。第5个数是多少？`,answer:String(z[4]),solution:`新的共同位置是第5个。还原总和后：${vf}+${vb}−${vt}=${z[4]}。`,math:{values:z,groupSize:5},kind:'condition-change'}};
  }
  else if(id==='parityPermutations'&&config==='first-odd-transfer'){
   const n=seed===1?8:4+r(5),odd=Math.ceil(n/2),even=Math.floor(n/2);
   const factorial=x=>{let v=1;for(let i=2;i<=x;i++)v*=i;return v},choose=(a,b)=>{let v=1;for(let i=1;i<=b;i++)v=v*(a-i+1)/i;return v};
   const answer=factorial(odd)*choose(odd+1,even)*factorial(even),changed=factorial(odd)*choose(odd,even)*factorial(even);
   c={family:id,math:{n,configurationId:config,transferConstraint:'first-odd'},answer:String(answer),
    prompt:`把 1 到 ${n} 这些不同的数字排成一行，要求任何两个偶数都不相邻。共有多少种排列？`,
    methods:[M('先排奇数，再插入不同的偶数',`先排 ${odd} 个不同奇数，有 ${factorial(odd)} 种顺序；两端和中间共 ${odd+1} 个空隙。`,
      `选 ${even} 个不同空隙，再排列不同偶数，共 ${factorial(odd)}×${choose(odd+1,even)}×${factorial(even)}=${answer} 种。`)],
    ruleHints:['把不受相邻限制的一类先安排好，另一类能放在哪些位置？','两端也算空隙；区分选择空隙与安排不同数字的顺序。'],
    extension:{key:'first-odd-with-separated-evens',kind:'condition-change',
     prompt:'偶数仍彼此不能相邻，再增加首位必须是奇数的条件。共有多少种排列？',answer:String(changed),
     solution:`先安排全部奇数，首位前的空隙不能放偶数。可用空隙由 ${odd+1} 个变为 ${odd} 个，选择 ${even} 个后排列偶数，共 ${factorial(odd)}×${choose(odd,even)}×${factorial(even)}=${changed} 种。`,
     math:{n,odd,even,nonadjacent:'even',firstParity:'odd'}}};
  }
  else throw Error('Unknown structured configuration '+id+'/'+config);
  const value=Number(c.answer);c.options=Number.isInteger(value)?[value,value+1,value-1,value+3,value-2].map(String).sort(()=>0):options(c.answer,r);
  for(let i=c.options.length-1;i>0;i--){const j=r(i+1);[c.options[i],c.options[j]]=[c.options[j],c.options[i]]}c.configurationId=config;return c;
 }
 return {catalog,sourceConfigs,extraConfigs,create,groupState,minProducts};
})(typeof module!=='undefined'?require('./competition'):{competitionRng,competitionNumericOptions,competitionFraction});
if(typeof module!=='undefined')module.exports=StructuredRecipes;


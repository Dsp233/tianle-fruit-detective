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
 function normalizeNumerals(text){
  return String(text??'').replace(/[０-９]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xfee0))
   .replace(/．/g,'.').replace(/＋/g,'+').replace(/－/g,'-').replace(/％/g,'%');
 }
 function arithmetic(text){
  const s=normalizeNumerals(text).trim().replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  if(!s||s.length>160||!/^[\d\s.+\-*/()]+$/.test(s))return null;
  const tokens=s.match(/(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/()]/g)||[];if(tokens.join('')!==s.replace(/\s/g,''))return null;let at=0;
  const pair=(n,d=1n)=>{if(d===0n)throw Error('Zero divisor');return [n,d]},calc=(a,b,op)=>op==='+'?pair(a[0]*b[1]+b[0]*a[1],a[1]*b[1]):op==='-'?pair(a[0]*b[1]-b[0]*a[1],a[1]*b[1]):op==='*'?pair(a[0]*b[0],a[1]*b[1]):pair(a[0]*b[1],a[1]*b[0]);
  function atom(){const t=tokens[at++];if(t==='+'||t==='-'){const a=atom();return [t==='-'?-a[0]:a[0],a[1]]}if(t==='('){const a=expr();if(tokens[at++]!==')')throw Error('Unclosed');return a}if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(t||''))throw Error('Not numeric');const [n,f='']=t.split('.');return pair(BigInt((n||'0')+f),10n**BigInt(f.length))}
  function product(){let a=atom();while(tokens[at]==='*'||tokens[at]==='/'){const op=tokens[at++];a=calc(a,atom(),op)}return a}
  function expr(){let a=product();while(tokens[at]==='+'||tokens[at]==='-'){const op=tokens[at++];a=calc(a,product(),op)}return a}
  try{const a=expr();return at===tokens.length?a:null}catch{return null}
 }
 function equal(a,b){const x=arithmetic(a),y=arithmetic(b);return !!x&&!!y&&x[0]*y[1]===y[0]*x[1]}
 return {create,arithmetic,equal,normalizeNumerals};
})();
if(typeof module!=='undefined')module.exports=ProblemState;

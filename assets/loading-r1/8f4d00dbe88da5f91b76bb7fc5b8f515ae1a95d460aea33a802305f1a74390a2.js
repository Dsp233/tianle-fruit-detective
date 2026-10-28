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
  const idb=adapter.indexedDB||(typeof indexedDB==='undefined'?null:indexedDB),random=typeof crypto==='undefined'?null:crypto;
  const releasedKey=namespace+'_writer_released';
  let writer=test,closed=false,pending=null,lastRaw=null,status=test?'ready':'acquiring',release=null,acquiring=false,fallbackOwner=null;
  try{lastRaw=storage.getItem(namespace)}catch{writer=false;status='read_only'}
  const backups=[];
  const notify=()=>adapter.onStatus?.({status,raw:lastRaw});
  function flush(){if(!writer||closed)return {ok:false,reason:'NOT_WRITER'};if((()=>{try{return storage.getItem(namespace)}catch{status='read_only';return Symbol('unreadable')}})()!==lastRaw){status='conflict';notify();return {ok:false,reason:'CONFLICT'}}
   try{while(backups.length){const [key,value]=backups[0],old=storage.getItem(key);if(old!==null&&old!==value)throw Error('BACKUP_CONFLICT');if(old===null)storage.setItem(key,value);backups.shift()}if(pending!==null){storage.setItem(namespace,pending);lastRaw=pending;pending=null}status='ready';notify();return {ok:true,raw:lastRaw}}
   catch(e){status=e.message==='BACKUP_CONFLICT'?'conflict':'unsaved';notify();return {ok:false,reason:status==='conflict'?'CONFLICT':'QUOTA'}}
  }
  function commit(snapshot,expectedRaw){if(status==='conflict'||closed)return {ok:false,reason:'CONFLICT'};if(expectedRaw!==lastRaw)return {ok:false,reason:'CONFLICT'};try{pending=JSON.stringify(snapshot)}catch{status='unsaved';notify();return {ok:false,reason:'SERIALIZATION'}}if(!writer){notify();return {ok:false,reason:'NOT_WRITER',pending:true}}return flush()}
  // IndexedDB transactions provide a serialized claim when Web Locks are not
  // available. A claim is reusable only after its owner synchronously marks it
  // released; there is deliberately no time-based takeover of a live writer.
  function acquireFallback(){
   if(!idb||!random?.getRandomValues)return false;
   const bytes=new Uint8Array(16);try{random.getRandomValues(bytes)}catch(_){return false}
   const owner=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
   let canceled=false,claimed=false,finished=false,timer=null;
   const markReleased=()=>{try{storage.setItem(releasedKey,owner)}catch(_){/* Preserve the claim on storage failure. */}};
   const finishReadOnly=()=>{if(finished)return;finished=true;if(timer!==null)clearTimeout(timer);acquiring=false;if(!closed){status='read_only';notify()}};
   acquiring=true;status='acquiring';Promise.resolve().then(notify);
   // Some older engines can leave IndexedDB requests pending indefinitely.
   // A timed-out request may finish later but is never allowed to become a writer.
   timer=setTimeout(()=>{canceled=true;finishReadOnly()},15000);
   let request;
   try{request=idb.open('amc8-writer-locks-v1',1)}catch(_){finishReadOnly();return true}
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('locks'))request.result.createObjectStore('locks')};
   request.onblocked=()=>{canceled=true;finishReadOnly()};
   request.onerror=()=>finishReadOnly();
   request.onsuccess=()=>{
    const db=request.result;if(canceled||closed){db.close();finishReadOnly();return}
    let tx;
    try{
     tx=db.transaction('locks','readwrite');const store=tx.objectStore('locks'),get=store.get(namespace);
     get.onsuccess=()=>{
      if(canceled||closed)return;
      let marker;try{marker=storage.getItem(releasedKey)}catch(_){tx.abort();return}
      if(!get.result||get.result.owner===marker){store.put({owner},namespace);claimed=true}
     };
     tx.oncomplete=()=>{
      db.close();
      if(!claimed){finishReadOnly();return}
      if(canceled||closed){markReleased();finishReadOnly();return}
      finished=true;if(timer!==null)clearTimeout(timer);acquiring=false;fallbackOwner=owner;
      // Another page may have written since this page read its snapshot.
      try{if(storage.getItem(namespace)!==lastRaw){fallbackOwner=null;markReleased();status='conflict';notify();return}}
      catch(_){fallbackOwner=null;markReleased();status='read_only';notify();return}
      writer=true;status='ready';flush();
     };
     tx.onabort=tx.onerror=()=>{db.close();finishReadOnly()};
    }catch(_){db.close();finishReadOnly()}
   };
   return true;
  }
  function retry(){
   if(closed||status==='conflict')return {ok:false,reason:'CONFLICT_OR_CLOSED'};
   // A failed write remains exportable in `pending`. If this page already
   // owns the lock (for example after a quota error), retry the write. If it
   // does not, acquire normally and let flush recheck the stored baseline
   // under the lock before writing the retained draft.
   if(writer)return pending!==null||backups.length?flush():{ok:true,raw:lastRaw};
   if(acquiring)return {ok:false,reason:'ACQUIRING'};
   try{if(storage.getItem(namespace)!==lastRaw){status='conflict';Promise.resolve().then(notify);return {ok:false,reason:'CONFLICT'}}}
   catch(_){status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'STORAGE_UNAVAILABLE'}}
   if(!nav?.locks?.request){if(acquireFallback())return {ok:false,reason:'ACQUIRING'};status='read_only';Promise.resolve().then(notify);return {ok:false,reason:'LOCK_UNAVAILABLE'}}
   acquiring=true;status='acquiring';Promise.resolve().then(notify);
   Promise.resolve().then(()=>nav.locks.request('amc8-writer:'+namespace,{mode:'exclusive',ifAvailable:true},lock=>{
    acquiring=false;if(!lock||closed){status='read_only';notify();return}
    writer=true;status='ready';flush();return new Promise(resolve=>release=resolve)
   })).catch(()=>{acquiring=false;status='read_only';notify()});
   return {ok:false,reason:'ACQUIRING'};
  }
  if(!test)retry();
  return {commit,backup:(key,raw)=>{backups.push([key,raw]);return writer?flush():{ok:false,reason:'NOT_WRITER',pending:true}},flush,retry,exportSnapshot:()=>({stored:lastRaw,pending}),getStatus:()=>status,close(){flush();closed=true;writer=false;if(fallbackOwner){try{storage.setItem(releasedKey,fallbackOwner)}catch(_){}fallbackOwner=null}release?.()}};
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


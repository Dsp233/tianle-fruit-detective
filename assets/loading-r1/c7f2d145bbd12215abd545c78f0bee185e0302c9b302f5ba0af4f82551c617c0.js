'use strict';
const RIGHT_TASKS={
 'G06.01':{kind:'condition',cards:[{points:[[0,0],[3,0],[0,4]],corner:0,givenAngle:90,rotation:0},{points:[[0,0],[3,0],[1.5,2.598076211353316]],corner:0,givenAngle:60,rotation:0}],context:'先检查已给角条件',prompt:'分别点图中给定角的实际顶点，并描它的两条角边。依据角度条件判断哪张卡能使用直角三角形的平方关系；60°卡也要检查。',explain:'90°卡满足直角条件；60°卡不满足。不能只凭三条边或图画外观套用。',reason:{prompt:'使用三边平方关系前先核对什么？',options:['已知条件中有直角，两条直角边交在该顶点','三角形看起来像直角即可','只要有三条边即可'],answer:0}},
 'G06.02':{kind:'squares',a:3,b:4,c:5,unit:1,rotation:0,context:'搬原单位格作一次面积检验',prompt:'先标实际直角和两条直角边。把两块直角边正方形的每个原单位格移入斜边正方形空槽，再填三块面积。这里只检验这个3、4、5实例。',explain:'9与16个原单位格共25格，恰好铺满5×5正方形；9＋16＝25。这次具体拼合不冒称一般证明。',reason:{prompt:'这次移动怎样检验面积？',options:['原方格身份和面积保留，9格与16格不重叠铺满25格','把3和4相加就是斜边','只填9＋16＝25，不必移动材料'],answer:0}},
 'G06.03':{kind:'solve',a:3,b:4,c:5,unit:1,unknown:'c',rotation:0,context:'由两块已知平方拼未知正方形',prompt:'直角边3、4，斜边未知。标直角和角边，再调试未知正方形边长，把两块已知平方的原方格移进去。全部材料恰好铺满后填写未知边长。',explain:'9＋16＝25，25格正方形每边5格，所以斜边5；不是3＋4＝7。',reason:{prompt:'为什么最后要找正方形边长？',options:['先得到未知边的平方面积，再找对应边长','面积25就说明边长25','两条直角边相加就是斜边'],answer:0}},
 'G06.04':{kind:'axis',A:[1,2],B:[1,6],minX:0,maxX:6,minY:0,maxY:6,context:'从两个实际端点逐单位量距离',prompt:'点实际端点A(1,2)与B(1,6)，从A逐格向上量到B，再填写直线距离。不要把B的纵坐标6当作距离。',explain:'同列距离是6−2＝4格；从A到B实际经过4个单位段。',reason:{prompt:'为什么答案不是6？',options:['距离是两个端点间单位段数，不是终点刻度','纵坐标总是距离','把两个纵坐标相加'],answer:0}},
 'G06.05':{kind:'diagonal',A:[0,0],B:[3,4],minX:0,maxX:6,minY:0,maxY:6,a:3,b:4,c:5,unit:1,unknown:'c',rotation:0,context:'在网格构造直角再求直线距离',prompt:'点A(0,0)、B(3,4)，再选一个网格直角拐点，连接三点。逐格量两条直角边，再用原平方格拼斜边正方形，填写AB直线距离；沿格线绕路的长度另算。',explain:'两条直角边3和4，直线AB为5；沿格线绕路是7，两种长度不同。',reason:{prompt:'直线距离与沿格线绕路有什么区别？',options:['直线是斜边，用两条垂直位移的平方求；绕路才相加','两种长度都为3＋4','把两个坐标直接拼成34'],answer:0}}
};
for(const [skillId,t] of Object.entries(RIGHT_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:49,mode:'rightLab',phase:'练',hint:'先核对直角条件。面积用原材料拼合，边长与面积分开；坐标距离从实际端点逐单位量。'});
if(typeof module!=='undefined')module.exports={RIGHT_TASKS};

'use strict';
const RIGHT_CASES={
 'G06.01':[
  [{kind:'condition',cards:[{points:[[4,0],[0,0],[0,3]],corner:1,givenAngle:90,rotation:90},{points:[[0,0],[3,0],[-1.5,2.598076211353316]],corner:0,givenAngle:120,rotation:30}],context:'旋转和钝角反例'},'分别标给定角顶点与两条实际角边；一图旋转后给90°，另一图给120°。判断各图能否用直角三角形平方关系。','旋转90°卡仍满足；120°卡不满足。','方向和直角顶点改变，并加入钝角反例'],
  [{kind:'condition',cards:[{points:[[0,0],[3,0],[0,4]],corner:0,givenAngle:90,rotation:45}],context:'独立斜向直角图'},'独立在转45°的图中标给定90°角及两条角边，再判断平方关系能否使用。','直角条件明确，斜向不改变直角。','无提示：坐标轴不再与角边平行'],
  [{kind:'condition',cards:[{points:[[0,0],[3,0],[1.5,2.598076211353316]],corner:0,givenAngle:60,rotation:90},{points:[[3,0],[0,4],[0,0]],corner:2,givenAngle:90,rotation:180}],context:'隔日非直角与另一个直角顶点'},'隔日分别点给定60°和90°角的顶点、描两条实际角边，再判断各自的适用条件。','60°不满足；90°满足，不按上下位置猜。','隔日：先出现反例，直角换到C'],
  [{kind:'condition',cards:[{points:[[0,0],[3,0],[0,4]],corner:0,givenAngle:90,rotation:180},{points:[[4,0],[0,0],[0,3]],corner:1,givenAngle:90,rotation:270}],context:'备用两张转向图'},'独立检查两张转向后的90°图，分别标给定角顶点与两条角边，再判断是否满足。','两图都满足，顶点和方向可不同。','备用：两种直角顶点与转向']
 ],
 'G06.02':[
  [{kind:'squares',a:1.5,b:2,c:2.5,unit:.5,rotation:0,context:'单位格边长换成半厘米'},'直角边1.5、2厘米，每个原方格边长0.5厘米。标直角与角边，把两块平方原格移入斜边平方，再填三块实际面积。','9格×0.25＝2.25；16格×0.25＝4；25格×0.25＝6.25平方厘米。','单位格变0.5厘米，格数与实际面积分开'],
  [{kind:'squares',a:4,b:3,c:5,unit:1,rotation:180,context:'独立交换两边并转向'},'独立标直角和角边，将4边与3边正方形的原方格拼入5边正方形，再填三块面积。','16＋9＝25平方单位。','无提示：长短边和方向交换'],
  [{kind:'squares',a:3,b:4,c:5,unit:1,rotation:90,context:'隔日旋转拼合'},'隔日标旋转图的直角与角边，实际搬3边和4边正方形原格铺满5边正方形，填三块面积。','9＋16＝25；这里只检验具体拼合。','隔日：另一个图向，原格身份继续保留'],
  [{kind:'squares',a:6,b:8,c:10,unit:2,rotation:0,context:'备用2厘米方格'},'独立用边长2厘米的原格操作6、8、10厘米三边平方：标直角、描角边、搬格并填实际面积。','每格4平方厘米，36＋64＝100平方厘米。','备用：单位格变2厘米，不能直接把格数当面积']
 ],
 'G06.03':[
  [{kind:'solve',a:6,b:8,c:10,unit:2,unknown:'c',rotation:0,context:'梯子、墙与地面'},'墙与地面垂直；梯脚距墙6米，梯顶高8米，每格边2米。标直角和角边，用两块已知平方的原格试拼未知平方，填写梯长。','梯长10米，6²＋8²＝10²。','三角形边长题改梯子情境，先核对墙地垂直'],
  [{kind:'solve',a:3,b:4,c:5,unit:1,unknown:'a',rotation:90,context:'独立由斜边求短直角边'},'独立求一条未知直角边，另一条4、斜边5。标直角角边，将斜边平方原格先铺已知直角边平方，剩下原格拼未知平方并填边长。','25−16＝9，未知边3。','无提示：求斜边改求直角边，先扣已知平方'],
  [{kind:'solve',a:3,b:4,c:5,unit:1,unknown:'b',rotation:180,context:'隔日另一条直角边'},'隔日给斜边5、一条直角边3。标直角角边，把斜边平方原格先铺已知平方，再用剩余格拼未知平方，填另一条边。','25−9＝16，未知边4。','隔日：未知边换另一边，面积由加改减'],
  [{kind:'solve',a:1.5,b:2,c:2.5,unit:.5,unknown:'c',rotation:270,context:'备用半单位材料'},'独立给直角边1.5、2，每个方格边0.5。标直角角边，用原格拼未知平方，填实际斜边长度。','未知平方6.25，边长2.5；不是25格就边25。','备用：非整数实际边长与半单位格']
 ],
 'G06.04':[
  [{kind:'axis',A:[2,3],B:[6,3],minX:0,maxX:6,minY:0,maxY:5,context:'同一横排的站点'},'一条横向路线，站点A(2,3)、B(6,3)。点实际端点并从A逐格量到B，填写距离。','同排距离6−2＝4格。','同列改同行，变化坐标轴改变'],
  [{kind:'axis',A:[6,1],B:[2,1],minX:0,maxX:6,minY:0,maxY:5,context:'独立反向测量'},'独立点A(6,1)、B(2,1)，从A向左逐格量到B，填写距离。','距离为4格，是正长度。','无提示：终点坐标较小，方向反转'],
  [{kind:'axis',A:[-2,2],B:[3,2],minX:-3,maxX:4,minY:0,maxY:4,context:'隔日跨零点'},'隔日点A(-2,2)、B(3,2)，实际跨0逐格量到B，再填写距离。','3−(-2)＝5格。','隔日：跨过坐标零点'],
  [{kind:'axis',A:[3,5],B:[3,2],minX:0,maxX:6,minY:0,maxY:6,context:'备用向下测量'},'独立点A(3,5)、B(3,2)，从A逐格向下量到B，填写距离。','同列距离3格。','备用：向下量且两端都非零']
 ],
 'G06.05':[
  [{kind:'diagonal',A:[1,1],B:[4,5],minX:0,maxX:6,minY:0,maxY:6,a:3,b:4,c:5,unit:1,unknown:'c',rotation:0,context:'近路与沿街路线'},'两站A(1,1)、B(4,5)。点实际端点、选垂直拐点并连接；量两条沿街边，再拼未知平方，填写两站直线近路长度。','沿街3＋4＝7，直线近路5。','非零起点与路线情境，区分直线和沿街'],
  [{kind:'diagonal',A:[4,1],B:[1,5],minX:0,maxX:6,minY:0,maxY:6,a:3,b:4,c:5,unit:1,unknown:'c',rotation:0,context:'独立向左上方'},'独立点A(4,1)、B(1,5)，选一个实际垂直拐点连接并量两边，用原格拼未知平方，填写AB直线距离。','水平位移长3、竖直长4，直线距离5。','无提示：水平位移为负，长度仍正'],
  [{kind:'diagonal',A:[-2,-1],B:[1,3],minX:-3,maxX:4,minY:-2,maxY:4,a:3,b:4,c:5,unit:1,unknown:'c',rotation:0,context:'隔日跨两轴'},'隔日点A(-2,-1)、B(1,3)，选网格直角拐点并连接，量两条直角边，再拼未知平方填写直线距离。','跨轴位移长度3与4，直线距离5。','隔日：两个坐标从负到正'],
  [{kind:'diagonal',A:[1,4],B:[5,1],minX:0,maxX:6,minY:0,maxY:6,a:4,b:3,c:5,unit:1,unknown:'c',rotation:0,context:'备用向右下方'},'独立点A(1,4)、B(5,1)，选实际直角拐点连接并量两边，搬原格拼未知平方填写直线距离。','水平长4、竖直长3，直线距离5。','备用：长短边交换，纵向反转']
 ]
};
const rightStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(RIGHT_CASES)){
 if(cases.length!==4)throw Error('Four G06 cases required: '+skillId);rightStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];rightStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:50,mode:'rightLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,contentVersion:skillId==='G06.03'&&i===0?71:50,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'核对直角；保留原格拼平方，先比较面积再找边长。网格从实际端点量，不把绕路当直线。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={RIGHT_CASES};

'use strict';
function rightState(task){return draft.work??(draft.work={cards:(task.cards||[{}]).map(()=>({marked:-1,arms:[],choice:''})),size:task.kind==='squares'?task.c/task.unit:1,placed:{},selected:'',areas:{a:0,b:0,c:0},answer:0,active:'A',ends:{},corner:null,connected:false,path:[],legs:[[],[]],moves:0,log:[]})}
function rightRotate(points,rotation){const a=(rotation||0)*Math.PI/180;return points.map(([x,y])=>[x*Math.cos(a)-y*Math.sin(a),x*Math.sin(a)+y*Math.cos(a)])}
function rightTriangle(task){return rightRotate([[0,0],[task.a,0],[0,task.b]],task.rotation)}
function rightIsCorner(points,index){const p=points[index],q=points[(index+1)%3],r=points[(index+2)%3],u=q.map((v,k)=>v-p[k]),v=r.map((n,k)=>n-p[k]);return Math.hypot(...u)>0&&Math.hypot(...v)>0&&Math.abs(u[0]*v[0]+u[1]*v[1])<1e-9}
function rightSquare(points,edge){const p=points[edge],q=points[(edge+1)%3],signed=points.reduce((n,a,i)=>{const b=points[(i+1)%3];return n+a[0]*b[1]-a[1]*b[0]},0),d=q.map((v,k)=>v-p[k]),out=signed>0?[d[1],-d[0]]:[-d[1],d[0]];return [p,q,q.map((v,k)=>v+out[k]),p.map((v,k)=>v+out[k])]}
function rightSquareCell(points,edge,unit,r,c){const ps=rightSquare(points,edge),p=ps[0],len=Math.hypot(ps[1][0]-p[0],ps[1][1]-p[1]),u=ps[1].map((v,k)=>(v-p[k])/len),v=ps[3].map((n,k)=>(n-p[k])/len),point=(row,col)=>p.map((n,k)=>n+unit*(col*u[k]+row*v[k]));return [point(r,c),point(r,c+1),point(r+1,c+1),point(r+1,c)]}
function rightMaterial(task){if(!task.a)return [];const keys=task.unknown&&task.unknown!=='c'?['c']:['a','b'];return keys.flatMap(key=>{const n=task[key]/task.unit;return Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>({id:`${key}-${r}-${c}`,key,r,c}))).flat()})}
function rightDeduct(task){return task.unknown&&task.unknown!=='c'?task[task.unknown==='a'?'b':'a']/task.unit:0}
function rightLegs(task,w){return w.ends.A&&w.ends.B&&w.corner?[[w.ends.A,w.corner],[w.corner,w.ends.B]]:[]}
function rightUnits(p,q){if(p[0]!==q[0]&&p[1]!==q[1])return [];const n=Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1]),dx=Math.sign(q[0]-p[0]),dy=Math.sign(q[1]-p[1]);return Array.from({length:n},(_,i)=>({from:[p[0]+dx*i,p[1]+dy*i],to:[p[0]+dx*(i+1),p[1]+dy*(i+1)]}))}
function rightConditionFigure(card,w,index){const ps=rightRotate(card.points,card.rotation),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2,screen=ps.map(([x,y])=>[150+(x-cx)*38,140-(y-cy)*38]),p=screen[card.corner],others=[screen[(card.corner+1)%3],screen[(card.corner+2)%3]],u=others[0].map((v,k)=>(v-p[k])/Math.hypot(...others[0].map((x,j)=>x-p[j]))),v=others[1].map((x,k)=>(x-p[k])/Math.hypot(...others[1].map((x,j)=>x-p[j]))),mark=card.givenAngle===90?`<path d="M${p.map((n,k)=>n+u[k]*15).join(' ')}L${p.map((n,k)=>n+(u[k]+v[k])*15).join(' ')}L${p.map((n,k)=>n+v[k]*15).join(' ')}" fill="none" stroke="#c26a38" stroke-width="3"/>`:'';
 return `<div class="right-condition-canvas"><svg viewBox="0 0 300 280" role="img" aria-label="给定角${card.givenAngle}度的三角形"><path d="M${screen.map(p=>p.join(' ')).join('L')}Z" fill="#e6efe3" stroke="#658d77" stroke-width="2"/>${w.arms.map(i=>`<path d="M${screen[i].join(' ')}L${screen[(i+1)%3].join(' ')}" stroke="#277e99" stroke-width="6"/>`).join('')}${mark}<text x="${p[0]+20}" y="${p[1]-20}" font-size="16">给定${card.givenAngle}°</text></svg>${screen.map((p,i)=>`<button class="right-vertex" style="left:${p[0]/3}%;top:${p[1]/2.8}%" data-action="rightPick" data-card="${index}" data-index="${i}" aria-pressed="${w.marked===i}" aria-label="标图${index+1}顶点${String.fromCharCode(65+i)}的角">${String.fromCharCode(65+i)}</button>`).join('')}</div>`}
function rightMarks(task,w){const cards=task.cards||[{points:[[0,0],[task.a,0],[0,task.b]],corner:0,givenAngle:90,rotation:task.rotation}];return cards.map((card,i)=>`<section><b>${task.kind==='condition'?'条件卡'+(i+1):'直角与边长条件'}</b>${rightConditionFigure(card,w.cards[i],i)}<div class="work-buttons">${['AB','BC','CA'].map((edge,k)=>`<button data-action="rightEdge" data-card="${i}" data-index="${k}" aria-pressed="${w.cards[i].arms.includes(k)}">描实际${edge}边</button>`).join('')}${task.kind==='condition'?['yes','no'].map(value=>`<button data-action="rightChoice" data-card="${i}" data-value="${value}" aria-pressed="${w.cards[i].choice===value}">${value==='yes'?'满足直角条件':'不满足直角条件'}</button>`).join(''):''}</div></section>`).join('')}
function rightModel(task,w){const triangle=rightTriangle(task),edgeFor={a:0,c:1,b:2},shown=['a','b','c'].filter(key=>task.kind==='squares'||key!==task.unknown),polys=shown.map(key=>rightSquare(triangle,edgeFor[key])),all=[...triangle,...polys.flat()],minX=Math.min(...all.map(p=>p[0]))-task.unit,minY=Math.min(...all.map(p=>p[1]))-task.unit,maxX=Math.max(...all.map(p=>p[0]))+task.unit,maxY=Math.max(...all.map(p=>p[1]))+task.unit,project=p=>[(p[0]-minX)*36/task.unit,(maxY-p[1])*36/task.unit],draw=ps=>'M'+ps.map(p=>project(p).join(' ')).join('L')+'Z',materials=rightMaterial(task);
 const squares=shown.map(key=>{const edge=edgeFor[key],n=task[key]/task.unit;return `<path d="${draw(rightSquare(triangle,edge))}" fill="#f1f4ed" stroke="#82957e"/>${Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const id=`${key}-${r}-${c}`,source=materials.some(t=>t.id===id),zone=key==='c'?'target':'deduct',placed=Object.entries(w.placed).find(([,p])=>p.zone===zone&&p.r===r&&p.c===c),filled=source?!w.placed[id]:!!placed;return `<path data-square-cell="${id}" ${source?`data-material-id="${id}"`:placed?`data-material-id="${placed[0]}"`:''} d="${draw(rightSquareCell(triangle,edge,task.unit,r,c))}" fill="${filled?((source?key:placed?.[0]?.[0])==='b'?'#eab260':'#87b99a'):'#ffffff'}" stroke="#a4b4a1" stroke-width="0.8"/>`}).join('')).join('')}`}).join('');
 return `<svg class="right-model" viewBox="0 0 ${(maxX-minX)*36/task.unit} ${(maxY-minY)*36/task.unit}" role="img" aria-label="三边平方示意，原材料移动后原位置留空"><path d="${draw(triangle)}" fill="#e4edee" stroke="#376f83" stroke-width="2"/>${squares}</svg>`}
function rightPuzzle(task,w){const materials=rightMaterial(task),groups=[...new Set(materials.map(t=>t.key))],deduct=rightDeduct(task),grid=(zone,n)=>`<div class="right-tiles" style="--right-cols:${n}" aria-label="${zone==='target'?'试拼未知或斜边平方':'先扣已知直角边平方'}${n}行${n}列">${Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>{const entry=Object.entries(w.placed).find(([,p])=>p.zone===zone&&p.r===r&&p.c===c);return `<button class="right-tile ${entry?'filled '+entry[0][0]:''}" data-action="rightSlot" data-zone="${zone}" data-row="${r}" data-col="${c}" ${entry?`data-material-id="${entry[0]}"`:''} aria-label="${zone==='target'?'目标':'扣去'}平方第${r+1}行第${c+1}列${entry?'，原材料'+entry[0]:'空槽'}">${entry?'■':'空槽'}</button>`}).join('')).join('')}</div>`;
 return `${rightModel(task,w)}<p>每格边长${task.unit}，面积${task.unit**2}平方单位。点一块仍在原处的材料，再点空槽；点已放格可取回。原格身份随移动保存。</p><div class="right-puzzle-groups">${groups.map(key=>{const n=task[key]/task.unit;return `<section><b>已知${key==='c'?'斜边':key==='a'?'第一直角边':'第二直角边'}平方 · 边${task[key]}</b><div class="right-tiles" style="--right-cols:${n}">${materials.filter(t=>t.key===key).map(t=>`<button class="right-tile ${key} ${w.selected===t.id?'selected':''}" data-action="rightTile" data-id="${t.id}" data-material-id="${t.id}" aria-label="原材料${t.id}${w.placed[t.id]?'已移出':''}" aria-pressed="${w.selected===t.id}" ${w.placed[t.id]?'disabled':''}>${w.placed[t.id]?'已移':'■'}</button>`).join('')}</div></section>`}).join('')}${deduct?`<section><b>先铺已知直角边平方</b>${grid('deduct',deduct)}</section>`:''}<section><b>${task.kind==='squares'?'斜边正方形':'试拼未知正方形'}</b>${task.kind==='squares'?'':`<div class="work-buttons"><button data-action="rightSize" data-delta="-1" ${w.size<=1?'disabled':''}>边长少1格</button><span>试拼每边${w.size}格，实际边长${w.size*task.unit}</span><button data-action="rightSize" data-delta="1" ${w.size>=8?'disabled':''}>边长多1格</button></div>`}${grid('target',w.size)}</section></div>${task.kind==='squares'?['a','b','c'].map(key=>rightAmount(w,key,`我填${key==='c'?'斜边':key==='a'?'第一直角边':'第二直角边'}平方面积`)).join(''):rightAmount(w,'answer','我填未知边/直线距离')}`;
}
function rightAmount(w,key,label){const value=key==='answer'?w.answer:w.areas[key];return `<div class="work-buttons"><b>${label} ${value}</b>${[-1,-.25,.25,1,5,10].map(delta=>`<button data-action="rightAmount" data-key="${key}" data-delta="${delta}" ${value+delta<0||value+delta>100?'disabled':''}>${delta>0?'＋':'－'}${Math.abs(delta)}</button>`).join('')}</div>`}
function rightGrid(task,w){const cols=task.maxX-task.minX+1,rows=task.maxY-task.minY+1,point=p=>[(p[0]-task.minX+.5)*44,(task.maxY-p[1]+.5)*44],line=ps=>`M${ps.map(p=>point(p).join(' ')).join('L')}`,legs=rightLegs(task,w),right=legs.length===2&&rightIsCorner([w.corner,w.ends.A,w.ends.B],0);
 const drawn=task.kind==='axis'&&w.path.length>1?`<path d="${line(w.path)}" stroke="#247b97" stroke-width="6"/>`:task.kind==='diagonal'&&w.connected?`<path d="${line([w.ends.A,w.corner,w.ends.B,w.ends.A])}" stroke="#ad8c51" stroke-width="2"/>${w.legs.map(entries=>entries.map(e=>`<path d="${line([e.from,e.to])}" stroke="#247b97" stroke-width="6"/>`).join('')).join('')}${right?(()=>{const p=point(w.corner),a=point(w.ends.A).map((v,k)=>Math.sign(v-p[k])*12),b=point(w.ends.B).map((v,k)=>Math.sign(v-p[k])*12);return `<path d="M${p.map((v,k)=>v+a[k]).join(' ')}L${p.map((v,k)=>v+a[k]+b[k]).join(' ')}L${p.map((v,k)=>v+b[k]).join(' ')}" stroke="#c47d3b" stroke-width="3"/>`})():''}`:'';
 return `<div class="work-buttons">${(task.kind==='axis'?['A','B']:['A','B','C']).map(role=>`<button data-action="rightActive" data-value="${role}" aria-pressed="${w.active===role}">点${role==='C'?'直角拐点C':'端点'+role}</button>`).join('')}${task.kind==='diagonal'?`<button data-action="rightJoin" ${w.ends.A&&w.ends.B&&w.corner?'':'disabled'}>连接实际三点</button>`:''}</div><div class="right-grid-scroll"><div class="right-coordinate-grid" style="--right-cols:${cols}"><svg viewBox="0 0 ${cols*44} ${rows*44}" aria-hidden="true">${drawn}</svg>${Array.from({length:rows},(_,i)=>task.maxY-i).map(y=>Array.from({length:cols},(_,i)=>task.minX+i).map(x=>{const given=[['A',task.A],['B',task.B]].filter(([,p])=>p[0]===x&&p[1]===y).map(([name])=>name),chosen=Object.entries(w.ends).filter(([,p])=>p[0]===x&&p[1]===y).map(([name])=>name);if(w.corner?.[0]===x&&w.corner[1]===y)chosen.push('C');return `<button data-action="rightPoint" data-x="${x}" data-y="${y}" aria-label="横${x}纵${y}${given.length?'，给定'+given.join('、'):''}" aria-pressed="${chosen.length>0}"><b>${[...new Set([...given,...chosen])].join('')||'·'}</b><small>${x},${y}</small></button>`}).join('')).join('')}</div></div>${task.kind==='axis'?`<div class="work-buttons">${[['左',-1,0],['右',1,0],['下',0,-1],['上',0,1]].map(([name,dx,dy])=>`<button data-action="rightStep" data-dx="${dx}" data-dy="${dy}">${name}量1格</button>`).join('')}</div><p>从所选A实际量${Math.max(0,w.path.length-1)}格。</p>`:`<div class="work-buttons">${[0,1].map(index=>`<button data-action="rightMeasure" data-index="${index}" ${w.connected?'':'disabled'}>第${index+1}条直角边再量1格</button>`).join('')}</div><p>两条实际边已量${w.legs[0].length}与${w.legs[1].length}格；沿这条折线路径共${w.legs[0].length+w.legs[1].length}格，直线距离另填。</p>`}`;
}
function rightBoard(task){const w=rightState(task),undo=`<button data-action="rightUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button>`;return `<div class="board right-board"><h3>${esc(task.context)}</h3><div class="work-buttons">${undo}</div>${task.kind==='condition'?rightMarks(task,w):task.kind==='axis'?rightGrid(task,w)+rightAmount(w,'answer','我填距离'):task.kind==='diagonal'?rightGrid(task,w)+rightPuzzle(task,w):rightMarks(task,w)+rightPuzzle(task,w)}</div>`}
function rightMarksOk(task,w){const cards=task.cards||[{points:[[0,0],[task.a,0],[0,task.b]],corner:0}];return cards.every((card,i)=>{const s=w.cards[i],expected=[card.corner,(card.corner+2)%3];return s.marked===card.corner&&s.arms.length===2&&expected.every(e=>s.arms.includes(e))&&(task.kind!=='condition'||s.choice===(rightIsCorner(card.points,card.corner)?'yes':'no'))})}
function rightPuzzleOk(task,w){const materials=rightMaterial(task),deduct=rightDeduct(task),expected=task.kind==='squares'?task.c/task.unit:task[task.unknown]/task.unit,entries=Object.entries(w.placed);if(w.size!==expected||entries.length!==materials.length)return false;const allowed=new Set(materials.map(t=>t.id)),slots=new Set();for(const [id,p] of entries){const n=p.zone==='target'?w.size:p.zone==='deduct'?deduct:0;if(!allowed.has(id)||!Number.isInteger(p.r)||!Number.isInteger(p.c)||p.r<0||p.c<0||p.r>=n||p.c>=n)return false;slots.add(`${p.zone}-${p.r}-${p.c}`)}return slots.size===materials.length&&entries.filter(([,p])=>p.zone==='target').length===expected**2&&entries.filter(([,p])=>p.zone==='deduct').length===deduct**2}
function rightGrade(task){const w=rightState(task),same=(a,b)=>a?.length===b?.length&&a.every((v,i)=>v===b[i]);let ok=false;
 if(task.kind==='condition')ok=rightMarksOk(task,w);
 if(task.kind==='squares')ok=rightMarksOk(task,w)&&rightPuzzleOk(task,w)&&['a','b','c'].every(k=>w.areas[k]===task[k]**2);
 if(task.kind==='solve')ok=rightMarksOk(task,w)&&rightPuzzleOk(task,w)&&w.answer===task[task.unknown];
 if(task.kind==='axis'){const count=Math.abs(task.A[0]-task.B[0])+Math.abs(task.A[1]-task.B[1]);ok=same(w.ends.A,task.A)&&same(w.ends.B,task.B)&&same(w.path[0],task.A)&&same(w.path.at(-1),task.B)&&w.path.length===count+1&&w.answer===count&&w.path.every((p,i)=>!i||Math.abs(p[0]-w.path[i-1][0])+Math.abs(p[1]-w.path[i-1][1])===1)}
 if(task.kind==='diagonal'){const legs=rightLegs(task,w);ok=same(w.ends.A,task.A)&&same(w.ends.B,task.B)&&w.connected&&legs.length===2&&rightIsCorner([w.corner,w.ends.A,w.ends.B],0)&&legs.every(([p,q],i)=>{const units=rightUnits(p,q);return units.length>0&&units.length===w.legs[i].length&&JSON.stringify(units)===JSON.stringify(w.legs[i])})&&rightPuzzleOk(task,w)&&w.answer===task.c}
 return {ok,incomplete:w.moves===0,reason:task.kind==='condition'?'先核对给定角与两条角边，只有直角满足该条件。':'原方格不能复制或丢失；先检验平方面积再找边长。网格需核对实际端点和完整单位段，直线与绕路长度分别计算。'};
}
function rightAct(action,data,task){const w=rightState(task),before=JSON.stringify({...w,log:[]}),index=Number(data.index),card=Number(data.card),delta=Number(data.delta);let changed=false;
 if(['rightPick','rightEdge','rightChoice'].includes(action)&&task.kind!=='axis'&&task.kind!=='diagonal'&&Number.isInteger(card)&&card>=0&&card<w.cards.length){const s=w.cards[card];if(action==='rightPick'&&Number.isInteger(index)&&index>=0&&index<3){s.marked=index;changed=true}if(action==='rightEdge'&&Number.isInteger(index)&&index>=0&&index<3){const at=s.arms.indexOf(index);at<0?s.arms.push(index):s.arms.splice(at,1);changed=true}if(action==='rightChoice'&&task.kind==='condition'&&['yes','no'].includes(data.value)){s.choice=data.value;changed=true}}
 if(action==='rightTile'&&rightMaterial(task).some(t=>t.id===data.id)&&!w.placed[data.id]){w.selected=w.selected===data.id?'':data.id;changed=true}
 if(action==='rightSlot'&&['squares','solve','diagonal'].includes(task.kind)){const r=Number(data.row),c=Number(data.col),zone=data.zone,n=zone==='target'?w.size:zone==='deduct'?rightDeduct(task):0;if(Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&r<n&&c>=0&&c<n){const at=Object.entries(w.placed).find(([,p])=>p.zone===zone&&p.r===r&&p.c===c);if(at){delete w.placed[at[0]];w.selected=at[0];changed=true}else if(w.selected&&!w.placed[w.selected]){w.placed[w.selected]={zone,r,c};w.selected='';changed=true}}}
 if(action==='rightSize'&&['solve','diagonal'].includes(task.kind)&&[-1,1].includes(delta)&&w.size+delta>=1&&w.size+delta<=8){w.size+=delta;w.placed=Object.fromEntries(Object.entries(w.placed).filter(([,p])=>p.zone==='deduct'));changed=true}
 if(action==='rightAmount'&&['answer','a','b','c'].includes(data.key)&&[-1,-.25,.25,1,5,10].includes(delta)){const value=data.key==='answer'?w.answer:w.areas[data.key];if(value+delta>=0&&value+delta<=100){if(data.key==='answer')w.answer+=delta;else w.areas[data.key]+=delta;changed=true}}
 if(action==='rightActive'&&['axis','diagonal'].includes(task.kind)&&(task.kind==='axis'?['A','B']:['A','B','C']).includes(data.value)){w.active=data.value;changed=true}
 if(action==='rightPoint'&&['axis','diagonal'].includes(task.kind)){const x=Number(data.x),y=Number(data.y);if(Number.isInteger(x)&&Number.isInteger(y)&&x>=task.minX&&x<=task.maxX&&y>=task.minY&&y<=task.maxY){w.active==='C'?w.corner=[x,y]:w.ends[w.active]=[x,y];w.path=w.ends.A?[[...w.ends.A]]:[];w.connected=false;w.legs=[[],[]];w.placed={};changed=true}}
 if(action==='rightStep'&&task.kind==='axis'&&w.ends.A&&w.ends.B&&w.path.length<64){const dx=Number(data.dx),dy=Number(data.dy),p=w.path.at(-1),q=[p[0]+dx,p[1]+dy];if(Number.isInteger(dx)&&Number.isInteger(dy)&&Math.abs(dx)+Math.abs(dy)===1&&q[0]>=task.minX&&q[0]<=task.maxX&&q[1]>=task.minY&&q[1]<=task.maxY){w.path.push(q);changed=true}}
 if(action==='rightJoin'&&task.kind==='diagonal'&&w.ends.A&&w.ends.B&&w.corner){w.connected=true;w.legs=[[],[]];changed=true}
 if(action==='rightMeasure'&&task.kind==='diagonal'&&w.connected&&[0,1].includes(index)){const leg=rightLegs(task,w)[index],units=rightUnits(...leg);if(w.legs[index].length<units.length){w.legs[index].push(units[w.legs[index].length]);changed=true}}
 if(action==='rightUndo'&&w.log.length){const log=w.log,snapshot=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,snapshot,{log,moves});return true}
 if(changed){w.log.push(before);w.moves++;return true}return false;
}
function rightSpeech(task){const w=rightState(task);if(task.kind==='condition')return w.cards.map((s,i)=>`图${i+1}给定${task.cards[i].givenAngle}度，已标${s.marked<0?'无':String.fromCharCode(65+s.marked)}角，已描边${s.arms.map(k=>['AB','BC','CA'][k]).join('、')||'无'}，判断${s.choice==='yes'?'满足':s.choice==='no'?'不满足':'未选'}`).join('；');const grid=['axis','diagonal'].includes(task.kind)?`已选A${w.ends.A?.join(',')||'无'}，B${w.ends.B?.join(',')||'无'}，拐点${w.corner?.join(',')||'无'}；已量${task.kind==='axis'?Math.max(0,w.path.length-1):w.legs.map(a=>a.length).join('和')}格。`:'';return grid+(task.a?`已搬${Object.keys(w.placed).length}块原格，试拼平方每边${w.size}格、实际${w.size*task.unit}。`:'')+(task.kind==='squares'?`填写面积${w.areas.a}、${w.areas.b}、${w.areas.c}。`:`填写长度${w.answer}。`)}
function rightPage(){const task=RIGHT_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 直角、平方与距离</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${rightBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>先检查直角，再分清量</h3><p class="muted">具体平方拼合只检验当前实例。面积用平方单位，边长用长度单位。直线与沿网格折线的长度分别计算，每一步可撤回。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={rightRotate,rightTriangle,rightIsCorner,rightSquare,rightSquareCell,rightMaterial,rightUnits};

'use strict';
function solidBoxCells(x,y,z){return Array.from({length:z},(_,k)=>Array.from({length:y},(_,j)=>Array.from({length:x},(_,i)=>[i,j,k])).flat()).flat()}
const SOLID_NETS={cross:[[0,0],[1,0],[-1,0],[0,1],[0,-1],[0,2]],row:[[0,0],[1,0],[2,0],[3,0],[1,1],[1,-1]],stair:[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2]],strip:[[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]],rectangle:[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]};
const SOLID_TASKS={
 'G07.01':{kind:'counts',nets:[SOLID_NETS.cross],context:'从平面纸片折成盒子再数对象',prompt:'实际逐面折起六面纸片，转动并翻面检查隐藏面。分别点选立体中的每个面、每条边和每个顶点，填写三种对象的个数；重合的同一条边只数一次。',explain:'六个面合拢后，共12条不同边、8个不同顶点；纸片上重复的边/顶点要按折后位置去重。',reason:{prompt:'为什么不能把每面四条边直接乘6？',options:['折后相邻面共用同一条边，应按实际位置去重','六乘四就是不同边数','每个点都单独属于一个面'],answer:0}},
 'G07.02':{kind:'match',nets:[SOLID_NETS.cross],context:'同一标记在展开与合拢中保持',prompt:'实际逐面折起并转动/翻面检查六个面。依次点展开图的一面，再点合拢图中同一原面，连接全部六对。字母和图案是稳定身份。',explain:'折叠改变位置和朝向，不改变面身份；A到F各面在背面也仍存在。',reason:{prompt:'面到了背后，身份会怎样？',options:['身份保留，转动可找出同一图案的面','背面会被另一个面替换','只配当前正面的三面即可'],answer:0}},
 'G07.03':{kind:'valid',nets:[SOLID_NETS.cross,SOLID_NETS.strip],context:'实际试折并检查重合',prompt:'两张六面纸片都逐面试折到90°。转动/翻面检查折后位置，再判断各图能否成为立方体；非法图要依据面重合或连接冲突。',explain:'十字网六个面到六种朝向；六面直条折后A与E、B与F重合，不能成为立方体。',reason:{prompt:'如何判断非法网？',options:['核对全部折后位置、方向与原连接是否一致，找重合/冲突','只看纸片是否好看','有六个正方形就必然有效'],answer:0}},
 'G07.04':{kind:'opposite',nets:[SOLID_NETS.cross],asked:['A','B'],context:'用折后方向判断相对面',prompt:'实际折起六面，转动并翻面查看隐藏面。先点指定面A，再点与A相对的原面；同样找B的相对面。相对面不共用边。',explain:'此网A与F相对，B与C相对。依据折后反向法向及不同位置判断，不凭平面图上下猜。',reason:{prompt:'相对面的空间关系是什么？',options:['在盒子两侧，方向相反且不共用边','纸片上相邻一定相对','在画面上左右两边就一定相对'],answer:0}},
 'G07.05':{kind:'volume',solids:[{cells:solidBoxCells(2,2,2),title:'2×2×2盒内单位块'}],unit:1,context:'按层实际堆单位立方体',prompt:'每个小立方体边长1厘米。逐层点格堆满2×2×2目标，转动/翻面检查隐藏层，再填写体积并选择量的单位。',explain:'8个单位立方体共8立方厘米；体积计空间块，不计外面的方片。',reason:{prompt:'体积在这次操作中数什么？',options:['不重叠占据空间的单位立方体，每块1立方厘米','只数看见的外面','把边长相加'],answer:0}},
 'G07.06':{kind:'surface',solids:[{cells:solidBoxCells(2,2,2),title:'2×2×2立方体'}],unit:1,context:'实际选外表面的单位方片',prompt:'逐层堆满边长1厘米的单位块，再转动并翻面检查全部方向。选择各块实际露在外面的方片，填表面积与单位；块之间贴合的内部方片不计。',explain:'外表面共24个单位方片，24平方厘米。8块体积是8立方厘米，不是表面积。',reason:{prompt:'相邻小块贴合处的两张方片怎样算？',options:['在内部，两张都不计入外表面积','每张都算外表面','只算其中一张'],answer:0}}
};
for(const [skillId,t] of Object.entries(SOLID_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:51,mode:'solidLab',phase:'练',hint:'逐面折到90°，转动/翻面查看背面；稳定面身份不变。体积数单位块，表面积只选实际外露单位方片。'});
if(typeof module!=='undefined')module.exports={SOLID_TASKS,SOLID_NETS,solidBoxCells};

'use strict';
const solidSource=typeof module!=='undefined'?require('./solid'):{SOLID_NETS,solidBoxCells},solidNets=solidSource.SOLID_NETS,solidBox=solidSource.solidBoxCells;
const SOLID_CASES={
 'G07.01':[
  [{kind:'counts',nets:[solidNets.row],context:'换有效纸网的对象去重'},'这次换成长条带上下两片的纸网。实际逐面折起，转动和翻面，再点出全部不同面、边、顶点并填个数。','换纸网仍为立方体：6面、12边、8顶点。','十字网改为另一种有效网，检查折后共用对象'],
  [{kind:'counts',nets:[solidNets.stair],context:'独立阶梯纸网'},'独立将阶梯纸网逐面折起，转动翻面后选全不同面、边、顶点，再填个数。','6、12、8，按合拢位置去重。','无提示：阶梯式有效网'],
  [{kind:'counts',nets:[solidNets.cross.map(([x,y])=>[-y,x])],context:'隔日转向纸网'},'隔日把转向的六面网实际折起。查看背面后点全部面边顶点并填个数，不把纸上重复端点当不同顶点。','6面、12边、8顶点。','隔日：纸网转90°，稳定ID保留'],
  [{kind:'counts',nets:[solidNets.row.map(([x,y])=>[-x,y])],context:'备用镜像网'},'独立折起镜像纸网，转动/翻面，点全部实际面边顶点并填写数量。','6、12、8。','备用：左右镜像后的共享对象']
 ],
 'G07.02':[
  [{kind:'match',nets:[solidNets.stair],context:'礼盒标记换到阶梯网'},'六个礼盒面有稳定字母和图案。实际折阶梯网、转动/翻面，再把展开面与盒中同一原面全部逐对连接。','全部六对身份保持，隐藏面也须对应。','纸网结构与面朝向改变'],
  [{kind:'match',nets:[solidNets.row],context:'独立长条网对应'},'独立折长条带两片纸网，查看全部面，再逐对连接展开面与立体中的同一原面。','六面身份保持。','无提示：另一种有效连接'],
  [{kind:'match',nets:[solidNets.cross.map(([x,y])=>[x,-y])],context:'隔日上下镜像'},'隔日折起上下镜像网，查看背面后，把每个展开面连接到立体中的原面。','原图案和字母随折叠保留。','隔日：上下镜像布局'],
  [{kind:'match',nets:[solidNets.stair.map(([x,y])=>[-y,x])],context:'备用斜阶方向'},'独立折转向后的阶梯网，转动/翻面检查每个面，再连六对原面对应。','六对身份保持。','备用：阶梯网转90°']
 ],
 'G07.03':[
  [{kind:'valid',nets:[solidNets.row,solidNets.rectangle],context:'额外连接冲突的反例'},'逐面试折两种六片纸网：一张长条带两片，一张2×3矩形。依据实际重合及原连接冲突判断有效性；矩形多出的连接不能默默剪开。','前图有效；矩形重合并有原连接冲突，非法。','无环重合反例改为含额外连接环的反例'],
  [{kind:'valid',nets:[solidNets.strip,solidNets.stair],context:'独立先非法再有效'},'独立把六面直条与阶梯网都逐面试折，检查背面、重合和连接冲突，再分别判断。','直条非法，阶梯有效。','无提示：图序改变，不能按第一图选有效'],
  [{kind:'valid',nets:[solidNets.rectangle,solidNets.cross.map(([x,y])=>[-y,x])],context:'隔日连接环与转向有效网'},'隔日逐面试折矩形六片网及转向十字网，检查实际位置与原连接，再判断各自能否合拢。','矩形非法；转向十字有效。','隔日：先含环非法网，后转向有效网'],
  [{kind:'valid',nets:[solidNets.row.map(([x,y])=>[-x,y]),solidNets.strip.map(([x,y])=>[y,x])],context:'备用镜像与竖直条'},'独立试折镜像有效网与竖直六面条，检查全部折后位置和背面，分别判断。','镜像网有效；竖直条有重合，非法。','备用：镜像和条方向变化']
 ],
 'G07.04':[
  [{kind:'opposite',nets:[solidNets.row],asked:['A','E'],context:'不同网的指定面'},'实际折起新网，转动/翻面。依次点A和它的相对面，再点E和它的相对面。','此网A与C、E与F相对。','指定面与纸网连接同时改变'],
  [{kind:'opposite',nets:[solidNets.stair],asked:['A','B'],context:'独立阶梯网相对'},'独立折阶梯网，查看隐藏面，分别找A和B的相对原面。','按合拢后反向朝向找相对面。','无提示：阶梯网相对关系'],
  [{kind:'opposite',nets:[solidNets.cross.map(([x,y])=>[-y,x])],asked:['C','D'],context:'隔日转向指定侧面'},'隔日折转向网，转动翻面后分别找C和D的相对原面。','C与B、D与E相对，方向变化不改原面身份。','隔日：指定侧面改变'],
  [{kind:'opposite',nets:[solidNets.row.map(([x,y])=>[-x,y])],asked:['B','F'],context:'备用镜像网相对面'},'独立折镜像网，查看所有面，分别找B和F的相对原面。','按反向法向及不共边判断。','备用：镜像和两个新指定面']
 ],
 'G07.05':[
  [{kind:'volume',solids:[{cells:solidBox(2,2,2),title:'短盒'},{cells:solidBox(4,2,1),title:'扁盒'}],unit:1,compare:'equalVolume',context:'相同块数、不同外形'},'每块1立方厘米。分别逐层堆两个目标，转动翻面检查，填写各体积和单位，再判断体积是否相同。','两形都8块、8立方厘米；外形与表面积可以不同。','单个盒改两个等体积不同形状'],
  [{kind:'volume',solids:[{cells:[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,0,1]],title:'带一块上层的台阶'}],unit:1,context:'独立台阶与隐藏块'},'独立逐层堆目标台阶，查看隐藏底层，填体积并选择单位。','5块，5立方厘米。','无提示：长方体改非长方体台阶'],
  [{kind:'volume',solids:[{cells:solidBox(1,1,3),title:'三层立柱'}],unit:1,context:'隔日层数变化'},'隔日逐层堆三层立柱，转动翻面检查每层，再填体积和单位。','3块，3立方厘米。','隔日：更多层、更小每层'],
  [{kind:'volume',solids:[{cells:solidBox(2,2,2),title:'半厘米块组成的盒'}],unit:.5,context:'备用非单位厘米块'},'独立用每边0.5厘米的小块逐层堆2×2×2目标，转动翻面，填写实际体积及单位。','每块0.125立方厘米，8块共1立方厘米。','备用：小块边长变半厘米，块数不直接等体积']
 ],
 'G07.06':[
  [{kind:'surface',solids:[{cells:solidBox(2,2,2),title:'短盒'},{cells:solidBox(4,2,1),title:'扁盒'}],unit:1,compare:'differentArea',context:'等体积不保证等表面积'},'逐层堆两个各有8块的目标，转动翻面并分别选全部实际外露方片，填表面积与单位，再比较。','短盒24平方厘米，扁盒28平方厘米；体积都8，表面积不同。','单个表面积改等体积双形比较'],
  [{kind:'surface',solids:[{cells:solidBox(3,1,1),title:'三块横列'}],unit:1,context:'独立排除贴合内面'},'独立堆三块横列，转动翻面，逐块选择全部外露方片。内部贴合方片不计，填表面积和单位。','18张方片中4张在内部，外露14平方厘米。','无提示：细长形有两个贴合界面'],
  [{kind:'surface',solids:[{cells:[[0,0,0],[1,0,0],[2,0,0],[0,1,0],[1,1,0],[0,0,1]],title:'六块台阶'}],unit:1,context:'隔日台阶凹面'},'隔日逐层堆六块台阶，转动翻面，选各块实际外露方片，包含凹边外露面，再填表面积和单位。','六块有六个贴合界面，外露36−12＝24平方厘米。','隔日：非长方体、凹边和隐藏外面'],
  [{kind:'surface',solids:[{cells:solidBox(2,2,1),title:'半厘米薄层'}],unit:.5,context:'备用方片面积换单位'},'独立用边0.5厘米的小块堆2×2×1薄层，选全部实际外露方片，填写实际表面积及单位。','16张外露方片，每张0.25平方厘米，共4平方厘米。','备用：外露方片数与实际面积分开']
 ]
};
const solidStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(SOLID_CASES)){
 if(cases.length!==4)throw Error('Four G07 cases required: '+skillId);solidStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i];solidStageTarget[skillId][kind]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:52,mode:'solidLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,contentVersion:params.kind==='valid'?71:52,prompt,explain,changeDimension,...(kind==='transfer'?{hint:'折后按真实位置、方向与连接检查，不按外观猜。逐层数空间块，外表面积只数外露方片；单位尺寸变化要换算。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={SOLID_CASES};

'use strict';
function solidDot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0)}
function solidCross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]}
function solidAdd(a,b){return a.map((v,i)=>v+b[i])}
function solidMul(a,s){return a.map(v=>v*s)}
function solidRotate(p,axis,angle){const c=Math.cos(angle),s=Math.sin(angle);return solidAdd(solidAdd(solidMul(p,c),solidMul(solidCross(axis,p),s)),solidMul(axis,solidDot(axis,p)*(1-c)))}
function solidChild(frame,dx,dy,degrees){const axis=dx?frame.v:frame.u,angle=(dx?-dx:dy)*degrees*Math.PI/180,out=solidMul(dx?frame.u:frame.v,dx||dy),hinge=solidAdd(frame.center,solidMul(out,.5));return {center:solidAdd(hinge,solidRotate(solidMul(out,.5),axis,angle)),u:solidRotate(frame.u,axis,angle),v:solidRotate(frame.v,axis,angle),n:solidRotate(frame.n,axis,angle)}}
function solidNetTree(net){const nodes=net.map((p,i)=>({id:String.fromCharCode(65+i),x:p[0],y:p[1],parent:null,dx:0,dy:0})),seen=new Set([0]),queue=[0],order=[0];while(queue.length){const i=queue.shift();for(let j=0;j<nodes.length;j++){const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y;if(Math.abs(dx)+Math.abs(dy)===1&&!seen.has(j)){seen.add(j);nodes[j].parent=i;nodes[j].dx=dx;nodes[j].dy=dy;queue.push(j);order.push(j)}}}return {nodes,order,connected:seen.size===net.length}}
function solidNetFrames(net,angles){const tree=solidNetTree(net),frames={};frames.A={center:[0,0,0],u:[1,0,0],v:[0,1,0],n:[0,0,1]};for(const i of tree.order.slice(1)){const node=tree.nodes[i],parent=tree.nodes[node.parent];frames[node.id]=solidChild(frames[parent.id],node.dx,node.dy,angles?.[node.id]??0)}return frames}
function solidVertices(frame){return [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([x,y])=>solidAdd(frame.center,solidAdd(solidMul(frame.u,x),solidMul(frame.v,y))))}
function solidAnalysis(net,angles){const tree=solidNetTree(net),frames=solidNetFrames(net,angles),pointKey=p=>p.map(v=>Math.round(v*1000000)/1000000).join(','),equal=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]))<1e-8,closed=tree.connected&&tree.nodes.slice(1).every(n=>(angles?.[n.id]??0)===90),collisions=[],gaps=[];const values=Object.entries(frames);for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++)if(equal(values[i][1].center,values[j][1].center))collisions.push([values[i][0],values[j][0]]);
 if(closed)for(let i=0;i<net.length;i++)for(let j=i+1;j<net.length;j++){const dx=net[j][0]-net[i][0],dy=net[j][1]-net[i][1];if(Math.abs(dx)+Math.abs(dy)!==1)continue;const expected=solidChild(frames[String.fromCharCode(65+i)],dx,dy,90),actual=frames[String.fromCharCode(65+j)];if(!equal(expected.center,actual.center)||!equal(expected.u,actual.u)||!equal(expected.v,actual.v))gaps.push([String.fromCharCode(65+i),String.fromCharCode(65+j)])}
 const normals=new Set(values.map(([,f])=>pointKey(f.n))),valid=net.length===6&&new Set(net.map(p=>p.join(','))).size===6&&closed&&collisions.length===0&&gaps.length===0&&normals.size===6,vertices={},edges={};for(const [face,frame] of values){const ps=solidVertices(frame);for(const [i,p] of ps.entries()){const key=pointKey(p);(vertices[key]??={point:p,faces:[]}).faces.push(face);const q=ps[(i+1)%4],ek=[key,pointKey(q)].sort().join('|');(edges[ek]??={points:[p,q],faces:[]}).faces.push(face)}}return {valid:valid&&Object.keys(edges).length===12&&Object.keys(vertices).length===8&&Object.values(edges).every(e=>e.faces.length===2)&&Object.values(vertices).every(v=>v.faces.length===3),closed,frames,collisions,gaps,vertices,edges,normals:normalCount(normals)};
}
function normalCount(set){return set.size}
function solidFullAngles(net){return Object.fromEntries(solidNetTree(net).nodes.slice(1).map(n=>[n.id,90]))}
const SOLID_DIRS=[['+x',[1,0,0]],['-x',[-1,0,0]],['+y',[0,1,0]],['-y',[0,-1,0]],['+z',[0,0,1]],['-z',[0,0,-1]]];
function solidSurface(cells){const keys=new Set(cells.map(p=>p.join(',')));return cells.flatMap(p=>SOLID_DIRS.filter(([,d])=>!keys.has(solidAdd(p,d).join(','))).map(([side,d])=>({id:p.join(',')+'|'+side,cell:p,side,normal:d})))}
function solidUnitFace(cell,side){const d=SOLID_DIRS.find(v=>v[0]===side)?.[1];if(!d)return [];const center=cell.map((v,i)=>v+(d[i]+1)/2),axis=d.findIndex(v=>v!==0),other=[0,1,2].filter(i=>i!==axis);return [[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]].map(([a,b])=>center.map((v,i)=>v+(i===other[0]?a:i===other[1]?b:0)))}
if(typeof module!=='undefined')module.exports={solidDot,solidCross,solidAdd,solidMul,solidRotate,solidChild,solidNetTree,solidNetFrames,solidVertices,solidAnalysis,solidFullAngles,SOLID_DIRS,solidSurface,solidUnitFace};

'use strict';
const SOLID_PATTERNS=['●','★','▲','■','◆','♥'];
function solidState(task){return draft.work??(draft.work={nets:(task.nets||[]).map(net=>({angles:Object.fromEntries(solidNetTree(net).nodes.slice(1).map(n=>[n.id,0])),seen:[],faces:[],edges:[],vertices:[],counts:{faces:0,edges:0,vertices:0},pendingNet:'',links:[],choice:'',pendingOpp:'',opposites:{}})),stacks:(task.solids||[]).map(()=>({cells:[],slice:0,mode:'build',activeCube:'',surfaces:[],answer:0,unit:'',seen:[]})),yaw:0,pitch:1,comparison:'',moves:0,log:[]})}
function solidCamera(w){const a=w.yaw*Math.PI/4;return {camera:[.8*Math.cos(a),.8*Math.sin(a),.6*w.pitch],right:[-Math.sin(a),Math.cos(a),0],up:[-.6*w.pitch*Math.cos(a),-.6*w.pitch*Math.sin(a),.8]}}
function solidProjection(points,w){const v=solidCamera(w),coords=points.map(p=>[solidDot(p,v.right),-solidDot(p,v.up)]),minX=Math.min(...coords.map(p=>p[0])),maxX=Math.max(...coords.map(p=>p[0])),minY=Math.min(...coords.map(p=>p[1])),maxY=Math.max(...coords.map(p=>p[1])),scale=Math.min(260/Math.max(1,maxX-minX),260/Math.max(1,maxY-minY)),cx=(minX+maxX)/2,cy=(minY+maxY)/2;return p=>[180+(solidDot(p,v.right)-cx)*scale,180+(-solidDot(p,v.up)-cy)*scale]}
function solidRecordViews(task,w){const camera=solidCamera(w).camera;for(const [i,net] of (task.nets||[]).entries()){const a=solidAnalysis(net,w.nets[i].angles);if(a.closed)for(const [id,f] of Object.entries(a.frames))if(solidDot(f.n,camera)<-1e-8&&!w.nets[i].seen.includes(id))w.nets[i].seen.push(id)}for(const [i,model] of (task.solids||[]).entries()){const s=w.stacks[i];if(model.cells.every(p=>s.cells.includes(p.join(','))))for(const [side,normal] of SOLID_DIRS)if(solidDot(normal,camera)>1e-8&&!s.seen.includes(side))s.seen.push(side)}}
function solidViewButtons(w){return `<div class="work-buttons"><button data-action="solidTurn" data-delta="-1">转向左侧</button><button data-action="solidTurn" data-delta="1">转向右侧</button><button data-action="solidFlip">${w.pitch===1?'从下方查看':'从上方查看'}</button><span>视角${w.yaw+1}，${w.pitch===1?'上方':'下方'}</span></div>`}
function solidNetFlat(net,s,index){const xs=net.map(p=>p[0]),ys=net.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);return `<svg class="solid-flat" viewBox="0 0 ${(maxX-minX+1)*64+8} ${(maxY-minY+1)*64+8}" role="img" aria-label="实际展开纸片，六面稳定字母和图案">${net.map(([x,y],i)=>{const id=String.fromCharCode(65+i),px=4+(x-minX)*64,py=4+(maxY-y)*64;return `<g data-action="solidFace" data-side="net" data-index="${index}" data-id="${id}" role="button" tabindex="0" aria-label="展开图原面${id}" aria-pressed="${s.pendingNet===id}"><rect x="${px}" y="${py}" width="62" height="62" fill="${s.pendingNet===id?'#ffce69':'#e4efd9'}" stroke="#769273" stroke-width="2"/><text x="${px+31}" y="${py+23}" text-anchor="middle" font-size="16">${id}</text><text x="${px+31}" y="${py+47}" text-anchor="middle" font-size="20">${SOLID_PATTERNS[i]}</text></g>`}).join('')}</svg>`}
function solidNetImage(net,s,index,w,formal=false){const a=solidAnalysis(net,s.angles),faces=Object.entries(a.frames),points=faces.flatMap(([,f])=>solidVertices(f)),project=solidProjection(points,w),camera=solidCamera(w).camera,path=ps=>'M'+ps.map(p=>project(p).join(' ')).join('L')+'Z',bad=new Set(formal?[]:a.collisions.flat()),sorted=faces.sort(([,f],[,g])=>solidDot(f.center,camera)-solidDot(g.center,camera));let selected='';if(a.valid){selected=s.edges.filter(id=>a.edges[id]).map(id=>`<path d="M${a.edges[id].points.map(p=>project(p).join(' ')).join('L')}" fill="none" stroke="#d17b37" stroke-width="7"/>`).join('')+s.vertices.filter(id=>a.vertices[id]).map(id=>{const p=project(a.vertices[id].point);return `<circle cx="${p[0]}" cy="${p[1]}" r="8" fill="#ba653d"/>`}).join('')}
 return `<svg class="solid-fold-model" viewBox="0 0 360 360" role="img" aria-label="实际逐面折叠的三维位置，背面保留轮廓，转动可见">${sorted.map(([id,f])=>{const visible=!a.closed||solidDot(f.n,camera)<-1e-8,center=project(f.center);return `<g data-action="solidFace" data-side="solid" data-index="${index}" data-id="${id}" role="button" tabindex="0" aria-label="折后原面${id}" opacity="${visible?1:.22}"><path data-face-id="${id}" d="${path(solidVertices(f))}" fill="${bad.has(id)?'#f2a896':s.faces.includes(id)||s.links.some(p=>p[1]===id)||Object.values(s.opposites).includes(id)?'#f6cf76':'#d9e9d5'}" stroke="#547d70" stroke-width="2"/>${visible?`<text x="${center[0]}" y="${center[1]-5}" text-anchor="middle" font-size="16">${id}</text><text x="${center[0]}" y="${center[1]+17}" text-anchor="middle" font-size="20">${SOLID_PATTERNS[id.charCodeAt(0)-65]}</text>`:''}</g>`}).join('')}${selected}</svg>`;
}
function solidCountControl(s,index,key,label){return `<div class="work-buttons"><button data-action="solidCount" data-index="${index}" data-key="${key}" data-delta="-1" ${s.counts[key]<=0?'disabled':''}>－1</button><span>我填${label}${s.counts[key]}</span><button data-action="solidCount" data-index="${index}" data-key="${key}" data-delta="1">＋1</button></div>`}
function solidNetPanel(task,w,index){const net=task.nets[index],s=w.nets[index],tree=solidNetTree(net),a=solidAnalysis(net,s.angles),labels=tree.nodes.map(n=>n.id);let controls='';
 if(task.kind==='counts'&&a.valid){controls=['edges','vertices'].map(key=>`<section><b>${key==='edges'?'实际共用边':'实际共用顶点'}</b><div class="solid-object-buttons">${Object.entries(a[key]).sort(([x],[y])=>x.localeCompare(y)).map(([id,item],i)=>`<button data-action="solidObject" data-index="${index}" data-key="${key}" data-id="${esc(id)}" aria-pressed="${s[key].includes(id)}">${key==='edges'?'边E':'点V'}${i+1}(${item.faces.join('、')})</button>`).join('')}</div></section>`).join('')+[['faces','面'],['edges','不同边'],['vertices','不同顶点']].map(([key,label])=>solidCountControl(s,index,key,label)).join('')}
 if(task.kind==='match')controls=`<p>当前展开面${s.pendingNet||'未选'}；已连${s.links.map(p=>p.join('↔')).join('、')||'无'}。</p><div class="work-buttons">${labels.map(id=>`<button data-action="solidFace" data-side="net" data-index="${index}" data-id="${id}">点展开${id}原面</button>`).join('')}</div>`;
 if(task.kind==='valid')controls=`<p>${assessmentFormal(task)?'请通过转动、翻面和原面位置，自行判断能否折成立方体。':a.closed?`试折结果：不同朝向${a.normals}种；同位置重合${a.collisions.map(p=>p.join('/')).join('、')||'无'}；原连接冲突${a.gaps.map(p=>p.join('/')).join('、')||'无'}。`:'先沿全部编号铰链试折。'}${solidNetTree(net).nodes.length-1<net.reduce((sum,p,i)=>sum+net.slice(i+1).filter(q=>Math.abs(p[0]-q[0])+Math.abs(p[1]-q[1])===1).length,0)?'此网含额外连接；试折图沿树形铰链计算，冲突连接显式报告，不能当作已剪开。':''}</p><div class="work-buttons">${[['valid','可以成为立方体'],['invalid','不能成为立方体']].map(([value,label])=>`<button data-action="solidValidity" data-index="${index}" data-value="${value}" aria-pressed="${s.choice===value}">${label}</button>`).join('')}</div>`;
 if(task.kind==='opposite')controls=`<p>指定${task.asked.join('、')}；当前配对起面${s.pendingOpp||'未选'}；已配${Object.entries(s.opposites).map(p=>p.join('↔')).join('、')||'无'}。</p>`;
 return `<section class="solid-net-panel"><h4>纸片${index+1} · A固定为起始面</h4><div class="solid-two-models">${solidNetFlat(net,s,index)}${solidNetImage(net,s,index,w,assessmentFormal(task))}</div><div class="solid-hinge-buttons">${tree.nodes.slice(1).map(n=>`<div><span>${n.id}绕${tree.nodes[n.parent].id}相邻铰链 · ${s.angles[n.id]}°</span><button data-action="solidFold" data-index="${index}" data-id="${n.id}" data-delta="-30" ${s.angles[n.id]<=0?'disabled':''}>展开30°</button><button data-action="solidFold" data-index="${index}" data-id="${n.id}" data-delta="30" ${s.angles[n.id]>=90?'disabled':''}>折起30°</button></div>`).join('')}</div><p>折合后实际已查看原面${s.seen.join('、')||'无'}。</p><div class="work-buttons">${labels.map(id=>`<button data-action="solidFace" data-side="solid" data-index="${index}" data-id="${id}" aria-pressed="${s.faces.includes(id)}">点立体${id}(${SOLID_PATTERNS[id.charCodeAt(0)-65]})面</button>`).join('')}</div>${controls}</section>`;
}
function solidStackImage(model,s,w){const cells=s.cells.map(key=>key.split(',').map(Number)),target=model.cells,allPoints=target.flatMap(p=>SOLID_DIRS.flatMap(([side])=>solidUnitFace(p,side))),project=solidProjection(allPoints,w),camera=solidCamera(w).camera,faces=solidSurface(cells),path=ps=>'M'+ps.map(p=>project(p).join(' ')).join('L')+'Z',ghost=solidSurface(target).map(f=>`<path d="${path(solidUnitFace(f.cell,f.side))}" fill="none" stroke="#b5c6b3" stroke-width="1" stroke-dasharray="4 3"/>`).join(''),drawn=faces.sort((a,b)=>solidDot(a.cell,camera)-solidDot(b.cell,camera)).map(f=>`<path data-unit-face-id="${f.id}" d="${path(solidUnitFace(f.cell,f.side))}" fill="${s.surfaces.includes(f.id)?'#f3bd63':'#9ec3a6'}" fill-opacity="${solidDot(f.normal,camera)>0?.9:.15}" stroke="#6b9071"/>`).join(''),internal=s.surfaces.filter(id=>!faces.some(f=>f.id===id)).map(id=>{const [key,side]=id.split('|');return `<path data-internal-face-id="${id}" d="${path(solidUnitFace(key.split(',').map(Number),side))}" fill="#e6a091" fill-opacity=".5" stroke="#bf6545"/>`}).join('');return `<svg class="solid-stack-model" viewBox="0 0 360 360" role="img" aria-label="已堆单位块的实际外面，空目标虚线；红色内部面仅供观察不计外面积">${ghost}${drawn}${internal}</svg>`}
function solidStackPanel(task,w,index){const model=task.solids[index],s=w.stacks[index],maxX=Math.max(...model.cells.map(p=>p[0])),maxY=Math.max(...model.cells.map(p=>p[1])),maxZ=Math.max(...model.cells.map(p=>p[2])),target=new Set(model.cells.map(p=>p.join(',')));
 return `<section class="solid-stack-panel"><h4>${esc(model.title)} · 每块边${task.unit}厘米</h4>${solidStackImage(model,s,w)}<div class="work-buttons">${Array.from({length:maxZ+1},(_,z)=>`<button data-action="solidSlice" data-index="${index}" data-value="${z}" aria-pressed="${s.slice===z}">查看第${z+1}层</button>`).join('')}<button data-action="solidMode" data-index="${index}" data-value="build" aria-pressed="${s.mode==='build'}">点格堆/取块</button>${task.kind==='surface'?`<button data-action="solidMode" data-index="${index}" data-value="inspect" aria-pressed="${s.mode==='inspect'}">点块选外面</button>`:''}</div><div class="solid-layer-grid" style="--solid-cols:${maxX+1}" aria-label="第${s.slice+1}层实际方格">${Array.from({length:maxY+1},(_,j)=>maxY-j).map(y=>Array.from({length:maxX+1},(_,x)=>{const key=[x,y,s.slice].join(','),filled=s.cells.includes(key);return `<button data-action="solidCell" data-index="${index}" data-x="${x}" data-y="${y}" data-z="${s.slice}" data-cube-id="${index}-${key}" class="${filled?'filled':''} ${target.has(key)?'target':''}" aria-label="单位块${key}${target.has(key)?'目标槽':'目标外位置'}" aria-pressed="${filled}">${filled?'■':target.has(key)?'空槽':'·'}</button>`}).join('')).join('')}</div><p>已堆${s.cells.length}个原单位块；实际已查看外方向${s.seen.join('、')||'无'}。</p>${task.kind==='surface'?`<p>当前观察块${s.activeCube||'未选'}；当前选${s.surfaces.length}张实际方片。点各块后可检查六张方片，内部贴合两张都不计。</p><div class="work-buttons">${s.cells.map(key=>`<button data-action="solidInspect" data-index="${index}" data-id="${key}" aria-pressed="${s.activeCube===key}">观察块(${key})</button>`).join('')}</div><div class="work-buttons">${SOLID_DIRS.map(([side])=>`<button data-action="solidSurface" data-index="${index}" data-side="${side}" ${s.activeCube?'':'disabled'} aria-pressed="${s.surfaces.includes(s.activeCube+'|'+side)}">${side}实际方片</button>`).join('')}</div>`:''}<div class="work-buttons"><span>我填${task.kind==='surface'?'表面积':'体积'}${s.answer}</span>${[-1,-.125,.125,1,5,10].map(delta=>`<button data-action="solidAmount" data-index="${index}" data-delta="${delta}" ${s.answer+delta<0||s.answer+delta>200?'disabled':''}>${delta>0?'＋':'－'}${Math.abs(delta)}</button>`).join('')}${[['length','厘米'],['area','平方厘米'],['volume','立方厘米']].map(([value,label])=>`<button data-action="solidUnit" data-index="${index}" data-value="${value}" aria-pressed="${s.unit===value}">${label}</button>`).join('')}</div></section>`;
}
function solidBoard(task){const w=solidState(task);return `<div class="board solid-board"><h3>${esc(task.context)}</h3><div class="work-buttons"><button data-action="solidUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${solidViewButtons(w)}${(task.nets||[]).map((_,i)=>solidNetPanel(task,w,i)).join('')}${(task.solids||[]).map((_,i)=>solidStackPanel(task,w,i)).join('')}${task.compare?`<div class="work-buttons"><span>比较${task.kind==='volume'?'体积':'表面积'}</span>${[['equal','相同'],['different','不同']].map(([value,label])=>`<button data-action="solidCompare" data-value="${value}" aria-pressed="${w.comparison===value}">${label}</button>`).join('')}</div>`:''}</div>`}
function solidGrade(task){const w=solidState(task),same=(a,b)=>a.length===b.length&&b.every(v=>a.includes(v));let ok=false;
 if(task.nets)ok=task.nets.every((net,i)=>{const s=w.nets[i],a=solidAnalysis(net,s.angles),ids=Object.keys(a.frames);if(!a.closed||!same(s.seen,ids))return false;if(task.kind==='valid')return s.choice===(a.valid?'valid':'invalid');if(!a.valid)return false;if(task.kind==='counts')return same(s.faces,ids)&&same(s.edges,Object.keys(a.edges))&&same(s.vertices,Object.keys(a.vertices))&&s.counts.faces===6&&s.counts.edges===12&&s.counts.vertices===8;if(task.kind==='match')return s.links.length===6&&s.links.every(([x,y])=>x===y)&&new Set(s.links.map(p=>p[0])).size===6&&s.pendingNet==='';if(task.kind==='opposite')return !s.pendingOpp&&task.asked.every(id=>s.opposites[id]&&solidDot(a.frames[id].n,a.frames[s.opposites[id]].n)<-1+1e-8);return false});
 if(task.solids){ok=task.solids.every((model,i)=>{const s=w.stacks[i],area=solidSurface(model.cells),amount=task.kind==='volume'?model.cells.length*task.unit**3:area.length*task.unit**2;return same(s.cells,model.cells.map(p=>p.join(',')))&&same(s.seen,SOLID_DIRS.map(v=>v[0]))&&s.answer===amount&&s.unit===(task.kind==='volume'?'volume':'area')&&(task.kind!=='surface'||same(s.surfaces,area.map(f=>f.id)))});if(task.compare){const values=task.solids.map(model=>(task.kind==='volume'?model.cells.length:solidSurface(model.cells).length));ok=ok&&w.comparison===(values.every(v=>v===values[0])?'equal':'different')}}
 return {ok,incomplete:w.moves===0,reason:'逐面核对折后真实位置、方向和原连接，转动/翻面看隐藏对象；原块按层不重叠，表面积排除内部贴合方片，最后核对量与单位。'};
}
function solidAct(action,data,task){const w=solidState(task),before=JSON.stringify({...w,log:[]}),index=Number(data.index),delta=Number(data.delta);let changed=false;
 if(action==='solidTurn'&&[-1,1].includes(delta)){w.yaw=(w.yaw+delta+8)%8;changed=true}if(action==='solidFlip'){w.pitch=-w.pitch;changed=true}
 if(task.nets&&Number.isInteger(index)&&index>=0&&index<w.nets.length){const s=w.nets[index],a=solidAnalysis(task.nets[index],s.angles),id=data.id;
  if(action==='solidFold'&&Object.hasOwn(s.angles,id)&&[-30,30].includes(delta)&&s.angles[id]+delta>=0&&s.angles[id]+delta<=90){s.angles[id]+=delta;changed=true}
  if(action==='solidFace'&&Object.hasOwn(a.frames,id)){if(task.kind==='counts'&&data.side==='solid'){const at=s.faces.indexOf(id);at<0?s.faces.push(id):s.faces.splice(at,1);changed=true}if(task.kind==='match'){if(data.side==='net'){s.pendingNet=s.pendingNet===id?'':id;changed=true}else if(data.side==='solid'&&s.pendingNet&&!s.links.some(p=>p[0]===s.pendingNet||p[1]===id)){s.links.push([s.pendingNet,id]);s.pendingNet='';changed=true}}if(task.kind==='opposite'&&data.side==='solid'){if(s.pendingOpp){s.opposites[s.pendingOpp]=id;s.pendingOpp=''}else s.pendingOpp=id;changed=true}}
  if(action==='solidObject'&&task.kind==='counts'&&a.valid&&['edges','vertices'].includes(data.key)&&Object.hasOwn(a[data.key],id)){const at=s[data.key].indexOf(id);at<0?s[data.key].push(id):s[data.key].splice(at,1);changed=true}
  if(action==='solidCount'&&task.kind==='counts'&&['faces','edges','vertices'].includes(data.key)&&[-1,1].includes(delta)&&s.counts[data.key]+delta>=0&&s.counts[data.key]+delta<=50){s.counts[data.key]+=delta;changed=true}
  if(action==='solidValidity'&&task.kind==='valid'&&['valid','invalid'].includes(data.value)){s.choice=data.value;changed=true}
 }
 if(task.solids&&Number.isInteger(index)&&index>=0&&index<w.stacks.length){const s=w.stacks[index],model=task.solids[index],max=[0,1,2].map(k=>Math.max(...model.cells.map(p=>p[k])));
  if(action==='solidSlice'&&Number.isInteger(Number(data.value))&&Number(data.value)>=0&&Number(data.value)<=max[2]){s.slice=Number(data.value);changed=true}
  if(action==='solidMode'&&['build','inspect'].includes(data.value)){s.mode=data.value;changed=true}
  if(action==='solidCell'){const p=[Number(data.x),Number(data.y),Number(data.z)],key=p.join(',');if(p.every((v,k)=>Number.isInteger(v)&&v>=0&&v<=max[k])&&p[2]===s.slice){const at=s.cells.indexOf(key);if(s.mode==='inspect'){if(at>=0){s.activeCube=key;changed=true}}else{at<0?s.cells.push(key):s.cells.splice(at,1);s.surfaces=[];s.seen=[];if(s.activeCube===key)s.activeCube='';changed=true}}}
  if(action==='solidInspect'&&s.cells.includes(data.id)){s.activeCube=data.id;changed=true}
  if(action==='solidSurface'&&task.kind==='surface'&&s.activeCube&&s.cells.includes(s.activeCube)&&SOLID_DIRS.some(v=>v[0]===data.side)){const id=s.activeCube+'|'+data.side,at=s.surfaces.indexOf(id);at<0?s.surfaces.push(id):s.surfaces.splice(at,1);changed=true}
  if(action==='solidAmount'&&[-1,-.125,.125,1,5,10].includes(delta)&&s.answer+delta>=0&&s.answer+delta<=200){s.answer+=delta;changed=true}
  if(action==='solidUnit'&&['length','area','volume'].includes(data.value)){s.unit=data.value;changed=true}
 }
 if(action==='solidCompare'&&task.compare&&['equal','different'].includes(data.value)){w.comparison=data.value;changed=true}
 if(action==='solidUndo'&&w.log.length){const log=w.log,snapshot=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,snapshot,{log,moves});return true}
 if(changed){solidRecordViews(task,w);w.log.push(before);w.moves++;return true}return false;
}
function solidSpeech(task){const w=solidState(task);return `视角${w.yaw+1}，${w.pitch===1?'上方':'下方'}。`+(task.nets?w.nets.map((s,i)=>`纸片${i+1}折角${Object.entries(s.angles).map(p=>p.join(':')).join('、')}；已看原面${s.seen.join('、')||'无'}；已点${s.faces.length}面、${s.edges.length}边、${s.vertices.length}顶点；已连${s.links.map(p=>p.join('到')).join('、')||'无'}；相对配对${Object.entries(s.opposites).map(p=>p.join('到')).join('、')||'无'}`).join('；'):w.stacks.map((s,i)=>`目标${i+1}已堆${s.cells.length}块；正看第${s.slice+1}层；选择${s.surfaces.length}张实际方片；填写${s.answer}，单位${s.unit||'未选'}`).join('；'))}
function solidPage(){const task=SOLID_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 纸面、铰链与单位块</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${solidBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>保留原面和实际空间位置</h3><p class="muted">逐面铰链改变真实三维坐标。非法网试折后报告重合或原连接冲突；单位块可按层查看，内部贴合不计入外表面。每一步可撤回。</p></section></aside></div>`}

'use strict';
function setsPeople(counts,twins=false){const groups=[['R',counts[0]],['O',counts[1]],['Y',counts[2]],['N',counts[3]||0]],names=['小安','小贝','小晨','小朵','小易','小凡','小谷'];let n=0;return groups.flatMap(([group,num])=>Array.from({length:num},()=>{const i=n++;return {id:'P'+(i+1),name:twins&&i<2?'小同':names[i]||'队员'+(i+1),group}}))}
const SETS_FIXTURES={fruit:setsPeople([2,3,2,0]),classroom:setsPeople([2,3,2,2]),sports:setsPeople([3,2,1,2]),clubs:setsPeople([2,1,4,3]),disjoint:setsPeople([2,0,3,1]),twins:setsPeople([2,3,2,0],true),large:setsPeople([13,5,9,0])};
const SETS_TASKS={
 'C01.01':{kind:'identity',people:SETS_FIXTURES.fruit,labels:['苹果🍎','香蕉🍌'],context:'名册重复出现，同一身份不复制',prompt:'逐张把两种水果名册中的人物登记到同一教具里，再按实际参加情况归位。同一编号重复出现只添名册标记，不产生第二个人。填写不同身份总数。',explain:'P3、P4、P5各在两册出现，仍各是一个人；不同编号共7人。',reason:{prompt:'怎样判断是不是同一个对象？',options:['依据稳定编号，同一编号的两次出现合在同一原人物上','只凭相同名字就合并','每出现一张名册卡都算新的人'],answer:0}},
 'C01.02':{kind:'members',people:SETS_FIXTURES.fruit,labels:['苹果🍎','香蕉🍌'],queries:['R','A','O','B','Y'],context:'实际圈不同集合',prompt:'登记并归位同一批人物，再分别点“只苹果、苹果整组、两种都喜欢、香蕉整组、只香蕉”各自的全部实际人物。切换集合后保留本组所选身份。',explain:'整组包含交集；仅有组排除交集。同一人物可属于两个完整组，但只占一个实际身份。',reason:{prompt:'苹果整组要包括谁？',options:['只苹果和两种都喜欢的人','仅只苹果的人','只香蕉的人'],answer:0}},
 'C01.03':{kind:'partition',people:SETS_FIXTURES.fruit,labels:['苹果🍎','香蕉🍌'],target:'I',countKeys:['R','O','Y'],context:'从互不重叠的实际分区计数',prompt:'登记所有原人物并逐个归位，分别填写只苹果、两种都喜欢、只香蕉区域人数，再填写至少喜欢一种的不同人数。',explain:'互不重叠区域2、3、2，共7；每位原人物只在一个区域。',reason:{prompt:'为什么可以把三块人数相加？',options:['三块互不重叠且覆盖所问至少一项的人','两个完整组也互不重叠','只要数字相加对，区域含义无关'],answer:0}},
 'C01.04':{kind:'formula',people:SETS_FIXTURES.fruit,labels:['苹果🍎','香蕉🍌'],target:'I',context:'两种不同组式实际作用于人物',prompt:'登记归位后，用集合人数卡实际添入或移去对应人物的计数。拼出两种不同表示的有效组式并填人数；只调换同一组式顺序不算第二种表示。',explain:'可用2＋3＋2、5＋2、5＋5−3；都需让每位目标人物恰好计一次。',reason:{prompt:'怎样检验等价组式？',options:['每个目标身份恰好计一次，且用了不同区域表示','只比较最后数字是否相同','交换两个加数就完成两种表示'],answer:0}},
 'C01.05':{kind:'dedup',people:SETS_FIXTURES.fruit,labels:['苹果🍎','香蕉🍌'],target:'I',context:'实际移去人物的多算一次',prompt:'登记并归位。叠加两个完整名册，让共同人物实际出现两次计数；逐个移去他们多算的一次，再填不同人数。共同人物仍须各保留一次。',explain:'5＋5先出现10次，共同3人各减一次，剩7个不同身份。',reason:{prompt:'为什么只减共同人物的一次？',options:['他们原先各被计两次，减一次后仍各保留一次','要把共同人物完全删掉','把只参加一种的人也删掉'],answer:0}},
 'C04.01':{kind:'universe',people:SETS_FIXTURES.classroom,labels:['绘画','音乐'],queries:['U'],context:'全集包含未报名的人',prompt:'登记全班三个名册：绘画、音乐、两项都未报名。把实际人物归位，再点出全集“全班”的所有身份，填写全班人数。',explain:'全班9人，至少一项7人；两项都不报名的2人也在全集。',reason:{prompt:'全班全集为什么包括两项都未报名的人？',options:['全集由本题指定为全班，不由报名范围决定','全集总等于两活动之和','未报名者不是真实对象'],answer:0}},
 'C04.02':{kind:'complement',people:SETS_FIXTURES.classroom,labels:['绘画','音乐'],queries:['notA'],target:'notA',context:'在指定全集中实际取反面类',prompt:'登记归位全班，点全部“不参加绘画”的人物，再用人数卡实际拼同一集合并填人数。不要把“不绘画”只理解成“只音乐”。',explain:'不绘画包括只音乐2人和两项都不的2人，共4；全班9−绘画整组5＝4。',reason:{prompt:'补集由什么决定？',options:['先定全班全集，再取其中不属指定组的人','不参加绘画必定参加音乐','不管全集，直接取另一个完整组'],answer:0}},
 'C04.03':{kind:'intersection',people:SETS_FIXTURES.classroom,labels:['绘画','音乐'],queries:['O','I','exact1'],context:'区分都参加、至少一项、恰好一项',prompt:'登记归位全班，再分别点出“两项都参加、至少一项、恰好一项”的全部实际人物。没有成员的集合也须明确标空。',explain:'两项都参加只交集；至少一项是并集；恰好一项是两侧仅有区，不含交集和两项都不。',reason:{prompt:'恰好一项与至少一项的差别？',options:['恰好一项排除两项都参加的人，至少一项包括他们','两者完全相同','至少一项包括两项都不的人'],answer:0}},
 'C04.04':{kind:'dedup',people:SETS_FIXTURES.classroom,labels:['绘画','音乐'],target:'I',context:'全集外的目标与实际重计修正',prompt:'登记归位全班。实际叠两份完整报名册，逐人移去共同成员多算的一次，再填写至少报名一项的不同人数；未报名的人不添进这个目标。',explain:'5＋5−3＝7；不是全班9，也不是把共同3人全删掉后的4。',reason:{prompt:'容斥在修正什么？',options:['修正并集里共同身份多计的一次，保留每人一次','修正全集中未报名者的名字','把交集全部排除'],answer:0}},
 'C04.05':{kind:'twoWays',people:SETS_FIXTURES.classroom,labels:['绘画','音乐'],target:'I',context:'直接与全集间接计数都做出来',prompt:'登记归位全班。用实际人物人数卡做两条有效计数：一条直接覆盖所问至少一项，另一条从全集排除两项都不，再分别填人数。',explain:'直接5＋5−3＝7或2＋3＋2＝7；间接9−2＝7。两条都恰好覆盖同一目标身份。',reason:{prompt:'两条方法怎样互相检验？',options:['直接覆盖和全集排除都留下同一目标身份各一次','两次写相同数字就够','同一个算式调换顺序算直接和间接'],answer:0}}
};
for(const [skillId,t] of Object.entries(SETS_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:53,mode:'setsLab',phase:'练',hint:'依稳定编号登记，归到仅A/交集/仅B/两项都不。集合卡对实际身份计数；每个目标身份最终恰好一次。'});
if(typeof module!=='undefined')module.exports={SETS_TASKS,SETS_FIXTURES,setsPeople};

'use strict';
const setsFixtures=typeof module!=='undefined'?require('./sets').SETS_FIXTURES:SETS_FIXTURES;
const SETS_CASES={
 'C01.01':[
  [{people:setsFixtures.sports,labels:['体育','艺术']},'登记体育、艺术、两项都不的三个名册，再按身份归位，填写全部不同身份数。','全体8个身份；共同成员2人虽在两册出现，仍各一人。','水果换活动，增加两项都不的人'],
  [{people:setsFixtures.twins,labels:['绘画','音乐']},'独立登记归位全部名册。两个都叫“小同”的人物有不同编号；填写不同身份总数。','不同编号的小同是两个身份，共7人。','无提示：同名不同身份反例'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类']},'隔日登记两个不重叠活动名册及未参加名册，归位并填全部不同身份数。','全体6人，没有共同成员也要保留未参加者。','隔日：交集为空，含未参加者'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧']},'独立登记归位三册，核对同编号不复制，再填全体不同身份数。','全体10人；共同1人只算一次。','备用：不等组与更多未参加者']
 ],
 'C01.02':[
  [{people:setsFixtures.sports,labels:['体育','艺术'],queries:['A','R','O']},'登记归位体育/艺术人物，分别点体育整组、只体育、两项都参加的全部身份。','体育整组含交集；只体育排除交集。','活动情境与不等完整组'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],queries:['B','Y','O']},'独立登记归位，再分别点戏剧整组、只戏剧、两项都参加。','戏剧整组是只戏剧加共同成员。','无提示：换指定整组与仅有区'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],queries:['A','R','O']},'隔日登记归位，分别点游泳整组、只游泳、两项都参加；无成员须点“这个集合为空”。','游泳整组与只游泳相同；交集为空。','隔日：空交集，整组与仅有组可能相同'],
  [{people:setsFixtures.twins,labels:['绘画','音乐'],queries:['R','O','B']},'独立按编号登记同名人物后，分别点只绘画、两项都参加、音乐整组。','按稳定身份归组，不按同名合并。','备用：同名身份与另一组完整范围']
 ],
 'C01.03':[
  [{people:setsFixtures.sports,labels:['体育','艺术'],countKeys:['R','O','Y','N'],target:'U'},'登记归位并填四个分区人数，最后填写全体人数，包含两项都不的区域。','3＋2＋1＋2＝8人。','三分区并集改为四分区全集'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],countKeys:['R','O','Y','N'],target:'I'},'独立登记归位、填四分区人数，再填至少一项人数；两项都不在全集内但不在目标内。','2＋1＋4＝7，未参加3人不计并集。','无提示：四分区中筛目标三块'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],countKeys:['R','O','Y','N'],target:'I'},'隔日登记归位并填四分区人数，再求至少一项不同人数；空区域也填0。','2＋0＋3＝5，不是全体6。','隔日：空分区与全集外补充对象'],
  [{people:setsFixtures.classroom,labels:['绘画','音乐'],countKeys:['R','O','Y'],target:'I'},'独立登记全班归位，填三个报名分区人数，填至少报名一项人数。','2＋3＋2＝7。','备用：全班包含未报名，目标仍并集']
 ],
 'C01.04':[
  [{people:setsFixtures.large,labels:['体育','艺术'],target:'I'},'体育整组18、艺术14、共同5。登记归位原身份，用两种不同表示实际拼组式求至少一项人数。','18＋14−5＝27；13＋5＋9＝27等。','大量人数与完整组/分区两种表示'],
  [{people:setsFixtures.sports,labels:['体育','艺术'],target:'I'},'独立登记归位，再用两种不同表示的实际计数组式求至少一项，不只交换加数。','5＋3−2＝6；3＋2＋1＝6等。','无提示：不等完整组'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],target:'I'},'隔日登记归位，用两种不同区域表示的实际组式求至少一项；空交集卡可以有0成员。','2＋3−0＝5；2＋0＋3＝5等。','隔日：空交集下仍核对逐身份一次'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],target:'I'},'独立登记归位，用两种实际区域表示的有效组式求至少一项，填两次人数。','3＋5−1＝7；2＋1＋4＝7等。','备用：交集1与较大仅有区']
 ],
 'C01.05':[
  [{people:setsFixtures.sports,labels:['体育','艺术'],target:'I'},'登记归位，叠两个完整活动名册，逐人去掉实际多算的一次，填至少一项人数。','5＋3−2＝6。','活动情境与两完整组不等'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],target:'I'},'独立登记归位并叠两个不重叠名册；只移去实际多算的一次，没有重复时不要移人，填不同人数。','2＋3＝5，无需去掉任何人。','无提示：没有重复的反例'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],target:'I'},'隔日登记归位，叠完整名册并逐人修正重复，未参加者不算至少一项，填人数。','3＋5−1＝7。','隔日：共同1与全体额外3'],
  [{people:setsFixtures.large,labels:['体育','艺术'],target:'I'},'独立登记18/14/共同5名册，归位后叠加，逐个移去共同身份多算的一次，填不同人数。','18＋14−5＝27。','备用：较大名册真实去重']
 ],
 'C04.01':[
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],queries:['U']},'全集指定全班。登记三册并归位，点出全班全集所有身份，再填人数，未参加者也属于全班。','全班10，报名至少一项7。','全集与报名范围不同的活动情境'],
  [{people:setsFixtures.sports,labels:['体育','艺术'],queries:['U']},'独立登记归位全班，再实际点全集成员并填人数。','全班8，报名6。','无提示：全体与并集区别'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],queries:['U']},'隔日登记两个无交集活动及未参加册，归位后点全班全集并填人数。','全班6，不因无交集而丢未参加1人。','隔日：空交集且未参加者仍在全集'],
  [{people:setsFixtures.classroom,labels:['阅读','乐器'],queries:['U']},'独立登记阅读/乐器/两项都不三册，按指定全班全集点全部原身份，填人数。','9人，包括未参加2人。','备用：活动标签改变']
 ],
 'C04.02':[
  [{people:setsFixtures.classroom,labels:['绘画','音乐'],queries:['notB'],target:'notB'},'全班是全集。登记归位，点“不参加音乐”的所有原人物，再实际拼同一集合的计数卡，填人数。','只绘画2与未参加2，共4；9−5＝4。','补集从不A改不B'],
  [{people:setsFixtures.sports,labels:['体育','艺术'],queries:['notA'],target:'notA'},'独立登记归位全班，点不参加体育的成员，再实际拼同一集合并填人数。','只艺术1与两项都不2，共3。','无提示：补集包含两类原人物'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],queries:['N'],target:'N'},'隔日全班作全集，登记归位，点“两项都不”的成员，再用实际计数卡得到同一集合并填人数。','未参加3；10＋1−3−5＝3，或直接N区3。','隔日：不参加一项改两项都不'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],queries:['N'],target:'N'},'独立登记归位全班，点两项都不的实际成员，再拼同一集合计数并填人数。','全班6−游泳2−棋类3＝1。','备用：无交集时的两项都不']
 ],
 'C04.03':[
  [{people:setsFixtures.sports,labels:['体育','艺术'],queries:['O','I','exact1']},'登记归位后，分别点体育艺术都参加、至少一项、恰好一项的全部实际成员。','交集2，并集6，恰好一项4。','活动情境与三个目标分别核对'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],queries:['I','O','exact1']},'独立登记归位，再分别点至少一项、都参加、恰好一项，勿把未参加者添入。','并集7，交集1，恰好一项6。','无提示：目标顺序交换'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],queries:['O','I','exact1']},'隔日登记归位再点三类目标；空集合须明确标空。','交集空；并集与恰好一项都为同样5个原身份。','隔日：不同定义可能给相同集合'],
  [{people:setsFixtures.classroom,labels:['阅读','乐器'],queries:['exact1','I','O']},'独立登记归位，分别点恰好一项、至少一项、都参加的实际成员。','恰好一项4，至少一项7，共同3。','备用：先问恰好一项']
 ],
 'C04.04':[
  [{people:setsFixtures.large,labels:['体育','艺术'],target:'I'},'登记18/14/共同5名册归位，实际叠完整名单，逐身份修正多计的一次，填至少一项人数。','18＋14−5＝27。','较大名册的实际重复项修正'],
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],target:'I'},'独立登记归位全班，叠两个完整活动名单，逐人修正重复，填至少一项人数。','3＋5−1＝7，全班10不等于报名7。','无提示：全班外的目标范围'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],target:'I'},'隔日叠无交集完整名册，按实际重复情况决定是否移去，再填不同报名身份数。','无重复，2＋3＝5。','隔日：不能机械删一个共同人数'],
  [{people:setsFixtures.sports,labels:['体育','艺术'],target:'I'},'独立登记归位，叠两完整册并逐身份去重，填写至少一项人数。','5＋3−2＝6。','备用：不等组与未参加者']
 ],
 'C04.05':[
  [{people:setsFixtures.clubs,labels:['科学','戏剧'],target:'N'},'登记归位全班，用实际计数卡分别直接取“两项都不”及从全集排除并集，得到同一身份集合，填两次人数。','直接N区3；间接10＋1−3−5＝3。','目标由至少一项改两项都不，直接/间接都对应身份'],
  [{people:setsFixtures.sports,labels:['体育','艺术'],target:'I'},'独立登记归位，做一条直接覆盖至少一项的实际组式和一条从全班排除两项都不的组式，填人数。','直接5＋3−2＝6；间接8−2＝6。','无提示：两方法需不同表示'],
  [{people:setsFixtures.classroom,labels:['阅读','乐器'],target:'notA'},'隔日登记归位，分别直接取不阅读的两类区域及从全班排除阅读组，拼实际计数卡并填人数。','直接只乐器2＋未参加2＝4；间接9−5＝4。','隔日：目标改为单组补集'],
  [{people:setsFixtures.disjoint,labels:['游泳','棋类'],target:'I'},'独立登记归位，分别直接合并报名区域和从全班排除未参加者，拼两条实际组式并填人数。','直接2＋3＝5；间接6−1＝5。','备用：空交集仍须真实直接/间接两法']
 ]
};
const setsStageSource=typeof module!=='undefined'?require('./sets').SETS_TASKS:SETS_TASKS,setsStageTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(SETS_CASES)){
 if(cases.length!==4)throw Error('Four set cases required: '+skillId);setsStageTarget[skillId]={};
 for(const [i,kind] of ['transfer','independent','delayed','independent2'].entries()){
  const [params,prompt,explain,changeDimension]=cases[i],base=setsStageSource[skillId];setsStageTarget[skillId][kind]={kind:base.kind,queries:base.queries,countKeys:base.countKeys,target:base.target,id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,contentVersion:54,mode:'setsLab',phase:kind==='transfer'?'迁移':kind==='delayed'?'巩固':'测',...params,context:params.context||prompt.slice(0,16),prompt,explain,changeDimension,...(kind==='transfer'?{hint:'全集先定，稳定身份归位；人数卡作用到具体人物，每个目标身份最后只计一次。'}:{})};
 }
}
if(typeof module!=='undefined')module.exports={SETS_CASES};

'use strict';
function setsBelongs(p,key){return key==='U'||key===p.group||key==='A'&&['R','O'].includes(p.group)||key==='B'&&['Y','O'].includes(p.group)||key==='I'&&p.group!=='N'||key==='exact1'&&['R','Y'].includes(p.group)||key==='notA'&&['Y','N'].includes(p.group)||key==='notB'&&['R','N'].includes(p.group)}
function setsFlags(p){return p.group==='N'?['N']:[...(['R','O'].includes(p.group)?['A']:[]),...(['Y','O'].includes(p.group)?['B']:[])]}
function setsState(task){return draft.work??(draft.work={registry:{},zones:{},active:'',mode:'move',query:task.queries?.[0]||'',marks:{},empty:{},counts:{R:0,O:0,Y:0,N:0},answer:0,rows:Array.from({length:task.kind==='complement'?1:2},()=>({ops:[],answer:0})),added:[],correction:{},moves:0,log:[]})}
function setsLabel(task,key){const [a,b]=task.labels;return {R:'只'+a,O:'两项都参加',Y:'只'+b,N:'两项都不',A:a+'整组',B:b+'整组',U:'指定全集：全体',I:'至少一项',exact1:'恰好一项',notA:'不参加'+a,notB:'不参加'+b}[key]||key||'无'}
function setsMembers(task,key){return task.people.filter(p=>setsBelongs(p,key)).map(p=>p.id)}
function setsTally(task,ops){const tally=Object.fromEntries(task.people.map(p=>[p.id,0]));for(const op of ops)for(const id of setsMembers(task,op.key))tally[id]+=op.sign;return tally}
function setsCoverage(task,tally,key){return task.people.every(p=>(tally[p.id]||0)===(setsBelongs(p,key)?1:0))}
function setsActor(task,w,p){const flags=w.registry[p.id]||[],marked=w.mode==='query'&&(w.marks[w.query]||[]).includes(p.id);return `<button class="sets-actor ${w.active===p.id?'active':''} ${marked?'marked':''}" data-action="setsActor" data-id="${p.id}" data-person-id="${p.id}" aria-label="原人物${p.name}，编号${p.id}，已登记名册${flags.map(k=>setsLabel(task,k)).join('、')}" aria-pressed="${marked||w.active===p.id}"><b>${esc(p.name)}</b><small>${p.id}</small><span>${flags.map(k=>k==='A'?task.labels[0]:k==='B'?task.labels[1]:'两项都不').map(esc).join('、')}</span></button>`}
function setsRegistry(task,w){const lists=['A','B',...(task.people.some(p=>p.group==='N')?['N']:[])];return `<div class="sets-register"><h4>名册记录 → 同一原人物</h4><p>点名册卡登记；同一编号只留一个原人物，后出现的名册添标记。再点原人物，放入实际区域。</p>${lists.map(flag=>`<section><b>${esc(setsLabel(task,flag))}名册</b><div class="sets-cards">${task.people.filter(p=>setsFlags(p).includes(flag)).map(p=>{const seen=w.registry[p.id]?.includes(flag);return `<button class="sets-source" data-action="setsRegister" data-id="${p.id}" data-flag="${flag}" ${seen?'disabled':''} aria-label="名册${setsLabel(task,flag)}中${p.name}，稳定编号${p.id}">${seen?'已登记 →':esc(p.name)}<small>${p.id}</small></button>`}).join('')}</div></section>`).join('')}</div><section><b>已登记、尚未归位的原人物</b><div class="sets-cards">${task.people.filter(p=>w.registry[p.id]&&!w.zones[p.id]).map(p=>setsActor(task,w,p)).join('')||'<span>无</span>'}</div></section>`}
function setsRegionBoard(task,w){return `<div class="sets-universe"><h4>全集边框：${esc(task.universeLabel||'本题全部原人物')}</h4><div class="work-buttons"><button data-action="setsMode" data-value="move" aria-pressed="${w.mode==='move'}">点人物再归位</button>${task.queries?`<button data-action="setsMode" data-value="query" aria-pressed="${w.mode==='query'}">点原人物圈当前集合</button>`:''}</div><div class="sets-regions">${['R','O','Y','N'].map(zone=>`<section class="sets-zone ${zone}"><button data-action="setsPlace" data-zone="${zone}" ${w.active?'':'disabled'}>放到${esc(setsLabel(task,zone))}</button><div class="sets-cards">${task.people.filter(p=>w.zones[p.id]===zone).map(p=>setsActor(task,w,p)).join('')||'<span class="tiny-note">当前空区域</span>'}</div></section>`).join('')}</div></div>`}
function setsQueries(task,w){return task.queries?`<section><h4>逐个检验所问集合</h4><div class="work-buttons">${task.queries.map(key=>`<button data-action="setsQuery" data-key="${key}" aria-pressed="${w.query===key}">${esc(setsLabel(task,key))}</button>`).join('')}<button data-action="setsEmpty" aria-pressed="${!!w.empty[w.query]}">这个集合为空</button></div><p>当前${esc(setsLabel(task,w.query))}：已圈${(w.marks[w.query]||[]).join('、')||'无'}${w.empty[w.query]?'，明确标空':''}；点实际原人物可加入/移出。</p></section>`:''}
function setsAmount(task,w,key,label,row){const value=row===undefined?(key==='answer'?w.answer:w.counts[key]):w.rows[row].answer;return `<div class="work-buttons"><b>${esc(label)} ${value}</b><button data-action="setsAmount" data-key="${key}" ${row===undefined?'':`data-row="${row}"`} data-delta="-1" ${value<=0?'disabled':''}>－1</button>${[1,5,10].map(delta=>`<button data-action="setsAmount" data-key="${key}" ${row===undefined?'':`data-row="${row}"`} data-delta="${delta}" ${value+delta>60?'disabled':''}>＋${delta}</button>`).join('')}</div>`}
function setsCounted(task,tally){return `<div class="sets-counted">${task.people.map(p=>{const n=tally[p.id]||0;return `<div class="sets-counted-person ${p.group} ${n>1?'repeated':''}"><span>${esc(p.name)}(${p.id})计${n}次</span><div>${Array.from({length:Math.max(0,n)},()=>`<i data-counted-id="${p.id}" aria-label="原身份${p.id}的一次计数">${p.id}</i>`).join('')}</div></div>`}).join('')}</div>`}
function setsRows(task,w){return w.rows.slice(0,task.kind==='complement'?1:2).map((row,index)=>{const tally=setsTally(task,row.ops),cards=['R','O','Y','A','B','N','U'];return `<section><h4>计数工作盘${index+1}${task.kind==='twoWays'?' · 一盘直接、一盘从全集间接':''}</h4><p>实际动作${row.ops.map((op,i)=>(i?op.sign===1?'＋':'－':'')+setsLabel(task,op.key)).join(' ')||'尚未添计数'}</p><div class="sets-quantity-cards">${cards.map(key=>`<div class="sets-quantity-card ${key}"><b>${esc(setsLabel(task,key))} · ${setsMembers(task,key).length}人</b><div class="sets-card-members">${task.people.filter(p=>setsBelongs(p,key)).map(p=>`<i class="${p.group}">${p.id}</i>`).join('')||'<span>空集合</span>'}</div><button data-action="setsApply" data-row="${index}" data-key="${key}" data-sign="1">添这些身份的一次计数</button><button data-action="setsApply" data-row="${index}" data-key="${key}" data-sign="-1">移去这些身份的一次计数</button></div>`).join('')}</div>${setsCounted(task,tally)}${setsAmount(task,w,'answer','我填目标人数',index)}</section>`}).join('')}
function setsDedup(task,w){return `<section><h4>叠完整名单，再移多算的一次</h4><div class="work-buttons">${['A','B'].map(key=>`<button data-action="setsAddList" data-key="${key}" ${w.added.includes(key)?'disabled':''}>叠${esc(setsLabel(task,key))}名单</button>`).join('')}</div>${setsCounted(task,w.correction)}<div class="sets-cards">${task.people.map(p=>`<button data-action="setsTrim" data-id="${p.id}" ${(w.correction[p.id]||0)>1?'':'disabled'}>移去${esc(p.name)}(${p.id})多算的一次</button>`).join('')}</div>${setsAmount(task,w,'answer','我填目标不同人数')}</section>`}
function setsBoard(task){const w=setsState(task);return `<div class="board sets-board"><h3>${esc(task.context)}</h3><div class="work-buttons"><button data-action="setsUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${setsRegistry(task,w)}${setsRegionBoard(task,w)}${task.outside?.length?`<section class="sets-outside" aria-label="规定全集之外的对象"><h4>边框外：不属于${esc(task.universeLabel||'本题全集')}</h4><p>这些可见对象不在本题全集中。</p>${task.outside.map(p=>`<span data-person-id="${esc(p.id)}">${esc(p.name)} · ${esc(p.id)}</span>`).join('')}</section>`:''}${setsQueries(task,w)}${task.kind==='partition'?task.countKeys.map(key=>setsAmount(task,w,key,setsLabel(task,key)+'人数')).join(''):''}${['identity','partition','universe'].includes(task.kind)?setsAmount(task,w,'answer',task.kind==='identity'||task.kind==='universe'?'我填全体不同身份数':'我填'+setsLabel(task,task.target)+'人数'):''}${['formula','complement','twoWays'].includes(task.kind)?setsRows(task,w):''}${task.kind==='dedup'?setsDedup(task,w):''}</div>`}
function setsRouteCategory(ops){const keys=ops.map(o=>o.key);if(keys.includes('U'))return 'indirect';if(keys.includes('A')&&keys.includes('B'))return 'twoGroups';if(keys.includes('A')||keys.includes('B'))return 'wholeAndParts';return 'partition'}
function setsGrade(task){const w=setsState(task),same=(a,b)=>a.length===b.length&&b.every(v=>a.includes(v)),registered=task.people.every(p=>same(w.registry[p.id]||[],setsFlags(p))&&w.zones[p.id]===p.group),queryOk=!task.queries||task.queries.every(key=>{const expected=setsMembers(task,key);return same(w.marks[key]||[],expected)&&(expected.length?!w.empty[key]:!!w.empty[key])}),target=task.target||'U',expected=setsMembers(task,target).length;let ok=registered&&queryOk&&[...Object.keys(w.registry),...Object.keys(w.zones)].every(id=>task.people.some(p=>p.id===id));
 if(['identity','universe','partition'].includes(task.kind))ok=ok&&w.answer===expected;
 if(task.kind==='partition')ok=ok&&task.countKeys.every(key=>w.counts[key]===setsMembers(task,key).length);
 if(['formula','complement','twoWays'].includes(task.kind)){const rows=w.rows.slice(0,task.kind==='complement'?1:2);ok=ok&&rows.every(row=>row.ops.length>0&&setsCoverage(task,setsTally(task,row.ops),target)&&row.answer===expected);if(task.kind==='formula')ok=ok&&new Set(rows.map(row=>setsRouteCategory(row.ops))).size===2;if(task.kind==='twoWays')ok=ok&&rows.some(row=>setsRouteCategory(row.ops)==='indirect')&&rows.some(row=>setsRouteCategory(row.ops)!=='indirect')}
 if(task.kind==='dedup')ok=ok&&same(w.added,['A','B'])&&setsCoverage(task,w.correction,target)&&w.answer===expected;
 return {ok,incomplete:w.moves===0,reason:'按原身份登记全部名册并归到真实区域。所问集合与全集分别核对；每个目标身份的计数应恰好一次，目标外为零，数字碰巧相同不能替代语义。'};
}
function setsAct(action,data,task){const w=setsState(task),before=JSON.stringify({...w,log:[]}),p=task.people.find(p=>p.id===data.id),key=data.key,row=Number(data.row),delta=Number(data.delta);let changed=false;
 if(action==='setsRegister'&&p&&setsFlags(p).includes(data.flag)){const flags=w.registry[p.id]??=[];if(!flags.includes(data.flag)){flags.push(data.flag);w.active=p.id;changed=true}}
 if(action==='setsActor'&&p&&w.registry[p.id]){if(w.mode==='query'&&task.queries?.includes(w.query)){const marks=w.marks[w.query]??=[],at=marks.indexOf(p.id);at<0?marks.push(p.id):marks.splice(at,1);w.empty[w.query]=false}else w.active=w.active===p.id?'':p.id;changed=true}
 if(action==='setsPlace'&&w.active&&task.people.some(p=>p.id===w.active)&&['R','O','Y','N'].includes(data.zone)){w.zones[w.active]=data.zone;w.active='';changed=true}
 if(action==='setsMode'&&['move','query'].includes(data.value)){w.mode=data.value;w.active='';changed=true}
 if(action==='setsQuery'&&task.queries?.includes(key)){w.query=key;w.mode='query';w.active='';changed=true}
 if(action==='setsEmpty'&&task.queries?.includes(w.query)){w.empty[w.query]=!w.empty[w.query];if(w.empty[w.query])w.marks[w.query]=[];changed=true}
 if(action==='setsAmount'&&[-1,1,5,10].includes(delta)){if(data.row!==undefined&&Number.isInteger(row)&&row>=0&&row<w.rows.length&&w.rows[row].answer+delta>=0&&w.rows[row].answer+delta<=60){w.rows[row].answer+=delta;changed=true}else if(data.row===undefined&&['answer','R','O','Y','N'].includes(key)){const value=key==='answer'?w.answer:w.counts[key];if(value+delta>=0&&value+delta<=60){key==='answer'?w.answer+=delta:w.counts[key]+=delta;changed=true}}}
 if(action==='setsApply'&&['formula','complement','twoWays'].includes(task.kind)&&Number.isInteger(row)&&row>=0&&row<(task.kind==='complement'?1:2)&&['R','O','Y','N','A','B','U'].includes(key)&&[1,-1].includes(Number(data.sign))&&w.rows[row].ops.length<7){const sign=Number(data.sign),tally=setsTally(task,w.rows[row].ops);if(sign===1||setsMembers(task,key).every(id=>tally[id]>=1)){w.rows[row].ops.push({key,sign});changed=true}}
 if(action==='setsAddList'&&task.kind==='dedup'&&['A','B'].includes(key)&&!w.added.includes(key)){w.added.push(key);for(const id of setsMembers(task,key))w.correction[id]=(w.correction[id]||0)+1;changed=true}
 if(action==='setsTrim'&&task.kind==='dedup'&&p&&(w.correction[p.id]||0)>1){w.correction[p.id]--;changed=true}
 if(action==='setsUndo'&&w.log.length){const log=w.log,snapshot=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,snapshot,{log,moves});return true}
 if(changed){w.log.push(before);w.moves++;return true}return false;
}
function setsSpeech(task){const w=setsState(task);return `已登记${Object.keys(w.registry).length}个不同编号。`+['R','O','Y','N'].map(key=>`${setsLabel(task,key)}实际归位${task.people.filter(p=>w.zones[p.id]===key).map(p=>p.name+'编号'+p.id).join('、')||'无'}`).join('；')+`；当前圈${setsLabel(task,w.query)}，选${(w.marks[w.query]||[]).join('、')||'无'}。`+(['formula','complement','twoWays'].includes(task.kind)?w.rows.map((r,i)=>`工作盘${i+1}动作${r.ops.map(op=>(op.sign===1?'添':'移')+setsLabel(task,op.key)).join('、')||'无'}，填写${r.answer}`).join('；'):`填写${w.answer}。`)}
function setsPage(){const task=SETS_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 原身份、分区与计数</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><span class="phase">练 · 操作一题</span><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${setsBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>先定身份与范围</h3><p class="muted">完整组包含共同区域；全集可包含两项都不的人。人数卡实际作用到原人物，最后逐身份核对一次；动作可撤回。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={setsBelongs,setsFlags,setsMembers,setsTally,setsCoverage,setsRouteCategory};

'use strict';
function combinPair(name,first,second,options={}){return {type:'pair',name,first:first.map(id=>({id,label:id})),second:second.map(id=>({id,label:id})),...options}}
function combinOrder(name,ids,size,ordered=true,options={}){return {type:'order',name,items:ids.map(id=>({id,label:id})),size,ordered,repeat:false,...options}}
const COMBIN_TASKS={
 'C02.01':{kind:'group',models:[combinPair('上衣与帽子',['红衣','蓝衣','绿衣'],['白帽','黄帽'])],prompt:'逐个摆上衣、帽子卡并收录搭配。先选一个上衣分组，再把该上衣的全部搭配放进这一组，直到每组列全。',explain:'每个首选择分别配两种帽子；三组互不重复，共6种。'},
 'C02.02':{kind:'pair',models:[combinPair('午餐套餐',['饭','面'],['汤','奶','水'])],prompt:'套餐要主食与饮品各选一件。亲手把两类卡放进选择位，记录每个不同搭配，最后填写总数。',explain:'两个选择步骤，每种主食都有三种饮品搭配，共6种。'},
 'C02.03':{kind:'complete',models:[combinPair('车站路线',['A站','B站','C站'],['东线','西线'],{seed:[['A站','东线'],['A站','西线'],['B站','东线']]})],prompt:'当前路线表只收录了部分搭配。用卡补足全部“起点站＋线路”，保留正确记录，删除重复或不合条件项，填写不同路线数。',explain:'检查每个起点的所有线路，不能只把已有行数当全部；共6条。'},
 'C02.04':{kind:'dedup',models:[combinPair('饮料与杯型',['茶','奶'],['圆杯','方杯'],{seed:[['茶','圆杯'],['茶','圆杯'],['茶','方杯'],['奶','圆杯']]})],prompt:'记录中有重复搭配。逐行核对具体两张卡，删去多算的一行，补上漏掉的搭配，再填写不同搭配数。',explain:'同一两类选择只是一种结果；茶圆杯只保留一次，共4种。'},
 'C02.05':{kind:'rule',models:[combinPair('先选活动再选时段',['游泳','绘画'],['上午','下午','晚上'],{forbidden:[['游泳','晚上']]})],prompt:'游泳只有上午、下午；绘画三个时段都开放。摆卡列全实际可用报名方案，选择适用计数条件并填写总数。',explain:'分支可选数不同，用2＋3＝5；不能机械用2×3。'},
 'C03.01':{kind:'orderMeaning',models:[combinOrder('前后站位',['安','贝'],2,true),combinOrder('无序搭档',['安','贝'],2,false)],prompt:'同样两人，分别摆出全部前后站位和全部无序搭档。收录两盘结果并填各盘总数，判断交换前后是否产生新结果。',explain:'站位安贝与贝安不同，共2；搭档两人相同，共1。'},
 'C03.02':{kind:'queue',models:[combinOrder('三人队列',['安','贝','晨'],3,true)],prompt:'把三张不同人卡逐张摆进前、中、后位，记录全部不同队列。不许同一人在一个队列重复出现，填写队列数。',explain:'按首位分三组，每组后两人能交换，共6队。'},
 'C03.03':{kind:'choose',models:[combinOrder('三选二搭档',['安','贝','晨'],2,false)],prompt:'从三人选两人当搭档，逐张摆卡并记录全部不同组。安贝和贝安是同一组；删除多算的记录，再填写组数。',explain:'安贝、安晨、贝晨共3组；组内顺序不重要。'},
 'C03.04':{kind:'limit',models:[combinOrder('安必须在首位',['安','贝','晨'],3,true,{fixed:{0:'安'}})],prompt:'三人排队，安必须在第一位。摆卡记录全部符合条件的队列，剔除不合条件的记录，填写种数。',explain:'安固定后，其余两人的顺序可交换，共2种。'},
 'C03.05':{kind:'system',models:[combinOrder('三选二前后位',['安','贝','晨'],2,true)],prompt:'从三人选不同的两人站前后位。按第一位的人分组，亲手列全每组队列，检查无漏无重复，填写总数。',explain:'每个首位都有其余两人可作第二位，三组共6种。'}
};
for(const [skillId,t] of Object.entries(COMBIN_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,contentVersion:55,mode:'combinLab',phase:'练',context:'摆卡、收录与实际列举',hint:'先选分组，再逐张摆卡收录具体结果。逐组检查遗漏、重复和限制。',reason:{prompt:'怎样证明这盘结果已经列全且没有重数？',options:['每个首选择的可行后续都逐一检查，同一具体结果只留一次，并遵守本题顺序和限制','已有行数刚好等于心算答案，就不必检查具体结果','任何选择题都用两个数字相乘'],answer:0}});
if(typeof module!=='undefined')module.exports={COMBIN_TASKS,combinPair,combinOrder};

'use strict';
const combinFactories=typeof module!=='undefined'?require('./combin'):{combinPair,combinOrder},cp=combinFactories.combinPair,co=combinFactories.combinOrder;
const COMBIN_CASES={
 'C02.01':[
  [[cp('帽子先选、上衣后选',['白帽','黄帽'],['红衣','蓝衣','绿衣'])],'把3×2改为2×3，按帽子分组列全搭配。','两组各三项，共6；交换分组方向仍对应同一批搭配。','首选择与表格方向互换'],
  [[cp('带限制的午餐',['饭','面','饺'],['茶','汤'],{forbidden:[['面','茶']]})],'独立按主食分组，列全可售套餐；面不配茶。','每组2、1、2，共5。','无提示：禁配使分支不等'],
  [[cp('两出发点三终点',['东门','西门','南门'],['湖','山','桥'],{forbidden:[['东门','山'],['西门','桥']]})],'隔日按三个出发点分组，列全可走路线；东门不能去山，西门不能去桥。','2＋2＋3＝7条合法路线。','隔日：衣帽改路线'],
  [[cp('报名时段',['阅读','绘画'],['早','午','晚'],{forbidden:[['阅读','午'],['阅读','晚']]})],'独立按活动分组列全开放报名，阅读只在早上，绘画三个时段。','1＋3＝4。','备用：分支数1与3']
 ],
 'C02.02':[
  [[cp('编码',['A','B','C'],['1','2'])],'字母先写、数字后写。逐张摆卡记录全部两位编码。','3×2＝6，每格一个字母数字结果。','实物套餐改有序编码'],
  [[cp('制服配色',['红','蓝'],['白','黑','黄'],{forbidden:[['红','黑']]})],'独立列全可用制服搭配；红色不能配黑色。','2＋3＝5。','无提示：受限搭配'],
  [[cp('去回路线',['东去','西去'],['东回','西回'])],'隔日先选去路再选回路，允许同一路方向往返，摆卡列全。','四种具体去回组合。','隔日：两个步骤同一类但角色不同'],
  [[cp('封面插画',['圆','方'],['花','树','草','云'],{forbidden:[['方','云']]})],'独立摆两种封面形状和四种插画，方形不能配云，收录全部合法设计。','4＋3＝7种合法设计。','备用：设计情境与选择方向']
 ],
 'C02.03':[
  [[cp('票种与日期',['成人','儿童'],['周一','周二','周三'],{seed:[['成人','周一'],['儿童','周二']]})],'补齐现有部分售票表，逐格核对所有票种和日期。','6种，已列2种还缺4种。','稀疏表与反向分组'],
  [[cp('受限编码',['A','B'],['1','2','3'],{forbidden:[['B','1']],seed:[['A','1'],['A','2'],['B','2']]})],'独立补全所有可用编码，B1不允许。','A三项、B两项，共5。','无提示：漏项与禁项并存'],
  [[cp('餐点',['粥','饭','面'],['水','奶'],{seed:[['饭','水'],['面','奶']]})],'隔日补全现有菜单的所有搭配，只有两条已记录。','共6种。','隔日：不同缺格位置'],
  [[cp('单一后续',['东','中','西'],['桥'],{seed:[['中','桥']]})],'独立补全三个起点到桥的路线记录。','3种，不因只有一个后续而漏首选择。','备用：一列搭配表']
 ],
 'C02.04':[
  [[cp('票表',['早','晚'],['成人','儿童'],{seed:[['早','成人'],['晚','儿童'],['晚','儿童']]})],'逐行去重并补齐全部时段票种。','4种，重复行只移一次。','重复在不同首组且有两个缺格'],
  [[cp('两条线路',['A','B','C'],['桥'],{seed:[['A','桥'],['A','桥'],['B','桥'],['C','桥']]})],'独立修正路线表的重复；正确条目都要保留。','3条不同路线，不删除最后一条A桥。','无提示：一列且全部已经出现'],
  [[cp('受限套餐',['面','饭'],['茶','奶'],{forbidden:[['面','茶']],seed:[['面','茶'],['饭','茶'],['饭','茶']]})],'隔日删禁售和重复条目，再补全全部可售套餐。','3种，禁售项与重数不是同一种错误。','隔日：非法条目与重复同时出现'],
  [[cp('形状与颜色',['圆','方'],['红','蓝','绿'],{seed:[['圆','红'],['圆','红'],['圆','红'],['方','绿']]})],'独立保留每种设计一次，补全形状颜色搭配。','6种，三次圆红只能留下1次。','备用：同一结果重复三次']
 ],
 'C02.05':[
  [[cp('室内方案',['棋','画'],['早','晚']),cp('室外方案',['跑步'],['午'])],'报名只能在室内或室外两类互斥方案中选一个。列全两盘并选择合并规则。','室内4＋室外1＝5；两类择一相加。','两个互斥方案相加，而非顺序相乘'],
  [[cp('非均匀课程',['游泳','阅读','绘画'],['早','午'],{forbidden:[['游泳','午']]})],'独立列全开放课程时段，游泳仅早，其余均可早午，选择计数条件。','1＋2＋2＝5，各分支数不同。','无提示：不等分支反例'],
  [[cp('顺序选件',['圆','方','三角'],['红','蓝'])],'隔日每个形状可选任一颜色；列全并选择适用规则。','相同后续数，3×2＝6。','隔日：具备乘法条件'],
  [[cp('步行方案',['东门'],['桥','山']),cp('乘车方案',['公交','地铁'],['湖'])],'独立任选一个步行或乘车方案，列全两盘再选合并计数条件。','2＋2＝4，两盘互斥择一。','备用：两类各内部搭配但整体相加']
 ],
 'C03.01':[
  [[co('两位密码',['1','2'],2,true,{repeat:true}),co('抽两种不同数卡',['1','2'],2,false)],'分别列全允许重复的两位密码与不重复的两张卡组，比较交换含义。','密码11/12/21/22共4；数卡组12仅1。','顺序与重复许可同时明示'],
  [[co('前后选两人',['甲','乙','丙'],2,true),co('两人搭档',['甲','乙','丙'],2,false)],'独立列全前后两位和无序搭档各盘，填写数目及交换前后是否算新结果。','前后6，搭档3。','无提示：有序选择与无序子集'],
  [[co('三人站位',['A','B','C'],3,true),co('三人一组',['A','B','C'],3,false)],'隔日同样三人分别排位与组队，列全结果并判断顺序。','6种站位、1组。','隔日：全选时顺序差别仍存在'],
  [[co('三个不同职务',['甲','乙','丙','丁'],3,true),co('三位委员',['甲','乙','丙','丁'],3,false)],'独立从四人选三人，分别担任三个不同职务或成为三位无序委员，列全结果。','24种职务分配，4个委员组。','备用：角色明确区别顺序']
 ],
 'C03.02':[
  [[co('前后两位',['A','B','C','D'],2,true)],'四人选不同两人站前后，摆卡列全队列。','4×3＝12。','三人全排改四人部分排'],
  [[co('两位密码',['0','1'],2,true,{repeat:true})],'独立列全允许重复的两位编码，0也允许在首位。','00、01、10、11，共4。','无提示：重复可用且首位零允许'],
  [[co('三位数',['0','1','2'],3,true,{noLeading:'0'})],'隔日用0、1、2各一次组成三位数，0不能在百位，列全。','102、120、201、210，共4。','隔日：首位限制与数位角色'],
  [[co('四选三座位',['红','蓝','绿','黄'],3,true)],'独立从四张不同原卡选择三张放左中右座位，不允许重复使用，列全结果。','4×3×2＝24。','备用：队列改座位']
 ],
 'C03.03':[
  [[co('四选二小队',['A','B','C','D'],2,false)],'四人选两人组队，摆卡列全不同无序小队。','6组，每一对只留一次。','三选二改四选二'],
  [[co('四选三',['甲','乙','丙','丁'],3,false)],'独立列全三人组，组内顺序不产生新组。','4组，每组可由没选谁区分。','无提示：组大小变化'],
  [[co('必须有甲的搭档',['甲','乙','丙','丁'],2,false,{include:'甲'})],'隔日列全两人搭档，但每组必须有甲。','甲乙、甲丙、甲丁，共3。','隔日：无序选择加指定成员'],
  [[co('三种一选',['苹果','梨','桃'],1,false)],'独立每次只选一种水果，列全不同的一件组。','3种，单元素不受排列影响。','备用：单元素边界']
 ],
 'C03.04':[
  [[co('甲乙相邻',['甲','乙','丙'],3,true,{adjacent:['甲','乙']})],'三人排队，甲乙必须相邻但先后不限，摆卡列全。','甲乙丙、乙甲丙、丙甲乙、丙乙甲，共4。','固定位置改相邻限制'],
  [[co('丙固定中间',['甲','乙','丙'],3,true,{fixed:{1:'丙'}})],'独立列全丙在中间的三人队列。','甲丙乙、乙丙甲，共2。','无提示：固定首位改固定中位'],
  [[co('甲乙不能相邻',['甲','乙','丙'],3,true,{separate:['甲','乙']})],'隔日列全甲乙不相邻的三人队列。','甲丙乙、乙丙甲，共2。','隔日：相邻改不相邻'],
  [[co('四人首位甲',['甲','乙','丙','丁'],3,true,{fixed:{0:'甲'}})],'独立从四人选三人排队，甲必须首位，列全。','后两位由三人选不同两人，共6。','备用：限制与部分排列组合']
 ],
 'C03.05':[
  [[co('无序小队',['A','B','C','D'],2,false)],'按组内编号最小的人分组，列全四选二不同小队。','A组3、B组2、C组1，共6。','系统分组从第一位改无序最小编号'],
  [[co('两位可重复编码',['A','B'],2,true,{repeat:true})],'独立按第一位分组，列全允许重复的两位编码。','A组2、B组2，共4。','无提示：系统列举允许重复'],
  [[co('首位不能0',['0','1','2'],2,true,{noLeading:'0'})],'隔日各卡最多用一次组成两位数，按首位分组列全，首位不得0。','10、12、20、21，共4。','隔日：首选择中有不可用项'],
  [[co('必须有乙的小队',['甲','乙','丙','丁'],2,false,{include:'乙'})],'独立按组内本题名册顺序最早的人分组，列全包含乙的两人小队。','甲乙、乙丙、乙丁，共3。','备用：无序限制与分组基准']
 ]
};
const combinSource=typeof module!=='undefined'?require('./combin').COMBIN_TASKS:COMBIN_TASKS,combinTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(COMBIN_CASES)){combinTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [models,prompt,explain,changeDimension]=cases[i];combinTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'combinLab',contentVersion:['C02.01:2','C02.02:3','C03.01:3','C03.02:3'].includes(skillId+':'+i)?71:56,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',kind:combinSource[skillId].kind,models,prompt,explain,changeDimension,context:'实际结果列举',...(stage==='transfer'?{hint:'按本题的首选择或无序组最早成员分组，每个可行后续检查一遍。'}:{})}}}
if(typeof module!=='undefined')module.exports={COMBIN_CASES};

'use strict';
function combinItems(m){return m.type==='pair'?m.first:m.items}
function combinCanonical(m,tuple){return m.type==='order'&&!m.ordered?[...tuple].sort((a,b)=>m.items.findIndex(p=>p.id===a)-m.items.findIndex(p=>p.id===b)):[...tuple]}
function combinValid(m,tuple){if(m.type==='pair')return tuple.length===2&&m.first.some(p=>p.id===tuple[0])&&m.second.some(p=>p.id===tuple[1])&&!(m.forbidden||[]).some(p=>JSON.stringify(p)===JSON.stringify(tuple));if(tuple.length!==m.size||!tuple.every(id=>m.items.some(p=>p.id===id))||!m.repeat&&new Set(tuple).size!==tuple.length)return false;if(m.noLeading&&tuple[0]===m.noLeading||m.include&&!tuple.includes(m.include))return false;if(Object.entries(m.fixed||{}).some(([slot,id])=>tuple[Number(slot)]!==id))return false;for(const [key,want] of [['adjacent',true],['separate',false]])if(m[key]){const [a,b]=m[key],i=tuple.indexOf(a),j=tuple.indexOf(b);if(i<0||j<0||((Math.abs(i-j)===1)!==want))return false}return true}
function combinAll(m){const output=[],seen=new Set();function visit(tuple){const n=m.type==='pair'?2:m.size;if(tuple.length===n){if(combinValid(m,tuple)){const c=combinCanonical(m,tuple),key=JSON.stringify(c);if(!seen.has(key)){seen.add(key);output.push(c)}}return}const options=m.type==='pair'?(tuple.length?m.second:m.first):m.items;for(const p of options)visit([...tuple,p.id])}visit([]);return output}
function combinRule(task){if(task.models.length>1)return 'sum';const m=task.models[0];return m.type==='pair'&&m.first.every(a=>m.second.filter(b=>combinValid(m,[a.id,b.id])).length===m.second.length)?'product':'branches'}
function combinState(task){return draft.work??(draft.work={models:task.models.map(m=>({slots:Array(m.type==='pair'?2:m.size).fill(''),slot:0,bin:'',records:(m.seed||[]).map((tuple,i)=>({id:'R'+(i+1),tuple:[...tuple],bin:combinCanonical(m,tuple)[0]})),serial:(m.seed||[]).length,answer:0,order:''})),rule:'',moves:0,log:[]})}
function combinConstraints(m){if(m.type==='pair')return `两类各选一件。${m.forbidden?.length?'禁止搭配：'+m.forbidden.map(p=>p.join('＋')).join('、'):'每个首选择均可配任一后续'}`;return `${m.size}个位置；${m.ordered?'位置/角色不同算不同结果':'组内换序算同一组'}；${m.repeat?'允许同卡重复使用':'每张卡最多一次'}。${m.noLeading?'首位不能'+m.noLeading+'。':''}${m.include?'必须包含'+m.include+'。':''}${Object.entries(m.fixed||{}).map(([i,id])=>id+'固定第'+(Number(i)+1)+'位。').join('')}${m.adjacent?'必须相邻：'+m.adjacent.join('与')+'。':''}${m.separate?'不得相邻：'+m.separate.join('与')+'。':''}`}
function combinBoard(task){const w=combinState(task);return `<div class="board combin-board"><h3>${esc(task.context)}</h3><div class="work-buttons"><button data-action="combinUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${task.models.map((m,index)=>{const s=w.models[index],items=combinItems(m),groups=items.map(p=>p.id);return `<section class="combin-model"><h4>${esc(m.name)}</h4><p>${esc(combinConstraints(m))}</p><div class="work-buttons"><b>收录分组 ${m.type==='order'&&!m.ordered?'（按名册顺序最早成员）':'（按第一选择）'}</b>${groups.map(id=>`<button data-action="combinBin" data-index="${index}" data-id="${esc(id)}" aria-pressed="${s.bin===id}">${esc(id)}组</button>`).join('')}</div><div class="combin-slots">${s.slots.map((id,slot)=>`<button data-action="combinSlot" data-index="${index}" data-slot="${slot}" aria-pressed="${s.slot===slot}">位置${slot+1}<b>${esc(id||'待摆卡')}</b></button>`).join('')}</div>${(m.type==='pair'?[m.first,m.second]:[m.items]).map((cards,list)=>`<div class="work-buttons"><b>${m.type==='pair'?'第'+(list+1)+'类':'原卡'}</b>${cards.map(p=>`<button data-action="combinCard" data-index="${index}" data-id="${esc(p.id)}" ${m.type==='pair'?`data-list="${list}"`:''} aria-label="把${esc(p.label)}放进选择位">${esc(p.label)}</button>`).join('')}</div>`).join('')}<div class="work-buttons"><button data-action="combinRecord" data-index="${index}" ${s.slots.every(Boolean)&&s.bin?'':'disabled'}>把实际卡组收录进所选分组</button><button data-action="combinClear" data-index="${index}">取回选择位卡片</button></div><div class="combin-table">${groups.map(id=>`<section><h5>${esc(id)}组</h5>${s.records.filter(r=>r.bin===id).map(r=>`<div class="combin-record" data-record-id="${r.id}"><span>${r.tuple.map(esc).join(m.ordered||m.type==='pair'?' → ':'、')}</span><button data-action="combinDelete" data-index="${index}" data-id="${r.id}" aria-label="删除具体记录${esc(r.tuple.join('、'))}">移去这一条</button></div>`).join('')||'<p>尚无记录</p>'}</section>`).join('')}</div><div class="work-buttons"><b>我的不同结果总数 ${s.answer}</b><button data-action="combinAmount" data-index="${index}" data-delta="-1" ${s.answer?'':'disabled'}>－1</button><button data-action="combinAmount" data-index="${index}" data-delta="1">＋1</button><button data-action="combinAmount" data-index="${index}" data-delta="5">＋5</button></div>${task.kind==='orderMeaning'?`<div class="work-buttons"><b>交换角色/位置会产生新结果吗？</b><button data-action="combinOrder" data-index="${index}" data-value="yes" aria-pressed="${s.order==='yes'}">会</button><button data-action="combinOrder" data-index="${index}" data-value="no" aria-pressed="${s.order==='no'}">不会</button></div>`:''}</section>`}).join('')}${task.kind==='rule'?`<div class="work-buttons"><b>本题合计条件</b>${[['product','顺序选择，每个首项的后续数相同：相乘'],['sum','互斥方案择一：各类相加'],['branches','同一流程的分支数不同：逐分支相加']].map(([key,label])=>`<button data-action="combinRule" data-value="${key}" aria-pressed="${w.rule===key}">${label}</button>`).join('')}</div>`:''}</div>`}
function combinGrade(task){const w=combinState(task);const ok=task.models.every((m,i)=>{const s=w.models[i],expected=combinAll(m),keys=s.records.map(r=>JSON.stringify(combinCanonical(m,r.tuple)));return s.records.length===expected.length&&new Set(keys).size===expected.length&&s.records.every(r=>combinValid(m,r.tuple)&&r.bin===combinCanonical(m,r.tuple)[0])&&expected.every(tuple=>keys.includes(JSON.stringify(tuple)))&&s.answer===expected.length&&(task.kind!=='orderMeaning'||s.order===(m.ordered?'yes':'no'))})&&(task.kind!=='rule'||w.rule===combinRule(task));return {ok,incomplete:w.moves===0,reason:'逐个核对具体结果，不只看行数。按第一选择（无序组按名册最早成员）分组；每个可行结果恰好收录一次、无非法卡组，并按本题顺序和分支条件计数。'}}
function combinAct(action,data,task){const w=combinState(task),snapshot=JSON.stringify({...w,log:[]}),index=Number(data.index),m=task.models[index],s=w.models[index],slot=Number(data.slot),delta=Number(data.delta);let changed=false;
 if(action==='combinBin'&&m&&combinItems(m).some(p=>p.id===data.id)){s.bin=data.id;changed=true}
 if(action==='combinSlot'&&s&&Number.isInteger(slot)&&slot>=0&&slot<s.slots.length){s.slot=slot;changed=true}
 if(action==='combinCard'&&m){const at=m.type==='pair'?Number(data.list):s.slot,cards=m.type==='pair'?(at===0?m.first:at===1?m.second:[]):m.items;if(cards.some(p=>p.id===data.id)&&Number.isInteger(at)&&at>=0&&at<s.slots.length){if(m.type==='order'&&!m.repeat){const prior=s.slots.indexOf(data.id);if(prior>=0&&prior!==at)s.slots[prior]=''}s.slots[at]=data.id;changed=true}}
 if(action==='combinRecord'&&m&&s.slots.every(Boolean)&&combinItems(m).some(p=>p.id===s.bin)&&s.records.length<40){s.records.push({id:'R'+(++s.serial),tuple:[...s.slots],bin:s.bin});s.slots.fill('');changed=true}
 if(action==='combinClear'&&s&&s.slots.some(Boolean)){s.slots.fill('');changed=true}
 if(action==='combinDelete'&&s){const at=s.records.findIndex(r=>r.id===data.id);if(at>=0){s.records.splice(at,1);changed=true}}
 if(action==='combinAmount'&&s&&[-1,1,5].includes(delta)&&s.answer+delta>=0&&s.answer+delta<=60){s.answer+=delta;changed=true}
 if(action==='combinOrder'&&s&&['yes','no'].includes(data.value)){s.order=data.value;changed=true}
 if(action==='combinRule'&&task.kind==='rule'&&['sum','product','branches'].includes(data.value)){w.rule=data.value;changed=true}
 if(action==='combinUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});return true}
 if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function combinSpeech(task){const w=combinState(task);return task.models.map((m,i)=>`${m.name}；当前卡位${w.models[i].slots.join('、')||'空'}；已收录${w.models[i].records.length}条：${w.models[i].records.map(r=>r.bin+'组 '+r.tuple.join('、')).join('；')||'无'}；填写${w.models[i].answer}`).join('。')}
function combinPage(){const task=COMBIN_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!task||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(task.skillId)} · 列举</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(task.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(task.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${combinBoard(task)}${reasonBlock(task)}${actionRow(task)}</article><aside class="side-stack"><section class="panel"><h3>逐组核对结果</h3><p>收录的是亲手摆出的具体卡组。允许自行选择列举次序；总数相同但有漏项、重复或违反限制仍需修改。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={combinItems,combinCanonical,combinValid,combinAll,combinRule};

'use strict';
function chartBars(labels,values,gap=2,unit='本',extra={}){const max=Math.ceil(Math.max(...values)/gap)+1;return {labels,values,gap,unit,ticks:Array.from({length:max+1},(_,i)=>i*gap),...extra}}
function chartIcons(labels,icons,legend=2,unit='人'){return {labels,icons,legend,unit,values:icons.map(n=>n*legend)}}
function chartLine(points,threshold,relation='above',timeStep=1){return {points,threshold,relation,timeStep,unit:'分钟',valueUnit:'厘米',values:[]}}
const CHART_TASKS={
 'D01.01':{kind:'legend',...chartIcons(['甲班','乙班'],[3,2],2),prompt:'图例中一个完整图标代表2人。逐个拆开实际图标，把生成的单位点移到对应班级的计数盘，再填写各班人数。',explain:'甲班3个图标拆成6人，乙班2个拆成4人；图标数不是人数。'},
 'D01.02':{kind:'read',...chartBars(['阅读','绘画'],[6,10],2,'分钟'),prompt:'按柱图读两项活动用时。先在每根柱顶标出对应刻度，再填写数值并选择单位。',explain:'每相邻刻度差2分钟，柱顶为6与10分钟；不能写成6人/10人。'},
 'D01.03':{kind:'ticks',...chartBars(['甲'],[10],2,'件'),prompt:'纵轴各刻度等距，底端0、顶端12已给出。逐个把数值卡放到中间刻度，建立完整量尺。',explain:'6个相等间隔对应12件，每间隔2件；0、2、4、6、8、10、12。'},
 'D01.04':{kind:'build',...chartBars(['苹果','梨','桃'],[4,8,6],2,'个'),prompt:'根据表格亲手画柱：每格代表2个。选一类后逐格添柱或取回柱块；填写各类数量和单位。',explain:'4、8、6分别画2、4、3格；柱从0基线连续堆起。'},
 'D01.05':{kind:'convert',direction:'read',...chartBars(['红队','蓝队','绿队'],[10,15,5],5,'分'),prompt:'把每格5分的柱图转成表格。标出各柱顶刻度，把读出的数据填到对应表行并选单位。',explain:'对应队名填10、15、5分，不能把柱块数2、3、1当分数。'},
 'D01.06':{kind:'interval',...chartLine([[0,2],[2,6],[4,2],[6,6],[8,2]],4),prompt:'折线表示水位随时间变化，两点间直线变化。圈出水位高于4厘米的所有时间小段，累计这些不连续区间的分钟数，再选择单位。',explain:'1–3与5–7分钟高于4厘米，共2＋2＝4分钟；首末之间不是全都符合。'}
};
for(const [skillId,t] of Object.entries(CHART_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'chartLab',contentVersion:57,phase:'练',context:'真实图例、量尺与时间区间',hint:'先读图例、轴单位和刻度差，再操作对应图形。时间小段按整段值是否符合条件判断；端点瞬间不增加时长。',reason:{prompt:'什么证据能支持这题的读图结果？',options:['图例/轴单位与等距刻度相符，实际柱或单位点匹配数据；累计时间只加符合条件的实际区间','只比较图中图标数或柱块数就能确定原数据','从第一次到最后一次符合时刻之间全都算进去'],answer:0}});
if(typeof module!=='undefined')module.exports={CHART_TASKS,chartBars,chartIcons,chartLine};

'use strict';
const chartFactory=typeof module!=='undefined'?require('./chart'):{chartBars,chartIcons,chartLine},cb=chartFactory.chartBars,ci=chartFactory.chartIcons,cl=chartFactory.chartLine;
const CHART_CASES={
 'D01.01':[
  [ci(['篮球','足球'],[2,3],3,'球'),'每个图标代表3球。实际拆图标、移单位点后填数量。','6球、9球。','图例由2变3，人物改物品'],
  [ci(['甲队','乙队','丙队'],[1,0,4],2,'人'),'独立拆图标移点计数并填人数；没有图标的队也填0。','2、0、8人。','无提示：零图标与三组'],
  [ci(['上午','下午'],[3,1],4,'份'),'隔日一个图标代表4份，拆图标移点计数，填两时段份数。','12份、4份。','隔日：图例4与时间类别'],
  [ci(['红','蓝'],[2,4],1,'件'),'独立按一个图标1件实际拆移并填数量。','2件、4件；只有图例1时图标数等于数量。','备用：一图标一件边界']
 ],
 'D01.02':[
  [cb(['铅笔','尺子'],[15,10],5,'支'),'读每格5支的柱图，标柱顶、填数并选单位。','15支、10支。','非1刻度与计数单位'],
  [cb(['散步','跑步'],[4,8],2,'千米'),'独立读路程柱图，标出柱顶刻度并填对应单位数值。','4千米、8千米。','无提示：数量改长度单位'],
  [cb(['甲组','乙组','丙组'],[3,9,6],3,'人'),'隔日读每格3人的图，标柱顶并填每组数量和单位。','3、9、6人。','隔日：三组与刻度3'],
  [cb(['水','果汁'],[200,400],100,'毫升'),'独立读每格100毫升的图，标顶并填写饮品容量。','200毫升、400毫升。','备用：容量与较大刻度']
 ],
 'D01.03':[
  [cb(['甲'],[15],5,'人'),'底端0、顶端20，中间4个等距间隔，实际放数卡补完整刻度。','0、5、10、15、20。','刻度差从2改5'],
  [cb(['乙'],[6],3,'件'),'独立在0到9的三个等距间隔放刻度数卡。','0、3、6、9。','无提示：刻度3与较少间隔'],
  [cb(['丙'],[8],2,'分钟',{offset:4,ticks:[4,6,8,10,12]}),'隔日这根独立量尺从4到12，每格等距；把缺数卡放入中间刻度。注意它不是从0开始的柱图。','4、6、8、10、12。','隔日：非零量尺起点明确，不冒充零基线柱图'],
  [cb(['丁'],[20],10,'厘米'),'独立补0到30的三个等距刻度间隔。','0、10、20、30。','备用：长度量尺刻度10']
 ],
 'D01.04':[
  [cb(['甲','乙'],[5,15],5,'人'),'按表画每格5人的两根柱，填写数据单位。','1格、3格。','人物数据与每格5'],
  [cb(['红','蓝','黄'],[0,6,3],3,'件'),'独立按表画柱，红为0也须保留这一类，填数与单位。','0、2、1格。','无提示：零数据类别'],
  [cb(['第一天','第二天'],[8,4],2,'分钟'),'隔日用时间表画柱，每格2分钟。','4格、2格。','隔日：物品数量改用时'],
  [cb(['湖','山','桥'],[2,4,6],2,'千米'),'独立按路线距离表画每格2千米的柱。','1、2、3格。','备用：长度与三类别']
 ],
 'D01.05':[
  [{direction:'build',...cb(['周一','周二','周三'],[6,2,4],2,'本')},'把阅读表改成柱图，实际堆每格2本的柱并核对单位。','3、1、2格。','柱图转表反向为表转柱'],
  [{direction:'read',...cb(['甲班','乙班'],[12,4],4,'人')},'独立把每格4人的柱图转成对应人数表，标柱顶。','12人、4人。','无提示：新刻度与类别'],
  [{direction:'build',...cb(['红','蓝','绿'],[3,0,6],3,'件')},'隔日把含0的物品表转每格3件的柱图，零类也保留。','1、0、2格。','隔日：反向转换且有零类'],
  [{direction:'read',...cb(['上午','下午','晚上'],[10,20,5],5,'分钟')},'独立把三个时段用时图转表，标顶后填数与单位。','10、20、5分钟。','备用：时段用时与不按大小排列']
 ],
 'D01.06':[
  [cl([[0,0],[2,4],[4,0],[6,4]],2,'above',1),'圈水位高于2厘米的全部时间小段，累计分钟。','1–3、5–6，共3分钟。','两不连续区间且末尾仍符合'],
  [cl([[0,6],[3,0],[6,6]],2,'below',1),'独立圈水位低于2厘米的实际小段并累计时间。','2–4，共2分钟。','无提示：高于改低于，原折线间隔3'],
  [cl([[0,0],[1,4],[2,0],[3,4],[4,0]],2,'above',0.5),'隔日每个时间小段为半分钟，圈高于2厘米的全部区间并累计分钟。','0.5–1.5与2.5–3.5，共2分钟。','隔日：半分钟时间尺与四次穿越'],
  [cl([[0,2],[2,4],[4,2]],6,'above',1),'独立圈高于6厘米的区间；若没有须明确标“无符合区间”，再填时长单位。','无区间，0分钟。','备用：完全不符合，不以空操作假装完成']
 ]
};
const chartSource=typeof module!=='undefined'?require('./chart').CHART_TASKS:CHART_TASKS,chartTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(CHART_CASES)){chartTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [params,prompt,explain,changeDimension]=cases[i];chartTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'chartLab',contentVersion:58,kind:chartSource[skillId].kind,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,context:'读图与实际单位',...(stage==='transfer'?{hint:'先读图例、单位、刻度差，逐类别或逐时间段操作。'}:{})}}}
if(typeof module!=='undefined')module.exports={CHART_CASES};

'use strict';
function chartIconEntries(t,row){return Array.from({length:Math.ceil(t.icons[row])},(_,i)=>({id:row+':'+i,fraction:Math.min(1,t.icons[row]-i),units:t.legend*Math.min(1,t.icons[row]-i)}))}
function chartAllIcons(t){return t.icons.flatMap((_,row)=>chartIconEntries(t,row))}
function chartHorizontal(t,w,source=false){
 const width=560,height=350,left=120,right=530,top=35,bottom=275,n=t.ticks.length-1,X=i=>left+(right-left)*i/n,rowStep=(bottom-top)/t.labels.length;
 return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc('横向条形图：横轴数量（'+t.unit+'），纵轴类别；'+t.labels.join('、'))}"><path d="M${left} ${top}V${bottom}H${right}" fill="none" stroke="#234654" stroke-width="2"/>${t.ticks.map((v,i)=>`<path d="M${X(i)} ${top}V${bottom}" stroke="#d4e2dc"/><text x="${X(i)}" y="${bottom+24}" text-anchor="middle" font-size="17">${v}</text>`).join('')}${t.labels.map((label,i)=>{const blocks=source?(t.values[i]-t.ticks[0])/t.gap:w.heights[i],y=top+(i+.2)*rowStep;return `<rect data-category="${i}" x="${left}" y="${y}" width="${X(blocks)-left}" height="${rowStep*.6}" fill="#68b697" stroke="#357455"/>${Array.from({length:blocks},(_,k)=>`<path d="M${X(k)} ${y}V${y+rowStep*.6}" stroke="#fff"/>`).join('')}<text x="${left-10}" y="${y+rowStep*.3+6}" text-anchor="end" font-size="17">${esc(label)}</text>${w.marks[i]!==null?`<circle cx="${X(w.marks[i])}" cy="${y+rowStep*.3}" r="8" fill="#f3b947" stroke="#895226"/>`:''}`}).join('')}<text x="${(left+right)/2}" y="330" text-anchor="middle" font-size="17">数量（${esc(t.unit)}）</text><text x="8" y="22" font-size="17">类别</text></svg>`;
}
function chartIntervals(t){const out=[];for(let x=t.points[0][0],i=0;x<t.points.at(-1)[0]-1e-8;x+=t.timeStep,i++)out.push({id:'I'+i,a:x,b:Math.min(x+t.timeStep,t.points.at(-1)[0])});return out}
function chartValue(t,x){for(let i=1;i<t.points.length;i++){const [a,y]=t.points[i-1],[b,z]=t.points[i];if(x>=a-1e-8&&x<=b+1e-8)return y+(z-y)*(x-a)/(b-a)}return NaN}
function chartQualifies(t,interval){const v=chartValue(t,(interval.a+interval.b)/2);return t.relation==='below'?v<t.threshold:v>t.threshold}
function chartDuration(t,ids){return chartIntervals(t).filter(p=>ids.includes(p.id)).reduce((n,p)=>n+p.b-p.a,0)}
function chartState(t){return draft.work??(draft.work={expanded:[],dots:{},active:'',values:t.values.map(()=>0),heights:t.values.map(()=>0),amountSet:t.values.map(()=>false),zeroConfirmed:t.values.map(()=>false),marks:t.values.map(()=>null),category:0,tick:1,scale:t.ticks?.map((v,i)=>i===0||i===t.ticks.length-1?v:null)||[],unit:'',intervals:[],empty:false,answer:0,moves:0,log:[]})}
function chartSvg(t,w,source=false){if(t.orientation==='horizontal'&&t.kind!=='interval')return chartHorizontal(t,w,source);const width=560,height=350,left=70,bottom=290,top=35;if(t.kind==='interval'){const intervals=chartIntervals(t),first=t.points[0][0],last=t.points.at(-1)[0],max=Math.max(...t.points.map(p=>p[1]),t.threshold)+2,X=x=>left+(width-left-25)*(x-first)/(last-first),Y=y=>bottom-(bottom-top)*y/max;return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc('水位折线，横轴分钟、纵轴厘米；'+t.points.map(p=>p.join('分钟时为')+'厘米').join('；'))}">${intervals.filter(p=>w.intervals.includes(p.id)).map(p=>`<rect x="${X(p.a)}" y="${top}" width="${X(p.b)-X(p.a)}" height="${bottom-top}" fill="#ffdf7e" opacity=".6"/>`).join('')}<path d="M${left} ${top}V${bottom}H${width-25}" fill="none" stroke="#234654" stroke-width="2"/><path d="M${left} ${Y(t.threshold)}H${width-25}" stroke="#c7653a" stroke-width="2" stroke-dasharray="6 4"/><text x="8" y="${Y(t.threshold)-7}" font-size="16">${t.threshold}厘米</text><polyline points="${t.points.map(([x,y])=>X(x)+','+Y(y)).join(' ')}" fill="none" stroke="#287a72" stroke-width="4"/>${t.points.map(([x,y])=>`<circle cx="${X(x)}" cy="${Y(y)}" r="5" fill="#287a72"/><text x="${X(x)}" y="${bottom+22}" text-anchor="middle" font-size="16">${x}</text><text x="${X(x)}" y="${Y(y)-12}" text-anchor="middle" font-size="16">${y}</text>`).join('')}<text x="${width/2}" y="335" font-size="17">时间（分钟）</text><text x="4" y="22" font-size="17">水位（厘米）</text></svg>`}
 const n=t.ticks.length-1,Y=i=>bottom-(bottom-top)*i/n,step=(width-left-25)/Math.max(1,t.labels.length);return `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t.kind==='ticks'?'等距量尺，两端刻度已给出':source?'来源柱图，单位'+t.unit:'已画柱图，单位'+t.unit)}"><path d="M${left} ${top}V${bottom}H${width-25}" fill="none" stroke="#234654" stroke-width="2"/>${t.ticks.map((v,i)=>`<path d="M${left-6} ${Y(i)}H${width-25}" stroke="#d4e2dc"/><text x="${left-10}" y="${Y(i)+6}" text-anchor="end" font-size="18">${t.kind==='ticks'?(w.scale[i]??'?'):v}</text>`).join('')}${t.kind!=='ticks'?t.labels.map((label,i)=>{const blocks=source?(t.values[i]-t.ticks[0])/t.gap:w.heights[i];return `<rect x="${left+step*i+step*.2}" y="${Y(blocks)}" width="${step*.6}" height="${bottom-Y(blocks)}" fill="#68b697" stroke="#357455"/>${Array.from({length:blocks},(_,k)=>`<path d="M${left+step*i+step*.2} ${Y(k)}H${left+step*i+step*.8}" stroke="#fff"/>`).join('')}<text x="${left+step*(i+.5)}" y="${bottom+28}" text-anchor="middle" font-size="17">${esc(label)}</text>${w.marks[i]!==null?`<circle cx="${left+step*(i+.5)}" cy="${Y(w.marks[i])}" r="8" fill="#f3b947" stroke="#895226"/>`:''}`}).join(''):''}<text x="5" y="20" font-size="17">${esc(t.unit)}</text></svg>`}
function chartAmounts(t,w){return t.labels.map((label,index)=>`<div class="work-buttons"><b>${esc(label)}表格数值：${w.values[index]}</b>${w.values[index]===0?`<button data-action="chartAmount" data-index="${index}" data-delta="0" aria-pressed="${!!w.amountSet?.[index]}">确认数值0</button>`:''}${[-1,1,5,10,100].filter(d=>d!==100||Math.max(...t.values)>=100).map(delta=>`<button data-action="chartAmount" data-index="${index}" data-delta="${delta}" ${w.values[index]+delta>=0&&w.values[index]+delta<=1000?'':'disabled'}>${delta>0?'＋':'－'}${Math.abs(delta)}</button>`).join('')}</div>`).join('')}
function chartBoard(t){const w=chartState(t),read=t.kind==='read'||t.kind==='convert'&&t.direction==='read',build=t.kind==='build'||t.kind==='convert'&&t.direction==='build';return `<div class="board chart-board"><h3>${esc(t.context)}</h3><div class="work-buttons"><button data-action="chartUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${t.kind==='legend'?`<p>图例：一个完整图标代表${t.legend}${esc(t.unit)}，拆开后每点1${esc(t.unit)}。</p>${t.labels.map((label,row)=>`<section><h4>${esc(label)}来源图</h4><div class="work-buttons">${chartIconEntries(t,row).map((entry,icon)=>{const id=entry.id;return `<button data-action="chartIcon" data-id="${id}" aria-label="${entry.fraction===1?'完整':'半个'}图标${icon+1}，拆出相应原单位点" ${w.expanded.includes(id)?'disabled':''}>${entry.fraction===1?'●':'◐'} ${entry.fraction===1?'完整':'半个'}图标${icon+1}${w.expanded.includes(id)?'已拆':'，拆单位点'}</button>`}).join('')||'<p>没有图标</p>'}</div></section>`).join('')}<section><h4>拆出的原单位点（点一个，再放入对应盘）</h4><div class="work-buttons">${Object.entries(w.dots).filter(([,loc])=>loc===null).map(([id])=>`<button data-action="chartDot" data-id="${id}" aria-pressed="${w.active===id}">● ${id}</button>`).join('')||'<p>无未归位点</p>'}</div></section><div class="chart-pans">${t.labels.map((label,row)=>`<section><button data-action="chartPlace" data-row="${row}" ${w.active?'':'disabled'}>放到${esc(label)}计数盘</button><div class="work-buttons">${Object.entries(w.dots).filter(([,loc])=>loc===row).map(([id])=>`<button data-action="chartDot" data-id="${id}" aria-pressed="${w.active===id}">● ${id}</button>`).join('')||'<p>空盘</p>'}</div></section>`).join('')}</div>${chartAmounts(t,w)}`:t.kind==='interval'?`${chartSvg(t,w)}<p>两标记点间为直线；每个可选小段${t.timeStep}分钟。点小段会高亮图中的真实时间带，可再点取消。</p><div class="work-buttons">${chartIntervals(t).map(p=>`<button data-action="chartInterval" data-id="${p.id}" aria-pressed="${w.intervals.includes(p.id)}">${p.a}–${p.b}分钟</button>`).join('')}<button data-action="chartEmpty" aria-pressed="${w.empty}">无符合区间</button></div><div class="work-buttons"><b>我算累计 ${w.answer}分钟</b><button data-action="chartTime" data-delta="-0.5" ${w.answer?'':'disabled'}>－0.5</button><button data-action="chartTime" data-delta="0.5">＋0.5</button><button data-action="chartTime" data-delta="1">＋1</button></div>`:`${build?`<table><caption>来源数据表</caption><tr><th>类别</th><th>数量（${esc(t.unit)}）</th></tr>${t.labels.map((label,i)=>`<tr><td>${esc(label)}</td><td>${t.values[i]}</td></tr>`).join('')}</table>`:''}${chartSvg(t,w,read)}${t.kind==='ticks'?`<div class="work-buttons"><b>选择缺刻度的位置</b>${t.ticks.map((v,index)=>index>0&&index<t.ticks.length-1?`<button data-action="chartTick" data-index="${index}" aria-pressed="${w.tick===index}">自底向上第${index}格</button>`:'').join('')}</div><div class="work-buttons"><b>放入数值卡</b>${[...new Set([...t.ticks,t.ticks[0]+1,t.ticks[0]+3])].sort((a,b)=>a-b).map(v=>`<button data-action="chartScale" data-value="${v}">${v}</button>`).join('')}</div>`:`<div class="work-buttons">${t.labels.map((label,index)=>`<button data-action="chartCategory" data-index="${index}" aria-pressed="${w.category===index}">${esc(label)}</button>`).join('')}${build?'<button data-action="chartBlock" data-delta="1">在本柱顶添1格</button><button data-action="chartBlock" data-delta="-1">取回本柱顶1格</button><button data-action="chartZero">确认这个类别的柱为0格</button>':''}</div>${read?`<div class="work-buttons"><b>在所选柱顶标刻度</b>${t.ticks.map((v,index)=>`<button data-action="chartMark" data-index="${index}">${v}</button>`).join('')}</div>`:''}${chartAmounts(t,w)}`}`}${t.kind!=='ticks'?`<div class="work-buttons"><b>我选择数据单位</b>${[...new Set([t.unit,'人','件','厘米','分钟'])].map(unit=>`<button data-action="chartUnit" data-value="${esc(unit)}" aria-pressed="${w.unit===unit}">${esc(unit)}</button>`).join('')}</div>`:''}</div>`}
function chartGrade(t){const w=chartState(t);let ok=false;if(t.kind==='ticks')ok=w.scale.every((v,i)=>v===t.ticks[i]);else if(t.kind==='interval'){const expected=chartIntervals(t).filter(p=>chartQualifies(t,p)).map(p=>p.id);ok=w.intervals.length===expected.length&&expected.every(id=>w.intervals.includes(id))&&(expected.length?!w.empty:w.empty)&&Math.abs(w.answer-chartDuration(t,expected))<1e-8&&w.unit===t.unit}else{ok=w.values.every((v,i)=>v===t.values[i]&&w.amountSet?.[i])&&w.unit===t.unit;if(t.kind==='legend')ok=ok&&w.expanded.length===chartAllIcons(t).length&&chartAllIcons(t).every(e=>w.expanded.includes(e.id))&&Object.keys(w.dots).length===t.values.reduce((n,v)=>n+v,0)&&chartAllIcons(t).every(e=>Array.from({length:e.units},(_,k)=>e.id+':'+k).every(id=>Object.hasOwn(w.dots,id)))&&Object.entries(w.dots).every(([id,row])=>Number(id.split(':')[0])===row);else if(t.kind==='read'||t.kind==='convert'&&t.direction==='read')ok=ok&&w.marks.every((v,i)=>v===(t.values[i]-t.ticks[0])/t.gap);else ok=ok&&w.heights.every((v,i)=>v*t.gap+t.ticks[0]===t.values[i]&&(v!==0||w.zeroConfirmed?.[i]))}return {ok,incomplete:w.moves===0,reason:'逐类别核对原图与量尺：图标必须按图例拆单位，柱高要用刻度差换成原量且保留单位。时间累计只加符合条件的小段，空范围须明确标无。'}}
function chartAct(action,data,t){const w=chartState(t),snapshot=JSON.stringify({...w,log:[]}),index=Number(data.index),row=Number(data.row),delta=Number(data.delta);let changed=false;
 if(action==='chartIcon'&&t.kind==='legend'){const e=chartAllIcons(t).find(e=>e.id===data.id);if(e&&Number.isInteger(e.units)&&!w.expanded.includes(e.id)){w.expanded.push(e.id);for(let k=0;k<e.units;k++)w.dots[e.id+':'+k]=null;changed=true}}
 if(action==='chartDot'&&Object.hasOwn(w.dots,data.id)){w.active=w.active===data.id?'':data.id;changed=true}
 if(action==='chartPlace'&&w.active&&Number.isInteger(row)&&row>=0&&row<t.labels.length){w.dots[w.active]=row;w.active='';changed=true}
 if(action==='chartCategory'&&Number.isInteger(index)&&index>=0&&index<t.values.length){w.category=index;changed=true}
 if(action==='chartBlock'&&[1,-1].includes(delta)&&(t.kind==='build'||t.kind==='convert'&&t.direction==='build')){const next=w.heights[w.category]+delta;if(next>=0&&next<t.ticks.length){w.heights[w.category]=next;w.zeroConfirmed[w.category]=false;changed=true}}
 if(action==='chartZero'&&(t.kind==='build'||t.kind==='convert'&&t.direction==='build')&&w.heights[w.category]===0){w.zeroConfirmed[w.category]=true;changed=true}
 if(action==='chartMark'&&(t.kind==='read'||t.kind==='convert'&&t.direction==='read')&&Number.isInteger(index)&&index>=0&&index<t.ticks.length){w.marks[w.category]=index;changed=true}
 if(action==='chartAmount'&&Number.isInteger(index)&&index>=0&&index<t.values.length&&[-1,0,1,5,10,100].includes(delta)&&w.values[index]+delta>=0&&w.values[index]+delta<=1000){w.values[index]+=delta;w.amountSet[index]=true;changed=true}
 if(action==='chartTick'&&t.kind==='ticks'&&Number.isInteger(index)&&index>0&&index<t.ticks.length-1){w.tick=index;changed=true}
 if(action==='chartScale'&&t.kind==='ticks'&&[...t.ticks,t.ticks[0]+1,t.ticks[0]+3].includes(Number(data.value))){w.scale[w.tick]=Number(data.value);changed=true}
 if(action==='chartUnit'&&t.kind!=='ticks'&&[t.unit,'人','件','厘米','分钟'].includes(data.value)){w.unit=data.value;changed=true}
 if(action==='chartInterval'&&t.kind==='interval'&&chartIntervals(t).some(p=>p.id===data.id)){const at=w.intervals.indexOf(data.id);at<0?w.intervals.push(data.id):w.intervals.splice(at,1);w.empty=false;changed=true}
 if(action==='chartEmpty'&&t.kind==='interval'){w.empty=!w.empty;if(w.empty)w.intervals=[];changed=true}
 if(action==='chartTime'&&t.kind==='interval'&&[-0.5,0.5,1].includes(delta)&&w.answer+delta>=0&&w.answer+delta<=100){w.answer+=delta;changed=true}
 if(action==='chartUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});return true}if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function chartSpeech(t){const w=chartState(t);if(t.kind==='interval')return `水位${t.relation==='below'?'低于':'高于'}${t.threshold}厘米；已圈${chartIntervals(t).filter(p=>w.intervals.includes(p.id)).map(p=>p.a+'至'+p.b+'分钟').join('、')||'无'}；填写累计${w.answer}，单位${w.unit||'未选'}。`;if(t.kind==='ticks')return '自底向上的量尺刻度：'+w.scale.map(v=>v??'待填').join('、');return (t.orientation==='horizontal'?'横轴数量、纵轴类别。':'')+t.labels.map((label,i)=>`${label}，${t.kind==='legend'?'盘中'+Object.values(w.dots).filter(v=>v===i).length+'个单位点':'已画'+w.heights[i]+'格，标顶刻度'+(w.marks[i]===null?'未标':t.ticks[w.marks[i]])}，填${w.values[i]}`).join('；')+'；单位'+(w.unit||'未选')}
function chartPage(){const t=CHART_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!t||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(t.skillId)} · 图表</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(t.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(t.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${chartBoard(t)}${reasonBlock(t)}${actionRow(t)}</article><aside class="side-stack"><section class="panel"><h3>先看尺与单位</h3><p>图表中的位置对应实际数量。时间段可以分离；只有符合条件的时长相加。动作可撤回。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={chartIntervals,chartValue,chartQualifies,chartDuration};

'use strict';
function statsData(values,extra={}){return {values,quantum:1,unit:'枚',...extra}}
function statsFreq(rows,extra={}){return {rows:rows.map(([value,frequency,label])=>({value,frequency,label})),quantum:1,unit:'本',...extra}}
const STATS_TASKS={
 'D02.01':{kind:'balance',...statsData([1,5,6]),prompt:'三个原盘分别有1、5、6枚。点一枚再放到另一个盘，实际均分全部材料。填写原总数、盘数及均分后每盘数。',explain:'移来移去总数仍12，均分到3盘，每盘4。'},
 'D02.02':{kind:'mean',...statsData([2,3,7],{unit:'本'}),prompt:'三人各读2、3、7本。用读书单位点在三人之间实际均分，填写总本数、人数和平均本数。',explain:'总12本除以3人，平均4本；平均可以不是任何人的原本数。'},
 'D02.03':{kind:'sort',...statsData([4,1,4,2,6],{unit:'分'}),prompt:'把五张原数据卡按从小到大逐张摆进顺序位。两个4来自不同记录，各须保留一次。',explain:'1、2、4、4、6；排序改变位置，不删重复记录。'},
 'D02.04':{kind:'median',...statsData([8,1,4,3],{unit:'分'}),prompt:'先逐张排序，切换圈中间卡模式，圈出偶数个数据的两张中间原卡，再填写中位数。',explain:'1、3、4、8；中间两值3、4，中位数3.5。'},
 'D02.05':{kind:'modeRange',...statsData([2,2,4,6],{unit:'分'}),prompt:'把每张原数据卡归到对应数值区，圈所有出现最多的数值区，再标最小与最大区并填写极差。若所有值各出现一次，明确选无众数。',explain:'2出现两次最多，众数2；最大6−最小2＝极差4。'},
 'D02.06':{kind:'weighted',...statsFreq([[2,1,'甲组'],[8,3,'乙组']],{quantum:0.5}),prompt:'甲组1人每人2本，乙组3人每人8本。逐行展开频数为真实人员卡，实际均分全部读书单位点，填写总本数、总人数与合班平均。每个半点0.5本。',explain:'2×1＋8×3＝26，总4人；平均6.5本，不能把组均值2与8直接平均成5。'}
};
for(const [skillId,t] of Object.entries(STATS_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'statsLab',contentVersion:59,phase:'练',context:'原数据、守恒与真实人数',hint:'材料只在原盘间移动；排序保留每个记录。频数要展开为每个实际人，中间位置与出现次数是不同问题。',reason:{prompt:'你的统计结果依靠什么？',options:['保留原数据身份和总量；平均的分母是实际对象数，中位数看排序中间，众数看频数，极差看最大减最小','把重复的数据删掉后再求中间值和平均','人数不同的两组也可直接平均两个组均值'],answer:0}});
if(typeof module!=='undefined')module.exports={STATS_TASKS,statsData,statsFreq};

'use strict';
const statsFactory=typeof module!=='undefined'?require('./stats'):{statsData,statsFreq},sd=statsFactory.statsData,sf=statsFactory.statsFreq;
const STATS_CASES={
 'D02.01':[
  [sd([0,3,9]),'一盘为0。实际搬点均分三盘，填写总量、盘数和每盘数。','总12，每盘4。','含空盘仍是三个对象'],
  [sd([1,3],{quantum:0.5}),'独立用半枚教具点实际均分两盘，填总量与均分量。','总4，两盘各2；每点0.5枚。','无提示：半单位教具与两盘'],
  [sd([2,2,2,10]),'隔日均分四盘，保留全部原单位点，填写总量和每盘数。','总16，四盘各4。','隔日：极端高盘与四盘'],
  [sd([1,2],{quantum:0.5}),'独立搬半枚点均分两盘，填写不为整数的均分量。','总3，两盘各1.5。','备用：均分结果是半数']
 ],
 'D02.02':[
  [sd([1,1,10],{unit:'本'}),'三人阅读量含一个极大值。实际均分原单位点，填写平均数。','总12，平均4，不是中间原值1。','极端值影响平均，与中位数不同'],
  [sd([1,2],{quantum:0.5,unit:'千米'}),'独立实际均分两次路程的半千米点，填平均。','平均1.5千米。','无提示：量纲变化和非整数平均'],
  [sd([0,2,4,6],{unit:'分'}),'隔日包含0分的四人数据，实际均分后填总分、人数和平均分。','总12，平均3；0分者也算人。','隔日：零量对象不能从分母删掉'],
  [sd([3,3,9],{unit:'分钟'}),'独立均分三个用时记录，填写平均分钟。','总15，三记录平均5分钟。','备用：平均不必是原记录值']
 ],
 'D02.03':[
  [sd([7,2,5,2],{direction:'desc',unit:'分'}),'按从大到小实际排序，两个2记录都保留。','7、5、2、2。','升序改降序与重复'],
  [sd([0,3,1,0],{unit:'本'}),'独立把含两个0的四张原记录卡按从小到大摆好。','0、0、1、3。','无提示：零值与重复身份'],
  [sd([2.5,1,3,1.5],{unit:'厘米'}),'隔日把小数长度卡实际升序排列。','1、1.5、2.5、3。','隔日：非整数比较'],
  [sd([4,4,4],{unit:'分'}),'独立排序三张相同数值但不同编号的原卡，一张不能少。','三个4，任意身份顺序均可。','备用：所有值相同与非唯一顺序']
 ],
 'D02.04':[
  [sd([9,1,5,3,7],{unit:'分'}),'实际排序五张卡，圈一张正中间卡，填写中位数。','1、3、5、7、9，中位5。','偶数个改奇数个'],
  [sd([1,1,1,9],{unit:'本'}),'独立排序四条阅读记录，圈两张中间原卡并填中位数。','中位1；极大9不使中位变成平均3。','无提示：偶数、重复与极端值'],
  [sd([2,5,1,8,3,4],{unit:'分'}),'隔日排序六张卡，圈中间两张并求中位数。','1、2、3、4、5、8，中位3.5。','隔日：六条记录与半数中位'],
  [sd([6,2,4],{unit:'厘米'}),'独立把三张长度卡排序后圈中间原卡并填中位长度。','2、4、6，中位4厘米。','备用：长度量纲与三条']
 ],
 'D02.05':[
  [sd([1,1,3,3,5],{unit:'分'}),'归组全部数据卡，圈并列出现最多的所有值，标最小最大并填极差。','众数1与3；极差5−1＝4。','两个并列众数'],
  [sd([2,4,6,8],{unit:'厘米'}),'独立归组，判断每值只出现一次时本题约定无众数，标两端并求极差。','无众数，极差6厘米。','无提示：无众数而仍有极差'],
  [sd([0,0,2,7],{unit:'本'}),'隔日归组含0的阅读数据，圈众数，标两端并求极差。','众数0，极差7本。','隔日：零也是数据与众数'],
  [sd([4,4,4],{unit:'分'}),'独立归组全部原卡，圈众数；最小与最大同一区可只标一次，填极差。','众数4，极差0。','备用：相同端点与极差0']
 ],
 'D02.06':[
  [sf([[1,3,'低阅读组'],[5,1,'高阅读组']]),'展开人数表并实际均分全部阅读点，求合班平均；两组人数不同。','总8本、4人，平均2，非两个组均值的3。','不等人数方向反转，频数必须作权重'],
  [sf([[2,2,'第一组'],[4,1,'第二组'],[6,2,'第三组']]),'独立展开三行频数，均分并填写总人数与平均。','总20、5人、平均4。','无提示：三行不等于三人'],
  [sf([[0,2,'甲'],[6,1,'乙']]),'隔日展开含0本对象的频数表，保留他们的人数后均分。','总6本、3人、平均2。','隔日：零量频数不可从分母删去'],
  [sf([[3,2,'甲'],[5,2,'乙']],{unit:'分'}),'独立展开两组相同人数的分数表再均分，求总体平均。','16分、4人、平均4；仅因人数相同才与组均值平均一致。','备用：相等人数的有效边界']
 ]
};
const statsSource=typeof module!=='undefined'?require('./stats').STATS_TASKS:STATS_TASKS,statsTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(STATS_CASES)){statsTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [params,prompt,explain,changeDimension]=cases[i];statsTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'statsLab',kind:statsSource[skillId].kind,contentVersion:60,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,context:'统计的原量与原对象',...(stage==='transfer'?{hint:'保留每个原记录与全部材料；平均分母为实际对象数，频数先展开。'}:{})}}}
if(typeof module!=='undefined')module.exports={STATS_CASES};

'use strict';
function statsObservations(t){return t.kind==='weighted'?t.rows.flatMap((row,r)=>Array.from({length:row.frequency},(_,i)=>({id:`P${r+1}-${i+1}`,value:row.value,label:row.label+'成员'+(i+1),row:r}))):t.values.map((value,i)=>({id:'D'+(i+1),value,label:'记录'+(i+1)}))}
function statsSummary(t){const values=statsObservations(t).map(p=>p.value),n=values.length,total=values.reduce((a,b)=>a+b,0),ordered=[...values].sort((a,b)=>a-b),freq=new Map();for(const v of values)freq.set(v,(freq.get(v)||0)+1);const highest=Math.max(...freq.values()),modes=highest===1?[]:[...freq].filter(([,n])=>n===highest).map(([v])=>v);return {n,total,mean:total/n,median:n%2?ordered[(n-1)/2]:(ordered[n/2-1]+ordered[n/2])/2,modes,range:ordered.at(-1)-ordered[0],ends:[...new Set([ordered[0],ordered.at(-1)])]}}
function statsUnits(t,p){return Array.from({length:Math.round(p.value/t.quantum)},(_,i)=>p.id+':U'+i)}
function statsState(t){const obs=statsObservations(t),balance=['balance','mean','weighted'].includes(t.kind);return draft.work??(draft.work={expanded:[],dots:t.kind==='weighted'||!balance?{}:Object.fromEntries(obs.flatMap((p,row)=>statsUnits(t,p).map(id=>[id,row]))),active:'',order:Array(obs.length).fill(null),mode:'sort',selected:[],groups:{},modes:[],noMode:false,ends:[],total:0,denominator:0,answer:0,range:0,moves:0,log:[]})}
function statsCount(t,w,row){return Object.values(w.dots).filter(v=>v===row).length*t.quantum}
function statsNumeric(w,key,label){return `<div class="work-buttons"><b>${label} ${w[key]}</b>${[-0.5,0.5,1,5,10].map(delta=>`<button data-action="statsAmount" data-key="${key}" data-delta="${delta}" ${w[key]+delta>=0&&w[key]+delta<=200?'':'disabled'}>${delta>0?'＋':'－'}${Math.abs(delta)}</button>`).join('')}</div>`}
function statsCardHtml(p,w){return `<button class="stats-card" data-action="statsCard" data-id="${p.id}" aria-pressed="${w.active===p.id||w.selected.includes(p.id)}"><b>${p.value}</b><small>${p.id}</small></button>`}
function statsBoard(t){const w=statsState(t),obs=statsObservations(t),balance=['balance','mean','weighted'].includes(t.kind),unique=[...new Set(obs.map(p=>p.value))].sort((a,b)=>a-b);return `<div class="board stats-board"><h3>${esc(t.context)}</h3><div class="work-buttons"><button data-action="statsUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${balance?`${t.kind==='weighted'?`<table><caption>频数来源表（每行不是一个人）</caption><tr><th>组别</th><th>每人原量（${esc(t.unit)}）</th><th>人数</th><th>实际展开</th></tr>${t.rows.map((row,i)=>`<tr><td>${esc(row.label)}</td><td>${row.value}</td><td>${row.frequency}</td><td><button data-action="statsExpand" data-row="${i}" ${w.expanded.includes(i)?'disabled':''}>${w.expanded.includes(i)?'已展开每个人':'展开成员卡与各自原点'}</button></td></tr>`).join('')}</table>`:''}<p>每个可搬点代表${t.quantum}${esc(t.unit)}；先点一个原单位点，再放到另一原盘。只移动已有材料，不复制。</p><div class="stats-pans">${obs.filter(p=>t.kind!=='weighted'||w.expanded.includes(p.row)).map(p=>{const row=obs.findIndex(v=>v.id===p.id);return `<section><h4>${esc(p.label)} ${p.id} · 原${p.value}${esc(t.unit)}</h4><button data-action="statsPlace" data-row="${row}" ${w.active?'':'disabled'}>把选中原点放入这个盘</button><p>当前实际量${statsCount(t,w,row)}${esc(t.unit)}</p><div class="work-buttons">${Object.entries(w.dots).filter(([,r])=>r===row).map(([id])=>`<button class="stats-dot" data-action="statsDot" data-id="${id}" aria-pressed="${w.active===id}" aria-label="原单位点${id}代表${t.quantum}${esc(t.unit)}">${t.quantum===0.5?'◐':'●'}<small>${id}</small></button>`).join('')||'<p>空盘</p>'}</div></section>`}).join('')}</div>${statsNumeric(w,'total','我填原总量（'+t.unit+'）')}${statsNumeric(w,'denominator','我填实际对象数')}${statsNumeric(w,'answer','我填均分/平均量（'+t.unit+'）')}`:t.kind==='modeRange'?`<p>本课约定：各数值都只出现一次时称无众数；最高频数大于1时，可有一个或多个并列众数。</p><section><h4>未归位的原数据卡</h4><div class="work-buttons">${obs.filter(p=>w.groups[p.id]===undefined).map(p=>statsCardHtml(p,w)).join('')||'<p>无</p>'}</div></section><div class="stats-groups">${unique.map(value=>`<section><button data-action="statsGroup" data-value="${value}" ${w.active?'':'disabled'}>把原卡归到值${value}区</button><div class="work-buttons">${obs.filter(p=>w.groups[p.id]===value).map(p=>statsCardHtml(p,w)).join('')}</div><p>当前原卡${obs.filter(p=>w.groups[p.id]===value).length}张</p><button data-action="statsModeValue" data-value="${value}" aria-pressed="${w.modes.includes(value)}">圈${value}为众数</button><button data-action="statsEnd" data-value="${value}" aria-pressed="${w.ends.includes(value)}">标${value}为最小/最大值</button></section>`).join('')}</div><div class="work-buttons"><button data-action="statsNoMode" aria-pressed="${w.noMode}">所有数值只出现一次：无众数</button></div>${statsNumeric(w,'range','我填极差（'+t.unit+'）')}`:`<div class="work-buttons"><button data-action="statsWorkMode" data-value="sort" aria-pressed="${w.mode==='sort'}">选原卡再摆位</button>${t.kind==='median'?`<button data-action="statsWorkMode" data-value="middle" aria-pressed="${w.mode==='middle'}">圈排序后的中间原卡</button>`:''}</div><p>本题${t.direction==='desc'?'从大到小':'从小到大'}排列；不同编号是不同记录，重复值也必须保留。</p><section><h4>未摆入排序位的原卡</h4><div class="work-buttons">${obs.filter(p=>!w.order.includes(p.id)).map(p=>statsCardHtml(p,w)).join('')||'<p>无</p>'}</div></section><div class="stats-order">${w.order.map((id,slot)=>`<section><button data-action="statsSlot" data-slot="${slot}" ${w.active?'':'disabled'}>放到第${slot+1}位</button>${id?statsCardHtml(obs.find(p=>p.id===id),w):'<p>空位</p>'}</section>`).join('')}</div>${t.kind==='median'?statsNumeric(w,'answer','我填中位数（'+t.unit+'）'):''}`}</div>`}
function statsGrade(t){const w=statsState(t),obs=statsObservations(t),sum=statsSummary(t),same=(a,b)=>a.length===b.length&&b.every(v=>a.includes(v));let ok=false;
 if(['balance','mean','weighted'].includes(t.kind)){const ids=obs.flatMap(p=>statsUnits(t,p));ok=(t.kind!=='weighted'||w.expanded.length===t.rows.length)&&same(Object.keys(w.dots),ids)&&obs.every((p,row)=>Math.abs(statsCount(t,w,row)-sum.mean)<1e-8)&&w.total===sum.total&&w.denominator===sum.n&&w.answer===sum.mean}
 else if(t.kind==='modeRange')ok=obs.every(p=>w.groups[p.id]===p.value)&&same(w.modes,sum.modes)&&(sum.modes.length?!w.noMode:w.noMode)&&same(w.ends,sum.ends)&&w.range===sum.range;
 else{const values=w.order.map(id=>obs.find(p=>p.id===id)?.value),sorted=same(w.order,obs.map(p=>p.id))&&values.every((v,i)=>i===0||(t.direction==='desc'?values[i-1]>=v:values[i-1]<=v));ok=sorted;if(t.kind==='median'){const middle=sum.n%2?[w.order[(sum.n-1)/2]]:[w.order[sum.n/2-1],w.order[sum.n/2]];ok=ok&&same(w.selected,middle)&&w.answer===sum.median}}
 return {ok,incomplete:w.moves===0,reason:'保留每个原记录和全部原材料。均分后各盘实际量相等且分母是实际对象数；排序不删重复记录，中位数圈正确中间卡；众数允许并列或无，极差是最大减最小。'}}
function statsAct(action,data,t){const w=statsState(t),obs=statsObservations(t),p=obs.find(p=>p.id===data.id),row=Number(data.row),slot=Number(data.slot),value=Number(data.value),delta=Number(data.delta),snapshot=JSON.stringify({...w,log:[]});let changed=false;
 if(action==='statsExpand'&&t.kind==='weighted'&&Number.isInteger(row)&&row>=0&&row<t.rows.length&&!w.expanded.includes(row)){w.expanded.push(row);obs.forEach((p,i)=>{if(p.row===row)for(const id of statsUnits(t,p))w.dots[id]=i});changed=true}
 if(action==='statsDot'&&Object.hasOwn(w.dots,data.id)){w.active=w.active===data.id?'':data.id;changed=true}
 if(action==='statsPlace'&&Object.hasOwn(w.dots,w.active)&&Number.isInteger(row)&&row>=0&&row<obs.length&&(t.kind!=='weighted'||w.expanded.includes(obs[row].row))){w.dots[w.active]=row;w.active='';changed=true}
 if(action==='statsCard'&&p){if(w.mode==='middle'&&t.kind==='median'&&w.order.includes(p.id)){const at=w.selected.indexOf(p.id);at<0?w.selected.push(p.id):w.selected.splice(at,1)}else w.active=w.active===p.id?'':p.id;changed=true}
 if(action==='statsSlot'&&['sort','median'].includes(t.kind)&&w.mode==='sort'&&obs.some(p=>p.id===w.active)&&Number.isInteger(slot)&&slot>=0&&slot<obs.length){const prior=w.order.indexOf(w.active);if(prior>=0&&prior!==slot)w.order[prior]=w.order[slot];w.order[slot]=w.active;w.active='';w.selected=[];changed=true}
 if(action==='statsWorkMode'&&['sort','middle'].includes(data.value)&&(data.value!=='middle'||t.kind==='median')){w.mode=data.value;w.active='';changed=true}
 if(action==='statsGroup'&&t.kind==='modeRange'&&obs.some(p=>p.id===w.active)&&obs.some(p=>p.value===value)){w.groups[w.active]=value;w.active='';changed=true}
 if(action==='statsModeValue'&&t.kind==='modeRange'&&obs.some(p=>p.value===value)){const at=w.modes.indexOf(value);at<0?w.modes.push(value):w.modes.splice(at,1);w.noMode=false;changed=true}
 if(action==='statsNoMode'&&t.kind==='modeRange'){w.noMode=!w.noMode;if(w.noMode)w.modes=[];changed=true}
 if(action==='statsEnd'&&t.kind==='modeRange'&&obs.some(p=>p.value===value)){const at=w.ends.indexOf(value);at<0?w.ends.push(value):w.ends.splice(at,1);changed=true}
 if(action==='statsAmount'&&['total','denominator','answer','range'].includes(data.key)&&[-0.5,0.5,1,5,10].includes(delta)&&w[data.key]+delta>=0&&w[data.key]+delta<=200){w[data.key]+=delta;changed=true}
 if(action==='statsUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});return true}if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function statsSpeech(t){const w=statsState(t),obs=statsObservations(t);if(['balance','mean','weighted'].includes(t.kind))return obs.filter(p=>t.kind!=='weighted'||w.expanded.includes(p.row)).map(p=>p.label+'编号'+p.id+'当前'+statsCount(t,w,obs.indexOf(p))+t.unit).join('；')+`；总量填${w.total}，对象数${w.denominator}，平均${w.answer}`;if(t.kind==='modeRange')return obs.map(p=>p.id+'值'+p.value+'归到'+(w.groups[p.id]??'未归组')).join('；')+`；众数圈${w.modes.join('、')||'无'}，极差${w.range}`;return '排序位'+w.order.map((id,i)=>'第'+(i+1)+'位'+(id?id+'值'+obs.find(p=>p.id===id).value:'空')).join('；')+'；中间原卡圈'+w.selected.join('、')+'；填写'+w.answer}
function statsPage(){const t=STATS_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!t||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(t.skillId)} · 统计</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(t.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(t.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${statsBoard(t)}${reasonBlock(t)}${actionRow(t)}</article><aside class="side-stack"><section class="panel"><h3>保留原量与对象</h3><p>同值不同编号仍是不同数据。实际对象数包含零值者；不等人数的两组要用人数作权重。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={statsObservations,statsSummary,statsUnits,statsCount};

'use strict';
function chanceBag(colors,extra={}){return {type:'bag',name:'混匀袋中每个球等可能',atoms:colors.map((color,i)=>({id:'B'+(i+1),label:color+'球'+(i+1),color})),...extra}}
function chanceCoin(extra={}){return {type:'coin',name:'公平硬币',atoms:[{id:'H',label:'正',color:'正'},{id:'T',label:'反',color:'反'}],...extra}}
function chanceDie(n=3,extra={}){return {type:'die',name:'等可能编号卡',atoms:Array.from({length:n},(_,i)=>({id:'F'+(i+1),label:String(i+1),color:String(i+1)})),...extra}}
function chanceSpinner(sectors,extra={}){return {type:'spinner',name:'面积等效的等角小扇区',sectors:sectors.map(([color,size])=>({color,size})),atoms:sectors.flatMap(([color,size],sector)=>Array.from({length:size},(_,i)=>({id:`S${sector+1}-${i+1}`,label:color+'等角片'+(i+1),color,sector}))),...extra}}
const CHANCE_TASKS={
 'D03.01':{kind:'certainty',models:[chanceBag(['红','红','红'],{event:{type:'color',color:'红'},eventLabel:'取到红球'}),chanceBag(['蓝','蓝'],{event:{type:'color',color:'绿'},eventLabel:'取到绿球'}),chanceBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'取到红球'})],prompt:'分别亲手收录每袋的全部具体球身份，圈所问事件的球，判断一定、不可能或可能但不一定。没有有利结果时明确标空。',explain:'全红袋红球一定，蓝袋绿球不可能；3红1蓝更可能取红但仍可能取蓝，不是一定。'},
 'D03.02':{kind:'space',models:[chanceBag(['红','红','蓝'],{event:{type:'all'},eventLabel:'所有具体身份'})],prompt:'亲手逐球列一次取球的全部具体结果。两个红球颜色相同但编号不同；每个原身份收录一次，删除重复并补缺项。',explain:'B1、B2、B3是3个等可能原球身份，不能合并成只有红、蓝两个等可能结果。'},
 'D03.03':{kind:'equal',models:[chanceBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'颜色红与蓝是否等可能'})],prompt:'列全等可能原球身份，再区分“具体球等可能”与“红蓝颜色事件等可能”，分别作判断。',explain:'4个具体球各1/4；红3个身份、蓝1个身份，颜色概率3/4与1/4，不相等。'},
 'D03.04':{kind:'favorable',models:[chanceDie(4,{event:{type:'even'},eventLabel:'编号为偶数'})],prompt:'列全等可能编号卡，逐条圈有利结果“编号为偶数”，填写有利结果/全部结果的概率。可用等值分数。',explain:'2、4两个有利，共4个等可能结果；2/4＝1/2。'},
 'D03.05':{kind:'two',models:[chanceCoin({second:chanceCoin(),replacement:true,event:{type:'exact',color:'正',count:1},eventLabel:'两次恰好一次正面'})],prompt:'两次独立抛公平硬币。实际摆第一、第二次卡，按第一结果收录完整树，圈恰好一次正面的叶，填写概率。',explain:'正正、正反、反正、反反共4；正反、反正有利，2/4＝1/2。'},
 'D03.06':{kind:'weighted',models:[chanceSpinner([['红',3],['蓝',1]],{event:{type:'color',color:'红'},eventLabel:'转到红色',compare:['红','蓝']})],prompt:'转盘红色占270°、蓝色90°，按4块等角原片逐片收录并圈红色片，填写概率，比较红蓝哪个更可能。',explain:'按等角小扇区计，红3/4、蓝1/4；两种颜色不代表各1/2。'}
};
for(const [skillId,t] of Object.entries(CHANCE_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'chanceLab',contentVersion:61,phase:'练',context:'具体结果、事件与等可能条件',hint:'先列全具体等可能身份；两次按第一结果逐分支摆卡。颜色是事件，不自动是等可能基本结果。',reason:{prompt:'概率结论需要什么依据？',options:['完整列举具体结果，先确认基本结果等可能，再把所问事件的有利身份或叶与全体比较','只看有几种颜色就平均分概率','尝试没出现某结果就能证明它不可能'],answer:0}});
if(typeof module!=='undefined')module.exports={CHANCE_TASKS,chanceBag,chanceCoin,chanceDie,chanceSpinner};

'use strict';
const chanceFactory=typeof module!=='undefined'?require('./chance'):{chanceBag,chanceCoin,chanceDie,chanceSpinner},cBag=chanceFactory.chanceBag,cCoin=chanceFactory.chanceCoin,cDie=chanceFactory.chanceDie,cSpin=chanceFactory.chanceSpinner;
const CHANCE_CASES={
 'D03.01':[
  [[cCoin({event:{type:'all'},eventLabel:'出现正或反'}),cCoin({event:{type:'color',color:'侧立'},eventLabel:'本题模型仅正反，问出现侧立'})],'按仅含正反的公平硬币模型列全并判断两事件。','正或反一定；模型内侧立不可能。','球袋改明确的两结果模型'],
  [[cDie(3,{event:{type:'even'},eventLabel:'偶数'}),cDie(3,{event:{type:'color',color:'4'},eventLabel:'编号4'})],'独立列全三张等可能卡，圈事件并判一定/不可能/可能。','偶数可能非一定，4不可能。','无提示：编号条件与不存在结果'],
  [[cBag(['蓝','蓝','蓝','红'],{event:{type:'color',color:'蓝'},eventLabel:'取蓝'}),cBag(['红'],{event:{type:'color',color:'红'},eventLabel:'取红'})],'隔日列全各袋实际球并判断事件；更可能仍不保证发生。','第一袋蓝可能非一定，第二袋红一定。','隔日：更可能反例与单球边界'],
  [[cSpin([['红',1],['蓝',1]],{event:{type:'color',color:'绿'},eventLabel:'绿'}),cSpin([['红',2]],{event:{type:'color',color:'红'},eventLabel:'红'})],'独立列转盘等角片结果并判断事件范围。','绿不可能；全红盘红一定。','备用：转盘与空/全事件']
 ],
 'D03.02':[
  [[cCoin({second:cCoin(),replacement:true,event:{type:'all'},eventLabel:'全部两次叶'})],'自己摆两次硬币卡并按第一结果列完整树，每个叶收录一次。','正正、正反、反正、反反共4。','一次身份改两阶段样本树'],
  [[cBag(['红','红','蓝','绿'],{event:{type:'all'},eventLabel:'所有球身份'})],'独立列全一次抽球的具体编号结果，不能合并同色。','4个不同具体球身份。','无提示：三颜色不等于四个球'],
  [[cDie(3,{second:cCoin(),replacement:true,event:{type:'all'},eventLabel:'编号加硬币'})],'隔日先抽等可能编号1/2/3，再抛硬币，摆卡列全结果树。','每编号有正反，共6叶。','隔日：两个不同设备的顺序步骤'],
  [[cSpin([['红',2],['蓝',1]],{event:{type:'all'},eventLabel:'全部等角片'})],'独立按3片等角基本结果收录转盘样本空间。','三个等角结果，红事件包含其中两个。','备用：扇区分割与事件身份']
 ],
 'D03.03':[
  [[cCoin({event:{type:'all'},eventLabel:'正反是否等可能'})],'列全公平硬币基本结果，分别判断基本结果与正反事件等可能。','基本结果等可能，两个单结果事件也相等。','颜色不等例改等可能正反边界'],
  [[cSpin([['红',1],['蓝',3]],{event:{type:'color',color:'蓝'},eventLabel:'红蓝是否等可能'})],'独立收录所有等角片，判断等角基本结果与红蓝事件是否等可能。','等角片各1/4，颜色1/4与3/4不相等。','无提示：非等大实际扇区'],
  [[cBag(['红','红','蓝','蓝'],{event:{type:'all'},eventLabel:'颜色是否等可能'})],'隔日列全部四球身份，再判断球与颜色的等可能性。','每球等可能，红蓝各2/4也相等。','隔日：颜色频数相等的有效条件'],
  [[cBag(['红','红','红','蓝','绿'],{event:{type:'all'},eventLabel:'三个颜色是否都等可能'})],'独立列五球身份并判断基本球和三个颜色事件的等可能性。','具体球相等，红3/5与蓝绿各1/5不全相等。','备用：三个事件中只有两个相等']
 ],
 'D03.04':[
  [[cBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'红球'})],'列全部具体球身份，圈红事件身份后填概率。','3/4。','编号条件改颜色合并事件'],
  [[cDie(5,{event:{type:'atLeast',value:4},eventLabel:'编号至少4'})],'独立列1至5，圈编号至少4的结果并填写概率。','4、5有利，2/5。','无提示：不等式事件与五结果'],
  [[cCoin({second:cCoin(),replacement:true,event:{type:'atLeastCount',color:'正',count:1},eventLabel:'至少一次正面'})],'隔日列两次硬币结果并圈至少一次正面，填写概率。','正正、正反、反正，共3/4。','隔日：恰好改至少的事件差别'],
  [[cBag(['红','蓝'],{event:{type:'color',color:'绿'},eventLabel:'绿球'})],'独立列具体球，明确标无有利结果并填写绿事件概率。','0/2＝0。','备用：空事件概率']
 ],
 'D03.05':[
  [[cDie(3,{second:cCoin(),replacement:true,event:{type:'firstEvenSecond',color:'正'},eventLabel:'编号偶数且硬币正面'})],'先抽编号1/2/3，再抛硬币，列完整树并圈两个条件都满足的叶，填概率。','仅2正有利，1/6。','两个不同设备与且条件'],
  [[cBag(['红','红','蓝'],{second:cBag(['红','红','蓝']),replacement:false,event:{type:'both',color:'红'},eventLabel:'两次均红，不放回'})],'独立从三球混匀袋连续取两球不放回，列具体身份树，圈两次都红的叶，填概率。','B1B2、B2B1有利，2/6＝1/3。','无提示：不放回，第二支不能重复原身份'],
  [[cCoin({second:cCoin(),replacement:true,event:{type:'same'},eventLabel:'两次相同'})],'隔日两次独立公平硬币，列树圈两次相同并填概率。','正正、反反，共2/4。','隔日：事件由恰好一次改同结果'],
  [[cBag(['红','蓝'],{second:cBag(['红','蓝']),replacement:true,event:{type:'both',color:'红'},eventLabel:'两次均红，每次放回'})],'独立两球袋取一次放回混匀再取，列树圈两次红，填概率。','红红有利，1/4；同一球身份可以再次取到。','备用：放回与不放回条件对照']
 ],
 'D03.06':[
  [[cBag(['红','红','红','蓝'],{event:{type:'color',color:'红'},eventLabel:'取红',compare:['红','蓝']})],'转盘换球袋：列等可能具体球，圈红事件、填概率并比较红蓝。','红3/4，蓝1/4。','角度权重换实际球频数'],
  [[cSpin([['红',1],['蓝',2],['绿',1]],{event:{type:'color',color:'蓝'},eventLabel:'蓝色',compare:['红','蓝']})],'独立按等角片列转盘空间，圈蓝、填概率并比较红蓝。','蓝2/4＝1/2，红1/4；蓝更可能。','无提示：三色与非等大扇区'],
  [[cSpin([['红',2],['蓝',2]],{event:{type:'color',color:'红'},eventLabel:'红色',compare:['红','蓝']})],'隔日按四等角片列空间，圈红事件并比较两个颜色概率。','红蓝各2/4，相同。','隔日：等大事件边界'],
  [[cBag(['红','蓝','蓝','蓝','蓝'],{event:{type:'color',color:'蓝'},eventLabel:'蓝球',compare:['红','蓝']})],'独立列五个具体球，圈蓝球身份、填概率并比较红蓝。','蓝4/5，红1/5，蓝更可能。','备用：多球身份和方向反转']
 ]
};
const chanceSource=typeof module!=='undefined'?require('./chance').CHANCE_TASKS:CHANCE_TASKS,chanceTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(CHANCE_CASES)){chanceTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [models,prompt,explain,changeDimension]=cases[i];chanceTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'chanceLab',kind:chanceSource[skillId].kind,contentVersion:62,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',models,prompt,explain,changeDimension,context:'完整空间与有利结果',...(stage==='transfer'?{hint:'从等可能基本身份开始，按第一结果列所有后续；明确放回/不放回与事件条件。'}:{})}}}
if(typeof module!=='undefined')module.exports={CHANCE_CASES};

'use strict';
function chanceOutcomes(m){return m.second?m.atoms.flatMap(a=>m.second.atoms.filter(b=>m.replacement!==false||a.id!==b.id).map(b=>[a.id,b.id])):m.atoms.map(a=>[a.id])}
function chanceLegal(m,tuple){return tuple.length===(m.second?2:1)&&m.atoms.some(a=>a.id===tuple[0])&&(!m.second||m.second.atoms.some(b=>b.id===tuple[1])&&(m.replacement!==false||tuple[0]!==tuple[1]))}
function chanceFavorable(m,tuple){const values=tuple.map((id,i)=>(i===0?m:m.second).atoms.find(p=>p.id===id)),e=m.event;if(!values.every(Boolean))return false;if(e.type==='all')return true;if(e.type==='color')return values[0].color===e.color;if(e.type==='even')return Number(values[0].color)%2===0;if(e.type==='atLeast')return Number(values[0].color)>=e.value;if(e.type==='exact')return values.filter(p=>p.color===e.color).length===e.count;if(e.type==='atLeastCount')return values.filter(p=>p.color===e.color).length>=e.count;if(e.type==='both')return values.every(p=>p.color===e.color);if(e.type==='same')return values.every(p=>p.color===values[0].color);if(e.type==='firstEvenSecond')return Number(values[0].color)%2===0&&values[1].color===e.color;return false}
function chanceLabelEqual(m){const counts={};for(const p of m.atoms)counts[p.color]=(counts[p.color]||0)+1;return new Set(Object.values(counts)).size===1}
function chanceCertainty(m){const all=chanceOutcomes(m),n=all.filter(t=>chanceFavorable(m,t)).length;return n===0?'impossible':n===all.length?'certain':'possible'}
function chanceCompare(m){const counts=m.compare.map(color=>m.atoms.filter(p=>p.color===color).length);return counts[0]===counts[1]?'equal':counts[0]>counts[1]?'first':'second'}
function chanceState(t){return draft.work??(draft.work={models:t.models.map(()=>({slots:['',''],records:[],serial:0,favorable:[],empty:false,numerator:0,denominator:0,certainty:'',basic:'',labels:'',compare:''})),moves:0,log:[]})}
function chanceColor(color){return {'红':'#f07863','蓝':'#78add7','绿':'#78b59e','正':'#e4c15c','反':'#90b1c6'}[color]||'#b6d6c5'}
function chanceWedge(start,angle){const cx=160,cy=145,r=105,point=a=>[cx+r*Math.cos((a-90)*Math.PI/180),cy+r*Math.sin((a-90)*Math.PI/180)],a=point(start),b=point(start+angle);return angle>=359.999?`M${cx-r},${cy}a${r},${r} 0 1,0 ${2*r},0a${r},${r} 0 1,0 ${-2*r},0Z`:`M${cx},${cy}L${a.join(',')}A${r},${r} 0 ${angle>180?1:0},1 ${b.join(',')}Z`}
function chanceSpinnerSvg(m){if(m.type!=='spinner')return '';let start=0;const n=m.atoms.length;return `<svg viewBox="0 0 320 280" role="img" aria-label="${esc(m.sectors.map(s=>s.color+s.size*360/n+'度').join('、'))}">${m.sectors.map(s=>{const angle=s.size*360/n,path=chanceWedge(start,angle);start+=angle;return `<path d="${path}" fill="${chanceColor(s.color)}" stroke="#334e54" stroke-width="2"/>`}).join('')}${m.atoms.map((p,i)=>`<path d="${chanceWedge(i*360/n,360/n)}" fill="none" stroke="#fff" stroke-dasharray="4 3"/>`).join('')}<text x="160" y="270" text-anchor="middle" font-size="17">每个等角原片${360/n}°</text></svg>`}
function chanceBoard(t){const w=chanceState(t);return `<div class="board chance-board"><h3>${esc(t.context)}</h3><div class="work-buttons"><button data-action="chanceUndo" ${w.log.length?'':'disabled'}>↩ 撤回</button></div>${t.models.map((m,index)=>{const s=w.models[index],needsEvent=['certainty','favorable','two','weighted'].includes(t.kind);return `<section class="chance-model"><h4>实验盘${index+1} · ${esc(m.name)}</h4><p>本模型${m.type==='spinner'?'每个等角小扇区':m.type==='coin'?'公平正反':m.type==='bag'?'每个原球':'每张原卡'}等可能。${m.second?`第二次：${esc(m.second.name)}；${m.replacement===false?'不放回，同一原球身份不能再取':'独立/放回，按本题可再出现同一结果'}。`:''}</p>${chanceSpinnerSvg(m)}<p>所问：${esc(m.eventLabel)}</p>${[m,...(m.second?[m.second]:[])].map((device,slot)=>`<section><b>第${slot+1}次来源 → 选择位：${esc(s.slots[slot]||'未摆')}</b><div class="work-buttons">${device.atoms.map(p=>`<button class="chance-atom" style="--atom-color:${chanceColor(p.color)}" data-action="chanceAtom" data-index="${index}" data-slot="${slot}" data-id="${p.id}" ${slot===1&&m.replacement===false&&s.slots[0]===p.id?'disabled':''} aria-pressed="${s.slots[slot]===p.id}">${esc(p.label)}<small>${p.id}</small></button>`).join('')}</div></section>`).join('')}<div class="work-buttons"><button data-action="chanceRecord" data-index="${index}" ${s.slots[0]&&(!m.second||s.slots[1])?'':'disabled'}>收录这一次具体结果/叶</button></div><div class="chance-tree">${m.atoms.map(a=>`<section><h5>首结果 ${esc(a.label)}（${a.id}）</h5>${s.records.filter(r=>r.tuple[0]===a.id).map(r=>`<div class="chance-leaf"><span>${r.tuple.map((id,slot)=>{const p=(slot?m.second:m).atoms.find(p=>p.id===id);return esc((p?.label||id)+'（'+id+'）')}).join(' → ')}</span>${needsEvent?`<button data-action="chanceFavor" data-index="${index}" data-id="${r.id}" aria-pressed="${s.favorable.includes(r.id)}">${s.favorable.includes(r.id)?'已圈有利叶':'圈为有利叶'}</button>`:''}<button data-action="chanceDelete" data-index="${index}" data-id="${r.id}">删这条记录</button></div>`).join('')||'<p>尚无记录</p>'}</section>`).join('')}</div>${needsEvent?`<div class="work-buttons"><button data-action="chanceEmpty" data-index="${index}" aria-pressed="${s.empty}">事件无有利结果</button></div>`:''}${['favorable','two','weighted'].includes(t.kind)?`<div class="work-buttons"><b>我填概率 ${s.numerator}/${s.denominator||'待填'}</b>${['numerator','denominator'].map(key=>`<span>${key==='numerator'?'分子':'分母'}</span>${[-1,1,5].map(delta=>`<button data-action="chanceAmount" data-index="${index}" data-key="${key}" data-delta="${delta}" ${s[key]+delta>=0&&s[key]+delta<=100?'':'disabled'}>${delta>0?'＋':'－'}${Math.abs(delta)}</button>`).join('')}`).join('')}</div>`:''}${t.kind==='certainty'?`<div class="work-buttons">${[['certain','一定'],['impossible','不可能'],['possible','可能但不一定']].map(([value,label])=>`<button data-action="chanceChoice" data-index="${index}" data-key="certainty" data-value="${value}" aria-pressed="${s.certainty===value}">${label}</button>`).join('')}</div>`:''}${t.kind==='equal'?['basic','labels'].map(key=>`<div class="work-buttons"><b>${key==='basic'?'可收录的基本身份/等角原片':'按颜色/标签合并后的全部事件'}是否都等可能？</b>${[['yes','是'],['no','否']].map(([value,label])=>`<button data-action="chanceChoice" data-index="${index}" data-key="${key}" data-value="${value}" aria-pressed="${s[key]===value}">${label}</button>`).join('')}</div>`).join(''):''}${t.kind==='weighted'?`<div class="work-buttons"><b>比较${esc(m.compare.join('与'))}</b>${[['first',m.compare[0]+'更可能'],['second',m.compare[1]+'更可能'],['equal','一样可能']].map(([value,label])=>`<button data-action="chanceChoice" data-index="${index}" data-key="compare" data-value="${value}" aria-pressed="${s.compare===value}">${esc(label)}</button>`).join('')}</div>`:''}</section>`}).join('')}</div>`}
function chanceGrade(t){const w=chanceState(t);const ok=t.models.every((m,index)=>{const s=w.models[index],all=chanceOutcomes(m),keys=s.records.map(r=>JSON.stringify(r.tuple));let good=keys.length===all.length&&new Set(keys).size===all.length&&all.every(p=>keys.includes(JSON.stringify(p)))&&s.records.every(r=>chanceLegal(m,r.tuple));if(['certainty','favorable','two','weighted'].includes(t.kind)){const favor=s.records.filter(r=>chanceFavorable(m,r.tuple)).map(r=>r.id);good=good&&s.favorable.length===favor.length&&favor.every(id=>s.favorable.includes(id))&&(favor.length?!s.empty:s.empty);if(t.kind==='certainty')good=good&&s.certainty===chanceCertainty(m);else good=good&&s.denominator>0&&s.numerator>=0&&s.numerator<=s.denominator&&s.numerator*all.length===s.denominator*all.filter(p=>chanceFavorable(m,p)).length}if(t.kind==='equal')good=good&&s.basic==='yes'&&s.labels===(chanceLabelEqual(m)?'yes':'no');if(t.kind==='weighted')good=good&&s.compare===chanceCompare(m);return good});return {ok,incomplete:w.moves===0,reason:'具体身份/等角片/两次叶必须全部恰好一次。按事件定义圈有利叶，先确认基本结果等可能再计概率；放回条件改变合法后续，同颜色或同标签不自动等可能。'}}
function chanceAct(action,data,t){const w=chanceState(t),index=Number(data.index),m=t.models[index],s=w.models[index],slot=Number(data.slot),delta=Number(data.delta),snapshot=JSON.stringify({...w,log:[]});let changed=false;
 if(action==='chanceAtom'&&m&&[0,1].includes(slot)){const device=slot?m.second:m;if(device?.atoms.some(p=>p.id===data.id)&&!(slot===1&&m.replacement===false&&s.slots[0]===data.id)){s.slots[slot]=data.id;if(slot===0&&m.replacement===false&&s.slots[1]===data.id)s.slots[1]='';changed=true}}
 if(action==='chanceRecord'&&m&&chanceLegal(m,s.slots.slice(0,m.second?2:1))&&s.records.length<50){s.records.push({id:'R'+(++s.serial),tuple:s.slots.slice(0,m.second?2:1)});s.slots=['',''];changed=true}
 if(action==='chanceDelete'&&s){const at=s.records.findIndex(r=>r.id===data.id);if(at>=0){s.records.splice(at,1);s.favorable=s.favorable.filter(id=>id!==data.id);changed=true}}
 if(action==='chanceFavor'&&s&&s.records.some(r=>r.id===data.id)){const at=s.favorable.indexOf(data.id);at<0?s.favorable.push(data.id):s.favorable.splice(at,1);s.empty=false;changed=true}
 if(action==='chanceEmpty'&&s){s.empty=!s.empty;if(s.empty)s.favorable=[];changed=true}
 if(action==='chanceAmount'&&s&&['numerator','denominator'].includes(data.key)&&[-1,1,5].includes(delta)&&s[data.key]+delta>=0&&s[data.key]+delta<=100){s[data.key]+=delta;changed=true}
 if(action==='chanceChoice'&&s&&({certainty:['certain','impossible','possible'],basic:['yes','no'],labels:['yes','no'],compare:['first','second','equal']}[data.key]||[]).includes(data.value)){s[data.key]=data.value;changed=true}
 if(action==='chanceUndo'&&w.log.length){const log=w.log,state=JSON.parse(log.pop()),moves=w.moves+1;Object.assign(w,state,{log,moves});return true}if(changed){w.log.push(snapshot);w.moves++;return true}return false;
}
function chanceSpeech(t){const w=chanceState(t);return t.models.map((m,i)=>`${m.name}；事件${m.eventLabel}；已录${w.models[i].records.length}个具体结果：${w.models[i].records.map(r=>r.tuple.join('然后')).join('、')||'无'}；有利圈${w.models[i].favorable.length}个；填概率${w.models[i].numerator}/${w.models[i].denominator||'未填'}；判断${w.models[i].certainty||w.models[i].compare||w.models[i].labels||'未选'}`).join('。')}
function chancePage(){const t=CHANCE_TASKS[microSkillId],skill=SKILL_DATA.skills.find(s=>s.id===microSkillId);if(!t||!skill)return '<div class="panel">操作任务不存在。</div>';return `<div class="page-head"><div><p class="kicker">${esc(t.skillId)} · 概率</p><h1>${esc(skill.name||skill.title)}</h1></div><button class="back" data-action="micro" data-code="${esc(t.skillId)}">← 微技能</button></div><div class="work"><article class="panel"><h2 class="task-title">${esc(t.prompt)}</h2><div class="workshop-check-top"><button class="primary" data-action="${feedback?.ok?'next':'check'}">${feedback?.ok?'完成本题，回到微技能 →':'检查操作与理由 ✓'}</button></div>${chanceBoard(t)}${reasonBlock(t)}${actionRow(t)}</article><aside class="side-stack"><section class="panel"><h3>原结果与合并事件</h3><p>同色不同编号是不同球；转盘用等角基本片比较实际角度。完整树按第一结果逐分支列举，不能用试验没出现来证明不可能。</p></section></aside></div>`}
if(typeof module!=='undefined')module.exports={chanceOutcomes,chanceLegal,chanceFavorable,chanceLabelEqual,chanceCertainty,chanceCompare,chanceWedge};

'use strict';
function motionPolygon(points,steps,extra={}){return {points:points.map(([x,y],i)=>({id:String.fromCharCode(65+i),x,y})),steps,...extra}}
function motionFoldPaper(folds,cuts,extra={}){return {size:4,folds,cuts,...extra}}
const MV={type:'reflect',axis:'vertical',value:0},MH={type:'reflect',axis:'horizontal',value:0},MD={type:'reflect',axis:'diagonal',value:0},FX={axis:'vertical',value:1.5,from:'low'},FY={axis:'horizontal',value:1.5,from:'low'};
const MOTION_TASKS={
 'S01.01':{kind:'axis',...motionPolygon([[-2,0],[0,2],[2,0],[0,-1]],[MV]),prompt:'找出这只风筝的对称轴。先选择原点编号，在网格标每个点镜映后的预测位置，再锁定预测；选择轴实际镜映，核验各点对应与原图是否重合。',explain:'竖轴x＝0；A与C互换，B和D在轴上对应自己，整个图保持相同。'},
 'S01.02':{kind:'mirror',...motionPolygon([[1,0],[3,0],[1,2]],[MV]),prompt:'先预测三点关于竖线x＝0镜映后的对应位置；锁定后选择这根轴，实际镜映原三角形并检验朝向。',explain:'A(−1,0)、B(−3,0)、C(−1,2)；离轴距离相同，镜映改变朝向。'},
 'S01.03':{kind:'rotate',...motionPolygon([[2,1],[3,1],[2,2]],[{type:'rotate',cx:1,cy:1,angle:90,direction:'cw'}]),prompt:'三角形绕(1,1)顺时针旋转90°。先在网格预测各点，再锁定；点旋转中心、设方向角度并真正转动原图。',explain:'相对中心转四分之一圈，得到A(1,0)、B(1,−1)、C(2,0)。中心不应默认原点。'},
 'S01.04':{kind:'translate',...motionPolygon([[-2,-1],[0,-1],[-2,1]],[{type:'translate',dx:2,dy:1}]),prompt:'把三角形向右2格、向上1格平移。先预测每点位置，再锁定；设置同一位移，让原点整体实际移动。',explain:'每点都加(2,1)，朝向和大小不变：A(0,0)、B(2,0)、C(0,2)。'},
 'S01.05':{kind:'fold',...motionFoldPaper([FX,FY],[[3,3]]),prompt:'4×4方格纸，先把左半沿x＝1.5折向右，再把下半沿y＝1.5折向上；在叠层格(3,3)剪一个方孔。先圈完全展开的预测孔格，再锁定，亲手折、剪、逐次展开核验。',explain:'叠层(3,3)来自原格(0,0)、(0,3)、(3,0)、(3,3)。剪一次穿四层，完全展开有四孔。'}
};
for(const [skillId,t] of Object.entries(MOTION_TASKS))Object.assign(t,{id:`O-${skillId.replace('.', '-')}-1`,skillId,mode:'motionLab',contentVersion:63,phase:'练',context:'先预测、再变换、逐帧检验',hint:'镜映看轴的等距对应，旋转看指定中心与方向角，平移每点同向同距；折纸保留每层原身份，剪孔穿过当前叠层。',reason:{prompt:'什么能证明预测与实际变换一致？',options:['原身份逐点对应，轴/中心/方向/位移正确；折纸剪到的是同一叠层中所有原格，展开逐层保留孔','只要最后外形相像，不用核对点的原编号','旋转总围绕原点，剪一次总只有一个孔'],answer:0}});
if(typeof module!=='undefined')module.exports={MOTION_TASKS,motionPolygon,motionFoldPaper,MV,MH,MD,FX,FY};

'use strict';
const motionFactory=typeof module!=='undefined'?require('./motion'):{motionPolygon,motionFoldPaper,MV,MH,MD,FX,FY},mp=motionFactory.motionPolygon,mf=motionFactory.motionFoldPaper,mv=motionFactory.MV,mh=motionFactory.MH,md=motionFactory.MD,fx=motionFactory.FX,fy=motionFactory.FY;
const MOTION_CASES={
 'S01.01':[
  [mp([[0,-2],[2,0],[0,2],[-1,0]],[mh]),'找横向风筝的轴，先标预测对应点，再锁定实际镜映。','横轴y＝0，A/C对应，B/D自对应。','竖轴改横轴'],
  [mp([[0,3],[2,2],[3,0],[-1,-1]],[md]),'独立从候选轴找本图对称轴，预测每点再实际镜映。','轴y＝x；A/C互换，B/D自对应。','无提示：斜轴'],
  [mp([[-1,0],[1,2],[3,0],[1,-1]],[{type:'reflect',axis:'vertical',value:1}]),'隔日找到偏离原点的竖对称轴，预测并镜映核验。','轴x＝1。','隔日：轴平移不再经过原点'],
  [mp([[0,-1],[2,1],[0,3],[-1,1]],[{type:'reflect',axis:'horizontal',value:1}]),'独立找偏移横轴，逐点预测并镜映。','轴y＝1。','备用：偏移横轴']
 ],
 'S01.02':[
  [mp([[0,1],[2,1],[0,3]],[mh]),'先预测关于y＝0的镜像，再锁定实际镜映。','各点y取相反数，朝向反转。','竖镜改横镜'],
  [mp([[0,0],[2,0],[0,1]],[{type:'reflect',axis:'vertical',value:1}]),'独立预测关于x＝1的镜像，再用正确轴变换。','A(2,0)、B(0,0)、C(2,1)。','无提示：偏移轴和轴两侧点'],
  [mp([[1,0],[2,0],[1,1]],[mv,{type:'translate',dx:1,dy:0}]),'隔日先关于x＝0镜映，再向右1格。预测最后每点，按规定顺序实际操作并回放。','先镜后移，A(0,0)、B(−1,0)、C(0,1)。','隔日：复合变换顺序明确'],
  [mp([[1,0],[3,0],[1,2]],[md]),'独立预测关于y＝x的镜像，实际变换后核验编号。','坐标互换：A(0,1)、B(0,3)、C(2,1)。','备用：斜轴镜像']
 ],
 'S01.03':[
  [mp([[1,0],[3,0],[1,2]],[{type:'rotate',cx:0,cy:0,angle:90,direction:'ccw'}]),'绕原点逆时针90°，先预测再设中心方向角实际旋转。','(x,y)变(−y,x)。','换中心并顺时针改逆时针'],
  [mp([[2,1],[3,1],[2,2]],[{type:'rotate',cx:1,cy:1,angle:180,direction:'cw'}]),'独立绕(1,1)旋转180°，预测并真正转图。','A(0,1)、B(−1,1)、C(0,0)。','无提示：半圈与非原点中心'],
  [mp([[0,1],[1,1],[0,2]],[{type:'rotate',cx:-1,cy:1,angle:90,direction:'cw'}]),'隔日绕(−1,1)顺时针90°，先预测再实际旋转。','相对新中心转动，中心不变。','隔日：负坐标中心'],
  [mp([[1,0],[2,0],[1,1]],[{type:'rotate',cx:0,cy:0,angle:270,direction:'ccw'}]),'独立绕原点逆时针270°，先预测再实际旋转并回放。','与顺时针90°终态相同，仍按指定方向角执行。','备用：等终态但不同指定转向角']
 ],
 'S01.04':[
  [mp([[0,0],[2,0],[0,1]],[{type:'translate',dx:-2,dy:2}]),'向左2、向上2，逐点预测后锁定实际平移。','所有点同加(−2,2)。','向右改向左并同时上移'],
  [mp([[-1,1],[1,1],[-1,3]],[{type:'translate',dx:1,dy:-2}]),'独立向右1、向下2，预测并实际移动全图。','所有点加(1,−2)，保留朝向。','无提示：向下与负坐标'],
  [mp([[1,0],[2,0],[1,1]],[{type:'translate',dx:1,dy:0},mv]),'隔日先向右1，再关于x＝0镜映。先预测最终点，按指定顺序操作并回放；与先镜后移比较位置。','先移后镜，A(−2,0)、B(−3,0)、C(−2,1)，不同于先镜后移。','隔日：与S01.02对照复合顺序'],
  [mp([[1,-1],[3,-1],[1,1]],[{type:'translate',dx:-1,dy:0}]),'独立只向左1，逐点预测和实际移动；竖坐标保持不变。','每点只减横坐标1。','备用：零纵向位移边界']
 ],
 'S01.05':[
  [mf([fx],[[3,1]]),'只把左半折向右，剪叠层格(3,1)。先预测展开孔，再实际折剪并逐层展开。','原(0,1)、(3,1)两孔。','两折改一折、四层改两层'],
  [mf([fy,fx],[[2,3]]),'独立先下半折上，再左半折右，剪(2,3)。先预测完全展开孔，再实操。','原(1,0)、(1,3)、(2,0)、(2,3)。','无提示：折序与切口换位置'],
  [mf([fx,fy],[[2,2],[3,3]]),'隔日两折后剪(2,2)与(3,3)两个方孔。先预测展开所有孔，再操作折剪展开。','两个叠层孔各穿4原格，共8孔。','隔日：两个切口与叠层原身份'],
  [mf([fy],[[1,2]]),'独立只把下半折上，剪(1,2)并展开；先预测各原孔格。','原(1,1)、(1,2)两孔。','备用：横折与相邻孔']
 ]
};
const motionSource=typeof module!=='undefined'?require('./motion').MOTION_TASKS:MOTION_TASKS,motionTarget=typeof module!=='undefined'?require('./staged').STAGED_TASKS:STAGED_TASKS;
for(const [skillId,cases] of Object.entries(MOTION_CASES)){motionTarget[skillId]={};for(const [i,stage] of ['transfer','independent','delayed','independent2'].entries()){const [params,prompt,explain,changeDimension]=cases[i];motionTarget[skillId][stage]={id:`T-${skillId.replace('.', '-')}-${i+1}`,skillId,mode:'motionLab',kind:motionSource[skillId].kind,contentVersion:64,phase:stage==='transfer'?'迁移':stage==='delayed'?'巩固':'测',...params,prompt,explain,changeDimension,context:'原身份变换与叠层展开',...(stage==='transfer'?{hint:'先预测并锁定；按指定轴、中心、方向或位移操作；每折保留全部原纸层身份。'}:{})}}}
if(typeof module!=='undefined')module.exports={MOTION_CASES};


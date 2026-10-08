'use strict';
let competitionSceneSerial=0;
function competitionScene(d){
 const e=esc,numeric=v=>typeof v==='string'&&v.includes('/')?v.split('/').map(Number).reduce((a,b)=>a/b):Number(v);
 const caption=d.caption||'',uid='scene-'+(++competitionSceneSerial),text=(x,y,t,anchor='middle')=>`<text x="${x}" y="${y}" text-anchor="${anchor}">${e(t)}</text>`;
 const svg=(art,description=caption,w=480,h=240)=>`<svg class="scene-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${e(description)}"><title>${e(description)}</title><defs><linearGradient id="${uid}-shine" x2="0" y2="1"><stop stop-color="#fff9be"/><stop offset=".5" stop-color="#f7c64d"/><stop offset="1" stop-color="#ca8a18"/></linearGradient><linearGradient id="${uid}-blue" x2="0" y2="1"><stop stop-color="#adddf9"/><stop offset="1" stop-color="#4694cc"/></linearGradient><linearGradient id="${uid}-red" x2="0" y2="1"><stop stop-color="#ffb09e"/><stop offset="1" stop-color="#d8584b"/></linearGradient></defs>${art}</svg>`;
 const wrap=body=>`<figure class="competition-scene" data-scene-kind="${e(d.kind)}">${body}${caption?`<figcaption>${e(caption)}</figcaption>`:''}</figure>`;
 const person=(color='blue')=>`<span class="scene-person ${color}" aria-hidden="true"><i class="scene-head"><b></b></i><i class="scene-body"></i><i class="scene-arm left"></i><i class="scene-arm right"></i><i class="scene-leg left"></i><i class="scene-leg right"></i></span>`;
 const object=(type,color)=>type==='person'?person(color):`<span class="scene-object ${e(type||'block')} ${color}" aria-hidden="true"></span>`;
 const objects=(count,type='block',color='blue')=>{
  if(!Number.isInteger(count)||count<0)return `<span class="scene-unknown" aria-label="数量未知">?</span>`;
  if(count>18)return `<span class="scene-compressed">${object(type,color)}<b>× ${count}</b></span>`;
  return Array.from({length:count},()=>object(type,color)).join('')||'<span class="scene-empty">0</span>';
 };
 const score=v=>{
  if(v===null||v===undefined)return '';
  const amount=numeric(v);
  let coins='',multiplier='';
  if(amount===0)coins='';
  else if(amount>0&&amount<=12){const whole=Math.floor(amount),part=amount-whole;coins=Array.from({length:whole},()=>'<i class="scene-point" aria-hidden="true"></i>').join('');if(part>1e-10)coins+=`<i class="scene-point scene-partial-point" style="--part:${part}" aria-hidden="true"></i>`}
  else {coins='<i class="scene-point" aria-hidden="true"></i>';multiplier='× '}
  return `<span class="scene-score"><span class="scene-points" data-token-value="${e(v)}"${Number.isInteger(amount)&&amount<=12?` data-token-count="${amount}"`:''}>${coins}</span><strong>${multiplier}${e(v)}</strong></span>`;
 };
 if(d.kind==='scene-stage'){
  const picture=d.routeDiagram?competitionDiagram(d.routeDiagram):competitionDiagram(d.scene);
  return `<section class="scene-stage" data-scene-stage="${e(d.stage.kind)}" data-step="${d.stage.step||0}">${picture}<p class="scene-step-caption">${e(d.stage.text)}</p></section>`;
 }
 if(d.kind==='scene-units')return wrap(`<div class="scene-groups">${d.groups.map((g,i)=>`<section class="scene-group" data-count="${e(g.count)}"><header><b>${e(g.name)}</b><span>${e(g.count)} ${e(g.unit)}</span></header><div class="scene-objects">${objects(g.count,d.object,i===0?'red':'blue')}</div>${g.score!==null&&g.score!==undefined?`<div class="scene-per-person">${d.scoreLabel||('每'+(d.object==='person'?'人':['ticket','stamp'].includes(d.object)?'张':d.object==='coin'?'枚':'个'))} ${score(g.score)} ${e(d.scoreUnit||(['ticket','stamp','coin'].includes(d.object)?'元':'分'))}</div>`:''}</section>`).join('')}</div>${d.average!==undefined?`<p class="scene-target">全体平均：${e(d.average)} 分</p>`:''}`);
 if(d.kind==='scene-share')return wrap(`<p class="scene-target">总分 ${e(d.totalScore)} ÷ ${d.people} 份</p><div class="scene-share-people">${Array.from({length:d.people},()=>`<div>${person('blue')}<div>${score(d.average)}</div></div>`).join('')}</div>${d.base!==null?`<p class="scene-target">每人 ${e(d.base)} + ${e(d.extraAverage)} = ${e(d.average)}</p>`:''}`);
 if(d.kind==='scene-areaPairs')return wrap(`<div class="scene-area-pairs">${d.rows.map(r=>`<div><svg class="scene-pair-svg" viewBox="0 0 150 95" role="img" aria-label="长${r.h}，宽${r.w}，面积${r.area}"><rect x="12" y="10" width="${110*r.h/Math.max(r.w,r.h)}" height="${65*r.w/Math.max(r.w,r.h)}" fill="#b8d8e9" stroke="#577b92"/><text x="75" y="91" text-anchor="middle">${r.w} × ${r.h} = ${r.area}</text></svg></div>`).join('')}</div>`);
 if(d.kind==='scene-purchase'){
  const packs=d.packs||[{size:d.size,price:d.pack}];
  const type=/苗/.test(d.object)?'seedling':'pencil',unit=d.object?.[0]||'支';
  return wrap(`<div class="scene-purchase"><div class="scene-products">${packs.map(p=>`<section class="scene-package"><div class="scene-package-top">${e(p.size)} ${e(unit)}装</div><div class="scene-package-items">${objects(p.size,type,'blue')}</div><div class="scene-price">每包 ${e(p.price)} 元</div></section>`).join('')}${d.single!==undefined?`<section class="scene-single">${objects(1,type)}<p>单${e(unit)} ${e(d.single)} 元</p></section>`:''}</div><div class="scene-demand"><b>需要 ${d.enough?'至少':'恰好'} ${e(d.count)}</b><span>${e(d.object||'支笔')}</span></div></div>`);
 }
 if(d.kind==='scene-slots')return wrap(`<div class="scene-slots"${d.choose?` data-choose="${d.choose}"`:''}>${d.values.map((v,i)=>`<div class="scene-slot"><b>${e(v)}</b>${d.positions?`<span>${i+1}</span>`:''}</div>`).join('')}</div>`);
 if(d.kind==='scene-placeValue')return wrap(`<div class="scene-place-rows">${d.rows.map(r=>`<div><span>${e(r.label)}</span><div class="scene-slots">${r.digits.map((digit,i)=>`<div class="scene-slot"><b>${e(digit)}</b><small>${e(['百位','十位','个位'].slice(-r.digits.length)[i])}</small></div>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-flow')return wrap(`<div class="scene-flow">${d.nodes.map((n,i)=>`${i?'<span class="scene-flow-arrow" aria-hidden="true">→</span>':''}<div class="scene-flow-node"><span>${e(n.label)}</span><b>${e(n.value)}</b></div>`).join('')}</div>`);
 if(d.kind==='scene-twoFlows')return wrap(`<div class="scene-two-flows">${d.rows.map(r=>`<div><b>${e(r.name)}</b><div class="scene-flow">${r.nodes.map((value,i)=>`${i?'<span class="scene-flow-arrow" aria-hidden="true">→</span>':''}<div class="scene-flow-node"><b>${e(value)}</b></div>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-strips'){
  const max=Math.max(...d.rows.map(r=>r.parts));
  return wrap(`<div class="scene-strip-rows">${d.rows.map((r,i)=>{const cells=Number.isInteger(r.parts)&&r.parts<=24?Array.from({length:r.parts},()=>'<i></i>').join(''):'<i></i>';return `<div class="scene-strip-row"><b>${e(r.label)}</b><div class="scene-strip ${i%2?'blue':'red'}" style="width:${d.separateWholes?100:Math.max(6,100*r.parts/max)}%" data-parts="${r.parts}">${cells}</div><span>${e(r.value)}</span></div>`}).join('')}</div>`);
 }
 if(d.kind==='scene-fractions'){
  const cells=(n,used)=>Array.from({length:n},(_,i)=>`<i class="${i<used?'scene-used':''}"><span>${i<used?'用':'留'}</span></i>`).join('');
  return wrap(`<div class="scene-fraction-rows"><section><header>最初：${e(d.start)} ${e(d.unit)}</header><div class="scene-fraction-strip">${cells(d.d1,1)}</div><small>第一次的整体是最初全部</small></section><section class="${d.original?'':'scene-subwhole'}"${d.original?'':` style="width:${100*(d.secondOfUsed?1:d.d1-1)/d.d1}%"`}><header>第二次整体：${d.original?'最初全部':d.secondOfUsed?'第一次用掉':'第一次剩余'}</header><div class="scene-fraction-strip">${cells(d.d2,1)}</div><small>用掉这个整体的 1/${d.d2}</small></section><p>最后剩 ${e(d.left)} ${e(d.unit)}</p></div>`);
 }
 if(d.kind==='scene-join'){
  let art='';const pieceW=Math.min(116,360/d.n),lapW=pieceW*.16,x0=45,y=d.closed?45:85;
  if(!d.closed){for(let i=0;i<d.n;i++){const x=x0+i*(pieceW-lapW);art+=`<rect x="${x}" y="${y+i%2*7}" width="${pieceW}" height="35" rx="6" fill="url(#${uid}-${i%2?'red':'blue'})" stroke="#356878"/>`;if(i)art+=`<rect x="${x}" y="${y}" width="${lapW}" height="42" class="scene-overlap"/>`;art+=text(x+pieceW/2,y-14+i%2*7,'段'+(i+1))}
   art+=text(240,163,`每段 ${d.piece} 厘米；搭接 ${d.lap} 厘米`)+text(240,190,`长条总长 ${d.total} 厘米`);
  }else{
   for(let i=0;i<d.n;i++){const a=2*Math.PI*i/d.n,b=2*Math.PI*(i+1)/d.n,x=240+98*Math.cos(a),yy=102+65*Math.sin(a),xx=240+98*Math.cos(b),yyy=102+65*Math.sin(b);art+=`<path d="M${x} ${yy} L${xx} ${yyy}" stroke="${i%2?'#dc7664':'#64a7d4'}" stroke-width="19" stroke-linecap="round"/><circle cx="${x}" cy="${yy}" r="12" class="scene-overlap"/>`+text(240+140*Math.cos(a+Math.PI/d.n),102+85*Math.sin(a+Math.PI/d.n),'段'+(i+1))}
   art+=text(240,98,`每段 ${d.piece} 厘米`)+text(240,124,`每处重叠 ${d.lap} 厘米`);
  }return wrap(svg(art,`${d.n} 段${d.closed?'首尾闭合':'排成长条'}；每段 ${d.piece}，每处重叠 ${d.lap}；示意不按长度比例`));
 }
 if(d.kind==='scene-intervals'){
  const k=d.distance/d.gap;let art='<path d="M35 92 H445" class="scene-line"/>';
  for(let i=0;i<=k;i++){const x=35+410*i/k,active=d.ends||i>0&&i<k;art+=`<circle cx="${x}" cy="92" r="${active?7:5}" class="${active?'scene-mark':'scene-open-mark'}"/>`+text(x,124,i*d.gap);if(i<k)art+=text(x+205/k,67,d.gap)}
  art+=text(240,172,`总长 ${d.distance} 米；${d.ends?'端点也放':'端点不放（空心）'}`);return wrap(svg(art));
 }
 if(d.kind==='scene-ratioRectangle'){
  let art=`<rect x="70" y="50" width="${290*d.b/(d.a+d.b)}" height="${120*d.a/(d.a+d.b)}" class="scene-shape"/>`+text(240,185,`长 ${d.b} 份`)+text(380,108,`宽 ${d.a} 份`)+text(240,24,`一周 ${d.perimeter} 米`)+text(240,211,`宽 ${d.width} 米`);return wrap(svg(art,caption+'；示意图，比例按标注'));
 }
 if(d.kind==='scene-fixedPerimeter')return wrap(svg('<rect x="50" y="55" width="165" height="70" class="scene-shape"/><rect x="280" y="38" width="118" height="100" class="scene-shape"/>'+text(130,151,'长 ?，宽 ?')+text(340,162,'长 ?，宽 ?')+text(240,25,`同一周长 ${2*d.half}`),'同周长长方形的不同形状；示意图，边长未知'));
 if(d.kind==='scene-overlapSequence'){
  const start=40,cell=400/d.n,firstEnd=start+d.k*cell,lastStart=start+(d.k-1)*cell;
  let art=`<rect x="${start}" y="58" width="${d.k*cell}" height="56" rx="8" fill="#fbe1d7"/><rect x="${lastStart}" y="88" width="${d.k*cell}" height="56" rx="8" fill="#c4dfef"/>`;
  for(let i=0;i<d.n;i++)art+=`<rect x="${start+i*cell+2}" y="96" width="${cell-4}" height="30" rx="4" fill="${i===d.k-1?'#f9ca63':'white'}" stroke="#66858b"/>`+text(start+(i+.5)*cell,117,i===d.k-1&&d.knownMiddle!==null&&d.knownMiddle!==undefined?d.knownMiddle:'?')+text(start+(i+.5)*cell,163,i+1);
  art+=text((start+firstEnd)/2,40,`前 ${d.k} 个${d.totals?'合计 '+d.totals[0]:'平均 '+d.means[0]}`)+text((lastStart+440)/2,191,`后 ${d.k} 个${d.totals?'合计 '+d.totals[1]:'平均 '+d.means[1]}`)+text(240,216,`全部 ${d.n} 个${d.totals?'合计 '+d.totals[2]:'平均 '+d.means[2]}`);return wrap(svg(art,caption));
 }
 if(d.kind==='scene-balance'){
  let art='<path d="M240 91 V162 M195 166 H285 M86 65 H394 M98 65 V105 M382 65 V105" class="scene-line"/><path d="M42 105 Q98 160 154 105 Z M326 105 Q382 160 438 105 Z" class="scene-shape"/>';
  for(const [side,x]of [[d.left,52],[d.right,336]]){for(let i=0;i<side.boxes;i++)art+=`<rect x="${x+i*19}" y="83" width="16" height="20" rx="3" fill="url(#${uid}-blue)" stroke="#406d89"/>`;art+=text(x+44,151,side.weight+' 克')}
  art+=text(98,28,'左')+text(382,28,'右');return wrap(svg(art));
 }
 if(d.kind==='scene-circle'){
  const n=d.values.length;let art='';
  if(d.sectors){for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n,b=a+2*Math.PI/n,x=240+76*Math.cos(a),y=99+76*Math.sin(a),xx=240+76*Math.cos(b),yy=99+76*Math.sin(b),middle=(a+b)/2,val=d.values[i];art+=`<path d="M240 99 L${x} ${y} A76 76 0 ${b-a>Math.PI?1:0} 1 ${xx} ${yy} Z" fill="${d.excluded?.includes(val)?'#e8e8e8':val==='A'?'#f2bda5':val==='B'?'#b0d7ea':'#c6dfb5'}" stroke="white"/>`+text(240+54*Math.cos(middle),99+54*Math.sin(middle),val)}
  }else{art='<ellipse cx="240" cy="105" rx="118" ry="65" class="scene-tabletop"/>';for(let i=0;i<n;i++){const a=-Math.PI/2+2*Math.PI*i/n,x=240+143*Math.cos(a),y=105+79*Math.sin(a);art+=`<circle cx="${x}" cy="${y}" r="17" class="scene-shape"/>`+text(x,y+5,d.values[i])}}
  return wrap(svg(art));
 }
 if(d.kind==='scene-timeline'){
  const values=d.events,min=Math.min(...values),max=Math.max(...values),x=v=>55+370*(v-min)/(max-min||1);let art='<path d="M45 100 H440" class="scene-line"/>';
  for(const v of values)art+=`<circle cx="${x(v)}" cy="100" r="5" class="scene-mark"/>`+text(x(v),137,v);
  return wrap(svg(art,caption));
 }
 if(d.kind==='scene-twoTimelines'){
  let art='';for(let j=0;j<2;j++){const y=68+78*j,offset=d.offsets?.[j]||0;art+=`<path d="M45 ${y} H440" class="scene-line"/>`+text(23,y+6,j?'乙':'甲');for(let t=offset;t<=d.end;t+=d.periods[j]){const x=45+395*t/(d.end||1);art+=`<circle cx="${x}" cy="${y}" r="4" class="${!t&&!d.includeStart?'scene-open-mark':'scene-mark'}"/>`+text(x,y+24,t)}}return wrap(svg(art));
 }
 if(d.kind==='scene-journey')return wrap(`<div class="scene-journeys">${d.segments.map((s,i)=>`<div><b>${e(s.name)}</b><div class="scene-track"><i>${i?'←':'→'}</i></div><span>${e(s.speed)} ${d.distance?'千米/时':'单位/分钟'}</span>${d.distance?`<small>路程 ${d.distance}</small>`:''}</div>`).join('')}</div>${d.delay?`<p>先行时间 ${d.delay} 分钟</p>`:''}`);
 if(d.kind==='scene-climb'){
  const top=25,bottom=175,x=210;let art=`<path d="M${x} ${top} V${bottom}" class="scene-line"/><path d="M185 ${top} H255" stroke="#bf7256" stroke-width="4"/>`+text(289,top+5,d.height+'米')+text(184,bottom+20,'0');
  art+=`<path d="M170 ${bottom} V${bottom-140*d.up/d.height}" class="scene-up"/><path d="M250 ${bottom-140*d.up/d.height} V${bottom-140*(d.up-d.down)/d.height}" class="scene-down"/>`+text(113,111,'白天 +'+d.up)+text(326,144,'夜晚 −'+d.down);return wrap(svg(art));
 }
 if(d.kind==='scene-choices')return wrap(`<div class="scene-choice-cards">${d.values.map(x=>`<b>${e(x)}</b>`).join('')}</div><div class="scene-slots">${Array.from({length:d.places},(_,i)=>`<div class="scene-slot"><b>?</b><span>${i?'个位':'十位'}</span></div>`).join('')}</div><p>${d.repeat?'允许重复':'不能重复同一张卡'}</p>`);
 if(d.kind==='scene-product')return wrap(svg(`<rect x="54" y="35" width="135" height="135" class="scene-shape"/><rect x="272" y="35" width="157" height="112" class="scene-shape"/><rect x="272" y="35" width="23" height="112" fill="#f2c16b"/>`+text(120,197,`${d.n} × ${d.n}`)+text(350,180,`${d.n-d.delta} × ${d.n+d.delta}`),caption+'；分配关系示意，不按数字作单位格'));
 if(d.kind==='scene-squareBounds')return wrap(svg('<path d="M75 105 H405" class="scene-line"/><path d="M115 91 V119 M365 91 V119" class="scene-line"/><circle cx="240" cy="105" r="5" class="scene-mark"/>'+text(115,152,'?²')+text(240,81,d.n)+text(365,152,'(?+1)²')+text(240,193,d.upper?'求右侧边界整数':'求左侧边界整数'),caption));
 if(d.kind==='scene-age')return wrap(`<div class="scene-two-flows"><div><b>孩子</b><div class="scene-flow"><div class="scene-flow-node">${d.ago}年前 ?</div><span>→</span><div class="scene-flow-node">现在 ${e(d.child)}</div><span>→</span><div class="scene-flow-node">未来 ?</div></div></div><div><b>大人</b><div class="scene-flow"><div class="scene-flow-node">${d.ago}年前 ?</div><span>→</span><div class="scene-flow-node">现在 ${e(d.parent)}</div><span>→</span><div class="scene-flow-node">未来 ?</div></div></div><p>同一时刻，年龄差总为 ${d.gap}</p></div>`);
 if(d.kind==='scene-factorPairs')return wrap(svg('<rect x="55" y="45" width="160" height="90" class="scene-shape"/><rect x="280" y="26" width="80" height="160" class="scene-shape"/>'+text(135,165,'长 ? × 宽 ?')+text(400,108,'?')+text(240,213,`面积都为 ${d.product}`),caption+'；因数对应两条边，形状为示意'));
 if(d.kind==='scene-exponentGrid'){
  const cell=Math.min(25,330/(d.a+1),145/(d.b+1));let art='';for(let j=0;j<=d.b;j++)for(let i=0;i<=d.a;i++)art+=`<rect x="${70+i*cell}" y="${40+j*cell}" width="${cell}" height="${cell}" fill="${d.even&&(i%2||j%2)?'#ececea':'#acd1e7'}" stroke="white"/>`;
  art+=text(240,202,`2的指数：0…${d.a}；3的指数：0…${d.b}`)+text(240,22,'每个位置对应一个正因数');return wrap(svg(art));
 }
 if(d.kind==='scene-cumulative')return wrap(`<div class="scene-cumulative">${d.values.map((v,i)=>`<div><b>≤${i+1} 分：${v} 人</b><div class="scene-cumulative-bar" style="width:${100*v/d.values.at(-1)}%">${Array.from({length:i+1},(_,j)=>`<i>${j+1}分档</i>`).join('')}</div></div>`).join('')}</div>`);
 if(d.kind==='scene-branch')return wrap(`<div class="scene-branches">${d.branches.map(b=>`<div class="scene-flow"><div class="scene-flow-node"><b>${e(b.label)} ${b.count} 种</b></div>${b.next?`<span>→</span><div class="scene-flow-node"><b>${e(b.next.label)} ${b.next.count} 种</b></div>`:''}</div>`).join('<b class="scene-or">或</b>')}</div>${d.drinks?'<p class="scene-all-branches">两种午餐分支都再配：3种饮料</p>':''}`);
 if(d.kind==='scene-diceGrid'){
  const cell=Math.min(17,145/d.faces);let art='';for(let j=1;j<=d.faces;j++)for(let i=1;i<=d.faces;i++)art+=`<rect x="${125+(i-1)*cell}" y="${28+(j-1)*cell}" width="${cell}" height="${cell}" fill="${d.different&&i===j?'#e4e4e4':'#bdd9e9'}" stroke="white"/>`;
  art+=text(240,196,`行、列点数各 1 到 ${d.faces}，每格一个有序对`)+text(240,219,`目标：点数和 ${d.target}${d.different?'；灰色对角线不在样本中':''}`);return wrap(svg(art));
 }
 if(d.kind==='scene-remainderCards'){
  const blocks=Math.floor(d.count/d.mod),tail=d.count%d.mod;return wrap(`<div class="scene-remainder-cards">${d.includeZero?'<b class="scene-card">0</b>':''}<div class="scene-slots">${Array.from({length:d.mod},(_,i)=>`<div class="scene-slot"><b>${i+1}</b><span>余 ${(i+1)%d.mod}</span></div>`).join('')}</div><p>这样的完整组共 ${blocks} 组</p><div class="scene-slots">${Array.from({length:tail},(_,i)=>`<div class="scene-slot"><b>${blocks*d.mod+i+1}</b><span>余 ${i+1}</span></div>`).join('')}</div><p>目标余数 ${d.wanted}</p></div>`);
 }
 if(d.kind==='scene-sets'){
  let art='<rect x="35" y="15" width="410" height="182" rx="12" class="scene-domain"/><ellipse cx="197" cy="102" rx="101" ry="64" fill="#ffb19c" fill-opacity=".55" stroke="#ab6554"/><ellipse cx="292" cy="102" rx="101" ry="64" fill="#86bfdf" fill-opacity=".55" stroke="#477693"/>';
  art+=text(160,74,'甲组 '+d.a)+text(333,74,'乙组 '+d.b)+text(246,118,'交集 '+d.both);
  if(d.total!==null)art+=text(240,181,'全体 '+d.total);
  if(d.change)art+=text(240,220,d.change==='one-joins-second'?'一个只在甲的人 → 也加入乙':'一个圈外的人 → 同时加入两组');
  return wrap(svg(art,caption+'；区域面积不代表人数'));
 }
 if(d.kind==='scene-threeSets')return wrap(svg('<circle cx="205" cy="91" r="67" fill="#efd7bd" fill-opacity=".6" stroke="#977c59"/><circle cx="280" cy="91" r="67" fill="#b2d1e4" fill-opacity=".6" stroke="#5b7a91"/><circle cx="242" cy="149" r="67" fill="#c9dcb2" fill-opacity=".6" stroke="#6d855d"/>'+text(242,59,'甲乙 '+d.ab)+text(186,152,'甲丙 '+d.ac)+text(300,152,'乙丙 '+d.bc)+text(242,115,'三组 '+d.triple),caption+'；两组数字包含中心，不按区域面积估人数'));
 if(d.kind==='scene-ballRule')return wrap(`<div class="scene-groups"><div class="scene-group"><b>白球 ${d.white}</b><div class="scene-objects">${objects(d.white,'ball','white')}</div></div><div class="scene-group"><b>黑球 ${d.black}</b><div class="scene-objects">${objects(d.black,'ball','black')}</div></div></div><div class="scene-flow"><span>白白 / 黑黑</span><span>→</span>${object('ball','black')}<span>；白黑</span><span>→</span>${object('ball','white')}</div>`);
 if(d.kind==='scene-direction'){
  const names=['上0','右1','下2','左3'];return wrap(svg('<circle cx="130" cy="105" r="59" class="scene-domain"/>'+names.map((t,i)=>text(130+87*Math.sin(i*Math.PI/2),105-70*Math.cos(i*Math.PI/2),t)).join('')+`<path d="M130 125 V62 L120 75 M130 62 L140 75" transform="rotate(${d.start*90} 130 105)" class="scene-line"/>`+text(330,82,(d.anticlockwise?'逆':'顺')+'时针 '+d.turns+'×90°')+(d.mirror?text(330,128,d.reverseOrder?'先镜像后旋转':'先旋转后镜像'):''),caption));
 }
 if(d.kind==='scene-stairs'){
  const size=Math.min(14,330/d.n,145/d.n);let art='';for(let x=0;x<d.n;x++)for(let y=0;y<=x;y++)for(let z=d.depth-1;z>=0;z--){const xx=65+x*size+z*size*.35,yy=190-y*size-z*size*.25;art+=`<path d="M${xx} ${yy} l${size} 0 v${-size} h${-size} Z" fill="url(#${uid}-blue)" stroke="#547a91" stroke-width=".5"/><path d="M${xx} ${yy-size} l${size} 0 l${size*.3} ${-size*.3} h${-size} Z" fill="#d2e6f6"/>`}
  art+=text(240,24,`${d.n} 列，厚 ${d.depth} 块；左起高度逐列加1`);return wrap(svg(art));
 }
 if(d.kind==='scene-tiledRectangle')return wrap(svg('<rect x="70" y="38" width="310" height="135" class="scene-shape"/><rect x="70" y="38" width="48" height="48" fill="#f6d495" stroke="#967858"/>'+text(94,66,'?')+text(225,204,`长 ${d.w} 米`)+text(424,112,`宽 ${d.h} 米`),caption+'；标出未知正方形规格，示意不按比例'));
 if(d.kind==='scene-coordinates'){
  const minX=Math.min(0,...[d.a[0],d.b[0]])-1,maxX=Math.max(0,d.a[0],d.b[0])+1,minY=Math.min(0,d.a[1],d.b[1])-1,maxY=Math.max(0,d.a[1],d.b[1])+1,X=x=>65+330*(x-minX)/(maxX-minX),Y=y=>185-145*(y-minY)/(maxY-minY);let art=`<path d="M${X(minX)} ${Y(0)} H${X(maxX)} M${X(0)} ${Y(minY)} V${Y(maxY)}" class="scene-line"/>`;
  for(const [name,p]of [['A',d.a],['B',d.b]])art+=`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" class="scene-mark"/>`+text(X(p[0]),Y(p[1])-14,`${name}(${p.join(',')})`);
  art+=`<path d="M${X(d.a[0])} ${Y(d.a[1])} ${d.gridOnly?`H${X(d.b[0])} V${Y(d.b[1])}`:`L${X(d.b[0])} ${Y(d.b[1])}`}" class="scene-up"/>`;return wrap(svg(art));
 }
 if(d.kind==='scene-ladder')return wrap(svg('<path d="M125 23 V175 H392" class="scene-line"/><path d="M125 40 L295 175" stroke="#c18b46" stroke-width="8"/>'+(!d.nextBase?'':'<path d="M125 72 L353 175" stroke="#668daf" stroke-width="7"/>')+text(213,69,`梯长 ${d.length}`)+text(230,204,`底距 ${d.base}`)+text(63,111,`高度 ${d.height}`),caption+'；只按标签给定长度，位置为示意'));
 if(d.kind==='scene-cube'){
  let art='<path d="M157 75 L240 30 L323 75 L323 166 L240 210 L157 166 Z" fill="#cfe3ef" stroke="#54758b"/><path d="M157 75 L240 118 L323 75 M240 118 V210" class="scene-line"/><path d="M157 75 L240 30 L323 75 L240 118 Z" fill="#f2bfa7" stroke="#9a7567"/>';
  for(let i=1;i<d.n;i++){const q=i/d.n;art+=`<path d="M${157+83*q} ${75+43*q} L${240+83*q} ${30+45*q} M${157+83*q} ${75-45*q} L${240+83*q} ${118-43*q} M${157+83*q} ${75+43*q} V${166+44*q} M${240+83*q} ${118-43*q} V${210-44*q}" class="scene-cube-grid"/>`}
  art+=text(391,145,`每棱 ${d.n} 个`)+text(391,181,d.faces.includes('all')?'六面涂色':'只涂顶、底');return wrap(svg(art,caption+'；显示三个可见面，其余面按条件说明'));
 }
 if(d.kind==='scene-holeRectangle')return wrap(svg(`<path d="M70 40 H380 V176 H70 Z M${140} 78 V132 H${140+130*d.a/d.w} V78 Z" fill="#c6dff0" fill-rule="evenodd" stroke="#54758b"/>`+text(224,207,`外长 ${d.w}；外宽 ${d.h}`)+text(242,24,`内部洞 ${d.a} × ${d.b}`),caption+'；洞位置为示意'));
 if(d.kind==='scene-fullCircle')return wrap(svg('<circle cx="240" cy="107" r="77" class="scene-shape"/><path d="M163 107 H317" class="scene-dashed"/>'+text(240,207,`半径 ${d.radius}；π=3`),caption));
 if(d.kind==='scene-polygonAngles')return wrap(svg('<path d="M112 38 L337 29 L381 173 L77 166 Z" class="scene-shape"/>'+d.ratios.map((r,i)=>text([117,334,355,100][i],[63,57,151,145][i],r+'份')).join(''),caption+'；角度以比例标注为准'));
 if(d.kind==='scene-rays'){
  let art='';for(let i=0;i<d.marks;i++){const a=-Math.PI/2+2*Math.PI*i/d.marks;art+=`<path d="M240 109 L${240+81*Math.cos(a)} ${109+81*Math.sin(a)}" class="${i===0||i===d.steps?'scene-up':'scene-dashed'}"/>`}
  art+=text(240,216,`${d.marks} 等份；${d.other?'另一个方向':'较短方向'} ${d.other?d.marks-d.steps:d.steps} 段`);return wrap(svg(art));
 }
 if(d.kind==='scene-polygon'){
  const pts=Array.from({length:d.n},(_,i)=>[240+80*Math.sin(2*Math.PI*i/d.n),108-80*Math.cos(2*Math.PI*i/d.n)]);let art=`<path d="M${pts.map(p=>p.join(' ')).join(' L')} Z" class="scene-shape"/>`;for(let i=0;i<d.steps;i++)art+=`<circle cx="${pts[i][0]}" cy="${pts[i][1]}" r="5" class="scene-mark"/>`;art+=text(240,215,`经过 ${d.steps} 个顶点`);return wrap(svg(art));
 }
 if(d.kind==='scene-shadows')return wrap(svg(`<path d="M45 171 H439 M70 171 V116 L180 171 M250 171 V39 L420 171" class="scene-line"/>`+text(58,109,'高 '+d.smallHeight)+text(123,198,'影 '+d.smallShadow)+text(227,32,'高 '+d.bigHeight)+text(354,198,'影 '+d.bigShadow),caption+'；图为对应关系示意'));
 if(d.kind==='scene-border'){
  const side=d.n+2,cell=Math.min(9,165/side),ox=140,oy=25;let art='';
  for(let y=0;y<side;y++)for(let x=0;x<side;x++){const original=x>0&&x<side-1&&y>0&&y<side-1,added=d.partial?(x===0&&y<side-1||y===0&&x<side-1):!original;if(!original&&!added)continue;art+=`<rect x="${ox+x*cell}" y="${oy+y*cell}" width="${cell}" height="${cell}" fill="${original?'#c6ddec':'#efc675'}" stroke="white" stroke-width=".4"/>`}
  art+=text(240,212,`原来 ${d.n}×${d.n}，黄色为新增`);return wrap(svg(art));
 }
 throw Error('Unsupported mathematical scene '+d.kind);
}

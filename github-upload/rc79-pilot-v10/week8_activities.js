// Choosing packages and composing plans are primary answers; other boards expose support.
function resetWeek8(){state.week8={torches:0,boxes:[0,0],packs:[0,0,0],decoration:null,plan:[],stock:null,ledger:null};}
function week8PurchaseValue(){return 'packs:'+state.week8.packs.join(',');}
function week8PackTotals(packs=state.week8.packs,prices=state.question===3?[7,3,2]:[5,3,2]){return {cards:packs.reduce((n,k,i)=>n+k*[4,2,1][i],0),points:packs.reduce((n,k,i)=>n+k*prices[i],0)};}
function week8Activity(){
 const s=state.week8;
 if(state.day===49){const reserve=state.question===3?4:3,left=10-s.torches*2-reserve;return `<div class="activity"><h3>${rt('给手电分电池')}</h3><p>${rt('一共 10 节；每支手电用 2 节；至少留 '+reserve+' 节备用。')}</p><div class="nav">${Array.from({length:6},(_,i)=>button('w8Torch',i+' 支',`data-index="${i}" aria-pressed="${s.torches===i}"`)).join('')}</div><p data-w8-battery>${rt('手电用 '+s.torches*2+' 节，备用 '+reserve+' 节，'+(left>=0?'另外剩 '+left+' 节。':'还差 '+(-left)+' 节。'))}</p></div>`;}
 if(state.day===50){const [a,b]=s.boxes;return `<div class="activity"><h3>${rt('把包装放上运输盘')}</h3><p>${rt('甲每盒 3 张，乙每盒 2 张；最多运 2 盒。')}</p><div class="nav">${['甲','乙'].map((v,i)=>button('w8BoxLess',v+'少一盒',`data-index="${i}" ${s.boxes[i]===0?'disabled':''}`)+button('w8BoxMore',v+'多一盒',`data-index="${i}" ${s.boxes[i]>=3?'disabled':''}`)).join('')}</div><p data-w8-boxes>${rt('甲 '+a+' 盒，乙 '+b+' 盒；共 '+(a+b)+' 盒、'+(a*3+b*2)+' 张卡片。')}</p></div>`;}
 if(state.day===51){const total=week8PackTotals(),prices=state.question===3?[7,3,2]:[5,3,2];return `<div class="activity"><h3>${rt('我的兑换清单')}</h3><p>${rt('要正好 6 张，还要比较要花的积分。可以增减包装，再提交自己的方案。')}</p>${['四张包','两张包','单张'].map((v,i)=>`<div class="panel"><p>${rt(v+'：每份 '+prices[i]+' 分，已选 '+s.packs[i]+' 份。')}</p><div class="nav">${button('w8PackLess','少一份',`data-index="${i}" ${s.packs[i]===0?'disabled':''}`)}${button('w8PackMore','多一份',`data-index="${i}" ${s.packs[i]>=6?'disabled':''}`)}</div></div>`).join('')}<p data-w8-purchase>${rt('共 '+total.cards+' 张，花 '+total.points+' 分。')}</p><div class="nav">${button('w8PacksClear','清空清单')}${button('w8SpeakPrices','听价格')}</div></div>`;}
 if(state.day===52){const budget=state.question===3?16:15,cost=s.decoration===null?0:[2,3,4][s.decoration];return `<div class="activity"><h3>${rt('留好备用积分')}</h3><p>${rt('一共 '+budget+' 分；灯架 6 分，记录本 4 分；至少留 3 分。')}</p><div class="nav">${['彩带 2 分','贴纸 3 分','海报 4 分'].map((v,i)=>button('w8Decoration',v,`data-index="${i}" aria-pressed="${s.decoration===i}"`)).join('')}</div><p data-w8-budget>${rt('已用 '+(10+cost)+' 分，还剩 '+(budget-10-cost)+' 分。')}</p></div>`;}
 if(state.day===53){const labels=['蓝底板','红底板','说明标签'],prices=state.question===3?[4,5,4]:[4,4,4],cost=s.plan.reduce((n,i)=>n+prices[i],0);return `<div class="activity"><h3>${rt('拼出自己的布展方案')}</h3><p>${rt('一张底板加一张标签，最多 8 分；每件最多一份。点已选物品可以撤回。')}</p><div class="nav">${labels.map((v,i)=>button('w8Plan',v+' '+prices[i]+' 分',`data-index="${i}" aria-pressed="${s.plan.includes(i)}"`)).join('')}</div><p data-w8-plan>${rt('已选：'+(s.plan.length?s.plan.map(i=>labels[i]).join('、'):'还没有')+'；共 '+cost+' 分。')}</p>${button('w8SpeakPlan','听要求')}</div>`;}
 if(state.day===54){const rows=['昨天：三种都有货，各 4 分。','今天已确认：蓝底板和标签有货；红底板缺货。','下午补货：也许会到，数量未确认。'];return `<div class="activity"><h3>${rt('查看库存便条')}</h3><p>${rt('中午之前要布置完。')}</p><div class="nav">${['昨天清单','今天确认','可能的补货'].map((v,i)=>button('w8Stock',v,`data-index="${i}" aria-pressed="${s.stock===i}"`)).join('')}</div><p data-w8-stock>${rt(s.stock===null?'选一张便条查看。':rows[s.stock])}</p></div>`;}
 if(state.day===55){const rows=['第一笔 15 分：灯架 6、记录本 4、彩带 2；剩 3 分备用。',state.question===3?'第二笔 8 分：蓝底板已领，花 4 分；还剩 4 分，标签待领。':'第二笔 8 分：计划领蓝底板和标签；领取结果待确认。'];return `<div class="activity"><h3>${rt('分开核对两本账')}</h3><div class="nav">${['第一笔预算','第二笔预算'].map((v,i)=>button('w8Ledger',v,`data-index="${i}" aria-pressed="${s.ledger===i}"`)).join('')}</div><p data-w8-ledger>${rt(s.ledger===null?'两笔预算分别记账，不能混算。':rows[s.ledger])}</p></div>`;}
 return '';
}
function week8Handle(a,b,i){
 if(!a.startsWith('w8'))return false;
 if(a==='w8SpeakPrices'){say(state.question===3?'四张包每包 7 分，两张包每包 3 分，单张每张 2 分。':'四张包每包 5 分，两张包每包 3 分，单张每张 2 分。','support');return true;}
 if(a==='w8SpeakPlan'){say('一张底板加一张标签，总花费不超过 8 分。','support');return true;}
 const s=state.week8,primary=state.question===0&&((state.day===51&&['w8PackMore','w8PackLess','w8PacksClear'].includes(a))||(state.day===53&&a==='w8Plan'));
 if(!primary){state.explorationEver=true;currentRecord().help.push({type:'explore',activity:a});}
 if(a==='w8Torch'&&i>=0&&i<=5)s.torches=i;
 else if(a==='w8BoxMore'&&i>=0&&i<2)s.boxes[i]=Math.min(3,s.boxes[i]+1);
 else if(a==='w8BoxLess'&&i>=0&&i<2)s.boxes[i]=Math.max(0,s.boxes[i]-1);
 else if(a==='w8PackMore'&&i>=0&&i<3)s.packs[i]=Math.min(6,s.packs[i]+1);
 else if(a==='w8PackLess'&&i>=0&&i<3)s.packs[i]=Math.max(0,s.packs[i]-1);
 else if(a==='w8PacksClear')s.packs=[0,0,0];
 else if(a==='w8Decoration'&&i>=0&&i<3)s.decoration=s.decoration===i?null:i;
 else if(a==='w8Plan'&&i>=0&&i<3)s.plan=s.plan.includes(i)?s.plan.filter(x=>x!==i):[...s.plan,i].slice(-2);
 else if(a==='w8Stock'&&i>=0&&i<3)s.stock=i;
 else if(a==='w8Ledger'&&i>=0&&i<2)s.ledger=i;
 return true;
}


const assert=require('node:assert/strict'),{futureComplete:complete,futureCorrect:correct}=require('./future_tasks'),story=require('./story.json');
const qs=Object.fromEntries(story.days.flatMap(d=>[...d.questions,d.extra]).map(q=>[q.id,q]));let tested=0;
for(const [id,expected] of [['S66-1',7],['S70-1',5],['S68-1',1]]){const q=qs[id];let pass=0;const cells=q.type==='mirror'?q.grid.editable:Array.from({length:12},(_,i)=>i);for(let mask=0;mask<2**cells.length;mask++){const value=cells.filter((_,i)=>mask&(1<<i));pass+=correct(q,value);tested++;}assert.equal(pass,expected,id);assert(!correct(q,[0,0,1,4,5,8]));}
for(const [id,count] of [['S74-1',10],['S77-1',3]]){const q=qs[id];let pass=0;for(let a=0;a<=q.allocation.total;a++)for(let b=0;b<=q.allocation.total;b++)for(let c=0;c<=q.allocation.total;c++){pass+=correct(q,[a,b,c]);tested++;}assert.equal(pass,count,id);}
for(const id of ['S82-1','S83-1']){let pass=0;for(let m=0;m<8;m++){pass+=correct(qs[id],[0,1,2].map(i=>1+((m>>i)&1)));tested++;}assert.equal(pass,2,id);assert(!complete(qs[id],[1,null,1]));}
for(const id of ['S57-1','S79-1']){let pass=0;for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){pass+=correct(qs[id],[a,b,c]);tested++;}assert.equal(pass,1);assert(!complete(qs[id],[0,1,null]));}
assert(correct(qs['S64-1'],1));assert(!correct(qs['S64-1'],0));assert(!correct(qs['S64-1'],2));
console.log(JSON.stringify({result:'PASS',enumerated:tested,scope:'independent solution counts for grid, allocation, manifest and classification; not teaching acceptance'}));

'use strict';
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const playwright=require('playwright');

async function main(){
  const html=await readFile(path.join(process.argv[2],'index.html'));
  const w1=await readFile(path.join(process.argv[2],'w1-baseline.html'));
  const server=http.createServer((req,res)=>{
    const entry=req.url==='/'?html:req.url==='/w1'?w1:null;
    if(!entry){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(entry);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    for(const name of (process.env.BROWSER||'chromium,webkit').split(',')){
      const options=process.env.CHROMIUM_BIN&&name==='chromium'?{executablePath:process.env.CHROMIUM_BIN,args:['--no-sandbox']}:{};
      const browser=await playwright[name].launch(options);
      try{
        const page=await browser.newPage();
        const failures=[];
        page.on('pageerror',e=>failures.push(e.message));
        await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded',timeout:60000});
        await page.evaluate(()=>open('demo','A01.01'));
        const previous=page.getByRole('button',{name:'← 上一步',exact:true});
        const next=page.getByRole('button',{name:'下一步 →',exact:true});
        assert.equal(await previous.isDisabled(),true);
        const store=()=>page.evaluate(()=>localStorage.getItem('tianle_amc8_question_design_v1'));
        // Opening a demo records exposure asynchronously; compare after that
        // permitted write is durable, so playback itself must leave it intact.
        await page.waitForFunction(()=>{
          const saved=JSON.parse(localStorage.getItem('tianle_amc8_question_design_v1')||'null');
          return Object.entries(saved?.taskHistory||{}).some(([id,row])=>id.endsWith(':D-A01-01-1')&&row.viewedAt);
        },null,{timeout:20000});
        const before=await store();
        await next.click();
        assert.match(await page.locator('.demo-controls').innerText(),/第1\/\d+步/);
        await previous.focus();
        await page.keyboard.press('Enter');
        assert.equal(await next.evaluate(el=>el===document.activeElement),true);
        assert.match(await page.locator('.demo-controls').innerText(),/第0\/\d+步/);
        assert.equal(await previous.isDisabled(),true);
        await next.click();
        assert.equal(await store(),before);
        await page.getByRole('button',{name:'← 返回',exact:true}).click();
        assert.equal(await previous.count(),0,'a demonstration may be left without a draft warning');
        await page.evaluate(()=>open('demo','A01.02'));
        await next.click();
        await next.click();
        assert.match(await page.locator('.hint').innerText(),/框里正好10个一，盘里还有2个一/);
        await next.click();
        assert.match(await page.locator('.hint').innerText(),/捆后：1个十和2个一。总数两次都是12/);
        await previous.click();
        assert.match(await page.locator('.hint').innerText(),/框里正好10个一，盘里还有2个一/);
        await page.evaluate(()=>open('joint','J-A03-03-G'));
        const compareFractions=async (quantity,cost)=>{
          for(const [side,count] of [['left',2],['right',3]]){
            for(let index=0;index<count;index++){
              await page.locator(`[data-action="fractionCell"][data-side="${side}"][data-index="${index}"]`).click();
            }
          }
          await page.locator('[data-action="fractionChoice"][data-value="left"]').click();
          await page.locator('[data-joint-field="quantity"]').fill(String(quantity));
          await page.locator('[data-joint-field="cost"]').fill(String(cost));
        };
        const submitJoint=page.locator('[data-action="check"]').first();
        await compareFractions(20,43);
        await submitJoint.click();
        await page.waitForFunction(()=>jointEvidence('J-A03-03').guided===true);
        await page.evaluate(()=>open('joint','J-A03-03-I1'));
        assert.match(await page.locator('.joint-material').innerText(),
          /左边整条纸带对应8克原料，右边整条纸带对应16克原料/);
        await page.evaluate(()=>open('joint','J-A03-03-C'));
        await compareFractions(28,62);
        const incorrectReason=page.getByRole('button',{
          name:'右边涂3份，左边涂2份，所以右边更重。',exact:true,
        });
        await incorrectReason.click();
        await submitJoint.click();
        await page.getByText('再看题目给的量和单位，选一项能用这个例子纠正原说法的解释。',
          {exact:true}).waitFor();
        const correctReason=page.getByRole('button',{
          name:'先算出涂色部分各占整体的几分之几，再用各自整体对应的原料质量换算。',exact:true,
        });
        await correctReason.click();
        await submitJoint.click();
        await page.waitForFunction(()=>saved.attempts.some(x=>x.taskInstanceId==='J-A03-03-C'&&
          x.gradingResult==='correct'&&x.formalEligible===false&&x.independent===false));
        await page.evaluate(()=>{
          saved.skillStage['G01.01']={transferPassed:true};
          open('stage','G01.01|independent');
        });
        assert.equal(await page.evaluate(()=>taskNow().id),'T-G01-01-2');
        await page.evaluate(()=>open('joint','J-G02-01-G'));
        assert.equal(await page.evaluate(()=>taskHistory(STAGED_TASKS['G01.01'].independent).modelViewed),false);
        await page.evaluate(()=>open('joint','J-G01-02-G'));
        assert.equal(await page.evaluate(()=>taskHistory(STAGED_TASKS['G01.01'].independent).modelViewed),true);
        await page.evaluate(()=>open('joint','J-D01-03-G'));
        const scaleOrder=page.locator('.joint-material');
        await scaleOrder.getByText(/甲在第0格，乙在第2格，丙在第4格/).waitFor();
        assert.equal(await scaleOrder.locator('[data-joint-field="quantity"]').count(),1);
        await page.evaluate(()=>open('joint','J-G04-03-G'));
        const arcOrder=page.locator('.joint-material');
        await arcOrder.getByText(/例如3π厘米填写3/).waitFor();
        assert.equal(await arcOrder.locator('[data-joint-field="quantity"]').count(),1);
        const openFixture=(family,seed)=>page.evaluate(({family,seed})=>{
          const task=competitionCreate(competitionReviewedRecipe(family,seed));
          const topicIds=SKILL_DATA.units.map(u=>u.id);
          const item={view:'competition',code:task.id,taskId:task.id,
            contentVersion:task.contentVersion,recipe:task.competition.recipe,openedAt:Date.now(),
            passed:false,draft:null,feedback:null};
          saved.topicPractice.selectedTopicIds=topicIds;
          saved.topicPractice.sourceIds=['original'];
          saved.topicPractice.session={mode:'competition-v2',id:'m1-browser-'+family,
            topicIds,sourceIds:['original'],planSeed:1,total:10,cursor:0,items:[item],exhausted:false};
          topicOpenCurrent();
        },{family,seed});
        await openFixture('twoCoins',19);
        await page.locator('[data-action="competitionHint"]').first().click();
        await page.locator('[data-action="competitionIndependentVariation"]').click();
        assert.equal(await page.getByText(/只有面值1元和3元两种/).count(),1);
        const coinInput=page.locator('[data-competition-input="extension"]');
        const coinSubmit=page.locator('[data-action="competitionExtensionCheck"]');
        await coinInput.fill('7');
        await coinSubmit.click();
        assert.equal(await page.evaluate(()=>draft.work.extensionResult.ok),false);
        await coinInput.fill('2');
        await coinSubmit.click();
        await page.waitForFunction(()=>{
          const record=JSON.parse(localStorage.getItem('tianle_amc8_question_design_v1')||'null');
          return record?.competition?.extensions?.some(x=>x.input==='2'&&x.correct&&
            x.independent===false&&x.relatedMethodExposure?.recent&&x.recipe.generatorRevision===7);
        },null,{timeout:20000});
        await openFixture('chartScale',246);
        await page.locator('[data-action="competitionIndependentVariation"]').click();
        assert.equal(await page.getByText(/原来甲柱高 5 格，表示 15 人/).count(),1);
        await coinInput.fill('9');
        await coinSubmit.click();
        assert.equal(await page.evaluate(()=>draft.work.extensionResult.ok),true);
        await page.waitForFunction(()=>{
          const record=JSON.parse(localStorage.getItem('tianle_amc8_question_design_v1')||'null');
          return record?.contentRevision===154&&record.competition.extensions.some(x=>
            x.recipe.familyId==='chartScale'&&x.correct);
        },null,{timeout:20000});
        const currentRecord=await store();
        await page.goto('http://127.0.0.1:'+server.address().port+'/w1',
          {waitUntil:'domcontentloaded',timeout:60000});
        // W1 status copy can change while Web Locks settle. Require the
        // version and actual persistence disposition, plus exact disk bytes.
        const fallback=await page.evaluate(()=>({
          revision:CONTENT_REVISION,canPersist,outcome:persist(),
        }));
        assert.deepEqual(fallback,{revision:153,canPersist:false,
          outcome:{ok:false,reason:'READ_ONLY'}});
        assert.equal(await store(),currentRecord);
        await page.goto('http://127.0.0.1:'+server.address().port+'/',
          {waitUntil:'domcontentloaded',timeout:60000});
        assert.equal(await page.evaluate(()=>canPersist),true);
        assert.equal(await page.evaluate(()=>saved.competition.extensions.some(x=>
          x.recipe.generatorRevision===7&&x.correct&&x.independent===false)),true);
        assert.deepEqual(failures,[]);
        console.log(name+': demo replay, record isolation, coin variation, chart givens, fraction counterexample controls, and W1 fallback safety PASS');
      }finally{await browser.close();}
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

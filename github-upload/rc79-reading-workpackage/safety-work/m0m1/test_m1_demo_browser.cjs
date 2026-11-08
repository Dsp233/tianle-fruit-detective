'use strict';
const assert=require('node:assert/strict');
const {readFile}=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const playwright=require('playwright');

async function main(){
  const html=await readFile(path.join(process.argv[2],'index.html'));
  const server=http.createServer((req,res)=>{
    if(req.url!=='/'){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html);
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
        assert.deepEqual(failures,[]);
        console.log(name+': previous, replay, and record isolation PASS');
      }finally{await browser.close();}
    }
  }finally{await new Promise(resolve=>server.close(resolve));}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

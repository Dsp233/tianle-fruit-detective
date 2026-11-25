"""Continue prior diagnostic profiles: only remaining parallel forms, no repeated content review."""
import concurrent.futures,functools,hashlib,json,os,re,subprocess,threading
from pathlib import Path
from urllib.parse import urlparse
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
import sys
ROOT=Path(os.environ['D_PRODUCT']); PRIOR=Path(os.environ['D_PREVIOUS']); OUT=Path('r11-probe-output')
OUT.mkdir(exist_ok=True)
BASE='d0c9c3e265a7a76052487d374255fcda35f21117'
OLD='f306ceafc90b16e5794e3e4a1df95101a73e2778'
assert subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip()==BASE
sys.path.insert(0,str(ROOT/'tools'))
from g1_reading_packets import config
old_html=subprocess.check_output(['git','-C',str(ROOT),'show',OLD+':index.html'],text=True)
assert config(old_html)['reading']==config((ROOT/'index.html').read_text())['reading'], 'Reading runtime/data identity changed'
freeze=json.loads(Path('tools/r11-product/d-reading-diagnostic-208-independent-freeze.json').read_text())
expected={q['id']:q['optionOrdinal'] for row in freeze['rows'] for q in row['answers']}
assert len(expected)==208
weeks=['BASELINE']+[f'W{i:02}' for i in range(1,13)]
files={w:next(PRIOR.rglob('chromium-'+w+'-storage.json')) for w in weeks}
origins=set()
for f in files.values():
    data=json.loads(f.read_text())
    origins.update(o['origin'] for o in data['origins'] if urlparse(o['origin']).hostname=='127.0.0.1')
assert len(origins)==1,origins
ORIGIN=origins.pop();port=urlparse(ORIGIN).port
class H(SimpleHTTPRequestHandler):
    def log_message(self,*a):pass
srv=ThreadingHTTPServer(('127.0.0.1',port),functools.partial(H,directory=str(ROOT)))
threading.Thread(target=srv.serve_forever,daemon=True).start()
def ready(p):
    p.wait_for_function("window.__AMC8_ReadingRuntime&&window.__AMC8_ReadingRuntime.engine().status().status==='ready'",timeout=45000)
def loc(p,a): return p.locator(f'#app [data-action={a}]:visible')
def state(p):return p.evaluate("()=>{let r=window.__AMC8_ReadingRuntime;return {snapshot:r.snapshot(),report:r.report()}}")
def qcur(p):return p.evaluate("()=>{let c=window.__AMC8_ReadingRuntime.engine().current();return c?.question?{id:c.question.id,options:c.question.options,diagnostic:c.session.diagnostic}:null}")
def clean(x):return x.evaluate("e=>{let c=e.cloneNode(true);c.querySelectorAll('.rd-pinyin,[hidden]').forEach(x=>x.remove());return c.textContent.trim()}")
def shot(p,name):
    f=OUT/(name+'.png');p.screenshot(path=str(f),full_page=True);return {'file':f.name,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
def plans(s,w):return [e for e in s['snapshot']['events'] if e.get('type')=='diagnostic_plan' and e.get('setId')=='R2-DRAFT-'+w]
def attempts(s):return [e for e in s['snapshot']['events'] if e.get('type')=='attempt']
def parent(p):
    if not p.locator('.rd-parent:visible').count():
        loc(p,'rdParent').last.click()
    p.locator('.rd-parent:visible').wait_for()
def start(p,w):
    parent(p)
    p.locator(f'[data-action=rdDxSet][data-set="R2-DRAFT-{w}"]:visible').click()
    gate=loc(p,'rdDiagnostic').first.is_disabled()
    loc(p,'rdKnowledgeConfirm').first.click()
    enabled=loc(p,'rdDiagnostic').first.is_enabled()
    assert gate and enabled,(w,gate,enabled)
    loc(p,'rdDiagnostic').first.click();ready(p)
    p.wait_for_function("Boolean(window.__AMC8_ReadingRuntime.engine().current()?.question?.id)",timeout=12000)
    return {'gate':gate,'enabled':enabled}
def choose(p,text):
    hits=[x for x in loc(p,'rdPick').all() if clean(x)==text]
    assert len(hits)==1,('OPTION_MISMATCH',text,[clean(v) for v in loc(p,'rdPick').all()])
    hits[0].click();loc(p,'rdSubmit').first.click();ready(p)
def advance(p,qid):
    nxt=loc(p,'rdNext')
    if nxt.count()==1 and nxt.first.is_enabled():nxt.first.click()
    else:
        nxts=[x for x in p.locator('#app button:visible').all() if clean(x)=='下一步']
        assert len(nxts)==1,('NEXT_NOT_FOUND',qid)
        nxts[0].click()
    ready(p)
    p.wait_for_function("qid=>window.__AMC8_ReadingRuntime.engine().current()?.question?.id!==qid",arg=qid,timeout=12000)
def support(p,condition):
    result={'condition':condition}
    if condition=='C':
        v=loc(p,'rdSpeakAll')
        if v.count():
            v.first.click()
            p.wait_for_timeout(850)
            stat=p.locator('#rd-voice-state')
            result['visibleVoiceState']=stat.inner_text() if stat.count() else ''
            stop=loc(p,'rdVoiceStop')
            if stop.count():stop.first.click()
            result['requestedOriginal']=True
    elif condition=='D':
        v=p.locator('#app [data-action=rdParentRead]')
        if v.count() and not v.first.is_visible():
            detail=p.locator('#app details').filter(has=v)
            if detail.count()==1:detail.locator('summary').click()
        if v.count() and v.first.is_visible():
            v.first.click();ready(p);result['syntheticParentAttestation']=True
    return result
def run(w):
    x={'set':w,'priorStorageSha256':hashlib.sha256(files[w].read_bytes()).hexdigest(),'rows':[],'errors':[],'forms':[]}
    with sync_playwright() as pw:
        b=pw.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
        ctx=b.new_context(viewport={'width':1024,'height':768},storage_state=str(files[w]),accept_downloads=True)
        p=ctx.new_page();p.set_default_timeout(10000);p.on('pageerror',lambda e:x['errors'].append(str(e)))
        try:
            p.goto(ORIGIN+'/',wait_until='domcontentloaded')
            p.locator('[data-home-hub] [data-action=reading]').click();ready(p)
            original=state(p);prev=plans(original,w)
            assert len(prev)==1 and prev[0]['formId']=='R2-F1',(w,prev)
            prior_attempts=attempts(original);prior_ids={e['questionId'] for e in prior_attempts}
            assert len(prior_ids)==4 and all('-R2-F1-' in i for i in prior_ids)
            for form in (2,3,4):
                f=start(p,w);f['form']=form;f['startShot']=shot(p,w+f'-F{form}-start')
                material=None;seen=[]
                for k in range(4):
                    q=qcur(p);qid=q['id'];dx=q['diagnostic'];assert dx['formId']==f'R2-F{form}' and qid in expected and qid not in prior_ids and qid not in seen,(w,form,qid,dx)
                    seen.append(qid)
                    mat=qid.rsplit('-Q',1)[0]
                    if mat!=material:
                        aux=support(p,dx['condition']);material=mat
                    else:aux={'condition':dx['condition'],'sameMaterial':True}
                    row={'id':qid,'form':dx['formId'],'condition':dx['condition'],'support':aux,'ordinal':expected[qid]}
                    options=q['options'];want=options[expected[qid]-1]
                    row['expectedText']=want;row['visibleChoices']=[clean(v) for v in loc(p,'rdPick').all()]
                    if w=='W01' and k==0:
                        wrong=next(v for v in row['visibleChoices'] if v!=want)
                        choose(p,wrong);row['wrong']=attempts(state(p))[-1];row['wrongShot']=shot(p,w+f'-F{form}-wrong')
                        assert not row['wrong']['correct'] and row['wrong']['questionId']==qid
                    choose(p,want)
                    a=[v for v in attempts(state(p)) if v['questionId']==qid]
                    row['attempts']=a
                    row['correct']=bool(a and a[-1]['correct'])
                    x['rows'].append(row)
                    assert row['correct'],qid
                    if k==0 or k==3:row['afterShot']=shot(p,w+f'-F{form}-q{k+1}')
                    advance(p,qid)
                f['questions']=seen;x['forms'].append(f)
                assert len(plans(state(p),w))==form
            x['beforeReload']=state(p);p.reload(wait_until='domcontentloaded');ready(p);after=state(p)
            x['priorAttemptsPreserved']=all(e in attempts(after) for e in prior_attempts)
            x['allAttemptsRetained']=attempts(x['beforeReload'])==attempts(after)
            parent(p)
            p.locator(f'[data-action=rdDxSet][data-set="R2-DRAFT-{w}"]:visible').click()
            loc(p,'rdKnowledgeConfirm').first.click()
            button=loc(p,'rdDiagnostic').first
            if button.is_enabled():button.click();ready(p)
            exhausted=state(p)
            x['fifthPlanNotCreated']=len(plans(exhausted,w))==4
            x['fifthDidNotAddAttempts']=attempts(after)==attempts(exhausted)
            x['parentText']=p.locator('#app').inner_text()[:12000]
            x['exhaustedShot']=shot(p,w+'-exhausted')
            ctx.storage_state(path=str(OUT/(w+'-storage.json')))
        except Exception as e:
            x['errors'].append(repr(e))
            try:x['errorShot']=shot(p,w+'-error')
            except Exception:pass
        finally:ctx.close();b.close()
    print('D_DX_REMAIN '+json.dumps({'set':w,'forms':len(x['forms']),'rows':len(x['rows']),'correct':sum(bool(a.get('correct')) for a in x['rows']),'ids':[a['id'] for a in x['rows']],'conditions':[{ 'id':a['id'],'condition':a['condition'],'attempts':[{'correct':e.get('correct'),'first':e.get('first'),'aidLevel':e.get('aidLevel'),'independent':e.get('independent'),'diagnosticValidity':e.get('diagnosticValidity')} for e in a['attempts']]} for a in x['rows']],'priorPreserved':x.get('priorAttemptsPreserved'),'retained':x.get('allAttemptsRetained'),'fifthBlocked':x.get('fifthPlanNotCreated'),'fifthNoAttempts':x.get('fifthDidNotAddAttempts'),'errors':x['errors']},ensure_ascii=False),flush=True)
    return x
try:
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        rows=list(pool.map(run,weeks))
    ids=[q['id'] for r in rows for q in r['rows'] if q.get('correct')]
    receipt={'base':BASE,'priorBase':OLD,'priorRun':45522258187,'priorArtifact':14980631464,'readingPacketIdentity':True,'uniqueCorrect':len(set(ids)),'observedCorrect':len(ids),'rows':rows,'limits':['No first-form repeats; prior exact synthetic storage origin restored without modifying state.','C/D control evidence does not establish human listening or genuine parent reading; diagnostic validity as recorded, not empirical effect.']}
    (OUT/'d-diagnostic-remaining-receipt.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2))
    print('D_DX_REMAIN_SUMMARY '+json.dumps({k:v for k,v in receipt.items() if k!='rows'},ensure_ascii=False),flush=True)
finally:srv.shutdown()

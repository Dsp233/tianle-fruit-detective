import json,os
from pathlib import Path
out=Path.cwd()/'muse/rc79/fix14';e=Path('/tmp/fix14-evidence')
names=['storage-browser.json','diagnostic-c-browser.json','diagnostic-d-browser.json','reading-order-browser.json','reading-routes-browser.json','reading-drag-browser.json','percent-browser.json','smoke-result.json','reading-feedback-browser.json','engine-test-results.json','full-reading-integration.json','math-runtime.json','family-browser.json','selection-browser.json','fix14-storage-browser.json','store-unit.json']
reports={name:json.loads((e/name).read_text()) for name in names}
assert reports['storage-browser.json']['result']=='PASS_WITH_REMAINING_WORK'
for name in names[1:9]:assert reports[name]['result']=='PASS',name
assert reports['family-browser.json']['result']=='PASS' and reports['selection-browser.json']['result']=='PASS'
full=reports['full-reading-integration.json'];assert full['result']=='PASS' and full['completeSuite'] and full['populations']['courseQuestions']==840 and full['populations']['diagnosticQuestions']==208 and full['populations']['dailyRoutes']==84
assert reports['engine-test-results.json']['passed']==45 and reports['engine-test-results.json']['total']==45
assert reports['math-runtime.json']['result']=='PASS' and reports['math-runtime.json']['cases']>=38
for name in ['diagnostic-c-browser.json','diagnostic-d-browser.json','reading-order-browser.json','reading-routes-browser.json','reading-drag-browser.json','percent-browser.json','family-browser.json','selection-browser.json']:assert {x['engine'] for x in reports[name]['checks']}=={'chromium','webkit'},name
extra=reports['fix14-storage-browser.json'];assert extra['result']=='PASS_WITH_REMAINING_WORK'
assert {x['engine'] for x in extra['checks']}=={'chromium','webkit'}
for engine in ['chromium','webkit']:
 ids={x['id'] for x in extra['checks'] if x['engine']==engine and x['result']=='PASS'}
 assert ids=={'simultaneous_reading_transactions','new_reading_transaction_page_disappears','legacy_claim_requires_release','reading_transaction_quota_retry','late_indexeddb_completion','actual_math_fallback_remains_synchronous','actual_reading_simultaneous_pages'},engine
assert reports['store-unit.json']['result']=='PASS'
receipt={'revision':'RC79-FIX14','phase':'CANDIDATE','result':'PASS_WITH_REMAINING_WORK','sourceCommit':os.environ['GITHUB_SHA'],'runId':os.environ['GITHUB_RUN_ID'],'scope':'serialized formal reading writes and conflict export; unchanged math save contract and inherited regression','gradingChangedSincePreviousDelivery':False,'previousAnswersRewritten':False,'physicalIPad':'NOT_TESTED','realChild':'NOT_RUN','independentTeachingReview':'NOT_RUN','formalLearningAcceptance':'NOT_RUN','remaining':['mathematics fallback locks after abnormal exit require safe recovery','unsaved asynchronous drafts remain vulnerable to abrupt closure','old cached reading pages do not use the new transaction protocol','formal integration, content and diagnostic review','complete math coverage','physical devices, child and independent educational acceptance']}
out.mkdir(parents=True,exist_ok=True)
for name,report in {**reports,'candidate-receipt.json':receipt}.items():(out/name).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(out/'public-receipt.json').write_text(json.dumps({'revision':'RC79-FIX14','phase':'PUBLIC','result':'PENDING'},indent=2)+'\n');print(json.dumps(receipt))

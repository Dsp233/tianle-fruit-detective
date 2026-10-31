#!/usr/bin/env python3
"""Replace inherited FIX15 report claims with accurate candidate metadata."""
import json,sys
from pathlib import Path
root=Path(sys.argv[1]).resolve();path=root/'muse/rc79/loading-r2/package-report.json'
report=json.loads(path.read_text(encoding='utf-8'))
if report.get('revision')!='RC79-FIX15' or report.get('pinyinProjection',[{}])[0].get('pinyinExact') is not True:
 raise RuntimeError('Unexpected packaging basis or missing pinyin proof')
report.update({
 'revision':'RC79-READING-84D-CANDIDATE',
 'changeScope':'Unreleased 84-day reading course candidate, new reading interactions, course isolation and retained historical data; mathematics grading is unchanged.',
 'readingContentChangedSincePreviousDelivery':True,
 'gradingChangedSincePreviousDelivery':True,
 'readingFeedbackChangedSincePreviousDelivery':True,
 'readingFeedbackChangeScope':'New interaction types and explicit exploration-aid tracking; requires candidate acceptance.',
 'completeVersionVerification':'NOT_COMPLETED',
 'independentTeachingAndDeviceReview':'NOT_RUN',
 'releaseStatus':'CANDIDATE_NOT_RELEASED',
})
path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'result':'CANDIDATE_MARKED','releaseStatus':report['releaseStatus']},ensure_ascii=False))

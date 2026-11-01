#!/usr/bin/env python3
"""Check fallback character coverage, not linguistic correctness."""
import json
from pathlib import Path
here=Path(__file__).resolve().parent
data=json.loads((here.parent/'wp-course-data/candidate_reading_data.json').read_text(encoding='utf-8'))
text=(here/'reading_ui.js').read_text(encoding='utf-8')
han={c for c in text if '\u3400'<=c<='\u9fff'}
missing=sorted(c for c in han if not data['pinyinMap'].get(c))
if missing:raise RuntimeError('Missing fallback pinyin: '+''.join(missing))
assert data['pinyinMap']['审']=='shěn' and data['pinyinMap']['稍']=='shāo'
assert data['phrases']['审校']=='shěn jiào'
print(json.dumps({'result':'PASS_CHARACTER_COVERAGE_ONLY','readerSourceCharacters':len(han),'linguisticReview':'NOT_RUN'},ensure_ascii=False))

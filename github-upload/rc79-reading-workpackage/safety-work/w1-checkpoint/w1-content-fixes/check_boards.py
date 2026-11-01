from pathlib import Path
import tempfile,shutil,subprocess,json
workspace=Path('/workspace/scratch/9f55626d44b5');base=workspace/'restored-workpackage/safety-work';edits=workspace/'w1-content-fixes'
def run(*cmd):
 p=subprocess.run(cmd, text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
 if p.returncode: raise RuntimeError(' '.join(map(str,cmd))+'\n'+p.stdout[-4000:])
 return p.stdout
with tempfile.TemporaryDirectory(prefix='w1-board-check-') as td:
 root=Path(td)/'safety-work';root.mkdir(); (root/'wp-ui').mkdir();(root/'wp-course-data').mkdir();
 for name in ['formal-integration-audit','wp-integration','wp-engine','baseline']:(root/name).symlink_to(base/name,target_is_directory=True)
 for name in ['prepare_ui.py','test_ui_workpackage.js']:shutil.copyfile(edits/name,root/'wp-ui'/name)
 shutil.copyfile(base/'wp-ui/interactions.fragment.js',root/'wp-ui/interactions.fragment.js')
 shutil.copyfile(edits/'build_course.py',root/'wp-course-data/build_course.py')
 run('python3',str(root/'wp-course-data/build_course.py'),'--story',str(base/'wp-integration/v11-source/story.json'),'--baseline',str(base/'baseline/source/reading_data.js'),'--pinyin',str(base/'wp-course-data/fixtures/pilot-v11-release-pinyin.json'),'--out-dir',str(root/'wp-course-data'))
 run('python3',str(root/'wp-ui/prepare_ui.py'))
 run('node','--check',str(root/'wp-ui/reading_ui.js'))
 source=(root/'wp-ui/test_ui_workpackage.js').read_text();prefix=source[:source.index('for(const spec of cases){')]
 targeted='''\nconst bank=JSON.parse(fs.readFileSync(path.join(root,'wp-course-data/candidate_reading_data.json'),'utf8'));
const material=day=>bank.materials.find(m=>m.courseId===bank.courseScope.activeCourseId&&m.day===day&&m.kind==='story');
function check(day,idx,mutate=()=>{}){const m=material(day),q=JSON.parse(JSON.stringify(m.questions[idx])),b=JSON.parse(JSON.stringify(m));mutate(q,b);const a=boot(data(q,b.text,day),storage());a.ctx.ReadingUI.openMaterials(['R2-M'],{purpose:'synthetic-ui'});a.act('rdReadDone');return a;}
for(const i of [0,1])assert(check(14,i).html.includes('data-action="rdExplore"'),'D14 relevant board missing');
assert(!check(14,2).html.includes('data-action="rdExplore"'),'D14-3 non-matching board must remain disabled');
for(const i of [0,1,2]){const a=check(20,i);assert(a.html.includes('data-action="rdExplore"'),'D20 board missing '+i);a.act('rdExplore');assert(a.html.includes('data-exploration-board'));assert(a.snapshot().events.some(e=>e.type==='aid_requested'&&e.kind==='explore'));}
assert(!check(20,0,(q,m)=>m.text=pilot.days[19].story.join('')).html.includes('data-action="rdExplore"'));
assert(!check(20,0,q=>q.answer=(q.answer+1)%q.options.length).html.includes('data-action="rdExplore"'));
assert(!check(20,0,q=>q.options.reverse()).html.includes('data-action="rdExplore"'));
console.log('PASS: D14 relevant boards; D14-3 unrelated board closed; D20 reviewed wording and strict prompt/option/answer gates; aid recorded');
'''
 (root/'wp-ui/targeted_test.js').write_text(prefix+targeted)
 print(run('node',str(root/'wp-ui/targeted_test.js')).strip())

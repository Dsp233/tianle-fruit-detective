#!/usr/bin/env python3
"""Add the isolated recovery prototype to an extracted, pinned FIX15 tree."""
import hashlib,json,pathlib,shutil,sys
root,data,engine=map(lambda x:pathlib.Path(x).resolve(),sys.argv[1:4])
here=pathlib.Path(__file__).resolve().parent
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if digest(data)!='0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358':raise SystemExit('FIX15 reading data does not match')
if digest(engine)!='83d3f32c811337752c08496a1bcebae0001c13f346eddf88896701c5e95d5781':raise SystemExit('FIX15 reading engine does not match')
if digest(root/'index.html')!='390565dce223e59368cbb2ad7283a663f5a882ab25eb6fb5886c0eb4993f39b1':raise SystemExit('FIX15 production entry does not match')
target=root/'recovery'
if target.exists():raise SystemExit('Recovery directory already exists')
target.mkdir()
for name in ('restore.html','restore_ui.js','fix15_fresh_restore.js'):shutil.copyfile(here/name,target/name)
shutil.copyfile(data,target/'fix15-reading-data.js');shutil.copyfile(engine,target/'fix15-reading-engine.js')
files={p.name:digest(p) for p in target.iterdir() if p.is_file()}
print(json.dumps({'status':'ISOLATED_PROTOTYPE_NOT_RELEASED','files':files},sort_keys=True))

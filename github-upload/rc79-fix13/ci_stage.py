"""Copy six verified candidate entries and their assets onto the live baseline."""
import json
import shutil
import sys
from pathlib import Path

repo=Path.cwd()
candidate=Path(sys.argv[1]).resolve()
entries=["index.html","source/index.html","amc8/index.html","qa/index.html",
         "qa/normal/index.html","qa/history/index.html"]
for name in entries:
    dest=repo/name
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(candidate/name,dest)
for name in ["assets/loading-r1","assets/loading-r2"]:
    shutil.copytree(candidate/name,repo/name,dirs_exist_ok=True)
out=repo/"muse/rc79/fix13"
out.mkdir(parents=True,exist_ok=True)
shutil.copyfile(candidate/"muse/rc79/loading-r2/package-report.json",out/"package-report.json")
print(json.dumps({"stagedEntries":entries}))


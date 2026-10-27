"""Create a discoverable, honest identity record for a FIX6 candidate."""
import hashlib
import json
import os
import sys
from pathlib import Path

root=Path(sys.argv[1]).resolve()
source_commit=sys.argv[2]
raw_build_sha=sys.argv[3]
entries=["index.html","source/index.html","amc8/index.html","qa/index.html",
         "qa/normal/index.html","qa/history/index.html","academy/index.html",
         *["muse/rc%d/maintenance.html"%i for i in [71,72,73,74,78,79]]]
def identity(path):
    data=path.read_bytes()
    return {"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}
data={
 "schema":1,
 "candidateId":"RC79-A9-READING-R1.2-HOME1-FIX6",
 "deliveryRevision":"RC79-FIX6",
 "sourceCommit":source_commit,
 "rawApplicationBuildSha256":raw_build_sha,
 "contentBaselineBuildId":"e90c5c76e5e0e69b4b62f3327d879fef4284cb8ebb74691bdbe05cb8560be4a4",
 "previousDeliveryCommit":"1968fe4d9ffe30c2d682be8fcb2ac18d88b54b6b",
 "entryFiles":{name:identity(root/name) for name in entries},
 "entryHashScope":"HTML entries only; this manifest is excluded to avoid self-reference",
 "dataCompatibility":{"contentRevision":153,"storageVersion":2,"evidenceRuleVersion":6,
                      "readingContentVersion":2,"readingEngineRevision":3,
                      "compatiblePriorMappingBuildIds":["a1d855c798c8458a6ea5d99c709e54e8341b87b23aa12b1c89211164e793ebb9", "f881e9a2aadd16e35dc6a6eb9f9df87597dba298d3204e58d536a93f2421d07a", "eeedb3aefdb021fab8c829171b4580fe9ff5a8b35f06a2a7c9678d3edc226da6", "3838dcb354ee34c2b183e9781d9141516f69fd4f01ec84f725c6fafd5dcac63d", "603184a9ce43e1b28ae389f351318d00d98b451c544fff148835101b4c283170"],
                      "mappingSemanticSha256":"f55f248abb8f46e201ead1d35a20598e387484f93a49874123d80f2513b37839",
                      "jointReviewCompatibility":"Only the verified template and selection-explanation UI hashes differ; native tasks and grading remain identical.",
                      "changedPresentationTasksRequireReview":["RTM-2000-24-DECISION","RTM-2000-24-CONTRAST"]},
 "verification":{"state":"SEE_PUBLIC_RECEIPT_WHEN_AVAILABLE",
                 "candidateReceipt":"fix6/candidate-receipt.json",
                 "publicReceipt":"fix6/public-receipt.json",
                 "formalLearningAcceptance":"NOT_RUN",
                 "physicalIPad":"NOT_TESTED",
                 "realChildObservation":"NOT_RUN"},
 "historicalEvidence":{"home1":"home-h1/release-contract.json",
                       "load2":"loading-r2/public-receipt.json",
                       "fix1":"fix1/public-receipt.json",
                       "fix2":"fix2/public-receipt.json",
                       "fix3":"fix3/public-receipt.json",
                       "fix4":"fix4/public-receipt.json",
                       "fix5":"fix5/public-receipt.json"}
}
target=root/"muse/rc79"
target.mkdir(parents=True,exist_ok=True)
(target/"manifest.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
(target/"index.html").write_text("""<!doctype html>
<html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>天乐的功夫学堂｜版本信息</title>
<style>body{font:18px/1.65 system-ui;max-width:52rem;margin:2rem auto;padding:0 1rem;color:#173344}
a{color:#174d78}li{margin:.6rem 0}</style>
<h1>版本与验收状态</h1><p>本页提供构建身份和历史发布凭据。学习效果、真人观察和实机检查须分别记录。</p>
<ul><li><a href="manifest.json">当前构建身份与入口校验</a></li>
<li><a href="fix6/public-receipt.json">FIX6 公网检查结果（部署并复核后生成）</a></li>
<li><a href="fix6/candidate-receipt.json">FIX6 候选专项检查</a></li>
<li><a href="home-h1/release-contract.json">原内容构建合同</a></li>
<li><a href="fix5/public-receipt.json">FIX5 历史公网凭据</a></li>
<li><a href="fix4/public-receipt.json">FIX4 历史公网凭据</a></li>
<li><a href="fix3/public-receipt.json">FIX3 历史公网凭据</a></li>
<li><a href="fix2/public-receipt.json">FIX2 历史公网凭据</a></li>
<li><a href="fix1/public-receipt.json">FIX1 历史公网凭据</a></li>
<li><a href="loading-r2/public-receipt.json">LOAD2 历史公网凭据</a></li>
<li><a href="../../">返回功夫学堂</a></li></ul></html>
""",encoding="utf-8")
print(json.dumps({"candidateId":data["candidateId"],"entries":len(entries),
                  "sourceCommit":source_commit,"rawBuildSha256":raw_build_sha}))

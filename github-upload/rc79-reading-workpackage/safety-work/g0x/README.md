# AMC8 G0-X — 可恢复任务执行队列

此目录中的 queue.json 是候选分支上持久化的机器可读任务状态；queue-core.mjs 是校验与状态机，queue-cli.mjs 为 Node 22 命令行工具；test-*.mjs 为真实可运行的状态流转及 CLI 测试。它不是 ChatGPT Work 自动启动器。

## 正确工作方式

1. 新 Work/Codex 会话先读取最新 HEAD 和队列，调用 next 领取 READY 而非重新规划；依赖 PASS 且不需要单独授权的任务才可自动选择。
2. 当前执行者 claim 一个任务、获得 owner 和 lease.id，保存具体进度用 checkpoint；长任务定时 renew 租约。
3. 实际测试通过后才能用 pass 登记真实代码 SHA 和可核对证据；发生真实阻断则 block 后立即选下一个 READY 任务。一次 CI 或 Commit 并不是整项目完成。
4. 中断后先确认原会话已结束，等其 lease 到期，再明确调用 recover；不得强制抢占仍运行的任务。不同会话使用 GitHub 最新 HEAD 与非强制快进提交保护并发状态。
5. G5、M、W2、F、UAT 人工门禁需真实用户授权。approval-ref 只是授权收据的引用，不能代替授权或赋予部署权限。
6. Github Actions 只执行队列校验和测试、显示当前下一项，不会启动或重启 ChatGPT Work。无人值守跨会话续跑还需要有权限且受支持的外部执行服务。

## 命令（Node 22）

在项目根目录：

    Q=github-upload/rc79-reading-workpackage/safety-work/g0x
    node "$Q/queue-cli.mjs" validate
    node "$Q/queue-cli.mjs" next
    node "$Q/queue-cli.mjs" status
    node --test "$Q"/test-*.mjs

本地模式只改工作目录，只有写回 GitHub 才算跨会话持久化；动态队列不要固定 revision。

    node "$Q/queue-cli.mjs" claim --task W1-MATH-COMPAT --owner work-1

已有受信任 GitHub Token 的执行器可使用远程模式（不要提交或索取密钥）：

    BASE="--mode github --repo Dsp233/tianle-fruit-detective --branch rc79-reading-workpackage-20261101"
    node "$Q/queue-cli.mjs" next $BASE
    node "$Q/queue-cli.mjs" claim $BASE --task W1-MATH-COMPAT --owner work-1
    node "$Q/queue-cli.mjs" checkpoint $BASE --task W1-MATH-COMPAT --owner work-1 --lease-id LEASE_ID --note "精确恢复断点"
    node "$Q/queue-cli.mjs" renew $BASE --task W1-MATH-COMPAT --owner work-1 --lease-id LEASE_ID
    node "$Q/queue-cli.mjs" pass $BASE --task W1-MATH-COMPAT --owner work-1 --lease-id LEASE_ID --result-sha 40位真实提交SHA --evidence "测试链接;收据路径"
    node "$Q/queue-cli.mjs" block $BASE --task W1-MATH-COMPAT --owner work-1 --lease-id LEASE_ID --reason "具体可复核阻断"
    node "$Q/queue-cli.mjs" next $BASE
    node "$Q/queue-cli.mjs" recover $BASE --task W1-MATH-COMPAT --note "租约已过期，确认原会话结束"

GitHub 模式通过 Git data API 创建父提交为当前 HEAD 的新提交，并 force:false 更新候选分支引用。竞争写入导致非快进时应重新读取 HEAD 并核对变更，绝不盲目重试。若当前 Work 无令牌，可用已连接 GitHub 工具读取状态、应用同样转换并 expected-SHA 更新引用。

## 初始事实与安全边界

W1-R1 和 W1-R2-QA-PREVIEW 已有 b9dced6 收据，故标记 PASS；它们不等于 Q0 完整验收通过。当前最新状态以 queue.json 为准；先前 Pages CI、G5 清单和冻结 WebKit 已有 PASS，数学旧缺陷与 Muse 历史索引仍 BLOCKED，不能以本段历史描述覆盖任务队列。任何任务执行时仍需原工程门禁。当前仓库没有实现 Work 会话结束后的自动重启，GitHub 队列只解决可恢复性和会话内准确继续。正式 FIX15 与冻结 RC 不受影响。

## 当前可执行的发布闭环和依赖划分

- W1-G5 不再直接依赖历史 Muse 34 项“证据寻找任务” W1-R2-INDEPENDENT；由 W1-SOFTWARE-ACCEPTANCE 判定真实软件验收。关键阅读/导航/历史诊断/数学兼容等软件用例需实际绑定 Chromium、WebKit、独立证据和发布 SHA；原用例不明时必须有逐项审计或实际负责人对明确缺口的风险决定，绝不假定缺失即通过。
- W1-G5-RELEASE-ENVELOPE 对照固定 main 的 FIX15 字节，用原冻结 ZIP 的运行文件、支持脚本、发布工作流和新的 W1 manifest 构建独立 staging tree；标记 STAGED_NOT_DEPLOYED。要有仓库代码/实际 ZIP 完整哈希、staging receipt、回滚证据才可 PASS；生成后仍须单独 G5 发布授权。
- 若新修复导致已冻结运行源码/哈希变化，重新计算与当前候选相符的发布清单，重新签收受影响浏览器用例与封包收据；旧 PASS 不自动证明新版。
- G0-B 仅等待 G0-A-RISK-SLICE 和 W1-G5，不必等完整 G0-A 六份治理产物；Q0-PREVIEW 可提前完善，Q0 正式版仍在 W1 之后。M-PREP/W2-PREP/P-PREP 只读准备不等于功能/发布授权。
- 原 READY.json 是历史构建触发快照，保留不改以免无意义重建 W1 大型 CI；其早期 iPad 前置文本不再是当前 G5 发布合同。最新权威依据为 MASTER_DELIVERY_PLAN、DELIVERY_PLAN 和 G0-X queue.json。
- G0-X 的 `pass` 对 RELEASE-ENVELOPE 与 SOFTWARE-ACCEPTANCE 要提供 `--disposition-file` 的实际结构化证据，`W1-MATH-COMPAT` 还需记录 `releaseSourceCommit`，软件验收也需 `releaseSourceCommit`。在领取 W1-G5 时会校验三者绑定同一冻结运行源码 SHA；若修复产生新候选必须重新核对适用浏览器/数学证据和 ZIP 清单。纯字段检查不能验证链接真实性，执行者需核查引用。

## 数学任务范围与 W1-G5 门禁（版本纠偏）

- `W1-MATH-SAVE` 是历史不变的任务 ID，现归入 M 数学维护；保留 BLOCKED 和原始证据，不得通过改名宣称已修复。
- 新的 G5 依赖为 `W1-MATH-COMPAT`，而不是数学维护任务。**至少对照生产 FIX15 与原冻结 W1，怀疑评审干扰或判 QA_ONLY 时必须加测私有 QA 版**，以可比浏览器场景和隔离合成记录判断 PRE_EXISTING / W1_REGRESSION / QA_ONLY，必须追踪首答、草稿、pending、重试与持久化。
- 若为仅有历史的 P2/P3、无数据丢失/静默覆盖，且有责任人风险接受记录，可将 W1-MATH-COMPAT 判 PASS，数学修复归 M。若是 W1 新增回归或数据风险重大，必须修复并重新冻结、Chromium/WebKit 回归及 G5 清单再签收。仅 QA 版异常的，需证明原冻结版未受影响且评审层未进入 G5。
- 完成兼容任务时，先建立 JSON 风险处置文件，参考下列结构（**示例路径不可冒充真实证据**）。仅在真实证据确认并得到实际风险接受后，通过 `pass --disposition-file path/to/verified-math-disposition.json` 提交。G0-X 队列可校验字段与规则，但不验证链接内容；不能通过虚构字符串绕过验收。
- 数学兼容 PASS 不替代软件真实验收 W1-SOFTWARE-ACCEPTANCE 或 G5 发布授权。历史 W1-R2-INDEPENDENT 的 Muse 证据寻源任务单独保留，不再无条件成为 G5 机器依赖。

```json
{
  "classification": "PRE_EXISTING",
  "severity": "P2",
  "releaseSourceCommit": "c8575da9d28c40b5bf79412928a0be8c397e7094",
  "comparison": {
    "sameScenario": true,
    "isolatedProfiles": true,
    "fix15Evidence": "真实证据文件或测试运行链接",
    "frozenW1Evidence": "真实证据文件或测试运行链接",
    "qaPreviewEvidence": "真实证据文件或测试运行链接"
  },
  "safety": {
    "firstAnswerEvidence": "实际读回证据",
    "draftEvidence": "实际草稿读回证据",
    "pendingEvidence": "实际持久化事务确认与失败路径证据",
    "dataLoss": false,
    "silentOverwrite": false
  },
  "decision": {
    "type": "ACCEPT_VERIFIED_LEGACY",
    "riskAcceptanceRef": "实际责任人确认的风险接受记录"
  }
}
```

若诊断为 `W1_REGRESSION`，决策必须为 `FIX_AND_REFREEZE`，并提供 remediationCommitSha、refrozenSourceCommit、refrozenArtifactSha256、chromiumEvidence、webkitEvidence、revisedAllowlistEvidence；对 `QA_ONLY` 使用 `QA_ISOLATED` 并提供 qaExclusionEvidence。存在已确认 P0/P1 或数据丢失/静默覆盖时，仅重新修复验收后才能 PASS。

## 可运行的 G5 staged release 事务（不发布）

```bash
python3 github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/g5_release_envelope.py \
  --candidate . --baseline /path/to/pinned-main-FIX15 \
  --main-sha 23755d3aa9bf9e479468bb24263f81ea8228430e

python3 github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/g5_release_envelope.py \
  --candidate . --baseline /path/to/pinned-main-FIX15 \
  --main-sha 23755d3aa9bf9e479468bb24263f81ea8228430e \
  --frozen-zip /path/to/actual-verified-W1-candidate.zip \
  --expected-zip-sha256 ad38df5d92fce91898ca57f4cc7a7478fd1c9f5fbe55538b0a94010227cd1cf0 \
  --output /separate-path/w1-staged-release
```

Staging 直接从已验证 ZIP 读取并逐文件核对冻结运行字节，封装原 FIX15 其他文件、正式 CI 验证工作流和脚本以及新 manifest/identity。完整 staging receipt 的状态为 STAGED_NOT_DEPLOYED；需要真实可复核的发布授权后才能进入 GitHub main/Pages。首次预检只验证现有文件/脚本与主分支的闭环，不假定已经下载真实 ZIP。参考 [G5 发布合同](../w1-checkpoint/w1-g5-release-envelope-contract.md)。

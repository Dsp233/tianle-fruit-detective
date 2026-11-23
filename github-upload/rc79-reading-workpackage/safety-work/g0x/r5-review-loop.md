# M1 R5 独立审核续跑

## 启动状态与当前阻断（2026-11-15）

机制已提交不等于审核已运行。核查基线 HEAD `57b7ec28c64f059e260a726522bd1a2d33f91b0c`、G0-X rev280：候选 `c732284e991023398aa9ebec454fcc59901ee90c`，29/84 PASS、ISSUE=0，下一题族 `J-D01-01`。本次没有修改签收账本。

1. 当前旧租约 `6b303209-b1e1-492f-880a-2d82b165f729`，持有人 `r5-reviewer-6Yy315`，于 2026-11-14T21:53:02.375Z 领取、2026-11-15T00:53:02.375Z 到期。缺少该次执行停止及后台写入结束的真实记录。旧租约停止声明不得替用。当前接口不能查询或停止任意旧 Work 会话；GitHub 安静也不能证明会话结束。
2. 自动任务 `6af885ba06808191b332f499697018aa` 已禁用；最后一次运行于 2026-11-14T20:04:45.614859Z 结束，早于当前租约领取，不能作为此次停止证据。未启用新的定时重试，避免重复产生同一阻断。
3. `review-loop` 是执行框架，仓库未附带可执行的独立数学评审器；测试里的 synthetic worker 只测控制流程，不能产生真实签收。当前环境也未设置 CLI 所需的 GH_TOKEN/GITHUB_TOKEN。但已连接的 GitHub 工具具有工作分支写入能力：这不是仓库全局权限缺失，不能要求用户为手动工具执行提供 token。

恢复动作：在原评审会话要求其停止与上述租约关联的工作、等待后台队列写入结束，并记录含 owner、lease ID、候选 SHA、终止时间及实际检查结果的回执。如无法证实后台停止，应明确报告而非签发回执。获得记录后重新读取最新 HEAD/队列，仅对同一过期租约执行带停止证据和乐观并发校验的 recover，再以独立评审者新租约继续。可以由实际独立评审会话通过已连接 GitHub 工具保存浏览器证据和续租，不必等待额外 CLI token 或虚构自动评审器。

若使用下面的 CLI 自动循环，必须先接入真实 worker。新增启动检查会在 worker 缺失、不可执行或不是普通文件时拒绝运行，不续租、不建锁、不生成停止回执。已以独立临时队列验证，51 项测试通过；未对真实旧租约执行恢复，未新增数学 PASS，未修改正式站。

先从 GitHub 读取队列和候选 SHA。现有租约还有效时由原持有人继续。租约过期时，先核实对应执行者确已停止和没有其他后台写入，再使用 `queue-cli.mjs recover`，同时指定 `--expected-head`、`--expected-revision` 和 `--stop-evidence`。确认返回的候选与审核工件一致后，按已有授权和独立评审者角色领取任务。

```sh
node queue-cli.mjs review-loop --mode github \
  --repo Dsp233/tianle-fruit-detective --branch rc79-reading-workpackage-20261101 \
  --owner "$reviewer" --lease-id "$lease" --source-sha "$candidate" \
  --worker /path/to/independent-review-worker --receipt-dir /durable/r5-receipts \
  --ttl-minutes 60
```

启动该命令前需配置拥有队列分支写权限的 `GH_TOKEN` 或 `GITHUB_TOKEN`。每份租约只运行一个循环，并在同一持久目录保留回执。`--worker` 是独立评审程序的可执行路径，由调用方提供。它接收候选 SHA、题族 ID、评审者标识三个参数，每次负责一个题族。它应按独立审核合同完成真实浏览器作答和判分，将证据先存入可核实的持久位置，然后在标准输出写出单个 JSON 对象，字段为 `sourceSha`、`familyId`、`reviewerRef` 和 `checks`，与 `review-checkpoint --review-file` 的格式相同。工作进度写到标准错误。程序退出前须等待其浏览器和证据写入工作结束。它不应自行修改队列，也不会继承上述 GitHub token。

循环只续租与指定执行者、租约及候选匹配的有效任务，剩余时长低于一半时续租，审核较慢时也会检查。每个有效回执先落盘再提交队列。重启读取 GitHub 最新进度，已记录的 PASS/ISSUE 跳过。已落盘但尚未提交的本执行者回执直接使用。每次提交记录题族、候选 SHA、队列提交 SHA 和下一个断点。若评审程序返回不完整证据，保留已提交的维度并等待缺失证据。完成所有题族后，只有 84/84 PASS、ISSUE=0 才调用 `pass`。有 ISSUE 时记录涉及的题族，等独立整改及候选复核。

正常退出或捕获错误后，循环在子评审程序结束后留下带租约 ID 的终止回执。回执应与最新队列及执行环境一起核验。若远程写入结果不明确，先回读 GitHub 确认实际提交。强杀、机器断开或根本没有使用循环的旧会话可能没有终止回执，仍需从会话或执行环境取得停止证据。循环不会抢占、恢复或者领取租约，也不会自动启动新的 Work 会话。


## Protected queue recovery (alternative, M1 R5 ONLY; requires real separate approval)

If the original Work process cannot provide a trustworthy stop receipt, do **not** claim it stopped. The canonical queue branch can instead be protected at the GitHub server: a verified active branch-only ruleset requires pull requests, a **different GitHub approver**, a strictly up-to-date `validate-queue` GitHub Actions check, and no bypass; old direct commits are rejected. This prevents a still-running old Work process from changing the canonical queue via its previous push mechanism. It does **not** prove that process ended or that its credentials were revoked.

For this specific M1 R5 recovery, the standalone `recoverExpired` state transition also accepts a structured `--isolation-receipt-file` with fields `branch`, `candidateSourceSha`, `rulesetRef`, `directWriteRejectionRef`, `approvalBlockRef`, `requiredCheckRef`. The code checks the receipt is for M1 R5 and its exact branch and candidate. A separate authorized GitHub approver **must independently inspect** the live ruleset and verification records before approving the recovery PR. File fields alone are not authentication or proof of current ruleset state. Once used, the recovery history is marked `PROTECTED_QUEUE_ISOLATION`, never `WORKER_STOPPED`.

The current active protected branch cannot accept `queue-cli --mode github recover` direct ref updates. Compute the transition in an isolated local queue snapshot, put **only** the resulting queue.json into a new PR targeting `rc79-reading-workpackage-20261101`, let GitHub run `validate-queue`, have a distinct authorized reviewer approve, and only then merge. Re-read remote HEAD and revision immediately before starting; if the branch has advanced, rebuild the recovery PR, do not force-push or bypass protections. The recovery PR must not touch main or code and does not itself sign any additional family. The new genuinely independent reviewer claims the fresh lease in a subsequent protected PR after reviewing the merged queue state, then performs real browser reviews and submits signed evidence in separate approved PRs.

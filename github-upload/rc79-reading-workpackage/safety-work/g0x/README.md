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

本地模式只写工作目录（不是 GitHub 持久化提交）：

    node "$Q/queue-cli.mjs" claim --task W1-MATH-SAVE --owner work-1 --expected-revision 0

已有受信任 GitHub Token 的执行器可使用远程模式（不要提交或索取密钥）：

    BASE="--mode github --repo Dsp233/tianle-fruit-detective --branch rc79-reading-workpackage-20261101"
    node "$Q/queue-cli.mjs" next $BASE
    node "$Q/queue-cli.mjs" claim $BASE --task W1-MATH-SAVE --owner work-1
    node "$Q/queue-cli.mjs" checkpoint $BASE --task W1-MATH-SAVE --owner work-1 --lease-id LEASE_ID --note "精确恢复断点"
    node "$Q/queue-cli.mjs" renew $BASE --task W1-MATH-SAVE --owner work-1 --lease-id LEASE_ID
    node "$Q/queue-cli.mjs" pass $BASE --task W1-MATH-SAVE --owner work-1 --lease-id LEASE_ID --result-sha 40位真实提交SHA --evidence "测试链接;收据路径"
    node "$Q/queue-cli.mjs" block $BASE --task W1-MATH-SAVE --owner work-1 --lease-id LEASE_ID --reason "具体可复核阻断"
    node "$Q/queue-cli.mjs" next $BASE
    node "$Q/queue-cli.mjs" recover $BASE --task W1-MATH-SAVE --note "租约已过期，确认原会话结束"

GitHub 模式通过 Git data API 创建父提交为当前 HEAD 的新提交，并 force:false 更新候选分支引用。竞争写入导致非快进时应重新读取 HEAD 并核对变更，绝不盲目重试。若当前 Work 无令牌，可用已连接 GitHub 工具读取状态、应用同样转换并 expected-SHA 更新引用。

## 初始事实与安全边界

W1-R1 和 W1-R2-QA-PREVIEW 已有 b9dced6 收据，故标记 PASS；它们不等于 Q0 完整验收通过。数学保存失败提示、FIX15 公网 CI 适配、G5 文件清单确认、独立浏览器证据缺口等保持 TODO。任何任务执行时仍需原工程门禁。当前仓库没有实现 Work 会话结束后的自动重启，GitHub 队列只解决可恢复性和会话内准确继续。正式 FIX15 与冻结 RC 不受影响。

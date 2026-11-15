# M1 R5 独立审核续跑

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

# CR3 验收报告

审查基线 `05f73af21ddf35134bb7c5e598cd75845e82baf2`。候选代码和实测测试 SHA `baec43d628dbc905f6de40df99a1362b37ffb048`。CR0 #54 `69dde6a12703266d5f1e2825aa360b41283d309d`、CR1 #55 `c5aa61df37013fad474641c1c9645cdf4212c296`、CR2 #57 `544f525c2bf449970f2ad1dfca971c0e0abe94f7` 均为未合并 Draft。

旧构建器通过 `git show b39ece48917d834e611565432e6cbe7f59ec2edd:path` 读取历史数据和三个入口，在计算结束后将资源、入口、ledger 和 identity 写入当前 checkout。现有 release verifier 能检测回退，但旧构建器本身原本会以 exit 0 覆盖三个入口。修复在导入本地模块和第一次写入前比较三个工作树入口的完整字节与历史 BASE，不一致即报错并退出。干净 BASE worktree 加入构建脚本及四个历史构建输入仍可生成该历史版本。BASE 未改，未新增输出目录。

GitHub [完整对照运行 44028321915](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44028321915) PASS，包含独立临时 worktree 和原始日志，[artifact](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44028321915/artifacts/14303878003) SHA-256 `89f3b861dc03b5fb1d7471f64b20ef9a0738225b956c223125c281074ff95292`。原构建器真实 exit 0，三个入口被改写，阅读 runtime 从 `7c9ab43332d698ef3971bf52495fef4369f2ca87ef126d3239fb10e5f8796116` 退到 `37e882402a61ac728f3909bced825af82940c1fbb30d5ce18dafcb08ed7f464e`，失去词义提示和插画绑定。候选在两份干净当前 checkout 均 exit 1 且测试前后全部文件字节一致，原运行包、词义提示和插画绑定保留。两份 checkout 的正式 art 构建各 95 文件均与 main 字节一致，包括三个入口、插画和 release manifest。每个历史入口单独附加未提交变更时都在首次写入前拒绝。干净历史 worktree 的构建 exit 0，生成预期历史 runtime。

仓库内 results.json 为实际 GitHub 对照结果，完整脚本输出和每一命令日志在上述 artifact。首次本机历史复现因测试夹具遗漏 words.json 失败，已补齐 words.json 与 word-layout.js 并重跑通过。已有 main 版阅读 CI [44028328704](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44028328704) 返回 success，但其浏览器和规则步骤由于 CR-003 被跳过，不能算浏览器通过。CR2 #57 的浏览器证据是基于独立未合并候选，与 CR3 未做集成。

限制：历史复现需要工作树入口与 BASE 完全相同，已有历史构建输出的工作树必须重新建干净 BASE worktree。真实浏览器和设备回归 NOT_RUN，本次仅构建脚本防写保护。多进程在检查与写入之间修改入口、符号链接/硬链接并发对抗未测试。未合并其他 PR、未修改 main、未部署 Pages。

初版保护位于计算阶段之后，复核发现导入本地模块可能先生成字节码。随后将保护移到本地模块导入之前，测试对照包含字节码文件，并以最终代码重新通过 GitHub 测试。

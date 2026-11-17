# CR0 执行记录与证据索引

审查源码：`05f73af21ddf35134bb7c5e598cd75845e82baf2`。
最终可执行测试提交：`38f7b2513e7815db0b0c42c57b1daaf118fe5530`。
PR：[#54](https://github.com/Dsp233/tianle-fruit-detective/pull/54)，Draft，未合并。

## 最终完整运行

- [GitHub Actions 44010116843](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44010116843)
- Job `133794839089`；环境 Ubuntu 24.04 / Python 3.12.16 / Playwright 1.57.0。
- Chromium `143.0.7499.4`、WebKit `26.0`，全部使用独立合成 context。
- [原始 artifact 14295903172](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44010116843/artifacts/14295903172)
- ZIP SHA-256：`4cb2cd6edca60761c486df5a58c08938fdfdcd7d75d0f6a8e12526d01bf88250`。下载后实际校验一致，解压原日志与 JSON 入库，未改写其中结果。
- [完整运行日志](evidence/run.log) · [机器结果](evidence/results.json)

**结果：15 个正常/拒绝对照 PASS，15 个产品契约 FAIL，0 个 harness ERROR，1 条环境 INFO；进程退出 1。** 工作流红灯是预期的修复前缺陷证据；没有将它伪报为全绿。31 条记录不是 31 个独立缺陷，仍只有报告中的 4 个 Finding。

| 组 | 实测 | 结果解释 |
| --- | --- | --- |
| 原始运行包完整性 | 29 包 hash，记录解压 bytes，1 条 PASS | 正常 main 的必需包当前正确 |
| CR-002 当前 art 构建 | 两个独立 checkout 各 95 个文件 + 彼此一致，3 条 PASS | 当前正式构建可复现 |
| CR-002 旧 quality 构建 | 1 条 FAIL | exit 0 却改回旧阅读包；下游 release gate exit 1 拦截 |
| CR-001 | 2 引擎 × 4 操作 × 正常/配额故障，共 16 条 | 8 正常 PASS，8 故障 FAIL；保存提示与刷新结果矛盾；学习哨兵字节不变 |
| CR-004 | 2 引擎 × JSON 替换/JS 替换/坏 gzip，共 6 条 | 4 错误包采用 FAIL，2 坏 gzip 拒绝对照 PASS |
| CR-003 阅读样式 | 2 引擎，共 2 条 FAIL | 390px 视窗，正文由 336px 变为 2000px，31 个汉字落在视窗右侧；Identify 仍 exit 0 / art=true |
| CR-003 图片对照 | 1 条 PASS | 坏 WebP 被 verifier 拒绝；illustration 路径命中 |

样式故障下 document.scrollWidth 仍为 390，外层裁切隐藏了溢出；本次使用正文几何尺寸和离开视窗的汉字计数证明真实可读性损坏，未把滚动条当作唯一标准。

## 真实返工历史

| 次序 | 测试 SHA | 实际运行 | 结果与修正 |
| --- | --- | --- | --- |
| 1 | `c7b9cb5ae1523c85f333bab1a156e82067c03ec9` | [44008808264](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44008808264) | exit 2。删除唯一批注后导出为空列表，测试误要求仍有 CR0 批注文本；修正为验证 Markdown 结构，并仅在有批注时要求内容。 |
| 2 | `4c87b11197b432d776aed0686ce8f53062b12707` | [44009147071](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44009147071) | exit 2。Playwright route 回调传入 Request 覆盖默认 payload 参数；修正回调签名，未改变产品源码。 |
| 3 | `638933812be9d2de47b108bffe28a8793da75f65` | [44009443776](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44009443776) | exit 2。错用 document.scrollWidth 判断被外层裁切的正文；两引擎 Q0/错包已跑完。修正为正文宽度与越界汉字计数，正常对照必须为零。 |
| 4 | `38f7b2513e7815db0b0c42c57b1daaf118fe5530` | [44010116843](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44010116843) | exit 1；完整执行，15 PASS / 15 FAIL，0 harness ERROR。 |

前三次的原始逐条日志摘录保留于 `evidence/initial-run-excerpt.log`、`second-run-excerpt.log`、`third-run-excerpt.log`。它们未跑到的项目当时为 **NOT_RUN**；不得借用第四次结果改写前三次为 PASS。本次实际测试脚本返工 3 次；生产代码修复 0 次。模型 token、缓存及费用数据不可获得，没有估算或伪造。

本机运行了两份 clean build 和旧入口实验；浏览器启动受到本机 socket 权限限制且最初下载有异常，故本机浏览器用例为 **NOT_RUN**。随后使用上面的真实 GitHub runner 完成双引擎复现，没有用浏览器桩代替。

## 未执行/保留范围

- CR1 修复以及修复后同例：**NOT_RUN**，没有授权。
- 两份携带产品 CSS/图片故障的独立 PR：**NOT_RUN**。实际执行的是 CR0 job 内隔离 worktree 故障注入、原 YAML shell 复放及 paths 匹配；报告明确区别。
- 真机 Safari/iPad、儿童体验、真实朗读听感：**NOT_RUN**，沿用 W1 延期范围。
- 新的全量数学/阅读内容验收、全部竞态组合、正式网络异常矩阵：**NOT_RUN**；仅静态追踪相关关键路径，复用已验且字节一致部分的证据。
- 运行时 hash 修复开销、旧 Safari 回退、修复后重试：**NOT_RUN**。
- 合并、Pages 发布、用户档案读取/清理：**未执行**。

## 交付边界

新增内容仅为 `code-review/CR0/**` 与 `.github/workflows/cr0-evidence.yml`。后者只允许 `codex/cr0-real-code-review` 分支的测试脚本/workflow 变化触发，权限为 `contents: read`，没有 Pages 权限、deployment、workflow dispatch、评论或 main 写入步骤。仅补报告/日志不会再触发测试。

完整报告：[REPORT.md](REPORT.md)。模型建议和完整人工启动提示词：[NEXT_WORK.md](NEXT_WORK.md)。CR0 完成后停止，不自动进入 CR1。

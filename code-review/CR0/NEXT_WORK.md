# CR0 后续建议：仅供人工决定，不构成启动授权

建议下一步只启动 CR1，修复已复现的 CR-001。CR-003 留待 CR2，避免一次变更多个故障域。

## 模型建议与证据限制

暂推荐 **GPT-6.1 Terra / high** 执行这个范围明确、有失败用例的修复。不是对 AMC8 修复成功率的实测排名；没有找到针对 Q0/localStorage 配额故障修复的同任务模型对照。

2026-11-17 查询的 [MacroscopeBench](https://macroscope.com/benchmark) 使用真实开源缺陷引入提交，统一 harness、每模型三次运行。相近任务是发现正确性缺陷，而不是通用问答排行：

| 配置 | 缺陷召回率 | 缺陷报告精确率 | 每审查任务推理成本 | 中位时间 |
| --- | --- | --- | --- | --- |
| GPT-6.1 Terra high | 75.0% | 91.2% | $0.57 | 2m35s |
| GPT-6.1 Sol high | 66.2% | 91.3% | $0.56 | 1m52s |
| GPT-6 Astra max | 67.8% | 91.7% | $7.87 | 3m49s |

来源的 [方法说明](https://macroscope.com/blog/macroscopebench) 指出这是厂商维护、使用 LLM judges 的审查评测，不是独立的 AMC8 工程修复实验。召回率不是修复成功率，精确率也不是免返工率。表内成本是该评测推理费用，不是当前 Work 任务实际收费。

补充真实 PR 场景：[CodeReviewBench 的 GPT-6.1 Sol 记录](https://www.codereviewbench.com/model/gpt-6.1-sol) 覆盖 cal.com、Grafana、Sentry 等 30 个 PR。Balanced 检出 52/121，精确率 62.6%，$0.787/PR；Heavy 检出 67/121，精确率 55.4%，$1.741/PR。Heavy 是不同的多代理 harness，不等于把同一模型思考强度调高。这个结果只说明提高搜索投入可能同时提高召回、噪声与成本，不能证明 AMC8 需要最高强度或多代理。

**缺少的直接证据**：三个候选对本次 localStorage 修复的成功率、返工率、实际 input/output/reasoning tokens、缓存量和总费用均不可得。没有用 API 单价推算成本，也没有把审查 benchmark 当成修复质量保证。选择 Terra high 是基于相近审查任务的质量/成本折中；最终以 CR-001 原故障测试红转绿和双引擎行为为验收。

本次实际 token/费用：**不可获取**。本次测试脚本返工：见 RUNS.md，逐次保留真实失败原因；不是产品代码修复次数。没有使用子代理，没有模型间 A/B 实验。

## 完整 Work 提示词

```text
执行 AMC8 真实代码评审专项 CR1，仅修复已确认的 CR-001。此消息是 CR1 的人工启动授权，不授权 CR2–CR5、合并或发布。

仓库：https://github.com/Dsp233/tianle-fruit-detective
依据：《AMC8_真实代码评审专项_CR_V2.0.md》以及 PR #54 的 code-review/CR0/REPORT.md、RUNS.md、evidence/results.json 和 reproduce.py。先查询最新 main 和 PR #54 的实际 HEAD，核对与 CR0 基线 05f73af21ddf35134bb7c5e598cd75845e82baf2 的差异，在最新 main 建独立 CR1 分支。不要合并 CR0 的故意失败工作流来冒充修复。

CR-001 已复现：正式 review-overlay.js 的 persist() 在 Q0 key 写入失败时返回 false，但新增、编辑、标为已处理、删除的编辑器调用者继续提示成功。刷新后新增消失，编辑/状态/删除退回旧持久化状态。清单内存在未持久化警示，不应误述为完全没有任何错误反馈。

先继承 CR0 四种操作的 QuotaExceededError 负向测试、正常写入对照、真实 Markdown 下载、刷新验证和学习 key 字节保护断言。允许给测试增加明确的 baseline/candidate 参数和 CR-001 选择器；必须验证测试确实运行候选而非仍固定 CR0 baseline。保持原失败用例，不可删除或弱化断言来变绿。

最小修复 Q0：依据实际持久化结果显示状态；失败时保留可导出、可重试的意见/草稿，不提示已保存/已更新/已删除；再次重试不能重复创建意见；状态切换、删除及其他 persist 调用者应行为一致。必要时保留删除前数据以便恢复，不改变既有存储 key/schema，不清理用户本地存储。

使用隔离合成档案，在 Chromium/WebKit 实测正常保存、配额故障、编辑/状态/删除失败、导出、重试成功和刷新保留；补查清单直接按钮及元数据编辑的失败反馈。验证阅读、数学及已有批注数据不受影响，复用有效 W1 证据，不重审84天课程及336题。

只改 CR-001 必要生产代码、相关定向测试和证据；不修 CR-002/003/004，不进行全面重构，不接管 M1 或 G0-X，不启动 M2/W2。若发现新的实质 P0/P1，保存复现证据并报告，不擅自扩大修复。

以独立 Draft PR 提交，报告真实基线/候选 SHA、每项用例修复前 FAIL 与修复后结果、双引擎原始日志、数据保护证据、剩余限制及测试返工。未执行标 NOT_RUN，测试脚本错误与产品缺陷分开记录。不得修改 main、触发 Pages、合并或发布。完成 CR1 后立即停止，等待人工验收。
```

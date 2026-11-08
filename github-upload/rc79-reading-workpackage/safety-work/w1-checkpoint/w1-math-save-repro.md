# W1-MATH-SAVE 定向复现

冻结工件 13595790278 的 `source/exam_mapping_ui.js` SHA-256 `8cf3eb5638a8ea4d84ca9d51bb406b2ca7765ceed5c1a9f9b9305dda49a2098b`。RTM1 的 `commit(next)` 在 `persist()` 返回 `ok:false,pending:true` 时回滚内存记录并提示失败。冻结 `progress_store.js` SHA-256 `04b1f2d6351b1afa77ae44502efcefe6b542e1a398681c1d46d2eb713a6a998d` 的 IndexedDB 串行写入路径此时仍保有序列化快照，随后成功即可落盘。该路径与 [真实 Chromium 观察](w1-release-preflight-20261108.md) 中提示失败后重新进入却读回首答一致。现有浏览器收据未保存当时事务时间线。

定向验证使用 `repro-math-pending.mjs <frozen exam_mapping_ui.js> <frozen progress_store.js>`。直接执行冻结 handler，并在 VM 内隔离模拟先 pending、后持久化的接口契约。已观察到失败提示、内存回滚和模拟完成后首答存在。该验证证明界面错误分支，实际 IndexedDB 时序及修复后浏览器验收仍须实测。

发布阻断仍开放。RTM1 同一提交助手还服务题目呈现、输入、提示、结题和连续组转换。只改提示会保留状态回滚，只把 pending 当成功会提前触发后续流程。修复须按已写入的同一 RTM1 快照确认，保持操作串行；覆盖首答与选项草稿、连续点击、下一题、关闭前待确认、配额/冲突、重试/导出及刷新恢复。以新候选执行相应 Chromium/WebKit 回归，再重新绑定 G5 清单。冻结 RC 保留作为对照。当前执行器本地 Chromium socket 启动失败的记录见前次收据，本轮没有可用的 WebKit 二进制。

## 工程范围纠偏说明

此前记录的冻结候选 RTM1 pending 提示问题尚未与 FIX15、纯冻结 W1 和评审版 W1 做同条件对照，无法断定它由 W1 引入。历史任务 ID W1-MATH-SAVE 保留在 G0-X 事件记录中，但归入数学维护范围。W1-G5 改由 W1-MATH-COMPAT 判断是否存在相对于 FIX15 的数学回归及发布级数据风险：历史 P2/P3 需有风险接受及确认未破坏记录，W1 新回归/高风险需修复后再发布。当前仍无三版本比较结论，绝不可在缺证据时直接放行。

# G0-A 测试证据矩阵

| 层 | 已核证据 | 边界 |
|---|---|---|
| 静态与队列 | `amc8-g0x-check.yml`，校验 DAG、租约和结构化发布证明 | 不运行浏览器或发布 |
| VM/单元 | `repro-math-pending.mjs` 对冻结 RTM1 caller 的定向复现；原锁和适配器用例 | pending mock 仅证明同步返回处理 |
| 定向真实浏览器 | 42392884944 普通数学草稿、锁、存储配额；预检独立 Chromium 对真实 QA 首页 | 普通数学样本与 RTM1 不同，QA 预览仅覆盖定向场景 |
| 冻结完整候选 | 42425597193 job 128563076962 双浏览器，工件 13595790278 | recovery staging 步骤 SKIPPED，FIX15 回退另有证据 |
| 发布事务 | W1-G5-RELEASE-ENVELOPE 队列的实际冻结 ZIP、staging receipt 和 rollback | STAGED_NOT_DEPLOYED，公网检查待授权部署 |
| 历史与最终设备 | Muse 26+8 原 ID 未齐，真实设备/听音/儿童 UAT 延期 | 独立证据和责任人风险决定仍按 W1-SOFTWARE-ACCEPTANCE |

代码或数据语义变化只重验受影响路径及必要集成。文档和队列改动不触发原冻结构建。数据安全、构建字节和实际设备层分别结项。

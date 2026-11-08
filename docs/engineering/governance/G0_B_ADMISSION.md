# G0-B 数学开发准入

结果 `READY_FOR_M`，以实际授权范围内的隔离开发为限。W1 生产基线为 `7e1b5df76e63abcb45836200dbde4d06e88eaf35`。[G5 公网验收](../../../github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g5-public-acceptance.md)已完成。M 功能开发授权与正式发布授权仍分别管理。

| 关键风险 | 实际处置和可核验证据 |
|---|---|
| RTM1 保存及旧记录 | W1 重冻结已修复 pending 误报，首答、草稿、配额、跨版本记录沿用[双引擎 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447571460)和 G5 实际首答刷新恢复。后续触碰 `progress_store.js`、Web Locks/IndexedDB、旧页面并发、数学 STORE 或阅读派生键时，先复验受影响版本的导入导出、首答、旧页并发、配额与回退。 |
| 构建包到期 | [归档 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42457799281)从 Actions 读出 HOME1、FIX15 回退、新 W1 冻结和原 QA 底包；四份原始 ZIP 已在仓库受限 draft release 438091549 保全，重新下载并逐项验证 SHA-256。[资产 ID 和校验值](G0_BUILD_ARCHIVE_RECEIPT.json)。HOME1 同时验证内层 `RC79_HOME1_candidate.zip` SHA-256 `a61a4b6376f1b6cc39fd1b1bb8e2dda4f94d38a2e05410dd4db9e23254e09c06`。 |
| 回退可复验 | 在独立 Git 索引对实际生产提交的 53 路径事务反向应用，得到精确 FIX15 文件树 `d24010fd4baaae1f7f6f416cee001e25de275a6e`，与生产父提交树相同。操作未写生产。上线回退时保全 W1 原文和新学习记录，正式回退另走 G5 收据所列流程。 |
| 构建入口与 CI 写入隔离 | 正式 W1 使用固定 HOME1/FIX15 → W1 assemble → ZIP/提升清单 → Pages；旧公开验证器已按 manifest 识别 FIX15 和 W1。本次 release stage runner 只向隔离 ref 写运行对象，生产由预期 SHA 单次提升。M 改动从生成前源码开始，在隔离候选验证；不得直接编辑生成的公开 HTML/哈希分片来替代实际源码。 |

## 归档恢复

拥有仓库相应权限的执行者使用 `gh api -H 'Accept: application/octet-stream' repos/Dsp233/tianle-fruit-detective/releases/assets/<assetId> > <file>` 读取归档，用收据对每个 ZIP 执行 SHA-256 校验。若原 Actions HOME1 已过期，从校验后的归档取出内层 ZIP 和配套 JSON，然后按当前候选工作流调用 `github-upload/unpack_rc79_reading.py`；恢复路径须保持相同哈希，首个启用备用路径的候选再执行受影响构建验证。草稿归档保留原访问范围。

CI 文件去重、覆盖层重构与不影响当前安全准入的维护项继续登记于 [G0-A 风险台账](TECH_DEBT_BACKLOG.md)。发现记录损坏、无法恢复受支持的构建输入或生产版本读回不一致时，暂停对应写入，关闭实际风险后重新确认准入。

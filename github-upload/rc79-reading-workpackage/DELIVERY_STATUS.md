# W1 当前交付状态（R1.2）

项目级 [MASTER_DELIVERY_PLAN.md](../../docs/engineering/MASTER_DELIVERY_PLAN.md) R2.0；W1 [DELIVERY_PLAN.md](../../docs/engineering/DELIVERY_PLAN.md) R1.2。
**RC_FROZEN / NOT_RELEASED / DEVICE_UAT_DEFERRED**。

- 唯一运行源码 `c8575da9d28c40b5bf79412928a0be8c397e7094`；[CI 42425597193](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193) SUCCESS；工件 `13595790278` ZIP SHA-256 `ad38df5d92fce91898ca57f4cc7a7478fd1c9f5fbe55538b0a94010227cd1cf0`。
- [冻结收据](safety-work/w1-checkpoint/w1-final-rc.md)记录：G1 PASS、G2 PASS、G3 PASS、G4 独立 HTTPS PASS；437 文件部署前一致，55 项部署后授权回读一致。recovery staging SKIPPED，回退复用适用专项证据。
- [原私有预览](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/) 当前提供首页评审层，部署后首页、评审资源和身份文件回读一致。实际浏览器定向结果及未覆盖范围见本次收据。原冻结预览的 437 文件和 55 条回读是历史 G4 证据。Muse 独立访问受阻仍单独记证。
- **G4-E 真机/真人音频：DEFERRED_BY_OWNER / NOT_RUN**，将原 Muse BLOCKED_DEVICE、BLOCKED_ACCESS、26 核心 BLOCKED、8 扩展 NOT_RUN 的历史事实保留至最终 UAT。
- **G5 NOT_RUN**：正式 GitHub Pages 仍 FIX15；没有本次新生产部署授权。

**当前接力**按 [本次 W1 发布预检和评审收据](safety-work/w1-checkpoint/w1-release-preflight-20261108.md) 继续。W1-R1 的工件和版本核验已完成，W1-R3 原版提升及回退清单已生成。后续核对独立用例缺口、暂时的数学保存提示及 W1 公网校验触发链，再按适用授权执行 G5。

2026-11-08 方案审核已核对候选 HEAD `713bf698d4c0bc57f7024f00154e11bcb0372e36`、实际构建及旧公网工作流。历史构建输入和 RC/回退工件当前未过期，长期保全任务见总计划 §8。生产提升清单、独立浏览器缺口处置和 G5 尚待实际执行，此次文档提交不构成它们的 PASS。

**G0-X 任务恢复机制已入库**：[实际队列](safety-work/g0x/queue.json) / [工具说明](safety-work/g0x/README.md)。用真实收据标记已完成工作，后续 Work 从 READY 领取并写入断点。仅有状态续跑机制，不具备跨会话无人值守自动重启能力。

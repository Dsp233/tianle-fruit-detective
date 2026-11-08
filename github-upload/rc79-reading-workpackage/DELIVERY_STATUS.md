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

**W1 数学范围纠偏**：原 W1-MATH-SAVE 的 ID/复现历史仍保留，现归入 M 数学维护，不再作为 G5 的直接依赖。新增 W1-MATH-COMPAT 三版本对照、保存安全与风险签收门禁；目前尚未通过，不等于已确认历史缺陷或已同意发布。W1-R2-INDEPENDENT 仍独立阻断正式 G5，生产仍 FIX15。

**2026-11-08 后续发布事务与依赖纠偏**：G0-X 现将 W1-G5 前置改为 W1-MATH-COMPAT、W1-SOFTWARE-ACCEPTANCE、W1-G5-RELEASE-ENVELOPE 和适用 WebKit 证据。旧 Muse 26/8 项的寻源任务 W1-R2-INDEPENDENT 仍 BLOCKED，但不再自动等价于全部软件验收失败；新软件门禁尚未 PASS，也不默认豁免软件缺口。原数学遗留问题仍属 M，不直接强制 W1 修复。Q0 私有评审预览与独立准备任务可并行，G0-B 不等 G0-A 六份完整报告才开始必要风险整改。G5 发布支持文件已纳入隔离 stage 工具及只读 CI 检查，**未取得实际 ZIP 后 staging 的收据、未执行 G5、main 仍 FIX15**。旧 READY.json 保留历史快照以避免触发大型候选重建，不作为现行发布门禁。


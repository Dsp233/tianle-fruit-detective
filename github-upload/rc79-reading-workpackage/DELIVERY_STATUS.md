# W1 当前交付状态（R1.2）

项目级 [MASTER_DELIVERY_PLAN.md](../../docs/engineering/MASTER_DELIVERY_PLAN.md) R2.0；W1 [DELIVERY_PLAN.md](../../docs/engineering/DELIVERY_PLAN.md) R1.2。
**RC_FROZEN / NOT_RELEASED / DEVICE_UAT_DEFERRED**。

- 唯一运行源码 `c8575da9d28c40b5bf79412928a0be8c397e7094`；[CI 42425597193](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193) SUCCESS；工件 `13595790278` ZIP SHA-256 `ad38df5d92fce91898ca57f4cc7a7478fd1c9f5fbe55538b0a94010227cd1cf0`。
- [冻结收据](safety-work/w1-checkpoint/w1-final-rc.md)记录：G1 PASS、G2 PASS、G3 PASS、G4 独立 HTTPS PASS；437 文件部署前一致，55 项部署后授权回读一致。recovery staging SKIPPED，回退复用适用专项证据。
- 私有预览：https://amc8-w1-device-preview.surprisingsheep.chatgpt.site；Muse 无认证访问 403 属 BLOCKED_ACCESS，未完成的浏览器独立实测不得伪称 PASS。
- **G4-E 真机/真人音频：DEFERRED_BY_OWNER / NOT_RUN**，将原 Muse BLOCKED_DEVICE、BLOCKED_ACCESS、26 核心 BLOCKED、8 扩展 NOT_RUN 的历史事实保留至最终 UAT。
- **G5 NOT_RUN**：正式 GitHub Pages 仍 FIX15；没有本次新生产部署授权。

**唯一下一动作**：完成适用非真机发布证据核对并取得独立 G5 授权后，同字节发布并在线核验；随后 G0-B 工程治理 → M → W2 → P/F → 最终 UAT。G0-A 只读审计可立即执行。本次文档变更不重新构建 RC、不启动 M/W2、不修改生产。

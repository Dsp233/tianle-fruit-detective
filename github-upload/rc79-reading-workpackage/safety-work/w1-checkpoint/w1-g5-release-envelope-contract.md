# W1-G5 可部署事务合同与当前状态

**当前：支持文件与 schema 的只读 CI 预检通过；冻结工件尚未在本轮实际 stage；NOT_RELEASED。**

已核对的基础事实：

- 主站固定基线 `23755d3aa9bf9e479468bb24263f81ea8228430e`，当前 GitHub Pages 仍 FIX15；
- 原冻结 W1 运行源码 `c8575da9d28c40b5bf79412928a0be8c397e7094`、原包 ID `13595790278`，原 ZIP SHA256 `ad38df5d92fce91898ca57f4cc7a7478fd1c9f5fbe55538b0a94010227cd1cf0`；
- 独立 runtime allowlist：`9 replace + 28 add + 402 retain = 439`、零删除，且此前 main 的 9 项旧字节已核对；
- 只读 G5 支持闭环 CI：[首轮 PASS](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42445134320)，[验证真实 ZIP 输入约束的新版 PASS](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42445397906)。

**重要区分**：439 项 runtime allowlist 不包括 GitHub main 发布工作流、校验器及 release manifest。本阶段已新增实际 [G5 stage 工具](g5_release_envelope.py)，它在独立目录装配完整事务：固定 FIX15 main 文件作为基础，从校验 SHA256 的真实冻结 ZIP 提取变更文件，验证每个运行文件哈希，将新版 `.github/workflows/rc79-fix15-public.yml`、`public_release.py`、`w1-g5-allowlist.json`、`g5_release_envelope.py` 一起写入 staging，更新 `muse/rc79/manifest.json` 的 W1 来源、工件 ID、清单哈希和入口文件 identity，并留下支持文件 SHA、staging 收据。

stage 只生成候选文件树，不会 push、merge 或部署。新 manifest 的正式部署状态由 G5 公网校验收据判定，stage 收据不可冒充正式上线。

后续正式关闭 `W1-G5-RELEASE-ENVELOPE` 前必须提供：实际冻结 ZIP SHA、生成的 staging receipt 路径、候选/main 固定 SHA、allowlist/manifest SHA、新版 workflow+脚本 SHA，以及回退方案。软件验收 `W1-SOFTWARE-ACCEPTANCE` 与数学归属 `W1-MATH-COMPAT` 独立关闭后，经用户实际发布授权才可执行 G5。

如果 W1 运行源因缺陷修复变更，必须重新冻结并签收新工件、重建受影响 SHA/allowlist 和浏览器证据；不得用原 2026-11-07 冻结 ZIP 的通过记录冒充新版本。

本轮没有修改 production main、没有正式发布和生产回滚操作。

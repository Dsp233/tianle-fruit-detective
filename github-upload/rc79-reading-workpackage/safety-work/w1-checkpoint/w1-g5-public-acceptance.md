# W1 G5 正式上线与公网工程验收

北京时间 2026-11-08，状态 `RELEASED_PENDING_DEVICE_UAT`。实际授权为本次用户确认发布冻结候选 `f935008b75d79cfc44610b197122c01e1b6b9a6e`。生产提交 `7e1b5df76e63abcb45836200dbde4d06e88eaf35`，父提交为 FIX15 `23755d3aa9bf9e479468bb24263f81ea8228430e`。

- 冻结工件 13604511680，ZIP SHA-256 `691e39be468335977f615b4d96497ff81d6b2f38dc7cee6ff0e6f0e44ec00e21`。[既有双引擎 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447571460)、[签收发布预检](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447961063)。批准事务含 48 个变更运行文件、4 个发布支持文件和 manifest，另有 391 个原字节保留路径。没有删除路径。
- [Git 对象装配](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42457079876)只写隔离 staging ref；正式 main 采用预期 FIX15 SHA 快进更新，完整 Git tree `2502374f451357aa7da982a6394eed4cac4877db` 与本地独立装配一致。
- [GitHub Pages 部署](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42457162151)通过。[公网字节 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42457161742)通过，核对 439 个运行路径及发布 manifest。原始 [逐路径收据](w1-public-byte-receipt.json)已入库，来源工件 13607269677。
- [正式站](https://dsp233.github.io/tianle-fruit-detective/) Chrome 独立会话以合成数据实测：首页数学、阅读双入口；在数学选位值和四则后无需刷新即可进入题目 `8+4×2`，提交错答 24，确认首答保留，刷新后继续上次仍可见；阅读第 1 天提交错首答并刷新续做，确认原首答；家长看板 13 套旧诊断按钮齐全，选择第 12 周诊断后仍显示历史记录单列。正式首页无私有评审模式。
- FIX15 软件回退以 `23755d3aa9bf9e479468bb24263f81ea8228430e` 和 [已验回退清单](w1-allowlist-audit.md)为基准。如果需要回退，先保全当前学习记录和故障证据；用新的非强制提交恢复本次发布的路径到固定父版本，保留用户数据；等待 Pages 后再核对 FIX15 线上字节。数据回退继续遵守原合同，不覆盖 W1 新记录。本次未执行生产回退。
- 实体 iPad、真人听音、儿童/家长体验及历史 Muse 34 项缺证留至最终 UAT。

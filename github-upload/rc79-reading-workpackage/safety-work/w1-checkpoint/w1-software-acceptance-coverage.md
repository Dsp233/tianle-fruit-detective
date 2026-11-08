# W1 软件证据覆盖

现行签收见「新候选独立核对」。本节保留原冻结版本历史证据。

绑定冻结源码 `c8575da9d28c40b5bf79412928a0be8c397e7094` 和工件 13595790278。

| 软件用例 | 绑定证据 | 状态 |
|---|---|---|
| 阅读 18 类交互、错首答和续做 | [冻结 Chromium/WebKit](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193/job/128563076962) | 冻结版工程覆盖已通过 |
| 数学首答、草稿、刷新和回退 | [普通数学双浏览器定向](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42392884944/job/128463979678) | 普通数学适用，RTM1 另行判定 |
| RTM1 三版本数学兼容 | [隔离比较 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447148913) | 独立结论记录在 W1-MATH-COMPAT |
| 旧 13 套诊断和迁移 | [冻结双浏览器](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193/job/128563076962) | 冻结版工程覆盖已通过 |
| 独立页面导航、批注不激活学习动作 | [真实 Chromium 预检](w1-release-preflight-20261108.md) | 实际编译的 QA 首页定向证据 |
| 历史 Muse 26 核心与 8 扩展 | [历史证据对照](w1-independent-evidence.md) | 34 项原 ID/步骤仍缺，延期至最终 UAT |
| 真机、听音与儿童体验 | [最终 UAT 归档](w1-ipad-audio-evidence.md) | DEFERRED_BY_OWNER |

保持适用的旧 CI 证据。QA 私有预览的实际执行仅覆盖其收据所列路径。现行 W1 门禁以新候选必要工程证据及无开放发布级 P0/P1 为准。

## 新候选独立核对

新源码 `f935008b75d79cfc44610b197122c01e1b6b9a6e`，工件 13604511680。逐项核对提取运行文件哈希后，在隔离浏览器通过真实应用页面以合成数据执行。

| 用例 | 可观察结果 |
|---|---|
| 数学兼容和导航 | 首页打开数学，选位值和四则，点开始直接进入 `8+4×2`。选 24 提交后显示首次作答已保留。刷新续做，再次显示原首答和选项。 |
| 阅读交互与首答 | 从数学切到阅读第 1 天，选错并提交，返回阅读首页再续做。显示第一次回答已保留，并提供再试。 |
| 旧诊断 | 家长阅读看板实际出现 13 个诊断按钮和旧版标签。 |
| 双引擎完整与定向证据 | [CI 42447571460](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447571460/job/128629630992) 已通过，和本次隔离验收为同一源码。 |

本次核对确认完整与 RTM1 定向双浏览器步骤均 SUCCESS。该次 CI 的独立回退步骤为 SKIPPED，沿用适用的原回退专项和新封包预检。已知 W1 数学 P1 已修复重冻结，原先冻结的读课数据哈希一致。当前 W1 无已知开放发布级 P0/P1。独立 Chrome 为定向软件操作，覆盖表中 Chrome 实操路径，其余必要覆盖见同源双引擎 CI。

按总计划 R2.1 与 G0-X revision 36，Muse 历史 34 项缺失明细、外部签收、实体 iPad、真人听音及儿童体验归最终 UAT（DEFERRED_BY_OWNER / NOT_RUN）。本次软件签收为 PASS。G5 仍需独立明确发布授权及实际部署和公网收据。

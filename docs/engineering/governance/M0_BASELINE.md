# M0 基线签收

以候选 a9f5eea 和生产 7e1b5df 为边界，继承 G0-A/G0-B。

- **构建**。以已验 HOME1 12637348462 的内层 ZIP 和 JSON 解包并校验 8429 个文件，运行原 FIX6→FIX15 及 W1 assemble。原始入口 SHA-256 `463ded01d3d17c9ca6b1b726d973419838643224cb888390ae85a0609fa9a11e` 与冻结包 13604511680 的 rawEntrySha256 一致。app、demo_ui、progress_store、exam_mapping_ui、reading_data、reading_engine、reading_ui 七个源码文件与冻结包逐字节一致。正式静态入口由后续包装产生，沿用 G5 的 440 项回读。
- **权限**。原台账 97 行与 GitHub Actions workflow API 对齐，97 个注册为 active（启用，并非近期运行）。按 job 覆盖 workflow 权限解析，115 个 job 中 36 个至少声明一项写权限，79 个明确只读或无权限。main 与候选各最近 100 条运行中，原台账观察到的运行均属只读组，另观察到 Pages 动态生产部署。原 30 个含写命令的工作流未在该样本中出现，触发限制与主线隔离；手动触发仍须查实，不从匿名 API 推定仓库管理权限。保留历史工作流，M 候选验证显式只读、关闭 checkout 凭据持久化。
- **数据契约**。数学使用 `tianle_amc8_question_design_v1`，阅读使用其 `_reading_r1` 派生键。保留原文及首答、同源 Web Locks/IndexedDB 仲裁，持久化确认后才报告成功并导航。未确认写入可重试或导出，旧页面冲突及配额异常不得覆盖旧内容；降级使用固定版本和隔离 profile。继承普通数学 42392884944、RTM1 双引擎 42447571460、G5 Chrome 刷新读回及 G0-B 反向 Git 树证据。
- **最小治理项**。让 M 从经过归档读回验证的 W1 源快照进入同一编译链，校验外包及源码清单并拒绝不匹配输入。保持存储与生产流程现状，后续按实际变更触发定向验证。

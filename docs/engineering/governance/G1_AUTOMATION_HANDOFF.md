# AMC8 G1 自动验收与受控发布交接（隔离候选）

本增量以 Draft #81 的 `f57070a47ad058365752ed8d90657b1897436539` 为父提交；不会更改数学、阅读、Q0、学习记录或既有产品字节，不会自动批准任何 PR。

## 已落实为代码的能力

1. `.github/workflows/g1-automated-acceptance.yml` 在集成候选分支的 PR 上自动运行只读签收：测试正反拒绝和 GitHub 测试合并双父提交身份，并独立于原生产门禁脚本核查冻结产品树。
2. `code-review/G1/auto_release.py` 使用完整 Git SHA 验证产品字节：G1 版本必须与已签收的 #75 产品树 `1ffdc58e6c748434efba37f1b7b1556156694923` 除明确列出的门禁文件外完全相同；回退只能指向原生产 `05f73af21ddf35134bb7c5e598cd75845e82baf2`。不同产品、数据、伪造 PR 双父、错误 SHA 自动拒绝。
3. `.github/workflows/amc8-controlled-pages.yml` 仅在仓库变量 `AMC8_G1_PAGES_ACTIONS_ENABLED=true` 且默认分支为 main 时工作。生产发布由 GitHub Actions Pages Artifact 提供；发布后从公网校验固定 SHA 回执和首页，异常时自动尝试重新部署冻结的原站。
4. 新增控制文件已列入 `production_gate.py` 的冻结范围；集成后一般 PR 不得私改部署、身份校验及策略文件。

## 一次性生产启用：按以下顺序，不得跳步

1. 独立复核新增代码与测试，验证本 PR 的 GitHub Actions PASS、拒绝路径和构建产物。CI 结论是机器验收，不冒充不同 GitHub 身份的正式 Review。
2. 项目所有者明确批准安全策略的首次安装。**先把 Pages 发布源从 main 根目录切换为 GitHub Actions**，以切断「合并 main 即发布」的历史耦合。切换后先检查现有公网站正常，不在此步骤上传新站。
3. 通过受控 bootstrap 将可信校验脚本、工作流、已接受的 #70–#75 工程成果集成到 main；必须先记录代码产品 SHA、main 新 HEAD 和可逆补丁。首次安装时 main 不存在受信基线脚本，不能假称该次 bootstrap 已受未来的新规则保护。
4. 为 main 配置 GitHub 服务器强制规则：PR 合并、GitHub Actions 来源的真实必需检查 `AMC8 verified production identity`、分支最新、禁止直接提交/强推/删除以及对 `.github/workflows/` 与 `code-review/G1/` 的敏感策略更新实施独立审查或严格路径限制。实际复核合法与恶意改动的服务器合并按钮；不得只相信工作流自己的成功信息。
5. 如希望后续普通 PR 在 CI 通过后自动合并，一次性开启 GitHub `Allow auto-merge`，仅在受保护检查通过后使用；策略文件修改保留高级审批。当前仓库该功能为关闭状态。
6. 完成生产独立校验与 Pages Actions 受控配置后，设置仓库变量 `AMC8_G1_PAGES_ACTIONS_ENABLED=true`。手动触发一次 `AMC8 controlled Pages delivery / release` 作为首个真实发布验收；之后已批准的 main 更新自动运行同一流水线。故障回退尝试成功后还应核对公网恢复并记录实际部署 SHA。
7. 最后才通过受保护 PR 更新 G0-X 的两项剩余 G1 TODO；主分支更新、正式安全规则、发布和真实回退未执行前不能写 PASS。

## 明确不做的事

- 不允许 CI 给自身授权或伪造另一个人工审阅身份；GitHub 规则所要求的真实审批仍须真实有效。
- 不绕过 main 的启动 bootstrap；仓库变量关闭时发布作业必须跳过。
- 不声称 GitHub Actions 的 Jekyll 构建与旧 branch Pages 逐文件相同；首次发布前必须实际检查产物和公网内容。
- 冻结产品身份只适用于本次 G1 候选。日后若修改产品源码或数据，须建立新的经过完整可信构建、浏览器回归和策略签收的版本身份；不能无限复用 #75 的一次性替代构建证据。
- G1 代码签收与 M1 R5 独立题族审核是不同工作，不自动推进 M1/M2/W2。

## 验收等级

- 原 #70–#75 与 #81、#82 证据：按其各自原记录继承。
- 本增量独立自动验收：以实际新 PR Action 状态为准，未运行前记 `NOT_RUN`。
- Pages Actions 自动部署和公网验证：`NOT_RUN`（等待一次性生产授权与配置）。
- 生产自动故障回退：`NOT_RUN`（隔离环境只覆盖逻辑与静态检查，不能冒充生产回退）。

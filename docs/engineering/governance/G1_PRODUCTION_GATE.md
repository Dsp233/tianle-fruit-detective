# AMC8 G1 正式集成候选与门禁交接

基线为 `main` `05f73af21ddf35134bb7c5e598cd75845e82baf2`，G0-X revision 290。隔离集成以 [#75 的 `1ffdc58e`](https://github.com/Dsp233/tianle-fruit-detective/pull/75) 为参照，仅增加三个门禁工程文件，复用 [#73](https://github.com/Dsp233/tianle-fruit-detective/pull/73) 与 [#74](https://github.com/Dsp233/tianle-fruit-detective/pull/74) 原演练的目标分支、规则集和检查名。GitHub 测试合并须对应真实 PR 的两个父提交和精确 Git 树。门禁逐字节比对真实 Git 对象，题库、运行产物、存储代码、历史兼容和工具链锁的未登记差异均被拒。

| 范围 | 已继承的工程证据 |
| --- | --- |
| 原生构建 | [#70](https://github.com/Dsp233/tianle-fruit-detective/pull/70) 与 [#71](https://github.com/Dsp233/tianle-fruit-detective/pull/71) 的冻结候选采用所有者批准的一次性替代验收。两候选各运行两次独立离线检出，同候选的 1,148 和 1,157 个产物分别逐项一致。私有源码托管原生构建仍为 `NOT_RUN`。 |
| 模块与存储 | 六入口共用现行数学、共用启动与存储模块，各入口保留原档案命名空间。对应 #71 相对 `d81259a` 的代码净减 8,385 行。继承 [48 项 Chromium/WebKit 工程验证](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44415373199/job/135194144627)，含旧诊断、历史记录、首答、草稿、配额与并发和浏览器回退。 |
| 质量检测 | [#72](https://github.com/Dsp233/tianle-fruit-detective/pull/72) 冻结输入和输出检查、八项正反用例及阅读双浏览器验证。此批对边界源码、数据和产物保持 #75 对应的 Git 字节。 |
| CI 权限 | [#75](https://github.com/Dsp233/tianle-fruit-detective/pull/75) 将 30 个工作流级写权限收窄到原写入 job，为 53 次只读 checkout 关闭凭据持久化。保留 36 个固定旧分支或受条件约束的写入 job 及原任务行为。[托管 14 项控制](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44642295044/job/135976119210) · [完整触发与权限矩阵](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44642295044/artifacts/14588020049)。 |

## 可验证回退

- 配置前的基线是现行 `main`，安装门禁文件后，`main` 路径从 PR 基线 Git 对象读取校验脚本并拒绝同一 PR 更改三个门禁文件。
- 该版本的正常发布只允许 #75 的完整产品树。回退路径只允许从这一产品树退回 `05f73af` 的完整产品树并保留已安装的门禁文件。此检查接受的只是版本身份，每次生产合并、发布和实际回退仍分别受正式授权与部署接收条件约束。
- 隔离门禁本身可用反向提交撤回。本地验证用合成 Git 合并对象，涵盖正式路径的精确回退和带额外路径改动的拒绝。实际生产回退须在获批的发布路径上另行实证。

## 正式集成与签收前置

1. 独立审阅隔离候选、正反 PR 原始日志、两次原生构建收据、浏览器测试与 #75 权限差异。独立审批与正式集成授权分别记录。
2. 管理员回读 GitHub 默认 Actions 权限及 Pages 发布方式，验证受控写入和回退入口。现行 Pages 历史发布记录继续可用，生产门禁、受控写入和实际生产回退本次均为 `NOT_RUN`。
3. 首次安装需要单独批准的控制文件变更。在尚缺可信基线脚本的 `main` 上，常规检查会拒绝 bootstrap PR。经授权安装可信控制并核对实际分支规则后，再提出产品集成 PR。绑定 GitHub Actions 的检查名只区分来源应用，仍须保护定义该检查的工作流和校验代码。最终方案须由管理员和独立审阅者核对受信工作流或控制文件的审查约束、例外、绕过名单及直接写入拒绝。
4. 更新到新的生产候选时，先审阅并批准更新版本身份及回退参照，再进行独立受控变更。自动化维护与发布证据随实际集成路径归档。

本收据不启动 M1、M2 或 W2。G0-X 只在任务完整验收后走受保护 PR 写回。隔离结果未替代 `G1-CI-LEAST-PRIVILEGE` 和 `G1-QUALITY-GATE` 的仓库或生产签收条件。

## 冻结原站 first-install bootstrap

可审计首装 PR 仅包含 `G1_AUTOMATION_HANDOFF.md` 登记的 9 项受控文件，不合并 #81 的 233 个 main 差异文件。正式站 `index.html` 等运行文件不改。新 `AMC8 trusted bootstrap identity` 只读校验固定真实 main 的第一父、候选第二父及完整可变更路径，首次常规 `AMC8 verified production identity` 因原 main 缺可信脚本预期 FAIL，不得计作合格。首次安装需要项目所有者授权与发布方式先切换，继而为 main 配置正常的生产 required check，并验证强制拒绝。

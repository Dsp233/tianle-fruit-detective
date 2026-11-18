# AMC8 工程验收与衔接

2026-11-19，北京时间。现行 main 为 `05f73af21ddf35134bb7c5e598cd75845e82baf2`。下列工程收据分别绑定已核实的运行候选或历史发布。

| 阶段 | 当前状态与证据 |
| --- | --- |
| G0-A、G0-B、M0 | 原审计和数学准入 **PASS**，沿用 [G0-X 历史记录](https://github.com/Dsp233/tianle-fruit-detective/blob/bb0f4e0c2a16827628cb130afd02654e92a7db49/github-upload/rc79-reading-workpackage/safety-work/g0x/queue.json)。 |
| W1 G1 | 内容与注音 **PASS**，原收据含 336 项独立解题。 |
| W1 G2 | 数据保护和旧版隔离回退 **PASS**。 |
| W1 G3 | 冻结集成 **PASS**，18 类控件和 13 套旧诊断见 [原始集成 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193)。 |
| W1 G4、G4-E | 原私有 HTTPS 预览工程 **PASS**。G4-E 实体设备、听音与历史 Muse 缺证 **DEFERRED_BY_OWNER / NOT_RUN**。[W1 冻结收据](https://github.com/Dsp233/tianle-fruit-detective/blob/bb0f4e0c2a16827628cb130afd02654e92a7db49/github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-final-rc.md) |
| W1 G5、Q0 | 历史发布工程 **PASS**，G5 生产 SHA `7e1b5df76e63abcb45836200dbde4d06e88eaf35`。W1 后续图文修订和独立复验见 [已归档报告](https://github.com/Dsp233/tianle-fruit-detective/blob/05f73af21ddf35134bb7c5e598cd75845e82baf2/reading-quality/joint-acceptance/REPORT.md)。 |
| CR0 | 缺陷复现完成，四类问题有基线反例，原作业的失败保留。[报告](https://github.com/Dsp233/tianle-fruit-detective/pull/54) |
| CR1、CR2、CR3、CR4 | 候选自动验证 **PASS**。依次覆盖 Q0 持久化失败反馈、阅读触发与裁切、旧构建器覆盖、运行时资源完整性。[CR1](https://github.com/Dsp233/tianle-fruit-detective/pull/55) · [CR2](https://github.com/Dsp233/tianle-fruit-detective/pull/57) · [CR3](https://github.com/Dsp233/tianle-fruit-detective/pull/65) · [CR4](https://github.com/Dsp233/tianle-fruit-detective/pull/66) |
| CR5 | 联合工程验证 **PASS**，候选 `4df7c5e5d0c69501a7c0e8df850f9fa0254f23ae`，等待合并及发布授权。[集成及证据](https://github.com/Dsp233/tianle-fruit-detective/pull/67) |
| 长期治理 G1 源码构建及模块边界 | **一次性替代验收通过**。项目所有者批准冻结候选 [#70](https://github.com/Dsp233/tianle-fruit-detective/pull/70) 和 [#71](https://github.com/Dsp233/tianle-fruit-detective/pull/71)，仅对应官方 Node 重锁后的四次离线原生构建和同字节托管双浏览器证据。原私有源码托管原生构建 **NOT_RUN**。四次离线构建在同一执行环境的独立检出中完成，托管环境的私有源码供应未验证。 |
| G1 生产强制门禁 | **BLOCKED**。main 的可见分支规则为空，保护 API 未显示分支受保护。须先完成适用的权限复核及质量检查，再在明确授权后设置和验证 required checks、合并写入限制及回退权限。新候选的自动检查只提供隔离验证。 |

W1 的 Web 发布阶段、长期代码治理 G1 和 iPadOS 原生迁移阶段各有独立的证据。Web 检出、浏览器和发布记录仅用于其签收范围。iPadOS 的原生编译、迁移、语音、交互和手写均无本次执行证据。

## 权限与自动检查

本批仅收敛 W1 阅读和插画的 checkout 凭据，两项 workflow 保留 `contents: read`、触发条件和已有检查。G1 intake 原已关闭凭据持久化。新增隔离 PR 检查只检查上述流程及自身，并检查已签收的生成文件、已登记的 canonical 源和锁。此分支的撤回方式是分别反向提交两处 checkout 改动和隔离检查，保持发布入口不动。

| 变更风险 | 现有适用证据及后续要求 |
| --- | --- |
| 数学、阅读、评审 | 适用的现有 Chromium/WebKit，以及课程身份、13 套旧诊断、Q0 失败和历史数据。若改运行字节，验收绑定新 SHA。 |
| 存储 | 真实首答、草稿、pending、配额、并发锁、升级及回退，使用隔离档案。 |
| 构建、生成物 | 锁定输入，拒绝缺件及错误 SHA，比较两次原生清单和被测公开输入。 |
| 工作流、发布 | 正反权限样本及实际触发，缺适用验证需登记。生产规则、授权 SHA、回退与实际写入属于最终强制门禁。 |

Git 树统计中 main 有 95 个工作流文件、111 个声明 job，#71 重锁基线有 97 个工作流文件、113 个声明 job，该两树各有 36 个声明写权限 job。它们包含不同触发条件的旧候选管线，真实写入需逐条绑定已执行的作业和输出。现有 W1 两条 workflow 的安全修正并未关闭整个 CI 最小权限合同。

## 下游

G0-X 的 M1 独立审核绑定 `c732284e991023398aa9ebec454fcc59901ee90c`，最新结构化记录为 29/84、当前已签收项 ISSUE=0、下一项 `J-D01-01`。旧租约仍挂在该任务；核实原执行者与正式交接证据后，由独立审核方继续。完成 M1 独立签收、适用 W2/P 阶段及 G1 生产门禁后，才进入 P-F。实体设备、真人听音、儿童和家长实际体验仍在正式 F 后 UAT。

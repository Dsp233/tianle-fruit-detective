# AMC8 本轮最终验收与交付报告

2026-11-15（北京时间）｜**STAGE_CLOSEOUT_PASS**。本判定覆盖 W1、Q0 已交付成果的工程验收、M1 冻结候选和未完事项交接。M1 正式发布和项目最终实体 UAT 仍待完成。

核对基线为正式 main `b39ece48917d834e611565432e6cbe7f59ec2edd`、工作分支收口前 HEAD `57c5aab9d576ba68fd94900ebf30aec71401bc0a`、G0-X rev 280。[正式 main](https://github.com/Dsp233/tianle-fruit-detective/commit/b39ece48917d834e611565432e6cbe7f59ec2edd) · [工作分支基线](https://github.com/Dsp233/tianle-fruit-detective/commit/57c5aab9d576ba68fd94900ebf30aec71401bc0a) · [G0-X rev 280](https://github.com/Dsp233/tianle-fruit-detective/blob/57c5aab9d576ba68fd94900ebf30aec71401bc0a/github-upload/rc79-reading-workpackage/safety-work/g0x/queue.json)


## 一、回归最初产品目标

本产品不是把 AMC8 题目数量做大、机械刷分，也不是搭建 AI 开发与治理平台，而是帮助天乐在已有知识基础上应对陌生复杂问题：看懂目标、识别约束、选工具、建关系、独立推理、解释理由并向新情境迁移。阅读应帮助识字、理解题意和数学语言，而不能因为机械、生硬或过长的文字拖慢数学探索。

最低可感知体验：孩子看到有趣、清晰的图/操作任务，在尽量少的成人解释下尝试；回答错误时能知道“错在哪里、为什么”，而非仅看到正确答案；完成一轮后能应用到表面不同的问题。家长能快速发现真实困难、通过页面评审批注导出可执行修改意见。

衡量交付价值以**完整儿童学习场景**为主，不以提交数量、CI 次数、工作流数量、治理文件数量或题库覆盖率代替教学效果。

## 二、最终验收矩阵

| 范围 | 状态 | 核实结果与证据 |
| --- | --- | --- |
| W1 正式发布、阅读与数学兼容 | **PASS** | 84 天、252 核心任务、84 自愿挑战、18 种交互。冻结源 `f935008b75d79cfc44610b197122c01e1b6b9a6e`，正式发布 `7e1b5df76e63abcb45836200dbde4d06e88eaf35`。双引擎 CI、发布预检、Pages 部署和公网字节检查均成功，逐路径收据含 439 个运行路径及发布 manifest。[正式验收](https://github.com/Dsp233/tianle-fruit-detective/blob/57c5aab9d576ba68fd94900ebf30aec71401bc0a/github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g5-public-acceptance.md) · [逐路径收据](https://github.com/Dsp233/tianle-fruit-detective/blob/57c5aab9d576ba68fd94900ebf30aec71401bc0a/github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-public-byte-receipt.json) · [双引擎 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447571460) · [发布预检](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447961063) · [Pages 部署](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42457162151) · [公网校验](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42457161742) |
| Q0 正式首页评审模式 | **PASS** | PR #44 已合并，功能发布 SHA `59c71d4e68edf252fa0842486720bf5db8ccab17`。正式部署、字节校验、候选预检及真实 HTTPS Chromium 签收均成功。当前 Pages 成功部署及公网 Chromium 签收均绑定 `b39ece48917d834e611565432e6cbe7f59ec2edd`。两提交间只变动测试脚本及工作流。[PR #44](https://github.com/Dsp233/tianle-fruit-detective/pull/44) · [候选预检](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43671242829) · [Q0 部署](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43671331096) · [发布字节](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43671331462) · [当前部署](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43671623078) · [公网浏览器](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43671623558) |
| W1 私有 HTTPS 原站复验 | **PASS** | 原址沿用第 4 版 `appgdep_6af0114c161c819183aefa49820d48ca`，托管源 `0632514e742c15359c4ea4ca2d2f69a929a14b72`，原学习包 `c8575da9d28c40b5bf79412928a0be8c397e7094`。既有九项 HTTPS 哈希回读及真实在线批注和导出证据合并签收。本轮核对收据。[原私有预览](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/) · [第 4 版收据](https://github.com/Dsp233/tianle-fruit-detective/blob/57c5aab9d576ba68fd94900ebf30aec71401bc0a/github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/q0-preview-browser-receipt.md) · [Issue #43 关闭说明](https://github.com/Dsp233/tianle-fruit-detective/issues/43#issuecomment-6891850344) |
| 学习数据安全、回滚准备 | **工程证据 PASS** | W1 既有隔离浏览器实测覆盖数学和阅读错首答刷新保留及 13 套旧诊断入口。Q0 仅在原首页注入评审入口，其余 439 项原路径保持字节，批注存入设备浏览器独立键 `tianle_q0_production_review_v1`，导出不包含学习作答正文。Q0 回退按 PR #44 的 revert 回到 W1 发布基线。W1 回退以 FIX15 `23755d3aa9bf9e479468bb24263f81ea8228430e` 和已验路径清单为准，先保全新学习记录，再通过非强制提交恢复受影响文件并核对公网字节。生产回退未执行。[Q0 回退说明](https://github.com/Dsp233/tianle-fruit-detective/pull/44) · [W1 回退清单](https://github.com/Dsp233/tianle-fruit-detective/blob/57c5aab9d576ba68fd94900ebf30aec71401bc0a/github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-allowlist-audit.md) |
| M-DEVELOP 冻结候选 | **PASS** | 候选源 `c732284e991023398aa9ebec454fcc59901ee90c`，隔离候选 CI 成功。现有 ZIP 及其中 `m1/index.html` 的 SHA-256 已独立重算，均与队列账本匹配。当前尚无 M1 正式发布。[候选 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42613486934) · [工件 13671717309](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42613486934/artifacts/13671717309) · [独立审核差异证据](governance/M1_R5_INDEPENDENT_DELTA_C732284.md) |

### 版本与本轮复核证据

正式站 [AMC8 / 天乐水果侦探](https://dsp233.github.io/tianle-fruit-detective/) 在本轮以只读 HTTPS 逐项回读，下列六项 HTTP 200 且 SHA-256 与发布证据一致。当前 main 与 Q0 发布提交的 GitHub 比较仅显示两个测试文件变化。[GitHub 比较](https://github.com/Dsp233/tianle-fruit-detective/compare/59c71d4e68edf252fa0842486720bf5db8ccab17...b39ece48917d834e611565432e6cbe7f59ec2edd)

| 正式路径 | SHA-256 |
| --- | --- |
| `index.html` | `102f0deeed94172bd6550f8abd7668682ca9af1b0cfb830482296697f488e4d1` |
| `review-overlay.js` | `4b094f8f4477c78c7df577828876902449c8e10304ab5db73098c261f1238159` |
| `review-overlay.css` | `0a8ea0bc02d344916eeb38668891a8ff0e0afac659f8aec76355d9dd3cf7432e` |
| `q0-production-identity.json` | `54771c5c855c63cf9310c13ffddc61ec9ca4c7c109b2a80f9822a00763f97343` |
| `academy/index.html` | `727c37add2fc9ababe50a873bb13cc885bd1993a5322a039755e83ff13092313` |
| `amc8/index.html` | `7e9bb2713c8b4b553f72e9e99cda9a6aaa63bea47c26e63fb918843f51bafed9` |

- W1 冻结 ZIP 工件 13604511680，SHA-256 `691e39be468335977f615b4d96497ff81d6b2f38dc7cee6ff0e6f0e44ec00e21`，沿用发布收据。M1 本轮复核 ZIP `7eade14cb504dfbde198c6fe1f19e6022047861e03259ac028b65612cb36133d`、ZIP 内数学入口 `8b0dedbf5de2d665d6a99700b2d8ae8ea053073eb545c37ca702add6aa10b279`。
- 本轮修改范围限定为工作分支中的本报告。在线验证只读取静态文件，未提交学习答案、写入学习存储或部署任何版本。签收证据覆盖既有工程场景，未重新执行儿童真人 UAT。

### 遗留任务交接

| 遗留事项 | 状态 | 恢复位置、条件与风险 |
| --- | --- | --- |
| M1 R5 独立教学审核 | **PENDING，暂停执行** | `semanticReview` 账本为 **29/84 PASS，ISSUE=0，余 55**。精确断点 `J-D01-01`，绑定上述 M1 候选。任务旧 `progress` 文本对应上一候选。恢复时需独立浏览器实测与七维签收，最终发布另有同候选验收及用户授权门禁。 |
| 旧租约与写入隔离 | **BLOCKED，保留原租约** | 对应 owner `r5-reviewer-6Yy315`、租约 `6b303209-b1e1-492f-880a-2d82b165f729`。账本仍显示 ACTIVE，租约已于北京时间 2026-11-15 08:53:02 到期。跨会话恢复缺经验证的隔离证据，本轮没有释放或改写租约。[失联恢复记录](https://github.com/Dsp233/tianle-fruit-detective/blob/57c5aab9d576ba68fd94900ebf30aec71401bc0a/github-upload/rc79-reading-workpackage/safety-work/g0x/r5-orphan-recovery-isolation-20261115.md) |
| App 私钥及 Environment Secret | **BLOCKED，归档** | 专用 App 及 Environment 已建立。现有证据显示未生成 PEM、未创建 `G0X_APP_PRIVATE_KEY`，生产写入规则未启用。已核实浏览器下载的原件无法从终端清理，且现有终端与连接缺少经授权的 Secret 写入通道。本轮不再排障。 |
| 最终实体设备及真人 UAT | **PENDING，G0-X UAT 为 TODO** | 实体 iPad/Safari、真人听音、儿童与家长完整体验及历史 Muse 34 项缺证保留到最终 UAT。W1 独立项历史状态为 `DEFERRED_BY_OWNER`，保留原记录。下一轮形成性观察与最终 UAT 分别记录。 |

Issue #43 已关闭，原阻断描述、后续复验与最终关闭记录均保留。PR #44 已合并，正式 Q0 发布证据保留。[Issue #45](https://github.com/Dsp233/tianle-fruit-detective/issues/45) 已开放，是下一轮唯一执行入口，范围为代表性儿童学习场景的诊断与最小改进。

## 三、本轮结束时的治理决定

1. **停止范围蔓延**：暂停围绕 App PEM、Secret、Orphan Recovery、额外平台/工作流的继续扩建；保留现有记录和未完成事实，不为“治理完成”伪造 PASS。
2. **冻结运行成果**：正式 Pages 以 `b39ece...` 的运行内容为阶段基线。只在有已证实的高严重度缺陷时触发必要回退/修复；所有下一轮想法在开发候选上验证，不能静默改生产或破坏已有学习记录。
3. **隔离未完工作**：M-R5-REVIEW 暂不接管、不发布 M1。后续若获得真正满足原安全条件的写入隔离和停止证据，才按既有规则恢复 `J-D01-01`；29 项已签收保留。
4. **计划收口不等于取消历史质量门禁**：原 MASTER_DELIVERY_PLAN 中最终真实设备 UAT、正式发布授权、学习数据完整性继续有效。下一轮可开展产品发现和非发布原型，不得自动推进 M2/W2。
5. **不再新增执行平台**：以现有 Work、GitHub、CI、Q0 批注为默认工具；无直接产品价值的技术任务不进入下一轮 P0/P1。

## 四、下一轮产品完善：先做少量、高质量、可验证的场景

### P0：真实使用基线与最小问题清单（优先）
- 从已上线的阅读与数学入口中选择 3–5 个代表场景，覆盖“看图理解→尝试→错误反馈→独立解释→变式迁移→保存并返回”完整流程，记录当前操作、视觉与内容的实际问题。
- 在现有正式站或隔离预览以 Q0 添加具体批注，导出 Markdown；由 Work 转化成可验证的产品问题，按严重性和儿童学习价值排序。儿童/家长真实体验作为**形成性研究**，不替代项目最终 F 后 UAT。
- 测量/观察：题意是否不看提示可懂、是否按实际题意作答、是否有正确理由、提示是否有效、变式是否真有迁移、是否愿意继续；不因题目完成率高而直接断言学会。

**完成定义**：3–5 份完整场景审查、按截图/题号定位的问题清单、能用语言讲清楚的优先级和最小修改方案；不要求先开发更多工程系统。

### P1：教学质量深化（最高产品收益）
- **数学**：纠正过于低龄、只换数字或只填空的任务；保留清晰图示和实际操作，让孩子自己辨条件、选策略、解释错因。优先完善真正产生错误认知冲突的反例与跨情境迁移，不以题族数量增长替代深度。
- **中文阅读**：逐条消除生硬、拗口、非自然的中文；缩短一次屏幕的阅读负担，增加故事连贯性和探索兴趣。阅读服务于数学理解，不变成与能力水平不符的文字门槛。
- **交互/审美**：针对现有视觉节奏、任务动线、触控可达性做小范围精修；先保证真实场景，再调整图标与装饰；不得为了新增功能插入破坏原布局的标准 CRUD 面板。
- **反馈闭环**：错误反馈先定位误解，再按需给分层提示；保留首答、帮助记录和已有学习历史。可执行的变式任务应不同于简单改数值。

**完成定义**：至少 3 个高价值代表场景有可体验的改进候选；独立复核数学正确性、可理解性、错因反馈及迁移；不默许版本安全回归。

### P2：小范围验证与择优发布
- 针对 P1 选择的场景做真实浏览器回归、学习数据保护验证及适用的儿童/家长形成性试用。把真实失败转为下轮缺陷，不以自评截图冒充已验证。
- 用户先验收候选体验，再决定是否纳入生产；保留已发布 W1/Q0 及原版本回退能力。若涉及 M1 正式数学发布，仍须另行满足原 M1 R5 与发布门禁，不得由本产品计划绕过。

**完成定义**：有可比较的“改前/改后”真实流程证据、明确修复/保留决定、与发布范围匹配的质量门禁和独立授权。

## 五、下一轮最小执行队列（仅产品计划，不进入 G0-X 租约抢占）

1. **NX-01 体验盘点**：以用户视角审查3–5个完整学习场景，收集 Q0 Markdown 和实际操作问题；不新增功能。
2. **NX-02 教学改稿**：针对实际问题设计数学任务、反例/迁移与中文自然表达的最小修改集；先做可直接体验的样例。
3. **NX-03 交互精修**：以完整用户流程为单位改版，保留既有产品构图、学习记录和数据安全。
4. **NX-04 对照试用与取舍**：对比改前改后学习体验，决定下一轮功能范围和独立发布申请。
5. **M1-R5-PAUSED（独立待办，不阻塞 NX 产品发现）**：保留 29/84 PASS 与候选 SHA；只有旧租约安全接管条件真实满足才恢复余下55题族。

明确排除：新平台、新密钥服务、泛化 Agent 基建、无真实产品问题对应的工作流重构、重做 W1 已通过的验收、扩大题库数量、未经批准启动 M2/W2、提前生产发布。

## 六、阶段收口判定与下一轮入口

**STAGE_CLOSEOUT_PASS**。W1、Q0 已发布范围的工程验收、冻结工件核对、风险边界和遗留交接均已完成。M1 R5、写入隔离、密钥及最终 UAT 的独立状态以本报告矩阵及 G0-X 账本为准。

下一轮唯一入口为 [Issue #45](https://github.com/Dsp233/tianle-fruit-detective/issues/45)。执行范围是学习场景发现及最小改进样例，仍沿用已批准的发布与 UAT 门禁。

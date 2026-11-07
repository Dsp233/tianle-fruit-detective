# W1 当前发布收口状态

> 执行依据：[`docs/engineering/DELIVERY_PLAN.md`](../../docs/engineering/DELIVERY_PLAN.md)，Release Closure **R1.1（2026-11-07）**。本文件只保留可执行缺口、关闭标准和版本证据。**先前完整日志已封存于 [2026-11-07 旧状态记录](DELIVERY_STATUS_HISTORY_20261107_BEFORE_R1_1.md) 与 [2026-11-02 历史记录](DELIVERY_STATUS_HISTORY_20261102.md)**；其中旧“当前”、旧 HEAD、旧 CI 待运行与暂停语句均非当前执行指令。

## 当前基线（不要混淆文档提交 SHA 与运行文件）

- **候选分支 HEAD**：每次从 GitHub `rc79-reading-workpackage-20261101` 实时读取。最近成功的**完整包运行源码**仍为 `a2ebe26290828e8f43945c603332c069db9a349c`。
- **完整候选 CI**：[42384121021](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42384121021) SUCCESS，Chromium/WebKit 打包应用验证 PASS；其中 recovery staging 审计步骤 SKIPPED，不能混记。
- **完整候选 GitHub Artifact**：ID `13579251096`；本会话下载的完整 ZIP 副本 SHA-256 `024159a7e286a0f43a76cdbf1ac576b67146129f61ac447ce5fcebb81d0089f0`（该值对应下载 ZIP **字节**，不是源码 SHA）。
- **部署文件清单**：工件内 `tested-package-inventory.json`，记录原生文件相对路径及逐文件 SHA-256，`sourceCommit=a2ebe262...`，`status=CANDIDATE_NOT_RELEASED`。后续隔离预览及正式站需按该清单对比**运行文件**；版本状态文档改变不代表运行文件改变。
- **页面及数据指纹**：新 UI 文件 SHA-256 `fc5616468273d2bf345265a890b228afd5573b2b1cd3a72aeded3d1bacfe12a2`；课程内容哈希 `71e53b7035d8a7a415473ffe204e95095ec9cb1b7004d75f9c41bb59dd418325`（不同种类指纹不得互换）。
- **已通过可复用定向 CI**：[42382051157](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42382051157) 无 Web Locks 时门禁 FAIL-CLOSED 测试通过；[42382618286](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42382618286) FIX15 已持久化数学草稿回退续做双浏览器通过。
- **候选输入进展**：课程 336/336 已有独立于题库答案的逐题解题证据；全字符语境尚未关。动态 172 处中已验证 66 处，16 处指向课程内容，4 处无汉字注音，86 处待查。台账为 `safety-work/w1-checkpoint/w1-g1-bounded-release-ledger.json`。本地通过定向拼音及旧课精确注音保护检查；生成阅读 JS SHA-256 `e0b3367cdcaffce58f7ae31442f9d6a5db05a944132e9427c1aac50c57a8963c`，生成 UI SHA-256 `3ed3ab3910ce09017565d2223d0ec6f8cdc3d2816be8513617c74b7cec44dca6`。这两个值已写入组装脚本，未替代已测完整包证据。
- **数学适配**：FIX15 锚点已修复，生成 app JS SHA-256 `b642fea0f45a897297c0a6fb09fe3ceabc4d925dc08a974e9c24d56505b30ffb`，GitHub [42391302669](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42391302669) 的 storage 作业通过。[42391576527](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42391576527) 的 Chromium 实际页面点击、关页重开恢复及清空通过，WebKit 等待 load 超时。后续仅重跑组装浏览器作业 [42391993401](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42391993401)，Chromium/WebKit 均通过。相同运行 JS，故复用 storage 和 FIX15 固定回退历史证据；不能由此关闭全部 G2。
- **发布状态**：候选未冻结，G1/G2 未关闭，G4-E BLOCKED/NOT_RUN，G5 NOT_RUN，**正式站仍为 FIX15**；真实独立 HTTPS 预览 URL 尚未生成。纯文档更改不得触发完整 CI；外部包与运行文件是否一致须按清单核验。

## 唯一未关闭项目（逐项按合同结项）

| 项目 ID | 当前状态 | 明确关闭标准 / 下一动作 | 可复用证据 |
|---|---|---|---|
| **G1-CONTENT** | OPEN | 复用台账的 336/336 独立解题证据；仅补题目及图文仍未覆盖的语言和拼音语境；不能凭措辞新增教师资格门槛。只有原合同明确要求的真人审核才列外部 BLOCKED，记录 ID 与验收人。 | 已完成 336 助手初核、挑战题 504 字段/4,008 多音候选检查、2,283 文本/38,249 字词典筛查；旧细节见历史记录 |
| **G1-DYNAMIC** | OPEN | 对 172 个动态调用点分类为已审常量、引用已审题库、涉及语境的可达组合、无需拼音的数字标识；仅补实际剩余的歧义和语境风险，给出关闭证据，不穷举无意义组合。 | 动态调用位置 JSON；闪光板“和为”和量词“只”定向测试；完整候选 CI 42384121021 |
| **G2-S1/S2** | PARTIAL PASS | 已提交原文和已持久化草稿按同题同版本可恢复与继续；只补历史证据没覆盖的适用交互状态。 | CI 42382618286，原文/导出/隔离回退既有 CI |
| **G2-S3/S4** | OPEN | pending 不误报成功/覆盖旧值/静默放弃；未落盘输入确认保存时机、导航保护与强制关闭界限；不可恢复从未写入字节，但不得免除及时落盘义务。 | `safety-work/w1-checkpoint/w1-g2-draft-contract.md` 固定合同、旧事务阻塞和配额验证 |
| **G2-S5** | PARTIAL PASS | 同版旧原文备份、全新隔离 profile 读回及失败保守；禁止未遵循锁的旧页面并发覆盖。 | CI 41398678479、41404695712、42382051157 等，按范围复用 |
| **G3-RC** | OPEN | 所有 G1/G2 必修改动合批后，以**最终运行源码**通过完整 Chromium/WebKit/迁移/包清单验收；失败修相关项再测，最终留一套 PASS 的已测运行文件。 | CI 42384121021 适用于 a2ebe262，文档-only 提交不使其失效 |
| **G4-HOST / G4-IPAD** | BLOCKED | 在独立 HTTPS origin 部署**最终已测文件**并核对哈希；实体 iPad Safari 操作/保存/朗读与真耳听音，同一包绑定证据。可先旧候选预演，不能冒充终版验收。 | 现有 iPad/audio 验收清单；无真实 URL 与实体设备结果 |
| **G5-DEPLOY** | NOT_RUN | 所有原合同门禁通过后，发布**同一组运行字节**至 GitHub Pages，公网核对及 FIX15 回退就绪。 | 无生产部署证据；生产保持 FIX15 |

## Work 立即执行的位置

按照唯一计划 §5，从 `G1-CONTENT/G1-DYNAMIC` 有限剩余项及 `G2-S1` 至 `G2-S5` 状态合同直接关闭，不再复核或重写规划。证据变更只更新相应条目，**已测运行源码 SHA / 构建包 ZIP SHA / 逐文件清单必须分别记录**。G1–G3 合格后冻结唯一 RC；随后同一运行文件完成 G4 独立预览和真机验收，全部通过再 G5。仅改文档不可重跑完整 CI。不启动 M/W2。


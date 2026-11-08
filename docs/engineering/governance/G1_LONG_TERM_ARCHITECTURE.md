# G1 长期架构治理 — 受控开发任务合同

> 建立于 2026-11-08；继承已 PASS 的 G0-A/G0-B/M0，不重做审计。G1 是持续可交付的工程改造，不是新一轮无限期大重构，也不撤销 W1/G5 公网验收。

## 现状与准入依据

- 当前生产 W1 来源 main `7e1b5df76e63abcb45836200dbde4d06e88eaf35`；M-DEVELOP 为持续进行中的独立任务。G1 计划修改不能回写其 ACTIVE 租约、调整 M1 功能合同，不能从尚未签收的 M1 候选宣称已经发布。
- G0-B 仅保证历史 HOME1/FIX15/W1 ZIP 工件可校验恢复，M0 新增 `restore_w1_source.py`；**这仍然需要历史 ZIP**，并非完成源码原生构建。
- G0-A/M0 清查：97 个已启用工作流，115 个 job 中 36 个声明至少一项写权限；30 个包含写入命令属于静态候选，不应未经实证假定全部活跃或任意删除。
- 数学 STORE、阅读派生 STORE、Web Locks/IndexedDB、首答及草稿存在兼容性契约；应优先测试后治理，不以模块拆分为由重置数据或静默迁移。

## G1-CI-LEAST-PRIVILEGE：GitHub Actions 权限收敛

**时序**：G0-B 后可在独立分支、明确工程写入授权下与 M1 并行；不得修改 M1 当前运行作业依赖的工作流并引起竞态。**验收**：
1. 对 97 个 workflow 及 job 的触发器、当前 permissions、GITHUB_TOKEN 使用、checkout 凭据、artifact 和实际下游写入形成可核实权限表；区分启用、近期运行、手动可触发和确有写权限。
2. 逐项确定只读验证、构建、受控部署三类；默认只读，必要写权限精确限定到所需 job/事件，禁用 PR 不可信上下文的越权写入/凭据持久化；部署受授权和预期 SHA 核验。
3. 对真正重复且已验证等价的 workflow 最小合并或限制触发，**不以减少文件数为成功指标**；保留 legacy 验收历史和必需主站检测。
4. 提供前后权限 diff、触发矩阵、失败与成功模拟或 Actions 运行证明，确认 W1 main Pages/回退和 M/W2 候选验证未退化，且可回滚。未持有仓库管理权限时不得声称修改了 Settings/branch protection；列出需要人工批准的差距。

## G1-SOURCE-BUILD：脱离历史 ZIP 的可复现构建

**时序**：M-DEVELOP 候选签收 PASS 后在隔离开发分支实施，避免更改 M1 正在编辑的源/产物。**验收**：
1. 建立 Git 可追溯的 canonical 源码、静态内容、测试依赖、锁定版本及唯一受支持的构建入口；从 **干净 checkout** 不访问历史 HOME1/FIX15/W1 Actions ZIP、私有 draft-release 资产或过期 runner 工件，直接构建完整候选。
2. 将历史 ZIP 降级为归档/对比/回退证据，而非构建所需输入；提供从源码 SHA→构建命令→清单→ZIP→运行资产的机器可验证溯源和 SHA 校验。
3. 在固定工具链的两次独立 clean build 中核实稳定一致的构建输出；若容器元数据可变，要求规范化清单内运行字节完全一致并解释压缩包差异。
4. 与已验 W1 原生产运行文件和 M1 候选进行适用对照；显式保留旧 13 诊断、阅读84天、数学首答/草稿/历史记录与缓存哈希引用，不许把非预期差异当作允许变更。
5. Chromium/WebKit/构建 CI 与回退演练通过；新构建进入生产必须使用已有正式发布门禁，不能直接更新 main。若无法源生复建，记录具体缺项和阻断证据，不虚报 PASS。

## G1-MODULE-BOUNDARIES：模块边界与存储契约

**时序**：G1-SOURCE-BUILD PASS 后实施；先分离耦合点，再按实测风险分批，不做与当前功能无关的全仓改写。**验收**：
1. 提交受支持的架构图/ADR，明确 math、reading、diagnostics、parent、review(QA-only)、common storage、build/release 的公开依赖与禁用跨层引用；至少覆盖 `source/app.js`、`progress_store.js`、`exam_mapping_ui.js`、`reading_*`。
2. 将有实际交叉风险的写入路径统一接入版本化存储契约，隔离教育题目状态、UI 演示状态与持久化确认；不能以抽象封装替代浏览器真实原文读回。
3. 建立强制边界/依赖回归测试及跨版本契约测试，覆盖首答 exactly-once、草稿/刷新、pending、配额、并发锁、旧版回退、旧13诊断，核实数学技能映射和阅读内容身份不漂移。
4. 每批给出差异、定向浏览器回归及可执行回退；外部 iPad/真人音频/儿童家长观察仍在最终 UAT，绝不以缺少真机阻断本阶段软件 CI。

## 依赖与不阻断原则

- `G1-CI-LEAST-PRIVILEGE` ← G0-B；允许获得独立工程授权后并行。
- `G1-SOURCE-BUILD` ← M-DEVELOP + G1-SOURCE-PREP；不得在 M1 ACTIVE 期间重建正在修改的同一源码树。
- `G1-MODULE-BOUNDARIES` ← G1-SOURCE-BUILD；减少变更多处源码造成的重复构建返工。
- `P-F` 最终集成/生产交付前核验三项 G1 PASS，使长期治理不能只留在文档；**M 数学发布、W2 独立代码开发、Q0 预览/发布原有依赖不变**。若具体治理发现新的可隔离 P2/P3，登记后续清偿任务，不无限扩展 G1；确实影响安全/构建的未闭合 P0/P1 记录 BLOCKED 并留独立证据。
- 三项为 `manualGate:true`：本轮授权是**创建计划任务**，不是授权直接修改 CI、跨模块源码或生产站。获得适用工程代码修改授权方可 CLAIM，生产发布还需版本专属授权。
- 全部 Muse 历史 34 项、实体 iPad、真人听音与儿童家长验收仍属于 F 后最终 UAT，不得回流成 G1、M、W2 阻断。

## 交付文件与验收记录

按任务各出 `docs/engineering/governance/G1_CI_PERMISSION_RECEIPT.md`、`G1_NATIVE_BUILD_RECEIPT.md`、`G1_MODULE_CONTRACT_RECEIPT.md`（或有明确映射的实际证据路径）；每项附原始源/运行 SHA、CI 证据、差异、回退步骤及风险关闭情况。仅有文档/空白 CI 不是 PASS。引用已有 G0/M0 证据避免重复审计。


## 时序与质量闭环补强（2026-11-08 追加，优先于上文原时序表述）

### G1-SOURCE-PREP：原生构建可提前准备

在 M1 仍 ACTIVE 时完成只读依赖表、Git canonical 源列表与历史 ZIP/overlay 每一项构建来源的替代路径，识别缺失版权素材、运行资产、工具链版本、旧缓存路径及未覆盖端到端入口。提交迁移操作规程和两次独立 clean checkout 可复现试验设计。**未取得完整源、未成功执行 clean build 时不得记录 `G1-SOURCE-BUILD` PASS**。该准备任务依赖 G0-B/M0-BASELINE，而最终原生构建实施仍受 M1 PASS 门禁控制。

### G1-QUALITY-FOUNDATION：持续检测基础先行

以独立授权的工程候选实现可运行的检查器和适用测试矩阵：源码依赖 allowlist、运行生成物禁止手工编辑、存储契约/首答/草稿回归清单、CI 工作流触发与权限检查、发布清单身份及回退收据。提供一组合法变更通过和故意违规变更失败的自动化测试，并明确边界检查的覆盖范围和例外审查方式。不能假定此时已接入所有实际部署，也不能更改活跃 M1 正在编辑的共享文件。

### G1-QUALITY-GATE：在最终软件集成前形成不可静默绕过的门禁

门禁依赖 `G1-QUALITY-FOUNDATION`、`G1-CI-LEAST-PRIVILEGE`、`G1-MODULE-BOUNDARIES`，在完成原生构建/模块治理后升级检查器并配置生产相关 required checks 或等效受控写入机制。强制验证：

1. **源与模块边界**：生成产物不允许替代 Git canonical 源、禁止未经声明的跨模块导入；故意违规测试必须使受保护的合并/发布路径失败。
2. **构建与运行字节**：受控 clean checkout 二次可复现、锁定依赖、manifest/来源 SHA 一致、历史诊断资源不丢失；构建被阻断时不得误标为可发布。
3. **存储与功能回归**：触碰 math/reading/store/schema 时按风险矩阵强制执行 Chromium/WebKit、原始首答、草稿、pending、配额、并发、旧记录、回退和13旧诊断的适用实测，不用空/skip 测试满足门禁。
4. **权限与发布**：候选 CI 只读，生产写入限制于明确批准流程，验证预期 SHA、权限和回退。验证有效 ruleset/branch protection 的实际要求、可见状态与不能被普通提交绕过的证明。仓库管理员无法配置时明确 BLOCKED/NEEDS_ADMIN，不可把纯 CI 成功当作不可绕过的策略。
5. **持续有效性**：至少正反两个真实执行样本、完整覆盖矩阵、owner/例外机制、规则版本和回退脚本；若适用规则不能用于 Pages，明确由受控发布任务补充保护。

新增工程任务不改变 M/W2/Q0 的功能授权或正式生产发布授权。外部真机真人 UAT 延期规则保持不变。

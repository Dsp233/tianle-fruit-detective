# AMC8 CR0 · 真实代码评审与缺陷复现

日期：2026-11-17（北京时间）。范围：CR-V2.0 的 CR0；不含 CR1 修复或发布授权。

审查基线：`05f73af21ddf35134bb7c5e598cd75845e82baf2`，开始时从 GitHub 查询的最新 main。测试直接启动这一提交的独立 worktree，不用历史 ZIP，不把测试分支当成产品候选。

PR：[#54](https://github.com/Dsp233/tianle-fruit-detective/pull/54)，独立分支 `codex/cr0-real-code-review`，保持 Draft。测试提交与最终证据运行见 [RUNS.md](RUNS.md)。所有行号均对应上述基线；解压源码的行号另作明确标识。

## 结论与优先级

| Finding | 最终判断 | 级别 | 最小处理方向 |
| --- | --- | --- | --- |
| CR-001 | Q0 持久化失败被成功提示覆盖；新增、修改、状态和删除四条编辑器路径需要修复 | P1 | 以持久化结果决定提示，保留可导出的待保存意见，明确重试 |
| CR-003 | 阅读质量检查存在真实触发缺口；并非所有 W1 检查都失效 | P1，工程门禁 | 阅读独立变更也必须进入适用的当前版本检查；保留故障注入反例 |
| CR-002 | 当前正式插画构建可复现；旧阅读构建入口会覆盖最新入口，已有 release 校验能拒绝该输出 | P2，降低原初步等级 | 先防止误用旧写入入口，保留有效的确定性构建，不盲改 BASE |
| CR-004 | 运行时完整性缺口：manifest 不匹配但有效的资源仍可被采用；不等同于已发生线上篡改 | P2 | 如进入 CR4，再加解压后校验及兼容/失败恢复；先评估时延 |

没有确认新增 P0。没有把“可能发生”写成“线上已经发生”。CR0 不修复，所以修复后同例、修复回归和正式发布均为 **NOT_RUN**。下列动态结论以完整日志中的对应记录为准，具体数量和失败返回码见 RUNS.md。

## 运行方式与证据等级

```bash
git clone https://github.com/Dsp233/tianle-fruit-detective.git
cd tianle-fruit-detective
git switch codex/cr0-real-code-review
python -m pip install playwright==1.57.0 PyYAML==6.0.3
python -m playwright install --with-deps chromium webkit
python code-review/CR0/reproduce.py
```

脚本默认固定审查 `05f73af`。退出 **1** 表示已执行的产品契约违反，退出 **2** 表示测试脚本或环境错误，退出 **0** 才表示所执行的契约均通过。本专项预期看到修复前的红测试，不能把红灯解释成修复完成，也不能把“成功复现”写成产品 PASS。只运行构建可加 `--build-only`，只运行浏览器可加 `--browser-only`。

每次创建临时 detached worktree，结束后删除这些测试副本。修改样式、图片、构建输出只发生在这些副本；错包仅由隔离浏览器的请求拦截器提供。每个 Q0 用例都是新建合成浏览器档案，没有连接真实用户档案或生产域名。

- [reproduce.py](reproduce.py)：可执行复现和正常/异常对照，不复制 Q0 存储函数来伪造行为。
- [evidence/source-excerpts.txt](evidence/source-excerpts.txt)：基线的文件、物理行号和原文。
- [evidence/runtime-inventory.json](evidence/runtime-inventory.json)：入口所引用的 29 个必需数据/脚本包的 SHA-256、分片和解压大小。
- [evidence/runtime-excerpts.txt](evidence/runtime-excerpts.txt)：解压后关键存储/答题调用链。
- [evidence/workflow-inventory.json](evidence/workflow-inventory.json)：基线 95 份 workflow 的触发及权限清单，不改变或清理历史 workflow。
- [evidence/reused-runtime-identity.json](evidence/reused-runtime-identity.json)：继承 W1 证据的字节同一性依据。

## CR-001：Q0 保存失败后提示成功

**状态：动态复现；P1；高置信度。** 影响是批注或编辑未落盘却获得成功反馈，用户刷新后丢失新批注或看到旧状态，不是数学/阅读学习记录被清空。

**源码**：[`review-overlay.js:87`](https://github.com/Dsp233/tianle-fruit-detective/blob/05f73af21ddf35134bb7c5e598cd75845e82baf2/review-overlay.js#L87)（`persist`），`:352–361`（`save`），`:435–436`（编辑器状态/删除），`:384–385`（清单操作，静态补查）。命名空间在 `:41`，正式站为 `tianle_q0_production_review_v1`。

**调用链**：用户确认选框 → `openEditor` → form submit → `save` → 修改内存 `notes` → `persist` → `localStorage.setItem` 抛出异常 → catch 通知失败并返回 false → 调用者忽略 false、关闭窗口 → 再通知成功。状态与删除的编辑器事件有相同结果忽略问题。

**失败输入**：仅对上述 Q0 key 的 `Storage.prototype.setItem` 抛出真正的 `DOMException('CR0 synthetic quota','QuotaExceededError')`。其余 key 调用原生写入。修改、状态、删除使用一条合成原始批注；新增使用没有批注的档案。

**期望**：不能宣称已落盘；明确显示未保存，保留待保存内容可导出/重试；失败不覆盖持久化旧内容。删除/状态切换也必须区分当前内存状态与持久化结果。

**实际**：

| 操作 | 写失败后的提示 | 刷新后的实际状态 |
| --- | --- | --- |
| 新增 | 意见已保存，可在评审清单中编辑或导出。 | 内存 1 条，刷新 0 条 |
| 修改 | 同上 | 恢复原批注文本 |
| 标为已处理 | 意见状态已更新。 | 仍为待处理 |
| 删除 | 意见已删除。 | 原批注重新出现 |

清单内确实还有“未持久化，请立即导出”警示；因此准确根因是**顶层成功提示覆盖失败提示，并非完全没有任何错误提示**。新增和修改在刷新前仍可通过 Markdown 导出抢救。删除失败后本页导出中已经没有该意见，磁盘仍有它。

**复现步骤**：运行脚本的 `review_cases`；新建档案 → 注入两个学习 key 哨兵 → 进入首页 → 注入 Q0 单 key 配额故障 → 执行上述四类操作 → 记录状态文本、原生存储和警示 → 下载实际 Markdown → 刷新并检查列表。每一类都有不注入异常的正常对照；每次核实两个学习 key 字节不变。测试记录名为 `CR-001-<engine>-<action>-quota/control`。

**最小修复建议（未执行）**：所有 Q0 持久化调用都消费结果；成功前不发布成功语义。对新增/编辑保留可重试的草稿；删除失败至少保留可撤销/重新导出的原意见或明确待删除状态。避免把再次保存同一草稿变成重复新增。不要只删除一条成功文案而遗留状态/删除路径。对清单按钮、元数据编辑、显示开关的其他 `persist()` 调用也做同一结果处理，CR1 应补足这些路径的定向测试。

**影响/回退**：只触及 Q0 交互与保存状态；不能换 key、迁移/清理学习存储或改变已保存批注结构。保持 Markdown 可导出。CR1 必须证明同一故障用例红转绿；目前修复后测试 **NOT_RUN**。

## CR-003：有 release.json 时阅读变更可漏掉布局检查

**状态：动态故障注入 + 已有 GitHub 真实执行记录；P1 工程门禁；高置信度。** 不宣称当前正常页面已经有注入的 2000px 宽度问题。

**源码**：[`w1-reading-quality.yml:5`](https://github.com/Dsp233/tianle-fruit-detective/blob/05f73af21ddf35134bb7c5e598cd75845e82baf2/.github/workflows/w1-reading-quality.yml#L5) 和 `:8`（触发），`:25–51`（Identify + 各检查条件）；[`w1-illustration.yml:8`](https://github.com/Dsp233/tianle-fruit-detective/blob/05f73af21ddf35134bb7c5e598cd75845e82baf2/.github/workflows/w1-illustration.yml#L8)（另一工作流的触发）；`reading-art/browser.py:72–84`（插画工作流会进一步调用 `reading-quality/browser.py --joint` 和 `check.py --joint`）。

**调用链**：阅读 CSS 变更命中 quality 的 PR paths → `Identify the release type` 执行 `reading-art/build.py --verify-release` → 已有 release 文件使 `art=true` → quality 的静态、浏览器及取证步骤被跳过。插画 workflow 的 paths 没有这类 CSS 变更，故没有补位。release 构建校验检查其输出和图片，不验证这个既有 CSS 文件的字节。

**失败输入**：当前首页引用的 `assets/reading-quality/69a1a2f4f8ee79886bbffa30a8e8beb3987cd8084e530abd30e8a393cd34aaa4.css` 末尾添加 `.rd-story-text{width:2000px!important}`，仅存在于临时 worktree。manifest 保持不变，模拟已引用静态样式被意外改坏。

**期望**：适用的阅读布局/资源完整性检查应失败并阻止接受该变更。

**实测方法**：先在浏览器启动原始 main，记录 390px 视窗的文档/正文宽度；修改临时 CSS，再次新建浏览器档案并进入第 1 天，记录正文宽度以及横向落在视窗外的汉字数量（外层裁切可能让 document.scrollWidth 不变）。同时解析真实 YAML 的 PR paths，直接执行从该 YAML 读出的原始 Identify shell block，记录 exit、`GITHUB_OUTPUT` 和被跳过的步骤。两引擎实测一致：正文由 336px 变为 2000px，31 个汉字落在视窗外，而 Identify 仍 exit 0、输出 art=true。原始值见 `results.json` 的 `CR-003-<engine>-layout-fault-gate`。

**对照**：只在临时插画 WebP 后追加 `CR0` 字节，当前 `reading-art/build.py --verify-release` 必须非零退出；插画路径确实匹配 illustration workflow。这个反例证明现有插画字节校验有效，不能把它描述成全局失效。

**已有真实 CI 证据**：[main run 43974460509](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43974460509) 显示 Identify 成功，阅读规则、Chromium/WebKit 布局及证据上传步骤全部 `skipped`；原始 job 状态已保存于 `evidence/main-quality-job.json`。同一 main 的插画工作流 [43974460569](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/43974460569) 已成功，保留这项有效 W1 证据。

**证据边界**：本次没有创建包含真实产品 CSS/图片改动的两个故障 PR；它们违反“只新增测试与证据”的变更边界。实际故障发生在 CR0 GitHub job 内的隔离 worktree；paths 由测试按这几份实际 YAML 所用的正向模式匹配，shell 为原始内容。未运行 GitHub 服务端的两份故障 PR 触发实验，明确为 **NOT_RUN**，不将本地触发矩阵冒充 GitHub 服务端判断。

**最小修复建议（未执行）**：让阅读独立变更调用适用于当前 release 的 joint 检查，或者扩展共享检查的触发范围。不能简单删除 `art != true` 就调用旧 `reading-quality/check.py` 默认模式：后者面向旧基线且会调用旧构建器，可能误回退入口。CI 修复应包含 CSS 独立变更、插画独立变更、二者同时变更的真实正反向门禁验证；修复后 **NOT_RUN**。

## CR-002：历史 BASE 与当前构建回退风险

**状态：旧入口的覆盖行为已复现；“当前正式构建不能复现”被本次实验否定。P2，非当前发布事故。**

**源码**：[`reading-quality/build.py:8`](https://github.com/Dsp233/tianle-fruit-detective/blob/05f73af21ddf35134bb7c5e598cd75845e82baf2/reading-quality/build.py#L8) 固定 `b39ece48917d834e611565432e6cbe7f59ec2edd`，`:10–17` 使用 `git show` 还原原始阅读包，`:98–105` 从历史 HTML 写三个入口；`reading-art/build.py:12` 固定 `2c997d120b93622929ff241a2adbad8e35de7e84`，`:123–143` 从 Git 还原并按 verify 标志比较/写入，`:235–321` 叠加当前插画、语言与词义提示后生成当前 release。

**失败输入/调用链**：最新 main 的干净 worktree → 直接运行仍可用的 `python reading-quality/build.py` → 旧 `raw(path)` → 只加旧版语言/layout 增量 → 写 `index.html`、`amc8/index.html`、`source/index.html` → exit 0。

**期望**：在已有较新 release 时拒绝不兼容的历史写入入口，或仅写隔离输出目录；不能让调用者把 exit 0 误认为生成了当前正式版本。

**实际**：当前阅读运行包 `7c9ab43332d698ef3971bf52495fef4369f2ca87ef126d3239fb10e5f8796116` 被改为 `37e882402a61ac728f3909bced825af82940c1fbb30d5ce18dafcb08ed7f464e`，解压后不再有 `storyArtByMaterial` 和 `dayOneVocabulary`。三个入口发生修改。随后运行正式 `reading-art/build.py --verify-release` 返回 1，确实拦截了不一致输出。

**正常对照**：两个独立干净 checkout 各运行 `python reading-art/build.py`，95 个 manifest 文件都与 main 字节一致，彼此一致，`git diff --name-only` 为空。这个结果说明固定历史 BASE 本身可以是有效的确定性构建输入，不是自动成立的缺陷。没有使用历史 ZIP，也没有更改 BASE。

**日志/复现**：`reproduce.py --build-only`；`CR-002-art-clean-1.log`、`-2.log`、`CR-002-historical-quality-build.log`、`CR-002-after-old-build-gate.log`。本机和 GitHub runner 均执行构建实验；最终完整证据以 GitHub test SHA 为准。

**最小建议（未执行）**：保留当前可复现的 art 构建；给旧 quality 写入口加显式版本/输出目录保护或明确弃用，防止误运行成功覆盖入口。后续 CR3 才讨论 canonical 源的演进；不要用 BASE=HEAD 造成自引用或把重构塞入 CR1。对正式站已经发布回退、学习数据受损的假设，没有证据，标记 **未确认**。

## CR-004：解压后资源不匹配仍被执行/采用

**状态：运行行为动态确认；P2 完整性防护缺口。没有证明线上发生过错包、攻击或数据损坏。**

**源码**：实际首页 [`index.html:257`](https://github.com/Dsp233/tianle-fruit-detective/blob/05f73af21ddf35134bb7c5e598cd75845e82baf2/index.html#L257) 的 `readPacket`，`:241` 的 `chunk`，`:270` 的 `loadData`，`:299–328` 的 blob 脚本注入/顺序加载。历史来源 `github-upload/loading-r2/loader.js:72–84` 也有相同缺口，但它与正式 inline loader 不完全相同，本结论和测试以 `index.html` 为准。

**调用链**：首页阅读点击 → `readingAction` → `reading` → `loadData`/`loadScripts` → `readPacket` → `Promise.all(parts.map(chunk))` → 拼接 gzip 字节 → `pako.ungzip` → JSON 解析/返回 JS 文本 → 写全局数据或 blob script 执行。`packet.id` 只作 Map 缓存 key；没有比较解压后 SHA-256 或 UTF-8 bytes。

**失败输入**：在浏览器 route 中拦截原始阅读分片路径并提供替代 gzip。JSON fixture 将材料标题第一个汉字替换为另一同字节长度汉字，确保解压后长度与声明一致但 hash 不同；JS fixture 在完整原运行包末尾追加无害的 `window.__CR0_PACKET_EXECUTED=true`，hash 和长度均与声明不同。没有改首页 manifest，也不请求正式域名。

**期望/实际**：若 manifest 是执行完整性契约，两个有效 gzip fixture 都应在采用前拒绝；实际可初始化阅读，替代 JSON 值被采用，替代 JS 标记被执行。坏 gzip 对照触发现有“重试加载”错误界面，证明当前并非毫无格式检查。每一例记录声明/实际 hash、bytes 和 accepted。

**影响边界**：可确认“解压成功≠与 manifest 一致”；不能据此宣称网络能任意篡改 HTTPS 或 checksum 能抵御同时控制 manifest 的攻击者。当前未注入的 29 个必需包经离线 SHA 校验均正确。正常 gzip 的错误检测、构建验收与 HTTPS 是既有保护；是否增加运行时校验应由 CR4 独立决策，而不是阻塞 CR1。

**最小建议（未执行）**：在 JSON/JS 采用前对解压后 UTF-8 字节进行长度和摘要核对；校验失败不得注入脚本，提供明确失败/重试并正确失效关联缓存。需要验证旧 Safari 的兼容方式和低端弱网启动开销。不得以加 hash 为由更改学习 schema、课程包内容或清理本地存储。校验开销、Safari 回退和修复后的错误恢复 **NOT_RUN**。

## 进一步的关键用户路径审查与证据复用

当前阅读脚本解压 hash 为 `7c9ab433…96116`；数学最后一包为 `63c3d98a…31bc8d4`。完整 hash/paths 在 runtime inventory 中。以下是实际运行源码的路径审查，不是把历史测试名当作本次执行成功。

| 路径 | 实际追踪 | 本次结论与限度 |
| --- | --- | --- |
| 阅读输入、首答、草稿 | 解压阅读脚本 `select:483–484` → `submit:498–501` → `append:394` → `persist:379–392` → `ProgressStore.commit:26` / `flushFallback:81–119` → `writeNow:20–24` | 可见原始首答事件追加与写入状态/草稿导出逻辑；没有仅凭 `submit` 返回答题结果就推断已安全落盘 |
| 阅读异常显示与恢复 | `ProgressStore` 状态回调、engine `backup:626–630`，runtime `renderPage:1355` 和 `rdRetrySave:1407` | 源码区分 acquiring/unsaved/conflict/read_only；未确认新的 P0/P1。未重跑 W1 全量首答/迁移验收 |
| 数学首答和未提交草稿 | 解压 math 第 11 包 `check:517` → `recordAttempt:209–232` → `persist:183–185`；`confirmPersistedJoint:25–31`；`progressSnapshot:187–191` | 追踪 pendingSave 与已落盘内容确认、备份中的未提交草稿；未修改数学，未接管 M1 |
| 数学并发写入 | adapter `transactional:true,guardWebLock:true`；共享 ProgressStore 的 Web Locks + IndexedDB 路径；离开页面守卫 `:900–910` | 静态审查和已有存储证据复用；本次没有声称完成新的全部竞态排列测试 |
| 加载异常 | 实际 inline loader 的网络 25s 超时、两次请求尝试、分片 Map/packet Map 失败处理、顺序脚本注入、intent 路由取消 | 动态仅执行 CR-004 的有效错包与坏 gzip 对照；离线、超时、所有并发/缓存组合 **NOT_RUN** |
| 构建/CI | 95 份基线 workflow 按触发、权限及相关入口分流；仅 3 份有 main PR 触发，关键分支见 CR-003 | 未删除历史流程；Pages 是既有独立部署事件，本次 CR0 workflow 无 pages 权限、无部署步骤、无 workflow_run 下游 |

与已验 W1 基线 `f8e791e6cc5c62769b1c356723a4da67da05ce45` 对比，数学配置完全一致；阅读 runtime 的 engine/storage/grading/speech 前缀 **106,461 bytes** 完全一致，SHA-256 `317c4591b74200890173db74fd41ef659441cf779687f90a07fade226d282716`。因此继承 [W1 联合验收报告](../../reading-quality/joint-acceptance/REPORT.md) 及其真实 CI/浏览器证据；不重复 84 天、252 格、336 题审核。既有正确内容没有作为新缺陷被返工。

本次没有验证实体 iPad/儿童体验/真实朗读听感；没有用 W1 的成功记录替代 CR-001 的故障注入；没有把有限关键路径审查称为全仓无缺陷证明。真实学习档案没有接入、读取或清理。

## 人工停机与下一阶段

CR0 到此停止。建议顺序：**CR1：CR-001 存储保护** → 人工复核 → **CR2：CR-003 门禁覆盖**；CR-002 的入口保护和 CR-004 的完整性校验随后按收益决定。不能自动进入任一阶段。

下一阶段模型比较、证据限制、实际返工记录和可复制 Work 提示词见 [NEXT_WORK.md](NEXT_WORK.md)。PR 不合并；正式运行代码没有修改；没有重新部署正式站。

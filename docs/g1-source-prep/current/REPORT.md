# AMC8 G1-SOURCE-PREP 当前版本增量补齐

核对日 2026-11-17（北京时间）。本收据接续原 G1-SOURCE-PREP，不改变任务队列状态。

| 基线 | 固定提交与证据 |
|---|---|
| 当前生产分支 main | `05f73af21ddf35134bb7c5e598cd75845e82baf2` |
| CR5 候选 | `4df7c5e5d0c69501a7c0e8df850f9fa0254f23ae`，[Draft #67](https://github.com/Dsp233/tianle-fruit-detective/pull/67)，未合并 |
| G1-DELTA | `d05ec19036f6968c40c3840d02b705c9691120ef`，[Draft #68](https://github.com/Dsp233/tianle-fruit-detective/pull/68)，未合并 |
| 治理合同、准备与队列 | `bb0f4e0c2a16827628cb130afd02654e92a7db49`，历史分支 `rc79-reading-workpackage-20261101`，[合同与原准备](https://github.com/Dsp233/tianle-fruit-detective/tree/bb0f4e0c2a16827628cb130afd02654e92a7db49/docs/engineering/governance) |
| 冻结 W1 源码包 | `sourceCommit=f935008b75d79cfc44610b197122c01e1b6b9a6e`，Actions artifact `13604511680`，整包 SHA-256 `691e39be468335977f615b4d96497ff81d6b2f38dc7cee6ff0e6f0e44ec00e21` |

**结论。** 当前静态站可直接从 Git 的发布字节提供服务。现有 Git 阅读构建可从固定 Git 历史生成阅读增量。完整数学、旧诊断及全站打包仍无已验的 Git 原生链。当前收据已绑定现有构建输入及缺口，可作为迁移批次的起点。完整传递依赖、逐素材发布许可和两次全站原生构建仍待关闭。

## 输入登记与覆盖程度

下载冻结包并核对整包 SHA-256、清单成员集合及所读取成员 SHA-256。用 `blob <字节数>\0<原字节>` 比较四个 Git 树的完整 blob ID。清单中有 8,920 个成员。由真实 `source/build.py` 模板替换和静态读入、`exam_runtime_index.json` 的 `inputFiles`、`build_reading.py` 的输入，以及明确的存储和回读文件形成 [263 路径逐项索引](INPUTS.tsv)。[机器回执](COVERAGE.json) 保留各覆盖分母、匹配数和精确来源。分组相互重叠，不能相加。路径无需公开复制的源材料可由固定工件的包内 `tested-package-inventory.json` 与 `source/exam_runtime_index.json` 按路径及 SHA-256 联结。

[Git 输入及产物索引](GIT_INPUTS.tsv) 单独登记 173 项引用，包含精确 Git 提交、blob、分类、消费者及许可状态。它覆盖当前阅读增量、三个首页入口、学院和 QA、全部首页分片与 84 张现行 WebP，以及历史打包器和 M1 补丁。详细实施指令见 [下一阶段 Work 提示词](NEXT_WORK.md)。

| 度量 | 当前证据 |
|---|---|
| 首页 packet 路径 | main 与 #67 清单对象相同，47/47 路径在各自 Git 树存在。数学必需 16 数据包/26 路径、11 脚本包/11 路径，另有 1 可选数据包/2 路径。39 个数学路径和冻结 W1 对应成员逐字节一致。阅读 1 数据包/6 路径、1 脚本包/2 路径，八个均来自后续 W1 变更。 |
| CR5 阅读增量 | 95/95 发布清单路径在 Git，84 WebP、8 JSON 分片、3 HTML。继承 #67 两次 clean checkout 和真实 PR 回执，仅作为阅读增量范围的字节证据。[CR5 原始运行](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44036728943) |
| 冻结编译器直接路径 | 201/201 在 W1 包内已验哈希，当前 main/#67 各 15 项有同字节 Git blob。含编译器及部分被读回的生成物。 |
| 题库编译器已声明 content 指纹 | 7,710/7,710 在包内读回并匹配 `exam_runtime_index.json` 声明哈希；当前 main/#67 中 288 有同字节 Git blob（226 child figures、62 imported assets），7,422 无同字节 Git blob。当前实现会哈希整个 content 树，删除证据文件可改变构建身份，即使题面不变。 |
| 阅读编译器定向路径 | 16/16 在包内，main/#67 各 1 个同字节匹配（统计含依赖许可和锁定文件）。该数字不包含已在 Git 的当前阅读增量输入。 |
| 完整正式站 canonical 闭包 | 未证明。首页路径存在性、局部编译闭包及工件中所有成员属于不同分母。没有运行完整无归档构建或当前浏览器矩阵。 |

## 当前各部分的来源与消费者

| 部分 | 权威输入候选、来源与消费者 | 分类、许可和缺口 |
|---|---|---|
| 首页及兼容入口 | 冻结 `source/index.template.html`、`home_portal.js/.css`、`style.css`、`version.json` → `source/build.py` → 历史 LOAD1 `github-upload/loading-r1/package.py`、LOAD2 `github-upload/loading-r2/upgrade.py`；当前 `index.html`、`amc8/index.html`、`source/index.html` 再叠加 Git 阅读增量与正式 Q0。`assets/loading-r1/` 的首页图、CSS 为现行可复制发布字节。 | 旧模板与代码按 W1 包读取，历史 packer 是恢复配方，三个 HTML/哈希资源是生成物。需一次性确认各 packer 源 SHA 到现行入口的真实差异与完整映射，不能选旧 loader 替代当前入口。首页图原始出处和授权待核。 |
| 数学运行时与生成输入 | W1 `app.js`、`curriculum_ui.js`、`staged_ui.js`、`demo_ui.js`、`joint_families.json`、`skills.json`、`curriculum.json`、`knowledge_graph.json` 以及各模板注入脚本由 `source/build.py` 消费。现行 `assets/loading-r2/` 数学包是可核验的生成产物。M1 的 14 文件补丁是另一个候选来源，详见下段。 | 项目历史来源可追溯。须确认 canonical 的组装树和每项输入的授权范围。数学不能用解压后的生产 JS 代替编辑源，亦不能用 M1 产物替换现行批准的数学。 |
| 题库、映射与题图 | W1 `source/compile_exam_mapping.py`、`exam_content_batches.py`、`source/content/{exam_problems,judgments,solution_routes,training_bindings,training_tasks,transfer_sets,reviews,schemas,source_evidence,imported_*}`、`docs/exam-review-ledger.csv` → 编译器 → `exam_runtime_index.json`、catalog、source registry/supply 与运行投影。`child_form_reviews.json` 驱动 `source/content/{imported_assets,child_figures}` PNG 读取。 | 逐目录数量见机器回执。若文件又由编译器写出，区分原始编辑输入、历史种子和生成输出。AMC 题面、原图、PDF/来源证据按具体来源和使用权限核实，未验证可公开迁移。若限制公开分发，使用授权的内容寻址源码存储，并经原合同认可；不得以旧 draft ZIP 继续充当原生构建输入。 |
| 阅读、旧诊断、拼音与朗读 | W1 `source/reading/` 课程分周 JSON、`weeks.json`、`diagnostics.json`、拼音覆盖及上下文审查 → `build_reading.py` → `reading_data.js`；`reading_engine.js`、`reading_ui.js`、`reading_media.js` 是编译读取及运行来源，历史 `wp-course-data/`、`wp-engine/`、`wp-ui/` 是已追溯的准备/组装配方。当前 Git 的 `reading-quality/{editorial.py,reading.css,word-layout.js,words.json}` 与 `reading-art/{build.py,render.js,scenes.json,assets.json}` 是后续增量；`reading-art/build.py` 从 Git BASE `2c997d120b93622929ff241a2adbad8e35de7e84` 读入口、数据及脚本旧字节。 | 分开登记课程 canonical 数据与发布分片。保留 84 天、旧 13 诊断及旧材料 ID、拼音、旧课程进度；现有编译依赖 `pypinyin==0.55.0`（MIT，包内 notice，附随数据许可还需核对）。浏览器原生朗读无新增内容下载。`reading-quality/build.py` 是历史生成器，#67 加入防回退保护。 |
| 插画及原图 | 84 个已验收 WebP、`reading-art/assets.json` 与 `scenes.json` 直接在 Git，由 `reading-art/build.py` 读取/验证；`register.py` 用于将源图登记为 WebP，记录源 SHA、生成来源和分镜。 | 第一批以现有 WebP 作为经过登记的静态输入。若重建 WebP，需补齐原图可访问位置、权属、转换器版本与参数；源 SHA 不等于源文件可访问或许可已核。未做 84 图的原图再生成。 |
| 本地存储、家长、旧路径及 Q0 | W1 `progress_store.js`、`transfer_evidence_store.js`、`selection_diagnostics.js`、`exam_diagnostics.js`、`exam_mapping_ui.js`、`app.js` 和阅读引擎保留现有 key、身份、Web Locks/IndexedDB、父母入口及首答/草稿语义。`academy/index.html` 是发布清单的独立入口。Git `review-overlay.js/.css` 与 `q0-production-identity.json` 是正式 Q0 层，#67 带保存重试修复。 | Q0 当前源码可从 Git 直接取；数学和阅读通用存储编辑源需从冻结包定位。把学习记录作为跨版本测试 fixture，不能纳入构建内容或重置/写回真实数据。学院入口、QA 和旧缓存路径需要逐路由及构建来源验证，继续保留现有路径。 |
| 发布清单与第三方运行代码 | 当前 `muse/rc79/manifest.json` 与 `w1-g5-allowlist.json` 固定 W1 source/artifact；allowlist 439 项，含四个主入口、QA、LOAD1/2 及保存路径。当前 `public_release.py` 叠加 Q0、阅读与插画身份。#67 新增 `reading-art/packet-integrity.js` 与 `vendor/js-sha256.js`；现行 pako 1.0.11 notice 在 `third-party-notices/`。 | manifest、package-report、压缩分片及入口为生成物或身份收据。pako 和 js-sha256 有 MIT 声明，保留随包 notices；其余第三方依赖按实际锁定工具链登记。439 历史路径和 95 阅读清单有重叠，不能相加为当前正式站输出数量。 |

核验后的历史工件边界：HOME1 `12637348462`（归档资产 `723206068`）是从更早基础重演 W1 的输入，配套内层 ZIP、JSON 经 `unpack_rc79_reading.py`，再经 FIX6 `build_baseline.py` 和 FIX15 `ci_prepare.py` 应用 Git overlay 并构建 QA，随后 `wp-integration/assemble_candidate.py` 应用 W1 及存储补丁并调用原编译器。FIX15 rollback `13122827352`（`723206177`）用于回退对比，不能把它误列为当前 M1 每次下载的输入。M1 直接用已经组装的冻结 W1 `13604511680`（`723206305`），失败时取同字节 draft release 资产，`restore_w1_source.py` 只恢复校验后的 `source/` 和真题台账；QA baseline `13595790278`（`723206391`）是历史 QA 对照。四项归档元数据及摘要与 G0 收据可对应，本次只对冻结 W1 实际下载回读。所有阶段都应保留归档和回退版本。[原归档收据](https://github.com/Dsp233/tianle-fruit-detective/blob/bb0f4e0c2a16827628cb130afd02654e92a7db49/docs/engineering/governance/G0_BUILD_ARCHIVE_RECEIPT.json)

## M1 准入边界

历史 G0-X 队列 rev 280。`M-DEVELOP=PASS` 对应 `c732284e991023398aa9ebec454fcc59901ee90c`，[Actions 42613486934](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42613486934) 的软件候选工件 `13671717309` 仍可见，SHA-256 `7eade14cb504dfbde198c6fe1f19e6022047861e03259ac028b65612cb36133d`。该提交的 `source/` 仍只有 HTML 和解包脚本。`m1-demo-previous.patch` 中确有 14 文件目标，涉及 app、四类 UI/阶段逻辑、联合题族、competition/variation/teaching 合同、复用与版本。`build_m1_candidate.py` 要求旧源哈希一致、零模糊应用补丁，保留 reading、progress_store 和题库映射的批准边界。M1 同一 Git SHA 内，补丁不是已经完整入库的合成源码。

`M-R5-REVIEW` 为 ACTIVE，记录租约截止北京时间 2026-11-15 08:53:02。结构化审核指向 `c732284e…`，29 PASS、13 IN_REVIEW、下一项 J-D01-01。显示文字仍为旧 `10753dae…` 的 71 PASS/13 ISSUE；以绑定源码的签收记录判断，R5 尚无 84/84 放行证据。队列的 G1-SOURCE-BUILD 形式依赖 `M-DEVELOP` 与 `G1-SOURCE-PREP` 均有 PASS。实际动工还需 G1 独立工程授权、重新核对源与租约、隔离正式基线。可在条件满足后对当前批准 W1/CR5 目标实施隔离原生重建；引入 M1 功能、将新候选视为最终 M1 基线或进入数学发布，仍按其独立审核、签收和发布准入执行。[G0-X 队列](https://github.com/Dsp233/tianle-fruit-detective/blob/bb0f4e0c2a16827628cb130afd02654e92a7db49/github-upload/rc79-reading-workpackage/safety-work/g0x/queue.json)

## 最小实施批次与回退

| 批次 | 候选文件范围和出口门槛 |
|---|---|
| A 固定可信输入 | 在隔离工程分支登记 `source/` 的模板、模块、题库和阅读输入以及必要 `docs/exam-review-ledger.csv`。以 W1 verified archive 一次性恢复候选源，按 INPUTS 与内容哈希登记条目，不把整个压缩包或证据池当源码。记录每项 source SHA、许可证/用途、消费者、替换策略；先解除授权素材及传递依赖阻断。受限资源在合法访问范围内解决后再进入下一批。 |
| B 单一全站构建接口 | 建议 `tools/build_site.py` 为唯一受支持入口，隔离输出 `dist/`，调用明确的源编译、分片、W1 阅读增量和部署 manifest 子步骤。逐步把 `reading-art/build.py` 的历史 Git 输入搬到同一可追溯源图，避免 BASE=HEAD 自引用。旧阅读构建器保留防误写。候选 `/academy`、QA、旧缓存与 Q0 路径逐项验证。固定 Python/Node/Playwright 精确版本和 SHA、Python wheels（含 pypinyin）、容器镜像 digest 及可选图像编码工具；以候选实测验证适配性。 |
| C 实证与回退 | 两个独立 clean checkout，在锁定工具链就绪后隔绝网络/凭据、HOME1/FIX15/W1 ZIP、历史工作区及 runner 缓存。记录实际读取集合（例如只读挂载和文件访问收据），文件路径/运行字节 SHA-256/完整 manifest 一致。用缺项、错哈希及手工修改生成物的隔离用例证明失败。解释 ZIP 时间戳差异或生成确定性归档。对批准 main 及 #67 分别账列变动来源，保持评分、内容身份、旧哈希、旧13诊断、数学/阅读首答、草稿、pending、配额、并发、刷新/回退及 Q0；双引擎独立合成档案。发布保护沿用原合同。 |

阻断判据包括缺失/不可合法迁移的真实输入、当前 math/W1 批准字节无法重建、含未授权 M1 改动、旧键或读取结果发生未解释变化、manifest 或历史路径不匹配、无法验证受控回退。回退时撤回隔离 PR 或恢复原入口/manifest 与其已验成套资源，保留既有发布/归档渠道和缓存引用。任何正式回退须另行授权，并用隔离旧记录 fixture 证明恢复；不写回实际学习数据。

本次当前全站构建、M1 重跑、素材许可清理、实时浏览器和正式部署均为 NOT_RUN。本文的路径和哈希对照可作为实施起点，不能当作原生构建 PASS。

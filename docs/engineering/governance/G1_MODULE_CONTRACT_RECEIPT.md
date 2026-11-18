# G1 模块边界与工程签收

本记录绑定运行候选 [#71 a45cfef](https://github.com/Dsp233/tianle-fruit-detective/pull/71) 及工具链重锁提交 [5f8bca6](https://github.com/Dsp233/tianle-fruit-detective/commit/5f8bca68425b9aacc57982e184d2b3c3d5892e8c)。所选架构是六个入口共享启动与存储层，数学和阅读分别加载；保留每个入口的历史存储身份及旧诊断资源。

| 边界 | 支持的依赖 | 需要拒绝的变更 |
| --- | --- | --- |
| 数学与旧诊断 | FIX15 的 `overlay/source/app.js`、`exam_mapping_ui.js` 及诊断资源由已登记的构建输入装配。六个入口共用一个现行数学脚本，入口配置提供原 STORE 命名空间。 | 将不同入口统一成同一个学习档案，或缺数学分片时静默以旧数据替充。 |
| 阅读与家长看板 | 阅读包使用 `reading_answer.js` 校验答题值，`reading_engine.js` 与 `reading_ui.js` 保留首答、草稿及备份导入。看板通过 `mathSummary()` 读取次数与专题数。 | 从阅读界面直接访问可写数学档案，或在资源校验失败时推进课程状态。 |
| 共用存储 | `canonical/w1/source/progress_store.js` 作为两个学科的首个共享脚本。Web Locks、IndexedDB、原始记录和升级前备份沿用各渠道现有契约。 | 嵌入另一个 ProgressStore 实现，绕过写入确认，或隐式迁移旧版键。 |
| Q0 评审 | `review-overlay.js` 独立处理批注、导出和失败重试，延用原评审数据身份。 | 将评审状态写入数学或阅读学习历史，或在持久化失败后宣告保存。 |
| 构建与公开字节 | `tools/g1_runtime.py` 装配共享启动、各模块及打包字节，`tools/build_site.py` 验证锁定输入与产物。历史构建器有覆盖拒绝测试。 | 将旧归档或未登记的生成物作为 canonical 源码，或直接改动已签收产物与清单。 |

已有 [产物与输入作业](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44415373489/job/135194145915) 验证六入口共享边界、错误字节拒绝和历史构建保护。[48 项 Chromium/WebKit](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44415373199/job/135194144627) 覆盖首答、草稿、pending、配额、并发、旧版回退、13 套旧诊断和隔离存储。项目所有者批准本次按两个冻结候选采用一次性替代验收。#71 两份离线清单和托管公开输入的 1,157 个产物逐项一致。私有源码托管原生构建记 `NOT_RUN`，独立检出使用同一执行环境。

工程回退以冻结父提交和原始输入锁为基准。单项工程变更用普通反向提交回退，重建并核对原有产物指纹。正式发布带独立授权，用户学习档案的兼容性以已记录的隔离 profile 导出、原文读回和旧版回退验证为准。

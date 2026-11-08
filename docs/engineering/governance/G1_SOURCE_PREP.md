# G1 原生构建准备

对照候选 Git 树 `00e5cc77f76e2a3699e65bd90b671fd48db87d37`、生产 W1 `7e1b5df76e63abcb45836200dbde4d06e88eaf35` 和已校验的冻结 W1 包 13604511680。冻结入口、原恢复路径、归档哈希和原生构建依赖沿用 [M0 基线](M0_BASELINE.md) 和 [G0 归档收据](G0_BUILD_ARCHIVE_RECEIPT.json)。

## 现有可信来源和缺项

用 `git ls-tree -rz HEAD` 取完整 blob ID。对冻结包每个 `source/` 文件计算 Git blob ID，即 SHA-1 的 `blob <字节数>\0<原字节>`，与任意已跟踪路径比对。8,348 项中 362 项在候选树有同字节 blob，7,986 项没有同字节 blob。其中含 9 项 Python 缓存、生成物、测试文件和历史兼容资源，7,986 不代表全部都须成为构建输入。候选树根 `source/` 只有发布生成的 `index.html` 和历史解包脚本。实际编译引用的 `app.js`、`joint_families.json`、`skills.json` 以及阅读 UI 在这个 Git 树中没有对应原字节。M1 按已验冻结输入加隔离补丁继续构建，尚无从干净 Git checkout 运行的完整原生入口。

| 范围 | 现行来源 | 原生迁移路径与验收 |
|---|---|---|
| 数学运行代码、模板及首答存储 | HOME1 解包 → FIX6/FIX15 覆盖 → W1 组装 → M1 源码补丁。部分文件在 `github-upload/*/overlay/source/` 有同字节版本 | 从已验冻结树与最终 M1 候选一次性登记 canonical 源，每项记录来源哈希。再将补丁合成到 canonical 源并逐项复建，按 W1、M1 的独立收据验证首答、草稿、Web Locks、IndexedDB、回退和家长入口 |
| 数学题库、真题判断和复用审查 | `source/content/` 原材料与 `child_form_reviews.json` 等审查输入，`compile_exam_mapping.py` 编译索引和报告 | 登记原始题目、判断、训练绑定、材料和审核收据为输入。生成的 `exam_runtime_index.json`、供题索引、JS 包和页面由编译产生。比对数学字段、题面资格、供题资格、历史复用和可追溯的来源标识 |
| 阅读课程和历史诊断 | `wp-course-data` 脚本和更正表、`wp-ui` 片段、FIX15 旧版兼容层、冻结包 `source/reading/` 原始内容 | 从完整 84 天原文、旧 13 诊断数据、拼音审查和离线编译恢复生成 `reading_data.js`。保留旧映射和原始回退 fixture。对照 84 天课程、旧诊断、上下文拼音、原页面路径与历史草稿身份 |
| 题图及发布静态资产 | 冻结包原素材和发布 `assets/`。`source/content/` 下有 7,422 个无匹配 blob，其中包括 78 个 `imported_assets`，另有原始来源清单 | 将素材清单分为可再生成、须登记来源后保留及许可待确认三类。逐项核实原图、源页和允许的分发范围，再确定 Git 或固定源码资产位置。生成哈希分片从原始素材重建，检查缺图、诊断图片、缓存路径及 G5 的 439 个运行路径 |
| 工具链、质量与回退 | 当前 Actions 用 Ubuntu 24.04、Node 22、Playwright 1.57.0，拼音依赖 `pypinyin==0.55.0`。Python 本次实测 3.12.14，现有 M1 工作流用 runner 的 Python | 后续实施时固定 Python、Node、Playwright、镜像摘要和依赖校验值，使用 lockfile 或可验证离线包，保留拼音第三方许可。历史 HOME1、FIX15、W1 ZIP 继续作为对照及回退证据 |

## 两次干净构建试验

1. 在 `G1-SOURCE-BUILD` 获得适用授权后，从同一固定 SHA 建两个隔离 checkout，使用同一锁定工具链，隔离 HOME1、FIX15、W1 ZIP、draft-release 凭据、历史 runner 工件和工作目录缓存。编译进程仅允许访问声明输入。加入故意缺失一项 canonical 输入的反向用例，要求构建失败并报出缺项。
2. 两次各自生成发布清单、完整静态候选和构建收据。按相对路径与文件 SHA-256 比对全部运行字节。如压缩包元数据变化，用确定性归档或规范化清单解释差异。用候选对照 W1 与最终 M1，单列已批准功能差异。
3. 在实际 Chromium/WebKit 跑阅读、数学和旧诊断入口、首答和草稿刷新、并发、配额及回退。使用现行正式发布规则核对 staging 事务、预期主分支 SHA 和 Pages 回读。通过标准见 [G1 合同](G1_LONG_TERM_ARCHITECTURE.md)。

本收据仅完成只读准备。完整原生输入、素材许可、工具链锁定和实际 clean build 结果均留待 `G1-SOURCE-BUILD`。

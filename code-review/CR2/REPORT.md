# CR2 验收报告：CR-003 阅读质量 CI 覆盖缺口

基线 main `05f73af21ddf35134bb7c5e598cd75845e82baf2`，实测候选 `ce3beba8238cf850c5f6f9cda62d720d91acdafd`，交付 [Draft PR #57](https://github.com/Dsp233/tianle-fruit-detective/pull/57)。CR0 [#54](https://github.com/Dsp233/tianle-fruit-detective/pull/54) HEAD `69dde6a12703266d5f1e2825aa360b41283d309d)，CR1 [#55](https://github.com/Dsp233/tianle-fruit-detective/pull/55) HEAD `c5aa61df37013fad474641c1c9645cdf4212c296`，均为独立未合并草稿。

旧版 `w1-reading-quality.yml` 发现现存 `release.json` 后只做构建字节校验，随后跳过语言、规则、浏览器和学习记录检查。仅改阅读 CSS 时，插画 workflow 也不会触发。新版阅读 workflow 直接执行当前发布的只读 `reading-art/build.py --verify-release`、`reading-quality/check.py --joint` 和 Chromium/WebKit `browser.py --joint`。旧版 `check.py` 默认分支会调用会写入三个入口的历史 BASE 构建器，CR2 没有启用它。适用路径包含阅读源码、阅读资产、三个入口和阅读标识。插画 workflow 保留原有发布字节、分镜和联合检查。路径过滤同时适用于隔离集成 PR，两个 workflow 原有 push 分支限制保持。

`check.py --joint` 继续比较冻结规则、答案、分镜绑定、存储/评分/朗读字节，以及历史受保护路径。允许验证工作流、源码样式/断词、当前入口实际链接的阅读 CSS 及插画资产清单接受各自校验，未放开其他课程资产。新增真实首篇正文几何断言使用 passage 和汉字的位置检测视窗裁切，覆盖文档滚动宽度可能仍为 390px 的情形。

复用 CR0 [原始运行](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44010116843) 的 2000px CSS 与给首张 WebP 追加 CR0 字节的反例。基线和修复后 CSS 故障 PR 经 GitHub REST 确认包含同一个 CSS blob `e3a183ecb6c6a2f6d31c5455050e7d26484131d7`。另有只改已发布 JS 包字节的负向对照。四个正常探针使用不改变行为的注释或 JSON 格式变化来隔离路径类别，未把词布局源注释视为运行时逻辑行为变更。

正常候选阅读任务的两个引擎均测得：390px 视窗，正文336px，视窗外汉字0；每引擎 672 个布局测量和 72 个可见场景，学习记录升级、回滚、原始事件与草稿保护、配额拒绝通过。正常候选插画任务自动核验每引擎 504 个位置。静态自动校验仍检查 336 道题的规则和 504 个插画绑定，人工课程/题目复审为 NOT_RUN，未改变课程内容。

下面的触发表来自 GitHub Actions `pull_request` 事件、实际运行步骤、原始日志和 GitHub PR 文件清单。候选 PR 及旧故障 PR 以 main 为 base，修复后的隔离探针仅指向 CR2 分支。探针未合并，其文件不在交付 PR 中。

| 探针 | PR | HEAD | GitHub Actions | 实际结果 |
| --- | --- | --- | --- | --- |
| 旧版损坏 CSS | [#56](https://github.com/Dsp233/tianle-fruit-detective/pull/56) | `68a1095f` | [阅读质量 44022029703](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022029703/job/133833503769) | 误通过，布局/规则/记录步骤 skipped |
| 正常候选 | [#57](https://github.com/Dsp233/tianle-fruit-detective/pull/57) | `ce3beba8` | [阅读质量 44022158517](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022158517/job/133833916162) | 通过 |
| 正常候选 | [#57](https://github.com/Dsp233/tianle-fruit-detective/pull/57) | `ce3beba8` | [插画 44022158592](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022158592/job/133833916198) | 通过 |
| 正常 CSS | [#59](https://github.com/Dsp233/tianle-fruit-detective/pull/59) | `44b62754` | [阅读质量 44022223681](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022223681/job/133834117496) | 通过 |
| 正常阅读断词源码 | [#58](https://github.com/Dsp233/tianle-fruit-detective/pull/58) | `197a5e84` | [阅读质量 44022214653](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022214653/job/133834089536) | 通过 |
| 正常插画清单 | [#60](https://github.com/Dsp233/tianle-fruit-detective/pull/60) | `1c27af14` | [插画 44022224719](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022224719/job/133834120150) | 通过 |
| 正常混合变更 | [#63](https://github.com/Dsp233/tianle-fruit-detective/pull/63) | `83f1e02c` | [阅读质量 44022238392](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022238392/job/133834163956) | 通过 |
| 正常混合变更 | [#63](https://github.com/Dsp233/tianle-fruit-detective/pull/63) | `83f1e02c` | [插画 44022238380](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022238380/job/133834163574) | 通过 |
| 新版损坏 CSS | [#62](https://github.com/Dsp233/tianle-fruit-detective/pull/62) | `3abfa841` | [阅读质量 44022234368](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022234368/job/133834151153) | 预期失败：浏览器检测 31 个视窗外汉字 |
| 损坏 WebP | [#61](https://github.com/Dsp233/tianle-fruit-detective/pull/61) | `286f00c8` | [插画 44022228063](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022228063/job/133834131091) | 预期失败：首日插画哈希不一致 |
| 已发布阅读脚本包字节变动 | [#64](https://github.com/Dsp233/tianle-fruit-detective/pull/64) | `8d0348b1` | [插画 44022306084](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022306084/job/133834379928) | 预期失败：已发布 JS 包字节不一致 |

首次新版 CSS 故障运行的浏览器安装耗时较长，期间提交了不改变 Git 树的重试。相同故障在 [重试 44022785953](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44022785953/job/133835894016) 也被 Chromium 以 31 个视窗外汉字阻断。所有探针 PR 已关闭。

完整 job 链接、步骤结论、Artifact 哈希、实测 SHA 和逐行原始摘录见 [evidence.json](evidence.json)。浏览器证据 ZIP 提供完整布局和数据保护回执。

剩余限制：混合变更运行两套门禁，部分浏览器检查会重复。新版 CSS 反例在第一个浏览器遇到断言即退出，故障 WebKit 复测为 NOT_RUN，此场景的双引擎裁切数据来自 CR0。真实 iPad/Safari、合并后的 main push 和 Pages 公网步骤均为 NOT_RUN。本阶段无合并、部署或其他修复。

建议下一阶段只处理 CR-002：给历史构建入口加明确写入边界，继续保留当前可复现发布。推荐 GPT-6.1 Terra / high 作为暂定配置。[真实代码审查评测](https://macroscope.com/benchmark) 中 Terra high 与 Sol high 召回率为 75.0% / 66.2%，精确率 91.2% / 91.3%，推理成本为 $0.57 / $0.56 每审查任务。[CI-Repair-Bench](https://arxiv.org/abs/2604.27148) 使用 103 个仓库的真实 GitHub Actions 失败走修复重跑，任务更近，但没有提供这两配置在历史构建防回退上的直接对照。缺少 CR-002 的实测修复成功率、返工率、Token 和修复总成本。可使用 [CR3 完整 Work 提示词](CR3_PROMPT.md)。

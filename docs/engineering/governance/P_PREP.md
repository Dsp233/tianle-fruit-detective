# P 已批准产品体验要求对照

依据总计划 R2.1 的 P 阶段、既有首页双入口要求及用户对题目低龄、中文拗口的反馈。基线是 W1 冻结运行源码 `f935008b75d79cfc44610b197122c01e1b6b9a6e`、工件 13604511680。下表的编号用于后续反馈与验收追踪。

| 需求 | 当前版本中的实际落点 | 后续可验证差距 |
|---|---|---|
| P-01 提升趣味性与适龄挑战 | `source/reading_data.js` 活跃课程 84 篇故事及 84 篇可选挑战，252 道核心题、84 道挑战题，18 种核心题交互。核心题 224/252 为选择题，可选挑战 84/84 为选择题，168 篇活跃材料 difficulty 均为 null。数学挑战、脚手架由 `source/app.js`、`task_player.js` 及区域模块承接。 | 交互数量和现有题库不能证明适龄或有趣。先用 Q0 意见定位实际过易、重复或反馈不清的题和路径，再用既有 M/W2 合同约束受影响题目的正确性、难度、提示和进度。真实儿童体验在最终 UAT 收证。 |
| P-02 中文清晰自然 | W1 [G1 字段覆盖](../../../github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-g1-field-coverage-20261108.md) 与完整候选证据已存在。运行入口为 `source/reading_ui.js`、`reading_data.js`；保留旧课语言及首答隔离。 | 沿用 W1 已核对内容。收到可复现的拗口文句时，逐项绑定材料/题目 ID、字段与语境，仅重验变更题目的拼音、理解和判分。 |
| P-03 双入口、导航与视觉 | 冻结 `index.html` 已有功夫学堂首页及数学/阅读双入口；`source/app.js` 管导航，`source/reading_ui.js` 管阅读入口和回退。[W1 独立 Chrome](../../../github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/w1-software-acceptance-coverage.md) 覆盖双入口、回到历史记录。 | 用评审记录精确标出有缺口的入口或卡片。后续 UI 候选须在实际页面验证各入口、返回与续做、父母/儿童边界及学习记录保持。 |
| P-04 反馈闭环 | [Q0 私有预览](../../../github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/q0-preview-browser-receipt.md) 具备编号、定位、分类和 Markdown 导出。 | 复用该导出按版本、路径和意见编号登记问题、修复及复验。正式站 Q0 集成与发布按各自队列门禁执行。 |

未发现可用的逐项产品反馈原表。保留当前明确需求和版本分母，后续用户批注作为新增个案证据，按其影响范围处理。

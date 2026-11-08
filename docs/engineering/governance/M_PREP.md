# M 既有合同与冻结源码对照

范围来自总计划 R2.1 的 M 合同与 G0-A 风险切片。只读输入为 W1 修复冻结源码 `f935008b75d79cfc44610b197122c01e1b6b9a6e`，工件 13604511680。以下相对源码路径指包内 `source/`。动态证据沿用原记录，静态存在和运行资格分别记录。

| 既有要求 | 代码和实际分母 | 已有证据与后续差距 |
|---|---|---|
| M01 知识区域、微技能与前置 | `skills.json`、`curriculum.json`、`knowledge_graph.json` 的技能 ID 集完全一致。33 区、179 技能、472 图关系。逐 ID 可查 [技能对照](M_SKILL_BASELINE.csv)。 | `test_curriculum.js`、`audit_units.js`。内容字段存在，179 个应用节点均仍标记等待分层验收，后续按实际变更核对。 |
| M02 教具、示范、多解法与正确性 | 179/179 有教学、示范和解释 ID；`demo_ui.js`、`task_player.js`、`teaching_skill_contracts*.js`、各区域模块承接操作及判定。 | 教学 ID 不证明每个示范实际可操作或每道题已具备多解。沿用区域判题测试，按受影响技能验证不同解法的数学合同、可操作性及反馈。 |
| M03 AMC8 原题和训练映射 | `exam_runtime_index.json` 有 650 原题、654 路线、1307 判断、1307 训练绑定、1962 任务。614 eligible、36 policy_blocked；不能把 650 均当运行可供题。儿童题审查另有 613 REVIEWED、37 REVIEWED_RESTRICTED。 | `exam_mapping.js`、`exam_mapping_ui.js`、`test_fix13_exam_selection.js`。逐技能映射从 judgment.skillUses 反查，避免把空的旧 examReferences 误判为无映射。保留受限题隔离，验证独立求解及过程证据。 |
| M04 复习、诊断、家长端 | `assessment.js`、`periodic_practice.js`、`selection_diagnostics.js`、`exam_diagnostics.js`、`app.js` 与 `progress_store.js`。 | 沿用 `test_fix79_periodic_readonly.js`、`test_fix79_parent_range.js`、`test_fix79_family_sources.js` 与 W1 保存回归。G0-B 先落实写入隔离及可复建；数学开发授权后复验受影响历史、首答、草稿、诊断和统计。 |

M01–M04 是本表映射键。总计划保留历史 W00–W11 与 M0–M6 命名，但当前仓库未定位完整的原始逐项合同，后续取得原表时并入映射。已登记的数学开发和发布门禁继续保留。

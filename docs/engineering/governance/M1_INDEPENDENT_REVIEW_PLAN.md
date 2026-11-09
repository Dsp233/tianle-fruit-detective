# AMC8 M1 — R5 独立教学语义评审执行合同

更新时间：2026-11-09。仅调整任务职责，不重跑已通过工程 CI，不扩大 M1 需求，不授权正式上线。

## A. 审核对象与固定来源

- 仓库分支：`rc79-reading-workpackage-20261101`，实时 HEAD 和 G0-X queue 为准。
- 经工程验证的候选源码 SHA：`10753dae542eba5a1847c21d82528bb415ef789b`，入口 SHA-256：`6bf2b8256c591a336453aeb00790f9e287c5bb7c89a82dc84c8b0d8534ba3c81`。
- [双浏览器候选 CI](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42543443018)，工件 13642153873。420新题、84五角色题族；`J-A03-03-I1` 题面条件歧义已修复，保留800数学签名与95旧题族复用。
- G0-X 新任务：`M-R5-REVIEW`。继承原 `semanticReview` 的84题族ID、七维判定、归档及0/84光标。当前第一题族为 `J-A03-01`，首个实例 `J-A03-01-G`。

## B. Work 中可完成的独立验收

1. 使用**不参与该候选源开发**的评审者及独立会话/浏览器环境。先验证可以正常访问候选工件、操作题目并保存原始结果；仅新聊天窗口不自动构成实质独立。
2. 按 `M1_JOINT_BASELINE.csv` 顺序对每族 G、I1、I2、C、D 五角色查看**真实可见题面**，在不阅读开发者解法前独立计算、提交、检查实际判分和反馈；保留操作/问题ID、SHA、可复核截图/回执和证据哈希。
3. 对每个题族的七维 `QUESTION_SUFFICIENCY`, `INDEPENDENT_SOLUTION`, `PRIMARY_TARGET`, `SUPPORT_NECESSITY`, `TRANSFER_SUBSTANCE`, `COUNTEREXAMPLE`, `SIX_DIMENSION_APPLICABILITY` 分别记录结论、逻辑依据、独立证据、`reviewerRef`。前六维要有实际 PASS 才能签收；最后一项可有证据地 NOT_APPLICABLE，NOT_OBSERVED/ISSUE不能计 PASS。
4. 已通过的软件数学签名、历史阅读/存储/首答、双浏览器 CI 直接继承，不重做。开发方预核只能用于独立作答**完成后**的对照，不可冒充独立原始答案。
5. 每批用 `queue-cli.mjs review-checkpoint --task M-R5-REVIEW` 并传本次实际合法租约、评审JSON；完成一族立即提交，保存下一族ID，不因单批 CI PASS/提交而结束该次工作。评审代码规则并不能验证评审者真的独立；审核人员必须保留可检验的浏览器会话和实际原始记录。

## C. 审核中发现问题

- 题目歧义、数学误判、反馈错因、迁移无效等 ISSUE → 记录具体题ID和重现步骤，交回数学开发者修复，M不能发布。若原 `M-DEVELOP` 已结案，需另行显式恢复工程整改任务并保留原 PASS 审计记录，不能直接覆盖已完成证据。
- 候选实质变更 → 需建立新来源 SHA 和重新验证影响范围；目前 `review-rebaseline` 按已实现安全策略会归档此前评审并重置新候选的84题族光标，不能随意延用旧PASS。复核旧评审可减少重复阅读，但必须有可核证的来源一致性。
- 没有隔离环境 → 仅在 `M-R5-REVIEW` 记录环境阻断，不阻断 `M-DEVELOP` 的其他工作。缺少用户授权/真实浏览器亦不得虚报签收。

## D. 发布与最终UAT的边界

`M` 需要 `M-DEVELOP PASS` + `M-R5-REVIEW PASS` + 完全相同的候选源码 SHA + 具体版本正式发布授权。两个工作任务允许独立并行，不修改现有 W2/F 阶段合同。最终F后UAT才验真实 iPad、真人听音、儿童学习表现、家长反馈及有效隔日学习；这些人因结果不可由模拟器或AI自评替代。本次不改生产 main，不启动自动监控。

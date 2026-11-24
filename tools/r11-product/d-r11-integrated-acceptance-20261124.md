# AMC8 R1.1 D组统一验收报告（阶段性，未完成最终签收）
日期：2026-11-24
产品基线：72f2f229246af362f9024db217479357890c8cd3；恢复证据：5e59639a；G0-X 474 为原继承状态。本轮不修改正式产品，不重新验证已签工程项及 R5，不重复历史学习记录。为隔离同时执行的独立验收窗口，本轮差量证据写入 codex/r11-d-math-delta-20261124，并在原 D 分支挂接证据索引。不得把两个分支的重复运行累计成独立对象数。

## 本轮可签差量
| 原合同范围 | 实际结果 | 裁决 |
|---|---|---|
| 522项历史未尝试对象 | 实际覆盖522/522；独立521/522 | 余1项等价表达缺陷等待C整改 |
| 原30项非独立验证 | 29项新独立通过；1项C缺陷 | 29 PASS，1 OPEN |
| 14项原历史身份不明 | 11项有当前独立通过（其中8项既有、3项本轮新增）；3项受限 | 历史身份仍不明，不反推历史原始作答；3项历史保护未完整签收 |
| 2612项历史身份对账 | 2598项可确切匹配；14项历史身份未明 | 原证据继承 |
| 1212项实际验证、715项独立 | 新增32项独立通过，累计747项独立；不把已有实际对象重复计数 | 实际对象1212仍为原覆盖口径；独立747 |
| 169项适用历史图题 | 169/169独立通过 | 继承 |
| 7项儿童供题 | 3项必经替代路线经普通儿童入口全部实际自动分配；4项不属于现有必经路线，有既有家长端独立判分 | 自动供题差量闭环；不把家长端等同儿童端，不强制每个非必经候选出现 |
| 36配置深审 | 36主问题既有独立；36错误输入拒绝并反馈；36首级提示、变式可见；36变式冻结推导与实际判分一致 | 已有行为证据；不等于六维逐项评分签收或盲留出 |
| V3跨模块 | Chromium/WebKit两引擎同档案数学→诊断→阅读可选卡→Q0→刷新，记录及数学摘要保留 | F23–F24及F25部分行为证据可复用；不等于V3全通过 |

## 缺陷交接
- [Issue #131 RTM-2016-09-DECISION](https://github.com/Dsp233/tianle-fruit-detective/issues/131)：72=2³×3²，不同质因数之和选择3+2被判错，2+3判对。原始独立首答、帮助0、反馈及截图已交接；Issue仍OPEN，无已取得的C修复候选。D应仅在候选具备时定向复验2+3、3+2与真正错误项，检查首答历史不被覆盖，不重跑无关对象。不得宣称已修复。

## RC73与其余合同
并行D原分支最新已回收RC73主问题720/755当前实际通过，35项完全相同配方的已有证据仍需逐项连接；765总实例中另10为受限配置。主问题投影与755个变式题面投影不能当作755变式判分。初始14项主问题差异经复核为测试者预期错误，不新增产品缺陷。保留原分支后续更新，本文不覆盖其台账。
- RC73尚需逐项核实原合同要求的变式判分、典型/不确定错误反馈、等价与非法输入、必要交互及环境组合等未有有效证明的断言；不按198逻辑项、362环境行或3206执行行简单全量重做。
- Muse604：已有关联的数学、阅读、持久化、图资源、跨模块证据继续有效，但尚未完成余下逐行断言裁决。历史1762项判对记录保持原证据强度；没有原独立推导的不得升级为独立签收。
- 原认知画像84（数学40/阅读24/家长12/跨模块8）：未完成逐画像验收；与R5独立84不是同一分母。
- 36配置：仍缺原六维（0–3分，必要维度均≥2）逐配置完整评分、其他必要错因和交互、适龄与策略审读；已验主问题、错误反馈、提示和变式不默认重测。
- 独立留出：既有4个代表性实际留出结果保留，原合同全部盲留出范围尚未闭环；本轮36已观察变式不能充当盲留出。
- 受限历史：37组负向供题（148对象）已有实际证据。尚未完整验证旧档案的受限历史只读查看、拒绝新供题、前后历史状态一致等，尤其2017-25三项受限身份。不得以负向分配代替历史保护。既有普通RC64历史fixture不是受限记录证据。
- V3.0：既有远端证据与跨模块2/2复用；剩余远程断言，包括适用历史导入、实际公网身份/缓存与完整场景组合尚未最终签收。
- 真实外部阻断：袋鼠数学及上教版材料；真人听音、实体设备、儿童/家长真实UAT及需真实时间的效果测量。其余上述未结项目为本轮仍未完成的内部可执行验收，不得伪称外部阻断。

## 实际证据索引
- [32目标独立判分冻结](https://github.com/Dsp233/tianle-fruit-detective/blob/3bff20997c43aece5eca6b8a102c197b4a5be7f4/tools/r11-product/d-math-delta-expected.json)；[run45420765398](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45420765398)，artifact14933618815；[回执](https://github.com/Dsp233/tianle-fruit-detective/blob/3e677524c1160f51798179d58f7a82850d7216b5/tools/r11-product/d-math-delta-receipt.json)。17组48次提交，32独立目标正确，16仅复用既有推导的过渡提交，42.61秒。
- [36错误/提示/变式观察回执](https://github.com/Dsp233/tianle-fruit-detective/blob/4f88c31db8af33a42afeef3af8ad7e6bf111b72b/tools/r11-product/d-teaching-deep-receipt.json)，run45421521550 artifact14934256291。
- [36变式独立推导冻结](https://github.com/Dsp233/tianle-fruit-detective/blob/2a81c22be4b5e1b797ba8049629dc20f8340a7a2/tools/r11-product/d-deep-transfer-expected.json)；[run45422390794](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45422390794)，artifact14935036638，SHA256 c6c693d2e793923c85a8fdc78410882aeb97e04b82eb87b2f7f4585a3c07f2cf；[回执](https://github.com/Dsp233/tianle-fruit-detective/blob/22896502ce16c3d0ff64a26a505c97f9d8dc162d/tools/r11-product/d-deep-transfer-receipt.json)。
- [儿童原普通路线](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45421058080)，[路线归属回执](https://github.com/Dsp233/tianle-fruit-detective/blob/74efcc8f8550c8fd55f46f2293c0cb6f934c9f11/tools/r11-product/d-child-route-membership-receipt.json)；[替代路线实际运行45423519657](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45423519657)，artifact14935307812，SHA256 d53ed7a2c4526584cea78a2682985fb528339a176db797dafbdeec2bfb63c8e9；[最终回执](https://github.com/Dsp233/tianle-fruit-detective/blob/c485945f14182883473e54ab4fbd477a59646ac8/tools/r11-product/d-child-alternate-route-receipt.json)。两组、3目标实际分配，5过渡提交不新增独立计数。
- [跨模块双引擎run45422332936](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45422332936)，artifact14935581527，SHA256 caaa5d93a87493993f53459ce2d65ecb76a1ce5d91ea398c4e08fed386af12df。
- RC73 [主问题投影45420036530](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45420036530)；[变式投影45420531834](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45420531834)；主问题判分 [45421606926](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45421606926)、[45422113177](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45422113177)、[45422743251](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/45422743251)，原D分支记录1feec689cfd216f732875ca973814fd89be997db。
- [原D分支差量挂接索引](https://github.com/Dsp233/tianle-fruit-detective/blob/8ddb12470586a9990aad9363324e52e435f89667/tools/r11-product/d-parallel-math-deep-receipt-index.json)。

**总裁决：D组未完成最终独立签收。** 本轮完成可核实的上述数学差量、儿童供题差量、36项实际变式判分和反馈观察；不得将报告本身视为验收完成。后续执行以原R1.1台账和实际证据逐断言补差，不新增治理、不得重复R5/历史有效工作，不修改正式产品。

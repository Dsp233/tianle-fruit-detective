# AMC8 M-R5-REVIEW 独立审核完结记录 — 固定候选 10753dae

**候选 40 位 SHA**：`10753dae542eba5a1847c21d82528bb415ef789b`  
**执行者**：`work-r5-independent-20261109-01`（与历史 M-DEVELOP developerSessions/workerHistory 不相同）  
**来源**：G0-X `rc79-reading-workpackage-20261101`，M-DEVELOP 早已 PASS；本轮 M-R5-REVIEW 仅独立审数学与教学语义，不改正式站，不重做 M1 软件验收。  
**候选工件**：GitHub Actions 42543443018，artifact 13642153873，ZIP SHA-256 `5751e2b372e3452a61acc9854cb8e8e0ce48e018f0c68bb535b65c65de2259a6`，HTML SHA-256 `6bf2b8256c591a336453aeb00790f9e287c5bb7c89a82dc84c8b0d8534ba3c81`。

## 结果与性质

| 指标 | 确认结果 |
|---|---:|
| 源码绑定题族总数 | 84 |
| 五角色题面实例 | 420 |
| 实际已独立审查题族 | **84 / 84** |
| 七维全部可签收 | **71 / 84** |
| 七维中存在问题 | **13 / 84** |
| 未审核题族 | **0** |
| 内容审查类别 | 13 族仅 `COUNTEREXAMPLE=ISSUE`；其他六项在本轮范围内逐维有证据 |

严格区分“84族已审核完”与“84族全部签收”。本轮未使 M-R5-REVIEW 达到全部 PASS；按当前队列 `finish` 的规则 `issueCount !== 0` 不允许签收完成，也不得启用 M 正式发布任务。因候选版本固定、本轮未被授权改写受审源码，13处实质问题是后续签收的客观阻断。

## 审核证据链

- [A03 七族](M1_R5_INDEPENDENT_BATCH_01_A03.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_01_A03.md`
- [A04/A05 十二族](M1_R5_INDEPENDENT_BATCH_02_A04_A05.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_02_A04_A05.md`
- [G01–G03 十五族](M1_R5_INDEPENDENT_BATCH_03_G01_G03.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_03_G01_G03.md`
- [G04–G07 二十二族](M1_R5_INDEPENDENT_BATCH_04_G04_G07.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_04_G04_G07.md`
- [D01 六族](M1_R5_INDEPENDENT_BATCH_05_D01.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_05_D01.md`
- [D02 六族](M1_R5_INDEPENDENT_BATCH_06_D02.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_06_D02.md`
- [D03 六族](M1_R5_INDEPENDENT_BATCH_07_D03.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_07_D03.md`
- [S01 五族](M1_R5_INDEPENDENT_BATCH_08_S01.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_08_S01.md`
- [S02 五族](M1_R5_INDEPENDENT_BATCH_09_S02.md) — `docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_09_S02.md`

**方法限制**：从实际候选 HTML 的原生题面和材料条件独立用有理数、几何分段/折叠、全排列与具体样本身份枚举求主量与后续采购；不把开发预核、模型内部 expected 或 CI 的合成通过当作独立签收。已在隔离 Chromium 验证 G 角色可打开；未把 I1/I2/C/D 的源题面独立算术推导冒充完整正常学习进度浏览器解锁。儿童真实认知负担、实际学习成效、真机听音、真实隔日/7/21天依既定规则留最终 UAT，未记录虚假 PASS。

## 13个未通过题族的精确处置

| 题族 | 问题性质与最小修正方向 | 证据 |
|---|---|---|
| `J-A05-06` | 连续三轮乘方反例，C题只实际操作一轮；补3轮正确27与错误加法9的同题对照。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_02_A04_A05.md#j-a05-06) |
| `J-G02-02` | 半周180°与整周360°混淆，C题只比较60°和30°；改为可见的180/360对照。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_03_G01_G03.md#j-g02-02) |
| `J-G03-01` | 同一目标不同拼法重复采购说法，C题只有一种拼法；补第二种等面积同目标拼图。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_03_G01_G03.md#j-g03-01) |
| `J-G04-03` | 半圆弧与含直径完整边界混淆，C题为四分之一弧；增加半圆弧与全边界比较。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_04_G04_G07.md#j-g04-03) |
| `J-G05-02` | 单轴与双轴伸缩混淆，C题横纵均×1.5；增加横×1.5、纵不变的非等比对照。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_04_G04_G07.md#j-g05-02) |
| `J-D01-01` | 图例4件时半枚图标应为2件，C题图例1件且无半枚；改为4件/完整图标并出半图标。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_05_D01.md#j-d01-01) |
| `J-D01-03` | 非零量尺起点不应默认0，但C量尺仍从0起；改成10起点并出零起点错误。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_05_D01.md#j-d01-03) |
| `J-D01-05` | 图表『外观相似』不证明数据转换正确，C仅做正确转换；应呈错配单位/标签/数值但外观相似的假图。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_05_D01.md#j-d01-05) |
| `J-D01-06` | 数满足阈值端点与累计时长不能混同；C题只有一个符合端点而正确时长恰为1分钟；设计两个计算结果不相等的曲线。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_05_D01.md#j-d01-06) |
| `J-D02-03` | 屏幕第一条不必为最小值；C原始记录首项1碰巧本就最小；改成首项非最小。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_06_D02.md#j-d02-03) |
| `J-D02-04` | 偶数中位数必须取两中值的平均，C两中值恰均为2；改为不同中值以区分错误做法。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_06_D02.md#j-d02-04) |
| `J-D03-04` | 颜色种类数不能代替有利基本结果数；C四编号各不同色且所有编号均有利，计数巧合相等；改为多同色身份样本。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_07_D03.md#j-d03-04) |
| `J-S01-03` | 相同角度不能随意换旋转中心；C只有以(0,0)旋转，未展示另一个中心下终位差异。 | [审核位置](https://github.com/Dsp233/tianle-fruit-detective/blob/rc79-reading-workpackage-20261101/docs/engineering/governance/M1_R5_INDEPENDENT_BATCH_08_S01.md#j-s01-03) |

## 精确恢复位置和下一门禁

1. **首个未签收题族**：`J-A05-06`。**未审题族为0**；后续是修订这13族反例的工作，不是重新执行84族独立作答。
2. **旧候选不可直接继续签全PASS**。若另行授权改动候选并产生新SHA，使用队列现有的 `review-rebaseline` 契约归档旧审查并重审新来源；没有已证据化的差异保留机制前，不得静默沿用旧来源的71条签收。不能为了让队列计数变成84而把ISSUE改为PASS。
3. M 正式发布需要完整新候选的 **M-DEVELOP 与 M-R5-REVIEW** 对同一源码SHA双PASS以及独立发布授权；本轮一概没有做生产发布或 M1 既有软件验收重跑。
4. 本次独立审核的可恢复记录以 G0-X `queue.json` 的 `semanticReview` 七维 `reviews` 为准，已修复 A03/A04/A05 的133条章节锚点证据指向；每个题族保留各自的独立reviewerRef、实际SHA与判断依据。

**这是一份已经完成全覆盖审核的缺陷清单，而不是数学功能或教学效果全部通过的证明。**

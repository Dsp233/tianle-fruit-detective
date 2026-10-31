# 84 天课程数据候选（未发布）

本目录为完整工作包提供可复现的数据候选，不是正式上线许可。源为 GitHub `main` 提交 `98cfd12797013845c4771719778b9b5f62214308` 的试玩故事（Git blob `7e86fd67f5253b8fec3a15448147118beb636369`）；旧课程基线是 SHA-256 为 `0c8ad843af039308d749ce44f75ad74577b5fce96ffd009e18f770b13c849358` 的 `reading_data.js`。构建脚本会拒绝不同的输入。试玩拼音 fixture 来自该提交的已发布试听页，仍是程序生成读音，并非独立语文或语音验收。

## 数据合同

- `courseScope.activeCourseId = R2-84D-20261031`；旧课程材料和 13 套旧诊断材料标为 `R1-LEGACY`。旧材料正文、题目和历史诊断题不改写；新增 `courseId`。现有课程记录由实际引擎先备份原文，再按版本隔离。
- 每天 `R2-Dnnn-CORE` 有三个任务，`R2-Dnnn-EXTRA` 有一个自主挑战。两者 `text` 和 `exposureGroup` 相同；两者均是故事段落无分隔符拼接。`lesson.coreIds` 指向核心，`lesson.optionalIds` 指向额外挑战，`reserveIds` 空。额外挑战不是未见材料，不代表完成额外一天，也不是补强材料或诊断证据。
- 新题 `id` 为 `R2-` + 试玩题号，`sourcePreviewId` 和 `sourceQuestion` 保留完整原始合同；`material.source` 保存原始标题、故事段落和来源提交。正式新题的 `metadataStatus='unreviewed'`、`classification=null`，`category`、`ability`、`errorType` 均为 null。`prerequisitesStatus='unreviewed'` 不能解释为空先修要求已确认。展示原始答题、辅助和完成事实时，要把这些事实与任何能力、错因、周准入或诊断结论区分开。
- 第 33、54、74 天移除提前给出或预先验证答案的文本，第 54 天标题不再揭晓方案数量且第 3 题改为描述计划，第 32 天挑战明确交接双方。所有原文和原题均保留；新增/修订文本的拼音清单见 `candidate_report.json`，为自动生成，未经过独立语言验收。漫画分镜元数据是通用占位，不代表已完成画面内容验收。

题型字段与提交值合同如下；各题均带 `options`、`answer` 和说明，字符串／数组不按显示文本随意改写：

| 类型 | 提交值与专用字段 |
|---|---|
| `choice` | 单个选项下标；`answer` 是下标。 |
| `order` | 按顺序排列的选项下标数组；`answer` 为完整排列。 |
| `match` | 与 `matchLeft` 逐项对应、不重复的选项下标数组。 |
| `route` | 站点下标数组；`route.graph` 是题目已给的边与状态，`route.acceptedRoutes` 是可接受路线。不得先替孩子计算路线。 |
| `departure` | 当日分钟数；`departure.min/max/step/initial` 限定时间轴。不得先计算到达时间。 |
| `cargo` | 每件物品的趟次数组（1 或 2）；`cargo.weights/capacity/firstRequired/strictBefore` 描述约束。 |
| `pair` | 两个不同的选项下标，顺序不影响对错。 |
| `anypair` | 两个不同的选项下标；`answer` 是多个可接受组合。 |
| `sequence` | 由 A、B 组成的四字符字符串；`answer` 是全部可接受顺序。 |
| `loop` | `loop:n`，n 为用户选择的循环次数。 |
| `rule` | `blue` 或 `red`，加 `&` 或 `|`，再加 `square` 或 `circle`。 |
| `purchase` | `packs:a,b,c`，三数分别为各包装数量；用户自己核对张数和费用。 |
| `classification` | 每个 `items` 对应一个选项下标的数组。 |
| `strip` | 0、1 或 2，表示重叠厘米数；源选项顺序与下标一致。 |
| `grid` | 被选格子索引数组；`grid.rows/cols/area/perimeter/blocked` 描述约束。 |
| `mirror` | 被补充格子索引数组；`grid.fixed/editable/target` 定义固定、可编辑和正确格。 |
| `allocation` | 各组数量数组；`allocation.total/minimum` 描述总数及各组下限。 |
| `manifest` | 各包趟次数组（1 或 2）；`manifest.weights/capacity/maxItems/firstRequired` 描述限制。 |

## 生成和验证

`python build_course.py --help` 列出 `--story`、`--baseline`、`--pinyin` 和 `--out-dir`；默认读取本工作区已核对的输入。输出 `candidate_reading_data.json`、`candidate_reading_data.js` 和 `candidate_report.json`。JS 是网页注入的数据，不应直接覆盖现网文件。

在工作区根目录执行：

```sh
python safety-work/wp-course-data/test_course.py
node safety-work/wp-course-data/test_engine_candidate.js
node safety-work/wp-course-data/test_migration_candidate.js
node safety-work/wp-course-data/test_sequential_candidate.js
```

前三类数据/引擎测试检查原题和旧诊断保真、全部任务按原有答案合同作答、每题存储后重载、精确原始备份、旧首答及旧会话保留；最后一项使用一个合成档案从日历走完 84 天，覆盖自愿挑战、错后重试和未审校项隔离。Node 测试默认读取 `safety-work/wp-engine/reading_engine.js`，可用 `CANDIDATE_ENGINE` 指向最终集成引擎重新执行。所用答案源自题库，并非独立数学解题。所有测试都使用合成数据。

完成正式发布前还须验证最终打包页面及其存储实现、全部交互与探索辅助板、拼音及朗读、全部课程及诊断内容的独立教学/数学/语言审查、真实设备与儿童体验。未审校项目不应伪装为已通过的教学验收或已分类题目。

# W1 当前发布收口状态

> 执行依据：[`docs/engineering/DELIVERY_PLAN.md`](../../docs/engineering/DELIVERY_PLAN.md)，Release Closure **R1.1（2026-11-07）**。本文件只保留可执行缺口、关闭标准和版本证据。**先前完整日志已封存于 [2026-11-07 旧状态记录](DELIVERY_STATUS_HISTORY_20261107_BEFORE_R1_1.md) 与 [2026-11-02 历史记录](DELIVERY_STATUS_HISTORY_20261102.md)**；其中旧“当前”、旧 HEAD、旧 CI 待运行与暂停语句均非当前执行指令。

## 当前基线

- **已测运行源码** `0db2a94fa0703dea4fa0ba35512cb110b341b589`。完整候选 [CI 42393754619](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42393754619) SUCCESS，Chromium/WebKit、18 类控件、13 套旧诊断入口、迁移及配额时保留原始数据通过。该运行未执行 recovery staging，固定回退按定向证据复用。
- **完整工件** ID `13583125647`，ZIP SHA-256 `1d157a0817526ee7424d65333493c9c081da1221d7b35a8cc7c49a4f39db319a`，验收日志工件 `13583195319`。完整 `tested-package-inventory.json` 位于 CI 工件中。
- **独立私有预览** [iPad 验收地址](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site) 已部署。部署档案 SHA-256 `df8c90935ba1aeee556a8ee5848a8af3df06efcd5d26af0aa888cfdb01be5bef`。434 个部署运行文件在上传档案中逐项与 CI 工件比对一致。云端已见登录门槛，仍待所有者登录后的运行确认和实体听音。预览允许开始同字节设备验收。
- **G1**：336 项独立解题完成。172 处动态调用已归类，136 处有语境证据、29 处引用课程、5 处无汉字、2 处为原样转发。2,367 个渲染文本、48,679 个汉字位置逐字符对齐通过，剩余完整语境证据仍需按原合同确认。
- **G2**：同一 app SHA-256 `b642fea0f45a897297c0a6fb09fe3ceabc4d925dc08a974e9c24d56505b30ffb` 的数学草稿、配额、关闭重开、回退与原文定向证据见 CI [42391302669](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42391302669)、[42391993401](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42391993401) 和 [42392884944](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42392884944)，与最终集成版本对应。FIX15 回退软件 SHA-256 `7e40e30383d1a7e894d3e60e70135107439eb56100aec45960b0e4792f1a8f4d`，工件 `13122827352`。
- **发布状态**：已锁定本次真机待验包。G1 完整语境证据、G4-E 尚未通过，正式发布 RC 标记未启用，正式站仍为 FIX15，G5 NOT_RUN。

## 唯一未关闭项目（逐项按合同结项）

| 项目 ID | 当前状态 | 明确关闭标准 / 下一动作 | 可复用证据 |
|---|---|---|---|
| **G1-CONTENT** | OPEN | 复用台账的 336/336 独立解题证据；仅补题目及图文仍未覆盖的语言和拼音语境；不能凭措辞新增教师资格门槛。只有原合同明确要求的真人审核才列外部 BLOCKED，记录 ID 与验收人。 | 已完成 336 助手初核、挑战题 504 字段/4,008 多音候选检查、2,283 文本/38,249 字词典筛查；旧细节见历史记录 |
| **G1-DYNAMIC** | SCOPED CHECK PASS | 对 172 个动态调用点分类为已审常量、引用已审题库、涉及语境的可达组合、无需拼音的数字标识；仅补实际剩余的歧义和语境风险，给出关闭证据，不穷举无意义组合。 | 动态调用位置 JSON；闪光板“和为”和量词“只”定向测试；完整候选 CI 42384121021 |
| **G2-S1/S2** | TARGETED PASS | 已提交原文和已持久化草稿按同题同版本可恢复与继续；只补历史证据没覆盖的适用交互状态。 | CI 42382618286，原文/导出/隔离回退既有 CI |
| **G2-S3/S4** | TARGETED PASS | 普通数学卡片草稿的点击保存、关页重开续答、清空后再开和导航取消已双浏览器通过。双浏览器数字输入配额失败、重试和重开已通过。按受影响场景复用存储证据，等待完整包绑定。 | `safety-work/w1-checkpoint/w1-g2-draft-contract.md` 固定合同、旧事务阻塞和配额验证 |
| **G2-S5** | TARGETED PASS | 同版旧原文备份、全新隔离 profile 读回及失败保守；禁止未遵循锁的旧页面并发覆盖。 | CI 41398678479、41404695712、42382051157 等，按范围复用 |
| **G3-RC** | TESTED PACKAGE PASS | 所有 G1/G2 必修改动合批后，以**最终运行源码**通过完整 Chromium/WebKit/迁移/包清单验收；失败修相关项再测，最终留一套 PASS 的已测运行文件。 | CI 42393754619 适用于 0db2a94，文档更新不改变运行文件 |
| **G4-HOST / G4-IPAD** | DEPLOYED / DEVICE BLOCKED | 在独立 HTTPS origin 部署**最终已测文件**并核对哈希；实体 iPad Safari 操作/保存/朗读与真耳听音，同一包绑定证据。可先旧候选预演，不能冒充终版验收。 | 独立预览已部署；待所有者登录和实体设备结果 |
| **G5-DEPLOY** | NOT_RUN | 所有原合同门禁通过后，发布**同一组运行字节**至 GitHub Pages，公网核对及 FIX15 回退就绪。 | 无生产部署证据；生产保持 FIX15 |

## Work 立即执行的位置

按照唯一计划 §5，从 `G1-CONTENT/G1-DYNAMIC` 有限剩余项及 `G2-S1` 至 `G2-S5` 状态合同直接关闭，不再复核或重写规划。证据变更只更新相应条目，**已测运行源码 SHA / 构建包 ZIP SHA / 逐文件清单必须分别记录**。G1–G3 合格后冻结唯一 RC；随后同一运行文件完成 G4 独立预览和真机验收，全部通过再 G5。仅改文档不可重跑完整 CI。不启动 M/W2。


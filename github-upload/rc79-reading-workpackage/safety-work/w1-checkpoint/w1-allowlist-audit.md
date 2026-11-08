# W1-R3-ALLOWLIST 公开范围核对

对照 main `23755d3aa9bf9e479468bb24263f81ea8228430e` 的实际文件及 `muse/rc79/manifest.json`。三个 QA 路径均是现有公开验收入口，也是原正式 manifest 的受检路径。沿用 [原冻结清单](w1-g5-allowlist.json) 的替换范围。

| 路径 | 已有用途 | 冻结页声明的数学键 |
|---|---|---|
| `qa/index.html` | 结构和题目验收 | `tianle_amc8_qa_rc79_v1` |
| `qa/normal/index.html` | 正常流程验收 | `tianle_amc8_qa_normal_rc79_v1` |
| `qa/history/index.html` | 历史数据回归 | `tianle_amc8_qa_history_rc79_v1` |

冻结 ZIP 中直接读取这些 HTML，核对键与 main 一致。冻结 `source/reading_ui.js` 以 `STORE+'_reading_r1'` 派生阅读键，因而三个入口的阅读键也与正式学习页区分。首页、三个正式入口和三个 QA 页面未引用评审脚本。评审预览的脚本、样式、身份及补充版本页均排除于 G5。

原清单的 9 个替换、28 个新增、402 个保留和零删除已由 W1-R1/预检计算。依原收据，9 个原值均与 main blob 匹配。回退采用保存的生产基线恢复这些旧文件和实际部署 manifest。新增哈希资源在旧缓存需要时保留，原始学习记录单独保护，避免将新数据覆盖成旧数据。如果数学保存修复形成新候选，须从新签收工件重新计算路径及哈希，并保持同样的公开范围约束。

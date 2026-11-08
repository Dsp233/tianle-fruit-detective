# G0-A 源码入口和加载路径

审计候选树 `a788729a70c4ef72ffa22fce088f179417f7496b` 与生产 main `23755d3aa9bf9e479468bb24263f81ea8228430e`。工作流和目录按 Git 树登记，运行实现以冻结工件 13595790278 的构建输入和成品为准。

| 层 | 实际入口及依赖 | 审计重点 |
|---|---|---|
| 学习入口 | 根 `index.html`、`source/index.html`、`amc8/index.html`，按 LOAD2 清单加载 `assets/loading-r2` 分片及 LOAD1 基础资产 | 从每个部署入口反向核对引用，保留仍可被旧缓存引用的哈希资产 |
| 数学 | 成品源 `source/app.js`、`exam_mapping_ui.js`、题库及映射、TransferEvidenceStore、progress_store.js | app 和 RTM1 共用同一数学记录。写入时序变化会跨题组、提示、首答和返回入口扩散 |
| 阅读 | `wp-course-data`、`wp-engine`、`wp-ui` 生成 `reading_data.js`、`reading_engine.js`、`reading_ui.js` | 新旧课程按内容身份和会话隔离，旧 13 套诊断继续访问 |
| 家长与历史 | 数学/阅读应用内入口及 `academy/index.html`，阅读原文和数学版本化导出 | 记录与内容版本配对。查看/导出路径需与写入授权隔离 |
| 存储 | 数学 `STORE`，阅读派生 `STORE+'_reading_r1'`，QA 有独立前缀 | Web Locks 兼容与 IndexedDB 写入确认均是接口边界 |
| 评审 | 私有 QA 首页附加独立脚本和本地键 | 部署和身份单列，正式候选使用原冻结字节 |
| 构建 | HOME1 工件、FIX6 基础、FIX15 overlay、W1 assemble 和 stage | 根树 `source/` 主要是入口和解包脚本，完整源码由构建工件和覆盖层复原 |

实际风险路径优先于体积。编译器、运行时数据与数据写入协议的耦合值得定向治理。历史路径、素材和旧 CI 的文件数量本身不能证明可删除。

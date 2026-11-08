# W1 发布预检与评审预览收据

2026-11-08 北京时间。候选分支输入 HEAD `1acbb4d050ec2ba2d6b322bc46dd2c1ee159afeb`，正式 main `23755d3aa9bf9e479468bb24263f81ea8228430e`。冻结学习源码 `c8575da9d28c40b5bf79412928a0be8c397e7094`，沿用 [CI 42425597193](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193) 及 [冻结收据](w1-final-rc.md)。

| 工作项 | 状态 | 实际证据 |
|---|---|---|
| W1-R1 | PASS | 已下载工件 13595790278 和 13122827352。原候选 ZIP、回退外层 ZIP、内层 FIX15 软件 ZIP 及全部 8,920 个候选清单文件逐一校验。 |
| W1-R2 | PARTIAL | 独立私有预览访问阻断的历史事实保留。已有冻结 CI 覆盖 18 类交互、13 旧诊断、迁移与配额，详见冻结收据。此次真实页面定向结果见下。仓库可读证据未提供 Muse 26 核心与 8 扩展的逐项 ID，故未将汇总转换为逐项 PASS。实体设备、真人听音和儿童体验归项目最终 UAT。 |
| W1-R2-QA | DEPLOYED | 沿用原私有项目 `appgprj_6aef58cf667881918469b0e9672bdc5c`。部署 `appgdep_6aefc788b4a881918aa4d90e14ffe7cf`，私有版本源码 `535f93f90dc192db6215a7ad13bf4b33345ae6e7`。 |
| W1-R3 | MANIFEST_READY | [逐路径提升与回退清单](w1-g5-allowlist.json)对比冻结 ZIP 与 main Git 树，9 项替换、28 项新增、402 项原样保留，零删除。9 个原文件的 SHA-256 均由回退 ZIP 读出并与 main Git blob 校验。 |
| W1-G5 | NOT_RUN | 公网首页和版本清单回读均与当前 main Git blob 相同，显示 RC79-FIX15。当前任务授权为发布准备和私有预览。 |

## W1-R2-QA 实际浏览器观察

- 云端 Chromium 打开完整冻结 W1 生成的 QA 首页，使用隔离预览 origin 和合成学习数据。开启评审后点击数学入口，弹出批注编辑器且未导航。退出评审后进入真实数学选题，保存主题并创建练习组。
- 在真实第 1 天阅读题提交错误选项。评审批注另一选项时原首答未被替换。刷新后仍可续做且页面显示第一次回答已保留，退出评审后可继续提交。
- 数学提交过程曾显示「本次记录未能保存」。随后在同 origin 无 overlay 的冻结 `/source/index.html` 读回同一练习、原选项 24 和「首次作答已保留」。再回 QA 首页续做，对另一个选项 16 添加批注后，已提交选项 24、提示与首答标记保持一致。需定向检查保存提示时序，当前证据未定位提示成因。
- 在评审清单触发浏览器 Markdown 下载事件，复制的 Markdown 内容包含数学及阅读批注和元素定位。刷新后原两条批注仍在，追加数学题批注后再次刷新计数为三条。浏览器操作为实际编译页面。未逐字导出比对学习存储，也未重新运行 QA 版本的全部 18 类控件或 WebKit。尝试本地启动完整 Playwright 回归时 Chromium 进程创建 socket 返回 EPERM。
- Q0 的任意文件名/清单标题编辑仍按总计划后续验收。本次只验证当前按版本日期生成的导出。

## 预览包和正式提升分开

- 本地 QA ZIP SHA-256 `894fdcb08a3cb35a13d0f89f35cd11d863aa7ca3e3ee5a592f705e5c86674846`。实际上传档案 SHA-256 `1b85c25162569a2b6ff525edc9fb3ae5e4d473ed04778ca191d2a08802bae973`。
- 440 个列入 QA 清单的文件包含 436 个与原冻结预览相同的文件、替换首页、两份评审资源和补足原页脚路径的 QA 版本页。首页原 SHA-256 `3987fb1d6ef0f7844c15f2d6c9b10c97e48390f7d6e9adaf70c984550a1620bc`，QA 首页 `de57e0fae05f56bd6f392042abaa9edd41b0feb7eb4c066d7d27dafd07baac72`。移除注入片段后首页与原件逐字节一致。五个 HTML 的显式本地链接与脚本入口均可在静态目录解析，生产七个入口的 69 个哈希载荷亦核对存在。
- 保留 `/tested-runtime-inventory.json` 地址，当前回读为 QA 身份。QA 文件清单 SHA-256 `561f80406aef417638df41f571fb80264c397ae95c6d0f707cf4896035937c68`。部署后使用授权 HTTPS 实际回读首页、评审 JS/CSS 及两份身份文件，5 个文件与上传目录逐字节一致。[预览首页](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/) · [QA 文件清单](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/review-preview-identity.json)

## G5 接力条件

1. 采用 [原版提升清单](w1-g5-allowlist.json)从冻结 CI ZIP 逐项提取，保留旧缓存引用的原资源及其他历史路径。若 main 前进，比较实际路径并重算差异。单独准备外部部署身份收据。
2. [现有 Pages 部署记录](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/41307028572)确认当前 main 由 GitHub Pages 动态工作流成功部署。现有 FIX15 公网工作流会因首页或版本清单变化触发，`public_wait.py` 硬断言 FIX15。适配 W1 公网核验后再提升。连接权限对 branch protection 返回 403，授权执行者在写入前核对仓库保护和 Pages 设置。
3. 补齐可取得的独立浏览器软件用例映射并复查数学保存提示。执行 G5 时，凭冻结文件清单验证生产字节、数学和阅读入口、记录保存与刷新。若需回退，只恢复原生产文件及对应清单，另行保留新增学习记录和故障证据。FIX15 数据恢复在匹配软件的全新隔离 profile 使用原文，遵循既有回退合同。

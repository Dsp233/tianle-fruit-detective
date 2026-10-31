# 完整页面浏览器验收脚本（候选，尚未执行）

`test_compiled_browser.js` 加载真实编译后的应用页面，可接收原始候选或已完成 LOAD2 打包的候选目录。页面通过本机临时 HTTP 服务访问；课程数据来自页面本身，模拟档案不会访问或修改真实用户数据。

在提供 Playwright 1.57.0、Chromium、WebKit 和 Linux 系统依赖的环境中执行：

```bash
node test_compiled_browser.js CANDIDATE_ROOT OLD_READING_DATA_JS FIX15_READING_ENGINE_JS OUTPUT_DIR
```

例如在现有 Actions 的 Playwright noble 容器中，将仓库、候选目录和输出目录挂载后运行：

```bash
NODE_PATH=/work/runtime/node_modules node /work/repo/github-upload/rc79-reading-workpackage/safety-work/wp-integration/browser/test_compiled_browser.js \
  /work/candidate \
  /work/baseline/reading_data.js \
  /work/repo/github-upload/rc79-fix15/overlay/source/reading_engine.js \
  /tmp/wp-evidence
```

`OLD_READING_DATA_JS` 必须是已核对的 FIX15 旧版 `reading_data.js`，不能用候选数据替代；`FIX15_READING_ENGINE_JS` 是 GitHub main 的 FIX15 原始引擎。默认按顺序测试 Chromium 与 WebKit；若仅运行单个引擎，可设置 `BROWSER=chromium` 或 `BROWSER=webkit`。两个浏览器全部成功时输出 `compiled-browser.json`；失败输出 `compiled-browser-error.json` 并以非零代码退出。

脚本通过页面中的真实控件，对 18 种题型各选一题作答；覆盖拼音节点显示、触控模拟、首次错答与正确重试、刷新恢复草稿、同文自愿挑战、未评级家长显示、探索及语音请求记录、数学记录原文不变、旧课首答与草稿迁移以及备份配额失败。答案由候选题库本身提供，不能证明独立解题、内容正确性或教学等值。语音只验证请求记录，触摸来自浏览器模拟；真实声音、实体 iPad 和儿童体验均未测试。

当前工作区仅执行过 JavaScript 语法检查及旧版合成数据种子准备检查；由于本机浏览器二进制缺失，Chromium/WebKit 测试尚未实际运行，必须以 Actions 的真实结果为准。

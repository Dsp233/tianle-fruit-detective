执行 AMC8 真实代码评审专项 CR2，仅修复 CR-003。仓库 https://github.com/Dsp233/tianle-fruit-detective 。本提示词仅在用户明确发送作为授权后生效。

先核对最新 main、CR0 Draft PR #54 和 CR1 Draft PR #55 的真实 SHA 与状态，读取 CR0 报告、复现脚本、原始日志和 CR1 阶段报告。基于最新 main 创建独立 CR2 分支，按实际候选差异处理依赖，不擅自合并或发布其他 PR。

CR-003 已复现：阅读 CSS 独立变更可触发 w1-reading-quality，但已有 reading-art/release.json 导致 art=true，阅读布局、规则和双引擎步骤跳过；插画工作流的路径过滤不覆盖该 CSS。CR0 在隔离 checkout 将正文宽度改为 2000px，双引擎 390px 视窗各 31 个汉字出界，而现有 Identify 验证仍成功。读取实际工作流及 reading-art/browser.py，保留当前插画联合检查中有效覆盖，不误称所有检查都失效。

建立并执行修复前红、修复后绿的反例，覆盖阅读 CSS 独立变更、阅读逻辑独立变更、插画独立变更及混合变更。验证真实 GitHub Actions 对相应 PR 的触发、步骤和结论，保留损坏插画应失败的对照。测试故障注入仅限隔离副本，原始日志与 SHA 可追溯。禁止把本地路径匹配模拟当作 GitHub 服务端触发结果。

最小化调整适用 workflow/检查，确保当前 release 的阅读和插画变更运行相应的浏览器、规则和数据保护检查。旧 reading-quality/check.py 默认入口依赖历史构建器，先核查实际影响，不盲目取消条件运行导致覆盖入口。保留学习数据、Q0、数学及课程内容，不清理用户存储。复用 W1 有效证据，不重审84天课程、336题，不启动 M1、M2/W2。

在独立 Draft PR 中提供真实基线和候选 SHA、触发矩阵、红转绿日志、Chromium/WebKit 证据及遗留风险。未执行标 NOT_RUN。不修改 main、不合并、不部署、不启动 CR3。完成 CR2 后立即停止，等待人工评审。

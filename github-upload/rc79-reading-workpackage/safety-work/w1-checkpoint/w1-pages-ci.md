# W1-R3-PAGES-CI

候选工作流按 Git 中的正式 manifest 识别 FIX15 或 W1。FIX15 保留原验证，W1 使用 `deliveryRevision: RC79-W1`、`sourceCommit`、`w1ArtifactId` 和 `w1AllowlistSha256` 绑定原版清单。签出字节与候选不一致即在等待 Pages 前退出。上线后以独立 W1 字节检查逐项核对公网文件并上传收据。G5 的浏览器烟测仍按原发布合同执行。

使用已下载的冻结 ZIP 运行 `python3 github-upload/rc79-reading-workpackage/safety-work/w1-checkpoint/test_public_release_contract.py <frozen.zip>`。FIX15 识别、W1 冻结字节、QA/过期首页拒绝及错误源 SHA 拒绝均通过。另验证 GitHub Actions YAML 及所有旧步骤的 FIX15 条件。当前在候选分支验证，生产触发与公网收据留给 G5。

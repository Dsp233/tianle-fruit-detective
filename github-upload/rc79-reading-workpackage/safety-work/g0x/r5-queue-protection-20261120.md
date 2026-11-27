# M1 R5 队列分支保护验证 · 2026-11-20

- [规则集 27690779](https://github.com/Dsp233/tianle-fruit-detective/rules/27690779) 已启用，精确匹配 `refs/heads/rc79-reading-workpackage-20261101`。要求 PR、至少一次独立审批、最后可审核推送由他人同意、审批随可审核的更新失效、最新基线和 GitHub Actions 的 `validate-queue`。禁止强推和删除，绕过名单为空。
- 分支基线 `4e6f4264c030c6ef2de7e5220fa83bf25128d662`（[#76](https://github.com/Dsp233/tianle-fruit-detective/pull/76)）。已核对 main 的有效分支规则为空，另一个演练分支只适用其原规则集 27599557。
- GitHub 服务端直更负例：在该基线上构造与基线 Git 树完全相同的测试提交 `fa9fd79c52acc5830a2f263f01a61d679090b30d`，以非强制方式直接更新队列 ref。服务端拒绝，明确要求通过 PR 并提示 `validate-queue`。当前测试凭据的直更已被阻断。无法据此证明旧 Work 进程已经停止，或识别其具体凭据。
- 此验证 PR 仅增加本收据，用于观察新规则下的正常 PR 路径。队列 JSON、租约、题库、学习记录和正式站不属于此 PR。
- G0-X rev 289 持有原租约 `6b303209-b1e1-492f-880a-2d82b165f729`，候选 `c732284e991023398aa9ebec454fcc59901ee90c`，29/84 PASS、0 ISSUE，下一题族 `J-D01-01`。正式恢复须满足原状态机的证据要求及独立评审身份要求，再经受保护的 PR 路径更新。

# CR1 阶段验收报告

状态：READY_FOR_HUMAN_REVIEW。审查基线 `05f73af21ddf35134bb7c5e598cd75845e82baf2`，实测候选 `df5d167b5aed07fe1da329d8667d07f6bfa4b662`，CR0 PR #54 HEAD `69dde6a12703266d5f1e2825aa360b41283d309d`。

CR-001 修复在 `review-overlay.js`：失败时保留内存中的新增、编辑、状态、删除、元数据和显示状态，在评审清单提供重试按钮和刷新会丢失的明确提示，按持久化结果决定是否显示成功。删除失败时导出包含待删除批注的完整 JSON 信息。重试保存同一份内存状态，无需再次新建批注。现有 key 和 schema 保持不变。持久化持续失败时必须在关闭或刷新前导出。

候选 `q0-production-identity.json` 更新了 review-overlay.js 的 SHA-256，以匹配现有 Q0 预检；此文件的旧 browserEvidence 仍记录历史发布证据，本次候选证据见下方。新增 CR1 测试和只在该分支触发、只读权限的 GitHub Actions。未引入 CR0 故意失败工作流。

[双引擎红转绿 run 44020590521](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44020590521) 的 [原始 artifact](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44020590521/artifacts/14300961989) SHA-256 `7fe4fa3be7a618f95827f9e5ba3d34157dd88c240b89e447ba08ef1d69eadf9b`。Chromium 143.0.7499.4 和 WebKit 26.0。每种引擎分别对新增、编辑、标记状态、删除进行正常及注入 QuotaExceededError 的基线和候选测试。旧版故障 8 个 FAIL，候选故障 8 个 PASS，16 个正常对照 PASS。清单状态、清单删除、标题元数据的每个引擎各 3 个连续写失败、导出、恢复重试、刷新对照共 6 个 PASS，实际每例注入三次失败。候选各例含隔离合成的数学/阅读 key 字节不变验证。正常历史批注测试使用一条合成记录，不能推断覆盖全部历史版本和并发场景。

[既有 Q0 双引擎预检 run 44020595253](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44020595253) PASS。测试脚本绑定 baseline worktree 到上述 SHA，候选通过测试提交检出目录，禁止仅修断言。机器结果和日志摘录分别见 results.json、run.log。完整日志及 artifact 保留在 Actions。前期测试失败见 [44019783590](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44019783590)、[44019848186](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44019848186)（重试放在刷新后），[44020059656](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44020059656)（恢复函数时测试框架错误调用），均修正测试脚本并重跑。候选修改前 identity 不匹配的 [44019869068](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/44019869068) 失败，更新清单后通过。

剩余限制：未验证真实 iPad、Safari 实机和多标签同时写 Q0；故障数据仅在当前页面内存可用，刷新前应导出。修复前 FAIL 是预期基线结果，不是候选测试失败。CR2、合并和部署均未启动。

建议 CR2 专门处理 CR-003：在当前 release 下按变更实际触发阅读布局、规则和插画适用检查，保留 CSS 损坏反例、插画损坏对照，以及真实 PR/工作流触发证据；先核对旧 check.py 对历史构建的依赖，不能直接无条件启用旧构建器。

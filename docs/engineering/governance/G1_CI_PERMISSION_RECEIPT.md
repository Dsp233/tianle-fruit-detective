# G1 CI 权限收敛

以 [#72 隔离候选 `a25e0fb`](https://github.com/Dsp233/tianle-fruit-detective/commit/a25e0fbe7857b3b12ab5aef3a8ad6c79d285b78a) 为基线。使用同一 Git 树比对工作流、触发器、job、命令、检出设置与 artifact 步骤。新工作流将逐 job 的权限差异导出为 `g1-ci-permission-inventory`。

| 范围 | 候选的变更 |
| --- | --- |
| 30 个原来从 workflow 继承写权限的 job | workflow 显式使用只读默认值，只在原有的 staging job 声明原权限。 |
| 36 个确有 Git 写步骤的历史 job | 保留其 Git 写步骤和原触发。35 个受固定旧分支与路径约束。RC78 手动 staging job 另由 `refs/heads/rc75-release` 条件约束。 |
| 只读 checkout | 关闭 checkout 后的凭据持久化，保留原 checkout 的深度、引用和路径。跨运行下载继续使用其已有的 `actions: read`。 |
| 发布、回退、真机与 M1 | 生产验证仍沿用其原事件、条件和脚本。原隔离 workpackage 的队列、M1 候选与旧租约不在本次提交范围。 |

## 如何复核

- 在候选提交运行 `python -B code-review/G1/ci_permissions.py --inventory /tmp/ci-permissions.json`，核对两棵 Git 树之间的准确改动。比较器拒绝旧流程删除、触发变动、越权 job、只读 checkout 凭据回退，以及任何超出命名工程文件和工作流的改动。
- `python -B -m unittest discover -s code-review/G1 -v` 检查正常和拒绝路径，包括对历史写入来源、生产分支、检出引用和原步骤的限制。
- 回退该工作流候选时，回撤提交后将全 Git 树与 `a25e0fb` 对照。生产 Pages 或候选分支的 staging 与回退应在各自授权的版本和目标验证。

## 仍待生产验证

这次权限收敛保留了原有写 job 的有效权限和验证逻辑，历史写步骤在当前迁移候选上未触发。测试只覆盖隔离候选的权限配置、触发保持和运行文件身份。仓库默认 Actions 权限、main 生产规则与实际生产写入或回退分别由管理员配置或版本授权后验证。[#73](https://github.com/Dsp233/tianle-fruit-detective/pull/73) 和 [#74](https://github.com/Dsp233/tianle-fruit-detective/pull/74) 继续作为原隔离门禁的正反例。拟进入生产的最终 Git 树变化后，须重新登记候选身份，继承适用的冻结运行证据。

# M1 R5 orphan recovery 隔离检查

- 检查基线：工作分支 HEAD 4457339cfc8065e180a4f03d6a2de5fa922a9e7c；G0-X revision 280。
- 目标旧租约 6b303209-b1e1-492f-880a-2d82b165f729，owner r5-reviewer-6Yy315，2026-11-15T00:53:02.375Z 到期。用户说明原 Work 会话达到上限；未取得其停止回执，无法断言后台已停止。
- GitHub branches API 返回 protected=false；仓库 rulesets API 返回空列表。branch protection 详情接口返回 403 Resource not accessible by integration。当前 GitHub connector 未暴露设置分支保护或撤销旧会话凭据的接口。
- 现有 queue-core.mjs 客户端校验 owner、lease ID、有效期。queue-cli.mjs 以非强推提交实现并发检测。以上只能约束遵循该实现的写入；具备分支写权限的旧进程仍可自行构造快进提交，服务端未验证 queue 状态及 epoch。仅增加 leaseEpoch 字段不能证明完成写入隔离。
- 根据用户指示，不能建立有效写入隔离时维持原租约。未释放租约、未新增独立签收。原候选 c732284e991023398aa9ebec454fcc59901ee90c，29/84 PASS，下一族 J-D01-01。
- 恢复需要仓库管理员提供可以实际实施和验证的服务端写入隔离，例如撤销旧执行者专用写凭据并将队列写入限定给可信执行者；或提供具备管理权限且旧执行者不可绕过的分支规则与受控写入服务。必须用旧凭据尝试写入的拒绝记录及新执行者成功写入记录验证；若旧、新会话共用同一不可区分的身份，需先分离身份。不得以无法取得的停止回执冒充证据。

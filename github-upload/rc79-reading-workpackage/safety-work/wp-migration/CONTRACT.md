# 阅读记录预检与暂存接入合同（未上线）

基线：GitHub main `98cfd12797013845c4771719778b9b5f62214308` 的 FIX15；其构建沿用 FIX14 的 `progress_store.js`，Git blob 为 `a8e63eba2669bf02755682d80fdfde0cc79dc59c`，FIX15 的 `reading_engine.js` Git blob 为 `4833cee12d7c90bd2c2fedafb4af844f10d6f3fb`。FIX15 目录下也有同 blob 的存储文件，但它不在 FIX15 overlay 清单中，CI 显式使用 FIX14 源文件。这是安全保护原型，不是恢复功能或旧软件回滚功能。

## 接入

1. 从当前站点固定的数学存储名派生 `readingKey = STORE + '_reading_r1'`，不得从备份文件或网络内容决定要写入的键。先从现有导出流程取得用户选择的备份文件，在本地调用 `inspect(text, {currentContentHash, knownContentHashes})`；明确展示候选来源、原文是否为精确副本、结构与版本提示。不要把“结构可读”或哈希一致说成来源可信、学习内容有效或能安全恢复。不要自动选取一个候选覆盖记录。
2. 对用户选定候选调用 `preflight({storage, readingKey, candidate, currentContentHash})`。该方法只读当前阅读键，返回原始基线及结构、事件 ID 内容冲突、草稿 ID 重叠、无 digest 的旧归档与版本提示；不检查数学键。基线与候选均可能包含私人学习记录，不应写进日志或上传遥测。检查只说明发现的风险，不证明正式引擎接受或可恢复。
3. 可通过 `buildBundle({readingKey, expectedRaw: preflight.baselineRaw, candidate, currentContentHash})` 生成待下载的本地 JSON 内容。其包含精确当前阅读原文和候选原文；如需下载，应调用既有的本地导出方式并让家长知道该文件包含学习记录。此步骤不写入存储。
4. 如需额外暂存，调用 `stage({storage, progressStore: ProgressStore, readingKey, expectedRaw: preflight.baselineRaw, candidate, currentContentHash})`，检查结果为 `ok: true, code: 'STAGED_ONLY'`。此过程使用现有阅读写入序列，并在 `readingKey + '_recovery_stage_' + digest` 单独保存一个同时含基线和候选的包；它不会将候选写入阅读主键或数学键。存储冲突、失败或不确定时应保留原文件并提示用户先导出，不得表示恢复成功。稍后可调用 `readStage({storage, progressStore: ProgressStore, readingKey, stageKey})` 检查包的键和内容摘要；摘要用于发现内容变化，不是签名或来源认证。基线可能在暂存后再次改变，未来真正恢复时必须重新核对。
5. **不要接入合并按钮。** 目前 `mergeIntoCurrent` 与 `mergeAndConfirm` 始终返回 `RESTORE_NOT_IMPLEMENTED`，不调用正式引擎。FIX15 的 `importBackup` 会跳过没有 digest 的旧课程归档，也可能跳过同 ID 草稿；未来如实现恢复，须先设计完整归档、草稿、设置及事件保全、事务、失败导出和回滚并独立测试。不可通过改掉这一保护来解锁发布。

输入和生成的整个暂存包均限制在 16,000,000 个 UTF-16 代码单元以内；结构预检另有深度、节点数和事件数上限。超过上限应保留原文件并停止，不能截断或覆盖。

## 已覆盖

- `node test_reading_recovery.js`：8 组，使用合成记录及异步 IndexedDB 模拟器，覆盖 FIX15 的阅读/统一备份格式、精确原文、无 digest 归档警告、事件与草稿 ID 冲突、只读预检、数学记录不变、独立及并发暂存、重复暂存、篡改检查、基线变化、配额/锁/读取失败、旧锁保护和恢复入口阻断。
- 测试使用的 FIX15 正式存储源码经过 Git blob 校验；当前工作区可通过 `READING_STORE_PATH="$PWD/safety-work/fix14/overlay/source/progress_store.js" node safety-work/wp-migration/test_reading_recovery.js` 复现。
- `test_reading_recovery_browser.js` 已通过语法检查，设计覆盖两种浏览器的真实 IndexedDB、双标签基线变化、事务前变化、配额失败和数学记录保护。

## 尚未覆盖

- 浏览器脚本还未运行；当前工作区没有 Chromium/WebKit 可执行文件。也尚未接入页面、运行打包后测试、测试真实 iPad Safari、真实记录或独立验收。
- 尚无恢复合并、旧软件一键回滚、跨设备真实性证明或老式永久锁异常退出后的自动解除。摘要不能防止有权篡改存储的人同时替换数据和摘要。
- 保存暂存包仍依赖设备空间和存储可用性；异步结果未确认前关闭页面，不能假定已保存。

## 现有 GitHub Actions 环境

现有 `rc79-reading-migration-audit.yml` 已安装 `playwright@1.57.0` 并使用 `mcr.microsoft.com/playwright:v1.57.0-noble` 容器。把三个恢复文件放在同一仓库目录后，可在该工作包的集中 CI 中添加以下步骤；更改目录时同步修改 `RECOVERY_DIR`。容器在内部启动临时 loopback HTTP 服务，无需对外网络。**环境和接口已核对，以下浏览器命令尚未实际执行。**

```bash
RECOVERY_DIR=github-upload/rc79-reading-migration-audit
test "$(git hash-object github-upload/rc79-fix14/overlay/source/progress_store.js)" = a8e63eba2669bf02755682d80fdfde0cc79dc59c
READING_STORE_PATH="$PWD/github-upload/rc79-fix14/overlay/source/progress_store.js" \
  node "$RECOVERY_DIR/test_reading_recovery.js" > /tmp/migration-evidence/recovery-unit.json
for browser in chromium webkit; do
  docker run --rm --init --ipc=host \
    -e NODE_PATH=/work/runtime/node_modules \
    -e READING_STORE_PATH=/work/repo/github-upload/rc79-fix14/overlay/source/progress_store.js \
    -e BROWSER="$browser" \
    -v "$PWD:/work/repo:ro" -v /tmp/migration-browser:/work/runtime:ro \
    -w /work/repo mcr.microsoft.com/playwright:v1.57.0-noble \
    node "$RECOVERY_DIR/test_reading_recovery_browser.js" \
    > "/tmp/migration-evidence/recovery-browser-$browser.json"
done
```

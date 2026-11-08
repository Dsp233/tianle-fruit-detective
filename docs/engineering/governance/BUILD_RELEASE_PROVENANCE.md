# G0-A 构建、工件、发布链

1. `rc79-reading-workpackage.yml` 下载 HOME1 run 40294526884 的 `home-h1-frozen`，再解包、执行 FIX6/FIX15 基础转换和 W1 课程构建。
2. `wp-integration/assemble_candidate.py` 在临时根检查基础及替换文件哈希，应用 W1 数学存储适配并调用原 build。FIX15 打包脚本生成多入口分片及报告。课程构建和打包先验身份，再运行浏览器。
3. [G3 CI 42425597193](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193) 输出 13595790278，源码 c8575da9，ZIP SHA-256 ad38df5d92fce91898ca57f4cc7a7478fd1c9f5fbe55538b0a94010227cd1cf0。清单有 8,920 文件，包含非运行目录。G5 只选 439 项。
4. 私有 QA 预览独立部署，在原 437 文件基础上以可逆注入增加评审层。原 G4 和新 QA 回读分别留证。
5. G5 envelope 在 pinned main 上 staged 验证，正式 Pages 依生产分支的实际部署及 W1 公网读回确认。生产阶段的 G5 尚待执行。

HOME1 工件 12637348462 在 2027-01-24 到期，回退工件 13122827352 在 2027-01-31 到期，W1 最终工件在 2027-02-05 UTC 到期。依赖证据见总计划 §8。短期保全需保留原 ZIP、清单、锁定输入和读回哈希。替代源须经过复建对照验证，成功 CI 历史记录不足以证明字节可恢复。

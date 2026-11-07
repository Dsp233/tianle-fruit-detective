# AMC8 W1 冻结发布候选

状态 **RC_FROZEN / G4-E BLOCKED / NOT_RELEASED**。唯一候选源码 `c8575da9d28c40b5bf79412928a0be8c397e7094`。后续证据提交沿用这套运行字节。

| 项目 | 固定证据 |
|---|---|
| G1 内容和注音 | PASS。336 项独立解题，252 核心题和 84 挑战题的限定语言审查，2,367 条渲染文本和 48,684 汉字位置对齐，172 处动态调用归类。见[语境结项](w1-g1-course-context-closure-20261108.md)和[逐题台账](w1-g1-bounded-release-ledger.json)。 |
| G2 数据保护和回退 | PASS。沿用同 app `b642fea0f45a897297c0a6fb09fe3ceabc4d925dc08a974e9c24d56505b30ffb` 和 store `04b1f2d6351b1afa77ae44502efcefe6b542e1a398681c1d46d2eb713a6a998d` 的[草稿/配额/竞争/回退证据](w1-g2-draft-contract.md)。最终包双浏览器验证旧原文、首答、续做和迁移配额保守处理。 |
| G3 最终完整集成 | PASS。[CI 42425597193](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193) 绑定此运行源码，Chromium/WebKit 各验证 18 类控件、13 套旧诊断、迁移和配额保护。FIX15 隔离恢复复用同字节定向证据，未重跑原型。 |
| G4 独立 HTTPS | PASS。 [私有 iPad 预览](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site)，部署 `appgdep_6aefb65564a881918aa95aa80a9bcdca`。静态档案 SHA-256 `6305ee9e492e8b3926c2a9cdf39cd4dae8aa299a15c697a5ef3f4233bada3a6d`，437 个 CI 文件逐项一致，部署后使用托管服务授权回读 55 条入口及资源并比对 SHA-256。 |
| G4-E 真机与实际声音 | BLOCKED。等待实体 iPad Safari 完成[验收清单](w1-ipad-audio-evidence.md)，需实际听音。 |
| G5 GitHub Pages 与公网验收 | NOT_RUN。收到与本 RC 匹配的 G4-E 证据并通过后，按 R1.1 提升同一运行字节，检查正式站和回退可用性。 |

- [完整 RC ZIP 工件](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193/artifacts/13595790278) `13595790278`，SHA-256 `ad38df5d92fce91898ca57f4cc7a7478fd1c9f5fbe55538b0a94010227cd1cf0`，共 8,920 个清单内文件。包内 `tested-package-inventory.json` SHA-256 `79f78787ccc4c519549003315511fe93c00d791dd940f992b2be5dcfc0e3a324`；[CI 日志工件](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42425597193/artifacts/13595114397) `13595114397`。GitHub 当前保留至 2027-02-05 UTC。
- [预览逐文件清单](https://amc8-w1-device-preview.surprisingsheep.chatgpt.site/tested-runtime-inventory.json) SHA-256 `938e7b05f1c72074d3af82614b33ab2964fc729726a030c005e679242797f916`。预览只承载学习入口、运行资产及候选打包报告。历史版本索引页留在生产站；本次设备测试以预览清单的 `sourceCommit` 核版。
- [FIX15 固定回退工件](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/41404695712/artifacts/13122827352) `13122827352`，外层 ZIP SHA-256 `34e071de6fe1825b67cc078618f3beca1851ce840ac73d0af6ff3001c7e26f69`，内层 FIX15 软件 ZIP SHA-256 `7e40e30383d1a7e894d3e60e70135107439eb56100aec45960b0e4792f1a8f4d`。GitHub 当前保留至 2027-01-31 UTC。回退使用匹配原文及隔离 profile，保留源记录。

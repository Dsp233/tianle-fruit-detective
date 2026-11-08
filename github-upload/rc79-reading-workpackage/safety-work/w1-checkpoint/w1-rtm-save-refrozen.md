# W1 RTM1 修复后的冻结候选

- 比较基线 [CI 42447148913](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447148913)，两引擎、三版本同一操作。FIX15 同步确认，原 W1 与 QA 异步误报，判为 W1_REGRESSION。详细记录见 [三版本收据](w1-math-compat-42447148913.json)。
- 修复源码 `f935008b75d79cfc44610b197122c01e1b6b9a6e`。已通过 [CI 42447571460](https://github.com/Dsp233/tianle-fruit-detective/actions/runs/42447571460/job/128629630992) 的完整编译候选 Chromium/WebKit 和 RTM1 定向测试。两引擎打开练习不需刷新，首答与草稿能刷新读回，配额异常保留原记录与待写内容，异步接受与持久化确认之间不显示失败。VM 另验证错误/不匹配确认不执行回调、正确确认只执行一次。真实设备和听音留在最终 UAT。
- 工件 13604511680，ZIP SHA-256 `691e39be468335977f615b4d96497ff81d6b2f38dc7cee6ff0e6f0e44ec00e21`，包内 `tested-package-inventory.json` SHA-256 `56b1aa325ed7dd2ad5e107ca00d1dc3915342218394e4cb26fff928004c43733`。与原冻结工件相比，`source/reading_data.js` 的 SHA-256 完全一致。
- 新 [发布清单](w1-g5-allowlist.json) SHA-256 `d99bd625eede32ce574113fee2bd0bc58c663a7244788a53648002e66b1e54d1`，439 路径含 9 替换、39 新增、391 保留，零删除。9 个回退原文件字节匹配 main。原 QA 预览和原冻结收据继续作为历史证据。

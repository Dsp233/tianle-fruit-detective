# RC74 修复与自主工程验证

工程自测 PASS。由开发方控制执行、检查原始产物并完成发布验证；不依赖外部测试者作为工程收口前提。

- buildId：f6a19d8be38b94be264043c248287ac3c6d8eebadf31ad053079c96864122419
- 源码提交：9eaa0d596d66712f806a3343bfd3b828ead217ad
- 源码树 SHA256：d0322b65e447f2cfa2f157320cc6a44b015bad1eb188151f8c0166ff1c11aed7
- 主站 SHA256：ea901d459d3c65bd9873e8eb7be0c10ae96b9ab6eec0700f9c81669a31a981ff
- CI：https://github.com/Dsp233/tianle-fruit-detective/actions/runs/39109844652
- CI 执行提交：3110cc70a388564c084c42ca8f6a801add545f57

## 已修复

1. 倍率变式直接给出真实倍率；坐标与平均分变式补齐已知条件。显示与朗读来自同一内容合同。
2. 首屏使用完整文字条件，消除悬空图示指代。点击提示才出辅助图，提示位于题目下方并可朗读；数字选项不逐个朗读。
3. 空提交、错答和正确反馈位于提交按钮旁；提交后聚焦并进入可见区域。错误答案有明确且温和的提示，不增加虚假完成。
4. 数学误报改由独立精确计算验证：余数69；逐岔口概率1/2、完整路线抽样2/3；首位限制排列2880→576。边界强制行走的概率为1，不采用错误的1/16推导。
5. 只读原文导出保留正式记录及RC72、RC73、RC74三种QA来源，合计10个命名空间；不改写、合并或丢弃旧记录。
6. 修复真实Chrome发现的一组10题完成后总结状态已切换、页面未渲染的问题；总结页和再来一组均检查真实可见DOM。

## 实际自测

42个逻辑门全部通过：34核心、4 Node矩阵、4原生Chrome分片。Node和Chrome分别验证同一组765实例身份，各755可答通过、10政策阻断通过，主问题与变式成对完成。

Chrome还执行了4条正常练习旅程共40个题位，验证提示后正确、订正、跳题回看、草稿刷新、新一组和刷新后的答对题排除。179技能逐项从知识地图进入概念、为什么、用法、反例及真实操作任务，验证朗读请求并确认浏览本身不授予掌握。

独立Python验证25配方、50精确答案，不调用项目oracle。原始attempt、日志、截图、DOM、实际下载及汇总保存在上述CI运行产物中。完整身份集合、去重与文件哈希参与最终汇总；产品失败不会因后一次偶然成功被覆盖。

## 可直接使用

- 主站：https://dsp233.github.io/tianle-fruit-detective/
- 定向QA：https://dsp233.github.io/tianle-fruit-detective/qa/
- 正常隔离练习：https://dsp233.github.io/tianle-fruit-detective/qa/normal/
- 只读导出：https://dsp233.github.io/tianle-fruit-detective/muse/rc74/maintenance.html
- 配置列表：https://dsp233.github.io/tianle-fruit-detective/muse/rc74/families.html

真实扬声器、真实iPad、儿童理解和学习效果未由桌面自动化冒充。课程可达不等于179技能都有竞赛直接映射；未核题源、缺失原文与儿童改编继续如实标记。原Muse报告作为历史输入保留，未伪造其逐行结果。

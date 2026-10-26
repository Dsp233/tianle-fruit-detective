# RC79 LOAD2 频道加载专项

用户反馈LOAD1首页之后两个频道仍打不开。本轮不执行完整版本验收，保留原课程、题目、判分、存储键和证据规则。

LOAD1仍在频道初始化时下载完整数学数据（解码约12.86 MB）与阅读数据（约2.35 MB），并在原生解压不可用或失败时回退大份原始JSON。入口引导为外部defer脚本，首次点击可能发生在事件绑定之前；显示进度直接调用replaceChildren()，且调用在错误处理外，缺少该API时两个频道均可无响应。baseline.js在合成浏览器条件下复现这两个启动缺口，不能据此声称已定位用户真实iPad的具体错误。

- 页面内嵌入口引导和小型ES5解压器；样式表前安装点击队列，频道点击立即显示对应准备界面。
- 数据和代码统一为可缓存压缩JSON小包，每个网络小包小于128 KiB，最多3个并发；使用XHR和JS解压，不要求fetch、AbortController、TextDecoder、原生解压或replaceChildren。
- 移除原始大JSON回退。代码按原有顺序在经典脚本作用域执行；保留旧资源供缓存中的LOAD1页面使用。
- 阅读只省略原有字符与词组算法能逐字推导的拼音缓存。所有8709条原读音逐项相同，保留1126条例外；原内容和拼音哈希不变，不删除原题或改读音。
- 固定使用pako 1.0.11的inflate构建，保留MIT与Zlib许可，客户端不依赖第三方CDN。

upgrade.py输入为已经构建的LOAD1站点，在31个公共页面应用交付变换；check_payloads.py检查所有压缩包SHA-256、分片体积与解压代码语法。浏览器专项覆盖Chrome/WebKit频道冷启动、两模块实际进入训练、实际选项草稿、刷新与切换保留记录、缺少上述浏览器API、慢请求时首击响应、手动重试、活动入口与两个旧预览的启动。

本地测量：阅读数据和代码下载共约429 KB；数学约2.86 MB。首页HTML约51 KB，内含可靠引导，与全部首页图片样式合计约0.29 MB。产物以muse/rc79/loading-r2/package-report.json为准。

证据为baseline-result.json、candidate-smoke-result.json、public-smoke-result.json和对应receipt。真实iPad与完整版本验收仍不在本轮通过声明内。

# W1 canonical 源码供应

项目所有者确认 AMC8 的题库、训练、解析、插画和程序为自创或生成的项目成果。该声明作为项目输入来源记录。路径带有 `imported`、`source_evidence` 等命名，只描述数据用途。构建以固定输入和完整性验证为准，原创和生成内容无需逐文件第三方许可审批。

## 固定版本和范围

`amc8-w1-canonical-source.bundle` 是项目所有者持有的私有 Git 源码包。它来自上轮已恢复的原始源码字节，只选用清单内的源文件，不含旧 ZIP、旧工作区、缓存或运行输出。它的 Git commit 为 `c1b62c41578432d118b65a7c81dfc4f60d9f838b`，包 SHA-256 为 `8fb14caf9e04387037ddfe408f38f973fabb87ff83b3c07987407fc9a58b472e`。两项身份由 [源码锁](../../../../tools/g1-source-lock.json) 固定。原有 W1 来源仍绑定 `f935008b75d79cfc44610b197122c01e1b6b9a6e`。

| 供给路径 | 文件数 | 完整性依据 |
| --- | ---: | --- |
| `content/` | 7,710 | 与原题库身份指纹逐项一致，覆盖 7,422 项原先无同字节 Git 文件及 288 项已有同字节文件。四个仅用于指纹的输入仍保留。 |
| `compiler/` | 243 | 固定 W1 编译源码和编译输入。另有 9 项编译、首页和存储源码已在 #70 Git 树。 |
| `r1/` | 13 | HOME1 源文件精确 SHA-256，用于 13 套旧诊断、阅读和拼音。 |
| `exam-content-lock.json` | 1 | 只含原路径和 SHA-256。构建仓库独立锚定 7,710 项及规范化摘要，调用方重新计算清单无法替换锁定身份。 |
| `wheels/pypinyin-0.55.0-py2.py3-none-any.whl` | 1 | 与原固定 wheel SHA-256 一致，离线解包使用。 |

逐文件复制时使用上一轮已经绑定的指纹，不重做题库来源审计。原生成的 `exam_runtime_index.json` 未放入源码包，构建先由现有编译器重新生成，并核对完整输出 SHA-256，随后继续运行数学投影与身份断言。编译拒绝缺项、额外路径、符号链接和错哈希。Python、Node、zlib 版本和 Python、Node 二进制及拼音 wheel 的 SHA-256 已锁定。

## 有直接复制证据的路径

定向核查确认 150 个导入题面记录保存原文与参考网页快照、140 个图件有记录的来源网址及同字节哈希、212 个图件明确标为原卷裁图并有原卷和图件哈希。502 个路径及其证据类型见 [逐项索引](external-copy-evidence.tsv)。这部分与其他项目源文件一起保存在项目所有者的私有来源中，只用于隔离的冻结版本复验，不新增公开源码分发。后续若需公开这些原文或图件，针对该索引核实具体来源与用法。URL 引用、数据目录名和其余项目自有内容不构成阻断。

## 构建与复验

从同一候选 SHA 创建两个独立 Git clone，各自保存 Git 对象。稀疏检出排除历史档案文件。离线封装在发起构建前验证私有 Git 源码包 SHA-256 和 commit。它向构建进程提供只读 checkout 和只读源码，新的临时目录及单独可写的证据目录，并禁止创建网络套接字。进程启动时实际验证隔离条件。

```bash
git sparse-checkout set --no-cone '/*' '!*.zip' '!*.zip.part-*' '!*.tar.gz'
python -B tools/g1_offline_build.py \
  --bundle /private/amc8-w1-canonical-source.bundle \
  --proof-dir /separate/proof-a
```

该命令内部调用统一入口 `tools/build_site.py build --inputs /canonical --output /output/dist`。两份产物的完整 SHA-256 清单以及批准差异见 PR #70 的验收记录。GitHub 托管运行器执行与原生输出逐字节匹配的公开运行文件的浏览器验收。将私有 Git 来源挂载到托管原生构建需要单独的私有 runner 或有凭据的输入供应，当前 Draft PR 不公开打包源码，也不新增仓库凭据。

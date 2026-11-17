# 固定来源索引与使用权阻断

本表使用本 PR 的 [实际读取收据](local-reconstruction-receipt.json) 和 [#69 原索引](https://github.com/Dsp233/tianle-fruit-detective/pull/69)。表中缺口是相对冻结 CR5 Git blob。来源版本统一绑定 W1 `f935008b75d79cfc44610b197122c01e1b6b9a6e` 的 `source/exam_runtime_index.json` 和既有 7,710 项指纹，未重新扫描或上传题库内容。

| `content/` 下分类 | 总数 | 缺同字节 Git blob | 实际用途及需核对的权利 |
| --- | ---: | ---: | --- |
| `exam_problems` | 650 | 650 | 题面、选项和数学规则经 `compile_exam_mapping.py` 进入题库投影。原题及派生文本须核实授权。 |
| `imported_exams` | 150 | 150 | 导入题面与选项用于验证来源及参考答案一致性。核对每个外部来源许可。 |
| `imported_assets` | 140 | 78 | 导入题图用于校验原图和生成运行图。62 项已有 Git 同字节；缺口须经原图许可核准。 |
| `imported_sources` | 2 | 2 | 仅参与身份指纹。源文件许可未确认，保留精确哈希和两个文件。 |
| `source_evidence` | 650 | 650 | 证明题源和审核结论的引用链。第三方摘录及证明材料使用范围待核实。 |
| `inherited` | 8 | 8 | 历史来源和兼容性输入，六项另被读取，两项只参与指纹。依文件具体出处确认使用权。 |
| `judgments` | 1,308 | 1,308 | 题目判断、干扰条件和证据映射。项目编写部分需确认权属，嵌入的外部表达沿用上游限制。 |
| `training_bindings` | 1,307 | 1,307 | 训练与题目关联、适配和顺序。确认项目拥有或获准使用对应输入。 |
| `training_tasks` | 1,962 | 1,962 | 训练任务定义和教学条件。项目原创与引用内容按来源核对。 |
| `solution_routes` | 654 | 654 | 解题路线和训练投影。确认项目编写权属及转载解法许可。 |
| `transfer_sets` | 650 | 650 | 题族迁移训练定义。确认项目权属与混入题面来源。 |
| `reviews` | 2 | 2 | 编译审批与覆盖合同。确认审核数据的使用范围。 |
| `schemas` | 1 | 1 | 作者合同和固定题库范围。确认项目编写权属。 |
| `child_figures` | 226 | 0 | 课堂形式和渲染校验，已有 Git 同字节。现有发布权利范围沿用登记。 |
| 合计 | 7,710 | 7,422 | 7,706 项还被解析、核验或渲染；另 4 项只参与身份指纹。 |

适用的供给形式是批准方管理的只读内容寻址目录。每个记录绑定原路径、SHA-256、来源版本、权利凭证、授权环境和责任编辑。现有 288 项可以用已登记 Git blob 供给。禁止从 GitHub 历史工件自动回退或把公开发布文件反解后充作缺失源。项目上游权利尚有待确认项，因此未将 receipt 摘要填入工程锁。受控目录既可以映射本地离线工程环境，也可以由获准 CI 使用具有相同完整校验的文件挂载提供。访问方式和权限应随收据审核，无需将文件或凭据提交到 Git。

| 固定输入根目录内的路径 | 校验来源 |
| --- | --- |
| `approval.json` | 在经独立授权的提交中固定摘要，绑定 `scope=G1-SOURCE-BUILD`、`w1Source`、`examFingerprintSha256`、`compilerFingerprintSha256`、`r1FingerprintSha256`。明示供给责任人、批准来源及允许的构建环境。 |
| `exam_runtime_index.json` | 固定旧编译器输出仅作输入指纹凭证。正式数学内容和运行索引由编译器重建。 |
| `content/<name>` | 7,710 份输入逐路径对照指纹中的原始字节，包括仅用于指纹的四项。 |
| `compiler/<path>` | 固定 243 项非 Git 编译路径，详见 [源码锁](../../../../tools/g1-source-lock.json)。其中评审台账须与其他贡献的授权一并确认。 |
| `r1/<path>` | #70 已固定的 HOME1 13 项有效源码，含旧诊断、课程与拼音校订。 |
| `wheels/pypinyin-0.55.0-py2.py3-none-any.whl` | 已固定 wheel SHA-256，离线使用。许可跟随 Python 包及其数据 notice。 |

批准收据的三项集合摘要使用现有工具的规范 JSON 哈希，输入路径和 SHA-256 构成映射。只有完成供给和运行环境的审查后才修改 `approvedInputReceiptSha256`，避免由调用者自行声称批准。推荐采用只读文件供应，并在两个干净 checkout 用同一工具链执行以下命令，另记录全进程读取集合。脚本检查路径、内容和输出字节。文件系统只读及网络隔离由经验证的 runner 提供。

```bash
python -B tools/build_site.py build --inputs /approved/amc8-w1 --output ./dist > build-receipt.json
python -B tools/build_site.py verify ./dist > runtime-hashes.json
```

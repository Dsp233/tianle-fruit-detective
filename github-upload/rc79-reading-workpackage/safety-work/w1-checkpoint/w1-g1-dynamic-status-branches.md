# G1 辅助板、语音状态及保存文案

在生成 UI SHA-256 `0ab40c61433a41fd85592e282a0fb78e3a13c77066e6bd33b29fe8392d13d5da` 核对有限文案分支。G1-DYN-171 已核本地赋值，来自引擎的消息仍待追溯。新增两条自愿挑战提示中的经历助词「看过」按整句修为轻声，旧版已有精确注音优先级不变。定向测试通过。以下是注音函数输出，真实听音仍由设备门禁判定。

```text
104 甲卡 jiǎ kǎ
104 乙卡 yǐ kǎ
104 丙卡 bǐng kǎ
104 丁卡 dīng kǎ
105 甲卡：灯距 30 厘米，屏距 20 厘米。 jiǎ kǎ dēng jù lí mǐ píng jù lí mǐ
105 乙卡：灯距 40 厘米，屏距 20 厘米。 yǐ kǎ dēng jù lí mǐ píng jù lí mǐ
105 丙卡：灯距 40 厘米，屏距 30 厘米。 bǐng kǎ dēng jù lí mǐ píng jù lí mǐ
105 丁卡：灯距 30 厘米，屏距 30 厘米。 dīng kǎ dēng jù lí mǐ píng jù lí mǐ
132 蓝色方形：要求送出。 lán sè fāng xíng yāo qiú sòng chū
132 蓝色方形：要求送出；运行结果送出，相符。 lán sè fāng xíng yāo qiú sòng chū yùn xíng jié guǒ sòng chū xiāng fú
132 蓝色方形：要求送出；运行结果留下，不相符。 lán sè fāng xíng yāo qiú sòng chū yùn xíng jié guǒ liú xià bù xiāng fú
132 蓝色圆形：要求留下；运行结果送出，不相符。 lán sè yuán xíng yāo qiú liú xià yùn xíng jié guǒ sòng chū bù xiāng fú
132 红色方形：要求留下；运行结果留下，相符。 hóng sè fāng xíng yāo qiú liú xià yùn xíng jié guǒ liú xià xiāng fú
132 红色圆形：要求留下。 hóng sè yuán xíng yāo qiú liú xià
003 今天的中文阅读冒险 jīn tiān de zhōng wén yuè dú mào xiǎn
003 十二周阅读地图 shí èr zhōu yuè dú dì tú
003 这次阅读练习结束啦 zhè cì yuè dú liàn xí jié shù la
003 家长阅读看板 jiā zhǎng yuè dú kàn bǎn
004 先读故事，再读数学。需要帮助时可以点一下。 xiān dú gù shì zài dú shù xué xū yào bāng zhù shí kě yǐ diǎn yī xià
004 按能力放慢或回看，不必赶日历。 àn néng lì fàng màn huò huí kàn bù bì gǎn rì lì
004 先看漫画和文字，再从文字里找依据。 xiān kàn màn huà hé wén zì zài cóng wén zì lǐ zhǎo yī jù
004 当前课程的首答、求助、重试与最后结果分别保存。 dāng qián kè chéng de shǒu dá qiú zhù chóng shì yǔ zuì hòu jié guǒ fēn bié bǎo cún
004 无拼音，自己读 wú pīn yīn zì jǐ dú
004 有拼音，自己读 yǒu pīn yīn zì jǐ dú
004 不看拼音，先听原文 bù kàn pīn yīn xiān tīng yuán wén
004 请家长只读原文，再自己回答 qǐng jiā zhǎng zhǐ dú yuán wén zài zì jǐ huí dá
046 操场 cāo chǎng
046 屋顶 wū dǐng
046 小山坡 xiǎo shān pō
047 步行 20 分钟，视野开阔，灯在 8 点半亮。 bù xíng fēn zhōng shì yě kāi kuò dēng zài diǎn bàn liàng
047 步行 10 分钟，一半天空被遮住。 bù xíng fēn zhōng yī bàn tiān kōng bèi zhē zhù
047 步行 15 分钟，视野开阔；雨后须确认坡道不滑。 bù xíng fēn zhōng shì yě kāi kuò yǔ hòu xū què rèn pō dào bù huá
049 甲：20 分钟，云量 2，看到 4 颗。 jiǎ fēn zhōng yún liàng kàn dào kē
049 乙：20 分钟，云量 7，看到 2 颗。 yǐ fēn zhōng yún liàng kàn dào kē
049 丙：10 分钟，云量 2，看到 2 颗。 bǐng fēn zhōng yún liàng kàn dào kē
052 布置：7:00 到 7:10。 bù zhì dào
052 检查：7:10 到 7:15。 jiǎn chá dào
052 介绍：7:15 到 7:25。 jiè shào dào
052 观察：7:25 到 7:45。 guān chá dào
054 本题 C 点积水。 běn tí diǎn jī shuǐ
054 本题 C、D 都不能经过。 běn tí dōu bù néng jīng guò
054 本题 A 到 C 的路关闭。 běn tí dào de lù guān bì
054 本题列出的连接都可走。 běn tí liè chū de lián jiē dōu kě zǒu
056 出现闪电，暂停户外观察。 chū xiàn shǎn diàn zàn tíng hù wài guān chá
056 两项条件已满足，可以按安全卡开始。 liǎng xiàng tiáo jiàn yǐ mǎn zú kě yǐ àn ān quán kǎ kāi shǐ
056 还有条件未确认，先等一等。 hái yǒu tiáo jiàn wèi què rèn xiān děng yī děng
069 发射器：未选；监听器：未选；备用：未选 fā shè qì wèi xuǎn jiān tīng qì wèi xuǎn bèi yòng wèi xuǎn
069 发射器：9 单位；监听器：6 单位；灯：5 单位 fā shè qì dān wèi jiān tīng qì dān wèi dēng dān wèi
069 发射器：9 单位；监听器：9 单位；灯：未选。同一块电池不能同时分配给两个对象。 fā shè qì dān wèi jiān tīng qì dān wèi dēng wèi xuǎn tóng yī kuài diàn chí bù néng tóng shí fēn pèi gěi liǎng gè duì xiàng
071 已选：无 yǐ xuǎn wú
071 已选：位置、设备、测试录音、开窗状态、周围声音 yǐ xuǎn wèi zhì shè bèi cè shì lù yīn kāi chuāng zhuàng tài zhōu wéi shēng yīn
083 已选：无 yǐ xuǎn wú
083 已选：坡度、板面、用水量、用时 yǐ xuǎn pō dù bǎn miàn yòng shuǐ liàng yòng shí
091 A 到 C 关闭；B 到 D 已开放。 dào guān bì dào yǐ kāi fàng
091 A 到 C、B 到 C 关闭；B 到 D 尚未开放。 dào dào guān bì dào shàng wèi kāi fàng
091 A 到 C 关闭；B 到 D 尚未开放。 dào guān bì dào shàng wèi kāi fàng
093 选择出发时刻，先自己推算到达时间。 xuǎn zé chū fā shí kè xiān zì jǐ tuī suàn dào dá shí jiān
093 选择出发时刻，查看按题目时间计算的到达时刻。 xuǎn zé chū fā shí kè chá kàn àn tí mù shí jiān jì suàn de dào dá shí kè
095 已选择 9:35 出发。请自己计算到达时间。 yǐ xuǎn zé chū fā qǐng zì jǐ jì suàn dào dá shí jiān
095 预计 10:03 到达；这次计划共 28 分钟。 yù jì dào dá zhè cì jì huà gòng fēn zhōng
097 新增交接已确认：9:10 由阿宁保管。 xīn zēng jiāo jiē yǐ què rèn yóu ā níng bǎo guǎn
097 按原记录：9:10 由小禾保管。 àn yuán jì lù yóu xiǎo hé bǎo guǎn
097 按记录：9:16 由天乐保管。 àn jì lù yóu tiān lè bǎo guǎn
099 第一趟：暂无；第二趟：暂无。请自己检查重量和先后要求。 dì yī tàng zàn wú dì èr tàng zàn wú qǐng zì jǐ jiǎn chá zhòng liàng hé xiān hòu yāo qiú
099 第一趟：A、C；第二趟：B。请自己检查重量和先后要求。 dì yī tàng dì èr tàng qǐng zì jǐ jiǎn chá zhòng liàng hé xiān hòu yāo qiú
099 第一趟 5 千克，第二趟 2 千克；每趟上限 5 千克。C 比 B 先到。 dì yī tàng qiān kè dì èr tàng qiān kè měi tàng shàng xiàn qiān kè bǐ xiān dào
099 第一趟 7 千克，第二趟 0 千克；每趟上限 5 千克。有一趟超重。B 和 C 同时到达。 dì yī tàng qiān kè dì èr tàng qiān kè měi tàng shàng xiàn qiān kè yǒu yī tàng chāo zhòng hé tóng shí dào dá
099 第一趟 5 千克，第二趟 2 千克；每趟上限 5 千克。C 比 B 后到。 dì yī tàng qiān kè dì èr tàng qiān kè měi tàng shàng xiàn qiān kè bǐ hòu dào
018 需要时可以点喇叭。 xū yào shí kě yǐ diǎn lǎ bā
018 正在准备朗读。 zhèng zài zhǔn bèi lǎng dú
018 正在朗读。 zhèng zài lǎng dú
018 正在请求暂停。 zhèng zài qǐng qiú zàn tíng
018 正在请求继续朗读。 zhèng zài qǐng qiú jì xù lǎng dú
018 朗读已暂停。 lǎng dú yǐ zàn tíng
018 朗读结束。 lǎng dú jié shù
018 朗读已停止。 lǎng dú yǐ tíng zhǐ
018 正在读取系统音色，请稍等。 zhèng zài dú qǔ xì tǒng yīn sè qǐng shāo děng
018 远程音色需要家长先授权，也可以请家长代读。 yuǎn chéng yīn sè xū yào jiā zhǎng xiān shòu quán yě kě yǐ qǐng jiā zhǎng dài dú
018 没有已确认的本地普通话音色，可再试或请家长代读原文。 méi yǒu yǐ què rèn de běn dì pǔ tōng huà yīn sè kě zài shì huò qǐng jiā zhǎng dài dú yuán wén
018 当前环境无法朗读，可请家长代读原文。 dāng qián huán jìng wú fǎ lǎng dú kě qǐng jiā zhǎng dài dú yuán wén
018 这次朗读未完成，请再试或请家长代读。 zhè cì lǎng dú wèi wán chéng qǐng zài shì huò qǐng jiā zhǎng dài dú
018 音色已准备好，请再点一次朗读。 yīn sè yǐ zhǔn bèi hǎo qǐng zài diǎn yī cì lǎng dú
018 朗读状态已记录。 lǎng dú zhuàng tài yǐ jì lù
018 浏览器未开始朗读，请再点一次或请家长代读。 liú lǎn qì wèi kāi shǐ lǎng dú qǐng zài diǎn yī cì huò qǐng jiā zhǎng dài dú
171 回来啦，点继续后再读。 huí lái la diǎn jì xù hòu zài dú
171 周诊断，请家长先确认已学知识。 zhōu zhěn duàn qǐng jiā zhǎng xiān què rèn yǐ xué zhī shí
171 这一天不在家长选择的阅读范围内；原课程和记录仍保留。 zhè yī tiān bù zài jiā zhǎng xuǎn zé de yuè dú fàn wéi nèi yuán kè chéng hé jì lù réng bǎo liú
171 这是自愿挑战，已经看过的原文会记录为已见。 zhè shì zì yuàn tiāo zhàn yǐ jīng kàn guo de yuán wén huì jì lù wéi yǐ jiàn
171 这一天暂时没有可用的自愿挑战，原记录仍保留。 zhè yī tiān zàn shí méi yǒu kě yòng de zì yuàn tiāo zhàn yuán jì lù réng bǎo liú
171 当前范围暂时没有符合条件的新挑战，原记录仍保留。 dāng qián fàn wéi zàn shí méi yǒu fú hé tiáo jiàn de xīn tiāo zhàn yuán jì lù réng bǎo liú
171 原复习已保留，可以从阅读首页继续。 yuán fù xí yǐ bǎo liú kě yǐ cóng yuè dú shǒu yè jì xù
171 当天暂时没有符合先修条件的未见篇章；原复习仍保留。 dāng tiān zàn shí méi yǒu fú hé xiān xiū tiáo jiàn de wèi jiàn piān zhāng yuán fù xí réng bǎo liú
171 课程暂不可继续，可能不在当前阅读范围内；原记录和草稿仍保留。 kè chéng zàn bù kě jì xù kě néng bù zài dāng qián yuè dú fàn wéi nèi yuán jì lù hé cǎo gǎo réng bǎo liú
171 可以再读文字，或点听全文。第一次的答案不会改变。 kě yǐ zài dú wén zì huò diǎn tīng quán wén dì yī cì de dá àn bù huì gǎi biàn
171 请填写 1 到 84 的起止天数，开始天不能晚于结束天。 qǐng tián xiě dào de qǐ zhǐ tiān shù kāi shǐ tiān bù néng wǎn yú jié shù tiān
171 阅读范围已保存；不在范围内的课程和草稿仍保留。 yuè dú fàn wéi yǐ bǎo cún bù zài fàn wéi nèi de kè chéng hé cǎo gǎo réng bǎo liú
171 范围尚未保存，请先导出并检查记录状态。 fàn wéi shàng wèi bǎo cún qǐng xiān dǎo chū bìng jiǎn chá jì lù zhuàng tài
171 当前课程还没有可用诊断。 dāng qián kè chéng hái méi yǒu kě yòng zhěn duàn
171 今天没有到期复习，可以读一段新故事。 jīn tiān méi yǒu dào qī fù xí kě yǐ dú yī duàn xīn gù shì
171 暂时没有符合先修选择的新补强材料，请家长看看记录。 zàn shí méi yǒu fú hé xiān xiū xuǎn zé de xīn bǔ qiáng cái liào qǐng jiā zhǎng kàn kàn jì lù
171 暂时没有符合已掌握知识的新题，请家长看看先修选择。 zàn shí méi yǒu fú hé yǐ zhǎng wò zhī shí de xīn tí qǐng jiā zhǎng kàn kàn xiān xiū xuǎn zé
171 家长只读原文，不解释答案 jiā zhǎng zhǐ dú yuán wén bù jiě shì dá àn
171 已记录家长代读，请孩子继续自己回答。 yǐ jì lù jiā zhǎng dài dú qǐng hái zi jì xù zì jǐ huí dá
171 听一句，再自己读一句。不录音，不自动评分。 tīng yī jù zài zì jǐ dú yī jù bù lù yīn bù zì dòng píng fēn
171 说一说人物、发生的事和文字依据。家长观察，不自动评分。 shuō yī shuō rén wù fā shēng de shì hé wén zì yī jù jiā zhǎng guān chá bù zì dòng píng fēn
171 阅读草稿已保存。 yuè dú cǎo gǎo yǐ bǎo cún
171 阅读记录已合并，原数学记录保留。 yuè dú jì lù yǐ hé bìng yuán shù xué jì lù bǎo liú
171 本机没有 v2 阅读记录。 běn jī méi yǒu yuè dú jì lù
171 旧版记录已归档，原键保留，不授予新版独立证据。 jiù bǎn jì lù yǐ guī dàng yuán jiàn bǎo liú bù shòu yǔ xīn bǎn dú lì zhèng jù
171 旧版记录未能安全读取，原记录保留。 jiù bǎn jì lù wèi néng ān quán dú qǔ yuán jì lù bǎo liú
171 当前环境无法下载，请用支持下载的浏览器导出。 dāng qián huán jìng wú fǎ xià zài qǐng yòng zhī chí xià zài de liú lǎn qì dǎo chū
171 这段课程暂不能继续；原记录仍保留，可在家长设置中检查阅读范围。 zhè duàn kè chéng zàn bù néng jì xù yuán jì lù réng bǎo liú kě zài jiā zhǎng shè zhì zhōng jiǎn chá yuè dú fàn wéi
171 已选择旧版第1周诊断，请家长先确认已学知识。 yǐ xuǎn zé jiù bǎn dì zhōu zhěn duàn qǐng jiā zhǎng xiān què rèn yǐ xué zhī shí
171 已选择第1周诊断，请家长先确认已学知识。 yǐ xuǎn zé dì zhōu zhěn duàn qǐng jiā zhǎng xiān què rèn yǐ xué zhī shí
```

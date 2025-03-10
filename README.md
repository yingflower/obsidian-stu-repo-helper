<h4 align="center">
	<p>
		<a href="https://github.com/yingflower/obsidian-stu-repo-helper/blob/master/README_en.md">English</a> |
			<b>中文</b>
	<p>
</h4>

# 简介
学生知识库助手（Student Repository Helper）是一个面向学生或学生家长的Obsidian 插件，这款插件旨在解决学生在学习阶段面临的资料管理难题，将学习过程中产生的各类重要资料，如试卷、笔记、关键文档等，进行系统性的数字化整合与管理，并利用 AI 助手定期进行学习分析总结。随着时间的推移，它将助力你逐步搭建起一座专属你自己的知识宝库，这座宝库将伴随你一生，成为你知识成长与积累的见证。

## 特性
- ***试卷图片一键转档*** ：将试卷图片迅速、精准地转化为 markdown 文档，极大地方便后续的编辑与资料整理工作。
- ***图文智能识别转换*** ：运用先进的图文识别技术，高效提取试卷图片中的文字信息，并自动生成 markdown 文档，让关键信息的获取变得轻松高效。
- ***英语学习专属助手*** ：针对英语学习场景，不仅能为英语短文生成专业、地道的配音，还将机器翻译，生词管理，语法分析有机的结合到学习过程中，为学习者营造沉浸式的英语学习体验。
- ***错题智能分析拓展*** ：通过智能算法，深入分析错题知识点，自动整理归纳，并根据错题特征生成新的相关题目，帮助学生强化学习效果，加深知识理解。
## AI 服务提供商
知识库搭建过程中会用到的 AI 服务以及其对应的账号申请链接如下，请大家按需申请：
- 大语言模型：

[阿里通义千问](https://bailian.console.aliyun.com/?apiKey=1#/api-key)

[字节豆包](https://console.volcengine.com/ark/)

[Deepseek](https://platform.deepseek.com/)

- 文字识别：[百度云通用文字识别（高精度版）](https://console.bce.baidu.com/ai-engine/ocr/overview/index?_=1740120172878)
- 文字翻译：[百度云文本翻译-通用版](https://console.bce.baidu.com/ai-engine/machinetranslation/overview/index)
- 语音合成：[微软Azure](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices)

## 如何使用
### 配置插件
打开插件设置，输入你的 AI 服务提供商的账号信息，示例如下图：

![插件设置](docs/images/zh/settings.png)

### 试卷图片一键转档

![图片一键转档](docs/images/zh/create_note.gif)

### 图文识别转换

![文字识别](docs/images/zh/image2text.gif)

### 英文短文配音

![短文配音](docs/images/zh/text2speech.gif)

### 英语文本翻译

![文本翻译](docs/images/zh/translate.gif)

### 英语生词管理

![生词管理](docs/images/zh/add_word_bank.gif)

### 英语语法分析

![语法分析](docs/images/zh/grammar_analysis.gif)

### 题目智能分析拓展

![错题智能分析](docs/images/zh/request_llm.gif)

### 规划中功能：

- 知识库内容检索；
- 英语生词库集中管理；
- 图片文字描述自动生成；
- 产品可持续发展：用户反馈与需求收集

## 建议
为了更好的控制音频播放，建议安装：[Obsidian Audio Player 插件](https://github.com/noonesimg/obsidian-audio-player).
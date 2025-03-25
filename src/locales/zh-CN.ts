const pluginName = "学生知识库";
const similarTopics = "题目扩展";
const learningPoints = "知识点分析";
const answerQuestion = "解答";
const imageToText = "文字识别";
const textToSpeech = "文字转语音";
const translateText = "翻译";
const addWordBank = "加单词库";
const syntaxAnalysis = "语法分析";
const paintingAnalysis = "绘画分析";

const zh: Record<string, string> = {
  // For command name
  pluginName: `${pluginName}`,
  similarTopics: `${similarTopics}`,
  learningPoints: `${learningPoints}`,
  answerQuestion: `${answerQuestion}`,
  imageToText: `${imageToText}`,
  textToSpeech: `${textToSpeech}`,
  translateText: `${translateText}`,
  addWordBank: `${addWordBank}`,
  syntaxAnalysis: `${syntaxAnalysis}`,
  analysisAndSummarize: `分析&扩展`,
  paintingAnalysis: `${paintingAnalysis}`,

  // For menu name
  imageToTextMenu: `${pluginName}: ${imageToText}`,
  textToSpeechMenu: `${pluginName}: ${textToSpeech}`,
  translateTextMenu: `${pluginName}: ${translateText}`,
  addWordBankMenu: `${pluginName}: ${addWordBank}`,
  syntaxAnalysisMenu: `${pluginName}: ${syntaxAnalysis}`,
  genSimilarTopicsMenu: `${pluginName}: ${similarTopics}`,
  genLearningPointsMenu: `${pluginName}: ${learningPoints}`,
  answerQuestionMenu: `${pluginName}: ${answerQuestion}`,
  createNodeFromImagesMenu: `${pluginName}: 从图片生成笔记`,
  createNodeFromImageMenu: `${pluginName}: 从图片生成笔记`,
  paintingAnalysisMenu: `${pluginName}: ${paintingAnalysis}`,

  // For settings
  llmProvider: "阿里千问",
  ocrProvider: "百度云",
  ttsProvider: "微软Azure",
  studentGrade: `学生年级`,
  localLanguage: '本地语言',
  llmSetting: `大模型(千问/豆包/DeepSeek)`,
  ocrSetting: '文字识别',
  speechSetting: '语音合成',
  speechSubscriptionKey: '语音服务Key',
  speechVoiceType: '语音风格',
  speechVoiceGB: '英式',
  speechVoiceUS: '美式',
  speechVoiceCN: '普通话',
  mtSubscriptionKey: '翻译服务Key',
  feedback: "用户反馈",
  feedbackDesp: "提出需求和建议",
  donateMe: "支持作者",

  // For status bar
  errorHappen: "出错了",
  imageToTexting: "文字识别中...",
  textToSpeeching : "语音合成中...",
  translating: "翻译中...",
  thinking: "思考中...",

  // For settings placeholder
  studentGradePlaceholder: `小学四年级`,
  ocrAppIDPlaceholder: '你申请到的APP ID',
  ocrAPIKeyPlaceholder: '你申请到的API key',
  ocrAPISecretPlaceholder: '你申请到的API secret',
  speechSubscriptionKeyPlaceholder: '你的微软Azure语音服务Key',
};

export default zh;
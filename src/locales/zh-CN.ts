const pluginName = "学生知识库";
const similarTopics = "题目扩展";
const learningPoints = "知识点分析";
const imageToText = "文字识别";
const textToSpeech = "文字转语音";
const translateText = "翻译";

export default {
  pluginName: `${pluginName}`,
  similarTopics: `${similarTopics}`,
  learningPoints: `${learningPoints}`,
  imageToText: `${imageToText}`,
  textToSpeech: `${textToSpeech}`,
  translateText: `${translateText}`,
  imageToTextMenu: `${pluginName}: ${imageToText}`,
  textToSpeechMenu: `${pluginName}: ${textToSpeech}`,
  translateTextMenu: `${pluginName}: ${translateText}`,
  genSimilarTopicsMenu: `${pluginName}: ${similarTopics}`,
  genLearningPointsMenu: `${pluginName}: ${learningPoints}`,
  createNodeFromImagesMenu: `${pluginName}: 从图片生成笔记`,
  createNodeFromImageMenu: `${pluginName}: 从图片生成笔记`,
  analysisAndSummarize: `分析&扩展`,
  // For settings
  llmProvider: "阿里千问",
  ocrProvider: "百度云",
  ttsProvider: "微软Azure",
  studentGrade: `学生年级`,
  localLanguage: '本地语言',
  llmSetting: `大模型配置`,
  speechSetting: '语音合成与翻译',
  speechSubscriptionKey: '语音服务Key',
  speechVoiceType: '语音风格',
  speechVoiceGB: '英式',
  speechVoiceUS: '美式',
  speechVoiceCN: '普通话',
  mtSubscriptionKey: '翻译服务Key',

  // For status bar
  errorHappen: "出错了",
  imageToTexting: "文字识别中...",
  textToSpeeching : "语音合成中...",
  translating: "翻译中...",
  thinking: "思考中...",
};
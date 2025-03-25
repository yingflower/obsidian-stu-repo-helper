
const pluginName = "Student repo";
const similarTopics = "Similar topics";
const learningPoints = "Knowledge points";
const answerQuestion = "Answer question";
const imageToText = "Image to text";
const textToSpeech = "Text to speech";
const translateText = "Translate";
const addWordBank = "Add to word bank";
const syntaxAnalysis = "Syntax analysis";
const paintingAnalysis = "Painting analysis";

const en: Record<string, string> = {
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
  analysisAndSummarize: `Analyze & summarize`,
  paintingAnalysis: `${paintingAnalysis}`,

  // For menu
  imageToTextMenu: `${pluginName}: ${imageToText}`,
  textToSpeechMenu: `${pluginName}: ${textToSpeech}`,
  translateTextMenu: `${pluginName}: ${translateText}`,
  addWordBankMenu: `${pluginName}: ${addWordBank}`,
  syntaxAnalysisMenu: `${pluginName}: ${syntaxAnalysis}`,
  genSimilarTopicsMenu: `${pluginName}: ${similarTopics}`,
  genLearningPointsMenu: `${pluginName}: ${learningPoints}`,
  answerQuestionMenu: `${pluginName}: ${answerQuestion}`,
  createNodeFromImagesMenu: `${pluginName}: Create note from images`,
  createNodeFromImageMenu: `${pluginName}: Create note from image`,
  paintingAnalysisMenu: `${pluginName}: ${paintingAnalysis}`,

  // For settings
  llmProvider: "Alibaba Qwen",
  ocrProvider: "Baidu cloud",
  ttsProvider: "Microsoft Azure",
  studentGrade: `Student grade`,
  localLanguage: 'Local language',
  llmSetting: `LLM(Qwen/Doubao/DeepSeek)`,
  ocrSetting: 'OCR',
  speechSetting: 'Speech synthesis',
  speechSubscriptionKey: 'Speech subscription key',
  speechVoiceType: 'Speech voice type',
  speechVoiceGB: 'Great Britain',
  speechVoiceCN: 'Mandarin',
  speechVoiceUS: 'USA',
  mtSubscriptionKey: 'Translation subscription key',
  feedback: "User feedback",
  feedbackDesp: "Requirements and advices",
  donateMe: "Donate to author",

  // For status bar
  errorHappen: "Error happened",
  imageToTexting: "Image to text...",
  textToSpeeching : "Text to speech...",
  translating: "Translating...",
  thinking: "Thinking...",

  // For settings placeholder
  studentGradePlaceholder: `Grade 4`,
  ocrAppIDPlaceholder: 'Your APP ID',
  ocrAPIKeyPlaceholder: 'Your API key',
  ocrAPISecretPlaceholder: 'Your API secret',
  speechSubscriptionKeyPlaceholder: 'Your Microsoft Azure speech subscription key',
};

export default en;
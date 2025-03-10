
const pluginName = "Student repo";
const similarTopics = "Similar topics";
const learningPoints = "Knowledge points";
const imageToText = "Image to text";
const textToSpeech = "Text to speech";
const translateText = "Translate";
const addWordBank = "Add to word bank";
const syntaxAnalysis = "Syntax analysis";

const en: Record<string, string> = {
  pluginName: `${pluginName}`,
  similarTopics: `${similarTopics}`,
  learningPoints: `${learningPoints}`,
  imageToText: `${imageToText}`,
  textToSpeech: `${textToSpeech}`,
  translateText: `${translateText}`,
  addWordBank: `${addWordBank}`,
  syntaxAnalysis: `${syntaxAnalysis}`,
  imageToTextMenu: `${pluginName}: ${imageToText}`,
  textToSpeechMenu: `${pluginName}: ${textToSpeech}`,
  translateTextMenu: `${pluginName}: ${translateText}`,
  addWordBankMenu: `${pluginName}: ${addWordBank}`,
  syntaxAnalysisMenu: `${pluginName}: ${syntaxAnalysis}`,
  genSimilarTopicsMenu: `${pluginName}: ${similarTopics}`,
  genLearningPointsMenu: `${pluginName}: ${learningPoints}`,
  createNodeFromImagesMenu: `${pluginName}: Create note from images`,
  createNodeFromImageMenu: `${pluginName}: Create note from image`,
  analysisAndSummarize: `Analyze & Summarize`,

  // For settings
  llmProvider: "Alibaba Qwen",
  ocrProvider: "Baidu Cloud",
  ttsProvider: "Microsoft Azure",
  studentGrade: `Student grade`,
  localLanguage: 'Local language',
  llmSetting: `LLM(Qwen/Doubao/DeepSeek)`,
  ocrSetting: 'OCR and translation',
  speechSetting: 'Speech synthesis',
  speechSubscriptionKey: 'Speech subscription key',
  speechVoiceType: 'Speech voice type',
  speechVoiceGB: 'Great Britain',
  speechVoiceCN: 'Mandarin',
  speechVoiceUS: 'USA',
  mtSubscriptionKey: 'Translation subscription key',

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
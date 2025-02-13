
export async function textToSpeech(text: string, tfile: TAbstractFile, settings: StudentRepoSettings): Promise<ArrayBuffer> {
  const PathLib = require('path')
  const AipSpeech = require('baidu-aip-sdk').speech;
  
  // Generate TTS audio
  // 创建一个AipSpeech的实例
  const client = new AipSpeech(settings.ocrSettings.appID, settings.ocrSettings.apiKey, settings.ocrSettings.apiSecret);
  // 调用text2audio方法进行文本转语音的合成
  // 参数包括：要合成的文本、合成结果的格式（可选，默认是mp3）、合成语音的语速（可选，取值范围是0-9，默认是5）、合成语音的音调（可选，取值范围是0-9，默认是5）、合成语音的音量（可选，取值范围是0-9，默认是5）
  const result = await client.text2audio(text, {lan: settings.ttsLanguage})
  console.log(result);
  // result是一个包含语音二进制数据的Buffer对象
  return result.data;
}

export async function translateText(text: string, to_lang: string, settings: StudentRepoSettings): Promise<string> {
  const AipMt = require('baidu-aip-sdk').machineTranslation;
  const client = new AipMt(settings.ocrSettings.appID, settings.ocrSettings.apiKey, settings.ocrSettings.apiSecret);
  // 调用翻译接口
  const result = await client.texttransV1('auto', to_lang, text);
  console.log(result);
  console.log(result.result.trans_result);
  let result_text = '';
  result.result.trans_result.forEach((item: { src: string; dst: string }) => {
    console.log('原文：', item.src);
    console.log('译文：', item.dst);
    result_text += item.dst;
  });
  return result_text;
}

export async function imageToText(file: TAbstractFile, settings: StudentRepoSettings): Promise<string> {
  const AipOcrClient = require('baidu-aip-sdk').ocr;
  try {
    const client = new AipOcrClient(settings.ocrSettings.appID, settings.ocrSettings.apiKey, settings.ocrSettings.apiSecret);
    // 读取图片文件并转换为 Base64 编码
    var image_content =  await app.vault.adapter.readBinary(file.path)
    var image = Buffer.from(image_content).toString('base64')

    // 调用百度云 OCR 的通用文字识别接口
    var options = {};
    options["language_type"] = "CHN_ENG";
    options["paragraph"] = "true";

    const result = await client.accurateBasic(image, options);
    console.log(JSON.stringify(result));
    // 提取识别结果中的文字
    let text = '';
    if (result.paragraphs_result) {
      result.paragraphs_result.forEach((item: { words_result_idx: number[] }) => {
        for (let i = 0; i < item.words_result_idx.length; i++) {
          text += result.words_result[item.words_result_idx[i]].words + ' ';
        }
        text += '\n';
      });
    }
    console.log('图片转文字段落结果:', text);
    return text;
  } catch (error) {
      console.error('图片转文字出错:', error);
      throw error;
  }
}
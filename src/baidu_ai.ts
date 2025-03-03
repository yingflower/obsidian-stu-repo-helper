import { requestUrl, Notice, arrayBufferToBase64 } from 'obsidian';
import { AccessToken, OcrSettings } from './settings'

async function createToken(apiKey: string, apiSecret: string): Promise<AccessToken> {
	if (!apiKey || !apiSecret) throw new Error('Invalid API key secret')

	const url = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiSecret}`

  const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
  };
  
  const response = await requestUrl({
    url: url,
    method: 'POST',
    headers: headers,
  });

  if (response.status != 200) {
    console.error('create token error', response)
    return {} as AccessToken;
  }

  const data = response.json;
	const token = data.access_token
	const now = Date.now()
	const exp = now + data.expires_in
	return {
		token,
		exp
	} as AccessToken
}

export async function checkAccessToken(ocrSettings: OcrSettings): Promise<boolean> {
	const now = Date.now()
	if (
    ocrSettings.accessToken &&
		ocrSettings.accessToken.token &&
		ocrSettings.accessToken.exp > now + 3 * 60 * 1000
	) {
		return false;
	}
	const newToken = await createToken(ocrSettings.apiKey, ocrSettings.apiSecret)
  //console.log('create new token', newToken);
  ocrSettings.accessToken = newToken;
  return true;
}

export async function imageToTextHttp(imageBuffer: ArrayBuffer, ocrSettings: OcrSettings): Promise<string> {
  const url = `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${ocrSettings.accessToken.token}`
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const image_base64 = arrayBufferToBase64(imageBuffer);
  const body = `image=${encodeURIComponent(image_base64)}&paragraph=true`;

  const requestParam = {
    url: url,
    method: 'POST',
    headers: headers,
    body: body,
  };
  //console.log(requestParam);
  const response = await requestUrl(requestParam);

  if (response.status != 200) {
    console.error('Image to text error', response)
    new Notice(`Image to text error: ${response.status}`);
    return '';
  }
  //console.log(response);

  const result = response.json;
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
  //console.log('图片转文字段落结果:', text);
  return text;
}

export async function translateTextHttp(text: string, to_lang: string, ocrSettings: OcrSettings): Promise<string> {
  const url = `https://aip.baidubce.com/rpc/2.0/mt/texttrans/v1?access_token=${ocrSettings.accessToken.token}`
  const headers = {
    'Content-Type': 'application/json;charset=utf-8',
  };
  const body = {
    'q': text,
    'from': 'auto',
    'to': to_lang,
  };
  const requestParam = {
    url: url,
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
  };
  const response = await requestUrl(requestParam);

  if (response.status != 200) {
    console.error('Translate text error', response)
    new Notice(`Translate text error: ${response.status}`);
    return '';
  }
  //console.log(response);
  const result = response.json;
  let result_text = '';
  result.result.trans_result.forEach((item: { src: string; dst: string }) => {
    //console.log('原文：', item.src);
    //console.log('译文：', item.dst);
    result_text += item.dst;
  });
  return result_text;
}

/**
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

export async function imageToText(file: TAbstractFile, ocrSettings: OcrSettings): Promise<string> {
  const AipOcrClient = require('baidu-aip-sdk').ocr;
  try {
    const client = new AipOcrClient(ocrSettings.appID, ocrSettings.apiKey, ocrSettings.apiSecret);
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
*/

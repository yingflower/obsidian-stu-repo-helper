import { requestUrl, Notice } from 'obsidian';
const serviceRegion = "eastasia";

// 配置 Azure 语音服务
const speechSubscriptionKey = "";
const speechApiUrl = `https://${serviceRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

//配置 Azure 翻译服务
const mtSubscriptionKey = "";
const mtEndpoint = "https://api.cognitive.microsofttranslator.com/";

// 配置 Azure 文字识别服务
const visionSubscriptionKey = "";
//const visionEndpoint = "https://eastasia.api.cognitive.microsoft.com";
const visionApiUrl = `https://${serviceRegion}.api.cognitive.microsoft.com/vision/v3.2/ocr`;

// 图片转文字函数
// 中文识别不好，目前放弃使用
export async function imageToText(imageBuffer: ArrayBuffer, subscriptionKey: string): Promise<string> {
  const headers = {
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Content-Type': 'application/octet-stream'
  };
  const requestParam = {
    url: visionApiUrl,
    method: 'POST',
    headers: headers,
    body: imageBuffer,
  };
  //console.debug(requestParam);

  const response = await requestUrl(requestParam);

  if (response.status != 200) {
    console.error('Image to text error', response)
    new Notice(`Image to text error ${response.status}`);
    return '';
  }
  //console.debug(response);

  const result = response.json;
  // 提取识别到的文字
  let total_text = '';
  for (let i = 0; i < result.regions.length; i++) {
    const region = result.regions[i];
    let text = '';
    for (let j = 0; j < region.lines.length; j++) {
      const line = region.lines[j];
      for (let k = 0; k < line.words.length; k++) {
        const word = line.words[k];
        text += word.text + ' ';
      }
      text += '\n';
    }
    //console.debug('图片转文字结果:', text);
    total_text += text;
  }
  return total_text;
}

// 文本转语音函数

export async function textToSpeechHttp(text: string, subscriptionKey: string, speechVoice: string): Promise<ArrayBuffer> {
  // 
  const headers = {
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Content-Type': 'application/ssml+xml',
    'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3',
    'User-Agent': 'MySDK/1.0'
  };
  
  const body = `
  <speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' xml:gender='Female' name='${speechVoice}'>
          ${text}
      </voice>
  </speak>
  `;
  // 构建请求体
  const requestParam = {
      url: speechApiUrl,
      method: 'POST',
      headers: headers,
      body: body,
  };
  //console.debug(requestParam);

  const response = await requestUrl(requestParam);

  if (response.status != 200) {
      console.error('Text to speech error', response)
      return new ArrayBuffer(0);
  }
  //console.debug(response);
  // 返回音频数据
  return response.arrayBuffer;
}

// 翻译函数
export async function translateText(text: string, targetLanguage: string, subscriptionKey: string): Promise<string> {
  try {
      const apiUrl = `${mtEndpoint}/translate?api-version=3.0&to=${targetLanguage}`;
      const headers = {
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'Ocp-Apim-Subscription-Region': serviceRegion,
          'Content-Type': 'application/json'
      };
      const body = [
          {
              'text': text
          }
      ];
      const requestParam = {
        url: apiUrl,
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      };
      //console.debug(requestParam);
    
      const response = await requestUrl(requestParam);
    
      if (response.status != 200) {
        console.error('Send llm request error', response)
        return '';
      }
      //console.debug(response);
    
      const result = response.json;

      if (result.length > 0) {
          return result[0].translations[0].text;
      } else {
          throw new Error('未获取到有效的翻译结果');
      }
  } catch (error) {
      console.error('翻译出错:', error);
      throw error;
  }
}

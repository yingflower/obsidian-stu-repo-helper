import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import axios, {AxiosResponse} from 'axios';

const serviceRegion = "eastasia";

// 配置 Azure 语音服务
const speechApiUrl = `https://${serviceRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

//配置 Azure 翻译服务
const endpoint = "https://api.cognitive.microsofttranslator.com/";

// 配置 Azure 文字识别服务
const visionEndpoint = "https://stu-repo-ocr.cognitiveservices.azure.com/";
const visionApiUrl = `${visionEndpoint}vision/v3.2/read/analyze`;

// 图片转文字函数
export async function imageToText(imageBuffer: ArrayBuffer, subscriptionKey: string, endpoint: string): Promise<string> {
  const headers = {
    'Ocp-Apim-Subscription-Key': subscriptionKey,
    'Content-Type': 'application/octet-stream'
  };
  // 发送分析请求
  const analyzeResponse: AxiosResponse = await axios.post(visionApiUrl, imageBuffer, { headers });
  // 获取操作结果的 URL
  const operationLocation = analyzeResponse.headers['operation-location'];

  // 轮询检查操作结果，直到完成
  let result;
  while (true) {
      const resultResponse: AxiosResponse = await axios.get(operationLocation, { headers });
      result = resultResponse.data;
      if (result.status === 'succeeded') {
          break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒后再次检查
  }
  // 提取识别到的文字
  let paragraphs = '';
  const readResults = result.analyzeResult.readResults;
  console.log(readResults);
  for (const readResult of readResults) {
      const pageParagraphs = readResult.lines.reduce((acc, line) => {
          if (line.paragraph) {
              if (acc.length > 0 && !acc.endsWith('\n\n')) {
                  acc += '\n\n';
              }
              acc += line.text;
          } else {
              if (acc.length > 0 && !acc.endsWith(' ')) {
                  acc += ' ';
              }
              acc += line.text;
          }
          return acc;
      }, '');
      paragraphs += pageParagraphs + '\n\n';
  }
  return paragraphs.trim();
}

// 文本转语音函数
/**
export async function textToSpeechRest(text: string, subscriptionKey: string): Promise<ArrayBuffer> {
  // 获取令牌
  const tokenUrl = `https://${serviceRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
  const tokenResponse = await axios.post(tokenUrl, null, {
      headers: {
          'Ocp-Apim-Subscription-Key': subscriptionKey
      }
  });
  const accessToken = tokenResponse.data;
  // 构建请求体
  const body = `
  <speak version='1.0' xml:lang='en-US'>
      <voice xml:lang='en-US' xml:gender='Female' name='en-US-AvaMultilingualNeural'>
          ${text}
      </voice>
  </speak>
  `;
  // 发送语音合成请求
  const response: AxiosResponse<ArrayBuffer> = await axios.post(speechApiUrl, body, {
    headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
    },
    responseType: 'arraybuffer'
  });
  // 返回音频数据
  return response.data;
}
*/

export async function textToSpeech(text: string, output_fpath: string, subscriptionKey: string): Promise<void> {
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, serviceRegion);
    // 设置语音合成的声音，可以根据需求修改
    speechConfig.speechSynthesisVoiceName = "en-GB-SoniaNeural";

    // 创建音频配置，这里将音频保存为文件
    const audioConfig = sdk.AudioConfig.fromAudioFileOutput(output_fpath);

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

    synthesizer.speakTextAsync(
        text,
        result => {
            if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("语音合成成功，音频已保存为 " + output_fpath);
            } else {
                console.error(`语音合成失败: ${result.errorDetails}`);
            }
            synthesizer.close();
        },
        error => {
            console.error(`发生错误: ${error}`);
            synthesizer.close();
        }
    );
}


// 翻译函数
export async function translateText(text: string, targetLanguage: string, subscriptionKey: string): Promise<string> {
  try {
      const apiUrl = `${endpoint}/translate?api-version=3.0&to=${targetLanguage}`;
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
      const response: AxiosResponse = await axios.post(apiUrl, body, { headers });
      if (response.data && response.data.length > 0) {
          return response.data[0].translations[0].text;
      } else {
          throw new Error('未获取到有效的翻译结果');
      }
  } catch (error) {
      console.error('翻译出错:', error);
      throw error;
  }
}


// 使用示例
/**
const inputText = "Hello, World!";
//textToSpeech(inputText).catch(error => {
//    console.error(`出现异常: ${error}`);
//});

translateText(inputText, 'zh-Hans', mtSubscriptionKey).then(result => {
    console.log(`翻译结果: ${result}`);
});


import * as fs from 'fs';
import * as path from 'path';

const imageBuffer = fs.readFileSync('./test.jpg');
imageToText(imageBuffer, visionSubscriptionKey, visionEndpoint).then(text => {
    console.log(`图片中的文字为: ${text}`);
}).catch(error => {
    console.error(`图片转文字出错: ${error}`);
});
*/
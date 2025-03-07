import { requestUrl } from 'obsidian';
import { LLMSettings } from './settings'

// 火山引擎大模型配置
const doubaoSettings: LLMSettings = {
  apiBase: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: '',
  modelName: 'ep-20241101181437-tzh5b'
};

// 千问大模型配置
const qwenSettings: LLMSettings = {
  apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  apiKey: '',
  modelName: 'qwen-turbo'
};

// Deepseek大模型配置
const deepseekSettings: LLMSettings = {
  apiBase: 'https://api.deepseek.com/chat/completions',
  apiKey: '',
  modelName: 'deepseek-chat'
};

// 调用大模型的函数
export async function sendLLMRequest(prompt: string, llmSettings: LLMSettings): Promise<string> {
  try {
    const body = {
      "model": llmSettings.modelName,
      "tempreture": 1,
      "messages": [
        {
          "role": "system",
          "content": "你是一个学生学习助理。"
        },
        {
          "role": "user",
          "content": prompt
        }
      ]
    };
    const jsonBody = JSON.stringify(body);

    const headers = {
      'Content-Type': 'application/json',
      // 使用 API Key 进行鉴权
      'Authorization': `Bearer ${llmSettings.apiKey}` 
    };
    const requestParam = {
      url: llmSettings.apiBase,
      method: 'POST',
      headers: headers,
      body: jsonBody,
    };
    //console.debug(requestParam);
  
    const response = await requestUrl(requestParam);
  
    if (response.status != 200) {
      console.error('Send llm request error', response)
      return '';
    }
    //console.debug(response);
  
    const result = response.json;
    return result.choices[0].message.content;
  } catch (error) {
    console.error('调用大模型出错:', error);
    throw error;
  }
}
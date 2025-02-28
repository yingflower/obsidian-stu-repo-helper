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
    //console.log(requestParam);
  
    const response = await requestUrl(requestParam);
  
    if (response.status != 200) {
      console.error('Send llm request error', response)
      return '';
    }
    //console.log(response);
  
    const result = response.json;
    return result.choices[0].message.content;
  } catch (error) {
    console.error('调用大模型出错:', error);
    throw error;
  }
}

/**
// 使用示例
import { GENERATE_SIMILAR_TOPIC_TEMPLATE } from './prompt'
async function main() {
    const grade = '小学四年级';
    const topic = '7828减去578所得的差的一半，再除以25，商是多少？';
    const prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE.replace('{GRADE}', grade).replace('{TOPIC}', topic);
    try {
        const result = await sendLLMRequest(prompt, qwenSettings);
        console.log('大模型响应:', result);
    } catch (error) {
        console.error('出现错误:', error);
    }
}

main();
*/

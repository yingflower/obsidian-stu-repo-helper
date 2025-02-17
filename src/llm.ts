import axios, { AxiosResponse } from 'axios';
//import fetch from 'node-fetch';
import { GENERATE_SIMILAR_TOPIC_TEMPLATE } from './prompt'
import { LLMSettings } from './settings'

// 火山引擎大模型配置
const doubaoSettings: LLMSettings = {
    apiBase: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    apiKey: '383bc7ff-89ea-4eef-8115-fa9663d2ab15',
    modelName: 'ep-20241101181437-tzh5b'
};

// 千问大模型配置
const qwenSettings: LLMSettings = {
    apiBase: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    apiKey: 'sk-f7eaec40379b4d9bb576cde4847689fc',
    modelName: 'qwen-turbo'
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

        const config = {
            withCredentials: false,
            headers: {
                'Content-Type': 'application/json',
                // 使用 API Key 进行鉴权
                'Authorization': `Bearer ${llmSettings.apiKey}` 
            }
        };

        const response: AxiosResponse = await axios.post(llmSettings.apiBase, jsonBody, config);
        return response.data.choices[0].message.content;

    } catch (error) {
        console.error('调用大模型出错:', error);
        throw error;
    }
}

/**
// 使用示例
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

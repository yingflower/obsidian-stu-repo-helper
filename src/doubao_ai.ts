import axios, { AxiosResponse } from 'axios';
import { GENERATE_SIMILAR_TOPIC_TEMPLATE } from './prompt'

// 火山引擎大模型 API 端点
const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
// 替换为你的 API Key
const apiKey = '383bc7ff-89ea-4eef-8115-fa9663d2ab15';
const endpoint = 'ep-20250213171833-99pcw';

// 调用大模型的函数
async function callBigModel(prompt: string): Promise<string> {
    try {
        const body = {
            "model": endpoint,
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
            'Authorization': `Bearer ${apiKey}` 
        };

        const response: AxiosResponse = await axios.post(apiUrl, jsonBody, { headers });
        //console.log('大模型响应:', response);

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('调用大模型出错:', error);
        throw error;
    }
}

// 使用示例
async function main() {
    const stu_grade = '小学四年级';
    const problem_content = '7828减去578所得的差的一半，再除以25，商是多少？';
    const prompt = GENERATE_SIMILAR_TOPIC_TEMPLATE.replace('{stu_grade}', stu_grade).replace('{TOPIC}', problem_content);
    try {
        const result = await callBigModel(prompt);
        console.log('大模型响应:', result);
    } catch (error) {
        console.error('出现错误:', error);
    }
}

main();
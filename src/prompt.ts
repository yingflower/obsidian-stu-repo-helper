
export const GENERATE_SIMILAR_TOPIC_TEMPLATE = `
你的任务是根据已有的题目生成5道扩展题目，这些题目要符合{GRADE}的知识水平。

首先，已有题目如下：
{TOPIC}

{GRADE}知识水平的出题要求如下：
1. 题目不能过于复杂，要符合{GRADE}学生的认知能力。
2. 应涵盖{GRADE}课程中的常见知识点。

在出题时，请遵循以下指导：
1. 对于每一道扩展题目，尽量从不同的知识点角度出发，但要基于原始题目相关的知识范畴。
2. 如果原始题目是数学题，扩展题目可以改变数字、运算符号或者题型。如果是语文题，可以从字词、语句理解等不同方面出题。
3. 确保题目表述清晰，没有歧义。
4. 请用{LANGUAGE}回答。

请按照下面的格式给出回答：
根据上述题目生成的扩展题目如下：
...
`;

export const GENERATE_SIMILAR_TOPIC_TEMPLATE_EN = `
Your task is to generate 5 extended questions based on the existing question. These questions should be in line with the knowledge level of {GRADE}.
First, the existing question is as follows:
{TOPIC}
The requirements for setting questions at the {GRADE} knowledge level are as follows:
1. The questions should not be overly complex and should match the cognitive abilities of {GRADE} students.
2. They should cover common knowledge points in the {GRADE} curriculum.

When setting the questions, please follow the following guidelines:
1. For each extended question, try to approach from different knowledge - point perspectives, but stay within the knowledge scope related to the original question.
2. If the original question is a math problem, the extended questions can change the numbers, operation symbols, or question types. If it is a Chinese language problem, questions can be set from different aspects such as words and sentence comprehension.
3. Ensure that the questions are clearly stated without ambiguity.
4. Please answer in {LANGUAGE}.

Please provide your answer in the following format:
The extended questions generated based on the above question are as follows:
...
`;

export const GENERATE_LEARNING_POINTS_TEMPLATE = `
你的任务是根据给定的题目总结相关知识点。请仔细阅读以下题目:
{TOPIC}

在总结知识点时，请按照以下步骤进行:
1. 仔细阅读题目内容，确定题目涉及的主要领域或主题。
2. 识别与主题相关的关键概念、原理或信息。
3. 将这些概念、原理或信息进行分类整理。
4. 去除冗余或不重要的信息。
4. 请用{LANGUAGE}回答。

请按照下面的格式给出回答：
本题目主要涉及到的知识点如下：
...
`;

export const GENERATE_LEARNING_POINTS_TEMPLATE_EN = `
Your task is to summarize the relevant knowledge points based on the given question. Please carefully read the following question:
{TOPIC}
When summarizing the knowledge points, please follow these steps:
1. Carefully read the content of the question and determine the main field or theme involved in the question.
2. Identify the key concepts, principles, or information related to the theme.
3. Classify and organize these concepts, principles, and information.
4. Remove redundant or unimportant information.
5. Please answer in {LANGUAGE}.

Please provide your answer in the following format:
The main knowledge points involved in this question are as follows:
...
`;

export const EXPLAIN_KNOWLEDGE_POINT_TEMPLATE = `
你的任务是为学生解释某一知识点。请仔细阅读以下知识点内容，并按照指示进行解释：
{TOPIC}

在解释该知识点时，请遵循以下指南：
1. 首先用通俗易懂的语言对知识点进行定义或描述。
2. 给出该知识点相关的示例，以便更好地理解。
3. 阐述该知识点在学习过程中的重要性以及与其他知识点的联系。
4. 可能的话，提及一些学习该知识点的常见方法或技巧。
5. 答案要简洁易懂，不要出现歧义。

请按照下面的格式给出回答：
{TOPIC}的解释如下：
你的答案
`;


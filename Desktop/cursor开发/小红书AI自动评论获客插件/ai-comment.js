// AI评论生成器
class AICommentGenerator {
    constructor(config) {
        this.config = config;
    }

    async generateComment(title, content) {
        try {
            const prompt = this.config.aiPrompt
                .replace('{title}', title)
                .replace('{content}', content);

            let response;
            switch (this.config.aiModel) {
                case 'deepseek':
                    response = await this.callDeepSeekAPI(prompt);
                    break;
                case 'gpt':
                    response = await this.callGPTAPI(prompt);
                    break;
                case 'claude':
                    response = await this.callClaudeAPI(prompt);
                    break;
                default:
                    throw new Error('不支持的AI模型');
            }

            return response;
        } catch (error) {
            console.error('生成AI评论时发生错误:', error);
            throw error;
        }
    }

    async callDeepSeekAPI(prompt) {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API错误: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    async callGPTAPI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`GPT API错误: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    async callClaudeAPI(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API错误: ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text.trim();
    }
}

export { AICommentGenerator }; 
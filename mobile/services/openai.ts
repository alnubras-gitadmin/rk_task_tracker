import OpenAI from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  async init() {
    const savedKey = await AsyncStorage.getItem('openai_api_key');
    if (savedKey) {
      this.setApiKey(savedKey);
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  async saveApiKey(apiKey: string) {
    await AsyncStorage.setItem('openai_api_key', apiKey);
    this.setApiKey(apiKey);
  }

  async clearApiKey() {
    await AsyncStorage.removeItem('openai_api_key');
    this.client = null;
    this.apiKey = null;
  }

  async generateTaskSuggestions(projectTitle: string, projectDescription: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a project management assistant. Generate 5-7 specific, actionable tasks for the given project. Return only the task titles, one per line.'
          },
          {
            role: 'user',
            content: `Project: ${projectTitle}\nDescription: ${projectDescription}\n\nGenerate specific tasks for this project:`
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const content = response.choices[0]?.message?.content || '';
      return content.split('\n').filter(task => task.trim().length > 0).slice(0, 7);
    } catch (error) {
      console.error('OpenAI API error:', error);

      if (error instanceof Error || (error && typeof error === 'object')) {
        const errorMessage = error.message || String(error);
        const errorString = errorMessage.toLowerCase();

        if (errorString.includes('429') ||
            errorString.includes('quota exceeded') ||
            errorString.includes('insufficient_quota') ||
            errorString.includes('billing') ||
            errorString.includes('usage limit')) {
          throw new Error('QUOTA_EXCEEDED');
        }

        if (errorString.includes('401') ||
            errorString.includes('incorrect api key') ||
            errorString.includes('invalid api key') ||
            errorString.includes('unauthorized')) {
          throw new Error('INVALID_API_KEY');
        }
      }

      throw new Error('API_ERROR');
    }
  }
}

export const openAIService = new OpenAIService();

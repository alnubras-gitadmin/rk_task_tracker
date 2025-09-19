import OpenAI from 'openai';

// OpenAI service configuration
class OpenAIService {
  private client: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor() {
    // Initialize with environment variable if available
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) {
      this.setApiKey(envKey);
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Only for demo purposes
    });
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null;
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
      
      // Handle specific OpenAI API errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota exceeded')) {
          throw new Error('QUOTA_EXCEEDED');
        }
        if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
          throw new Error('INVALID_API_KEY');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('QUOTA_EXCEEDED');
        }
      }
      
      throw new Error('API_ERROR');
    }
  }

  async improveTaskDescription(taskTitle: string, currentDescription: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a project management assistant. Improve the given task description to be more specific, actionable, and clear. Keep it concise but detailed.'
          },
          {
            role: 'user',
            content: `Task: ${taskTitle}\nCurrent Description: ${currentDescription}\n\nImprove this task description:`
          }
        ],
        max_tokens: 200,
        temperature: 0.5
      });

      return response.choices[0]?.message?.content || currentDescription;
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI API errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota exceeded')) {
          throw new Error('QUOTA_EXCEEDED');
        }
        if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
          throw new Error('INVALID_API_KEY');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('QUOTA_EXCEEDED');
        }
      }
      
      throw new Error('API_ERROR');
    }
  }

  async generateProjectIdeas(industry: string, goals: string): Promise<string[]> {
    if (!this.client) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a business consultant. Generate 5 specific project ideas based on the industry and goals provided. Return only the project titles, one per line.'
          },
          {
            role: 'user',
            content: `Industry: ${industry}\nGoals: ${goals}\n\nGenerate project ideas:`
          }
        ],
        max_tokens: 250,
        temperature: 0.8
      });

      const content = response.choices[0]?.message?.content || '';
      return content.split('\n').filter(idea => idea.trim().length > 0).slice(0, 5);
    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Handle specific OpenAI API errors
      if (error instanceof Error) {
        if (error.message.includes('429') || error.message.includes('quota exceeded')) {
          throw new Error('QUOTA_EXCEEDED');
        }
        if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
          throw new Error('INVALID_API_KEY');
        }
        if (error.message.includes('insufficient_quota')) {
          throw new Error('QUOTA_EXCEEDED');
        }
      }
      
      throw new Error('API_ERROR');
    }
  }
}

export const openAIService = new OpenAIService();
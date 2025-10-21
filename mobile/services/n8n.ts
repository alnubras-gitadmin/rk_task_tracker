import Constants from 'expo-constants';

class N8NService {
  private webhookUrl: string;
  private apiUrl: string;

  constructor() {
    this.webhookUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.rktaskbook.alnubras.co/webhook/';
    this.apiUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_N8N_API_URL || 'https://n8n.rktaskbook.alnubras.co/api/v1/';
  }

  async triggerTaskCreation(taskData: {
    projectId: number;
    title: string;
    description: string;
    assignedTo?: string;
    priority?: 'low' | 'medium' | 'high';
    dueDate?: string;
    userId: string;
  }) {
    try {
      const response = await fetch(`${this.webhookUrl}task-created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'task.created',
          data: taskData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('N8N task creation webhook error:', error);
      throw error;
    }
  }

  async triggerTaskStatusChange(taskData: {
    taskId: number;
    projectId: number;
    oldStatus: string;
    newStatus: string;
    userId: string;
    assignedTo?: string;
  }) {
    try {
      const response = await fetch(`${this.webhookUrl}task-status-changed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'task.status_changed',
          data: taskData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('N8N task status webhook error:', error);
      throw error;
    }
  }

  async triggerProjectCreation(projectData: {
    projectId: number;
    title: string;
    description: string;
    createdBy: string;
    teamMembers?: string[];
  }) {
    try {
      const response = await fetch(`${this.webhookUrl}project-created`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'project.created',
          data: projectData,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('N8N project creation webhook error:', error);
      throw error;
    }
  }

  async triggerAITaskGeneration(data: {
    projectId: number;
    projectTitle: string;
    projectDescription: string;
    userId: string;
    generatedTasks: string[];
  }) {
    try {
      const response = await fetch(`${this.webhookUrl}ai-tasks-generated`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'ai.tasks_generated',
          data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('N8N AI task generation webhook error:', error);
      throw error;
    }
  }
}

export const n8nService = new N8NService();

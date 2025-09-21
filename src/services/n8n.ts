// N8N Workflow Integration Service
class N8NService {
  private webhookUrl: string
  private apiUrl: string

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.rktaskbook.alnubras.co/webhook/'
    this.apiUrl = import.meta.env.VITE_N8N_API_URL || 'https://n8n.rktaskbook.alnubras.co/api/v1/'
  }

  // Trigger task creation workflow
  async triggerTaskCreation(taskData: {
    projectId: number
    title: string
    description: string
    assignedTo?: string
    priority?: 'low' | 'medium' | 'high'
    dueDate?: string
    userId: string
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
      })

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8N task creation webhook error:', error)
      throw error
    }
  }

  // Trigger task status change workflow
  async triggerTaskStatusChange(taskData: {
    taskId: number
    projectId: number
    oldStatus: string
    newStatus: string
    userId: string
    assignedTo?: string
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
      })

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8N task status webhook error:', error)
      throw error
    }
  }

  // Trigger project creation workflow
  async triggerProjectCreation(projectData: {
    projectId: number
    title: string
    description: string
    createdBy: string
    teamMembers?: string[]
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
      })

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8N project creation webhook error:', error)
      throw error
    }
  }

  // Trigger AI task generation workflow
  async triggerAITaskGeneration(data: {
    projectId: number
    projectTitle: string
    projectDescription: string
    userId: string
    generatedTasks: string[]
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
      })

      if (!response.ok) {
        throw new Error(`N8N webhook failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8N AI task generation webhook error:', error)
      throw error
    }
  }

  // Send notification workflow
  async sendNotification(notificationData: {
    type: 'email' | 'slack' | 'teams' | 'discord'
    recipient: string
    subject: string
    message: string
    priority?: 'low' | 'medium' | 'high'
    metadata?: any
  }) {
    try {
      const response = await fetch(`${this.webhookUrl}send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'notification.send',
          data: notificationData,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`N8N notification webhook failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8N notification webhook error:', error)
      throw error
    }
  }

  // Get workflow execution status
  async getWorkflowStatus(executionId: string) {
    try {
      const response = await fetch(`${this.apiUrl}executions/${executionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`N8N API failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('N8N workflow status error:', error)
      throw error
    }
  }
}

export const n8nService = new N8NService()
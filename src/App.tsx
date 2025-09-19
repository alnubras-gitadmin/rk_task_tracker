import React, { useState } from 'react';
import { Settings, Plus, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';
import OpenAISettings from './components/OpenAISettings';
import AITaskGenerator from './components/AITaskGenerator';
import { openAIService } from './services/openai';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
}

interface Project {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  createdAt: Date;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  const createProject = () => {
    if (!newProject.title.trim()) return;

    const project: Project = {
      id: Date.now().toString(),
      title: newProject.title,
      description: newProject.description,
      tasks: [],
      createdAt: new Date()
    };

    setProjects([...projects, project]);
    setNewProject({ title: '', description: '' });
    setShowNewProjectForm(false);
  };

  const addTask = (projectId: string) => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      status: 'pending',
      createdAt: new Date()
    };

    setProjects(projects.map(p => 
      p.id === projectId 
        ? { ...p, tasks: [...p.tasks, task] }
        : p
    ));
    setNewTask({ title: '', description: '' });
  };

  const updateTaskStatus = (projectId: string, taskId: string, status: Task['status']) => {
    setProjects(projects.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            tasks: p.tasks.map(t => 
              t.id === taskId ? { ...t, status } : t
            )
          }
        : p
    ));
  };

  const handleAITasksGenerated = (tasks: string[]) => {
    if (!selectedProject) return;

    const aiTasks: Task[] = tasks.map(title => ({
      id: Date.now().toString() + Math.random(),
      title: title.replace(/^\d+\.\s*/, ''), // Remove numbering
      description: `AI-generated task for ${selectedProject.title}`,
      status: 'pending' as const,
      createdAt: new Date()
    }));

    setProjects(projects.map(p => 
      p.id === selectedProject.id 
        ? { ...p, tasks: [...p.tasks, ...aiTasks] }
        : p
    ));
    setShowAIGenerator(false);
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="text-green-500" size={16} />;
      case 'in-progress': return <Clock className="text-blue-500" size={16} />;
      default: return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="text-blue-600" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Backend Integration Platform</h1>
                <p className="text-sm text-gray-500">AI-Powered Project Management</p>
              </div>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'projects'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Projects
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Integrations
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'settings' ? (
          <div className="max-w-2xl">
            <OpenAISettings onApiKeySet={setIsOpenAIConfigured} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Projects Overview */}
            {!selectedProject ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
                  <button
                    onClick={() => setShowNewProjectForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    New Project
                  </button>
                </div>

                {/* New Project Form */}
                {showNewProjectForm && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Project title"
                        value={newProject.title}
                        onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <textarea
                        placeholder="Project description"
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={createProject}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Project
                        </button>
                        <button
                          onClick={() => setShowNewProjectForm(false)}
                          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Projects Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{project.tasks.length} tasks</span>
                        <span>{project.tasks.filter(t => t.status === 'completed').length} completed</span>
                      </div>
                    </div>
                  ))}
                </div>

                {projects.length === 0 && (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Plus className="text-gray-400" size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                    <p className="text-gray-500 mb-4">Create your first project to get started</p>
                    <button
                      onClick={() => setShowNewProjectForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Project
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Project Detail View */
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      ← Back to Projects
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedProject.title}</h2>
                      <p className="text-gray-600">{selectedProject.description}</p>
                    </div>
                  </div>
                  {isOpenAIConfigured && (
                    <button
                      onClick={() => setShowAIGenerator(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      <Sparkles size={16} />
                      AI Generate
                    </button>
                  )}
                </div>

                {/* Add Task Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => addTask(selectedProject.id)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Task
                    </button>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                  {selectedProject.tasks.map((task) => (
                    <div key={task.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(task.status)}
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status.replace('-', ' ')}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm">{task.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => updateTaskStatus(selectedProject.id, task.id, 'in-progress')}
                            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                          >
                            In Progress
                          </button>
                          <button
                            onClick={() => updateTaskStatus(selectedProject.id, task.id, 'completed')}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                          >
                            Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedProject.tasks.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No tasks yet. Add your first task above!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* AI Task Generator Modal */}
      {showAIGenerator && selectedProject && (
        <AITaskGenerator
          projectTitle={selectedProject.title}
          projectDescription={selectedProject.description}
          onTasksGenerated={handleAITasksGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </div>
  );
};

export default App;
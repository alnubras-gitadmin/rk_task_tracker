import React, { useState, useEffect } from 'react';
import { Settings, Plus, CheckCircle, Clock, AlertCircle, Sparkles, User, LogOut } from 'lucide-react';
import { supabase, type Profile } from './lib/supabase';
import { n8nService } from './services/n8n';
import AuthForm from './components/AuthForm';
import OpenAISettings from './components/OpenAISettings';
import AITaskGenerator from './components/AITaskGenerator';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadUserProfile(session.user.id);
        await loadUserProjects();
      } else {
        setProfile(null);
        setProjects([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadUserProjects = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      // Convert database projects to app format
      const appProjects: Project[] = data.map(dbProject => ({
        id: dbProject.id.toString(),
        title: dbProject.title || 'Untitled Project',
        description: dbProject.metadata?.description || '',
        tasks: [], // Tasks will be loaded separately
        createdAt: new Date(dbProject.created_at)
      }));

      setProjects(appProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const createProject = () => {
    if (!newProject.title.trim()) return;

    createProjectInDatabase();
  };

  const createProjectInDatabase = async () => {
    if (!user || !newProject.title.trim()) return;

    try {
      const { data, error } = await supabase
        .from('threads')
        .insert([
          {
            title: newProject.title,
            metadata: { description: newProject.description },
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return;
      }

      const project: Project = {
        id: data.id.toString(),
        title: data.title || 'Untitled Project',
        description: data.metadata?.description || '',
        tasks: [],
        createdAt: new Date(data.created_at)
      };

      setProjects([project, ...projects]);
      setNewProject({ title: '', description: '' });
      setShowNewProjectForm(false);

      // Trigger N8N workflow
      try {
        await n8nService.triggerProjectCreation({
          projectId: data.id,
          title: project.title,
          description: project.description,
          createdBy: user.id,
          teamMembers: []
        });
      } catch (n8nError) {
        console.error('N8N project creation webhook failed:', n8nError);
      }
    } catch (error) {
      console.error('Error creating project:', error);
    }
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

    // Trigger N8N workflow
    if (user) {
      n8nService.triggerTaskCreation({
        projectId: parseInt(projectId),
        title: task.title,
        description: task.description,
        userId: user.id
      }).catch(error => {
        console.error('N8N task creation webhook failed:', error);
      });
    }
  };

  const updateTaskStatus = (projectId: string, taskId: string, status: Task['status']) => {
    const oldTask = projects
      .find(p => p.id === projectId)
      ?.tasks.find(t => t.id === taskId);

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

    // Trigger N8N workflow
    if (user && oldTask) {
      n8nService.triggerTaskStatusChange({
        taskId: parseInt(taskId),
        projectId: parseInt(projectId),
        oldStatus: oldTask.status,
        newStatus: status,
        userId: user.id
      }).catch(error => {
        console.error('N8N task status webhook failed:', error);
      });
    }
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

    // Trigger N8N workflow
    if (user) {
      n8nService.triggerAITaskGeneration({
        projectId: parseInt(selectedProject.id),
        projectTitle: selectedProject.title,
        projectDescription: selectedProject.description,
        userId: user.id,
        generatedTasks: tasks
      }).catch(error => {
        console.error('N8N AI task generation webhook failed:', error);
      });
    }
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

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!user) {
    return <AuthForm onAuthSuccess={() => loadUserProjects()} />;
  }

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
            <div className="flex items-center gap-4">
              {profile && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User size={16} />
                  <span>{profile.full_name || user.email}</span>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <LogOut size={16} />
              </button>
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
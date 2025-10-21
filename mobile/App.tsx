import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { supabase, type Profile } from './lib/supabase';
import { n8nService } from './services/n8n';
import { openAIService } from './services/openai';
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

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'projects' | 'settings'>('projects');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [isOpenAIConfigured, setIsOpenAIConfigured] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
        .maybeSingle();

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

      const appProjects: Project[] = data.map(dbProject => ({
        id: dbProject.id.toString(),
        title: dbProject.title || 'Untitled Project',
        description: dbProject.metadata?.description || '',
        tasks: [],
        createdAt: new Date(dbProject.created_at)
      }));

      setProjects(appProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadUserProjects().finally(() => setRefreshing(false));
  }, [user]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  const createProject = async () => {
    if (!user || !newProject.title.trim()) {
      Alert.alert('Error', 'Please enter a project title');
      return;
    }

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
        Alert.alert('Error', 'Failed to create project');
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
      Alert.alert('Error', 'Failed to create project');
    }
  };

  const addTask = (projectId: string) => {
    if (!newTask.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

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
      title: title.replace(/^\d+\.\s*/, ''),
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

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return '#16a34a';
      case 'in-progress': return '#2563eb';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return <AuthForm onAuthSuccess={() => loadUserProjects()} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>RK TaskBook</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Project Management</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
          onPress={() => setActiveTab('projects')}
        >
          <Text style={[styles.tabText, activeTab === 'projects' && styles.activeTabText]}>
            Projects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Integrations
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'settings' ? (
        <ScrollView style={styles.content}>
          <OpenAISettings onApiKeySet={setIsOpenAIConfigured} />
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {!selectedProject ? (
            <View style={styles.projectsContainer}>
              <View style={styles.projectsHeader}>
                <Text style={styles.sectionTitle}>Projects</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => setShowNewProjectForm(true)}
                >
                  <Text style={styles.addButtonText}>+ New Project</Text>
                </TouchableOpacity>
              </View>

              {showNewProjectForm && (
                <View style={styles.formContainer}>
                  <Text style={styles.formTitle}>Create New Project</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Project title"
                    value={newProject.title}
                    onChangeText={(text) => setNewProject({ ...newProject, title: text })}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Project description"
                    value={newProject.description}
                    onChangeText={(text) => setNewProject({ ...newProject, description: text })}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.formButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={createProject}
                    >
                      <Text style={styles.buttonText}>Create Project</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={() => setShowNewProjectForm(false)}
                    >
                      <Text style={styles.secondaryButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {projects.map((project) => (
                <TouchableOpacity
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => setSelectedProject(project)}
                >
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                  </Text>
                  <View style={styles.projectStats}>
                    <Text style={styles.projectStat}>{project.tasks.length} tasks</Text>
                    <Text style={styles.projectStat}>
                      {project.tasks.filter(t => t.status === 'completed').length} completed
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {projects.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No projects yet</Text>
                  <Text style={styles.emptyText}>Create your first project to get started</Text>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setShowNewProjectForm(true)}
                  >
                    <Text style={styles.buttonText}>Create Project</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.projectDetail}>
              <View style={styles.projectDetailHeader}>
                <TouchableOpacity onPress={() => setSelectedProject(null)}>
                  <Text style={styles.backButton}>← Back to Projects</Text>
                </TouchableOpacity>
                <Text style={styles.projectDetailTitle}>{selectedProject.title}</Text>
                <Text style={styles.projectDetailDescription}>{selectedProject.description}</Text>
                {isOpenAIConfigured && (
                  <TouchableOpacity
                    style={styles.aiButton}
                    onPress={() => setShowAIGenerator(true)}
                  >
                    <Text style={styles.buttonText}>✨ AI Generate</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>Add New Task</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Task title"
                  value={newTask.title}
                  onChangeText={(text) => setNewTask({ ...newTask, title: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  value={newTask.description}
                  onChangeText={(text) => setNewTask({ ...newTask, description: text })}
                />
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => addTask(selectedProject.id)}
                >
                  <Text style={styles.buttonText}>Add Task</Text>
                </TouchableOpacity>
              </View>

              {selectedProject.tasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                      <Text style={styles.statusText}>{task.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.taskDescription}>{task.description}</Text>
                  <View style={styles.taskActions}>
                    <TouchableOpacity
                      style={styles.taskActionButton}
                      onPress={() => updateTaskStatus(selectedProject.id, task.id, 'in-progress')}
                    >
                      <Text style={styles.taskActionText}>In Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.taskActionButton}
                      onPress={() => updateTaskStatus(selectedProject.id, task.id, 'completed')}
                    >
                      <Text style={styles.taskActionText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {selectedProject.tasks.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No tasks yet. Add your first task above!</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {showAIGenerator && selectedProject && (
        <AITaskGenerator
          projectTitle={selectedProject.title}
          projectDescription={selectedProject.description}
          onTasksGenerated={handleAITasksGenerated}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  signOutText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  projectsContainer: {
    padding: 16,
  },
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  projectStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectStat: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  projectDetail: {
    padding: 16,
  },
  projectDetailHeader: {
    marginBottom: 16,
  },
  backButton: {
    fontSize: 14,
    color: '#2563eb',
    marginBottom: 12,
  },
  projectDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  projectDetailDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  aiButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  taskActionButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  taskActionText: {
    color: '#374151',
    fontSize: 12,
    fontWeight: '600',
  },
});

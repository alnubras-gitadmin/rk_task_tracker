import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert
} from 'react-native';
import { openAIService } from '../services/openai';

interface AITaskGeneratorProps {
  projectTitle: string;
  projectDescription: string;
  onTasksGenerated: (tasks: string[]) => void;
  onClose: () => void;
}

export default function AITaskGenerator({
  projectTitle,
  projectDescription,
  onTasksGenerated,
  onClose
}: AITaskGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);

  const generateTasks = async () => {
    setIsGenerating(true);

    try {
      const tasks = await openAIService.generateTaskSuggestions(projectTitle, projectDescription);
      setGeneratedTasks(tasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate tasks';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptTasks = () => {
    onTasksGenerated(generatedTasks);
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Task Generator</Text>
          <Text style={styles.subtitle}>Generate tasks for "{projectTitle}"</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.projectDetails}>
            <Text style={styles.sectionTitle}>Project Details</Text>
            <View style={styles.detailsBox}>
              <Text style={styles.detailLabel}>Title:</Text>
              <Text style={styles.detailText}>{projectTitle}</Text>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailText}>{projectDescription}</Text>
            </View>
          </View>

          {!generatedTasks.length && !isGenerating && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Ready to Generate Tasks</Text>
              <Text style={styles.emptyText}>AI will analyze your project and suggest relevant tasks</Text>
              <TouchableOpacity style={styles.generateButton} onPress={generateTasks}>
                <Text style={styles.buttonText}>Generate Tasks with AI</Text>
              </TouchableOpacity>
            </View>
          )}

          {isGenerating && (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingTitle}>Generating Tasks...</Text>
              <Text style={styles.loadingText}>AI is analyzing your project and creating task suggestions</Text>
            </View>
          )}

          {generatedTasks.length > 0 && (
            <View style={styles.tasksContainer}>
              <Text style={styles.sectionTitle}>Generated Tasks ({generatedTasks.length})</Text>
              {generatedTasks.map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <View style={styles.taskNumber}>
                    <Text style={styles.taskNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.taskText}>{task}</Text>
                </View>
              ))}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={handleAcceptTasks}
                >
                  <Text style={styles.buttonText}>Add All Tasks to Project</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.regenerateButton]}
                  onPress={generateTasks}
                >
                  <Text style={styles.regenerateButtonText}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  projectDetails: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailsBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
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
    marginBottom: 24,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  tasksContainer: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  taskNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskNumberText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  taskText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  actionButtons: {
    marginTop: 16,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#16a34a',
  },
  regenerateButton: {
    backgroundColor: '#f3f4f6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  regenerateButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
});

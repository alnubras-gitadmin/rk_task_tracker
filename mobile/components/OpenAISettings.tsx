import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { openAIService } from '../services/openai';

interface OpenAISettingsProps {
  onApiKeySet?: (isSet: boolean) => void;
}

export default function OpenAISettings({ onApiKeySet }: OpenAISettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    await openAIService.init();
    setIsConfigured(openAIService.isConfigured());
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    try {
      await openAIService.saveApiKey(apiKey.trim());
      setIsConfigured(true);
      onApiKeySet?.(true);
      Alert.alert('Success', 'API key saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key');
    }
  };

  const testConnection = async () => {
    if (!isConfigured) return;

    setIsTestingConnection(true);

    try {
      await openAIService.generateTaskSuggestions('Test Project', 'This is a test project to verify API connectivity');
      Alert.alert('Success', 'Connection successful! OpenAI API is working.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'QUOTA_EXCEEDED') {
        Alert.alert(
          'Quota Exceeded',
          'Your OpenAI API key has reached its usage quota. Please check your OpenAI dashboard for usage limits.'
        );
      } else if (errorMessage === 'INVALID_API_KEY') {
        Alert.alert('Invalid API Key', 'Please check your API key and try again.');
      } else {
        Alert.alert('Connection Failed', errorMessage);
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const clearApiKey = async () => {
    Alert.alert(
      'Remove API Key',
      'Are you sure you want to remove your OpenAI API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await openAIService.clearApiKey();
            setApiKey('');
            setIsConfigured(false);
            onApiKeySet?.(false);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>OpenAI Integration</Text>
        <Text style={styles.subtitle}>Enable AI-powered task suggestions and project assistance</Text>
      </View>

      {!isConfigured ? (
        <View style={styles.section}>
          <Text style={styles.label}>OpenAI API Key</Text>
          <TextInput
            style={styles.input}
            placeholder="sk-..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={!showApiKey}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowApiKey(!showApiKey)}>
            <Text style={styles.link}>{showApiKey ? 'Hide' : 'Show'} API Key</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}
          >
            <Text style={styles.helpText}>
              Get your API key from OpenAI Platform
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !apiKey.trim() && styles.buttonDisabled]}
            onPress={handleSaveApiKey}
            disabled={!apiKey.trim()}
          >
            <Text style={styles.buttonText}>Save API Key</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>✓ OpenAI API configured</Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isTestingConnection && styles.buttonDisabled]}
            onPress={testConnection}
            disabled={isTestingConnection}
          >
            {isTestingConnection ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Test Connection</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={clearApiKey}
          >
            <Text style={styles.buttonText}>Remove API Key</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>AI Features Available:</Text>
        <Text style={styles.featureItem}>• Generate task suggestions for new projects</Text>
        <Text style={styles.featureItem}>• Improve task descriptions with AI</Text>
        <Text style={styles.featureItem}>• Get project ideas based on your goals</Text>
        <Text style={styles.featureItem}>• Smart content generation and optimization</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  link: {
    color: '#2563eb',
    fontSize: 14,
    marginBottom: 8,
  },
  helpText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  dangerButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#d1fae5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
});

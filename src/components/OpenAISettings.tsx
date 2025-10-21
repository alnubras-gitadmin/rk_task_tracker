import React, { useState, useEffect } from 'react';
import { Key, Zap, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { openAIService } from '../services/openai';

interface OpenAISettingsProps {
  onApiKeySet?: (isSet: boolean) => void;
}

const OpenAISettings: React.FC<OpenAISettingsProps> = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; errorType?: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setIsConfigured(openAIService.isConfigured());
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return;

    try {
      openAIService.setApiKey(apiKey.trim());
      setIsConfigured(true);
      onApiKeySet?.(true);
      setTestResult({ success: true, message: 'API key saved successfully!' });
      
      // Store in localStorage for persistence (in production, use secure storage)
      localStorage.setItem('openai_api_key', apiKey.trim());
    } catch (error) {
      setTestResult({ success: false, message: 'Failed to save API key' });
    }
  };

  const testConnection = async () => {
    if (!isConfigured) return;

    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      await openAIService.generateTaskSuggestions('Test Project', 'This is a test project to verify API connectivity');
      setTestResult({ success: true, message: 'Connection successful! OpenAI API is working.' });
    } catch (error) {
      console.info('OpenAI API quota check:', error); // Log as info, not error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage === 'QUOTA_EXCEEDED') {
        setTestResult({ 
          success: false, 
          message: 'Your OpenAI API key has reached its usage quota. This is expected behavior when limits are exceeded.',
          errorType: 'quota'
        });
      } else if (errorMessage === 'INVALID_API_KEY') {
        setTestResult({ 
          success: false, 
          message: 'Invalid OpenAI API key. Please check your API key.',
          errorType: 'auth'
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `Connection failed: ${errorMessage}`,
          errorType: 'general'
        });
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  const clearApiKey = () => {
    setApiKey('');
    setIsConfigured(false);
    setTestResult(null);
    localStorage.removeItem('openai_api_key');
    onApiKeySet?.(false);
  };

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      openAIService.setApiKey(savedKey);
      setIsConfigured(true);
      onApiKeySet?.(true);
    }
  }, [onApiKeySet]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <Sparkles size={20} className="text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">OpenAI Integration</h3>
          <p className="text-sm text-gray-500">Enable AI-powered task suggestions and project assistance</p>
        </div>
      </div>

      {!isConfigured ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-12 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">OpenAI Platform</a>
            </p>
          </div>

          <button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim()}
            className="w-full px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Save API Key
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">OpenAI API configured</span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={testConnection}
              disabled={isTestingConnection}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 rounded-lg transition-colors"
            >
              <Zap size={16} />
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>

            <button
              onClick={clearApiKey}
              className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Remove API Key
            </button>
          </div>
        </div>
      )}

      {testResult && (
        <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
          testResult.success ? 'bg-emerald-50 text-emerald-700' : 
          (testResult as any).errorType === 'quota' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
        }`}>
          {testResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <div className="text-sm">
            <p>{testResult.message}</p>
            {!testResult.success && (testResult as any).errorType === 'quota' && (
              <div className="mt-2 text-xs">
                <p className="font-medium mb-1">✅ Your API key is valid. To increase quota:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>Check your <a href="https://platform.openai.com/account/usage" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Usage Dashboard</a></li>
                  <li>Visit <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium">OpenAI Billing</a> to add payment method</li>
                  <li>If on free tier: Wait for monthly quota reset or upgrade to paid plan</li>
                  <li><strong>Note:</strong> AI features will work once quota is available</li>
                </ul>
              </div>
            )}
            {!testResult.success && (testResult as any).errorType === 'auth' && (
              <div className="mt-2 text-xs">
                <p className="font-medium mb-1">To resolve this authentication issue:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Get a new API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                  <li>Make sure the API key starts with "sk-"</li>
                  <li>Verify the key has proper permissions</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">AI Features Available:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Generate task suggestions for new projects</li>
          <li>• Improve task descriptions with AI</li>
          <li>• Get project ideas based on your goals</li>
          <li>• Smart content generation and optimization</li>
        </ul>
      </div>
    </div>
  );
};

export default OpenAISettings;
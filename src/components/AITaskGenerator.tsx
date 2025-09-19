import React, { useState } from 'react';
import { X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { openAIService } from '../services/openai';

interface AITaskGeneratorProps {
  projectTitle: string;
  projectDescription: string;
  onTasksGenerated: (tasks: string[]) => void;
  onClose: () => void;
}

const AITaskGenerator: React.FC<AITaskGeneratorProps> = ({
  projectTitle,
  projectDescription,
  onTasksGenerated,
  onClose
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);

  const generateTasks = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const tasks = await openAIService.generateTaskSuggestions(projectTitle, projectDescription);
      setGeneratedTasks(tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptTasks = () => {
    onTasksGenerated(generatedTasks);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
              <Sparkles className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">AI Task Generator</h2>
              <p className="text-sm text-gray-500">Generate tasks for "{projectTitle}"</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Project Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2"><strong>Title:</strong> {projectTitle}</p>
              <p className="text-sm text-gray-600"><strong>Description:</strong> {projectDescription}</p>
            </div>
          </div>

          {!generatedTasks.length && !isGenerating && !error && (
            <div className="text-center py-8">
              <div className="p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="text-purple-600" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate Tasks</h3>
              <p className="text-gray-500 mb-6">AI will analyze your project and suggest relevant tasks</p>
              <button
                onClick={generateTasks}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Generate Tasks with AI
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Loader2 className="text-blue-600 animate-spin" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Generating Tasks...</h3>
              <p className="text-gray-500">AI is analyzing your project and creating task suggestions</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Generation Failed</h4>
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    onClick={generateTasks}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}

          {generatedTasks.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Generated Tasks ({generatedTasks.length})</h3>
              <div className="space-y-3 mb-6">
                {generatedTasks.map((task, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-900 text-sm">{task}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAcceptTasks}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add All Tasks to Project
                </button>
                <button
                  onClick={generateTasks}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITaskGenerator;
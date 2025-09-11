import React, { useState, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { motion } from 'framer-motion';

interface WorkspaceCanvasProps {
  workspaceId: string;
}

interface WorkflowNode {
  id: string;
  type: string;
  status: string;
  title: string;
  description: string;
  output?: string;
}

interface ChatAgentProps {
  onMessage: (message: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

interface WorkflowVisualizationProps {
  nodes: WorkflowNode[];
  isProcessing: boolean;
}

interface OutputPanelProps {
  content: string;
  onClose: () => void;
}

// Temporary inline components - will be moved to separate files later
const ChatAgent: React.FC<ChatAgentProps> = ({ onMessage, onClose, isProcessing }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
      <h3 className="text-xl font-semibold text-white mb-4">AI Agent</h3>
      <textarea 
        placeholder="Describe what you want the AI agents to do..."
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onMessage((e.target as HTMLTextAreaElement).value);
          }
        }}
      />
    </div>
  </div>
);

const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({ nodes, isProcessing }) => (
  <div className="fixed top-4 right-4 w-80 bg-white/10 backdrop-blur-md rounded-2xl p-4 z-40">
    <h3 className="text-lg font-semibold text-white mb-4">Agent Workflow</h3>
    <div className="space-y-3">
      {nodes.map((node, index) => (
        <div key={node.id} className="bg-gradient-to-r from-blue-400 to-blue-600 p-3 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-white text-sm">{node.title}</span>
            <span className="text-xs text-white/80 uppercase">{node.type}</span>
          </div>
          <p className="text-white/90 text-xs">{node.description}</p>
        </div>
      ))}
    </div>
  </div>
);

const OutputPanel: React.FC<OutputPanelProps> = ({ content, onClose }) => (
  <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40">
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white">Output</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">×</button>
      </div>
      <div className="p-4 max-h-60 overflow-y-auto">
        <pre className="text-white/90 text-sm whitespace-pre-wrap">{content}</pre>
      </div>
    </div>
  </div>
);

export const WorkspaceCanvas: React.FC<WorkspaceCanvasProps> = ({ workspaceId }) => {
  const [showChat, setShowChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowNodes, setWorkflowNodes] = useState<any[]>([]);
  const [outputData, setOutputData] = useState<string>('');

  const handleChatMessage = useCallback(async (message: string) => {
    setIsProcessing(true);
    setShowChat(false);
    
    try {
      // TODO: Implement AI agent workflow orchestration
      // This will call the backend API to process the message
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001'}/api/workflow/process`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('kinde_token') || ''}`
        },
        body: JSON.stringify({ message, workspace_id: workspaceId })
      });
      
      const result = await response.json();
      const data = result.data;
      setWorkflowNodes(data?.nodes || []);
      setOutputData(data?.output || '');
    } catch (error) {
      console.error('Error processing workflow:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [workspaceId]);

  return (
    <div className="relative h-screen w-full">
      {/* Excalidraw Canvas */}
      <div className="absolute inset-0">
        <Excalidraw
          theme="dark"
          initialData={{
            elements: [],
            appState: {
              theme: "dark",
              viewBackgroundColor: "transparent"
            }
          }}
        />
      </div>

      {/* Floating Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 transition-transform"
        onClick={() => setShowChat(true)}
      >
        🤖
      </motion.button>

      {/* Chat Agent Modal */}
      {showChat && (
        <ChatAgent
          onMessage={handleChatMessage}
          onClose={() => setShowChat(false)}
          isProcessing={isProcessing}
        />
      )}

      {/* Workflow Visualization */}
      {workflowNodes.length > 0 && (
        <WorkflowVisualization 
          nodes={workflowNodes}
          isProcessing={isProcessing}
        />
      )}

      {/* Output Panel */}
      {outputData && (
        <OutputPanel 
          content={outputData}
          onClose={() => setOutputData('')}
        />
      )}
    </div>
  );
};

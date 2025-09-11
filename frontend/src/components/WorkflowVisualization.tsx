import React from 'react';
import { motion } from 'framer-motion';

interface WorkflowNode {
  id: string;
  type: 'planner' | 'coder' | 'reviewer' | 'executor';
  status: 'pending' | 'running' | 'completed' | 'error';
  title: string;
  description: string;
  output?: string;
}

interface WorkflowVisualizationProps {
  nodes: WorkflowNode[];
  isProcessing: boolean;
}

export const WorkflowVisualization: React.FC<WorkflowVisualizationProps> = ({ nodes, isProcessing }) => {
  const getNodeColor = (type: string, status: string) => {
    const colors = {
      planner: 'from-blue-400 to-blue-600',
      coder: 'from-green-400 to-green-600',
      reviewer: 'from-yellow-400 to-yellow-600',
      executor: 'from-purple-400 to-purple-600'
    };
    
    if (status === 'error') return 'from-red-400 to-red-600';
    if (status === 'completed') return colors[type as keyof typeof colors];
    if (status === 'running') return 'from-orange-400 to-orange-600';
    return 'from-gray-400 to-gray-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '⚡';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      className="fixed top-4 right-4 w-80 max-h-[80vh] overflow-y-auto z-40"
    >
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Agent Workflow</h3>
          {isProcessing && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        <div className="space-y-3">
          {nodes.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className={`bg-gradient-to-r ${getNodeColor(node.type, node.status)} p-3 rounded-xl`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(node.status)}</span>
                    <span className="font-medium text-white text-sm">{node.title}</span>
                  </div>
                  <span className="text-xs text-white/80 uppercase tracking-wide">{node.type}</span>
                </div>
                <p className="text-white/90 text-xs leading-relaxed">{node.description}</p>
                
                {node.status === 'running' && (
                  <motion.div
                    className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden"
                    initial={{ width: 0 }}
                  >
                    <motion.div
                      className="h-full bg-white"
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.div>
                )}
              </div>
              
              {/* Connection Line */}
              {index < nodes.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-white/50 to-white/20" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

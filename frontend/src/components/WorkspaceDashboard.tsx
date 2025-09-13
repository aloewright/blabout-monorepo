import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Moon, Sun, Folder, Play } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { WorkspaceSettings } from './WorkspaceSettings';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { createWorkspace } from '../store/workspaceSlice';

interface Agent {
  id: string;
  title: string;
  description: string;
  task: string;
  model: string;
}

interface WorkspaceDashboardProps {
  workspaceId?: string;
}

export const WorkspaceDashboard: React.FC<WorkspaceDashboardProps> = ({ workspaceId }) => {
  const dispatch = useDispatch();
  const { workspaces, isLoading } = useSelector((state: RootState) => state.workspace);

  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', title: 'Software Dev Agent', description: 'Manages software development lifecycle.', task: 'Write a Python script', model: 'GPT-4' },
    { id: '2', title: 'Video Generation Agent', description: 'Creates videos from scripts or images.', task: 'Generate a product demo', model: 'Sora' },
    { id: '3', title: 'Blog Generation Agent', description: 'Generates high-quality blog posts.', task: 'Write an article about AI', model: 'GPT-4 Turbo' },
    { id: '4', title: 'Browser Automation Agent', description: 'Automates tasks in a web browser.', task: 'Log in to a website', model: 'Agent-GPT' }
  ]);

  const handleCreateWorkspace = async () => {
    const workspaceName = `Workspace ${workspaces.length + 1}`;
    try {
      await dispatch(createWorkspace(workspaceName) as any);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleAddAgent = () => {
    const newAgent: Agent = {
      id: Date.now().toString(),
      title: 'New Agent',
      description: 'A new AI agent ready to be configured.',
      task: 'Define your task',
      model: 'GPT-4 Turbo'
    };
    setAgents([...agents, newAgent]);
  };

  const handleEditAgent = (id: string) => console.log('Edit agent:', id);
  const handleDeleteAgent = (id: string) => setAgents(agents.filter(agent => agent.id !== id));
  const handleRunAgent = (id: string) => console.log('Run agent:', id);

  return (
    <div className="flex h-screen text-gray-300">
      {/* Left Sidebar */}
      <div className="w-72 p-4 flex flex-col glassmorphism m-2 rounded-2xl">
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Workspaces</h2>
            <button
              onClick={handleCreateWorkspace}
              disabled={isLoading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5 text-gray-300" />
            </button>
          </div>
          <button className="flex items-center space-x-3 w-full p-3 bg-white/10 rounded-lg">
            <Folder className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-white">Current Workspace</span>
          </button>
          <button className="flex items-center space-x-3 w-full p-3 hover:bg-white/5 rounded-lg transition-colors">
            <Play className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Run All Agents</span>
          </button>
        </div>
        <WorkspaceSettings />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
              <p className="text-gray-400">Manage your AI agent workflows</p>
            </div>
            <button
              onClick={handleAddAgent}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Agent</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <AgentCard
                  id={agent.id}
                  title={agent.title}
                  description={agent.description}
                  task={agent.task}
                  model={agent.model}
                  onEdit={handleEditAgent}
                  onDelete={handleDeleteAgent}
                  onRun={handleRunAgent}
                />
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default WorkspaceDashboard;

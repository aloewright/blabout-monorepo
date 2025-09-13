import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Card from './Card';
import GlassButton from './GlassButton';

interface Agent {
  id: string;
  title: string;
  description: string;
  task: string;
  model: string;
}

export const WorkspaceDashboard: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([
    { id: '1', title: 'Software Dev Agent', description: 'Manages software development lifecycle.', task: 'Write a Python script', model: 'GPT-4' },
    { id: '2', title: 'Video Generation Agent', description: 'Creates videos from scripts or images.', task: 'Generate a product demo', model: 'Sora' },
    { id: '3', title: 'Blog Generation Agent', description: 'Generates high-quality blog posts.', task: 'Write an article about AI', model: 'GPT-4 Turbo' },
    { id: '4', title: 'Browser Automation Agent', description: 'Automates tasks in a web browser.', task: 'Log in to a website', model: 'Agent-GPT' }
  ]);

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-typography">Agent Dashboard</h1>
          <p className="text-typography">Manage your AI agent workflows</p>
        </div>
        <GlassButton onClick={handleAddAgent}>
          <Plus className="w-4 h-4 mr-2" />
          Add Agent
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <h3 className="text-xl font-bold mb-2">{agent.title}</h3>
              <p className="text-typography mb-4">{agent.description}</p>
              <div className="flex justify-between">
                <GlassButton onClick={() => handleRunAgent(agent.id)}>Run</GlassButton>
                <div>
                  <GlassButton onClick={() => handleEditAgent(agent.id)}>Edit</GlassButton>
                  <GlassButton onClick={() => handleDeleteAgent(agent.id)}>Delete</GlassButton>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default WorkspaceDashboard;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, Play, Settings, X } from 'lucide-react';

interface AgentCardProps {
  id: string;
  title: string;
  description: string;
  task: string;
  model: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onRun?: (id: string) => void;
  className?: string;
}

interface AgentModalProps {
  agent: {
    id: string;
    title: string;
    description: string;
    task: string;
    model: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: any) => void;
}

const AgentModal: React.FC<AgentModalProps> = ({ agent, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: agent.title,
    instructions: agent.description,
    model: agent.model,
    context: ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ ...agent, title: formData.title, description: formData.instructions, model: formData.model });
    onClose();
  };

  const inputStyles = "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glassmorphism rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="text-xl font-semibold bg-transparent border-none outline-none text-white placeholder-gray-400" placeholder="Agent Name" />
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Instructions</label>
            <textarea value={formData.instructions} onChange={(e) => setFormData({ ...formData, instructions: e.target.value })} rows={5} className={`${inputStyles} resize-none`} placeholder="You are a senior software engineer..." />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Model</label>
              <select value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className={inputStyles}>
                <option>GPT-4 Turbo</option> <option>GPT-4</option> <option>Claude-3</option> <option>Gemini Pro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Context</label>
              <input type="text" value={formData.context} onChange={(e) => setFormData({ ...formData, context: e.target.value })} className={inputStyles} placeholder="Add context here..." />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-white/10 mt-auto">
          <div className="flex space-x-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-white/5 hover:bg-white/10 transition-colors">
              <Play className="w-4 h-4" /> <span>Test</span>
            </button>
          </div>
          <button onClick={handleSave} className="px-6 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors">
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const AgentCard: React.FC<AgentCardProps> = ({
  id, title, description, task, model, onEdit, onDelete, onRun, className = ''
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const agent = { id, title, description, task, model };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        className={`relative group glassmorphism rounded-2xl p-6 transition-all duration-300 hover:border-purple-500/50 ${className}`}
      >
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 rounded-lg hover:bg-white/10">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-32 glassmorphism rounded-lg shadow-lg py-1 z-10">
                <button onClick={() => { setShowModal(true); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5">
                  Edit
                </button>
                <button onClick={() => { onDelete?.(id); setShowMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-400 mb-4 line-clamp-2 h-10">{description}</p>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">📝</span>
            <span className="text-gray-300 truncate">{task}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">🤖</span>
            <span className="text-gray-300">{model}</span>
          </div>
        </div>

        <button
          onClick={() => onRun?.(id)}
          className="absolute top-6 right-12 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20"
        >
          <Play className="w-4 h-4 text-green-400" />
        </button>
      </motion.div>

      <AgentModal
        agent={agent}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={(updatedAgent) => {
          onEdit?.(updatedAgent.id);
          console.log('Updated agent:', updatedAgent);
        }}
      />
    </>
  );
};

export default AgentCard;

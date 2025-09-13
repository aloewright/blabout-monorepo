import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save } from 'lucide-react';

interface WorkspaceSettingsProps {
  className?: string;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ className = '' }) => {
  const [mcpServer, setMcpServer] = useState('ws://localhost:8080');
  const [defaultModel, setDefaultModel] = useState('GPT-4 Turbo');

  const handleSaveSettings = () => {
    console.log('Saving settings:', { mcpServer, defaultModel });
  };

  const inputStyles = "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-gray-300 placeholder-gray-500 focus:ring-1 focus:ring-purple-500 focus:border-transparent outline-none text-sm";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`mt-auto ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Settings className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-white">Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">MCP Server</label>
          <input type="text" value={mcpServer} onChange={(e) => setMcpServer(e.target.value)} className={inputStyles} placeholder="ws://localhost:8080" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Default AI Model</label>
          <select value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} className={inputStyles}>
            <option>GPT-4 Turbo</option>
            <option>GPT-4</option>
            <option>Claude-3</option>
            <option>Gemini Pro</option>
            <option>Llama 2</option>
          </select>
        </div>

        <button
          onClick={handleSaveSettings}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
      </div>
    </motion.div>
  );
};

export default WorkspaceSettings;

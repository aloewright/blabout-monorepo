import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, X, CheckCircle } from 'lucide-react';

interface OutputPanelProps {
  content: string;
  onClose: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ content, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-40"
      >
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white">Output</h3>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center space-x-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle size={16} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy</span>
                  </>
                )}
              </motion.button>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4 max-h-60 overflow-y-auto">
            <pre className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap font-mono">
              {content}
            </pre>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

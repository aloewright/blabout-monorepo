import React from 'react';
import { motion } from 'framer-motion';
import GoogleAuth from './GoogleAuth';
import { Zap } from 'lucide-react';
import Card from './Card';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        className="w-full max-w-md"
      >
        <Card>
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
              className="inline-block p-3 bg-btn rounded-full mb-4"
            >
              <Zap className="text-typography" size={24} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-typography mb-2"
            >
              Welcome to Blabout
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-typography"
            >
              Your AI Agent Workflow Platform
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GoogleAuth 
              onSuccess={(user) => console.log('Login successful:', user)}
              onError={(error) => console.error('Login failed:', error)}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-8 text-center"
          >
            <p className="text-typography text-xs">
              Securely sign in with your Google account.
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
};

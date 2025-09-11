import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, LogOut } from 'lucide-react';
import { Layout } from './Layout';
import { WorkspaceCanvas } from './WorkspaceCanvas';
import { RootState, AppDispatch } from '../store/store';
import { fetchWorkspaces, createWorkspace, setCurrentWorkspace } from '../store/workspaceSlice';

export const Dashboard: React.FC = () => {
  const { logout, user } = useKindeAuth();
  const dispatch = useDispatch<AppDispatch>();
  const { workspaces, currentWorkspace, isLoading, error } = useSelector((state: RootState) => state.workspace);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    dispatch(fetchWorkspaces());
  }, [dispatch]);

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    try {
      const result = await dispatch(createWorkspace(newWorkspaceName));
      if (createWorkspace.fulfilled.match(result)) {
        dispatch(setCurrentWorkspace(result.payload));
        setNewWorkspaceName('');
        setShowNewWorkspaceModal(false);
      }
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  if (currentWorkspace) {
    return <WorkspaceCanvas workspaceId={currentWorkspace.id} />;
  }

  return (
    <Layout>
      <div className="min-h-screen p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-white"
            >
              Welcome back, {user?.given_name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/80 mt-1"
            >
              Choose a workspace to start collaborating with AI agents
            </motion.p>
          </div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => logout()}
            className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </motion.button>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* New Workspace Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 border-dashed cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setShowNewWorkspaceModal(true)}
          >
            <div className="flex flex-col items-center justify-center h-32 text-white/60">
              <Plus size={32} className="mb-2" />
              <span className="font-medium">New Workspace</span>
            </div>
          </motion.div>

          {/* Existing Workspaces */}
          {workspaces.map((workspace, index) => (
            <motion.div
              key={workspace.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => setCurrentWorkspace(workspace)}
            >
              <div className="h-32 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">{workspace.name}</h3>
                  <p className="text-white/60 text-sm">
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/40 text-xs">
                    Last updated {new Date(workspace.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-12"
          >
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200"
          >
            Error: {error}
          </motion.div>
        )}

        {/* New Workspace Modal */}
        {showNewWorkspaceModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-md w-full"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Create New Workspace</h3>
              <form onSubmit={handleCreateWorkspace}>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Workspace name..."
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                  autoFocus
                />
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowNewWorkspaceModal(false)}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newWorkspaceName.trim() || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
};

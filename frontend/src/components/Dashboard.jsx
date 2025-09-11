import React, { useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { motion } from 'framer-motion';
import { usePostHog } from '../providers/PostHogProvider';

const Dashboard = () => {
  const { user, logout, isAuthenticated } = useKindeAuth();
  const { trackEvent, trackPageView } = usePostHog();

  useEffect(() => {
    trackPageView('dashboard');
  }, [trackPageView]);

  useEffect(() => {
    // Redirect to home if not authenticated
    if (!isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Please sign in to access your dashboard
          </h2>
          <a 
            href="/"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go back to homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300">
                Welcome, {user.given_name}!
              </span>
              <button
                onClick={() => {
                  trackEvent('logout_clicked', { source: 'dashboard' });
                  logout();
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* User Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Profile
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {user.given_name} {user.family_name}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <p className="text-lg text-gray-900 dark:text-white">
                  {user.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User ID
                </label>
                <p className="text-sm font-mono text-gray-600 dark:text-gray-400">
                  {user.id}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer"
              onClick={() => trackEvent('feature_clicked', { feature: 'analytics' })}
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 rounded-lg p-2">
                  <span className="text-white text-xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                  Analytics
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                View your usage analytics and insights powered by PostHog
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer"
              onClick={() => trackEvent('feature_clicked', { feature: 'settings' })}
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-500 rounded-lg p-2">
                  <span className="text-white text-xl">⚙️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                  Settings
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your account settings and preferences
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 cursor-pointer"
              onClick={() => trackEvent('feature_clicked', { feature: 'mobile_app' })}
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-500 rounded-lg p-2">
                  <span className="text-white text-xl">📱</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">
                  Mobile App
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                Download our mobile app for iOS and Android
              </p>
            </motion.div>
          </div>

          {/* API Status */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Frontend: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Backend: Online</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-700 dark:text-gray-300">Analytics: Active</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;

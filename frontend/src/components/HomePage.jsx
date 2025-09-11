import React, { useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { motion } from 'framer-motion';
import { usePostHog } from '../providers/PostHogProvider';

const HomePage = () => {
  const { login, register, isAuthenticated, user, logout } = useKindeAuth();
  const { trackEvent, trackPageView } = usePostHog();

  useEffect(() => {
    trackPageView('homepage');
  }, [trackPageView]);

  const handleLogin = () => {
    trackEvent('login_clicked', { source: 'homepage' });
    login();
  };

  const handleRegister = () => {
    trackEvent('register_clicked', { source: 'homepage' });
    register();
  };

  const handleLogout = () => {
    trackEvent('logout_clicked', { source: 'homepage' });
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Welcome to <span className="text-indigo-600">blabout.com</span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Your modern full-stack application with React, Rust, Expo, and Electron
          </p>

          {!isAuthenticated ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-x-4"
            >
              <button
                onClick={handleLogin}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Sign In
              </button>
              <button
                onClick={handleRegister}
                className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Sign Up
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Welcome back, <span className="font-semibold">{user?.given_name || 'User'}</span>!
              </p>
              <div className="space-x-4">
                <a
                  href="/dashboard"
                  onClick={() => trackEvent('dashboard_clicked', { source: 'homepage' })}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 inline-block"
                >
                  Go to Dashboard
                </a>
                <button
                  onClick={handleLogout}
                  className="border border-gray-300 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              🌐 Web App
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              React with modern UI components, animations, and state management
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              📱 Mobile App
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Expo + React Native with Tamagui for beautiful native experiences
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
              🖥️ Desktop App
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Electron app for Windows, macOS, and Linux distribution
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { AuthWrapper } from './components/AuthWrapper';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import './App.css';

// Callback component for handling auth redirect
function AuthCallback() {
  const { isAuthenticated, isLoading } = useKindeAuth();
  
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p>Processing authentication...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useKindeAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/*" 
          element={isAuthenticated ? <Dashboard /> : <LoginPage />} 
        />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }
        }}
      />
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AuthWrapper>
        <AppContent />
      </AuthWrapper>
    </Provider>
  );
}

export default App;

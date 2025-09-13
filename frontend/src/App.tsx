import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import { RootState } from './store/store';
import { AuthWrapper } from './components/AuthWrapper';
import { LoginPage } from './components/LoginPage';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import './App.css';

function AppContent() {
  const { isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/*" 
          element={isAuthenticated ? <WorkspaceDashboard /> : <LoginPage />} 
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
      <div className="main-bg">
        <AuthWrapper>
          <AppContent />
        </AuthWrapper>
      </div>
    </Provider>
  );
}

export default App;

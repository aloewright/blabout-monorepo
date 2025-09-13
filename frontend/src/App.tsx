import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/store';
import GlassNav from './components/GlassNav';
import { LoginPage } from './components/LoginPage';
import { WorkspaceDashboard } from './components/WorkspaceDashboard';
import './globals.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <GlassNav />
        <main className="pt-20">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<WorkspaceDashboard />} />
          </Routes>
        </main>
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
    </Provider>
  );
}

export default App;

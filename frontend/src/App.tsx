import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'calc(10px + 2vmin)',
        color: 'white',
        padding: '2rem'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '800px' }}>
          <h1 style={{ 
            fontSize: '4rem', 
            marginBottom: '1rem',
            background: 'linear-gradient(45deg, #fff, #f0f9ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            🎉 blabout.com
          </h1>
          
          <p style={{ 
            fontSize: '1.5rem', 
            marginBottom: '3rem',
            opacity: 0.9 
          }}>
            Your Modern Full-Stack Monorepo is Live!
          </p>

          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>✅ Deployed</h3>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                React app successfully running on Google Cloud Run with buildpacks
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔐 Secure</h3>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                40+ API keys secured in Google Cloud Secret Manager
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '2rem',
              borderRadius: '1rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🚀 Ready</h3>
              <p style={{ fontSize: '1rem', opacity: 0.8 }}>
                Mobile, desktop, and backend components configured
              </p>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255, 255, 255, 0.15)',
            padding: '2rem',
            borderRadius: '1rem',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>
              🏗️ Infrastructure Status
            </h2>
            
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'left',
              fontSize: '1rem'
            }}>
              <div>✅ <strong>Frontend:</strong> Cloud Run (Active)</div>
              <div>✅ <strong>Secrets:</strong> Google Cloud Secured</div>
              <div>✅ <strong>Auth:</strong> Kinde Ready</div>
              <div>✅ <strong>Analytics:</strong> PostHog Configured</div>
              <div>✅ <strong>Repository:</strong> GitHub Published</div>
              <div>✅ <strong>Testing:</strong> Modal Devlooper Setup</div>
              <div>🚧 <strong>Backend:</strong> Rust + ParadeDB Ready</div>
              <div>🚧 <strong>Mobile:</strong> Expo + EAS Ready</div>
            </div>

            <div style={{ 
              marginTop: '2rem',
              padding: '1.5rem',
              background: 'rgba(34, 197, 94, 0.2)',
              borderRadius: '0.75rem',
              border: '1px solid rgba(34, 197, 94, 0.3)'
            }}>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                🎯 <strong>Success!</strong> Your monorepo is deployed and running on Google Cloud Run with buildpacks.
              </p>
            </div>
          </div>

          <p style={{ 
            marginTop: '2rem',
            fontSize: '1rem',
            opacity: 0.7 
          }}>
            Repository: <a 
              href="https://github.com/aloewright/blabout-monorepo" 
              style={{ color: '#bfdbfe' }}
              target="_blank" 
              rel="noopener noreferrer"
            >
              github.com/aloewright/blabout-monorepo
            </a>
          </p>
        </div>
      </header>
    </div>
  );
}

export default App;

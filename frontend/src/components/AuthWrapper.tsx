import React, { ReactNode, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    // Prefer compile-time var, else fetch runtime from /env.json
    const fromEnv = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (fromEnv) {
      setClientId(fromEnv);
      return;
    }
    fetch('/env.json')
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('env load failed')))
      .then((json) => setClientId(json.googleClientId || null))
      .catch(() => setClientId(null));
  }, []);

  // Always render provider to ensure useGoogleLogin has context.
  // When clientId hasn't loaded yet, pass empty string; GoogleAuth will show setup UI.
  return (
    <GoogleOAuthProvider clientId={clientId || ''}>
      {children}
    </GoogleOAuthProvider>
  );
};

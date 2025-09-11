import React, { ReactNode } from 'react';
import { KindeProvider } from '@kinde-oss/kinde-auth-react';

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return (
    <KindeProvider
      clientId={process.env.REACT_APP_KINDE_CLIENT_ID || ""}
      domain={process.env.REACT_APP_KINDE_DOMAIN || ""}
      redirectUri={process.env.REACT_APP_KINDE_REDIRECT_URI || `${window.location.origin}/auth/callback`}
      logoutUri={process.env.REACT_APP_KINDE_POST_LOGOUT_REDIRECT_URL || window.location.origin}
    >
      {children}
    </KindeProvider>
  );
};

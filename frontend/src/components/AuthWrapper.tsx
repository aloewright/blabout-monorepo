import React, { ReactNode } from 'react';
import { GoogleAuthProvider } from './GoogleAuth';

interface AuthWrapperProps {
  children: ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  return (
    <GoogleAuthProvider>
      {children}
    </GoogleAuthProvider>
  );
};

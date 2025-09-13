import React from 'react';
import { GoogleOAuthProvider, googleLogout, useGoogleLogin, TokenResponse } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import axios from 'axios';
import { RootState } from '../store/store';
import { setUser, clearUser } from '../store/authSlice';
import GlassButton from './GlassButton';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '28692687396-7uta6kmtcacg7eq5g4cjmuia592ibfb1.apps.googleusercontent.com';
const isValidClientId = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('abc123');

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.1718 3.68182 9.59182 3.68182 9C3.68182 8.40818 3.78409 7.82818 3.96409 7.29H0.957275C0.347727 8.46364 0 9.81 0 11.29C0 12.77 0.347727 14.1164 0.957275 15.29L3.96409 12.8682V10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4673 0.891818 11.43 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);

interface GoogleAuthProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess, onError }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLoginError = (error: any) => {
    console.error('Google login failed:', error);
    onError?.(error);
  };

  const handleLoginSuccess = async (tokenResponse: Omit<TokenResponse, 'error' | 'error_description' | 'error_uri'>) => {
    try {
      // Exchange Google access token for a server-signed PASETO
      const apiBase = process.env.REACT_APP_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      const loginResp = await axios.post(`${apiBase}/auth/paseto/login`, {
        access_token: tokenResponse.access_token,
      });

      const pasetoToken = loginResp.data?.data?.token;
      const claims = loginResp.data?.data?.claims;
      if (!pasetoToken) throw new Error('No PASETO token returned');

      // Store PASETO token
      localStorage.setItem('auth_token', pasetoToken);

      const userData = {
        id: claims?.sub,
        email: claims?.email,
        name: claims?.name,
        picture: '',
        given_name: '',
        family_name: '',
      };

      dispatch(setUser(userData));
      onSuccess?.(userData);
    } catch (error) {
      handleLoginError(error);
    }
  };

  const login = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginError,
    ux_mode: 'popup',
  });

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem('google_token');
    dispatch(clearUser());
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        <span className="text-sm font-medium text-typography">{user.name}</span>
        <GlassButton onClick={handleLogout}>Logout</GlassButton>
      </div>
    );
  }

  if (!isValidClientId) {
    return (
      <div className="p-4 bg-yellow-900/50 border border-yellow-700/50 rounded-md text-yellow-200">
        <h3 className="font-semibold">Google OAuth Setup Required</h3>
        <p className="text-sm mt-2">Please set the REACT_APP_GOOGLE_CLIENT_ID environment variable to enable Google login.</p>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <GlassButton onClick={() => login()}>
        <div className="flex items-center justify-center gap-3">
          <GoogleIcon />
          Sign in with Google
        </div>
      </GlassButton>
    </motion.div>
  );
};

const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export { GoogleAuth, GoogleAuthProvider };
export default GoogleAuth;

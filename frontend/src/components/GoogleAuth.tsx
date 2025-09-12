import React from 'react';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { setUser, clearUser } from '../store/authSlice';

// For demo purposes, using a placeholder. In production, get this from Google Cloud Console > APIs & Services > Credentials
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '28692687396-abc123.apps.googleusercontent.com';

interface GoogleAuthProps {
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onSuccess, onError }) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLoginSuccess = (credentialResponse: any) => {
    try {
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      
      const userData = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };

      dispatch(setUser(userData));
      onSuccess?.(userData);
    } catch (error) {
      console.error('Error parsing Google credential:', error);
      onError?.(error);
    }
  };

  const handleLoginError = () => {
    const error = 'Google login failed';
    console.error(error);
    onError?.(error);
  };

  const handleLogout = () => {
    googleLogout();
    dispatch(clearUser());
  };

  if (user) {
    return (
      <div className="flex items-center space-x-4">
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.name}
        </span>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <GoogleLogin
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
      useOneTap={false}
      theme="outline"
      size="medium"
    />
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

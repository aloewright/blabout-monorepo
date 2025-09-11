import React, { useEffect } from 'react';
import { usePostHog } from '../providers/PostHogProvider';

const AuthCallback = () => {
  const { trackEvent } = usePostHog();

  useEffect(() => {
    trackEvent('auth_callback_loaded');
    
    // The Kinde SDK will handle the callback automatically
    // This component just provides feedback to the user
    const timer = setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);

    return () => clearTimeout(timer);
  }, [trackEvent]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we redirect you to your dashboard.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;

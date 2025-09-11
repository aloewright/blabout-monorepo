import React, { createContext, useContext, useEffect } from 'react';
import posthog from 'posthog-js';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const PostHogContext = createContext();

export const PostHogProvider = ({ children }) => {
  const { user, isAuthenticated } = useKindeAuth();

  useEffect(() => {
    // Initialize PostHog
    if (typeof window !== 'undefined') {
      posthog.init(process.env.REACT_APP_POSTHOG_KEY, {
        api_host: process.env.REACT_APP_POSTHOG_HOST,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        debug: process.env.REACT_APP_DEBUG === 'true',
      });
    }
  }, []);

  useEffect(() => {
    // Identify user when authenticated
    if (isAuthenticated && user) {
      posthog.identify(user.id, {
        email: user.email,
        name: `${user.given_name} ${user.family_name}`,
        given_name: user.given_name,
        family_name: user.family_name,
        // Add any other user properties you want to track
      });
    } else if (!isAuthenticated) {
      posthog.reset();
    }
  }, [isAuthenticated, user]);

  const trackEvent = (eventName, properties = {}) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties);
    }
  };

  const trackPageView = (pageName) => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', { page: pageName });
    }
  };

  const setUserProperties = (properties) => {
    if (typeof window !== 'undefined') {
      posthog.people.set(properties);
    }
  };

  return (
    <PostHogContext.Provider value={{ 
      trackEvent, 
      trackPageView, 
      setUserProperties,
      posthog 
    }}>
      {children}
    </PostHogContext.Provider>
  );
};

export const usePostHog = () => {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
};

// Shared utility functions for the monorepo

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
};

export const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const apiEndpoints = {
  development: 'http://localhost:3001',
  production: 'https://your-api-domain.com',
};

export const getApiUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? apiEndpoints.production 
    : apiEndpoints.development;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

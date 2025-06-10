export type ApiBackend = 'golang' | 'nodejs';

export const API_CONFIGS = {
  golang: {
    baseURL: 'http://localhost:3001/api',
    name: 'Go API'
  },
  nodejs: {
    baseURL: 'http://localhost:3000/api',
    name: 'Node.js API'
  }
} as const;

export const DEFAULT_BACKEND: ApiBackend = 'golang';

// Get the current backend from localStorage or use default
export const getCurrentBackend = (): ApiBackend => {
  try {
    const stored = window.localStorage.getItem('selectedBackend');
    return (stored === 'golang' || stored === 'nodejs') ? stored : DEFAULT_BACKEND;
  } catch (error) {
    console.error("Could not access localStorage, defaulting to", DEFAULT_BACKEND, error);
    return DEFAULT_BACKEND;
  }
};

// Save the selected backend to localStorage
export const setCurrentBackend = (backend: ApiBackend) => {
  try {
    window.localStorage.setItem('selectedBackend', backend);
  } catch (error) {
    console.error("Could not access localStorage", error);
  }
};
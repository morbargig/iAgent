import { useState, useEffect } from 'react';

export function useMockMode() {
  const [useMockMode, setUseMockMode] = useState<boolean>(() => {
    // Initialize from localStorage or default to false (API mode)
    const stored = localStorage.getItem('chatbot-use-mock-mode');
    return stored ? JSON.parse(stored) : false;
  });

  const toggleMockMode = () => {
    setUseMockMode(prev => {
      const newValue = !prev;
      localStorage.setItem('chatbot-use-mock-mode', JSON.stringify(newValue));
      return newValue;
    });
  };

  const setMockMode = (enabled: boolean) => {
    setUseMockMode(enabled);
    localStorage.setItem('chatbot-use-mock-mode', JSON.stringify(enabled));
  };

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatbot-use-mock-mode' && e.newValue) {
        setUseMockMode(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    useMockMode,
    toggleMockMode,
    setMockMode
  };
} 
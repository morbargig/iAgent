import { useState, useEffect } from 'react';

export function useToolToggles() {
  const [enabledTools, setEnabledTools] = useState<{ [key: string]: boolean }>(() => {
    // Initialize from localStorage or default to false for all tools
    const stored = localStorage.getItem('chatbot-enabled-tools');
    return stored ? JSON.parse(stored) : {
      'tool-x': false,
      'tool-y': false,
      'tool-z': false
    };
  });

  const toggleTool = (toolId: string) => {
    setEnabledTools(prev => {
      const newValue = {
        ...prev,
        [toolId]: !prev[toolId]
      };
      localStorage.setItem('chatbot-enabled-tools', JSON.stringify(newValue));
      return newValue;
    });
  };

  const setToolEnabled = (toolId: string, enabled: boolean) => {
    setEnabledTools(prev => {
      const newValue = {
        ...prev,
        [toolId]: enabled
      };
      localStorage.setItem('chatbot-enabled-tools', JSON.stringify(newValue));
      return newValue;
    });
  };

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatbot-enabled-tools' && e.newValue) {
        setEnabledTools(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    enabledTools,
    toggleTool,
    setToolEnabled,
    isToolEnabled: (toolId: string) => enabledTools[toolId] || false
  };
} 
import { useState, useEffect } from 'react';
import type { ToolConfiguration } from '../components/ToolSettingsDialog';

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

  const [toolConfigurations, setToolConfigurations] = useState<{ [key: string]: ToolConfiguration }>(() => {
    // Initialize configurations from localStorage
    const stored = localStorage.getItem('chatbot-tool-configurations');
    return stored ? JSON.parse(stored) : {};
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

  const setToolConfiguration = (toolId: string, config: ToolConfiguration) => {
    setToolConfigurations(prev => {
      const newConfigs = { ...prev, [toolId]: config };
      localStorage.setItem('chatbot-tool-configurations', JSON.stringify(newConfigs));
      return newConfigs;
    });

    // Also update the enabled state
    setToolEnabled(toolId, config.enabled);
  };

  const getToolConfiguration = (toolId: string): ToolConfiguration | undefined => {
    return toolConfigurations[toolId];
  };

  const isToolConfigured = (toolId: string, toolSchema?: any): boolean => {
    const config = toolConfigurations[toolId];
    
    // If tool is not enabled or doesn't require configuration, it's considered configured
    if (!config?.enabled || !toolSchema?.requiresConfiguration) return true;
    
    // Since we made all fields non-required, tools are always considered configured
    // This removes the blocking behavior while keeping the settings available
    return true;
  };

  const getEnabledToolsRequiringConfig = (toolSchemas: any[]): string[] => {
    return toolSchemas
      .filter(tool => {
        const config = toolConfigurations[tool.id];
        return config?.enabled && tool.requiresConfiguration && !isToolConfigured(tool.id, tool);
      })
      .map(tool => tool.id);
  };

  const hasUnconfiguredTools = (toolSchemas: any[]): boolean => {
    // Since all fields are now optional, no tools are considered "unconfigured"
    // This removes blocking behavior while keeping settings available
    return false;
  };

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatbot-enabled-tools' && e.newValue) {
        setEnabledTools(JSON.parse(e.newValue));
      } else if (e.key === 'chatbot-tool-configurations' && e.newValue) {
        setToolConfigurations(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    enabledTools,
    toolConfigurations,
    toggleTool,
    setToolEnabled,
    setToolConfiguration,
    getToolConfiguration,
    isToolConfigured,
    getEnabledToolsRequiringConfig,
    hasUnconfiguredTools,
    isToolEnabled: (toolId: string) => enabledTools[toolId] || false
  };
} 
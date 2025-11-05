import { useAppLocalStorage } from './storage';
import type { ToolConfiguration } from '../types/storage.types';

export const useToolToggles = () => {
  const [enabledTools, setEnabledTools] = useAppLocalStorage('enabled-tools');
  const [toolConfigurations, setToolConfigurations] = useAppLocalStorage('tool-configurations');

  const toggleTool = (toolId: string) => {
    setEnabledTools((prev: Record<string, boolean>) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const setToolEnabled = (toolId: string, enabled: boolean) => {
    setEnabledTools((prev: Record<string, boolean>) => ({
      ...prev,
      [toolId]: enabled,
    }));
  };

  const setToolConfiguration = (toolId: string, config: ToolConfiguration) => {
    setToolConfigurations((prev: Record<string, ToolConfiguration>) => ({
      ...prev,
      [toolId]: { ...config, toolId },
    }));
    setToolEnabled(toolId, config.enabled);
  };

  const getToolConfiguration = (toolId: string): ToolConfiguration | undefined => {
    return toolConfigurations[toolId];
  };

  const isToolConfigured = (toolId: string, toolSchema?: any): boolean => {
    const config = toolConfigurations[toolId];
    
    if (!config?.enabled || !toolSchema?.requiresConfiguration) return true;
    
    if (toolSchema.configurationFields?.pages?.required && 
        (!config.parameters?.pages?.selectedPages?.length)) {
      return false;
    }
    
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
    return toolSchemas.some(tool => {
      const config = toolConfigurations[tool.id];
      return config?.enabled && tool.requiresConfiguration && !isToolConfigured(tool.id, tool);
    });
  };

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
    isToolEnabled: (toolId: string) => enabledTools[toolId] || false,
  };
};

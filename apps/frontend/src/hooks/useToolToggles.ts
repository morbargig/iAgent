import { useMemo } from "react";
import { useAppLocalStorage } from './storage';
import type { ToolConfiguration } from '../types/storage.types';
import type { ToolSchema } from '../components/ToolSettingsDialog';
import type { ToolId } from '../utils/toolUtils';

type ToolFilterConfig = Record<string, readonly ToolId[]>;

export const TOOL_FILTER_CONFIG = {
  countries: ["tool-f"],
  dateRange: ["tool-t", "tool-h"],
} as const satisfies ToolFilterConfig;

type ToolFilterConfigMap = typeof TOOL_FILTER_CONFIG;

export type ToolFilterKey = keyof ToolFilterConfigMap;

export type ToolFilterAvailability = {
  [K in ToolFilterKey]: boolean;
};

export const getFilterAvailability = (
  enabledTools: Partial<Record<ToolId, boolean>> = {},
  config: ToolFilterConfigMap = TOOL_FILTER_CONFIG
): ToolFilterAvailability => {
  const normalizedEnabledTools = enabledTools || {};

  return Object.keys(config).reduce((acc, filterKey) => {
    const requiredTools = Array.from(config[filterKey as ToolFilterKey]);
    acc[filterKey as ToolFilterKey] =
      requiredTools.length === 0
        ? true
        : requiredTools.some((toolId) => Boolean(normalizedEnabledTools[toolId]));
    return acc;
  }, {} as ToolFilterAvailability);
};

export const useToolToggles = () => {
  const [enabledTools, setEnabledTools] = useAppLocalStorage('enabled-tools');
  const [toolConfigurations, setToolConfigurations] = useAppLocalStorage('tool-configurations');
  const filterAvailability = useMemo(
    () => getFilterAvailability(enabledTools as Partial<Record<ToolId, boolean>>),
    [enabledTools]
  );

  const toggleTool = (toolId: ToolId) => {
    setEnabledTools((prev: Partial<Record<ToolId, boolean>> = {}) => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const setToolEnabled = (toolId: ToolId, enabled: boolean) => {
    setEnabledTools((prev: Partial<Record<ToolId, boolean>> = {}) => ({
      ...prev,
      [toolId]: enabled,
    }));
  };

  const setToolConfiguration = (toolId: ToolId, config: ToolConfiguration) => {
    setToolConfigurations((prev: Partial<Record<ToolId, ToolConfiguration>> = {}) => ({
      ...prev,
      [toolId]: { ...config, toolId },
    }));
    setToolEnabled(toolId, config.enabled);
  };

  const getToolConfiguration = (toolId: ToolId): ToolConfiguration | undefined => {
    return toolConfigurations[toolId];
  };

  const isToolConfigured = (toolId: ToolId, toolSchema?: ToolSchema): boolean => {
    const config = toolConfigurations[toolId];
    
    if (!config?.enabled || !toolSchema?.requiresConfiguration) return true;
    
    if (toolSchema.configurationFields?.pages?.required && 
        (!config.parameters?.pages?.selectedPages?.length)) {
      return false;
    }
    
    return true;
  };

  const getEnabledToolsRequiringConfig = (toolSchemas: ToolSchema[]): ToolId[] => {
    return toolSchemas
      .filter(tool => {
        const config = toolConfigurations[tool.id];
        return config?.enabled && tool.requiresConfiguration && !isToolConfigured(tool.id, tool);
      })
      .map(tool => tool.id);
  };

  const hasUnconfiguredTools = (toolSchemas: ToolSchema[]): boolean => {
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
    filterAvailability,
    isToolEnabled: (toolId: ToolId) => Boolean(enabledTools?.[toolId]),
  };
};

export const useToolFilterAvailability = (
  enabledTools: Partial<Record<ToolId, boolean>>
): ToolFilterAvailability => {
  return useMemo(
    () => getFilterAvailability(enabledTools),
    [enabledTools]
  );
};

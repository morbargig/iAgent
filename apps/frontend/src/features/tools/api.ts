import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';
import type { ToolSchema } from '../../components/ToolSettingsDialog';

export interface PageOption {
  value: string;
  label: string;
}

export const usePages = () => {
  return useQuery({
    queryKey: apiKeys.tools.pages(),
    queryFn: async (): Promise<PageOption[]> => {
      const response = await http.get<PageOption[]>('/tools/pages');
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};

export const useToolSchemas = () => {
  const { data: pages = [] } = usePages();
  
  return useMemo((): ToolSchema[] => {
    return [
      {
        id: 'tool-t',
        name: 'ToolT',
        description: 'Web search tool for finding relevant information and sources',
        requiresConfiguration: true,
        configurationFields: {
          pages: {
            required: false,
            options: pages,
          },
          requiredWords: {
            required: false,
            placeholder: 'Enter keywords that must be present...',
          },
        },
      },
      {
        id: 'tool-h',
        name: 'ToolH',
        description: 'Advanced tool for specialized operations',
        requiresConfiguration: false,
        configurationFields: {},
      },
      {
        id: 'tool-f',
        name: 'ToolF',
        description: 'Flexible tool for various data processing tasks',
        requiresConfiguration: false,
        configurationFields: {},
      },
    ];
  }, [pages]);
};



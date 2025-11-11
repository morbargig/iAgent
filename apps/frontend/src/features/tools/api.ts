import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { http } from '../../lib/http';
import { keys } from '../../lib/keys';
import type { ToolSchema } from '../../components/ToolSettingsDialog';

export interface PageOption {
  value: string;
  label: string;
}

export const usePages = () => {
  return useQuery({
    queryKey: keys.tools.pages(),
    queryFn: async (): Promise<PageOption[]> => {
      try {
        const response = await http.get<PageOption[]>('/tools/pages');
        console.log('Pages API response:', response.data);
        if (!response.data || !Array.isArray(response.data)) {
          console.warn('Invalid pages response:', response.data);
          return [];
        }
        return response.data;
      } catch (error: unknown) {
        console.error('Failed to fetch pages:', error);
        const errorDetails = error as { message?: string; response?: { data?: unknown; status?: number }; config?: { url?: string } };
        console.error('Error details:', {
          message: errorDetails?.message,
          response: errorDetails?.response?.data,
          status: errorDetails?.response?.status,
          url: errorDetails?.config?.url,
        });
        return [];
      }
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


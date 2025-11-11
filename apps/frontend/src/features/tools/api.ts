import { useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { keys } from '../../lib/keys';
import type { ToolSchema } from '../../components/ToolSettingsDialog';

export interface PageOption {
  value: string;
  label: string;
}

const staticToolSchemas: ToolSchema[] = [
  {
    id: 'tool-x',
    name: 'ToolT',
    description: 'Web search tool for finding relevant information and sources',
    requiresConfiguration: true,
    configurationFields: {
      pages: {
        required: false,
        options: [

        ],
      },
      requiredWords: {
        required: false,
        placeholder: 'Enter keywords that must be present...',
      },
    },
  },
  {
    id: 'tool-y',
    name: 'ToolH',
    description: 'Advanced tool for specialized operations',
    requiresConfiguration: false,
    configurationFields: {},
  },
  {
    id: 'tool-z',
    name: 'ToolF',
    description: 'Flexible tool for various data processing tasks',
    requiresConfiguration: false,
    configurationFields: {},
  },
];

export const useToolSchemas = () => {
  const { data: pages = [] } = usePages();
  
  return useQuery({
    queryKey: [...keys.tools.all, pages],
    queryFn: async (): Promise<ToolSchema[]> => {
      const schemas = [...staticToolSchemas];
      
      if (schemas[0] && schemas[0].configurationFields?.pages) {
        schemas[0] = {
          ...schemas[0],
          configurationFields: {
            ...schemas[0].configurationFields,
            pages: {
              ...schemas[0].configurationFields.pages,
              options: pages.length > 0 ? pages : schemas[0].configurationFields.pages.options || [],
            },
          },
        };
      }
      
      return schemas;
    },
    staleTime: Infinity,
    enabled: true,
  });
};

export const usePages = () => {
  return useQuery({
    queryKey: keys.tools.pages(),
    queryFn: async (): Promise<PageOption[]> => {
      try {
        const response = await http.get<PageOption[]>('/tools/pages');
        return response.data;
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};


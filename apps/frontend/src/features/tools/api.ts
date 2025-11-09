import { useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { keys } from '../../lib/keys';
import type { ToolSchema } from '../../components/ToolSettingsDialog';

const mockToolSchemas: ToolSchema[] = [
  {
    id: 'tool-x',
    name: 'ToolT',
    description: 'Web search tool for finding relevant information and sources',
    requiresConfiguration: true,
    configurationFields: {
      pages: {
        required: false,
        options: [
          { value: 'news', label: 'News Articles' },
          { value: 'academic', label: 'Academic Papers' },
          { value: 'blogs', label: 'Blog Posts' },
          { value: 'forums', label: 'Discussion Forums' },
          { value: 'wiki', label: 'Wikipedia' },
          { value: 'government', label: 'Government Sites' },
          { value: 'social', label: 'Social Media' },
          { value: 'commercial', label: 'Commercial Sites' },
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
  return useQuery({
    queryKey: keys.tools.schemas(),
    queryFn: async (): Promise<ToolSchema[]> => {
      try {
        const response = await http.get<ToolSchema[]>('/tools/schemas');
        return response.data;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockToolSchemas;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};


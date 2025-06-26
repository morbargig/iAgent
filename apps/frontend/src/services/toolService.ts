import React from 'react';
import type { ToolSchema } from '../components/ToolSettingsDialog';

// Mock tool schemas - in real implementation, this would fetch from the server
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

export class ToolService {
  static async fetchToolSchemas(): Promise<ToolSchema[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In real implementation, this would be an API call:
    // const response = await fetch('/api/tools/schemas');
    // return response.json();
    
    return mockToolSchemas;
  }

  static async fetchPageOptions(toolId: string): Promise<{ value: string; label: string }[]> {
    // Simulate API call for dynamic page options
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const tool = mockToolSchemas.find(t => t.id === toolId);
    return tool?.configurationFields.pages?.options || [];
  }

  static async validateToolConfiguration(toolId: string, configuration: any): Promise<{ valid: boolean; errors?: string[] }> {
    // Simulate server-side validation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const tool = mockToolSchemas.find(t => t.id === toolId);
    if (!tool) {
      return { valid: false, errors: ['Tool not found'] };
    }

    // Since all fields are now non-required, validation always passes
    // This allows users to use tools with default configurations
    return { valid: true };
  }
}

// Hook to use tool schemas
export function useToolSchemas() {
  const [toolSchemas, setToolSchemas] = React.useState<ToolSchema[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchSchemas = async () => {
      try {
        setLoading(true);
        const schemas = await ToolService.fetchToolSchemas();
        setToolSchemas(schemas);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tool schemas');
      } finally {
        setLoading(false);
      }
    };

    fetchSchemas();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const schemas = await ToolService.fetchToolSchemas();
      setToolSchemas(schemas);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tool schemas');
    } finally {
      setLoading(false);
    }
  };

  return { toolSchemas, loading, error, refetch };
} 
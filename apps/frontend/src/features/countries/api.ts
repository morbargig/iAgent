import { useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';

export interface Country {
  code: string;
  flag: string;
  nameKey: string;
}

export const useCountries = () => {
  return useQuery({
    queryKey: apiKeys.countries.all(),
    queryFn: async (): Promise<Country[]> => {
      const response = await http.get<Country[]>('/countries');
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};


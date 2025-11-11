import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';
import { getApiUrl } from '../../config/config';

export interface ChatFilter {
  filterId: string;
  name: string;
  filterConfig: Record<string, unknown>;
  isActive?: boolean;
  createdAt: string;
}

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('session-token');
};

export const useFilters = (chatId: string | number | null) => {
  return useQuery({
    queryKey: apiKeys.filters.list(chatId || ''),
    queryFn: async (): Promise<ChatFilter[]> => {
      if (!chatId) return [];

      const token = getAuthToken();
      if (!token) return [];

      const response = await http.get<ChatFilter[]>(getApiUrl(`/chats/${chatId}/filters`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    enabled: !!chatId && !!getAuthToken(),
  });
};

export const useActiveFilter = (chatId: string | number | null) => {
  const { data: filters } = useFilters(chatId);
  
  const activeFilter = filters?.find((f) => f.isActive) || null;
  
  return {
    data: activeFilter,
    isLoading: false,
    error: null,
  };
};

export const useCreateFilter = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      filterId,
      name,
      filterConfig,
      isActive,
    }: {
      chatId: string;
      filterId: string;
      name: string;
      filterConfig: Record<string, unknown>;
      isActive?: boolean;
    }): Promise<ChatFilter> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await http.post<ChatFilter>(
        getApiUrl(`/chats/${chatId}/filters`),
        {
          filterId,
          name,
          filterConfig,
          isActive: isActive ?? true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: (_data, { chatId }) => {
      qc.invalidateQueries({ queryKey: apiKeys.filters.list(chatId) });
      qc.invalidateQueries({ queryKey: apiKeys.filters.active(chatId) });
    },
  });
};

export const useUpdateFilter = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      filterId,
      name,
    }: {
      filterId: string;
      name: string;
    }): Promise<ChatFilter> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await http.put<ChatFilter>(
        getApiUrl(`/chats/filters/${filterId}`),
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    },
    onMutate: async ({ filterId, name }) => {
      await qc.cancelQueries({ queryKey: apiKeys.filters.detail(filterId) });

      const prevFilter = qc.getQueryData<ChatFilter>(apiKeys.filters.detail(filterId));

      if (prevFilter) {
        qc.setQueryData(apiKeys.filters.detail(filterId), {
          ...prevFilter,
          name,
        });
      }

      return { prevFilter };
    },
    onError: (_error, { filterId }, context) => {
      if (context?.prevFilter) {
        qc.setQueryData(apiKeys.filters.detail(filterId), context.prevFilter);
      }
    },
    onSuccess: (_data, { filterId }) => {
      qc.invalidateQueries({ queryKey: apiKeys.filters.detail(filterId) });
      qc.invalidateQueries({ queryKey: apiKeys.filters.lists() });
    },
  });
};

export const useDeleteFilter = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ filterId }: { filterId: string }): Promise<void> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      await http.delete(getApiUrl(`/chats/filters/${filterId}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onMutate: async ({ filterId }) => {
      await qc.cancelQueries({ queryKey: apiKeys.filters.detail(filterId) });

      const prevFilter = qc.getQueryData<ChatFilter>(apiKeys.filters.detail(filterId));

      qc.setQueryData(apiKeys.filters.detail(filterId), undefined);

      return { prevFilter };
    },
    onError: (_error, { filterId }, context) => {
      if (context?.prevFilter) {
        qc.setQueryData(apiKeys.filters.detail(filterId), context.prevFilter);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: apiKeys.filters.lists() });
    },
  });
};

export const useSetActiveFilter = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chatId,
      filterId,
    }: {
      chatId: string;
      filterId: string;
    }): Promise<void> => {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      await http.put(
        getApiUrl(`/chats/${chatId}/active-filter`),
        { filterId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    onMutate: async ({ chatId, filterId }) => {
      await qc.cancelQueries({ queryKey: apiKeys.filters.active(chatId) });
      await qc.cancelQueries({ queryKey: apiKeys.filters.list(chatId) });

      const prevActive = qc.getQueryData<ChatFilter | null>(apiKeys.filters.active(chatId));
      const prevList = qc.getQueryData<ChatFilter[]>(apiKeys.filters.list(chatId));

      if (prevList) {
        qc.setQueryData(
          apiKeys.filters.list(chatId),
          prevList.map((f) => ({
            ...f,
            isActive: f.filterId === filterId,
          }))
        );
      }

      if (prevList) {
        const newActive = prevList.find((f) => f.filterId === filterId);
        if (newActive) {
          qc.setQueryData(apiKeys.filters.active(chatId), { ...newActive, isActive: true });
        }
      }

      return { prevActive, prevList };
    },
    onError: (_error, { chatId }, context) => {
      if (context?.prevActive) {
        qc.setQueryData(apiKeys.filters.active(chatId), context.prevActive);
      }
      if (context?.prevList) {
        qc.setQueryData(apiKeys.filters.list(chatId), context.prevList);
      }
    },
    onSuccess: (_data, { chatId }) => {
      qc.invalidateQueries({ queryKey: apiKeys.filters.active(chatId) });
      qc.invalidateQueries({ queryKey: apiKeys.filters.list(chatId) });
    },
  });
};


import { useMutation, useQuery } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
}

export interface Permissions {
  userId: string;
  role: string;
  permissions: {
    canUseToolT?: boolean;
    canUseToolH?: boolean;
    canUseToolF?: boolean;
    canViewReports?: boolean;
    canManageFilters?: boolean;
    [key: string]: boolean | undefined;
  };
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await http.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    },
  });
};

export const usePermissions = () => {
  return useQuery({
    queryKey: apiKeys.auth.permissions(),
    queryFn: async (): Promise<Permissions> => {
      const response = await http.get<Permissions>('/auth/permissions');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
};


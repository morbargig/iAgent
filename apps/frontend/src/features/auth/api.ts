import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';

const getLoginErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    if (status === 404) {
      return 'Login service not found. Check that the API URL is correct.';
    }
    if (typeof message === 'string') {
      return message;
    }
    if (status === 401) {
      return 'Invalid email or password';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Login failed';
};

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

const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('session-token');
};

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      try {
        const response = await http.post<LoginResponse>('/auth/login', credentials);
        return response.data;
      } catch (error) {
        throw new Error(getLoginErrorMessage(error));
      }
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
    enabled: !!getAuthToken(),
  });
};

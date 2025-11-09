import { useMutation } from '@tanstack/react-query';
import { http } from '../../lib/http';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await http.post<LoginResponse>('/auth/login', credentials);
      return response.data;
    },
  });
};


import axios from 'axios';
import { API_CONFIG } from '../config/config';

export const http = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT.default,
});

let getAuthToken: (() => string | null) | null = null;

export const setAuthTokenGetter = (getter: () => string | null) => {
  getAuthToken = getter;
};

http.interceptors.request.use(
  (config) => {
    if (getAuthToken) {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);


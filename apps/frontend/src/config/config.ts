/**
 * API Configuration
 * 
 * Central configuration for API endpoints and URLs
 */

import { environment } from '../environments/environment';

const getBaseUrl = (): string => {
  // Use environment configuration first
  if (environment.api?.baseUrl) {
    // console.log('🔧 Using API URL from environment:', environment.api.baseUrl);
    return environment.api.baseUrl;
  }
  
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // console.log('🔧 Using API URL from env variable:', envUrl);
    return envUrl.includes('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Default to production API for safety
  // console.log('⚠️ No API URL configured, defaulting to production API');
  return 'https://iagent-1-jzyj.onrender.com/api';
};

// Base URL for API requests (without /api suffix)
export const API_BASE_URL = environment.api?.baseUrl.replace('/api', '') || 'https://iagent-1-jzyj.onrender.com';

export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: getBaseUrl(),
  
  // API Endpoints
  ENDPOINTS: {
    files: '/files',
    chats: '/chats',
    auth: '/auth',
  },
  
  // Timeout configurations
  TIMEOUT: {
    default: environment.api?.timeout || 30000, // 30 seconds
    upload: environment.api?.uploadTimeout || 120000, // 2 minutes for file uploads
  },
} as const;

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}

/**
 * Get files API URL
 */
export function getFilesApiUrl(): string {
  return getApiUrl(API_CONFIG.ENDPOINTS.files);
}

/**
 * Get chats API URL
 */
export function getChatsApiUrl(): string {
  return getApiUrl(API_CONFIG.ENDPOINTS.chats);
}

/**
 * Get chat files upload URL
 */
export function getChatFilesUploadUrl(chatId: string): string {
  return getApiUrl(`${API_CONFIG.ENDPOINTS.files}/chat/${chatId}/upload`);
}

/**
 * Get chat files list URL
 */
export function getChatFilesListUrl(chatId: string): string {
  return getApiUrl(`${API_CONFIG.ENDPOINTS.files}/chat/${chatId}`);
}

/**
 * Get base URL without /api suffix (for streaming endpoints)
 */
export function getBaseApiUrl(): string {
  return API_BASE_URL;
}


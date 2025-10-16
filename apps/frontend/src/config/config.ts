/**
 * API Configuration
 * 
 * Central configuration for API endpoints and URLs
 */

export const API_CONFIG = {
  // Base URL for API requests
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3030/api',
  
  // API Endpoints
  ENDPOINTS: {
    files: '/files',
    chats: '/chats',
    auth: '/auth',
  },
  
  // Timeout configurations
  TIMEOUT: {
    default: 30000, // 30 seconds
    upload: 120000, // 2 minutes for file uploads
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


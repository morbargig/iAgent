export function sharedTypes(): string {
  return 'shared-types';
}

// Message Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  timestamp?: string;
  model?: string;
  processing_time_ms?: number;
  confidence?: number;
  categories?: string[];
  token_count?: number;
}

// Conversation Types
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  lastUpdated: Date;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  total_tokens?: number;
  tags?: string[];
}

// API Types
export interface ChatRequest {
  messages: Message[];
  stream?: boolean;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  message: Message;
  metadata?: MessageMetadata;
}

export interface StreamToken {
  token: string;
  done: boolean;
  metadata?: MessageMetadata;
  error?: {
    message: string;
    code?: string;
  };
}

// UI Types
export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
}

export interface Language {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  sidebarOpen: boolean;
  mockMode: boolean;
}

// Error Types
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  timestamp?: string;
}

// Utility Types
export type MessageRole = Message['role'];
export type ThemeMode = Theme['mode'];
export type LanguageDirection = Language['direction'];

// Event Types
export interface StreamingEvent {
  type: 'token' | 'complete' | 'error';
  data: StreamToken | ApiError;
}

export interface UIEvent {
  type: 'theme-change' | 'language-change' | 'sidebar-toggle' | 'mock-toggle';
  payload: any;
}

// File Upload Types
export interface FileMetadata {
  fileId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  chatId?: string;
  userId?: string;
}

export interface ChatMessageAttachment {
  fileId: string;
  metadata: FileMetadata;
}

export interface FileUploadConfig {
  maxFileSize: number;
  maxTotalSize: number;
  maxFileCount: number;
  acceptedTypes: string[];
}

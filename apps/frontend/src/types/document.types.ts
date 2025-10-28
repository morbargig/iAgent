// Document Upload Types
// This file contains TypeScript interfaces and types for the document upload feature
// It also re-exports constants and helpers for backward compatibility

// Type definitions
export interface DocumentFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  mimeType: string;
  uploadedAt: Date;
  userId: string;
  status: 'uploading' | 'processing' | 'ready' | 'error';
  url?: string;
  thumbnailUrl?: string;
  metadata?: DocumentMetadata;
  error?: string;
}

export interface DocumentMetadata {
  pages?: number;
  wordCount?: number;
  language?: string;
  encoding?: string;
  extractedText?: string;
  summary?: string;
  tags?: string[];
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error?: string;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

export interface DocumentUploadOptions {
  maxFileSize: number; // bytes
  allowedTypes: string[]; // mime types
  maxFiles: number;
  autoProcess: boolean; // auto-extract text and generate summary
  generateThumbnail: boolean;
}

export interface DocumentSearchFilters {
  query?: string;
  type?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  status?: DocumentFile['status'][];
}

export interface DocumentUploadResponse {
  success: boolean;
  document?: DocumentFile;
  error?: string;
  message?: string;
}

export interface DocumentListResponse {
  documents: DocumentFile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface DocumentProcessingResult {
  documentId: string;
  extractedText?: string;
  summary?: string;
  metadata: DocumentMetadata;
  thumbnailUrl?: string;
}

// Upload event types for real-time updates
export type DocumentUploadEvent =
  | { type: 'progress'; data: UploadProgress }
  | { type: 'completed'; data: DocumentFile }
  | { type: 'error'; data: { fileId: string; error: string } }
  | { type: 'cancelled'; data: { fileId: string } };

// Re-export constants and helpers for backward compatibility
export * from './document.consts';
export * from './document.helpers';

// Document Upload Types
// This file contains all TypeScript interfaces and types for the document upload feature

import React from 'react';
import {
  PictureAsPdf,
  Description,
  Article,
  TableChart,
  Slideshow,
  GridOn,
  Code,
  TextFields,
  InsertDriveFile,
} from '@mui/icons-material';

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

// Supported file types configuration
export const SUPPORTED_DOCUMENT_TYPES = {
  'application/pdf': { extension: '.pdf', name: 'PDF Document', icon: '📄' },
  'application/msword': { extension: '.doc', name: 'Word Document', icon: '📝' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { 
    extension: '.docx', name: 'Word Document', icon: '📝' 
  },
  'text/plain': { extension: '.txt', name: 'Text File', icon: '📄' },
  'text/markdown': { extension: '.md', name: 'Markdown File', icon: '📄' },
  'application/vnd.ms-excel': { extension: '.xls', name: 'Excel Spreadsheet', icon: '📊' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { 
    extension: '.xlsx', name: 'Excel Spreadsheet', icon: '📊' 
  },
  'application/vnd.ms-powerpoint': { extension: '.ppt', name: 'PowerPoint Presentation', icon: '📊' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { 
    extension: '.pptx', name: 'PowerPoint Presentation', icon: '📊' 
  },
  'application/rtf': { extension: '.rtf', name: 'Rich Text Format', icon: '📄' },
  'text/csv': { extension: '.csv', name: 'CSV File', icon: '📊' },
} as const;

export const DEFAULT_UPLOAD_OPTIONS: DocumentUploadOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: Object.keys(SUPPORTED_DOCUMENT_TYPES),
  maxFiles: 5,
  autoProcess: true,
  generateThumbnail: true,
};

// Utility functions for file handling
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (mimeType: string): string => {
  return SUPPORTED_DOCUMENT_TYPES[mimeType as keyof typeof SUPPORTED_DOCUMENT_TYPES]?.icon || '📄';
};

export interface FileIconConfig {
  Icon: React.ComponentType<any>;
  color: string;
}

export const getFileIconComponent = (mimeType: string): FileIconConfig => {
  const iconMap: Record<string, FileIconConfig> = {
    'application/pdf': { Icon: PictureAsPdf, color: '#d32f2f' },
    'text/plain': { Icon: Description, color: '#616161' },
    'application/msword': { Icon: Article, color: '#1976d2' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { Icon: Article, color: '#1976d2' },
    'application/vnd.ms-excel': { Icon: TableChart, color: '#2e7d32' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { Icon: TableChart, color: '#2e7d32' },
    'application/vnd.ms-powerpoint': { Icon: Slideshow, color: '#ed6c02' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { Icon: Slideshow, color: '#ed6c02' },
    'text/csv': { Icon: GridOn, color: '#2e7d32' },
    'text/markdown': { Icon: Code, color: '#0288d1' },
    'application/rtf': { Icon: TextFields, color: '#616161' },
  };
  
  return iconMap[mimeType] || { Icon: InsertDriveFile, color: '#757575' };
};

export const getFileTypeName = (mimeType: string): string => {
  return SUPPORTED_DOCUMENT_TYPES[mimeType as keyof typeof SUPPORTED_DOCUMENT_TYPES]?.name || 'Unknown File';
};

export const isValidFileType = (mimeType: string): boolean => {
  return mimeType in SUPPORTED_DOCUMENT_TYPES;
};

export const validateFile = (file: File, options: DocumentUploadOptions): { valid: boolean; error?: string } => {
  if (file.size > options.maxFileSize) {
    return { valid: false, error: `File size exceeds ${formatFileSize(options.maxFileSize)} limit` };
  }
  
  if (options.allowedTypes && options.allowedTypes.length > 0 && !options.allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not supported` };
  }
  
  return { valid: true };
};

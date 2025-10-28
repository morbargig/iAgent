// Document Upload Helper Functions
// This file contains utility functions for file handling

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
import { DocumentUploadOptions } from './document.types';
import { SUPPORTED_DOCUMENT_TYPES } from './document.consts';

export interface FileIconConfig {
  Icon: React.ComponentType<{ sx?: Record<string, unknown> }>;
  color: string;
}

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

export const getFileIconComponent = (mimeType: string): FileIconConfig => {
  const iconMap: Record<string, FileIconConfig> = {
    // Documents
    'application/pdf': { Icon: PictureAsPdf, color: '#d32f2f' },
    'application/msword': { Icon: Article, color: '#1976d2' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { Icon: Article, color: '#1976d2' },
    'application/rtf': { Icon: TextFields, color: '#616161' },

    // Spreadsheets
    'application/vnd.ms-excel': { Icon: TableChart, color: '#2e7d32' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { Icon: TableChart, color: '#2e7d32' },
    'text/csv': { Icon: GridOn, color: '#2e7d32' },

    // Presentations
    'application/vnd.ms-powerpoint': { Icon: Slideshow, color: '#ed6c02' },
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': { Icon: Slideshow, color: '#ed6c02' },

    // Images - using Description as a placeholder (you can import Image icon from MUI if needed)
    'image/png': { Icon: Description, color: '#10b981' },
    'image/jpeg': { Icon: Description, color: '#10b981' },
    'image/jpg': { Icon: Description, color: '#10b981' },
    'image/gif': { Icon: Description, color: '#10b981' },
    'image/webp': { Icon: Description, color: '#10b981' },
    'image/svg+xml': { Icon: Description, color: '#10b981' },

    // Text/Code files
    'text/plain': { Icon: Description, color: '#616161' },
    'text/markdown': { Icon: Code, color: '#0288d1' },
    'text/javascript': { Icon: Code, color: '#f0db4f' },
    'text/typescript': { Icon: Code, color: '#3178c6' },
    'text/html': { Icon: Code, color: '#e34c26' },
    'text/css': { Icon: Code, color: '#264de4' },
    'application/json': { Icon: Code, color: '#0288d1' },

    // Archives
    'application/zip': { Icon: InsertDriveFile, color: '#f59e0b' },
    'application/x-rar-compressed': { Icon: InsertDriveFile, color: '#f59e0b' },
    'application/x-7z-compressed': { Icon: InsertDriveFile, color: '#f59e0b' },
    'application/x-tar': { Icon: InsertDriveFile, color: '#f59e0b' },
    'application/gzip': { Icon: InsertDriveFile, color: '#f59e0b' },
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


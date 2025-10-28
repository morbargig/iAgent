// Document Upload Constants
// This file contains constants for the document upload feature

import { DocumentUploadOptions } from './document.types';

// Supported file types configuration
export const SUPPORTED_DOCUMENT_TYPES = {
  // Documents
  'application/pdf': { extension: '.pdf', name: 'PDF Document', icon: '📄' },
  'application/msword': { extension: '.doc', name: 'Word Document', icon: '📝' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    extension: '.docx', name: 'Word Document', icon: '📝'
  },
  'application/rtf': { extension: '.rtf', name: 'Rich Text Format', icon: '📄' },

  // Spreadsheets
  'application/vnd.ms-excel': { extension: '.xls', name: 'Excel Spreadsheet', icon: '📊' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    extension: '.xlsx', name: 'Excel Spreadsheet', icon: '📊'
  },
  'text/csv': { extension: '.csv', name: 'CSV File', icon: '📊' },

  // Presentations
  'application/vnd.ms-powerpoint': { extension: '.ppt', name: 'PowerPoint Presentation', icon: '📊' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    extension: '.pptx', name: 'PowerPoint Presentation', icon: '📊'
  },

  // Images
  'image/png': { extension: '.png', name: 'PNG Image', icon: '🖼️' },
  'image/jpeg': { extension: '.jpg', name: 'JPEG Image', icon: '🖼️' },
  'image/jpg': { extension: '.jpg', name: 'JPEG Image', icon: '🖼️' },
  'image/gif': { extension: '.gif', name: 'GIF Image', icon: '🖼️' },
  'image/webp': { extension: '.webp', name: 'WebP Image', icon: '🖼️' },
  'image/svg+xml': { extension: '.svg', name: 'SVG Image', icon: '🖼️' },

  // Text/Code files
  'text/plain': { extension: '.txt', name: 'Text File', icon: '📄' },
  'text/markdown': { extension: '.md', name: 'Markdown File', icon: '📄' },
  'text/javascript': { extension: '.js', name: 'JavaScript File', icon: '💻' },
  'text/typescript': { extension: '.ts', name: 'TypeScript File', icon: '💻' },
  'text/html': { extension: '.html', name: 'HTML File', icon: '💻' },
  'text/css': { extension: '.css', name: 'CSS File', icon: '💻' },
  'application/json': { extension: '.json', name: 'JSON File', icon: '💻' },

  // Archives
  'application/zip': { extension: '.zip', name: 'ZIP Archive', icon: '📦' },
  'application/x-rar-compressed': { extension: '.rar', name: 'RAR Archive', icon: '📦' },
  'application/x-7z-compressed': { extension: '.7z', name: '7-Zip Archive', icon: '📦' },
  'application/x-tar': { extension: '.tar', name: 'TAR Archive', icon: '📦' },
  'application/gzip': { extension: '.gz', name: 'GZIP Archive', icon: '📦' },
} as const;

export const DEFAULT_UPLOAD_OPTIONS: DocumentUploadOptions = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: Object.keys(SUPPORTED_DOCUMENT_TYPES),
  maxFiles: 5,
  autoProcess: true,
  generateThumbnail: true,
};


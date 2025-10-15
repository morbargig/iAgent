/**
 * File Upload Configuration
 * 
 * This file contains configurable limits for file uploads.
 * Modify these values to adjust upload constraints.
 */

export const FILE_UPLOAD_CONFIG = {
  // Maximum file size per file (in bytes)
  // Default: 5MB
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  // Maximum total size of all files (in bytes)
  // Default: 50MB
  MAX_TOTAL_SIZE: 50 * 1024 * 1024,

  // Maximum number of files per message
  // Default: 8 files
  MAX_FILE_COUNT: 8,

  // Accepted file types (MIME types)
  // Empty array means all types accepted
  ACCEPTED_FILE_TYPES: [] as string[],

  // File type categories for icon display
  FILE_TYPE_CATEGORIES: {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    pdf: ['application/pdf'],
    archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
    code: ['text/javascript', 'text/typescript', 'text/html', 'text/css', 'application/json', 'text/plain'],
    document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  },
} as const;

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Check if file type is an image
 */
export function isImageFile(mimeType: string): boolean {
  return FILE_UPLOAD_CONFIG.FILE_TYPE_CATEGORIES.image.includes(mimeType);
}

/**
 * Get file category based on MIME type
 */
export function getFileCategory(mimeType: string): 'image' | 'pdf' | 'archive' | 'code' | 'document' | 'other' {
  const categories = FILE_UPLOAD_CONFIG.FILE_TYPE_CATEGORIES;
  
  if (categories.image.includes(mimeType)) return 'image';
  if (categories.pdf.includes(mimeType)) return 'pdf';
  if (categories.archive.includes(mimeType)) return 'archive';
  if (categories.code.includes(mimeType)) return 'code';
  if (categories.document.includes(mimeType)) return 'document';
  
  return 'other';
}


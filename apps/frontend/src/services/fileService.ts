import { FILE_UPLOAD_CONFIG, formatFileSize, getFileCategory } from '../config/fileUpload';
import type { FileAttachment, FileMetadata } from '@iagent/shared-types';

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * File validation errors
 */
export const FILE_ERRORS = {
  FILE_TOO_LARGE: (maxSize: string) => `File exceeds maximum size of ${maxSize}`,
  TOTAL_SIZE_EXCEEDED: (maxSize: string) => `Total file size exceeds ${maxSize}`,
  TOO_MANY_FILES: (maxCount: number) => `Maximum ${maxCount} files allowed`,
  INVALID_FILE_TYPE: (fileName: string) => `File type not supported: ${fileName}`,
};

/**
 * Validate a single file against constraints
 */
export function validateFile(file: File, currentFiles: File[] = []): FileValidationResult {
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: FILE_ERRORS.FILE_TOO_LARGE(formatFileSize(FILE_UPLOAD_CONFIG.MAX_FILE_SIZE)),
    };
  }

  // Check file count
  if (currentFiles.length >= FILE_UPLOAD_CONFIG.MAX_FILE_COUNT) {
    return {
      valid: false,
      error: FILE_ERRORS.TOO_MANY_FILES(FILE_UPLOAD_CONFIG.MAX_FILE_COUNT),
    };
  }

  // Check total size
  const currentTotalSize = currentFiles.reduce((sum, f) => sum + f.size, 0);
  if (currentTotalSize + file.size > FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: FILE_ERRORS.TOTAL_SIZE_EXCEEDED(formatFileSize(FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE)),
    };
  }

  // Check file type (if restrictions are set)
  if (
    FILE_UPLOAD_CONFIG.ACCEPTED_FILE_TYPES.length > 0 &&
    !FILE_UPLOAD_CONFIG.ACCEPTED_FILE_TYPES.includes(file.type)
  ) {
    return {
      valid: false,
      error: FILE_ERRORS.INVALID_FILE_TYPE(file.name),
    };
  }

  return { valid: true };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[], currentFiles: File[] = []): FileValidationResult {
  // Check total count
  if (currentFiles.length + files.length > FILE_UPLOAD_CONFIG.MAX_FILE_COUNT) {
    return {
      valid: false,
      error: FILE_ERRORS.TOO_MANY_FILES(FILE_UPLOAD_CONFIG.MAX_FILE_COUNT),
    };
  }

  // Check total size
  const currentTotalSize = currentFiles.reduce((sum, f) => sum + f.size, 0);
  const newTotalSize = files.reduce((sum, f) => sum + f.size, 0);
  if (currentTotalSize + newTotalSize > FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: FILE_ERRORS.TOTAL_SIZE_EXCEEDED(formatFileSize(FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE)),
    };
  }

  // Validate each file individually
  for (const file of files) {
    const result = validateFile(file, [...currentFiles, ...files.slice(0, files.indexOf(file))]);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Upload files to the backend
 */
export async function uploadFiles(
  files: File[],
  chatId: string,
  authToken: string,
  baseUrl = 'http://localhost:3000'
): Promise<FileMetadata[]> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch(`${baseUrl}/api/chats/${chatId}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Failed to upload files');
  }

  return await response.json();
}

/**
 * Download a file from the backend
 */
export async function downloadFile(
  fileId: string,
  fileName: string,
  authToken: string,
  baseUrl = 'http://localhost:3000'
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/chats/files/${fileId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download file');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Delete a file from the backend
 */
export async function deleteFile(
  fileId: string,
  authToken: string,
  baseUrl = 'http://localhost:3000'
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/chats/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete file');
  }
}

/**
 * Get Material-UI icon name based on file type
 */
export function getFileIconName(mimeType: string): string {
  const category = getFileCategory(mimeType);
  
  switch (category) {
    case 'image':
      return 'Image';
    case 'pdf':
      return 'PictureAsPdf';
    case 'archive':
      return 'Archive';
    case 'code':
      return 'Code';
    case 'document':
      return 'Description';
    default:
      return 'InsertDriveFile';
  }
}

/**
 * Get color for file icon based on file type
 */
export function getFileIconColor(mimeType: string, isDarkMode: boolean): string {
  const category = getFileCategory(mimeType);
  
  // Return colors optimized for light and dark modes
  if (isDarkMode) {
    switch (category) {
      case 'image':
        return '#10b981'; // Green
      case 'pdf':
        return '#ef4444'; // Red
      case 'archive':
        return '#f59e0b'; // Amber
      case 'code':
        return '#3b82f6'; // Blue
      case 'document':
        return '#8b5cf6'; // Purple
      default:
        return '#6b7280'; // Gray
    }
  } else {
    switch (category) {
      case 'image':
        return '#059669'; // Green
      case 'pdf':
        return '#dc2626'; // Red
      case 'archive':
        return '#d97706'; // Amber
      case 'code':
        return '#2563eb'; // Blue
      case 'document':
        return '#7c3aed'; // Purple
      default:
        return '#4b5563'; // Gray
    }
  }
}

/**
 * Convert File to FileAttachment
 */
export function fileToAttachment(file: File, fileId: string): FileAttachment {
  return {
    id: fileId,
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    uploadedAt: new Date(),
  };
}


// File management service for MongoDB GridFS
import { FILE_UPLOAD_CONFIG, formatFileSize as configFormatFileSize, getFileCategory } from '../config/fileUpload';

export interface FileUploadResult {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
}

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

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
  metadata?: any;
}

export interface FileListResponse {
  files: FileInfo[];
  total: number;
}

/**
 * Validate a single file against constraints
 */
export function validateFile(file: File, currentFiles: File[] = []): FileValidationResult {
  // Check file size
  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: FILE_ERRORS.FILE_TOO_LARGE(configFormatFileSize(FILE_UPLOAD_CONFIG.MAX_FILE_SIZE)),
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
      error: FILE_ERRORS.TOTAL_SIZE_EXCEEDED(configFormatFileSize(FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE)),
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
      error: FILE_ERRORS.TOTAL_SIZE_EXCEEDED(configFormatFileSize(FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE)),
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

class FileService {
  private baseUrl = 'http://localhost:3030/api/files';

  async uploadFile(file: File): Promise<FileUploadResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileList(limit = 50, skip = 0): Promise<FileInfo[]> {
    const response = await fetch(`${this.baseUrl}/list?limit=${limit}&skip=${skip}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    return response.json();
  }

  async getFileCount(): Promise<number> {
    const response = await fetch(`${this.baseUrl}/count`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file count: ${response.statusText}`);
    }

    const data = await response.json();
    return data.count;
  }

  async getFileInfo(fileId: string): Promise<FileInfo> {
    const response = await fetch(`${this.baseUrl}/${fileId}/info`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file info: ${response.statusText}`);
    }

    return response.json();
  }

  async downloadFile(fileId: string, filename: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getPreviewUrl(fileId: string): string {
    return `${this.baseUrl}/${fileId}/preview`;
  }

  previewFile(fileId: string): void {
    const url = this.getPreviewUrl(fileId);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${fileId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

export const fileService = new FileService();

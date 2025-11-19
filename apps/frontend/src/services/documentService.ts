// Document Service
// This service handles all document upload, management, and API interactions

import {
  DocumentFile,
  DocumentUploadResponse,
  DocumentListResponse,
  DocumentSearchFilters,
  UploadProgress,
  DocumentUploadEvent,
  validateFile,
  DEFAULT_UPLOAD_OPTIONS,
  DocumentUploadOptions
} from '../types/document.types';
import { FileProcessingService } from './fileProcessingService';
import { API_CONFIG } from '../config/config';

export class DocumentService {
  private baseUrl: string;
  private authToken: string | null = null;
  private eventListeners: ((event: DocumentUploadEvent) => void)[] = [];
  private currentUserId = 'demo-user';

  constructor(baseUrl = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Set current user ID
  setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  // Add event listener for upload events
  addEventListener(listener: (event: DocumentUploadEvent) => void): void {
    this.eventListeners.push(listener);
  }

  // Remove event listener
  removeEventListener(listener: (event: DocumentUploadEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  // Emit event to all listeners
  private emitEvent(event: DocumentUploadEvent): void {
    this.eventListeners.forEach(listener => listener(event));
  }

  // Get request headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  // Upload single file with progress tracking
  async uploadFile(
    file: File,
    options: Partial<DocumentUploadOptions> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentUploadResponse> {
    const uploadOptions = { ...DEFAULT_UPLOAD_OPTIONS, ...options };

    // Validate file
    const validation = validateFile(file, uploadOptions);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(uploadOptions));

      // Create XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            const speed = event.loaded / ((Date.now() - startTime) / 1000);
            const timeRemaining = (event.total - event.loaded) / speed;

            const progressData: UploadProgress = {
              fileId,
              fileName: file.name,
              progress,
              status: 'uploading',
              speed,
              timeRemaining
            };

            onProgress(progressData);
            this.emitEvent({ type: 'progress', data: progressData });
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);

              // Backend returns FileUploadResult directly (not wrapped in {document: ...})
              const fileResult = response.document || response;

              // Map to DocumentFile
              const document: DocumentFile = {
                id: fileResult.id,
                name: fileResult.filename,
                originalName: fileResult.filename,
                size: fileResult.size,
                type: fileResult.mimetype,
                mimeType: fileResult.mimetype,
                uploadedAt: new Date(fileResult.uploadDate),
                userId: this.currentUserId,
                status: 'ready',
                url: `${this.baseUrl}/files/${fileResult.id}`,
                metadata: {}
              };

              // Process file if autoProcess is enabled
              if (uploadOptions.autoProcess) {
                const processingResult = await FileProcessingService.processFile(file);
                document.metadata = processingResult.metadata;
              }

              this.emitEvent({ type: 'completed', data: document });
              resolve({ success: true, document });
            } catch {
              reject(new Error('Failed to parse response'));
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        const startTime = Date.now();
        xhr.open('POST', `${this.baseUrl}/files/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${this.authToken}`);
        xhr.send(formData);
      });
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Get documents with pagination and filters
  async getDocuments(
    page = 1,
    limit = 10,
    filters?: DocumentSearchFilters
  ): Promise<DocumentListResponse> {
    try {
      const skip = Math.max(0, (page - 1) * limit);
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
        ...(filters?.query && { query: filters.query }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status.join(',') })
      });

      const response = await fetch(`${this.baseUrl}/files/list?${params.toString()}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`);
      }

      const files: unknown = await response.json();
      if (!Array.isArray(files)) {
        throw new Error('Unexpected response format for files list');
      }
      const total = await this.getDocumentCount(filters?.query);
      return {
        documents: files.map((f) => this.mapFileInfoToDocument(f as Record<string, unknown>)),
        total,
        page,
        limit,
        hasMore: page * limit < total,
      };
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error}`);
    }
  }

  // Download document
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${documentId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch {
      throw new Error('Download failed');
    }
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${documentId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error) {
      throw new Error(`Delete failed: ${error}`);
    }
  }

  // Get document by ID
  async getDocument(documentId: string): Promise<DocumentFile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${documentId}/info`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        return null;
      }

      const fileInfo = await response.json();
      return this.mapFileInfoToDocument(fileInfo);
    } catch (error) {
      throw new Error(`Failed to fetch document: ${error}`);
    }
  }

  // Search documents
  async searchDocuments(query: string, filters?: DocumentSearchFilters): Promise<DocumentFile[]> {
    try {
      const params = new URLSearchParams({
        query,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status.join(',') })
      });

      const response = await fetch(`${this.baseUrl}/files/list?${params}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const files: unknown = await response.json();
      if (!Array.isArray(files)) {
        throw new Error('Unexpected response format for files list');
      }
      return files.map((f) => this.mapFileInfoToDocument(f as Record<string, unknown>));
    } catch (error) {
      throw new Error(`Search failed: ${error}`);
    }
  }

  // Get document statistics
  async getDocumentStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalSize: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/documents/stats`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch stats: ${error}`);
    }
  }

  // Get file content (for text files)
  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch file content: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Failed to fetch file content: ${error}`);
    }
  }

  // Update text file content
  async updateTextFileContent(
    fileId: string,
    content: string
  ): Promise<DocumentUploadResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}/content`, {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'text/plain',
        },
        body: content,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `Update failed: ${response.statusText}`);
      }

      const fileInfo = await response.json();
      const document = this.mapFileInfoToDocument(fileInfo);

      return { success: true, document };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  // Cancel upload
  cancelUpload(fileId: string): void {
    this.emitEvent({ type: 'cancelled', data: { fileId } });
  }

  // Get upload progress
  getUploadProgress(fileId: string): UploadProgress | null {
    // This would typically be stored in a Map or similar structure
    // For now, return null as we don't persist progress
    return null;
  }

  // Helpers
  private async getDocumentCount(query?: string): Promise<number> {
    try {
      const params = new URLSearchParams();
      if (query && query.trim()) {
        params.append('query', query.trim());
      }
      const url = params.toString() ? `${this.baseUrl}/files/count?${params}` : `${this.baseUrl}/files/count`;

      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.count ?? 0;
    } catch {
      return 0;
    }
  }

  private mapFileInfoToDocument(f: Record<string, unknown>): DocumentFile {
    const metadata = (f.metadata as Record<string, unknown> | undefined) || {};
    return {
      id: String(f.id || ''),
      name: String(f.filename || f.name || ''),
      originalName: String(metadata.originalName || f.filename || f.name || ''),
      size: Number(f.size ?? f.length ?? 0),
      type: String(f.mimetype || f.mimeType || 'application/octet-stream'),
      mimeType: String(f.mimetype || f.mimeType || 'application/octet-stream'),
      uploadedAt: new Date(String(f.uploadDate || f.uploadedAt || Date.now())),
      userId: String(metadata.userId || 'unknown'),
      status: 'ready',
      url: `${this.baseUrl}/files/${f.id}`,
      metadata,
    };
  }
}

// Export singleton instance
export const documentService = new DocumentService();

// React hook for using document service
export const useDocumentService = () => {
  return documentService;
};

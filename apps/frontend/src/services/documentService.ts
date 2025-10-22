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
import { mockDocumentStore } from './mockDocumentStore';
import { FileProcessingService } from './fileProcessingService';
import { FileUrlService } from './fileUrlService';

export class DocumentService {
  private baseUrl: string;
  private authToken: string | null = null;
  private eventListeners: ((event: DocumentUploadEvent) => void)[] = [];
  private useMockData = false; // Use live API by default
  private currentUserId = 'demo-user'; // Default user ID for mock

  constructor(baseUrl = 'http://localhost:3030/api') {
    this.baseUrl = baseUrl;
  }

  // Set authentication token
  setAuthToken(token: string | null): void {
    this.authToken = token;
  }

  // Enable/disable mock data mode
  setMockMode(enabled: boolean): void {
    this.useMockData = enabled;
  }

  // Set current user ID (for mock mode)
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

    // Use mock upload in development
    if (this.useMockData) {
      return this.simulateUpload(file, onProgress);
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
            } catch (error) {
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

  // Simulate upload for mock mode
  private async simulateUpload(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<DocumentUploadResponse> {
    const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Simulate upload progress
    const simulateProgress = () => {
      return new Promise<void>((resolve) => {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            resolve();
          }

          if (onProgress) {
            const progressData: UploadProgress = {
              fileId,
              fileName: file.name,
              progress: Math.round(progress),
              status: 'uploading',
              speed: Math.random() * 1000000, // Random speed
              timeRemaining: (100 - progress) / 10 // Estimated time
            };
            onProgress(progressData);
            this.emitEvent({ type: 'progress', data: progressData });
          }
        }, 200);
      });
    };

    try {
      await simulateProgress();

      // Process file
      const processingResult = await FileProcessingService.processFile(file);

      // Create document
      const document: DocumentFile = {
        id: fileId,
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        mimeType: file.type,
        uploadedAt: new Date(),
        userId: this.currentUserId,
        status: 'ready',
        url: FileUrlService.getDownloadUrl(fileId),
        metadata: processingResult.metadata
      };

      // Add to mock store
      mockDocumentStore.addDocument(document);

      this.emitEvent({ type: 'completed', data: document });

      return { success: true, document };
    } catch (error) {
      this.emitEvent({
        type: 'error',
        data: { fileId, error: error instanceof Error ? error.message : 'Upload failed' }
      });
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  // Get documents with pagination and filters
  async getDocuments(
    page = 1,
    limit = 10,
    filters?: DocumentSearchFilters
  ): Promise<DocumentListResponse> {
    if (this.useMockData) {
      return mockDocumentStore.getPaginatedDocuments(page, limit, filters?.query, filters);
    }

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
        documents: files.map((f) => this.mapFileInfoToDocument(f as any)),
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
    if (this.useMockData) {
      // Create mock blob for download
      const document = mockDocumentStore.getDocumentById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Create a mock blob with document content
      const content = document.metadata?.extractedText || `Content of ${document.name}`;
      return new Blob([content], { type: document.mimeType });
    }

    try {
      const response = await fetch(`${this.baseUrl}/files/${documentId}`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      throw new Error(`Download failed: ${error}`);
    }
  }

  // Delete document
  async deleteDocument(documentId: string): Promise<boolean> {
    if (this.useMockData) {
      return mockDocumentStore.deleteDocument(documentId);
    }

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
    if (this.useMockData) {
      return mockDocumentStore.getDocumentById(documentId) || null;
    }

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
    if (this.useMockData) {
      return mockDocumentStore.searchDocuments(query, filters);
    }

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

      const files: any[] = await response.json();
      return files.map((f) => this.mapFileInfoToDocument(f));
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
    if (this.useMockData) {
      return mockDocumentStore.getDocumentStats();
    }

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

  private mapFileInfoToDocument(f: any): DocumentFile {
    return {
      id: f.id,
      name: f.filename || f.name,
      originalName: f.metadata?.originalName || f.filename || f.name,
      size: f.size ?? f.length,
      type: f.mimetype || f.mimeType || 'application/octet-stream',
      mimeType: f.mimetype || f.mimeType || 'application/octet-stream',
      uploadedAt: new Date(f.uploadDate || f.uploadedAt || Date.now()),
      userId: f.metadata?.userId || 'unknown',
      status: 'ready',
      url: `${this.baseUrl}/files/${f.id}`,
      metadata: f.metadata || {},
    };
  }
}

// Export singleton instance
export const documentService = new DocumentService();

// React hook for using document service
export const useDocumentService = () => {
  return documentService;
};

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { keys } from '../../lib/keys';
import type {
  DocumentFile,
  DocumentListResponse,
  DocumentSearchFilters,
  DocumentUploadResponse,
  DocumentUploadOptions,
  UploadProgress,
  DocumentMetadata,
} from '../../types/document.types';
import { mockDocumentStore } from '../../services/mockDocumentStore';

export interface FileInfo {
  id: string;
  filename: string;
  size: number;
  mimetype: string;
  uploadDate: string;
  metadata?: Record<string, unknown>;
}

const mapFileInfoToDocument = (f: FileInfo, baseUrl: string): DocumentFile => {
  const originalName = (f.metadata?.originalName as string) || f.filename || '';
  const userId = (f.metadata?.userId as string) || 'unknown';
  const metadata = f.metadata as DocumentMetadata | undefined;
  
  return {
    id: f.id,
    name: f.filename || originalName,
    originalName,
    size: f.size,
    type: f.mimetype || 'application/octet-stream',
    mimeType: f.mimetype || 'application/octet-stream',
    uploadedAt: new Date(f.uploadDate || Date.now()),
    userId,
    status: 'ready',
    url: `${baseUrl}/files/${f.id}`,
    metadata,
  };
};

const getMockMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('app-settings');
  if (!stored) return false;
  try {
    const settings = JSON.parse(stored);
    return settings?.mockMode === true;
  } catch {
    return false;
  }
};

export const useDocuments = (
  page = 1,
  limit = 10,
  filters?: DocumentSearchFilters
) => {
  return useQuery({
    queryKey: keys.documents.list(page, limit, {
      query: filters?.query,
      type: filters?.type,
      status: filters?.status,
    }),
    queryFn: async (): Promise<DocumentListResponse> => {
      if (getMockMode()) {
        return mockDocumentStore.getPaginatedDocuments(page, limit, filters?.query, filters);
      }

      const skip = Math.max(0, (page - 1) * limit);
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
        ...(filters?.query && { query: filters.query }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.status && { status: filters.status.join(',') }),
      });

      const response = await http.get<FileInfo[]>(`/files/list?${params.toString()}`);
      const files = response.data;

      const countResponse = await http.get<{ count: number }>(
        filters?.query ? `/files/count?query=${encodeURIComponent(filters.query)}` : '/files/count'
      );
      const total = countResponse.data.count;

      const baseUrl = http.defaults.baseURL || '';
      return {
        documents: files.map((f) => mapFileInfoToDocument(f, baseUrl)),
        total,
        page,
        limit,
        hasMore: page * limit < total,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });
};

export const useDocument = (id: string | number) => {
  return useQuery({
    queryKey: keys.documents.detail(id),
    queryFn: async (): Promise<DocumentFile | null> => {
      if (getMockMode()) {
        return mockDocumentStore.getDocumentById(String(id)) || null;
      }

      const response = await http.get<FileInfo>(`/files/${id}/info`);
      return mapFileInfoToDocument(response.data, http.defaults.baseURL || '');
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

export const useDocumentCount = (filters?: { query?: string }) => {
  return useQuery({
    queryKey: keys.documents.count(filters),
    queryFn: async (): Promise<number> => {
      if (getMockMode()) {
        const allResults = filters?.query
          ? mockDocumentStore.searchDocuments(filters.query)
          : mockDocumentStore.getDocuments();
        return allResults.length;
      }

      const params = filters?.query ? `?query=${encodeURIComponent(filters.query)}` : '';
      try {
        const response = await http.get<{ count: number }>(`/files/count${params}`);
        return response.data.count;
      } catch {
        return 0;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useDocumentStats = () => {
  return useQuery({
    queryKey: keys.documents.stats(),
    queryFn: async () => {
      if (getMockMode()) {
        return mockDocumentStore.getDocumentStats();
      }

      const response = await http.get<{
        total: number;
        byType: Record<string, number>;
        byStatus: Record<string, number>;
        totalSize: number;
      }>('/documents/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUploadDocument = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      options,
      onProgress,
    }: {
      file: File;
      options?: Partial<DocumentUploadOptions>;
      onProgress?: (progress: UploadProgress) => void;
    }): Promise<DocumentUploadResponse> => {
      if (getMockMode()) {
        const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
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
                onProgress({
                  fileId,
                  fileName: file.name,
                  progress: Math.round(progress),
                  status: 'uploading',
                  speed: Math.random() * 1000000,
                  timeRemaining: (100 - progress) / 10,
                });
              }
            }, 200);
          });
        };

        await simulateProgress();

        const { FileProcessingService } = await import('../../services/fileProcessingService');
        const { FileUrlService } = await import('../../services/fileUrlService');
        const processingResult = await FileProcessingService.processFile(file);

        const document: DocumentFile = {
          id: fileId,
          name: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          mimeType: file.type,
          uploadedAt: new Date(),
          userId: 'demo-user',
          status: 'ready',
          url: FileUrlService.getDownloadUrl(fileId),
          metadata: processingResult.metadata,
        };

        mockDocumentStore.addDocument(document);

        return { success: true, document };
      }

      const formData = new FormData();
      formData.append('file', file);
      if (options) {
        formData.append('options', JSON.stringify(options));
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const fileId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            const speed = event.loaded / ((Date.now() - startTime) / 1000);
            const timeRemaining = (event.total - event.loaded) / speed;

            onProgress({
              fileId,
              fileName: file.name,
              progress,
              status: 'uploading',
              speed,
              timeRemaining,
            });
          }
        });

        xhr.addEventListener('load', async () => {
          if (xhr.status === 200 || xhr.status === 201) {
            try {
              const response = JSON.parse(xhr.responseText);
              const fileResult = response.document || response;

              const document: DocumentFile = {
                id: fileResult.id,
                name: fileResult.filename,
                originalName: fileResult.filename,
                size: fileResult.size,
                type: fileResult.mimetype,
                mimeType: fileResult.mimetype,
                uploadedAt: new Date(fileResult.uploadDate),
                userId: 'demo-user',
                status: 'ready',
                url: `${http.defaults.baseURL}/files/${fileResult.id}`,
                metadata: {},
              };

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

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        const token = sessionStorage.getItem('session-token');
        xhr.open('POST', `${http.defaults.baseURL}/files/upload`);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.documents.lists() });
      qc.invalidateQueries({ queryKey: keys.documents.count() });
      qc.invalidateQueries({ queryKey: keys.documents.stats() });
    },
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number): Promise<boolean> => {
      if (getMockMode()) {
        return mockDocumentStore.deleteDocument(String(id));
      }

      await http.delete(`/files/${id}`);
      return true;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.documents.detail(id) });

      const prevDetail = qc.getQueryData<DocumentFile | null>(keys.documents.detail(id));
      const prevLists = qc.getQueriesData({ queryKey: keys.documents.lists() });

      qc.setQueryData(keys.documents.detail(id), null);

      qc.setQueriesData({ queryKey: keys.documents.lists() }, (old: DocumentListResponse | undefined) => {
        if (!old) return old;
        return {
          ...old,
          documents: old.documents.filter((doc) => doc.id !== String(id)),
          total: Math.max(0, old.total - 1),
        };
      });

      return { prevDetail, prevLists };
    },
    onError: (_error, id, context) => {
      if (context?.prevDetail) {
        qc.setQueryData(keys.documents.detail(id), context.prevDetail);
      }
      if (context?.prevLists) {
        context.prevLists.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.documents.lists() });
      qc.invalidateQueries({ queryKey: keys.documents.count() });
      qc.invalidateQueries({ queryKey: keys.documents.stats() });
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (id: string | number): Promise<Blob> => {
      if (getMockMode()) {
        const document = mockDocumentStore.getDocumentById(String(id));
        if (!document) {
          throw new Error('Document not found');
        }
        const content = document.metadata?.extractedText || `Content of ${document.name}`;
        return new Blob([content], { type: document.mimeType });
      }

      const response = await http.get<Blob>(`/files/${id}`, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
};


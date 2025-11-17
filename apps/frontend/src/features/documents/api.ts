import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { http } from '../../lib/http';
import { apiKeys } from '../../lib/keys';
import type {
  DocumentFile,
  DocumentListResponse,
  DocumentSearchFilters,
  DocumentUploadResponse,
  DocumentUploadOptions,
  UploadProgress,
  DocumentMetadata,
} from '../../types/document.types';

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

export const useDocuments = (
  page = 1,
  limit = 10,
  filters?: DocumentSearchFilters
) => {
  return useQuery({
    queryKey: apiKeys.documents.list(page, limit, {
      query: filters?.query,
      type: filters?.type,
      status: filters?.status,
    }),
    queryFn: async (): Promise<DocumentListResponse> => {
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
    queryKey: apiKeys.documents.detail(id),
    queryFn: async (): Promise<DocumentFile | null> => {
      const response = await http.get<FileInfo>(`/files/${id}/info`);
      return mapFileInfoToDocument(response.data, http.defaults.baseURL || '');
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  });
};

export const useDocumentCount = (filters?: { query?: string }) => {
  return useQuery({
    queryKey: apiKeys.documents.count(filters),
    queryFn: async (): Promise<number> => {
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
    queryKey: apiKeys.documents.stats(),
    queryFn: async () => {
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
      qc.invalidateQueries({ queryKey: apiKeys.documents.lists() });
      qc.invalidateQueries({ queryKey: apiKeys.documents.count() });
      qc.invalidateQueries({ queryKey: apiKeys.documents.stats() });
    },
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string | number): Promise<boolean> => {
      await http.delete(`/files/${id}`);
      return true;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: apiKeys.documents.detail(id) });

      const prevDetail = qc.getQueryData<DocumentFile | null>(apiKeys.documents.detail(id));
      const prevLists = qc.getQueriesData({ queryKey: apiKeys.documents.lists() });

      qc.setQueryData(apiKeys.documents.detail(id), null);

      qc.setQueriesData({ queryKey: apiKeys.documents.lists() }, (old: DocumentListResponse | undefined) => {
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
        qc.setQueryData(apiKeys.documents.detail(id), context.prevDetail);
      }
      if (context?.prevLists) {
        context.prevLists.forEach(([queryKey, data]) => {
          qc.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: apiKeys.documents.lists() });
      qc.invalidateQueries({ queryKey: apiKeys.documents.count() });
      qc.invalidateQueries({ queryKey: apiKeys.documents.stats() });
    },
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: async (id: string | number): Promise<Blob> => {
      const response = await http.get<Blob>(`/files/${id}`, {
        responseType: 'blob',
      });
      return response.data;
    },
  });
};


import { useQueries } from '@tanstack/react-query';
import { http } from '../lib/http';
import { apiKeys } from '../lib/keys';
import type { DocumentFile } from '../types/document.types';

// Limit concurrent queries to prevent memory issues with large attachment arrays
const MAX_CONCURRENT_ATTACHMENT_QUERIES = 50;

interface FileInfo {
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
    metadata: f.metadata,
  };
};

export const useAttachments = (attachmentIds: string[]): {
  attachments: DocumentFile[];
  failedIds: string[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
} => {
  const baseUrl = http.defaults.baseURL || '';

  // Limit queries to prevent memory issues with large attachment arrays
  const limitedIds = attachmentIds.slice(0, MAX_CONCURRENT_ATTACHMENT_QUERIES);
  const hasMore = attachmentIds.length > MAX_CONCURRENT_ATTACHMENT_QUERIES;

  const queries = useQueries({
    queries: limitedIds.map((id) => ({
      queryKey: apiKeys.documents.detail(id),
      queryFn: async (): Promise<DocumentFile | null> => {
        try {
          const response = await http.get<FileInfo>(`/files/${id}/info`);
          return mapFileInfoToDocument(response.data, baseUrl);
        } catch {
          return null;
        }
      },
      staleTime: 5 * 60 * 1000,
      enabled: !!id,
    })),
  });

  const attachments = queries
    .map((query) => query.data)
    .filter((doc): doc is DocumentFile => doc !== null && doc !== undefined);

  const isLoading = queries.some((query) => query.isLoading);
  const isError = queries.some((query) => query.isError);

  const failedIds = limitedIds.filter((id, index) => {
    const query = queries[index];
    return !query.isLoading && (query.isError || query.data === null);
  });

  return {
    attachments,
    failedIds,
    isLoading,
    isError,
    hasMore,
  };
};


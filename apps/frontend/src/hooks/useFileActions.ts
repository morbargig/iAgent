import React from 'react';
import { DocumentFile } from '../types/document.types';
import { DocumentService } from '../services/documentService';
import { API_CONFIG } from '../config/config';

export interface FileActionsConfig {
    baseUrl?: string;
    onPreviewCallback?: (file: DocumentFile) => void;
    onDownloadCallback?: (file: DocumentFile) => void;
    onError?: (error: string, action: 'preview' | 'download') => void;
}

export interface FileActionsReturn {
    handlePreview: (file: DocumentFile) => void;
    handleDownload: (file: DocumentFile) => Promise<void>;
    isDownloading: boolean;
    downloadProgress: Record<string, number>;
}

export const useFileActions = (config: FileActionsConfig = {}): FileActionsReturn => {
    const {
        baseUrl = API_CONFIG.BASE_URL,
        onPreviewCallback,
        onDownloadCallback,
        onError,
    } = config;

    const [documentService] = React.useState(() => new DocumentService(baseUrl));
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [downloadProgress, setDownloadProgress] = React.useState<Record<string, number>>({});

    const handleDownload = React.useCallback(async (file: DocumentFile) => {
        try {
            if (onDownloadCallback) {
                onDownloadCallback(file);
                return;
            }

            setIsDownloading(true);
            setDownloadProgress(prev => ({ ...prev, [file.id]: 0 }));

            const blob = await documentService.downloadDocument(file.id);

            if (!blob || blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || file.originalName || `file-${file.id}`;
            link.style.display = 'none';
            link.setAttribute('download', file.name || file.originalName || `file-${file.id}`);

            document.body.appendChild(link);
            link.click();
            
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

            setDownloadProgress(prev => ({ ...prev, [file.id]: 100 }));

            setTimeout(() => {
                setDownloadProgress(prev => {
                    const newProgress = { ...prev };
                    delete newProgress[file.id];
                    return newProgress;
                });
            }, 1000);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Download failed';
            console.error('Download failed:', error);
            onError?.(errorMessage, 'download');

            setDownloadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[file.id];
                return newProgress;
            });
        } finally {
            setIsDownloading(false);
        }
    }, [documentService, onDownloadCallback, onError]);

    const handlePreview = React.useCallback((file: DocumentFile) => {
        if (onPreviewCallback) {
            onPreviewCallback(file);
            return;
        }

        const previewUrl = `${baseUrl}/files/${file.id}/preview`;
        window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }, [baseUrl, onPreviewCallback]);

    return {
        handlePreview,
        handleDownload,
        isDownloading,
        downloadProgress,
    };
};

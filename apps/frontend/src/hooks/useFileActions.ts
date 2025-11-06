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

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || file.originalName || `file-${file.id}`;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

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

    const handlePreview = React.useCallback(async (file: DocumentFile) => {
        try {
            if (onPreviewCallback) {
                onPreviewCallback(file);
                return;
            }

            const previewUrl = `${baseUrl}/files/${file.id}/preview`;

            console.log('Attempting to preview file:', {
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                previewUrl
            });

            const openPreview = () => {
                const newWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');

                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    const shouldTryAgain = window.confirm(
                        `Popup was blocked. Click OK to try again, or Cancel to download the file instead.`
                    );
                    if (shouldTryAgain) {
                        window.location.href = previewUrl;
                    }
                } else {
                    setTimeout(() => {
                        try {
                            if (newWindow.closed) {
                                return;
                            }

                            if (newWindow.document && newWindow.document.title.includes('error')) {
                                newWindow.close();
                                const shouldDownload = window.confirm(
                                    `Preview failed to load. Would you like to download "${file.name}" instead?`
                                );
                                if (shouldDownload) {
                                    handleDownload(file);
                                }
                            }
                        } catch (_e) {
                            // Silently ignore download errors
                        }
                    }, 2000);
                }
            };

            openPreview();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Preview failed';
            console.error('Preview failed:', error);
            onError?.(errorMessage, 'preview');

            const shouldDownload = window.confirm(
                `Preview failed. Would you like to download "${file.name}" instead?`
            );
            if (shouldDownload) {
                await handleDownload(file);
            }
        }
    }, [baseUrl, onPreviewCallback, onError, handleDownload]);

    return {
        handlePreview,
        handleDownload,
        isDownloading,
        downloadProgress,
    };
};

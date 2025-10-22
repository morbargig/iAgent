// File Actions Hook
// Provides consistent preview and download functionality across file/document components

import React from 'react';
import { DocumentFile } from '../types/document.types';
import { DocumentService } from '../services/documentService';

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
        baseUrl = 'http://localhost:3030/api',
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

            // Default download implementation
            setIsDownloading(true);
            setDownloadProgress(prev => ({ ...prev, [file.id]: 0 }));

            const blob = await documentService.downloadDocument(file.id);

            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name || file.originalName || `file-${file.id}`;
            link.style.display = 'none';

            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            URL.revokeObjectURL(url);

            setDownloadProgress(prev => ({ ...prev, [file.id]: 100 }));

            // Remove progress after a short delay
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

            // Remove progress on error
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

            // Default preview implementation
            const previewUrl = `${baseUrl}/files/${file.id}/preview`;

            // Debug logging
            console.log('Attempting to preview file:', {
                id: file.id,
                name: file.name,
                mimeType: file.mimeType,
                previewUrl
            });

            // Create a fallback approach for better user experience
            const openPreview = () => {
                const newWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');

                // If window couldn't be opened (popup blocker), show alternative
                if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                    const shouldTryAgain = window.confirm(
                        `Popup was blocked. Click OK to try again, or Cancel to download the file instead.`
                    );
                    if (shouldTryAgain) {
                        window.location.href = previewUrl;
                    }
                } else {
                    // Check if the window loaded successfully after a short delay
                    setTimeout(() => {
                        try {
                            if (newWindow.closed) {
                                return; // User closed it, that's fine
                            }

                            // Check if there's an error page (this is a simple heuristic)
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
                            // Cross-origin restrictions prevent us from checking, which is usually fine
                            // It means the file is loading from our backend
                        }
                    }, 2000);
                }
            };

            openPreview();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Preview failed';
            console.error('Preview failed:', error);
            onError?.(errorMessage, 'preview');

            // Fallback to download
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

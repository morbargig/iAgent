import { useState, useRef } from "react";
import { validateFiles } from "../services/fileService";
import { useDocumentService } from "../services/documentService";

// Unified file state interfaces
interface UploadingFile {
    localFile: File;
    tempId: string;
    status: "uploading" | "completed" | "error";
    progress: number;
    error?: string;
    uploadedDocument?: {
        id: string;
        filename: string;
        size: number;
        mimetype: string;
        uploadDate: string;
    };
}

interface AttachedFile {
    id: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadDate: string;
    source: "upload" | "document-manager";
}

interface UseFileHandlingProps {
    t: (key: string) => string;
}

export const useFileHandling = ({ t }: UseFileHandlingProps) => {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const [showFileError, setShowFileError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const documentService = useDocumentService();

    // Upload file immediately when selected
    const uploadFileImmediately = async (file: File): Promise<void> => {
        const tempId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Add to uploading files
        const uploadingFile: UploadingFile = {
            localFile: file,
            tempId,
            status: "uploading",
            progress: 0,
        };

        setUploadingFiles((prev) => [...prev, uploadingFile]);

        try {
            // Upload via documentService
            const result = await documentService.uploadFile(file, {}, (progress) => {
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.tempId === tempId ? { ...f, progress: progress.progress } : f
                    )
                );
            });

            if (result.success && result.document) {
                const doc = result.document;

                // Mark as completed
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.tempId === tempId
                            ? {
                                ...f,
                                status: "completed" as const,
                                progress: 100,
                                uploadedDocument: {
                                    id: doc.id,
                                    filename: doc.name,
                                    size: doc.size,
                                    mimetype: doc.mimeType,
                                    uploadDate: doc.uploadedAt.toISOString(),
                                },
                            }
                            : f
                    )
                );

                // Move to attached files after a short delay
                setTimeout(() => {
                    setAttachedFiles((prev) => [
                        ...prev,
                        {
                            id: doc.id,
                            filename: doc.name,
                            size: doc.size,
                            mimetype: doc.mimeType,
                            uploadDate: doc.uploadedAt.toISOString(),
                            source: "upload",
                        },
                    ]);

                    // Remove from uploading files
                    setUploadingFiles((prev) => prev.filter((f) => f.tempId !== tempId));
                }, 500);
            } else {
                throw new Error(result.error || t("files.uploadFailed"));
            }
        } catch (error) {
            setUploadingFiles((prev) =>
                prev.map((f) =>
                    f.tempId === tempId
                        ? {
                            ...f,
                            status: "error" as const,
                            error:
                                error instanceof Error
                                    ? error.message
                                    : t("files.uploadFailed"),
                        }
                        : f
                )
            );
        }
    };

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        // Get current uploading files for validation
        const currentLocalFiles = uploadingFiles.map((f) => f.localFile);

        const validation = validateFiles(fileArray, currentLocalFiles);

        if (!validation.valid) {
            setFileError(validation.error || t("files.validationFailed"));
            setShowFileError(true);
            return;
        }

        // Upload files immediately
        for (const file of fileArray) {
            await uploadFileImmediately(file);
        }

        // Reset the input value to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set dragging to false if we're leaving the container
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDropFiles = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);

        // Get current uploading files for validation
        const currentLocalFiles = uploadingFiles.map((f) => f.localFile);

        const validation = validateFiles(fileArray, currentLocalFiles);

        if (!validation.valid) {
            setFileError(validation.error || t("files.validationFailed"));
            setShowFileError(true);
            return;
        }

        // Upload files immediately
        for (const file of fileArray) {
            await uploadFileImmediately(file);
        }
    };

    const clearFileError = () => {
        setShowFileError(false);
        setFileError(null);
    };

    const removeUploadingFile = (tempId: string) => {
        setUploadingFiles((prev) => prev.filter((f) => f.tempId !== tempId));
    };

    const removeAttachedFile = (fileId: string) => {
        setAttachedFiles((prev) => prev.filter((f) => f.id !== fileId));
    };

    const clearAllFiles = () => {
        setAttachedFiles([]);
        setUploadingFiles([]);
    };

    return {
        uploadingFiles,
        setUploadingFiles,
        attachedFiles,
        setAttachedFiles,
        isDragging,
        setIsDragging,
        fileError,
        setFileError,
        showFileError,
        setShowFileError,
        fileInputRef,
        handleFileSelect,
        handleDragEnter,
        handleDragLeave,
        handleDragOver,
        handleDropFiles,
        uploadFileImmediately,
        clearFileError,
        removeUploadingFile,
        removeAttachedFile,
        clearAllFiles,
    };
};

export type { UploadingFile, AttachedFile };

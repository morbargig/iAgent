import { useState } from "react";
import { FILE_UPLOAD_CONFIG } from "../config/fileUpload";
import { AttachedFile } from "./useFileHandling";

interface UseDocumentDialogProps {
    attachedFiles: AttachedFile[];
    setAttachedFiles: (files: AttachedFile[] | ((prev: AttachedFile[]) => AttachedFile[])) => void;
    t: (key: string, params?: any) => string;
}

export const useDocumentDialog = ({
    attachedFiles,
    setAttachedFiles,
    t,
}: UseDocumentDialogProps) => {
    const [docsDialogOpen, setDocsDialogOpen] = useState(false);
    const [showLimitWarning, setShowLimitWarning] = useState(false);
    const [fileMenuAnchor, setFileMenuAnchor] = useState<null | HTMLElement>(
        null
    );
    const fileMenuOpen = Boolean(fileMenuAnchor);

    const handleOpenDocsDialog = () => {
        if (attachedFiles.length >= 10) {
            setShowLimitWarning(true);
            return;
        }
        setDocsDialogOpen(true);
    };

    const handleCloseDocsDialog = () => setDocsDialogOpen(false);

    // File menu handlers
    const handleFileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setFileMenuAnchor(event.currentTarget);
    };

    const handleFileMenuClose = () => {
        setFileMenuAnchor(null);
    };

    const handleQuickUpload = (fileInputRef: React.RefObject<HTMLInputElement>) => {
        handleFileMenuClose();
        // Trigger the hidden file input
        fileInputRef.current?.click();
    };

    const handleOpenDocumentManager = () => {
        handleFileMenuClose();
        handleOpenDocsDialog();
    };

    // Handle selecting a document from the dialog
    const handleDocumentSelectFromDialog = (document: any) => {
        // Check file limit
        if (attachedFiles.length >= FILE_UPLOAD_CONFIG.MAX_FILE_COUNT) {
            setShowLimitWarning(true);
            return;
        }

        // Prevent duplicates by id
        const exists = attachedFiles.some((f) => f.id === document.id);

        if (!exists) {
            // Add as AttachedFile (already in MongoDB)
            const attachedFile: AttachedFile = {
                id: document.id,
                filename: document.name || document.filename,
                size: document.size,
                mimetype:
                    document.mimeType || document.mimetype || "application/octet-stream",
                uploadDate:
                    (document.uploadedAt instanceof Date
                        ? document.uploadedAt
                        : new Date(document.uploadedAt || Date.now())
                    ).toISOString?.() || new Date().toISOString(),
                source: "document-manager",
            };
            setAttachedFiles((prev) => [...prev, attachedFile]);
        }
    };

    // Handle removing a document from attachments
    const handleDocumentRemoveFromDialog = (document: any) => {
        setAttachedFiles((prev) => prev.filter((f) => f.id !== document.id));
    };

    const closeLimitWarning = () => {
        setShowLimitWarning(false);
    };

    return {
        docsDialogOpen,
        setDocsDialogOpen,
        showLimitWarning,
        setShowLimitWarning,
        fileMenuAnchor,
        setFileMenuAnchor,
        fileMenuOpen,
        handleOpenDocsDialog,
        handleCloseDocsDialog,
        handleFileMenuClick,
        handleFileMenuClose,
        handleQuickUpload,
        handleOpenDocumentManager,
        handleDocumentSelectFromDialog,
        handleDocumentRemoveFromDialog,
        closeLimitWarning,
    };
};

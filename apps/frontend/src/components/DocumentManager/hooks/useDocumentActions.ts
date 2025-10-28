import { useCallback } from "react";
import { DocumentFile } from "../../../types/document.types";
import { DocumentService } from "../../../services/documentService";

interface UseDocumentActionsProps {
    documentService: DocumentService;
    onDocumentDelete?: (document: DocumentFile) => void;
    onClearSelection?: () => void;
    onReload: () => Promise<void>;
}

export const useDocumentActions = ({
    documentService,
    onDocumentDelete,
    onClearSelection,
    onReload,
}: UseDocumentActionsProps) => {
    const handleDownloadDocument = useCallback(
        async (documentFile: DocumentFile) => {
            try {
                const blob = await documentService.downloadDocument(documentFile.id);
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = documentFile.name;
                link.style.display = "none";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error("Download failed:", error);
            }
        },
        [documentService]
    );

    const handleDeleteDocument = useCallback(
        async (document: DocumentFile) => {
            try {
                await documentService.deleteDocument(document.id);
                onDocumentDelete?.(document);
                await onReload();
            } catch (error) {
                console.error("Delete failed:", error);
            }
        },
        [documentService, onDocumentDelete, onReload]
    );

    const handleBulkDelete = useCallback(
        async (documents: DocumentFile[]) => {
            try {
                // Delete all selected documents
                await Promise.all(
                    documents.map((doc) => documentService.deleteDocument(doc.id))
                );

                // Notify parent of deletions
                documents.forEach((doc) => onDocumentDelete?.(doc));

                // Clear selected documents in parent component
                onClearSelection?.();

                // Refresh the document list
                await onReload();
            } catch (error) {
                console.error("Bulk delete failed:", error);
            }
        },
        [documentService, onDocumentDelete, onClearSelection, onReload]
    );

    return {
        handleDownloadDocument,
        handleDeleteDocument,
        handleBulkDelete,
    };
};

import { useState, useCallback } from "react";
import { DocumentFile } from "../../../types/document.types";

export type ViewMode = "list" | "grid";

export const useDocumentUI = () => {
    const [viewMode, setViewMode] = useState<ViewMode>("list");
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        document?: DocumentFile;
    }>({ open: false });
    const [bulkDeleteDialog, setBulkDeleteDialog] = useState<{
        open: boolean;
        documents: DocumentFile[];
    }>({ open: false, documents: [] });
    const [menuAnchor, setMenuAnchor] = useState<{
        element: HTMLElement;
        document: DocumentFile;
    } | null>(null);

    const handleContextMenu = useCallback(
        (event: React.MouseEvent, document: DocumentFile) => {
            event.preventDefault();
            event.stopPropagation();
            setMenuAnchor({ element: event.currentTarget as HTMLElement, document });
        },
        []
    );

    const closeMenu = useCallback(() => {
        setMenuAnchor(null);
    }, []);

    const openDeleteDialog = useCallback((document: DocumentFile) => {
        setDeleteDialog({ open: true, document });
    }, []);

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialog({ open: false });
    }, []);

    const openBulkDeleteDialog = useCallback((documents: DocumentFile[]) => {
        setBulkDeleteDialog({ open: true, documents });
    }, []);

    const closeBulkDeleteDialog = useCallback(() => {
        setBulkDeleteDialog({ open: false, documents: [] });
    }, []);

    return {
        viewMode,
        setViewMode,
        deleteDialog,
        bulkDeleteDialog,
        menuAnchor,
        handleContextMenu,
        closeMenu,
        openDeleteDialog,
        closeDeleteDialog,
        openBulkDeleteDialog,
        closeBulkDeleteDialog,
    };
};

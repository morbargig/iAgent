import { useCallback } from "react";
import { DocumentFile } from "../../../types/document.types";

interface UseDocumentSelectionProps {
    selectedDocuments: DocumentFile[];
    selectionMode: boolean;
    onDocumentSelect?: (document: DocumentFile) => void;
    onToggleSelection?: (document: DocumentFile) => void;
}

export const useDocumentSelection = ({
    selectedDocuments,
    selectionMode,
    onDocumentSelect,
    onToggleSelection,
}: UseDocumentSelectionProps) => {
    const isDocumentSelected = useCallback(
        (document: DocumentFile): boolean => {
            return selectedDocuments.some((d) => d.id === document.id);
        },
        [selectedDocuments]
    );

    const handleDocumentClick = useCallback(
        (document: DocumentFile) => {
            if (selectionMode && onToggleSelection) {
                onToggleSelection(document);
            } else if (onDocumentSelect) {
                onDocumentSelect(document);
            }
        },
        [selectionMode, onToggleSelection, onDocumentSelect]
    );

    return {
        isDocumentSelected,
        handleDocumentClick,
    };
};

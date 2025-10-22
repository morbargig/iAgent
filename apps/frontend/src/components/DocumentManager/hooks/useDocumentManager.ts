import { useState, useCallback, useEffect } from "react";
import { DocumentFile, DocumentSearchFilters } from "../../../types/document.types";
import { DocumentService } from "../../../services/documentService";
import useDebounce from "../../../hooks/useDebouncer";

export const useDocumentManager = () => {
    const [documentService] = useState(() => new DocumentService());
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters] = useState<DocumentSearchFilters>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocuments, setTotalDocuments] = useState(0);

    // Debounce the search query to avoid multiple API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const loadDocuments = useCallback(
        async (resetPage = false) => {
            setLoading(true);
            setError(null);
            try {
                const currentPage = resetPage ? 1 : page;
                const response = await documentService.getDocuments(currentPage, 10, {
                    ...filters,
                    query: debouncedSearchQuery || undefined,
                });
                setDocuments(response.documents);
                setTotalPages(Math.ceil(response.total / 10));
                setTotalDocuments(response.total);
                if (resetPage) setPage(1);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to load documents"
                );
            } finally {
                setLoading(false);
            }
        },
        [page, filters, debouncedSearchQuery, documentService]
    );

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    // Reload documents when debounced search query changes
    useEffect(() => {
        if (page === 1) {
            // If we're on the first page, just reload
            loadDocuments();
        } else {
            // If we're on another page, reset to page 1 and reload
            setPage(1);
        }
    }, [debouncedSearchQuery]);

    return {
        documents,
        loading,
        error,
        searchQuery,
        page,
        totalPages,
        totalDocuments,
        loadDocuments,
        handleSearch,
        setPage,
        setError,
    };
};

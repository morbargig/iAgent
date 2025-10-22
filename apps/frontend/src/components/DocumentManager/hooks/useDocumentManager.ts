import { useState, useCallback, useEffect } from "react";
import { DocumentFile, DocumentSearchFilters } from "../../../types/document.types";
import { DocumentService } from "../../../services/documentService";

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

    const loadDocuments = useCallback(
        async (resetPage = false) => {
            setLoading(true);
            setError(null);
            try {
                const currentPage = resetPage ? 1 : page;
                const response = await documentService.getDocuments(currentPage, 10, {
                    ...filters,
                    query: searchQuery || undefined,
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
        [page, filters, searchQuery, documentService]
    );

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

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

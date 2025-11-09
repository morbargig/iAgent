import { useState, useCallback } from "react";
import { DocumentSearchFilters } from "../../../types/document.types";
import { useDebounce } from "../../../hooks/useDebouncer";
import { useDocuments } from "../../../features/documents/api";

export const useDocumentManager = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filters] = useState<DocumentSearchFilters>({});
    const [page, setPage] = useState(1);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const { data, isLoading, error, isFetching } = useDocuments(page, 10, {
        ...filters,
        query: debouncedSearchQuery || undefined,
    });

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1);
    }, []);

    return {
        documents: data?.documents || [],
        loading: isLoading,
        error: error instanceof Error ? error.message : null,
        searchQuery,
        page,
        totalPages: data ? Math.ceil(data.total / 10) : 1,
        totalDocuments: data?.total || 0,
        loadDocuments: () => {
            // Documents are loaded via useDocuments hook
        },
        handleSearch,
        setPage,
        setError: () => {
            // Error is managed by TanStack Query
        },
        isFetching,
    };
};

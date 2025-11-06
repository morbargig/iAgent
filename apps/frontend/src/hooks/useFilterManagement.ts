import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "../config/config";

interface ChatFilter {
    filterId: string;
    name: string;
    config: Record<string, any>;
    isActive?: boolean;
    createdAt: string;
}

interface UseFilterManagementProps {
    currentChatId?: string;
    authToken?: string;
    enabledTools: { [key: string]: boolean };
    toolConfigurations: Record<string, any>;
    selectedFlags: string[];
    dateRangeTab: number;
    rangeAmount: number;
    rangeType: string;
    dateRange: [Date | null, Date | null];
    setSelectedFlags: (flags: string[]) => void;
    setRangeAmount: (amount: number) => void;
    setRangeType: (type: string) => void;
    setDateRange: (range: [Date | null, Date | null]) => void;
    setCommittedTab: (tab: number) => void;
    setDateRangeTab: (tab: number) => void;
    toggleTool: (toolId: string) => void;
}

export const useFilterManagement = ({
    currentChatId,
    authToken,
    enabledTools,
    toolConfigurations,
    selectedFlags,
    dateRangeTab,
    rangeAmount,
    rangeType,
    dateRange,
    setSelectedFlags,
    setRangeAmount,
    setRangeType,
    setDateRange,
    setCommittedTab,
    setDateRangeTab,
    toggleTool,
}: UseFilterManagementProps) => {
    const [chatFilters, setChatFilters] = useState<ChatFilter[]>([]);
    const [activeFilter, setActiveFilter] = useState<ChatFilter | null>(null);
    const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(
        null
    );
    const filterMenuOpen = Boolean(filterMenuAnchor);
    const [filterNameDialogOpen, setFilterNameDialogOpen] = useState(false);
    const [renameDialogFilter, setRenameDialogFilter] =
        useState<ChatFilter | null>(null);
    const [filterDetailsDialogOpen, setFilterDetailsDialogOpen] = useState(false);
    const [selectedFilterForDetails, setSelectedFilterForDetails] =
        useState<ChatFilter | null>(null);

    const synchronizedConfigurations = Object.keys(toolConfigurations).reduce(
        (synced: { [toolId: string]: any }, toolId) => {
            synced[toolId] = {
                ...toolConfigurations[toolId],
                enabled: enabledTools[toolId] || false,
            };
            return synced;
        },
        {}
    );

    const applyFilterToUI = (filter: ChatFilter) => {
        const config = filter.config;

        console.log("🔄 Applying filter to UI:", filter.name, config);

        if (config.dateFilter) {
            if (
                config.dateFilter.type === "custom" &&
                config.dateFilter.customRange
            ) {
                setRangeAmount(config.dateFilter.customRange.amount);
                setRangeType(config.dateFilter.customRange.type);
                setCommittedTab(0);
                setDateRangeTab(0);
            } else if (
                config.dateFilter.type === "picker" &&
                config.dateFilter.dateRange
            ) {
                setDateRange([
                    new Date(config.dateFilter.dateRange[0]),
                    new Date(config.dateFilter.dateRange[1]),
                ]);
                setCommittedTab(1);
                setDateRangeTab(1);
            }
        }

        if (config.selectedCountries) {
            setSelectedFlags(config.selectedCountries);
        }

        Object.keys(enabledTools).forEach((toolId) => {
            if (enabledTools[toolId]) {
                toggleTool(toolId); // Disable currently enabled tools
            }
        });

        // Apply enabled tools
        if (config.enabledTools && config.enabledTools.length > 0) {
            config.enabledTools.forEach((toolId: string) => {
                if (!enabledTools[toolId]) {
                    toggleTool(toolId); // Enable tools from filter
                }
            });
        }

        console.log("✅ Filter applied successfully");
    };

    const createNewFilter = () => {
        setFilterMenuAnchor(null);
        setFilterNameDialogOpen(true);
    };

    const handleSaveNewFilter = async (name: string, isGlobal: boolean) => {
        if (!currentChatId || !authToken) {
            console.error("Cannot create filter: missing chatId or authToken");
            return;
        }

        const filterConfig = {
            dateFilter:
                dateRangeTab === 1
                    ? {
                        type: "picker" as const,
                        dateRange: {
                            start: dateRange[0]?.toISOString(),
                            end: dateRange[1]?.toISOString(),
                        },
                    }
                    : {
                        type: "custom" as const,
                        customRange: {
                            amount: rangeAmount,
                            type: rangeType,
                        },
                    },
            selectedCountries: selectedFlags,
            enabledTools: Object.keys(enabledTools).filter(
                (toolId) => enabledTools[toolId]
            ),
            toolConfigurations: synchronizedConfigurations,
        };

        const filterId = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            // Create filter via API
            const response = await fetch(
                getApiUrl(`/chats/${currentChatId}/filters`),
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        filterId: filterId,
                        name: name,
                        filterConfig: filterConfig,
                        isActive: true,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to create filter: ${response.status} ${errorText}`);
            }

            const savedFilter = await response.json();
            console.log("✅ Filter created via API:", savedFilter);

            // Convert API response to ChatFilter format
            const newFilter: ChatFilter = {
                filterId: savedFilter.filterId,
                name: savedFilter.name,
                config: savedFilter.filterConfig,
                isActive: savedFilter.isActive || true,
                createdAt: savedFilter.createdAt || new Date().toISOString(),
            };

            // Reload filters to get updated list
            await loadAllFilters();

            // Set as active filter
            await selectFilter(newFilter);

            console.log(`✅ Filter created and activated:`, name);
        } catch (error) {
            console.error("Failed to create filter:", error);
            throw error;
        }
    };

    const selectFilter = async (filter: ChatFilter) => {
        if (!currentChatId || !authToken) {
            console.error("Cannot select filter: missing chatId or authToken");
            return;
        }

        try {
            // Set active filter via API
            const response = await fetch(
                getApiUrl(`/chats/${currentChatId}/active-filter`),
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        filterId: filter.filterId,
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to set active filter: ${response.status} ${errorText}`);
            }

            // Reload filters to get updated active state
            await loadAllFilters();

            setActiveFilter(filter);
            applyFilterToUI(filter);
            setFilterMenuAnchor(null);

            console.log("✅ Filter activated:", filter.name);
        } catch (error) {
            console.error("Failed to set active filter:", error);
            throw error;
        }
    };

    // Load filters from API
    const loadAllFilters = useCallback(async () => {
        if (!currentChatId || !authToken) {
            setChatFilters([]);
            setActiveFilter(null);
            return;
        }

        try {
            const response = await fetch(
                getApiUrl(`/chats/${currentChatId}/filters`),
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    // No filters found, which is fine
                    setChatFilters([]);
                    setActiveFilter(null);
                    console.log("✅ No filters found for chat");
                    return;
                }
                throw new Error(`Failed to load filters: ${response.status}`);
            }

            const apiFilters = await response.json();
            console.log("✅ API filters loaded:", apiFilters.length);

            // Convert API response to ChatFilter format
            const filters: ChatFilter[] = apiFilters.map((f: any) => ({
                filterId: f.filterId,
                name: f.name,
                config: f.filterConfig,
                isActive: f.isActive || false,
                createdAt: f.createdAt || new Date().toISOString(),
            }));

            setChatFilters(filters);

            // Find active filter
            const activeFilter = filters.find((f: ChatFilter) => f.isActive);
            setActiveFilter(activeFilter || null);

            console.log(`✅ Loaded ${filters.length} filters from API`);
        } catch (error) {
            console.error("Failed to load filters from API:", error);
            // On error, set empty state
            setChatFilters([]);
            setActiveFilter(null);
        }
    }, [currentChatId, authToken]);

    const handleDeleteFilter = async (filter: ChatFilter) => {
        if (!authToken) {
            console.error("Cannot delete filter: missing authToken");
            return;
        }

        try {
            // Delete filter via API
            const response = await fetch(
                getApiUrl(`/chats/filters/${filter.filterId}`),
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    console.warn("Filter not found, may have already been deleted");
                } else {
                    const errorText = await response.text();
                    throw new Error(`Failed to delete filter: ${response.status} ${errorText}`);
                }
            }

            // If this was the active filter, clear it
            if (activeFilter?.filterId === filter.filterId) {
                setActiveFilter(null);
            }

            // Reload filters to get updated list
            await loadAllFilters();

            console.log("✅ Filter deleted:", filter.name);
        } catch (error) {
            console.error("Error deleting filter:", error);
            throw error;
        }
    };

    const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setFilterMenuAnchor(event.currentTarget);
    };

    const handleFilterMenuClose = () => {
        setFilterMenuAnchor(null);
    };

    const handleRenameFilter = (filter: ChatFilter) => {
        setRenameDialogFilter(filter);
        setFilterMenuAnchor(null);
    };

    const handleSaveRename = async (newName: string) => {
        if (!renameDialogFilter || !authToken) {
            console.error("Cannot rename filter: missing filter or authToken");
            return;
        }

        try {
            // Update filter via API
            const response = await fetch(
                getApiUrl(`/chats/filters/${renameDialogFilter.filterId}`),
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ name: newName }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to rename filter: ${response.status} ${errorText}`);
            }

            // Reload filters to get updated list
            await loadAllFilters();

            console.log("✅ Filter renamed:", newName);
        } catch (error) {
            console.error("Failed to rename filter:", error);
            throw error;
        }

        setRenameDialogFilter(null);
    };

    const handleViewFilter = (filter: ChatFilter) => {
        setSelectedFilterForDetails(filter);
        setFilterDetailsDialogOpen(true);
        setFilterMenuAnchor(null);
    };

    const handlePickFilter = (filter: ChatFilter) => {
        applyFilterToUI(filter);
        setFilterMenuAnchor(null);
    };

    const handleApplyFilterFromDetails = () => {
        if (selectedFilterForDetails) {
            applyFilterToUI(selectedFilterForDetails);
        }
    };

    // Load filters when chat changes
    useEffect(() => {
        if (currentChatId) {
            loadAllFilters();
        } else {
            setChatFilters([]);
            setActiveFilter(null);
        }
    }, [currentChatId, loadAllFilters]);

    // Listen for filter application events from message popovers
    useEffect(() => {
        const handleApplyFilterFromMessage = (event: CustomEvent) => {
            const { filter, chatId } = event.detail;

            if (chatId === currentChatId && filter) {
                console.log("Received filter application request:", filter.name);

                // Apply the filter to the current UI
                applyFilterToUI(filter);
                setActiveFilter(filter);

                // Show feedback to user
                console.log("✅ Applied filter from message:", filter.name);
            }
        };

        const handleOpenFilterPopup = (event: CustomEvent) => {
            // Open the filter menu popup
            const filterButton = document.querySelector(
                '[aria-label="Filter settings"]'
            ) as HTMLElement;
            if (filterButton) {
                setFilterMenuAnchor(filterButton);
            } else {
                // Fallback: use the input area container
                const inputContainer = document.getElementById("iagent-input-area");
                if (inputContainer) {
                    setFilterMenuAnchor(inputContainer);
                }
            }
        };

        window.addEventListener(
            "applyFilterFromMessage",
            handleApplyFilterFromMessage as EventListener
        );
        window.addEventListener(
            "openFilterPopup",
            handleOpenFilterPopup as EventListener
        );

        return () => {
            window.removeEventListener(
                "applyFilterFromMessage",
                handleApplyFilterFromMessage as EventListener
            );
            window.removeEventListener(
                "openFilterPopup",
                handleOpenFilterPopup as EventListener
            );
        };
    }, [currentChatId]);

    return {
        chatFilters,
        setChatFilters,
        activeFilter,
        setActiveFilter,
        filterMenuAnchor,
        setFilterMenuAnchor,
        filterMenuOpen,
        filterNameDialogOpen,
        setFilterNameDialogOpen,
        renameDialogFilter,
        setRenameDialogFilter,
        filterDetailsDialogOpen,
        setFilterDetailsDialogOpen,
        selectedFilterForDetails,
        setSelectedFilterForDetails,
        synchronizedConfigurations,
        applyFilterToUI,
        createNewFilter,
        handleSaveNewFilter,
        selectFilter,
        loadAllFilters,
        handleDeleteFilter,
        handleFilterMenuOpen,
        handleFilterMenuClose,
        handleRenameFilter,
        handleSaveRename,
        handleViewFilter,
        handlePickFilter,
        handleApplyFilterFromDetails,
    };
};

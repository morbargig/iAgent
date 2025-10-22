import { useState, useEffect, useCallback } from "react";

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

    // Create synchronized configurations that match enabled tools
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

        // Apply date filter
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

        // Apply selected countries
        if (config.selectedCountries) {
            setSelectedFlags(config.selectedCountries);
        }

        // Reset all tools first, then enable the ones in the filter
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
        if (!currentChatId) return;

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
            createdAt: new Date().toISOString(),
            isGlobal: isGlobal,
        };

        const filterId = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newFilter: ChatFilter = {
            filterId,
            name: name,
            config: filterConfig,
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        try {
            // Save to localStorage (for both global and chat-specific)
            const storageKey = isGlobal
                ? "globalFilters"
                : `chatFilters_${currentChatId}`;
            const existingFilters = localStorage.getItem(storageKey);
            const filters = existingFilters ? JSON.parse(existingFilters) : [];

            // For chat-specific filters, mark all other filters as inactive
            if (!isGlobal) {
                filters.forEach((f: ChatFilter) => (f.isActive = false));
            }

            // Add new filter
            filters.push(newFilter);
            localStorage.setItem(storageKey, JSON.stringify(filters));

            // Update current chat filters and set as active
            if (!isGlobal) {
                setChatFilters(filters);
            } else {
                // For global filters, also add to current chat view
                const currentFilters = [...chatFilters];
                currentFilters.forEach((f) => (f.isActive = false));
                setChatFilters([...currentFilters, newFilter]);
            }

            setActiveFilter(newFilter);

            console.log(`✅ ${isGlobal ? "Global" : "Chat"} filter saved:`, name);

            // If we have authToken, also try API call
            if (authToken) {
                const response = await fetch(
                    `http://localhost:3030/api/chats/${currentChatId}/filters`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            name: name,
                            filterConfig: filterConfig,
                            isGlobal: isGlobal,
                        }),
                    }
                );

                if (response.ok) {
                    console.log("✅ Filter also saved to API");
                }
            }
        } catch (error) {
            console.error("Failed to create filter:", error);
        }
    };

    const selectFilter = async (filter: ChatFilter) => {
        if (!currentChatId) return;

        try {
            // For demo mode, update localStorage
            const existingFilters = localStorage.getItem(
                `chatFilters_${currentChatId}`
            );
            if (existingFilters) {
                const filters = JSON.parse(existingFilters);

                // Mark all filters as inactive
                filters.forEach((f: ChatFilter) => (f.isActive = false));

                // Mark selected filter as active
                const selectedFilter = filters.find(
                    (f: ChatFilter) => f.filterId === filter.filterId
                );
                if (selectedFilter) {
                    selectedFilter.isActive = true;
                }

                localStorage.setItem(
                    `chatFilters_${currentChatId}`,
                    JSON.stringify(filters)
                );
                setChatFilters(filters);
            }

            setActiveFilter(filter);
            applyFilterToUI(filter);
            setFilterMenuAnchor(null);

            console.log("✅ Filter activated:", filter.name);

            // If we have authToken, also try API call
            if (authToken) {
                const response = await fetch(
                    `http://localhost:3030/api/chats/${currentChatId}/active-filter`,
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

                if (response.ok) {
                    console.log("✅ Filter also activated via API");
                }
            }
        } catch (error) {
            console.error("Failed to set active filter:", error);
        }
    };

    // Load both chat-specific and global filters
    const loadAllFilters = useCallback(async () => {
        if (!currentChatId) return;

        try {
            // Load chat-specific filters
            const chatFilters = localStorage.getItem(`chatFilters_${currentChatId}`);
            const chatFilterList = chatFilters ? JSON.parse(chatFilters) : [];

            // Load global filters
            const globalFilters = localStorage.getItem("globalFilters");
            const globalFilterList = globalFilters ? JSON.parse(globalFilters) : [];

            // Combine both lists
            const allFilters = [
                ...chatFilterList.map((f: ChatFilter) => ({ ...f, scope: "chat" })),
                ...globalFilterList.map((f: ChatFilter) => ({ ...f, scope: "global" })),
            ];

            setChatFilters(allFilters);

            // Find active filter
            const activeFilter = allFilters.find((f: ChatFilter) => f.isActive);
            setActiveFilter(activeFilter || null);

            console.log(
                `✅ Loaded ${chatFilterList.length} chat filters + ${globalFilterList.length} global filters`
            );

            // Also try API call if authenticated
            if (authToken) {
                const response = await fetch(
                    `http://localhost:3030/api/chats/${currentChatId}/filters`,
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`,
                        },
                    }
                );

                if (response.ok) {
                    const apiFilters = await response.json();
                    console.log("✅ API filters loaded:", apiFilters.length);
                }
            }
        } catch (error) {
            console.error("Failed to load filters:", error);
        }
    }, [currentChatId, authToken]);

    const handleDeleteFilter = async (filter: ChatFilter) => {
        try {
            // Remove from localStorage
            const isGlobal = (filter as any).scope === "global";
            const storageKey = isGlobal
                ? "globalFilters"
                : `chatFilters_${currentChatId}`;
            const existingFilters = JSON.parse(
                localStorage.getItem(storageKey) || "[]"
            );
            const updatedFilters = existingFilters.filter(
                (f: ChatFilter) => f.filterId !== filter.filterId
            );
            localStorage.setItem(storageKey, JSON.stringify(updatedFilters));

            // Update state
            setChatFilters(updatedFilters);

            // If this was the active filter, clear it
            if (activeFilter?.filterId === filter.filterId) {
                setActiveFilter(null);
            }

            console.log("Filter deleted:", filter.name);
        } catch (error) {
            console.error("Error deleting filter:", error);
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
        if (!renameDialogFilter || !currentChatId) return;

        const isGlobal = renameDialogFilter.config?.isGlobal;
        const storageKey = isGlobal
            ? "globalFilters"
            : `chatFilters_${currentChatId}`;

        try {
            // Update in localStorage
            const existingFilters = localStorage.getItem(storageKey);
            if (existingFilters) {
                const filters = JSON.parse(existingFilters);
                const filterIndex = filters.findIndex(
                    (f: ChatFilter) => f.filterId === renameDialogFilter.filterId
                );

                if (filterIndex !== -1) {
                    filters[filterIndex].name = newName;
                    localStorage.setItem(storageKey, JSON.stringify(filters));

                    // Update UI
                    loadAllFilters();

                    console.log("✅ Filter renamed:", newName);

                    // Also try API call if authenticated
                    if (authToken) {
                        await fetch(
                            `http://localhost:3030/api/chats/filters/${renameDialogFilter.filterId}`,
                            {
                                method: "PUT",
                                headers: {
                                    Authorization: `Bearer ${authToken}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ name: newName }),
                            }
                        );
                    }
                }
            }
        } catch (error) {
            console.error("Failed to rename filter:", error);
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

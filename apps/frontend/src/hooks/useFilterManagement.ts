import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useFilters, useCreateFilter, useUpdateFilter, useDeleteFilter, useSetActiveFilter } from "../features/filters/api";
import type { ToolConfiguration } from "../components/ToolSettingsDialog";
import type { ToolId } from "../utils/toolUtils";
import type { DateRangeSettings } from "../types/storage.types";

const generateFilterId = () =>
    `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

type CustomRangeType = DateRangeSettings["customRange"]["type"];

interface FilterConfig {
    dateFilter?: {
        type: "custom" | "picker";
        customRange?: {
            amount: number;
            type: CustomRangeType;
        };
        dateRange?: [string, string];
    };
    selectedCountries?: string[];
    enabledTools?: ToolId[];
    [key: string]: unknown;
}

interface ChatFilter {
    filterId: string;
    name: string;
    config: FilterConfig;
    isActive?: boolean;
    createdAt: string;
}

interface UseFilterManagementProps {
    currentChatId?: string;
    authToken?: string;
    enabledTools: Partial<Record<ToolId, boolean>>;
    toolConfigurations: Partial<Record<ToolId, ToolConfiguration>>;
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
    toggleTool: (toolId: ToolId) => void;
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

    const synchronizedConfigurations = useMemo(
        () => (Object.keys(toolConfigurations) as ToolId[]).reduce(
            (synced: Partial<Record<ToolId, ToolConfiguration>>, toolId) => {
                const currentConfig = toolConfigurations[toolId];
                const baseConfig: ToolConfiguration = currentConfig || {
                    toolId,
                    enabled: false,
                    parameters: {},
                };
                synced[toolId] = {
                    ...baseConfig,
                    enabled: enabledTools[toolId] || false,
                };
                return synced;
            },
            {}
        ),
        [toolConfigurations, enabledTools]
    );

    const applyFilterToUI = useCallback((filter: ChatFilter) => {
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

        (Object.keys(enabledTools) as ToolId[]).forEach((toolId) => {
            if (enabledTools[toolId]) {
                toggleTool(toolId); // Disable currently enabled tools
            }
        });

        // Apply enabled tools
        if (config.enabledTools && config.enabledTools.length > 0) {
            (config.enabledTools as ToolId[]).forEach((toolId) => {
                if (!enabledTools[toolId]) {
                    toggleTool(toolId); // Enable tools from filter
                }
            });
        }

        console.log("✅ Filter applied successfully");
    }, [
        setRangeAmount,
        setRangeType,
        setCommittedTab,
        setDateRangeTab,
        setDateRange,
        setSelectedFlags,
        enabledTools,
        toggleTool,
    ]);

    const createNewFilter = () => {
        setFilterMenuAnchor(null);
        setFilterNameDialogOpen(true);
    };

    const createFilterMutation = useCreateFilter();
    const setActiveFilterMutation = useSetActiveFilter();

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
            enabledTools: (Object.keys(enabledTools) as ToolId[]).filter(
                (toolId) => enabledTools[toolId]
            ),
            toolConfigurations: synchronizedConfigurations,
        };

        const filterId = generateFilterId();

        try {
            const savedFilter = await createFilterMutation.mutateAsync({
                chatId: currentChatId,
                filterId,
                name,
                filterConfig,
                isActive: true,
            });

            const newFilter: ChatFilter = {
                filterId: savedFilter.filterId,
                name: savedFilter.name,
                config: savedFilter.filterConfig,
                isActive: savedFilter.isActive || true,
                createdAt: savedFilter.createdAt || new Date().toISOString(),
            };

            await setActiveFilterMutation.mutateAsync({
                chatId: currentChatId,
                filterId: newFilter.filterId,
            });

            await selectFilter(newFilter);
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
            await setActiveFilterMutation.mutateAsync({
                chatId: currentChatId,
                filterId: filter.filterId,
            });

            setActiveFilter(filter);
            applyFilterToUI(filter);
            setFilterMenuAnchor(null);
        } catch (error) {
            console.error("Failed to set active filter:", error);
            throw error;
        }
    };

    const { data: filtersData = [] } = useFilters(currentChatId || null);
    
    const previousFiltersRef = useRef<string>('');

    const transformedFilters = useMemo(() => {
        return filtersData.map((f) => ({
            filterId: f.filterId,
            name: f.name,
            config: f.filterConfig,
            isActive: f.isActive || false,
            createdAt: f.createdAt || new Date().toISOString(),
        }));
    }, [filtersData]);

    useEffect(() => {
        const currentFiltersKey = JSON.stringify(transformedFilters.map(f => f.filterId));
        
        if (currentFiltersKey !== previousFiltersRef.current) {
            setChatFilters(transformedFilters);
            const activeFilter = transformedFilters.find((f: ChatFilter) => f.isActive);
            setActiveFilter(activeFilter || null);
            previousFiltersRef.current = currentFiltersKey;
        }
    }, [transformedFilters]);

    const loadAllFilters = useCallback(async () => {
        // Filters are now loaded via useFilters hook
    }, []);

    const deleteFilterMutation = useDeleteFilter();

    const handleDeleteFilter = async (filter: ChatFilter) => {
        if (!authToken) {
            console.error("Cannot delete filter: missing authToken");
            return;
        }

        try {
            await deleteFilterMutation.mutateAsync({ filterId: filter.filterId });

            if (activeFilter?.filterId === filter.filterId) {
                setActiveFilter(null);
            }
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

    const updateFilterMutation = useUpdateFilter();

    const handleSaveRename = async (newName: string) => {
        if (!renameDialogFilter || !authToken) {
            console.error("Cannot rename filter: missing filter or authToken");
            return;
        }

        try {
            await updateFilterMutation.mutateAsync({
                filterId: renameDialogFilter.filterId,
                name: newName,
            });
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

    // Filters are loaded via useFilters hook, no need for manual loading

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
    }, [currentChatId, applyFilterToUI]);

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

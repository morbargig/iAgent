import React, { useState, useEffect } from "react";
import { parseISO } from "date-fns";

// Time range options
const timeRangeOptions = [
    { value: "minutes", labelKey: "dateRange.minutes" },
    { value: "hours", labelKey: "dateRange.hours" },
    { value: "days", labelKey: "dateRange.days" },
    { value: "weeks", labelKey: "dateRange.weeks" },
    { value: "months", labelKey: "dateRange.months" },
    { value: "years", labelKey: "dateRange.years" },
];

interface UseDateRangeProps {
    t: (key: string) => string;
}

export const useDateRange = ({ t }: UseDateRangeProps) => {
    const [dateAnchorEl, setDateAnchorEl] = useState<HTMLElement | null>(null);
    const datePopoverOpen = Boolean(dateAnchorEl);

    // Initialize date range settings from localStorage
    const initializeDateRangeSettings = () => {
        try {
            const saved = localStorage.getItem("dateRangeSettings");
            if (saved) {
                const settings = JSON.parse(saved);
                return {
                    activeTab: settings.activeTab || 0,
                    committedTab: settings.committedTab || 0,
                    customRange: {
                        amount: settings.customRange?.amount || 7,
                        type: settings.customRange?.type || "days",
                    },
                    datePicker: {
                        startDate: settings.datePicker?.startDate || null,
                        endDate: settings.datePicker?.endDate || null,
                    },
                };
            }
        } catch (error) {
            console.warn(
                "Failed to load date range settings from localStorage:",
                error
            );
        }

        // Default settings
        const today = new Date();
        const oneMonthAgo = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            today.getDate()
        );
        return {
            activeTab: 0,
            committedTab: 0,
            customRange: {
                amount: 1,
                type: "months",
            },
            datePicker: {
                startDate: oneMonthAgo.toISOString(),
                endDate: today.toISOString(),
            },
        };
    };

    const initialSettings = React.useMemo(
        () => initializeDateRangeSettings(),
        []
    );

    const [dateRangeTab, setDateRangeTab] = useState(initialSettings.activeTab);
    const [rangeAmount, setRangeAmount] = useState(
        initialSettings.customRange.amount
    );
    const [rangeType, setRangeType] = useState(initialSettings.customRange.type);
    const [rangeTypeOpen, setRangeTypeOpen] = useState(false);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        initialSettings.datePicker.startDate
            ? parseISO(initialSettings.datePicker.startDate)
            : null,
        initialSettings.datePicker.endDate
            ? parseISO(initialSettings.datePicker.endDate)
            : null,
    ]);

    // Temporary state for date picker (only committed on Apply)
    const [tempDateRange, setTempDateRange] = useState<
        [Date | null, Date | null]
    >([
        initialSettings.datePicker.startDate
            ? parseISO(initialSettings.datePicker.startDate)
            : null,
        initialSettings.datePicker.endDate
            ? parseISO(initialSettings.datePicker.endDate)
            : null,
    ]);

    // Track which tab's values are currently committed/active for display
    const [committedTab, setCommittedTab] = useState(
        initialSettings.committedTab
    );

    // Save all date range settings to single localStorage key with debouncing
    useEffect(() => {
        const startDateString = dateRange[0]?.toISOString();
        const endDateString = dateRange[1]?.toISOString();

        const timeoutId = setTimeout(() => {
            try {
                const dateRangeSettings = {
                    activeTab: dateRangeTab,
                    committedTab: committedTab,
                    customRange: {
                        amount: rangeAmount,
                        type: rangeType,
                    },
                    datePicker: {
                        startDate: startDateString || null,
                        endDate: endDateString || null,
                    },
                };
                localStorage.setItem(
                    "dateRangeSettings",
                    JSON.stringify(dateRangeSettings)
                );
            } catch (error) {
                console.warn(
                    "Failed to save date range settings to localStorage:",
                    error
                );
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [
        dateRangeTab,
        committedTab,
        rangeAmount,
        rangeType,
        dateRange,
    ]);

    // Date range handlers
    const handleDateClick = (event: React.MouseEvent<HTMLElement>) => {
        if (datePopoverOpen) {
            setDateAnchorEl(null);
        } else {
            // Sync temp state with current state when opening
            setTempDateRange(dateRange);
            setDateAnchorEl(event.currentTarget);
        }
    };

    const handleDateRangeApply = () => {
        // Commit temporary date range to main state
        if (dateRangeTab === 1) {
            setDateRange(tempDateRange);
        }
        // Update committed tab to current tab
        setCommittedTab(dateRangeTab);
        setDateAnchorEl(null);
    };

    // Format date range for button display
    const getDateRangeButtonText = () => {
        if (committedTab === 1 && dateRange[0] && dateRange[1]) {
            // DateTime picker format - use committed dateRange
            const start =
                dateRange[0].toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                }) +
                " " +
                dateRange[0].toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            const end =
                dateRange[1].toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                }) +
                " " +
                dateRange[1].toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
            return `${start} - ${end}`;
        } else {
            // Custom range format
            return `${rangeAmount} ${t(`dateRange.${rangeType}`)} ${t("dateRange.ago")}`;
        }
    };

    const handleDateRangeReset = () => {
        // Reset to default values
        setRangeAmount(1);
        setRangeType("months");
        // Reset date range to default: one month ago to today
        const today = new Date();
        const oneMonthAgo = new Date(
            today.getFullYear(),
            today.getMonth() - 1,
            today.getDate()
        );
        setDateRange([oneMonthAgo, today]);
        setTempDateRange([null, null]); // Reset temp state to empty for date picker
        setDateRangeTab(0); // Switch back to custom range tab
        setCommittedTab(0); // Reset committed tab to custom range

        // Clear the BasicDateRangePicker's localStorage data
        try {
            localStorage.removeItem("dateRangePicker");
            console.log("Cleared date picker localStorage on reset");
        } catch (error) {
            console.warn("Failed to clear date picker localStorage:", error);
        }
    };

    const closeDatePopover = () => {
        setDateAnchorEl(null);
        setRangeTypeOpen(false);
    };

    return {
        dateRangeTab,
        setDateRangeTab,
        rangeAmount,
        setRangeAmount,
        rangeType,
        setRangeType,
        rangeTypeOpen,
        setRangeTypeOpen,
        dateRange,
        setDateRange,
        tempDateRange,
        setTempDateRange,
        committedTab,
        setCommittedTab,
        dateAnchorEl,
        setDateAnchorEl,
        datePopoverOpen,
        timeRangeOptions,
        handleDateClick,
        handleDateRangeApply,
        getDateRangeButtonText,
        handleDateRangeReset,
        closeDatePopover,
    };
};

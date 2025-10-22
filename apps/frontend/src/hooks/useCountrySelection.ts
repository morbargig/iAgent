import { useState, useEffect } from "react";

// Flag options with country data
const flagOptions = [
    { code: "PS", flag: "🇵🇸", nameKey: "countries.palestine" },
    { code: "LB", flag: "🇱🇧", nameKey: "countries.lebanon" },
    { code: "SA", flag: "🇸🇦", nameKey: "countries.saudi_arabia" },
    { code: "IQ", flag: "🇮🇶", nameKey: "countries.iraq" },
    { code: "SY", flag: "🇸🇾", nameKey: "countries.syria" },
    { code: "JO", flag: "🇯🇴", nameKey: "countries.jordan" },
    { code: "EG", flag: "🇪🇬", nameKey: "countries.egypt" },
    { code: "IL", flag: "🇮🇱", nameKey: "countries.israel" },
];

export const useCountrySelection = () => {
    // Flag selection state with localStorage persistence
    const [selectedFlags, setSelectedFlags] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem("selectedCountries");
            return saved ? JSON.parse(saved) : ["PS", "LB", "SA", "IQ"];
        } catch {
            return ["PS", "LB", "SA", "IQ"];
        }
    });

    const [flagAnchorEl, setFlagAnchorEl] = useState<HTMLElement | null>(null);
    const flagPopoverOpen = Boolean(flagAnchorEl);

    // Save selected flags to localStorage with debouncing
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(
                    "selectedCountries",
                    JSON.stringify(selectedFlags)
                );
            } catch (error) {
                console.warn(
                    "Failed to save selected countries to localStorage:",
                    error
                );
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [selectedFlags]);

    // Flag selection handlers
    const handleFlagClick = (event: React.MouseEvent<HTMLElement>) => {
        if (flagPopoverOpen) {
            setFlagAnchorEl(null);
        } else {
            setFlagAnchorEl(event.currentTarget);
        }
    };

    const handleFlagToggle = (flagCode: string) => {
        const newFlags = selectedFlags.includes(flagCode)
            ? selectedFlags.filter((code) => code !== flagCode)
            : [...selectedFlags, flagCode];

        setSelectedFlags(newFlags);
    };

    const closeFlagPopover = () => {
        setFlagAnchorEl(null);
    };

    return {
        selectedFlags,
        setSelectedFlags,
        flagAnchorEl,
        setFlagAnchorEl,
        flagPopoverOpen,
        flagOptions,
        handleFlagClick,
        handleFlagToggle,
        closeFlagPopover,
    };
};

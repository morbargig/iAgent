import React from "react";
import { Box, Typography, Popover, Tooltip } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import { useTranslation } from "../../contexts/TranslationContext";

interface FlagOption {
  code: string;
  flag: string;
  nameKey: string;
}

interface CountrySelectorProps {
  selectedFlags: string[];
  flagPopoverOpen: boolean;
  flagAnchorEl: HTMLElement | null;
  flagOptions: FlagOption[];
  isDarkMode: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  onFlagClick: (event: React.MouseEvent<HTMLElement>) => void;
  onFlagToggle: (flagCode: string) => void;
  onClose: () => void;
  isEnabled?: boolean;
  requiredTools?: readonly string[];
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedFlags,
  flagPopoverOpen,
  flagAnchorEl,
  flagOptions,
  isDarkMode,
  t,
  onFlagClick,
  onFlagToggle,
  onClose,
  isEnabled = true,
  requiredTools = [],
}) => {
  const { isRTL } = useTranslation();
  const toolNames = requiredTools.map((toolId) => t(`tools.${toolId}`));
  const formattedToolList =
    toolNames.length <= 1
      ? toolNames[0] || ""
      : `${toolNames.slice(0, -1).join(", ")} ${t("tools.tooltips.and")} ${toolNames.slice(-1)}`;
  const tooltipText = isEnabled
    ? t("input.selectCountries")
    : t("tools.tooltips.countriesRequireTool", {
        tool: formattedToolList || t("tools.tooltips.countriesAvailableForTools"),
      });

  return (
    <>
      {/* Country Selector Button */}
      <Tooltip title={tooltipText} arrow>
        <Box
          id="iagent-country-selector"
          className="iagent-country-dropdown"
          onClick={isEnabled ? onFlagClick : undefined}
          sx={{
            display: "flex",
            position: "relative",
            alignItems: "center",
            backgroundColor: isDarkMode ? "#565869" : "#e5e7eb",
            border: `1px solid ${isDarkMode ? "#6b6d7a" : "#d1d5db"}`,
            borderRadius: "20px",
            padding: "6px 12px",
            cursor: isEnabled ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
            minWidth: "120px",
            height: "32px",
            opacity: isEnabled ? 1 : 0.5,
            "&:hover": {
              backgroundColor: isEnabled
                ? isDarkMode
                  ? "#6b6d7a"
                  : "#d1d5db"
                : isDarkMode
                  ? "#565869"
                  : "#e5e7eb",
              transform: isEnabled ? "translateY(-1px)" : "none",
              boxShadow: isEnabled ? "0 2px 8px rgba(0, 0, 0, 0.1)" : "none",
            },
          }}
        >
        {/* Selected Flags Display */}
        <Box
          sx={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            position: "relative",
            minWidth: "80px",
            height: "24px",
          }}
        >
          {selectedFlags.length === 0 ? (
            // No countries selected - show placeholder
            <Typography
              sx={{
                fontSize: "12px",
                color: isDarkMode ? "#9ca3af" : "#6b7280",
                fontWeight: 400,
                direction: "rtl",
                whiteSpace: "nowrap",
              }}
            >
              {t("input.selectCountries")}
            </Typography>
          ) : (
            <>
              {selectedFlags.slice(0, 4).map((flagCode, index) => {
                const flagOption = flagOptions.find(
                  (opt) => opt.code === flagCode
                );
                return flagOption ? (
                  <Box
                    key={flagCode}
                    sx={{
                      position: "absolute",
                      left: `${index * 14}px`,
                      fontSize: "14px",
                      width: "22px",
                      height: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      zIndex: selectedFlags.length - index,
                      pointerEvents: "none",
                    }}
                  >
                    {flagOption.flag}
                  </Box>
                ) : null;
              })}
              {selectedFlags.length > 4 && (
                <Box
                  sx={{
                    position: "absolute",
                    left: `${4 * 14}px`,
                    fontSize: "10px",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isDarkMode ? "#565869" : "#e5e7eb",
                    border: "2px solid #ffffff",
                    color: isDarkMode ? "#ececf1" : "#374151",
                    fontWeight: 700,
                    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                    zIndex: 1,
                  }}
                >
                  +{selectedFlags.length - 4}
                </Box>
              )}
            </>
          )}
        </Box>

        {/* Dropdown Arrow */}
        <ExpandMoreIcon
          sx={{
            fontSize: "14px",
            color: isDarkMode ? "#9ca3af" : "#6b7280",
            transition: "transform 0.2s ease",
            transform: flagPopoverOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
          />
        </Box>
      </Tooltip>

      {/* Flag Multi-Select Dropdown */}
      <Popover
        id="iagent-country-popover"
        open={flagPopoverOpen && isEnabled}
        anchorEl={flagAnchorEl}
        onClose={onClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: isRTL ? "right" : "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: isRTL ? "right" : "left",
        }}
        slotProps={{
          paper: {
            id: "iagent-country-popover-paper",
            sx: {
              backgroundColor: isDarkMode ? "#40414f" : "#ffffff",
              border: `1px solid ${isDarkMode ? "#565869" : "#e5e7eb"}`,
              borderRadius: "12px",
              boxShadow: isDarkMode
                ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                : "0 8px 25px rgba(0, 0, 0, 0.15)",
              padding: "16px",
              maxWidth: "400px",
              marginTop: "-8px", // Adjust positioning to match previous layout
            },
          },
        }}
      >
        <Box
          id="iagent-country-popover-grid"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "8px",
            maxWidth: "280px",
          }}
        >
          {flagOptions.map((option) => (
            <Box
              key={option.code}
              id={`iagent-country-popover-item-${option.code}`}
              onClick={() => onFlagToggle(option.code)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                padding: "12px 8px",
                cursor: "pointer",
                borderRadius: "8px",
                transition: "all 0.2s ease",
                backgroundColor: selectedFlags.includes(option.code)
                  ? isDarkMode
                    ? "rgba(33, 150, 243, 0.2)"
                    : "rgba(33, 150, 243, 0.1)"
                  : "transparent",
                border: selectedFlags.includes(option.code)
                  ? "2px solid #2196f3"
                  : "2px solid transparent",
                "&:hover": {
                  backgroundColor: selectedFlags.includes(option.code)
                    ? isDarkMode
                      ? "rgba(33, 150, 243, 0.3)"
                      : "rgba(33, 150, 243, 0.15)"
                    : isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.04)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                },
              }}
            >
              <Box
                sx={{
                  fontSize: "24px",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {option.flag}
              </Box>
              <Typography
                sx={{
                  fontSize: "11px",
                  color: selectedFlags.includes(option.code)
                    ? "#2196f3"
                    : isDarkMode
                      ? "#ececf1"
                      : "#374151",
                  direction: "rtl",
                  fontWeight: selectedFlags.includes(option.code) ? 600 : 400,
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {t(option.nameKey)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Popover>
    </>
  );
};

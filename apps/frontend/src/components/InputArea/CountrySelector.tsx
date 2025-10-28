import React from "react";
import { Box, Typography } from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";

interface FlagOption {
  code: string;
  flag: string;
  nameKey: string;
}

interface CountrySelectorProps {
  selectedFlags: string[];
  flagPopoverOpen: boolean;
  flagOptions: FlagOption[];
  isDarkMode: boolean;
  t: (key: string) => string;
  onFlagClick: (event: React.MouseEvent<HTMLElement>) => void;
  onFlagToggle: (flagCode: string) => void;
  onClose: () => void;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  selectedFlags,
  flagPopoverOpen,
  flagOptions,
  isDarkMode,
  t,
  onFlagClick,
  onFlagToggle,
  onClose,
}) => {
  return (
    <>
      {/* Country Selector Button */}
      <Box
        id="iagent-country-selector"
        className="iagent-country-dropdown"
        onClick={onFlagClick}
        sx={{
          display: "flex",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#565869" : "#e5e7eb",
          border: `1px solid ${isDarkMode ? "#6b6d7a" : "#d1d5db"}`,
          borderRadius: "20px",
          padding: "6px 12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minWidth: "120px",
          height: "32px",
          "&:hover": {
            backgroundColor: isDarkMode ? "#6b6d7a" : "#d1d5db",
            transform: "translateY(-1px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
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

      {/* Flag Multi-Select Dropdown */}
      {flagPopoverOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: "transparent",
          }}
          onClick={onClose}
        >
          <Box
            sx={{
              position: "absolute",
              bottom: "120px", // Approximate position above the input area
              left: "50px", // Approximate position
              backgroundColor: isDarkMode ? "#40414f" : "#ffffff",
              border: `1px solid ${isDarkMode ? "#565869" : "#e5e7eb"}`,
              borderRadius: "12px",
              boxShadow: isDarkMode
                ? "0 8px 25px rgba(0, 0, 0, 0.3)"
                : "0 8px 25px rgba(0, 0, 0, 0.15)",
              padding: "16px",
              maxWidth: "400px",
              zIndex: 9999,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Box
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
                      fontWeight: selectedFlags.includes(option.code)
                        ? 600
                        : 400,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    {t(option.nameKey)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

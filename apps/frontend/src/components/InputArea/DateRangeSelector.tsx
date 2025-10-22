import React from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material";
import BasicDateRangePicker from "../BasicDateRangePicker";

interface TimeRangeOption {
  value: string;
  labelKey: string;
}

interface DateRangeSelectorProps {
  dateRangeTab: number;
  rangeAmount: number;
  rangeType: string;
  rangeTypeOpen: boolean;
  dateRange: [Date | null, Date | null];
  tempDateRange: [Date | null, Date | null];
  datePopoverOpen: boolean;
  timeRangeOptions: TimeRangeOption[];
  isDarkMode: boolean;
  t: (key: string) => string;
  getDateRangeButtonText: () => string;
  onDateClick: (event: React.MouseEvent<HTMLElement>) => void;
  onDateRangeTabChange: (tab: number) => void;
  onRangeAmountChange: (amount: number) => void;
  onRangeTypeChange: (type: string) => void;
  onRangeTypeToggle: () => void;
  onTempDateRangeChange: (range: [Date | null, Date | null]) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  dateRangeTab,
  rangeAmount,
  rangeType,
  rangeTypeOpen,
  dateRange,
  tempDateRange,
  datePopoverOpen,
  timeRangeOptions,
  isDarkMode,
  t,
  getDateRangeButtonText,
  onDateClick,
  onDateRangeTabChange,
  onRangeAmountChange,
  onRangeTypeChange,
  onRangeTypeToggle,
  onTempDateRangeChange,
  onApply,
  onReset,
  onClose,
}) => {
  return (
    <>
      {/* Date Range Selector Button */}
      <Box
        id="iagent-date-selector"
        className="iagent-date-range-button"
        onClick={onDateClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: isDarkMode ? "#565869" : "#e5e7eb",
          border: `1px solid ${isDarkMode ? "#6b6d7a" : "#d1d5db"}`,
          borderRadius: "20px",
          padding: "6px 12px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: isDarkMode ? "#6b6d7a" : "#d1d5db",
            transform: "translateY(-1px)",
          },
        }}
      >
        <CalendarIcon
          sx={{
            fontSize: "16px",
            color: isDarkMode ? "#ececf1" : "#374151",
          }}
        />
        <Typography
          sx={{
            fontSize: "13px",
            fontWeight: 500,
            color: isDarkMode ? "#ececf1" : "#374151",
            direction: "inherit",
            textAlign: "start",
            whiteSpace: "nowrap",
            unicodeBidi: "plaintext",
          }}
        >
          {getDateRangeButtonText()}
        </Typography>
      </Box>

      {/* Date Range Popover */}
      {datePopoverOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            insetInlineStart: 0,
            insetInlineEnd: 0,
            bottom: 0,
            zIndex: 9998,
            backgroundColor: "rgba(0, 0, 0, 0.1)",
          }}
          onClick={onClose}
        >
          <Box
            sx={{
              position: "absolute",
              bottom: "120px", // Approximate position above the input area
              left: "200px", // Approximate position
              backgroundColor: isDarkMode ? "#2f2f2f" : "#ffffff",
              border: `1px solid ${isDarkMode ? "#4a4a4a" : "#e1e5e9"}`,
              borderRadius: "8px",
              boxShadow: isDarkMode
                ? "0 4px 20px rgba(0, 0, 0, 0.4)"
                : "0 4px 20px rgba(0, 0, 0, 0.1)",
              padding: "0",
              minWidth: "550px",
              maxWidth: "650px",
              zIndex: 9999,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main content area with side tabs */}
            <Box sx={{ display: "flex", flex: 1 }}>
              {/* Side Tab Buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "140px",
                  backgroundColor: isDarkMode ? "#1a1a1a" : "#f8f9fa",
                  borderRadius: "6px 0 0 0",
                  padding: "16px 8px",
                  gap: "8px",
                  justifyContent: "flex-end",
                }}
              >
                <Box
                  onClick={() => onDateRangeTabChange(0)}
                  sx={{
                    padding: "12px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                    backgroundColor:
                      dateRangeTab === 0
                        ? isDarkMode
                          ? "#ffffff"
                          : "#ffffff"
                        : "transparent",
                    color:
                      dateRangeTab === 0
                        ? isDarkMode
                          ? "#000000"
                          : "#000000"
                        : isDarkMode
                          ? "#a0a0a0"
                          : "#6b7280",
                    boxShadow:
                      dateRangeTab === 0
                        ? "0 1px 3px rgba(0, 0, 0, 0.12)"
                        : "none",
                    "&:hover": {
                      backgroundColor:
                        dateRangeTab === 0
                          ? isDarkMode
                            ? "#ffffff"
                            : "#ffffff"
                          : isDarkMode
                            ? "#2a2a2a"
                            : "#f1f3f4",
                    },
                  }}
                >
                  {t("dateRange.customRange")}
                </Box>
                <Box
                  onClick={() => onDateRangeTabChange(1)}
                  sx={{
                    padding: "12px 8px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    textAlign: "center",
                    backgroundColor:
                      dateRangeTab === 1
                        ? isDarkMode
                          ? "#ffffff"
                          : "#ffffff"
                        : "transparent",
                    color:
                      dateRangeTab === 1
                        ? isDarkMode
                          ? "#000000"
                          : "#000000"
                        : isDarkMode
                          ? "#a0a0a0"
                          : "#6b7280",
                    boxShadow:
                      dateRangeTab === 1
                        ? "0 1px 3px rgba(0, 0, 0, 0.12)"
                        : "none",
                    "&:hover": {
                      backgroundColor:
                        dateRangeTab === 1
                          ? isDarkMode
                            ? "#ffffff"
                            : "#ffffff"
                          : isDarkMode
                            ? "#2a2a2a"
                            : "#f1f3f4",
                    },
                  }}
                >
                  {t("dateRange.datePicker")}
                </Box>
              </Box>

              {/* Content Area */}
              <Box sx={{ flex: 1, padding: "16px", paddingBottom: "8px" }}>
                {dateRangeTab === 0 ? (
                  // Custom Range Tab
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: isDarkMode ? "#f1f1f1" : "#1f2937",
                        marginBottom: "4px",
                        direction: "inherit",
                        textAlign: "start",
                      }}
                    >
                      {t("dateRange.customRangeTitle")}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        direction: "ltr",
                        flexDirection: "row",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TextField
                        type="number"
                        value={rangeAmount}
                        onChange={(e) =>
                          onRangeAmountChange(
                            Math.max(
                              1,
                              Math.min(100000, parseInt(e.target.value) || 1)
                            )
                          )
                        }
                        inputProps={{ min: 1, max: 100000 }}
                        size="small"
                        sx={{
                          width: "100px",
                          "& .MuiOutlinedInput-root": {
                            backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
                            borderRadius: "6px",
                            color: isDarkMode ? "#f1f1f1" : "#1f2937",
                            fontSize: "14px",
                            "& fieldset": {
                              borderColor: isDarkMode ? "#555555" : "#e1e5e9",
                            },
                            "&:hover fieldset": {
                              borderColor: isDarkMode ? "#666666" : "#c1c7cd",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#10a37f",
                              borderWidth: "1px",
                            },
                          },
                        }}
                      />

                      <Box sx={{ position: "relative", minWidth: "120px" }}>
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            onRangeTypeToggle();
                          }}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            border: `1px solid ${isDarkMode ? "#555555" : "#e1e5e9"}`,
                            borderRadius: "6px",
                            backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
                            color: isDarkMode ? "#f1f1f1" : "#1f2937",
                            cursor: "pointer",
                            fontSize: "14px",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              borderColor: isDarkMode ? "#666666" : "#c1c7cd",
                            },
                          }}
                        >
                          <Typography sx={{ fontSize: "14px" }}>
                            {t(`dateRange.${rangeType}`)}
                          </Typography>
                          <ExpandMoreIcon
                            sx={{
                              fontSize: "18px",
                              transform: rangeTypeOpen
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          />
                        </Box>

                        {rangeTypeOpen && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              zIndex: 10010,
                              backgroundColor: isDarkMode
                                ? "#2f2f2f"
                                : "#ffffff",
                              border: `1px solid ${isDarkMode ? "#4a4a4a" : "#e1e5e9"}`,
                              borderRadius: "8px",
                              boxShadow: isDarkMode
                                ? "0 8px 25px rgba(0, 0, 0, 0.4)"
                                : "0 8px 25px rgba(0, 0, 0, 0.15)",
                              maxHeight: "200px",
                              overflowY: "auto",
                            }}
                          >
                            {timeRangeOptions.map((option) => (
                              <Box
                                key={option.value}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRangeTypeChange(option.value);
                                }}
                                sx={{
                                  padding: "10px 12px",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  color: isDarkMode ? "#f1f1f1" : "#1f2937",
                                  backgroundColor:
                                    rangeType === option.value
                                      ? isDarkMode
                                        ? "#404040"
                                        : "#f3f4f6"
                                      : "transparent",
                                  borderBottom: `1px solid ${isDarkMode ? "#3a3a3a" : "#f0f0f0"}`,
                                  "&:last-child": {
                                    borderBottom: "none",
                                  },
                                  "&:hover": {
                                    backgroundColor: isDarkMode
                                      ? "#404040"
                                      : "#f3f4f6",
                                  },
                                  "&:first-of-type": {
                                    borderTopLeftRadius: "8px",
                                    borderTopRightRadius: "8px",
                                  },
                                  "&:last-of-type": {
                                    borderBottomLeftRadius: "8px",
                                    borderBottomRightRadius: "8px",
                                  },
                                }}
                              >
                                {t(option.labelKey)}
                              </Box>
                            ))}
                          </Box>
                        )}
                      </Box>

                      <Typography
                        sx={{
                          fontSize: "14px",
                          color: isDarkMode ? "#a0a0a0" : "#6b7280",
                          whiteSpace: "nowrap",
                          direction: "inherit",
                          textAlign: "start",
                        }}
                      >
                        {t("dateRange.ago")}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  // Date Picker Tab
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: isDarkMode ? "#f1f1f1" : "#1f2937",
                        marginBottom: "4px",
                        direction: "inherit",
                        textAlign: "start",
                      }}
                    >
                      {t("dateRange.datePickerTitle")}
                    </Typography>

                    <BasicDateRangePicker
                      value={tempDateRange}
                      onChange={onTempDateRangeChange}
                      isDarkMode={isDarkMode}
                      startLabel={t("dateRange.startDate")}
                      endLabel={t("dateRange.endDate")}
                      language="he"
                      testMode={true}
                      t={t}
                    />
                  </Box>
                )}
              </Box>
            </Box>

            {/* Bottom Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                gap: "8px",
                padding: "16px",
                paddingTop: "8px",
                borderTop: `1px solid ${isDarkMode ? "#3a3a3a" : "#e5e7eb"}`,
                backgroundColor: isDarkMode ? "#2f2f2f" : "#ffffff",
              }}
            >
              <Button
                onClick={onReset}
                variant="text"
                size="small"
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  fontSize: "13px",
                  fontWeight: 500,
                  textTransform: "none",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  minWidth: "auto",
                  backgroundColor: "transparent",
                  border: "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                    color: isDarkMode ? "#d1d5db" : "#374151",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                  },
                }}
              >
                {t("dateRange.reset")}
              </Button>

              <Button
                onClick={onApply}
                variant="contained"
                size="small"
                sx={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  minWidth: "80px",
                  boxShadow: "0 1px 3px rgba(59, 130, 246, 0.2)",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#2563eb",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                  },
                  "&:active": {
                    transform: "translateY(0)",
                    backgroundColor: "#1d4ed8",
                  },
                }}
              >
                {t("dateRange.apply")}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>
  );
};

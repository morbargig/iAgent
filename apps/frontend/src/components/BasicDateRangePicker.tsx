import * as React from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,

  Alert,
} from "@mui/material";
import { DayPicker, DateRange } from "react-day-picker";
import {
  format,
  isAfter,
  parseISO,
  isValid,
  differenceInYears,
  differenceInMonths,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  addMinutes,
  addHours,
  addDays as addDaysToDate,
  addMonths,
  addYears,
} from "date-fns";
import { he, ar } from "date-fns/locale";
import 'react-day-picker/style.css'
import "./BasicDateRangePicker.css";

interface BasicDateRangePickerProps {
  value?: [Date | null, Date | null];
  onChange?: (value: [Date | null, Date | null]) => void;
  isDarkMode?: boolean;
  startLabel?: string;
  endLabel?: string;
  language?: "en" | "he" | "ar";
  timezone?: string;
  testMode?: boolean;
  t?: (key: string) => string; // Translation function
}

export default function BasicDateRangePicker({
  value,
  onChange,
  isDarkMode = false,
  startLabel = "Start Date & Time",
  endLabel = "End Date & Time",
  language = "en",
  timezone = "Asia/Jerusalem",
  t,
}: BasicDateRangePickerProps) {

  const [internalValue, setInternalValue] = React.useState<
    [Date | null, Date | null]
  >([null, null]);
  const [selectedRange, setSelectedRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );
  
  // New state for input values and debouncing
  const [inputValues, setInputValues] = React.useState<[string, string]>(["", ""]);
  const [isTyping, setIsTyping] = React.useState<[boolean, boolean]>([false, false]);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Refs for input elements to manage cursor position
  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);
  
  // State for hover range preview
  const [hoveredDay, setHoveredDay] = React.useState<Date | null>(null);

  // Use controlled value if provided, otherwise use internal state
  const currentValue = value || internalValue;

  // Calculate hover range for preview with proper start/middle/end detection
  const getPreviewRange = React.useCallback(() => {
    if (!hoveredDay || !currentValue[0] || currentValue[1]) {
      return undefined; // Only show preview when we have start date but no end date
    }
    
    const startDate = currentValue[0];
    const endDate = hoveredDay;
    
    // Ensure the range is in correct order
    const from = endDate < startDate ? endDate : startDate;
    const to = endDate < startDate ? startDate : endDate;
    
    return { from, to };
  }, [hoveredDay, currentValue]);

  // Create preview modifiers for start, middle, and end
  const previewRange = getPreviewRange();
  const previewModifiers = React.useMemo(() => {
    if (!previewRange) return {};
    
    return {
      preview_start: (date: Date) => {
        return previewRange.from && date.getTime() === previewRange.from.getTime();
      },
      preview_end: (date: Date) => {
        return previewRange.to && date.getTime() === previewRange.to.getTime();
      },
      preview_middle: (date: Date) => {
        if (!previewRange.from || !previewRange.to) return false;
        return date > previewRange.from && date < previewRange.to;
      }
    };
  }, [previewRange]);

  // Load from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem("dateRangePicker");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const startDate = parsed.start ? parseISO(parsed.start) : null;
        const endDate = parsed.end ? parseISO(parsed.end) : null;
        if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
          setInternalValue([startDate, endDate]);
          setSelectedRange({ from: startDate, to: endDate });
          // Update input values
          setInputValues([
            format(startDate, "dd/MM/yyyy HH:mm"),
            format(endDate, "dd/MM/yyyy HH:mm")
          ]);
        }
      } catch (error) {
        console.warn("Failed to load saved date range:", error);
      }
    }
  }, []);

  // Sync selectedRange with currentValue when it changes externally
  React.useEffect(() => {
    if (currentValue[0] && currentValue[1]) {
      setSelectedRange({ from: currentValue[0], to: currentValue[1] });
      // Update input values
      setInputValues([
        format(currentValue[0], "dd/MM/yyyy HH:mm"),
        format(currentValue[1], "dd/MM/yyyy HH:mm")
      ]);
    }
  }, [currentValue]);

  const getLocale = () => {
    switch (language) {
      case "he":
        return he;
      case "ar":
        return ar;
      default:
        return undefined;
    }
  };

  const isRTL = language === "he" || language === "ar";

  const validateDateRange = (startDate: Date, endDate: Date): string | null => {
    const now = new Date();

    if (isAfter(startDate, now)) {
      return t ? t('dateRange.errors.startDateFuture') : "Start date cannot be in the future";
    }

    if (isAfter(endDate, now)) {
      return t ? t('dateRange.errors.endDateFuture') : "End date cannot be in the future";
    }

    if (isAfter(startDate, endDate)) {
      return t ? t('dateRange.errors.startAfterEnd') : "Start date must be before end date";
    }

    return null;
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range) return;

    setSelectedRange(range);

    if (range.from && range.to) {
      // Set default times: start at 00:00, end at 23:59
      const startDate = new Date(range.from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(range.to);
      endDate.setHours(23, 59, 59, 999);

      // Validate the range
      const error = validateDateRange(startDate, endDate);
      setValidationError(error);

      if (!error) {
        const newValue: [Date | null, Date | null] = [startDate, endDate];
        handleChange(newValue);
        
        // Update input values
        setInputValues([
          format(startDate, "dd/MM/yyyy HH:mm"),
          format(endDate, "dd/MM/yyyy HH:mm")
        ]);
      }
    }
  };

  // Mouse event handlers for hover range preview
  const handleDayMouseEnter = (date: Date) => {
    // Only show preview when we have a start date but no end date
    if (currentValue[0] && !currentValue[1]) {
      setHoveredDay(date);
    }
  };

  const handleDayMouseLeave = () => {
    setHoveredDay(null);
  };

  // Enhanced date input change handler with debouncing
  const handleDateInputChange = (type: "start" | "end", value: string) => {
    const index = type === "start" ? 0 : 1;
    
    // Update input value immediately
    setInputValues(prev => {
      const newValues = [...prev] as [string, string];
      newValues[index] = value;
      return newValues;
    });
    
    // Set typing state
    setIsTyping(prev => {
      const newTyping = [...prev] as [boolean, boolean];
      newTyping[index] = true;
      return newTyping;
    });

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounced timeout
    debounceTimeoutRef.current = setTimeout(() => {
    try {
      // Parse date in dd/mm/yyyy hh:mm format
      const parseDate = (dateStr: string): Date | null => {
        // Handle dd/mm/yyyy hh:mm format
        const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
        if (match) {
          const [, day, month, year, hour, minute] = match;
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1, // Month is 0-indexed
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
          );
          return isValid(date) ? date : null;
        }
        
        // Fallback: try to parse as ISO string
          const parsedDate = new Date(value);
          return isValid(parsedDate) ? parsedDate : null;
        };

        const parsedDate = parseDate(value);
        if (parsedDate) {
          const newValue: [Date | null, Date | null] =
            type === "start"
              ? [parsedDate, currentValue[1]]
              : [currentValue[0], parsedDate];

          if (newValue[0] && newValue[1]) {
            const error = validateDateRange(newValue[0], newValue[1]);
            setValidationError(error);

            if (!error) {
              handleChange(newValue);
              setSelectedRange({ from: newValue[0], to: newValue[1] });
            }
          }
        }
        
        // Clear typing state
        setIsTyping(prev => {
          const newTyping = [...prev] as [boolean, boolean];
          newTyping[index] = false;
          return newTyping;
        });
      } catch (error) {
        console.warn("Invalid date input:", error);
        // Clear typing state on error
        setIsTyping(prev => {
          const newTyping = [...prev] as [boolean, boolean];
          newTyping[index] = false;
          return newTyping;
        });
      }
    }, 1000); // 1 second debounce
  };

  // Handle input blur - validate immediately
  const handleInputBlur = (type: "start" | "end") => {
    const index = type === "start" ? 0 : 1;
    const value = inputValues[index];
    
    // Clear typing state
    setIsTyping(prev => {
      const newTyping = [...prev] as [boolean, boolean];
      newTyping[index] = false;
      return newTyping;
    });

    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Validate immediately on blur
    try {
      const parseDate = (dateStr: string): Date | null => {
        const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
        if (match) {
          const [, day, month, year, hour, minute] = match;
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute)
          );
          return isValid(date) ? date : null;
        }
        
        const parsedDate = new Date(value);
        return isValid(parsedDate) ? parsedDate : null;
      };

      const parsedDate = parseDate(value);
      if (parsedDate) {
        const newValue: [Date | null, Date | null] =
          type === "start"
            ? [parsedDate, currentValue[1]]
            : [currentValue[0], parsedDate];

        if (newValue[0] && newValue[1]) {
          const error = validateDateRange(newValue[0], newValue[1]);
          setValidationError(error);

          if (!error) {
            handleChange(newValue);
            setSelectedRange({ from: newValue[0], to: newValue[1] });
          }
        }
      }
    } catch (error) {
      console.warn("Invalid date input on blur:", error);
    }
  };

  // Handle arrow key navigation with immediate validation and cursor position preservation
  const handleArrowKeyNavigation = (type: "start" | "end", direction: "up" | "down", field: "day" | "month" | "year" | "hour" | "minute", inputElement: HTMLInputElement) => {
    const index = type === "start" ? 0 : 1;
    const currentDate = currentValue[index];
    
    if (!currentDate) return;

    // Store current cursor position
    const cursorPosition = inputElement.selectionStart || 0;

    let newDate = new Date(currentDate);
    const increment = direction === "up" ? 1 : -1;

    switch (field) {
      case "day":
        newDate = addDaysToDate(newDate, increment);
        break;
      case "month":
        newDate = addMonths(newDate, increment);
        break;
      case "year":
        newDate = addYears(newDate, increment);
        break;
      case "hour":
        newDate = addHours(newDate, increment);
        break;
      case "minute":
        newDate = addMinutes(newDate, increment);
        break;
    }

    // Immediately validate and update
    const newValue: [Date | null, Date | null] =
      type === "start"
        ? [newDate, currentValue[1]]
        : [currentValue[0], newDate];

    if (newValue[0] && newValue[1]) {
      const error = validateDateRange(newValue[0], newValue[1]);
      setValidationError(error);

      if (!error) {
        handleChange(newValue);
        setSelectedRange({ from: newValue[0], to: newValue[1] });
        
        // Update input values
        const newFormattedValues: [string, string] = [
          format(newValue[0], "dd/MM/yyyy HH:mm"),
          format(newValue[1], "dd/MM/yyyy HH:mm")
        ];
        setInputValues(newFormattedValues);
        
        // Restore cursor position after state update
        requestAnimationFrame(() => {
          if (inputElement && document.activeElement === inputElement) {
            // Ensure cursor stays in the same field area, but adjust for potential format changes
            let newCursorPos = cursorPosition;
            
            // If we're in a specific field, ensure cursor stays in that field's range
            switch (field) {
              case "day":
                newCursorPos = Math.min(Math.max(cursorPosition, 0), 2);
                break;
              case "month":
                newCursorPos = Math.min(Math.max(cursorPosition, 3), 5);
                break;
              case "year":
                newCursorPos = Math.min(Math.max(cursorPosition, 6), 10);
                break;
              case "hour":
                newCursorPos = Math.min(Math.max(cursorPosition, 11), 13);
                break;
              case "minute":
                newCursorPos = Math.min(Math.max(cursorPosition, 14), 16);
                break;
            }
            
            // Ensure cursor position is within bounds
            newCursorPos = Math.min(newCursorPos, newFormattedValues[index].length);
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
          }
        });
      }
    }
  };

  // Handle key down events for arrow navigation
  const handleKeyDown = (type: "start" | "end", event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key, ctrlKey, shiftKey, altKey } = event;
    
    // Only handle arrow keys without modifiers
    if (ctrlKey || shiftKey || altKey) return;

    let field: "day" | "month" | "year" | "hour" | "minute" | null = null;
    let direction: "up" | "down" | null = null;

    if (key === "ArrowUp") {
      direction = "up";
    } else if (key === "ArrowDown") {
      direction = "down";
    }

    if (direction) {
      // Get the correct input element using refs
      const inputElement = type === "start" ? startInputRef.current : endInputRef.current;
      if (!inputElement) return;
      
      const cursorPos = inputElement.selectionStart || 0;
      
      // Improved logic to determine field based on cursor position
      // Format: dd/mm/yyyy hh:mm (16 characters total)
      if (cursorPos <= 2) field = "day";           // positions 0-2: day
      else if (cursorPos <= 5) field = "month";    // positions 3-5: month
      else if (cursorPos <= 10) field = "year";    // positions 6-10: year
      else if (cursorPos <= 13) field = "hour";    // positions 11-13: hour
      else if (cursorPos <= 16) field = "minute";  // positions 14-16: minute

      if (field && direction && inputElement) {
        event.preventDefault();
        handleArrowKeyNavigation(type, direction, field, inputElement);
      }
    }
  };

  const handleChange = (newValue: [Date | null, Date | null]) => {
    // Check if this is a clear action (both values are null)
    const isClearing = !newValue[0] && !newValue[1];

    if (isClearing) {
      // Clear localStorage when clearing
      try {
        localStorage.removeItem("dateRangePicker");
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }
    } else {
      // Save to localStorage when setting values
      try {
        localStorage.setItem(
          "dateRangePicker",
          JSON.stringify({
            start: newValue[0]?.toISOString() || null,
            end: newValue[1]?.toISOString() || null,
            updated: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.warn("Failed to save date range:", error);
      }
    }

    // Update internal state if not controlled
    if (!value) {
      setInternalValue(newValue);
    }

    // Call parent onChange if provided
    if (onChange) {
      onChange(newValue);
    }
  };

  // Clear both date pickers
  const handleClear = () => {
    setSelectedRange(undefined);
    setValidationError(null);
    setInputValues(["", ""]);
    setIsTyping([false, false]);
    handleChange([null, null]);
  };

  // Validation: end date cannot be in the future
  const getDisabledDays = () => {
    const today = new Date();
    return [
      { after: today }, // Disable future dates
    ];
  };

  // Calculate duration in a readable format
  const getDurationText = (startDate: Date, endDate: Date): string => {
    const years = differenceInYears(endDate, startDate);
    const months = differenceInMonths(endDate, startDate) % 12;
    const days = differenceInDays(endDate, startDate) % 30;
    const hours = differenceInHours(endDate, startDate) % 24;
    const minutes = differenceInMinutes(endDate, startDate) % 60;

    const parts = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}mo`);
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}min`);

    return parts.length > 0 ? parts.join(" ") : "0min";
  };

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#000000",
      borderRadius: "8px",
      transition: "all 0.2s ease-in-out",
      "& fieldset": {
        borderColor: isDarkMode ? "#555555" : "#d0d0d0",
      },
      "&:hover fieldset": {
        borderColor: isDarkMode ? "#777777" : "#aaaaaa",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#3b82f6",
        borderWidth: "2px",
      },
    },
    "& .MuiInputLabel-root": {
      color: isDarkMode ? "#cccccc" : "#666666",
      "&.Mui-focused": {
        color: "#3b82f6",
      },
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "360px", // More compact
        p: 1.5, // Reduced padding
        position: "relative", // For absolute positioning of X button
      }}
    >
      {/* Small X Clear Button - Top Right */}
      <Button
        onClick={handleClear}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          minWidth: "24px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
          border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`,
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          padding: 0,
          zIndex: 10,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: isDarkMode ? "#ef4444" : "#ef4444",
            borderColor: isDarkMode ? "#ef4444" : "#ef4444",
            color: "#ffffff",
            transform: "scale(1.1)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        }}
      >
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          ×
        </Typography>
      </Button>

      <Stack spacing={1.5}> {/* Reduced spacing */}
        {/* Date Picker - More Space */}
        <Box
          sx={{
            backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
            border: `1px solid ${isDarkMode ? "#444444" : "#e1e5e9"}`,
            borderRadius: "8px",
            p: 1, // Minimal padding to give more space to calendar
            display: "flex",
            justifyContent: "center",
            minHeight: "320px", // Ensure consistent height
          }}
        >
          <DayPicker
            mode="range"
            selected={selectedRange}
            onSelect={handleRangeSelect}
            disabled={getDisabledDays()}
            captionLayout="dropdown"
            dir={isRTL ? "rtl" : "ltr"}
            numberOfMonths={1}
            navLayout="around"
            reverseYears
            showOutsideDays
            locale={getLocale()}
            onDayMouseEnter={handleDayMouseEnter}
            onDayMouseLeave={handleDayMouseLeave}
            modifiers={previewModifiers}
            modifiersClassNames={{
              preview_start: 'rdp-day--preview_start',
              preview_middle: 'rdp-day--preview_middle', 
              preview_end: 'rdp-day--preview_end'
            }}
            data-theme={isDarkMode ? "dark" : "light"}
          />
        </Box>

        {/* Compact Date Input Fields */}
        <Stack spacing={1}> {/* Reduced spacing */}
          <TextField
            label={startLabel}
            type="text"
            value={inputValues[0]}
            onChange={(e) => handleDateInputChange("start", e.target.value)}
            onBlur={() => handleInputBlur("start")}
            onKeyDown={(e) => handleKeyDown("start", e)}
            size="small"
            placeholder="dd/mm/yyyy hh:mm"
            inputRef={startInputRef}
            sx={{
              ...textFieldStyles,
              "& input": { 
                fontSize: "13px",
                '&::-webkit-calendar-picker-indicator': {
                  display: 'none'
                }
              },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: "40px",
                // Show typing state with different border color
                ...(isTyping[0] && {
                  "& fieldset": {
                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    borderWidth: "2px",
                  }
                })
              },
            }}
          />

          <TextField
            label={endLabel}
            type="text"
            value={inputValues[1]}
            onChange={(e) => handleDateInputChange("end", e.target.value)}
            onBlur={() => handleInputBlur("end")}
            onKeyDown={(e) => handleKeyDown("end", e)}
            size="small"
            placeholder="dd/mm/yyyy hh:mm"
            inputRef={endInputRef}
            sx={{
              ...textFieldStyles,
              "& input": { 
                fontSize: "13px",
                '&::-webkit-calendar-picker-indicator': {
                  display: 'none'
                }
              },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: "40px",
                // Show typing state with different border color
                ...(isTyping[1] && {
                  "& fieldset": {
                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    borderWidth: "2px",
                  }
                })
              },
            }}
          />
        </Stack>

        {/* Compact Validation Error */}
        {validationError && (
          <Alert
            severity="error"
            sx={{
              borderRadius: "6px",
              fontSize: "11px", // Smaller font
              py: 0.5, // Reduced padding
              "& .MuiAlert-message": {
                color: isDarkMode ? "#fca5a5" : "#dc2626",
              },
            }}
          >
            {validationError}
          </Alert>
        )}

        {/* Compact Duration Display */}
        {currentValue[0] && currentValue[1] && (
          <Box
            sx={{
              p: 1, // Reduced padding
              borderRadius: "6px",
              backgroundColor: isDarkMode ? "#1e1e1e" : "#f8f9fa",
              border: `1px solid ${isDarkMode ? "#333333" : "#e9ecef"}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? "#cccccc" : "#666666",
                fontWeight: 600,
                display: "block",
                mb: 0.5, // Reduced margin
                fontSize: "11px", // Smaller font
              }}
            >
              Duration: {getDurationText(currentValue[0], currentValue[1])}
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

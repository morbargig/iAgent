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
  min as minDate,
  max as maxDate,
} from "date-fns";
import { he, ar } from "date-fns/locale";
import "react-day-picker/style.css";
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

  // The COMMITTED selection (what host cares about)
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(
    undefined
  );

  // Local preview state (hover-driven). Never leaves this component.
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    undefined
  );

  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // Text inputs + debounce
  const [inputValues, setInputValues] = React.useState<[string, string]>([
    "",
    "",
  ]);
  const [isTyping, setIsTyping] = React.useState<[boolean, boolean]>([
    false,
    false,
  ]);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Refs for cursor preservation
  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);

  // Controlled vs internal
  const currentValue = value || internalValue;

  // Load from localStorage on mount
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
          setInputValues([
            format(startDate, "dd/MM/yyyy HH:mm"),
            format(endDate, "dd/MM/yyyy HH:mm"),
          ]);
        }
      } catch (error) {
        console.warn("Failed to load saved date range:", error);
      }
    }
  }, []);

  // Sync in when parent value changes
  React.useEffect(() => {
    if (currentValue[0] && currentValue[1]) {
      setSelectedRange({ from: currentValue[0], to: currentValue[1] });
      setInputValues([
        format(currentValue[0], "dd/MM/yyyy HH:mm"),
        format(currentValue[1], "dd/MM/yyyy HH:mm"),
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

  // What we render: draft (hover) takes precedence while picking
  const displayRange: DateRange | undefined = draftRange ?? selectedRange;

  const validateDateRange = (startDate: Date, endDate: Date): string | null => {
    const now = new Date();

    if (isAfter(startDate, now)) {
      return t ? t("dateRange.errors.startDateFuture") : "Start date cannot be in the future";
    }

    if (isAfter(endDate, now)) {
      return t ? t("dateRange.errors.endDateFuture") : "End date cannot be in the future";
    }

    if (isAfter(startDate, endDate)) {
      return t ? t("dateRange.errors.startAfterEnd") : "Start date must be before end date";
    }

    return null;
  };

  // Commit on click only (no commits on hover)
  const handleSelectCommit = (range: DateRange | undefined) => {
    // Stop preview when user clicks
    setDraftRange(undefined);

    if (range?.from && range?.to) {
      // Normalize to full-day bounds
      const startDate = new Date(range.from);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(range.to);
      endDate.setHours(23, 59, 59, 999);

      const error = validateDateRange(startDate, endDate);
      setValidationError(error);

      if (!error) {
        const newValue: [Date | null, Date | null] = [startDate, endDate];
        // Update committed state
        setSelectedRange({ from: startDate, to: endDate });
        // Reflect to inputs/localStorage/parent
        handleChange(newValue);
        setInputValues([
          format(startDate, "dd/MM/yyyy HH:mm"),
          format(endDate, "dd/MM/yyyy HH:mm"),
        ]);
      }
    } else {
      // Starting a fresh selection
      if (range?.from && !range?.to) {
        setSelectedRange({ from: range.from, to: undefined });
      } else {
        setSelectedRange(undefined);
      }
    }
  };

  // Hover → update draft (only when picking second day)
  const handleDayMouseEnter = (day: Date) => {
    const from = selectedRange?.from;
    const to = selectedRange?.to;
    if (from && !to) {
      const start = minDate([from, day]);
      const end = maxDate([from, day]);
      setDraftRange({ from: start, to: end });
    }
  };

  // Stop preview when leaving the grid (still only in “choose end” phase)
  const handleDayMouseLeave = () => {
    const from = selectedRange?.from;
    const to = selectedRange?.to;
    if (from && !to) setDraftRange(undefined);
  };

  // --- Inputs logic (unchanged except where needed) ---
  const handleDateInputChange = (type: "start" | "end", value: string) => {
    const index = type === "start" ? 0 : 1;

    setInputValues((prev) => {
      const next = [...prev] as [string, string];
      next[index] = value;
      return next;
    });

    setIsTyping((prev) => {
      const next = [...prev] as [boolean, boolean];
      next[index] = true;
      return next;
    });

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    debounceTimeoutRef.current = setTimeout(() => {
      try {
        const parseDate = (dateStr: string): Date | null => {
          const match = dateStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/
          );
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

        setIsTyping((prev) => {
          const next = [...prev] as [boolean, boolean];
          next[index] = false;
          return next;
        });
      } catch (error) {
        console.warn("Invalid date input:", error);
        setIsTyping((prev) => {
          const next = [...prev] as [boolean, boolean];
          next[index] = false;
          return next;
        });
      }
    }, 1000);
  };

  const handleInputBlur = (type: "start" | "end") => {
    const index = type === "start" ? 0 : 1;
    const value = inputValues[index];

    setIsTyping((prev) => {
      const next = [...prev] as [boolean, boolean];
      next[index] = false;
      return next;
    });

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    try {
      const parseDate = (dateStr: string): Date | null => {
        const match = dateStr.match(
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/
        );
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

  const handleArrowKeyNavigation = (
    type: "start" | "end",
    direction: "up" | "down",
    field: "day" | "month" | "year" | "hour" | "minute",
    inputElement: HTMLInputElement
  ) => {
    const index = type === "start" ? 0 : 1;
    const currentDate = currentValue[index];
    if (!currentDate) return;

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

    const newValue: [Date | null, Date | null] =
      type === "start" ? [newDate, currentValue[1]] : [currentValue[0], newDate];

    if (newValue[0] && newValue[1]) {
      const error = validateDateRange(newValue[0], newValue[1]);
      setValidationError(error);

      if (!error) {
        handleChange(newValue);
        setSelectedRange({ from: newValue[0], to: newValue[1] });

        const newFormattedValues: [string, string] = [
          format(newValue[0], "dd/MM/yyyy HH:mm"),
          format(newValue[1], "dd/MM/yyyy HH:mm"),
        ];
        setInputValues(newFormattedValues);

        requestAnimationFrame(() => {
          if (inputElement && document.activeElement === inputElement) {
            let newCursorPos = cursorPosition;
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
            newCursorPos = Math.min(newCursorPos, newFormattedValues[index].length);
            inputElement.setSelectionRange(newCursorPos, newCursorPos);
          }
        });
      }
    }
  };

  const handleKeyDown = (
    type: "start" | "end",
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    const { key, ctrlKey, shiftKey, altKey } = event;
    if (ctrlKey || shiftKey || altKey) return;

    let field: "day" | "month" | "year" | "hour" | "minute" | null = null;
    let direction: "up" | "down" | null = null;

    if (key === "ArrowUp") direction = "up";
    else if (key === "ArrowDown") direction = "down";

    if (direction) {
      const inputElement =
        type === "start" ? startInputRef.current : endInputRef.current;
      if (!inputElement) return;

      const cursorPos = inputElement.selectionStart || 0;

      // dd/mm/yyyy hh:mm
      if (cursorPos <= 2) field = "day";
      else if (cursorPos <= 5) field = "month";
      else if (cursorPos <= 10) field = "year";
      else if (cursorPos <= 13) field = "hour";
      else if (cursorPos <= 16) field = "minute";

      if (field && direction && inputElement) {
        event.preventDefault();
        handleArrowKeyNavigation(type, direction, field, inputElement);
      }
    }
  };

  const handleChange = (newValue: [Date | null, Date | null]) => {
    const isClearing = !newValue[0] && !newValue[1];

    if (isClearing) {
      try {
        localStorage.removeItem("dateRangePicker");
      } catch (error) {
        console.warn("Failed to clear localStorage:", error);
      }
    } else {
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

    if (!value) setInternalValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleClear = () => {
    setSelectedRange(undefined);
    setDraftRange(undefined);
    setValidationError(null);
    setInputValues(["", ""]);
    setIsTyping([false, false]);
    handleChange([null, null]);
  };

  const getDisabledDays = () => {
    const today = new Date();
    return [{ after: today }];
  };

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
        maxWidth: "360px",
        p: 1.5,
        position: "relative",
      }}
    >
      {/* Small X Clear Button */}
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
            backgroundColor: "#ef4444",
            borderColor: "#ef4444",
            color: "#ffffff",
            transform: "scale(1.1)",
          },
          "&:active": { transform: "scale(0.95)" },
        }}
      >
        <Typography sx={{ fontSize: "14px", fontWeight: 600, lineHeight: 1 }}>
          ×
        </Typography>
      </Button>

      <Stack spacing={1.5}>
        {/* Calendar */}
        <Box
          sx={{
            backgroundColor: isDarkMode ? "#2d2d2d" : "#f8f9fa",
            border: `1px solid ${isDarkMode ? "#444444" : "#e1e5e9"}`,
            borderRadius: "8px",
            p: 1,
            display: "flex",
            justifyContent: "center",
            minHeight: "320px",
          }}
          onMouseLeave={handleDayMouseLeave}
        >
          <DayPicker
            mode="range"
            selected={displayRange}                // <- hover preview OR committed
            onSelect={handleSelectCommit}          // <- commit only on click
            onDayMouseEnter={handleDayMouseEnter}  // <- update preview while hovering
            disabled={getDisabledDays()}
            captionLayout="dropdown"
            dir={isRTL ? "rtl" : "ltr"}
            numberOfMonths={1}
            navLayout="around"
            reverseYears
            showOutsideDays
            locale={getLocale()}
            data-theme={isDarkMode ? "dark" : "light"}
          />
        </Box>

        {/* Inputs */}
        <Stack spacing={1}>
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
                "&::-webkit-calendar-picker-indicator": { display: "none" },
              },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: "40px",
                ...(isTyping[0] && {
                  "& fieldset": {
                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    borderWidth: "2px",
                  },
                }),
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
                "&::-webkit-calendar-picker-indicator": { display: "none" },
              },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: "40px",
                ...(isTyping[1] && {
                  "& fieldset": {
                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    borderWidth: "2px",
                  },
                }),
              },
            }}
          />
        </Stack>

        {/* Error */}
        {validationError && (
          <Alert
            severity="error"
            sx={{
              borderRadius: "6px",
              fontSize: "11px",
              py: 0.5,
              "& .MuiAlert-message": {
                color: isDarkMode ? "#fca5a5" : "#dc2626",
              },
            }}
          >
            {validationError}
          </Alert>
        )}

        {/* Duration */}
        {currentValue[0] && currentValue[1] && (
          <Box
            sx={{
              p: 1,
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
                mb: 0.5,
                fontSize: "11px",
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
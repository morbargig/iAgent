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
  t?: (key: string) => string;
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
  // Internal value fallback for uncontrolled usage
  const [internalValue, setInternalValue] = React.useState<[Date | null, Date | null]>([null, null]);

  // 1) committed range (what the host cares about; saved on click)
  const [committedRange, setCommittedRange] = React.useState<DateRange | undefined>(undefined);

  // 2) draft range (hover preview only while picking the second day)
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(undefined);

  // any form error
  const [validationError, setValidationError] = React.useState<string | null>(null);

  // inputs + debounce
  const [inputValues, setInputValues] = React.useState<[string, string]>(["", ""]);
  const [isTyping, setIsTyping] = React.useState<[boolean, boolean]>([false, false]);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // input refs for caret restoration
  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);

  // controlled fallback
  const currentValue = value || internalValue;

  // hydrate from localStorage once
  React.useEffect(() => {
    const saved = localStorage.getItem("dateRangePicker");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const startDate = parsed.start ? parseISO(parsed.start) : null;
        const endDate = parsed.end ? parseISO(parsed.end) : null;
        if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
          setInternalValue([startDate, endDate]);
          setCommittedRange({ from: startDate, to: endDate });
          setInputValues([
            format(startDate, "dd/MM/yyyy HH:mm"),
            format(endDate, "dd/MM/yyyy HH:mm"),
          ]);
        }
      } catch (e) {
        console.warn("Failed to load saved date range:", e);
      }
    }
  }, []);

  // sync in when parent value changes
  React.useEffect(() => {
    if (currentValue[0] && currentValue[1]) {
      setCommittedRange({ from: currentValue[0], to: currentValue[1] });
      setInputValues([
        format(currentValue[0], "dd/MM/yyyy HH:mm"),
        format(currentValue[1], "dd/MM/yyyy HH:mm"),
      ]);
    }
  }, [currentValue]);

  const getLocale = () => (language === "he" ? he : language === "ar" ? ar : undefined);
  const isRTL = language === "he" || language === "ar";

  // what we render: draft wins while choosing end; otherwise committed
  const displayRange: DateRange | undefined = draftRange ?? committedRange;

  const validateDateRange = (startDate: Date, endDate: Date): string | null => {
    const now = new Date();
    if (isAfter(startDate, now)) return t ? t("dateRange.errors.startDateFuture") : "Start date cannot be in the future";
    if (isAfter(endDate, now)) return t ? t("dateRange.errors.endDateFuture") : "End date cannot be in the future";
    if (isAfter(startDate, endDate)) return t ? t("dateRange.errors.startAfterEnd") : "Start date must be before end date";
    return null;
  };

  // Commit to real state ONLY on click
  const handleSelectCommit = (range: DateRange | undefined) => {
    // stop any preview upon click
    setDraftRange(undefined);

    if (range?.from && range?.to) {
      // normalize to full-day bounds
      const startDate = new Date(range.from);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(range.to);
      endDate.setHours(23, 59, 59, 999);

      const err = validateDateRange(startDate, endDate);
      setValidationError(err);
      if (!err) {
        const newValue: [Date | null, Date | null] = [startDate, endDate];

        // 1) update committed range (this is your "real state")
        setCommittedRange({ from: startDate, to: endDate });

        // 2) propagate to inputs / storage / parent
        handleChange(newValue);
        setInputValues([
          format(startDate, "dd/MM/yyyy HH:mm"),
          format(endDate, "dd/MM/yyyy HH:mm"),
        ]);
      }
    } else {
      // clicked a fresh start (DayPicker gives just "from")
      if (range?.from && !range?.to) {
        setCommittedRange({ from: range.from, to: undefined });
      } else {
        setCommittedRange(undefined);
      }
    }
  };

  // HOVER: update draft only when choosing the second day (from set, to empty)
  const handleDayMouseEnter = (day: Date) => {
    const from = committedRange?.from;
    const to = committedRange?.to;
    if (from && !to) {
      const start = minDate([from, day]);
      const end = maxDate([from, day]);
      setDraftRange({ from: start, to: end });
    }
  };

  // optional: clear preview when leaving the calendar area
  const handleCalendarMouseLeave = () => {
    const from = committedRange?.from;
    const to = committedRange?.to;
    if (from && !to) setDraftRange(undefined);
  };

  // ---------------- input handling (unchanged core) ----------------
  const handleDateInputChange = (type: "start" | "end", valueStr: string) => {
    const index = type === "start" ? 0 : 1;

    setInputValues((prev) => {
      const next = [...prev] as [string, string];
      next[index] = valueStr;
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
          const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
          if (m) {
            const [, d, mo, y, h, mi] = m;
            const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi));
            return isValid(dt) ? dt : null;
          }
          const parsed = new Date(valueStr);
          return isValid(parsed) ? parsed : null;
        };

        const parsedDate = parseDate(valueStr);
        if (parsedDate) {
          const newValue: [Date | null, Date | null] =
            type === "start" ? [parsedDate, currentValue[1]] : [currentValue[0], parsedDate];

          if (newValue[0] && newValue[1]) {
            const err = validateDateRange(newValue[0], newValue[1]);
            setValidationError(err);
            if (!err) {
              handleChange(newValue);
              setCommittedRange({ from: newValue[0], to: newValue[1] });
            }
          }
        }
        setIsTyping((prev) => {
          const next = [...prev] as [boolean, boolean];
          next[index] = false;
          return next;
        });
      } catch (e) {
        console.warn("Invalid date input:", e);
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
    const valueStr = inputValues[index];

    setIsTyping((prev) => {
      const next = [...prev] as [boolean, boolean];
      next[index] = false;
      return next;
    });

    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    try {
      const parseDate = (dateStr: string): Date | null => {
        const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/);
        if (m) {
          const [, d, mo, y, h, mi] = m;
          const dt = new Date(parseInt(y), parseInt(mo) - 1, parseInt(d), parseInt(h), parseInt(mi));
          return isValid(dt) ? dt : null;
        }
        const parsed = new Date(valueStr);
        return isValid(parsed) ? parsed : null;
      };

      const parsedDate = parseDate(valueStr);
      if (parsedDate) {
        const newValue: [Date | null, Date | null] =
          type === "start" ? [parsedDate, currentValue[1]] : [currentValue[0], parsedDate];

        if (newValue[0] && newValue[1]) {
          const err = validateDateRange(newValue[0], newValue[1]);
          setValidationError(err);
          if (!err) {
            handleChange(newValue);
            setCommittedRange({ from: newValue[0], to: newValue[1] });
          }
        }
      }
    } catch (e) {
      console.warn("Invalid date input on blur:", e);
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
    const inc = direction === "up" ? 1 : -1;
    switch (field) {
      case "day": newDate = addDaysToDate(newDate, inc); break;
      case "month": newDate = addMonths(newDate, inc); break;
      case "year": newDate = addYears(newDate, inc); break;
      case "hour": newDate = addHours(newDate, inc); break;
      case "minute": newDate = addMinutes(newDate, inc); break;
    }

    const newValue: [Date | null, Date | null] =
      type === "start" ? [newDate, currentValue[1]] : [currentValue[0], newDate];

    if (newValue[0] && newValue[1]) {
      const err = validateDateRange(newValue[0], newValue[1]);
      setValidationError(err);
      if (!err) {
        handleChange(newValue);
        setCommittedRange({ from: newValue[0], to: newValue[1] });
        const nextInputs: [string, string] = [
          format(newValue[0], "dd/MM/yyyy HH:mm"),
          format(newValue[1], "dd/MM/yyyy HH:mm"),
        ];
        setInputValues(nextInputs);

        requestAnimationFrame(() => {
          if (inputElement && document.activeElement === inputElement) {
            let newPos = cursorPosition;
            switch (field) {
              case "day": newPos = Math.min(Math.max(cursorPosition, 0), 2); break;
              case "month": newPos = Math.min(Math.max(cursorPosition, 3), 5); break;
              case "year": newPos = Math.min(Math.max(cursorPosition, 6), 10); break;
              case "hour": newPos = Math.min(Math.max(cursorPosition, 11), 13); break;
              case "minute": newPos = Math.min(Math.max(cursorPosition, 14), 16); break;
            }
            newPos = Math.min(newPos, nextInputs[index].length);
            inputElement.setSelectionRange(newPos, newPos);
          }
        });
      }
    }
  };

  const handleKeyDown = (type: "start" | "end", e: React.KeyboardEvent<HTMLDivElement>) => {
    const { key, ctrlKey, shiftKey, altKey } = e;
    if (ctrlKey || shiftKey || altKey) return;

    let field: "day" | "month" | "year" | "hour" | "minute" | null = null;
    let dir: "up" | "down" | null = null;

    if (key === "ArrowUp") dir = "up";
    else if (key === "ArrowDown") dir = "down";

    if (dir) {
      const input = type === "start" ? startInputRef.current : endInputRef.current;
      if (!input) return;
      const pos = input.selectionStart || 0;

      // dd/mm/yyyy hh:mm
      if (pos <= 2) field = "day";
      else if (pos <= 5) field = "month";
      else if (pos <= 10) field = "year";
      else if (pos <= 13) field = "hour";
      else if (pos <= 16) field = "minute";

      if (field) {
        e.preventDefault();
        handleArrowKeyNavigation(type, dir, field, input);
      }
    }
  };

  const handleChange = (newValue: [Date | null, Date | null]) => {
    const clearing = !newValue[0] && !newValue[1];

    if (clearing) {
      try { localStorage.removeItem("dateRangePicker"); } catch {
        console.error("Failed to remove date range picker from localStorage");
      }
    } else {
      try {
        localStorage.setItem("dateRangePicker", JSON.stringify({
          start: newValue[0]?.toISOString() || null,
          end: newValue[1]?.toISOString() || null,
          updated: new Date().toISOString(),
        }));
      } catch {
        console.error("Failed to set date range picker in localStorage");
      }
    }

    if (!value) setInternalValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleClear = () => {
    setCommittedRange(undefined);
    setDraftRange(undefined);
    setValidationError(null);
    setInputValues(["", ""]);
    setIsTyping([false, false]);
    handleChange([null, null]);
  };

  const getDisabledDays = () => [{ after: new Date() }];

  const getDurationText = (startDate: Date, endDate: Date): string => {
    const years = differenceInYears(endDate, startDate);
    const months = differenceInMonths(endDate, startDate) % 12;
    const days = differenceInDays(endDate, startDate) % 30;
    const hours = differenceInHours(endDate, startDate) % 24;
    const minutes = differenceInMinutes(endDate, startDate) % 60;
    const parts = [];
    if (years) parts.push(`${years}y`);
    if (months) parts.push(`${months}mo`);
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}min`);
    return parts.length ? parts.join(" ") : "0min";
  };

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
      color: isDarkMode ? "#ffffff" : "#000000",
      borderRadius: "8px",
      transition: "all 0.2s ease-in-out",
      "& fieldset": { borderColor: isDarkMode ? "#555555" : "#d0d0d0" },
      "&:hover fieldset": { borderColor: isDarkMode ? "#777777" : "#aaaaaa" },
      "&.Mui-focused fieldset": { borderColor: "#3b82f6", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": {
      color: isDarkMode ? "#cccccc" : "#666666",
      "&.Mui-focused": { color: "#3b82f6" },
    },
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "360px", p: 1.5, position: "relative" }}>
      {/* Clear */}
      <Button
        onClick={handleClear}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          minWidth: 24,
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
          border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`,
          color: isDarkMode ? "#9ca3af" : "#6b7280",
          p: 0,
          zIndex: 10,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "#ef4444",
            borderColor: "#ef4444",
            color: "#fff",
            transform: "scale(1.1)",
          },
          "&:active": { transform: "scale(0.95)" },
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>×</Typography>
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
            minHeight: 320,
          }}
          onMouseLeave={handleCalendarMouseLeave}
        >
          <DayPicker
            mode="range"
            selected={displayRange}                 // <- show draft OR committed
            onSelect={handleSelectCommit}           // <- commit only on click
            onDayMouseEnter={handleDayMouseEnter}   // <- live preview while picking
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
              "& input": { fontSize: 13, "&::-webkit-calendar-picker-indicator": { display: "none" } },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: 40,
                ...(isTyping[0] && { "& fieldset": { borderColor: isDarkMode ? "#60a5fa" : "#3b82f6", borderWidth: 2 } }),
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
              "& input": { fontSize: 13, "&::-webkit-calendar-picker-indicator": { display: "none" } },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: 40,
                ...(isTyping[1] && { "& fieldset": { borderColor: isDarkMode ? "#60a5fa" : "#3b82f6", borderWidth: 2 } }),
              },
            }}
          />
        </Stack>

        {/* Error */}
        {validationError && (
          <Alert
            severity="error"
            sx={{
              borderRadius: 1,
              fontSize: 11,
              py: 0.5,
              "& .MuiAlert-message": { color: isDarkMode ? "#fca5a5" : "#dc2626" },
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
              borderRadius: 1,
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
                fontSize: 11,
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
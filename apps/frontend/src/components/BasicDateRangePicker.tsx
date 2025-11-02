import * as React from "react";
import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
  Select,
  MenuItem,
  FormControl,
  IconButton,
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
  getMonth,
  getYear,
  setMonth,
  setYear,
} from "date-fns";
import { he, ar } from "date-fns/locale";
import "react-day-picker/style.css";
import "./BasicDateRangePicker.css";
import "./BasicDateRangePicker.rtl.css";
import { useTranslation } from "../contexts/TranslationContext";

interface BasicDateRangePickerProps {
  value?: [Date | null, Date | null];
  onChange?: (value: [Date | null, Date | null]) => void;
  isDarkMode?: boolean;
  startLabel?: string;
  endLabel?: string;
  language?: "en" | "he" | "ar";
  timezone?: string;
  testMode?: boolean;
  t?: (key: string, options?: { count?: number }) => string;
}

export default function BasicDateRangePicker({
  value,
  onChange,
  isDarkMode = false,
  startLabel,
  endLabel,
  language,
  timezone = "Asia/Jerusalem",
  t,
}: BasicDateRangePickerProps) {
  // Get current language from translation context if not provided
  const translationContext = useTranslation();
  const currentLanguage = language || translationContext.currentLang;

  // Use translation context's t function if prop is not provided
  const translationFunction = t || translationContext.t;

  // Use translations for labels if available, otherwise use defaults
  const defaultStartLabel = translationFunction
    ? translationFunction("dateRange.startDate")
    : "Start Date & Time";
  const defaultEndLabel = translationFunction
    ? translationFunction("dateRange.endDate")
    : "End Date & Time";
  const finalStartLabel = startLabel || defaultStartLabel;
  const finalEndLabel = endLabel || defaultEndLabel;
  // Internal value fallback for uncontrolled usage
  const [internalValue, setInternalValue] = React.useState<
    [Date | null, Date | null]
  >([null, null]);

  // 1) committed range (what the host cares about; saved on click)
  const [committedRange, setCommittedRange] = React.useState<
    DateRange | undefined
  >(undefined);

  // 2) draft range (actual selection being made)
  const [draftRange, setDraftRange] = React.useState<DateRange | undefined>(
    undefined
  );

  // 3) hover preview range (just for visual feedback, never committed)
  const [hoverPreviewRange, setHoverPreviewRange] = React.useState<
    DateRange | undefined
  >(undefined);

  // any form error
  const [validationError, setValidationError] = React.useState<string | null>(
    null
  );

  // inputs + debounce
  const [inputValues, setInputValues] = React.useState<[string, string]>([
    "",
    "",
  ]);
  const [isTyping, setIsTyping] = React.useState<[boolean, boolean]>([
    false,
    false,
  ]);
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // hover state tracking for enhanced styling
  const [hoveredDay, setHoveredDay] = React.useState<Date | null>(null);

  // input refs for caret restoration
  const startInputRef = React.useRef<HTMLInputElement>(null);
  const endInputRef = React.useRef<HTMLInputElement>(null);

  // controlled fallback
  const currentValue = value || internalValue;

  // Add state for custom navigation
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

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

  const getLocale = () =>
    currentLanguage === "he" ? he : currentLanguage === "ar" ? ar : undefined;
  const isRTL = currentLanguage === "he" || currentLanguage === "ar";

  // Helper function to get all days in a range for preview
  const getDaysInRange = (start: Date, end: Date): Date[] => {
    const days: Date[] = [];
    const current = new Date(start);
    const endDate = new Date(end);

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  // what we render: draft wins while choosing end; otherwise committed
  // hoverPreviewRange is NEVER used for display - only for visual feedback
  const displayRange: DateRange | undefined = draftRange ?? committedRange;

  // Debug logging for modifiers
  React.useEffect(() => {
    const hoveredRange =
      hoveredDay && committedRange?.from && !committedRange?.to
        ? getDaysInRange(committedRange.from, hoveredDay)
        : [];

    const previewRange =
      hoverPreviewRange?.from && hoverPreviewRange?.to
        ? getDaysInRange(hoverPreviewRange.from, hoverPreviewRange.to)
        : [];

    console.log("🔄 State update:", {
      hoveredDay: hoveredDay?.toDateString(),
      hoveredRange: hoveredRange.map((d) => d.toDateString()),
      previewRange: previewRange.map((d) => d.toDateString()),
      draftRange: draftRange
        ? {
            from: draftRange.from?.toDateString(),
            to: draftRange.to?.toDateString(),
          }
        : null,
      committedRange: committedRange
        ? {
            from: committedRange.from?.toDateString(),
            to: committedRange.to?.toDateString(),
          }
        : null,
      hoverPreviewRange: hoverPreviewRange
        ? {
            from: hoverPreviewRange.from?.toDateString(),
            to: hoverPreviewRange.to?.toDateString(),
          }
        : null,
    });

    // Log the actual modifiers being applied
    console.log("🎨 Modifiers being applied:", {
      hovered: hoveredDay ? [hoveredDay.toDateString()] : [],
      preview: previewRange.map((d) => d.toDateString()),
    });
  }, [hoveredDay, draftRange, committedRange, hoverPreviewRange]);

  const validateDateRange = (startDate: Date, endDate: Date): string | null => {
    const now = new Date();
    if (isAfter(startDate, now))
      return translationFunction
        ? translationFunction("dateRange.errors.startDateFuture")
        : "Start date cannot be in the future";
    if (isAfter(endDate, now))
      return translationFunction
        ? translationFunction("dateRange.errors.endDateFuture")
        : "End date cannot be in the future";
    if (isAfter(startDate, endDate))
      return translationFunction
        ? translationFunction("dateRange.errors.startAfterEnd")
        : "Start date must be before end date";
    return null;
  };

  // Helper function to ensure end time is valid when today is selected
  const ensureValidEndTime = (
    startDate: Date,
    endDate: Date,
    isStartToday: boolean,
    isEndToday: boolean
  ): Date => {
    const adjustedEndDate = new Date(endDate);

    if (isEndToday) {
      const now = new Date();
      adjustedEndDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

      // If both dates are today, ensure end time is after start time
      if (isStartToday) {
        const startTime = startDate.getTime();
        const endTime = adjustedEndDate.getTime();
        if (endTime <= startTime) {
          // Set end time to be at least 1 hour after start time
          adjustedEndDate.setTime(startTime + 60 * 60 * 1000);
        }
      }
    } else {
      adjustedEndDate.setHours(23, 59, 59, 999);
    }

    return adjustedEndDate;
  };

  // Commit to real state ONLY on click
  const handleSelectCommit = (range: DateRange | undefined) => {
    console.log(
      "🖱️ Selection clicked:",
      range
        ? {
            from: range.from?.toDateString(),
            to: range.to?.toDateString(),
          }
        : "undefined"
    );

    // Clear hover preview upon click
    setHoverPreviewRange(undefined);

    // Handle the actual selection
    if (range?.from && range?.to) {
      // Complete range selected - commit it with proper time handling
      console.log("🎯 Complete range selected - committing to committedRange");
      handleRangeCommit(range);
      setDraftRange(undefined);
    } else if (range?.from && !range?.to) {
      // Start date selected - set as draft range
      console.log("🎯 Start date selected - setting as draft range");
      setDraftRange({ from: range.from, to: undefined });
      setCommittedRange(undefined);
    } else {
      // No selection - clear everything
      console.log("🎯 No selection - clearing all ranges");
      setCommittedRange(undefined);
      setDraftRange(undefined);
    }

    if (range?.from && range?.to) {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if start date is today
      const isStartToday =
        range.from.getDate() === now.getDate() &&
        range.from.getMonth() === now.getMonth() &&
        range.from.getFullYear() === now.getFullYear();

      // Check if end date is today
      const isEndToday =
        range.to.getDate() === now.getDate() &&
        range.to.getMonth() === now.getMonth() &&
        range.to.getFullYear() === now.getFullYear();

      // Set start date - use current time if today, otherwise 00:00
      const startDate = new Date(range.from);
      if (isStartToday) {
        startDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
      }

      // Use helper function to ensure end time is valid
      const endDate = ensureValidEndTime(
        startDate,
        range.to,
        isStartToday,
        isEndToday
      );

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

  // Handle time validation and input updates when range is committed
  const handleRangeCommit = (range: DateRange) => {
    if (!range.from || !range.to) return;

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if start date is today
    const isStartToday =
      range.from.getDate() === now.getDate() &&
      range.from.getMonth() === now.getMonth() &&
      range.from.getFullYear() === now.getFullYear();

    // Check if end date is today
    const isEndToday =
      range.to.getDate() === now.getDate() &&
      range.to.getMonth() === now.getMonth() &&
      range.to.getFullYear() === now.getFullYear();

    // Set start date - use current time if today, otherwise 00:00
    const startDate = new Date(range.from);
    if (isStartToday) {
      startDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
    } else {
      startDate.setHours(0, 0, 0, 0);
    }

    // Use helper function to ensure end time is valid
    const endDate = ensureValidEndTime(
      startDate,
      range.to,
      isStartToday,
      isEndToday
    );

    const err = validateDateRange(startDate, endDate);
    setValidationError(err);
    if (!err) {
      const newValue: [Date | null, Date | null] = [startDate, endDate];

      // Update committed range with proper times
      setCommittedRange({ from: startDate, to: endDate });

      // Propagate to inputs / storage / parent
      handleChange(newValue);
      setInputValues([
        format(startDate, "dd/MM/yyyy HH:mm"),
        format(endDate, "dd/MM/yyyy HH:mm"),
      ]);
    }
  };

  // SIMPLIFIED HOVER: Show preview range in both directions
  const handleDayMouseEnter = (day: Date) => {
    const from = committedRange?.from;

    if (from) {
      // Create preview range: always from earlier to later date
      const start = new Date(Math.min(from.getTime(), day.getTime()));
      const end = new Date(Math.max(from.getTime(), day.getTime()));

      // Set times for preview (no validation needed)
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 0, 0);

      setHoverPreviewRange({ from: start, to: end });
    }

    setHoveredDay(day);
  };

  // SIMPLIFIED: Clear hover states
  const handleDayMouseLeave = () => {
    setHoveredDay(null);
    setHoverPreviewRange(undefined);
  };

  const handleCalendarMouseLeave = () => {
    setHoverPreviewRange(undefined);
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
          const m = dateStr.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/
          );
          if (m) {
            const [, d, mo, y, h, mi] = m;
            const dt = new Date(
              parseInt(y),
              parseInt(mo) - 1,
              parseInt(d),
              parseInt(h),
              parseInt(mi)
            );
            return isValid(dt) ? dt : null;
          }
          const parsed = new Date(valueStr);
          return isValid(parsed) ? parsed : null;
        };

        const parsedDate = parseDate(valueStr);
        if (parsedDate) {
          const newValue: [Date | null, Date | null] =
            type === "start"
              ? [parsedDate, currentValue[1]]
              : [currentValue[0], parsedDate];

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
        const m = dateStr.match(
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})$/
        );
        if (m) {
          const [, d, mo, y, h, mi] = m;
          const dt = new Date(
            parseInt(y),
            parseInt(mo) - 1,
            parseInt(d),
            parseInt(h),
            parseInt(mi)
          );
          return isValid(dt) ? dt : null;
        }
        const parsed = new Date(valueStr);
        return isValid(parsed) ? parsed : null;
      };

      const parsedDate = parseDate(valueStr);
      if (parsedDate) {
        const newValue: [Date | null, Date | null] =
          type === "start"
            ? [parsedDate, currentValue[1]]
            : [currentValue[0], parsedDate];

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
      case "day":
        newDate = addDaysToDate(newDate, inc);
        break;
      case "month":
        newDate = addMonths(newDate, inc);
        break;
      case "year":
        newDate = addYears(newDate, inc);
        break;
      case "hour":
        newDate = addHours(newDate, inc);
        break;
      case "minute":
        newDate = addMinutes(newDate, inc);
        break;
    }

    const newValue: [Date | null, Date | null] =
      type === "start"
        ? [newDate, currentValue[1]]
        : [currentValue[0], newDate];

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
              case "day":
                newPos = Math.min(Math.max(cursorPosition, 0), 2);
                break;
              case "month":
                newPos = Math.min(Math.max(cursorPosition, 3), 5);
                break;
              case "year":
                newPos = Math.min(Math.max(cursorPosition, 6), 10);
                break;
              case "hour":
                newPos = Math.min(Math.max(cursorPosition, 11), 13);
                break;
              case "minute":
                newPos = Math.min(Math.max(cursorPosition, 14), 16);
                break;
            }
            newPos = Math.min(newPos, nextInputs[index].length);
            inputElement.setSelectionRange(newPos, newPos);
          }
        });
      }
    }
  };

  const handleKeyDown = (
    type: "start" | "end",
    e: React.KeyboardEvent<HTMLDivElement>
  ) => {
    const { key, ctrlKey, shiftKey, altKey } = e;
    if (ctrlKey || shiftKey || altKey) return;

    let field: "day" | "month" | "year" | "hour" | "minute" | null = null;
    let dir: "up" | "down" | null = null;

    if (key === "ArrowUp") dir = "up";
    else if (key === "ArrowDown") dir = "down";

    if (dir) {
      const input =
        type === "start" ? startInputRef.current : endInputRef.current;
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
      try {
        localStorage.removeItem("dateRangePicker");
      } catch {
        console.error("Failed to remove date range picker from localStorage");
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

  const getDisabledDays = () => {
    // Allow today but disable future dates
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    return [{ after: today }];
  };

  const getDurationText = (startDate: Date, endDate: Date): string => {
    const years = differenceInYears(endDate, startDate);
    const months = differenceInMonths(endDate, startDate) % 12;
    const days = differenceInDays(endDate, startDate) % 30;
    const hours = differenceInHours(endDate, startDate) % 24;
    const minutes = differenceInMinutes(endDate, startDate) % 60;

    if (translationFunction) {
      // Use translation function if available
      const parts = [];
      if (years)
        parts.push(
          translationFunction("dateRange.duration.years", { count: years })
        );
      if (months)
        parts.push(
          translationFunction("dateRange.duration.months", { count: months })
        );
      if (days)
        parts.push(
          translationFunction("dateRange.duration.days", { count: days })
        );
      if (hours)
        parts.push(
          translationFunction("dateRange.duration.hours", { count: hours })
        );
      if (minutes)
        parts.push(
          translationFunction("dateRange.duration.minutes", { count: minutes })
        );
      return parts.length
        ? parts.join(" ")
        : translationFunction("dateRange.duration.zero");
    }

    // Fallback to English
    const parts = [];
    if (years) parts.push(`${years}y`);
    if (months) parts.push(`${months}mo`);
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}min`);
    return parts.length ? parts.join(" ") : "0min";
  };

  // Custom month and year navigation handlers
  const handleMonthChange = (monthIndex: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(monthIndex);
    setCurrentMonth(newMonth);
  };

  const handleYearChange = (year: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(year);
    setCurrentMonth(newMonth);
  };

  const handlePreviousMonth = () => {
    const newMonth = addMonths(currentMonth, -1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    setCurrentMonth(newMonth);
  };

  // Generate month options using translation service
  const getMonthOptions = () => {
    const months = [];
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    for (let i = 0; i < 12; i++) {
      months.push({
        value: i,
        label: translationFunction
          ? translationFunction(`dateRange.monthNames.${monthNames[i]}`)
          : monthNames[i],
      });
    }
    return months;
  };

  // Generate year options (current year - 100 to current year)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 100; i <= currentYear; i++) {
      years.push({ value: i, label: i.toString() });
    }
    return years;
  };

  // Memoize month options to update when language changes
  const monthOptions = React.useMemo(
    () => getMonthOptions(),
    [currentLanguage, translationFunction]
  );
  const yearOptions = React.useMemo(() => getYearOptions(), []);

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
      color: isDarkMode ? "#ffffff" : "#1a1a1a",
      borderRadius: "8px",
      transition: "all 0.2s ease-in-out",
      "& fieldset": { borderColor: isDarkMode ? "#666666" : "#cccccc" },
      "&:hover fieldset": { borderColor: isDarkMode ? "#888888" : "#999999" },
      "&.Mui-focused fieldset": { borderColor: "#3b82f6", borderWidth: "2px" },
    },
    "& .MuiInputLabel-root": {
      color: isDarkMode ? "#cccccc" : "#666666",
      "&.Mui-focused": { color: "#3b82f6" },
      // RTL label positioning handled by CSS classes
    },
  };

  const selectStyles = {
    "& .MuiOutlinedInput-root": {
      backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
      color: isDarkMode ? "#ffffff" : "#1a1a1a",
      borderRadius: "8px",
      transition: "all 0.2s ease-in-out",
      height: "36px",
      "& fieldset": { borderColor: isDarkMode ? "#666666" : "#cccccc" },
      "&:hover fieldset": { borderColor: isDarkMode ? "#888888" : "#999999" },
      "&.Mui-focused fieldset": { borderColor: "#3b82f6", borderWidth: "2px" },
    },
    "& .MuiSelect-select": {
      padding: "8px 12px",
      fontSize: "14px",
      fontWeight: 500,
    },
    "& .MuiSelect-icon": {
      color: isDarkMode ? "#cccccc" : "#666666",
      ...(isRTL && { transform: "scaleX(-1)" }),
    },
  };

  const iconButtonStyles = {
    color: isDarkMode ? "#cccccc" : "#666666",
    backgroundColor: isDarkMode ? "#404040" : "#f8f9fa",
    border: `1px solid ${isDarkMode ? "#666666" : "#cccccc"}`,
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: isDarkMode ? "#505050" : "#e9ecef",
      borderColor: isDarkMode ? "#888888" : "#999999",
      transform: "translateY(-1px)",
    },
    "&:active": {
      transform: "translateY(0)",
    },
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "360px",
        p: 2,
        position: "relative",
        // RTL-aware margins
        ml: isRTL ? 0 : 0,
        mr: isRTL ? 0 : 0,
        // Ensure proper RTL layout
        display: "flex",
        flexDirection: "column",
        alignItems: isRTL ? "flex-end" : "flex-start",
      }}
    >
      {/* Clear */}
      <Button
        onClick={handleClear}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          [isRTL ? "left" : "right"]: 8,
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
        <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1 }}>
          ×
        </Typography>
      </Button>

      <Stack spacing={1.5}>
        {/* Custom Navigation and Calendar in One Box */}
        <Box
          sx={{
            backgroundColor: "transparent",
            borderRadius: "8px",
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            position: "relative",
          }}
          className="custom-navigation"
        >
          {/* Navigation Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "relative",
              pb: 0.5,
            }}
          >
            {/* Previous Month Arrow */}
            <IconButton
              onClick={handlePreviousMonth}
              sx={{
                position: "absolute",
                [isRTL ? "right" : "left"]: 0,
                color: "#3b82f6",
                backgroundColor: "transparent",
                border: "none",
                width: "28px",
                height: "28px",
                minWidth: "28px",
                minHeight: "28px",
                "&:hover": {
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  transform: "scale(1.05)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
              size="small"
              className="custom-nav-button"
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "#3b82f6",
                }}
              >
                {isRTL ? "›" : "‹"}
              </Typography>
            </IconButton>

            {/* Center Month/Year Dropdowns */}
            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: isRTL ? "row-reverse" : "row",
              }}
            >
              <FormControl
                size="small"
                sx={{ minWidth: 120 }}
                className="custom-select"
              >
                <Select
                  value={getMonth(currentMonth)}
                  onChange={(e) => handleMonthChange(e.target.value as number)}
                  id="month-select"
                  className="month-select-dropdown"
                  sx={{
                    backgroundColor: "transparent",
                    color: isDarkMode ? "#f9fafb" : "#111827",
                    border: "none",
                    "& .MuiSelect-select": {
                      fontWeight: 600,
                      fontSize: "14px",
                      textAlign: "center",
                      padding: "6px 12px",
                    },
                    "& .MuiSelect-icon": {
                      color: "#3b82f6",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.05)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: isDarkMode
                          ? "0 10px 25px rgba(0, 0, 0, 0.5)"
                          : "0 10px 25px rgba(0, 0, 0, 0.1)",
                        "& .MuiMenuItem-root": {
                          color: isDarkMode ? "#f9fafb" : "#111827",
                          fontSize: "14px",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "#3b82f6",
                            color: "#ffffff",
                          },
                        },
                      },
                    },
                  }}
                >
                  {monthOptions.map((month) => (
                    <MenuItem key={month.value} value={month.value}>
                      {month.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                size="small"
                sx={{ minWidth: 80 }}
                className="custom-select"
              >
                <Select
                  value={getYear(currentMonth)}
                  onChange={(e) => handleYearChange(e.target.value as number)}
                  className="year-select-dropdown"
                  sx={{
                    backgroundColor: "transparent",
                    color: isDarkMode ? "#f9fafb" : "#111827",
                    border: "none",
                    "& .MuiSelect-select": {
                      fontWeight: 600,
                      fontSize: "14px",
                      textAlign: "center",
                      padding: "6px 12px",
                    },
                    "& .MuiSelect-icon": {
                      color: "#3b82f6",
                    },
                    "&:hover": {
                      backgroundColor: "rgba(59, 130, 246, 0.05)",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: isDarkMode
                          ? "0 10px 25px rgba(0, 0, 0, 0.5)"
                          : "0 10px 25px rgba(0, 0, 0, 0.1)",
                        "& .MuiMenuItem-root": {
                          color: isDarkMode ? "#f9fafb" : "#111827",
                          fontSize: "14px",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "#374151" : "#f3f4f6",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "#3b82f6",
                            color: "#ffffff",
                          },
                        },
                      },
                    },
                  }}
                >
                  {yearOptions.map((year) => (
                    <MenuItem key={year.value} value={year.value}>
                      {year.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Next Month Arrow */}
            <IconButton
              onClick={handleNextMonth}
              sx={{
                position: "absolute",
                [isRTL ? "left" : "right"]: 0,
                color: "#3b82f6",
                backgroundColor: "transparent",
                border: "none",
                width: "28px",
                height: "28px",
                minWidth: "28px",
                minHeight: "28px",
                "&:hover": {
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  transform: "scale(1.05)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
              size="small"
              className="custom-nav-button"
            >
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: "#3b82f6",
                }}
              >
                {isRTL ? "‹" : "›"}
              </Typography>
            </IconButton>
          </Box>

          {/* Calendar */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              minHeight: 300,
              direction: isRTL ? "rtl" : "ltr",
              textAlign: isRTL ? "right" : "left",
              width: "100%",
              ...(isRTL && {
                mr: 0,
                ml: 0,
              }),
              ...(!isRTL && {
                ml: 0,
                mr: 0,
              }),
            }}
            onMouseLeave={handleCalendarMouseLeave}
          >
            <DayPicker
              key={`${language}-${isRTL}`} // Force re-render when language or RTL changes
              mode="range"
              selected={displayRange} // <- show draft OR committed
              onSelect={handleSelectCommit} // <- commit only on click
              onDayMouseEnter={handleDayMouseEnter} // <- live preview while picking
              onDayMouseLeave={handleDayMouseLeave} // <- clear hover state
              disabled={getDisabledDays()}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              showOutsideDays
              locale={getLocale()}
              data-theme={isDarkMode ? "dark" : "light"}
              weekStartsOn={isRTL ? 0 : 1} // Sunday for RTL, Monday for LTR
              fixedWeeks
              showWeekNumber={false}
              // Enhanced styling with modifiers
              className={`${isRTL ? "rtl-calendar" : "ltr-calendar"} enhanced-calendar`}
              modifiers={{
                hovered: hoveredDay ? [hoveredDay] : [],
                preview:
                  hoverPreviewRange?.from && hoverPreviewRange?.to
                    ? getDaysInRange(
                        hoverPreviewRange.from,
                        hoverPreviewRange.to
                      )
                    : [],
                // Add modifier for outside days to ensure proper styling
                outside: (day) => {
                  const currentMonthStart = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth(),
                    1
                  );
                  const currentMonthEnd = new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1,
                    0
                  );
                  return day < currentMonthStart || day > currentMonthEnd;
                },
              }}
              modifiersStyles={{
                hovered: {
                  backgroundColor: isDarkMode
                    ? "rgba(99, 102, 241, 0.2)"
                    : "rgba(99, 102, 241, 0.1)",
                  transition: "background-color 0.15s ease",
                  borderRadius: "50%",
                  zIndex: 10,
                },

                preview: {
                  backgroundColor: isDarkMode
                    ? "rgba(99, 102, 241, 0.15)"
                    : "rgba(99, 102, 241, 0.08)",
                  color: isDarkMode ? "#f9fafb" : "#111827",
                  transition: "background-color 0.15s ease",
                },

                // Style for outside days to ensure they're muted
                outside: {
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  opacity: 0.5,
                },
              }}
            />
          </Box>
        </Box>

        {/* Inputs */}
        <Stack spacing={1} className={isRTL ? "rtl-inputs" : "ltr-inputs"}>
          <TextField
            label={finalStartLabel}
            type="text"
            value={inputValues[0]}
            onChange={(e) => handleDateInputChange("start", e.target.value)}
            onBlur={() => handleInputBlur("start")}
            onKeyDown={(e) => handleKeyDown("start", e)}
            size="small"
            placeholder={isRTL ? "hh:mm yyyy/mm/dd" : "dd/mm/yyyy hh:mm"}
            inputRef={startInputRef}
            inputProps={{}}
            sx={{
              ...textFieldStyles,
              "& input": {
                fontSize: 13,
                "&::-webkit-calendar-picker-indicator": { display: "none" },
              },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: 40,
                ...(isTyping[0] && {
                  "& fieldset": {
                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    borderWidth: 2,
                  },
                }),
              },
              // RTL label support - handled by CSS classes
            }}
          />

          <TextField
            label={finalEndLabel}
            type="text"
            value={inputValues[1]}
            onChange={(e) => handleDateInputChange("end", e.target.value)}
            onBlur={() => handleInputBlur("end")}
            onKeyDown={(e) => handleKeyDown("end", e)}
            size="small"
            placeholder={isRTL ? "hh:mm yyyy/mm/dd" : "dd/mm/yyyy hh:mm"}
            inputRef={endInputRef}
            inputProps={{}}
            sx={{
              ...textFieldStyles,
              "& input": {
                fontSize: 13,
                "&::-webkit-calendar-picker-indicator": { display: "none" },
              },
              "& .MuiOutlinedInput-root": {
                ...textFieldStyles["& .MuiOutlinedInput-root"],
                height: 40,
                ...(isTyping[1] && {
                  "& fieldset": {
                    borderColor: isDarkMode ? "#60a5fa" : "#3b82f6",
                    borderWidth: 2,
                  },
                }),
                // RTL input field alignment - handled by CSS classes
              },
              // RTL label support - handled by CSS classes
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
              "& .MuiAlert-message": {
                color: isDarkMode ? "#fca5a5" : "#dc2626",
              },
            }}
          >
            {validationError}
          </Alert>
        )}

        {/* Duration */}
        {/* TODO: Add duration back in once we find space for it  */}
        {/* {currentValue[0] && currentValue[1] && (
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
              {translationFunction
                ? translationFunction("dateRange.duration.label")
                : "Duration"}
              : {getDurationText(currentValue[0], currentValue[1])}
            </Typography>
          </Box>
        )} */}
      </Stack>
    </Box>
  );
}

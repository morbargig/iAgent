import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Box,
  IconButton,
  Typography,
  TextField,
  Button,
  Tooltip,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Chip,
  Alert,
  Snackbar,
  LinearProgress,
  CircularProgress,
} from "@mui/material";
import { parseISO } from "date-fns";
import {
  Stop as StopIcon,
  Settings as SettingsIcon,
  CalendarMonth as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Mic as MicIcon,
  Clear as ClearIcon,
  AttachFile as AttachFileIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Edit as EditIcon,
  PlayArrow as PickIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  Code as CodeIcon,
  Description as DocumentIcon,
} from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";
import { Translate } from "./Translate";
import { FilterNameDialog } from "./FilterNameDialog";
import { FilterDetailsDialog } from "./FilterDetailsDialog";
import { FilterPreview } from "./FilterPreview";
import { useAnimatedPlaceholder } from "../hooks/useAnimatedPlaceholder";
import { useToolToggles } from "../hooks/useToolToggles";
import { ToolSettingsDialog, ToolConfiguration } from "./ToolSettingsDialog";
import { useToolSchemas } from "../services/toolService";
import {
  validateFile,
  validateFiles,
  getFileIconColor,
} from "../services/fileService";
import {
  FILE_UPLOAD_CONFIG,
  formatFileSize,
  getFileCategory,
} from "../config/fileUpload";

import BasicDateRangePicker from "./BasicDateRangePicker";

// Helper function to detect text direction
const detectLanguage = (text: string): "ltr" | "rtl" => {
  if (!text) return "ltr";

  // Hebrew and Arabic character ranges
  const rtlRegex =
    /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

  return rtlRegex.test(text) ? "rtl" : "ltr";
};

export interface DateFilter {
  type: "custom" | "picker";
  customRange?: {
    amount: number;
    type: string;
  };
  dateRange?: [Date | null, Date | null];
}

export interface SendMessageData {
  content: string;
  dateFilter: DateFilter;
  selectedCountries: string[];
  enabledTools: string[];
  files?: File[];
  filterSnapshot?: {
    filterId?: string;
    name?: string;
    config: {
      dateFilter: {
        type: "custom" | "picker";
        customRange?: {
          amount: number;
          type: string;
        };
        dateRange?: {
          start?: string;
          end?: string;
        };
      };
      selectedCountries: string[];
      enabledTools: string[];
      toolConfigurations: Record<string, any>;
    };
    isActive?: boolean;
    createdAt?: string;
  };
}

interface ChatFilter {
  filterId: string;
  name: string;
  config: Record<string, any>;
  isActive?: boolean;
  createdAt: string;
}

interface InputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (data: SendMessageData) => void;
  onStop?: () => void;
  onDiscard?: () => void;
  disabled: boolean;
  isLoading?: boolean;
  isDarkMode: boolean;
  isEditing?: boolean;
  sidebarOpen?: boolean; // Add sidebar state
  sidebarRef?: React.RefObject<HTMLDivElement | null>; // Add sidebar ref for timing
  sidebarWidth?: number; // Dynamic sidebar width
  reportPanelOpen?: boolean; // report panel state
  reportPanelWidth?: number; // Dynamic report panel width
  onHeightChange?: (height: number) => void; // Callback for height changes
  // Control buttons
  onVoiceInput?: () => void; // Voice input callback
  onClear?: () => void; // Clear input callback
  onAttachment?: () => void; // File attachment callback
  showVoiceButton?: boolean; // Show voice button
  showClearButton?: boolean; // Show clear button
  showAttachmentButton?: boolean; // Show attachment button
  // Filter management
  currentChatId?: string; // Current chat ID for filter management
  authToken?: string; // Auth token for API calls
}

// ChatGPT-style Input Area - Matches official ChatGPT design

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

// Tools list data
const toolsList = [
  { id: "tool-x", nameKey: "tools.tool-x" },
  { id: "tool-y", nameKey: "tools.tool-y" },
  { id: "tool-z", nameKey: "tools.tool-z" },
];

// Time range options
const timeRangeOptions = [
  { value: "minutes", labelKey: "dateRange.minutes" },
  { value: "hours", labelKey: "dateRange.hours" },
  { value: "days", labelKey: "dateRange.days" },
  { value: "weeks", labelKey: "dateRange.weeks" },
  { value: "months", labelKey: "dateRange.months" },
  { value: "years", labelKey: "dateRange.years" },
];

export function InputArea({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  isLoading = false,
  isDarkMode,
  sidebarOpen = false,
  sidebarRef,
  sidebarWidth = 250,
  reportPanelOpen = false,
  reportPanelWidth = 350,
  onHeightChange,
  // Control buttons
  onVoiceInput,
  onClear,
  onAttachment,
  showVoiceButton = false,
  showClearButton = true,
  showAttachmentButton = true, // Enable attachment button by default
  // Filter management
  currentChatId,
  authToken,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFocused, setIsFocused] = useState(false);
  const translationContext = useTranslation();
  const { t } = translationContext;

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showFileError, setShowFileError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isUploading, setIsUploading] = useState(false);

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

  // Date range state with single localStorage key
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

  // Tool toggles hook
  // Tool toggles and configurations
  const {
    enabledTools,
    toggleTool,
    toolConfigurations,
    setToolConfiguration,
    setToolEnabled,
    hasUnconfiguredTools,
  } = useToolToggles();

  // Tool schemas and settings dialog
  const { toolSchemas, loading: toolSchemasLoading } = useToolSchemas();
  const [toolSettingsOpen, setToolSettingsOpen] = useState(false);
  const [settingsHintRing, setSettingsHintRing] = useState(false);

  // Filter management state
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

  // Save all date range settings to single localStorage key with debouncing - Fixed to prevent infinite loops
  useEffect(() => {
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
            startDate: dateRange[0] ? dateRange[0].toISOString() : null,
            endDate: dateRange[1] ? dateRange[1].toISOString() : null,
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
    dateRange[0]?.toISOString(),
    dateRange[1]?.toISOString(),
  ]); // Use ISO strings to prevent dayjs object comparison issues

  // Animated placeholder - get examples from translation (fixed to prevent infinite loops)
  const examples = React.useMemo(() => {
    try {
      // Access the current translations directly
      const currentTranslations = (translationContext as any).translations?.[
        translationContext.currentLang
      ];
      const examples = currentTranslations?.input?.examples;

      // Debug logging
      // console.log('🔍 Animation Debug:', {
      //   currentLang: translationContext.currentLang,
      //   hasTranslations: !!currentTranslations,
      //   hasExamples: !!examples,
      //   examplesLength: examples?.length || 0,
      //   firstExample: examples?.[0]
      // });

      // If no examples from translations, use fallback for testing
      if (!examples || !Array.isArray(examples) || examples.length === 0) {
        // console.log('⚠️ No examples found, using fallback');
        return [
          "What can you help me with?",
          "Explain quantum computing simply",
          "Write a creative short story",
          "Help me debug this code",
        ];
      }

      return examples;
    } catch (error) {
      console.error("❌ Error loading examples:", error);
      // Return fallback examples if there's an error
      return [
        "What can you help me with?",
        "Explain quantum computing simply",
        "Write a creative short story",
      ];
    }
  }, [translationContext.currentLang, translationContext.translations]); // Include both dependencies

  // Animated placeholder with optimized hook to prevent infinite loops
  const animatedPlaceholder = useAnimatedPlaceholder({
    examples,
    typingSpeed: 150, // Slower for easier debugging
    pauseDuration: 1500, // Shorter pause for faster testing
    deletingSpeed: 75,
    isActive: !value.trim() && examples.length > 0, // Show animation when input is empty and examples exist
  });

  // Debug the animated placeholder
  // React.useEffect(() => {
  //   console.log('🎬 Animated Placeholder Debug:', {
  //     examples: examples,
  //     examplesLength: examples.length,
  //     isActive: !value.trim() && examples.length > 0,
  //     animatedPlaceholder: animatedPlaceholder,
  //     value: value,
  //     valueLength: value.length
  //   });
  // }, [examples, animatedPlaceholder, value]);

  // Show debug info in placeholder for testing
  const debugPlaceholder = animatedPlaceholder ?? "";

  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  // Stable callback for height measurement - use ref to avoid dependency issues
  const onHeightChangeRef = useRef(onHeightChange);
  onHeightChangeRef.current = onHeightChange;

  // Calculate the effective sidebar and report panel widths for positioning
  const effectiveSidebarWidth = sidebarOpen ? sidebarWidth : 0;
  const effectiveReportPanelWidth = reportPanelOpen ? reportPanelWidth : 0;

  // Auto-resize textarea - simplified to prevent infinite loops
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;

      // Measure height after resize
      if (inputContainerRef.current && onHeightChangeRef.current) {
        const height = inputContainerRef.current.offsetHeight;
        onHeightChangeRef.current(height);
      }
    }
  }, [value]);

  // Measure input area height on window resize
  useEffect(() => {
    const handleResize = () => {
      if (inputContainerRef.current && onHeightChangeRef.current) {
        const height = inputContainerRef.current.offsetHeight;
        onHeightChangeRef.current(height);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validation = validateFiles(fileArray, selectedFiles);

    if (!validation.valid) {
      setFileError(validation.error || "File validation failed");
      setShowFileError(true);
      return;
    }

    setSelectedFiles([...selectedFiles, ...fileArray]);
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validation = validateFiles(fileArray, selectedFiles);

    if (!validation.valid) {
      setFileError(validation.error || "File validation failed");
      setShowFileError(true);
      return;
    }

    setSelectedFiles([...selectedFiles, ...fileArray]);
  };

  const getFileIcon = (mimeType: string) => {
    const category = getFileCategory(mimeType);
    const color = getFileIconColor(mimeType, isDarkMode);

    switch (category) {
      case "image":
        return <ImageIcon sx={{ fontSize: 18, color }} />;
      case "pdf":
        return <PdfIcon sx={{ fontSize: 18, color }} />;
      case "archive":
        return <ArchiveIcon sx={{ fontSize: 18, color }} />;
      case "code":
        return <CodeIcon sx={{ fontSize: 18, color }} />;
      case "document":
        return <DocumentIcon sx={{ fontSize: 18, color }} />;
      default:
        return <FileIcon sx={{ fontSize: 18, color }} />;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      // If tools need configuration, open settings dialog
      if (needsToolConfiguration && value.trim()) {
        setToolSettingsOpen(true);
        return;
      }

      if (
        (value.trim() || selectedFiles.length > 0) &&
        !disabled &&
        !isLoading
      ) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (isLoading && onStop) {
      onStop();
    } else if ((value.trim() || selectedFiles.length > 0) && !disabled) {
      // Check if there are unconfigured tools before submitting
      if (needsToolConfiguration) {
        // Open settings dialog instead of submitting
        setToolSettingsOpen(true);
        return;
      }

      // Prepare date filter data with proper serialization
      const dateFilter: DateFilter = {
        type: committedTab === 1 ? "picker" : "custom",
        customRange:
          committedTab === 0
            ? {
                amount: rangeAmount,
                type: rangeType,
              }
            : undefined,
        dateRange: committedTab === 1 ? dateRange : undefined,
      };

      // Create properly serialized date filter for the snapshot
      const snapshotDateFilter =
        committedTab === 1
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
            };

      // Create filter snapshot for the message
      const filterSnapshot = {
        filterId: activeFilter?.filterId,
        name: activeFilter?.name || `Filter ${new Date().toLocaleDateString()}`,
        config: {
          dateFilter: snapshotDateFilter,
          selectedCountries: selectedFlags,
          enabledTools: Object.keys(enabledTools).filter(
            (toolId) => enabledTools[toolId]
          ),
          toolConfigurations: synchronizedConfigurations,
        },
        isActive: !!activeFilter,
        createdAt: new Date().toISOString(),
      };

      // Prepare send data
      const sendData: SendMessageData = {
        content: value,
        dateFilter,
        selectedCountries: selectedFlags,
        enabledTools: Object.keys(enabledTools).filter(
          (toolId) => enabledTools[toolId]
        ),
        filterSnapshot,
        files: selectedFiles.length > 0 ? selectedFiles : undefined,
      };

      onSend(sendData);

      // Clear selected files after sending
      setSelectedFiles([]);
    }
  };

  // Check if we should show the settings icon
  const shouldShowSettingsIcon = React.useMemo(() => {
    // Hide if no tools are selected

    // Hide if none of the enabled tools have configuration fields
    const enabledToolsWithConfig = toolSchemas.filter(
      (tool) =>
        enabledTools[tool.id] &&
        tool.requiresConfiguration &&
        Object.keys(tool.configurationFields || {}).length > 0
    );

    return enabledToolsWithConfig.length > 0;
  }, [enabledTools, toolSchemas]);

  // Check if there are unconfigured tools that need attention
  const needsToolConfiguration = hasUnconfiguredTools(toolSchemas);

  const canSend =
    (value.trim() || selectedFiles.length > 0) &&
    !disabled &&
    !needsToolConfiguration &&
    !isUploading;
  const showStopButton = isLoading;

  // Detect text direction for proper alignment - simplified to prevent infinite loops
  const textDirection = React.useMemo(
    () => detectLanguage(value || ""),
    [value]
  );

  // Get placeholder direction based on current language (not input text)
  const placeholderDirection = React.useMemo(() => {
    const lang = translationContext.currentLang;
    return lang === "he" || lang === "ar" ? "rtl" : "ltr";
  }, [translationContext.currentLang]);

  const placeholderAlign = placeholderDirection === "rtl" ? "right" : "left";

  // Memoize textarea styles to prevent unnecessary re-renders
  const textareaStyle = React.useMemo(
    () => ({
      width: "100%",
      minHeight: "52px",
      maxHeight: "200px",
      padding: "16px",
      border: "none",
      outline: "none",
      resize: "none" as const,
      backgroundColor: "transparent",
      color: isDarkMode ? "#ececf1" : "#374151",
      fontSize: "16px",
      fontFamily:
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: "1.5",
      overflow: "hidden" as const,
      fontWeight: "400",
      WebkitAppearance: "none" as const,
      cursor: "text" as const,
      direction: textDirection as "ltr" | "rtl",
      textAlign:
        textDirection === "rtl" ? ("right" as const) : ("left" as const),
      unicodeBidi: "plaintext" as const,
      boxSizing: "border-box" as const,
    }),
    [isDarkMode, textDirection]
  );

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

  // Tool toggle handler
  const handleToolToggle = (toolId: string) => {
    const isCurrentlyEnabled = enabledTools[toolId];

    // Toggle the tool
    toggleTool(toolId);

    // Update tool configuration to match the toggle state
    const existingConfig = toolConfigurations[toolId];
    const newConfig: ToolConfiguration = {
      toolId,
      enabled: !isCurrentlyEnabled,
      parameters: existingConfig?.parameters || {},
    };

    setToolConfiguration(toolId, newConfig);

    // If enabling a tool that has configuration fields, show hint ring
    if (!isCurrentlyEnabled) {
      const toolSchema = toolSchemas.find((schema) => schema.id === toolId);
      if (
        toolSchema?.requiresConfiguration &&
        toolSchema.configurationFields &&
        Object.keys(toolSchema.configurationFields).length > 0
      ) {
        // Trigger hint ring animation (2 pulses, 200ms each)
        setSettingsHintRing(true);
        setTimeout(() => setSettingsHintRing(false), 800); // 2 pulses × 400ms = 800ms total
      }
    }
  };

  // Tool settings handlers
  const handleToolSettingsOpen = () => {
    setToolSettingsOpen(true);
  };

  const handleToolSettingsClose = () => {
    setToolSettingsOpen(false);
  };

  const handleToolConfigurationChange = (
    toolId: string,
    config: ToolConfiguration
  ) => {
    setToolConfiguration(toolId, config);

    // Also sync with enabledTools state if the enabled state changed
    if (enabledTools[toolId] !== config.enabled) {
      setToolEnabled(toolId, config.enabled);
    }
  };

  const applyFilterToUI = (filter: ChatFilter) => {
    const config = filter.config;

    console.log("🔄 Applying filter to UI:", filter.name, config);

    // Apply date filter
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
          parseISO(config.dateFilter.dateRange[0]),
          parseISO(config.dateFilter.dateRange[1]),
        ]);
        setCommittedTab(1);
        setDateRangeTab(1);
      }
    }

    // Apply selected countries
    if (config.selectedCountries) {
      setSelectedFlags(config.selectedCountries);
    }

    // Reset all tools first, then enable the ones in the filter
    Object.keys(enabledTools).forEach((toolId) => {
      if (enabledTools[toolId]) {
        toggleTool(toolId); // Disable currently enabled tools
      }
    });

    // Apply enabled tools
    if (config.enabledTools && config.enabledTools.length > 0) {
      config.enabledTools.forEach((toolId: string) => {
        if (!enabledTools[toolId]) {
          toggleTool(toolId); // Enable tools from filter
        }
      });
    }

    console.log("✅ Filter applied successfully");
  };

  const createNewFilter = () => {
    setFilterMenuAnchor(null);
    setFilterNameDialogOpen(true);
  };

  const handleSaveNewFilter = async (name: string, isGlobal: boolean) => {
    if (!currentChatId) return;

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
      enabledTools: Object.keys(enabledTools).filter(
        (toolId) => enabledTools[toolId]
      ),
      toolConfigurations: synchronizedConfigurations,
      createdAt: new Date().toISOString(),
      isGlobal: isGlobal,
    };

    const filterId = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newFilter: ChatFilter = {
      filterId,
      name: name,
      config: filterConfig,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save to localStorage (for both global and chat-specific)
      const storageKey = isGlobal
        ? "globalFilters"
        : `chatFilters_${currentChatId}`;
      const existingFilters = localStorage.getItem(storageKey);
      const filters = existingFilters ? JSON.parse(existingFilters) : [];

      // For chat-specific filters, mark all other filters as inactive
      if (!isGlobal) {
        filters.forEach((f: ChatFilter) => (f.isActive = false));
      }

      // Add new filter
      filters.push(newFilter);
      localStorage.setItem(storageKey, JSON.stringify(filters));

      // Update current chat filters and set as active
      if (!isGlobal) {
        setChatFilters(filters);
      } else {
        // For global filters, also add to current chat view
        const currentFilters = [...chatFilters];
        currentFilters.forEach((f) => (f.isActive = false));
        setChatFilters([...currentFilters, newFilter]);
      }

      setActiveFilter(newFilter);

      console.log(`✅ ${isGlobal ? "Global" : "Chat"} filter saved:`, name);

      // If we have authToken, also try API call
      if (authToken) {
        const response = await fetch(
          `http://localhost:3001/api/chats/${currentChatId}/filters`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: name,
              filterConfig: filterConfig,
              isGlobal: isGlobal,
            }),
          }
        );

        if (response.ok) {
          console.log("✅ Filter also saved to API");
        }
      }
    } catch (error) {
      console.error("Failed to create filter:", error);
    }
  };

  const selectFilter = async (filter: ChatFilter) => {
    if (!currentChatId) return;

    try {
      // For demo mode, update localStorage
      const existingFilters = localStorage.getItem(
        `chatFilters_${currentChatId}`
      );
      if (existingFilters) {
        const filters = JSON.parse(existingFilters);

        // Mark all filters as inactive
        filters.forEach((f: ChatFilter) => (f.isActive = false));

        // Mark selected filter as active
        const selectedFilter = filters.find(
          (f: ChatFilter) => f.filterId === filter.filterId
        );
        if (selectedFilter) {
          selectedFilter.isActive = true;
        }

        localStorage.setItem(
          `chatFilters_${currentChatId}`,
          JSON.stringify(filters)
        );
        setChatFilters(filters);
      }

      setActiveFilter(filter);
      applyFilterToUI(filter);
      setFilterMenuAnchor(null);

      console.log("✅ Filter activated:", filter.name);

      // If we have authToken, also try API call
      if (authToken) {
        const response = await fetch(
          `http://localhost:3001/api/chats/${currentChatId}/active-filter`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filterId: filter.filterId,
            }),
          }
        );

        if (response.ok) {
          console.log("✅ Filter also activated via API");
        }
      }
    } catch (error) {
      console.error("Failed to set active filter:", error);
    }
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  // Load both chat-specific and global filters
  const loadAllFilters = useCallback(async () => {
    if (!currentChatId) return;

    try {
      // Load chat-specific filters
      const chatFilters = localStorage.getItem(`chatFilters_${currentChatId}`);
      const chatFilterList = chatFilters ? JSON.parse(chatFilters) : [];

      // Load global filters
      const globalFilters = localStorage.getItem("globalFilters");
      const globalFilterList = globalFilters ? JSON.parse(globalFilters) : [];

      // Combine both lists
      const allFilters = [
        ...chatFilterList.map((f: ChatFilter) => ({ ...f, scope: "chat" })),
        ...globalFilterList.map((f: ChatFilter) => ({ ...f, scope: "global" })),
      ];

      setChatFilters(allFilters);

      // Find active filter
      const activeFilter = allFilters.find((f: ChatFilter) => f.isActive);
      setActiveFilter(activeFilter || null);

      console.log(
        `✅ Loaded ${chatFilterList.length} chat filters + ${globalFilterList.length} global filters`
      );

      // Also try API call if authenticated
      if (authToken) {
        const response = await fetch(
          `http://localhost:3001/api/chats/${currentChatId}/filters`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.ok) {
          const apiFilters = await response.json();
          console.log("✅ API filters loaded:", apiFilters.length);
        }
      }
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  }, [currentChatId, authToken]);

  // Load filters when chat changes
  useEffect(() => {
    if (currentChatId) {
      loadAllFilters();
    } else {
      setChatFilters([]);
      setActiveFilter(null);
    }
  }, [currentChatId, loadAllFilters]);

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
  }, [currentChatId]);

  // Get filter preview for the dialog
  const getFilterPreview = () => {
    const dateText =
      dateRangeTab === 0
        ? `${rangeAmount} ${t(`dateRange.${rangeType}`)} ${t("dateRange.ago")}`
        : dateRange[0] && dateRange[1]
          ? `${dateRange[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${dateRange[1].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : "No date range";

    return {
      countries: selectedFlags,
      tools: Object.keys(enabledTools).filter((toolId) => enabledTools[toolId]),
      dateRange: dateText,
    };
  };

  // Handle renaming a filter
  const handleRenameFilter = (filter: ChatFilter) => {
    setRenameDialogFilter(filter);
    setFilterMenuAnchor(null);
  };

  const handleSaveRename = async (newName: string) => {
    if (!renameDialogFilter || !currentChatId) return;

    const isGlobal = renameDialogFilter.config?.isGlobal;
    const storageKey = isGlobal
      ? "globalFilters"
      : `chatFilters_${currentChatId}`;

    try {
      // Update in localStorage
      const existingFilters = localStorage.getItem(storageKey);
      if (existingFilters) {
        const filters = JSON.parse(existingFilters);
        const filterIndex = filters.findIndex(
          (f: ChatFilter) => f.filterId === renameDialogFilter.filterId
        );

        if (filterIndex !== -1) {
          filters[filterIndex].name = newName;
          localStorage.setItem(storageKey, JSON.stringify(filters));

          // Update UI
          loadAllFilters();

          console.log("✅ Filter renamed:", newName);

          // Also try API call if authenticated
          if (authToken) {
            await fetch(
              `http://localhost:3001/api/chats/filters/${renameDialogFilter.filterId}`,
              {
                method: "PUT",
                headers: {
                  Authorization: `Bearer ${authToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: newName }),
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to rename filter:", error);
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

  const handleDeleteFilter = async (filter: ChatFilter) => {
    try {
      // Remove from localStorage
      const isGlobal = (filter as any).scope === "global";
      const storageKey = isGlobal
        ? "globalFilters"
        : `chatFilters_${currentChatId}`;
      const existingFilters = JSON.parse(
        localStorage.getItem(storageKey) || "[]"
      );
      const updatedFilters = existingFilters.filter(
        (f: ChatFilter) => f.filterId !== filter.filterId
      );
      localStorage.setItem(storageKey, JSON.stringify(updatedFilters));

      // Update state
      setChatFilters(updatedFilters);

      // If this was the active filter, clear it
      if (activeFilter?.filterId === filter.filterId) {
        setActiveFilter(null);
      }

      // TODO: API call when backend is ready
      // await fetch(`/api/filters/${filter.filterId}`, {
      //   method: 'DELETE',
      //   headers: { 'Authorization': `Bearer ${authToken}` }
      // });

      console.log("Filter deleted:", filter.name);
    } catch (error) {
      console.error("Error deleting filter:", error);
    }
  };

  // Create synchronized configurations that match enabled tools
  const synchronizedConfigurations = React.useMemo(() => {
    const synced: { [toolId: string]: ToolConfiguration } = {};

    // Start with existing configurations
    Object.keys(toolConfigurations).forEach((toolId) => {
      synced[toolId] = { ...toolConfigurations[toolId] };
    });

    // Ensure all tools have configurations that match enabled state
    toolsList.forEach((tool) => {
      if (!synced[tool.id]) {
        synced[tool.id] = {
          toolId: tool.id,
          enabled: enabledTools[tool.id] || false,
          parameters: {},
        };
      } else {
        // Sync enabled state
        synced[tool.id] = {
          ...synced[tool.id],
          enabled: enabledTools[tool.id] || false,
        };
      }
    });

    return synced;
  }, [toolConfigurations, enabledTools, toolsList]);

  return (
    <>
      {/* Input Area Container */}
      <Box
        id="iagent-input-area"
        className="iagent-input-container"
        ref={inputContainerRef}
        sx={{
          position: "fixed",
          bottom: 0,
          insetInlineStart:
            effectiveSidebarWidth > 0 ? `${effectiveSidebarWidth}px` : "0",
          insetInlineEnd:
            effectiveReportPanelWidth > 0
              ? `${effectiveReportPanelWidth}px`
              : "0",
          zIndex: 10,
          background: isDarkMode
            ? "linear-gradient(180deg, rgba(52, 53, 65, 0) 0%, rgba(52, 53, 65, 0.8) 50%, #343541 100%)"
            : "linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 50%, #ffffff 100%)",
          paddingTop: "20px",
          paddingBottom: "20px",
          transition:
            "inset-inline-start 300ms cubic-bezier(0.4, 0, 0.2, 1), inset-inline-end 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          "@media (max-width: 768px)": {
            insetInlineStart: 0,
            insetInlineEnd: 0,
            paddingBottom: "env(safe-area-inset-bottom, 10px)",
            paddingTop: "10px",
          },
        }}
      >
        {/* Input Area Content Wrapper */}
        <Box
          id="iagent-input-content"
          className="iagent-input-content-wrapper"
          sx={{
            maxWidth: "768px",
            margin: "0 auto",
            paddingInlineStart: "20px",
            paddingInlineEnd: "20px",
            width: "100%",
            boxSizing: "border-box",
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            "@media (max-width: 600px)": {
              paddingInlineStart: "10px",
              paddingInlineEnd: "10px",
            },
          }}
        >
          {/* Main Input Form Container */}
          <Box
            id="iagent-input-form"
            className="iagent-input-form-container"
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "24px",
              backgroundColor: isDarkMode ? "#40414f" : "#f7f7f8",
              border: isFocused
                ? `1px solid ${isDarkMode ? "#565869" : "#d1d5db"}`
                : `1px solid ${isDarkMode ? "#565869" : "#d1d5db"}`,
              boxShadow: isFocused
                ? `0 0 0 2px ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`
                : "0 2px 6px rgba(0, 0, 0, 0.05)",
              // Removed transition to prevent flickering during typing
              direction: textDirection, // Set container direction based on text
              minHeight: "80px",
              "&:hover": {
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
              },
              // Placeholder styling - dynamic based on current language
              "& textarea::placeholder": {
                opacity: 0.7,
                textAlign: placeholderAlign,
                direction: placeholderDirection,
              },
              "& textarea::-webkit-input-placeholder": {
                opacity: 0.7,
                textAlign: placeholderAlign,
                direction: placeholderDirection,
              },
              "& textarea::-moz-placeholder": {
                opacity: 0.7,
                textAlign: placeholderAlign,
                direction: placeholderDirection,
              },
              "& textarea:-ms-input-placeholder": {
                opacity: 0.7,
                textAlign: placeholderAlign,
                direction: placeholderDirection,
              },
            }}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />

            {/* File Preview Section */}
            {selectedFiles.length > 0 && (
              <Box
                sx={{
                  padding: "12px 16px 8px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  borderBottom: `1px solid ${isDarkMode ? "#565869" : "#d1d5db"}`,
                }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedFiles.map((file, index) => {
                    const fileId = `${file.name}-${index}`;
                    const progress = uploadProgress[fileId] || 0;
                    return (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          minWidth: "200px",
                          maxWidth: "300px",
                        }}
                      >
                        <Chip
                          icon={getFileIcon(
                            file.type || "application/octet-stream"
                          )}
                          label={
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                                width: "100%",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{
                                    maxWidth: "150px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontSize: "13px",
                                  }}
                                >
                                  {file.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: isDarkMode ? "#a3a3a3" : "#6b7280",
                                    fontSize: "11px",
                                  }}
                                >
                                  ({formatFileSize(file.size)})
                                </Typography>
                              </Box>
                              {isUploading &&
                                progress > 0 &&
                                progress < 100 && (
                                  <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                      width: "100%",
                                      height: "3px",
                                      borderRadius: "2px",
                                      backgroundColor: isDarkMode
                                        ? "#404040"
                                        : "#e0e0e0",
                                      "& .MuiLinearProgress-bar": {
                                        backgroundColor: isDarkMode
                                          ? "#3b82f6"
                                          : "#2563eb",
                                      },
                                    }}
                                  />
                                )}
                            </Box>
                          }
                          onDelete={
                            !isUploading ? () => removeFile(index) : undefined
                          }
                          deleteIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            backgroundColor: isDarkMode ? "#343541" : "#e5e7eb",
                            color: isDarkMode ? "#ececf1" : "#374151",
                            width: "100%",
                            justifyContent: "space-between",
                            "& .MuiChip-label": {
                              width: "100%",
                            },
                            "& .MuiChip-deleteIcon": {
                              color: isDarkMode ? "#a3a3a3" : "#6b7280",
                              "&:hover": {
                                color: isDarkMode ? "#ececf1" : "#374151",
                              },
                            },
                            opacity: isUploading ? 0.7 : 1,
                          }}
                        />
                      </Box>
                    );
                  })}
                </Box>
                {isUploading && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      paddingTop: "4px",
                    }}
                  >
                    <CircularProgress
                      size={16}
                      sx={{ color: isDarkMode ? "#3b82f6" : "#2563eb" }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: isDarkMode ? "#a3a3a3" : "#6b7280",
                        fontSize: "12px",
                      }}
                    >
                      {t("input.uploadingFiles") || "Uploading files..."}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Drag and Drop Overlay */}
            {isDragging && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isDarkMode
                    ? "rgba(59, 130, 246, 0.1)"
                    : "rgba(59, 130, 246, 0.05)",
                  border: `2px dashed ${isDarkMode ? "#3b82f6" : "#2563eb"}`,
                  borderRadius: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    color: isDarkMode ? "#3b82f6" : "#2563eb",
                    fontWeight: 600,
                  }}
                >
                  Drop files here
                </Typography>
              </Box>
            )}

            {/* Main Textarea */}
            <textarea
              id="iagent-message-input"
              className="iagent-textarea-input"
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                needsToolConfiguration
                  ? t("input.disabledDueToConfig")
                  : debugPlaceholder
              }
              disabled={disabled || needsToolConfiguration}
              style={{
                ...textareaStyle,
                opacity: needsToolConfiguration ? 0.6 : 1,
                cursor: needsToolConfiguration ? "not-allowed" : "text",
                color: needsToolConfiguration
                  ? isDarkMode
                    ? "#ff9800"
                    : "#f57c00"
                  : textareaStyle.color,
              }}
            />

            {/* Input Controls Row */}
            <Box
              id="iagent-input-controls"
              className="iagent-controls-row"
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px 16px 16px",
                gap: "12px",
              }}
            >
              {/* Left Control Buttons */}
              <Box
                id="iagent-left-controls"
                className="iagent-left-control-group"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  flexShrink: 0,
                }}
              >
                {/* Country Selector */}
                <Box
                  id="iagent-country-selector"
                  className="iagent-country-dropdown"
                  onClick={handleFlagClick}
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
                              backgroundColor: isDarkMode
                                ? "#565869"
                                : "#e5e7eb",
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
                      transform: flagPopoverOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </Box>

                {/* Date Range Selector */}
                <Box
                  id="iagent-date-selector"
                  className="iagent-date-range-button"
                  onClick={handleDateClick}
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
                      unicodeBidi: "plaintext", // Let text determine its own direction
                    }}
                  >
                    {getDateRangeButtonText()}
                  </Typography>
                </Box>

                {/* Settings Button - Only show when tools with config fields are enabled */}
                {shouldShowSettingsIcon && (
                  <IconButton
                    id="iagent-settings-button"
                    className="iagent-settings-control"
                    onClick={handleToolSettingsOpen}
                    title={
                      needsToolConfiguration
                        ? t("input.settingsRequired")
                        : t("tools.settings.title")
                    }
                    sx={{
                      backgroundColor: needsToolConfiguration
                        ? isDarkMode
                          ? "#ff9800"
                          : "#ff9800"
                        : isDarkMode
                          ? "#565869"
                          : "#e5e7eb",
                      border: `1px solid ${
                        needsToolConfiguration
                          ? "#ff9800"
                          : isDarkMode
                            ? "#6b6d7a"
                            : "#d1d5db"
                      }`,
                      borderRadius: "20px",
                      width: "36px",
                      height: "36px",
                      color: needsToolConfiguration
                        ? "#ffffff"
                        : isDarkMode
                          ? "#ececf1"
                          : "#374151",
                      transition: "all 0.2s ease",
                      position: "relative",
                      animation:
                        needsToolConfiguration || settingsHintRing
                          ? needsToolConfiguration
                            ? "settingsWarningRing 1.5s ease-in-out infinite"
                            : "settingsHintRing 400ms ease-in-out 2"
                          : "none",
                      "@keyframes settingsHintRing": {
                        "0%": {
                          boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)",
                          transform: "scale(1)",
                        },
                        "50%": {
                          boxShadow: "0 0 0 6px rgba(59, 130, 246, 0.1)",
                          transform: "scale(1.05)",
                        },
                        "100%": {
                          boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)",
                          transform: "scale(1)",
                        },
                      },
                      "@keyframes settingsWarningRing": {
                        "0%": {
                          boxShadow: "0 0 0 0 rgba(255, 152, 0, 0.8)",
                          transform: "scale(1)",
                        },
                        "50%": {
                          boxShadow: "0 0 0 8px rgba(255, 152, 0, 0.2)",
                          transform: "scale(1.1)",
                        },
                        "100%": {
                          boxShadow: "0 0 0 0 rgba(255, 152, 0, 0)",
                          transform: "scale(1)",
                        },
                      },
                      "&:hover": {
                        backgroundColor: needsToolConfiguration
                          ? isDarkMode
                            ? "#f57c00"
                            : "#f57c00"
                          : isDarkMode
                            ? "#6b6d7a"
                            : "#d1d5db",
                        transform: needsToolConfiguration
                          ? "scale(1.15)"
                          : "scale(1.05)",
                      },
                    }}
                  >
                    <SettingsIcon sx={{ fontSize: "18px" }} />
                  </IconButton>
                )}

                {/* Filter Button - Show saved filters for current chat */}
                <Tooltip
                  title={
                    activeFilter
                      ? `${t("filter.activeFilter")}: ${activeFilter.name}`
                      : t("filter.manage")
                  }
                >
                  <Badge
                    badgeContent={chatFilters.length}
                    color="primary"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "10px",
                        height: "16px",
                        minWidth: "16px",
                      },
                    }}
                  >
                    <IconButton
                      id="iagent-filter-button"
                      className="iagent-filter-control"
                      onClick={handleFilterMenuOpen}
                      sx={{
                        backgroundColor: activeFilter
                          ? isDarkMode
                            ? "#2563eb"
                            : "#3b82f6"
                          : isDarkMode
                            ? "#565869"
                            : "#e5e7eb",
                        border: `1px solid ${
                          activeFilter
                            ? isDarkMode
                              ? "#2563eb"
                              : "#3b82f6"
                            : isDarkMode
                              ? "#6b6d7a"
                              : "#d1d5db"
                        }`,
                        borderRadius: "20px",
                        width: "36px",
                        height: "36px",
                        color: activeFilter
                          ? "#ffffff"
                          : isDarkMode
                            ? "#ececf1"
                            : "#374151",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: activeFilter
                            ? isDarkMode
                              ? "#1d4ed8"
                              : "#2563eb"
                            : isDarkMode
                              ? "#6b6d7a"
                              : "#d1d5db",
                          transform: "scale(1.05)",
                        },
                      }}
                    >
                      <FilterListIcon sx={{ fontSize: "18px" }} />
                    </IconButton>
                  </Badge>
                </Tooltip>
              </Box>

              {/* Right Control Group */}
              <Box
                id="iagent-right-controls"
                className="iagent-right-control-group"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexShrink: 0,
                }}
              >
                {/* AI Tools Selector */}
                <Box
                  id="iagent-tools-list"
                  className="iagent-tools-selector"
                  sx={{
                    display: "flex",
                    gap: "6px",
                    alignItems: "center",
                  }}
                >
                  {toolsList.map((tool) => {
                    const isEnabled = enabledTools[tool.id];
                    return (
                      <Box
                        key={tool.id}
                        component="button"
                        onClick={() => handleToolToggle(tool.id)}
                        sx={{
                          backgroundColor: isEnabled
                            ? isDarkMode
                              ? "#2563eb"
                              : "#3b82f6"
                            : "transparent",
                          border: `1px solid ${
                            isEnabled
                              ? isDarkMode
                                ? "#2563eb"
                                : "#3b82f6"
                              : isDarkMode
                                ? "#565869"
                                : "#d1d5db"
                          }`,
                          borderRadius: "20px",
                          padding: "6px 12px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: isEnabled
                            ? "#ffffff"
                            : isDarkMode
                              ? "#ececf1"
                              : "#374151",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          direction: "rtl",
                          fontFamily: "inherit",
                          "&:hover": {
                            backgroundColor: isEnabled
                              ? isDarkMode
                                ? "#1d4ed8"
                                : "#2563eb"
                              : isDarkMode
                                ? "rgba(255, 255, 255, 0.1)"
                                : "rgba(0, 0, 0, 0.05)",
                            borderColor: isEnabled
                              ? isDarkMode
                                ? "#1d4ed8"
                                : "#2563eb"
                              : isDarkMode
                                ? "#6b6d7a"
                                : "#b8bcc4",
                            transform: "translateY(-1px)",
                            boxShadow: isEnabled
                              ? "0 2px 8px rgba(59, 130, 246, 0.3)"
                              : "none",
                          },
                          "&:active": {
                            transform: "scale(0.95)",
                          },
                        }}
                      >
                        {t(tool.nameKey)}
                      </Box>
                    );
                  })}
                </Box>

                {/* Action Buttons */}
                <Box
                  id="iagent-action-buttons"
                  className="iagent-action-controls"
                  sx={{
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {/* Clear Button */}
                  {showClearButton && value.trim() && (
                    <IconButton
                      onClick={() => {
                        onChange("");
                        onClear?.();
                      }}
                      disabled={disabled}
                      sx={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "transparent",
                        color: isDarkMode ? "#8e8ea0" : "#6b7280",
                        borderRadius: "16px",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                          color: isDarkMode ? "#ffffff" : "#374151",
                        },
                      }}
                      title={t("input.clear") || "Clear"}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}

                  {/* Voice Button */}
                  {showVoiceButton && (
                    <IconButton
                      onClick={onVoiceInput}
                      disabled={disabled}
                      sx={{
                        width: "32px",
                        height: "32px",
                        backgroundColor: "transparent",
                        color: isDarkMode ? "#8e8ea0" : "#6b7280",
                        borderRadius: "16px",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.1)"
                            : "rgba(0, 0, 0, 0.05)",
                          color: isDarkMode ? "#ffffff" : "#374151",
                        },
                      }}
                      title={t("input.voice") || "Voice input"}
                    >
                      <MicIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}

                  {/* Attachment Button */}
                  {showAttachmentButton && (
                    <Tooltip title={t("input.attachment") || "Attach files"}>
                      <IconButton
                        onClick={handleFileButtonClick}
                        disabled={disabled}
                        sx={{
                          width: "32px",
                          height: "32px",
                          backgroundColor: "transparent",
                          color:
                            selectedFiles.length > 0
                              ? isDarkMode
                                ? "#3b82f6"
                                : "#2563eb"
                              : isDarkMode
                                ? "#8e8ea0"
                                : "#6b7280",
                          borderRadius: "16px",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)",
                            color:
                              selectedFiles.length > 0
                                ? isDarkMode
                                  ? "#60a5fa"
                                  : "#1d4ed8"
                                : isDarkMode
                                  ? "#ffffff"
                                  : "#374151",
                          },
                        }}
                      >
                        <Badge
                          badgeContent={selectedFiles.length}
                          color="primary"
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "10px",
                              height: "16px",
                              minWidth: "16px",
                              backgroundColor: isDarkMode
                                ? "#3b82f6"
                                : "#2563eb",
                            },
                          }}
                        >
                          <AttachFileIcon sx={{ fontSize: 16 }} />
                        </Badge>
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Send/Stop Button */}
                <IconButton
                  id="iagent-send-button"
                  className={`iagent-submit-button ${showStopButton ? "iagent-stop-mode" : "iagent-send-mode"}`}
                  onClick={handleSubmit}
                  disabled={!canSend && !showStopButton}
                  sx={{
                    width: "32px",
                    height: "32px",
                    backgroundColor: showStopButton
                      ? isDarkMode
                        ? "#565869"
                        : "#f3f4f6"
                      : canSend
                        ? "#000000"
                        : isDarkMode
                          ? "#40414f"
                          : "#f7f7f8",
                    color: showStopButton
                      ? isDarkMode
                        ? "#ffffff"
                        : "#374151"
                      : canSend
                        ? "#ffffff"
                        : isDarkMode
                          ? "#6b7280"
                          : "#9ca3af",
                    borderRadius: "50%",
                    border: "none",
                    boxShadow: "none",
                    minWidth: "auto",
                    padding: 0,
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: showStopButton
                        ? isDarkMode
                          ? "#6b7280"
                          : "#e5e7eb"
                        : canSend
                          ? "#333333"
                          : isDarkMode
                            ? "#4a4b57"
                            : "#eeeeee",
                      transform:
                        canSend || showStopButton ? "scale(1.1)" : "none",
                      boxShadow:
                        canSend || showStopButton
                          ? "0 2px 8px rgba(0, 0, 0, 0.2)"
                          : "none",
                    },
                    "&:disabled": {
                      backgroundColor: isDarkMode ? "#40414f" : "#f7f7f8",
                      color: isDarkMode ? "#6b7280" : "#9ca3af",
                      transform: "none",
                      boxShadow: "none",
                    },
                    "&:focus": {
                      outline: "none",
                      boxShadow: canSend
                        ? "0 0 0 2px rgba(0, 0, 0, 0.2)"
                        : "none",
                    },
                  }}
                >
                  {showStopButton ? (
                    <StopIcon sx={{ fontSize: 18 }} />
                  ) : (
                    <ArrowUpIcon sx={{ fontSize: 20, fontWeight: "bold" }} />
                  )}
                </IconButton>
              </Box>
            </Box>

            {/* Flag Multi-Select Dropdown */}
            {flagPopoverOpen && (
              <Box
                sx={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  backgroundColor: "transparent",
                }}
                onClick={() => {
                  setFlagAnchorEl(null);
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: flagAnchorEl
                      ? window.innerHeight -
                        flagAnchorEl.getBoundingClientRect().top +
                        8
                      : 0,
                    left: flagAnchorEl
                      ? flagAnchorEl.getBoundingClientRect().left
                      : 0,
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
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
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
                        onClick={() => {
                          handleFlagToggle(option.code);
                        }}
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

            {/* Date Range Popover */}
            {datePopoverOpen && (
              <Box
                sx={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 9998,
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                }}
                onClick={() => {
                  setDateAnchorEl(null);
                  setRangeTypeOpen(false);
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    bottom: dateAnchorEl
                      ? window.innerHeight -
                        dateAnchorEl.getBoundingClientRect().top +
                        8
                      : 0,
                    left: dateAnchorEl
                      ? dateAnchorEl.getBoundingClientRect().left
                      : 0,
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
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
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
                        justifyContent: "flex-end", // Float tabs to bottom
                      }}
                    >
                      <Box
                        onClick={() => setDateRangeTab(0)}
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
                        onClick={() => setDateRangeTab(1)}
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
                    <Box
                      sx={{ flex: 1, padding: "16px", paddingBottom: "8px" }}
                    >
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
                              direction: "ltr", // Force LTR for number input and dropdown alignment
                              flexDirection: "row",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TextField
                              type="number"
                              value={rangeAmount}
                              onChange={(e) =>
                                setRangeAmount(
                                  Math.max(
                                    1,
                                    Math.min(
                                      100000,
                                      parseInt(e.target.value) || 1
                                    )
                                  )
                                )
                              }
                              inputProps={{ min: 1, max: 100000 }}
                              size="small"
                              sx={{
                                width: "100px",
                                "& .MuiOutlinedInput-root": {
                                  backgroundColor: isDarkMode
                                    ? "#404040"
                                    : "#f8f9fa",
                                  borderRadius: "6px",
                                  color: isDarkMode ? "#f1f1f1" : "#1f2937",
                                  fontSize: "14px",
                                  "& fieldset": {
                                    borderColor: isDarkMode
                                      ? "#555555"
                                      : "#e1e5e9",
                                  },
                                  "&:hover fieldset": {
                                    borderColor: isDarkMode
                                      ? "#666666"
                                      : "#c1c7cd",
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#10a37f",
                                    borderWidth: "1px",
                                  },
                                },
                              }}
                            />

                            <Box
                              sx={{ position: "relative", minWidth: "120px" }}
                            >
                              <Box
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRangeTypeOpen(!rangeTypeOpen);
                                }}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "8px 12px",
                                  border: `1px solid ${isDarkMode ? "#555555" : "#e1e5e9"}`,
                                  borderRadius: "6px",
                                  backgroundColor: isDarkMode
                                    ? "#404040"
                                    : "#f8f9fa",
                                  color: isDarkMode ? "#f1f1f1" : "#1f2937",
                                  cursor: "pointer",
                                  fontSize: "14px",
                                  transition: "all 0.2s ease",
                                  "&:hover": {
                                    borderColor: isDarkMode
                                      ? "#666666"
                                      : "#c1c7cd",
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
                                    position: "fixed",
                                    top: rangeTypeOpen ? "auto" : "100%",
                                    bottom: rangeTypeOpen ? "50px" : "auto",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: "140px",
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
                                        setRangeType(option.value);
                                        setRangeTypeOpen(false);
                                      }}
                                      sx={{
                                        padding: "10px 12px",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        color: isDarkMode
                                          ? "#f1f1f1"
                                          : "#1f2937",
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
                                direction: "inherit", // Inherit direction from parent context
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
                            onChange={setTempDateRange}
                            isDarkMode={isDarkMode}
                            startLabel={t("dateRange.startDate")}
                            endLabel={t("dateRange.endDate")}
                            language="he"
                            testMode={true} // Force test mode for development/testing
                            t={t}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Bottom Action Buttons - Option 1: Bottom Left */}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start", // Bottom left positioning
                      gap: "8px",
                      padding: "16px",
                      paddingTop: "8px",
                      borderTop: `1px solid ${isDarkMode ? "#3a3a3a" : "#e5e7eb"}`,
                      backgroundColor: isDarkMode ? "#2f2f2f" : "#ffffff",
                    }}
                  >
                    <Button
                      onClick={handleDateRangeReset}
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
                      onClick={handleDateRangeApply}
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
          </Box>

          {/* Helper Text */}
          <Translate
            i18nKey="input.disclaimer"
            fallback="AI can make mistakes. Check important info."
            as="div"
            style={{
              display: "block",
              marginTop: "8px",
              color: isDarkMode ? "#8e8ea0" : "#6b7280",
              fontSize: "12px",
              lineHeight: "16px",
              direction: "inherit",
            }}
          />
        </Box>
      </Box>

      {/* Filter Management Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={filterMenuOpen}
        onClose={handleFilterMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
            border: `1px solid ${isDarkMode ? "#444444" : "#e0e0e0"}`,
            borderRadius: "12px",
            minWidth: "280px",
            maxWidth: "400px",
            boxShadow: isDarkMode
              ? "0 8px 32px rgba(0, 0, 0, 0.4)"
              : "0 8px 32px rgba(0, 0, 0, 0.12)",
          },
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        {/* Create New Filter Option */}
        <MenuItem onClick={createNewFilter}>
          <ListItemIcon>
            <AddIcon sx={{ color: isDarkMode ? "#ffffff" : "#000000" }} />
          </ListItemIcon>
          <ListItemText
            primary={t("filter.saveCurrentSettings")}
            sx={{ color: isDarkMode ? "#ffffff" : "#000000" }}
          />
        </MenuItem>

        {chatFilters.length > 0 && (
          <Divider
            sx={{ backgroundColor: isDarkMode ? "#444444" : "#e0e0e0" }}
          />
        )}

        {/* Existing Filters */}
        {chatFilters.map((filter) => (
          <MenuItem
            key={filter.filterId}
            sx={{
              backgroundColor:
                activeFilter?.filterId === filter.filterId
                  ? isDarkMode
                    ? "rgba(33, 150, 243, 0.2)"
                    : "rgba(33, 150, 243, 0.1)"
                  : "transparent",
              display: "block",
              padding: "8px 16px",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.05)",
              },
            }}
          >
            {/* Filter Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                  cursor: "pointer",
                }}
                onClick={() => selectFilter(filter)}
              >
                <Box sx={{ mr: 1 }}>
                  {activeFilter?.filterId === filter.filterId ? (
                    <CheckIcon sx={{ color: "#2196f3", fontSize: 20 }} />
                  ) : (
                    <FilterListIcon
                      sx={{
                        color: isDarkMode ? "#ffffff" : "#000000",
                        fontSize: 20,
                      }}
                    />
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: isDarkMode ? "#ffffff" : "#000000",
                      fontWeight:
                        activeFilter?.filterId === filter.filterId ? 600 : 400,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    {filter.name}
                    {(filter as any).scope === "global" && (
                      <Chip
                        label="Global"
                        size="small"
                        sx={{
                          height: "16px",
                          fontSize: "10px",
                          backgroundColor: isDarkMode ? "#2563eb" : "#dbeafe",
                          color: isDarkMode ? "#ffffff" : "#1e40af",
                        }}
                      />
                    )}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: isDarkMode ? "#aaaaaa" : "#666666" }}
                  >
                    {new Date(filter.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewFilter(filter);
                  }}
                  sx={{
                    color: isDarkMode ? "#aaaaaa" : "#666666",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    },
                  }}
                  title="View filter details"
                >
                  <ViewIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePickFilter(filter);
                  }}
                  sx={{
                    color: isDarkMode ? "#4ade80" : "#166534",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(74, 222, 128, 0.1)"
                        : "rgba(22, 101, 52, 0.1)",
                    },
                  }}
                  title="Apply this filter"
                >
                  <PickIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRenameFilter(filter);
                  }}
                  sx={{
                    color: isDarkMode ? "#aaaaaa" : "#666666",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.1)",
                    },
                  }}
                  title="Rename filter"
                >
                  <EditIcon sx={{ fontSize: 16 }} />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFilter(filter);
                  }}
                  sx={{
                    color: isDarkMode ? "#ef4444" : "#dc2626",
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(239, 68, 68, 0.1)"
                        : "rgba(220, 38, 38, 0.1)",
                    },
                  }}
                  title="Delete filter"
                >
                  <DeleteIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Filter Configuration Preview */}
            {filter.config && (
              <Box sx={{ mt: 1.5, mx: -1 }}>
                <FilterPreview
                  filterConfig={filter.config}
                  isDarkMode={isDarkMode}
                  showHeader={false}
                  compact={true}
                />
              </Box>
            )}
          </MenuItem>
        ))}

        {chatFilters.length === 0 && (
          <MenuItem disabled>
            <ListItemText
              primary={t("filter.noFiltersForChat")}
              sx={{
                color: isDarkMode ? "#aaaaaa" : "#666666",
                fontStyle: "italic",
                textAlign: "center",
              }}
            />
          </MenuItem>
        )}
      </Menu>

      {/* Tool Settings Dialog */}
      <ToolSettingsDialog
        open={toolSettingsOpen}
        onClose={handleToolSettingsClose}
        tools={toolSchemas}
        configurations={synchronizedConfigurations}
        onConfigurationChange={handleToolConfigurationChange}
        isDarkMode={isDarkMode}
        isLoading={toolSchemasLoading}
      />

      {/* Filter Name Dialog for Creating Filters */}
      <FilterNameDialog
        open={filterNameDialogOpen}
        onClose={() => setFilterNameDialogOpen(false)}
        onSave={handleSaveNewFilter}
        isDarkMode={isDarkMode}
        mode="create"
        filterPreview={getFilterPreview()}
      />

      {/* Filter Name Dialog for Renaming Filters */}
      <FilterNameDialog
        open={!!renameDialogFilter}
        onClose={() => setRenameDialogFilter(null)}
        onSave={(name) => handleSaveRename(name)}
        isDarkMode={isDarkMode}
        mode="rename"
        currentName={renameDialogFilter?.name || ""}
      />

      {/* Filter Details Dialog */}
      <FilterDetailsDialog
        open={filterDetailsDialogOpen}
        onClose={() => {
          setFilterDetailsDialogOpen(false);
          setSelectedFilterForDetails(null);
        }}
        onApply={handleApplyFilterFromDetails}
        isDarkMode={isDarkMode}
        filter={selectedFilterForDetails}
      />

      {/* File Error Snackbar */}
      <Snackbar
        open={showFileError}
        autoHideDuration={6000}
        onClose={() => setShowFileError(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowFileError(false)}
          severity="error"
          sx={{
            width: "100%",
            backgroundColor: isDarkMode ? "#dc2626" : "#ef4444",
            color: "#ffffff",
          }}
        >
          {fileError}
        </Alert>
      </Snackbar>
    </>
  );
}

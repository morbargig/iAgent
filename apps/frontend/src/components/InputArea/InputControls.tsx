import React from "react";
import { Box, IconButton, Badge, Tooltip } from "@mui/material";
import {
  Settings as SettingsIcon,
  FilterList as FilterListIcon,
} from "@mui/icons-material";
import { CountrySelector } from "./CountrySelector";
import { DateRangeSelector } from "./DateRangeSelector";
import { ToolSelector } from "./ToolSelector";
import { AttachmentButton, SubmitButton } from "./ActionButtons";
import { UploadingFile, AttachedFile } from "../../hooks/useFileHandling";

interface Tool {
  id: string;
  nameKey: string;
}

interface FlagOption {
  code: string;
  flag: string;
  nameKey: string;
}

interface TimeRangeOption {
  value: string;
  labelKey: string;
}

interface InputControlsProps {
  // Country Selection
  selectedFlags: string[];
  flagPopoverOpen: boolean;
  flagAnchorEl: HTMLElement | null;
  flagOptions: FlagOption[];
  onFlagClick: (event: React.MouseEvent<HTMLElement>) => void;
  onFlagToggle: (flagCode: string) => void;
  onFlagClose: () => void;

  // Date Range
  dateRangeTab: number;
  rangeAmount: number;
  rangeType: string;
  rangeTypeOpen: boolean;
  dateRange: [Date | null, Date | null];
  tempDateRange: [Date | null, Date | null];
  datePopoverOpen: boolean;
  dateAnchorEl: HTMLElement | null;
  timeRangeOptions: TimeRangeOption[];
  getDateRangeButtonText: () => string;
  onDateClick: (event: React.MouseEvent<HTMLElement>) => void;
  onDateRangeTabChange: (tab: number) => void;
  onRangeAmountChange: (amount: number) => void;
  onRangeTypeChange: (type: string) => void;
  onRangeTypeToggle: () => void;
  onTempDateRangeChange: (range: [Date | null, Date | null]) => void;
  onDateRangeApply: () => void;
  onDateRangeReset: () => void;
  onDateClose: () => void;

  // Settings
  shouldShowSettingsIcon: boolean;
  needsToolConfiguration: boolean;
  onToolSettingsOpen: () => void;

  // Filter
  chatFilters: any[];
  activeFilter: any;
  onFilterMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;

  // Tools
  toolsList: Tool[];
  enabledTools: { [key: string]: boolean };
  onToolToggle: (toolId: string) => void;

  // Action Buttons
  value: string;
  showClearButton: boolean;
  showVoiceButton: boolean;
  showAttachmentButton: boolean;
  canSend: boolean;
  showStopButton: boolean;
  disabled: boolean;
  uploadingFiles: UploadingFile[];
  attachedFiles: AttachedFile[];
  fileMenuOpen: boolean;
  fileMenuAnchor: HTMLElement | null;
  onClear: () => void;
  onVoiceInput?: () => void;
  onSubmit: () => void;
  onFileMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
  onFileMenuClose: () => void;
  onQuickUpload: () => void;
  onOpenDocumentManager?: () => void;
  enableFileUpload: boolean;
  enableDocumentManagement: boolean;

  // Styling
  isDarkMode: boolean;
  t: (key: string, params?: any) => string;
}

export const InputControls: React.FC<InputControlsProps> = ({
  // Country Selection
  selectedFlags,
  flagPopoverOpen,
  flagAnchorEl,
  flagOptions,
  onFlagClick,
  onFlagToggle,
  onFlagClose,

  // Date Range
  dateRangeTab,
  rangeAmount,
  rangeType,
  rangeTypeOpen,
  dateRange,
  tempDateRange,
  datePopoverOpen,
  dateAnchorEl,
  timeRangeOptions,
  getDateRangeButtonText,
  onDateClick,
  onDateRangeTabChange,
  onRangeAmountChange,
  onRangeTypeChange,
  onRangeTypeToggle,
  onTempDateRangeChange,
  onDateRangeApply,
  onDateRangeReset,
  onDateClose,

  // Settings
  shouldShowSettingsIcon,
  needsToolConfiguration,
  onToolSettingsOpen,

  // Filter
  chatFilters,
  activeFilter,
  onFilterMenuOpen,

  // Tools
  toolsList,
  enabledTools,
  onToolToggle,

  // Action Buttons
  value,
  showClearButton,
  showVoiceButton,
  showAttachmentButton,
  canSend,
  showStopButton,
  disabled,
  uploadingFiles,
  attachedFiles,
  fileMenuOpen,
  fileMenuAnchor,
  onClear,
  onVoiceInput,
  onSubmit,
  onFileMenuClick,
  onFileMenuClose,
  onQuickUpload,
  onOpenDocumentManager,
  enableFileUpload,
  enableDocumentManagement,

  // Styling
  isDarkMode,
  t,
}) => {
  return (
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
      {/* Start Flow - Tools List */}
      <Box
        id="iagent-start-controls"
        className="iagent-start-control-group"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        <ToolSelector
          toolsList={toolsList}
          enabledTools={enabledTools}
          isDarkMode={isDarkMode}
          t={t}
          onToolToggle={onToolToggle}
        />
      </Box>

      {/* End Flow - Settings, Filters, Date, Countries, Docs, Submit */}
      <Box
        id="iagent-end-controls"
        className="iagent-end-control-group"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexShrink: 0,
        }}
      >
        {/* Settings Button */}
        {shouldShowSettingsIcon && (
          <IconButton
            id="iagent-settings-button"
            className="iagent-settings-control"
            onClick={onToolSettingsOpen}
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

        {/* Filter Button */}
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
              onClick={onFilterMenuOpen}
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

        {/* Date Range Selector */}
        <DateRangeSelector
          dateRangeTab={dateRangeTab}
          rangeAmount={rangeAmount}
          rangeType={rangeType}
          rangeTypeOpen={rangeTypeOpen}
          dateRange={dateRange}
          tempDateRange={tempDateRange}
          datePopoverOpen={datePopoverOpen}
          dateAnchorEl={dateAnchorEl}
          timeRangeOptions={timeRangeOptions}
          isDarkMode={isDarkMode}
          t={t}
          getDateRangeButtonText={getDateRangeButtonText}
          onDateClick={onDateClick}
          onDateRangeTabChange={onDateRangeTabChange}
          onRangeAmountChange={onRangeAmountChange}
          onRangeTypeChange={onRangeTypeChange}
          onRangeTypeToggle={onRangeTypeToggle}
          onTempDateRangeChange={onTempDateRangeChange}
          onApply={onDateRangeApply}
          onReset={onDateRangeReset}
          onClose={onDateClose}
          enabledTools={enabledTools}
        />

        {/* Country Selector */}
        <CountrySelector
          selectedFlags={selectedFlags}
          flagPopoverOpen={flagPopoverOpen}
          flagAnchorEl={flagAnchorEl}
          flagOptions={flagOptions}
          isDarkMode={isDarkMode}
          t={t}
          onFlagClick={onFlagClick}
          onFlagToggle={onFlagToggle}
          onClose={onFlagClose}
          enabledTools={enabledTools}
        />

        {/* Docs Button (Attachment) */}
        {(enableFileUpload || enableDocumentManagement) && (
        <AttachmentButton
            showAttachmentButton={showAttachmentButton && (enableFileUpload || enableDocumentManagement)}
          disabled={disabled}
          isDarkMode={isDarkMode}
          uploadingFiles={uploadingFiles}
          attachedFiles={attachedFiles}
          fileMenuOpen={fileMenuOpen}
          fileMenuAnchor={fileMenuAnchor}
          t={t}
          onFileMenuClick={onFileMenuClick}
          onFileMenuClose={onFileMenuClose}
            onQuickUpload={enableFileUpload ? onQuickUpload : undefined}
            onOpenDocumentManager={enableDocumentManagement ? onOpenDocumentManager : undefined}
        />
        )}

        {/* Submit Button */}
        <SubmitButton
          canSend={canSend}
          showStopButton={showStopButton}
          disabled={disabled}
          isDarkMode={isDarkMode}
          onSubmit={onSubmit}
        />
      </Box>
    </Box>
  );
};

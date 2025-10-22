import React from "react";
import { Box, Snackbar, Alert, IconButton } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import { useTranslation } from "../../contexts/TranslationContext";
import { Translate } from "../Translate";
import { FilterNameDialog } from "../FilterNameDialog";
import { FilterDetailsDialog } from "../FilterDetailsDialog";
import { useToolToggles } from "../../hooks/useToolToggles";
import { ToolSettingsDialog, ToolConfiguration } from "../ToolSettingsDialog";
import { useToolSchemas } from "../../services/toolService";
import { DocumentManagementDialog } from "../DocumentManagementDialog";
import { FILE_UPLOAD_CONFIG } from "../../config/fileUpload";

// Import custom hooks
import { useFileHandling } from "../../hooks/useFileHandling";
import { useCountrySelection } from "../../hooks/useCountrySelection";
import { useDateRange } from "../../hooks/useDateRange";
import { useFilterManagement } from "../../hooks/useFilterManagement";
import { useDocumentDialog } from "../../hooks/useDocumentDialog";
import { useInputAreaUI } from "../../hooks/useInputAreaUI";

// Import sub-components
import { FileAttachments } from "./FileAttachments";
import { InputControls } from "./InputControls";
import { FilterMenu } from "./FilterMenu";

// Interfaces
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
      toolConfigurations: Record<string, ToolConfiguration>;
    };
    isActive?: boolean;
    createdAt?: string;
  };
  attachments?: Array<{
    id: string;
    filename: string;
    size: number;
    mimetype: string;
    uploadDate: string;
  }>;
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
  sidebarOpen?: boolean;
  sidebarRef?: React.RefObject<HTMLDivElement | null>;
  sidebarWidth?: number;
  reportPanelOpen?: boolean;
  reportPanelWidth?: number;
  onHeightChange?: (height: number) => void;
  onVoiceInput?: () => void;
  onClear?: () => void;
  onAttachment?: () => void;
  onFileUploaded?: (file: File) => void;
  showVoiceButton?: boolean;
  showClearButton?: boolean;
  showAttachmentButton?: boolean;
  currentChatId?: string;
  authToken?: string;
}

// Tools list data
const toolsList = [
  { id: "tool-x", nameKey: "tools.tool-x" },
  { id: "tool-y", nameKey: "tools.tool-y" },
  { id: "tool-z", nameKey: "tools.tool-z" },
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
  sidebarWidth = 250,
  reportPanelOpen = false,
  reportPanelWidth = 350,
  onHeightChange,
  onVoiceInput,
  onClear,
  onAttachment,
  onFileUploaded,
  showVoiceButton = false,
  showClearButton = true,
  showAttachmentButton = false,
  currentChatId,
  authToken,
}: InputAreaProps) {
  const { t } = useTranslation();

  // Initialize all hooks
  const fileHandling = useFileHandling({ t });
  const countrySelection = useCountrySelection();
  const dateRange = useDateRange({ t });
  const documentDialog = useDocumentDialog({
    attachedFiles: fileHandling.attachedFiles,
    setAttachedFiles: fileHandling.setAttachedFiles,
    t,
  });

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
  const [toolSettingsOpen, setToolSettingsOpen] = React.useState(false);
  const { isRTL } = useTranslation();

  // Filter management
  const filterManagement = useFilterManagement({
    currentChatId,
    authToken,
    enabledTools,
    toolConfigurations,
    selectedFlags: countrySelection.selectedFlags,
    dateRangeTab: dateRange.dateRangeTab,
    rangeAmount: dateRange.rangeAmount,
    rangeType: dateRange.rangeType,
    dateRange: dateRange.dateRange,
    setSelectedFlags: countrySelection.setSelectedFlags,
    setRangeAmount: dateRange.setRangeAmount,
    setRangeType: dateRange.setRangeType,
    setDateRange: dateRange.setDateRange,
    setCommittedTab: dateRange.setCommittedTab,
    setDateRangeTab: dateRange.setDateRangeTab,
    toggleTool,
  });

  // UI state
  const inputAreaUI = useInputAreaUI({
    value,
    isDarkMode,
    disabled,
    onHeightChange,
    toolSchemas,
    enabledTools,
    needsToolConfiguration: hasUnconfiguredTools(toolSchemas),
  });

  // Calculate the effective sidebar and report panel widths for positioning
  const effectiveSidebarWidth = sidebarOpen ? sidebarWidth : 0;
  const effectiveReportPanelWidth = reportPanelOpen ? reportPanelWidth : 0;

  // Handle key down events
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      // If tools need configuration, open settings dialog
      if (inputAreaUI.needsToolConfiguration && value.trim()) {
        setToolSettingsOpen(true);
        return;
      }

      if (
        (value.trim() || fileHandling.attachedFiles.length > 0) &&
        !disabled &&
        !isLoading
      ) {
        handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    if (isLoading && onStop) {
      onStop();
    } else if (
      (value.trim() || fileHandling.attachedFiles.length > 0) &&
      !disabled
    ) {
      // Check if there are unconfigured tools before submitting
      if (inputAreaUI.needsToolConfiguration) {
        setToolSettingsOpen(true);
        return;
      }

      // Check if any files are still uploading
      if (fileHandling.uploadingFiles.length > 0) {
        fileHandling.setFileError(t("files.waitForUploads"));
        fileHandling.setShowFileError(true);
        return;
      }

      // Check if any uploads failed
      const hasErrors = fileHandling.uploadingFiles.some(
        (f) => f.status === "error"
      );
      if (hasErrors) {
        fileHandling.setFileError(t("files.uploadErrors"));
        fileHandling.setShowFileError(true);
        return;
      }

      // Collect all attached file references
      const attachments = fileHandling.attachedFiles.map((f) => ({
        id: f.id,
        filename: f.filename,
        size: f.size,
        mimetype: f.mimetype,
        uploadDate: f.uploadDate,
      }));

      // Prepare date filter data with proper serialization
      const dateFilter: DateFilter = {
        type: dateRange.committedTab === 1 ? "picker" : "custom",
        customRange:
          dateRange.committedTab === 0
            ? {
                amount: dateRange.rangeAmount,
                type: dateRange.rangeType,
              }
            : undefined,
        dateRange:
          dateRange.committedTab === 1 ? dateRange.dateRange : undefined,
      };

      // Create properly serialized date filter for the snapshot
      const snapshotDateFilter =
        dateRange.committedTab === 1
          ? {
              type: "picker" as const,
              dateRange: {
                start: dateRange.dateRange[0]?.toISOString(),
                end: dateRange.dateRange[1]?.toISOString(),
              },
            }
          : {
              type: "custom" as const,
              customRange: {
                amount: dateRange.rangeAmount,
                type: dateRange.rangeType,
              },
            };

      // Create filter snapshot for the message
      const filterSnapshot = {
        filterId: filterManagement.activeFilter?.filterId,
        name:
          filterManagement.activeFilter?.name ||
          `Filter ${new Date().toLocaleDateString()}`,
        config: {
          dateFilter: snapshotDateFilter,
          selectedCountries: countrySelection.selectedFlags,
          enabledTools: Object.keys(enabledTools).filter(
            (toolId) => enabledTools[toolId]
          ),
          toolConfigurations: filterManagement.synchronizedConfigurations,
        },
        isActive: !!filterManagement.activeFilter,
        createdAt: new Date().toISOString(),
      };

      // Prepare send data with attachments
      const sendData: SendMessageData = {
        content: value,
        dateFilter,
        selectedCountries: countrySelection.selectedFlags,
        enabledTools: Object.keys(enabledTools).filter(
          (toolId) => enabledTools[toolId]
        ),
        filterSnapshot,
        attachments,
      };

      onSend(sendData);

      // Clear all files after successful send
      fileHandling.clearAllFiles();
    }
  };

  // Tool toggle handler with hint ring
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

    // If enabling a tool that has configuration fields, could show hint ring
    if (!isCurrentlyEnabled) {
      const toolSchema = toolSchemas.find((schema) => schema.id === toolId);
      if (
        toolSchema?.requiresConfiguration &&
        toolSchema.configurationFields &&
        Object.keys(toolSchema.configurationFields).length > 0
      ) {
        // Could add hint ring animation here if needed
      }
    }
  };

  // Tool settings handlers
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

  // Get filter preview for the dialog
  const getFilterPreview = () => {
    const dateText =
      dateRange.dateRangeTab === 0
        ? `${dateRange.rangeAmount} ${t(`dateRange.${dateRange.rangeType}`)} ${t("dateRange.ago")}`
        : dateRange.dateRange[0] && dateRange.dateRange[1]
          ? `${dateRange.dateRange[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${dateRange.dateRange[1].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
          : t("filter.noDateRange");

    return {
      countries: countrySelection.selectedFlags,
      tools: Object.keys(enabledTools).filter((toolId) => enabledTools[toolId]),
      dateRange: dateText,
    };
  };

  // Disable send button if files are uploading
  const isUploading = fileHandling.uploadingFiles.length > 0;
  const canSend =
    Boolean(value.trim()) &&
    !disabled &&
    !inputAreaUI.needsToolConfiguration &&
    !isUploading;
  const showStopButton = isLoading;

  return (
    <>
      {/* Input Area Container */}
      <Box
        id="iagent-input-area"
        className="iagent-input-container"
        ref={inputAreaUI.inputContainerRef}
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
        {/* Input Area Content Wrapper with Drag & Drop */}
        <Box
          id="iagent-input-content"
          className="iagent-input-content-wrapper"
          onDragEnter={fileHandling.handleDragEnter}
          onDragLeave={fileHandling.handleDragLeave}
          onDragOver={fileHandling.handleDragOver}
          onDrop={fileHandling.handleDropFiles}
          sx={{
            maxWidth: "768px",
            margin: "0 auto",
            paddingInlineStart: "20px",
            paddingInlineEnd: "20px",
            width: "100%",
            boxSizing: "border-box",
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            "@media (max-width: 600px)": {
              paddingInlineStart: "10px",
              paddingInlineEnd: "10px",
            },
          }}
        >
          {/* Drag Overlay */}
          {fileHandling.isDragging && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                insetInlineStart: 0,
                insetInlineEnd: 0,
                bottom: 0,
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                border: "2px dashed #3b82f6",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                pointerEvents: "none",
              }}
            >
              <Box sx={{ fontSize: "18px", color: "#3b82f6" }}>
                {t("files.dropFilesHere")}
              </Box>
            </Box>
          )}

          {/* Main Input Form Container */}
          <Box
            id="iagent-input-form"
            className="iagent-input-form-container"
            sx={{
              display: "flex",
              flexDirection: "column",
              borderRadius: "24px",
              backgroundColor: isDarkMode ? "#40414f" : "#f7f7f8",
              border: inputAreaUI.isFocused
                ? `1px solid ${isDarkMode ? "#565869" : "#d1d5db"}`
                : `1px solid ${isDarkMode ? "#565869" : "#d1d5db"}`,
              boxShadow: inputAreaUI.isFocused
                ? `0 0 0 2px ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"}`
                : "0 2px 6px rgba(0, 0, 0, 0.05)",
              direction: inputAreaUI.textDirection,
              minHeight: "80px",
              "&:hover": {
                boxShadow: "0 2px 12px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            {/* File Attachments */}
            <FileAttachments
              uploadingFiles={fileHandling.uploadingFiles}
              attachedFiles={fileHandling.attachedFiles}
              isDarkMode={isDarkMode}
              textDirection={inputAreaUI.textDirection}
              onRemoveUploading={fileHandling.removeUploadingFile}
              onRemoveAttached={fileHandling.removeAttachedFile}
            />

            {/* Main Textarea Container */}
            <Box sx={{ position: "relative" }}>
              <textarea
                id="iagent-message-input"
                className="iagent-textarea-input"
                ref={inputAreaUI.textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => inputAreaUI.setIsFocused(true)}
                onBlur={() => inputAreaUI.setIsFocused(false)}
                placeholder={
                  inputAreaUI.needsToolConfiguration
                    ? t("input.disabledDueToConfig")
                    : inputAreaUI.debugPlaceholder
                }
                disabled={disabled || inputAreaUI.needsToolConfiguration}
                style={{
                  ...inputAreaUI.textareaStyle,
                  opacity: inputAreaUI.needsToolConfiguration ? 0.6 : 1,
                  cursor: inputAreaUI.needsToolConfiguration
                    ? "not-allowed"
                    : "text",
                  color: inputAreaUI.needsToolConfiguration
                    ? isDarkMode
                      ? "#ff9800"
                      : "#f57c00"
                    : inputAreaUI.textareaStyle.color,
                  paddingRight:
                    showClearButton && value.trim() ? "40px" : "16px",
                }}
              />

              {/* Clear Button - Absolutely Positioned */}
              {showClearButton && value.trim() && (
                <IconButton
                  onClick={() => {
                    onChange("");
                    onClear?.();
                  }}
                  disabled={disabled}
                  sx={{
                    position: "absolute",
                    top: "8px",
                    right: isRTL ? "auto" : "8px",
                    left: isRTL ? "8px" : "auto",
                    width: "24px",
                    height: "24px",
                    backgroundColor: "transparent",
                    color: isDarkMode ? "#8e8ea0" : "#6b7280",
                    borderRadius: "12px",
                    transition: "all 0.2s ease",
                    zIndex: 1,
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)",
                      color: isDarkMode ? "#ffffff" : "#374151",
                    },
                  }}
                  title={t("input.clearTooltip")}
                >
                  <ClearIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>

            {/* Input Controls */}
            <InputControls
              // Country Selection
              selectedFlags={countrySelection.selectedFlags}
              flagPopoverOpen={countrySelection.flagPopoverOpen}
              flagOptions={countrySelection.flagOptions}
              onFlagClick={countrySelection.handleFlagClick}
              onFlagToggle={countrySelection.handleFlagToggle}
              onFlagClose={countrySelection.closeFlagPopover}
              // Date Range
              dateRangeTab={dateRange.dateRangeTab}
              rangeAmount={dateRange.rangeAmount}
              rangeType={dateRange.rangeType}
              rangeTypeOpen={dateRange.rangeTypeOpen}
              dateRange={dateRange.dateRange}
              tempDateRange={dateRange.tempDateRange}
              datePopoverOpen={dateRange.datePopoverOpen}
              timeRangeOptions={dateRange.timeRangeOptions}
              getDateRangeButtonText={dateRange.getDateRangeButtonText}
              onDateClick={dateRange.handleDateClick}
              onDateRangeTabChange={dateRange.setDateRangeTab}
              onRangeAmountChange={dateRange.setRangeAmount}
              onRangeTypeChange={dateRange.setRangeType}
              onRangeTypeToggle={() =>
                dateRange.setRangeTypeOpen(!dateRange.rangeTypeOpen)
              }
              onTempDateRangeChange={dateRange.setTempDateRange}
              onDateRangeApply={dateRange.handleDateRangeApply}
              onDateRangeReset={dateRange.handleDateRangeReset}
              onDateClose={dateRange.closeDatePopover}
              // Settings
              shouldShowSettingsIcon={inputAreaUI.shouldShowSettingsIcon}
              needsToolConfiguration={inputAreaUI.needsToolConfiguration}
              onToolSettingsOpen={() => setToolSettingsOpen(true)}
              // Filter
              chatFilters={filterManagement.chatFilters}
              activeFilter={filterManagement.activeFilter}
              onFilterMenuOpen={filterManagement.handleFilterMenuOpen}
              // Tools
              toolsList={toolsList}
              enabledTools={enabledTools}
              onToolToggle={handleToolToggle}
              // Action Buttons
              value={value}
              showClearButton={showClearButton}
              showVoiceButton={showVoiceButton}
              showAttachmentButton={showAttachmentButton}
              canSend={canSend}
              showStopButton={showStopButton}
              disabled={disabled}
              uploadingFiles={fileHandling.uploadingFiles}
              attachedFiles={fileHandling.attachedFiles}
              fileMenuOpen={documentDialog.fileMenuOpen}
              fileMenuAnchor={documentDialog.fileMenuAnchor}
              onClear={() => {
                onChange("");
                onClear?.();
              }}
              onVoiceInput={onVoiceInput}
              onSubmit={handleSubmit}
              onFileMenuClick={documentDialog.handleFileMenuClick}
              onFileMenuClose={documentDialog.handleFileMenuClose}
              onQuickUpload={() => {
                if (inputAreaUI.fileInputRef.current) {
                  documentDialog.handleQuickUpload(
                    inputAreaUI.fileInputRef as React.RefObject<HTMLInputElement>
                  );
                }
              }}
              onOpenDocumentManager={documentDialog.handleOpenDocumentManager}
              // Styling
              isDarkMode={isDarkMode}
              t={t}
            />
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

      {/* Hidden file input for quick upload */}
      <input
        ref={inputAreaUI.fileInputRef}
        type="file"
        multiple
        onChange={fileHandling.handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {/* Filter Management Menu */}
      <FilterMenu
        filterMenuAnchor={filterManagement.filterMenuAnchor}
        filterMenuOpen={filterManagement.filterMenuOpen}
        chatFilters={filterManagement.chatFilters}
        activeFilter={filterManagement.activeFilter}
        isDarkMode={isDarkMode}
        t={t}
        onClose={filterManagement.handleFilterMenuClose}
        onCreateFilter={filterManagement.createNewFilter}
        onSelectFilter={filterManagement.selectFilter}
        onViewFilter={filterManagement.handleViewFilter}
        onPickFilter={filterManagement.handlePickFilter}
        onRenameFilter={filterManagement.handleRenameFilter}
        onDeleteFilter={filterManagement.handleDeleteFilter}
      />

      {/* Tool Settings Dialog */}
      <ToolSettingsDialog
        open={toolSettingsOpen}
        onClose={() => setToolSettingsOpen(false)}
        tools={toolSchemas}
        configurations={filterManagement.synchronizedConfigurations}
        onConfigurationChange={handleToolConfigurationChange}
        isDarkMode={isDarkMode}
        isLoading={toolSchemasLoading}
      />

      {/* Filter Name Dialog for Creating Filters */}
      <FilterNameDialog
        open={filterManagement.filterNameDialogOpen}
        onClose={() => filterManagement.setFilterNameDialogOpen(false)}
        onSave={filterManagement.handleSaveNewFilter}
        isDarkMode={isDarkMode}
        mode="create"
        filterPreview={getFilterPreview()}
      />

      {/* Filter Name Dialog for Renaming Filters */}
      <FilterNameDialog
        open={!!filterManagement.renameDialogFilter}
        onClose={() => filterManagement.setRenameDialogFilter(null)}
        onSave={(name) => filterManagement.handleSaveRename(name)}
        isDarkMode={isDarkMode}
        mode="rename"
        currentName={filterManagement.renameDialogFilter?.name || ""}
      />

      {/* Filter Details Dialog */}
      <FilterDetailsDialog
        open={filterManagement.filterDetailsDialogOpen}
        onClose={() => {
          filterManagement.setFilterDetailsDialogOpen(false);
          filterManagement.setSelectedFilterForDetails(null);
        }}
        onApply={filterManagement.handleApplyFilterFromDetails}
        isDarkMode={isDarkMode}
        filter={filterManagement.selectedFilterForDetails}
      />

      {/* Documents Management Dialog */}
      <DocumentManagementDialog
        open={documentDialog.docsDialogOpen}
        onClose={documentDialog.handleCloseDocsDialog}
        onDocumentSelect={documentDialog.handleDocumentSelectFromDialog}
        onDocumentRemove={documentDialog.handleDocumentRemoveFromDialog}
        initialTab="manage"
        selectionMode={true}
        maxSelection={FILE_UPLOAD_CONFIG.MAX_FILE_COUNT}
        title={t("files.documentManagement")}
        attachedFiles={fileHandling.attachedFiles}
      />

      {/* File Limit Warning Snackbar */}
      <Snackbar
        open={documentDialog.showLimitWarning}
        autoHideDuration={3000}
        onClose={documentDialog.closeLimitWarning}
        message={t("files.maxFilesLimit", { count: 10 })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />

      {/* File Error Snackbar */}
      <Snackbar
        open={fileHandling.showFileError}
        autoHideDuration={4000}
        onClose={fileHandling.clearFileError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={fileHandling.clearFileError}
          severity="error"
          sx={{ width: "100%" }}
        >
          {fileHandling.fileError}
        </Alert>
      </Snackbar>
    </>
  );
}

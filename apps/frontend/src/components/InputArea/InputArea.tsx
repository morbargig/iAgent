import React from "react";
import { Snackbar, Alert } from "@mui/material";
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
      <div
        id="iagent-input-area"
        className="fixed bottom-0 left-0 right-0 z-50 pt-10 pb-5 px-5 bg-gradient-to-t from-white via-white/95 to-white/40 shadow-lg"
        ref={inputAreaUI.inputContainerRef}
        style={{
          insetInlineStart: effectiveSidebarWidth > 0 ? `${effectiveSidebarWidth}px` : '0',
          insetInlineEnd: effectiveReportPanelWidth > 0 ? `${effectiveReportPanelWidth}px` : '0',
        }}
      >
        {/* Input Area Content Wrapper with Drag & Drop */}
        <div
          id="iagent-input-content"
          className="max-w-3xl mx-auto px-5 w-full relative"
          onDragEnter={fileHandling.handleDragEnter}
          onDragLeave={fileHandling.handleDragLeave}
          onDragOver={fileHandling.handleDragOver}
          onDrop={fileHandling.handleDropFiles}
        >
          {/* Drag Overlay */}
          {fileHandling.isDragging && (
            <div className="absolute inset-0 bg-blue-50 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center z-10">
              <div className="text-blue-600">
                {t("files.dropFilesHere")}
              </div>
            </div>
          )}

          {/* Main Input Form Container */}
          <div
            id="iagent-input-form"
            className={`flex flex-col rounded-3xl bg-white border border-gray-200 shadow-sm ${
              inputAreaUI.isFocused 
                ? 'ring-2 ring-blue-500' 
                : ''
            }`}
            style={{ direction: inputAreaUI.textDirection }}
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
            <div className="relative">
              <textarea
                id="iagent-message-input"
                className={`bg-transparent ${inputAreaUI.needsToolConfiguration ? 'opacity-60 text-orange-500' : 'text-gray-900'} ${showClearButton && value.trim() ? 'pr-10' : 'pr-4'}`}
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
                autoComplete="off"
                data-form-type="message-input"
                aria-label="Message input"
                aria-multiline="true"
                style={inputAreaUI.textareaStyle}
              />

              {/* Clear Button - Absolutely Positioned */}
              {showClearButton && value.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    onClear?.();
                  }}
                  disabled={disabled}
                  className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} w-6 h-6 text-gray-500 hover:text-gray-900 disabled:opacity-50`}
                  title={t("input.clearTooltip")}
                >
                  <ClearIcon className="text-sm" />
                </button>
              )}
            </div>

            {/* Input Controls */}
            <InputControls
              // Country Selection
              selectedFlags={countrySelection.selectedFlags}
              flagPopoverOpen={countrySelection.flagPopoverOpen}
              flagAnchorEl={countrySelection.flagAnchorEl}
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
              dateAnchorEl={dateRange.dateAnchorEl}
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
          </div>

          {/* Helper Text */}
          <Translate
            i18nKey="input.disclaimer"
            fallback="AI can make mistakes. Check important info."
            as="div"
            className="mt-2 text-xs text-gray-500"
            style={{ direction: 'inherit' }}
          />
        </div>
      </div>

      {/* Hidden file input for quick upload */}
      <input
        ref={inputAreaUI.fileInputRef}
        type="file"
        multiple
        onChange={fileHandling.handleFileSelect}
        className="hidden"
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

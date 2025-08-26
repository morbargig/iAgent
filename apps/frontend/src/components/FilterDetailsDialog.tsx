import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import {
  Close as CloseIcon,
  PlayArrow as ApplyIcon,
} from "@mui/icons-material";
import { useTranslation } from "../contexts/TranslationContext";
import { FilterPreview } from "./FilterPreview";

interface FilterDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  onApply?: () => void;
  isDarkMode: boolean;
  filter: {
    filterId?: string;
    name?: string;
    config?: Record<string, any>;
    isActive?: boolean;
    createdAt?: string;
    scope?: "global" | "chat";
  } | null;
  showApplyButton?: boolean;
}

export function FilterDetailsDialog({
  open,
  onClose,
  onApply,
  isDarkMode,
  filter,
  showApplyButton = true,
}: FilterDetailsDialogProps) {
  const { t } = useTranslation();

  if (!filter) return null;

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
          borderRadius: "12px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: isDarkMode ? "#ffffff" : "#000000",
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
          <Typography variant="h6" sx={{ mr: 2 }}>
            {filter.name || t("filter.details")}
          </Typography>

          {filter.scope === "global" && (
            <Chip
              label={t("filter.global")}
              size="small"
              sx={{
                height: "20px",
                fontSize: "11px",
                backgroundColor: isDarkMode ? "#2563eb" : "#dbeafe",
                color: isDarkMode ? "#ffffff" : "#1e40af",
              }}
            />
          )}

          {filter.isActive && (
            <Chip
              label={t("filter.active")}
              size="small"
              sx={{
                height: "20px",
                fontSize: "11px",
                backgroundColor: isDarkMode ? "#059669" : "#d1fae5",
                color: isDarkMode ? "#ffffff" : "#065f46",
                ml: 1,
              }}
            />
          )}
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: isDarkMode ? "#aaaaaa" : "#666666",
            "&:hover": {
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {/* Filter metadata */}
        <Box sx={{ mb: 3 }}>
          {filter.createdAt && (
            <Typography
              variant="caption"
              sx={{
                color: isDarkMode ? "#aaaaaa" : "#666666",
                display: "block",
                mb: 1,
              }}
            >
              {t("filter.created")}:{" "}
              {new Date(filter.createdAt).toLocaleString()}
            </Typography>
          )}

          <Typography
            variant="caption"
            sx={{
              color: isDarkMode ? "#aaaaaa" : "#666666",
              display: "block",
            }}
          >
            {t("filter.scope")}:{" "}
            {filter.scope === "global"
              ? t("filter.availableAcrossChats")
              : t("filter.currentChatOnly")}
          </Typography>
        </Box>

        {/* Filter preview */}
        <FilterPreview
          filterConfig={filter.config || {}}
          isDarkMode={isDarkMode}
          showHeader={false}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={onClose}
          sx={{ color: isDarkMode ? "#cccccc" : "#666666" }}
        >
          {t("common.close")}
        </Button>

        {showApplyButton && (
          <Button
            onClick={handleApply}
            variant="contained"
            sx={{
              backgroundColor: "#2196f3",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              "&:hover": {
                backgroundColor: "#1976d2",
              },
              "& .button-icon": {
                order: -1, // Icon first in LTR
                fontSize: "16px",
              },
              'html[dir="rtl"] &': {
                "& .button-icon": {
                  order: 1, // Icon last in RTL
                },
              },
            }}
          >
            <ApplyIcon className="button-icon" />
            {t("filter.applyFilter")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

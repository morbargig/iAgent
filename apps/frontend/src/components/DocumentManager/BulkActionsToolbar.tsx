import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { DocumentFile } from "../../types/document.types";
import { useTranslation } from "../../contexts/TranslationContext";

interface BulkActionsToolbarProps {
  selectedDocuments: DocumentFile[];
  selectionMode: boolean;
  onBulkDeleteClick: () => void;
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedDocuments,
  selectionMode,
  onBulkDeleteClick,
}) => {
  const theme = useTheme();
  const { t } = useTranslation();

  // Only show when in selection mode and files are selected
  if (!selectionMode || selectedDocuments.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: theme.palette.action.selected,
        borderRadius: 1,
        mb: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="body2" color="primary">
        {selectedDocuments.length > 1 && `${selectedDocuments.length} `}{" "}
        {selectedDocuments.length === 1 ? t("files.file") : t("files.files")}{" "}
        {selectedDocuments.length === 1
          ? t("files.selectedFile")
          : t("files.selectedFiles")}
      </Typography>
      <Box>
        <Button
          startIcon={<DeleteIcon sx={{ marginInlineEnd: 1 }} />}
          onClick={onBulkDeleteClick}
          color="error"
          variant="outlined"
          size="small"
        >
          {t("files.deleteSelected")}
        </Button>
      </Box>
    </Box>
  );
};

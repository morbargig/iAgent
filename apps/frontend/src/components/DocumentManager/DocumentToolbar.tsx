import React from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Button,
  Alert,
  InputAdornment,
} from "@mui/material";
import {
  Search as SearchIcon,
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { useTranslation } from "../../contexts/TranslationContext";
import { ViewMode } from "./hooks/useDocumentUI";

interface DocumentToolbarProps {
  totalDocuments: number;
  showUploadButton?: boolean;
  onUploadClick?: () => void;
  onRefresh: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  error: string | null;
  onErrorClose: () => void;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  totalDocuments,
  showUploadButton = true,
  onUploadClick,
  onRefresh,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearch,
  error,
  onErrorClose,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
      >
        <Typography variant="h6">
          {t("files.documents")} ({totalDocuments})
        </Typography>
        <Box display="flex" gap={1}>
          {showUploadButton && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={onUploadClick}
            >
              {t("files.upload")}
            </Button>
          )}
          <IconButton onClick={onRefresh}>
            <RefreshIcon />
          </IconButton>
          <IconButton
            onClick={() =>
              onViewModeChange(viewMode === "list" ? "grid" : "list")
            }
          >
            {viewMode === "list" ? <GridViewIcon /> : <ListViewIcon />}
          </IconButton>
        </Box>
      </Box>

      <TextField
        fullWidth
        placeholder={t("files.searchDocuments")}
        value={searchQuery}
        onChange={(e) => onSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton onClick={() => onSearch("")} size="small">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={onErrorClose}>
          {error}
        </Alert>
      )}
    </>
  );
};

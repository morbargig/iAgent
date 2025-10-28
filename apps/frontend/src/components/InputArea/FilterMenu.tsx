import React from "react";
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Check as CheckIcon,
  FilterList as FilterListIcon,
  Edit as EditIcon,
  PlayArrow as PickIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { FilterPreview } from "../FilterPreview";

interface ChatFilter {
  filterId: string;
  name: string;
  config: Record<string, any>;
  isActive?: boolean;
  createdAt: string;
}

interface FilterMenuProps {
  filterMenuAnchor: HTMLElement | null;
  filterMenuOpen: boolean;
  chatFilters: ChatFilter[];
  activeFilter: ChatFilter | null;
  isDarkMode: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onCreateFilter: () => void;
  onSelectFilter: (filter: ChatFilter) => void;
  onViewFilter: (filter: ChatFilter) => void;
  onPickFilter: (filter: ChatFilter) => void;
  onRenameFilter: (filter: ChatFilter) => void;
  onDeleteFilter: (filter: ChatFilter) => void;
}

export const FilterMenu: React.FC<FilterMenuProps> = ({
  filterMenuAnchor,
  filterMenuOpen,
  chatFilters,
  activeFilter,
  isDarkMode,
  t,
  onClose,
  onCreateFilter,
  onSelectFilter,
  onViewFilter,
  onPickFilter,
  onRenameFilter,
  onDeleteFilter,
}) => {
  return (
    <Menu
      anchorEl={filterMenuAnchor}
      open={filterMenuOpen}
      onClose={onClose}
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
      <MenuItem onClick={onCreateFilter}>
        <ListItemIcon>
          <AddIcon sx={{ color: isDarkMode ? "#ffffff" : "#000000" }} />
        </ListItemIcon>
        <ListItemText
          primary={t("filter.saveCurrentSettings")}
          sx={{ color: isDarkMode ? "#ffffff" : "#000000" }}
        />
      </MenuItem>

      {chatFilters.length > 0 && (
        <Divider sx={{ backgroundColor: isDarkMode ? "#444444" : "#e0e0e0" }} />
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
              onClick={() => onSelectFilter(filter)}
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
                      label={t("common.global")}
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
                  onViewFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#aaaaaa" : "#666666",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                }}
                title={t("filter.viewTooltip")}
              >
                <ViewIcon sx={{ fontSize: 16 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onPickFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#4ade80" : "#166534",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(74, 222, 128, 0.1)"
                      : "rgba(22, 101, 52, 0.1)",
                  },
                }}
                title={t("filter.applyTooltip")}
              >
                <PickIcon sx={{ fontSize: 16 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#aaaaaa" : "#666666",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.1)",
                  },
                }}
                title={t("filter.renameTooltip")}
              >
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#ef4444" : "#dc2626",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(220, 38, 38, 0.1)",
                  },
                }}
                title={t("filter.deleteTooltip")}
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
  );
};

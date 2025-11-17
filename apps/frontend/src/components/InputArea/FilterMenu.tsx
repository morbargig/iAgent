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
          backgroundColor: isDarkMode ? "#1f1f1f" : "#ffffff",
          border: `1px solid ${isDarkMode ? "#333333" : "#e5e7eb"}`,
          borderRadius: "16px",
          minWidth: "320px",
          maxWidth: "420px",
          boxShadow: isDarkMode
            ? "0 12px 48px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3)"
            : "0 12px 48px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.08)",
          padding: "8px",
          overflow: "hidden",
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
      MenuListProps={{
        sx: {
          padding: 0,
        },
      }}
    >
      {/* Create New Filter Option */}
      <MenuItem 
        onClick={onCreateFilter}
        sx={{
          borderRadius: "12px",
          marginBottom: "4px",
          padding: "12px 16px",
          "&:hover": {
            backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
          },
        }}
      >
        <ListItemIcon>
          <AddIcon sx={{ color: isDarkMode ? "#60a5fa" : "#2563eb", fontSize: 22 }} />
        </ListItemIcon>
        <ListItemText
          primary={t("filter.saveCurrentSettings")}
          primaryTypographyProps={{
            sx: {
              color: isDarkMode ? "#ffffff" : "#111827",
              fontWeight: 500,
              fontSize: "14px",
            },
          }}
        />
      </MenuItem>

      {chatFilters.length > 0 && (
        <Divider 
          sx={{ 
            backgroundColor: isDarkMode ? "#333333" : "#e5e7eb",
            margin: "8px 0",
          }} 
        />
      )}

      {/* Existing Filters */}
      {chatFilters.map((filter) => (
        <MenuItem
          key={`${filter.filterId}-${filter.version}`}
          sx={{
            backgroundColor:
              activeFilter?.filterId === filter.filterId && activeFilter?.version === filter.version
                ? isDarkMode
                  ? "rgba(96, 165, 250, 0.15)"
                  : "rgba(37, 99, 235, 0.08)"
                : "transparent",
            display: "block",
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "4px",
            border: activeFilter?.filterId === filter.filterId && activeFilter?.version === filter.version
              ? `1px solid ${isDarkMode ? "#60a5fa" : "#2563eb"}`
              : `1px solid transparent`,
            "&:hover": {
              backgroundColor: isDarkMode
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.04)",
              border: `1px solid ${isDarkMode ? "#444444" : "#d1d5db"}`,
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
              <Box sx={{ mr: 1.5 }}>
                {activeFilter?.filterId === filter.filterId && activeFilter?.version === filter.version ? (
                  <CheckIcon sx={{ color: isDarkMode ? "#60a5fa" : "#2563eb", fontSize: 22 }} />
                ) : (
                  <FilterListIcon
                    sx={{
                      color: isDarkMode ? "#9ca3af" : "#6b7280",
                      fontSize: 20,
                    }}
                  />
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: isDarkMode ? "#ffffff" : "#111827",
                    fontWeight:
                      activeFilter?.filterId === filter.filterId && activeFilter?.version === filter.version ? 600 : 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontSize: "14px",
                    marginBottom: 0.25,
                  }}
                >
                  {filter.name}
                  {filter.chatId === null && (
                    <Chip
                      label={t("common.global")}
                      size="small"
                      sx={{
                        height: "18px",
                        fontSize: "10px",
                        fontWeight: 500,
                        backgroundColor: isDarkMode ? "#2563eb" : "#dbeafe",
                        color: isDarkMode ? "#ffffff" : "#1e40af",
                        marginLeft: 0.5,
                      }}
                    />
                  )}
                  {filter.version > 1 && (
                    <Chip
                      label={`v${filter.version}`}
                      size="small"
                      sx={{
                        height: "18px",
                        fontSize: "10px",
                        backgroundColor: isDarkMode ? "#444444" : "#e5e7eb",
                        color: isDarkMode ? "#aaaaaa" : "#6b7280",
                        marginLeft: 0.5,
                      }}
                    />
                  )}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ 
                    color: isDarkMode ? "#9ca3af" : "#6b7280",
                    fontSize: "11px",
                  }}
                >
                  {new Date(filter.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 0.25 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  padding: "6px",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.06)",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  },
                }}
                title={t("filter.viewTooltip")}
              >
                <ViewIcon sx={{ fontSize: 18 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onPickFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#4ade80" : "#16a34a",
                  padding: "6px",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(74, 222, 128, 0.15)"
                      : "rgba(22, 163, 74, 0.1)",
                    color: isDarkMode ? "#86efac" : "#15803d",
                  },
                }}
                title={t("filter.applyTooltip")}
              >
                <PickIcon sx={{ fontSize: 18 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#9ca3af" : "#6b7280",
                  padding: "6px",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.06)",
                    color: isDarkMode ? "#ffffff" : "#111827",
                  },
                }}
                title={t("filter.renameTooltip")}
              >
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFilter(filter);
                }}
                sx={{
                  color: isDarkMode ? "#f87171" : "#dc2626",
                  padding: "6px",
                  "&:hover": {
                    backgroundColor: isDarkMode
                      ? "rgba(248, 113, 113, 0.15)"
                      : "rgba(220, 38, 38, 0.1)",
                    color: isDarkMode ? "#fca5a5" : "#b91c1c",
                  },
                }}
                title={t("filter.deleteTooltip")}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Filter Configuration Preview */}
          {filter.config && (
            <Box sx={{ 
              mt: 1.5, 
              mx: -1,
              padding: "8px 12px",
              backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
              borderRadius: "8px",
            }}>
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

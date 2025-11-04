import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Tooltip,
  Box,
} from "@mui/material";
import {
  MoreVert as MoreIcon,
} from "@mui/icons-material";

export interface MoreOptionsMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  color?: "default" | "error" | "primary";
}

interface MoreOptionsMenuProps {
  items: MoreOptionsMenuItem[];
  buttonPosition?: "absolute" | "relative";
  buttonPositionStyles?: {
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
  };
  tooltipTitle?: string;
  iconSize?: number;
  buttonSize?: number;
}

export const MoreOptionsMenu: React.FC<MoreOptionsMenuProps> = ({
  items,
  buttonPosition = "relative",
  buttonPositionStyles = {},
  tooltipTitle = "More options",
  iconSize = 18,
  buttonSize = 36,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(menuAnchor);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleItemClick = (item: MoreOptionsMenuItem) => (e: React.MouseEvent) => {
    e.stopPropagation();
    item.onClick(e);
    handleMenuClose();
  };

  const buttonSx = {
    width: buttonSize,
    height: buttonSize,
    backgroundColor: isDarkMode
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(0, 0, 0, 0.04)",
    color: isDarkMode ? "#d1d5db" : "#6b7280",
    "&:hover": {
      backgroundColor: isDarkMode
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(0, 0, 0, 0.08)",
      color: theme.palette.primary.main,
    },
    ...(buttonPosition === "absolute" && {
      position: "absolute" as const,
      zIndex: 1,
      ...buttonPositionStyles,
    }),
  };

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <IconButton
          onClick={handleMenuClick}
          size="small"
          sx={buttonSx}
        >
          <MoreIcon sx={{ fontSize: iconSize }} />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode
              ? "rgba(38, 38, 38, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: `1px solid ${
              isDarkMode
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.1)"
            }`,
            borderRadius: "8px",
            boxShadow: isDarkMode
              ? "0 8px 24px rgba(0, 0, 0, 0.4)"
              : "0 8px 24px rgba(0, 0, 0, 0.15)",
            minWidth: 180,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {items.map((item) => {
          const itemColor =
            item.color === "error"
              ? theme.palette.error.main
              : item.color === "primary"
              ? theme.palette.primary.main
              : isDarkMode
              ? "#d1d5db"
              : "#374151";

          return (
            <MenuItem
              key={item.id}
              onClick={handleItemClick(item)}
              disabled={item.disabled}
              sx={{
                color: itemColor,
                "&:hover": {
                  backgroundColor:
                    item.color === "error"
                      ? isDarkMode
                        ? "rgba(220, 38, 38, 0.1)"
                        : "rgba(220, 38, 38, 0.08)"
                      : isDarkMode
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                },
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemIcon>
                {item.icon || (
                  <Box
                    sx={{
                      fontSize: 18,
                      color: itemColor,
                      width: 24,
                      height: 24,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                )}
              </ListItemIcon>
              <ListItemText>{item.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};


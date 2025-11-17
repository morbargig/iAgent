import React from "react";
import { Box, Tooltip } from "@mui/material";
import type { ToolId } from "../../utils/toolUtils";

interface Tool {
  id: ToolId;
  nameKey: string;
}

interface ToolSelectorProps {
  toolsList: ReadonlyArray<Tool>;
  enabledTools: Partial<Record<ToolId, boolean>>;
  isDarkMode: boolean;
  t: (key: string, params?: Record<string, string>) => string;
  onToolToggle: (toolId: ToolId) => void;
}

export const ToolSelector: React.FC<ToolSelectorProps> = ({
  toolsList,
  enabledTools,
  isDarkMode,
  t,
  onToolToggle,
}) => {
  return (
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
        const toolName = t(tool.nameKey);
        const tooltipText = isEnabled
          ? t("tools.tooltips.enabled", { tool: toolName })
          : t("tools.tooltips.disabled", { tool: toolName });
        
        return (
          <Tooltip
            key={tool.id}
            title={`${tooltipText}. ${t("tools.tooltips.clickToToggle")}`}
            arrow
          >
            <Box
              component="button"
              onClick={() => onToolToggle(tool.id)}
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
                color: isEnabled ? "#ffffff" : isDarkMode ? "#ececf1" : "#374151",
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
              {toolName}
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
};

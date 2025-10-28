import React from "react";
import { Box } from "@mui/material";

interface Tool {
  id: string;
  nameKey: string;
}

interface ToolSelectorProps {
  toolsList: Tool[];
  enabledTools: { [key: string]: boolean };
  isDarkMode: boolean;
  t: (key: string) => string;
  onToolToggle: (toolId: string) => void;
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
        return (
          <Box
            key={tool.id}
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
            {t(tool.nameKey)}
          </Box>
        );
      })}
    </Box>
  );
};

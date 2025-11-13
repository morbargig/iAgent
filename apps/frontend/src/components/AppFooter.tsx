import React from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { environment } from "../environments/environment";

interface AppFooterProps {
  isDarkMode: boolean;
}

export const AppFooter: React.FC<AppFooterProps> = ({ isDarkMode }) => {
  const theme = useTheme();

  const baseVersion = typeof __APP_VERSION__ !== 'undefined' 
    ? __APP_VERSION__ 
    : environment.app.version;
  
  const appVersion = `v.${baseVersion}-${environment.env}`;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "8px 16px",
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.default,
        flexShrink: 0,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: theme.palette.text.secondary,
          fontSize: "12px",
          fontWeight: 400,
        }}
      >
        {appVersion}
      </Typography>
    </Box>
  );
};


import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Switch,
  FormControlLabel,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  VpnKey as LoginIcon,
  Psychology as BotIcon,
  SmartToy as MockIcon,
  CloudQueue as LiveIcon,
} from "@mui/icons-material";

import { useMockMode } from "../hooks/useMockMode";
import { getApiUrl } from "../config/config";

interface LoginFormProps {
  onLogin: (token: string, userId: string, email: string) => void;
  isDarkMode: boolean;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  isDarkMode,
}) => {
  const { useMockMode: isMockMode, toggleMockMode } = useMockMode();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isMockMode) {
        // Mock login - simulate success after delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        onLogin("mock-token-12345", "mock-user-id", credentials.email);
        return;
      }

      const response = await fetch(getApiUrl('/auth/login'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await response.json();
      onLogin(data.token, data.userId, data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };


  const handleInputChange =
    (field: keyof LoginCredentials) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: isDarkMode
          ? "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: "100%",
          background: isDarkMode ? "#2d2d2d" : "#ffffff",
          boxShadow: isDarkMode
            ? "0 8px 32px rgba(0, 0, 0, 0.5)"
            : "0 8px 32px rgba(0, 0, 0, 0.1)",
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Mock Mode Toggle */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Tooltip
              title={isMockMode ? "Switch to Live Mode" : "Switch to Mock Mode"}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={isMockMode}
                    onChange={toggleMockMode}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": {
                        color: "#ff6b35",
                      },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                        {
                          backgroundColor: "#ff6b35",
                        },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {isMockMode ? (
                      <MockIcon sx={{ color: "#ff6b35" }} />
                    ) : (
                      <LiveIcon sx={{ color: "#667eea" }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ color: isDarkMode ? "#cccccc" : "#666666" }}
                    >
                      {isMockMode ? "Mock Mode" : "Live Mode"}
                    </Typography>
                  </Box>
                }
                sx={{ margin: 0 }}
              />
            </Tooltip>
          </Box>

          {/* Mode Indicator Chip */}
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Chip
              icon={isMockMode ? <MockIcon /> : <LiveIcon />}
              label={isMockMode ? "Using Mock Backend" : "Using Live Backend"}
              variant="outlined"
              size="small"
              sx={{
                borderColor: isMockMode ? "#ff6b35" : "#667eea",
                color: isMockMode ? "#ff6b35" : "#667eea",
                "& .MuiChip-icon": {
                  color: isMockMode ? "#ff6b35" : "#667eea",
                },
              }}
            />
          </Box>

          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <BotIcon
              sx={{
                fontSize: 48,
                color: "#667eea",
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                color: isDarkMode ? "#ffffff" : "#333333",
                mb: 1,
              }}
            >
              iAgent
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: isDarkMode ? "#cccccc" : "#666666",
              }}
            >
              Your intelligent conversation partner
            </Typography>
          </Box>

          {/* Mock Mode Info */}
          {isMockMode && (
            <Alert severity="info" sx={{ mb: 3 }} icon={<MockIcon />}>
              <Typography variant="body2">
                <strong>Mock Mode Active:</strong> Using simulated responses for
                testing. No real backend connection required.
              </Typography>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={credentials.email}
              onChange={handleInputChange("email")}
              disabled={isLoading}
              sx={{ mb: 2 }}
              variant="outlined"
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={credentials.password}
              onChange={handleInputChange("password")}
              disabled={isLoading}
              sx={{ mb: 3 }}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                mb: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: isMockMode
                  ? "linear-gradient(45deg, #ff6b35 30%, #f7931e 90%)"
                  : "linear-gradient(45deg, #667eea 30%, #764ba2 90%)",
                "& .button-icon": {
                  order: -1, // Icon first in LTR
                  fontSize: "20px",
                },
                'html[dir="rtl"] &': {
                  "& .button-icon": {
                    order: 1, // Icon last in RTL
                  },
                },
                "&:hover": {
                  background: isMockMode
                    ? "linear-gradient(45deg, #e55a2b 30%, #de831a 90%)"
                    : "linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)",
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} className="button-icon" />
              ) : (
                <LoginIcon className="button-icon" />
              )}
              {isLoading
                ? "Logging In..."
                : isMockMode
                  ? "Mock Login"
                  : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

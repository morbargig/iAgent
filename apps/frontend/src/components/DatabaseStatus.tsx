import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Button,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  CloudOff as CloudOffIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { env } from "../config/config";

interface DatabaseStatus {
  connected: boolean;
  mode: "demo" | "production" | "memory";
  uri?: string;
  database?: string;
  error?: string;
  timestamp: string;
}

interface DatabaseStatusProps {
  /**
   * Backend API base URL (default: from config)
   */
  apiBaseUrl?: string;
  /**
   * Auto-refresh interval in milliseconds (default: 30000 - 30 seconds, 0 to disable)
   */
  refreshInterval?: number;
  /**
   * Whether to show detailed information
   */
  showDetails?: boolean;
  /**
   * Compact mode for smaller display
   */
  compact?: boolean;
}

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({
  apiBaseUrl = env.API_BASE_URL,
  refreshInterval = 30000,
  showDetails = false,
  compact = true,
}) => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${apiBaseUrl}/api/health/database`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch database status: ${response.statusText}`
        );
      }

      const data: DatabaseStatus = await response.json();
      setStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Failed to fetch database status:", err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/health/database/reconnect`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reconnect to database");
      }

      const result = await response.json();
      setStatus(result.status);

      if (!result.success) {
        setError(result.error || "Reconnection failed");
      } else {
        setError(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setReconnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStatus, refreshInterval]);

  const getStatusIcon = () => {
    if (loading || reconnecting) {
      return <CircularProgress size={20} />;
    }
    if (error) {
      return <ErrorIcon color="error" />;
    }
    if (!status) {
      return <WarningIcon color="warning" />;
    }
    if (status.connected) {
      return <CheckCircleIcon color="success" />;
    }
    if (status.mode === "memory") {
      return <CloudOffIcon color="warning" />;
    }
    return <ErrorIcon color="error" />;
  };

  const getStatusColor = ():
    | "success"
    | "error"
    | "warning"
    | "info"
    | "default" => {
    if (loading || reconnecting) return "default";
    if (error) return "error";
    if (!status) return "warning";
    if (status.connected) return "success";
    if (status.mode === "memory") return "warning";
    return "error";
  };

  const getModeLabel = () => {
    if (!status) return "Unknown";
    switch (status.mode) {
      case "demo":
        return "Demo Mode";
      case "production":
        return "Production";
      case "memory":
        return "In-Memory";
      default:
        return status.mode;
    }
  };

  const getModeColor = ():
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "default" => {
    if (!status) return "default";
    switch (status.mode) {
      case "demo":
        return "primary";
      case "production":
        return "success";
      case "memory":
        return "warning";
      default:
        return "default";
    }
  };

  if (compact) {
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="caption">
              {status?.connected ? "Connected to MongoDB" : "Not connected"}
            </Typography>
            {status?.database && (
              <Typography variant="caption" display="block">
                Database: {status.database}
              </Typography>
            )}
          </Box>
        }
      >
        <Chip
          icon={getStatusIcon()}
          label={getModeLabel()}
          color={getStatusColor()}
          size="small"
          onClick={fetchStatus}
        />
      </Tooltip>
    );
  }

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={1}>
              <StorageIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Database Connection
              </Typography>
            </Box>
            <Tooltip title="Refresh status">
              <IconButton
                size="small"
                onClick={fetchStatus}
                disabled={loading || reconnecting}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider />

          {/* Status Display */}
          {loading && !status ? (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Connection Status */}
              <Box display="flex" alignItems="center" gap={1}>
                {getStatusIcon()}
                <Typography variant="body1">
                  Status:{" "}
                  <Typography
                    component="span"
                    fontWeight="bold"
                    color={
                      status?.connected
                        ? "success.main"
                        : status?.mode === "memory"
                          ? "warning.main"
                          : "error.main"
                    }
                  >
                    {status?.connected
                      ? "Connected"
                      : status?.mode === "memory"
                        ? "Memory Mode"
                        : "Disconnected"}
                  </Typography>
                </Typography>
              </Box>

              {/* Mode */}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={getModeLabel()}
                  color={getModeColor()}
                  size="small"
                />
              </Box>

              {/* Database Info */}
              {showDetails && status && (
                <>
                  {status.database && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Database: <strong>{status.database}</strong>
                      </Typography>
                    </Box>
                  )}

                  {status.uri && (
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ wordBreak: "break-all" }}
                      >
                        URI:{" "}
                        <code style={{ fontSize: "0.85em" }}>{status.uri}</code>
                      </Typography>
                    </Box>
                  )}

                  {status.timestamp && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Last checked:{" "}
                        {new Date(status.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                </>
              )}

              {/* Error Display */}
              {(error || status?.error) && (
                <Alert severity="error" icon={<ErrorIcon />}>
                  <Typography variant="body2">
                    {error || status?.error}
                  </Typography>
                </Alert>
              )}

              {/* Memory Mode Info */}
              {status?.mode === "memory" && (
                <Alert severity="warning" icon={<InfoIcon />}>
                  <Typography variant="body2">
                    Running in memory mode. Data will not persist after restart.
                    {status.error && ` Reason: ${status.error}`}
                  </Typography>
                </Alert>
              )}

              {/* Reconnect Button */}
              {!status?.connected && status?.mode !== "memory" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleReconnect}
                  disabled={reconnecting}
                  startIcon={
                    reconnecting ? (
                      <CircularProgress size={20} />
                    ) : (
                      <RefreshIcon />
                    )
                  }
                >
                  {reconnecting ? "Reconnecting..." : "Reconnect"}
                </Button>
              )}
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default DatabaseStatus;

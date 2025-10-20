import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  CircularProgress,
  Button,
  Divider,
} from "@mui/material";
import {
  Close as CloseIcon,
  Assessment as ReportIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";

export interface ReportData {
  id: string;
  title: string;
  summary: string;
  content: string;
  author?: string;
  createdDate?: string;
  lastModified?: string;
  status: "draft" | "published" | "archived";
  priority: "low" | "medium" | "high" | "critical";
  category: string;
  tags?: string[];
  attachments?: string[];
  metrics?: {
    views: number;
    downloads: number;
    shares: number;
  };
}

interface ReportDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  reportData: ReportData | null;
  width?: number;
  onWidthChange?: (width: number) => void;
  isLoading?: boolean;
}

// Mock API function for fetching report details
export async function fetchReportDetails(
  reportId: string
): Promise<ReportData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mock report data
  const mockReports: { [key: string]: ReportData } = {
    "security-audit-2024": {
      id: "security-audit-2024",
      title: "Q4 2024 Security Audit Report",
      summary:
        "Comprehensive security assessment covering network infrastructure, application security, and compliance requirements.",
      content: `# Q4 2024 Security Audit Report

## Executive Summary

Our quarterly security audit has identified several key areas for improvement while highlighting strong performance in core security practices.

## Key Findings

### Network Security
- **Status**: ✅ Strong
- Firewall configurations properly maintained
- Intrusion detection systems functioning optimally
- Network segmentation effectively implemented

### Application Security
- **Status**: ⚠️ Needs Attention
- 3 medium-priority vulnerabilities identified
- Code review processes require enhancement
- Dependencies need regular updates

### Compliance Status
- **Status**: ✅ Strong
- SOC 2 Type II compliance maintained
- GDPR requirements fully met
- ISO 27001 standards exceeded

## Recommendations

1. **Immediate Actions (Critical)**
   - Patch identified vulnerabilities within 48 hours
   - Update security training materials

2. **Short Term (1-4 weeks)**
   - Implement automated dependency scanning
   - Enhance code review workflows
   - Update incident response procedures

3. **Long Term (1-3 months)**
   - Deploy advanced threat detection
   - Implement zero-trust architecture
   - Conduct penetration testing

## Risk Assessment

| Category | Risk Level | Impact | Likelihood |
|----------|------------|---------|------------|
| Network | Low | Medium | Low |
| Applications | Medium | High | Medium |
| Physical | Low | Low | Low |
| Human Factor | Medium | High | Medium |

## Compliance Metrics

- **Security Incidents**: 2 (down from 5 last quarter)
- **Average Response Time**: 4.2 hours
- **Training Completion**: 94% of staff
- **Vulnerability Remediation**: 87% within SLA

## Next Steps

The security team will focus on application security improvements and staff training enhancements. A follow-up audit is scheduled for Q1 2025.`,
      author: "Security Team",
      createdDate: "2024-12-15",
      lastModified: "2024-12-15",
      status: "published",
      priority: "high",
      category: "Security",
      tags: ["Security", "Audit", "Compliance", "Q4 2024"],
      attachments: [
        "security-audit-detailed.pdf",
        "vulnerability-scan-results.xlsx",
      ],
      metrics: {
        views: 127,
        downloads: 23,
        shares: 8,
      },
    },
    "performance-analysis-2024": {
      id: "performance-analysis-2024",
      title: "System Performance Analysis Report",
      summary:
        "Detailed analysis of system performance metrics, bottlenecks, and optimization recommendations.",
      content: `# System Performance Analysis Report

## Overview

This report analyzes system performance across all critical infrastructure components for the period of Q4 2024.

## Performance Metrics

### Database Performance
- **Average Query Time**: 45ms (target: <50ms) ✅
- **Connection Pool Utilization**: 67%
- **Index Efficiency**: 94%

### Application Performance
- **Response Time**: 120ms average
- **Throughput**: 2,450 requests/second
- **Error Rate**: 0.02%

### Infrastructure Metrics
- **CPU Utilization**: 72% average
- **Memory Usage**: 68% average
- **Disk I/O**: 450 IOPS average

## Identified Bottlenecks

1. **Database Connection Pooling**
   - Current: 100 connections
   - Recommendation: Increase to 150
   
2. **Cache Hit Rate**
   - Current: 85%
   - Target: 95%
   - Action: Optimize cache policies

3. **API Gateway Latency**
   - Current: 25ms overhead
   - Target: <15ms
   - Action: Review routing rules

## Optimization Recommendations

### Immediate (0-2 weeks)
- Increase database connection pool size
- Optimize slow SQL queries (identified 12 queries)
- Enable compression on API responses

### Short Term (2-8 weeks)
- Implement Redis cluster for caching
- Upgrade to faster SSD storage
- Optimize image delivery with CDN

### Long Term (2-6 months)
- Consider microservices architecture
- Implement horizontal scaling
- Database sharding strategy

## Performance Trends

Our monitoring shows consistent improvement:
- **Response Time**: 15% improvement over last quarter
- **Throughput**: 22% increase
- **Error Rate**: 60% reduction

## Conclusion

System performance is within acceptable parameters with clear paths for optimization identified.`,
      author: "DevOps Team",
      createdDate: "2024-12-10",
      lastModified: "2024-12-12",
      status: "published",
      priority: "medium",
      category: "Performance",
      tags: ["Performance", "Monitoring", "Optimization", "Infrastructure"],
      attachments: ["performance-charts.pdf", "monitoring-data.csv"],
      metrics: {
        views: 89,
        downloads: 15,
        shares: 4,
      },
    },
  };

  const report = mockReports[reportId];
  if (!report) {
    throw new Error(`Report with id "${reportId}" not found`);
  }

  return report;
}

const getPriorityColor = (priority: ReportData["priority"], theme: any) => {
  switch (priority) {
    case "critical":
      return theme.palette.error.main;
    case "high":
      return theme.palette.warning.main;
    case "medium":
      return theme.palette.info.main;
    case "low":
    default:
      return theme.palette.success.main;
  }
};

const getStatusColor = (status: ReportData["status"], theme: any) => {
  switch (status) {
    case "published":
      return theme.palette.success.main;
    case "draft":
      return theme.palette.warning.main;
    case "archived":
      return theme.palette.text.secondary;
    default:
      return theme.palette.text.secondary;
  }
};

export const ReportDetailsPanel = React.forwardRef<
  HTMLDivElement,
  ReportDetailsPanelProps
>(
  (
    {
      open,
      onClose,
      isDarkMode,
      reportData,
      width: initialWidth = 350,
      onWidthChange,
      isLoading = false,
    },
    ref
  ) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));

    // State for resizable width
    const [panelWidth, setPanelWidth] = useState<number>(() => {
      try {
        const saved = localStorage.getItem("report-panel-width");
        return saved ? parseInt(saved, 10) : initialWidth;
      } catch {
        return initialWidth;
      }
    });
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef<HTMLDivElement>(null);

    // Resize functionality - similar to sidebar but resizing from left edge
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
    }, []);

    const handleMouseMove = useCallback(
      (e: MouseEvent) => {
        if (!isResizing) return;

        // Calculate new width based on distance from right edge of screen
        const newWidth = window.innerWidth - e.clientX;
        const minWidth = 300;
        const maxWidth = 700;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setPanelWidth(newWidth);
          if (onWidthChange) {
            onWidthChange(newWidth);
          }
        }
      },
      [isResizing, onWidthChange]
    );

    const handleMouseUp = useCallback(() => {
      setIsResizing(false);
      // Save to localStorage
      try {
        localStorage.setItem("report-panel-width", panelWidth.toString());
      } catch (error) {
        console.warn(
          "Failed to save report panel width to localStorage:",
          error
        );
      }
    }, [panelWidth]);

    // Add global mouse event listeners for resize
    useEffect(() => {
      if (isResizing) {
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        return () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        };
      }
      return undefined;
    }, [isResizing, handleMouseMove, handleMouseUp]);

    // Notify parent of width changes
    useEffect(() => {
      if (onWidthChange && open) {
        onWidthChange(panelWidth);
      }
    }, [panelWidth, onWidthChange, open]);

    if (!open) {
      return null;
    }

    // Use the exact same styling as the existing Sidebar
    const sidebarContent = (
      <Box
        sx={{
          width: "100%",
          height: "100vh",
          backgroundColor: isDarkMode ? "#171717" : "#f9fafb",
          borderInlineEnd: `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Header - same style as sidebar */}
        <Box
          sx={{
            padding: "16px",
            flexShrink: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
            position: "relative",
          }}
        >
          {/* Close button - same style as sidebar */}
          <IconButton
            onClick={onClose}
            sx={{
              position: "absolute",
              insetInlineEnd: 12,
              top: 12,
              color: theme.palette.text.secondary,
              backgroundColor: theme.palette.background.paper,
              borderRadius: "8px",
              width: 36,
              height: 36,
              zIndex: 10,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                backgroundColor: theme.palette.action.hover,
                color: theme.palette.text.primary,
                transform: "scale(1.05)",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {/* Report icon and title */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              paddingInlineEnd: "48px",
            }}
          >
            <ReportIcon
              sx={{
                fontSize: 20,
                marginInlineEnd: "12px",
                color: theme.palette.primary.main,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontSize: "16px",
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Report Details
            </Typography>
          </Box>
        </Box>

        {/* Content Area - same scrolling style as sidebar */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            padding: "16px",
            // Same scrollbar styling as sidebar
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.divider,
              borderRadius: "2px",
              "&:hover": {
                backgroundColor: theme.palette.text.secondary,
              },
            },
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "200px",
              }}
            >
              <CircularProgress size={40} />
            </Box>
          ) : reportData ? (
            <>
              {/* Report Header */}
              <Box sx={{ marginBottom: "16px" }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    marginBottom: "8px",
                    lineHeight: 1.3,
                  }}
                >
                  {reportData.title}
                </Typography>

                {/* Status and Priority Badges */}
                <Box sx={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                  <Chip
                    label={reportData.status.toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor:
                        getStatusColor(reportData.status, theme) + "20",
                      color: getStatusColor(reportData.status, theme),
                      fontWeight: 500,
                      fontSize: "0.7rem",
                    }}
                  />
                  <Chip
                    label={`${reportData.priority.toUpperCase()} PRIORITY`}
                    size="small"
                    sx={{
                      backgroundColor:
                        getPriorityColor(reportData.priority, theme) + "20",
                      color: getPriorityColor(reportData.priority, theme),
                      fontWeight: 500,
                      fontSize: "0.7rem",
                    }}
                  />
                </Box>

                {/* Summary */}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "14px",
                    color: theme.palette.text.secondary,
                    lineHeight: 1.5,
                    fontStyle: "italic",
                    marginBottom: "16px",
                  }}
                >
                  {reportData.summary}
                </Typography>
              </Box>

              {/* Report Meta */}
              <Box
                sx={{
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                {reportData.author && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.secondary,
                      marginBottom: "4px",
                    }}
                  >
                    <strong>Author:</strong> {reportData.author}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "13px",
                    color: theme.palette.text.secondary,
                    marginBottom: "4px",
                  }}
                >
                  <strong>Category:</strong> {reportData.category}
                </Typography>
                {reportData.createdDate && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.secondary,
                      marginBottom: "4px",
                    }}
                  >
                    <strong>Created:</strong>{" "}
                    {new Date(reportData.createdDate).toLocaleDateString()}
                  </Typography>
                )}
                {reportData.lastModified && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "13px",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    <strong>Last Modified:</strong>{" "}
                    {new Date(reportData.lastModified).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              {/* Metrics */}
              {reportData.metrics && (
                <Box sx={{ marginBottom: "16px" }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      marginBottom: "8px",
                    }}
                  >
                    Report Metrics
                  </Typography>
                  <Box
                    sx={{ display: "flex", gap: "16px", marginBottom: "12px" }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <ViewIcon
                        sx={{
                          fontSize: 16,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "13px" }}>
                        {reportData.metrics.views} views
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <DownloadIcon
                        sx={{
                          fontSize: 16,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "13px" }}>
                        {reportData.metrics.downloads} downloads
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <ShareIcon
                        sx={{
                          fontSize: 16,
                          color: theme.palette.text.secondary,
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: "13px" }}>
                        {reportData.metrics.shares} shares
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  sx={{ fontSize: "12px" }}
                >
                  Download
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<ShareIcon />}
                  sx={{ fontSize: "12px" }}
                >
                  Share
                </Button>
              </Box>

              <Divider sx={{ marginBottom: "16px" }} />

              {/* Report Content */}
              <Typography
                variant="body1"
                sx={{
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: theme.palette.text.primary,
                  whiteSpace: "pre-wrap",
                  "& p": {
                    marginBottom: "12px",
                  },
                }}
              >
                {reportData.content}
              </Typography>

              {/* Tags */}
              {reportData.tags && reportData.tags.length > 0 && (
                <Box
                  sx={{
                    marginTop: "24px",
                    paddingTop: "16px",
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "14px",
                      color: theme.palette.text.secondary,
                      marginBottom: "8px",
                    }}
                  >
                    Tags:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {reportData.tags.map((tag: string, index: number) => (
                      <Box
                        key={index}
                        sx={{
                          backgroundColor: theme.palette.action.hover,
                          color: theme.palette.text.secondary,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        {tag}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Attachments */}
              {reportData.attachments && reportData.attachments.length > 0 && (
                <Box
                  sx={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "14px",
                      color: theme.palette.text.secondary,
                      marginBottom: "8px",
                    }}
                  >
                    Attachments:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    {reportData.attachments.map((attachment, index) => (
                      <Button
                        key={index}
                        size="small"
                        variant="text"
                        startIcon={<DownloadIcon />}
                        sx={{
                          justifyContent: "flex-start",
                          fontSize: "12px",
                          textTransform: "none",
                          color: theme.palette.primary.main,
                        }}
                      >
                        {attachment}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                textAlign: "center",
                marginTop: "40px",
              }}
            >
              No report data available
            </Typography>
          )}
        </Box>

        {/* Resize Handle - positioned on the left edge */}
        {!isMobile && (
          <Box
            ref={resizeRef}
            onMouseDown={handleMouseDown}
            sx={{
              position: "absolute",
              top: 0,
              insetInlineStart: 0, // Start edge for panel
              width: "4px",
              height: "100%",
              cursor: "col-resize",
              backgroundColor: "transparent",
              transition: isResizing ? "none" : "background-color 150ms ease",
              zIndex: 10,
              "&:hover": {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.5,
              },
              "&:active": {
                backgroundColor: theme.palette.primary.main,
                opacity: 0.8,
              },
            }}
          />
        )}
      </Box>
    );

    if (isMobile) {
      return null; // For mobile, we could implement a modal or full-screen view later
    }

    // Desktop implementation - same structure as sidebar
    return (
      <Box
        ref={ref}
        sx={{
          width: open ? panelWidth : 0,
          flexShrink: 0,
          overflow: "hidden",
          transition: isResizing
            ? "none"
            : "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          height: "100vh",
          order: 3, // Place after main content
        }}
      >
        {sidebarContent}
      </Box>
    );
  }
);

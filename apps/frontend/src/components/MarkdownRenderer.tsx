import React, { useState } from "react";
import { Box, Typography, useTheme, Collapse, IconButton } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  ParsedMessageContent,
  buildParsedMessageContent,
} from "@iagent/chat-types";
import {
  ChatContentBlock,
  decodeBase64Json,
  decodeBase64Text,
} from "@iagent/shared-renderer";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

interface MarkdownRendererProps {
  content: string;
  parsed?: ParsedMessageContent;
  isDarkMode?: boolean;
  onOpenReport?: (url: string) => void;
  section?: "reasoning" | "tool-t" | "tool-x" | "answer";
  contentType?: "citation" | "table" | "report" | "markdown";
}

const availableReports = [
  {
    id: 1,
    title: "Q4 2024 Security Audit Report",
    url: "report://security-audit-2024",
    keywords: ["security", "audit", "vulnerability"],
  },
  {
    id: 2,
    title: "System Performance Analysis Report",
    url: "report://performance-analysis-2024",
    keywords: ["performance", "metrics", "system", "monitoring"],
  },
];

const INLINE_PATTERN = /(`[^`]+`|\*\*[^*]+\*\*|\[\d+\])/g;

const getRelevantReports = (text: string) =>
  availableReports.filter((report) =>
    report.keywords.some((keyword) => text.toLowerCase().includes(keyword))
  );

const renderInlineContent = (
  text: string,
  foundReports: typeof availableReports,
  onOpenReport?: (url: string) => void,
  keyPrefix = "inline"
) => {
  const segments = text.split(INLINE_PATTERN);

  return segments.map((segment, index) => {
    if (!segment) {
      return null;
    }

    if (segment.startsWith("**") && segment.endsWith("**")) {
      const value = segment.slice(2, -2);
      return (
        <Box
          component="span"
          key={`${keyPrefix}-bold-${index}`}
          sx={{ fontWeight: 600 }}
        >
          {value}
        </Box>
      );
    }

    if (segment.startsWith("`") && segment.endsWith("`")) {
      const value = segment.slice(1, -1);
      return (
        <Box
          component="span"
          key={`${keyPrefix}-code-${index}`}
          sx={{
            display: "inline-block",
            backgroundColor: "rgba(148, 163, 184, 0.2)",
            padding: "0.1em 0.4em",
            borderRadius: "4px",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            fontSize: "0.9em",
          }}
        >
          {value}
        </Box>
      );
    }

    if (/^\[\d+\]$/.test(segment)) {
      const reportId = parseInt(segment.replace(/\[|\]/g, ""), 10);
      const report = foundReports.find((item) => item.id === reportId);

      if (report) {
        return (
          <Box
            component="span"
            key={`${keyPrefix}-ref-${index}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onOpenReport?.(report.url);
            }}
            sx={{
              display: "inline-block",
              marginInline: "4px",
              padding: "2px 6px",
              borderRadius: "4px",
              backgroundColor: "primary.main",
              color: "primary.contrastText",
              fontSize: "0.75em",
              fontWeight: 600,
              cursor: "pointer",
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "scale(1.05)",
              },
            }}
          >
            {segment}
          </Box>
        );
      }
    }

    return (
      <React.Fragment key={`${keyPrefix}-text-${index}`}>
        {segment}
      </React.Fragment>
    );
  });
};

const renderBlock = (
  block: ChatContentBlock,
  index: number,
  theme: Theme,
  isDarkMode: boolean,
  foundReports: typeof availableReports,
  onOpenReport?: (url: string) => void
) => {
  switch (block.type) {
    case "heading": {
      const variants: Record<number, "h5" | "h6" | "subtitle1"> = {
        1: "h5",
        2: "h6",
        3: "subtitle1",
        4: "subtitle1",
        5: "subtitle1",
        6: "subtitle1",
      };
      return (
        <Typography
          key={`heading-${index}`}
          variant={variants[block.level]}
          sx={{
            mt: index === 0 ? 0 : 2,
            mb: 1,
            fontWeight: 600,
            borderBottom:
              block.level === 1 ? `1px solid ${theme.palette.divider}` : "none",
            pb: block.level === 1 ? 0.5 : 0,
          }}
        >
          {block.text}
        </Typography>
      );
    }
    case "paragraph":
      return (
        <Typography
          key={`paragraph-${index}`}
          variant="body1"
          sx={{
            lineHeight: 1.7,
            mt: index === 0 ? 0 : 1,
            mb: 1,
            color: theme.palette.text.primary,
          }}
        >
          {renderInlineContent(block.text, foundReports, onOpenReport, `paragraph-${index}`)}
        </Typography>
      );
    case "code":
      return (
        <Box
          key={`code-${index}`}
          component="pre"
          sx={{
            backgroundColor: isDarkMode ? "#1e1e1e" : "#f5f5f5",
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: "8px",
            fontSize: "0.9em",
            lineHeight: 1.5,
            overflowX: "auto",
            px: 2,
            py: 1.5,
            my: 2,
          }}
        >
          {block.language && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                fontSize: "0.7em",
                fontWeight: 600,
                color: theme.palette.text.secondary,
                mb: 1,
              }}
            >
              {block.language.toUpperCase()}
            </Box>
          )}
          <Box
            component="code"
            sx={{
              whiteSpace: "pre",
              display: "block",
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            }}
          >
            {block.code}
          </Box>
        </Box>
      );
    case "list":
      return (
        <Box
          key={`list-${index}`}
          component={block.ordered ? "ol" : "ul"}
          sx={{
            pl: 3,
            my: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
          }}
        >
          {block.items.map((item, listIndex) => (
            <Box component="li" key={`list-${index}-${listIndex}`}>
              {renderInlineContent(item, foundReports, onOpenReport, `list-${index}-${listIndex}`)}
            </Box>
          ))}
        </Box>
      );
    case "quote":
      return (
        <Box
          key={`quote-${index}`}
          sx={{
            borderInlineStart: `4px solid ${theme.palette.primary.main}`,
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
            borderRadius: "0 8px 8px 0",
            px: 2,
            py: 1.5,
            my: 2,
            color: theme.palette.text.secondary,
            fontStyle: "italic",
          }}
        >
          {block.text}
        </Box>
      );
    case "divider":
      return (
        <Box
          key={`divider-${index}`}
          component="hr"
          sx={{
            border: "none",
            borderTop: `1px solid ${theme.palette.divider}`,
            my: 2,
          }}
        />
      );
    case "table":
      return (
        <Box
          key={`table-${index}`}
          sx={{
            my: 2,
            overflowX: "auto",
          }}
        >
          {block.caption && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                fontWeight: 600,
                color: theme.palette.text.secondary,
              }}
            >
              {block.caption}
            </Typography>
          )}
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <Box component="thead">
              <Box component="tr">
                {block.headers.map((header, headerIndex) => (
                  <Box
                    key={`header-${headerIndex}`}
                    component="th"
                    sx={{
                      padding: "12px",
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                      fontWeight: 600,
                      textAlign: "left",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {block.rows.map((row, rowIndex) => (
                <Box
                  key={`row-${rowIndex}`}
                  component="tr"
                  sx={{
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.02)"
                        : "rgba(0, 0, 0, 0.02)",
                    },
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <Box
                      key={`cell-${cellIndex}`}
                      component="td"
                      sx={{
                        padding: "12px",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {cell}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      );
    case "report":
      return (
        <Box
          key={`report-${index}`}
          sx={{
            border: `1px solid ${theme.palette.primary.main}`,
            borderRadius: "8px",
            padding: 2,
            my: 2,
            backgroundColor: isDarkMode
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(59, 130, 246, 0.05)",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 1,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => onOpenReport?.(`report://${block.reportId}`)}
          >
            {block.title}
          </Typography>
          {block.summary && (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {block.summary}
            </Typography>
          )}
        </Box>
      );
    default:
      return null;
  }
};

const renderCustomElement = (
  element: { tag: string; attributes?: Record<string, string> },
  index: number,
  theme: Theme,
  isDarkMode: boolean,
  onOpenReport?: (url: string) => void
) => {
  const { tag, attributes = {} } = element;

  switch (tag) {
    case "app-inline-table": {
      const data = decodeBase64Json<{ headers: string[]; rows: string[][] }>(
        attributes.data
      );
      const caption = attributes.caption
        ? decodeBase64Text(attributes.caption)
        : undefined;

      return (
        <Box
          key={`custom-table-${index}`}
          sx={{
            my: 2,
            overflowX: "auto",
          }}
        >
          {caption && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                fontWeight: 600,
                color: theme.palette.text.secondary,
              }}
            >
              {caption}
            </Typography>
          )}
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <Box component="thead">
              <Box component="tr">
                {data.headers.map((header, headerIndex) => (
                  <Box
                    key={`header-${headerIndex}`}
                    component="th"
                    sx={{
                      padding: "12px",
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                      fontWeight: 600,
                      textAlign: "left",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {data.rows.map((row, rowIndex) => (
                <Box
                  key={`row-${rowIndex}`}
                  component="tr"
                  sx={{
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.02)"
                        : "rgba(0, 0, 0, 0.02)",
                    },
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <Box
                      key={`cell-${cellIndex}`}
                      component="td"
                      sx={{
                        padding: "12px",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {cell}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      );
    }

    case "app-table-catation": {
      const data = decodeBase64Json<{ headers: string[]; rows: string[][] }>(
        attributes.data
      );
      const name = attributes.name ? decodeBase64Text(attributes.name) : undefined;

      return (
        <Box
          key={`custom-table-citation-${index}`}
          sx={{
            my: 2,
            borderInlineStart: `4px solid ${theme.palette.primary.main}`,
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
            borderRadius: "0 8px 8px 0",
            padding: 2,
          }}
        >
          {name && (
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, mb: 1, color: theme.palette.primary.main }}
            >
              {name}
            </Typography>
          )}
          <Box
            component="table"
            sx={{
              width: "100%",
              borderCollapse: "collapse",
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <Box component="thead">
              <Box component="tr">
                {data.headers.map((header, headerIndex) => (
                  <Box
                    key={`header-${headerIndex}`}
                    component="th"
                    sx={{
                      padding: "12px",
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.05)",
                      fontWeight: 600,
                      textAlign: "left",
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    {header}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {data.rows.map((row, rowIndex) => (
                <Box
                  key={`row-${rowIndex}`}
                  component="tr"
                  sx={{
                    "&:hover": {
                      backgroundColor: isDarkMode
                        ? "rgba(255, 255, 255, 0.02)"
                        : "rgba(0, 0, 0, 0.02)",
                    },
                  }}
                >
                  {row.map((cell, cellIndex) => (
                    <Box
                      key={`cell-${cellIndex}`}
                      component="td"
                      sx={{
                        padding: "12px",
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      {cell}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      );
    }

    case "app-catation": {
      const text = decodeBase64Text(attributes.text);

      return (
        <Box
          key={`custom-citation-${index}`}
          sx={{
            borderInlineStart: `4px solid ${theme.palette.primary.main}`,
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.05)",
            borderRadius: "0 8px 8px 0",
            px: 2,
            py: 1.5,
            my: 2,
            color: theme.palette.text.secondary,
            fontStyle: "italic",
          }}
        >
          {text}
        </Box>
      );
    }

    case "app-report": {
      const reportData = decodeBase64Json<{
        reportId: string;
        title: string;
        summary?: string;
        metadata?: Record<string, unknown>;
      }>(attributes.data);

      return (
        <Box
          key={`custom-report-${index}`}
          sx={{
            border: `1px solid ${theme.palette.primary.main}`,
            borderRadius: "8px",
            padding: 2,
            my: 2,
            backgroundColor: isDarkMode
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(59, 130, 246, 0.05)",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              mb: 1,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
            onClick={() => onOpenReport?.(`report://${reportData.reportId}`)}
          >
            {reportData.title}
          </Typography>
          {reportData.summary && (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {reportData.summary}
            </Typography>
          )}
        </Box>
      );
    }

    default:
      return null;
  }
};

const CollapsibleSection: React.FC<{
  title: string;
  section: "reasoning" | "tool-t" | "tool-x" | "answer";
  isDarkMode: boolean;
  theme: Theme;
  children: React.ReactNode;
}> = ({ title, section, isDarkMode, theme, children }) => {
  const [expanded, setExpanded] = useState(section === "answer");

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        mb: 2,
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          backgroundColor: isDarkMode
            ? "rgba(255, 255, 255, 0.05)"
            : "rgba(0, 0, 0, 0.05)",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: isDarkMode
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton size="small">
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ padding: 2 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  parsed,
  isDarkMode = true,
  onOpenReport,
  section,
  contentType,
}) => {
  const theme = useTheme();

  const { processedContent, foundReports } = React.useMemo(() => {
    const relevantReports = getRelevantReports(content);
    if (!relevantReports.length) {
      return { processedContent: content, foundReports: relevantReports };
    }

    const referencesBlock = `\n\n**References:**\n${relevantReports
      .map((report) => `[${report.id}] ${report.title}`)
      .join("\n")}`;

    return {
      processedContent: `${content}${referencesBlock}`,
      foundReports: relevantReports,
    };
  }, [content]);

  const parsedContent = React.useMemo(() => {
    if (parsed && processedContent === content) {
      return parsed;
    }

    return buildParsedMessageContent(processedContent);
  }, [parsed, processedContent, content]);

  const sectionTitles: Record<
    "reasoning" | "tool-t" | "tool-x" | "answer",
    string
  > = {
    reasoning: "Reasoning",
    "tool-t": "Tool T",
    "tool-x": "Tool X",
    answer: "Answer",
  };

  const contentWrapper = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        color: theme.palette.text.primary,
      }}
    >
      {parsedContent.blocks.map((block, index) =>
        renderBlock(block, index, theme, isDarkMode, foundReports, onOpenReport)
      )}
      {parsedContent.elements.map((element, index) =>
        renderCustomElement(element, index, theme, isDarkMode, onOpenReport)
      )}
    </Box>
  );

  if (section) {
    return (
      <CollapsibleSection
        title={sectionTitles[section]}
        section={section}
        isDarkMode={isDarkMode}
        theme={theme}
      >
        {contentWrapper}
      </CollapsibleSection>
    );
  }

  return contentWrapper;
};

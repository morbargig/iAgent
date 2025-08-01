import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Box, useTheme } from '@mui/material';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  isDarkMode?: boolean;
  onOpenReport?: (url: string) => void;
}


export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  isDarkMode = true,
  onOpenReport
}) => {
  const theme = useTheme();
  
  // Define available reports with numbers
  const availableReports = [
    {
      id: 1,
      title: 'Q4 2024 Security Audit Report',
      url: 'report://security-audit-2024',
      keywords: ['security', 'audit', 'vulnerability']
    },
    {
      id: 2,
      title: 'System Performance Analysis Report', 
      url: 'report://performance-analysis-2024',
      keywords: ['performance', 'metrics', 'system', 'monitoring']
    }
  ];

  // Function to add report references to content
  const processContentWithReferences = (text: string) => {
    let processedContent = text;
    const foundReports: typeof availableReports = [];

    // Check which reports are relevant based on content
    availableReports.forEach(report => {
      const isRelevant = report.keywords.some(keyword => 
        text.toLowerCase().includes(keyword)
      );
      
      if (isRelevant) {
        foundReports.push(report);
      }
    });

    // Add references to the end if any reports are relevant
    if (foundReports.length > 0) {
      const references = foundReports.map(report => 
        `[${report.id}] ${report.title}`
      ).join('\n');
      
      processedContent += `\n\n**References:**\n${references}`;
    }

    return { processedContent, foundReports };
  };

  const { processedContent, foundReports } = processContentWithReferences(content);

  // Component for clickable report references
  const ReportReference = ({ reportId, reportUrl }: { reportId: number, reportUrl: string }) => (
    <Box
      component="span"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onOpenReport) {
          onOpenReport(reportUrl);
        }
      }}
      sx={{
        display: 'inline-block',
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: '0.8em',
        fontWeight: 600,
        cursor: 'pointer',
        marginInline: '2px',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: theme.palette.primary.dark,
          transform: 'scale(1.1)',
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
    >
      [{reportId}]
    </Box>
  );

  return (
    <Box
      sx={{
        '& p': {
          margin: '0.5em 0',
          lineHeight: 1.7,
          '&:first-of-type': {
            marginTop: 0,
          },
          '&:last-of-type': {
            marginBottom: 0,
          },
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          margin: '1em 0 0.5em 0',
          fontWeight: 600,
          lineHeight: 1.4,
          '&:first-of-type': {
            marginTop: 0,
          },
        },
        '& h1': {
          fontSize: '1.5em',
          borderBottom: `1px solid ${theme.palette.divider}`,
          paddingBottom: '0.3em',
        },
        '& h2': {
          fontSize: '1.3em',
        },
        '& h3': {
          fontSize: '1.1em',
        },
        '& h4, & h5, & h6': {
          fontSize: '1em',
        },
        '& ul, & ol': {
          margin: '0.5em 0',
          paddingInlineStart: '1.5em',
        },
        '& li': {
          margin: '0.25em 0',
          lineHeight: 1.6,
        },
        '& blockquote': {
          margin: '1em 0',
          padding: '0.5em 1em',
          backgroundColor: isDarkMode 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
          borderInlineStart: `4px solid ${theme.palette.primary.main}`,
          borderRadius: '0 6px 6px 0',
          '& p': {
            margin: 0,
          },
        },
        '& code': {
          backgroundColor: isDarkMode 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
          padding: '0.2em 0.4em',
          borderRadius: '4px',
          fontSize: '0.9em',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        },
        '& pre': {
          backgroundColor: isDarkMode ? '#1e1e1e' : '#f6f8fa',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '8px',
          padding: '1em',
          overflow: 'auto',
          margin: '1em 0',
          fontSize: '0.9em',
          lineHeight: 1.4,
          '& code': {
            backgroundColor: 'transparent',
            padding: 0,
            fontSize: 'inherit',
          },
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          margin: '1em 0',
          fontSize: '0.9em',
        },
        '& th, & td': {
          border: `1px solid ${theme.palette.divider}`,
          padding: '8px 12px',
          textAlign: 'left',
        },
        '& th': {
          backgroundColor: isDarkMode 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.05)',
          fontWeight: 600,
        },
        '& hr': {
          border: 'none',
          borderTop: `1px solid ${theme.palette.divider}`,
          margin: '1.5em 0',
        },
        '& strong': {
          fontWeight: 600,
        },
        '& em': {
          fontStyle: 'italic',
        },
        '& del': {
          textDecoration: 'line-through',
          opacity: 0.7,
        },
        // Task list styling
        '& input[type="checkbox"]': {
          marginInlineEnd: '0.5em',
        },
        // Math support placeholder
        '& .math': {
          fontFamily: 'KaTeX_Main, "Times New Roman", serif',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom component to handle [1], [2] references in markdown
          p: ({ children, ...props }: any) => {
            // Check if this paragraph contains [number] patterns
            const content = React.Children.toArray(children).join('');
            
            // Replace [number] with clickable components
            const processedChildren = React.Children.map(children, (child) => {
              if (typeof child === 'string') {
                // Split by [number] pattern and create clickable refs
                const parts = child.split(/(\[\d+\])/g);
                return parts.map((part, index) => {
                  const match = part.match(/^\[(\d+)\]$/);
                  if (match) {
                    const reportId = parseInt(match[1]);
                    const report = foundReports.find(r => r.id === reportId);
                    if (report) {
                      return (
                        <ReportReference 
                          key={`ref-${reportId}-${index}`}
                          reportId={reportId} 
                          reportUrl={report.url} 
                        />
                      );
                    }
                  }
                  return part;
                });
              }
              return child;
            });

            return <p {...props}>{processedChildren}</p>;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </Box>
  );
}; 
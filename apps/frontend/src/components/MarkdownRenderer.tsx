import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Box, useTheme } from '@mui/material';
import 'highlight.js/styles/github-dark.css';

interface MarkdownRendererProps {
  content: string;
  isDarkMode?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  isDarkMode = true 
}) => {
  const theme = useTheme();

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
          paddingLeft: '1.5em',
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
          borderLeft: `4px solid ${theme.palette.primary.main}`,
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
        '& a': {
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
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
          marginRight: '0.5em',
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
          // Custom component overrides if needed
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}; 
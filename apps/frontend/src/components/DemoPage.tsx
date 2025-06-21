import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AdvancedSearchInterface } from './AdvancedSearchInterface';

interface DemoPageProps {
  isDarkMode: boolean;
  onBack?: () => void;
}

export function DemoPage({ isDarkMode, onBack }: DemoPageProps) {
  const handleSearch = (query: string, filters: any) => {
    console.log('Search Query:', query);
    console.log('Filters:', filters);
    // Here you would typically handle the search logic
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
        padding: 3,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 3,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            color: isDarkMode ? '#ffffff' : '#333333',
            fontWeight: 600,
          }}
        >
          Advanced Search Interface Demo
        </Typography>
        {onBack && (
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            Back to Chat
          </Button>
        )}
      </Box>

      {/* Advanced Search Interface */}
      <AdvancedSearchInterface
        isDarkMode={isDarkMode}
        onSearch={handleSearch}
      />

      {/* Instructions */}
      <Box
        sx={{
          marginTop: 4,
          padding: 3,
          backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
          borderRadius: 3,
          border: `1px solid ${isDarkMode ? '#404040' : '#e0e0e0'}`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            marginBottom: 2,
            color: isDarkMode ? '#ffffff' : '#333333',
            fontWeight: 600,
          }}
        >
          Features Implemented:
        </Typography>
        <ul style={{ color: isDarkMode ? '#cccccc' : '#666666' }}>
          <li><strong>הדרות נוספות (Additional Settings)</strong> - Top section with filter input and toggle switches</li>
          <li><strong>AMI Product Filters</strong> - Two toggle options for including/excluding AMI products</li>
          <li><strong>Language Selection</strong> - Flag icons for Hebrew, Arabic, and English</li>
          <li><strong>Date Range Selector</strong> - Calendar icon with dropdown for selecting time range</li>
          <li><strong>Settings Button</strong> - Gear icon for additional configuration</li>
          <li><strong>Main Search Input</strong> - Large text field with "Ask anything..." placeholder</li>
          <li><strong>Mode Buttons</strong> - Three buttons: חינם (Free), flow, תוצר (Product)</li>
          <li><strong>RTL Support</strong> - Proper right-to-left layout for Hebrew text</li>
          <li><strong>Dark/Light Mode</strong> - Adapts to theme changes</li>
          <li><strong>Responsive Design</strong> - Works on different screen sizes</li>
        </ul>
      </Box>
    </Box>
  );
} 
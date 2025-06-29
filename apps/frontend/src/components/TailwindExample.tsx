import React from 'react';
import { Button, Card, CardContent, Typography, Box } from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';

interface TailwindExampleProps {
  isDarkMode: boolean;
}

/**
 * Example component demonstrating the integration of Material-UI with Tailwind CSS
 * following the iAgent style guide patterns.
 */
export const TailwindExample: React.FC<TailwindExampleProps> = ({ isDarkMode }) => {
  return (
    <div className="max-w-4xl mx-auto p-lg space-y-lg">
      {/* Header Section */}
      <div className="text-center space-y-md">
        <Typography 
          variant="h4" 
          className="font-semibold"
          sx={{ color: isDarkMode ? '#ffffff' : '#1a1a1a' }}
        >
          Material-UI + Tailwind Integration
        </Typography>
        <Typography 
          variant="body1" 
          className="text-sm opacity-80"
          sx={{ color: isDarkMode ? '#cccccc' : '#666666' }}
        >
          Demonstrating the hybrid approach with design tokens
        </Typography>
      </div>

      {/* Example Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
        
        {/* Card 1: Pure Material-UI */}
        <Card
          sx={{
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
            border: `1px solid ${isDarkMode ? '#444444' : '#e1e5e9'}`,
            borderRadius: '12px',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: isDarkMode ? '#525252' : '#d1d5db',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <CardContent sx={{ p: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: isDarkMode ? '#ffffff' : '#000000',
                fontWeight: 600,
                mb: 1 
              }}
            >
              Pure MUI
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: isDarkMode ? '#cccccc' : '#666666' }}
            >
              Styled entirely with Material-UI sx prop and theme system.
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<StarIcon />}
              sx={{
                mt: 2,
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb',
                },
              }}
            >
              MUI Button
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Tailwind + MUI Hybrid */}
        <Card className="bg-background-secondary dark:bg-dark-background-secondary border border-border dark:border-dark-border rounded-lg shadow-none transition-all duration-normal hover:border-gray-400 dark:hover:border-gray-500 hover:-translate-y-0.5">
          <CardContent className="p-md">
            <Typography 
              variant="h6" 
              className="font-semibold mb-sm text-text-primary dark:text-dark-text-primary"
            >
              Hybrid Approach
            </Typography>
            <Typography 
              variant="body2" 
              className="text-text-secondary dark:text-dark-text-secondary mb-md"
            >
              Combining Tailwind utilities with MUI components for optimal flexibility.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<StarIcon />}
              className="normal-case rounded-lg border-accent text-accent hover:bg-accent hover:text-white transition-all duration-normal"
            >
              Hybrid Button
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Design Tokens Demo */}
        <Card
          sx={{
            backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
            border: `1px solid ${isDarkMode ? '#444444' : '#e1e5e9'}`,
            borderRadius: '12px',
            boxShadow: 'none',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: isDarkMode ? '#525252' : '#d1d5db',
              transform: 'translateY(-2px)',
            },
          }}
        >
          <CardContent className="p-md">
            <Typography 
              variant="h6" 
              className="font-semibold mb-sm"
              sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}
            >
              Design Tokens
            </Typography>
            
            {/* Spacing Examples */}
            <Box className="space-y-xs mb-md">
              <div className="h-xs bg-accent rounded-sm"></div>
              <div className="h-sm bg-semantic-success rounded-sm"></div>
              <div className="h-md bg-semantic-warning rounded-sm"></div>
            </Box>
            
            {/* Typography Scale */}
            <div className="space-y-xs mb-md">
              <Typography className="text-xs font-normal text-text-secondary dark:text-dark-text-secondary">
                Extra Small (12px)
              </Typography>
              <Typography className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                Small (14px)
              </Typography>
              <Typography className="text-base font-semibold text-text-primary dark:text-dark-text-primary">
                Base (16px)
              </Typography>
            </div>
            
            <Button
              variant="contained"
              size="small"
              className="w-full"
              sx={{
                textTransform: 'none',
                borderRadius: '8px',
                backgroundColor: '#10b981',
                '&:hover': {
                  backgroundColor: '#059669',
                },
              }}
            >
              Design System
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Utility Classes Demo */}
      <Card className="bg-background-secondary dark:bg-dark-background-secondary border border-border dark:border-dark-border rounded-xl shadow-subtle dark:shadow-dark-subtle">
        <CardContent className="p-lg">
          <Typography 
            variant="h5" 
            className="font-semibold mb-lg text-center text-text-primary dark:text-dark-text-primary"
          >
            Tailwind Utilities in Action
          </Typography>
          
          {/* Responsive Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
            {['Responsive', 'Flexbox', 'Grid', 'Spacing'].map((item, index) => (
              <div 
                key={item}
                className="p-md text-center rounded-lg bg-accent/10 dark:bg-dark-accent/10 border border-accent/20 dark:border-dark-accent/20 hover:bg-accent/20 dark:hover:bg-dark-accent/20 transition-colors duration-normal cursor-pointer"
              >
                <Typography 
                  variant="body2" 
                  className="font-medium text-accent dark:text-dark-accent"
                >
                  {item}
                </Typography>
              </div>
            ))}
          </div>
          
          {/* Flexbox Demo */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-md p-md bg-background-tertiary dark:bg-dark-background-tertiary rounded-lg">
            <Typography 
              variant="body1" 
              className="font-medium text-text-primary dark:text-dark-text-primary"
            >
              Flexbox Layout with Responsive Behavior
            </Typography>
            <div className="flex gap-sm">
              <Button
                variant="outlined"
                size="small"
                className="normal-case rounded-md border-semantic-info text-semantic-info hover:bg-semantic-info hover:text-white"
              >
                Action 1
              </Button>
              <Button
                variant="contained"
                size="small"
                className="normal-case rounded-md bg-semantic-success hover:bg-semantic-success-dark"
              >
                Action 2
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Best Practices */}
      <Card className="bg-background-secondary dark:bg-dark-background-secondary border border-border dark:border-dark-border rounded-xl">
        <CardContent className="p-lg">
          <Typography 
            variant="h6" 
            className="font-semibold mb-md text-text-primary dark:text-dark-text-primary"
          >
            🎯 Best Practices for Hybrid Approach
          </Typography>
          
          <div className="space-y-sm text-sm text-text-secondary dark:text-dark-text-secondary">
            <div className="flex items-start gap-sm">
              <span className="text-semantic-success font-bold">✓</span>
              <span>Use Tailwind for layout, spacing, and responsive design</span>
            </div>
            <div className="flex items-start gap-sm">
              <span className="text-semantic-success font-bold">✓</span>
              <span>Use Material-UI for interactive components and theming</span>
            </div>
            <div className="flex items-start gap-sm">
              <span className="text-semantic-success font-bold">✓</span>
              <span>Combine both with design tokens for consistency</span>
            </div>
            <div className="flex items-start gap-sm">
              <span className="text-semantic-success font-bold">✓</span>
              <span>Disable Tailwind's preflight to avoid MUI conflicts</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 
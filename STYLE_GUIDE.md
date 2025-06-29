# iAgent Project Style Guide

## 🎨 Overview

This document outlines the design system and style guidelines for the iAgent project. Use this guide when generating new components or when working with AI assistants to ensure consistency across the application.

---

## 🏗️ Design System Architecture

The project uses a **hybrid approach** combining:
- **Material-UI (MUI)** as the primary component library
- **Custom Design Tokens** for consistent theming
- **Tailwind CSS** for utility-first styling
- **Dark/Light Mode** support throughout

---

## 🎭 Design Philosophy

### Core Principles
- **Clean & Minimal**: iagent-inspired aesthetic with subtle interactions
- **Accessible**: WCAG compliant with proper contrast ratios
- **Responsive**: Mobile-first design approach
- **RTL Support**: Hebrew/Arabic language support
- **Performance**: Optimized animations and interactions

### Visual Language
- **Muted Color Palette**: Subtle, professional colors
- **Generous Spacing**: Clean layouts with proper breathing room
- **Soft Borders**: 8px-16px border radius for modern feel
- **Subtle Shadows**: Minimal elevation effects

---

## 🎨 Design Tokens

### Typography
```typescript
typography: {
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  sizes: {
    xs: '12px',      // Captions, metadata
    sm: '14px',      // Body text, secondary content
    base: '16px',    // Primary body text
    lg: '18px',      // Subheadings
    xl: '20px',      // Headings
  },
  weights: {
    normal: 400,     // Regular text
    medium: 500,     // Emphasized text
    semibold: 600,   // Headings, labels
  },
  lineHeight: 1.7,   // Generous for readability
}
```

### Spacing System
```typescript
spacing: {
  xs: '4px',        // Tight spacing
  sm: '8px',        // Small gaps
  md: '16px',       // Standard spacing
  lg: '24px',       // Section spacing
  xl: '32px',       // Large spacing
  '2xl': '48px',    // Component separation
}
```

### Border Radius
```typescript
borderRadius: {
  sm: '6px',        // Small elements
  md: '8px',        // Standard components
  lg: '12px',       // Cards, buttons
  xl: '16px',       // Large containers
  '2xl': '24px',    // Hero sections
  '3xl': '32px',    // Modal dialogs
}
```

### Animation
```typescript
animation: {
  duration: {
    fast: '150ms',    // Quick interactions
    normal: '250ms',  // Standard transitions
    slow: '400ms',    // Complex animations
  },
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Material Design easing
}
```

---

## 🌈 Color System

### Light Theme
```typescript
colors: {
  light: {
    background: {
      primary: '#ffffff',
      secondary: '#f8f9fa',
      tertiary: '#f1f3f5',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      tertiary: '#999999',
    },
    accent: '#3b82f6',        // Primary blue
    border: '#e1e5e9',
    hover: 'rgba(0, 0, 0, 0.04)',
  }
}
```

### Dark Theme
```typescript
colors: {
  dark: {
    background: {
      primary: '#1a1a1a',
      secondary: '#2d2d2d',
      tertiary: '#404040',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
      tertiary: '#999999',
    },
    accent: '#60a5fa',        // Lighter blue for dark mode
    border: '#444444',
    hover: 'rgba(255, 255, 255, 0.08)',
  }
}
```

### Semantic Colors
```typescript
semantic: {
  success: { light: '#10b981', dark: '#34d399' },
  warning: { light: '#f59e0b', dark: '#fbbf24' },
  error: { light: '#ef4444', dark: '#f87171' },
  info: { light: '#3b82f6', dark: '#60a5fa' },
}
```

---

## 🧩 Component Patterns

### Button Styling
```typescript
// Standard Button Pattern
<Button
  variant="contained" | "outlined" | "text"
  size="small" | "medium" | "large"
  startIcon={<Icon />}
  sx={{
    textTransform: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '13px',
    minWidth: '90px',
    height: '36px',
    px: 2,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  }}
>
  Button Text
</Button>
```

### Card/Container Pattern
```typescript
<Card
  sx={{
    backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
    border: `1px solid ${isDarkMode ? '#444444' : '#e1e5e9'}`,
    borderRadius: '12px',
    boxShadow: 'none',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: isDarkMode ? '#525252' : '#d1d5db',
    },
  }}
>
  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
    {/* Content */}
  </CardContent>
</Card>
```

### Input Field Pattern
```typescript
<TextField
  variant="outlined"
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: isDarkMode ? '#404040' : '#f8f9fa',
      transition: 'all 0.2s ease-in-out',
      '& fieldset': {
        borderColor: isDarkMode ? '#666666' : '#cccccc',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? '#888888' : '#999999',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#3b82f6',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDarkMode ? '#cccccc' : '#666666',
      '&.Mui-focused': {
        color: '#3b82f6',
      },
    },
  }}
/>
```

### Dialog/Modal Pattern
```typescript
<Dialog
  open={open}
  onClose={onClose}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
      borderRadius: '12px',
      border: `1px solid ${isDarkMode ? '#444444' : '#e1e5e9'}`,
    },
  }}
>
  <DialogTitle sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
    Title
  </DialogTitle>
  <DialogContent>
    {/* Content */}
  </DialogContent>
  <DialogActions>
    {/* Actions */}
  </DialogActions>
</Dialog>
```

---

## 🛠️ Tailwind CSS Integration

### Configuration
The project includes Tailwind CSS for utility-first styling alongside Material-UI.

### Usage Guidelines
1. **Use Tailwind for**: Layout utilities, spacing, responsive design
2. **Use Material-UI for**: Interactive components, theming, complex UI elements
3. **Combine Both**: Use MUI components with Tailwind utility classes

### Example Integration
```jsx
<Box className="flex flex-col gap-4 p-6 md:flex-row md:gap-6">
  <Button
    variant="contained"
    className="w-full md:w-auto"
    sx={{ /* MUI styling */ }}
  >
    Hybrid Button
  </Button>
</Box>
```

---

## 📱 Responsive Design

### Breakpoints
```typescript
breakpoints: {
  xs: '0px',      // Mobile
  sm: '600px',    // Small tablet
  md: '900px',    // Tablet
  lg: '1200px',   // Desktop
  xl: '1536px',   // Large desktop
}
```

### Mobile-First Approach
```typescript
// Always start with mobile styles, then enhance
sx={{
  // Mobile styles (default)
  fontSize: '14px',
  padding: '8px',
  
  // Tablet and up
  [theme.breakpoints.up('md')]: {
    fontSize: '16px',
    padding: '12px',
  },
  
  // Desktop and up
  [theme.breakpoints.up('lg')]: {
    fontSize: '18px',
    padding: '16px',
  },
}}
```

---

## 🌍 Internationalization (i18n)

### RTL Support
```typescript
// RTL-aware styling
sx={{
  marginInlineStart: '16px',  // Use logical properties
  marginInlineEnd: '8px',
  textAlign: 'start',         // Instead of 'left'
  
  // RTL-specific overrides
  'html[dir="rtl"] &': {
    transform: 'scaleX(-1)',  // Flip icons if needed
  },
}}
```

### Language-Specific Styling
```typescript
// Different fonts for different languages
sx={{
  fontFamily: currentLang === 'ar' 
    ? 'Amiri, serif'
    : currentLang === 'he'
    ? 'Assistant, sans-serif'
    : 'system-ui, sans-serif',
}}
```

---

## 🎯 Component Development Guidelines

### When Creating New Components

1. **Start with Design Tokens**: Always use the defined spacing, colors, and typography scales
2. **Theme Support**: Ensure both dark and light mode compatibility
3. **Responsive Design**: Implement mobile-first responsive behavior
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **Performance**: Use React.memo() for expensive components
6. **TypeScript**: Provide comprehensive type definitions

### Example Component Template
```typescript
import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

interface MyComponentProps {
  title: string;
  isDarkMode: boolean;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  isDarkMode,
  variant = 'primary',
  onClick,
}) => {
  const theme = useTheme();
  
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2,
        borderRadius: '8px',
        backgroundColor: isDarkMode ? '#2d2d2d' : '#f8f9fa',
        border: `1px solid ${isDarkMode ? '#444444' : '#e1e5e9'}`,
        transition: 'all 0.2s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        
        '&:hover': onClick ? {
          borderColor: isDarkMode ? '#525252' : '#d1d5db',
          transform: 'translateY(-1px)',
        } : {},
        
        // Responsive behavior
        [theme.breakpoints.down('md')]: {
          p: 1.5,
        },
      }}
    >
      <Typography
        variant={variant === 'primary' ? 'h6' : 'body1'}
        sx={{
          color: isDarkMode ? '#ffffff' : '#000000',
          fontWeight: variant === 'primary' ? 600 : 400,
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};
```

---

## 🔧 Development Tools

### ESLint Configuration
- Material-UI specific rules enabled
- Accessibility checks included
- Performance optimizations enforced

### VS Code Extensions (Recommended)
- ES7+ React/Redux/React-Native snippets
- Material-UI snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

---

## 📋 AI Assistant Prompts

### For Component Generation
When asking AI to generate components, use this prompt template:

```
Create a React component following the iAgent style guide:
- Use Material-UI with the custom design tokens
- Support both dark and light themes with isDarkMode prop
- Follow the typography scale (xs: 12px, sm: 14px, base: 16px, lg: 18px, xl: 20px)
- Use the spacing system (xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px)
- Apply border radius of 8px for standard components
- Include smooth transitions (0.2s ease-in-out)
- Ensure mobile-first responsive design
- Add proper TypeScript types
- Include hover effects with subtle transform and shadow
- Use semantic colors for status indicators
- Support RTL languages where applicable
```

### Color Reference for AI
```
Light theme colors:
- Background: #ffffff, #f8f9fa, #f1f3f5
- Text: #1a1a1a, #666666, #999999
- Accent: #3b82f6
- Border: #e1e5e9

Dark theme colors:
- Background: #1a1a1a, #2d2d2d, #404040
- Text: #ffffff, #cccccc, #999999
- Accent: #60a5fa
- Border: #444444
```

---

## 📚 Examples & References

### Existing Components to Reference
- `ChatArea.tsx` - Complex layout with Material-UI theming
- `FilterPreview.tsx` - Card-based component with proper styling
- `LoginForm.tsx` - Form component with gradient backgrounds
- `Sidebar.tsx` - Navigation component with responsive behavior
- `LanguageSwitcher.tsx` - Dropdown component with custom styling

### Best Practices Implemented
- Consistent use of design tokens
- Proper theme integration
- Responsive breakpoints
- Accessibility considerations
- Performance optimizations
- Clean component composition

---

## 🚀 Getting Started

1. **Review this guide** before creating new components
2. **Use existing components** as references for patterns
3. **Test both themes** (dark/light) during development
4. **Verify mobile responsiveness** on different screen sizes
5. **Check RTL support** for international users
6. **Validate accessibility** with screen readers

---

*This style guide is a living document. Update it as the design system evolves.* 
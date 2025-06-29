const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // Extend with our design tokens from the style guide
      colors: {
        // Light theme colors
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
        accent: '#3b82f6',
        border: '#e1e5e9',
        hover: 'rgba(0, 0, 0, 0.04)',
        
        // Dark theme colors (with 'dark' prefix)
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
          accent: '#60a5fa',
          border: '#444444',
          hover: 'rgba(255, 255, 255, 0.08)',
        },
        
        // Semantic colors
        semantic: {
          success: '#10b981',
          'success-dark': '#34d399',
          warning: '#f59e0b',
          'warning-dark': '#fbbf24',
          error: '#ef4444',
          'error-dark': '#f87171',
          info: '#3b82f6',
          'info-dark': '#60a5fa',
        },
      },
      
      // Typography scale from design tokens
      fontSize: {
        xs: ['12px', { lineHeight: '1.7' }],
        sm: ['14px', { lineHeight: '1.7' }],
        base: ['16px', { lineHeight: '1.7' }],
        lg: ['18px', { lineHeight: '1.7' }],
        xl: ['20px', { lineHeight: '1.7' }],
      },
      
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      
      // Spacing system from design tokens
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      
      // Border radius from design tokens
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      
      // Animation from design tokens
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      
      transitionTimingFunction: {
        'material': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      // Shadows for elevation
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'modal': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'dark-subtle': '0 1px 3px rgba(0, 0, 0, 0.3)',
        'dark-elevated': '0 4px 12px rgba(0, 0, 0, 0.4)',
        'dark-modal': '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
  // Ensure Tailwind works well with Material-UI
  corePlugins: {
    preflight: false, // Disable Tailwind's reset to avoid conflicts with MUI
  },
}; 
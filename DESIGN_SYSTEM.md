# iAgent Design System & Style Guide

A comprehensive design system for creating consistent, modern, and accessible interfaces across the iAgent platform.

## 🎨 Color Palette

### Core Philosophy
- **Muted & Clean**: Avoiding harsh contrasts, favoring subtle, accessible tones
- **Consistent Accent**: Single blue accent color across all themes
- **Semantic Colors**: Clear meaning with status, priority, and interactive states

### Dark Theme (Primary)
```css
/* Background Hierarchy */
--bg-primary: #0a0a0a     /* Deep, clean background */
--bg-secondary: #171717   /* Subtle elevation (sidebars, panels) */
--bg-tertiary: #262626    /* Cards, elevated surfaces */
--bg-muted: #404040       /* Muted backgrounds (message bubbles) */

/* Text Hierarchy */
--text-primary: #fafafa   /* High contrast text */
--text-secondary: #a3a3a3 /* Muted text (descriptions, labels) */
--text-tertiary: #737373  /* Subtle text (metadata, timestamps) */

/* Interactive Elements */
--accent: #3b82f6         /* Clean blue accent (buttons, links, references) */
--border: #262626         /* Subtle borders */
--hover: rgba(255, 255, 255, 0.05) /* Gentle hover state */
```

### Light Theme
```css
/* Background Hierarchy */
--bg-primary: #ffffff     /* Pure white */
--bg-secondary: #f9fafb   /* Subtle gray (sidebars, panels) */
--bg-tertiary: #f3f4f6    /* Muted background (cards) */
--bg-muted: #e5e7eb       /* Muted surfaces (message bubbles) */

/* Text Hierarchy */
--text-primary: #111827   /* Clean dark text */
--text-secondary: #6b7280 /* Muted text */
--text-tertiary: #9ca3af  /* Subtle text */

/* Interactive Elements */
--accent: #3b82f6         /* Consistent blue accent */
--border: #e5e7eb         /* Light borders */
--hover: rgba(0, 0, 0, 0.05) /* Gentle hover state */
```

### Status & Priority Colors
```css
/* Report Priority Indicators */
--priority-critical: #dc2626  /* Red - Critical priority */
--priority-high: #f59e0b      /* Orange/Yellow - High priority */
--priority-medium: #3b82f6    /* Blue - Medium priority */
--priority-low: #10b981       /* Green - Low priority */

/* Report Status Indicators */
--status-published: #10b981   /* Green - Published/Active */
--status-draft: #f59e0b       /* Yellow - Draft/Pending */
--status-archived: #6b7280    /* Gray - Archived/Inactive */
```

## 📏 Spacing System

### Systematic Spacing Scale
```css
--spacing-xs: 4px    /* Tight spacing (chip padding, small gaps) */
--spacing-sm: 8px    /* Small spacing (between related elements) */
--spacing-md: 16px   /* Standard spacing (padding, margins) */
--spacing-lg: 24px   /* Large spacing (section separation) */
--spacing-xl: 32px   /* Extra large spacing (major sections) */
--spacing-2xl: 48px  /* Maximum spacing (page-level separation) */
```

### Application Examples
- **Component Padding**: 16px (md)
- **Panel Content**: 16px (md) padding
- **Section Separation**: 24px (lg) margin
- **Button Padding**: 8px 16px (sm/md combination)
- **Reference Badge**: 2px 6px (xs/sm combination)

## 🔄 Border Radius

### Systematic Curves
```css
--radius-sm: 6px    /* Small elements (badges, small buttons) */
--radius-md: 8px    /* Standard elements (cards, inputs) */
--radius-lg: 12px   /* Medium elements (panels, dialogs) */
--radius-xl: 16px   /* Large elements (major panels) */
--radius-2xl: 24px  /* Input areas, major containers */
--radius-3xl: 32px  /* Special cases (large buttons) */
```

### Usage Guidelines
- **Report Reference Badges**: 4px (small, subtle)
- **Input Areas**: 24px (friendly, approachable)
- **Panels & Cards**: 8px (clean, modern)
- **Buttons**: 8px (consistent with cards)

## ✨ Animation & Transitions

### Duration Standards
```css
--duration-fast: 150ms    /* Quick interactions (hover, active) */
--duration-normal: 200ms  /* Standard transitions (color, opacity) */
--duration-slow: 300ms    /* Layout changes (resize, panel open/close) */
```

### Easing Function
```css
--easing: cubic-bezier(0.4, 0, 0.2, 1) /* Smooth, natural movement */
```

### Common Transition Patterns
```css
/* Standard Element Transition */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Hover State Transition */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Layout Changes */
transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

## 📚 Typography Scale

### Font System
```css
font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Type Scale
```css
/* Headings */
--text-h1: 24px, weight 600, line-height 1.2  /* Major headings */
--text-h2: 20px, weight 600, line-height 1.3  /* Section titles */
--text-h3: 18px, weight 600, line-height 1.4  /* Subsection titles */

/* Body Text */
--text-body: 16px, weight 400, line-height 1.5    /* Main content */
--text-body-sm: 14px, weight 400, line-height 1.5 /* Secondary content */
--text-caption: 13px, weight 400, line-height 1.4 /* Metadata, labels */

/* Interactive Elements */
--text-button: 14px, weight 600                    /* Button text */
--text-reference: 12px, weight 600                 /* [1], [2] badges */
```

## 🎯 Component Patterns

### Report Reference System
The signature feature for linking to detailed reports within text.

```html
<!-- Visual Pattern -->
<span class="report-reference">[1]</span>
<span class="report-reference">[2]</span>

<!-- Styling -->
.report-reference {
  display: inline-block;
  background-color: var(--accent);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin: 0 2px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.report-reference:hover {
  background-color: var(--accent-dark);
  transform: scale(1.1);
}

.report-reference:active {
  transform: scale(0.95);
}
```

### Panel System
Consistent panel layout for sidebars, report details, and overlays.

```css
.panel-container {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.panel-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* Custom Scrollbar */
.panel-content::-webkit-scrollbar {
  width: 4px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 2px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
```

### Status Badges
For report status, priority, and other categorical information.

```css
.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Status Variants */
.status-badge--published {
  background-color: rgba(16, 185, 129, 0.2);
  color: var(--status-published);
}

.status-badge--draft {
  background-color: rgba(245, 158, 11, 0.2);
  color: var(--status-draft);
}

.status-badge--critical {
  background-color: rgba(220, 38, 38, 0.2);
  color: var(--priority-critical);
}
```

### Input Areas
Modern, rounded input styling with focus states.

```css
.input-container {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 16px;
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.input-container:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-container:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

textarea {
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 16px;
  line-height: 1.5;
  resize: none;
}
```

## 🎛️ Interactive Elements

### Button Hierarchy
```css
/* Primary Button (main actions) */
.button-primary {
  background-color: var(--accent);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button-primary:hover {
  background-color: var(--accent-dark);
  transform: translateY(-1px);
}

/* Secondary Button (supporting actions) */
.button-secondary {
  background-color: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

.button-secondary:hover {
  background-color: rgba(59, 130, 246, 0.1);
}
```

### Hover States
```css
/* Subtle Scale Interaction */
.interactive-element:hover {
  transform: scale(1.02);
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Lift Effect */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

## 📱 Responsive Breakpoints

### Breakpoint System
```css
/* Mobile First Approach */
@media (max-width: 768px) {
  /* Mobile adjustments */
  .panel-system { display: none; } /* Hide panels on mobile */
  .spacing { padding: 8px; } /* Reduce spacing */
}

@media (min-width: 769px) {
  /* Desktop enhancements */
  .panel-system { display: flex; }
  .hover-effects { /* Enable hover states */ }
}
```

## 🔍 Accessibility Guidelines

### Color Contrast
- **Text on Background**: Minimum 4.5:1 ratio
- **Interactive Elements**: Minimum 3:1 ratio
- **Status Indicators**: Use color + text/icons

### Focus States
```css
.focusable:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

### Motion Preferences
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🛠️ Implementation Examples

### Report Reference in Content
```html
<p>
  The security audit findings show strong network security 
  <span class="report-reference" onclick="openReport('security-audit-2024')">[1]</span> 
  with some application vulnerabilities identified.
</p>

<section class="references-section">
  <h3>References:</h3>
  <p>[1] Q4 2024 Security Audit Report</p>
</section>
```

### Panel Layout Structure
```html
<div class="panel-container">
  <div class="panel-header">
    <h2>Report Details</h2>
    <button class="close-button">×</button>
  </div>
  
  <div class="panel-content">
    <div class="status-badges">
      <span class="status-badge status-badge--published">Published</span>
      <span class="status-badge status-badge--critical">High Priority</span>
    </div>
    
    <div class="report-content">
      <!-- Report content here -->
    </div>
  </div>
</div>
```

### Chat Message with References
```html
<div class="message-container">
  <div class="message-content">
    <p>I have the latest security information. Check the detailed report 
    <span class="report-reference">[1]</span> for complete analysis.</p>
  </div>
  
  <div class="message-references">
    <p><strong>References:</strong></p>
    <p>[1] Q4 2024 Security Audit Report</p>
  </div>
</div>
```

## 🎯 Key Design Principles

### 1. **Consistency First**
- Use the systematic spacing scale
- Maintain consistent border radius
- Apply unified color palette

### 2. **Subtle Interactions**
- Gentle hover states
- Smooth transitions
- Non-intrusive animations

### 3. **Academic Reference Style**
- Numbered references [1], [2], [3]
- Clean, clickable badges
- References section at bottom

### 4. **Clean Information Hierarchy**
- Clear typography scale
- Consistent spacing
- Logical color usage

### 5. **Accessibility by Default**
- High contrast ratios
- Focus indicators
- Semantic markup

## 🚀 Quick Start Checklist

When creating new components:

- [ ] Use systematic spacing scale (4px, 8px, 16px, 24px, 32px, 48px)
- [ ] Apply consistent border radius (4px for small, 8px for standard, 24px for input areas)
- [ ] Use color palette variables, not hardcoded colors
- [ ] Include hover states with 150ms transitions
- [ ] Implement numbered reference pattern for reports [1], [2]
- [ ] Add focus states for keyboard navigation
- [ ] Test in both light and dark themes
- [ ] Ensure mobile responsiveness

---

*This design system ensures consistent, accessible, and modern interfaces across the iAgent platform. All components should follow these patterns for a cohesive user experience.* 
# iAgent App Layout Structure

This document outlines all the semantic IDs and CSS classes added to the iAgent application components for better maintainability and styling control.

## App Root Structure

### Main App Container (`apps/frontend/src/app/app.tsx`)

```html
<!-- Main App Container -->
<div id="iagent-app-root" class="iagent-app-container">
  <!-- Main Layout Container -->
  <div id="iagent-main-layout" class="iagent-layout-horizontal">
    <!-- Sidebar Container -->
    <div id="iagent-sidebar" class="iagent-sidebar-wrapper">
      <!-- Sidebar content... -->
    </div>
    
    <!-- Conversation Area Container -->
    <div id="iagent-conversation-container" class="iagent-conversation-area">
      <!-- Chat Area -->
      <div id="iagent-chat-area" class="iagent-chat-container">
        <!-- Chat content... -->
      </div>
      
      <!-- Input Area -->
      <div id="iagent-input-area" class="iagent-input-container">
        <!-- Input content... -->
      </div>
    </div>
  </div>
</div>
```

## Sidebar Structure (`apps/frontend/src/components/Sidebar.tsx`)

```html
<!-- Sidebar Wrapper -->
<div id="iagent-sidebar" class="iagent-sidebar-wrapper">
  <!-- Sidebar Content -->
  <div id="iagent-sidebar-content" class="iagent-sidebar-container">
    <!-- Sidebar Header -->
    <div id="iagent-sidebar-header" class="iagent-sidebar-header-section">
      <!-- Mobile Close Button -->
      <button id="iagent-sidebar-close" class="iagent-mobile-close-button no-rtl-transform">
      
      <!-- New Chat Button -->
      <button id="iagent-new-chat-button" class="iagent-new-conversation-button">
    </div>
    
    <!-- Conversations List -->
    <div id="iagent-conversations-list" class="iagent-sidebar-conversations">
      <!-- Individual conversation items with dynamic IDs -->
    </div>
    
    <!-- Sidebar Footer -->
    <div id="iagent-sidebar-footer" class="iagent-sidebar-footer-section">
      <!-- Theme Toggle Button -->
      <button id="iagent-theme-toggle" class="iagent-theme-switch-button">
    </div>
  </div>
</div>
```

## Chat Area Structure (`apps/frontend/src/components/ChatArea.tsx`)

### Chat Area with Messages
```html
<!-- Chat Area Container -->
<div id="iagent-chat-area" class="iagent-chat-container">
  <!-- Chat Header -->
  <div id="iagent-chat-header" class="iagent-header-section">
    <!-- Header controls... -->
  </div>
  
  <!-- Messages Container -->
  <div id="iagent-messages-container" class="iagent-messages-scroll-area">
    <!-- Messages List -->
    <div id="iagent-messages-list" class="iagent-messages-content">
      <!-- Individual Message Items -->
      <div id="iagent-message-{messageId}" class="iagent-message-item iagent-message-{role}">
        <!-- Message bubble content... -->
      </div>
    </div>
    
    <!-- Loading Indicator -->
    <div id="iagent-typing-indicator" class="iagent-loading-state">
      <!-- Typing animation... -->
    </div>
    
    <!-- Spacer -->
    <div id="iagent-messages-spacer" class="iagent-flex-spacer">
    
    <!-- Scroll Anchor -->
    <div id="iagent-scroll-anchor" class="iagent-scroll-target">
  </div>
</div>
```

### Welcome Screen
```html
<!-- Welcome Screen Container -->
<div id="iagent-welcome-screen" class="iagent-welcome-container">
  <!-- Welcome Header -->
  <div id="iagent-welcome-header" class="iagent-header-section">
    <!-- Header controls... -->
  </div>
  
  <!-- Welcome Content -->
  <div id="iagent-welcome-content" class="iagent-welcome-main">
    <!-- Welcome Title -->
    <h4 id="iagent-welcome-title" class="iagent-welcome-heading">
    
    <!-- Welcome Text Container -->
    <div id="iagent-welcome-text" class="iagent-welcome-description">
      <!-- Welcome Subtitle -->
      <p id="iagent-welcome-subtitle" class="iagent-welcome-subtitle">
      
      <!-- Welcome Description -->
      <p id="iagent-welcome-description" class="iagent-welcome-body">
    </div>
  </div>
</div>
```

## Input Area Structure (`apps/frontend/src/components/InputArea.tsx`)

```html
<!-- Input Area Container -->
<div id="iagent-input-area" class="iagent-input-container">
  <!-- Input Content Wrapper -->
  <div id="iagent-input-content" class="iagent-input-content-wrapper">
    <!-- Main Input Form Container -->
    <div id="iagent-input-form" class="iagent-input-form-container">
      <!-- Main Textarea -->
      <textarea id="iagent-message-input" class="iagent-textarea-input">
      
      <!-- Input Controls Row -->
      <div id="iagent-input-controls" class="iagent-controls-row">
        <!-- Left Control Group -->
        <div id="iagent-left-controls" class="iagent-left-control-group">
          <!-- Country Selector -->
          <div id="iagent-country-selector" class="iagent-country-dropdown">
          
          <!-- Date Range Selector -->
          <div id="iagent-date-selector" class="iagent-date-range-button">
          
          <!-- Settings Button -->
          <button id="iagent-settings-button" class="iagent-settings-control">
        </div>
        
        <!-- Right Control Group -->
        <div id="iagent-right-controls" class="iagent-right-control-group">
          <!-- AI Tools Selector -->
          <div id="iagent-tools-list" class="iagent-tools-selector">
            <!-- Individual tool buttons with dynamic classes -->
          </div>
          
          <!-- Action Buttons -->
          <div id="iagent-action-buttons" class="iagent-action-controls">
            <!-- Clear, Voice, Attachment buttons... -->
          </div>
          
          <!-- Send/Stop Button -->
          <button id="iagent-send-button" class="iagent-submit-button iagent-send-mode|iagent-stop-mode">
        </div>
      </div>
    </div>
  </div>
</div>
```

## CSS Class Naming Convention

### Prefix System
- **`iagent-`**: Main application prefix for all custom classes
- **`iagent-{component}-{element}`**: Component-specific elements
- **`iagent-{state}-{modifier}`**: State-based modifiers

### Layout Classes
- **Container Classes**: `iagent-*-container`, `iagent-*-wrapper`
- **Section Classes**: `iagent-*-section`, `iagent-*-area`
- **Control Classes**: `iagent-*-control`, `iagent-*-button`
- **Content Classes**: `iagent-*-content`, `iagent-*-main`

### State Classes
- **Mode Classes**: `iagent-send-mode`, `iagent-stop-mode`
- **Role Classes**: `iagent-message-user`, `iagent-message-assistant`
- **State Classes**: `iagent-loading-state`, `iagent-welcome-*`

## Usage Examples

### CSS Targeting
```css
/* Target main app container */
#iagent-app-root { }
.iagent-app-container { }

/* Target specific message types */
.iagent-message-user { }
.iagent-message-assistant { }

/* Target input controls */
#iagent-send-button.iagent-send-mode { }
#iagent-send-button.iagent-stop-mode { }

/* Target layout sections */
.iagent-sidebar-container { }
.iagent-conversation-area { }
.iagent-input-container { }
```

### JavaScript Targeting
```javascript
// Get main elements
const appRoot = document.getElementById('iagent-app-root');
const sidebar = document.getElementById('iagent-sidebar');
const chatArea = document.getElementById('iagent-chat-area');
const inputArea = document.getElementById('iagent-input-area');

// Get specific controls
const sendButton = document.getElementById('iagent-send-button');
const messageInput = document.getElementById('iagent-message-input');
const countrySelector = document.getElementById('iagent-country-selector');

// Query by class
const messageItems = document.querySelectorAll('.iagent-message-item');
const controlButtons = document.querySelectorAll('.iagent-*-control');
```

## Benefits

1. **Maintainability**: Clear, semantic naming makes code easier to understand and modify
2. **Styling**: Consistent class structure enables systematic CSS organization
3. **Testing**: Reliable selectors for automated testing
4. **Accessibility**: Semantic IDs improve screen reader navigation
5. **Debugging**: Easy identification of components in developer tools
6. **Theming**: Structured classes enable comprehensive theme customization

## Notes

- All IDs are unique across the application
- Classes follow a consistent naming pattern
- RTL support is maintained with appropriate directional classes
- Mobile-specific elements have dedicated classes (e.g., `iagent-mobile-close-button`)
- Dynamic content includes parameterized IDs (e.g., `iagent-message-{messageId}`) 
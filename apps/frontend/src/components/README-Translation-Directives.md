# Angular-like Translation Directives for React

This system provides Angular i18n-like directive functionality for React components, allowing you to translate content before display with automatic fallback behavior.

## Features

- **Automatic Translation**: Translates keys before display
- **Fallback Support**: Shows fallback text or keys when translation fails
- **Parameter Interpolation**: Supports dynamic parameters in translations
- **Multiple Usage Patterns**: Component, HOC, and Hook approaches
- **TypeScript Support**: Full type safety and IntelliSense

## Usage Methods

### 1. Translate Component (Most Angular-like)

The `<Translate>` component works similarly to Angular's i18n directive:

```tsx
import { Translate } from './components/Translate';

// Basic usage
<Translate i18nKey="common.hello" />

// With parameters
<Translate i18nKey="common.welcome" params={{ name: "John" }} />

// With fallback
<Translate i18nKey="errors.notFound" fallback="Error occurred" />

// Custom HTML element
<Translate i18nKey="sidebar.title" as="h1" className="header" />

// Hide key on failure
<Translate i18nKey="optional.text" showKeyOnFail={false} />
```

### 2. Higher-Order Component (HOC)

Create translated versions of existing components:

```tsx
import { withTranslation } from './components/withTranslation';
import { Button, Typography } from '@mui/material';

// Create translated components
const TranslatedButton = withTranslation(Button);
const TranslatedTypography = withTranslation(Typography);

// Use with translation props
<TranslatedButton 
  i18nKey="common.submit" 
  i18nFallback="Submit"
  variant="contained" 
  onClick={handleSubmit}
/>

<TranslatedTypography 
  i18nKey="chat.welcome.title" 
  variant="h4"
/>
```

### 3. Translation Hooks

For complex scenarios and programmatic usage:

```tsx
import { useTranslate, useAutoTranslate } from './components/Translate';

function MyComponent() {
  // Basic hook
  const title = useTranslate('page.title');
  
  // Hook with options
  const errorMsg = useAutoTranslate('errors.general', undefined, {
    fallback: 'Something went wrong',
    showKeyOnFail: false
  });
  
  // Dynamic key
  const statusText = useAutoTranslate(
    isOnline ? 'status.online' : 'status.offline'
  );
  
  return (
    <div>
      <h1>{title}</h1>
      <p>{errorMsg}</p>
      <span>{statusText}</span>
    </div>
  );
}
```

## Translation Behavior

### Success Case
When a translation key exists:
```
i18nKey: "common.hello"
Translation: "Hello"
Display: "Hello"
```

### Failure Cases

1. **With Fallback**:
```
i18nKey: "missing.key"
fallback: "Default Text"
Display: "Default Text"
```

2. **Show Key (Default)**:
```
i18nKey: "missing.key"
showKeyOnFail: true (default)
Display: "missing.key"
```

3. **Hide on Failure**:
```
i18nKey: "missing.key"
showKeyOnFail: false
Display: "" (empty)
```

## Parameter Interpolation

Support for dynamic parameters in translations:

```tsx
// Translation file
{
  "welcome": "Hello {{name}}, you have {{count}} messages"
}

// Usage
<Translate 
  i18nKey="welcome" 
  params={{ name: "John", count: "5" }} 
/>
// Result: "Hello John, you have 5 messages"
```

## Best Practices

### 1. Use Semantic Keys
```tsx
// Good
<Translate i18nKey="sidebar.newChat" />
<Translate i18nKey="errors.networkError" />

// Avoid
<Translate i18nKey="button1" />
<Translate i18nKey="text123" />
```

### 2. Provide Fallbacks for Critical UI
```tsx
// Critical buttons should have fallbacks
<TranslatedButton 
  i18nKey="common.submit" 
  i18nFallback="Submit"
  type="submit"
/>
```

### 3. Use Appropriate Method for Context

- **Static text**: Use `<Translate>` component
- **Existing components**: Use HOC with `withTranslation`
- **Dynamic/conditional**: Use hooks
- **Complex logic**: Use `useAutoTranslate` hook

### 4. Handle Missing Translations Gracefully
```tsx
// For optional UI elements
<Translate i18nKey="optional.tooltip" showKeyOnFail={false} />

// For important elements
<Translate i18nKey="important.title" fallback="Default Title" />
```

## Migration from useTranslation

### Before (Traditional Hook)
```tsx
function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('page.title')}</h1>
      <button>{t('common.submit')}</button>
      <p>{t('description.text')}</p>
    </div>
  );
}
```

### After (Directive-like)
```tsx
function MyComponent() {
  return (
    <div>
      <Translate i18nKey="page.title" as="h1" />
      <Translate i18nKey="common.submit" as="button" />
      <Translate i18nKey="description.text" as="p" />
    </div>
  );
}
```

## Performance Considerations

- All translation components use `React.useMemo` for optimization
- Hooks are memoized to prevent unnecessary re-renders
- HOCs maintain component identity with `displayName`

## TypeScript Support

Full TypeScript support with proper type inference:

```tsx
interface CustomProps {
  title: string;
  onClick: () => void;
}

const CustomComponent: React.FC<CustomProps> = ({ title, onClick }) => (
  <button onClick={onClick}>{title}</button>
);

// HOC maintains original prop types
const TranslatedCustom = withTranslation(CustomComponent);

// Usage with full type safety
<TranslatedCustom 
  i18nKey="button.title"
  onClick={handleClick}
  // TypeScript will enforce CustomProps requirements
/>
```

This system provides a clean, Angular-like approach to translations in React while maintaining React's component patterns and TypeScript safety. 
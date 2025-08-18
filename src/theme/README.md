# Theme System Documentation

## Overview

This theme system provides a centralized, consistent way to handle dark and light modes across the entire application using Material-UI's theming capabilities.

## Features

- ✅ **Automatic Theme Switching** - Toggle between light and dark modes
- ✅ **System Preference Detection** - Automatically detects user's system theme preference
- ✅ **Persistent Storage** - Remembers user's theme choice in localStorage
- ✅ **CSS Custom Properties** - Uses CSS variables for dynamic theming
- ✅ **TypeScript Support** - Fully typed theme configuration
- ✅ **Component-Level Styling** - Theme-aware styling utilities
- ✅ **Global Theme Provider** - Wraps the entire application

## File Structure

```
src/theme/
├── index.ts              # Main exports
├── themeConfig.ts        # Theme configuration and colors
├── ThemeProvider.tsx     # Theme context provider
├── ThemeToggle.tsx       # Theme toggle component
├── utils.ts             # Theme utility functions
└── README.md            # This documentation
```

## Quick Start

### 1. Wrap Your App

```tsx
// App.tsx
import { ThemeProvider } from './theme';

function App() {
  return <ThemeProvider>{/* Your app components */}</ThemeProvider>;
}
```

### 2. Use Theme Hooks

```tsx
import { useTheme, useIsDarkMode, useThemeMode } from '../theme';

function MyComponent() {
  const { mode, toggleTheme } = useTheme();
  const isDark = useIsDarkMode();
  const themeMode = useThemeMode();

  return (
    <div>
      <button onClick={toggleTheme}>
        Switch to {isDark ? 'light' : 'dark'} mode
      </button>
    </div>
  );
}
```

### 3. Add Theme Toggle

```tsx
import { ThemeToggle } from '../theme';

function Header() {
  return (
    <header>
      <ThemeToggle size='small' />
    </header>
  );
}
```

## Theme Configuration

### Color Palette

The theme system includes comprehensive color palettes for both light and dark modes:

#### Light Mode Colors

- **Primary**: `#45407A` (Main brand color)
- **Secondary**: `#464b8a` (Accent color)
- **Background**: `#f5f5f5` (Default), `#ffffff` (Paper)
- **Text**: `#000000` (Primary), `#666666` (Secondary)
- **Divider**: `#e0e0e0`

#### Dark Mode Colors

- **Primary**: `#605bd4` (Brighter for dark backgrounds)
- **Secondary**: `#6b6fa8` (Accent color)
- **Background**: `#121212` (Default), `#1e1e1e` (Paper)
- **Text**: `#ffffff` (Primary), `#b0b0b0` (Secondary)
- **Divider**: `#333333`

### Custom Properties

The theme system automatically sets CSS custom properties:

```css
:root {
  --mui-palette-divider: #e0e0e0;
  --mui-palette-table-background: #ffffff;
  --mui-palette-card-background: #ffffff;
  --mui-palette-form-background: #ffffff;
  --mui-palette-button-primary: #45407a;
  /* ... and many more */
}
```

## Available Hooks

### `useTheme()`

Returns the complete theme context:

```tsx
const { mode, toggleTheme, setMode } = useTheme();
```

### `useIsDarkMode()`

Returns a boolean indicating if dark mode is active:

```tsx
const isDark = useIsDarkMode();
```

### `useThemeMode()`

Returns the current theme mode ('light' | 'dark'):

```tsx
const mode = useThemeMode();
```

## Theme Utilities

### `themeStyles`

Pre-built theme-aware styling functions:

```tsx
import { themeStyles } from '../theme';

// Card styling
sx={themeStyles.card(theme)}

// Table styling
sx={themeStyles.table(theme)}

// Form styling
sx={themeStyles.form(theme)}

// Button styling
sx={themeStyles.button.primary(theme)}
sx={themeStyles.button.secondary(theme)}
sx={themeStyles.button.outlined(theme)}
```

### `themeColors`

Color utility functions:

```tsx
import { themeColors } from '../theme';

// Get theme-aware color
const color = themeColors.getColor('#000000', '#ffffff', isDark);

// Get contrast text color
const textColor = themeColors.getContrastText(backgroundColor);
```

## Component Migration Guide

### Before (Inline Dark Mode)

```tsx
// ❌ Old way with inline dark mode
<Card sx={{ backgroundColor: darkMode ? '#222' : '#fff' }}>
  <Typography sx={{ color: darkMode ? '#fff' : '#000' }}>Content</Typography>
</Card>
```

### After (Theme-Based)

```tsx
// ✅ New way with theme system
<Card>
  <Typography>Content</Typography>
</Card>
```

### Using Theme Utilities

```tsx
// ✅ With theme utilities
<Card sx={themeStyles.card(theme)}>
  <Typography sx={themeStyles.text.primary(theme)}>Content</Typography>
</Card>
```

## Best Practices

### 1. Use Theme Colors

Instead of hardcoded colors, use theme-aware colors:

```tsx
// ❌ Don't do this
sx={{ color: '#000000' }}

// ✅ Do this
sx={{ color: 'text.primary' }}
```

### 2. Leverage Material-UI's Built-in Theming

Material-UI components automatically adapt to the theme:

```tsx
// ✅ This automatically adapts to theme
<Button variant='contained' color='primary'>
  Click me
</Button>
```

### 3. Use CSS Custom Properties

For custom styling, use the CSS custom properties:

```tsx
// ✅ Use CSS custom properties
sx={{
  borderColor: 'var(--mui-palette-divider)',
  backgroundColor: 'var(--mui-palette-card-background)',
}}
```

### 4. Avoid Inline Dark Mode Checks

Don't use inline dark mode conditionals:

```tsx
// ❌ Avoid this
sx={{ color: darkMode ? '#fff' : '#000' }}

// ✅ Use theme system instead
sx={{ color: 'text.primary' }}
```

## Migration Checklist

To migrate existing components to the new theme system:

- [ ] Remove `darkMode` prop usage
- [ ] Replace inline dark mode conditionals with theme-aware styling
- [ ] Use `useIsDarkMode()` hook instead of `darkMode` prop
- [ ] Replace hardcoded colors with theme colors
- [ ] Use `themeStyles` utilities for common patterns
- [ ] Test both light and dark modes
- [ ] Ensure proper contrast ratios

## Troubleshooting

### Theme Not Updating

1. Ensure `ThemeProvider` wraps your component tree
2. Check that you're using the correct theme hooks
3. Verify localStorage permissions

### Colors Not Changing

1. Use theme-aware color properties (`text.primary`, `background.paper`, etc.)
2. Avoid hardcoded color values
3. Use the `themeStyles` utilities

### TypeScript Errors

1. Import types from the theme module
2. Use proper type annotations for theme objects
3. Check that all theme hooks are properly typed

## Examples

### Complete Component Example

```tsx
import React from 'react';
import { Card, Typography, Button } from '@mui/material';
import { useTheme, themeStyles } from '../theme';

function MyComponent() {
  const { mode, toggleTheme } = useTheme();

  return (
    <Card sx={themeStyles.card(theme)}>
      <Typography variant='h4' sx={themeStyles.text.primary(theme)}>
        Hello World
      </Typography>
      <Button
        variant='contained'
        onClick={toggleTheme}
        sx={themeStyles.button.primary(theme)}
      >
        Toggle Theme
      </Button>
    </Card>
  );
}
```

This theme system provides a robust, maintainable solution for handling dark and light modes across your entire application while following Material-UI best practices.

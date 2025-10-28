# Storybook Theme System

This theme system provides a comprehensive CSS variable-based theming solution for Storybook components with light and dark mode support.

## Features

- 🎨 **CSS Variables**: All colors, spacing, and styling values are defined as CSS variables
- 🌙 **Dark/Light Mode**: Automatic theme switching with persistent state
- 📱 **Responsive**: Mobile-optimized spacing and typography
- 🎯 **Type Safe**: Full TypeScript support with proper type definitions
- 🔧 **Easy to Use**: Simple hook-based API for theme management

## Usage

### Basic Setup

```tsx
import { StoryThemeWrapper, useTheme } from '../theme';

// Wrap your stories with StoryThemeWrapper
export const MyStory = {
  render: () => (
    <StoryThemeWrapper>
      <MyComponent />
    </StoryThemeWrapper>
  ),
};
```

### Using Theme in Components

```tsx
import { useTheme } from '../theme';

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-lg)',
      }}
    >
      Current theme: {theme}
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

## CSS Variables

### Colors

#### Primary Colors
- `--primary-color`: Main brand color
- `--primary-light`: Lighter variant
- `--primary-dark`: Darker variant
- `--primary-text`: Text color for primary elements

#### Secondary Colors
- `--secondary-color`: Secondary brand color
- `--secondary-light`: Lighter variant
- `--secondary-dark`: Darker variant
- `--secondary-text`: Text color for secondary elements

#### Background Colors
- `--bg-primary`: Main background
- `--bg-secondary`: Secondary background
- `--bg-card`: Card/container background
- `--bg-hover`: Hover state background

#### Text Colors
- `--text-primary`: Primary text color
- `--text-secondary`: Secondary text color
- `--text-muted`: Muted text color

#### Border Colors
- `--border-primary`: Primary border color
- `--border-secondary`: Secondary border color

#### Chart Colors
- `--chart-color-1` to `--chart-color-8`: Predefined chart colors

### Spacing
- `--spacing-xs`: 0.25rem
- `--spacing-sm`: 0.5rem
- `--spacing-md`: 1rem
- `--spacing-lg`: 1.5rem
- `--spacing-xl`: 2rem
- `--spacing-xxl`: 3rem

### Border Radius
- `--radius-sm`: 0.25rem
- `--radius-md`: 0.375rem
- `--radius-lg`: 0.5rem
- `--radius-xl`: 0.75rem
- `--radius-full`: 50%

### Typography
- `--font-family-primary`: Primary font family
- `--font-family-secondary`: Secondary font family
- `--font-size-xs` to `--font-size-4xl`: Font sizes
- `--font-weight-light` to `--font-weight-bold`: Font weights
- `--line-height-tight` to `--line-height-loose`: Line heights

### Shadows
- `--shadow-sm`: Small shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-xl`: Extra large shadow

### Transitions
- `--transition-fast`: 150ms
- `--transition-normal`: 300ms
- `--transition-slow`: 500ms

## Components

### ThemeProvider
The main provider component that manages theme state.

### useTheme Hook
Hook to access theme state and controls:
- `theme`: Current theme ('light' | 'dark')
- `toggleTheme()`: Toggle between light and dark
- `setTheme(theme)`: Set specific theme

### ThemeToggle
A pre-built toggle button component for switching themes.

### StoryThemeWrapper
Wrapper component for Storybook stories that provides theme context and styling.

## Dark Mode

Dark mode is automatically applied when `data-theme="dark"` is set on the document root. The CSS variables automatically switch to dark variants:

```css
[data-theme="dark"] {
  --bg-primary: #111111;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  /* ... other dark theme variables */
}
```

## Responsive Design

The theme includes responsive breakpoints that adjust spacing and typography for mobile devices:

```css
@media (max-width: 768px) {
  :root {
    --spacing-md: 0.75rem;
    --font-size-base: 0.875rem;
  }
}
```

## Examples

See the `ThemeExample.stories.tsx` file for a complete example of how to use the theme system in your components.

## Best Practices

1. **Always use CSS variables** instead of hardcoded values
2. **Wrap stories** with `StoryThemeWrapper` for proper theme context
3. **Test both themes** when developing components
4. **Use semantic color names** (e.g., `--text-primary` instead of `--color-black`)
5. **Leverage the spacing system** for consistent layouts

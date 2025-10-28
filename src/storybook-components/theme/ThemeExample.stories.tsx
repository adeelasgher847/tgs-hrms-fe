import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography, Button } from '@mui/material';
import { StoryThemeWrapper, useTheme } from './ThemeProvider';

// Example component that uses theme variables
const ThemeExampleComponent = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Box
      sx={{
        padding: 'var(--spacing-xl)',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ 
          color: 'var(--text-primary)', 
          marginBottom: 'var(--spacing-lg)',
          fontFamily: 'var(--font-family-primary)',
        }}
      >
        Theme System Example
      </Typography>
      
      <Typography 
        sx={{ 
          color: 'var(--text-secondary)', 
          marginBottom: 'var(--spacing-lg)',
          fontSize: 'var(--font-size-lg)',
        }}
      >
        Current theme: <strong>{theme}</strong>
      </Typography>

      <Box sx={{ marginBottom: 'var(--spacing-lg)' }}>
        <Typography 
          sx={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Theme Colors:
        </Typography>
        <Box sx={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              backgroundColor: 'var(--primary-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-text)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Primary
          </Box>
          <Box
            sx={{
              width: 60,
              height: 60,
              backgroundColor: 'var(--secondary-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--secondary-text)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Secondary
          </Box>
          <Box
            sx={{
              width: 60,
              height: 60,
              backgroundColor: 'var(--accent-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-text)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Accent
          </Box>
          <Box
            sx={{
              width: 60,
              height: 60,
              backgroundColor: 'var(--info-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--info-text)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            Info
          </Box>
        </Box>
      </Box>

      <Box sx={{ marginBottom: 'var(--spacing-lg)' }}>
        <Typography 
          sx={{ 
            color: 'var(--text-primary)', 
            marginBottom: 'var(--spacing-md)',
          }}
        >
          Chart Colors:
        </Typography>
        <Box sx={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Box
              key={i}
              sx={{
                width: 40,
                height: 40,
                backgroundColor: `var(--chart-color-${i})`,
                borderRadius: 'var(--radius-sm)',
              }}
            />
          ))}
        </Box>
      </Box>

      <Button
        onClick={toggleTheme}
        sx={{
          backgroundColor: 'var(--primary-color)',
          color: 'var(--primary-text)',
          padding: 'var(--spacing-sm) var(--spacing-lg)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 'var(--font-weight-medium)',
          border: 'none',
          cursor: 'pointer',
          transition: 'var(--transition-fast)',
          '&:hover': {
            backgroundColor: 'var(--primary-dark)',
          },
        }}
      >
        Toggle Theme ({theme === 'light' ? 'Dark' : 'Light'})
      </Button>
    </Box>
  );
};

const meta: Meta<typeof ThemeExampleComponent> = {
  title: 'Theme/ThemeExample',
  component: ThemeExampleComponent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ThemeExampleComponent>;

export const Default: Story = {
  render: () => (
    <StoryThemeWrapper>
      <Box sx={{ padding: 'var(--spacing-xl)', minHeight: '100vh' }}>
        <ThemeExampleComponent />
      </Box>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example component demonstrating the theme system with CSS variables. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

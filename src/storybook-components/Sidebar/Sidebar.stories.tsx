import type { Meta, StoryObj } from '@storybook/react';
import SidebarComponent from './Sidebar';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import { useState } from 'react';

const meta: Meta<typeof SidebarComponent> = {
  title: 'Material UI/Sidebar',
  component: SidebarComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Material UI Sidebar component with mock company data, logo, and Material UI components from AttendanceTable bottom. Fully responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    darkMode: {
      control: { type: 'boolean' },
    },
    responsive: {
      control: { type: 'boolean' },
    },
    showAttendanceComponents: {
      control: { type: 'boolean' },
    },
    companyName: {
      control: { type: 'text' },
    },
    companyLogo: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SidebarComponent>;

export const Default: Story = {
  args: {
    darkMode: false,
    responsive: false,
    showAttendanceComponents: false,
    companyName: 'TechCorp Solutions',
    companyLogo: 'https://via.placeholder.com/60x60/464b8a/ffffff?text=TC',
  },
  render: (args) => {
    const [darkMode, setDarkMode] = useState(args.darkMode);
    return (
      <Box sx={{ height: '100vh', display: 'flex' }}>
        <SidebarComponent
          {...args}
          darkMode={darkMode}
          onMenuItemClick={() => console.log('Menu item clicked')}
        />
        <Box sx={{ flex: 1, p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h4" gutterBottom>
            Sidebar Component
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This is the exact Sidebar component from your project with mock company data and logo.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={(e) => setDarkMode(e.target.checked)}
              />
            }
            label="Toggle Dark Mode"
          />
        </Box>
      </Box>
    );
  },
};


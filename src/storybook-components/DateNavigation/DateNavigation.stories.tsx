import type { Meta, StoryObj } from '@storybook/react';
import DateNavigationComponent from './DateNavigation';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';

const meta: Meta<typeof DateNavigationComponent> = {
  title: 'Material UI/Date Navigation',
  component: DateNavigationComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI Date Navigation component used at the bottom of AttendanceTable.tsx with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
    },
    responsive: {
      control: { type: 'boolean' },
    },
    currentDate: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateNavigationComponent>;

export const Default: Story = {
  args: {
    currentDate: '2024-01-15',
    onDateChange: (date) => console.log('Date changed:', date),
    disabled: false,
    responsive: false,
  },
  render: (args) => {
    const [currentDate, setCurrentDate] = useState(args.currentDate);
    return (
      <Box sx={{ maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          Date Navigation Component
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          This is the exact DateNavigation component used at the bottom of your AttendanceTable.tsx
        </Typography>
        <DateNavigationComponent
          {...args}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />
        <Typography variant="caption" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
          Selected Date: {currentDate}
        </Typography>
      </Box>
    );
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import AttendanceDatePickerComponent from './AttendanceDatePicker';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';

const meta: Meta<typeof AttendanceDatePickerComponent> = {
  title: 'Components/Attendance Date Picker',
  component: AttendanceDatePickerComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI Attendance Date Picker component using react-multi-date-picker with various configurations and responsive design for all screen sizes. This replicates the exact implementation from AttendanceTable.tsx.',
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
    darkMode: {
      control: { type: 'boolean' },
    },
    range: {
      control: { type: 'boolean' },
    },
    format: {
      control: { type: 'text' },
    },
    placeholder: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AttendanceDatePickerComponent>;

export const Default: Story = {
  args: {
    value: [],
    onChange: () => {},
    placeholder: 'Start Date - End Date',
    format: 'MM/DD/YYYY',
    range: true,
    disabled: false,
    responsive: false,
    darkMode: false,
  },
  render: (args) => {
    const [dateValue, setDateValue] = useState<string[]>([]);
    return (
      <Box sx={{ maxWidth: 400 }}>
        <AttendanceDatePickerComponent
          {...args}
          value={dateValue}
          onChange={(value) => setDateValue(value as string[])}
        />
        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
          Selected: {dateValue.length > 0 ? dateValue.join(' to ') : 'No date selected'}
        </Typography>
      </Box>
    );
  },
};


export const DarkMode: Story = {
  args: {
    value: [],
    onChange: () => {},
    placeholder: 'Start Date - End Date',
    format: 'MM/DD/YYYY',
    range: true,
    disabled: false,
    responsive: false,
    darkMode: true,
  },
  render: (args) => {
    const [dateValue, setDateValue] = useState<string[]>([]);
    return (
      <Box sx={{ maxWidth: 400, bgcolor: 'grey.900', p: 3, borderRadius: 2 }}>
        <Typography variant="body2" sx={{ color: 'white', mb: 2 }}>
          Dark Mode Date Picker
        </Typography>
        <AttendanceDatePickerComponent
          {...args}
          value={dateValue}
          onChange={(value) => setDateValue(value as string[])}
        />
        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'white' }}>
          Selected: {dateValue.length > 0 ? dateValue.join(' to ') : 'No date selected'}
        </Typography>
      </Box>
    );
  },
};

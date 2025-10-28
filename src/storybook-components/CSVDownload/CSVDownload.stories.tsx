import type { Meta, StoryObj } from '@storybook/react';
import CSVDownloadComponent from './CSVDownload';
import { Box, Typography } from '@mui/material';

const meta: Meta<typeof CSVDownloadComponent> = {
  title: 'Material UI/CSV Download',
  component: CSVDownloadComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI CSV Download component with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['icon', 'button', 'tooltip'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'action', 'disabled', 'inherit'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
    responsive: {
      control: { type: 'boolean' },
    },
    fullWidth: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CSVDownloadComponent>;

// Mock CSV download function
const mockCSVDownload = (filename: string) => {
  // Create mock CSV data
  const csvContent = `Name,Email,Department,Status
John Doe,john@example.com,IT,Active
Jane Smith,jane@example.com,HR,Active
Bob Johnson,bob@example.com,Finance,Inactive`;
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const Default: Story = {
  args: {
    variant: 'icon',
    size: 'medium',
    color: 'primary',
    disabled: false,
    loading: false,
    onClick: () => mockCSVDownload('data.csv'),
    filename: 'data.csv',
  },
};

export const AsButton: Story = {
  args: {
    variant: 'button',
    color: 'primary',
    size: 'medium',
    label: 'Download CSV',
    filename: 'data.csv',
    onClick: () => mockCSVDownload('data.csv'),
  },
};

export const WithTooltip: Story = {
  args: {
    variant: 'tooltip',
    color: 'primary',
    tooltip: 'Download attendance data as CSV',
    filename: 'attendance.csv',
    onClick: () => mockCSVDownload('attendance.csv'),
  },
};







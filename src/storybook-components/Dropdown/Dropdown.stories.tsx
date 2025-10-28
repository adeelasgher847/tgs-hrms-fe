import type { Meta, StoryObj } from '@storybook/react';
import Dropdown from './Dropdown';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Assignment as AssignmentIcon,
  Computer as ComputerIcon,
  Phone as PhoneIcon,
  Laptop as LaptopIcon,
  Tablet as TabletIcon,
  Headphones as HeadphonesIcon,
  Keyboard as KeyboardIcon,
  Mouse as MouseIcon,
} from '@mui/icons-material';

const meta: Meta<typeof Dropdown> = {
  title: 'Material UI/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI Select dropdown component with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['outlined', 'filled', 'standard'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
    error: {
      control: { type: 'boolean' },
    },
    fullWidth: {
      control: { type: 'boolean' },
    },
    required: {
      control: { type: 'boolean' },
    },
    multiple: {
      control: { type: 'boolean' },
    },
    showChips: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Sample data for different dropdown types
const actionOptions = [
  {
    value: 'approve',
    label: 'Approve Request',
    icon: <ApproveIcon color="success" />,
    description: 'Approve and assign asset',
  },
  {
    value: 'reject',
    label: 'Reject Request',
    icon: <RejectIcon color="error" />,
    description: 'Reject with reason',
  },
];

const assetOptions = [
  {
    value: 'laptop-001',
    label: 'Dell Laptop XPS 13',
    icon: <LaptopIcon />,
    description: 'IT Equipment - Available',
  },
  {
    value: 'phone-002',
    label: 'iPhone 14 Pro',
    icon: <PhoneIcon />,
    description: 'Mobile Device - Available',
  },
  {
    value: 'desktop-003',
    label: 'HP Desktop Workstation',
    icon: <ComputerIcon />,
    description: 'IT Equipment - Available',
  },
  {
    value: 'tablet-004',
    label: 'iPad Pro 12.9"',
    icon: <TabletIcon />,
    description: 'Mobile Device - Available',
  },
  {
    value: 'headphones-005',
    label: 'Sony WH-1000XM4',
    icon: <HeadphonesIcon />,
    description: 'Accessories - Available',
  },
  {
    value: 'keyboard-006',
    label: 'Mechanical Keyboard',
    icon: <KeyboardIcon />,
    description: 'Accessories - Available',
  },
  {
    value: 'mouse-007',
    label: 'Logitech MX Master 3',
    icon: <MouseIcon />,
    description: 'Accessories - Available',
  },
];

const statusOptions = [
  { value: 'pending', label: 'Pending', description: 'Awaiting approval' },
  { value: 'approved', label: 'Approved', description: 'Request approved' },
  { value: 'rejected', label: 'Rejected', description: 'Request rejected' },
  { value: 'cancelled', label: 'Cancelled', description: 'Request cancelled' },
];

export const Default: Story = {
  args: {
    label: 'Select Action',
    value: '',
    onChange: () => {},
    options: actionOptions,
    placeholder: 'Choose an action...',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 400 }}>
        <Dropdown
          {...args}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

export const WithIcons: Story = {
  args: {
    label: 'Assign Asset',
    value: '',
    onChange: () => {},
    options: assetOptions,
    placeholder: 'Select an asset to assign...',
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 400 }}>
        <Dropdown
          {...args}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

export const MultipleSelection: Story = {
  args: {
    label: 'Select Multiple Assets',
    value: [],
    onChange: () => {},
    options: assetOptions,
    multiple: true,
    showChips: true,
    placeholder: 'Select multiple assets...',
  },
  render: (args) => {
    const [value, setValue] = useState<string[]>(args.value as string[]);
    return (
      <Box sx={{ maxWidth: 400 }}>
        <Dropdown
          {...args}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

export const ErrorState: Story = {
  args: {
    label: 'Status',
    value: '',
    onChange: () => {},
    options: statusOptions,
    error: true,
    errorMessage: 'This field is required',
    required: true,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 400 }}>
        <Dropdown
          {...args}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

export const DisabledState: Story = {
  args: {
    label: 'Disabled Dropdown',
    value: 'approve',
    onChange: () => {},
    options: actionOptions,
    disabled: true,
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 400 }}>
        <Dropdown
          {...args}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};



import type { Meta, StoryObj } from '@storybook/react';
import SnackbarComponent from './Snackbar';
import { Box, Typography, Button } from '@mui/material';
import { useState } from 'react';

const meta: Meta<typeof SnackbarComponent> = {
  title: 'Components/Snackbar',
  component: SnackbarComponent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Material UI Snackbar component with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    severity: {
      control: { type: 'select' },
      options: ['success', 'error', 'warning', 'info'],
    },
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'standard'],
    },
    anchorOrigin: {
      control: { type: 'object' },
    },
    autoHideDuration: {
      control: { type: 'number' },
    },
    showCloseButton: {
      control: { type: 'boolean' },
    },
    responsive: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SnackbarComponent>;

export const Default: Story = {
  args: {
    open: true,
    message: 'This is a default snackbar message',
    severity: 'success',
    onClose: () => {},
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <Box sx={{ position: 'relative', height: '100vh', bgcolor: 'grey.100' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Default Snackbar
          </Typography>
          <Button onClick={() => setOpen(true)}>
            Show Snackbar
          </Button>
        </Box>
        <SnackbarComponent
          {...args}
          open={open}
          onClose={() => setOpen(false)}
        />
      </Box>
    );
  },
};

export const Success: Story = {
  args: {
    open: true,
    message: 'Operation completed successfully!',
    severity: 'success',
    onClose: () => {},
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <Box sx={{ position: 'relative', height: '100vh', bgcolor: 'grey.100' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Success Snackbar
          </Typography>
          <Button onClick={() => setOpen(true)}>
            Show Success Message
          </Button>
        </Box>
        <SnackbarComponent
          {...args}
          open={open}
          onClose={() => setOpen(false)}
        />
      </Box>
    );
  },
};

export const Error: Story = {
  args: {
    open: true,
    message: 'An error occurred while processing your request',
    severity: 'error',
    onClose: () => {},
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <Box sx={{ position: 'relative', height: '100vh', bgcolor: 'grey.100' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Error Snackbar
          </Typography>
          <Button onClick={() => setOpen(true)}>
            Show Error Message
          </Button>
        </Box>
        <SnackbarComponent
          {...args}
          open={open}
          onClose={() => setOpen(false)}
        />
      </Box>
    );
  },
};

export const Warning: Story = {
  args: {
    open: true,
    message: 'Please review your input before proceeding',
    severity: 'warning',
    onClose: () => {},
  },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <Box sx={{ position: 'relative', height: '100vh', bgcolor: 'grey.100' }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Warning Snackbar
          </Typography>
          <Button onClick={() => setOpen(true)}>
            Show Warning Message
          </Button>
        </Box>
        <SnackbarComponent
          {...args}
          open={open}
          onClose={() => setOpen(false)}
        />
      </Box>
    );
  },
};

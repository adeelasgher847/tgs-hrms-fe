import type { Meta, StoryObj } from '@storybook/react';
import DeleteTenantModal from './DeleteTenantModal';
import { StoryThemeWrapper } from '../theme';
import { useState } from 'react';
import { Button, Box } from '@mui/material';

const meta: Meta<typeof DeleteTenantModal> = {
  title: 'Common/DeleteTenantModal',
  component: DeleteTenantModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Delete Tenant modal component for confirming tenant deletion. Shows a warning dialog with tenant name and delete/cancel buttons.',
      },
    },
  },
  argTypes: {
    open: {
      control: { type: 'boolean' },
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Callback when modal is closed',
    },
    onConfirm: {
      action: 'confirmed',
      description: 'Callback when delete is confirmed',
    },
    tenantName: {
      control: { type: 'text' },
      description: 'Name of the tenant to delete',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Loading state',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DeleteTenantModal>;

const DeleteTenantModalWrapper = (args: any) => {
  const [open, setOpen] = useState(false);

  return (
    <StoryThemeWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Button 
          variant="contained" 
          color="error"
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: 'var(--chart-color-6)',
            color: 'var(--text-light)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              backgroundColor: '#b91c1c',
            },
          }}
        >
          Open Delete Tenant Modal
        </Button>
        <DeleteTenantModal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            setOpen(false);
          }}
        />
      </Box>
    </StoryThemeWrapper>
  );
};

export const Default: Story = {
  render: (args) => <DeleteTenantModalWrapper {...args} />,
  args: {
    tenantName: 'Acme Corporation',
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default delete tenant modal for confirming tenant deletion. Click the button to open the modal and test the functionality.',
      },
    },
  },
};



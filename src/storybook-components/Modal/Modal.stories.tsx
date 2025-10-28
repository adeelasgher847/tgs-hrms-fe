import type { Meta, StoryObj } from '@storybook/react';
import Modal from './Modal';
import Button from '../Button/Button';
import { Typography, Box } from '@mui/material';
import { useState } from 'react';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible modal component with various sizes and configurations.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large', 'fullscreen'],
      description: 'Modal size',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'centered', 'fullscreen'],
      description: 'Modal variant',
    },
    showCloseButton: {
      control: { type: 'boolean' },
      description: 'Show close button',
    },
    showBackdrop: {
      control: { type: 'boolean' },
      description: 'Show backdrop',
    },
    closeOnBackdropClick: {
      control: { type: 'boolean' },
      description: 'Close on backdrop click',
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Close on escape key',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWrapper = ({ children, ...props }: any) => {
  const [open, setOpen] = useState(false);
  
  return (
    <StoryThemeWrapper>
      <Button onClick={() => setOpen(true)}>
        Open Modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        {...props}
      >
        {children}
      </Modal>
    </StoryThemeWrapper>
  );
};

export const Default: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This is a default modal with basic content.
      </Typography>
    </ModalWrapper>
  ),
  args: {
    title: 'Default Modal',
  },
};

export const WithActions: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This modal includes action buttons in the footer.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          You can add any content here, including forms, images, or other components.
        </Typography>
      </Box>
    </ModalWrapper>
  ),
  args: {
    title: 'Modal with Actions',
    actions: (
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button variant="primary" onClick={() => {}}>
          Save
        </Button>
      </Box>
    ),
  },
};

export const Small: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This is a small modal with compact content.
      </Typography>
    </ModalWrapper>
  ),
  args: {
    title: 'Small Modal',
    size: 'small',
  },
};

export const Large: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This is a large modal with more space for content.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Large modals are great for forms, detailed information, or complex layouts.
        </Typography>
      </Box>
    </ModalWrapper>
  ),
  args: {
    title: 'Large Modal',
    size: 'large',
  },
};

export const Fullscreen: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography variant="h5" gutterBottom>
        Fullscreen Modal
      </Typography>
      <Typography>
        This modal takes up the entire screen and is perfect for complex workflows.
      </Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Fullscreen modals are ideal for detailed forms, data entry, or multi-step processes.
        </Typography>
      </Box>
    </ModalWrapper>
  ),
  args: {
    title: 'Fullscreen Modal',
    size: 'fullscreen',
  },
};

export const WithoutCloseButton: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This modal doesn't have a close button in the header.
      </Typography>
    </ModalWrapper>
  ),
  args: {
    title: 'Modal without Close Button',
    showCloseButton: false,
  },
};

export const WithoutBackdrop: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This modal doesn't have a backdrop overlay.
      </Typography>
    </ModalWrapper>
  ),
  args: {
    title: 'Modal without Backdrop',
    showBackdrop: false,
  },
};

export const NoBackdropClick: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This modal cannot be closed by clicking the backdrop.
      </Typography>
    </ModalWrapper>
  ),
  args: {
    title: 'Modal without Backdrop Click',
    closeOnBackdropClick: false,
  },
};

export const NoEscapeKey: Story = {
  render: (args) => (
    <ModalWrapper {...args}>
      <Typography>
        This modal cannot be closed by pressing the Escape key.
      </Typography>
    </ModalWrapper>
  ),
  args: {
    title: 'Modal without Escape Key',
    closeOnEscape: false,
  },
};

export const AllSizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<string | null>(null);
    
    return (
      <StoryThemeWrapper>
        <Box sx={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
          <Button onClick={() => setOpenSize('small')}>Small Modal</Button>
          <Button onClick={() => setOpenSize('medium')}>Medium Modal</Button>
          <Button onClick={() => setOpenSize('large')}>Large Modal</Button>
          <Button onClick={() => setOpenSize('fullscreen')}>Fullscreen Modal</Button>
          
          {openSize && (
            <Modal
              open={true}
              onClose={() => setOpenSize(null)}
              title={`${openSize.charAt(0).toUpperCase() + openSize.slice(1)} Modal`}
              size={openSize as any}
              actions={
                <Button onClick={() => setOpenSize(null)}>
                  Close
                </Button>
              }
            >
              <Typography>
                This is a {openSize} modal. You can see the different sizes and how they behave.
              </Typography>
            </Modal>
          )}
        </Box>
      </StoryThemeWrapper>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'All modal sizes displayed with interactive buttons. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import EditProfileModal from './EditProfileModal';
import { StoryThemeWrapper } from '../theme';
import { useState } from 'react';
import { Button, Box } from '@mui/material';

const meta: Meta<typeof EditProfileModal> = {
  title: 'Common/EditProfileModal',
  component: EditProfileModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Edit Profile modal component with form fields for updating user profile information. Includes profile picture upload functionality and form validation.',
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
    onProfileUpdated: {
      action: 'profile updated',
      description: 'Callback when profile is updated',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EditProfileModal>;

// Mock user data
const mockUser = {
  id: '1',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+923001234567',
  profile_pic: null,
  role: 'admin',
  tenant: 'Acme Corp',
  created_at: '2024-01-01T00:00:00Z',
};

const EditProfileModalWrapper = (args: any) => {
  const [open, setOpen] = useState(false);

  return (
    <StoryThemeWrapper>
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Button 
          variant="contained" 
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: 'var(--primary-color)',
            color: 'var(--primary-text)',
            fontFamily: 'var(--font-family-primary)',
            '&:hover': {
              backgroundColor: 'var(--primary-dark)',
            },
          }}
        >
          Open Edit Profile Modal
        </Button>
        <EditProfileModal
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          onProfileUpdated={(updatedUser) => {
            setOpen(false);
          }}
        />
      </Box>
    </StoryThemeWrapper>
  );
};

export const Default: Story = {
  render: (args) => <EditProfileModalWrapper {...args} />,
  args: {
    user: mockUser,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default Edit Profile modal with form fields for updating user information. Click the button to open the modal and test the form functionality.',
      },
    },
  },
};

export const WithProfilePicture: Story = {
  render: (args) => <EditProfileModalWrapper {...args} />,
  args: {
    user: {
      ...mockUser,
      profile_pic: 'https://i.pravatar.cc/150?img=1',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit Profile modal with existing profile picture. Shows how the modal handles users who already have a profile picture.',
      },
    },
  },
};

export const DifferentUser: Story = {
  render: (args) => <EditProfileModalWrapper {...args} />,
  args: {
    user: {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+923009876543',
      profile_pic: null,
      role: 'manager',
      tenant: 'Tech Corp',
      created_at: '2024-01-15T00:00:00Z',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Edit Profile modal with different user data. Shows how the form initializes with different user information.',
      },
    },
  },
};



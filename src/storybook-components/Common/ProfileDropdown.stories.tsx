import type { Meta, StoryObj } from '@storybook/react';
import ProfileDropdown from './ProfileDropdown';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof ProfileDropdown> = {
  title: 'Common/ProfileDropdown',
  component: ProfileDropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Profile dropdown component with user avatar and menu options. Click on the avatar to open the dropdown menu.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ProfileDropdown>;

export const Default: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <ProfileDropdown />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default profile dropdown with user avatar. Click on the avatar to see the dropdown menu with user info and navigation options. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

export const DifferentUser: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <ProfileDropdown />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Profile dropdown with different user data. The avatar will show different initials and colors based on the user name.',
      },
    },
  },
};



import type { Meta, StoryObj } from '@storybook/react';
import UserAvatar from './UserAvatar';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof UserAvatar> = {
  title: 'Common/UserAvatar',
  component: UserAvatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'User avatar component with initials and profile picture support. Shows user initials with generated background color when no profile picture is available.',
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'number', min: 20, max: 100, step: 5 },
      description: 'Avatar size in pixels',
    },
    clickable: {
      control: { type: 'boolean' },
      description: 'Whether the avatar is clickable',
    },
    user: {
      control: { type: 'object' },
      description: 'User object with name and profile picture',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

// Mock user data
const mockUsers = {
  johnDoe: {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    profile_pic: null,
  },
  janeSmith: {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    profile_pic: null,
  },
  mikeJohnson: {
    id: '3',
    first_name: 'Mike',
    last_name: 'Johnson',
    profile_pic: null,
  },
  sarahWilson: {
    id: '4',
    first_name: 'Sarah',
    last_name: 'Wilson',
    profile_pic: null,
  },
  withProfilePic: {
    id: '5',
    first_name: 'Alex',
    last_name: 'Brown',
    profile_pic: 'https://i.pravatar.cc/150?img=1',
  },
};

export const Default: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <UserAvatar {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    user: mockUsers.johnDoe,
    size: 40,
    clickable: false,
  },
};

export const Large: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '120px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <UserAvatar {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    user: mockUsers.johnDoe,
    size: 60,
    clickable: false,
  },
};

export const Clickable: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <UserAvatar {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    user: mockUsers.johnDoe,
    size: 50,
    clickable: true,
    onClick: () => {},
  },
};

export const WithProfilePicture: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <UserAvatar {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    user: mockUsers.withProfilePic,
    size: 50,
    clickable: false,
  },
};

export const DifferentUsers: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 'var(--spacing-lg)',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <UserAvatar user={mockUsers.johnDoe} size={40} />
        <UserAvatar user={mockUsers.janeSmith} size={40} />
        <UserAvatar user={mockUsers.mikeJohnson} size={40} />
        <UserAvatar user={mockUsers.sarahWilson} size={40} />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different users showing how avatar colors are generated based on names. Each user gets a unique color based on their first name.',
      },
    },
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: 'var(--spacing-lg)',
        minHeight: '100px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
      }}>
        <UserAvatar user={mockUsers.johnDoe} size={24} />
        <UserAvatar user={mockUsers.johnDoe} size={32} />
        <UserAvatar user={mockUsers.johnDoe} size={40} />
        <UserAvatar user={mockUsers.johnDoe} size={56} />
        <UserAvatar user={mockUsers.johnDoe} size={72} />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'UserAvatar in different sizes from small to large. The font size scales proportionally with the avatar size.',
      },
    },
  },
};

export const InList: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        gap: 'var(--spacing-md)',
        minHeight: '200px',
        backgroundColor: 'var(--bg-primary)',
        padding: 'var(--spacing-xl)',
        maxWidth: '300px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
        }}>
          <UserAvatar user={mockUsers.johnDoe} size={40} />
          <div>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              John Doe
            </div>
            <div style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
            }}>
              john.doe@example.com
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
        }}>
          <UserAvatar user={mockUsers.janeSmith} size={40} />
          <div>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              Jane Smith
            </div>
            <div style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
            }}>
              jane.smith@example.com
            </div>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-primary)',
        }}>
          <UserAvatar user={mockUsers.withProfilePic} size={40} />
          <div>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontFamily: 'var(--font-family-primary)',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              Alex Brown
            </div>
            <div style={{ 
              color: 'var(--text-secondary)', 
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-family-primary)',
            }}>
              alex.brown@example.com
            </div>
          </div>
        </div>
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'UserAvatar in a list layout showing how it would appear in user lists or contact lists. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

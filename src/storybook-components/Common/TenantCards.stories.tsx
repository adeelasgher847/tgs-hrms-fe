import type { Meta, StoryObj } from '@storybook/react';
import TenantCards from './TenantCards';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof TenantCards> = {
  title: 'Common/TenantCards',
  component: TenantCards,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Tenant cards component for displaying and managing tenant information. Shows tenant cards with edit and delete functionality.',
      },
    },
  },
  argTypes: {
    tenants: {
      control: { type: 'object' },
      description: 'Array of tenant objects',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Loading state',
    },
    onCreateTenant: {
      action: 'create tenant',
      description: 'Callback when create tenant is clicked',
    },
    onEditTenant: {
      action: 'edit tenant',
      description: 'Callback when edit tenant is clicked',
    },
    onDeleteTenant: {
      action: 'delete tenant',
      description: 'Callback when delete tenant is clicked',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TenantCards>;

// Mock tenant data
const mockTenants = [
  { id: '1', name: 'Acme Corporation' },
  { id: '2', name: 'Tech Solutions Inc' },
  { id: '3', name: 'Global Industries' },
  { id: '4', name: 'Digital Innovations' },
];

const mockTenantsFew = [
  { id: '1', name: 'Acme Corporation' },
  { id: '2', name: 'Tech Solutions Inc' },
];

const mockTenantsMany = [
  { id: '1', name: 'Acme Corporation' },
  { id: '2', name: 'Tech Solutions Inc' },
  { id: '3', name: 'Global Industries' },
  { id: '4', name: 'Digital Innovations' },
  { id: '5', name: 'Enterprise Solutions' },
  { id: '6', name: 'Startup Ventures' },
  { id: '7', name: 'Innovation Labs' },
  { id: '8', name: 'Future Technologies' },
];

export const Default: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <TenantCards {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    tenants: mockTenants,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default tenant cards displaying multiple tenants with edit and delete functionality. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

export const FewTenants: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <TenantCards {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    tenants: mockTenantsFew,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tenant cards with fewer tenants showing how the layout adapts to different numbers of items.',
      },
    },
  },
};

export const ManyTenants: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <TenantCards {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    tenants: mockTenantsMany,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tenant cards with many tenants showing how the grid layout handles multiple items.',
      },
    },
  },
};



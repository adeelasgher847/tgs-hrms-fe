import type { Meta, StoryObj } from '@storybook/react';
import EmployeesAvailability from './EmployeesAvailability';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof EmployeesAvailability> = {
  title: 'Dashboard/EmployeesAvailability',
  component: EmployeesAvailability,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Employees Availability component showing attendance and leave data with loading states and error handling.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmployeesAvailability>;

export const Default: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 400, height: 'fit-content', minHeight: 250 }}>
        <EmployeesAvailability />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Default Employees Availability component showing attendance and leave data. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

export const Loading: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 400, height: 'fit-content', minHeight: 250 }}>
        <EmployeesAvailability />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Employees Availability component in loading state.',
      },
    },
  },
};

export const Mobile: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 300, height: 'fit-content', minHeight: 200 }}>
        <EmployeesAvailability />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Employees Availability component optimized for mobile view.',
      },
    },
  },
};

export const DashboardLayout: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 'var(--spacing-lg)',
        padding: 'var(--spacing-lg)',
        height: 'fit-content',
      }}>
        <EmployeesAvailability />
        <div style={{
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-card)',
          padding: 'var(--spacing-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-secondary)',
          height: 'fit-content',
          minHeight: '250px',
        }}>
          Another Dashboard Component
        </div>
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Employees Availability component in a dashboard layout with other components.',
      },
    },
  },
};

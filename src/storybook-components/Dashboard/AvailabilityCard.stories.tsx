import type { Meta, StoryObj } from '@storybook/react';
import AvailabilityCard from './AvailabilityCard';
import { StoryThemeWrapper, useTheme } from '../theme';
import CheckedIcon from './checked.svg';
import BeachIcon from './beach-bed.svg';

const meta: Meta<typeof AvailabilityCard> = {
  title: 'Dashboard/AvailabilityCard',
  component: AvailabilityCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Individual availability card component showing employee statistics with icon and value.',
      },
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Card title',
    },
    value: {
      control: { type: 'number' },
      description: 'Numeric value to display',
    },
    icon: {
      control: false,
      description: 'Icon component to display',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AvailabilityCard>;

export const Attendance: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <AvailabilityCard {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    title: 'Attendance',
    value: 45,
    icon: (
      <img
        src={CheckedIcon}
        alt='Attendance'
        style={{
          width: 30,
          height: 30,
          filter: 'grayscale(100%) brightness(55%)',
        }}
      />
    ),
  },
};

export const LeaveApply: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <AvailabilityCard {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    title: 'Leave Apply',
    value: 12,
    icon: (
      <img
        src={BeachIcon}
        alt='LeaveApply'
        style={{
          width: 30,
          height: 30,
          filter: 'grayscale(100%) brightness(55%)',
        }}
      />
    ),
  },
};

export const HighValue: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <AvailabilityCard {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    title: 'Total Employees',
    value: 150,
    icon: (
      <img
        src={CheckedIcon}
        alt='Total Employees'
        style={{
          width: 30,
          height: 30,
          filter: 'grayscale(100%) brightness(55%)',
        }}
      />
    ),
  },
};

export const ZeroValue: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <AvailabilityCard {...args} />
      </div>
    </StoryThemeWrapper>
  ),
  args: {
    title: 'Absent',
    value: 0,
    icon: (
      <img
        src={BeachIcon}
        alt='Absent'
        style={{
          width: 30,
          height: 30,
          filter: 'grayscale(100%) brightness(55%)',
        }}
      />
    ),
  },
};

export const AllCards: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--spacing-lg)',
        width: '100%',
        maxWidth: 400,
        height: 'fit-content',
        overflow: 'hidden',
      }}>
        <AvailabilityCard
          title="Attendance"
          value={45}
          icon={
            <img
              src={CheckedIcon}
              alt='Attendance'
              style={{
                width: 30,
                height: 30,
                filter: 'grayscale(100%) brightness(55%)',
              }}
            />
          }
        />
        <AvailabilityCard
          title="Leave Apply"
          value={12}
          icon={
            <img
              src={BeachIcon}
              alt='Leave Apply'
              style={{
                width: 30,
                height: 30,
                filter: 'grayscale(100%) brightness(55%)',
              }}
            />
          }
        />
        <AvailabilityCard
          title="Late Coming"
          value={8}
          icon={
            <img
              src={CheckedIcon}
              alt='Late Coming'
              style={{
                width: 30,
                height: 30,
                filter: 'grayscale(100%) brightness(55%)',
              }}
            />
          }
        />
        <AvailabilityCard
          title="Absent"
          value={3}
          icon={
            <img
              src={BeachIcon}
              alt='Absent'
              style={{
                width: 30,
                height: 30,
                filter: 'grayscale(100%) brightness(55%)',
              }}
            />
          }
        />
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All availability card variants displayed together. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

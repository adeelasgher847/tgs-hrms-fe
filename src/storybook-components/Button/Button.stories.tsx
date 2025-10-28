import type { Meta, StoryObj } from '@storybook/react';
import Button from './Button';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants and states.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: 'Button variant style',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Loading state',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Full width button',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disabled state',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Outline: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Danger: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Delete',
    variant: 'danger',
  },
};

export const Loading: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Loading Button',
    loading: true,
  },
};

export const Disabled: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Small: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Small Button',
    size: 'small',
  },
};

export const Large: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

export const FullWidth: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <Button {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    children: 'Full Width Button',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const AllVariants: Story = {
  render: () => (
    <StoryThemeWrapper>
      <div style={{ display: 'flex', gap: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
    </StoryThemeWrapper>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All button variants displayed together. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

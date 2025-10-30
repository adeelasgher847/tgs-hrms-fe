import type { Meta, StoryObj } from '@storybook/react';
import EditIconComponent from './EditIcon';

const meta: Meta<typeof EditIconComponent> = {
  title: 'Components/Edit Icon',
  component: EditIconComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI Edit Icon component with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['icon', 'button', 'menu-item', 'tooltip'],
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    color: {
      control: { type: 'select' },
      options: ['inherit', 'primary', 'secondary', 'error', 'info', 'success', 'warning'],
    },
    disabled: {
      control: { type: 'boolean' },
    },
    responsive: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditIconComponent>;

export const Default: Story = {
  args: {
    variant: 'icon',
    size: 'medium',
    color: 'primary',
    disabled: false,
    onClick: () => alert('Edit icon clicked!'),
  },
};

export const AsButton: Story = {
  args: {
    variant: 'button',
    color: 'primary',
    size: 'medium',
    label: 'Edit Item',
    onClick: () => alert('Edit button clicked!'),
  },
};

export const AsMenuItem: Story = {
  args: {
    variant: 'menu-item',
    color: 'primary',
    label: 'Edit',
    onClick: () => alert('Edit menu item clicked!'),
  },
};

export const WithTooltip: Story = {
  args: {
    variant: 'tooltip',
    color: 'primary',
    tooltip: 'Edit this item',
    onClick: () => alert('Edit with tooltip clicked!'),
  },
};

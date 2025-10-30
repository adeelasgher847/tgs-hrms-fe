import type { Meta, StoryObj } from '@storybook/react';
import DeleteIconComponent from './DeleteIcon';

const meta: Meta<typeof DeleteIconComponent> = {
  title: 'Components/Delete Icon',
  component: DeleteIconComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI Delete icon component with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
    },
    color: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'action', 'disabled', 'inherit'],
    },
    fontSize: {
      control: { type: 'select' },
      options: ['small', 'medium', 'inherit', 'large'],
    },
    variant: {
      control: { type: 'select' },
      options: ['icon', 'button', 'menu-item', 'tooltip'],
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
type Story = StoryObj<typeof DeleteIconComponent>;

export const Default: Story = {
  args: {
    size: 'medium',
    color: 'error',
    fontSize: 'medium',
    variant: 'icon',
    disabled: false,
    onClick: () => alert('Delete clicked!'),
  },
};

export const AsButton: Story = {
  args: {
    variant: 'button',
    color: 'error',
    size: 'medium',
    label: 'Delete Item',
    onClick: () => alert('Delete button clicked!'),
  },
};

export const AsMenuItem: Story = {
  args: {
    variant: 'menu-item',
    color: 'error',
    label: 'Delete',
    onClick: () => alert('Delete menu item clicked!'),
  },
};

export const WithTooltip: Story = {
  args: {
    variant: 'tooltip',
    color: 'error',
    tooltip: 'Delete this item permanently',
    onClick: () => alert('Delete with tooltip clicked!'),
  },
};

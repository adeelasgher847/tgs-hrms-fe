import type { Meta, StoryObj } from '@storybook/react';
import Card from './Card';
import Button from '../Button/Button';
import { Typography, Box } from '@mui/material';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A flexible card component with header, content, and actions.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined'],
      description: 'Card variant style',
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium', 'large'],
      description: 'Card size',
    },
    statusColor: {
      control: { type: 'select' },
      options: ['default', 'primary', 'secondary', 'success', 'error', 'warning'],
      description: 'Status chip color',
    },
    fullWidth: {
      control: { type: 'boolean' },
      description: 'Full width card',
    },
    clickable: {
      control: { type: 'boolean' },
      description: 'Clickable card',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This is the card content. It can contain any React elements.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Card Title',
    subtitle: 'Card subtitle',
  },
};

export const WithActions: Story = {
  render: (args) => (
    <Card 
      {...args}
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outline" size="small">
            Cancel
          </Button>
          <Button variant="primary" size="small">
            Save
          </Button>
        </Box>
      }
    >
      <Typography>
        This card includes action buttons in the footer.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Card with Actions',
    subtitle: 'This card has action buttons',
  },
};

export const WithStatus: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This card shows a status indicator in the header.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Task Card',
    subtitle: 'Project Management',
    status: 'In Progress',
    statusColor: 'warning',
  },
};

export const WithAvatar: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This card includes an avatar in the header.
      </Typography>
    </Card>
  ),
  args: {
    title: 'John Doe',
    subtitle: 'Software Engineer',
    avatar: 'https://i.pravatar.cc/150?img=1',
  },
};

export const Elevated: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This card has an elevated shadow effect.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Elevated Card',
    subtitle: 'Higher shadow',
    variant: 'elevated',
  },
};

export const Outlined: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This card has an outlined border style.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Outlined Card',
    subtitle: 'Border style',
    variant: 'outlined',
  },
};

export const Clickable: Story = {
  render: (args) => (
    <Card {...args} onClick={() => alert('Card clicked!')}>
      <Typography>
        This card is clickable and will show an alert when clicked.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Clickable Card',
    subtitle: 'Click to interact',
    clickable: true,
  },
};

export const Small: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography variant="body2">
        This is a small card with compact spacing.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Small Card',
    size: 'small',
  },
};

export const Large: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This is a large card with more generous spacing.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Large Card',
    size: 'large',
  },
};

export const FullWidth: Story = {
  render: (args) => (
    <Card {...args}>
      <Typography>
        This card takes the full width of its container.
      </Typography>
    </Card>
  ),
  args: {
    title: 'Full Width Card',
    subtitle: 'Spans entire container',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
};

export const AllVariants: Story = {
  render: () => (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <Card
        title="Default Card"
        variant="default"
      >
        <Typography>Default variant</Typography>
      </Card>
      <Card
        title="Elevated Card"
        variant="elevated"
      >
        <Typography>Elevated variant</Typography>
      </Card>
      <Card
        title="Outlined Card"
        variant="outlined"
      >
        <Typography>Outlined variant</Typography>
      </Card>
    </Box>
  ),
  parameters: {
    docs: {
      description: {
        story: 'All card variants displayed together.',
      },
    },
  },
};

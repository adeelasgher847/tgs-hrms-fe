import type { Meta, StoryObj } from '@storybook/react';
import DataTable from './DataTable';
import { StoryThemeWrapper } from '../theme';

const meta: Meta<typeof DataTable> = {
  title: 'Common/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Data table component for displaying tabular data with actions. Shows asset information with status chips, assigned users, and action menus.',
      },
    },
  },
  argTypes: {
    data: {
      control: { type: 'object' },
      description: 'Array of data objects to display in the table',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Loading state',
    },
    onEdit: {
      action: 'edit',
      description: 'Callback when edit is clicked',
    },
    onDelete: {
      action: 'delete',
      description: 'Callback when delete is clicked',
    },
    onView: {
      action: 'view',
      description: 'Callback when view is clicked',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DataTable>;

// Mock data variations
const mockData = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    description: 'Apple MacBook Pro 16-inch with M2 chip',
    category: 'Laptop',
    status: 'Assigned',
    assignedTo: 'John Doe',
    purchaseDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Dell Monitor 27"',
    description: 'Dell UltraSharp 27-inch 4K monitor',
    category: 'Monitor',
    status: 'Available',
    assignedTo: null,
    purchaseDate: '2024-01-10',
  },
  {
    id: '3',
    name: 'Logitech MX Master 3',
    description: 'Wireless mouse with advanced features',
    category: 'Accessory',
    status: 'Assigned',
    assignedTo: 'Jane Smith',
    purchaseDate: '2024-01-20',
  },
  {
    id: '4',
    name: 'Standing Desk',
    description: 'Adjustable height standing desk',
    category: 'Furniture',
    status: 'Maintenance',
    assignedTo: null,
    purchaseDate: '2024-01-05',
  },
  {
    id: '5',
    name: 'iPhone 15 Pro',
    description: 'Apple iPhone 15 Pro 256GB',
    category: 'Phone',
    status: 'Assigned',
    assignedTo: 'Mike Johnson',
    purchaseDate: '2024-01-25',
  },
];

const mockDataFew = [
  {
    id: '1',
    name: 'MacBook Pro 16"',
    description: 'Apple MacBook Pro 16-inch with M2 chip',
    category: 'Laptop',
    status: 'Assigned',
    assignedTo: 'John Doe',
    purchaseDate: '2024-01-15',
  },
  {
    id: '2',
    name: 'Dell Monitor 27"',
    description: 'Dell UltraSharp 27-inch 4K monitor',
    category: 'Monitor',
    status: 'Available',
    assignedTo: null,
    purchaseDate: '2024-01-10',
  },
];

export const Default: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <DataTable {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    data: mockData,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default data table with asset information. Shows various status types, assigned users, and action menus. Use the theme toggle button to switch between light and dark modes.',
      },
    },
  },
};

export const FewItems: Story = {
  render: (args) => (
    <StoryThemeWrapper>
      <DataTable {...args} />
    </StoryThemeWrapper>
  ),
  args: {
    data: mockDataFew,
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Data table with fewer items showing how the table adapts to different data sizes.',
      },
    },
  },
};




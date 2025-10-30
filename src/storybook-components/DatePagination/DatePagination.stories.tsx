import type { Meta, StoryObj } from '@storybook/react';
import { DateSelectionComponent, PaginationComponent } from './DatePagination';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';

const meta: Meta<typeof DateSelectionComponent> = {
  title: 'Components/Date Selection & Pagination',
  component: DateSelectionComponent,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Material UI Date Selection and Pagination components with various configurations and responsive design for all screen sizes.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: { type: 'boolean' },
    },
    required: {
      control: { type: 'boolean' },
    },
    error: {
      control: { type: 'boolean' },
    },
    responsive: {
      control: { type: 'boolean' },
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'medium'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DateSelectionComponent>;

export const DateSelection: Story = {
  args: {
    value: '2024-01-15',
    onChange: () => {},
    label: 'Select Date',
    disabled: false,
    required: false,
    error: false,
    responsive: false,
    size: 'medium',
  },
  render: (args) => {
    const [date, setDate] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 300 }}>
        <DateSelectionComponent
          {...args}
          value={date}
          onChange={setDate}
        />
      </Box>
    );
  },
};

export const DateSelectionWithError: Story = {
  args: {
    value: '2024-01-15',
    onChange: () => {},
    label: 'Select Date',
    error: true,
    helperText: 'Please select a valid date',
    responsive: false,
  },
  render: (args) => {
    const [date, setDate] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 300 }}>
        <DateSelectionComponent
          {...args}
          value={date}
          onChange={setDate}
        />
      </Box>
    );
  },
};

export const DateSelectionDisabled: Story = {
  args: {
    value: '2024-01-15',
    onChange: () => {},
    label: 'Select Date',
    disabled: true,
    responsive: false,
  },
  render: (args) => {
    const [date, setDate] = useState(args.value);
    return (
      <Box sx={{ maxWidth: 300 }}>
        <DateSelectionComponent
          {...args}
          value={date}
          onChange={setDate}
        />
      </Box>
    );
  },
};

export const PaginationBasic: Story = {
  render: () => {
    const [page, setPage] = useState(0);

    const handleChangePage = (event: unknown, newPage: number) => {
      setPage(newPage);
    };

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Basic Pagination
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Simple pagination with page navigation
        </Typography>
        <PaginationComponent
          count={100}
          page={page}
          onPageChange={handleChangePage}
          variant="pagination"
        />
      </Box>
    );
  },
};

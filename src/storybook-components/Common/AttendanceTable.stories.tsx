import type { Meta, StoryObj } from '@storybook/react';
import AttendanceTable from './AttendanceTable';

const meta: Meta<typeof AttendanceTable> = {
  title: 'Common/AttendanceTable',
  component: AttendanceTable,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    data: {
      control: 'object',
      description: 'Attendance data array',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state',
    },
    showEmployeeColumn: {
      control: 'boolean',
      description: 'Show employee column',
    },
    onExport: {
      action: 'export',
      description: 'Export button click handler',
    },
    onDateChange: {
      action: 'dateChange',
      description: 'Date change handler',
    },
    currentDate: {
      control: 'text',
      description: 'Current selected date',
    },
    showDateControl: {
      control: 'boolean',
      description: 'Show date selector control',
    },
    showExportButton: {
      control: 'boolean',
      description: 'Show export button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AttendanceTable>;

// Mock data for different scenarios
const mockDataWithEmployees = [
  {
    id: '1',
    userId: 'user1',
    date: '2024-01-15',
    checkInISO: '2024-01-15T09:00:00Z',
    checkOutISO: '2024-01-15T17:30:00Z',
    checkIn: '09:00 AM',
    checkOut: '05:30 PM',
    workedHours: 8.5,
    user: { first_name: 'John', last_name: 'Doe' },
  },
  {
    id: '2',
    userId: 'user2',
    date: '2024-01-15',
    checkInISO: '2024-01-15T08:45:00Z',
    checkOutISO: '2024-01-15T18:00:00Z',
    checkIn: '08:45 AM',
    checkOut: '06:00 PM',
    workedHours: 9.25,
    user: { first_name: 'Jane', last_name: 'Smith' },
  },
  {
    id: '3',
    userId: 'user3',
    date: '2024-01-15',
    checkInISO: '2024-01-15T09:15:00Z',
    checkOutISO: '2024-01-15T17:45:00Z',
    checkIn: '09:15 AM',
    checkOut: '05:45 PM',
    workedHours: 8.5,
    user: { first_name: 'Mike', last_name: 'Johnson' },
  },
];

const mockDataWithoutEmployees = [
  {
    id: '1',
    userId: 'user1',
    date: '2024-01-15',
    checkInISO: '2024-01-15T09:00:00Z',
    checkOutISO: '2024-01-15T17:30:00Z',
    checkIn: '09:00 AM',
    checkOut: '05:30 PM',
    workedHours: 8.5,
    user: { first_name: 'John', last_name: 'Doe' },
  },
  {
    id: '2',
    userId: 'user2',
    date: '2024-01-15',
    checkInISO: '2024-01-15T08:45:00Z',
    checkOutISO: '2024-01-15T18:00:00Z',
    checkIn: '08:45 AM',
    checkOut: '06:00 PM',
    workedHours: 9.25,
    user: { first_name: 'Jane', last_name: 'Smith' },
  },
];

const mockDataWithIncompleteRecords = [
  {
    id: '1',
    userId: 'user1',
    date: '2024-01-15',
    checkInISO: '2024-01-15T09:00:00Z',
    checkOutISO: '2024-01-15T17:30:00Z',
    checkIn: '09:00 AM',
    checkOut: '05:30 PM',
    workedHours: 8.5,
    user: { first_name: 'John', last_name: 'Doe' },
  },
  {
    id: '2',
    userId: 'user2',
    date: '2024-01-15',
    checkInISO: '2024-01-15T09:30:00Z',
    checkOutISO: null,
    checkIn: '09:30 AM',
    checkOut: '--',
    workedHours: null,
    user: { first_name: 'Jane', last_name: 'Smith' },
  },
  {
    id: '3',
    userId: 'user3',
    date: '2024-01-15',
    checkInISO: null,
    checkOutISO: null,
    checkIn: '--',
    checkOut: '--',
    workedHours: null,
    user: { first_name: 'Mike', last_name: 'Johnson' },
  },
];

export const Default: Story = {
  args: {
    data: mockDataWithEmployees,
    loading: false,
    showEmployeeColumn: true,
    currentDate: '2024-01-15',
    showDateControl: false,
    showExportButton: false,
  },
};

export const WithoutEmployeeColumn: Story = {
  args: {
    data: mockDataWithoutEmployees,
    loading: false,
    showEmployeeColumn: false,
    currentDate: '2024-01-15',
    showDateControl: false,
    showExportButton: false,
  },
};

export const WithIncompleteRecords: Story = {
  args: {
    data: mockDataWithIncompleteRecords,
    loading: false,
    showEmployeeColumn: true,
    currentDate: '2024-01-15',
    showDateControl: false,
    showExportButton: false,
  },
};

export const Loading: Story = {
  args: {
    data: [],
    loading: true,
    showEmployeeColumn: true,
    currentDate: '2024-01-15',
    showDateControl: false,
    showExportButton: false,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    loading: false,
    showEmployeeColumn: true,
    currentDate: '2024-01-15',
    showDateControl: false,
    showExportButton: false,
  },
};

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
} from '@mui/material';
import { FileDownload as FileDownloadIcon } from '@mui/icons-material';

// Mock attendance data
const mockAttendanceData = [
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
  {
    id: '4',
    userId: 'user4',
    date: '2024-01-15',
    checkInISO: '2024-01-15T09:30:00Z',
    checkOutISO: null,
    checkIn: '09:30 AM',
    checkOut: '--',
    workedHours: null,
    user: { first_name: 'Sarah', last_name: 'Wilson' },
  },
  {
    id: '5',
    userId: 'user5',
    date: '2024-01-15',
    checkInISO: null,
    checkOutISO: null,
    checkIn: '--',
    checkOut: '--',
    workedHours: null,
    user: { first_name: 'Alex', last_name: 'Brown' },
  },
];

interface AttendanceTableProps {
  data?: typeof mockAttendanceData;
  loading?: boolean;
  showEmployeeColumn?: boolean;
  onExport?: () => void;
  onDateChange?: (date: string) => void;
  currentDate?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  data = mockAttendanceData,
  loading = false,
  showEmployeeColumn = true,
  onExport,
  onDateChange,
  currentDate = '2024-01-15',
}) => {
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = event.target.value;
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const handleExport = () => {
    console.log('Export attendance data');
    onExport?.();
  };

  const filteredData = data.filter(record => record.date === selectedDate);

  return (
    <Paper sx={{ p: 3, backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography 
          variant="h6" 
          fontFamily="var(--font-family-primary)"
          fontWeight="var(--font-weight-semibold)"
          color="var(--text-primary)"
        >
          Attendance Records
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'var(--bg-primary)',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary-color)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary-color)',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: 'var(--primary-color)',
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            sx={{
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-family-primary)',
              '&:hover': {
                borderColor: 'var(--primary-color)',
                backgroundColor: 'var(--bg-hover)',
              },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Attendance Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {showEmployeeColumn && (
                <TableCell 
                  sx={{ 
                    fontWeight: 'bold',
                    fontFamily: 'var(--font-family-primary)',
                    color: 'var(--text-primary)',
                  }}
                >
                  Employee
                </TableCell>
              )}
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                Date
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                Check In
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                Check Out
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-family-primary)',
                  color: 'var(--text-primary)',
                }}
              >
                Worked Hours
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={showEmployeeColumn ? 5 : 4}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <CircularProgress sx={{ color: 'var(--primary-color)' }} />
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map(record => (
                <TableRow key={record.id} hover>
                  {showEmployeeColumn && (
                    <TableCell>
                      <Typography 
                        variant="body2"
                        fontFamily="var(--font-family-primary)"
                        color="var(--text-primary)"
                      >
                        {record.user?.first_name} {record.user?.last_name}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography 
                      variant="body2"
                      fontFamily="var(--font-family-primary)"
                      color="var(--text-primary)"
                    >
                      {record.checkInISO
                        ? record.checkInISO.split('T')[0]
                        : '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      fontFamily="var(--font-family-primary)"
                      color="var(--text-primary)"
                    >
                      {record.checkIn || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      fontFamily="var(--font-family-primary)"
                      color="var(--text-primary)"
                    >
                      {record.checkOut || '--'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2"
                      fontFamily="var(--font-family-primary)"
                      color="var(--text-primary)"
                    >
                      {record.workedHours ?? '--'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={showEmployeeColumn ? 5 : 4}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography 
                    variant="body2" 
                    color="var(--text-secondary)"
                    fontFamily="var(--font-family-primary)"
                  >
                    No attendance records found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Show total records count */}
      {filteredData.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Typography 
            variant="body2" 
            color="var(--text-secondary)"
            fontFamily="var(--font-family-primary)"
          >
            Showing all {filteredData.length} records
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default AttendanceTable;

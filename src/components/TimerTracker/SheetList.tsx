import React, { useEffect, useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  CircularProgress,
  Typography,
} from '@mui/material';
import timesheetApi, { type TimesheetEntry } from '../../api/timesheetApi';

const SheetList: React.FC = () => {
  const [timesheet, setTimesheet] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await timesheetApi.getUserTimesheet();
      setTimesheet(data);
    } catch (error) {
      console.error('Error fetching timesheet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Employee</TableCell>
            <TableCell>Start Time</TableCell>
            <TableCell>End Time</TableCell>
            <TableCell>Duration (hrs)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {timesheet.length > 0 ? (
            timesheet.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.employee_full_name}</TableCell>
                <TableCell>{new Date(row.start_time || '').toLocaleString()}</TableCell>
                <TableCell>
                  {row.end_time ? new Date(row.end_time).toLocaleString() : '—'}
                </TableCell>
                <TableCell>{row.duration_hours ?? '—'}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4}>
                <Typography textAlign="center">No sessions found</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
    </Box>
  );
};

export default SheetList;

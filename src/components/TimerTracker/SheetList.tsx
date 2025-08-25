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
  Pagination,
  Button,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import timesheetApi from '../../api/timesheetApi';
import type { TimesheetEntry } from '../../api/timesheetApi';

const SheetList: React.FC = () => {
  const [timesheet, setTimesheet] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async (page: number = 1) => {
    try {
      setLoading(true);
      console.log('🔄 SheetList - Fetching timesheet data for page:', page);

      const response = await timesheetApi.getUserTimesheet(page);
      console.log('✅ SheetList - API Response:', response);

      // Access sessions from the new nested structure
      setTimesheet(response.items.sessions);

      // Update pagination state
      setCurrentPage(response.page || 1);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.total || 0);
    } catch (error) {
      console.error('❌ SheetList - Error fetching timesheet:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    console.log('🔄 SheetList - Changing to page:', page);
    setCurrentPage(page);
    fetchData(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log('🔄 SheetList - Refreshing data');
    fetchData(currentPage);
  };

  return (
    <Box p={2}>
      <Typography variant='h6' gutterBottom>
        Timesheet Sessions
      </Typography>

      <Box display='flex' gap={2} mb={2} flexWrap='wrap' alignItems='center'>
        <Button
          variant='outlined'
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Paper elevation={3}>
        <TableContainer>
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align='center'>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : timesheet.length > 0 ? (
                timesheet.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.employee_full_name}</TableCell>
                    <TableCell>
                      {new Date(row.start_time || '').toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {row.end_time
                        ? new Date(row.end_time).toLocaleString()
                        : '—'}
                    </TableCell>
                    <TableCell>{row.duration_hours ?? '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align='center'>
                    <Typography>No timesheet sessions found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => handlePageChange(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Pagination Info */}
      {totalItems > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {totalPages} ({totalItems} total
            records)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SheetList;

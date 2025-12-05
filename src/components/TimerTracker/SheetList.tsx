import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
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
} from '@mui/material';
import timesheetApi from '../../api/timesheetApi';
import type { TimesheetEntry } from '../../api/timesheetApi';
import { formatDate } from '../../utils/dateUtils';

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

      const response = await timesheetApi.getUserTimesheet(page);

      // Access sessions from the new nested structure
      setTimesheet(response.items.sessions);

      // Update pagination state
      setCurrentPage(response.page || 1);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.total || 0);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
  }, []);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page);
  };

  // Format date with time (keeps time, formats date part)
  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      
      const formattedDate = formatDate(date);
      const time = date.toLocaleTimeString();
      return `${formattedDate} ${time}`;
    } catch {
      return '—';
    }
  };
  const { language } = useLanguage();

  const sheetLabels = {
    en: {
      employee: 'Employee',
      startTime: 'Start Time',
      endTime: 'End Time',
      duration: 'Duration (hrs)',
      noSessions: 'No timesheet sessions found.',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      employee: 'الموظف',
      startTime: 'وقت البدء',
      endTime: 'وقت الانتهاء',
      duration: 'المدة (ساعات)',
      noSessions: 'لا توجد جلسات في الجدول.',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;

  return (
    <Box>
      <Paper elevation={3} sx={{ boxShadow: 'none' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{sheetLabels[language].employee}</TableCell>
                <TableCell>{sheetLabels[language].startTime}</TableCell>
                <TableCell>{sheetLabels[language].endTime}</TableCell>
                <TableCell>{sheetLabels[language].duration}</TableCell>
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
                      {formatDateTime(row.start_time)}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(row.end_time)}
                    </TableCell>
                    <TableCell>{row.duration_hours ?? '—'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align='center'>
                    <Typography>{sheetLabels[language].noSessions}</Typography>
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
            {sheetLabels[language].showingInfo(
              currentPage,
              totalPages,
              totalItems
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SheetList;

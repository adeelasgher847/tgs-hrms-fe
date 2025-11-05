import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useLocation } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';
import attendanceSummaryApi from '../../api/reportApi';

interface AttendanceSummaryItem {
  employeeName?: string;
  department?: string;
  designation?: string;
  workingDays?: number;
  presents?: number;
  absents?: number;
  informedLeaves?: number;
}

const AttendanceSummaryReport: React.FC = () => {
  const location = useLocation();
  const { user, loading: userLoading } = useUser();
  const [summaryData, setSummaryData] = useState<AttendanceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'thisMonth' | 'prevMonth' | '60days' | '90days'
  >('thisMonth');
  // Snackbar states
  const [openToast, setOpenToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<
    'success' | 'error' | 'warning' | 'info'
  >('success');

  const showToast = useCallback(
    (
      message: string,
      severity: 'success' | 'error' | 'warning' | 'info' = 'info'
    ) => {
      setToastMessage(message);
      setToastSeverity(severity);
      setOpenToast(true);
    },
    []
  );

  const getDaysRange = React.useCallback(() => {
    switch (filter) {
      case 'thisMonth':
        return new Date().getDate();
      case 'prevMonth': {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0
        ).getDate();
      }
      case '60days':
        return 60;
      case '90days':
        return 90;
      default:
        return 30;
    }
  }, [filter]);

  useEffect(() => {
    // Wait for user loading to complete
    if (userLoading) {
      return;
    }

    // Get tenant ID - if not available, clear data and return
    const tenantId = user?.tenant;
    if (!tenantId) {
      setSummaryData([]);
      setLoading(false);
      return;
    }

    // Fetch data when tenant is available
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const days = getDaysRange();
        const resp = await attendanceSummaryApi.getAttendanceSummary(
          tenantId,
          days
        );

        let items: AttendanceSummaryItem[] = [];

        if (!resp) {
          items = [];
        } else if (Array.isArray(resp)) {
          items = resp as AttendanceSummaryItem[];
        } else if (Array.isArray((resp as Record<string, unknown>).items)) {
          items = (resp as Record<string, unknown>)
            .items as AttendanceSummaryItem[];
        } else if (Array.isArray((resp as Record<string, unknown>).data)) {
          items = (resp as Record<string, unknown>)
            .data as AttendanceSummaryItem[];
        } else {
          items = [];
        }

        setSummaryData(items);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setSummaryData([]);
        showToast('Failed to fetch attendance summary.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [
    user?.tenant,
    userLoading,
    filter,
    getDaysRange,
    showToast,
    location.pathname,
  ]);

  const safeData = Array.isArray(summaryData) ? summaryData : [];

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    if (safeData.length === 0) {
      showToast('No data to download.', 'warning');
      return;
    }

    const csvHeader = [
      'Employee Name',
      'Department',
      'Designation',
      'Working Days',
      'Presents',
      'Absents',
      'Informed Leaves',
    ];

    const rows = safeData.map(row =>
      [
        csvEscape(row.employeeName),
        csvEscape(row.department),
        csvEscape(row.designation),
        csvEscape(row.workingDays),
        csvEscape(row.presents),
        csvEscape(row.absents),
        csvEscape(row.informedLeaves),
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const label =
      filter === 'thisMonth'
        ? 'ThisMonth'
        : filter === 'prevMonth'
          ? 'PreviousMonth'
          : filter === '60days'
            ? 'Last60Days'
            : 'Last90Days';

    a.setAttribute('download', `AttendanceSummary_${label}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('CSV file downloaded successfully.', 'success');
  };

  return (
    <Box>
      <Typography variant='h4' gutterBottom>
        Attendance Summary Report
      </Typography>

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        gap={2}
      >
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <Select
            value={filter}
            onChange={e => {
              setFilter(
                e.target.value as
                  | 'thisMonth'
                  | 'prevMonth'
                  | '60days'
                  | '90days'
              );
            }}
          >
            <MenuItem value='thisMonth'>This Month</MenuItem>
            <MenuItem value='prevMonth'>Previous Month</MenuItem>
            <MenuItem value='60days'>Last 60 Days</MenuItem>
            <MenuItem value='90days'>Last 90 Days</MenuItem>
          </Select>
        </FormControl>

        <Tooltip title='Export All Attendance'>
          <IconButton
            color='primary'
            onClick={handleDownload}
            sx={{
              backgroundColor: 'primary.main',
              borderRadius: '6px',
              padding: '6px',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            }}
          >
            <FileDownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
        >
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ mt: 2, boxShadow: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>Employee Name</b>
                  </TableCell>
                  <TableCell>
                    <b>Department</b>
                  </TableCell>
                  <TableCell>
                    <b>Designation</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Working Days</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Presents</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Absents</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Informed Leaves</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {safeData.length > 0 ? (
                  safeData.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.employeeName ?? '--'}</TableCell>
                      <TableCell>{row.department ?? '--'}</TableCell>
                      <TableCell>{row.designation ?? '--'}</TableCell>
                      <TableCell align='center'>
                        {row.workingDays ?? '--'}
                      </TableCell>
                      <TableCell align='center'>
                        {row.presents ?? '--'}
                      </TableCell>
                      <TableCell align='center'>
                        {row.absents ?? '--'}
                      </TableCell>
                      <TableCell align='center'>
                        {row.informedLeaves ?? '--'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align='center'>
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box textAlign='center' my={2} px={2}>
        <Box display='inline-block'>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            Total: {safeData.length} record{safeData.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* ✅ Snackbar */}
      <Snackbar
        open={openToast}
        autoHideDuration={4000}
        onClose={() => setOpenToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setOpenToast(false)}
          severity={toastSeverity}
          sx={{
            width: '100%',
            backgroundColor:
              toastSeverity === 'success' ? '#2e7d32' : '#d32f2f',
            color: 'white !important',
            '& .MuiAlert-icon': {
              color: 'white',
            },
          }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendanceSummaryReport;

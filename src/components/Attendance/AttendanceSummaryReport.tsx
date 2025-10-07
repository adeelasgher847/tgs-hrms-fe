import { useEffect, useState } from 'react';
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
  Pagination,
  FormControl,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useUser } from '../../hooks/useUser';
import attendanceSummaryApi from '../../api/reportApi';

const AttendanceSummaryReport = () => {
  const { user, loading: userLoading } = useUser();
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<
    'thisMonth' | 'prevMonth' | '60days' | '90days'
  >('thisMonth');
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  const getDaysRange = () => {
    switch (filter) {
      case 'thisMonth':
        return new Date().getDate();
      case 'prevMonth':
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return new Date(
          lastMonth.getFullYear(),
          lastMonth.getMonth() + 1,
          0
        ).getDate();
      case '60days':
        return 60;
      case '90days':
        return 90;
      default:
        return 30;
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      if (userLoading) return;
      if (!user?.tenant) {
        console.warn('Missing tenantId — cannot fetch report.');
        return;
      }

      setLoading(true);
      try {
        const days = getDaysRange();
        const response = await attendanceSummaryApi.getAttendanceSummary(
          user.tenant,
          days
        );
        setSummaryData(response.items || []);
        setTotalPages(response.totalPages || 1);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setSummaryData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [user, userLoading, filter]);

  const paginatedData = summaryData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleDownload = () => {
    if (summaryData.length === 0) {
      alert('No data to download.');
      return;
    }

    const csvHeader = [
      'Employee Name',
      'Department',
      'Working Days',
      'Leaves',
      'Absent Days',
    ];
    const csvRows = summaryData.map(row =>
      [
        row.employeeName,
        row.department,
        row.workingDays,
        row.leaves,
        row.absentDays,
      ].join(',')
    );

    const csvContent = [csvHeader.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;

    const label =
      filter === 'thisMonth'
        ? 'ThisMonth'
        : filter === 'prevMonth'
          ? 'PreviousMonth'
          : filter === '60days'
            ? 'Last60Days'
            : 'Last90Days';

    link.setAttribute('download', `AttendanceSummary_${label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      <Box>
        <Typography variant='h4'>Attendance Summary Report</Typography>

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
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value='thisMonth'>This Month</MenuItem>
              <MenuItem value='prevMonth'>Previous Month</MenuItem>
              <MenuItem value='60days'>Last 60 Days</MenuItem>
              <MenuItem value='90days'>Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant='contained'
            color='primary'
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download
          </Button>
        </Box>
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
        <Paper sx={{ mt: 2 }}>
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
                  <TableCell align='center'>
                    <b>Working Days</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Leaves</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>Absent Days</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.employeeName}</TableCell>
                      <TableCell>{row.department}</TableCell>
                      <TableCell align='center'>{row.workingDays}</TableCell>
                      <TableCell align='center'>{row.leaves}</TableCell>
                      <TableCell align='center'>{row.absentDays}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align='center'>
                      No data found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {summaryData.length > itemsPerPage && (
        <Box textAlign='center' my={2} px={2}>
          <Box display='inline-block'>
            <Pagination
              count={Math.ceil(summaryData.length / itemsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color='primary'
            />
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Showing{' '}
              {Math.min((page - 1) * itemsPerPage + 1, summaryData.length)}–
              {Math.min(page * itemsPerPage, summaryData.length)} of{' '}
              {summaryData.length} records
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AttendanceSummaryReport;

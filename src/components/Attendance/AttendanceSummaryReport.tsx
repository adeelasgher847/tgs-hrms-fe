import React, { useEffect, useState } from 'react';
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
  Tooltip,
  IconButton,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
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

const ITEMS_PER_PAGE = 10;

const AttendanceSummaryReport: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const [summaryData, setSummaryData] = useState<AttendanceSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<
    'thisMonth' | 'prevMonth' | '60days' | '90days'
  >('thisMonth');
  const [totalPages, setTotalPages] = useState<number>(1);

  const getDaysRange = () => {
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
  };

  useEffect(() => {
    const fetchSummary = async () => {
      if (userLoading) return;
      if (!user?.tenant) {
        console.warn('Missing tenantId — cannot fetch report.');
        setSummaryData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const days = getDaysRange();
        const resp = await attendanceSummaryApi.getAttendanceSummary(
          user.tenant,
          days
        );

        let items: AttendanceSummaryItem[] = [];
        let serverTotalPages: number | undefined;

        if (!resp) {
          items = [];
        } else if (Array.isArray(resp)) {
          items = resp as AttendanceSummaryItem[];
        } else if (Array.isArray((resp as any).items)) {
          items = (resp as any).items as AttendanceSummaryItem[];
          serverTotalPages = (resp as any).totalPages;
        } else if (Array.isArray((resp as any).data)) {
          items = (resp as any).data as AttendanceSummaryItem[];
        } else {
          items = [];
        }

        setSummaryData(items);

        if (typeof serverTotalPages === 'number' && serverTotalPages > 0) {
          setTotalPages(serverTotalPages);
        } else {
          setTotalPages(Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE)));
        }

        setPage(prev => {
          const computedCount =
            serverTotalPages ??
            Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
          return Math.min(prev, computedCount);
        });
      } catch (err) {
        console.error('Error fetching summary:', err);
        setSummaryData([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
    setPage(1);
  }, [user, userLoading, filter]);

  const safeData = Array.isArray(summaryData) ? summaryData : [];

  const paginatedData = safeData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const csvEscape = (value: any) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    if (safeData.length === 0) {
      alert('No data to download.');
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
              setFilter(e.target.value as any);
              setPage(1);
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
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, idx) => (
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
            Showing{' '}
            {safeData.length === 0
              ? 0
              : Math.min((page - 1) * ITEMS_PER_PAGE + 1, safeData.length)}
            –{Math.min(page * ITEMS_PER_PAGE, safeData.length)} of{' '}
            {safeData.length} records
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AttendanceSummaryReport;

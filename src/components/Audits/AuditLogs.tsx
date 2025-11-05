import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  IconButton,
  Tooltip,
  Pagination,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import systemDashboardApiService, {
  type RecentLog,
} from '../../api/systemDashboardApi';

const AuditLogs: React.FC = () => {
  const theme = useTheme();

  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchLogs = useCallback(async (page: number = 1) => {
    try {
      setLogsLoading(true);
      const response = await systemDashboardApiService.getSystemLogs(page);
      setLogs(response);
    } catch (err) {
      console.error('Error fetching system logs:', err);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [fetchLogs, currentPage]);

  const handleExportLogs = async () => {
    const blob = await systemDashboardApiService.exportSystemLogs();
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit_logs.csv';
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Typography
        variant='h4'
        mb={3}
        sx={{
          color: theme.palette.text.primary,
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        Audit Logs
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'flex-end',
          alignItems: 'center',
          mb: 2,
          gap: 1,
        }}
      >
        <Tooltip title='Export Audit Logs (CSV)'>
          <IconButton
            color='primary'
            onClick={handleExportLogs}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              borderRadius: '6px',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          overflowX: 'auto',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>User Role</TableCell>
              <TableCell>Tenant Id</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsLoading ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : paginatedLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLogs.map(log => (
                <TableRow key={log.id} hover>
                  <TableCell>{log.action}</TableCell>
                  <TableCell>{log.entityType}</TableCell>
                  <TableCell>{log.userRole || '-'}</TableCell>
                  <TableCell>{log.tenantId}</TableCell>
                  <TableCell>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' mt={2}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {logs.length > 0 && (
        <Box display='flex' justifyContent='center' mt={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {currentPage} of {totalPages} ({logs.length} total
            records)
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AuditLogs;

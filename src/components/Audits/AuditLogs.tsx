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
import { useLanguage } from '../../hooks/useLanguage';

const AuditLogs: React.FC = () => {
  const theme = useTheme();
  const { language } = useLanguage();
  const labels = {
    en: {
      pageTitle: 'Audit Logs',
      exportTooltip: 'Export Audit Logs (CSV)',
      action: 'Action',
      entity: 'Entity',
      userRole: 'User Role',
      tenantId: 'Tenant Id',
      timestamp: 'Timestamp',
      noLogs: 'No logs found',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      pageTitle: 'سجلات التدقيق',
      exportTooltip: 'تصدير سجلات التدقيق (CSV)',
      action: 'الإجراء',
      entity: 'الكيان',
      userRole: 'دور المستخدم',
      tenantId: 'معرّف المستأجر',
      timestamp: 'الطابع الزمني',
      noLogs: 'لم يتم العثور على سجلات',
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;
  const L = labels[language] || labels.en;

  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25; // Backend returns 25 records per page

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

  // Backend returns 25 records per page (fixed page size)
  // If we get 25 records, there might be more pages
  // If we get less than 25, it's the last page
  const hasMorePages = logs.length === itemsPerPage;
  // Since we don't have total count, we'll show pagination based on current page and whether there are more records
  const showPagination = currentPage > 1 || hasMorePages;
  // Calculate estimated total records
  const estimatedTotalRecords = hasMorePages
    ? currentPage * itemsPerPage
    : (currentPage - 1) * itemsPerPage + logs.length;
  const estimatedTotalPages = hasMorePages ? currentPage + 1 : currentPage;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        {language === 'ar' ? (
          <>
            <Tooltip title={L.exportTooltip}>
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
            <Typography
              variant='h4'
              dir='rtl'
              sx={{
                color: theme.palette.text.primary,
                textAlign: { xs: 'center', md: 'right' },
              }}
            >
              {L.pageTitle}
            </Typography>
          </>
        ) : (
          <>
            <Typography
              variant='h4'
              dir='ltr'
              sx={{
                color: theme.palette.text.primary,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              {L.pageTitle}
            </Typography>
            <Tooltip title={L.exportTooltip}>
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
          </>
        )}
      </Box>

      <Box
        sx={{
          overflowX: 'auto',
          backgroundColor: theme.palette.background.paper,
        }}
        dir='ltr'
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>{L.action}</TableCell>
              <TableCell>{L.entity}</TableCell>
              <TableCell>{L.userRole}</TableCell>
              <TableCell>{L.tenantId}</TableCell>
              <TableCell>{L.timestamp}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logsLoading ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align='center'>
                  {L.noLogs}
                </TableCell>
              </TableRow>
            ) : (
              logs.map(log => (
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

      {showPagination && (
        <Box display='flex' justifyContent='center' mt={2}>
          <Pagination
            count={estimatedTotalPages}
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
            {L.showingInfo(
              currentPage,
              estimatedTotalPages,
              estimatedTotalRecords
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default AuditLogs;

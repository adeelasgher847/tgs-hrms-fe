import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  TextField,
  MenuItem,
  Pagination,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import type { Leave } from '../../type/levetypes';
import { formatDate } from '../../utils/dateUtils';
import { leaveApi } from '../../api/leaveApi';

const ITEMS_PER_PAGE = 25;

const statusConfig: Record<
  string,
  {
    color: 'success' | 'error' | 'warning' | 'default';
    icon: React.ReactElement | undefined;
  }
> = {
  pending: {
    color: 'warning',
    icon: <AccessTimeIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  approved: {
    color: 'success',
    icon: <CheckCircleIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  rejected: {
    color: 'error',
    icon: <CancelIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
  withdrawn: {
    color: 'default',
    icon: <UndoIcon fontSize='small' sx={{ mr: 0.5 }} />,
  },
};

interface LeaveHistoryProps {
  leaves: Leave[];
  isAdmin: boolean;
  isManager?: boolean;
  currentUserId?: string;
  onAction?: (id: string, action: 'approved' | 'rejected') => void;
  onWithdraw?: (id: string) => void;
  title?: string;
  showNames?: boolean;
  viewMode?: 'you' | 'team';
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  onExportAll?: () => Promise<Leave[]>;
  userRole?: string;
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  leaves,
  isAdmin,
  isManager = false,
  currentUserId,
  onAction,
  onWithdraw,
  title,
  showNames = false,
  viewMode = 'you',
  currentPage: serverCurrentPage = 1,
  totalPages: serverTotalPages = 1,
  totalItems: serverTotalItems = 0,
  onPageChange,
  isLoading = false,
  onExportAll,
  userRole,
}) => {
  const { language } = useLanguage();
  const pageLabels = {
    en: {
      showingInfo: (page: number, totalPages: number, total: number) =>
        `Showing page ${page} of ${totalPages} (${total} total records)`,
    },
    ar: {
      showingInfo: (page: number, totalPages: number, total: number) =>
        `عرض الصفحة ${page} من ${totalPages} (${total} سجلات)`,
    },
  } as const;
  const PL = pageLabels[language as 'en' | 'ar'] || pageLabels.en;

  const labels = {
    en: {
      title: 'Leave History',
      noHistoryTitle: 'No Leave History Found',
      noHistoryYou: "You haven't applied for any leaves yet.",
      noHistoryDefault: 'No leave requests available.',
      allEmployees: 'All Employees',
      exporting: 'Exporting...',
      exportAll: 'Export All Leave History',
      noExport: 'No leave history to export',
      headers: {
        name: 'Name',
        type: 'Type',
        from: 'From',
        to: 'To',
        applied: 'Applied',
        reason: 'Reason',
        status: 'Status',
        actions: 'Actions / Remarks',
      },
      approve: 'Approve',
      reject: 'Reject',
      withdraw: 'Withdraw',
    },
    ar: {
      title: 'سجل الإجازات',
      noHistoryTitle: 'لم يتم العثور على سجلات الإجازات',
      noHistoryYou: 'لم تقم بتقديم أي طلبات إجازة بعد.',
      noHistoryDefault: 'لا توجد طلبات إجازة.',
      allEmployees: 'جميع الموظفين',
      exporting: 'جاري التصدير...',
      exportAll: 'تصدير سجل الإجازات',
      noExport: 'لا يوجد سجل إجازات للتصدير',
      headers: {
        name: 'الاسم',
        type: 'النوع',
        from: 'من',
        to: 'إلى',
        applied: 'تم التقديم',
        reason: 'السبب',
        status: 'الحالة',
        actions: 'الإجراءات / الملاحظات',
      },
      approve: 'الموافقة',
      reject: 'رفض',
      withdraw: 'سحب',
    },
  } as const;
  const L = labels[language as 'en' | 'ar'] || labels.en;

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [page, setPage] = useState(1);

  const hideNameColumn = isManager && viewMode === 'you';
  const hideDropdown = isManager && viewMode === 'you';

  const employeeNames = useMemo(() => {
    const names = new Set<string>();
    leaves.forEach(l => {
      const empId = l.employee?.id || l.employeeId;
      const name = l.employee?.first_name;
      if (empId && name && empId !== currentUserId) names.add(name);
    });
    return Array.from(names);
  }, [leaves, currentUserId]);

  const filteredLeaves = useMemo(() => {
    if (isManager && viewMode === 'you') {
      return leaves.filter(
        l => l.employee?.id === currentUserId || l.employeeId === currentUserId
      );
    }

    if (selectedEmployee === '') return leaves;

    return leaves.filter(
      leave => leave.employee?.first_name === selectedEmployee
    );
  }, [selectedEmployee, leaves, isManager, viewMode, currentUserId]);

  const useServerPagination = !!onPageChange && serverTotalPages > 0;
  const currentPage = useServerPagination ? serverCurrentPage : page;
  const totalPages = useServerPagination
    ? serverTotalPages
    : Math.max(1, Math.ceil(filteredLeaves.length / ITEMS_PER_PAGE));
  const totalItems = useServerPagination
    ? serverTotalItems
    : filteredLeaves.length;

  const paginatedLeaves = useServerPagination
    ? filteredLeaves
    : filteredLeaves.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (useServerPagination && onPageChange) {
      onPageChange(newPage);
    } else {
      setPage(newPage);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleDownloadCSV = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      let blob: Blob;
      let filename = 'leave-history.csv';

      // Determine which API to call based on user role and view mode
      const role = userRole || '';
      const isAdminRole = ['hr-admin', 'system-admin', 'admin', 'network-admin'].includes(role);

      if (isAdminRole) {
        // Admin/HR Admin/Network Admin - export all leaves for tenant
        blob = await leaveApi.exportAllLeavesCSV();
        filename = 'all-leaves-export.csv';
      } else if (isManager && viewMode === 'team') {
        // Manager viewing team leaves - export team leave requests
        blob = await leaveApi.exportTeamLeavesCSV();
        filename = 'team-leaves-export.csv';
      } else {
        // Employee or Manager viewing own leaves - export self leave requests
        blob = await leaveApi.exportSelfLeavesCSV();
        filename = 'my-leaves-export.csv';
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting leave history:', error);
      alert('Failed to export leave history. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (!Array.isArray(leaves)) {
    return (
      <Box>
        <Typography color='error'>Error: Invalid leaves data</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
          // reverse the header row for RTL so the title appears on the right
          flexDirection: language === 'ar' ? 'row-reverse' : 'row',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon color='primary' sx={{ fontSize: 32, mr: 1 }} />
          <Typography
            variant='h5'
            fontWeight={600}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
          >
            {title || L.title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }} dir='ltr'>
          {/* controls must remain LTR so DB values (employee names) don't flip */}
          {!hideDropdown && (isAdmin || isManager) && (
            <TextField
              select
              size='small'
              value={selectedEmployee}
              onChange={e => setSelectedEmployee(e.target.value)}
              sx={{ minWidth: 200 }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (value: unknown) =>
                  value === '' ? L.allEmployees : String(value),
              }}
            >
              <MenuItem value=''>{L.allEmployees}</MenuItem>
              {employeeNames.map(name => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Tooltip title={exporting ? L.exporting : L.exportAll}>
            <IconButton
              color='primary'
              onClick={handleDownloadCSV}
              disabled={exporting}
              sx={{
                backgroundColor: 'primary.main',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '&:disabled': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              {exporting ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <FileDownloadIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading ? (
        <Paper elevation={1} sx={{ boxShadow: 'none', py: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : filteredLeaves.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant='h6' color='textSecondary' gutterBottom>
            {L.noHistoryTitle}
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {isManager && viewMode === 'you'
              ? L.noHistoryYou
              : L.noHistoryDefault}
          </Typography>
        </Box>
      ) : (
        <Paper elevation={1} sx={{ boxShadow: 'none' }}>
          <TableContainer dir='ltr'>
            <Table>
              <TableHead>
                <TableRow>
                  {!hideNameColumn && (isAdmin || isManager || showNames) && (
                    <TableCell>{L.headers.name}</TableCell>
                  )}
                  <TableCell>{L.headers.type}</TableCell>
                  <TableCell>{L.headers.from}</TableCell>
                  <TableCell>{L.headers.to}</TableCell>
                  <TableCell>{L.headers.applied}</TableCell>
                  <TableCell>{L.headers.reason}</TableCell>
                  <TableCell>{L.headers.status}</TableCell>
                  <TableCell>{L.headers.actions}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedLeaves.map((leave, index) => (
                  <TableRow key={leave.id || index}>
                    {!hideNameColumn && (isAdmin || isManager || showNames) && (
                      <TableCell>
                        {leave.employee?.first_name || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>{leave.leaveType?.name || 'Unknown'}</TableCell>
                    <TableCell>{formatDate(leave.startDate)}</TableCell>
                    <TableCell>{formatDate(leave.endDate)}</TableCell>
                    <TableCell>{formatDate(leave.createdAt)}</TableCell>
                    <TableCell>
                      <Tooltip
                        title={leave.reason || 'N/A'}
                        placement='top'
                        arrow
                        slotProps={{
                          tooltip: {
                            sx: {
                              position: 'relative',
                              left: '-115px',
                            }
                          }
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 14,
                            maxWidth: { xs: 120, sm: 200, md: 260 },
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {leave.reason || 'N/A'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={statusConfig[leave.status]?.icon}
                        label={
                          leave.status
                            ? leave.status.charAt(0).toUpperCase() +
                              leave.status.slice(1)
                            : 'Unknown'
                        }
                        color={statusConfig[leave.status]?.color}
                        sx={{ fontSize: 15, width: '100%' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1,
                        }}
                      >
                        {leave.status === 'rejected' && leave.remarks && (
                          <Typography
                            variant='body2'
                            sx={{
                              mt: 0.5,
                              fontSize: 13,
                              p: 0.5,
                              borderRadius: 1,
                            }}
                          >
                            {leave.remarks}
                          </Typography>
                        )}

                        {isAdmin && leave.status === 'pending' && onAction && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip
                              label={L.approve}
                              color='success'
                              clickable
                              onClick={() => onAction(leave.id, 'approved')}
                            />
                            <Chip
                              label={L.reject}
                              color='error'
                              clickable
                              onClick={() => onAction(leave.id, 'rejected')}
                            />
                          </Box>
                        )}

                        {isManager &&
                          viewMode === 'you' &&
                          onWithdraw &&
                          leave.status === 'pending' && (
                            <Chip
                              label={L.withdraw}
                              color='warning'
                              clickable
                              onClick={() => onWithdraw(leave.id)}
                            />
                          )}

                        {!isAdmin &&
                          !isManager &&
                          onWithdraw &&
                          leave.status === 'pending' && (
                            <Chip
                              label={L.withdraw}
                              color='warning'
                              clickable
                              onClick={() => onWithdraw(leave.id)}
                            />
                          )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          mt: 3,
        }}
      >
        {totalPages > 1 && (
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, newPage) => handlePageChange(newPage)}
            color='primary'
            showFirstButton
            showLastButton
            sx={{ mb: 1 }}
          />
        )}

        {filteredLeaves.length > 0 && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{
              textAlign: 'center',
              width: 'fit-content',
              mx: 'auto',
            }}
          >
            {PL.showingInfo(currentPage, totalPages, totalItems)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LeaveHistory;

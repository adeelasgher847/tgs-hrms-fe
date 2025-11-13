import React, { useState, useMemo } from 'react';
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

const ITEMS_PER_PAGE = 10;

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

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch {
    return 'N/A';
  }
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
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  leaves,
  isAdmin,
  isManager = false,
  currentUserId,
  onAction,
  onWithdraw,
  title = 'Leave History',
  showNames = false,
  viewMode = 'you',
  currentPage: serverCurrentPage = 1,
  totalPages: serverTotalPages = 1,
  totalItems: serverTotalItems = 0,
  onPageChange,
  isLoading = false,
  onExportAll,
}) => {
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

    let leavesToExport: Leave[] = [];

    // If onExportAll is provided, fetch all leaves from all pages
    if (onExportAll) {
      try {
        setExporting(true);
        leavesToExport = await onExportAll();
      } catch (error) {
        console.error('Error fetching all leaves for export:', error);
        // Fallback to current filtered leaves
        leavesToExport = filteredLeaves;
      } finally {
        setExporting(false);
      }
    } else {
      // Use filtered leaves if no export function provided
      leavesToExport = filteredLeaves;
    }

    if (leavesToExport.length === 0) {
      alert('No leave history to export');
      return;
    }

    const headers = [
      'Name',
      'Type',
      'From',
      'To',
      'Applied',
      'Reason',
      'Status',
      'Remarks',
    ];

    const escapeCSV = (value: unknown): string => {
      if (value == null) return '';
      const str = String(value).replace(/"/g, '""'); // escape double quotes
      return `"${str}"`; // wrap in quotes
    };

    const rows = leavesToExport.map(leave => [
      escapeCSV(leave.employee?.first_name || 'N/A'),
      escapeCSV(leave.leaveType?.name || 'Unknown'),
      escapeCSV(formatDate(leave.startDate)),
      escapeCSV(formatDate(leave.endDate)),
      escapeCSV(formatDate(leave.createdAt)),
      escapeCSV(leave.reason || 'N/A'),
      escapeCSV(leave.status || 'Unknown'),
      escapeCSV(leave.remarks || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join(
      '\n'
    );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leave-history.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon color='primary' sx={{ fontSize: 32, mr: 1 }} />
          <Typography variant='h5' fontWeight={600}>
            {title}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                  value === '' ? 'All Employees' : String(value),
              }}
            >
              <MenuItem value=''>All Employees</MenuItem>
              {employeeNames.map(name => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <Tooltip
            title={exporting ? 'Exporting...' : 'Export All Leave History'}
          >
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
            No Leave History Found
          </Typography>
          <Typography variant='body2' color='textSecondary'>
            {isManager && viewMode === 'you'
              ? "You haven't applied for any leaves yet."
              : 'No leave requests available.'}
          </Typography>
        </Box>
      ) : (
        <Paper elevation={1} sx={{ boxShadow: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {!hideNameColumn && (isAdmin || isManager || showNames) && (
                    <TableCell>Name</TableCell>
                  )}
                  <TableCell>Type</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Applied</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions / Remarks</TableCell>
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
                      <Typography sx={{ fontSize: 14 }}>
                        {leave.reason || 'N/A'}
                      </Typography>
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
                              label='Approve'
                              color='success'
                              clickable
                              onClick={() => onAction(leave.id, 'approved')}
                            />
                            <Chip
                              label='Reject'
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
                              label='Withdraw'
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
                              label='Withdraw'
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
            {useServerPagination
              ? `Showing page ${currentPage} of ${totalPages} (${totalItems} total records)`
              : `Showing page ${page} of ${totalPages} (${totalItems} total records)`}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LeaveHistory;

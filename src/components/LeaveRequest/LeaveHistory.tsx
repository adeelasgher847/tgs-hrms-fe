import React, { useState, useMemo, useEffect } from 'react';
import {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
  Pagination,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Leave } from '../../type/levetypes';
import { formatDate } from '../../utils/dateUtils';
import { leaveApi } from '../../api/leaveApi';
import { PAGINATION } from '../../constants/appConstants';
import AppTable from '../common/AppTable';
import AppDropdown from '../common/AppDropdown';
import type { SelectChangeEvent } from '@mui/material/Select';
import { getIcon } from '../../assets/icons';
import { IoCloseCircleOutline } from 'react-icons/io5';
import LeaveForm from './LeaveForm';
import { env } from '../../config/env';
import { authService } from '../../api/authService';

const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;

// Helper function to construct full URL for documents with authentication
const getDocumentUrl = (docUrl: string): string => {
  if (!docUrl) return '';
  // If it's already an absolute URL (starts with http:// or https://), return as is
  if (docUrl.startsWith('http://') || docUrl.startsWith('https://')) {
    return docUrl;
  }

  // Get token for authentication
  const token = authService.getAccessToken();
  const timestamp = Date.now();

  // Build base URL
  let baseUrl = '';
  if (docUrl.startsWith('/')) {
    baseUrl = `${env.apiBaseUrl}${docUrl}`;
  } else {
    baseUrl = `${env.apiBaseUrl}/${docUrl}`;
  }

  // Add token and timestamp as query parameters
  const separator = baseUrl.includes('?') ? '&' : '?';
  const params = [`t=${timestamp}`];
  if (token) {
    params.push(`token=${encodeURIComponent(token)}`);
  }

  return `${baseUrl}${separator}${params.join('&')}`;
};

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
  onManagerAction?: (id: string, action: 'approved' | 'rejected') => void;
  onManagerResponse?: (id: string) => void;
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
  onRefresh?: () => Promise<void> | void;
}

const LeaveHistory: React.FC<LeaveHistoryProps> = ({
  leaves,
  isAdmin,
  isManager = false,
  currentUserId,
  onAction,
  onManagerAction,
  onManagerResponse,
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
  userRole,
  onRefresh,
}) => {
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [page, setPage] = useState(1);
  const [allLeavesForFilter, setAllLeavesForFilter] = useState<Leave[]>([]);
  const [loadingAllLeaves, setLoadingAllLeaves] = useState(false);
  const [openDocs, setOpenDocs] = useState(false);
  const [currentDocs, setCurrentDocs] = useState<string[]>([]);
  const [openLeaveForm, setOpenLeaveForm] = useState(false);
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedLeaveForMenu, setSelectedLeaveForMenu] =
    useState<Leave | null>(null);

  // Reset page to 1 when employee filter changes
  useEffect(() => {
    setPage(1);
  }, [selectedEmployee]);

  // Fetch all leaves when employee filter is applied (for admin)
  useEffect(() => {
    const fetchAllLeavesForFilter = async () => {
      if (isAdmin && selectedEmployee !== '' && onExportAll) {
        try {
          setLoadingAllLeaves(true);
          const allLeaves = await onExportAll();
          setAllLeavesForFilter(allLeaves);
        } catch {
          setAllLeavesForFilter([]);
        } finally {
          setLoadingAllLeaves(false);
        }
      } else {
        setAllLeavesForFilter([]);
      }
    };

    fetchAllLeavesForFilter();
  }, [selectedEmployee, isAdmin, onExportAll]);

  const hideNameColumn = isManager && viewMode === 'you';
  const hideDropdown = isManager && viewMode === 'you';

  // Use all leaves when employee is filtered, otherwise use current page leaves
  const leavesToUse = useMemo(() => {
    if (isAdmin && selectedEmployee !== '' && allLeavesForFilter.length > 0) {
      return allLeavesForFilter;
    }
    return leaves;
  }, [isAdmin, selectedEmployee, allLeavesForFilter, leaves]);

  const employeeNames = useMemo(() => {
    const names = new Set<string>();
    leavesToUse.forEach(l => {
      const empId = l.employee?.id || l.employeeId;
      const name = l.employee?.first_name;
      if (empId && name && empId !== currentUserId) names.add(name);
    });
    return Array.from(names);
  }, [leavesToUse, currentUserId]);

  const filteredLeaves = useMemo(() => {
    if (isManager && viewMode === 'you') {
      return leavesToUse.filter(
        l => l.employee?.id === currentUserId || l.employeeId === currentUserId
      );
    }

    if (selectedEmployee === '') return leavesToUse;

    return leavesToUse.filter(
      leave => leave.employee?.first_name === selectedEmployee
    );
  }, [selectedEmployee, leavesToUse, isManager, viewMode, currentUserId]);

  // Check if an employee is selected (for admin filtering)
  const isEmployeeFiltered = isAdmin && selectedEmployee !== '';

  // When employee is filtered, disable server pagination and use client-side filtering
  // This ensures we can filter all available leaves, not just the current page
  const useServerPagination =
    !isEmployeeFiltered && !!onPageChange && serverTotalPages > 0;
  const currentPage = useServerPagination ? serverCurrentPage : page;

  // When employee is filtered, calculate pagination based on filtered results
  const filteredTotalItems = filteredLeaves.length;
  const totalPages = useServerPagination
    ? serverTotalPages
    : Math.max(1, Math.ceil(filteredTotalItems / ITEMS_PER_PAGE));

  // When employee is filtered, use filtered count; otherwise use server total
  const totalItems = isEmployeeFiltered
    ? filteredTotalItems
    : useServerPagination
      ? serverTotalItems
      : filteredTotalItems;

  // Use normal pagination for all cases
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

  const handleEditLeave = (leave: Leave) => {
    setEditingLeave(leave);
    setOpenLeaveForm(true);
  };

  const handleCloseLeaveForm = () => {
    setOpenLeaveForm(false);
    setEditingLeave(null);
  };

  const handleDownloadCSV = async () => {
    if (exporting) return;

    try {
      setExporting(true);
      let blob: Blob;
      let filename = 'leave-history.csv';

      // Determine which API to call based on user role and view mode
      const role = userRole || '';
      const isAdminRole = [
        'hr-admin',
        'system-admin',
        'admin',
        'network-admin',
      ].includes(role);

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
    } catch {
      alert('Failed to export leave history. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleViewDocs = (docs: string[]) => {
    setCurrentDocs(docs);
    setFailedImages(new Set()); // Reset failed images when opening dialog
    setOpenDocs(true);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    leave: Leave
  ) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedLeaveForMenu(leave);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedLeaveForMenu(null);
  };

  const refreshLeaves = async () => {
    // If parent provides a refresh callback, use it (silent reload)
    if (onRefresh) {
      try {
        await onRefresh();
        return;
      } catch (err) {
        console.error('Failed to refresh leaves:', err);
      }
    }

    // Fallback to existing logic
    if (isEmployeeFiltered && onExportAll) {
      try {
        const allLeaves = await onExportAll();
        setAllLeavesForFilter(allLeaves);
      } catch (err) {
        console.error('Failed to refresh leaves:', err);
      }
    } else if (!isEmployeeFiltered && onPageChange) {
      onPageChange(currentPage);
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
    <Box sx={{ overflow: 'hidden' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant='h5' fontWeight={600} fontSize={'48px'}>
            {title}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'space-between', sm: 'flex-end' },
            flexWrap: 'wrap',
          }}
        >
          {!hideDropdown && (isAdmin || isManager) && (
            <AppDropdown
              label='All Employees'
              showLabel={false}
              value={selectedEmployee || ''}
              onChange={(e: SelectChangeEvent<string | number>) =>
                setSelectedEmployee(String(e.target.value || ''))
              }
              options={[
                { value: '', label: 'All Employees' },
                ...employeeNames.map(name => ({ value: name, label: name })),
              ]}
              placeholder='All Employees'
              containerSx={{ minWidth: { xs: '100%', sm: 200 } }}
            />
          )}

          <Tooltip
            title={exporting ? 'Exporting...' : 'Export All Leave History'}
          >
            <IconButton
              color='primary'
              onClick={handleDownloadCSV}
              disabled={exporting}
              sx={{
                backgroundColor: 'var(--primary-dark-color)',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'var(--primary-dark-color)',
                },
                '&:disabled': {
                  backgroundColor: 'var(--primary-color)',
                  color: 'var(--primary-dark-color)',
                },
              }}
            >
              {exporting ? (
                <CircularProgress size={20} sx={{ color: 'currentColor' }} />
              ) : (
                <FileDownloadIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading || loadingAllLeaves ? (
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
        <AppTable>
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
              <TableCell>Documents</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell>Manager Remarks</TableCell>}
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedLeaves.map((leave, index) => (
              <TableRow key={leave.id || index}>
                {!hideNameColumn && (isAdmin || isManager || showNames) && (
                  <TableCell>{leave.employee?.first_name || 'N/A'}</TableCell>
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
                        },
                      },
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
                  {leave.documents && leave.documents.length > 0 ? (
                    <IconButton
                      onClick={() => handleViewDocs(leave.documents || [])}
                    >
                      <img
                        src={getIcon('password')}
                        alt='View Documents'
                        width={20}
                        height={20}
                      />
                    </IconButton>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#9e9e9e' }}>
                      No Documents
                    </span>
                  )}
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
                {/* Manager Response - only visible to Admin/HR Admin */}
                {/* Managers see their response in Actions/Remarks column only */}
                {isAdmin && (
                  <TableCell>
                    {leave.managerRemarks ? (
                      <Tooltip title={leave.managerRemarks} arrow>
                        <Typography
                          variant='body2'
                          sx={{
                            fontSize: 13,
                            color: '#424242',
                            maxWidth: 250,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {leave.managerRemarks.length > 50
                            ? `${leave.managerRemarks.substring(0, 50)}...`
                            : leave.managerRemarks}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography
                        variant='body2'
                        sx={{
                          color: '#9e9e9e',
                          fontStyle: 'italic',
                          fontSize: 13,
                        }}
                      >
                        No response
                      </Typography>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1,
                    }}
                  >
                    {/* For admin/HR admin: Don't show remarks in Actions column, only show buttons */}
                    {/* For non-admin users: Show rejection remarks */}
                    {!isAdmin &&
                      leave.status === 'rejected' &&
                      leave.remarks && (
                        <Tooltip title={leave.remarks} arrow>
                          <Typography
                            variant='body2'
                            sx={{
                              mt: 0.5,
                              fontSize: 13,
                              p: 0.5,
                              borderRadius: 1,
                              maxWidth: 250,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {leave.remarks.length > 50
                              ? `${leave.remarks.substring(0, 50)}...`
                              : leave.remarks}
                          </Typography>
                        </Tooltip>
                      )}

                    {/* Show manager response in Actions/Remarks column for managers */}
                    {isManager &&
                      viewMode === 'team' &&
                      leave.managerRemarks && (
                        <Tooltip title={leave.managerRemarks} arrow>
                          <Typography
                            variant='body2'
                            sx={{
                              mt: 0.5,
                              fontSize: 13,
                              color: '#424242',
                              maxWidth: 250,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {leave.managerRemarks.length > 50
                              ? `${leave.managerRemarks.substring(0, 50)}...`
                              : leave.managerRemarks}
                          </Typography>
                        </Tooltip>
                      )}

                    {/* Show action menu icon if there are any actions available */}
                    {(() => {
                      const isManagerOwnLeave =
                        isManager &&
                        viewMode === 'you' &&
                        (leave.employee?.id === currentUserId ||
                          leave.employeeId === currentUserId);

                      const hasActions =
                        // Admin actions
                        (isAdmin &&
                          leave.status === 'pending' &&
                          (onAction || onWithdraw)) ||
                        // Manager team actions
                        (isManager &&
                          viewMode === 'team' &&
                          leave.status === 'pending' &&
                          (onManagerAction ||
                            onManagerResponse ||
                            onWithdraw)) ||
                        // Manager own leave actions (edit and withdraw)
                        (isManagerOwnLeave &&
                          leave.status === 'pending' &&
                          (onWithdraw || true)) || // Always allow edit for manager's own leaves
                        // Employee actions
                        (!isAdmin &&
                          !isManager &&
                          leave.status === 'pending' &&
                          onWithdraw);

                      if (!hasActions) return null;

                      return (
                        <>
                          <IconButton
                            size='small'
                            onClick={e => handleMenuClick(e, leave)}
                            aria-label={`Actions for leave ${leave.id}`}
                            aria-haspopup='true'
                            aria-expanded={
                              Boolean(menuAnchorEl) &&
                              selectedLeaveForMenu?.id === leave.id
                            }
                          >
                            <MoreVertIcon />
                          </IconButton>
                          <Menu
                            anchorEl={menuAnchorEl}
                            open={
                              Boolean(menuAnchorEl) &&
                              selectedLeaveForMenu?.id === leave.id
                            }
                            onClose={handleMenuClose}
                          >
                            {/* Admin actions for pending leaves */}
                            {isAdmin &&
                              leave.status === 'pending' &&
                              onAction && (
                                <>
                                  <MenuItem
                                    onClick={() => {
                                      onAction(leave.id, 'approved');
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <CheckCircleIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Approve</ListItemText>
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      onAction(leave.id, 'rejected');
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <CancelIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Reject</ListItemText>
                                  </MenuItem>
                                </>
                              )}

                            {/* Edit option for admin on pending leaves */}
                            {isAdmin &&
                              leave.status === 'pending' &&
                              onWithdraw && (
                                <MenuItem
                                  onClick={() => {
                                    handleEditLeave(leave);
                                    handleMenuClose();
                                  }}
                                >
                                  <ListItemIcon>
                                    <EditIcon fontSize='small' />
                                  </ListItemIcon>
                                  <ListItemText>Edit</ListItemText>
                                </MenuItem>
                              )}

                            {/* Manager team actions */}
                            {isManager &&
                              viewMode === 'team' &&
                              leave.status === 'pending' &&
                              onManagerAction && (
                                <>
                                  <MenuItem
                                    onClick={() => {
                                      onManagerAction(leave.id, 'approved');
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <CheckCircleIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Approve</ListItemText>
                                  </MenuItem>
                                  <MenuItem
                                    onClick={() => {
                                      onManagerAction(leave.id, 'rejected');
                                      handleMenuClose();
                                    }}
                                  >
                                    <ListItemIcon>
                                      <CancelIcon fontSize='small' />
                                    </ListItemIcon>
                                    <ListItemText>Reject</ListItemText>
                                  </MenuItem>
                                </>
                              )}

                            {/* Manager response option */}
                            {isManager &&
                              viewMode === 'team' &&
                              leave.status === 'pending' &&
                              !onManagerAction &&
                              !leave.managerRemarks &&
                              onManagerResponse && (
                                <MenuItem
                                  onClick={() => {
                                    onManagerResponse(leave.id);
                                    handleMenuClose();
                                  }}
                                >
                                  <ListItemIcon>
                                    <EditIcon fontSize='small' />
                                  </ListItemIcon>
                                  <ListItemText>Manager Response</ListItemText>
                                </MenuItem>
                              )}

                            {/* Edit option for manager's own pending leaves */}
                            {isManager &&
                              viewMode === 'you' &&
                              leave.status === 'pending' &&
                              (leave.employee?.id === currentUserId ||
                                leave.employeeId === currentUserId) && (
                                <MenuItem
                                  onClick={() => {
                                    handleEditLeave(leave);
                                    handleMenuClose();
                                  }}
                                >
                                  <ListItemIcon>
                                    <EditIcon fontSize='small' />
                                  </ListItemIcon>
                                  <ListItemText>Edit</ListItemText>
                                </MenuItem>
                              )}

                            {/* Withdraw option for pending leaves */}
                            {((isAdmin &&
                              leave.status === 'pending' &&
                              onWithdraw) ||
                              (isManager &&
                                viewMode === 'you' &&
                                leave.status === 'pending' &&
                                onWithdraw) ||
                              (!isAdmin &&
                                !isManager &&
                                leave.status === 'pending' &&
                                onWithdraw)) && (
                              <MenuItem
                                onClick={() => {
                                  if (onWithdraw) {
                                    onWithdraw(leave.id);
                                  }
                                  handleMenuClose();
                                }}
                              >
                                <ListItemIcon>
                                  <UndoIcon fontSize='small' />
                                </ListItemIcon>
                                <ListItemText>Withdraw</ListItemText>
                              </MenuItem>
                            )}

                            {/* Edit option for employees on pending leaves */}
                            {!isAdmin &&
                              !isManager &&
                              leave.status === 'pending' &&
                              onWithdraw && (
                                <MenuItem
                                  onClick={() => {
                                    handleEditLeave(leave);
                                    handleMenuClose();
                                  }}
                                >
                                  <ListItemIcon>
                                    <EditIcon fontSize='small' />
                                  </ListItemIcon>
                                  <ListItemText>Edit</ListItemText>
                                </MenuItem>
                              )}
                          </Menu>
                        </>
                      );
                    })()}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AppTable>
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
        {(() => {
          const shouldShowPagination = isEmployeeFiltered
            ? filteredTotalItems > ITEMS_PER_PAGE
            : totalPages > 1;

          return shouldShowPagination ? (
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, newPage) => handlePageChange(newPage)}
              sx={{
                mb: 1,
                '& .MuiPaginationItem-root': {
                  color: 'var(--primary-dark-color)',
                },
                '& .MuiPaginationItem-root.Mui-selected': {
                  backgroundColor: 'var(--primary-dark-color)',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: 'var(--primary-dark-color)',
                  },
                },
              }}
              showFirstButton
              showLastButton
            />
          ) : null;
        })()}

        {totalItems > 0 && (
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
      <Dialog
        open={openDocs}
        onClose={() => setOpenDocs(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant='h6'>Uploaded Documents</Typography>
          <IconButton onClick={() => setOpenDocs(false)}>
            <IoCloseCircleOutline />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {currentDocs.length === 0 ? (
            <Typography textAlign='center' color='textSecondary'>
              No documents uploaded
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'center',
              }}
            >
              {currentDocs.map((doc, idx) => {
                const fullDocUrl = getDocumentUrl(doc);
                const extension = doc.split('.').pop()?.toLowerCase() || '';
                const isImage = [
                  'jpeg',
                  'jpg',
                  'png',
                  'gif',
                  'webp',
                  'bmp',
                ].includes(extension);
                const imageFailed = failedImages.has(idx);

                if (isImage) {
                  return (
                    <Box
                      key={idx}
                      sx={{
                        width: { xs: 120, sm: 150, md: 180 },
                        height: { xs: 120, sm: 150, md: 180 },
                        border: '1px solid #ccc',
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        '&:hover': { boxShadow: 2 },
                        transition: 'all 0.2s',
                      }}
                      onClick={() => window.open(fullDocUrl, '_blank')}
                    >
                      {imageFailed ? (
                        <>
                          <Typography
                            variant='body2'
                            sx={{ mb: 1, textAlign: 'center', fontSize: 12 }}
                          >
                            Image failed to load
                          </Typography>
                          <Typography
                            variant='caption'
                            sx={{ color: '#1976d2', fontWeight: 'bold' }}
                          >
                            Click to view
                          </Typography>
                        </>
                      ) : (
                        <img
                          src={fullDocUrl}
                          alt={`Document ${idx + 1}`}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.2s',
                          }}
                          onError={() => {
                            setFailedImages(prev => new Set(prev).add(idx));
                          }}
                        />
                      )}
                    </Box>
                  );
                }

                // Non-image files
                return (
                  <Box
                    key={idx}
                    sx={{
                      width: { xs: 120, sm: 150, md: 180 },
                      height: { xs: 120, sm: 150, md: 180 },
                      border: '1px solid #ccc',
                      borderRadius: 2,
                      p: 1,
                      textAlign: 'center',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      '&:hover': { boxShadow: 3 },
                    }}
                    onClick={() => window.open(fullDocUrl, '_blank')}
                  >
                    <Typography
                      variant='body2'
                      sx={{ mb: 1, wordBreak: 'break-word', fontWeight: 500 }}
                    >
                      {doc.split('/').pop()}
                    </Typography>
                    <Typography
                      variant='caption'
                      sx={{ color: '#1976d2', fontWeight: 'bold' }}
                    >
                      View / Download
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {openLeaveForm && editingLeave && (
        <Dialog
          open={openLeaveForm}
          onClose={handleCloseLeaveForm}
          maxWidth='sm'
          fullWidth
        >
          <LeaveForm
            mode='edit'
            leaveId={editingLeave.id}
            initialData={editingLeave}
            onSuccess={() => {
              refreshLeaves();
              handleCloseLeaveForm();
            }}
            onError={msg => alert(msg)}
          />
        </Dialog>
      )}
    </Box>
  );
};

export default LeaveHistory;

import { useState, useEffect, useCallback, useRef } from 'react';
import LeaveForm from './LeaveForm';
import LeaveHistory from './LeaveHistory';
import LeaveApprovalDialog from './LeaveApprovalDialog';
import { leaveApi, type CreateLeaveRequest } from '../../api/leaveApi';
import type { Leave } from '../../type/levetypes';
import { getCurrentUser, getUserName, getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryIcon from '@mui/icons-material/History';

const LeaveRequestPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('history');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 25; // Backend returns 25 records per page

  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(
    null
  );
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id ?? '';
  const role = normalizeRole(getUserRole());
  const userName = getUserName();

  const fetchLeaveTypes = useCallback(async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/leave-types?page=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
    } catch (err) {
      console.error('Error loading leave types:', err);
    }
  }, []);

  const [viewMode, setViewMode] = useState<'team' | 'you'>('you');
  const previousViewModeRef = useRef<'team' | 'you'>(viewMode);

  const loadLeaves = useCallback(
    async (skipFullPageLoader = false) => {
      const shouldShowFullPageLoader =
        !hasLoadedOnceRef.current && !skipFullPageLoader;

      try {
        if (shouldShowFullPageLoader) {
          setInitialLoading(true);
        } else {
          setTableLoading(true);
        }

        let res;

        if (
          ['system-admin', 'network-admin', 'admin', 'hr-admin'].includes(role)
        ) {
          res = await leaveApi.getAllLeaves(currentPage);
        } else if (role === 'manager') {
          res =
            viewMode === 'you'
              ? await leaveApi.getUserLeaves(currentUserId, currentPage)
              : await leaveApi.getTeamLeaves(currentPage);
        } else {
          res = await leaveApi.getUserLeaves(currentUserId, currentPage);
        }

        // Type for API leave response
        interface ApiLeave {
          id: string;
          employeeId?: string;
          employee?: {
            id?: string;
            first_name?: string;
            last_name?: string;
            email?: string;
          };
          user?: {
            id?: string;
            first_name?: string;
            last_name?: string;
            email?: string;
          };
          leaveTypeId?: string;
          leaveType?: {
            name?: string;
          };
          reason?: string;
          remarks?: string | null;
          startDate?: string;
          endDate?: string;
          status?: string;
          createdAt?: string;
          updatedAt?: string;
        }

        const leavesData: Leave[] = res.items.map((leave: ApiLeave) => {
          const employeeId =
            leave.employeeId || leave.employee?.id || leave.user?.id || '';
          const userId = leave.user?.id || leave.employee?.id || '';

          return {
            id: leave.id,
            employeeId,
            employee: leave.employee
              ? {
                  id: leave.employee.id || userId,
                  first_name: leave.employee.first_name || 'You',
                  last_name: leave.employee.last_name,
                  email: leave.employee.email || '',
                }
              : {
                  id: userId,
                  first_name: leave.user?.first_name || 'You',
                  last_name: leave.user?.last_name,
                  email: leave.user?.email || '',
                },
            leaveTypeId: leave.leaveTypeId || '',
            leaveType: leave.leaveType
              ? {
                  id: '',
                  name: leave.leaveType.name || 'Unknown',
                }
              : {
                  id: '',
                  name: 'Unknown',
                },
            reason: leave.reason || '',
            remarks: leave.remarks || undefined,
            startDate: leave.startDate || '',
            endDate: leave.endDate || '',
            status: (leave.status as Leave['status']) || 'pending',
            createdAt: leave.createdAt,
            updatedAt: leave.updatedAt,
          };
        });

        setLeaves(Array.from(new Map(leavesData.map(l => [l.id, l])).values()));

        // Backend returns 25 records per page (fixed page size)
        // If we get 25 records, there might be more pages
        // If we get less than 25, it's the last page
        const hasMorePages = leavesData.length === itemsPerPage;

        // Use backend pagination info if available, otherwise estimate
        if (res.totalPages && res.total) {
          setTotalPages(res.totalPages);
          setTotalItems(res.total);
        } else {
          // Fallback: estimate based on current page and records received
          setTotalPages(hasMorePages ? currentPage + 1 : currentPage);
          setTotalItems(
            hasMorePages
              ? currentPage * itemsPerPage
              : (currentPage - 1) * itemsPerPage + leavesData.length
          );
        }

        if (res.page && res.page !== currentPage) {
          setCurrentPage(res.page);
        }
        hasLoadedOnceRef.current = true;
      } catch (err) {
        console.error('Error loading leaves:', err);
      } finally {
        if (shouldShowFullPageLoader) {
          setInitialLoading(false);
        } else {
          setTableLoading(false);
        }
      }
    },
    [currentUserId, role, viewMode, currentPage]
  );

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message;
      }
    }
    return '';
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleApply = async (_data: CreateLeaveRequest) => {
    try {
      setSnackbar({
        open: true,
        message: 'Leave applied successfully!',
        severity: 'success',
      });
      await loadLeaves();
      setActiveTab('history');
    } catch (error: unknown) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error) || 'Failed to apply leave',
        severity: 'error',
      });
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedId || !actionType) return;

    try {
      if (actionType === 'approved') {
        await leaveApi.approveLeave(selectedId);
        setLeaves(prevLeaves =>
          prevLeaves.map(leave =>
            leave.id === selectedId ? { ...leave, status: 'approved' } : leave
          )
        );
      } else if (actionType === 'rejected') {
        await leaveApi.rejectLeave(selectedId, { remarks: reason });
        setLeaves(prevLeaves =>
          prevLeaves.map(leave =>
            leave.id === selectedId
              ? {
                  ...leave,
                  status: 'rejected',
                  remarks: reason ?? leave.remarks,
                }
              : leave
          )
        );
      }

      setSnackbar({
        open: true,
        message:
          actionType === 'approved'
            ? 'Leave approved successfully!'
            : 'Leave rejected successfully!',
        severity: 'success',
      });
    } catch (error: unknown) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error) || 'Action failed',
        severity: 'error',
      });
    } finally {
      setDialogOpen(false);
      setActionType(null);
      setSelectedId(null);
    }
  };

  const handleConfirmWithdraw = async () => {
    if (!selectedId) return;
    try {
      await leaveApi.cancelLeave(selectedId);
      setSnackbar({
        open: true,
        message: 'Leave withdrawn successfully!',
        severity: 'success',
      });
      setLeaves(prevLeaves =>
        prevLeaves.map(leave =>
          leave.id === selectedId ? { ...leave, status: 'withdrawn' } : leave
        )
      );
    } catch (error: unknown) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error) || 'Failed to withdraw leave',
        severity: 'error',
      });
    } finally {
      setWithdrawDialogOpen(false);
      setSelectedId(null);
    }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setSelectedId(id);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleWithdraw = (id: string) => {
    setSelectedId(id);
    setWithdrawDialogOpen(true);
  };

  const fetchAllLeavesForExport = useCallback(async (): Promise<Leave[]> => {
    try {
      const allLeaves: Leave[] = [];
      let currentPageNum = 1;
      let totalPages = 1;

      // Type for API leave response
      interface ApiLeave {
        id: string;
        employeeId?: string;
        employee?: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
        };
        user?: {
          id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
        };
        leaveTypeId?: string;
        leaveType?: {
          name?: string;
        };
        reason?: string;
        remarks?: string | null;
        startDate?: string;
        endDate?: string;
        status?: string;
        createdAt?: string;
        updatedAt?: string;
      }

      do {
        let res;
        if (
          ['system-admin', 'network-admin', 'admin', 'hr-admin'].includes(role)
        ) {
          res = await leaveApi.getAllLeaves(currentPageNum);
        } else if (role === 'manager') {
          res =
            viewMode === 'you'
              ? await leaveApi.getUserLeaves(currentUserId, currentPageNum)
              : await leaveApi.getTeamLeaves(currentPageNum);
        } else {
          res = await leaveApi.getUserLeaves(currentUserId, currentPageNum);
        }

        totalPages = res.totalPages || 1;

        const leavesData: Leave[] = res.items.map((leave: ApiLeave) => {
          const employeeId =
            leave.employeeId || leave.employee?.id || leave.user?.id || '';
          const userId = leave.user?.id || leave.employee?.id || '';

          return {
            id: leave.id,
            employeeId,
            employee: leave.employee
              ? {
                  id: leave.employee.id || userId,
                  first_name: leave.employee.first_name || 'You',
                  last_name: leave.employee.last_name,
                  email: leave.employee.email || '',
                }
              : {
                  id: userId,
                  first_name: leave.user?.first_name || 'You',
                  last_name: leave.user?.last_name,
                  email: leave.user?.email || '',
                },
            leaveTypeId: leave.leaveTypeId || '',
            leaveType: leave.leaveType
              ? {
                  id: '',
                  name: leave.leaveType.name || 'Unknown',
                }
              : {
                  id: '',
                  name: 'Unknown',
                },
            reason: leave.reason || '',
            remarks: leave.remarks || undefined,
            startDate: leave.startDate || '',
            endDate: leave.endDate || '',
            status: (leave.status as Leave['status']) || 'pending',
            createdAt: leave.createdAt,
            updatedAt: leave.updatedAt,
          };
        });

        allLeaves.push(...leavesData);
        currentPageNum++;
      } while (currentPageNum <= totalPages);

      return Array.from(new Map(allLeaves.map(l => [l.id, l])).values());
    } catch (error) {
      console.error('Error fetching all leaves for export:', error);
      throw error;
    }
  }, [currentUserId, role, viewMode]);

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    const isViewModeChange = previousViewModeRef.current !== viewMode;
    const shouldSkipFullPageLoader = isViewModeChange && leaves.length > 0;

    loadLeaves(shouldSkipFullPageLoader);
    previousViewModeRef.current = viewMode;
  }, [currentPage, viewMode, role, currentUserId, loadLeaves, leaves.length]);

  if (initialLoading)
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='80vh'
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position='static'
        sx={{ borderRadius: 1, backgroundColor: '#3c3572', boxShadow: 'none' }}
      >
        <Toolbar
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            textAlign: { xs: 'center', sm: 'left' },
            gap: { xs: 1, sm: 0 },
          }}
        >
          <Box>
            <Typography variant='h6' fontWeight={700}>
              Leave Management System
            </Typography>
            {currentUser && (
              <Typography variant='caption'>
                Logged in as: {userName} ({role})
              </Typography>
            )}
          </Box>

          {['employee', 'manager'].includes(role) && (
            <Stack
              direction='row'
              spacing={2}
              sx={{
                my: { xs: 1, sm: 0 },
                gap: 1,
                justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                width: { xs: '100%', sm: 'auto' },
                flexWrap: 'wrap',
              }}
            >
              <Button
                startIcon={<AssignmentIcon />}
                variant={activeTab === 'apply' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('apply')}
                sx={{
                  borderRadius: '20px',
                  color: activeTab === 'apply' ? '#3c3572' : '#fff',
                  backgroundColor:
                    activeTab === 'apply' ? '#fff' : 'transparent',
                  borderColor: '#fff',
                }}
              >
                Apply Leave
              </Button>

              <Button
                startIcon={<HistoryIcon />}
                variant={activeTab === 'history' ? 'contained' : 'outlined'}
                onClick={() => setActiveTab('history')}
                sx={{
                  borderRadius: '20px',
                  color: activeTab === 'history' ? '#3c3572' : '#fff',
                  backgroundColor:
                    activeTab === 'history' ? '#fff' : 'transparent',
                  borderColor: '#fff',
                }}
              >
                Leave History
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Box sx={{ py: 3 }}>
        {['employee', 'manager'].includes(role) ? (
          activeTab === 'apply' ? (
            <LeaveForm onSubmit={handleApply} />
          ) : (
            <>
              {role === 'manager' && (
                <Box sx={{ mb: 2, textAlign: 'right' }}>
                  <Button
                    variant={viewMode === 'you' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('you')}
                    sx={{
                      mr: 1,
                      borderRadius: '20px',
                      backgroundColor:
                        viewMode === 'you' ? '#3c3572' : 'transparent',
                      color: viewMode === 'you' ? '#fff' : '#3c3572',
                      borderColor: '#3c3572',
                      '&:hover': {
                        backgroundColor:
                          viewMode === 'you' ? '#2f285b' : '#eae7f5',
                      },
                    }}
                  >
                    Your Leaves
                  </Button>
                  <Button
                    variant={viewMode === 'team' ? 'contained' : 'outlined'}
                    onClick={() => setViewMode('team')}
                    sx={{
                      borderRadius: '20px',
                      backgroundColor:
                        viewMode === 'team' ? '#3c3572' : 'transparent',
                      color: viewMode === 'team' ? '#fff' : '#3c3572',
                      borderColor: '#3c3572',
                      '&:hover': {
                        backgroundColor:
                          viewMode === 'team' ? '#2f285b' : '#eae7f5',
                      },
                    }}
                  >
                    Team Leaves
                  </Button>
                </Box>
              )}

              <LeaveHistory
                leaves={leaves}
                isAdmin={false}
                isManager={role === 'manager'}
                currentUserId={currentUserId || undefined}
                viewMode={viewMode}
                onWithdraw={viewMode === 'you' ? handleWithdraw : undefined}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                isLoading={tableLoading}
                onExportAll={
                  ['manager'].includes(role)
                    ? fetchAllLeavesForExport
                    : undefined
                }
              />
            </>
          )
        ) : (
          <LeaveHistory
            leaves={leaves}
            isAdmin={['hr-admin', 'system-admin', 'admin'].includes(role)}
            isManager={false}
            onAction={handleAction}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            isLoading={tableLoading}
            onExportAll={fetchAllLeavesForExport}
          />
        )}
      </Box>

      <LeaveApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={reason => handleConfirm(reason)}
        action={actionType || 'approved'}
      />

      <Dialog
        open={withdrawDialogOpen}
        onClose={() => setWithdrawDialogOpen(false)}
        aria-labelledby='withdraw-dialog-title'
        aria-describedby='withdraw-dialog-description'
      >
        <DialogTitle id='withdraw-dialog-title'>
          Withdraw Leave Request
        </DialogTitle>
        <DialogContent>
          <DialogContentText id='withdraw-dialog-description'>
            Are you sure you want to withdraw this leave request? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawDialogOpen(false)} color='primary'>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmWithdraw}
            color='warning'
            variant='contained'
          >
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestPage;

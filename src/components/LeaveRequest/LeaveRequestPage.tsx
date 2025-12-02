import React, { useState, useEffect, useCallback, useRef } from 'react';
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

const ITEMS_PER_PAGE = 25;

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

  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(
    null
  );
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'team' | 'you'>('you');
  const previousViewModeRef = useRef<'team' | 'you'>(viewMode);
  const previousPageRef = useRef<number>(1);

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

  const loadLeaves = useCallback(
    async ({
      page = currentPage,
      view = viewMode,
      skipFullPageLoader = false,
    } = {}) => {
      const showFullPageLoader =
        !hasLoadedOnceRef.current && !skipFullPageLoader;
      try {
        if (showFullPageLoader) setInitialLoading(true);
        else setTableLoading(true);

        let res;

        if (
          ['system-admin', 'network-admin', 'admin', 'hr-admin'].includes(role)
        ) {
          res = await leaveApi.getAllLeaves(page);
        } else if (role === 'manager') {
          res =
            view === 'you'
              ? await leaveApi.getUserLeaves(currentUserId, page)
              : await leaveApi.getTeamLeaves(page);
        } else {
          res = await leaveApi.getUserLeaves(currentUserId, page);
        }

        const leavesData: Leave[] = res.items.map((leave: any) => {
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
              ? { id: '', name: leave.leaveType.name || 'Unknown' }
              : { id: '', name: 'Unknown' },
            reason: leave.reason || '',
            remarks: leave.remarks || undefined,
            startDate: leave.startDate || '',
            endDate: leave.endDate || '',
            status: leave.status || 'pending',
            createdAt: leave.createdAt,
            updatedAt: leave.updatedAt,
          };
        });

        setLeaves(Array.from(new Map(leavesData.map(l => [l.id, l])).values()));

        const hasMorePages = leavesData.length === ITEMS_PER_PAGE;
        if (res.totalPages && res.total) {
          setTotalPages(res.totalPages);
          setTotalItems(res.total);
        } else {
          setTotalPages(hasMorePages ? page + 1 : page);
          setTotalItems(
            hasMorePages
              ? page * ITEMS_PER_PAGE
              : (page - 1) * ITEMS_PER_PAGE + leavesData.length
          );
        }

        hasLoadedOnceRef.current = true;
      } catch (err) {
        console.error('Error loading leaves:', err);
      } finally {
        if (showFullPageLoader) setInitialLoading(false);
        else setTableLoading(false);
      }
    },
    [currentUserId, role]
  );

  useEffect(() => {
    fetchLeaveTypes();
  }, [fetchLeaveTypes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    const effectiveViewMode = role === 'manager' ? viewMode : 'you';

    // Always reload if page changed, even if going back to page 1
    const pageChanged = previousPageRef.current !== currentPage;
    const viewModeChanged = previousViewModeRef.current !== effectiveViewMode;

    // Only skip loading if nothing has changed (initial load already happened)
    if (
      hasLoadedOnceRef.current &&
      !pageChanged &&
      !viewModeChanged
    )
      return;

    // Use table loader (not full page loader) if we've loaded before and only the page changed
    const skipFullPageLoader =
      hasLoadedOnceRef.current &&
      previousViewModeRef.current === effectiveViewMode;

    loadLeaves({
      page: currentPage,
      view: effectiveViewMode,
      skipFullPageLoader,
    });
    previousViewModeRef.current = effectiveViewMode;
    previousPageRef.current = currentPage;
  }, [currentPage, viewMode, role, loadLeaves]);

  const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { data?: { message?: string } };
      };
      if (axiosError.response?.data?.message)
        return axiosError.response.data.message;
    }
    return '';
  };

  // Handle apply leave
  const handleApply = async (data: CreateLeaveRequest) => {
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

  // Handle approve/reject
  const handleConfirm = async (reason?: string) => {
    if (!selectedId || !actionType) return;
    try {
      if (actionType === 'approved') {
        await leaveApi.approveLeave(selectedId);
        setLeaves(prev =>
          prev.map(l =>
            l.id === selectedId ? { ...l, status: 'approved' } : l
          )
        );
      } else {
        await leaveApi.rejectLeave(selectedId, { remarks: reason });
        setLeaves(prev =>
          prev.map(l =>
            l.id === selectedId
              ? { ...l, status: 'rejected', remarks: reason ?? l.remarks }
              : l
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

  // Withdraw leave
  const handleConfirmWithdraw = async () => {
    if (!selectedId) return;
    try {
      await leaveApi.cancelLeave(selectedId);
      setSnackbar({
        open: true,
        message: 'Leave withdrawn successfully!',
        severity: 'success',
      });
      setLeaves(prev =>
        prev.map(l => (l.id === selectedId ? { ...l, status: 'withdrawn' } : l))
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

  // Open approval/reject dialog
  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setSelectedId(id);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleWithdraw = (id: string) => {
    setSelectedId(id);
    setWithdrawDialogOpen(true);
  };

  // Fetch all leaves for export
  const fetchAllLeavesForExport = useCallback(async (): Promise<Leave[]> => {
    try {
      const allLeaves: Leave[] = [];
      let pageNum = 1;
      let totalPagesLocal = 1;
      do {
        let res;
        if (
          ['system-admin', 'network-admin', 'admin', 'hr-admin'].includes(role)
        ) {
          res = await leaveApi.getAllLeaves(pageNum);
        } else if (role === 'manager') {
          res =
            viewMode === 'you'
              ? await leaveApi.getUserLeaves(currentUserId, pageNum)
              : await leaveApi.getTeamLeaves(pageNum);
        } else {
          res = await leaveApi.getUserLeaves(currentUserId, pageNum);
        }
        totalPagesLocal = res.totalPages || 1;
        allLeaves.push(...res.items);
        pageNum++;
      } while (pageNum <= totalPagesLocal);

      return Array.from(new Map(allLeaves.map(l => [l.id, l])).values());
    } catch (error) {
      console.error('Error fetching all leaves for export:', error);
      throw error;
    }
  }, [currentUserId, role, viewMode]);

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
            textAlign: { xs: 'start', sm: 'left' },
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
                userRole={role}
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
            userRole={role}
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

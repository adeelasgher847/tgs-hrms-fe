import { useState, useEffect, useCallback } from 'react';
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
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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

  const currentUser = getCurrentUser();
  const role = normalizeRole(getUserRole());
  const userName = getUserName();

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/leave-types?page=1&limit=50`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      const data = await response.json();
      setLeaveTypes(data?.items || []);
    } catch (err) {
      console.error('Error loading leave types:', err);
    }
  }, []);

  const [viewMode, setViewMode] = useState<'team' | 'you'>('you');

  const loadLeaves = useCallback(async () => {
    try {
      setLoading(true);
      let res;

      if (
        ['system-admin', 'network-admin', 'admin', 'hr-admin'].includes(role)
      ) {
        res = await leaveApi.getAllLeaves(currentPage);
      } else if (role === 'manager') {
        res =
          viewMode === 'you'
            ? await leaveApi.getUserLeaves(currentUser?.id, currentPage)
            : await leaveApi.getTeamLeaves(currentPage);
      } else {
        res = await leaveApi.getUserLeaves(currentUser?.id, currentPage);
      }

      const leavesData: Leave[] = res.items.map((leave: any) => ({
        id: leave.id,
        employeeId: leave.employeeId,
        employee: leave.employee || {
          id: leave.user?.id,
          first_name: leave.user?.first_name || 'You',
          last_name: leave.user?.last_name || '',
          email: leave.user?.email || '',
        },
        leaveTypeId: leave.leaveTypeId,
        leaveType: leave.leaveType || {
          name: leave.leaveType?.name || 'Unknown',
        },
        reason: leave.reason,
        remarks: leave.remarks || '',
        startDate: leave.startDate,
        endDate: leave.endDate,
        status: leave.status,
        createdAt: leave.createdAt,
        updatedAt: leave.updatedAt,
      }));

      setLeaves(Array.from(new Map(leavesData.map(l => [l.id, l])).values()));

      setTotalPages(res.totalPages || 1);
      setTotalItems(res.total || 0);
      setCurrentPage(res.page || currentPage);
    } catch (err) {
      console.error('Error loading leaves:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, role, viewMode, currentPage]);

  const handleApply = async (data: CreateLeaveRequest) => {
    try {
      setSnackbar({
        open: true,
        message: 'Leave applied successfully!',
        severity: 'success',
      });
      await loadLeaves();
      setActiveTab('history');
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to apply leave',
        severity: 'error',
      });
    }
  };

  const handleConfirm = async (reason?: string) => {
    if (!selectedId || !actionType) return;

    try {
      if (actionType === 'approved') {
        await leaveApi.approveLeave(selectedId);
      } else if (actionType === 'rejected') {
        await leaveApi.rejectLeave(selectedId, { remarks: reason });
      }

      setSnackbar({
        open: true,
        message:
          actionType === 'approved'
            ? 'Leave approved successfully!'
            : 'Leave rejected successfully!',
        severity: 'success',
      });

      await loadLeaves();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Action failed',
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
      await loadLeaves();
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error?.response?.data?.message || 'Failed to withdraw leave',
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

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode]);

  useEffect(() => {
    loadLeaves();
  }, [currentPage, viewMode, role]);

  if (loading)
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
    <Box sx={{ background: '#f7f7f7', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar
        position='static'
        sx={{ borderRadius: 2, backgroundColor: '#3c3572' }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
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
            <Stack direction='row' spacing={2}>
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
                currentUserId={currentUser?.id}
                viewMode={viewMode}
                onWithdraw={viewMode === 'you' ? handleWithdraw : undefined}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
              />
            </>
          )
        ) : (
          <LeaveHistory
            leaves={leaves}
            isAdmin={['hr-admin', 'system-admin'].includes(role)}
            isManager={false}
            onAction={handleAction}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
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

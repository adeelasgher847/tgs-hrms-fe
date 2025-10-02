import { useState, useEffect, useCallback } from 'react';
import LeaveForm from './LeaveForm';
import LeaveHistory from './LeaveHistory';
import LeaveApprovalDialog from './LeaveApprovalDialog';
import { leaveApi, type CreateLeaveRequest } from '../../api/leaveApi';
import type { Leave } from '../../type/levetypes';
import {
  isAdmin,
  isUser,
  getCurrentUser,
  isManager,
  getUserName,
  getUserRole,
} from '../../utils/auth';
import { exportCSV } from '../../api/exportApi';

import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Error interface for API errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
  message?: string;
}

const LeaveRequestPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(
    null
  );
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success'
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Team leave history state
  const [teamLeaves, setTeamLeaves] = useState<Leave[]>([]);
  const [teamLeavesLoading, setTeamLeavesLoading] = useState(false);
  const [teamLeavesError, setTeamLeavesError] = useState<string | null>(null);
  const [teamCurrentPage, setTeamCurrentPage] = useState(1);
  const [teamTotalPages, setTeamTotalPages] = useState(1);

  // Get current user role
  const currentUser = getCurrentUser();
  const userIsAdmin = isAdmin();
  const userIsUser = isUser();
  const userIsManager = isManager();

  // Initialize tab based on user role
  const [tab, setTab] = useState(
    userIsUser || userIsManager || userIsAdmin ? 0 : 0
  );

  const token = localStorage.getItem('token');
  const filters = { page: '1' };

  const loadLeaves = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        setError(null);
        let leavesData: Leave[];

        if (userIsAdmin) {
          // Admin gets all leaves with user info
          try {
            const response = await leaveApi.getAllLeaves(page);
            leavesData = response.items.map(leave => ({
              id: leave.id,
              userId: leave.user_id || leave.userId,
              name: leave.user?.first_name
                ? `${leave.user.first_name} ${leave.user.last_name || ''}`.trim()
                : leave.user?.name || 'N/A',
              fromDate: leave.from_date,
              toDate: leave.to_date,
              reason: leave.reason,
              type: leave.type,
              status: leave.status,
              applied:
                leave.applied ||
                new Date().toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                }),
              created_at: leave.created_at,
            }));

            // Update pagination state
            setCurrentPage(response.page);
            setTotalPages(response.totalPages);
          } catch (adminError: unknown) {
            if ((adminError as ApiError)?.response?.status === 403) {
              setError(
                'You do not have permission to view all leaves. Please contact your administrator.'
              );
            } else {
              setError(
                (adminError as ApiError)?.response?.data?.message ||
                  'Failed to load admin leaves'
              );
            }
            throw adminError;
          }
        } else if (userIsUser || userIsManager) {
          // Regular user or manager gets their own leaves
          //   currentUserId: currentUser?.id,
          //   userRole: currentUser?.role,
          //   page
          // });
          const response = await leaveApi.getUserLeaves(currentUser?.id, page);
          leavesData = response.items.map(leave => ({
            id: leave.id,
            userId: leave.user_id || leave.userId,
            name: 'You', // Show "You" for user's own leaves
            fromDate: leave.from_date,
            toDate: leave.to_date,
            reason: leave.reason,
            type: leave.type,
            status: leave.status,
            applied:
              leave.applied ||
              new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }),
            created_at: leave.created_at,
          }));

          // Update pagination state
          setCurrentPage(response.page);
          setTotalPages(response.totalPages);
        } else {
          leavesData = [];
        }

        setLeaves(leavesData);
      } catch (error: unknown) {
        setError(
          (error as ApiError)?.response?.data?.message ||
            (error as Error).message ||
            'Failed to load leaves'
        );
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    },
    [currentUser, userIsAdmin, userIsUser]
  );

  // Load leaves on component mount
  useEffect(() => {
    loadLeaves();
  }, []); // Empty dependency array - only run once on mount

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadLeaves(page);
  };

  // Load team leaves for managers
  const loadTeamLeaves = async (page: number = 1) => {
    if (!userIsManager) return;

    try {
      setTeamLeavesLoading(true);
      setTeamLeavesError(null);

      //   managerId: currentUser?.id,
      //   tenantId: currentUser?.tenant_id,
      //   page
      // });

      const response = await leaveApi.getTeamLeaves(page);

      const teamLeavesData = response.items.map(leave => ({
        id: leave.id,
        userId: leave.user_id || leave.userId,
        name: leave.user?.first_name
          ? `${leave.user.first_name} ${leave.user.last_name || ''}`.trim()
          : leave.user?.name || 'N/A',
        fromDate: leave.from_date,
        toDate: leave.to_date,
        reason: leave.reason,
        type: leave.type,
        status: leave.status,
        applied:
          leave.applied ||
          new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        created_at: leave.created_at,
      }));

      setTeamLeaves(teamLeavesData);
      setTeamCurrentPage(response.page);
      setTeamTotalPages(response.totalPages);
    } catch (error: unknown) {
      let errorMessage = 'Failed to load team leaves';
      if ((error as ApiError)?.response?.status === 403) {
        errorMessage = 'You do not have permission to view team leaves.';
      } else if ((error as ApiError)?.response?.status === 404) {
        errorMessage = 'No team members found or team not configured.';
      } else if ((error as ApiError)?.response?.data?.message) {
        errorMessage =
          (error as ApiError).response!.data!.message || 'Unknown error';
      } else if ((error as Error).message) {
        errorMessage = (error as Error).message;
      }

      setTeamLeavesError(errorMessage);
      setTeamLeaves([]);
    } finally {
      setTeamLeavesLoading(false);
    }
  };

  // Handle team page change
  const handleTeamPageChange = (page: number) => {
    setTeamCurrentPage(page);
    loadTeamLeaves(page);
  };

  const handleApply = async (data: CreateLeaveRequest) => {
    try {
      const newLeave = await leaveApi.createLeave(data);

      const leaveWithDisplay: Leave = {
        id: newLeave.id,
        userId: newLeave.user_id || newLeave.userId,
        name: userIsAdmin ? getUserName() : 'You',
        fromDate: newLeave.from_date,
        toDate: newLeave.to_date,
        reason: newLeave.reason,
        type: newLeave.type,
        status: newLeave.status,
        applied:
          newLeave.applied ||
          new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        created_at: newLeave.created_at || new Date().toISOString(),
      };

      setLeaves([leaveWithDisplay, ...leaves]);
      setSnackbarMessage('Leave applied successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError?.response) {
        if (apiError.response.status === 403) {
          setSnackbarMessage(
            "Access denied. You don't have permission to apply leaves."
          );
        } else if (apiError.response.status === 401) {
          setSnackbarMessage('Authentication failed. Please login again.');
        } else {
          setSnackbarMessage(
            `Failed to apply leave: ${
              apiError.response.data?.message || 'Unknown error'
            }`
          );
        }
      } else {
        setSnackbarMessage('Failed to apply leave - Network error');
      }
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    if (!userIsAdmin) {
      setSnackbarMessage('Only admins can approve/reject leaves');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setSelectedId(id);
    setActionType(action);
    setDialogOpen(true);
  };

  const handleConfirm = async (reason?: string) => {
    if (selectedId && actionType && userIsAdmin) {
      try {
        await leaveApi.updateLeaveStatus(selectedId, actionType);

        setLeaves(prev =>
          prev.map(leave =>
            leave.id === selectedId
              ? {
                  ...leave,
                  status: actionType,
                  secondaryReason:
                    actionType === 'rejected'
                      ? `Rejected: ${reason || 'No reason provided'}`
                      : undefined,
                }
              : leave
          )
        );

        setSnackbarMessage(`Leave ${actionType} successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error: unknown) {
        const apiError = error as ApiError;
        if (apiError?.response?.status === 403) {
          setSnackbarMessage(
            "Access denied. You don't have permission to update leave status."
          );
        } else {
          setSnackbarMessage('Failed to update leave status');
        }
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    setDialogOpen(false);
    setSelectedId(null);
    setActionType(null);
  };

  const handleWithdraw = (id: string) => {
    setWithdrawId(id);
    setWithdrawDialogOpen(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!withdrawId) return;

    try {
      await leaveApi.withdrawLeave(withdrawId);

      setLeaves(prev =>
        prev.map(leave =>
          leave.id === withdrawId
            ? {
                ...leave,
                status: 'withdrawn',
              }
            : leave
        )
      );

      setSnackbarMessage('Leave request withdrawn successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      if (apiError?.response?.status === 403) {
        setSnackbarMessage(
          'Access denied. You can only withdraw your own pending leave requests.'
        );
      } else if (apiError?.response?.status === 400) {
        setSnackbarMessage(
          'Cannot withdraw this leave request. Only pending requests can be withdrawn.'
        );
      } else {
        setSnackbarMessage('Failed to withdraw leave request');
      }
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setWithdrawDialogOpen(false);
      setWithdrawId(null);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          p: 3,
        }}
      >
        <Typography variant='h4' gutterBottom>
          Error Loading Leave Management
        </Typography>
        <Typography variant='body1' sx={{ mb: 3, textAlign: 'center' }}>
          {error}
        </Typography>
        <Button variant='contained' onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }

  // Show setup message if no valid role found
  if (!currentUser && !userIsAdmin && !userIsUser) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          p: 3,
        }}
      >
        <Typography variant='h4' gutterBottom>
          Authentication Required
        </Typography>
        <Typography variant='body1' sx={{ mb: 3, textAlign: 'center' }}>
          No valid user role found. Please login or set up a test user.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant='contained'
            onClick={() => {
              localStorage.setItem('setupTestUser', 'true');
              window.location.reload();
            }}
          >
            Setup Test User
          </Button>
          <Button
            variant='outlined'
            onClick={() => {
              localStorage.setItem('setupTestUser', 'true');
              const testAdmin = {
                id: 'test-admin-1',
                email: 'test-admin@example.com',
                first_name: 'Test',
                last_name: 'Admin',
                role: 'admin',
              };
              localStorage.setItem('user', JSON.stringify(testAdmin));
              localStorage.setItem('accessToken', 'test-admin-token');
              window.location.reload();
            }}
          >
            Setup Test Admin
          </Button>
          <Button
            variant='text'
            onClick={() => {
              const testUser = {
                id: 'test-user-1',
                email: 'test@example.com',
                first_name: 'Test',
                last_name: 'User',
                role: 'user',
              };
              localStorage.setItem('user', JSON.stringify(testUser));
              localStorage.setItem('accessToken', 'test-token');
              window.location.reload();
            }}
          >
            Quick Test User
          </Button>
        </Box>
        <Typography variant='caption' sx={{ mt: 2, opacity: 0.7 }}>
          Or use browser console: setupTestUser('user') or setupTestAdmin()
        </Typography>
        <Button
          variant='text'
          size='small'
          onClick={() => {
            const testUser = {
              id: 'test-user-1',
              email: 'test@example.com',
              first_name: 'Test',
              last_name: 'User',
              role: 'user',
            };
            localStorage.setItem('user', JSON.stringify(testUser));
            localStorage.setItem('accessToken', 'test-token');
            window.location.reload();
          }}
          sx={{ mt: 1 }}
        >
          Force Test User Setup
        </Button>
      </Box>
    );
  }

  // Main component render
  return (
    <Box sx={{ background: '', minHeight: '100vh' }}>
      <AppBar
        position='static'
        sx={{
          background: ')',
          borderRadius: '16px 16px 0 0',
          boxShadow: 0,
        }}
      >
        <Toolbar
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            py: { xs: 2, sm: 0 },
          }}
        >
          <Typography
            variant='h5'
            fontWeight={700}
            sx={{
              color: '#fff',
              fontSize: { xs: 18, sm: 20, md: 22 },
              mb: { xs: 2, sm: 0 },
            }}
          >
            Leave Management System
            {currentUser && (
              <Typography
                variant='caption'
                sx={{ display: 'block', opacity: 0.8 }}
              >
                Logged in as: {getUserName()} ({getUserRole()})
              </Typography>
            )}
          </Typography>
          <Box
            sx={{
              width: { xs: '100%', sm: 'auto' },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 1,
            }}
          >
            {/* Show Apply Leave button for regular users and managers */}
            {(userIsUser || userIsManager) && (
              <Button
                startIcon={<AssignmentIcon />}
                sx={{
                  color: tab === 0 ? '#fff' : '#e0e0e0',
                  fontWeight: 600,
                  mb: { xs: 1, sm: 0 },
                  background: tab === 0 ? 'rgba(255,255,255,0.12)' : 'none',
                  borderRadius: 2,
                  width: { xs: '100%', sm: 'auto' },
                }}
                onClick={() => setTab(0)}
              >
                Apply Leave
              </Button>
            )}
            <Button
              startIcon={<AccessTimeIcon />}
              sx={{
                color:
                  tab === (userIsUser || userIsManager ? 1 : 0)
                    ? '#fff'
                    : '#e0e0e0',
                fontWeight: 600,
                background:
                  tab === (userIsUser || userIsManager ? 1 : 0)
                    ? 'rgba(255,255,255,0.12)'
                    : 'none',
                borderRadius: 2,
                width: { xs: '100%', sm: 'auto' },
              }}
              onClick={() => setTab(userIsUser || userIsManager ? 1 : 0)}
            >
              Leave History
            </Button>
            {/* Show Team Leave History button only for managers */}
            {userIsManager && (
              <Button
                startIcon={<AccessTimeIcon />}
                sx={{
                  color: tab === 2 ? '#fff' : '#e0e0e0',
                  fontWeight: 600,
                  background: tab === 2 ? 'rgba(255,255,255,0.12)' : 'none',
                  borderRadius: 2,
                  width: { xs: '100%', sm: 'auto' },
                }}
                onClick={() => {
                  setTab(2);
                  loadTeamLeaves(1);
                }}
              >
                My Team Leave History
              </Button>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {/* Export All Leaves CSV button for admin users */}
      {userIsAdmin && (
        <Box mt={2} display='flex' justifyContent='flex-end'>
          <Button
            variant='contained'
            color='primary'
            onClick={() =>
              exportCSV('/leaves/export/all', 'leaves-all.csv', token, filters)
            }
          >
            Export All Leaves CSV
          </Button>
        </Box>
      )}

      {/* Export Team Leaves CSV button for managers */}
      {userIsManager && (
        <Box mt={2} display='flex' justifyContent='flex-end'>
          <Button
            variant='contained'
            color='primary'
            onClick={() =>
              exportCSV(
                '/leaves/export/team',
                'leaves-team.csv',
                token,
                filters
              )
            }
          >
            Export Team Leaves CSV
          </Button>
        </Box>
      )}

      {/* Export My Leaves CSV button for employees */}
      {userIsUser && (
        <Box mt={2} display='flex' justifyContent='flex-end'>
          <Button
            variant='contained'
            color='primary'
            onClick={() =>
              exportCSV(
                '/leaves/export/self',
                'leaves-self.csv',
                token,
                filters
              )
            }
          >
            Export My Leaves CSV
          </Button>
        </Box>
      )}
      {/* Show Apply Leave form for regular users and managers */}
      {(userIsUser || userIsManager) && tab === 0 ? (
        <Box sx={{ pt: 4 }}>
          <LeaveForm onSubmit={handleApply} />
        </Box>
      ) : tab === 2 && userIsManager ? (
        // Show Team Leave History for managers
        <Box sx={{ pt: 4 }}>
          {teamLeavesLoading ? (
            <Box display='flex' justifyContent='center' p={4}>
              <CircularProgress />
            </Box>
          ) : teamLeavesError ? (
            <Box display='flex' justifyContent='center' p={4}>
              <Typography color='error'>{teamLeavesError}</Typography>
            </Box>
          ) : teamLeaves.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='h6' color='textSecondary' gutterBottom>
                No Team Leave History Found
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                {teamLeavesError
                  ? teamLeavesError
                  : "You don't have any team members or no leave requests have been submitted by your team members yet."}
              </Typography>
            </Box>
          ) : (
            <>
              <LeaveHistory
                leaves={teamLeaves}
                isAdmin={false}
                onAction={() => {}} // Managers can't approve/reject team leaves in this view
                onWithdraw={undefined} // No withdraw in team view
                title='My Team Leave History'
                showNames={true} // Show team member names
              />

              {/* Team Pagination */}
              {teamTotalPages > 1 && (
                <Box display='flex' justifyContent='center' mt={2}>
                  <Pagination
                    count={teamTotalPages}
                    page={teamCurrentPage}
                    onChange={(_, page) => handleTeamPageChange(page)}
                    color='primary'
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}

              {/* Team Pagination Info */}
              {teamLeaves.length > 0 && (
                <Box display='flex' justifyContent='center' mt={1}>
                  <Typography variant='body2' color='textSecondary'>
                    Showing page {teamCurrentPage} of {teamTotalPages} (
                    {teamLeaves.length} total records)
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      ) : (
        // Show regular leave history
        <Box sx={{ pt: 4 }}>
          <LeaveHistory
            leaves={leaves}
            isAdmin={userIsAdmin}
            onAction={handleAction}
            onWithdraw={!userIsAdmin ? handleWithdraw : undefined} // Users and managers can withdraw their own leaves
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display='flex' justifyContent='center' mt={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => handlePageChange(page)}
                color='primary'
                showFirstButton
                showLastButton
              />
            </Box>
          )}

          {/* Pagination Info */}
          {leaves.length > 0 && (
            <Box display='flex' justifyContent='center' mt={1}>
              <Typography variant='body2' color='textSecondary'>
                Showing page {currentPage} of {totalPages} ({leaves.length}{' '}
                total records)
              </Typography>
            </Box>
          )}
        </Box>
      )}
      <LeaveApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onConfirm={handleConfirm}
        action={actionType || 'approved'}
      />

      {/* Withdraw Confirmation Dialog */}
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
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestPage;

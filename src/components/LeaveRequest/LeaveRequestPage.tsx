import React, { useState, useEffect, useCallback, useRef } from 'react';
import LeaveForm from './LeaveForm';
import LeaveHistory from './LeaveHistory';
import LeaveApprovalDialog from './LeaveApprovalDialog';
import { leaveApi } from '../../api/leaveApi';
import type { Leave } from '../../type/levetypes';
import { getCurrentUser, getUserName, getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
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
import ErrorSnackbar from '../common/ErrorSnackbar';
import { useErrorHandler } from '../../hooks/useErrorHandler';

import { PAGINATION } from '../../constants/appConstants';

const ITEMS_PER_PAGE = PAGINATION.DEFAULT_PAGE_SIZE;

const LeaveRequestPage = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const hasLoadedOnceRef = useRef(false);

  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  const [activeTab, setActiveTab] = useState<'apply' | 'history'>('history');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(
    null
  );
  const [managerResponseDialogOpen, setManagerResponseDialogOpen] =
    useState(false);
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
      await leaveApi.getLeaveTypes({ page: 1, limit: 50 });
    } catch {
      // Ignore; form components will surface their own errors
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

        const leavesData: Leave[] = (
          Array.isArray(res.items) ? res.items : []
        ).map((leaveRaw: unknown) => {
          const leave = (leaveRaw || {}) as Record<string, unknown>;

          const employeeObj =
            (leave.employee && typeof leave.employee === 'object'
              ? (leave.employee as Record<string, unknown>)
              : undefined) || undefined;
          const userObj =
            (leave.user && typeof leave.user === 'object'
              ? (leave.user as Record<string, unknown>)
              : undefined) || undefined;

          const getString = (v: unknown) =>
            v === null || typeof v === 'undefined' ? '' : String(v);

          const employeeId =
            (typeof leave.employeeId === 'string' && leave.employeeId) ||
            (typeof leave.employeeId === 'number' &&
              String(leave.employeeId)) ||
            (employeeObj &&
              typeof employeeObj.id === 'string' &&
              employeeObj.id) ||
            (userObj && typeof userObj.id === 'string' && userObj.id) ||
            '';

          const userId =
            (userObj && typeof userObj.id === 'string' && userObj.id) ||
            (employeeObj &&
              typeof employeeObj.id === 'string' &&
              employeeObj.id) ||
            '';

          const employeeFirstName =
            (employeeObj &&
              typeof employeeObj.first_name === 'string' &&
              employeeObj.first_name) ||
            (userObj &&
              typeof userObj.first_name === 'string' &&
              userObj.first_name) ||
            'You';

          const employeeLastName =
            (employeeObj &&
              typeof employeeObj.last_name === 'string' &&
              employeeObj.last_name) ||
            (userObj &&
              typeof userObj.last_name === 'string' &&
              userObj.last_name) ||
            undefined;

          const employeeEmail =
            (employeeObj &&
              typeof employeeObj.email === 'string' &&
              employeeObj.email) ||
            (userObj && typeof userObj.email === 'string' && userObj.email) ||
            '';

          const leaveTypeName =
            (leave.leaveType &&
            typeof leave.leaveType === 'object' &&
            typeof (leave.leaveType as Record<string, unknown>).name ===
              'string'
              ? ((leave.leaveType as Record<string, unknown>).name as string)
              : undefined) || 'Unknown';

          const rawStatus = getString(leave.status).toLowerCase();
          const normalizedStatus: Leave['status'] = (
            rawStatus === 'pending' ||
            rawStatus === 'approved' ||
            rawStatus === 'rejected' ||
            rawStatus === 'withdrawn'
              ? rawStatus
              : 'pending'
          ) as Leave['status'];
          const remarksString =
            typeof leave.remarks === 'string' ? leave.remarks : undefined;

          // remarks field: could be rejection remarks (if status is rejected) or manager remarks
          const remarks =
            normalizedStatus === 'rejected' ? remarksString : undefined;

          // managerRemarks: from approve-manager endpoint, backend returns in remarks field
          // But we need to differentiate - if status is not rejected and remarks exists, it's manager response
          const managerRemarks =
            (typeof leave.managerRemarks === 'string' &&
              leave.managerRemarks) ||
            (typeof leave.manager_remarks === 'string' &&
              leave.manager_remarks) ||
            (normalizedStatus !== 'rejected' && remarksString
              ? remarksString
              : undefined);

          return {
            id: getString(leave.id),
            employeeId: getString(employeeId),
            employee: {
              id: getString(employeeObj?.id) || getString(userId),
              first_name: employeeFirstName,
              last_name: employeeLastName as string | undefined,
              email: employeeEmail,
            },
            leaveTypeId: getString(leave.leaveTypeId),
            leaveType: { id: '', name: leaveTypeName },
            reason: getString(leave.reason),
            remarks:
              typeof leave.remarks === 'string' ? leave.remarks : undefined,
            startDate: getString(leave.startDate),
            endDate: getString(leave.endDate),
            status: (getString(leave.status) as Leave['status']) || 'pending',
            createdAt: leave.createdAt as string | undefined,
            updatedAt: leave.updatedAt as string | undefined,
          } as Leave;
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
      } catch {
        // Keep previous table data if loading fails
      } finally {
        if (showFullPageLoader) setInitialLoading(false);
        else setTableLoading(false);
      }
    },
    [currentUserId, role, currentPage, viewMode]
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
    if (hasLoadedOnceRef.current && !pageChanged && !viewModeChanged) return;

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

  // Handle apply leave (called after successful API in form)
  const handleApply = async () => {
    try {
      showSuccess('Leave applied successfully!');
      await loadLeaves();
      setActiveTab('history');
    } catch (error: unknown) {
      showError(getErrorMessage(error) || 'Failed to apply leave');
    }
  };

  const handleApplyError = (message: string) => {
    showError(message || 'Failed to apply leave');
  };

  // Handle approve/reject
  const handleConfirm = async (reason?: string) => {
    if (!selectedId || !actionType) return;
    try {
      if (isManagerAction) {
        // Manager approval/rejection
        if (actionType === 'approved') {
          await leaveApi.approveLeaveByManager(
            selectedId,
            reason?.trim() ? { remarks: reason.trim() } : undefined
          );
        } else {
          if (!reason || !reason.trim()) {
            showError('Rejection remarks are required');
            return;
          }
          await leaveApi.rejectLeaveByManager(selectedId, {
            remarks: reason.trim(),
          });
        }
      } else {
        // Admin approval/rejection
        if (actionType === 'approved') {
          await leaveApi.approveLeave(selectedId);
        } else {
          // Admin/HR admin rejectLeave API no longer accepts remarks parameter
          await leaveApi.rejectLeave(selectedId);
        }
      }

      // Update local state
      setLeaves(prev =>
        prev.map(l => {
          if (l.id === selectedId) {
            const updated: Leave = {
              ...l,
              status: actionType === 'approved' ? 'approved' : 'rejected',
            };
            // Only set remarks for manager actions (admin/HR admin rejections don't have remarks)
            if (isManagerAction && reason) {
              updated.managerRemarks = reason;
            }
            return updated;
          }
          return l;
        })
      );

      showSuccess(
        actionType === 'approved'
          ? 'Leave approved successfully!'
          : 'Leave rejected successfully!'
      );
    } catch (error: unknown) {
      showError(error);
    } finally {
      setDialogOpen(false);
      setActionType(null);
      setIsManagerAction(false);
      setSelectedId(null);
    }
  };

  // Withdraw leave
  const handleConfirmWithdraw = async () => {
    if (!selectedId) return;
    try {
      await leaveApi.cancelLeave(selectedId);
      showSuccess('Leave withdrawn successfully!');
      setLeaves(prev =>
        prev.map(l => (l.id === selectedId ? { ...l, status: 'withdrawn' } : l))
      );
    } catch (error: unknown) {
      showError(getErrorMessage(error) || 'Failed to withdraw leave');
    } finally {
      setWithdrawDialogOpen(false);
      setSelectedId(null);
    }
  };

  // Open approval/reject dialog (for admin/HR admin)
  const handleAction = (id: string, action: 'approved' | 'rejected') => {
    setSelectedId(id);
    setActionType(action);
    setIsManagerAction(false);
    setDialogOpen(true);
  };

  // Open approval/reject dialog (for managers)
  const handleManagerAction = (id: string, action: 'approved' | 'rejected') => {
    setSelectedId(id);
    setActionType(action);
    setIsManagerAction(true);
    setDialogOpen(true);
  };

  const handleWithdraw = (id: string) => {
    setSelectedId(id);
    setWithdrawDialogOpen(true);
  };

  // Fetch all leaves for export
  const _fetchAllLeavesForExport = useCallback(async (): Promise<Leave[]> => {
    // eslint-disable-next-line no-useless-catch
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
        allLeaves.push(
          ...res.items.map((leave): Leave => {
            const leaveRec = leave as unknown as Record<string, unknown>;
            const employeeId = String(
              (leaveRec.employee as Record<string, unknown> | undefined)?.id ||
                (leaveRec.user as Record<string, unknown> | undefined)?.id ||
                (leaveRec.employeeId as string | undefined) ||
                ''
            );

            const r = leaveRec.remarks;
            const remarks =
              r === null || typeof r === 'undefined' ? undefined : String(r);

            const rawStatus = String(leaveRec.status ?? '').toLowerCase();
            let normalizedStatus: import('../../type/levetypes').LeaveStatus =
              'pending';
            if (
              rawStatus === 'pending' ||
              rawStatus === 'approved' ||
              rawStatus === 'rejected' ||
              rawStatus === 'withdrawn'
            ) {
              normalizedStatus =
                rawStatus as import('../../type/levetypes').LeaveStatus;
            } else if (rawStatus === 'cancelled') {
              // Backend uses 'cancelled' sometimes — map to 'rejected'
              normalizedStatus = 'rejected';
            }

            return {
              ...leave,
              employeeId,
              leaveTypeId: leaveRec.leaveTypeId
                ? String(leaveRec.leaveTypeId)
                : '',
              remarks,
              status: normalizedStatus,
            } as Leave;
          })
        );
        pageNum++;
      } while (pageNum <= totalPagesLocal);

      return Array.from(new Map(allLeaves.map(l => [l.id, l])).values());
    } catch (error) {
      // Propagate error to callers (export handlers) to show a UI message
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
            <LeaveForm onSubmit={handleApply} onError={handleApplyError} />
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
                onManagerResponse={
                  viewMode === 'team' ? handleOpenManagerResponse : undefined
                }
                onWithdraw={viewMode === 'you' ? handleWithdraw : undefined}
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setCurrentPage}
                isLoading={tableLoading}
                onExportAll={
                  ['manager'].includes(role)
                    ? _fetchAllLeavesForExport
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
            onExportAll={_fetchAllLeavesForExport}
            userRole={role}
          />
        )}
      </Box>

      <LeaveApprovalDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setActionType(null);
          setIsManagerAction(false);
          setSelectedId(null);
        }}
        onConfirm={reason => handleConfirm(reason)}
        action={actionType || 'approved'}
        allowComments={isManagerAction}
        commentLabel={isManagerAction ? 'Remarks (Optional)' : undefined}
        showRemarksField={isManagerAction}
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

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default LeaveRequestPage;

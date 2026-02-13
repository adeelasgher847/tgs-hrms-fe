import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  useTheme,
  Stack,
  useMediaQuery,
  Typography,
  Chip,
  Paper,
  CircularProgress,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Pagination,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ContentCopy as CloneIcon, 
  Close as CloseIcon, 
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Publish as PublishIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { AppOutletContext } from '../../types/outletContexts';
import jobRequisitionApiService, {
  type JobRequisition,
  type RequisitionStatus,
} from '../../api/jobRequisitionApi';
import { extractErrorMessage } from '../../utils/errorHandler';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import AppPageTitle from '../common/AppPageTitle';
import AppFormModal from '../common/AppFormModal';
import AppTable from '../common/AppTable';
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { PAGINATION } from '../../constants/appConstants';
import JobRequisitionForm from './JobRequisitionForm';
import RequisitionDetail from './RequisitionDetail';
import { jobRequisitionMockData } from '../../Data/jobRequisitionMockData';
import dayjs from 'dayjs';


const statusColorMap: Record<RequisitionStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  'Draft': 'default',
  'Pending approval': 'warning',
  'Approved': 'success',
  'Rejected': 'error',
};

const JobRequisitionManager: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery('(min-width:601px) and (max-width:786px)');
  const { darkMode } = useOutletContext<AppOutletContext>();

  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  // Form states
  const [editingRequisition, setEditingRequisition] = useState<JobRequisition | null>(null);
  const [selectedRequisition, setSelectedRequisition] = useState<JobRequisition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  
  // Menu state
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRequisitionForMenu, setSelectedRequisitionForMenu] = useState<JobRequisition | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLimit] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | 'All'>('All');

  // TanStack Query for fetching requisitions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['requisitions', currentPage, paginationLimit, searchTerm, statusFilter],
    queryFn: () => {
      const filters = {
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'All' ? (statusFilter as RequisitionStatus) : undefined,
      };

      return jobRequisitionApiService.getRequisitions(
        currentPage,
        paginationLimit,
        filters
      ).then(response => {
        // Use mock data if API returns no data
        if (!response.data || response.data.length === 0) {
          return {
            data: jobRequisitionMockData,
            total: jobRequisitionMockData.length,
          };
        }

        return {
          data: response.data,
          total: response.total,
        };
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Update local state when query data changes
  useEffect(() => {
    if (data) {
      setRequisitions(data.data);
      setTotalItems(data.total);
    }
  }, [data]);

  // Handle query errors
  React.useEffect(() => {
    if (error) {
      showError(extractErrorMessage(error));
      // Fallback to mock data on error
      setRequisitions(jobRequisitionMockData);
      setTotalItems(jobRequisitionMockData.length);
    }
  }, [error, showError]);

  const handleCreateOpen = () => {
    setEditingRequisition(null);
    setCreateModalOpen(true);
  };

  const handleCreateClose = () => {
    setCreateModalOpen(false);
    setEditingRequisition(null);
  };

  const handleEditOpen = (requisition: JobRequisition) => {
    setEditingRequisition(requisition);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setEditingRequisition(null);
  };

  const handleViewDetails = (requisition: JobRequisition) => {
    setSelectedRequisition(requisition);
    setDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailModalOpen(false);
    setSelectedRequisition(null);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTarget(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);
    try {
      await jobRequisitionApiService.deleteRequisition(deleteTarget);
      showSuccess('Job requisition deleted successfully');
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await refetch();
    } catch (error) {
      showError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (
    data: any,
    isUpdate: boolean
  ): Promise<{ success: boolean; errors?: Record<string, string> }> => {
    setSubmitting(true);
    try {
      if (isUpdate && editingRequisition) {
        await jobRequisitionApiService.updateRequisition(editingRequisition.id, data);
        showSuccess('Job requisition updated successfully');
        handleEditClose();
      } else {
        await jobRequisitionApiService.createRequisition(data);
        showSuccess('Job requisition created successfully');
        handleCreateClose();
      }
      await refetch();
      return { success: true };
    } catch (error) {
      const message = extractErrorMessage(error) as unknown as string;
      showError(message);
      return { success: false, errors: { general: message } };
    } finally {
      setSubmitting(false);
    }
  };


  const handleCloneRequisition = async (id: string) => {
    setSubmitting(true);
    try {
      await jobRequisitionApiService.cloneRequisition(id);
      showSuccess('Job requisition cloned successfully');
      await refetch();
    } catch (error) {
      showError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveClick = (id: string) => {
    setActionTarget(id);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!actionTarget) return;

    setSubmitting(true);
    try {
      await jobRequisitionApiService.approveRequisition(actionTarget, {
        status: 'Approved',
      });
      showSuccess('Job requisition approved successfully');
      setApproveDialogOpen(false);
      setActionTarget(null);
      await refetch();
    } catch (error) {
      showError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = (id: string) => {
    setActionTarget(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!actionTarget) return;

    setSubmitting(true);
    try {
      await jobRequisitionApiService.rejectRequisition(actionTarget, {
        status: 'Rejected',
      });
      showSuccess('Job requisition rejected successfully');
      setRejectDialogOpen(false);
      setActionTarget(null);
      await refetch();
    } catch (error) {
      showError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishClick = (id: string) => {
    setActionTarget(id);
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (!actionTarget) return;

    setSubmitting(true);
    try {
      await jobRequisitionApiService.publishRequisition(actionTarget);
      showSuccess('Job requisition published successfully');
      setPublishDialogOpen(false);
      setActionTarget(null);
      await refetch();
    } catch (error) {
      showError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, requisition: JobRequisition) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRequisitionForMenu(requisition);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRequisitionForMenu(null);
  };

  const handleMenuEdit = () => {
    if (selectedRequisitionForMenu) {
      handleEditOpen(selectedRequisitionForMenu);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (selectedRequisitionForMenu) {
      handleDeleteClick(selectedRequisitionForMenu.id);
    }
    handleMenuClose();
  };

  const handleMenuApprove = () => {
    if (selectedRequisitionForMenu) {
      handleApproveClick(selectedRequisitionForMenu.id);
    }
    handleMenuClose();
  };

  const handleMenuReject = () => {
    if (selectedRequisitionForMenu) {
      handleRejectClick(selectedRequisitionForMenu.id);
    }
    handleMenuClose();
  };

  const handleMenuClone = () => {
    if (selectedRequisitionForMenu) {
      handleCloneRequisition(selectedRequisitionForMenu.id);
    }
    handleMenuClose();
  };

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / paginationLimit));
  }, [totalItems, paginationLimit]);

  return (
    <Box
      sx={{
        '& .MuiButton-contained': {
          backgroundColor: 'var(--primary-dark-color)',
          '&:hover': { backgroundColor: 'var(--primary-dark-color)' },
        },
        '& .MuiButton-outlined': {
          borderColor: 'var(--primary-dark-color)',
          color: 'var(--primary-dark-color)',
          '&:hover': {
            borderColor: 'var(--primary-dark-color)',
            backgroundColor: 'var(--primary-color)',
          },
        },
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
        <AppPageTitle sx={{ color: theme.palette.text.primary, mb: 1 }}>
          Job Requisitions
        </AppPageTitle>
        <AppButton
          startIcon={<AddIcon />}
          onClick={handleCreateOpen}
          variant="contained"
          sx={{ textTransform: 'none', fontWeight: 600, px: 2, py: 1 }}
        >
          New Requisition
        </AppButton>
      </Box>

      <AppTable
        sx={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff', color: theme.palette.text.primary }}
        tableProps={{ stickyHeader: true }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Job Title</TableCell>
            <TableCell>Department</TableCell>
            <TableCell>Employment Type</TableCell>
            <TableCell>Openings</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created Date</TableCell>
            <TableCell align="center">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              </TableCell>
            </TableRow>
          ) : requisitions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body1" sx={{ color: darkMode ? '#8f8f8f' : '#666', py: 4 }}>
                  No job requisitions found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            requisitions.map((req) => (
              <TableRow key={req.id} hover>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {req.jobTitle}
                  </Typography>
                </TableCell>
                <TableCell>{req.department?.name || '-'}</TableCell>
                <TableCell>{req.employmentType}</TableCell>
                <TableCell>{req.numberOfOpenings}</TableCell>
                <TableCell>
                  <Chip
                    label={req.status}
                    color={statusColorMap[req.status]}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{dayjs(req.createdAt).format('MMM DD, YYYY')}</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(req)}
                        sx={{ color: 'primary.main' }}
                      >
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={req.status === 'Approved' ? 'Publish' : 'Publish (Only available for approved requisitions)'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handlePublishClick(req.id)}
                          disabled={submitting || req.status !== 'Approved'}
                          sx={{ 
                            color: req.status === 'Approved' ? 'info.main' : 'action.disabled',
                            opacity: req.status === 'Approved' ? 1 : 0.5
                          }}
                        >
                          <PublishIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="More Actions">
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, req)}
                        disabled={submitting}
                        sx={{ color: 'text.secondary' }}
                      >
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AppTable>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleMenuEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleMenuApprove}
          disabled={selectedRequisitionForMenu?.status === 'Approved' || selectedRequisitionForMenu?.status === 'Rejected'}
        >
          <ListItemIcon>
            <ApproveIcon fontSize="small" sx={{ color: 'success.main' }} />
          </ListItemIcon>
          <ListItemText>Approve</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={handleMenuReject}
          disabled={selectedRequisitionForMenu?.status === 'Rejected' || selectedRequisitionForMenu?.status === 'Approved'}
        >
          <ListItemIcon>
            <RejectIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Reject</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClone}>
          <ListItemIcon>
            <CloneIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText>Clone</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Create Modal */}
      <AppFormModal
        open={createModalOpen}
        onClose={handleCreateClose}
        title="Create Job Requisition"
        maxWidth="lg"
        isRtl={false}
        hideActions
        wrapInForm={false}
        paperSx={{
          width: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
          maxWidth: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
        }}
      >
        <JobRequisitionForm
          onSubmit={(data) => handleFormSubmit(data, false)}
          isSubmitting={submitting}
          isUpdate={false}
          onCancel={handleCreateClose}
          hideFormActions={false}
        />
      </AppFormModal>

      {/* Edit Modal */}
      <AppFormModal
        open={editModalOpen}
        onClose={handleEditClose}
        title="Edit Job Requisition"
        maxWidth="lg"
        isRtl={false}
        hideActions
        wrapInForm={false}
        paperSx={{
          width: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
          maxWidth: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
        }}
      >
        {editingRequisition && (
          <JobRequisitionForm
            initialData={editingRequisition}
            onSubmit={(data) => handleFormSubmit(data, true)}
            isSubmitting={submitting}
            isUpdate={true}
            onCancel={handleEditClose}
            hideFormActions={false}
          />
        )}
      </AppFormModal>

      {/* Detail Modal */}
      {selectedRequisition && (
          <AppFormModal
            open={detailModalOpen}
            onClose={handleCloseDetail}
            title="Job Requisition Details"
            maxWidth="lg"
            isRtl={false}
            hideActions
            wrapInForm={false}
            paperSx={{
              width: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
              maxWidth: { xs: '100%', sm: '90%', md: '900px', lg: '900px' },
            }}
          >
            <RequisitionDetail
              requisition={selectedRequisition}
              onClose={handleCloseDetail}
              onRefresh={refetch}
            />
          </AppFormModal>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Requisition"
        message="Are you sure you want to delete this job requisition? This action cannot be undone."
        confirmText="Delete"
        loading={submitting}
      />

      {/* Approve Confirmation */}
      <DeleteConfirmationDialog
        open={approveDialogOpen}
        onClose={() => {
          setApproveDialogOpen(false);
          setActionTarget(null);
        }}
        onConfirm={handleApproveConfirm}
        title="Approve Job Requisition"
        message="Are you sure you want to approve this job requisition?"
        confirmText="Approve"
        confirmVariantType="primary"
        loading={submitting}
      />

      {/* Reject Confirmation */}
      <DeleteConfirmationDialog
        open={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setActionTarget(null);
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Job Requisition"
        message="Are you sure you want to reject this job requisition?"
        confirmText="Reject"
        confirmVariantType="danger"
        loading={submitting}
      />

      {/* Publish Confirmation */}
      <DeleteConfirmationDialog
        open={publishDialogOpen}
        onClose={() => {
          setPublishDialogOpen(false);
          setActionTarget(null);
        }}
        onConfirm={handlePublishConfirm}
        title="Publish Job Requisition"
        message="Are you sure you want to publish this job requisition? It will be made available for candidates."
        confirmText="Publish"
        confirmVariantType="primary"
        loading={submitting}
      />

      {/* Error Snackbar */}
      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default JobRequisitionManager;

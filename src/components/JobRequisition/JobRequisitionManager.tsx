import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  useTheme,
  Stack,
  useMediaQuery,
  Typography,
  Chip,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, ContentCopy as CloneIcon, Close as CloseIcon } from '@mui/icons-material';
import { useOutletContext } from 'react-router-dom';
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
// AppTable and AppCard were removed in favor of Paper for consistent styling
import DeleteConfirmationDialog from '../common/DeleteConfirmationDialog';
import { PAGINATION } from '../../constants/appConstants';
import JobRequisitionForm from './JobRequisitionForm';
import RequisitionDetail from './RequisitionDetail';
import { jobRequisitionMockData } from '../../Data/jobRequisitionMockData';
import dayjs from 'dayjs';

interface OutletContext {
  darkMode: boolean;
  language: 'en' | 'ar';
}

const statusColorMap: Record<RequisitionStatus, 'default' | 'primary' | 'success' | 'warning' | 'error'> = {
  'Draft': 'default',
  'Pending approval': 'warning',
  'Approved': 'success',
  'Rejected': 'error',
};

const JobRequisitionManager: React.FC = () => {
  const theme = useTheme();
  const direction = theme.direction;
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery('(min-width:601px) and (max-width:786px)');
  const { darkMode } = useOutletContext<OutletContext>();

  const [requisitions, setRequisitions] = useState<JobRequisition[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form states
  const [editingRequisition, setEditingRequisition] = useState<JobRequisition | null>(null);
  const [selectedRequisition, setSelectedRequisition] = useState<JobRequisition | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationLimit] = useState<number>(PAGINATION.DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | 'All'>('All');

  // Load requisitions
  const fetchRequisitions = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        searchTerm: searchTerm || undefined,
        status: statusFilter !== 'All' ? (statusFilter as RequisitionStatus) : undefined,
      };

      const response = await jobRequisitionApiService.getRequisitions(
        currentPage,
        paginationLimit,
        filters
      );

      // Use mock data if API returns no data
      if (!response.data || response.data.length === 0) {
        setRequisitions(jobRequisitionMockData);
        setTotalItems(jobRequisitionMockData.length);
      } else {
        setRequisitions(response.data);
        setTotalItems(response.total);
      }
    } catch (error) {
      // Show error but also fallback to mock data
      showError(extractErrorMessage(error));
      setRequisitions(jobRequisitionMockData);
      setTotalItems(jobRequisitionMockData.length);
    } finally {
      setLoading(false);
    }
  }, [currentPage, paginationLimit, searchTerm, statusFilter, showError]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

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
      await fetchRequisitions();
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
      await fetchRequisitions();
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
      await fetchRequisitions();
    } catch (error) {
      showError(extractErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
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

      <Paper sx={{ p: 4, backgroundColor: darkMode ? '#1a1a1a' : '#fff', color: theme.palette.text.primary, boxShadow: 'none' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        ) : requisitions.length === 0 ? (
          <Typography variant="body1" sx={{ textAlign: 'center', color: darkMode ? '#8f8f8f' : '#666' }}>
            No job requisitions found
          </Typography>
        ) : (
          <Stack spacing={2}>
            {requisitions.map((req) => (
              <Box
                key={req.id}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
                  <Box flex={1}>
                    <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>{req.jobTitle}</Typography>
                    <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                        {req.department?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                        {req.employmentType} • {req.numberOfOpenings} opening(s)
                      </Typography>
                      <Typography variant="caption" sx={{ color: darkMode ? '#8f8f8f' : '#666' }}>
                        {dayjs(req.createdAt).format('MMM DD, YYYY')}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={req.status}
                      color={statusColorMap[req.status]}
                      size="small"
                      variant="outlined"
                    />
                    <AppButton
                      onClick={() => handleViewDetails(req)}
                      size="small"
                    >
                      View
                    </AppButton>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Create Modal */}
      <AppFormModal
        open={createModalOpen}
        onClose={handleCreateClose}
        title="Create Job Requisition"
        maxWidth="lg"
        isRtl={direction === 'rtl'}
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
        isRtl={direction === 'rtl'}
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
            isRtl={direction === 'rtl'}
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
              onRefresh={fetchRequisitions}
            />
          </AppFormModal>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Job Requisition"
        message="Are you sure you want to delete this job requisition? This action cannot be undone."
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

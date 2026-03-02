import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Tooltip,
  IconButton,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BenefitFormModal from './BenefitFormModal';
import type { BenefitFormValues } from './BenefitFormModal';
import { Icons } from '../../assets/icons';
import benefitsApi from '../../api/benefitApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import AppTable from '../common/AppTable';
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';
import { getUserRole } from '../../utils/auth';
import { normalizeRole } from '../../utils/permissions';

const ITEMS_PER_PAGE = 25; // Backend returns 25 records per page

interface Benefit {
  id: string;
  name: string;
  type: string;
  description: string;
  eligibilityCriteria: string;
  status: string;
}

const BenefitList: React.FC = () => {
  const role = normalizeRole(getUserRole());
  const isManager = role === 'manager';
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingBenefit, setSavingBenefit] = useState(false);

  const fetchBenefits = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam =
        filterType === 'all' || !filterType ? undefined : filterType;
      const statusParam =
        filterStatus === 'all' || !filterStatus
          ? undefined
          : (filterStatus.toLowerCase() as 'active' | 'inactive');
      const resp = await benefitsApi.getBenefits({
        page,
        type: typeParam,
        status: statusParam,
      });
      const isPaginated =
        resp &&
        typeof resp === 'object' &&
        !Array.isArray(resp) &&
        'items' in resp;
      const items = isPaginated
        ? (resp as { items: Benefit[] }).items || []
        : (Array.isArray(resp) ? resp : []) as Benefit[];
      setBenefits(items);
      if (isPaginated) {
        const R = resp as { total?: number; totalPages?: number };
        setTotalRecords(R.total ?? items.length);
        setTotalPages(Math.max(1, R.totalPages ?? 1));
      } else {
        setTotalRecords(items.length);
        setTotalPages(1);
      }
      setTypes(prev =>
        Array.from(
          new Set([...prev, ...items.map(b => b.type).filter(Boolean)])
        )
      );
      setStatuses(prev =>
        Array.from(
          new Set([...prev, ...items.map(b => b.status).filter(Boolean)])
        )
      );
    } catch {
      setBenefits([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterStatus]);

  useEffect(() => {
    fetchBenefits();
  }, [fetchBenefits]);

  const handleSaveBenefit = async (data: BenefitFormValues) => {
    try {
      setSavingBenefit(true);
      const payload = {
        name: data.name,
        description: data.description,
        type: data.type,
        eligibilityCriteria: data.eligibilityCriteria,
        status: data.status.toLowerCase() as 'active' | 'inactive',
      };

      if (editingBenefit) {
        await benefitsApi.updateBenefit(editingBenefit.id, payload);
        showSuccess('Benefit updated successfully!');
      } else {
        await benefitsApi.createBenefit(payload);
        showSuccess('Benefit created successfully!');
      }

      setModalOpen(false);
      setEditingBenefit(null);
      fetchBenefits();
    } catch (error) {
      showError(error);
    } finally {
      setSavingBenefit(false);
    }
  };

  const handleOpenDeleteDialog = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBenefit) return;
    setDeleting(true);
    try {
      const res = await benefitsApi.deleteBenefit(selectedBenefit.id);
      if (res.deleted) {
        showError(new Error('Benefit deleted successfully!'));
        setDeleteDialogOpen(false);
        setSelectedBenefit(null);
        fetchBenefits();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error: unknown) {
      showError(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || 'Failed to delete benefit.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const [exportLoading, setExportLoading] = useState(false);

  const handleDownload = async () => {
    setExportLoading(true);
    try {
      const typeParam =
        filterType === 'all' || !filterType ? undefined : filterType;
      const statusParam =
        filterStatus === 'all' || !filterStatus
          ? undefined
          : filterStatus.toLowerCase();
      const blob = await benefitsApi.exportBenefits({
        type: typeParam,
        status: statusParam,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.setAttribute('download', 'BenefitsList_Export.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus]);

  // If current page is out of range, snap back to page 1
  useEffect(() => {
    if (page > totalPages && totalPages >= 1) setPage(1);
  }, [page, totalPages]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const editingBenefitForModal: BenefitFormValues | undefined = useMemo(() => {
    if (!editingBenefit) return undefined;
    const eligibility = editingBenefit
      .eligibilityCriteria as BenefitFormValues['eligibilityCriteria'];
    const eligibilitySafe: BenefitFormValues['eligibilityCriteria'] =
      eligibility === 'All employees' ||
      eligibility === 'Full time employees only' ||
      eligibility === 'Part time employees only'
        ? eligibility
        : 'All employees';

    const statusLower = (editingBenefit.status || '').toLowerCase();
    const statusSafe: BenefitFormValues['status'] =
      statusLower === 'inactive' ? 'Inactive' : 'Active';

    return {
      name: editingBenefit.name || '',
      type: editingBenefit.type || '',
      description: editingBenefit.description || '',
      eligibilityCriteria: eligibilitySafe,
      status: statusSafe,
    };
  }, [editingBenefit]);

  return (
    <Box>
      <Box display='flex' alignItems='center' gap={1} mb={2}>
        <Typography
          variant='h4'
          fontWeight={600}
          fontSize={{ xs: '32px', lg: '48px' }}
        >
          Benefit Management
        </Typography>
      </Box>

      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        flexWrap='wrap'
        gap={2}
      >
        <Box
          display='flex'
          flexWrap='wrap'
          gap={2}
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <AppDropdown
            label='Type'
            showLabel={false}
            options={[
              { value: 'all', label: 'All Types' },
              ...types.map(t => ({ value: t, label: t })),
            ]}
            value={filterType}
            onChange={e => {
              setFilterType(String(e.target.value || 'all'));
              setPage(1);
            }}
            containerSx={{
              minWidth: { xs: '100%', sm: 160 },
              maxWidth: { xs: '100%', sm: 220 },
              width: { xs: '100%', sm: 'auto' },
            }}
          />

          <AppDropdown
            label='Status'
            showLabel={false}
            options={[
              { value: 'all', label: 'All Status' },
              ...statuses.map(s => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              })),
            ]}
            value={filterStatus}
            onChange={e => {
              setFilterStatus(String(e.target.value || 'all'));
              setPage(1);
            }}
            containerSx={{
              minWidth: { xs: '100%', sm: 160 },
              maxWidth: { xs: '100%', sm: 220 },
              width: { xs: '100%', sm: 'auto' },
            }}
          />
        </Box>

        <Box
          display='flex'
          gap={1}
          flexWrap='wrap'
          sx={{ width: { xs: '100%', sm: 'auto' } }}
        >
          <AppButton
            variant='contained'
            startIcon={<AddIcon />}
            variantType='primary'
            onClick={() => {
              setEditingBenefit(null);
              setModalOpen(true);
            }}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 400,
              fontSize: 'var(--body-font-size)',
              lineHeight: 'var(--body-line-height)',
              letterSpacing: 'var(--body-letter-spacing)',
              bgcolor: 'var(--primary-dark-color)',
              color: '#FFFFFF',
              boxShadow: 'none',
              minWidth: { xs: 'auto', sm: 200 },
              width: { xs: '100%', sm: 'auto' },
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.75, sm: 1 },
              '& .MuiButton-startIcon': {
                marginRight: { xs: 0.5, sm: 1 },
                '& > *:nth-of-type(1)': {
                  fontSize: { xs: '18px', sm: '20px' },
                },
              },
              // '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            Create
          </AppButton>

          {isManager ? (
            <AppButton
              variant='contained'
              variantType='primary'
              onClick={handleDownload}
              disabled={exportLoading}
              sx={{
                borderRadius: '6px',
                minWidth: 0,
                padding: '6px',
                height: 'auto',
              }}
              aria-label='Export benefit list'
            >
              {exportLoading ? (
                <CircularProgress size={20} color='inherit' />
              ) : (
                <FileDownloadIcon aria-hidden='true' />
              )}
            </AppButton>
          ) : (
            <Tooltip title='Export Benefit List'>
              <span>
                <IconButton
                  disableRipple
                  onClick={handleDownload}
                  disabled={exportLoading}
                  aria-label='Export benefit list'
                  sx={{
                    backgroundColor: 'var(--primary-dark-color)',
                    borderRadius: '6px',
                    padding: '6px',
                    color: 'white',
                    transition: 'none',
                    '&:hover': {
                      backgroundColor: 'var(--primary-dark-color)',
                      boxShadow: 'none',
                    },
                    '&:active': { backgroundColor: 'var(--primary-dark-color)' },
                    '&.Mui-focusVisible': {
                      backgroundColor: 'var(--primary-dark-color)',
                    },
                  }}
                >
                  {exportLoading ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : (
                    <FileDownloadIcon aria-hidden='true' />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          )}
        </Box>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
        >
          <CircularProgress sx={{ color: 'var(--primary-dark-color)' }} />
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <AppTable>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Benefit Name</b>
                </TableCell>
                <TableCell>
                  <b>Type</b>
                </TableCell>
                <TableCell>
                  <b>Description</b>
                </TableCell>
                <TableCell>
                  <b>Eligibility</b>
                </TableCell>
                <TableCell align='center'>
                  <b>Status</b>
                </TableCell>
                <TableCell align='center'>
                  <b>Actions</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {benefits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No benefits found
                  </TableCell>
                </TableRow>
              ) : (
                benefits.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.type}</TableCell>
                    <TableCell data-truncate='true'>
                      {b.description ? (
                        <Tooltip title={b.description} arrow>
                          <Typography variant='body2'>{b.description}</Typography>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell data-truncate='true'>
                      {b.eligibilityCriteria ? (
                        <Tooltip title={b.eligibilityCriteria} arrow>
                          <Typography variant='body2'>
                            {b.eligibilityCriteria}
                          </Typography>
                        </Tooltip>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell align='center'>
                      <Typography
                        sx={{
                          fontWeight: 500,
                          backgroundColor:
                            b.status === 'active' ? '#206d23ff' : '#9e9e9e',
                          px: 1.2,
                          py: 0.3,
                          borderRadius: 2,
                          color: 'white',
                          textTransform: 'capitalize',
                          display: 'inline-block',
                          minWidth: 70,
                          textAlign: 'center',
                        }}
                      >
                        {b.status}
                      </Typography>
                    </TableCell>
                    <TableCell align='center'>
                      <Box display='flex' justifyContent='center' gap={1}>
                        <Tooltip title='Edit'>
                          <IconButton
                            color='primary'
                            size='small'
                            onClick={() => {
                              setEditingBenefit(b);
                              setModalOpen(true);
                            }}
                            aria-label={`Edit benefit ${b.name}`}
                          >
                            <Box
                              component='img'
                              src={Icons.edit}
                              alt='Edit'
                              sx={{
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete'>
                          <IconButton
                            color='error'
                            size='small'
                            onClick={() => handleOpenDeleteDialog(b)}
                            aria-label={`Delete benefit ${b.name}`}
                          >
                            <Box
                              component='img'
                              src={Icons.delete}
                              alt='Delete'
                              sx={{
                                width: { xs: 16, sm: 20 },
                                height: { xs: 16, sm: 20 },
                              }}
                            />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </AppTable>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display='flex' justifyContent='center' alignItems='center' py={2}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color='primary'
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {totalRecords > 0 && (
        <Box display='flex' justifyContent='center' my={1}>
          <Typography variant='body2' color='textSecondary'>
            Showing page {page} of {totalPages} ({totalRecords} total records)
          </Typography>
        </Box>
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        title='Delete Benefit'
        message={`Are you sure you want to delete the benefit "${
          selectedBenefit?.name || ''
        }"? This action cannot be undone.`}
        confirmText='Delete'
        cancelText='Cancel'
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteDialogOpen(false)}
        itemName={selectedBenefit?.name}
        loading={deleting}
      />

      <BenefitFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBenefit(null);
        }}
        onSubmit={handleSaveBenefit}
        benefit={editingBenefitForModal}
        isSubmitting={savingBenefit}
      />

      <ErrorSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={closeSnackbar}
      />
    </Box>
  );
};

export default BenefitList;

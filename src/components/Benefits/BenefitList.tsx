import React, { useCallback, useEffect, useState } from 'react';
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

  const fetchBenefits = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await benefitsApi.getBenefits(page);
      // Handle both array and paginated response
      const items = Array.isArray(resp) ? resp : resp.items || [];
      const paginationInfo = Array.isArray(resp)
        ? null
        : 'total' in resp && 'totalPages' in resp
          ? resp
          : null;

      setBenefits(items);
      setTypes(Array.from(new Set(items.map((b: { type: any; }) => b.type))));
      setStatuses(Array.from(new Set(items.map(b => b.status))));

      // Backend returns 25 records per page (fixed page size)
      // If we get 25 records, there might be more pages
      // If we get less than 25, it's the last page
      const hasMorePages = items.length === ITEMS_PER_PAGE;

      // Use backend pagination info if available, otherwise estimate
      if (paginationInfo && paginationInfo.total && paginationInfo.totalPages) {
        setTotalPages(paginationInfo.totalPages);
        setTotalRecords(paginationInfo.total);
      } else {
        // Fallback: estimate based on current page and records received
        setTotalPages(hasMorePages ? page + 1 : page);
        setTotalRecords(
          hasMorePages
            ? page * ITEMS_PER_PAGE
            : (page - 1) * ITEMS_PER_PAGE + items.length
        );
      }
    } catch {
      setBenefits([]);
      setTypes([]);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBenefits();
  }, [page, fetchBenefits]);

  const handleSaveBenefit = async (data: BenefitFormValues) => {
    try {
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
        showSuccess('Benefit deleted successfully!');
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

  const csvEscape = (value: unknown) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return `"${s}"`;
  };

  const handleDownload = () => {
    if (benefits.length === 0) {
      alert('No data to download.');
      return;
    }

    const csvHeader = [
      'Benefit Name',
      'Type',
      'Description',
      'Eligibility Criteria',
      'Status',
    ];
    const rows = benefits.map(row =>
      [
        csvEscape(row.name),
        csvEscape(row.type),
        csvEscape(row.description),
        csvEscape(row.eligibilityCriteria),
        csvEscape(row.status),
      ].join(',')
    );
    const csvContent = [csvHeader.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', `BenefitsList_Page${page}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredBenefits = benefits.filter(b => {
    const typeMatch = filterType === 'all' || b.type === filterType;
    const statusMatch = filterStatus === 'all' || b.status === filterStatus;
    return typeMatch && statusMatch;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus]);

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

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
        <Box display='flex' flexWrap='wrap' gap={2}>
          <Box sx={{ minWidth: 160, maxWidth: 220 }}>
            <AppDropdown
              label='Type'
              options={[
                { value: 'all', label: 'All Types' },
                ...types.map(t => ({ value: t, label: t })),
              ]}
              value={filterType}
              onChange={e => {
                setFilterType(String(e.target.value || 'all'));
                setPage(1);
              }}
              showLabel
            />
          </Box>

          <Box sx={{ minWidth: 160, maxWidth: 220 }}>
            <AppDropdown
              label='Status'
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
              showLabel
            />
          </Box>
        </Box>

        <Box display='flex' gap={1} flexWrap='wrap'>
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
              sx={{
                borderRadius: '6px',
                minWidth: 0,
                padding: '6px',
                height: 'auto',
              }}
              aria-label='Export benefit list'
            >
              <FileDownloadIcon aria-hidden='true' />
            </AppButton>
          ) : (
            <Tooltip title='Export Benefit List'>
              <IconButton
                disableRipple
                onClick={handleDownload}
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
                <FileDownloadIcon aria-hidden='true' />
              </IconButton>
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
              {filteredBenefits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    No benefits found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBenefits.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>{b.name}</TableCell>
                    <TableCell>{b.type}</TableCell>
                    <TableCell>{b.description}</TableCell>
                    <TableCell>{b.eligibilityCriteria}</TableCell>
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
        benefit={editingBenefit || undefined}
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

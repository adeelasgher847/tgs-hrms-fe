import React, { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Button,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Delete as DeleteIcon } from '@mui/icons-material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import BenefitFormModal from './BenefitFormModal';
import type { BenefitFormValues } from './BenefitFormModal';
import benefitsApi from '../../api/benefitApi';

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
  const { language } = useLanguage();

  const labels = {
    en: {
      title: 'Benefit Management',
      allTypes: 'All Types',
      allStatus: 'All Status',
      create: 'Create',
      export: 'Export Benefit List',
      headers: {
        name: 'Benefit Name',
        type: 'Type',
        description: 'Description',
        eligibility: 'Eligibility',
        status: 'Status',
        actions: 'Actions',
      },
      noResults: 'No benefits found',
      edit: 'Edit',
      delete: 'Delete',
      deleteDialog: {
        title: 'Delete Benefit',
        confirm: 'Delete',
        cancel: 'Cancel',
        body: (name: string) =>
          `Are you sure you want to delete the benefit "${name}"? This action cannot be undone.`,
      },
      success: {
        created: 'Benefit created successfully!',
        updated: 'Benefit updated successfully!',
        deleted: 'Benefit deleted successfully!',
      },
      failure: {
        save: 'Failed to save benefit.',
        delete: 'Failed to delete benefit.',
      },
    },
    ar: {
      title: 'إدارة المزايا',
      allTypes: 'جميع الأنواع',
      allStatus: 'جميع الحالات',
      create: 'إنشاء',
      export: 'تصدير قائمة المزايا',
      headers: {
        name: 'اسم الميزة',
        type: 'النوع',
        description: 'الوصف',
        eligibility: 'معايير الأهلية',
        status: 'الحالة',
        actions: 'الإجراءات',
      },
      noResults: 'لم يتم العثور على مزايا',
      edit: 'تعديل',
      delete: 'حذف',
      deleteDialog: {
        title: 'حذف الميزة',
        confirm: 'حذف',
        cancel: 'إلغاء',
        body: (name: string) =>
          `هل أنت متأكد أنك تريد حذف الميزة "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      },
      success: {
        created: 'تم إنشاء الميزة بنجاح!',
        updated: 'تم تحديث الميزة بنجاح!',
        deleted: 'تم حذف الميزة بنجاح!',
      },
      failure: {
        save: 'فشل حفظ الميزة.',
        delete: 'فشل حذف الميزة.',
      },
    },
  } as const;

  const L = labels[language as 'en' | 'ar'] || labels.en;

  const pageLabels = {
    en: {
      showingInfo: (p: number, t: number, total: number) =>
        `Showing page ${p} of ${t} (${total} total records)`,
    },
    ar: {
      showingInfo: (p: number, t: number, total: number) =>
        `عرض الصفحة ${p} من ${t} (${total} إجمالي السجلات)`,
    },
  } as const;

  const PL = pageLabels[language as 'en' | 'ar'] || pageLabels.en;
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>(
    'success'
  );
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | null>(null);

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
      setTypes(Array.from(new Set(items.map(b => b.type))));
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
    } catch (err) {
      console.error('Error fetching benefits:', err);
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
        setToastMessage(L.success.updated);
      } else {
        await benefitsApi.createBenefit(payload);
        setToastMessage(L.success.created);
      }

      setToastSeverity('success');
      setShowToast(true);
      setModalOpen(false);
      setEditingBenefit(null);
      fetchBenefits();
    } catch (error: unknown) {
      console.error('Error saving benefit:', error);
      setToastSeverity('error');
      setToastMessage('Failed to save benefit.');
      setShowToast(true);
    }
  };

  const handleOpenDeleteDialog = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedBenefit) return;
    try {
      const res = await benefitsApi.deleteBenefit(selectedBenefit.id);
      if (res.deleted) {
        setToastMessage(L.success.deleted);
        setToastSeverity('success');
        setShowToast(true);
        setDeleteDialogOpen(false);
        setSelectedBenefit(null);
        fetchBenefits();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error: unknown) {
      console.error('Error deleting benefit:', error);
      setToastSeverity('error');
      setToastMessage(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || L.failure.delete
      );
      setShowToast(true);
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
      <Box
        display='flex'
        alignItems='center'
        gap={1}
        mb={2}
        sx={{
          width: '100%',
          justifyContent: language === 'ar' ? 'flex-end' : 'flex-start',
        }}
      >
        <Typography
          variant='h4'
          fontWeight={600}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {L.title}
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
          <FormControl size='small' sx={{ minWidth: 160, maxWidth: 220 }}>
            <Select
              value={filterType}
              onChange={e => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value='all'>{L.allTypes}</MenuItem>
              {types.map(type => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size='small' sx={{ minWidth: 160, maxWidth: 220 }}>
            <Select
              value={filterStatus}
              onChange={e => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value='all'>{L.allStatus}</MenuItem>
              {statuses.map(status => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box display='flex' gap={1} flexWrap='wrap'>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            color='primary'
            onClick={() => {
              setEditingBenefit(null);
              setModalOpen(true);
            }}
          >
            {L.create}
          </Button>

          <Tooltip title={L.export}>
            <IconButton
              color='primary'
              onClick={handleDownload}
              sx={{
                backgroundColor: 'primary.main',
                borderRadius: '6px',
                padding: '6px',
                color: 'white',
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
        >
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ mt: 2, boxShadow: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b>{L.headers.name}</b>
                  </TableCell>
                  <TableCell>
                    <b>{L.headers.type}</b>
                  </TableCell>
                  <TableCell>
                    <b>{L.headers.description}</b>
                  </TableCell>
                  <TableCell>
                    <b>{L.headers.eligibility}</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>{L.headers.status}</b>
                  </TableCell>
                  <TableCell align='center'>
                    <b>{L.headers.actions}</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBenefits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align='center'>
                      {L.noResults}
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
                          <Tooltip title={L.edit}>
                            <IconButton
                              color='primary'
                              size='small'
                              onClick={() => {
                                setEditingBenefit(b);
                                setModalOpen(true);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={L.delete}>
                            <IconButton
                              color='error'
                              size='small'
                              onClick={() => handleOpenDeleteDialog(b)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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

      {benefits.length > 0 && (
        <Box display='flex' justifyContent='center' my={1}>
          <Typography variant='body2' color='textSecondary'>
            {PL.showingInfo(page, totalPages, totalRecords)}
          </Typography>
        </Box>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle
          dir={language === 'ar' ? 'rtl' : 'ltr'}
          sx={{ textAlign: language === 'ar' ? 'right' : 'left' }}
        >
          {L.deleteDialog.title}
        </DialogTitle>
        <DialogContent sx={{ direction: 'ltr' }}>
          <DialogContentText>
            {L.deleteDialog.body(selectedBenefit?.name || '')}
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: language === 'ar' ? 'flex-start' : 'flex-end',
            p: 2,
            direction: 'ltr',
          }}
        >
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            color='primary'
            sx={{ order: 0 }}
          >
            {L.deleteDialog.cancel}
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color='error'
            variant='contained'
            sx={{ order: 1 }}
          >
            {L.deleteDialog.confirm}
          </Button>
        </DialogActions>
      </Dialog>

      <BenefitFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingBenefit(null);
        }}
        onSubmit={handleSaveBenefit}
        benefit={editingBenefit || undefined}
      />

      <Snackbar
        open={showToast}
        autoHideDuration={3000}
        onClose={() => setShowToast(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={toastSeverity}
          variant='filled'
          onClose={() => setShowToast(false)}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BenefitList;

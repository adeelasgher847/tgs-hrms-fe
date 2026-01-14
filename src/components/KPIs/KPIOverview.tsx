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
    useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Icons } from '../../assets/icons';
import { kpiApiService, type KPI } from '../../api/kpiApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import ErrorSnackbar from '../common/ErrorSnackbar';
import AppButton from '../common/AppButton';
import AppDropdown from '../common/AppDropdown';
import AppTable from '../common/AppTable';
import { DeleteConfirmationDialog } from '../common/DeleteConfirmationDialog';
import KPIFormModal, { type KPIFormValues } from './KPIFormModal';

const ITEMS_PER_PAGE = 25;

const KPIOverview: React.FC = () => {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<KPI[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
    const { snackbar, showError, showSuccess, closeSnackbar } = useErrorHandler();
    const [categories, setCategories] = useState<string[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedKPI, setSelectedKPI] = useState<KPI | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchKPIs = useCallback(async () => {
        setLoading(true);
        try {
            const items = await kpiApiService.getKPIs(page);

            // Extract unique categories and statuses for filters
            setCategories(Array.from(new Set(items.map(k => k.category).filter(Boolean))));
            setStatuses(Array.from(new Set(items.map(k => k.status).filter(Boolean))));

            setKpis(items);

            const hasMorePages = items.length === ITEMS_PER_PAGE;

            setTotalPages(hasMorePages ? page + 1 : page);
            setTotalRecords(
                hasMorePages
                    ? page * ITEMS_PER_PAGE
                    : (page - 1) * ITEMS_PER_PAGE + items.length
            );

        } catch (error) {
            setKpis([]);
            setCategories([]);
            setStatuses([]);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchKPIs();
    }, [page, fetchKPIs]);

    const handleSaveKPI = async (data: KPIFormValues) => {
        try {
            if (editingKPI) {
                await kpiApiService.updateKPI(editingKPI.id, data);
                showSuccess('KPI updated successfully!');
            } else {
                await kpiApiService.createKPI(data);
                showSuccess('KPI created successfully!');
            }

            setModalOpen(false);
            setEditingKPI(null);
            fetchKPIs();
        } catch (error) {
            showError(error);
        }
    };

    const handleOpenDeleteDialog = (kpi: KPI) => {
        setSelectedKPI(kpi);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedKPI) return;
        setDeleting(true);
        try {
            const res = await kpiApiService.deleteKPI(selectedKPI.id);
            if (res.deleted) {
                showSuccess('KPI deleted successfully!');
                setDeleteDialogOpen(false);
                setSelectedKPI(null);
                fetchKPIs();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            showError(error);
        } finally {
            setDeleting(false);
        }
    };

    const filteredKPIs = kpis.filter(k => {
        const categoryMatch = filterCategory === 'all' || k.category === filterCategory;
        const statusMatch = filterStatus === 'all' || k.status === filterStatus;
        return categoryMatch && statusMatch;
    });

    useEffect(() => {
        setPage(1);
    }, [filterCategory, filterStatus]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    return (
        <Box>
            <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                gap={2}
                mb={3}
            >
                <Box display='flex' flexWrap='wrap' gap={2} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <AppDropdown
                        label='Category'
                        showLabel={false}
                        options={[
                            { value: 'all', label: 'All Categories' },
                            ...categories.map(c => ({ value: c, label: c })),
                        ]}
                        value={filterCategory}
                        onChange={e => {
                            setFilterCategory(String(e.target.value || 'all'));
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

                <Box display='flex' gap={1} flexWrap='wrap' sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    <AppButton
                        variant='contained'
                        startIcon={<AddIcon />}
                        variantType='primary'
                        onClick={() => {
                            setEditingKPI(null);
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
                        }}
                    >
                        Create
                    </AppButton>
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
                                <TableCell><b>Title</b></TableCell>
                                <TableCell><b>Description</b></TableCell>
                                <TableCell align='center'><b>Weight</b></TableCell>
                                <TableCell><b>Category</b></TableCell>
                                <TableCell align='center'><b>Status</b></TableCell>
                                <TableCell align='center'><b>Actions</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredKPIs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align='center'>
                                        No KPIs found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredKPIs.map(kpi => (
                                    <TableRow key={kpi.id}>
                                        <TableCell>{kpi.title}</TableCell>
                                        <TableCell>{kpi.description}</TableCell>
                                        <TableCell align='center'>{kpi.weight}</TableCell>
                                        <TableCell>{kpi.category}</TableCell>
                                        <TableCell align='center'>
                                            <Typography
                                                sx={{
                                                    fontWeight: 500,
                                                    backgroundColor:
                                                        kpi.status.toLowerCase() === 'active' ? '#206d23ff' : '#9e9e9e',
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
                                                {kpi.status}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align='center'>
                                            <Box display='flex' justifyContent='center' gap={1}>
                                                <Tooltip title='Edit'>
                                                    <IconButton
                                                        color='primary'
                                                        size='small'
                                                        onClick={() => {
                                                            setEditingKPI(kpi);
                                                            setModalOpen(true);
                                                        }}
                                                    >
                                                        <Box
                                                            component='img'
                                                            src={Icons.edit}
                                                            alt='Edit'
                                                            sx={{
                                                                width: { xs: 16, sm: 20 },
                                                                height: { xs: 16, sm: 20 },
                                                                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
                                                            }}
                                                        />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title='Delete'>
                                                    <IconButton
                                                        color='error'
                                                        size='small'
                                                        onClick={() => handleOpenDeleteDialog(kpi)}
                                                    >
                                                        <Box
                                                            component='img'
                                                            src={Icons.delete}
                                                            alt='Delete'
                                                            sx={{
                                                                width: { xs: 16, sm: 20 },
                                                                height: { xs: 16, sm: 20 },
                                                                filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none'
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
                title='Delete KPI'
                message={`Are you sure you want to delete the KPI "${selectedKPI?.title || ''}"? This action cannot be undone.`}
                confirmText='Delete'
                cancelText='Cancel'
                onConfirm={handleConfirmDelete}
                onClose={() => setDeleteDialogOpen(false)}
                itemName={selectedKPI?.title}
                loading={deleting}
            />

            <KPIFormModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setEditingKPI(null);
                }}
                onSubmit={handleSaveKPI}
                kpi={editingKPI && {
                    ...editingKPI,
                    status: editingKPI.status.toLowerCase() as 'active' | 'inactive'
                }}
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

export default KPIOverview;

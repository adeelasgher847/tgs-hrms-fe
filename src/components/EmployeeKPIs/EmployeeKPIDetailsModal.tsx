import React, { useCallback, useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Box,
    Typography,
    IconButton,
    CircularProgress,
    Avatar,
    Divider,
    useTheme,
    DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { employeeKpiApiService, type EmployeeKPI, type TeamKPISummary } from '../../api/employeeKpiApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import KPIItemCard from '../KPIs/KPIItemCard';
import AppButton from '../common/AppButton';

interface EmployeeKPIDetailsModalProps {
    open: boolean;
    onClose: () => void;
    summary: TeamKPISummary | null;
    onUpdateKPI?: (kpiId: string) => void;
}

const EmployeeKPIDetailsModal: React.FC<EmployeeKPIDetailsModalProps> = ({ open, onClose, summary, onUpdateKPI }) => {
    const theme = useTheme();
    const [loading, setLoading] = useState(false);
    const [kpis, setKpis] = useState<EmployeeKPI[]>([]);
    const { showError } = useErrorHandler();

    const fetchKPIs = useCallback(async () => {
        if (!summary) return;
        setLoading(true);
        try {
            const data = await employeeKpiApiService.getEmployeeKPIs({
                employeeId: summary.employeeId,
                cycle: summary.cycle
            });
            setKpis(data);
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    }, [summary, showError]);

    useEffect(() => {
        if (open && summary) {
            fetchKPIs();
        }
    }, [open, summary, fetchKPIs]);

    if (!summary) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4,
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    '&::-webkit-scrollbar': {
                        display: 'none',
                    },
                }
            }}
        >
            <DialogTitle sx={{ m: 0, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44 }}>
                        {summary.employeeName.charAt(0)}
                    </Avatar>
                    <Box>
                        <Typography variant="h6" fontWeight="700" color={theme.palette.text.primary}>Performance Details</Typography>
                        <Typography variant="body2" color="text.secondary">{summary.employeeName} • {summary.cycle}</Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent sx={{
                p: 4,
                bgcolor: 'action.hover',
                scrollbarWidth: 'none', // Firefox
                msOverflowStyle: 'none', // IE/Edge
                '&::-webkit-scrollbar': {
                    display: 'none', // Chrome/Safari/Edge
                },
            }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" py={10}>
                        <CircularProgress />
                    </Box>
                ) : kpis.length === 0 ? (
                    <Box textAlign="center" py={10}>
                        <Typography color="text.secondary">No detailed KPIs found for this cycle.</Typography>
                    </Box>
                ) : (
                    <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={3}>
                        {kpis.map((kpi) => (
                            <KPIItemCard key={kpi.id} kpi={kpi} onUpdate={onUpdateKPI} />
                        ))}
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions sx={{ p: 2.5 }}>
                <AppButton
                    text="Close"
                    onClick={onClose}
                    variantType="secondary"
                />
            </DialogActions>
        </Dialog>
    );
};

export default EmployeeKPIDetailsModal;

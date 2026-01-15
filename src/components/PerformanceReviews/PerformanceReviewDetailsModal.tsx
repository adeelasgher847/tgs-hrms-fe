import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
    CircularProgress,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Paper,
} from '@mui/material';
import AppButton from '../common/AppButton';
import { performanceReviewApiService, type PerformanceReview } from '../../api/performanceReviewApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { isAdmin, isHRAdmin } from '../../utils/auth';

interface PerformanceReviewDetailsModalProps {
    open: boolean;
    onClose: () => void;
    reviewId: string | null;
    onApproveSuccess?: () => void;
}

const PerformanceReviewDetailsModal: React.FC<PerformanceReviewDetailsModalProps> = ({
    open,
    onClose,
    reviewId,
    onApproveSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [approving, setApproving] = useState(false);
    const [review, setReview] = useState<PerformanceReview | null>(null);
    const { showError } = useErrorHandler();

    useEffect(() => {
        if (open && reviewId) {
            fetchReviewDetails();
        } else {
            setReview(null);
        }
    }, [open, reviewId]);

    const fetchReviewDetails = async () => {
        if (!reviewId) return;
        setLoading(true);
        try {
            const data = await performanceReviewApiService.getPerformanceReviewById(reviewId);
            setReview(data);
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!reviewId) return;
        setApproving(true);
        try {
            await performanceReviewApiService.approvePerformanceReview(reviewId);
            if (onApproveSuccess) onApproveSuccess();
            onClose();
        } catch (error) {
            showError(error);
        } finally {
            setApproving(false);
        }
    };

    const canApprove = (isAdmin() || isHRAdmin()) && review?.status === 'under_review';

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight="700">
                        Performance Review Details
                    </Typography>
                    {review && (
                        <Chip
                            label={review.status.replace('_', ' ').toUpperCase()}
                            color={review.status === 'completed' ? 'success' : 'warning'}
                            sx={{ fontWeight: 600 }}
                        />
                    )}
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                ) : review ? (
                    <Box display="flex" flexDirection="column" gap={3}>
                        {/* Header Info */}
                        <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="600">CYCLE</Typography>
                                <Typography variant="body1" fontWeight="700">{review.cycle}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="600">DATE</Typography>
                                <Typography variant="body1" fontWeight="700">{new Date(review.createdAt).toLocaleDateString()}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="600">OVERALL SCORE</Typography>
                                <Typography variant="h4" fontWeight="800" color="primary.main">{review.overallScore.toFixed(2)}</Typography>
                            </Box>
                        </Box>

                        <Divider />

                        {/* Recommendation */}
                        <Box>
                            <Typography variant="subtitle2" fontWeight="700" gutterBottom>Manager Recommendation</Typography>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                                    "{review.recommendation}"
                                </Typography>
                            </Paper>
                        </Box>

                        {/* KPIs Table */}
                        {review.kpis && review.kpis.length > 0 && (
                            <Box>
                                <Typography variant="subtitle2" fontWeight="700" gutterBottom>KPI Breakdown</Typography>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700 }}>KPI</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Target</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="center">Achieved</TableCell>
                                            <TableCell sx={{ fontWeight: 700 }} align="right">Score</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {review.kpis.map((kpi) => (
                                            <TableRow key={kpi.id}>
                                                <TableCell>{kpi.kpi?.title || 'KPI'}</TableCell>
                                                <TableCell align="center">{kpi.targetValue}</TableCell>
                                                <TableCell align="center">{kpi.achievedValue}</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>{kpi.score.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </Box>
                ) : (
                    <Typography align="center">No review data found.</Typography>
                )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <AppButton text="Close" variant="outlined" onClick={onClose} />
                {canApprove && (
                    <AppButton
                        text="Approve & Finalize"
                        variant="contained"
                        variantType="primary"
                        onClick={handleApprove}
                        loading={approving}
                    />
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PerformanceReviewDetailsModal;

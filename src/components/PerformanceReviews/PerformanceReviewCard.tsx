import React from 'react';
import { Box, Typography, Paper, Chip, Divider, useTheme } from '@mui/material';
import { type PerformanceReview } from '../../api/performanceReviewApi';
import AppButton from '../common/AppButton';

interface PerformanceReviewCardProps {
    review: PerformanceReview;
    onView: (review: PerformanceReview) => void;
    onApprove?: (review: PerformanceReview) => void;
    canApprove?: boolean;
}

const PerformanceReviewCard: React.FC<PerformanceReviewCardProps> = ({
    review,
    onView,
    onApprove,
    canApprove
}) => {
    const theme = useTheme();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'under_review':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 4.5) return 'success.main';
        if (score >= 3.5) return 'primary.main';
        if (score >= 2.5) return 'warning.main';
        return 'error.main';
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 4,
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                    boxShadow: theme.shadows[4],
                },
            }}
        >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                    <Typography variant="h6" fontWeight="700">
                        {review.cycle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {new Date(review.createdAt).toLocaleDateString()}
                    </Typography>
                </Box>
                <Chip
                    label={review.status.replace('_', ' ').toUpperCase()}
                    color={getStatusColor(review.status) as any}
                    size="small"
                    sx={{ fontWeight: 600 }}
                />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="600" display="block">
                        OVERALL SCORE
                    </Typography>
                    <Typography variant="h4" fontWeight="800" color={getScoreColor(review.overallScore)}>
                        {review.overallScore.toFixed(1)}
                    </Typography>
                </Box>
                <Box textAlign="right">
                    <Typography variant="caption" color="text.secondary" fontWeight="600" display="block">
                        EMPLOYEE
                    </Typography>
                    <Typography variant="body1" fontWeight="600">
                        {(review as any).employeeName || (review.employee?.user
                            ? `${review.employee.user.first_name} ${review.employee.user.last_name}`
                            : (review.employee as any)?.name) || review.employee_id}
                    </Typography>
                </Box>
            </Box>

            <Typography variant="body2" sx={{
                mb: 3,
                fontStyle: 'italic',
                color: 'text.secondary',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                minHeight: '3em'
            }}>
                "{review.recommendation}"
            </Typography>

            <Box display="flex" gap={1}>
                <AppButton
                    text="View Details"
                    variant="outlined"
                    fullWidth
                    onClick={() => onView(review)}
                />
                {canApprove && review.status === 'under_review' && onApprove && (
                    <AppButton
                        text="Approve"
                        variant="contained"
                        variantType="primary"
                        fullWidth
                        onClick={() => onApprove(review)}
                    />
                )}
            </Box>
        </Paper>
    );
};

export default PerformanceReviewCard;

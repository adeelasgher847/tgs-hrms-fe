import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { performanceReviewApiService, type PerformanceReview } from '../../api/performanceReviewApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppDropdown from '../common/AppDropdown';
import PerformanceReviewCard from './PerformanceReviewCard';
import PerformanceReviewDetailsModal from './PerformanceReviewDetailsModal';
import AppCard from '../common/AppCard';
import AppSearch from '../common/AppSearch';

const MyPerformanceReviews: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [cycle, setCycle] = useState('All Time');
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);

    const { showError } = useErrorHandler();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (cycle !== 'All Time') {
                params.cycle = cycle;
            }
            const data = await performanceReviewApiService.getPerformanceReviews(params);
            setReviews(data.items || []);
        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    }, [cycle, showError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleViewDetails = (review: PerformanceReview) => {
        setSelectedReviewId(review.id);
        setDetailsModalOpen(true);
    };

    const [searchQuery, setSearchQuery] = useState('');

    const filteredReviews = reviews.filter(
        r =>
            r.cycle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.recommendation.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const cycles = ['All Time', 'Q4-2025', 'Q3-2025', 'Q2-2025', 'Q1-2025'];

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h6" fontWeight="600">My Review History</Typography>
            </Box>

            <AppCard sx={{ mb: 3, p: 2 }}>
                <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                    <Box flexGrow={1} minWidth={{ xs: '100%', sm: 300 }}>
                        <AppSearch
                            placeholder="Search reviews..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                        />
                    </Box>
                    <Box width={{ xs: '100%', sm: 200 }}>
                        <AppDropdown
                            label="Cycle"
                            showLabel={false}
                            options={cycles.map(c => ({ value: c, label: c }))}
                            value={cycle}
                            onChange={e => setCycle(String(e.target.value))}
                        />
                    </Box>
                </Box>
            </AppCard>

            {loading ? (
                <Box display="flex" justifyContent="center" p={10}>
                    <CircularProgress />
                </Box>
            ) : (
                <Box
                    display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: '1fr 1fr',
                    }}
                    gap={3}
                >
                    {filteredReviews.length === 0 ? (
                        <Box gridColumn="1 / -1">
                            <Box py={10} textAlign="center" bgcolor="action.hover" borderRadius={4}>
                                <Typography color="text.secondary">You don't have any performance reviews yet.</Typography>
                            </Box>
                        </Box>
                    ) : (
                        filteredReviews.map(review => (
                            <PerformanceReviewCard
                                key={review.id}
                                review={review}
                                onView={handleViewDetails}
                            />
                        ))
                    )}
                </Box>
            )}

            <PerformanceReviewDetailsModal
                open={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                reviewId={selectedReviewId}
            />
        </Box>
    );
};

export default MyPerformanceReviews;

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { employeeKpiApiService, type EmployeeKPI, type KPISummary } from '../../api/employeeKpiApi';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import AppDropdown from '../common/AppDropdown';
import KPIScoreCard from '../KPIs/KPIScoreCard';
import KPIItemCard from '../KPIs/KPIItemCard';

const MyKPIs: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [myKpis, setMyKpis] = useState<EmployeeKPI[]>([]);
    const [summary, setSummary] = useState<KPISummary | null>(null);
    const [cycle, setCycle] = useState('All Time');

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const employeeId = user.employeeId || user.id;

    const { showError } = useErrorHandler();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params: { employeeId?: string; cycle?: string } = {
                employeeId: employeeId,
            };

            if (cycle !== 'All Time') {
                params.cycle = cycle;
            }

            // Parallel fetch
            const [kpiData, summaryData] = await Promise.all([
                employeeKpiApiService.getEmployeeKPIs(params),
                employeeKpiApiService.getKPISummary({ ...params, cycle: cycle === 'All Time' ? '' : cycle, employeeId: params.employeeId! })
            ]);

            setMyKpis(kpiData);
            setSummary(summaryData);

        } catch (error) {
            showError(error);
        } finally {
            setLoading(false);
        }
    }, [cycle, employeeId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const cycles = ['All Time', 'Q1-2025', 'Q2-2025', 'Q3-2025', 'Q4-2025'];

    if (loading) {
        return (
            <Box display='flex' justifyContent='center' p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={4} flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                <Box>
                    <Typography variant='h4' fontWeight={700} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>My Performance</Typography>
                    <Typography variant='body1' color='textSecondary'>Track your goals and achievements</Typography>
                </Box>
                <Box width={{ xs: '100%', sm: 200 }}>
                    <AppDropdown
                        label='Review Cycle'
                        showLabel={false}
                        options={cycles.map(c => ({ value: c, label: c }))}
                        value={cycle}
                        onChange={e => setCycle(String(e.target.value || 'All Time'))}
                    />
                </Box>
            </Box>

            <Box mb={4} maxWidth={{ xs: '100%', sm: 400 }}>
                <KPIScoreCard
                    score={summary?.totalScore || 0}
                    totalKPIs={summary?.recordCount || 0}
                    cycle={cycle}
                />
            </Box>

            <Typography variant='h6' fontWeight={600} mb={2}>Key Performance Indicators</Typography>

            {myKpis.length === 0 ? (
                <Typography variant='body1' color='textSecondary' align='center' py={4} bgcolor='action.hover' borderRadius={2}>
                    No KPIs assigned for this cycle.
                </Typography>
            ) : (
                <Box display="grid" gridTemplateColumns={{
                    xs: '1fr',
                    sm: 'repeat(auto-fill, minmax(320px, 1fr))',
                    md: 'repeat(auto-fill, minmax(350px, 1fr))'
                }} gap={3}>
                    {myKpis.map(kpi => (
                        <KPIItemCard key={kpi.id} kpi={kpi} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default MyKPIs;

import React from 'react';
import { Box, Typography, Avatar, Button, Divider, Paper, useTheme } from '@mui/material';
import type { TeamKPISummary } from '../../api/employeeKpiApi';
import { Icons } from '../../assets/icons';

interface TeamKPISummaryCardProps {
    summary: TeamKPISummary;
    onAssignKPI?: () => void;
    onViewDetails: () => void;
    viewLabel?: string;
    viewIcon?: string;
    hideAssignKpi?: boolean;
}

const TeamKPISummaryCard: React.FC<TeamKPISummaryCardProps> = ({
    summary,
    onAssignKPI,
    onViewDetails,
    viewLabel = 'View',
    viewIcon = Icons.password,
    hideAssignKpi = false
}) => {
    const theme = useTheme();

    const getScoreColor = (s: number) => {
        if (s >= 4.5) return 'success.main';
        if (s >= 3.5) return 'primary.main';
        if (s >= 2.5) return 'warning.main';
        return 'error.main';
    };

    return (
        <Paper
            variant="outlined"
            sx={{
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                transition: 'transform 0.2s, box-shadow 0.2s',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                bgcolor: 'background.paper'
            }}
        >
            <Box p={{ xs: 2.5, sm: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Avatar
                        src={''}
                        sx={{
                            bgcolor: 'primary.main',
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                            fontSize: { xs: '1.2rem', sm: '1.5rem' },
                        }}
                    >
                        {summary.employeeName.charAt(0)}
                    </Avatar>
                    <Box overflow="hidden">
                        <Typography variant="h6" fontWeight="700" color="text.primary" noWrap title={summary.employeeName} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {summary.employeeName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap title={summary.employeeEmail}>
                            {summary.employeeEmail}
                        </Typography>
                    </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'action.hover', p: 2, borderRadius: 3, mb: 3 }}>
                    <Box textAlign="center" flex={1}>
                        <Typography variant="h4" fontWeight="800" color={getScoreColor(summary.totalScore)} lineHeight={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                            {summary.totalScore.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" letterSpacing={0.5}>AVG SCORE</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem sx={{ mx: { xs: 1, sm: 2 } }} />
                    <Box textAlign="center" flex={1}>
                        <Typography variant="h4" fontWeight="800" color="text.primary" lineHeight={1} sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
                            {summary.recordCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight="600" letterSpacing={0.5}>KPIs</Typography>
                    </Box>
                </Box>

                <Box display="flex" gap={1.5} flexDirection={{ xs: 'column', sm: 'row' }}>
                    {!hideAssignKpi && onAssignKPI && (
                        <Button
                            variant="outlined"
                            color="primary"
                            fullWidth
                            size="medium"
                            startIcon={<Box sx={{
                                width: 18,
                                height: 18,
                                bgcolor: 'currentColor',
                                maskImage: `url(${Icons.add})`,
                                maskSize: 'contain',
                                maskRepeat: 'no-repeat',
                                maskPosition: 'center'
                            }} />}
                            onClick={onAssignKPI}
                            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        >
                            Assign KPI
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="inherit"
                        fullWidth
                        size="medium"
                        startIcon={<Box sx={{
                            width: 18,
                            height: 18,
                            bgcolor: 'currentColor',
                            maskImage: `url(${viewIcon})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center'
                        }} />}
                        onClick={onViewDetails}
                        sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: 'action.selected',
                            color: 'text.primary',
                            boxShadow: 'none',
                            '&:hover': {
                                bgcolor: 'action.focus'
                            }
                        }}
                    >
                        {viewLabel}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};

export default TeamKPISummaryCard;

import React from 'react';
import { Box, Typography, Card, CardContent, useTheme } from '@mui/material';

interface KPIScoreCardProps {
    score: number;
    totalKPIs: number;
    cycle: string;
}

const KPIScoreCard: React.FC<KPIScoreCardProps> = ({ score, totalKPIs, cycle }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';

    // Determine color based on score
    const getColor = (s: number) => {
        if (isDarkMode) {
            if (s >= 4.5) return '#69f0ae'; // Exceptional (Green)
            if (s >= 3.5) return '#448aff'; // Good (Blue)
            if (s >= 2.5) return '#ffd740'; // Average (Amber)
            return '#ff5252'; // Needs Improvement (Red)
        }
        if (s >= 4.5) return '#00C853'; // Exceptional (Green)
        if (s >= 3.5) return '#2962FF'; // Good (Blue)
        if (s >= 2.5) return '#FFAB00'; // Average (Amber)
        return '#D50000'; // Needs Improvement (Red)
    };

    const color = getColor(score);

    return (
        <Card
            sx={{
                background: isDarkMode
                    ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
                    : 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
                borderRadius: '16px',
                boxShadow: isDarkMode
                    ? '0 4px 20px rgba(0,0,0,0.4)'
                    : '0 4px 20px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    bgcolor: color
                }}
            />
            <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" color="textSecondary" fontWeight="bold" letterSpacing={1.2}>
                    {cycle} Performance
                </Typography>

                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <Box>
                        <Typography variant="h3" fontWeight="800" sx={{ color: color }}>
                            {score.toFixed(1)}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" fontWeight="500">
                            Overall Score
                        </Typography>
                    </Box>

                    <Box textAlign="right">
                        <Typography variant="h4" fontWeight="700" color="textPrimary">
                            {totalKPIs}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" fontWeight="500">
                            Total KPIs
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default KPIScoreCard;

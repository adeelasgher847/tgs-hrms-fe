import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';

import EmployeesInfoChart from './DashboardContent/EmployeesInfoChart';
import AvailabilityCardsGrid from './DashboardContent/AvailabilityCard/AvailabilityCardsGrid';
import GenderPercentageChart from './DashboardContent/GenderPercentageChart';

import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';

const labels = {
  en: {
    title: 'Dashboard',
    upcoming: 'Upcoming Interviews',
    topPerformers: 'Top Performers',
  },
  ar: {
    title: 'لوحة تحكم الموارد البشرية',
    upcoming: 'المقابلات القادمة',
    topPerformers: 'أفضل المؤدين',
  },
};

const Dashboard: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage(); // 👈 use the context
  const lang = labels[language]; // 👈 get the labels
  const theme = useTheme();
  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: theme.palette.text.primary,
      }}
    >
      <Typography
        variant='h4'
        mb={2}
        sx={{
          direction: language === 'ar' ? 'rtl' : 'ltr',
          color: darkMode ? '#8f8f8f' : '#000',
        }}
      >
        {lang.title}
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <EmployeesInfoChart />
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <Box flex={1}>
              <AvailabilityCardsGrid />
            </Box>
            <Box flex={1}>
              <GenderPercentageChart />
            </Box>
          </Box>

          {/* <PerformanceChart /> */}
        </Box>

        {/* <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <IconImageCardProps />
          <ApplicationStats />
          <UpcomingInterviews />
        </Box> */}
      </Box>

      {/* <Box mt={2}>
        <TopPerformersProps />
      </Box> */}
    </Box>
  );
};

export default Dashboard;

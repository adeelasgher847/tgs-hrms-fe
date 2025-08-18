import React from 'react';
import { Box, Typography } from '@mui/material';

import EmployeesInfoChart from './DashboardContent/EmployeesInfoChart';
import AvailabilityCardsGrid from './DashboardContent/AvailabilityCard/AvailabilityCardsGrid';
import TotalEmployeesDonut from './DashboardContent/TotalEmployeesDonut';
import UpcomingInterviews from './DashboardContent/ComingInterview/UpcomingInterviews';
import PerformanceChart from './DashboardContent/PerformanceChart';
import TopPerformersProps from './DashboardContent/TopPerformance/TopPerformersProps';
import IconImageCardProps from './DashboardContent/TotalApplication/IconImageCardProps';
import ApplicationStats from './DashboardContent/ApplicationStats/ApplicationStats';
import { useOutletContext } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext'; // 👈 import your context

const labels = {
  en: {
    title: 'Dashboard',
    upcoming: 'Upcoming Interviews',
    topPerformers: 'Top Performers',
  },
  ar: {
    title: 'لوحة التحكم',
    upcoming: 'المقابلات القادمة',
    topPerformers: 'أفضل المؤدين',
  },
};

const Dashboard: React.FC = () => {
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  const { language } = useLanguage(); // 👈 use the context
  const lang = labels[language]; // 👈 get the labels

  return (
    <Box
      sx={{
        minHeight: '100vh',
        color: darkMode ? '#fff' : '#000',
      }}
    >
      <Typography
        variant='h4'
        mb={2}
        sx={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
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
              <TotalEmployeesDonut />
            </Box>
          </Box>

          <PerformanceChart />
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <IconImageCardProps />
          <ApplicationStats />
          <UpcomingInterviews />
        </Box>
      </Box>

      <Box mt={2}>
        <TopPerformersProps />
      </Box>
    </Box>
  );
};

export default Dashboard;

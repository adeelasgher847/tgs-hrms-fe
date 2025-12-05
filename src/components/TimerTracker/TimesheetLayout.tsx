import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { useLanguage } from '../../hooks/useLanguage';
import { useOutletContext } from 'react-router-dom';
import SheetList from './SheetList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const TimesheetLayout: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();

  const { language } = useLanguage();

  const timesheetLabels = {
    en: { pageTitle: 'My Timesheet' },
    ar: { pageTitle: 'سجل الوقت الخاص بي' },
  } as const;

  return (
    <Box>
      {/* Back Arrow */}
      <IconButton
        sx={{ p: 0, mb: 2 }}
        onClick={() => navigate('/dashboard/AttendanceCheck')}
      >
        <ArrowBackIcon />
      </IconButton>
      <Box display='flex' flexDirection='column' gap={2}>
        <Box
          display='flex'
          justifyContent={language === 'ar' ? 'flex-end' : 'flex-start'}
          alignItems='center'
        >
          <Typography
            variant='h5'
            component='h1'
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            sx={{
              color: darkMode ? '#8f8f8f' : '#000',
              textAlign: language === 'ar' ? 'right' : 'left',
            }}
          >
            {timesheetLabels[language].pageTitle}
          </Typography>
        </Box>
        <Paper
          sx={{
            flex: 1,
            width: '100%',
            overflow: 'auto',
            boxShadow: 'none',
            borderRadius: 0,
            bgcolor: 'unset',
          }}
          dir='ltr'
        >
          <SheetList />
        </Paper>
      </Box>
    </Box>
  );
};

export default TimesheetLayout;

import React from 'react';
import { Box, Paper, Typography, IconButton, useTheme } from '@mui/material';
import { useOutletContext } from 'react-router-dom';
import SheetList from './SheetList';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';

const TimesheetLayout: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { darkMode } = useOutletContext<{ darkMode: boolean }>();
  
  return (
    <Box>
            {/* Back Arrow */}
      <IconButton sx={{p:0, mb:2}} onClick={() => navigate('/dashboard/AttendanceCheck')}>
        <ArrowBackIcon />
      </IconButton>
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5" component="h1" sx={{ color: darkMode ? '#8f8f8f' : '#000' }}>
          My Timesheet
        </Typography>
      </Box>
      <Paper sx={{ flex: 1, width: '100%', overflow: 'auto', boxShadow: 'none',borderRadius:0 }}>
        <SheetList />
      </Paper>
    </Box>

    </Box>
  );
};

export default TimesheetLayout;
